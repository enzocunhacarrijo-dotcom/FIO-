import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import type { AnalysisHistoryItem, StressLevel } from '@hair-analysis/shared';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { ChoiceChips } from '@/components/choice-chips';
import { EvolutionChart } from '@/components/evolution-chart';
import { ScreenHeader } from '@/components/screen-header';
import { SectionHeader } from '@/components/section-header';
import { Strand } from '@/components/strand';
import { Text } from '@/components/text';
import { getAnalysisHistory } from '@/api/analysis';
import { getHabitEntry, setHabitEntry } from '@/api/habits';
import { getReminderPreference, setReminderPreference, REMINDER_INTERVAL_OPTIONS } from '@/lib/reminders';
import { todayLocalDateString } from '@/lib/date';
import { useAuthStore } from '@/store/auth';
import { colors, motion, radii, spacing } from '@/theme/tokens';

const enter = (i: number) => FadeInDown.duration(motion.duration.base).delay(i * 40);

const STRESS_OPTIONS: { value: StressLevel; label: string }[] = [
  { value: 'baixo', label: 'Baixo' },
  { value: 'medio', label: 'Médio' },
  { value: 'alto', label: 'Alto' },
];
const SLEEP_OPTIONS: { value: 'sim' | 'nao'; label: string }[] = [
  { value: 'sim', label: 'Sim' },
  { value: 'nao', label: 'Não' },
];
const INTERVAL_OPTIONS = REMINDER_INTERVAL_OPTIONS.map((d) => ({ value: String(d), label: `${d} dias` }));

