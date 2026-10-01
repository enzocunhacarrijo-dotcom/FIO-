import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ScreenHeader } from '@/components/screen-header';
import { ARTIGOS } from '@/data/artigos';
import { colors, fontFamily, radii, spacing } from '@/theme/tokens';

export default function AprenderScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Aprender" onBack={() => router.back()} />

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/aprender/glossario')}
          style={({ pressed }) => [styles.glossarioCard, pressed && styles.pressed]}
        >
          <View style={styles.glossarioText}>
            <Text style={styles.glossarioTitle}>Glossário</Text>
            <Text style={styles.glossarioSub}>Termos de cuidado capilar explicados em linguagem simples</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        <Text style={styles.sectionLabel}>Artigos</Text>
        <View style={styles.cardStack}>
          {ARTIGOS.map((artigo) => (
            <Pressable
              key={artigo.slug}
              accessibilityRole="button"
              onPress={() => router.push(`/aprender/artigo/${artigo.slug}`)}
              style={({ pressed }) => [styles.artigoCard, pressed && styles.pressed]}
            >
              <Text style={styles.artigoTitulo}>{artigo.titulo}</Text>
              <Text style={styles.artigoResumo}>{artigo.resumo}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xxl, gap: spacing.xl },
  glossarioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primaryTint,
    borderRadius: radii.lg,
    padding: spacing.lg,
    minHeight: 64,
  },
  glossarioText: { flex: 1, gap: 2 },
  glossarioTitle: { fontFamily: fontFamily.bodySemiBold, fontSize: 15, color: colors.primaryStrong },
  glossarioSub: { fontFamily: fontFamily.body, fontSize: 12, color: colors.primaryStrong },
  chevron: { fontSize: 22, color: colors.primaryStrong },
  sectionLabel: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.textFaint,
    marginBottom: -spacing.md,
  },
  cardStack: { gap: spacing.md },
  artigoCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: 4,
  },
  artigoTitulo: { fontFamily: fontFamily.bodySemiBold, fontSize: 14.5, color: colors.text },
  artigoResumo: { fontFamily: fontFamily.body, fontSize: 12.5, lineHeight: 18, color: colors.textMuted },
  pressed: { opacity: 0.85 },
});
