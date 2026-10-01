import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { GoogleButton, OrDivider } from '@/components/google-button';
import { ScreenHeader } from '@/components/screen-header';
import { Text } from '@/components/text';
import { TextField } from '@/components/text-field';
import { friendlyAuthError, isUseGoogleError, validateEmail } from '@/lib/auth-validation';
import { useAuthStore } from '@/store/auth';
import { colors, spacing } from '@/theme/tokens';

export default function LoginScreen() {
  const loginAccount = useAuthStore((s) => s.loginAccount);
  const busy = useAuthStore((s) => s.busy);
  const error = friendlyAuthError(useAuthStore((s) => s.error));
  const clearError = useAuthStore((s) => s.clearError);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [submitting, setSubmitting] = useState<'form' | 'google' | null>(null);
  const useGoogle = isUseGoogleError(error);

  async function handleSubmit() {
    clearError();
    setEmailTouched(true);
    if (validateEmail(email)) return;
    setSubmitting('form');
    const ok = await loginAccount(email.trim().toLowerCase(), password);
    setSubmitting(null);
    if (ok) router.replace('/');
  }

  async function handleGoogle() {
    clearError();
    setSubmitting('google');
    const result = await signInWithGoogle();
    setSubmitting(null);
    if (result === 'ok') router.replace('/');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ScreenHeader title="Entrar" onBack={() => router.back()} />

          <Animated.View entering={FadeInDown.duration(220)} style={styles.form}>
            <GoogleButton
              onPress={handleGoogle}
              loading={submitting === 'google'}
              disabled={busy && submitting !== 'google'}
              highlight={useGoogle}
            />
            <OrDivider />
            <TextField
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              onBlur={() => setEmailTouched(true)}
              error={emailTouched ? (validateEmail(email) ?? undefined) : undefined}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="voce@exemplo.com"
            />
            <TextField
              label="Senha"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              placeholder="Sua senha"
            />
            {error && (
              <Card variant={useGoogle ? 'tint' : 'danger'} padding={spacing.md}>
                <Text variant="bodySm" tone={useGoogle ? 'primary' : 'danger'} accessibilityRole="alert">
                  {error}
                </Text>
              </Card>
            )}
          </Animated.View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            label="Entrar"
            onPress={handleSubmit}
            loading={submitting === 'form' && busy}
            disabled={!email || !password || (busy && submitting !== 'form')}
          />
          <Button label="Criar uma conta" variant="ghost" size="md" onPress={() => router.replace('/register')} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.xxl,
  },
  form: {
    gap: spacing.lg,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.xs,
  },
});
