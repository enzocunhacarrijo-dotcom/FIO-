import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Card } from '@/components/card';
import { Icon, type IconName } from '@/components/icon';
import { ListRow } from '@/components/list-row';
import { ScreenHeader } from '@/components/screen-header';
import { SectionHeader } from '@/components/section-header';
import { Text } from '@/components/text';
import { ARTIGOS } from '@/data/artigos';
import { colors, motion, radii, spacing } from '@/theme/tokens';

const ARTICLE_STYLES: { band: string; fg: string; icon: IconName }[] = [
  { band: colors.primaryTint, fg: colors.primaryStrong, icon: 'leaf' },
  { band: colors.accentTint, fg: colors.accentStrong, icon: 'sparkle' },
  { band: colors.successTint, fg: colors.success, icon: 'drop' },
];

export default function AprenderScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Aprender" onBack={() => router.back()} />

        <Animated.View entering={FadeInDown.duration(motion.duration.base)}>
          <Card variant="tint" padding={spacing.sm}>
            <ListRow
              icon="info"
              title="Glossário"
              subtitle="Termos de cuidado capilar explicados em linguagem simples"
              onPress={() => router.push('/aprender/glossario')}
            />
          </Card>
        </Animated.View>

        <View style={styles.section}>
          <SectionHeader title="Artigos" />
          <View style={styles.cardStack}>
            {ARTIGOS.map((artigo, i) => {
              const style = ARTICLE_STYLES[i % ARTICLE_STYLES.length];
              return (
                <Animated.View key={artigo.slug} entering={FadeInDown.duration(motion.duration.base).delay((i + 1) * 40)}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push(`/aprender/artigo/${artigo.slug}`)}
                    style={({ pressed }) => pressed && styles.pressed}
                  >
                    <Card padding={0} style={styles.artigoCard}>
                      <View style={[styles.band, { backgroundColor: style.band }]}>
                        <Icon name={style.icon} size={24} color={style.fg} />
                      </View>
                      <View style={styles.artigoBody}>
                        <Text variant="h3">{artigo.titulo}</Text>
                        <Text variant="bodySm" tone="muted">
                          {artigo.resumo}
                        </Text>
                      </View>
                    </Card>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xxxl, gap: spacing.xxl },
  section: { gap: spacing.lg },
  cardStack: { gap: spacing.md },
  artigoCard: { overflow: 'hidden' },
  band: {
    height: 56,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
  },
  artigoBody: { padding: spacing.xl, gap: spacing.xs },
  pressed: { opacity: 0.85 },
});
