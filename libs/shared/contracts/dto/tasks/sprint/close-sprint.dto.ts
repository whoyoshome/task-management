import { IsUUID } from 'class-validator';

export class CloseSprintDto {
  @IsUUID()
  id!: string;
}
