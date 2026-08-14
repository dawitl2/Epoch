"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap, MapMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { feature } from "topojson-client";
import worldTopology from "world-atlas/countries-110m.json";
import { LoaderCircle, MousePointer2 } from "lucide-react";
import { getRegion, regions } from "@/src/data/mockData";
import type { RegionId } from "@/src/types";

type CountryProperties = { name?: string; region?: RegionId };

type Props = {
  selectedRegion: RegionId | null;
  onSelect: (region: RegionId) => void;
  compact?: boolean;
};

const middleEast = new Set([
  "Israel", "Palestine", "Lebanon", "Jordan", "Syria", "Iraq", "Iran",
  "Saudi Arabia", "Yemen", "Oman", "United Arab Emirates", "Qatar", "Kuwait",
  "Turkey", "Cyprus", "N. Cyprus", "Armenia", "Azerbaijan", "Georgia",
]);

const oceania = new Set([
  "Australia", "New Zealand", "Papua New Guinea", "Fiji", "Solomon Is.",
  "Vanuatu", "New Caledonia",
]);

function flattenCoordinates(value: unknown, output: [number, number][] = []) {
  if (!Array.isArray(value)) return output;
  if (value.length === 2 && typeof value[0] === "number" && typeof value[1] === "number") {
    output.push(value as [number, number]);
    return output;
  }
  value.forEach((child) => flattenCoordinates(child, output));
  return output;
}

function classifyCountry(name: string, coordinates: unknown): RegionId {
  if (middleEast.has(name)) return "middle-east";
  if (oceania.has(name)) return "oceania";
  const points = flattenCoordinates(coordinates);
  const longitude = points.reduce((sum, point) => sum + point[0], 0) / Math.max(points.length, 1);
  const latitude = points.reduce((sum, point) => sum + point[1], 0) / Math.max(points.length, 1);
  if (longitude < -25) return "americas";
  if (latitude < -8 && longitude > 105) return "oceania";
  if (longitude > -22 && longitude < 55 && latitude < 38) return "africa";
  if (longitude < 45 && latitude >= 35) return "europe";
  return "asia";
}

function makeCountryData() {
  const topology = worldTopology as unknown as Parameters<typeof feature>[0];
  const countriesObject = (worldTopology as unknown as { objects: { countries: Parameters<typeof feature>[1] } }).objects.countries;
  const collection = feature(topology, countriesObject) as GeoJSON.FeatureCollection;
  const countryFeatures = collection.features
    .filter((item) => (item.properties as CountryProperties)?.name !== "Antarctica")
    .map((item) => {
      const name = (item.properties as CountryProperties)?.name ?? "Unknown";
      return {
        ...item,
        properties: { ...item.properties, name, region: classifyCountry(name, "coordinates" in item.geometry ? item.geometry.coordinates : []) },
      } as GeoJSON.Feature;
    });

  return { type: "FeatureCollection", features: countryFeatures } as GeoJSON.FeatureCollection;
}

