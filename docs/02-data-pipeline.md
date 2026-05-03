# 02 — Data pipeline

The pipeline has three layers: the raw downloads under `datasets/`, the
notebook that consolidates them into a single panel, and the build
script that turns the panel into the JSON the dashboard reads.

```
datasets/*.csv  ──►  notebooks/main.ipynb  ──►  datasets/merged_dataset.csv
                                                     │
                                                     ▼
                                       scripts/build_frontend_data.py
                                                     │
                                                     ▼
                              data/countries/*.json + data/gcc/*.json
                                                     │
                                                     ▼
                                            frontend/data/  (sync)
                                                     │
                                                     ▼
                                            #/, #/overview, #/country
```

## Layer 1 — Raw downloads (`datasets/`)

| File                                                              | Source                  | What it covers                                          |
| ----------------------------------------------------------------- | ----------------------- | ------------------------------------------------------- |
| `wdi_core.csv`, `databank.csv`, `P_Data_Extract...zip` | World Bank databank     | Macro, trade, sectoral value added, oil rents, GDP      |
| `marchandise_exports.csv`                                          | World Bank WDI          | Merchandise exports in current US$ (`TX.VAL.MRCH.CD.WT`) |
| `exports_concentration.csv`                                        | UNCTADStat              | Merchandise concentration index                          |
| `tourism.csv`                                                     | World Bank WDI          | Tourism receipts in USD and as a share of exports        |
| `ai_readiness.csv`                                                 | Oxford Insights         | AI readiness 2023, 2024 and 2025 pillars + headline     |
| `innovation.csv`                                                   | WIPO GII 2025           | Innovation index score and world rank                   |
| `WEO_Data.xls`                                                     | IMF WEO                 | Cross-checks during the analytical work in the notebook  |

The WDI exports come from the public databank tool with country and
year filters set to the six GCC economies and the windows documented
on the Methodology page. The full list of indicator codes lives inside
the notebook.

## Layer 2 — Analytical notebook (`notebooks/main.ipynb`)

The notebook is the source of truth for the panel. Its job is to:

1. Read each raw CSV, normalise country names and trim the year window.
2. Reshape every source to a long format with the keys
   `country` and `year`.
3. Outer-join the long tables on those keys. Missing values stay
   missing.
