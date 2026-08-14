import type { ProgressResponse, QuizMode } from "@/src/lib/contracts";
import { readQuizAttempts, writeQuizAttempt } from "@/src/server/db";

const MODES: QuizMode[] = ["flags", "countries", "capitals", "leaders", "states"];

export async function GET() {
  try {
    const attempts = await readQuizAttempts();
    const questions = attempts.reduce((sum, item) => sum + item.total, 0);
    const correct = attempts.reduce((sum, item) => sum + item.score, 0);
    const response: ProgressResponse = {
      rounds: attempts.length,
      questions,
      correct,
      accuracy: questions ? Math.round((correct / questions) * 100) : 0,
      bestScore: Math.max(0, ...attempts.map((item) => item.score)),
      modes: MODES.flatMap((mode) => {
        const matches = attempts.filter((item) => item.mode === mode);
        if (!matches.length) return [];
        const total = matches.reduce((sum, item) => sum + item.total, 0);
        const score = matches.reduce((sum, item) => sum + item.score, 0);
        return [{ mode, rounds: matches.length, accuracy: total ? Math.round((score / total) * 100) : 0 }];
      }),
      recent: attempts.slice(-8).reverse(),
    };
    return Response.json(response, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Progress is unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { mode?: QuizMode; countryCode?: string; score?: number; total?: number };
    const score = Number(body.score);
    const total = Number(body.total);
    if (!body.mode || !MODES.includes(body.mode) || !Number.isInteger(score) || !Number.isInteger(total) || total < 1 || score < 0 || score > total) {
      return Response.json({ error: "Invalid quiz result." }, { status: 400 });
    }
    await writeQuizAttempt({
      mode: body.mode,
      countryCode: body.countryCode || null,
      score,
      total,
      createdAt: Date.now(),
    });
    return Response.json({ saved: true }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Progress could not be saved." }, { status: 503 });
  }
}
