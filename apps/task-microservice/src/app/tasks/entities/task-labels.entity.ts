import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Task } from './tasks.entity';
import { Label } from './labels.entity';

@Entity()
@Unique(['task_id', 'label_id'])
export class TaskLabel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  task_id: string;

  @Column('uuid')
  label_id: string;

  @ManyToOne(() => Task, (task) => task.labelConnections, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @ManyToOne(() => Label, (label) => label.taskLabels, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'label_id' })
  label: Label;
}
