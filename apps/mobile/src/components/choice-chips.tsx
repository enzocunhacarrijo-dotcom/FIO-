import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, radii, spacing } from '@/theme/tokens';

type ChoiceChipsProps<T extends string> = {
  options: { value: T; label: string }[];
  selected: T | null;
  onSelect: (value: T) => void;
};

export function ChoiceChips<T extends string>({ options, selected, onSelect }: ChoiceChipsProps<T>) {
  return (
    <View style={styles.row}>
      {options.map((opt) => {
        const isSelected = opt.value === selected;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(opt.value)}
            style={[styles.chip, isSelected && styles.chipSelected]}
          >
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  chip: {
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    backgroundColor: colors.goldTint,
    borderColor: colors.goldStrong,
  },
  chipText: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 13,
    color: colors.textMuted,
  },
  chipTextSelected: {
    color: colors.goldStrong,
    fontFamily: fontFamily.bodySemiBold,
  },
});
