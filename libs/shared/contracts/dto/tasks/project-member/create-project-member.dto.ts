import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectRole } from '../../../enums';

export class CreateProjectMemberDto {
  @ApiProperty({ example: 'uuid-of-project' })
  @IsUUID()
  project_id: string;

  @ApiProperty({ example: 'uuid-of-user' })
  @IsUUID()
  user_id: string;

  @ApiPropertyOptional({ enum: ProjectRole })
  @IsEnum(ProjectRole)
  @IsOptional()
  role?: ProjectRole;
}
