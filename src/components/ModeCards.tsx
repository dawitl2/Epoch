"use client";

import { Crown, Hourglass, Landmark, Swords } from "lucide-react";
import { modeDetails } from "@/src/data/mockData";
import type { ModeId } from "@/src/types";

const modeIcons = {
  leaders: Crown,
  empires: Landmark,
  wars: Swords,
  timeline: Hourglass,
};

type Props = {
  selectedMode: ModeId | null;
  onSelect: (mode: ModeId) => void;
  detailed?: boolean;
};

export function ModeCards({ selectedMode, onSelect, detailed = false }: Props) {
  return (
    <div className={`mode-grid ${detailed ? "mode-grid--detailed" : ""}`}>
      {(Object.keys(modeDetails) as ModeId[]).map((id) => {
        const mode = modeDetails[id];
        const Icon = modeIcons[id];
        return (
          <button
            type="button"
            key={id}
            className={`mode-card ${selectedMode === id ? "is-selected" : ""}`}
            onClick={() => onSelect(id)}
            aria-pressed={selectedMode === id}
          >
            <span className="mode-card__icon"><Icon size={21} strokeWidth={1.45} aria-hidden="true" /></span>
            <span className="mode-card__copy">
              <strong>{mode.name}</strong>
              {detailed && <small>{mode.description}</small>}
            </span>
            {detailed && (
              <span className="mode-card__progress">
                <span>{mode.completed} rounds</span>
                <span className="mini-progress"><span style={{ width: `${mode.progress}%` }} /></span>
                <span>{mode.progress}%</span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

