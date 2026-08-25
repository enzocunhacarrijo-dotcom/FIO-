import { z } from "zod";
import { analysisResultSchema } from "./analysis.js";
import { currentUserSchema } from "./auth.js";
import { habitEntrySchema } from "./habits.js";
import { photoRecordSchema } from "./photos.js";
import { questionnaireResponseSchema } from "./questionnaire.js";
import { scanResultSchema } from "./scanner.js";

export const userDataExportSchema = z.object({
  exportadoEm: z.string(),
  perfil: currentUserSchema,
  questionario: questionnaireResponseSchema.nullable(),
  fotos: z.array(photoRecordSchema),
  analises: z.array(analysisResultSchema),
  leiturasDeProduto: z.array(scanResultSchema),
  registrosDeHabito: z.array(habitEntrySchema),
});
export type UserDataExport = z.infer<typeof userDataExportSchema>;
