import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsHexColor,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class UpdateLabelDto {
  @ApiProperty()
  @IsUUID()
  label_id!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'Hex color like #AABBCC' })
  @IsOptional()
  @IsString()
  @MaxLength(7)
  @IsHexColor()
  color?: string | null;
}
