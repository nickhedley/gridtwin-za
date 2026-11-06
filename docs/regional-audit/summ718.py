"""Tables for message 718, from every net*_*.json in the scratchpad (keyed by file name)."""
import json, glob, os, sys
S = '/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad/'
PFX = sys.argv[1] if len(sys.argv) > 1 else 'final'
R = {}
for f in sorted(glob.glob(S + 'net*_*.json')):
    try: R[os.path.basename(f)] = json.load(open(f))
    except Exception as e: print('bad', f, e)
def g(d, c): return d['E_TWh'].get(c, 0.0)
def row(d):
    gas = g(d, 'ccgt') + g(d, 'ocgt'); sto = sum(d['storageDischargeTWh'].values()) + (d.get('mix', {}).get('liDischargeTWh', 0) if d.get('mix') else 0)
    return dict(coal=g(d, 'coal'), gas=gas, diesel=g(d, 'diesel'), wind=g(d, 'wind'), pv=g(d, 'pv'), curt=d['curtailedTotalTWh'], curtW=d['curtailedTWh'].get('wind', 0), curtP=d['curtailedTWh'].get('pv', 0), uns=d['unservedGWh'], sto=sto, cost=d['fuelAndCarbonRbn'], obj=d['objectiveRbn'])
def binding(d, nmin=4000, k=6):
    return '; '.join(f"{f['a']} to {f['b']} ({f.get('bindingHours', 0)} h, R{f.get('shadowRperMWyr', 0) / 1e6:.1f}m)" for f in sorted(d['corridors'], key=lambda x: -x.get('shadowRperMWyr', 0)) if f.get('bindingHours', 0) >= nmin)[:400]
LAB = {'nolimit': 'no limits', 'n0': 'as drawn (1.0)', 'f085': '0.85', 'n1': '0.7', 'n1c': 'drop one circuit', 'n1tdp': '0.7 with TDP', 'f085tdp': '0.85 with TDP', 'n0tdp': '1.0 with TDP', 'n1ctdp': 'drop one circuit with TDP'}
out = []
# (a) today's fleet
out.append("### 718 (a): today's fleet (the page's Today 2026 and '2025, as modelled' presets, build 2026-11-04b, weather year 2025, seed k = 0)")
out.append('| state | corridors | curtailed TWh (engine) | unserved GWh (engine) | coal TWh (engine) | diesel TWh (engine) | Western Cape: net import TWh, diesel TWh, unserved GWh | corridors with the most hours carrying a shadow price |')
out.append('|---|---|---|---|---|---|---|---|')
for fn, d in sorted(R.items()):
    if not fn.startswith('net_today_'): continue
    r = row(d); e = d['engine']['E_TWh']; wc = d['byAreaTWh'].get('Western Cape', {}); label = {'2026': 'Today 2026', '2025': '2025, as modelled'}[str(d['year'])]
    ko = (' Koeberg calendar ' + d['koebergOut']) if d.get('koebergOut') else ''
    top = sorted(d['corridors'], key=lambda x: -x.get('bindingHours', 0))[:3]; topS = '; '.join(f"{f['a']} to {f['b']} {f.get('bindingHours', 0)} h" for f in top if f.get('bindingHours', 0) > 0) or 'none'
    out.append(f"| {label}{ko} | {LAB.get(d['case'], d['case'])} | {r['curt']:.2f} ({e.get('curtailed', 0):.2f}) | {r['uns']:.1f} ({d['engine']['shedGWh']:.1f}) | {r['coal']:.1f} ({e.get('coal', 0):.1f}) | {r['diesel']:.3f} ({e.get('diesel', 0):.3f}) | {d['netImportTWh'].get('Western Cape', 0):.2f}, {wc.get('diesel', 0):.3f}, {wc.get('unserved', 0) * 1e3:.1f} | {topS} |")
# (b) the factor on the stand-in build
out.append('')
BUILD_OF = {'final': 'the every-change pass, build 2026-11-05f', 'standin': 'the c7 stand-in, build 2026-11-03a'}.get(PFX, PFX)
out.append(f'### 718 (b): the factor, every case on {BUILD_OF}, differences from no limits (the no-limits case of the same year and weather year)')
out.append('| year, weather year | corridors | curtailed TWh | unserved GWh | coal TWh | gas TWh | fuel and carbon R bn | corridors binding over 4,000 h |')
out.append('|---|---|---|---|---|---|---|---|')
base = {}
for fn, d in R.items():
    if fn.startswith('net_' + PFX + '_') and d['case'] == 'nolimit' and d['siting'] == 'reea' and not d['losses'] and not d['coalmin'] and not d.get('txExt') and not d.get('siteFree') and d.get('demandSplit', 'file') == 'file' and not d.get('mix'):
        base[(d['year'], d['weatherYear'])] = d
