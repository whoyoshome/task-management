import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateSprintDto {
  @ApiProperty()
  @IsUUID()
  project_id!: string;

  @ApiProperty({ maxLength: 100, example: 'Sprint 1' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  goal?: string;

  @ApiPropertyOptional({ example: '2026-11-02' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ example: '2026-11-16' })
  @IsOptional()
  @IsDateString()
  end_date?: string;
}
