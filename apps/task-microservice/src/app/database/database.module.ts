import { Module } from '@nestjs/common';
import { postgresModule } from '@libs/database';
import { migrations } from '../migrations';

@Module({
  imports: [postgresModule('TASK', migrations)],
})
export class DatabaseModule {}
