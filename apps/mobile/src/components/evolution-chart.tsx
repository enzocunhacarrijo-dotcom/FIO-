import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import type { AnalysisHistoryItem } from '@hair-analysis/shared';
import { colors, fontFamily, spacing } from '@/theme/tokens';

const CHART_HEIGHT = 140;
const PADDING_X = 20;
const PADDING_Y = 16;

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function EvolutionChart({ items, width = 320 }: { items: AnalysisHistoryItem[]; width?: number }) {
  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Suas análises vão aparecer aqui conforme você acompanha ao longo do tempo.</Text>
      </View>
    );
  }

  // Oldest first, left to right.
  const chronological = [...items].reverse();
  const innerWidth = width - PADDING_X * 2;
  const innerHeight = CHART_HEIGHT - PADDING_Y * 2;

  const points = chronological.map((item, i) => {
    const x = chronological.length === 1 ? innerWidth / 2 : (i / (chronological.length - 1)) * innerWidth;
    const y = innerHeight - (item.indiceCapilar.total / 100) * innerHeight;
    return { x: x + PADDING_X, y: y + PADDING_Y, total: item.indiceCapilar.total, createdAt: item.createdAt };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
  const first = chronological[0];
  const last = chronological[chronological.length - 1];

  return (
    <View>
      <Svg width={width} height={CHART_HEIGHT}>
        <Line
          x1={PADDING_X}
          y1={CHART_HEIGHT - PADDING_Y}
          x2={width - PADDING_X}
          y2={CHART_HEIGHT - PADDING_Y}
          stroke={colors.border}
          strokeWidth={1}
        />
        {points.length > 1 && <Polyline points={polylinePoints} fill="none" stroke={colors.gold} strokeWidth={2.5} />}
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={4.5} fill={colors.goldStrong} />
        ))}
      </Svg>
      <View style={styles.labelsRow}>
        <Text style={styles.dateLabel}>{first ? formatShortDate(first.createdAt) : ''}</Text>
        {chronological.length > 1 && <Text style={styles.dateLabel}>{last ? formatShortDate(last.createdAt) : ''}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
  },
  emptyText: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: PADDING_X - 8,
  },
  dateLabel: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    color: colors.textFaint,
  },
});
