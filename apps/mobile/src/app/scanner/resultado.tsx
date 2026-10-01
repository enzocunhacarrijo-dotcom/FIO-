import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import type { Compatibilidade } from '@hair-analysis/shared';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Disclaimer } from '@/components/disclaimer';
import { Icon, type IconName } from '@/components/icon';
import { ScreenHeader } from '@/components/screen-header';
import { SectionHeader } from '@/components/section-header';
import { Text } from '@/components/text';
import { useScannerStore } from '@/store/scanner';
import { colors, radii, spacing } from '@/theme/tokens';

const VERDICT_LABEL: Record<Compatibilidade, string> = {
  compativel: 'Compatível',
  neutro: 'Neutro',
  evitar: 'Evitar',
};
const VERDICT_STYLE: Record<Compatibilidade, { bg: string; fg: string; dot: string; icon: IconName }> = {
  compativel: { bg: colors.successTint, fg: colors.success, dot: colors.success, icon: 'check' },
  neutro: { bg: colors.accentTint, fg: colors.accentStrong, dot: colors.accent, icon: 'info' },
  evitar: { bg: colors.dangerTint, fg: colors.dangerText, dot: colors.danger, icon: 'warning' },
};

export default function ScannerResultadoScreen() {
  const result = useScannerStore((s) => s.lastResult);

  if (!result) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text variant="body" tone="muted">
            Nenhuma leitura encontrada.
          </Text>
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
          <Animated.View entering={FadeInDown.duration(220)}>
            <Card variant="warn">
              <Text variant="h3" style={styles.warnText}>
                Não deu para ler o rótulo direito
              </Text>
              {result.problemasLeitura.map((p, i) => (
                <Text key={i} variant="bodySm" style={styles.warnText}>
                  • {p}
                </Text>
              ))}
            </Card>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.duration(220).delay(40)} style={styles.hero}>
          <View style={[styles.seal, { backgroundColor: verdictStyle.bg }]}>
            <Icon name={verdictStyle.icon} size={32} color={verdictStyle.fg} />
          </View>
          {result.produtoIdentificado && (
            <Text variant="eyebrow" tone="muted" style={styles.centerText}>
              {result.produtoIdentificado}
            </Text>
          )}
          <Text variant="h1" style={[styles.centerText, { color: verdictStyle.fg }]}>
            {VERDICT_LABEL[result.compatibilidadeGeral]}
          </Text>
          <Text variant="body" tone="muted" style={styles.centerText}>
            {result.resumo}
          </Text>
        </Animated.View>

        {result.ingredientesAvaliados.length > 0 && (
          <Animated.View entering={FadeInDown.duration(220).delay(80)} style={styles.section}>
            <SectionHeader title="Ingredientes" />
            <Card padding={spacing.lg} style={styles.ingredients}>
              {result.ingredientesAvaliados.map((ing, i) => {
                const style = VERDICT_STYLE[ing.avaliacao];
                return (
                  <View key={i} style={styles.ingredientRow}>
                    <View style={[styles.dot, { backgroundColor: style.dot }]} />
                    <View style={styles.ingredientText}>
                      <View style={styles.ingredientHeader}>
                        <Text variant="label" style={styles.ingredientName}>
                          {ing.nome}
                        </Text>
                        <Text variant="caption" style={{ color: style.fg }}>
                          {VERDICT_LABEL[ing.avaliacao]}
                        </Text>
                      </View>
                      <Text variant="bodySm" tone="muted">
                        {ing.justificativa}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </Card>
          </Animated.View>
        )}

        <Button label="Ler outro produto" variant="secondary" onPress={() => router.replace('/scanner')} />

        <Disclaimer>Avaliação cosmética baseada no seu perfil declarado — não é uma recomendação médica.</Disclaimer>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, paddingHorizontal: spacing.xl },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
    gap: spacing.xxl,
  },
  warnText: { color: colors.accentStrong },
  hero: { alignItems: 'center', gap: spacing.md },
  seal: {
    width: 72,
    height: 72,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: { textAlign: 'center' },
  section: { gap: spacing.lg },
  ingredients: { gap: spacing.lg },
  ingredientRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  ingredientText: { flex: 1, gap: spacing.xs },
  ingredientHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  ingredientName: { flex: 1 },
});
