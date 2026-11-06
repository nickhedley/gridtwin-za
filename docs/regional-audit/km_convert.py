"""739 (c): each priced case's corridor additions converted into km of line: circuits = MW / the St Clair rating of one circuit at the corridor's
length (400 kV: min(1,400, 602 x 53.736 x km^-0.65); 765 kV: min(3,000, 2,280 x 53.736 x km^-0.65)), km of line = circuits x km; by year (the
2035 state's build, and 2040's, cumulative from today). usage: python3 km_convert.py <json> ..."""
import json, sys
TH = {765: 3000.0, 400: 1400.0}; SIL = {765: 2280.0, 400: 602.0}
def rating(kv, km): return min(TH[kv], SIL[kv] * 53.736 * max(km, 1.0) ** -0.65)
print('| case | year | corridor MW added | MW-km (million) | km of 400 kV line (circuits) | km of 765 kV line (circuits) | annual cost R bn | years at 800 km a year, 765 kV | at 400 kV |')
print('|---|---|---|---|---|---|---|---|---|')
for fn in sys.argv[1:]:
    d = json.load(open(fn)); ex = d['expansion']
    k4 = sum(r['addMW'] / rating(400, r['km']) * r['km'] for r in ex); c4 = sum(r['addMW'] / rating(400, r['km']) for r in ex)
    k7 = sum(r['addMW'] / rating(765, r['km']) * r['km'] for r in ex); c7 = sum(r['addMW'] / rating(765, r['km']) for r in ex)
    t = d['expansionTotal']; lab = fn.split('/')[-1].replace('net_final_', '').replace('.json', '')
    print(f"| {lab} | {d['year']} | {t['MW']:,.0f} | {t['MWkm'] / 1e6:.2f} | {k4:,.0f} ({c4:.1f}) | {k7:,.0f} ({c7:.1f}) | {t['annualRbn']:.2f} | {k7 / 800:.1f} | {k4 / 800:.1f} |")
