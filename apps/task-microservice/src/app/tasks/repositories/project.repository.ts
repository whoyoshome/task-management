import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../entities';

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

  async findAll(): Promise<Project[]> {
    return this.repo.find();
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
