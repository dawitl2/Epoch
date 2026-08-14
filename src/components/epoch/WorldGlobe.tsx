"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource, Map as MapLibreMap, MapMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { feature } from "topojson-client";
import countriesTopology from "world-atlas/countries-50m.json";
import { GlobeControls } from "@/src/components/epoch/GlobeControls";
import { GlobeTooltip } from "@/src/components/epoch/GlobeTooltip";
import type { CountryRecord, GeographyAlert } from "@/src/lib/contracts";
import { ALERT_LAYERS, COUNTRY_LAYERS, MAP_IDS, PROGRESSIVE_LABELS } from "@/src/lib/mapLayers";

const HOME_CAMERA = { center: [8, 18] as [number, number], zoom: 1.05, pitch: 0, bearing: 0 };

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
        properties: { ...item.properties, numeric: String(item.id).padStart(3, "0") },
      })),
  } as GeoJSON.FeatureCollection;
}

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

function safePaint(map: MapLibreMap, layer: string, property: string, value: unknown) {
  if (!map.getLayer(layer)) return;
  try { map.setPaintProperty(layer, property as never, value as never); } catch { /* Optional basemap styling. */ }
}

function clearHover(map: MapLibreMap, hoveredId: string | number | null) {
  if (hoveredId !== null && map.getSource(MAP_IDS.countriesSource)) {
    map.setFeatureState({ source: MAP_IDS.countriesSource, id: hoveredId }, { hover: false });
  }
}

