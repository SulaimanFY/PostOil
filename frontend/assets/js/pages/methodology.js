// Methodology and sources page.
//
// I built this page around four blocks that I want to keep up to date
// when I refresh the project:
//   1. one paragraph per source explaining what it provides
//   2. one paragraph per variable explaining what it measures and how
//      I derive it
//   3. one entry per country for the curated hydrocarbon GDP share
//   4. a Block D consolidated source list and an explicit limitations
//      section
//
// The page only loads `overview.json` for the project question. The
// rest is a fixed list of sources so it stays accurate even if the
// panel is rebuilt.

import { loadOverview } from "../data.js";

const ext = (label, href) => `
  <a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`;

// Canonical tree URL for deep links into the repo (blob view).
const GITHUB_REPO = "https://github.com/SulaimanFY/PostOil";
const GITHUB_MAIN_TREE = `${GITHUB_REPO}/blob/main`;

const methodSection = ({ id, title, intro, body }) => `
  <section class="section" id="${id}">
    <h2 class="h-section">${title}</h2>
    ${intro ? `<p class="section-intro">${intro}</p>` : ""}
    <div class="method-section">${body}</div>
  </section>
`;

export const renderMethodology = async () => {
  const overview = await loadOverview();

  const html = `
    <section class="section">
      <div class="eyebrow">Methodology and sources</div>
      <h1 class="h-display">How the panel is built and how to read it</h1>
      <p class="lede">
        This project compares the six GCC countries on post-oil transition
        using public macroeconomic, structural and capability indicators. It
        is descriptive by design. It is useful for contrasts, rankings and
        trajectories, not for causal claims.
      </p>
      <div class="note info mt-2">
        Six countries, mixed source years, harmonised indicator definitions,
        and a focus on direction and relative position rather than
        point-in-time accuracy of any single number.
      </div>
    </section>

    ${methodSection({
      id: "question",
      title: "Project question",
      intro: "",
      body: `
        <p style="font-size:18px; line-height:1.5; margin:0;">
          ${overview.main_question}
        </p>
        <p class="mt-2 muted text-sm">
          With six countries and mixed vintages, the analysis stays at the
          level of contrasts and trajectories. That is the appropriate level
          of inference for this kind of comparative reading.
        </p>
      `,
    })}

    <section class="section" id="sources">
      <h2 class="h-section">Data sources</h2>
      <p class="section-intro">
        Five public sources feed the dashboard. Each card below states what
        the source provides, the time coverage we actually use, and a link to
        the official portal or to the exact edition referenced in this build.
      </p>

      <div class="method-section">
        <h3>World Bank, World Development Indicators (WDI)</h3>
        <p>
          Backbone of the macro and structural reads. We use oil rents as a
          share of GDP, fuel exports as a share of merchandise exports,
          services and manufacturing value added as shares of GDP, exports
          and imports as shares of GDP, trade openness, tourism receipts in
          USD and as a share of total exports, GDP and GDP per capita.
        </p>
        <div class="method-link-list">
          ${ext("World Bank, WDI portal", "https://databank.worldbank.org/source/world-development-indicators")}
        </div>
      </div>

      <div class="method-section">
        <h3>UNCTAD, merchandise concentration index</h3>
        <p>
          Provides the export concentration index (Herfindahl-Hirschmann on
          merchandise export categories). A lower value means a more
          diversified export mix. Annual coverage starts at 1995 for all six
          GCC countries.
        </p>
        <div class="method-link-list">
          ${ext("UNCTAD, UNCTADStat", "https://unctadstat.unctad.org/EN/Index.html")}
        </div>
      </div>

      <div class="method-section">
        <h3>Oxford Insights, Government AI Readiness Index</h3>
        <p>
          Country-level AI capability score for 2023, 2024 and 2025. The
          panel exposes a unified score: the Oxford headline (three-pillar
          mean) for 2023 and 2024, and the mean of the six 2025 pillars for
          2025. That keeps a single comparable AI scale across charts.
        </p>
        <div class="method-link-list">
          ${ext("Oxford Insights, 2025 AI Readiness Report (PDF)", "https://oxfordinsights.com/wp-content/uploads/2026/01/2025-Government-AI-Readiness-Index-Report_01_26.pdf")}
          ${ext("Oxford Insights, 2024 AI Readiness Report (PDF)", "https://oxfordinsights.com/wp-content/uploads/2024/12/2024-Government-AI-Readiness-Index-2.pdf")}
          ${ext("Oxford Insights, 2023 AI Readiness Report (PDF)", "https://oxfordinsights.com/wp-content/uploads/2023/12/2023-Government-AI-Readiness-Index-2.pdf")}
        </div>
      </div>

      <div class="method-section">
        <h3>WIPO, Global Innovation Index (GII)</h3>
        <p>
          Composite innovation score and world rank used as a 2025 snapshot.
          GII aggregates input pillars (institutions, human capital,
          infrastructure, market and business sophistication) and output
          pillars (knowledge and technology, creative outputs).
        </p>
        <div class="method-link-list">
          ${ext("WIPO, Global Innovation Index 2025", "https://www.wipo.int/publications/en/details.jsp?id=4807")}
        </div>
      </div>

      <div class="method-section">
        <h3>World Bank, WITS country profiles</h3>
        <p>
          Used in Block D to cite each country's main named export and
          import partners (most recent year available). Trade-partner reads
          on the country pages restrict the discussion to named country
          partners and exclude non-country categories such as
          unspecified or unallocated origins, which are not partners.
        </p>
        <div class="method-link-list">
          ${ext("World Bank, WITS country profiles", "https://wits.worldbank.org/CountryProfile/en/Country/")}
        </div>
      </div>

      <div class="method-section">
        <h3>National statistics offices, hydrocarbon share of GDP</h3>
        <p>
          The hydrocarbon-sector share of GDP is curated from each country's
          official national-accounts release at the latest vintage available.
          All six values are 2024 annual readings. Each country has its own
          source.
        </p>
        <ul class="source-list">
          <li>
            <span class="src-row">
              <span class="src-headline">
                <strong>Saudi Arabia, 19.4% in 2024.</strong>
                Crude oil and natural gas activities, share of GDP.
              </span>
              <span class="src-cite">
                ${ext("GASTAT, Annual National Accounts 2024 (PDF)", "https://www.stats.gov.sa/documents/20117/2435267/Annual%2BNational%2BAccounts%2BPublication%2B2024%2BEN.pdf/770f9e7b-444a-5d5e-5b75-f6825f2668d0")}
              </span>
            </span>
          </li>
          <li>
            <span class="src-row">
              <span class="src-headline">
                <strong>United Arab Emirates, about 24.5% in 2024.</strong>
                Implied as 100 minus the FCSC non-oil GDP share of 75.5% for 2024.
              </span>
              <span class="src-cite">
                ${ext("FCSC, UAE 2024 GDP release", "https://fcsc.gov.ae/")}
              </span>
            </span>
          </li>
          <li>
            <span class="src-row">
              <span class="src-headline">
                <strong>Qatar, about 36% in 2024.</strong>
                Implied as 100 minus the non-hydrocarbon share of nearly 64%
                reported by the National Statistics Center for full-year 2024.
              </span>
              <span class="src-cite">
                ${ext("Qatar News Agency, National Statistics Center release (March 2025)", "https://qna.org.qa/en/news-bulletins-details?date=20%2F03%2F2025&id=0076-qatari-economy-grows-24-yoy-in-2024")}
              </span>
            </span>
          </li>
          <li>
            <span class="src-row">
              <span class="src-headline">
                <strong>Kuwait, 43.4% in 2024.</strong>
                Oil sector share of GDP, latest accessible figure communicated
                by the acting finance minister.
              </span>
              <span class="src-cite">
                ${ext("Reuters, Kuwait finance minister statement, 2025-09-03", "https://www.reuters.com/world/middle-east/kuwait-finance-minister-sees-boost-projects-diversification-under-parliament-2025-09-03")}
              </span>
            </span>
          </li>
          <li>
            <span class="src-row">
              <span class="src-headline">
                <strong>Oman, about 34.6% in 2024.</strong>
                Petroleum activities (OMR 14,234.5 million) divided by GDP at
                market prices (OMR 41,194.3 million).
              </span>
              <span class="src-cite">
                ${ext("NCSI Oman, Monthly Statistical Bulletin (PDF)", "https://api.ncsi.gov.om/uploads/pdfs/monthly_statistical_bulletin___january_2026_1768895771.pdf")}
              </span>
            </span>
          </li>
          <li>
            <span class="src-row">
              <span class="src-headline">
                <strong>Bahrain, 14.7% in 2024.</strong>
                Oil sector share of GDP at constant prices, official dataset.
              </span>
              <span class="src-cite">
                ${ext("Kingdom of Bahrain, open data portal (constant prices)", "https://www.data.gov.bh/explore/dataset/02-annually-general-economic-indicators-by-constant-prices/table")}
              </span>
            </span>
          </li>
        </ul>
      </div>
    </section>

    <section class="section" id="block-d-sources">
      <h2 class="h-section">Block D, qualitative reading sources</h2>
      <p class="section-intro">
        Block D on each country page cites strategy, sectoral focus, trade
        structure and constraint. Each note links to its primary source.
        The full list of those sources is consolidated here.
      </p>

      <div class="grid-2">
        <div class="method-section">
          <h3>Saudi Arabia</h3>
          <ul class="source-list">
            <li>${ext("IMF, Saudi Arabia Article IV report 2024", "https://www.elibrary.imf.org/view/journals/002/2024/280/article-A001-en.xml")}</li>
            <li>${ext("Vision 2030, Pilgrim Experience Program", "https://www.vision2030.gov.sa/en/explore/programs/pilgrim-experience-program")}</li>
            <li>${ext("World Bank, WITS Saudi Arabia 2023", "https://wits.worldbank.org/CountryProfile/en/Country/SAU/Year/2023/TradeFlow/Export/Partner/by-country")}</li>
          </ul>
        </div>

        <div class="method-section">
          <h3>United Arab Emirates</h3>
          <ul class="source-list">
            <li>${ext("IMF, UAE Article IV 2024 (Country Report)", "https://www.imf.org/en/publications/cr/issues/2024/12/05/united-arab-emirates-2024-article-iv-consultation-press-release-and-staff-report-558835")}</li>
            <li>${ext("UAE Tourism Strategy 2031", "https://u.ae/en/about-the-uae/strategies-initiatives-and-awards/strategies-plans-and-visions/tourism/uae-tourism-strategy-2031")}</li>
            <li>${ext("World Bank, WITS UAE 2023", "https://wits.worldbank.org/CountryProfile/en/Country/ARE/Year/2023/TradeFlow/EXPIMP/Partner/by-country")}</li>
            <li>${ext("IMF, UAE press release December 2024", "https://www.imf.org/en/news/articles/2024/12/05/pr-24450-united-arab-emirates-imf-executive-board-concludes-2024-article-iv-consultation")}</li>
          </ul>
        </div>

        <div class="method-section">
          <h3>Qatar</h3>
          <ul class="source-list">
            <li>${ext("Qatar National Vision 2030", "https://www.npc.qa/en/QNV/pages/default.aspx")}</li>
            <li>${ext("IMF, Qatar Article IV mission, December 2024", "https://www.imf.org/en/news/articles/2024/12/02/pr-24448-qatar-imf-staff-completes-2024-article-iv-mission")}</li>
            <li>${ext("World Bank, WITS Qatar latest", "https://wits.worldbank.org/CountryProfile/en/Country/QAT/Year/LTST/TradeFlow/Export/Partner/by-country/Product/Total")}</li>
            <li>${ext("IMF, Qatar Executive Board conclusion 2024", "https://www.imf.org/en/news/articles/2025/02/11/pr25034-qatar-imf-executive-board-concludes-the-2024-article-iv-consultation")}</li>
          </ul>
        </div>

        <div class="method-section">
          <h3>Kuwait</h3>
          <ul class="source-list">
            <li>${ext("IMF, Kuwait Article IV report 2024", "https://www.elibrary.imf.org/view/journals/002/2024/328/article-A001-en.xml")}</li>
            <li>${ext("Kuwait Vision 2035 (Ministry of Foreign Affairs)", "https://www.mofa.gov.kw/en/pages/kuwait-vision-2035")}</li>
            <li>${ext("World Bank, WITS Kuwait 2023", "https://wits.worldbank.org/CountryProfile/en/Country/KWT/Year/2023/TradeFlow/EXPIMP/Partner/by-country")}</li>
            <li>${ext("IMF, Kuwait press release December 2024", "https://www.imf.org/en/news/articles/2024/12/06/pr24452-kuwait-imf-executive-board-concludes-2024-article-iv-consult")}</li>
          </ul>
        </div>

        <div class="method-section">
          <h3>Oman</h3>
          <ul class="source-list">
            <li>${ext("IMF, Oman Executive Board conclusion 2024", "https://www.imf.org/en/news/articles/2025/01/22/pr25011-oman-imf-executive-board-concludes-2024-article-iv-consultation")}</li>
            <li>${ext("IMF, Oman Article IV mission, November 2024", "https://www.imf.org/en/news/articles/2024/11/18/pr-24424-oman-imf-completes-2024-article-iv-mission")}</li>
            <li>${ext("World Bank, WITS Oman 2023", "https://wits.worldbank.org/CountryProfile/en/Country/OMN/Year/2023/TradeFlow/EXPIMP/Partner/by-country")}</li>
            <li>${ext("IMF, Oman Article IV report 2025", "https://www.elibrary.imf.org/view/journals/002/2025/013/article-A001-en.xml")}</li>
          </ul>
        </div>

        <div class="method-section">
          <h3>Bahrain</h3>
          <ul class="source-list">
            <li>${ext("IMF, Bahrain press release November 2024", "https://www.imf.org/en/news/articles/2024/11/27/pr-24445-the-kingdom-of-bahrain-imf-executive-board-concludes-2024-article-iv-consultation")}</li>
            <li>${ext("Bahrain Economic Recovery Plan", "https://www.mofne.gov.bh/en/project-initiatives/economic-recovery-plan")}</li>
            <li>${ext("World Bank, WITS Bahrain 2023", "https://wits.worldbank.org/CountryProfile/en/Country/BHR/Year/2023/TradeFlow/EXPIMP/Partner/by-country")}</li>
            <li>${ext("IMF, Bahrain press release January 2026", "https://www.imf.org/en/news/articles/2026/01/27/pr-26023-the-kingdom-of-bahrain-imf-executive-board-concludes-2025-article-iv-consultation")}</li>
          </ul>
        </div>
      </div>
    </section>

    <section class="section" id="variables">
      <h2 class="h-section">Variables and definitions</h2>
      <p class="section-intro">
        Each variable on the dashboard is defined here. Variables marked
        <em>derived</em> are computed from public series, see the formula in
        the matching card.
      </p>

      <div class="grid-2">
        <div class="method-section">
          <h3>Hydrocarbon sector share of GDP</h3>
          <p>
            Share of value added produced by hydrocarbon activities in total
            GDP, taken from each country's national-accounts release
            (national source, see Sources above). This is the closest
            available country-by-country measure of how much of the economy
            is still produced by the hydrocarbon sector. All six values are
            2024 annual readings. The underlying classification differs
            slightly from one statistics office to another, so it is best
            used to position a country inside the GCC rather than as a
            strict like-for-like comparison.
          </p>
        </div>

        <div class="method-section">
          <h3>Fuel exports, share of merchandise exports</h3>
          <p>
            Share of fuel-classified products in total merchandise exports
            (World Bank WDI, customs-based). It captures hydrocarbon
            exposure on the trade side. A lower value means non-fuel goods
            are gaining weight in what the country sells abroad.
          </p>
        </div>

        <div class="method-section">
          <h3>Oil rents, share of GDP</h3>
          <p>
            World Bank WDI, oil rents as a share of GDP. This is the income
            from crude oil extraction net of extraction costs, expressed as
            a percentage of GDP. It is an income lens on hydrocarbons,
            different from the customs-based fuel-export share. It does not
            cover refining, petrochemicals or distribution, which sit in
            other parts of the national accounts.
          </p>
        </div>

        <div class="method-section">
          <h3>Export concentration index</h3>
          <p>
            UNCTAD merchandise concentration index, a Herfindahl-Hirschmann
            value between 0 and 1 computed on export categories. Lower means
            a wider mix of exported products. A multi-year fall is the
            cleanest read of structural diversification on the export side.
          </p>
        </div>

        <div class="method-section">
          <h3>Manufacturing and services value added, share of GDP</h3>
          <p>
            World Bank WDI national-accounts shares of manufacturing and
            services value added in GDP. Higher manufacturing or services
            shares indicate a broader domestic productive base.
          </p>
        </div>

        <div class="method-section">
          <h3>Tourism receipts</h3>
          <p>
            Two views of tourism. Receipts in USD measure the absolute size
            of the tourism economy. The effective share of exports
            (<code>tourism_pct_exports_eff</code>, derived) uses the WDI
            series <code>tourism_receipts_pct_exports</code> when present
            and falls back to
            <code>tourism_receipts_usd / exports_usd × 100</code> when that
            series is missing. Source labels say "World Bank WDI (derived)"
            for fallback rows.
          </p>
        </div>

        <div class="method-section">
          <h3>Exports, imports and trade openness</h3>
          <p>
            World Bank WDI, exports of goods and services, imports of goods
            and services, and trade openness all expressed as a share of
            GDP. Trade openness equals exports plus imports over GDP, in
            percent. Values above 100 are normal for very open economies
            because the trade account can exceed yearly output.
          </p>
        </div>

        <div class="method-section">
          <h3>Exports / imports ratio (derived)</h3>
          <p>
            <code>exports_imports_ratio = exports_usd / imports_usd</code>
            using World Bank WDI USD series. A value of 1 marks balanced
            trade. Well above 1 marks a structural surplus, typically driven
            by oil and gas. Below 1 marks a deficit. A move toward 1 from a
            high level is a diversification signal because the economy
            imports more capital and consumption goods relative to what it
            exports.
          </p>
        </div>

        <div class="method-section">
          <h3>Why we do not show fuel-share-of-GDP from WDI alone</h3>
          <p>
            A naive "fuel × exports/GDP" multiplication mixes a numerator
            measured on merchandise with a denominator measured on goods and
            services as a share of GDP. Numerically the result can be high
            for trade-hub economies for non-economic reasons. The dashboard
            therefore uses the curated national-accounts hydrocarbon share
            on Block A and on the GCC overview, and uses oil rents as a
            share of GDP for the WDI income-lens trajectory.
          </p>
        </div>

        <div class="method-section">
          <h3>GDP and GDP per capita</h3>
          <p>
            World Bank WDI, GDP in current USD and GDP per capita in current
            USD. Used to size the economy and to read income context. They
            are not transition proxies on their own.
          </p>
        </div>

        <div class="method-section">
          <h3>AI readiness, unified score</h3>
          <p>
            Oxford Insights Government AI Readiness. For 2023 and 2024 the
            unified score is the published headline (mean of the legacy
            three pillars). For 2025 it is the mean of the six 2025
            pillars. That gives a single comparable AI scale across the
            three editions used here.
          </p>
        </div>

        <div class="method-section">
          <h3>Innovation index (GII)</h3>
          <p>
            WIPO Global Innovation Index 2025 score and world rank. It is
            used as a 2025 snapshot in cross-block scatter plots and on the
            country snapshot table.
          </p>
        </div>
      </div>
    </section>

    <section class="section" id="panel">
      <h2 class="h-section">Panel construction</h2>
      <div class="method-section">
        <ul>
          <li>Merge key: <code>country</code> + <code>year</code>.</li>
          <li>Each source is reshaped to long format, then outer-joined. Missing values stay missing.</li>
          <li>
            Harmonised table: <code>datasets/merged_dataset.csv</code>.
            SQL mirror:
            <a
              class="text-link"
              href="${GITHUB_MAIN_TREE}/datasets/postoil.db"
              target="_blank"
              rel="noopener noreferrer"
            >datasets/postoil.db</a>
            (same path in the repo).
          </li>
          <li>The site loads JSON built by <code>scripts/build_frontend_data.py</code>, not the CSV at runtime.</li>
          <li>Curated national-accounts values for the hydrocarbon GDP share are injected during the build with plain-text <code>source</code> labels on the cards. Full citations and URLs stay on this methodology page.</li>
          <li>Exploratory analysis, chart conventions and masks are documented in <code>notebooks/main.ipynb</code> (notably 3.1, 3.4 and 3.5).</li>
        </ul>
      </div>
    </section>

    <section class="section" id="treatment">
      <h2 class="h-section">Data treatment choices</h2>
      <div class="method-section">
        <p>
          Snapshot KPI cards use the latest available value inside the
          2015 to 2025 window. For known revision artefacts, in particular
          Bahrain fuel-exports near-zero pockets, trajectories flag and
          omit implausible points so the visual line breaks at the last
          credible value. The build script keeps the raw value, the
          accepted value and an explanatory note on the same KPI entry, so
          the cause of the substitution stays auditable.
        </p>
        <p>
          Tourism share uses the direct WDI series when present and falls
          back to a derived ratio otherwise. The fallback rows are clearly
          flagged in the source label.
        </p>
        <p>
          Trade-partner reads in Block D follow the named-partner rule:
          residual non-country categories used by some trade-flow extracts
          are not treated as countries and are not part of the partner
          discussion.
        </p>
      </div>
    </section>

    <section class="section" id="ranks">
      <h2 class="h-section">Ranks used in the dashboard</h2>
      <div class="grid-2">
        <div class="method-section">
          <h3>World ranks</h3>
          <p>
            Two indicators ship with a published world rank: Oxford
            Government AI Readiness and WIPO GII. Ranks appear next to the
            headline value on KPI cards and in the GCC snapshot table.
          </p>
        </div>
        <div class="method-section">
          <h3>Intra-GCC ranks</h3>
          <p>
            Block C narratives use intra-GCC ranks computed from the latest
            available value of each indicator across the six countries. For
            indicators where lower is better (export concentration, fuel
            exports, oil rents, hydrocarbon GDP share), rank 1 is the
            lowest value. For all other indicators, rank 1 is the highest
            value.
          </p>
        </div>
      </div>
    </section>

    <section class="section" id="limits">
      <h2 class="h-section">Limitations</h2>
      <div class="grid-2">
        <div class="note warn">
          <strong>Small panel.</strong> Six countries only. Cross-block
          charts are comparative visuals, not fitted models.
        </div>
        <div class="note warn">
          <strong>Different vintages.</strong> Tourism series stop around
          2020 to 2023 in this WDI release, AI readiness starts in 2023,
          GII is a 2025 edition. Each chart shows the year actually used.
        </div>
        <div class="note warn">
          <strong>Publication lag.</strong> National accounts and many
          international databases reach a stable annual vintage only after
          compilation and revision cycles. That is why headline structural
          reads such as the hydrocarbon-sector share of GDP are anchored on
          2024 here even when the calendar year has moved on, and why WDI
          macro columns often trail the current year by one or more
          releases.
        </div>
        <div class="note warn">
          <strong>Composite indices.</strong> GII and AI readiness compress
          many inputs into one number. They are directional benchmarks, not
          complete diagnostics.
        </div>
        <div class="note warn">
          <strong>Hydrocarbon GDP share, mixed sources.</strong> The
          hydrocarbon-sector share is 2024 for the six countries, but the
          underlying releases are not perfectly comparable: GASTAT, FCSC,
          Qatar National Statistics Center, NCSI Oman and the Bahrain open
          data portal each apply their own classification. Kuwait relies on
          a public statement reported by Reuters because no comparable
          national-accounts table is openly published. The values are best
          read as a position inside the GCC, not as strictly cross-country
          like-for-like figures.
        </div>
        <div class="note warn">
          <strong>Missing dimensions.</strong> The dataset does not yet
          cover employment composition, non-oil fiscal revenues, export
          complexity, FDI quality, or services exports beyond tourism.
        </div>
        <div class="note warn">
          <strong>Trade-partner extracts.</strong> WITS country profiles
          may include residual non-country categories used by customs
          systems. The dashboard ignores those entries when discussing
          partners.
        </div>
      </div>
    </section>

    <section class="section" id="repo">
      <h2 class="h-section">Code and reproducibility</h2>
      <div class="method-section">
        <p>
          I keep the full stack in one place: exploratory merge logic in
          <code>notebooks/main.ipynb</code>, the harmonised CSV and SQLite
          mirror under <code>datasets/</code>, the static site under
          <code>frontend/</code>, and the generator
          <code>scripts/build_frontend_data.py</code> that turns the panel
          into the JSON files under <code>data/</code>. The root
          <code>README.md</code> describes how I run the site locally, sync
          data, and what each top-level folder is for.
        </p>
        <p>
          After I change inputs or curation rules, I re-run the build script
          so every country payload, the GCC overview and the comparison
          charts stay aligned with the same panel vintage.
        </p>
        <div class="method-link-list">
          ${ext("Source code on GitHub", GITHUB_REPO)}
        </div>
      </div>
    </section>
  `;

  return html;
};
