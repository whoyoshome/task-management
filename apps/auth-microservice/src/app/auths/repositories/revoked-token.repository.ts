import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RevokedToken } from '../entities/revoked-token.entity';

@Injectable()
export class RevokedTokenRepository {
  constructor(
    @InjectRepository(RevokedToken)
    private readonly repo: Repository<RevokedToken>
  ) {}

  async create(token: string): Promise<RevokedToken> {
    const revoked = this.repo.create({ token });
    return this.repo.save(revoked);
  }

  async isRevoked(token: string): Promise<boolean> {
    const found = await this.repo.findOne({ where: { token } });
    return !!found;
  }
}
