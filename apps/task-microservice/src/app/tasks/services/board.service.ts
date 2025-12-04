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
import { Repository } from 'typeorm';
import { TaskStatus, SprintStatus } from '@shared/contracts';

@Injectable()
export class BoardService {
  constructor(
    private readonly repo: BoardRepository,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(Task) private readonly taskRepo: Repository<Task>,
    @InjectRepository(Sprint) private readonly sprintRepo: Repository<Sprint>,
    @InjectRepository(TaskHistory)
    private readonly historyRepo: Repository<TaskHistory>
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
    const updated = await this.repo.updateColumn(dto.id, {
      order_index: dto.order_index,
      wip_limit: dto.wip_limit,
    });
    if (!updated) throw new NotFoundException('Column not found');
    return updated;
  }

  async deleteColumn(id: string) {
    await this.repo.deleteColumn(id);
    return { id };
  }

  async moveTask(task_id: string, board_id: string, status: TaskStatus) {
    const task = await this.taskRepo.findOne({ where: { id: task_id } });
    if (!task) throw new NotFoundException('Task not found');

    if (task.sprint_id) {
      const sprint = await this.sprintRepo.findOne({
        where: { id: task.sprint_id },
      });
      if (sprint && sprint.status === SprintStatus.CLOSED) {
        const prevSprintId = task.sprint_id;
        task.sprint_id = null;
        task.sprint_order_index = null;
        await this.historyRepo.save(
          this.historyRepo.create({
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
    }
    const board = await this.repo.findBoardById(board_id);
    if (!board) throw new NotFoundException('Board not found');
    if (board.project_id !== task.project_id) {
      throw new BadRequestException('Board belongs to a different project');
    }
    const col = await this.repo.findColumn(board_id, status);
    if (!col) throw new BadRequestException('Status not allowed in this board');

    task.status = status;
    const saved = await this.taskRepo.save(task);
    return saved;
  }

  private toResponse(board: any): BoardResponseDto {
    return {
      id: board.id,
      project_id: board.project_id,
      name: board.name,
      is_default: board.is_default,
      columns: (board.columns ?? []).map((c: any) => ({
        id: c.id,
        status: c.status,
        order_index: c.order_index,
        wip_limit: c.wip_limit,
      })),
    };
  }
}
