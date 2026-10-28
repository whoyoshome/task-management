import { useEffect, useState } from 'react';
import { axiosInstance } from '../services/api';

const SLOW_AFTER_MS = 3_000;
const RETRY_EVERY_MS = 5_000;
const GIVE_UP_AFTER_MS = 120_000;

export type ServerState = 'checking' | 'waking' | 'ready' | 'unavailable';

/**
 * Pings the API as soon as the page loads. On free hosting the backend
 * sleeps when idle and takes up to a minute to start: the ping starts it
 * while the user types, and "waking" lets the page say why it is slow.
 */
export function useServerWakeUp(): ServerState {
  const [state, setState] = useState<ServerState>('checking');

  useEffect(() => {
    let cancelled = false;
    const startedAt = Date.now();
    const slow = setTimeout(() => {
      if (!cancelled) setState((s) => (s === 'checking' ? 'waking' : s));
    }, SLOW_AFTER_MS);

    const ping = async () => {
      while (!cancelled && Date.now() - startedAt < GIVE_UP_AFTER_MS) {
        try {
          await axiosInstance.get('/health', { timeout: 60_000 });
          if (!cancelled) setState('ready');
          return;
        } catch {
          await new Promise((resolve) => setTimeout(resolve, RETRY_EVERY_MS));
        }
      }
      if (!cancelled) setState('unavailable');
    };
    void ping();

    return () => {
      cancelled = true;
      clearTimeout(slow);
    };
  }, []);

  return state;
}
