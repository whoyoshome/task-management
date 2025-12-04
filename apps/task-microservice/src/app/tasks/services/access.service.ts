import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, Project, Board, BoardColumn, Sprint } from '../entities';
import { LabelRepository } from '../repositories/label.repository';
import { BoardRepository } from '../repositories/board.repository';
import { ProjectMembersRepository } from '../repositories/project-members.repository';

@Injectable()
export class AccessService {
  constructor(
    @InjectRepository(Task) private readonly taskRepo: Repository<Task>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    private readonly boardRepo: BoardRepository,
    @InjectRepository(Board) private readonly boards: Repository<Board>,
    @InjectRepository(BoardColumn)
    private readonly columns: Repository<BoardColumn>,
    @InjectRepository(Sprint) private readonly sprintRepo: Repository<Sprint>,
    private readonly labelRepo: LabelRepository,
    private readonly membersRepo: ProjectMembersRepository
  ) {}

  private isValidUUID(str: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  async getMemberRole(project_id: string, user_id: string) {
    if (!this.isValidUUID(project_id)) {
      throw new BadRequestException(`Invalid project_id format: ${project_id}`);
    }
    if (!this.isValidUUID(user_id)) {
      throw new BadRequestException(`Invalid user_id format: ${user_id}`);
    }

    try {
      const m = await this.membersRepo.findByProjectAndUser(
        project_id,
        user_id
      );
      return m?.role ?? null;
    } catch (error: any) {
      if (
        error.code === '22P02' ||
        error.message?.includes('invalid input syntax for type uuid')
      ) {
        throw new BadRequestException(`Invalid UUID format: ${error.message}`);
      }
      throw error;
    }
  }

  async resolveProjectId(resource: string, id: string): Promise<string | null> {
    switch (resource) {
      case 'project': {
        const p = await this.projectRepo.findOne({ where: { id } });
        return p ? p.id : null;
      }
      case 'task': {
        const t = await this.taskRepo.findOne({ where: { id } });
        return t?.project_id ?? null;
      }
      case 'board': {
        const b = await this.boards.findOne({ where: { id } });
        return b?.project_id ?? null;
      }
      case 'board_column': {
        const c = await this.boardRepo.findColumnByIdWithBoard(id);
        return c?.board?.project_id ?? null;
      }
      case 'sprint': {
        const s = await this.sprintRepo.findOne({ where: { id } });
        return s?.project_id ?? null;
      }
      case 'label': {
        const l = await this.labelRepo.findById(id);
        return l?.project_id ?? null;
      }
      case 'project_member': {
        const m = await this.membersRepo.findById(id);
        return m?.project_id ?? null;
      }
      default:
        return null;
    }
  }
}
