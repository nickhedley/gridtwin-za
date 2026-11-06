"""PyPSA network sensitivity of a national-engine run (message 717 (c)): ten GCCA supply areas, 8,760 hours, LP, storage
optimised, on the engine's own hourly run (an engine dump written by the patched pathcheck, sc/engine_dump_page.js).

usage: pypsa_net.py <engine dump json> <worktree root> <case> <siting> <out json> [losses 0|1] [coalmin 0|1] [mipgap]
  case:   nolimit | n0 | n1 | n1tdp (n0: today's limits as drawn; n1: 0.7 x today's corridor limits; n1tdp: plus TDP lines joining two areas, by TDP year)
  siting: reea | fleet              (new wind and solar by approved REEA records per area, or by the existing fleet's shares)
  losses: 1 adds linear losses of 6% per 1,000 km on each corridor (PyPSA-RSA config.yaml), as two one-way links
  coalmin: 1 imposes the engine's own hourly coal commitment x the design minimum stable level as a floor (a sensitivity); 2 fixes coal to the engine's hourly output
"""
import sys, os, json, re, csv, time
import numpy as np, pandas as pd, pypsa
import resource
T_START = time.time()

DUMP, ROOT, CASE, SITING, OUT = sys.argv[1:6]
LOSSES = int(sys.argv[6]) if len(sys.argv) > 6 else 0
COALMIN = int(sys.argv[7]) if len(sys.argv) > 7 else 0
FACTOR = {'nolimit': None, 'n0': 1.0, 'f085': 0.85, 'n1': 0.7, 'n1tdp': 0.7, 'f085tdp': 0.85, 'n0tdp': 1.0, 'n1c': 1.0, 'n1ctdp': 1.0, 'nm1': 1.0, 'nm1tdp': 1.0, 'thermal': 1.0, 'thermaltdp': 1.0}[CASE]   # the N-1 factor on today's limits (and on TDP lines); nm1/thermal (738): the rebuilt table, N-1 once / limits only
CORR_FILE = os.environ.get('CORR_FILE', '')            # (738 a) the rebuilt corridor table (corridors_v2.json from build_corridors.py); required for the nm1 and thermal cases
if CASE.startswith(('nm1', 'thermal')) and not CORR_FILE: sys.exit('CORR_FILE must name the rebuilt corridor table for the nm1 and thermal cases')
N1C = CASE.startswith('n1c')   # N-1 by dropping one circuit per corridor, (n-1)/n from the circuit counts (single circuit: 0.7, as PyPSA-RSA)
_here = os.path.dirname(os.path.abspath(__file__)); S_COUNTS = next((c for c in (os.path.join(_here, 'corridor_circuit_counts.json'), os.path.join(_here, '..', 'corridor_circuit_counts.json')) if os.path.exists(c)), os.path.join(_here, 'corridor_circuit_counts.json'))   # beside the script (the committed layout) or one level up (the scratch layout); counts only, from nodal/corridor_electrical.json (no rating)
COUNTS = json.load(open(os.environ.get('CIRCUITS', S_COUNTS))) if N1C else {}
TDP_ON = CASE.endswith('tdp')
TX_EXT = float(os.environ.get('TX_EXT', '0'))        # (d) corridors extendable at this R per MW-km (0: fixed)
DISC = float(os.environ.get('DISC', '0.055')); TX_LIFE = 40; CRF = DISC / (1 - (1 + DISC) ** -TX_LIFE) if DISC > 0 else 1 / TX_LIFE
SITE_FREE = int(os.environ.get('SITE_FREE', '0'))     # (e) new wind and solar shares chosen by the LP, capped by each area's approved MW
DEMAND_SPLIT = os.environ.get('DEMAND_SPLIT', 'file') # (g) 'file': the regional demand file's hourly shares; 'bld': BLD_LOAD_SHARE
KOEBERG_OUT = os.environ.get('KOEBERG_OUT', '')       # (a) 'd1:d2,d3:d4' day-of-year windows with one 930 MW unit out; the engine's annual energy kept
CAP_AS_IS = os.environ.get('CAP_AS_IS', '') == '1'      # (753 c) with CORR_FILE: take each corridor's circuit-rating sum as its limit as it stands (the file already carries N-1 limits)
TDP_FILE = os.environ.get('TDP_FILE', '')              # (c) a JSON list of extra inter-area lines [{a,b,mw,year,name}] (the full TDP mapping)
MIX = int(os.environ.get('MIX', '0'))                  # (f) new wind, solar, lithium (power and energy) and open-cycle gas extendable by area at the build's own costs
MIX_CAP = os.environ.get('MIX_CAP', '')                # (f) national caps 'wind:MW,pv:MW,batt:MW' (cumulative build-rate limits), optional
MIX_NAT = int(os.environ.get('MIX_NAT', '0'))          # (727 a) 1: every area's new wind and solar on the engine's national series (with no limits, one bus)
MIX_NOCAP = int(os.environ.get('MIX_NOCAP', '0'))      # (727 a) 1: the per-area approved-capacity caps on new wind and solar lifted
BATT_FREE = int(os.environ.get('BATT_FREE', '0'))        # (743 a) 1: lithium extendable by area (power and energy) at the build's own lithium costs, with the build's wind, solar and gas fixed; the LP chooses battery sites and sizes
BATT_ADD = os.environ.get('BATT_ADD', '')               # (731) lithium added to the fixed build, 'area:MW,area:MW', at BATT_ADD_H hours, costed at the build's own lithium costs
BATT_ADD_H = float(os.environ.get('BATT_ADD_H', '4'))
TX_BUDGET = float(os.environ.get('TX_BUDGET', '0'))     # (731) with TX_EXT: a cap on the corridor additions' annual cost, R a year (the same value as a lithium step)
TX_KM_BUDGET = float(os.environ.get('TX_KM_BUDGET', '0'))   # (739 c) with TX_EXT: a cap on the corridor additions in km of line, each corridor's MW converted to circuits at the St Clair rating of TX_KM_KV at its length
TX_KM_KV = int(os.environ.get('TX_KM_KV', '765'))
ST_THERMAL = {765: 3000.0, 400: 1400.0}; ST_SIL = {765: 2280.0, 400: 602.0}
def circuit_rating(kv, km): return min(ST_THERMAL[kv], ST_SIL[kv] * 53.736 * max(km, 1.0) ** -0.65)   # one circuit's rating as build_corridors.py rates it
GAS_INTEG = int(os.environ.get('GAS_INTEG', '0'))        # (738 d) 1: new open cycle pays the integration charge too, as the run's LP charges it
WIND_CAPE_MW = float(os.environ.get('WIND_CAPE_MW', '0'))   # (738 d) the run's Cape wind allowance: this much new wind pays no integration charge
PV_CREDIT_MW = float(os.environ.get('PV_CREDIT_MW', '0'))   # (732) the freed-coal connection credit in the free mix: new solar up to this MW nationally pays no integration charge (the pathway rule: solar may, wind may not)
MIX_MIN = os.environ.get('MIX_MIN', '')                 # (6 Nov 2026) national floors on the free mix, e.g. batt:56017,battE:480000: the build's own storage held, its siting free
MIX_INTEG = int(os.environ.get('MIX_INTEG', '1'))      # (f) 1 keeps the integration charge on new wind and solar; 0 removes it (corridors priced explicitly)
SOLVER = os.environ.get('SOLVER', 'simplex')             # 'simplex' (HiGHS dual simplex, the default for every case) or 'ipm' (interior point, crossover off: a timing test only)
HSTEP = int(os.environ.get('HSTEP', '1'))             # (f) solve on blocks of HSTEP hours (block means of every series, each weighted HSTEP): the whole year's chronology kept at coarser steps; energies scaled back to the year
DAYS = int(os.environ.get('DAYS', '0'))               # (722 b) timing only: solve on this many evenly spaced calendar days, each hour weighted 8760/(24 x DAYS); energies then are the sample's
H = 8760
REG = ['Eastern Cape','Limpopo','Mpumalanga','Gauteng','Western Cape','Northern Cape','Hydra Central','Kwazulu Natal','North West','Free State']
D = json.load(open(DUMP)); p = D['p']; s = D['state']; hh = D['hourly']; st = hh['stack']; pu = hh['pu']; WY = str(D['weatherYear']); Y = int(s['scenarioYear'])
A = lambda a: np.array(a, dtype=float)
notes = []

