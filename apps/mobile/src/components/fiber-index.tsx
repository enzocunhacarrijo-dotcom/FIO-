import { useEffect } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { Text } from '@/components/text';
import { colors, fontFamily, motion, radii, spacing } from '@/theme/tokens';
import { text } from '@/theme/typography';

type FiberIndexProps = {
  total: number;
  hidratacao: number;
  integridade: number;
  couro: number;
  densidade: number;
  /** Para uso sobre bloco `primary` (anel branco, trilho translúcido, texto branco). */
  onPrimary?: boolean;
};

const R = 88;
const STROKE = 14;
const SIZE = (R + STROKE) * 2;
const C = SIZE / 2;
const CIRC = 2 * Math.PI * R;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const clamp = (n: number) => Math.max(0, Math.min(100, n));

export function FiberIndex({ total, hidratacao, integridade, couro, densidade, onPrimary }: FiberIndexProps) {
  const target = clamp(total);
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = 0;
    p.value = withTiming(target / 100, { duration: motion.duration.draw, easing: Easing.out(Easing.cubic) });
  }, [target, p]);

  const arcProps = useAnimatedProps(() => ({ strokeDashoffset: CIRC * (1 - p.value) }));
  const tipProps = useAnimatedProps(() => {
    const a = -Math.PI / 2 + p.value * 2 * Math.PI;
    return { cx: C + R * Math.cos(a), cy: C + R * Math.sin(a), opacity: p.value > 0.01 ? 1 : 0 };
  });
  const numberText = useDerivedValue(() => String(Math.round(p.value * 100)));
  const numberProps = useAnimatedProps(() => ({ text: numberText.value, defaultValue: numberText.value }) as never);

  const ink = onPrimary ? colors.onPrimary : colors.text;
  const trail = onPrimary ? 'rgba(255,255,255,0.18)' : colors.surfaceSunken;
  const arc = onPrimary ? colors.onPrimary : colors.primary;

  const rows = [
    { label: 'Hidratação', value: hidratacao },
    { label: 'Integridade', value: integridade },
    { label: 'Couro', value: couro },
    { label: 'Densidade', value: densidade },
  ];

  return (
    <View style={styles.wrap} accessible accessibilityLabel={`Índice capilar ${Math.round(total)} de 100`}>
      <View style={{ width: SIZE, height: SIZE }}>
        <Svg width={SIZE} height={SIZE}>
          <Circle cx={C} cy={C} r={R} stroke={trail} strokeWidth={STROKE} fill="none" />
          <AnimatedCircle
            cx={C}
            cy={C}
            r={R}
            stroke={arc}
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={CIRC}
            animatedProps={arcProps}
            rotation={-90}
            originX={C}
            originY={C}
          />
          <AnimatedCircle r={7} fill={colors.accent} stroke={onPrimary ? colors.primary : colors.surface} strokeWidth={3} animatedProps={tipProps} />
        </Svg>
        <View style={styles.center} pointerEvents="none">
          {Platform.OS === 'web' ? (
            <Text variant="numeric" style={{ color: ink }}>
              {Math.round(target)}
            </Text>
          ) : (
            <AnimatedTextInput
              editable={false}
              pointerEvents="none"
              style={[text('numeric'), styles.num, { color: ink }]}
              animatedProps={numberProps}
              defaultValue="0"
            />
          )}
          <Text variant="eyebrow" tone={onPrimary ? 'onPrimary' : 'faint'} style={onPrimary && styles.muted}>
            Índice Capilar
          </Text>
        </View>
      </View>

      <View style={styles.rows}>
        {rows.map((r) => (
          <View key={r.label} style={styles.row}>
            <Text variant="label" tone={onPrimary ? 'onPrimary' : 'muted'} style={styles.rowLabel}>
              {r.label}
            </Text>
            <View style={[styles.track, { backgroundColor: trail }]}>
              <View style={[styles.fill, { width: `${clamp(r.value)}%`, backgroundColor: arc }]} />
            </View>
            <Text variant="label" tone={onPrimary ? 'onPrimary' : 'default'} style={styles.rowValue}>
              {Math.round(r.value)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.xxl, alignSelf: 'stretch' },
  center: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  num: { fontFamily: fontFamily.extraBold, padding: 0, textAlign: 'center', minWidth: 120 },
  muted: { color: colors.onPrimaryMuted },
  rows: { alignSelf: 'stretch', gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowLabel: { width: 92 },
  track: { flex: 1, height: 6, borderRadius: radii.pill, overflow: 'hidden' },
  fill: { height: 6, borderRadius: radii.pill },
  rowValue: { width: 28, textAlign: 'right' },
});
