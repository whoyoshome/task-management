import { Injectable, NotFoundException } from '@nestjs/common';
import { TaskRepository } from '../repositories/task.repository';
import {
  CreateTaskDto,
  ProjectRole,
  TaskFilterDto,
  UpdateTaskDto,
} from '@shared/contracts';
import { Task } from '../entities';
import { ProjectMembersRepository } from '../repositories/project-members.repository';

@Injectable()
export class TaskService {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly projectMembersRepository: ProjectMembersRepository
  ) {}

  async create(dto: CreateTaskDto): Promise<Task> {
    const data: Partial<Task> = {
      ...dto,
      due_date: dto.due_date ? new Date(dto.due_date) : null,
    } as any;

    const task = await this.taskRepository.create(data);

    try {
      const existingMember =
        await this.projectMembersRepository.findByProjectAndUser(
          dto.project_id,
          dto.assigned_to
        );

      if (!existingMember) {
        await this.projectMembersRepository.create({
          project_id: dto.project_id,
          user_id: dto.assigned_to,
          role: ProjectRole.MEMBER,
        });
      }
    } catch (error: any) {
      console.error(
        `Failed to add user ${dto.assigned_to} to project ${dto.project_id}:`,
        error.message
      );
    }

    return task;
  }

  async findAll(): Promise<Task[]> {
    return this.taskRepository.findAll();
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

  async update(id: string, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id);
    Object.assign(task, dto);
    return this.taskRepository.update(task);
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
