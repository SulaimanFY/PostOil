# 01 — Project overview

## What this project is

PostOil is a comparative read of post-oil transition across the six
GCC economies. I look at four lenses in parallel:

- **Structure of the economy.** Hydrocarbon-sector share of GDP
  (national accounts), oil rents as a share of GDP (WDI), fuel exports
  as a share of merchandise (WDI), services and manufacturing value
  added.
- **Trade.** Exports, imports and trade openness as shares of GDP, the
  exports-to-imports ratio, export concentration (UNCTAD).
- **Tourism.** Receipts in USD and as a share of total exports
  (effective share, with a documented derivation rule).
- **Capability and innovation.** Oxford Insights AI Readiness (2023,
  2024, 2025) and the WIPO Global Innovation Index 2025.

The same six countries appear on every chart. The same indicator
definitions are used everywhere on the dashboard.

## The question

> What differentiates GCC countries in their post-oil transition, and
> which factors are associated with stronger diversification outcomes?

## Audience

The dashboard is a one-stop, descriptive view that I want to share with
people who follow the GCC economies but do not necessarily run their
own panel build. Everything is annotated with sources and years. The
Methodology page is the contract with the reader: every variable, every
derivation, every limit is listed.

## What I deliberately do NOT do

- I do not run causal models or regressions on n = 6 countries.
- I do not publish a single "transition score" that combines oil,
  tourism, capability and trade. Those composites tend to imply a
  ranking that is more confident than the panel actually warrants.
- I do not multiply `fuel_exports_pct` by `exports_gdp` to back out a
  fuel-share-of-GDP. The numerator and denominator have different
  bases (merchandise vs goods + services) and the result is wrong for
  open economies. I use the curated national-accounts hydrocarbon
  share for that reading instead.
- I do not redo the work of the IMF or of national statistics offices
  on hydrocarbon classifications. When their numbers differ slightly,
  I keep them as-is and document the year and the source for each one.

## Reading axis on the country page

Every country page is laid out so the reader can scan it the same way:

- **A. Where is it now?** — KPI cards. The fastest read of the latest
  state of the economy.
- **B. Where is it going?** — five themed groups of trajectories with
  one short interpretation card each. This is where the dynamic story
  lives.
- **C. How does it compare to the GCC?** — multi-line panels and a
  year-by-year directional dashboard. This is where position relative
  to peers is read.
- **D. Why?** — strategy, sector focus, trade structure, constraint
  and risk. Curated, sourced, no quantitative claim that is not in
  Blocks A through C.

## Status of the data

The current build covers:

- Macro and structural indicators through **2024** for most series, with
  some WDI series stopping earlier (notably tourism share, which is
  anchored at 2020 in this WDI release for several countries).
- AI readiness through **2025** (Oxford 2025).
- Innovation index through **2025** (WIPO 2025).
- Hydrocarbon-sector share of GDP through **2024** for the six
  countries, all annual, from national-accounts releases listed on the
  Methodology page.

When I refresh the panel I update [the update playbook](./07-update-playbook.md).
