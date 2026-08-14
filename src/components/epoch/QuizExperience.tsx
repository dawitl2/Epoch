"use client";

import Image from "next/image";
import { useState } from "react";
import { WorldGlobe } from "@/src/components/epoch/WorldGlobe";
import type { AnswerMode, CountryRecord, LiveQuizQuestion, QuizMode } from "@/src/lib/contracts";
import { fetchQuiz } from "@/src/services/epochApi";

const modeCopy: Record<QuizMode, { number: string; title: string; description: string }> = {
  flags: { number: "01", title: "Flags", description: "Read a live flag image, then name or locate its country." },
  countries: { number: "02", title: "Countries", description: "Identify political geography through names, codes, and borders." },
  capitals: { number: "03", title: "Capitals", description: "Connect seats of government to the states they represent." },
  leaders: { number: "04", title: "Leaders", description: "Recognize API-sourced portraits from the world historical archive." },
  states: { number: "05", title: "States", description: "Use live descriptions to identify sovereign states." },
};

function mediaUrl(url: string | null) {
  return url ? `/api/media?url=${encodeURIComponent(url)}` : "";
}

type Props = {
  countries: CountryRecord[];
  country: CountryRecord;
  initialMode: QuizMode;
  onBack: () => void;
  onShowProgress: () => void;
};

