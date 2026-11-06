import {
  type AuroraChoice,
  type AuroraMission,
  type AuroraSettings,
  toggleWeekday,
  type Weekday,
} from '@/features/aurora';
import { useActiveArc } from '@/hooks/useActiveArc';
import { type StepPermission, useStepPermission } from '@/hooks/useStepPermission';
import { parseClockMinutes } from '@/lib/dates';
import { useAuroraInviteStore, useGuardStore } from '@/stores';

export type AuroraSettingsActions = {
  aurora: AuroraSettings;
  /** The arc's wake-up time in minutes, or null without an arc. Aurora starts from it. */
  wakeMinutes: number | null;
  steps: StepPermission;
  update: (patch: Partial<AuroraSettings>) => void;
  /** On or off. Turning it on for the first time starts from the arc's wake-up time. */
  turn: (isOn: boolean) => void;
  pickMission: (mission: AuroraMission) => void;
  toggleDay: (day: Weekday) => void;
  /** Asks for the step counter now when the march is the mission (never at ring time). */
  askStepsFor: (mission: AuroraMission) => void;
  /** Saves the setup flow's choice and turns Aurora on. */
  setUp: (choice: AuroraChoice) => void;
};

/**
 * Reading and changing Aurora's settings, shared by the Aurora screen and the setup flow so the
 * two save the same way. Turning Aurora on or off also closes Today's invite for good.
 */
export function useAuroraSettings(): AuroraSettingsActions {
  const aurora = useGuardStore((state) => state.aurora);
  const updateAurora = useGuardStore((state) => state.updateAurora);
  const closeInvite = useAuroraInviteStore((state) => state.close);
  const { arc } = useActiveArc();
  const steps = useStepPermission();
  const wakeMinutes = arc ? parseClockMinutes(arc.wakeTime) : null;

  // Over the lock screen Android's dialog can't be answered, so the march asks ahead.
  const askStepsFor = (mission: AuroraMission) => {
    if (mission === 'march' && (steps.state === 'denied' || steps.state === 'unknown')) {
      void steps.request();
    }
  };

  return {
    aurora,
    wakeMinutes,
    steps,
    update: updateAurora,
    turn: (isOn) => {
      updateAurora(isOn && wakeMinutes != null ? { isOn, minutes: wakeMinutes } : { isOn });
      // Either way the user knows Aurora now: Today stops inviting.
      closeInvite();
      if (isOn) askStepsFor(aurora.mission);
    },
    pickMission: (mission) => {
      updateAurora({ mission });
      askStepsFor(mission);
    },
    toggleDay: (day) => updateAurora({ days: toggleWeekday(aurora.days, day) }),
    askStepsFor,
    setUp: (choice) => {
      updateAurora({ ...choice, isOn: true });
      closeInvite();
    },
  };
}
