#!/usr/bin/env python3
"""GridTwin ZA regression audit — run at the start of every session."""
import sys

CHECKS = [
    # Text changes that have historically reverted
    # Old separate nodal-only banner retired when nodal + MIP merged into one optimiser; see below.
    ('the dispatch chart are the optimal network-aware solution',   'MIP banner text (layout-agnostic)'),
    ('node size = avg output',                                     'node size label'),
    ('Show REIPPPP project pipeline',                              'REIPPPP button text'),
    ('Click on each for region-specific',                          'click on each (was Hover)'),
    ('Ring size scales with total capacity',                       'ring colour key rewrite'),
    ('planners and project developers',                            'subtitle'),
    ('curtailment payments to wind and solar contracted under REIPPPP are excluded', 'cost note trimmed'),
    # KPI labels
    ('Carbon intensity',                                           'carbon intensity KPI'),
    ('Avg energy cost',                                            'avg energy cost label'),
    # Tab labels
    ('Grid-scale solar &amp; wind',                                'tab: grid-scale solar & wind'),
    ('Data centre captive power',                                  'tab: data centre captive power'),
    ('Project pre-feasibility',                              'tab: project pre-feasibility'),
    ('Rooftop solar</button>',                                     'tab: rooftop solar'),
    # Presets & costs
    ("Latest IRP",                                                 'IRP preset name'),
    ('coalDecomMW:8000,newWindMW:7340,newPvMW:10300',              'IRP preset values'),
    ('Future electricity mix',                                     'future mix preset'),
    ('costCoal:546',                                               'coal cost R546/MWh'),
    ('costCcgt:1968',                                              'CCGT dispatch R1968/MWh, FY2026 JKM reference'),
    # Engine features
    ('ccgtForceLoad',                                              'gas load factor toggle'),
    ('curtailFuelCost',                                            'curtailment cost fix'),
    ('buildUCSchedule',                                            'heuristic UC engine'),
    ('MIP_WORKER_SRC',                                             'MIP solver (HiGHS wasm)'),
    # Site resource query features
    ('rtStartTrace',                                               'satellite roof tracer'),
    ('mainGeocode',                                                'main address search'),
    ('rtGeocode',                                                  'rooftop address search'),
    ('dcTech',                                                     'data centre wind option'),
    ('besPct',                                                     'NERSA battery bars'),
    ('transmission_lines.geojson',                                 'transmission lines layer'),
    ('addSubstationLayer',                                         'substation dots'),
    ('Capture rate as the pipeline fills',                         'capture curve panel'),
    ('scheduleCaptureCurve',                                       'capture curve debounce'),
    # Basemap. CARTO withdrew keyless access and watermarked every tile "API KEY
    # REQUIRED" while still SERVING them - a silent degradation no automated check
    # could see, because the layers on top are our own data. This pins the replacement
    # so a revert is loud.
    ('World_Light_Gray_Base',                                      'basemap: Esri light grey, keyless'),
    # Indicative connectors must stay visually distinct from surveyed and planned
    # routes. If this styling is lost, a straight line between two real substations
    # reads as a surveyed route and gets measured off a screenshot.
    ('route_indicative',                                           'indicative connector styling'),
    # Navigation. The 3D map is at gridtwin-3d/index.html, so the link must point at
    # the DIRECTORY with a trailing slash. It read "gridtwin-3d.html" until 30 Aug 2026,
    # which 404s against that layout. No harness notices a broken link - a page that
    # never loads produces no error anywhere in the suite.
    ('href="gridtwin-3d/"',                                        '3D map link points at the directory'),
    # Storage split in the mix donut. Lumping lithium, vanadium and iron-air into one
    # slice made it impossible to see whether the long-duration tiers ever dispatch.
    # They barely do, and that is the finding — losing this styling hides it again.
    ('NAMES_STORAGE',                                              'mix donut splits storage by chemistry'),
    ('battByTier',                                                 'per-tier hourly discharge series'),
]

path = sys.argv[1] if len(sys.argv) > 1 else '/mnt/user-data/outputs/index.html'
c = open(path).read()

missing = []
for needle, label in CHECKS:
    ok = needle in c
    print(f'{"✅" if ok else "❌"} {label}')
    if not ok:
        missing.append((needle, label))

print(f'\n{len(CHECKS)-len(missing)}/{len(CHECKS)} present')
if missing:
    print('\nMISSING:')
    for needle, label in missing:
        print(f'  {label}  →  search for: {needle!r}')
    sys.exit(1)
