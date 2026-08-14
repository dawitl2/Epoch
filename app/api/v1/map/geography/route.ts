import { getMapGeography } from "@/src/server/geography";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await getMapGeography(), {
      headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
    });
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : "Imported geography is unavailable.",
    }, { status: 503 });
  }
}