function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function ProgressoScreen() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const { width: screenWidth } = useWindowDimensions();
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [sleepWell, setSleepWell] = useState<'sim' | 'nao' | null>(null);
  const [stressLevel, setStressLevel] = useState<StressLevel | null>(null);
  const [habitSaving, setHabitSaving] = useState(false);

  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderInterval, setReminderInterval] = useState(String(30));
  const [reminderError, setReminderError] = useState<string | null>(null);
  const [reminderSaving, setReminderSaving] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    const today = todayLocalDateString();
    Promise.all([getAnalysisHistory(accessToken), getHabitEntry(accessToken, today), getReminderPreference()])
      .then(([hist, habit, reminder]) => {
        setHistory(hist);
        setSleepWell(habit.sleepWell === null ? null : habit.sleepWell ? 'sim' : 'nao');
        setStressLevel(habit.stressLevel);
        setReminderEnabled(reminder.enabled);
        setReminderInterval(String(reminder.intervalDays));
      })
      .finally(() => setLoading(false));
  }, [accessToken]);

  async function handleSleepChange(value: 'sim' | 'nao') {
    if (!accessToken) return;
    setSleepWell(value);
    setHabitSaving(true);
    try {
      await setHabitEntry(accessToken, todayLocalDateString(), { sleepWell: value === 'sim' });
    } finally {
      setHabitSaving(false);
    }
  }

  async function handleStressChange(value: StressLevel) {
    if (!accessToken) return;
    setStressLevel(value);
    setHabitSaving(true);
    try {
      await setHabitEntry(accessToken, todayLocalDateString(), { stressLevel: value });
    } finally {
      setHabitSaving(false);
    }
  }

  async function applyReminder(enabled: boolean, intervalDays: number) {
    setReminderSaving(true);
    setReminderError(null);
    const lastAnalysisDate = history[0] ? new Date(history[0].createdAt) : null;
    const result = await setReminderPreference({ enabled, intervalDays }, lastAnalysisDate);
    if (!result.ok) setReminderError(result.error ?? 'Não foi possível salvar.');
    setReminderSaving(false);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <View style={[styles.skeleton, { height: 40, width: '50%' }]} />
          <View style={[styles.skeleton, { height: 220, borderRadius: radii.lg }]} />
          <View style={[styles.skeleton, { height: 96, borderRadius: radii.lg }]} />
        </View>
      </SafeAreaView>
    );
  }

  const delta = history.length >= 2 ? history[0].indiceCapilar.total - history[history.length - 1].indiceCapilar.total : null;
  const chartWidth = screenWidth - spacing.xl * 2 - spacing.md * 2;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Progresso" onBack={() => router.back()} />

        <Animated.View entering={enter(0)} style={styles.section}>
          <SectionHeader
            title="Evolução do Índice Capilar"
            action={
              delta !== null ? (
                <Text variant="h3" style={{ color: delta >= 0 ? colors.success : colors.dangerText }}>
                  {delta > 0 ? '+' : ''}
                  {delta} pts
                </Text>
              ) : undefined
            }
          />
          <Card padding={spacing.md}>
            <EvolutionChart items={history} width={chartWidth} />
          </Card>
          {history.length >= 2 && (
            <Button label="Comparar duas fotos" variant="secondary" onPress={() => router.push('/progresso/comparador')} />
          )}
        </Animated.View>

        {history.length > 0 && (
          <Animated.View entering={enter(1)} style={styles.section}>
            <SectionHeader title="Linha do tempo" />
            <View>
              {history.map((item, i) => (
                <View key={item.id} style={styles.timelineRow}>
                  <View style={styles.rail}>
                    <View style={styles.node} />
                    {i < history.length - 1 && <View style={styles.railLine} />}
                  </View>
                  <Card padding={spacing.lg} style={styles.timelineCard}>
                    <Text variant="caption" tone="muted">
                      {formatFullDate(item.createdAt)}
                    </Text>
                    <Text variant="h2">{item.indiceCapilar.total}/100</Text>
                    <Text variant="bodySm" tone="muted">
                      Hidratação {item.indiceCapilar.hidratacao} · Integridade {item.indiceCapilar.integridade} · Couro{' '}
                      {item.indiceCapilar.couro} · Densidade {item.indiceCapilar.densidade}
                    </Text>
                  </Card>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        <Animated.View entering={enter(2)} style={styles.section}>
          <SectionHeader title="Registro rápido de hoje" />
          <Card style={styles.cardStack}>
            <Text variant="label">Dormiu bem?</Text>
            <ChoiceChips options={SLEEP_OPTIONS} selected={sleepWell} onSelect={handleSleepChange} />
            <Text variant="label">Nível de estresse</Text>
            <ChoiceChips options={STRESS_OPTIONS} selected={stressLevel} onSelect={handleStressChange} />
            {habitSaving && <Strand width={24} stroke={2} color={colors.textFaint} animated loop />}
          </Card>
        </Animated.View>

        <Animated.View entering={enter(3)} style={styles.section}>
          <SectionHeader title="Lembrete de nova análise" />
          <Card style={styles.cardStack}>
            <ChoiceChips
              options={[
                { value: 'on', label: 'Ativado' },
                { value: 'off', label: 'Desativado' },
              ]}
              selected={reminderEnabled ? 'on' : 'off'}
              onSelect={(v) => {
                const enabled = v === 'on';
                setReminderEnabled(enabled);
                applyReminder(enabled, Number(reminderInterval));
              }}
            />
            {reminderEnabled && (
              <>
                <Text variant="label">A cada quantos dias?</Text>
                <ChoiceChips
                  options={INTERVAL_OPTIONS}
                  selected={reminderInterval}
                  onSelect={(v) => {
                    setReminderInterval(v);
                    applyReminder(true, Number(v));
                  }}
                />
              </>
            )}
            {reminderSaving && <Strand width={24} stroke={2} color={colors.textFaint} animated loop />}
            {reminderError && (
              <Text variant="bodySm" tone="danger">
                {reminderError}
              </Text>
            )}
          </Card>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
    gap: spacing.xxl,
  },
  skeleton: { backgroundColor: colors.surfaceSunken, borderRadius: radii.md },
  section: { gap: spacing.lg },
  cardStack: { gap: spacing.md },
  timelineRow: { flexDirection: 'row', gap: spacing.md },
  rail: { width: 10, alignItems: 'center' },
  node: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, marginTop: spacing.xl },
  railLine: { width: 2, flex: 1, backgroundColor: colors.primaryTint },
  timelineCard: { flex: 1, gap: spacing.xxs, marginBottom: spacing.md },
});
