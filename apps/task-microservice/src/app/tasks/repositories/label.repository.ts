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
    const qb = this.taskLabelRepo
      .createQueryBuilder('tl')
      .select('tl.task_id', 'task_id')
      .addSelect('COUNT(DISTINCT tl.label_id)', 'cnt')
      .innerJoin(Task, 't', 't.id = tl.task_id AND t.project_id = :project_id', { project_id })
      .where('tl.label_id IN (:...label_ids)', { label_ids })
      .groupBy('tl.task_id')
      .having('COUNT(DISTINCT tl.label_id) = :n', { n: label_ids.length });

    const rows = await qb.getRawMany<{ task_id: string; cnt: string }>();
    return rows.map((r) => r.task_id);
  }
}
