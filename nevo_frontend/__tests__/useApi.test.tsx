import { act, renderHook, waitFor } from '@testing-library/react';
import { useApi } from '../hooks/useApi';
import { RateLimitError } from '../lib/rate-limit';

describe('useApi', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('tracks the initial loading state while a request is pending', async () => {
    let resolveRequest!: (value: string) => void;
    const apiFunction = jest.fn(
      () =>
        new Promise<string>((resolve) => {
          resolveRequest = resolve;
        })
    );
    const { result } = renderHook(() => useApi(apiFunction));

    expect(result.current.isLoading).toBe(false);

    let executePromise: Promise<string | null> | undefined;
    act(() => {
      executePromise = result.current.execute();
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveRequest('loaded');
      await executePromise;
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toBe('loaded');
  });

  it('stores successful response data and invokes the success callback', async () => {
    const apiFunction = jest.fn().mockResolvedValue('success-data');
    const onSuccess = jest.fn();
    const { result } = renderHook(() => useApi(apiFunction, { onSuccess }));

    await act(async () => {
      await result.current.execute('payload');
    });

    expect(apiFunction).toHaveBeenCalledWith('payload');
    expect(result.current.data).toBe('success-data');
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(onSuccess).toHaveBeenCalledWith('success-data');
  });

  it('captures errors and clears the success state', async () => {
    const apiFunction = jest.fn().mockRejectedValue(new Error('boom'));
    const onError = jest.fn();
    const { result } = renderHook(() => useApi(apiFunction, { onError }));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('boom');
    expect(result.current.isLoading).toBe(false);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('surfaces rate-limit state and retries with the last arguments', async () => {
    const rateLimitError = new RateLimitError({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 2500,
      retryAfterMs: 2500,
      maxRequests: 1,
      windowMs: 60_000,
    });
    const apiFunction = jest
      .fn()
      .mockRejectedValueOnce(rateLimitError)
      .mockResolvedValueOnce('retry-success');
    const { result } = renderHook(() => useApi(apiFunction));

    await act(async () => {
      await result.current.execute('retry-me');
    });

    expect(result.current.rateLimit).not.toBeNull();
    expect(result.current.rateLimit?.canRetry).toBe(false);
    expect(result.current.rateLimit?.remainingSeconds).toBe(3);

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(result.current.rateLimit?.canRetry).toBe(true);

    await act(async () => {
      await result.current.rateLimit?.retry();
    });

    expect(apiFunction).toHaveBeenCalledTimes(2);
    expect(result.current.data).toBe('retry-success');
    expect(result.current.rateLimit).toBeNull();
  });
});
