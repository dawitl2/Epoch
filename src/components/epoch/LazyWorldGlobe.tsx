"use client";

import dynamic from "next/dynamic";
import type { WorldGlobeProps } from "@/src/components/epoch/WorldGlobe";

const DynamicWorldGlobe = dynamic(
  () => import("@/src/components/epoch/WorldGlobe").then((module) => module.WorldGlobe),
  {
    ssr: false,
    loading: () => (
      <div className="world-globe world-globe__loader-fallback" role="status">
        <span className="loader-orbit" /><strong>Loading WebGL globe</strong>
      </div>
    ),
  },
);

export function LazyWorldGlobe(props: WorldGlobeProps) {
  return <DynamicWorldGlobe {...props} />;
}
