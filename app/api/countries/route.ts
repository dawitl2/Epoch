import { getNaturalEarthCountries } from "@/src/server/geography";

export async function GET() {
  try {
    const countries = await getNaturalEarthCountries();
    return Response.json({ countries, meta: { provider: "Natural Earth 1:10m", cached: true, updatedAt: Date.now() } }, {
      headers: { "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Country data is unavailable." }, { status: 503 });
  }
}
