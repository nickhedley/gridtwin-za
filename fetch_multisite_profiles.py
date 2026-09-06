"""
GridTwin ZA - build regional wind and solar profiles by sampling SEVERAL points per region.

Extends fetch_real_regional_profiles.py rather than replacing it. Same API, same dataset,
same turbine, same azimuth finding. The only change is that each region is a LIST of
coordinates whose capacity-factor series are averaged with capacity weights, instead of a
single centroid.

WHY
Measured against Eskom's ESK19679, the single-centroid national wind aggregate sits below
2% output for 93 hours a year against an observed 7. A single coordinate goes calm all at
once; a fleet spread over 500 km does not. The deficit is concentrated in the low
percentiles - ours is 0.61 of observed at the 10th percentile and 1.01 at the 99th - which
is exactly the signature of point sampling, and exactly the hours that decide adequacy.

This is not a new method. profiles_regional.json records the same pathology being fixed for
solar once already: MERRA-2's 50 km grid "compressed the regional spread to 1.08x max/min",
replaced with PVGIS at 5 km. The thought was never carried across to wind.

SETUP
  1. python build_profile_sites.py --sites 12      (writes profile_sites.json, no API calls)
  2. Inspect profile_sites.json. The spread_km column is the point of the exercise.
  3. export RENEWABLES_NINJA_TOKEN=...             (free, renewables.ninja/register)
  4. python fetch_multisite_profiles.py --year 2023

COST
  141 calls at 12 sites per region, one year. Free tier is 50 an hour, so about three hours.
  Ten weather years is 1,410 calls and roughly 28 hours - do NOT start that until the
  single-year run has been validated by --check.

VALIDATION
  python fetch_multisite_profiles.py --check
  Compares the calm-hour distribution against Eskom's observed years. That is the test the
  rebuild exists to pass; the annual mean is not.
"""
import os, json, time, io, argparse, csv
import requests
import pandas as pd

BASE = 'https://www.renewables.ninja/api/'
TURBINE = 'Vestas V90 2000'
HUB_HEIGHT = 80
SITES_FILE = 'profile_sites.json'


def fetch_one(kind, lat, lon, year, session):
    """One year of hourly capacity factors for one coordinate. Unchanged from the original."""
    args = {'lat': lat, 'lon': lon, 'date_from': f'{year}-01-01', 'date_to': f'{year}-12-31',
            'capacity': 1.0, 'format': 'csv', 'local_time': 'true'}
    if kind == 'pv':
        # azim=180, NOT 0. Renewables.ninja treats 180 as equator-facing regardless of
        # hemisphere. Verified empirically in the original script: azim=0 gave CF 0.149
        # against 0.225, about 35% low, and scrambled the regional ranking.
        args.update({'dataset': 'merra2', 'system_loss': 0.1, 'tracking': 0,
                     'tilt': abs(lat), 'azim': 180})
    else:
        args.update({'dataset': 'merra2', 'height': HUB_HEIGHT, 'turbine': TURBINE})
    r = session.get(BASE + f'data/{kind}', params=args)
    r.raise_for_status()
    text = r.text
    df = pd.read_csv(io.StringIO(text[text.find('time,'):]))
    return df['electricity'].astype(float).clip(0, 1).tolist()


def cache_key(kind, year, lat, lng):
    return f'{kind}|{year}|{lat:.4f}|{lng:.4f}'