# ---------------------------------------------------------------- regional data at the worktree's build
def jload(f): return json.load(open(os.path.join(ROOT, f)))
eng_src = open(os.path.join(ROOT, 'nodal/nodal_engine.js')).read()
CORR = [(a, b, float(l), float(km)) for a, b, l, km in re.findall(r"\['([^']+)','([^']+)',\s*(\d+),\s*(\d+)\]", re.search(r"const CORRIDORS = \[(.*?)\];", eng_src, re.S).group(1))]
cap = jload('nodal/regional_renewable_capacity.json'); roofmw = jload('nodal/rooftop_mw_by_region.json')
priv = cap.get('by_source', {}).get('private', {}).get('solar_mw', {})
roof_r = {r: max(0.0, roofmw[r] - priv.get(r, 0)) for r in REG}                  # the loader's private-solar subtraction
mm = jload('nodal/profiles_regional_multiyear.json'); SC = mm['scale']
wpu = {r: A(mm['wind_pu'][r][WY]) / SC for r in REG}; spu = {r: A(mm['solar_pu'][r][WY]) / SC for r in REG}
wmap = jload('nodal/profiles_wind_modern_map.json')['regional_map']; tmap = A(jload('nodal/profiles_solar_tracking_map.json')['map'])
demrows = [r for r in csv.DictReader(l for l in open(os.path.join(ROOT, 'nodal/demand_2025_regional.csv')) if not l.startswith('#'))]
dreg = {r: A([float(x[r + '_corrected']) for x in demrows]) for r in REG}; dtot = sum(dreg.values()); share = {r: dreg[r] / dtot for r in REG}
if DEMAND_SPLIT == 'bld':
    BLS = json.loads(re.sub(r"'", '"', re.search(r"const BLD_LOAD_SHARE = (\{.*?\});", open(os.path.join(ROOT, 'index.html')).read(), re.S).group(1)))
    share = {r: np.full(H, BLS[r]) for r in REG}; notes.append('demand split by BLD_LOAD_SHARE (static shares), not the regional demand file')
subs = {x['n']: x.get('area') for x in jload('nodal/substations_compact.json')['subs']}
AREA_MAP = os.environ.get('AREA_MAP', '')   # (756 b) one rule: every substation (and so every approved record sited by its nearest substation) takes its area from the fleet file's boundary set (area_map_v3.json)
if AREA_MAP:
    subs = {k: v['rule'] for k, v in json.load(open(AREA_MAP))['subs'].items()}; notes.append(f'area rule: substations and approved-record siting by {os.path.basename(AREA_MAP)} (756 b)')
uc = json.loads(re.search(r"const UC_FLEET = (\[.*?\]);", open(os.path.join(ROOT, 'index.html')).read()).group(1))
# month and hour of day for the tracking map
hod = np.arange(H) % 24; mdays = [31,28,31,30,31,30,31,31,30,31,30,31]; mon = np.concatenate([np.full(d * 24, i) for i, d in enumerate(mdays)])

# ---------------------------------------------------------------- siting of new wind and solar
def reea_shares():
    GEN = re.compile(r'wind|solar|csp|hydro', re.I)
    NOT = [re.compile(r'\b(gas|coal)[- ](fired|power|turbines?|to power)\b|\blpg\b|\blng\b|thabametsi', re.I),
           re.compile(r'^\s*(the\s+)?(proposed\s+)?(development\s+of\s+|construction\s+of\s+)?(the\s+|a\s+|an\s+)?(\d+\s*kv\s+)?(overhead\s+)?(power\s*lines?|grid\s+connection|transmission\s+lines?|distribution\s+lines?|switching\s+station|substation)\b', re.I),
           re.compile(r'^\s*(the\s+)?(proposed\s+)?(construction\s+and\s+operation\s+of\s+)?(the\s+)?battery energy storage', re.I)]
    seen = set(); out = {'wind': {r: 0.0 for r in REG}, 'solar': {r: 0.0 for r in REG}}
    for q in jload('nodal/reea_projects.json')['projects']:
        if q.get('status') != 'Approved' or not GEN.search(q.get('tech') or '') or not (isinstance(q.get('mw'), (int, float)) and q['mw'] > 0) or any(x.search(q.get('name') or '') for x in NOT): continue
        k = '|'.join(str(q.get(z)) for z in ('name', 'mw', 'decided', 'lat', 'lng'))
        if k in seen: continue
        seen.add(k); a = subs.get(q.get('sub'))
        if a not in out['wind']: continue
        if q['tech'] == 'Wind': out['wind'][a] += q['mw']
        elif q['tech'] == 'Solar PV': out['solar'][a] += q['mw']
    global REEA_MW; REEA_MW = {t: dict(out[t]) for t in out}
    for t in out:
        T = sum(out[t].values()); out[t] = {r: v / T for r, v in out[t].items()}
    return out
REEA_MW = None
def fleet_shares():
    out = {}
    for t, key in (('wind', 'wind_mw'), ('solar', 'solar_mw')):
        T = sum(cap[key][r] for r in REG); out[t] = {r: cap[key][r] / T for r in REG}
    return out
site = reea_shares() if SITING == 'reea' else fleet_shares()

# ---------------------------------------------------------------- national series the engine used
loadS, chPs, chBt, dr = A(hh['loadS']), A(hh['chargePs']), A(hh['chargeBatt']), A(hh['drMW']) if hh.get('drMW') else np.zeros(H)
roofpu = A(pu['roof']) if pu.get('roof') else A(pu['solar'])
roofCap = p['rooftopMW'] + s['newRooftopMW']; roofGen = roofCap * roofpu * p['rooftopDerate']
gridLoad = loadS - chPs - chBt + dr                 # what the engine served from the grid (demand after growth, block, rooftop netting and exports)
grossLoad = gridLoad + roofGen
wind_pu, windMod = A(pu['wind']), A(pu['windMod']) if pu.get('windMod') else None
solar_pu, solarTrk, solarX = A(pu['solar']), A(pu['solarTrk']) if pu.get('solarTrk') else None, A(pu['solarX']) if pu.get('solarX') else None
k, xs = p['kW'], p['xs']
E_w, N_w, E_p, N_p = p['windMW'], s['newWindMW'], p['pvUtilityMW'], s['newPvMW']
nat_avail = {'wind_ex': E_w * wind_pu, 'wind_new': N_w * (np.minimum(1, k * windMod) if (windMod is not None and N_w > 0) else wind_pu),
             'pv_ex': E_p * ((1 - xs) * solar_pu + xs * (solarX if solarX is not None else solar_pu)), 'pv_new': N_p * (solarTrk if solarTrk is not None else solar_pu)}

# ---------------------------------------------------------------- regional series scaled to the national totals
def scaled(tech, capby, pu_by, target):
    tot = sum(capby[r] * pu_by[r].sum() for r in REG)
    f = target / tot if tot > 0 else 1.0
    series = {r: np.minimum(1.0, f * pu_by[r]) for r in REG}
    got = sum(capby[r] * series[r].sum() for r in REG)
    notes.append(f'{tech}: regional series scaled by {f:.4f}; clipping at 1 loses {(target - got) / 1e6:.4f} TWh of {target / 1e6:.3f}')
    return series
