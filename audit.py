#!/usr/bin/env python3
"""GridTwin ZA regression audit — run at the start of every session."""
import sys
import re

CHECKS = [
    # Text changes that have historically reverted
    # Old separate nodal-only banner retired when nodal + MIP merged into one optimiser; see below.
    # Split across two source fragments after the banner was restructured on 1 Sep. The
    # RENDERED text is unchanged - verified - so the pin follows the wording that
    # survives in one piece rather than relaxing what it checks.
    ('are the optimal network-aware ',                             'MIP banner text'),
    ('node size = modelled output',                                     'node size label'),
    ('Show REIPPPP project pipeline',                              'REIPPPP button text'),
    ('Click on each for region-specific',                          'click on each (was Hover)'),
    ('Ring size scales with capacity',                            'pipeline rings: size means capacity'),
    ('planners and project developers',                            'subtitle'),
    # Pin the SUBSTANCE, not the sentence. This previously pinned a 79-character phrase
    # and fired on 30 Aug when the cost note was shortened - correctly, but for the wrong
    # reason: the exclusion was still stated, in fewer words. A regression check on prose
    # should assert the CLAIM survives, not that the wording is frozen, or every edit
    # trips it and people learn to re-pin without reading.
    ('REIPPPP curtailment payments are excluded',                   'cost note: REIPPPP exclusion stated'),
    ('Neither is a tariff',                                        'cost note: not-a-tariff warning'),
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
    # Hybrid uplift column. Validated against a full-year price-taker LP; losing it
    # would remove the only answer the panel gives to the cannibalisation it shows.
    ('hybridUplift',                                               'co-located battery uplift'),
    # NERSA panel tabs. Total pipeline is the default view; an earlier change made the
    # quarter the default and buried the 20.1 GW figure people come for.
    ('nersaView',                                                  'NERSA panel tab switch'),
    ('Total pipeline<',                                            'NERSA total is the default tab'),
    # Every panel must declare whether its numbers are MODELLED or SOURCED. Added after
    # an attribution audit found panels titled "Curtailment forecast" and "Capacity
    # payments" with no indication either way — they read as observations.
    ('>modelled',                                                  'panels marked as model output'),
    # Eskom Green build pace. The only pace that is an operator's OWN plan; its note
    # carries two caveats a reader needs - the split is assumed, and it is one builder.
    ('eskomGreen',                                                 'Eskom Green build pace'),
    # Peak reservation for pumped storage. Without it the store empties before the annual
    # peak and diesel covers the worst hour while adequacy counts the storage as firm.
    ('psPeakFloor',                                                'pumped storage peak reservation'),
    # Project-planning tools framed by DECISION rather than topic. Each tab carries the
    # question it answers, and the row is introduced as a project's lifecycle.
    ('These follow a project',                                     'project tools framed as a lifecycle'),
    # Storage investment summary: the merchant-vs-attached comparison the separate
    # battery panels never made.
    ('storageSummary',                                             'storage investment summary'),
    ('Merchant or attached',                                       'merchant vs co-located comparison'),
    # System status must reflect FREQUENCY, not just the worst hour. Keyed on maxStage
    # alone, one bad hour in 8,760 flipped the board to "Stage 3" beside 0 GWh of shed.
    ('Tight hours',                                                'status word: frequency-aware'),
    # Adequacy ensemble. The board headline is the MEDIAN of 9 outage draws, not one
    # seeded draw - the shipped seed alone gave the worst of ten tested.
    ('adequacyEnsemble',                                           'adequacy ensemble'),
    ('LOLE ',                                                      'board reports LOLE'),
    ('EUE ',                                                       'board reports expected unserved energy'),
    # Lamps show the TYPICAL year, not the worst of 48 draws. Reverting this puts a
    # 1-in-48 tail back on the masthead as though it were the state of the country.
    ('i < e.medStage',                                             'lamps show the typical year'),
    ('typical year reaches stage',                                 'tooltip states typical vs worst'),
    # The board LABELS must match what the cells now compute. "max stage" described a
    # single deterministic year; the lamps show the median of 48 draws.
    ('Load shedding &middot; typical year',                        'lamp label matches the median'),
    # No shouted emphasis in the KPI note. "NEW-build capex" read as a shout in a header
    # a reader sees before anything else; the surrounding prose uses bold for emphasis.
    ('start-up and new-build capex only',                          'KPI note not shouted'),
    # Wheeling coverage. The panel priced transport and never answered what share of the
    # load a contract covers - the question an offtaker asks first.
    ('What share of the load does it actually cover',              'wheeling coverage table'),
    ('wheelCoverageHtml',                                          'coverage renderer'),
    # Green hydrogen from curtailed energy, and the grid-enhancing cost comparison.
    # Both answer "should we", not "could we" - the toggles already answered the latter.
    ('electrolyserH2',                                             'hydrogen from curtailment'),
    ('getsCompare',                                                'grid-enhancing cost comparison'),
    ('LINE_RM_PER_KM',                                             'line cost from two published routes'),
    # Electrolyser siting. The water layer is what stops the tool pointing at the Karoo,
    # which has the best resource in the country and the least water.
    # electrolyserSiting is now surfaced as one line inside the hydrogen panel rather
    # than its own table. Ports dropped from the weighting: hydrogen can be used in
    # domestic heavy industry, so export access is one commercial case among several.
    ('electrolyserSiting',                                         'electrolyser siting'),
    ('rank best for electrolysis',                                 'siting headline in the H2 panel'),
    # "Spilled" replaced throughout the visible copy on 2 Sep. System contexts use
    # "curtailed", which is the industry term and the one NTCSA uses; a buyer's own
    # above-load output is "excess", which is a different thing from system curtailment.
    # Internal identifiers still read spill/spillPct/spillHours - no reader sees them and
    # renaming them is churn with breakage risk.
    ('National curtailment rate',                                  'curtailment wording'),
    ('Curtailed hrs',                                              'curtailment wording'),
    ('waterStress',                                                'water layer present'),
    # The hydrogen PANEL, not just the function. Three modules were built and exposed
    # without any of them appearing in the interface - a working function nobody can see
    # is not a feature.
    ('Green hydrogen from curtailed energy',                       'hydrogen panel heading'),
    ('renderH2',                                                   'hydrogen panel renderer'),
    # Siting panel. The WEIGHTING must stay a control: the ranking changes completely
    # between weightings, and that shift is the finding rather than a defect.
    # Grid-enhancing comparison, with the corridor as a control because the cost ratio
    # scales with corridor length - 41x at 90 km, 127x at 278 km.
    ('Grid-enhancing technologies, or build line?',                'grid-enhancing panel'),
    ('getsCorridor',                                              'corridor selector'),
    # PPA export: a picker, not a free-text prompt. A misspelled region used to produce a
    # CSV with the price column populated and both profile columns empty, silently.
    # PPA export: the region is chosen AFTER clicking, in a modal. A picker parked in the
    # prices panel implied the panel was regional - it is not, the shadow price is national.
    # And it must not be a prompt(): free text let a typo produce a CSV with the price
    # column populated and both profile columns empty, silently.
    ('ppaAskRegion',                                               'PPA region chooser'),
    ('ppaRegionModal',                                             'chooser is a modal, not inline'),
    # Heat stress test. South Africa's tight season IS its hot season, so heat derates
    # land on the weeks already tightest - the opposite of a northern-hemisphere system.
    ('heatStress',                                                 'heat stress test'),
    ('demandPctPerC',                                              'cooling demand channel'),
    # Marginal carbon intensity. Average asks how dirty the grid is; marginal asks what a
    # displaced kWh actually avoids, and on this grid the two differ by about a quarter.
    ('curtailmentToCompute',                                       'data centre throttling'),
    ('nonWiresCompare',                                            'storage and DR as non-wires'),
    # The battery panel must say which dispatch produced its numbers. The instant model
    # dispatches storage heuristically at roughly the median price; the co-optimised
    # answer comes from the full run. Quoting one as the other is the whole risk.
    ('Dispatch basis',                                             'battery revenue basis stated'),
    ('Expected shed &middot; per year',                            'shed label states it is per year'),
    # Pricing run: fixed-commitment LP giving the MIP real duals, and the panel refresh
    # that depends on them. Losing either returns the tool to showing heuristic prices
    # beside MIP energy with nothing saying so.
    ('PRICING RUN',                                                'MIP pricing run'),
    ('fixedOn',                                                    'fixed-commitment LP mode'),
    ('mipPricedHours',                                             'pricing-run coverage reported'),
    ('one builder',                                                'Eskom Green floor-not-forecast caveat'),
]

