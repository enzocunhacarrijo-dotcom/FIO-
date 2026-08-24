import { StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily } from '@/theme/tokens';

type FiberIndexProps = {
  total: number;
  hidratacao: number;
  integridade: number;
  couro: number;
  densidade: number;
};

const MAX_BAR_HEIGHT = 108;
const MIN_BAR_HEIGHT = 24;

function barHeight(score: number): number {
  const clamped = Math.max(0, Math.min(100, score));
  return MIN_BAR_HEIGHT + (clamped / 100) * (MAX_BAR_HEIGHT - MIN_BAR_HEIGHT);
}

export function FiberIndex({ total, hidratacao, integridade, couro, densidade }: FiberIndexProps) {
  const bars = [
    { label: 'Hidratação', value: hidratacao },
    { label: 'Integridade', value: integridade },
    { label: 'Couro', value: couro },
    { label: 'Densidade', value: densidade },
  ];

  return (
    <View style={styles.wrap}>
      <View style={styles.scoreRow}>
        <Text style={styles.scoreNum}>
          {Math.round(total)}
          <Text style={styles.scoreMax}>/100</Text>
        </Text>
        <Text style={styles.scoreLabel}>Índice Capilar</Text>
      </View>

      <View style={styles.bars}>
        {bars.map((bar) => (
          <View key={bar.label} style={styles.barCol}>
            <View style={styles.barStage}>
              <View style={[styles.barFill, { height: barHeight(bar.value) }]} />
            </View>
            <Text style={styles.barValue}>{Math.round(bar.value)}</Text>
            <Text style={styles.barLabel}>{bar.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 18,
  },
  scoreRow: {
    alignItems: 'center',
    gap: 2,
  },
  scoreNum: {
    fontFamily: fontFamily.displaySemiBold,
    fontSize: 48,
    color: colors.text,
  },
  scoreMax: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 16,
    color: colors.textFaint,
  },
  scoreLabel: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  bars: {
    flexDirection: 'row',
    gap: 18,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.border,
  },
  barCol: {
    alignItems: 'center',
    width: 50,
    gap: 6,
  },
  barStage: {
    height: MAX_BAR_HEIGHT,
    justifyContent: 'flex-end',
  },
  barFill: {
    width: 20,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: colors.gold,
  },
  barValue: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 13,
    color: colors.text,
    marginTop: 2,
  },
  barLabel: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 10,
    textTransform: 'uppercase',
    color: colors.textFaint,
    textAlign: 'center',
  },
});
