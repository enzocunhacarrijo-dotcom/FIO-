import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { GoogleButton } from '@/components/google-button';
import { ListRow } from '@/components/list-row';
import { ScreenHeader } from '@/components/screen-header';
import { Text } from '@/components/text';
import { friendlyAuthError } from '@/lib/auth-validation';
import { useAuthStore } from '@/store/auth';
import { colors, motion, radii, spacing } from '@/theme/tokens';

export default function ContaScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const clearError = useAuthStore((s) => s.clearError);
  const error = friendlyAuthError(useAuthStore((s) => s.error));
  const busy = useAuthStore((s) => s.busy);
  const [googleLoading, setGoogleLoading] = useState(false);
  const isGuest = user?.kind === 'guest';
  const hasGoogle = user?.providers?.includes('google') ?? false;

  async function handleGoogle() {
    clearError();
    setGoogleLoading(true);
    await signInWithGoogle();
    setGoogleLoading(false);
  }

  async function handleLogout() {
    await logout();
    router.replace('/welcome');
  }

  const initial = (user?.email?.trim()[0] ?? 'F').toUpperCase();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Minha conta" onBack={() => router.back()} />

        <Animated.View entering={FadeInDown.duration(motion.duration.base)} style={styles.profile}>
          <View style={styles.avatar}>
            <Text variant="h1" tone="primary">
              {initial}
            </Text>
          </View>
          <Text variant="body" tone="muted">
            {isGuest ? 'Convidado' : (user?.email ?? '')}
          </Text>
          {hasGoogle && (
            <Text variant="caption" tone="faint">
              Conectada com Google
            </Text>
          )}
        </Animated.View>

        {isGuest && (
          <Animated.View entering={FadeInDown.duration(motion.duration.base).delay(20)}>
            <Card variant="tint" style={styles.upgrade}>
              <Text variant="h3">Salve seus dados em uma conta</Text>
              <Text variant="bodySm" tone="muted">
                Hoje seus dados ficam só neste dispositivo. Crie uma conta para não perdê-los e acessar de qualquer
                lugar — tudo o que você já fez é mantido.
              </Text>
              {error && (
                <Text variant="bodySm" tone="danger" accessibilityRole="alert">
                  {error}
                </Text>
              )}
              <Button label="Criar conta" icon="arrow.right" onPress={() => router.push('/register')} />
              <GoogleButton onPress={handleGoogle} loading={googleLoading} disabled={busy && !googleLoading} />
            </Card>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.duration(motion.duration.base).delay(40)}>
          <Card padding={spacing.sm}>
            <ListRow
              icon="leaf"
              title="Aprender"
              subtitle="Glossário de ingredientes e artigos sobre cuidados capilares"
              onPress={() => router.push('/aprender')}
            />
            <ListRow
              icon="sparkle"
              title="Premium"
              subtitle={user?.isPremium ? 'Você está no plano Premium' : 'Veja o que o Premium desbloqueia'}
              onPress={() => router.push('/premium')}
            />
            <ListRow
              icon="lock"
              title="Privacidade"
              subtitle="Exportar ou excluir seus dados"
              onPress={() => router.push('/privacidade')}
            />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(motion.duration.base).delay(80)}>
          <Card padding={spacing.sm}>
            <ListRow icon="close" title="Sair" tone="danger" onPress={handleLogout} hideChevron />
          </Card>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xxxl, gap: spacing.xxl },
  upgrade: { gap: spacing.md },
  profile: { alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