cap_wex = {r: cap['wind_mw'][r] for r in REG}; cap_wnew = {r: N_w * site['wind'][r] for r in REG}
cap_pex = {r: cap['solar_mw'][r] for r in REG}; cap_pnew = {r: N_p * site['solar'][r] for r in REG}
wmod_r = {r: np.minimum(1.0, k * A(wmap[r])[np.minimum(49, np.floor(np.minimum(1, wpu[r]) * 50).astype(int))]) for r in REG}   # the regional LP's modern-turbine map, times the correction
trk_r = {r: spu[r] * tmap[mon, hod] for r in REG}                                                                            # the national tracking ratio by month and hour on the regional fixed-tilt series
ser_wex = scaled('existing wind', cap_wex, wpu, nat_avail['wind_ex'].sum())
ser_wnew = scaled('new wind', cap_wnew, wmod_r, nat_avail['wind_new'].sum()) if N_w > 0 else {r: wpu[r] for r in REG}
ser_pex = scaled('existing solar', cap_pex, spu, nat_avail['pv_ex'].sum())
ser_pnew = scaled('new solar', cap_pnew, trk_r, nat_avail['pv_new'].sum()) if N_p > 0 else {r: spu[r] for r in REG}
if MIX_NAT:
    if N_w > 0: ser_wnew = {r: nat_avail['wind_new'] / N_w for r in REG}
    if N_p > 0: ser_pnew = {r: nat_avail['pv_new'] / N_p for r in REG}
    notes.append("one bus: every area's new wind and solar on the engine's national series (the regional series unused)")
if MIX_NOCAP: notes.append('area caps lifted: new wind and solar per area unbounded')
roofT = sum(roof_r.values()); roof_cap_r = {r: roofCap * roof_r[r] / roofT for r in REG}
# offshore wind (Fossil-free and Deep builds): the seven ESMAP sites in equal shares, as the engine's national series is their mean scaled to ESMAP's 0.516
OFF_SITE = {'Boegoebaai West Coast': 'Northern Cape', 'Saldanha Bay West Coast': 'Western Cape', 'Cape Point West': 'Western Cape', 'Cape Point South': 'Western Cape', 'Coega West': 'Eastern Cape', 'Coega East': 'Eastern Cape', 'Durban Richards Bay': 'Kwazulu Natal'}
offCap = float(s.get('newOffshoreMW') or 0); ser_off = {}; ocap = {}
if offCap > 0 and pu.get('off'):
    om = jload('nodal/profiles_offshore_regional.json'); OSC = om['scale']
    opu = {q: A(om['wind_pu'][q][WY]) / OSC for q in OFF_SITE}; ocap = {q: offCap / len(OFF_SITE) for q in OFF_SITE}
    tot = sum(ocap[q] * opu[q].sum() for q in OFF_SITE); target = offCap * A(pu['off']).sum(); fo = target / tot if tot > 0 else 1.0
    ser_off = {q: np.minimum(1.0, fo * opu[q]) for q in OFF_SITE}
    got = sum(ocap[q] * ser_off[q].sum() for q in OFF_SITE)
    notes.append(f'offshore wind {offCap:,.0f} MW at the seven ESMAP sites in equal shares (Northern Cape 1, Western Cape 3, Eastern Cape 2, KwaZulu-Natal 1; an assumption), site series scaled by {fo:.4f} to the engine\'s availability; clipping at 1 loses {(target - got) / 1e6:.4f} TWh of {target / 1e6:.3f}')

# ---------------------------------------------------------------- coal by region, as the engine's standing fleet
coalRem = p['coalInstalledMW'] - s['coalDecomMW']
standing = [u for u in uc if (9999 if u['decom'] == 'beyond 2050' else int(u['decom'])) > Y]
MSL_DESIGN = {0.65: 0.57, 0.5: 0.52}   # the page's coalMslDesign from 2030 (index.html COAL_PRE_C: [share for the groups at 0.65, share for the groups at 0.50]); the LP's floor uses each area's capacity-weighted value (738 e)
MSL_R = {}
rawT = sum(u['cap'] for u in standing); coal_r = {r: (coalRem * sum(u['cap'] for u in standing if u['region'] == r) / rawT if rawT > 0 else 0.0) for r in REG}
for r in REG:
    cr = [u for u in standing if u['region'] == r]; MSL_R[r] = (sum(u['cap'] * MSL_DESIGN.get(round(u['msl'], 2), u['msl']) for u in cr) / sum(u['cap'] for u in cr)) if cr else 0.57
if COALMIN == 1: notes.append('commitment floor by area at the design minimum (0.57 for the 0.65 groups, 0.52 for the 0.50 groups): ' + ', '.join(f'{r} {MSL_R[r]:.3f}' for r in REG if MSL_R[r] and coal_r.get(r, 0) > 0))
coalAvail = A(hh['coalAvailable']); coal_pu = np.minimum(1.0, coalAvail / coalRem) if coalRem > 0 else np.zeros(H)
coalCommitted = A(hh['coalCommitted']) if hh.get('coalCommitted') else None
notes.append(f'coal: {coalRem:.0f} MW standing in {Y} from {len(standing)} UC_FLEET groups ({rawT:.0f} MW by date, scaled {(coalRem / rawT if rawT > 0 else 0):.3f}); hourly availability from the engine (mean {coalAvail.mean():.0f} MW)')
carbon = p['carbonTaxRPerT']
mc_coal = p['costCoal'] + p['vomCoal'] + carbon * p['emisCoal']
mc_ccgt = p['costCcgt'] + p['vomCcgt'] + carbon * p['emisCcgt']
OCK = 10624 / 3600 * 0.52   # the engine's _ocK: heatRateOcgtKJ / 3600 x effCcgtHHV (FIXED at build 2026-11-03a)
mc_ocgt = (p['costCcgt'] + carbon * p['emisCcgt']) * OCK + 80.19 * 1.068   # vomOcgt: FIXED 80.19 x CPI_JAN24_TO_JAN26
mc_dsl = p['costDiesel'] + p['vomDiesel'] + carbon * p['emisDiesel']
ccgtMW = (D['caps']['ccgtCap'] - s['newOcgtMW']); ocgtMW = s['newOcgtMW']; dslMW = D['dieselCap']   # the engine's dieselAvailMW: the fleet less dieselDecomMW plus newOcgdMW, both already inside dieselCap (before 5 Nov 2026 21:00 UTC newOcgdMW was added a second time)
dsl_site = {'Western Cape': 2072 / 3077, 'Kwazulu Natal': 670 / 3077, 'Eastern Cape': 335 / 3077}   # Ankerlig and Gourikwa, Avon, Dedisa (fleet_units.csv)
gas_bus = 'Kwazulu Natal'   # new gas at the Richards Bay LNG site (assumption, stated)

# ---------------------------------------------------------------- storage
ps_site = {'Kwazulu Natal': 2332 / 2900, 'Western Cape': 568 / 2900}   # the nodal engine's siting, scaled to the page's psPowerMW
battEx = {'Western Cape': 20.0, 'Kwazulu Natal': 48.0}; battExH = p['battHours']
newBatt = s['newBattMW']; newBattH = s['newBattHours']
batt_site = {'North West': 692 / 1744, 'Free State': 616 / 1744, 'Northern Cape': 436 / 1744} if SITING != 'reea_batt' else site['solar']