for fn, d in sorted(R.items(), key=lambda x: (x[1]['year'], x[1]['weatherYear'], x[0])):
    if not fn.startswith('net_' + PFX + '_') or d['siting'] != 'reea' or d['losses'] or d['coalmin'] or d.get('txExt') or d.get('siteFree') or d.get('demandSplit', 'file') != 'file' or d.get('mix'): continue
    b = base.get((d['year'], d['weatherYear']))
    if not b or d['case'] == 'nolimit': continue
    r = row(d); rb = row(b)
    out.append(f"| {d['year']}, {d['weatherYear']} | {LAB.get(d['case'], d['case'])}{' (TDP: ' + d['tdpFile'] + ')' if d.get('tdpFile') else ''} | {r['curt'] - rb['curt']:+.1f} | {r['uns'] - rb['uns']:+.1f} | {r['coal'] - rb['coal']:+.1f} | {r['gas'] - rb['gas']:+.1f} | {r['cost'] - rb['cost']:+.1f} | {binding(d) or 'none'} |")
# (d) extendable corridors
out.append('')
out.append(f'### 718 (d): corridors chosen by the LP ({BUILD_OF}; fixed build, corridors extendable at the cost shown; curtailment shown against the no-limits case and the same corridor case without expansion)')
out.append('| year, weather year | base | cost R per MW-km | built MW | MW-km (thousand) | capex R bn | R bn a year | curtailed left TWh (no-limits, base without expansion) | unserved GWh | by corridor (MW) |')
out.append('|---|---|---|---|---|---|---|---|---|---|')
def rc(d, k): return ('%.1f' % row(d)[k]) if d else '-'
for fn, d in sorted(R.items(), key=lambda x: (x[1]['year'], x[1]['weatherYear'], x[1].get('txExt', 0))):
    if not fn.startswith('net_' + PFX + '_') or not d.get('txExt') or d.get('siteFree') or d.get('mix') or 'ipmtest' in fn: continue
    b = base.get((d['year'], d['weatherYear'])); nb = R.get(f"net_{PFX}_{d['year']}_wy{d['weatherYear']}_{d['case']}_reea_l0_c0.json")
    ex = d['expansionTotal']; r = row(d)
    out.append(f"| {d['year']}, {d['weatherYear']} | {LAB.get(d['case'], d['case'])} | {d['txExt']:,.0f} | {ex['MW']:,.0f} | {ex['MWkm'] / 1e3:,.0f} | {ex['capexRbn']:.1f} | {ex['annualRbn']:.2f} | {r['curt']:.1f} ({rc(b, 'curt')}, {rc(nb, 'curt')}) | {r['uns']:.1f} | " + '; '.join(f"{x['a']} to {x['b']} {x['addMW']:,.0f}" for x in sorted(d['expansion'], key=lambda x: -x['addMW'])[:8]) + ' |')
# (e) siting free
out.append('')
out.append(f'### 718 (e): siting chosen by the LP ({BUILD_OF}; same national MW, each area capped at its approved REEA MW)')
out.append('| year, weather year | corridors | wind shares chosen | solar shares chosen | curtailed TWh (fixed REEA siting) | unserved GWh (fixed REEA siting) | coal TWh (fixed) |')
out.append('|---|---|---|---|---|---|---|')
for fn, d in sorted(R.items()):
    if not fn.startswith('net_' + PFX + '_') or not d.get('siteFree') or d.get('mix'): continue
    fixed = R.get(f"net_{PFX}_{d['year']}_wy{d['weatherYear']}_{d['case']}_reea_l0_c0" + ('_tdpfull' if d.get('tdpFile') else '') + ('_ext10k' if d.get('txExt') else '') + '.json')
    sc = d['sitingChosen']; r = row(d)
    fmt = lambda m: ', '.join(f"{k} {v:.0%}" for k, v in sorted(m.items(), key=lambda x: -x[1]) if v > 0.005)
    out.append(f"| {d['year']}, {d['weatherYear']} | {LAB.get(d['case'], d['case'])}{' (full TDP, 22 lines)' if d.get('tdpFile') else ''}{', extendable at R' + format(d['txExt'], ',.0f') + ' per MW-km' if d.get('txExt') else ''} | {fmt(sc.get('wind new', {}))} | {fmt(sc.get('pv new', {}))} | {r['curt']:.1f} ({rc(fixed, 'curt')}) | {r['uns']:.1f} ({rc(fixed, 'uns')}) | {r['coal']:.1f} ({rc(fixed, 'coal')}) |")
