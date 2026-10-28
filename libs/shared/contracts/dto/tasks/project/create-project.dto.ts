import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsArray,
  IsOptional,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ProjectRole } from '../../../enums';

class ProjectMemberInput {
  @ApiProperty({ example: 'uuid-of-user' })
  @IsUUID()
  user_id: string;

  @ApiProperty({ enum: ProjectRole, example: ProjectRole.MEMBER })
  @IsNotEmpty()
  role: ProjectRole;
}

export class CreateProjectDto {

  @ApiProperty({ example: 'My Project' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'PROJ-001',
    description: 'Unique project key',
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  key: string;

  @ApiProperty({ example: 'This is a sample project' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({
    description: 'Ignored: the gateway sets it from the access token',
  })
  @IsOptional()
  @IsUUID()
  created_by?: string;

  @ApiPropertyOptional({ type: [ProjectMemberInput], description: 'Additional members to add to the project' })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ProjectMemberInput)
  members?: ProjectMemberInput[];
}
