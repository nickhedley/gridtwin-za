"""Fetch a latitude/longitude window of ERA5 single-level fields from the Google Cloud copy (ARCO-ERA5 raw daily
NetCDF, classic format, uncompressed) by HTTP byte range, without downloading whole files.

usage: python3 -I era5_band.py <out_dir> <first YYYY-MM-DD> <last YYYY-MM-DD> <var> [<var> ...]
Writes <out_dir>/<var>/<YYYY-MM-DD>.npy, float32 (24, nlat, nlon), unpacked to physical units, and
<out_dir>/grid.json (latitudes, longitudes). Skips days already written. Window: 21.5-35.5 S, 15.5-33.5 E.
Data: ERA5 (ECMWF, Copernicus Climate Change Service), CC BY 4.0; see SOURCES.md.
"""
import sys, os, json, struct, ssl, time, datetime, urllib.request
from concurrent.futures import ThreadPoolExecutor
import numpy as np

BASE = 'https://storage.googleapis.com/gcp-public-data-arco-era5/raw/date-variable-single_level'
LAT_N, LAT_S, LON_W, LON_E = -21.5, -35.5, 15.5, 33.5
CTX = ssl.create_default_context(cafile=os.environ.get('SSL_CERT_FILE') or '/root/.ccr/ca-bundle.crt')
OPENER = urllib.request.build_opener(urllib.request.HTTPSHandler(context=CTX))

def get(url, a, b, tries=5):
    for k in range(tries):
        try:
            req = urllib.request.Request(url, headers={'Range': 'bytes=%d-%d' % (a, b)})
            with OPENER.open(req, timeout=60) as r:
                d = r.read()
            if len(d) != b - a + 1: raise IOError('short read %d of %d' % (len(d), b - a + 1))
            return d
        except Exception as e:
            if k == tries - 1: raise
            time.sleep(2 * (k + 1))

SZ = {1: 1, 2: 1, 3: 2, 4: 4, 5: 4, 6: 8}
FMT = {1: 'b', 2: 'c', 3: 'h', 4: 'i', 5: 'f', 6: 'd'}

class Hdr:
    """NetCDF classic (CDF-1 / CDF-2) header parser."""
    def __init__(self, buf):
        self.b, self.p = buf, 0
        magic = self.raw(4)
        if magic[:3] != b'CDF' or magic[3] not in (1, 2): raise ValueError('not NetCDF classic: %r' % magic)
        self.v2 = magic[3] == 2
        self.numrecs = self.u32()
        self.dims = self.dim_list(); self.gatts = self.att_list(); self.vars = self.var_list()
    def raw(self, n):
        if self.p + n > len(self.b): raise EOFError
        d = self.b[self.p:self.p + n]; self.p += n; return d
    def u32(self): return struct.unpack('>I', self.raw(4))[0]
    def u64(self): return struct.unpack('>Q', self.raw(8))[0]
    def name(self):
        n = self.u32(); s = self.raw(n).decode(); self.raw((4 - n % 4) % 4); return s
    def dim_list(self):
        tag, n = self.u32(), self.u32(); out = []
        for _ in range(n): out.append((self.name(), self.u32()))
        return out
    def att_list(self):
        tag, n = self.u32(), self.u32(); out = {}
        for _ in range(n):
            nm = self.name(); t = self.u32(); k = self.u32(); d = self.raw(k * SZ[t]); self.raw((4 - (k * SZ[t]) % 4) % 4)
            out[nm] = d.decode(errors='replace') if t == 2 else struct.unpack('>%d%s' % (k, FMT[t]), d)
        return out
    def var_list(self):
        tag, n = self.u32(), self.u32(); out = {}
        for _ in range(n):
            nm = self.name(); nd = self.u32(); dimids = [self.u32() for _ in range(nd)]
            atts = self.att_list(); t = self.u32(); vsize = self.u32(); begin = self.u64() if self.v2 else self.u32()
            out[nm] = dict(dims=[self.dims[i] for i in dimids], atts=atts, type=t, vsize=vsize, begin=begin)
        return out

def header(url):
    n = 16384
    while True:
        try: return Hdr(get(url, 0, n - 1))
        except EOFError: n *= 4

