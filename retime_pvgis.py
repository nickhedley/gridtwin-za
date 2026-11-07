"""
GridTwin ZA - PVGIS-SARAH3 solar from instantaneous values at the stamped minute to hour means (message 704 (a), 5 Nov 2026).

THE FAULT

PVGIS-SARAH3's hourly values are stamped HH:02 or HH:03 UTC, the minute varying by site (the satellite's scan time over that
point). The model reads every hourly value as the mean of the hour beginning at its label (centre HH:30), so the ten PVGIS years
(2014-2023) ran late against Eskom's metered fleet: about 25 minutes (RESULTS 'Modelled solar timing against the metered fleet').
The 2024-2025 tracking twins inherit it through the PVGIS tracking/fixed ratio and ran early.

THE STAMPED MINUTE (raw seriescalc responses, PVGIS v5_3, PVGIS-SARAH3, 5 Nov 2026; the same in every year 2014-2023):
:02 UTC at Free State, Northern Cape, Western Cape, Hydra Central, Eastern Cape and KwaZulu-Natal; :03 UTC at North West,
Limpopo, Gauteng and Mpumalanga. The response's own meta says 'hourly averages'; the minute that varies by site, and the
measured lag, say the values are the satellite's instantaneous reading at that minute.

THE CONVERSION (method 'csi_day', the default; message 704 (a), 707 (b)): each stored value v_i (SAST hour i) is the reading at
i:mm. It is divided by the sun's height g = max(0, sin(elevation)) at that minute and point; this clear-sky index is interpolated
linearly in time between readings (a reading with the sun under 3 degrees takes its neighbour's index), multiplied back by g minute
by minute and averaged over the hour [i:00, i+1:00); each day is then scaled so its energy equals the readings' (the linear
interpolation's) total. The shape follows the sun at dawn and dusk; the energy is the readings'. Method 'linear' (the readings joined
by straight lines) spreads output across sunrise and sunset (July, national tracking, 2014-2023: 0.21 at 07:00 and 0.22 at 17:00,
against 0.16 and 0.16 by csi_day; the metered fleet 0.03 and 0.05); 'csi' without the day scaling adds 0.5-0.9% to tracking energy.
Solar position: NOAA's approximation, UTC; leap years are stored with 29 February dropped, so a stored hour's date is taken on a
365-day calendar.

CHECK (5 Nov 2026, ESK19679's metered fleet, 5-minute resolution, the lag script of RESULTS 'Modelled solar timing'), csi_day: the
best-fit shift of 2023 (PVGIS) fixed tilt moves from -30/-25/-25/-25 minutes (DJF/MAM/JJA/SON) to -5/0/+5/0, its tracking from
-20/-20/-25/-25 to +5/+5/+5/0; the 2024-2025 tracking twins from +50/+45-50/+35/+25 to +10-15/+10/+5/-20/-25 (spring: the MERRA-2
fixed tilt they are built on runs -10 to -15 there itself). All three methods give the same lags.

WHAT IT CHANGES
nodal/profiles_regional_multiyear.json solar_pu for 2014-2023 (2024-2025 are Renewables.ninja MERRA-2 hour means, measured on
time, untouched); nodal/profiles_solar_tracking.json solar_trk_pu for 2014-2023, and 2024-2025 rebuilt as build_solar_tracking.py
builds them (each year's fixed-tilt series times the tracking/fixed ratio by region, month and hour, now from the re-timed
2014-2023; from the stored files, as the PVGIS tracking cache is not in the repository); the national map (build_solar_tracking
write_map). Then rebuild the metered tracking twin's map: node harness/solar_trk_k.js. Refuses to run twice (meta.retimed).

USAGE (repo root)
    python3 retime_pvgis.py [--method linear|csi] [--root <dir>]     # --root: write into a copy (for checks)
    MAP_ONLY=1 python3 build_solar_tracking.py; cd harness && NODE_PATH=node_modules node solar_trk_k.js testroot --write
"""
import argparse, hashlib, json, math, os
import numpy as np

