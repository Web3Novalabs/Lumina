import {
  ClientRateLimiter,
  DEFAULT_RATE_LIMIT_OPTIONS,
  parseRetryAfterHeader,
  resolveRateLimitOptions,
} from './rate-limit';

describe('ClientRateLimiter', () => {
  it('allows requests until the limit is reached and then blocks until the window resets', () => {
    const now = jest.fn();
    const limiter = new ClientRateLimiter(now);
    const options = { maxRequests: 2, windowMs: 1000 };

    now.mockReturnValue(1000);
    const first = limiter.consume('api', options);
    const second = limiter.consume('api', options);
    const third = limiter.consume('api', options);

    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(1);
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(0);
    expect(third.allowed).toBe(false);
    expect(third.remaining).toBe(0);
    expect(third.retryAfterMs).toBe(1000);
    expect(third.resetAt).toBe(2000);

    now.mockReturnValue(1500);
    const status = limiter.getStatus('api', options);
    expect(status.allowed).toBe(false);
    expect(status.remaining).toBe(0);
    expect(status.retryAfterMs).toBe(500);

    now.mockReturnValue(2500);
    const afterReset = limiter.consume('api', options);
    expect(afterReset.allowed).toBe(true);
    expect(afterReset.remaining).toBe(1);
    expect(afterReset.resetAt).toBe(3500);
  });
});

describe('parseRetryAfterHeader', () => {
  it('parses numeric seconds values', () => {
    expect(parseRetryAfterHeader('2', 1000)).toBe(2000);
    expect(parseRetryAfterHeader('0', 1000)).toBe(0);
  });

  it('parses HTTP-date values relative to the supplied clock', () => {
    const date = new Date(6000).toUTCString();
    expect(parseRetryAfterHeader(date, 1000)).toBe(5000);
  });

  it('returns null for empty or invalid values', () => {
    expect(parseRetryAfterHeader(null, 1000)).toBeNull();
    expect(parseRetryAfterHeader('not-a-date', 1000)).toBeNull();
  });
});

describe('resolveRateLimitOptions', () => {
  it('returns the defaults when no options are provided', () => {
    expect(resolveRateLimitOptions()).toEqual(DEFAULT_RATE_LIMIT_OPTIONS);
  });

  it('falls back to defaults for invalid values and floors valid ones', () => {
    expect(resolveRateLimitOptions({ maxRequests: 0, windowMs: -10 })).toEqual(
      DEFAULT_RATE_LIMIT_OPTIONS
    );
    expect(
      resolveRateLimitOptions({ maxRequests: 3.9, windowMs: 4.2 })
    ).toEqual({
      maxRequests: 3,
      windowMs: 4,
    });
  });
});
