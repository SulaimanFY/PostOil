// Number and value formatters. Every formatter is null-safe so the same
// helpers work on raw values, missing values and partial KPI entries.
import { indicatorMeta } from "./theme.js";

const NA = "N/A";

export const formatYear = (year) => (year == null ? NA : String(year));

export const formatNumber = (value, digits = 1) => {
  if (value == null || Number.isNaN(value)) return NA;
  if (Math.abs(value) >= 1000) {
    return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
  }
  return value.toLocaleString("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  });
};

export const formatPercent = (value, digits = 1) => {
  if (value == null || Number.isNaN(value)) return NA;
  return `${value.toLocaleString("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  })}%`;
};

export const formatRatio = (value, digits = 3) => {
  if (value == null || Number.isNaN(value)) return NA;
  return value.toLocaleString("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  });
};

export const formatScore = (value, digits = 1) => {
  if (value == null || Number.isNaN(value)) return NA;
  return value.toLocaleString("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  });
};

const compactMoney = (value) => {
  if (value == null || Number.isNaN(value)) return NA;
  const abs = Math.abs(value);
  if (abs >= 1e12) return `$${(value / 1e12).toFixed(2)} T`;
  if (abs >= 1e9) return `$${(value / 1e9).toFixed(2)} B`;
  if (abs >= 1e6) return `$${(value / 1e6).toFixed(1)} M`;
  if (abs >= 1e3) return `$${(value / 1e3).toFixed(1)} K`;
  return `$${value.toFixed(0)}`;
};

const compactGdpPerCapita = (value) => {
  if (value == null || Number.isNaN(value)) return NA;
  if (Math.abs(value) >= 1000) {
    return `$${value.toLocaleString("en-US", {
      maximumFractionDigits: 0,
    })}`;
  }
  return `$${value.toFixed(0)}`;
};

export const formatValueByIndicator = (col, value) => {
  if (value == null || Number.isNaN(value)) return NA;
  const meta = indicatorMeta(col);
  switch (meta.format) {
    case "percent":
      return formatPercent(value, value < 1 ? 3 : 1);
    case "score100":
      return formatScore(value, 1);
    case "money":
      return compactMoney(value);
    case "money_compact":
      return compactGdpPerCapita(value);
    case "ratio":
    default:
      return formatRatio(value, 3);
  }
};

// D3 axis tick formatters. The D3 axis component calls these on every
// tick value and expects a string.
export const tickFormatterByIndicator = (col) => {
  const meta = indicatorMeta(col);
  switch (meta.format) {
    case "percent":
      return (d) => `${formatNumber(d, 1)}%`;
    case "money":
      return (d) => {
        if (Math.abs(d) >= 1e12) return `${(d / 1e12).toFixed(1)}T`;
        if (Math.abs(d) >= 1e9) return `${(d / 1e9).toFixed(1)}B`;
        if (Math.abs(d) >= 1e6) return `${(d / 1e6).toFixed(0)}M`;
        return d.toLocaleString("en-US");
      };
    case "money_compact":
      return (d) => {
        if (Math.abs(d) >= 1000) return `$${(d / 1000).toFixed(0)}k`;
        return `$${d.toFixed(0)}`;
      };
    case "score100":
      return (d) => formatNumber(d, 0);
    case "ratio":
    default:
      return (d) => formatNumber(d, 2);
  }
};

export const indicatorAxisLabel = (col) => {
  const meta = indicatorMeta(col);
  return meta.unit ? `${meta.short} (${meta.unit})` : meta.short;
};

export const sourceLine = (entry) => {
  if (!entry) return "";
  const parts = [];
  if (entry.source) parts.push(entry.source);
  if (entry.year != null) parts.push(`${entry.year}`);
  return parts.join(" · ");
};