4. Derive the composite columns the dashboard relies on:
   - `tourism_pct_exports_eff` — see [03 — Indicators](./03-indicators.md#tourism)
   - `exports_imports_ratio` — `exports_usd / imports_usd`
   - `ai_readiness_unified` — Oxford 2023-24 headline (3-pillar mean)
     for those years and the mean of the six 2025 pillars for 2025
5. Run the analytical sections (`§3.1` to `§3.5`) that produce the
   reading the dashboard quotes (concentration vs AI, tourism vs AI,
   AI vs GII, lagged macro vs GII, year-by-year direction).
6. Persist `datasets/merged_dataset.csv` and a SQLite mirror at
   `datasets/postoil.db`.

The notebook is annotated section by section. I keep narrative cells
short so the structural choices are easy to find when I refresh the
data.

There is a smaller helper notebook, `notebooks/add_tourism.ipynb`,
which encapsulates the cleanup work for the tourism series before the
join. `notebooks/build_gcc_geojson.ipynb` is the one-off build for the
GCC GeoJSON the map uses.

## Layer 3 — Build script (`scripts/build_frontend_data.py`)

This script reads `datasets/merged_dataset.csv`, applies a small set
of presentation rules and writes the JSON consumed by the frontend.

### What it produces

- `data/countries/<slug>.json` — Block A KPIs (latest credible value
  per indicator), Block B time series, intra-GCC ranks and a
  directional summary used in Block C.
- `data/gcc/comparisons.json` — multi-country trajectories (one block
  per indicator) and the cross-block scatter datasets used on the
  GCC overview page.
- `data/gcc/overview.json` — snapshot table, headline indicators list,
  intra-GCC ranks, methodology pointers.

### Rules applied during the build

1. **Latest credible value.** For each Block A KPI the script picks the
   most recent year inside the 2015 to 2025 window. For
   `fuel_exports_pct`, it falls back to the previous credible year if
   the latest reading is below 10 % of the historical maximum. The
   substituted value carries `is_imputed_latest`, `raw_latest_value`,
   `raw_latest_year` and a note explaining the substitution.
2. **Series-level revision flags.** For Bahrain `fuel_exports_pct`
   only, near-zero readings before 2000 or after 2020 are flagged as
   revision artefacts (`is_revision_artefact`) so the line chart can
   break the trajectory at the last credible point.
3. **Hydrocarbon GDP share is curated.** The dictionary
   `HYDROCARBON_GDP_SHARE` carries the per-country value, year,
   period label, source and source URL. The script injects this entry
   into each `block_a_kpis.hydrocarbon_gdp_share` and into each row of
   the GCC overview snapshot. Nothing here is derived from the WDI
   panel.
4. **Intra-GCC ranks.** The function `_intra_gcc_ranks` builds a rank
   per indicator across the six countries. For
   `fuel_exports_pct`, `export_concentration`, `oil_rents_gdp` and
   `hydrocarbon_gdp_share` a lower value yields a better rank. For all
   other indicators a higher value yields a better rank.
5. **Year-by-year directional dashboard.** Five indicators
   (export concentration, fuel exports, manufacturing share, services
   share, tourism share) are compared year over year from 2000 to
   2024. A move that improves diversification scores +1, the opposite
   scores -1, identical values score 0, missing observations score
   missing. The matrix becomes a heatmap on each country page.

### Outputs as schemas

```jsonc
// data/countries/<slug>.json
{
  "country": { "name": "Saudi Arabia", "slug": "saudi-arabia", "iso_a3": "SAU" },
  "data_window": { "first_year": 1960, "last_year": 2024, "kpi_window": [2015, 2025] },
  "block_a_kpis": {
    "hydrocarbon_gdp_share": {
      "value": 19.4, "year": 2024, "period_label": "2024",
      "source": "GASTAT, Annual National Accounts 2024",
      "note": "Crude oil and natural gas activities, share of GDP (2024)."
    },
    "fuel_exports_pct": { "value": 79.4, "year": 2024, "source": "World Bank WDI" },
    "...": "...",
    "ai_readiness_unified": {
      "value": 74.8, "year": 2025,
      "source": "Oxford Insights AI Readiness",
      "world_rank": 15, "note": "Computed: mean of six 2025 pillars"
    }
  },
  "block_b_series": {
    "fuel_exports_pct": [{ "year": 1990, "value": 88.2 }, ...],
    "...": "..."
  },
  "intra_gcc_ranks": {
    "hydrocarbon_gdp_share": { "rank": 2, "value": 19.4, "year": 2024, "total": 6 },
    "...": "..."
  },
  "directional_summary": {
    "per_indicator": { "fuel_exports_pct": { "improved": 11, "deteriorated": 12, "flat": 0, "missing": 1 } },
    "totals": { "improved": 56, "deteriorated": 58, "flat": 1, "missing": 5 }
  }
}
```

```jsonc
// data/gcc/overview.json (snapshot row only)
{
  "country": "Bahrain", "slug": "bahrain", "iso_a3": "BHR",
  "hydrocarbon_gdp_share": {
    "value": 14.704, "year": 2024, "period_label": "2024",
    "source": "Kingdom of Bahrain, open data portal (constant prices)",
    "note": "Oil sector share of GDP at constant prices, 2024."
  },
  "fuel_exports_pct": { "value": 29.8, "year": 2020, "is_imputed_latest": true, "raw_latest_value": 0.0004, "raw_latest_year": 2024, "note": "..." },
  "...": "..."
}
```

The `note` field is surfaced as a tooltip on KPI cards and snapshot
cells. The `period_label` overrides the year display when present (used
where a quarterly period is more accurate than a single integer year).

### Order of operations in `main()`

1. Load the panel and apply the derivations (`load_panel`).
2. Build per-country payloads (Block A, Block B, sources, fallback
   logic).
3. Build the GCC comparisons file (multi-line series, scatter datasets,
   directional dashboard).
4. Build the GCC overview file (snapshots, intra-GCC ranks).
5. Inject intra-GCC ranks and directional summary into each country
   payload.
6. Write everything to disk under `data/`.

The script is idempotent. It can be re-run safely after any update.

## Layer 4 — Frontend sync (`frontend/serve.py`, `frontend/sync-data.sh`)

The site lives under `frontend/`. To make it run identically locally
and on GitHub Pages it expects to find `data/` at `./data/...` from
the site root. `frontend/serve.py` (and `frontend/sync-data.sh`) copy
project-level `data/` into `frontend/data/` before serving.

The deployment workflow `.github/workflows/deploy.yml` does the same
copy when building the GitHub Pages artifact.
