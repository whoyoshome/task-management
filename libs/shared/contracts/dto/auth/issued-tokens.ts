/**
 * Tokens the auth microservice returns to the gateway over TCP. The gateway
 * puts the refresh token in a cookie and returns the rest to the client.
 */
export interface IssuedTokens {
  access_token: string;
  /** Seconds until the access token expires. */
  expires_in: number;
  refresh_token: string;
  /** Seconds until the refresh token expires (the cookie's lifetime). */
  refresh_expires_in: number;
}
