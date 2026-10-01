import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { CheckBox } from '@/components/checkbox';
import { Icon, type IconName } from '@/components/icon';
import { Text } from '@/components/text';
import { colors, elevation, motion, radii, spacing } from '@/theme/tokens';

type OptionCardProps = {
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  mode: 'single' | 'multi';
  icon?: IconName;
};

export function OptionCard({ label, description, selected, onPress, mode, icon }: OptionCardProps) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const dot = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(selected ? 1 : 0, motion.spring.pop) }],
  }));

  return (
    <Pressable
      accessibilityRole={mode === 'single' ? 'radio' : 'checkbox'}
      accessibilityState={{ selected, checked: selected }}
      onPressIn={() => {
        scale.value = withSpring(motion.pressScale, motion.spring.press);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, motion.spring.press);
      }}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
    >
      <Animated.View style={[styles.card, selected ? styles.cardSelected : elevation('sm'), animStyle]}>
        {icon && (
          <View style={styles.iconCircle}>
            <Icon name={icon} size={20} color={colors.primary} />
          </View>
        )}
        <View style={styles.textCol}>
          <Text variant="label" style={styles.label}>
            {label}
          </Text>
          {description && (
            <Text variant="bodySm" tone="muted">
              {description}
            </Text>
          )}
        </View>
        {mode === 'single' ? (
          <View style={[styles.radio, selected && styles.radioSelected]}>
            <Animated.View style={[styles.radioDot, dot]} />
          </View>
        ) : (
          <CheckBox checked={selected} />
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 20,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    minHeight: 60,
  },
  cardSelected: { backgroundColor: colors.primaryTint, borderColor: colors.primary },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1, gap: 2 },
  label: { fontSize: 15, lineHeight: 20 },
  radio: {
    width: 24,
    height: 24,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.primary },
  radioDot: { width: 12, height: 12, borderRadius: radii.pill, backgroundColor: colors.primary },
});
