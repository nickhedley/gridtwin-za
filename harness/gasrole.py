# Gas, diesel and CO2 by year from engine-check output (pathcheck.js on branch claude/topup, which adds ocgtLngTWh), 13 Oct 2026.
# Gas is reported as electricity output (TWh) and as fuel (PJ, HHV): combined cycle at effCcgtHHV, open cycle on LNG at
# heatRateOcgtKJ; capacity factor on new MW built to date (existing CCGT is 0). CO2 by fuel follows index.html's own formula:
# gas = (gas output + OCGT-on-LNG output x (heat-rate ratio - 1)) x emisCcgt; diesel = diesel output x emisDiesel; coal = rest.
# usage: python3 gasrole.py <index.html> <pathcheck json> [<label>]
import sys, re, json
html = open(sys.argv[1]).read(); rows = json.load(open(sys.argv[2])); label = sys.argv[3] if len(sys.argv) > 3 else ''
K = {k: float(re.search(k + r':([0-9.]+)', html).group(1)) for k in ('effCcgtHHV', 'heatRateOcgtKJ', 'emisCcgt', 'emisDiesel')}
ocK = K['heatRateOcgtKJ'] / 3600 * K['effCcgtHHV']
for k in ('gasTWh', 'ocgtLngTWh', 'diesel', 'co2', 'newCcgtMW', 'newOcgtMW'):
    if k not in rows[0]: raise SystemExit('no ' + k + ' in the engine check rows')
print('== gas, diesel and CO2 by year %s (engine check means; output TWh, fuel PJ HHV, CF on new MW; CO2 Mt)' % label)
print('year  CCGT MW  out TWh  fuel PJ   CF    LNG-OCGT MW  out TWh  fuel PJ   CF    diesel TWh   CO2 coal   gas  diesel  total')
tot = {'cc': 0, 'oc': 0, 'ccf': 0, 'ocf': 0, 'd': 0, 'cc2': 0, 'g2': 0, 'd2': 0, 't2': 0}
for r in sorted(rows, key=lambda q: q['y']):
    oc = r['ocgtLngTWh']; cc = r['gasTWh'] - oc
    ccf = cc * 3.6 / K['effCcgtHHV']; ocf = oc * K['heatRateOcgtKJ'] / 1000
    cf = lambda twh, mw: (twh * 1e6 / (mw * 8760)) if mw > 0 else 0
    g2 = (r['gasTWh'] + oc * (ocK - 1)) * K['emisCcgt']; d2 = r['diesel'] * K['emisDiesel']; c2 = r['co2'] - g2 - d2
    print('%d  %7.0f  %7.2f  %7.1f  %4.0f%%   %11.0f  %7.2f  %7.1f  %4.0f%%   %10.3f   %8.1f %5.1f %7.2f %6.1f' % (r['y'], r['newCcgtMW'], cc, ccf, 100 * cf(cc, r['newCcgtMW']),
          r['newOcgtMW'], oc, ocf, 100 * cf(oc, r['newOcgtMW']), r['diesel'], c2, g2, d2, r['co2']))
    for k, v in (('cc', cc), ('oc', oc), ('ccf', ccf), ('ocf', ocf), ('d', r['diesel']), ('cc2', c2), ('g2', g2), ('d2', d2), ('t2', r['co2'])): tot[k] += v
print('2026-40: CCGT %.1f TWh (%.0f PJ); LNG-OCGT %.2f TWh (%.0f PJ); diesel %.2f TWh; CO2 coal %.0f, gas %.1f, diesel %.1f, total %.0f Mt' % (
      tot['cc'], tot['ccf'], tot['oc'], tot['ocf'], tot['d'], tot['cc2'], tot['g2'], tot['d2'], tot['t2']))
