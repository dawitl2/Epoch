import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { FeatureCollection } from "geojson";

const path = resolve("data/natural-earth-10m.json");
const body = JSON.parse(await readFile(path, "utf-8")) as Record<string, unknown>;

for (const key of ["countries", "rivers", "lakes", "cities"]) {
  const collection = body[key] as FeatureCollection | undefined;
  if (collection?.type !== "FeatureCollection" || !Array.isArray(collection.features) || collection.features.length === 0) {
    throw new Error(`${key} is not a non-empty GeoJSON FeatureCollection.`);
  }
  console.log(`${key}: ${collection.features.length}`);
}

const provenance = body.provenance as { provider?: string; downloads?: string[] } | undefined;
if (provenance?.provider !== "Natural Earth" || !provenance.downloads?.length) throw new Error("Natural Earth provenance is missing.");
console.log(`provider: ${provenance.provider}`);
