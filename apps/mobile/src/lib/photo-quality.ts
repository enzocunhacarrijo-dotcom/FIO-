import * as base64js from 'base64-js';
import jpeg from 'jpeg-js';

export type QualityMetrics = {
  brightnessMean: number;
  laplacianVariance: number;
};

// Thresholds tuned on synthetic fixtures (see photo-quality.test.ts) — revisit
// once we have real capture samples from Milestone 3 device testing.
export const MIN_BRIGHTNESS_MEAN = 45;
export const MIN_LAPLACIAN_VARIANCE = 25;

/**
 * Computes brightness and blur (Laplacian variance) from a JPEG image encoded
 * as base64. Meant to run on a small (e.g. ~240px) thumbnail, not the
 * full-resolution capture — keeps the pure-JS JPEG decode fast.
 */
export function analyzeJpegBase64(base64: string): QualityMetrics {
  const bytes = base64js.toByteArray(base64);
  const { width, height, data } = jpeg.decode(bytes, { useTArray: true });

  const pixelCount = width * height;
  const gray = new Float64Array(pixelCount);
  for (let i = 0; i < pixelCount; i++) {
    const offset = i * 4;
    gray[i] = 0.299 * data[offset] + 0.587 * data[offset + 1] + 0.114 * data[offset + 2];
  }

  let brightnessSum = 0;
  for (let i = 0; i < pixelCount; i++) brightnessSum += gray[i];
  const brightnessMean = brightnessSum / pixelCount;

  const laplacian: number[] = [];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const value = gray[idx - width]! + gray[idx + width]! + gray[idx - 1]! + gray[idx + 1]! - 4 * gray[idx]!;
      laplacian.push(value);
    }
  }

  const lapMean = laplacian.reduce((a, b) => a + b, 0) / laplacian.length;
  const laplacianVariance = laplacian.reduce((a, b) => a + (b - lapMean) ** 2, 0) / laplacian.length;

  return { brightnessMean, laplacianVariance };
}
