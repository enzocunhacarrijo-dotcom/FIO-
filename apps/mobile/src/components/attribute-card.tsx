import { StyleSheet, View } from 'react-native';
import type { Confianca, Fonte } from '@hair-analysis/shared';
import { Card } from '@/components/card';
import { Text } from '@/components/text';
import { confiancaLabel, label } from '@/data/analysis-labels';
import { colors, radii, spacing } from '@/theme/tokens';

type AttributeCardProps = {
  title: string;
  value: string;
  description?: string;
  fonte: Fonte;
  confianca: Confianca;
};

const DOTS: Record<Confianca, number> = { alta: 3, media: 2, baixa: 1 };

export function AttributeCard({ title, value, description, fonte, confianca }: AttributeCardProps) {
  const filled = DOTS[confianca];
  return (
    <Card padding={spacing.lg} style={styles.card}>
      <Text variant="eyebrow" tone="faint">
        {title}
      </Text>
      <Text variant="h3">{value}</Text>
      {description && (
        <Text variant="bodySm" tone="muted">
          {description}
        </Text>
      )}
      <View style={styles.footer}>
        <View style={styles.tag}>
          <Text variant="caption" tone="muted">
            {label(fonte)}
          </Text>
        </View>
        <View
          style={styles.dots}
          accessible
          accessibilityLabel={`Confiança: ${confiancaLabel(confianca)}`}
        >
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.dot, i < filled ? styles.dotOn : styles.dotOff]} />
          ))}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 6 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs },
  tag: {
    height: 24,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceSunken,
    justifyContent: 'center',
  },
  dots: { flexDirection: 'row', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotOn: { backgroundColor: colors.primary },
  dotOff: { backgroundColor: colors.surfaceSunken },
});
