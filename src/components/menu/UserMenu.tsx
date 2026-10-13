import { type Href, router } from 'expo-router';
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { menuCopy } from '@/copy';
import { useActiveArc } from '@/hooks/useActiveArc';
import { useOath } from '@/hooks/useOath';
import { useToday } from '@/hooks/useToday';
import { createStyles, useFeedback, useReduceMotion, useTheme } from '@/theme';

import { Icon, type IconName } from '../Icon';
import { Txt } from '../Txt';

export type UserMenuProps = {
  visible: boolean;
  onClose: () => void;
};

/** The menu never gets wider than this, and keeps a gutter on narrow phones. */
const MAX_WIDTH = 340;

type Item = { key: keyof typeof menuCopy.items; icon: IconName; href: Href };

const ITEMS: readonly Item[] = [
  { key: 'settings', icon: 'settings', href: '/settings' },
  { key: 'plan', icon: 'list', href: '/plan' },
  { key: 'permissions', icon: 'key', href: '/permissions' },
  { key: 'guard', icon: 'shield', href: '/guard' },
  { key: 'aurora', icon: 'alarm', href: '/aurora' },
  { key: 'forum', icon: 'coin', href: '/forum' },
];

/**
 * The menu behind the user button on Today: the account, then everything that used to be the
 * Settings tab. Drops down from the top right; tap outside or Back to close.
 */
export function UserMenu({ visible, onClose }: UserMenuProps) {
  const theme = useTheme();
  const styles = useStyles();
  const play = useFeedback();
  const reduceMotion = useReduceMotion();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const today = useToday();
  const { arc } = useActiveArc();
  const oath = useOath(arc?.oathPath ?? null, today);
  const copy = menuCopy;

  const go = (href: Href) => {
    play('tap');
    onClose();
    router.push(href);
  };

  const oathDetail = !oath.isAvailable
    ? copy.oath.none
    : oath.isPlaying
      ? copy.oath.stop
      : oath.playsLeft > 0
        ? copy.oath.listen(oath.playsLeft)
        : copy.oath.usedUp;

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={StyleSheet.absoluteFill} accessibilityLabel={copy.close} onPress={onClose}>
        <Animated.View
          entering={reduceMotion ? undefined : FadeIn.duration(140)}
          exiting={reduceMotion ? undefined : FadeOut.duration(120)}
          style={[StyleSheet.absoluteFill, styles.scrim]}
        />
      </Pressable>
      <Animated.View
        entering={reduceMotion ? undefined : FadeIn.duration(160)}
        style={[
          styles.card,
          {
            top: insets.top + theme.space.huge + theme.space.md,
            right: theme.layout.screenGutter,
            width: Math.min(MAX_WIDTH, width - theme.layout.screenGutter * 2),
          },
        ]}
        accessibilityViewIsModal
      >
        <View style={styles.account}>
          <View style={styles.avatar}>
            <Icon name="user" color="accent" />
          </View>
          <View style={styles.text}>
            <Txt variant="label" accessibilityRole="header">
              {copy.account.name}
            </Txt>
            <Txt variant="caption">{copy.account.status}</Txt>
            <Txt variant="micro">{copy.account.detail}</Txt>
          </View>
        </View>

        <View style={styles.divider} />

        {ITEMS.map((item) => (
          <MenuRow
            key={item.key}
            icon={item.icon}
            label={copy.items[item.key].label}
            detail={copy.items[item.key].detail}
            onPress={() => go(item.href)}
          />
        ))}
        <MenuRow
          icon="mic"
          label={copy.oath.label}
          detail={oathDetail}
          isDisabled={!oath.isAvailable || (!oath.isPlaying && oath.playsLeft === 0)}
          onPress={() => {
            play(oath.isPlaying ? 'stepDown' : 'tap');
            oath.toggle();
          }}
        />
      </Animated.View>
    </Modal>
  );
}

type MenuRowProps = {
  icon: IconName;
  label: string;
  detail: string;
  isDisabled?: boolean;
  onPress: () => void;
};

function MenuRow({ icon, label, detail, isDisabled = false, onPress }: MenuRowProps) {
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${detail}`}
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed, isDisabled && styles.disabled]}
    >
      <Icon name={icon} color="textMuted" />
      <View style={styles.text}>
        <Txt variant="label" numberOfLines={1}>
          {label}
        </Txt>
        <Txt variant="micro" numberOfLines={1}>
          {detail}
        </Txt>
      </View>
    </Pressable>
  );
}

const useStyles = createStyles((theme) => ({
  scrim: { backgroundColor: theme.colors.scrim },
  card: {
    position: 'absolute',
    paddingVertical: theme.space.sm,
    borderRadius: theme.radius.lg,
    borderWidth: theme.layout.borderWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceRaised,
  },
  account: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.sm,
  },
  avatar: {
    width: theme.layout.minTouchTarget,
    height: theme.layout.minTouchTarget,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accentSoft,
  },
  divider: {
    height: theme.layout.hairline,
    backgroundColor: theme.colors.border,
    marginVertical: theme.space.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    minHeight: theme.layout.minTouchTarget + theme.space.xs,
    paddingHorizontal: theme.space.lg,
  },
  text: { flex: 1, minWidth: 0 },
  pressed: { backgroundColor: theme.colors.surface },
  disabled: { opacity: 0.5 },
}));
