"""Tables for message 722: (a) the three builds (every-change pass, Fossil-free and Deep stand-ins) at 2035 and 2040; (b) LP timing.
Reads every net*_*.json and timing_*.json in the scratchpad, keyed by file name."""
import json, glob, os, re
S = '/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad/'
R = {}
for f in sorted(glob.glob(S + 'net_*.json') + glob.glob(S + 'timing_*.json')):
    try: R[os.path.basename(f)] = json.load(open(f))
    except Exception as e: print('bad', f, e)
def g(d, c): return d['E_TWh'].get(c, 0.0)
def sto(d, c): return d['storageDischargeTWh'].get(c, 0.0)
def binding(d, nmin=4000, k=5):
    return '; '.join(f"{f['a']} to {f['b']} ({f.get('bindingHours', 0)} h, R{f.get('shadowRperMWyr', 0) / 1e6:.1f}m)" for f in sorted(d['corridors'], key=lambda x: -x.get('shadowRperMWyr', 0))[:k] if f.get('bindingHours', 0) >= nmin) or 'none over 4,000 h'
BUILD = {'final': 'Least-cost (every-change pass, build 2026-11-05f)', 'ff': 'Fossil-free stand-in (s_ff2040_c7, build 2026-11-03a)', 'deep': 'Deep decarbonisation stand-in (s_deep40nogas_c7, build 2026-11-03a)'}
LAB = {'nolimit': 'no limits', 'n0': 'as drawn', 'n1': '0.7', 'n1c': 'one circuit dropped', 'n1ctdp': 'one circuit dropped, full TDP'}
out = ['### 722 (a): the three builds through the same network test (weather years 2025 and 2015, seed k = 0; energies TWh, unserved GWh)', '']
for pfx in ('final', 'ff', 'deep'):
    files = {fn: d for fn, d in R.items() if fn.startswith(f'net_{pfx}_')}
    if not files: out.append(f'{BUILD[pfx]}: no results yet'); continue
    out.append(f'{BUILD[pfx]}')
    out.append('| year, weather year | corridors | coal | gas | diesel | wind (offshore) | solar | lithium | flow, iron-air | pumped | curtailed (wind, solar, offshore) | unserved | corridors built MW, R bn a year | corridors with a shadow price over 4,000 h |')
    out.append('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|')
    def key(x): d = x[1]; return (d['year'], -int(d['weatherYear']), ['nolimit', 'n0', 'f085', 'n1', 'n1c', 'n1tdp', 'n1ctdp'].index(d['case']) if d['case'] in ['nolimit', 'n0', 'f085', 'n1', 'n1c', 'n1tdp', 'n1ctdp'] else 9, x[0])
    for fn, d in sorted(files.items(), key=key):
        if d.get('mix') or d.get('siteFree') or d.get('demandSplit', 'file') != 'file' or d['losses'] or d['coalmin'] or d['siting'] != 'reea' or 'ipmtest' in fn: continue
        if d['case'] not in ('nolimit', 'n0', 'n1', 'n1c', 'n1ctdp'): continue
        if d['case'] == 'n1ctdp' and 'tdpfull' not in fn: continue
        ex = d.get('expansionTotal', {}); tx = f"{ex['MW']:,.0f}, {ex['annualRbn']:.2f}" if d.get('txExt') else '-'
        lab = LAB[d['case']] + (f" (extendable at R{d['txExt']:,.0f}/MW-km)" if d.get('txExt') else '')
        c = d['curtailedTWh']
        out.append(f"| {d['year']}, {d['weatherYear']} | {lab} | {g(d, 'coal'):.1f} | {g(d, 'ccgt') + g(d, 'ocgt'):.1f} | {g(d, 'diesel'):.2f} | {g(d, 'wind'):.1f} ({g(d, 'offshore'):.1f}) | {g(d, 'pv'):.1f} | {sto(d, 'batt'):.1f} | {sto(d, 'vrfb'):.1f}, {sto(d, 'fe'):.1f} | {sto(d, 'ps'):.1f} | {d['curtailedTotalTWh']:.1f} ({c.get('wind', 0):.1f}, {c.get('pv', 0):.1f}, {c.get('offshore', 0):.1f}) | {d['unservedGWh']:.0f} | {tx} | {binding(d)} |")
    # the engine's own numbers for the tie-out
    for fn, d in sorted(files.items(), key=key):
        if d['case'] == 'nolimit' and not d.get('mix') and not d['coalmin'] and d['siting'] == 'reea' and d.get('demandSplit', 'file') == 'file':
            e = d['engine']['E_TWh']
            out.append(f"    engine {d['year']}, {d['weatherYear']}: coal {e.get('coal', 0):.1f}, gas {e.get('ccgt', 0) + e.get('ocgt', 0):.1f}, diesel {e.get('diesel', 0):.2f}, wind incl. offshore {e.get('wind', 0):.1f}, solar {e.get('pv', 0):.1f}, storage {e.get('batt', 0) + e.get('ps', 0):.1f}, curtailed {e.get('curtailed', 0):.1f}, unserved {d['engine']['shedGWh']:.0f} GWh; LP no limits: curtailed {d['curtailedTotalTWh']:.1f}, unserved {d['unservedGWh']:.0f}")
    # the free mix on this build
    for fn, d in sorted(files.items(), key=key):
        if not d.get('mix'): continue
        m = d['mix']; t = m['totals']; ru = m['run']; ex = d.get('expansionTotal', {})
        out.append(f"    free mix, {d['year']}, {d['weatherYear']}, {LAB.get(d['case'], d['case'])}{', full TDP' if 'tdpfull' in fn else ''}, corridors at R{d.get('txExt', 0):,.0f}: wind {t['windMW'] / 1e3:.1f} GW (run {ru['windMW'] / 1e3:.1f}), solar {t['pvMW'] / 1e3:.1f} ({ru['pvMW'] / 1e3:.1f}), lithium {t['battMW'] / 1e3:.1f} GW / {t['battMWh'] / 1e3:.0f} GWh ({ru['battMW'] / 1e3:.1f} / {ru['battMWh'] / 1e3:.0f}), open cycle {t['ocgtMW'] / 1e3:.1f} ({ru['ocgtMW'] / 1e3:.1f}); corridors {ex.get('MW', 0):,.0f} MW, R{ex.get('annualRbn', 0):.2f}bn a year; curtailed {d['curtailedTotalTWh']:.1f} TWh, unserved {d['unservedGWh']:.0f} GWh; new-build R{(t['windMW'] * m['costs']['wind'] + t['pvMW'] * m['costs']['pv'] + t['battMW'] * m['costs']['batt'] + t['battMWh'] * m['costs']['battE'] + t['ocgtMW'] * m['costs']['ocgt']) / 1e9 + ex.get('annualRbn', 0):.1f}bn a year, fuel and carbon R{d['fuelAndCarbonRbn']:.1f}bn")
    out.append('')
