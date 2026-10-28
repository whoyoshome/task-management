import { Injectable } from '@nestjs/common';
import { ThrottlerGuard as BaseThrottlerGuard } from '@nestjs/throttler';

/**
 * The rate-limit key of a request: the client's IP address.
 *
 * By default req.ip, which Express derives from X-Forwarded-For once
 * TRUST_PROXY is set. Reading that header directly would let any client
 * pick its own key.
 *
 * Some hosts never append the client to X-Forwarded-For (Render passes it
 * on as the client sent it, behind Cloudflare), so no TRUST_PROXY value
 * makes it trustworthy there. CLIENT_IP_HEADER names a header the host's
 * proxy sets itself and overwrites, such as cf-connecting-ip. Only set it
 * when every request goes through that proxy.
 */
export function clientIp(
  req: Record<string, any>,
  header = process.env.CLIENT_IP_HEADER
): string {
  if (header) {
    const value: unknown = req.headers?.[header.toLowerCase()];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return req.ip ?? req.socket?.remoteAddress ?? 'unknown';
}

@Injectable()
export class CustomThrottlerGuard extends BaseThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return clientIp(req);
  }
}
