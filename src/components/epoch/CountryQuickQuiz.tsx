"use client";

import { useMemo, useState } from "react";
import type { CountryRecord } from "@/src/lib/contracts";

function buildOptions(country: CountryRecord, countries: CountryRecord[]) {
  const pool = countries.filter((item) => item.capital && item.iso3 !== country.iso3);
  const seed = [...country.iso3].reduce((sum, letter) => sum + letter.charCodeAt(0), 0);
  const wrong = new Set<string>();
  for (let offset = 0; wrong.size < 3 && offset < pool.length; offset += 1) {
    const capital = pool[(seed + offset * 29) % pool.length]?.capital;
    if (capital) wrong.add(capital);
  }
  const options = [country.capital || "Not supplied", ...wrong].slice(0, 4);
  return options.toSorted((a, b) => ((a.charCodeAt(0) + seed) % 7) - ((b.charCodeAt(0) + seed) % 7));
}

export function CountryQuickQuiz({ country, countries }: { country: CountryRecord; countries: CountryRecord[] }) {
  const options = useMemo(() => buildOptions(country, countries), [countries, country]);
  const [answer, setAnswer] = useState<string | null>(null);
  const correct = answer === country.capital;

  return (
    <section className="quick-quiz" aria-labelledby="quick-quiz-title">
      <div className="section-heading"><div><p className="micro-label">Quick check</p><h2 id="quick-quiz-title">Which is the capital?</h2></div><span>Multiple choice</span></div>
      <p>Choose the capital of <strong>{country.name}</strong>.</p>
      <div className="quick-quiz__options">
        {options.map((option, index) => (
          <button
            type="button"
            key={option}
            className={answer === option ? (correct ? "is-correct" : "is-wrong") : ""}
            onClick={() => setAnswer(option)}
            disabled={answer !== null}
          >
            <span>0{index + 1}</span>{option}
          </button>
        ))}
      </div>
      {answer && <p className={`quick-quiz__feedback ${correct ? "is-correct" : "is-wrong"}`}>{correct ? "Correct." : `The capital is ${country.capital}.`}</p>}
    </section>
  );
}
