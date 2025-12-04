import { TaskStatus } from '../../../enums';

export class TaskMoveDto {
  task_id!: string;
  board_id!: string;
  status!: TaskStatus;
}
