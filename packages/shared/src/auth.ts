import { z } from "zod";
import { objetivoPrincipalSchema } from "./questionnaire.js";

export const registerRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
});
export type RegisterRequest = z.infer<typeof registerRequestSchema>;

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const guestRequestSchema = z.object({
  deviceId: z.string().min(8).max(200),
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
