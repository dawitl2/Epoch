import type {
  AlertsResponse,
  AnswerMode,
  CountriesResponse,
  LeadersResponse,
  QuizMode,
  QuizResponse,
} from "@/src/lib/contracts";

async function readJson<T>(response: Response, fallback: string) {
  const body = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(body.error || fallback);
  return body;
}

export function fetchCountries(signal?: AbortSignal) {
  return fetch("/api/countries", { signal }).then((response) =>
    readJson<CountriesResponse>(response, "The live country archive is unavailable."));
}

export function fetchLeaders(countryCode: string, signal?: AbortSignal) {
  return fetch(`/api/leaders?country=${encodeURIComponent(countryCode)}`, { signal }).then((response) =>
    readJson<LeadersResponse>(response, "The live leader archive is unavailable."));
}

export function fetchAlerts(signal?: AbortSignal) {
  return fetch("/api/alerts", { signal }).then((response) =>
    readJson<AlertsResponse>(response, "Live geography alerts are unavailable."));
}

export function fetchQuiz(input: {
  countryCode: string;
  mode: QuizMode;
  count: number;
  answerMode: AnswerMode;
}) {
  const query = new URLSearchParams({
    country: input.countryCode,
    mode: input.mode,
    count: String(input.count),
    answerMode: input.answerMode,
  });
  return fetch(`/api/quiz?${query}`).then((response) =>
    readJson<QuizResponse>(response, "The live quiz could not be prepared."));
}
