import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenHeader } from '@/components/screen-header';
import { ARTIGOS } from '@/data/artigos';
import { colors, fontFamily, spacing } from '@/theme/tokens';

export default function ArtigoScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const artigo = ARTIGOS.find((item) => item.slug === slug);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Artigo" onBack={() => router.back()} />

        {!artigo ? (
          <Text style={styles.empty}>Este artigo não foi encontrado.</Text>
        ) : (
          <>
            <Text style={styles.titulo}>{artigo.titulo}</Text>
            <Text style={styles.resumo}>{artigo.resumo}</Text>
            <View style={styles.corpo}>
              {artigo.corpo.map((paragrafo, i) => (
                <Text key={i} style={styles.paragrafo}>
                  {paragrafo}
                </Text>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xxl, gap: spacing.lg },
  titulo: { fontFamily: fontFamily.displaySemiBold, fontSize: 24, lineHeight: 30, color: colors.text },
  resumo: { fontFamily: fontFamily.body, fontSize: 14, lineHeight: 21, color: colors.textMuted },
  corpo: { gap: spacing.md },
  paragrafo: { fontFamily: fontFamily.body, fontSize: 14.5, lineHeight: 23, color: colors.text },
  empty: { fontFamily: fontFamily.body, fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
});