out.append('### 722 (b): measured LP times (one process, HiGHS, parallel on; the machine shared with other solves unless stated; rows marked script v2 ran the one-way-corridor-pair script of 6 Nov 2026, the rest the bidirectional-link script, which carried the circulating flow and solved more slowly in the no-limits cases)')
out.append('| file | build, year, weather year | case | hours (block) | variables | constraints | build s | solve s | total s | peak GB |')
out.append('|---|---|---|---|---|---|---|---|---|---|')
for fn, d in sorted(R.items(), key=lambda x: (x[1].get('timing', {}).get('hours', 0), x[0])):
    t = d.get('timing')
    if not t: continue
    lab = ('mix' if d.get('mix') else 'fixed build') + (f", corridors extendable at R{d['txExt']:,.0f}" if d.get('txExt') else '') + (', free siting' if d.get('siteFree') else '') + (', Koeberg calendar' if d.get('koebergOut') else '')
    out.append(f"| {fn} | {d['build']}, {d['year']}, {d['weatherYear']} | {LAB.get(d['case'], d['case'])}, {lab}{' (script v2)' if d.get('script') else ''} | {t['hours']:,}{' (' + str(t['hstep']) + ' h blocks)' if t.get('hstep', 1) > 1 else ''} | {t['nvars'] or '-'} | {t['ncons'] or '-'} | {t['buildSec']:.0f} | {t['solveSec']:.0f} | {t['totalSec']:.0f} | {t['peakRssGB']:.1f} |")
print('\n'.join(out)); open(S + 'tables722.md', 'w').write('\n'.join(out))
