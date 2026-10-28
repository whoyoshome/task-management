import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaskCommentDto {
  @ApiProperty({ example: 'uuid-of-task' })
  @IsUUID()
  task_id: string;

  @ApiPropertyOptional({
    description: 'Ignored: the gateway sets it from the access token',
  })
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @ApiProperty({ example: 'This task needs attention' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
