// XY scatter for cross-block comparisons.
//
// Each dot is one country. With n = 6, I label every dot with the
// country code (BHR, KWT, OMN, QAT, SAU, UAE) so the reader can place
// each point without having to chase a tooltip.
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { GCC_ORDER, colorFor } from "../theme.js";

const DEFAULT_HEIGHT = 320;
const SHORT_LABEL = {
  Bahrain: "BHR",
  Kuwait: "KWT",
  Oman: "OMN",
  Qatar: "QAT",
  "Saudi Arabia": "SAU",
  "United Arab Emirates": "UAE",
};

const formatLoose = (value) => {
  if (value == null || Number.isNaN(value)) return "N/A";
  if (Math.abs(value) >= 1000) return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
};

/**
 * @param {HTMLElement} target
 * @param {{
 *   points: {country:string,slug:string,x:number,y:number,year?:number}[],
 *   xLabel: string,
 *   yLabel: string,
 *   highlight?: string,
 *   trend?: boolean,
 *   xTickFormat?: (d:number)=>string,
 *   yTickFormat?: (d:number)=>string,
 *   height?: number,
 *   showLegend?: boolean,
 * }} opts
 */
export const renderScatter = (target, opts) => {
  const {
    points = [],
    xLabel,
    yLabel,
    highlight,
    trend = false,
    xTickFormat = (d) => d.toLocaleString("en-US"),
    yTickFormat = (d) => d.toLocaleString("en-US"),
    height = DEFAULT_HEIGHT,
    showLegend = true,
  } = opts;

  target.innerHTML = "";
  const valid = points.filter((p) => p.x != null && p.y != null);
  if (!valid.length) {
    target.innerHTML = `<div class="empty">No data for this view.</div>`;
    return;
  }

  const width = target.clientWidth || 480;
  const margin = { top: 18, right: 56, bottom: 46, left: 60 };
  const innerW = Math.max(80, width - margin.left - margin.right);
  const innerH = Math.max(120, height - margin.top - margin.bottom);

  const xExtent = d3.extent(valid, (d) => d.x);
  const yExtent = d3.extent(valid, (d) => d.y);
  const xPad = (xExtent[1] - xExtent[0]) * 0.08 || 1;
  const yPad = (yExtent[1] - yExtent[0]) * 0.08 || 1;

  const x = d3
    .scaleLinear()
    .domain([xExtent[0] - xPad, xExtent[1] + xPad])
    .nice()
    .range([0, innerW]);
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

  const tooltip = d3.select(target).append("div").attr("class", "map-tooltip");

  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  g.append("g")
    .attr("class", "chart-grid")
    .call(d3.axisLeft(y).ticks(5).tickSize(-innerW).tickFormat(""));

  g.append("g")
    .attr("class", "chart-axis")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x).ticks(6).tickFormat(xTickFormat));

  g.append("g")
    .attr("class", "chart-axis")
    .call(d3.axisLeft(y).ticks(5).tickFormat(yTickFormat));

  // axis labels
  svg
    .append("text")
    .attr("class", "chart-label")
    .attr("text-anchor", "middle")
    .attr("x", margin.left + innerW / 2)
    .attr("y", height - 8)
    .text(xLabel);
  svg
    .append("text")
    .attr("class", "chart-label")
    .attr("text-anchor", "middle")
    .attr("transform", `translate(14, ${margin.top + innerH / 2}) rotate(-90)`)
    .text(yLabel);

  if (trend && valid.length >= 3) {
    const xs = valid.map((p) => p.x);
    const ys = valid.map((p) => p.y);
    const n = valid.length;
    const meanX = d3.mean(xs);
    const meanY = d3.mean(ys);
    const num = d3.sum(valid, (p) => (p.x - meanX) * (p.y - meanY));
    const den = d3.sum(valid, (p) => (p.x - meanX) ** 2);
    if (den > 0) {
      const slope = num / den;
      const intercept = meanY - slope * meanX;
      const xLine = x.domain();
      g.append("line")
        .attr("class", "chart-trend")
        .attr("stroke", "#94a3b8")
        .attr("x1", x(xLine[0]))
        .attr("x2", x(xLine[1]))
        .attr("y1", y(slope * xLine[0] + intercept))
        .attr("y2", y(slope * xLine[1] + intercept));
    }
  }

  const points$ = g
    .selectAll(".scatter-point")
    .data(valid)
    .enter()
    .append("g")
    .attr("class", "scatter-point")
    .attr("transform", (d) => `translate(${x(d.x)},${y(d.y)})`);

  points$
    .append("circle")
    .attr("r", (d) => (highlight && d.slug === highlight ? 8 : 6))
    .attr("fill", (d) => colorFor(d.country))
    .attr("stroke", "#ffffff")
    .attr("stroke-width", (d) => (highlight && d.slug === highlight ? 2.5 : 1.6))
    .attr("opacity", (d) => (highlight && d.slug !== highlight ? 0.6 : 1))
    .style("cursor", "default")
    .on("mouseenter", (event, d) => {
      tooltip.classed("show", true);
      const year = d.year != null ? `<br><span style="opacity:.75">Year: ${d.year}</span>` : "";
      tooltip.html(
        `<strong>${d.country}</strong>${year}<br><span style="opacity:.75">x:</span> ${formatLoose(d.x)}<br><span style="opacity:.75">y:</span> ${formatLoose(d.y)}`,
      );
    })
    .on("mousemove", (event) => {
      const rect = target.getBoundingClientRect();
      tooltip
        .style("left", `${event.clientX - rect.left}px`)
        .style("top", `${event.clientY - rect.top}px`);
    })
    .on("mouseleave", () => {
      tooltip.classed("show", false);
    });

  // Place labels around each point, then resolve overlaps by stacking.
  const placed = valid.map((d) => {
    const px = x(d.x);
    const py = y(d.y);
    const onRight = px <= innerW - 80;
    return {
      d,
      px,
      py,
      lx: onRight ? px + 10 : px - 10,
      ly: py - 9,
      anchor: onRight ? "start" : "end",
    };
  });
  // Naive overlap resolver: if two labels are within 14px on x and y, push later one down.
  placed.sort((a, b) => a.py - b.py || a.lx - b.lx);
  for (let i = 0; i < placed.length; i++) {
    for (let j = 0; j < i; j++) {
      const a = placed[j];
      const b = placed[i];
      if (Math.abs(a.lx - b.lx) < 28 && Math.abs(a.ly - b.ly) < 13) {
        b.ly = a.ly + 13;
      }
    }
  }

  g.append("g")
    .selectAll("text.scatter-label")
    .data(placed)
    .enter()
    .append("text")
    .attr("class", "scatter-label")
    .attr("x", (p) => p.lx)
    .attr("y", (p) => p.ly)
    .attr("text-anchor", (p) => p.anchor)
    .attr("font-size", 10)
    .attr("font-weight", 600)
    .attr("fill", "#0f172a")
    .attr("paint-order", "stroke")
    .attr("stroke", "#ffffff")
    .attr("stroke-width", 3)
    .text((p) => SHORT_LABEL[p.d.country] || p.d.country);

  if (showLegend) {
    const legend = document.createElement("div");
    legend.className = "scatter-legend";
    const seen = new Set();
    for (const p of valid) {
      if (seen.has(p.country)) continue;
      seen.add(p.country);
      const item = document.createElement("span");
      item.className = "scatter-legend-item";
      const dot = document.createElement("span");
      dot.className = "scatter-legend-dot";
      dot.style.background = colorFor(p.country);
      const code = document.createElement("span");
      code.className = "scatter-legend-code";
      code.textContent = SHORT_LABEL[p.country] || p.country;
      const name = document.createElement("span");
      name.className = "scatter-legend-name";
      name.textContent = p.country;
      item.append(dot, code, name);
      legend.appendChild(item);
    }
    target.appendChild(legend);
  }
};

/**
 * One shared legend for all GCC cross-block scatters on the overview page.
 */
export const renderGccScatterLegend = (containerEl) => {
  if (!containerEl) return;
  containerEl.innerHTML = "";
  const legend = document.createElement("div");
  legend.className = "scatter-legend scatter-legend-global";
  for (const country of GCC_ORDER) {
    const item = document.createElement("span");
    item.className = "scatter-legend-item";
    const dot = document.createElement("span");
    dot.className = "scatter-legend-dot";
    dot.style.background = colorFor(country);
    const code = document.createElement("span");
    code.className = "scatter-legend-code";
    code.textContent = SHORT_LABEL[country] || country;
    const name = document.createElement("span");
    name.className = "scatter-legend-name";
    name.textContent = country;
    item.append(dot, code, name);
    legend.appendChild(item);
  }
  containerEl.appendChild(legend);
};
