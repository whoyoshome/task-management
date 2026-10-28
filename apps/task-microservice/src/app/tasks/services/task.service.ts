import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { TaskRepository } from '../repositories/task.repository';
import {
  CreateTaskDto,
  MyTasksQueryDto,
  TaskFilterDto,
  UpdateTaskDto,
} from '@shared/contracts';
import { Project, Task, TaskHistory } from '../entities';
import { ProjectMembersRepository } from '../repositories/project-members.repository';
import { changeMetadata, describeChange, diffTask } from './task-changes';

@Injectable()
export class TaskService {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly projectMembersRepository: ProjectMembersRepository,
    private readonly dataSource: DataSource
  ) {}

  /**
   * Only project members can be assigned. Membership is granted explicitly
   * by a project admin, never as a side effect of assigning a task.
   */
  private async assertAssigneeIsMember(projectId: string, userId: string) {
    const member = await this.projectMembersRepository.findByProjectAndUser(
      projectId,
      userId
    );
    if (!member) {
      throw new BadRequestException(
        'The assignee must be a member of the project'
      );
    }
  }

  /**
   * The next task number of a project (WEB-1, WEB-2...). Locking the project
   * row makes concurrent creations in the same project take turns, so they
   * never get the same number; other projects are not blocked.
   */
  private async nextTaskNumber(
    manager: EntityManager,
    projectId: string
  ): Promise<number> {
    await manager
      .createQueryBuilder(Project, 'p')
      .setLock('pessimistic_write')
      .where('p.id = :projectId', { projectId })
      .getOne();
    const last = await manager
      .createQueryBuilder(Task, 't')
      .select('MAX(t.number)', 'max')
      .where('t.project_id = :projectId', { projectId })
      .getRawOne<{ max: number | null }>();
    return Number(last?.max ?? 0) + 1;
  }

  async create(dto: CreateTaskDto): Promise<Task> {
    await this.assertAssigneeIsMember(dto.project_id, dto.assigned_to);

    return this.dataSource.transaction(async (manager) => {
      const task = await manager.save(
        manager.create(Task, {
          ...dto,
          number: await this.nextTaskNumber(manager, dto.project_id),
          due_date: dto.due_date ? new Date(dto.due_date) : null,
        })
      );
      await manager.save(
        manager.create(TaskHistory, {
          task_id: task.id,
          type: 'user',
          actor_id: dto.created_by ?? null,
          message: 'Created the task',
          metadata: null,
        })
      );
      return task;
    });
  }

  async findAll(): Promise<Task[]> {
    return this.taskRepository.findAll();
  }

  async findForUser(userId: string, query: MyTasksQueryDto) {
    const { items, total } = await this.taskRepository.findForUser(
      userId,
      query
    );
    return {
      items,
      total,
      limit: query.limit ?? 50,
      offset: query.offset ?? 0,
    };
  }

  countByProject(userId: string, allProjects: boolean) {
    return this.taskRepository.countByProject(userId, allProjects);
  }

  async findFiltered(dto: TaskFilterDto) {
    const { items, total } = await this.taskRepository.findFiltered(dto);
    return { items, total, limit: dto.limit ?? 20, offset: dto.offset ?? 0 };
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskRepository.findById(id);
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  /**
   * Applies the update and records one history entry per changed field,
   * with who made it, atomically.
   */
  async update(
    id: string,
    dto: UpdateTaskDto,
    actorId: string | null = null
  ): Promise<Task> {
    const task = await this.findOne(id);

    if (dto.project_id && dto.project_id !== task.project_id) {
      throw new BadRequestException(
        'A task cannot be moved to another project'
      );
    }
    if (dto.assigned_to && dto.assigned_to !== task.assigned_to) {
      await this.assertAssigneeIsMember(task.project_id, dto.assigned_to);
    }

    const changes = diffTask(task, dto);
    Object.assign(task, dto);

    return this.dataSource.transaction(async (manager) => {
      const saved = await manager.save(task);
      if (changes.length) {
        await manager.save(
          changes.map((change) =>
            manager.create(TaskHistory, {
              task_id: task.id,
              type: 'user',
              actor_id: actorId,
              message: describeChange(change),
              metadata: changeMetadata(change),
            })
          )
        );
      }
      return saved;
    });
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);
    await this.taskRepository.delete(task);
  }

  async findOneWithDetails(id: string): Promise<Task> {
    const task = await this.taskRepository.findByIdWithRelations(id);
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }
}
