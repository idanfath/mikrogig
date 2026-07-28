import { useEffect, useReducer } from 'react';

type Clock = {
  clientAt: number;
  now: number;
  serverAt: number;
};

function initializeClock(serverAt: number): Clock {
  const now = Date.now();

  return { serverAt, clientAt: now, now };
}

function tickClock(
  clock: Clock,
  action: { now: number; serverAt: number },
): Clock {
  if (clock.serverAt !== action.serverAt) {
    return {
      serverAt: action.serverAt,
      clientAt: action.now,
      now: action.now,
    };
  }

  return { ...clock, now: action.now };
}

export function useServerClock(serverNow: string): string {
  const serverAt = Date.parse(serverNow);
  const [clock, tick] = useReducer(tickClock, serverAt, initializeClock);

  useEffect(() => {
    const timer = window.setInterval(
      () => tick({ serverAt, now: Date.now() }),
      1000,
    );

    return () => window.clearInterval(timer);
  }, [serverAt]);

  return new Date(clock.serverAt + clock.now - clock.clientAt).toISOString();
}
