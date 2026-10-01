import { useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Defs, Line, Mask, Path, Rect } from 'react-native-svg';
import type { CaptureStep } from '@/data/capture-steps';
import { fontFamily } from '@/theme/tokens';

const STROKE = 'rgba(255,255,255,0.9)';
const DIM = 'rgba(0,0,0,0.55)';

type Geometry =
  | { kind: 'bust'; cx: number; headCy: number; headR: number; shoulderPath: string; captionY: number }
  | { kind: 'circle'; cx: number; cy: number; r: number; captionY: number }
  | { kind: 'strand'; cx: number; cy: number; w: number; h: number; captionY: number };

function computeGeometry(shape: CaptureStep['guideShape'], width: number, height: number): Geometry {
  const cx = width / 2;

  if (shape === 'portrait') {
    // A person seen from behind: rounded head, narrow neck, shoulders that
    // curve outward before dropping straight down — reads as a real silhouette
    // instead of the plain trapezoid a bust outline would give.
    const headR = width * 0.17;
    const headCy = height * 0.28;
    const neckHalfWidth = headR * 0.6;
    const neckY = headCy + headR * 0.92;
    const shoulderHalfWidth = width * 0.4;
    const shoulderCurveY = neckY + headR * 0.5;
    const shoulderBottomY = height * 0.78;
    const shoulderPath = `
      M ${cx - neckHalfWidth} ${neckY}
      C ${cx - neckHalfWidth} ${neckY + headR * 0.55}, ${cx - shoulderHalfWidth * 0.65} ${shoulderCurveY}, ${cx - shoulderHalfWidth} ${shoulderCurveY + headR * 0.5}
      L ${cx - shoulderHalfWidth} ${shoulderBottomY}
      L ${cx + shoulderHalfWidth} ${shoulderBottomY}
      L ${cx + shoulderHalfWidth} ${shoulderCurveY + headR * 0.5}
      C ${cx + shoulderHalfWidth * 0.65} ${shoulderCurveY}, ${cx + neckHalfWidth} ${neckY + headR * 0.55}, ${cx + neckHalfWidth} ${neckY}
      Z
    `;
    return { kind: 'bust', cx, headCy, headR, shoulderPath, captionY: shoulderBottomY + 28 };
  }

  if (shape === 'circle') {
    const r = width * 0.34;
    const cy = height * 0.42;
    return { kind: 'circle', cx, cy, r, captionY: cy + r + 28 };
  }

  const w = width * 0.28;
  const h = w * 2.4;
  const cy = height * 0.42;
  return { kind: 'strand', cx, cy, w, h, captionY: cy + h / 2 + 28 };
}

/** Guia visual de enquadramento sobre a preview da câmera: escurece tudo fora
 * do recorte (máscara SVG) e dá uma legenda curta ligada ao que deve ficar
 * dentro dele — em vez de um contorno solto sem nenhum significado. */
export function CaptureGuide({ shape, caption }: { shape: CaptureStep['guideShape']; caption: string }) {
  const { width, height } = useWindowDimensions();
  const geometry = useMemo(() => computeGeometry(shape, width, height), [shape, width, height]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={width} height={height}>
        <Defs>
          <Mask id="guide-cutout">
            <Rect x={0} y={0} width={width} height={height} fill="#FFFFFF" />
            {geometry.kind === 'bust' && (
              <>
                <Circle cx={geometry.cx} cy={geometry.headCy} r={geometry.headR} fill="#000000" />
                <Path d={geometry.shoulderPath} fill="#000000" />
              </>
            )}
            {geometry.kind === 'circle' && <Circle cx={geometry.cx} cy={geometry.cy} r={geometry.r} fill="#000000" />}
            {geometry.kind === 'strand' && (
              <Rect
                x={geometry.cx - geometry.w / 2}
                y={geometry.cy - geometry.h / 2}
                width={geometry.w}
                height={geometry.h}
                rx={geometry.w / 2}
                fill="#000000"
              />
            )}
          </Mask>
        </Defs>

        <Rect x={0} y={0} width={width} height={height} fill={DIM} mask="url(#guide-cutout)" />

        {geometry.kind === 'bust' && (
          <Circle cx={geometry.cx} cy={geometry.headCy} r={geometry.headR} stroke={STROKE} strokeWidth={2} fill="none" />
        )}
        {geometry.kind === 'circle' && (
          <>
            <Circle cx={geometry.cx} cy={geometry.cy} r={geometry.r} stroke={STROKE} strokeWidth={2} fill="none" />
            <Line
              x1={geometry.cx}
              y1={geometry.cy - geometry.r * 0.75}
              x2={geometry.cx}
              y2={geometry.cy + geometry.r * 0.75}
              stroke={STROKE}
              strokeWidth={2}
              strokeDasharray="6,6"
            />
          </>
        )}
        {geometry.kind === 'strand' && (
          <Rect
            x={geometry.cx - geometry.w / 2}
            y={geometry.cy - geometry.h / 2}
            width={geometry.w}
            height={geometry.h}
            rx={geometry.w / 2}
            stroke={STROKE}
            strokeWidth={2}
            fill="none"
          />
        )}
      </Svg>

      <Text style={[styles.caption, { top: geometry.captionY }]}>{caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  caption: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: fontFamily.bodyMedium,
    fontSize: 12.5,
    color: '#FFFFFF',
  },
});
