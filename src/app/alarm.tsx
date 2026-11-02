import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { BackHandler, View } from 'react-native';

import { GladiusPanel } from '@/components/aurora/GladiusPanel';
import { MarchPanel } from '@/components/aurora/MarchPanel';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { auroraCopy, guardCopy, pickTone } from '@/copy';
import { isMissionBuilt, missionToRun } from '@/features/aurora';
import { TRUCES } from '@/features/campaign';
import { useAuroraRing } from '@/hooks/useAuroraRing';
import { formatClockTime } from '@/lib/dates';
import { useGuardStore, usePreferencesStore } from '@/stores';
import { createStyles, SchemeOverride, useFeedback } from '@/theme';

const copy = auroraCopy.ring;
const CLOCK_TICK_MS = 10_000;

/**
 * Aurora's ring screen, over the lock screen when the alarm rings. Always dark. It stops only
 * through the mission (the march or "Gladius"), "I'm sick" (a sick-day Truce) or an alarm pass. The back
 * button does nothing until it has stopped. See docs/GUARDIANS.md.
 */
export default function AlarmScreen() {
  return (
    <SchemeOverride scheme="dark">
      <AlarmContent />
    </SchemeOverride>
  );
}

type Outcome = { kind: 'won'; denarii: number } | { kind: 'stopped' };

function AlarmContent() {
  const styles = useStyles();
  const play = useFeedback();
  const tone = usePreferencesStore((state) => state.tone);
  const mission = useGuardStore((state) => state.aurora.mission);
  const ring = useAuroraRing();
  const [now, setNow] = useState(() => new Date());
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const hasFinished = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), CLOCK_TICK_MS);
    return () => clearInterval(timer);
  }, []);

  // Hardware back must not dismiss a ringing alarm.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (outcome) router.replace('/veni');
      return true;
    });
    return () => subscription.remove();
  }, [outcome]);

  // The mission's panel plays its own final cue, then calls this once.
  const onMissionDone = () => {
    if (hasFinished.current) return;
    hasFinished.current = true;
    const denarii = ring.finishMission();
    setProblem(null);
    setOutcome({ kind: 'won', denarii });
  };

  const stopWith = () => {
    hasFinished.current = true;
    setProblem(null);
    setOutcome({ kind: 'stopped' });
    router.replace('/veni');
  };

  const onSick = () => {
    const result = ring.callSick();
    if (result === 'stopped') {
      play('truce');
      stopWith();
    } else {
      play('denied');
      setProblem(
        result === 'cannotAfford'
          ? copy.sickCannotAfford(TRUCES.priceDenarii, ring.balance)
          : copy.sickFailed,
      );
    }
  };

  const onPass = () => {
    if (ring.spendPass()) {
      play('confirm');
      stopWith();
    } else {
      play('denied');
      setProblem(copy.passFailed);
    }
  };

  const running = missionToRun(mission);
  const soonNote = isMissionBuilt(mission) ? undefined : copy.soon(guardCopy.aurora.missions[mission].name);
  const lineMission = running === 'gladius' ? 'gladius' : 'march';

  return (
    <Screen scroll={false} gutter="flow" edges={['top', 'bottom']} background="backgroundDeep">
      <View style={styles.top}>
        <Txt variant="eyebrow" color="accent" align="center">
          {copy.eyebrow}
        </Txt>
        <Txt variant="hero" align="center" accessibilityRole="header">
          {formatClockTime(now)}
        </Txt>
        <Txt variant="bodyLarge" align="center" color="textMuted">
          {outcome?.kind === 'won' ? pickTone(copy.won, tone) : pickTone(copy.line[lineMission], tone)}
        </Txt>
      </View>

      {outcome?.kind === 'won' ? (
        <View style={styles.bottom}>
          {outcome.denarii > 0 ? (
            <Txt variant="label" color="currency" align="center">
              {copy.firstTry(outcome.denarii)}
            </Txt>
          ) : null}
          <Button label={copy.toToday} onPress={() => router.replace('/veni')} cue="tap" />
        </View>
      ) : (
        <>
          <View style={styles.middle}>
            {running === 'gladius' ? (
              <GladiusPanel onDone={onMissionDone} onUnderway={ring.quietBuzz} />
            ) : (
              <MarchPanel note={soonNote} onDone={onMissionDone} onUnderway={ring.quietBuzz} />
            )}
          </View>
          <View style={styles.bottom}>
            {problem ? (
              <Txt variant="caption" color="danger" align="center" accessibilityRole="alert">
                {problem}
              </Txt>
            ) : null}
            <Button
              label={copy.sick}
              variant="secondary"
              cue={null}
              accessibilityHint={ring.isLudus ? copy.sickLudus : copy.sickHint}
              onPress={onSick}
            />
            {ring.passesHeld > 0 ? (
              <Button
                label={copy.pass(ring.passesHeld)}
                variant="ghost"
                cue={null}
                accessibilityHint={copy.passHint}
                onPress={onPass}
              />
            ) : null}
          </View>
        </>
      )}
    </Screen>
  );
}

const useStyles = createStyles((theme) => ({
  top: { gap: theme.space.sm, paddingTop: theme.space.xxl },
  middle: { flex: 1, justifyContent: 'center', paddingVertical: theme.space.lg },
  bottom: { gap: theme.space.sm, paddingBottom: theme.space.lg, marginTop: 'auto' },
}));
