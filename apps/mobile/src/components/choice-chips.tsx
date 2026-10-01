import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Icon } from '@/components/icon';
import { Text } from '@/components/text';
import { colors, elevation, motion, radii, spacing } from '@/theme/tokens';

type ChoiceChipsProps<T extends string> = {
  options: { value: T; label: string }[];
  selected: T | null;
  onSelect: (value: T) => void;
};

function Chip({ label, isSelected, onPress }: { label: string; isSelected: boolean; onPress: () => void }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      onPress={() => {
        scale.value = 0.92;
        scale.value = withSpring(1, motion.spring.pop);
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
    >
      <Animated.View style={[styles.chip, isSelected ? styles.chipSelected : [styles.chipIdle, elevation('sm')], animStyle]}>
        {isSelected && <Icon name="check" size={14} color={colors.onPrimary} />}
        <Text variant="label" style={{ color: isSelected ? colors.onPrimary : colors.textMuted }}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function ChoiceChips<T extends string>({ options, selected, onSelect }: ChoiceChipsProps<T>) {
  return (
    <View style={styles.row}>
      {options.map((opt) => (
        <Chip key={opt.value} label={opt.label} isSelected={opt.value === selected} onPress={() => onSelect(opt.value)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  chip: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
  },
  chipIdle: { backgroundColor: colors.surface },
  chipSelected: { backgroundColor: colors.primary },
});
