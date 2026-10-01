import { useEffect } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Icon, type IconName } from '@/components/icon';
import { Text } from '@/components/text';
import { colors, elevation, fontFamily, motion, radii, spacing } from '@/theme/tokens';

export type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'lg' | 'md';
  /** Ícone à direita do label (ex.: 'arrow.right'). */
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function Dot({ index, color }: { index: number; color: string }) {
  const o = useSharedValue(0.3);
  useEffect(() => {
    o.value = withDelay(
      index * 150,
      withRepeat(withSequence(withTiming(1, { duration: 300 }), withTiming(0.3, { duration: 300 })), -1),
    );
  }, [index, o]);
  const s = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[styles.dot, { backgroundColor: color }, s]} />;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  icon,
  disabled,
  loading,
  style,
}: ButtonProps) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const inactive = disabled || loading;

  const fg = variant === 'primary' ? colors.onPrimary : colors.primaryStrong;

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
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
      style={[
        styles.base,
        size === 'lg' ? styles.lg : styles.md,
        variant === 'primary' && [styles.primary, !inactive && elevation('primary')],
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        disabled && styles.disabled,
        animStyle,
        style,
      ]}
    >
      {loading ? (
        <View style={styles.dots}>
          {[0, 1, 2].map((i) => (
            <Dot key={i} index={i} color={fg} />
          ))}
        </View>
      ) : (
        <>
          <Text
            style={[styles.label, { color: fg, fontSize: size === 'lg' ? 16 : 14 }]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {icon && <Icon name={icon} size={20} color={fg} />}
        </>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.xxl,
  },
  lg: { height: 56 },
  md: { height: 44, paddingHorizontal: spacing.xl },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.primaryTint },
  ghost: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.5 },
  label: { fontFamily: fontFamily.bodySemiBold, lineHeight: 20 },
  dots: { flexDirection: 'row', gap: 6, height: 20, alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
