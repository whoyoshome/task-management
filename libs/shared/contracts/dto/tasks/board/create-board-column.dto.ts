import { TaskStatus } from '../../../enums';

export class CreateBoardColumnDto {
  board_id!: string;
  status!: TaskStatus;
  order_index?: number;
  wip_limit?: number;
}
