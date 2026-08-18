## BUG HUNT SESSION 5: STRUCTURAL AND CODE AUDIT (17 Aug 2026)

validate_structure.js + control_inventory.json. 8/8. Static analysis plus a DOM
pass, hunting things the code no longer does, does twice, or does in a way that
swallows a legitimate value. None of these produce a wrong-LOOKING number, which
is exactly why they survive.

VERIFIED AGAINST ALL THREE BUG CLASSES IT EXISTS FOR:
  * duplicate FIXED key (the lcoePs bug)   -> caught: "the LATER definition wins"
  * falsy-zero x || N (the CCS bug)        -> caught: "use ?? so 0 is honoured"
  * a control disappearing (the reorder)   -> caught, but only after a fix, below

THE CONTROL-COUNT CHECK WAS NOT ENOUGH ON ITS OWN, and finding that out mattered.
Comparing definitions against rendered controls passes when a DEFINITION is
deleted, because both counts drop together. The 17 Aug reorder bug was that shape:
a script rebuilt SLIDERS, placed everything it recognised and silently lost the
one id it did not, so the repurpose toggle vanished while state.repurpose was
still read by the dispatch engine - the model ran permanently on its default with
no way to change it. The inventory is now pinned to control_inventory.json, so
losing a control fails loudly while adding one is a deliberate baseline update.

CHECKS: duplicate keys in FIXED; `param || nonZeroDefault` anywhere in live code;
orphaned functions; every fetch() target existing on disk; every defined control
rendering; the inventory baseline; every slider carrying a note; every PRESET key
mapping to something real.

ONE REAL FIX: `p.battHours || 4` in my own battFleetHours fallback from earlier
the same day. Low impact — it is only reached when battPower is zero — but it is
the exact pattern that caused seven CCS bugs, and consistency matters more than
the individual case.

FIVE ORPHANED FUNCTIONS FOUND, now documented rather than silently dead:
dcFlows (the DC power flow engine built the same day and never wired to a panel —
precisely the runNodalYear trap repeating), plus subLookupArea, resolveColor,
mixHex and setTooltip, small helpers left from earlier iterations. Kept and
labelled, because the distinction that matters is whether the next person can
tell live code from dead.

THREE OVER-STRICT CHECKS CORRECTED, each a false-positive class worth naming:
  * Orphan detection counted only `fn(`. Functions passed as CALLBACKS or wired
    through an onclick attribute carry no parentheses, so twelve live functions
    were reported dead. Then, once fixed, functions defined in nodal/ files were
    still miscounted because the raw sources were not searched.
  * Requiring a note on every slider flagged the LCOE group, which deliberately
    shares one explanation rather than repeating it nine times.
  * Comment-stripping is essential before any of this: this codebase contains
    long comments explaining these very bugs, so a raw scan reports the
    documentation as the defect.

## BUG HUNT SESSION 4: PER-CARRIER BENCHMARKS (17 Aug 2026)

validate_benchmarks.js. 18/18. Reconciles EVERY CARRIER against published data,
not just the national total - a total can match while two carriers are wrong in
opposite directions, which is exactly how the wind nameplate and the nuclear
basis error survived for months.

    carrier          model    bench     gap    band
    coal            160.98   164.00    -1.8%   ±6%
    nuclear          11.41    10.95    +4.2%   ±8%
    wind             12.92    11.60   +11.3%   ±15%
    solarUtility      6.21     6.50    -4.4%   ±20%
    hydro             2.89     2.90    -0.3%   ±25%
    imports           8.56     8.56    +0.0%   ±5%
    co2             169.90   175.00    -2.9%   ±12%

Every entry carries BOTH a tolerance and the reason a gap exists. The rule: a gap
with a documented reason is fine; a gap without one is a bug not yet found. A wide
band with a vague reason is how a real error hides, so each wide band justifies
itself in the file.

Basis handled per carrier: the model is SENT-OUT, Ember publishes GROSS, and the
conversion uses each carrier's own auxiliary rate - coal 7.7%, nuclear 5%,
renewables nil. Applying one national factor is what made coal look 11% short on
16 Aug.

CAPACITY FACTORS ARE CHECKED SEPARATELY, and the reason is the point of the whole
session: energy and CF errors CANCEL. Verified by reintroducing the wind nameplate
bug (wind_pu inflated 1.1668x, the original error):

    wind energy   15.07 TWh vs 11.60 benchmark   +29.9%   CAUGHT, band ±15%
    wind CF       37.3%                          INSIDE the 28-38% band

The capacity-factor test alone would have missed it entirely. It took the energy
reconciliation to catch it, and the original bug survived precisely because the
energy total matched Ember to 0.2% while the nameplate was 578 MW light.

One directional assertion beyond the bands: WIND MUST READ ABOVE the
NTCSA-metered benchmark, because the model counts privately wheeled plant that
Ember excludes. A model figure BELOW it would mean capacity is missing, and a
symmetric tolerance would not catch that.

## BUG HUNT SESSION 3: CROSS-PANEL CONSISTENCY (17 Aug 2026)

validate_consistency.js. 13/13. Unlike sessions 1 and 2 this reads the RENDERED
DOM, because the bug class is specifically "the engine is right but the panel
shows something else".

VERIFIED AGAINST THE BUG IT EXISTS FOR. Reverting the psDailyFloor fix makes it
report: "at the peak hour storage delivers 0 MW while being counted as firm
capacity". That is exactly the contradiction that stood undetected for weeks -
the adequacy panel counted 2.9 GW of pumped storage as firm while dispatch
produced 0.04 TWh, both numbers on screen, nothing comparing them.

Checks: KPI panel against the engine for energy, renewables, curtailment, average
cost and replacement cost; every peak-demand figure on the page agreeing; storage
counted as firm actually discharging over the year AND present at the annual peak;
regional wind and solar summing to the national constants; regional rooftop net of
wheeled solar summing to FIXED.rooftopMW; the VPP pool reaching the optimiser
matching the sliders; and the mix totalling sensibly.

FOUR FIRST-RUN FAILURES, ALL MY CHECK RATHER THAN THE MODEL — and each one is a
definitional trap worth recording:

  * "Energy supplied" INCLUDES IMPORTS. It is everything delivered to the system,
    not domestic generation. I compared against the domestic total and reported a
    9 TWh discrepancy that did not exist.
  * Renewables prints as a WHOLE PERCENT. 18 against 18.458 is display rounding.
    Compare at the precision actually shown.
  * A loose peak-demand regex matched "firm capacity 39.2 GW" because the word
    peak appeared within forty characters. Then, once anchored, it matched prose
    that DELIBERATELY contrasts the model with Eskom's reported ~27 GW - which is
    the caveat explaining the definitional gap, not a contradiction. Now excludes
    passages naming Eskom.
  * ROOFTOP IS DELIBERATELY NOT A DIRECT SUM. rooftop_mw_by_region.json is kept
    VERBATIM ESKOM so the source stays traceable, and nodal_dispatch.js subtracts
    privately wheeled solar per region at load time - otherwise that plant is
    counted once as supply and again inside the rooftop netting. The 488 MW gap I
    flagged is exactly by_source.private.solar_mw, i.e. the subtraction working.
    The identity to assert is file MINUS wheeled == FIXED, which now passes.

That last one is the most instructive: a 5.7% discrepancy in a capacity constant
looked exactly like the phantom-MW bug of 15 Aug, and was in fact the FIX for it
working correctly. Reading the code before believing the check mattered.

## BUG HUNT SESSION 2: PARAMETER RESPONSE MATRIX (17 Aug 2026)

validate_response.js + response_matrix.json. Sweeps every control at six points
across its range and records which of eight outputs move and in which direction.
72/72 across 58 controls x 8 outputs. Baseline committed - a future change that
alters the matrix without explanation is a regression, and diffing it is a much
faster review than reading a diff.

VERIFIED AGAINST A REAL BUG. The CCS falsy-zero of 15 Aug was reintroduced
(p.ccsCaptureRatePct ?? 90 back to || 90) and the detector caught it exactly:

    capture   0%  ->  co2  23.97 Mt   <- identical to 90%, the tell
    capture  45%  ->  co2 123.58 Mt
    capture  90%  ->  co2  23.97 Mt

FIVE ITERATIONS, and every wrong version is worth recording because each was
plausible:

  1. NO ENABLING CONTEXTS. Eight controls reported dead because the thing they
     govern was off - interruptible load with no shortage, VPP pool at zero
     enrolment, gas cost with no gas running. Same discipline stress_deep uses:
     every exemption carries its reason.
  2. ZERO-CHECK COMPARED AGAINST A CONTEXTLESS BASE, so every context-dependent
     parameter looked identical at zero. Twenty lines of noise.
  3. NO MONOTONICITY GATE. The falsy-zero signature is "zero sits on the wrong
     side of the trend", which says nothing when there is no trend. The VPP
     controls are legitimately non-monotonic - peak falls to about 50% enrolment,
     then relocates to the small hours and rises - and produced eleven false
     positives.
  4. NO MATERIALITY THRESHOLD. Sub-0.5% dispatch wiggles from a marginal unit
     changing order were being reported alongside real findings. A genuine
     falsy-zero bug is a STEP - 23.97 against 123.58 - so anything under 1% of
     base is noise.
  5. IT ONLY ITERATED SLIDERS. Several meaningful-zero constants live in FIXED
     and are reachable only by URL - including every CCS parameter. The
     reintroduced bug passed 65/65 because the harness never touched it. An
     EXTRA block now sweeps them explicitly.

  Plus one self-inflicted: a comment containing backticks inside a template
  literal terminated the literal and broke the file.

TWO CONTROLS CORRECTLY EXEMPTED, both with reasons in the code:
  * outVolPct drives runMC() - the Monte Carlo risk panel - and nothing in
    simulate(). It is the VOLATILITY of the outage distribution, which only means
    anything across repeated draws.
  * battHours governs the EXISTING fleet duration; newBattHours governs new
    build. Sweeping it with 10 GW of new battery swamped an 800 MW fleet and the
    control looked dead at a 0.3% response.

REMAINING NOTES ARE NOT BUGS: drShiftPct and vppGeyserPoolMW trip the trend test
because both have genuinely non-monotonic responses that the monotonicity gate
does not fully filter at the margin. Left visible rather than suppressed - they
are cheap to re-check and suppressing them risks hiding a real one later.

## BUG HUNT SESSION 1: PHYSICAL INVARIANTS (17 Aug 2026)

validate_invariants.js. Asserts what must be true in every one of 8,760 hours,
across 11 scenarios including every corner - everything off, everything maxed, a
fleet that cannot meet load, and a system drowning in surplus. 145/147 passing.

Checks: supply equals demand hourly; nothing negative; nothing exceeds capacity;
curtailment cannot exceed available VRE; part-load multiplier >= 1 when coal runs
and exactly 1 when idle; discharge within power rating; round-trip physical;
CO2 at or above coal energy x emission factor; costs non-negative; peak sane; and
each storage fleet cycling a plausible number of times a year.

IT FOUND A REAL BUG, which is the point.

  LONG-DURATION STORAGE SITS IDLE IN A HIGH-VRE SYSTEM
    scenario  +50 GW wind, +50 GW PV, +30 GW batt, +5 GW PS, +8 GW VRFB, +8 GW Fe-air
    battery-class capacity   987 GWh
    battery-class discharge  0.023 TWh  =  0.0 cycles/yr
    pumped storage           6.209 TWh  = 41   cycles/yr  (healthy)
    CURTAILED                116.1 TWh

  987 GWh idle while 116 TWh is thrown away is not physically sensible. Pumped
  storage cycles fine, so the psDailyFloor fix of 16 Aug repaired the PS path
  ONLY - the battery-class path appears to have the same ceiling collapse that
  pumped storage had. At 987 GWh against 46.8 GW of power the fleet needs 21
  hours at full power to fill, and the charging target looks to be sized on a
  daily cycle that cannot reach it. NOT YET FIXED - first task next session.

RESOLVED, AND THE MODEL WAS RIGHT ALL ALONG. The idle-storage finding was
investigated to the end. It is NOT a bug, and two plausible-sounding fixes were
written before the diagnosis was correct.

    5,744 hours had coal generating 18 TWh WHILE 116 TWh was curtailed
    simultaneously.

Coal was at its MUST-RUN floor - minimum stable level, ramp-readiness for the
next peak, and the synchronous generation floor - so it was already serving the
load. There was no deficit for storage to discharge into, and storage cannot
displace plant that physically cannot turn down. The battery charged, filled, and
correctly stopped.

    retire 0 GW coal    battery 0.02 TWh over  37 hours
    retire 20 GW coal   battery 0.04 TWh over  32 hours
    retire 35 GW coal   battery 3.40 TWh over 883 hours, curtailment -22 TWh,
                                              CO2 -20 Mt

Storage was never broken. Coal was in the way.

