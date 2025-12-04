export class TaskHistoryResponseDto {
  id!: string;
  task_id!: string;
  type!: 'system' | 'user';
  message!: string;
  metadata?: Record<string, any> | null;
  created_at!: string;
}
