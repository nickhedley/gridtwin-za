"""753 (a): the report's 17 corridors (lower of N-1 loadability and N-1 PV transfer, 2025/2030/2035) beside the rebuilt table (N-1 once; limits only;
at the report's own per-circuit ratings; with the TDP's lines N-1 once). Writes tables753.md."""
import json
S = '/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad/'
T = json.load(open(S + 'table45_lowerof.json')); V = json.load(open(S + 'corridors_v2.json')); RR = json.load(open(S + 'corr_at_report_ratings.json'))
tdp = json.load(open(S + 'tdp_lines_v2.json'))
def nice(k): return k.replace('|', ' to ').replace('Kwazulu Natal', 'KwaZulu-Natal')
rows = []; tot = {'rep25': 0, 'rep30': 0, 'rep35': 0, 'n1': 0, 'lim': 0, 'rr': 0, 'tdp': 0}
for rep, key in T['_ours'].items():
    v = V['corridors'][key]; circ = [c['ratingMW'] for c in v['circuits']]; lim = sum(circ); n1 = v['n1MW']
    add = [q['mw'] for q in tdp if {q['a'], q['b']} == {v['a'], v['b']}]
    allc = circ + add; n1tdp = (sum(allc) - max(allc)) if len(allc) > 1 else 0.7 * sum(allc)
    r25, r30, r35 = (T['lower'][rep][y] for y in ('2025', '2030', '2035')); b = T['binding'][rep]
    kinds = sorted(set(f"{c['kv']} kV" for c in v['circuits']), key=lambda s: -int(s.split()[0]))
    desc = ', '.join(f"{sum(1 for c in v['circuits'] if f'{c['kv']} kV' == kk)} x {kk}" for kk in kinds)
    rows.append((rep, nice(key), desc, round(v['kmMean']), T['_km_table14'].get(rep, T['_km_table14'].get({'NW-LP': 'LM-NW', 'GP-MP': 'MP-GP', 'GP-NW': 'NW-GP', 'GP-LP': 'LM-GP', 'MP-LP': 'LM-MP', 'KZ-MP': 'KZN-MP', 'EC-KZ': 'EC-KZN'}.get(rep, ''), '')),
                 r25, b['2025'], n1, lim, RR[key][1], n1 / r25, r30, r35, b['2035'], n1tdp, n1tdp / r35, sum(add)))
    for k, x in zip(('rep25', 'rep30', 'rep35', 'n1', 'lim', 'rr', 'tdp'), (r25, r30, r35, n1, lim, RR[key][1], n1tdp)): tot[k] += x
rows.sort(key=lambda r: -r[10])
out = ["### 753 (a): the report's 17 corridors beside the rebuilt table (MW; the report's figure is the lower of N-1 loadability and N-1 PV transfer, the binding one marked L or PV; ours N-1 once from the model's line file; 'at the report's ratings' is our line set at its per-circuit transfer limits, 400 kV 1,000 MW and 765 kV 2,500 MW, N-1 once)", "",
       "| corridor | our circuits | km, ours (crossing) | km, report (Table 14) | report 2025 | ours N-1 once | ours / report | ours, limits only | ours at the report's ratings | report 2030 | report 2035 | ours with the TDP's lines, N-1 once (TDP MW added) | ours with TDP / report 2035 |",
       "|---|---|---|---|---|---|---|---|---|---|---|---|---|"]
for r in rows:
    out.append(f"| {r[1]} | {r[2]} | {r[3]} | {r[4]} | {r[5]:,} ({r[6]}) | {r[7]:,.0f} | {r[10]:.2f} | {r[8]:,.0f} | {r[9]:,} | {r[11]:,} | {r[12]:,} ({r[13]}) | {r[14]:,.0f} ({r[16]:,.0f}) | {r[15]:.2f} |")
out.append(f"| total, the 17 | | | | {tot['rep25']:,} | {tot['n1']:,.0f} | {tot['n1']/tot['rep25']:.2f} | {tot['lim']:,.0f} | {tot['rr']:,} | {tot['rep30']:,} | {tot['rep35']:,} | {tot['tdp']:,.0f} | {tot['tdp']/tot['rep35']:.2f} |")
mer = sum(V['corridors'][k]['n1MW'] for k in ('Free State|North West', 'Mpumalanga|North West'))
out.append(f"| with our two Mercury 765 kV corridors (not in the report) | | | | | {tot['n1']+mer:,.0f} | {(tot['n1']+mer)/tot['rep25']:.2f} | | | | | | |")
open(S + 'tables753.md', 'w').write('\n'.join(out) + '\n'); print('\n'.join(out))
