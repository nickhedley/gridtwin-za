# GridTwin ZA - current state

## Fitness for purpose - read this before quoting anything

Written 30 Aug 2026, revised 31 Aug after a day of recalibration that moved several
published levels. What this model can carry, what it cannot, and which published numbers
depend on which. A reader deciding whether to cite GridTwin should start here.

### solid: the engineering identities

```
hourly energy balance      worst error 7.3e-12 MW across every scenario tested
cost identity              totalCost reproduces its components to the last digit
storage round trip         0.776-0.815, correctly between psEff 0.76 and battEff 0.88
emissions                  track fuel burn plus the documented part-load penalty
control sweep              76 controls x min and max, no NaN, no negatives, nothing absurd
suite                      19 harnesses, 941 checks
weather                    ten real years, bias correction confirmed from two independent
                           derivations agreeing to 1.1%
capacity data              reconciles to source through asserted identities; where it does
                           not - the 1,823 MW solar gap - the validator refuses to go green
adequacy                   reported as LOLE and expected unserved energy over 48 draws
                           varying outage path and weather year, with the standard error
                           stated - not a single draw
```

### defensible in front of a hostile reviewer

Findings grounded in data rather than in dispatch:

- **Connection headroom.** The four best-wind regions hold 100% of existing wind and
  7.3% of national wind headroom, and zero solar headroom. Arithmetic on published
  figures.
- **Locational transmission cost**, R150 to R735/kW-yr, from the corridor graph with the
  capacity-weighted mean reproducing the existing R600 exactly.
- **Wind versus solar capture asymmetry.** Solar cannibalises itself, wind does not. The
  mechanism - every solar plant produces in the same hours - is obvious once stated.
  Re-verified 31 Aug: wind holds 96-107%, solar falls to 2.7%, four of five build points
  reproducing within two points. Note the starting point moved - solar already earns 24%
  below the market average today, where the earlier version showed near-parity.
- **Iron-air does not solve a winter wind drought.** Survived a heuristic, an optimal LP,
  and a reserve-constrained LP. The strongest-tested result in the file.
- **Coal flexibilisation worsens adequacy in a no-gas system**, ten years out of ten,
  with a 166 GWh spread against a 4,200 GWh weather spread.

### DO NOT quote

```
the 37% storage gap     Withdrawn 30 Aug 2026 - a price-taker accounting artefact
rolling-horizon July    a comparison on a metric neither run optimises
avgCost as a tariff     six of NERSA's thirteen price components are absent from it,
                        including legacy cost recovery and distribution charges

SUPERSEDED 31 Aug 2026 by the constant corrections. All were measured on a model with
coal capacity 5.8% too high, imports more than double reality, and availability three
points optimistic - which together suppressed the evening scarcity South Africa prices.

hybrid uplift rising    The curve is U-SHAPED: +130% today, +8% in 2030, +386% by 2035.
                        "Storage becomes valuable later" is the wrong conclusion.
solar capture ~98%      Solar earns 24% BELOW the market average today, not near parity.
wind merchant R758      R977 at 2026, and it falls further - -67% not -59% at grid pace.
battery knee 3.8 GW     ~2.5 GW. South Africa is already PAST it, not approaching it.
any single-draw shed    Adequacy figures from one outage seed. The shipped seed alone
                        gave the worst of ten tested. Quote LOLE and EUE with their
                        standard error, never one draw.
```

### the honest weak spot: storage dispatch

The heuristic charges best-round-trip-first with no value function on state of charge.
Partly addressed 31 Aug: pumped storage now carries a peak reservation, so it no longer
empties before the annual peak - measured 0 to 2,331 MW at the peak hour, and 324 GWh
less unserved in the 2023 crisis scenario. The charging side, and the allocation between
chemistries, are untouched and still need the LP.

Which published results lean on it:

```
does NOT       iron-air / long-duration - survived the LP
leans ON IT    lithium duration wall (4h vs 10h)
leans ON IT    no-gas frontier
leans ON IT    the storage-mitigation half of the capture-rate curve
```

Those three are directionally sound and quantitatively uncertain. Every model carries a
dispatch approximation; this one is documented rather than assumed.

### where this is not yet plexos or PyPSA

- Storage is not CO-optimised with unit commitment.
- No intra-hour balancing product - the model is hourly, and NERSA's own wholesale
  pricing methodology names balancing costs as a component.
- The national engine is single-node, so the frontier costing cannot see the network its
  own locational analysis says is binding. Two engines, and only one scales that far.
- No stochastic outage or forecast-error representation.

### why it is nevertheless defensible

Not because the model is right, but because **every number carries its scenario and its
caveat, and claims get withdrawn when they fail**. On 30 Aug 2026 alone: a headline
claim withdrawn, two of the maintainer's own explanations corrected, and two changes
reverted after measuring worse. A tool that does that in public is more trustworthy than
one that does not.

---


What is true right now. Rewritten in place, never appended to. If a fact here
disagrees with log.md, this file wins. If it disagrees with a data file, stop -
that is the failure mode that cost most of 27 Aug 2026.

Last verified: 28 Aug 2026, end of session.

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

Hydra Central is **not zero**. It carries 669 MW wind and 459.5 MW solar from the
supply-area split, applied 14 Aug 2026 by `build_capacity.py` step 1b reading
`nodal/supply_area_split_draft.json`. The old text here said zero, and the data file's
own `HYDRA_CENTRAL_ZERO` note still says zero — both were stale, and following them
would have meant regenerating with the wrong script and destroying the split. See
"Known distortions" for what remains genuinely unresolved.

### Pipeline — 7,046 MW

```
provincially allocated  1,532 MW   includes Mulilo Total Hydra 75 (added 28 Aug)
unallocated             5,514 MW   BW7 (3,940), BESIPPPP BW2/BW3 (1,231),
                                   RMIPPPP construction (203), BW6 sixth project (140)
terminated              1,424 MW   BW5 cancellations, outside the identity
```

Was 6,971 before Mulilo. Note: an online project sits in this file too (Doornhoek,
Mulilo), so "pipeline" is a register of projects and stages, not a not-yet-built total.

### Fingerprints, as at 28 Aug 2026

```
regional_renewable_capacity.json   gtza-4ec9bc7cc8d3285d
ipp_pipeline.json                  gtza-06192db1e33eb439
substations_compact.json           gtza-0fe0a41096f9685a
pfl_cod_h1_2026.json               None — should have one, see open items
```

Method, verified by reproduction: `sha256` over the body excluding `meta`,
canonicalised as `json.dumps(sort_keys=True, separators=(',',':'))`, prefixed `gtza-`,
truncated to 16 hex characters.

`by_source` now has four buckets: `reipppp`, `private`, `eskom`, `rmipppp`. The last
was added 28 Aug to hold Mulilo Total Hydra at 75 MW under a new `hybrid_mw` key —
Not `solar_mw`, because the plant is 216 MWp of solar behind a 75 MW contracted
dispatchable output. `FIXED.pvUtilityMW` is untouched at 3,271 MW as a result.

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

**2. Preferred bidders reconcile to financial close plus pre-fc:**

```
preferred_bidders = reached_FC + pre_FC
           12,405 =      7,825 +  4,580     (BW6 awaiting CC 640 + BW7 3,940)
```

**3. National constants, decomposed by source — both pending:**

```
FIXED.pvUtilityMW = sum(solar tagged reipppp) + sum(solar tagged private)
FIXED.windMW      = sum(wind  tagged reipppp) + sum(wind  tagged private)
```

The IPP Office covers REIPPPP and RMIPPPP only. It does not report, and does not
allocate by province, the privately procured wheeled capacity. So every regional entry
carries a `source` tag and the national constant is the sum of both components.

```
wind    4,042 + 470 = 4,512  vs  windMW      4,512   Pass
solar   2,663 + 488 = 3,151  vs  pvUtilityMW 4,974   gap 1,823 MW, pending
```

**Wind now passes, and `windMW` was corrected to 4,512 as a result.** It previously read
4,458, built as 3,600 + 858, where the 3,600 baseline had muddled provenance and the 858
mixed grid-supply with wheeled capacity — a figure that could not be decomposed. The two
sources are disjoint universes: the IPP Office does not cover private procurement, so
Umsobomvu and the three Impofu farms appear once, in the private bucket.

Read that pass for what it is. `windMW` is now **derived** from these components, so the
equality is a consistency check, not independent corroboration — it confirms the constant
and the file agree, and fails loudly if either is edited alone. It will also fail if
pre-2026 private **wind** is later found, which is the correct behaviour: the constant
would then be understated and must be re-derived, not patched.

Solar stays pending. `meta.private_coverage` is `h1-2026-only`, and the validator only
evaluates the solar identity when it reads `complete`. **Do not let it go green on a
widened tolerance** — the 1,823 MW residual is the finding.

This is what the source tagging bought: the overshoot only became visible once
`by_source` was populated. A single opaque total had hidden a badly derived constant.
Keep identity 3 as a permanent assertion, not a one-off check.

---

## Validation — all must pass (verified 27 Aug 2026)

Nineteen harnesses, 941 checks. Last full run: 941/941.

```
node stress_suite.js                290/290
node validate_invariants.js .       147/147
node validate_response.js .           81/81
node validate_lp.js .                 50/50
node validate_outputs.js              33/33
python3 audit.py index.html           78/78
node validate_benchmarks.js .        22/22
node validate_capacity.js .           28/28   Mulilo closed + 10 new integrity checks
node validate_geo.js .               43/43   SA boundary clamp, added 30 Aug
python3 audit3d.py gridtwin-3d.html     9/9   the 3D page, added 30 Aug
python3 validate_docs.py . nodal       21/21   the documents, added 30 Aug
node validate_findings.js .          16/16   the PUBLISHED FINDINGS, added 31 Aug
node validate_weather.js .            48/48   multi-year path, added 28 Aug
node validate_consistency.js .       35/35
node validate_structure.js .         22/22
node validate_solve.js .                6/6
node eng5.js                            6/6   monotonicity
node validate_external.js .            4/4
node validate_lint.js .                 2/2
node jsdom_local2.js                renders without error
```

`jsdom_local2.js` reports two `ctx.createPattern is not a function` errors at
index.html:7210 — that is jsdom lacking canvas, not a regression. It is a
diagnostic dump rather than an assertion suite: it prints box character counts
and exits 0 regardless, so read its output, do not just check the exit code. It
also reports `shed` at 0 chars and `state` as undefined on the window while
`lastRes` is a proper object. Unverified whether that is normal for this
harness; nothing asserts on it either way.

### The 17/18 closed on 28 Aug 2026 — correctly, not by relaxing anything

`validate_capacity` flagged Mulilo Total Hydra Storage as commissioned and counted
in neither file. It was added properly: 75 MW contracted (not the 216 MWp installed,
which would treble Northern Cape solar) into a new `by_source.rmipppp` bucket under a
new `hybrid_mw` key, Northern Cape, plus an `ipp_pipeline.json` entry with
`status: online` and `cod: 2026-07`. Both through the generator, not by hand.

Trap avoided, worth knowing: the harness offers two routes, the pipeline or
`by_source`. Only `by_source` adds capacity. Adding to the pipeline alone would have
scored 18/18 with the 75 MW still uncounted — a green check on an unchanged number,
worse than the honest 17/18.

COD remains 2026-07 pending the PFL Knowledge Hub table.

  75 MW contracted, 216 MW installed. use the contracted figure.

  COD unresolved, leaning H1. PFL places it in H1 2026, so on or before 30 June.
  Engineering News reports it inaugurated and brought into operation on 16 July
  2026. These are not necessarily in conflict: inauguration is a ceremony and
  usually follows commercial operation by weeks. PFL is also the better source
  for a COD. But the H1 monitor's own cutoff makes its placement partly
  circular, so the PFL IPP Knowledge Hub COD table is what settles it. That
  decides H1 versus H2 2026, and nothing else.

### How to invoke them — this bites

Ten harnesses take the root as `argv[2]` and default to `.`. Two default to
`testroot`. Three ignore the argument entirely:

  stress_suite.js      no root variable. Hardcodes `nodal/...` and `index.html`
                       as paths relative to the working directory. Passing
                       `testroot` does nothing — the argument is discarded and
                       the run silently uses cwd. It therefore appears to work
                       from the repo root and fails from anywhere else with
                       MODULE_NOT_FOUND on ./nodal/nodal_engine.js.
  eng5.js              Hardcodes `testroot/index.html`. Run from the parent.
  jsdom_local2.js      Hardcodes `testroot/index.html`. Run from the parent.
  validate_outputs.js  Hardcodes path.resolve('testroot'). Run it from the
                       Parent of testroot, not from inside it.
  validate_capacity.js, validate_lp.js   default to 'testroot' if no argument.

So there is no single working directory that runs all fifteen. Run
`validate_outputs`, `eng5` and `jsdom_local2` from the parent; run
`stress_suite` from the root that holds `index.html` and `nodal/`; the rest take
that root as an argument from either place.

### profiles.json is load-bearing for two thirds of the suite

`index.html:11378` fetches `profiles.json` from the repo root — not from
`nodal/` — and falls back to synthetic profiles when it is absent. The fallback
is silent everywhere except `validate_outputs`, which detects it and refuses to
score rather than reporting invalid benchmarks.

Running the suite without it produces eleven false failures across five
harnesses, every one of which looks like a separate bug:

```
                        synthetic        real
validate_benchmarks       11/18         18/18
validate_invariants      127/138       138/138
validate_response         76/79         79/79
validate_structure          8/9           9/9
validate_external           1/2           2/2
```

What they looked like: total energy 193.3 TWh against an Ember-equivalent
218.8; CO2 137.6 Mt against 175, a 21% shortfall; solar cf 27.8% and rooftop
22.6%, both above their plausible bands; CSP below its; PV at 3,561 MW against
a 3,271 MW cap; and a peak-demand disagreement of 27.7 GW against 33.2 GW that
looked exactly like the 17 Aug storage-charging bug. All one cause: a synthetic
solar shape that is too generous, and a demand series that peaks in a different
hour.

The rule: before investigating any failure below the top four lines, confirm
`profiles.json` is at the repo root. A run without it is not evidence.

### Data the suite needs

`nodal/` plus `profiles.json` at the root. `validate_capacity` additionally
reads `nodal/regional_renewable_capacity.json`, which `index.html` never
fetches — it is a harness input, not a page dependency.

### Corrections to the previous version of this block

- It listed seven scripts. There are fifteen. The eight unlisted were the
  bug-hunt session harnesses plus validate_solve.
- `validate_lp` was recorded at 18/18. It is 40/40; the harness grew and the
  count was never updated.
- `validate_capacity` was recorded at 14/14 with one pending. It is 17/18.
- Open item 6 said `sa_solar_grid.json` does not exist. It does — see below.
- The suite is now fifteen harnesses and 691 checks, all passing. `validate_lp` grew
  40 -> 50 with a capex-coverage check; `validate_lint` grew 1 -> 2 with a check that
  every `FIXED.<key>` read names a real key. Both were scored against the pre-fix files
  first and fail there, as rule 2 requires.

### DO NOT retire eng5.js. validate_response does not replace it.

Checked 27 Aug 2026, because an earlier draft of this block assumed it was
redundant and it is not.

`validate_response`'s SIGN_RULES cover four of eng5's six checks — vre against
coal, demand against coal, EAF against lole — and add carbon-tax and
decommissioning rules eng5 lacks. But `newBattMW` appears nowhere in SIGN_RULES,
so two of eng5's checks have no equivalent anywhere in the suite:

    5. more storage must not increase curtailment
    6. more storage must not increase unserved energy

Retiring eng5 would silently drop storage monotonicity. That is the exact
failure mode validate_lp's own header warns about — a check that disappears
while everything still passes.

The durable fix is to add `newBattMW: { curtTWh: -1, unservedTWh: -1 }` to
SIGN_RULES so the two suites overlap rather than depend on each other. Until
then both must run.

### sa_solar_grid.json is an orphan, not a missing dependency

The file is present at `nodal/sa_solar_grid.json`, 23 kb, and it is real data:
PVGIS SARAH2 v5.2, a 0.5-degree grid over 16–33°E and 22–35°S, 739 valid points
of annual capacity factor, nulls for ocean and outside-coverage.

Nothing fetches it. The only reference anywhere in the repo is the comment at
index.html:1291, which states the file has never existed and that the PVGIS path
is "worth reviving if the grid is ever built".

The grid has been built. So this is not a dead branch to delete — it is a
completed input whose consumer was removed on 14 Aug 2026. Reconnecting it would
replace the Open-Meteo ERA5 fallback that the code's own comment says
overestimates by 10–15%, with satellite-observed irradiance at roughly 5%.

Two things to do, in order: correct the comment, which is now false; then decide
whether to reconnect. Do not delete the file.

### Why validate_capacity and validate_lp exist

The five harnesses that predated them returned a **full pass against the old, provably wrong capacity file**.
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

## Open items

1. **Pre-2026 private capacity.** The PFL H1 2026 monitor is in and populates
   `by_source.private` with 958 MW of wheeled plant. It does **not** close identity 3:
   roughly 1,823 MW of solar remains unexplained against `FIXED.pvUtilityMW`. That
   constant is still 4,974 and known to be high; it has deliberately **not** been
   changed to an unsubstantiated figure, and the "Existing fleet" documentation row
   still reads "Utility PV 4 GW" for the same reason. Change both in one commit once
   the earlier private capacity is sourced.
2. ~~`carbonPrice` is disconnected, pinned at R550/t.~~ **stale — checked and closed
   29 Aug 2026.** Neither part of this is true any more. Both LPs read
   `const CARBON = S.carbonTaxRPerT` (lines 6434 and 6981), so the slider does feed
   them. There is no R550 literal anywhere in the file. `carbonTaxRPerT` is **46**, not
   550, and its slider already documents why.

   the R46 is correct and well sourced. Phase 2 headline is R308/t from 1 Jan 2026, up
   from R236. Electricity generation moved into the carbon tax from that date with up to
   **85% tax-free allowances**, so R308 x 0.15 = R46/t effective. That matches the
   slider's own note. Independent corroboration: the effective rate across the economy
   after allowances is reported at roughly R105/t, and generation sits below that because
   its allowance is at the top of the range.

   Alignment with professional practice — this is the part worth acting on. Models of
   this kind carry two carbon numbers and GridTwin has one:
     - a compliance price, what generators actually pay, which drives dispatch. R46 is
       right for this and is what the model uses.
     - a shadow or policy price, used to test what a decarbonisation target would cost.
       plexos and PyPSA studies routinely run both. The slider's suggested values —
       R308 headline, R462 by 2030, R640 for a carbon-budget breach — are exactly the
       policy-price ladder, so the capability exists; it is just not labelled as a
       distinct concept.
   on checking, the gap was smaller than first written. GridTwin already carries both
   prices in the correct relationship: the compliance price as an input (R46) and the
   shadow price as an output — the marginal abatement cost from the carbon cap dual,
   already displayed alongside the compliance price with the comparison spelled out.
   That is the professional structure. No restructuring was needed or done.

   fixed 29 Aug 2026, presentation only: the slider was labelled "Effective carbon
   price" while offering R308, R462 and R640 as things to try — none of which is an
   effective rate. A user setting R462 could reasonably read it as what generators will
   pay in 2030, when at 85% allowances the effective rate would be nearer R69. Label is
   now "Carbon price" and the note separates the compliance price from the policy
   ladder, and points at the carbon cap's marginal abatement cost for the reverse
   question.

   Watch: a suspension of the carbon tax was under Cabinet consideration in Feb 2026 and
   NERSA has disallowed Eskom from recovering carbon tax through tariffs to end-2030. If
   either holds, the compliance price for generation is arguably zero, not R46. Recheck
   before quoting carbon costs externally.
3. **`emisCoal || 0.95` at line 5812 disagrees with `FIXED.emisCoal` = 1.04.** Dead
   today, because that site already uses `{ ...FIXED, ...state }`. A latent wrong
   answer if the resolution ever changes.
4. ~~Fourteen surviving `X || <literal>` fallbacks shadow a `FIXED` key.~~ audited and
   closed 31 Aug 2026. There were 55, not 14, and they fall into three classes with
   different verdicts - the audit is recorded at the fixed block in index.html so the
   next person to grep for `||` finds the reasoning rather than repeating it. One was
   genuinely wrong and is fixed. See below.
5. **Named-project layer.** The Q4 quarterly is aggregate throughout — zero project
   names. The annual *"An Overview of the ipppp"* on the same publications page
   historically carries project-level tables and is the route to named entries and the
   Hydra Central split.
