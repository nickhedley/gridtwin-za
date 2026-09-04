# Scope: rebuild the renewable profiles with multi-site aggregation

Not built. Written 4 Sep 2026.

---

## The problem, and its cause

Our per-unit profiles understate output against every clean observed year:

```
              wind     PV
2023          38.5   25.2
2024          36.8   26.3
our profiles  32.1   22.5
```

It is a shape bias, not a level bias. Ours as a ratio of observed, by percentile:

```
 10%  0.61        far too low in calm hours
 50%  0.80
 99%  1.01        correct at the top
```

**The cause is in the metadata.** `profiles_regional.json` records its coordinates as
"capacity-weighted centroids of real REIPPPP plants". One point per region. A centroid of the
Eastern Cape's wind farms behaves like a single wind farm, not like fourteen spread over
300 km. Single sites go calm together; a fleet does not.

That is why the deficit is concentrated in the low percentiles and vanishes at the top.

## Why this matters more than the annual total

Adequacy is decided in the calm hours. A profile too low there overstates the storage and
firm capacity a renewable build needs, and it does so in one direction. **The no-gas
frontier, the LOLE and EUE figures, and the storage duration work are all affected the same
way.**

Quantile mapping onto the observed distribution would fix the marginal distribution and
leave two things wrong: the DURATION of calm spells, which drives storage sizing, and the
correlation BETWEEN regions, which decides whether a national wind drought is real. Both
matter more for adequacy than the mean.

---

## The sharpest measure of the problem

Capacity-weighted across our four wind regions, against Eskom's observed national fleet:

```
national wind fleet below     ours    observed
  2%                          93 h        7 h    13x
  5%                         353 h       72 h     5x
 10%                         991 h      403 h   2.5x
```

**The model runs out of wind thirteen times more often than the country does.** Eastern Cape
alone sits below 2% for 1,006 hours a year in our profiles.

This is also the CALIBRATION TARGET. Rather than guessing at a site count, add points until
the calm-hour distribution matches Eskom's four observed years. That turns "how many sites is
enough" from a judgement into a measurement.

## This was already fixed once, for solar

`profiles_regional.json` records it:

```
PVGIS SARAH2 (0.05 deg, 5 km) ... Replaces MERRA-2 solar profiles (0.5 deg, 50 km)
which compressed the regional spread to 1.08x max/min; real SA solar resource has
~1.4-1.5x spread
```

Someone diagnosed exactly this pathology - a coarse or single sample compressing real spatial
variation - fixed it for solar, and the thought did not carry across to wind. Where the fleet
is more concentrated, the resource more variable, and the consequence larger.

**So this is not a new method.** It is an existing fix applied to the other technology.

## What professional practice does

Fix the aggregation, not the output. PyPSA and atlite-based studies, and NREL's work, build
per-site series and sum them with capacity weights. The fleet-diversity floor emerges from
the geography rather than being imposed afterwards. Bias correction against observed
generation is used, but as a residual adjustment AFTER aggregation.

---

## What we already hold

**The best source is the one the centroids were computed from.** The metadata says
"capacity-weighted centroids of real REIPPPP plants (from PyPSA-RSA plant data)" - so the
underlying plant locations exist and were already used once. That is better provenance than
permits, because they are BUILT plants with capacities.

`fetch_real_regional_profiles.py` and the PyPSA-RSA data are not in the current session and
must be recovered from the repo before starting.

**Fallback if they cannot be recovered:** `reea_projects.json` holds 279 wind sites with
coordinates and capacity, concentrated where the fleet is - Northern Cape 107, Western Cape
80, Eastern Cape 64. But REEA is permits, not commissioning: 258 approved wind permits total
52.9 GW against a 4.5 GW built fleet, so the permits would need matching to operational
capacity. That matching is the same problem as the Hydra Central split, open item 6.

---

## The work, in order

1. **Recover the PyPSA-RSA plant list** that the existing centroids were built from. If it
   is unavailable, fall back to REEA with the matching problem above.

2. **Calibrate the site count, do not guess it.** Pull an increasing number of sites for one
   region and stop when the calm-hour distribution matches Eskom's observed years. The 13x
   figure above is the target. A first-principles estimate is not available: a toy
   correlated-site model gave non-monotonic results and is too crude to answer this.

3. **Pull per-site series** from Renewables.ninja for the ten weather years already in use,
   so the new profiles drop into `profiles_regional_multiyear.json` unchanged in structure.

4. **Aggregate to regions** with capacity weights, then check the residual against
   ESK19679's four observed years. If a bias remains, THEN quantile-map it - applied to a
   much smaller residual, and with a real justification.

5. **Rerun everything.** The frontier, adequacy, storage duration, the no-gas result, all
   published findings in RESULTS.md. Expect them to move, and in a known direction: a higher
   calm-hour floor means less storage and less firm capacity needed.

---

## Cost and the thing that will bite

**Renewables.ninja rate-limits.** Sixty sites across ten weather years is 600 requests per
technology against ten centroid pulls today. This is days of pulling, not an afternoon, and
it needs a resumable script that does not lose progress on a rate-limit rejection.

**The scenario problem does not go away.** A 2030 fleet with 40 GW of wind has different
geography from today's 4 GW - it will sit on sites that are not yet built. Weighting by
today's built capacity is right for validating against observed years and wrong for a large
future build. The permit list is the best available proxy for where new plant goes, which is
an argument for weighting future scenarios by REEA rather than by operational capacity.

That is a modelling decision, not a data one, and it should be made deliberately rather than
falling out of the implementation.

---

## Recommendation

**Do it, and do step 3's check before step 4.** The bias is real, one-directional, and sits
in the hours that decide adequacy - which is most of what this model is for.

But **publish nothing new from the current profiles in the meantime**, and flag the affected
findings in RESULTS.md now rather than after the rebuild. The frontier and the no-gas result
are the two most quoted, and both move in the same direction once the calm-hour floor rises.
