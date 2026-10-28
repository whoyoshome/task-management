import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class RefreshTokenResponseDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  access_token: string;

  @ApiProperty({
    description:
      'Rotated refresh token. The one sent in the request is no longer valid.',
  })
  @IsNotEmpty()
  @IsString()
  refresh_token: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  expires_in?: number;
}
