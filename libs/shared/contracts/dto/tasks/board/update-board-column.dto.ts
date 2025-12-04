export class UpdateBoardColumnDto {
  id!: string;
  order_index?: number;
  wip_limit?: number | null;
}
