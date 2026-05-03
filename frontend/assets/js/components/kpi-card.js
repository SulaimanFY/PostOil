// KPI card. Renders one indicator entry: value, year (or period
// label), source text and an optional world rank. Some rows still pass
// `source_url` for legacy series, but I keep hydrocarbon sources plain
// text so readers use the methodology page for links.
import { formatValueByIndicator } from "../formatters.js";
import { indicatorMeta } from "../theme.js";

const escapeHtml = (s) =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
  })[c]);

export const renderKpiCard = (col, entry) => {
  const meta = indicatorMeta(col);
  const value = entry?.value ?? null;
  const year = entry?.year ?? null;
  const periodLabel = entry?.period_label ?? null;
  const source = entry?.source ?? "";
  const sourceUrl = entry?.source_url ?? "";
  const note = entry?.note ?? "";
  const fallback = entry?.is_fallback ? true : false;
  const sourceLabel =
    fallback && source && !String(source).includes("(derived)")
      ? `${source} (derived)`
      : source;

  const valueStr = formatValueByIndicator(col, value);
  const worldRank = entry?.world_rank ?? null;
  const tags = [];
  const yearLabel = periodLabel || (year != null ? String(year) : null);
  if (yearLabel != null) {
    tags.push(`<span class="kpi-tag year">${escapeHtml(yearLabel)}</span>`);
  }
  if (worldRank != null) {
    tags.push(
      `<span class="kpi-tag rank" title="World ranking, source ${escapeHtml(source)}">#${worldRank}</span>`,
    );
  }

  const sourceHtml = sourceUrl
    ? `<a class="kpi-source-link" href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(note || sourceLabel)}">${escapeHtml(sourceLabel)}</a>`
    : `<span title="${escapeHtml(note || sourceLabel)}">${escapeHtml(sourceLabel)}</span>`;

  return `
    <article class="kpi" data-col="${col}">
      <div class="kpi-label">${escapeHtml(meta.label)}</div>
      <div class="kpi-value">${valueStr}</div>
      <div class="kpi-meta">
        ${tags.join("")}
        ${sourceHtml}
      </div>
    </article>
  `;
};

export const renderKpiGrid = (kpiList) =>
  `<div class="subgrid">${kpiList
    .map(({ col, entry }) => renderKpiCard(col, entry))
    .join("")}</div>`;
