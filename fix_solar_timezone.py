"""
GridTwin ZA - shift the regional PVGIS solar profiles from UTC to South African time.

THE FAULT

Within a single regional profile file, wind and solar run on different clocks.

    wind    fetched from Renewables.ninja with local_time=true  -> SAST
    solar   fetched from PVGIS, which has NO timezone parameter -> UTC

South Africa is UTC+2, so regional solar sits two hours ahead of regional wind and of the
national demand series.

    Eskom measured (SAST)            wind peak hour 18   solar peak hour 11
    profiles_regional                wind peak hour 19   solar peak hour 10
    profiles_regional_multiyear      wind peak hour 18   solar peak hour 10

HOW THE SIZE WAS ESTABLISHED

An earlier shape correlation against Eskom's NATIONAL fleet suggested +1 hour. That test was
wrong: it compared a single Northern Cape point against a fleet whose geography and tracking
mix differ. Two independent tests on the point itself both give +2.

1. SOLAR NOON. The profile centroid is 21.073E; SAST's standard meridian is 30E, so solar
   noon there runs 36 minutes late, at 12:27 to 12:43 SAST across the year. In
   hour-beginning convention that is hour 12. PVGIS gives hour 10.

2. DAYLIGHT WINDOW. Geometry puts first light at 07:36 and last at 17:42 on 21 June.
   PVGIS unshifted runs hour 6 to hour 15. The LENGTHS match exactly - 10 hours in winter,
   12 at equinox, 14 in summer - so the window is displaced, not distorted. Shift by two and
   both ends land.

The tell that started this: all ten regions peaked at exactly hour 10. South Africa spans 17
degrees of longitude, about 68 minutes of solar time, so they cannot share a peak hour unless
something upstream flattened the geography. A clock does that; a coordinate does not.

WHAT THIS DOES NOT TOUCH

`profiles.json` is Eskom measured throughout and is already SAST. Dispatch, adequacy and the
frontier run on it and are unaffected. This fixes the REGIONAL files only: capture prices by
region, where-to-build, wheeling coverage, the solar ceiling.

Wind is left alone. It already matches Eskom.

USAGE
    python3 fix_solar_timezone.py --dry-run
    python3 fix_solar_timezone.py
"""
import json, argparse, statistics

FILES = ['nodal/profiles_regional.json', 'nodal/profiles_regional_multiyear.json']
SHIFT = 2          # UTC -> SAST


def peak_hour(series, scale):
    buckets = [[] for _ in range(24)]
    for i, v in enumerate(series):
        buckets[i % 24].append(v / scale)
    means = [statistics.mean(b) if b else 0 for b in buckets]
    return means.index(max(means))


def roll(series, hours):
    """Move each value LATER by `hours`, wrapping the year.

    Wrapping rather than padding: the series is a full calendar year, so the hours rolled off
    31 December belong at the start of 1 January of the same year. Padding with zeros would
    invent two dark hours in January and delete two real ones in December.
    """
    n = len(series)
    return [series[(i - hours) % n] for i in range(n)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--shift', type=int, default=SHIFT)
    ap.add_argument('--dry-run', action='store_true')
    a = ap.parse_args()

    for path in FILES:
        try:
            d = json.load(open(path))
        except FileNotFoundError:
            print(f'  {path}: not found, skipped')
            continue
        scale = d.get('scale', 1)
        solar = d.get('solar_pu') or {}
        if not solar:
            print(f'  {path}: no solar_pu, skipped')
            continue

        sample = solar[sorted(solar)[0]]
        multiyear = isinstance(sample, dict)
        before = peak_hour(sample[sorted(sample)[0]] if multiyear else sample, scale)

        if not a.dry_run:
            for region in solar:
                if multiyear:
                    for year in solar[region]:
                        solar[region][year] = roll(solar[region][year], a.shift)
                else:
                    solar[region] = roll(solar[region], a.shift)

        after = peak_hour(
            (solar[sorted(solar)[0]][sorted(sample)[0]] if multiyear else solar[sorted(solar)[0]]),
            scale)

        if not a.dry_run:
            d['meta'] = dict(d.get('meta', {}))
            d['meta']['solar_timezone'] = (
                f'SHIFTED +{a.shift} h from UTC to SAST on 8 Sep 2026. PVGIS returns UTC and has '
                f'no timezone parameter, while wind is fetched from Renewables.ninja with '
                f'local_time=true - so the two carriers sat on different clocks in this file. '
                f'Size confirmed two ways at the profile centroid: solar noon at 21.073E is '
                f'12:27-12:43 SAST (hour 12, PVGIS gave hour 10), and the daylight WINDOW '
                f'lengths already matched at 10/12/14 hours, so it was displaced not distorted. '
                f'Any future PVGIS pull must apply the same shift.')
            json.dump(d, open(path, 'w'))

        print(f'  {path}')
        print(f'    solar peak hour {before} -> {after}'
              + ('   (dry run, not written)' if a.dry_run else ''))

    print('\n  Eskom measured, for reference: solar peaks at hour 11, wind at 18.')
    print('  Wind is NOT touched - it already matches.')
    if a.dry_run:
        print('\nDRY RUN. Nothing written.')
    else:
        print('\nRe-run the suite. validate_weather checks solar level, spread and ranking;')
        print('none of those move under a time shift, so a change there would be a surprise.')


if __name__ == '__main__':
    main()
