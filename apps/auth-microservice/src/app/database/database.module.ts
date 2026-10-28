import { Module } from '@nestjs/common';
import { postgresModule } from '@libs/database';
import { migrations } from '../migrations';

@Module({
  imports: [postgresModule('AUTH', migrations)],
})
export class DatabaseModule {}
