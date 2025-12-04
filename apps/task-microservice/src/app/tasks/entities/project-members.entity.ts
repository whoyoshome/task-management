import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Project } from './';
import { ProjectRole } from '@shared/contracts';

@Entity()
@Unique(['project_id', 'user_id'])
export class ProjectMembers {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  project_id: string;

  @Column('uuid')
  user_id: string;

  @Column({ type: 'varchar', length: 50, default: 'member' })
  role: ProjectRole;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  joined_at: Date;

  @ManyToOne(() => Project, (project) => project.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  project: Project;
}
