import { Image } from 'expo-image';
import { View } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { Txt } from '@/components/Txt';
import { createStyles } from '@/theme';

export type AppGlyphProps = {
  /** The app's icon (a PNG data URI from the phone), a theme icon, or neither (its first letter). */
  icon?: string | null;
  themeIcon?: IconName;
  label: string;
  size: number;
};

/** An app's face in the Comites row, the picker and the dock. Decorative: the caller labels it. */
export function AppGlyph({ icon, themeIcon, label, size }: AppGlyphProps) {
  const styles = useStyles();
  const frame = { width: size, height: size, borderRadius: size * 0.28 };
  if (icon) {
    return <Image source={{ uri: icon }} style={frame} contentFit="cover" accessible={false} />;
  }
  return (
    <View style={[styles.fallback, frame]} importantForAccessibility="no-hide-descendants">
      {themeIcon ? (
        <Icon name={themeIcon} size={size * 0.5} color="accent" strokeWidth={2} />
      ) : (
        <Txt variant="label" color="textMuted">
          {label.trim().charAt(0).toUpperCase() || '?'}
        </Txt>
      )}
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceRaised,
    borderWidth: theme.layout.hairline,
    borderColor: theme.effects.cardBorder,
  },
}));
