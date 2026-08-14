# Epoch

Epoch is a globe-centered history exploration and trivia platform built to make world leaders, empires, wars, and timelines explorable in one interface. The globe stays upright, progressively reveals detail by zoom level, and keeps quiz and history content in a clean panel instead of covering the map.

## What it does

- Rotatable MapLibre globe with selectable regions (Africa, Europe, Asia, Middle East, Americas, Oceania)
- Region highlighting with smooth camera fly-to transitions on selection
- Scale-aware Natural Earth country borders and continent boundaries
- Four history modes per region: Leaders, Empires, Wars, and Timeline
- Trivia quizzes with configurable difficulty and question count
- Multiple question formats: image identification, country identification, historical fact, war questions, and timeline ordering
- Per-question answer feedback with a short historical fact on both correct and incorrect answers
- Results tracking with accuracy, streaks, and mock XP
- Progress view across regions and modes

## Architecture

The application uses the Next.js App Router and React with TypeScript for the experience layer. MapLibre GL renders the globe and regional geography, with local state managing quiz flow, selected region, and progress. This phase runs entirely on local mock data, with no backend or external API calls.

```text
Next.js → React state → MapLibre GL → local mock data
```

## The system

The global view remains readable while highlighting the selected region and its available history content. At regional zoom, country borders and geographic detail become progressively denser, while the interface below the globe updates to reflect the active region and mode.

## Technology stack

| Layer | Technology | Role in Epoch |
| --- | --- | --- |
| Web application | Next.js, React, TypeScript | Client rendering, routing, layouts, and the interactive history experience |
| Interface | Tailwind CSS | Responsive visual system, navigation, cards, and quiz UI |
| Globe and maps | MapLibre GL JS, WebGL globe projection | Upright rotatable 3D Earth, camera animation, zoom, and region picking |
| Globe atmosphere | MapLibre atmosphere and fog rendering | Horizon depth, atmospheric color, and a readable globe silhouette |
| Geographic layers | GeoJSON, TopoJSON, Natural Earth, world-atlas | Countries, borders, and region boundaries |
| Map interaction | MapLibre feature queries and camera controls | Region selection, highlighting, hover previews, and animated fly-to navigation |
| Client state | Local React state | Selected region, active mode, quiz progress, and results |
| Mock data | Local TypeScript data files | Regions, historical people, and quiz questions |

> [!NOTE]
> Epoch was created as a hands-on project for learning NestJS, OpenAPI/Swagger, interactive WebGL globe interfaces, region-based navigation, and quiz application architecture in Next.js and React.
