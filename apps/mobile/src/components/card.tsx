import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { colors, elevation, radii, spacing } from '@/theme/tokens';
import { Icon } from '@/components/icon';

export type CardVariant = 'elevated' | 'sunken' | 'tint' | 'warn' | 'danger';

export type CardProps = ViewProps & {
  variant?: CardVariant;
  /** Padding interno; padrão 20 (spacing.xl). */
  padding?: number;
  /** Raio 32 em vez de 24 (card principal). */
  large?: boolean;
  style?: StyleProp<ViewStyle>;
};

const BG: Record<CardVariant, string> = {
  elevated: colors.surface,
  sunken: colors.surfaceSunken,
  tint: colors.primaryTint,
  warn: colors.accentTint,
  danger: colors.dangerTint,
};

export function Card({ variant = 'elevated', padding = spacing.xl, large, style, children, ...rest }: CardProps) {
  const icon = variant === 'warn' ? 'warning' : variant === 'danger' ? 'warning' : null;
  const iconColor = variant === 'warn' ? colors.accentStrong : colors.dangerText;
  return (
    <View
      {...rest}
      style={[
        styles.base,
        { backgroundColor: BG[variant], padding, borderRadius: large ? radii.xl : radii.lg },
        variant === 'elevated' && elevation('sm'),
        icon && styles.withIcon,
        style,
      ]}
    >
      {icon && <Icon name={icon} size={20} color={iconColor} style={styles.icon} />}
      {icon ? <View style={styles.content}>{children}</View> : children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {},
  withIcon: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  icon: { marginTop: 1 },
  content: { flex: 1, gap: spacing.xs },
});
