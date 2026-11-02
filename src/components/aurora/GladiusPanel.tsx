import { useGladius } from '@/hooks/useGladius';

import { MissionDial } from './MissionDial';

/** The "Gladius" mission: 30 swings of the phone, read from the accelerometer, or taps. */
export function GladiusPanel({ onDone, onUnderway }: { onDone: () => void; onUnderway?: () => void }) {
  const run = useGladius();
  return <MissionDial run={run} onDone={onDone} onUnderway={onUnderway} />;
}
