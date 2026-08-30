#!/usr/bin/env python3
"""Lowercase shouted emphasis while protecting identifiers, acronyms and filenames."""
import re, sys

# Code identifiers, proper nouns, acronyms and document names that MUST survive.
KEEP = set("""
FIXED SLIDERS COLORS NAMES CORRIDORS REGIONS PROFILES HOURS STATE RESULTS RULES MANIFEST SOURCES
CALENDAR LOG README HANDOVER NM LBL COL ORDER KNOWN EXTERNAL CONTEXT SIGN_RULES BLD_PACE BLD_COST
BLD_LIFE BLD_DISC BLD_YEARS BLD_REGIONS BLD_CORRIDORS BLD_LOAD_SHARE DISP_ORDER PHASE_COL RESERVE
CARBON VOLL DAMP HIGHS NODES LINKS SA_POLY REGION_CENTROIDS ACR ALLOWED FOREIGN PLANT INSIDE OUTSIDE
CHECKS TOWNS KEEP
GWh TWh MWh MW GW kW kWh CSP PV LNG CCGT OCGT EAF IRP SA CSIR NERSA DMRE IPP REIPPPP BESIPPPP
RMIPPPP NTCSA GCCA MERRA ERA PVGIS NASA CSV HVDC SAPP LCOE SRMC VOM MIP LP DC AC TDP REDZ REEA
DFFE UCT GSB PFL ARM BW COD SOC VRE LDES SDES PJM MISO ERCOT PLEXOS PyPSA UPG NCE DLR DOE GETS CCS
MES JKM MMBtu USD ZAR CPI FX ATB NREL EPC PPA SSEG EIUG QCF CECG IRENA UJ GIS JSON API URL ID UUID
OSM DBSA SHP KPI AI EU US UK ZA CAISO CARTO ESRI IPPPP SAWEM CPA DSA JET WEF PCM PCMs SDDP LMP NBC
MTS ITP CX SEA SIP PSH BESS AR MSL UC NaN EGIS ENTSO ENTSOE EirGrid AEMO XLSX SARAH SOC
""".split())

def fix(text):
    def rep(m):
        w = m.group(0)
        if w in KEEP: return w
        # identifier-like context: FIXED.x, ARR[0], SOME_CONST
        st, en = m.start(), m.end()
        if en < len(text) and text[en] in '.[(_': return w
        if st > 0 and text[st-1] in '._': return w
        if len(w) <= 3: return w              # short tokens are usually units or acronyms
        return w.capitalize() if st > 0 and text[max(0,st-2):st].strip() in ('.', '!', '?', '') else w.lower()
    return re.sub(r'\b[A-Z]{2,}\b', rep, text)

if __name__ == '__main__':
    for path in sys.argv[1:]:
        src = open(path).read()
        if path.endswith('.html'):
            # LINE COMMENTS ONLY, and only pure ones. A first attempt matched block
            # comments with a DOTALL regex, which swallowed CSS comments and regex
            # literals and corrupted the file - validate_lp fell to 1/17. Conservative
            # now: a line must be whitespace then //, and must contain no backtick,
            # quote or brace, so no line that carries code or a string can be touched.
            out = []
            for line in src.split('\n'):
                st = line.strip()
                if st.startswith('//') and not any(c in line for c in '`\'"{}'):
                    out.append(fix(line))
                else:
                    out.append(line)
            new = '\n'.join(out)
        else:
            new = fix(src)
        if new != src:
            open(path, 'w').write(new)
            b = len(re.findall(r'\b[A-Z]{2,}\b', src)); a = len(re.findall(r'\b[A-Z]{2,}\b', new))
            print(f'  {path:<28}{b:>6} -> {a}')
