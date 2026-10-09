import { View } from 'react-native';

import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ToneLine } from '@/components/ToneLine';
import { commonCopy, pickTone, todayCopy } from '@/copy';
import { useToday } from '@/hooks/useToday';
import { daysLeftInYear, parseDayKey, weekdayIndex } from '@/lib/dates';
import { usePreferencesStore } from '@/stores';
import { createStyles } from '@/theme';

/** Veni: today. Until an arc begins (onboarding, Step 8) it shows the day and an empty state. */
export default function VeniScreen() {
  const styles = useStyles();
  const today = useToday();
  const tone = usePreferencesStore((state) => state.tone);

  const weekday = commonCopy.weekdays[weekdayIndex(today)] ?? '';
  const caption = commonCopy.daysLeftInYear(daysLeftInYear(today), parseDayKey(today).year);

  return (
    <Screen>
      <ScreenHeader eyebrow={todayCopy.eyebrow} title={weekday} caption={caption} />
      <View style={styles.body}>
        <ToneLine line={pickTone(todayCopy.emptyLine, tone)} tone={tone} />
      </View>
    </Screen>
  );
}

const useStyles = createStyles((theme) => ({
  body: { marginTop: theme.space.xxl },
}));
