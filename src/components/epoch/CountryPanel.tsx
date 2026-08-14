"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { CountryQuickQuiz } from "@/src/components/epoch/CountryQuickQuiz";
import type { CountryRecord, GeographyAlert, LeaderRecord, QuizMode } from "@/src/lib/contracts";

const modes: { id: QuizMode; title: string; label: string; detail: string }[] = [
  { id: "flags", title: "Flags", label: "Visual identity", detail: "Read national flags, then answer by choice or on the globe." },
  { id: "countries", title: "Countries", label: "Political geography", detail: "Names, codes, locations, and the shape of the modern world." },
  { id: "capitals", title: "Capitals", label: "Seats of power", detail: "Connect capital cities to their countries across the globe." },
  { id: "leaders", title: "Leaders", label: "People in power", detail: "Live portraits and biographies from the Wikimedia archive." },
  { id: "states", title: "States", label: "Identity & context", detail: "Identify sovereign states through live historical descriptions." },
];

function mediaUrl(url: string | null) {
  return url ? `/api/media?url=${encodeURIComponent(url)}` : "";
}

type Props = {
  countries: CountryRecord[];
  selectedCountry: CountryRecord | null;
  leaders: LeaderRecord[];
  leadersLoading: boolean;
  leadersError: string | null;
  alerts: GeographyAlert[];
  onSelectAlert: (alert: GeographyAlert) => void;
  onSelectCountry: (country: CountryRecord) => void;
  onStartQuiz: (mode: QuizMode) => void;
};

export function CountryPanel({ countries, selectedCountry, leaders, leadersLoading, leadersError, alerts, onSelectAlert, onSelectCountry, onStartQuiz }: Props) {
  const [query, setQuery] = useState("");
  const matches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return countries.filter((country) => country.name.toLowerCase().includes(normalized) || country.iso3.toLowerCase().includes(normalized)).slice(0, 7);
  }, [countries, query]);

  const choose = (country: CountryRecord) => {
    onSelectCountry(country);
    setQuery("");
  };

  return (
    <aside className="country-panel">
      <div className="country-search">
        <label htmlFor="country-search">Jump to a country</label>
        <div className="country-search__field">
          <span>⌕</span>
          <input id="country-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name or ISO code" autoComplete="off" />
          <small>{countries.length || "—"}</small>
        </div>
        {matches.length > 0 && (
          <div className="country-search__results">
            {matches.map((country) => (
              <button type="button" key={country.iso3} onClick={() => choose(country)}>
                <span>{country.name}</span><small>{country.iso3}</small>
              </button>
            ))}
          </div>
        )}
      </div>

      {!selectedCountry ? (
        <div className="country-panel__empty">
          <span className="giant-index">001</span>
          <div>
            <p className="micro-label">Start anywhere</p>
            <h1>Turn the world.<br />Choose a country.</h1>
            <p>No regions and no guided path. Select the geography itself, then move directly into flags, capitals, leaders, and states.</p>
          </div>
          <div className="empty-instruction"><span>01</span><p>Rotate the globe</p><span>02</span><p>Click a border</p><span>03</span><p>Open its archive</p></div>
          {alerts.length > 0 && (
            <section className="alert-index" aria-label="Live geography alerts">
              <div className="section-heading"><div><p className="micro-label">Live USGS feed</p><h2>Latest alerts</h2></div><span>{alerts.length} today</span></div>
              {alerts.slice(0, 3).map((alert) => (
                <button type="button" key={alert.id} onClick={() => onSelectAlert(alert)}>
                  <strong>M {alert.magnitude.toFixed(1)}</strong><span>{alert.place}</span><small>Focus ↗</small>
                </button>
              ))}
            </section>
          )}
        </div>
      ) : (
        <div className="country-panel__content panel-swap" key={selectedCountry.iso3}>
          <header className="country-title">
            <div className="country-title__flag">
              {selectedCountry.flagUrl ? (
                <Image unoptimized fill sizes="96px" src={mediaUrl(selectedCountry.flagUrl)} alt={`Flag of ${selectedCountry.name}`} />
              ) : <span>{selectedCountry.iso2}</span>}
            </div>
            <div><p className="micro-label">Selected country · {selectedCountry.iso3}</p><h1>{selectedCountry.name}</h1></div>
          </header>

          <p className="country-description">{selectedCountry.description || "Wikidata has not supplied an English description for this country."}</p>

          <dl className="country-facts">
            <div><dt>Capital</dt><dd>{selectedCountry.capital || "Not supplied"}</dd></div>
            <div><dt>Continent</dt><dd>{selectedCountry.continent || "Not supplied"}</dd></div>
            <div><dt>ISO</dt><dd>{selectedCountry.iso2} / {selectedCountry.iso3}</dd></div>
            <div><dt>Map ID</dt><dd>{selectedCountry.numeric}</dd></div>
          </dl>

          <CountryQuickQuiz key={selectedCountry.iso3} country={selectedCountry} countries={countries} />

          <section className="live-leaders">
            <div className="section-heading"><div><p className="micro-label">Live archive</p><h2>Leaders</h2></div><span>Wikidata + Wikipedia</span></div>
            {leadersLoading && <div className="leader-loading"><span /><span /><span /></div>}
            {leadersError && <p className="inline-error">{leadersError}</p>}
            {!leadersLoading && !leadersError && leaders.length === 0 && <p className="inline-note">No illustrated leaders were returned for this country.</p>}
            {leaders.length > 0 && (
              <div className="leader-strip">
                {leaders.slice(0, 5).map((leader, index) => (
                  <article key={leader.id} style={{ "--delay": `${index * 70}ms` } as React.CSSProperties}>
                    <div className="leader-strip__image">
                      <Image unoptimized fill sizes="(max-width: 700px) 54vw, 190px" src={mediaUrl(leader.imageUrl)} alt={`Portrait of ${leader.name}`} />
                    </div>
                    <div><small>{leader.birthYear ?? "?"} — {leader.deathYear ?? "present"}</small><h3>{leader.name}</h3><p>{leader.extract || leader.description}</p></div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="mode-list">
            <div className="section-heading"><div><p className="micro-label">Test what you know</p><h2>Choose a mode</h2></div></div>
            {modes.map((mode, index) => (
              <button type="button" key={mode.id} onClick={() => onStartQuiz(mode.id)}>
                <span className="mode-list__index">0{index + 1}</span>
                <span><small>{mode.label}</small><strong>{mode.title}</strong><p>{mode.detail}</p></span>
                <span className="mode-list__arrow">↗</span>
              </button>
            ))}
          </section>
        </div>
      )}
    </aside>
  );
}
