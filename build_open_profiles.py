#!/usr/bin/env python3
"""build_open_profiles.py - an open-data candidate for profiles.json, in the same format (user, 12 Oct 2026).

profiles.json is built from Eskom's ESK19679 (all rights reserved) and is treated as restricted until the user has
checked the terms. This builds a replacement only from openly licensed sources, for comparison. It never writes
profiles.json: the output path is an argument.

Sources (SOURCES.md):
  demand    ESRG Hourly Demand Model v2025 (B. Merven, UCT, CC BY 4.0), IRPDemandREF, national_demand, hourly, the
            model year asked for. It is underlying demand: grid demand plus distributed PV plus other on-site
            generation. Converted to the model's basis: on-site generation taken off flat (ESRG annual total), ESRG's
            distributed PV taken off on this file's solar shape (ESRG annual total), and the model's own rooftop
            added back with the engine formula (rooftopMW x solar_pu x rooftopDerate, as build_demand_2026.py), so
            the engine removes exactly what is added.
            --demand-grid-twh rescales the grid part to a given annual total (a comparison of shape alone).
  wind/PV   ERA5 hourly single levels (ECMWF, Copernicus Climate Change Service, CC BY 4.0) from the Google Cloud
            copy, read by era5_band.py (repository root) into a cache of daily arrays. Sites: profile_sites.json (DFFE
            REEA authorisation locations, with weights); capacity by region: nodal/regional_renewable_capacity.json
            (IPP Office quarterly report and the Power Futures Lab monitor).
  wind      100 m wind speed, bilinear at each site, hour-beginning mean of the two bounding hours; two turbine
            classes by bid window (below; --wind-classes one for the V112 alone), power curves from windpowerlib's
            bundled turbine library (MIT), smoothed by Staffell and Pfenninger's Gaussian (sigma = 0.6 + 0.2 v m/s);
            losses 13% (wake and electrical 10%, availability 97%), judgement. No calibration to any Eskom series.
  PV        pvlib: Hay-Davies plane-of-array from ERA5 global and direct radiation; 60% single-axis trackers
            (north-south axis, +-60 deg, backtracking, GCR 0.35) and 40% fixed at tilt |latitude| facing north
            (fleet split a judgement: early rounds mostly fixed, later rounds tracking); SAPM cell temperature with
            wind at 10 m from the 100 m speed (power law 1/7); PVWatts DC (-0.37%/C), DC/AC 1.25, 14% system losses
            (PVWatts default), inverter 96%, clipped at AC nameplate. Per unit of AC nameplate.
  CSP       the seven REIPPPP plants (600 MW), town-level coordinates, an approximate model: field output from ERA5
            direct normal irradiance (troughs on a north-south axis, towers at a flat 0.75 cosine factor), solar
            multiple 1 + storage hours / 6, field efficiency 0.8 off design, parasitics 10%, availability 96%,
            storage as built, dispatch filling the 16:30-21:30 peak first (the
            REIPPPP CSP peak tariff window), holding what is left overnight and running on it at up to half load from
            07:00 until the field takes over. Judgement throughout.

Time: hour-beginning, South African Standard Time (UTC+2), the calendar year asked for, 8,760 hours.

usage: python3 build_open_profiles.py --era5 DIR --esrg CSV --year 2025 --demand-year 2026 --out FILE
                                      [--demand-grid-twh X] [--demand2025-grid-twh X]
"""
import argparse, json, os, re, sys, datetime as dt
import numpy as np, pandas as pd, pvlib
from windpowerlib import power_curves
import windpowerlib

ap = argparse.ArgumentParser()
ap.add_argument('--era5', required=True); ap.add_argument('--esrg', required=True)
ap.add_argument('--year', type=int, default=2025); ap.add_argument('--demand-year', type=int, default=2026)
ap.add_argument('--demand-grid-twh', type=float); ap.add_argument('--demand2025-grid-twh', type=float)
ap.add_argument('--out', required=True)
ap.add_argument('--wind-classes', choices=('one', 'two'), default='two')
ap.add_argument('--wind-target-cf', type=float)
a = ap.parse_args()
if os.path.basename(a.out) == 'profiles.json': sys.exit('refusing to write profiles.json')
HOURS = 8760
ROOT = os.path.dirname(os.path.abspath(__file__))

