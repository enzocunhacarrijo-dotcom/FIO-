import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Button } from '@/components/button';
import { Strand } from '@/components/strand';
import { Text } from '@/components/text';
import { requestAnalysis } from '@/api/analysis';
import { ApiError } from '@/api/client';
import { useAuthStore } from '@/store/auth';
import { colors, spacing } from '@/theme/tokens';

const STATUS_MESSAGES = ['Validando fotos…', 'Analisando sua imagem…', 'Montando sua rotina…'];
const STATUS_INTERVAL_MS = 2500;

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
      setStatusIndex((i) => (i + 1) % STATUS_MESSAGES.length);
    }, STATUS_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [running]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        {running && (
          <>
            <Strand key={statusIndex} width={160} stroke={6} color={colors.primary} animated />
            <Animated.View key={statusIndex} entering={FadeIn.duration(220)} exiting={FadeOut.duration(120)}>
              <Text variant="h2" style={styles.center}>
                {STATUS_MESSAGES[statusIndex]}
              </Text>
            </Animated.View>
            <Text variant="bodySm" tone="faint" style={styles.center}>
              Isso costuma levar cerca de 40 segundos.
            </Text>
          </>
        )}
        {error && (
          <>
            <Text variant="h2" style={styles.center}>
              Não foi possível analisar agora
            </Text>
            <Text variant="body" tone="muted" style={styles.center}>
              {error}
            </Text>
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
    gap: spacing.xxl,
  },
  center: { textAlign: 'center' },
});
