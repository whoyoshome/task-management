import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';

@Injectable()
export class RefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly repo: Repository<RefreshToken>
  ) {}

  async create(data: Partial<RefreshToken>): Promise<RefreshToken> {
    const token = this.repo.create(data);
    return this.repo.save(token);
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    return this.repo.findOne({ where: { token } });
  }

  async deleteByToken(token: string): Promise<void> {
    await this.repo.delete({ token });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.repo.delete({ user_id: userId });
  }

  async deleteExpired(): Promise<void> {
    await this.repo
      .createQueryBuilder('refresh_token')
      .delete()
      .where('expires_at < :now', { now: new Date() })
      .execute();
  }
}
