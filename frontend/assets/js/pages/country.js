import { loadComparisons, loadCountry } from "../data.js";
import { renderKpiGrid } from "../components/kpi-card.js";
import {
  renderLineChart,
  renderMultiLineChart,
} from "../components/line-chart.js";
import {
  renderDirectionalGrid,
  renderPaginator,
} from "../components/directional-grid.js";
import {
  GCC_ORDER,
  NAME_TO_SLUG,
  SLUG_TO_NAME,
  colorFor,
  indicatorMeta,
} from "../theme.js";
import {
  countryHeroLede,
  blockAInsight,
  blockBThemeInsight,
  blockCInsight,
  directionalDashboardInsight,
} from "../insights.js";
import { QUALITATIVE_NOTES } from "../qualitative-notes.js";

const KPI_ORDER = [
  "hydrocarbon_gdp_share",
  "fuel_exports_pct",
  "export_concentration",
  "tourism_pct_exports_eff",
  "tourism_receipts_usd",
  "gdp_per_capita",
  "gdp",
  "ai_readiness_unified",
  "innovation_index",
];

const BLOCK_B_LAYOUT = [
  {
    id: "hydrocarbons",
    title: "Hydrocarbon dependence",
    indicators: ["fuel_exports_pct", "oil_rents_gdp"],
    minYear: 1990,
  },
  {
    id: "diversification",
    title: "Export structure",
    indicators: ["export_concentration", "manufacturing_gdp", "services_gdp"],
    minYear: 1990,
  },
  {
    id: "tourism",
    title: "Tourism and services",
    indicators: ["tourism_pct_exports_eff", "tourism_receipts_usd"],
    minYear: 2000,
  },
  {
    id: "trade",
    title: "Trade integration",
    indicators: [
      "exports_gdp",
      "imports_gdp",
      "trade_openness_gdp",
      "exports_imports_ratio",
    ],
    minYear: 1995,
  },
  {
    id: "macro",
    title: "Economic scale and income",
    indicators: ["gdp", "gdp_per_capita"],
    minYear: 1990,
  },
];

const BLOCK_C_MULTI = [
  { col: "fuel_exports_pct", title: "Fuel exports (% of merch. exports) vs the GCC" },
  { col: "export_concentration", title: "Export concentration vs the GCC" },
  { col: "tourism_pct_exports_eff", title: "Tourism share vs the GCC" },
  { col: "exports_imports_ratio", title: "Exports / imports ratio vs the GCC" },
  { col: "gdp", title: "GDP (total) vs the GCC" },
  { col: "gdp_per_capita", title: "GDP per capita vs the GCC" },
];

const switcherHtml = (activeSlug) =>
  GCC_ORDER.map((name) => {
    const slug = NAME_TO_SLUG[name];
    const active = slug === activeSlug ? "active" : "";
    return `
      <a class="pill ${active}" href="#/country/${slug}" data-link>
        <span class="country-dot" style="background:${colorFor(name)}"></span>
        ${name}
      </a>`;
  }).join("");

const blockACard = (countryData) => {
  const items = KPI_ORDER.map((col) => ({
    col,
    entry: countryData.block_a_kpis[col],
  }));
  return renderKpiGrid(items);
};

const blockBSection = (group, countryName, country) => {
  const charts = group.indicators
    .map((col) => {
      const meta = indicatorMeta(col);
      return `
        <div class="chart-card">
          <h3 class="chart-title">${meta.label}</h3>
          <p class="chart-subtitle">${meta.unit}</p>
          <div class="chart-target" data-col="${col}" data-min-year="${group.minYear}"></div>
        </div>`;
    })
    .join("");
  return `
    <div class="section">
      <h3 class="h-section">${group.title}</h3>
      <div class="grid-2">${charts}</div>
      <div class="mt-3">${blockBThemeInsight(countryName, group.id, country)}</div>
    </div>
  `;
};

const blockDSection = (countryName, slug) => {
  const block = QUALITATIVE_NOTES[slug];
  if (!block) return "";
  return `
  <section class="section">
    <h2 class="h-section">D. Why? National strategy and outlook</h2>
    <div class="qual-card">
      <h3>${block.title}</h3>
      <div class="qual-list">
        ${block.notes
          .map(
            (n) => `
          <article class="qual-note">
            <span class="qual-label">${n.label}</span>
            <p>${n.text}</p>
            <a class="qual-source" href="${n.href}" ${
              n.href.startsWith("#") ? "data-link" : 'target="_blank" rel="noopener noreferrer"'
            }>${n.source}</a>
          </article>`,
          )
          .join("")}
      </div>
      <p class="qual-footnote">
        Trade-partner reads above are based on World Bank WITS country profiles
        and follow the methodology page (named country partners only). Sources
        and definitions for every variable are listed under
        <a href="#/methodology" data-link>Methodology and sources</a>.
      </p>
    </div>
  </section>
`;
};

