import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ProjectRepository } from '../repositories/project.repository';
import {
  CreateProjectDto,
  UpdateProjectDto,
  ProjectRole,
} from '@shared/contracts';
import { Project, ProjectMembers } from '../entities';

@Injectable()
export class ProjectService {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly dataSource: DataSource
  ) {}

  /**
   * Creates the project, its creator as admin and any extra members in one
   * transaction, so a failure never leaves a project without its members.
   * Field formats (UUIDs, key length) are validated by CreateProjectDto.
   */
  async create(dto: CreateProjectDto): Promise<Project> {
    const { members = [], ...projectData } = dto;

    const roles = new Map<string, ProjectRole>();
    for (const member of members) {
      roles.set(member.user_id, member.role || ProjectRole.MEMBER);
    }
    roles.set(dto.created_by, ProjectRole.ADMIN);

    try {
      return await this.dataSource.transaction(async (manager) => {
        const project = await manager.save(
          manager.create(Project, projectData)
        );
        await manager.save(
          [...roles].map(([user_id, role]) =>
            manager.create(ProjectMembers, {
              project_id: project.id,
              user_id,
              role,
            })
          )
        );
        return project;
      });
    } catch (error) {
      if ((error as { code?: string }).code === '23505') {
        throw new ConflictException(
          `Project with key '${dto.key}' already exists`
        );
      }
      throw error;
    }
  }

  /** Global admins see every project; everyone else only their own. */
  async findVisibleTo(userId: string, allProjects: boolean): Promise<Project[]> {
    return allProjects
      ? this.projectRepository.findAll()
      : this.projectRepository.findByMember(userId);
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectRepository.findById(id);
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOne(id);
    Object.assign(project, dto);
    return this.projectRepository.update(project);
  }

  async remove(id: string): Promise<{ ok: boolean }> {
    const project = await this.findOne(id);
    await this.projectRepository.delete(project);
    return { ok: true };
  }

  async findOneWithMembers(id: string): Promise<Project> {
    const project = await this.projectRepository.findByIdWithMembers(id);
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }
}
