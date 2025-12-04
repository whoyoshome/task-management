import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { TaskTcpClient } from '@shared/clients';
import { BoardResponseDto, CreateBoardColumnDto, CreateBoardDto, TaskMoveDto, UpdateBoardColumnDto } from '@shared/contracts';

@Injectable()
export class BoardService {
  constructor(private readonly client: TaskTcpClient) {}

  createBoard(dto: CreateBoardDto): Promise<BoardResponseDto> {
    return firstValueFrom(this.client.getClient().send({ cmd: 'board_create' }, dto));
  }

  getBoardWithColumns(id: string): Promise<BoardResponseDto> {
    return firstValueFrom(this.client.getClient().send({ cmd: 'board_get_with_columns' }, id));
  }

  createColumn(dto: CreateBoardColumnDto) {
    return firstValueFrom(this.client.getClient().send({ cmd: 'board_column_create' }, dto));
  }

  updateColumn(dto: UpdateBoardColumnDto) {
    return firstValueFrom(this.client.getClient().send({ cmd: 'board_column_update' }, dto));
  }

  deleteColumn(id: string) {
    return firstValueFrom(this.client.getClient().send({ cmd: 'board_column_delete' }, id));
  }

  moveTask(dto: TaskMoveDto) {
    return firstValueFrom(this.client.getClient().send({ cmd: 'task_move' }, dto));
  }

  getDefaultBoardForProject(project_id: string) {
    return firstValueFrom(this.client.getClient().send({ cmd: 'board_get_default_for_project' }, project_id));
  }
}
