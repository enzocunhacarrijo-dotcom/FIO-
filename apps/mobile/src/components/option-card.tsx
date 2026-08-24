import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, radii, spacing } from '@/theme/tokens';

type OptionCardProps = {
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  mode: 'single' | 'multi';
};

export function OptionCard({ label, description, selected, onPress, mode }: OptionCardProps) {
  return (
    <Pressable
      accessibilityRole={mode === 'single' ? 'radio' : 'checkbox'}
      accessibilityState={{ selected, checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.card, selected && styles.cardSelected, pressed && styles.pressed]}
    >
      <View style={styles.textCol}>
        <Text style={styles.label}>{label}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
      {mode === 'single' ? (
        <View style={[styles.radio, selected && styles.radioSelected]}>
          {selected && <View style={styles.radioDot} />}
        </View>
      ) : (
        <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
          {selected && <Text style={styles.checkmark}>✓</Text>}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    minHeight: 56,
  },
  cardSelected: {
    backgroundColor: colors.goldTint,
    borderColor: colors.goldStrong,
  },
  pressed: {
    opacity: 0.85,
  },
  textCol: {
    flex: 1,
    gap: 3,
  },
  label: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 15,
    color: colors.text,
  },
  description: {
    fontFamily: fontFamily.body,
    fontSize: 12.5,
    lineHeight: 17,
    color: colors.textMuted,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
  },
  radioSelected: {
    borderColor: colors.goldStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 11,
    height: 11,
    borderRadius: radii.pill,
    backgroundColor: colors.goldStrong,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: colors.goldStrong,
    backgroundColor: colors.goldStrong,
  },
  checkmark: {
    color: colors.bg,
    fontSize: 13,
    fontFamily: fontFamily.bodySemiBold,
  },
});
