import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Board } from './boards.entity';
import { TaskStatus } from '@shared/contracts';

@Entity('board_columns')
@Unique(['board_id', 'status'])
export class BoardColumn {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  board_id: string;

  @Column({ type: 'varchar', length: 50 })
  status: TaskStatus;

  @Column({ type: 'int', default: 0 })
  order_index: number;

  @Column({ type: 'int', nullable: true })
  wip_limit: number | null;

  @ManyToOne(() => Board, (b) => b.columns, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'board_id' })
  board: Board;
}
