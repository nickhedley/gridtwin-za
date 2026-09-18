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
# HEIGHTS DIFFER BETWEEN THE REPORT'S OWN FIGURES. The executive summary quotes 9 to
# 10.6 m/s at 150 m hub height; Table 68's metocean wind is 5.9 to 8.5 m/s, which is
# almost certainly the 10 m standard reference. At an offshore shear exponent near 0.11,
# 6.0 m/s at 10 m becomes about 8.0 at 150 m and 8.2 becomes about 11.0, so the two
# reconcile. Do not compare a Table 68 figure with a summary figure directly.

# name: (lat, lon, ESMAP description the centroid was derived from)
SITES = {
    # COORDINATES ARE NOW SOURCED, not estimated. Each is the AREA-WEIGHTED CENTROID of
    # ESMAP's own fixed-foundation suitable-area polygons for that stretch of coast, taken
    # from the Sub-Saharan Africa KML published on energydata.info (Offshore Wind Technical
    # Potential, World Bank Group Offshore Wind Development Program, CRS 4326). 3,345 South
    # African polygons, grouped to the nearest of the 2026 report's regions and averaged by
    # area.
    #
    # WHY THIS REPLACED THE GUESSES. The first run used centroids I derived from the 2026
    # report's prose, because neither Figure 98 (a map in RSA Albers Equal Area Conic) nor
    # Table 68 (site characteristics) carries coordinates. Two of those guesses were wrong:
    # Boegoebaai sat about 60 km west of the suitable water and Coega West sat south of it
    # into deeper water, and those two returned the lowest capacity factors of the seven,
    # 0.410 and 0.396. Sampling the wrong water looks exactly like a poorer resource.
    #
    # TWO CAVEATS ON THE SOURCE. It is the 2019 GLOBAL technical-potential exercise, which
    # screens depth and wind speed only - not the environmental, social and shipping
    # constraints the 2026 study applies - so these are the right water but a superset of
    # the report's regions. And the FLOATING-foundation centroids from the same KML are
    # unusable: Coega returns 215,347 km2 spread over a 210 km radius, which is the deep
    # water screen picking up most of the continental slope. Fixed centroids only.
    #
    # First-run capacity factors at the guessed points, for comparison when this reruns:
    #   Cape Point West 0.494, Cape Point South 0.485, Saldanha 0.472, Coega East 0.433,
    #   Durban 0.416, Boegoebaai 0.410, Coega West 0.396.
    "Boegoebaai West Coast": (
        -29.520, 16.912,
        "ESMAP fixed-foundation centroid, 671 polygons, 877 km2. The 2026 report gives this "
        "region 9.2-9.7 m/s and 40 GW of the national 95, the largest single resource, but "
        "its own Table 68 metocean data puts Port Nolloth at 6.0 and 6.7 m/s against "
        "Saldanha's 5.9 - so the summary's ranking of Boegoebaai above Saldanha is not "
        "supported by the report's measured wind. Treat the 9.2-9.7 with suspicion."),
    "Saldanha Bay West Coast": (
        -32.808, 18.115,
        "ESMAP fixed-foundation centroid, 644 polygons, 2,105 km2. Report: ~8.8 m/s, "
        "24 GW floating plus 1.4 GW fixed. Table 68: Saldanha Bay 1 and 2 at 5.9 m/s, "
        "Saldanha Bay 3 at 7.1."),
    "Cape Point": (
        -34.544, 19.695,
        "ESMAP fixed-foundation centroid, 744 polygons, 3,418 km2. Report: 9.9-10.6 m/s, "
        "the best in the country, 6.5 GW floating. Table 68 Cape Point 1 at 7.6 m/s. "
        "Combines the report's separate Cape Point West and South."),
    "Coega Gqeberha": (
        -33.636, 26.257,
        "ESMAP fixed-foundation centroid, 768 polygons, 2,862 km2. Report: ~9 m/s, about "
        "1.3 GW fixed plus 4 GW floating across Coega West and East. Table 68 Ngqura 1 at "
        "8.1 m/s. Combines the report's separate West and East."),
    "Durban Richards Bay": (
        -29.737, 31.264,
        "ESMAP fixed-foundation centroid, 518 polygons, 4,011 km2, the largest fixed area "
        "in the country. Report: ~9.4 m/s, over 17 GW floating. Table 68 Durban 1 and 2 at "
        "8.2 and 8.5 m/s, the highest measured wind of any site in the table. KwaZulu-Natal "
        "onshore is only 0.216 CF and over 30% of provincial land is in communal trusts, so "
        "this is where offshore substitutes for a resource that barely exists onshore."),

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
    if r.status_code >= 500:
        # Their server, not ours. The first run died on a 502 after 58 of 84 files.
        print("  server error %d, retrying in 2 min" % r.status_code)
        time.sleep(120)
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
