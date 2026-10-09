import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { ArcJourney } from '@/components/arc/ArcJourney';
import { RankCard } from '@/components/arc/RankCard';
import { RetreatSheet } from '@/components/arc/RetreatSheet';
import { SettingsRow } from '@/components/arc/SettingsRow';
import { BottomSheet } from '@/components/BottomSheet';
import { Icon, type IconName } from '@/components/Icon';
import { OptionCard } from '@/components/OptionCard';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionHeader } from '@/components/SectionHeader';
import { ToneLine } from '@/components/ToneLine';
import { Txt } from '@/components/Txt';
import { arcCopy, commonCopy, devCopy, onboardingCopy, pickTone } from '@/copy';
import { FEATURES } from '@/config/features';
import { DevPanel } from '@/dev/DevPanel';
import { arcEndDay, getArcPosition, isArcLength, OATH_PLAYBACK_DAY } from '@/features/arc';
import { TRUCES } from '@/features/campaign';
import { type Tone, TONES } from '@/features/tone';
import { useActiveArc } from '@/hooks/useActiveArc';
import { useCampaign } from '@/hooks/useCampaign';
import { useOathPlayer } from '@/hooks/useOathPlayer';
import { useResetJourney } from '@/hooks/useResetJourney';
import { useToday } from '@/hooks/useToday';
import { toRoman } from '@/lib/toRoman';
import { IS_DEV_MODE_AVAILABLE, useDevStore, usePreferencesStore } from '@/stores';
import { type ColorMode, createStyles, useThemeControls } from '@/theme';

const TONE_ICONS: Record<Tone, IconName> = { philosopher: 'book', centurion: 'helmet', roast: 'flame' };
const COLOR_MODES: ColorMode[] = ['dark', 'light', 'system'];

type OpenSheet = 'tone' | 'colorMode' | 'truces' | 'retreat' | null;

