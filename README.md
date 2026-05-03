# PostOil — GCC Diversification Atlas

A descriptive, multi-source comparison of how the six GCC countries are
moving away from oil. The project frames the question through structural,
trade, capability and innovation indicators, and exposes the result both
as a Jupyter analytical notebook and as a static dashboard built on top
of public data.

> **Project question.** What differentiates GCC countries in their
> post-oil transition, and which factors are associated with stronger
> diversification outcomes?

The countries covered are Bahrain, Kuwait, Oman, Qatar, Saudi Arabia and
the United Arab Emirates.

---

## What the dashboard shows

The site is laid out around two entry points.

- **`#/`** — landing page with an interactive GCC map. Clicking any
  country opens its country page.
- **`#/overview`** — a full GCC overview: snapshot table of the latest
  values, cross-block scatter plots (concentration vs AI readiness,
  tourism vs AI, AI vs GII, lagged macro vs GII), and multi-line
  trajectories on fuel exports, export concentration, tourism share,
  exports-to-imports ratio, GDP and GDP per capita.
- **`#/country/<slug>`** — a per-country page with four blocks:
  - **A. Where is it now?** — the latest KPI cards, including the new
    hydrocarbon-sector share of GDP from national accounts (2024 across
    the six countries).
  - **B. Where is it going?** — five themed groups of trajectories
    (hydrocarbons, export structure, tourism, trade integration, and
    macro context), each with a written interpretation card.
  - **C. How does it compare to the GCC?** — multi-line panels and a
    year-by-year directional dashboard.
  - **D. Why?** — curated qualitative reading (national strategy,
    sector focus, trade structure, constraint and risk) with external
    links to the IMF, government strategy pages and World Bank WITS.
- **`#/methodology`** — every source, every variable, every derivation
  rule, and the limitations of the panel.

Country slugs: `bahrain`, `kuwait`, `oman`, `qatar`, `saudi-arabia`,
`united-arab-emirates`.

---

## Repository layout

```
PostOil/
├── data/                       JSON consumed by the frontend (built from datasets/)
│   ├── countries/<slug>.json   Country payload: Block A, Block B series, ranks
│   └── gcc/                    overview.json, comparisons.json, gcc.geojson
├── datasets/                   Raw source files and the harmonised panel
│   ├── ai_readiness.csv        Oxford Insights, 2023 / 2024 / 2025
│   ├── databank.csv            World Bank databank export
│   ├── exports_concentration.csv  UNCTAD merchandise concentration index
│   ├── innovation.csv          WIPO Global Innovation Index 2025
│   ├── marchandise_exports.csv  World Bank, merchandise exports in USD
│   ├── tourism.csv             World Bank, tourism receipts and arrivals
│   ├── wdi_core.csv            WDI macro core (GDP, trade, sectoral shares, etc.)
│   ├── merged_dataset.csv      The harmonised panel produced by the notebook
│   └── postoil.db              SQLite mirror of the harmonised panel
├── docs/                       Technical documentation (see docs/README.md)
├── frontend/                   Static site (no bundler, ES modules, D3 v7)
│   ├── index.html
│   ├── assets/
│   │   ├── css/styles.css
│   │   └── js/                 router, pages, components, theme, formatters
│   ├── data/                   Local copy of /data, refreshed by serve.py
│   ├── serve.py                Local development server
│   └── sync-data.sh            Copy /data to /frontend/data (used by serve.py)
├── notebooks/
│   ├── main.ipynb              Source of truth for the panel build
│   ├── add_tourism.ipynb       Tourism cleanup, joins and the effective-share rule
│   └── build_gcc_geojson.ipynb GCC GeoJSON used by the map
├── scripts/
│   └── build_frontend_data.py  Reads merged_dataset.csv, writes /data JSON
├── .github/workflows/deploy.yml GitHub Pages deployment
├── .gitignore
└── README.md                   This file
```

---

## Getting started

### Requirements

- Python 3.11 or later (3.12 is what I use). A virtualenv is included
  under `.venv/` for reference, but you can install the dependencies in
  your own environment.
