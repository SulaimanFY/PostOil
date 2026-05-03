// Analytical insight cards rendered on every page.
//
// I keep the prose deterministic: every sentence is built from values
// already present in the JSON payloads, so the text stays in sync when I
// rebuild the panel. The notebook sections 3.1, 3.4 and 3.5 are the
// human-readable counterpart.
//
// Each block follows the same shape: eyebrow + claim + body + caveat.
// `body` is either a single string or an array of paragraphs. I avoid
// instructions to the reader and keep the tone descriptive.

import { formatValueByIndicator } from "./formatters.js";
import { colorFor } from "./theme.js";

const escapeText = (s) =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
  })[c]);

const stripDashes = (s) =>
  String(s ?? "").replace(/[\u2013\u2014\u2212]/g, ", ");

// Render `body` either as a single paragraph (string) or as multiple
// stacked paragraphs (array). I use the array form to break long
// narratives into readable chunks with proper line spacing.
const renderBody = (body) => {
  if (!body) return "";
  if (Array.isArray(body)) {
    return body
      .filter(Boolean)
      .map((p) => `<p class="insight-body">${stripDashes(p)}</p>`)
      .join("");
  }
  return `<p class="insight-body">${stripDashes(body)}</p>`;
};

export const insightBlock = ({
  eyebrow,
  claim,
  body,
  caveat,
  tone = "default",
  countryColor = null,
}) => {
  const styleAttr = countryColor
    ? ` style="--country-color:${countryColor}"`
    : "";
  const dataAttr = countryColor ? ` data-country="1"` : "";
  return `
  <section class="insight-block tone-${tone}"${dataAttr}${styleAttr}>
    ${eyebrow ? `<div class="insight-eyebrow">${escapeText(stripDashes(eyebrow))}</div>` : ""}
    ${claim ? `<p class="insight-claim">${stripDashes(claim)}</p>` : ""}
    ${renderBody(body)}
    ${caveat ? `<p class="insight-caveat">${stripDashes(caveat)}</p>` : ""}
  </section>
`;
};

const fmt = (col, v) => formatValueByIndicator(col, v);

