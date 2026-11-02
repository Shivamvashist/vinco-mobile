import { router } from 'expo-router';
import { View } from 'react-native';

import { AuroraStatus } from '@/components/aurora/AuroraStatus';
import { StepPermissionNote } from '@/components/aurora/StepPermissionNote';
import { Card } from '@/components/Card';
import { ChoiceChip } from '@/components/ChoiceChip';
import { PreviewNotice } from '@/components/guard/PreviewNotice';
import { IconButton } from '@/components/IconButton';
import { OptionCard } from '@/components/OptionCard';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionHeader } from '@/components/SectionHeader';
import { SettingsGroup } from '@/components/settings/SettingsGroup';
import { SettingsRow } from '@/components/settings/SettingsRow';
import { TimeField } from '@/components/TimeField';
import { Txt } from '@/components/Txt';
import { auroraCopy, commonCopy, guardCopy } from '@/copy';
import {
  ALL_WEEKDAYS,
  AURORA_MISSIONS,
  auroraBridge,
  getNextRing,
  type AuroraMission,
  isMissionBuilt,
  type Weekday,
} from '@/features/aurora';
import { useActiveArc } from '@/hooks/useActiveArc';
import { useForum } from '@/hooks/useForum';
import { useStepPermission } from '@/hooks/useStepPermission';
import { formatClockTime, parseClockMinutes, toDayKey } from '@/lib/dates';
import { useGuardStore } from '@/stores';
import { createStyles } from '@/theme';

const copy = guardCopy.aurora;

/**
 * Aurora's settings: on or off, the time, the days and the mission. In the Vinco build it shows
 * the alarm's live state on the phone; in Expo Go, the preview notice. See docs/GUARDIANS.md.
 */
export default function AuroraScreen() {
  const styles = useStyles();
  const aurora = useGuardStore((state) => state.aurora);
  const updateAurora = useGuardStore((state) => state.updateAurora);
  const { arc } = useActiveArc();
  const forum = useForum();
  const steps = useStepPermission();
  const now = new Date();
  const nextRing = getNextRing(aurora, now);
  const wakeMinutes = arc ? parseClockMinutes(arc.wakeTime) : null;

  const back = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/settings');
  };

  // Turning Aurora on with the march, or picking the march, asks for the step counter now, so
  // ring time never has to (over the lock screen the dialog can't be answered).
  const askStepsFor = (mission: AuroraMission) => {
    if (mission === 'march' && (steps.state === 'denied' || steps.state === 'unknown')) {
      void steps.request();
    }
  };

  const pickMission = (mission: AuroraMission) => {
    updateAurora({ mission });
    askStepsFor(mission);
  };

  const turn = (isOn: boolean) => {
    // Turning it on for the first time starts from the arc's wake-up time.
    updateAurora(isOn && wakeMinutes != null ? { isOn, minutes: wakeMinutes } : { isOn });
    if (isOn) askStepsFor(aurora.mission);
  };

  const toggleDay = (day: Weekday) => {
    const days = aurora.days.includes(day)
      ? aurora.days.filter((value) => value !== day)
      : [...aurora.days, day];
    updateAurora({ days });
  };

  return (
    <Screen gutter="flow" edges={['top', 'bottom']}>
      <View style={styles.nav}>
        <IconButton icon="back" accessibilityLabel={commonCopy.back} onPress={back} />
      </View>
      <ScreenHeader eyebrow={copy.eyebrow} title={copy.title} caption={copy.intro} />
      {auroraBridge.isSupported ? (
        <AuroraStatus settings={aurora} steps={steps} />
      ) : (
        <View style={styles.block}>
          <PreviewNotice />
        </View>
      )}

      <SettingsGroup title={copy.title}>
        <SettingsRow
          label={copy.on}
          toggle={{
            value: aurora.isOn,
            onChange: turn,
          }}
        />
      </SettingsGroup>

      {aurora.isOn ? (
        <>
          <Card style={styles.block}>
            <TimeField
              label={copy.time}
              minutes={aurora.minutes}
              onChange={(minutes) => updateAurora({ minutes })}
            />
          </Card>

          <SectionHeader title={copy.daysLabel} />
          <View style={styles.days}>
            {ALL_WEEKDAYS.map((day) => (
              <ChoiceChip
                key={day}
                label={copy.days[day] ?? ''}
                accessibilityLabel={copy.dayNames[day]}
                isMulti
                selected={aurora.days.includes(day)}
                onPress={() => toggleDay(day)}
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

          <SectionHeader title={copy.missionLabel} />
          <View style={styles.options} accessibilityRole="radiogroup">
            {AURORA_MISSIONS.map((mission) => (
              <OptionCard
                key={mission}
                title={copy.missions[mission].name}
                description={
                  isMissionBuilt(mission)
                    ? copy.missions[mission].does
                    : `${copy.missions[mission].does} ${auroraCopy.status.soon}`
                }
                selected={aurora.mission === mission}
                onPress={() => pickMission(mission)}
              />
            ))}
          </View>
          {aurora.mission === 'march' ? <StepPermissionNote permission={steps} /> : null}
          <Txt variant="caption" color="currency" style={styles.note}>
            {copy.passes(forum.holdings.venia.held)}
          </Txt>
        </>
      ) : null}
    </Screen>
  );
}

const useStyles = createStyles((theme) => ({
  nav: { flexDirection: 'row', marginLeft: -theme.space.sm, marginBottom: theme.space.sm },
  block: { marginTop: theme.space.lg },
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.xs },
  options: { gap: theme.space.sm },
  note: { marginTop: theme.space.sm },
}));
