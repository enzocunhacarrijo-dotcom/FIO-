import { z } from "zod";

export const photoKindSchema = z.enum(["comprimento", "raiz", "pontas"]);
export type PhotoKind = z.infer<typeof photoKindSchema>;

export const photoRecordSchema = z.object({
  id: z.string(),
  kind: photoKindSchema,
  url: z.string(),
  width: z.number(),
  height: z.number(),
  createdAt: z.string(),
});
export type PhotoRecord = z.infer<typeof photoRecordSchema>;

export const photoUploadLimits = {
  maxLongSidePx: 1568,
  jpegQuality: 0.85,
  minLongSidePx: 640,
  maxFileSizeBytes: 8 * 1024 * 1024,
} as const;
