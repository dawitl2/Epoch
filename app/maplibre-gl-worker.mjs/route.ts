import { maplibreAsset } from "@/src/server/maplibreAsset";

export const runtime = "nodejs";

export function GET() {
  return maplibreAsset("maplibre-gl-worker.mjs");
}
