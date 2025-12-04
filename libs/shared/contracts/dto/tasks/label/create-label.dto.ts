import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsHexColor,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateLabelDto {
  @ApiProperty()
  @IsUUID()
  project_id!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ description: 'Hex color like #AABBCC' })
  @IsOptional()
  @IsString()
  @MaxLength(7)
  @IsHexColor()
  color?: string | null;
}
