export type QuizMode = "flags" | "countries" | "capitals" | "leaders" | "states";
export type AnswerMode = "choices" | "globe";

export interface CountryRecord {
  id: string;
  name: string;
  description: string;
  iso2: string;
  iso3: string;
  numeric: string;
  capital: string | null;
  continent: string;
  flagUrl: string | null;
  center: [number, number] | null;
}

export interface LeaderRecord {
  id: string;
  name: string;
  description: string;
  extract: string;
  imageUrl: string;
  birthYear: number | null;
  deathYear: number | null;
  countryCode: string;
  articleUrl: string | null;
  sitelinks: number;
}

export interface ApiMeta {
  provider: string;
  cached: boolean;
  updatedAt: number;
}

export interface CountriesResponse {
  countries: CountryRecord[];
  meta: ApiMeta;
}

export interface LeadersResponse {
  leaders: LeaderRecord[];
  relatedLeaders: LeaderRecord[];
  meta: ApiMeta;
}

export interface GeographyAlert {
  id: string;
  title: string;
  place: string;
  magnitude: number;
  significance: number;
  longitude: number;
  latitude: number;
  depthKm: number;
  occurredAt: number;
  detail: string;
  sourceUrl: string;
}

export interface AlertsResponse {
  alerts: GeographyAlert[];
  meta: ApiMeta;
}

export interface LiveQuizQuestion {
  id: string;
  mode: QuizMode;
  prompt: string;
  kicker: string;
  imageUrl: string | null;
  imageAlt: string | null;
  options: { label: string; value: string }[];
  correctValue: string;
  correctCountryCode: string;
  fact: string;
  sourceUrl: string | null;
}

export interface QuizResponse {
  questions: LiveQuizQuestion[];
  meta: ApiMeta;
}

export interface ProgressResponse {
  rounds: number;
  questions: number;
  correct: number;
  accuracy: number;
  bestScore: number;
  modes: { mode: QuizMode; rounds: number; accuracy: number }[];
  recent: { mode: QuizMode; countryCode: string | null; score: number; total: number; createdAt: number }[];
}
