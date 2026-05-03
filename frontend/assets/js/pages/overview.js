import { loadComparisons, loadOverview } from "../data.js";
import {
  renderScatter,
  renderGccScatterLegend,
} from "../components/scatter-chart.js";
import { renderMultiLineChart } from "../components/line-chart.js";
import { colorFor, indicatorMeta } from "../theme.js";
import {
  formatValueByIndicator,
  tickFormatterByIndicator,
} from "../formatters.js";
import {
  overviewSnapshotInsights,
  overviewConcVsAiInsight,
  overviewTourismVsAiInsight,
  overviewAiVsGiiInsight,
  overviewConcVsGiiInsight,
  overviewLogGdpVsGiiInsight,
  overviewFuelTrendInsight,
  overviewConcTrendInsight,
  overviewTourismTrendInsight,
  overviewGdpTrendInsight,
  overviewTradeBalanceTrendInsight,
} from "../insights.js";

const HEADLINE_COLS = [
  { col: "hydrocarbon_gdp_share", short: "Hydrocarbon GDP" },
  { col: "fuel_exports_pct", short: "Fuel exp. / merch." },
  { col: "export_concentration", short: "Export conc." },
  { col: "tourism_pct_exports_eff", short: "Tourism share" },
  { col: "gdp", short: "GDP" },
  { col: "gdp_per_capita", short: "GDP / cap." },
  { col: "ai_readiness_unified", short: "AI readiness" },
  { col: "innovation_index", short: "GII (innov.)" },
];

const snapshotCell = (col, entry) => {
  if (!entry || entry.value == null) {
    return `<td class="col-num"><span class="snap-cell"><span class="v">N/A</span></span></td>`;
  }
  const cls = ["snap-cell"];
  if (entry.is_fallback) cls.push("fallback");
  const tooltipParts = [];
  if (entry.note) tooltipParts.push(entry.note);
  if (entry.world_rank != null) tooltipParts.push(`World rank ${entry.world_rank}`);
  const title = tooltipParts.join(" | ");
  const rankBadge =
    entry.world_rank != null
      ? `<span class="snap-rank">#${entry.world_rank}</span>`
      : "";
  const yearLabel = entry.period_label || entry.year;
  return `
    <td class="col-num">
      <span class="${cls.join(" ")}"${title ? ` title="${title.replace(/"/g, "&quot;")}"` : ""}>
        <span class="v">${formatValueByIndicator(col, entry.value)}${rankBadge}</span>
        <span class="y">${yearLabel}</span>
      </span>
    </td>
  `;
};

const snapshotRow = (snap) => `
  <tr class="snap-row" data-slug="${snap.slug}">
    <td class="country-cell">
      <a class="country-chip" href="#/country/${snap.slug}" data-link>
        <span class="country-dot" style="background:${colorFor(snap.country)}"></span>
        ${snap.country}
      </a>
    </td>
    ${HEADLINE_COLS.map(({ col }) => snapshotCell(col, snap[col])).join("")}
  </tr>