export function EpochGlobe({ selectedRegion, onSelect, compact = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const onSelectRef = useRef(onSelect);
  const [loaded, setLoaded] = useState(false);
  const [hoveredRegion, setHoveredRegion] = useState<RegionId | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number } | null>(null);
  const countryData = useMemo(() => makeCountryData(), []);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {},
        layers: [{ id: "ocean", type: "background", paint: { "background-color": "#edf1f2" } }],
      },
      center: [12, 16],
      zoom: compact ? 0.72 : 0.92,
      minZoom: 0.45,
      maxZoom: 5.5,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
      cooperativeGestures: false,
      dragRotate: true,
      touchPitch: false,
      renderWorldCopies: false,
    });

    mapRef.current = map;

    map.on("load", () => {
      map.setProjection({ type: "globe" });
      try {
        map.setSky({
          "sky-color": "#f7f5f0",
          "horizon-color": "#e9eef0",
          "fog-color": "#eef2f3",
          "sky-horizon-blend": 0.55,
          "horizon-fog-blend": 0.45,
          "fog-ground-blend": 0.35,
        });
      } catch {
        // Older renderers can omit sky paint while retaining globe projection.
      }

      map.addSource("countries", { type: "geojson", data: countryData });
      map.addLayer({
        id: "countries-fill",
        type: "fill",
        source: "countries",
        paint: { "fill-color": "#f8f6ef", "fill-opacity": 1 },
      });
      map.addLayer({
        id: "countries-boundaries",
        type: "line",
        source: "countries",
        paint: {
          "line-color": "#23354b",
          "line-width": ["interpolate", ["linear"], ["zoom"], 0.5, 0.38, 2.5, 0.85, 5, 1.15],
          "line-opacity": ["interpolate", ["linear"], ["zoom"], 0.5, 0.5, 2.5, 0.72, 5, 0.85],
        },
      });
      map.addLayer({
        id: "region-hover",
        type: "fill",
        source: "countries",
        filter: ["==", ["get", "region"], ""],
        paint: { "fill-color": "#dfe9ec", "fill-opacity": 0.78 },
      });
      map.addLayer({
        id: "region-hover-outline",
        type: "line",
        source: "countries",
        filter: ["==", ["get", "region"], ""],
        paint: { "line-color": "#102a43", "line-width": 1.45, "line-opacity": 0.9 },
      });
      map.addLayer({
        id: "region-selected",
        type: "fill",
        source: "countries",
        filter: ["==", ["get", "region"], ""],
        paint: { "fill-color": "#c9dde3", "fill-opacity": 0.8 },
      });
      map.addLayer({
        id: "region-selected-outline",
        type: "line",
        source: "countries",
        filter: ["==", ["get", "region"], ""],
        paint: { "line-color": "#0c2945", "line-width": 1.7, "line-opacity": 1 },
      });

      setLoaded(true);
    });

    map.on("mousemove", (event: MapMouseEvent) => {
      if (!map.getLayer("countries-fill")) return;
      const hit = map.queryRenderedFeatures(event.point, { layers: ["countries-fill"] })[0];
      const region = hit?.properties?.region as RegionId | undefined;
      if (region) {
        map.getCanvas().style.cursor = "pointer";
        setHoveredRegion(region);
        setTooltip({ x: event.point.x, y: event.point.y });
        map.setFilter("region-hover", ["==", ["get", "region"], region]);
        map.setFilter("region-hover-outline", ["==", ["get", "region"], region]);
      } else {
        map.getCanvas().style.cursor = "grab";
        setHoveredRegion(null);
        setTooltip(null);
        map.setFilter("region-hover", ["==", ["get", "region"], ""]);
        map.setFilter("region-hover-outline", ["==", ["get", "region"], ""]);
      }
    });

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = "grab";
      setHoveredRegion(null);
      setTooltip(null);
      if (map.getLayer("region-hover")) {
        map.setFilter("region-hover", ["==", ["get", "region"], ""]);
        map.setFilter("region-hover-outline", ["==", ["get", "region"], ""]);
      }
    };
    map.getCanvasContainer().addEventListener("mouseleave", handleMouseLeave);

    map.on("click", (event: MapMouseEvent) => {
      if (!map.getLayer("countries-fill")) return;
      const hit = map.queryRenderedFeatures(event.point, { layers: ["countries-fill"] })[0];
      const region = hit?.properties?.region as RegionId | undefined;
      if (region) onSelectRef.current(region);
    });

    const observer = new ResizeObserver(() => map.resize());
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      map.getCanvasContainer().removeEventListener("mouseleave", handleMouseLeave);
      map.remove();
      mapRef.current = null;
    };
  }, [compact, countryData]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;
    const applySelection = () => {
      if (!map.isStyleLoaded() || !map.getLayer("region-selected") || !map.getLayer("region-selected-outline")) return;
      const filter = ["==", ["get", "region"], selectedRegion ?? ""] as maplibregl.FilterSpecification;
      map.setFilter("region-selected", filter);
      map.setFilter("region-selected-outline", filter);
      const region = getRegion(selectedRegion);
      if (region) map.flyTo({ center: region.center, zoom: region.zoom, duration: 1350, essential: true });
    };
    if (map.isStyleLoaded()) applySelection();
    else map.once("idle", applySelection);
    return () => { map.off("idle", applySelection); };
  }, [loaded, selectedRegion]);

  const chooseRegion = (id: RegionId) => onSelect(id);

  return (
    <div className={`globe-frame ${compact ? "globe-frame--compact" : ""}`}>
      <div className="globe-shadow" aria-hidden="true" />
      <div ref={containerRef} className="globe-map" aria-label="Interactive 3D globe. Drag to rotate and select a geographic region." />
      {!loaded && (
        <div className="globe-loading" role="status">
          <LoaderCircle size={18} aria-hidden="true" />
          <span>Preparing the world map</span>
        </div>
      )}
      {hoveredRegion && tooltip && (
        <div className="globe-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
          {getRegion(hoveredRegion)?.name}
        </div>
      )}
      {!compact && (
        <div className="floating-region-labels" aria-label="Region shortcuts">
          {regions.map((region) => (
            <button
              type="button"
              key={region.id}
              className={`floating-label floating-label--${region.id} ${selectedRegion === region.id ? "is-selected" : ""}`}
              onClick={() => chooseRegion(region.id)}
            >
              <span>{region.name}</span>
            </button>
          ))}
        </div>
      )}
      <div className="globe-instruction">
        <MousePointer2 size={15} aria-hidden="true" />
        <span>Drag to rotate · Scroll to zoom · Select a region</span>
      </div>
    </div>
  );
}
