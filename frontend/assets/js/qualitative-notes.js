// Curated qualitative notes for Block D ("Why?") on each country page.
//
// I keep the same four-part structure across the six countries so the
// dashboard reads consistently:
//   1. Strategy        — what the country is trying to do
//   2. Sector focus    — the non-oil sectors that anchor the transition
//   3. Trade structure — main named export and import partners (WITS)
//   4. Constraint risk — the binding constraint or main vulnerability
//
// Every note has an external source link (IMF, government strategy
// pages, World Bank WITS, ministry sites). The Methodology page mirrors
// the full source list under "Block D, qualitative reading sources".
//
// The tone matches Block A through Block C: descriptive, no
// instructions to the reader, no semicolons in the body.

export const QUALITATIVE_NOTES = {
  "saudi-arabia": {
    title:
      "Largest GCC economy. Vision 2030 transformation in progress, with continued hydrocarbon exposure.",
    notes: [
      {
        label: "Strategy",
        text:
          "Saudi Arabia's transition profile is shaped by Vision 2030 and a large state-led diversification agenda. The IMF describes the economic transformation as progressing, with non-oil activity supported by reform momentum, domestic demand, and investment programs. That is consistent with the panel reading of Saudi Arabia as a strong transition case while it still keeps high hydrocarbon exposure.",
        source: "IMF, Article IV report 2024",
        href:
          "https://www.elibrary.imf.org/view/journals/002/2024/280/article-A001-en.xml",
      },
      {
        label: "Sector focus",
        text:
          "Tourism is an important non-oil channel, but Saudi tourism is structurally different from UAE-style leisure and business tourism because part of it is anchored in Hajj and Umrah. The Pilgrim Experience Program targets services, infrastructure, digital solutions and the overall journey for pilgrims. That makes Saudi tourism a stable non-oil services channel with a specific religious and infrastructure-driven profile.",
        source: "Vision 2030, Pilgrim Experience Program",
        href:
          "https://www.vision2030.gov.sa/en/explore/programs/pilgrim-experience-program",
      },
      {
        label: "Trade structure",
        text:
          "Saudi Arabia remains strongly connected to hydrocarbon export markets. Among named partners in 2023, exports go to the UAE, China, India and Turkey, while imports come mainly from China, the United States, the UAE, India and Germany. That fits the reading of a large oil-exporting economy that simultaneously imports capital goods, technology and industrial inputs to support transformation.",
        source: "World Bank, WITS, Saudi Arabia 2023",
        href:
          "https://wits.worldbank.org/CountryProfile/en/Country/SAU/Year/2023/TradeFlow/Export/Partner/by-country",
      },
      {
        label: "Constraint and risk",
        text:
          "Saudi Arabia's main transition risk is not lack of ambition. It is the execution cost and the timing of very large investment programs under continued oil-market exposure. The country is therefore best framed as a major transition case rather than as already post-oil.",
        source: "IMF, Article IV report 2024",
        href:
          "https://www.elibrary.imf.org/view/journals/002/2024/280/article-A001-en.xml",
      },
    ],
  },
  "united-arab-emirates": {
    title:
      "The clearest diversified profile in the GCC, anchored on trade, services and tourism alongside hydrocarbons.",
    notes: [
      {
        label: "Strategy",
        text:
          "The UAE's transition profile is built around non-hydrocarbon growth, trade openness, investment attractiveness, logistics, finance, tourism, construction and manufacturing. The IMF notes that non-hydrocarbon growth has benefited from tourism flows and from activity in construction, manufacturing and financial services. That backs the UAE's position as the clearest diversified trajectory in this comparison.",
        source: "IMF, UAE Article IV 2024",
        href:
          "https://www.imf.org/en/publications/cr/issues/2024/12/05/united-arab-emirates-2024-article-iv-consultation-press-release-and-staff-report-558835",
      },
      {
        label: "Sector focus",
        text:
          "UAE diversification is not only a lower oil share. The country has built large replacement sectors, especially tourism, foreign trade, logistics, finance and real estate. The UAE Tourism Strategy 2031 targets a major increase in tourism's contribution to GDP, while Ministry of Economy targets include higher non-oil exports, higher tourism contribution and higher foreign trade value.",
        source: "UAE Tourism Strategy 2031",
        href:
          "https://u.ae/en/about-the-uae/strategies-initiatives-and-awards/strategies-plans-and-visions/tourism/uae-tourism-strategy-2031",
      },
      {
        label: "Trade structure",
        text:
          "Among named partners in 2023, exports go mainly to Saudi Arabia, India, Iraq and Turkey. Imports come mainly from China, India, the United States and Turkey. That fits the UAE's role as a regional trade, logistics and re-export hub.",
        source: "World Bank, WITS, UAE 2023",
        href:
          "https://wits.worldbank.org/CountryProfile/en/Country/ARE/Year/2023/TradeFlow/EXPIMP/Partner/by-country",
      },
      {
        label: "Constraint and risk",
        text:
          "The UAE still has hydrocarbon exposure, especially through Abu Dhabi, but its non-oil sectors are already large and diversified enough to make the transition profile structurally stronger than most GCC peers. The main risk is not absence of diversification. It is exposure to regional shocks through trade, tourism, logistics and hydrocarbons.",
        source: "IMF, UAE press release, December 2024",
        href:
          "https://www.imf.org/en/news/articles/2024/12/05/pr-24450-united-arab-emirates-imf-executive-board-concludes-2024-article-iv-consultation",
      },
    ],
  },
  qatar: {
    title:
      "High-income, LNG-anchored economy with visible services and tourism gains, but limited diversification on the export side.",
    notes: [
      {
        label: "Strategy",
        text:
          "Qatar's transition profile is shaped by a high-income, LNG-centred model. Qatar National Vision 2030 aims for a competitive and diversified economy, but the IMF medium-term outlook is still strongly supported by major LNG expansion. That is why Qatar can look extremely wealthy without leading the post-oil transition profile in this dataset.",
        source: "Qatar National Vision 2030",
        href: "https://www.npc.qa/en/QNV/pages/default.aspx",
      },
      {
        label: "Sector focus",
        text:
          "Qatar shows visible services and tourism signals, especially around the post-World-Cup period, and the IMF notes support from public investment, LNG expansion spillovers and tourism. Liquefied natural gas is still the dominant structural engine, so tourism and services act as diversification signals rather than evidence that the country has moved beyond hydrocarbons.",
        source: "IMF, Qatar Article IV mission, December 2024",
        href:
          "https://www.imf.org/en/news/articles/2024/12/02/pr-24448-qatar-imf-staff-completes-2024-article-iv-mission",
      },
      {
        label: "Trade structure",
        text:
          "Qatar's named export partners include China, South Korea, India, Japan and Singapore. Import partners include the United States, China, Italy, India and Germany. That is consistent with a globally connected energy exporter that imports advanced goods and services.",
        source: "World Bank, WITS, Qatar latest",
        href:
          "https://wits.worldbank.org/CountryProfile/en/Country/QAT/Year/LTST/TradeFlow/Export/Partner/by-country/Product/Total",
      },
      {
        label: "Constraint and risk",
        text:
          "Qatar is a key example for the project's central thesis: GDP per capita is not a transition proxy. The very high income level reflects scale, population structure and LNG wealth. Diversification still has to be judged through export concentration, sectoral structure, innovation and readiness indicators, and on those Qatar stays mid-pack inside the GCC.",
        source: "IMF, Qatar Executive Board conclusion 2024",
        href:
          "https://www.imf.org/en/news/articles/2025/02/11/pr25034-qatar-imf-executive-board-concludes-the-2024-article-iv-consultation",
      },
    ],
  },
  kuwait: {
    title:
      "Resource-dependent profile with large financial buffers but limited visible structural reform.",
    notes: [
      {
        label: "Strategy",
        text:
          "Kuwait remains one of the clearest resource-dependent cases in this comparison. The IMF describes Kuwait as heavily exposed to global risks through oil dependence, especially commodity-price volatility and oil-production shocks. That is why Kuwait appears weak in post-oil transition terms despite large financial buffers.",
        source: "IMF, Kuwait Article IV report 2024",
        href:
          "https://www.elibrary.imf.org/view/journals/002/2024/328/article-A001-en.xml",
      },
      {
        label: "Sector focus",
        text:
          "Kuwait Vision 2035 aims to transform the country into a regional and international financial and trade hub. The national development framework includes a Sustainable Diversified Economy pillar. Compared with the UAE and Saudi Arabia, however, the dataset shows weaker visible progress in diversification, AI readiness and replacement sectors.",
        source: "Kuwait Vision 2035",
        href: "https://www.mofa.gov.kw/en/pages/kuwait-vision-2035",
      },
      {
        label: "Trade structure",
        text:
          "Among named partners in 2023, Kuwait exports to the UAE, India, Saudi Arabia and China. Imports are led by China, the United States, the UAE, Japan and India. That is consistent with a hydrocarbon-heavy export structure and import dependence for goods, technology and industrial inputs.",
        source: "World Bank, WITS, Kuwait 2023",
        href:
          "https://wits.worldbank.org/CountryProfile/en/Country/KWT/Year/2023/TradeFlow/EXPIMP/Partner/by-country",
      },
      {
        label: "Constraint and risk",
        text:
          "Kuwait's core constraint is delayed structural reform, not lack of wealth. Large financial buffers reduce short-term crisis risk, but they do not automatically generate non-oil competitiveness, innovation capacity or export diversification. That is why Kuwait remains closer to a resource-dependent equilibrium in this reading.",
        source: "IMF, Kuwait press release, December 2024",
        href:
          "https://www.imf.org/en/news/articles/2024/12/06/pr24452-kuwait-imf-executive-board-concludes-2024-article-iv-consult",
      },
    ],
  },
  oman: {
    title:
      "Reform-oriented gradual transition anchored on Vision 2040 and non-hydrocarbon revenue mobilisation.",
    notes: [
      {
        label: "Strategy",
        text:
          "Oman's transition profile is reform-oriented and anchored in Vision 2040. The IMF states that sustained implementation of Vision 2040 reforms is key to achieving sustainable, job-rich, private-sector-led non-hydrocarbon growth. That places Oman as a gradual transition case rather than a leader or a laggard.",
        source: "IMF, Oman Executive Board conclusion 2024",
        href:
          "https://www.imf.org/en/news/articles/2025/01/22/pr25011-oman-imf-executive-board-concludes-2024-article-iv-consultation",
      },
      {
        label: "Sector focus",
        text:
          "Oman's non-hydrocarbon pathway is linked to construction, manufacturing, services, logistics, private-sector investment, fiscal reform and non-hydrocarbon export development. The IMF notes that non-hydrocarbon growth has been supported by construction, manufacturing and services, and underlines the need to raise non-hydrocarbon revenues to fund growth-enhancing investment.",
        source: "IMF, Oman Article IV mission, November 2024",
        href:
          "https://www.imf.org/en/news/articles/2024/11/18/pr-24424-oman-imf-completes-2024-article-iv-mission",
      },
      {
        label: "Trade structure",
        text:
          "In 2023 Oman's named export partners include the UAE, Saudi Arabia, India, South Africa and the United States. Imports come mainly from the UAE, Saudi Arabia, China, India and Qatar. That fits Oman's position as a regional trade and logistics-linked economy, not yet a high-capability innovation leader.",
        source: "World Bank, WITS, Oman 2023",
        href:
          "https://wits.worldbank.org/CountryProfile/en/Country/OMN/Year/2023/TradeFlow/EXPIMP/Partner/by-country",
      },
      {
        label: "Constraint and risk",
        text:
          "Oman's main constraint is that progress remains vulnerable to oil-market cycles and fiscal space. The transition path is credible, but the economy still needs deeper export diversification and stronger private-sector-led growth to reduce macro vulnerability.",
        source: "IMF, Oman Article IV report 2025",
        href:
          "https://www.elibrary.imf.org/view/journals/002/2025/013/article-A001-en.xml",
      },
    ],
  },
  bahrain: {
    title:
      "Structurally diversified relative to its size, with finance, manufacturing and services on top of a smaller hydrocarbon base.",
    notes: [
      {
        label: "Strategy",
        text:
          "Bahrain is structurally distinctive because it has a smaller hydrocarbon base than several GCC peers and has long relied more heavily on non-hydrocarbon activity. The IMF notes Bahrain's resilience and growth performance supported by efforts to diversify toward the non-hydrocarbon sector. That is why Bahrain can rank highly on structural diversification measures.",
        source: "IMF, Bahrain press release, November 2024",
        href:
          "https://www.imf.org/en/news/articles/2024/11/27/pr-24445-the-kingdom-of-bahrain-imf-executive-board-concludes-2024-article-iv-consultation",
      },
      {
        label: "Sector focus",
        text:
          "Bahrain's diversification model is based on finance, services, manufacturing, logistics, tourism and digital-economy priorities. The Economic Recovery Plan explicitly identifies tourism, industry, logistics, financial services, telecommunications, IT and the digital economy as sector strategies. That explains why Bahrain may look structurally diversified even without matching the UAE's scale.",
        source: "Bahrain, Economic Recovery Plan",
        href: "https://www.mofne.gov.bh/en/project-initiatives/economic-recovery-plan",
      },
      {
        label: "Trade structure",
        text:
          "Bahrain's 2023 named export partners include Saudi Arabia, the UAE, the United States, the Netherlands and Egypt. Import partners include China, the UAE, Brazil, Australia and Saudi Arabia. That confirms Bahrain's strong regional integration, especially with Saudi Arabia and the UAE.",
        source: "World Bank, WITS, Bahrain 2023",
        href:
          "https://wits.worldbank.org/CountryProfile/en/Country/BHR/Year/2023/TradeFlow/EXPIMP/Partner/by-country",
      },
      {
        label: "Constraint and risk",
        text:
          "Bahrain's limitation is not simply oil concentration. It is scale and fiscal vulnerability. IMF reporting points to debt and fiscal pressures, so Bahrain is best read as structurally diversified but not necessarily the strongest overall post-oil success case.",
        source: "IMF, Bahrain press release, January 2026",
        href:
          "https://www.imf.org/en/news/articles/2026/01/27/pr-26023-the-kingdom-of-bahrain-imf-executive-board-concludes-2025-article-iv-consultation",
      },
    ],
  },
};
