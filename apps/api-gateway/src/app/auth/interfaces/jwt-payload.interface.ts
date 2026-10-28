import { UserRole } from '@shared/contracts';

/** Claims of the access token, as exposed on request.user by JwtStrategy. */
export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  full_name?: string;
  iat?: number;
  exp?: number;
}