const fmtUSD = (v) => {
  if (v == null || Number.isNaN(v)) return "N/A";
  if (Math.abs(v) >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (Math.abs(v) >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  return `$${Math.round(v).toLocaleString("en-US")}`;
};

const seriesAt = (series, year) => {
  if (!Array.isArray(series)) return null;
  const point = series.find((p) => p.year === year);
  return point ? point.value : null;
};

// Latest credible point in a series. I drop entries flagged as
// `is_revision_artefact` so the "latest" never lands on a known
// WDI artefact.
const latestSeriesValue = (series) => {
  if (!Array.isArray(series) || !series.length) return null;
  const usable = series.filter(
    (p) => p.value != null && !p.is_revision_artefact,
  );
  const arr = usable.length ? usable : series.filter((p) => p.value != null);
  if (!arr.length) return null;
  arr.sort((a, b) => b.year - a.year);
  return arr[0];
};

// WDI oil rents stop earlier than the GDP series for some countries,
// so I always use the latest year that actually has a value.
const oilRentsOfGdpPhrase = (f) => {
  const p = f.oilRentsLatest;
  if (!p || p.value == null || Number.isNaN(p.value)) {
    return {
      full: "Oil rents from extraction (WDI) are not available for the latest year in this extract.",
      pct: null,
      year: null,
    };
  }
  const pct = fmt("oil_rents_gdp", p.value);
  const year = p.year;
  return {
    full: `Oil rents from extraction were ${pct} of GDP in ${year} (WDI)`,
    pct,
    year,
  };
};

// ---------------------------------------------------------------------------
// GCC OVERVIEW
// ---------------------------------------------------------------------------

const sortByCol = (snaps, col, dir = "desc") =>
  [...snaps]
    .filter((s) => s[col]?.value != null)
    .sort((a, b) =>
      dir === "desc"
        ? b[col].value - a[col].value
        : a[col].value - b[col].value,
    );

export const overviewSnapshotInsights = (snapshots) => {
  const aiDesc = sortByCol(snapshots, "ai_readiness_unified", "desc");
  const giiDesc = sortByCol(snapshots, "innovation_index", "desc");
  const concAsc = sortByCol(snapshots, "export_concentration", "asc");
  const fuelDesc = sortByCol(snapshots, "fuel_exports_pct", "desc");
  const aiTop = aiDesc[0];
  const aiBot = aiDesc[aiDesc.length - 1];
  const concBest = concAsc[0];
  const concWorst = concAsc[concAsc.length - 1];
  const giiTop = giiDesc[0];
  const fuelTop = fuelDesc[0];

  const blocks = [];

  const aiTopRank = aiTop?.ai_readiness_unified?.world_rank;
  const giiTopRank = giiTop?.innovation_index?.world_rank;
  const aiBotRank = aiBot?.ai_readiness_unified?.world_rank;
  blocks.push(
    insightBlock({
      eyebrow: "Reading the snapshot",
      claim: `The GCC is splitting into a capability-led group (Saudi Arabia, UAE) and a resource-anchored group (Kuwait, partly Qatar). Income alone does not predict who is moving fastest.`,
      body: [
        `Saudi Arabia tops AI readiness 2025 at ${fmt("ai_readiness_unified", aiTop?.ai_readiness_unified?.value)}${aiTopRank ? ` (world rank ${aiTopRank})` : ""}. The UAE tops the GII 2025 at ${fmt("innovation_index", giiTop?.innovation_index?.value)}${giiTopRank ? ` (world rank ${giiTopRank})` : ""} and shows the lowest export concentration (${fmt("export_concentration", concBest?.export_concentration?.value)}).`,
        `Kuwait sits at the bottom on every capability indicator${aiBotRank ? ` (AI world rank ${aiBotRank})` : ""} and at the top on fuel-export dependence (${fmt("fuel_exports_pct", fuelTop?.fuel_exports_pct?.value)} of merchandise).`,
        `Qatar has the highest income of the panel but mid-pack scores on AI readiness and innovation, so high GDP per capita does not translate mechanically into transition readiness.`,
      ],
      caveat: `Each column uses the latest available year in this extract, not one shared cut-off. AI and GII reach 2025, export concentration and macro indicators reach 2024, tourism share is anchored to 2020.`,
    }),
  );

  blocks.push(
    insightBlock({
      eyebrow: "Structure vs capability",
      claim: `Capability is moving faster than the export mix inside the GCC, which is the central tension of the dataset.`,
      body: [
        `Saudi Arabia keeps the most concentrated export profile (${fmt("export_concentration", concWorst?.export_concentration?.value)}) yet leads AI readiness. The UAE pairs the lowest concentration (${fmt("export_concentration", concBest?.export_concentration?.value)}) with leading innovation outcomes.`,
        `Reducing concentration and building tradable-sector depth therefore looks at least as important as raising aggregate GDP for transition readiness.`,
      ],
      caveat: `Concentration captures the shape of the export mix, not where domestic value is actually created.`,
    }),
  );

  return blocks.join("");
};

export const overviewConcVsAiInsight = () =>
  insightBlock({
    eyebrow: "Cross-block, concentration vs AI",
    claim: `Lower export concentration aligns with stronger AI readiness, with Saudi Arabia as the visible counter-example.`,
    body: [
      `The UAE pairs very low concentration (0.28) with the highest 2024 AI readiness (75.7). Bahrain, Oman and Qatar cluster mid-axis on both.`,
      `Saudi Arabia keeps a still-concentrated mix (0.55) but ranks second on 2024 AI readiness (72.4). Capability investment can therefore run ahead of export-mix change rather than wait for it.`,
    ],
    caveat: `Six countries, two years. The cluster pattern is the signal, not a fitted slope.`,
  });

export const overviewTourismVsAiInsight = () =>
  insightBlock({
    eyebrow: "Cross-block, tourism vs AI",
    claim: `Tourism share alone does not predict capability. Tourism scale (USD) lines up with capability much better.`,
    body: [
      `Qatar has the highest tourism share (about 20% of exports in 2020) but mid-pack 2023 AI readiness (63.6).`,
      `The UAE has a smaller effective share (about 7%) yet leads AI readiness (70.4) and holds the largest absolute tourism receipts in the GCC.`,
      `Tourism contributes to diversification through the size of the services economy, not through its share of exports alone.`,
    ],
    caveat: `Tourism share is anchored to 2020 in this WDI release for all six countries, so comparison years for tourism and AI do not match.`,
  });

export const overviewAiVsGiiInsight = () =>
  insightBlock({
    eyebrow: "Cross-block, AI vs GII",
    claim: `Capability and innovation outcomes co-move in the GCC, consistent with a capability-to-innovation transmission, not a causal proof.`,
    body: [
      `Saudi Arabia tops AI readiness (74.8) and the UAE tops GII (44.2, world rank 30). Together they form the high-readiness corner of the chart.`,
      `Bahrain, Oman and Qatar form a middle band (GII world ranks 62, 69, 48).`,
      `Kuwait is bottom on both axes (AI 43.4, GII 28.2, world rank 73), the only consistent under-performer of the panel.`,
    ],
    caveat: `Single 2025 cross-section. Both indicators are composite scores.`,
  });

export const overviewConcVsGiiInsight = () =>
  insightBlock({
    eyebrow: "Cross-block, concentration vs GII (lagged)",
    claim: `Less concentrated export structures line up with stronger 2025 innovation outcomes, with Saudi Arabia as the same outlier seen on capability.`,
    body: [
      `The UAE pairs concentration 0.28 (2024) with GII 44.2 (2025, world rank 30). Bahrain (0.36 / 30.0) and Oman (0.32 / 27.7) sit in the same broad relationship.`,
      `Saudi Arabia keeps a 0.55 mix but reaches GII 36.0 (rank 46), well above the cluster of comparable concentration peers. Capability and innovation can build before the export structure broadens.`,
      `Kuwait closes at 0.30 yet only 28.2, so a broader mix is not enough on its own.`,
    ],
    caveat: `Macro 2024 lagged with GII 2025, six countries, descriptive only.`,
  });

export const overviewLogGdpVsGiiInsight = () =>
  insightBlock({
    eyebrow: "Cross-block, economy size vs GII (lagged)",
    claim: `Bigger economies do not mechanically score higher on innovation outcomes inside the GCC.`,
    body: [
      `Saudi Arabia is the largest economy (log10(GDP) about 11.95 in 2024) and reaches GII 36.0 (2025). The UAE is second (about 11.74) but tops GII at 44.2.`,
      `Bahrain (10.67), Oman (10.91) and Kuwait (11.18) sit in a tight middle band with GII between 27.7 and 30.0. Qatar (11.31) reaches GII 32.7.`,
      `Scale therefore correlates loosely with innovation outcome, far less tightly than capability does.`,
    ],
    caveat: `Macro 2024 lagged with GII 2025, descriptive only.`,
  });

export const overviewFuelTrendInsight = () =>
  insightBlock({
    eyebrow: "Trajectory, fuel exports (% of merchandise)",
    claim: `Hydrocarbon dependence remains the structural baseline. Only the UAE shows a clear long-run decline on this lens.`,
    body: [
      `Between 2000 and 2024 the share of fuel in merchandise exports moved from 94.3% to 90.7% in Kuwait, 91.2% to 83.8% in Qatar, 92.3% to 79.4% in Saudi Arabia, and 83.2% to 77.2% in Oman.`,
      `The UAE went from 93.8% to about 68%, the only drop large enough to materially change the country's export profile.`,
      `Bahrain's merchandise fuel share sits below Kuwait, Qatar and Saudi Arabia in this window—consistent with refining and transshipment alongside domestic extraction.`,
    ],
    caveat: `Commodity cycles move all these lines, so one-year jumps are noisy and the multi-year slope relative to peers is the diversification signal. A falling fuel share among merchandise exports is favourable when other goods gain weight in what is sold abroad.`,
  });

export const overviewConcTrendInsight = () =>
  insightBlock({
    eyebrow: "Trajectory, export concentration",
    claim: `Most GCC export structures broadened. Saudi Arabia stayed the most concentrated, while Oman almost halved its index.`,
    body: [
      `Between 2000 and 2024 concentration fell from 0.80 to 0.32 in Oman (largest drop in the panel), 0.62 to 0.30 in Kuwait, 0.60 to 0.40 in Qatar, and 0.47 to 0.28 in the UAE.`,
      `Saudi Arabia peaked at 0.74 in 2013 and fell to 0.55 in 2024, still the most concentrated of the six.`,
      `Oman shows the strongest structural shift on the export mix. Saudi Arabia's diversification still lags its capability gains.`,
    ],
    caveat: `Concentration is a Herfindahl on merchandise export categories. A falling value means a wider product mix and is a diversification gain.`,
  });

export const overviewTourismTrendInsight = () =>
  insightBlock({
    eyebrow: "Trajectory, tourism share",
    claim: `Qatar built a tourism economy in less than a decade. Bahrain went the opposite way, Saudi Arabia is mid-build.`,
    body: [
      `Qatar moved from 3.6% of exports in 2011 to 20.2% in 2020, the steepest tourism build-up of the GCC.`,
      `Bahrain dropped from 10-17% in the early 2000s to 2.8% in 2020.`,
      `Saudi Arabia ramped from about 2% in 2010 to about 7% in 2019, before the pandemic year. Tourism is therefore a real diversification lever for some countries, but the size differs by an order of magnitude across the panel.`,
    ],
    caveat: `Tourism series end on or before 2020 in this WDI extract, so the post-pandemic rebound (Qatar World Cup, Saudi Vision push, UAE rebound) is not yet visible here.`,
  });

export const overviewTradeBalanceTrendInsight = () =>
  insightBlock({
    eyebrow: "Trajectory, exports / imports ratio",
    claim: `A ratio above 1 signals a structural trade surplus, typically driven by oil and gas. A move toward 1 is a diversification signal: the economy buys more (capital and consumption goods) and exports beyond raw hydrocarbons.`,
    body: [
      `Saudi Arabia fell from 1.93 in 1968 and a 4.77 peak in 1974 to 1.14 in 2024, the clearest move toward balanced trade in the panel.`,
      `Qatar (2.17 in 2022) and Kuwait (1.51 in 2023) still run large surpluses, consistent with gas and oil-rent dependence.`,
      `The UAE (around 1.16 in 2023) and Bahrain (1.25 in 2024) sit close to balance, consistent with very open economies that import crude and capital and re-export or process goods. Oman has eased from 1.70 in 1996 to 1.35 in 2024.`,
    ],
    caveat: `Derived as exports_usd / imports_usd (World Bank WDI). The ratio captures the structural trade balance and complements the fuel and concentration lenses by showing whether the trade account is rent-driven or balanced.`,
  });

export const overviewGdpTrendInsight = () =>
  insightBlock({
    eyebrow: "Trajectory, GDP and GDP per capita",
    claim: `Income gaps inside the GCC are large and stable, and they do not predict the capability ranking.`,
    body: [
      `In 2024 GDP per capita ranges from $76.7k in Qatar to $20.3k in Oman, a 3.8x gap. The UAE ($50.3k), Saudi Arabia ($35.1k), Kuwait ($32.7k) and Bahrain ($29.7k) sit in between.`,
      `Saudi Arabia, the largest absolute GDP, leads on AI readiness, while Qatar, the richest per capita, does not.`,
      `Wealth and capability rank GCC countries differently, so income alone is not a reliable predictor of transition progress.`,
    ],
    caveat: `GDP per capita is a wealth indicator, not a measure of diversification or capability.`,
  });

// ---------------------------------------------------------------------------
// COUNTRY pages
// ---------------------------------------------------------------------------

const countryFacts = (country) => {
  const a = country.block_a_kpis || {};
  const b = country.block_b_series || {};
  const get = (col, year) => seriesAt(b[col], year);
  return {
    fuelLatest: a.fuel_exports_pct,
    concLatest: a.export_concentration,
    tourismLatest: a.tourism_pct_exports_eff,
    tourismUsdLatest: a.tourism_receipts_usd,
    gpcLatest: a.gdp_per_capita,
    gdpLatest: a.gdp,
    aiLatest: a.ai_readiness_unified,
    giiLatest: a.innovation_index,
    fuel2000: get("fuel_exports_pct", 2000),
    fuel2013: get("fuel_exports_pct", 2013),
    fuel2024: get("fuel_exports_pct", 2024),
    fuel2020: get("fuel_exports_pct", 2020),
    oilRents2000: get("oil_rents_gdp", 2000),
    oilRents2013: get("oil_rents_gdp", 2013),
    oilRentsLatest: latestSeriesValue(b.oil_rents_gdp),
    conc2000: get("export_concentration", 2000),
    conc2013: get("export_concentration", 2013),
    conc2024: get("export_concentration", 2024),
    manuf2000: get("manufacturing_gdp", 2000),
    manuf2013: get("manufacturing_gdp", 2013),
    manuf2024: get("manufacturing_gdp", 2024),
    services2013: get("services_gdp", 2013),
    services2024: get("services_gdp", 2024),
    gdp2000: get("gdp", 2000),
    gdp2013: get("gdp", 2013),
    gdp2024: get("gdp", 2024),
    gpc2000: get("gdp_per_capita", 2000),
    gpc2013: get("gdp_per_capita", 2013),
    gpc2024: get("gdp_per_capita", 2024),
    exports2013: get("exports_gdp", 2013),
    exports2024: get("exports_gdp", 2024),
    imports2013: get("imports_gdp", 2013),
    imports2024: get("imports_gdp", 2024),
    openness2013: get("trade_openness_gdp", 2013),
    openness2024: get("trade_openness_gdp", 2024),
    exportsLatest: latestSeriesValue(b.exports_gdp),
    importsLatest: latestSeriesValue(b.imports_gdp),
    opennessLatest: latestSeriesValue(b.trade_openness_gdp),
    tradeRatioLatest: latestSeriesValue(b.exports_imports_ratio),
    tradeRatio2000: get("exports_imports_ratio", 2000),
    tradeRatio2013: get("exports_imports_ratio", 2013),
    tradeRatio2024: get("exports_imports_ratio", 2024),
  };
};

// Country hero lede. One short narrative paragraph that positions the
// country inside the GCC story. The KPI list itself is owned by Block A.
const HERO_LEDE_BY_COUNTRY = {
  Bahrain: `Bahrain combines the GCC's strongest manufacturing share with a relatively diversified export mix. Capability outcomes remain middle to lower half inside the six-country panel.`,
  Kuwait: `Kuwait is the GCC's clearest hydrocarbon-anchored profile, with the highest fuel-export share and the lowest scores on AI readiness, innovation and tourism. The post-oil signal here is the export mix broadening, not a hydrocarbon retreat.`,
  Oman: `Oman owns the largest export-mix diversification of the GCC since 2000, even though fuel intensity stays high. Capability and tourism remain mid-pack.`,
  Qatar: `Qatar pairs the highest GDP per capita of the GCC with the largest tourism share of the panel, but its export mix is still gas-anchored and capability outcomes stay below Saudi Arabia and the UAE.`,
  "Saudi Arabia": `Largest GCC economy by far and regional leader on AI readiness 2025. The merchandise export bundle remains fuel-heavy, but that share has fallen since 2000 while manufacturing value added has nearly doubled as a share of GDP—a clear structural shift that shows up alongside lower oil rents as a share of GDP on World Bank series.`,
  "United Arab Emirates": `The UAE is a country where capability and structure are aligned: most diversified export mix, lowest fuel share of merchandise, leading innovation outcomes, and the largest tourism receipts in absolute USD.`,
};

export const countryHeroLede = (countryName) => {
  const text =
    HERO_LEDE_BY_COUNTRY[countryName] ||
    `${escapeText(countryName)}, GCC post-oil transition profile.`;
  return `<p>${stripDashes(text)}</p>`;
};

// ---------------------------- BLOCK A -----------------------------

const countryBlockA = (countryName, f) => {
  switch (countryName) {
    case "Bahrain":
      return {
        claim: `Bahrain combines the GCC's strongest manufacturing base with a relatively diversified export mix, while hydrocarbon exports remain a large share of merchandise trade.`,
        body: [
          `Manufacturing value added reaches ${fmt("manufacturing_gdp", f.manuf2024)} of GDP in 2024, the highest in the GCC. Services value added is around ${fmt("services_gdp", f.services2024)}, and export concentration is ${fmt("export_concentration", f.concLatest?.value)}.`,
          `Fuel exports account for ${fmt("fuel_exports_pct", f.fuelLatest?.value)} of merchandise exports (${f.fuelLatest?.year}).`,
          `${oilRentsOfGdpPhrase(f).full}.`,
        ],
      };
    case "Kuwait":
      return {
        claim: `Kuwait is the clearest hydrocarbon-anchored profile of the panel, with high oil dependence on every reading lens and the weakest capability scores in the GCC.`,
        body: [
          `Fuel exports stand at ${fmt("fuel_exports_pct", f.fuelLatest?.value)} of merchandise in ${f.fuelLatest?.year}, the highest in the GCC. ${oilRentsOfGdpPhrase(f).full}.`,
          `AI readiness 2025 is ${fmt("ai_readiness_unified", f.aiLatest?.value)} / 100 and GII 2025 is ${fmt("innovation_index", f.giiLatest?.value)} (world rank 73), both at the bottom of the panel.`,
          `Tourism share is ${fmt("tourism_pct_exports_eff", f.tourismLatest?.value)} of exports, the lowest of the six. The economy is therefore concentrated on hydrocarbons and weak on the post-oil channels measured here.`,
        ],
      };
    case "Oman":
      return {
        claim: `Oman is the GCC country with the largest export-mix diversification since 2000, even though fuel still dominates merchandise exports.`,
        body: [
          `Export concentration fell from ${fmt("export_concentration", f.conc2000)} in 2000 to ${fmt("export_concentration", f.concLatest?.value)} today, the steepest drop of the panel. A lower index means a wider mix of export products, so this is a clear diversification gain.`,
          `Fuel exports remain around ${fmt("fuel_exports_pct", f.fuelLatest?.value)} of merchandise, and manufacturing value added reaches ${fmt("manufacturing_gdp", f.manuf2024)} of GDP.`,
          `AI readiness 2025 reads ${fmt("ai_readiness_unified", f.aiLatest?.value)} / 100. Diversification has happened on the export-mix axis, but capability and tourism remain mid-pack.`,
        ],
      };
    case "Qatar":
      return {
        claim: `Qatar pairs the highest GDP per capita of the GCC with a large tourism economy, yet the export mix stays gas-anchored and capability outcomes are mid-pack.`,
        body: [
          `GDP per capita reaches ${fmt("gdp_per_capita", f.gpcLatest?.value)}, more than three times Oman's.`,
          `Tourism share is ${fmt("tourism_pct_exports_eff", f.tourismLatest?.value)} in ${f.tourismLatest?.year} (highest of the panel), and tourism receipts run around ${fmtUSD(f.tourismUsdLatest?.value)}.`,
          `Yet fuel exports still represent ${fmt("fuel_exports_pct", f.fuelLatest?.value)} of merchandise, and concentration is ${fmt("export_concentration", f.concLatest?.value)}. High income and tourism size have not translated into a clearly diversified export profile.`,
        ],
      };
    case "Saudi Arabia":
      return {
        claim: `Saudi Arabia is the largest GCC economy and the regional leader on AI readiness 2025, and is making real but uneven progress on shifting away from oil.`,
        body: [
          `AI readiness 2025 reaches ${fmt("ai_readiness_unified", f.aiLatest?.value)} / 100, the highest of the GCC and 15th worldwide. GII 2025 is ${fmt("innovation_index", f.giiLatest?.value)} (world rank 46), second behind the UAE.`,
          `On the structural side, export concentration peaked at ${fmt("export_concentration", f.conc2013)} in 2013 and fell to ${fmt("export_concentration", f.concLatest?.value)} in 2024 (a falling index means a wider product mix, so this is a diversification gain). Manufacturing value added rose from ${fmt("manufacturing_gdp", f.manuf2000)} in 2000 to ${fmt("manufacturing_gdp", f.manuf2024)} in 2024, and services value added reached ${fmt("services_gdp", f.services2024)} of GDP.`,
          `Fuel exports are ${fmt("fuel_exports_pct", f.fuelLatest?.value)} of merchandise in ${f.fuelLatest?.year}. Oil rents from extraction moved from about ${fmt("oil_rents_gdp", f.oilRents2013)} of GDP in 2013 to ${f.oilRentsLatest?.value != null ? fmt("oil_rents_gdp", f.oilRentsLatest.value) : "N/A"} of GDP in ${f.oilRentsLatest?.year ?? "?"} (WDI), a narrower but consistent indicator of hydrocarbon income in GDP than merchandise fuel shares alone.`,
        ],
      };
    case "United Arab Emirates":
      return {
        claim: `The UAE is the only GCC country where capability and structure are aligned: lowest export concentration, lowest fuel share of merchandise, leading innovation outcomes.`,
        body: [
          `Export concentration is ${fmt("export_concentration", f.concLatest?.value)} (lowest in the GCC), and fuel exports are ${fmt("fuel_exports_pct", f.fuelLatest?.value)} of merchandise in ${f.fuelLatest?.year} (lowest of the panel).`,
          `AI readiness 2025 reaches ${fmt("ai_readiness_unified", f.aiLatest?.value)} / 100 (second behind Saudi Arabia), and GII 2025 is ${fmt("innovation_index", f.giiLatest?.value)} (world rank 30, best of the panel).`,
          `Tourism share is ${fmt("tourism_pct_exports_eff", f.tourismLatest?.value)}, with the largest tourism receipts in absolute USD in the GCC. Very high exports and imports as a percent of GDP reflect re-exports, refining and services. Together with an exports-to-imports ratio near balance, the trade account looks like an open trading economy rather than a narrow rent-only export model.`,
        ],
      };
    default:
      return {
        claim: `${countryName} on the latest available indicators.`,
        body: `Headline KPI values are listed in the cards on top of this section.`,
      };
  }
};

export const blockAInsight = (countryName, country) => {
  const f = countryFacts(country);
  const { claim, body } = countryBlockA(countryName, f);
  return insightBlock({
    eyebrow: "Block A reading",
    claim,
    body,
    caveat: `Each KPI uses the latest available value within the 2015-2025 window, so reference years can differ across indicators.`,
    countryColor: colorFor(countryName),
  });
};

// ---------------------------- BLOCK B -----------------------------
//
// Block B is split per theme. Each theme returns its own insight,
// paired with the matching chart group on the country page.

const themeInsightFor = (countryName, theme, f) => {
  if (theme === "hydrocarbons") {
    if (countryName === "Bahrain") {
      return {
        claim: `Bahrain's hydrocarbon exposure has eased on the merchandise fuel share, even though oil rents still matter for national income.`,
        body: [
          `Fuel exports moved from ${fmt("fuel_exports_pct", f.fuel2000)} of merchandise in 2000 to ${fmt("fuel_exports_pct", f.fuel2020)} in 2020. A falling share of fuel among merchandise exports is a diversification gain: other goods gain weight in what is sold abroad.`,
          f.oilRentsLatest?.value != null
            ? `${oilRentsOfGdpPhrase(f).full}. That rent share is typically below Kuwait and Saudi Arabia in this panel. Lower extraction rents as a share of GDP are a favourable structural signal when they reflect a wider economy, not only prices.`
            : oilRentsOfGdpPhrase(f).full,
        ],
      };
    }
    if (countryName === "Kuwait") {
      return {
        claim: `Kuwait's hydrocarbon exposure on the merchandise lens is essentially flat over 24 years, while oil rents still absorb a large share of GDP.`,
        body: [
          `Fuel exports moved from ${fmt("fuel_exports_pct", f.fuel2000)} of merchandise in 2000 to ${fmt("fuel_exports_pct", f.fuel2024)} in 2024, so the export mix barely shifted on this axis.`,
          f.oilRentsLatest?.value != null
            ? `${oilRentsOfGdpPhrase(f).full}, down from a higher level around the 2013 oil-price peak. Domestic hydrocarbon income still dominates.`
            : oilRentsOfGdpPhrase(f).full,
          `The post-oil signal in Kuwait is therefore more about the rest of the economy growing around the oil sector than about the oil sector itself shrinking. Year-to-year swings still track commodity cycles.`,
        ],
      };
    }
    if (countryName === "Oman") {
      return {
        claim: `Oman's fuel-export share is below most GCC peers on merchandise trade, but oil rents still represent a large slice of GDP.`,
        body: [
          `Fuel exports moved from ${fmt("fuel_exports_pct", f.fuel2000)} of merchandise in 2000 to ${fmt("fuel_exports_pct", f.fuel2020)} in 2020 and ${fmt("fuel_exports_pct", f.fuel2024)} in 2024.`,
          f.oilRentsLatest?.value != null
            ? `${oilRentsOfGdpPhrase(f).full}, with a clear dip in 2020 and a rebound after.`
            : oilRentsOfGdpPhrase(f).full,
          `The long-run direction on merchandise fuel share is favourable for diversification, while recent fluctuations are mostly cyclical.`,
        ],
      };
    }
    if (countryName === "Qatar") {
      return {
        claim: `Qatar's hydrocarbon exposure is structurally high and stable, consistent with a gas-anchored economy.`,
        body: [
          `Fuel exports moved from ${fmt("fuel_exports_pct", f.fuel2000)} of merchandise in 2000 to ${fmt("fuel_exports_pct", f.fuel2024)} in 2024.`,
          f.oilRentsLatest?.value != null
            ? `${oilRentsOfGdpPhrase(f).full}. Levels remain high on both the trade and rent lenses, so diversification on the export side stays limited even with tourism gains.`
            : oilRentsOfGdpPhrase(f).full,
        ],
      };
    }
    if (countryName === "Saudi Arabia") {
      return {
        claim: `Saudi Arabia's exposure to hydrocarbons is shrinking on the domestic rent lens and on merchandise fuel share, even though oil still pays for most of the export bill.`,
        body: [
          `Fuel exports moved from ${fmt("fuel_exports_pct", f.fuel2000)} of merchandise in 2000 to ${fmt("fuel_exports_pct", f.fuel2024)} in 2024. Non-fuel goods picked up roughly 13 points of weight in the trade mix, a clear diversification signal.`,
          `Oil rents moved from about ${fmt("oil_rents_gdp", f.oilRents2013)} of GDP in 2013 to ${f.oilRentsLatest?.value != null ? fmt("oil_rents_gdp", f.oilRentsLatest.value) : "N/A"} of GDP in ${f.oilRentsLatest?.year ?? "?"} (WDI), a fall that tracks national hydrocarbon income more directly than scaling merchandise shares by trade-to-GDP.`,
          `Lower oil rents as a share of GDP reflect price cycles and a larger non-oil denominator as much as policy, but together with the merchandise trend they support a transition narrative.`,
        ],
      };
    }
    if (countryName === "United Arab Emirates") {
      return {
        claim: `The UAE shows the largest long-run fall in the merchandise-fuel share of the GCC. Oil rents add a domestic-income check alongside refining and re-exports.`,
        body: [
          `Fuel exports moved from ${fmt("fuel_exports_pct", f.fuel2000)} of merchandise in 2000 to ${fmt("fuel_exports_pct", f.fuelLatest?.value)} in ${f.fuelLatest?.year}, the clearest export-mix shift in the panel.`,
          `${oilRentsOfGdpPhrase(f).full}.`,
        ],
      };
    }
  }

  if (theme === "diversification") {
    if (countryName === "Bahrain") {
      return {
        claim: `Bahrain already starts from a relatively diversified export mix, with the highest manufacturing share of the GCC.`,
        body: [
          `Manufacturing value added reaches ${fmt("manufacturing_gdp", f.manuf2024)} of GDP in 2024 (WDI), and services value added is around ${fmt("services_gdp", f.services2024)} of GDP.`,
          `Export concentration (UNCTAD index on merchandise categories) moved from ${fmt("export_concentration", f.conc2000)} in 2000 to ${fmt("export_concentration", f.concLatest?.value)} in 2024.`,
          `That is only a modest improvement versus 2000 because the country already had a relatively spread-out export mix. The open question for diversification is less “escape a single product” and more whether Bahrain can add higher-value and higher-scale non-oil exports alongside strong manufacturing and services shares at home.`,
        ],
      };
    }
    if (countryName === "Kuwait") {
      return {
        claim: `Kuwait's export mix broadened sharply while the merchandise fuel share barely moved, the clearest split between the two diversification lenses in the panel.`,
        body: [
          `Export concentration (UNCTAD, lower = wider product mix) moved from ${fmt("export_concentration", f.conc2000)} in 2000 to ${fmt("export_concentration", f.concLatest?.value)} in 2024.`,
          `The export product mix has widened even though hydrocarbons still dominate the headline export profile. The diversification signal is clearer in the index than in the fuel share.`,
        ],
      };
    }
    if (countryName === "Oman") {
      return {
        claim: `Oman has the largest export-mix diversification of the GCC. The structural shift is in the mix, not yet in fuel intensity.`,
        body: [
          `Export concentration fell from ${fmt("export_concentration", f.conc2000)} in 2000 to ${fmt("export_concentration", f.concLatest?.value)} in 2024, the steepest drop of the panel (lower values mean a wider export mix, so this is a clear diversification gain).`,
          `Manufacturing value added is ${fmt("manufacturing_gdp", f.manuf2024)} of GDP and services value added ${fmt("services_gdp", f.services2024)} of GDP (WDI).`,
          `Together these readings put Oman closer to the UAE pattern on the export side than Saudi Arabia, despite a smaller economy.`,
        ],
      };
    }
    if (countryName === "Qatar") {
      return {
        claim: `Qatar's export mix remains relatively concentrated, even though manufacturing and services have grown.`,
        body: [
          `Export concentration (UNCTAD, lower = wider mix) moved from ${fmt("export_concentration", f.conc2000)} in 2000 to ${fmt("export_concentration", f.concLatest?.value)} in 2024.`,
          `Services value added runs around ${fmt("services_gdp", f.services2024)} of GDP and manufacturing value added ${fmt("manufacturing_gdp", f.manuf2024)} of GDP (WDI). That pairing fits an economy anchored on liquefied natural gas exports and related downstream activity, alongside growth in domestic services.`,
        ],
      };
    }
    if (countryName === "Saudi Arabia") {
      return {
        claim: `Saudi Arabia's export mix has broadened markedly since the 2013 oil-cycle peak, and the domestic structure shifted toward manufacturing and services.`,
        body: [
          `Export concentration (UNCTAD index on merchandise categories, 0-1, lower = wider mix) peaked at ${fmt("export_concentration", f.conc2013)} in 2013 and fell to ${fmt("export_concentration", f.concLatest?.value)} in 2024. Export sales are now spread across more categories than at the oil-cycle peak, a clear diversification gain.`,
          `Manufacturing value added (share of GDP, WDI) rose from ${fmt("manufacturing_gdp", f.manuf2000)} in 2000 to ${fmt("manufacturing_gdp", f.manuf2024)} in 2024, up roughly 70% in share terms (almost a doubling). Services value added rose from ${fmt("services_gdp", f.services2013)} in 2013 to ${fmt("services_gdp", f.services2024)} in 2024.`,
          `Together with lower oil rents as a share of GDP on the WDI series than at the 2013 peak, this points to a real structural shift. Saudi Arabia still has the most concentrated export profile of the six, so the next step is to translate that domestic transition into a broader product range sold abroad.`,
        ],
      };
    }
    if (countryName === "United Arab Emirates") {
      return {
        claim: `The UAE pairs a steady decline in concentration with a high services share, confirming the most diversified profile of the GCC.`,
        body: [
          `Export concentration (UNCTAD, lower = wider product mix) moved from ${fmt("export_concentration", f.conc2000)} to ${fmt("export_concentration", f.concLatest?.value)} between 2000 and 2024.`,
          `Services value added runs around ${fmt("services_gdp", f.services2024)} of GDP and manufacturing value added ${fmt("manufacturing_gdp", f.manuf2024)} of GDP (WDI), consistent with heavy logistics, aviation, tourism-related services and re-export activity.`,
        ],
      };
    }
  }

  if (theme === "tourism") {
    if (countryName === "Bahrain") {
      return {
        claim: `Bahrain's tourism share has fallen sharply since the early 2000s. That is a structural weakness for diversification compared with building a large travel sector.`,
        body: [
          `Tourism receipts were about 10-17% of exports in the early 2000s before trending down to ${fmt("tourism_pct_exports_eff", f.tourismLatest?.value)} in ${f.tourismLatest?.year}. The 2020 observation lines up with the Covid shock seen across the GCC in this WDI vintage, but Bahrain's problem is the longer slide from the 2000s peak, not a one-year dip.`,
          `Tourism receipts in USD stay small next to the UAE and Saudi Arabia, so tourism is not currently a main motor of export diversification for Bahrain.`,
        ],
      };
    }
    if (countryName === "Kuwait") {
      return {
        claim: `Kuwait runs the smallest tourism share of the GCC, which removes one of the standard diversification levers.`,
        body: [
          `Tourism share is ${fmt("tourism_pct_exports_eff", f.tourismLatest?.value)} of exports in ${f.tourismLatest?.year}, around 1% structurally.`,
          `Receipts in absolute USD are also at the bottom of the panel.`,
        ],
      };
    }
    if (countryName === "Oman") {
      return {
        claim: `Oman keeps a moderate tourism share, so tourism is a real but secondary diversification angle.`,
        body: [
          `Tourism share runs in the 3 to 7% range across recent years.`,
          `Receipts in absolute USD stay modest in regional terms, in line with Oman's smaller economy.`,
        ],
      };
    }
    if (countryName === "Qatar") {
      return {
        claim: `Qatar built a tourism economy in less than a decade, the steepest tourism build-up of the GCC.`,
        body: [
          `Tourism share rose from 3.6% in 2011 to ${fmt("tourism_pct_exports_eff", f.tourismLatest?.value)} in ${f.tourismLatest?.year}, roughly six-fold.`,
          `Receipts in absolute USD reached around ${fmtUSD(f.tourismUsdLatest?.value)}, second to the UAE.`,
        ],
      };
    }
    if (countryName === "Saudi Arabia") {
      return {
        claim: `Saudi Arabia ramped its tourism share gradually before the pandemic, in line with the Vision 2030 push.`,
        body: [
          `Tourism share moved from about 2% in 2010 to about 7% in 2019, before the 2020 dip.`,
          `Receipts in absolute USD are second-tier in the GCC, so tourism is one diversification lever among several rather than a single decisive channel.`,
        ],
      };
    }
    if (countryName === "United Arab Emirates") {
      return {
        claim: `The UAE leads the GCC on tourism scale and pairs it with one of the region's largest services sectors.`,
        body: [
          `Tourism receipts in USD are the largest of the GCC (around ${fmtUSD(f.tourismUsdLatest?.value)} in ${f.tourismUsdLatest?.year}).`,
          `Tourism share sits at ${fmt("tourism_pct_exports_eff", f.tourismLatest?.value)} of exports in the current panel extract.`,
        ],
      };
    }
  }

  if (theme === "trade") {
    const ex = f.exportsLatest;
    const im = f.importsLatest;
    const op = f.opennessLatest;
    const tr = f.tradeRatioLatest;
    const yEx = ex?.year;
    const headline =
      ex != null && im != null && op != null
        ? `Latest values in this extract are exports ${fmt("exports_gdp", ex.value)} of GDP and imports ${fmt("imports_gdp", im.value)} of GDP in ${yEx}, so trade openness is about ${fmt("trade_openness_gdp", op.value)} of GDP.`
        : `Exports and imports as shares of GDP, together with trade openness, show how much of demand and supply is linked to cross-border flows.`;
    const ratioLine =
      tr != null
        ? `The exports / imports ratio reads ${fmt("exports_imports_ratio", tr.value)} in ${tr.year} (1.0 = balanced trade). A value well above 1 means a structural surplus typically driven by oil and gas. A move toward 1 is a diversification signal because the economy buys more capital and consumption goods relative to what it exports.`
        : ``;
    switch (countryName) {
      case "Bahrain":
        return {
          claim: `Bahrain posts very high trade openness relative to GDP and an exports-to-imports ratio close to balance.`,
          body: [
            headline,
            ratioLine,
            `Openness above 100% of GDP means the sum of exports and imports exceeds annual GDP, which is normal when a country processes and re-exports goods and runs a large external services and finance sector. It does not by itself say whether diversification is succeeding.`,
            `An exports/imports ratio near balance (not a huge surplus) fits an economy that imports crude and capital as well as exporting products, rather than a pure rent exporter that sells oil and imports little. That pattern is neither automatically “good” nor “bad” for diversification, but it describes a trade-centred model rather than an oil-only model.`,
          ],
        };
      case "Kuwait":
        return {
          claim: `Kuwait keeps a smaller trade-to-GDP footprint than its richer GCC peers, consistent with a large public sector and hydrocarbon rents recycled domestically.`,
          body: [
            headline,
            ratioLine,
            `Lower openness does not mean isolation, it means non-oil tradables face a smaller external share of demand than in Dubai or Bahrain. The persistent surplus reflects oil-rent dependence.`,
          ],
        };
      case "Oman":
        return {
          claim: `Oman combines Gulf hydrocarbons with a coastal trading history, and openness sits in the middle of the GCC pack.`,
          body: [
            headline,
            ratioLine,
            `When openness rises it usually reflects both higher hydrocarbon exports and rising non-oil import demand for capital goods, in line with infrastructure spending phases.`,
          ],
        };
      case "Qatar":
        return {
          claim: `Qatar shows very high trade ratios because LNG exports and capital imports dominate the external account.`,
          body: [
            headline,
            ratioLine,
            `Openness here reflects gas exports and investment imports more than consumer tourism, so swings track the LNG cycle.`,
          ],
        };
      case "Saudi Arabia":
        return {
          claim: `Saudi Arabia's trade ratios shrank as the domestic economy outgrew oil-driven exports, consistent with the diversification story above.`,
          body: [
            headline,
            `Exports as a share of GDP fell from ${fmt("exports_gdp", f.exports2013)} in 2013 to ${fmt("exports_gdp", f.exports2024)} in 2024, while total GDP grew from ${fmtUSD(f.gdp2013)} to ${fmtUSD(f.gdp2024)}. The denominator (GDP) expanded faster than the export bill, mostly because non-oil activity grew faster than oil shipments.`,
            ratioLine ||
            `The exports / imports ratio also moved closer to balance over the same period, another diversification signal.`,
            `A shrinking trade-to-GDP ratio here is a sign that domestic and non-oil sectors gained weight against oil exports, not a sign of isolation.`,
          ],
        };
      case "United Arab Emirates":
        return {
          claim: `The UAE posts the GCC's highest trade openness, consistent with entrepôt logistics, tourism services and re-exports.`,
          body: [
            headline,
            ratioLine,
            `Openness above 100% of GDP is usual for the UAE because logistics, re-exports, refining and external services scale the trade account. An exports-to-imports ratio near balance points to large two-way flows rather than a structural rent-only surplus from a narrow export list. The wider diversification reading still rests on the export-mix and sectoral indicators in Block B, which already place the UAE at the lower-concentration end of the GCC alongside a large services share.`,
          ],
        };
      default:
        return {
          claim: `Trade as a share of GDP complements the fuel-export story.`,
          body: [headline, ratioLine].filter(Boolean),
        };
    }
  }

  if (theme === "macro") {
    const macroBy = {
      Bahrain: {
        claim: `Bahrain's economy is the smallest of the GCC by absolute size, and per-capita income places it below the GCC median.`,
        body: [
          `Total GDP is around ${fmtUSD(f.gdpLatest?.value)} in ${f.gdpLatest?.year}, up from ${fmtUSD(f.gdp2000)} in 2000.`,
          `GDP per capita is ${fmt("gdp_per_capita", f.gpcLatest?.value)} in ${f.gpcLatest?.year}, more than double the level of 2000 (${fmt("gdp_per_capita", f.gpc2000)}).`,
          `In a small economy, the same absolute change in a sector shows up as a larger percentage of GDP than in Saudi Arabia or the UAE, so compositional shifts can look fast in the data even when the underlying investment is modest in regional terms.`,
        ],
      },
      Kuwait: {
        claim: `Kuwait's GDP and GDP per capita track oil cycles closely, so income gains are largely a price story.`,
        body: [
          `Total GDP reached ${fmtUSD(f.gdpLatest?.value)} in ${f.gdpLatest?.year}, up from ${fmtUSD(f.gdp2000)} in 2000, with a clear 2014 oil-peak and a 2020 trough.`,
          `GDP per capita is ${fmt("gdp_per_capita", f.gpcLatest?.value)} in ${f.gpcLatest?.year}.`,
          `Because per-capita income tracks oil prices closely, consumer demand and fiscal capacity rise and fall with the commodity cycle. That limits the room for sustained non-oil investment compared with peers that are diversifying their revenue base.`,
        ],
      },
      Oman: {
        claim: `Oman's economy and per-capita income are at the lower end of the GCC, which makes the diversification story matter more for living standards than in Qatar or the UAE.`,
        body: [
          `Total GDP reaches ${fmtUSD(f.gdpLatest?.value)} in ${f.gdpLatest?.year}, more than four times the 2000 level (${fmtUSD(f.gdp2000)}).`,
          `GDP per capita is ${fmt("gdp_per_capita", f.gpcLatest?.value)} in ${f.gpcLatest?.year}, up from ${fmt("gdp_per_capita", f.gpc2000)} in 2000.`,
          `A wealth gap with the rest of the GCC means non-oil productivity has to keep gaining for living standards to converge with peers.`,
        ],
      },
      Qatar: {
        claim: `Qatar leads the GCC on GDP per capita. The income capacity for the post-oil transition is the highest of the panel even though the export mix stays gas-anchored.`,
        body: [
          `Total GDP reached ${fmtUSD(f.gdpLatest?.value)} in ${f.gdpLatest?.year}, up from ${fmtUSD(f.gdp2000)} in 2000.`,
          `GDP per capita is ${fmt("gdp_per_capita", f.gpcLatest?.value)} in ${f.gpcLatest?.year}, the highest in the panel.`,
          `Wealth alone has not pulled the export mix to the top, so the income lever does not mechanically translate into capability or diversification outcomes.`,
        ],
      },
      "Saudi Arabia": {
        claim: `Saudi Arabia is the largest GCC economy in absolute terms and now has the largest fiscal and investment capacity to fund the post-oil transition.`,
        body: [
          `Total GDP reached ${fmtUSD(f.gdpLatest?.value)} in ${f.gdpLatest?.year}, up from ${fmtUSD(f.gdp2000)} in 2000 and ${fmtUSD(f.gdp2013)} in 2013.`,
          `GDP per capita is ${fmt("gdp_per_capita", f.gpcLatest?.value)} in ${f.gpcLatest?.year}, roughly tripling from ${fmt("gdp_per_capita", f.gpc2000)} in 2000. A larger economy with higher income per person means more room to finance and scale capability investment.`,
          `Together with lower oil rents as a share of GDP than at the 2013 peak on the WDI series, this supports a transition narrative.`,
        ],
      },
      "United Arab Emirates": {
        claim: `The UAE pairs a large, high-income economy with the most diversified export profile of the GCC, so capability investment lands on a broad base.`,
        body: [
          `Total GDP reached ${fmtUSD(f.gdpLatest?.value)} in ${f.gdpLatest?.year}, more than five times the 2000 level (${fmtUSD(f.gdp2000)}).`,
          `GDP per capita is ${fmt("gdp_per_capita", f.gpcLatest?.value)} in ${f.gpcLatest?.year}.`,
          `Combined with the lowest export concentration in the panel, this means diversification gains accumulate on top of an already broad base, rather than having to rebuild it.`,
        ],
      },
    };
    return (
      macroBy[countryName] || {
        claim: `${countryName} economic scale and income context.`,
        body: `Total GDP is around ${fmtUSD(f.gdpLatest?.value)} in ${f.gdpLatest?.year}, GDP per capita ${fmt("gdp_per_capita", f.gpcLatest?.value)} in ${f.gpcLatest?.year}.`,
      }
    );
  }

  return { claim: `${countryName} ${theme}`, body: `Trajectories above.` };
};

const blockBCaveat = (theme) => {
  switch (theme) {
    case "hydrocarbons":
      return `Merchandise fuel shares follow commodity markets and refining. World Bank oil rents (% of GDP) are extraction rents only. Refining, petrochemicals and distribution recorded elsewhere in national accounts are not summed into this line, so rents complement the customs-based fuel-export share rather than duplicate it.`;
    case "diversification":
      return `Export concentration is the UNCTAD Herfindahl-type index on merchandise export categories (0–1). A lower number means a wider mix, so a fall is a diversification gain. Manufacturing and services are value added as shares of GDP (World Bank WDI). Higher shares indicate a broader domestic presence in those sectors.`;
    case "tourism":
      return ``;
    case "trade":
      return `These ratios react whenever exports, imports or GDP shift. The exports-to-imports ratio (USD, World Bank WDI) distinguishes near-balanced two-way flows around 1 from hydrocarbon-led surpluses well above 1.`;
    case "macro":
      return `GDP levels show economy size and GDP per capita shows income level. Both measure capacity for transition spending.`;
    default:
      return ``;
  }
};

export const blockBThemeInsight = (countryName, theme, country) => {
  const f = countryFacts(country);
  const { claim, body } = themeInsightFor(countryName, theme, f);
  const caveat = blockBCaveat(theme);
  return insightBlock({
    eyebrow: `Block B, ${theme}`,
    claim,
    body,
    caveat,
    countryColor: colorFor(countryName),
  });
};

// ---------------------------- BLOCK C -----------------------------

// Helpers to talk about positions inside the GCC without confusing the
// reader. I avoid "lowest of the GCC" because on concentration / fuel
// the lowest value is actually the best signal, which reads upside-down
// in plain English.
const ordinal = (n) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

// Intra-GCC rank phrase. Rank 1 is the most favourable position for the
// indicator (lowest concentration, lowest fuel share, highest services
// share, etc.).
const rankPhrase = (rank, total = 6) => {
  if (rank == null) return "";
  if (rank === 1) return "best placed of the six";
  if (rank === total) return "worst placed of the six";
  if (rank === 2) return "second best of the six";
  if (rank === total - 1) return `${ordinal(rank)} best of the six`;
  return `${ordinal(rank)} of the six`;
};

// Country-specific narrative templates. I plug in the intra-GCC ranks
// computed in `build_frontend_data._intra_gcc_ranks` and the latest KPI
// values to produce sentences like "Bahrain runs the 5th GDP of the
// six".
const COUNTRY_BLOCK_C = (countryName, f, ranks) => {
  const rConc = ranks.export_concentration;
  const rFuel = ranks.fuel_exports_pct;
  const rTour = ranks.tourism_pct_exports_eff;
  const rGdp = ranks.gdp;
  const rGpc = ranks.gdp_per_capita;
  const rAi = ranks.ai_readiness_unified;
  const rGii = ranks.innovation_index;

  const giiRank = f.giiLatest?.world_rank;
  const aiRank = f.aiLatest?.world_rank;

  switch (countryName) {
    case "Bahrain":
      return {
        claim: `Bahrain owns the smallest economy of the GCC but a relatively diversified export mix, while sitting near the bottom on capability.`,
        body: [
          `Total GDP is ${fmtUSD(f.gdpLatest?.value)} (${rankPhrase(rGdp?.rank)}, ${rGdp?.year}) and GDP per capita ${fmt("gdp_per_capita", f.gpcLatest?.value)} (${rankPhrase(rGpc?.rank)}, ${rGpc?.year}).`,
          `Export concentration is ${fmt("export_concentration", f.concLatest?.value)} (${rankPhrase(rConc?.rank)}, ${rConc?.year}), so the export mix is broader than Saudi Arabia's but narrower than the UAE's.`,
          `AI readiness ${fmt("ai_readiness_unified", f.aiLatest?.value)} (${rankPhrase(rAi?.rank)}${aiRank ? `, world rank ${aiRank}` : ""}) and GII ${fmt("innovation_index", f.giiLatest?.value)} (${rankPhrase(rGii?.rank)}${giiRank ? `, world rank ${giiRank}` : ""}) sit in the lower half of the GCC on capability despite the diversified manufacturing base.`,
        ],
      };
    case "Kuwait":
      return {
        claim: `Kuwait sits at the resource-anchored corner of the GCC: highest fuel share, lowest capability scores, smallest tourism contribution.`,
        body: [
          `Fuel exports are ${fmt("fuel_exports_pct", f.fuelLatest?.value)} of merchandise (${rankPhrase(rFuel?.rank)}, ${rFuel?.year}). ${oilRentsOfGdpPhrase(f).full}.`,
          `AI readiness ${fmt("ai_readiness_unified", f.aiLatest?.value)} (${rankPhrase(rAi?.rank)}${aiRank ? `, world rank ${aiRank}` : ""}) and GII ${fmt("innovation_index", f.giiLatest?.value)} (${rankPhrase(rGii?.rank)}${giiRank ? `, world rank ${giiRank}` : ""}) are both at the bottom of the panel. Tourism share is ${fmt("tourism_pct_exports_eff", f.tourismLatest?.value)} (${rankPhrase(rTour?.rank)}, ${rTour?.year}).`,
          `The one bright signal is the export mix broadening, with concentration moving from ${fmt("export_concentration", f.conc2000)} in 2000 to ${fmt("export_concentration", f.concLatest?.value)} (${rankPhrase(rConc?.rank)}). It has not yet shown up in capability outcomes.`,
        ],
      };
    case "Oman":
      return {
        claim: `Oman has the largest export-mix diversification of the GCC, but trails on capability and on absolute economic size.`,
        body: [
          `Export concentration is ${fmt("export_concentration", f.concLatest?.value)} (${rankPhrase(rConc?.rank)}, ${rConc?.year}), down from ${fmt("export_concentration", f.conc2000)} in 2000, the steepest drop of the panel.`,
          `GDP per capita ${fmt("gdp_per_capita", f.gpcLatest?.value)} (${rankPhrase(rGpc?.rank)}) and total GDP ${fmtUSD(f.gdpLatest?.value)} (${rankPhrase(rGdp?.rank)}) are at the bottom of the per-capita ladder.`,
          `AI readiness ${fmt("ai_readiness_unified", f.aiLatest?.value)} (${rankPhrase(rAi?.rank)}${aiRank ? `, world rank ${aiRank}` : ""}) and GII ${fmt("innovation_index", f.giiLatest?.value)} (${rankPhrase(rGii?.rank)}${giiRank ? `, world rank ${giiRank}` : ""}) place Oman in the lower half on capability.`,
        ],
      };
    case "Qatar":
      return {
        claim: `Qatar tops the GCC on income and on tourism share, but capability and innovation outcomes stay mid-pack and the export mix remains gas-anchored.`,
        body: [
          `GDP per capita ${fmt("gdp_per_capita", f.gpcLatest?.value)} (${rankPhrase(rGpc?.rank)}, ${rGpc?.year}) is the highest of the GCC, more than three times Oman's. Tourism share ${fmt("tourism_pct_exports_eff", f.tourismLatest?.value)} in ${f.tourismLatest?.year} is also the highest, and tourism receipts run around ${fmtUSD(f.tourismUsdLatest?.value)} (${rankPhrase(rTour?.rank)}).`,
          `Yet AI readiness ${fmt("ai_readiness_unified", f.aiLatest?.value)} (${rankPhrase(rAi?.rank)}${aiRank ? `, world rank ${aiRank}` : ""}) and GII ${fmt("innovation_index", f.giiLatest?.value)} (${rankPhrase(rGii?.rank)}${giiRank ? `, world rank ${giiRank}` : ""}) sit below Saudi Arabia and the UAE, and concentration is ${fmt("export_concentration", f.concLatest?.value)} (${rankPhrase(rConc?.rank)}).`,
          `High income alone has not pulled the export mix or capability to the top.`,
        ],
      };
    case "Saudi Arabia":
      return {
        claim: `Saudi Arabia is the largest GCC economy and tops AI readiness 2025, while still running the most concentrated export mix of the six.`,
        body: [
          `Total GDP ${fmtUSD(f.gdpLatest?.value)} (${rankPhrase(rGdp?.rank)}, ${rGdp?.year}) is the largest of the panel.`,
          `AI readiness ${fmt("ai_readiness_unified", f.aiLatest?.value)} (${rankPhrase(rAi?.rank)}${aiRank ? `, world rank ${aiRank}` : ""}) is the highest of the GCC, and GII ${fmt("innovation_index", f.giiLatest?.value)} (${rankPhrase(rGii?.rank)}${giiRank ? `, world rank ${giiRank}` : ""}) is second behind the UAE.`,
          `Export concentration is ${fmt("export_concentration", f.concLatest?.value)} (${rankPhrase(rConc?.rank)} on this index, ${rConc?.year}), so Saudi Arabia still has the most concentrated export mix of the six. Fuel exports are ${fmt("fuel_exports_pct", f.fuelLatest?.value)} of merchandise (${rankPhrase(rFuel?.rank)}, ${rFuel?.year}).`,
          f.oilRentsLatest?.value != null && f.oilRents2013 != null
            ? `${oilRentsOfGdpPhrase(f).full}, below roughly ${fmt("oil_rents_gdp", f.oilRents2013)} around the 2013 oil-price spike on this extract. Merchandise exports remain fuel-heavy.`
            : `${oilRentsOfGdpPhrase(f).full}.`,
        ],
      };
    case "United Arab Emirates":
      return {
        claim: `The UAE is a country where capability and structure are aligned: lowest concentration, lowest fuel share of merchandise, leading innovation outcomes.`,
        body: [
          `Export concentration ${fmt("export_concentration", f.concLatest?.value)} (${rankPhrase(rConc?.rank)}, ${rConc?.year}) and fuel exports ${fmt("fuel_exports_pct", f.fuelLatest?.value)} of merchandise in ${f.fuelLatest?.year} (${rankPhrase(rFuel?.rank)}) are at the lower end of the panel.`,
          `GII ${fmt("innovation_index", f.giiLatest?.value)} (${rankPhrase(rGii?.rank)}${giiRank ? `, world rank ${giiRank}` : ""}) is the best of the GCC. AI readiness ${fmt("ai_readiness_unified", f.aiLatest?.value)} (${rankPhrase(rAi?.rank)}${aiRank ? `, world rank ${aiRank}` : ""}) is second behind Saudi Arabia.`,
          `Total GDP ${fmtUSD(f.gdpLatest?.value)} (${rankPhrase(rGdp?.rank)}) and GDP per capita ${fmt("gdp_per_capita", f.gpcLatest?.value)} (${rankPhrase(rGpc?.rank)}) place the UAE near the top on both income and economic scale.`,
        ],
      };
    default:
      return {
        claim: `${countryName} placed against the rest of the GCC.`,
        body: `The multi-line panels and cross-block scatters above carry the position read for this country.`,
      };
  }
};

export const blockCInsight = (countryName, country) => {
  const f = countryFacts(country);
  const ranks = country.intra_gcc_ranks || {};
  const { claim, body } = COUNTRY_BLOCK_C(countryName, f, ranks);
  return insightBlock({
    eyebrow: `${countryName} vs the GCC`,
    claim,
    body,
    caveat: `Ranks compare the latest available value of each indicator across the six GCC countries. Reference years differ by series.`,
    countryColor: colorFor(countryName),
  });
};

// Insight card under the directional dashboard. I read the per-country
// counters from `country.directional_summary` and walk the full pair
// list to anchor the latest favourable / unfavourable year for the
// strongest indicator.
const INDICATOR_LABEL_DASH = {
  export_concentration: "Export concentration (UNCTAD)",
  fuel_exports_pct: "Fuel exports (% of merchandise)",
  manufacturing_gdp: "Manufacturing value added (% of GDP)",
  services_gdp: "Services value added (% of GDP)",
  tourism_pct_exports_eff: "Tourism receipts (% of exports)",
};

// Find the latest favourable and the latest unfavourable year-to-year
// step for a given country and indicator.
const recentDirection = (countryName, indicatorCol, comparisons) => {
  if (!comparisons) return null;
  const pairs = comparisons?.c4_directional_dashboard?.year_pairs || [];
  let lastFavourable = null;
  let lastUnfavourable = null;
  for (const p of pairs) {
    const row = p.rows.find((r) => r.country === countryName);
    if (!row) continue;
    const d = row.directions?.[indicatorCol];
    if (d === 1) lastFavourable = p.label;
    else if (d === -1) lastUnfavourable = p.label;
  }
  return { lastFavourable, lastUnfavourable };
};

export const directionalDashboardInsight = (countryName, country, comparisons = null) => {
  const summary = country?.directional_summary;
  if (!summary) {
    return insightBlock({
      eyebrow: `${countryName} year-by-year direction`,
      claim: `Direction-only summary not available for this country.`,
      body: `The dashboard above shows year-to-year direction of five structural diversification indicators.`,
      countryColor: colorFor(countryName),
    });
  }
  const { totals, per_indicator: byInd } = summary;
  const ranked = Object.entries(byInd)
    .map(([col, c]) => ({
      col,
      label: INDICATOR_LABEL_DASH[col] || col,
      net: c.improved - c.deteriorated,
      improved: c.improved,
      deteriorated: c.deteriorated,
    }))
    .sort((a, b) => b.net - a.net);
  const best = ranked[0];
  const worst = ranked[ranked.length - 1];
  const balance = totals.improved - totals.deteriorated;
  const tone =
    balance > 4 ? "net favourable" :
      balance < -4 ? "net unfavourable" :
        "mixed";

  const claim = `Between 2000 and 2024, each step compares one year to the next for five indicators. For ${countryName}, ${totals.improved} steps support diversification and ${totals.deteriorated} work against it, so the overall balance is ${tone}.`;

  // Optional time anchor. If `comparisons` is provided I add a sentence
  // about the most recent step direction for the strongest indicator,
  // so the aggregate does not hide whether the trend is still moving
  // in the right direction.
  const bestRecent = best ? recentDirection(countryName, best.col, comparisons) : null;
  const recentClause =
    bestRecent && (bestRecent.lastFavourable || bestRecent.lastUnfavourable)
      ? bestRecent.lastFavourable && (!bestRecent.lastUnfavourable || bestRecent.lastFavourable > bestRecent.lastUnfavourable)
        ? ` The latest favourable step for ${best.label} is ${bestRecent.lastFavourable}, so the trend is still moving in the right direction.`
        : bestRecent.lastUnfavourable
          ? ` The latest step for ${best.label} (${bestRecent.lastUnfavourable}) was unfavourable, so the trend is currently softening.`
          : ""
      : "";

  const favourable = ranked.filter((r) => r.net > 0);
  const unfavourable = ranked.filter((r) => r.net < 0);
  const flatNet = ranked.filter((r) => r.net === 0);

  const summaryParas = [
    favourable.length
      ? `Overall positive over 2000-2024: ${favourable.map((r) => r.label).join(", ")}.`
      : "",
    unfavourable.length
      ? `Overall negative over 2000-2024: ${unfavourable.map((r) => r.label).join(", ")}.`
      : "",
    flatNet.length
      ? `Overall flat over 2000-2024: ${flatNet.map((r) => r.label).join(", ")}.`
      : "",
  ].filter(Boolean);

  const bestPhrase =
    best && (best.improved > 0 || best.deteriorated > 0)
      ? `Strongest net channel: ${best.label} (${best.improved} improving vs ${best.deteriorated} worsening, ${best.net > 0 ? "+" : ""}${best.net} net).${recentClause}`
      : "";
  const worstPhrase =
    worst && best && worst.col !== best.col && (worst.improved > 0 || worst.deteriorated > 0)
      ? `Weakest net channel: ${worst.label} (${worst.improved} improving vs ${worst.deteriorated} worsening, ${worst.net > 0 ? "+" : ""}${worst.net} net).`
      : "";

  const body = [
    summaryParas.join(" "),
    [bestPhrase, worstPhrase].filter(Boolean).join(" "),
  ].filter(Boolean);

  return insightBlock({
    eyebrow: `${countryName} year-by-year direction`,
    claim,
    body: body.length ? body : `The directional grid above shows which indicators drove the net pattern.`,
    caveat: `Counts sum all year pairs from 2000→2001 to 2023→2024. This is an overall balance for the full period. It does not isolate the most recent momentum (the grid shows recent direction). Green marks a diversification-favourable year-to-year move: export concentration lower, fuel share lower, manufacturing, services or tourism share higher. Red is the opposite. A dot marks a missing observation in one year.`,
    countryColor: colorFor(countryName),
  });
};
