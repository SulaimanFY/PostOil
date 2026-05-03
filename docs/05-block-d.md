# 05 — Block D and qualitative notes

Block D is the human-written narrative on each country page. It does
not introduce new numbers, it adds context to the quantitative reading
in Blocks A through C.

## Structure I keep across countries

Each country has the same four notes, in the same order:

1. **Strategy** — what the country is trying to do, with the IMF
   Article IV report or equivalent as the anchor.
2. **Sector focus** — the non-oil sectors that anchor the transition,
   with the matching national strategy page.
3. **Trade structure** — main named export and import partners (World
   Bank WITS country profile). I exclude residual non-country
   categories (e.g. unspecified destinations) from the read because
   they are not partners.
4. **Constraint and risk** — what is binding for the country, with
   the most recent IMF press release or report.

This structure mirrors the framing used elsewhere on the dashboard:
state, sector, trade, constraint.

## Where the content lives

`frontend/assets/js/qualitative-notes.js` exports a `QUALITATIVE_NOTES`
dictionary keyed by slug. Each value has:

```js
{
  title: "...",            // headline summary shown above the four notes
  notes: [
    { label: "Strategy",    text: "...", source: "...", href: "https://..." },
    { label: "Sector focus",text: "...", source: "...", href: "https://..." },
    { label: "Trade structure", text: "...", source: "...", href: "https://..." },
    { label: "Constraint and risk", text: "...", source: "...", href: "https://..." },
  ],
}
```

The renderer is `blockDSection(countryName, slug)` in
`frontend/assets/js/pages/country.js`. It produces the four cards and
appends a small footnote pointing readers to the methodology page for
the named-partner rule and full source list.

## Style rules I follow

- One short paragraph per note. Two paragraphs at most.
- No semicolons in the body. Two short sentences are clearer.
- No instructions to the reader ("you should look at...", "browse the
  panels..."). The dashboard already shows the panels.
- Numbers stay in Blocks A through C. Block D references the panel
  reading rather than restating values.
- Every note must have a credible external source. IMF (Article IV
  reports, mission press releases), national vision pages, World Bank
  WITS, and ministry strategy pages are the standard sources. Reuters
  is acceptable when it carries an official statement that is not
  otherwise published online.

## Updating Block D

When an IMF Article IV report is refreshed or a new government
strategy is published:

1. Open `frontend/assets/js/qualitative-notes.js`.
2. Replace the relevant `text` and update `source` and `href`.
3. Reload the country page in `python frontend/serve.py` and check the
   layout (the four cards should still fit cleanly on tablet width).
4. Mirror the link in the methodology page Block D source list at
   `frontend/assets/js/pages/methodology.js` so the consolidated list
   stays in sync.

## Mirror in the methodology page

The methodology page carries a consolidated list of Block D sources
under the section `Block D, qualitative reading sources`. That list
exists so a reader who arrives via the methodology page sees every
external link in one place. It is curated by hand, in the same
country order as Block D itself.