path = sys.argv[1] if len(sys.argv) > 1 else '/mnt/user-data/outputs/index.html'
c = open(path).read()

missing = []
for needle, label in CHECKS:
    ok = needle in c
    print(f'{"✅" if ok else "❌"} {label}')
    if not ok:
        missing.append((needle, label))


# ── ALWAYS-VISIBLE PROSE RATCHET ────────────────────────────────────────────
# On 1 Sep six new panels added 617 words of always-visible explanation, undoing a 44% trim
# made on 30 Aug. Nothing caught it; the user did, on sight.
#
# A word BUDGET is the wrong check - most of the existing prose predates today, survived
# that trim, and is accepted. A RATCHET is right: the total may fall freely and may not
# rise without someone deliberately raising the ceiling and saying why.
#
# What this catches is the specific failure mode: explaining the FINDING on a panel. The
# findings belong in RESULTS.md. A panel gets the caveat, the units and the provenance,
# because a reader cannot check those from the numbers alone.
# ── NO SHOUTED EMPHASIS IN USER-FACING STRINGS ──────────────────────────────
# Capitalised emphasis has now returned TWICE: once in the markdown documents and once in
# the JavaScript strings that build tooltips and panel notes. The second time the user
# found it in the adequacy tooltip - "the lamps show the TYPICAL year" - and 918 checks
# had nothing to say about it.
#
# Acronyms and code identifiers are exempt. What this catches is a word capitalised for
# emphasis inside a sentence, which is a house-style decision the project made twice and
# undid twice.
# Extended three times in one day - UCLF/IRENA, then EV, then DOE/USD - because it is built
# by listing acronyms as they come up. That is mildly annoying and it is the right shape.
#
# TRIED AND REVERTED 2 Sep 2026: a rule that treats an all-caps token as emphasis only if
# the same word appears in lowercase elsewhere. It looked elegant and it fails, because
# lowercase homographs are everywhere in CODE - `nersa_registrations.json`, `ppaRegion`,
# `exportPpaTimeseries` - so NERSA, PPA, IRP and eighteen others all tripped. Scoping the
# lookup to prose only would make the check depend on the thing it is checking.
#
# An allow-list needs occasional maintenance. A wrong rule needs constant argument.
_SHOUT_OK = set("""MW GW TWh GWh MWh kW kWh CO2 CO LOLE EUE EAF VOLL OCGT CCGT IPP CSP PV
SA ZA NERSA IRP TDP GCCA REIPPPP SAWEM CSV PPA VPP BESS LCOE SRMC NTCSA DLR CCS PVGIS
MERRA ERA SARAH KPI KPIs UI URL SOC MIP LP HiGHS PyPSA API DR AC DC UTC SAST NDC SAPP
REDZ REEA SSEG ATB NREL CSIR AEMO EIA JSON HTML PDF MD FY CY RCA ERTSA GCC MYPD RAB
MONTHS COLORS FIXED EMIS CARBON EX EFF MC GPS NRS TOU PLEXOS EDMSA IGCAR SANS DFFE
SAPVIA UCT GSB PFL DBSA BW COD RMIPPPP BESIPPPP UPG NCE SALGA PAJA MFMA NEM SDK ML AI
US UK II III IV UCLF PCLF OCLF IRENA EV EVs VRE LDES GVA MVA kV DOE USD ZAR EUR GBP
""".split())