# ---------------------------------------------------------------- (f) the build's own costs, R per MW-year (the dump's costs block, R per kW-year x 1000)
CC = {}
if MIX or BATT_ADD or BATT_FREE:
    if MIX and REEA_MW is None: reea_shares()
    c = D['costs']; T = c['tech']; integ = (c['txRPerKWyr'] or 0) * (c['gridIntVreShare'] if c['gridIntVreShare'] is not None else 1)
    pvkey = 'pvtrk' if (solarTrk is not None and 'pvtrk' in T and 'error' not in T['pvtrk']) else 'pv'
    CC['wind'] = 1000 * (T['wind']['netAnnuity'] + (T['wind']['gridConn'] or 0) + (integ if MIX_INTEG else 0))
    CC['pv'] = 1000 * (T[pvkey]['netAnnuity'] + (T[pvkey]['gridConn'] or 0) + (integ if MIX_INTEG else 0))
    CC['batt'] = 1000 * (T['batt']['netAnnuity'] + (T['batt']['gridConn'] or 0))
    CC['battE'] = 1000 * c['battEnergyRkWhyr']
    CC['ocgt'] = 1000 * (T['ocgt']['netAnnuity'] + (T['ocgt']['gridConn'] or 0) + (integ if GAS_INTEG else 0))
    notes.append(f"mix costs, R per MW-year: wind {CC['wind']:,.0f} ({pvkey} {CC['pv']:,.0f}), lithium power {CC['batt']:,.0f} and energy {CC['battE']:,.0f} per MWh, open cycle {CC['ocgt']:,.0f}; integration charge {'kept' if MIX_INTEG else 'removed'} ({integ:.0f} R/kW-yr)")
# ---------------------------------------------------------------- the network
n = pypsa.Network(); n.set_snapshots(range(H))
for r in REG: n.add('Bus', r, carrier='AC')
# corridors
tdp = []
if TDP_ON and TDP_FILE:
    for q in json.load(open(TDP_FILE)):
        if (q.get('year') or 9999) <= Y: tdp.append((q['a'], q['b'], q['mw'], q['name'], q.get('year')))
elif TDP_ON:
    KVMW = {400: 900, 765: 3000, 275: 600}
    for q in jload('nodal/tdp_projects.json')['projects']:
        if q.get('kind') != 'line' or (q.get('year') or 9999) > Y: continue
        areas = sorted(set(a for a in (subs.get(z['n']) for z in q.get('pts', [])) if a))
        if len(areas) == 2: tdp.append((areas[0], areas[1], KVMW.get(q.get('kv'), 900), q['name'], q.get('year')))
corr = []
if CORR_FILE:
    V2 = json.load(open(CORR_FILE)); CAP_AS_IS and notes.append('corridor limits taken as the file states them (CAP_AS_IS), no N-1 applied here'); notes.append(f"corridor table: {os.path.basename(CORR_FILE)} ({V2['meta'].get('erosPlacement')}; {len(V2['corridors'])} corridors; N-1 applied once over existing circuits and TDP lines together)")
    CORR = [(v['a'], v['b'], v['n1MW'], v['kmMean']) for v in V2['corridors'].values()]
    V2R = {(v['a'], v['b']): [c['ratingMW'] for c in v['circuits']] for v in V2['corridors'].values()}
for a, b, lim, km in CORR:
    add = sum(mw for x, y2, mw, nm, yr in tdp if {x, y2} == {a, b})
    if CORR_FILE:
        allc = V2R[(a, b)] + [mw for x, y2, mw, nm, yr in tdp if {x, y2} == {a, b}]; tot = sum(allc)
        if FACTOR is None: cap_ab = 1e6
        elif CASE.startswith('thermal') or CAP_AS_IS: cap_ab = tot   # (753 c) CAP_AS_IS: the file's circuit ratings are the corridor limits as they stand (a published N-1 table), no further N-1
        else: cap_ab = (tot - max(allc)) if len(allc) > 1 else 0.7 * tot
        corr.append((a, b, cap_ab, km, lim, add)); continue
    if FACTOR is None: cap_ab = 1e6
    elif N1C:
        nc = COUNTS.get(a + '|' + b, COUNTS.get(b + '|' + a, 1)); fac = (nc - 1) / nc if nc > 1 else 0.7
        cap_ab = fac * lim + 0.7 * add   # TDP additions as single new circuits at 0.7
    else: cap_ab = FACTOR * (lim + add)
    corr.append((a, b, cap_ab, km, lim, add))
extra = {}
for x, y2, mw, nm, yr in tdp:
    if not any({x, y2} == {a, b} for a, b, *_ in CORR): extra[(x, y2)] = extra.get((x, y2), 0) + mw
for (x, y2), mw in extra.items(): corr.append((x, y2, (0.7 if (N1C or CASE.startswith('nm1')) else (FACTOR or 1.0)) * mw, 300.0, 0.0, mw)); notes.append(f'TDP lines join {x} and {y2}, a pair with no corridor today: added at {FACTOR or 1.0} x {mw} MW, 300 km')
for i, (a, b, cap_ab, km, lim, add) in enumerate(corr):
    # v2 (6 Nov 2026): every corridor is a pair of one-way links, so the R0.01 per MWh tie-breaking cost is paid in both directions and
    # can never be earned (a bidirectional link with p_min_pu = -1 pays marginal_cost x p0, negative for reverse flow, which with
    # unlimited capacity rewarded circulating flow round every loop and lowered the no-limits objective by about R0.6bn). When
    # extendable, the forward link carries the capital cost and the reverse link is tied to it by a constraint below.
    TX_ON = TX_EXT > 0 and FACTOR is not None
    ext_ab = dict(p_nom_extendable=True, p_nom_min=cap_ab, capital_cost=TX_EXT * km * CRF) if TX_ON else {}
    ext_ba = dict(p_nom_extendable=True, p_nom_min=cap_ab, capital_cost=0.0) if TX_ON else {}
    eff = 1 - 0.06 * km / 1000 if LOSSES else 1.0
    n.add('Link', f'c{i}_ab', bus0=a, bus1=b, p_nom=cap_ab, efficiency=eff, marginal_cost=0.01, carrier='corridor', **ext_ab)
    n.add('Link', f'c{i}_ba', bus0=b, bus1=a, p_nom=cap_ab, efficiency=eff, marginal_cost=0.01, carrier='corridor', **ext_ba)
