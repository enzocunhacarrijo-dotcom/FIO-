import { healthCheckResponseSchema, type HealthCheckResponse } from '@hair-analysis/shared';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

type CheckState =
  | { status: 'loading' }
  | { status: 'success'; data: HealthCheckResponse }
  | { status: 'error'; message: string };

function useBackendHealthCheck() {
  const [state, setState] = useState<CheckState>({ status: 'loading' });

  const run = useCallback(async () => {
    setState({ status: 'loading' });
    const apiUrl = process.env.EXPO_PUBLIC_API_URL;

    if (!apiUrl) {
      setState({
        status: 'error',
        message: 'EXPO_PUBLIC_API_URL não está definido. Configure apps/mobile/.env.',
      });
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/health`);
      const json = await response.json();

      if (!response.ok) {
        setState({ status: 'error', message: `Backend respondeu ${response.status}` });
        return;
      }

      const data = healthCheckResponseSchema.parse(json);
      setState({ status: 'success', data });
    } catch (error) {
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Falha desconhecida ao conectar.',
      });
    }
  }, []);

  useEffect(() => {
    run();
  }, [run]);

  return { state, retry: run };
}

export default function HomeScreen() {
  const { state, retry } = useBackendHealthCheck();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          Fundação
        </ThemedText>
        <ThemedText type="small">Conexão app → backend → banco de dados</ThemedText>

        <ThemedView type="backgroundElement" style={styles.statusCard}>
          {state.status === 'loading' && (
            <>
              <ActivityIndicator />
              <ThemedText type="small">Verificando backend…</ThemedText>
            </>
          )}
          {state.status === 'success' && (
            <>
              <ThemedText type="smallBold">✓ Backend e banco de dados respondendo</ThemedText>
              <ThemedText type="code">{JSON.stringify(state.data, null, 2)}</ThemedText>
            </>
          )}
          {state.status === 'error' && (
            <>
              <ThemedText type="smallBold">Não foi possível conectar ao backend</ThemedText>
              <ThemedText type="small">{state.message}</ThemedText>
              <ThemedText type="link" onPress={retry}>
                Tentar novamente
              </ThemedText>
            </>
          )}
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
  },
  title: {
    textAlign: 'center',
  },
  statusCard: {
    gap: Spacing.three,
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
    alignItems: 'center',
  },
});
