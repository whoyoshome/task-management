import { ApiProperty } from '@nestjs/swagger';

export class LabelResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  project_id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ required: false, nullable: true, example: '#AABBCC' })
  color?: string | null;

  @ApiProperty()
  created_at!: string;

  @ApiProperty()
  updated_at!: string;
}