if TX_EXT > 0: notes.append(f'corridors extendable at R{TX_EXT:,.0f} per MW-km, {TX_LIFE} years at {DISC:.3f} (CRF {CRF:.4f})')
# loads: gross national load split by the regional demand file's hourly shares; rooftop as a must-run generator per area
for r in REG:
    n.add('Load', f'{r} load', bus=r, p_set=grossLoad * share[r])
    n.add('Generator', f'{r} rooftop', bus=r, p_nom=max(1e-6, roof_cap_r[r]), p_max_pu=roofpu * p['rooftopDerate'], p_min_pu=roofpu * p['rooftopDerate'], marginal_cost=0, carrier='rooftop')
    if cap_wex[r] > 0: n.add('Generator', f'{r} wind ex', bus=r, p_nom=cap_wex[r], p_max_pu=ser_wex[r], marginal_cost=0, carrier='wind')
    if MIX and N_w > 0: n.add('Generator', f'{r} wind new', bus=r, p_nom=0.0, p_nom_extendable=True, p_nom_max=1e5 if MIX_NOCAP else (max(0.0, REEA_MW['wind'].get(r, 0.0)) if REEA_MW else 1e5), p_max_pu=ser_wnew[r], marginal_cost=0, capital_cost=CC['wind'], carrier='wind')
    if MIX and N_w > 0 and WIND_CAPE_MW > 0 and r == 'Western Cape': n.add('Generator', f'{r} wind new cape', bus=r, p_nom=0.0, p_nom_extendable=True, p_nom_max=WIND_CAPE_MW, p_max_pu=ser_wnew[r], marginal_cost=0, capital_cost=CC['wind'] - integ * 1000, carrier='wind')
    elif SITE_FREE and N_w > 0: n.add('Generator', f'{r} wind new', bus=r, p_nom=0.0, p_nom_extendable=True, p_nom_max=max(0.0, REEA_MW['wind'].get(r, 0.0)) if REEA_MW else N_w, p_max_pu=ser_wnew[r], marginal_cost=0, capital_cost=0, carrier='wind')
    elif cap_wnew[r] > 0: n.add('Generator', f'{r} wind new', bus=r, p_nom=cap_wnew[r], p_max_pu=ser_wnew[r], marginal_cost=0, carrier='wind')
    if cap_pex[r] > 0: n.add('Generator', f'{r} pv ex', bus=r, p_nom=cap_pex[r], p_max_pu=ser_pex[r], marginal_cost=0, carrier='pv')
    if MIX and N_p > 0: n.add('Generator', f'{r} pv new', bus=r, p_nom=0.0, p_nom_extendable=True, p_nom_max=1e5 if MIX_NOCAP else (max(0.0, REEA_MW['solar'].get(r, 0.0)) if REEA_MW else 1e5), p_max_pu=ser_pnew[r], marginal_cost=0, capital_cost=CC['pv'], carrier='pv')
    if MIX and N_p > 0 and PV_CREDIT_MW > 0: n.add('Generator', f'{r} pv new credit', bus=r, p_nom=0.0, p_nom_extendable=True, p_nom_max=1e5 if MIX_NOCAP else (max(0.0, REEA_MW['solar'].get(r, 0.0)) if REEA_MW else 1e5), p_max_pu=ser_pnew[r], marginal_cost=0, capital_cost=CC['pv'] - integ * 1000, carrier='pv')
    elif SITE_FREE and N_p > 0: n.add('Generator', f'{r} pv new', bus=r, p_nom=0.0, p_nom_extendable=True, p_nom_max=max(0.0, REEA_MW['solar'].get(r, 0.0)) if REEA_MW else N_p, p_max_pu=ser_pnew[r], marginal_cost=0, capital_cost=0, carrier='pv')
    if MIX:   # lithium as a store with its own charge and discharge links, so power and energy are priced apart as the build LP prices them
        n.add('Bus', f'{r} li bus', carrier='li')
        n.add('Store', f'{r} li store', bus=f'{r} li bus', e_nom=0.0, e_nom_extendable=True, e_cyclic=True, capital_cost=CC['battE'], carrier='li')
        n.add('Link', f'{r} li charge', bus0=r, bus1=f'{r} li bus', p_nom=0.0, p_nom_extendable=True, efficiency=p['battEff'], capital_cost=CC['batt'], carrier='li')
        n.add('Link', f'{r} li discharge', bus0=f'{r} li bus', bus1=r, p_nom=0.0, p_nom_extendable=True, efficiency=1.0, capital_cost=0, carrier='li')
        n.add('Generator', f'{r} ocgt new', bus=r, p_nom=0.0, p_nom_extendable=True, marginal_cost=mc_ocgt, capital_cost=CC['ocgt'], carrier='ocgt')
    elif cap_pnew[r] > 0: n.add('Generator', f'{r} pv new', bus=r, p_nom=cap_pnew[r], p_max_pu=ser_pnew[r], marginal_cost=0, carrier='pv')
    if BATT_FREE and not MIX:
        n.add('Bus', f'{r} li bus', carrier='li')
        n.add('Store', f'{r} li store', bus=f'{r} li bus', e_nom=0.0, e_nom_extendable=True, e_cyclic=True, capital_cost=CC['battE'], carrier='li')
        n.add('Link', f'{r} li charge', bus0=r, bus1=f'{r} li bus', p_nom=0.0, p_nom_extendable=True, efficiency=p['battEff'], capital_cost=CC['batt'], carrier='li')
        n.add('Link', f'{r} li discharge', bus0=f'{r} li bus', bus1=r, p_nom=0.0, p_nom_extendable=True, efficiency=1.0, capital_cost=0, carrier='li')
    if coal_r[r] > 0:
        kw = dict(p_max_pu=coal_pu)
        if COALMIN == 1 and coalCommitted is not None: kw['p_min_pu'] = np.minimum(coal_pu, MSL_R[r] * coalCommitted / coalRem)
        if COALMIN == 2:   # the engine's own hourly coal output, fixed (the tie-out's decomposition)
            cs = np.minimum(coal_pu, A(st['coal']) / coalRem); kw['p_max_pu'] = cs; kw['p_min_pu'] = cs
        n.add('Generator', f'{r} coal', bus=r, p_nom=coal_r[r], marginal_cost=mc_coal, carrier='coal', **kw)
    n.add('Generator', f'{r} unserved', bus=r, p_nom=1e5, marginal_cost=p['voll'], carrier='unserved')
    if r in dsl_site: n.add('Generator', f'{r} diesel', bus=r, p_nom=dslMW * dsl_site[r], marginal_cost=mc_dsl, carrier='diesel')
# must-run plant as the engine dispatched it
def mustrun(name, bus, series, carrier):
    pn = max(1.0, float(np.max(series))); n.add('Generator', name, bus=bus, p_nom=pn, p_max_pu=series / pn, p_min_pu=series / pn, marginal_cost=0, carrier=carrier)
nuc = A(st['nuclear'])
if KOEBERG_OUT:
    avail = np.full(H, 2.0)
    for win in KOEBERG_OUT.split(','):
        d1, d2 = [int(x) for x in win.split(':')]; avail[(d1 - 1) * 24:d2 * 24] -= 1.0
    cal = 930.0 * np.maximum(0.0, avail); notes.append(f'Koeberg on a calendar at 930 MW a unit, a unit out on days {KOEBERG_OUT}: {cal.sum() / 1e6:.2f} TWh against the engine\'s flat {nuc.sum() / 1e6:.2f} TWh'); nuc = cal
mustrun('Koeberg', 'Western Cape', nuc, 'nuclear')
mustrun('hydro', 'Hydra Central', A(st['hydro']), 'hydro')
if st.get('hybrid'): mustrun('hybrid', 'Northern Cape', A(st['hybrid']), 'hybrid')
if st.get('imports') and np.sum(st['imports']) > 0: mustrun('imports', 'Gauteng', A(st['imports']), 'imports')
n.add('Generator', 'CSP', bus='Northern Cape', p_nom=p['cspMW'], p_max_pu=A(pu['csp']), p_min_pu=A(pu['csp']), marginal_cost=0, carrier='csp')
if ccgtMW > 0: n.add('Generator', 'CCGT', bus=gas_bus, p_nom=ccgtMW, marginal_cost=mc_ccgt, carrier='ccgt')
if ocgtMW > 0 and not MIX: n.add('Generator', 'OCGT', bus=gas_bus, p_nom=ocgtMW, marginal_cost=mc_ocgt, carrier='ocgt')
for q, r in OFF_SITE.items():
    if ser_off: n.add('Generator', f'{r} offshore {q}', bus=r, p_nom=ocap[q], p_max_pu=ser_off[q], marginal_cost=0, carrier='offshore')
for r, f in ps_site.items():
    n.add('StorageUnit', f'{r} pumped storage', bus=r, p_nom=p['psPowerMW'] * f, max_hours=p['psEnergyMWh'] / p['psPowerMW'], efficiency_store=p['psEff'], efficiency_dispatch=1.0, cyclic_state_of_charge=True, carrier='ps')
for r, mw in battEx.items():
    n.add('StorageUnit', f'{r} battery ex', bus=r, p_nom=mw, max_hours=battExH, efficiency_store=p['battEff'], efficiency_dispatch=1.0, cyclic_state_of_charge=True, carrier='batt')
for r, f in batt_site.items():
    if newBatt > 0 and not MIX: n.add('StorageUnit', f'{r} battery new', bus=r, p_nom=newBatt * f, max_hours=newBattH, efficiency_store=p['battEff'], efficiency_dispatch=1.0, cyclic_state_of_charge=True, carrier='batt')