# ---- ERA5 cache -> hourly fields on the local calendar year ----
grid = json.load(open(os.path.join(a.era5, 'grid.json')))
LAT, LON = np.array(grid['lat']), np.array(grid['lon'])
day0 = dt.date(a.year - 1, 12, 31); ndays = (dt.date(a.year, 12, 31) - day0).days + 1
def load(var):
    arr = np.concatenate([np.load(os.path.join(a.era5, var, (day0 + dt.timedelta(k)).isoformat() + '.npy')) for k in range(ndays)])
    if np.isnan(arr).any(): sys.exit('%s: missing values' % var)
    return arr                                  # UTC hours from (year-1)-12-31 00:00
T0 = 22                                         # local 00:00 on 1 January = UTC 22:00 on 31 December
def inst(arr):  # instantaneous field -> hour-beginning mean over [t0, t0+1]
    return 0.5 * (arr[T0:T0 + HOURS] + arr[T0 + 1:T0 + HOURS + 1])
def accum(arr):  # ERA5 accumulation over the hour ending at t -> the hour beginning at t-1
    return arr[T0 + 1:T0 + HOURS + 1]

def bilinear(lat, lon):
    i = np.searchsorted(-LAT, -lat) - 1; j = np.searchsorted(LON, lon) - 1
    i = min(max(i, 0), len(LAT) - 2); j = min(max(j, 0), len(LON) - 2)
    fy = (LAT[i] - lat) / (LAT[i] - LAT[i + 1]); fx = (lon - LON[j]) / (LON[j + 1] - LON[j])
    return [(i, j, (1 - fy) * (1 - fx)), (i + 1, j, fy * (1 - fx)), (i, j + 1, (1 - fy) * fx), (i + 1, j + 1, fy * fx)]
def at(field, lat, lon):
    return sum(w * field[:, i, j] for i, j, w in bilinear(lat, lon))

U, V = load('100m_u_component_of_wind'), load('100m_v_component_of_wind')
WS = inst(np.sqrt(U ** 2 + V ** 2)); del U, V
GHI = accum(load('surface_solar_radiation_downwards')) / 3600.0
DIRH = accum(load('total_sky_direct_solar_radiation_at_surface')) / 3600.0
T2 = inst(load('2m_temperature')) - 273.15
idx_local = pd.date_range('%d-01-01 00:00' % a.year, periods=HOURS, freq='h', tz='Africa/Johannesburg')
mid_utc = (idx_local + pd.Timedelta(minutes=30)).tz_convert('UTC')

# ---- capacity and sites ----
cap = json.load(open(os.path.join(ROOT, 'nodal', 'regional_renewable_capacity.json')))
sites = json.load(open(os.path.join(ROOT, 'profile_sites.json')))
def fleet(tech, fn):
    num = np.zeros(HOURS); tot = 0.0
    for reg, mw in cap['%s_mw' % tech].items():
        if mw <= 0: continue
        ss = sites[tech][reg]['sites']; wsum = sum(s['w'] for s in ss)
        num += mw * sum(s['w'] / wsum * fn(s['lat'], s['lng']) for s in ss); tot += mw
    return num / tot, tot

# ---- wind ----
# Turbine classes (user, 12 Oct 2026: one V112 curve under-represents the larger-rotor plants of bid window 4 onward).
# 'two': BW1-3 on the V112-3.075 (112 m rotor, hub 90 m) and BW4 onward plus private plants on the Nordex N131-3.6
# (131 m rotor, hub 115 m). Capacity split national, applied in every region: BW1-3 about 2.0 GW (IPP Office figures
# as quoted in search extracts: BW1 649, BW2 559, BW3 787 MW; the deck is not consistent) of the 4.6 GW fleet, so 43%
# and 57%. Speeds moved from 100 m to hub height by a 1/7 power law. 'one': the V112 alone at 100 m, as first built.
pc = pd.read_csv(os.path.join(os.path.dirname(windpowerlib.__file__), 'data', 'default_turbine_data', 'power_curves.csv')).set_index('turbine_type')
def curve(name):
    row = pc.loc[name].dropna(); vs = row.index.astype(float).values; pw = row.values / row.values.max()
    sm = power_curves.smooth_power_curve(pd.Series(vs), pd.Series(pw), standard_deviation_method='Staffell_Pfenninger')
    return sm['wind_speed'].values, sm['value'].values
