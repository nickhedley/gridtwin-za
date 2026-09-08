"""
GridTwin ZA - which PVGIS aspect is equator-facing for South Africa?

The coverage probe returned 13.8% at the Northern Cape solar centroid using aspect=0. The
real resource there is 24-28%, and the existing profiles_regional.json holds 23.7% for that
region. So aspect=0 is wrong - but that file's own metadata says it used aspect=0.

Two possibilities, and they need separating before anything is rebuilt:

  a) PVGIS aspect 0 means SOUTH. The existing data was fetched with 180 and the metadata
     is simply mislabelled. Annoying, harmless, fix the note.

  b) The existing data really was fetched with aspect=0 and is understated by 40%, the
     same way the Renewables.ninja azimuth error was - that note records azim=0 giving
     CF 0.149 against 0.225, "about 35% low, and it also scrambled the regional ranking".

If (b), the PVGIS solar in the single-year file is wrong and so is everything regional and
solar-driven that runs on it.

Four requests. No token.
"""
import json, urllib.request, urllib.error

BASE = 'https://re.jrc.ec.europa.eu/api/v5_2/seriescalc'
# Northern Cape and Kwazulu-Natal: the strongest and weakest solar regions, so this also
# shows whether the aspect choice scrambles the regional RANKING as well as the level.
POINTS = [('Northern Cape', -29.140, 21.073, 23.7),
          ('Kwazulu Natal', -28.500, 30.500, 19.5)]


def cf(lat, lon, aspect, year=2019):
    url = (f'{BASE}?lat={lat}&lon={lon}&startyear={year}&endyear={year}'
           f'&pvcalculation=1&peakpower=1&loss=10&angle={abs(lat):.0f}&aspect={aspect}'
           f'&outputformat=json&raddatabase=PVGIS-SARAH2')
    try:
        with urllib.request.urlopen(url, timeout=90) as r:
            h = json.loads(r.read().decode())['outputs']['hourly']
            return sum(x['P'] for x in h) / len(h) / 1000.0
    except Exception as e:
        return None


def main():
    print('PVGIS aspect test, SARAH2 2019, tilt = |latitude|\n')
    print(f"  {'region':<16}{'aspect 0':>10}{'aspect 180':>12}{'in our file':>13}")
    for name, lat, lon, have in POINTS:
        a0, a180 = cf(lat, lon, 0), cf(lat, lon, 180)
        f0 = f'{a0*100:.1f}%' if a0 is not None else 'error'
        f180 = f'{a180*100:.1f}%' if a180 is not None else 'error'
        print(f'  {name:<16}{f0:>10}{f180:>12}{have:>12.1f}%')

    print('\nHOW TO READ IT')
    print('  aspect 180 matching our file : PVGIS 0 is south, our metadata is mislabelled.')
    print('                                 Harmless. Correct the note and use 180.')
    print('  aspect 0 matching our file   : the existing PVGIS solar was fetched facing the')
    print('                                 WRONG WAY and is understated by roughly 40%.')
    print('                                 Everything regional and solar-driven is affected.')


if __name__ == '__main__':
    main()
