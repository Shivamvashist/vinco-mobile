import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { type TabName, todayCopy } from '@/copy';
import { useActiveArc } from '@/hooks/useActiveArc';
import { useToday } from '@/hooks/useToday';
import { createStyles, useFeedback } from '@/theme';

import { HudCounters } from '../hud/HudCounters';
import { Icon } from '../Icon';
import { UserMenu } from '../menu/UserMenu';
import { ScreenHeader } from '../ScreenHeader';
import { describeTabHeader } from './describeTabHeader';

export type TabsHeaderProps = {
  /** The tab on screen: only the left side (eyebrow and title) follows it. */
  tab: TabName;
};

/**
 * The one header above all three tabs. It sits outside the sliding pages, so it never moves on a
 * tab change: the left side swaps its words in place, the right side (the HUD counters and the
 * user button) is the same everywhere. One header also means one set of counters reading the
 * records, instead of one per tab.
 */
export function TabsHeader({ tab }: TabsHeaderProps) {
  const styles = useStyles();
  const play = useFeedback();
  const today = useToday();
  const { arc } = useActiveArc();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const text = describeTabHeader(tab, arc, today);

  return (
    <SafeAreaView edges={['top']} style={styles.bar}>
      <ScreenHeader
        eyebrow={text.eyebrow}
        title={text.title}
        accessory={
          <View style={styles.tools}>
            <HudCounters />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={todayCopy.menuLabel}
              onPress={() => {
                play('tap');
                setIsMenuOpen(true);
              }}
              style={({ pressed }) => [styles.userButton, pressed && styles.pressed]}
            >
              <Icon name="user" color="accent" />
            </Pressable>
          </View>
        }
      />
      <UserMenu visible={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </SafeAreaView>
  );
}

const useStyles = createStyles((theme) => ({
  bar: {
    paddingHorizontal: theme.layout.screenGutter,
    paddingTop: theme.space.xl,
    paddingBottom: theme.space.md,
    backgroundColor: theme.colors.background,
  },
  tools: { flexDirection: 'row', alignItems: 'center', gap: theme.space.sm },
  userButton: {
    width: theme.layout.minTouchTarget,
    height: theme.layout.minTouchTarget,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: theme.layout.borderWidth,
    borderColor: theme.colors.accentBorder,
    backgroundColor: theme.colors.accentTint,
  },
  pressed: { opacity: 0.8 },
}));
