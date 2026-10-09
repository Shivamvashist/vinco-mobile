import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, View } from 'react-native';

import { isTabName, tabAccessibilityLabel, tabsCopy } from '@/copy';
import { createStyles, useFeedback } from '@/theme';

import { Txt } from '../Txt';

/**
 * The Veni / Vidi / Vici tab bar: the Latin word over its plain label, gold on the active tab.
 * Only routes named in tabsCopy are shown, so a stray file in (tabs) can't break the bar.
 * Re-tapping the active tab emits tabPress, which Screen uses to scroll back to the top.
 */
export function TabBar({ state, navigation, insets }: BottomTabBarProps) {
  const styles = useStyles();
  const play = useFeedback();

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom }]} accessibilityRole="tablist">
      {state.routes.map((route, index) => {
        if (!isTabName(route.name)) return null;
        const tab = tabsCopy[route.name];
        const isFocused = state.index === index;

        const handlePress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (isFocused || event.defaultPrevented) return;
          play('toggle');
          navigation.navigate(route.name, route.params);
        };

        const handleLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={tabAccessibilityLabel(route.name)}
            onPress={handlePress}
            onLongPress={handleLongPress}
            style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
          >
            <Txt variant="headingSmall" color={isFocused ? 'text' : 'textMuted'} numberOfLines={1}>
              {tab.latin}
            </Txt>
            <Txt
              variant="micro"
              color={isFocused ? 'accent' : 'textMuted'}
              style={isFocused ? styles.plainActive : undefined}
              numberOfLines={1}
            >
              {tab.plain}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  bar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background,
    borderTopWidth: theme.layout.hairline,
    borderTopColor: theme.colors.border,
  },
  item: {
    flex: 1,
    height: theme.layout.tabBarHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemPressed: { opacity: 0.7 },
  plainActive: { fontFamily: theme.fonts.bodySemiBold },
}));
