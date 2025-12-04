import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectMembers } from '../entities/project-members.entity';

@Injectable()
export class ProjectMembersRepository {
  constructor(
    @InjectRepository(ProjectMembers)
    private readonly repo: Repository<ProjectMembers>
  ) {}

  async create(data: Partial<ProjectMembers>): Promise<ProjectMembers> {
    const member = this.repo.create(data);
    return this.repo.save(member);
  }

  async deleteById(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async findByProjectAndUser(
    projectId: string,
    userId: string
  ): Promise<ProjectMembers | null> {
    return this.repo.findOne({
      where: { project_id: projectId, user_id: userId },
    });
  }

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }
}
