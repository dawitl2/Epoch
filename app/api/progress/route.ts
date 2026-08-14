import type { ProgressResponse, QuizMode } from "@/src/lib/contracts";
import { ensureDatabase, getDatabase } from "@/src/server/db";

type AggregateRow = { rounds: number; questions: number; correct: number; best_score: number };
type ModeRow = { mode: QuizMode; rounds: number; correct: number; questions: number };
type RecentRow = { mode: QuizMode; country_code: string | null; score: number; total: number; created_at: number };

export async function GET() {
  try {
    await ensureDatabase();
    const db = getDatabase();
    const aggregate = await db.prepare(`SELECT COUNT(*) AS rounds, COALESCE(SUM(total), 0) AS questions,
      COALESCE(SUM(score), 0) AS correct, COALESCE(MAX(score), 0) AS best_score FROM quiz_attempts`).first<AggregateRow>();
    const modes = await db.prepare(`SELECT mode, COUNT(*) AS rounds, SUM(score) AS correct, SUM(total) AS questions
      FROM quiz_attempts GROUP BY mode ORDER BY rounds DESC`).all<ModeRow>();
    const recent = await db.prepare(`SELECT mode, country_code, score, total, created_at FROM quiz_attempts
      ORDER BY created_at DESC LIMIT 8`).all<RecentRow>();
    const rounds = aggregate?.rounds ?? 0;
    const questions = aggregate?.questions ?? 0;
    const correct = aggregate?.correct ?? 0;
    const response: ProgressResponse = {
      rounds,
      questions,
      correct,
      accuracy: questions ? Math.round((correct / questions) * 100) : 0,
      bestScore: aggregate?.best_score ?? 0,
      modes: (modes.results ?? []).map((row) => ({ mode: row.mode, rounds: row.rounds, accuracy: row.questions ? Math.round((row.correct / row.questions) * 100) : 0 })),
      recent: (recent.results ?? []).map((row) => ({ mode: row.mode, countryCode: row.country_code, score: row.score, total: row.total, createdAt: row.created_at })),
    };
    return Response.json(response, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Progress is unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { mode?: string; countryCode?: string; score?: number; total?: number };
    const modes = ["flags", "countries", "capitals", "leaders", "states"];
    const score = Number(body.score);
    const total = Number(body.total);
    if (!body.mode || !modes.includes(body.mode) || !Number.isInteger(score) || !Number.isInteger(total) || total < 1 || score < 0 || score > total) {
      return Response.json({ error: "Invalid quiz result." }, { status: 400 });
    }
    await ensureDatabase();
    await getDatabase().prepare(`INSERT INTO quiz_attempts (mode, country_code, score, total, created_at)
      VALUES (?, ?, ?, ?, ?)`).bind(body.mode, body.countryCode || null, score, total, Date.now()).run();
    return Response.json({ saved: true }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Progress could not be saved." }, { status: 503 });
  }
}