CLASSES = {'one': [('V112/3075', 100.0, 1.0)], 'two': [('V112/3075', 90.0, 0.43), ('N131/3600', 115.0, 0.57)]}[a.wind_classes]
CURVES = {n: curve(n) for n, _, _ in CLASSES}
WIND_LOSS = 0.87
# --wind-target-cf: ERA5 under-reads wind on South Africa's ridges at 0.25 deg (100 m means of 5.3-6.4 m/s at the
# sites). The standard correction scales wind speed by one national factor, solved here so the fleet's annual capacity
# factor meets a public figure (Ember, CC BY 4.0: 11.32 TWh in 2025 on 3.44 GW at end-2024 and 4.33 GW at end-2025,
# 33.3% on the mean). No Eskom series is used. Unset: no scaling.
SPEED_K = 1.0
def wind_site(lat, lon):
    v100 = SPEED_K * at(WS, lat, lon)
    return WIND_LOSS * sum(sh * np.interp(v100 * (hub / 100.0) ** (1 / 7), *CURVES[n], right=0.0) for n, hub, sh in CLASSES)
wind_pu, wind_mw = fleet('wind', wind_site); wind_cf_raw = wind_pu.mean()
if a.wind_target_cf:
    lo, hi = 0.8, 2.0
    for _ in range(40):
        SPEED_K = 0.5 * (lo + hi); cf = fleet('wind', wind_site)[0].mean()
        lo, hi = (SPEED_K, hi) if cf < a.wind_target_cf else (lo, SPEED_K)
    wind_pu, wind_mw = fleet('wind', wind_site)

# ---- PV ----
TRACK_SHARE, DCAC, LOSS, ETA_INV, GAMMA = 0.60, 1.25, 0.1408, 0.96, -0.0037
SAPM = pvlib.temperature.TEMPERATURE_MODEL_PARAMETERS['sapm']['open_rack_glass_polymer']
def pv_site(lat, lon, tracking=None):
    ghi = np.clip(at(GHI, lat, lon), 0, None); dirh = np.clip(at(DIRH, lat, lon), 0, None); dirh = np.minimum(dirh, ghi)
    sp = pvlib.solarposition.get_solarposition(mid_utc, lat, lon)
    cz = np.cos(np.radians(sp['apparent_zenith'].values)); up = cz > 0.0175
    dni = np.where(up, dirh / np.maximum(cz, 0.0872), 0.0); dhi = ghi - dirh
    dni_extra = pvlib.irradiance.get_extra_radiation(mid_utc).values
    t_amb = at(T2, lat, lon); w10 = at(WS, lat, lon) * (10 / 100) ** (1 / 7)
    out = np.zeros(HOURS)
    for kind, share in (('track', TRACK_SHARE), ('fixed', 1 - TRACK_SHARE)):
        if kind == 'track':
            tr = pvlib.tracking.singleaxis(sp['apparent_zenith'], sp['azimuth'], axis_tilt=0, axis_azimuth=0, max_angle=60, backtrack=True, gcr=0.35)
            tilt, azi = tr['surface_tilt'].fillna(0).values, tr['surface_azimuth'].fillna(0).values
        else:
            tilt, azi = abs(lat), 0.0
        poa = pvlib.irradiance.get_total_irradiance(tilt, azi, sp['apparent_zenith'].values, sp['azimuth'].values, dni, ghi, dhi,
                                                    dni_extra=dni_extra, model='haydavies')['poa_global']
        poa = np.nan_to_num(np.clip(np.asarray(poa, float), 0, None))
        tc = pvlib.temperature.sapm_cell(poa, t_amb, w10, **SAPM)
        dc = DCAC * poa / 1000.0 * (1 + GAMMA * (tc - 25.0)) * (1 - LOSS)
        out += share * np.clip(dc * ETA_INV, 0, 1.0)
    return out
solar_pu, solar_mw = fleet('solar', pv_site)

