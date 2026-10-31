/** How far (as a share of the screen width) a slow drag must travel to change tab. */
export const SWIPE_DISTANCE_SHARE = 0.22;
/** A flick this fast (points per second) changes tab even when the drag is short. */
export const SWIPE_FLING_VELOCITY = 600;
/** The least travel a flick needs, so a twitch never changes tab. */
export const SWIPE_MIN_TRAVEL = 24;

export type SwipeInput = {
  /** Position of the current tab in the tab order (Veni 0, Vidi 1, Vici 2). */
  index: number;
  /** How many tabs there are. */
  count: number;
  /** Horizontal travel of the finger: negative is to the left. */
  translationX: number;
  /** Horizontal speed at release: negative is to the left. */
  velocityX: number;
  /** Width of the screen the swipe happened on. */
  width: number;
};

/**
 * The tab a horizontal swipe lands on, or null to stay. A swipe to the left moves to the next tab
 * (the one on the right), a swipe to the right to the previous one. It needs a clear distance or
 * a flick in the same direction as the drag; there is no tab past either end.
 */
export function resolveSwipeTarget({
  index,
  count,
  translationX,
  velocityX,
  width,
}: SwipeInput): number | null {
  const isValid =
    Number.isInteger(index) &&
    Number.isInteger(count) &&
    index >= 0 &&
    index < count &&
    Number.isFinite(translationX) &&
    Number.isFinite(velocityX) &&
    Number.isFinite(width) &&
    width > 0;
  if (!isValid || translationX === 0) return null;

  const travel = Math.abs(translationX);
  const isFarEnough = travel >= width * SWIPE_DISTANCE_SHARE;
  const isFling =
    travel >= SWIPE_MIN_TRAVEL &&
    Math.abs(velocityX) >= SWIPE_FLING_VELOCITY &&
    Math.sign(velocityX) === Math.sign(translationX);
  // A drag that went far but was flicked back at the end means "never mind".
  const isFlickedBack =
    Math.abs(velocityX) >= SWIPE_FLING_VELOCITY && Math.sign(velocityX) !== Math.sign(translationX);
  if (isFlickedBack || !(isFarEnough || isFling)) return null;

  const target = translationX < 0 ? index + 1 : index - 1;
  return target >= 0 && target < count ? target : null;
}
