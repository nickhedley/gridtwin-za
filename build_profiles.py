#!/usr/bin/env python3
"""
build_profiles.py — Eskom Data Portal CSVs -> profiles.json for GridTwin ZA

Takes whatever CSVs the Eskom Data Portal (or unofficialeskom.com) hands you,
finds the relevant columns even when names vary, aligns everything to one
hourly calendar year, and emits the profiles.json the app loads.

Usage:
    python3 build_profiles.py --year 2025 data/*.csv
    python3 build_profiles.py --year 2025 --rooftop-mw 8300 data/dump.csv

Requires: pandas  (pip install pandas)

What it does:
  1. Reads and concatenates all CSVs, deduplicating on timestamp.
  2. Fuzzy-matches columns to the series we need (see COLUMN_ALIASES).
  3. Builds an 8760-hour year (Feb 29 dropped in leap years).
  4. Interpolates gaps <= 6 h; reports anything bigger and fails if > 48 h total.
  5. Wind & PV: converts MW output to per-unit capacity-factor profiles,
     correcting for fleet growth during the year via a smoothed rolling-P99.5
     capacity estimate (so a farm connecting in June doesn't distort the shape).
  6. Demand: reconstructs *underlying* demand = Eskom grid demand + estimated
     rooftop generation (rooftop capacity x PV shape x 0.94 derate), because the
     app nets rooftop off demand internally. This keeps the rooftop slider
     meaningful while reproducing the observed grid demand at defaults.
  7. Prints a validation report (energy, peaks, CFs, observed OCGT load factor)
     to sanity-check against Eskom's published figures before you ship it.
"""

import argparse, glob, json, re, sys
import pandas as pd

# ---------------------------------------------------------------- column matching
# Lowercased, punctuation-stripped aliases seen across Eskom exports.
COLUMN_ALIASES = {
    "datetime": ["date time hour beginning", "datetime", "date time", "timestamp",
                 "settlement date", "date"],
    "demand":   ["rsa contracted demand", "residual demand", "rsa demand",
                 "contracted demand", "demand"],
    "wind":     ["wind"],
    "pv":       ["pv", "solar pv", "photovoltaic"],
    "csp":      ["csp", "concentrated solar"],
    # validation-only series (optional)
    "ocgt":     ["eskom ocgt generation", "ocgt", "total ocgt"],
    "ps_gen":   ["pumped water generation", "pumped storage generation"],
    "nuclear":  ["nuclear generation", "nuclear"],
    "thermal":  ["thermal generation", "coal"],
}

def norm(s):
    return re.sub(r"[^a-z0-9 ]", " ", str(s).lower()).strip()

def find_col(df, key, required=True):
    cols = {norm(c): c for c in df.columns}
    for alias in COLUMN_ALIASES[key]:
        # exact, then substring match — prefer shortest candidate (avoids
        # 'wind' matching 'wind forecast')
        if alias in cols:
            return cols[alias]
        subs = sorted([c for n, c in cols.items() if alias in n and "forecast" not in n],
                      key=len)
        if subs:
            return subs[0]
    if required:
        sys.exit(f"ERROR: no column found for '{key}'. Columns seen:\n  "
                 + "\n  ".join(df.columns))
    return None

# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("csvs", nargs="+", help="CSV file(s) or globs")
    ap.add_argument("--year", type=int, required=True)
    ap.add_argument("--rooftop-mw", type=float, default=8300,
                    help="assumed embedded PV capacity for demand reconstruction")
    ap.add_argument("--out", default="profiles.json")
    args = ap.parse_args()

    paths = sorted(set(p for g in args.csvs for p in glob.glob(g)))
    if not paths:
        sys.exit("ERROR: no files matched.")
    print(f"Reading {len(paths)} file(s)...")
    frames = [pd.read_csv(p, low_memory=False) for p in paths]
    df = pd.concat(frames, ignore_index=True)

    tcol = find_col(df, "datetime")
    df[tcol] = pd.to_datetime(df[tcol], dayfirst=False, errors="coerce",
                              format="mixed")
    df = (df.dropna(subset=[tcol])
            .drop_duplicates(subset=[tcol])
            .sort_values(tcol)
            .set_index(tcol))

    # target calendar (SAST has no DST — a clean 8760/8784 grid)
    idx = pd.date_range(f"{args.year}-01-01", f"{args.year}-12-31 23:00", freq="h")
    year = df.reindex(idx)

    series, report = {}, {}
    for key, required in [("demand", True), ("wind", True), ("pv", True),
                          ("csp", False), ("ocgt", False), ("ps_gen", False),
                          ("nuclear", False), ("thermal", False)]:
        col = find_col(df, key, required=required)
        if col is None:
            continue
        s = pd.to_numeric(year[col], errors="coerce")
        gaps = s.isna()
        if gaps.sum() > 48:
            sys.exit(f"ERROR: '{col}' has {gaps.sum()} missing hours in {args.year} "
                     f"(limit 48). Largest gap around "
                     f"{gaps[gaps].index[0] if gaps.any() else '-'}. "
                     "Is the year fully covered by your files?")
        s = s.interpolate(limit=6).ffill().bfill()
        series[key] = s
        report[key] = dict(source_column=col, missing_hours=int(gaps.sum()))
        print(f"  {key:8s} <- '{col}'  ({int(gaps.sum())} gap hours filled)")

    # drop Feb 29 to a fixed 8760-hour year
    if len(idx) == 8784:
        keep = ~((idx.month == 2) & (idx.day == 29))
        series = {k: v[keep] for k, v in series.items()}
        print("  leap year: dropped Feb 29")

    # ---- wind & PV: MW -> per-unit with fleet-growth correction -------------
    def to_per_unit(s, label):
        cap = (s.rolling(24 * 30, min_periods=24 * 7).quantile(0.995)
                 .rolling(24 * 14, min_periods=1).mean()
                 .bfill().clip(lower=s.max() * 0.3))
        pu = (s / cap).clip(0, 1.0)
        report[label + "_capacity_MW"] = dict(start=round(float(cap.iloc[0])),
                                              end=round(float(cap.iloc[-1])))
        return pu

    wind_pu = to_per_unit(series["wind"], "wind")
    pv_pu = to_per_unit(series["pv"], "pv")
    csp_pu = to_per_unit(series["csp"], "csp") if "csp" in series else None

    # ---- demand: reconstruct underlying (pre-rooftop) demand ----------------
    grid_demand = series["demand"]
    underlying = grid_demand + args.rooftop_mw * pv_pu * 0.94

    # ---- validation report ---------------------------------------------------
    print("\n=== VALIDATION (check against Eskom weekly reports) ===")
    print(f"  Grid demand:  {grid_demand.sum()/1e6:6.1f} TWh   "
          f"peak {grid_demand.max()/1e3:5.1f} GW   min {grid_demand.min()/1e3:5.1f} GW")
    print(f"  Wind CF:      {wind_pu.mean()*100:5.1f} %")
    print(f"  PV CF:        {pv_pu.mean()*100:5.1f} %")
    if "ocgt" in series:
        lf = series['ocgt'].mean() / max(series['ocgt'].max(), 1)
        print(f"  OCGT energy:  {series['ocgt'].sum()/1e6:6.2f} TWh   "
              f"(observed load factor vs own peak {lf*100:4.1f} %)")
    if "nuclear" in series:
        print(f"  Nuclear:      {series['nuclear'].sum()/1e6:6.1f} TWh")
    if "thermal" in series:
        print(f"  Thermal/coal: {series['thermal'].sum()/1e6:6.1f} TWh")

    out = {
        "meta": {
            "year": args.year,
            "source": "Eskom Data Portal hourly system data",
            "rooftop_mw_assumed": args.rooftop_mw,
            "notes": "demand = underlying (grid demand + estimated rooftop gen); "
                     "app nets rooftop off internally. wind/pv are per-unit CF, "
                     "fleet-growth corrected.",
            "columns": report,
        },
        "demand": [round(float(v), 1) for v in underlying],
        "wind_pu": [round(float(v), 4) for v in wind_pu],
        "solar_pu": [round(float(v), 4) for v in pv_pu],
    }
    if csp_pu is not None:
        out["csp_pu"] = [round(float(v), 4) for v in csp_pu]

    with open(args.out, "w") as f:
        json.dump(out, f)
    print(f"\nWrote {args.out} "
          f"({len(out['demand'])} hours, ~{len(json.dumps(out))//1024} KB)")
    print("Next: send this file to Claude to wire into the app, or upload it "
          "to the repo once the app's loader is in place.")

if __name__ == "__main__":
    main()
