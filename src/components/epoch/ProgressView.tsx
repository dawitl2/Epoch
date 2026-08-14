"use client";

import { useEffect, useState } from "react";
import type { ProgressResponse, QuizMode } from "@/src/lib/contracts";

const labels: Record<QuizMode, string> = {
  flags: "Flags",
  countries: "Countries",
  capitals: "Capitals",
  leaders: "Leaders",
  states: "States",
};

export function ProgressView({ onBack }: { onBack: () => void }) {
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/progress", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json() as ProgressResponse & { error?: string };
        if (!response.ok) throw new Error(body.error || "Progress is unavailable.");
        setProgress(body);
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Progress is unavailable."));
  }, []);

  return (
    <section className="progress-redesign">
      <button type="button" className="plain-back" onClick={onBack}>← Return to globe</button>
      <header><p className="micro-label">Stored in Epoch D1</p><h1>Your record<br />of the world.</h1><p>Every completed live round is written to the database. No fabricated progress and no browser-only scorekeeping.</p></header>
      {error && <p className="setup-error">{error}</p>}
      {!progress && !error && <div className="progress-loading"><span /><span /><span /></div>}
      {progress && (
        <>
          <div className="progress-redesign__numbers">
            <div><small>Rounds</small><strong>{String(progress.rounds).padStart(2, "0")}</strong></div>
            <div><small>Questions</small><strong>{progress.questions}</strong></div>
            <div><small>Correct</small><strong>{progress.correct}</strong></div>
            <div className="is-accent"><small>Accuracy</small><strong>{progress.accuracy}%</strong></div>
          </div>
          <div className="progress-redesign__body">
            <section>
              <div className="section-heading"><div><p className="micro-label">Performance</p><h2>By subject</h2></div></div>
              {(Object.keys(labels) as QuizMode[]).map((mode) => {
                const row = progress.modes.find((item) => item.mode === mode);
                return <div className="mode-progress-row" key={mode}><span>{labels[mode]}</span><div><i style={{ width: `${row?.accuracy ?? 0}%` }} /></div><strong>{row?.accuracy ?? 0}%</strong><small>{row?.rounds ?? 0} rounds</small></div>;
              })}
            </section>
            <section>
              <div className="section-heading"><div><p className="micro-label">Latest database writes</p><h2>Recent rounds</h2></div></div>
              {progress.recent.length === 0 ? <p className="inline-note">Complete a live quiz to begin this record.</p> : progress.recent.map((row, index) => (
                <div className="recent-round" key={`${row.createdAt}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{labels[row.mode]}</strong><small>{row.countryCode || "World"}</small></div><strong>{row.score}/{row.total}</strong></div>
              ))}
            </section>
          </div>
        </>
      )}
    </section>
  );
}

