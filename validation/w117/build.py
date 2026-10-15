# Message 117 (1): s_windlow_c5b14r's wind and solar build by year beside c5b_14r's, from the two runs' pathway files.
import json, sys
H = sys.argv[1]
A = json.load(open(f'{H}/pathway_c5b_14r.json')); B = json.load(open(f'{H}/pathway_s_windlow_c5b14r.json'))
diff = {k: (A[k], B[k]) for k in A if k != 'sched' and k in B and A[k] != B[k]}
print('settings that differ:', json.dumps(diff)[:600])
print('| Year | Wind c5b_14r | Wind s_windlow | of which freed-connection (cw) c5b_14r / s_windlow | Utility solar c5b_14r | Utility solar s_windlow | Rooftop c5b_14r / s_windlow |')
print('|---|---|---|---|---|---|---|')
T = [0] * 8
for y in range(2026, 2041):
    a, b = A['sched'][str(y)], B['sched'][str(y)]
    v = [a['wind'], b['wind'], a.get('cw', 0), b.get('cw', 0), a['pv'], b['pv'], a['rooftop'], b['rooftop']]
    T = [t + x for t, x in zip(T, v)]
    print(f"| {y} | {v[0]:,.0f} | {v[1]:,.0f} | {v[2]:,.0f} / {v[3]:,.0f} | {v[4]:,.0f} | {v[5]:,.0f} | {v[6]:,.0f} / {v[7]:,.0f} |")
print(f"| 2026-40 | {T[0]:,.0f} | {T[1]:,.0f} | {T[2]:,.0f} / {T[3]:,.0f} | {T[4]:,.0f} | {T[5]:,.0f} | {T[6]:,.0f} / {T[7]:,.0f} |")