COORDS = {'Free State': (-28.385, 25.944), 'Northern Cape': (-29.140, 21.073), 'Western Cape': (-32.520, 19.571),
          'North West': (-26.512, 25.163), 'Hydra Central': (-30.568, 24.134), 'Limpopo': (-23.300, 28.638),
          'Gauteng': (-25.646, 27.870), 'Eastern Cape': (-31.500, 25.500), 'Kwazulu Natal': (-28.500, 30.500),
          'Mpumalanga': (-26.000, 29.500)}
MINUTE = {'Free State': 2, 'Northern Cape': 2, 'Western Cape': 2, 'Hydra Central': 2, 'Eastern Cape': 2, 'Kwazulu Natal': 2,
          'North West': 3, 'Limpopo': 3, 'Gauteng': 3, 'Mpumalanga': 3}
PVGIS_YEARS = [str(y) for y in range(2014, 2024)]
MIN_ELEV_SIN = math.sin(math.radians(3.0))
_MD = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
_MSTART = [sum(_MD[:i]) * 24 for i in range(12)]


def month_of(h):
    for m in range(11, -1, -1):
        if h >= _MSTART[m]: return m


def sun_sin(lat, lon, utc_min):
    """max(0, sin(solar elevation)) at minutes of the (365-day) year, UTC; utc_min may run below 0 or past the year's end."""
    doy = np.floor(utc_min / 1440.0) + 1; hr = (utc_min % 1440) / 60.0
    g = 2 * np.pi / 365 * (doy - 1 + (hr - 12) / 24)
    eqt = 229.18 * (0.000075 + 0.001868 * np.cos(g) - 0.032077 * np.sin(g) - 0.014615 * np.cos(2 * g) - 0.040849 * np.sin(2 * g))
    dec = (0.006918 - 0.399912 * np.cos(g) + 0.070257 * np.sin(g) - 0.006758 * np.cos(2 * g) + 0.000907 * np.sin(2 * g)
           - 0.002697 * np.cos(3 * g) + 0.00148 * np.sin(3 * g))
    tst = hr * 60 + eqt + 4 * lon
    ha = np.radians(tst / 4 - 180); la = np.radians(lat)
    return np.maximum(0.0, np.sin(la) * np.sin(dec) + np.cos(la) * np.cos(dec) * np.cos(ha))


