import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BoardService } from '../services/board.service';
import { CreateBoardDto, CreateBoardColumnDto, UpdateBoardColumnDto, TaskMoveDto } from '@shared/contracts';

@Controller()
export class BoardController {
  constructor(private readonly service: BoardService) {}

  @MessagePattern({ cmd: 'board_create' })
  createBoard(@Payload() dto: CreateBoardDto) {
    return this.service.createBoard(dto);
  }

  @MessagePattern({ cmd: 'board_get_with_columns' })
  getBoard(@Payload() id: string) {
    return this.service.getBoardWithColumns(id);
  }

  @MessagePattern({ cmd: 'board_get_default_for_project' })
  getDefaultBoard(@Payload() project_id: string) {
    return this.service.getOrCreateDefaultBoardForProject(project_id);
  }

  @MessagePattern({ cmd: 'board_column_create' })
  createColumn(@Payload() dto: CreateBoardColumnDto) {
    return this.service.createColumn(dto);
  }

  @MessagePattern({ cmd: 'board_column_update' })
  updateColumn(@Payload() dto: UpdateBoardColumnDto) {
    return this.service.updateColumn(dto);
  }

  @MessagePattern({ cmd: 'board_column_delete' })
  deleteColumn(@Payload() id: string) {
    return this.service.deleteColumn(id);
  }

  @MessagePattern({ cmd: 'task_move' })
  moveTask(@Payload() dto: TaskMoveDto) {
    return this.service.moveTask(dto.task_id, dto.board_id, dto.status);
  }
}
