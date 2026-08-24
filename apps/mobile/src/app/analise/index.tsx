import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '@/components/button';
import { requestAnalysis } from '@/api/analysis';
import { ApiError } from '@/api/client';
import { useAuthStore } from '@/store/auth';
import { colors, fontFamily, spacing } from '@/theme/tokens';

const STATUS_MESSAGES = ['Validando fotos…', 'Analisando sua imagem…', 'Montando sua rotina…'];
const STATUS_INTERVAL_MS = 9000;

export default function AnaliseLoadingScreen() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [statusIndex, setStatusIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const started = useRef(false);

  async function run() {
    if (!accessToken) {
      setError('Sessão inválida. Volte e entre novamente.');
      return;
    }
    setRunning(true);
    setError(null);
    setStatusIndex(0);
    try {
      await requestAnalysis(accessToken);
      router.replace('/analise/resultado');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível gerar sua análise agora.');
    } finally {
      setRunning(false);
    }
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setStatusIndex((i) => Math.min(i + 1, STATUS_MESSAGES.length - 1));
    }, STATUS_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [running]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        {running && (
          <>
            <ActivityIndicator color={colors.text} size="large" />
            <Text style={styles.status}>{STATUS_MESSAGES[statusIndex]}</Text>
            <Text style={styles.hint}>Isso costuma levar cerca de 40 segundos.</Text>
          </>
        )}
        {error && (
          <>
            <Text style={styles.errorTitle}>Não foi possível analisar agora</Text>
            <Text style={styles.error}>{error}</Text>
            <Button label="Tentar de novo" onPress={run} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  status: {
    fontFamily: fontFamily.displaySemiBold,
    fontSize: 19,
    color: colors.text,
    textAlign: 'center',
  },
  hint: {
    fontFamily: fontFamily.body,
    fontSize: 12.5,
    color: colors.textFaint,
    textAlign: 'center',
  },
  errorTitle: {
    fontFamily: fontFamily.displaySemiBold,
    fontSize: 19,
    color: colors.text,
    textAlign: 'center',
  },
  error: {
    fontFamily: fontFamily.body,
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
