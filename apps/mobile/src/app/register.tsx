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
import { friendlyAuthError, validateConfirm, validateEmail, validatePassword } from '@/lib/auth-validation';
import { useAuthStore } from '@/store/auth';
import { colors, motion, spacing } from '@/theme/tokens';

type Field = 'email' | 'password' | 'confirm';

export default function RegisterScreen() {
  const signUp = useAuthStore((s) => s.signUp);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const busy = useAuthStore((s) => s.busy);
  const error = friendlyAuthError(useAuthStore((s) => s.error));
  const clearError = useAuthStore((s) => s.clearError);
  const isGuest = useAuthStore((s) => s.user?.kind === 'guest');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [touched, setTouched] = useState<Record<Field, boolean>>({ email: false, password: false, confirm: false });
  const [submitting, setSubmitting] = useState<'form' | 'google' | null>(null);

  const errors = {
    email: touched.email ? validateEmail(email) : null,
    password: touched.password ? validatePassword(password) : null,
    confirm: touched.confirm ? validateConfirm(password, confirmPassword) : null,
  };
  const valid = !validateEmail(email) && !validatePassword(password) && !validateConfirm(password, confirmPassword);

  function touch(field: Field) {
    setTouched((t) => ({ ...t, [field]: true }));
  }

  async function handleSubmit() {
    clearError();
    setTouched({ email: true, password: true, confirm: true });
    if (!valid) return;
    setSubmitting('form');
    const ok = await signUp(email.trim().toLowerCase(), password);
    setSubmitting(null);
    if (ok) router.replace(isGuest ? '/' : '/onboarding/questionario');
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
          <ScreenHeader
            title={isGuest ? 'Salvar meus dados' : 'Criar conta'}
            eyebrow={isGuest ? 'Converter em conta' : undefined}
            onBack={() => router.back()}
          />

          <Animated.View entering={FadeInDown.duration(motion.duration.base)} style={styles.body}>
            {isGuest && (
              <Card variant="tint" padding={spacing.lg}>
                <Text variant="bodySm" tone="primary">
                  Suas fotos, respostas e progresso atuais serão mantidos na conta que você criar.
                </Text>
              </Card>
            )}

            <GoogleButton
              onPress={handleGoogle}
              loading={submitting === 'google'}
              disabled={busy && submitting !== 'google'}
            />

            <OrDivider />

            <View style={styles.form}>
              <TextField
                label="E-mail"
                value={email}
                onChangeText={setEmail}
                onBlur={() => touch('email')}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                placeholder="voce@exemplo.com"
                error={errors.email ?? undefined}
              />
              <TextField
                label="Senha"
                value={password}
                onChangeText={setPassword}
                onBlur={() => touch('password')}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                placeholder="Ao menos 8 caracteres"
                error={errors.password ?? undefined}
              />
              <TextField
                label="Confirmar senha"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onBlur={() => touch('confirm')}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                placeholder="Repita a senha"
                error={errors.confirm ?? undefined}
              />
              {error && (
                <Card variant="danger" padding={spacing.md}>
                  <Text variant="bodySm" tone="danger" accessibilityRole="alert">
                    {error}
                  </Text>
                </Card>
              )}
            </View>
          </Animated.View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            label={isGuest ? 'Salvar e criar conta' : 'Criar conta'}
            onPress={handleSubmit}
            loading={submitting === 'form' && busy}
            disabled={busy && submitting !== 'form'}
          />
          <Button label="Já tenho conta" variant="ghost" size="md" onPress={() => router.replace('/login')} />
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
  body: { gap: spacing.xl },
  form: { gap: spacing.lg },
  footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.lg, gap: spacing.xs },
});
