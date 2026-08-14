import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function maplibreAsset(name: "maplibre-gl-worker.mjs" | "maplibre-gl-shared.mjs") {
  const body = await readFile(join(process.cwd(), "node_modules", "maplibre-gl", "dist", name));
  return new Response(body, {
    headers: {
      "Content-Type": "text/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
