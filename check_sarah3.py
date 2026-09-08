"""
GridTwin ZA - does PVGIS SARAH3 reach past 2020?

SARAH2 on API v5_2 covers 2005-2020, which leaves five of our twelve weather years
(2021-2025) without satellite solar. SARAH3 was rejected by v5_2 as an unknown database
name, which means it exists in a later API version. If v5_3 carries SARAH3 and it reaches
2023 or beyond, the uncovered gap shrinks or closes.

Worth one minute before committing to a borrow-a-year compromise for five of twelve years.

aspect=180. PVGIS aspect 0 is SOUTH-facing, which points panels away from the sun in South
Africa and yields 14.0% at the Northern Cape against a real 23.7%. Checked 6 Sep 2026.

No token. A handful of requests.
"""
import json, urllib.request, urllib.error

LAT, LON = -29.140, 21.073
YEARS = [2019, 2020, 2021, 2022, 2023, 2024]


def probe(api, db, year):
    url = (f'https://re.jrc.ec.europa.eu/api/{api}/seriescalc'
           f'?lat={LAT}&lon={LON}&startyear={year}&endyear={year}'
           f'&pvcalculation=1&peakpower=1&loss=10&angle={abs(LAT):.0f}&aspect=180'
           f'&outputformat=json&raddatabase={db}')
    try:
        with urllib.request.urlopen(url, timeout=90) as r:
            h = json.loads(r.read().decode())['outputs']['hourly']
            cf = sum(x['P'] for x in h) / len(h) / 1000.0
            return f'{len(h)} h, CF {cf*100:.1f}%'
    except urllib.error.HTTPError as e:
        try:
            body = json.loads(e.read().decode()).get('message', '')[:70]
        except Exception:
            body = ''
        return f'HTTP {e.code} {body}'
    except Exception as e:
        return f'{type(e).__name__}: {str(e)[:60]}'


def main():
    print('PVGIS SARAH3 probe, Northern Cape centroid, aspect=180\n')
    for api, db in [('v5_3', 'PVGIS-SARAH3'), ('v5_3', 'PVGIS-SARAH2'),
                    ('v5_2', 'PVGIS-SARAH2')]:
        print(f'{api} / {db}')
        for y in YEARS:
            print(f'  {y}   {probe(api, db, y)}')
        print()
    print('WHAT TO DO WITH THE ANSWER')
    print('  SARAH3 reaching 2023+  : resample all twelve years from PVGIS, nothing borrowed.')
    print('  SARAH3 stopping at 2020: same as SARAH2. Resample 2014-2020 and borrow a year')
    print('                           for 2021-2025, which costs little because solar varies')
    print('                           3.3% between years against 17.3% for wind.')
    print('  v5_3 not existing      : stay on v5_2 and borrow. Say so and move on.')


if __name__ == '__main__':
    main()
