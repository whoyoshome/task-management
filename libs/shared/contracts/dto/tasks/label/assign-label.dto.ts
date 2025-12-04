import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignLabelDto {
  @ApiProperty()
  @IsUUID()
  task_id!: string;

  @ApiProperty()
  @IsUUID()
  label_id!: string;
}
