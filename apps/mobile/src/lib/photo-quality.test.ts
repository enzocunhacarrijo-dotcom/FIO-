import { describe, expect, it } from 'vitest';
import jpeg from 'jpeg-js';
import * as base64js from 'base64-js';
import { analyzeJpegBase64, MIN_BRIGHTNESS_MEAN, MIN_LAPLACIAN_VARIANCE } from './photo-quality';

const SIZE = 120;

function encodeFixture(pixel: (x: number, y: number) => number): string {
  const data = new Uint8Array(SIZE * SIZE * 4);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const v = pixel(x, y);
      const i = (y * SIZE + x) * 4;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 255;
    }
  }
  const { data: jpegBytes } = jpeg.encode({ data, width: SIZE, height: SIZE }, 90);
  return base64js.fromByteArray(jpegBytes);
}

const sharpCheckerboard = encodeFixture((x, y) => (Math.floor(x / 6) + Math.floor(y / 6)) % 2 === 0 ? 40 : 220);
const flatMidGray = encodeFixture(() => 130);
const flatDark = encodeFixture(() => 12);
const flatButBright = encodeFixture(() => 200);

describe('analyzeJpegBase64', () => {
  it('gives a sharp checkerboard a much higher Laplacian variance than a flat image', () => {
    const sharp = analyzeJpegBase64(sharpCheckerboard);
    const flat = analyzeJpegBase64(flatMidGray);

    expect(sharp.laplacianVariance).toBeGreaterThan(flat.laplacianVariance * 20);
    expect(flat.laplacianVariance).toBeLessThan(1);
  });

  it('classifies the sharp checkerboard as not blurry and the flat image as blurry, at the chosen threshold', () => {
    const sharp = analyzeJpegBase64(sharpCheckerboard);
    const flat = analyzeJpegBase64(flatMidGray);

    expect(sharp.laplacianVariance).toBeGreaterThanOrEqual(MIN_LAPLACIAN_VARIANCE);
    expect(flat.laplacianVariance).toBeLessThan(MIN_LAPLACIAN_VARIANCE);
  });

  it('flags a dark image as below the brightness threshold and a bright one as above it', () => {
    const dark = analyzeJpegBase64(flatDark);
    const bright = analyzeJpegBase64(flatButBright);

    expect(dark.brightnessMean).toBeLessThan(MIN_BRIGHTNESS_MEAN);
    expect(bright.brightnessMean).toBeGreaterThanOrEqual(MIN_BRIGHTNESS_MEAN);
  });

  it('reports brightness close to the fixture value for a flat mid-gray image', () => {
    const { brightnessMean } = analyzeJpegBase64(flatMidGray);
    expect(brightnessMean).toBeGreaterThan(120);
    expect(brightnessMean).toBeLessThan(140);
  });
});
