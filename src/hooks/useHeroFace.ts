import { useEffect, useState } from 'react';

import { useTabReturn } from './useTabReturn';

export type HeroFace = 'count' | 'sky';

/** How long the hero shows the order count before the sky takes over. */
export const HERO_COUNT_MS = 6000;

/**
 * Which face Today's hero shows: the order count when the card mounts and on each return to the
 * tab, then the sky (the sun or moon on the day path) after HERO_COUNT_MS. Re-renders never reset
 * it, only a return.
 */
export function useHeroFace(): HeroFace {
  const returns = useTabReturn();
  const [shown, setShown] = useState<{ returns: number; face: HeroFace }>({ returns, face: 'count' });

  // Back on the tab: the count again (adjusted while rendering, not in an effect).
  if (shown.returns !== returns) setShown({ returns, face: 'count' });
  const face = shown.returns === returns ? shown.face : 'count';

  useEffect(() => {
    if (face !== 'count') return;
    const timer = setTimeout(() => setShown({ returns, face: 'sky' }), HERO_COUNT_MS);
    return () => clearTimeout(timer);
  }, [face, returns]);

  return face;
}
