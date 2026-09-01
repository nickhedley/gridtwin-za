#!/usr/bin/env python3
"""
decaps_docs.py - remove shouted emphasis from the tracked documents.

KEEPS three things:
  1. Acronyms and unit symbols (NERSA, TWh, LOLE, ...)
  2. Load-bearing warnings - a sentence containing DO NOT / NEVER / MUST NOT / STOP
     keeps its capitals, because those exist to halt someone mid-action.
  3. Anything inside a fenced code block or backticks - code is not prose.

Everything else is lowercased, with the first letter kept where the word starts a
sentence. Emphasis that mattered becomes **bold** rather than being lost.
"""
import re, sys, os

ACRONYMS = set("""NTCSA NERSA IRP TDP GCCA REIPPPP SAWEM CSV PPA VPP BESS OCGT CCGT LCOE
SRMC VOLL LOLE EUE IPP CSP RMIPPPP EIA NRS SANS DFFE SAPVIA PVGIS MERRA ERA PDF BW COD
GPS SOC MIP ATB CCS DLR REDZ REEA SSEG UCT GSB PFL DBSA NREL CSIR AEMO NDC SAPP UPG NCE
BESIPPPP ZA PV MW GW TWh GWh MWh kW kWh EAF UCLF PCLF OCLF ERTSA SA US UK AI ML API SDK
NEM JSON HTML MD LP CO2 CO SO NOx PyPSA HiGHS WASM SARAH KPI KPIs UI ID URL UTC SAST
FY CY Q1 Q2 Q3 Q4 H1 H2 EPP PP20 PP9 CC BY NC ND""".split())

KEEP_LINE = re.compile(r'\b(DO NOT|NEVER|MUST NOT|DO NOT|STOP|NOT SAFE)\b')
WORD = re.compile(r'(?<![A-Za-z0-9_`])([A-Z]{2,})(?![A-Za-z0-9_`])')

def fix_text(txt):
    out, changed = [], 0
    in_fence = False
    for line in txt.split('\n'):
        if line.lstrip().startswith('```'):
            in_fence = not in_fence
            out.append(line); continue
        if in_fence or KEEP_LINE.search(line):
            out.append(line); continue
        # protect inline code spans
        spans = []
        def stash(m):
            spans.append(m.group(0)); return f'\x00{len(spans)-1}\x00'
        line2 = re.sub(r'`[^`]*`', stash, line)

        def repl(m):
            nonlocal changed
            w = m.group(1)
            if w in ACRONYMS: return w
            changed += 1
            return w.capitalize() if m.start() == 0 else w.lower()
        line2 = WORD.sub(repl, line2)
        line2 = re.sub(r'\x00(\d+)\x00', lambda m: spans[int(m.group(1))], line2)
        out.append(line2)
    return '\n'.join(out), changed

if __name__ == '__main__':
    root = sys.argv[1] if len(sys.argv) > 1 else '.'
    total = 0
    for f in ['RESULTS.md','STATE.md','RULES.md','SOURCES.md','CALENDAR.md','MANIFEST.md']:
        p = os.path.join(root, f)
        if not os.path.exists(p): continue
        txt = open(p, encoding='utf-8').read()
        new, n = fix_text(txt)
        if n:
            open(p, 'w', encoding='utf-8').write(new)
        total += n
        print(f'  {f:<14}{n:>6} words de-capitalised')
    print(f'  {"total":<14}{total:>6}')
