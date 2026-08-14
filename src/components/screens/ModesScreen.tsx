"use client";

import { ArrowRight } from "lucide-react";
import { ModeCards } from "@/src/components/ModeCards";
import type { ModeId } from "@/src/types";

type Props = {
  selectedMode: ModeId | null;
  hasRegion: boolean;
  onModeSelect: (mode: ModeId) => void;
  onContinue: () => void;
};

export function ModesScreen({ selectedMode, hasRegion, onModeSelect, onContinue }: Props) {
  return (
    <div className="screen modes-screen page-enter">
      <header className="screen-header screen-header--split">
        <div><span className="eyebrow">Four ways to explore</span><h1>Historical modes</h1></div>
        <p>Each lens changes the questions you encounter while keeping geography at the center of the experience.</p>
      </header>
      <div className="mode-ledger-heading"><span>Collection</span><span>Your completion</span></div>
      <ModeCards detailed selectedMode={selectedMode} onSelect={onModeSelect} />
      <div className="modes-footer">
        <p>{hasRegion ? "Your selected region will carry into quiz setup." : "Choose a mode, then select a region to begin."}</p>
        {selectedMode && (
          <button type="button" className="primary-button" onClick={onContinue}>
            {hasRegion ? "Continue to setup" : "Choose a region"} <ArrowRight size={17} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

