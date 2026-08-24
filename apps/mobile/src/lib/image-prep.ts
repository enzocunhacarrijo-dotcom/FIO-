import * as ImageManipulator from 'expo-image-manipulator';
import { photoUploadLimits } from '@hair-analysis/shared';

export type PreparedPhoto = { uri: string; width: number; height: number };

export async function prepareForUpload(uri: string): Promise<PreparedPhoto> {
  const probe = await ImageManipulator.manipulateAsync(uri, []);
  const longSide = Math.max(probe.width, probe.height);

  const actions =
    longSide > photoUploadLimits.maxLongSidePx
      ? probe.width >= probe.height
        ? [{ resize: { width: photoUploadLimits.maxLongSidePx } }]
        : [{ resize: { height: photoUploadLimits.maxLongSidePx } }]
      : [];

  const result = await ImageManipulator.manipulateAsync(uri, actions, {
    compress: photoUploadLimits.jpegQuality,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  return { uri: result.uri, width: result.width, height: result.height };
}
