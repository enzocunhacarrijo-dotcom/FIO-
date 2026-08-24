import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '@/components/button';
import { useAuthStore } from '@/store/auth';
import { colors, fontFamily, spacing } from '@/theme/tokens';

export default function WelcomeScreen() {
  const continueAsGuest = useAuthStore((s) => s.continueAsGuest);
  const busy = useAuthStore((s) => s.busy);
  const error = useAuthStore((s) => s.error);
  const [guestLoading, setGuestLoading] = useState(false);

  async function handleGuest() {
    setGuestLoading(true);
    const ok = await continueAsGuest();
    setGuestLoading(false);
    if (ok) router.replace('/onboarding/objetivo');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.title}>Análise capilar, sem achismo</Text>
          <Text style={styles.subtitle}>
            Uma foto guiada, um questionário curto, e um perfil capilar estruturado — pra qualidade do fio ou pra
            densidade e queda, sem distinção de interface.
          </Text>
        </View>

        <View style={styles.actions}>
          {error && <Text style={styles.error}>{error}</Text>}
          <Button label="Criar conta" onPress={() => router.push('/register')} disabled={busy} />
          <Button label="Já tenho conta" variant="secondary" onPress={() => router.push('/login')} disabled={busy} />
          <Button
            label="Continuar sem conta"
            variant="secondary"
            onPress={handleGuest}
            loading={guestLoading}
            disabled={busy && !guestLoading}
          />
          <Text style={styles.disclaimer}>
            Sem conta, seus dados ficam associados só a este dispositivo. Você pode criar uma conta depois.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    justifyContent: 'space-between',
  },
  hero: {
    marginTop: spacing.xxl * 2,
    gap: spacing.md,
  },
  title: {
    fontFamily: fontFamily.displaySemiBold,
    fontSize: 32,
    lineHeight: 38,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fontFamily.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
  },
  actions: {
    gap: spacing.md,
  },
  error: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    color: colors.clayText,
  },
  disclaimer: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    lineHeight: 16,
    color: colors.textFaint,
    marginTop: spacing.xs,
  },
});
