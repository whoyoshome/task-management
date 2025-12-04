import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Task } from '../entities';
import { TaskFilterDto } from '@shared/contracts';
import { LabelRepository } from './label.repository';

@Injectable()
export class TaskRepository {
  constructor(
    @InjectRepository(Task)
    private readonly repo: Repository<Task>,
    private readonly labelRepo: LabelRepository
  ) {}

  async create(data: Partial<Task>): Promise<Task> {
    const task = this.repo.create(data);
    return this.repo.save(task);
  }

  async findAll(): Promise<Task[]> {
    return this.repo.find();
  }

  async findById(id: string): Promise<Task | null> {
    return this.repo.findOne({ where: { id } });
  }

  async update(task: Task): Promise<Task> {
    return this.repo.save(task);
  }

  async delete(task: Task): Promise<void> {
    await this.repo.remove(task);
  }

  async findByIdWithRelations(id: string): Promise<Task | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['project', 'comments'],
    });
  }

  async findFiltered(
    dto: TaskFilterDto
  ): Promise<{ items: Task[]; total: number }> {
    const qb = this.repo.createQueryBuilder('t');
    qb.where('t.project_id = :project_id', { project_id: dto.project_id });

    if (dto.q) {
      qb.andWhere(
        new Brackets((q) => {
          q.where('LOWER(t.title) LIKE :q', {
            q: `%${dto.q.toLowerCase()}%`,
          }).orWhere('LOWER(t.description) LIKE :q', {
            q: `%${dto.q.toLowerCase()}%`,
          });
        })
      );
    }

    if (dto.statuses?.length) {
      qb.andWhere('t.status IN (:...statuses)', { statuses: dto.statuses });
    }
    if (dto.priorities?.length) {
      qb.andWhere('t.priority IN (:...priorities)', {
        priorities: dto.priorities,
      });
    }
    if (dto.assignee_ids?.length) {
      qb.andWhere('t.assigned_to IN (:...assignee_ids)', {
        assignee_ids: dto.assignee_ids,
      });
    }
    if (dto.created_by_ids?.length) {
      qb.andWhere('t.created_by IN (:...created_by_ids)', {
        created_by_ids: dto.created_by_ids,
      });
    }
    if (dto.sprint_id) {
      qb.andWhere('t.sprint_id = :sprint_id', { sprint_id: dto.sprint_id });
    }
    if (dto.backlog_only) {
      qb.andWhere('t.sprint_id IS NULL');
    }

    if (dto.label_ids?.length) {
      const taskIds = await this.labelRepo.findTasksWithAllLabels(
        dto.project_id,
        dto.label_ids
      );
      if (!taskIds.length) {
        return { items: [], total: 0 };
      }
      qb.andWhere('t.id IN (:...taskIds)', { taskIds });
    }

    const sortBy = dto.sort_by ?? 'created_at';
    const sortDir: 'ASC' | 'DESC' = (
      dto.sort_dir ?? 'desc'
    ).toUpperCase() as any;
    qb.orderBy(`t.${sortBy}`, sortDir);

    const limit = dto.limit ?? 20;
    const offset = dto.offset ?? 0;
    qb.take(limit).skip(offset);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }
}
