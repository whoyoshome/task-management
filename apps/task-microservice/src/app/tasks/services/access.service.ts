import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { Repository } from 'typeorm';
import {
  Task,
  Project,
  Board,
  BoardColumn,
  Sprint,
  TaskDependencies,
} from '../entities';
import { LabelRepository } from '../repositories/label.repository';
import { BoardRepository } from '../repositories/board.repository';
import { ProjectMembersRepository } from '../repositories/project-members.repository';
import { TaskCommentsRepository } from '../repositories/task-comments.repository';

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
    private readonly membersRepo: ProjectMembersRepository,
    private readonly commentsRepo: TaskCommentsRepository,
    @InjectRepository(TaskDependencies)
    private readonly dependencies: Repository<TaskDependencies>
  ) {}

  async getMemberRole(project_id: string, user_id: string) {
    if (!isUUID(project_id)) {
      throw new BadRequestException(`Invalid project_id format: ${project_id}`);
    }
    if (!isUUID(user_id)) {
      throw new BadRequestException(`Invalid user_id format: ${user_id}`);
    }

    const member = await this.membersRepo.findByProjectAndUser(
      project_id,
      user_id
    );
    return member?.role ?? null;
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
      case 'task_comment': {
        const c = await this.commentsRepo.findById(id);
        if (!c) return null;
        const t = await this.taskRepo.findOne({ where: { id: c.task_id } });
        return t?.project_id ?? null;
      }
      case 'task_dependency': {
        const d = await this.dependencies.findOne({ where: { id } });
        if (!d) return null;
        const t = await this.taskRepo.findOne({ where: { id: d.task_id } });
        return t?.project_id ?? null;
      }
      default:
        return null;
    }
  }
}
