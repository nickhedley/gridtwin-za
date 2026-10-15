# Section 3 like-for-like on c5b_14r (message 116): every figure generated from the run outputs. Engine side from wk_<w>_eng.json
# (eng40_cost_x.py), optimum from roll_<w>_<setting>.json (sn_pypsa40_roll_x.py, NEUTRAL=all, 24 h rolling). With interruptible load
# off, the engine figure is engineFlatRm (its interruptible MWh taken off load on both sides, compensation excluded); with it on,
# engineFlatILRm (compensation included), set beside an optimum that may call it at drInterruptCostR.
# usage: WK=<week folder> RO=<PyPSA output folder> python3 table_14r.py
import json, os, statistics as st
WK, RO = os.environ.get('WK', 'w14r'), os.environ.get('RO', 'r14r')   # week files (with their _eng.json), PyPSA outputs
W = json.load(open(f'{WK}/weeks.json'))
SETS = ['off', 'res', 'mr', 'il', 'all']
LAB = dict(off='all off', res='reserve only', mr='must-run only', il='interruptible only', all='all on')
E = {w['name']: json.load(open(f"{WK}/wk_{w['name']}_eng.json")) for w in W}
R = {(w['name'], s): json.load(open(f"{RO}/roll_{w['name']}_{s}.json")) for w in W for s in SETS}
eng = lambda w, s: E[w]['engineFlatILRm'] if s in ('il', 'all') else E[w]['engineFlatRm']
gap = lambda w, s: (eng(w, s) / R[w, s]['objectiveRm'] - 1) * 100
named = ['base', 'may', 'nov', 'stress']
stress = [w['name'] for w in W if w['name'].startswith('s') and w['name'][1:].isdigit()]
desc = {w['name']: f"{w['y']}, weather {w['wy']}, hour {w['start']}" for w in W}
desc['base'] = '2026, default profiles, hour 3264'
out = []; P = out.append
# identical-week check: 'stress' is s14
for s in SETS: assert abs(R['stress', s]['objectiveRm'] - R['s14', s]['objectiveRm']) < 1e-6 * R['s14', s]['objectiveRm'], s
P('Table A. Engine cost above the optimum, %, by setting (named weeks)')
P('')
P('| Week | ' + ' | '.join(LAB[s] for s in SETS) + ' |'); P('|---|' + '---|' * len(SETS))
for w in named + ['stress14d']:
    P(f"| {w} ({desc[w]}) | " + ' | '.join(f"{gap(w, s):+.1f}" for s in SETS) + ' |')
P('')
P('Table B. 15 stress weeks: engine cost above the optimum, %, and shedding, GWh (engine / optimum)')
P('')
P('| Week | Engine shed | Gap off | Gap all on | Optimum shed off | Optimum shed all on | Engine reserve short GWh | Optimum reserve short GWh (all on) |'); P('|---|---|---|---|---|---|---|---|')
for w in stress:
    P(f"| {w} ({desc[w]}) | {E[w]['shedGWh']:.2f} | {gap(w,'off'):+.1f} | {gap(w,'all'):+.1f} | {R[w,'off']['shedGWh']:.2f} | {R[w,'all']['shedGWh']:.2f} | {E[w]['resShortGWh']:.2f} | {R[w,'all'].get('resShortGWh',0):.2f} |")
P('')
P('Summary by setting over the 15 stress weeks')
P('')
P('| Setting | Gap median, % | Gap range, % | Weeks the engine sheds | Weeks the optimum sheds | Engine shed GWh | Optimum shed GWh |'); P('|---|---|---|---|---|---|---|')
for s in SETS:
    g = [gap(w, s) for w in stress]
    P(f"| {LAB[s]} | {st.median(g):+.1f} | {min(g):+.1f} to {max(g):+.1f} | {sum(E[w]['shedGWh'] > 1e-3 for w in stress)} | {sum(R[w, s]['shedGWh'] > 1e-3 for w in stress)} | {sum(E[w]['shedGWh'] for w in stress):.1f} | {sum(R[w, s]['shedGWh'] for w in stress):.1f} |")
P('')
P('Named weeks, detail (R m): engine figure, optimum objective, reserve penalty reported apart, optimum diesel and interruptible GWh')
P('')
P('| Week | Setting | Engine | Optimum | Penalty | Optimum diesel GWh | Engine diesel GWh | Optimum interruptible GWh | Engine interruptible GWh | Optimum shed | Engine shed |'); P('|---|---|---|---|---|---|---|---|---|---|---|')
for w in named:
    for s in SETS:
        r = R[w, s]
        P(f"| {w} | {LAB[s]} | {eng(w,s):,.1f} | {r['objectiveRm']:,.1f} | {r['resPenaltyRm']:,.1f} | {r['dieselGWh'] + r.get('mustrunGWh',0):.2f} | {E[w]['dieselGWh']:.2f} | {r.get('interruptibleGWh',0):.2f} | {E[w]['drGWh']:.2f} | {r['shedGWh']:.2f} | {E[w]['shedGWh']:.2f} |")
# counts against the pass marks, the single-window check, energy by source (message 116)
P('')
for s in ('off', 'all'):
    P(f"Mark (1), within 5%, {LAB[s]}: named weeks over 5%: {[w for w in named if gap(w, s) > 5]}; stress weeks over 5%: {sum(gap(w, s) > 5 for w in stress)} of {len(stress)}")
O = {(w, s): json.load(open(f'{RO}/one/one_{w}_{s}.json')) for w, s in [('may','off'),('may','res'),('nov','off'),('nov','res'),('stress','off'),('stress','res'),('stress','il'),('stress','all')]}
P('')
P('Single 168-hour window (full-week sight), R m, against the rolling optimum')
P('')
P('| Week | Setting | Full-week optimum | Rolling optimum | Rolling above full week, % |'); P('|---|---|---|---|---|')
for (w, s), o in O.items():
    P(f"| {w} | {LAB[s]} | {o['objectiveRm']:,.1f} | {R[w, s]['objectiveRm']:,.1f} | {(R[w, s]['objectiveRm'] / o['objectiveRm'] - 1) * 100:+.1f} |")
P('')
P('Energy by source, GWh, engine / optimum all off / optimum all on')
P('')
ks = [('liDisGWh', 'Lithium discharge'), ('gasGWh', 'CCGT and open-cycle LNG'), ('dieselGWh', 'Diesel'), ('shedGWh', 'Shed')]
P('| Week | ' + ' | '.join(l for _, l in ks) + ' | Interruptible |'); P('|---|' + '---|' * (len(ks) + 1))
for w in ['s01', 's02', 's03', 'stress']:
    P(f"| {w} | " + ' | '.join(f"{E[w][k]:.1f} / {R[w,'off'][k]:.1f} / {R[w,'all'][k]:.1f}" for k, _ in ks) + f" | {E[w]['drGWh']:.1f} / – / {R[w,'all'].get('interruptibleGWh',0):.1f} |")
print('\n'.join(out))
