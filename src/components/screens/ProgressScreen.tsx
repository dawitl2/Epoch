"use client";

import { Award, BookOpenCheck, Flame, Globe2, Target } from "lucide-react";
import { mockProgress, modeDetails, regions } from "@/src/data/mockData";
import type { ModeId } from "@/src/types";

const stats = [
  { label: "Quizzes completed", value: mockProgress.quizzesCompleted, icon: BookOpenCheck },
  { label: "Questions answered", value: mockProgress.questionsAnswered, icon: Target },
  { label: "Average accuracy", value: `${mockProgress.averageAccuracy}%`, icon: Award },
  { label: "Best streak", value: mockProgress.bestStreak, icon: Flame },
  { label: "Regions explored", value: `${mockProgress.regionsExplored}/6`, icon: Globe2 },
];

export function ProgressScreen() {
  return (
    <div className="screen progress-screen page-enter">
      <header className="screen-header screen-header--split">
        <div><span className="eyebrow">Personal field notes</span><h1>Your progress</h1></div>
        <p>A quiet record of the places and periods you have explored. Progress is stored as mock data in this frontend phase.</p>
      </header>

      <section className="progress-summary" aria-label="Progress summary">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label}><Icon size={18} strokeWidth={1.5} aria-hidden="true" /><strong>{value}</strong><span>{label}</span></div>
        ))}
      </section>

      <div className="progress-columns">
        <section className="progress-ledger">
          <div className="ledger-title"><span className="eyebrow">By region</span><span>Explored</span></div>
          {regions.map((region) => (
            <div className="progress-row" key={region.id}>
              <span>{region.name}</span>
              <span className="progress-track"><span style={{ width: `${region.progress}%` }} /></span>
              <strong>{region.progress}%</strong>
            </div>
          ))}
        </section>
        <section className="progress-ledger">
          <div className="ledger-title"><span className="eyebrow">By mode</span><span>Mastery</span></div>
          {(Object.keys(modeDetails) as ModeId[]).map((id) => (
            <div className="progress-row" key={id}>
              <span>{modeDetails[id].name}</span>
              <span className="progress-track progress-track--gold"><span style={{ width: `${modeDetails[id].progress}%` }} /></span>
              <strong>{modeDetails[id].progress}%</strong>
            </div>
          ))}
          <div className="xp-note"><span>Archive XP</span><strong>{mockProgress.xp.toLocaleString()}</strong></div>
        </section>
      </div>
    </div>
  );
}

