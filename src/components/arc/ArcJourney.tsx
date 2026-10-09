import { View } from 'react-native';

import { getArcMilestones } from '@/features/arc';
import { toRoman } from '@/lib/toRoman';
import { createStyles } from '@/theme';

import { Txt } from '../Txt';

export type ArcJourneyProps = {
  /** Today's day of the arc (1 to lengthDays). */
  dayNumber: number;
  lengthDays: number;
  accessibilityLabel: string;
};

const MILESTONE_SIZE = 16;
const MARKER_SIZE = 20;
const TRACK_TOP = 10;

/** The arc as a road: Roman milestones, the distance covered in gold, and a marker for today. */
export function ArcJourney({ dayNumber, lengthDays, accessibilityLabel }: ArcJourneyProps) {
  const styles = useStyles();
  const span = Math.max(1, lengthDays - 1);
  const fraction = Math.min(1, Math.max(0, (dayNumber - 1) / span));
  const toPercent = (day: number) => `${((day - 1) / span) * 100}%` as const;

  return (
    <View
      style={styles.frame}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 1, max: lengthDays, now: dayNumber }}
    >
      <View style={styles.track} />
      <View style={[styles.track, styles.covered, { width: `${fraction * 100}%` }]} />
      {getArcMilestones(lengthDays).map((day) => {
        const isPassed = day <= dayNumber;
        return (
          <View key={day} style={[styles.milestoneSlot, { left: toPercent(day) }]}>
            <View style={[styles.milestone, isPassed && styles.milestonePassed]} />
            <Txt variant="micro" color={isPassed ? 'text' : 'textMuted'} style={styles.numeral}>
              {toRoman(day)}
            </Txt>
          </View>
        );
      })}
      <View style={[styles.markerSlot, { left: `${fraction * 100}%` }]}>
        <View style={styles.marker} />
      </View>
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  // Side margins keep the first and last numerals inside the screen.
  frame: { height: 46, marginHorizontal: theme.space.sm },
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: TRACK_TOP,
    height: theme.space.xs,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.border,
  },
  covered: { right: undefined, backgroundColor: theme.colors.accent },
  milestoneSlot: {
    position: 'absolute',
    top: TRACK_TOP - MILESTONE_SIZE / 2 + 2,
    width: 0,
    alignItems: 'center',
  },
  milestone: {
    width: MILESTONE_SIZE,
    height: MILESTONE_SIZE,
    borderRadius: theme.radius.xs,
    borderWidth: 2,
    borderColor: theme.colors.borderStrong,
    backgroundColor: theme.colors.background,
  },
  milestonePassed: { borderColor: theme.colors.accent, backgroundColor: theme.colors.accent },
  numeral: { marginTop: theme.space.xs, width: 40, textAlign: 'center', fontFamily: theme.fonts.display },
  markerSlot: { position: 'absolute', top: TRACK_TOP - MARKER_SIZE / 2 + 2, width: 0, alignItems: 'center' },
  marker: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.text,
    borderWidth: 3,
    borderColor: theme.colors.background,
  },
}));
