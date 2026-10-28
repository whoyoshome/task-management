import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProjectResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ example: 'PROJ-001', description: 'Unique project key' })
  key: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  created_by: string;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;

  @ApiPropertyOptional({ description: 'Number of members (project listings only)' })
  member_count?: number;
}