# long-duration stores and new pumped storage (Fossil-free and Deep builds); hours and efficiencies are FIXED at build 2026-11-03a
for nm, mw, hrs, eff, car in (('vrfb', float(s.get('newVrfbMW') or 0), 8, 0.75, 'vrfb'), ('iron-air', float(s.get('newIronAirMW') or 0), 100, 0.45, 'fe')):
    if mw > 0:
        for r, fr in batt_site.items(): n.add('StorageUnit', f'{r} {nm}', bus=r, p_nom=mw * fr, max_hours=hrs, efficiency_store=eff, efficiency_dispatch=1.0, cyclic_state_of_charge=True, carrier=car)
        notes.append(f'{nm} {mw:,.0f} MW at {hrs} h, round trip {eff}, sited by the BESIPPPP shares (an assumption)')
battFree = None
battAdded = None
if BATT_ADD:
    add = {k: float(v) for k, v in (kv.split(':') for kv in BATT_ADD.split(','))}
    for r, mw in add.items(): n.add('StorageUnit', f'{r} battery added', bus=r, p_nom=mw, max_hours=BATT_ADD_H, efficiency_store=p['battEff'], efficiency_dispatch=1.0, cyclic_state_of_charge=True, carrier='batt')
    battAdded = {'byAreaMW': add, 'MW': sum(add.values()), 'hours': BATT_ADD_H, 'MWh': sum(add.values()) * BATT_ADD_H, 'annualRbn': (sum(add.values()) * CC['batt'] + sum(add.values()) * BATT_ADD_H * CC['battE']) / 1e9}
    notes.append(f"lithium added to the build: {battAdded['MW']:,.0f} MW at {BATT_ADD_H:g} h ({', '.join(f'{k} {v:,.0f}' for k, v in add.items())}), R{battAdded['annualRbn']:.2f}bn a year at the build's lithium costs")
newPs = float(s.get('newPsMW') or 0)
if newPs > 0:
    n.add('StorageUnit', 'Limpopo pumped storage new', bus='Limpopo', p_nom=newPs, max_hours=float(s.get('newPsHours') or 14), efficiency_store=0.78, efficiency_dispatch=1.0, cyclic_state_of_charge=True, carrier='ps')
    notes.append(f'new pumped storage {newPs:,.0f} MW at {s.get("newPsHours") or 14} h, round trip 0.78, placed in Limpopo (the Tubatse site; an assumption)')
W = 1.0   # hours per snapshot in the energy sums
if HSTEP > 1:
    nb = H // HSTEP; blk = np.repeat(np.arange(nb), HSTEP)
    agg = {}
    for comp in ('generators', 'loads', 'storage_units', 'links', 'stores', 'buses'):
        pnl = getattr(n, comp + '_t')
        for attr in list(pnl.keys()):
            df = pnl[attr]
            if df.shape[1] == 0: continue
            agg[(comp, attr)] = df.iloc[:nb * HSTEP].groupby(blk).mean()
    n.set_snapshots(range(nb))
    for (comp, attr), df in agg.items():
        df.index = n.snapshots; getattr(n, comp + '_t')[attr] = df
    n.snapshot_weightings = pd.Series(float(HSTEP), index=n.snapshots); W = float(HSTEP)
    notes.append(f'time blocks of {HSTEP} h ({nb} steps): every series is the block mean, each step weighted {HSTEP} h in the objective and the stores; energies are the year\'s; curtailment is understated where a peak is shorter than a block')
if DAYS > 0:
    dsel = np.linspace(0, 364, DAYS).round().astype(int); snaps = np.concatenate([np.arange(d * 24, d * 24 + 24) for d in dsel])
    n.set_snapshots(snaps); n.snapshot_weightings = pd.Series(8760.0 / len(snaps), index=n.snapshots)
    notes.append(f'timing run: {DAYS} evenly spaced calendar days ({len(snaps)} hours), each weighted {8760.0 / len(snaps):.3f}; stores cyclic over the sample; energies are the sample\'s, unweighted')

SOLVER_OPTS = {'presolve': 'on', 'parallel': 'on'} if SOLVER == 'simplex' else {'presolve': 'on', 'parallel': 'on', 'solver': 'ipm', 'run_crossover': 'off'}
if SOLVER != 'simplex': notes.append(f'solver {SOLVER} (crossover off): a timing test; duals approximate')
t0 = time.time()
TX_ON = TX_EXT > 0 and FACTOR is not None
if SITE_FREE or MIX or TX_ON or BATT_FREE:
    if REEA_MW is None and (SITE_FREE or MIX): reea_shares()
    m = n.optimize.create_model()
    pn = m.variables['Generator-p_nom'] if 'Generator-p_nom' in m.variables else None
    if TX_ON:
        lnk = m.variables['Link-p_nom']
        for i in range(len(corr)): m.add_constraints(lnk.loc[f'c{i}_ab'] - lnk.loc[f'c{i}_ba'] == 0, name=f'corridor pair {i}')
        if TX_BUDGET > 0:
            expr = sum(lnk.loc[f'c{i}_ab'] * (km * TX_EXT * CRF) for i, (a, b, cap_ab, km, lim, add) in enumerate(corr))
            m.add_constraints(expr <= TX_BUDGET + sum(cap_ab * km * TX_EXT * CRF for a, b, cap_ab, km, lim, add in corr), name='corridor budget')
            notes.append(f'corridor additions capped at R{TX_BUDGET / 1e9:.3f}bn a year')
        if TX_KM_BUDGET > 0:
            expr = sum(lnk.loc[f'c{i}_ab'] * (km / circuit_rating(TX_KM_KV, km)) for i, (a, b, cap_ab, km, lim, add) in enumerate(corr))
            m.add_constraints(expr <= TX_KM_BUDGET + sum(cap_ab * km / circuit_rating(TX_KM_KV, km) for a, b, cap_ab, km, lim, add in corr), name='corridor km budget')
            notes.append(f'corridor additions capped at {TX_KM_BUDGET:,.0f} km of {TX_KM_KV} kV line (each corridor MW as circuits at the St Clair rating for its length)')
    if SITE_FREE:
        for t, N in (('wind new', N_w), ('pv new', N_p)):
            names = [g for g in n.generators.index if g.endswith(t) and n.generators.p_nom_extendable[g]]
            if names and N > 0: m.add_constraints(pn.loc[names].sum() == N, name=f'national {t}')
    if MIX or BATT_FREE:
        ln = m.variables['Link-p_nom']
        for r in REG: m.add_constraints(ln.loc[f'{r} li discharge'] - ln.loc[f'{r} li charge'] == 0, name=f'li power {r}')
        if BATT_FREE and not MIX: notes.append('lithium free: power and energy extendable by area at the build\'s lithium costs; the build\'s plants fixed')
        if MIX_CAP:
            caps = dict(kv.split(':') for kv in MIX_CAP.split(','))
            for t, suffix in (('wind', 'wind new'), ('pv', 'pv new'), ('ocgt', 'ocgt new')):
                if t in caps:
                    names = [g for g in n.generators.index if g.endswith(suffix)]
                    if names: m.add_constraints(pn.loc[names].sum() <= float(caps[t]), name=f'cap {t}')
            if 'batt' in caps: m.add_constraints(ln.loc[[f'{r} li charge' for r in REG]].sum() <= float(caps['batt']), name='cap batt')
            notes.append('national caps: ' + MIX_CAP)
        if WIND_CAPE_MW > 0 and not MIX_NOCAP and 'Western Cape wind new cape' in n.generators.index: m.add_constraints(pn.loc['Western Cape wind new'] + pn.loc['Western Cape wind new cape'] <= float(max(0.0, REEA_MW['wind'].get('Western Cape', 0.0)) if REEA_MW else 1e5), name='wind cap with allowance'); notes.append(f'Cape wind allowance: {WIND_CAPE_MW:,.0f} MW of new Western Cape wind without the integration charge')
        if PV_CREDIT_MW > 0:
            cr = [g for g in n.generators.index if g.endswith('pv new credit')]
            m.add_constraints(pn.loc[cr].sum() <= PV_CREDIT_MW, name='credit pool')
            for r in REG:
                if f'{r} pv new credit' in cr and not MIX_NOCAP: m.add_constraints(pn.loc[f'{r} pv new'] + pn.loc[f'{r} pv new credit'] <= float(max(0.0, REEA_MW['solar'].get(r, 0.0)) if REEA_MW else 1e5), name=f'solar cap with credit {r}')
            notes.append(f'freed-coal connection credit: new solar up to {PV_CREDIT_MW:,.0f} MW nationally without the integration charge (R{integ:,.0f} per kW-year)')
        if MIX_MIN:
            mins = dict(kv.split(':') for kv in MIX_MIN.split(','))
            for t, suffix in (('wind', 'wind new'), ('pv', 'pv new'), ('ocgt', 'ocgt new')):
                if t in mins:
                    names = [g for g in n.generators.index if g.endswith(suffix)]
                    if names: m.add_constraints(pn.loc[names].sum() >= float(mins[t]), name=f'min {t}')
            if 'batt' in mins: m.add_constraints(ln.loc[[f'{r} li charge' for r in REG]].sum() >= float(mins['batt']), name='min batt')
            if 'battE' in mins: m.add_constraints(m.variables['Store-e_nom'].loc[[f'{r} li store' for r in REG]].sum() >= float(mins['battE']), name='min battE')
            notes.append('national floors: ' + MIX_MIN)
    status, cond = n.optimize.solve_model(solver_name='highs', solver_options=SOLVER_OPTS, assign_all_duals=True)
