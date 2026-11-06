"""753 (c): corridor files in the CORR_FILE format carrying the report's corridor limits (the lower of N-1 loadability and N-1 PV transfer,
table45_lowerof.json) for 2025 (today's corridors) and 2035 (a stand-in for the TDP's lines), as one pseudo-circuit per corridor, to be run with
CAP_AS_IS=1 so pypsa_net.py takes the figure as it stands. The two Mercury 765 kV corridors the report does not list keep our N-1 once values,
labelled. km from our table (only corridor expansion uses it; none here)."""
import json, sys
S = '/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad/'
T = json.load(open(S + 'table45_lowerof.json')); V = json.load(open(S + 'corridors_v2.json'))
for yr in ('2025', '2035'):
    out = {'meta': {'method': f"753 (c): the report's N-1 corridor limits for {yr} (lower of loadability and PV transfer, Annexure B Table 45) as one pseudo-circuit per corridor; "
                              "run with CAP_AS_IS=1. Free State to North West and Mpumalanga to North West (the Mercury 765 kV lines) are not in the report and keep our N-1 once values.",
                    'erosPlacement': V['meta'].get('erosPlacement'), 'source': T['_source']}, 'corridors': {}}
    for key, v in V['corridors'].items():
        rep = [k for k, o in T['_ours'].items() if o == key]
        if rep: mw = T['lower'][rep[0]][yr]; lab = f"report {rep[0]} {yr} (lower of loadability and PV transfer)"
        else: mw = v['n1MW']; lab = 'our N-1 once (not in the report)'
        out['corridors'][key] = {'a': v['a'], 'b': v['b'], 'n1MW': mw, 'kmMean': v['kmMean'], 'circuits': [{'label': lab, 'kv': 0, 'km': v['kmMean'], 'ratingMW': mw}]}
    json.dump(out, open(S + f'corridors_dbsa_{yr}.json', 'w'), indent=1)
    print(yr, 'total MW', round(sum(c['n1MW'] for c in out['corridors'].values())), 'of which report', round(sum(c['n1MW'] for k, c in out['corridors'].items() if k in T['_ours'].values())))
