"""
GridTwin ZA - does PVGIS SARAH2 cover recent years?

WHY THIS IS THE GATE

Solar in profiles_regional_multiyear.json is one MERRA-2 point per region. MERRA-2's cell is
50 km, coarser than the gap between regions, so the regional spread comes out at 1.07x where
the real South African resource varies 1.4-1.5x. The model therefore thinks it barely
matters where a solar farm goes.

PVGIS SARAH2 is satellite-derived at 5 km and already fixes this in the single-year file,
which shows a 1.22x spread. The reason it was never used for the multi-year file is a note
in fetch_real_regional_profiles.py:

    "SARAH is not usable here: it returns HTTP 400 for South Africa even for 2015,
     within its documented 1985-2016 range."

A 400 on a year INSIDE the documented range is odd. That is the signature of a malformed
request as much as a coverage limit, and the difference decides everything:

  - if PVGIS reaches 2023, resample solar properly and the problem is solved
  - if it stops at 2016, borrowing a PVGIS year is still defensible, because solar varies
    only 3.3% between years against wind's 17.3% - but it is a compromise and should be
    recorded as one

RUN THIS FIRST. It is a handful of requests and no account is needed - PVGIS has no token.

USAGE
    python3 check_pvgis_coverage.py
"""
import json, urllib.request, urllib.error

# Northern Cape solar centroid, the same point the existing profiles use.
LAT, LON = -29.140, 21.073
YEARS = [2015, 2016, 2018, 2019, 2020, 2021, 2022, 2023]
BASE = 'https://re.jrc.ec.europa.eu/api/v5_2/seriescalc'


def probe(year, db):
    url = (f'{BASE}?lat={LAT}&lon={LON}&startyear={year}&endyear={year}'
           f'&pvcalculation=1&peakpower=1&loss=10&angle={abs(LAT):.0f}&aspect=0'
           f'&outputformat=json&raddatabase={db}')
    try:
        with urllib.request.urlopen(url, timeout=90) as r:
            d = json.loads(r.read().decode())
            hourly = d.get('outputs', {}).get('hourly', [])
            if not hourly:
                return 'no hourly data', None
            vals = [h.get('P', 0) / 1000.0 for h in hourly]
            return f'{len(vals)} hours', sum(vals) / max(1, len(vals))
    except urllib.error.HTTPError as e:
        body = ''
        try:
            body = e.read().decode()[:90].replace('\n', ' ')
        except Exception:
            pass
        return f'HTTP {e.code} {body}', None
    except Exception as e:
        return f'{type(e).__name__}: {str(e)[:60]}', None


def main():
    print(f'PVGIS coverage probe at the Northern Cape solar centroid '
          f'({LAT}, {LON})\n')
    for db in ('PVGIS-SARAH2', 'PVGIS-SARAH3', 'PVGIS-ERA5'):
        print(f'{db}')
        ok = []
        for y in YEARS:
            status, cf = probe(y, db)
            cfs = f'CF {cf*100:.1f}%' if cf is not None else ''
            print(f'  {y}   {status:<44}{cfs}')
            if cf is not None:
                ok.append(y)
        print(f'  -> usable years: {ok if ok else "none"}\n')

    print('WHAT THE ANSWER MEANS')
    print('  SARAH2 or SARAH3 reaching 2023  : resample solar properly, problem solved.')
    print('  SARAH stopping at 2016          : borrow a PVGIS year for the regional SHAPE')
    print('                                    and keep MERRA-2 hourly timing. Defensible,')
    print('                                    because solar varies 3.3% between years')
    print('                                    against wind\'s 17.3% - but it is a')
    print('                                    compromise and must be recorded as one.')
    print('  only ERA5 works                 : no better than MERRA-2 on resolution.')
    print('                                    Say so and stop.')


if __name__ == '__main__':
    main()
