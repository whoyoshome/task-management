import { TaskStatus } from '../../../enums';

export class BoardColumnDto {
  id!: string;
  status!: TaskStatus;
  order_index!: number;
  wip_limit?: number | null;
  /** Tasks of the project currently in this column's status. */
  task_count!: number;
  /** True when wip_limit is set and task_count exceeds it (soft limit). */
  over_wip_limit!: boolean;
}

export class BoardResponseDto {
  id!: string;
  project_id!: string;
  name!: string;
  is_default!: boolean;
  columns!: BoardColumnDto[];
}
