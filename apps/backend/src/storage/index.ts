import path from "node:path";
import { env } from "../config/env.js";
import { LocalStorageProvider } from "./local-provider.js";
import type { StorageProvider } from "./provider.js";

export const storage: StorageProvider = new LocalStorageProvider(path.resolve(env.STORAGE_DIR));

export * from "./provider.js";
export * from "./signing.js";
