#!/usr/bin/env python3
"""Two-stage offshore siting: screen candidate points, then fetch the winners.

RUN WHERE YOU HAVE NETWORK.

    export NINJA_TOKEN=your_token_here
    python3 site_offshore.py screen     # 21 requests, ~30 min, writes screen_offshore/
    python3 site_offshore.py pick       # no network, prints the winners and writes sites_best.json
    python3 site_offshore.py fetch      # 84 requests, ~2 h, writes raw_offshore_best/
    python3 build_offshore_profiles.py  # after pointing RAW at raw_offshore_best

WHY THIS EXISTS. The first offshore run used one arbitrary centroid per region and found
offshore MORE variable than onshore: 18.3% of hours below 10% of rating against 14.1%, and
droughts of 79 hours against 35. That comparison was not fair. GridTwin's onshore
coordinates are capacity-weighted centroids of REAL REIPPPP PLANTS - sites developers chose
after measurement campaigns, selected for good wind. Offshore has no built plant, so there
was no equivalent selection, and the test pitted the best onshore sites a market could find
against average offshore water.

This reproduces the selection. Three candidates per region, screened on one year, best
capacity factor wins, then twelve years fetched for the winner only. If the best point in
each region still shows more low-output hours than onshore, the claim genuinely fails. If
it does not, offshore variability was a siting artefact.

SCREEN YEAR. 2018 binds most often in the fossil-free search (23 of 72 builds), so it is
the year a developer would care about most. Screening on a bad year rather than a good one
is deliberate: it selects for sites that hold up when the system needs them, not for sites
with the highest annual energy.

CANDIDATES. Three per region: the original centroid, one further offshore, one along the
coast. Further offshore is generally windier but deeper and further from port, which the
capacity factor will not show - ESMAP Tables 16 and 17 carry depth and distance, so check a
winner against those before treating it as developable.
"""
import os, sys, csv, json, time
from pathlib import Path

try:
    import requests
except ImportError:
    sys.exit("pip install requests")

API = "https://www.renewables.ninja/api/data/wind"
TURBINE = "Vestas V164 8000"
HUB_M = 150
SCREEN_YEAR = 2018
YEARS = list(range(2014, 2026))
def safe(name):
    """A label or region name as a filename fragment. Labels contain "m/s", so replacing
    only spaces produced a path with a directory separator in it and the write failed with
    FileNotFoundError. Every slash, backslash and space goes."""
    out = name
    for ch in "/\\ ":
        out = out.replace(ch, "_")
    return out

SCREEN = Path("screen_offshore")
BEST = Path("raw_offshore_best")

