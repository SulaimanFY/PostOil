# 04 — Frontend architecture

The frontend is a static site. There is no bundler, no compile step,
no server-side rendering. It is plain HTML, CSS and ES modules, with
D3 v7 loaded from a CDN.

## Top-level layout

```
frontend/
├── index.html                 Single document, mounts the app shell
├── assets/
│   ├── css/styles.css         All styles (variables, layout, components)
│   └── js/
│       ├── main.js            Bootstrap, route registration
│       ├── router.js          Tiny hash router
│       ├── data.js            JSON loaders
│       ├── theme.js           Indicator metadata + country colours
│       ├── formatters.js      Number / unit / axis formatters
│       ├── insights.js        Country page interpretation cards (analysis text)
│       ├── qualitative-notes.js  Block D content per country
│       ├── pages/
│       │   ├── landing.js     #/
│       │   ├── overview.js    #/overview
│       │   ├── country.js     #/country/:slug (Blocks A through D)
│       │   └── methodology.js #/methodology
│       └── components/
│           ├── kpi-card.js
│           ├── line-chart.js
│           ├── scatter-chart.js
│           ├── directional-grid.js
│           └── gcc-map.js
├── data/                      Synced from project /data at run time
├── serve.py                   Local dev server (sync + http.server)
└── sync-data.sh
```

## Bootstrap

`index.html` mounts an app shell with a sticky header (Map / GCC
overview / Methodology), a `<main id="view">` that hosts the active
route, and a footer.

`main.js` imports each page renderer and registers it against a route:

```js
registerRoute("/", renderLanding);
registerRoute("/overview", renderOverview);
registerRoute("/country/:slug", renderCountry);
registerRoute("/methodology", renderMethodology);
```

## Router

`router.js` is a hash-based router so the site works on GitHub Pages
without server rewrites. The router calls `renderXXX({ params })`,
expects either a `string` or `{ html, onMount }`, swaps the inner HTML
of `#view`, and runs `onMount` after the new DOM is attached.

The active link in the header is derived from the current path so that
the navigation always reflects the route.

## Pages

### Landing — `pages/landing.js`

- Loads the GeoJSON and the GCC overview JSON in parallel.
- Renders the map, a CTA pair (open overview / methodology), and a
  legend.

### GCC overview — `pages/overview.js`

- Loads `data/gcc/overview.json` and `data/gcc/comparisons.json`.
- Renders the snapshot table, the cross-block scatters and the
  multi-line trajectories.
- Uses `insights.js` to pull the interpretation cards (overview-level,
  not country-level).

### Country page — `pages/country.js`

- Loads the country JSON and the comparisons JSON (for the multi-line
  panels and the directional grid).
- Sections:
  - hero with country flag-strip and lede
  - sticky table of contents (A / B / C / D)
  - country switcher pills (jump between GCC peers)
  - **A. Where is it now?** — calls `renderKpiGrid(...)` with
    `KPI_ORDER` (hydrocarbon GDP share first, then fuel exports,
    export concentration, tourism, GDP per capita, GDP, AI readiness,
    GII) and `blockAInsight` underneath.
  - **B. Where is it going?** — five themes from `BLOCK_B_LAYOUT`,
    each rendering its own group of charts and a
    `blockBThemeInsight`.
  - **C. How does it compare?** — multi-line panels driven by
    `BLOCK_C_MULTI`, plus a year-by-year directional grid + paginator
    + `directionalDashboardInsight`.
  - **D. Why?** — `blockDSection(slug)` reads
    `qualitative-notes.js` and renders strategy / sector focus / trade
    structure / constraint and risk cards with external source links.

### Methodology — `pages/methodology.js`

- Loads only `overview.json` (for the project question).
- Otherwise renders a fixed set of sections: data sources, hydrocarbon
  GDP share per country, variables and definitions, panel
  construction, data treatment choices, ranks, limitations, code &
  reproducibility, and a Block D source list.

## Components

### KPI card (`components/kpi-card.js`)

Reads an entry of the form
`{ value, year, period_label, source, source_url?, note, world_rank, is_fallback }`
and renders the value, a year (or `period_label`) tag, an optional
world-rank tag, and plain-text `source`. Some series still ship a
`source_url` for a clickable label, but the curated hydrocarbon KPI
does not so readers use the methodology page for citations.

### Line charts (`components/line-chart.js`)

`renderLineChart` is the country-level single-series chart with point
markers and tooltips. `renderMultiLineChart` is the GCC-wide variant
that highlights the active country and dims the rest. Both use D3
linear scales, smart year-bounded axes and country colours from
`theme.js`.

### Scatter (`components/scatter-chart.js`)

Two-axis scatter with country labels at the dots. Uses
`tickFormatterByIndicator` from `formatters.js` so each axis renders
percent / score / log10 nicely.

### Directional grid (`components/directional-grid.js`)

Fixed-width heatmap. Cells encode +1 (green), -1 (red), 0 (grey),
missing (light). The active country row is emphasised. The paginator
walks pairs of years (default 6 per page), so the full window stays
readable.

### GCC map (`components/gcc-map.js`)

Standalone D3 SVG fitted to the GCC GeoJSON. Country fills use a soft
tint of the brand colour at rest and the saturated colour on
hover/focus. The active country is pre-saturated. The map is
keyboard-accessible (`tabindex=0`, Enter/Space). The custom focus
styling is handled inside the component (no default browser outline,
because the colour change is the visual feedback).

## Theme and formatters

`theme.js` carries the country palette and the indicator metadata
(label, short label, unit, format type, lower-is-better).
`formatters.js` exposes `formatValueByIndicator`,
`tickFormatterByIndicator` and a couple of compact-money helpers.

If you add a new indicator to the panel, you add an entry to
`INDICATORS` (in `theme.js`) and the rest of the dashboard renders it
correctly.

## Data loading

Everything goes through `data.js`:

- `loadOverview()` → `data/gcc/overview.json`
- `loadComparisons()` → `data/gcc/comparisons.json`
- `loadCountry(slug)` → `data/countries/<slug>.json`
- `loadGeo()` → `data/gcc/gcc.geojson`

The fetches are cached so navigating back and forth does not hit the
network repeatedly.

## Insights and qualitative notes

`insights.js` is the layer that turns the panel into prose. Every
country page renders four insight blocks pulled from this file (Block
A, Block B per theme, Block C, directional dashboard). The text is
deterministic, generated from the values themselves so it stays in
sync when the panel is rebuilt.

`qualitative-notes.js` is the curated narrative for Block D. It is
maintained by hand and changes only when the underlying source
(IMF Article IV, government strategy page) is updated.

## Responsive behaviour

`styles.css` carries three responsive blocks:

- `<= 1024 px` (tablet): tighter padding, two-column qualitative grid,
  scrollable country TOC.
- `<= 720 px` (phone): single-column grids, larger touch targets,
  sticky country column on the snapshot table, smaller map height.
- `<= 380 px` (very narrow phones): smaller hero, compact KPI values,
  shorter map.

Charts use D3 `viewBox` so they scale with their container. The site
is usable down to roughly 320 px wide.
