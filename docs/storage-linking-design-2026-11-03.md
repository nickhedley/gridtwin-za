# Representative days and stored energy in the build LP: design for review

TODO 14mo, brought before the note (Nick's decision, 3 Nov 2026, message 668). Design only: nothing is built until Nick approves
(668 (d)). Scope (668 (c), widened by 669 and 670): linking stored energy across the year's days, and the representative days'
weights and mapping that the linking needs. Weather years stay out (669 (e)). The page default stays unchanged until Nick decides.
Any choice made here without Nick follows modelling best practice and rule 366; each is marked "(ours, rule 366)" with its basis.

Sources. Kotzur, Markewitz, Robinius and Stolten, Time series aggregation for energy system design: modeling seasonal storage,
Applied Energy 213 (2018) 123-135 (arXiv 1710.07593). Mantegna, Ricks, Manocha, Patankar, Mallapragada and Jenkins, Establishing
best practices for modeling long duration energy storage in deeply decarbonized energy systems (arXiv 2404.17474, 2024). tsam,
Kotzur's time-series aggregation library, for extreme periods (message 670's basis). The Energy Systems 2022 study
(doi 10.1007/s12667-022-00533-4) could not be identified. arxiv.org, link.springer.com, doi lookups and tsam.readthedocs.io are
all blocked in this container. The first two papers were read as search extracts at abstract level, and tsam's option for weights
is taken from message 670. All three should be read in full once those hosts are allowed.

## 1. What the build LP uses now (669 (a), 670 (a))

- The pathway LP (bldBuildLP, index.html:12306) calls bldRepDays(12) (index.html:12308). That gives 12 calendar days from the
  reference year, each weighted 365/12 = 30.4167 days. The reference year is profiles.json, Eskom's hourly data for calendar 2025.
  The chain rows carry exactly that weight: c7's soc_batt_2040_162 has 30.4167 on discharge and 26.7667 (0.88 x 30.4167) on charge.
- Four of the 12 are chosen extremes (checked on the page, 3 Nov 2026):

  | Day | Date (2025) | Chosen as |
  |---|---|---|
  | 218 | 7 Aug | tightest net-load hour |
  | 359 | 26 Dec | slackest day |
  | 162 | 12 Jun | middle of the worst three-day net load |
  | 195 | 15 Jul | middle of the worst three-day wind lull |

- The other eight are evenly spaced days. Each was re-chosen within its 45-day block so that new wind and tracking solar match their
  twelve-year means (message 125 (1)). The choice depends on the run's wind and solar settings: c7's runs have 20, 72, 95, 159, 201,
  269, 271 and 355; the page default gives 4, 67, 95, 176, 211, 227, 275 and 320.
- Stress days, at weight 1:
  - the seed tail, the worst seven-day net-load window across the twelve weather years (days 1000-1006), in every year;
  - from pass 2 on, the engine check's failing windows, in the years where they fail.
  
  c7's central, Deep and Fossil-free runs stopped at pass 1, so each of their modelled years has 7 stress days.
- Total: 19 modelled days a year, 456 operating hours. The 288 calendar hours stand for 8,760.
- Two corrections in RESULTS:
  - The vanadium entry's "each day standing for 22.8 days" was an arithmetic slip (365/16 for 365/12).
  - The 'representative days test' entry put the four roles on the four days in calendar order. Day 162 is the middle of the
    worst three-day net load, not the tightest hour; the tightest hour is day 218.
- The page's regional LP (bldBuildRegionalLP, index.html:13957) calls bldRepDays(8), without the tail (index.html:13974).

## 2. Our chained days against Kotzur's formulation, and why ours overvalues stored energy (669 (d))

### How the two formulations work

Ours (bldBuildLP, from index.html:13015):
- Each store has one level per representative day, e_<store>_<y>_<d>: the level at the end of the block of real days the day
  stands for.
