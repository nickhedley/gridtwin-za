#!/usr/bin/env python3
# Digitises IRP 2025 Figure 2 'Electricity Demand Forecast and Sensitivities' (plan p.11, gazette No. 53596 p.22), the Moderate line,
# from the raster embedded in the gazette PDF (user, 24 Oct 2026, message 370 (a)). Writes public_data/irp2025_fig2_moderate.json.
# Run from the repository root: pdfimages -f 20 -l 20 -j <gazette PDF> /tmp/x; python3 harness/pathway/digitise_irp2025_fig2.py /tmp/x-000.jpg
# (the gazette PDF is public: gpwonline.co.za; it is not kept in the repository). Needs Pillow and numpy.
import sys, json
from PIL import Image; import numpy as np
IMG = sys.argv[1]
# IRP 2025 Figure 2 (plan p.11, gazette p.22), digitised from the raster embedded in the gazette PDF (pdfimages, page 20, image 0,
# rotated 90 degrees). Axes calibrated from the tick marks in the raster: value ticks at row 131, x = 343 (200 TWh) to 612 (480 TWh),
# 15 ticks; year ticks at column 340, y = 133 (2024) to 697 (2050), every 2 years. Each series by its colour; per year row, the
# darkness-weighted centre of the series' pixels. Moderate where visible; where it is drawn under other lines (it equals High to
# 2032, text p.12), the High line or, where all coincide, the common line.
a = np.asarray(Image.open(IMG).convert('RGB')).astype(float)
V0, V1, X0, X1 = 200, 480, 343.0, 612.0
Y0, Y1, T0, T1 = 2024, 2050, 133.0, 697.0
val = lambda x: V0 + (x - X0) * (V1 - V0) / (X1 - X0)
rowOf = lambda yr: T0 + (yr - Y0) * (T1 - T0) / (Y1 - Y0)
def cls(p):
    r, g, b = p; s = r + g + b
    if s > 700: return None
    if r - g > 25 and r - b > 25 and abs(g - b) < 30: return 'mod'
    if r - b > 50 and g - b > 30: return 'ldev'
    if b - r > 40: return 'high' if g - r < 48 else 'mozal'   # High (65,98,129) against Moderate_MozalOut (100,167,209)
    if max(p) - min(p) < 18 and s < 650: return 'low'
    return None
def centre(y, want):
    xs, ws = [], []
    for yy in (int(np.floor(y)), int(np.ceil(y))):
        wy = 1 - abs(y - yy)
        for x in range(345, 625):
            p = a[yy, x]; c = cls(p)
            if c in want: xs.append(x); ws.append(wy * (765 - p.sum()))
    if not xs: return None
    xs, ws = np.array(xs), np.array(ws)
    if xs.max() - xs.min() > 6:   # two clusters: keep the heaviest
        best = None
        for x0 in set(xs.tolist()):
            m = abs(xs - x0) <= 3; w = ws[m].sum()
            if best is None or w > best[0]: best = (w, (xs[m] * ws[m]).sum() / w)
        return best[1]
    return (xs * ws).sum() / ws.sum()
def row_pixels(y, want, lo=345, hi=None):
    hi = hi or (593 if y < 440 else 610)
    xs, ws = [], []
    for x in range(lo, hi):
        p = a[y, x]
        if cls(p) in want: xs.append(x); ws.append(765 - p.sum())
    return np.array(xs, float), np.array(ws, float)
def trace(want, start_x, rows):
    prev, res, gap = start_x, {}, 0
    for y in rows:
        xs, ws = row_pixels(y, want)
        m = np.abs(xs - prev) <= 3 + gap * 0.6
        if m.any(): c = (xs[m] * ws[m]).sum() / ws[m].sum(); res[y] = c; prev = c; gap = 0
        else: gap += 1
    return res
def first_x(y, want):
    xs, ws = row_pixels(y, want); return float((xs * ws).sum() / ws.sum())
rows = range(136, 697); back = range(694, 135, -1)
startx = X0 + (238.5 - V0) * (X1 - X0) / (V1 - V0)
mod = trace(('mod',), first_x(694, ('mod',)), back); high = trace(('high',), first_x(680, ('high',)), range(680, 135, -1))
allc = trace(('mod', 'high', 'mozal', 'low'), startx, rows)
yr_of = lambda y: Y0 + (y - T0) * (Y1 - Y0) / (T1 - T0)
# Where the lines overlap: to 2030.3 every line but Low Delayed EVs coincides and Moderate_MozalOut is drawn on top, so the common
# line is read (all colours but the yellow and grey); from 2030.3 to 2033.5 High and Moderate run together, read as the
# right-hand cluster of High-or-Moderate pixels in the row (Moderate_MozalOut and Low lie to the left) (High = Moderate to 2032; at most about 2 TWh apart by 2033.5).
common = trace(('mozal', 'high', 'mod'), startx, [y for y in rows if yr_of(y) <= 2030.3])
def rightmost(y, want):
    xs, ws = row_pixels(y, want)
    if not len(xs): return None
    m = xs >= xs.max() - 3; return float((xs[m] * ws[m]).sum() / ws[m].sum())
