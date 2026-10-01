import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import type { Compatibilidade } from '@hair-analysis/shared';
import { Button } from '@/components/button';
import { ScreenHeader } from '@/components/screen-header';
import { useScannerStore } from '@/store/scanner';
import { colors, fontFamily, radii, spacing } from '@/theme/tokens';

const VERDICT_LABEL: Record<Compatibilidade, string> = {
  compativel: 'Compatível',
  neutro: 'Neutro',
  evitar: 'Evitar',
};
const VERDICT_STYLE: Record<Compatibilidade, { bg: string; fg: string }> = {
  compativel: { bg: colors.primaryTint, fg: colors.primaryStrong },
  neutro: { bg: colors.border, fg: colors.textMuted },
  evitar: { bg: colors.dangerTint, fg: colors.dangerText },
};

export default function ScannerResultadoScreen() {
  const result = useScannerStore((s) => s.lastResult);

  if (!result) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.error}>Nenhuma leitura encontrada.</Text>
          <Button label="Ler outro produto" onPress={() => router.replace('/scanner')} />
        </View>
      </SafeAreaView>
    );
  }

  const verdictStyle = VERDICT_STYLE[result.compatibilidadeGeral];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Compatibilidade do produto" onBack={() => router.back()} />

        {!result.leituraSuficiente && (
          <View style={styles.warnCard}>
            <Text style={styles.warnTitle}>Não deu para ler o rótulo direito</Text>
            {result.problemasLeitura.map((p, i) => (
              <Text key={i} style={styles.warnBody}>
                • {p}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.heroCard}>
          {result.produtoIdentificado && <Text style={styles.productName}>{result.produtoIdentificado}</Text>}
          <View style={[styles.verdictBadge, { backgroundColor: verdictStyle.bg }]}>
            <Text style={[styles.verdictText, { color: verdictStyle.fg }]}>{VERDICT_LABEL[result.compatibilidadeGeral]}</Text>
          </View>
          <Text style={styles.summary}>{result.resumo}</Text>
        </View>

        {result.ingredientesAvaliados.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Ingredientes</Text>
            <View style={styles.cardStack}>
              {result.ingredientesAvaliados.map((ing, i) => {
                const style = VERDICT_STYLE[ing.avaliacao];
                return (
                  <View key={i} style={styles.ingredientCard}>
                    <View style={styles.ingredientHeader}>
                      <Text style={styles.ingredientName}>{ing.nome}</Text>
                      <View style={[styles.tag, { backgroundColor: style.bg }]}>
                        <Text style={[styles.tagText, { color: style.fg }]}>{VERDICT_LABEL[ing.avaliacao]}</Text>
                      </View>
                    </View>
                    <Text style={styles.ingredientBody}>{ing.justificativa}</Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        <Button label="Ler outro produto" variant="secondary" onPress={() => router.replace('/scanner')} />

        <Text style={styles.disclaimer}>
          Avaliação cosmética baseada no seu perfil declarado — não é uma recomendação médica.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.xl },
  error: { fontFamily: fontFamily.body, fontSize: 14, color: colors.textMuted },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  warnCard: {
    backgroundColor: colors.accentTint,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: 4,
  },
  warnTitle: { fontFamily: fontFamily.bodySemiBold, fontSize: 14, color: colors.accentStrong },
  warnBody: { fontFamily: fontFamily.body, fontSize: 13, lineHeight: 19, color: colors.accentStrong },
  heroCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  productName: {
    fontFamily: fontFamily.displaySemiBold,
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
  },
  verdictBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  verdictText: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summary: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
    textAlign: 'center',
  },
  sectionLabel: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.textFaint,
  },
  cardStack: { gap: spacing.md },
  ingredientCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: 6,
  },
  ingredientHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  ingredientName: {
    flex: 1,
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 14,
    color: colors.text,
  },
  tag: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  tagText: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 10.5,
    textTransform: 'uppercase',
  },
  ingredientBody: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
  },
  disclaimer: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    lineHeight: 16,
    color: colors.textFaint,
    textAlign: 'center',
  },
});
