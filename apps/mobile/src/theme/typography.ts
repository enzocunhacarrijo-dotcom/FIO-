import type { TextStyle } from 'react-native';
import { fontFamily } from './tokens';

type Weight = '400' | '500' | '600' | '700' | '800';

const FAMILY: Record<Weight, string> = {
  '400': fontFamily.body,
  '500': fontFamily.bodyMedium,
  '600': fontFamily.bodySemiBold,
  '700': fontFamily.bold,
  '800': fontFamily.extraBold,
};

type TypeDef = { f: Weight; s: number; lh: number; ls?: number; upper?: boolean; tabular?: boolean };

export const type = {
  display: { f: '800', s: 40, lh: 44, ls: -1.2 },
  h1: { f: '800', s: 30, lh: 36, ls: -0.8 },
  h2: { f: '700', s: 22, lh: 28, ls: -0.4 },
  h3: { f: '700', s: 18, lh: 24, ls: -0.2 },
  bodyLg: { f: '500', s: 17, lh: 26 },
  body: { f: '400', s: 15, lh: 22 },
  bodySm: { f: '400', s: 13, lh: 19 },
  label: { f: '600', s: 14, lh: 18 },
  eyebrow: { f: '700', s: 12, lh: 16, ls: 1.2, upper: true },
  caption: { f: '500', s: 12, lh: 16 },
  numeric: { f: '800', s: 64, lh: 64, ls: -2, tabular: true },
} as const satisfies Record<string, TypeDef>;

export type TypeVariant = keyof typeof type;

/** Estilo pronto de uma variante tipográfica: `text('h2')`. */
export function text(variant: TypeVariant): TextStyle {
  const t: TypeDef = type[variant];
  return {
    fontFamily: FAMILY[t.f],
    fontSize: t.s,
    lineHeight: t.lh,
    ...(t.ls !== undefined && { letterSpacing: t.ls }),
    ...(t.upper && { textTransform: 'uppercase' as const }),
    ...(t.tabular && { fontVariant: ['tabular-nums'] as TextStyle['fontVariant'] }),
  };
}
