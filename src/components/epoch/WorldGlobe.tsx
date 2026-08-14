"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap, MapMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { feature } from "topojson-client";
import countriesTopology from "world-atlas/countries-50m.json";
import type { CountryRecord } from "@/src/lib/contracts";

type Props = {
  countries: CountryRecord[];
  selectedCode: string | null;
  onCountrySelect: (country: CountryRecord) => void;
  className?: string;
  flyToSelection?: boolean;
};

function countryGeometry() {
  const topology = countriesTopology as unknown as Parameters<typeof feature>[0];
  const object = (countriesTopology as unknown as { objects: { countries: Parameters<typeof feature>[1] } }).objects.countries;
  const collection = feature(topology, object) as GeoJSON.FeatureCollection;
  return {
    type: "FeatureCollection",
    features: collection.features
      .filter((item) => item.id && (item.properties?.name as string) !== "Antarctica")
      .map((item) => ({
        ...item,
        id: String(item.id).padStart(3, "0"),
        properties: {
          ...item.properties,
          numeric: String(item.id).padStart(3, "0"),
        },
      })),
  } as GeoJSON.FeatureCollection;
}

function safePaint(map: MapLibreMap, layer: string, property: string, value: unknown) {
  if (!map.getLayer(layer)) return;
  try {
    map.setPaintProperty(layer, property as never, value as never);
  } catch {
    // The upstream basemap may change a layer type; nonessential styling can be skipped.
  }
}

