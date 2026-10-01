import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Icon } from '@/components/icon';
import { Text } from '@/components/text';
import { colors, motion, radii } from '@/theme/tokens';

type CheckboxProps = {
  checked: boolean;
  onToggle: (next: boolean) => void;
  label: string;
};

/** Caixa de 24px (raio 8) com ✓ que "pula" ao marcar. Reutilizada por OptionCard. */
export function CheckBox({ checked, size = 24 }: { checked: boolean; size?: number }) {
  const pop = useAnimatedStyle(() => ({
    opacity: withSpring(checked ? 1 : 0, motion.spring.press),
    transform: [{ scale: withSpring(checked ? 1 : 0.4, motion.spring.pop) }],
  }));
  return (
    <View style={[styles.box, { width: size, height: size }, checked && styles.boxChecked]}>
      <Animated.View style={pop}>
        <Icon name="check" size={size - 8} color={colors.onPrimary} />
      </Animated.View>
    </View>
  );
}

export function Checkbox({ checked, onToggle, label }: CheckboxProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onToggle(!checked);
      }}
      style={styles.row}
      hitSlop={8}
    >
      <CheckBox checked={checked} />
      <Text variant="bodySm" tone="muted" style={styles.label}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, minHeight: 44 },
  box: {
    borderRadius: radii.xs,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  boxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  label: { flex: 1 },
});