# ---- CSP (approximate) ----
CSP = [  # name, MW, storage h, type, lat, lon (town-level)
    ('KaXu Solar One', 100, 2.5, 'trough', -28.88, 19.59), ('Xina Solar One', 100, 5.5, 'trough', -28.88, 19.60),
    ('Khi Solar One', 50, 2.0, 'tower', -28.54, 21.07), ('Bokpoort', 50, 9.3, 'trough', -28.73, 21.99),
    ('Ilanga I', 100, 4.5, 'trough', -28.49, 21.53), ('Kathu Solar Park', 100, 4.5, 'trough', -27.70, 23.05),
    ('Redstone', 100, 12.0, 'tower', -28.30, 23.00)]
hour_loc = idx_local.hour.values + idx_local.minute.values / 60.0
peak = (hour_loc >= 16) & (hour_loc < 22)            # 16:00-22:00 hours cover the 16:30-21:30 window
def csp_plant(mw, store, kind, lat, lon):
    ghi = np.clip(at(GHI, lat, lon), 0, None); dirh = np.clip(np.minimum(at(DIRH, lat, lon), ghi), 0, None)
    sp = pvlib.solarposition.get_solarposition(mid_utc, lat, lon)
    cz = np.cos(np.radians(sp['apparent_zenith'].values)); dni = np.where(cz > 0.0175, dirh / np.maximum(cz, 0.0872), 0.0)
    if kind == 'trough':
        tr = pvlib.tracking.singleaxis(sp['apparent_zenith'], sp['azimuth'], axis_tilt=0, axis_azimuth=0, max_angle=90, backtrack=False)
        cosf = np.cos(np.radians(tr['aoi'].fillna(90).values)).clip(0)
    else:
        cosf = np.where(cz > 0.0175, 0.75, 0.0)
    sm_ = 1 + store / 6.0
    # field output in turbine full-load units: design point DNI 900 W/m2 at normal incidence; off-design optical and
    # thermal losses 20% (judgement, of the order of NREL SAM's trough defaults)
    q = sm_ * CSP_FIELD_ETA * np.clip(dni * cosf / 900.0, 0, None)
    soc, out = 0.0, np.zeros(HOURS)
    for h in range(HOURS):
        if peak[h]:
            gen = min(1.0, q[h] + soc); soc = min(store, soc + q[h] - gen) if q[h] > gen else soc - (gen - q[h])
        elif q[h] > 0:
            hours_to_peak = 16 - hour_loc[h] if hour_loc[h] < 16 else 0
            reserve = min(store, 5.0) if hours_to_peak > 0 else 0.0
            to_store = min(q[h], max(0.0, reserve - soc)); gen = min(1.0, q[h] - to_store)
            soc = min(store, soc + q[h] - gen)
        elif 7 <= hour_loc[h] < 12:                    # morning before the field takes over: stored heat, half load
            gen = min(0.5, soc); soc -= gen
        else:                                           # after the peak window: hold what is left for the morning
            gen = 0.0
        out[h] = gen
    return out
CSP_FIELD_ETA, CSP_PARASITIC, CSP_AVAIL = 0.80, 0.90, 0.96   # judgement, SAM-like; sent-out = gross x parasitic x availability
csp_pu = CSP_PARASITIC * CSP_AVAIL * sum(mw * csp_plant(mw, s, k, la, lo) for _, mw, s, k, la, lo in CSP) / sum(c[1] for c in CSP)

# ---- demand ----
html = open(os.path.join(ROOT, 'index.html')).read()
def fixed(key):
    m = re.search(r'\b' + key + r'\s*:\s*([0-9.]+)', html)
    if not m: sys.exit('FIXED.%s not found' % key)
    return float(m.group(1))
ROOF_MW, DERATE = fixed('rooftopMW'), fixed('rooftopDerate')
m = re.search(r"'2025, as modelled':\{[^}]*?rooftopMW:([0-9.]+)", html); ROOF_25 = float(m.group(1))
ESRG_ANNUAL = {2025: (7823, 12390), 2026: (8754, 12390)}   # GWh: distributed PV, other on-site (ESRG AnnualDashboard)
esrg = pd.read_csv(a.esrg)
def demand_for(year, roof_mw, grid_twh):
    d = esrg.loc[esrg['model_year'] == year, 'national_demand'].values.astype(float)
    if len(d) != HOURS: sys.exit('ESRG %d: %d hours' % (year, len(d)))
    dpv, onsite = ESRG_ANNUAL[year]
    grid_d = d - onsite * 1e3 / HOURS - dpv * 1e3 * solar_pu / solar_pu.sum()
    if grid_twh: grid_d *= grid_twh * 1e6 / grid_d.sum()
    roof = roof_mw * solar_pu * DERATE; g = grid_d + roof
    g = np.where(roof > 0.9 * g, grid_d / 0.1, g)      # as build_demand_2026.py: the engine's 0.9 cap
    return np.round(g, 3), grid_d.sum() / 1e6