- soc_ moves it by weight x (efficiency x charge - discharge) over the day.
- ecap_ holds the block-end level within capacity.
- cla_/cua_/clb_/cub_ hold the hourly level within zero and capacity on the block's first and last real day.
- Each year opens half full of existing capacity and must end at least as full (send_).

The year is therefore 12 blocks of 30.4 identical days, in calendar order.

Kotzur et al. (2018):
- Two states.
  - Intra-period state: each typical day's movement from its own start. It begins at zero, and every real day mapped to that
    typical day shares it.
  - Inter-period state: one level at the start of every real day of the year.
- The real days are linked in their original calendar order: the next day's level equals today's level plus the net movement of
  the typical day today is mapped to.
- In every hour, the level is the sum of the two states and is held within zero and capacity. Kotzur bound it using each typical
  day's highest and lowest intra-period movement.
- The year is cyclic.

### Why ours overvalues stored energy

1. The extremes repeat for a month each.
   - With equal weights and blocks in calendar order, winter runs as follows:
     - 9 Jun for 30.4 days;
     - 12 Jun, the worst three-day net load, for 30.4 days;
     - 15 Jul, the worst wind lull, for 30.4 days;
     - 21 Jul for 30.4 days;
     - 7 Aug, the tightest hour, for 30.4 days.
   - So five blocks in a row, about five months of chained days, include three months made of three of the year's worst days. A
     store filled in the blocks before is credited with covering a month of the worst net-load day.
   - Measured: R1,301bn of vanadium's R1,305bn value sat in one row. That row was ecap at the end of 2040's day-162 block
     (RESULTS 'Why no coal retires early, and what makes Fossil-free's vanadium worth building').
   - The engine needed none of it. It is chronological over 8,760 hours in twelve weather years, and without vanadium it found
     0.00 GWh unserved in every year.
2. Every day in a block is identical. Each moves a store by the same amount, so a store can bank 30.4 times a small daily surplus
   at a perfectly steady rate. Real days alternate surplus and deficit, so a month's net is smaller and the level swings more.
3. A real day's neighbours are lost. Within a block, the real sequence of different days (a calm spell after a windy one) is
   missing. This can push value either way.

Mantegna et al. (2024) find that unlinked representative periods understate long-duration storage's value, and they set Kotzur's
linking as the practice to follow. Ours is linked, but at block level with equal weights, so its error can run the other way, as
the vanadium decomposition shows. The fix keeps Kotzur's structure and departs from it only in two places, both set out in 3.3:
the year's opening level (cyclic, as Kotzur) and the stress windows (not linked).

## 3. Proposed formulation

### 3.1 Mapping and weights (670 (c))

- Every real day of the reference year maps to one representative day. Each representative day's weight is the number of real
  days mapped to it, so the weights sum to 365.
  - This is the condition for stored energy to close. The year the costs are counted over and the year the stores move through
    become the same days (acceptance test 2).
  - Linking needs the same mapping, so one mapping serves both.
- The four extremes each map only themselves, at weight 1. Basis:
  - tsam's 'append' option for extreme periods (message 670's basis);
  - our own stress days, which already weigh 1.
  
  Keeping a cluster's full weight on an extreme is tsam's worst-case design option, and our equal weights are that option in
  effect. Adequacy is not weakened. The planning reserve row takes the annual peak as the highest hour over the days, unweighted
  (index.html:13100), so the tightest-hour day still sets it. The stress windows still enforce the twelve years' worst week.
