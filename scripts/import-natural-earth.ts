import AdmZip from "adm-zip";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import * as shapefile from "shapefile";
import type { Feature, FeatureCollection, GeoJsonProperties, Geometry } from "geojson";

const DOWNLOADS = {
  countries: "https://naturalearth.s3.amazonaws.com/10m_cultural/ne_10m_admin_0_countries.zip",
  rivers: "https://naturalearth.s3.amazonaws.com/10m_physical/ne_10m_rivers_lake_centerlines_scale_rank.zip",
  lakes: "https://naturalearth.s3.amazonaws.com/10m_physical/ne_10m_lakes.zip",
  cities: "https://naturalearth.s3.amazonaws.com/10m_cultural/ne_10m_populated_places_simple.zip",
} as const;

type DatasetName = keyof typeof DOWNLOADS;
type ImportedFeature = Feature<Geometry, Record<string, unknown>>;

function cleanText(value: unknown): unknown {
  if (typeof value === "string") return value.replace(/\0/g, "").replace(/[\uFFFD]/g, "").trim();
  if (Array.isArray(value)) return value.map(cleanText);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cleanText(item)]));
  }
  return value;
}

function geometryHash(geometry: Geometry) {
  return createHash("sha256").update(JSON.stringify(geometry)).digest("hex");
}

function dedupe(features: ImportedFeature[]) {
  const hashes = new Set<string>();
  return features.filter((item) => {
    const hash = geometryHash(item.geometry);
    if (hashes.has(hash)) return false;
    hashes.add(hash);
    return true;
  });
}

function text(properties: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = properties[key] ?? properties[key.toLowerCase()];
    if (typeof value === "string" && value && value !== "-99") return value;
  }
  return "";
}

function number(properties: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = Number(properties[key] ?? properties[key.toLowerCase()]);
    if (Number.isFinite(value)) return value;
  }
  return 0;
}

function normalizeProperties(dataset: DatasetName, raw: GeoJsonProperties) {
  const properties = cleanText(raw ?? {}) as Record<string, unknown>;
  if (dataset === "countries") {
    const iso3 = text(properties, "ISO_A3", "ADM0_A3", "SOV_A3", "GU_A3");
    return {
      name: text(properties, "NAME", "ADMIN", "SOVEREIGNT"),
      name_en: text(properties, "NAME_EN", "NAME", "ADMIN"),
      iso2: text(properties, "ISO_A2", "WB_A2"),
      iso3,
      numeric: text(properties, "ISO_N3", "UN_A3").padStart(3, "0"),
      slug: iso3,
      continent: text(properties, "CONTINENT"),
      subregion: text(properties, "SUBREGION", "REGION_UN"),
      formal_name: text(properties, "FORMAL_EN", "ADMIN"),
      label_x: number(properties, "LABEL_X"),
      label_y: number(properties, "LABEL_Y"),
      population: number(properties, "POP_EST"),
      min_zoom: number(properties, "MIN_ZOOM"),
      min_label: number(properties, "MIN_LABEL"),
      scalerank: number(properties, "SCALERANK"),
      featurecla: text(properties, "FEATURECLA"),
    };
  }
  if (dataset === "cities") {
    return {
      name: text(properties, "NAME", "NAMEPAR"),
      name_en: text(properties, "NAME_EN", "NAME", "NAMEPAR"),
      min_zoom: number(properties, "MIN_ZOOM"),
      min_label: number(properties, "MIN_LABEL"),
      scalerank: number(properties, "SCALERANK"),
      featurecla: text(properties, "FEATURECLA"),
      population: number(properties, "POP_MAX", "POP_MIN"),
      rank: number(properties, "RANK_MAX", "RANK_MIN"),
      capital: Boolean(number(properties, "ADM0CAP", "CAPIN")),
      country_code: text(properties, "ADM0_A3", "SOV_A3", "ISO_A2"),
    };
  }
  return {
    name: text(properties, "NAME", "NAME_EN", "NAME_ALT"),
    name_en: text(properties, "NAME_EN", "NAME", "NAME_ALT"),
    min_zoom: number(properties, "MIN_ZOOM"),
    min_label: number(properties, "MIN_LABEL"),
    scalerank: number(properties, "SCALERANK"),
    featurecla: text(properties, "FEATURECLA"),
  };
}

async function download(url: string, destination: string) {
  const response = await fetch(url, { signal: AbortSignal.timeout(120_000) });
  if (!response.ok) throw new Error(`Natural Earth download failed (${response.status}): ${url}`);
  await writeFile(destination, Buffer.from(await response.arrayBuffer()));
}

async function readDataset(name: DatasetName, url: string, root: string): Promise<FeatureCollection> {
  const archivePath = join(root, basename(url));
  await download(url, archivePath);
  const extractPath = join(root, name);
  await mkdir(extractPath, { recursive: true });
  new AdmZip(archivePath).extractAllTo(extractPath, true);
  const stem = basename(url, ".zip");
  const source = await shapefile.read(join(extractPath, `${stem}.shp`), join(extractPath, `${stem}.dbf`), { encoding: "utf-8" });
  const features = dedupe((source.features as ImportedFeature[])
    .filter((item) => item?.geometry)
    .map((item, index) => {
      const properties = normalizeProperties(name, item.properties);
      const id = name === "countries" ? String(properties.slug || `country-${index}`) : `${name}-${index}`;
      return { ...item, id, properties };
    }));
  return { type: "FeatureCollection", features };
}

async function main() {
  const tempRoot = await mkdtemp(join(tmpdir(), "epoch-natural-earth-"));
  const outputPath = resolve("data/natural-earth-10m.json");
  try {
    const entries = await Promise.all(Object.entries(DOWNLOADS).map(async ([name, url]) => {
      const collection = await readDataset(name as DatasetName, url, tempRoot);
      console.log(`${name}: ${collection.features.length} features`);
      return [name, collection] as const;
    }));
    const datasets = Object.fromEntries(entries) as Record<DatasetName, FeatureCollection>;
    const payload = {
      ...datasets,
      provenance: {
        provider: "Natural Earth",
        scale: "1:10m",
        retrievedAt: new Date().toISOString(),
        downloads: Object.values(DOWNLOADS),
      },
    };
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, JSON.stringify(payload));
    const size = (await readFile(outputPath)).byteLength / 1024 / 1024;
    console.log(`Wrote ${outputPath} (${size.toFixed(1)} MB)`);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