pair = {y: c for y in rows if 2030.3 < yr_of(y) < 2033.5 for c in [rightmost(y, ('high', 'mod'))] if c is not None}
Ymod = {}
for y in rows:
    yr = yr_of(y)
    if yr <= 2030.3 and y in common: Ymod[y] = (common[y], 'common line')
    elif 2030.3 < yr < 2033.5 and y in pair: Ymod[y] = (pair[y], 'High with Moderate')
    elif yr >= 2033.5 and y in mod: Ymod[y] = (mod[y], 'Moderate')
ys = np.array(sorted(Ymod), float); xs = np.array([Ymod[int(y)][0] for y in ys])
med = np.array([np.median(xs[max(0, i - 4):i + 5]) for i in range(len(xs))]); keep = np.abs(xs - med) <= 1.5
ysk, xsk = ys[keep], xs[keep]
out = {}
for yr in range(2024, 2050):
    r = rowOf(yr); m = np.abs(ysk - r) <= 0.5 * (T1 - T0) / (Y1 - Y0)
    if m.sum() >= 4:
        A = np.vstack([ysk[m] - r, np.ones(m.sum())]).T; coef, *_ = np.linalg.lstsq(A, xsk[m], rcond=None)
        x = coef[1]; sd = float(np.std(xsk[m] - A @ coef))
    else: x = float(np.interp(r, ysk, xsk)); sd = None
    src = sorted(set(Ymod[int(y)][1] for y in ysk[m])) or ['interpolated']
    out[yr] = {'moderate': round(float(val(x)), 1), 'rows': int(m.sum()), 'resid_TWh': None if sd is None else round(sd * (V1 - V0) / (X1 - X0), 2), 'from': src}
    print(yr, out[yr])
print('rows traced: Moderate', len(mod), 'High', len(high), 'kept', int(keep.sum()), 'of', len(ys))

# Years where the Moderate line is obscured (2031-2032 under High and Moderate_MozalOut at the Mozal step; 2034 where it separates
# from High) are interpolated between the clean readings either side, standard digitising practice; flagged with a wider error.
clean = {y: v['moderate'] for y, v in out.items() if v['resid_TWh'] is not None and v['resid_TWh'] <= 0.5 and v['rows'] >= 8}
final = {}
for yr in range(2024, 2050):
    if yr in clean: final[yr] = {'twh': clean[yr], 'err_twh': 1.0, 'how': 'read'}
    else:
        lo = max(y for y in clean if y < yr); hi = min(y for y in clean if y > yr)
        final[yr] = {'twh': round(clean[lo] + (clean[hi] - clean[lo]) * (yr - lo) / (hi - lo), 1), 'err_twh': 3.0, 'how': f'interpolated {lo}-{hi}'}
for yr in final: print(yr, final[yr])
json.dump({'meta': {
  'what': "IRP 2025 Moderate electricity demand forecast, TWh, digitised from Figure 2 'Electricity Demand Forecast and Sensitivities' "
          "(Integrated Resource Plan 2025, p.11; Government Gazette No. 53596, 28 October 2025, p.22). IRP 2025 publishes no table; its "
          "full forecasting report is not public (searched 24 Oct 2026).",
  'definition': "IRP 2025 p.11: historical consumption of all systems connected to the transmission and distribution grid, excluding "
          "pumping of pumped-storage stations, battery charging and power stations' auxiliaries, including network losses; the forecast "
          "covers deemed sales across the borders (p.11 input assumptions). Its 2024 value (238.3) matches ESRG's Mode 1 total (domestic "
          "grid, exports, distributed PV and other onsite generation, 239.2), the basis the conversion in gen_irp_index.py assumes.",
  'method': "harness/pathway/digitise_irp2025_fig2.py: the raster embedded in the gazette PDF, axes calibrated from its tick marks "
          "(1 px = 1.04 TWh, one year = 21.7 px), the line found by colour and traced row by row, each year a straight-line fit over "
          "+/-0.5 year; to 2030 all lines but Low Delayed EVs coincide, to 2033.5 High and Moderate run together (High = Moderate to "
          "2032, p.12). Reading error: about +/-1 TWh where read (fit residual 0.1-0.3 TWh plus calibration), +/-3 TWh where interpolated.",
  'checks': "2029 reads 255.0 TWh, the plan's 'about 255 TWh by 2029' (p.34; the executive summary says 2030, where the figure reads 260.0); "
          "growth 2024-2040 2.2% a year against the plan's 2.3% average.",
  'source': 'IRP 2025 (Department of Electricity and Energy), public; digitised by GridTwin ZA, 24 Oct 2026'},
  'years': {str(y): v for y, v in final.items()}}, open('public_data/irp2025_fig2_moderate.json', 'w'), indent=1)
