// The one file allowed to import Text from react-native. Every other file uses Txt.
// eslint-disable-next-line no-restricted-imports
import { Text, type TextProps, type TextStyle } from 'react-native';

import { useTheme, type ColorRole, type TextVariant } from '@/theme';

export type TxtProps = TextProps & {
  /** Type style from the theme. Defaults to body. */
  variant?: TextVariant;
  /** Colour role from the theme. Defaults to the variant's own colour. */
  color?: ColorRole;
  align?: TextStyle['textAlign'];
};

/**
 * Themed text. React Native text styles don't cascade from parent views,
 * so every piece of text goes through this component to get the right font and colour.
 */
export function Txt({ variant = 'body', color, align, style, maxFontSizeMultiplier, ...rest }: TxtProps) {
  const theme = useTheme();
  const { defaultColor, maxFontSizeMultiplier: variantMax, ...typeStyle } = theme.type[variant];

  return (
    <Text
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? variantMax}
      style={[
        typeStyle,
        { color: theme.colors[color ?? defaultColor], includeFontPadding: false },
        align ? { textAlign: align } : null,
        style,
      ]}
      {...rest}
    />
  );
}
