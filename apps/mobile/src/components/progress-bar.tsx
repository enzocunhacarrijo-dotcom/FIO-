import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Text } from '@/components/text';
import { colors, motion, spacing } from '@/theme/tokens';

/** "O fio crescendo": trilho + preenchimento com ponto âmbar na ponta. */
export function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.max(0, (current / total) * 100)) : 0;
  const fill = useAnimatedStyle(() => ({
    width: withTiming(`${pct}%`, { duration: motion.duration.base, easing: motion.easing.standard }),
  }));
  return (
    <View
      style={styles.row}
      accessibilityRole="progressbar"
      accessibilityLabel={`Etapa ${current} de ${total}`}
      accessibilityValue={{ min: 0, max: total, now: current }}
    >
      <View style={styles.track}>
        <Animated.View style={[styles.fill, fill]}>
          <View style={styles.dot} />
        </Animated.View>
      </View>
      <Text variant="eyebrow" tone="faint">
        {current}/{total}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  track: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.surfaceSunken, justifyContent: 'center' },
  fill: { height: 8, borderRadius: 4, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'flex-end' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent, marginRight: -1 },
});
