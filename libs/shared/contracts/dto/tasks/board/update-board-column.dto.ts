import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Min, ValidateIf } from 'class-validator';

// Without validators the global ValidationPipe (whitelist) stripped every
// field, so columns could not be updated at all.
export class UpdateBoardColumnDto {
  /** Set from the route parameter by the gateway (not part of the body). */
  @IsOptional()
  @IsUUID()
  id!: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order_index?: number;

  @ApiPropertyOptional({
    minimum: 1,
    nullable: true,
    description: 'Soft limit: columns above it are flagged, moves are not blocked. null removes it.',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(1)
  wip_limit?: number | null;
}
