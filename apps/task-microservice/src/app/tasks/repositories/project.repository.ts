import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Project, ProjectMembers } from '../entities';

@Injectable()
export class ProjectRepository {
  constructor(
    @InjectRepository(Project)
    private readonly repo: Repository<Project>
  ) {}

  async create(data: Partial<Project>): Promise<Project> {
    const project = this.repo.create(data);
    return this.repo.save(project);
  }

  /** Every project with its member count, oldest first. */
  async findAll(): Promise<Project[]> {
    return this.withMemberCount(this.repo.createQueryBuilder('p'))
      .orderBy('p.created_at', 'ASC')
      .getMany();
  }

  /** Projects in which the user is a member, with member counts, oldest first. */
  async findByMember(userId: string): Promise<Project[]> {
    return this.withMemberCount(this.repo.createQueryBuilder('p'))
      .innerJoin(
        ProjectMembers,
        'pm',
        'pm.project_id = p.id AND pm.user_id = :userId',
        { userId }
      )
      .orderBy('p.created_at', 'ASC')
      .getMany();
  }

  private withMemberCount(qb: SelectQueryBuilder<Project>) {
    return qb.loadRelationCountAndMap('p.member_count', 'p.members');
  }

  async findById(id: string): Promise<Project | null> {
    return this.repo.findOne({ where: { id } });
  }

  async update(project: Project): Promise<Project> {
    return this.repo.save(project);
  }

  async delete(project: Project): Promise<void> {
    await this.repo.remove(project);
  }

  async findByIdWithMembers(id: string): Promise<Project | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['members', 'tasks'],
    });
  }
}
