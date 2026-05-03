// Time-series line charts. Two flavours:
//   - `renderLineChart`  for one country (used inside Block B)
//   - `renderMultiLineChart` for the GCC overview, with the active
//     country highlighted and the rest dimmed.
//
// Both use D3 v7. I keep the axis logic adaptive so the charts read
// well across container widths, including phone screens.
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { colorFor } from "../theme.js";
import {
  tickFormatterByIndicator,
  formatValueByIndicator,
} from "../formatters.js";

const DEFAULT_HEIGHT = 280;

// --- shared helpers ---------------------------------------------------------

const computeXTicks = (xScale, innerW) => {
  const [y0, y1] = xScale.domain();
  const span = Math.max(1, Math.round(y1 - y0));
  // Roughly one tick per ~64px. Floor to a clean step (1, 2, 5, 10).
  const targetCount = Math.max(2, Math.round(innerW / 64));
  const rawStep = Math.max(1, Math.ceil(span / targetCount));
  const niceSteps = [1, 2, 5, 10];
  const step =
    niceSteps.find((s) => s >= rawStep) ?? Math.ceil(rawStep / 5) * 5;
  const start = Math.ceil(y0 / step) * step;
  const ticks = [];
  for (let v = start; v <= y1; v += step) ticks.push(v);
  return { ticks, step };
};

const applyAdaptiveXAxis = (xAxisG, xScale, innerW) => {
  const { ticks, step } = computeXTicks(xScale, innerW);
  const fmt = d3.format("d");
  xAxisG.call(
    d3.axisBottom(xScale).tickValues(ticks).tickFormat(fmt),
  );
  // Estimate label width: 4 chars × 7px ~ 28px. Rotate if too dense.
  const px = innerW / Math.max(1, ticks.length - 1);
  if (px < 36) {
    xAxisG
      .selectAll("text")
      .attr("text-anchor", "end")
      .attr("transform", "rotate(-35)")
      .attr("dx", "-0.5em")
      .attr("dy", "0.25em");
  }
  return { ticks, step };
};

// --- single line ------------------------------------------------------------

/**
 * Render a single-series line chart inside `target`.
 */
