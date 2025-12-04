import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sprint, Task } from '../entities';
import { SprintStatus } from '@shared/contracts';

@Injectable()
export class SprintRepository {
  constructor(
    @InjectRepository(Sprint) private readonly sprintRepo: Repository<Sprint>,
    @InjectRepository(Task) private readonly taskRepo: Repository<Task>
  ) {}

  create(data: Partial<Sprint>) {
    const s = this.sprintRepo.create(data);
    return this.sprintRepo.save(s);
  }

  findById(id: string) {
    return this.sprintRepo.findOne({ where: { id } });
  }

  listByProject(project_id: string) {
    return this.sprintRepo.find({ where: { project_id } });
  }

  findActiveByProject(project_id: string) {
    return this.sprintRepo.findOne({
      where: { project_id, status: SprintStatus.ACTIVE },
    });
  }

  findAnotherActiveInProject(project_id: string, exceptId: string) {
    return this.sprintRepo
      .createQueryBuilder('s')
      .where('s.project_id = :project_id', { project_id })
      .andWhere('s.status = :status', { status: SprintStatus.ACTIVE })
      .andWhere('s.id <> :id', { id: exceptId })
      .getOne();
  }

  async setStatus(id: string, status: SprintStatus, patch?: Partial<Sprint>) {
    await this.sprintRepo.update({ id }, { status, ...patch });
    return this.findById(id);
  }

  async addTask(sprint_id: string, task_id: string) {
    const t = await this.taskRepo.findOne({ where: { id: task_id } });
    if (!t) return null;
    t.sprint_id = sprint_id;
    return this.taskRepo.save(t);
  }

  async removeTask(sprint_id: string, task_id: string) {
    const t = await this.taskRepo.findOne({
      where: { id: task_id, sprint_id },
    });
    if (!t) return null;
    t.sprint_id = null;
    return this.taskRepo.save(t);
  }

  async reorderSprintTasks(sprint_id: string, task_ids: string[]) {
    let idx = 0;
    for (const id of task_ids) {
      await this.taskRepo.update(
        { id, sprint_id },
        { sprint_order_index: idx++ }
      );
    }
  }

  async reorderBacklogTasks(project_id: string, task_ids: string[]) {
    let idx = 0;
    for (const id of task_ids) {
      await this.taskRepo.update(
        { id, project_id, sprint_id: null },
        { sprint_order_index: idx++ }
      );
    }
  }

  async findMismatchedTasksForSprint(sprint_id: string, task_ids: string[]) {
    if (!task_ids?.length) return [] as string[];
    const rows = await this.taskRepo
      .createQueryBuilder('t')
      .select(['t.id AS id'])
      .where('t.sprint_id = :sprint_id', { sprint_id })
      .andWhere('t.id IN (:...ids)', { ids: task_ids })
      .getRawMany<{ id: string }>();
    const matched = new Set(rows.map((r) => r.id));
    return task_ids.filter((id) => !matched.has(id));
  }

  async findMismatchedTasksForBacklog(project_id: string, task_ids: string[]) {
    if (!task_ids?.length) return [] as string[];
    const rows = await this.taskRepo
      .createQueryBuilder('t')
      .select(['t.id AS id'])
      .where('t.project_id = :project_id', { project_id })
      .andWhere('t.sprint_id IS NULL')
      .andWhere('t.id IN (:...ids)', { ids: task_ids })
      .getRawMany<{ id: string }>();
    const matched = new Set(rows.map((r) => r.id));
    return task_ids.filter((id) => !matched.has(id));
  }
}
