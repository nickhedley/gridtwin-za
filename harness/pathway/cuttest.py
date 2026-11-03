# Proportional build cuts, engine check only (user, 3 Nov 2026, message 666 (a)-(d)): a run's pathway file with its new builds scaled
# by (1 - f), no LP solve. Groups: all (new wind incl. offshore, utility solar, lithium power and energy, vanadium, iron-air, new pumped
# storage), re (wind, offshore and utility solar only), store (the storage only). Rooftop is an input, not an optimiser build, so it is
# not cut; grid-forming MW, VPP and geyser enrolment and the coal schedule stay as the run recorded them (ours, rule 366: only the
# optimiser's own energy builds are cut). Usage: python3 -I pathway/cuttest.py <pathway in> <group> <cut %> <pathway out>
import json, sys
fin, grp, pct, fout = sys.argv[1], sys.argv[2], float(sys.argv[3]), sys.argv[4]
K = {'re': ['wind', 'pv', 'off'], 'store': ['batt', 'battMWh', 'vrfb', 'ironair', 'phes', 'phel']}
K['all'] = K['re'] + K['store']
P = json.load(open(fin)); f = 1 - pct / 100
for y, s in P['sched'].items():
    for k in K[grp]:
        if s.get(k): s[k] = s[k] * f
    RP = {'off': 'offshore'}  # rp (repurposed MW, grid cost only) names offshore 'offshore'
    for k in K[grp]:
        t = RP.get(k, k)
        if s.get('rp', {}).get(t): s['rp'][t] = s['rp'][t] * f
P['cutTest'] = {'from': fin, 'group': grp, 'cutPct': pct, 'note': 'message 666: builds scaled, engine check only'}
json.dump(P, open(fout, 'w'))
