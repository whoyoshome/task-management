import { SprintStatus } from '../../../enums';

export class SprintResponseDto {
  id!: string;
  project_id!: string;
  name!: string;
  goal?: string | null;
  status!: SprintStatus;
  start_date?: string | null;
  end_date?: string | null;
  created_at!: string;
  updated_at!: string;
}
