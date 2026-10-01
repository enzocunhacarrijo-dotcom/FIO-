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

export const upgradeGuestRequestSchema = registerRequestSchema;
export type UpgradeGuestRequest = RegisterRequest;

// redirectUri is where the backend sends the browser back to (the app's deep link).
export const googleStartRequestSchema = z.object({
  redirectUri: z.string().max(500).regex(/^(fio|exp|exps):\/\//),
  lgpdConsent: lgpdConsentField,
});
export type GoogleStartRequest = z.infer<typeof googleStartRequestSchema>;

export const googleStartResponseSchema = z.object({ authUrl: z.string().url() });
export type GoogleStartResponse = z.infer<typeof googleStartResponseSchema>;

export const googleExchangeRequestSchema = z.object({ code: z.string().length(64) });
export type GoogleExchangeRequest = z.infer<typeof googleExchangeRequestSchema>;

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
  providers: z.array(z.enum(["password", "google"])).default([]),
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
