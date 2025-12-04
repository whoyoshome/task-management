import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Task, ProjectMembers } from './';
import { Board } from './boards.entity';
import { Sprint } from './sprints.entity';

@Entity()
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  key: string;

  @Column({ type: 'text' })
  description: string;

  @Column('uuid')
  created_by: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;

  @OneToMany(() => Task, (task) => task.project)
  tasks: Task[];

  @OneToMany(() => Board, (board) => board.project)
  boards: Board[];

  @OneToMany(() => Sprint, (sprint) => sprint.project)
  sprints: Sprint[];

  @OneToMany(() => ProjectMembers, (member) => member.project)
  members: ProjectMembers[];
}
