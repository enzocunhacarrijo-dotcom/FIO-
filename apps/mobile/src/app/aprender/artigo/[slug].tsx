import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenHeader } from '@/components/screen-header';
import { Strand } from '@/components/strand';
import { Text } from '@/components/text';
import { ARTIGOS } from '@/data/artigos';
import { colors, motion, spacing } from '@/theme/tokens';

export default function ArtigoScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const artigo = ARTIGOS.find((item) => item.slug === slug);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.content}>
          <ScreenHeader title="Artigo" onBack={() => router.back()} />

          {!artigo ? (
            <Text variant="body" tone="muted" style={styles.empty}>
              Este artigo não foi encontrado.
            </Text>
          ) : (
            <Animated.View entering={FadeInDown.duration(motion.duration.base)} style={styles.article}>
              <View style={styles.titleBlock}>
                <Strand width={48} stroke={6} color={colors.primaryTint} />
                <Text variant="h1">{artigo.titulo}</Text>
                <Text variant="bodyLg" tone="muted">
                  {artigo.resumo}
                </Text>
              </View>
              <View style={styles.corpo}>
                {artigo.corpo.map((paragrafo, i) => (
                  <Text key={i} variant="bodyLg">
                    {paragrafo}
                  </Text>
                ))}
              </View>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { alignItems: 'center', paddingBottom: spacing.xxxl },
  content: {
    width: '100%',
    maxWidth: 640,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    gap: spacing.xxl,
  },
  article: { gap: spacing.xxl },
  titleBlock: { gap: spacing.md },
  corpo: { gap: spacing.lg },
  empty: { textAlign: 'center', marginTop: spacing.xl },
});
