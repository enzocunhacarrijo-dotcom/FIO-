import { sql } from "drizzle-orm";
import {
  check,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const userKindEnum = pgEnum("user_kind", ["registered", "guest"]);
export const objetivoPrincipalEnum = pgEnum("objetivo_principal", [
  "qualidade_do_fio",
  "densidade_e_queda",
  "ambos",
]);
export const photoKindEnum = pgEnum("photo_kind", ["comprimento", "raiz", "pontas"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: userKindEnum("kind").notNull(),
    email: text("email").unique(),
    passwordHash: text("password_hash"),
    deviceId: text("device_id").unique(),
    objetivoPrincipal: objetivoPrincipalEnum("objetivo_principal"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      "registered_has_credentials",
      sql`${table.kind} <> 'registered' OR (${table.email} IS NOT NULL AND ${table.passwordHash} IS NOT NULL)`,
    ),
    check("guest_has_device_id", sql`${table.kind} <> 'guest' OR ${table.deviceId} IS NOT NULL`),
  ],
);

export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("refresh_tokens_user_id_idx").on(table.userId)],
);

export const questionnaireResponses = pgTable(
  "questionnaire_responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    respostas: jsonb("respostas").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("questionnaire_responses_user_id_idx").on(table.userId)],
);

export const photos = pgTable(
  "photos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: photoKindEnum("kind").notNull(),
    storageKey: text("storage_key").notNull(),
    contentType: text("content_type").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("photos_user_id_kind_idx").on(table.userId, table.kind)],
);

export const analyses = pgTable(
  "analyses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    photoSetHash: text("photo_set_hash").notNull(),
    promptVersion: integer("prompt_version").notNull(),
    model: text("model").notNull(),
    result: jsonb("result").notNull(),
    inputTokens: integer("input_tokens").notNull(),
    outputTokens: integer("output_tokens").notNull(),
    costUsd: doublePrecision("cost_usd").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("analyses_user_id_idx").on(table.userId),
    index("analyses_user_photo_hash_idx").on(table.userId, table.photoSetHash),
  ],
);

export const routineCheckins = pgTable(
  "routine_checkins",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Local calendar date as YYYY-MM-DD (not a timestamp) — a streak is
    // defined in the user's day-to-day sense, not by exact time of check-in.
    date: text("date").notNull(),
    completedActions: jsonb("completed_actions").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("routine_checkins_user_date_unique").on(table.userId, table.date),
    index("routine_checkins_user_id_idx").on(table.userId),
  ],
);

export const productScans = pgTable(
  "product_scans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    result: jsonb("result").notNull(),
    model: text("model").notNull(),
    inputTokens: integer("input_tokens").notNull(),
    outputTokens: integer("output_tokens").notNull(),
    costUsd: doublePrecision("cost_usd").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("product_scans_user_id_idx").on(table.userId)],
);
