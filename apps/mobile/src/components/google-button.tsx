import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Text } from '@/components/text';
import { colors, elevation, radii, spacing } from '@/theme/tokens';

type GoogleButtonProps = {
  label?: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  /** Destaca o botão (ex.: conta existente só com Google). */
  highlight?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function GoogleLogo({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <Path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"
      />
      <Path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <Path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </Svg>
  );
}

export function GoogleButton({
  label = 'Continuar com Google',
  onPress,
  loading,
  disabled,
  highlight,
  style,
}: GoogleButtonProps) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        elevation('sm'),
        highlight && styles.highlight,
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <View style={styles.row}>
          <GoogleLogo />
          <Text variant="label" style={styles.label}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

/** Divisor "ou" entre o login social e o formulário. */
export function OrDivider() {
  return (
    <View style={styles.divider} accessibilityElementsHidden>
      <View style={styles.line} />
      <Text variant="caption" tone="faint">
        ou
      </Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  highlight: { borderColor: colors.primary, backgroundColor: colors.primaryTint },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  label: { fontSize: 16, lineHeight: 20 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  line: { flex: 1, height: 1, backgroundColor: colors.borderStrong, opacity: 0.6 },
});
