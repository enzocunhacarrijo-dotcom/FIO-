import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { colors } from '@/theme/tokens';

type LogoMarkProps = {
  size?: number;
  variant?: 'default' | 'mono';
  /** 'rounded' = quadrado arredondado (rx 18); 'circle' = círculo (rx 32). */
  shape?: 'rounded' | 'circle';
};

// Marca "Fio" (Identidade Fio, v2): um fio branco em S suave sobre fundo
// verde-água, com o ponto âmbar logo abaixo da curva de cima. viewBox 64x64.
export function LogoMark({ size = 56, variant = 'default', shape = 'rounded' }: LogoMarkProps) {
  const mono = variant === 'mono';
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityLabel="Fio">
      {!mono && <Rect width={64} height={64} rx={shape === 'circle' ? 32 : 18} fill={colors.primary} />}
      <Path
        d="M18 45.5 C25 46.5 27.5 40 30 33.5 C32.5 27 35.5 19.5 46 19"
        stroke="#FFFFFF"
        strokeWidth={5.5}
        strokeLinecap="round"
        fill="none"
      />
      <Circle cx={44.5} cy={28.5} r={4.5} fill={colors.accent} />
    </Svg>
  );
}

// Wordmark "fio" com os contornos reais da Plus Jakarta Sans ExtraBold (glifos
// convertidos em path, unidades de 1000/em, y para cima). Único ajuste em
// relação à fonte: o pingo do "i" sobe 12 unidades para ter o topo (757) na
// mesma altura do topo do "f". A barra do meio do "f" já tem o topo (546) na
// mesma altura da haste do "i".
const GLYPH_F =
  'M121 0V416H29V546H121V554Q121 619 146.5 664Q172 709 220 733Q268 757 336 757Q349 757 364 755.5Q379 754 389 752V624Q379 626 371.5 626.5Q364 627 356 627Q314 627 292.5 608.5Q271 590 271 554V546H388V416H271V0Z';
const GLYPH_I_STEM = 'M55 0V546H205V0Z';
const GLYPH_I_DOT = 'M55 607V757H205V607Z'; // original: 595..745
const GLYPH_O =
  'M326 -12Q245 -12 178.5 25Q112 62 72.5 126.5Q33 191 33 273Q33 356 72.5 420Q112 484 178.5 521Q245 558 326 558Q407 558 473 521Q539 484 578.5 420Q618 356 618 273Q618 191 578.5 126.5Q539 62 473 25Q407 -12 326 -12ZM326 123Q367 123 397.5 142Q428 161 445.5 195Q463 229 463 273Q463 317 445.5 350.5Q428 384 397.5 403.5Q367 423 326 423Q285 423 254 403.5Q223 384 205.5 350.5Q188 317 188 273Q188 229 205.5 195Q223 161 254 142Q285 123 326 123Z';

// Avanços: f=410, i=260, o=651; letter-spacing -0.05em (= -50 un.) por par.
const TRACKING = -50;
const I_X = 410 + TRACKING;
const O_X = I_X + 260 + TRACKING;
const WORD_W = O_X + 651;
const WORD_H = 769; // -12 (base do "o") .. 757

function Wordmark({ height, color }: { height: number; color: string }) {
  return (
    <Svg
      width={(height * WORD_W) / WORD_H}
      height={height}
      viewBox={`0 -757 ${WORD_W} ${WORD_H}`}
      accessibilityLabel="fio"
    >
      <G transform="scale(1,-1)">
        <Path d={GLYPH_F} fill={color} />
        <G transform={`translate(${I_X} 0)`}>
          <Path d={GLYPH_I_STEM} fill={color} />
          <Path d={GLYPH_I_DOT} fill={color} />
        </G>
        <Path d={GLYPH_O} fill={color} transform={`translate(${O_X} 0)`} />
      </G>
    </Svg>
  );
}

type LogoProps = { size?: number; color?: string; variant?: 'default' | 'mono' };

export function Logo({ size = 52, color, variant = 'default' }: LogoProps) {
  const wordColor = color ?? (variant === 'mono' ? colors.onPrimary : colors.text);
  return (
    <View style={styles.row}>
      <LogoMark size={size} variant={variant} />
      <Wordmark height={size * 0.532} color={wordColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
