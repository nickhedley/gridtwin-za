"""
GridTwin ZA - bias-correct the rebuilt wind profiles against Eskom observation.

WHY THIS IS THE RIGHT STEP NOW, AND WAS NOT TWO DAYS AGO

On 4 Sep a flat rescale was rejected, correctly. The fault then was SHAPE: the single-
centroid profile sat at 0.61 of observed at the 10th percentile and 1.01 at the 99th.
Scaling would have inflated peaks that were already right in order to fix a deficit living
in the calm hours.

The multi-site rebuild fixed the shape. Calm hours below 5% went from 4.1x observed to 2.1x,
and below 10% from 2.5x to 1.9x. What remains is a uniform level offset - 34.1% modelled
against 36.9% observed across 2022-23 - which is what a scaling factor is for.

This is the sequence the scope set out: aggregate properly first, then correct whatever
residual bias remains, applied to a much smaller number than the original gap.

THE CALIBRATION WINDOW IS REPRESENTATIVE, WHICH WAS CHECKED

2022 and 2023 average to CF 0.379 against a ten-year mean of 0.381 - one poor wind year and
one good one, landing on the long-run mean. Calibrating against a window that happened to be
all good years would have imported that bias instead of removing one.

CLIPPING FORCES AN ITERATION

Scaling pushes some hours above 1.0 per-unit, which is physically impossible. Clipping them
back lowers the mean, so a single multiplication undershoots. The factor is solved
iteratively until the corrected mean matches the target.

WHAT IS PRESERVED

The uncorrected mean is written into the file's metadata. A calibrated profile that does not
say so is indistinguishable from an independently accurate one, and the difference matters:
after this, the calm-hour check can no longer tell you whether the underlying method is
sound, because the level now matches by construction.

USAGE
    python3 bias_correct_wind.py --target 36.9
    python3 fetch_multisite_profiles.py --check --out profiles_multiyear_corrected.json
"""
import json, csv, argparse, statistics

SRC = 'profiles_multiyear_rebuilt.json'
OUT = 'profiles_multiyear_corrected.json'
CAP = 'nodal/regional_renewable_capacity.json'
ESKOM = 'ESK19679.csv'
WINDOW = ('2022', '2023')


def observed_cf(path, years):
    tot = cap = 0.0
    with open(path) as fh:
        for row in csv.DictReader(fh):
            if row['Date Time Hour Beginning'][:4] not in years:
                continue
            try:
                g = float(row['Wind']); c = float(row['Wind Installed Capacity'])
            except (ValueError, KeyError):
                continue
            if c > 0:
                tot += g; cap += c
    return 100 * tot / cap if cap else None


def national_cf(prof, wcap):
    """Capacity-weighted national mean, over every year in the file."""
    sc = prof.get('scale', 1)
    regs = [r for r in prof['wind_pu'] if wcap.get(r, 0) > 0]
    tot = sum(wcap[r] for r in regs)
    s = n = 0
    for y in prof['wind_pu'][regs[0]]:
        for h in range(len(prof['wind_pu'][regs[0]][y])):
            s += sum(prof['wind_pu'][r][y][h] * wcap[r] for r in regs) / tot / sc
            n += 1
    return 100 * s / n


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--src', default=SRC)
    ap.add_argument('--out', default=OUT)
    ap.add_argument('--eskom', default=ESKOM)
    ap.add_argument('--target', type=float, default=None,
                    help='target national CF in percent. Default: measured from the Eskom '
                         'file over 2022-23.')
    a = ap.parse_args()

    prof = json.load(open(a.src))
    cap = json.load(open(CAP))
    wcap = {}
    for src in cap.get('by_source', {}).values():
        for r, v in (src.get('wind_mw') or {}).items():
            wcap[r] = wcap.get(r, 0) + (v or 0)

    target = a.target if a.target is not None else observed_cf(a.eskom, WINDOW)
    if target is None:
        raise SystemExit('could not measure the observed CF')
    before = national_cf(prof, wcap)
    print(f'  modelled national CF   {before:.2f}%')
    print(f'  observed 2022-23       {target:.2f}%')
    print(f'  raw factor             {target/before:.4f}\n')

    sc = prof.get('scale', 1)
    factor = target / before
    for it in range(12):
        # Apply and clip, then measure. Clipping at 1.0 removes some of the uplift, so the
        # factor has to be solved rather than computed once.
        test = {}
        for r, yy in prof['wind_pu'].items():
            test[r] = {y: [min(sc, round(v * factor)) for v in ser] for y, ser in yy.items()}
        got = national_cf({'wind_pu': test, 'scale': sc}, wcap)
        err = target - got
        print(f'  iteration {it+1}: factor {factor:.4f} -> {got:.2f}%  (off by {err:+.2f})')
        if abs(err) < 0.02:
            break
        factor *= target / got

    clipped = sum(1 for r in test for y in test[r] for v in test[r][y] if v >= sc)
    total = sum(len(test[r][y]) for r in test for y in test[r])

    out = dict(prof)
    out['wind_pu'] = test
    out['meta'] = dict(prof.get('meta', {}))
    out['meta'].update({
        'bias_corrected': f'6 Sep 2026. Wind scaled by {factor:.4f} so the capacity-weighted '
                          f'national mean matches Eskom observation over {"-".join(WINDOW)}.',
        'cf_before_correction': round(before, 3),
        'cf_after_correction': round(got, 3),
        'correction_target': round(target, 3),
        'correction_warning': 'This file is CALIBRATED. Its level matches observation by '
                              'construction, so a check comparing its mean CF against Eskom '
                              'no longer tests the underlying method - only the arithmetic. '
                              'The SHAPE is uncalibrated and remains a real test: calm-hour '
                              'counts were 2.1x observed at the 5% threshold before this.',
        'hours_clipped': clipped,
    })
    json.dump(out, open(a.out, 'w'))
    print(f'\nWrote {a.out}')
    print(f'  final factor {factor:.4f}, {clipped:,} of {total:,} hours clipped at 1.0 '
          f'({100*clipped/total:.2f}%)')
    print(f'\nNext: python3 fetch_multisite_profiles.py --check --out {a.out}')
    print('The mean CF will now match by construction. Read the calm-hour ratios -')
    print('those are still a real test of the shape.')


if __name__ == '__main__':
    main()
