#!/usr/bin/env python3
"""GridTwin ZA 3D map regression audit — run alongside audit.py.

WHY THIS EXISTS. gridtwin-3d.html had NO coverage of any kind until 30 Aug 2026. It is
a separate page with its own map stack (deck.gl + MapLibre), its own basemap and its own
styling code, but it reads THE SAME data files as index.html. So a change to
nodal/transmission_lines.geojson lands on both pages while a change to index.html lands
on only one - which is exactly how the two drifted: indicative connectors were added to
the data and given dotted styling in 2D, and rendered here as ordinary surveyed routes.

The same blind spot let the multi-year weather bug survive: a code path nothing runs is
not "probably fine", it is unmeasured.

  python3 audit3d.py gridtwin-3d.html
"""
import sys

CHECKS = [
    # Data wiring — these must keep pointing at the shared files
    ("nodal/substations_compact.json",      "reads the substation register"),
    ("nodal/transmission_lines.geojson",    "reads the transmission lines"),
    ("nodal/tdp_projects.json",             "reads the TDP projects"),

    # Indicative connectors. Straight lines between two real substations that must NOT
    # read as surveyed routes. Lost styling here is a silent misinformation bug.
    ("route_indicative",                    "indicative connectors handled"),
    ("Do not measure this line",            "indicative warning on the tooltip"),

    # Private ownership surfaced, so the map does not imply everything is NTCSA
    ("Privately built",                     "private ownership in tooltips"),

    # Basemap. CARTO withdrew keyless access; this pins whatever is in use so a
    # silent watermark cannot creep back unnoticed.
    ("mapStyle:",                           "basemap style set"),

    # Core layers
    ("deck.LineLayer",                      "planned TDP line layer"),
    ("dragRotate",                          "3D rotation enabled"),
]

path = sys.argv[1] if len(sys.argv) > 1 else "gridtwin-3d.html"
c = open(path).read()

missing = []
for needle, label in CHECKS:
    ok = needle in c
    print(f'{"OK  " if ok else "MISS"} {label}')
    if not ok:
        missing.append((needle, label))

# Path convention. index.html fetches nodal/ RELATIVELY; this page uses ABSOLUTE /nodal/,
# which only resolves when the site is served from the domain root. Not a failure - it is
# how the page is deployed today - but the two files disagree and that is worth seeing.
abs_n = c.count("fetch('/nodal/")
rel_n = c.count("fetch('nodal/")
print(f'\npath style: {abs_n} absolute /nodal/, {rel_n} relative nodal/'
      + ('  <-- differs from index.html, which is relative throughout' if abs_n else ''))

print(f'\n{len(CHECKS)-len(missing)}/{len(CHECKS)} present')
if missing:
    print('\nMISSING:')
    for needle, label in missing:
        print(f'  {label}  ->  search for: {needle!r}')
    sys.exit(1)
