import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { FeatureCollection, Geometry } from "geojson";
import type { CountryRecord, MapGeography } from "@/src/lib/contracts";

let geographyPromise: Promise<MapGeography> | null = null;

function isCollection(value: unknown): value is FeatureCollection<Geometry> {
  return Boolean(value && typeof value === "object" && (value as FeatureCollection).type === "FeatureCollection" && Array.isArray((value as FeatureCollection).features));
}

export function getMapGeography() {
  geographyPromise ??= readFile(join(process.cwd(), "data", "natural-earth-10m.json"), "utf-8")
    .then((text) => JSON.parse(text) as MapGeography)
    .then((body) => {
      for (const key of ["countries", "rivers", "lakes", "cities"] as const) {
        if (!isCollection(body[key])) throw new Error(`Natural Earth ${key} data is not a GeoJSON FeatureCollection.`);
      }
      if (!body.provenance?.downloads?.length) throw new Error("Natural Earth provenance is missing.");
      return body;
    })
    .catch((error) => {
      geographyPromise = null;
      const detail = error instanceof Error ? error.message : "Unknown geography error.";
      throw new Error(`Natural Earth geography is unavailable. Run npm run geography:import. ${detail}`);
    });
  return geographyPromise;
}

export async function getNaturalEarthCountries(): Promise<CountryRecord[]> {
  const geography = await getMapGeography();
  const capitals = new Map<string, string>();
  for (const feature of geography.cities.features) {
    const properties = feature.properties as Record<string, unknown> | null;
    if (!properties?.capital) continue;
    const code = String(properties.country_code ?? "");
    if (code && !capitals.has(code)) capitals.set(code, String(properties.name_en || properties.name || ""));
  }

  return geography.countries.features.flatMap((feature): CountryRecord[] => {
    const properties = feature.properties as Record<string, unknown> | null;
    if (!properties) return [];
    const iso3 = String(properties.iso3 ?? "");
    const iso2 = String(properties.iso2 ?? "");
    const name = String(properties.name_en || properties.name || "");
    if (!/^[A-Z]{3}$/.test(iso3) || !name || name === "Antarctica") return [];
    const continent = String(properties.continent ?? "");
    const subregion = String(properties.subregion ?? "");
    const formal = String(properties.formal_name || name);
    const labelX = Number(properties.label_x);
    const labelY = Number(properties.label_y);
    return [{
      id: `natural-earth-${iso3}`,
      name,
      description: `${formal} is in ${subregion || continent || "the world"}.`,
      iso2,
      iso3,
      numeric: String(properties.numeric ?? "").padStart(3, "0"),
      capital: capitals.get(iso3) ?? null,
      continent,
      flagUrl: /^[A-Z]{2}$/.test(iso2) ? `https://flagcdn.com/w320/${iso2.toLowerCase()}.png` : null,
      center: Number.isFinite(labelX) && Number.isFinite(labelY) ? [labelX, labelY] : null,
    }];
  }).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getGeographyHealth() {
  const geography = await getMapGeography();
  return {
    status: "ok",
    geographyLoaded: true,
    provider: geography.provenance.provider,
    counts: {
      countries: geography.countries.features.length,
      rivers: geography.rivers.features.length,
      lakes: geography.lakes.features.length,
      cities: geography.cities.features.length,
    },
  };
}