- The other 361 days each map to the nearest typical day (ours, rule 366; tsam's default distance):
  - compared on their hourly profiles of demand, new wind and new tracking solar;
  - each profile normalised to 0-1 over the year;
  - Euclidean distance over the 72 values;
  - ties go to the earlier day, so the mapping is deterministic.
- The day matching of message 125 (1) is redone on the new weights, keeping the twelve-year energy match (ours, rule 366; basis:
  message 125 (1) and RESULTS 'representative days test', extended to unequal weights):
  - The typical days are still one per evenly spaced block. Each candidate set is mapped, its typical days are weighted by their
    counts, and the extremes enter at weight 1.
  - The score is as now: squared misses of new wind and tracking solar against their twelve-year means, in points of capacity
    factor, plus a quarter of demand's miss in 100 MW steps.
  - Demand's reference becomes the reference year's own mean, now that the weights cover the whole year.
  - Coordinate descent over the blocks from the same nine starting offsets, recomputing the mapping at each step. That is 12 x 365
    distances, about a second.
  - Day choice and weights depend on each other, and the descent settles both.
- The same rule serves other day counts. At n days: the four extremes, plus n - 4 typical days from blocks of 365/(n - 4). At 365
  days every day is its own representative at weight 1. That is the full-hourly benchmark of section 6.
- Considered and not proposed:
  - Re-clustering the typical days (k-medoids). That is a larger change, and it loses the twelve-year match unless the match is
    re-imposed.
  - A balanced mapping that keeps 30 or 31 days per representative day. Kept only as the "linking only" variant of 670 (b),
    which isolates linking from the weights.

### 3.2 Linking (668 (d))

For each linked store s and model year y:

- New variables:
  - lv_<s>_<y>_<i>: the level at the start of real day i (i = 0 to 364);
  - cmx_<s>_<y>_<k> and cmn_<s>_<y>_<k>: representative day k's highest and lowest intra-day movement.
- Kept: c_<s>_<y>_<k>_<h>, the intra-day movement from the existing cr_ rows (charge x efficiency less discharge, cumulated
  over the day).
- New rows:
  - lnk: lv_(i+1) - lv_i - c_<k(i)>_23 = 0, with the last day closing back onto day 0, so the year is cyclic and holds no energy it
    did not store;
  - hi: lv_i + cmx_<k(i)> <= capacity (existing plus built);
  - lo: lv_i + cmn_<k(i)> >= 0;
  - cmx_k >= c_k_h and cmn_k <= c_k_h, for every hour.
- Replaced on calendar days:
  - soc_ (the weighted block balance);
  - send_ (the half-full opening), by the cyclic year;
  - ecap_ (the block-end level), by hi at every real day;
  - cla_/cua_/clb_/cub_ (the hourly checks at the block's two ends), by hi and lo;
  - the e_ variables on calendar days.
- Lithium's reserve rows (rbe_/rbq_) on calendar days take the lowest level over the real days mapped to the day:
  - new: lvmin_k <= lv_i for each mapped day i;
  - then hold x reserve <= lvmin_k + c_k_h.
- Unchanged:
  - cr_, dur_ and the power rows;
  - every stress-day row.
- Linked stores: all of bldBuildLP's STORE list. That is lithium, vanadium, iron-air, new pumped storage (both sizes), existing
  pumped storage, and the virtual power plant's enrolled batteries.

### 3.3 What stays as it is, and the two departures from Kotzur

- Stress days stay outside the sequence. Each window keeps its hourly levels (sh_/shc_) and its cyclic opening: it may start at any
  level, but it must end there. So a window gets no energy it did not store within itself (ours, rule 366: the conservative
  option).
  - The tail and loop windows come from other weather years. Splicing them into the reference year's sequence would join two
    years' weather.
  - Kotzur's formulation has no stress windows, so this is an addition, not a departure.
- The opening level becomes cyclic. Today each year opens half full of existing capacity; under the fix, day 0 closes on day 364.
  This is Kotzur's convention (ours, rule 366).
- Each model year's sequence is cyclic on its own, with no carry-over between years, as now.
- Self-discharge stays out of the LP, as now.

## 4. Size of the LP

Measured on c7's pass-1 LP: 398,529 rows and 229,570 columns, with 6 linked stores over 15 years (90 store-years).

| At 12 days, per store-year | Rows | Columns |
|---|---|---|
| Removed | about 1,152 (soc 12, ecap 12, cla 288, cua 288, clb 276, cub 276, send) | 12 (e_) |
| Added | 1,671 (lnk 365, hi 365, lo 365, cmx 288, cmn 288) | 389 (lv 365, cmx 12, cmn 12) |

- Net over the LP: about +46,700 rows and +33,900 columns. Lithium's reserve minimum adds about 5,500 rows and 180 columns.
- In total, about +13% rows and +15% columns.
- More days, for the convergence test:
  - The LP grows in proportion to the modelled days: (n + 7)/19 of today's size at n calendar days.
  - That is about 1.7 times at 25 days, 3 at 50, 5.6 at 100 and 11 at 200. A one-year LP is about a fifteenth of these.
  - The linking rows are fixed at 365 per store-year, so their share falls as n rises.
- The 365-day benchmark for one year is about 520,000 rows. That is the size of a full pathway LP, so it is solvable.

## 5. Solve time, and whether it is workable

Solve times now (one pass, native simplex):

| Run | Seconds |
|---|---|
| Central | 817 |
| Deep | 680 |
| Fossil-free | 266-302 |

Re-solved from the dumped LP under a heavily loaded machine, the central took about 14 minutes.

The best precedent is the hourly state of charge added on 8 Oct (RESULTS 'Hourly state of charge in the build LP'). It made the
LP 50% larger and took 5.1 times as long. Chained storage rows are expensive.

- At 12 days: +13% rows, likely 1.2 to 2 times today's solve time (ours). This would be workable on every pathway.
- At more days: if solve time grows with the 1.5th to 2nd power of size (ours, to be measured):
  - 50 days: 5 to 9 times, 70 to 130 minutes a pass on the central;
  - 100 days: 13 to 31 times, 3 to 7 hours a pass.
  
  Above about 50 days, pathway runs would outgrow the 2-hour pieces, though they can resume across pieces.
- The convergence test (6) measures the real factors on one-year LPs. The day-count recommendation (669 (c)) comes from it.
- If the count needed is not workable, the options are below. Nick decides; none is chosen here:
  1. a lower count, if its measured error is acceptable;
  2. interior point (HIGHS_SOLVER=ipm), used for s_nogas;
  3. a rolling horizon (FIX_FROM/FIX_TO by year);
  4. a high count in some years only (for example 2030, 2035 and 2040), with the rest at 12.

## 6. Acceptance tests, reported before any pathway is rerun (668 (f), 669 (b), 670 (b))

The tests use one-year 2040 LPs: HORIZON=2040, with the years before fixed from the run. Fossil-free is fixed from s_ff2040_c7,
with vanadium allowed, since that is the run where its value was found. The central is fixed from c7.

The benchmark is REP_DAYS=365 on the same reference year and stress days. Every day is its own representative at weight 1, and
the existing daily chain at weight 1 is exactly chronological. If its solve fails, the closest sound benchmark is reported
instead (proposal: REP_DAYS=183, every other day at weight 2, linked).

Two settings, so that the causes can be separated (670 (b)):

| Setting | Values | Default |
|---|---|---|
| bldRepWeights | 'equal', or 'mapped' (3.1) | 'equal', as now |
| bldStorageLink | 0 (as now), or 1 (3.2) | 0 |

| Test | What it checks |
|---|---|
| 1. Variants against the benchmark | Four variants on Fossil-free 2040 and on a 2040 central state: current; weights only (mapped weights, the current block chain); linking only (balanced mapping, 30 or 31 days a day); both. Objective and builds by technology against the benchmark, and where vanadium's value sits (decomposition as RESULTS'). No assumption about which cause matters more, or which way cost moves. |
| 2. Closure | Over the sequence, each store's net is zero, so no energy is created over the year. The sum of weight x daily net over the representative days equals it. The level reconstructed hour by hour (lv + c) stays within zero and capacity on all 365 days. |
| 3. No long-duration storage | The central 2040 (lithium, existing pumped storage, the virtual power plant), linked and unlinked, with the differences explained. |
| 4. Engine check | The engine check (pathcheck YEARS=2040, twelve weather years, chronological) on each variant's 2040 build. |
| 5. Suite | validate_lp and the suite with the settings off: the LP text and keys unchanged, and failures compared with main's known ones by name. |
| 6. Convergence (669 (b)) | Both settings on, REP_DAYS = 12, then about 25, 50, 100 and 200, as far as solve times allow, on Fossil-free 2040. Objective and builds against the benchmark at each count, with solve time. Two or three counts on the central 2040. |
| 7. Recommendation (669 (c)) | The day count for the pathway runs, with its measured error reported separately for cost and for capacity by technology, and its solve time across pathways, measured on the central's full LP at that count. |

## 7. Builders and callers of the representative days (670 (d))

| Where | What | With the fix |
|---|---|---|
| bldRepDays (index.html:11965), bldRepDaysMatched (11926) | choose the days and weights | change: mapping, weights, matching on the new weights (behind bldRepWeights) |
| bldBuildLP (12306), rd = bldRepDays(12) at 12308 | the pathway LP; weights reach every weighted term (objective, CO2, gas, energy rows) | change: weights and linking behind the two settings |
| bldStressLoop (13424), bldStressLoopPerYear (13457), runBuildOpt (13590) | the page's build optimiser, which calls bldBuildLP | take the fix only when Nick changes the page default |
| bldBuildRegionalLP (13957), bldRepDays(8) at 13974; runDelayAnalysis (16345) | the page's regional LP, browser-sized, not used by the pathway runs | unchanged (proposal; validate_lp audits its soc_ family, which stays) |
| harness/pathway/pathway_perfail.js (REP_DAYS at 506) | the pathway runs | pass-through for both settings; REP_DAYS keeps working |
| harness/validate_lp.js (13 bldBuildLP, 7 regional), validate_solve.js, gapdiag.js, pathway/c6e/gashourly_c6e.js, pathway/psboth.js, ext/hs_lp.js | checks and tools that build LPs | unchanged with the settings off (the default) |
| harness/pathcheck.js | the engine check: mentions bldBuildLP in a comment only | unchanged |

## 8. What remains approximate after the fix

- The build uses one weather year (2025) and the check uses twelve (669 (e)). The stress windows bring in the twelve years' worst
  week. Measuring the build's sensitivity to the reference year needs a switch to swap the LP's wind and solar for another year's
  national series (weatherYearNational). It is small, but it is a build change, so it is offered as an option with the prototype
  (12 one-year solves) and not included.
- Each real day repeats its representative day's hourly shapes. This error falls as the day count rises.
- Stress windows are not linked, which is conservative.
- No self-discharge; each model year cyclic.
- The typical days are chosen for the twelve-year energy and mapped onto the reference year's order. So the sequence carries
  twelve-year energy in one year's order.
- The engine's foresight is a separate limitation on every run's unserved figures (670 (f)). Within its window the forecast is
  perfect: 48 hours for short stores, 168 for long stores, one day for pumped storage.

## 9. Next steps and elapsed time (668 (e), (g))

1. On approval, a new branch: both settings behind FIXED keys with the defaults unchanged, the harness pass-through, closure
   diagnostics and the LP keys. About a day, with the suite.
2. Acceptance tests 1-7 on one-year LPs. About a day, more if the 365-day benchmark is slow. Reported before any pathway is
   rerun.
3. Reruns on Nick's go-ahead:
   - the central;
   - Deep, calibrated (2-4 rounds);
   - Fossil-free (with vanadium, without vanadium, and without vanadium or new iron-air);
   - about 24 sensitivities;
   - the six MTSAO runs;
   - the contact's stack and the age-curve runs (after the plant start years are verified).
   
   That is about 40 solves and their checks. The pack is refilled after them.
4. Elapsed time: c7's set took about 11 hours at 12 days, two solves at a time. The estimate is redone from the measured factor at
   the chosen count once the convergence test and the variants report (670 (e)). The earlier 2 to 3 days is out of date.
