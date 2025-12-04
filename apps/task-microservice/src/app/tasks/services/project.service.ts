import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProjectRepository } from '../repositories/project.repository';
import { ProjectMembersRepository } from '../repositories/project-members.repository';
import {
  CreateProjectDto,
  UpdateProjectDto,
  ProjectRole,
} from '@shared/contracts';
import { Project } from '../entities';

@Injectable()
export class ProjectService {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly projectMembersRepository: ProjectMembersRepository
  ) {}

  private isValidUUID(str: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  async create(dto: CreateProjectDto): Promise<Project> {
    if (!this.isValidUUID(dto.created_by)) {
      throw new BadRequestException(
        `Invalid created_by UUID format: ${dto.created_by}`
      );
    }

    const { members, ...projectData } = dto;

    if (!projectData.key) {
      throw new BadRequestException('Project key is required');
    }

    try {
      const project = await this.projectRepository.create(projectData);

      try {
        await this.projectMembersRepository.create({
          project_id: project.id,
          user_id: dto.created_by,
          role: ProjectRole.ADMIN,
        });
      } catch (error: any) {
        await this.projectRepository.delete(project);
        throw new BadRequestException(
          `Failed to add creator as project member: ${error.message}`
        );
      }

      if (members && members.length > 0) {
        for (const member of members) {
          if (member.user_id !== dto.created_by) {
            if (!this.isValidUUID(member.user_id)) {
              throw new BadRequestException(
                `Invalid user_id UUID format: ${member.user_id}`
              );
            }
            await this.projectMembersRepository.create({
              project_id: project.id,
              user_id: member.user_id,
              role: member.role || ProjectRole.MEMBER,
            });
          }
        }
      }

      return project;
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      if (
        error.code === '22P02' ||
        error.message?.includes('invalid input syntax for type uuid')
      ) {
        throw new BadRequestException(`Invalid UUID format: ${error.message}`);
      }
      throw error;
    }
  }

  async findAll(): Promise<Project[]> {
    return this.projectRepository.findAll();
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
