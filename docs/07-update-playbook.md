# 07 — Update playbook

A short list of recipes I follow when something on the dashboard
needs to be refreshed.

## A. Refresh the WDI panel for a new vintage

1. Re-export the indicators I use from World Bank databank with the
   six GCC countries selected. Replace the relevant CSVs under
   `datasets/`.
2. Open `notebooks/main.ipynb` and run all cells. This rebuilds
   `datasets/merged_dataset.csv` and refreshes the SQLite mirror.
3. Run `python scripts/build_frontend_data.py`.
4. Run `python frontend/serve.py` and click through every country page
   plus the GCC overview to spot any unexpected gaps.
5. Push to `main` to redeploy.

## B. Update the curated hydrocarbon-sector share

When a new national-accounts release lands:

1. Edit `HYDROCARBON_GDP_SHARE` in
   `scripts/build_frontend_data.py`. Update `value`, `year`,
   `period_label`, `source`, `source_url` (kept in the Python dict for
   my own reference when updating methodology) and `note` for the country.
2. Update the matching entry in
   `frontend/assets/js/pages/methodology.js` under "National statistics
   offices, hydrocarbon share of GDP".
3. If the figure I quote in the README's overview table needs to be
   updated, edit that row in `README.md` too.
4. Run `python scripts/build_frontend_data.py`. This regenerates
   `data/countries/<slug>.json` and `data/gcc/overview.json`.
5. Reload the country page and the GCC overview to verify the new
   value and the year tag.

## C. Update Block D for one country

1. Open `frontend/assets/js/qualitative-notes.js`.
2. Update `text`, `source` and `href` for the matching note. Keep the
   four-note structure (Strategy / Sector focus / Trade structure /
   Constraint and risk).
3. Mirror the link in the Block D source list inside
   `frontend/assets/js/pages/methodology.js` so the consolidated
   reference list is in sync.
4. Reload the country page and the methodology page.

## D. Add a new indicator to the panel

1. Add the column to `datasets/merged_dataset.csv` (via the notebook).
2. Register the indicator in `theme.js`:

   ```js
   INDICATORS.new_indicator = {
     label: "Friendly name",
     short: "Short label",
     unit: "% of GDP",            // or "USD", "0-100 score", etc.
     format: "percent",            // see formatters.js for valid values
     lower_is_better: true,
   };
   ```

3. In `scripts/build_frontend_data.py`:

   - Add the column to `BLOCK_B_GROUPS` (under the right theme).
   - If it should appear in Block A KPI cards, add it to
     `BLOCK_A_KPIS` and provide its source label in `SOURCE_LABELS`.
   - If lower-is-better for the rank, add it to `LOWER_IS_BETTER`.
   - If it should appear in the overview snapshot, add it to
     `snapshot_indicators` in `build_overview`.

4. Update the frontend to surface it:

   - `pages/country.js` — `KPI_ORDER` (if Block A) and
     `BLOCK_B_LAYOUT` (if you want a chart). The chart auto-renders
     from `block_b_series[<col>]`.
   - `pages/overview.js` — `HEADLINE_COLS` (snapshot table column).
   - `insights.js` — write the prose card if you want a new section.

5. Document the indicator in
   [03 — Indicators reference](./03-indicators.md).
6. Mention it in the methodology page (variables and definitions
   block) so the reader sees the full list.

## E. Add a new country

This dashboard is GCC-only by design, but the same outline applies if
you fork it for another region.

1. In `scripts/build_frontend_data.py`, add the country to
   `GCC_COUNTRIES`, `COUNTRY_META` (slug, ISO-A3) and to
   `HYDROCARBON_GDP_SHARE` if you have a curated value.
2. In `frontend/assets/js/theme.js`, register the brand colour
   (`COUNTRY_COLOR`) and add it to `SLUG_TO_NAME` and `GCC_ORDER`.
3. Add the matching block in `frontend/assets/js/qualitative-notes.js`
   following the four-note structure used today.
4. Add the country in `notebooks/build_gcc_geojson.ipynb` so it is
   present in the map GeoJSON.
5. Run the build script and serve the site to verify everything looks
   right.

## F. Refresh the map style

Map styling is driven by:

- `frontend/assets/js/components/gcc-map.js` for behaviour and the
  fill / stroke logic.
- `frontend/assets/css/styles.css` (the `Map` block at around line
  500) for the surrounding layout, tooltip and legend.

If you want to disable labels on the map, pass `showLabels: false`
when calling `renderGccMap`.

## G. Refresh the deployment

`git push` to `main` is enough. The workflow
`.github/workflows/deploy.yml` rebuilds the static site automatically
and pushes it to GitHub Pages.

To re-run the workflow without a code change, use the
`workflow_dispatch` trigger from the Actions tab. There is no caching
between runs that might make the next deployment stale.
