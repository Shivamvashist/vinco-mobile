import { useEffect, useState } from 'react';

const MINUTE_MS = 60_000;

/** Now, updated on each new minute, so things that show the time move without a busy timer. */
export function useMinuteClock(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    const first = setTimeout(
      () => {
        setNow(new Date());
        interval = setInterval(() => setNow(new Date()), MINUTE_MS);
      },
      MINUTE_MS - (Date.now() % MINUTE_MS),
    );
    return () => {
      clearTimeout(first);
      if (interval) clearInterval(interval);
    };
  }, []);
  return now;
}