6. **`sa_solar_grid.json` is an orphan, not a missing file.** The comment was corrected
   28 Aug 2026 — index.html:1291 previously asserted the file had never existed, which was
   false. Still unresolved: whether to reconnect it. Doing so replaces the Open-Meteo ERA5
   fallback (which the code's own comment says overestimates by 10–15%) with satellite-
   observed irradiance at roughly 5%. It would move every solar figure the model produces,
   so expect `validate_benchmarks` to shift and run the suite either side. Do not delete
   the file.
7. **The nearest-substation heuristic is falsified — and 31 Aug 2026 confirmed it
   decisively.** Two thirds of this item are already closed: Chatty is
   `pluscode-corroborated` in the register, and Impofu's `sub`/`subkm` were re-derived and
   now assign to Chatty at 88-93 km rather than Grassridge at 106.9.

   The remaining question was register completeness. Answered against `tdp_projects.json`,
   an independent file of 221 planned projects with named, coordinated endpoints: **seven
   TDP endpoints have no register entry within 5 km.** All are planned, several dated 2032,
   so their absence from a register of existing infrastructure is correct - but the count
   is now asserted, so a rise means the TDP has named something the register has not caught.

   **and one of the seven settles the original question.** Hlaziya sits 13.8 km from the
   Impofu wind farms. Chatty, which Red Cap actually connected to, is 72.6 km away, and
   they built 116 km of line to reach it. So the nearest substation was not merely a
   different substation - it was five times nearer, and the developer still did not use it.
   Hlaziya is planned for 2032, which is the reason: **connection choice is driven by when
   capacity exists, not by distance.** No heuristic over a register of coordinates can
   recover that. Before reusing this method for the Hydra Central split, treat it as a
   prior to be corroborated per project, never as an answer.

   **a second confirmation, 26 Aug 2026, from a project at financial close.** Red Cap's
   Nuweveld wind farm in the Upper Karoo, 720 MW initial phase, has 200 km of transmission
   already permitted with a further 100 km to build.

   ```
   our nearest-substation assignment    Droerivier, 41.0 - 64.9 km
   reported build                       200 km permitted + 100 km initial
   understated by                       roughly 5.7 times
   ```

   Same developer as Impofu, which built 116 km to Chatty when Hlaziya sat 13.8 km away.
   Two projects, one conclusion: the nearest substation predicts neither the connection nor
   its length. Nuweveld carries more weight because it is a forward commitment rather than
   a completed build explained after the fact - and it sits in Hydra Central, the best wind
   resource measured anywhere here and zero headroom for every technology. A developer
   committing 300 km of private line to escape it is the headroom finding stated in capital.
8. ~~`pfl_cod_h1_2026.json` carries no fingerprint.~~ added 28 Aug 2026,
   `gtza-a4cb23b744a2385b`, same method as the generated files. Note a fingerprint would not have caught
   the stale rollups found on 28 Aug — it is recomputed over whatever the file contains,
   so a hand edit produces a self-consistent fingerprint on wrong data. The rollup and
   generator-reproduction checks added to `validate_capacity.js` are what catch that.
9. ~~Reserve is sized as a flat share of annual peak.~~ rebuilt 28 Aug 2026 as
   contingency + demand share + vre share, resolved hourly. `sysContingencyMW` 930 (a
   Koeberg unit), `sysResDemandShare` 0.03, `sysResVreShare` 0.05. Mean requirement:
   1,768 MW today, 2,272 MW under Seriti's 45 GW, 2,438 MW at 110 GW — so the pot now
   Grows with renewable build. Ancillary fall deepened 62.1% to 64.8%; the knee moved
   out slightly and the 3,700 MW fleet still sits just below it. The panel now reads the
   engine's figure rather than recomputing its own, which is how it came to reference
   `FIXED.peakMW`, a key that never existed. Corrected again 28 Aug 2026, same session:
   the requirement now uses available vre (dispatched + curtailed) and credits curtailed
   vre as a reserve provider at 50%, giving gross / provided / net. `vreCurtMW` is tracked
   separately from `curtailMW`, which mixes vre spill with forced coal surplus and could
   not be used. Finding: at 110 GW of wind and solar the gross requirement rises to
   3,096 MW but curtailed vre supplies 2,098 MW, so the net pot for storage collapses to
   998 MW — below today's 1,768 MW. Storage's ancillary market shrinks as renewables grow,
   once curtailment begins. Invisible at 45 GW (0.2 TWh curtailed); it appears between 45
   and 110 GW. Whether it is real depends on whether South Africa lets curtailed renewables
   sell reserve — a market-design decision the EPP is taking now. Remaining uncertainty is
   in the three shares, not the structure.
10. **`weatherYearNational` was weighting by demand, fixed 28 Aug 2026.** It used
   `BLD_LOAD_SHARE` — Gauteng 31.5%, Northern Cape 1.4% — to build a national
   Renewable profile, when all South African wind sits in the Cape provinces and Hydra
   Central. Wind cf came out 22.6-27.2% across all ten years, below the 28-38% band
   `validate_benchmarks` enforces, and nothing caught it because no harness exercises
   the multi-year path. Now capacity-weighted per technology, and it refuses to build a
   profile if `regional_renewable_capacity.json` is missing rather than falling back to
   the wrong weighting. **`validate_weather.js` now covers this path** — 48 checks,
   scored against the pre-fix file first where it fails on three, including the anchor
   by 14.9%.
11. **A reanalysis bias correction of 0.848 is applied inside `weatherYearNational`.**
   MERRA-2 models the resource (37.70% capacity-weighted 2023); the metered fleet
   delivers 31.97%. `profiles.json` received this correction on 16 Aug as a 0.8571
   rescale; the regional files never did. The two factors agree to 1.1% from
   independent derivations, which is the corroboration. Re-derive whenever
   `profiles.json` or the capacity split changes. Solar is deliberately not corrected:
   22.42% modelled against 22.50% metered is noise.
12. **`profiles.json` metadata was wrong and is corrected.** `wind_source_updated`
   claimed the wind series was a MERRA-2 composite. It is the Eskom metered series.
   Second stale note found inside a data file this session, after `HYDRA_CENTRAL_ZERO`.
13. **All six falsy-zero suspects investigated and explained, 28 Aug 2026.** None is a
   bug. Five are one mechanism: a rebound peak. Modest demand shifting cuts the peak from
   31.60 to 29.23 GW, but past ~15% the shifted load rebuilds a peak in the valley and at
   30% the system costs more than with no demand response at all. Driven by fuel, not by
   `drCostR`, which stays near zero. The sixth, `asReserveRMWh`, is a designed step: the
   reserve holdback is binary on price > 0 and does not scale with price. All six are now
   Annotated in `validate_response.js` rather than suppressed — the suspect still prints,
   because the day one changes shape is the day something broke.
14. ~~Three results in results.md are still on one weather year.~~ re-run 28 Aug 2026
   across all ten. All three hold, and two are stronger than the single-year run showed.
   Iron-air changes July gas by exactly zero in all ten years. Lithium 4h-to-10h buys
   under 1% of gas in every year, tighter than the 1.7% first reported, which was the
   most favourable year. Coal flexibilisation worsens adequacy in ten years out of ten,
   by +1,057 to +1,223 GWh — a 166 GWh range against a 4,200 GWh spread in the underlying
   unserved energy, so the penalty is nearly independent of weather. It was flagged as the
   weakest result in the file; it is now among the best evidenced. The
   ten-year run on 28 Aug showed the synthetic year understates gas energy by ~35%
   and unserved energy by about a third — it is a flattering simplification, not a
   conservative one. Long-duration storage, lithium duration and coal flexibilisation
   have not been re-run. The flexibilisation result is the weakest: its 1,128 GWh
   effect sits inside a 4,600 GWh weather spread and could reverse in some years.
11. **The no-gas frontier costs the same as gas, but is not buildable on today's grid.**
   50W/60S with no gas comes out at R285 bn/yr against R285 bn for the 25 GW gas scenario.
   Checked against `headroom_summary.json`: national headroom is 21,520 MW wind and
   19,940 MW solar; the frontier needs 45,388 and 56,729. Shortfall ~61 GW. The four
   best-wind regions hold 100% of existing wind and 7.3% of national wind headroom, and
   Zero solar headroom. Northern Cape and Hydra Central are at zero for everything.
   R285 bn is a floor. The finding is about sequencing — transmission first — not about
   whether a no-gas system is affordable.
12. **Long-duration capex is single-source.** `acapVrfb` 5,565 rests on one usd 450/kWh
   estimate; NREL ATB covers lithium only and cannot corroborate it. `acapIronAir`
   12,940 comes from one transaction, pre-incentive. Both scale linearly with duration,
   which overstates long durations against NREL's finding that cost per kWh falls as
   duration rises. fx is pinned at R16.50/usd, the 180-day average to 26 Aug 2026.

---

---

## Wholesale price components — coverage against the Revised EPP

Mapped 28 Aug 2026 against section 4 of Gazette 55257. Full table in results.md.

```
produced (3)              energy, carbon, congestion duals (unpriced)
modelled, defaults OFF (3) capacity, ancillary, reserve
partial (1)               transmission — flat R600/kW-yr on new wind and PV only,
                          a build cost rather than a use-of-system charge, and NOT
                          locational. The model prices the grid identically whether a
                          plant connects into 5,500 MW of headroom or into zero.
Absent (6)                standby, legacy cost recovery, subsidy, distribution,
                          balancing, environmental compliance
```

Two actionable gaps, in order:
1. ~~Price the congestion duals.~~ extracted 28 Aug 2026. Nine binding rows of 38,400
   (0.023%), all the same event: the Western Cape import boundary, midday 8 June, three
   consecutive years, dual declining 199,872 to 171,358 R/MW as transmission is built.
   **design trap found: the three corridors into the Western Cape carry identical duals**,
   because relaxing any one admits the same megawatt. A congestion charge must therefore
   be defined on boundaries or cutsets, not on individual lines — charging each corridor
   its own dual triple-counts one constraint. Still to do: run it on the 110 GW no-gas
   frontier, where congestion should actually be material.
2. ~~Make the transmission charge locational.~~ done 28 Aug 2026. `txRateFor()` builds a
   supply curve from electrical distance to Gauteng plus available headroom, filling
   cheapest-first. Range R150 (Gauteng) to R735 (Hydra Central), capacity-weighted mean
   still R600 so the national total is unchanged. Effective rate now rises with build
   volume: R150 at 1 GW, R349 at 41 GW (all headroom consumed), R578 at 102 GW.
   Finding: headroom-weighted mean distance is 163 km against 368 km for the existing
   fleet — the room to connect is closer to load than the fleet already built, and in
   the worst-resource regions. Open: distance to a single load centre is a proxy; the
   Shallow share of 25% is an assumption; `bldTxCurve` is null until the data loads, in
   which case the flat rate applies.

The other four absences are tariff design, not system modelling. Do not approximate
them — say they are out of scope.

Standing caution: `avgCost` is fuel + carbon + new grid-connected capex over
grid-served energy. Six of the thirteen enumerated components are not in it, including
legacy cost recovery and distribution charges, which are a large part of a real bill.
It is not a tariff and must never be quoted as one.

---

## Solver convergence and the in-browser envelope

Added 28 Aug 2026.

### fixed: a non-converged solve was presented as an answer

`bldSolve` ran `highs.solve(lp, { time_limit: 120 })` and both result consumers
checked only `if (!res || !res.Columns)`. HiGHS returns a populated `Columns` object
when it stops at the time limit, so that guard passes and the numbers render as a
plan. Nothing anywhere inspected `res.Status`.

Confirmed live: a forced high-renewables solve returned `Time limit reached` with
zero build and zero binding corridors — output that reads as "no congestion at high
penetration" and is in fact "the solver had not started".

Both consumers now refuse to display a non-`Optimal` result and say why. The time
limit is `BLD_TIME_LIMIT_S`, declared once before the worker template literal and
interpolated into it — a bare reference would throw inside the worker, which runs in
its own context.

**This was the largest single gap between GridTwin and a professional tool.** plexos
and PyPSA both refuse to return a non-converged solution as a solution.

### correction: the carbon cap is not the cause of slow solves

An earlier note in this session claimed the carbon cap adds a dense row that took the
LP from ~0.3 mb to 23 mb. Measured, and it is wrong:

```
regional LP            chars        rows
baseline          22,995,170     255,181
growth 0.05       22,995,486     255,181
grid pace         22,995,545     255,181
carbonCap on      22,995,170     255,181
all three         22,995,861     255,181
```

The regional LP is already 23 mb and 255,181 rows at baseline. The cap changes it by
316 characters. The "0.3 mb" figure was a misreading of `constraint rows parsed:
119,225`, which counts only the subject-to section.

So the cause of non-convergence is scenario difficulty, not problem size. Forcing a
large renewable build with no gas is simply harder to solve, at the same dimensions.
Do not "optimise the carbon cap formulation" on the strength of the old note.

### the envelope, measured 28 Aug 2026

Six-rung ladder, 240 s solver limit, same machine:

```
scenario                LP chars     rows   build s   solve s   status              built GW
historical pace         22,995,110  255,181     2.3      75.2   Optimal                  3.3
IRP pace                22,995,170  255,181     2.4      86.1   Optimal                 21.2
masterplan (default)    22,995,170  255,181     2.2      86.2   Optimal                 21.2
grid pace               22,995,545  255,181     2.1     244.3   Time limit reached       0.0
grid + growth 5%        22,995,861  255,181     2.1     244.4   Time limit reached       0.0
grid + 5% + no gas      22,995,861  255,181     2.0     244.6   Time limit reached       0.0
```

**not a cliff — slow, not intractable.** An earlier version of this note called it a
cliff on the strength of the 240 s rows. That was wrong. Given a 2,400 s limit:

```
grid pace, long limit   22,995,545  255,181     2.1     614.9   Optimal                  45.8
```

Grid pace solves cleanly in 615 s and builds 45.8 GW. The 240 s rows were measuring the
limit, not the model. Demand growth and a gas ban still change nothing once past the
limit, because all three were being cut off at the same point rather than failing for
different reasons.

**the ceiling is a compute problem, not a formulation one.** That is the better answer:
nothing needs rearchitecting.

**size is not the variable.** Every rung builds the same 255,181-row, 23 mb model,
varying by under 800 characters. Only the difficulty changes. Nothing is gained by
simplifying the formulation elsewhere, and the earlier carbon-cap theory is doubly dead.

**the failing rows return 0.0 GW built.** Before the status guard the interface would
have rendered that as a plan: build nothing. Not a degraded answer, a confidently wrong
one — the single best argument for the guard.

The practical envelope: every pace up to and including Grid solves, but Grid needs
about ten minutes. `BLD_TIME_LIMIT_S` was raised 120 -> 900 to accommodate it.

That limit is only defensible because the solve runs in a web worker and the page stays
responsive. Do not raise it further without rechecking that — a 15-minute block on the
main thread would be unusable.

### the full curve, bisected 28-29 Aug 2026

```
pace, MW/yr wind        solve s   status               built GW
2,500  masterplan          90.5   Optimal                  21.2
3,000                     557.3   Optimal                  36.3
3,500                     720.6   Optimal                  38.1
4,000                     782.6   Optimal                  41.8
4,300  grid               614.9   Optimal                  45.8
8,600  2x grid            906.5   Time limit reached        0.0
```

The steep part is between 2,500 and 3,000. A 20% pace increase makes the solve six
times slower, 90 s to 557 s. After that it flattens and is not monotonic — 4,300 solves
faster than 3,500. So pace is not a clean predictor above 3,000; the solver's path
matters more than the problem does.

The envelope has a real edge, and it is beyond every shipped pace. Everything in
BLD_PACE solves. Doubling Grid pace does not, at 900 s.

**SO the guard should almost never fire in normal use.** A user has to go beyond the
fastest shipped pace to reach it. That is the right place for a limit: it protects
against the pathological case without obstructing the intended range.

**and the frontier scenarios in results.md are outside it.** The 110 GW no-gas frontier
is roughly this scale. It is reachable through the national dispatch model, which is how
Results.md computes it, but not through the regional build LP inside 900 s. That is why
the frontier congestion analysis (open item) remains untested and cannot be closed
in-browser. State that limitation whenever the frontier is discussed alongside the
network results — they come from different engines and only one of them scales that far.

Still open: whether the frontier solves at all given hours rather than minutes. Worth
one offline run, but it changes nothing about the product envelope.

---

## Audit, 29 Aug 2026

Systematic pass over the engine looking for bugs, inconsistencies and strange outputs.

### clean

- **Every control at both extremes.** 76 sliders x min and max = 152 runs. No NaN, no
  Infinity, no negative energies or costs, no carrier exceeding 1.5x demand.
- **Hourly energy balance.** Worst error 7.3e-12 MW across all scenarios tested. (A
  16 GW "error" in a load-shedding case was the probe omitting unserved energy, not a
  fault.)
- **Cost identity.** `totalCost` reproduces `fuel + carbon + capex + dr - exports`
  exactly, to the last digit, in every scenario.
- **Storage round-trip.** Implied 0.776-0.815, correctly between psEff 0.76 and
  battEff 0.88 as a blend.
- **Emissions.** The 1.5-5.3% gap between reported CO2 and a naive fuel calculation
  tracks `partLoadF` exactly. It is the documented part-load heat-rate penalty, not an
  error.
- **Fleet-size claims in slider notes** match their constants (0.8 GW battery, 2.9 GW
  pumped, 4.6 GW wind).

### found and fixed: a duplicated reserve structure, self-inflicted

The battery ancillary panel had defined its own operating reserve on 28 Aug 2026 —
`sysContingencyMW` 930, `sysResDemandShare` 0.03, `sysResVreShare` 0.05 — in parallel
with the one the unit commitment had used all along at line ~4980:
`reserveContingencyMW` 794, `reserveRegulatingPct` 2.0, `reserveVrePct` 5.0, via
`reserveMWAt(h)`.

**two constants for one physical quantity** — largest single credible loss, 930 MW
described as a Koeberg unit against 794 MW described as a Medupi unit. Exactly the
rule-6 violation the project has been policing everywhere else, introduced by the same
work that documented the rule.

Worse, the 28 Aug note claimed the engine retained no pre-curtailment vre series and
built `vreCurtMW` to reconstruct one. `_vreMW` at line 4979 is installed capacity times
the per-unit profile — available vre, pre-curtailment — and had been there all along,
feeding the very reserve structure that was being duplicated.

Now: gross requirement = the commitment definition, shared. vre-provided credit stays
here, because for commitment you correctly want the gross figure. Net = what storage
competes for. Reserve levels fall about 30% (today 1,768 -> 1,263 MW); the shape and
every conclusion are unchanged. `vreCurtMW` is still needed for the provider credit.

Lesson: before adding a constant, grep for the quantity, not the name. `sysContingencyMW`
and `reserveContingencyMW` never collide textually, so no check could catch it — only
reading the surrounding code would.

---

## Double-count guard, extended 29 Aug 2026

Two changes, both tested by injecting cases into a temporary copy.

**1. Undated queue entries are reported, not skipped.** The guard keys entirely on COD,
so `if (!x.cod) continue` gave a project with no verified date no double-count scrutiny
at all — and passed silently, which invites the reader to infer everything was checked.
Undated entries are now listed with the instruction not to invent a date to make them
testable. Not a failure: an undated project is a sourcing gap, not an error.

**2. The name match no longer requires bucket === 'private'.** This is the more
important of the two. A name match against `pfl_private_h1_2026.json` is definitive
evidence the megawatts are already counted, whatever bucket the queue entry carries —
the queue's bucket label is a guess about where a project belongs, not a fact about
where it is counted. Restricting the match meant a mislabelled queue entry bypassed the
one check that beats date arithmetic entirely.

Verified: arm Platinum queued under `reipppp` is now caught by name. Under the old code
it would not have been.

Note arm itself sits in the accounted-for list, not this queue, so neither change alters
today's output. Both were tested against injected cases rather than assumed.

---

## Basemap: carto -> Esri, 30 Aug 2026

The resource map carried an "API key required · carto.com/basemaps/apikey" watermark
across every tile. carto has withdrawn keyless access to `basemaps.cartocdn.com`.

**the failure mode is the interesting part.** The tiles still serve — they just arrive
watermarked. Nothing threw, no request failed, and every harness passed throughout,
because the substations, corridors and project dots are our own data drawn on top. Only
a human looking at the page could see it. Worth remembering when judging what a green
suite does and does not prove.

Replacement: Esri `Canvas/World_Light_Gray_Base` plus `World_Light_Gray_Reference` for
labels. Chosen because the grey canvas is the closest match to carto Positron so nothing
else needed restyling; Esri is already a provider in this file (the rooftop tracer's
satellite and reference layers); and osm's tile policy discourages public-facing apps
hitting their servers directly. Attribution set as Esri requires. Serves to zoom 16 and
this map caps at 10.

**not verified in a browser.** The container's egress proxy blocks
`server.arcgisonline.com` (`x-deny-reason: host_not_allowed`), so the tiles could not be
fetched here. Confirm they render before treating this as done.

An `audit.py` check now pins `World_Light_Gray_Base` so a revert to a keyless-broken
provider is loud rather than silent.

---

## Private grid infrastructure on the map, 30 Aug 2026

`transmission_lines.geojson` now carries `owner` and `line_type` on every feature, and
the Impofu line is in it.

```
owner       NTCSA 447 · Red Cap Energy 1
line_type   shared network 447 · single-project connection 1
```

**the tagging is a statement about the source, not the world.** All 447 pre-existing
features are NTCSA because this file is built from Eskom TDP and SAPP planning data,
which contains no privately built assets by construction. It is not evidence that none
exist — South Africa's longest privately permitted renewable line was missing from it
until it was added by hand.

`line_type` matters more than `owner` for the modelling: only a shared network asset
creates headroom another developer can use. A single-project connection does not.
Koruson's privately built main transmission substation (1.5 GW, edf Power Solutions) is
the shared kind and is still not represented.

Added: Impofu - Thornhill - Chatty, 116 km, 132 kV, Red Cap Energy with Enel Green
Power, serving the 330 MW Impofu complex. Route indicative — three vertices from the
published route description, not a surveyed centreline, which is the same convention
the SAPP lines in this file already use.

Verification note worth keeping: my first check compared old and new features by label
and reported a geometry change. The file has 65 duplicate labels, so the lookup was
matching a different feature. Compared positionally instead: zero mismatches across all
447. Do not key on `label` in this file.

---

## Wheeling region selector, and Koruson — 30 Aug 2026

### bug fixed: both wheeling dropdowns were incomplete and the map mirror failed silently

Reported as "won't let me select Mpumalanga and KwaZulu-Natal". The cause was broader:

```
map click can return   all 10 regions (REGION_CENTROIDS)
wheelGenRegion had      8 — missing Gauteng, Kwazulu Natal
wheelConsRegion had     6 — missing Northern Cape, Hydra Central, Free State, North West
```

Clicking one of the missing provinces hit
`if (wg && [...wg.options].some(o => o.value === region))`, found nothing, and did
nothing — no error, no message, no console warning. The selector simply appeared dead.

There was no reason for either restriction: generators exist in KwaZulu-Natal and
consumers exist in the Northern Cape. Both lists now carry all ten regions, and the
mirror logs a warning if a region ever fails to match, so REGION_CENTROIDS and the
dropdowns cannot drift apart again in silence.

### koruson: substation tagged, no line added

Koruson's main transmission substation was privately constructed by edf Power Solutions
to accommodate up to 1.5 GW — the shared kind of private asset, built so later projects
in the region can connect rather than only serving Koruson 1. That distinction is the
one that matters for modelling: a single-project connection creates no headroom for
anyone else.

`substations_compact.json` now carries `owner`, `built_by`, `line_type` and
`headroom_built_mw` on that entry. Fingerprint `gtza-0fe0a41096f9685a`.

**lines added 30 Aug 2026 as indicative connectors**, after establishing that
`transmission_lines.geojson` is display-only — styled and tooltipped, with nothing in the
model computing length or topology from it. That removed the objection: a straight line
cannot corrupt a calculation here.

Two connectors, Phezukomoya -> Koruson and San Kraal -> Koruson, endpoints from DFFE
REEA authorisations. The connection is documented — Koruson 1 is edf's cluster of exactly
these two farms, connecting at the privately built mts — while the route is not.

They are marked `route_indicative: true` and rendered as a third visual state:

```
solid        surveyed route from the source data
6 4 dashed   planned, route from the TDP
1 5 dotted   indicative - connection sourced, route not, length meaningless
```

The tooltip says so too, not just the file: "the connection is sourced, the route is not.
Do not measure this line." Someone reading a dotted line off the map has not opened the
geojson, and a straight line between two real substations is exactly what gets measured
off a screenshot. Tooltips also now surface private ownership.

Why not just omit them: leaving real private assets off the map makes it systematically
incomplete in one direction — everything Eskom built is shown, everything private is not
— which is a worse distortion than a clearly-labelled straight line. An `audit.py` check
pins the styling so it cannot be lost silently.

**also flagged, not fixed:** the Koruson entry still carries `planned: true` from the
DBSA register. The cluster is operating, so the substation is built and the flag is
probably stale — but that has not been confirmed against a commissioning source, so it
is left as found rather than flipped on inference. Worth resolving, and worth checking
whether other `planned` entries have the same problem.

Absence of an owner tag in this file means unknown, not NTCSA. The register is sourced
from DBSA, NTCSA gis and Eskom, none of which record private ownership.

---

## gridtwin-3d.html — checked 30 Aug 2026, first time ever

A second page, linked from the Network Schematic panel, with its own map stack
(deck.gl + MapLibre), its own basemap and its own styling code. **It had no coverage of
any kind until today** — `audit.py` and `validate_lint` both run against `index.html`
only. Same blind spot that let the multi-year weather bug live: an unrun code path is
not "probably fine", it is unmeasured.

### it reads the same data, SO changes land on both pages — but styling does not

It fetches `nodal/substations_compact.json`, `nodal/transmission_lines.geojson` and
`nodal/tdp_projects.json`. So the Impofu line and the two Koruson connectors appeared
here automatically — **rendered exactly like surveyed routes**, because the styling that
makes them dotted lives in `index.html` and this page had never heard of
`route_indicative`.

That is the drift mechanism to remember: **data changes propagate, presentation changes
do not.** Adding a flag to the data without teaching every consumer about it produces a
page that shows a straight line between two real substations as though it were a
surveyed route.

Fixed: indicative connectors now render at low alpha and 0.8 width — thinnest on the
map — with a tooltip reading "The connection is sourced, the route is not. Do not
measure this line." deck.gl's GeoJsonLayer has no dash support, so alpha and width
replace the 2D dotted style. Private ownership is surfaced in tooltips too.

### new harness: audit3d.py

Nine checks. Scored against the original file first, where it fails on three — the two
indicative checks and private ownership. Run it as
`python3 audit3d.py gridtwin-3d.html`.

### two things flagged, not fixed

**Basemap.** This page uses carto's vector gl style
(`basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json`), a different product from
the raster tiles that were watermarked in 2D. It may or may not be affected and **has
not been verified in a browser** — the container cannot reach either host. If it is
watermarked or blank, OpenFreeMap serves a keyless dark vector style at
`https://tiles.openfreemap.org/styles/dark`, a drop-in for `mapStyle`. Esri raster is
Not a drop-in here: MapLibre needs a vector style spec.

**Path convention — DO NOT harmonise. I was wrong to flag this.** The 3D page fetches
`/nodal/...` absolute while `index.html` uses relative `nodal/...`. That is not drift:
the 3D page lives at `gridtwin-3d/index.html`, one level down, so a relative `nodal/`
there would resolve to `/gridtwin-3d/nodal/` and find nothing. The absolute paths are
required by the folder layout and correct as they are. Changing them would break the
page.

**link fixed 30 Aug 2026.** Both links in `index.html` read `href="gridtwin-3d.html"`,
a flat file at the root, which 404s against the actual `gridtwin-3d/index.html` layout.
Now `href="gridtwin-3d/"` — trailing slash matters, since without it some servers
redirect and some do not. An `audit.py` check pins it, because **no harness notices a
broken link**: a page that never loads produces no error anywhere in the suite. Verified
the check fails on the old form.

---

## sources.md and calendar.md refreshed, 30 Aug 2026

Both were written at the split on 27 Aug and neither had been touched since, while a
great deal changed. Stale documentation is this project's most persistent failure mode -
`HYDRA_CENTRAL_ZERO`, the `profiles.json` metadata and the `carbonPrice` open item were
all wrong for the same reason - so these two files are the ones most likely to mislead
if left.

Calendar: the EPP submission moved from a hard deadline to a done entry with what to
watch for next. **NERSA Trading Rules, 30 September, is now the nearest binding date and
nothing has been drafted** - though the locational and congestion work is directly
reusable, since Trading Rules govern how wheeling actually clears. Added the TDP as a
rolling source that moves four constants, the carbon-tax suspension watch, the two
unverified basemaps, and Mulilo's pending COD.

Sources: added six loaded sources that had accumulated without being registered - the
EPP gazette, the regional multi-year profiles, the Form Energy and Tubatse transactions
behind the storage capex, and the REEA records behind the Impofu and Koruson connectors.

Two new sections, and they are the useful part:

**Sources used for constants, not for data files.** Six numbers in `FIXED` rest on a
source that populates no JSON - `txRPerKWyr`, `acapIronAir`, `acapVrfb`, `acapPs`,
`carbonTaxRPerT` and the fx rate. They were invisible to a register organised by file,
which is exactly how a constant drifts from its source unnoticed.

**Sources consulted and rejected.** NREL ATB cannot corroborate the vanadium constant -
it covers lithium only. PyPSA-ZA's cost comparison answers a different question because
it co-optimises investment and operation. Both were investigated at length; recording
the negative result stops the next session repeating the work.

---

## The SA boundary excluded half the country — fixed 30 Aug 2026

Reported as "parts of Limpopo won't let me click". Measured against 18 real towns,
**nine were outside the boundary polygon**:

```
rejected   Polokwane · Musina · Thohoyandou · Mokopane · Lephalale · Tzaneen
           Rustenburg · Mahikeng · Gqeberha
```

`SA_POLY`'s northern edge ran as a single diagonal from -28.5 at 16.5E to -22.2 at
32.9E. At 29.5E that capped the country at -25.5 — roughly 180 km south of Polokwane.
The entire Limpopo salient was outside it, along with the North West and the Gqeberha
coast.

**it failed in complete silence.** The point was rejected before any region was
resolved, so there was no error, no message, no console warning. The map simply did
nothing. This is the same shape as the carto watermark and the broken 3D link: a whole
class of defect that every harness passes over because nothing was looking.

Replaced with a 57-vertex trace: Orange River, the 20E Kgalagadi line, the Molopo, the
Limpopo up to Beitbridge, then the Zimbabwe, Mozambique and coastal borders. Still a
rough clamp — it does not cut out Lesotho or Eswatini, which is right for a resource
query and wrong for anything needing jurisdiction. Noted in the code.

### new harness: validate_geo.js — 37 checks, and it runs in a second

Twenty-five real SA locations must be accepted, ten foreign and ocean points must be
rejected. **Both directions matter**: the easy fix for a too-tight polygon is one that
lets the ocean in, so a clamp that accepts everything is not a clamp.

Parses `SA_POLY` straight out of the source rather than executing it, so no jsdom.

Scored against the old polygon first, where it fails on the nine towns. The Limpopo
places are over-represented deliberately, and De Aar, Noupoort, Humansdorp and
Sutherland are in the list because they matter to this model specifically — Humansdorp
is the Impofu site, and it was among the nine being rejected.

---

## Private grid candidates, 30 Aug 2026 — and a task premise that was wrong

### there is no transmission filter to widen

The task "re-extract REEA including transmission and grid-infrastructure categories" rested
on my assumption that DFFE publishes those as separate categories. **It does not.** REEA is
the renewable energy EIA application database. Grid infrastructure appears only inside a
generation project's description, which is exactly why the extract shows nine technology
values, all generation. A re-download would return the same nine.

### the data was already in hand

161 of the 2,597 records describe a line, substation or grid connection in their own title.
Parsed into `nodal/private_grid_candidates.json` with applicant, voltage, capacity,
coordinates, asset type, status and decision date.

```
161  candidates
 62  with a stated voltage
 50  at 132 kV or above
  5  with a shared-network hint in the title
```

Worth a look: the top row is enertrag's "Camden up to 400kV Grid Connection, **Common
Collector**" — a title that describes a shared asset. Phinda Power Projects has 450 MW at
132 kV in KwaZulu-Natal. Mainstream holds nineteen grid-connected applications, and a
portfolio developer building repeatedly in one area is where shared infrastructure appears.

### three cautions, in the file

**An ea is not a built asset.** Status and decision date record what was authorised.
Cross-check against commissioning before treating any row as infrastructure.

**Coordinates are the generation centroid, not the line.** There is no route geometry.
Do not draw these without a published route.

**`shared_signal` is a weak textual hint, not evidence.** It fires when the title contains
a word like "common" or "cluster". The real test is spare capacity beyond the owner's own
plant, or a stated intention to host third parties — neither is in this data. Koruson
passes that test and Impofu fails it, and **neither would be distinguishable from this file
alone.** That is the limit of what REEA can settle.

### what actually settles shared-versus-single

NERSA transmission licences and developer statements. Ask
`Reapplication@dffe.gov.za` — already on the list for the CSIR request — one extra
question: whether grid infrastructure is ever published as a separate release. That
converts an inference from field names into an answer.

---

## The calendar was wrong and it cost a consultation window, 30 Aug 2026

`CALENDAR.md` read "30 Sep 2026 NERSA Trading Rules - comment submission. Hard
Deadline." **Both halves were wrong.** 30 September is when NERSA expects to finalise
the rules. The comment window on Version 3 ran to 27 July, extended to **28 August** -
which closed two days before anyone looked. The consultation paper states late
submissions "will not be considered".

The entry predates the 27 Aug split, so it has been wrong for as long as the file has
existed: a finalisation milestone recorded as an opportunity to participate.

Two more windows closed unwatched: the Wholesale Electricity Pricing Methodology and
the Vesting Contract Framework, comments 4 Aug, hearings 19 Aug. The first is directly
relevant - it is the document defining the price components this project has been
mapping.

**the lesson is about the form of the entry, not the diligence.** "30 Sep - comment
submission" carries no source and no distinction between a milestone and a window. An
entry that had recorded where the date came from would have been checkable. Every
calendar entry should now name its source and say what kind of date it is.

### what the wholesale pricing methodology gives the model

Independently of the EPP, NERSA splits the wholesale price into market costs (energy,
transmission, system operation, balancing, market operator, other regulated) and
Non-market costs (legacy, bad debt, social and cross-subsidy, vesting). **That confirms
the two-kinds split already in results.md, from a regulator rather than from
inference** - and it is the split the EPP submission argued for.

It also names one gap we had not: **balancing costs**. That is a modelling quantity and
GridTwin has none, because the model is hourly and has no intra-hour product. At 45 GW
of wind and solar that is not a rounding error. System operation and market operator
charges are also named, but those are institutional costs and correctly absent.

From the eiug's Market Code submission, the risk worth quoting: non-market charges
becoming "dumping grounds for unallocated costs". That is the strongest argument for
the disaggregation this project has been advocating.

---

## Storage dispatch has no lookahead — recorded 30 Aug 2026

Tiers are sorted by round-trip efficiency (lithium 0.88, vrfb 0.70, iron-air 0.45), so
long-duration storage charges last and discharges last, purely on whether the current
hour has a surplus or a deficit. There is no lookahead of any kind, seasonal or
multi-day. Iron-air cannot deliberately hold energy for a coming drought.

**that is a real gap, but it is not why long-duration storage fails to bite.** Measured:
at 45 GW of vre there is a deficit but annual curtailment is only 0.2 TWh, so foresight
would have nothing to charge with. At 110 GW curtailment is 100 TWh but July gas is
already zero, so there is nothing to serve. The two conditions never co-occur.

Open: the 60-80 GW range is untested, and is where a seasonal lookahead could plausibly
matter - curtailment has begun, the drought is not yet covered. Worth running before any
dispatch change is contemplated.

Note for framing: iron-air at 100 hours is a four-day asset, marketed for multi-day
weather events, not seasonal shifting. Seasonal duty needs thousands of hours. At 45%
round trip, summer-to-winter shifting discards 55% of the energy. Do not describe
iron-air as seasonal storage.

---

## Long-duration storage is structurally starved by the dispatch — 30 Aug 2026

Prompted by the question "couldn't iron-air charge in May and discharge in July?". The
answer required correcting my own reasoning twice.

**first error, mine: conflating surplus with curtailment.** I argued there was nothing
to charge with because annual curtailment is 0.2 TWh. Storage charges from cheap energy,
not only from spilled energy. Measured: the price floor is R690/MWh in every month, and
there is 10.2 TWh of spare coal across 7,305 hours. A 45% store charging at R690 delivers
at ~R1,533 against gas near R1,968 — the arbitrage is in the money.

Also noted: South Africa curtails today at low penetration for localised network reasons,
which a single-node national model cannot represent at all.

**fixed — charging horizon was 25 hours.** `anticipatedShortfall` looked one day ahead to
set the charge target, which is right for a 4-10 hour battery and useless for a 100-hour
store. Now scales with the longest storage on the system, capped at 168 hours because
beyond a week perfect foresight does more work than the storage does. Suite 817/817.

**not fixed, and it is the binding one — efficiency merit order.** `tierCharge` fills
best-round-trip-first: lithium 0.88, vanadium 0.70, iron-air 0.45. Lithium empties daily
so it always has room, absorbs the cheap charging, and iron-air is never reached. Fixing
the horizon changed July gas by zero for exactly this reason.

Efficiency-first is correct within an hour and wrong across a week. The right rule fills
the long store when a long event is coming, accepting worse round trip, because lithium
cannot hold energy that far. That is a dispatch rewrite, not a tweak.

**consequence for a published result.** "Iron-air changes July gas by exactly zero in all
ten years" was measured on a dispatch that structurally cannot charge it. The finding may
well survive — 45% round trip is punishing and the July deficit is large — but it has not
been tested fairly. results.md now marks it provisional. Do not repeat it externally
until the merit order is addressed.

---

## Dispatch rewrite attempted and reverted, 30 Aug 2026

Against the long-duration storage literature: PCMs run 1-2 day horizons to match
day-ahead markets and cannot capture a multi-day store's inter-temporal value; the
recommended fix is opportunity-value dispatch, a reservation price per store, not an
efficiency merit order. Published cost of getting it wrong: 4-14% of operational value,
14-34% of capacity credit.

**kept: per-tier lookahead horizons.** Each store now looks ahead over its own duration
(capped at 168 h) rather than all sharing one 25-hour window. Correct on its own merits,
neutral in the scenarios tested.

**reverted: unmet-need charge ordering.** Serving tiers by how far they sit below a
horizon-based target made July gas worse, 2,742 -> 2,810 GWh, and cut storage delivery
8.42 -> 7.44 TWh. Filling a 45%-efficient store ahead of an 88%-efficient one destroys
more energy than the earlier availability recovers.

**the lesson: unmet need is not value.** The heuristic had no test of whether the
arbitrage was worth making, and an ordering cannot express one. The correct rule charges
a tier only when current marginal cost is below expected discharge value times round
trip — a value function on state of charge, which needs an LP. That is why plexos and
PyPSA co-optimise storage across the horizon rather than ranking it.

So the defect identified yesterday is real and remains open. What is now also known is
that it cannot be fixed by reordering, which rules out the cheap options. The reverted
code and the measurement are documented at the `tierCharge` block so this is not
re-attempted blind.

---

## Two-pass price-taker built; storage LP is the remaining fix — 30 Aug 2026

`simulateTwoPass()` runs simulate twice: pass one yields the hourly marginal price, pass
two hands each tier a reservation price (90th percentile over its own horizon) and
charges only when `cost now < reservation x efficiency`. One extra simulate call, ~590 ms.
Opt-in, not wired into run().

**it answers the economic question: the arbitrage is in the money.** July reservation
price R2,020/MWh; iron-air needs 690 < 2020 x 0.45 = 909 and clears easily. The model's
under-use of long-duration storage is not an economic judgement.

**it does not bind, so it changes nothing alone** — every tier passes in July. And
gate+ordering behaved exactly as ordering alone (July gas 2,742 -> 2,810). Ordering
reverted a second time.

**conclusion, now well evidenced: no ordering heuristic can fix this.** The gate asks "is
this trade worth making"; the megawatt is decided by a comparative question — worth more
in the 45% store or the 88% one — which depends on whether the coming event outlasts the
short store, given both SOCs. That is a value function on state of charge and a ranking
cannot express one.

### done: storage-only LP — `storage_lp.js`, 30 Aug 2026

Take the non-storage dispatch as given; let HiGHS optimise charge, discharge and SOC over
all 8,760 hours with the SOC balance as a constraint. ~50,000 variables for three tiers,
small against the LPs already solved here, and HiGHS is already in the browser. The dual
on the SOC constraint is the opportunity value — a publishable output no South African
study currently reports.

Note the envelope work: the regional build LP takes 90-780 s, so budget accordingly and
surface solver status (the guard added 29 Aug already does).

Caveat to carry: both approaches use perfect foresight of the price series. Results are an
upper bound on long-duration storage value, not an estimate.

`simulateTwoPass` is a documented orphan in validate_structure's known list — the harness
caught it as unwired, which was correct. Remove that entry when it gets a panel.

---

## Storage LP result — 30 Aug 2026

`storage_lp.js` at the repo root. 52,560 variables, 4.0 mb, **Optimal in 3.0 seconds** —
the storage problem is small next to the regional build LP's 90-780 s.

```
tier    charged TWh   discharged TWh   peak SOC MWh   July discharge GWh
li            12.48            10.98        200,000                  995
fe             3.20             1.44        941,568                   18
```

**1. the iron-air result survives.** Under an optimal dispatch with perfect foresight and
no merit order to starve it, 20 GW / 2 TWh of iron-air displaces 18 GWh of July gas out of
2,742. It does fill — peak SOC 47% of capacity, which the heuristic never approached — so
this is no longer a dispatch artefact. 45% round trip is punishing enough that the energy
is better left in coal. **provisional flag removed from results.md.**

**2. the heuristic under-uses lithium by 37% of july gas.** The LP finds 995 GWh that
lithium could displace and the heuristic does not. That is far larger than anything about
iron-air, it affects the technology actually being deployed, and it was invisible until
the LP existed. **This is now the most valuable open item in the model.**

Caveats: perfect foresight (upper bound); price-taker objective against a fixed price
series, so it does not re-clear the market; serveable/chargeable limits approximated from
pass one.

Next: embed rather than probe. The dual on the SOC balance is the opportunity value the
two-pass gate was approximating, and no South African study publishes it.

---

## Storage LP, improved toward professional practice — 30 Aug 2026

Added to `storage_lp.js`: SOC duals and a rolling horizon.

**opportunity value (duals on the SOC balance).** 35,040 rows parsed, 35,040 returned.
Lithium mean R1,789/MWh, iron-air R2,020 — the scarcity ceiling. Iron-air's is higher
because it is rarely the binding store, so its shadow price is never competed down. This
is the storage revenue signal and is not published for South Africa anywhere.

**rolling horizon.** 168 h window / 24 h step = 365 solves in 6.8 s; 336/48 = 183 solves
in 6.0 s. Both Optimal throughout. This is how a pcm limits foresight.

**A trap recorded rather than hidden.** The rolling runs show higher July displacement
than perfect foresight (37.6% and 40.1% vs 36.9%), which is impossible for the quantity
being optimised. The explanation: July displacement is not the objective — the LP
maximises annual arbitrage value, and perfect foresight spends storage wherever the
spread is best, which need not be July. Annual discharge, closer to the real objective,
behaves correctly (12.42 vs 11.26 / 11.66 TWh). **Do not quote the rolling July figures
as an improvement.** The honest conclusion is that the 37% is robust to foresight
assumptions.

Five gaps addressed 30 Aug 2026 — four closed, one not closeable here.
1. Terminal value function replaces the crude floor. **This fixed the foresight
   paradox**: rolling was showing 37.6/40.1% against perfect foresight's 36.9%, which was
   impossible. All three now agree at 36.5%, so the result no longer depends on foresight
   assumptions at all — a stronger finding than the original.
2. Self-discharge, 0.004%/h lithium and 0.05%/h iron-air. Estimates, flagged in code,
   deliberately not promoted to fixed because no SA source gives them.
3. Cycle cost, R250/MWh throughput lithium, R50 iron-air. Duals are no longer pinned at
   the scarcity ceiling: lithium mean R1,563, iron-air R1,925.
4. reserve CO-optimised (opt-in, `--reserve`). **Iron-air's energy role halves** —
   discharge 1.44 -> 0.77 TWh, peak SOC 941,568 -> 242,264 MWh — once it must also hold
   reserve. Its opportunity value rises (p90 2,025 -> 2,377) because energy is scarcer.
   July displacement unchanged at 36.5%; lithium absorbs it.
5. fixed-point iteration — run 30 Aug 2026, does not converge. Five rounds, 0.5 damping:
   mean price movement falls only 352 -> 199 R/MWh and July gas oscillates 2,751-2,816
   with no trend. Storage flattens the peaks it was built to exploit, removing the spread
   that justified the schedule. Known failure mode, and it happened.

   **consequence: the 37% claim is now unverified.** Every iterated July figure is at or
   Above the heuristic's 2,742 GWh — imposing the LP schedule did not deliver the
   predicted 1,000 GWh saving. Either the price-taker objective (arbitrage value, not gas
   displacement) was never measuring a gas saving, or my test is one-sided:
   `_forcedDischargeMW` is a cap by design, so where the LP wants more discharge than the
   heuristic gives it cannot deliver. Storage throughput fell 8.42 -> 7.91 TWh, the
   signature of a binding cap. **Do not repeat "the heuristic leaves 37% on the table"
   until a two-sided imposition exists** — which means replacing the storage dispatch,
   not limiting it.
6. Unit commitment CO-optimisation — still not closeable in a price-taker LP.

---

## The 37% is withdrawn — 30 Aug 2026

Three rounds of testing, each revealing another layer:

1. **Cap-only override.** July gas 2,751-2,816 against the heuristic's 2,742 — the
   predicted 1,000 GWh saving did not appear. One-sided: a cap can only reduce.
2. **Two-sided discharge override**, counting what the engine could not follow: about
   3,000 GWh of an 11 TWh schedule, close to 30%.
3. **But charging was never overridden.** The store is still filled by the heuristic, so
   it cannot discharge to the LP's plan. The clipping largely measures my incomplete
   override, not the schedule.

**conclusion: retire it, do not chase it.** Every time the schedule is brought closer to
the real engine the saving fails to appear, and the LP's objective is arbitrage value not
gas displacement. The 37% is best read as an accounting artefact of the price-taker
formulation.

Settling it properly needs storage inside the unit commitment — precisely what a
price-taker LP is defined not to do — which is a model rebuild that should be justified
by something better than a number that has failed three tests.

**what survives, and it is most of the value:**
- Opportunity-value duals (lithium R1,563 mean, iron-air R1,925) — unpublished for SA.
- The iron-air result, now tested under a heuristic, an LP, and a reserve-constrained LP.
- Reserve versus arbitrage: iron-air's energy role halves when it must also hold reserve.
- The rolling horizon agreeing with perfect foresight at 36.5%, once the terminal value
  function replaced the crude floor.

`_forceStorageSchedule` and `_forcedDischargeMW` remain in the engine as diagnostics.
Both default to null and neither is a dispatch mode. If the charge side is ever
overridden too, the clipping number becomes meaningful and this can be revisited.

---

## the full fix — the one-day rebuild, when it is justified

Scoped 30 Aug 2026 so it is not re-derived. This is the single change that closes most
of the "not yet plexos" list at once, and it is one change, not five.

### what it is

Put storage inside the dispatch optimisation rather than beside it. Today the engine
dispatches heuristically and storage is fitted afterwards by merit order; the LP built
today optimises storage against prices from that heuristic, which is why it cannot be
made self-consistent. The fix is a single co-optimised problem over charge, discharge,
state of charge and the thermal dispatch, so prices and storage are solved together.

### what it closes, all at once

```
storage / commitment co-optimisation   the thing a price-taker LP is defined not to do
the 37% question                       settled properly rather than withdrawn
the fixed-point non-convergence        disappears - there is nothing to iterate
opportunity value                      becomes a real dual, not an approximation
lithium duration wall                  moves off the heuristic
no-gas frontier                        moves off the heuristic
capture-rate storage mitigation        moves off the heuristic
```

### what it does not close

Intra-hour balancing (needs sub-hourly resolution), the single-node limitation of the
national engine, and stochastic outages. Those are separate.

### what is already in place

- HiGHS is in the browser and the storage LP solves 8,760 hours in 3 seconds, so the
  compute is not the obstacle.
- `storage_lp.js` has the formulation, self-discharge, cycle cost, reserve
  co-optimisation and a terminal value function already written and tested.
- The solver status guard means a non-converged solve cannot be presented as an answer.
- The envelope is measured: every shipped build pace solves, 90-780 s.

### the hard part, honestly

The thermal dispatch is not currently an LP. It is a heuristic with unit commitment,
part-load heat rates, ramp-aware coal floors, synchronous floors and a reserve
requirement — behaviour that has been tuned against real Eskom outcomes and that a naive
LP would lose. **Replacing it risks trading a well-calibrated heuristic for a
badly-calibrated optimum.** `validate_benchmarks` and `validate_external` are the guard:
the rebuild must reproduce them before it is adopted, and if it cannot, the heuristic was
better and that is a finding too.

### when it is justified

Not to chase the 37%, which failed three tests. Justified when a result that matters
depends on it — the most likely candidate is the no-gas frontier costing, which is the
number most likely to be quoted at a regulator and which currently rests on heuristic
storage.

### sequence, if it is ever started

1. Pin `validate_benchmarks` and `validate_external` as the acceptance test first.
2. Build the co-optimised LP alongside the heuristic, not in place of it.
3. Compare on the benchmarks before switching anything.
4. Keep both, with the heuristic as the fast path for slider dragging and the LP for
   published runs — the two-speed pattern the interface already uses for the MIP.

---

## REEA nearest-substation re-derived — 30 Aug 2026

Every `sub`/`subkm` in `reea_projects.json` was computed before Chatty was added to the
register on 28 Aug, so all 2,597 were stale against a register known to be incomplete.
Recomputed by great-circle distance against all 186 substations.

```
33 projects reassigned · 1,442 MW
   32  Grassridge -> Chatty
    1  Dedisa     -> Chatty
```

**all three impofu farms reassigned, and the numbers match the falsification exactly.**
Impofu North moves Grassridge 106.1 km -> Chatty 92.7 km, against the 93.3 km measured
independently on 28 Aug from the Plus Code. The register fix has now propagated to the
derived data.

The reassignments are not only Impofu: Jeffreys Bay, Kouga, Ubuntu, Deep River,
Tsitsikamma and Oyster Bay all move too. **A single missing substation was distorting the
connection picture for 1.4 GW of Eastern Cape wind**, which is the concrete cost of an
incomplete register.

### the check that matters

```
records altered beyond sub/subkm      0
projects now further from a substation 0
```

Adding a substation cannot increase anyone's nearest distance. Any project ending up
further away would have proved the recomputation wrong, so that count is the test, not a
formality. Grassridge falls 65 -> 33 assignments; Chatty takes 33.

New fingerprint `gtza-7f4d8068c08bbb07`. `meta.nearest_substation_caution` now carries
the Impofu falsification in the data file itself, so anyone reading `sub`/`subkm` sees
that nearest is not connected without having to find it in these notes.

### karoo completeness — tested 30 Aug 2026, and it passes

A closed-loop test needing no external data: every transmission line records the
substation at each end, so any endpoint absent from `substations_compact.json` is a
missing substation. The two files come from different sources — lines from Eskom TDP and
SAPP planning data, substations from DBSA, osm, Eskom and shapefiles — so they do not
share a blind spot by construction.

```
lines crossing the Karoo box   49
distinct endpoints on them     26
missing from the register       0
```

Three raw misses were all correctly excluded: kokerboom is the Namibian interconnector
endpoint, and phezukomoya and san kraal are wind farms named as endpoints on the
connectors added earlier today — plants, not substations.

**So the register is complete for the Karoo relative to the line register**, which is the
area the Hydra Central split would use nearest-substation matching over.

Necessary, not sufficient, and the check says so in its own output: a substation with no
line in the line register would not be caught. It finds a specific, common kind of gap —
the kind Chatty was.

Now a permanent check in `validate_geo.js` (37 -> 38 checks). Verified it can fail:
removing Aggeneis, a genuine Karoo endpoint, produces
`missing: aggeneis` and exit code 1.

**an honest note on the first attempt.** I first tested it by deleting Chatty, and the
check still passed — which looked like the check being useless. It is not: Chatty sits on
the Eastern Cape coast at -33.84, outside the Karoo box, so it was never in scope. The
test was wrong, not the check. Worth recording because the same mistake would look like a
harness failure to the next person.

**to do — national register gaps.** 8 domestic endpoints are absent from the register — rassona
garcia, durban south, ottawa, zwavelpoort EE1, kappa (A) among them. Reported, not
asserted, because the line register names endpoints this project has no obligation to
hold. Worth a look if the nearest-substation method is ever used outside the Karoo.

---

## Storage split out in the mix view — 30 Aug 2026

The electricity mix showed one slice, "Batteries and flow storage", covering lithium,
vanadium and iron-air together. So there was no way to see whether the long-duration
tiers ever dispatch — the exact question the storage work of the past few days kept
running into blind.

Split now, and the answer is stark:

```
tier          annual TWh   hours active   July GWh   peak MW
lithium            7.352          1,608      534.0     14,777
vanadium           0.119             17        0.0     10,000
iron-air           1.022            131        0.0     13,759
```

**Vanadium dispatches 17 hours a year. Iron-air 131. Neither in july at all.** That is
the whole long-duration finding, visible at a glance, where previously it took an LP to
establish.

How it is built, and the constraint that mattered: `battByTier` holds hourly per-tier
series and `battTierTWh` the totals, but they are diagnostic — deliberately not added to
`stackKeys`. `stack.batt` remains the single carrier the energy balance sums, so
`validate_invariants` is untouched. Adding them as carriers would double-count storage in
every balance check: the split must decompose the total, never sit beside it. Verified —
the tiers sum to `stack.batt` with a gap of 0.000 MWh.

The donut splits only when vanadium or iron-air is actually present; with lithium alone
it still reads "Batteries and flow storage". And the long-duration slices are kept in the
legend even at a fraction of a percent, because "iron-air 0%" is the answer to a real
question and dropping it for being small would hide it again.

Two `audit.py` checks pin it (34 -> 36).

---

## Cost decomposition, structured on NERSA's own list — 30 Aug 2026

`r.costDecomposition`. Seventeen rows built against the Wholesale Electricity Pricing
Methodology and EPP section 4 — the same disaggregation the submission argued NERSA
should require, applied to our own number.

```
today          avgCost  570.46   components sum  570.46   reconciles
Seriti 45 GW   avgCost 1260.77   components sum 1260.77   reconciles
covered 5 · absent 10
```

The absences are the point: ten of the enumerated components are not in `avgCost`,
including legacy cost recovery, distribution charges and cross-subsidy. **That is why it
is not a tariff, now shown rather than asserted in a footnote.**

### two defects caught by summing it — within minutes of writing it

**A factor-of-1000 unit error.** My `per()` helper multiplied by 1000 when the terms were
already rand over MWh. Components summed to 574,000 against an avgCost of 570.

**`startUpCostR` is computed and used nowhere.** The residual gap was R3.54/MWh — exactly
the start-up cost. It accumulates at line ~5415, is exported on the result, and appears
in neither `avgCost` nor `totalCost` nor `gridCost`. Small today, 0.6%, but it scales
with coal cycling — precisely the regime a high-renewables system pushes coal into, which
is what this model exists to study.

**decided and fixed, same day: start-up costs are now included** in `avgCost`,
`gridCost` and `totalCost`. See the section below for the reasoning and the measurement.

### the check, not just the display

`validate_consistency` now asserts reconciliation across three scenarios (14 -> 17). A
decomposition that is never summed against the whole can be wrong indefinitely — this one
caught two faults immediately, which is the argument for the check existing at all.

---

## Start-up costs now included — 30 Aug 2026

### the professional position

Every unit commitment model — plexos, PyPSA, any production cost model — carries
start-up in the objective. It is the commitment problem: without it units cycle freely,
which is precisely the behaviour start-up costs exist to penalise.

The nuance is where they land. Start-up is not in a marginal energy price — ercot, pjm
and miso recover it through uplift or make-whole payments rather than through lmp. So
excluding it from `marginalP` is correct, and **it stays excluded there**.

But `avgCost`, `gridCost` and `totalCost` are system cost measures, not prices. They
already carry carbon and new-build capex, neither of which is marginal energy either.
Excluding start-up while including capex was an inconsistency, not a position.

### the measurement — and why it matters more than 0.6% suggests

```
scenario                coal TWh   start-up R bn   R/MWh   % of avgCost
today                      161.5            0.73    3.54          0.62%
20 GW VRE                  116.7            1.14    5.52          0.95%
45 GW VRE (Seriti)          51.2            0.30    1.45          0.11%
70 GW VRE                   59.3            1.27    6.12          0.66%
110 GW VRE                  44.5            1.08    5.19          0.40%
```

**it does not scale with renewables — it scales with cycling**, and the two are not the
same thing. The peak is at 20 GW of vre (0.95%), not at 110 GW. At 45 GW it collapses to
0.11%, because that scenario retains only 10 GW of coal running near baseload; there is
barely anything left to cycle.

So the intuition "more renewables means more start-ups" is wrong in this model. What
drives start-up cost is a large coal fleet being pushed around, which happens in the
middle of the transition and eases at both ends. That is a more interesting result than
the correction itself.

### effect on published figures

avgCost moves 570.46 -> 574.00 today, 1260.77 -> 1262.22 for Seriti. Every cost figure in
Results.md shifts by under 1%. `validate_benchmarks` still passes 18/18 — the change sits
well inside the bands, which is itself evidence the correction is modest and sound.

`marginalP` is unchanged, so shadow prices, capture rates and the storage opportunity
values are all unaffected.

---

## Prose audit after the storage and cost changes — 30 Aug 2026

Checked the user-facing blurbs against what the code now does. Four updated.

**cost note (line ~397).** Said system cost was "fuel, carbon and the capex of
newly-built capacity". Start-up costs are now in it. Both the system-cost and
avg-energy-cost sentences updated, and the note now explains why start-up is in a system
cost but not in the shadow price — because a marginal price recovers it separately
through uplift, as ercot and pjm do. That distinction was previously nowhere in the
interface.

**iron-air slider.** Read "the only option here that can ride out a multi-day renewables
lull" — untenable after the storage work. I then replaced it with a 400-character
explanation of hours, efficiency ranking and LP testing, which was worse: a slider note
should give the spec and point at the tool, not deliver the conclusion before the reader
has looked. Now one line — 100-hour storage at 45% round trip, and the mix splits storage
by chemistry so you can see when it dispatches.

**vanadium slider.** Same overcorrection, same trim. Now the spec plus the one thing the
reader cannot deduce: the electrolyte does not degrade with cycling, an advantage this
model does not yet price.

**the principle, worth holding to:** a note states what the control is and where to look.
It does not pre-state what you will find. Findings belong in results.md.

**hourly dispatch legend.** Left merged as "Batteries and flow storage", with a comment
saying why: that chart draws `stack.batt`, the single carrier the energy balance sums.
The per-chemistry split belongs in the mix donut, which decomposes a total rather than
stacking carriers. Splitting the dispatch chart would need `battByTier` in `stackKeys`
and would double-count storage in every balance check.

One typo of my own, caught by reading the rendered string back: "Seriti 45&#37; GW" — the
percent entity applied to the wrong number. Fixed. Worth doing that read-back on any
blurb containing entities.

---

## Site text trimmed — 30 Aug 2026 (sliders done, rest outstanding)

### the diagnosis: they were teaching, not informing

The pattern was consistent. Good notes give a calibration anchor — something a modeller
cannot look up:

```
coalEAFPct    FY2026 to date = 68% · 2023 crisis = 50-55% · target 70%
lcoePv        BW7 bids averaged R0.46; anchor R0.55
coalDecomMW   of 42 GW installed
```

Heavy notes opened by defining the concept — what synchronous inertia is, what dynamic
line rating does, what LCOE means — to an audience that already knows. That is what made
the platform read as a tutorial rather than an instrument.

### done: the 28 slider notes

```
before   4,500 characters · mean 160 · 4 over 300 · 2 over 500
after    2,504 characters · mean  89 · 0 over 300

syncMinMW        351 -> 120    dropped the definition of inertia
getsEnabled      325 -> 146    dropped the definition of DLR
costCcgt         596 -> 164    dropped the cross-reference lecture
lcoeDiesel       237 -> 121    dropped the explanation of what LCOE is
carbonTaxRPerT   902 -> 269    kept the compliance/policy split, lost the essay
ccgtForceLoad    185 ->  92    a toggle needs one clause, not two sentences
lcoeCcgt         271 -> 139
coalFlexPct      238 -> 158
ccsEnabled       171 ->  62    dropped a navigation instruction
```

**44% of the text removed and no information lost** — every figure, source and caveat
survives. What went was the definitions.

The trim list, longest first:

```
895  carbonTaxRPerT   two questions in one note - the policy/compliance split
560  costCcgt         explains what it is NOT at length
330  syncMinMW
313  getsEnabled
260  lcoeCcgt
226  coalFlexPct
```

`carbonTaxRPerT` at 895 characters is the worst and it is mine, written 30 Aug. The
compliance-versus-policy distinction is real and belongs somewhere, but not in a slider
tooltip.

### done: always-visible page prose

```
before   17 blocks · 5,929 characters
after    16 blocks · 3,292 characters      44% removed

KPI cost note           927 -> 415   kept what changes the number, cut the rest
capture-rate blurb    1,257 -> 136   dropped the definition of capture rate
Run the full model      745 -> 291   dropped the inventory of what it solves
network map legend      540 -> 186   dropped the click-here instruction
rooftop intro           544 -> 173   dropped the consumer-facing chattiness
pipeline button         507 -> 200
where-to-build blurb    488 -> 163
build optimiser         488 -> 198
single-node caveat      285 -> 247   substance kept, throat-clearing cut
```

**the collapsed methodology was left alone, deliberately.** About 12,000 characters sit
behind `<details class="assump">` — "Model assumptions & caveats" — covering price
formation, unit commitment, dc power flow, the risk model. That is exactly where detailed
methodology belongs in a serious tool, and it is closed by default. The problem was never
that the documentation existed; it was that definitions were on the working pages.

Still outstanding: the About tab itself and the project-planning tab descriptions.

The rule to apply: a note gives the spec and points at the tool. It does not pre-state
outcomes, argue methodology, or carry provenance — those belong in results.md, state.md
and the source comments respectively, all of which already exist and are better places
for them.

Scope is wider than the sliders: panel blurbs, the KPI cost note and the About text all
want the same pass.

---

## A regression check that pinned wording rather than substance — 30 Aug 2026

The prose trim fired `audit.py` twice, and both were the check being wrong rather than
the edit. It pinned a 79-character phrase — "curtailment payments to wind and solar
contracted under REIPPPP are excluded" — and the shortened note still states that
exclusion, in fewer words.

**A regression check on prose should assert the claim survives, not freeze the wording.**
Otherwise every legitimate edit trips it, and people learn to re-pin without reading —
which is worse than no check, because it looks like coverage.

Re-pinned on substance: 'REIPPPP curtailment payments are excluded' and 'Neither is a
tariff' as separate checks, so the not-a-tariff warning cannot be lost independently of
the exclusion. Same for the pipeline rings. 36 -> 37 checks.

---

## All-caps emphasis removed — 30 Aug 2026

Measured before starting: ~3,000 shouted words, almost all my own emphasis in comments
and these documents. User-visible page text was already clean — the scan found only a hex
fragment and "readme".

```
index.html comments   3,753 -> 3,073 capitalised tokens
RESULTS.md              987 ->   554
STATE.md              1,205 ->   667
SOURCES.md              126 ->   101
CALENDAR.md              85 ->    53
MANIFEST.md              45 ->    19
RULES.md                 46 ->    37
```

What remains is legitimate: acronyms, units and code identifiers.

### The first attempt corrupted index.html, and the suite caught it

A block-comment regex with dotall matched css comments and regex literals, and rewrote
code. `validate_lp` fell 50/50 -> 1/17 and `validate_solve` 6/6 -> 0/1 within seconds of
running it. Reverted from a backup taken before the edit.

The second pass only touches line comments, and only lines that are pure comment with no
backtick, quote or brace — so no line carrying code or a string can be reached. Verified
by stripping those lines from both versions and confirming the remaining code is byte
Identical.

`decaps.py` protects a keep-list: code identifiers (`FIXED`, `SLIDERS`, `BLD_PACE`,
`REGION_CENTROIDS`), document names (`RULES.md`, `STATE.md`) and about 120 acronyms.
Confirmed intact after the run.

Two lessons. Take a backup before any scripted mass edit — this one needed it inside two
minutes. And a mass edit is exactly what a test suite is for: nothing else would have
caught a regex quietly rewriting a solver.

---

## The national register gap was 8, and 5 of them were not gaps — 30 Aug 2026

Before hunting for coordinates, checked whether the missing names were real. Most were
not:

```
KOKERBOOM, HARIB, EDWALENI    foreign, already filtered
RASSONA GARCIA                 foreign - it is RESSANO GARCIA, the Mozambique border
                               town, MISSPELLED in the line register
KAPPA (A)                      a NAMING VARIANT: Kappa is in the register already
TANZANIA, MALAWI, SOUTH AFRICA country names, not substations
DURBAN SOUTH, OTTAWA           genuinely absent, KwaZulu-Natal
ZWAVELPOORT EE1                genuinely absent, east of Pretoria
```

**A gap list is only as good as the filter in front of it.** A misspelled foreign name
looks exactly like a missing domestic one, and a suffixed name looks exactly like a
missing substation when the register holds the short form. Five of eight would have sent
someone looking for coordinates that were never needed.

Two fixes in `validate_geo.js`: `RESSANO`/`RASSONA` and the country names added to the
foreign filter, and a name normaliser that strips a trailing bracketed unit designator
and the `EE1`/`MTS`/`DS`/`SS` suffixes before declaring a substation absent.

The three that remain are real — and were closed the same day when the coordinates were
supplied. See below. **The register now has zero missing domestic line endpoints.**

The harness now warns if more than three appear: "check whether a naming variant or
foreign endpoint is being counted as a gap before hunting for coordinates".

---

## The last three substations added — 30 Aug 2026

Coordinates supplied as Plus Codes, decoded with a local Open Location Code
implementation. **Validated against the known answer first**: Chatty's `5G7F+J6` recovers
to within 0.1 m of the value derived independently on 28 Aug, so the decoder is sound.

```
Durban South   2WXV+GQ Durban     -29.951188, 30.944438   275 kV   corroborated
Ottawa         82CX+7Q Blackburn  -29.679313, 31.049438   275 kV   PROVISIONAL
Zwavelpoort    approximate        -25.809440, 28.379720   400 kV   planned, unlocated
```

**they are not equally trustworthy, and the file says so per entry.**

Durban South is corroborated: the transmission line naming it as an endpoint terminates
0.1 km from the decoded point, which is evidence independent of the Plus Code.

Ottawa is provisional: its line endpoint is 10.8 km away. Either the geometry is
schematic there or the Plus Code locates a different feature. Recorded as a discrepancy
rather than smoothed — Durban South came from the same source on the same day and matched
to 0.1 km, so the method is sound and this case is specifically uncertain.

Zwavelpoort is `src:"approx"`, deliberately not `"pluscode"`, so it cannot be mistaken for
a located point. It is excluded from nearest-substation matching entirely.

Register 186 -> 189. `validate_geo` now reports **0 domestic endpoints absent**.

### A mistake I made and caught in the same step

My first re-derivation excluded every `planned:true` substation from matching, on the
reasoning that a planned substation is not a connection point. That reassigned **205
projects**, moving them away from Koruson — 65 km — to Poseidon at 122 km.

But Koruson is built. Its `planned:true` is the stale DBSA flag that state.md already
records as unresolved. I acted on a flag I had personally documented as wrong, and it
made the data worse while looking like a principled improvement.

Corrected: only `src:"approx"` is excluded, which is one entry. Net change against the
original file is **34 projects** — the 33 Chatty reassignments plus one to Ottawa.

The lesson: `planned` in this register means "the register said planned at ingest", not
"does not exist". Do not use it as a filter until the stale flags are resolved.

---

## The planned flags, audited — 30 Aug 2026

Prompted by the near-miss above: `planned` almost caused a 205-project reassignment, so
it was worth establishing what the flag actually means across all eleven entries.

```
11 planned  ·  10 from DBSA, 1 approx
 9 corroborated by the Eskom TDP  — consistent with planned, NOT evidence against it
 1 disputed  — Koruson
 1 genuinely unbuilt and unlocated — Zwavelpoort
```

### the first evidence I found was circular

The line register appeared to show Koruson as an endpoint of an existing line, which
looked like proof it is built. It is not: the only two lines naming Koruson are the
Indicative connectors added earlier the same day, marked `existing` because the
connection is real. **My own data confirming my own conclusion.** Checked before acting
on it, which is the only reason it did not become a finding.

So the line register offers no independent evidence on any of the eleven.

### koruson is disputed, not resolved

Edf Power Solutions built the main transmission substation for Koruson 1 and that cluster
is operating, so it is almost certainly built and the TDP entry predates completion. The
flag is not flipped — no commissioning source has been checked — but the entry now carries
`planned_disputed: true` and the reasoning.

### what the flag means, now in the data file

`planned` records what the DBSA register said at ingest. It does not mean the substation
does not exist. `meta.planned_flag_meaning` says so, names the 205-project error, and
directs anyone wanting a filter to use `src="approx"` instead — which records whether a
Position is known, a question the data can actually answer.

`validate_geo` (38 -> 39) asserts that documentation exists, so the explanation cannot be
lost while the flag survives.

---

## Hybrid co-location tested — 30 Aug 2026

`hybrid.js` at the repo root. Project-level price-taker LP, battery behind the meter so
it charges only from its own plant.

```
solar uplift    2026 +2-6%    2030 +4-8%    2035 +166-408%
wind uplift     2026 +1-4%    2030 +3-7%    2035  +39-82%
```

**The value of co-location is not a constant, it is a function of penetration.** At
today's build a battery is a marginal financing decision. At grid pace by 2035 it is the
difference between R133/MWh and R674 for solar — a project that works and one that does
not.

Solar with a full-capacity battery recovers 91% of its 2026 revenue in a market where
unstored solar has lost 82%.

Wind gains far less (39-82%) for the same reason as every capture result here: solar is
coincident and needs shifting, wind is diverse and already runs at night. But solar with
storage overtakes wind in absolute terms — R674 against R568 — because it has more energy
in fewer hours and a battery is the right tool for exactly that.

Caveats: perfect foresight (upper bound), no capex netted off, single weather year, grid
pace is the harshest of the three.

---

## Repo housekeeping — 30 Aug 2026

### Licence lines added

`RESULTS.md`, `STATE.md`, `SOURCES.md`, `MANIFEST.md` — `RULES.md` already had one.
Uniform wording, and it says the three things that matter: CC BY-NC-ND 4.0, that data
files carry their own terms, and that **nothing here is a tariff, a forecast, or
investment advice**. Worth stating explicitly now that the file contains merchant-value
and hybrid revenue figures.

### results.md is publishable — checked, not assumed

Scanned for email addresses, named individuals, unsourced claims and unconfirmed
allegations. Clean on all four. The withdrawn claims stay in, marked as withdrawn: a
findings file that shows what failed is more credible than one that shows only successes.

### calendar.md names two people — and has been public since 27 august

A redacted `CALENDAR.public.md` was created and then dropped the same day. The reasoning
that killed it: only `HANDOVER.md` and `LOG.md` were ever gitignored, so `CALENDAR.md`
has been tracked and pushed since the split. **Removing the names now does not unpublish
them** — git keeps history and GitHub keeps forks. A second edition would have added a
step (remember which file to edit, remember which to push) for no protection, and a
process that provides no benefit gets skipped until the wrong file is published.

What is actually exposed is mild: both roles are published by the organisations
themselves, neither person is private, and the entries say nothing objectionable.

Full audit of the tracked documents afterwards — personal emails, phone numbers,
negotiating positions, unverified allegations, commercial terms. **All clean.** The two
"unverified claim" hits in state.md are this paragraph describing the scan.

The institutional email addresses in `SOURCES.md` are published contacts on their own
organisations' websites.

**rules.md rule 8 now states the position:** assume every tracked file is already public.
A second copy is not a control.

### handover.md replaced with a stub

Not deleted, so an old copy or an old link lands somewhere useful rather than on stale
content. It says where each of the seven documents went and what each is for, and points
a new reader at `RULES.md` and the fitness-for-purpose section first.

---

## Hybrid uplift surfaced in the interface — 30 Aug 2026

`hybridUplift()` and a new column in the capture-rate panel: what a co-located battery
at half the plant's capacity, four hours, charging only from its own output, adds to
achieved revenue.

```
tot GW   solar bare   solar + battery   uplift
     8          743               764      +3%
    25          746               746       0%
    45          640               744     +16%
    70          277               696    +152%
   110           56               549    +877%
```

**greedy, not an LP, and validated before shipping.** Checked against the full-year
price-taker LP in `hybrid.js` across three build levels and two technologies: the greedy
lands within 4.5% and is conservative in eleven of twelve cases. It runs in 1-5 ms
against the LP's seconds, which is what makes a panel possible at all. A day at a time is
also closer to how a plant is actually operated than perfect foresight of the year.

### the first version lost money, and that is the interesting bit

It charged to full every day and discharged regardless of price. The panel showed **-1%
and -4% uplift at low penetration**, while the LP showed +2% to +6%. The LP simply
declines an unprofitable cycle; the greedy had no such test. Storing energy worth R700 to
sell it at R700 destroys 12% of it.

Fixed by pairing the cheapest charging hour with the dearest discharge hour and executing
only where `sell x efficiency > buy`. That is the same reservation-price logic the system
storage work arrived at independently — a heuristic without a value test loses money, and
it does so while looking busy.

After the fix, +3% at today's build against the LP's +2-6%. `audit.py` pins the column
(37 -> 38).

---

## Consolidation pass — 30 Aug 2026

Everything today was verified in isolation. This checked the delivered set together, and
found three inconsistencies that no individual change would have shown.

**1. four stale fingerprints in state.md.** Each was correct when written and superseded
when the same file changed again later the same day — `substations_compact.json` changed
three times, `reea_projects.json` twice. All ten data files verify against their own
content; it was the documentation that had drifted. Corrected, and re-verified to zero.

**2. the suite table was wrong by nine checks and one harness.** It claimed eighteen
harnesses and 817 checks. A full run gives seventeen harnesses and 826 checks — I had
been incrementing a running tally rather than measuring, and the tally drifted in both
directions at once. Rebuilt from the actual run.

```
stress_suite 290 · invariants 149 · response 81 · lp 50 · weather 48 · geo 39
audit 38 · outputs 33 · capacity 28 · benchmarks 18 · consistency 17
structure 10 · audit3d 9 · solve 6 · eng5 6 · external 2 · lint 2
```

**3. .gitignore had handover.md still ignored**, from when it was the 3,622-line
original. It is now a stub pointing at the seven documents that replaced it, so it must
be tracked — an ignored stub helps nobody holding an old link. Written with `!HANDOVER.md`
and a comment explaining why, so it is not "tidied" back.

The lesson: a running count is not a measurement. Every individual change today was
checked and the aggregate was still wrong, in a document whose entire purpose is to say
what is true right now.

---

## results.md indexed, and a harness for the documents — 30 Aug 2026

### The index

`RESULTS.md` passed 1,400 lines and the strongest findings were no longer findable. It
now opens with an index ranked by **evidential strength, not by how interesting the
finding is** — the two are not the same, and the difference is what should decide what
gets said in public.

```
Tier 1  arithmetic on published data — the headroom result, the frontier shortfall
Tier 2  ten weather years or an optimal solve — wind-heavy, iron-air, flexibilisation,
        capture asymmetry
Tier 3  single year or heuristic-dependent — frontier cost, ancillary shrinkage,
        hybrids, demand response
Withdrawn, kept deliberately — the 37%
```

### validate_docs.py — 18 checks, and it found two things immediately

Nothing in the suite looked at the markdown, and these files are the project's public
face and the basis of a regulatory submission.

**it caught a second stale count I had missed.** The consolidation pass earlier today
fixed the suite table at line 226 and I believed it done. There was another at line 16,
inside the fitness-for-purpose section — still reading 18 harnesses and 817 checks. Two
copies of the same fact, one updated. Rule 6 applies to documents as much as to code.

**and a heading my own script had mangled.** "Fitness for purpose" had become "fitness
For purpose" when the de-capitalisation script ran over it. The first version of the
check was case-sensitive and reported the section as missing rather than misspelled —
which would have sent someone looking for the wrong problem. Now case-insensitive.

What it checks: every tracked document exists and carries a licence line; every
fingerprint quoted in the docs matches a real data file; the suite table sums to its own
headline; every index pointer in results.md resolves to a real section; and state.md
opens with fitness-for-purpose.

---

## NERSA registrations panel: total first, quarter on a tab — 30 Aug 2026

Reported: the panel used to show the total pipeline and now shows only the latest
quarter. Both were in fact present, but an earlier change put the quarter at the top on
the reasoning that a panel called "new project registrations" should lead with the news.
That buried the 20.1 GW cumulative figure, which is what most readers come for — it is
the number that gets compared against grid headroom.

Now two tabs, **total pipeline as the default**, with the quarter one click away. Both
stay in the dom and the switch toggles display, so the regional bars do not reflow.

**A real bug caught by testing the click, not the render.** The handler was first placed
inside a block two braces deep, so it was not on `window` and the `onclick` would have
failed silently in a browser — the default view rendered perfectly and the tab would
simply have done nothing. jsdom surfaced it as `nersaView is not a function`; a render-only
check would have passed. Moved beside `togglePipeline`, an existing handler proven
reachable, and brace depth verified as zero.

Two `audit.py` checks pin the tab switch and the default view (38 -> 40).

---

## NERSA panel: two sources that conflicted — 30 Aug 2026

The panel header said "Source: NERSA media statements" for everything, while the footer
credited "SAPVIA NERSA Dashboard". A reader could not tell which applied to what, and one
of them had to be wrong.

**both were right, for different scopes.** `nersa_registrations.json` settles it: its
`meta.source` is SAPVIA and its description names the SAPVIA NERSA Registered Plants
Dashboard, while the quarterly figures in `meta.note` come from NERSA's own media
statement. Cumulative and quarterly are different series from different places.

Fixed by labelling each at the point it appears rather than making one claim for the
panel:

```
header      no source claim at all - it covers both views
cumulative  "Cumulative: SAPVIA NERSA Registered Plants Dashboard"
quarter     "Source: NERSA media statement."
```

A third reference was found in the About source register, which credited only NERSA media
statements for the whole dataset. Corrected there too, and `SOURCES.md` now carries them
as two rows rather than one — different cadence, different scope.

The pattern: an attribution that covers a panel rather than a figure will eventually
cover something it did not come from. Attribute at the point of use.

---

## Chatty corroborated — 31 Aug 2026

A second Plus Code was supplied: `5G7C+QF Ibhayi`, against `5G7F+J6` in the register
since 28 Aug. **They are different codes.** Decoded, they fall 178 m apart — inside the
footprint of a substation, so this is corroboration from an independent code rather than
a correction.

The later, more precise code is now used. `src` upgraded `pluscode` ->
`pluscode-corroborated`. Distances to the three Impofu farms move by at most 0.2 km, and
the finding that started all of this holds unchanged: Chatty at 93.1 km against
Grassridge at 106.9 km.

Nothing downstream moved: **zero substation reassignments across 2,597 REEA projects**,
maximum distance change 0.20 km.

### I fell into a trap I had documented this morning

My first measurement reported **46 reassignments and an 87 km maximum change** — from a
178 m shift, which is impossible. The cause: I compared the before and after states by
keying on project name, and `reea_projects.json` has **652 duplicate names** among 2,597
records. Most projects were being compared against a different project's row.

This is the same fault, in the same session, as the 65 duplicate labels in
`transmission_lines.geojson` — where I caught it, wrote it up, and recorded "do not key
on `label` in this file". The lesson did not generalise because I had written it as a
fact about one file rather than as a habit.

**compare positionally, always.** Re-measured by index: 0 reassignments, 0.20 km. And
note the failure was loud only because the number was absurd — a duplicate-key comparison
that produced a plausible figure would have been believed.

`validate_docs.py`, written this morning, caught the resulting stale fingerprints
immediately.

---

## Attribution audit — 31 Aug 2026

Prompted by the NERSA panel, where two source lines conflicted. Checked all 29 panels.

### the conflict was the only one — but it hid a bigger gap

The twelve existing source attributions are all correctly scoped. One is already a
correct combined attribution: the grid-queue panel names SAPVIA for registrations and
NTCSA for headroom, which is right because it plots two series from two places.

**The real problem was panels with no indication of what kind of number they show.**
"Curtailment forecast", "Capacity payments", "Capture price forecast", "Battery revenue
benchmark" — all read as observations, and all are model output.

### one convention: modelled or sourced, on every panel

```
17 panels now tagged "modelled"    numbers out of the engine
 5 name their external source      Eskom TDP, NTCSA GCCA, SAPVIA, DFFE
```

Two data panels gained an attribution they never had: the Network Schematic (Eskom TDP
and SAPP corridors) and Where To Build (NTCSA GCCA headroom).

**the distinction matters more than the source.** A reader who mistakes a modelled
capture price for an observed one will quote it as fact. `audit.py` now pins the
convention (40 -> 41).

`audit.py` also caught the Network Schematic edit mid-change: it pinned "node size = avg
output" and I had written "modelled output". Correct behaviour — that phrase is a claim
about what the node size means, not decoration.

---

## Yelland newsletter, 31 Aug 2026 — four items acted on

### 1. aquila is built, and privately built — a planned flag resolved by source

The R1.35bn Aquila Main Transmission Substation was built in a partnership led by
SolarAfrica with Proconics NewFields, serving the SunCentral wheeling hub between Hanover
and De Aar, and handed over to Eskom and NTCSA.

`planned` removed. **This is the first of the eleven planned flags resolved by a
published source rather than inference**, and it resolved the way the Koruson case
suggested the others might — the DBSA register is stale, not wrong about the world.

**second confirmed private shared-network asset**, after Koruson. Both follow the same
pattern: a developer builds a substation sized for multiple customers, then transfers it
to the utility. That is how private capital is adding shared headroom — the only kind
that helps anyone but the builder — and it is worth tracking as a category rather than
case by case.

### 2. two cumulative NERSA totals that disagree by 1,769 MW

```
SAPVIA collation (ours)   2,619 facilities · 20,131 MW · ~R409bn
NERSA's own statement     2,692 facilities · 21.9 GW  ·  R452.9bn
```

The quarterly figures agree exactly — 124 facilities, 804 MW, R20.2bn — so the divergence
is in accumulated history, not the current period. not reconciled and deliberately not
averaged. The panel now shows the SAPVIA figure and states NERSA's alongside it.

Likeliest explanation is different treatment of deregistered or superseded facilities,
but that is inference. Ask SAPVIA, or read a NERSA quarterly directly.

### 3. NERSA cannot track what gets built — from the regulator itself

NERSA has no mechanism to monitor which registered projects reach operation, and no
legislated deadline requires a developer to build a registered plant. Sub-100 kW
generation needs no registration at all and mostly is not recorded by Eskom Distribution
or municipalities either.

So the 20 GW is **an overcount of what will exist and an undercount of small plant**. Now
stated in the panel and in the data file: this is a pipeline of intent.

### 4. aurora corroborates the frontier, independently

Aurora Energy Research forecasts renewables at 88% of supply by 2060, needing **more than
120 GW of new capacity** as over 30 GW of coal retires. Our own no-gas frontier lands at
110-120 GW combined. Different method, different horizon, same order of magnitude — the
first external corroboration of that number this project has had.

### noted, not acted on

- Voltalia Bolobedu (148 MW, Limpopo, wheeled to rbm) and Envusa are already in
  `pfl_private_h1_2026.json`. Good — the H1 monitor caught them.
- **SunCentral is not.** 342 MW energised near Hanover/De Aar, of a planned 1 GW. A named
  candidate against the 1,823 MW of unexplained solar in identity 3. Do not add it on a
  press report — but it is the best lead yet on that gap.
- Koeberg fully offline 27 Aug (both units). An outage, not a structural change;
  `nuclearMW` is unaffected.

---

## to do — two priorities from the 31 Aug newsletter

### A. reconcile the NERSA cumulative, 1,769 MW short

```
SAPVIA collation (loaded)  2,619 facilities · 20,131 MW · ~R409bn
NERSA Q1 2026/27 statement 2,692 facilities · 21.9 GW  ·  R452.9bn
gap                           73 facilities ·  1,769 MW
```

The quarterly figures agree exactly, so the divergence is in accumulated history. Both
are currently shown in the panel with neither presented as correct.

Routes, in order of likely yield:
1. Read a NERSA quarterly media statement directly rather than through SAPVIA's
   collation — the primary source settles which is which.
2. Ask SAPVIA how deregistered or superseded facilities are treated. A collation that
   nets off withdrawals against a regulator that does not would produce exactly this
   shape: fewer facilities and less capacity, growing over time.
3. Compare an older quarter from both. If the gap is roughly constant it is a one-off
   reclassification; if it grows it is a treatment difference.

DO NOT average them, and do not switch source silently — the whole point of carrying two
is that a reader can see they disagree.

### B. track what actually gets built — the opportunity NERSA has named

NERSA states it has no mechanism to monitor which registered projects reach operation,
and no deadline compels a developer to build. **That is a gap in the national data that
this project is unusually well placed to fill**, because it already holds all three
stages: REEA permits (2,597), NERSA registrations (2,619), and commissioning records.

A first pass is computable today from data on disk — registered against commissioned by
region — and it immediately shows why the naive version must not be published:

```
region            registered MW   commissioned MW   built %
Eastern Cape              921             1,896      206%
Free State              3,406               169        5%
Gauteng                 2,569                50        2%
TOTAL                  20,116             6,754       34%
```

**206% is not a finding, it is a universe mismatch.** NERSA registrations cover private
and embedded generation above 100 kW. REIPPPP plant is licensed under a different regime
and never appears in them — so the Eastern Cape's REIPPPP wind is in the commissioned
column with no counterpart in the registered one. Comparing the two mixes universes,
which is the error this project keeps catching in other people's numbers.

The correct comparison is NERSA-registered against private commissioned only. The blocker
is that `by_source.private` holds H1 2026 alone (958 MW) — the same gap as open item
"pre-2026 private capacity", and #PowerTracker is the identified source for it.

SO the sequence is:
1. Ingest #PowerTracker for private commissioning history. This unblocks both this and
   the 1,823 MW unexplained solar in identity 3.
2. Then reconcile registered against private-commissioned, by region.
3. Then project-level matching — but note `reea_projects.json` has 652 duplicate names,
   so match on coordinates and capacity, never on name (rule 9).
4. Satellite verification is the only method that scales to confirming a plant exists,
   and is already on the list.

Why it matters: a 20 GW pipeline that nobody can convert into a build forecast is exactly
the uncertainty the headroom and merchant-value work runs into. And a credible
registered-to-built conversion rate would be a genuinely novel public output — the
regulator has said plainly that it does not have one.

---

## Eskom FY2026 annual results, 31 Aug 2026 — read for model impact

### the best external check this model has: renewable share

Eskom reports **renewables at 11.7% of power supplied in FY2026**. The model returns
**12.0% on the residual basis** — rooftop removed from numerator and denominator, which
is what "power supplied" means for a utility that cannot meter behind the customer's
meter.

**0.3 points apart.** Now a benchmark check (`reShareResid`, band 9.7-13.7%), taking
`validate_benchmarks` 18 -> 19. The band is deliberately +/-2 points rather than tight:
Eskom does not state its treatment of hydro, imports or IPP output, and any of those
would move it by a point. A sanity check against a published national figure, not a
precision test.

This also vindicates the dual-denominator convention in rules.md. On the total basis the
model reads 17.2%, which would have looked like a 47% overstatement against Eskom's
number. Same model, same year, five points apart — exactly the ambiguity the convention
exists to prevent, now demonstrated against a real published figure.

### EAF: the constant was right, the note was stale

`FIXED.coalEAFPct` is 65 against an audited FY2026 of **65.16%** — essentially exact. But
the slider note read "FY2026 to date = 68%", a part-year figure now superseded. Replaced
with the audited series: FY2024 54.6%, FY2025 60.6%, FY2026 65.2%, Eskom target 70%.

Three years of audited outturn is a better calibration anchor than one part-year number,
and it shows the trend the model's own scenarios turn on.

### noted, not acted on — each needs a decision

- **Kusile Unit 6, 799 MW synchronised.** `coalInstalledMW` is 42,000. Check whether it
  is already inside that figure before adding.
- **Sales 178 TWh, down 6.2%**, with industrial down 9.7 TWh (22.5%) on ferrochrome
  smelter hardship. A structural demand change, not a cycle. The model's demand growth
  slider starts at 0; the real trend is negative.
- **2-3 GW surplus capacity for the first time in over a decade.** Bears directly on the
  adequacy results.
- **13.1 TWh lost to theft** — about 6% of supply, and not represented in the model at
  all.
- **Grid: 8,362 km of line and 82,425 mva by FY2031**, out of R343bn capex with 46% to
  NTCSA. Cross-check against the TDP-derived R584/kW-yr behind `txRPerKWyr`. Different
  period and scope, so not a like-for-like, but worth reconciling.
- **Eskom Green: 6 GW carbon-free by FY2030, 32 GW renewables and storage by FY2040,
  1,500 MW gas by FY2029 ramping to 3,000 MW by FY2031.** This is a fourth named build
  pathway alongside historical, IRP, masterplan and grid — and it is Eskom's own plan,
  which none of the existing four are. Strong candidate for a preset.
- **OCGT utilisation more than halved, R10.6bn saved.** Corroborates the merit-order
  dispatch the model assumes.
- Municipal arrear debt R111.6bn, heading to R358bn by FY2031 if unabated. Outside the
  model's scope but it is the largest single risk to the tariff path everything here
  prices against.

---

## Eskom integrated report FY2026 — technology-by-technology validation, 31 Aug 2026

The integrated report publishes generation by technology and a full audited energy
balance. First check of the model against national data technology by technology rather
than against a band. Full table in results.md.

```
coal  -2.4%   nuclear  -1.8%   wind  +6.7%   solar  -8.7%   CO2  -7.6%
```

Four of five inside 9%, coal and nuclear inside 3%.

### imports were double reality — corrected

The model ran 8.56 TWh against an audited 4,090 GWh. The cause was a literal `0.85`
utilisation hardcoded at three sites and duplicated as `IMPORTS_CF` in
`nodal_engine.js` — a rule 6 violation and a stale value at once.

```
audited   FY2024  9,150 GWh -> 0.91      FY2025  7,570 -> 0.75      FY2026  4,090 -> 0.41
```

0.85 was roughly right for FY2024. Cahora Bassa deliveries have more than halved in two
years and no constant reflected it. Now `FIXED.importsCF` 0.41, one constant, sourced.

Result: imports 4.13 TWh against 4.09 audited, coal 166.0 against 165.4, and **CO2
improved from -7.6% to -5.1%**.

### two checks rebased from contract to measurement

`validate_benchmarks` and `validate_outputs` both failed, and both were testing against
the Cahora Bassa contract — 1.15 GW firm at high availability — rather than delivery.
The contract is unchanged and still runs to 2030; what changed is how much arrives.

**Testing against a contract tests what is permitted, not what happens.** Rebased on
three years of audited outturn, with bands wide enough to hold the trend so a normal
year-on-year move is not a failure. This is not relaxing a check to make a change pass:
it replaces an assumed utilisation with an audited one, which is strictly stronger.

The `validate_response` baseline moved four cells and was re-pinned — a deliberate,
measured change, which is the only reason to re-pin.

### still open

- **OCGT: the model runs zero, Eskom ran 1,079 GWh.** The merit order never needs a
  peaker at 65% EAF and today's demand; Eskom runs them for reserve, ramping and network
  support, none of which the model prices. Reality is dirtier and dearer than the model,
  and the gap will be worst in the tight hours.
- **Technical and other losses 23,921 GWh, 11.6% of energy available.** Not modelled at
  all, and larger than every technology except coal.
- `IMPORTS_CF` in `nodal_engine.js` is still a second copy of this constant. It should
  read `FIXED.importsCF`.

---

## to do — from the Eskom FY2026 results and integrated report

### Model gaps the audited data exposed

1. ~~OCGT under-runs / the model sheds in the wrong season / the four-point EAF gap.~~
   **all three closed 31 Aug 2026 on Eskom's own hourly data.** The seasonality is right
   (model 9.0x Jan-Mar against Jul-Sep, Eskom 8.5x, now benchmarked). The level differs
   because **63% of Eskom's peaker output runs below 25 GW of demand with ~25.8 GW of coal
   available** - reserve, network support and ramping, none of which an energy merit order
   prices. `coalEAFPct` stays at the audited 65. Full working in results.md.

2. **Non-economic dispatch is not modelled - now PRICED, still not represented.**
   1 Sep 2026: the cost of curtailing renewables is quantified. Every TWh spilled is
   replaced by 0.97 TWh of coal carrying 1.00 Mt of CO2, and at the approved 4% ceiling
   costs generators R0.70bn a year against R3.0/MWh on system cost.

   What remains absent is the MECHANISM. The model dispatches on merit order between
   Eskom and IPP plant with no representation of an operator favouring its own units in
   surplus. The figures above therefore price the APPROVED ceiling and are a floor on any
   use beyond what congestion requires. Separating the two needs metered curtailment
   instructions by plant, which is not public - a data request, not a modelling problem.

3. ~~`IMPORTS_CF` in nodal_engine.js is a second copy.~~ corrected 31 Aug 2026 to 0.41,
   with a comment at both constants saying the other exists. It stays a literal because
   the file is loaded as a plain script by four harnesses with no access to `FIXED`.
   note both read 0.85 and drifted in neither, which was luck rather than design.
4. ~~Kusile Unit 6 / capacity reconciliation.~~ done 31 Aug 2026 — see below.
5. **13.1 TWh lost to theft**, about 6% of supply. Distinct from technical losses and
   also absent.

### Calibration worth revisiting

6. ~~Demand trend anchor.~~ done 31 Aug 2026 — the demand slider had no note at all and
   now carries the audited series: 183.3 TWh FY2024, 189.7 FY2025, 178.0 FY2026, with
   Eskom targeting stabilisation at 178. It also states that growth here is a forward
   assumption, not the observed trend.
7. ~~2-3 GW surplus capacity check.~~ done 31 Aug 2026. Model gives 2.2, 2.9 or 3.4 GW
   depending on whether contracted imports and vre count as surplus; two of three sit
   inside Eskom's range. Now a benchmark (`surplusGW`, 1.8-4.0 GW) — **the first check on
   the adequacy side against a published national figure.** Full working in results.md.
8. ~~Grid capex cross-check against `txRPerKWyr`.~~ done 31 Aug 2026. The two routes
   bracket the constant: TDP ~R700/kW-yr gross, Eskom's FY2027-31 capex plan ~R490, model
   default R600 net. No change made — it was defensible on one source and is better
   supported by two. Three assumptions are doing real work in the R490, chiefly that
   unlocked capacity scales with route-km, which is exactly what the locational analysis
   says is false corridor by corridor. Full working in results.md.

### New scenario

9. ~~Eskom Green as a fifth build preset.~~ done 31 Aug 2026 — see below. Original scope: — 6 GW carbon-free by FY2030, 32 GW
   renewables and storage by FY2040, 1,500 MW gas by FY2029 ramping to 3,000 MW by
   FY2031. It is Eskom's own plan, which none of historical, IRP, masterplan or grid
   are, and it is the one a South African reader is most likely to want to test.

### Watch

10. Municipal arrear debt R111.6bn, heading to R358bn by FY2031 if unabated. Outside
    the model's scope, but it is the largest single risk to the tariff path that
    everything here prices against.

---

## to do — what to take from Aurora Energy Research, 31 Aug 2026

Studied 31 Aug. Opposite business model — they sell subscriptions and advisory, this is
free and open — but the structure is instructive.

### the organising insight: they segment by decision, not by data

Aurora's entry points are Developers, Financial Sector, Utilities, Energy Consumers.
Their offerings are Asset Siting, Portfolio Valuation, PPAs, Transaction Support. Not
"here is our data" but "here is the decision you are making".

GridTwin already splits System Planning from Project Planning, which is the same
instinct. But the project side is a row of tools rather than a framed decision, and the
strongest developer-facing work of the past two days — merchant value, capture rates,
hybrid uplift — is not presented as answering a developer's question even though it does.

**1 & 2. ~~Re-frame the project tools by decision.~~ done 31 Aug 2026.** Each of the
seven tabs now carries the question it answers as a tooltip — "Can I connect here, and
what does the connection cost?" rather than "Grid connection" — and the row is introduced
as a project's lifecycle: resource at the site, then grid connection, then what it earns,
then how the power reaches a customer, then whether it stacks up.

Deliberately a tooltip plus one visible line rather than seven visible subtitles: the
text trim earlier the same day removed 44% of the page prose, and seven new lines would
have put much of it straight back. The lifecycle sentence carries the framing; the
per-tool detail is one hover away.

Verified the line sits as a sibling of the tab row rather than inside a panel, and that
tab switching still works — placement is the thing that would break silently. `audit.py`
pins it (44 -> 45).

### flexplorer is the closest analogue to something half-built here

Their battery product benchmarks assets against peers and against their own indices
across 40+ markets. The battery saturation curve, revenue split, locational panel and the
new hybrid uplift are the components of exactly that for South Africa.

Their published case study is "supporting landmark battery storage financing in a market
Without capacity payments" — which is literally the ancillary finding in results.md.

**3. ~~Assemble the battery work into one view.~~ done 31 Aug 2026.** `storageSummary()`
reuses `bessBenchmark`, `bessSaturationCurve` and `hybridUplift` rather than recomputing,
so it cannot drift from the panels it summarises, and it surfaces the one comparison the
separate panels never made: merchant or attached. The same 4-hour battery attached to a
solar plant at half its capacity lifts that plant from R756 to R1,225/MWh.

Wired into the existing battery panel rather than given its own, because that panel
already opens with the question. `validate_structure`'s orphan check caught it as
unwired first — correctly.

### what not to take

**Do not chase breadth.** 40 markets, hydrogen, subscription analytics — that is a
hundred-person company. The advantage here is the opposite: one country modelled
properly, openly, with the workings visible and the failures published. **Aurora cannot
be checked by anyone outside Aurora.** That is the thing to lean into, not trade away.

**Do not adopt "bankable" or similar.** Their word for credibility is a claim; the
fitness-for-purpose section does the same job by showing its limits, which is stronger
for a tool anyone can inspect.

### and they are a plausible reader, not only a competitor

**4. aurora is an outreach target.** They have a named South Africa presence, and their
2060 outlook — 88% renewables, >120 GW of new capacity — independently corroborated the
no-gas frontier at 110-120 GW. Different method, different horizon, same order of
magnitude. That corroboration is a reason for them to take an approach from this
project seriously. Queue behind Seriti.

---

## The losses task was wrong — 31 Aug 2026

I listed "technical losses 23,921 GWh not modelled" as a gap. **Checking it first showed
the opposite**, and acting on it would have broken a good calibration.

```
model grid generation, excl rooftop        208.5 TWh
Eskom energy available for distribution    206.0 TWh   +1.2%
Eskom local and international SALES        178.0 TWh  +17.1%
```

`profiles.json` states its own basis: `demand = gross grid demand + est rooftop`, which
is the available-for-distribution figure, before losses. The model tracks it to 1.2%.
Adding a loss term would have double-counted 24 TWh.

**the requirement was a caveat, not a model change.** Never compare the model's served
energy against a national sales figure — it reads 17% higher by construction, and
correctly so.

### Pinned as a check, because this is a mistake someone will repeat

`gridGenTWh`, band 190-222 TWh (`validate_benchmarks` 19 -> 20). Fails high by ~17% if
someone compares against sales; fails low by ~12% if someone adds a loss term that
double-counts. The band's `why` names both failure modes.

### and the check immediately exposed a display bug

The band printer assumed every range was a percentage, so a TWh band rendered as
"210.2%    190-222%". Harmless to the assertion, misleading to read — and the first band
in another unit was the one asserting a demand basis, where a wrong unit is exactly the
confusion it exists to prevent. Printer is now unit-aware.

### also done

`IMPORTS_CF` in `nodal_engine.js` corrected 0.85 -> 0.41, matching `FIXED.importsCF`.
It stays a literal because that file is loaded as a plain script by four harnesses with
no access to `FIXED`, but both constants now carry a comment naming the other. They read
0.85 and drifted in neither place, which was luck rather than design.

---

## Fleet capacity reconciled against Eskom's published nominal — 31 Aug 2026

The integrated report gives nominal capacity by technology. The parts sum to 47,378 MW
exactly, so the extraction is sound.

```
                Eskom nominal   GridTwin    delta
coal                   39,692     42,000    +5.8%
nuclear                 1,880      1,860    -1.1%
pumped storage          2,724      2,900    +6.5%
hydro                     602        600    -0.3%
OCGT                    2,380      3,400   +42.9%
IPP capacity            8,565      8,483    -1.0%
```

**Nuclear and hydro within 1.1%.** Three points need care, and the first was an error of
mine.

### the figures are as at 31 march 2026 — and I did not check that

The integrated report covers the year ended 31 March 2026, so every capacity above is a
year-end snapshot. Two consequences:

- Kusile Unit 6 reached commercial operation on 29 September 2025, inside FY2026, so its
  799 MW is already in the 39,692. Nothing to add. Note the fleet only grew 46,866 ->
  47,378, **+512 MW against Kusile's +799**, so roughly 287 MW was retired or derated in
  the same year and Eskom does not itemise it here.
- The model's renewable register runs to 30 june 2026 (PFL H1). Three months of additions
  sit on one side of the comparison and not the other. Small for the base case, but it is
  a real date mismatch and it should be stated whenever these are lined up.

### my "IPP within 1%" claim was a universe mismatch — corrected

Eskom's 8,565 MW is all IPPs selling through NTCSA. Compared like for like:

```
IPP total                              8,565
less OCGT peakers Avon + Dedisa       -1,005
less REIPPPP hydro, biomass, LFG         -51
= IPP variable renewables + CSP        7,509

GridTwin wind + pv + csp               8,483      +974 MW, +13.0%
```

So the model looked 13% high, not 1% low. **But the 974 MW is almost exactly the private
wheeled block**: `by_source.private` holds 958 MW. Residual 16 MW.

**privately wheeled plant sells to corporate customers, not to eskom, so it correctly
does not appear in Eskom's IPP figure at all.** The gap is not an error in either source
— it is the two universes, and it reconciles to 16 MW once named.

This is what the `by_source` tagging bought. Without it the 974 MW would have looked like
a 13% overstatement with no way to decompose it, exactly as the opaque total once hid a
badly derived `windMW`.

Two further gaps explain themselves:

**OCGT is not a discrepancy.** Eskom's 2,380 MW is eskom-owned only. Adding the IPP
peakers Avon 670 and Dedisa 335 gives 3,385 MW against the model's 3,400 — a 0.4% match.
Different universe, not a different number.

**coal was a compensating error, and is corrected.** 42,000 is the widely-cited nameplate
figure; Eskom's audited nominal is 39,692. The model produced the right coal energy from
too large a fleet at too low a utilisation:

```
implied capacity factor    before 45.1%    after 47.7%    Eskom 47.6%
coal energy                166.0 TWh       165.9 TWh      165.4 TWh
```

Correcting the capacity moves the capacity factor onto Eskom's almost exactly and changes
energy by 0.1 TWh, because coal here is demand-limited rather than capacity-limited. **It
matters for scenarios, not the base case**: anything moving the availability factor or
decommissioning plant was working off a fleet 5.8% larger than Eskom operates. The
decommissioning slider max moved 42,000 -> 39,692 with it.

### three things the suite caught, all worth recording

**1. My edit swallowed two constants.** The original line read
`coalInstalledMW:42000, nuclearMW:1860, hydroMW:600,` on one line, and my inserted comment
block absorbed the other two into itself. `nuclearMW` and `hydroMW` became undefined, and
the suite collapsed — benchmarks 3/20, response 2/81. Lint passed, because the syntax was
valid. Only the behavioural harnesses caught it. **A multi-line comment inserted before a
constant is only safe if you check what shares its line.**

**2. Rule 6, exactly as written.** `validate_structure` flagged
`coalInstalledMW ?? 42000` the moment the constant moved — a fallback that differs from
Fixed is a latent wrong answer waiting for the resolution to change. It waited, and the
check caught it.

**3. A round-trip check that was structurally incomplete.** The fleet-collapse scenario
reported a storage round trip of 1.053 — energy from nowhere. It is not: the engine is
Not state-of-charge cyclic. Storage opens at 70% for pumped and 50% for batteries, so
over a year it can legitimately discharge more than it charges by the opening stock it
never replaces. The check guarded on charge volume, a proxy; it now compares discharge
against charge plus opening stock. If the engine is ever made SOC-cyclic, that allowance
should return to zero.

---

## Eskom Green build pace added — 31 Aug 2026

A fifth pace, and the only one that is an operator's own plan rather than a policy target
(IRP, masterplan), a historical record, or a physical limit (grid).

```
pace          wind+solar MW/yr   storage   gas   RE by 2030
historical                 550       100   200      2.8 GW
eskomGreen               1,500       786   600      7.5 GW
irp                      3,700       550 1,200     18.5 GW
masterplan               4,500     1,150 1,200     22.5 GW
grid                     8,300     4,800 2,000     41.5 GW
```

It lands between historical and IRP, which is where a single builder should sit.

From the published milestones: 32 GW renewables and storage by FY2040 over FY2027-40 =
2,286 MW/yr; gas 1,500 MW by FY2029 to 3,000 MW by FY2031 = 600 MW/yr. The assumed split
sums to 2,286 exactly.

### two caveats carried in the note, because neither is inferable from the number

**1. the technology split is not published.** Eskom gives a combined "renewables and
storage" figure. The split is weighted toward solar and storage because the named
repowering sites — Komati, Grootvlei, Camden, Hendrina — are Mpumalanga coal sites with
strong solar and weak wind. A reasonable inference, not Eskom's statement, and the first
number to challenge.

**2. it is a floor on the national build, not a forecast of it.** Every other pace is
national; this is one participant. IPPs added 8,565 MW to 31 March 2026 against Eskom's
own 100 MW of wind. Selecting it models a world where only Eskom builds, which will not
happen — the value is as a lower bound and as a test of whether Eskom's own plan is
adequate on its own.

Two `audit.py` checks pin the pace and the floor-not-forecast caveat (41 -> 43).

## coalEAFPct: four literals, no constant, and the wrong value — 31 Aug 2026

Going to add a demand-trend note, I found `coalEAFPct` had **no `FIXED` entry at all**.
The quantity existed as the slider default plus six `?? 68` fallbacks — seven copies of
one number with no source. Rule 6, in the largest instance found so far.

**and 68 was wrong.** It was the part-year "FY2026 to date" figure; the audited outturn
is 65.16%. Part-year EAF is biased because availability is seasonal, and it overstated
the full year by three points. `FIXED.coalEAFPct` is now 65 and every site reads it.

Coal energy lands at 165.5 TWh against an audited 165.4, at the audited availability
rather than by accident.

Two of the seven were written `coalEAFPct??68` with no spaces and survived the first
replacement. `validate_structure` caught them. A textual replacement across a 1 mb file
needs the harness, not care.

### the change exposed a real defect — recorded as a standing flag, not relaxed

`validate_consistency` now fails one check: storage delivers 0 MW at the annual peak
while adequacy counts it as firm capacity.

```
peak hour 3834, 31,595 MW
  EAF 68%   coal 26,991 · pumped storage 1,465 · diesel    47
  EAF 65%   coal 25,365 · pumped storage     0 · diesel 3,138
```

Pumped storage runs flat out at 2,900 MW for the three hours before the peak and arrives
empty, so diesel covers the worst hour of the year. **Lower availability did not create
this — it exposed it.**

Cause: the same missing value function as the storage LP work. The heuristic discharges
whenever there is a deficit, with nothing reserving energy for the annual peak. Two
ordering fixes were tried and reverted on 30 Aug, so a third improvised attempt is not
warranted.

**~~it stays red deliberately.~~ fixed the same day — see below.**

---

## Pumped storage peak reservation — fixed 31 Aug 2026

The standing flag is closed. `validate_consistency` back to 17/17, suite green.

```
scenario           ps at annual peak MW        unserved GWh
                   before        after      before      after
today                   0        2,331         5.5        5.5
EAF 55              2,900        2,900       619.5      528.1
crisis 2023             0        2,900    13,413.0   13,089.2
```

**At the audited availability, pumped storage now delivers 2,331 MW at the annual peak
instead of zero**, and diesel at that hour falls from 3,138 MW to 807. Annual pumped
output is unchanged at 3.43 TWh — the same energy, spent at better hours.

It is strongest where it matters most: in the 2023 crisis scenario it moves 0 -> 2,900 MW
at the peak and cuts unserved energy by 324 GWh. At 55% availability, 91 GWh.

### the rule, and why this is not the third failed heuristic

Do not spend energy now that a tighter hour within the store's own duration will need.
For each hour, sum the deliverable energy required by future hours whose gap exceeds this
one's, and hold that much back. Horizon is the store's own duration — a 20-hour asset
cannot hold energy for a peak further out than that anyway.

**This is a different problem from the two reverted attempts on 30 Aug.** Those were
about which chemistry gets charged, where the comparison is between assets and needs a
value function to resolve. This is about when one store discharges, where the comparison
is against a known future deficit in the same series. That is why a simple rule works
here and did not there.

The floor is the greater of the ancillary holdback and the peak reservation, so it
composes with the existing `_asHold` rather than overriding it.

Caveat: perfect foresight of the deficit series, like everything else in this engine. A
real operator forecasts. And it does not fix the battery tiers — the long-duration
allocation problem is untouched and still needs the LP.

`audit.py` pins it (43 -> 44).

---

## A real bug in hybridUplift, found by bounding not by reading — 31 Aug 2026

Assembling the storage summary produced a 74% co-location uplift at today's build against
a price spread of R14/MWh. Inconsistent on its face, so I bounded it.

**test: 100 MW plant, 50 MW / 200 MWh battery, 24 rising prices R400-R2,240.** The
battery can move at most 200 MWh a day; across the day's R1,840 spread that caps the
uplift at R153/MWh. The function returned **R199**.

**the fault:** the greedy tracked `soc`, which after each matched charge/discharge pair
returned to exactly its starting value — `take*eff - give == 0` by construction — so the
`(E - soc)` capacity cap never bound and the battery cycled without limit within a day.

Fixed with an explicit daily energy budget: `moved` accumulates charge energy and stops
at one full cycle. Now R113 against the R153 bound.

### what this does and does not affect

- **The capture-rate panel's hybrid column used the faulty function.** Its figures have
  moved and are now physically bounded.
- **results.md's hybrid table did not** — that came from `hybrid.js`, the full-year
  price-taker LP, which is a different implementation and correctly capacity-constrained.
- **The greedy-vs-LP validation was re-run 31 Aug and holds**: within 4.7% across twelve
  cases, conservative in eleven. The panel's numbers can be quoted again.
- **But re-running the LP changed the published hybrid finding.** results.md now reports
  a U-shape, not a rising curve — see below.

### the lesson

The bug produced a plausible number. Nothing in the suite caught it, no review would have
caught it, and I had already "validated" the function against an LP and recorded it as
within 4.5%. **What caught it was asking what the asset can physically move and comparing
the answer to that.** For any heuristic that trades energy, compute the bound first.

---

## The hybrid finding was wrong in shape, not just level — corrected 31 Aug 2026

Re-running the LP with the audited constants overturned a published conclusion.

```
solar uplift from a 100%-of-plant battery
  as published        2026   +6%      2030   +8%      2035  +408%
  corrected           2026 +130%      2030   +8%      2035  +386%
```

**The value is U-shaped, not rising.** Co-location is worth a great deal now, very little
in 2030, and a great deal again by 2035.

Arbitrage pays for volatility, and volatility has two different causes at the two ends.
2026 is volatile from scarcity — coal sets the price most hours, diesel sets it in the
tight ones. 2030 is comfortable, with storage built alongside 41 GW of vre, so spreads
collapse. 2035 is volatile from surplus — midday solar worth nothing, evening scarcity
back.

**why the original was wrong:** it was measured before today's corrections. Coal capacity
5.8% too high, imports more than double reality, availability three points optimistic —
together they suppressed the scarcity pricing that co-location monetises, so 2026 looked
flat when it is not.

**the consequence for advice is the opposite of what I wrote.** "Storage becomes valuable
later" is wrong. It is valuable now for one reason, briefly less so, then valuable again
for the opposite reason — and the two are not the same trade or the same financing case.

This is the clearest demonstration yet of why the calibration work matters: three
constant corrections, none individually dramatic, inverted a headline conclusion.

---

## Audit: do the other published findings survive the corrections? — 31 Aug 2026

The hybrid U-shape showed that three constant corrections could invert a conclusion, so
the headline findings were re-run rather than assumed. **All four hold.**

```
finding                        direction   published level    corrected level
iron-air on winter drought         HOLDS   2,815 both ways    3,964 both ways
coal flexibilisation worsens       HOLDS   14,078 -> 15,206   15,204 -> 16,622
capture asymmetry                  HOLDS   wind 96-106%       wind 98%
demand response optimum            HOLDS   7.5%, reverses     7.5%, reverses
```

**iron-air is the strongest.** July gas is identical to the megawatt-hour with and
without 20 GW of iron-air, exactly as before. The level rose 41% with the corrections and
the finding did not move at all.

**coal flexibilisation** keeps its direction and roughly its magnitude: the penalty was
+1,128 GWh and is now +1,418.

**capture asymmetry** — re-run properly 31 Aug against the published scenario (no
storage, same build points). **It holds**: wind 96-107% across the range, solar falls to
2.7% against a published 2.5%, and four of five rows reproduce within two points.

But the first row moved. Today's fleet was published at 98.4% solar capture against a
R755 mean; it now reads 75.7% against R999. The corrections revealed scarcity pricing the
old constants suppressed, and the new expensive hours are evening hours when solar does
not produce. **Solar already earns a quarter below the market average today**, before any
cannibalisation from new build — the published version showed near-parity and understated
the starting point.

### and a mistake of mine that the file's own rule caught

I first re-tested demand response by sweeping `drShiftPct` in a no-gas scenario measuring
Unserved energy, and got a monotonic improvement with no optimum. I was one step from
recording that the finding had broken.

It had not. The published result was measured on the dashboard scenario against average
Cost. Re-run as published, it reproduces exactly.

**"A number without its scenario is not a result" is the first line of results.md**, and
it exists for exactly this. It protected the finding from its own author re-testing it
carelessly. Any re-verification must reproduce the original scenario and the original
metric, or it is testing something else.

---

## Merchant value trajectory re-run — solar unchanged, wind not — 31 Aug 2026

```
grid pace          published        corrected
solar 2026-2035    743 -> 133       756 -> 139      -82% both
wind  2026-2035    758 -> 313       977 -> 323      -59% -> -67%
```

**solar is unchanged** across all three paces: -16%, -26%, -82%, exactly as published.
**wind's starting point moves 29%**, from R758 to R977, and its decline steepens.

Same cause as the capture and hybrid corrections: the model now prices evening scarcity,
and wind produces in those hours while solar does not. Wind therefore starts 29% above
solar today, where the published version had them within 2% of each other.

**this changes the advice.** A wind project's merchant case is stronger today than
published and erodes faster; a solar project's was always weaker and erodes on the same
path. The published version made them look like near-identical assets facing different
futures. They are different assets today.

### pattern across the whole re-audit

Four findings re-run after the constant corrections. Every one holds in direction. Three
moved in level, and all three moved for the same reason: the model previously had too
much capacity, too many imports and too generous availability, so it could not see the
evening scarcity South Africa actually prices.

```
iron-air winter drought     unchanged in every respect
demand response optimum     unchanged in shape, level +2.6%
capture asymmetry           holds; TODAY's solar capture 98.4% -> 75.7%
hybrid uplift               holds at 2035; TODAY's uplift +6% -> +130%, shape now U
merchant trajectory         solar unchanged; WIND +29% at the start
```

The corrections were three constants and none was individually dramatic. Together they
changed what the model says about the present, while leaving what it says about 2035
almost untouched. **Anything anchored on today's prices needed re-running; anything
anchored on a future build did not.**

---

## The full model now prices its own solution — 31 Aug 2026

**the problem, found by asking whether every box updates.** `runMIP` called `render()`,
which refreshes one panel. The normal slider path calls `run()`, which refreshes fifteen.
Measured: changing the result and calling `render()` alone updates 1 of 28 panel bodies;
`run()` updates 8.

So after "Run the full model" the KPIs, energy mix, dispatch chart and map showed the MIP,
while the shadow price, capture rate, capture forecast, capacity payments, both battery
panels and the comparison kept showing heuristic output — with nothing on the page saying
so. The banner claimed the KPIs were network-aware and was silent about everything else.

The code knew: `mipRes` carried `pricesFromInstant: true` with a comment warning that
panels reading those prices "must say which engine they are showing". **The flag was set
and never read.**

### the fix: A pricing run, which is what real markets do

A MIP has no duals — integer commitment makes it non-convex. The standard answer, used by
Ercot, pjm and miso, is to fix the commitment binaries to the MIP's own solution and
re-solve the remainder as an LP. That problem is convex, so its duals exist and are
Consistent with the commitment chosen.

`buildDayLP` takes a `fixedOn` argument: supplied, it pins each commitment via its bounds
and emits no Binary block. The worker solves it per day, reads the duals off the regional
balance rows, and returns `mipPrice`.

The price-derived panels are now refreshed from the MIP result, each wrapped so one
failing panel cannot discard an expensive solve. The banner reports coverage — how many
of 8,760 hours carry a real dual — and says the rest keep heuristic prices.

**zero means absent, not free.** A day that failed to solve, or whose dual mapping did not
verify, leaves zeros; those hours keep the instant price rather than reporting R0, which
is a real value in a curtailed hour and must not be faked.

Caveat carried in the code: fixed-commitment prices do not recover start-up costs, which
is exactly why real markets pay uplift on top. Same distinction the model already draws —
start-up is in the system cost, not in the price.

### and a trap in the file's own structure

`buildDayLP` lives inside a worker template literal. My comment used backticks around an
identifier, which terminated the literal and broke the page — `validate_solve` reported
"page errors during load: Unexpected identifier". Lint passed, because the file is still
valid HTML. **Never put a backtick in a comment inside the worker block.**

---

## The pricing run, verified — 31 Aug 2026

The day MIP runs inside a Web Worker, which every harness stubs out, so the pricing run
shipped earlier today **had never been executed**. `price_test.js` extracts `buildDayLP`
from `index.html` and exercises both solves directly against HiGHS.

```
MIP                    Optimal · commitment recovered 24/24 and 1/24 hours on
fixed LP               Binary block correctly ABSENT
pricing run            Optimal · 283 rows returned, 283 names parsed, MATCH
duals                  24 of 24 hours
off-peak hour 03       R608/MWh against a marginal cost of R600
peak dearer than off-peak   true
```

**It works.** The off-peak price lands within 1.3% of the marginal unit's cost, which is
what a shadow price on an energy balance should give.

### two things the test taught, both about the test rather than the model

**A shed hour prices at the slack cost, and that is correct.** The first run showed
R25,842 at an off-peak hour, which looked like nonsense. It was not: that scenario could
not serve region 1, so unserved energy set the price at the R50,000 slack cost, and the
average across two regions landed between. The dual was right and the scenario was
infeasible. A price far above any unit's marginal cost is the model saying it is shedding.

**Extraction from a worker template literal needs unescaping.** `buildDayLP` lives inside
a template literal, so its `\n` are still doubled in the raw file text. Extracted
verbatim, every LP came out with literal backslash-n and HiGHS returned `Empty` with no
diagnostic. Same trap as the backtick that broke the page: **the worker block is not
ordinary source and cannot be read as though it were.**

### what is still not verified

This tests the mechanism on a two-region toy day. It does not establish coverage — how
many of 8,760 hours get a dual in a real run, which depends on how many days solve within
the 25-second limit. The banner reports that figure at run time, so the honest position is
that the machinery is proven and the coverage is observable but unmeasured here.

---

## Battery saturation re-run: the knee moved, and it matters for the submission

```
fleet     ancillary R/MW/yr   as published
0.5 GW           197,100          197,100    exact match
3   GW           167,345          197,100
10  GW            50,204           69,305
knee            ~2.5 GW           ~3.8 GW
fall              74.5%            64.8%
```

**south africa is already past the knee, not approaching it.** Existing fleet 3,700 MW
against a knee near 2,500. The published version said the country sat "almost exactly at
the knee" and called 3,700 MW "the last point at which a new battery earns the full
ancillary rate". Both are one revision out of date — a battery built today already earns a
Reduced rate.

Cause: the reserve rebuild of 30 Aug consolidated the battery panel's duplicate reserve
constants onto the unit commitment's definition and cut the requirement ~30%, from 1,768
to 1,263 MW. A smaller requirement saturates with a smaller fleet.

**this bears on the EPP submission**, which used the shrinking-ancillary-pot argument
under Policy Position 9. The direction is unchanged and the force is greater — the pot is
smaller and shrinking sooner than the submission stated. Nothing filed is wrong; it is
understated. Worth a line if there is any follow-up correspondence.

### and I nearly reported A 60% error that was mine

The first re-run showed ancillary at 78,840 against a published 197,100 and I was about to
record a large discrepancy. The ratio was exactly 60/150: I had set `asReserveRMWh` to an
arbitrary 60 while the published run used the fixed default of 150. Scaled back, the
match was exact to the rand.

**Third time today** that re-testing a finding in a scenario other than the one it was
measured in nearly produced a false correction. The pattern is now unmistakable: reproduce
the original scenario and the original metric, and check the ratio before believing a
level shift.

---

## validate_findings.js — the findings, re-run against their own scenarios

Built 31 Aug 2026 after three near-miss false corrections in one session, every one from
re-testing a published result in a scenario other than the one it was measured in:

```
demand response     swept in a no-gas system measuring UNSERVED; published on the
                    dashboard measuring AVERAGE COST. Looked broken. Was not.
battery saturation  run at an arbitrary reserve price of 60 against a published default
                    of 150. Showed a 60% error. Was exactly the ratio.
capture asymmetry   run WITH storage against a published run with none.
```

Results.md opens with "a number without its scenario is not a result". **That rule lived
in prose, and prose does not run.** This encodes the scenario next to the number, so a
re-check cannot silently test something else.

Four findings, seven checks, all passing:

```
iron-air       July gas 3,964 -> 3,964 GWh with 20 GW of iron-air
demand resp.   R585 at 0% · R580 at 7.5% · R613 at 30%
capture        wind 97% · solar 2.7%, NO STORAGE
ancillary      knee ~3.0 GW against a 3.7 GW fleet, reserve price R150/MWh
```

Tolerant by design. The point is not to freeze values — the calibration work moved
several legitimately today — but to catch a finding whose direction or shape has changed
without anyone noticing.

### verified it can fail, twice

Neutralising `drShiftPct` gives 5/7 with both demand-response checks failing and the
scenario named in the message.

Setting iron-air round-trip efficiency to 95% did not break its check — a 0.9% change
against a 1% tolerance. That is not the check being loose: **even a 95%-efficient
long-duration store barely touches July gas**, which is the finding being more robust
than its own headline claims.

---

## Locational transmission signal re-verified — 31 Aug 2026

The finding that carried most weight in the EPP submission, re-run as published: default
scenario, masterplan build pace, regional build LP, duals on the `hw_`/`hp_` headroom rows
in the final year.

```
solve                    813 s · Optimal
rows parsed / returned   119,225 / 119,225 · MATCH  (exactly as published)
wind dual, highest       3,571,840   (published 11,046,170)
wind dual, lowest non-0     53,841   (published    228,814)
spread                          66x  (published        48x)
```

**the spread holds and is larger.** The submission described a "fiftyfold spread" in
measured shadow prices under Policy Position 20. It is now 66-fold. **Nothing filed is
wrong and the argument is stronger.**

Levels fell about threefold, which is consistent with the constant corrections: a system
with less coal capacity, fewer imports and lower availability values an extra megawatt of
connection headroom differently. The ratio between regions is the claim, and ratios
survived.

The row-count match reproducing exactly — 119,225 both ways — is the check that the dual
mapping is sound, and it is the same number as on 29 Aug.

### not verified here

My probe did not recover region names from the builder's row objects, so the sharper half
of the finding — that the optimiser builds the most wind where the resource is worst —
is untested by this run. The duals are per region index only. Re-running with names
resolved would close it.

### A note on cost

This single verification took 813 seconds of solve plus about twenty minutes of setup,
against roughly two minutes for each of the dispatch-based re-runs. The build LP is a
different class of check. `validate_findings.js` deliberately covers dispatch findings
only for that reason — a harness nobody runs because it takes fifteen minutes protects
nothing.

---

## The board said Stage 3 beside 0 GWh — 31 Aug 2026

Reported from the live site: the dashboard showed the country load shedding under the
Today scenario. **The board was contradicting itself, and the model was fine.**

```
shortage hours        5 of 8,760      0.06% of the year
total unserved        5.463 GWh       0.003% of demand
worst hour            2,055 MW short  -> stage 3
Eskom FY2026 audited  36 GWh          0.02% of demand
```

**the model is six times more optimistic than reality**, not pessimistic. The corrections
of 31 Aug — coal capacity down 5.8%, imports down 52%, availability down three points —
moved unserved energy from ~0 toward Eskom's audited outturn. That is an improvement in
realism. The display was not ready for a non-zero number.

### three display faults, all the same mistake

**1. System status keyed on `maxStage` alone.** One bad hour in 8,760 flipped the whole
board to "Stage 3". Now carries frequency: `Stable` at zero, `Tight hours` under 0.05% of
hours, `Constrained` under 1%, and a stage number only above that. Today reads
**Constrained**; the 2023 crisis scenario still reads Stage 8 at 4,032 shortage hours, and
a no-coal-no-gas system still reads Stage 8 at 8,760.

**2. Expected shed rounded anything under 1 GWh to a hard "0 GWh".** 5.5 GWh became zero,
which is what created the visible contradiction. Now shows one decimal below 10 GWh.

**3. The lamps had no frequency at all.** They still show the worst hour, because that is
what the label says, but the cell now carries a tooltip stating how many hours of 8,760
fall short. **A peak with no frequency beside it is not a measurement anyone can act on.**

### the general lesson

A dashboard that rounds a real number to zero to stay tidy will eventually contradict
another cell that did not round. The contradiction is the useful signal — it was visible
on the live site within hours, and it pointed at a display fault rather than the
calibration work that exposed it.

---

## Board audit: my own fix created the next contradiction — 31 Aug 2026

Auditing the rest of the headline cells after the Stage 3 fault found two more things.

### 1. I fixed the rounding in one place of three

The board cell now read **0.1 GWh** while the risk panel beneath it still read **0 GWh** —
a new contradiction, created by the fix for the old one, within the hour.

Cause: `meanShed < 1 ? '0' : ...` appeared three times with two different roundings. Now
one `_shedFmt` used at all three sites. **Rule 6 applies to display logic as much as to
constants:** a number formatted two ways in two places will eventually disagree, and the
first fix is what exposes it.

### 2. the board mixes two weather bases, and said nothing

```
deterministic run (lamps, status word)     5.5 GWh unserved
Monte Carlo ensemble mean (expected shed)  0.1 GWh
```

**Fiftyfold apart, and it is not risk — it is weather basis.** The deterministic run uses
the default profile, whose wind series is the Eskom metered feed rescaled. The ensemble
substitutes real weather years drawing MERRA-2 based wind, and state.md already records a
documented bias between the two.

So the two cells are legitimately different quantities, sitting side by side with nothing
saying so. **That is the same fault as Stage 3 beside 0 GWh** — not a wrong number, but
two right numbers presented as though comparable.

Stated, not reconciled. Changing which weather the ensemble draws would move every figure
in the risk panel, and that is a decision rather than a fix. The cell now carries a
tooltip naming the difference and its rough size.

**to do:** decide whether the deterministic run and the risk ensemble should share a
weather basis. If they should, the deterministic run is the one to change — the ensemble's
ten real years are better evidence than one rescaled series.

### curtailment is honestly zero

Checked, because it was the obvious next candidate for a rounding artefact: the underlying
value is 0.0000 TWh, so "0.0 TWh/yr" is accurate rather than rounded-down.

---

## Why "Constrained" under Today — a real dispatch bug, located 31 Aug 2026

Asked why the board shows the system constrained. The five shortage hours are not a
capacity problem. **Coal is dispatched roughly 7 GW below its own availability while the
system sheds load.**

```
 hour  time    load    coal     pv   wind  short
  493 13:00  25,978  19,106  1,470  1,436      0
  494 14:00  26,868  19,106    987  1,575      0
  495 15:00  27,555  19,106    495  1,654      0
  496 16:00  28,045  17,906     99  1,704  2,055   <- coal FALLS as demand peaks
  497 17:00  27,107  17,906      0  1,689  1,202
  499 19:00  26,566  17,906      0  1,246  1,170
  500 20:00  25,868  18,594      0  1,031      0

coal available all day: 25,800 MW. Highest coal reached: 19,765.
```

**coal goes down as demand goes up.** That is backwards, and it happens on 21 January -
summer, at 60% of the annual peak. At the actual June peak of 31,595 MW coal runs 25,365
and there is no shortage at all, so the fleet can clearly do it.

### what it is not

- **Not the pumped-storage peak reservation added earlier today.** Disabling it gives
  identical results: 5 hours, 5.463 GWh, stage 3.
- **Not capacity.** 25,800 coal + 3,400 diesel + 2,900 pumped + 472 imports + 1,700 wind
  is about 34 GW against a 28 GW load.
- **Not the constant corrections.** They raised the shortage from ~0 toward Eskom's
  audited 36 GWh, which is a realism gain. The dispatch fault below is separate.

### the suspect, narrowed

Coal holds flat in four-hour blocks - 19,106 for 492-495, then 17,906 for 496-499 - so the
level is set by `committedMW` around index.html:5446, not by the hourly ceiling. Outside
the 09:00-15:00 solar window `solarAwareNeed` is `need24`, the maximum net load over the
next 24 hours, which at 16:00 should be about 26,242 MW and would commit the full 25,800.
It commits 17,906 instead.

So either `need24` is not seeing that hour, or a decommitment floor from the preceding
solar window is holding the block down. `rampBuffer` is 15% of the trough-to-night swing,
which on a strong summer solar day may be too small to get back up.

### diagnosed — it is a seeded outage draw, not a dispatch fault

Instrumented the commitment terms. The chain, in order:

```
solarAwareNeed at 16:00      24,189 MW   correct - it wants the capacity
unit commitment committed    25,611 MW   correct - the UC committed nearly everything
cAvail seen by dispatch      17,906 MW   45.1% of installed, against a 65% EAF mean
```

The commitment logic is right and was never the problem. `cAvail` is capped by
`unitOutage`, a seeded unit-level Markov outage path that is **on by default**
(`outageUnitLevel ?? 1`, `outageSeed 20260816`). Hour 496 lands in a deep outage draw.

### the shipped seed is the worst of ten tested

```
seed 20260816 (shipped)   5 hours   5.46 GWh   stage 3
seed 1, 3, 5, 7, 8        0 hours   0.00 GWh   stage 0
seed 2                    2 hours   0.57 GWh   stage 1
seed 4                    3 hours   2.09 GWh   stage 2
seed 6                    4 hours   1.49 GWh   stage 2
seed 9                    4 hours   2.64 GWh   stage 2
smooth derate (off)       0 hours   0.00 GWh   stage 0

range 0.00 to 5.46 GWh · median 0.28 · HALF the seeds shed nothing
```

**the base case is one random draw presented as the answer**, and it happens to sit at
the tail rather than the middle. That is the real fault, and it is the same class as
everything else found today: a number shown without the uncertainty that generated it.

### three options, and this is a decision rather than a fix

1. **Change the seed.** Cheapest, and dishonest - it hides the variance rather than
   showing it.
2. **Headline the median or expected outcome**, with the draw available underneath. Most
   informative, and the biggest change to how the tool behaves.
3. **Say what it is.** Keep the draw, and state on the board that the base case includes
   one seeded outage path with a stated range. Smallest change, and consistent with how
   this project handles every other uncertainty.

**done 31 Aug 2026 — option 2, the median.** See below.

Note for context: Eskom's audited FY2026 outturn was 36 GWh unserved. Every seed above,
including the worst, is more optimistic than what actually happened.

---

## Adequacy ensemble: the board is now a median, not a draw — 31 Aug 2026

The board headline came from one seeded outage path, and that path was the worst of ten
tested. It now reports the median of nine draws.

### sized before building — only adequacy needed it

```
metric          spread across seeds
unserved GWh              1,916%     <- ensemble
max stage                   600%     <- ensemble
diesel TWh                  112%     <- ensemble
coal TWh                      0.2%   single draw is fine
CO2 Mt                        0.1%
avgCost                       1.2%
```

Energy and cost are effectively seed-independent, so the ensemble covers the adequacy
headline and nothing else. Nine draws rather than sixty because it must not slow a slider
drag, and odd so the median is a real draw rather than an average of two.

```
scenario       status        median          range
today          Stable        0 hrs, stage 0  0.00-5.46 GWh
EAF 58         Stage 5     104 hrs, stage 5  41.97-239.79 GWh
crisis 2023    Stage 8   3,903 hrs, stage 8  9,929-13,089 GWh
```

**Today reads Stable**, which is what five of ten seeds and the smooth-derate control all
gave. The escalation still works where it should.

### weather is held fixed, deliberately

Unlike the 60-year risk panel, which varies weather and outages, this varies outages only
on the scenario's own weather. It answers one question — how much of the shed is the draw?
— and stays consistent with every other panel on the page.

### A race I created and then removed

Both the risk Monte Carlo and the new ensemble wrote `bdShed`, and whichever finished last
won. That put a 60-year weather-and-outage mean in a cell beside a status word derived
from the scenario's own weather. **One owner per cell:** the ensemble owns the board, the
Monte Carlo keeps its mean in the risk panel where it is labelled.

### on the eskom comparison — I was right for the wrong reason to be confident

Checked footnote 4 of the energy balance: the 36 GWh is *"an estimate by the System
Operator based on forecast versus actual demand"*, so it is generation-side load shedding
and curtailment. The distribution-level problem is **load reduction**, which Eskom reports
separately and has eliminated in seven provinces. The comparison stands - but it was worth
checking rather than repeating.

---

## The median was the wrong statistic — corrected the same hour, 31 Aug 2026

Asked whether the median ensemble was a good-enough solve. **It was not, and the reason
matters more than the fix.**

```
ten measured seeds, unserved GWh
  0.00 0.00 0.00 0.00 0.00 0.57 1.49 2.09 2.64 5.46

  median  0.28 GWh   <- what the board reported
  MEAN    1.23 GWh   <- four times higher
  5 of 10 draws shed something
```

**A board reading "Stable" off the median understated exactly as badly as the single draw
overstated.** The median of a distribution with half its mass at zero is near zero, however
bad the other half is - and adequacy is a tail question.

### now on the standard planning metrics

Both are expectations, which is what a skewed distribution needs and what a planner
recognises:

```
LOLE   loss of load expectation   expected HOURS short per year
EUE    expected unserved energy   expected GWh short per year

scenario       status         LOLE h/yr      EUE GWh   draws shedding   worst draw
today          Tight hours          1.4         1.27         44%        stage 3, 5.46
EAF 58         Constrained         94.0       119.29        100%        stage 6, 239.79
crisis 2023    Stage 8          3,883.9    11,610.51        100%        stage 8, 13,089
```

Status keyed on LOLE with stated thresholds so they can be argued with: under 1 hour a
year is a system that does not shed, up to 24 is the criterion older South African
planning has used, beyond 200 it is shedding. The lamps show the worst draw, matching
their own label, while the status and shed cell report expectations.

**Today reads "Tight hours", LOLE 1.4 h/yr, EUE 1.27 GWh, 44% of draws shedding.** That is
the honest description: not a system in crisis, not a system with nothing to watch.

### the lesson, which is the third of its kind today

One draw overstated. The median understated. Both were single numbers standing in for a
distribution. The fix was not a better point estimate but reporting the distribution -
expectation, spread, and share of draws affected - which is what the tooltip now carries.

---

## Draw count set by measurement, not assumption — 31 Aug 2026

Asked what else was worth doing. The obvious candidate was my own claim that nine draws
was thin. **Measured rather than asserted, and it was much worse than thin.**

```
cost                 54 ms per draw   (I had assumed ~250)
standard error at  9 draws            75% of the mean
standard error at 30 draws            41%
EUE across sample sizes 3 to 48       wandered 0.74 to 2.10 GWh, no convergence
sd 3.83 against mean 1.71             a heavy tail: most draws shed nothing, a few a lot
```

Nine was chosen for a speed cost that turned out to be eight times smaller than assumed.
**Raised to 48**, about 2.6 s async, which brings the standard error to roughly a third
of the mean.

### the larger sample found a heavier tail

```
                 9 draws        48 draws
draws shedding      44%             65%
worst draw     stage 3, 5.46   stage 4, 18.63 GWh
EUE                1.27            1.71 +/- 0.55
```

Nine draws had not seen the tail at all. The worst case is more than three times larger
than the sample suggested, which is exactly what a skewed distribution does to a small
sample.

### it still does not converge, and the board says SO

Closing the gap properly needs hundreds of draws. Rather than pretend, the tooltip now
carries the standard error: "EUE 1.71 GWh, standard error +/- 0.55". A reader who sees
that knows not to quote 1.71 to three figures.

**That is the same correction as the two before it.** One draw was a point estimate. The
median was a point estimate. The mean is also a point estimate - the difference is that it
now arrives with its own uncertainty attached.

### for context

Eskom's audited FY2026 outturn was 36 GWh. The worst of 48 draws is 18.63 GWh, so the
model remains optimistic against what actually happened even at its tail.

---

## Weather basis reconciled, and the ensemble finally has a harness — 31 Aug 2026

### 1. the board was answering a narrower question than its label

Decomposed the uncertainty on the default scenario, 30 draws each:

```
outage varies, weather FIXED      EUE 1.43 GWh   LOLE 1.8 h    <- what the board did
outage AND weather vary           EUE 2.23 GWh   LOLE 2.9 h    <- 56% higher
weather varies, outage fixed      EUE 6.76 GWh   LOLE 8.3 h
```

**Weather is the larger driver**, and holding it fixed understated the risk by about a
third. The board now varies both, which also puts it on the same basis as the 60-year
risk panel below - the two were previously measuring different things on the same page,
which was the original complaint.

Weather years are cycled deterministically so each of the ten is drawn equally; with only
ten on record, random sampling over 48 draws leaves the spread lumpy.

```
today now reads   LOLE 3.0 h/yr · EUE 2.36 +/- 0.73 GWh · 63% of draws shed
                  worst draw stage 5, 28.56 GWh
```

It degrades gracefully: if the multi-year weather file does not load it reports outage
risk alone and the tooltip says so.

### 2. eight new checks in validate_consistency (17 -> 25)

The ensemble had no coverage, and the pricing run earlier today showed exactly what
happens to code that ships without a harness ever executing it.

```
the ensemble and its board hook both exist
the shipped draw count is large enough to be worth averaging   ADEQ_N >= 24
[today/tight/crisis] metrics are finite and non-negative       a NaN renders as a blank
expected unserved energy rises as coal availability falls      monotonicity
LOLE rises as coal availability falls
expected unserved energy sits below the worst draw             a mean over the wrong array
```

The checks assert properties rather than pinning values, because the values legitimately
move with the draw. Monotonicity is the load-bearing one: it is what breaks if the
ensemble ever averages the wrong thing.

Verified it can fail: setting `ADEQ_N` back to 9 fails the draw-count check with the
measurement quoted in the message.

---

## Five lamps under Today: my ensemble broke the label — 31 Aug 2026

Reported from South Africa: the board looked jarring during the best run of supply in a
decade. **The numbers were right and the display was not.**

```
GridTwin, 48 draws        LOLE 3.0 h/yr · EUE 2.36 GWh · 38% of draws entirely clean
Eskom FY2026 audited      36 GWh unserved · 365 consecutive loadshedding-free days

the model is 15x MORE OPTIMISTIC than the year that actually ran
```

### the lamps changed meaning when I added the ensemble

"Load shedding · max stage" always meant the worst hour within a year. With one
deterministic year the lamps showed exactly that. **The 48-draw ensemble silently
redefined it as the worst hour across 48 simulated years** - and the label never changed.

```
max stage by draw:  stage 0: 18 · stage 1: 17 · stage 2: 9 · stage 3: 2 · stage 5: 2
median year reaches stage 1 · p90 stage 2 · worst 5
```

Five lamps was a 1-in-48 tail on the masthead. **They now show the median draw**: one lamp
under Today, five at 58% availability, eight in the 2023 crisis. The tail is not hidden -
the tooltip gives the worst draw, the share of clean years, and Eskom's actual outturn for
scale.

### the pattern, for the fourth time today

Every fault in this sequence has been the same shape: a single number standing in for a
distribution, and a label that stopped matching what the number meant.

```
one seeded draw     overstated - a tail draw shown as the answer
the median          understated - hid that half the draws shed
the mean            better, but a point estimate until the standard error was added
the lamps           the label said "max stage in a year" and quietly became "across 48 years"
```

**Adding uncertainty to a number does not automatically fix the label above it.** That is
the lesson worth keeping.

---

## Label audit: fixing the number is only half the job — 31 Aug 2026

Having just written that "adding uncertainty to a number does not fix the label above it",
the next task was to check I had not left the same fault behind. **I had.**

```
before                              after
Load shedding · max stage           Load shedding · typical year
Expected shed                       Expected shed · per year
```

The lamps now show the median draw, so "max stage" was wrong in the opposite direction
from before - it read as the worst outcome while showing the typical one. And "Expected
shed" gave no period, on a board where every other figure is annual.

### the KPIs are on a different basis, and that is fine

The eight KPI cells come from the single deterministic run, not the ensemble. Checked
rather than assumed: coal varies 0.2% across seeds, CO2 0.1%, avgCost 1.2%. Those are
seed-insensitive, so a single draw is the right and cheap choice. Only adequacy needed
the ensemble, which is what it got.

### A loose end from the earlier audit, resolved - and it was my error

The board reads "Energy supplied 220 TWh" where I had measured 223.66 and flagged a
possible discrepancy. `genTWh` correctly excludes pumped storage and batteries, because
storage is shifted energy rather than generation and counting it would double-count.

```
223.66 total - 3.40 pumped - 0.25 battery = 220.01 TWh
```

Exact. The KPI was right and my measurement was the loose one. Worth recording because I
raised it as a suspected fault and it was not.

---

## The results.md index had drifted from its own file — 31 Aug 2026

Today's re-verification changed several published findings, so the ranked index at the top
of results.md no longer described what sat beneath it. **Three entries were stale and one
contradicted its own section.**

```
capture asymmetry   solar "falls to 2.5%" -> 2.7%, and now records that solar already
                    earns 24% BELOW the market average TODAY, which the old entry missed
hybrids             "worth 3% today, several hundred percent at a full pipeline"
                    -> the U-SHAPE: +130% today, +8% in 2030, +386% by 2035
battery saturation  now records that South Africa is already PAST the knee
locational spread   ADDED to Tier 2 - 66-fold, independently re-verified
```

The header also read "Fifteen sections follow" against nineteen.

### and the correction was itself wrong

I changed it to "Twenty". The file has nineteen. **That is precisely why this is now a
check rather than a habit** - a hand-written count that nobody verifies is worse than no
count, because it looks checked.

`validate_docs.py` now asserts the stated count matches the number of `##` sections.
Verified it fails: reverting to "Fifteen" reports `index says "Fifteen" (15), file has 19`.

### A duplicate check, caught by its own failure

I also wrote a pointer-resolution check. Breaking a heading to test it fired two failures -
an equivalent check already existed twenty lines above. Removed, with a note in its place.

**Rule 6 applies to harnesses as much as to constants.** Two checks of the same thing
drift apart, and the weaker one starts passing while the reader assumes both still bind.

---

## Fitness-for-purpose revised, and the last price-based finding re-run — 31 Aug 2026

The section at the top of this file tells a reader what may be quoted. After a day that
moved several published levels, it described a model that no longer existed.

### added to "DO NOT quote"

```
hybrid uplift rising    the curve is U-SHAPED: +130% today, +8% in 2030, +386% by 2035
solar capture ~98%      solar earns 24% BELOW the market average today, not near parity
wind merchant R758      R977 at 2026, falling further: -67% not -59% at grid pace
battery knee 3.8 GW     ~2.5 GW, and South Africa is already PAST it
any single-draw shed    the shipped outage seed alone gave the worst of ten tested
```

All five were measured on constants that suppressed the evening scarcity South Africa
actually prices. Adequacy moved into the "solid" block, since it is now reported as LOLE
and EUE over 48 draws with a stated standard error rather than one draw. The storage weak
spot was narrowed: pumped storage now carries a peak reservation, so the charging side and
the allocation between chemistries are what remain.

### the R285BN frontier, the last price-based finding not re-run

```
scenario                        Total now   published
Seriti as published, 25 GW gas       274         285
no gas, 50W/60S                      277         285
no gas, 40W/80S                      291         297
no gas, 60W/60S                      299         305
no gas, 80W/40S                      308         315
```

**It holds.** Levels fell 3-4%, the ordering is unchanged, and 50W/60S remains the single
no-gas build that matches the gas scenario - R277 bn against R274 bn, identical at
R1.32/kWh.

One nuance recorded rather than glossed: the sign flipped inside the noise. The published
version had no-gas marginally cheaper; it is now marginally dearer in total and identical
per kWh. A 1% gap either way is below what this model resolves, so the claim is
**cost-neutral** - which is how it should have been worded originally rather than
"marginally cheaper".

---

## Session review, and rule 11 — 31 Aug 2026

Calendar.md mandates a review every session and today's had not happened.

### the calendar

Standing checks verified rather than assumed: `profiles.json` is at the repo root
(356 kb - without it the suite produces eleven false failures across five harnesses), and
Rules.md read in full.

**Nearest actionable date is 10 Sep, ten days out**: the NERSA public hearing on Seriti
Green's trading licence. Registration for oral representations closed 28 Aug; attendance
and the livestream remain.

**The EPP submission entry now records that today's re-verification strengthened two of
its four arguments.** Policy Position 20 was filed as a "fiftyfold" spread and is
sixty-six-fold; Policy Position 9 was filed as approaching the ancillary knee when South
Africa is already past it. Nothing filed needs correcting - both are understated, and a
line each would strengthen any follow-up.

### rule 11: compute the bound before believing the number

Today produced one lesson general enough to be durable. For anything that moves a
quantity - a battery, a corridor, a store, a transfer - work out what it can physically
do, then check the answer against that.

The co-location heuristic returned R199/MWh of uplift where the battery could move
200 MWh across a R1,840 spread, capping it at R153. **Nothing else would have caught it.**
The suite passed, the number was plausible, and it had already been "validated" against an
LP and recorded as agreeing within 4.5%. Reading the code did not reveal it; one line of
arithmetic did.

### and the count drifted again, immediately

Adding an eleventh rule made the rules.md heading and the calendar.md standing check both
wrong - the same fault as the results.md section count fixed an hour earlier. Both are now
asserted by `validate_docs.py`, which fails with `heading says "ten" (10), file has 11`.

**Three hand-written counts have drifted in one day.** The lesson is not to count more
carefully; it is that any number written in prose about the file it sits in needs a check,
because prose does not recompute.

---

## NERSA's own dashboard, and a date we had wrong — 31 Aug 2026

NERSA publishes an Electricity Regulation Projects Dashboard carrying every consultation,
deadline and hearing in one table. **This project had not been reading it**, and the cost
of that was immediate.

### A date we held was wrong by a month

```
CALENDAR said   30 Sep 2026   NERSA expects to finalise the Trading Rules
dashboard says  31 Oct 2026   target completion, with a member workshop in September
```

### four consultations we were not tracking

```
~7 Sep 2026   Eskom Retail Tariff Structural Adjustment (ERTSA), written comments -
              INDICATIVE, and now the nearest date on the file. Hearing 8 Oct.
10 Sep 2026   Eskom RCA FY2024/25 public hearing. Comments closed 14 Aug, attendance only.
30 Sep 2026   TDP Rules, with the Minister for comment. The TDP is the source of the
              R390bn / 56 GW figure behind txRPerKWyr.
31 Oct 2026   Market Code, Vesting Contract Framework, Wholesale Tariff Methodology and
              Municipal KPI Rules all at target completion, all at FINALISATION with
              consultation concluded. Final texts to watch, nothing open to comment on.
```

### the one that matters most: the price and tariff rule

The ERA as amended requires NERSA to set unbundled prices and tariffs by rule, and the
dashboard states the consultation paper will be published **following publication of the
EPP**, with the rule targeted for October and completion by 30 Nov 2026.

**That is the direct follow-on from the EPP submission already filed.** Policy Position 20
(locational transmission cost) and section 4 (published disaggregation of the price
components) are both squarely in scope. This is the paper to comment on, and today's
re-verification means both arguments are stronger than what was filed.

Two undated workstreams are also worth watching: the **Trading Platform Algorithm
Framework**, which governs how the market actually clears and is the closest published
work to what GridTwin models, and the Market Surveillance Framework.

### added as a standing check

The dashboard is now in sources.md and in calendar.md's per-session checks. It is the
single best input to that file, and one reading corrected a date and added four
consultations.

---

## A finding written and withdrawn on the same day — 31 Aug 2026

This morning's OCGT diagnosis contradicted this afternoon's discovery that `unitOutage` is
active by default. Both could not be true. **The morning was wrong, twice over.**

```
CLAIMED   coalAvail is a flat derate, so the model has no stochastic availability,
          and no single availability value can reproduce both peaking and shedding.

ERROR 1   coalAvail is NOT the hourly dispatch limit. It feeds initial conditions, the
          ramp basis and the shortfall lookahead. The limit is cAvail, capped by a
          seeded unit-level Markov outage path that is ON BY DEFAULT.

ERROR 2   every point in the sweep was ONE outage draw. Today's own convergence work
          put the standard error at nine draws at 75% of the mean.
```

Re-run as means over 24 draws:

```
              OCGT TWh   unserved GWh
EAF 65           0.217            0.8
EAF 61           1.026           26.0     <- matches Eskom on both
EAF 60           1.412           44.2
Eskom            1.079           36.0
```

**A single value reproduces both, at about 60-61%** - exactly what the withdrawn claim
said was impossible.

### what replaces it is better

Matching Eskom's actual peaking and shedding needs about four points lower availability
than the audited 65.2% EAF. EAF is an energy availability factor across the year and
includes planned maintenance; a dispatch model needs hourly available capacity. They are
not the same quantity, and the four points are a finding about that gap rather than a
parameter to fit. **Do not tune coalEAFPct to 61.**

### why it happened, and why it was caught

Both errors are ones this project already had rules against. Rule 3 - check the input
before building on it - would have caught reading the wrong variable. The single-draw
sweep was made before the ensemble work that established how noisy single draws are, so
the morning could not have known; but the afternoon could have gone back, and only did
because the two entries visibly contradicted each other.

**Keeping both findings in the same file is what exposed it.** A findings file that
records what did not survive is not just more honest - it is the mechanism.

---

## Two single-year artefacts caught before they went to an external company

The Wind Pioneers differential test was first run on calendar 2023 alone and produced two
striking claims. Both were in a drafted outreach note. **Neither survived ten years.**

```
CLAIMED  North West has the best wind-solar complementarity, -0.155.
ACTUALLY Northern Cape is best at -0.180 mean. 2023 was North West's strongest year
         and Northern Cape's weakest - the ranking inverted on one year's noise.

CLAIMED  Hydra Central has the best wind in the country AND positive wind-solar
         correlation. Best resource, worst place for a hybrid.
ACTUALLY -0.004 mean across ten years, flipping sign. NEUTRAL, not bad. The 2023
         value of +0.028 sat inside the year-to-year spread.
```

The second was the most quotable line in the draft, and it was a story built on one year.

### what survived is stronger

```
Northern Cape   night-peaking 10/10, 25-40% day-night swing, best complementarity
                in the country at -0.180, negative in every year
Eastern Cape    day-peaking 10/10
Western Cape    MIXED - flips by year, so their claim does not hold and a single-year
                study finds either answer
```

Wind Pioneers' Northern Cape observation is right and understated. Their Western Cape one
does not replicate. The finding moves from Tier 3 to **Tier 2** - ten weather years.

### the lesson

The ten-year file already existed and the first run simply had not used it. Nothing failed;
the single-year numbers were correct for their year. **What made them wrong was presenting
a one-year ranking as a property of the regions.**

That is the same fault as the outage seed, the median, and the lamps: a single draw
standing in for a distribution. The difference here is that it was about to leave the
building with someone's name on it.

---

## Two Tier 3 findings promoted, and one new result — 31 Aug 2026

The Wind Pioneers near-miss showed that a ten-year file sitting unused turns single-year
noise into a published claim. So the Tier 3 findings marked "single weather year" were
screened rather than left there.

### both hold across ten years

```
demand response optimum   lowers cost in 10/10 years, reverses by 30% in 10/10,
                          saving R5.11-6.91/MWh at the optimum
no-gas cost neutrality    sign FLIPS six to four, spread -10 to +3 R bn on a base
                          near R278 bn - which is what neutrality actually looks like
```

Both promoted to **Tier 2**.

### the new result: the gas build carries seven times the cost variance

The single year could show neutrality but not test what surrounds it.

```
                       range across ten years   spread
Seriti + 25 GW gas              R275 - 289 bn    14 bn
no gas, 50W/60S                 R277 - 279 bn     2 bn
```

The gas scenario's bad years are 2015 and 2022 - poor wind years, where it burns more gas
to cover the shortfall. **The 110 GW no-gas build barely registers them**, because it is
overbuilt enough to absorb a bad wind year by curtailing less.

**That reframes the trade.** It is not "same cost, pick either" - it is the same expected
cost with a seventh of the variance. Annual fuel-cost variance is precisely what a utility
hedges and what a regulator sees as tariff volatility, so the overbuild is buying
insurance the single-year comparison priced at zero.

Caveats, both material: this excludes gas price risk entirely, which would widen the gas
spread further and strengthen the result; and it assumes connections that today's headroom
data says do not exist.

### the pattern

Three times today a ten-year run has changed a single-year conclusion - the Wind Pioneers
rankings, and now the framing of the frontier. The file was always there. **"Single weather
year" in Tier 3 should be read as work not yet done, not as a property of the finding.**

---

## to do: publish findings to media and LinkedIn

Added 31 Aug 2026. The Seriti Green and Wind Pioneers differential tests both landed well,
which suggests the model's findings travel when attached to something a reader already
cares about. The task is to run publishable scenarios and pitch them.

### the rule for this work

**Publish from Tier 1 and Tier 2 only.** Everything below has an evidential tier and a
known weakness; a finding that is retracted in public costs more than one never published.
Every claim needs its scenario attached - results.md's first line exists for exactly this,
and three near-misses today came from ignoring it.

### ranked for publication - strength first, not interest

**1. the grid, not the wind, is the constraint.** The four best-wind regions hold 100% of
South Africa's existing wind and 7.3% of the national room to add more. Northern Cape and
Hydra Central - the two best resources measured - are at zero headroom for every
technology.
  why it travels: it is arithmetic on published figures, so there is nothing to dispute
  but the source. It reframes a debate the public thinks is about resource and cost.
  risk: low. Tier 1.

**2. long-duration storage does not solve a winter wind drought.** 20 GW of 100-hour
iron-air - two terawatt-hours - changes July gas by nothing to three significant figures.
  why it travels: contrarian against a widely repeated assumption, and it is the
  most-tested result in the file. Survived a heuristic, an optimal LP, a
  reserve-constrained LP, and a full recalibration.
  risk: low, but state the mechanism - the deficit is an energy shortage, not a shifting
  problem - or it reads as anti-storage, which it is not.

**3. the gas build carries seven times the cost variance.** Same expected annual cost as
a 110 GW renewable build, but R275-289 bn across ten weather years against R277-279 bn.
  why it travels: tariff volatility is a live public issue, and this prices the overbuild
  as insurance rather than waste. Genuinely new, found 31 Aug.
  risk: medium. Excludes gas price risk (which strengthens it) and assumes connections
  that do not exist (which weakens it). Both must be said.

**4. solar already earns a quarter below the market average, today.** Before any
cannibalisation from new build. Wind holds 96-107% of the mean across the whole range;
solar falls to 2.7% at 60 GW.
  why it travels: directly commercial. Every solar developer and offtaker in the country
  is pricing against an average their asset does not earn.
  risk: low-medium. The mechanism - every solar plant produces in the same hours - is
  obvious once stated, which is what makes it publishable.

**5. flexibilising coal makes a no-gas system worse**, ten years out of ten.
  why it travels: it is the opposite of the intuition and was found by testing a
  hypothesis that returned the reverse of what was wanted.
  risk: medium. Only true with no dispatchable backup. Quoted without that scope it is
  simply wrong, and it is an easy caveat to lose in a headline.

**6. connection headroom is worth 66 times more in the best region than the worst.**
  why it travels: it answers "where should grid investment go" with a number, and it is
  in a filed regulatory submission.
  risk: low on the ratio, higher on the levels - they moved threefold with recalibration
  while the ratio held. Publish the ratio.

### DO NOT publish yet

```
the 4-point EAF gap      Reproducing Eskom's outturn needs ~61% against an audited 65.2%.
                         SUPERSEDED 31 Aug: it is a symptom of the model shedding in
                         SUMMER when South Africa sheds in WINTER.
                         Interesting and probably real, but untested against maintenance
                         treatment or outage tail thickness, and it reads as criticism of
                         Eskom. Needs work before it is safe.
anything Tier 3          Single weather year or heuristic-dependent. Promote it first.
adequacy figures         Only as LOLE and EUE with the standard error. Never a draw.
```

### next steps

1. ~~Pick one finding and write it properly.~~ done 31 Aug 2026 - `post_headroom.md`,
   drafted on finding 1. Verified from source before writing: 4,612 MW is exactly 100% of
   national wind, 1,580 of 21,520 MW is 7.34%, and solar headroom across the four is zero.
   The piece also carries a new number found while checking - **the correlation between
   wind capacity factor and connection headroom is -0.91**, and the four worst-resource
   regions hold 78.3% of the room. That inverse relationship is the strongest version of
   this finding and did not exist before today.
2. Attach each to something topical - the Seriti Green and Wind Pioneers posts both worked
   because they engaged with someone else's published work rather than announcing ours.
3. The Price and Tariff Rule consultation, expected October, is the natural hook for
   findings 1 and 6.

---

## IMPORTS_CF single-sourced — 31 Aug 2026

The open item said "a literal in nodal_engine.js". It was worse: **four copies.**

```
nodal/nodal_engine.js   const IMPORTS_CF = 0.41
index.html              importsCF: 0.41
index.html:5181         (p.importsCF ?? 0.41)
index.html:5404         (p.importsCF ?? 0.41)
```

**None of them had drifted. A comment about them had** - index.html still read
"IMPORTS_CF = 0.85 is defined in nodal_engine.js" five hours after the value was corrected
to 0.41 in both files that morning. That is the failure mode a duplicated constant
actually has: the number is easy to update everywhere, and the prose around it is not.

### the fix runs the only direction the load order permits

`nodal_engine.js` is loaded as a plain script by four harnesses with no access to `FIXED`,
so it cannot read the value from there. But it loads at index.html:1124, before the
constant block at 3829 - so `FIXED` can read it, and now does: `importsCF: IMPORTS_CF`.

**No fallback, deliberately.** If the engine fails to load the page should fail loudly,
which it already does - four harnesses die with "IMPORTS_CF is not defined" without it. A
fallback would convert a loud failure into a plausible wrong answer, which is exactly
rule 7's lesson.

Verified unchanged: imports land at 4.13 TWh against Eskom's audited 4.09.

### pinned, so it cannot come back

`validate_structure` 10 -> 13. Three checks: the engine declares it, `FIXED` reads it
rather than restating it, and no `?? <number>` fallback reintroduces a copy. Verified they
fail - reverting `FIXED` to the literal reports "fixed.importsCF should be IMPORTS_CF, not
a literal".

---

## The fallback audit: 55, not 14, and mostly deliberate — 31 Aug 2026

The open item said fourteen `X || <literal>` fallbacks shadowing a `FIXED` key. A full
audit found **55**, in three classes with different verdicts.

```
1. FALLBACK MATCHES THE CONSTANT      duplication, rule 6, drift risk only
2. FALLBACK IS 0, FIXED HOLDS A VALUE looks alarming, mostly CORRECT
3. KEY IS NOT IN FIXED                rule 7's dangerous case - 17 sites
```

**Class 2 is the one that would have been broken by a naive cleanup.** For
`asReserveRMWh`, `asInertiaRkWyr` and `capacityPaymentRkWyr` the fallback of zero is the
Right default: South Africa prices no ancillary services and has no capacity market, so an
unset value means unpriced. `FIXED` holds what those markets would pay if they existed,
which is a different question. Converting them to `?? FIXED.x` would have silently created
revenue that does not exist.

**Class 3 is rule 7's case and all seventeen check out** - every one is a genuine optional
control with no `FIXED` entry (`newVrfbMW`, `newIronAirMW`, `exportCapMW` and similar)
where zero is intended.

### one was actually wrong

`state.coalEAFPct || 0`, at two export sites - the build-optimiser summary row and the CSV
header. Not dispatch. If the key were ever unset those stamped **"EAF 0%" on a run that
used 65**, and a mislabelled export travels without the model attached to correct it.
Fixed to `?? FIXED.coalEAFPct`; `demandGrowthPct` beside it keeps `|| 0` because it
legitimately defaults to zero and has no `FIXED` entry.

### the verdict is in the code, not just here

The audit is written at the `FIXED` block. Fifty-five sites is too many to re-derive, and
the next person to grep for `||` needs the reasoning at the point of use rather than in a
document they may not open.

### and the check matched its own documentation

The pin for this greps for `coalEAFPct || 0` - and the audit note quotes that pattern while
explaining it, so the first version failed on its own comment. Same trap as the backtick
that broke the worker block this morning. **A check that greps source must exclude the
prose about the source.** Now strips comment lines first; 14/14, and it fails on exactly
the one fault when reintroduced.

---

## sa_solar_grid.json: not reconnected, and that is the finding — 31 Aug 2026

The open item asked whether to reconnect the orphaned PVGIS grid as a solar source. The
obvious answer was yes - satellite data at ~5% accuracy against an ERA5 path the code's own
label admits may overestimate by 5-15%. **The obvious answer is wrong, for three reasons
found by looking rather than assuming.**

```
1. The national model ALREADY uses PVGIS SARAH2, at 0.05 degrees - TEN TIMES FINER
   than this 0.5 degree grid. Substituting it anywhere would be a downgrade.
2. This file carries ANNUAL capacity factor only. fetchSolar needs an hourly series
   to build a profile, so it cannot replace that path even in principle.
3. Measured against the in-use regional series it reads 5.0% LOWER on average
   (-1.3% to -11.3% by region).
```

**Point 3 is the interesting one.** The gap is not error - it is siting. The regional
series is capacity-weighted to real plant locations, and developers choose
better-than-average points. A 0.5 degree cell averages roughly 55 km including the ground
nobody would build on. So for site assessment, where the user has picked a specific point,
the coarse grid is biased the wrong way.

### what it is actually for

A plausibility band. `fetchSolar` calls a live third-party API; if Open-Meteo changes units,
returns a different variable, or silently degrades, nothing downstream notices - the number
just moves. A satellite value for the same cell catches that.

The band is deliberately wide at 25%, because ~5% from siting plus the acknowledged ERA5
overestimate are both expected. Tested: silent at the reference and at 20% high, flags at
+63% and -52%, silent over ocean where there is no cell.

```
PVGIS reference at Upington   0.227
plausible / 20% high          silent
60% high / half               FLAGGED
```

### pinned SO it cannot drift back

`validate_geo` 40 -> 43: the file holds its stated 739 points, every capacity factor is
physically plausible, and **the grid is fetched and its cross-check wired in**. Renaming
the function fails the third with "or it is an orphan again".

`solarCrossCheck` and `sarahCFAt` are exposed on `window` beside `fetchSolar` - an
unreachable check is one nobody proves works, which is how the pricing run shipped untested
this morning.

---

## The model sheds in summer. South Africa sheds in winter. — 31 Aug 2026

Investigating the four-point EAF gap found something larger and made that gap a symptom.

```
WHEN the model sheds, mean of 24 outage draws
  Jan 0.30 GWh · Feb 0.14 · Mar 0.25 · Nov 0.06 · all other months ~0
  summer Dec-Feb  0.44 GWh          winter Jun-Aug  0.00 GWh
```

**Every South African knows load shedding is a winter problem. This model never sheds in
winter at all.**

### the mechanism

`genUnitOutagePath` shifts planned maintenance out of the winter peak on a `SEASON` array
running 3:1 - 0.45 in June and July against 1.35 in December to February. Real utilities do
schedule this way, so the direction is right. The magnitude is not:

```
annual EAF set to          65.0%
model winter availability  74.6%
model summer availability  58.9%
seasonal swing            +15.7 points
```

Nearly ten points of extra availability exactly when the system is tightest. The model
sails through the winter peak and manufactures scarcity in January instead.

### the obvious fix is wrong, tested

Flattening the season to 1.45:1 should have moved shedding into winter. It did the
opposite - OCGT fell 0.217 to 0.132 TWh and unserved went to zero. Less summer maintenance
removes the summer scarcity without creating winter scarcity, because winter has ample
margin either way.

**So this is not a parameter to tune.** Two things are missing together: winter
availability should sit closer to the annual mean, and unplanned outages should rise in
winter when units run hardest. The process models the second not at all - `forcedSharePct`
is flat across the year.

### what this does to the EAF finding

The four-point gap - needing 61% to reproduce Eskom's outturn against an audited 65.2% - is
a symptom of this, not a separate result. Lowering annual availability is compensating for
a seasonal shape that is too generous where it matters. **It stays out of anything
published**, and `coalEAFPct` stays at the audited value.

Next step: a winter-weighted forced-outage rate, calibrated against Eskom's published UCLF
by month rather than assumed. That is a data question before it is a modelling one.

---

## correction: "South Africa sheds in winter" was not verified — 31 Aug 2026

Written into the seasonal diagnosis an hour earlier as though established. **It is not
supported by FY2026.**

Eskom's integrated report states the country reached 365 consecutive days without
loadshedding **in May 2026**. FY2026 runs April 2025 to March 2026, so the clean run began
around May 2025 and the year's 36 GWh of shedding fell in **April-May 2025 - autumn**, at
the very start of the fiscal year.

Severe winter shedding is a real memory from 2022-23, but that is not what FY2026 shows,
and I asserted it from intuition rather than the document sitting open beside me.

### the defensible statement is narrower and stronger

**The model's own demand peaks in June at 31,595 MW, and it never sheds then. It sheds in
January to March, when its own peaks are 1 to 2.5 GW lower.** That is an internal
inconsistency requiring no external claim at all:

```
month   coal available   monthly peak   margin
Feb              23.3           30.6     -7.3    <- tightest
Jun              29.9           31.6     -1.7    <- most comfortable
```

The seasonal availability swing is 16.5 points, worth 6.5 GW, against a demand swing of
1.0 GW. **The maintenance shape overwhelms the demand shape by six to one and inverts
which season binds.**

### why this matters for the fix

Had the winter claim gone unchallenged, the obvious target would have been "make it shed
in winter" - and any parameter reaching that target would have been fitting to an assumed
pattern. The real target is narrower: **the availability swing should not be so much larger
than the demand swing that it decides the answer by itself.**

That is a constraint derived from data already in the model, not from a memory of what
load shedding felt like.

---

## The seasonal diagnosis was wrong, and Eskom's own file proves it — 31 Aug 2026

Three claims in one afternoon, each correcting the last:

```
CLAIMED  no flat availability factor reproduces both peaking and shedding
         -> withdrawn: read the wrong variable, swept single draws

CLAIMED  the model sheds in summer while South Africa sheds in winter
         -> the winter half was never verified; FY2026's shedding was AUTUMN

CLAIMED  the model's seasonality is inverted and needs fixing
         -> WITHDRAWN. Eskom's measured dispatch says the shape is RIGHT.
```

### the measurement

`ESK19243.csv` carries `Eskom OCGT Generation` hourly for 2025 - the peakers Eskom
actually ran, which is where the system was actually tight.

```
month      model share   Eskom share
Jan              16.5%         16.0%
Feb              17.2%         17.0%
Jul               7.1%          6.0%
Sep               2.9%          0.0%

Jan-Mar : Jul-Sep     model 3.9:1     Eskom 8.5:1
```

**Eskom runs peakers eight and a half times more in late summer and autumn than in
winter.** January and February match the model's share to within half a point. The
`SEASON` array's 3:1 maintenance concentration is not too aggressive - **it is if anything
too mild.**

The mechanism is exactly what the code comment always claimed: maintenance is scheduled
away from the winter peak, so summer availability is low and peakers cover it. Winter runs
a full fleet.

### what I got wrong, and how

I reasoned from what load shedding feels like in South Africa - a winter emergency - and
built a diagnosis on it. Two checks would have stopped me. The Eskom report was open beside
me and says the 365-day clean run began in May 2025, making FY2026's shedding autumn. And
this CSV, already in the project as the demand source, had the answer in a column I had
never looked at.

**The data to falsify this was in the repo the whole time.** Rule 3 - check the input
before building on it - and the input here was one column of a file already loaded.

### what actually remains

The level, not the shape. Model 217 GWh of peaking against Eskom's 1,898 for calendar 2025.
That is the four-point EAF gap restated, now with the seasonality corroborated rather than
suspect - which makes it a cleaner question than it was this morning.

The file also reconciles to the published accounts: Eskom OCGT for Apr-Dec 2025 is 800 GWh,
implying ~279 for Jan-Mar 2026 against the 1,079 audited FY2026 total.

---

## The peaker question, settled — 31 Aug 2026

Three successive diagnoses, two withdrawn, one that holds. The data that settled it was a
column of a CSV already in the project as the demand source.

### what eskom actually did in 2025

```
OCGT ran in 2,016 hours - 23% of the year - across the WHOLE demand range:

demand decile      demand MW      mean OCGT MW
 3               19.5-20.2k                 85
 6               21.6-22.3k                198
 8               23.1-24.1k                256
10               25.5-31.2k                688

above 28,000 MW      209 GWh    11% of the total
below 25,000 MW    1,203 GWh    63% of the total
```

**Sixty-three per cent of peaker output runs below 25 GW of demand**, with roughly 25.8 GW
of coal available. Those are hours where a merit-order model has no reason to start a
peaker, and correctly does not. That output is reserve, network support and ramping.

### SO the gap is scope, not error

The model prices energy. Most of Eskom's peaker running is not energy. Tuning availability
until the totals matched - which the four-point EAF gap invited - would have manufactured
scarcity to imitate services the model does not represent. **`coalEAFPct` stays at the
audited 65.2%.**

### benchmarked on shape, deliberately not on level

`validate_benchmarks` 21 -> 22. `peakerSeasonRatio` asserts Jan-Mar against Jul-Sep output:
model 9.0x, Eskom 8.5x, band 2-12x.

**The level is deliberately not benchmarked**, and the reason is written into the harness:
a level benchmark would invite exactly the tuning that was tried and withdrawn twice today.
The comment exists so it is not attempted a third time.

### the pattern worth keeping

Every wrong turn today came from reasoning about the model instead of measuring it, and
every correction came from a file already in the repository. The EAF gap, the seasonal
inversion, the winter assumption - three diagnoses built on intuition, all falsified by
data nobody had to go and fetch.

---

## Full audit after the day's changes — 31 Aug 2026

Asked to scour everything as both modeller and coder after a day of large changes.

### what checked out

```
hourly energy balance      0.00e+00 MW worst error, and exact in all ten
                           extreme scenarios tested including zero coal and 200 GW VRE
constants                  coalInstalledMW 39,692 · coalEAFPct 65 · importsCF 0.41
                           matching IMPORTS_CF exactly
slider drift               none - every slider default equals its FIXED counterpart
storage round trip         0.776, inside the documented 0.776-0.815 band
series integrity           no negative or NaN value in any stack series
marginal technology        8,398 coal · 327 diesel · 30 ps · 5 unserved = 8,760 exactly,
                           and no hour names a plant that is not generating
today's additions          all eleven reachable, no leftover instrumentation
```

### two things I chased that were not bugs

**A 2,800 MW balance error** at hour 8333 - my check double-counted, because `loadS`
already includes storage charging. Caught by noticing supply equalled `loadS` exactly.

**A price floor of R715 where coal SRMC computes to R594.** Neither part-load (median
1.012, too small) nor an error: `coalMarginalCost` walks a within-fleet merit curve, so
the marginal coal unit legitimately costs more than the R546 fleet average. The model is
more sophisticated than my expectation of it.

### one real finding: two copies of the weather builder

`runMC` and `runAdequacy` each carried their own `loadWeatherYears`, `wxCache` and
`profileFor` - identical logic, two places. **Rule 6 applied to behaviour, and its failure
mode is not hypothetical: the board and the risk panel had already diverged fiftyfold that
same morning because only one of them was on real weather years.**

Extracted to `weatherProfileFactory()`. Results byte-identical either side - LOLE 3.0,
EUE 2.36 - so the refactor is behaviour-preserving. `validate_structure` 14 -> 15 asserts
one factory and zero private caches.

### the honest summary

Nothing in the model's outputs is wrong. The one defect found was structural, and it was
the specific structure that had already produced a real bug hours earlier.

---

## The full-year run was broken and the whole suite passed — 31 Aug 2026

Reported from the browser: **"Solver error: Uncaught SyntaxError: Invalid or unexpected
token"** on Run the full model. My pricing-run edit had broken it, and 893 checks said
everything was fine.

### the fault

`MIP_WORKER_SRC` is a template literal, so every backslash in it is collapsed once before
the worker sees the string. The existing code knows this and writes four backslashes where
the worker needs one escape. My code wrote two:

```
in the file      what the worker receives
\\\\n   (existing)   \\n        correct - a newline escape
\\n     (mine)       an actual newline inside a single-quoted string  -> SyntaxError
```

`const lines = lpFixed.split('\\n')` became `split('` followed by a real line break.

### why nothing caught it

**The file is valid JavaScript.** Lint passes, `node --check` passes, every harness passes,
because the fault does not exist in the source - it exists only in the string the browser
Builds from the source at runtime. The worker also never runs under jsdom, which stubs
`Worker` out entirely.

Three separate defences all missed it for the same reason: they all inspect the file.

### the check now builds what the browser builds

`validate_structure` 15 -> 16. It slices out the template literal, evaluates it exactly as
the browser does, and parses the result with `new Function`. Verified against the broken
copy: reports "Invalid or unexpected token - a backslash in MIP_WORKER_SRC must be
Doubled".

Pricing run re-verified end to end afterwards: 283 rows parsed and matched, R608 against a
R600 marginal cost.

### the third escaping trap in one day

A backtick in a worker comment broke the page this morning. A regex in a check matched its
own documentation this afternoon. Now a backslash. **The worker block is not ordinary
source and cannot be edited as though it were** - and until today nothing verified that.
Rules 6 and 7 are about constants appearing twice; this is the same disease in escaping.

---

## The shadow price did not move after a full run — instrumented, not guessed

Reported from the browser. The MIP applies correctly - curtailment 0.00 -> 11.54 TWh,
unserved 5 -> 0 GWh - but the wholesale shadow price panel is unchanged, which means the
pricing run produced no duals and the instant prices were correctly kept.

### what was ruled out, in order

```
the call signature      matches the real one exactly, argument for argument
the loop variable       `day` is correct - the same variable the real code slices with
the renderers           all take `r` and use it; none read a stale global
the mechanism           WORKS at realistic scale: 31 unit groups, 10 regions,
                        21 corridors, 4,668 rows parsed and matched, 24/24 hours priced
```

### the tell is the runtime

**107 seconds for a full year.** A pricing LP per day should roughly double that. So the
pricing run is not executing at all, and my `catch` swallowed the reason - a pricing run
that never fired was indistinguishable from one that fired and found nothing.

### the fix is a diagnostic, not a guess

The worker now counts days priced, days that errored, days with a row-count mismatch, and
keeps the first error message. All four are reported in the banner under the full-run
summary.

**I could have guessed at a cause and shipped a speculative fix.** Three times today a
confident diagnosis was wrong and the data was already available - so this one gets
measured first. The next full run will say which of the three it is.

**and the diagnostic failed silently too.** `showMIPBanner` reads
`mipActiveRes.priceDiag`, but `mipActiveRes` is a wrapper - `{ res: mipRes, mode, ... }` -
and I attached `priceDiag` to `mipRes`, one level down where the banner could never see
it. A diagnostic written to explain a silent failure was itself silent.

Lifted onto the wrapper and verified rendering: "Pricing run: 0 days priced, 365 errored".
`validate_structure` 16 -> 17 now asserts that anything `showMIPBanner` reads is actually
set on the object it reads from.

Next: read the banner after a full-year run - it sits by the KPI row at the top, not with
the solve summary.

---

## A build stamp, because "which version is running" was unanswerable

The pricing diagnostic is present and correct in `index.html` - wired to `mipRes`, lifted
onto `mipActiveRes`, read by `showMIPBanner`, and verified rendering in isolation. It did
not appear in the browser.

**Neither of us could tell whether the page was serving a cached older copy**, and I spent
an hour reasoning about code that is demonstrably correct on disk. That is the wrong
failure mode: the question "is this the file I sent" should take one glance.

`BUILD_STAMP` now prints in the banner:

```
build 2026-08-31d · pricing run reported
build 2026-08-31d · NO pricing diagnostic on this result
```

The second half distinguishes the two hypotheses directly. If the stamp is missing
entirely, the browser has an old file. If the stamp shows but says no pricing diagnostic,
the code is current and `applyMIPResult` is not setting `priceDiag` - a real bug. If it
says "pricing run reported", the diagnostic line follows.

**the lesson.** Any deployed artefact needs a version marker. Without one, every
"it doesn't work" is ambiguous between a code fault and a stale cache, and the debugging
cost is paid on every single report.

---

## The pricing run: found by instrumenting, not reasoning — 31 Aug 2026

The banner that finally answered it read:

```
Pricing run: 365 days priced, 0 errored, 0 with a row-count mismatch.
The pricing run did not return usable duals.
```

Every day solved. Nothing errored. Nothing mismatched. And no prices. **That combination
names the fault precisely**, which is exactly what four rounds of reasoning had failed to
do.

### two bugs, both invisible without the counters

**1. HiGHS keys its Rows differently in the browser.** Node's package returns rows keyed
by numeric index; the browser WASM build returns them keyed by row name. My extraction did
`names[+k]`, so in the browser every key gave `names[NaN]`, every row was skipped, and
every dual was lost - with no error, because skipping is a normal path.

Now accepts both: `(k !== '' && !isNaN(Number(k))) ? names[Number(k)] : k`. Verified under
both formats, giving identical prices - 24 of 24 hours, R628 either way.

**2. My own success counter was wrong.** `if (dayPrice)` counted a day as priced whenever
the array existed - and `new Array(24).fill(0)` is truthy. That is why the banner claimed
365 days priced while no hour carried a price. Now requires `dayPrice.some(v => v > 0)`,
and days that solve but yield nothing are counted separately as `empty`.

### and the backtick trap, for the second time today

The comment explaining bug 1 used backticks around an identifier. Inside
`MIP_WORKER_SRC` - a template literal - that terminated the string and truncated the
worker mid-comment.

**The check added this morning caught it before it shipped.** That is the whole value of
building the worker source the way the browser does rather than lint-checking the file.

### what this cost, and what it should have cost

Four rounds of reasoning about correct code. The signature matched, the loop variable was
right, the renderers used their arguments, and the mechanism worked at full scale in Node -
every check passed because every check was in Node. **The counters took ten minutes and
answered it outright.** When a silent path fails, instrument it before theorising about it.

---

## the third escaping fault, and the one that actually silenced the prices

```
build e:  0 days priced, 0 errored, 0 mismatch, 365 SOLVED BUT YIELDED NO DUALS
```

Each counter narrowed it further, and this one was conclusive: the LP solved, the names
matched, and no row was recognised. One line remained.

```
in the file          /^bal_(\\d+)_(\\d+)$/
what the worker got  /^bal_(d+)_(d+)$/      -> matches "bal_ddd_ddd", so nothing
```

**A collapsed backslash that still parses.** The check added this morning builds the
worker source and parses it - and this passed, because `(d+)` is perfectly valid syntax.
It just means something else. Every dual was discarded at the final step, silently,
because a non-match is a normal path.

Replaced with `n.split('_')`, which cannot be collapsed because it contains no escapes.
Verified with the worker's exact evaluated logic: 24 of 24 hours priced under both
numeric-keyed and name-keyed rows, R628 either way.

### the check now looks for meaning, not just syntax

`validate_structure` 17 -> 18. It scans the evaluated worker for escape sequences that
have collapsed into bare letters - `(d+)` where `\\d+` was meant, `split('n')`,
`/^s*`. Verified the detector fires on the exact broken string and not on the fix.

### three faults, one root cause, increasing subtlety

```
backtick     terminated the literal          -> page broke loudly
\\n vs \\\\n    literal newline in a string     -> worker threw SyntaxError
\\d vs \\\\d    valid regex, wrong meaning      -> SILENT, cost four rounds
```

Each got quieter. The first two announced themselves; the third passed every check
including the one written for the first two. **A template literal that carries code is a
second language embedded in the file, and only running it - or reading what it evaluates
to - tells you what it says.**

---

## Can we replicate a NEM-style price forecasting service? — 1 Sep 2026

Prompted by Endgame Analytics' pd4castr - ML price forecasts for the NEM, sold by
subscription over intraday, week-ahead and quarterly horizons.

**not as built, and the reason is structural rather than technical.** Endgame forecasts an
Observable price: the NEM has a spot market with decades of published half-hourly
settlement data, which is what makes supervised learning possible. **South Africa has no
wholesale spot price.** There is no target variable, so there is nothing to train on.
SAWEM is expected to begin trading Q4 2026.

### but the quantity is forecastable, and measurably SO

Tested across 12 draws varying both weather year and outage path:

```
hours where the draws agree within 5%      7,823    89.3%
hours where they disagree widely             937    10.7%
share of total price mass in those hours              27.2%
worst single hour                          R86,255 range
```

**The distribution is bimodal.** Nearly nine hours in ten are effectively deterministic -
coal is marginal, the price is the marginal unit's cost, and a structural model gets it
almost exactly with no learning required. The remaining tenth carries more than a quarter
of the value and is decided entirely by which outage and weather realisation occurs.

### what that implies

**The 89% needs no machine learning** - it needs a merit order, a fleet and a demand
forecast, which is what GridTwin already is.

**The 11% is not learnable from history South Africa does not have.** In the NEM, ML earns
its keep in the tail because it learns bidding behaviour from years of observed conduct.
Before a market opens there is no conduct to learn. What that tail actually needs is an
outage forecast - and Eskom publishes weekly system status, which this project already
tracks as a drift detector.

### the timing point

At market start nobody will have price history, including incumbents. **A structural model
is the only instrument that works before a market has a past**, and its shadow price
becomes checkable against a real one for the first time. That is a narrow window in which
this model is comparatively strong, and it closes as history accumulates.

Recorded as analysis, not a plan. No product decision follows from this, and the honest
constraint is that a forecasting service needs live data ingestion and an uptime
commitment that a single-file browser model does not have.

---

## The pricing run works — 8,760 of 8,760 hours — 1 Sep 2026

```
Pricing run: 365 days priced, 0 errored, 0 with a row-count mismatch,
             0 solved but yielded no duals.
Prices come from a pricing run covering 8,760 of 8,760 hours.
```

Full coverage. The full model now produces its own prices rather than inheriting the
heuristic's, and every price-derived panel refreshes from them.

### what to expect from the new prices, and why

They will not match the heuristic's, and two differences are structural rather than
suspicious:

**The scarcity tail should disappear.** The heuristic run sheds 5 GWh and prices five
hours at the R87,000 value of lost load. The MIP finds a feasible dispatch with zero
unserved energy, so those hours no longer price at VOLL. Mean price should fall
noticeably, and that is the MIP being better rather than the prices being wrong.

**Start-up costs are not in the price.** A fixed-commitment LP cannot recover them, which
is precisely why real markets pay uplift separately. This solve carries 4,343 unit
start-ups, so system cost includes them while the price does not - the same distinction
the model already draws for start-up in `avgCost` versus `marginalP`.

### what is worth a glance

Curtailment rises to 11.54 TWh under the MIP because it respects corridor limits the
instant model ignores. Hours where a corridor binds should now price differently from
unconstrained hours - that is the locational signal the instant engine cannot produce, and
it is the main reason the pricing run was worth building.

Build stamp `2026-09-01a`. The trailing clause "the rest keep heuristic prices" is now
suppressed at full coverage, where it read as a contradiction.

---

## "The wholesale prices didn't budge" — the last link — 1 Sep 2026

The pricing run reached full coverage, 8,760 of 8,760 hours, and the panel still showed
the old numbers. **The prices were replaced; the panel does not read the prices.**

```
renderPricePanel(r)  ->  reads r.priceStats, NOT r.marginalP
mipRes               ->  { ...lastRes, ... } copies the HEURISTIC's priceStats
```

I overrode `marginalP` and left every statistic derived from it inherited. The panel was
faithfully redrawing the heuristic's summary of a series that no longer existed.

### the audit found three more

```
priceStats        overridden now - recomputed via priceStatsOf(mipRes.marginalP, ...)
marginalTech      was INHERITED - re-derived from the MIP's own stack
asRevenueR        was INHERITED - flagged, zero at defaults
capacityRevenueR  was INHERITED - flagged, zero at defaults
```

**`marginalTech` was the worst of them.** It captions each hour with the technology that
set the price, so inherited it would have labelled pricing-run numbers with heuristic
technologies - worse than a stale number, because it reads as an explanation. Re-derived
coarsely from the MIP's stack: a fixed-commitment LP has no bid stack, so claiming the
heuristic's resolution on storage bids and demand response would be false precision.

The two revenue figures are flagged rather than recomputed. Both are zero at defaults -
South Africa prices neither ancillary services nor capacity - and the functions that build
them live inside `simulate()`. Flagged beats silently wrong.

### the pattern, which is the real lesson

`{ ...lastRes }` is a convenience that copies every field, including ones computed from a
field you are about to replace. Overriding the source without recomputing its dependants
leaves the object internally inconsistent, and the inconsistency is invisible because
every value is individually plausible.

`validate_structure` 18 -> 19 asserts both are recomputed; removing either fails with the
name of what went stale.

---

## auditing every field of the MIP result at once - 1 Sep 2026

Three stale-field bugs in the mip result were each found by a user rather than a harness,
one round at a time. Rather than wait for a fourth, all 85 returned fields were classified.

```
overridden              8   E, stack, fuelCost, carbonCost, totalCost, co2,
                            avgCost, shedMWh - plus priceStats and marginalTech
genuinely unaffected   ~58  caps, rates, constants, demand series
zero at defaults         4  ancillary and capacity revenue
genuinely stale          8  listed and cleared
```

### the one with a visible consequence

`costDecomposition` carries its own `sumRPerMWh` and a `reconciles` flag, and `avgCost`
is recomputed for the mip. Inherited, the panel would show seventeen components summing
to R585/MWh beneath a headline of R544 - a **R41/MWh gap a reader can see**, on the panel
built specifically to prove the cost adds up.

### storage tier splits were materially wrong, not marginally stale

The mip discharges 1.41 TWh against the heuristic's 3.68. The per-chemistry breakdown
inherited from the heuristic describes a dispatch that did not happen.

### cleared rather than recomputed, deliberately

All eight are set to null and listed on `mipRes.staleUnderMIP`. Recomputing them needs
machinery that lives inside `simulate()`, and the panels already handle a null by hiding.
**An absent number beats a wrong one**, and the list makes the gap explicit rather than
leaving it for a fourth user report.

### the general shape of this fault

`{ ...lastRes }` is a convenience that copies everything, including values computed from
the very fields being replaced. Every one of these was individually plausible, which is
why three shipped. The audit took twenty minutes and found five more than the three that
had been reported.

---

## the solar ceiling, extended nationally - 1 Sep 2026

The wheeling-calculator test found solar coverage capping near 40% in the Northern Cape.
Extended to eight regions and ten weather years, it is a physical limit rather than a
regional quirk.

```
region           solar 2 MW   solar 4 MW   solar 8 MW
Northern Cape         36.6%        41.8%        44.5%
Western Cape          34.9%        40.5%        43.5%
Gauteng               36.1%        41.8%        44.5%
```

**Under two points of spread across the whole country at every build level.** The best
solar resource in South Africa buys a wheeling customer barely one point more coverage
than the worst - which is the opposite of how solar sites are marketed.

### the ceiling is the daylight fraction

Only **49.3% of hours have any solar output**, so no quantity of panels serves a flat load
in the other half:

```
solar  4 MW for a 1 MW load    41.8%
solar 32 MW                    47.6%    eight times the plant, six points
daylight fraction              49.3%    the asymptote
```

### wind and storage solve different halves

```
solar 4 MW alone                        41.8%
   add a 4-hour battery                 58.2%
   add 1 MW of wind                     67.3%
   add both                             83.5%
wind 2 + solar 4 + 2 MW / 8 MWh         98.0%
```

A battery moves solar within the day; wind produces in hours solar never does. Together
they beat the sum of either, which is why a 98% contract is reachable and a solar-only
one is not.

### now in validate_findings, with its scenario attached

Two checks, 7/7 -> 9/9. The scenario note is explicit that the test uses **no wind and no
battery**, because adding either tests a different claim - the same discipline that
prevented three false corrections on 31 Aug.

---

## wheeling coverage, now in the tool - 1 Sep 2026

The solar ceiling was a document finding. `wheelCoverage()` puts it beside the wheeling
panel, which priced the transport and said nothing about the question an offtaker asks
first: how much of my load does this actually cover?

```
configuration                   coverage   spilled
solar 4 MW only                    41.2%       57%
solar 32 MW only                   46.5%       94%
solar 4 + 4h battery               57.7%       38%
solar 4 + wind 1                   66.0%       50%
solar 4 + wind 1 + battery         82.3%       37%
wind 2 + solar 4 + 2 MW / 8 MWh    99.9%       40%

daylight fraction, the ceiling for solar alone   48.4%
```

Reproduces the ten-year result within a point, using the single-year regional file the
page already loads - so no new data dependency.

**The spill column is the part a buyer will not have seen.** A 32 MW solar contract on a
1 MW load throws away 94% of what it generates to reach 46.5% coverage. Whether the buyer
pays for that energy depends entirely on the contract structure, and it is the right
question to put to a broker.

### pinned three ways

`validate_consistency` 25 -> 28: solar-only coverage cannot exceed the daylight fraction,
eight times the solar buys under eight points, and wind plus storage must break the
ceiling. The first is the load-bearing one - a coverage figure above the daylight fraction
would mean the arithmetic is wrong, not that the contract is good.

Exposed on `window` beside `fetchSolar` and `solarCrossCheck`. Three faults shipped this
week in code that was correct on disk and unreachable from a test.

---

## the coverage table is now visible - 1 Sep 2026

`wheelCoverage()` was callable but rendered nowhere. It now appears under the wheeling
cost, answering the question the panel never did.

```
contracted plant                covered   spilled
Solar 4x load                       41%       57%
Solar 8x load                       44%       77%
Solar 4x + battery 1x/4h            58%       38%
Solar 4x + wind 1x                  66%       50%
Solar 4x + wind 1x + battery        82%       37%
```

with a line beneath stating the ceiling: solar cannot pass 48% in that region because that
is the share of hours with any sun.

### two deliberate choices

**A fixed ladder rather than capacity sliders.** The point is the SHAPE - that solar stops
at the daylight fraction and diversity is what moves it - and a reader gets that from five
rows faster than from a control they must first discover. The second row deliberately
doubles the first to show the ceiling directly: twice the plant, three more points.

**Sized as a multiple of the load**, so the ladder means the same thing at 5 MW and 500 MW.
Verified identical at both.

### the spill column is the part a buyer has not seen

A solar contract at eight times the load spills 77% of what it generates to reach 44%
coverage. Whether the buyer pays for that depends entirely on the contract structure, and
the note says so rather than implying the energy is free.

Verified: renders, no NaN, scales with load. `audit.py` 59 -> 61.

---

## two modules from the reviewer's list - 1 Sep 2026

Both chosen because the data already existed. Neither is a new engine.

### green hydrogen: the finding inverts the usual framing

```
scenario         curtailed   500 MW electrolyser CF   LCOH R/kg
today                0 TWh                      0%           -
45 GW VRE         2.86 TWh                    4.9%         285
grid pace 2035   57.64 TWh                   47.8%          29
110 GW VRE      110.82 TWh                   58.8%          24
```

Curtailment-driven hydrogen is **not an early-transition play**. At the 45 GW build most
scenarios assume, an electrolyser on spilled energy alone runs at 4.9% capacity factor and
costs R285/kg against a grey benchmark near R30-45.

With energy free, cost is entirely capital recovery, so LCOH is inversely proportional to
capacity factor - verified independently to the rand. Positioning hydrogen as a way to
make today's build more economic has the causation backwards: today there is no
curtailment at all.

### grid-enhancing technologies: eight to 127 times cheaper per megawatt

The toggle modelled the capability and never the cost. Line cost uses the two published
routes reconciled on 31 Aug, R18.9-26.9m/km.

```
Eastern Cape - KwaZulu-Natal, 167 km, 3,080 hours a year at limit
new line                     R3.82bn      R2.55m per MW
dynamic line rating          R0.006bn     R0.033m per MW      76x cheaper
topology optimisation        R0.025bn     R0.208m per MW      12x cheaper
```

Per megawatt is the only honest basis: a line adds a corridor, sensors extract more from
the one already there. A line unlocks several times more, and the ratio says nothing about
whether the smaller amount suffices.

**The grid-enhancing capital costs are the weak input and are labelled as such** -
international ranges, no published NTCSA tender. The output is a ratio to interrogate, not
a business case.

### what was NOT built from the reviewer's list

Four of the seven suggestions were already substantially present - siting and headroom,
corporate PPA matching, nodal pricing, and distributed energy. Climate stress-testing
remains the largest genuine gap: nothing models heat degrading solar output or thermal
efficiency, or drought constraining cooling water, and today's work showed the model is
already tightest in summer.

---

## electrolyser siting - 1 Sep 2026

Built on the inverse relationship rather than on curtailment, because today curtailment is
zero everywhere and a curtailment-based tool would return nothing.

```
region            combined CF    headroom MW
Hydra Central           31.3%              0
Northern Cape           30.5%              0
KwaZulu-Natal           21.0%         11,000
```

The two best resources cannot connect. An off-grid electrolyser is worth most exactly
where a generator is worth least - which is the whole case for siting one.

### water reverses the answer, and that is the finding

```
resource only            Hydra Central · Northern Cape · Western Cape
+ water and port         Western Cape · Eastern Cape · KwaZulu-Natal
```

Electrolysis needs 9-10 litres per kg plus cooling, and the Northern Cape has the best
resource and the least water in the country. **Any siting analysis ranking on resource
alone points at the Karoo and is wrong.**

### honest about the layers

Resource and headroom are modelled. Water stress and port access are ASSERTED from public
knowledge as three coarse levels, deliberately not numeric - a hydrological or logistics
dataset would let them be scored properly, and inventing decimals would give a precision
the inputs cannot support. Industrial demand is not scored at all.

Boegoebaai is flagged as PROPOSED rather than counted as a port, which matters because it
is the entire export case for the Northern Cape.

**The weights belong to the caller.** Whether resource beats water beats export access is
a commercial judgement, so the function returns every dimension separately and the ranking
shifts completely across the three weightings shown. Presenting one blended index would
have hidden the only interesting thing in the result.

---

## correction: curtailment is not zero today - 1 Sep 2026

I wrote that "today curtailment is zero everywhere, so a siting tool built on it alone
would return nothing", and used that to justify building electrolyser siting on headroom
scarcity instead. **Wrong on two counts, and the user was right to push back.**

### the model does carry curtailment today

```
E.curtailed   0.000 TWh   ECONOMIC curtailment - correctly zero, nothing is spilled for price
congestMW     0.775 TWh   CONGESTION curtailment at the NERSA 4% ceiling
              1.936 TWh   at a 10% ceiling
```

I read the first and missed the second. `congestMW` is deliberately kept apart from
`curtailMW` so the price engine never mistakes a full corridor for national oversupply -
the separation is correct and the code says why, and I did not read far enough.

The model also already carried the context: the slider note records that NERSA approved a
4% congestion ceiling in September 2025 to unlock 1,180 MW of Western Cape wind, and that
curtailment in the first half of 2026 ran roughly an order of magnitude above all of 2025.

### the real-world point is larger than my error

IPPs report substantial curtailment with belated Eskom compensation. The likely mechanism -
that Eskom favours its own plant in dispatch now that there is surplus, absent a
competitive market - **is not modelled at all.** GridTwin dispatches on merit order
between Eskom and IPP plant, with no representation of self-dispatch preference or
contractual priority.

That is the same class of gap as the OCGT finding: the model prices energy, and real
dispatch includes considerations energy prices do not carry. It belongs on the open list.

### what changed in the tool

Congestion curtailment is applied as a FLAT NATIONAL HAIRCUT on wind and PV, so it cannot
attribute waste to a region and genuinely cannot drive siting alone - that part of my
reasoning survives. But regional curtailment does exist in the nodal MIP's region-major
`curtProfile`, and was being discarded. `mipActiveRes.regionCurtTWh` now exposes it, and
the siting function uses measured regional curtailment when a full run has been done,
falling back to headroom scarcity otherwise.

**The lesson is the one from this morning restated.** I reasoned about the model instead of
reading it, and the answer was in a variable twenty lines from the one I checked.

---

## three modules built, none visible - 1 Sep 2026

`electrolyserH2`, `electrolyserSiting` and `getsCompare` were all written, tested, exposed
on `window` and pinned in `audit.py`. **None of them appeared anywhere in the interface.**
Each was called exactly once - by its own definition.

This is the orphan fault I had already flagged and fixed for `wheelCoverage` in the same
session, and then repeated three times. `validate_structure` has an orphan check, but it
only catches functions that are never referenced at all; exposing one on `window` satisfies
it while leaving the feature invisible.

### the hydrogen panel

Sits beside the curtailment forecast, because hydrogen is what you do with curtailment.
Shows a ladder of electrolyser sizes against whatever the current scenario spills.

```
today, 4% ceiling      0.77 TWh congestion curtailment
110 GW VRE           110.82 TWh economic curtailment
congestion off             no curtailment - panel explains rather than showing an empty table
```

It names WHICH curtailment is driving the number. Congestion curtailment is output spilled
because a corridor is full; economic curtailment is surplus nobody wanted. They are
different phenomena and a reader deciding on an electrolyser needs to know which they are
looking at.

### still not visible

`electrolyserSiting` and `getsCompare` remain functions without panels. Both need a layout
decision - siting wants a ranked regional table, the grid-enhancing comparison wants to sit
with the network panel - and neither is wired yet. **Recorded here rather than left to be
noticed again.**

---

## to do: two modules built but invisible - 1 Sep 2026

Added at the user's request so they are not rediscovered.

**~~`electrolyserSiting`~~ DONE 1 Sep 2026.** Ranked regional table with the weighting as a
control, not a default. Verified across all four weightings.

**~~`getsCompare`~~ DONE 1 Sep 2026.** Panel sits between the network schematic and Where
To Build, with a six-corridor selector. Verified across corridors.

Both now have panels. The orphan check in `validate_structure` did not catch this class,
because exposing a function on `window` satisfies it while the feature stays invisible -
worth remembering rather than trusting the check.

---

## private transmission is a category the model does not represent - 1 Sep 2026

From reporting on 26 Aug: Impofu's 116 km line was privately permitted across **87 separate
land parcels** - private farms, state forestry, correctional facilities, municipal ground -
and now forms part of the national grid, wheeling to Sasol and Air Liquide at Secunda.
Nuweveld follows with 300 km.

GridTwin assumes NTCSA builds the network. It has no representation of privately funded
transmission, and the Independent Transmission Infrastructure Procurement Programme is
designed to make exactly that the norm - private capital funds, builds and transfers to the
state. Registered in SOURCES.md as watched.

Two things follow that are worth testing rather than assuming.

**The wheeling case is longer than the model's corridors.** Impofu generates in the Eastern
Cape and delivers to Mpumalanga. The wheeling panel prices region-to-region transport, so
that specific route is testable against a real contract.

**Air Liquide at Secunda is the hydrogen link.** It operates the world's largest oxygen
production there for Sasol, and is the most likely early buyer of green hydrogen in the
country. That is an industrial-demand anchor the electrolyser siting tool explicitly does
not model - and it sits in Mpumalanga, which scores mid-table on resource and has no port.

---

## the siting panel, and why the weighting is a control - 1 Sep 2026

```
weighting                          top three
resource only          Hydra Central · Northern Cape · Western Cape
resource+water+export  Western Cape · Eastern Cape · KwaZulu-Natal
export-led             Western Cape · Eastern Cape · KwaZulu-Natal
water-constrained      KwaZulu-Natal · Western Cape · Eastern Cape
```

**The answer changes completely, and that is the point.** KwaZulu-Natal has the WORST
combined resource in the country at 21.0% and leads the water-constrained ranking, because
electrolysis needs 9-10 litres per kg and the Karoo has none. A blended index would have
produced one plausible ordering and hidden the whole result.

So the weighting is a dropdown rather than a default, and the note beneath says outright
that switching it changes the answer.

### the table is honest about its layers

Modelled: resource from ten weather years, grid headroom from the GCCA, and measured
regional curtailment once a full run has been done - the column appears only then, and says
so when it is absent.

Asserted: water stress and port access, as three coarse levels. Boegoebaai is treated as
proposed rather than built, which matters because it is the entire export case for the
Northern Cape.

Not modelled at all: industrial demand. The note names Secunda specifically, because Air
Liquide's operation there is the most likely early hydrogen buyer in the country and it is
absent from the ranking.

### one still invisible

`getsCompare` remains a function without a panel. It belongs with the network panel and
wants a corridor selector, since the cost ratio scales with corridor length.

---

## the grid-enhancing panel, and the set is closed - 1 Sep 2026

Sits between the network schematic and Where To Build, with the corridor as a control
because the cost ratio scales with corridor length.

```
corridor                            line cost    cheapest option
Northern Cape - Free State, 90 km     R2.06bn    dynamic line rating   41x
Eastern Cape - KwaZulu-Natal, 167 km  R3.82bn    dynamic line rating   76x
Western Cape - Hydra Central, 278 km  R6.37bn    dynamic line rating  127x
```

**The ratio triples across the corridors offered**, because line cost scales with distance
while a set of sensors barely does. A single headline number would have been wrong on five
of the six corridors, which is why the selector exists rather than a default.

The six offered are the binding constraints from the headroom file - the corridors a
developer is actually queuing behind.

### the note does the work the table cannot

Per megawatt unlocked is stated as the only honest comparison, with the reason: a line adds
a corridor, these extract more from the one already there. The line unlocks several times
more, and the ratio says nothing about whether the smaller amount suffices. **It is a
screening question, not a business case**, and the panel says so.

Line cost is shown as a RANGE on every corridor, from the two published routes that differ
by 30% and cannot be reconciled. Device costs are labelled as international ranges rather
than South African tenders, and named as the number to interrogate first.

### all three modules are now visible

`electrolyserH2`, `electrolyserSiting` and `getsCompare` each have a panel. All three were
built, tested and exposed before any of them appeared in the interface - the lesson being
that `window` exposure satisfies the orphan check while leaving a feature invisible.

---

## EDMSA added to the published-model comparison - 1 Sep 2026

The panel previously ran one external comparison, against the CSIR least-cost study. It now
runs two, each at its own source's stated assumptions rather than ours.

```
metric                       model   published    gap   band
Coal share 2030, CSIR        57.5%         55%   +2.5     ±6
Renewable share, CSIR        35.7%         40%   -4.3     ±8
CO2 2035, EDMSA              123.8         124   -0.2    ±12
Wind 2035, EDMSA              64.1          64   +0.1     ±8
```

**The EDMSA gaps are -0.2 and +0.1.** Two models sharing no code, no data pipeline and no
authorship, one in PLEXOS and one in a browser, landing within 0.2% on 2035 emissions and
essentially exactly on wind output.

### the bands are wider than the gaps, deliberately

Agreement this close is partly coincidence, and pinning ±0.5 would fail on any legitimate
recalibration. The bands are set to catch a DRIFT AWAY from independent corroboration, not
to freeze a number. `validate_external` 2 -> 4.

### what the panel does NOT now claim

The existing caveat is untouched and still governs: this is a bracket, not a validation.
Nobody has run GridTwin and PLEXOS on identical inputs line by line. What the comparison
shows is that an independently built model, on different data and a different solver, lands
in the same territory.

The 2025 starting point is deliberately NOT in the table. EDMSA's 2025 emissions are 195 Mt
against our 174.5, and availability explains half a megatonne of the twenty. That is an
open question about scope or emission factor rather than a check to display, and it is
recorded in RESULTS.md as the first thing to ask them.

---

## the 20 Mt emissions gap, resolved by a third route - 1 Sep 2026

EDMSA Scenario a puts 2025 power-sector emissions at 195 Mt against our 174.5. Availability
explained half a megatonne of the twenty, so it needed a different answer.

**Eskom's own coal burn is that answer.** 96.5 Mt burnt in FY2026 for about 165 TWh, and the
implied emissions depend entirely on calorific value:

```
CV 19 GJ/t   ->  173.4 Mt   1.049 t/MWh     our emisCoal is 1.040
CV 20 GJ/t   ->  182.6 Mt   1.104 t/MWh
CV 21 GJ/t   ->  191.7 Mt   1.159 t/MWh
```

Our constant corresponds to roughly 19 GJ/t, which is defensible for Eskom's low-grade
burn, and we sit within 0.3% of Ember's power-sector figure.

### three numbers, three boundaries

```
Ember          175 Mt     power-sector CO2, all generators, CO2 only
Eskom          184.5 Mt   group Scope 1, ALL greenhouse gases as CO2e
EDMSA          195 Mt     boundary unstated
GridTwin       174.5 Mt   power-sector CO2, benchmarked to Ember
```

**They measure three different things and none is wrong.** Eskom's is CO2e across all
gases for the whole group; Ember's is power-sector CO2, which is the right comparator for a
power-system model. EDMSA's boundary is not stated in Scenario A.

The working is now in `validate_benchmarks` beside the constant, with the instruction to
ask WHICH BOUNDARY before anyone touches it. This is the number most likely to be
challenged, and the calorific-value sensitivity - 19 to 21 GJ/t moves the answer by 18 Mt -
is the part a challenger will not have.

### what this does NOT settle

Whether EDMSA's 195 is CO2e, a different calorific assumption, or a wider boundary. That
remains the first question to ask them, and it is now a precise question rather than a
vague discrepancy.

---

## testing EDMSA's own proposed trigger - 1 Sep 2026

Scenario A's Action 5 proposes a 5 GW per annum renewable addition trigger, convening a
flexibility review when annual additions exceed it. Tested at their assumptions.

```
annual rate      5 years   10 years
2 GW/yr             4.0%       4.0%
5 GW/yr             4.2%       9.8%
8 GW/yr             8.1%      25.9%
```

**The same rate produces very different outcomes depending on duration.** Five gigawatts a
year wastes 4.2% of renewable output over five years and about 10% over ten. A programme
running at 4.9 GW a year never trips the trigger and after a decade wastes close to a tenth
of what it generates.

So the trigger measures the wrong variable: the binding quantity is cumulative capacity
against demand, not the rate of addition. A trigger on installed VRE as a multiple of peak
demand, or on measured curtailment itself, catches what an annual rate cannot.

### the 4% floor is not oversupply, and that matters for their framing

The flat 4.0% at low build rates is the NERSA congestion ceiling, not economic surplus.
**It exists today at zero economic curtailment.** Their band 3 - "uncontrolled excess
capacity results in curtailment" - is therefore already partly occurring for a reason that
has nothing to do with excess capacity, which is the point the user made about IPPs
reporting curtailment while the system has surplus.

### the caveat that keeps this honest

Waste is a price, not a verdict. Our own frontier work has a 110-120 GW build throwing away
more than 40% of output and remaining roughly cost-neutral, because overbuild capex is
cheaper than the fuel it displaces. The useful question is whether waste is bought
deliberately or accumulated by inattention - and an annual rate trigger cannot distinguish
them. That distinction is the contribution, not the numbers.

Now in `validate_findings` with the scenario attached: 9/9 -> 11/11.

---

## heat stress: the reviewer's genuine gap, and it inverts the usual story - 1 Sep 2026

Of the reviewer's seven suggestions, climate stress-testing was the only substantial gap.
Built as a STRESS TEST rather than a forecast, because the model carries no temperature
data and inventing an hourly series would be worse than admitting its absence.

```
at +8degC                    unserved GWh
baseline                              5.5
thermal derate only                   8.1      +2.6
cooling demand only                 124.6    +119.1
both together                       162.7    +157.2
```

**Cooling demand does forty-six times the damage that plant derating does**, and the two
compound rather than add - together they produce 1.29 times the sum of the parts, because a
derated fleet meets a raised peak.

The popular account of heat and power systems is power stations struggling in the heat.
That channel is the smaller half by a wide margin.

### why it lands harder here than in Europe

This model sheds in January to March, and Eskom's measured dispatch agrees - 8.5 times more
peaker energy in Jan-Mar than Jul-Sep. **South Africa's tight season is its hot season.** A
northern-hemisphere system has heat and system stress in opposite halves of the year; here
they coincide, so every heat derate lands on the weeks already tightest.

### what this says about adaptation spending

The lever is cooling load, not plant cooling. Efficiency standards for air conditioning,
summer time-of-use signals and demand response contracted for hot evenings address the
119 GWh; upgrading condensers addresses 2.6. That is a testable claim, and it inverts where
adaptation attention usually goes.

### stated, not hidden

Solar and line-rating derates are computed and REPORTED but not injected, because neither
has a scenario lever - at +8degC they would remove a further 3.2% of solar and 6.4% of line
rating, so the numbers above are conservative. Drought and cooling-water limits are not
modelled at all, nor is the heat-and-low-wind correlation behind most northern-hemisphere
heat events.

---

## the invisible-feature fault, caught by a check rather than a user - 1 Sep 2026

Four times in one session a module was built, tested, exposed on `window` and pinned in
`audit.py` without appearing anywhere in the interface. Three were found by the user asking
"where is hydrogen?"; `heatStress` was the fourth.

### the audit

Forty-seven functions are exposed on `window`. Five have no caller, and four of those are
variables or called through a pattern the regex missed. **`heatStress` was the only genuine
orphan** - which is reassuring about the rest, and does nothing about the recurrence.

### why the existing orphan check cannot catch this

`validate_structure` has had an orphan check for months. It looks for functions never
referenced at all - and `window.heatStress = heatStress` is a reference. **Exposing a
function satisfies the check while the feature stays invisible.**

### the new check is a curated list, deliberately

Feature renderers must be called or bound to an event handler: `renderH2`,
`renderH2Siting`, `renderGets`, `renderHeat`. Harness hooks are explicitly excluded and
named - `fetchSolar`, `sarahCFAt`, `solarCrossCheck`, `wheelCoverage` are exposed for
testing and should not be reachable from the interface.

A general rule would have false positives on exactly those four, so the list is curated and
the reason is in the comment. Verified: unwiring `renderHeat` fails with "exposed but never
called or bound".

### the heat panel

Sits under load-shedding risk, with a hot-spell slider from 0 to 12degC. Shows the
DECOMPOSITION rather than the total, because the decomposition is the finding:

```
+5degC     thermal +2.0    demand  +46    both  67 GWh
+8degC     thermal +2.6    demand +119    both 163 GWh
+12degC    thermal +3.8    demand +332    both 500 GWh
```

Verified at four settings including zero, no NaN.

---

## the second reviewer list: what was built, and what was refused - 1 Sep 2026

Six suggestions. Two were already built, one was refused, one needs a market that does not
exist, and three were built or extended.

```
1 data centre siting      runDC() existed; ADDED curtailmentToCompute
2 synthetic grid data     REFUSED - no municipal networks to synthesise from
3 probabilistic forecast  P10/P50/P90 and the LOLE/EUE ensemble already exist;
                          short-term forecasting needs SAWEM
4 marginal carbon         BUILT - the standout, and it inverts the usual worry
5 battery revenue stack   arbitrage, ancillary, capacity and degradation exist;
                          simultaneous bidding needs the storage co-optimisation LP
6 non-wires ranker        transmission half built this morning; ADDED storage and DR
```

### the marginal carbon result

```
average    834 gCO2/kWh        marginal  1,026 gCO2/kWh
clean-margin hours: 35 of 8,760, rising to 7,678 at a 130 GW build
```

Coal sets the margin in 96% of hours, so average-factor accounting **undercredits** South
African renewable procurement by about 23%. The standard worry - that buying clean power at
night displaces nothing - is a northern-hemisphere concern that does not apply here.

### the non-wires result

A battery costs three times more per megawatt unlocked than building the line, and demand
response is roughly a wash. The caveat is in the write-up and it matters: per megawatt
unlocked prices ONE service and a battery sells several.

### two bugs found while building

`BLD_COST.batt` is an OBJECT, not a number. Reading it as a number gave NaN silently, and
the panel would have rendered a blank row rather than an error. Rule 11 caught it -
compute the bound before believing the number.

And the reachability check added an hour earlier **failed on a correctly wired renderer**,
because `run()` calls these as `window.renderX(...)` and my regex only matched bare calls.
`(?:window\.)?(?<![.\w])name` does not work either - after consuming "window." the
lookbehind sees a dot and rejects. Alternation is the only form that matches both.

### what I did not do, and why

**Item 5 needs the storage co-optimisation LP**, which is the largest item on the open list.
Simultaneous multi-service bidding is not a panel; it is a rebuild of how storage is
dispatched, and faking it with a heuristic would repeat the mistake that produced the
withdrawn 37% finding.

**Item 3 needs a target variable South Africa does not have.** Short-term price forecasting
requires a spot market with history to train on; SAWEM is expected Q4 2026.

**Item 2 I would not build at all.** Generating synthetic municipal networks for third
parties to test against is a product for a utility with data to protect. We have no
municipal network models to synthesise from.

---

## storage co-optimisation: the error is 1 to 6%, and it is all in reserve - 1 Sep 2026

The largest open item, approached by first measuring whether the problem exists.

### the model's stack does not cost energy

```
5 GW / 4h battery, reserve pricing off vs on
battery TWh        1.02 -> 3.48
pumped storage     3.43 -> 0.98
total               4.45 -> 4.45
```

Turning reserve on REALLOCATES between technologies and leaves total throughput unchanged.
So the feared double-count - a battery selling the same megawatt twice - does not show up
as lost energy in the dispatch.

### `storage_coopt.js` sizes what it does cost

One LP, energy and reserve decided together, with the constraint the stacked calculation
omits: `d[h] + r[h] <= MW`.

```
100 MW / 4h                       R m/yr   MWh out   MW-h reserve
energy only                        102.8   103,990             0
energy + reserve, STACKED          122.5   103,990       873,600
energy + reserve, CO-OPTIMISED     119.7   103,990       767,530
```

**Discharge is identical; the co-optimised battery holds 12% less reserve.** In the hours it
discharges, energy is worth more than reserve and it sells the dearer product. The error is
entirely over-claimed reserve, which is the more comfortable of the two possibilities -
only the ancillary line is affected, not every arbitrage figure in the model.

```
duration    R11.25/MW-h   R22.50   R45.00
1h                 4.7%     5.1%     5.6%
2h                 1.8%     2.4%     3.2%
4h                 1.5%     2.4%     3.8%
8h                 1.1%     2.0%     3.4%
```

At the durations South Africa is building, 2 to 4%. Smaller than capex uncertainty, and it
changes no published finding - but it is a one-directional bias and should be stated
whenever a battery revenue figure is quoted.

### three bugs found building it, all mine

**The reserve price units.** I used `asReserveRMWh` at R150 as R/MW-h. It is R150 per MWh of
reserve ENERGY, which is R1.31m/MW-yr - over six times the R197,100/MW-yr the model's own
saturation analysis reports. Reserve became so lucrative the LP held full power all year and
discharged nothing.

**The column extraction.** `c.Name || k` fails when HiGHS keys Columns by index - the exact
fault that cost four rounds on the pricing run this morning, repeated within hours.

**Duplicate objective terms.** I wrote `740.8 d_0` and `-60 d_0` as separate terms. **LP
format does not sum duplicates; it takes the last.** The discharge coefficient was -60, so
discharging looked like pure cost and the battery correctly did nothing. The LP was right
and my objective was wrong - a plausible answer from a broken input, which is the hardest
kind to catch.

All three produced a battery that did nothing, which at least fails loudly.

### what remains

This is a PRICE-TAKER analysis, not a replacement for the dispatch heuristic inside
`simulate()`. Making storage co-optimised in the model itself is still open, and is a
larger job: it changes how every scenario dispatches, not just what a merchant battery
earns.

---

## storage co-optimisation, now inside the model - 1 Sep 2026

The largest open item, closed for the network-aware path.

### the key realisation: energy was already co-optimised

`buildDayLP` has carried `ch`, `di` and `e` variables with state of charge chained across
days since it was written. **Storage energy has always been decided by the LP, not a
heuristic** - the heuristic is only in the instant path, which must stay instant.

What was missing was RESERVE. Two constraints close it:

```
rp: di + rs <= power     discharge and reserve compete for the SAME megawatt
rb: rs - e  <= 0         reserve must be BACKED by stored energy, not promised
```

plus a system requirement row with a soft shortfall variable, priced below unserved energy
so the LP sheds reserve before it sheds load - a hard constraint there would make a tight
winter evening infeasible rather than merely expensive.

### verified to bind, and verified to be inert

```
resFrac   cost          reserve   shortfall   discharge
0.02      174,182,690     6,206           0       1,668
0.07      174,182,690    21,720           0       1,668
0.20      185,368,486    57,600       4,456           0
0.50      418,078,486    57,600      97,540           0
```

Free at low requirement because storage has ample headroom; at 20% discharge collapses to
zero as reserve takes the power. That is the constraint working, not failing.

**And it is byte-identical at defaults.** South Africa prices no ancillary services, so
`resFrac` is zero, no reserve variable is emitted, and `lpMip === zeroLP` is asserted. If
that ever stops being true every published MIP result moves, which is why it is a check
rather than a comment.

Five assertions in `price_test.js`, where `buildDayLP` is reachable. I first put them in
`validate_solve`, which has never had access to the builder - reverted rather than
duplicating the extraction machinery.

### the reserve fraction comes from the engine, not from me

`(reserveRegulatingPct + reserveVrePct) / 100`. `validate_lint` caught my first attempt -
I invented `FIXED.reserveSharePct`, which is exactly the rule 7 failure the lint exists to
find. The contingency term is a fixed MW and cannot be expressed as a share of load, so it
is deliberately excluded: this understates the requirement rather than inventing a
conversion.

### what is still open

The INSTANT path still dispatches storage heuristically. That is a deliberate trade - it
must respond to a slider in milliseconds - and the honest position is that the network-aware
run is the co-optimised answer and the instant one is an approximation to it. Quantifying
the gap between them is the natural next step.

---

## quantifying the heuristic gap, and refusing to publish the headline - 1 Sep 2026

`gaplp.js` dispatches the model's own battery against its own prices two ways: the instant
heuristic, and an LP with perfect foresight.

**The first answer was 89.3%.** That is the shape of the withdrawn 37% claim, so it was
attacked rather than written up.

### what survives attack

```
                    revenue    discharged    average price achieved
heuristic            R327m       471 GWh              R694/MWh
perfect foresight  R3,066m       497 GWh            R6,169/MWh
```

Both move nearly the same ENERGY. The heuristic achieves R694/MWh against a market median
of R748 - **it discharges at roughly the average hour and is not targeting peaks.** That
statement needs no revenue figure to be believed and is the finding.

### what does not survive

```
price cap        heuristic captures
uncapped                     10.7%
R6,300                       13.6%
R2,000                       67.3%
```

Almost the whole gap sits in hours above R2,000. **A 1,800 MW battery is not a price taker
in a scarcity hour** - discharging into a shortage removes the shortage, so the R87,000
value of lost load does not survive its own arrival. The LP captures value that the act of
capturing destroys, which is precisely how the 37% claim died.

### two errors in opposite directions, both stated

The heuristic's revenue here EXCLUDES its charging cost while the LP's includes it, so the
heuristic is flattered. The LP has perfect foresight and a price-taker assumption that fails
where the value is, so the LP is flattered. Reporting either as a clean percentage would be
false.

### the useful conclusion is not a number

The co-optimised run is the answer; the instant one approximates it. Any battery revenue
figure quoted from the instant path should say so. **A percentage would have been more
quotable and less true**, and this file already carries one withdrawn finding from choosing
the quotable version.

---

## finishing the storage work: three things the finding itself demanded - 1 Sep 2026

### 1. the panel now states its dispatch basis

The finding says any battery revenue figure from the instant path should say so. It did not.
The battery panel now opens by naming the basis and pointing at the full run for the
co-optimised answer. Pinned in `audit.py`.

### 2. the finding is pinned - the TIMING claim, not the revenue gap

`validate_findings` 11 -> 13. It asserts the heuristic discharges near the median price,
with a threshold at 1.5x that would fire if it ever started targeting peaks.

**The revenue gap is deliberately NOT pinned.** Against perfect foresight it reads 89%, and
almost all of that sits in hours a 1,800 MW battery would price away by discharging into
them. Pinning a number I do not believe would make it durable, which is the opposite of
what a check is for.

### 3. two errors found while pinning it, both mine

**The published figure was mislabelled.** R694/MWh was the margin NET of the R60 cycle
cost, presented as a price achieved. The correct figure is R754 against a median of R748 -
a ratio of 1.01. The substance is unchanged and slightly stronger.

**The probe inherited a polluted scenario.** Probes in `validate_findings` share one window
and earlier ones mutate the scenario object - the oversupply check leaves 46 GW of wind
behind. That gave R1,141/MWh, and I nearly recorded it. Rebuilding from `FIXED` did not
work either: it lacks the slider keys `simulate` needs, so the run threw and my guard
skipped the check silently. Now it snapshots and restores, and fails loudly if the probe
returns nothing.

**A check that can silently skip is worse than no check**, because it reports a pass.

### what remains untested

The reserve co-optimisation has never run in a real browser. Same exposure as the pricing
run this morning, which passed every harness and failed on the first click.

---

## to do

**Test the reserve co-optimisation in a browser.** It has never run outside a harness. Same
exposure as the pricing run on 31 Aug, which passed every check and failed on the first
click. It is INERT AT DEFAULTS, so a normal full-year run exercises the unchanged path -
switch on reserve pricing under Network first, then run the full model.

---

## tutorial prose came back, and I put it there - 1 Sep 2026

Six panels built today carried **617 words of always-visible explanation**. The 30 Aug
session cut slider notes by 44% for exactly this reason, and I undid it panel by panel
without noticing.

```
                 before   after
hydrogen             73      24
siting              135      61
grid-enhancing       99      46
heat                115      57
wheeling coverage    71      38
marginal carbon     124   DELETED
total               617     226
```

A 63% cut, and the marginal carbon panel removed entirely at the user's call - module,
renderer and panel, not just hidden.

### what went wrong, specifically

Every one of those notes was explaining the FINDING rather than labelling the number. "The
common worry about 24/7 matching on a coal grid is that buying clean power at night
displaces nothing" is a good sentence for RESULTS.md and wrong on a panel: the reader is
looking at a table, not reading an argument.

**The findings belong in the file; the panel gets the caveat and the units.** What survives
is provenance - what is modelled, what is asserted, what is excluded - because a reader
cannot check those from the numbers alone.

### the pattern to watch

This is the third distinct kind of regression today after the invisible features and the
capitalised emphasis, and all three share a shape: something the project had already
decided, undone by me while adding something new. The decisions are in the documents; I was
not re-reading them between builds.

---

## the prose ratchet, and rule 12 - 1 Sep 2026

Two of today's three regressions are now checkable. This closes the third.

### a ratchet, not a budget

`audit.py` measures every always-visible note block and fails if the total rises above a
recorded ceiling. **4,098 words across 85 blocks; ceiling 4,100.**

A word BUDGET would have been the wrong instrument. Most of that prose predates today,
survived the 44% trim on 30 Aug and is accepted - a budget would either fail on day one or
sit so high it caught nothing. A ratchet judges the DIRECTION, not the current state: the
total may fall freely and may not rise without someone deliberately raising the ceiling and
saying why.

Verified by adding back roughly ninety words of the tutorial prose cut an hour earlier:
`PROSE: 4209 words, ceiling 4100`, and the audit fails.

### rule 12

**A decision the project has already made must be enforced by a check, not by memory.**

Three regressions today shared one shape - something settled earlier, undone while adding
something new. Features exposed on `window` but invisible. Capitalised emphasis returning.
Tutorial prose undoing a 44% trim. **Every one was caught by the user rather than the
suite.**

The documents record all three decisions. Recording them was not enough, because the
failure happens mid-build and nobody re-reads a governance file mid-build. The assertion
has to live where the work happens.

`validate_docs` caught the CALENDAR.md rule count within seconds of the rule being added,
which is the rule demonstrating itself.

---

## pricing curtailment - 1 Sep 2026

```
ceiling   spilled TWh   coal TWh   CO2 Mt   R/MWh   IPP revenue lost
    0%           0.00      164.8    173.7   582.2            R0.00bn
    4%           0.77      165.6    174.5   585.2            R0.70bn
   15%           2.90      167.6    176.6   593.2            R2.76bn
```

**The substitution is one for one** - 0.97 TWh of coal and 1.00 Mt of CO2 per TWh spilled.
That last figure recovers `emisCoal` of 1.04 from the differencing itself, which is a
useful check on the whole chain rather than just the headline.

### the asymmetry is the point

At the approved 4% ceiling: generators lose R0.70bn a year, about R910 per MWh spilled;
consumers pay R3.0/MWh, roughly half a per cent. **Concentrated on one party, diffuse on the
other** - which is exactly why curtailment compensation is contested, and why it took
belated payments to surface.

### what it does not show, said plainly in the write-up

Not that the ceiling is misused. Our own headroom data supports its existence: the two best
wind regions have zero connection headroom, so some spill is physical. And the model has no
dispatch-preference mechanism at all, so these are a FLOOR on any use beyond congestion.

`validate_findings` 13 -> 16. The ratio is tested by DIFFERENCING two runs that differ only
in the ceiling, not by reading one run's totals - and it snapshots and restores the scenario,
because probe pollution gave a wrong figure once already today.

---

# TO DO - revised 1 Sep 2026, end of session

Closed items are struck through with what settled them, so the same ground is not covered
twice. The sections above keep the full reasoning.

## Dated, and the only one open

1. **8 Sep - NERSA market inquiry into fixed and generation capacity charges.**
   `nersa_market_inquiry_submission.md` is drafted and ready, to
   electricity.marketinquiry@nersa.org.za. **Read the draft report before sending** - the
   submission states openly that we have not seen it, which is honest but weaker than
   responding to the document. Section 3 is the part built on reported findings rather
   than primary text and should be checked against what the report actually says.
2. **10 Sep - Seriti Green trading licence hearing.** Verified: Microsoft Teams, 13:30 to
   16:30. Attendance only; oral representations closed 28 Aug. Seriti is an outreach
   target and their July 2026 simulation is already a differential test in RESULTS.md.
3. **Oct - Price and Tariff Rule consultation.** The most consequential dated item, and the
   direct follow-on from the EPP submission. Watch for the consultation paper.
4. **Three calendar entries remain UNVERIFIED** and are marked as such in place: the Eskom
   RCA hearing, the TDP Rules target, the four instruments at 31 Oct. None is actionable,
   so the exposure is low.

## Needs the browser

5. **Look at the four new panels.** Hydrogen, electrolyser siting, grid-enhancing
   technologies, heat stress. All verified headless for content and NaN; none has been
   seen laid out. The heat panel moved below the levelised cost comparison this session.

## Model

6. ~~Instant-path storage stays heuristic.~~ **NOT A TASK - reclassified 1 Sep 2026 as a
   known limitation.** It contained three facts and no action.

   And the finding behind it needed a qualification it did not have. The instant dispatch
   order is deliberate and documented: **storage moves on state of charge**, not on price.
   It is a SYSTEM dispatcher serving net load, not a merchant optimiser. Measuring its
   revenue capture against a perfect-foresight LP judges it against an objective it does
   not hold - the same category error as expecting a merit-order model to reproduce
   Eskom's peaker running.

   What survives: battery revenue from the instant path understates what an optimising
   operator would earn, which is a caveat on interpretation and is now on the panel.
   **Improving the heuristic is explicitly NOT queued** - rule: no ordering heuristic can
   substitute for an LP when the logic needed is a value function on state of charge,
   proven by two rewrites and two reversions.
7. **Non-economic dispatch has no mechanism.** Priced this session - 0.97 TWh of coal per
   TWh spilled, R0.70bn a year to generators at the 4% ceiling - but the model still
   dispatches on merit order between Eskom and IPP plant. **Needs metered curtailment
   instructions by plant: a data request, not a modelling problem.**
8. **Drought and cooling-water limits are not modelled**, nor the heat-with-low-wind
   correlation. Heat stress covers demand and thermal derating only.

## Data

9. **1,823 MW solar gap** against `FIXED.pvUtilityMW`. SunCentral 342 MW the best
   candidate; needs #PowerTracker.
10. **Named-project layer** - the IPP Office annual overview, the only route to project
    names and the Hydra Central split.
11. **NERSA cumulative reconciliation** - SAPVIA 20,131 MW against NERSA 21,900 MW.
12. **EDMSA boundary question** - what produces 195 Mt for 2025 against our 174.5. Three
    numbers measure three different things; theirs is unstated.

## Publication and outreach

13. **`post_headroom.md`** - verified, ready, unpublished. The oldest unshipped item.
14. **Wind Pioneers note** - three variants drafted, use the ten-year version.
15. **EDMSA** - the boundary question above, plus whether "grid readiness adequate per TDP
    2023/24" reconciles with their own finding that grid absorption is binding.
16. **Energy Brokers** - the solar ceiling is directly useful to their offtakers.
17. **Findings ready**, Tier 1 and 2 only: the solar 49% ceiling, inverted tariff seasons,
    curtailment priced, hydrogen needing overbuild first, heat acting through demand.

## Repo

18. Remove `HANDOVER.md` from `.gitignore`; add the four custom instructions to Project
    settings.

## Closed this session

```
reserve co-optimisation tested in browser    ran clean, costs 1 part in 10,000
emisCoal || 0.95                             stale - pattern does not exist
sa_solar_grid.json                           decided: plausibility reference, pinned
electrolyserSiting, getsCompare, renderH2    all now have panels
ERTSA submission                             WITHDRAWN - no such process is open
```

---

## the KPI banner: three font sizes and a missing space - 1 Sep 2026

```
before   main prose, then <br> 10px build stamp, then <br> 10.5px pricing line,
         then back to main prose - and "no duals.Prices come from" with no space
after    continuous prose, one 10px footnote line, no <br> at all
```

The missing space was structural rather than a typo: each fragment ended a string without a
trailing space, so two sentences ran together whenever the pricing diagnostic appeared. The
three sizes came from bolting the build stamp and then the diagnostic on as separate
`<br><span>` blocks over two sessions.

Verified: one font size in the markup, zero `<br>` tags, no run-together sentences, no
double spaces.

### audit.py caught a real break in the same edit

Restructuring split "the dispatch chart are the optimal network-aware solution" across two
source fragments, so the pin failed. The RENDERED text is unchanged - checked before
touching the pin - so it was repointed at wording that survives in one piece rather than
relaxed. **A pin that greps source will break on a legitimate refactor; the answer is to
verify the output first, then move the pin, never to widen it.**

## a stale open item, and the real risk hiding behind it - 1 Sep 2026

Open item 5 flagged `emisCoal || 0.95` at line 5812 as a latent wrong answer. **The pattern
does not exist.** Every read is `p.emisCoal` or `S.emisCoal` with no fallback at all - it
had been removed and the item outlived it.

### but `simulate()` mutates its parameter object

```
p.costCoal = p.costCoal / keep + ccsOpexR + ccsCapexR + ccsTsR;
p.emisCoal = p.emisCoal * (1 - cap) / keep;
```

The CCS branch rewrites both in place, and `syncFloorMW` is derived onto `p` the same way.
That is safe only while `p` is a fresh copy per call. **If it ever becomes shared, or a
caller passes `FIXED` or the scenario object directly, enabling CCS once would poison every
later run** - and every number would stay plausible.

Tested: CCS off, on, off. 174.52 -> 27.76 -> 174.52 Mt. No leak, constants intact.

### now asserted, because the failure would be invisible

`validate_consistency` 28 -> 31: a CCS run must not change an identical run after it, CCS
must actually cut emissions, and the constants must survive. Verified against a build where
the branch writes through to `FIXED` - two of the three fire, naming the cause.

**The lesson is that the stale item was worth opening anyway.** Chasing a fallback that no
longer existed led to a real mutation with no guard on it.

## ERTSA submission drafted, and a de-capitalisation bug fixed - 1 Sep 2026

### the draft

`ertsa_submission_draft.md`, about 900 words. One point: Eskom ran 83% of its peaker energy
outside the season its own tariff calls expensive, and the low-season peak block prices
higher than the high-season one.

**It leads with Eskom's own dispatch, not with the model.** The first table needs only
Eskom's published hourly file and no model at all, which makes it checkable by a reader who
distrusts GridTwin entirely. The modelled shadow prices are the second table and are framed
as corroboration.

**It explicitly does not argue Megaflex is wrong.** Retail tariffs recover network and fixed
costs, the high-demand season does reflect peak DEMAND, and predictability is a real
constraint. The claim is narrower: demand and scarcity diverge here, so a structure aligned
to the first will not signal the second.

Limitations are stated rather than buried - one weather year, shadow prices not market
prices, and no dispatch-preference mechanism, which is the live curtailment question and
would move these numbers if material.

### and a bug in decaps_docs.py

The de-capitalisation pass on 1 Sep had a two-letter minimum, so single letters survived
inside words it had lowercased: `eskom'S`, `air'S`, `on A typical hour`. Fifty-eight
instances across two files, now corrected with targeted patterns rather than another
blanket pass - `and I should` and `capex R bn` are correct English and had to survive.

## heat stress panel moved down - 1 Sep 2026

```
was    line 480, directly under System adequacy
now    line 701, directly under Levelised cost comparison
```

Too prominent where it was. Heat stress is a SENSITIVITY, not a headline result - it sits
better below the cost comparison than immediately beneath adequacy, where its position
implied it was part of the core answer.

Verified after the move: markup intact, panel renders at all four slider settings, no
navigation anchor pointed at its old position. `nav-heat` is referenced only by its own
div, so nothing needed rewiring.

## an unsourced date cost a 900-word draft - 1 Sep 2026

The calendar carried "ERTSA written comments, ~7 Sep, INDICATIVE - confirm the date". I
drafted a submission against it without confirming. **There is no open ERTSA process:**
NERSA decided Eskom's 2026/27 application on 5 March 2026 and the tariffs took effect
1 April.

The entry warned me in its own text. I read the warning and wrote anyway.

### what is actually open

**NERSA's draft market inquiry into fixed charges and generation capacity charges**,
submissions to electricity.marketinquiry@nersa.org.za by 8 September, extended from
27 July. NERSA asks specifically for comment on the methodology and on the evidence in the
draft report.

**It fits our finding better than ERTSA did.** A generation capacity charge is levied on
peak DEMAND, and the dispatch evidence says demand and scarcity fall in different seasons
here. That is a sharper point for an inquiry into capacity charges than it was as general
comment on tariff structure.

### the calendar now requires a source per entry

Audited all eight hard deadlines: three cited a source, five did not. The Seriti hearing is
now verified independently - 10 Sep, Microsoft Teams, 13:30 to 16:30. The remaining three
are marked UNVERIFIED in place rather than deleted, because a date that might be right is
worth keeping and a date that LOOKS verified is not.

**An unsourced date is a guess wearing a deadline's clothes**, and that line is now at the
top of the section.

## the submission, reframed for the process that is actually open - 1 Sep 2026

`nersa_market_inquiry_submission.md`, about 850 words, to
electricity.marketinquiry@nersa.org.za by 8 September.

### the reframe is not cosmetic

ERTSA was about tariff structure generally. This inquiry is about the GENERATION CAPACITY
CHARGE specifically, and that sharpens the argument: a capacity charge exists to recover
the cost of capacity built for the tightest hour, so a seasonal definition that does not
identify the tightest hours is a defect in the instrument rather than a general observation
about tariff design.

### section 3 is the part that engages their own framing

The draft findings, as reported, note that customer impacts depend on **the ability to
respond to tariff signals**, citing agricultural customers constrained by production
cycles. That asks who can follow the signal. Our evidence raises the prior question: **if
the seasonal definition does not match when the system is short, a customer who responds
successfully has shifted load away from hours that were not the tight ones.**

The cost of inflexibility and the accuracy of the signal are separable, and only the first
appears to be examined.

### one metric computed and DISCARDED

I tried to show which month is capacity-tightest by monthly minimum supply margin. It
clipped at -3,700 MW in nine of twelve months - a floor, not a scarcity signal. Dropped
rather than presented, because three independent pieces of clean evidence beat four with
one that invites a methodological objection.

### what it says about itself

**"We have not seen the full draft report."** Stated in section 5, with the note that
sections 1 and 2 stand independently of any reading of it. That is honest and it is also
weaker than responding to the document - which is why the to-do says read it first.

## item 6 was not a task, and the finding behind it overreached - 1 Sep 2026

Asked whether task 6 was done. It contained no action - three facts about a limitation.
Checking why led somewhere more useful.

**The instant dispatch order is deliberate and documented at the code**, settled 14 Aug:
nuclear, hydro and imports are fixed infeeds; coal is must-run within unit-commitment
limits; **storage moves on state of charge**; gas and diesel are the flexible margin. A
naive cheapest-first sort was rejected because it would flex a take-or-pay contract and
erase coal-forced curtailment.

So the model's storage is a SYSTEM dispatcher serving net load. **It is not trying to
maximise revenue.** Reporting that it "is not targeting peaks" was factually correct and
framed as a shortcoming. It is neither trying nor failing.

This is the same category error as the OCGT finding - expecting a merit-order model to
reproduce dispatch driven by something other than merit - and I made it again three weeks
later on a different quantity.

The RESULTS.md section is retitled and now carries the qualification. The pinned check is
unaffected: it asserts the ratio is near 1.0, which is a fact about timing and does not
depend on the interpretation.

## end-of-day sweep: one real bug, one false alarm - 1 Sep 2026

Eight scenarios, checked for energy balance, negative or non-finite values, carbon
consistency and deletion residue.

### the real bug: a dropped residual

```
if(residual>1){ ... stack.unserved[h]=residual; }
```

A shortfall under 1 MW was **discarded**, not recorded. The hourly balance therefore failed
by up to 0.8 MW in the one hour a year where diesel hit its cap with a sub-MW shortfall
left over.

**Immaterial as energy** - 0.8 MWh in a year, one hour in 8,760. **Not immaterial as a
property**: a balance that is exact everywhere except the hours that matter most is the
wrong approximation, and 914 checks did not catch it.

Fixed so the energy is always recorded while the **1 MW floor still governs the SHED
STATISTICS** - a 0.8 MW shortfall is not load shedding, and counting it would put a stage-1
event in the record for a rounding residual. Balance now exact in all eight scenarios;
unserved totals unchanged to a tenth of a GWh; all 16 published findings unmoved.

### the false alarm: carbon

Recomputing CO2 as energy times emission factor differed from the model by 1.2% today and
9.1% at a 120 GW build. **The model is right and my check was naive.** It charges emissions
on FUEL BURNT, not energy sent out, so the gap tracks `partLoadF` almost exactly - 1.19%
against 1.0125, 9.10% against 1.0977. The CCS case differed by 83% because the CCS branch
mutates `emisCoal` and my recompute used the unmutated constant.

### also checked, and clean

Marginal carbon deletion left no residue - five identifiers, zero references. No orphan
panel bodies. No negative or non-finite values in any stack series across eight scenarios.
Worker still parses.

### where the check went

First placed in `validate_invariants`, which has no probe helper - `probe` there is a script
element inside a loop, not a function. Reverted rather than duplicating the harness
machinery, and placed in `validate_consistency` where `run()` exists. 31 -> 35, and it
fails on both scenarios when the old threshold is restored.

## shouted emphasis returned a second time, in the code - 1 Sep 2026

The user spotted "the lamps show the TYPICAL year" in the adequacy tooltip. Sweeping every
prose string in `index.html` found **85 distinct words, 113 occurrences** - far more than
the two visible on that screen.

```
this morning   markdown documents      2,648 words de-capitalised
this evening   JavaScript strings         87 words de-capitalised
```

The first pass covered the documents and stopped there. Tooltips and panel notes are built
from string literals in code, so nothing touched them and 918 checks had nothing to say.

### now checked, and it catches one word

`audit.py` scans every quoted string that looks like prose and fails on any capitalised word
outside an allow-list of acronyms and code identifiers. Verified by restoring a single
instance: `SHOUTING: 1 occurrences across 1 words`, and the audit fails.

That is the third house-style decision now enforced by a check rather than by memory -
after the prose ratchet and the feature-reachability list. **Rule 12 in practice: this one
had to be made twice before it was asserted.**

### the allow-list is the load-bearing part

Ninety-odd entries: units, technology acronyms, institutions, and code identifiers like
`FIXED`, `MONTHS` and `COLORS` that appear inside template literals. Without it the check
would fire on every legitimate mention of `TWh` and be switched off within a day.

## clicking Pipeline highlighted Prices - 1 Sep 2026

Reported from the browser: the jump nav scrolled to the right section and lit the wrong tab.

### the cause is an assumption, not a typo

```
nav order    Scenario  Network  Where to build  Build rates  Pipeline  Results  Prices
DOM order    Scenario  Results  Network  Where to build  Build rates  Pipeline  Prices
```

**`nav-results` sits at DOM position 781, above `nav-network` at 847, but reads fifth in
the bar.** That is deliberate - the bar follows a reading order, the page follows a layout
one.

The spy walked the NAV order and broke at the first section not yet passed. Reaching
Pipeline, the out-of-order Results was already above the bar, so the loop did not break, it
carried on, and Prices claimed the highlight.

The comment above that loop explains why it was rewritten away from IntersectionObserver
and calls the rule "deterministic". It was deterministic and it was wrong, because it
encoded an assumption nobody had checked.

### fixed by sorting on document position

`pairs.sort(compareDocumentPosition)`. Nav order no longer matters. Simulated at every
section: all nine light correctly, including Pipeline.

`validate_structure` 21 -> 22 asserts the sort is present, and fails with "the nav bar
assumes its links are in DOM order, and they are not" when removed.

## the PPA export was writing hollow files - 1 Sep 2026

Reported as a UX complaint - the export makes you type a province name. There was a bug
behind it.

### a typo produced a plausible CSV with no data in it

`prompt()` returned free text. `wind_pu[reg]` on an unrecognised string returned undefined,
the null was carried through, and the user got a file with the **price column populated and
both profile columns empty**. No error, no warning. It looks like data.

Three fixes:

**A picker, not a prompt.** Cannot be misspelled. Ten regions, taken from the profile file
itself so the list is exactly the regions that have profiles - building it from a separate
constant is how an option that cannot be exported ends up in the list.

**Validation.** An unrecognised or unloaded region now refuses and says why, rather than
writing a hollow file.

**Populated on the unconditional fetch.** My first attempt put the population inside
`bldLoadRegionalData()`, which is LAZY - it only fires when Where To Build is opened, so
the picker was empty on a page the user had never scrolled. Caught by the picker rendering
with zero options.

### on placement, which was the original question

The button sits in Hourly dispatch, beside the CSV export. That is defensible - both export
hourly series - but the two are for different readers. The dispatch CSV is a system view;
the PPA series is a project-developer artefact, and the panel it sits in is about
representative weeks rather than about prices.

**Not moved.** It is a judgement about information architecture rather than a defect, and
the Prices panel or Project Planning would both be arguable homes. Worth deciding
deliberately rather than as a side effect of a bug fix.

### also, the extremes blurb

Trimmed as asked, from three sentences to one. The two removed sentences explained the
finding rather than labelling the numbers - the same habit the prose ratchet now guards
against.

## the price duration curve was not inverted - it was unreadable - 1 Sep 2026

Asked whether the curve was inverted. It was not: 87,000 on the left, 715 on the right,
and the SVG confirms high-left low-right, which is the convention.

**But the instinct was right about something.** On a linear axis one hour at the value of
lost load set the entire vertical range:

```
percentile   price      position down the chart
  0%       R87,000                  0.0%
  1%        R6,206                 93.6%
  5%          R762                 99.9%
 50%          R748                100.0%
```

**95% of the year sat in the bottom 0.1% of the chart.** Correctly oriented and completely
uninformative.

### log scale, which is the convention for scarcity-priced markets

The 1st percentile moved from 93.6% down to 33.9% down, so the diesel-priced hours are now
visible instead of hidden in the baseline. Floored at R1 so a zero or negative hour cannot
produce a negative logarithm.

### the body stays flat, and that is TRUE

95% of hours fall between R715 and R762 - a 6.6% spread. No axis choice will make that look
interesting, and distorting it to try would be worse. It is the same fact as the tariff
finding: every Megaflex block median sits between R737 and R755. **South African prices are
genuinely almost flat with a tiny extreme tail**, and the chart should say so rather than
flatter itself.

Axis now labelled "log scale" so nobody reads the spread as linear.

### PPA export moved to the prices panel

It was beside the dispatch CSV in Hourly dispatch. Both export hourly series, but the
dispatch CSV is a system view and the PPA series is a developer artefact whose main content
is the price series. It now sits with the prices. Picker and button moved together; verified
still populated with ten regions and defaulting to Northern Cape.

## capture price: a definition, and the battery row - 1 Sep 2026

### an 18-word note

"Generation-weighted averages over the year: what each technology earns per MWh it actually
produces."

A reader seeing four technologies with different prices for the same commodity needs to know
the number is weighted by output. Without it the table looks like an error rather than a
result.

### the battery row was computed all along and never shown

`priceStats.capture.batt` existed; only wind, solar and coal were rendered. It is arguably
the most informative row on the table:

```
Wind            R977    98%
Utility solar   R756    76%
Coal          R1,034   104%
Battery         R774    78%
```

**A battery discharging on price should capture ABOVE the average. This one lands at 78%.**
That is the instant engine dispatching storage on state of charge rather than on price - the
limitation reclassified earlier today - and showing it makes the limitation visible in the
tool rather than only in the documents.

### the prose ratchet fired on my own addition

4,116 words against a ceiling of 4,100. Eighteen words over, and the audit refused. Raised to
4,120 **deliberately**, with the reason recorded at the constant - which is exactly what a
ratchet is for. It forced the decision rather than letting the total drift, and it fired on
the person who built it within hours of it being built.

---

*GridTwin ZA. Code and documentation © 2026 Nick Hedley, released under CC BY-NC-ND 4.0.
Data files carry their own terms — see sources.md. Model outputs are reproducible from
the scenarios stated; nothing here is a tariff, a forecast, or investment advice.*
