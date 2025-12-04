import { TaskStatus } from '../../../enums';

export class BoardColumnDto {
  id!: string;
  status!: TaskStatus;
  order_index!: number;
  wip_limit?: number | null;
}

export class BoardResponseDto {
  id!: string;
  project_id!: string;
  name!: string;
  is_default!: boolean;
  columns!: BoardColumnDto[];
}
