import { getGeographyHealth } from "@/src/server/geography";

export const runtime = "nodejs";

export async function GET() {
  try {
    return Response.json(await getGeographyHealth(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({
      status: "unavailable",
      geographyLoaded: false,
      error: error instanceof Error ? error.message : "Geography health check failed.",
    }, { status: 503 });
  }
}
