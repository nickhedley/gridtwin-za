#!/usr/bin/env python3
"""
Fetch multiple weather years of South African wind and solar profiles.

WHY THIS MATTERS
GridTwin currently runs on a single weather year (Renewables.ninja 2023 for the
regional profiles, Eskom 2025 for demand). Every result - adequacy, curtailment,
the least-cost build schedule - is therefore conditioned on one year's weather.

That is the model's weakest methodological assumption, and South Africa is the
worst place in Africa to make it:

  * A 2025 study (arXiv:2510.21873) finds South Africa has "the continent's most
    variable solar resource", with a coefficient of variation approaching 0.4,
    driven by ENSO, the Indian Ocean Dipole and subtropical circulation shifts.
  * A 30-weather-year study of Europe found that using multiple years revealed a
    FIVE-FOLD increase in the inter-annual variability of system costs and
    emissions versus a single-year run.
  * CIGRE's analysis of real South African plant data (2014-2016) recorded hours
    where the COMBINED wind and solar capacity factor was 0%.

With coal retiring and renewables heading past 50% of supply, weather - not
plant availability - becomes the dominant risk. The risk panel currently varies
only coal EAF, which is the right variable for today's system and the wrong one
for the system being planned.

USAGE
  pip install requests
  export RN_TOKEN=<your renewables.ninja API token>      # free registration
  python3 fetch_weather_years.py

  Writes nodal/profiles_regional_multiyear.json, which the app picks up
  automatically. Existing single-year files are left untouched, so the app keeps
  working whether or not you run this.

RATE LIMITS
  Renewables.ninja allows 50 requests/hour on a free token. This script needs
  2 requests (wind + solar) per region per year: 10 regions x 10 years = 200
  requests, so it paces itself and will take roughly four hours. It saves after
  every year, and skips years already present, so it is safe to stop and resume.
"""

import json, os, sys, time
from pathlib import Path

try:
    import requests
except ImportError:
    sys.exit("Needs requests:  pip install requests")

TOKEN = os.environ.get("RN_TOKEN")
if not TOKEN:
    sys.exit("Set RN_TOKEN first - register free at https://www.renewables.ninja/register")

OUT = Path("nodal/profiles_regional_multiyear.json")
YEARS = list(range(2014, 2024))       # 10 years; MERRA-2 covers 1980-present

# Capacity-weighted centroids of real REIPPPP plants where they exist, matching
# the coordinates already used for the single-year regional profiles so the two
# datasets are directly comparable.
REGIONS = {
    "Eastern Cape":   (-32.80, 26.20),
    "Limpopo":        (-23.90, 29.45),
    "Mpumalanga":     (-26.00, 29.60),
    "Gauteng":        (-26.10, 28.20),
    "Western Cape":   (-33.10, 19.30),
    "Northern Cape":  (-29.10, 22.10),
    "Hydra Central":  (-31.40, 23.80),
    "Kwazulu Natal":  (-28.80, 30.60),
    "North West":     (-26.20, 26.30),
    "Free State":     (-28.60, 26.60),
}

BASE = "https://www.renewables.ninja/api/data/"
HEAD = {"Authorization": "Token " + TOKEN}


def fetch(kind, lat, lon, year):
    """One year of hourly per-unit output. Matches the existing profiles'
    configuration exactly: Vestas V90 2000 at 80 m for wind; tilt = |latitude|,
    equator-facing, 10% system loss for PV."""
    params = {
        "lat": lat, "lon": lon,
        "date_from": f"{year}-01-01", "date_to": f"{year}-12-31",
        "dataset": "merra2", "capacity": 1.0, "format": "json",
        "local_time": "true",
    }
    if kind == "wind":
        params.update({"height": 80, "turbine": "Vestas V90 2000"})
    else:
        params.update({"system_loss": 0.1, "tracking": 0,
                       "tilt": abs(lat), "azim": 180})
    r = requests.get(BASE + kind, headers=HEAD, params=params, timeout=180)
    if r.status_code == 429:
        raise RuntimeError("rate limited")
    r.raise_for_status()
    data = r.json()["data"]
    series = [v["electricity"] for v in data.values()]
    # Drop the leap day so every year is exactly 8760 hours and can be indexed
    # interchangeably with the demand profile.
    return series[:8760] if len(series) >= 8760 else None


def main():
    out = {"meta": {
        "source": "Renewables.ninja / MERRA-2. Wind: Vestas V90 2000 at 80m. "
                  "PV: tilt=|latitude|, equator-facing, 10% system loss. Same "
                  "configuration and coordinates as profiles_regional.json, so "
                  "the years are directly comparable.",
        "purpose": "Inter-annual weather variability. South Africa has the most "
                   "variable solar resource in Africa (CV ~0.4, ENSO/IOD driven), "
                   "so single-year results understate risk.",
        "years": [],
    }, "wind_pu": {}, "solar_pu": {}}

    if OUT.exists():
        out = json.loads(OUT.read_text())
        print(f"resuming - already have years: {out['meta'].get('years')}")

    for year in YEARS:
        if year in out["meta"].get("years", []):
            continue
        print(f"\n=== {year} ===")
        got = {"wind": {}, "solar": {}}
        try:
            for region, (lat, lon) in REGIONS.items():
                for kind in ("wind", "solar"):
                    s = fetch(kind, lat, lon, year)
                    if s is None:
                        raise RuntimeError(f"short series for {region} {kind} {year}")
                    got[kind][region] = [round(v, 4) for v in s]
                    cf = sum(s) / len(s)
                    print(f"  {region:16s} {kind:5s} CF {cf*100:5.1f}%")
                    time.sleep(75)      # 50 req/hr limit - pace deliberately
        except Exception as e:
            print(f"  stopped on {year}: {e}")
            print("  saving what we have; rerun later to resume.")
            break

        for kind, key in (("wind", "wind_pu"), ("solar", "solar_pu")):
            for region, series in got[kind].items():
                out[key].setdefault(region, {})[str(year)] = series
        out["meta"].setdefault("years", []).append(year)
        OUT.parent.mkdir(parents=True, exist_ok=True)
        OUT.write_text(json.dumps(out, separators=(",", ":")))
        print(f"  saved - {len(out['meta']['years'])} year(s) so far")

    print(f"\nDone. {OUT} has years {out['meta'].get('years')}")
    print("Upload it to nodal/ and the app will pick it up automatically.")


if __name__ == "__main__":
    main()
