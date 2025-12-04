import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard as BaseThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends BaseThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const ip =
      req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    return ip;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const result = await super.canActivate(context);
    return result;
  }
}