def retime(v, lat, lon, minute, method='csi'):
    """v: 8760 values (any scale), SAST hour i holding the reading at i:minute. Returns the 8760 hour means."""
    v = np.asarray(v, float); n = len(v)
    s_sast = np.arange(n) * 60.0 + minute                      # reading times, SAST minutes of the year
    t_sast = np.arange(n * 60) + 0.5                            # minute centres
    if method == 'linear':
        x = np.interp(t_sast, s_sast, v, left=v[0], right=v[-1])
    else:
        gs = sun_sin(lat, lon, s_sast - 120.0)
        c = np.where(gs > MIN_ELEV_SIN, v / np.where(gs > 0, gs, 1), np.nan)
        # a reading with the sun under 3 degrees takes its neighbour's index (the next, else the previous); none: 0
        cn = np.copy(c)
        nxt = np.concatenate([c[1:], [np.nan]]); prv = np.concatenate([[np.nan], c[:-1]])
        cn = np.where(np.isnan(cn), nxt, cn); cn = np.where(np.isnan(cn), prv, cn); cn = np.where(np.isnan(cn), 0.0, cn)
        ci = np.interp(t_sast, s_sast, cn, left=cn[0], right=cn[-1])
        x = ci * sun_sin(lat, lon, t_sast - 120.0)
    out = x.reshape(n, 60).mean(axis=1)
    if method == 'csi_day':   # the clear-sky shape, each day's energy kept at the linear (readings') total
        lin = np.interp(t_sast, s_sast, v, left=v[0], right=v[-1]).reshape(n, 60).mean(axis=1)
        d_out, d_lin = out.reshape(-1, 24).sum(axis=1), lin.reshape(-1, 24).sum(axis=1)
        f = np.where(d_out > 1e-9, d_lin / np.where(d_out > 1e-9, d_out, 1), 1.0)
        out = (out.reshape(-1, 24) * f[:, None]).reshape(-1)
    return out


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--method', default='csi_day', choices=['csi_day', 'linear', 'csi'])
    ap.add_argument('--root', default='.'); a = ap.parse_args()
    R = a.root; SRC = os.path.join(R, 'nodal/profiles_regional_multiyear.json'); TRK = os.path.join(R, 'nodal/profiles_solar_tracking.json')
    d, t = json.load(open(SRC)), json.load(open(TRK))
    if d['meta'].get('retimed') or t['meta'].get('retimed'): raise SystemExit('already re-timed (meta.retimed); stop')
    sc, st = d.get('scale', 1000), t.get('scale', 1000)
    report = {}
    for reg, (lat, lon) in COORDS.items():
        m = MINUTE[reg]; report[reg] = {}
        for y in PVGIS_YEARS:
            for name, obj, key, scale in (('fixed', d, 'solar_pu', sc), ('tracking', t, 'solar_trk_pu', st)):
                old = np.array(obj[key][reg][y], float) / scale
                new = np.minimum(1.0, retime(old, lat, lon, m, a.method))
                obj[key][reg][y] = [int(round(q * scale)) for q in new]
                report[reg].setdefault(name, {})[y] = [round(old.mean(), 5), round(new.mean(), 5)]
        # 2024-2025 tracking as build_solar_tracking.py: own fixed-tilt series times the ratio by month and hour over 2014-2023
        num = [[0.0] * 24 for _ in range(12)]; den = [[0.0] * 24 for _ in range(12)]
        for y in PVGIS_YEARS:
            T, F = t['solar_trk_pu'][reg][y], d['solar_pu'][reg][y]
            for h in range(8760):
                mo = month_of(h); num[mo][h % 24] += T[h] / st; den[mo][h % 24] += F[h] / sc
        G = [[(num[mo][hh] / den[mo][hh]) if den[mo][hh] > 1e-6 else 1.0 for hh in range(24)] for mo in range(12)]
        for y in t['solar_trk_pu'][reg]:
            if y in PVGIS_YEARS: continue
            old = d['solar_pu'][reg][y]
            t['solar_trk_pu'][reg][y] = [min(st, round(old[h] * G[month_of(h)][h % 24])) for h in range(8760)]
    note = {'what': 'PVGIS-SARAH3 2014-2023 converted from the instantaneous reading at the stamped minute to hour means (retime_pvgis.py, '
                    'message 704 (a), 5 Nov 2026)', 'method': a.method, 'minute_utc': MINUTE,
            'source_of_minute': 'raw PVGIS v5_3 seriescalc responses, PVGIS-SARAH3, 5 Nov 2026; the same in every year 2014-2023',
            'annual_mean_before_after': report}
    d['meta']['retimed'] = {k: v for k, v in note.items() if k != 'annual_mean_before_after'}
    d['meta']['retimed']['annual_mean_before_after'] = {r: v['fixed'] for r, v in report.items()}
    t['meta']['retimed'] = {k: v for k, v in note.items() if k != 'annual_mean_before_after'}
    t['meta']['retimed']['annual_mean_before_after'] = {r: v['tracking'] for r, v in report.items()}
    t['meta']['borrowed_years'] = (t['meta'].get('borrowed_years', '') + ' Rebuilt 5 Nov 2026 from the re-timed 2014-2023 (the stored '
                                   'series; the PVGIS tracking cache is not in the repository).')
    for doc in (d, t):   # build_capacity.py's fingerprint, where a file carries one
        if 'fingerprint' in doc['meta']:
            body = {k: v for k, v in doc.items() if k != 'meta'}
            doc['meta']['fingerprint'] = 'gtza-' + hashlib.sha256(json.dumps(body, sort_keys=True, separators=(',', ':')).encode()).hexdigest()[:16]
            doc['meta']['compiled'] = '2026-11-05'
    json.dump(d, open(SRC, 'w'), separators=(',', ':')); json.dump(t, open(TRK, 'w'), separators=(',', ':'))
    print('wrote', SRC, TRK)
    for r, v in report.items():
        f = v['fixed']; k = v['tracking']
        print('%-14s fixed mean %.4f -> %.4f  tracking %.4f -> %.4f (2014-2023)' % (r, np.mean([q[0] for q in f.values()]),
              np.mean([q[1] for q in f.values()]), np.mean([q[0] for q in k.values()]), np.mean([q[1] for q in k.values()])))


if __name__ == '__main__':
    main()
