import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class RemoveLabelDto {
  @ApiProperty()
  @IsUUID()
  task_id!: string;

  @ApiProperty()
  @IsUUID()
  label_id!: string;
}