/** Vici: the arc. Journey, rank and settings. */
export default function ViciScreen() {
  const styles = useStyles();
  const today = useToday();
  const tone = usePreferencesStore((state) => state.tone);
  const setTone = usePreferencesStore((state) => state.setTone);
  const { preferences, setColorMode, setSoundEnabled, setHapticsEnabled } = useThemeControls();
  const { arc, targets, isLoaded } = useActiveArc();
  const campaign = useCampaign(arc, targets, today);
  const oath = useOathPlayer(arc?.oathPath ?? null);
  const resetJourney = useResetJourney();
  const isDevModeOn = useDevStore((state) => state.isDevModeOn);
  const setDevModeOn = useDevStore((state) => state.setDevModeOn);
  const [openSheet, setOpenSheet] = useState<OpenSheet>(null);

  const position = arc ? getArcPosition(arc.startDay, arc.lengthDays, today) : null;
  const dayNumber =
    position?.phase === 'active'
      ? position.dayNumber
      : position?.phase === 'finished'
        ? (arc?.lengthDays ?? 1)
        : 1;

  const title = arc
    ? isArcLength(arc.lengthDays)
      ? arcCopy.names[arc.lengthDays]
      : arcCopy.fallbackName
    : arcCopy.title;
  const caption = arc
    ? position?.phase === 'finished'
      ? arcCopy.datesFinished(
          commonCopy.dayLabel(arc.startDay, today),
          commonCopy.dayLabel(arcEndDay(arc.startDay, arc.lengthDays), today),
        )
      : arcCopy.dates(
          commonCopy.dayLabel(arc.startDay, today),
          commonCopy.dayLabel(arcEndDay(arc.startDay, arc.lengthDays), today),
          toRoman(dayNumber),
          toRoman(arc.lengthDays),
        )
    : undefined;

  const oathValue = !oath.isAvailable
    ? arcCopy.settings.oathNone
    : dayNumber < OATH_PLAYBACK_DAY
      ? arcCopy.settings.oathSealed(toRoman(OATH_PLAYBACK_DAY))
      : oath.isPlaying
        ? arcCopy.settings.oathStop
        : arcCopy.settings.oathListen;
  const canPlayOath = oath.isAvailable && dayNumber >= OATH_PLAYBACK_DAY;

  return (
    <>
      <Screen>
        <ScreenHeader eyebrow={arcCopy.eyebrow} title={title} caption={caption} />

        {arc ? (
          <>
            <View style={styles.journey}>
              <ArcJourney
                dayNumber={dayNumber}
                lengthDays={arc.lengthDays}
                accessibilityLabel={arcCopy.journeyLabel(dayNumber, arc.lengthDays)}
              />
            </View>
            <View style={styles.section}>
              <RankCard rank={campaign.rank} denarii={campaign.denarii} />
            </View>
          </>
        ) : isLoaded ? (
          <View style={styles.section}>
            <ToneLine line={pickTone(arcCopy.emptyLine, tone)} tone={tone} />
          </View>
        ) : null}

        <SectionHeader title={arcCopy.settingsSection} />
        <View style={styles.settings}>
          {FEATURES.customOrders && arc ? (
            <SettingsRow
              hasDivider={false}
              label={arcCopy.settings.orders}
              value={arcCopy.settings.ordersValue}
              onPress={() => router.push('/orders')}
            />
          ) : null}
          <SettingsRow
            hasDivider={FEATURES.customOrders && arc != null}
            label={arcCopy.settings.tone}
            value={commonCopy.toneNames[tone]}
            onPress={() => setOpenSheet('tone')}
          />
          <SettingsRow
            label={arcCopy.settings.colorMode}
            value={arcCopy.colorModes[preferences.colorMode]}
            onPress={() => setOpenSheet('colorMode')}
          />
          <SettingsRow
            label={arcCopy.settings.sound}
            toggle={{ value: preferences.soundEnabled, onChange: setSoundEnabled }}
          />
          <SettingsRow
            label={arcCopy.settings.haptics}
            toggle={{ value: preferences.hapticsEnabled, onChange: setHapticsEnabled }}
          />
          {arc ? (
            <>
              <SettingsRow
                label={arcCopy.settings.truces}
                value={String(campaign.truceReserve)}
                onPress={() => setOpenSheet('truces')}
              />
              <SettingsRow
                label={arcCopy.settings.oath}
                value={oathValue}
                onPress={canPlayOath ? oath.toggle : undefined}
              />
              <SettingsRow
                label={arcCopy.settings.retreat}
                value={arcCopy.settings.retreatValue}
                onPress={() => setOpenSheet('retreat')}
              />
            </>
          ) : null}
          {IS_DEV_MODE_AVAILABLE ? (
            <SettingsRow
              label={arcCopy.settings.devMode}
              toggle={{ value: isDevModeOn, onChange: setDevModeOn }}
            />
          ) : null}
        </View>

        {IS_DEV_MODE_AVAILABLE && isDevModeOn ? (
          <>
            <SectionHeader title={devCopy.section} />
            <DevPanel targets={arc ? targets : null} />
          </>
        ) : null}
      </Screen>

      <BottomSheet
        visible={openSheet === 'tone'}
        onClose={() => setOpenSheet(null)}
        title={arcCopy.sheets.tone}
      >
        <View style={styles.sheetOptions} accessibilityRole="radiogroup">
          {TONES.map((option) => (
            <OptionCard
              key={option}
              title={commonCopy.toneNames[option]}
              description={onboardingCopy.tone.descriptions[option]}
              selected={option === tone}
              onPress={() => setTone(option)}
              leading={<Icon name={TONE_ICONS[option]} color={option === tone ? 'accent' : 'textMuted'} />}
            />
          ))}
        </View>
      </BottomSheet>

      <BottomSheet
        visible={openSheet === 'colorMode'}
        onClose={() => setOpenSheet(null)}
        title={arcCopy.sheets.colorMode}
      >
        <View style={styles.sheetOptions} accessibilityRole="radiogroup">
          {COLOR_MODES.map((mode) => (
            <OptionCard
              key={mode}
              title={arcCopy.colorModes[mode]}
              selected={preferences.colorMode === mode}
              onPress={() => setColorMode(mode)}
            />
          ))}
        </View>
      </BottomSheet>

      <BottomSheet
        visible={openSheet === 'truces'}
        onClose={() => setOpenSheet(null)}
        title={arcCopy.sheets.truces(campaign.truceReserve)}
      >
        <Txt variant="body" color="textMuted">
          {arcCopy.truceInfo(TRUCES.earnedEveryCampaignDays, TRUCES.maxHeld, TRUCES.priceDenarii)}
        </Txt>
      </BottomSheet>

      <RetreatSheet
        visible={openSheet === 'retreat'}
        onClose={() => setOpenSheet(null)}
        onConfirm={() => {
          resetJourney('journey');
          setOpenSheet(null);
        }}
      />
    </>
  );
}

const useStyles = createStyles((theme) => ({
  journey: { marginTop: theme.space.xxl },
  section: { marginTop: theme.space.lg },
  settings: {
    overflow: 'hidden',
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
  },
  sheetOptions: { gap: theme.space.sm, marginTop: theme.space.md },
}));
