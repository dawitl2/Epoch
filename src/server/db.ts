import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { QuizMode } from "@/src/lib/contracts";

type CacheRow = { payload: unknown; provider: string; updatedAt: number };
export type QuizAttempt = { mode: QuizMode; countryCode: string | null; score: number; total: number; createdAt: number };
type RuntimeStore = { cache: Record<string, CacheRow>; attempts: QuizAttempt[] };

const storePath = join(process.cwd(), "data", "runtime-store.json");
let storePromise: Promise<RuntimeStore> | null = null;
let writeQueue = Promise.resolve();

async function loadStore(): Promise<RuntimeStore> {
  try {
    const parsed = JSON.parse(await readFile(storePath, "utf-8")) as Partial<RuntimeStore>;
    return { cache: parsed.cache ?? {}, attempts: parsed.attempts ?? [] };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return { cache: {}, attempts: [] };
  }
}

function getStore() {
  storePromise ??= loadStore();
  return storePromise;
}

async function persist(store: RuntimeStore) {
  writeQueue = writeQueue.then(async () => {
    await mkdir(dirname(storePath), { recursive: true });
    const temporary = `${storePath}.${process.pid}.tmp`;
    await writeFile(temporary, JSON.stringify(store));
    await rename(temporary, storePath);
  });
  await writeQueue;
}

export async function readCache<T>(key: string, maxAgeMs: number) {
  const row = (await getStore()).cache[key];
  if (!row) return null;
  return {
    data: row.payload as T,
    provider: row.provider,
    updatedAt: row.updatedAt,
    fresh: Date.now() - row.updatedAt < maxAgeMs,
  };
}

export async function writeCache<T>(key: string, provider: string, data: T) {
  const store = await getStore();
  const updatedAt = Date.now();
  store.cache[key] = { provider, payload: data, updatedAt };
  await persist(store);
  return updatedAt;
}

export async function readQuizAttempts() {
  return [...(await getStore()).attempts];
}

export async function writeQuizAttempt(attempt: QuizAttempt) {
  const store = await getStore();
  store.attempts.push(attempt);
  store.attempts = store.attempts.slice(-500);
  await persist(store);
}
