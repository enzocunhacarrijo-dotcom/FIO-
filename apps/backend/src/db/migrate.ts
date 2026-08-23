import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { env } from "../config/env.js";

const migrationClient = postgres(env.DATABASE_URL, { max: 1 });
const db = drizzle(migrationClient);

await migrate(db, { migrationsFolder: "./src/db/migrations" });
await migrationClient.end();

console.log("Migrations applied.");
