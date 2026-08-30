"""Open Location Code decode + recoverNearest, enough to resolve short codes."""
A = '23456789CFGHJMPQRVWX'
SEP_POS, SEP = 8, '+'
PAIR_RES = [20.0, 1.0, .05, .0025, .000125]

def encode(lat, lng, length=10):
    lat = min(max(lat, -90), 90); lng = (lng + 180) % 360 - 180
    if lat == 90: lat = 90 - 1e-9
    lat += 90; lng += 180
    code = ''
    for i in range(length // 2):
        res = PAIR_RES[i] if i < len(PAIR_RES) else PAIR_RES[-1] / (20 ** (i - len(PAIR_RES) + 1))
        d = int(lat / res); code += A[d]; lat -= d * res
        d = int(lng / res); code += A[d]; lng -= d * res
        if len(code) == SEP_POS: code += SEP
    return code

def decode(code):
    c = code.replace(SEP, '')
    lat = lng = 0.0
    for i in range(0, len(c), 2):
        j = i // 2
        res = PAIR_RES[j] if j < len(PAIR_RES) else PAIR_RES[-1] / (20 ** (j - len(PAIR_RES) + 1))
        lat += A.index(c[i]) * res
        if i + 1 < len(c): lng += A.index(c[i + 1]) * res
    last = PAIR_RES[min(len(c)//2 - 1, len(PAIR_RES)-1)]
    return (lat - 90 + last/2, lng - 180 + last/2)

def recover(short, ref_lat, ref_lng):
    pad = SEP_POS - short.index(SEP)
    res = 20 ** (2 - pad / 2)
    half = res / 2
    prefix = encode(ref_lat, ref_lng)[:pad]
    lat, lng = decode(prefix + short)
    if ref_lat + half < lat and lat - res >= -90: lat -= res
    elif ref_lat - half > lat and lat + res <= 90: lat += res
    if ref_lng + half < lng: lng -= res
    elif ref_lng - half > lng: lng += res
    return lat, lng

if __name__ == '__main__':
    import math
    def gc(a,b,c,d):
        R=6371.0; p1,p2=math.radians(a),math.radians(c)
        dp=math.radians(c-a); dl=math.radians(d-b)
        x=math.sin(dp/2)**2+math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
        return 2*R*math.asin(math.sqrt(x))
    # sanity: the Chatty code resolved on 28 Aug must reproduce
    got = recover('5G7F+J6', -33.96, 25.60)
    print(f'CHECK  Chatty 5G7F+J6  -> {got[0]:.6f}, {got[1]:.6f}   (recorded -33.835938, 25.523063)')
    print(f'       error {gc(got[0],got[1],-33.835938,25.523063)*1000:.1f} m')
    for name, code, rl, rg in [
        ('Durban South', '2WXV+GQ', -29.8587, 31.0218),
        ('Ottawa',       '82CX+7Q', -29.6800, 31.0500),
    ]:
        la, lo = recover(code, rl, rg)
        print(f'{name:<14}{code:<9}-> {la:.6f}, {lo:.6f}')
