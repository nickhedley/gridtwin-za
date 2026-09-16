#!/usr/bin/env python3
"""Build an 8760-hour South African residential load shape from Eskom's DPET model.

Source: Distribution Pre-Electrification Tool 2.6.1, Eskom, recovered from the
installer's embedded CEF asset cache. The tool is documented in Heunis & Dekenah,
"Manual for Distribution PET 2012", DOI 10.25375/uct.7246673, and its model is
derived from the NRS Load Research database, the same programme that produced the
DEL datasets.

Coverage in the recovered data is complete: 5 weather stations x 12 months x 3 day
types x 100 consumption levels x 24 hours = 432,000 rows, no gaps.

Day type codes are NOT labelled in the data. Identified by physical signature on
the July profile of a 10 kWh/day household:
  W0  06:00 14.75, 12:00 11.34, 19:00 20.10, evening/midday 1.77  -> WEEKDAY
  W1  06:00  7.96, 12:00 12.58, 19:00 17.67, evening/midday 1.40  -> SATURDAY
  W2  06:00  6.66, 12:00 16.06, 19:00 19.68, evening/midday 1.23  -> SUNDAY
W0 has the pre-work morning peak and the deep midday trough; W2 has the latest
start and the highest midday, which is the Sunday lunch load the DPET manual
names explicitly.
"""
import glob, csv, collections, json, datetime

STATIONS = None          # None = average all five, for a national shape
LEVEL = 10.0             # kWh/day per household; the top of DPET's range
YEAR = 2025              # match profiles.json
WSS = {0: 'W0', 1: 'W0', 2: 'W0', 3: 'W0', 4: 'W0', 5: 'W1', 6: 'W2'}  # Mon..Sun

D = collections.defaultdict(dict)
stations = set()
for fn in glob.glob('out/*.csv'):
    for r in csv.DictReader(open(fn, newline='')):
        try:
            h = int(r['Hour']); v = float(r['UnitsReadPerHour']); u = float(r['UnitsReadPerSite'])
        except (ValueError, KeyError):
            continue
        if u != LEVEL:
            continue
        stations.add(r['stationid'])
        D[(r['stationid'], r['Month'], r['WSS'])][h] = v

use = sorted(stations) if STATIONS is None else STATIONS
print('stations averaged:', use)

series = []
d = datetime.date(YEAR, 1, 1)
while d.year == YEAR:
    m = 'M%d' % d.month
    w = WSS[d.weekday()]
    for h in range(24):
        vals = [D[(s, m, w)][h] for s in use if (s, m, w) in D and h in D[(s, m, w)]]
        series.append(sum(vals) / len(vals))
    d += datetime.timedelta(days=1)

mean = sum(series) / len(series)
pu = [round(v / mean, 6) for v in series]

# Sanity figures
byh = [0.0] * 24
for i, v in enumerate(pu):
    byh[i % 24] += v / (len(pu) / 24)
jul = pu[(datetime.date(YEAR, 7, 1) - datetime.date(YEAR, 1, 1)).days * 24:
         (datetime.date(YEAR, 8, 1) - datetime.date(YEAR, 1, 1)).days * 24]
jan = pu[0:31 * 24]
print('hours          ', len(pu))
print('mean           ', round(sum(pu) / len(pu), 4))
print('peak / mean    ', round(max(pu), 3))
print('min / mean     ', round(min(pu), 3))
print('peak hour ofday', byh.index(max(byh)))
print('July mean      ', round(sum(jul) / len(jul), 3))
print('Jan mean       ', round(sum(jan) / len(jan), 3))
print('winter/summer  ', round((sum(jul) / len(jul)) / (sum(jan) / len(jan)), 3))

out = {
    'meta': {
        'name': 'South African residential load shape, per unit',
        'year': YEAR,
        'source': 'Eskom Distribution Pre-Electrification Tool (DPET) 2.6.1, model output '
                  'recovered from the installer asset cache. DPET is documented in Heunis & '
                  'Dekenah, Manual for Distribution PET 2012, DOI 10.25375/uct.7246673, and '
                  'its profile sub-model is derived from the NRS Load Research database.',
        'basis': 'Average of all five DPET weather stations at a consumption level of '
                 '%.1f kWh/day per household, mapped to calendar %d by month and day type.'
                 % (LEVEL, YEAR),
        'day_types': 'W0 weekday, W1 Saturday, W2 Sunday. Codes are unlabelled in the source '
                     'and were identified by physical signature - W0 has the pre-work morning '
                     'peak and deep midday trough, W2 the latest start and highest midday.',
        'units': 'per unit, normalised to an annual mean of 1.0. Shape only; levels are not used.',
        'caveats': [
            'DPET is calibrated on NRS Load Research data collected 1994-2014. It predates '
            'sustained load shedding, the prepaid rollout at scale, rooftop PV and the current '
            'appliance mix.',
            'DPET tops out at 10 kWh/day per household, about 300 kWh/month. Eskom Homepower '
            'customers commonly use more, so this shape represents a modest urban household '
            'rather than the upper end of the residential range.',
            'DPET model boundaries: average household income R100-R25,000/month in 2014 rands, '
            'and 1-15 years since electrification.',
            'Weather stations carry a climatic severity index; averaging all five gives a '
            'national shape and suppresses regional spread.',
        ],
        'licence': 'Derived from Eskom DPET output. Check redistribution terms before '
                   'publishing this file.',
    },
    'load_pu': pu,
}
json.dump(out, open('residential_profile.json', 'w'), separators=(',', ':'))
print('written residential_profile.json')
