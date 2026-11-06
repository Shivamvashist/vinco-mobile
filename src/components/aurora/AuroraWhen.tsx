import { View } from 'react-native';

import { commonCopy, guardCopy } from '@/copy';
import { ALL_WEEKDAYS, getNextRing, type Weekday } from '@/features/aurora';
import { formatClockTime, toDayKey } from '@/lib/dates';
import { createStyles } from '@/theme';

import { Card } from '../Card';
import { ChoiceChip } from '../ChoiceChip';
import { SectionHeader } from '../SectionHeader';
import { TimeField } from '../TimeField';
import { Txt } from '../Txt';

const copy = guardCopy.aurora;

export type AuroraWhenProps = {
  /** Minutes after midnight. */
  minutes: number;
  days: readonly Weekday[];
  onChangeMinutes: (minutes: number) => void;
  onToggleDay: (day: Weekday) => void;
};

/**
 * When Aurora rings: the time, the days as chips, and the next ring in words (or "Pick at least
 * one day"). Shared by the Aurora screen and the setup flow.
 */
export function AuroraWhen({ minutes, days, onChangeMinutes, onToggleDay }: AuroraWhenProps) {
  const styles = useStyles();
  const now = new Date();
  const nextRing = getNextRing({ isOn: true, minutes, days, mission: 'march' }, now);

  return (
    <View>
      <Card>
        <TimeField label={copy.time} minutes={minutes} onChange={onChangeMinutes} />
      </Card>

      <SectionHeader title={copy.daysLabel} />
      <View style={styles.days}>
        {ALL_WEEKDAYS.map((day) => (
          <ChoiceChip
            key={day}
            label={copy.days[day] ?? ''}
            accessibilityLabel={copy.dayNames[day]}
            isMulti
            selected={days.includes(day)}
            onPress={() => onToggleDay(day)}
          />
        ))}
      </View>
      <Txt variant="caption" style={styles.note}>
        {nextRing
          ? copy.nextRing(
              `${commonCopy.dayLabel(toDayKey(nextRing), toDayKey(now))}, ${formatClockTime(nextRing)}`,
            )
          : copy.noDays}
      </Txt>
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.xs },
  note: { marginTop: theme.space.sm },
}));
