# Provenance (19 Oct 2026, message 227 (2)): the script that wrote harness/pathway/irp2025/pathway_irp2025.json, run in the session's
# scratch area on c5f's frozen outputs (copied to the private gridtwin-data repository, branch claude/c5f-chain) with BASEGAP=0
# (message 218 (a)); its paths are the scratch area's. Kept so the build file can be recomputed, not hand-edited.
# Message 215 (3): IRP 2025's Table 1 build to 2040 as a pathway file for the engine check (no optimiser, no top-up).
# Starts from c5f's own pathway file (every c5f setting, demand, coal path and recorded settings) and replaces the build:
#  wind and utility solar: Table 1 by year (+ BASEGAP in 2026 if set: Table 1's base_end2025 less the model's 2026 base);
#  distributed generation: 900 MW a year, ROOF_FROM to 2035 (rooftop);  storage: s_be6_c5f's lithium MW and MWh by year;
#  gas: s_irpgas_c5f's CCGT and open-cycle LNG by year and its 51% floor record;  nuclear: s_be7_c5f's nuclearAdd;
#  pumped storage: 1,332 MW in 2037 at c5f's recorded PHES settings (14 h);  coal: c5f's Figure 3 50-year path, no early retirement.
import json, csv, os, sys
S = '/tmp/claude-0/-home-user/7f3311fb-be50-5c31-9fe8-354006007a62/scratchpad'; O = S + '/c5f/repo/harness/out'; R = S + '/c5f/repo'
BASEGAP = int(os.environ.get('BASEGAP', '1')); ROOF_FROM = int(os.environ.get('ROOF_FROM', '2027')); OTHER = os.environ.get('OTHER', 'omit')
Y = range(2026, 2041)
P = json.load(open(f'{O}/pathway_c5f.json')); be6 = json.load(open(f'{O}/pathway_s_be6_c5f.json')); irg = json.load(open(f'{O}/pathway_s_irpgas_c5f.json')); be7 = json.load(open(f'{O}/pathway_s_be7_c5f.json'))
rows = [r for r in csv.reader(l for l in open(R + '/public_data/irp2025_extract.csv') if not l.startswith('#'))]
H = rows[0]; T = {r[1]: r for r in rows[1:] if r and r[0] == 'table1'}
col = lambda y, k: float(T[str(y)][H.index(k)] or 0)
base = {k: float(T['base_end2025'][H.index(k)]) for k in ('wind', 'solar_pv')}
model = {'wind': 4681, 'solar_pv': 3271}          # FIXED.windMW, FIXED.pvUtilityMW at build 2026-10-17g (index.html)
gap = {k: max(0, base[k] - model[k]) for k in base} if BASEGAP else {'wind': 0, 'solar_pv': 0}
sched = {}
for y in Y:
    c, b6, ig = P['sched'][str(y)], be6['sched'][str(y)], irg['sched'][str(y)]
    s = {k: 0 for k in ('wind', 'pv', 'rooftop', 'batt', 'battMWh', 'vrfb', 'ironair', 'ccgt', 'off', 'phes', 'phel', 'ocgt', 'ocgd', 'earlyRetMW')}
    s['wind'] = col(y, 'wind') + (gap['wind'] if y == 2026 else 0)
    s['pv'] = col(y, 'solar_pv') + (gap['solar_pv'] if y == 2026 else 0) + (col(y, 'other_private') if OTHER == 'pv' else 0)
    s['rooftop'] = 900 if ROOF_FROM <= y <= 2035 else 0
    s['batt'], s['battMWh'] = b6.get('batt', 0), b6.get('battMWh', 0)
    s['ccgt'], s['ocgt'], s['ocgd'] = ig.get('ccgt', 0), ig.get('ocgt', 0), ig.get('ocgd', 0)
    s['phes'] = 1332 if y == 2037 else 0
    s['coalMW'] = c['coalMW'] + c.get('earlyRetMW', 0)   # the path itself, without any early retirement
    s['dslDecomMW'] = c.get('dslDecomMW', 0); s['cw'] = c.get('cw', 0); s['rp'] = {}
    sched[str(y)] = s
Q = dict(P); Q['sched'] = sched; Q['nuclearAdd'] = be7['nuclearAdd']; Q['gasFloor'] = irg['gasFloor']
Q['build'] = {}; Q['log'] = []; Q['objective'] = None; Q['verdict'] = 'IRP 2025 Table 1 build, fixed (message 215 (3)); engine check only'
Q['irpBuild'] = {'basegap': gap, 'roofFrom': ROOF_FROM, 'other': OTHER, 'from': 'c5f settings; s_be6_c5f storage; s_irpgas_c5f gas; s_be7_c5f nuclear'}
out = sys.argv[1] if len(sys.argv) > 1 else S + '/m215/pathway_irp2025.json'
json.dump(Q, open(out, 'w'), indent=1)
tot = lambda k: sum(sched[str(y)][k] for y in Y)
print('gap', gap, 'totals', {k: round(tot(k)) for k in ('wind', 'pv', 'rooftop', 'batt', 'battMWh', 'ccgt', 'ocgt', 'phes')}, 'nuclear', sum(be7['nuclearAdd'].values()))
print('coal 2026/2030/2035/2040', [round(sched[str(y)]['coalMW']) for y in (2026, 2030, 2035, 2040)], 'cw', tot('cw'))
