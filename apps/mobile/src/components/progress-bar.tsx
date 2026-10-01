import { StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily } from '@/theme/tokens';

export function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.max(0, (current / total) * 100)) : 0;
  return (
    <View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.label}>
        Etapa {current} de {total}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 6,
    borderRadius: 6,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  label: {
    marginTop: 8,
    fontFamily: fontFamily.body,
    fontSize: 11,
    color: colors.textFaint,
  },
});
