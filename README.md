# Epoch

Epoch is a production-oriented globe-centered geography and history quiz. A real MapLibre/WebGL globe is backed by imported Natural Earth 1:10m data, while Next.js route handlers deliver geography, countries, quizzes, leaders, alerts, and progress.

## What it does

- Upright, draggable MapLibre globe with 257 selectable countries
- Imported Natural Earth 1:10m countries, rivers, lakes, and populated places
- Progressive country, capital, city, river, and lake detail by zoom level
- Flags, countries, capitals, leaders, and state-description quiz modes
- Choice-based or globe-based answers with immediate feedback
- Persistent local progress and a cached Wikimedia/Wikidata leader archive
- Health and geography APIs under `/api/v1`

## Architecture

The application uses the standard Next.js App Router and React with TypeScript. A repeatable import script downloads and converts official Natural Earth shapefiles to GeoJSON. Next.js serves that generated dataset and deterministic country quizzes locally; leader biographies and live alerts are fetched through server-side providers with persistent caching.

```text
Natural Earth -> import script -> GeoJSON API -> TanStack Query -> MapLibre WebGL globe
```

![c](/c.png)

Country pages keep the map and intelligence profile connected, with the selected state highlighted and its source-backed context alongside it.

## Technology stack

| Layer | Technology | Role in Epoch |
| --- | --- | --- |
| Web application | Next.js, React, TypeScript | App Router UI and server API routes |
| Globe | MapLibre GL JS, WebGL globe projection | Upright Earth, camera animation, zoom, hover, and selection |
| Geographic data | Natural Earth 1:10m, GeoJSON, shapefile | Accurate countries, rivers, lakes, cities, and labels |
| Client data | TanStack Query | Geography loading, caching, and error states |
| Quiz content | Natural Earth, Wikidata, Wikimedia | Country facts, flags, leaders, and portraits |
| Persistence | Server-side JSON store | API cache and quiz progress |

## Local development

Run `npm run geography:import` when the Natural Earth source needs to be refreshed, then start the application with `npm run dev`.

Validation commands:

```text
npm run geography:verify
npm run typecheck
npm run lint
npm run build
```