def fetch_day(var, day, out_dir):
    dst = os.path.join(out_dir, var, day.isoformat() + '.npy')
    if os.path.exists(dst): return 'skip'
    url = '%s/%04d/%02d/%02d/%s/surface.nc' % (BASE, day.year, day.month, day.day, var)
    h = header(url)
    data = [k for k, v in h.vars.items() if len(v['dims']) >= 3]
    if len(data) != 1: raise ValueError('%s: data variables %s' % (url, data))
    v = h.vars[data[0]]
    dims, ne = v['dims'], 1
    # From 2026 some files hold two ERA5 versions side by side (time, expver, lat, lon): expver 1 (final) and 5
    # (preliminary, ERA5T). Each hour is filled in one of them; the other is all fill values. Merged below.
    if len(dims) == 4:
        if dims[1][0] != 'expver': raise ValueError('unexpected dimensions %s: %s' % (dims, url))
        ne, dims = dims[1][1], [dims[0], dims[2], dims[3]]
    (tn, nt), (yn, ny), (xn, nx) = dims
    if any(d[1] == 0 for d in v['dims']): raise ValueError('record dimension not handled: %s' % url)
    lat = np.frombuffer(get(url, h.vars[yn]['begin'], h.vars[yn]['begin'] + h.vars[yn]['vsize'] - 1)[:ny * SZ[h.vars[yn]['type']]], '>' + FMT[h.vars[yn]['type']]).astype(float)
    lon = np.frombuffer(get(url, h.vars[xn]['begin'], h.vars[xn]['begin'] + h.vars[xn]['vsize'] - 1)[:nx * SZ[h.vars[xn]['type']]], '>' + FMT[h.vars[xn]['type']]).astype(float)
    iy = np.where((lat <= LAT_N) & (lat >= LAT_S))[0]; ix = np.where((lon >= LON_W) & (lon <= LON_E))[0]
    y0, y1 = iy.min(), iy.max(); es = SZ[v['type']]
    at = v['atts']
    fill = [at[k][0] for k in ('_FillValue', 'missing_value') if k in at]
    def hour(t):
        out = None
        for k in range(ne):
            a = v['begin'] + (((t * ne + k) * ny + y0) * nx) * es
            r = np.frombuffer(get(url, a, a + (y1 - y0 + 1) * nx * es - 1), '>' + FMT[v['type']]).reshape(y1 - y0 + 1, nx)[:, ix.min():ix.max() + 1]
            if out is None: out = r.copy()
            elif fill: m = np.isin(out, fill); out[m] = r[m]
        return out
    arr = np.stack([hour(t) for t in range(nt)]).astype(np.float64)
    bad = np.isin(arr, fill) if fill else np.zeros(arr.shape, bool)
    arr = arr * (at['scale_factor'][0] if 'scale_factor' in at else 1) + (at['add_offset'][0] if 'add_offset' in at else 0)
    arr[bad] = np.nan
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    g = os.path.join(out_dir, 'grid.json')
    if not os.path.exists(g):
        json.dump({'lat': lat[y0:y1 + 1].tolist(), 'lon': lon[ix.min():ix.max() + 1].tolist(), 'var_names': {}}, open(g, 'w'))
    gj = json.load(open(g))
    if gj['lat'] != lat[y0:y1 + 1].tolist() or gj['lon'] != lon[ix.min():ix.max() + 1].tolist(): raise ValueError('grid changed: ' + url)
    np.save(dst + '.tmp.npy', arr.astype(np.float32)); os.replace(dst + '.tmp.npy', dst)
    return '%s %s %s nt=%d units=%s%s' % (var, day, data[0], nt, at.get('units', '?'), ' expver merged' if ne > 1 else '')

if __name__ == '__main__':
    out_dir, d0, d1, vars_ = sys.argv[1], datetime.date.fromisoformat(sys.argv[2]), datetime.date.fromisoformat(sys.argv[3]), sys.argv[4:]
    days = [d0 + datetime.timedelta(k) for k in range((d1 - d0).days + 1)]
    jobs = [(v, d) for d in days for v in vars_]
    t0 = time.time(); done = 0
    with ThreadPoolExecutor(int(os.environ.get('WORKERS', '8'))) as ex:
        for r in ex.map(lambda j: fetch_day(j[0], j[1], out_dir), jobs):
            done += 1
            if r != 'skip' and (done <= 5 or done % 50 == 0): print('%d/%d %.0fs %s' % (done, len(jobs), time.time() - t0, r), flush=True)
    print('done %d jobs in %.0fs' % (len(jobs), time.time() - t0))
