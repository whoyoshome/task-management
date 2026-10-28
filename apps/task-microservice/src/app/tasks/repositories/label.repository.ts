import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Label, Task, TaskLabel } from '../entities';

@Injectable()
export class LabelRepository {
  constructor(
    @InjectRepository(Label) private readonly labelRepo: Repository<Label>,
    @InjectRepository(TaskLabel) private readonly taskLabelRepo: Repository<TaskLabel>,
    @InjectRepository(Task) private readonly taskRepo: Repository<Task>
  ) {}

  create(data: Partial<Label>) {
    const e = this.labelRepo.create(data);
    return this.labelRepo.save(e);
  }

  async update(id: string, patch: Partial<Label>) {
    await this.labelRepo.update({ id }, patch);
    return this.labelRepo.findOne({ where: { id } });
  }

  async delete(id: string) {
    await this.labelRepo.delete({ id });
  }

  findById(id: string) {
    return this.labelRepo.findOne({ where: { id } });
  }

  listByProject(project_id: string) {
    return this.labelRepo.find({ where: { project_id }, order: { name: 'ASC' } });
  }

  /** Every (task, label) pair of a project's tasks, in one query. */
  listAssignmentsByProject(project_id: string) {
    return this.taskLabelRepo
      .createQueryBuilder('tl')
      .innerJoin(Task, 't', 't.id = tl.task_id')
      .select(['tl.task_id AS task_id', 'tl.label_id AS label_id'])
      .where('t.project_id = :project_id', { project_id })
      .getRawMany<{ task_id: string; label_id: string }>();
  }

  async listByTask(task_id: string) {
    const connections = await this.taskLabelRepo.find({
      where: { task_id },
      relations: ['label'],
    });
    return connections
      .map((connection) => connection.label)
      .filter((label): label is Label => Boolean(label));
  }

  async assignLabel(task_id: string, label_id: string) {
    const exist = await this.taskLabelRepo.findOne({ where: { task_id, label_id } });
    if (exist) return exist;
    const e = this.taskLabelRepo.create({ task_id, label_id });
    return this.taskLabelRepo.save(e);
  }

  async removeLabel(task_id: string, label_id: string) {
    await this.taskLabelRepo.delete({ task_id, label_id });
  }

  async findTasksWithAllLabels(project_id: string, label_ids: string[]) {
    if (!label_ids?.length) return [];

    const connections = await this.taskLabelRepo.find({
      where: { label_id: In(label_ids) },
      relations: ['task'],
    });

    const labelsByTask = new Map<string, Set<string>>();
    for (const connection of connections) {
      if (!connection.task || connection.task.project_id !== project_id) continue;
      const assigned = labelsByTask.get(connection.task_id) ?? new Set<string>();
      assigned.add(connection.label_id);
      labelsByTask.set(connection.task_id, assigned);
    }

    return Array.from(labelsByTask.entries())
      .filter(([, assigned]) =>
        label_ids.every((labelId) => assigned.has(labelId))
      )
      .map(([taskId]) => taskId);
  }
}
