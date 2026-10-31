import { View } from 'react-native';

import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { Txt } from '@/components/Txt';
import { focusCopy } from '@/copy';
import { FOCUS_RULES, type FocusComes } from '@/features/focus';
import { createStyles, useTheme } from '@/theme';

import { AppGlyph } from './AppGlyph';

export type ComitesRowProps = {
  comites: readonly FocusComes[];
  /** Opens the picker (from an empty "+" slot or a chosen app). */
  onOpenPicker: () => void;
};

const copy = focusCopy.comites;

/**
 * The Comites ("your companions"): the Phone app, always allowed, then three slots. A chosen app
 * shows its icon; an empty slot shows "+". Any slot opens the picker.
 */
export function ComitesRow({ comites, onOpenPicker }: ComitesRowProps) {
  const theme = useTheme();
  const styles = useStyles();
  const glyph = theme.layout.iconTileSize + theme.space.sm;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.slot} accessible accessibilityLabel={copy.phone}>
          <AppGlyph themeIcon="phone" label={copy.phone} size={glyph} />
          <Txt variant="micro" numberOfLines={1}>
            {copy.phone}
          </Txt>
        </View>
        {Array.from({ length: FOCUS_RULES.maxComites }, (_, index) => {
          const comes = comites[index];
          return (
            <PressableScale
              key={comes?.packageName ?? `empty-${index}`}
              scaleTo="card"
              accessibilityRole="button"
              accessibilityLabel={comes ? copy.remove(comes.label) : copy.add}
              onPress={onOpenPicker}
              containerStyle={styles.cell}
              style={styles.slot}
            >
              {comes ? (
                <AppGlyph icon={comes.icon} label={comes.label} size={glyph} />
              ) : (
                <View style={[styles.empty, { width: glyph, height: glyph, borderRadius: glyph * 0.28 }]}>
                  <Icon name="plus" color="textMuted" size={theme.layout.iconSizeSmall} />
                </View>
              )}
              <Txt variant="micro" numberOfLines={1}>
                {comes ? comes.label : copy.add}
              </Txt>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  wrap: { gap: theme.space.sm },
  row: { flexDirection: 'row', gap: theme.space.sm },
  cell: { flex: 1 },
  slot: {
    flex: 1,
    alignItems: 'center',
    gap: theme.space.xs,
    minHeight: theme.layout.minTouchTarget,
    paddingVertical: theme.space.sm,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: theme.layout.borderWidth,
    borderStyle: 'dashed',
    borderColor: theme.colors.borderStrong,
  },
}));
