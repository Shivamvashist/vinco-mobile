/**
 * DEV ONLY: a bench for checking the design system on a real phone.
 * Shows every text style, every colour role, plays every feedback cue, and switches tone.
 * Not user-facing, so its labels are not in src/copy. Redirects away in production builds.
 */
import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { commonCopy } from '@/copy';
import { TONES } from '@/features/tone';
import { KitGallery } from '@/dev/KitGallery';
import { IS_DEV_MODE_AVAILABLE, usePreferencesStore } from '@/stores';
import {
  createStyles,
  useFeedback,
  useTheme,
  useThemeControls,
  type ColorMode,
  type ColorRole,
  type FeedbackCue,
  type TextVariant,
} from '@/theme';

const TEXT_VARIANTS: TextVariant[] = [
  'hero',
  'numeral',
  'display',
  'title',
  'heading',
  'headingSmall',
  'quote',
  'eyebrow',
  'bodyLarge',
  'body',
  'label',
  'labelSmall',
  'button',
  'caption',
  'overline',
  'micro',
];

const FEEDBACK_CUES: FeedbackCue[] = [
  'tap',
  'select',
  'toggle',
  'stepUp',
  'stepDown',
  'win',
  'stamp',
  'cross',
  'chime',
  'confirm',
  'recordStart',
  'recordStop',
  'shutter',
  'seal',
  'rise',
  'truce',
  'denied',
];

const COLOR_MODES: ColorMode[] = ['dark', 'light', 'system'];

export default function ThemeLab() {
  if (!IS_DEV_MODE_AVAILABLE) return <Redirect href="/" />;
  return <ThemeLabContent />;
}

function ThemeLabContent() {
  const theme = useTheme();
  const styles = useStyles();
  const play = useFeedback();
  const { preferences, setColorMode, setSoundEnabled, setHapticsEnabled } = useThemeControls();
  const tone = usePreferencesStore((state) => state.tone);
  const setTone = usePreferencesStore((state) => state.setTone);
  const colorRoles = Object.keys(theme.colors) as ColorRole[];

  return (
    <Screen>
      <Txt variant="eyebrow">Theme lab · dev only</Txt>
      <Txt variant="hero">VINCO</Txt>
      <Txt variant="caption">
        {theme.name} theme · {theme.scheme} scheme
      </Txt>

      <Section title="Controls">
        <View style={styles.row}>
          {COLOR_MODES.map((mode) => (
            <Chip
              key={mode}
              label={mode}
              selected={preferences.colorMode === mode}
              onPress={() => {
                play('toggle');
                setColorMode(mode);
              }}
            />
          ))}
        </View>
        <View style={styles.row}>
          {TONES.map((option) => (
            <Chip
              key={option}
              label={commonCopy.toneNames[option]}
              selected={tone === option}
              onPress={() => {
                play('select');
                setTone(option);
              }}
            />
          ))}
        </View>
        <View style={styles.row}>
          <Chip
            label={preferences.soundEnabled ? 'Sound on' : 'Sound off'}
            selected={preferences.soundEnabled}
            onPress={() => setSoundEnabled(!preferences.soundEnabled)}
          />
          <Chip
            label={preferences.hapticsEnabled ? 'Haptics on' : 'Haptics off'}
            selected={preferences.hapticsEnabled}
            onPress={() => setHapticsEnabled(!preferences.hapticsEnabled)}
          />
        </View>
      </Section>

      <Section title="Feedback cues">
        <View style={styles.row}>
          {FEEDBACK_CUES.map((cue) => (
            <Chip key={cue} label={cue} onPress={() => play(cue)} />
          ))}
        </View>
      </Section>

      <Section title="UI kit">
        <KitGallery />
      </Section>

      <Section title="Type scale">
        {TEXT_VARIANTS.map((variant) => (
          <View key={variant} style={styles.typeSample}>
            <Txt variant="micro">{variant}</Txt>
            <Txt variant={variant} numberOfLines={1}>
              {variant === 'numeral' ? '12' : 'Veni, vidi, vici'}
            </Txt>
          </View>
        ))}
      </Section>

      <Section title="Colour roles">
        <View style={styles.swatchGrid}>
          {colorRoles.map((role) => (
            <View key={role} style={styles.swatch}>
              <View style={[styles.swatchColor, { backgroundColor: theme.colors[role] }]} />
              <Txt variant="micro" numberOfLines={1}>
                {role}
              </Txt>
            </View>
          ))}
        </View>
      </Section>
    </Screen>
  );
}

type SectionProps = {
  title: string;
  children: ReactNode;
};

function Section({ title, children }: SectionProps) {
  const styles = useStyles();
  return (
    <View style={styles.section}>
      <Txt variant="overline">{title}</Txt>
      {children}
    </View>
  );
}

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress: () => void;
};

function Chip({ label, selected = false, onPress }: ChipProps) {
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.chipPressed]}
    >
      <Txt variant="labelSmall" color={selected ? 'accent' : 'text'}>
        {label}
      </Txt>
    </Pressable>
  );
}

const useStyles = createStyles((theme) => ({
  section: {
    marginTop: theme.space.xxl,
    gap: theme.space.sm,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space.sm,
  },
  chip: {
    minHeight: theme.layout.minTouchTarget,
    paddingHorizontal: theme.space.lg,
    borderRadius: theme.radius.pill,
    borderWidth: theme.layout.borderWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceSunk,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.accentTint,
  },
  chipPressed: {
    opacity: 0.7,
  },
  typeSample: {
    paddingVertical: theme.space.xs,
    borderBottomWidth: theme.layout.hairline,
    borderBottomColor: theme.colors.border,
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space.md,
  },
  swatch: {
    width: 72,
    gap: theme.space.xs,
  },
  swatchColor: {
    height: 44,
    borderRadius: theme.radius.sm,
    borderWidth: theme.layout.borderWidth,
    borderColor: theme.colors.border,
  },
}));
