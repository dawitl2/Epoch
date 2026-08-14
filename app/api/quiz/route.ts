import type { AnswerMode, CountryRecord, LeaderRecord, LiveQuizQuestion, QuizMode } from "@/src/lib/contracts";
import { getCountries, getLeaders } from "@/src/server/providers";

function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const next = Math.floor(Math.random() * (index + 1));
    [result[index], result[next]] = [result[next], result[index]];
  }
  return result;
}

function countryOptions(correct: CountryRecord, pool: CountryRecord[]) {
  const distractors = shuffle(pool.filter((item) => item.iso3 !== correct.iso3)).slice(0, 3);
  return shuffle([correct, ...distractors]).map((item) => ({ label: item.name, value: item.iso3 }));
}

function leaderOptions(correct: LeaderRecord, pool: LeaderRecord[]) {
  const distractors = shuffle(pool.filter((item) => item.id !== correct.id)).slice(0, 3);
  return shuffle([correct, ...distractors]).map((item) => ({ label: item.name, value: item.id }));
}

function makeCountryQuestions(mode: QuizMode, selected: CountryRecord, pool: CountryRecord[], count: number, answerMode: AnswerMode) {
  const eligible = pool.filter((country) => {
    if (mode === "flags") return Boolean(country.flagUrl);
    if (mode === "capitals") return Boolean(country.capital);
    if (mode === "states") return Boolean(country.description);
    return true;
  });
  const ordered = shuffle([selected, ...eligible.filter((country) => country.iso3 !== selected.iso3)]);

  return Array.from({ length: count }, (_, index): LiveQuizQuestion => {
    const country = ordered[index % ordered.length];
    const options = countryOptions(country, eligible);
    const globeKicker = answerMode === "globe" ? "Find it on the globe" : "Choose one answer";
    if (mode === "flags") {
      return {
        id: `flag-${country.iso3}-${index}`, mode, prompt: "Which country uses this flag?", kicker: globeKicker,
        imageUrl: country.flagUrl, imageAlt: `Flag served by the Wikidata media API for ${country.name}`,
        options, correctValue: country.iso3, correctCountryCode: country.iso3,
        fact: `${country.name}${country.capital ? ` has its capital at ${country.capital}` : ""}${country.continent ? ` and is in ${country.continent}` : ""}.`,
        sourceUrl: `https://www.wikidata.org/wiki/${country.id}`,
      };
    }
    if (mode === "capitals") {
      return {
        id: `capital-${country.iso3}-${index}`, mode, prompt: `${country.capital} is the capital of which country?`, kicker: globeKicker,
        imageUrl: null, imageAlt: null, options, correctValue: country.iso3, correctCountryCode: country.iso3,
        fact: `${country.capital} is listed by Wikidata as a capital of ${country.name}.`, sourceUrl: `https://www.wikidata.org/wiki/${country.id}`,
      };
    }
    if (mode === "states") {
      return {
        id: `state-${country.iso3}-${index}`, mode, prompt: country.description.charAt(0).toUpperCase() + country.description.slice(1), kicker: "Identify the state",
        imageUrl: null, imageAlt: null, options, correctValue: country.iso3, correctCountryCode: country.iso3,
        fact: `${country.name}${country.capital ? ` — capital: ${country.capital}` : ""}.`, sourceUrl: `https://www.wikidata.org/wiki/${country.id}`,
      };
    }
    return {
      id: `country-${country.iso3}-${index}`, mode, prompt: answerMode === "globe" ? `Locate ${country.name}.` : `Which country uses the code ${country.iso3}?`, kicker: globeKicker,
      imageUrl: null, imageAlt: null, options, correctValue: country.iso3, correctCountryCode: country.iso3,
      fact: `${country.name}${country.capital ? ` has its capital at ${country.capital}` : ""}${country.continent ? ` and belongs to ${country.continent}` : ""}.`,
      sourceUrl: `https://www.wikidata.org/wiki/${country.id}`,
    };
  });
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const countryCode = (params.get("country") ?? "").toUpperCase();
  const mode = (params.get("mode") ?? "countries") as QuizMode;
  const answerMode = (params.get("answerMode") ?? "choices") as AnswerMode;
  const count = Math.min(10, Math.max(3, Number(params.get("count")) || 5));
  const modes: QuizMode[] = ["flags", "countries", "capitals", "leaders", "states"];
  if (!modes.includes(mode)) return Response.json({ error: "Unknown quiz mode." }, { status: 400 });

  try {
    const countriesResult = await getCountries();
    const selected = countriesResult.data.find((country) => country.iso3 === countryCode);
    if (!selected) return Response.json({ error: "Select a supported country first." }, { status: 404 });
    const regional = countriesResult.data.filter((country) => country.continent === selected.continent);

    if (mode !== "leaders") {
      const questions = makeCountryQuestions(mode, selected, regional.length >= 4 ? regional : countriesResult.data, count, answerMode);
      return Response.json({ questions, meta: countriesResult.meta });
    }

    const leaderResult = await getLeaders(countryCode);
    const source = leaderResult.leaders.length ? leaderResult.leaders : leaderResult.relatedLeaders;
    const optionPool = [...leaderResult.leaders, ...leaderResult.relatedLeaders];
    if (!source.length || optionPool.length < 4) throw new Error("The live leader archive does not yet contain enough records for this round.");
    const ordered = shuffle(source);
    const questions = Array.from({ length: Math.min(count, ordered.length) }, (_, index): LiveQuizQuestion => {
      const leader = ordered[index % ordered.length];
      return {
        id: `leader-${leader.id}-${index}`, mode, prompt: "Who is shown in this archive portrait?", kicker: leader.countryCode === countryCode ? `Leaders of ${selected.name}` : "World leaders",
        imageUrl: leader.imageUrl, imageAlt: `Portrait of ${leader.name} from Wikimedia Commons`,
        options: leaderOptions(leader, optionPool), correctValue: leader.id, correctCountryCode: leader.countryCode,
        fact: leader.extract || leader.description, sourceUrl: leader.articleUrl,
      };
    });
    return Response.json({ questions, meta: leaderResult.meta });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "The quiz could not be prepared." }, { status: 503 });
  }
}

