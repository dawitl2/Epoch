"use client";

import { useEffect, useState } from "react";
import { CountryPanel } from "@/src/components/epoch/CountryPanel";
import { AlertPanel } from "@/src/components/epoch/AlertPanel";
import { ProgressView } from "@/src/components/epoch/ProgressView";
import { QuizExperience } from "@/src/components/epoch/QuizExperience";
import { WorldGlobe } from "@/src/components/epoch/WorldGlobe";
import { useGeographyAlerts } from "@/src/hooks/useGeographyAlerts";
import type { CountryRecord, GeographyAlert, LeaderRecord, QuizMode } from "@/src/lib/contracts";
import { fetchCountries, fetchLeaders } from "@/src/services/epochApi";

type View = "atlas" | "quiz" | "progress";

export function EpochApp() {
  const [view, setView] = useState<View>("atlas");
  const [countries, setCountries] = useState<CountryRecord[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [countriesError, setCountriesError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<CountryRecord | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<GeographyAlert | null>(null);
  const [leaders, setLeaders] = useState<LeaderRecord[]>([]);
  const [leadersLoading, setLeadersLoading] = useState(false);
  const [leadersError, setLeadersError] = useState<string | null>(null);
  const [quizMode, setQuizMode] = useState<QuizMode>("countries");
  const [provider, setProvider] = useState("Connecting to Wikidata");
  const { alerts, error: alertsError } = useGeographyAlerts();

  useEffect(() => {
    const controller = new AbortController();
    fetchCountries(controller.signal)
      .then((body) => {
        setCountries(body.countries);
        setProvider(body.meta.provider);
      })
      .catch((error) => {
        if (error instanceof Error && error.name !== "AbortError") setCountriesError(error.message);
      })
      .finally(() => setCountriesLoading(false));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!selectedCountry) return;
    const controller = new AbortController();
    fetchLeaders(selectedCountry.iso3, controller.signal)
      .then((body) => {
        setLeaders(body.leaders);
      })
      .catch((error) => {
        if (error instanceof Error && error.name !== "AbortError") setLeadersError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLeadersLoading(false);
      });
    return () => controller.abort();
  }, [selectedCountry]);

  const selectCountry = (country: CountryRecord) => {
    setSelectedAlert(null);
    setLeaders([]);
    setLeadersError(null);
    setLeadersLoading(true);
    setSelectedCountry(country);
  };

  const startQuiz = (mode: QuizMode) => {
    if (!selectedCountry) return;
    setQuizMode(mode);
    setView("quiz");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const jumpToArchive = () => {
    setView("atlas");
    requestAnimationFrame(() => document.querySelector(".live-leaders")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  return (
    <div className="epoch-app">
      <header className="epoch-header">
        <button type="button" className="epoch-word" onClick={() => setView("atlas")}>Epoch</button>
        <nav aria-label="Primary navigation">
          <button type="button" className={view === "atlas" ? "is-active" : ""} onClick={() => setView("atlas")}><span>01</span>World</button>
          <button type="button" onClick={jumpToArchive} disabled={!selectedCountry}><span>02</span>Archive</button>
          <button type="button" className={view === "quiz" ? "is-active" : ""} onClick={() => selectedCountry && setView("quiz")} disabled={!selectedCountry}><span>03</span>Quiz</button>
          <button type="button" className={view === "progress" ? "is-active" : ""} onClick={() => setView("progress")}><span>04</span>Record</button>
        </nav>
        <div className="live-indicator"><i /><span>{countries.length ? `${countries.length} countries` : "Live data"}</span><small>{provider}</small></div>
      </header>

      {countriesLoading && (
        <main className="initial-data-load"><div className="data-load-type">EPOCH</div><div className="data-load-line"><span /></div><p>Opening the live world archive</p></main>
      )}
      {countriesError && (
        <main className="fatal-data-error"><p className="micro-label">The archive did not answer</p><h1>Live country data is unavailable.</h1><p>{countriesError}</p><button type="button" className="black-button" onClick={() => window.location.reload()}>Try again</button></main>
      )}

      {!countriesLoading && !countriesError && view === "atlas" && (
        <main className="atlas-layout">
          <section className="atlas-stage">
            <div className="atlas-stage__title"><p className="micro-label">World view / country level</p><h1>Read the<br />planet.</h1></div>
            <WorldGlobe
              countries={countries}
              alerts={alerts}
              selectedCode={selectedCountry?.iso3 ?? null}
              selectedAlertId={selectedAlert?.id ?? null}
              onCountrySelect={selectCountry}
              onAlertSelect={setSelectedAlert}
            />
            <div className="atlas-stage__counter"><strong>{selectedCountry ? selectedCountry.iso3 : "000"}</strong><span>{selectedCountry ? selectedCountry.name : "No country selected"}</span></div>
            {alertsError && <div className="atlas-alert-status">Alert feed delayed</div>}
          </section>
          {selectedAlert ? (
            <AlertPanel alert={selectedAlert} onClose={() => setSelectedAlert(null)} />
          ) : (
            <CountryPanel
              countries={countries}
              selectedCountry={selectedCountry}
              leaders={leaders}
              leadersLoading={leadersLoading}
              leadersError={leadersError}
              alerts={alerts}
              onSelectAlert={setSelectedAlert}
              onSelectCountry={selectCountry}
              onStartQuiz={startQuiz}
            />
          )}
        </main>
      )}

      {!countriesLoading && !countriesError && view === "quiz" && selectedCountry && (
        <main className="full-view"><QuizExperience key={`${selectedCountry.iso3}-${quizMode}`} countries={countries} country={selectedCountry} initialMode={quizMode} onBack={() => setView("atlas")} onShowProgress={() => setView("progress")} /></main>
      )}

      {!countriesLoading && !countriesError && view === "progress" && (
        <main className="full-view"><ProgressView onBack={() => setView("atlas")} /></main>
      )}

      <nav className="mobile-epoch-nav" aria-label="Mobile navigation">
        <button type="button" className={view === "atlas" ? "is-active" : ""} onClick={() => setView("atlas")}><span>01</span>World</button>
        <button type="button" onClick={jumpToArchive} disabled={!selectedCountry}><span>02</span>Archive</button>
        <button type="button" className={view === "quiz" ? "is-active" : ""} onClick={() => selectedCountry && setView("quiz")} disabled={!selectedCountry}><span>03</span>Quiz</button>
        <button type="button" className={view === "progress" ? "is-active" : ""} onClick={() => setView("progress")}><span>04</span>Record</button>
      </nav>
    </div>
  );
}
