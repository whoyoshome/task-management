import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Board, BoardColumn, Project, Task, Sprint, TaskHistory } from '../entities';
import { BoardRepository } from '../repositories/board.repository';
import { BoardService } from '../services/board.service';
import { BoardController } from '../controllers/board.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Board, BoardColumn, Project, Task, Sprint, TaskHistory])],
  controllers: [BoardController],
  providers: [BoardRepository, BoardService],
})
export class BoardModule {}