else:
    status, cond = n.optimize(solver_name='highs', solver_options=SOLVER_OPTS, assign_all_duals=True)
secs = time.time() - t0
# ---------------------------------------------------------------- results
g = n.generators_t.p; gc = n.generators.carrier
PN = {name: float(n.generators.p_nom_opt[name] if n.generators.p_nom_extendable[name] else n.generators.p_nom[name]) for name in n.generators.index}   # the LP's chosen capacity where extendable (free siting, free mix); before 5 Nov 2026 22:50 UTC p_nom (zero) was used, so those cases' curtailment was wrong
E = {}
for name, c in gc.items(): E[c] = E.get(c, 0.0) + float(g[name].sum()) * W
avail = {}; curt = {}
for name, c in gc.items():
    if c in ('wind', 'pv', 'offshore'):
        av = float((n.generators_t.p_max_pu[name] * PN[name]).sum()) * W; avail[c] = avail.get(c, 0.0) + av; curt[c] = curt.get(c, 0.0) + av - float(g[name].sum()) * W
curt_r = {}
for name, c in gc.items():
    if c in ('wind', 'pv', 'offshore'):
        r = n.generators.bus[name]; curt_r[r] = curt_r.get(r, 0.0) + (float((n.generators_t.p_max_pu[name] * PN[name]).sum()) - float(g[name].sum())) * W
sto = n.storage_units_t.p; dis = {}; chg = {}
for name, c in n.storage_units.carrier.items():
    dis[c] = dis.get(c, 0.0) + float(sto[name].clip(lower=0).sum()) * W; chg[c] = chg.get(c, 0.0) + float((-sto[name].clip(upper=0)).sum()) * W
flows = []
lk = n.links_t.p0
muU = n.links_t.mu_upper if hasattr(n.links_t, 'mu_upper') else None; muL = n.links_t.mu_lower if hasattr(n.links_t, 'mu_lower') else None
def mu_of(name, lower=True):
    u = np.abs(muU[name].values) if (muU is not None and name in muU) else np.zeros(len(n.snapshots)); l = np.abs(muL[name].values) if (muL is not None and name in muL and lower) else np.zeros(len(n.snapshots)); return u + l
for i, (a, b, cap_ab, km, lim, add) in enumerate(corr):
    # a one-way link's lower bound (zero flow) carries a dual whenever the other direction flows; only its upper bound is the corridor's capacity
    f = lk[f'c{i}_ab'].values - lk[f'c{i}_ba'].values; mu = mu_of(f'c{i}_ab', False) + mu_of(f'c{i}_ba', False)
    # the shadow price of the corridor's capacity: R per MWh in the hours it binds; its sum over the year is the value of one more MW for a year
    flows.append({'a': a, 'b': b, 'capMW': cap_ab, 'todayMW': lim, 'tdpMW': add, 'km': km, 'GWh': float(np.abs(f).sum()) * W / 1e3, 'hoursAtLimit': int((np.abs(f) >= 0.98 * cap_ab).sum() * W) if cap_ab < 1e5 else 0, 'maxMW': float(np.abs(f).max()),
                  'bindingHours': int((mu > 1.0).sum() * W), 'shadowRperMWyr': float(mu.sum()), 'shadowMeanRperMWh': float(mu[mu > 1.0].mean()) / W if (mu > 1.0).any() else 0.0})
fuel = float(sum((g[name] * n.generators.marginal_cost[name]).sum() for name in n.generators.index if gc[name] in ('coal', 'ccgt', 'ocgt', 'diesel'))) * W
byArea = {r: {} for r in REG}
for name, c in gc.items():
    r = n.generators.bus[name]; byArea[r][c] = byArea[r].get(c, 0.0) + float(g[name].sum()) * W / 1e6
netIn = {r: 0.0 for r in REG}; inflow_max = {r: 0.0 for r in REG}
for i, (a, b, cap_ab, km, lim, add) in enumerate(corr):
    f = lk[f'c{i}_ab'].values - lk[f'c{i}_ba'].values
    netIn[b] += float(f.sum()) * W / 1e6; netIn[a] -= float(f.sum()) * W / 1e6
mix = {}
if MIX:
    mix['windMW'] = {r: float(n.generators.p_nom_opt.get(f'{r} wind new', 0.0)) for r in REG}
    mix['pvMW'] = {r: float(n.generators.p_nom_opt.get(f'{r} pv new', 0.0)) for r in REG}
    if WIND_CAPE_MW > 0:
        mix['windCapeMW'] = float(n.generators.p_nom_opt.get('Western Cape wind new cape', 0.0)); mix['windMW']['Western Cape'] = mix['windMW'].get('Western Cape', 0.0) + mix['windCapeMW']; mix['capeCreditRbn'] = mix['windCapeMW'] * integ * 1000 / 1e9
    if PV_CREDIT_MW > 0:
        mix['pvCreditMW'] = {r: float(n.generators.p_nom_opt.get(f'{r} pv new credit', 0.0)) for r in REG}
        mix['pvMW'] = {r: mix['pvMW'][r] + mix['pvCreditMW'][r] for r in REG}
        mix['creditRbn'] = sum(mix['pvCreditMW'].values()) * integ * 1000 / 1e9   # the integration charge the credited solar does not pay, to take off the new-build cost recomputed from pvMW x costs['pv']
    mix['ocgtMW'] = {r: float(n.generators.p_nom_opt.get(f'{r} ocgt new', 0.0)) for r in REG}
    mix['battMW'] = {r: float(n.links.p_nom_opt.get(f'{r} li charge', 0.0)) for r in REG}
    mix['battMWh'] = {r: float(n.stores.e_nom_opt.get(f'{r} li store', 0.0)) for r in REG}
    mix['totals'] = {k: sum(v.values()) for k, v in mix.items() if isinstance(v, dict)}
    mix['liDischargeTWh'] = float(sum(n.links_t.p0[f'{r} li discharge'].clip(lower=0).sum() for r in REG)) * W / 1e6
    mix['capexRbn'] = float(sum(n.generators.p_nom_opt[g] * n.generators.capital_cost[g] for g in n.generators.index if n.generators.p_nom_extendable[g]) + sum((n.links.p_nom_opt[l] - (n.links.p_nom[l] if n.links.carrier[l] == 'corridor' else 0.0)) * n.links.capital_cost[l] for l in n.links.index if n.links.p_nom_extendable[l]) + sum(n.stores.e_nom_opt[s2] * n.stores.capital_cost[s2] for s2 in n.stores.index)) / 1e9
    mix['run'] = {'windMW': N_w, 'pvMW': N_p, 'battMW': newBatt, 'battMWh': newBatt * newBattH, 'ocgtMW': ocgtMW}
    mix['costs'] = {k: v for k, v in CC.items()}
