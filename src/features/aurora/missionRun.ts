/**
 * What a ring-time mission hook (useMarch, useGladius) gives the ring screen: a live count toward
 * the goal, and the tap way through when the sensor can't be used, so the alarm can always stop.
 */
export type MissionKind = 'march' | 'gladius';

/** checking: finding the sensor; sensor: it counts; taps: the button counts (the sensor still adds). */
export type MissionMode = 'checking' | 'sensor' | 'taps';

/**
 * Why the button is counting: no sensor on this phone, the permission not given, the sensor gone
 * quiet, or the user chose taps from the offer.
 */
export type MissionFallback = 'noSensor' | 'noPermission' | 'quiet' | 'chosen';

export type MissionRun = {
  kind: MissionKind;
  mode: MissionMode;
  fallback: MissionFallback | null;
  /** Steps, swings or taps counted so far, never past the goal. */
  count: number;
  goal: number;
  left: number;
  isDone: boolean;
  /** The tap way through is on offer (Gladius after a minute) and not yet taken. */
  canChooseTaps: boolean;
  chooseTaps: () => void;
  /** One tap of the mission button (taps mode only). */
  tap: () => void;
};
