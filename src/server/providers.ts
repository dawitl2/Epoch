import type { ApiMeta, CountryRecord, LeaderRecord } from "@/src/lib/contracts";
import { readCache, writeCache } from "@/src/server/db";

const WIKIDATA_ENDPOINT = "https://query.wikidata.org/sparql";
const WIKIPEDIA_SUMMARY = "https://en.wikipedia.org/api/rest_v1/page/summary/";
const API_HEADERS = {
  Accept: "application/sparql-results+json",
  "User-Agent": "Epoch/1.0 (global history learning application)",
};

type Binding = { value: string } | undefined;
type SparqlRow = Record<string, Binding>;
type SparqlResponse = { results?: { bindings?: SparqlRow[] } };

type ProviderResult<T> = { data: T; meta: ApiMeta };

const COUNTRY_QUERY = `
SELECT DISTINCT ?country ?countryLabel ?countryDescription ?iso2 ?iso3 ?numeric ?capitalLabel ?flag ?coord ?continentLabel WHERE {
  ?country wdt:P297 ?iso2;
           wdt:P298 ?iso3;
           wdt:P31/wdt:P279* wd:Q6256.
  OPTIONAL { ?country wdt:P299 ?numeric. }
  OPTIONAL { ?country wdt:P36 ?capital. }
  OPTIONAL { ?country wdt:P41 ?flag. }
  OPTIONAL { ?country wdt:P625 ?coord. }
  OPTIONAL { ?country wdt:P30 ?continent. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT 280`;

const GLOBAL_LEADER_COUNTRIES = ["USA", "GBR", "FRA", "DEU", "IND", "CHN", "JPN", "BRA", "ZAF", "EGY", "MEX", "ETH"];

function value(row: SparqlRow, key: string) {
  return row[key]?.value ?? "";
}

function entityId(url: string) {
  return url.split("/").pop() ?? url;
}

function yearFromDate(date: string) {
  if (!date) return null;
  const match = date.match(/^(-?\d{1,6})-/);
  return match ? Number(match[1]) : null;
}

