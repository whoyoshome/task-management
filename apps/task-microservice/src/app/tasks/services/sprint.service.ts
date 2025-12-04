import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SprintRepository } from '../repositories/sprint.repository';
import {
  CreateSprintDto,
  SprintResponseDto,
  StartSprintDto,
  CloseSprintDto,
  AddTaskToSprintDto,
  RemoveTaskFromSprintDto,
  SprintReorderDto,
  BacklogReorderDto,
} from '@shared/contracts';
import { InjectRepository } from '@nestjs/typeorm';
import { Project, Sprint } from '../entities';
import { Repository } from 'typeorm';
import { SprintStatus } from '@shared/contracts';

@Injectable()
export class SprintService {
  constructor(
    private readonly repo: SprintRepository,
    @InjectRepository(Project) private readonly projectRepo: Repository<Project>
  ) {}

  async create(dto: CreateSprintDto): Promise<SprintResponseDto> {
    const project = await this.projectRepo.findOne({
      where: { id: dto.project_id },
    });
    if (!project) throw new NotFoundException('Project not found');
    const sprint = await this.repo.create({
      project_id: dto.project_id,
      name: dto.name,
      goal: dto.goal ?? null,
      start_date: dto.start_date ?? null,
      end_date: dto.end_date ?? null,
      status: SprintStatus.PLANNED,
    });
    return this.toResponse(sprint);
  }

  async get(id: string): Promise<SprintResponseDto> {
    const sprint = await this.repo.findById(id);
    if (!sprint) throw new NotFoundException('Sprint not found');
    return this.toResponse(sprint);
  }

  listByProject(project_id: string) {
    return this.repo.listByProject(project_id);
  }

  async start(dto: StartSprintDto) {
    const sprint = await this.repo.findById(dto.id);
    if (!sprint) throw new NotFoundException('Sprint not found');
    if (sprint.status === SprintStatus.CLOSED)
      throw new BadRequestException('Cannot start a closed sprint');
    const anotherActive = await this.repo.findAnotherActiveInProject(
      sprint.project_id,
      sprint.id
    );
    if (anotherActive) {
      throw new BadRequestException(
        'Another active sprint exists in this project'
      );
    }
    const updated = await this.repo.setStatus(dto.id, SprintStatus.ACTIVE, {
      start_date: dto.start_date ?? sprint.start_date ?? null,
      end_date: dto.end_date ?? sprint.end_date ?? null,
    });
    return this.toResponse(updated!);
  }

  async close(dto: CloseSprintDto) {
    const sprint = await this.repo.findById(dto.id);
    if (!sprint) throw new NotFoundException('Sprint not found');
    const updated = await this.repo.setStatus(dto.id, SprintStatus.CLOSED);
    return this.toResponse(updated!);
  }

  async addTask(dto: AddTaskToSprintDto) {
    const sprint = await this.repo.findById(dto.sprint_id);
    if (!sprint) throw new NotFoundException('Sprint not found');
    const result = await this.repo.addTask(dto.sprint_id, dto.task_id);
    if (!result) throw new NotFoundException('Task not found');
    return { ok: true };
  }

  async removeTask(dto: RemoveTaskFromSprintDto) {
    const sprint = await this.repo.findById(dto.sprint_id);
    if (!sprint) throw new NotFoundException('Sprint not found');
    const result = await this.repo.removeTask(dto.sprint_id, dto.task_id);
    if (!result) throw new NotFoundException('Task not found in this sprint');
    return { ok: true };
  }

  async reorderSprint(dto: SprintReorderDto) {
    const sprint = await this.repo.findById(dto.sprint_id);
    if (!sprint) throw new NotFoundException('Sprint not found');
    const mismatches = await this.repo.findMismatchedTasksForSprint(
      dto.sprint_id,
      dto.task_ids ?? []
    );
    if (mismatches.length) {
      throw new BadRequestException(
        `Some tasks do not belong to sprint ${dto.sprint_id}: ${mismatches.join(
          ', '
        )}`
      );
    }
    await this.repo.reorderSprintTasks(dto.sprint_id, dto.task_ids);
    return { ok: true };
  }

  async reorderBacklog(dto: BacklogReorderDto) {
    const mismatches = await this.repo.findMismatchedTasksForBacklog(
      dto.project_id,
      dto.task_ids ?? []
    );
    if (mismatches.length) {
      throw new BadRequestException(
        `Some tasks do not belong to project backlog ${
          dto.project_id
        }: ${mismatches.join(', ')}`
      );
    }
    await this.repo.reorderBacklogTasks(dto.project_id, dto.task_ids);
    return { ok: true };
  }

  private toResponse(s: Sprint): SprintResponseDto {
    return {
      id: s.id,
      project_id: s.project_id,
      name: s.name,
      goal: s.goal,
      status: s.status,
      start_date: s.start_date,
      end_date: s.end_date,
      created_at: s.created_at.toISOString(),
      updated_at: s.updated_at.toISOString(),
    };
  }
}
