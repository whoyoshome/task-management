import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Project, TaskDependencies, TaskComments, Sprint } from './';
import { TaskStatus, TaskPriority } from '@shared/contracts';
import { TaskLabel } from './task-labels.entity';

@Entity()
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 50, default: TaskStatus.PENDING })
  status: TaskStatus;

  @Column({ type: 'varchar', length: 50, default: TaskPriority.LOW })
  priority: TaskPriority;

  @Column({ type: 'date', nullable: true })
  due_date: Date | null;

  @Column('uuid', { nullable: false })
  created_by: string;

  @Column('uuid', { nullable: false })
  assigned_to: string;

  @Column('uuid', { nullable: false })
  project_id: string;

  @Column('uuid', { nullable: true })
  sprint_id: string | null;

  @Column({ type: 'int', nullable: true })
  sprint_order_index: number | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;

  @ManyToOne(() => Project, (project) => project.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => Sprint, (sprint) => sprint.tasks, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sprint_id' })
  sprint: Sprint;

  @OneToMany(() => TaskDependencies, (dependency) => dependency.task)
  dependentTasks: TaskDependencies[];

  @OneToMany(() => TaskDependencies, (dependency) => dependency.dependsOnTask)
  dependencyOf: TaskDependencies[];

  @OneToMany(() => TaskComments, (comment) => comment.task)
  comments: TaskComments[];

  @OneToMany(() => TaskLabel, (tl) => tl.task)
  labelConnections: TaskLabel[];
}
