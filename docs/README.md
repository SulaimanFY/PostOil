# PostOil — technical documentation

This folder is the long-form companion to the project. The repository
README answers "what is PostOil and how do I run it". The pages here
answer "how does it work, end to end, and where do I touch what".

I keep these notes on hand so I do not have to re-read every script
when I refresh data or extend the dashboard.

## Reading order

1. **[01 — Project overview](./01-project-overview.md)** — what the
   project is, the question, the audience, what is in scope and what is
   not.
2. **[02 — Data pipeline](./02-data-pipeline.md)** — how the raw CSVs
   become `merged_dataset.csv` and then the JSON the site reads.
3. **[03 — Indicators reference](./03-indicators.md)** — every
   variable, definition, source, derivation rule and known caveat.
4. **[04 — Frontend architecture](./04-frontend-architecture.md)** —
   pages, components, data loading, theme, formatters, charts.
5. **[05 — Block D and qualitative notes](./05-block-d.md)** — how the
   curated narrative is structured and how I update it.
6. **[06 — Local development and deployment](./06-dev-and-deploy.md)** —
   environment, build commands, GitHub Pages workflow, troubleshooting.
7. **[07 — Update playbook](./07-update-playbook.md)** — concrete steps
   when a source releases new numbers or when I add a country / a new
   indicator.

## Conventions used here

- File paths are relative to the repository root unless stated.
- Country slugs follow the same convention as the dashboard (`bahrain`,
  `kuwait`, `oman`, `qatar`, `saudi-arabia`, `united-arab-emirates`).
- "Panel" means `datasets/merged_dataset.csv`, the harmonised long-format
  table I build in the notebook.
- "Latest" means the most recent year available in the extract being
  read. Several variables stop in 2020 or 2023 and are documented as
  such on the Methodology page.