demand, grid26 = demand_for(a.demand_year, ROOF_MW, a.demand_grid_twh)
demand_2025, grid25 = demand_for(2025, ROOF_25, a.demand2025_grid_twh)

r5 = lambda x: [round(float(v), 5) for v in x]
out = {'meta': {
    'year': a.year,
    'source': 'OPEN CANDIDATE (not in use): built %s by build_open_profiles.py from openly licensed data only. '
              'Wind, solar and CSP: ERA5 (ECMWF, Copernicus Climate Change Service, CC BY 4.0; contains modified '
              'Copernicus Climate Change Service information %d), Google Cloud copy, modelled at REIPPPP locations, '
              'calendar %d, hour-beginning SAST. Demand: ESRG Hourly Demand Model v2025 (B. Merven, UCT, CC BY 4.0).'
              % (dt.date.today().isoformat(), a.year, a.year),
    'notes': 'demand=underlying (grid demand + rooftop added back with the engine formula). wind_pu/solar_pu/csp_pu are '
             'MODELLED per unit of nameplate, uncalibrated to any measured series. See build_open_profiles.py for '
             'every assumption.',
    'demand_source': 'ESRG IRPDemandREF national_demand %d less on-site generation (flat) and ESRG distributed PV (on '
                     'solar_pu), grid part %.2f TWh%s; rooftop added back at rooftopMW %g x derate %g.'
                     % (a.demand_year, grid26, ' (rescaled)' if a.demand_grid_twh else '', ROOF_MW, DERATE),
    'demand_2025_source': 'ESRG IRPDemandREF national_demand 2025, same conversion, grid part %.2f TWh%s; rooftop at %g MW.'
                          % (grid25, ' (rescaled)' if a.demand2025_grid_twh else '', ROOF_25),
    'capacity_mw': {'wind': wind_mw, 'solar': solar_mw, 'csp': sum(c[1] for c in CSP)},
    'assumptions': {'wind_classes': [{'turbine': n, 'hub_m': h, 'share': sh} for n, h, sh in CLASSES], 'wind_smoothing': 'Staffell-Pfenninger', 'wind_loss': WIND_LOSS, 'wind_speed_scale': round(SPEED_K, 4), 'wind_cf_before_scaling': round(float(wind_cf_raw), 4), 'wind_target_cf': a.wind_target_cf, 'csp_field_eta': CSP_FIELD_ETA, 'csp_parasitic': CSP_PARASITIC, 'csp_availability': CSP_AVAIL,
                    'pv_tracking_share': TRACK_SHARE, 'pv_dc_ac': DCAC, 'pv_losses': LOSS, 'pv_inverter_eta': ETA_INV,
                    'csp': 'approximate dispatch model, peak window first'},
    'licence': 'Derived from CC BY 4.0 sources (ERA5, ESRG); attribution as in source.'},
    'demand': demand.tolist(), 'wind_pu': r5(wind_pu), 'solar_pu': r5(solar_pu), 'csp_pu': r5(csp_pu),
    'demand_2025': demand_2025.tolist()}
json.dump(out, open(a.out, 'w'))
print('speed scale %.4f (raw wind CF %.2f%%)' % (SPEED_K, 100 * wind_cf_raw))
print('wrote %s: wind CF %.2f%%, solar CF %.2f%%, CSP CF %.2f%%, demand %.2f TWh (grid %.2f), demand_2025 %.2f TWh (grid %.2f)'
      % (a.out, 100 * wind_pu.mean(), 100 * solar_pu.mean(), 100 * csp_pu.mean(), demand.sum() / 1e6, grid26, demand_2025.sum() / 1e6, grid25))
