import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { router } from 'expo-router';
import type { AnalysisResult } from '@hair-analysis/shared';
import { AttributeCard } from '@/components/attribute-card';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Disclaimer } from '@/components/disclaimer';
import { FiberIndex } from '@/components/fiber-index';
import { ListRow } from '@/components/list-row';
import { RotinaChecklist } from '@/components/rotina-checklist';
import { ScreenHeader } from '@/components/screen-header';
import { SectionHeader } from '@/components/section-header';
import { Strand } from '@/components/strand';
import { Text } from '@/components/text';
import { getLatestAnalysis } from '@/api/analysis';
import { ApiError } from '@/api/client';
import { useAuthStore } from '@/store/auth';
import { label } from '@/data/analysis-labels';
import { todayWeekday, WEEKDAY_LABEL } from '@/lib/date';
import { colors, motion, radii, spacing } from '@/theme/tokens';

const DISCLAIMER_TEXT =
  'Esta é uma avaliação cosmética, não um diagnóstico médico. Para queda intensa, lesão ou dor no couro cabeludo, procure um dermatologista.';

// Entrada de seção: fade + translateY de 8, com stagger de 40ms.
const enter = (i: number) => FadeInDown.duration(motion.duration.base).delay(i * 40);

function IngredientChips({ items, tone }: { items: { nome: string; porQue: string }[]; tone: 'good' | 'avoid' }) {
  const [open, setOpen] = useState<number | null>(null);
  const bg = tone === 'good' ? colors.primaryTint : colors.dangerTint;
  const fg = tone === 'good' ? colors.primaryStrong : colors.dangerText;
  return (
    <Animated.View layout={LinearTransition.duration(motion.duration.base)} style={styles.chipsWrap}>
      <View style={styles.chips}>
        {items.map((ing, i) => (
          <Pressable
            key={i}
            accessibilityRole="button"
            accessibilityState={{ expanded: open === i }}
            onPress={() => setOpen(open === i ? null : i)}
            style={[styles.chip, { backgroundColor: bg }, open === i && { borderColor: fg }]}
          >
            <Text variant="label" style={{ color: fg }}>
              {ing.nome}
            </Text>
          </Pressable>
        ))}
      </View>
      {open !== null && items[open] && (
        <Card variant="sunken" padding={spacing.lg}>
          <Text variant="bodySm" tone="muted">
            {items[open].porQue}
          </Text>
        </Card>
      )}
    </Animated.View>
  );
}

