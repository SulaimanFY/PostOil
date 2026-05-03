# 06 — Local development and deployment

## Environment

I use Python 3.12. A virtualenv lives at `.venv/` for reference, but
any modern Python install works. The build script depends on
`pandas` and `numpy`. The notebook side adds `jupyter`, `notebook` and
`matplotlib` if you want the inline plots from `notebooks/main.ipynb`.

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -U pandas numpy jupyter
```

The frontend has no Node tooling. It loads D3 v7 from
`cdn.jsdelivr.net` at runtime.

## Local development

### Quick path

```bash
python frontend/serve.py
```

This script syncs `data/` into `frontend/data/` (so relative `fetch`
calls work the same locally and on Pages) and starts a quiet
`http.server` on port 8000. Open <http://localhost:8000>.

### Manual path

```bash
bash frontend/sync-data.sh
cd frontend
python -m http.server 8000
```

### After changing data sources

1. Edit `notebooks/main.ipynb` (and `notebooks/add_tourism.ipynb` for
   the tourism cleanup). Re-run all cells so
   `datasets/merged_dataset.csv` is rewritten.
2. Run `python scripts/build_frontend_data.py` to regenerate the JSON
   under `data/`.
3. Run `python frontend/serve.py` (or re-run `frontend/sync-data.sh`)
   so `frontend/data/` is in sync.

### After changing the curated `HYDROCARBON_GDP_SHARE`

Only step 2 is required. The script writes the new values into
`data/countries/*.json` and `data/gcc/overview.json`.

## Linting and JS sanity

There is no formal lint pipeline. ESLint or Biome can be added if
needed, but the codebase is small enough that I rely on:

- The IDE diagnostics that ship with VS Code / Cursor.
- A quick `python frontend/serve.py` and a manual click-through.

## Browsers

The site is tested on recent Chromium and Firefox. It uses ES modules
(`<script type="module">`), `fetch`, `URL`, `IntersectionObserver`,
and CSS variables. No polyfills are bundled.

## Deployment (GitHub Pages)

The workflow `.github/workflows/deploy.yml` deploys on every push to
`main`. It:

1. Stages the site under `_site/` by copying `frontend/` to the root.
2. Copies `data/` into `_site/data/` so relative paths match the local
   layout.
3. Touches `_site/.nojekyll` to keep the static files unprocessed.
4. Calls `actions/deploy-pages` to publish.

The repo Settings → Pages must point at the workflow output (already
the case in the source repo). The first push triggers the deployment;
subsequent pushes update the live site.

## Troubleshooting

### "Map data unavailable"

The `gcc-map.js` component needs `data/gcc/gcc.geojson`. If the file
is missing, run `python scripts/build_frontend_data.py` (the build
copies the GeoJSON it expects to find at `data/gcc/`). If the project
copy moved, regenerate it from `notebooks/build_gcc_geojson.ipynb`.

### KPIs show "N/A"

Two common causes:

- The KPI is not in `block_a_kpis` in the country JSON. That happens
  when the underlying series has no value in the latest 2015-2025
  window.
- The series itself stops earlier than expected. Tourism series end
  in 2020 for several countries in this WDI release.

Both cases are visible directly in the JSON. Open
`data/countries/<slug>.json` and inspect `block_a_kpis`.

### A new indicator does not show on the dashboard

You need to register it in three places:

1. `theme.js` — `INDICATORS` entry with label, unit, format,
   `lower_is_better` if relevant.
2. `pages/country.js` — `KPI_ORDER` for Block A, and
   `BLOCK_B_LAYOUT` if you want a chart on the country page.
3. `pages/overview.js` — `HEADLINE_COLS` for the snapshot table, and
   `comparisons.json` content for any cross-block scatter.

The build script also needs to expose the new column under
`block_a_kpis` and `block_b_series` (`COUNTRY_SERIES_COLS`).

### The map shows a black focus rectangle when I click a country

This used to happen because the SVG path elements have `tabindex=0`
and the browser draws an outline on focus. The fix is in
`assets/css/styles.css`:

```css
.map-country,
.map-country:focus,
.map-country:focus-visible,
.map-country:active,
.map-svg:focus,
.map-svg:focus-within {
  outline: none;
}
```

Visual feedback is fully handled by the fill / stroke updates in the
component.
