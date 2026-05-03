# PostOil Frontend

Static dashboard that exposes the GCC post-oil transition narrative on
top of the JSON files produced by `scripts/build_frontend_data.py`.

## Stack

- Pure HTML and ES modules. No bundler, no build step.
- [D3 v7](https://d3js.org/) loaded from `cdn.jsdelivr.net` for the
  charts and the GCC map.
- A tiny hash-based router so the site works as-is on GitHub Pages.

## Running locally

From the project root:

```bash
python frontend/serve.py
```

The script syncs `data/` into `frontend/data/` and serves the site at
<http://localhost:8000>.

If you prefer to run the steps separately:

```bash
bash frontend/sync-data.sh
cd frontend && python -m http.server 8000
```

## Pages

| Route               | What it shows                                                                  |
| ------------------- | ------------------------------------------------------------------------------ |
| `#/`                | Landing page with the interactive GCC map.                                     |
| `#/overview`        | GCC overview, snapshot table, cross-block scatters, multi-line trajectories.   |
| `#/country/:slug`   | Country page, Blocks A through D.                                              |
| `#/methodology`     | Sources, variables, derivation rules, KPI rules and limitations.               |

Country slugs: `bahrain`, `kuwait`, `oman`, `qatar`, `saudi-arabia`,
`united-arab-emirates`.

## Updating data

When the underlying dataset changes:

```bash
# 1. Rebuild the JSON payloads
python scripts/build_frontend_data.py

# 2. Re-sync to the frontend (only needed for local serving)
bash frontend/sync-data.sh
```

The deploy workflow at `.github/workflows/deploy.yml` already syncs
`data/` at build time, so a `git push` is enough for production.

## Block D

Block D ("Why?") on each country page is curated from
`assets/js/qualitative-notes.js`. The four-note structure is the same
across countries (Strategy, Sector focus, Trade structure, Constraint
and risk). Each note links to the primary source.
