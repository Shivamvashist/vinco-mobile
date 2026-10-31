import { useEffect, useState } from 'react';
import { FlatList, useWindowDimensions, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { TextField } from '@/components/TextField';
import { Txt } from '@/components/Txt';
import { focusCopy } from '@/copy';
import { FOCUS_RULES, type FocusComes } from '@/features/focus';
import { type FocusApp, guardBridge } from '@/features/guard';
import { createStyles, useFeedback, useTheme } from '@/theme';

import { AppGlyph } from './AppGlyph';

export type ComitesPickerProps = {
  visible: boolean;
  comites: readonly FocusComes[];
  /** Adds the app, or removes it when already chosen. */
  onToggle: (app: FocusComes) => void;
  onClose: () => void;
};

const copy = focusCopy.comites;
/** The list takes at most this share of the window, so the sheet never covers the whole screen. */
const LIST_SHARE = 0.5;

/**
 * Choose up to three companions from the phone's launchable apps (read from the native module,
 * with their icons), with a search field. In Expo Go there is no list: it says the apps arrive with
 * the Vinco build, and the Phone app is allowed anyway.
 */
export function ComitesPicker({ visible, comites, onToggle, onClose }: ComitesPickerProps) {
  const theme = useTheme();
  const styles = useStyles();
  const play = useFeedback();
  const { height } = useWindowDimensions();
  const [apps, setApps] = useState<FocusApp[] | null>(null);
  const [query, setQuery] = useState('');
  const isFull = comites.length >= FOCUS_RULES.maxComites;

  useEffect(() => {
    if (!visible || !guardBridge.isSupported) return;
    let isMounted = true;
    guardBridge
      .listLaunchableApps()
      .then((list) => {
        if (isMounted) setApps(list);
      })
      .catch((error: unknown) => {
        if (__DEV__) console.warn('[focus] Could not list the apps.', error);
        if (isMounted) setApps([]);
      });
    return () => {
      isMounted = false;
    };
  }, [visible]);

  const needle = query.trim().toLowerCase();
  const shown = (apps ?? []).filter((app) => needle === '' || app.label.toLowerCase().includes(needle));

  return (
    <BottomSheet visible={visible} onClose={onClose} title={copy.pickerTitle}>
      <View style={styles.body}>
        {!guardBridge.isSupported ? (
          <View style={styles.notice}>
            <Icon name="lock" color="textMuted" size={theme.layout.iconSizeSmall} />
            <Txt variant="body" color="textMuted" style={styles.noticeText}>
              {copy.unsupported}
            </Txt>
          </View>
        ) : (
          <>
            <TextField label={copy.search} value={query} onChangeText={setQuery} autoCapitalize="none" />
            <Txt variant="caption" color={isFull ? 'accent' : 'textMuted'} accessibilityLiveRegion="polite">
              {isFull ? copy.full : copy.chosen(comites.length)}
            </Txt>
            {apps == null ? (
              <Txt variant="body" color="textMuted">
                {copy.loading}
              </Txt>
            ) : (
              <FlatList
                data={shown}
                keyExtractor={(app) => app.packageName}
                style={{ maxHeight: height * LIST_SHARE }}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <Txt variant="body" color="textMuted">
                    {copy.empty}
                  </Txt>
                }
                renderItem={({ item }) => {
                  const isChosen = comites.some((comes) => comes.packageName === item.packageName);
                  const isLocked = !isChosen && isFull;
                  return (
                    <PressableScale
                      scaleTo="row"
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isChosen, disabled: isLocked }}
                      accessibilityLabel={item.label}
                      onPress={() => {
                        if (isLocked) {
                          play('denied');
                          return;
                        }
                        play(isChosen ? 'toggle' : 'select');
                        onToggle(item);
                      }}
                      style={[styles.row, isLocked && styles.locked]}
                    >
                      <AppGlyph icon={item.icon} label={item.label} size={theme.layout.iconTileSize} />
                      <Txt variant="label" numberOfLines={1} style={styles.label}>
                        {item.label}
                      </Txt>
                      <View style={[styles.check, isChosen && styles.checkOn]}>
                        {isChosen ? (
                          <Icon
                            name="check"
                            color="onAccent"
                            size={theme.layout.iconSizeSmall}
                            strokeWidth={2.4}
                          />
                        ) : null}
                      </View>
                    </PressableScale>
                  );
                }}
              />
            )}
          </>
        )}
        <Button label={copy.done} onPress={onClose} variant="secondary" cue={null} />
      </View>
    </BottomSheet>
  );
}

const useStyles = createStyles((theme) => ({
  body: { gap: theme.space.md },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.space.sm,
    padding: theme.space.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceSunk,
  },
  noticeText: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    minHeight: theme.layout.minTouchTarget,
    paddingVertical: theme.space.xs,
  },
  locked: { opacity: 0.45 },
  label: { flex: 1 },
  check: {
    width: theme.layout.statusCircleSize - theme.space.xs,
    height: theme.layout.statusCircleSize - theme.space.xs,
    borderRadius: theme.radius.pill,
    borderWidth: theme.layout.borderWidthStrong,
    borderColor: theme.colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { borderColor: theme.colors.accent, backgroundColor: theme.colors.accent },
}));
