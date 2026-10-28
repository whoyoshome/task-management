import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { axiosInstance } from '../services/api';
import { useServerWakeUp } from './useServerWakeUp';

const respondAfter = (ms: number) =>
  vi.spyOn(axiosInstance, 'get').mockImplementation(
    () => new Promise((resolve) => setTimeout(() => resolve({ data: {} }), ms))
  );

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('useServerWakeUp', () => {
  it('is ready at once when the server answers quickly', async () => {
    vi.useFakeTimers();
    respondAfter(100);
    const { result } = renderHook(() => useServerWakeUp());

    await act(() => vi.advanceTimersByTimeAsync(200));

    expect(result.current).toBe('ready');
  });

  it('reports waking while a sleeping server starts, then ready', async () => {
    vi.useFakeTimers();
    respondAfter(20_000);
    const { result } = renderHook(() => useServerWakeUp());

    await act(() => vi.advanceTimersByTimeAsync(4_000));
    expect(result.current).toBe('waking');

    await act(() => vi.advanceTimersByTimeAsync(20_000));
    expect(result.current).toBe('ready');
  });

  it('retries failed pings until the server answers', async () => {
    vi.useFakeTimers();
    const get = vi
      .spyOn(axiosInstance, 'get')
      .mockRejectedValueOnce(new Error('502'))
      .mockResolvedValue({ data: {} });
    const { result } = renderHook(() => useServerWakeUp());

    await act(() => vi.advanceTimersByTimeAsync(6_000));

    expect(get).toHaveBeenCalledTimes(2);
    expect(result.current).toBe('ready');
  });
});