- Pandas, NumPy and Jupyter for the notebook side. The build script only
  needs Pandas and NumPy.

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -U pandas numpy jupyter
```

### 1. Build the JSON for the frontend

```bash
python scripts/build_frontend_data.py
```

This reads `datasets/merged_dataset.csv`, applies the derivations
documented in `docs/`, and writes:

- `data/countries/<slug>.json` (one per country)
- `data/gcc/comparisons.json`
- `data/gcc/overview.json`

The hydrocarbon-sector share of GDP is curated from national accounts
inside the build script and not read from the WDI panel.

### 2. Run the dashboard locally

```bash
python frontend/serve.py
```

This syncs `data/` into `frontend/data/` (so relative `fetch` calls
work) and serves the site at <http://localhost:8000>.

If you want to run the steps separately:

```bash
bash frontend/sync-data.sh
cd frontend && python -m http.server 8000
```

### 3. Re-run the analytical notebook

```bash
jupyter lab notebooks/main.ipynb
```

The notebook produces a fresh `datasets/merged_dataset.csv` and is the
documented source of truth for the panel. Re-run
`scripts/build_frontend_data.py` afterwards to refresh the dashboard.

---

## Data sources

The full source list with editions and links lives on the Methodology
page of the dashboard. Short version:

- **World Bank, World Development Indicators** — macro structure, trade,
  tourism, GDP, GDP per capita, sectoral value added, exports and
  imports in USD, fuel exports as a share of merchandise.
- **World Bank, merchandise exports in USD** (`TX.VAL.MRCH.CD.WT`) —
  needed alongside `fuel_exports_pct` to recover a consistent
  fuel-share-of-GDP read for trade-hub economies.
- **UNCTAD merchandise concentration index** — Herfindahl-Hirschmann on
  export categories, 1995 onward.
- **Oxford Insights Government AI Readiness** — 2023, 2024 and 2025
  editions, with a unified score documented in the Methodology.
- **WIPO Global Innovation Index 2025** — composite score and world
  rank.
- **World Bank WITS** — country trade-partner profiles used in Block D.
- **National statistics offices** — hydrocarbon-sector share of GDP
  per country, 2024 vintage. Each value has its own source listed on the
  Methodology page.

---

## Hydrocarbon GDP share — at a glance (2024)

| Country               | Share of GDP | Source                                                      |
| --------------------- | -----------: | ----------------------------------------------------------- |
| Bahrain               |       14.7 % | Kingdom of Bahrain open data portal (constant prices)       |
| Saudi Arabia          |       19.4 % | GASTAT, Annual National Accounts 2024                       |
| United Arab Emirates  |       24.5 % | FCSC, implied from non-oil GDP share                        |
| Oman                  |       34.6 % | NCSI Oman, Monthly Statistical Bulletin                     |
| Qatar                 |       36.0 % | Qatar News Agency, National Statistics Center (full-year)   |
| Kuwait                |       43.4 % | Reuters, Kuwait acting finance minister, 2025-09-03         |

The values are the closest country-by-country measure of how much of
the economy is still produced by the hydrocarbon sector. The
classifications differ slightly between national statistics offices,
so the numbers are best read as a position inside the GCC, not as
strictly cross-country like-for-like figures.

---

## Hosting

The site is a static bundle. The included GitHub Actions workflow
(`.github/workflows/deploy.yml`) deploys `frontend/` plus `data/` to
GitHub Pages on every push to `main`, with `_site/.nojekyll` so the
build is served as-is.

If you fork it, point your Pages settings at the workflow output and
the dashboard will be live on your repository's Pages URL.

---

## Limitations

The dashboard is descriptive, with **n = 6** countries and mixed source
vintages. It is useful for contrasts, rankings and trajectories, not
for causal claims. The Methodology page documents the panel, the
derivations, the data-treatment choices and the limits in detail.

---

## License and credits

Built by **SulaimanFY**. The dashboard pulls from the World Bank,
UNCTAD, Oxford Insights, WIPO, the IMF and national statistics offices,
all of which are credited inline on the Methodology and Block D
sections.