export function QuizExperience({ countries, country, initialMode, onBack, onShowProgress }: Props) {
  const [phase, setPhase] = useState<"setup" | "loading" | "play" | "results">("setup");
  const [mode, setMode] = useState<QuizMode>(initialMode);
  const [answerMode, setAnswerMode] = useState<AnswerMode>(initialMode === "leaders" ? "choices" : "globe");
  const [count, setCount] = useState(5);
  const [questions, setQuestions] = useState<LiveQuizQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const question = questions[questionIndex];
  const isCorrect = answered && selectedValue === question?.correctValue;

  const selectMode = (nextMode: QuizMode) => {
    setMode(nextMode);
    if (nextMode === "leaders") setAnswerMode("choices");
  };

  const begin = async () => {
    setPhase("loading");
    setError(null);
    try {
      const body = await fetchQuiz({ countryCode: country.iso3, mode, count, answerMode });
      setQuestions(body.questions);
      setQuestionIndex(0);
      setScore(0);
      setSelectedValue(null);
      setAnswered(false);
      setPhase("play");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The live quiz could not be prepared.");
      setPhase("setup");
    }
  };

  const answer = (value: string) => {
    if (answered || !question) return;
    setSelectedValue(value);
  };

  const submit = () => {
    if (!question || !selectedValue || answered) return;
    setAnswered(true);
    if (selectedValue === question.correctValue) setScore((current) => current + 1);
  };

  const answerOnGlobe = (selectedCountry: CountryRecord) => {
    if (answered || !question) return;
    setSelectedValue(selectedCountry.iso3);
    setAnswered(true);
    if (selectedCountry.iso3 === question.correctCountryCode) setScore((current) => current + 1);
  };

  const finish = async () => {
    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, countryCode: country.iso3, score, total: questions.length }),
    }).catch(() => undefined);
    setPhase("results");
  };

  const next = () => {
    if (questionIndex === questions.length - 1) {
      void finish();
      return;
    }
    setQuestionIndex((current) => current + 1);
    setSelectedValue(null);
    setAnswered(false);
  };

  if (phase === "loading") {
    return (
      <section className="quiz-loading-view">
        <button type="button" className="plain-back" onClick={() => setPhase("setup")}>← Cancel</button>
        <div className="quiz-loading-graphic"><span /><span /><span /></div>
        <p className="micro-label">Calling the live archive</p>
        <h1>Building a new round.</h1>
        <p>Countries, flags, portraits, and descriptions are being assembled from Wikidata and Wikimedia.</p>
      </section>
    );
  }

  if (phase === "results") {
    const accuracy = questions.length ? Math.round((score / questions.length) * 100) : 0;
    return (
      <section className="live-results result-appear">
        <button type="button" className="plain-back" onClick={onBack}>← Return to globe</button>
        <p className="micro-label">Round complete · {country.name} · {modeCopy[mode].title}</p>
        <div className="live-results__score"><strong>{score}</strong><span>/{questions.length}</span></div>
        <h1>{accuracy >= 80 ? "You read the world closely." : accuracy >= 60 ? "Good instincts. Keep moving." : "The map is beginning to open."}</h1>
        <div className="live-results__stats"><div><small>Accuracy</small><strong>{accuracy}%</strong></div><div><small>Correct</small><strong>{score}</strong></div><div><small>Source</small><strong>Live API</strong></div></div>
        <div className="live-results__actions">
          <button type="button" className="black-button" onClick={() => { setPhase("setup"); setError(null); }}>Play another round</button>
          <button type="button" className="line-button" onClick={onShowProgress}>Open progress</button>
        </div>
      </section>
    );
  }

  if (phase === "setup") {
    return (
      <section className="quiz-setup-redesign">
        <button type="button" className="plain-back" onClick={onBack}>← Return to globe</button>
        <header>
          <p className="micro-label">Build a live quiz · {country.name}</p>
          <h1>How do you want<br />to read the world?</h1>
        </header>

        <div className="quiz-setup-redesign__grid">
          <fieldset className="setup-block setup-block--modes">
            <legend>01 / Subject</legend>
            {(Object.keys(modeCopy) as QuizMode[]).map((item) => (
              <button type="button" key={item} className={mode === item ? "is-selected" : ""} onClick={() => selectMode(item)}>
                <span>{modeCopy[item].number}</span><strong>{modeCopy[item].title}</strong><small>{modeCopy[item].description}</small>
              </button>
            ))}
          </fieldset>

          <div className="setup-stack">
            <fieldset className="setup-block">
              <legend>02 / Answer on</legend>
              <div className="choice-switch">
                <button type="button" className={answerMode === "globe" ? "is-selected" : ""} disabled={mode === "leaders"} onClick={() => setAnswerMode("globe")}><strong>The globe</strong><small>Click the geography itself</small></button>
                <button type="button" className={answerMode === "choices" ? "is-selected" : ""} onClick={() => setAnswerMode("choices")}><strong>Multiple choice</strong><small>Four direct answers</small></button>
              </div>
            </fieldset>
            <fieldset className="setup-block">
              <legend>03 / Length</legend>
              <div className="count-switch">
                {[5, 10].map((value) => <button type="button" key={value} className={count === value ? "is-selected" : ""} onClick={() => setCount(value)}><strong>{value}</strong><small>questions</small></button>)}
              </div>
            </fieldset>
            {error && <p className="setup-error">{error}</p>}
            <button type="button" className="launch-quiz" onClick={begin}><span>Begin live round</span><strong>↗</strong></button>
          </div>
        </div>
      </section>
    );
  }

  if (!question) return null;
  const globeMode = answerMode === "globe" && mode !== "leaders";
  const chosenCountry = countries.find((item) => item.iso3 === selectedValue);

  return (
    <section className={`live-quiz ${globeMode ? "live-quiz--globe" : ""}`}>
      <header className="live-quiz__header">
        <button type="button" className="plain-back" onClick={() => setPhase("setup")}>← Exit round</button>
        <span>{country.name} / {modeCopy[mode].title}</span>
        <strong>{String(questionIndex + 1).padStart(2, "0")} — {String(questions.length).padStart(2, "0")}</strong>
      </header>
      <div className="live-quiz__progress"><span style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} /></div>

      {globeMode ? (
        <div className="globe-answer-stage">
          <WorldGlobe
            countries={countries}
            selectedCode={answered ? question.correctCountryCode : null}
            onCountrySelect={answerOnGlobe}
            flyToSelection={answered}
            className="world-globe--quiz"
          />
          <div className="globe-question question-appear" key={question.id}>
            <p className="micro-label">{question.kicker}</p>
            {question.imageUrl && <div className="globe-question__flag"><Image unoptimized fill sizes="160px" src={mediaUrl(question.imageUrl)} alt={question.imageAlt ?? "Quiz image"} /></div>}
            <h1>{question.prompt}</h1>
            {!answered && <p>Rotate and click a country to lock your answer.</p>}
            {answered && (
              <div className={`compact-feedback ${isCorrect ? "is-correct" : "is-incorrect"}`}>
                <strong>{isCorrect ? "Correct." : `Not quite — you chose ${chosenCountry?.name ?? "another country"}.`}</strong>
                <p>{question.fact}</p>
                <button type="button" onClick={next}>{questionIndex === questions.length - 1 ? "Finish round" : "Next question"} →</button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="choice-question question-appear" key={question.id}>
          <div className="choice-question__intro"><p className="micro-label">{question.kicker}</p><span>{modeCopy[mode].number} / LIVE</span></div>
          {question.imageUrl && (
            <div className={`choice-question__image ${mode === "flags" ? "is-flag" : ""}`}>
              <Image unoptimized fill sizes="(max-width: 700px) 86vw, 520px" src={mediaUrl(question.imageUrl)} alt={question.imageAlt ?? "Quiz image"} />
            </div>
          )}
          <h1>{question.prompt}</h1>
          <div className="live-options">
            {question.options.map((option, index) => {
              const correct = answered && option.value === question.correctValue;
              const incorrect = answered && option.value === selectedValue && !correct;
              return <button type="button" key={option.value} className={`${selectedValue === option.value ? "is-selected" : ""} ${correct ? "is-correct" : ""} ${incorrect ? "is-incorrect" : ""}`} onClick={() => answer(option.value)} disabled={answered}><span>{String.fromCharCode(65 + index)}</span><strong>{option.label}</strong></button>;
            })}
          </div>
          {!answered ? (
            <button type="button" className="black-button submit-live-answer" disabled={!selectedValue} onClick={submit}>Lock answer →</button>
          ) : (
            <div className={`choice-feedback ${isCorrect ? "is-correct" : "is-incorrect"}`}>
              <div><strong>{isCorrect ? "Correct." : "Not this time."}</strong><p>{question.fact}</p></div>
              <button type="button" onClick={next}>{questionIndex === questions.length - 1 ? "Finish" : "Continue"} →</button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
