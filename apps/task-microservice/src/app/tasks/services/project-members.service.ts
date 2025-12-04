import { Injectable } from '@nestjs/common';
import { ProjectMembersRepository } from '../repositories/project-members.repository';
import { CreateProjectMemberDto } from '@shared/contracts';
import { ProjectMembers } from '../entities';

@Injectable()
export class ProjectMembersService {
  constructor(private readonly repository: ProjectMembersRepository) {}

  async add(dto: CreateProjectMemberDto): Promise<ProjectMembers> {
    return this.repository.create(dto);
  }

  async remove(id: string): Promise<void> {
    await this.repository.deleteById(id);
  }
}
