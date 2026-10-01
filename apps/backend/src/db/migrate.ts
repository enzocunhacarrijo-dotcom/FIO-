import "dotenv/config";
import { fileURLToPath } from "node:url";
import path from "node:path";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { env } from "../config/env.js";

// Resolved relative to this file (not CWD) so it works the same whether run
// via `tsx src/db/migrate.ts` locally or as compiled `dist/db/migrate.js` in
// production, where the migrations folder is copied next to dist.
const migrationsFolder = path.join(path.dirname(fileURLToPath(import.meta.url)), "migrations");

export async function runMigrations(): Promise<void> {
  const migrationClient = postgres(env.DATABASE_URL, { max: 1 });
  const db = drizzle(migrationClient);
  await migrate(db, { migrationsFolder });
  await migrationClient.end();
}

// Run directly when invoked as a script (`npm run db:migrate`), but not when
// imported by the server at startup.
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
if (isMainModule) {
  await runMigrations();
  console.log("Migrations applied.");
}
