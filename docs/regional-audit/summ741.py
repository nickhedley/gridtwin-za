"""741: the model's priority corridors against the TDP's planned lines, on the rebuilt table (weather 2025; no new solves). One table by corridor
and year: hours at the limit and the value of one more MW with today's corridors (nm1) and with the TDP's lines (nm1tdp, tdp_lines_v2.json);
corridor MW the LP builds without the TDP's lines (R10,000 and R21,700) and with them (R21,700, from 737's first cut); the TDP's planned lines on
the corridor by name, year, voltage and phase with the MW they add (the Eros and Umtu lines of the with-range marked); the shortfall = what the LP
still builds with the plan in place. A second table ranks the corridors by value under approved-record siting (the fixed build) and the LP's own
siting (free siting). Priority corridors to test, not lines to build."""
import json, os, re
S = '/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad/'
def load(fn):
    try: return json.load(open(S + fn))
    except FileNotFoundError: return None
tdp = json.load(open(S + 'tdp_lines_v2.json')); tdpw = json.load(open(S + 'tdp_lines_v2_with.json'))
def lines_on(a, b, y):
    out = []
    for q in tdpw:
        if {q['a'], q['b']} == {a, b} and (q.get('year') or 9999) <= y:
            tag = '' if any({r['a'], r['b']} == {a, b} and r['name'] == q['name'] for r in tdp) else ' [with-range only]'
            out.append(f"{q['name'].split(' (')[0]} ({q.get('year')}, {q.get('kv') or '400 assumed'} kV, {q.get('phase')}, {q['mw']:,} MW){tag}")
    return out
def key(a, b): return '|'.join(sorted((a, b)))
for y, wy in ((2035, 2025), (2040, 2025), (2035, 2015), (2040, 2015)):
    today = load(f'net_final_{y}_wy{wy}_nm1_reea_l0_c0_v2.json'); plan = load(f'net_final_{y}_wy{wy}_nm1tdp_reea_l0_c0_v2tdp.json')
    e10 = load(f'net_final_{y}_wy{wy}_nm1_reea_l0_c0_v2_ext10k.json'); e21 = load(f'net_final_{y}_wy{wy}_nm1_reea_l0_c0_v2_ext21k.json'); e21p = load(f'net_final_{y}_wy{wy}_nm1tdp_reea_l0_c0_v2tdp_ext21k.json')
    free = load(f'net_final_{y}_wy{wy}_nm1_reea_l0_c0_v2_sitefree.json')
    if not (today and plan): print(f'{y}, weather {wy}: pending'); continue
    T = {key(c['a'], c['b']): c for c in today['corridors']}; P = {key(c['a'], c['b']): c for c in plan['corridors']}
    def ex(d): return {key(r['a'], r['b']): r['addMW'] for r in (d['expansion'] if d else [])}
    X10, X21, X21P = ex(e10), ex(e21), ex(e21p)
    print(f"\n### 741, {y}, weather {wy} (build 2026-11-05f; the rebuilt table, N-1 once; the TDP file tdp_lines_v2.json, Eros in KwaZulu-Natal, no Umtu line, Gamma to Grassridge twice)\n")
    print("| corridor | today: hours at the limit, value of one more MW (R m a year) | with the TDP's lines: hours, value | LP builds without the plan, GW (R10,000; R21,700) | LP builds with the plan, GW (R21,700) | the TDP's lines on the corridor (name, year, kV, phase, MW) | MW the plan adds | shortfall (what the LP still builds with the plan) |")
    print('|---|---|---|---|---|---|---|---|')
    rows = []
    for k, c in T.items():
        a, b = c['a'], c['b']; p = P.get(k, {}); ls = lines_on(a, b, y); add = sum(q['mw'] for q in tdp if {q['a'], q['b']} == {a, b} and (q.get('year') or 9999) <= y)
        rows.append((c['shadowRperMWyr'], f"| {a} to {b} | {c['bindingHours']:,} h, R{c['shadowRperMWyr'] / 1e6:.1f}m | {p.get('bindingHours', 0):,} h, R{p.get('shadowRperMWyr', 0) / 1e6:.1f}m | {X10.get(k, 0) / 1e3:.1f}; {X21.get(k, 0) / 1e3:.1f} | {(f'{X21P.get(k, 0) / 1e3:.1f}') if e21p else '-'} | {'; '.join(ls) if ls else 'none'} | {add:,} | {('ample' if X21P.get(k, 0) < 300 and p.get('bindingHours', 0) < 1000 else f'{X21P.get(k, 0) / 1e3:.1f} GW short') if e21p else ('ample' if p.get('bindingHours', 0) < 1000 else 'binding with the plan; the plan-plus-corridors case is weather 2025 only')} |"))
    for q in tdp:
        k = key(q['a'], q['b'])
        if k not in T and (q.get('year') or 9999) <= y and k not in [r[1].split('|')[1].strip() for r in rows]:
            p = P.get(k, {}); rows.append((p.get('shadowRperMWyr', 0), f"| {q['a']} to {q['b']} (no corridor today) | none | {p.get('bindingHours', 0):,} h, R{p.get('shadowRperMWyr', 0) / 1e6:.1f}m | - | {(f'{X21P.get(k, 0) / 1e3:.1f}') if e21p else '-'} | {'; '.join(lines_on(q['a'], q['b'], y))} | {sum(x['mw'] for x in tdp if {x['a'], x['b']} == {q['a'], q['b']} and (x.get('year') or 9999) <= y):,} | - |"))
    for v, r in sorted(rows, key=lambda x: -x[0]): print(r)
    if free:
        F = {key(c['a'], c['b']): c for c in free['corridors']}
        print(f"\nRanking by the value of one more MW, {y}, weather {wy}: approved-record siting against the LP's own siting (free siting; wind " + ', '.join(f"{k} {v:.0%}" for k, v in sorted(free['sitingChosen']['wind new'].items(), key=lambda x: -x[1]) if v > 0.02) + ')\n')
        print('| rank | approved-record siting (fixed build) | R m a year | the LP\'s siting (free siting) | R m a year |\n|---|---|---|---|---|')
        A = sorted(T.values(), key=lambda c: -c['shadowRperMWyr'])[:8]; B = sorted(F.values(), key=lambda c: -c['shadowRperMWyr'])[:8]
        for i in range(8): print(f"| {i + 1} | {A[i]['a']} to {A[i]['b']} | {A[i]['shadowRperMWyr'] / 1e6:.1f} | {B[i]['a']} to {B[i]['b']} | {B[i]['shadowRperMWyr'] / 1e6:.1f} |")
print('\nThe weather-2015 tables follow the 2025 ones where run; the plan-plus-corridors column (737\'s first cut) is weather 2025 only.')
