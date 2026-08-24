import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { AnalysisResult } from '@hair-analysis/shared';
import { OptionCard } from '@/components/option-card';
import { getRoutineStatus, setRoutineStatus } from '@/api/routine';
import { todayLocalDateString, todayWeekday, WEEKDAY_LABEL } from '@/lib/date';
import { colors, fontFamily, radii, spacing } from '@/theme/tokens';

export function RotinaChecklist({
  accessToken,
  rotinaSemanal,
}: {
  accessToken: string;
  rotinaSemanal: AnalysisResult['rotinaSemanal'];
}) {
  const today = todayWeekday();
  const todayEntry = rotinaSemanal.find((d) => d.dia === today);
  const date = todayLocalDateString();

  const [completed, setCompleted] = useState<string[]>([]);
  const [streakDays, setStreakDays] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getRoutineStatus(accessToken, date)
      .then((status) => {
        if (cancelled) return;
        setCompleted(status.completedActions);
        setStreakDays(status.streakDays);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggle(acao: string) {
    const next = completed.includes(acao) ? completed.filter((a) => a !== acao) : [...completed, acao];
    setCompleted(next);
    setSaving(true);
    try {
      const status = await setRoutineStatus(accessToken, date, next);
      setStreakDays(status.streakDays);
    } catch {
      setCompleted(completed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Hoje — {WEEKDAY_LABEL[today]}</Text>
        {loading ? (
          <ActivityIndicator size="small" color={colors.textFaint} />
        ) : (
          <Text style={styles.streak}>
            {streakDays > 0 ? `Sequência: ${streakDays} ${streakDays === 1 ? 'dia' : 'dias'}` : 'Comece sua sequência hoje'}
          </Text>
        )}
      </View>

      {!todayEntry && !loading && <Text style={styles.empty}>Nenhuma ação prevista para hoje na sua rotina.</Text>}

      {todayEntry && (
        <View style={styles.list}>
          {todayEntry.acoes.map((acao) => (
            <OptionCard
              key={acao}
              label={acao}
              mode="multi"
              selected={completed.includes(acao)}
              onPress={() => toggle(acao)}
            />
          ))}
        </View>
      )}
      {saving && <ActivityIndicator size="small" color={colors.textFaint} style={styles.saving} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: fontFamily.bodySemiBold, fontSize: 14, color: colors.text },
  streak: { fontFamily: fontFamily.bodySemiBold, fontSize: 12, color: colors.goldStrong },
  empty: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    color: colors.textMuted,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  list: { gap: spacing.sm },
  saving: { alignSelf: 'center' },
});
