"""743 (c): the TDP's lines delivered at the industry's rate, competing for the same kilometres. The domestic planned lines of the model's line file
(tdp_planned_domestic.json: 125 features, 10,358 km, great-circle lengths of the drawn geometry; 18 inter-area features, 4,004 km) are built in
order from 2026 at 800 or 293 km a year; a line is in service the year its kilometres are fully funded. Orderings: (i) the TDP's own dates (the
TDP file's year for inter-area lines; within-area lines by their project's earliest TDP date where known, else after); (ii) the model's priority
ranking (inter-area lines ordered by the corridor's value of one more MW in the 2035 N-1 case on the rebuilt table, within-area lines after,
by date). Output: for each rate and ordering, the inter-area lines in service by 2030, 2032, 2035 and 2040 as TDP files (tdp_del_<rate>_<ord>.json,
each line's year replaced by its delivery year), and a table. usage: python3 delivery.py"""
import json, collections
S = '/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad/'
feats = json.load(open(S + 'tdp_planned_domestic.json')); tdp = json.load(open(S + 'tdp_lines_v2.json'))
key = lambda a, b: '|'.join(sorted((a, b)))
# map inter-area features to TDP lines by pair and voltage (one feature per line; Gamma to Grassridge has two of each)
def match(f):
    cands = [q for q in tdp if key(q['a'], q['b']) == key(f['a'], f['b']) and (q.get('kv') or 400) == f['kv']]
    return cands
val = {}
try:
    d = json.load(open(S + 'net_final_2035_wy2025_nm1_reea_l0_c0_v2.json'))
    for c in d['corridors']: val[key(c['a'], c['b'])] = c['shadowRperMWyr']
except FileNotFoundError: pass
items = []
used = set()
for f in sorted(feats, key=lambda f: -f['km']):
    if f['inter']:
        c = [q for q in match(f) if q['name'] not in used]
        q = c[0] if c else None
        if q: used.add(q['name'])
        items.append({'name': (q['name'] if q else f['label'] or f['ends']), 'km': f['km'], 'inter': True, 'a': f['a'], 'b': f['b'], 'kv': f['kv'], 'date': (q['year'] if q else 2034), 'mw': (q['mw'] if q else 900), 'value': val.get(key(f['a'], f['b']), 0.0), 'tdp': q})
    else:
        items.append({'name': f['label'] or f['ends'], 'km': f['km'], 'inter': False, 'date': 2034, 'value': 0.0})
unmatched = [q['name'] for q in tdp if q['name'] not in used]
print('TDP file lines with no planned feature in the line file (kept at their TDP dates, 0 km):', unmatched)
for q in tdp:
    if q['name'] not in used: items.append({'name': q['name'], 'km': 0.0, 'inter': True, 'a': q['a'], 'b': q['b'], 'kv': q.get('kv') or 400, 'date': q['year'], 'mw': q['mw'], 'value': val.get(key(q['a'], q['b']), 0.0), 'tdp': q})
def schedule(rate, order):
    seq = sorted(items, key=(lambda x: (x['date'], -x['inter'], -x['km'])) if order == 'dates' else (lambda x: (-x['value'] if x['inter'] else 1.0, x['date'], -x['km'])))
    year = 2026; budget = 0.0; out = []
    for it in seq:
        need = it['km']
        while need > budget + 1e-9:
            year += 1; budget += rate
            if year > 2100: break
        budget -= need; out.append(dict(it, delivered=year if it['km'] > 0 else it['date']))
    return out
print('| rate km a year | ordering | inter-area lines in service by 2030 (MW) | by 2032 | by 2035 | by 2040 | year the last domestic line is delivered |')
print('|---|---|---|---|---|---|---|')
for rate in (800, 293):
    for order in ('dates', 'priority'):
        out = schedule(rate, order)
        cells = []
        for y in (2030, 2032, 2035, 2040):
            ins = [o for o in out if o['inter'] and o['delivered'] <= y and o.get('tdp')]
            cells.append(f"{len(ins)} ({sum(o['mw'] for o in ins):,})")
        print(f"| {rate} | {order} | " + ' | '.join(cells) + f" | {max(o['delivered'] for o in out)} |")
        json.dump([dict(o['tdp'], year=max(o['delivered'], o['tdp']['year'])) for o in out if o['inter'] and o.get('tdp')], open(S + f'tdp_del_{rate}_{order}.json', 'w'), indent=1)
        print('    inter-area delivery years: ' + '; '.join(f"{o['name'].split(' (')[0]} {max(o['delivered'], o['tdp']['year'])}" for o in sorted([o for o in out if o['inter'] and o.get('tdp')], key=lambda o: o['delivered'])))
