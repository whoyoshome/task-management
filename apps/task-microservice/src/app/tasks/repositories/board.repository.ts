import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Board, BoardColumn } from '../entities';
import { TaskStatus } from '@shared/contracts';

@Injectable()
export class BoardRepository {
  constructor(
    @InjectRepository(Board)
    private readonly boardRepo: Repository<Board>,
    @InjectRepository(BoardColumn)
    private readonly columnRepo: Repository<BoardColumn>
  ) {}

  async createBoard(data: Partial<Board>): Promise<Board> {
    const entity = this.boardRepo.create(data);
    return this.boardRepo.save(entity);
  }

  async createDefaultColumns(board_id: string) {
    const defaults: TaskStatus[] = [
      TaskStatus.PENDING,
      TaskStatus.IN_PROGRESS,
      TaskStatus.COMPLETED,
    ];
    let order = 0;
    for (const status of defaults) {
      await this.columnRepo.save(
        this.columnRepo.create({ board_id, status, order_index: order++ })
      );
    }
  }

  findBoardById(id: string) {
    return this.boardRepo.findOne({ where: { id } });
  }

  findDefaultBoardByProject(project_id: string) {
    return this.boardRepo.findOne({ where: { project_id, is_default: true } });
  }

  findBoardWithColumns(id: string) {
    return this.boardRepo.findOne({ where: { id }, relations: ['columns'] });
  }

  async createColumn(data: Partial<BoardColumn>) {
    const entity = this.columnRepo.create(data);
    return this.columnRepo.save(entity);
  }

  async updateColumn(id: string, patch: Partial<BoardColumn>) {
    await this.columnRepo.update({ id }, patch);
    return this.columnRepo.findOne({ where: { id } });
  }

  async deleteColumn(id: string) {
    await this.columnRepo.delete({ id });
  }

  async findColumn(board_id: string, status: TaskStatus) {
    return this.columnRepo.findOne({ where: { board_id, status } });
  }

  findColumnByIdWithBoard(id: string) {
    return this.columnRepo.findOne({ where: { id }, relations: ['board'] });
  }
}
