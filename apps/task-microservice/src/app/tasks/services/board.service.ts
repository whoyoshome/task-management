import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { BoardRepository } from '../repositories/board.repository';
import {
  CreateBoardDto,
  CreateBoardColumnDto,
  UpdateBoardColumnDto,
  BoardResponseDto,
} from '@shared/contracts';
import { Project, Task, Sprint, TaskHistory } from '../entities';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TaskStatus, SprintStatus } from '@shared/contracts';
import { changeMetadata, describeChange, diffTask } from './task-changes';

@Injectable()
export class BoardService {
  constructor(
    private readonly repo: BoardRepository,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(Task) private readonly taskRepo: Repository<Task>,
    @InjectRepository(Sprint) private readonly sprintRepo: Repository<Sprint>,
    private readonly dataSource: DataSource
  ) {}

  async createBoard(dto: CreateBoardDto): Promise<BoardResponseDto> {
    const project = await this.projectRepo.findOne({
      where: { id: dto.project_id },
    });
    if (!project) throw new NotFoundException('Project not found');
    const board = await this.repo.createBoard({
      project_id: dto.project_id,
      name: dto.name,
      is_default: dto.is_default ?? false,
    });
    await this.repo.createDefaultColumns(board.id);
    const withCols = await this.repo.findBoardWithColumns(board.id);
    return this.toResponse(withCols!);
  }

  async getBoardWithColumns(id: string): Promise<BoardResponseDto> {
    const board = await this.repo.findBoardWithColumns(id);
    if (!board) throw new NotFoundException('Board not found');
    return this.toResponse(board);
  }

  async getOrCreateDefaultBoardForProject(
    project_id: string
  ): Promise<BoardResponseDto> {
    const project = await this.projectRepo.findOne({
      where: { id: project_id },
    });
    if (!project) throw new NotFoundException('Project not found');
    let board = await this.repo.findDefaultBoardByProject(project_id);
    if (!board) {
      board = await this.repo.createBoard({
        project_id,
        name: 'Default Board',
        is_default: true,
      });
      await this.repo.createDefaultColumns(board.id);
    }
    const withCols = await this.repo.findBoardWithColumns(board.id);
    return this.toResponse(withCols!);
  }

  async createColumn(dto: CreateBoardColumnDto) {
    const board = await this.repo.findBoardById(dto.board_id);
    if (!board) throw new NotFoundException('Board not found');
    const existing = await this.repo.findColumn(dto.board_id, dto.status);
    if (existing)
      throw new BadRequestException('Status already exists in board');
    const created = await this.repo.createColumn({
      board_id: dto.board_id,
      status: dto.status,
      order_index: dto.order_index ?? 0,
      wip_limit: dto.wip_limit ?? null,
    });
    return created;
  }

  async updateColumn(dto: UpdateBoardColumnDto) {
    if (!dto.id) throw new BadRequestException('Column id is required');

    // Only send the fields present in the request; wip_limit may be null to
    // remove the limit.
    const patch: { order_index?: number; wip_limit?: number | null } = {};
    if (dto.order_index !== undefined) patch.order_index = dto.order_index;
    if (dto.wip_limit !== undefined) patch.wip_limit = dto.wip_limit;

    const updated = Object.keys(patch).length
      ? await this.repo.updateColumn(dto.id, patch)
      : await this.repo.findColumnById(dto.id);
    if (!updated) throw new NotFoundException('Column not found');
    return updated;
  }

  async deleteColumn(id: string) {
    await this.repo.deleteColumn(id);
    return { id };
  }

  /**
   * Validates the move before writing anything, then saves the task and its
   * history entries (status change, leaving a closed sprint) in one
   * transaction. WIP limits are not enforced here: like Jira, a column over
   * its limit is reported on the board, not blocked.
   */
  async moveTask(
    task_id: string,
    board_id: string,
    status: TaskStatus,
    actorId: string | null = null
  ) {
    const task = await this.taskRepo.findOne({ where: { id: task_id } });
    if (!task) throw new NotFoundException('Task not found');

    const board = await this.repo.findBoardById(board_id);
    if (!board) throw new NotFoundException('Board not found');
    if (board.project_id !== task.project_id) {
      throw new BadRequestException('Board belongs to a different project');
    }
    const col = await this.repo.findColumn(board_id, status);
    if (!col) throw new BadRequestException('Status not allowed in this board');

    const sprint = task.sprint_id
      ? await this.sprintRepo.findOne({ where: { id: task.sprint_id } })
      : null;
    const leavesClosedSprint = sprint?.status === SprintStatus.CLOSED;
    const prevSprintId = task.sprint_id;
    const statusChange = diffTask(task, { status });

    task.status = status;
    if (leavesClosedSprint) {
      task.sprint_id = null;
      task.sprint_order_index = null;
    }

    return this.dataSource.transaction(async (manager) => {
      if (leavesClosedSprint) {
        await manager.save(
          manager.create(TaskHistory, {
            task_id: task.id,
            type: 'system',
            message: `Removed from closed sprint ${prevSprintId} during move`,
            metadata: {
              prev_sprint_id: prevSprintId,
              target_status: status,
              reason: 'sprint_closed_detach_on_move',
            },
          })
        );
      }
      for (const change of statusChange) {
        await manager.save(
          manager.create(TaskHistory, {
            task_id: task.id,
            type: 'user',
            actor_id: actorId,
            message: describeChange(change),
            metadata: changeMetadata(change),
          })
        );
      }
      return manager.save(task);
    });
  }

  /**
   * Board with, per column, how many tasks of the project have that status,
   * so clients can flag columns over their WIP limit.
   */
  private async toResponse(board: any): Promise<BoardResponseDto> {
    const rows = await this.taskRepo
      .createQueryBuilder('t')
      .select('t.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('t.project_id = :projectId', { projectId: board.project_id })
      .groupBy('t.status')
      .getRawMany<{ status: string; count: string }>();
    const counts = new Map(rows.map((r) => [r.status, Number(r.count)]));

    return {
      id: board.id,
      project_id: board.project_id,
      name: board.name,
      is_default: board.is_default,
      columns: (board.columns ?? []).map((c: any) => {
        const taskCount = counts.get(c.status) ?? 0;
        return {
          id: c.id,
          status: c.status,
          order_index: c.order_index,
          wip_limit: c.wip_limit,
          task_count: taskCount,
          over_wip_limit: c.wip_limit != null && taskCount > c.wip_limit,
        };
      }),
    };
  }
}
