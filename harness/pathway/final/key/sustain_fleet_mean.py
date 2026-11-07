# 781 (a): EIA coal sustaining capital, fleet MW-weighted mean by year, computed independently of index.html's function (reads its data).
import json, re, sys
html = open(sys.argv[1]).read(); dates = json.load(open(sys.argv[2]))['units']
fleet = json.loads(re.search(r'const UC_FLEET = (\[.*?\]);\n', html).group(1))
cod_src = re.search(r'const COAL_UNIT_COD = (\{.*?\});', html, re.S).group(1)
cod = json.loads(re.sub(r"'([^']+)':", r'"\1":', cod_src))
k = 325.252 / 245.120 * 16.50   # US CPI-U Jan 2026 over 2017 average, R16.50/$
six = ['Medupi', 'Majuba', 'Matimba', 'Kendal', 'Lethabo', 'Tutuka']
def fgd(name, y, case='compromise'):
    st = name.rstrip('*')
    if st == 'Kusile': return 1
    if case == 'none' or y < 2031: return 0
    return 1 if (st == 'Medupi' or (case == 'full' and st in six)) else 0
rows = {}
for y in range(2026, 2041):
    mw = r = age_mw = 0.0; parts = {}
    for g in fleet:
        n = max(1, g.get('n') or 1); per = g['cap'] / n
        d = dates.get(g['name']) or [9999 if g['decom'] == 'beyond 2050' else int(g['decom'])] * n
        for i in range(n):
            if d[i] > y:
                a = max(0, y - cod[g['name']][i]); usd = 16.53 + 0.126 * a + 5.68 * fgd(g['name'], y)
                mw += per; r += per * usd * k; age_mw += per * a
    rows[y] = (round(r / mw, 3), round(mw), round(age_mw / mw, 1))
print('R/kW-yr per 2017$', round(k, 4)); print('year mean_R_per_kWyr MW_unscaled mean_age')
for y, v in rows.items(): print(y, *v)
json.dump({y: v[0] for y, v in rows.items()}, open(sys.argv[3], 'w'))
