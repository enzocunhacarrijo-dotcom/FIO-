import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '@/components/button';
import { ScreenHeader } from '@/components/screen-header';
import { useAuthStore } from '@/store/auth';
import { colors, fontFamily, radii, spacing } from '@/theme/tokens';

const BENEFITS = [
  'Análises e leituras de produto sem limite diário',
  'Comparador de progresso com histórico completo',
  'Acesso antecipado a novos artigos do Aprender',
];

export default function PremiumScreen() {
  const user = useAuthStore((s) => s.user);
  const setPremium = useAuthStore((s) => s.setPremium);
  const [busy, setBusy] = useState(false);

  const isPremium = user?.isPremium ?? false;

  async function handleToggle() {
    setBusy(true);
    await setPremium(!isPremium);
    setBusy(false);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Premium" onBack={() => router.back()} />

        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Seu plano</Text>
          <Text style={styles.statusValue}>{isPremium ? 'Premium' : 'Gratuito'}</Text>
          {!isPremium && (
            <Text style={styles.statusSub}>Hoje: 3 análises e 5 leituras de produto por dia.</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>O que o Premium desbloqueia</Text>
          {BENEFITS.map((benefit) => (
            <Text key={benefit} style={styles.benefit}>
              · {benefit}
            </Text>
          ))}
        </View>

        <Button
          label={isPremium ? 'Cancelar Premium' : 'Ativar Premium'}
          variant={isPremium ? 'secondary' : 'primary'}
          onPress={handleToggle}
          loading={busy}
        />
        <Text style={styles.disclaimer}>
          Protótipo de validação — este botão só alterna a flag internamente, sem cobrança real. Usamos essa tela
          para entender se as pessoas pagariam por isso.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xxl, gap: spacing.lg },
  statusCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: 4,
  },
  statusLabel: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.textFaint,
  },
  statusValue: { fontFamily: fontFamily.displaySemiBold, fontSize: 28, color: colors.text },
  statusSub: { fontFamily: fontFamily.body, fontSize: 12, color: colors.textMuted, marginTop: 4 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardTitle: { fontFamily: fontFamily.bodySemiBold, fontSize: 14, color: colors.text },
  benefit: { fontFamily: fontFamily.body, fontSize: 13.5, lineHeight: 21, color: colors.textMuted },
  disclaimer: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    lineHeight: 16,
    color: colors.textFaint,
    textAlign: 'center',
  },
});
