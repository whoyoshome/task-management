import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { TaskStatus } from '../../../enums';

export class CreateBoardColumnDto {
  @ApiProperty()
  @IsUUID()
  board_id!: string;

  @ApiProperty({ enum: TaskStatus })
  @IsEnum(TaskStatus)
  status!: TaskStatus;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order_index?: number;

  @ApiPropertyOptional({
    minimum: 1,
    description: 'Soft limit: columns above it are flagged, moves are not blocked.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  wip_limit?: number;
}
