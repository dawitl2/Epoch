import { getLeaders } from "@/src/server/providers";

export async function GET(request: Request) {
  const country = new URL(request.url).searchParams.get("country") ?? "";
  try {
    const result = await getLeaders(country);
    return Response.json(result, {
      headers: { "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Leader data is unavailable." }, { status: 503 });
  }
}

