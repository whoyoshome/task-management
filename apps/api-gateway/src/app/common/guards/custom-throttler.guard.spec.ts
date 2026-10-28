import { clientIp } from './custom-throttler.guard';

describe('clientIp', () => {
  const request = (headers: Record<string, string> = {}) => ({
    ip: '10.0.0.1',
    headers,
  });

  it('uses req.ip by default, ignoring forwarded headers', () => {
    expect(
      clientIp(request({ 'x-forwarded-for': '203.0.113.9' }), undefined)
    ).toBe('10.0.0.1');
  });

  it('uses the configured header set by the host proxy', () => {
    expect(
      clientIp(request({ 'cf-connecting-ip': '198.51.100.7' }), 'CF-Connecting-IP')
    ).toBe('198.51.100.7');
  });

  it('falls back to req.ip when the configured header is missing', () => {
    expect(clientIp(request(), 'cf-connecting-ip')).toBe('10.0.0.1');
  });
});