# region: [(label, lat, lon), ...]  - candidate 1 is the original centroid
CANDIDATES = {
    # CANDIDATES ARE NOW SELECTED, not guessed. Two sources, and every point carries the
    # reason it is here:
    #
    #   ESMAP  = centroid of a best-wind-class polygon from the ESMAP / World Bank Offshore
    #            Wind Technical Potential shapefile for Sub-Saharan Africa (energydata.info).
    #            The shapefile carries WSCategory, a mean wind speed class, which the KML
    #            version does not. South Africa has only two classes, 7 and 8 m/s, and these
    #            are all 8. INTEGER BINS: the class cannot distinguish Cape Point at 10.6 m/s
    #            from Saldanha at 8.8, so it narrows the field and cannot rank within it.
    #            That is what the screening fetch is for.
    #   EBSA-clear = a point tested against the MARISMA revised 2020 Ecologically or
    #            Biologically Significant Marine Areas layer and found outside all of them.
    #
    # EVERY POINT BELOW IS OUTSIDE ALL EBSAs except where marked. Dropped for being inside
    # one: Boegoebaai north, Saldanha south, Cape Point South east, Coega East (all three),
    # Durban (all three), and ESMAP's own best Cape Point polygons, which sit in Seas of
    # Good Hope.
    #
    # TWO REGIONS HAVE NO CLEAR CANDIDATE AT ALL. Coega East lies wholly within Algoa to
    # Amathole and every Durban point within the KwaZulu-Natal Bight and uThukela River.
    # ESMAP places over 17 GW at Durban regardless, which tells you an EBSA is a constraint
    # on the authorisation path rather than a prohibition. Those two regions are screened on
    # points that ARE inside an EBSA, flagged as such, because the alternative is to model
    # nothing where ESMAP models the largest floating resource in the country.
    #
    # CAVEAT ON THE EBSA TEST. The portal warns the KML boundaries were simplified for
    # Google Earth file-size limits, so a point within a few km of an edge may be on the
    # wrong side. Points closer than 5 km to an edge are marked. Use the shapefile before
    # treating any of this as authoritative.
    #
    # AND ONE CONSTRAINT WE CANNOT CHECK. South Africa's shipping, mining and oil-and-gas
    # pressure layers read "data coming soon" on the MARISMA portal. Namibia's are complete;
    # ours are not. ESMAP applied those constraints and we cannot reproduce that screen.
    "Boegoebaai West Coast": [
        ("ESMAP 8 m/s 292 km2", -29.746, 17.027),          # clear, 26 km from Namaqua Fossil Forest
        ("EBSA-clear centroid", -29.300, 16.300),           # clear, 23 km
        ("EBSA-clear offshore", -29.300, 15.900),           # clear, 39 km
    ],
    "Saldanha Bay West Coast": [
        ("ESMAP 8 m/s 1127 km2", -32.872, 18.147),          # clear, 11 km from Cape Canyon
        ("EBSA-clear centroid", -32.600, 17.400),           # clear, 15 km
        ("EBSA-clear offshore", -32.600, 16.900),           # clear, 5 km - NEAR AN EDGE
    ],
    "Cape Point West": [
        ("EBSA-clear centroid", -34.350, 18.100),           # clear, 16 km from Seas of Good Hope
        ("EBSA-clear offshore", -34.350, 17.600),           # clear, 40 km
        ("EBSA-clear north", -33.900, 17.900),              # clear, 6 km - NEAR AN EDGE
    ],
    "Cape Point South": [
        ("EBSA-clear centroid", -34.750, 18.500),           # clear, 25 km
        ("EBSA-clear offshore", -35.150, 18.500),           # clear, 64 km, the cleanest point we have
    ],
    "Coega West": [
        ("ESMAP 8 m/s 251 km2", -34.113, 24.718),           # clear, 43 km from Tsitsikamma-Robberg
        ("EBSA-clear offshore", -34.450, 25.450),           # clear, 14 km
        ("EBSA-clear west", -34.150, 24.900),               # clear, 50 km
    ],
    "Coega East": [
        # NO CLEAR CANDIDATE. Both are inside Algoa to Amathole.
        ("in EBSA, ESMAP 8 m/s", -33.727, 26.975),
        ("in EBSA, further offshore", -34.300, 26.200),
    ],
    "Durban Richards Bay": [
        # NO CLEAR CANDIDATE. All inside the KwaZulu-Natal Bight and uThukela River.
        ("in EBSA, ESMAP floating", -29.102, 31.958),
        ("in EBSA, ESMAP fixed", -29.688, 31.227),
        ("in EBSA, further offshore", -29.400, 32.000),
    ],
}

TOKEN = os.environ.get("NINJA_TOKEN")
SESSION = requests.session()
if TOKEN:
    SESSION.headers = {"Authorization": "Token " + TOKEN}

def get(lat, lon, year, dest):
    if dest.exists() and dest.stat().st_size > 10000:
        return False
    args = {"lat": lat, "lon": lon,
            "date_from": "%d-01-01" % year, "date_to": "%d-12-31" % year,
            "capacity": 1.0, "height": HUB_M, "turbine": TURBINE,
            "format": "csv", "local_time": "false", "raw": "false"}
    r = SESSION.get(API, params=args)
    if r.status_code == 429:
        print("  rate limited, sleeping 10 min"); time.sleep(600)
        return get(lat, lon, year, dest)
    if r.status_code >= 500:
        print("  server error %d, retrying in 2 min" % r.status_code); time.sleep(120)
        return get(lat, lon, year, dest)
    r.raise_for_status()
    dest.write_text(r.text)
    return True

def read_cf(path):
    rows, header = [], None
    for line in path.read_text(errors="replace").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        parts = next(csv.reader([line]))
        if header is None:
            header = parts; continue
        rows.append(parts)
    ei = header.index("electricity") if "electricity" in header else 1
    ti = header.index("time") if "time" in header else 0
    v = [float(r[ei]) for r in rows if "-02-29" not in r[ti]]
    return (sum(v) / len(v)) if v else 0.0, len(v)

