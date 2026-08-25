import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ScreenHeader } from '@/components/screen-header';
import { TextField } from '@/components/text-field';
import { GLOSSARIO } from '@/data/glossario';
import { colors, fontFamily, radii, spacing } from '@/theme/tokens';

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
          <Text style={styles.empty}>Nenhum termo encontrado para "{query}".</Text>
        ) : (
          <View style={styles.list}>
            {filtered.map((item) => (
              <View key={item.slug} style={styles.card}>
                <Text style={styles.termo}>{item.termo}</Text>
                <Text style={styles.definicao}>{item.definicao}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xxl, gap: spacing.lg },
  list: { gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: 4,
  },
  termo: { fontFamily: fontFamily.bodySemiBold, fontSize: 14.5, color: colors.text },
  definicao: { fontFamily: fontFamily.body, fontSize: 13, lineHeight: 19, color: colors.textMuted },
  empty: { fontFamily: fontFamily.body, fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
});
