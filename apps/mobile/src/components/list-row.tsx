import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, type IconName } from '@/components/icon';
import { Text } from '@/components/text';
import { colors, radii, spacing } from '@/theme/tokens';

export type ListRowProps = {
  icon: IconName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  /** 'danger' pinta ícone/título de vermelho (ex.: Excluir dados). */
  tone?: 'default' | 'danger';
  /** Esconde o chevron (linhas informativas). */
  hideChevron?: boolean;
};

export function ListRow({ icon, title, subtitle, onPress, tone = 'default', hideChevron }: ListRowProps) {
  const danger = tone === 'danger';
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.iconCircle, danger && styles.iconCircleDanger]}>
        <Icon name={icon} size={20} color={danger ? colors.dangerText : colors.primary} />
      </View>
      <View style={styles.textCol}>
        <Text variant="label" tone={danger ? 'danger' : 'default'} style={styles.title}>
          {title}
        </Text>
        {subtitle && (
          <Text variant="bodySm" tone="muted" numberOfLines={2}>
            {subtitle}
          </Text>
        )}
      </View>
      {onPress && !hideChevron && <Icon name="chevron.right" size={20} color={colors.textFaint} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  pressed: { opacity: 0.7 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleDanger: { backgroundColor: colors.dangerTint },
  textCol: { flex: 1, gap: 1 },
  title: { fontSize: 15, lineHeight: 20 },
});
