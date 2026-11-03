#!/usr/bin/env python3
"""
GridTwin ZA - put the weather years on South African time and on their own calendar days (user decisions, 3 Nov 2026,
message 684 (a) and (b); RESULTS 'Modelled wind: two plain errors', 3 Nov 2026).

TWO ERRORS, BOTH IN THE FETCH, NOT JUDGEMENTS
  Clock. Renewables.ninja returns rows in UTC (its header: 'time in UTC, local_time in Africa/Johannesburg'); local_time=true adds
    a column and moves no row. fetch_multiyear_wind.py, fetch_real_regional_profiles.py and build_offshore_profiles.py read the
    electricity column in row order as if hour 0 were 00:00 SAST, so every Renewables.ninja wind series ran two hours early.
    Solar was moved to SAST on 8 Sep 2026 (fix_solar_timezone.py) and is right.
  Leap years. The fetch scripts kept the first 8,760 hours of 2016, 2020 and 2024 (ser[:8760]), which keeps 29 February and drops
    31 December, where their comments said the opposite.

WHAT THIS DOES (reads the files as fetched, from main at BASE, so it can never shift a series twice; writes the working files)
  Wind, nodal/profiles_regional_multiyear.json: each year's UTC hours, completed in the leap years with 31 December built from
    fetch_leap_days.py's site calls with fetch_multiyear_wind.py's site weights and rounding; then SAST year Y = the last two UTC
    hours of Y-1 + the first 8,758 (or 8,782) of Y, and SAST 29 February removed. 2014 has no 2013 in the file: its first two
    hours repeat its own last two (a stand-in, flagged; 98 calls for 2013-12-31 would replace it).
  Modern-turbine wind, nodal/profiles_wind_modern.json: rebuilt hour by hour from the fixed multi-year series through its stored
    regional maps (build_wind_modern.py's formula; checked to reproduce the stored file from the stored series first), and the
    national map rewritten as MAP_ONLY=1 does.
  Wind 2023, nodal/profiles_regional.json (the regional LP's single centroids): moved two hours later, its first two hours from its
    own last two (a stand-in, flagged).
  Offshore, nodal/profiles_offshore_regional.json: moved two hours later, the first two hours from the year before (2014: its own
    last two, flagged). Its leap years dropped UTC 29 February when fetched (correct by date, two hours off at that boundary).
  Solar, PVGIS SARAH3 fixed tilt and tracking, 2016 and 2020: the whole UTC year from fetch_leap_days.py (checked to reproduce every
    stored hour before 29 February to the integer), moved two hours as fix_solar_timezone.py did (the year's own last two hours wrap
    to its first two: night), SAST 29 February removed.
  Solar 2024 (Renewables.ninja MERRA-2, borrowed): the whole UTC year, moved two hours (wrapped), SAST 29 February removed, rescaled
    to 2023's PVGIS level as rebuild_solar_pvgis.py --borrow does (min(1, v x f), f = 2023 mean / this year's mean).
  Tracking twins 2024 and 2025 and the national tracking map: rebuilt as build_solar_tracking.py does, from the fixed files.
  Every file's meta records the fix; fingerprints (gtza-, build_capacity.py's) are recomputed where a file carries one.

  --interim: where a leap-year day has not been fetched, 31 December repeats 30 December (flagged in the meta) - the interim of
  message 684 (b), used only if the re-fetch is not complete by 6 Nov 2026.

USAGE (repository root): python3 fix_weather_clock_leap.py [--interim] [--check]   (--check: verify and report, write nothing)
"""
import json, subprocess, argparse, hashlib, copy
import build_wind_modern as BWM
import build_solar_tracking as BT

BASE = 'b0f7999'   # main when the build began, 3 Nov 2026: the files as fetched, before any clock or leap fix
LEAP = {'2016', '2020', '2024'}
FEB29 = slice(59 * 24, 60 * 24)
NOTE_DATE = '3 Nov 2026 (message 684 (a), (b))'


def at_base(path):
    return json.loads(subprocess.run(['git', 'show', f'{BASE}:{path}'], capture_output=True, text=True, check=True).stdout)


def fingerprint(doc):   # build_capacity.py's
    body = {k: v for k, v in doc.items() if k != 'meta'}
    return 'gtza-' + hashlib.sha256(json.dumps(body, sort_keys=True, separators=(',', ':')).encode()).hexdigest()[:16]


