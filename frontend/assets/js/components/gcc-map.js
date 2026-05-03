// Interactive GCC map.
//
// I render a standalone SVG fitted to the GCC GeoJSON. Each country is
// filled with a soft tint of its brand colour at rest and the full
// saturated colour on hover or focus. That way the map and the legend
// match instantly.
//
// The component handles hover, keyboard focus and click navigation
// directly (no global event delegation). The default browser focus
// outline is suppressed in styles.css because the colour change is the
// visual feedback I want.
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { colorFor } from "../theme.js";
import { navigate } from "../router.js";

/**
 * @param {HTMLElement} target  Outer wrapper (.map-wrap).
 * @param {{
 *   geojson: object,
 *   activeSlug?: string,
 *   onSelect?: (feature) => void,
 *   showLabels?: boolean,
 * }} opts
 */
export const renderGccMap = (target, opts) => {
  const {
    geojson,
    activeSlug,
    onSelect,
    showLabels = true,
  } = opts;

  target.innerHTML = "";
  if (!geojson || !geojson.features) {
    target.innerHTML = `<div class="empty">Map data unavailable.</div>`;
    return;
  }

  const width = target.clientWidth || 800;
  const height = Math.max(360, Math.min(540, width * 0.5));

  const svg = d3
    .select(target)
    .append("svg")
    .attr("class", "map-svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  const projection = d3
    .geoMercator()
    .fitExtent(
      [
        [22, 24],
        [width - 22, height - 24],
      ],
      geojson,
    );
  const path = d3.geoPath(projection);

  const tooltip = d3
    .select(target)
    .append("div")
    .attr("class", "map-tooltip");

  const setTooltip = (event, feature, show) => {
    if (!feature) {
      tooltip.classed("show", false);
      return;
    }
    const rect = target.getBoundingClientRect();
    tooltip
      .classed("show", show)
      .style("left", `${event.clientX - rect.left}px`)
      .style("top", `${event.clientY - rect.top}px`)
      .html(
        `<strong>${feature.properties.name}</strong><br><span style="opacity:.7">Click to open country page</span>`,
      );
  };

  const group = svg.append("g");

  const hexToRgba = (hex, alpha) => {
    if (!hex || hex[0] !== "#") return hex;
    const v = hex.slice(1);
    const full =
      v.length === 3
        ? v
            .split("")
            .map((c) => c + c)
            .join("")
        : v;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const restFill = (feature) => hexToRgba(colorFor(feature.properties.name), 0.14);
  const hoverFill = (feature) => hexToRgba(colorFor(feature.properties.name), 0.96);

  const paths = group
    .selectAll("path.map-country")
    .data(geojson.features)
    .enter()
    .append("path")
    .attr("class", "map-country")
    .attr("d", path)
    .attr("data-slug", (d) => d.properties.slug)
    .attr("role", "link")
    .attr("tabindex", 0)
    .attr("aria-label", (d) => `Open ${d.properties.name} country page`)
    .style("fill", (d) => restFill(d))
    .style("opacity", 0.94)
    .style("stroke", "#ffffff")
    .style("stroke-width", 1.4)
    .classed(
      "active",
      (d) => activeSlug && d.properties.slug === activeSlug,
    );

  // Active country starts already saturated.
  paths
    .filter((d) => activeSlug && d.properties.slug === activeSlug)
    .style("fill", (d) => hoverFill(d))
    .style("stroke", (d) => colorFor(d.properties.name))
    .style("stroke-width", 2.2);

  paths
    .on("mouseenter", function (event, d) {
      d3.select(this)
        .style("fill", hoverFill(d))
        .style("filter", "saturate(1.2)")
        .style("stroke", colorFor(d.properties.name))
        .style("stroke-width", 2.2);
      setTooltip(event, d, true);
    })
    .on("mousemove", (event, d) => setTooltip(event, d, true))
    .on("mouseleave", function (event, d) {
      const isActive = activeSlug && d.properties.slug === activeSlug;
      d3.select(this)
        .style("fill", isActive ? hoverFill(d) : restFill(d))
        .style("filter", "none")
        .style("stroke", isActive ? colorFor(d.properties.name) : "#ffffff")
        .style("stroke-width", isActive ? 2.2 : 1.4);
      setTooltip(event, null, false);
    })
    .on("focus", function (event, d) {
      d3.select(this)
        .style("fill", hoverFill(d))
        .style("filter", "saturate(1.2)")
        .style("stroke", colorFor(d.properties.name))
        .style("stroke-width", 2.2);
    })
    .on("blur", function (event, d) {
      const isActive = activeSlug && d.properties.slug === activeSlug;
      d3.select(this)
        .style("fill", isActive ? hoverFill(d) : restFill(d))
        .style("filter", "none")
        .style("stroke", isActive ? colorFor(d.properties.name) : "#ffffff")
        .style("stroke-width", isActive ? 2.2 : 1.4);
    })
    .on("click", (event, d) => {
      if (onSelect) onSelect(d);
      else navigate(`/country/${d.properties.slug}`);
    })
    .on("keydown", (event, d) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (onSelect) onSelect(d);
        else navigate(`/country/${d.properties.slug}`);
      }
    });

  if (showLabels) {
    group
      .selectAll("text.map-label")
      .data(geojson.features)
      .enter()
      .append("text")
      .attr("class", "map-label")
      .attr("text-anchor", "middle")
      .attr("transform", (d) => {
        const c = path.centroid(d);
        if (d.properties.name === "Bahrain") {
          return `translate(${c[0] + 12},${c[1] - 18})`;
        }
        if (d.properties.name === "Qatar") {
          return `translate(${c[0]},${c[1] + 4})`;
        }
        return `translate(${c[0]},${c[1]})`;
      })
      .text((d) => d.properties.name);
  }
};
