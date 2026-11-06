import { router } from 'expo-router';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { BackHandler, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { AuroraMissionPicker } from '@/components/aurora/AuroraMissionPicker';
import { AuroraSetupDone } from '@/components/aurora/AuroraSetupDone';
import { AuroraSetupIntro } from '@/components/aurora/AuroraSetupIntro';
import { AuroraSetupPermissions } from '@/components/aurora/AuroraSetupPermissions';
import { AuroraWhen } from '@/components/aurora/AuroraWhen';
import { Button } from '@/components/Button';
import { FlowLayout } from '@/components/onboarding/FlowLayout';
import { auroraSetupCopy, commonCopy, pickTone } from '@/copy';
import {
  ALL_WEEKDAYS,
  type AuroraMission,
  BUILT_MISSIONS,
  getNextRing,
  isMissionBuilt,
  toggleWeekday,
  type Weekday,
} from '@/features/aurora';
import { useAuroraSettings } from '@/hooks/useAuroraSettings';
import { useEntrance } from '@/hooks/useEntrance';
import { formatClockTime, toDayKey } from '@/lib/dates';
import { usePreferencesStore } from '@/stores';
import { useFeedback } from '@/theme';

const copy = auroraSetupCopy;
const STEPS = ['intro', 'when', 'mission', 'permissions'] as const;
/** How far a step slides in from, sideways. */
const SLIDE_FROM = 32;

type Step = (typeof STEPS)[number];
type SlideDirection = 1 | 0 | -1;

/**
 * Aurora's guided setup, from Today's invite: what it is, when it rings, the mission, and what
 * Android must allow. The choices stay a draft until "Turn on Aurora", which saves them the way
 * the Aurora screen does and turns it on; leaving midway saves nothing. Back (on screen or the
 * phone's) goes one step back, then leaves.
 */
export default function AuroraSetupScreen() {
  const play = useFeedback();
  const tone = usePreferencesStore((state) => state.tone);
  const { aurora, wakeMinutes, steps, askStepsFor, setUp } = useAuroraSettings();
  const [index, setIndex] = useState(0);
  // 0 on the first step: the screen's own push already moves it in.
  const [direction, setDirection] = useState<SlideDirection>(0);
  const [isDone, setIsDone] = useState(false);
  // The draft. The time follows the arc's wake-up time (it may still be loading) until changed.
  const [pickedMinutes, setPickedMinutes] = useState<number | null>(null);
  const [days, setDays] = useState<readonly Weekday[]>(aurora.days.length > 0 ? aurora.days : ALL_WEEKDAYS);
  const [mission, setMission] = useState<AuroraMission>(
    isMissionBuilt(aurora.mission) ? aurora.mission : 'march',
  );
  const hasAskedSteps = useRef(false);
  const minutes = pickedMinutes ?? wakeMinutes ?? aurora.minutes;
  const step: Step = STEPS[index] ?? 'intro';

  const leave = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/veni');
  };

  const goBack = () => {
    if (isDone || index === 0) {
      leave();
      return;
    }
    setDirection(-1);
    setIndex(index - 1);
  };

  const goNext = () => {
    setDirection(1);
    setIndex(Math.min(index + 1, STEPS.length - 1));
  };

  // The phone's Back button walks the steps too, instead of closing the whole flow.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack();
      return true;
    });
    return () => subscription.remove();
  });

  // The step counter is asked here, once, while March is the pick (never at ring time).
  const askSteps = (picked: AuroraMission) => {
    if (picked !== 'march' || hasAskedSteps.current) return;
    hasAskedSteps.current = true;
    askStepsFor(picked);
  };

  const finish = () => {
    setUp({ minutes, days, mission });
    play('rise');
    setIsDone(true);
  };

  if (isDone) {
    const now = new Date();
    const next = getNextRing({ isOn: true, minutes, days, mission }, now);
    return (
      <AuroraSetupDone
        firstRing={
          next ? `${commonCopy.dayLabel(toDayKey(next), toDayKey(now))}, ${formatClockTime(next)}` : null
        }
        onDone={leave}
      />
    );
  }

  const body: Record<Step, { title: string; subtitle: string; content: ReactNode; footer: ReactNode }> = {
    intro: {
      title: copy.intro.title,
      subtitle: pickTone(copy.intro.subtitle, tone),
      content: <AuroraSetupIntro />,
      footer: <Button label={copy.continue} onPress={goNext} />,
    },
    when: {
      title: copy.when.title,
      subtitle: copy.when.subtitle,
      content: (
        <AuroraWhen
          minutes={minutes}
          days={days}
          onChangeMinutes={setPickedMinutes}
          onToggleDay={(day) => setDays(toggleWeekday(days, day))}
        />
      ),
      footer: <Button label={copy.continue} disabled={days.length === 0} onPress={goNext} />,
    },
    mission: {
      title: copy.mission.title,
      subtitle: copy.mission.subtitle,
      content: (
        <AuroraMissionPicker
          missions={BUILT_MISSIONS}
          selected={mission}
          onPick={(picked) => {
            setMission(picked);
            askSteps(picked);
          }}
          steps={steps}
        />
      ),
      footer: (
        <Button
          label={copy.continue}
          onPress={() => {
            askSteps(mission);
            goNext();
          }}
        />
      ),
    },
    permissions: {
      title: copy.permissions.title,
      subtitle: copy.permissions.subtitle,
      content: <AuroraSetupPermissions />,
      footer: <Button label={copy.finish} cue={null} onPress={finish} />,
    },
  };
  const current = body[step];

  return (
    <StepSlide key={step} direction={direction}>
      <FlowLayout
        step={index + 1}
        totalSteps={STEPS.length}
        backHref="/veni"
        onBack={goBack}
        title={current.title}
        subtitle={current.subtitle}
        footer={current.footer}
      >
        {current.content}
      </FlowLayout>
    </StepSlide>
  );
}

/** Each step slides in from the side it comes from. Only the position moves, never the opacity. */
function StepSlide({ direction, children }: { direction: SlideDirection; children: ReactNode }) {
  const enter = useEntrance();
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: (1 - enter.get()) * SLIDE_FROM * direction }],
  }));
  return <Animated.View style={[StyleSheet.absoluteFill, style]}>{children}</Animated.View>;
}
