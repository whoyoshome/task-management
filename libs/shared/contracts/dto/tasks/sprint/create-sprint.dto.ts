export class CreateSprintDto {
  project_id!: string;
  name!: string;
  goal?: string;
  start_date?: string;
  end_date?: string;
}
