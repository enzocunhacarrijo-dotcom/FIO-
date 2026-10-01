import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { Text } from '@/components/text';
import { colors, fontFamily, radii, spacing } from '@/theme/tokens';

type TextFieldProps = TextInputProps & {
  label?: string;
  error?: string;
  hint?: string;
};

export function TextField({ label, error, hint, style, onFocus, onBlur, ...rest }: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      {label && <Text variant="label">{label}</Text>}
      <View style={[styles.ring, focused && styles.ringFocused, !!error && styles.ringError]}>
        <TextInput
          placeholderTextColor={colors.textFaint}
          accessibilityLabel={label}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, focused && styles.inputFocused, !!error && styles.inputError, style]}
          {...rest}
        />
      </View>
      {error ? (
        <Text variant="bodySm" tone="danger">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="bodySm" tone="faint">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  ring: { borderRadius: radii.md + 4, padding: 4, margin: -4, borderWidth: 0 },
  ringFocused: { backgroundColor: colors.primaryTint },
  ringError: { backgroundColor: colors.dangerTint },
  input: {
    height: 56,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: colors.surfaceSunken,
    paddingHorizontal: spacing.lg,
    fontFamily: fontFamily.body,
    fontSize: 16,
    color: colors.text,
  },
  inputFocused: { backgroundColor: colors.surface, borderColor: colors.primary },
  inputError: { borderColor: colors.danger },
});
