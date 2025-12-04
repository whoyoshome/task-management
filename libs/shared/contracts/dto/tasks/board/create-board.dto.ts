export class CreateBoardDto {
  project_id!: string;
  name!: string;
  is_default?: boolean;
}
