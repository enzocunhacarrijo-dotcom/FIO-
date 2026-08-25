import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '@/components/button';
import { ScreenHeader } from '@/components/screen-header';
import { exportMyData, deleteMyAccount } from '@/api/auth';
import { exportAndShare } from '@/lib/export-data';
import { ApiError } from '@/api/client';
import { useAuthStore } from '@/store/auth';
import { colors, fontFamily, radii, spacing } from '@/theme/tokens';

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

        <View style={styles.card}>
          <Text style={styles.cardTitle}>O que guardamos</Text>
          <Text style={styles.body}>
            Suas três fotos de captura, as respostas do questionário, o histórico de análises e leituras de produto, e
            seus registros de sono/estresse — tudo associado só à sua conta (ou a este dispositivo, no modo sem
            conta). Usamos isso exclusivamente para gerar sua análise e sua rotina, nunca para outro fim.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Exportar meus dados</Text>
          <Text style={styles.body}>Baixe uma cópia de tudo que guardamos sobre você em um arquivo JSON.</Text>
          {exportError && <Text style={styles.error}>{exportError}</Text>}
          <Button label="Exportar meus dados" variant="secondary" onPress={handleExport} loading={exporting} />
        </View>

        <View style={[styles.card, styles.dangerCard]}>
          <Text style={styles.cardTitle}>Excluir minha conta</Text>
          <Text style={styles.body}>
            Remove permanentemente sua conta, fotos, análises e histórico. Essa ação não pode ser desfeita.
          </Text>
          {deleteError && <Text style={styles.error}>{deleteError}</Text>}

          {!confirmingDelete ? (
            <Button label="Excluir minha conta" variant="secondary" onPress={() => setConfirmingDelete(true)} />
          ) : (
            <View style={styles.confirmRow}>
              {deleting ? (
                <ActivityIndicator color={colors.clayText} />
              ) : (
                <>
                  <Button label="Cancelar" variant="secondary" onPress={() => setConfirmingDelete(false)} style={styles.confirmBtn} />
                  <Button label="Sim, excluir tudo" onPress={handleDelete} style={styles.confirmBtn} />
                </>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xxl, gap: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  dangerCard: {
    borderColor: colors.clayTint,
  },
  cardTitle: { fontFamily: fontFamily.bodySemiBold, fontSize: 14, color: colors.text },
  body: { fontFamily: fontFamily.body, fontSize: 13, lineHeight: 19, color: colors.textMuted },
  error: { fontFamily: fontFamily.body, fontSize: 12, color: colors.clayText },
  confirmRow: { flexDirection: 'row', gap: spacing.sm },
  confirmBtn: { flex: 1 },
});
