import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '@/components/button';
import { Checkbox } from '@/components/checkbox';
import { Logo } from '@/components/logo';
import { useAuthStore } from '@/store/auth';
import { colors, fontFamily, spacing } from '@/theme/tokens';

export default function WelcomeScreen() {
  const continueAsGuest = useAuthStore((s) => s.continueAsGuest);
  const busy = useAuthStore((s) => s.busy);
  const error = useAuthStore((s) => s.error);
  const lgpdConsented = useAuthStore((s) => s.lgpdConsented);
  const setLgpdConsented = useAuthStore((s) => s.setLgpdConsented);
  const [guestLoading, setGuestLoading] = useState(false);

  async function handleGuest() {
    setGuestLoading(true);
    const ok = await continueAsGuest();
    setGuestLoading(false);
    if (ok) router.replace('/onboarding/questionario');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <Logo size={52} />
          <Text style={styles.title}>Entenda seu cabelo de verdade</Text>
          <Text style={styles.subtitle}>
            Fotos guiadas, um questionário curto e um perfil capilar claro e personalizado — para qualquer tipo de
            cabelo, de qualquer pessoa.
          </Text>
        </View>

        <View style={styles.actions}>
          {error && <Text style={styles.error}>{error}</Text>}

          <Checkbox
            checked={lgpdConsented}
            onToggle={setLgpdConsented}
            label="Li e aceito o uso das minhas fotos, respostas do questionário e dados de progresso para gerar minha análise. Posso exportar ou excluir tudo depois, em Minha conta › Privacidade."
          />

          <Button label="Criar conta" onPress={() => router.push('/register')} disabled={busy || !lgpdConsented} />
          <Button
            label="Já tenho conta"
            variant="secondary"
            onPress={() => router.push('/login')}
            disabled={busy || !lgpdConsented}
          />
          <Button
            label="Continuar sem conta"
            variant="secondary"
            onPress={handleGuest}
            loading={guestLoading}
            disabled={(busy && !guestLoading) || !lgpdConsented}
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
    gap: spacing.lg,
  },
  title: {
    fontFamily: fontFamily.displaySemiBold,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.5,
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
    color: colors.dangerText,
  },
  disclaimer: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    lineHeight: 16,
    color: colors.textFaint,
    marginTop: spacing.xs,
  },
});
