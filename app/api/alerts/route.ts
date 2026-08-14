import { NextResponse } from "next/server";
import { getGeographyAlerts } from "@/src/server/alertProvider";

export async function GET() {
  try {
    const result = await getGeographyAlerts();
    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=240" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Live geography alerts are unavailable." },
      { status: 503 },
    );
  }
}
