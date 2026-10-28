import { Injectable } from '@nestjs/common';
import { ThrottlerGuard as BaseThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends BaseThrottlerGuard {
  // Use req.ip only. Reading X-Forwarded-For directly would let any client
  // pick its own rate-limit key; when behind a proxy, Express derives req.ip
  // from that header safely once TRUST_PROXY is configured.
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.ip ?? req.socket?.remoteAddress ?? 'unknown';
  }
}
