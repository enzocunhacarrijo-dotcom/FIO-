import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Checkbox } from '@/components/checkbox';
import { Disclaimer } from '@/components/disclaimer';
import { Logo } from '@/components/logo';
import { Strand } from '@/components/strand';
import { Text } from '@/components/text';
import { useAuthStore } from '@/store/auth';
import { colors, radii, spacing } from '@/theme/tokens';

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
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} bounces={false}>
        <View style={styles.hero}>
          <View style={styles.strandDeco} pointerEvents="none">
            <Strand width={320} stroke={14} color={colors.primaryStrong} />
          </View>
          <SafeAreaView edges={['top']}>
            <Animated.View entering={FadeInDown.duration(220)} style={styles.heroContent}>
              <Logo size={44} variant="mono" />
              <Text variant="display" tone="onPrimary">
                Entenda seu cabelo de verdade
              </Text>
              <Text variant="bodyLg" tone="onPrimary" style={styles.subtitle}>
                Fotos guiadas, um questionário curto e um perfil capilar claro e personalizado — para qualquer tipo de
                cabelo, de qualquer pessoa.
              </Text>
            </Animated.View>
          </SafeAreaView>
        </View>

        <SafeAreaView edges={['bottom']} style={styles.actionsSafe}>
          <Animated.View entering={FadeInDown.duration(220).delay(40)} style={styles.actions}>
            {error && (
              <Text variant="bodySm" tone="danger">
                {error}
              </Text>
            )}

            <Card variant="sunken">
              <Checkbox
                checked={lgpdConsented}
                onToggle={setLgpdConsented}
                label="Li e aceito o uso das minhas fotos, respostas do questionário e dados de progresso para gerar minha análise. Posso exportar ou excluir tudo depois, em Minha conta › Privacidade."
              />
            </Card>

            <View style={styles.buttons}>
              <Button label="Criar conta" onPress={() => router.push('/register')} disabled={busy || !lgpdConsented} />
              <Button
                label="Já tenho conta"
                variant="secondary"
                onPress={() => router.push('/login')}
                disabled={busy || !lgpdConsented}
              />
              <Button
                label="Continuar sem conta"
                variant="ghost"
                onPress={handleGuest}
                loading={guestLoading}
                disabled={(busy && !guestLoading) || !lgpdConsented}
              />
            </View>
            <Disclaimer>
              Sem conta, seus dados ficam associados só a este dispositivo. Você pode criar uma conta depois.
            </Disclaimer>
          </Animated.View>
        </SafeAreaView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1 },
  hero: {
    minHeight: '55%',
    backgroundColor: colors.primary,
    borderBottomLeftRadius: radii.xxl,
    borderBottomRightRadius: radii.xxl,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  strandDeco: { position: 'absolute', right: -60, top: 40, opacity: 0.6 },
  heroContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  subtitle: { opacity: 0.85 },
  actionsSafe: { flex: 1 },
  actions: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    gap: spacing.xxl,
  },
  buttons: { gap: spacing.md },
});
