import { ApiProperty } from '@nestjs/swagger';
import { ProjectRole } from '../../../enums';

export class ProjectMemberResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  project_id: string;

  @ApiProperty()
  user_id: string;

  @ApiProperty({ enum: ProjectRole })
  role: ProjectRole;

  @ApiProperty()
  joined_at: Date;
}
