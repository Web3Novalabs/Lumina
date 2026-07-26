import { renderHook, act } from '@testing-library/react';
import { useCopyToClipboard } from './useCopyToClipboard';

describe('useCopyToClipboard', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });
    document.execCommand = jest.fn();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('copies via the Clipboard API and marks the state as copied', async () => {
    const { result } = renderHook(() => useCopyToClipboard(1000));

    await act(async () => {
      await result.current.copy('hello');
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('hello');
    expect(result.current.copied).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('falls back to execCommand when the Clipboard API is unavailable', async () => {
    Object.assign(navigator, {
      clipboard: undefined,
    });

    const { result } = renderHook(() => useCopyToClipboard(1000));

    await act(async () => {
      await result.current.copy('fallback');
    });

    expect(document.execCommand).toHaveBeenCalledWith('copy');
    expect(result.current.copied).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('resets copied state after the timeout expires', async () => {
    const { result } = renderHook(() => useCopyToClipboard(1000));

    await act(async () => {
      await result.current.copy('reset');
    });

    expect(result.current.copied).toBe(true);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.copied).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
