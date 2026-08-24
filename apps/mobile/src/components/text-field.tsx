import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, fontFamily, radii, spacing } from '@/theme/tokens';

type TextFieldProps = TextInputProps & {
  label?: string;
};

export function TextField({ label, style, ...rest }: TextFieldProps) {
  return (
    <View style={styles.wrap}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        placeholderTextColor={colors.textFaint}
        style={[styles.input, style]}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  label: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  input: {
    minHeight: 52,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    fontFamily: fontFamily.body,
    fontSize: 15,
    color: colors.text,
  },
});