export default function ResultadoScreen() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!accessToken) {
      setError('Sessão inválida.');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const analysis = await getLatestAnalysis(accessToken);
      if (!analysis) {
        setError('Nenhuma análise encontrada ainda.');
      } else {
        setResult(analysis);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível carregar sua análise.');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.skeletonWrap}>
          <View style={[styles.skeleton, { height: 220, borderRadius: radii.xl }]} />
          <View style={[styles.skeleton, { height: 20, width: '70%' }]} />
          <View style={[styles.skeleton, { height: 96, borderRadius: radii.lg }]} />
          <View style={[styles.skeleton, { height: 96, borderRadius: radii.lg }]} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !result) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text variant="body" tone="danger" style={styles.centerText}>
            {error ?? 'Nenhuma análise encontrada.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const alert = result.sinalDeAlertaMedico && (
    <Animated.View entering={enter(0)}>
      <Card variant="danger">
        <Text variant="h3" tone="danger">
          Vale procurar um dermatologista
        </Text>
        <Text variant="bodySm" tone="danger">
          {result.motivoAlerta}
        </Text>
      </Card>
    </Animated.View>
  );

  if (!result.qualidadeDasImagens.suficiente) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          <ScreenHeader title="Seu perfil capilar" onBack={() => router.replace('/')} />

          {alert}

          <Animated.View entering={enter(1)}>
            <Card variant="warn">
              <Text variant="h3" style={styles.warnText}>
                Não deu para analisar essas fotos
              </Text>
              {result.qualidadeDasImagens.problemas.map((problema, i) => (
                <Text key={i} variant="bodySm" style={styles.warnText}>
                  • {problema}
                </Text>
              ))}
              <Text variant="bodySm" style={[styles.warnText, { marginTop: spacing.xs }]}>
                Sem ver cabelo ou couro cabeludo com clareza nas três fotos, não é possível montar uma avaliação
                confiável — por isso não mostramos números nem recomendações desta vez.
              </Text>
            </Card>
          </Animated.View>

          <Button label="Tirar as fotos de novo" onPress={() => router.replace('/captura')} />

          <Disclaimer>{DISCLAIMER_TEXT}</Disclaimer>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const temDano =
    result.sinaisDeDano.quimico || result.sinaisDeDano.termico || result.sinaisDeDano.mecanico;
  const rotinaOutrosDias = result.rotinaSemanal.filter((dia) => dia.dia !== todayWeekday());

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <SafeAreaView edges={['top']}>
            <View style={styles.heroInner}>
              <ScreenHeader title="Seu perfil capilar" onBack={() => router.replace('/')} variant="onPrimary" />
              <Animated.View entering={enter(0)} style={styles.heroIndex}>
                <FiberIndex
                  total={result.indiceCapilar.total}
                  hidratacao={result.indiceCapilar.hidratacao}
                  integridade={result.indiceCapilar.integridade}
                  couro={result.indiceCapilar.couro}
                  densidade={result.indiceCapilar.densidade}
                  onPrimary
                />
              </Animated.View>
            </View>
          </SafeAreaView>
        </View>

        <View style={styles.content}>
          {alert}

          <Animated.View entering={enter(1)} style={styles.noteWrap}>
            <Strand width={48} stroke={6} color={colors.primaryTint} />
            <Text variant="bodyLg">{result.observacoesAoUsuario}</Text>
          </Animated.View>

          <Animated.View entering={enter(2)} style={styles.section}>
            <SectionHeader title="O que observamos" />
            <View style={styles.grid}>
              <View style={styles.half}>
                <AttributeCard
                  title="Curvatura"
                  value={`${label(result.curvatura.valor)}${result.curvatura.subtipo ? ' — ' + result.curvatura.subtipo : ''}`}
                  fonte={result.curvatura.fonte}
                  confianca={result.curvatura.confianca}
                />
              </View>
              <View style={styles.half}>
                <AttributeCard
                  title="Densidade aparente"
                  value={label(result.densidadeAparente.valor)}
                  fonte={result.densidadeAparente.fonte}
                  confianca={result.densidadeAparente.confianca}
                />
              </View>
              <View style={styles.half}>
                <AttributeCard
                  title="Porosidade estimada"
                  value={label(result.porosidadeEstimada.valor)}
                  fonte={result.porosidadeEstimada.fonte}
                  confianca={result.porosidadeEstimada.confianca}
                />
              </View>
            </View>
            <AttributeCard
              title="Couro cabeludo"
              value={`Oleosidade ${label(result.couroCabeludo.oleosidade).toLowerCase()}`}
              description={`Descamação: ${label(result.couroCabeludo.descamacao)} · Vermelhidão: ${label(result.couroCabeludo.vermelhidao)}`}
              fonte={result.couroCabeludo.fonte}
              confianca={result.couroCabeludo.confianca}
            />
            <AttributeCard
              title="Integridade do fio"
              value={`Frizz ${label(result.integridadeDoFio.frizz).toLowerCase()} · Brilho ${label(result.integridadeDoFio.brilho).toLowerCase()}`}
              description={`Quebra: ${label(result.integridadeDoFio.quebra)} · Pontas duplas: ${label(result.integridadeDoFio.pontasDuplas)}`}
              fonte={result.integridadeDoFio.fonte}
              confianca={result.integridadeDoFio.confianca}
            />
          </Animated.View>

          {temDano && (
            <Animated.View entering={enter(3)}>
              <Card>
                <Text variant="h3">Sinais de dano</Text>
                <Text variant="body" tone="muted" style={styles.cardBody}>
                  {result.sinaisDeDano.observacoes}
                </Text>
              </Card>
            </Animated.View>
          )}

          {result.discrepancias.length > 0 && (
            <Animated.View entering={enter(3)}>
              <Card variant="warn">
                <Text variant="h3" style={styles.warnText}>
                  Pontos de atenção
                </Text>
                {result.discrepancias.map((d, i) => (
                  <Text key={i} variant="bodySm" style={styles.warnText}>
                    • {d.observacao}
                  </Text>
                ))}
              </Card>
            </Animated.View>
          )}

          {result.necessidadesPrioritarias.length > 0 && (
            <Animated.View entering={enter(4)} style={styles.section}>
              <SectionHeader title="Prioridades" />
              <Card>
                <View style={styles.numbered}>
                  {result.necessidadesPrioritarias.map((item, i) => (
                    <View key={i} style={styles.numberedRow}>
                      <View style={styles.numberCircle}>
                        <Text variant="label" style={styles.numberText}>
                          {i + 1}
                        </Text>
                      </View>
                      <Text variant="body" style={styles.numberedText}>
                        {item}
                      </Text>
                    </View>
                  ))}
                </View>
              </Card>
            </Animated.View>
          )}

          {result.ingredientesRecomendados.length > 0 && (
            <Animated.View entering={enter(5)} style={styles.section}>
              <SectionHeader title="Ingredientes recomendados" />
              <IngredientChips items={result.ingredientesRecomendados} tone="good" />
            </Animated.View>
          )}

          {result.ingredientesAEvitar.length > 0 && (
            <Animated.View entering={enter(6)} style={styles.section}>
              <SectionHeader title="Ingredientes a evitar" />
              <IngredientChips items={result.ingredientesAEvitar} tone="avoid" />
            </Animated.View>
          )}

          <Animated.View entering={enter(7)} style={styles.section}>
            <SectionHeader title="Rotina" />
            {result.rotinaSemanal.length === 0 ? (
              <Card variant="sunken">
                <Text variant="body" tone="muted">
                  Não foi possível montar uma rotina com o que recebemos — envie fotos mais nítidas para uma
                  recomendação completa.
                </Text>
              </Card>
            ) : (
              <>
                {accessToken && <RotinaChecklist accessToken={accessToken} rotinaSemanal={result.rotinaSemanal} />}
                {rotinaOutrosDias.map((dia, i) => (
                  <Card key={i}>
                    <Text variant="h3">{WEEKDAY_LABEL[dia.dia]}</Text>
                    <View style={styles.dayActions}>
                      {dia.acoes.map((acao, j) => (
                        <Text key={j} variant="body" tone="muted">
                          • {acao}
                        </Text>
                      ))}
                    </View>
                  </Card>
                ))}
              </>
            )}
          </Animated.View>

          <Animated.View entering={enter(8)} style={styles.section}>
            <SectionHeader title="Ações rápidas" />
            <Card padding={spacing.sm}>
              <ListRow icon="chart" title="Ver meu progresso" onPress={() => router.push('/progresso')} />
              <ListRow
                icon="barcode"
                title="Ler um produto"
                subtitle="Veja se combina com seu cabelo"
                onPress={() => router.push('/scanner')}
              />
              <ListRow icon="user" title="Minha conta" onPress={() => router.push('/conta')} />
            </Card>
          </Animated.View>

          <Disclaimer>{DISCLAIMER_TEXT}</Disclaimer>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  centerText: { textAlign: 'center' },
  skeletonWrap: { padding: spacing.xl, gap: spacing.xxl },
  skeleton: { backgroundColor: colors.surfaceSunken, borderRadius: radii.md },
  scroll: { paddingBottom: spacing.xxxl },
  hero: {
    backgroundColor: colors.primary,
    borderBottomLeftRadius: radii.xxl,
    borderBottomRightRadius: radii.xxl,
    overflow: 'hidden',
  },
  heroInner: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xxxl, gap: spacing.xxl },
  heroIndex: { alignItems: 'center' },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    gap: spacing.xxl,
  },
  warnText: { color: colors.accentStrong },
  noteWrap: { gap: spacing.md },
  section: { gap: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  half: { width: '47.5%', flexGrow: 1 },
  cardBody: { marginTop: spacing.xs },
  numbered: { gap: spacing.lg },
  numberedRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  numberCircle: {
    width: 28,
    height: 28,
    borderRadius: radii.pill,
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: { color: colors.accentStrong },
  numberedText: { flex: 1, paddingTop: 3 },
  chipsWrap: { gap: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    minHeight: 40,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
  },
  dayActions: { gap: spacing.xs, marginTop: spacing.sm },
});