# (f) the mix
out.append('')
out.append("### 718 (f): the mix chosen by the LP (new wind, solar, lithium, open-cycle gas and corridors extendable by area; the run's own costs; the engine's commitment floor)")
out.append('| year, weather year | case | wind GW (run) | solar GW (run) | lithium GW, GWh (run) | open cycle GW (run) | corridors built MW | curtailed TWh | unserved GWh | new-build cost R bn a year | fuel and carbon R bn | objective R bn |')
out.append('|---|---|---|---|---|---|---|---|---|---|---|---|')
for fn, d in sorted(R.items(), key=lambda x: (x[1]['year'], x[1]['weatherYear'], x[0])):
    if not fn.startswith('net_' + PFX + '_') or not d.get('mix'): continue
    m = d['mix']; t = m['totals']; ru = m['run']; r = row(d); ex = d.get('expansionTotal', {})
    out.append(f"| {d['year']}, {d['weatherYear']} | {LAB.get(d['case'], d['case'])}{', corridors at R' + format(d['txExt'], ',.0f') if d.get('txExt') else ''}{', integration charge kept' if d.get('mixInteg') else ', integration charge removed'}{', caps' if any('national caps' in x for x in d['notes']) else ''} | {t['windMW'] / 1e3:.1f} ({ru['windMW'] / 1e3:.1f}) | {t['pvMW'] / 1e3:.1f} ({ru['pvMW'] / 1e3:.1f}) | {t['battMW'] / 1e3:.1f}, {t['battMWh'] / 1e3:.1f} ({ru['battMW'] / 1e3:.1f}, {ru['battMWh'] / 1e3:.1f}) | {t['ocgtMW'] / 1e3:.2f} ({ru['ocgtMW'] / 1e3:.2f}) | {ex.get('MW', 0):,.0f} | {r['curt']:.1f} | {r['uns']:.1f} | {m['capexRbn']:.1f} | {r['cost']:.1f} | {r['obj']:.1f} |")
    out.append('    mix by area, wind GW: ' + ', '.join(f"{k} {v / 1e3:.1f}" for k, v in sorted(m['windMW'].items(), key=lambda x: -x[1]) if v > 50) + '; solar GW: ' + ', '.join(f"{k} {v / 1e3:.1f}" for k, v in sorted(m['pvMW'].items(), key=lambda x: -x[1]) if v > 50) + '; lithium GW: ' + ', '.join(f"{k} {v / 1e3:.1f}" for k, v in sorted(m['battMW'].items(), key=lambda x: -x[1]) if v > 50) + '; open cycle GW: ' + ', '.join(f"{k} {v / 1e3:.2f}" for k, v in sorted(m['ocgtMW'].items(), key=lambda x: -x[1]) if v > 10))
# (g) demand split
out.append('')
out.append('### 718 (g): the demand split (the regional file\'s hourly shares against BLD_LOAD_SHARE)')
for fn, d in sorted(R.items()):
    if not fn.startswith('net_' + PFX + '_') or d.get('demandSplit', 'file') != 'bld': continue
    f2 = R.get(f"net_{PFX}_{d['year']}_wy{d['weatherYear']}_{d['case']}_reea_l0_c0.json"); r = row(d)
    out.append(f"- {d['year']}, {d['weatherYear']}, {LAB.get(d['case'], d['case'])}: curtailed {r['curt']:.1f} TWh with BLD_LOAD_SHARE against {rc(f2, 'curt')} with the file's shares; unserved {r['uns']:.1f} against {rc(f2, 'uns')} GWh; coal {r['coal']:.1f} against {rc(f2, 'coal')}; binding: {binding(d)}")
print('\n'.join(out)); open(S + 'tables718.md', 'w').write('\n'.join(out))
