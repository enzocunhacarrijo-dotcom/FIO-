import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '@/components/button';
import { ScreenHeader } from '@/components/screen-header';
import { TextField } from '@/components/text-field';
import { useAuthStore } from '@/store/auth';
import { colors, fontFamily, spacing } from '@/theme/tokens';

export default function LoginScreen() {
  const loginAccount = useAuthStore((s) => s.loginAccount);
  const busy = useAuthStore((s) => s.busy);
  const error = useAuthStore((s) => s.error);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit() {
    const ok = await loginAccount(email.trim().toLowerCase(), password);
    if (ok) router.replace('/');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ScreenHeader title="Entrar" onBack={() => router.back()} />

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
              placeholder="Sua senha"
            />
            {error && <Text style={styles.error}>{error}</Text>}
          </View>

          <Button label="Entrar" onPress={handleSubmit} loading={busy} disabled={!email || !password} />
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
