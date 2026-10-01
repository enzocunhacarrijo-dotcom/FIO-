import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { ListRow } from '@/components/list-row';
import { ScreenHeader } from '@/components/screen-header';
import { SectionHeader } from '@/components/section-header';
import { Text } from '@/components/text';
import { exportMyData, deleteMyAccount } from '@/api/auth';
import { exportAndShare } from '@/lib/export-data';
import { ApiError } from '@/api/client';
import { useAuthStore } from '@/store/auth';
import { colors, motion, spacing } from '@/theme/tokens';

const enter = (i: number) => FadeInDown.duration(motion.duration.base).delay(i * 40);

export default function PrivacidadeScreen() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useAuthStore((s) => s.logout);

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleExport() {
    if (!accessToken) return;
    setExporting(true);
    setExportError(null);
    try {
      const data = await exportMyData(accessToken);
      await exportAndShare(data);
    } catch (err) {
      setExportError(err instanceof ApiError ? err.message : 'Não foi possível exportar seus dados agora.');
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    if (!accessToken) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteMyAccount(accessToken);
      await logout();
      router.replace('/welcome');
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Não foi possível excluir sua conta agora.');
      setDeleting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Privacidade" onBack={() => router.back()} />

        <Animated.View entering={enter(0)} style={styles.section}>
          <SectionHeader title="O que guardamos" />
          <Card variant="tint">
            <Text variant="body">
              Suas três fotos de captura, as respostas do questionário, o histórico de análises e leituras de
              produto, e seus registros de sono/estresse — tudo associado só à sua conta (ou a este dispositivo, no
              modo sem conta). Usamos isso exclusivamente para gerar sua análise e sua rotina, nunca para outro fim.
            </Text>
          </Card>
        </Animated.View>

        <Animated.View entering={enter(1)} style={styles.section}>
          <SectionHeader title="Exportar meus dados" />
          <Card style={styles.cardStack}>
            <Text variant="body" tone="muted">
              Baixe uma cópia de tudo que guardamos sobre você em um arquivo JSON.
            </Text>
            {exportError && (
              <Text variant="bodySm" tone="danger">
                {exportError}
              </Text>
            )}
            <Button label="Exportar meus dados" variant="secondary" onPress={handleExport} loading={exporting} />
          </Card>
        </Animated.View>

        <Animated.View entering={enter(2)} style={styles.section}>
          <SectionHeader title="Excluir minha conta" />
          {!confirmingDelete ? (
            <Card padding={spacing.sm}>
              <ListRow
                icon="warning"
                title="Excluir minha conta"
                subtitle="Remove permanentemente sua conta, fotos, análises e histórico."
                tone="danger"
                onPress={() => setConfirmingDelete(true)}
              />
            </Card>
          ) : (
            <Card variant="danger" style={styles.cardStack}>
              <Text variant="body" tone="danger">
                Remove permanentemente sua conta, fotos, análises e histórico. Essa ação não pode ser desfeita.
              </Text>
              {deleteError && (
                <Text variant="bodySm" tone="danger">
                  {deleteError}
                </Text>
              )}
              <View style={styles.confirmRow}>
                <Button
                  label="Cancelar"
                  variant="secondary"
                  onPress={() => setConfirmingDelete(false)}
                  disabled={deleting}
                  style={styles.confirmBtn}
                />
                <Button label="Sim, excluir tudo" onPress={handleDelete} loading={deleting} style={styles.confirmBtn} />
              </View>
            </Card>
          )}
          {!confirmingDelete && deleteError && (
            <Text variant="bodySm" tone="danger">
              {deleteError}
            </Text>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xxxl, gap: spacing.xxl },
  section: { gap: spacing.lg },
  cardStack: { gap: spacing.md },
  confirmRow: { flexDirection: 'row', gap: spacing.md },
  confirmBtn: { flex: 1 },
});
