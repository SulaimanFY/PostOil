# 03 — Indicators reference

Every indicator on the dashboard, with the column name in the panel,
the source, the unit, the rule used to pick the latest value, and any
known caveat.

## Hydrocarbon-sector share of GDP — `hydrocarbon_gdp_share`

- **What it measures.** Share of value added produced by hydrocarbon
  activities in total GDP, taken from each country's national-accounts
  release.
- **Source.** Curated per country inside
  `scripts/build_frontend_data.py` (`HYDROCARBON_GDP_SHARE`). The
  current values are 2024 readings from:
  - Saudi Arabia, GASTAT Annual National Accounts 2024
  - UAE, FCSC (implied as 100 minus the non-oil share of 75.5 %)
  - Qatar, Qatar News Agency / National Statistics Center, full-year
    2024 (implied as 100 minus the non-hydrocarbon share of nearly
    64 %)
  - Kuwait, public statement by the acting finance minister, 2024
    figure communicated in 2025
  - Oman, NCSI Monthly Statistical Bulletin
  - Bahrain, open data portal (constant prices)
- **Unit.** Percent of GDP (`format: "percent"`).
- **Lower is better** for diversification (so rank 1 = lowest value).
- **Caveat.** Classifications differ slightly between national
  statistics offices, so the values are best read as a position inside
  the GCC, not as a strict cross-country like-for-like comparison.

## Fuel exports as a share of merchandise — `fuel_exports_pct`

- **What it measures.** Share of fuel-classified products in total
  merchandise exports.
- **Source.** World Bank WDI (`TX.VAL.FUEL.ZS.UN`).
- **Unit.** Percent of merchandise exports.
- **Lower is better** for diversification.
- **KPI rule.** Latest credible value inside the 2015 to 2025 window,
  with a fallback when the latest reading drops below 10 % of the
  historical maximum (Bahrain has visible WDI revisions on this
  series).

## Oil rents as a share of GDP — `oil_rents_gdp`

- **What it measures.** Income from crude oil extraction net of
  extraction costs, expressed as a share of GDP.
- **Source.** World Bank WDI (`NY.GDP.PETR.RT.ZS`).
- **Unit.** Percent of GDP.
- **Lower is better** for diversification.
- **Caveat.** This is an extraction-only income lens. Refining,
  petrochemicals and distribution sit in other parts of the national
  accounts. It complements `fuel_exports_pct` and is not a substitute
  for the curated `hydrocarbon_gdp_share`.

## Export concentration — `export_concentration`

- **What it measures.** UNCTAD merchandise concentration index, a
  Herfindahl-Hirschmann value between 0 and 1 computed on export
  categories.
- **Source.** UNCTADStat.
- **Unit.** Index 0 to 1.
- **Lower is better** for diversification.

## Manufacturing value added — `manufacturing_gdp`

- **Source.** World Bank WDI (`NV.IND.MANF.ZS`).
- **Unit.** Percent of GDP.
- **Higher is better** for diversification.

## Services value added — `services_gdp`

- **Source.** World Bank WDI (`NV.SRV.TOTL.ZS`).
- **Unit.** Percent of GDP.
- **Higher is better** for diversification.

## Tourism

The dashboard exposes two views.

### Tourism receipts as a share of exports (effective) — `tourism_pct_exports_eff`

- **Definition.** Effective share, computed as:

  ```
  if WDI tourism_receipts_pct_exports is present:
      use it directly
  else:
      tourism_receipts_usd / exports_usd × 100
  ```

  The fallback is flagged in the panel
  (`tourism_pct_exports_eff_is_fallback`) and on KPI cards
  (`is_fallback: true`, source label switches to "World Bank WDI
  (derived)").
- **Unit.** Percent of total exports.
- **Higher is better** for diversification.

### Tourism receipts in USD — `tourism_receipts_usd`

- **Source.** World Bank WDI (`ST.INT.RCPT.CD`).
- **Unit.** USD, formatted compactly on the dashboard.

Both tourism series stop in 2020 for several GCC countries in this
WDI release.

## Trade

### Exports of goods and services — `exports_gdp`

- **Source.** World Bank WDI (`NE.EXP.GNFS.ZS`).
- **Unit.** Percent of GDP.

### Imports of goods and services — `imports_gdp`

- **Source.** World Bank WDI (`NE.IMP.GNFS.ZS`).
- **Unit.** Percent of GDP.

### Trade openness — `trade_openness_gdp`

- **Definition.** `exports_gdp + imports_gdp`.
- **Unit.** Percent of GDP. Values above 100 are normal for very open
  economies.

### Exports / imports ratio — `exports_imports_ratio`

- **Definition.** `exports_usd / imports_usd` (current US$).
- **Unit.** Ratio (1.0 marks balanced trade).
- **Lower is better** for diversification (in the sense that a move
  toward 1 from a high level is a diversification signal).

## Macro context

### GDP — `gdp`

- **Source.** World Bank WDI, current US$.

### GDP per capita — `gdp_per_capita`

- **Source.** World Bank WDI, current US$.

## Capability and innovation

### AI readiness, unified score — `ai_readiness_unified`

- **Source.** Oxford Insights Government AI Readiness, 2023, 2024 and
  2025 editions.
- **Definition.** For 2023 and 2024 the unified score is the published
  headline (mean of the legacy three pillars). For 2025 it is the mean
  of the six 2025 pillars.
- **World rank** is attached when published. KPI cards show it next to
  the value.
- **Unit.** Score on a 0 to 100 scale.

### Innovation index — `innovation_index`

- **Source.** WIPO Global Innovation Index 2025.
- **World rank** is attached.
- **Unit.** Score on a 0 to 100 scale.

## Why I do not show a derived "fuel × exports / GDP"

A naive multiplication like
`fuel_exports_pct × exports_gdp / 100` reads as
"hydrocarbon's share of GDP" but is not. The numerator is measured on
merchandise. The denominator (`exports_gdp`) is goods plus services as
a share of GDP. For trade-hub economies (UAE in particular, partly
Bahrain), the result can balloon for reasons unrelated to the
hydrocarbon sector.

The dashboard therefore uses the curated national-accounts share for
the Block A and overview view of "how much of the economy is the
hydrocarbon sector", and uses `oil_rents_gdp` for the long-run WDI
income lens on hydrocarbons.
