#!/usr/bin/env python3
"""Assemble Renewables.ninja offshore CSVs into nodal/profiles_offshore_regional.json,
in the same shape as profiles_regional_multiyear.json so it drops straight in.

    python3 build_offshore_profiles.py          # reads raw_offshore/, writes the json

Structure, matching the onshore file exactly:

    { "meta": {...},
      "scale": 1000,
      "wind_pu": { "<region>": { "<year>": [8760 integers, 0-1000] } } }

Values are per unit scaled by 1000 and stored as integers, which is what the onshore
file does. Leap years are truncated to 8760 hours by dropping 29 February, so every
year is the same length and directly comparable, and the number dropped is reported.
"""
import json, csv, statistics
from pathlib import Path
from collections import OrderedDict

RAW = Path("raw_offshore_best")
OUT = Path("profiles_offshore_regional.json")
SCALE = 1000

def read_one(path):
    """Renewables.ninja CSV: comment lines, then a header row, then time,electricity."""
    rows, header = [], None
    with open(path, newline="") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            parts = next(csv.reader([line]))
            if header is None:
                header = parts
                continue
            rows.append(parts)
    if header is None:
        raise SystemExit("no header in %s" % path)
    ti = header.index("time") if "time" in header else 0
    ei = header.index("electricity") if "electricity" in header else 1
    out = []
    for r in rows:
        stamp = r[ti]
        if "-02-29" in stamp:          # drop the leap day, keep 8760
            continue
        out.append(float(r[ei]))
    return out

def main():
    sites = json.loads((RAW / "sites.json").read_text())
    wind = OrderedDict()
    cfs, dropped = {}, 0
    for name in sites["sites"]:
        stem = name.replace(" ", "_")
        per_year = OrderedDict()
        for y in sites["years"]:
            p = RAW / ("%s_%d.csv" % (stem, y))
            if not p.exists():
                print("MISSING %s" % p)
                continue
            v = read_one(p)
            if len(v) != 8760:
                print("  %s %d has %d hours, expected 8760" % (name, y, len(v)))
                v = (v + [0.0] * 8760)[:8760]
            per_year[str(y)] = [int(round(min(1.0, max(0.0, x)) * SCALE)) for x in v]
        if per_year:
            wind[name] = per_year
            allv = [x for yr in per_year.values() for x in yr]
            cfs[name] = round(sum(allv) / len(allv) / SCALE, 4)
    doc = OrderedDict()
    doc["meta"] = {
        "name": "South African offshore wind profiles, per unit",
        "source": "Renewables.ninja / MERRA-2. Wind: %s at %d m. Same source, method and "
                  "years as profiles_regional_multiyear.json, so offshore and onshore "
                  "profiles are directly comparable - which is the point, because the "
                  "claim being tested is that offshore is less variable than onshore."
                  % (sites["turbine"], sites["hub_height_m"]),
        "regions": "The seven candidate offshore development regions identified in "
                   "World Bank Group 2026, A Strategic Framework for Offshore Wind "
                   "Development in South Africa, ESMAP. CC BY 3.0 IGO per the report's "
                   "own rights page (the ESMAP landing page says CC BY-NC 3.0 IGO; the "
                   "report governs).",
        "coordinate_warning": sites["coordinate_note"],
        "turbine_note": "Vestas V164 8000 is a CHOICE. A 15 MW-class machine would give "
                        "a higher capacity factor and a flatter profile. The onshore "
                        "profiles use a Vestas V90 2000 at 80 m, a REIPPPP-era onshore "
                        "machine, so turbine and hub height both differ by design.",
        "years": sites["years"],
        "encoding": "per unit x %d, integer. Leap days dropped so every year is 8760 h." % SCALE,
        "capacity_factors": cfs,
        "esmap_sites": sites["sites"],
    }
    doc["scale"] = SCALE
    doc["wind_pu"] = wind
    OUT.write_text(json.dumps(doc, separators=(",", ":")))
    print("\nwrote %s" % OUT)
    print("  regions: %d" % len(wind))
    for k, v in cfs.items():
        print("    %-26s CF %.3f" % (k, v))
    if cfs:
        print("\n  onshore comparison, for reference:")
        print("    Western Cape               CF 0.365")
        print("    Eastern Cape               CF 0.367")
        print("    Kwazulu Natal              CF 0.216")

if __name__ == "__main__":
    main()