def run_fetch(year, outfile, cachefile):
    """
    Per-SITE caching, not per-region. The original saved after each region; here a region
    is a dozen calls, so an interruption partway through one would otherwise throw away
    work that cost quota. Every site series is cached the moment it arrives.
    """
    token = os.environ.get('RENEWABLES_NINJA_TOKEN')
    if not token:
        raise SystemExit('Set RENEWABLES_NINJA_TOKEN. Free: renewables.ninja/register')
    sites = json.load(open(SITES_FILE))
    cache = json.load(open(cachefile)) if os.path.exists(cachefile) else {}
    if cache:
        print(f'Resuming: {len(cache)} site-years already cached.\n')

    s = requests.session()
    s.headers = {'Authorization': 'Token ' + token}
    todo = sum(len(v['sites']) for k in ('wind', 'solar') for v in sites[k].values())
    done = 0

    for key, kind in [('wind', 'wind'), ('solar', 'pv')]:
        for region, cfg in sites[key].items():
            for site in cfg['sites']:
                ck = cache_key(kind, year, site['lat'], site['lng'])
                done += 1
                if ck in cache:
                    continue
                # A RATE LIMIT IS NOT A FAILURE and must not consume a retry.
                #
                # The first version slept 60s and continued the 3-attempt loop, so it gave
                # up on a site after three minutes - nowhere near an hourly reset - then
                # moved to the next site and failed identically. A real run produced 30
                # consecutive "rate limited" lines and stalled at site 50 of 141.
                #
                # 429 now waits and retries indefinitely, because the quota WILL reset and
                # the work is already paid for. Only genuine errors consume attempts.
                attempt = 0
                while attempt < 3:
                    try:
                        series = fetch_one(kind, site['lat'], site['lng'], year, s)
                        if len(series) != 8760:
                            print(f'  ! {region} {kind} {len(series)}h, expected 8760')
                        cache[ck] = [round(v, 5) for v in series]
                        json.dump(cache, open(cachefile, 'w'))
                        cf = sum(series) / max(1, len(series))
                        print(f'  [{done}/{todo}] {kind:5s} {region:15s} CF={cf:.3f}', flush=True)
                        break
                    except requests.HTTPError as e:
                        code = e.response.status_code if e.response is not None else 0
                        if code == 429:
                            # Sleep to the top of the next hour-ish rather than a token 60s.
                            # 6 minutes is long enough that a rolling window frees slots,
                            # short enough not to idle for an hour after a brief overshoot.
                            print(f'  [{done}/{todo}] quota reached - sleeping 6 min '
                                  f'(nothing lost, {len(cache)} sites cached)', flush=True)
                            time.sleep(360)
                            continue          # does NOT consume an attempt
                        if 400 <= code < 500:
                            # Client errors never succeed on retry. The original learned
                            # this after burning 21 calls against the hourly quota.
                            print(f'  FAILED {region} {kind}: HTTP {code}, not retrying')
                            break
                        attempt += 1
                        time.sleep(20)
                    except Exception as e:
                        attempt += 1
                        print(f'  retry {attempt}: {e}')
                        time.sleep(20)
                time.sleep(6)

    # aggregate: capacity-weighted mean across a region's sites
    out = {'meta': {
        'source': f'Renewables.ninja MERRA-2, {year}. Wind: {TURBINE} at {HUB_HEIGHT} m. '
                  f'PV: 10% system loss, tilt=|lat|, azim=180.',
        'coords': 'MULTI-SITE. Several coordinates per region, capacity-weighted mean. '
                  'Locations from DFFE REEA authorisations; see build_profile_sites.py. '
                  'Replaces the single capacity-weighted centroid per region, which sat '
                  'below 2% output for 93 hours a year against Eskom-observed 7.',
        'sites_per_region': sites['meta'].get('sites_per_region'),
    }, 'wind_pu': {}, 'solar_pu': {}}

    for key, kind, dest in [('wind', 'wind', 'wind_pu'), ('solar', 'pv', 'solar_pu')]:
        for region, cfg in sites[key].items():
            acc, wsum = None, 0.0
            for site in cfg['sites']:
                ck = cache_key(kind, year, site['lat'], site['lng'])
                if ck not in cache:
                    continue
                ser, w = cache[ck], site['w']
                acc = [a + v * w for a, v in zip(acc, ser)] if acc else [v * w for v in ser]
                wsum += w
            if acc and wsum > 0:
                out[dest][region] = [round(v / wsum, 5) for v in acc]
            else:
                print(f'  MISSING {region} {key} - no cached sites')
    json.dump(out, open(outfile, 'w'))
    print(f'\nWrote {outfile}')
    return out


def check(profile_file, eskom_csv):
    """
    The test the rebuild exists to pass. Not the annual mean - the CALM HOURS.

    Compares the capacity-weighted national wind aggregate against Eskom's observed fleet
    at low-output thresholds. Before the rebuild: 93 hours a year below 2%, against an
    observed 7.
    """
    prof = json.load(open(profile_file))
    cap = json.load(open('nodal/regional_renewable_capacity.json'))
    wcap = {}
    for src in cap.get('by_source', {}).values():
        for r, v in (src.get('wind_mw') or {}).items():
            wcap[r] = wcap.get(r, 0) + (v or 0)
    regions = [r for r in prof['wind_pu'] if wcap.get(r, 0) > 0]
    tot = sum(wcap[r] for r in regions)
    n = len(prof['wind_pu'][regions[0]])
    agg = [sum(prof['wind_pu'][r][h] * wcap[r] for r in regions) / tot for h in range(n)]

    obs = []
    with open(eskom_csv) as fh:
        for row in csv.DictReader(fh):
            try:
                c = float(row['Wind Installed Capacity'])
                if c > 0 and row['Date Time Hour Beginning'][:4] in ('2023', '2024'):
                    obs.append(float(row['Wind']) / c)
            except (ValueError, KeyError):
                pass

    print('hours a year below each threshold, national wind aggregate\n')
    print(f"  {'threshold':<12}{'modelled':>10}{'observed':>10}{'ratio':>8}")
    ok = True
    for th in (0.02, 0.05, 0.10):
        m = sum(1 for x in agg if x < th) / (n / 8760)
        o = sum(1 for x in obs if x < th) / (len(obs) / 8760)
        ratio = m / o if o else float('inf')
        if ratio > 2.0:
            ok = False
        print(f'  below {th*100:>3.0f}%    {m:>10,.0f}{o:>10,.0f}{ratio:>7.1f}x')
    print(f'\n  mean CF   modelled {sum(agg)/len(agg)*100:.1f}%   '
          f'observed {sum(obs)/len(obs)*100:.1f}%')
    print('\n  ' + ('PASS - calm hours within 2x of observed'
                    if ok else 'FAIL - still too calm. Add sites and re-run.'))
    return ok


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--year', type=int, default=2023)
    ap.add_argument('--out', default='profiles_regional_multisite.json')
    ap.add_argument('--cache', default='ninja_site_cache.json')
    ap.add_argument('--check', action='store_true',
                    help='validate an existing profile against Eskom, no API calls')
    ap.add_argument('--eskom', default='ESK19679.csv')
    a = ap.parse_args()
    if a.check:
        check(a.out, a.eskom)
    else:
        run_fetch(a.year, a.out, a.cache)
        print('\nNow run with --check before trusting it, and before starting a ten-year pull.')
