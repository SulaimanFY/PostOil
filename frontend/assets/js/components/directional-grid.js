// Directional dashboard (+1 / -1) rendered as a styled <table>.
//
// I encode two pieces of information per cell:
//   - the arrow shows the actual numerical direction of the indicator
//     (sign of the delta)
//   - the cell colour shows the diversification reading
//     (improvement vs deterioration)
//
// For lower-is-better indicators (export concentration, fuel exports)
// a downward arrow is therefore green because the value going down is
// an improvement.
import { GCC_ORDER, indicatorMeta } from "../theme.js";

const arrowFor = (delta) => {
  if (delta == null) return "·";
  if (delta > 0) return "▲";
  if (delta < 0) return "▼";
  return "■";
};

const cellClass = (direction) => {
  if (direction === 1) return "heatmap-cell pos";
  if (direction === -1) return "heatmap-cell neg";
  if (direction === 0) return "heatmap-cell flat";
  return "heatmap-cell na";
};

/**
 * @param {HTMLElement} target
 * @param {{
 *   pairs: {label:string, rows: {country:string, slug:string, directions:Object}[]}[],
 *   indicators: {col:string, lower_is_better:boolean}[],
 *   highlight?: string,
 *   start?: number,
 *   limit?: number,
 * }} opts
 */
export const renderDirectionalGrid = (target, opts) => {
  const {
    pairs = [],
    indicators = [],
    highlight,
    start = 0,
    limit = pairs.length,
  } = opts;

  target.innerHTML = "";
  if (!pairs.length || !indicators.length) {
    target.innerHTML = `<div class="empty">No directional data.</div>`;
    return;
  }

  const slice = pairs.slice(start, start + limit);

  const wrap = document.createElement("div");
  wrap.className = "heatmap-wrap";

  const table = document.createElement("table");
  table.className = "heatmap-table";
  table.setAttribute("aria-label", "Year-by-year directional dashboard");

  const thead = document.createElement("thead");
  const trHead = document.createElement("tr");
  const cornerTh = document.createElement("th");
  cornerTh.textContent = "";
  trHead.appendChild(cornerTh);
  for (const ind of indicators) {
    const meta = indicatorMeta(ind.col);
    const th = document.createElement("th");
    const arrowDir = ind.lower_is_better ? "↓ better" : "↑ better";
    th.innerHTML = `${meta.short}<br><span class="subtle text-xs">${arrowDir}</span>`;
    trHead.appendChild(th);
  }
  thead.appendChild(trHead);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  // We pivot: rows = country, columns = indicator, but with multiple year-pairs we
  // show one block per pair with country rows. To keep it compact we group.
  for (const pair of slice) {
    const labelRow = document.createElement("tr");
    const labelCell = document.createElement("td");
    labelCell.colSpan = indicators.length + 1;
    labelCell.textContent = pair.label;
    labelCell.style.fontWeight = "600";
    labelCell.style.color = "var(--text-muted)";
    labelCell.style.background = "var(--surface-soft)";
    labelCell.style.padding = "8px 10px";
    labelCell.style.textAlign = "left";
    labelRow.appendChild(labelCell);
    tbody.appendChild(labelRow);

    const order = pair.rows
      .slice()
      .sort(
        (a, b) =>
          GCC_ORDER.indexOf(a.country) - GCC_ORDER.indexOf(b.country),
      );

    for (const row of order) {
      const tr = document.createElement("tr");
      const isActive = highlight && row.slug === highlight;
      const isDimmed = highlight && !isActive;
      if (isActive) tr.classList.add("row-active");
      if (isDimmed) tr.classList.add("row-dimmed");
      const labelTd = document.createElement("td");
      labelTd.className = "label";
      labelTd.textContent = row.country;
      tr.appendChild(labelTd);
      for (const ind of indicators) {
        const dir = row.directions[ind.col];
        const delta = row.deltas ? row.deltas[ind.col] : null;
        const td = document.createElement("td");
        td.className = cellClass(dir);
        const semLabel =
          dir === 1
            ? "improvement"
            : dir === -1
              ? "deterioration"
              : dir === 0
                ? "flat"
                : "missing";
        const deltaLabel = delta == null ? "" : ` (Δ ${delta > 0 ? "+" : ""}${delta})`;
        td.title = `${row.country} · ${ind.col} · ${pair.label}: ${semLabel}${deltaLabel}`;
        td.textContent = arrowFor(delta);
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
  }

  table.appendChild(tbody);
  wrap.appendChild(table);
  target.appendChild(wrap);
};

/**
 * Build a paginator for the directional grid.
 * Returns an HTMLElement to inject as controls; the caller wires up onChange.
 */
export const renderPaginator = (target, opts) => {
  const { totalPairs, perPage, current, onChange } = opts;
  target.innerHTML = "";
  if (totalPairs <= perPage) return;
  const wrap = document.createElement("div");
  wrap.className = "pill-row";
  const pages = Math.ceil(totalPairs / perPage);
  for (let i = 0; i < pages; i++) {
    const start = i * perPage;
    const end = Math.min(start + perPage, totalPairs) - 1;
    const btn = document.createElement("button");
    btn.className = "pill";
    if (i === current) btn.classList.add("active");
    btn.textContent = `${start + 1}-${end + 1}`;
    btn.setAttribute("type", "button");
    btn.setAttribute("aria-label", `Show year-pair block ${start + 1} to ${end + 1}`);
    btn.addEventListener("click", () => onChange(i));
    wrap.appendChild(btn);
  }
  target.appendChild(wrap);
};
