"""
GridTwin ZA - build REAL regional wind & solar profiles from Renewables.ninja.

Replaces the stylised profiles produced by build_regional_profiles.py (kept for provenance),
which have been a flagged limitation since session 1. Every nodal result that depends on
regional weather diversity - curtailment by region, corridor congestion, where grid-enhancing
technologies get deployed - currently rests on those synthetic shapes.

WHY RENEWABLES.NINJA rather than PVGIS / Open-Meteo / NASA POWER:
  - It returns FINISHED capacity factors, not raw weather. The alternatives give irradiance and
    wind speed, leaving you to implement a PV system model and apply turbine power curves - which
    is exactly where methodology errors creep in and where a reviewer would push back.
  - It's the standard tool in published energy-system modelling, so output is citable rather
    than bespoke.
  - It uses MERRA-2 / SARAH reanalysis, the same lineage as the atlite cutouts PyPSA itself
    uses - so this stays consistent with the PyPSA-RSA cross-validation work.
  - The token is free and takes ~2 minutes. It was treated as a blocker earlier in this project;
    it really isn't one.

SETUP
  1. Register (free):  https://www.renewables.ninja/register
  2. Copy your token: https://www.renewables.ninja/profile
  3. pip install requests pandas
  4. export RENEWABLES_NINJA_TOKEN=your_token_here
  5. python fetch_real_regional_profiles.py
  6. Copy the resulting profiles_regional.json into nodal/

RUNTIME: 20 requests with polite spacing, ~3-4 min. Free tier allows 50/hour, so there's
headroom to retry failures within one run.
"""
import os, json, time, io
import requests
import pandas as pd

TOKEN = os.environ.get('RENEWABLES_NINJA_TOKEN', 'PASTE_YOUR_TOKEN_HERE')
YEAR = 2023          # non-leap year, so you get exactly 8760 hours
BASE = 'https://www.renewables.ninja/api/'
OUTFILE = 'profiles_regional.json'


def save(out):
    json.dump(out, open(OUTFILE, 'w'))

# Where a region has real REIPPPP plants, this is the CAPACITY-WEIGHTED CENTROID of those actual
# plants (computed from PyPSA-RSA's reipppp_wind_data.csv / reipppp_solar_data.csv) - i.e. where
# generation really sits, a better sampling point than the region's geographic middle. Regions
# with no existing plants use a representative point where new build would plausibly go; those
# are marked FALLBACK and are the weakest assumption in this script.
WIND_COORDS = {
    'Eastern Cape':  (-32.898, 26.186),   # 22 real plants, 2720 MW
    'Western Cape':  (-32.970, 20.328),   # 21 real plants, 2713 MW
    'Hydra Central': (-31.645, 23.904),   # 8 real plants, 1143 MW
    'Northern Cape': (-30.061, 20.138),   # 7 real plants, 992 MW
    'Free State':    (-28.800, 26.800),   # FALLBACK - no REIPPPP wind here yet
    'Kwazulu Natal': (-28.500, 30.000),   # FALLBACK - escarpment, the plausible wind area
    'Mpumalanga':    (-26.000, 30.000),   # FALLBACK - Highveld, weak wind resource
    'Gauteng':       (-26.100, 28.200),   # FALLBACK - minimal wind potential
    'North West':    (-26.000, 25.500),   # FALLBACK
    'Limpopo':       (-23.500, 29.500),   # FALLBACK
}
SOLAR_COORDS = {
    'Free State':    (-28.385, 25.944),   # 18 real plants, 1645 MW
    'Northern Cape': (-29.140, 21.073),   # 11 real plants, 538 MW
    'Western Cape':  (-32.520, 19.571),   # 9 real plants, 434 MW
    'North West':    (-26.512, 25.163),   # 7 real plants, 719 MW
    'Hydra Central': (-30.568, 24.134),   # 7 real plants, 392 MW
    'Limpopo':       (-23.300, 28.638),   # 3 real plants, 118 MW
    'Gauteng':       (-25.646, 27.870),   # 2 real plants, 57 MW
    'Eastern Cape':  (-31.500, 25.500),   # FALLBACK - 1 small real plant, not representative
    'Kwazulu Natal': (-28.500, 30.500),   # FALLBACK
    'Mpumalanga':    (-26.000, 29.500),   # FALLBACK
}

# 80 m hub height and ~2 MW machines match the real REIPPPP fleet (Nordex/Vestas, hub_height 80 m
# in the plant data), so this is not an arbitrary pick.
TURBINE = 'Vestas V90 2000'
HUB_HEIGHT = 80


