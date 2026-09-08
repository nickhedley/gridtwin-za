"""
GridTwin ZA - rebuild the multi-year SOLAR profiles from PVGIS.

THE FAULT

Solar in profiles_regional_multiyear.json is one MERRA-2 point per region. MERRA-2's cell is
50 km, coarser than the gap between regions, so the regional spread is 1.07x where the real
South African resource varies 1.4-1.5x. The model therefore thinks it barely matters where a
solar farm goes - and where-to-build, curtailment by region and corridor congestion all rest
on that.

This is the same fault the wind had before 6 Sep 2026, and the same fix: a better-resolved
source. PVGIS SARAH2 is satellite-derived at 5 km and gives 1.22x on the single-year file.

COVERAGE, ESTABLISHED 6 SEP 2026

SARAH2 covers 2005-2020: seven of our twelve years. The note in
fetch_real_regional_profiles.py claiming SARAH fails "even for 2015" was a malformed
request, not a coverage limit.

For 2021-2025 there is no satellite year to fetch, so `--borrow` substitutes the regional
SHAPE of a covered year while keeping each year's own MERRA-2 hourly TIMING. That is
defensible because solar varies 3.3% between years against 17.3% for wind - but it is a
compromise, it is recorded in the file's metadata, and it should not be quoted as measured.

ASPECT=180, NOT 0

PVGIS aspect 0 is SOUTH-facing, which points panels away from the sun in South Africa: 14.0%
at the Northern Cape against a real 23.7%. The same trap the Renewables.ninja note records
for its own azimuth. Verified both ways on 6 Sep; 180 reproduces the existing file exactly.

USAGE
    python3 check_sarah3.py                  # first - may extend coverage past 2020
    python3 rebuild_solar_pvgis.py --dry-run # what it will do, no requests
    python3 rebuild_solar_pvgis.py
"""
import json, time, argparse, urllib.request, urllib.error

TARGET = 'nodal/profiles_regional_multiyear.json'
CACHE = 'pvgis_solar_cache.json'
API = 'v5_2'
DB = 'PVGIS-SARAH2'

# The same centroids the existing solar uses, so the change is RESOLUTION only - not a move
# to different points. Changing two things at once makes the result unattributable.
COORDS = {
    'Free State':    (-28.385, 25.944),
    'Northern Cape': (-29.140, 21.073),
    'Western Cape':  (-32.520, 19.571),
    'North West':    (-26.512, 25.163),
    'Hydra Central': (-30.568, 24.134),
    'Limpopo':       (-23.300, 28.638),
    'Gauteng':       (-25.646, 27.870),
    'Eastern Cape':  (-31.500, 25.500),
    'Kwazulu Natal': (-28.500, 30.500),
    'Mpumalanga':    (-26.000, 29.500),
}


def fetch(lat, lon, year, api=API, db=DB):
    url = (f'https://re.jrc.ec.europa.eu/api/{api}/seriescalc'
           f'?lat={lat}&lon={lon}&startyear={year}&endyear={year}'
           f'&pvcalculation=1&peakpower=1&loss=10&angle={abs(lat):.0f}&aspect=180'
           f'&outputformat=json&raddatabase={db}')
    with urllib.request.urlopen(url, timeout=120) as r:
        h = json.loads(r.read().decode())['outputs']['hourly']
    return [min(1.0, max(0.0, x['P'] / 1000.0)) for x in h]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--target', default=TARGET)
    ap.add_argument('--api', default=API)
    ap.add_argument('--db', default=DB)
    ap.add_argument('--borrow', default='2019',
                    help='covered year whose regional shape stands in for uncovered years')
    ap.add_argument('--dry-run', action='store_true')
    a = ap.parse_args()

    d = json.load(open(a.target))
    scale = d.get('scale', 1000)
    years = [str(y) for y in d['meta']['years']]
    import os
    cache = json.load(open(CACHE)) if os.path.exists(CACHE) else {}

    print(f'{len(years)} weather years, {len(COORDS)} regions, {a.db} via {a.api}, aspect=180\n')
    if a.dry_run:
        print('DRY RUN. Nothing fetched, nothing written.')
        print(f'  would attempt {len(years) * len(COORDS)} requests')
        print(f'  uncovered years fall back to the {a.borrow} shape')
        return

    fetched, borrowed, failed = 0, 0, 0
    got = {}
    for region, (lat, lon) in COORDS.items():
        for y in years:
            k = f'{region}|{y}'
            if k in cache:
                got[k] = cache[k]
                continue
            try:
                ser = fetch(lat, lon, int(y), a.api, a.db)[:8760]
                if len(ser) != 8760:
                    raise ValueError(f'{len(ser)} hours')
                got[k] = ser
                cache[k] = ser
                json.dump(cache, open(CACHE, 'w'))
                fetched += 1
                print(f'  {region:15s} {y}  CF={sum(ser)/len(ser)*100:.1f}%', flush=True)
            except Exception as e:
                failed += 1
                msg = str(e)[:60]
                print(f'  {region:15s} {y}  unavailable ({msg})')
            time.sleep(1)

    # Uncovered years: keep each year's OWN hourly timing from the existing MERRA-2 series,
    # and rescale it so the region sits where PVGIS says it should relative to the others.
    # This corrects the geography, which is the fault, without inventing weather.
    for region in COORDS:
        ref = got.get(f'{region}|{a.borrow}')
        if not ref:
            continue
        refmean = sum(ref) / len(ref)
        for y in years:
            k = f'{region}|{y}'
            if k in got:
                continue
            old = (d['solar_pu'].get(region) or {}).get(y)
            if not old:
                continue
            oldmean = sum(old) / len(old) / scale
            if oldmean <= 0:
                continue
            f = refmean / oldmean
            got[k] = [min(1.0, v / scale * f) for v in old]
            borrowed += 1

    for region in COORDS:
        for y in years:
            k = f'{region}|{y}'
            if k in got:
                d['solar_pu'].setdefault(region, {})[y] = [round(v * scale) for v in got[k]]

    S = d['solar_pu']
    means = {r: sum(sum(S[r][y]) for y in S[r]) / scale / (8760 * len(S[r])) for r in S}
    spread = max(means.values()) / min(means.values())
    d['meta']['solar_source'] = (
        f'PVGIS {a.db} at 5 km, aspect=180, tilt=|latitude|, 10% system loss. Replaces '
        f'MERRA-2 at 50 km, which compressed the regional spread to 1.07x against a real '
        f'1.4-1.5x. Rebuilt 6 Sep 2026. Regional spread now {spread:.2f}x.')
    if borrowed:
        d['meta']['solar_borrowed_years'] = (
            f'{borrowed} region-years outside PVGIS coverage (2005-2020) keep their own '
            f'MERRA-2 hourly timing, rescaled to the {a.borrow} PVGIS regional level. The '
            f'geography is corrected; the weather is not measured. Solar varies 3.3% '
            f'between years so this is a small compromise, but it is a compromise.')
    json.dump(d, open(a.target, 'w'))

    print(f'\nWrote {a.target}')
    print(f'  fetched {fetched}, borrowed {borrowed}, failed {failed}')
    print(f'  regional spread {spread:.2f}x  (was 1.07x, PVGIS single-year file is 1.22x)')
    print('\n  If the spread is still near 1.07x, the fetch did not take effect - check')
    print('  the failures above before trusting it.')


if __name__ == '__main__':
    main()
