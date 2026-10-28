import { ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class StartSprintDto {
  /** Sprint id; the gateway takes it from the route. */
  @IsUUID()
  id!: string;

  @ApiPropertyOptional({ example: '2026-11-02' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ example: '2026-11-16' })
  @IsOptional()
  @IsDateString()
  end_date?: string;
}

/** Request body of POST /sprints/:id/start. */
export class StartSprintBodyDto extends OmitType(StartSprintDto, ['id'] as const) {}