def fetch(kind, lat, lon, session):
    """One year of hourly capacity factors. kind is 'pv' or 'wind'."""
    args = {'lat': lat, 'lon': lon, 'date_from': f'{YEAR}-01-01', 'date_to': f'{YEAR}-12-31',
            'capacity': 1.0, 'format': 'csv', 'local_time': 'true'}
    if kind == 'pv':
        # MERRA-2, not SARAH. SARAH is satellite-derived and generally better for solar over
        # Africa, but its time coverage ends well before recent years, so every request for a
        # current YEAR returns HTTP 400. Rolling back to a year SARAH covers would be worse: you
        # would end up with wind from one year and solar from another, which destroys the
        # correlation between them - and this model's storage cycling, curtailment and corridor
        # congestion all depend on whether the wind blows when the sun isn't shining. Same
        # reanalysis and same year for both matters more here than the marginal accuracy gain.
        # azim=180, NOT 0. Physically you want north-facing panels in the southern hemisphere,
        # which suggests azim=0 - but Renewables.ninja's model treats 180 as equator-facing
        # regardless of hemisphere. Verified empirically at the Northern Cape centroid: azim=180
        # gives CF 0.225 (matching real REIPPPP plants at 0.202-0.260 and Eskom's measured
        # national 0.2554), while azim=0 gives 0.149 - about 35% low, and it also scrambled the
        # regional ranking so Northern Cape came out below Limpopo.
        # SARAH is not usable here: it returns HTTP 400 for South Africa even for 2015, within
        # its documented 1985-2016 range.
        args.update({'dataset': 'merra2', 'system_loss': 0.1, 'tracking': 0,
                     'tilt': abs(lat), 'azim': 180})
    else:
        args.update({'dataset': 'merra2', 'height': HUB_HEIGHT, 'turbine': TURBINE})
    r = session.get(BASE + f'data/{kind}', params=args)
    r.raise_for_status()
    text = r.text
    df = pd.read_csv(io.StringIO(text[text.find('time,'):]))   # skip metadata preamble
    return df['electricity'].astype(float).clip(0, 1).tolist()


def main():
    if TOKEN == 'PASTE_YOUR_TOKEN_HERE':
        raise SystemExit('Set RENEWABLES_NINJA_TOKEN, or edit TOKEN at the top of this file.')
    s = requests.session()
    s.headers = {'Authorization': 'Token ' + TOKEN}

    # Resume support: if a previous run was interrupted or hit the rate limit, reuse whatever it
    # already fetched instead of paying for those calls again. The original version only wrote
    # its output at the very end, so a Ctrl+C after all 10 wind regions threw away every one of
    # them - exactly the wrong behaviour when the binding constraint is an hourly API quota.
    if os.path.exists(OUTFILE):
        try:
            prev = json.load(open(OUTFILE))
            done = len(prev.get('wind_pu', {})) + len(prev.get('solar_pu', {}))
            if done:
                print(f'Resuming: {done} region-technology series already in {OUTFILE}.')
                print('Delete that file if you want a clean re-fetch.\n')
        except Exception:
            prev = None
    else:
        prev = None

    out = {'meta': {
        'source': f'Renewables.ninja, calendar year {YEAR}. PV: MERRA-2, 10% system loss, '
                  f'tilt=|latitude|, equator-facing (azim=180). Wind: MERRA-2, {TURBINE} at {HUB_HEIGHT} m. '
                  f'Both from the same reanalysis and same year, so wind/solar correlation holds.',
        'coords': 'Capacity-weighted centroids of real REIPPPP plants where they exist (from '
                  'PyPSA-RSA plant data); representative points elsewhere - see FALLBACK entries '
                  'in fetch_real_regional_profiles.py, the weakest assumption here.',
        'replaces': 'Stylised regional profiles from build_regional_profiles.py.',
    }, 'wind_pu': {}, 'solar_pu': {}}
    if prev:
        out['wind_pu'] = prev.get('wind_pu', {})
        out['solar_pu'] = prev.get('solar_pu', {})

    for kind, coords, key in [('wind', WIND_COORDS, 'wind_pu'), ('pv', SOLAR_COORDS, 'solar_pu')]:
        for region, (lat, lon) in coords.items():
            if region in out[key]:
                print(f'  {kind:5s} {region:15s} (cached, skipping)')
                continue
            for attempt in range(3):
                try:
                    series = fetch(kind, lat, lon, s)
                    if len(series) != 8760:
                        print(f'  ! {region} {kind}: {len(series)} hours, expected 8760 '
                              f'(leap year / DST - check YEAR and local_time)')
                    out[key][region] = [round(v, 5) for v in series]
                    save(out)   # save after EVERY success, so a later failure loses nothing
                    print(f'  {kind:5s} {region:15s} CF={sum(series)/max(1,len(series)):.3f}  '
                          f'({len(series)} h)')
                    break
                except requests.HTTPError as e:
                    code = e.response.status_code if e.response is not None else 0
                    if code == 429:
                        print(f'  rate limited on {region} {kind} - waiting 60s')
                        time.sleep(60); continue
                    if 400 <= code < 500:
                        # A client error will never succeed on retry. Retrying a 400 three times
                        # is how an earlier run burned 21 API calls against the hourly quota for
                        # nothing. Fail fast, report clearly, move on.
                        print(f'  FAILED {region} {kind}: HTTP {code} - not retrying (client '
                              f'error). Check dataset coverage for YEAR={YEAR}.')
                        break
                    print(f'  retry {attempt+1} for {region} {kind}: {e}')
                    time.sleep(20)
                except Exception as e:
                    print(f'  retry {attempt+1} for {region} {kind}: {e}')
                    time.sleep(20)
            time.sleep(6)   # stay inside the free-tier rate limit

    save(out)
    missing = [f'{k} {r}' for k, coords in [('wind', WIND_COORDS), ('solar', SOLAR_COORDS)]
               for r in coords if r not in out['wind_pu' if k == 'wind' else 'solar_pu']]
    print(f'\nWrote {OUTFILE}')
    if missing:
        print(f'INCOMPLETE - {len(missing)} series still missing: {", ".join(missing)}')
        print('Re-run once the hourly quota resets; it will resume, not start over.')
    print('Sanity-check the CFs above before deploying. Expect Northern Cape solar strongest')
    print('(~0.24-0.28), Eastern/Western Cape wind strongest (~0.35-0.45), Gauteng and')
    print('Mpumalanga wind clearly weak. If one looks wrong, suspect that region\'s coordinate')
    print('rather than the data - especially the FALLBACK entries.')


if __name__ == '__main__':
    main()
