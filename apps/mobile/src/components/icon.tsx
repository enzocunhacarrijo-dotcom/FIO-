import { Platform, type StyleProp, type TextStyle } from 'react-native';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { colors } from '@/theme/tokens';

export type IconName =
  | 'chevron.left'
  | 'chevron.right'
  | 'check'
  | 'camera'
  | 'sparkle'
  | 'drop'
  | 'leaf'
  | 'chart'
  | 'flame'
  | 'info'
  | 'warning'
  | 'user'
  | 'lock'
  | 'barcode'
  | 'arrow.right'
  | 'close';

export type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
};

const SF: Record<IconName, SymbolViewProps['name']> = {
  'chevron.left': 'chevron.left',
  'chevron.right': 'chevron.right',
  check: 'checkmark',
  camera: 'camera',
  sparkle: 'sparkles',
  drop: 'drop',
  leaf: 'leaf',
  chart: 'chart.line.uptrend.xyaxis',
  flame: 'flame.fill',
  info: 'info.circle',
  warning: 'exclamationmark.triangle',
  user: 'person',
  lock: 'lock',
  barcode: 'barcode',
  'arrow.right': 'arrow.right',
  close: 'xmark',
} as Record<IconName, SymbolViewProps['name']>;

function Glyph({ name, color }: { name: IconName; color: string }) {
  const p = { stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } as const;
  switch (name) {
    case 'chevron.left':
      return <Path d="M15 5 L8 12 L15 19" {...p} />;
    case 'chevron.right':
      return <Path d="M9 5 L16 12 L9 19" {...p} />;
    case 'check':
      return <Path d="M5 12.5 L10 17.5 L19 7" {...p} />;
    case 'arrow.right':
      return <Path d="M5 12 H19 M13 6 L19 12 L13 18" {...p} />;
    case 'close':
      return <Path d="M6 6 L18 18 M18 6 L6 18" {...p} />;
    case 'camera':
      return (
        <>
          <Path d="M4 8 H7.5 L9 5.5 H15 L16.5 8 H20 V18.5 H4 Z" {...p} />
          <Circle cx={12} cy={13} r={3.5} {...p} />
        </>
      );
    case 'sparkle':
      return (
        <>
          <Path d="M10 4 C10.8 9 11.5 9.7 16 10.5 C11.5 11.3 10.8 12 10 17 C9.2 12 8.5 11.3 4 10.5 C8.5 9.7 9.2 9 10 4 Z" {...p} />
          <Path d="M18 15 V20 M15.5 17.5 H20.5" {...p} />
        </>
      );
    case 'drop':
      return <Path d="M12 3.5 C12 3.5 5.5 11 5.5 15 A6.5 6.5 0 0 0 18.5 15 C18.5 11 12 3.5 12 3.5 Z" {...p} />;
    case 'leaf':
      return (
        <>
          <Path d="M5 19 C5 9 11 5 20 4.5 C20 13 16 19 5 19 Z" {...p} />
          <Path d="M5 19 L13 11" {...p} />
        </>
      );
    case 'chart':
      return <Path d="M4 19 H20 M5 15 L10 10 L13.5 13 L19 6.5" {...p} />;
    case 'flame':
      return <Path d="M12 3.5 C13 8 18 9.5 18 15 A6 6 0 0 1 6 15 C6 12 8 11 8.5 8.5 C10 9.5 10.5 10.5 10.5 10.5 C11.5 8.5 11.5 6 12 3.5 Z" {...p} />;
    case 'info':
      return (
        <>
          <Circle cx={12} cy={12} r={8.5} {...p} />
          <Line x1={12} y1={11} x2={12} y2={16.5} {...p} />
          <Line x1={12} y1={7.8} x2={12.01} y2={7.8} {...p} />
        </>
      );
    case 'warning':
      return (
        <>
          <Path d="M12 4 L21 19.5 H3 Z" {...p} />
          <Line x1={12} y1={10} x2={12} y2={14.5} {...p} />
          <Line x1={12} y1={17} x2={12.01} y2={17} {...p} />
        </>
      );
    case 'user':
      return (
        <>
          <Circle cx={12} cy={8} r={4} {...p} />
          <Path d="M4.5 20 C4.5 15.5 8 14 12 14 C16 14 19.5 15.5 19.5 20" {...p} />
        </>
      );
    case 'lock':
      return (
        <>
          <Rect x={5} y={10.5} width={14} height={9.5} rx={2.5} {...p} />
          <Path d="M8 10.5 V8 A4 4 0 0 1 16 8 V10.5" {...p} />
        </>
      );
    case 'barcode':
      return <Path d="M4 6 V18 M7.5 6 V18 M11 6 V18 M14 6 V18 M17 6 V18 M20 6 V18" {...p} />;
  }
}

/** Ícone de traço 2px com pontas arredondadas: SF Symbols no iOS, SVG próprio no resto. */
export function Icon({ name, size = 24, color = colors.text, style }: IconProps) {
  if (Platform.OS === 'ios') {
    return (
      <SymbolView
        name={SF[name]}
        size={size}
        tintColor={color}
        weight="semibold"
        resizeMode="scaleAspectFit"
        style={[{ width: size, height: size }, style as never]}
      />
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style as never}>
      <Glyph name={name} color={color} />
    </Svg>
  );
}
