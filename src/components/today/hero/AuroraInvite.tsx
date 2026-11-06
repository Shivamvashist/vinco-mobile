import { View } from 'react-native';

import { auroraSetupCopy, pickTone } from '@/copy';
import { usePreferencesStore } from '@/stores';
import { cardSurface, createStyles, useTheme } from '@/theme';

import { Glow } from '../../Glow';
import { Icon } from '../../Icon';
import { IconButton } from '../../IconButton';
import { PressableScale } from '../../PressableScale';
import { Txt } from '../../Txt';

export type AuroraInviteProps = {
  /** Opens the setup flow. */
  onOpen: () => void;
  /** "Not now": hides the invite for good. */
  onDismiss: () => void;
};

const copy = auroraSetupCopy.invite;

/**
 * A slim strip under the Dies card while Aurora (the alarm) is off and never set up: the alarm
 * glyph, one line in the user's tone and "Set up" in gold open the setup flow; the cross beside it
 * says "Not now" for good. Same surface and glow as the hero, so it reads as part of it.
 */
export function AuroraInvite({ onOpen, onDismiss }: AuroraInviteProps) {
  const theme = useTheme();
  const styles = useStyles();
  const tone = usePreferencesStore((state) => state.tone);
  const line = pickTone(copy.line, tone);

  return (
    <View style={styles.strip}>
      <Glow color="accent" intensity={0.35} origin="bottomLeft" />
      <PressableScale
        scaleTo="card"
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`${line} ${copy.action}`}
        accessibilityHint={copy.hint}
        style={styles.open}
        containerStyle={styles.flex}
      >
        <View style={styles.glyph}>
          <Icon name="alarm" size={theme.layout.iconSizeSmall} color="accent" strokeWidth={2} />
        </View>
        <Txt variant="caption" color="text" style={styles.flex}>
          {line}
        </Txt>
        <View style={styles.action}>
          <Txt variant="label" color="accent">
            {copy.action}
          </Txt>
          <Icon name="forward" size={theme.layout.iconSizeSmall} color="accent" strokeWidth={2} />
        </View>
      </PressableScale>
      <IconButton
        icon="close"
        color="textMuted"
        cue="stepDown"
        accessibilityLabel={copy.dismiss}
        onPress={onDismiss}
      />
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    ...cardSurface(theme),
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    paddingRight: theme.space.xxs,
  },
  flex: { flex: 1 },
  open: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
    minHeight: theme.layout.minTouchTarget,
    paddingVertical: theme.space.sm,
    paddingLeft: theme.layout.cardPadding,
  },
  glyph: {
    width: theme.layout.iconTileSize,
    height: theme.layout.iconTileSize,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceSunk,
  },
  action: { flexDirection: 'row', alignItems: 'center', gap: theme.space.xxs },
}));
