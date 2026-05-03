import { loadGeo, loadOverview } from "../data.js";
import { renderGccMap } from "../components/gcc-map.js";
import { GCC_ORDER, NAME_TO_SLUG, colorFor } from "../theme.js";

export const renderLanding = async () => {
  const [geo, overview] = await Promise.all([loadGeo(), loadOverview()]);

  const html = `
    <section class="section">
      <div class="eyebrow">PostOil · GCC</div>
      <h1 class="h-display">${overview.main_question}</h1>
      <p class="lede">
        A descriptive cross-country lens on the post-oil transition across
        Bahrain, Kuwait, Oman, Qatar, Saudi Arabia and the United Arab Emirates,
        through diversification structure, capability and innovation signals.
      </p>
      <div class="btn-row mt-3">
        <a class="btn primary" href="#/overview" data-link>
          Open GCC overview →
        </a>
        <a class="btn" href="#/methodology" data-link>
          Methodology
        </a>
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <h2 class="h-section">Pick a country</h2>
        <span class="muted text-sm">Hover the map · click any country to open its page.</span>
      </div>
      <div class="map-wrap" id="landing-map"></div>
      <div class="map-legend mt-2">
        ${GCC_ORDER.map(
          (name) => `
            <a class="country-chip" href="#/country/${NAME_TO_SLUG[name]}" data-link>
              <span class="country-dot" style="background:${colorFor(name)}"></span>
              ${name}
            </a>`,
        ).join("")}
      </div>
    </section>
  `;

  return {
    html,
    onMount: () => {
      const mapTarget = document.getElementById("landing-map");
      if (mapTarget) {
        renderGccMap(mapTarget, { geojson: geo });
      }
    },
  };
};
