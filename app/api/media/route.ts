const ALLOWED_HOSTS = ["wikimedia.org", "wikipedia.org", "flagcdn.com"];

function hostAllowed(hostname: string) {
  return ALLOWED_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`));
}

export async function GET(request: Request) {
  const rawUrl = new URL(request.url).searchParams.get("url");
  if (!rawUrl) return Response.json({ error: "A media URL is required." }, { status: 400 });

  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "https:" || !hostAllowed(url.hostname)) {
      return Response.json({ error: "This media host is not allowed." }, { status: 400 });
    }

    const response = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": "Epoch/1.0 (global history learning application)" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok || !response.body) return Response.json({ error: "Media could not be loaded." }, { status: 502 });

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) return Response.json({ error: "The requested resource is not an image." }, { status: 415 });

    return new Response(response.body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable",
      },
    });
  } catch {
    return Response.json({ error: "Media could not be loaded." }, { status: 502 });
  }
}
