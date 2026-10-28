import { ApiProperty } from '@nestjs/swagger';

/**
 * Body of login and refresh. The refresh token is never part of it: the
 * gateway sends it as an httpOnly cookie, out of reach of page scripts.
 */
export class AccessTokenResponseDto {
  @ApiProperty()
  access_token: string;

  @ApiProperty({ description: 'Seconds until the access token expires.' })
  expires_in: number;
}
