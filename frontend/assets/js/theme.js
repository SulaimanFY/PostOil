// Country palette + indicator metadata.
//
// I keep the country brand colours and the per-indicator metadata in
// one place so every chart, KPI card and axis labels stay consistent
// when I add or rename an indicator.
export const COUNTRY_COLOR = {
  Bahrain: "#dc2626",
  Kuwait: "#2563eb",
  Oman: "#ea580c",
  Qatar: "#7c3aed",
  "Saudi Arabia": "#059669",
  "United Arab Emirates": "#0891b2",
};

export const SLUG_TO_NAME = {
  bahrain: "Bahrain",
  kuwait: "Kuwait",
  oman: "Oman",
  qatar: "Qatar",
  "saudi-arabia": "Saudi Arabia",
  "united-arab-emirates": "United Arab Emirates",
};

export const NAME_TO_SLUG = Object.fromEntries(
  Object.entries(SLUG_TO_NAME).map(([slug, name]) => [name, slug]),
);

export const GCC_ORDER = [
  "Bahrain",
  "Kuwait",
  "Oman",
  "Qatar",
  "Saudi Arabia",
  "United Arab Emirates",
];

export const colorFor = (countryName) => COUNTRY_COLOR[countryName] || "#475569";

// Indicator metadata. Every chart, KPI card and axis label resolves
// labels, units and formatters through this object.
// `lower_is_better: true` means a lower value is the more diversified
// position (concentration, fuel share, oil rents, hydrocarbon GDP
// share).
export const INDICATORS = {
  fuel_exports_pct: {
    label: "Fuel exports",
    short: "Fuel exports",
    unit: "% of merch. exports",
    lower_is_better: true,
    format: "percent",
  },
  oil_rents_gdp: {
    label: "Oil rents",
    short: "Oil rents",
    unit: "% of GDP",
    lower_is_better: true,
    format: "percent",
  },
  hydrocarbon_gdp_share: {
    label: "Hydrocarbon sector share of GDP",
    short: "Hydrocarbon GDP",
    unit: "% of GDP, national accounts",
    lower_is_better: true,
    format: "percent",
  },
  export_concentration: {
    label: "Export concentration",
    short: "Export concentration",
    unit: "0-1, lower = more diversified",
    lower_is_better: true,
    format: "ratio",
  },
  manufacturing_gdp: {
    label: "Manufacturing",
    short: "Manufacturing",
    unit: "% of GDP",
    lower_is_better: false,
    format: "percent",
  },
  services_gdp: {
    label: "Services",
    short: "Services",
    unit: "% of GDP",
    lower_is_better: false,
    format: "percent",
  },
  tourism_pct_exports_eff: {
    label: "Tourism receipts (effective share)",
    short: "Tourism share",
    unit: "% of exports",
    lower_is_better: false,
    format: "percent",
  },
  tourism_receipts_pct_exports: {
    label: "Tourism receipts (WDI series)",
    short: "Tourism share (WDI)",
    unit: "% of exports",
    lower_is_better: false,
    format: "percent",
  },
  tourism_receipts_usd: {
    label: "Tourism receipts",
    short: "Tourism receipts",
    unit: "USD",
    lower_is_better: false,
    format: "money",
  },
  exports_gdp: {
    label: "Exports",
    short: "Exports",
    unit: "% of GDP",
    format: "percent",
  },
  imports_gdp: {
    label: "Imports",
    short: "Imports",
    unit: "% of GDP",
    format: "percent",
  },
  trade_openness_gdp: {
    label: "Trade openness",
    short: "Trade openness",
    unit: "% of GDP",
    format: "percent",
  },
  exports_imports_ratio: {
    label: "Exports / imports ratio",
    short: "Exports / imports",
    unit: "ratio (1.0 = balanced)",
    lower_is_better: true,
    format: "ratio",
  },
  gdp: {
    label: "GDP (total)",
    short: "GDP",
    unit: "USD",
    format: "money",
  },
  gdp_per_capita: {
    label: "GDP per capita",
    short: "GDP per capita",
    unit: "USD",
    format: "money_compact",
  },
  ai_readiness: {
    label: "AI readiness",
    short: "AI readiness",
    unit: "0-100 score",
    format: "score100",
  },
  ai_readiness_unified: {
    label: "AI readiness",
    short: "AI readiness",
    unit: "0-100 score",
    format: "score100",
  },
  innovation_index: {
    label: "Innovation index (GII)",
    short: "Innovation (GII)",
    unit: "0-100 score",
    format: "score100",
  },
};

export const indicatorMeta = (col) =>
  INDICATORS[col] || {
    label: col,
    short: col,
    unit: "",
    format: "ratio",
  };
