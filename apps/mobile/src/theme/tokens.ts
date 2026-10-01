import { Platform, type ViewStyle } from 'react-native';
import { Easing } from 'react-native-reanimated';

export const colors = {
  bg: '#F6F5F0',
  surface: '#FFFFFF',
  surfaceSunken: '#EEEDE6',
  text: '#14211F',
  textMuted: '#4F5F5C',
  textFaint: '#6B7875',
  primary: '#0F6B62',
  primaryStrong: '#0A4F48',
  primaryDeep: '#083F39',
  primaryTint: '#DDEFEB',
  onPrimary: '#FFFFFF',
  onPrimaryMuted: 'rgba(255,255,255,0.72)',
  accent: '#F2A53A',
  accentStrong: '#8A5300',
  accentTint: '#FDEBCB',
  accentGlow: 'rgba(242,165,58,0.28)',
  danger: '#D2563F',
  dangerText: '#B13A26',
  dangerTint: '#FBE4DE',
  success: '#2E8B57',
  successTint: '#DDF1E4',
  overlay: 'rgba(20,33,31,0.55)',
  // aliases antigos (remover quando a frente B terminar)
  border: '#DFE3DC',
  borderStrong: '#C5CCC4',
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

/** Gutter horizontal padrão das telas. */
export const gutter = 20;

export const radii = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32,
  xxl: 40,
  pill: 999,
} as const;

export const fontFamily = {
  displayRegular: 'PlusJakartaSans_600SemiBold',
  displaySemiBold: 'PlusJakartaSans_700Bold',
  displayBold: 'PlusJakartaSans_800ExtraBold',
  body: 'PlusJakartaSans_400Regular',
  bodyMedium: 'PlusJakartaSans_500Medium',
  bodySemiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extraBold: 'PlusJakartaSans_800ExtraBold',
} as const;

const SHADOW_DEFS = {
  sm: { color: '#14211F', opacity: 0.06, radius: 8, y: 2, elevation: 2 },
  md: { color: '#14211F', opacity: 0.08, radius: 20, y: 8, elevation: 6 },
  lg: { color: '#14211F', opacity: 0.12, radius: 32, y: 16, elevation: 12 },
  primary: { color: '#0F6B62', opacity: 0.3, radius: 16, y: 8, elevation: 8 },
} as const;

export type ElevationLevel = keyof typeof SHADOW_DEFS;

export const shadows = SHADOW_DEFS;

function hexToRgba(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/** Sombra multiplataforma: shadow* no iOS, elevation no Android, boxShadow na web. */
export function elevation(level: ElevationLevel): ViewStyle {
  const s = SHADOW_DEFS[level];
  if (Platform.OS === 'web') {
    return { boxShadow: `0px ${s.y}px ${s.radius}px ${hexToRgba(s.color, s.opacity)}` } as ViewStyle;
  }
  if (Platform.OS === 'android') {
    return { elevation: s.elevation, shadowColor: s.color };
  }
  return {
    shadowColor: s.color,
    shadowOpacity: s.opacity,
    shadowRadius: s.radius,
    shadowOffset: { width: 0, height: s.y },
  };
}

export const motion = {
  duration: { fast: 120, base: 220, slow: 420, draw: 900 },
  easing: {
    standard: Easing.bezier(0.2, 0, 0, 1),
    emphasized: Easing.bezier(0.3, 0, 0, 1.2),
  },
  spring: {
    press: { damping: 18, stiffness: 320 },
    pop: { damping: 12, stiffness: 220 },
  },
  pressScale: 0.97,
} as const;
