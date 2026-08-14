"use client";

import { ArrowRight, Check, LibraryBig } from "lucide-react";
import { EpochGlobe } from "@/src/components/globe/EpochGlobe";
import { getRegion, modeDetails, regions } from "@/src/data/mockData";
import type { ModeId, RegionId } from "@/src/types";

type Props = {
  selectedRegion: RegionId | null;
  onRegionSelect: (region: RegionId) => void;
  onContinue: () => void;
};

export function RegionsScreen({ selectedRegion, onRegionSelect, onContinue }: Props) {
  const selected = getRegion(selectedRegion) ?? regions[0];

  return (
    <div className="screen regions-screen page-enter">
      <header className="screen-header">
        <div><span className="eyebrow">Geographic archive</span><h1>Regions of the world</h1></div>
        <p>Choose a region to reveal the histories, people, and turning points held in the local collection.</p>
      </header>

      <div className="regions-layout">
        <div className="regions-globe-panel">
          <EpochGlobe compact selectedRegion={selected.id} onSelect={onRegionSelect} />
        </div>

        <aside className="region-index" aria-label="Region index">
          <span className="eyebrow">Index</span>
          {regions.map((region, index) => (
            <button
              type="button"
              key={region.id}
              className={selected.id === region.id ? "is-selected" : ""}
              onClick={() => onRegionSelect(region.id)}
            >
              <span className="region-index__number">0{index + 1}</span>
              <span><strong>{region.name}</strong><small>{region.eyebrow}</small></span>
              {selected.id === region.id && <Check size={16} aria-hidden="true" />}
            </button>
          ))}
        </aside>
      </div>

      <section className="region-dossier">
        <div className="region-dossier__heading">
          <div><span className="eyebrow">Selected region</span><h2>{selected.name}</h2></div>
          <p>{selected.description}</p>
        </div>
        <div className="availability-grid">
          {(Object.keys(selected.availability) as ModeId[]).map((mode) => (
            <div key={mode}>
              <LibraryBig size={17} strokeWidth={1.4} aria-hidden="true" />
              <span>{modeDetails[mode].name}</span>
              <strong>{selected.availability[mode]}</strong>
            </div>
          ))}
        </div>
        <button type="button" className="primary-button" onClick={onContinue}>
          Explore {selected.name} <ArrowRight size={17} aria-hidden="true" />
        </button>
      </section>
    </div>
  );
}

