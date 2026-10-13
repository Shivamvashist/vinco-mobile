import { router } from 'expo-router';
import Constants from 'expo-constants';
import { useState } from 'react';

import { RetreatSheet } from '@/components/arc/RetreatSheet';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionHeader } from '@/components/SectionHeader';
import { AppearanceSheet } from '@/components/settings/AppearanceSheet';
import { OutlineSheet } from '@/components/settings/OutlineSheet';
import { SettingsGroup } from '@/components/settings/SettingsGroup';
import { SettingsRow } from '@/components/settings/SettingsRow';
import { ToneSheet } from '@/components/settings/ToneSheet';
import { WakeTimeSheet } from '@/components/settings/WakeTimeSheet';
import { commonCopy, devCopy, guardCopy, settingsCopy } from '@/copy';
import { db, setArcWakeTime } from '@/db';
import { DevPanel } from '@/dev/DevPanel';
import { getArcPosition, OATH_PLAYBACK_DAY } from '@/features/arc';
import { DEFAULT_WAKE_MINUTES } from '@/features/orders';
import { useActiveArc } from '@/hooks/useActiveArc';
import { useOathPlayer } from '@/hooks/useOathPlayer';
import { useResetJourney } from '@/hooks/useResetJourney';
import { useToday } from '@/hooks/useToday';
import { formatClockMinutes, parseClockMinutes, toClockString } from '@/lib/dates';
import { toRoman } from '@/lib/toRoman';
import {
  GHOST_OPACITY_MAX,
  IS_DEV_MODE_AVAILABLE,
  useDevStore,
  useGuardStore,
  usePreferencesStore,
} from '@/stores';
import { useThemeControls } from '@/theme';

type OpenSheet = 'tone' | 'colorMode' | 'outline' | 'wakeTime' | 'retreat' | null;

const rows = settingsCopy.rows;

