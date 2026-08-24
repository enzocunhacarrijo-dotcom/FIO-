import * as ImageManipulator from 'expo-image-manipulator';
import { photoUploadLimits } from '@hair-analysis/shared';
import { analyzeJpegBase64, MIN_BRIGHTNESS_MEAN, MIN_LAPLACIAN_VARIANCE } from './photo-quality';

export type CaptureValidation =
  | { ok: true; width: number; height: number }
  | { ok: false; reason: 'resolucao_baixa' | 'imagem_escura' | 'imagem_borrada'; message: string };

const ANALYSIS_THUMBNAIL_WIDTH = 240;

export async function validateCaptureUri(uri: string): Promise<CaptureValidation> {
  const original = await ImageManipulator.manipulateAsync(uri, []);
  const longSide = Math.max(original.width, original.height);

  if (longSide < photoUploadLimits.minLongSidePx) {
    return {
      ok: false,
      reason: 'resolucao_baixa',
      message: 'A foto ficou com resolução baixa. Tente se aproximar um pouco mais.',
    };
  }

  const thumb = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: ANALYSIS_THUMBNAIL_WIDTH } }], {
    compress: 0.7,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });

  if (thumb.base64) {
    const { brightnessMean, laplacianVariance } = analyzeJpegBase64(thumb.base64);

    if (brightnessMean < MIN_BRIGHTNESS_MEAN) {
      return {
        ok: false,
        reason: 'imagem_escura',
        message: 'A foto ficou escura demais. Tente em um local com mais luz.',
      };
    }
    if (laplacianVariance < MIN_LAPLACIAN_VARIANCE) {
      return {
        ok: false,
        reason: 'imagem_borrada',
        message: 'A foto ficou tremida — apoie o celular ou peça ajuda.',
      };
    }
  }

  return { ok: true, width: original.width, height: original.height };
}
