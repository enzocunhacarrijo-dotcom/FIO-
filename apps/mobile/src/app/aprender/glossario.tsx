import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Card } from '@/components/card';
import { ScreenHeader } from '@/components/screen-header';
import { Text } from '@/components/text';
import { TextField } from '@/components/text-field';
import { GLOSSARIO } from '@/data/glossario';
import { colors, motion, spacing } from '@/theme/tokens';

export default function GlossarioScreen() {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GLOSSARIO;
    return GLOSSARIO.filter(
      (item) => item.termo.toLowerCase().includes(q) || item.definicao.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ScreenHeader title="Glossário" onBack={() => router.back()} />

        <TextField
          placeholder="Buscar um termo…"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {filtered.length === 0 ? (
          <Text variant="body" tone="muted" style={styles.empty}>
            Nenhum termo encontrado para "{query}".
          </Text>
        ) : (
          <View style={styles.list}>
            {filtered.map((item, i) => (
              <Animated.View
                key={item.slug}
                entering={FadeInDown.duration(motion.duration.base).delay(Math.min(i, 8) * 40)}
              >
                <Card padding={spacing.lg}>
                  <Text variant="h3">{item.termo}</Text>
                  <Text variant="body" tone="muted" style={styles.definicao}>
                    {item.definicao}
                  </Text>
                </Card>
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xxxl, gap: spacing.xxl },
  list: { gap: spacing.md },
  definicao: { marginTop: spacing.xs },
  empty: { textAlign: 'center', marginTop: spacing.xl },
});
