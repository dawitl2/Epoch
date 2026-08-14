"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource, Map as MapLibreMap, MapMouseEvent, StyleSpecification } from "maplibre-gl";
import { GlobeControls } from "@/src/components/epoch/GlobeControls";
import { GlobeTooltip } from "@/src/components/epoch/GlobeTooltip";
import type { CountryRecord, GeographyAlert, MapGeography } from "@/src/lib/contracts";
import { ALERT_LAYERS, MAP_IDS } from "@/src/lib/mapLayers";
import { fetchGeography } from "@/src/services/epochApi";

const HOME_CAMERA = { center: [8, 18] as [number, number], zoom: 1.05, pitch: 0, bearing: 0 };
const SELECTED_LAYER = "epoch-country-selected";
const HOVER_LAYER = "epoch-country-hover";

declare global {
  interface Window { __epochMap?: MapLibreMap }
}

const MAP_STYLE: StyleSpecification = {
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {},
  layers: [{ id: "ocean", type: "background", paint: { "background-color": "#b8d4df" } }],
};

export type WorldGlobeProps = {
  countries: CountryRecord[];
  alerts?: GeographyAlert[];
  selectedCode: string | null;
  selectedAlertId?: string | null;
  onCountrySelect: (country: CountryRecord) => void;
  onAlertSelect?: (alert: GeographyAlert) => void;
  className?: string;
  flyToSelection?: boolean;
};

function alertGeometry(alerts: GeographyAlert[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: alerts.map((alert) => ({
      type: "Feature",
      id: alert.id,
      geometry: { type: "Point", coordinates: [alert.longitude, alert.latitude] },
      properties: { id: alert.id, magnitude: alert.magnitude, significance: alert.significance },
    })),
  };
}

function countryLabelGeometry(geography: MapGeography): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: geography.countries.features.flatMap((feature) => {
      const properties = feature.properties as Record<string, unknown> | null;
      const longitude = Number(properties?.label_x);
      const latitude = Number(properties?.label_y);
      if (!Number.isFinite(longitude) || !Number.isFinite(latitude) || properties?.name_en === "Antarctica") return [];
      return [{ type: "Feature" as const, geometry: { type: "Point" as const, coordinates: [longitude, latitude] }, properties }];
    }),
  };
}

