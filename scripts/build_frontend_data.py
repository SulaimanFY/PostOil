"""
PostOil — frontend data builder.

I keep all the dashboard derivations in this script so that I do not
need to re-run the notebook to refresh the site. The script reads my
harmonised panel `datasets/merged_dataset.csv` and writes:

    data/countries/{slug}.json     Block A (latest KPIs) + Block B series
    data/gcc/comparisons.json      Block C1/C2/C4 (multi-country views)
    data/gcc/overview.json         GCC overview page payload

A few derivations live here on purpose so the JSON build stays
self-contained:

- Tourism share fallback when WDI's % of exports series is missing,
  using `tourism_receipts_usd / exports_usd * 100` and an explicit
  `is_fallback` flag.
- Unified AI readiness: I expose Oxford's published 3-pillar headline
  for 2023-2024 and the 6-pillar mean for 2025 under a single column
  so every chart can use one comparable scale.
- Curated `hydrocarbon_gdp_share` per country (national-accounts
  vintage, see methodology page). I inject this directly during the
  build because it is not in the WDI panel.

I deliberately do not export any composite "diversification score"
that I prototyped during exploration. With six countries it implies a
ranking that is more confident than the data warrants.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
CSV_PATH = ROOT / "datasets" / "merged_dataset.csv"
DATA_DIR = ROOT / "data"
COUNTRIES_DIR = DATA_DIR / "countries"
GCC_DIR = DATA_DIR / "gcc"

GCC_COUNTRIES = [
    "Bahrain",
    "Kuwait",
    "Oman",
    "Qatar",
    "Saudi Arabia",
    "United Arab Emirates",
]

COUNTRY_META = {
    "Bahrain": {"slug": "bahrain", "iso_a3": "BHR"},
    "Kuwait": {"slug": "kuwait", "iso_a3": "KWT"},
    "Oman": {"slug": "oman", "iso_a3": "OMN"},
    "Qatar": {"slug": "qatar", "iso_a3": "QAT"},
    "Saudi Arabia": {"slug": "saudi-arabia", "iso_a3": "SAU"},
    "United Arab Emirates": {"slug": "united-arab-emirates", "iso_a3": "ARE"},
}

LEGACY_AI_PILLARS = [
    "government_pillar",
    "technology_sector_pillar",
    "data_infrastructure_pillar",
]
PILLARS_2025 = [
    "policy_capacity",
    "ai_infrastructure",
    "governance",
    "public_sector_adoption",
    "development_diffusion",
    "resilience",
]

SOURCE_LABELS = {
    "oil_rents_gdp": "World Bank WDI",
    "fuel_exports_pct": "World Bank WDI",
    "services_gdp": "World Bank WDI",
    "manufacturing_gdp": "World Bank WDI",
    "exports_gdp": "World Bank WDI",
    "imports_gdp": "World Bank WDI",
    "trade_openness_gdp": "World Bank WDI",
    "exports_imports_ratio": "World Bank WDI (derived)",
    "export_concentration": "UNCTAD",
    "tourism_receipts_pct_exports": "World Bank WDI",
    "tourism_receipts_usd": "World Bank WDI",
    "tourism_pct_exports_eff": "World Bank WDI",
    "exports_usd": "World Bank WDI",
    "imports_usd": "World Bank WDI",
    "gdp": "World Bank WDI",
    "gdp_per_capita": "World Bank WDI",
    "innovation_index": "WIPO Global Innovation Index",
    "innovation_rank": "WIPO Global Innovation Index",
    "ai_readiness": "Oxford Insights AI Readiness",
    "ai_readiness_unified": "Oxford Insights AI Readiness",
    "ai_readiness_rank": "Oxford Insights AI Readiness",
    "hydrocarbon_gdp_share": "National statistics (see methodology)",
}

# Hydrocarbon-sector share of GDP at the latest national-accounts
# vintage. I curate these by hand because they are not in the WDI panel.
# All six values are 2024 readings. The full source list is on the
# methodology page.
HYDROCARBON_GDP_SHARE = {
    "Saudi Arabia": {
        "value": 19.4,
        "year": 2024,
        "period_label": "2024",
        "source": "GASTAT, Annual National Accounts 2024",
        "source_url": (
            "https://www.stats.gov.sa/documents/20117/2435267/"
            "Annual%2BNational%2BAccounts%2BPublication%2B2024%2BEN.pdf"
            "/770f9e7b-444a-5d5e-5b75-f6825f2668d0"
        ),
        "note": "Crude oil and natural gas activities, share of GDP (2024).",
    },
    "United Arab Emirates": {
        "value": 24.5,
        "year": 2024,
        "period_label": "2024",
        "source": "FCSC (UAE), 2024 GDP release",
        "source_url": "https://fcsc.gov.ae/",
        "note": (
            "Implied oil-related share of real GDP. Derived as 100 minus the "
            "FCSC non-oil GDP share of 75.5% for 2024."
        ),
    },
    "Qatar": {
        "value": 36.0,
        "year": 2024,
        "period_label": "2024",
        "source": "Qatar News Agency, National Statistics Center release",
        "source_url": (
            "https://qna.org.qa/en/news-bulletins-details?"
            "date=20%2F03%2F2025&id=0076-qatari-economy-grows-24-yoy-in-2024"
        ),
        "note": (
            "Implied hydrocarbon share of GDP for 2024. Derived as 100 minus "
            "the non-hydrocarbon share of nearly 64% reported by the National "
            "Statistics Center for full-year 2024."
        ),
    },
    "Kuwait": {
        "value": 43.4,
        "year": 2024,
        "period_label": "2024",
        "source": "Kuwait, acting finance minister, public statement (Reuters)",
        "source_url": (
            "https://www.reuters.com/world/middle-east/"
            "kuwait-finance-minister-sees-boost-projects-diversification-"
            "under-parliament-2025-09-03"
        ),
        "note": "Oil sector share of GDP, 2024.",
    },
    "Oman": {
        "value": 34.6,
        "year": 2024,
        "period_label": "2024",
        "source": "NCSI Oman, Monthly Statistical Bulletin",
        "source_url": (
            "https://api.ncsi.gov.om/uploads/pdfs/"
            "monthly_statistical_bulletin___january_2026_1768895771.pdf"
        ),
        "note": (
            "Petroleum activities OMR 14,234.5 m / GDP at market prices "
            "OMR 41,194.3 m for 2024."
        ),
    },
    "Bahrain": {
        "value": 14.704,
        "year": 2024,
        "period_label": "2024",
        "source": "Kingdom of Bahrain, open data portal (constant prices)",
        "source_url": (
            "https://www.data.gov.bh/explore/dataset/"
            "02-annually-general-economic-indicators-by-constant-prices/table"
        ),
        "note": "Oil sector share of GDP at constant prices, 2024.",
    },
}

# Indicators that have a published world ranking we attach to the latest value.
RANK_FOR_INDICATOR = {
    "ai_readiness_unified": "ai_readiness_rank",
    "innovation_index": "innovation_rank",
}

# Block B: indicator subgroups for the country page
BLOCK_B_GROUPS = {
    "hydrocarbons": ["fuel_exports_pct", "oil_rents_gdp"],
    "diversification": ["export_concentration", "manufacturing_gdp", "services_gdp"],
    "tourism": ["tourism_pct_exports_eff", "tourism_receipts_usd"],
    "trade": [
        "exports_gdp",
        "imports_gdp",
        "trade_openness_gdp",
        "exports_imports_ratio",
    ],
    "macro_context": ["gdp", "gdp_per_capita"],
}

# Every single-series indicator I expose at country level.
COUNTRY_SERIES_COLS = sorted({c for cols in BLOCK_B_GROUPS.values() for c in cols})

# Block A KPI order. `hydrocarbon_gdp_share` is curated (see HYDROCARBON_GDP_SHARE
# above) and not pulled from the WDI panel.
BLOCK_A_KPIS = [
    "hydrocarbon_gdp_share",
    "fuel_exports_pct",
    "export_concentration",
    "tourism_pct_exports_eff",
    "tourism_receipts_usd",
    "gdp_per_capita",
    "gdp",
    "ai_readiness_unified",
    "innovation_index",
]

LATEST_WINDOW = (2015, 2025)

# I run a "latest credible" anomaly fallback on these columns. WDI
# sometimes revises a recent point down to near-zero (Bahrain
# `fuel_exports_pct` from 2021 onward is the textbook case). When that
# happens I prefer to show the last credible value with a clear note
# rather than a revised artefact.
KPI_ANOMALY_FALLBACK_COLS = {"fuel_exports_pct"}
KPI_ANOMALY_DROP_RATIO = 0.10  # below 10% of the recent historical maximum

# +1/-1 directional dashboard. Mirrors §3.4b in main.ipynb.
DASH_INDICATORS = [
    "export_concentration",
    "fuel_exports_pct",
    "manufacturing_gdp",
    "services_gdp",
    "tourism_pct_exports_eff",
]
DASH_LOWER_BETTER = {"export_concentration", "fuel_exports_pct"}
DASH_YEARS = list(range(2000, 2025))

# Window I use for the tourism cross-block lens.
TOURISM_LATEST_RANGE = (2017, 2023)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _to_native(value: Any) -> Any:
    """Convert numpy / pandas scalars to JSON-serialisable Python values."""
    if value is None:
        return None
    if isinstance(value, float) and np.isnan(value):
        return None
    if isinstance(value, (np.floating,)):
        v = float(value)
        return None if np.isnan(v) else v
    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.bool_,)):
        return bool(value)
    if pd.isna(value):
        return None
    return value


def _round(value: Any, digits: int = 4) -> Any:
    v = _to_native(value)
    if isinstance(v, float):
        return round(v, digits)
    return v


def _series_for(df: pd.DataFrame, col: str, country: str | None = None) -> list[dict[str, Any]]:
    sub = df[["year", col]].dropna(subset=[col]).sort_values("year")
    out: list[dict[str, Any]] = []
    for r in sub.itertuples(index=False):
        rec = {"year": int(r.year), "value": _round(r._asdict()[col])}
        if _is_series_revision_artefact(country, col, rec["year"], rec["value"]):
            rec["is_revision_artefact"] = True
        out.append(rec)
    return out


# I keep a tiny rule table for known WDI revision artefacts. Bahrain's
# `fuel_exports_pct` collapses to ~0 from 2021 onward while the historical
# baseline sits around 25-50% of merchandise exports, so I flag those points
# and let the frontend break the trajectory at the last credible year.
def _bahrain_fuel_artefact(year: int, value: Any) -> bool:
    """Mark implausible near-zero Bahrain fuel-export readings.

    WDI has two revision pockets on this series: an early-1990s stretch
    near 0% and a collapse from 2021 onward. I exclude both from drawn
    trajectories.
    """
    if value is None:
        return False
    try:
        v = float(value)
    except (TypeError, ValueError):
        return False
    if v >= 5.0:
        return False
    return year <= 2000 or year >= 2021


_SERIES_ARTEFACT_RULES = {
    ("Bahrain", "fuel_exports_pct"): _bahrain_fuel_artefact,
}


def _is_series_revision_artefact(country: str | None, col: str, year: int, value: Any) -> bool:
    rule = _SERIES_ARTEFACT_RULES.get((country, col))
    if rule is None:
        return False
    try:
        return bool(rule(year, value))
    except Exception:
        return False


def _latest_in_window(df: pd.DataFrame, col: str, window=LATEST_WINDOW) -> dict[str, Any] | None:
    lo, hi = window
    sub = df[(df["year"].between(lo, hi)) & df[col].notna()]
    if sub.empty:
        return None
    row = sub.sort_values("year").iloc[-1]
    return {
        "value": _round(row[col]),
        "year": int(row["year"]),
    }


def _latest_credible_in_window(
    df: pd.DataFrame, col: str, window=LATEST_WINDOW
) -> dict[str, Any] | None:
    """Pick the latest credible value for a KPI inside the recent window.

    For most columns I just take the most recent year. For the columns
    listed in ``KPI_ANOMALY_FALLBACK_COLS`` (only `fuel_exports_pct`
    today) I walk backwards and accept the first point whose magnitude
    is consistent with its history. The rule I apply is: the value
    must be at least ``max(1.0, 10% × max of the five preceding
    non-null years)``. This catches the WDI revision pattern I saw on
    Bahrain and Oman.
    """
    lo, hi = window
    sub = (
        df[(df["year"].between(lo, hi)) & df[col].notna()]
        .sort_values("year")
        .reset_index(drop=True)
    )
    if sub.empty:
        return None
    if col not in KPI_ANOMALY_FALLBACK_COLS or len(sub) < 3:
        row = sub.iloc[-1]
        return {"value": _round(row[col]), "year": int(row["year"])}

    raw_last = sub.iloc[-1]
    raw_last_v = float(raw_last[col])
    raw_last_y = int(raw_last["year"])

    accepted_idx = len(sub) - 1
    for i in range(len(sub) - 1, -1, -1):
        v = float(sub.iloc[i][col])
        prior = sub.iloc[max(0, i - 5) : i][col]
        if prior.empty:
            accepted_idx = i
            break
        ref = float(prior.max())
        cutoff = max(1.0, ref * KPI_ANOMALY_DROP_RATIO)
        if abs(v) >= cutoff:
            accepted_idx = i
            break

    row = sub.iloc[accepted_idx]
    base = {"value": _round(row[col]), "year": int(row["year"])}
    if accepted_idx != len(sub) - 1:
        base["is_imputed_latest"] = True
        base["raw_latest_value"] = _round(raw_last_v)
        base["raw_latest_year"] = raw_last_y
        base["note"] = (
            f"Most recent WDI value ({raw_last_y} = {raw_last_v:.3g}) looks "
            "like a data revision (below 10% of recent history); using the "
            f"last credible value ({int(row['year'])})."
        )
    return base


# ---------------------------------------------------------------------------
# Data loading + derived columns
# ---------------------------------------------------------------------------

def load_panel() -> pd.DataFrame:
    df = pd.read_csv(CSV_PATH)
    df = df[df["country"].isin(GCC_COUNTRIES)].copy()
    df["year"] = df["year"].astype(int)

    # exports_imports_ratio = exports_usd / imports_usd. I use it as a
    # structural trade-balance lens. Oil exporters sit well above 1 on
    # this ratio. A move toward 1 is a diversification signal because
    # the economy is buying more capital and consumption goods relative
    # to what it exports.
    ratio_mask = (
        df["exports_usd"].notna()
        & df["imports_usd"].notna()
        & (df["imports_usd"] > 0)
    )
    df["exports_imports_ratio"] = np.nan
    df.loc[ratio_mask, "exports_imports_ratio"] = (
        df.loc[ratio_mask, "exports_usd"] / df.loc[ratio_mask, "imports_usd"]
    )

    # tourism_pct_exports_eff: I use the WDI direct series when present,
    # then fall back to receipts in USD divided by total exports in USD.
    df["tourism_pct_exports_eff"] = df["tourism_receipts_pct_exports"]
    fallback = (
        df["tourism_pct_exports_eff"].isna()
        & df["tourism_receipts_usd"].notna()
        & df["exports_usd"].notna()
        & (df["exports_usd"] > 0)
    )
    df.loc[fallback, "tourism_pct_exports_eff"] = (
        df.loc[fallback, "tourism_receipts_usd"]
        / df.loc[fallback, "exports_usd"]
        * 100.0
    )
    df["tourism_pct_exports_eff_is_fallback"] = fallback

    # Unified AI score across 2023-2025.
    # 2023-2024: I take the published `ai_readiness` column, which is
    #            the legacy three-pillar mean. If that column is missing
    #            I fall back to the row mean of the legacy pillars.
    # 2025:      I average the six 2025 pillars myself, since Oxford
    #            redesigned the index for this edition.
    df["ai_readiness_unified"] = np.nan
    mask_2324 = df["year"].isin([2023, 2024])
    df.loc[mask_2324, "ai_readiness_unified"] = df.loc[mask_2324, "ai_readiness"]
    miss_2324 = mask_2324 & df["ai_readiness_unified"].isna()
    df.loc[miss_2324, "ai_readiness_unified"] = (
        df.loc[miss_2324, LEGACY_AI_PILLARS].mean(axis=1, skipna=True)
    )
    mask_2025 = df["year"] == 2025
    df.loc[mask_2025, "ai_readiness_unified"] = (
        df.loc[mask_2025, PILLARS_2025].mean(axis=1, skipna=True)
    )

    return df


# ---------------------------------------------------------------------------
# Block A + Block B (per country)
# ---------------------------------------------------------------------------

def build_country_payload(df: pd.DataFrame, country: str) -> dict[str, Any]:
    cdf = df[df["country"] == country].sort_values("year").copy()
    meta = COUNTRY_META[country]

    # Block A: latest credible value inside the recent window.
    block_a: dict[str, Any] = {}
    for kpi in BLOCK_A_KPIS:
        if kpi == "hydrocarbon_gdp_share":
            # Curated from national accounts, not the WDI panel.
            curated = HYDROCARBON_GDP_SHARE.get(country)
            block_a[kpi] = (
                {
                    "value": _round(curated["value"]),
                    "year": int(curated["year"]),
                    "period_label": curated["period_label"],
                    "source": curated["source"],
                    "note": curated["note"],
                }
                if curated
                else None
            )
            continue
        latest = _latest_credible_in_window(cdf, kpi)
        if latest is None:
            block_a[kpi] = None
            continue
        entry = {**latest, "source": SOURCE_LABELS.get(kpi, "")}
        if kpi == "tourism_pct_exports_eff":
            # Surface the fallback flag so the source label can switch
            # to "(derived)" on the KPI card.
            year = latest["year"]
            row = cdf[cdf["year"] == year].iloc[0]
            entry["is_fallback"] = bool(row["tourism_pct_exports_eff_is_fallback"])
            if entry["is_fallback"]:
                entry["source"] = "World Bank WDI (derived)"
                entry["note"] = (
                    "Derived because the WDI tourism-as-%-of-exports series is "
                    "missing for this country-year: tourism_receipts_usd / exports_usd * 100."
                )
        if kpi == "ai_readiness_unified":
            # Attach the computation note so the tooltip explains which
            # version of the Oxford score I am showing.
            year = latest["year"]
            entry["source"] = "Oxford Insights AI Readiness"
            if year == 2025:
                entry["note"] = "Computed: mean of six 2025 pillars"
            else:
                entry["note"] = "Legacy three-pillar mean (Oxford 2023-2024)"
        # Attach the world rank if Oxford or WIPO publishes one for that year.
        rank_col = RANK_FOR_INDICATOR.get(kpi)
        if rank_col and rank_col in cdf.columns:
            year = latest["year"]
            row = cdf[cdf["year"] == year]
            if not row.empty and pd.notna(row.iloc[0][rank_col]):
                entry["world_rank"] = int(row.iloc[0][rank_col])
        block_a[kpi] = entry

    # Block B: time series for everything I expose at country level.
    series: dict[str, list[dict[str, Any]]] = {}
    for col in COUNTRY_SERIES_COLS:
        series[col] = _series_for(cdf, col, country=country)
    # Sparse unified AI readiness series across 2023-2025.
    ai_sub = cdf[cdf["year"].isin([2023, 2024, 2025])][["year", "ai_readiness_unified"]]
    ai_sub = ai_sub.dropna(subset=["ai_readiness_unified"]).sort_values("year")
    series["ai_readiness_unified"] = [
        {"year": int(r.year), "value": _round(r.ai_readiness_unified)}
        for r in ai_sub.itertuples(index=False)
    ]
    # GII has only the 2025 row in this dataset.
    inno_sub = cdf[["year", "innovation_index"]].dropna(subset=["innovation_index"])
    series["innovation_index"] = [
        {"year": int(r.year), "value": _round(r.innovation_index)}
        for r in inno_sub.itertuples(index=False)
    ]

    return {
        "country": {
            "name": country,
            "slug": meta["slug"],
            "iso_a3": meta["iso_a3"],
        },
        "data_window": {
            "first_year": int(cdf["year"].min()),
            "last_year": int(cdf["year"].max()),
            "kpi_window": list(LATEST_WINDOW),
        },
        "block_a_kpis": block_a,
        "block_b_series": series,
        "block_b_groups": BLOCK_B_GROUPS,
    }


# ---------------------------------------------------------------------------
# Block C: comparisons + dashboard
# ---------------------------------------------------------------------------

def build_comparisons(df: pd.DataFrame) -> dict[str, Any]:
    # C1: multi-country trajectories for the headline diversification indicators.
    c1_indicators = [
        "fuel_exports_pct",
        "export_concentration",
        "tourism_pct_exports_eff",
        "tourism_receipts_usd",
        "manufacturing_gdp",
        "services_gdp",
        "oil_rents_gdp",
        "gdp",
        "gdp_per_capita",
        "exports_imports_ratio",
    ]
    c1: dict[str, list[dict[str, Any]]] = {}
    for col in c1_indicators:
        out: list[dict[str, Any]] = []
        for country in GCC_COUNTRIES:
            cdf = df[df["country"] == country][["year", col]].dropna(subset=[col]).sort_values("year")
            if cdf.empty:
                continue
            series_points: list[dict[str, Any]] = []
            for r in cdf.itertuples(index=False):
                rec = {"year": int(r.year), "value": _round(r._asdict()[col])}
                if _is_series_revision_artefact(country, col, rec["year"], rec["value"]):
                    rec["is_revision_artefact"] = True
                series_points.append(rec)
            out.append({
                "country": country,
                "slug": COUNTRY_META[country]["slug"],
                "series": series_points,
            })
        c1[col] = out

    # C2: cross-block scatter datasets. Mirrors §3.4 in main.ipynb.
    def _scatter(year_filter, x_col, y_col, x_label, y_label, title, subtitle, hue_year=False):
        sub = df[year_filter].copy()
        sub = sub.dropna(subset=[x_col, y_col])
        return {
            "title": title,
            "subtitle": subtitle,
            "x_label": x_label,
            "y_label": y_label,
            "x_col": x_col,
            "y_col": y_col,
            "hue_year": hue_year,
            "points": [
                {
                    "country": r["country"],
                    "slug": COUNTRY_META[r["country"]]["slug"],
                    "year": int(r["year"]),
                    "x": _round(r[x_col]),
                    "y": _round(r[y_col]),
                }
                for _, r in sub.iterrows()
            ],
        }

    macro_ai_window = df["year"].isin([2023, 2024])
    c2 = {
        "gdp_per_capita_vs_ai_readiness_2023_2024": _scatter(
            macro_ai_window,
            "gdp_per_capita",
            "ai_readiness",
            "GDP per capita (USD)",
            "Oxford AI readiness (legacy 3-pillar mean)",
            "GDP per capita vs AI readiness (2023-2024)",
            "Same-row only. 2025 GCC rows have no WDI macro values.",
            hue_year=True,
        ),
        "export_concentration_vs_ai_readiness_2023_2024": _scatter(
            macro_ai_window,
            "export_concentration",
            "ai_readiness",
            "Export concentration (UNCTAD)",
            "Oxford AI readiness (legacy 3-pillar mean)",
            "Export concentration vs AI readiness (2023-2024)",
            "Lower concentration = more diversified export basket.",
            hue_year=True,
        ),
        "ai_unified_vs_log10_gdp_2023_2025": None,  # filled below
        "ai_2025_vs_gii_2025": None,
    }

    # Unified AI vs log10(GDP). I have AI for 2025 but no WDI GDP for 2025
    # in this extract, so the valid same-row points are 2023-2024 only.
    sub = df[df["year"].isin([2023, 2024, 2025])].copy()
    sub = sub.dropna(subset=["gdp", "ai_readiness_unified"])
    sub["log10_gdp"] = np.log10(sub["gdp"].where(sub["gdp"] > 0))
    sub = sub.dropna(subset=["log10_gdp"])
    c2["ai_unified_vs_log10_gdp_2023_2025"] = {
        "title": "AI readiness vs log10(GDP), valid same-row years",
        "subtitle": (
            "Valid same-row points are currently 2023-2024 because WDI GDP "
            "is missing for 2025 in this extract."
        ),
        "x_label": "log10(GDP, USD)",
        "y_label": "AI readiness",
        "x_col": "log10_gdp",
        "y_col": "ai_readiness_unified",
        "hue_year": True,
        "points": [
            {
                "country": r["country"],
                "slug": COUNTRY_META[r["country"]]["slug"],
                "year": int(r["year"]),
                "x": _round(r["log10_gdp"]),
                "y": _round(r["ai_readiness_unified"]),
            }
            for _, r in sub.iterrows()
        ],
    }

    # AI 2025 (six-pillar mean) vs GII 2025.
    sub25 = df[df["year"] == 2025][["country", "ai_readiness_unified", "innovation_index"]]
    sub25 = sub25.dropna(subset=["ai_readiness_unified", "innovation_index"])
    c2["ai_2025_vs_gii_2025"] = {
        "title": "AI readiness 2025 (6-pillar mean) vs Innovation index 2025",
        "subtitle": "Same-row 2025 data, n = 6, descriptive only.",
        "x_label": "AI readiness 2025 (six-pillar mean)",
        "y_label": "Innovation index (GII 2025)",
        "x_col": "ai_readiness_unified",
        "y_col": "innovation_index",
        "hue_year": False,
        "points": [
            {
                "country": r["country"],
                "slug": COUNTRY_META[r["country"]]["slug"],
                "year": 2025,
                "x": _round(r["ai_readiness_unified"]),
                "y": _round(r["innovation_index"]),
            }
            for _, r in sub25.iterrows()
        ],
    }

    # Lagged macro 2024 vs GII 2025 — export concentration, log10(GDP),
    # GDP per capita.
    macro_2024 = df[df["year"] == 2024][[
        "country", "export_concentration", "gdp", "gdp_per_capita",
    ]].copy()
    macro_2024["log10_gdp"] = np.log10(
        macro_2024["gdp"].where(macro_2024["gdp"] > 0)
    )
    gii_2025_full = df[df["year"] == 2025][["country", "innovation_index"]].rename(
        columns={"innovation_index": "gii_2025"}
    )
    cross_gii = macro_2024.merge(gii_2025_full, on="country", how="inner")

    def _macro_vs_gii(x_col: str, x_label: str, title: str, subtitle: str):
        sub = cross_gii.dropna(subset=[x_col, "gii_2025"]).copy()
        return {
            "title": title,
            "subtitle": subtitle,
            "x_label": x_label,
            "y_label": "Innovation index (GII 2025)",
            "x_col": x_col,
            "y_col": "innovation_index",
            "hue_year": False,
            "points": [
                {
                    "country": r["country"],
                    "slug": COUNTRY_META[r["country"]]["slug"],
                    "year": 2024,
                    "x": _round(r[x_col]),
                    "y": _round(r["gii_2025"]),
                }
                for _, r in sub.iterrows()
            ],
        }

    c2["concentration_vs_gii_2025"] = _macro_vs_gii(
        "export_concentration",
        "Export concentration 2024 (UNCTAD)",
        "Export concentration (2024) vs Innovation index (GII 2025)",
        "Lagged pairing, descriptive only. Lower x = more diversified export basket.",
    )
    c2["log10_gdp_vs_gii_2025"] = _macro_vs_gii(
        "log10_gdp",
        "log10(GDP, USD) 2024",
        "Economy size, log10(GDP) 2024, vs Innovation index (GII 2025)",
        "Lagged pairing, descriptive only. Tests whether economic scale lines up with innovation outcome.",
    )
    c2["gdp_per_capita_vs_gii_2025"] = _macro_vs_gii(
        "gdp_per_capita",
        "GDP per capita 2024 (USD)",
        "GDP per capita (2024) vs Innovation index (GII 2025)",
        "Lagged pairing, descriptive only. High income does not mechanically imply high innovation outcome.",
    )

    # Tourism cross-block lens — latest tourism row inside 2017-2023
    # paired with AI 2023 and GII 2025.
    lo, hi = TOURISM_LATEST_RANGE
    win = df[df["year"].between(lo, hi)].copy()
    has_tourism = win[["tourism_pct_exports_eff", "tourism_receipts_usd"]].notna().any(axis=1)
    win = win[has_tourism]
    idx = win.groupby("country")["year"].idxmax()
    latest = win.loc[idx, [
        "country", "year", "tourism_pct_exports_eff",
        "tourism_receipts_usd", "tourism_pct_exports_eff_is_fallback",
    ]].rename(columns={"year": "tourism_year"})

    ai_2023 = df[df["year"] == 2023][["country", "ai_readiness"]].rename(
        columns={"ai_readiness": "ai_readiness_2023"}
    )
    gii_2025 = df[df["year"] == 2025][["country", "innovation_index"]].rename(
        columns={"innovation_index": "gii_2025"}
    )
    cross = latest.merge(ai_2023, on="country", how="left").merge(gii_2025, on="country", how="left")
    cross["log10_tourism_usd"] = np.log10(
        cross["tourism_receipts_usd"].where(cross["tourism_receipts_usd"] > 0)
    )

    tourism_lens_points = [
        {
            "country": r["country"],
            "slug": COUNTRY_META[r["country"]]["slug"],
            "tourism_year": int(r["tourism_year"]),
            "tourism_pct_exports_eff": _round(r["tourism_pct_exports_eff"]),
            "tourism_pct_exports_eff_is_fallback": bool(r["tourism_pct_exports_eff_is_fallback"]),
            "tourism_receipts_usd": _round(r["tourism_receipts_usd"]),
            "log10_tourism_usd": _round(r["log10_tourism_usd"]),
            "ai_readiness_2023": _round(r["ai_readiness_2023"]),
            "gii_2025": _round(r["gii_2025"]),
        }
        for _, r in cross.iterrows()
    ]
    c2["tourism_lens_constructed"] = {
        "title": "Tourism cross-block lens",
        "subtitle": (
            "Latest tourism row per country in 2017-2023; derived from receipts/exports when WDI % series is missing. "
            "Paired with AI readiness 2023 and GII 2025. Constructed merge, non-causal."
        ),
        "window": list(TOURISM_LATEST_RANGE),
        "points": tourism_lens_points,
    }

    # C4: year-by-year +1/-1 dashboard.
    dash = build_dashboard(df)

    return {
        "c1_country_series": c1,
        "c2_cross_block": c2,
        "c4_directional_dashboard": dash,
    }


def build_dashboard(df: pd.DataFrame) -> dict[str, Any]:
    pairs = list(zip(DASH_YEARS[:-1], DASH_YEARS[1:]))
    sub = df[df["year"].isin(DASH_YEARS)][["country", "year"] + DASH_INDICATORS].copy()

    pair_payload: list[dict[str, Any]] = []
    for y0, y1 in pairs:
        rows = []
        for country in GCC_COUNTRIES:
            cdf = sub[sub["country"] == country]
            r0 = cdf[cdf["year"] == y0]
            r1 = cdf[cdf["year"] == y1]
            entry = {
                "country": country,
                "slug": COUNTRY_META[country]["slug"],
                "directions": {},
                "deltas": {},
                "net_score": 0,
            }
            net = 0
            for ind in DASH_INDICATORS:
                v0 = r0[ind].iloc[0] if not r0.empty else np.nan
                v1 = r1[ind].iloc[0] if not r1.empty else np.nan
                if pd.isna(v0) or pd.isna(v1):
                    entry["directions"][ind] = None
                    entry["deltas"][ind] = None
                    continue
                delta = float(v1) - float(v0)
                entry["deltas"][ind] = _round(delta)
                if v1 == v0:
                    entry["directions"][ind] = 0
                    continue
                improved = (v1 < v0) if ind in DASH_LOWER_BETTER else (v1 > v0)
                d = 1 if improved else -1
                entry["directions"][ind] = d
                net += d
            entry["net_score"] = int(net)
            rows.append(entry)
        pair_payload.append({
            "from_year": int(y0),
            "to_year": int(y1),
            "label": f"{y0}->{y1}",
            "rows": rows,
        })

    return {
        "indicators": [
            {"col": col, "lower_is_better": col in DASH_LOWER_BETTER}
            for col in DASH_INDICATORS
        ],
        "year_pairs": pair_payload,
    }


def _country_direction_counters(dash: dict[str, Any]) -> dict[str, dict[str, Any]]:
    """Aggregate the year-by-year directional dashboard per country.

    For each country I sum, across the 2000-2024 pairs, how many year
    steps were favourable, unfavourable, flat or missing for each
    indicator. The result is consumed by `directionalDashboardInsight`
    on the country pages and feeds the "X improvements vs Y
    worsenings" line.
    """
    out: dict[str, dict[str, Any]] = {}
    inds = [i["col"] for i in dash["indicators"]]
    pairs = dash["year_pairs"]
    for country in GCC_COUNTRIES:
        per_ind: dict[str, dict[str, Any]] = {
            ind: {"improved": 0, "deteriorated": 0, "flat": 0, "missing": 0}
            for ind in inds
        }
        totals = {"improved": 0, "deteriorated": 0, "flat": 0, "missing": 0}
        # Walk pairs in order to capture first/last observed values per indicator.
        first_seen: dict[str, dict[str, Any]] = {}
        last_seen: dict[str, dict[str, Any]] = {}
        for pair in pairs:
            row = next((r for r in pair["rows"] if r["country"] == country), None)
            if row is None:
                continue
            for ind in inds:
                d = row["directions"].get(ind)
                if d is None:
                    per_ind[ind]["missing"] += 1
                    totals["missing"] += 1
                    continue
                if d == 0:
                    per_ind[ind]["flat"] += 1
                    totals["flat"] += 1
                elif d == 1:
                    per_ind[ind]["improved"] += 1
                    totals["improved"] += 1
                else:
                    per_ind[ind]["deteriorated"] += 1
                    totals["deteriorated"] += 1
        out[country] = {"per_indicator": per_ind, "totals": totals}
    return out


# ---------------------------------------------------------------------------
# GCC overview page payload
# ---------------------------------------------------------------------------

def build_overview(df: pd.DataFrame, comparisons: dict[str, Any], country_payloads: dict[str, dict[str, Any]]) -> dict[str, Any]:
    snapshot_indicators = [
        "hydrocarbon_gdp_share",
        "fuel_exports_pct",
        "export_concentration",
        "tourism_pct_exports_eff",
        "gdp",
        "gdp_per_capita",
        "ai_readiness_unified",
        "innovation_index",
    ]
    snapshots = []
    for country in GCC_COUNTRIES:
        cdf = df[df["country"] == country]
        snap = {
            "country": country,
            "slug": COUNTRY_META[country]["slug"],
            "iso_a3": COUNTRY_META[country]["iso_a3"],
        }
        for kpi in snapshot_indicators:
            if kpi == "hydrocarbon_gdp_share":
                curated = HYDROCARBON_GDP_SHARE.get(country)
                snap[kpi] = (
                    {
                        "value": _round(curated["value"]),
                        "year": int(curated["year"]),
                        "period_label": curated["period_label"],
                        "source": curated["source"],
                        "note": curated["note"],
                    }
                    if curated
                    else None
                )
                continue
            latest = _latest_credible_in_window(cdf, kpi)
            if latest:
                latest["source"] = SOURCE_LABELS.get(kpi, "")
            if latest and kpi == "tourism_pct_exports_eff":
                year = latest["year"]
                row = cdf[cdf["year"] == year]
                if not row.empty:
                    fb = bool(row.iloc[0]["tourism_pct_exports_eff_is_fallback"])
                    latest["is_fallback"] = fb
                    if fb:
                        latest["source"] = "World Bank WDI (derived)"
                        latest["note"] = (
                            "Derived because the WDI tourism-as-%-of-exports series is "
                            "missing for this country-year: tourism_receipts_usd / exports_usd × 100."
                        )
            # Attach world rank when published.
            if latest is not None:
                rank_col = RANK_FOR_INDICATOR.get(kpi)
                if rank_col and rank_col in cdf.columns:
                    year = latest["year"]
                    row = cdf[cdf["year"] == year]
                    if not row.empty and pd.notna(row.iloc[0][rank_col]):
                        latest["world_rank"] = int(row.iloc[0][rank_col])
            snap[kpi] = latest
        snapshots.append(snap)

    # Intra-GCC ranks per country, used by the Block C narrative on each
    # country page.
    rank_table = _intra_gcc_ranks(snapshots, snapshot_indicators)

    return {
        "title": "GCC overview",
        "main_question": (
            "What differentiates GCC countries in their post-oil transition, "
            "and which factors are associated with stronger diversification outcomes?"
        ),
        "snapshot_window": list(LATEST_WINDOW),
        "country_snapshots": snapshots,
        "headline_indicators": snapshot_indicators,
        "intra_gcc_ranks": rank_table,
        "tourism_lens_window": list(TOURISM_LATEST_RANGE),
        "tourism_lens_points": comparisons["c2_cross_block"]["tourism_lens_constructed"]["points"],
        "directional_pairs_count": len(comparisons["c4_directional_dashboard"]["year_pairs"]),
        "methodology_pointers": [
            "Descriptive comparison, not causal inference.",
            "n = 6 (GCC); mixed-vintage sources.",
            "Tourism share fallback: when WDI % of exports is missing, use tourism_receipts_usd / exports_usd * 100 and flag it.",
            "AI readiness 2025 = mean of six 2025 Oxford pillars.",
        ],
    }


# ---------------------------------------------------------------------------
# Intra-GCC ranks (used for the country-page Block C narrative)
# ---------------------------------------------------------------------------

# Indicators where a LOWER value marks the more diversified position. I rank
# them ascending so that rank 1 = best (lowest concentration, lowest fuel
# share, lowest oil rents, lowest hydrocarbon GDP share).
LOWER_IS_BETTER = {
    "fuel_exports_pct",
    "export_concentration",
    "oil_rents_gdp",
    "hydrocarbon_gdp_share",
}


def _intra_gcc_ranks(snapshots: list[dict[str, Any]], indicators: list[str]) -> dict[str, dict[str, Any]]:
    """Compute intra-GCC ranks per indicator.

    Returns ``{country: {indicator: {rank, value, year, total}}}``.

    Rank 1 is the most favourable position (lowest concentration,
    lowest fuel share, lowest oil rents, lowest hydrocarbon GDP share,
    highest services share, highest GDP per capita, and so on).
    """
    by_country: dict[str, dict[str, Any]] = {s["country"]: {} for s in snapshots}
    for ind in indicators:
        rows = []
        for snap in snapshots:
            entry = snap.get(ind)
            if entry and entry.get("value") is not None:
                rows.append((snap["country"], float(entry["value"]), int(entry["year"])))
        if not rows:
            continue
        ascending = ind in LOWER_IS_BETTER
        rows.sort(key=lambda r: r[1], reverse=not ascending)
        total = len(rows)
        for rank, (country, value, year) in enumerate(rows, start=1):
            by_country[country][ind] = {
                "rank": rank,
                "value": _round(value),
                "year": year,
                "total": total,
            }
    return by_country


# ---------------------------------------------------------------------------
# Write helpers
# ---------------------------------------------------------------------------

def _write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)


def main() -> None:
    df = load_panel()

    COUNTRIES_DIR.mkdir(parents=True, exist_ok=True)
    GCC_DIR.mkdir(parents=True, exist_ok=True)

    # Per-country payload — Block A KPIs and Block B series.
    country_payloads: dict[str, dict[str, Any]] = {}
    for country in GCC_COUNTRIES:
        payload = build_country_payload(df, country)
        country_payloads[country] = payload

    # GCC comparisons — Block C1, C2 and the C4 directional dashboard.
    comparisons = build_comparisons(df)
    _write_json(GCC_DIR / "comparisons.json", comparisons)

    # Overview payload. This also produces the intra-GCC ranks I inject
    # back into the country payloads below.
    overview = build_overview(df, comparisons, country_payloads)
    _write_json(GCC_DIR / "overview.json", overview)

    # Inject intra-GCC ranks and the per-country directional counters
    # into each country payload, then write the country JSONs.
    direction_counters = _country_direction_counters(comparisons["c4_directional_dashboard"])
    for country in GCC_COUNTRIES:
        slug = COUNTRY_META[country]["slug"]
        payload = country_payloads[country]
        payload["intra_gcc_ranks"] = overview["intra_gcc_ranks"].get(country, {})
        payload["directional_summary"] = direction_counters.get(country, {})
        _write_json(COUNTRIES_DIR / f"{slug}.json", payload)

    # Clean up the legacy `scores.json` from earlier prototypes.
    legacy_scores = GCC_DIR / "scores.json"
    if legacy_scores.exists():
        legacy_scores.unlink()

    print("Wrote:")
    for country in GCC_COUNTRIES:
        slug = COUNTRY_META[country]["slug"]
        print(f"  data/countries/{slug}.json")
    print("  data/gcc/comparisons.json")
    print("  data/gcc/overview.json")


if __name__ == "__main__":
    main()