export const renderCountry = async ({ params }) => {
  const slug = params.slug;
  const countryName = SLUG_TO_NAME[slug];
  if (!countryName) {
    return `
      <section class="section">
        <h1 class="h-display">Unknown country</h1>
        <p class="lede">No data found for slug <code>${slug}</code>.</p>
        <a class="btn" href="#/" data-link>Back to map</a>
      </section>`;
  }

  const [country, comparisons] = await Promise.all([
    loadCountry(slug),
    loadComparisons(),
  ]);

  const flagStripeColor = colorFor(countryName);
  const heroLede = countryHeroLede(countryName, country);

  const html = `
    <section class="country-hero">
      <div class="country-flag-strip" style="background:${flagStripeColor}"></div>
      <div class="eyebrow">GCC, post-oil transition profile</div>
      <h1 class="h-display">${countryName}</h1>
      <div class="lede">${heroLede}</div>
    </section>

    <nav class="country-toc" aria-label="On this page">
      <a href="#cy-a" data-country-toc>A. Where is it now?</a>
      <a href="#cy-b" data-country-toc>B. Where is it going?</a>
      <a href="#cy-c" data-country-toc>C. How does it compare?</a>
      <a href="#cy-d" data-country-toc>D. Why?</a>
    </nav>

    <div class="section-header switch-bar mt-3">
      <div class="country-switcher">${switcherHtml(slug)}</div>
    </div>

    <section class="section" id="cy-a">
      <h2 class="h-section">A. Where is ${countryName} now?</h2>
      ${blockACard(country)}
      <div class="mt-3">${blockAInsight(countryName, country)}</div>
    </section>

    <section class="section" id="cy-b">
      <h2 class="h-section">B. Where is it going?</h2>
      ${BLOCK_B_LAYOUT.map((g) => blockBSection(g, countryName, country)).join("")}
    </section>

    <section class="section" id="cy-c">
      <h2 class="h-section">C. How does it compare to the GCC?</h2>
      <div class="grid-2 mt-3">
        ${BLOCK_C_MULTI.map(
          (m) => `
          <div class="chart-card">
            <h3 class="chart-title">${m.title}</h3>
            <p class="chart-subtitle">${indicatorMeta(m.col).unit}</p>
            <div class="chart-multi" data-col="${m.col}"></div>
          </div>`,
        ).join("")}
      </div>
      <div class="mt-3">${blockCInsight(countryName, country)}</div>

      <div class="mt-4">
        <h3 class="h-section">Year-by-year direction</h3>
        <div class="card-bare" style="padding: var(--space-3)">
          <div id="country-directional"></div>
          <div id="country-directional-paginator" class="mt-2"></div>
        </div>
        <div class="mt-3">${directionalDashboardInsight(countryName, country, comparisons)}</div>
      </div>
    </section>

    <div id="cy-d">${blockDSection(countryName, slug)}</div>
  `;

  const onMount = () => {
    document.querySelectorAll("[data-country-toc]").forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        const id = (link.getAttribute("href") || "").replace(/^#/, "");
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    document.querySelectorAll(".chart-target[data-col]").forEach((el) => {
      const col = el.dataset.col;
      const minYear = el.dataset.minYear ? Number(el.dataset.minYear) : null;
      const series = country.block_b_series[col] || [];
      renderLineChart(el, {
        series,
        indicator: col,
        minYear,
        color: colorFor(countryName),
      });
    });

    document.querySelectorAll(".chart-multi[data-col]").forEach((el) => {
      const col = el.dataset.col;
      const series = comparisons.c1_country_series[col] || [];
      renderMultiLineChart(el, {
        series,
        indicator: col,
        highlight: slug,
        minYear: col === "tourism_pct_exports_eff" ? 2000 : 1995,
      });
    });

    const directionalEl = document.getElementById("country-directional");
    const paginatorEl = document.getElementById("country-directional-paginator");
    const allPairs = comparisons.c4_directional_dashboard.year_pairs;
    const indicators = comparisons.c4_directional_dashboard.indicators;
    const PER_PAGE = 6;
    let page = Math.max(0, Math.ceil(allPairs.length / PER_PAGE) - 1);

    const renderDir = () => {
      renderDirectionalGrid(directionalEl, {
        pairs: allPairs,
        indicators,
        highlight: slug,
        start: page * PER_PAGE,
        limit: PER_PAGE,
      });
      renderPaginator(paginatorEl, {
        totalPairs: allPairs.length,
        perPage: PER_PAGE,
        current: page,
        onChange: (p) => {
          page = p;
          renderDir();
        },
      });
    };
    renderDir();
  };

  return { html, onMount };
};