export const renderLineChart = (target, opts) => {
  const {
    series = [],
    indicator,
    color = "#0f766e",
    minYear,
    yDomain,
    markYear,
    height = DEFAULT_HEIGHT,
  } = opts;

  target.innerHTML = "";
  if (!series.length) {
    target.innerHTML = `<div class="empty">No data available for this indicator.</div>`;
    return;
  }

  const filtered =
    minYear != null ? series.filter((d) => d.year >= minYear) : series;
  const allInWindow = filtered
    .filter((d) => d.value != null)
    .sort((a, b) => a.year - b.year);
  const points = allInWindow.filter((d) => !d.is_revision_artefact);
  if (!points.length) {
    target.innerHTML = `<div class="empty">No data in window.</div>`;
    return;
  }

  const width = target.clientWidth || 480;
  const margin = { top: 12, right: 18, bottom: 38, left: 50 };
  const innerW = Math.max(50, width - margin.left - margin.right);
  const innerH = Math.max(80, height - margin.top - margin.bottom);

  const x = d3
    .scaleLinear()
    .domain(d3.extent(points, (d) => d.year))
    .range([0, innerW]);

  const yExtent = yDomain || d3.extent(points, (d) => d.value);
  const yPad = (yExtent[1] - yExtent[0]) * 0.08 || 1;
  const y = d3
    .scaleLinear()
    .domain([yExtent[0] - yPad, yExtent[1] + yPad])
    .nice()
    .range([innerH, 0]);

  const svg = d3
    .select(target)
    .append("svg")
    .attr("class", "chart")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMinYMin meet");

  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  g.append("g")
    .attr("class", "chart-grid")
    .call(d3.axisLeft(y).ticks(5).tickSize(-innerW).tickFormat(""));

  const xAxisG = g
    .append("g")
    .attr("class", "chart-axis")
    .attr("transform", `translate(0,${innerH})`);
  applyAdaptiveXAxis(xAxisG, x, innerW);

  g.append("g")
    .attr("class", "chart-axis")
    .call(d3.axisLeft(y).ticks(5).tickFormat(tickFormatterByIndicator(indicator)));

  if (markYear != null) {
    g.append("line")
      .attr("class", "chart-trend")
      .attr("stroke", "#94a3b8")
      .attr("x1", x(markYear))
      .attr("x2", x(markYear))
      .attr("y1", 0)
      .attr("y2", innerH);
  }

  const line = d3
    .line()
    .x((d) => x(d.year))
    .y((d) => y(d.value))
    .curve(d3.curveMonotoneX);

  g.append("path")
    .attr("d", line(points))
    .attr("class", "chart-line")
    .style("stroke", color)
    .attr("stroke-width", 2.2);

  g.selectAll(".chart-dot")
    .data(points)
    .enter()
    .append("circle")
    .attr("class", "chart-dot")
    .style("fill", color)
    .attr("r", 2.6)
    .attr("cx", (d) => x(d.year))
    .attr("cy", (d) => y(d.value));

  // Hover overlay -----------------------------------------------------------
  const tooltip = d3.select(target).append("div").attr("class", "map-tooltip");
  const focus = g.append("g").style("display", "none");
  focus
    .append("circle")
    .attr("r", 4.5)
    .style("fill", color)
    .attr("stroke", "#fff")
    .attr("stroke-width", 2);

  const bisect = d3.bisector((d) => d.year).left;
  const overlay = g
    .append("rect")
    .attr("width", innerW)
    .attr("height", innerH)
    .attr("fill", "transparent")
    .style("pointer-events", "all")
    .on("mouseenter", () => {
      focus.style("display", null);
      tooltip.classed("show", true);
    })
    .on("mouseleave", () => {
      focus.style("display", "none");
      tooltip.classed("show", false);
    })
    .on("mousemove", (event) => {
      const [mx] = d3.pointer(event, overlay.node());
      const yr = x.invert(mx);
      const i = bisect(points, yr);
      const a = points[i - 1];
      const b = points[i];
      const d = !a ? b : !b ? a : Math.abs(yr - a.year) < Math.abs(yr - b.year) ? a : b;
      if (!d) return;
      focus.attr("transform", `translate(${x(d.year)},${y(d.value)})`);
      tooltip
        .style("left", `${margin.left + x(d.year)}px`)
        .style("top", `${margin.top + y(d.value)}px`)
        .html(`<strong>${d.year}</strong> · ${formatValueByIndicator(indicator, d.value)}`);
    });
};

// --- multi-country ---------------------------------------------------------

/**
 * Multi-country line chart with optional highlight slug and interactive legend.
 */
