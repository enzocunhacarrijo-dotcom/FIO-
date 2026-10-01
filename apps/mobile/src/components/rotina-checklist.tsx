import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Circle } from 'react-native-svg';
import type { AnalysisResult } from '@hair-analysis/shared';
import { Card } from '@/components/card';
import { CheckBox } from '@/components/checkbox';
import { Icon } from '@/components/icon';
import { Text } from '@/components/text';
import { getRoutineStatus, setRoutineStatus } from '@/api/routine';
import { todayLocalDateString, todayWeekday, WEEKDAY_LABEL } from '@/lib/date';
import { colors, elevation, fontFamily, radii, spacing } from '@/theme/tokens';

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

  const total = todayEntry?.acoes.length ?? 0;
  const done = todayEntry ? todayEntry.acoes.filter((a) => completed.includes(a)).length : 0;
  const RING = 44;
  const RR = 18;
  const CIRC = 2 * Math.PI * RR;

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          {total > 0 && (
            <View style={styles.ring} accessible accessibilityLabel={`${done} de ${total} ações concluídas`}>
              <Svg width={RING} height={RING}>
                <Circle cx={RING / 2} cy={RING / 2} r={RR} stroke={colors.surfaceSunken} strokeWidth={4} fill="none" />
                <Circle
                  cx={RING / 2}
                  cy={RING / 2}
                  r={RR}
                  stroke={colors.primary}
                  strokeWidth={4}
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={CIRC}
                  strokeDashoffset={CIRC * (1 - done / total)}
                  rotation={-90}
                  originX={RING / 2}
                  originY={RING / 2}
                />
              </Svg>
              <View style={styles.ringLabel} pointerEvents="none">
                <Text variant="caption" style={styles.ringText}>
                  {done}/{total}
                </Text>
              </View>
            </View>
          )}
          <Text variant="h3">Hoje — {WEEKDAY_LABEL[today]}</Text>
        </View>
        {loading ? (
          <ActivityIndicator size="small" color={colors.textFaint} />
        ) : (
          <View style={styles.streak}>
            <Icon name="flame" size={16} color={colors.accent} />
            <Text variant="caption" style={styles.streakText}>
              {streakDays > 0 ? `${streakDays} ${streakDays === 1 ? 'dia' : 'dias'}` : 'Comece hoje'}
            </Text>
          </View>
        )}
      </View>

      {!todayEntry && !loading && (
        <Card variant="sunken">
          <Text variant="bodySm" tone="muted">
            Nenhuma ação prevista para hoje na sua rotina.
          </Text>
        </Card>
      )}

      {todayEntry && (
        <View style={styles.list}>
          {todayEntry.acoes.map((acao) => {
            const isDone = completed.includes(acao);
            return (
              <Pressable
                key={acao}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isDone }}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  toggle(acao);
                }}
                style={[styles.item, elevation('sm'), isDone && styles.itemDone]}
              >
                <CheckBox checked={isDone} />
                <Text variant="label" style={[styles.itemText, isDone && styles.itemTextDone]}>
                  {acao}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
      {saving && <ActivityIndicator size="small" color={colors.textFaint} style={styles.saving} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  ring: { width: 44, height: 44 },
  ringLabel: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  ringText: { fontFamily: fontFamily.bodySemiBold, fontSize: 11 },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.accentTint,
  },
  streakText: { color: colors.accentStrong, fontFamily: fontFamily.bodySemiBold },
  list: { gap: spacing.sm },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  itemDone: { opacity: 0.6 },
  itemText: { flex: 1, fontSize: 15, lineHeight: 20 },
  itemTextDone: { textDecorationLine: 'line-through' },
  saving: { alignSelf: 'center' },
});
