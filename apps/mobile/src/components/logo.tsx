import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors, fontFamily } from '@/theme/tokens';

type LogoMarkProps = { size?: number };

// Marca "Fio": um fio de cabelo em curva (S) sobre fundo verde-água, com um
// ponto âmbar de brilho na ponta. Mesma geometria usada nos ícones do app.
export function LogoMark({ size = 56 }: LogoMarkProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityLabel="Fio">
      <Rect width={64} height={64} rx={18} fill={colors.primary} />
      <Path
        d="M23 50 C23 36 41 38 41 26 C41 20 38 17 34 15"
        stroke="#FFFFFF"
        strokeWidth={5.5}
        strokeLinecap="round"
        fill="none"
      />
      <Circle cx={43} cy={14} r={4.5} fill={colors.accent} />
    </Svg>
  );
}

type LogoProps = { size?: number; color?: string };

export function Logo({ size = 44, color = colors.text }: LogoProps) {
  return (
    <View style={styles.row}>
      <LogoMark size={size} />
      <Text style={[styles.word, { fontSize: size * 0.82, color }]}>fio</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  word: { fontFamily: fontFamily.displayBold, letterSpacing: -1 },
});
