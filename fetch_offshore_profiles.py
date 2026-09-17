#!/usr/bin/env python3
"""Fetch hourly offshore wind profiles from Renewables.ninja for South Africa's seven
candidate offshore development regions, as identified by ESMAP.

RUN THIS WHERE YOU HAVE NETWORK. The GridTwin container can only reach package
registries, so this script is written to run on your machine.

    export NINJA_TOKEN=<your renewables.ninja API token>
    python3 fetch_offshore_profiles.py            # resumes; safe to re-run

Output: one CSV per site per year under raw_offshore/, then run
build_offshore_profiles.py to assemble nodal/profiles_offshore_regional.json.

WHY THIS SOURCE. profiles_regional_multiyear.json is already Renewables.ninja / MERRA-2
for the same twelve years, so offshore profiles from the same source and years are
directly comparable with the onshore ones. Using anything else would make the
offshore-versus-onshore variability comparison a comparison of two datasets.

TURBINE AND HEIGHT. The onshore profiles use a Vestas V90 2000 at 80 m, which is a
REIPPPP-era onshore machine. Offshore needs a modern offshore machine at the hub height
ESMAP assessed the resource at, 150 m. Vestas V164 8000 is the closest widely-used
offshore turbine in the Renewables.ninja library. This is a CHOICE, not a source: a
15 MW-class machine would give a slightly higher capacity factor and a flatter profile.

COORDINATES ARE ESTIMATES. ESMAP's Table 13 gives wind speed, depth and distance per
region but the fetcher could not reach it, so these centroids are derived from the
report's prose descriptions of each area, not from its coordinate table. Each is
annotated with the description it came from. REPLACE THEM if you can get Table 13.

RATE LIMIT. Renewables.ninja allows roughly 50 requests an hour on a personal token.
Seven sites x twelve years is 84 requests, so this sleeps between calls and resumes
from whatever it already has on disk.
"""
import os, csv, json, time, sys
from pathlib import Path

try:
    import requests
except ImportError:
    sys.exit("pip install requests")

TOKEN = os.environ.get("NINJA_TOKEN")
if not TOKEN:
    sys.exit("Set NINJA_TOKEN to your renewables.ninja API token")

API = "https://www.renewables.ninja/api/data/wind"
OUT = Path("raw_offshore")
OUT.mkdir(exist_ok=True)

YEARS = list(range(2014, 2026))          # matches profiles_regional_multiyear.json
TURBINE = "Vestas V164 8000"
HUB_M = 150                              # the height ESMAP assessed the resource at

# name: (lat, lon, ESMAP description the centroid was derived from)
SITES = {
    "Boegoebaai West Coast": (
        -29.30, 16.30,
        "over 13,000 km2 west of Port Nolloth and the proposed Port of Boegoebaai; "
        "mean wind 9.2-9.7 m/s; 75-500 m; ~40 GW floating"),
    "Saldanha Bay West Coast": (
        -32.60, 17.40,
        "over 8,600 km2 northwest of Saldanha Bay; mean wind ~8.8 m/s; 0-500 m; "
        "24 GW floating plus 1.4 GW fixed"),
    "Cape Point West": (
        -34.35, 18.10,
        "1,282 km2 west of Cape Point; mean wind 9.9-10.6 m/s; 75-500 m"),
    "Cape Point South": (
        -34.75, 18.50,
        "932 km2 south of Cape Point; mean wind 9.9-10.6 m/s; 75-500 m"),
    "Coega West": (
        -34.05, 25.45,
        "1,365 km2 west of the Port of Ngqura; mean wind ~9 m/s; ~750 MW fixed "
        "plus over 3 GW floating"),
    "Coega East": (
        -33.90, 26.05,
        "537 km2 east of the Port of Ngqura; mean wind ~9 m/s; ~550 MW fixed "
        "plus ~1 GW floating"),
    "Durban Richards Bay": (
        -29.40, 31.60,
        "nearly 2,900 km2 between the Port of Durban and Port of Richards Bay; "
        "mean wind ~9.4 m/s; over 17 GW floating"),
}

SESSION = requests.session()
SESSION.headers = {"Authorization": "Token " + TOKEN}

def fetch(name, lat, lon, year):
    dest = OUT / ("%s_%d.csv" % (name.replace(" ", "_"), year))
    if dest.exists() and dest.stat().st_size > 10000:
        return False                      # already have it, skip
    args = {
        "lat": lat, "lon": lon,
        "date_from": "%d-01-01" % year, "date_to": "%d-12-31" % year,
        "capacity": 1.0, "height": HUB_M, "turbine": TURBINE,
        "format": "csv", "local_time": "false", "raw": "false",
    }
    r = SESSION.get(API, params=args)
    if r.status_code == 429:
        print("  rate limited, sleeping 10 min")
        time.sleep(600)
        return fetch(name, lat, lon, year)
    r.raise_for_status()
    dest.write_text(r.text)
    return True

def main():
    meta = {n: {"lat": v[0], "lon": v[1], "esmap_description": v[2]}
            for n, v in SITES.items()}
    meta_out = OUT / "sites.json"
    meta_out.write_text(json.dumps(
        {"turbine": TURBINE, "hub_height_m": HUB_M, "years": YEARS,
         "source": "Renewables.ninja / MERRA-2",
         "coordinate_note": "Centroids estimated from ESMAP prose, NOT from its Table 13. "
                            "Replace if the table becomes available.",
         "sites": meta}, indent=1))
    total = len(SITES) * len(YEARS)
    done = 0
    for name, (lat, lon, _) in SITES.items():
        for y in YEARS:
            done += 1
            got = fetch(name, lat, lon, y)
            print("[%d/%d] %-26s %d  %s" % (done, total, name, y,
                                            "fetched" if got else "already had it"))
            if got:
                time.sleep(75)            # stay under ~50 requests an hour
    print("\nDone. Now run build_offshore_profiles.py")

if __name__ == "__main__":
    main()
