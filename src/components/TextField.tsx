import { useState } from 'react';
import { TextInput, type TextInputProps, View } from 'react-native';

import { createStyles, useTheme } from '@/theme';

import { Txt } from './Txt';

export type TextFieldProps = Pick<
  TextInputProps,
  'placeholder' | 'maxLength' | 'keyboardType' | 'autoCapitalize' | 'returnKeyType' | 'onSubmitEditing'
> & {
  /** Shown above the field and read by screen readers. */
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  /** Grows to a few lines for notes. */
  multiline?: boolean;
};

/** A themed text input with its label. Border turns accent while focused. */
export function TextField({ label, value, onChangeText, multiline = false, ...inputProps }: TextFieldProps) {
  const theme = useTheme();
  const styles = useStyles();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      <Txt variant="caption">{label}</Txt>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        multiline={multiline}
        placeholderTextColor={theme.colors.textFaint}
        selectionColor={theme.colors.accent}
        cursorColor={theme.colors.accent}
        maxFontSizeMultiplier={theme.type.body.maxFontSizeMultiplier}
        style={[styles.input, multiline && styles.multiline, isFocused && styles.focused]}
        {...inputProps}
      />
    </View>
  );
}

const useStyles = createStyles((theme) => ({
  wrap: { gap: theme.space.xs },
  input: {
    minHeight: theme.layout.minTouchTarget,
    paddingHorizontal: theme.space.md,
    paddingVertical: theme.space.sm,
    borderRadius: theme.radius.sm,
    borderWidth: theme.layout.borderWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    fontSize: theme.type.body.fontSize,
  },
  multiline: {
    minHeight: theme.layout.buttonHeight + theme.space.xxl,
    textAlignVertical: 'top',
  },
  focused: { borderColor: theme.colors.accent },
}));
