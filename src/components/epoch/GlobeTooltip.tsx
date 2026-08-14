"use client";

import Image from "next/image";
import type { RefObject } from "react";
import type { CountryRecord } from "@/src/lib/contracts";

function mediaUrl(url: string | null) {
  return url ? `/api/media?url=${encodeURIComponent(url)}` : "";
}

export function GlobeTooltip({ country, tooltipRef }: { country: CountryRecord | null; tooltipRef: RefObject<HTMLDivElement | null> }) {
  return (
    <div ref={tooltipRef} className={`globe-tooltip ${country ? "is-visible" : ""}`} aria-hidden="true">
      <span className="globe-tooltip__flag">
        {country?.flagUrl ? <Image unoptimized fill sizes="38px" src={mediaUrl(country.flagUrl)} alt="" /> : country?.iso2}
      </span>
      <span><strong>{country?.name}</strong><small>{country?.iso3} · Select country</small></span>
    </div>
  );
}
