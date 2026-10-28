import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { ProjectMembers, Task } from '../entities';
import {
  MyTasksQueryDto,
  ProjectTaskCountDto,
  TaskFilterDto,
} from '@shared/contracts';
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

  /** Tasks assigned to a user across all projects, soonest due first. */
  async findAssignedTo(
    userId: string,
    query: MyTasksQueryDto
  ): Promise<{ items: Task[]; total: number }> {
    const qb = this.repo
      .createQueryBuilder('t')
      .where('t.assigned_to = :userId', { userId });

    if (query.statuses?.length) {
      qb.andWhere('t.status IN (:...statuses)', { statuses: query.statuses });
    }

    qb.orderBy('t.due_date', 'ASC', 'NULLS LAST')
      .addOrderBy('t.created_at', 'DESC')
      .take(query.limit ?? 50)
      .skip(query.offset ?? 0);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  /**
   * Task totals per project in one query. Limited to the projects the user
   * belongs to unless `allProjects` is set (global admins).
   */
  async countByProject(
    userId: string,
    allProjects: boolean
  ): Promise<ProjectTaskCountDto[]> {
    const qb = this.repo
      .createQueryBuilder('t')
      .select('t.project_id', 'project_id')
      .addSelect('COUNT(*)', 'total')
      .addSelect(
        'COUNT(*) FILTER (WHERE t.assigned_to = :userId)',
        'assigned_to_me'
      )
      .setParameter('userId', userId)
      .groupBy('t.project_id');

    if (!allProjects) {
      qb.innerJoin(
        ProjectMembers,
        'pm',
        'pm.project_id = t.project_id AND pm.user_id = :userId'
      );
    }

    const rows = await qb.getRawMany<{
      project_id: string;
      total: string;
      assigned_to_me: string;
    }>();
    return rows.map((row) => ({
      project_id: row.project_id,
      total: Number(row.total),
      assigned_to_me: Number(row.assigned_to_me),
    }));
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
      const labelIds = Array.isArray(dto.label_ids)
        ? dto.label_ids
        : [dto.label_ids as unknown as string];
      const taskIds = await this.labelRepo.findTasksWithAllLabels(
        dto.project_id,
        labelIds
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
