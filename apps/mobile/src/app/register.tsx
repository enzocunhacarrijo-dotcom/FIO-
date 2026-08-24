import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '@/components/button';
import { ScreenHeader } from '@/components/screen-header';
import { TextField } from '@/components/text-field';
import { useAuthStore } from '@/store/auth';
import { colors, fontFamily, spacing } from '@/theme/tokens';

export default function RegisterScreen() {
  const registerAccount = useAuthStore((s) => s.registerAccount);
  const busy = useAuthStore((s) => s.busy);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit() {
    clearError();
    setLocalError(null);

    if (password.length < 8) {
      setLocalError('A senha precisa ter ao menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('As senhas não coincidem.');
      return;
    }

    const ok = await registerAccount(email.trim().toLowerCase(), password);
    if (ok) router.replace('/onboarding/objetivo');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ScreenHeader title="Criar conta" onBack={() => router.back()} />

          <View style={styles.form}>
            <TextField
              label="E-mail"
              value={email}
              onChangeText={setEmail}
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
              placeholder="Ao menos 8 caracteres"
            />
            <TextField
              label="Confirmar senha"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              placeholder="Repita a senha"
            />
            {(localError || error) && <Text style={styles.error}>{localError ?? error}</Text>}
          </View>

          <Button label="Criar conta" onPress={handleSubmit} loading={busy} disabled={!email || !password} />
        </ScrollView>
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
    gap: spacing.xl,
  },
  form: {
    gap: spacing.lg,
  },
  error: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    color: colors.clayText,
  },
});