`;

export const renderOverview = async () => {
  const [overview, comparisons] = await Promise.all([
    loadOverview(),
    loadComparisons(),
  ]);

  const concVsAi =
    comparisons.c2_cross_block.export_concentration_vs_ai_readiness_2023_2024
      .points;
  const tourismLensRaw = comparisons.c2_cross_block.tourism_lens_constructed.points;
  const tourismVsAi = tourismLensRaw
    .filter((p) => p.tourism_pct_exports_eff != null && p.ai_readiness_2023 != null)
    .map((p) => ({
      country: p.country,
      slug: p.slug,
      x: p.tourism_pct_exports_eff,
      y: p.ai_readiness_2023,
      year: p.tourism_year,
    }));
  const aiVsGii = comparisons.c2_cross_block.ai_2025_vs_gii_2025.points;
  const concVsGii =
    comparisons.c2_cross_block.concentration_vs_gii_2025?.points || [];
  const logGdpVsGii =
    comparisons.c2_cross_block.log10_gdp_vs_gii_2025?.points || [];

  const html = `
    <section class="section">
      <div class="eyebrow">GCC overview</div>
      <h1 class="h-display">${overview.main_question}</h1>
      <p class="lede">
        Three views in one place: headline levels today, how structure lines up
        with capability and innovation, and how key diversification indicators
        moved over recent decades.
      </p>
    </section>

    <section class="section">
      <h2 class="h-section">A. Country snapshot</h2>
      <p class="section-intro">
        Each row shows the latest available value of each indicator and its year; click a country name to open the full country page.
      </p>
      <div class="card-bare">
        <table class="table">
          <thead>
            <tr>
              <th>Country</th>
              ${HEADLINE_COLS.map(
                (h) =>
                  `<th class="col-num" title="${indicatorMeta(h.col).label} (${indicatorMeta(h.col).unit})">${h.short}</th>`,
              ).join("")}
            </tr>
          </thead>
          <tbody>
            ${overview.country_snapshots.map(snapshotRow).join("")}
          </tbody>
        </table>
      </div>
      <div class="mt-3">${overviewSnapshotInsights(overview.country_snapshots)}</div>
    </section>

    <section class="section">
      <h2 class="h-section">B. Cross-block patterns</h2>
      <p class="section-intro">
        Each dot is one GCC country; colours match country pages. Indicators use
        the latest year available in the extract for each axis (see methodology).
      </p>
      <div
        id="overview-cross-block-legend"
        class="scatter-legend-host"
        aria-label="Country colours for all scatter plots in this section"
      ></div>

      <h3 class="h-sub mt-2">Headline pairings</h3>
      <div class="scatter-grid">
        <div class="chart-card">
          <h3 class="chart-title">Export concentration vs AI readiness (2023-24)</h3>
          <div id="overview-conc-ai" class="chart-target"></div>
        </div>
        <div class="chart-card">
          <h3 class="chart-title">Tourism share vs AI readiness</h3>
          <div id="overview-tourism-ai" class="chart-target"></div>
        </div>
        <div class="chart-card">
          <h3 class="chart-title">AI readiness 2025 vs GII 2025</h3>
          <div id="overview-ai-gii" class="chart-target"></div>
        </div>
      </div>

      <div class="mt-3">${overviewConcVsAiInsight()}</div>
      <div>${overviewTourismVsAiInsight()}</div>
      <div>${overviewAiVsGiiInsight()}</div>

      <h3 class="h-sub mt-4">Lagged macro vs innovation outcome</h3>
      <p class="muted text-sm mt-1">
        Macroeconomic structure of 2024 paired with the GII 2025 row, exploratory only.
      </p>
      <div class="scatter-grid">
        <div class="chart-card">
          <h3 class="chart-title">Export concentration 2024 vs GII 2025</h3>
          <div id="overview-conc-gii" class="chart-target"></div>
        </div>
        <div class="chart-card">
          <h3 class="chart-title">log10(GDP) 2024 vs GII 2025</h3>
          <div id="overview-loggdp-gii" class="chart-target"></div>
        </div>
      </div>

      <div class="mt-3">${overviewConcVsGiiInsight()}</div>
      <div>${overviewLogGdpVsGiiInsight()}</div>
    </section>

    <section class="section">
      <h2 class="h-section">C. Trajectories</h2>

      <div class="grid-2">
        <div class="chart-card">
          <h3 class="chart-title">Fuel exports (% of merchandise exports)</h3>
          <div id="overview-fuel-multi" class="chart-multi"></div>
        </div>
        <div class="chart-card">
          <h3 class="chart-title">Export concentration (UNCTAD)</h3>
          <div id="overview-conc-multi" class="chart-multi"></div>
        </div>
        <div class="chart-card">
          <h3 class="chart-title">Tourism receipts (effective share of exports)</h3>
          <div id="overview-tourism-multi" class="chart-multi"></div>
        </div>
        <div class="chart-card">
          <h3 class="chart-title">Tourism receipts (USD)</h3>
          <div id="overview-tourismusd-multi" class="chart-multi"></div>
        </div>
        <div class="chart-card">
          <h3 class="chart-title">Exports / imports ratio</h3>
          <div id="overview-tradebal-multi" class="chart-multi"></div>
        </div>
        <div class="chart-card">
          <h3 class="chart-title">GDP (total, USD)</h3>
          <div id="overview-gdp-multi" class="chart-multi"></div>
        </div>
        <div class="chart-card">
          <h3 class="chart-title">GDP per capita (USD)</h3>
          <div id="overview-gpc-multi" class="chart-multi"></div>
        </div>
      </div>
      <div class="mt-3">${overviewFuelTrendInsight()}</div>
      <div>${overviewConcTrendInsight()}</div>
      <div>${overviewTourismTrendInsight()}</div>
      <div>${overviewTradeBalanceTrendInsight()}</div>
      <div>${overviewGdpTrendInsight()}</div>
    </section>

    <section class="section">
      <div class="card">
        <h2 class="h-section">How to read this page</h2>
        <p class="mt-1">
          All comparisons here are descriptive. They show patterns and contrasts
          across six countries with sources of different vintages, not a causal
          test. The full methodology page documents every source, the way
          tourism share and AI readiness are constructed, and the rule used to
          handle anomalous data points such as Bahrain's fuel-exports series.
        </p>
        <p class="mt-2">
          <a class="btn primary" href="#/methodology" data-link>
            Read the methodology
          </a>
        </p>
      </div>
    </section>
  `;

  const onMount = () => {
    const legendHost = document.getElementById("overview-cross-block-legend");
    if (legendHost) renderGccScatterLegend(legendHost);

    const concEl = document.getElementById("overview-conc-ai");
    const tourEl = document.getElementById("overview-tourism-ai");
    const aiGiiEl = document.getElementById("overview-ai-gii");
    const concGiiEl = document.getElementById("overview-conc-gii");
    const logGdpGiiEl = document.getElementById("overview-loggdp-gii");
    const fuelMulti = document.getElementById("overview-fuel-multi");
    const concMulti = document.getElementById("overview-conc-multi");
    const tourMulti = document.getElementById("overview-tourism-multi");
    const tourUsdMulti = document.getElementById("overview-tourismusd-multi");
    const tradeBalMulti = document.getElementById("overview-tradebal-multi");
    const gdpMulti = document.getElementById("overview-gdp-multi");
    const gpcMulti = document.getElementById("overview-gpc-multi");

    if (concEl) {
      renderScatter(concEl, {
        points: concVsAi.map((p) => ({
          country: p.country,
          slug: p.slug,
          x: p.x,
          y: p.y,
          year: p.year,
        })),
        xLabel: "Export concentration (UNCTAD)",
        yLabel: "AI readiness 2023-24",
        xTickFormat: tickFormatterByIndicator("export_concentration"),
        yTickFormat: tickFormatterByIndicator("ai_readiness"),
        showLegend: false,
      });
    }
    if (tourEl) {
      renderScatter(tourEl, {
        points: tourismVsAi,
        xLabel: "Tourism receipts / total exports (%)",
        yLabel: "AI readiness 2023",
        xTickFormat: tickFormatterByIndicator("tourism_pct_exports_eff"),
        yTickFormat: tickFormatterByIndicator("ai_readiness"),
        showLegend: false,
      });
    }
    if (aiGiiEl) {
      renderScatter(aiGiiEl, {
        points: aiVsGii.map((p) => ({
          country: p.country,
          slug: p.slug,
          x: p.x,
          y: p.y,
          year: 2025,
        })),
        xLabel: "AI readiness 2025 (six-pillar mean)",
        yLabel: "Innovation index, GII 2025",
        xTickFormat: tickFormatterByIndicator("ai_readiness_unified"),
        yTickFormat: tickFormatterByIndicator("innovation_index"),
        showLegend: false,
      });
    }
    if (concGiiEl) {
      renderScatter(concGiiEl, {
        points: concVsGii.map((p) => ({
          country: p.country,
          slug: p.slug,
          x: p.x,
          y: p.y,
          year: p.year,
        })),
        xLabel: "Export concentration 2024",
        yLabel: "Innovation index, GII 2025",
        xTickFormat: tickFormatterByIndicator("export_concentration"),
        yTickFormat: tickFormatterByIndicator("innovation_index"),
        showLegend: false,
      });
    }
    if (logGdpGiiEl) {
      renderScatter(logGdpGiiEl, {
        points: logGdpVsGii.map((p) => ({
          country: p.country,
          slug: p.slug,
          x: p.x,
          y: p.y,
          year: p.year,
        })),
        xLabel: "log10(GDP, USD) 2024",
        yLabel: "Innovation index, GII 2025",
        yTickFormat: tickFormatterByIndicator("innovation_index"),
        showLegend: false,
      });
    }
    if (fuelMulti) {
      renderMultiLineChart(fuelMulti, {
        series: comparisons.c1_country_series.fuel_exports_pct,
        indicator: "fuel_exports_pct",
        minYear: 1995,
      });
    }
    if (concMulti) {
      renderMultiLineChart(concMulti, {
        series: comparisons.c1_country_series.export_concentration,
        indicator: "export_concentration",
        minYear: 1995,
      });
    }
    if (tourMulti) {
      renderMultiLineChart(tourMulti, {
        series: comparisons.c1_country_series.tourism_pct_exports_eff,
        indicator: "tourism_pct_exports_eff",
        minYear: 2000,
      });
    }
    if (tourUsdMulti && comparisons.c1_country_series.tourism_receipts_usd) {
      renderMultiLineChart(tourUsdMulti, {
        series: comparisons.c1_country_series.tourism_receipts_usd,
        indicator: "tourism_receipts_usd",
        minYear: 2000,
      });
    }
    if (tradeBalMulti && comparisons.c1_country_series.exports_imports_ratio) {
      renderMultiLineChart(tradeBalMulti, {
        series: comparisons.c1_country_series.exports_imports_ratio,
        indicator: "exports_imports_ratio",
        minYear: 1995,
      });
    }
    if (gdpMulti && comparisons.c1_country_series.gdp) {
      renderMultiLineChart(gdpMulti, {
        series: comparisons.c1_country_series.gdp,
        indicator: "gdp",
        minYear: 1995,
      });
    }
    if (gpcMulti) {
      renderMultiLineChart(gpcMulti, {
        series: comparisons.c1_country_series.gdp_per_capita,
        indicator: "gdp_per_capita",
        minYear: 1995,
      });
    }
  };

  return { html, onMount };
};
