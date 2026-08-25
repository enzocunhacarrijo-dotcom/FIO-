import { z } from "zod";
import { objetivoPrincipalSchema } from "./questionnaire.js";

const lgpdConsentField = z.literal(true, {
  errorMap: () => ({ message: "É preciso aceitar a Política de Privacidade para continuar." }),
});

export const registerRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
  lgpdConsent: lgpdConsentField,
});
export type RegisterRequest = z.infer<typeof registerRequestSchema>;

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const guestRequestSchema = z.object({
  deviceId: z.string().min(8).max(200),
  lgpdConsent: lgpdConsentField,
});
export type GuestRequest = z.infer<typeof guestRequestSchema>;

export const refreshRequestSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshRequest = z.infer<typeof refreshRequestSchema>;

export const currentUserSchema = z.object({
  id: z.string(),
  kind: z.enum(["registered", "guest"]),
  email: z.string().nullable(),
  objetivoPrincipal: objetivoPrincipalSchema.nullable(),
  isPremium: z.boolean(),
});
export type CurrentUser = z.infer<typeof currentUserSchema>;

export const authResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: currentUserSchema,
});
export type AuthResponse = z.infer<typeof authResponseSchema>;

export const setObjetivoRequestSchema = z.object({
  objetivoPrincipal: objetivoPrincipalSchema,
});

export const setPremiumRequestSchema = z.object({
  isPremium: z.boolean(),
});
export type SetPremiumRequest = z.infer<typeof setPremiumRequestSchema>;
