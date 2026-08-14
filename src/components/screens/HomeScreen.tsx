"use client";

import { ArrowRight, Rotate3D } from "lucide-react";
import { EpochGlobe } from "@/src/components/globe/EpochGlobe";
import { ModeCards } from "@/src/components/ModeCards";
import { getRegion, regions } from "@/src/data/mockData";
import type { ModeId, RegionId } from "@/src/types";

type Props = {
  selectedRegion: RegionId | null;
  selectedMode: ModeId | null;
  onRegionSelect: (region: RegionId) => void;
  onModeSelect: (mode: ModeId) => void;
  onContinue: () => void;
};

export function HomeScreen({ selectedRegion, selectedMode, onRegionSelect, onModeSelect, onContinue }: Props) {
  const region = getRegion(selectedRegion);

  return (
    <div className="screen home-screen page-enter">
      <section className="home-hero">
        <div className="home-hero__masthead">
          <span className="eyebrow">The world, in context</span>
          <span className="issue-line">Curated global history · 2026</span>
        </div>
        <EpochGlobe selectedRegion={selectedRegion} onSelect={onRegionSelect} />
        <div className="mobile-region-strip" aria-label="Choose a region">
          {regions.map((item) => (
            <button
              type="button"
              key={item.id}
              className={selectedRegion === item.id ? "is-selected" : ""}
              onClick={() => onRegionSelect(item.id)}
            >
              {item.name}
            </button>
          ))}
        </div>
      </section>

      <section className="home-intro">
        <div className="section-rule"><span>01</span><span>{region ? `Selected · ${region.name}` : "Begin your expedition"}</span></div>
        <div className="home-intro__copy">
          <div>
            <h1>{region ? `Explore ${region.name}` : "Select a region to begin"}</h1>
            <p>{region?.description ?? "Explore history across civilizations, conflicts, and timelines."}</p>
          </div>
          <div className="interaction-note">
            <Rotate3D size={19} strokeWidth={1.4} aria-hidden="true" />
            <span>The globe remembers your position as you explore.</span>
          </div>
        </div>

        <div className="mode-section">
          <div className="mode-section__heading">
            <span className="eyebrow">Choose a historical lens</span>
            {selectedRegion && selectedMode && (
              <button type="button" className="text-action" onClick={onContinue}>
                Continue to quiz setup <ArrowRight size={16} aria-hidden="true" />
              </button>
            )}
          </div>
          <ModeCards selectedMode={selectedMode} onSelect={onModeSelect} />
          {!selectedRegion && selectedMode && (
            <p className="selection-hint">Now choose a region on the globe to continue.</p>
          )}
        </div>
      </section>
    </div>
  );
}

