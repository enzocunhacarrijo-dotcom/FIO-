import { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import type { AnalysisHistoryItem } from '@hair-analysis/shared';
import { Card } from '@/components/card';
import { Text } from '@/components/text';
import { colors, fontFamily, spacing } from '@/theme/tokens';

const CHART_HEIGHT = 170;
const PADDING_X = 24;
const PADDING_TOP = 28;
const PADDING_BOTTOM = 14;

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

type Pt = { x: number; y: number };

/** Curva cúbica suave (Catmull-Rom → Bézier) passando por todos os pontos. */
function smoothPath(pts: Pt[]): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export function EvolutionChart({ items, width = 320 }: { items: AnalysisHistoryItem[]; width?: number }) {
  const gradId = `evo-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  if (items.length === 0) {
    return (
      <Card variant="sunken">
        <Text variant="bodySm" tone="muted" style={styles.emptyText}>
          Suas análises vão aparecer aqui conforme você acompanha ao longo do tempo.
        </Text>
      </Card>
    );
  }

  // Oldest first, left to right.
  const chronological = [...items].reverse();
  const innerWidth = width - PADDING_X * 2;
  const innerHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const yFor = (v: number) => PADDING_TOP + innerHeight - (Math.max(0, Math.min(100, v)) / 100) * innerHeight;

  const points = chronological.map((item, i) => ({
    x: PADDING_X + (chronological.length === 1 ? innerWidth / 2 : (i / (chronological.length - 1)) * innerWidth),
    y: yFor(item.indiceCapilar.total),
    total: item.indiceCapilar.total,
  }));
  const last = points[points.length - 1];
  const baseY = CHART_HEIGHT - PADDING_BOTTOM;
  const line = smoothPath(points);
  const area = points.length > 1 ? `${line} L ${last.x} ${baseY} L ${points[0].x} ${baseY} Z` : '';
  const first = chronological[0];
  const lastItem = chronological[chronological.length - 1];

  const tipW = 34;
  const tipX = Math.min(Math.max(last.x - tipW / 2, 2), width - tipW - 2);

  return (
    <View>
      <Svg width={width} height={CHART_HEIGHT}>
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.primary} stopOpacity={0.22} />
            <Stop offset="1" stopColor={colors.primary} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        {[0, 50, 100].map((v) => (
          <Line
            key={v}
            x1={PADDING_X}
            y1={yFor(v)}
            x2={width - PADDING_X}
            y2={yFor(v)}
            stroke={colors.borderStrong}
            strokeWidth={1}
            strokeDasharray="4,6"
            opacity={0.7}
          />
        ))}
        {area !== '' && <Path d={area} fill={`url(#${gradId})`} />}
        {points.length > 1 && (
          <Path d={line} fill="none" stroke={colors.primary} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        )}
        {points.slice(0, -1).map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={4} fill={colors.surface} stroke={colors.primary} strokeWidth={2} />
        ))}
        <Circle cx={last.x} cy={last.y} r={9} fill={colors.accentGlow} />
        <Circle cx={last.x} cy={last.y} r={5.5} fill={colors.accent} stroke={colors.surface} strokeWidth={2} />
        <G>
          <Rect x={tipX} y={Math.max(last.y - 30, 0)} width={tipW} height={20} rx={10} fill={colors.text} />
          <SvgText
            x={tipX + tipW / 2}
            y={Math.max(last.y - 30, 0) + 14}
            fontSize={11}
            fontFamily={fontFamily.bodySemiBold}
            fill={colors.onPrimary}
            textAnchor="middle"
          >
            {Math.round(last.total)}
          </SvgText>
        </G>
      </Svg>
      <View style={styles.labelsRow}>
        <Text variant="caption" tone="faint">
          {formatShortDate(first.createdAt)}
        </Text>
        {chronological.length > 1 && (
          <Text variant="caption" tone="faint">
            {formatShortDate(lastItem.createdAt)}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyText: { textAlign: 'center' },
  labelsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: PADDING_X - 8, marginTop: -spacing.xs },
});
