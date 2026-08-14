import type { LayerSpecification } from "maplibre-gl";

export const MAP_IDS = {
  countriesSource: "epoch-countries",
  countryFill: "epoch-country-fill",
  countryGlow: "epoch-country-glow",
  countryLines: "epoch-country-lines",
  alertsSource: "epoch-alerts",
  alertClusters: "epoch-alert-clusters",
  alertClusterCount: "epoch-alert-cluster-count",
  alertHalo: "epoch-alert-halo",
  alertPoints: "epoch-alert-points",
} as const;

export const COUNTRY_LAYERS: LayerSpecification[] = [
  {
    id: MAP_IDS.countryFill,
    type: "fill",
    source: MAP_IDS.countriesSource,
    paint: {
      "fill-color": ["case", ["boolean", ["feature-state", "selected"], false], "#315bff", ["boolean", ["feature-state", "hover"], false], "#ff7548", "#ffffff"],
      "fill-opacity": ["case", ["boolean", ["feature-state", "selected"], false], 0.38, ["boolean", ["feature-state", "hover"], false], 0.27, 0.035],
      "fill-opacity-transition": { duration: 260, delay: 0 },
    },
  },
  {
    id: MAP_IDS.countryGlow,
    type: "line",
    source: MAP_IDS.countriesSource,
    paint: {
      "line-color": "#315bff",
      "line-width": ["case", ["boolean", ["feature-state", "selected"], false], 7, 0],
      "line-opacity": ["case", ["boolean", ["feature-state", "selected"], false], 0.36, 0],
      "line-blur": 5,
    },
  },
  {
    id: MAP_IDS.countryLines,
    type: "line",
    source: MAP_IDS.countriesSource,
    paint: {
      "line-color": ["case", ["boolean", ["feature-state", "selected"], false], "#173fcf", ["boolean", ["feature-state", "hover"], false], "#d34a24", "#1b2938"],
      "line-width": ["interpolate", ["linear"], ["zoom"], 0.7, 0.48, 3, 0.85, 8, 1.5],
      "line-opacity": ["interpolate", ["linear"], ["zoom"], 0.7, 0.65, 4, 0.86, 8, 0.95],
    },
  },
];

export const ALERT_LAYERS: LayerSpecification[] = [
  {
    id: MAP_IDS.alertClusters,
    type: "circle",
    source: MAP_IDS.alertsSource,
    filter: ["has", "point_count"],
    paint: {
      "circle-color": ["step", ["get", "point_count"], "#ff7043", 10, "#e6512d", 30, "#b92f25"],
      "circle-radius": ["step", ["get", "point_count"], 14, 10, 18, 30, 23],
      "circle-stroke-color": "#fbfaf6",
      "circle-stroke-width": 2,
    },
  },
  {
    id: MAP_IDS.alertClusterCount,
    type: "symbol",
    source: MAP_IDS.alertsSource,
    filter: ["has", "point_count"],
    layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 10 },
    paint: { "text-color": "#ffffff" },
  },
  {
    id: MAP_IDS.alertHalo,
    type: "circle",
    source: MAP_IDS.alertsSource,
    filter: ["!", ["has", "point_count"]],
    paint: { "circle-color": "#ff7043", "circle-radius": 13, "circle-opacity": 0.25 },
  },
  {
    id: MAP_IDS.alertPoints,
    type: "circle",
    source: MAP_IDS.alertsSource,
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": ["interpolate", ["linear"], ["get", "magnitude"], 2.5, "#ff8b62", 5, "#dc482d", 7, "#941d1d"],
      "circle-radius": ["interpolate", ["linear"], ["get", "magnitude"], 2.5, 5, 5, 8, 7, 11],
      "circle-stroke-color": ["case", ["boolean", ["feature-state", "selected"], false], "#315bff", "#fbfaf6"],
      "circle-stroke-width": ["case", ["boolean", ["feature-state", "selected"], false], 4, 1.5],
    },
  },
];

export const PROGRESSIVE_LABELS = [
  { id: "label_country_1", minZoom: 1.7, maxZoom: 8 },
  { id: "label_country_2", minZoom: 1.7, maxZoom: 8 },
  { id: "label_country_3", minZoom: 2.2, maxZoom: 8 },
  { id: "label_city_capital", minZoom: 3.3, maxZoom: 24 },
  { id: "label_city", minZoom: 4.2, maxZoom: 24 },
] as const;
