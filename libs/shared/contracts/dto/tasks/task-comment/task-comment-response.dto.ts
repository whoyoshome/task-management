import { ApiProperty } from '@nestjs/swagger';

export class TaskCommentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  task_id: string;

  @ApiProperty()
  user_id: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  created_at: Date;
}