/** Castra: settings. How Vinco looks, sounds and talks; the day's setup; the journey. */
export default function SettingsScreen() {
  const today = useToday();
  const tone = usePreferencesStore((state) => state.tone);
  const setTone = usePreferencesStore((state) => state.setTone);
  const ghostOpacity = usePreferencesStore((state) => state.ghostOpacity);
  const setGhostOpacity = usePreferencesStore((state) => state.setGhostOpacity);
  const { preferences, setColorMode, setSoundEnabled, setHapticsEnabled } = useThemeControls();
  const { arc, targets } = useActiveArc();
  const oath = useOathPlayer(arc?.oathPath ?? null);
  const resetJourney = useResetJourney();
  const isDevModeOn = useDevStore((state) => state.isDevModeOn);
  const setDevModeOn = useDevStore((state) => state.setDevModeOn);
  const guardLevel = useGuardStore((state) => state.level);
  const aurora = useGuardStore((state) => state.aurora);
  const [openSheet, setOpenSheet] = useState<OpenSheet>(null);
  const close = () => setOpenSheet(null);

  const position = arc ? getArcPosition(arc.startDay, arc.lengthDays, today) : null;
  const dayNumber =
    position?.phase === 'active'
      ? position.dayNumber
      : position?.phase === 'finished'
        ? (arc?.lengthDays ?? 1)
        : 1;
  const canPlayOath = oath.isAvailable && dayNumber >= OATH_PLAYBACK_DAY;
  const oathValue = !oath.isAvailable
    ? rows.oathNone
    : !canPlayOath
      ? rows.oathSealed(toRoman(OATH_PLAYBACK_DAY))
      : oath.isPlaying
        ? rows.oathStop
        : rows.oathListen;
  const wakeMinutes = (arc ? parseClockMinutes(arc.wakeTime) : null) ?? DEFAULT_WAKE_MINUTES;

  const saveWakeTime = (minutes: number): boolean => {
    if (!arc) return false;
    try {
      setArcWakeTime(db, arc.id, toClockString(minutes));
      return true;
    } catch (error) {
      if (__DEV__) console.warn('[settings] Could not save the wake time.', error);
      return false;
    }
  };

  return (
    <>
      <Screen>
        <ScreenHeader eyebrow={settingsCopy.eyebrow} title={settingsCopy.title} />

        <SettingsGroup title={settingsCopy.sections.you}>
          <SettingsRow
            label={rows.tone}
            value={commonCopy.toneNames[tone]}
            onPress={() => setOpenSheet('tone')}
          />
          <SettingsRow
            label={rows.colorMode}
            value={settingsCopy.colorModes[preferences.colorMode]}
            onPress={() => setOpenSheet('colorMode')}
          />
          <SettingsRow
            label={rows.sound}
            detail={rows.soundDetail}
            toggle={{ value: preferences.soundEnabled, onChange: setSoundEnabled }}
          />
          <SettingsRow
            label={rows.haptics}
            toggle={{ value: preferences.hapticsEnabled, onChange: setHapticsEnabled }}
          />
          <SettingsRow
            label={rows.outline}
            value={rows.outlineValue(Math.round(ghostOpacity * 100))}
            onPress={() => setOpenSheet('outline')}
          />
        </SettingsGroup>

        {arc ? (
          <SettingsGroup title={settingsCopy.sections.day}>
            <SettingsRow label={rows.plan} value={rows.planValue} onPress={() => router.push('/plan')} />
            <SettingsRow
              label={rows.wakeTime}
              value={formatClockMinutes(wakeMinutes)}
              onPress={() => setOpenSheet('wakeTime')}
            />
          </SettingsGroup>
        ) : null}

        <SettingsGroup title={settingsCopy.sections.guard}>
          <SettingsRow
            label={guardCopy.settings.level}
            value={guardCopy.levels.names[guardLevel].plain}
            onPress={() => router.push('/guard')}
          />
          <SettingsRow
            label={guardCopy.settings.aurora}
            value={aurora.isOn ? formatClockMinutes(aurora.minutes) : guardCopy.settings.auroraOff}
            onPress={() => router.push('/aurora')}
          />
        </SettingsGroup>

        {arc ? (
          <SettingsGroup title={settingsCopy.sections.oath}>
            <SettingsRow
              label={rows.oath}
              value={oathValue}
              onPress={canPlayOath ? oath.toggle : undefined}
            />
          </SettingsGroup>
        ) : null}

        <SettingsGroup title={settingsCopy.sections.about}>
          <SettingsRow label={rows.version} value={Constants.expoConfig?.version ?? '1.0.0'} />
          {IS_DEV_MODE_AVAILABLE ? (
            <SettingsRow label={rows.devMode} toggle={{ value: isDevModeOn, onChange: setDevModeOn }} />
          ) : null}
        </SettingsGroup>

        {arc ? (
          <SettingsGroup title={settingsCopy.sections.journey}>
            <SettingsRow
              label={rows.retreat}
              value={rows.retreatValue}
              onPress={() => setOpenSheet('retreat')}
            />
          </SettingsGroup>
        ) : null}

        {IS_DEV_MODE_AVAILABLE && isDevModeOn ? (
          <>
            <SectionHeader title={devCopy.section} />
            <DevPanel targets={arc ? targets : null} />
          </>
        ) : null}
      </Screen>

      <ToneSheet visible={openSheet === 'tone'} onClose={close} tone={tone} onChange={setTone} />
      <AppearanceSheet
        visible={openSheet === 'colorMode'}
        onClose={close}
        colorMode={preferences.colorMode}
        onChange={setColorMode}
      />
      <OutlineSheet
        visible={openSheet === 'outline'}
        onClose={close}
        opacity={ghostOpacity}
        max={GHOST_OPACITY_MAX}
        onChange={setGhostOpacity}
      />
      <WakeTimeSheet
        visible={openSheet === 'wakeTime'}
        onClose={close}
        minutes={wakeMinutes}
        onSave={saveWakeTime}
      />
      <RetreatSheet
        visible={openSheet === 'retreat'}
        onClose={close}
        onConfirm={() => {
          resetJourney('journey');
          close();
        }}
      />
    </>
  );
}
