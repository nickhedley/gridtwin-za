"""
GridTwin ZA - merge the multi-site WIND rebuild into the profile file, keeping PVGIS solar.

WHY WIND ONLY

The multi-site fetch pulled both technologies from MERRA-2. For wind that is the right
source and the rebuild works: 48 sites span CF 0.227 to 0.453, a 2.0x spread, which is the
geographic diversity the single centroid was collapsing.

For SOLAR it walks straight back into a problem this project already solved. Measured
across 78 fetched sites the spread is 1.19x - and profiles_regional.json records why:

    "Replaces MERRA-2 solar profiles (0.5 deg, 50 km) which compressed the regional
     spread to 1.08x max/min; real SA solar resource has ~1.4-1.5x spread"

MERRA-2's grid cell is coarser than the spacing between our sample sites, so adding sites
cannot help: eleven of twelve Gauteng sites returned CF between 0.222 and 0.224. The
existing solar comes from PVGIS SARAH2 at 5 km and already has the right spread.

So: take the wind, keep the solar. Overwriting good data with worse because it arrived in
the same file would be the easiest possible way to lose ground here.

USAGE
    python3 merge_multisite_wind.py
    python3 fetch_multisite_profiles.py --check --out profiles_regional_rebuilt.json
"""
import json, shutil, os

MULTI = 'profiles_regional_multisite.json'
CURRENT = 'nodal/profiles_regional.json'
OUT = 'profiles_regional_rebuilt.json'


def main():
    multi = json.load(open(MULTI))
    cur = json.load(open(CURRENT))

    wind_new = multi.get('wind_pu', {})
    solar_keep = cur.get('solar_pu', {})
    if not wind_new:
        raise SystemExit(f'{MULTI} has no wind_pu')
    if not solar_keep:
        raise SystemExit(f'{CURRENT} has no solar_pu to keep')

    short = {r: len(v) for r, v in wind_new.items() if len(v) != 8760}
    if short:
        raise SystemExit(f'wind series not 8760 hours: {short}')

    out = {
        'meta': {
            'source': multi['meta'].get('source', ''),
            'wind': 'MULTI-SITE. Capacity-weighted mean of up to 12 REEA-located sites per '
                    'region, Renewables.ninja MERRA-2. Replaces one centroid per region, '
                    'which sat below 2% output for 93 h/yr against Eskom-observed 7.',
            'solar': 'UNCHANGED from the previous file: PVGIS SARAH2 at 5 km. NOT replaced '
                     'by the multi-site MERRA-2 pull, which reproduced the known 50 km '
                     'compression - 1.19x spread across 78 sites against a real 1.4-1.5x.',
            'sites_per_region': multi['meta'].get('sites_per_region'),
            'previous_meta': cur.get('meta', {}),
        },
        'wind_pu': wind_new,
        'solar_pu': solar_keep,
    }

    json.dump(out, open(OUT, 'w'))

    print(f'Wrote {OUT}\n')
    print(f"  {'region':<16}{'wind new':>10}{'wind old':>10}{'change':>9}{'solar':>9}")
    old = cur.get('wind_pu', {})
    for r in sorted(wind_new):
        n = sum(wind_new[r]) / len(wind_new[r]) * 100
        o = (sum(old[r]) / len(old[r]) * 100) if r in old else None
        ch = f'{n - o:+.1f}' if o is not None else '  new'
        s = sum(solar_keep[r]) / len(solar_keep[r]) * 100 if r in solar_keep else 0
        print(f'  {r:<16}{n:>9.1f}%{(f"{o:.1f}%" if o is not None else "-"):>10}'
              f'{ch:>9}{s:>8.1f}%')
    print('\n  solar is carried over untouched - the change column is wind only.')
    print(f'\nNext: python3 fetch_multisite_profiles.py --check --out {OUT}')


if __name__ == '__main__':
    main()