def cmd_screen():
    if not TOKEN: sys.exit("Set NINJA_TOKEN")
    SCREEN.mkdir(exist_ok=True)
    n = sum(len(v) for v in CANDIDATES.values()); i = 0
    for reg, cands in CANDIDATES.items():
        for lbl, lat, lon in cands:
            i += 1
            dest = SCREEN / ("%s__%s.csv" % (safe(reg), safe(lbl)))
            got = get(lat, lon, SCREEN_YEAR, dest)
            print("[%d/%d] %-26s %-18s %s" % (i, n, reg, lbl, "fetched" if got else "had it"))
            if got: time.sleep(75)
    print("\nNow run: python3 site_offshore.py pick")

def cmd_pick():
    out = {}
    print("\n  screening year %d, capacity factor per candidate" % SCREEN_YEAR)
    for reg, cands in CANDIDATES.items():
        best = None
        print("  %s" % reg)
        for lbl, lat, lon in cands:
            p = SCREEN / ("%s__%s.csv" % (safe(reg), safe(lbl)))
            if not p.exists():
                print("    %-18s MISSING" % lbl); continue
            cf, nh = read_cf(p)
            mark = ""
            if best is None or cf > best[0]:
                best = (cf, lbl, lat, lon); mark = ""
            print("    %-18s CF %.3f  (%d h)%s" % (lbl, cf, nh, mark))
        if best:
            print("    -> best: %s, CF %.3f at %.3f, %.3f" % (best[1], best[0], best[2], best[3]))
            out[reg] = {"label": best[1], "lat": best[2], "lon": best[3],
                        "screen_cf_%d" % SCREEN_YEAR: round(best[0], 4)}
    Path("sites_best.json").write_text(json.dumps(
        {"turbine": TURBINE, "hub_height_m": HUB_M, "years": YEARS,
         "screen_year": SCREEN_YEAR,
         "source": "Renewables.ninja / MERRA-2",
         "method": "Three candidates per region screened on %d, highest capacity factor kept. "
                   "Reproduces developer site selection, so the offshore-versus-onshore "
                   "variability comparison is best-available against best-available rather "
                   "than arbitrary water against REIPPPP plant centroids." % SCREEN_YEAR,
         "sites": out}, indent=1))
    print("\n  wrote sites_best.json")
    print("  CHECK THE WINNERS against ESMAP Tables 16 and 17 for depth and distance to port")
    print("  before treating any of them as developable. A windier point further offshore may")
    print("  be in 900 m of water 200 km out.")
    print("\n  Then run: python3 site_offshore.py fetch")

def cmd_fetch():
    if not TOKEN: sys.exit("Set NINJA_TOKEN")
    sites = json.loads(Path("sites_best.json").read_text())["sites"]
    BEST.mkdir(exist_ok=True)
    (BEST / "sites.json").write_text(json.dumps(
        {"turbine": TURBINE, "hub_height_m": HUB_M, "years": YEARS,
         "source": "Renewables.ninja / MERRA-2",
         "coordinate_note": "Best of three screened candidates per region, screened on %d. "
                            "See sites_best.json and site_offshore.py." % SCREEN_YEAR,
         "sites": {k: {"lat": v["lat"], "lon": v["lon"],
                       "esmap_description": "screened winner: " + v["label"]}
                   for k, v in sites.items()}}, indent=1))
    n = len(sites) * len(YEARS); i = 0
    for reg, s in sites.items():
        for y in YEARS:
            i += 1
            dest = BEST / ("%s_%d.csv" % (safe(reg), y))
            got = get(s["lat"], s["lon"], y, dest)
            print("[%d/%d] %-26s %d  %s" % (i, n, reg, y, "fetched" if got else "had it"))
            if got: time.sleep(75)
    print("\n  Now point build_offshore_profiles.py's RAW at raw_offshore_best and run it.")

if __name__ == "__main__":
    c = sys.argv[1] if len(sys.argv) > 1 else ""
    {"screen": cmd_screen, "pick": cmd_pick, "fetch": cmd_fetch}.get(
        c, lambda: sys.exit("usage: site_offshore.py screen | pick | fetch"))()
