import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import type { ObjetivoPrincipal } from '@hair-analysis/shared';
import { Button } from '@/components/button';
import { OptionCard } from '@/components/option-card';
import { useAuthStore } from '@/store/auth';
import { colors, fontFamily, spacing } from '@/theme/tokens';

const OPTIONS: { value: ObjetivoPrincipal; label: string; description: string }[] = [
  { value: 'qualidade_do_fio', label: 'Qualidade do fio', description: 'Frizz, ressecamento, quebra, definição de cacho, química.' },
  { value: 'densidade_e_queda', label: 'Densidade e queda', description: 'Afinamento, entradas, queda percebida, saúde do couro.' },
  { value: 'ambos', label: 'Ambos', description: 'Quero acompanhar os dois.' },
];

export default function ObjetivoScreen() {
  const setObjetivo = useAuthStore((s) => s.setObjetivo);
  const busy = useAuthStore((s) => s.busy);
  const error = useAuthStore((s) => s.error);
  const [selected, setSelected] = useState<ObjetivoPrincipal | null>(null);

  async function handleContinue() {
    if (!selected) return;
    const ok = await setObjetivo(selected);
    if (ok) router.replace('/onboarding/questionario');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Qual é o seu objetivo principal?</Text>
          <Text style={styles.subtitle}>Isso ajusta o conteúdo que você vê. Dá pra mudar depois, a qualquer momento.</Text>
        </View>

        <View style={styles.options}>
          {OPTIONS.map((opt) => (
            <OptionCard
              key={opt.value}
              label={opt.label}
              description={opt.description}
              mode="single"
              selected={selected === opt.value}
              onPress={() => setSelected(opt.value)}
            />
          ))}
        </View>

        <View style={styles.footer}>
          {error && <Text style={styles.error}>{error}</Text>}
          <Button label="Continuar" onPress={handleContinue} disabled={!selected} loading={busy} />
          <Text style={styles.disclaimer}>
            Gênero é opcional e nunca muda a interface — só ajuda a calibrar padrões de queda.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    justifyContent: 'space-between',
  },
  header: {
    gap: spacing.sm,
  },
  title: {
    fontFamily: fontFamily.displaySemiBold,
    fontSize: 26,
    lineHeight: 32,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fontFamily.body,
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.textMuted,
  },
  options: {
    gap: spacing.md,
  },
  footer: {
    gap: spacing.md,
  },
  error: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    color: colors.clayText,
  },
  disclaimer: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    lineHeight: 16,
    color: colors.textFaint,
    textAlign: 'center',
  },
});
