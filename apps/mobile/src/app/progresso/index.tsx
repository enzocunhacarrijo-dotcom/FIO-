import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import type { AnalysisHistoryItem, StressLevel } from '@hair-analysis/shared';
import { Button } from '@/components/button';
import { ChoiceChips } from '@/components/choice-chips';
import { EvolutionChart } from '@/components/evolution-chart';
import { ScreenHeader } from '@/components/screen-header';
import { getAnalysisHistory } from '@/api/analysis';
import { getHabitEntry, setHabitEntry } from '@/api/habits';
import { getReminderPreference, setReminderPreference, REMINDER_INTERVAL_OPTIONS } from '@/lib/reminders';
import { todayLocalDateString } from '@/lib/date';
import { useAuthStore } from '@/store/auth';
import { colors, fontFamily, radii, spacing } from '@/theme/tokens';

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
      <View style={styles.center}>
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Progresso" onBack={() => router.back()} />

        <View>
          <Text style={styles.sectionLabel}>Evolução do Índice Capilar</Text>
          <EvolutionChart items={history} width={342} />
        </View>

        {history.length >= 2 && (
          <Button label="Comparar duas fotos" variant="secondary" onPress={() => router.push('/progresso/comparador')} />
        )}

        {history.length > 0 && (
          <View>
            <Text style={styles.sectionLabel}>Linha do tempo</Text>
            <View style={styles.cardStack}>
              {history.map((item) => (
                <View key={item.id} style={styles.timelineCard}>
                  <Text style={styles.timelineDate}>{formatFullDate(item.createdAt)}</Text>
                  <Text style={styles.timelineTotal}>{item.indiceCapilar.total}/100</Text>
                  <Text style={styles.timelineSub}>
                    Hidratação {item.indiceCapilar.hidratacao} · Integridade {item.indiceCapilar.integridade} · Couro{' '}
                    {item.indiceCapilar.couro} · Densidade {item.indiceCapilar.densidade}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View>
          <Text style={styles.sectionLabel}>Registro rápido de hoje</Text>
          <View style={styles.habitCard}>
            <Text style={styles.habitQuestion}>Dormiu bem?</Text>
            <ChoiceChips options={SLEEP_OPTIONS} selected={sleepWell} onSelect={handleSleepChange} />
            <Text style={styles.habitQuestion}>Nível de estresse</Text>
            <ChoiceChips options={STRESS_OPTIONS} selected={stressLevel} onSelect={handleStressChange} />
            {habitSaving && <ActivityIndicator size="small" color={colors.textFaint} />}
          </View>
        </View>

        <View>
          <Text style={styles.sectionLabel}>Lembrete de nova análise</Text>
          <View style={styles.habitCard}>
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
                <Text style={styles.habitQuestion}>A cada quantos dias?</Text>
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
            {reminderSaving && <ActivityIndicator size="small" color={colors.textFaint} />}
            {reminderError && <Text style={styles.error}>{reminderError}</Text>}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  sectionLabel: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.textFaint,
    marginBottom: spacing.sm,
  },
  cardStack: { gap: spacing.md },
  timelineCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: 4,
  },
  timelineDate: { fontFamily: fontFamily.bodySemiBold, fontSize: 13, color: colors.text },
  timelineTotal: { fontFamily: fontFamily.displaySemiBold, fontSize: 22, color: colors.text },
  timelineSub: { fontFamily: fontFamily.body, fontSize: 12, color: colors.textMuted },
  habitCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  habitQuestion: { fontFamily: fontFamily.bodySemiBold, fontSize: 13, color: colors.text, marginTop: spacing.xs },
  error: { fontFamily: fontFamily.body, fontSize: 12, color: colors.dangerText },
});