export function WorldGlobe({ countries, selectedCode, onCountrySelect, className = "", flyToSelection = true }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const countriesRef = useRef(countries);
  const onSelectRef = useRef(onCountrySelect);
  const hoveredIdRef = useRef<string | number | null>(null);
  const selectedIdRef = useRef<string | number | null>(null);
  const interactionRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const [ready, setReady] = useState(false);
  const [hovered, setHovered] = useState<CountryRecord | null>(null);
  const geometry = useMemo(() => countryGeometry(), []);

  useEffect(() => { countriesRef.current = countries; }, [countries]);
  useEffect(() => { onSelectRef.current = onCountrySelect; }, [onCountrySelect]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [8, 18],
      zoom: 1.05,
      minZoom: 0.65,
      maxZoom: 12,
      maxPitch: 75,
      pitch: 0,
      bearing: 0,
      renderWorldCopies: false,
      attributionControl: false,
      cooperativeGestures: false,
      dragRotate: true,
      touchPitch: true,
    });
    mapRef.current = map;

    const stopAmbientMotion = () => { interactionRef.current = true; };
    map.getCanvasContainer().addEventListener("pointerdown", stopAmbientMotion);
    map.getCanvasContainer().addEventListener("wheel", stopAmbientMotion, { passive: true });

    map.once("style.load", () => {
      map.setProjection({ type: "globe" });
      try {
        map.setSky({
          "sky-color": "#f5f2ea",
          "horizon-color": "#d8e7ec",
          "fog-color": "#dbe8ec",
          "sky-horizon-blend": 0.72,
          "horizon-fog-blend": 0.56,
          "fog-ground-blend": 0.35,
          "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 0, 0.95, 5, 0.18],
        });
      } catch {
        // Globe projection remains available when sky rendering is unsupported.
      }

      for (const layer of [...(map.getStyle().layers ?? [])]) {
        if (layer.type === "symbol") map.removeLayer(layer.id);
      }

      safePaint(map, "background", "background-color", "#f4f1e9");
      safePaint(map, "natural_earth", "raster-opacity", 0.5);
      safePaint(map, "water", "fill-color", "#bed7e1");
      safePaint(map, "water", "fill-opacity", 0.9);
      safePaint(map, "park", "fill-color", "#dce4d3");
      safePaint(map, "landcover_wood", "fill-color", "#d5dfd0");
      safePaint(map, "landcover_grass", "fill-color", "#e1e6d5");
      safePaint(map, "landcover_sand", "fill-color", "#eadfc4");
      safePaint(map, "building", "fill-color", "#d6d1c8");

      if (!map.getSource("epoch-terrain")) {
        map.addSource("epoch-terrain", {
          type: "raster-dem",
          url: "https://tiles.mapterhorn.com/tilejson.json",
          tileSize: 512,
        });
        map.addLayer({
          id: "epoch-hillshade",
          type: "hillshade",
          source: "epoch-terrain",
          paint: {
            "hillshade-method": "standard",
            "hillshade-shadow-color": "#52615f",
            "hillshade-highlight-color": "#fffdf6",
            "hillshade-accent-color": "#7d8c87",
            "hillshade-exaggeration": 0.24,
          },
        });
        try { map.setTerrain({ source: "epoch-terrain", exaggeration: 0.55 }); } catch { /* WebGL fallback */ }
      }

      map.addSource("epoch-countries", { type: "geojson", data: geometry });
      map.addLayer({
        id: "epoch-country-fill",
        type: "fill",
        source: "epoch-countries",
        paint: {
          "fill-color": ["case", ["boolean", ["feature-state", "selected"], false], "#315bff", ["boolean", ["feature-state", "hover"], false], "#ff7548", "#ffffff"],
          "fill-opacity": ["case", ["boolean", ["feature-state", "selected"], false], 0.38, ["boolean", ["feature-state", "hover"], false], 0.27, 0.035],
          "fill-opacity-transition": { duration: 260, delay: 0 },
        },
      });
      map.addLayer({
        id: "epoch-country-lines",
        type: "line",
        source: "epoch-countries",
        paint: {
          "line-color": ["case", ["boolean", ["feature-state", "selected"], false], "#173fcf", ["boolean", ["feature-state", "hover"], false], "#d34a24", "#1b2938"],
          "line-width": ["interpolate", ["linear"], ["zoom"], 0.7, 0.48, 3, 0.85, 8, 1.5],
          "line-opacity": ["interpolate", ["linear"], ["zoom"], 0.7, 0.65, 4, 0.86, 8, 0.95],
        },
      });

      map.addControl(new maplibregl.NavigationControl({ showZoom: true, showCompass: true, visualizePitch: true }), "bottom-right");
      setReady(true);

      let previousTime = performance.now();
      const animate = (time: number) => {
        if (!interactionRef.current) {
          const elapsed = Math.min(time - previousTime, 40);
          const center = map.getCenter();
          map.setCenter([center.lng - elapsed * 0.0011, center.lat]);
        }
        previousTime = time;
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      animationFrameRef.current = requestAnimationFrame(animate);
    });

    const countryAtPoint = (event: MapMouseEvent) => {
      if (!map.getLayer("epoch-country-fill")) return null;
      const hit = map.queryRenderedFeatures(event.point, { layers: ["epoch-country-fill"] })[0];
      const numeric = String(hit?.properties?.numeric ?? "").padStart(3, "0");
      return {
        featureId: hit?.id ?? null,
        country: countriesRef.current.find((item) => item.numeric === numeric) ?? null,
      };
    };

    map.on("mousemove", (event: MapMouseEvent) => {
      const result = countryAtPoint(event);
      if (hoveredIdRef.current !== null && hoveredIdRef.current !== result?.featureId) {
        map.setFeatureState({ source: "epoch-countries", id: hoveredIdRef.current }, { hover: false });
      }
      if (result?.featureId !== null && result?.featureId !== undefined && result.country) {
        hoveredIdRef.current = result.featureId;
        map.setFeatureState({ source: "epoch-countries", id: result.featureId }, { hover: true });
        map.getCanvas().style.cursor = "crosshair";
        setHovered(result.country);
      } else {
        hoveredIdRef.current = null;
        map.getCanvas().style.cursor = "grab";
        setHovered(null);
      }
    });

    map.on("click", (event: MapMouseEvent) => {
      interactionRef.current = true;
      const result = countryAtPoint(event);
      if (result?.country) onSelectRef.current(result.country);
    });

    const observer = new ResizeObserver(() => map.resize());
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      map.getCanvasContainer().removeEventListener("pointerdown", stopAmbientMotion);
      map.getCanvasContainer().removeEventListener("wheel", stopAmbientMotion);
      if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
      map.remove();
      mapRef.current = null;
    };
  }, [geometry]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !map.getSource("epoch-countries")) return;
    if (selectedIdRef.current !== null) map.setFeatureState({ source: "epoch-countries", id: selectedIdRef.current }, { selected: false });
    const country = countries.find((item) => item.iso3 === selectedCode);
    if (!country) { selectedIdRef.current = null; return; }
    selectedIdRef.current = country.numeric;
    map.setFeatureState({ source: "epoch-countries", id: country.numeric }, { selected: true });
    if (flyToSelection && country.center) {
      interactionRef.current = true;
      map.flyTo({ center: country.center, zoom: 3.4, pitch: 14, duration: 1450, essential: true });
    }
  }, [countries, flyToSelection, ready, selectedCode]);

  return (
    <div className={`world-globe ${className}`}>
      <div ref={containerRef} className="world-globe__map" aria-label="Interactive three-dimensional globe. Rotate, zoom, and select a country." />
      <div className={`world-globe__loader ${ready ? "is-hidden" : ""}`} role="status">
        <span className="loader-orbit" />
        <strong>Building the world</strong>
        <small>Terrain · borders · political geography</small>
      </div>
      <div className="world-globe__hud world-globe__hud--top">
        <span>3D / LIVE</span>
        <span>{hovered ? hovered.name : "Move across the map"}</span>
      </div>
      <div className="world-globe__hud world-globe__hud--bottom">
        <span>Drag to rotate</span><span>Scroll to zoom</span><span>Click a country</span>
      </div>
      <span className="world-globe__crosshair" aria-hidden="true" />
    </div>
  );
}
