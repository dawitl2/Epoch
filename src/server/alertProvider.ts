import type { ApiMeta, GeographyAlert } from "@/src/lib/contracts";
import { readCache, writeCache } from "@/src/server/db";

const USGS_DAILY_FEED = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson";
const CACHE_KEY = "usgs:earthquakes:2.5:day:v1";
const CACHE_AGE_MS = 5 * 60 * 1000;

type UsgsFeature = {
  id?: string;
  geometry?: { coordinates?: [number, number, number] };
  properties?: {
    title?: string;
    place?: string;
    mag?: number;
    sig?: number;
    time?: number;
    url?: string;
    type?: string;
  };
};

type UsgsResponse = { features?: UsgsFeature[] };

function normalizeAlert(item: UsgsFeature): GeographyAlert | null {
  const coordinates = item.geometry?.coordinates;
  const magnitude = item.properties?.mag;
  if (!item.id || !coordinates || typeof magnitude !== "number") return null;
  const place = item.properties?.place || "Unspecified location";
  const depthKm = Math.round((coordinates[2] ?? 0) * 10) / 10;
  return {
    id: item.id,
    title: item.properties?.title || `M ${magnitude.toFixed(1)} earthquake`,
    place,
    magnitude,
    significance: item.properties?.sig ?? 0,
    longitude: coordinates[0],
    latitude: coordinates[1],
    depthKm,
    occurredAt: item.properties?.time ?? Date.now(),
    detail: `A magnitude ${magnitude.toFixed(1)} earthquake was recorded ${depthKm} km below the surface near ${place}.`,
    sourceUrl: item.properties?.url || "https://earthquake.usgs.gov/earthquakes/",
  };
}

export async function getGeographyAlerts(): Promise<{ alerts: GeographyAlert[]; meta: ApiMeta }> {
  const cached = await readCache<GeographyAlert[]>(CACHE_KEY, CACHE_AGE_MS);
  if (cached?.fresh) {
    return { alerts: cached.data, meta: { provider: cached.provider, cached: true, updatedAt: cached.updatedAt } };
  }

  try {
    const response = await fetch(USGS_DAILY_FEED, {
      headers: { Accept: "application/geo+json", "User-Agent": "Epoch/1.0 (geography learning application)" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`USGS alert request failed with ${response.status}.`);
    const body = await response.json() as UsgsResponse;
    const alerts = (body.features ?? [])
      .map(normalizeAlert)
      .filter((item): item is GeographyAlert => item !== null)
      .sort((a, b) => b.significance - a.significance)
      .slice(0, 100);
    const updatedAt = await writeCache(CACHE_KEY, "USGS Earthquake Hazards Program", alerts);
    return { alerts, meta: { provider: "USGS Earthquake Hazards Program", cached: false, updatedAt } };
  } catch (error) {
    if (cached) {
      return { alerts: cached.data, meta: { provider: cached.provider, cached: true, updatedAt: cached.updatedAt } };
    }
    throw error;
  }
}