function addGeographyLayers(map: MapLibreMap, geography: MapGeography) {
  map.addSource(MAP_IDS.countriesSource, { type: "geojson", data: geography.countries, promoteId: "slug" });
  map.addLayer({
    id: MAP_IDS.countryFill, type: "fill", source: MAP_IDS.countriesSource,
    paint: { "fill-color": "#f4f0e5", "fill-opacity": 0.98 },
  });
  map.addLayer({
    id: HOVER_LAYER, type: "fill", source: MAP_IDS.countriesSource,
    paint: { "fill-color": "#ff7548", "fill-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 0.32, 0] },
  });
  map.addLayer({
    id: SELECTED_LAYER, type: "fill", source: MAP_IDS.countriesSource,
    filter: ["==", ["get", "iso3"], ""],
    paint: { "fill-color": "#315bff", "fill-opacity": 0.42 },
  });
  map.addLayer({
    id: MAP_IDS.countryLines, type: "line", source: MAP_IDS.countriesSource,
    paint: {
      "line-color": "#263846",
      "line-width": ["interpolate", ["linear"], ["zoom"], 0.5, 0.4, 4, 0.8, 8, 1.3],
      "line-opacity": 0.78,
    },
  });

  map.addSource("epoch-lakes", { type: "geojson", data: geography.lakes });
  map.addLayer({
    id: "epoch-lakes-major", type: "fill", source: "epoch-lakes", minzoom: 1.5,
    filter: ["<=", ["get", "scalerank"], 4], paint: { "fill-color": "#86b8cb", "fill-opacity": 0.95 },
  });
  map.addLayer({
    id: "epoch-lakes-regional", type: "fill", source: "epoch-lakes", minzoom: 3.5,
    filter: ["all", [">", ["get", "scalerank"], 4], ["<=", ["get", "scalerank"], 7]],
    paint: { "fill-color": "#86b8cb", "fill-opacity": 0.9 },
  });
  map.addLayer({
    id: "epoch-lakes-local", type: "fill", source: "epoch-lakes", minzoom: 5.5,
    filter: [">", ["get", "scalerank"], 7], paint: { "fill-color": "#86b8cb", "fill-opacity": 0.85 },
  });

  map.addSource("epoch-rivers", { type: "geojson", data: geography.rivers });
  map.addLayer({
    id: "epoch-rivers-major", type: "line", source: "epoch-rivers", minzoom: 2,
    filter: ["all", ["!=", ["get", "featurecla"], "Lake Centerline"], ["<=", ["get", "scalerank"], 4]],
    paint: { "line-color": "#5598b4", "line-width": ["interpolate", ["linear"], ["zoom"], 2, 0.35, 7, 1.4], "line-opacity": 0.82 },
  });
  map.addLayer({
    id: "epoch-rivers-regional", type: "line", source: "epoch-rivers", minzoom: 4,
    filter: ["all", ["!=", ["get", "featurecla"], "Lake Centerline"], [">", ["get", "scalerank"], 4], ["<=", ["get", "scalerank"], 7]],
    paint: { "line-color": "#5e9fb9", "line-width": 0.8, "line-opacity": 0.72 },
  });
  map.addLayer({
    id: "epoch-rivers-local", type: "line", source: "epoch-rivers", minzoom: 6,
    filter: ["all", ["!=", ["get", "featurecla"], "Lake Centerline"], [">", ["get", "scalerank"], 7]],
    paint: { "line-color": "#69a5bd", "line-width": 0.55, "line-opacity": 0.65 },
  });

  map.addSource("epoch-country-labels", { type: "geojson", data: countryLabelGeometry(geography) });
  map.addLayer({
    id: "epoch-country-labels", type: "symbol", source: "epoch-country-labels", minzoom: 1.65,
    layout: {
      "text-field": ["get", "name_en"], "text-font": ["Open Sans Semibold"],
      "text-size": ["interpolate", ["linear"], ["zoom"], 1.65, 9, 5, 14],
      "text-transform": "uppercase", "text-letter-spacing": 0.08, "text-allow-overlap": false,
    },
    paint: { "text-color": "#1c2830", "text-halo-color": "rgba(251,250,246,.92)", "text-halo-width": 1.2 },
  });

  map.addSource("epoch-cities", { type: "geojson", data: geography.cities });
  map.addLayer({
    id: "epoch-capitals", type: "circle", source: "epoch-cities", minzoom: 3,
    filter: ["==", ["get", "capital"], true],
    paint: { "circle-color": "#ff5e36", "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 2.3, 7, 4], "circle-stroke-color": "#fff", "circle-stroke-width": 1 },
  });
  map.addLayer({
    id: "epoch-city-points", type: "circle", source: "epoch-cities", minzoom: 5,
    filter: ["!=", ["get", "capital"], true],
    paint: { "circle-color": "#263846", "circle-radius": 1.8, "circle-opacity": 0.7 },
  });
  map.addLayer({
    id: "epoch-city-labels", type: "symbol", source: "epoch-cities", minzoom: 4,
    filter: ["any", ["==", ["get", "capital"], true], [">=", ["get", "population"], 1000000]],
    layout: {
      "text-field": ["get", "name_en"], "text-font": ["Open Sans Semibold"], "text-size": 10,
      "text-offset": [0, 0.8], "text-anchor": "top", "text-allow-overlap": false,
    },
    paint: { "text-color": "#263846", "text-halo-color": "#f4f0e5", "text-halo-width": 1 },
  });
}

function clearHover(map: MapLibreMap, hoveredId: string | number | null) {
  if (hoveredId !== null && map.getSource(MAP_IDS.countriesSource)) {
    map.setFeatureState({ source: MAP_IDS.countriesSource, id: hoveredId }, { hover: false });
  }
}

export function WorldGlobe({
  countries, alerts = [], selectedCode, selectedAlertId = null, onCountrySelect, onAlertSelect,
  className = "", flyToSelection = true,
}: WorldGlobeProps) {
  const { data: geography, error: geographyError } = useQuery({ queryKey: ["natural-earth-geography"], queryFn: ({ signal }) => fetchGeography(signal) });
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const countriesRef = useRef(countries);
  const alertsRef = useRef(alerts);
  const onSelectRef = useRef(onCountrySelect);
  const onAlertRef = useRef(onAlertSelect);
  const hoveredIdRef = useRef<string | number | null>(null);
  const selectedAlertRef = useRef<string | number | null>(null);
  const [ready, setReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [hovered, setHovered] = useState<CountryRecord | null>(null);

  useEffect(() => { countriesRef.current = countries; }, [countries]);
  useEffect(() => { alertsRef.current = alerts; }, [alerts]);
  useEffect(() => { onSelectRef.current = onCountrySelect; }, [onCountrySelect]);
  useEffect(() => { onAlertRef.current = onAlertSelect; }, [onAlertSelect]);

  const controls = useMemo(() => ({
    zoomIn: () => mapRef.current?.zoomIn({ duration: 420 }),
    zoomOut: () => mapRef.current?.zoomOut({ duration: 420 }),
    reset: () => mapRef.current?.easeTo({ ...HOME_CAMERA, duration: 1000, essential: true }),
    north: () => mapRef.current?.easeTo({ bearing: 0, pitch: 0, duration: 500, essential: true }),
  }), []);

  useEffect(() => {
    if (!containerRef.current || !geography || mapRef.current) return;
    setReady(false);
    setMapError(null);
    maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");
    const map = new maplibregl.Map({
      container: containerRef.current, style: MAP_STYLE, ...HOME_CAMERA, minZoom: 0.55, maxZoom: 8,
      attributionControl: false, dragRotate: false, pitchWithRotate: false, touchPitch: false,
      renderWorldCopies: false, cooperativeGestures: false, keyboard: true,
    });
    mapRef.current = map;
    window.__epochMap = map;
    map.touchZoomRotate.disableRotation();
    map.dragRotate.disable();
    map.getCanvas().setAttribute("aria-label", "Interactive three-dimensional globe. Drag to move around Earth, scroll to zoom, and click a country to select it.");

    map.once("style.load", () => {
      map.setProjection({ type: "globe" });
      try {
        map.setSky({
          "sky-color": "#edf0ed", "horizon-color": "#d8e7ec", "fog-color": "#dbe8ec",
          "sky-horizon-blend": 0.72, "horizon-fog-blend": 0.52, "fog-ground-blend": 0.28,
          "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 0, 0.9, 5, 0.16],
        });
      } catch { /* Atmosphere is optional; the WebGL globe remains functional. */ }
      addGeographyLayers(map, geography);
      map.addSource(MAP_IDS.alertsSource, { type: "geojson", data: alertGeometry(alertsRef.current), cluster: true, clusterMaxZoom: 6, clusterRadius: 44 });
      for (const layer of ALERT_LAYERS) map.addLayer(layer);
      map.once("idle", () => setReady(true));
    });
    map.on("error", (event) => {
      const message = event.error?.message;
      if (message) setMapError(message);
    });

    const countryAtPoint = (event: MapMouseEvent) => {
      if (!map.getLayer(MAP_IDS.countryFill)) return null;
      const hit = map.queryRenderedFeatures(event.point, { layers: [MAP_IDS.countryFill] })[0];
      const iso3 = String(hit?.properties?.iso3 ?? "");
      return { featureId: hit?.id ?? iso3, country: countriesRef.current.find((item) => item.iso3 === iso3) ?? null };
    };

    map.on("mousemove", (event: MapMouseEvent) => {
      const result = countryAtPoint(event);
      if (hoveredIdRef.current !== null && hoveredIdRef.current !== result?.featureId) clearHover(map, hoveredIdRef.current);
      if (result?.featureId && result.country) {
        hoveredIdRef.current = result.featureId;
        map.setFeatureState({ source: MAP_IDS.countriesSource, id: result.featureId }, { hover: true });
        map.getCanvas().style.cursor = "pointer";
        setHovered(result.country);
        if (tooltipRef.current) tooltipRef.current.style.transform = `translate(${event.point.x + 18}px, ${event.point.y + 18}px)`;
      } else {
        clearHover(map, hoveredIdRef.current);
        hoveredIdRef.current = null;
        map.getCanvas().style.cursor = "grab";
        setHovered(null);
      }
    });
    map.on("mouseout", () => {
      clearHover(map, hoveredIdRef.current);
      hoveredIdRef.current = null;
      setHovered(null);
    });
    map.on("click", async (event: MapMouseEvent) => {
      const alertHit = map.getLayer(MAP_IDS.alertPoints)
        ? map.queryRenderedFeatures(event.point, { layers: [MAP_IDS.alertPoints, MAP_IDS.alertClusters] })[0]
        : null;
      if (alertHit) {
        if (alertHit.properties?.cluster) {
          const source = map.getSource(MAP_IDS.alertsSource) as GeoJSONSource;
          const zoom = await source.getClusterExpansionZoom(Number(alertHit.properties.cluster_id));
          const point = alertHit.geometry as GeoJSON.Point;
          map.easeTo({ center: point.coordinates as [number, number], zoom: Math.min(zoom, 7), pitch: 0, bearing: 0, duration: 800 });
          return;
        }
        const alert = alertsRef.current.find((item) => item.id === String(alertHit.properties?.id));
        if (alert) { onAlertRef.current?.(alert); return; }
      }
      const result = countryAtPoint(event);
      if (result?.country) onSelectRef.current(result.country);
    });

    const observer = new ResizeObserver(() => map.resize());
    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      delete window.__epochMap;
    };
  }, [geography]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    (map.getSource(MAP_IDS.alertsSource) as GeoJSONSource | undefined)?.setData(alertGeometry(alerts));
  }, [alerts, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !map.getLayer(SELECTED_LAYER)) return;
    map.setFilter(SELECTED_LAYER, ["==", ["get", "iso3"], selectedCode ?? ""]);
    const country = countries.find((item) => item.iso3 === selectedCode);
    if (flyToSelection && country?.center) {
      map.easeTo({ center: country.center, zoom: 3.2, pitch: 0, bearing: 0, duration: 1200, essential: true });
    }
  }, [countries, flyToSelection, ready, selectedCode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !map.getSource(MAP_IDS.alertsSource)) return;
    if (selectedAlertRef.current !== null) map.setFeatureState({ source: MAP_IDS.alertsSource, id: selectedAlertRef.current }, { selected: false });
    selectedAlertRef.current = selectedAlertId;
    if (selectedAlertId) {
      map.setFeatureState({ source: MAP_IDS.alertsSource, id: selectedAlertId }, { selected: true });
      const alert = alerts.find((item) => item.id === selectedAlertId);
      if (alert) map.easeTo({ center: [alert.longitude, alert.latitude], zoom: 5.3, pitch: 0, bearing: 0, duration: 1100, essential: true });
    }
  }, [alerts, ready, selectedAlertId]);

  return (
    <div className={`world-globe ${className}`}>
      <div ref={containerRef} className="world-globe__map" data-map-ready={ready ? "true" : "false"} />
      <div className={`world-globe__loader ${ready ? "is-hidden" : ""}`} role="status">
        {!geographyError && !mapError && <span className="loader-orbit" />}
        <strong>{geographyError || mapError ? "Geography could not load" : "Building the world"}</strong>
        <small>{geographyError instanceof Error ? geographyError.message : mapError || "Natural Earth · borders · rivers · lakes · cities"}</small>
      </div>
      <div className="world-globe__hud world-globe__hud--top"><span>3D / LIVE</span><span>{alerts.length} alerts</span></div>
      <div className="world-globe__hud world-globe__hud--bottom"><span>Drag to rotate</span><span>Scroll to zoom</span><span>Click a country</span></div>
      <GlobeTooltip country={hovered} tooltipRef={tooltipRef} />
      <GlobeControls onZoomIn={controls.zoomIn} onZoomOut={controls.zoomOut} onReset={controls.reset} onNorth={controls.north} />
      <div className="world-globe__credits"><a href="https://www.naturalearthdata.com" target="_blank" rel="noreferrer">Natural Earth</a></div>
      <span className="world-globe__crosshair" aria-hidden="true" />
    </div>
  );
}
