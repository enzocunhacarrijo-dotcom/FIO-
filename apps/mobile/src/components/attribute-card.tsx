import { StyleSheet, Text, View } from 'react-native';
import type { Confianca, Fonte } from '@hair-analysis/shared';
import { confiancaLabel, label } from '@/data/analysis-labels';
import { colors, fontFamily, radii, spacing } from '@/theme/tokens';

type AttributeCardProps = {
  title: string;
  value: string;
  description?: string;
  fonte: Fonte;
  confianca: Confianca;
};

const CONFIANCA_STYLE: Record<Confianca, { bg: string; fg: string }> = {
  alta: { bg: colors.primaryTint, fg: colors.primaryStrong },
  media: { bg: colors.border, fg: colors.textMuted },
  baixa: { bg: colors.dangerTint, fg: colors.dangerText },
};

export function AttributeCard({ title, value, description, fonte, confianca }: AttributeCardProps) {
  const confiancaStyle = CONFIANCA_STYLE[confianca];
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      <View style={styles.tagRow}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{label(fonte)}</Text>
        </View>
        <View style={[styles.tag, { backgroundColor: confiancaStyle.bg, borderColor: 'transparent' }]}>
          <Text style={[styles.tagText, { color: confiancaStyle.fg }]}>{confiancaLabel(confianca)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: 6,
  },
  title: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.textFaint,
  },
  value: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 16,
    color: colors.text,
  },
  description: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
  },
  tagRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  tagText: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 11,
    color: colors.textMuted,
  },
});
