import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import type { AnalysisResult } from '@hair-analysis/shared';
import { AttributeCard } from '@/components/attribute-card';
import { FiberIndex } from '@/components/fiber-index';
import { RotinaChecklist } from '@/components/rotina-checklist';
import { ScreenHeader } from '@/components/screen-header';
import { getLatestAnalysis } from '@/api/analysis';
import { ApiError } from '@/api/client';
import { useAuthStore } from '@/store/auth';
import { label } from '@/data/analysis-labels';
import { todayWeekday, WEEKDAY_LABEL } from '@/lib/date';
import { colors, fontFamily, radii, spacing } from '@/theme/tokens';

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
      <View style={styles.center}>
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }

  if (error || !result) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.error}>{error ?? 'Nenhuma análise encontrada.'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Seu perfil capilar" onBack={() => router.replace('/')} />

        {result.sinalDeAlertaMedico && (
          <View style={styles.alertCard}>
            <Text style={styles.alertTitle}>Vale procurar um dermatologista</Text>
            <Text style={styles.alertBody}>{result.motivoAlerta}</Text>
          </View>
        )}

        {!result.qualidadeDasImagens.suficiente && (
          <View style={styles.warnCard}>
            <Text style={styles.warnTitle}>As fotos limitaram a análise</Text>
            {result.qualidadeDasImagens.problemas.map((problema, i) => (
              <Text key={i} style={styles.warnBody}>
                • {problema}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.heroCard}>
          <FiberIndex
            total={result.indiceCapilar.total}
            hidratacao={result.indiceCapilar.hidratacao}
            integridade={result.indiceCapilar.integridade}
            couro={result.indiceCapilar.couro}
            densidade={result.indiceCapilar.densidade}
          />
        </View>

        <Text style={styles.note}>{result.observacoesAoUsuario}</Text>

        <Text style={styles.sectionLabel}>O que observamos</Text>
        <View style={styles.cardStack}>
          <AttributeCard
            title="Curvatura"
            value={`${label(result.curvatura.valor)}${result.curvatura.subtipo ? ' — ' + result.curvatura.subtipo : ''}`}
            fonte={result.curvatura.fonte}
            confianca={result.curvatura.confianca}
          />
          <AttributeCard
            title="Densidade aparente"
            value={label(result.densidadeAparente.valor)}
            fonte={result.densidadeAparente.fonte}
            confianca={result.densidadeAparente.confianca}
          />
          <AttributeCard
            title="Porosidade estimada"
            value={label(result.porosidadeEstimada.valor)}
            fonte={result.porosidadeEstimada.fonte}
            confianca={result.porosidadeEstimada.confianca}
          />
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
        </View>

        {(result.sinaisDeDano.quimico || result.sinaisDeDano.termico || result.sinaisDeDano.mecanico) && (
          <View style={styles.plainCard}>
            <Text style={styles.plainCardTitle}>Sinais de dano</Text>
            <Text style={styles.plainCardBody}>{result.sinaisDeDano.observacoes}</Text>
          </View>
        )}

        {result.necessidadesPrioritarias.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Prioridades</Text>
            <View style={styles.plainCard}>
              {result.necessidadesPrioritarias.map((item, i) => (
                <Text key={i} style={styles.listItem}>
                  • {item}
                </Text>
              ))}
            </View>
          </>
        )}

        {result.ingredientesRecomendados.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Ingredientes recomendados</Text>
            <View style={styles.cardStack}>
              {result.ingredientesRecomendados.map((ing, i) => (
                <View key={i} style={styles.plainCard}>
                  <Text style={styles.plainCardTitle}>{ing.nome}</Text>
                  <Text style={styles.plainCardBody}>{ing.porQue}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {result.ingredientesAEvitar.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Ingredientes a evitar</Text>
            <View style={styles.cardStack}>
              {result.ingredientesAEvitar.map((ing, i) => (
                <View key={i} style={styles.plainCard}>
                  <Text style={styles.plainCardTitle}>{ing.nome}</Text>
                  <Text style={styles.plainCardBody}>{ing.porQue}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <Text style={styles.sectionLabel}>Rotina</Text>
        {result.rotinaSemanal.length === 0 ? (
          <Text style={styles.empty}>
            Não foi possível montar uma rotina com o que recebemos — envie fotos mais nítidas para uma recomendação
            completa.
          </Text>
        ) : (
          <>
            {accessToken && <RotinaChecklist accessToken={accessToken} rotinaSemanal={result.rotinaSemanal} />}
            <View style={styles.cardStack}>
              {result.rotinaSemanal
                .filter((dia) => dia.dia !== todayWeekday())
                .map((dia, i) => (
                  <View key={i} style={styles.plainCard}>
                    <Text style={styles.plainCardTitle}>{WEEKDAY_LABEL[dia.dia]}</Text>
                    {dia.acoes.map((acao, j) => (
                      <Text key={j} style={styles.listItem}>
                        • {acao}
                      </Text>
                    ))}
                  </View>
                ))}
            </View>
          </>
        )}

        <Text style={styles.disclaimer}>
          Esta é uma avaliação cosmética, não um diagnóstico médico. Para queda intensa, lesão ou dor no couro
          cabeludo, procure um dermatologista.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, paddingHorizontal: spacing.xl },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  error: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    color: colors.clayText,
    textAlign: 'center',
  },
  alertCard: {
    backgroundColor: colors.clayTint,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: 4,
  },
  alertTitle: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 15,
    color: colors.clayText,
  },
  alertBody: {
    fontFamily: fontFamily.body,
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.clayText,
  },
  warnCard: {
    backgroundColor: colors.goldTint,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: 4,
  },
  warnTitle: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 14,
    color: colors.goldStrong,
  },
  warnBody: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 19,
    color: colors.goldStrong,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  note: {
    fontFamily: fontFamily.body,
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.textMuted,
  },
  sectionLabel: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.textFaint,
    marginTop: spacing.sm,
  },
  cardStack: {
    gap: spacing.md,
  },
  plainCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: 4,
  },
  plainCardTitle: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 14,
    color: colors.text,
  },
  plainCardBody: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
  },
  listItem: {
    fontFamily: fontFamily.body,
    fontSize: 13.5,
    lineHeight: 21,
    color: colors.textMuted,
  },
  empty: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  disclaimer: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    lineHeight: 16,
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
