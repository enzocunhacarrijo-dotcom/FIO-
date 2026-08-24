import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { StorageProvider } from "./provider.js";

export class LocalStorageProvider implements StorageProvider {
  constructor(private readonly baseDir: string) {}

  private resolve(key: string): string {
    if (key.includes("..") || key.includes("/") || key.includes("\\")) {
      throw new Error(`Invalid storage key: ${key}`);
    }
    return path.join(this.baseDir, key);
  }

  async save(key: string, data: Buffer): Promise<void> {
    await mkdir(this.baseDir, { recursive: true });
    await writeFile(this.resolve(key), data);
  }

  async read(key: string): Promise<Buffer | null> {
    try {
      return await readFile(this.resolve(key));
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") return null;
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    await rm(this.resolve(key), { force: true });
  }
}
