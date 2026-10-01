import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { colors } from '@/theme/tokens';
import { text, type TypeVariant } from '@/theme/typography';

export type TextTone = 'default' | 'muted' | 'faint' | 'primary' | 'onPrimary' | 'danger';

const TONE: Record<TextTone, string> = {
  default: colors.text,
  muted: colors.textMuted,
  faint: colors.textFaint,
  primary: colors.primaryStrong,
  onPrimary: colors.onPrimary,
  danger: colors.dangerText,
};

export type TextProps = RNTextProps & {
  variant?: TypeVariant;
  tone?: TextTone;
};

export function Text({ variant = 'body', tone = 'default', style, ...rest }: TextProps) {
  return <RNText {...rest} style={[text(variant), { color: TONE[tone] }, style]} />;
}