export const renderMultiLineChart = (target, opts) => {
  const {
    series = [],
    indicator,
    highlight,
    minYear,
    height = 300,
  } = opts;

  target.innerHTML = "";
  const cleaned = series
    .map((s) => {
      const winFiltered = (minYear != null
        ? s.series.filter((p) => p.year >= minYear)
        : s.series
      )
        .filter((p) => p.value != null)
        .sort((a, b) => a.year - b.year);
      const noArtefact = winFiltered.filter((p) => !p.is_revision_artefact);
      return { ...s, series: noArtefact };
    })
    .filter((s) => s.series.length > 0);
  if (!cleaned.length) {
    target.innerHTML = `<div class="empty">No data available.</div>`;
    return;
  }

  const allPoints = cleaned.flatMap((s) => s.series);
  const width = target.clientWidth || 600;
  const margin = { top: 12, right: 132, bottom: 40, left: 50 };
  const innerW = Math.max(80, width - margin.left - margin.right);
  const innerH = Math.max(120, height - margin.top - margin.bottom);

  const x = d3
    .scaleLinear()
    .domain(d3.extent(allPoints, (d) => d.year))
    .range([0, innerW]);

  const yExtent = d3.extent(allPoints, (d) => d.value);
  const yPad = (yExtent[1] - yExtent[0]) * 0.08 || 1;
  const y = d3
    .scaleLinear()
    .domain([yExtent[0] - yPad, yExtent[1] + yPad])
    .nice()
    .range([innerH, 0]);

  const svg = d3
    .select(target)
    .append("svg")
    .attr("class", "chart")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMinYMin meet");

  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  g.append("g")
    .attr("class", "chart-grid")
    .call(d3.axisLeft(y).ticks(5).tickSize(-innerW).tickFormat(""));

  const xAxisG = g
    .append("g")
    .attr("class", "chart-axis")
    .attr("transform", `translate(0,${innerH})`);
  applyAdaptiveXAxis(xAxisG, x, innerW);

  g.append("g")
    .attr("class", "chart-axis")
    .call(d3.axisLeft(y).ticks(5).tickFormat(tickFormatterByIndicator(indicator)));

  const line = d3
    .line()
    .x((d) => x(d.year))
    .y((d) => y(d.value))
    .curve(d3.curveMonotoneX);

  // Each line keeps its own country color. Non-highlighted are faded
  // (opacity ~0.28) so they remain identifiable but don't compete visually.
  const ordered = [...cleaned].sort((a, b) => {
    if (!highlight) return 0;
    if (a.slug === highlight) return 1;
    if (b.slug === highlight) return -1;
    return 0;
  });

  const lineSel = {};
  for (const s of ordered) {
    const isActive = !highlight || s.slug === highlight;
    const path = g
      .append("path")
      .attr("class", `mline mline-${s.slug}`)
      .attr("d", line(s.series))
      .attr("fill", "none")
      .style("stroke", colorFor(s.country))
      .attr("stroke-width", isActive ? 2.4 : 1.6)
      .attr("opacity", isActive ? 1 : 0.28)
      .style("cursor", "pointer");
    lineSel[s.slug] = path;

    if (isActive && highlight) {
      g.selectAll(`.dot-${s.slug}`)
        .data(s.series)
        .enter()
        .append("circle")
        .attr("class", `dot-${s.slug}`)
        .attr("r", 2.6)
        .style("fill", colorFor(s.country))
        .attr("cx", (d) => x(d.year))
        .attr("cy", (d) => y(d.value));
    }
  }

  // Legend interactive: hover lifts a line to full opacity, dims the rest.
  const legendG = svg
    .append("g")
    .attr("transform", `translate(${margin.left + innerW + 14}, ${margin.top})`);

  const setActive = (slug) => {
    cleaned.forEach((s) => {
      const sel = lineSel[s.slug];
      if (!sel) return;
      const active = !slug ? !highlight || s.slug === highlight : s.slug === slug;
      sel
        .attr("opacity", active ? 1 : 0.18)
        .attr("stroke-width", active ? 2.6 : 1.4);
    });
  };

  cleaned
    .slice()
    .sort((a, b) => a.country.localeCompare(b.country))
    .forEach((s, i) => {
      const isHi = highlight && s.slug === highlight;
      const grp = legendG
        .append("g")
        .attr("transform", `translate(0, ${i * 18})`)
        .attr("class", "legend-item")
        .style("cursor", "pointer")
        .on("mouseenter", () => setActive(s.slug))
        .on("mouseleave", () => setActive(null));
      grp
        .append("rect")
        .attr("width", 10)
        .attr("height", 10)
        .attr("rx", 2)
        .attr("y", -1)
        .attr("fill", colorFor(s.country))
        .attr("opacity", highlight && !isHi ? 0.7 : 1);
      grp
        .append("text")
        .attr("x", 14)
        .attr("y", 8)
        .attr("font-size", 11)
        .attr("fill", isHi ? "#0f172a" : "#475569")
        .attr("font-weight", isHi ? 600 : 400)
        .text(s.country);
    });
};
