import type { ReactNode } from 'react';
import { Linking, View } from 'react-native';

import { notify } from '@/components/notices';
import { PressableScale } from '@/components/PressableScale';
import { Txt } from '@/components/Txt';
import { focusCopy } from '@/copy';
import type { FocusComes } from '@/features/focus';
import { guardBridge } from '@/features/guard';
import { createStyles, useFeedback, useTheme } from '@/theme';

import { AppGlyph } from './AppGlyph';

export type FocusDockProps = {
  comites: readonly FocusComes[];
  /** The phone's default Phone app, when the native module knows it. */
  dialerPackage: string | null;
};

const copy = focusCopy.active;

/**
 * The dock on the running focus: the Phone app (always), then the companions, launched from here.
 * With none chosen, a "+" explains they are picked before a focus begins.
 */
export function FocusDock({ comites, dialerPackage }: FocusDockProps) {
  const theme = useTheme();
  const styles = useStyles();
  const play = useFeedback();
  const glyph = theme.layout.iconTileSize + theme.space.xs;

  const openPhone = async () => {
    play('tap');
    if (dialerPackage && (await guardBridge.launchApp(dialerPackage).catch(() => false))) return;
    // Expo Go, or no package known: the dialer by its scheme.
    Linking.openURL('tel:').catch(() => notify({ kind: 'warning', message: copy.launchFailed }));
  };

  const openComes = async (comes: FocusComes) => {
    play('tap');
    const isOpen = await guardBridge.launchApp(comes.packageName).catch(() => false);
    if (!isOpen) notify({ kind: 'warning', message: copy.launchFailed });
  };

  return (
    <View style={styles.dock} accessibilityRole="toolbar" accessibilityLabel={copy.dock}>
      <DockButton label={copy.phone} onPress={() => void openPhone()}>
        <AppGlyph themeIcon="phone" label={copy.phone} size={glyph} />
      </DockButton>
      {comites.map((comes) => (
        <DockButton key={comes.packageName} label={comes.label} onPress={() => void openComes(comes)}>
          <AppGlyph icon={comes.icon} label={comes.label} size={glyph} />
        </DockButton>
      ))}
      {comites.length === 0 ? (
        <DockButton
          label={focusCopy.comites.add}
          onPress={() => {
            play('denied');
            notify({ kind: 'info', message: copy.addExplain });
          }}
        >
          <AppGlyph themeIcon="plus" label="+" size={glyph} />
        </DockButton>
      ) : null}
    </View>
  );
}

function DockButton({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress: () => void;
  children: ReactNode;
}) {
  const styles = useStyles();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label === focusCopy.comites.add ? label : copy.open(label)}
      onPress={onPress}
      style={styles.button}
    >
      {children}
      <Txt variant="micro" numberOfLines={1} style={styles.label}>
        {label}
      </Txt>
    </PressableScale>
  );
}

const useStyles = createStyles((theme) => ({
  dock: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.space.lg,
    paddingVertical: theme.space.sm,
    paddingHorizontal: theme.space.md,
    borderRadius: theme.radius.lg,
    borderCurve: 'continuous',
    borderWidth: theme.layout.hairline,
    borderColor: theme.effects.cardBorder,
    backgroundColor: theme.colors.surface,
    alignSelf: 'center',
  },
  button: {
    alignItems: 'center',
    gap: theme.space.xxs,
    minWidth: theme.layout.minTouchTarget,
    minHeight: theme.layout.minTouchTarget,
  },
  label: { maxWidth: theme.layout.minTouchTarget + theme.space.lg },
}));
