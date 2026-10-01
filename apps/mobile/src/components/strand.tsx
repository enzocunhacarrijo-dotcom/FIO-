import { useEffect } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedProps, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { colors, motion } from '@/theme/tokens';

// Mesma curva em S do logo (viewBox 64x64, de baixo para a ponta).
const D = 'M23 50 C23 36 41 38 41 26 C41 20 38 17 34 15';
const LENGTH = 62;

const AnimatedPath = Animated.createAnimatedComponent(Path);

export type StrandProps = {
  /** Largura em px (altura proporcional ao viewBox 26x38 da curva). Padrão 48. */
  width?: number;
  /** Espessura do traço em px. Padrão 2. */
  stroke?: number;
  color?: string;
  /** Desenha o traço em `motion.duration.draw` (900ms). */
  animated?: boolean;
  /** Repete o desenho indefinidamente (telas de "analisando"). */
  loop?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Strand({ width = 48, stroke = 2, color = colors.primary, animated = false, loop = false, style }: StrandProps) {
  const progress = useSharedValue(animated ? 0 : 1);

  useEffect(() => {
    if (!animated) {
      progress.value = 1;
      return;
    }
    progress.value = 0;
    const draw = withTiming(1, { duration: motion.duration.draw, easing: Easing.out(Easing.cubic) });
    progress.value = loop ? withRepeat(draw, -1, false) : draw;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animated, loop]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: LENGTH * (1 - progress.value),
  }));

  // viewBox recorta a curva (x 18..46, y 10..52) + folga do traço.
  const pad = stroke / 2 + 1;
  const vbX = 18 - pad;
  const vbY = 10 - pad;
  const vbW = 28 + pad * 2;
  const vbH = 42 + pad * 2;
  const height = (width * vbH) / vbW;
  const scale = width / vbW;

  return (
    <Svg width={width} height={height} viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`} style={style} accessibilityElementsHidden>
      <AnimatedPath
        d={D}
        stroke={color}
        strokeWidth={stroke / scale}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={LENGTH}
        animatedProps={animatedProps}
      />
    </Svg>
  );
}