THE RESULT IS WORTH KNOWING IN ITS OWN RIGHT: at very high VRE the binding
constraint is COAL MUST-RUN, not storage. Building large amounts of storage
without retiring coal achieves almost nothing. That is a real planning insight and
the model produced it correctly.

WHAT I ALMOST BROKE: I was one step from adding an "economic displacement" pass to
make storage discharge against coal. It would have let storage push coal below its
minimum stable level and synchronous floor - physically impossible, and it would
have quietly improved every high-VRE result by breaking the constraint that makes
those results honest.

TWO GENUINE FIXES WERE MADE ALONG THE WAY, both real bugs even though neither was
the cause:
  * Charging credited p.battEff (lithium, 0.88) to EVERY technology. battEffMix
    was introduced on 17 Aug for exactly this and then used in only one of the
    three places that add to battSoc, so an iron-air fleet at 45% round trip was
    charged as though it were lithium.
  * battDailyFloor sized the fleet on p.battHours - the lithium duration - even
    when the fleet averages 21 h.

THE CHECK WAS REMOVED, not retargeted. Idle storage is not a reliable bug signal:
it is frequently the correct answer, and asserting otherwise would have driven a
wrong fix into the dispatch. The pumped-storage cycling check STAYS, because PS
has an explicit daily cycling discipline and its collapse was a genuine bug.
138/138.

THREE ITERATIONS TO GET THE CHECK RIGHT, each worth recording:
  * v1 keyed the storage check on CURTAILMENT being present. The default scenario
    curtails nothing, so it never ran - the reintroduced storage bug passed
    132/132.
  * v2 measured cycles but SUMMED pumped storage and batteries. The reintroduced
    bug passed at 11.8 cycles/yr because PS collapsed to 0.7 while the battery
    rose from 0.27 to 0.70 TWh and covered for it. Aggregating hid the very bug
    the check exists to find.
  * v3 checks each fleet separately. Verified by reintroducing the 16 Aug storage
    bug: pumped storage drops to 0.7 cycles/yr and three scenarios fail.

  A check that has never been shown to fail on a known bug is not evidence of
  anything. Reintroducing the bug to prove the guard fires is the step that
  matters, and it caught two bad versions of my own check.

TWO EARLY FAILURES WERE THE CHECK'S FAULT, NOT THE MODEL'S:
  * round-trip 44.99 in a coal-retired scenario - the system was short 8,063 of
    8,760 hours, so there was nothing to charge from and storage simply drained
    its opening state. Ratio now only evaluated when charging is material.
  * CO2 below the coal floor with CCS on - capture legitimately breaks that
    identity. Floor now applies only with capture off.

# GridTwin ZA — handover

**Live site:** https://nickhedley.github.io/gridtwin-za/
**Repo:** github.com/nickhedley/gridtwin-za
**Handover written:** 14 August 2026

> Supersedes the handover of the same date. The capacity rebuild described there is
> **done**; what follows is the resulting state, the open items, and the rules that
> came out of it. Two identities in the original brief were wrong and are corrected
> below. If you spot others, say so rather than fudging a test to pass.

---

## Current state

`regional_renewable_capacity.json` and `ipp_pipeline.json` have been rebuilt from
commissioned-plant figures rather than bid-window awards. Both are generated by
`nodal/build_capacity.py` — **recompute, never hand-edit**.

### Operational capacity (IPP Office Q4 2025/26, as at 31 March 2026, p.18)

REIPPPP, tagged `source: reipppp`:

```
solar (utility PV)  2,663 MW   Northern Cape 1,570, Western Cape 359, North West 275,
                               Free State 271, Limpopo 118, Eastern Cape 70
wind                4,042 MW   Northern Cape 1,738, Eastern Cape 1,566, Western Cape 738
CSP                   600 MW   Northern Cape
hydro                  18 MW   Northern Cape 10, Free State 8
biomass                25 MW   Mpumalanga
landfill gas            8 MW   Gauteng
```

Private / wheeled, tagged `source: private`, from `nodal/pfl_private_h1_2026.json`:

```
solar                 488 MW   Limpopo 388, North West 100
wind                  470 MW   Eastern Cape 330, Northern Cape 140
```

**Engine-facing totals: solar 3,151 MW, wind 4,512 MW.** `FIXED.windMW` is derived from
the wind figure and must not be hand-edited. The private block covers
**H1 2026 only** — see open item 1. Captive (behind-the-meter) capacity of 88 MW is
listed in the source and deliberately excluded: it suppresses demand rather than adding
supply.

Hydra Central is **zero for every technology**. See "Known distortions" below.

### Pipeline — 6,971 MW

```
provincially allocated  1,457 MW
unallocated             5,514 MW   BW7 (3,940), BESIPPPP BW2/BW3 (1,231),
                                   RMIPPPP construction (203), BW6 sixth project (140)
terminated              1,424 MW   BW5 cancellations, outside the identity
```

---

## The two identities

Both are asserted by `validate_capacity.js`.

**1. Within the IPP Office universe (REIPPPP BW1–BW6, reached financial close):**

```
procured = online_actual + under_delivery + in_construction
   7,825 =         7,355 +             26 +             444
```

Four terms, not three. `under_delivery` is contracted capacity on projects that came
online below their contracted figure. Terminated projects are **not** part of this —
IPP Office's "Capacity Procured" already excludes anything that never reached
financial close.

**2. Preferred bidders reconcile to financial close plus pre-FC:**

```
preferred_bidders = reached_FC + pre_FC
           12,405 =      7,825 +  4,580     (BW6 awaiting CC 640 + BW7 3,940)
```

**3. National constants, decomposed by source — both PENDING:**

```
FIXED.pvUtilityMW = sum(solar tagged reipppp) + sum(solar tagged private)
FIXED.windMW      = sum(wind  tagged reipppp) + sum(wind  tagged private)
```

The IPP Office covers REIPPPP and RMIPPPP only. It does not report, and does not
allocate by province, the privately procured wheeled capacity. So every regional entry
carries a `source` tag and the national constant is the sum of both components.

```
wind    4,042 + 470 = 4,512  vs  windMW      4,512   PASS
solar   2,663 + 488 = 3,151  vs  pvUtilityMW 4,974   gap 1,823 MW, PENDING
```

**Wind now passes, and `windMW` was corrected to 4,512 as a result.** It previously read
4,458, built as 3,600 + 858, where the 3,600 baseline had muddled provenance and the 858
mixed grid-supply with wheeled capacity — a figure that could not be decomposed. The two
sources are disjoint universes: the IPP Office does not cover private procurement, so
Umsobomvu and the three Impofu farms appear once, in the private bucket.

Read that PASS for what it is. `windMW` is now **derived** from these components, so the
equality is a consistency check, not independent corroboration — it confirms the constant
and the file agree, and fails loudly if either is edited alone. It will also fail if
pre-2026 private **wind** is later found, which is the correct behaviour: the constant
would then be understated and must be re-derived, not patched.

Solar stays PENDING. `meta.private_coverage` is `h1-2026-only`, and the validator only
evaluates the solar identity when it reads `complete`. **Do not let it go green on a
widened tolerance** — the 1,823 MW residual is the finding.

This is what the source tagging bought: the overshoot only became visible once
`by_source` was populated. A single opaque total had hidden a badly derived constant.
Keep identity 3 as a permanent assertion, not a one-off check.

---

## Validation — all must pass

```
node stress_suite.js            290/290
python3 audit.py <index.html>    29/29
node validate_outputs.js         26/26
node eng5.js                       6/6   monotonicity
node jsdom_local2.js            renders without error
node validate_capacity.js        14/14   (+1 pending — see identity 3)
node validate_lp.js              18/18
```

Scripts expect a `testroot/` containing `index.html` and a `nodal/` folder, or take the
root as `argv[2]`. `jsdom_local2.js` reports two `ctx.createPattern is not a function`
errors — that is jsdom lacking canvas, not a regression.

### Why the last two exist

The first five returned a **full pass against the old, provably wrong capacity file**.
Nothing tested the capacity data or the LP build path, so those bugs could have sat
there indefinitely. Run any new check against the *previous* state as well as the new
one: a validator that cannot fail proves nothing. `validate_capacity.js` scores 3/8
against the pre-rebuild files; `validate_lp.js` scores 5/18 against the pre-fix code.

`validate_lp.js` works by **perturbation, not inspection** — it changes a field on
`FIXED`, rebuilds the LP, and asserts the text moved. That survives any future
replumbing, where a source-inspection test would rot.

