import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  IsString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../enums';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'user@email.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'New password; stored hashed' })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  full_name?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
