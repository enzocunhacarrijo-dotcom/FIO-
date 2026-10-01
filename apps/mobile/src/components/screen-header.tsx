import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '@/components/icon';
import { Text } from '@/components/text';
import { colors, elevation, radii, spacing } from '@/theme/tokens';

type ScreenHeaderProps = {
  title: string;
  onBack?: () => void;
  eyebrow?: string;
  /** 'onPrimary' para heros coloridos (texto branco, botão translúcido). */
  variant?: 'default' | 'onPrimary';
};

export function ScreenHeader({ title, onBack, eyebrow, variant = 'default' }: ScreenHeaderProps) {
  const onPrimary = variant === 'onPrimary';
  return (
    <View style={styles.wrap}>
      {onBack && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          onPress={onBack}
          hitSlop={4}
          style={[styles.backBtn, onPrimary ? styles.backOnPrimary : [styles.backDefault, elevation('sm')]]}
        >
          <Icon name="chevron.left" size={20} color={onPrimary ? colors.onPrimary : colors.text} />
        </Pressable>
      )}
      <View style={styles.titleCol}>
        {eyebrow && (
          <Text variant="eyebrow" tone={onPrimary ? 'onPrimary' : 'faint'} style={onPrimary && styles.muted}>
            {eyebrow}
          </Text>
        )}
        <Text variant="h2" tone={onPrimary ? 'onPrimary' : 'default'} style={styles.title} accessibilityRole="header">
          {title}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  backDefault: { backgroundColor: colors.surface },
  backOnPrimary: { backgroundColor: 'rgba(255,255,255,0.16)' },
  titleCol: { gap: spacing.xxs },
  title: { fontSize: 26, lineHeight: 32, letterSpacing: -0.6 },
  muted: { color: colors.onPrimaryMuted },
});
