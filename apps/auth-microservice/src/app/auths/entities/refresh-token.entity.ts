import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  user_id: string;

  @Column({ unique: true })
  token: string;

  @Column({ type: 'timestamp' })
  expires_at: Date;

  /**
   * Set when the token is exchanged for a new pair. The row is kept until it
   * expires so a second use can be told apart from an unknown token.
   */
  @Column({ type: 'timestamp', nullable: true })
  used_at: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