def sast(prev_tail2, utc, year):
    """A SAST calendar year of 8,760 hours from that year's UTC hours (8,760, or 8,784 in a leap year) and the year before's last two."""
    s = list(prev_tail2) + list(utc[:-2])
    if year in LEAP:
        if len(s) != 8784: raise SystemExit(f'{year}: {len(s)} hours, a leap year needs 8,784 before 29 February is removed')
        s = s[:FEB29.start] + s[FEB29.stop:]
    if len(s) != 8760: raise SystemExit(f'{year}: {len(s)} hours')
    return s


def wrap2(utc):   # fix_solar_timezone.py's roll by +2 h within the year
    return list(utc[-2:]) + list(utc[:-2])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--interim', action='store_true')
    ap.add_argument('--check', action='store_true')
    a = ap.parse_args()
    nc = json.load(open('ninja_leapday_cache.json'))
    pc = json.load(open('pvgis_leap_cache.json'))
    flags = []

    # ---------- wind, multi-year (Renewables.ninja V90, 98 sites) ----------
    MY = at_base(BWM.SRC); sc = MY['scale']; years = [str(y) for y in MY['meta']['years']]
    sites = json.load(open('profile_sites.json'))['wind']
    utc = {}
    for region, cfg in sites.items():
        utc[region] = {}
        for y in years:
            ser = list(MY['wind_pu'][region][y])
            if y in LEAP:
                acc, wsum, miss = [0.0] * 24, 0.0, 0
                for s in cfg['sites']:
                    v = nc.get(f'wind|{y}|{s["lat"]:.4f}|{s["lng"]:.4f}')
                    if v is None: miss += 1; continue
                    acc = [p + q * s['w'] for p, q in zip(acc, v)]; wsum += s['w']
                if miss:
                    if not a.interim: raise SystemExit(f'wind {region} {y}: {miss} site days not fetched yet (run fetch_leap_days.py, or --interim)')
                    day = ser[-24:]; flags.append(f'wind {region} {y}: 31 December repeats 30 December ({miss} site days missing)')
                else:
                    day = [round(v / wsum * sc) for v in acc]
                ser = ser + day
            utc[region][y] = ser
    new_my = copy.deepcopy(MY)
    for region in utc:
        for i, y in enumerate(years):
            prev = utc[region][years[i - 1]][-2:] if i > 0 else utc[region][y][-2:]
            new_my['wind_pu'][region][y] = sast(prev, utc[region][y], y)
    flags.append('wind 2014: its first two SAST hours repeat its own last two (no 2013 in the file)')

    # ---------- solar, PVGIS 2016 and 2020, fixed tilt ----------
    for region in new_my['solar_pu']:
        for y in ('2016', '2020'):
            full = pc.get(f'{region}|{y}|0')
            if full is None: raise SystemExit(f'PVGIS {region} {y} fixed not fetched')
            old = MY['solar_pu'][region][y]
            if any(round(v * sc) != o for v, o in zip(wrap2(full[:8760]), old)): raise SystemExit(f'PVGIS {region} {y}: fetch does not reproduce the file')
            s = wrap2(full); s = s[:FEB29.start] + s[FEB29.stop:]
            new_my['solar_pu'][region][y] = [round(v * sc) for v in s]
    # ---------- solar 2024, Renewables.ninja MERRA-2, borrowed (rescaled to 2023's PVGIS level) ----------
    import fetch_missing_solar_years as FS
    for region, (lat, lon) in FS.SOLAR_COORDS.items():
        raw = nc.get(f'pvyear|2024|{lat:.4f}|{lon:.4f}')
        old = MY['solar_pu'][region]['2024']
        if raw is None:
            if not a.interim: raise SystemExit(f'solar {region} 2024 not fetched yet (run fetch_leap_days.py, or --interim)')
            s = old[:FEB29.start] + old[FEB29.stop:] + old[-24:]
            new_my['solar_pu'][region]['2024'] = s; flags.append(f'solar {region} 2024: interim (29 February removed, 30 December repeated)'); continue
        s = wrap2(raw); s = s[:FEB29.start] + s[FEB29.stop:]
        ref = MY['solar_pu'][region]['2023']; f = (sum(ref) / len(ref) / sc) / (sum(s) / len(s))
        new_my['solar_pu'][region]['2024'] = [round(min(1.0, v * f) * sc) for v in s]
        # check: before 29 February the rebuilt year follows the stored one (the factor moves a little with the day exchanged)
        o, n = old[2:FEB29.start], new_my['solar_pu'][region]['2024'][2:FEB29.start]
        if max(abs(p - q) for p, q in zip(o, n)) > 0.02 * sc: raise SystemExit(f'solar {region} 2024: the whole-year fetch does not follow the stored year')

    # ---------- tracking 2016 and 2020 (PVGIS), twins 2024 and 2025 ----------
    TR = at_base(BT.OUT); st = TR['scale']; new_tr = copy.deepcopy(TR)
    for region in new_tr['solar_trk_pu']:
        for y in ('2016', '2020'):
            full = pc.get(f'{region}|{y}|1')
            if full is None: raise SystemExit(f'PVGIS {region} {y} tracking not fetched')
            if any(round(v * st) != o for v, o in zip(wrap2(full[:8760]), TR['solar_trk_pu'][region][y])): raise SystemExit(f'PVGIS tracking {region} {y}: fetch does not reproduce the file')
            s = wrap2(full); s = s[:FEB29.start] + s[FEB29.stop:]
            new_tr['solar_trk_pu'][region][y] = [round(v * st) for v in s]
    # 2024's twin: the stored twin's days kept (build_solar_tracking.py built it from unrounded PVGIS values that are not in the
    # repository, so it cannot be rebuilt bit for bit from the stored files: its sunrise and sunset hours differ by up to 0.075),
    # 29 February removed, the rescale of the fixed year carried (k), and 31 December from the fixed day times the 2014-2023
    # ratio by month and hour. 2025's twin is unchanged: its fixed year is unchanged.
    for region in new_tr['solar_trk_pu']:
        F0, F1, T0 = MY['solar_pu'][region]['2024'], new_my['solar_pu'][region]['2024'], TR['solar_trk_pu'][region]['2024']
        c0 = F0[:FEB29.start] + F0[FEB29.stop:]; c1 = F1[:8736]
        k = sum(c1) / max(1, sum(c0))
        num = [0.0] * 24; den = [0.0] * 24
        for y in [y for y in years if int(y) <= 2023]:
            F, T = new_my['solar_pu'][region][y], new_tr['solar_trk_pu'][region][y]
            for h in range(8760 - 31 * 24, 8760): num[h % 24] += T[h] / st; den[h % 24] += F[h] / sc
        G = [num[hh] / den[hh] if den[hh] > 1e-6 else 0.0 for hh in range(24)]
        kept = T0[:FEB29.start] + T0[FEB29.stop:]
        new_tr['solar_trk_pu'][region]['2024'] = [min(st, round(v * k)) for v in kept] + [min(st, round(F1[8736 + h] * G[h])) for h in range(24)]
        if abs(k - 1) > 0.01: raise SystemExit(f'tracking 2024 {region}: rescale {k:.4f} is not small')

    # ---------- modern-turbine wind through the stored regional maps ----------
    MOD = at_base(BWM.OUT); MAP = at_base(BWM.MAP_OUT); bias = float(MY['meta']['bias_corrected'].split('scaled by ')[1].split(' ')[0])
    def modern(my):
        out = {}
        for region, f in MAP['regional_map'].items():
            out[region] = {}
            for y in years:
                raw = [v / sc / bias for v in my['wind_pu'][region][y]]
                out[region][y] = [min(MOD['scale'], round(min(1.0, f[min(BWM.BINS - 1, int(min(1.0, r) * BWM.BINS))]) * MOD['scale'])) for r in raw]
        return out
    chk = modern(MY)
    worst = max(abs(p - q) for r in chk for y in chk[r] for p, q in zip(chk[r][y], MOD['wind_modern_pu'][r][y]))
    if worst > 0: raise SystemExit(f'modern wind: the regional maps do not reproduce the stored file from the stored series (worst {worst})')
    new_mod = copy.deepcopy(MOD); new_mod['wind_modern_pu'] = modern(new_my)

    # ---------- the regional LP's 2023 wind and the offshore file ----------
    RG = at_base('nodal/profiles_regional.json'); new_rg = copy.deepcopy(RG)
    for region in new_rg['wind_pu']: new_rg['wind_pu'][region] = wrap2(RG['wind_pu'][region])
    flags.append('profiles_regional.json wind 2023: first two SAST hours repeat its own last two (no 2022 in the file)')
    OF = at_base('nodal/profiles_offshore_regional.json'); new_of = copy.deepcopy(OF); oy = [str(y) for y in OF['meta']['years']]
    for region in new_of['wind_pu']:
        for i, y in enumerate(oy):
            u = OF['wind_pu'][region][y]; prev = OF['wind_pu'][region][oy[i - 1]][-2:] if i > 0 else u[-2:]
            new_of['wind_pu'][region][y] = list(prev) + list(u[:-2])
    flags.append('offshore 2014: first two SAST hours repeat its own last two')

    # ---------- report ----------
    def mean(d, key):
        return sum(sum(v) for r in d[key].values() for v in (r.values() if isinstance(r, dict) else [r])) / sum(len(v) for r in d[key].values() for v in (r.values() if isinstance(r, dict) else [r]))
    print('wind multi-year mean (scaled):', round(mean(MY, 'wind_pu'), 3), '->', round(mean(new_my, 'wind_pu'), 3))
    print('solar multi-year mean (scaled):', round(mean(MY, 'solar_pu'), 3), '->', round(mean(new_my, 'solar_pu'), 3))
    print('tracking mean (scaled):', round(mean(TR, 'solar_trk_pu'), 3), '->', round(mean(new_tr, 'solar_trk_pu'), 3))
    print('modern wind mean (scaled):', round(mean(MOD, 'wind_modern_pu'), 3), '->', round(mean(new_mod, 'wind_modern_pu'), 3))
    for f in flags: print('  flag:', f)
    if a.check: print('check only: nothing written'); return

    clock = ('SHIFTED +2 h from UTC to SAST, ' + NOTE_DATE + ': Renewables.ninja rows are UTC (the response header says so) and were read as '
             'SAST; local_time=true adds a column and moves no row. Each year starts with the last two UTC hours of the year before. '
             'fix_weather_clock_leap.py.')
    leap = ('Leap years 2016, 2020, 2024: 29 February removed and 31 December restored, ' + NOTE_DATE + '. The fetch kept the first 8,760 '
            'hours (ser[:8760]), which kept 29 February and dropped 31 December. 31 December re-fetched (fetch_leap_days.py); '
            'fix_weather_clock_leap.py.' + (' Interim parts: ' + '; '.join(x for x in flags if 'interim' in x or 'repeats 30 December' in x) if a.interim else ''))
    stand = 'Stand-ins: ' + '; '.join(flags) + '.'
    new_my['meta']['wind_clock'] = clock + ' ' + stand
    new_my['meta']['leap_years'] = leap
    new_my['meta']['solar_timezone'] = (MY['meta']['solar_timezone'].split(' PVGIS returns UTC')[0] + '. PVGIS returns UTC and has no timezone parameter. '
                                        'Wind is now on SAST as well (wind_clock); the earlier text here said wind was fetched on local time, which '
                                        'was wrong: Renewables.ninja rows are UTC.')
    new_my['meta']['fingerprint'] = fingerprint(new_my); new_my['meta']['compiled'] = '2026-11-03'
    new_tr['meta']['leap_years'] = leap; new_tr['meta']['twins_rebuilt'] = '2024 and 2025 twins and the national map rebuilt from the fixed files, ' + NOTE_DATE + '.'
    new_mod['meta']['wind_clock'] = 'Rebuilt from the fixed multi-year series through the stored regional maps, ' + NOTE_DATE + ' (wind_clock and leap_years in profiles_regional_multiyear.json).'
    new_rg['meta']['wind_clock'] = clock + ' The 2023 file has no 2022: its first two hours repeat its own last two.'
    new_rg['meta']['solar_timezone'] = new_my['meta']['solar_timezone']
    new_of['meta']['wind_clock'] = clock + ' 2014 starts with its own last two hours.'
    for path, doc in ((BWM.SRC, new_my), (BT.OUT, new_tr), (BWM.OUT, new_mod), ('nodal/profiles_regional.json', new_rg), ('nodal/profiles_offshore_regional.json', new_of)):
        compact = open(path).read(12).startswith('{"meta":{')
        json.dump(doc, open(path, 'w'), separators=(',', ':') if compact else (', ', ': '))
        print('wrote', path)
    BT.write_map()                                                     # SOLAR_TRK_G from the fixed files
    BWM.write_map(new_my, new_mod['wind_modern_pu'], MAP['regional_map'])   # as MAP_ONLY=1
    print('done')


if __name__ == '__main__':
    main()