def check_shouting(src):
    found = {}
    for m in re.finditer(r'([`\'"])([^`\'"\n]{25,400})\1', src):
        t = m.group(2)
        if not re.search(r'[a-z]{4}\s+[a-z]{3}', t):
            continue
        for w in set(re.findall(r'(?<![A-Za-z0-9_])[A-Z]{2,}(?![A-Za-z0-9_])', t)):
            if w in _SHOUT_OK:
                continue
            found[w] = found.get(w, 0) + 1
    return found

# 4100 -> 4120 on 1 Sep 2026: the capture-price table gained an 18-word note defining what
# a capture price IS. Raised deliberately, which is what the ratchet is for - it fired on
# the addition and forced this decision rather than letting the total drift.
#
# The note earns its place because it is a DEFINITION, not a finding. A reader seeing four
# technologies with different prices for the same commodity needs to know the number is
# generation-weighted; without that the table looks like an error.
PROSE_CEILING = 4120        # measured 1 Sep 2026 after the trim: 4,098

def check_prose(src):
    blocks = re.findall(r'font-size:9\.5px;color:var\(--ink2\)[^>]*>(.*?)</div>', src, re.S)
    total = 0
    for b in blocks:
        t = re.sub(r'<[^>]+>', ' ', b)
        t = re.sub(r'\$\{[^}]*\}', ' ', t)
        t = re.sub(r'&[a-z#0-9]+;', ' ', t)
        total += len(t.split())
    return total, len(blocks)

_prose, _blocks = check_prose(c)
_shout = check_shouting(c)
if _shout:
    _top = ', '.join(sorted(_shout, key=lambda k: -_shout[k])[:6])
    missing.append(('no shouted emphasis in user-facing strings',
                    f'{sum(_shout.values())} occurrences of {len(_shout)} words: {_top} '
                    f'- acronyms are exempt; these are words capitalised for emphasis'))
    print(f'  SHOUTING: {sum(_shout.values())} occurrences across {len(_shout)} words')

if _prose > PROSE_CEILING:
    missing.append((f'always-visible prose within {PROSE_CEILING} words',
                    f'{_prose} words across {_blocks} blocks - RAISE THE CEILING '
                    f'DELIBERATELY or cut. Panels get the caveat and the units; the '
                    f'findings go in RESULTS.md'))
    print(f'  PROSE: {_prose} words across {_blocks} blocks, ceiling {PROSE_CEILING}')
else:
    print(f'  prose: {_prose} words across {_blocks} blocks, ceiling {PROSE_CEILING}')

print(f'\n{len(CHECKS)-len(missing)}/{len(CHECKS)} present')
if missing:
    print('\nMISSING:')
    for needle, label in missing:
        print(f'  {label}  →  search for: {needle!r}')
    sys.exit(1)
