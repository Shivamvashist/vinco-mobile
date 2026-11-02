import { useMarch } from '@/hooks/useMarch';

import { MissionDial } from './MissionDial';

type MarchPanelProps = {
  /** Shown when the chosen mission isn't built yet and the march stands in for it. */
  note?: string;
  onDone: () => void;
  onUnderway?: () => void;
};

/** The march mission: 30 steps from the step counter, or taps without one. */
export function MarchPanel({ note, onDone, onUnderway }: MarchPanelProps) {
  const run = useMarch();
  return <MissionDial run={run} note={note} onDone={onDone} onUnderway={onUnderway} />;
}
