# Message 117 tables, all generated: (1) build from the two pathway files (build.py); (2) cost per MWh from the read-only diagnostic
# (pathcheck_sn.js SN_W117 on build 14r), beside IRP 2025's workbook capex (Learning Rates sheet, read here) and BW5's published tariffs.
# usage: python3 tables117.py <c5b_14r jsonl> <c5b_14r 2030 jsonl with lpDaysCF> <s_windlow jsonl> <IRP workbook xlsx>
import json, sys, statistics as st, openpyxl
A = [json.loads(l) for l in open(sys.argv[1])]; LPD = json.loads(open(sys.argv[2]).readline())['lpDaysCF']; L = [json.loads(l) for l in open(sys.argv[3])]
CPI = 1.032 * 1.035                                   # index.html CPI_JAN24_TO_JAN26
wb = openpyxl.load_workbook(sys.argv[4], read_only=True, data_only=True); ws = wb['Learning Rates']
rows = [r for r in ws.iter_rows(values_only=True)]
hdr = rows[2]; col = {h.split('\n')[0].strip() + ' ' + h.split('\n')[1].strip() if h and '\n' in h else h: i for i, h in enumerate(hdr)}
def irp(name, y):
    i = [k for k, h in enumerate(hdr) if h and h.replace('\n', ' ').replace('  ', ' ').strip().startswith(name)][0]
    r = [r for r in rows if r and r[0] == y][0]; return r[i]
P = print
def curt(r): return st.mean(x['E']['vreCurtailed'] / (x['E']['wind'] + x['E']['pv'] + x['E']['vreCurtailed']) for x in r['wy'])
P('Table 2a. c5b_14r: new wind and new utility solar (tracking), R/kW and R/MWh, 2026 rands')
P('')
P('| Year | Tech | Capex | Capital, 25 y at 8% | Fixed O&M | Spur (annuity, 40 y) | Integration | Total R/kW-yr | CF: LP calendar days / default profile / 12-year mean | Curtailment, % | R/MWh on the LP days | R/MWh, 12-year CF after curtailment | of which R402 (12-year) |')
P('|---|---|---|---|---|---|---|---|---|---|---|---|---|')
for r in A:
    cu = curt(r)
    for t in ('wind', 'pv'):
        c = r['cost'][t]; tot = c['ann'] + c['fom'] + c['gridAnn']; cf = st.mean(x['newWindCF' if t == 'wind' else 'newPvCF'] for x in r['wy'])
        P(f"| {r['y']} | {'wind' if t == 'wind' else 'solar'} | {c['capex']:,.0f} | {c['ann']:,.0f} | {c['fom']:,.0f} | {c['spurAnn']:,.0f} ({c['spurKW']:,.0f}/kW) | {c['tx']:,.0f} | {tot:,.0f} | {LPD[t]*100:.1f} / {r['defaultCF'][t]*100:.1f} / {cf*100:.1f}% | {cu*100:.2f} | {tot/(LPD[t]*8.76):,.0f} | {tot/(cf*8.76*(1-cu)):,.0f} | {c['tx']/(cf*8.76*(1-cu)):,.0f} |")
P('')
P('Table 2b. s_windlow_c5b14r (WIND_CASE=low: IRENA global average capex, connection not included, so the spur runs from zero), wind only')
P('')
P('| Year | Capex | Total R/kW-yr | R/MWh on the LP days | R/MWh, 12-year CF after curtailment |'); P('|---|---|---|---|---|')
for r in L:
    c = r['cost']['wind']; tot = c['ann'] + c['fom'] + c['gridAnn']; cf = st.mean(x['newWindCF'] for x in r['wy']); cu = curt(r)
    P(f"| {r['y']} | {c['capex']:,.0f} | {tot:,.0f} | {tot/(LPD['wind']*8.76):,.0f} | {tot/(cf*8.76*(1-cu)):,.0f} |")
P('')
P("Table 2c. Capex beside IRP 2025's own (assumptions workbook, Learning Rates sheet, base case, January 2024 rands x 1.068 to January 2026)")
P('')
P('| Year | Wind c5b_14r | Wind IRP 2025 (BW6 base) | Solar c5b_14r (tracking) | Solar IRP 2025 (BW6 preferred base) | Solar IRP 2025 (BW6 compliant base) |'); P('|---|---|---|---|---|---|')
for r in A:
    y = r['y']
    P(f"| {y} | {r['cost']['wind']['capex']:,.0f} | {irp('Onshore Wind (BW6) Base Case', y)*CPI:,.0f} | {r['cost']['pv']['capex']:,.0f} | {irp('Solar PV (BW6 Preferred) Base Case', y)*CPI:,.0f} | {irp('Solar PV (BW6 Compliant) Base Case', y)*CPI:,.0f} |")
k = 1.059 * 1.069 * 1.053 * 1.032 * 1.035          # SOURCES 'REIPPPP onshore wind tariffs': IPP Office BW5-to-BW6 restatement, then January CPI
P('')
P(f"BW5 awarded tariffs (DMRE 28 Oct 2021, fully indexed, price base not stated): wind R495.22/MWh weighted (R344.25-617.70), about R{495.22*k:,.0f} (R{344.25*k:,.0f}-{617.70*k:,.0f}) in 2026 rands on SOURCES' approximate x{k:.3f}; solar R428.79 (R374.79-484.60), about R{428.79*k:,.0f}.")
