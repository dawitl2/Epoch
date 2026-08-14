import { env } from "cloudflare:workers";

type CacheRow = {
  payload: string;
  provider: string;
  updated_at: number;
};

let schemaReady: Promise<void> | null = null;

export function getDatabase() {
  if (!env.DB) throw new Error("Epoch's D1 binding is unavailable.");
  return env.DB;
}

export async function ensureDatabase() {
  if (!schemaReady) {
    const db = getDatabase();
    schemaReady = db.batch([
      db.prepare(`CREATE TABLE IF NOT EXISTS api_cache (
        cache_key TEXT PRIMARY KEY,
        provider TEXT NOT NULL,
        payload TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS quiz_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mode TEXT NOT NULL,
        country_code TEXT,
        score INTEGER NOT NULL,
        total INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      )`),
      db.prepare("CREATE INDEX IF NOT EXISTS idx_quiz_attempts_created_at ON quiz_attempts(created_at)"),
      db.prepare("CREATE INDEX IF NOT EXISTS idx_quiz_attempts_mode ON quiz_attempts(mode)"),
    ]).then(() => undefined);
  }
  return schemaReady;
}

export async function readCache<T>(key: string, maxAgeMs: number) {
  await ensureDatabase();
  const row = await getDatabase()
    .prepare("SELECT payload, provider, updated_at FROM api_cache WHERE cache_key = ?")
    .bind(key)
    .first<CacheRow>();

  if (!row) return null;
  return {
    data: JSON.parse(row.payload) as T,
    provider: row.provider,
    updatedAt: row.updated_at,
    fresh: Date.now() - row.updated_at < maxAgeMs,
  };
}

export async function writeCache<T>(key: string, provider: string, data: T) {
  await ensureDatabase();
  const updatedAt = Date.now();
  await getDatabase()
    .prepare(`INSERT INTO api_cache (cache_key, provider, payload, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(cache_key) DO UPDATE SET
        provider = excluded.provider,
        payload = excluded.payload,
        updated_at = excluded.updated_at`)
    .bind(key, provider, JSON.stringify(data), updatedAt)
    .run();
  return updatedAt;
}

