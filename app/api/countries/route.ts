import { getCountries } from "@/src/server/providers";

export async function GET() {
  try {
    const result = await getCountries();
    return Response.json({ countries: result.data, meta: result.meta }, {
      headers: { "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Country data is unavailable." }, { status: 503 });
  }
}

