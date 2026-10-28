export class TaskHistoryResponseDto {
  id!: string;
  task_id!: string;
  type!: 'system' | 'user';
  /** User who made the change; null for system entries. */
  actor_id?: string | null;
  message!: string;
  /** For field changes: { field, from, to } (description values omitted). */
  metadata?: Record<string, any> | null;
  created_at!: string;
}