function secureUrl(url: string) {
  return url ? url.replace(/^http:\/\//, "https://") : "";
}

function parsePoint(point: string): [number, number] | null {
  const match = point.match(/Point\((-?[\d.]+) (-?[\d.]+)\)/);
  return match ? [Number(match[1]), Number(match[2])] : null;
}

function articleTitle(url: string) {
  if (!url) return null;
  const slug = url.split("/wiki/")[1];
  return slug ? decodeURIComponent(slug) : null;
}

async function queryWikidata(query: string) {
  const url = `${WIKIDATA_ENDPOINT}?format=json&query=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: API_HEADERS,
    signal: AbortSignal.timeout(45_000),
  });
  if (!response.ok) throw new Error(`Wikidata request failed with ${response.status}.`);
  const body = await response.json() as SparqlResponse;
  return body.results?.bindings ?? [];
}

function normalizeCountries(rows: SparqlRow[]) {
  const records = new Map<string, CountryRecord>();
  for (const row of rows) {
    const iso3 = value(row, "iso3");
    const numeric = value(row, "numeric").padStart(3, "0");
    if (!iso3 || !numeric || records.has(iso3)) continue;
    records.set(iso3, {
      id: entityId(value(row, "country")),
      name: value(row, "countryLabel"),
      description: value(row, "countryDescription"),
      iso2: value(row, "iso2"),
      iso3,
      numeric,
      capital: value(row, "capitalLabel") || null,
      continent: value(row, "continentLabel") || "",
      flagUrl: secureUrl(value(row, "flag")) || null,
      center: parsePoint(value(row, "coord")),
    });
  }
  return [...records.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export async function getCountries(): Promise<ProviderResult<CountryRecord[]>> {
  const key = "wikidata:countries:v3";
  const cached = await readCache<CountryRecord[]>(key, 7 * 24 * 60 * 60 * 1000);
  if (cached?.fresh) {
    return { data: cached.data, meta: { provider: cached.provider, cached: true, updatedAt: cached.updatedAt } };
  }

  try {
    const rows = await queryWikidata(COUNTRY_QUERY);
    const countries = normalizeCountries(rows);
    if (countries.length < 150) throw new Error("Wikidata returned an incomplete country set.");
    const updatedAt = await writeCache(key, "Wikidata Query Service", countries);
    return { data: countries, meta: { provider: "Wikidata Query Service", cached: false, updatedAt } };
  } catch (error) {
    if (cached) return { data: cached.data, meta: { provider: cached.provider, cached: true, updatedAt: cached.updatedAt } };
    throw error;
  }
}

function leaderQuery(countryCodes: string[]) {
  const values = countryCodes.map((code) => `"${code.replace(/[^A-Z]/g, "")}"`).join(" ");
  return `
SELECT DISTINCT ?iso3 ?person ?personLabel ?personDescription ?image ?birth ?death ?article ?sitelinks WHERE {
  VALUES ?iso3 { ${values} }
  ?country wdt:P298 ?iso3.
  ?person wdt:P31 wd:Q5;
          wdt:P27 ?country;
          wdt:P18 ?image;
          wdt:P39 ?position;
          wikibase:sitelinks ?sitelinks.
  OPTIONAL { ?person wdt:P569 ?birth. }
  OPTIONAL { ?person wdt:P570 ?death. }
  OPTIONAL { ?article schema:about ?person; schema:isPartOf <https://en.wikipedia.org/>. }
  FILTER(?sitelinks > 5)
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
ORDER BY DESC(?sitelinks)
LIMIT 80`;
}

function globalLeaderQuery() {
  const values = GLOBAL_LEADER_COUNTRIES.slice(0, 6).map((code) => `"${code}"`).join(" ");
  return `
SELECT DISTINCT ?iso3 ?person ?personLabel ?personDescription ?image ?sitelinks WHERE {
  VALUES ?iso3 { ${values} }
  ?country wdt:P298 ?iso3.
  ?person wdt:P31 wd:Q5;
          wdt:P27 ?country;
          wdt:P18 ?image;
          wdt:P39 ?position;
          wikibase:sitelinks ?sitelinks.
  FILTER(?sitelinks > 120)
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
ORDER BY DESC(?sitelinks)
LIMIT 36`;
}

function normalizeLeaders(rows: SparqlRow[]) {
  const records = new Map<string, LeaderRecord>();
  for (const row of rows) {
    const id = entityId(value(row, "person"));
    const imageUrl = secureUrl(value(row, "image"));
    if (!id || !imageUrl || records.has(id)) continue;
    const article = value(row, "article");
    records.set(id, {
      id,
      name: value(row, "personLabel"),
      description: value(row, "personDescription"),
      extract: value(row, "personDescription"),
      imageUrl,
      birthYear: yearFromDate(value(row, "birth")),
      deathYear: yearFromDate(value(row, "death")),
      countryCode: value(row, "iso3"),
      articleUrl: article || null,
      sitelinks: Number(value(row, "sitelinks")) || 0,
    });
  }
  return [...records.values()];
}

async function getLeaderSet(key: string, codes: string[], maxAgeMs: number) {
  const cached = await readCache<LeaderRecord[]>(key, maxAgeMs);
  if (cached?.fresh) return { leaders: cached.data, cached: true, updatedAt: cached.updatedAt };
  try {
    const rows = await queryWikidata(leaderQuery(codes));
    const leaders = normalizeLeaders(rows);
    if (!leaders.length) throw new Error("No leaders were returned by Wikidata.");
    const updatedAt = await writeCache(key, "Wikidata Query Service", leaders);
    return { leaders, cached: false, updatedAt };
  } catch (error) {
    if (cached) return { leaders: cached.data, cached: true, updatedAt: cached.updatedAt };
    throw error;
  }
}

async function getGlobalLeaderSet() {
  const key = "wikidata:leaders:global:v4";
  const cached = await readCache<LeaderRecord[]>(key, 7 * 24 * 60 * 60 * 1000);
  if (cached?.fresh) return { leaders: cached.data, cached: true, updatedAt: cached.updatedAt };
  try {
    const leaders = normalizeLeaders(await queryWikidata(globalLeaderQuery()));
    if (leaders.length < 4) throw new Error("The global leader pool is incomplete.");
    const updatedAt = await writeCache(key, "Wikidata Query Service", leaders);
    return { leaders, cached: false, updatedAt };
  } catch (error) {
    if (cached) return { leaders: cached.data, cached: true, updatedAt: cached.updatedAt };
    throw error;
  }
}

type WikipediaSummary = {
  extract?: string;
  content_urls?: { desktop?: { page?: string } };
  originalimage?: { source?: string };
  thumbnail?: { source?: string };
};

async function getWikipediaSummary(title: string) {
  const key = `wikipedia:summary:${title}`;
  const cached = await readCache<WikipediaSummary>(key, 30 * 24 * 60 * 60 * 1000);
  if (cached?.fresh) return cached.data;
  try {
    const response = await fetch(`${WIKIPEDIA_SUMMARY}${encodeURIComponent(title)}`, {
      headers: { "User-Agent": API_HEADERS["User-Agent"] },
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) throw new Error(`Wikipedia summary request failed with ${response.status}.`);
    const summary = await response.json() as WikipediaSummary;
    await writeCache(key, "Wikimedia REST API", summary);
    return summary;
  } catch {
    return cached?.data ?? null;
  }
}

async function enrichLeader(leader: LeaderRecord) {
  const title = articleTitle(leader.articleUrl ?? "");
  if (!title) return leader;
  const summary = await getWikipediaSummary(title);
  if (!summary) return leader;
  return {
    ...leader,
    extract: summary.extract || leader.extract,
    imageUrl: secureUrl(summary.originalimage?.source || summary.thumbnail?.source || leader.imageUrl),
    articleUrl: summary.content_urls?.desktop?.page || leader.articleUrl,
  };
}

export async function getLeaders(countryCode: string) {
  const code = countryCode.toUpperCase().replace(/[^A-Z]/g, "");
  if (code.length !== 3) throw new Error("A valid ISO alpha-3 country code is required.");

  const selectedSet = await getLeaderSet(`wikidata:leaders:${code}:v3`, [code], 3 * 24 * 60 * 60 * 1000)
    .catch(() => ({ leaders: [] as LeaderRecord[], cached: false, updatedAt: Date.now() }));
  const selected = selectedSet.leaders.filter((leader) => leader.countryCode === code);
  const leaders = await Promise.all(selected.slice(0, 8).map(enrichLeader));
  let relatedLeaders = selected.slice(8, 30);
  let globalCached = true;
  let globalUpdatedAt = selectedSet.updatedAt;
  if (leaders.length + relatedLeaders.length < 4) {
    const globalSet = await getGlobalLeaderSet();
    globalCached = globalSet.cached;
    globalUpdatedAt = globalSet.updatedAt;
    relatedLeaders = globalSet.leaders.filter((leader) => !leaders.some((item) => item.id === leader.id)).slice(0, 30);
  }

  return {
    leaders,
    relatedLeaders,
    meta: {
      provider: "Wikidata + Wikimedia REST API",
      cached: selectedSet.cached && globalCached,
      updatedAt: Math.max(selectedSet.updatedAt, globalUpdatedAt),
    } satisfies ApiMeta,
  };
}