export function WorldGlobe({
  countries,
  alerts = [],
  selectedCode,
  selectedAlertId = null,
  onCountrySelect,
  onAlertSelect,
  className = "",
  flyToSelection = true,
}: WorldGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const countriesRef = useRef(countries);
  const alertsRef = useRef(alerts);
  const onSelectRef = useRef(onCountrySelect);
  const onAlertRef = useRef(onAlertSelect);
  const hoveredIdRef = useRef<string | number | null>(null);
  const hoveredCodeRef = useRef<string | null>(null);
  const selectedIdRef = useRef<string | number | null>(null);
  const selectedAlertRef = useRef<string | number | null>(null);
  const interactionRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const [ready, setReady] = useState(false);
  const [hovered, setHovered] = useState<CountryRecord | null>(null);
  const geometry = useMemo(() => countryGeometry(), []);

  useEffect(() => { countriesRef.current = countries; }, [countries]);
  useEffect(() => { alertsRef.current = alerts; }, [alerts]);
  useEffect(() => { onSelectRef.current = onCountrySelect; }, [onCountrySelect]);
  useEffect(() => { onAlertRef.current = onAlertSelect; }, [onAlertSelect]);

  const zoomIn = () => mapRef.current?.zoomIn({ duration: 420 });
  const zoomOut = () => mapRef.current?.zoomOut({ duration: 420 });
  const reset = () => {
    interactionRef.current = true;
    mapRef.current?.flyTo({ ...HOME_CAMERA, duration: 1250, essential: true });
  };
  const orientNorth = () => {
    interactionRef.current = true;
    mapRef.current?.easeTo({ bearing: 0, pitch: 0, duration: 650, essential: true });
  };

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      ...HOME_CAMERA,
      minZoom: 0.65,
      maxZoom: 12,
      maxPitch: 35,
      renderWorldCopies: false,
      attributionControl: false,
      cooperativeGestures: false,
      dragRotate: true,
      touchPitch: false,
      keyboard: true,
    });
    mapRef.current = map;
    map.getCanvas().setAttribute("aria-label", "Interactive three-dimensional globe. Use arrow keys to rotate and plus or minus to zoom.");

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
      } catch { /* Globe projection remains available without sky rendering. */ }

      const retainedLabels = new Set(PROGRESSIVE_LABELS.map((item) => item.id));
      for (const layer of [...(map.getStyle().layers ?? [])]) {
        if (layer.type === "symbol" && !retainedLabels.has(layer.id as typeof PROGRESSIVE_LABELS[number]["id"])) map.removeLayer(layer.id);
      }
      for (const label of PROGRESSIVE_LABELS) {
        if (!map.getLayer(label.id)) continue;
        map.setLayerZoomRange(label.id, label.minZoom, label.maxZoom);
        safePaint(map, label.id, "text-color", "#1c2830");
        safePaint(map, label.id, "text-halo-color", "rgba(251,250,246,.92)");
        safePaint(map, label.id, "text-halo-width", 1.25);
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

      map.addSource("epoch-terrain", { type: "raster-dem", url: "https://tiles.mapterhorn.com/tilejson.json", tileSize: 512 });
      map.addSource("epoch-hillshade-source", { type: "raster-dem", url: "https://tiles.mapterhorn.com/tilejson.json", tileSize: 512 });
      const firstLabel = PROGRESSIVE_LABELS.find((label) => map.getLayer(label.id))?.id;
      map.addLayer({
        id: "epoch-hillshade",
        type: "hillshade",
        source: "epoch-hillshade-source",
        paint: {
          "hillshade-method": "standard",
          "hillshade-shadow-color": "#52615f",
          "hillshade-highlight-color": "#fffdf6",
          "hillshade-accent-color": "#7d8c87",
          "hillshade-exaggeration": 0.24,
        },
      }, firstLabel);
      try { map.setTerrain({ source: "epoch-terrain", exaggeration: 0.48 }); } catch { /* WebGL fallback. */ }

      map.addSource(MAP_IDS.countriesSource, { type: "geojson", data: geometry });
      for (const layer of COUNTRY_LAYERS) map.addLayer(layer, firstLabel);

      map.addSource(MAP_IDS.alertsSource, {
        type: "geojson",
        data: alertGeometry(alertsRef.current),
        cluster: true,
        clusterMaxZoom: 6,
        clusterRadius: 44,
      });
      for (const layer of ALERT_LAYERS) map.addLayer(layer);
      setReady(true);

      let previousTime = performance.now();
      let previousPulseTime = 0;
      const animate = (time: number) => {
        const elapsed = Math.min(time - previousTime, 40);
        if (!interactionRef.current) {
          const center = map.getCenter();
          map.setCenter([center.lng - elapsed * 0.00072, center.lat]);
        }
        if (time - previousPulseTime > 50 && map.getLayer(MAP_IDS.alertHalo)) {
          const phase = (Math.sin(time / 420) + 1) / 2;
          map.setPaintProperty(MAP_IDS.alertHalo, "circle-radius", 10 + phase * 7);
          map.setPaintProperty(MAP_IDS.alertHalo, "circle-opacity", 0.32 - phase * 0.22);
          previousPulseTime = time;
        }
        previousTime = time;
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      animationFrameRef.current = requestAnimationFrame(animate);
    });

    const countryAtPoint = (event: MapMouseEvent) => {
      if (!map.getLayer(MAP_IDS.countryFill)) return null;
      const hit = map.queryRenderedFeatures(event.point, { layers: [MAP_IDS.countryFill] })[0];
      const numeric = String(hit?.properties?.numeric ?? "").padStart(3, "0");
      return { featureId: hit?.id ?? null, country: countriesRef.current.find((item) => item.numeric === numeric) ?? null };
    };

    map.on("mousemove", (event: MapMouseEvent) => {
      const alertHit = map.getLayer(MAP_IDS.alertPoints)
        ? map.queryRenderedFeatures(event.point, { layers: [MAP_IDS.alertPoints, MAP_IDS.alertClusters] })[0]
        : null;
      const result = alertHit ? null : countryAtPoint(event);
      if (hoveredIdRef.current !== null && hoveredIdRef.current !== result?.featureId) clearHover(map, hoveredIdRef.current);
      if (result?.featureId !== null && result?.featureId !== undefined && result.country) {
        hoveredIdRef.current = result.featureId;
        map.setFeatureState({ source: MAP_IDS.countriesSource, id: result.featureId }, { hover: true });
        map.getCanvas().style.cursor = "crosshair";
        if (hoveredCodeRef.current !== result.country.iso3) {
          hoveredCodeRef.current = result.country.iso3;
          setHovered(result.country);
        }
        if (tooltipRef.current) tooltipRef.current.style.transform = `translate(${event.point.x + 18}px, ${event.point.y + 18}px)`;
      } else {
        clearHover(map, hoveredIdRef.current);
        hoveredIdRef.current = null;
        hoveredCodeRef.current = null;
        map.getCanvas().style.cursor = alertHit ? "pointer" : "grab";
        setHovered(null);
      }
    });

    map.on("mouseout", () => {
      clearHover(map, hoveredIdRef.current);
      hoveredIdRef.current = null;
      hoveredCodeRef.current = null;
      setHovered(null);
    });

    map.on("click", async (event: MapMouseEvent) => {
      interactionRef.current = true;
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
        if (alert) {
          onAlertRef.current?.(alert);
          return;
        }
      }
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
    if (!map || !ready) return;
    const source = map.getSource(MAP_IDS.alertsSource) as GeoJSONSource | undefined;
    source?.setData(alertGeometry(alerts));
  }, [alerts, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !map.getSource(MAP_IDS.countriesSource)) return;
    if (selectedIdRef.current !== null) map.setFeatureState({ source: MAP_IDS.countriesSource, id: selectedIdRef.current }, { selected: false });
    const country = countries.find((item) => item.iso3 === selectedCode);
    if (!country) { selectedIdRef.current = null; return; }
    selectedIdRef.current = country.numeric;
    map.setFeatureState({ source: MAP_IDS.countriesSource, id: country.numeric }, { selected: true });
    if (flyToSelection && country.center) {
      interactionRef.current = true;
      map.flyTo({ center: country.center, zoom: 3.45, pitch: 8, bearing: 0, duration: 1250, essential: true });
    }
  }, [countries, flyToSelection, ready, selectedCode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !map.getSource(MAP_IDS.alertsSource)) return;
    const changed = selectedAlertRef.current !== selectedAlertId;
    if (selectedAlertRef.current !== null) map.setFeatureState({ source: MAP_IDS.alertsSource, id: selectedAlertRef.current }, { selected: false });
    selectedAlertRef.current = selectedAlertId;
    if (selectedAlertId) {
      map.setFeatureState({ source: MAP_IDS.alertsSource, id: selectedAlertId }, { selected: true });
      const alert = alerts.find((item) => item.id === selectedAlertId);
      if (changed && alert) {
        interactionRef.current = true;
        map.flyTo({ center: [alert.longitude, alert.latitude], zoom: 5.3, pitch: 8, bearing: 0, duration: 1150, essential: true });
      }
    }
  }, [alerts, ready, selectedAlertId]);

  return (
    <div className={`world-globe ${className}`}>
      <div ref={containerRef} className="world-globe__map" />
      <div className={`world-globe__loader ${ready ? "is-hidden" : ""}`} role="status">
        <span className="loader-orbit" />
        <strong>Building the world</strong>
        <small>Terrain · borders · political geography</small>
      </div>
      <div className="world-globe__hud world-globe__hud--top">
        <span>3D / LIVE</span><span>{alerts.length} alerts</span>
      </div>
      <div className="world-globe__hud world-globe__hud--bottom">
        <span>Drag to rotate</span><span>Scroll to zoom</span><span>Click geography</span>
      </div>
      <GlobeTooltip country={hovered} tooltipRef={tooltipRef} />
      <GlobeControls onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={reset} onNorth={orientNorth} />
      <div className="world-globe__credits">
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a>
        <a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a>
        <a href="https://earthquake.usgs.gov" target="_blank" rel="noreferrer">USGS</a>
      </div>
      <span className="world-globe__crosshair" aria-hidden="true" />
    </div>
  );
}
