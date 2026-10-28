import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateTaskDto } from './create-task.dto';

// The author is fixed at creation; it is never editable.
export class UpdateTaskDto extends PartialType(
  OmitType(CreateTaskDto, ['created_by'] as const)
) {}