`validate_capacity.js` shells out to `python3` for the fingerprint check. This is
deliberate: the canonicalisation is Python's `json.dumps(sort_keys=True,
separators=(',',':'))`, which writes `1570.0` where `JSON.stringify` gives `1570`. Do
not "simplify" it to `JSON.stringify`.

---

## The rule that came out of this

**No constant appears twice.**

Six instances of the same shape were found in `index.html` alone: four clusters of
duplicated constants, a dead top-level `projects` array in the pipeline file, and a
documentation row describing a fleet the model wasn't running. In each case a second
copy sat unread until it silently disagreed.

The worst was `const S = opts.state || FIXED` in **both** LP functions. `state` is a
sparse SLIDERS-only overlay and is always passed, so `FIXED` was never consulted and
every constant read `undefined`, falling through to a hardcoded literal. The capacity
expansion LP ran on wind 3,600 MW while `FIXED` said 4,458. Fixed to
`{ ...FIXED, ...(opts.state || {}) }`, matching the pattern already used at three other
sites.

Corollaries:

- A fallback that duplicates a value is how these start. But **check before deleting
  one** — if the read is already `undefined`, the fallback is load-bearing and removing
  it produces NaN coefficients. Fix the resolution first, verify, then remove.
- A fallback whose value *differs* from `FIXED` is a latent wrong answer waiting for the
  resolution to change.

---

## Known distortions — flag when touching anything downstream

**Hydra Central is zero, and this affects the nodal network model.** It is a
transmission supply area spanning the Karoo across the Northern Cape / Eastern Cape
boundary (Hydra, Gamma, Koruson, Aquila). The IPP Office reports by province, so an
unknown slice of the Northern Cape's 3,918 MW physically connects at Hydra rather than
in the Northern Cape proper. That slice cannot be sized without named projects, so the
full provincial figure sits in Northern Cape and Hydra Central reads near-empty. A
wrong split would be worse than an absent one, but this is a known distortion, not a
settled state.

To restore it: match named operational projects to nearest substation using
`substations_compact.json` (185 substations with coordinates and supply-area
assignments). `reea_projects.json` already does this for 2,597 environmental
authorisations — but REEA covers permits, not commissioning, so it solves the location
half only.

**RMIPPPP is excluded from the regional file.** About 225 MW of contracted operational
capacity across Northern Cape, Eastern Cape and Western Cape; the report names the three
provinces but gives no split.

**Private/wheeled capacity is incomplete.** `by_source.private` holds H1 2026 only
(958 MW wheeled). Plant commissioned before January 2026 is not in the PFL H1 monitor
and is not here.

---

## Final platform sweep (15 Aug 2026)

Last full pass before hand-off. Two real bugs, three comment contradictions, and
a standing list of the weak assumptions that remain BY DESIGN.

**Bug 1 - nodal engines still double-counted the wheeled 488 MW.** The
pvUtilityMW correction fixed the national engine, but both nodal consumers
(nodal_engine.js and nodal_dispatch.js) net rooftop off demand from
rooftop_mw_by_region.json - which contains the wheeled fleet - while the same
plant generates as supply from by_source.private. Both now subtract
by_source.private.solar_mw per region at load (rooftop file stays verbatim
Eskom). Limpopo was the dramatic case: 388 of its 561.8 MW "rooftop" was Mooi
Plaats + Bolobedu. National reconciles exactly: 9,107.4 - 488 = 8,619.4.

**Bug 2 - a fourth and fifth `coalEAFPct || 64`.** Two more sites missed by the
earlier fix (the build-LP invocation and the CSV export filename). The LP one
mattered doubly because the EAF slider's minimum is now 0, making EAF=0
reachable from the UI. All five sites now use `??`. The one remaining `|| 0` is
a pure display of the value itself, where zero is fine.

**Comment contradictions removed:** the pre-correction pvUtilityMW paragraph
("4,974 stands with a known gap") still sat in FIXED above the new derivation
saying the opposite; the rooftop-distortion note still described the double
count as uncorrectable; and the hybrid window comment now states the half-hour
approximation (hourly model runs the 05:00-21:30 contract window to 22:00 -
long rather than short, because the obligation is availability, not a cap).

**Verified clean:** the build worker is a pure HiGHS solver (no stale copy of
any dispatch or cost logic); every remaining `|| <number>` fallback is on a
parameter that cannot legitimately be zero or is display-only.

**Weak assumptions that remain, deliberately - the honest list:**
- Hydro at a flat 0.55 CF and imports at 0.85 all year: no drought risk, no
  Cahora Bassa outage scenario. Both are fixed infeeds.
- Demand is the single 2025 hourly series scaled; no structural reshaping
  (electrification, mining closures) beyond the growth slider.
- battEff 0.88 applied once on charge; no degradation, no calendar ageing.
- The 2026-baseline CAPTURE table's regional SHAPE is judgement calibrated to
  IRP/Meridian commentary; the LEVEL now tracks the live model but the regional
  spread does not re-derive per scenario.
- Wheeling TUoS is a distance-scaled approximation of NTCSA's zonal tariff, not
  the actual zone matrix; losses likewise.
- BTM_DISPLACED_EF 0.95 is a judgement between the model's grid average (0.78)
  and its marginal coal (1.04).
- Hybrid CF 0.85 within its window is asserted, not derived from RMIPPPP
  performance data (none published).

## Two-pass professional audit (16 Aug 2026) - two real defects

ENERGY-SYSTEM PASS. Physical limits, merit order, capacity factors, emissions
consistency and seasonality all checked out - coal peaks at 98% of its available
capacity, ramps stay well inside fleet capability, CO2 reconciles exactly to
carrier x emission factor, winter/summer ratio 1.15. ONE serious defect:

  STORAGE WAS IDLE. 2.9 GW of pumped storage produced 0.042 TWh for the year
  against the 3-4 TWh Eskom's schemes actually deliver, and charged in ZERO
  hours. Cause: the charge ceiling was gated on anticipatedShortfall ALONE -
      psTargetCeiling = min(psEnergyMWh*0.85, anticipatedShortfall[h])
  and in a surplus system that term is zero almost everywhere, so the ceiling
  collapsed, storage could never recharge, and it coasted on its opening state
  of charge before sitting idle. The adequacy panel meanwhile counted the same
  2.9 GW as FIRM capacity, so the two panels disagreed. Fixed by adding a daily
  cycling floor (enough stored energy to cover the plant's rating through a
  4-hour evening peak) while keeping anticipatedShortfall as the term that lifts
  the target higher before genuine stress. Result: PS 0.04 -> 3.45 TWh, charging
  4.79 TWh, round-trip 0.776 (real PS is 75-78%), peak coal 27.97 -> 27.60 GW,
  coal +1.1 TWh which is exactly the round-trip loss.

CODER PASS. 149 top-level declarations, no duplicate names, 12 fetches with 9
catch handlers, no JSON.parse without a guard. ONE class of defect:

  SEVEN MORE FALSY-ZERO BUGS. `x || N` returns N when x is 0. Confirmed live:
  setting ANY CCS slider to zero changed nothing - capture rate 0 still reported
  23.3 Mt instead of 220.7. Converted 12 sites to `??`: ccsPenaltyPct,
  ccsCaptureRatePct, ccsOpexR, ccsCapexR, ccsTsR, coalInstalledMW, battHours.
  This is the same bug found in coalEAFPct on 15 Aug, so a standing guard is now
  in stress_deep.js (check G0) that sweeps every parameter whose zero is a real
  scenario and fails if the answer does not move.

Also noted, not defects: 7 declarations referenced once (event handlers wired
through onclick attributes, so the reference is in markup not script).

## Basis audit: every carrier is now sent-out (16 Aug 2026)

Prompted by asking whether the gross/sent-out distinction was applied
CONSISTENTLY. It was not - nuclear was the one carrier on the wrong basis.

    coal        residual; coefficients are Eskom per-sent-out      SENT-OUT  ok
    wind        Eskom ESK19243 metered hourly profile              SENT-OUT  ok
    utility PV  Eskom ESK19243 metered hourly profile              SENT-OUT  ok
    CSP         Eskom normalised feed-in profile                   SENT-OUT  ok
    hydro       fixed infeed                                       SENT-OUT  ok
    imports     metered at the border                              SENT-OUT  ok
    rooftop     behind-the-meter; netted against a demand series   consistent
                built by adding rooftop back, so the two agree
    nuclear     nuclearCF                                          WAS GROSS

nuclearCF had been set to 0.75 from Ember's 11.5 TWh / 1.86 GW = 70.6% - but
that is GROSS. At ~5% house load the observed SENT-OUT CF is 67.1%, so 0.75 sat
12% above the figure it was meant to match. Corrected to 0.70, which keeps the
intended modest recovery allowance on the right basis. Nuclear 12.20 -> 11.41
TWh; coal absorbs the difference, 157.0 -> 159.9 TWh.

DOES THE BASIS EXPLAIN THE RENEWABLES GAP? No. Renewables carry no meaningful
auxiliary load, so gross = sent-out for them and converting Ember changes their
figures not at all. Wind stays +22% and solar +11% against Ember, and those
remain what was already documented: 470 MW of privately wheeled wind Eskom does
not meter, unmodelled network curtailment, and a rooftop capacity factor (17.6%)
above the 14.9% Ember implies - the derate acknowledged as soft.

## RESOLVED: coal "11% below Ember" was gross vs sent-out (16 Aug 2026)

NOT a model error. Ember reports GROSS generation; this model produces SENT-OUT.

THE TEST THAT SETTLES IT. Our coal is purely residual - demand minus every other
source - so the coal gap IS the total supply gap, and the total is the right
thing to test. Converting Ember to a sent-out basis at standard auxiliary rates
(coal 7.7%, nuclear 5%, renewables nil, since only thermal plant carries
meaningful house load for mills, fans, ID/FD and FGD):

    Ember gross                     224.59 TWh
    Ember sent-out                  210.26 TWh
    plus our imports 8.56           218.82 TWh
    OUR MODEL                       218.87 TWh     <- 0.02% apart

On a sent-out basis Ember's coal is 164.0 TWh against our 157.0, and that 7 TWh
remainder is almost exactly offset by our higher renewables - rooftop capture
(+2.0) and privately wheeled wind (+2.6) - both already documented.

WHY COSTS AND EMISSIONS ARE FINE. costCoal (R546/MWh, Eskom FY2025 primary
energy) and emisCoal (1.04 tCO2/MWh) are both per SENT-OUT MWh, which is the
standard Eskom convention. Applying them to sent-out generation is correct.
Grossing up generation without also converting the coefficients would have
DOUBLE-COUNTED auxiliary consumption and overstated both cost and CO2 by ~8%.

DO NOT add an auxiliary-consumption term to close this gap. The earlier
suspicion that coal, CO2 and fuel cost were understated by a tenth was wrong,
and acting on it would have introduced a real error into figures that are
currently right.

## Peak demand: investigated 16 Aug 2026, NOT an error

The model peaks at 31.6 GW against Eskom's quoted winter evening peaks of
24.9-28.7 GW, and this looked like a 10% overstatement. It is not. Two findings
settle it:

1. DEFINITIONAL. Eskom quotes peak demand against ESKOM FLEET availability -
   "evening peak 27,177 MW, available capacity 30,878 MW". IPP renewables and
   imports serve load on top of that, so the quoted figure is not total system
   demand. Netting them off the model (1.0 GW IPP wind/CSP/hybrid + 1.0 GW
   Cahora Bassa at the peak hour) gives 29.6 GW against Eskom's 28.7 - about 3%
   apart, on a 2025 series that predates further decline.

2. THE ENERGY SIDE RULES OUT INFLATION. The model generates 210.3 TWh against
   Ember's 224.6 TWh. It is 6% LOW on energy. A demand series inflated 10% could
   not produce that. Scaling demand down 9% to "fix" the peak would drive coal to
   139 TWh against Ember's 177.7 - a 22% shortfall, far worse than the 11% we
   already carry.

The demand duration curve is also well formed: top hour only 1.9% above the
10th, load factor 77.5%, squarely in the normal 75-80% range for South Africa.
No spikes, no artefacts.

DO NOT rescale the demand series to close this gap. The validation panel now
states the definitional difference instead of implying an error.

## queue_project.js — intake tool for trade-press sightings (17 Aug 2026)

Asked whether we could scrape trade press. Finding articles is the easy half and
a Google Alert does it free; the hard half is trusting what an announcement says,
because announcements are marketing documents.

    node queue_project.js --name "..." --mw 155 --tech wind --area Mpumalanga \
         --cod "August 2026" --bucket private --gwh 480 --turbines 25 \
         --source "https://..." [--commit]

Dry-run by default. It refuses to queue anything that fails, and it checks:

  * CAPACITY FACTOR against physics. Ilikwa's announced ">140 GWh" over 50 MW is
    a 32% CF, which is not achievable in the Free State - the tool says so and
    tells you to use the nameplate. This is the check that justifies the tool.
  * EQUIPMENT SANITY. Turbines must imply 1.5-8 MW machines, panels 250-800 W.
    A miss usually means the MW figure is AC while the equipment count is DC, or
    that a phase boundary has been crossed.
  * BUCKET, and what it implies downstream - private goes to by_source.private
    and never touches the Eskom reconciliation; reipppp does.
  * DUPLICATES against the existing queue, normalised so punctuation differences
    do not slip through.
  * DOUBLE-COUNTING against the capacity file's as_at date.

WHAT WAS DELIBERATELY NOT BUILT: an actual scraper. Privately wheeled
commissioning has no registry and no disclosure obligation - PowerFutureLab
themselves use media reports - so there is nothing structured to scrape. RSS
feeds and Google Alerts cover the finding half at zero cost and zero
maintenance, and South Africa commissions well under one private project a week,
so the volume never justifies a fragile HTML scraper. The value was always in
validation, not fetching.

## DOUBLE-COUNT GUARD, and the REPLACE-never-ADD rule (17 Aug 2026)

THE RULE. When a new PowerFutureLab monitor or IPP Office quarterly lands, it
ALREADY CONTAINS the projects sitting in our queue - that is what a later
reporting date means. So the update is REPLACE, never ADD:

    1. Replace by_source.private (or .reipppp) wholesale from the new edition
    2. Re-derive FIXED.windMW / FIXED.pvUtilityMW from the rebuilt file
    3. THEN delete the queue entries the new edition now covers

Adding queued megawatts on top of a refreshed source counts them twice. Not
hypothetical: FIXED.pvUtilityMW carried 1,823 phantom MW until 15 Aug 2026
because 488 MW of wheeled plant sat in the utility AND rooftop buckets at once.

validate_capacity.js now enforces this. It compares each queued project's COD
against the capacity file's as_at date and prints a DOUBLE-COUNT RISK block
listing any project the file should already contain. Tested by simulating a
Sep-2026 file with the August projects still queued - all six were correctly
flagged. When nothing is at risk it states the rule instead, so the next person
reads it before they need it rather than after.

## "FUTURE ELECTRICITY MIX" PRESET REBUILT (17 Aug 2026)

The old preset was a hand-set guess. Replaced after a systematic sweep.

    OLD  decom 21 GW, wind 28.5, pv 42.5, rooftop 15, batt 20, no flex
         67.0% RE, 67 Mt CO2, R1,033/MWh, LOLE 0 (3h stressed)

    NEW  decom 27 GW + FLEXIBILISED, wind 45, pv 52, rooftop 20, batt 30, no gas
         78.5% RE, 87.4% non-fossil, 41 Mt CO2, R1,339/MWh, LOLE 0 (0h stressed)

CO2 down 39%, renewables up 11.5 points, and PERFECTLY RELIABLE - zero unserved
hours even with coal 10 points below plan, which no other option managed.

FIVE FINDINGS DROVE IT.

1. THE OLD SPLIT WAS BACKWARDS. Holding total VRE constant and shifting from
   solar-heavy to wind-heavy bought decarbonisation almost free: 28.5/42.5 gave
   67% RE and 67 Mt; 50/21 gave 75.4% and 48 Mt for R6/MWh more. South Africa
   peaks on winter EVENINGS when solar is zero.

2. BATTERIES WERE OVER-BUILT AND UNDER-WORKED at shallow coal retirement. With
   only 21 GW retired, 10/20/30/40 GW of battery gave IDENTICAL renewables, CO2
   and curtailment while cost rose R976 to R1,204. They only earn their keep once
   the system is genuinely tight.

3. GAS WAS REJECTED, on the user's argument about LNG price exposure. Quantified
   first: a 5x LNG shock costs only R20/MWh, 1.6% of system cost, because 9 GW of
   CCGT generates 0.5 TWh a year - a 0.6% capacity factor, insurance rather than
   energy. So the PRICE risk is small. But average price still moves 10% because
   gas sets the marginal price in exactly the scarcity hours it runs, and the
   SUPPLY risk is the real one: given the gas cliff, stranded firm capacity is
   worse than expensive firm capacity. Coal retention has no equivalent failure
   mode.

4. RETAINED COAL + FLEXIBILISATION BEATS GAS ON RELIABILITY at similar cost:
   LOLE 0 (0 stressed) against 5 (6 stressed), R1,288 vs R1,275. It costs 12 Mt
   more CO2 and about 4 points of renewables share. Flexibilisation itself is
   excellent value - +1.8pp RE and -4 Mt for R2/MWh, by letting coal get out of
   the way of wind and solar rather than blocking them.

5. SOLAR-LEANING IS DEFENSIBLE DESPITE COSTING EMISSIONS, on the user's point
   that wind corridors need transmission upgrades while solar sites almost
   anywhere. The GCCA data agrees - Eastern Cape wind headroom is 400 MW while
   KZN and Gauteng hold thousands of MW of solar headroom. Decisive evidence:
   the transmission-aware regional optimiser, asked what mix IT wants now that
   corridors are priced, chose 52:48 wind:solar and built NO new transmission,
   siting within existing headroom instead. The national model's uniform
   R600/kW/yr adder understates wind's real network cost, so its wind-heavy
   optimum is biased.

THE AMBITION LADDER, for anyone wanting to move the preset up or down. All rungs
use coal+flex and a solar-leaning mix; marginal abatement cost is the cost of
moving up one rung.

    decom 18 / W35 PV40 b22    71.8% RE   57 Mt   R1,113   LOLE 0 (0)
    decom 22 / W40 PV46 b26    75.1% RE   49 Mt   R1,228   LOLE 0 (0)   R2,947/t
    decom 27 / W45 PV52 b30    78.5% RE   41 Mt   R1,339   LOLE 0 (0)   R2,844/t  <- CHOSEN
    decom 31 / W50 PV58 b34    81.4% RE   33 Mt   R1,462   LOLE 0 (3)   R3,152/t
    decom 35 / W55 PV64 b38    84.6% RE   25 Mt   R1,585   LOLE 3 (5)   R3,152/t

THE MAC IS FLAT at R2,800-3,200/tCO2 across the whole ladder, so there is no
natural knee - the choice is a judgement about ambition, not an optimisation
result. The 27 GW rung was chosen as the last one that is PERFECTLY reliable:
zero unserved hours both as planned and with coal 10 points below plan. Above it
the stressed case starts to shed.

TWO REALITY CHECKS WORTH KEEPING. R1,339/MWh system cost sits BELOW current Eskom
retail tariffs of roughly R1,500-2,000/MWh, though the measures differ - system
cost excludes distribution, retail margin and debt service. And R2,900/tCO2 is far
above the SA carbon tax (R236 headline, ~R46 effective) and above EU CBAM
(~R1,550), so this abatement is NOT justified by carbon pricing. It is justified
by replacing a fleet that is retiring anyway, which is why coal decommissioning
rather than carbon price is the driver in this preset.

ALSO TESTED AND REJECTED: shifting utility PV to rooftop. Rooftop needs no
transmission at all, so it should have been favoured by the same logic as
solar-over-wind - but it moved neither emissions nor renewables share and cost
R18/MWh more, because rooftop LCOE is higher in the model. The transmission
advantage is real but the model's uniform R600/kW/yr adder cannot express it,
the same bias that affects wind.

CURTAILMENT reaches 121 TWh, which the brief explicitly de-prioritised. It is the
honest cost of a VRE-led system without long-duration storage, and the relevant
panels show it.

## EXTREME-EVENT HANDLING (17 Aug 2026)

The expansion optimiser works over 12 representative days. Two changes, because a
plan can look adequate on a sample and fail on an event the sample never held.

1. BETTER DAY SELECTION. bldRepDays previously chose the tightest single HOUR, the
slackest day, and the rest at even calendar intervals. Nothing selected for a
SUSTAINED event - a five-day winter wind drought simply did not exist in the
sample. Two extra windows are now chosen deliberately:

    worst 3-day rolling NET LOAD   sustained scarcity
    worst 3-day rolling WIND       the drought itself

The sample now clusters where it should: three of eight days fall in late June and
early July, where previously none did. Standard practice - representative days
plus explicitly chosen extreme periods, rather than hoping a sample catches the
tail.

2. FULL-YEAR STRESS TEST, run automatically after every solve. Rather than making
the optimiser see 8,760 hours - which is not browser-tractable, ~30x the LP and
minutes to solve - this takes the build the optimiser CHOSE and runs it through
the hourly dispatch engine, which already does full chronology with unit
commitment, lumpy outages and reserve. Then it does it again with coal 10 points
below plan, because the tight years are the ones where availability also
disappoints.

Three verdicts, all tested: holds up / holds at plan but fails under stress /
sheds on a full year.

IT IMMEDIATELY SAID SOMETHING USEFUL. The standard optimiser output (11 GW wind,
7.5 GW solar, 2.8 GW battery) has ZERO unserved energy across the full year as
planned - but sheds for 3 hours once coal runs 10 points worse. The plan has no
margin for a bad year, which the 12-day sample could never have shown.

It is a validation step, not an optimisation change. It cannot fix a bad plan; it
tells you when the plan you have is one.

## CHRONOLOGICAL STORAGE, and what it revealed (17 Aug 2026)

Storage in the regional expansion LP balanced WITHIN each representative day, so
it could never bank energy from a windy day for a still one. Now linked: state of
charge carries between representative days, weighted by how many real days each
stands for, bounded by built energy capacity.

    e_<region>_<year>_<day>   stored level at the end of that representative day
    soc_ rows                 e_k = e_(k-1) + weight x (0.88 x charge - discharge)
    ecap_ rows                e_k <= 4 x built capacity + existing
    bldRepDays                now returns days in CALENDAR order with prevD

Default case unchanged within noise: R615.9bn vs R616.0bn, batt 2.8 vs 2.7 GW,
and slightly faster at 14.7s. So the feature does not perturb today's answer.

IT MADE NO DIFFERENCE TO THE COAL-RETIRED CASE, AND THE REASON MATTERS MORE THAN
THE FEATURE. With 30 GW of coal retired and build caps lifted, both the within-day
and the chronological model build 21.5 GW wind, 19.9 GW solar and 0.4 GW storage.
Peak stored level reaches 1.4 GWh against a 1.7 GWh capacity, so the linking is
active and binding - it simply does not change the decision.

The cause: THE ONLY STORAGE IN THE BUILD SET IS A 4-HOUR BATTERY. Its energy
capacity is 4x its power rating. Linking days lets it carry charge across
midnight, but four hours of energy cannot ride out a multi-day wind drought
however it is scheduled. The optimiser was not being short-sighted; it was
correctly declining to buy a technology that cannot do the job.

SO THE REAL GAP IS THE TECHNOLOGY SET, NOT THE CHRONOLOGY. A coal-retired South
African system needs LONG-DURATION storage - pumped hydro (8-20h, and SA already
runs 2.9 GW of it), compressed air, thermal, or hydrogen for anything seasonal.
The build set offers wind, pv and batt only. Adding a long-duration option is the
next thing worth doing, and the chronological linking built here is a PREREQUISITE
for it: without day-to-day carry, a 20-hour store would look no better than a
4-hour one.

## A REAL BUG FOUND BY THIS TEST: bldCoalByRegion ignored coalDecomMW

The regional build optimiser retired coal ONLY on each unit's published
decommissioning date and ignored the "Coal decommissioned" slider entirely - while
the panel above it printed "using the scenario set above ... X GW retired". The
display and the model disagreed.

Caught by running a 30 GW-retired scenario and getting byte-identical builds and
an identical R616bn objective to the base case. Anyone testing a coal-retirement
scenario in the regional optimiser had been getting the base case back.

Fixed: extra retirement beyond published dates now comes off OLDEST FIRST, which
matches how a real programme would run and how the national engine treats it. The
same scenario now costs R4,335bn rate-capped, or R2,903bn with caps lifted.

## PART-LOAD HEAT RATE (17 Aug 2026)

Third of three PLEXOS-gap features. Coal was costed at a flat R546/MWh whatever
its load factor. Real units burn more fuel per MWh when backed off - auxiliaries,
mills, fans and boiler losses are largely fixed and spread over less output.

    HR(x) = HR_nominal x (1 + k x (1/x - 1)),  x = coalGen / committed capacity
    k = coalPartLoadK, default 0.10, on a slider; x floored at 0.35

At MSL (~55%) with k=0.10 the multiplier is about 1.08 - within the 5-12% range
usually quoted for subcritical coal between MSL and full load.

DISTINCT FROM THE MERIT CURVE, and additive to it. _coalMeritCurve already varied
the marginal cost by WHICH station is at the margin as output rises. Part-load is
the separate effect that EACH RUNNING STATION is less efficient when backed off.
Both now apply.

THE FINDING: the penalty grows with solar, because solar is what pushes coal to
part load.

                          mean multiplier   CO2 Mt   avg cost
    today, k=0                     1.000     167.4     561.9
    today, k=0.10                  1.015     169.9     568.7
    +20 GW PV, k=0                 1.000     130.4     605.2
    +20 GW PV, k=0.10              1.036     134.3     616.0

Ignoring part-load overstates the CO2 saving from 20 GW of solar by 1.4 Mt, about
4%. Modest now, larger at higher penetration - and only visible in an hourly model.

TWO BUGS FOUND WHILE BUILDING IT, both from placement:
  * thermalP read partLoadF BEFORE the array was written, so part-load never
    reached the marginal price. Prices did not move at all until the computation
    was hoisted above the price expression.
  * CO2 was computed from E.coal x emisCoal - energy SOLD, not fuel BURNED - so
    emissions ignored the multiplier entirely. Now uses coalFuelMWh, which is coal
    output scaled by the multiplier. This is the physically important half: the
    whole point is that a backed-off fleet emits more per MWh delivered.

## RESERVE CO-OPTIMISATION: built, correct, and defaults OFF (17 Aug 2026)

Second of three PLEXOS-gap features. Energy and reserve now compete for the same
capacity in the regional LP - a unit sells its headroom as energy OR holds it as
standby, never both:

    rc_/rdz_/rb_       reserve from coal, diesel, battery per region-hour
    cmax_/dmax_/bdmax_ now read gc + rc <= capacity, so the two compete
    resq_ rows         national requirement per hour: 794 MW contingency
                       + 2% of load + 5% of VRE
    dual on resq_      the RESERVE SHADOW PRICE

The VRE term references wind and solar ACTUALLY BUILT AND DISPATCHED, as LP
variables on the left-hand side rather than a precomputed constant. That matters:
the optimiser then sees that building more renewables RAISES the reserve
requirement, which is a real cost of a high-VRE system that a fixed right-hand
side would hide from it.

THE RESULT, and why it defaults off. The shadow price is ZERO in all 960 modelled
hours, at every fleet availability tested down to EAF 45%. South Africa has 3.4 GW
of OCGT sitting idle against a requirement near 1.9 GW, so the constraint is
always slack and standby capacity is worth nothing at the margin.

That is the SAME conclusion the hourly dispatch engine reached independently on
16 Aug - 7.1 GW of fast-start against a 1.3 GW need. Two separately written parts
of the model agreeing is a real check on both.

Keeping it on costs ~50% more solve time (16.4s to 26.3s) for a number that does
not move, so RESERVE_COOPT = false. With it off the LP is byte-identical to the
pre-reserve version (14,307,739 chars, R616.0bn, same builds, same corridors) -
verified, so the feature cannot silently perturb the default answer.

TURN IT ON when peakers retire, when a scenario strips out the OCGT fleet, or if
an ancillary services market is proposed and someone needs to know what it would
clear at. The machinery is correct; it is the South African system that makes it
uninteresting today.

## DC POWER FLOW - BUILT (17 Aug 2026)

nodal/corridor_electrical.json + a PTDF engine in index.html. All 439 lines
mapped, none unmapped: 97 inter-regional across 19 corridors, 321 intra-regional
(correctly ignored at this resolution).

METHOD. Line LENGTH computed from real geometry in transmission_lines.geojson.
REACTANCE assigned from voltage class using standard overhead-line values
(0.40 ohm/km at 220-275 kV, 0.30 at 400, 0.28 at 533-765), converted to per-unit
on a 100 MVA base; parallel lines add susceptance. This is exactly how PyPSA and
PyPSA-Eur do it - impedance is not measured anywhere, it is assigned from voltage
class and scaled by length. Endpoints resolved to regions via
substations_compact.json, falling back to nearest substation.

WHAT IT SHOWS. 1,000 MW from the Northern Cape to Gauteng produces 2,884 MW of
total absolute flow across FOURTEEN corridors - including Eastern Cape-KZN, which
is nowhere near any sensible route. A transport model routes all 1,000 MW down
the cheapest path and sees none of this. That gap is the loop flow, and it is why
a transport model can be wrong about WHICH corridor loads up.

DELIBERATELY A DIAGNOSTIC, NOT A CONSTRAINT. Coupling network physics into the LP
is the "correct" move, but the headroom-transmission coupling attempted the same
day made the LP intractable (45s to 850s+ without converging). So dcFlows() takes
regional net injections and returns physical flows and corridor utilisation,
answering "what would really happen" without touching solve time. The in-browser
PTDF was verified against a Python prototype - identical to the megawatt.

CAVEATS, also in the JSON meta: assigned rather than measured reactance; no
conductor bundling, circuit-count-per-tower or series compensation; no N-1. Good
enough to show flows follow physics rather than economics; not a load-flow study.

BUG FOUND AND FIXED THE SAME DAY: the three 533 kV circuits were being treated as
AC lines. They are the Apollo-Cahora Bassa HVDC link, and HVDC does NOT obey DC
power flow - its flow is set by converter controls, not impedance. Including it
let the PTDF route loop flow through a link that physically cannot carry any, and
it also corrupted the Gauteng-Limpopo corridor, which appeared as 1,384 km when
the real AC distance is 351 km, because a 1,000 km line to Mozambique was being
counted into it. Now excluded; the import is already represented as
FIXED.importsMW.

ON PyPSA-RSA, AND A CORRECTION. I suggested its parameters could replace ours
with "measured values". That was overstated. PyPSA-RSA descends from
PyPSA-Eur/PyPSA-Earth, which ASSIGN reactance from voltage class and length -
the same method used here. Adopting their file would mainly buy a better
line-type mapping, not measured impedance, which is not public for Eskom's
network.

SERIES COMPENSATION - NOW MODELLED (17 Aug 2026). This was the largest remaining
error and it has been fixed. Eskom has series-compensated its 400 and 765 kV
lines since 1975; the Cape Corridor alone has six capacitors at four sites, rated
450 to over 1,300 Mvar. A series capacitor CANCELS part of the line's inductive
reactance, so a compensated line is electrically SHORTER than its length implies
and carries MORE flow. Modelling it as uncompensated made the long Cape corridors
look high-reactance and under-used - the exact opposite of why the capacitors
were installed.

Applied as 50% on 765 kV and 40% on 400 kV lines over 250 km; none on short
lines, where there is no economic case. These are the standard published degrees
(historically to 50%, modern schemes to 80%), NOT per-scheme Eskom settings,
which are not public. The JSON meta says so.

Effect on corridor susceptance, higher meaning electrically shorter:

    Free State - Hydra Central      228.8 -> 438.7   +92%
    Eastern Cape - Hydra Central    152.1 -> 292.1   +92%
    Free State - Mpumalanga         201.4 -> 383.9   +91%
    Hydra Central - Western Cape    121.0 -> 177.0   +46%
    Gauteng - Mpumalanga            564.7 -> 564.7    +0%  (short, uncompensated)

THRESHOLD AUDIT, prompted by "are capacitors modelled everywhere they exist?".
The answer was NO, and the 250 km cut-off was excluding the very lines it should
have caught: the three DROERIVIER-HYDRA circuits at 247 km and BACCHUS-PROTEUS at
249 km. Droerivier, Bacchus and Proteus are all Western Cape substations on the
main Cape supply corridor - the arbitrary threshold was missing the case
compensation exists for, by three kilometres. Moved to 200 km; Hydra Central -
Western Cape susceptance went 177.0 to 220.4.

SENSITIVITY WAS THEN TESTED rather than assumed, across thresholds of 150, 200,
250 and 300 km. Corridor susceptance moves 0-16%, most corridors under 10%. So the
arbitrariness is BOUNDED and does not drive the answer - but it is arbitrary.
Eskom does not publish which individual lines carry series capacitors or at what
degree, so this remains a heuristic and the JSON meta says so. Anyone quoting a
specific corridor's number should know it rests on an assumed compensation rule.

The pattern is right: compensation strengthens precisely the corridors where
distance was limiting transfer, and leaves short ones untouched. A 1,500 MW
Northern Cape to Western Cape transfer - the solar export case - now flows mostly
down the compensated Hydra-Western Cape backbone, which is what it was built for.

REMAINING, in order:
  1. Conductor bundling and circuit count per tower. Parallel circuits ARE
     captured (they appear as separate geojson features, e.g. "... 1" and
     "... 2"), but bundling within a circuit is not.
  2. N-1 screening, which is a load flow per outage per hour and is not a browser
     workload at all.
  3. Per-scheme compensation degrees, if Eskom ever publishes them - the 50/40%
     used here are standard values, not measured settings.

## SERIOUS BUG: hw_/hp_ HEADROOM CONSTRAINTS WERE SILENTLY MISSING (17 Aug 2026)

While reverting the headroom-transmission coupling earlier the same day, the
revert replaced everything from a comment down to the hb_ row - DELETING the hw_
and hp_ constraints and leaving only the prose describing them. Wind and solar
connection headroom went completely unenforced.

NOTHING CAUGHT IT. The LP still built, still solved, still returned Optimal, and
all 290 stress checks, 44 deep checks and 33 output checks still passed. It was
found only by counting constraint families in the emitted LP and noticing hb_ was
present while hw_ and hp_ were not.

A silently missing constraint is the worst failure mode this model has: the answer
looks entirely normal and is simply wrong. Every "the optimiser builds exactly to
headroom" statement made after the revert was drawing on a run where headroom was
not enforced.

GUARD ADDED. validate_lp.js now audits the emitted LP for required constraint
families - bal_, cmax_, hw_, hp_, hb_, rate_, dur_, soc_, txa_ - and fails loudly
if any family has zero rows. 40/40 checks pass. This class of bug cannot recur
silently.

## GRID BEYOND GCCA - a one-slider answer to "should we build more grid?"

state.gridBeyondGccaPct, 0-150%, in the Grid section. Scales every region's
connection headroom in the build optimiser. Verified: total 2030 wind headroom
goes 21,520 MW at 0% to 34,432 MW at +60%, exactly 1.60x.

WHY A MULTIPLIER RATHER THAN THE PROPER COUPLING. Coupling headroom row-by-row to
the tx_ variables is the correct model and made the LP intractable (45s to 850s+).
This gets most of the policy answer - "what would a bigger build programme
unlock?" - for no solve cost at all. What it cannot do is say WHICH corridors to
build; the transmission expansion variables and the DC flow diagnostic already
address that.

WORTH KNOWING: at DEFAULT build rates the multiplier changes nothing, because the
build RATE caps bind long before headroom does - 11 GW of wind over five years
against 21.5 GW of headroom. Headroom only becomes the binding constraint in
high-ambition scenarios where build rates are also lifted. That is itself a useful
finding: for realistic build programmes, GCCA headroom is not what limits South
Africa - the rate at which projects can be delivered is.

## LONG-DURATION STORAGE: three technologies added (17 Aug 2026)

Four-hour lithium cannot ride out a multi-day lull however it is scheduled, which
is why the coal-retired test built almost none of it. Three options that can:

    PUMPED STORAGE   14 h, 78% RTE, capped 6 GW    newPsMW
    VANADIUM FLOW     8 h, 70% RTE, uncapped       newVrfbMW
    IRON-AIR        100 h, 45% RTE, uncapped       newIronAirMW

PUMPED STORAGE follows Eskom's Tubatse spec - 1,500 MW / 21 GWh, i.e. 14 hours -
which has EU/AFD grant funding and a Q1 2026 feasibility study. SA already runs
Ingula 1,330, Drakensberg 1,000, Palmiet 400 and Steenbras 180 MW. CAPPED AT 6 GW
because SITING, not water, is the constraint: pumped storage is closed-loop, so it
consumes evaporation and an initial fill rather than a continuous draw. What limits
it is needing two reservoirs several hundred metres apart vertically AND the water
to fill them. Four schemes in a century says single-digit GW, not tens.

VANADIUM's case is industrial rather than purely economic: Bushveld Minerals runs
Vametco (Brits) and Vanchem (Mpumalanga), built an electrolyte plant in East
London, and deployed Eskom's first utility-scale VRFB at Rosherville.

IRON-AIR is the only genuinely multi-day option - 100 hours, under $20/kWh,
geology-independent. The 45% round trip is the trade: it charges on energy that
would otherwise be curtailed and accepts the loss.

INTEGRATION. New pumped storage joins the PS fleet (same technology). Vanadium and
iron-air join the battery-class aggregate, which now carries an ENERGY-WEIGHTED
duration and round-trip efficiency instead of a hardcoded 0.88 - a fleet that is
mostly iron-air genuinely does behave less efficiently. Replacement-cost LCOE is
blended the same way. The chronological storage linking built earlier the same day
was the prerequisite: without day-to-day carry a 100-hour store looks no better
than a 4-hour one.

THREE BUGS FOUND WHILE BUILDING IT:
  * A regex swapping p.psPowerMW to the new totals also rewrote the INSIDE of the
    new declarations, so psPowerTot was defined as psPowerTot + newPs. Caught by a
    "cannot access before initialization" error on first run.
  * lcoePs ALREADY EXISTED at 1400 further down, used by the replacement-cost KPI.
    Defining it a second time at 1150 silently let the later one win. Removed;
    single-sourced now.
  * The new LCOE sliders were inert until the blended battery cost was wired -
    flagged by the deep harness as dead controls, which is exactly its job.

## SCOPED, NOT YET BUILT: power flow, and long-duration storage (17 Aug 2026)

### 1. DC POWER FLOW - the data gap I claimed does NOT exist

I said earlier we could not do power flow because the line data lacks length and
impedance. The length half was WRONG. Line length is computable from our own
geometry: nodal/transmission_lines.geojson has 439 LineStrings with coordinates
and voltage, giving 41,844 km:

    400 kV   252 lines   26,885 km      765 kV    14 lines    4,579 km
    275 kV   155 lines    7,884 km      533 kV     3 lines    1,049 km
    220 kV    15 lines    1,446 km

And impedance does not need to be measured. PyPSA derives r, x and b by mapping
each line to a STANDARD LINE TYPE LIBRARY keyed on voltage, then scaling by
length and circuit count - the same method PyPSA-Eur uses for Europe and
PyPSA-Earth for Africa, both validated against TSO reference models.

BETTER STILL, PyPSA-RSA already exists and is open source
(github.com/MeridianEconomics/pypsa-rsa, maintained by Meridian Economics,
originally CSIR). It models South Africa at 1, 10, 27, 34 and 159 nodes - and its
10-node resolution uses the GCCA 2025 Eskom Transmission Supply Regions, THE SAME
TEN REGIONS THIS MODEL USES. It also solves with HiGHS, as we do. So its network
parameters may be directly transferable rather than needing derivation.

REMAINING QUESTION is computational, not data: a DC load flow per hour is
tractable, but N-1 contingency screening is a load flow per outage per hour and
is not a browser workload. Scope it as DC flow without N-1 first.

### 2. LONG-DURATION STORAGE - enough cost data exists, with real caveats

IRON-AIR (Form Energy) is the strongest candidate for South Africa:
    system cost   under $20/kWh, roughly a tenth of lithium
    duration      100 hours
    RTE           40-50% - the catch, and it is a big one
    status        early commercial; first gigafactory (West Virginia) shipping,
                  75+ GWh under agreement, but limited operating experience, so
                  lenders price it as unproven
    SA fit        GEOLOGY-INDEPENDENT, which matters here

CAES needs salt caverns or similar formations, which South Africa largely lacks -
that alone probably rules it out domestically. For reference: ~$1,500-2,300/kW on
the power side, $50-90/kWh on energy depending on whether the reservoir is cavern
or vessel, RTE 45-70%.

MODELLING NOTE, and it is the important one: our storage assumes 0.88 round-trip.
Iron-air at 0.45 is a fundamentally different asset - it would charge on otherwise
curtailed energy (of which the new preset has 121 TWh) and accept the loss,
because the alternative is unserved load. The chronological storage linking built
on 17 Aug is a PREREQUISITE: without day-to-day carry a 100-hour store looks no
better than a 4-hour one, which is exactly why the coal-retired test built almost
no storage.

The user has noted long-duration is not currently on South Africa's radar - no
pipeline, no credible domestic options - so this is scoped rather than queued.

## WHY THE OPTIMISER BUILDS NO TRANSMISSION AT HIGH RENEWABLES (17 Aug 2026)

Asked why a 41 GW renewable build reinforced ZERO corridors. It is not a bug in
the transmission code, but it IS an inconsistency worth knowing about.

The optimiser built 21.5 GW wind and 19.9 GW solar. National GCCA headroom is
21.52 GW wind and 19.94 GW solar. It built EXACTLY to headroom and stopped - so
it never reached a corridor limit, and reinforcing a corridor could never pay for
itself. Transmission expansion was a decision variable that could not earn its
keep at high VRE.

That is incoherent, because GCCA headroom IS a network constraint: it exists
because the corridor cannot take more, so building that corridor should raise it.

FIX IMPLEMENTED AND REVERTED. Coupling hw_/hp_ to the tx_ variables on each
region's binding_corridor is the right model, and it was written and tested. It
made the LP INTRACTABLE - solve time went from ~45s to over 850s without
converging, twice. A tool nobody can run is worse than one with a documented
limitation, so it was reverted and the reasoning left in the code at the point
where the constraint is built.

HOW TO READ TRANSMISSION RESULTS. Expansion is real and works where corridors
bind BEFORE headroom does - at default settings it correctly reinforces the
Eastern Cape-KZN and Hydra-Western Cape corridors, the two GCCA independently
reports as binding. In high-renewables scenarios headroom binds first, and a
"no transmission built" result means "no corridor is the binding constraint
here", NOT "no network investment is needed". The GCCA headroom figure already
embeds the network build required to release it.

IF SOMEONE WANTS TO FIX IT PROPERLY: the likely route is not tighter coupling but
fewer coupled rows - e.g. one headroom-transmission link per region per HORIZON
rather than per year, or solving transmission in an outer loop around a
headroom-fixed inner LP.

## TRANSMISSION EXPANSION IS NOW A DECISION VARIABLE (17 Aug 2026)

First of three PLEXOS-gap features. The regional build LP previously took corridor
transfer limits as FIXED and priced transmission with one flat national adder
(txRPerKWyr) - it could say what the grid cost, never where it should go. Now:

    tx_<corridor>_<year>   MW of extra transfer capacity, a decision variable
    txa_/txb_ constraints  flow <= existing rating + everything built to date
    objective              annuitised at R10,000/MW-km over 40 years, so a line
                           competes with a wind farm on the same basis

20 corridors x 5 years = 100 variables, 38,400 linking constraints. Solves
Optimal in 17.5s.

THE RESULT IS A CHECK ON THE METHOD. At default settings it reinforces exactly
two corridors:

    Eastern Cape - Kwazulu Natal   339 MW built on an 813 MW existing rating
    Hydra Central - Western Cape   291 MW built on a 2,377 MW rating
    total about R1.4bn of network capex

Those are the two corridors GCCA independently reports as binding - the Eastern
Cape is the best wind region with 400 MW of wind headroom and ZERO solar, and
Hydra/Western Cape both have zero solar headroom. Nothing about GCCA headroom is
fed into this LP, so the agreement is evidence the corridor topology and costs
are behaving.

CAVEATS BUILT IN. TX_MAX_MW_PER_CORRIDOR caps the build at 4,000 MW per corridor
per year: without it the LP buys tens of gigawatts of line to avoid a little
curtailment, which is arithmetically optimal and physically absurd given real
permitting and construction times. Corridor lengths use GCCA binding-corridor
distances where they exist and straight-line proxies elsewhere, and the panel
says which. R10,000/MW-km comes from NTCSA TDP-scale figures for 400 kV double
circuit (~R12-18m/km carrying ~1,400 MW).

## VPP SITING MOVED INTO WHERE TO BUILD (17 Aug 2026)

The single-select "where it is sited" dropdown was scrapped the same day it was
built. It let you pick only ONE province, which is wrong for something that
would realistically run in several municipalities at once - Cape Town and
eThekwini are both pursuing VPPs right now.

VPP is now a TECHNOLOGY in Where To Build, alongside solar, wind, coal, CCGT,
nuclear and battery. That tool already does per-region MW allocation with a
committed portfolio, so multiple simultaneous placements come for free.

TWO THINGS IT NEEDED THAT OTHER TECHNOLOGIES DO NOT:

  1. A VPP CONSUMES NO CONNECTION HEADROOM. Everything else in that tool is new
     plant asking to connect and drawing down the region's GCCA allowance. A VPP
     aggregates load ALREADY behind the meter - no new connection, no grid-build
     charge, and if anything it relieves the network. Running it through the
     headroom path would have blocked legitimate siting and wrongly billed it.
     It is instead checked against what the region plausibly holds: its share of
     national electricity demand times the national pool.

  2. NO NATIONAL SLIDER TO BUMP. Every other technology increments a "new build"
     slider when sited. A VPP has none, because it is existing load. sliderIdFor
     returns null for it and the caller guards - defaulting to newPvMW, as the
     old fallback did, would have added phantom solar on every VPP placement.

The national sliders still work and now mean "a national programme, spread by
demand share". Sited VPPs add ON TOP, so you can model a national rollout,
a set of municipal pilots, or both. One bug caught in testing: the pool function
returned early when national enrolment was zero, silently discarding sited VPPs -
which is the NORMAL case, since no national programme exists but pilots do.

## SITE-BASED VPPs, via the live MIP (17 Aug 2026)

A VPP can now be SITED. The national sliders set the size and enrolment; a new
"where it is sited" selector places it either nationally or in one region.

WHY THE MIP AND NOT A NODAL DISPATCH. The regional build optimiser is the live
regional machinery - runNodalYear was never wired (see above). getNodalMIPInputs
already carries per-region load and corridors, so a sited VPP enters exactly
where the optimiser can see it, and the question becomes the one a municipality
actually has: does a VPP here change what the least-cost plan builds, and where?

TWO EFFECTS, both regional:
  1. Controllable geysers move WITHIN each day out of that region's highest
     net-load hours into its lowest, water-filled (dumping rebuilds the peak in
     the small hours - the rebound that dogged Eskom's ripple control). Strictly
     energy-neutral per region per day.
  2. Enrolled household batteries join that region's storage through the same
     extraBattByRegion hook the Where To Build tool uses.
  Applied to a COPY of regionLoad - the engine caches it, and mutating it would
  contaminate every later run.

THE SPLIT IS BY ELECTRICITY DEMAND, NOT ROOFTOP PV. Rooftop tracks who could
afford panels; the geyser and home-battery fleet tracks where power is consumed.
The Northern Cape is 6.8% of national rooftop but 2.1% of demand - a threefold
overstatement - because it has sun and few people. Shares come from the model's
own demand_2025_regional.csv so they cannot drift from what the optimiser
dispatches against.

At 75% enrolment of a 4 GW pool: National spreads 2,994 MW over ten regions;
Western Cape concentrates 400 MW; Gauteng 1,120 MW; Northern Cape only 84 MW.
Cape Town's municipal VPP is therefore a governance and market-design pioneer
rather than a system-scale intervention - Gauteng is where the megawatts are.

TWO BUGS FOUND WHILE BUILDING IT:
  * The control panel had no SELECT type at all - only ranges and toggles. Added.
  * applyState() assumed every control has a cv_ readout and an fmt(). A select
    has neither, so it THREW and aborted applyState PART WAY THROUGH - every
    preset silently stopped applying at the first select it met, and scenarios
    downstream ran on stale values. Caught by validate_outputs dropping 33 -> 30
    the moment the picker was added. That harness earned its keep.

## T&D LOSSES: correctly ABSENT, do not add them (17 Aug 2026)

Agreed to add transmission and distribution losses to the national engine, then
checked before implementing. It would have been an ERROR.

The demand series is Eskom's TRANSMISSION-LEVEL demand - what generators must
send out - and is therefore already gross of downstream losses:

    our grid demand           205.66 TWh
    Eskom FY2024 billed sales 183.31 TWh
    implied gap                22.35 TWh = 10.9%,  against Eskom's reported 9.1%

Adding a 9% loss factor would have taken generation from 218.91 to 239.25 TWh
against an Ember-equivalent of 218.82 - and since coal is the swing producer the
entire 20 TWh lands on it, moving coal from 2% BELOW its benchmark to 11% ABOVE.

The 0.02% Ember reconciliation established the same morning is the proof: it only
holds because generation equals demand, which is correct at this model boundary.
Recorded in the site's caveats so the absence reads as a decision, not an
oversight.

## RETIRED: runNodalYear() (17 Aug 2026)

Never called from index.html. Defined in nodal_dispatch.js, referenced only in
comments - 13.7 KB, 61% of that file, parsed on every load and never executed.
The live "nodal" capability is getNodalMIPInputs() feeding the regional build
optimiser, which works over representative days rather than 8,760 hours.

Not deleted, but given an unmissable header saying it is unwired and why:
cost (8,760h x 10 regions with per-hour Dijkstra, doubled for the GET pass),
duplication (a second engine answering the same questions as simulate(), with no
reconciliation test between them), and scope (hourly corridor congestion is an
operations question; this is a planning tool). Its one real advantage was
transmission losses - and that turned out to be a non-issue, see above.

If an hourly nodal view is ever wanted, treat it as its own project and start
with a reconciliation test against simulate().

## RESOLVED: 380 MW double count caught before rollforward (17 Aug 2026)

Investigated the Mooi Plaats flag. BOTH it and Umsobomvu were already counted.

    nodal/pfl_private_h1_2026.json projects[] contains:
      Mooi Plaats   240 MW solar  LIMPOPO        Anglo American Mogalakwena
      Umsobomvu     140 MW wind   NORTHERN CAPE  EDF, Noupoort

Both were already inside by_source.private. Rolling the queue forward as written
would have overstated pvUtilityMW by 240 MW and windMW by 140 MW - 380 MW of
phantom capacity, the identical failure mode to the original pvUtilityMW bug.
Both entries removed from the queue; the resolution is recorded in
resolved_double_counts[] so the finding survives the deletion.

TWO PROVINCE ERRORS ALSO CORRECTED. The trade coverage of the Koruson 2 cluster
led me to place Mooi Plaats in the Northern Cape; the monitor puts it in LIMPOPO
against an Anglo Mogalakwena offtake. A cluster's name and a plant's location are
different things. Umsobomvu I had moved to the Eastern Cape on Mining Weekly's
say-so; the monitor says Northern Cape, and Noupoort is in the Northern Cape, so
the monitor is right.

THE ROOT CAUSE, now fixed in tooling. The two buckets have DIFFERENT EFFECTIVE
DATES and the guard was comparing everything to one of them:

    reipppp   anchored to meta.as_at              31 Mar 2026
    private   anchored to the PFL H1 monitor      30 JUN 2026  <- three months later

Comparing a wheeled COD against 31 March clears anything from April-June as "not
yet counted" when the monitor almost certainly has it. validate_capacity.js now
derives the private basis from meta.private_coverage ("h1-2026-only" -> 30 Jun),
applies the right basis per bucket, AND name-matches the queue against
pfl_private_h1_2026.json projects[] - a name match being definitive where date
arithmetic is only indicative.

STILL AMBIGUOUS: Hartebeesthoek (140 MW wind, June 2026). Its COD is inside the
monitor's coverage but it is NOT in the project list - either the June date
slipped into H2, or the monitor missed it. Queued with an explicit instruction to
NAME-CHECK against the next monitor rather than add on date logic.

## THE QUEUE IS NOT A COMPLETE RECORD (17 Aug 2026)

Flagged by the user: alerts only started being shared today, so commissionings
between the 31 Mar basis and now were captured only by chance. Coverage by month:

    April   Graspan, Umsobomvu          May   NOTHING - unchecked
    June    Hartebeesthoek              July  Ummbila Emoyeni
    August  Ilikwa                            (all found retrospectively)

MAY IS BLANK and other months are probably incomplete. Treat the queue as "what
we happened to see", never as an exhaustive list.

WHY THIS MATTERS LESS THAN IT LOOKS. The gap self-heals on rollforward: the next
IPP Office quarterly and PowerFutureLab monitor contain EVERYTHING, including
what we missed, and the update procedure REPLACES the bucket wholesale rather
than adding queued items. So the queue only needs to be good enough to know
roughly where we stand in the interim - it is not the system of record.

WHAT IT DOES AFFECT: reading the model TODAY. The live fleet understates reality
by at least the 800 MW queued, and by an unknown amount more.

CODs CORRECTED THE SAME DAY, and worth learning from. All five newsletter
projects were queued as "August 2026" because the piece said the Koruson 2
cluster was "now fully operational". That was the completion of the LAST unit,
not the COD of all three. Primary sources give:
    Mooi Plaats solar 240 MW    ~March 2026   (Mining Weekly, 24 Apr)
    Umsobomvu wind 140 MW        April 2026   (Mining Weekly, 24 Apr)
    Hartebeesthoek wind 140 MW   June 2026    (Mining Weekly: "on track for June")
    Ummbila Emoyeni ph1 155 MW   July 2026    (Engineering News, 7 Aug)
Hartebeesthoek was also moved from Northern Cape to EASTERN Cape per the source.

MOOI PLAATS IS NOW FLAGGED AS A DOUBLE-COUNT RISK: at ~March 2026 its COD is at
or before the 31 Mar basis, so it may ALREADY be in by_source.private. Verify
before rollforward - adding it would double count 240 MW. The guard catches this
automatically now that the COD is right, which is precisely why COD accuracy in
the queue matters more than it appears.

LESSON: a commissioning announcement dates the ANNOUNCEMENT, not the COD. Always
chase the primary trade report for the actual date.

## PRIMARY SOURCE FOUND for wheeled commissioning: #PowerTracker (17 Aug 2026)

CORRECTION to the note below, which said no systematic source existed for
privately wheeled commissioning and that trade press was therefore the fastest
signal. That was wrong.

Oxpeckers #PowerTracker (powertracker.oxpeckers.org) carries an explicit ENERGY
WHEELING category and sends EMAIL ALERTS on point changes. It flagged Ilikwa's
commissioning the same week. That is the event-driven source the workflow was
missing - a wheeled commissioning now surfaces immediately rather than waiting
up to six months for the next PowerFutureLab monitor.

ACTION: subscribe to alerts. It is now first in the SOURCE CALENDAR printed by
validate_capacity.js.

LICENCE, and why we do not simply ingest it. PowerTracker content is CC BY-SA
4.0; our data files are CC BY-NC-ND 4.0. Those do not compose - Share-Alike
would require our derivative to carry BY-SA, which conflicts with both the NC
and ND terms. The resolution is the one we already use for IPP Office and Eskom
figures: a project FACT (name, MW, technology, location, COD) is not
copyrightable, so we use PowerTracker to DISCOVER and VERIFY, record the fact in
our own compilation with attribution, and never copy the dataset. queue_project.js
recognises a PowerTracker URL in --source and prints this note.

PowerFutureLab remains the AUTHORITATIVE half-yearly reconciliation; PowerTracker
is the fast alert. They are complements, not substitutes - use PowerTracker to
know something happened, and the monitor to true up the totals.

## STAYING CURRENT: the structural problem, and what tooling can do

Asked how we avoid missing project commissionings. The honest answer is that the
two categories behave completely differently:

REIPPPP is well covered. The IPP Office quarterly is authoritative, and Eskom's
WEEKLY system status report gives installed totals by technology - so a jump in
its Wind or PV line is a same-week signal that something commissioned. The
validation panel already compares against it.

PRIVATELY WHEELED IS NOT COVERED, and this is the real exposure. It is the
fastest-growing category in South Africa, and:
  * Eskom's weekly report does NOT include it - only NTCSA-contracted plant
    appears there, so no amount of watching Eskom will reveal a wheeled project
  * its only systematic source, the PowerFutureLab monitor, is HALF-YEARLY
  * so the file can be six months behind on the segment moving quickest

That means trade press is not a poor substitute for a proper source - for
wheeled capacity it is genuinely the FASTEST signal available. Queuing from it,
as done on 17 Aug for Koruson 2, Ilikwa and Ummbila Emoyeni, is the right
workflow rather than a workaround.

validate_capacity.js now prints a DATA FRESHNESS block on every run: how old the
file is, whether a newer IPP Office quarterly should exist (quarter end + 75
days), a louder warning once private coverage passes 180 days, the MW already in
construction, and a SOURCE CALENDAR with what to check and how often. It also
states the drift-detector limitation above, so the next person does not assume
Eskom's weekly covers everything.

## QUEUED: five privately wheeled projects commissioned Aug 2026 (17 Aug)

Koruson 2 (Envusa, 520 MW: Umsobomvu 140 + Hartebeesthoek 140 wind, Mooi Plaats
240 solar), Ilikwa (Mainstream, 50 MW solar, Free State) and Ummbila Emoyeni
phase 1 (Seriti Green, 155 MW wind, Mpumalanga). Total 435 MW wind + 290 MW
solar, ALL privately wheeled rather than REIPPPP.

NOT hand-added, for the same reason as Graspan: the capacity file is anchored to
the IPP Office Q4 (31 Mar) and PowerFutureLab H1 2026 monitor, and these
commissioned in August. Queued in supply_area_split_draft.json instead, and
validate_capacity.js now prints BUCKET-AWARE instructions - private wheeled goes
to by_source.private and does NOT touch the Eskom Week-32 reconciliation, because
Eskom does not meter it. The previous single instruction said "add to reipppp"
for everything, which would have sent the next person to the wrong bucket.

On rollforward these would take windMW 4,612 -> 5,047 and pvUtilityMW 3,151 ->
3,516 (with Graspan). Note that would WIDEN the gap against Ember's Wind line,
correctly: Ember counts only NTCSA-contracted plant, so more wheeled capacity
means the model should read further above it, and the validation note explaining
that will need its numbers updated.

DATA CAUTION recorded in the queue entry: Ilikwa's announced ">140 GWh/yr" over
50 MW implies a 32% capacity factor, which is not credible for Free State solar
(our regional profile gives ~22%, single-axis tracking reaches 26-28%). Use the
nameplate, not the announced energy.

Also notable for the model's structure: Ummbila Emoyeni puts private wind in
MPUMALANGA, where regional wind capacity is currently zero - the coal heartland
is starting to host renewables, and the regional file will need a Mpumalanga
wind entry it has never had.

## RESOLVED: wind_nameplate_est in profiles.json (16 Aug 2026)

`profiles.json` normalised Eskom's metered hourly wind output against
`wind_nameplate_est = 3466` MW, giving `wind_cf_2025 = 0.373`. The METERED
ENERGY was always right - 3,466 x 8760 x 0.373 = 11.33 TWh against Ember's
11.35 TWh for calendar 2025, agreeing to 0.2% - but the divisor understated the
operating fleet, so every per-unit value was inflated by ~1.17x.

Re-derived by requiring the series to reproduce Ember's 11.6 TWh (12 months to
May 2026) over the 4,142 MW fleet Eskom actually meters (REIPPPP 4,042 + Eskom
Sere 100). That solves to 4,044 MW - which lands on the REIPPPP wind fleet
independently, a check on the method rather than a fitted value. `wind_pu` was
rescaled by 0.8629 and `wind_cf_2025` is now 0.3197.

Result: model wind 15.0 -> 12.9 TWh, of which 11.60 TWh is Ember-comparable
(exactly Ember's 11.6) and 1.32 TWh is the 470 MW of privately wheeled wind that
Eskom does not meter and Ember does not count.

DO NOT compensate for anything like this with an availability or loss derate in
the engine. That was tried on 16 Aug 2026 and reverted: the national profiles are
METERED output (Eskom Data Portal ESK19243), so availability, electrical losses
and real curtailment are already inside them, and the regional Renewables.ninja
series additionally carries an explicit 10% PV system loss. A derate charges
those losses twice, and would have produced roughly the right number by the wrong
mechanism - breaking the moment anyone corrected the nameplate.

`pv_nameplate_est` (2,789 MW, CF 20.8%) was checked the same way and LEFT ALONE.
Ember's Solar line is all solar - utility plus distributed - so there is no clean
utility-only external anchor, and 20.8% is a reasonable SA fixed-tilt figure.

## Three planner/developer features added (15 Aug 2026)

1. **System adequacy panel** (above the validation block). LOLE (h/yr with
   unserved load), EUE (GWh/yr), and monthly reserve margin as a 12-bar chart
   with hover detail. Firm capacity = coal x EAF + nuclear x0.9 + hydro +
   imports x0.85 + peakers + storage power + hybrid x CF; wind/solar excluded
   from firm by convention (they reduce residual load), matching Eskom's weekly
   OR framing. Verified: LOLE/EUE reconcile exactly with the run's unserved
   hours; defaults show 0 LOLE, firm 39.2 GW, min margin 24% (Jun).
2. **Unified project pre-feasibility** (was solar-only). Solar / wind / hybrid
   (60/40, same convention as the data-centre tab). Wind CF comes from the
   clicked region's profile (same source as the resource tab); wind capex R21/W
   (the main model's build cost); opex 1.5%/2.5%/2.0% of capex by tech. The
   report shows the chosen tech's CF and swaps "peak sun hours" for
   "equivalent full-load hours" on non-solar.
3. **Site curtailment risk in the Grid connection tab.**
   applyCurtailmentToMap now publishes per-region shares
   (window.__nodalCurtByRegion), and the grid tab shows "curtailment risk at
   this connection: X%" - the SAME numbers on the SAME basis as the schematic
   labels, so the two can never disagree. Prompts to run the full model when no
   nodal result exists.

CCS module kept as-is per user decision - it is live government policy
discussion and the module's role is answering "why doesn't SA just do CCS"
quantitatively.

## Final platform sweep (15 Aug 2026) - the eight-list problem

A new carrier must be added to EVERY hardcoded carrier list, and the app had
EIGHT of its own beyond the test suites' copies. All were missing `hybrid`:

1. `DISP_ORDER` - the dispatch chart's own stack order. **The rendered chart was
   drawing without the hybrid band**: 285 MW of served generation invisible, the
   stack top floating below the demand line through 05:00-21:00. Slipped every
   suite because stress_suite validates its own (updated) key list, not the
   chart's. Worst per-hour gap now 0 MW.
2. `genKeys` in the avgCost path - hybrid's 1.77 TWh was missing from the
   gridServed DENOMINATOR while its costs sat in the numerator: **average system
   cost was overstated ~0.9%** (R550.2 -> R545.5 at defaults).
3. The same `genKeys` copy in the nodal cost overlay.
4. KPI `genTWh` plus `reShare`/`nonFossilShare` - hybrid is renewable, so the
   renewable share was understated ~0.9 pp.
5. The CSV export carrier list and its names map (now `Hybrid (RMIPPPP)`).
6. The weather-spread generation total.
7. The energy-mix donut list.
8. The accessibility dispatch table's hand-rolled total.

`lcoeOf` also gained `hybrid: 1900` (RMIPPPP awarded tariffs cluster
R1.5-2.3/kWh; midpoint) so replacement-cost weighting covers all served energy.

Also fixed in the sweep: **the NERSA category rules were two amendments stale** -
the pre-feasibility tab said a generation licence is required above 10 MWp,
which is pre-2021 law. The Aug 2021 ERA amendment raised the threshold to
100 MW and the Dec 2022 amendment (effective Jan 2023) removed it entirely:
generation of any size registers rather than licenses, and the binding steps
are environmental authorisation and the grid connection agreement. The tab now
states the post-2023 regime and says NERSA is no longer the timeline driver.

Checked clean: the BLD and MIP worker sources carry no stale VOLL (the 60000s
remaining in the file are LP variable bounds and the pumped-storage energy
constant); scenario presets reference only live sliders and current defaults;
permalink state, season toggles and CSV downloads verified against the new
carrier; no `E.x+E.y` hand-rolled sum anywhere lacks hybrid (regex-swept).

## Site Resource Query box - cross-tab audit (15 Aug 2026)

All seven tabs audited for internal consistency, cross-tab consistency, and
consistency with the main model. Three real defects fixed, one structural fix:

1. **Battery cost disagreed 4.5x between adjacent tabs.** Rooftop priced
   behind-the-meter batteries at R6,500/kWh installed; pre-feasibility priced the
   same thing at R1,450/kWh - a utility cell-pack figure mislabelled "installed
   (BNEF 2026)". A 100 kWh C&I battery really lands ~R500-700k, not R145k, so
   pre-feas payback figures were materially flattering. Both tabs now read ONE
   shared constant `BTM_BATT_R_PER_KWH = 6500` (utility-scale EPC in the main
   model is R2,625/kWh for contrast - BTM does not get that price).
2. **Wheeling tab carried its own hardcoded 2026 capture table** (Northern Cape
   solar R490 etc.) while the Capture tab tracked the live model - the two tabs
   could show different capture prices for the same region on the same screen.
   Both now call one `captureFor(region)` helper: live-adjusted when a model run
   exists, 2026 baseline otherwise, and the footer says which. The "vs local"
   comparison also previously hardcoded "Gauteng ~R600/700"; it now prices
   building at the consumption region through the same helper.
3. **Data-centre tab sized on national profiles but labelled with site CFs.**
   The hourly-matching bisect ran against the national solar shape (22.5% CF)
   while the header quoted the clicked site's CF (e.g. 26.5% in the Northern
   Cape) - a ~10%+ sizing mislabel. It now simulates on the REGIONAL profiles
   from profiles_regional.json (solar shape rescaled to the site's own CF; wind
   used directly since its mean IS the displayed CF) and the header says which
   profiles sized the build. Also removed a dead `cfHours = cf + 0.17` relic
   from the pre-hourly-model era.
4. **One emission factor.** Pre-feas and rooftop each hardcoded 0.95 kg/kWh; now
   one `BTM_DISPLACED_EF = 0.95` with the honest justification: the model's grid
   AVERAGE is 0.78 tCO2/MWh but its MARGINAL generator is coal (1.04) for 8,700+
   h/yr, and displaced generation is marginal - 0.95 is deliberately between.
   `PPA_MARGIN = 0.12` similarly unified across capture and wheeling.

Checked and left alone: grid-connection tab (reads the same headroom_summary and
substation kv as the nodal engine - already consistent); capture-fraction row now
shows the live fraction when live (it previously showed the static one next to a
live price, so the row could not reproduce the price beside it); wheeling TUoS
(R100-230/MWh distance-scaled) and losses (2%+0.003%/km, cap 6%) are within the
NTCSA framework's published brackets; the flat-24/7-load assumption in wheeling's
annual-energy line is now stated rather than silent.

## Deep stress test (15 Aug 2026) - two bugs found and fixed

`stress_deep.js` (repo root, `node stress_deep.js` against a checkout in
`testroot/`) probes cross-talk the standing suites don't: price<->cost coherence
per marginal technology, exact VOM decomposition, hybrid window physics, basis-
replay visibility, a full every-slider-moves-something sweep with per-slider
enabling contexts, extreme-scenario boundedness, EAF/carbon monotonicity, and
rendered-panel consistency. 40 checks; all pass as of this date.

It found two real defects on its first run:

1. **`(p.coalEAFPct || 64)` - falsy-zero fallback.** EAF=0 silently became 64%:
   "total coal collapse" scenarios showed ZERO unserved energy with the whole
   fleet dead. Fixed with `??` at three sites (dispatch, LP inputs, and a third
   consumer), plus the same fix on `syncMinMW`. After the fix, EAF=0 correctly
   yields ~122 TWh unserved and unserved is monotone in EAF.
2. **LP VoLL drift.** Both build LPs hardcoded `VOLL = 60000` while dispatch
   prices unserved energy at `FIXED.voll = 87000` (CSIR cost of unserved
   energy) - planning penalised blackouts 31% cheaper than operations priced
   them. Both LPs now read `S.voll ?? 87000`. The national build LP re-solved
   Optimal (R335.8bn, builds at the IRP rate caps) after the change.

Two things it flagged that are NOT bugs, recorded to save the next person the
investigation: storage discharge exceeds charging by up to the fleet's initial
state of charge (~64 GWh, drawn down once per year - a convention, not free
energy); and `outVolPct`/`getsEnabled` legitimately move nothing in the
deterministic engine (Monte Carlo panel and nodal corridors respectively).

## Known distortion: `rooftopMW` is not all rooftop

Eskom's footnote to the series `FIXED.rooftopMW` is taken from reads:

> Rooftop PV includes ground-mounted as well as all other PV installations that do
> not have contracts with NTCSA.

The bucket is **contractual, not physical**. Any ground-mounted farm selling to a
private offtaker has no NTCSA contract and lands here rather than in Eskom's PV
line - Mooi Plaats (240 MW), Bolobedu (148 MW) and the rest of the PFL wheeled
list are inside the 9,100 MW.

**Why it matters here.** `rooftopMW` nets off demand: it is modelled as demand
suppression, never curtailed, and takes no connection headroom. Ground-mounted
grid-connected plant is the opposite - it is supply, it can be curtailed, and it
competes for headroom. So an unknown slice of this constant is modelled as the
wrong kind of thing. The effect is to understate utility-scale generation and to
understate the curtailment and headroom pressure it creates, which is exactly what
the nodal engine exists to measure.

**Not corrected, deliberately.** Eskom publishes one number and does not break out
the ground-mounted share. Fixing it needs that split, not an estimate: an estimate
would move capacity between two constants that are each independently sourced,
which is a worse position than a documented distortion. Candidate sources are
SAPVIA's portal segments (C&I large-scale 1-50 MW and utility-scale are the
ground-mounted candidates) or PFL's wheeled-project monitor, which lists such
projects individually and is already a source in this model.

**Interaction with the pvUtilityMW gap below:** the 488 MW of PFL wheeled solar
currently in `by_source.private` is inside Eskom's rooftop figure too, so it is
double-counted today. That is a live error, unlike the distortion above.

## The pvUtilityMW gap - RESOLVED 15 Aug 2026

`pvUtilityMW` was a hand-set 4,974 MW carrying an unexplained 1,823 MW above its
sourced components. Eskom's Weekly System Status Report (Week 32, Aug 2026)
settled it: their "PV" line - NTCSA-contracted utility PV - is **2,780.2 MW**,
which our REIPPPP figure of 2,663 MW (31 Mar 2026) reproduces exactly after
adding Graspan (75 MW, COD Apr 2026, after our reporting date) and ~42 MW of
later CODs. So the REIPPPP component was complete all along; there was never a
hidden pre-2026 wheeled fleet; **the constant was simply wrong** - the same
failure and the same fix as `windMW` (4,458 -> 4,512). CSIR's utility-scale
series corroborates independently.

Corrected values, both now derived and strictly asserted (16/16, zero pending):

    pvUtilityMW = 2,663 REIPPPP + 488 PFL wheeled            = 3,151
    rooftopMW   = 9,107.4 (Eskom Jun-26 table) - 488 wheeled = 8,619.4

The 488 subtraction removes the **double count**: Eskom's rooftop bucket is
contractual (their footnote: includes ground-mounted plant without NTCSA
contracts), so the wheeled fleet sat in both constants. The two identities now
share one sourced number (`by_source.private`) and cannot drift apart. The
earlier PFL-monitor request and the "definitional question" below it are moot;
the sections that discussed them are superseded by this one.

Impact: removes 2,311 MW of phantom solar from the national engine (the nodal
engine already used the correct file). Default average price R738.6 -> R741.3
(+0.4%); diesel hours 14 -> 16 - slightly less midday solar, slightly more
evening scarcity. The validation panel now shows both constants against Eskom's
Week 32 lines with the reconciliation in the notes.

## Supply-area split (applied 14 Aug 2026)

The IPP Office reports by PROVINCE; this model is keyed by Eskom TRANSMISSION
SUPPLY AREA - ten values including Hydra Central, which is not a province at all.
`build_capacity.py` step 1b redistributes each province's ONLINE capacity using
CONTRACTED shares from `nodal/supply_area_split_draft.json`, built by
`build_supply_area_split.py` from the IPP Office project-location table (BW1-BW4
+ CSP window) plus the DMRE BW5 preferred-bidder statement.

**Applied as shares, never as absolute megawatts.** The split file carries
contracted capacity; this file carries capacity online. Substituting contracted MW
directly would break the national identities. The build asserts each technology's
total is unchanged to within 0.2 MW.

Two consequences that look like bugs and are not:

- **Eastern Cape solar is ZERO.** Dreunberg is the only EC solar project in
  BW1-BW4 and it connects into Hydra Central, so all 70 MW moves. Verified with a
  real site coordinate: Ruigtevallei 70.5 km vs Delphi 142.6 km.
- **Western Cape wind gains ~419 MW.** Roggeveld, Karusa and Soetwater are filed
  by the IPP Office under the Northern Cape but connect at Komsberg, in the
  Western Cape supply area. This is the Hydra Central distortion running the
  opposite way, and it is the reason the split exists at all.

Hydra Central goes from 88 MW wind / 256 MW solar to **669 / 459 MW**. Its largest
single input is EDF's Koruson 1 cluster (San Kraal + Phezukomoya, 280 MW), sited at
Koruson substation on a STATED connection point rather than a proximity estimate.

Pending: Graspan Solar (75 MW, Siyancuma, Northern Cape) was commissioned in April
2026, just after the 31 Mar 2026 reporting date. It belongs to the Northern Cape
supply area and should be added when the capacity file rolls forward - see
`pending_next_quarterly` in the split file.

## Cost families - which number governs what (audited 14 Aug 2026)

The model carries four cost representations. This is the professional structure
(PLEXOS / PyPSA / ReEDS): capex + life for investment, SRMC for dispatch, LCOE as
reporting only - never an optimisation input, because LCOE bakes in an assumed
capacity factor, which is what a model is supposed to solve for.

| Family | Where | Governs | Notes |
|---|---|---|---|
| `BLD_COST` + `BLD_LIFE` + `BLD_DISC` | index.html | **What gets built** - both capacity-expansion LPs, via `bldAnnuity()` | Overnight R/kW + real decline rates, documented at the block |
| `cost*` (six constants) | `FIXED` | **Who runs and what hours clear at** - dispatch SRMC | Fuel-only by source definition (Eskom "primary energy input costs only"). Carbon added separately via `carbonTaxRPerT x emis*`. VOM deliberately absent - adding it is a live decision affecting all technologies at once |
| `acap*` | `FIXED` | Nothing - headline capex reporting (`newCapexR`) | R/kW-yr annualised |
| `lcoe*` | `FIXED` | Nothing - replacement-cost reckoning (`replTotal`) and the comparison chart | Reconciled to slider values 14 Aug 2026 (`lcoeBatt` 1450->1600, `lcoePv` 575->550, zero behavioural change); every shadowed slider now reads `def:FIXED.x` and `validate_lp.js` asserts they never diverge |

Sourcing added the same day: `costCoal` 546 = Eskom FY2025 coal primary energy;
`costDiesel` 6100 vs ~R6,011/MWh observed Mar 2026; `costNuclear`, `costHydro`,
`costImports` bases documented at the block. `costCcgt` 2800 predates the JKM
benchmark work and sits high - see open items.

## Open items

1. **Pre-2026 private capacity.** The PFL H1 2026 monitor is in and populates
   `by_source.private` with 958 MW of wheeled plant. It does **not** close identity 3:
   roughly 1,823 MW of solar remains unexplained against `FIXED.pvUtilityMW`. That
   constant is still 4,974 and known to be high; it has deliberately **not** been
   changed to an unsubstantiated figure, and the "Existing fleet" documentation row
   still reads "Utility PV 4 GW" for the same reason. Change both in one commit once
   the earlier private capacity is sourced.
2. **`carbonPrice` is disconnected.** It is not a key of `FIXED` and not a slider — the
   nearest is `carbonTaxRPerT`. So `CARBON` is pinned at R550/t in both LPs regardless
   of what a user sets. Same class of disconnection as the `S` bug, but it needs a
   decision about intent: whether `carbonTaxRPerT` should feed it, and whether R550
   should survive at all given the statutory rate is R308 with allowances taking the
   effective rate far lower.
3. **`emisCoal || 0.95` at line 5812 disagrees with `FIXED.emisCoal` = 1.04.** Dead
   today, because that site already uses `{ ...FIXED, ...state }`. A latent wrong
   answer if the resolution ever changes.
4. **Fourteen other surviving `X || <literal>` fallbacks** shadow a `FIXED` key (the
   CCS cluster at 3116–3182, `coalInstalledMW` at 3206, `costCoal` at 5811,
   `costDiesel` at 8998, `ccgtMW` at 9056). All currently agree with `FIXED`. That is
   the pre-drift state, not a safe one.
5. **Named-project layer.** The Q4 quarterly is aggregate throughout — zero project
   names. The annual *"An Overview of the IPPPP"* on the same publications page
   historically carries project-level tables and is the route to named entries and the
   Hydra Central split.
6. **`sa_solar_grid.json`** is fetched at index.html:798 and does not exist; the page
   degrades to the Open-Meteo ERA5 fallback. Probably obsolete — remove the fetch or
   restore the file.

---

## Sources

**IPP Office** — https://www.ipp-projects.co.za/Publications/
Quarterly *"An Overview – IPPPP"* reports. The current data is from **Q4 2025/26, as at
31 March 2026**; page 18 carries capacity online and in construction by province and
technology, which is the table the rebuild is built on. Covers REIPPPP and RMIPPPP
**only** — no private or wheeled capacity. The quarterly gives no project names; the
annual overview does.

**Power Futures Lab, UCT GSB** — Alao, O. & Kruger, W. (2026). *South African IPPs:
financial close and commercial operations monitor, H1 2026 update.* H1 2026 saw 1,920 MW
reach commercial operation — 874 MW grid supply, 958 MW wheeled, 88 MW captive. The
captive capacity is deliberately excluded from installed capacity: it sits behind the
meter and suppresses demand rather than adding supply. Knowledge Hub:
https://powerfutureslab.co.za — deep links 404; navigate via Research → Knowledge Hub,
or email pflenquiry.gsb@uct.ac.za The extracted H1 2026 table is committed as
`nodal/pfl_private_h1_2026.json`; `build_capacity.py` reads it and asserts its regional
split sums to its own stated total.

---

## Gotchas

- **Province naming.** Keys are `Kwazulu Natal` (not `KwaZulu-Natal`) and include
  `Hydra Central`, which is a supply area, not a province. Normalise at the data layer,
  never at the point of use. This has caused three separate bugs.
- **Recompute, don't hand-edit.** `total_mw`, `solar_mw`, `wind_mw`, `batt_mw`,
  `by_status` and `earliest_status` are all derived from the project list by
  `build_capacity.py`. `validate_capacity.js` asserts they match.
- **Fingerprints.** Both data files now carry a `gtza-` SHA-256 over the body excluding
  `meta`. They did **not** before this rebuild, despite the previous handover listing
  regeneration as a standing gotcha — the field simply wasn't there.
- **`build_capacity.py` runs from the repo root**, not from `nodal/`, despite living
  there.
- **Aggregates.** Named entries where the source names them; otherwise a cited
  province-and-technology cell from a published table. Never an opaque bundle like the
  old "BW5 solar portfolio 514 MW" — you cannot reconcile a named project against a
  bundle. Capacity with no published provincial split goes in `unallocated`, not
  apportioned by guesswork.
- **Licence.** Data files are CC BY-NC-ND 4.0, © 2026 Nick Hedley.
