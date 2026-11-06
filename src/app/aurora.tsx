import { router } from 'expo-router';
import { View } from 'react-native';

import { AuroraMissionPicker } from '@/components/aurora/AuroraMissionPicker';
import { AuroraStatus } from '@/components/aurora/AuroraStatus';
import { AuroraWhen } from '@/components/aurora/AuroraWhen';
import { PreviewNotice } from '@/components/guard/PreviewNotice';
import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionHeader } from '@/components/SectionHeader';
import { SettingsGroup } from '@/components/settings/SettingsGroup';
import { SettingsRow } from '@/components/settings/SettingsRow';
import { Txt } from '@/components/Txt';
import { commonCopy, guardCopy } from '@/copy';
import { AURORA_MISSIONS, auroraBridge } from '@/features/aurora';
import { useAuroraSettings } from '@/hooks/useAuroraSettings';
import { useForum } from '@/hooks/useForum';
import { createStyles } from '@/theme';

const copy = guardCopy.aurora;

/**
 * Aurora's settings: on or off, the time, the days and the mission. In the Vinco build it shows
 * the alarm's live state on the phone; in Expo Go, the preview notice. See docs/GUARDIANS.md.
 * First-time setup has its own guided flow (/aurora-setup, from Today's invite).
 */
export default function AuroraScreen() {
  const styles = useStyles();
  const { aurora, steps, update, turn, pickMission, toggleDay } = useAuroraSettings();
  const forum = useForum();

  const back = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/settings');
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
        <SettingsRow label={copy.on} toggle={{ value: aurora.isOn, onChange: turn }} />
      </SettingsGroup>

      {aurora.isOn ? (
        <>
          <View style={styles.block}>
            <AuroraWhen
              minutes={aurora.minutes}
              days={aurora.days}
              onChangeMinutes={(minutes) => update({ minutes })}
              onToggleDay={toggleDay}
            />
          </View>

          <SectionHeader title={copy.missionLabel} />
          <AuroraMissionPicker
            missions={AURORA_MISSIONS}
            selected={aurora.mission}
            onPick={pickMission}
            steps={steps}
          />
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
  note: { marginTop: theme.space.sm },
}));
