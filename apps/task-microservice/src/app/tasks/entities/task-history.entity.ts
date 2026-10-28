import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type HistoryMetadata = Record<string, any>;

@Entity('task_history')
export class TaskHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column('uuid')
  task_id: string;

  @Column({ type: 'varchar', length: 50, default: 'system' })
  type: 'system' | 'user';

  /** User who made the change; null for system entries. */
  @Column('uuid', { nullable: true })
  actor_id: string | null;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: HistoryMetadata | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