siteOut = {}
if SITE_FREE:
    for t in ('wind new', 'pv new'):
        tot = sum(float(n.generators.p_nom_opt[gn]) for gn in n.generators.index if gn.endswith(t)); siteOut[t] = {gn.replace(' ' + t, ''): float(n.generators.p_nom_opt[gn]) / tot for gn in n.generators.index if gn.endswith(t) and tot > 0}
expansion = []
if TX_EXT > 0:
    for i, (a, b, cap_ab, km, lim, add) in enumerate(corr):
        addMW = float(n.links.p_nom_opt[f'c{i}_ab'] - n.links.p_nom[f'c{i}_ab'])   # the pair is tied, so one direction's addition is the corridor's
        if addMW > 1: expansion.append({'a': a, 'b': b, 'addMW': addMW, 'km': km, 'MWkm': addMW * km, 'capexRbn': addMW * km * TX_EXT / 1e9, 'annualRbn': addMW * km * TX_EXT * CRF / 1e9, 'km400': addMW / circuit_rating(400, km) * km, 'km765': addMW / circuit_rating(765, km) * km})
if BATT_FREE and not MIX:
    battFree = {'byAreaMW': {r: float(n.links.p_nom_opt.get(f'{r} li charge', 0.0)) for r in REG}, 'byAreaMWh': {r: float(n.stores.e_nom_opt.get(f'{r} li store', 0.0)) for r in REG}}
    battFree['MW'] = sum(battFree['byAreaMW'].values()); battFree['MWh'] = sum(battFree['byAreaMWh'].values()); battFree['annualRbn'] = (battFree['MW'] * CC['batt'] + battFree['MWh'] * CC['battE']) / 1e9
res = {'script': 'pypsa_net v2 (one-way corridor pairs, 6 Nov 2026)', 'areaMap': os.path.basename(AREA_MAP) if AREA_MAP else None, 'battFree': battFree, 'txKmBudget': TX_KM_BUDGET or None, 'txKmKv': TX_KM_KV, 'corrFile': os.path.basename(CORR_FILE) if CORR_FILE else None, 'gasInteg': GAS_INTEG, 'windCapeMW': WIND_CAPE_MW, 'pvCreditMW': PV_CREDIT_MW, 'battAdded': battAdded, 'txBudgetRbn': TX_BUDGET / 1e9 if TX_BUDGET > 0 else None, 'dump': os.path.basename(DUMP), 'build': D['build'], 'year': Y, 'weatherYear': WY, 'seed': D['seed'], 'case': CASE, 'siting': SITING, 'losses': LOSSES, 'coalmin': COALMIN, 'status': f'{status}/{cond}', 'secs': secs,
       'objectiveRbn': float(n.objective) / 1e9, 'fuelAndCarbonRbn': fuel / 1e9,
       'E_TWh': {c: v / 1e6 for c, v in E.items()}, 'storageDischargeTWh': {c: v / 1e6 for c, v in dis.items()}, 'storageChargeTWh': {c: v / 1e6 for c, v in chg.items()},
       'availTWh': {c: v / 1e6 for c, v in avail.items()}, 'curtailedTWh': {c: v / 1e6 for c, v in curt.items()}, 'curtailedTotalTWh': sum(curt.values()) / 1e6, 'curtailedByRegionTWh': {r: v / 1e6 for r, v in curt_r.items()},
       'unservedGWh': E.get('unserved', 0.0) / 1e3, 'corridors': flows, 'siting_shares': site, 'notes': notes, 'byAreaTWh': byArea, 'netImportTWh': netIn, 'sitingChosen': siteOut, 'expansion': expansion, 'mix': mix, 'mixInteg': MIX_INTEG,
       'expansionTotal': {'MW': sum(x['addMW'] for x in expansion), 'MWkm': sum(x['MWkm'] for x in expansion), 'capexRbn': sum(x['capexRbn'] for x in expansion), 'annualRbn': sum(x['annualRbn'] for x in expansion)}, 'txExt': TX_EXT, 'crf': CRF, 'siteFree': SITE_FREE, 'demandSplit': DEMAND_SPLIT, 'koebergOut': KOEBERG_OUT, 'tdpFile': os.path.basename(TDP_FILE) if TDP_FILE else '',
       'engine': {'E_TWh': {c: v / 1e6 for c, v in D['E'].items()}, 'shedGWh': D['shedMWh'] / 1e3, 'gridLoadTWh': float(gridLoad.sum()) / 1e6, 'grossLoadTWh': float(grossLoad.sum()) / 1e6, 'psDischargeTWh': D['E'].get('ps', 0) / 1e6, 'battDischargeTWh': D['E'].get('batt', 0) / 1e6}}
try: nv, nc = int(n.model.nvars), int(n.model.ncons)
except Exception: nv, nc = None, None
res['timing'] = {'buildSec': t0 - T_START, 'solveSec': secs, 'totalSec': time.time() - T_START, 'peakRssGB': resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1e6, 'hours': int(len(n.snapshots)), 'days': DAYS or 365, 'hstep': HSTEP, 'nvars': nv, 'ncons': nc}
json.dump(res, open(OUT, 'w'), indent=1)
eng = res['engine']['E_TWh']
print(f"{CASE} {SITING} losses={LOSSES} coalmin={COALMIN} {Y} wy{WY}: {status}/{cond} in {secs:.0f}s, objective R{res['objectiveRbn']:.2f}bn, fuel+carbon R{res['fuelAndCarbonRbn']:.2f}bn")
print(f"{'TWh':12s} {'engine':>9s} {'pypsa':>9s}")
for c in ('coal', 'ccgt', 'ocgt', 'diesel', 'wind', 'offshore', 'pv', 'rooftop', 'csp', 'nuclear', 'hydro', 'hybrid', 'imports'):
    e = eng.get(c, 0) + (eng.get('ccgt', 0) * 0 if c != 'ccgt' else 0)
    print(f"{c:12s} {e:9.3f} {res['E_TWh'].get(c, 0):9.3f}")
print(f"{'ps dis':12s} {eng.get('ps', 0):9.3f} {res['storageDischargeTWh'].get('ps', 0):9.3f}")
print(f"{'batt dis':12s} {eng.get('batt', 0):9.3f} {res['storageDischargeTWh'].get('batt', 0):9.3f}")
print(f"{'curtailed':12s} {eng.get('curtailed', 0):9.3f} {res['curtailedTotalTWh']:9.3f}   (wind {res['curtailedTWh'].get('wind', 0):.3f}, pv {res['curtailedTWh'].get('pv', 0):.3f})")
print(f"{'unserved GWh':12s} {res['engine']['shedGWh']:9.3f} {res['unservedGWh']:9.3f}")
print('binding corridors (hours with a shadow price, R per MW-year, GWh):', sorted([(f['a'] + '-' + f['b'], f['bindingHours'], round(f['shadowRperMWyr']), round(f['GWh'])) for f in flows if f['bindingHours'] > 0], key=lambda x: -x[2])[:8])
for x in notes: print(' note:', x)
