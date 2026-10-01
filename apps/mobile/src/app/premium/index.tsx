import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Disclaimer } from '@/components/disclaimer';
import { Icon } from '@/components/icon';
import { ListRow } from '@/components/list-row';
import { ScreenHeader } from '@/components/screen-header';
import { SectionHeader } from '@/components/section-header';
import { Strand } from '@/components/strand';
import { Text } from '@/components/text';
import { useAuthStore } from '@/store/auth';
import { colors, elevation, motion, radii, spacing } from '@/theme/tokens';

const BENEFITS = [
  'Análises e leituras de produto sem limite diário',
  'Comparador de progresso com histórico completo',
  'Acesso antecipado a novos artigos do Aprender',
];

const enter = (i: number) => FadeInDown.duration(motion.duration.base).delay(i * 40);

export default function PremiumScreen() {
  const user = useAuthStore((s) => s.user);
  const setPremium = useAuthStore((s) => s.setPremium);
  const [busy, setBusy] = useState(false);

  const isPremium = user?.isPremium ?? false;

  async function handleToggle() {
    setBusy(true);
    await setPremium(!isPremium);
    setBusy(false);
  }

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.strandDeco} pointerEvents="none">
            <Strand width={220} stroke={10} color={colors.accent} />
          </View>
          <SafeAreaView edges={['top']}>
            <View style={styles.heroInner}>
              <ScreenHeader title="Premium" onBack={() => router.back()} variant="onPrimary" />
              <Animated.View entering={enter(0)} style={styles.plan}>
                <Text variant="eyebrow" tone="onPrimary" style={styles.dim}>
                  Seu plano
                </Text>
                <Text variant="display" tone="onPrimary">
                  {isPremium ? 'Premium' : 'Gratuito'}
                </Text>
                {!isPremium && (
                  <Text variant="body" tone="onPrimary" style={styles.dim}>
                    Hoje: 3 análises e 5 leituras de produto por dia.
                  </Text>
                )}
              </Animated.View>
            </View>
          </SafeAreaView>
        </View>

        <View style={styles.content}>
          <Animated.View entering={enter(1)} style={styles.section}>
            <SectionHeader title="O que o Premium desbloqueia" />
            <Card padding={spacing.sm}>
              {BENEFITS.map((benefit) => (
                <ListRow key={benefit} icon="check" title={benefit} hideChevron />
              ))}
            </Card>
          </Animated.View>

          <Animated.View entering={enter(2)} style={styles.section}>
            {isPremium ? (
              <Button label="Cancelar Premium" variant="secondary" onPress={handleToggle} loading={busy} />
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={handleToggle}
                disabled={busy}
                style={({ pressed }) => [styles.cta, elevation('md'), pressed && styles.ctaPressed]}
              >
                {busy ? (
                  <ActivityIndicator color={colors.text} />
                ) : (
                  <>
                    <Text variant="h3" style={styles.ctaLabel}>
                      Ativar Premium
                    </Text>
                    <Icon name="arrow.right" size={20} color={colors.text} />
                  </>
                )}
              </Pressable>
            )}
            <Disclaimer>
              Protótipo de validação — este botão só alterna a flag internamente, sem cobrança real. Usamos essa tela
              para entender se as pessoas pagariam por isso.
            </Disclaimer>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: spacing.xxxl },
  hero: {
    backgroundColor: colors.primaryDeep,
    borderBottomLeftRadius: radii.xxl,
    borderBottomRightRadius: radii.xxl,
    overflow: 'hidden',
  },
  strandDeco: { position: 'absolute', right: -30, top: 70, opacity: 0.9 },
  heroInner: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xxxl, gap: spacing.xxl },
  plan: { gap: spacing.sm },
  dim: { opacity: 0.72 },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, gap: spacing.xxl },
  section: { gap: spacing.lg },
  cta: {
    minHeight: 56,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xxl,
  },
  ctaPressed: { opacity: 0.88 },
  ctaLabel: { color: colors.text },
});
