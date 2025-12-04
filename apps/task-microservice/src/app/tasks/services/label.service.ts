import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LabelRepository } from '../repositories/label.repository';
import { Label, Project, Task } from '../entities';
import { AssignLabelDto, CreateLabelDto, LabelResponseDto, RemoveLabelDto, UpdateLabelDto } from '@shared/contracts';

@Injectable()
export class LabelService {
  constructor(
    private readonly repo: LabelRepository,
    @InjectRepository(Project) private readonly projectRepo: Repository<Project>,
    @InjectRepository(Task) private readonly taskRepo: Repository<Task>
  ) {}

  async create(dto: CreateLabelDto): Promise<LabelResponseDto> {
    const project = await this.projectRepo.findOne({ where: { id: dto.project_id } });
    if (!project) throw new NotFoundException('Project not found');
    const label = await this.repo.create({ project_id: dto.project_id, name: dto.name, color: dto.color ?? null });
    return this.toResponse(label);
  }

  async update(dto: UpdateLabelDto): Promise<LabelResponseDto> {
    const label = await this.repo.findById(dto.label_id);
    if (!label) throw new NotFoundException('Label not found');
    const updated = await this.repo.update(dto.label_id, {
      name: dto.name ?? label.name,
      color: dto.color ?? label.color,
    });
    return this.toResponse(updated!);
  }

  async delete(id: string) {
    const label = await this.repo.findById(id);
    if (!label) throw new NotFoundException('Label not found');
    await this.repo.delete(id);
    return { ok: true };
  }

  async listByProject(project_id: string): Promise<LabelResponseDto[]> {
    const project = await this.projectRepo.findOne({ where: { id: project_id } });
    if (!project) throw new NotFoundException('Project not found');
    const labels = await this.repo.listByProject(project_id);
    return labels.map((l) => this.toResponse(l));
  }

  async assign(dto: AssignLabelDto) {
    const task = await this.taskRepo.findOne({ where: { id: dto.task_id } });
    if (!task) throw new NotFoundException('Task not found');
    const label = await this.repo.findById(dto.label_id);
    if (!label) throw new NotFoundException('Label not found');
    if (task.project_id !== label.project_id) {
      throw new BadRequestException('Task and label must belong to the same project');
    }
    await this.repo.assignLabel(dto.task_id, dto.label_id);
    return { ok: true };
  }

  async remove(dto: RemoveLabelDto) {
    await this.repo.removeLabel(dto.task_id, dto.label_id);
    return { ok: true };
  }

  private toResponse(l: Label): LabelResponseDto {
    return {
      id: l.id,
      project_id: l.project_id,
      name: l.name,
      color: l.color,
      created_at: l.created_at.toISOString(),
      updated_at: l.updated_at.toISOString(),
    };
  }
}
