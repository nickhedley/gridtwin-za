# Representative days and stored energy in the build LP: design for review, version 2

TODO 14mo, brought before the note (Nick's decision, 3 Nov 2026, message 668). Version 2, 3 Nov 2026, answering message 673 (Nick's
decision on version 1 and the independent review of 3 Nov), the schedule questions of message 674, the speed questions of 675 and
the mix questions of 677. Section 14 (version 2.1) answers 678-682 and amends 3.1, 3.6 and 6. Message 673 replaces version 1's
sections 3.1, 3.3 and 6, and message 125 (1)'s matched days. Design only: nothing is built until Nick approves (673 (l)). Both new
settings default off, so the page and every recorded run are unchanged until Nick decides. Every choice made here without Nick follows
modelling practice and rule 366, and is marked "(ours, rule 366)" with its basis; section 11 lists them.

## 0. What changed from version 1

- Days (3.1, replaced): medoid clustering of the reference year's days, extremes appended at weight 1, the peak-demand day added,
  the series rescaled to the twelve-year wind and solar means with values capped at 1. The re-picking of message 125 (1) goes.
  Extremes are found on the plan's fleet, which moves them by year (measured).
- Linking (3.2, approved in principle, 673 (a)): unchanged, plus pumped storage's reserve rows, the bldHourlySoc 1 dependency, the
  virtual power plant's batteries and self-discharge.
- Stress windows and adequacy (3.3, replaced): the planning-reserve claim withdrawn; the stress target required with clustered weights;
  inertia slack priced the same on every day; a linked-window variant.
- New: the single-year LP and its LP-key test (3.4); the LP's storage against the engine's, and foresight (3.5).
- Acceptance tests (6, replaced): one rescaled level for the benchmark and every variant at every day count; 2040 operating totals
  and 2040's own cost; a 2030 one-year test; one full pass-1 LP; binding caps reported; 673 (j)'s four tests.
- New: a two-stage route, the whole horizon at the chosen count and then each year at 365 days (3.6, 677 (b)); the mix error by
  technology and year, build limits, near-optimal ranges and the reference weather year as tests (6, 677).
- New: measured solve times by day count and the schedule to 18 Nov (9), with the solver options and the routes to more machines
  (9.7, 675); each review finding and our response (10); the choices that are ours (11); what is recorded for after the note (12);
  the committed Eskom-derived files (13, 677 (g)).

## Sources, and what was read

Read in full on 3 Nov 2026 (arXiv preprints and the Chalmers copy; page and section numbers are the copies read):

| Source | Read | Used for |
|---|---|---|
| Kotzur, Markewitz, Robinius and Stolten, 'Impact of different time series aggregation methods on optimal energy system design', Renewable Energy 117 (2018) 474-487 | In full, arXiv 1708.00420v1 (16 pages); the journal version not read | Method (section 6: hierarchical clustering with medoids recommended, calendar averaging worst); rescaling (section 2.4, Eq. 12); extreme periods (section 4.2.2: replacing a cluster by its extreme "results in an overestimation of 3% and forces a more conservative system design", on one building with six typical days); day counts (section 5: eight to twelve days for cost errors under 2%, on single buildings relying on grid and gas imports, not national systems; section 4.3.1: no robust convergence at 72 unlinked days for the island system) |
| Kotzur, Markewitz, Robinius and Stolten, 'Time series aggregation for energy system design: modeling seasonal storage', Applied Energy 213 (2018) 123-135 | In full, arXiv 1710.07593v2 (26 pages); the journal version not read | Linking (Eqs. 18-19, cyclic); the bound by each typical day's highest and lowest intra-day level (Appendix B, which the paper calls conservative and the error negligible at common self-discharge rates); self-discharge as decay of the inter-day state over the day (Eq. 19); results: the island system's design stable from 27 linked days, cost error under 2%; Table C.6: the linked runs oversized the hydrogen store 22-67% at 12 to 60 days. Eq. 20 as printed carries an exponent typo; to be checked against the journal version before it is quoted. No extreme periods were used ("to avoid side effects") |
| tsam documentation and source (tsam.readthedocs.io 'latest', version 4; source of 4.1.1 and of 2.3.9, the last release with the old interface) | Docs and source read, not run | 'append' and 'new_cluster' give an extreme a count of 1; 'replace' keeps the cluster's count; extremes are left out of rescaling; rescaling in 2.3.9: up to 20 passes, tolerance 1e-6, capped at 1 on the normalised series (4.1.1 redistributes within the cap instead of clipping); defaults: hierarchical (Ward) clustering represented by the medoid; the mapping of every real day to its typical day (clusterOrder) |
| Mantegna, Ricks, Manocha, Patankar, Mallapragada and Jenkins, 'Establishing best practices for modeling long duration energy storage in deeply decarbonized energy systems' (arXiv 2404.17474v1, 2024; publication in Environmental Research: Energy not confirmed) | In full (55 pages) | Unlinked representative periods "lead to an underestimation of the value of LDES by around 70%, even when 100 representative days are included" (section 3.5; a 200-hour store at 42% round trip, US 2045); linking as Kotzur's, implemented in GenX with a bound on each period's opening level (section 2.3.2); convergence within about 10% from about 6,000 operating hours where storage earns from arbitrage, about 2,500 where it mainly displaces firm capacity (sections 4-5); extreme periods of minimum solar, minimum wind and maximum load, then k-means, not tested |
| Reichenberg and Hedenus, 'The error induced by using representative periods in capacity expansion models: system cost, total capacity mix and regional capacity mix', Energy Systems 15(1) 2024 (doi 10.1007/s12667-022-00533-4) | In full, the Springer version of record from research.chalmers.se (19 pages); the online supplement not read | Hierarchical clustering of single days weighted by cluster size, storage cyclic within each day (not linked); cost within about 5% from 25 to 30 days and total capacity within about 20% from about 50 days (the paper's own cost figures differ between abstract, conclusions and Table 2); capacity-mix "discrepancy ... 50% or more" for studies with 4 to 12 days, stated as "may be"; they recommend a full year of operation |

Not read, and why:
- A citable self-discharge rate for iron-air: none found. Only uncited figures (1-3% or 2-5% a day) on blogs and marketing pages.
  formenergy.com, www.iso-ne.com and pubs.rsc.org are blocked in this container, and Firecrawl's credits are spent. Vanadium flow and
  pumped storage evaporation rates: none citable found either.
- PLEXOS's medium-term to short-term storage targets (portal.energyexemplar.com blocked) and PyPSA's water-value example (not reached
  after repeated blocks; github.com pages return 403): described in this note from search summaries only, not read.
- link.springer.com and doi.org answer but their redirects fail here; the Chalmers copy is the version of record, so nothing was lost.
- The journal versions of both Kotzur papers (page numbers above are the preprints').
- ReEDS, GenX docstrings, AEMO's ISP Methodology and Hilbers et al. 2019 are cited as the review read them; we did not re-read them.

## 1. What the build LP uses now (669 (a), 670 (a))

Unchanged from version 1 except where marked. Checked on build 2026-11-02y (index.html identical on main b0f7999 and claude/c7-runs).

- The pathway LP (bldBuildLP, index.html:12306) calls bldRepDays(12) (12308): 12 calendar days of the reference year (profiles.json,
  Eskom's hourly data for 2025), each weighted 365/12 = 30.4167 days (12025).
- Four are chosen extremes, found on today's fleet: net load is demand less 4,000 MW of solar and 3,600 MW of wind on the 2025
  profiles (11973). On c7's settings they are day 218 (tightest net-load hour), 359 (lowest demand), 162 (middle of the worst three-day
  net load) and 195 (middle of the worst three-day wind lull). The peak-demand day, 188 on c7's demand (29,858 MW), is not among
  them (new in version 2; see 3.1 on 187 and 188).
- The other eight are re-picked within their blocks until new wind and tracking solar on the twelve days match their twelve-year
  means (message 125 (1); bldRepDaysMatched, 11926-11964). c7's days: 20, 72, 95, 159, 201, 269, 271 and 355, reproduced here.
- Levels (new in version 2, measured on c7's settings): the 2025 year's tracking solar runs at 0.342 against 0.286 over the twelve
  years, fixed-tilt at 0.251 against 0.224, new wind at 0.417 against 0.425, existing wind at 0.355 against 0.370. The re-picking
  closes the gap by choosing cloudy days: on c7's twelve days at equal weight, a third of the year's weight sits on days whose
  tracking solar is below 17%, against 4.1% of the real year.
- Stress days at weight 1: the seed tail, the worst seven-day net-load window over the twelve weather years, again on today's fleet
  (12052: 2022 from day 169); from pass 2, the engine check's failing windows in the years they fail.
- The page's regional LP (bldBuildRegionalLP, 13957) calls bldRepDays(8), without the tail (13974).

## 2. Our chained days against Kotzur's formulation, and why ours overvalues stored energy (669 (d))

Unchanged from version 1 (the block chain at weight 30.4 with three of the year's worst days each standing for a month; R1,301bn of
vanadium's R1,305bn value in one ecap row in Fossil-free 2040). The review adds, and we agree, that the same weights drive more than
stored energy: fuel, curtailment, coal retained and a wind sample that is bimodal rather than representative. So the tests now compare
operating totals as well as builds (section 6).

## 3. Proposed formulation

### 3.1 Days and weights (replaces version 1's 3.1 and message 125 (1)'s matched days; 673 (b))

Four steps, the same at every day count n.

1. The rescaled reference year. Each of the four renewable series the LP reads from the reference year (existing wind, new wind on
   the modern-turbine profile, fixed-tilt solar, which also drives rooftop, and new tracking solar) is scaled so that the year's mean
   equals its mean over the twelve weather years, values capped at 1 and the scaling repeated until the mean matches to 1e-6 (Kotzur
   et al., Renewable Energy 2018, section 2.4, Eq. 12; tsam's rescaleClusterPeriods). Factors on c7's settings: new wind x1.020,
   tracking solar x0.835, existing wind x1.043, fixed-tilt x0.889. Demand stays the reference year's (its rooftop add-back is already
   on the twelve-year solar mean, ROOF12). The benchmark (365 days) and every variant use this year, so they start at the same level
   (673 (c)).
2. Extremes, appended at weight 1 (tsam's 'append': each stands only for itself), found on the plan's fleet (below):
   - the peak-demand day (the day of the year's highest demand hour);
   - the day of the tightest net-load hour;
   - the worst three-day net load and the worst three-day wind lull, each as all three of its days, so that a linked store passes
     through the real event in order (ours, rule 366: Kotzur's linking makes the order of real days count, and a single middle day
     cannot carry a three-day event);
   - the lowest net-load day, in place of today's lowest-demand day: on the plan's fleet the surplus day, not the quiet day, is what
     sizes curtailment and charging.
3. The other days are clustered into n - (number of extremes) typical days, each represented by its medoid (a real day), weighted by
   the number of real days in its cluster; every real day maps to its own cluster's medoid, which is the mapping linking needs (3.2).
   Features as version 1 and the review: 72 values a day (demand, new wind, tracking solar by hour), each normalised 0-1 over the year
   (tsam's default). Method: hierarchical clustering (Ward) represented by medoids (ours, rule 366: Kotzur et al., Renewable Energy 2018, section 6,
   recommend "a hierarchical aggregation due to its small computational load and reproducibility" and find medoids "produced more
   accurate results than k-mean centroids"; it is tsam's default, and Reichenberg and Hedenus use it). k-medoids fitted better in our
   measurement (0.88 against 0.96 at 18 days, and it keeps the year's share of high-demand days from 30 days), so test 6 compares the
   two at the chosen count and the better is put to Nick then. Deterministic either way: ties go to the earlier day.
4. The twelve-year means are re-imposed on the weighted set (tsam's rescaling, the extremes left as they are), capped at 1. Because
   step 1 already set the year's level and min-max normalisation is unchanged by a uniform scale, this second factor is small
   (measured: within about 4% of 1).

Measured on c7's settings (reference year 2025 with c7's demand; scratch scripts, nothing built; extremes as proposed below, 10 days):

| Set | Typical days' weights | Mean distance, real day to its representative | Calm | Windy | Cloudy | High demand | Daily wind spread |
|---|---|---|---|---|---|---|---|
| Real 2025 year | - | - | 1.1% | 26.3% | 4.1% | 7.1% | 0.13 |
| Twelve weather years (wind and solar only) | - | - | 1.2% | 29.5% | 3.0% | - | 0.17 |
| Now: c7's 12 days at 30.4 | 30.4 each | - | 8.3% | 41.7% | 33.3% | 25.0% | 0.19 |
| Version 1's mapping on c7's days | 9-98 | 1.26 | 0.3% | 44.9% | 35.6% | 6.6% | 0.10 |
| 18 days: 8 medoids (k-medoids) + 10 extremes | 29-65 | 0.88 | 0.5% | 18.6% (29.3%) | 0.0% (0.0%) | 1.4% | 0.11 (0.12) |
| 18 days: 8 medoids (hierarchical) + 10 extremes | 18-88 | 0.96 | 0.5% | 23.3% (12.6%) | 0.0% (14.0%) | 1.4% | 0.09 |
| 30 days: 20 medoids (k-medoids) + 10 extremes | 5-33 | 0.75 | 0.5% | 16.2% (20.8%) | 1.6% (11.8%) | 6.9% | 0.13 |
| 30 days: 20 medoids (hierarchical) + 10 extremes | 7-34 | 0.81 | 0.5% | 27.1% | 0.0% (17.0%) | 1.4% | 0.12 |
| 55 days: 45 medoids (hierarchical) + 10 extremes | 2-18 | 0.66 | 0.5% | 27.7% | 1.4% (17.5%) | 3.3% | 0.13 |
| 105 days: 95 medoids (hierarchical) + 10 extremes | 1-10 | 0.49 | 0.5% | 25.2% (27.7%) | 4.1% (11.0%) | 6.9% | 0.13 |

Definitions (ours, for this table): calm, a day's mean new-wind capacity factor below 15%; windy, above 50%; cloudy, a day's mean
tracking solar below 17%; high demand, a day's mean demand above 24,500 MW (c7's demand, before growth). Shares are weighted by days
represented. Figures in brackets are after rescaling to the twelve-year means and compare with the twelve-year row; the others with the
2025 row. With the review's extremes (162, 188, 195, 218, 359) and 8 k-medoids the mean distance is 0.90, the review's 0.91.

What the table says:
- Medoids fit each real day far better than version 1's mapping (0.88 to 0.96 against 1.26), with balanced weights, and rescaling makes
  the energy match exact without re-picking (the review's step 2 findings 1 and 2, confirmed).
- At 18 days the tails narrow: high-demand days 1.4% of the weighted year against 7.1%, windy days 19% against 26%, the daily wind
  spread 0.11 against 0.13. Each extreme now counts once, which is right for the year, but the year's other cold weeks are carried by
  average winter days. k-medoids restores the high-demand share at 30 days; windy and cloudy shares approach the year's between 55
  and 105 days. So the day count is judged on these shares as well as on cost and builds (test 6).
- Rescaling solar down 16.5% dims every hour: the share of days under 17% rises to 11-18% against 3.0% in the twelve years. The level
  is right and the shape is not. That is the cost of drawing days from a year whose tracking solar is 20% above the twelve-year mean;
  the gap itself is unexplained (review step 1 finding 3) and is recorded as a data question. Days drawn from all twelve years remove
  it; that is after the note (section 12).

Extremes on the plan's fleet (673 (b)). Net load = demand (the run's growth index) less wind and solar on the run's fleet in that
year (existing on the 2025 profiles, new on the modern-wind and tracking profiles, rooftop on solar, the LP's congestion and rooftop
derates). Measured on c7's central, Deep (s_deep40nogas_c7) and Fossil-free (s_ff2040_c7) builds:

| Year | Tightest hour | Worst 3-day net load (middle) | Worst 3-day wind lull (middle) | Lowest net load | Seed tail (weather year, first day) |
|---|---|---|---|---|---|
| Today's fleet (bldRepDays now) | 218 | 162 | 195 | 359 (lowest demand) | 2022, 169 |
| Central 2026 | 218 | 162 | 195 | 358 | 2022, 169 |
| Central 2027-2030 | 187 | 195 | 195 | 358 | 2022, 169 |
| Central 2031-2034 | 195 | 195 | 195 | 358 | 2022, 169 |
| Central 2035-2040 | 195 | 195 | 195 | 358 | 2016, 130 |
| Deep 2026 / 2028-2040 | 187 / 195 | 195 | 195 | 358; 20 in 2034-2038 | 2022, 169 (2026, 2040); 2016, 16 (2028-2030); 2016, 130 (2032-2038) |
| Fossil-free 2026 / 2028-2040 | 187 / 195 | 195 | 195 | 358; 20 from 2035 | 2022, 169; 2016, 130 in 2030 |

So yes: the days differ by year. As wind grows, the tightest hour and the worst three-day net load move onto the wind lull (days
194-196) by 2028 in Deep and Fossil-free and by 2031 in the central; as solar grows, the surplus day moves from late December (358) to
20 January. The seed tail moves too.

Peak-demand day: 188 on c7's demand (29,858 MW; 187 is 29,833 MW). On the page's default demand the review found 187 (30,322 MW). The
two are the same cold spell; the rule takes the day from the run's own demand, so the pathway runs get 188.

Corrected in 14.3: the list below missed day 187; the union is 11 days on the metered series and 14 on the modelled 2025 reference. Proposal (ours, rule 366: the union is robust to the fleet the LP chooses, which is not known before the solve; ReEDS's practice of
adding stress periods found on the solved system is the loop's job, not the seed's): append in every year the union of the extremes
found on today's fleet and on the three reference fleets in any year: 20, 161-163, 188, 194-196, 218 and 358 (10 days). A harness
script recomputes the list from the recorded fleets and validate_lp checks it against the FIXED key (rule 3: recompute, never
hand-edit). Seed tails: the 2022 window in every year, as now, and the 2016 window from day 130 in the years where it is the worst on
a reference fleet (2030 and 2032-2040), and Deep's 2016 window from day 16 in 2028-2030; the LP already carries per-year windows
(rdY's years). Alternative for Nick: extremes per year on the previous pass's fleet (fewer days, possibly more passes).

### 3.2 Linking (approved in principle, 673 (a)): additions

Version 1's formulation stands (lv at the start of every real day, lnk in calendar order, cyclic year, hi and lo bounds from each
typical day's highest and lowest intra-day movement, weights equal to days represented). Additions:

- bldStorageLink 1 requires bldHourlySoc 1 (673 (f)). The intra-day movement c_ and its cr_ rows exist only under bldHourlySoc 1
  (index.html:13064); with any other value the LP refuses the setting with a message.
- Pumped storage's reserve rows (673 (f); review step 2 finding 4, confirmed: rpe_ and rpq_ at 12904-12916 read c_ps, e_ps and the
  previous block's e_ps). Under linking they take the same form as lithium's: lvmin_ps_<y>_<k> <= lv_ps_<y>_<i> for every real day i
  mapped to typical day k; rpe_: hold x rp <= lvmin_ps + c_ps at the hour's end; rpq_: hold x rp <= lvmin_ps + c_ps of the hour before
  (lvmin_ps alone at hour 0). Conservative in the same way as lithium's: the lowest level over the mapped days stands for all of them.
  Stress days keep their hourly rows.
- The virtual power plant's batteries are linked like lithium (673 (f); ours, rule 366: the engine runs the enrolled batteries inside
  its lithium fleet with lithium's 48-hour look-ahead, index.html:7955 and 8549-8556, so the LP should treat them the same; rule 'Two
  models of the same system read the same constants'). Their 2.5 hours of usable energy bound what they can carry, so linking lets
  them hold charge overnight, as a home battery can, and cannot make them seasonal. We differ here from the review, which called this
  physically wrong but harmless.
- Self-discharge (673 (i)). Neither the LP nor the engine has any today (no self-discharge term in index.html). Once the year is linked a store can
  hold energy for weeks, so a daily loss matters in a way it did not when only each block's level carried: at 1% a day a month's hold
  loses about a quarter. Kotzur's linking takes it as decay of the inter-day level over each day (Applied Energy 2018, Eq. 19), with the
  conservative bound of Appendix B. Proposal (ours, rule 366: two models of the same system read the same constants): one FIXED rate
  per store, read by the LP and the engine, default 0, so nothing moves until a rate is sourced. A citable iron-air rate was not found:
  only uncited figures of 1-3% and 2-5% a day on blogs and marketing pages; formenergy.com, www.iso-ne.com and pubs.rsc.org are
  blocked here and Firecrawl's credits are spent. So 673 (i)'s sourced rate is outstanding. Test 10 measures the effect at the rate
  Nick or the advisor supplies and, as a bracket labelled unsourced, at 1% and 3% a day.

### 3.3 Stress windows and adequacy (replaces version 1's 3.3; 673 (e), (g))

Adequacy:
- Withdrawn: version 1's statement that the planning reserve row protects adequacy. That row (res_) is written only when
  bldPlanMarginPct is above 0 (index.html:13136); it is 0 on the page (6029) and in every c6e and c7 run.
- With clustered weights the stress target is required (bldRepWeights 'clustered' with bldStressTarget 0 is refused with a message). Ours,
  rule 366. Why this and not pricing weight-1 days as stress days:
  - With the target on, the expected-shed row is the reliability standard itself (NTCSA's 20 GWh a year), and counting a calendar day's
    shed at the number of days it stands for is then correct: a weight-1 extreme counts once because it happens once. This is the
    practice of standard-based adequacy loops (ReEDS's PRAS iteration against a normalised expected unserved energy; AEMO's
    time-sequential check against the reliability standard).
  - Pricing weight-1 days at VoLL x 365 would treat a once-a-year day as if it came every day: the over-weighting of extremes that the
    fix removes, which Kotzur et al. measure as an overestimate and a more conservative design (Renewable Energy 2018,
    section 4.2.2).
  - Every pathway run already has the target on (env_c6.sh STRESS_TARGET=1); the page default (target off) stays as it is, since both
    new settings default off.
  - Measured in code (review step 2 finding 3, confirmed): without the target, a calendar day's shed and reserve shortfall are priced at
    VoLL x its weight (index.html:12520, 12525), so at weight 1 the tightest day could be shed for R87,000 a MWh once a year.
- Inertia slack (ssl_) is priced at VoLL x 365 on every day, calendar and stress, when weights are clustered (ours, rule 366). Today it is
  VoLL x the day's weight on calendar days whatever the target (12530), so at weight 1 the floor on an extreme day would be cheap to
  miss. The inertia floor is an hourly security limit, met in every hour however often the day occurs (AEMO sets minimum inertia as a
  requirement to be met, not traded against energy); the slack exists only so an early year with no possible build stays solvable,
  and is reported, as now.
- Reserve shortfall stays counted with shed in the target row (12525), as now.
- Passes: reported for every test and rerun. With the extremes at weight 1 the LP no longer over-builds for a month of the worst day,
  so the engine check may find years short and the loop add windows: more passes than c7's one (673 (e); a schedule risk, section 9).

Stress windows:
- Default as now (ours, rule 366, until test 1's fifth variant reports): each window is a closed loop, opening at its own closing level
  (hsStart, 12491), so it gets no energy it did not store. Precedent: ReEDS's periodic boundary conditions inside stress periods.
- The fifth variant (673 (g); review step 2 finding 6): a window opens at the chain's level on its calendar start day,
  lv_<s>_<y>_<start>, and closes at the chain's level n days later, lv_<s>_<y>_<start+n> (days taken modulo 365). No free energy, but a
  store may arrive charged, as in Kotzur's and GenX's sequences. The chain then has two paths between the same two levels, the
  reference year's mapped days and the window's own weather, and both must be feasible. The review is right that version 1's reason for
  keeping windows apart, that splicing would join two years' weather, already fails: a window takes the reference year's demand for its
  calendar days with another year's wind and solar (12772-12777).
- Reported for both: the sign and size of vanadium's and iron-air's value with windows closed and with windows linked (673 (g)).

### 3.4 The single-year LP (new; 673 (d))

There is none in the code today: bldSetHorizon always starts at 2026 (index.html:10903-10908), and the harness's fix-from rewrites
named build variables as fixed bounds while every year's rows stay (pathway_perfail.js:561-568). Definition:

- A new key, bldOperFrom (default 2026: the LP text unchanged). With bldOperFrom = y, bldBuildLP writes the operating rows, operating
  objective terms and per-year policy rows (energy balance, reserves, storage, CO2 and gas rows, the stress target) only for years y and
  later. Build and retirement variables of earlier years stay in the cumulative sums and are fixed from a recorded run (FIX_FROM,
  FIX_TO = y - 1); their annuities are constants. With HORIZON = y the LP holds one year's operation and one year's build decisions.
- LP-key test: with bldOperFrom unset, c7's pass-1 LP key is unchanged (c62ec3e615), and validate_lp passes.
- Equivalence test: on the 12-day LP, the full LP with 2026 to y - 1 fixed from its own solution against the single-year LP: year y's
  builds, dispatch and cost equal to solver tolerance, the objectives differing by the fixed years' operating cost, reported. Every row
  that couples years (rcmono_, cumulative variables, the STOR_CUM and pace rows) is listed and shown to involve only fixed values.
- Tests on it (section 6): 2040 (Fossil-free fixed from s_ff2040_c7 with vanadium allowed; the central fixed from c7) and 2030 (the
  central, before the pace caps saturate). For each: whether the pace caps, lithium's energy cap and the cumulative caps bind (builds at
  their bounds and non-zero duals), since a capped test can pass whatever the fix does (673 (d)).

### 3.5 The LP's stored energy against the engine's, and foresight (673 (h), (i))

- Test 4 reports, for each variant's 2040 build, the engine's daily end-of-day level of each long store (iron-air, vanadium, new pumped
  storage) in each weather year beside the LP's lv path for the same build. Measures: energy discharged in the year, the seasonal swing
  (highest less lowest 30-day mean level, % of capacity), and the correlation of daily levels.
- If the engine does not realise the LP's cycling (ours, rule 366, as a threshold for proposing, not building: the engine's long-store
  discharge below 75% of the LP's, or a seasonal swing below half of it), the proposal is an engine setting, default off, that passes
  the LP's level path to the engine as a target for long stores: PLEXOS's default way of linking its medium-term and short-term
  schedules (Energy Exemplar's documentation, not read: portal.energyexemplar.com is blocked here; described from search summaries). The alternative is water values: the duals of the lnk rows as each day's marginal value of stored energy,
  as in PyPSA's example (not read: the PyPSA pages could not be reached here; described from search summaries). Caveat: the LP's path is for the reference year, while the engine runs twelve weather years; a
  level target from one year imposed on another's weather can force the wrong cycling, which a price does less. Built only if the trace
  shows it moves results; reported first, then stop (673 (h)).
- Foresight: a 120-hour sensitivity on the engine check (pathcheck.js LA_H=120 LDES_LA_H=120; Nick's understanding is that Eskom plans
  four to five days ahead, source to follow), on test 4's builds and on c7's central and Fossil-free. Pumped storage plans by a daily
  rule today, not a look-ahead; testing its one-day planning against 120 hours needs an engine option (PS_LA_H, measurement only,
  default off), part of the build.

### 3.6 Two stages: the whole horizon at the chosen count, then each year at 365 days (677 (b))

Structure checked against AEMO's 2026 ISP Methodology (June 2025): the route follows AEMO's structure, with finer days and shorter windows than AEMO uses. AEMO's capacity outlook
(2026 ISP Methodology, June 2025, read in full, 117 pages) runs a single-stage long-term model over the whole horizon on a sampled
chronology, "typically day(s) per month or week(s) per year" (p. 41), then a detailed long-term model that "optimises over sequential,
shorter time horizons" (p. 8), re-optimising wind, solar, storage and peaking gas builds in each window (p. 11), with "perfect foresight
within each multi-year optimisation window" (p. 32). Three differences from 677 (b)'s description: AEMO's windows are multi-year (the 2024
ISP's model instructions: "four steps of seven years", p. 9; the 2026 step length was not found); its second stage runs every day but each
day in "typically five to eight" load blocks (p. 42), not hourly; hourly or half-hourly resolution is only in its time-sequential model,
which dispatches and validates a fixed outlook and chooses no builds (pp. 6, 61); and no look-ahead or overlap between windows is
described. Retirements and the larger thermal builds are fixed from the first stage (p. 51), with a carbon budget per step (p. 49). Two
points support choices made here: AEMO scales renewable profiles so each generator's capacity factor matches between the sampled and the
underlying data (p. 41), which is 3.1's rescaling, and charges annuities only for the life inside the horizon, costs and benefits
"neutral" beyond it (pp. 94-95), as this LP does. Reliability feeds back through minimum reserve levels tuned from the time-sequential
model (p. 44), which is J3's question.

Formulation (proposed; prototype only after the build is approved):
- Stage 1: the fixed one-stage pathway (3.1-3.3) at the chosen day count n, through the adequacy loop, as every run now. It gives the
  stress windows by year and a starting point; its builds are not imposed on stage 2.
- Stage 2, for y = 2026, 2027, ... 2040 in turn: an LP over years y to min(y + k, 2040), with k = 2 years of look-ahead (ours, rule
  366, to be tested at 1 and 3). Year y runs on all 365 days of the rescaled reference year, linked (exactly chronological), with stage
  1's stress windows for that year; the look-ahead years run at n days. Builds in years before y are fixed from earlier steps (bldOperFrom
  and FIX_FROM, 3.4); builds in year y and in the look-ahead years are free within their yearly and cumulative limits. After the solve,
  year y's builds and retirements are fixed and the window moves on one year.
- Annuities: each step charges, for every build decided in its window, the annuities of the years inside the window, and the window's
  operating costs: costs and benefits over the same years, which is how the one-stage LP already treats its horizon end (no residual
  value). So the 2040 step ends exactly as the one-stage LP does (ours, rule 366).
- Foresight: perfect within the window (k years), none beyond it, as in a rolling-horizon model; stage 1's whole-horizon view enters
  only through the stress windows and the warm start.
- Checks: the engine check of the stage-2 build as for every run; the loop's adequacy test on each step's year y (a failing year adds
  its window and that step re-solves).
- Size and time: a step is one year at 365 days (about 580,000 rows) plus k years at n days (about 47,000 rows each at 25 days), so
  about the size of the 25-day pathway LP: 40-70 minutes a step on the measured simplex if the year-long chains solve no harder than
  the block chains (unknown until the build; interior point is the fallback, equal in objective and builds at 25 days). Fifteen steps
  in sequence: about 10-18 hours a pathway, which cannot be split across machines; different pathways can.
- Code beyond the one-stage build: per-year day counts in one LP (365 in year y, n in the others) and a stage-2 driver over the years:
  about 4-6 hours.
- Prototype (677 (b)): the central and Fossil-free, one machine each, about a day; reported as the mix by technology and year against
  the one-stage answer at n days.

## 4. Size of the LP

Measured on c7's central pass-1 LP (the current formulation, nothing new built; harness/pathway/repdays/timing.sh), 15 years:

| Calendar days a year | Rows | Columns | Nonzeros |
|---|---|---|---|
| 12 (c7 as run, key c62ec3e615) | 398,529 | 229,575 | 3.08 million |
| 25 | 701,931 | 386,745 | 5.38 million |

Rows grow by about 23,300 per modelled day a year across the 15 years (each calendar day and each of the 7 seed-tail days). Projected
for the pathway LP at n calendar days: 18 days about 540,000 rows; 30 days about 820,000; 55 days about 1.4 million; 105 days about 2.6
million; 200 days about 4.8 million. A single-year LP is about a fifteenth: the 365-day benchmark about 580,000 rows.

Linking (3.2) changes this little at higher counts: per store-year it adds about 1,100 rows (lnk, hi and lo on 365 days) plus 365 for
the reserve minimum of lithium and pumped storage, and replaces the four block-end families (about 94 rows per typical day) with two
(cmx, cmn, 48 per typical day). At 12 days that is about +46,700 rows (+12%); from about 25 days it is roughly neutral. The appended
extremes (10 days in place of 4) count as calendar days.

## 5. Solve time, measured

Native HiGHS simplex on this container (4 cores, 15 GB), one other solve running beside it (as in the reruns, two at a time):

| Calendar days | Solve | Peak memory | Against 12 days |
|---|---|---|---|
| 12 | 519 s (8.7 min); c7 recorded 817 s with a second solve beside it | about 1.7 GB | 1 |
| 25 | 2,322 s (38.7 min), with two to three other solves beside it | about 2.0 GB | 4.5 (2.8 against c7's 817 s with one beside it) |

So solve time grew as rows to a power of 1.85 to 2.64 between 12 and 25 days (the range is the different load beside each
measurement; a clean pair is in 9.7). The objective at 25 days is 2.6% below 12 days' (R1,610.0bn against R1,653.7bn in objective
units), a first sign that the day count moves the answer. A 50-day simplex solve was not timed: on this growth it would take 2 to 4
hours, longer than one 2-hour piece.

Linking's own factor cannot be measured before the build. The only precedent is the hourly state of charge of 8 Oct (RESULTS 'Hourly
state of charge in the build LP'): 50% more rows took 5.1 times as long, so chained storage rows are expensive for simplex. Kotzur et al.
report linked days solving slower than unlinked ones at the same count (Applied Energy 2018, section 3.2). Test 8 (one full pass-1 LP,
settings on against off) measures it; until then this note carries a linking factor of 1.2 to 3 (ours, a range, not a measurement).
Interior point (HIGHS_SOLVER=ipm, with crossover) is the fallback where simplex stalls; it solved s_nogas_c7's third pass when a
simplex resume failed.

## 6. Acceptance tests, reported before any pathway is rerun (replaces version 1's section 6; 673 (c), (d), (e), (g), (h), (i))

Common rules:
- Level (673 (c)): the benchmark and every variant use the rescaled reference year (3.1 step 1) at every day count, so they start at
  the same annual wind and solar energy.
- Benchmark: 365 days of the rescaled year, each at weight 1, linked (exactly chronological), with the same stress days. If it cannot
  be solved, the fallback is 183 days, every other day at weight 2, linked, labelled approximate in every table (it repeats each day it
  keeps and drops the day between).
- What is compared, at every count and in every test: builds by technology (2040, and by year where the LP is multi-year); 2040's
  operating totals: coal, gas and diesel output, curtailment, CO2, unserved energy; 2040's own cost (operating cost plus the year's
  annuities); the whole objective; the split of vanadium's and iron-air's value by row family (as RESULTS' decompositions); whether the
  pace caps, lithium's energy cap and the cumulative caps bind; solve time; passes.
- The two settings, both default off: bldRepWeights ('equal' as now, or 'clustered', 3.1) and bldStorageLink (0 as now, or 1, 3.2).

| Test | What it checks |
|---|---|
| 1. Variants against the benchmark | Single-year 2040 LPs, Fossil-free (fixed from s_ff2040_c7, vanadium allowed) and the central (fixed from c7). Five variants: (a) now; (b) clustered weights, the current block chain; (c) linking with a balanced mapping (30 or 31 days a typical day), isolating the link; (d) both; (e) both, with stress windows linked (3.3). The sign and size of vanadium's and iron-air's value in (d) and (e). No assumption about which cause matters more or which way cost moves. |
| 2. Closure | Each store's net over the linked year is zero; the sum of weight x daily net over the typical days equals it; the level rebuilt hour by hour (lv + c) stays within zero and capacity on all 365 days; lv itself within zero and capacity. |
| 3. No long-duration storage | The central 2040 (lithium, existing pumped storage, the virtual power plant), linked and unlinked, differences explained. |
| 4. Engine check and stored energy | pathcheck YEARS=2040 (twelve weather years, chronological) on each variant's build. Beside it, the engine's daily level of each long store against the LP's lv (3.5). The 120-hour foresight sensitivity (LA_H=120 LDES_LA_H=120) on the same builds, and pumped storage's daily rule against a 120-hour look-ahead (PS_LA_H). |
| 5. Suite and LP keys | With both settings off and bldOperFrom unset: c7's pass-1 LP key unchanged (c62ec3e615), validate_lp and the full suite, failures compared with main's known ones by name. |
| 6. Convergence (669 (b)) | Both settings on, on the single-year 2040 LPs: about 18, 30, 55, 105 days and higher as solve times allow (Mantegna et al. find convergence within about 10% only from about 2,500 to 6,000 operating hours, roughly 100 to 250 days); the central at two or three counts and in 2030. At each count: the comparison above, plus the weight range, mean mapped distance and the weighted shares of calm, windy, cloudy and high-demand days against the year (3.1). Hierarchical against k-medoids at the chosen count. |
| 7. Single-year LP | The LP-key test and the equivalence test of 3.4, on 2030 and 2040. |
| 8. One full pass-1 LP | The central's full 2026-2040 pass-1 LP with both settings on against off: builds by year, 2030, 2035 and 2040 operating totals, the objective, binding caps, solve time (673 (d)). |
| 9. Adequacy | The refusal of clustered weights without the stress target; inertia slack zero where a build can meet the floor; passes needed when the full LP is run through the loop (one central pathway, after test 8). |
| 10. Self-discharge | Test 1 (d) on Fossil-free with iron-air's self-discharge at the bracket of 3.2, against zero, in the LP and the engine together. |
| 11. Recommendation (669 (c)) | The day count and method for the pathway runs: measured error in cost, capacity by technology and 2040's operating totals, the weighted shares, and the solve time of a full pathway pass at that count. |

673 (j), tests on the fixed optimiser before the note. Each reports its size; none changes the central without Nick's decision:

| Test | Runs | Reported |
|---|---|---|
| J1. Early retirement (673 (j) 1) | rc_ allowed to fall away at each station's scheduled closure (rc_y less the closures due by y), or per-station retirement variables; on the central and Fossil-free, beside the senior contact's retirements (s_contact_c7 on the fixed optimiser). Until it reports, 'no coal retires early' is treated as unsafe and stays out of the pack. | MW retired early by station and year, cost and CO2 change, against the contact's |
| J2. The loop's outage draws (673 (j) 2) | 4 or 5 draws a weather year in place of 2, or pathcheck's stopping rule inside the loop, on the central; c7's pass-limited run (s_nogas_c7, pass limit 3) rerun at a higher cap or labelled 'pass limit reached' wherever quoted | passes, loop against check by year, cost |
| J3. A planning reserve margin (673 (j) 3) | s_prm10 on the fixed optimiser (bldPlanMarginPct 10; only run so far on c5, s_prm10_c5d) | shed (mean and the tail of the draws: the worst draw and the 95th percentile by year), cost, builds |
| J4. Horizon to 2045 (673 (j) 4) | Estimate first, below and in section 9; nothing built before Nick's go-ahead. First in line to move if time runs short (674 (d)) | - |

J4, the estimate (673 (j) 4; 674 (d)): measured on LPs written and not solved (c7's and Fossil-free's pass-1 LPs at 2040 match the runs' keys, c62ec3e615 and
63bbdcbf72; scratch copies, nothing in the repository changed).
- The code: bldSetHorizon caps the horizon at 2040 (index.html:10904), so HORIZON=2045 today runs 2026-2040 without a word and writes a
  file that looks like a 2045 run; pathway_perfail.js:348 does not check. Raising the cap leaves both 2040 LPs byte-identical. Two ways
  (Nick's choice): (A) edit the cap in index.html, which brings the suite, a BUILD_STAMP and the stored panels; (B) the runner sets
  BLD_YEARS itself, as it already sets BLD_DISC and bldRepDays, with no page change. Either way: the pathway checks the horizon and
  records it, FOSSIL_END and the carbon-cap years run to the horizon (pathway_perfail.js:440-449), the gas price cases are regenerated
  to 2045 (build_gas_cases.py: the run throws at 2041 today), pathcheck refuses a run without a recorded demand path when the horizon is
  not 2040, a chain phase, and an explicit 2040 cut in the tables (summ.js already sums 2026-40 only; packfill.js sums every scheduled
  year and needs the cut only if the pack reads these runs).
- Inputs past 2040: demand (the ESRG path runs to 2050: index 1.459 in 2040, 1.656 in 2045), carbon (flat after 2030), cost
  escalators and declines, build caps, rooftop, the behind-the-meter stock, the standard: all extend as written. Nick decides: coal
  closure dates after 2040 (the file holds c4's dates and one placeholder, Tutuka unit 3 in 2041: 16,761 MW of coal in 2041-43 and
  13,766 MW in 2044-45; or IRP 2025 Figure 3 read past 2040, 2-3 hours, no generator script); whether coal fuel keeps rising 3% a year
  (1.75 times 2026 by 2045); whether capex keeps declining (solar 0.47, wind 0.58, lithium 0.56 of 2026 by 2045); whether solar's
  cap keeps growing 7% a year (9.0 GW a year in c7 by 2045, 14.5 in Fossil-free); iron-air's 5 GW total; whether the adequacy loop tests
  2041-45 (ours: yes, reporting 2026-40 only). Flagged, no change proposed: offshore held at 5 GW; Koeberg's licences to 2044 and 2045,
  to verify; REIPPPP windows 1-3.5 reach 25 years in 2038-44; lithium built 2026-30 passes its 15-year life and keeps being charged.
- Found on the way: in Fossil-free, gas and diesel built after 2039 carry an objective coefficient of 0.000 (FOSSIL_END truncates their
  annuities), so the LP could record idle free builds in 2040-45; check the schedule or bound them at 0.
- Size and time: the pass-1 LP grows 33% in rows and columns (c7: 530,794 rows, 306,100 columns) and 60% in nonzeros (every capacity
  row sums each earlier vintage). Moving the horizon to 2045 multiplies a 2040 build's discounted capital per MW by 4.99, a 2036 build's
  by 1.68, a 2030 build's by 1.24: the end effect the test exists to show. Solve: c7's 2045 pass 1 about 20-45 minutes at 12 days
  (from the measured 12- and 25-day solves), Fossil-free 3-12 minutes; each pass's adequacy test over 20 years about 5 minutes. If
  2041-45 fail the loop, each further pass is a stress-window LP of 0.73-0.86 million rows (Deep's pass 4 at 690,773 rows did not solve in
  7.5 hours), the main time risk.
- Effort: 5-6 hours with (B), 6-8 with (A), plus 2-3 if the coal dates are rebuilt. At the fixed formulation's day count every solve
  time above scales as in section 5.

### Additions to the acceptance tests (677 (a), (c), (d), (e))

In every comparison at every day count (tests 1, 6 and 15):
- Mix error (677 (a)): each technology's capacity by year against the 365-day benchmark, in MW and %, beside the cost. A technology
  "settles" at the lowest count from which it stays within 5% or 250 MW of the benchmark, whichever is larger, at that count and every
  higher count tested (ours, rule 366: 5% is the order of the cost tolerance Reichenberg and Hedenus use; 250 MW is a tenth of a year's
  wind pace, below which a difference is not material to the mix). Technologies that do not settle within the counts tested are named.
  By year: the single-year LPs run for 2030, 2035 and 2040 (earlier years fixed from the same c7 run), each against its own 365-day
  benchmark; the two-stage prototype gives every year.

| Test | What it checks |
|---|---|
| 12. Build limits (677 (c)) | For the central, Deep and Fossil-free on the fixed optimiser: every yearly build limit and energy cap that binds (rpb_, the pace rows, tcap, gascap, offcap, the lithium energy cap, iatot, phescap), by technology and year, with its shadow price (rand of present value per MW a year) from the final solve's duals. The capacity the optimiser would have chosen: the same runs with the yearly limits lifted. The limits' effect: one higher and one lower pace from the defined cases (ours, rule 366: no new numbers): the central at 'grid' and at 'irp' (BLD_PACE); Deep and Fossil-free, which already run at 'grid', with the limits lifted and at 'deliverable'. Engine-checked; Deep keeps its calibrated cap. Seven runs (the central lifted, at 'grid' and at 'irp'; Deep and Fossil-free lifted and at 'deliverable'). In c7's central, wind sits on its limit in 7 of 15 years (2029-34, 2037-38). |
| 13. Near-optimal ranges (677 (d)) | After the fix, the central and Deep: the minimum and the maximum of wind, utility solar, lithium (power), long-duration storage (vanadium, iron-air and new pumped storage together) and coal retained, in 2040 and in 2030, within 1% and within 2% of the least cost (Neumann and Brown's method: total cost at most (1 + slack) times the optimum, then minimise or maximise one technology group; Electric Power Systems Research 190 (2021) 106690, read in full as arXiv 1910.01891v2: total cost at most
  (1 + slack) times the optimum, Eq. 15; one minimum and one maximum per technology group and slack; 384 near-optimal solves over 8
  groups, 8 slacks from 0.5% to 10% and 3 emission targets, on one fixed operating sample (a two-hourly year), run "within a parallelized
  workflow"; "Already a cost deviation of 0.5% offers a large range of possible investments"). The stress windows are fixed at the base run's final set, so each solve is one LP. Solves: 5 groups x 2 directions x 2 slacks x 2 years x 2 runs = 80, each engine-checked (80 checks); a near-optimal build that fails the standard is reported as such. Every solve is independent, so they run fully in parallel. |
| 14. Reference weather year (677 (e)) | The build's sensitivity to the reference year (version 1's option): each of the twelve weather years in turn as the reference for the calendar days, rescaled to the twelve-year means (only the year's pattern differs) and unscaled (pattern and level), on single-year 2040 LPs for the central and Fossil-free at the chosen count: 48 single-year solves, each a few minutes. Code: a setting for the reference weather year (bldRefWeatherYear), about 2-3 hours. Reported: the spread of builds by technology and of 2040's cost across the twelve, beside the day-count error. |
| 15. Two stages (677 (b)) | The prototype of 3.6 on the central and Fossil-free, against the one-stage answer, by technology and year. |

## 7. Builders and callers of the representative days (670 (d))

As version 1, with:
- bldRepDays: the clustered rule behind bldRepWeights (extremes from the FIXED list, clustering, rescaling). The regional LP keeps
  bldRepDays(8) and its current rule (unchanged).
- The rescaled series: PROFILES is not changed; the LP reads the scaled values through bldRepDays' day objects (each day carries its
  own wind and solar shapes, as stress days already do), so the engine, which runs the twelve years, never sees them.
- A harness script that recomputes the extreme-day list from the recorded fleets (3.1), and its check in validate_lp.
- bldOperFrom (3.4) in bldBuildLP and the pathway's FIX_FROM.
- pathcheck.js: the engine's long-store level trace (test 4), measurement only; PS_LA_H, measurement only.

## 8. What remains approximate after the fix

- One weather year (2025) builds; twelve check. The stress windows bring in the twelve years' worst weeks.
- The rescaled year has the twelve-year energy and 2025's shapes; uniform rescaling dims solar in every hour (3.1).
- Each real day repeats its typical day's hourly shapes; the error falls with the day count.
- Stress windows closed by default (3.3); variant (e) measures what linking them changes.
- Each model year cyclic on its own; no carry-over between years.
- No self-discharge until a rate is sourced (3.2).
- Kotzur's linked runs oversized the seasonal store 22-67% at 12 to 60 days against the full year (Applied Energy 2018, Table C.6);
  a residual overvaluation of seasonal storage may remain at the chosen count, and test 4 shows how much of it the engine realises.
- The engine's storage foresight (48 hours, 168 for long stores, pumped storage daily) is a separate stated limitation (670 (f)).

## 9. Schedule to the note on 18 Nov (message 674), step by step

Times in SAST. Nothing here drops or relaxes anything; where the plan may not fit, the options are listed for Nick (674 (c)).

### 9.1 The plan (674 (a)) against what each step needs

| Step | Plan | What it needs | Achievable? |
|---|---|---|---|
| Design version 2 | by 4 Nov | this note | Yes: delivered 3 Nov |
| Review of version 2 | 4 Nov | Nick and the advisor | Nick's; the build cannot start without the go-ahead |
| Build | 5-6 Nov | the items below, the suite before and after, the stored panels, a pull request | Tight. About 22-30 hours of work and test cycles; achievable only if the go-ahead comes by the morning of 5 Nov and the linking LP needs little debugging |
| Acceptance and convergence tests | 7-9 Nov | tests 1-11 on single-year LPs, test 8 (two full pass-1 solves) and test 9 (one central pathway through the loop) | Yes at counts to about 105 days; the 365-day benchmark's solve time is unknown (about 580,000 rows with year-long chains) |
| Go or no-go on reruns | 10 Nov | Nick, on the test report | Nick's |
| Reruns | 10-13 Nov | about 47 solves and 52 engine checks (9.3) | Depends on the day count, linking's solve factor and passes (9.2-9.3); fits at 18-30 days on the middle assumptions, not at 100 or more |
| Pack refill | 14 Nov | packfill.js on claude/c7-pack, the 2025 replay, validate_external, design minimums, coal_swing; the presets regenerated from the central, the stored panels and the full suite (a pull request) | Yes, about a day |
| Note text and publication | 15-18 Nov | Nick | - |

Build items, in the order the tests need them (so a slip delays the least):
1. bldRepWeights 'clustered': extremes from the FIXED list, clustering, rescaling, day objects carrying their own shapes (4-6 hours).
2. bldStorageLink: lv, lnk, hi, lo, cmx, cmn, the reserve minimum for lithium and pumped storage, the virtual power plant, the refusals
   (4-6 hours).
3. bldOperFrom and the pathway pass-through; the LP-key and equivalence tests (2-3 hours).
4. The stress target requirement, inertia slack weighting, linked windows as a setting (2 hours).
5. The extreme-day script and its validate_lp check (2 hours).
6. Self-discharge key in the LP and the engine, default 0 (1-2 hours).
7. pathcheck's long-store level trace and the engine's PS_LA_H, measurement only (2 hours).
8. J1's retirement option and J2's draws option (2-3 hours).
9. BUILD_STAMP, the suite before and after (about 40 minutes each, in parts), the stored panels (about 45 minutes), the pull request
   with the suite counts and the visible-text section if any (2-3 hours).

### 9.2 Solve time by day count, and the highest count that fits 10-13 Nov

Central pass-1 solve in minutes, one other solve beside it, on three sets of assumptions (growth with rows to the power alpha,
linking's factor L, both unmeasured until the build; 12 days measured at 13.6 minutes with one beside it):

| Calendar days | Rows (pathway LP) | Low (alpha 1.85, L 1.2) | Middle (alpha 2.2, L 1.5) | High (alpha 2.64, L 3) |
|---|---|---|---|---|
| 18 | 538,570 | 28 | 40 | 90 |
| 25 | 701,943 | 47 | 71 | 182 |
| 30 | 818,638 | 62 | 99 | 273 |
| 40 | 1,052,028 | 98 | 173 | 529 |
| 55 | 1,402,113 | 167 | 325 | 1,130 |
| 105 | 2,569,063 | 513 | 1,231 | 5,588 |

The whole rerun set (47 solves, a run's solve on average 0.76 of the central's as in c7, 52 checks of 10 minutes, 25% for relaunches),
in hours of wall time, one pass a run against 1.5:

| Calendar days | This machine, two at a time: low / middle / high | Three sessions | GitHub Actions, one run a runner |
|---|---|---|---|
| 18 | 16-21 / 20-28 / 39-56 | 5-7 / 7-9 / 13-19 | bounded by Deep's calibration chain: about 3-6 |
| 25 | 23-31 / 32-45 / 73-107 | 8-10 / 11-15 / 24-36 | about 4-10 |
| 30 | 28-40 / 42-61 / 107-158 | 9-13 / 14-20 / 36-53 | about 5-15 |
| 40 | 42-60 / 70-102 / over | 14-20 / 23-34 / 67-100 | about 7-25, if solves fit a 355-minute job |
| 55 | 68-99 / 126-187 / over | 23-33 / 42-62 / over | about 12-40, middle case only |

Two limits bind before the totals do. A single solve must finish in one piece: about 105 minutes here (2-hour pieces), about 330
minutes on Actions (355-minute jobs). And memory: at 12 and 25 days a solve takes 1.5-2.0 GB and its pathway's page another 1-2 GB, so
two runs and their checks fit in 15 GB; at 55 days or more, one.

The highest count that fits 10-13 Nov (80-88 usable hours), with the measured simplex:
- this machine alone: 25 days on the middle assumptions (the central's solve about 71 minutes, the set 32-45 hours), 30 days at most
  (99 minutes a solve, just inside a piece); 18 days if linking costs 3 times;
- three sessions: the same per-solve limit, so the same count, with three times the margin on the total;
- GitHub Actions: about 40 days on the middle assumptions (each solve inside a 355-minute job), 25 days on the high;
- none reaches the 100 to 250 days at which Mantegna et al. find long-duration storage's value converges within about 10%. The
  convergence test (6) measures how far the feasible count is from the benchmark, and the note states that error.

Assumptions: two solves at a time (memory), each run's check about 10 minutes beside them, 25% for relaunches and failed pieces (c7's
set took about 12 hours at 12 days against about 9.6 hours of slot time), 80-88 usable hours between the go-ahead on 10 Nov and the
refill on 14 Nov, and no single solve longer than about 105 minutes, because a simplex solve that has to resume from a saved basis
failed twice on s_nogas_c7 and its interior-point fallback starts again from scratch.

### 9.3 What runs, and in what order

The rerun set (on Nick's go-ahead, 668 (g)): c7's phases 1-4 as run (the central; 12 phase-2 solves and Deep's calibration of 2-4
rounds; the IRP and gas-floor checks without solves; 11 phase-3 solves; s_ff2040nolds_c7; s_be6 and s_be7; the 6 MTSAO runs), the held
runs (s_coalage_c7, s_ageingcoal_c7; the senior contact's stack, 3 runs and its Deep calibration) and 673 (j)'s J1-J3 (4 runs): about 47
solves and 52 engine checks.

Order (ours, rule 366: the note's figures first, then the tests its claims rest on): the pack's runs first (the central, then
c7_irpdem, s_irpgas, s_nogas_dsl, s_nogas, s_gas2032, s_cocplan, s_cocprivate, s_coalsustain, Deep's calibration, Fossil-free), with
s_nogas started early on interior point (its c7 run took five hours); then J1-J3; then the rest of phase 2 and 3, the held runs and the
MTSAO runs.

In parallel: two solves at a time; the engine checks (three year-groups, about 1.5 GB each) beside them; nothing else heavy. Disk: about
30 GB free now; each run's LP cache is deleted once its check is written, and every piece starts only with at least 5 GB free (message
646). The machine: 4 cores and 15 GB; at 12 and 25 days a solve takes about 2 GB (measured); at 55 days or more one run at a time (9.2).

### 9.4 Ranked by what the note needs (674 (c), updated for 677 (f)); what can finish by 13 Nov

Nick decides what moves; the note's mix claims are limited to what tests 6, 12-15 measure (677 (f)). Ranking (ours): first whether the
note's or the pack's text quotes the run (packfill.js's fill keys in NOTE_DRAFT.md and REVIEWER_PACK.md), then whether a quoted claim
rests on it, then the mix's accuracy (677). "By 13 Nov" assumes the go-ahead on the morning of 5 Nov, the middle assumptions of 9.2 at
25 days, and the build's extra items for tests 12-15 (about 10-14 hours on top of 9.1's list) done on 7 Nov beside tests 1-11.

| Rank | Item | Why the note needs it | One machine | Three sessions | Actions | If it moves after the note |
|---|---|---|---|---|---|---|
| 1 | The pack's runs: c7, c7_irpdem and the IRP checks, s_irpgas and s_gasfloor, s_nogas_dsl, s_nogas, s_gas2032, s_cocplan, s_cocprivate, s_coalsustain, Deep, Fossil-free; replay, validate_external, design minimums, coal swing | Every figure in the note and the pack's main findings | Yes | Yes | Yes | Cannot move without dropping the finding it fills |
| 2 | Tests 1-11 with the mix error by technology and year (677 (a)) | The go or no-go, and the error the note states | Yes (7-9 Nov) | Yes | - | The reruns would carry no measured error: not advisable |
| 3 | Test 14, the reference weather year | Bounds the mix claims by the reference year's effect | Yes (hours) | Yes | - | The note states that the build rests on one reference year, unmeasured |
| 4 | Test 12, build limits (7 runs) | Which mix results are the economics and which the limits | Marginal: fits only if the reruns run at the low end | Yes | Yes | Mix claims in years where a limit binds are stated as limit-bound, not economic |
| 5 | J1, early retirement | The pack's "still retires no coal early" | Yes, in the rerun set | Yes | Yes | That sentence comes out |
| 6 | Test 15, the two-stage prototype (central, Fossil-free) | Whether the one-stage mix at n days stands against 365-day years | No: a day of both slots in 7-10 Nov | Yes, on a second session from 7 Nov | Not as the workflow stands (a stage-2 driver over 15 steps) | The note states the one-stage mix with test 6's measured error only |
| 7 | Test 13, near-optimal ranges (80 solves and checks) | How firm each technology's quantity is within 1-2% of least cost | No: about 40 hours of wall time on top of the reruns | Marginal: about 14 hours after the reruns | Yes: a few hours, every solve independent | Mix claims are point values without ranges |
| 8 | J2, the loop's draws; s_nogas pass-limited label | Robustness of "passes in every year" (the check's 10-40 draws stand) | Yes, in the rerun set | Yes | Yes | The loop's 24 runs a year stated as a limitation |
| 9 | J3, s_prm10 | Answers the review's reserve-margin point | Yes, in the rerun set | Yes | Yes | Adequacy stated as resting on the chronological check with no margin |
| 10 | Fossil-free without vanadium, and without vanadium or iron-air; s_cocunblended, s_allbids, s_blendedhigh | The pack's tables and caveats | Yes | Yes | Yes | Tables carry c7's before-fix figures, marked, or are cut |
| 11 | Phase 3's coal-cost runs, the age-curve runs, the senior contact's stack | Comparisons asked for; not in the drafted text | Yes, last | Yes | Yes | Reported in the addendum after the note |
| 12 | System strength, VPP and geyser sensitivities; s_be6, s_be7; the six MTSAO runs | Sensitivities and the MTSAO comparison; not in the drafted text | Tight: last in the queue | Yes | Yes | As 11 |
| 13 | J4, the 2045 horizon (first to move, 674 (d)) | End-of-horizon effects on 2038-2040 builds | No | Possible after the reruns | Possible, with the workflow changed | The note states that 2038-2040 builds carry end-of-horizon effects |

On one machine alone, ranks 1-5 and 8-11 fit by 13 Nov at 25 days on the middle assumptions; 6, 7 and 13 do not, and 4 and 12 are
marginal. With three sessions everything but 13 fits, 7 only just. With Actions everything fits except the two-stage driver, which
needs its own workflow. These are estimates on the measured simplex with linking's factor and the passes unknown until test 8 and 9
report on 9 Nov; the go or no-go on 10 Nov should re-read this table with those numbers.

### 9.5 Elapsed time to a refilled pack (673 (l))

From Nick's go-ahead on the build, on the middle assumptions and this machine alone at 25 days: build 2 days; tests 3 days; go or no-go;
reruns about 1.5-2 days of wall time (32-45 hours), then the refill about 1 day: about 8 days, so a go-ahead on the morning of 5 Nov
gives a refilled pack on 13-14 Nov. Each day's slip in the build or the tests moves the refill by a day. With three sessions or
Actions for the reruns, the reruns take under a day, which buys back two days of slip. Assumptions: the build needs little debugging;
the 365-day benchmark solves inside a piece (unknown); one pass a run (c7's runs took one; clustered days may take more); no container
loss; Nick's decisions on 5 and 10 Nov come in the morning.

### 9.6 Slips

None yet (3 Nov). Any slip is flagged in SAST as soon as it is seen (674 (e)).

### 9.7 Faster without weakening (message 675): same model, same optimum, same checks

Nothing below loosens a tolerance, drops crossover on a published run, or cuts days or years.

This machine (675 (a)): 4 processors, 15 GB of memory, about 30 GB of writable disk free (the session's allowance). A run holds its
page and LP in node while native HiGHS solves; measured: at 12 days a solve peaks at 1.5 GB, at 25 days at 2.0-2.2 GB (simplex and interior point alike), and s_nogas_c7's third pass (a 148 MB LP) at 2.2 GB on interior point; the pathway's page holds 0.6-2.1 GB beside its solve. Processors bind first: native simplex and HiGHS's interior point (IPX) each use one, so four solves at most, and two
leave room for the engine checks (three processes each) and the pages. Memory: at 12-25 days two runs with their checks take about
9-11 GB of the 15; at 55 days a solve is projected at 3.5-4.5 GB and its page at 3-4 GB, so two runs only with no checks beside them;
at 105 days, one. So two runs at a time up to about 40 days, one above.

Solver options on one model (675 (b)): c7's central pass-1 LP at 25 days (701,931 rows, 386,745 columns, 5.38 million nonzeros), HiGHS
1.15.1 at its default tolerances, each option in its own process (harness/pathway/repdays/speed.py, speedq.sh). Builds compared column
by column with the simplex baseline.

| Option | Seconds | Peak memory | Objective against simplex | Builds against simplex |
|---|---|---|---|---|
| 1. Native simplex, as every run (the baseline) | 2,322 | about 2.0 GB | - (R1,610,030,793,625.48 in objective units) | - |
| 2. Interior point (IPX) with crossover | 2,559 | 2.2 GB | identical to the rand | identical (no build column differs by 0.5 MW) |
| 2. Parallel dual simplex (PAMI, 4 threads) | pending | | | |
| 3. HiGHS's own scaling advice for this LP (objective x 2^-7, bounds x 2^-4), simplex | pending | | | |
| 3. The same, interior point | pending | | | |
| 3. Objective x 2^-10, simplex / interior point; scale strategies 2 and 4 | pending | | | |
| 4. Warm start from the 12-day basis (as highs_native.py loads it) | fails in 9 s: 'Solve error' | 2.1 GB | - | - |
| 4. The same, impossible statuses set from the bounds | fails in 9 s: 'Solve error' | 2.1 GB | - | - |
| 4. The same, with HiGHS's scaling advice | pending (still running after 7 minutes: it does not fail) | | | |
| 4. Stopped at 120 s and resumed from its own saved basis | fails in 24 s: 'Solve error' | 2.3 GB | - | - |

- Interior point gives the same optimum and the same builds as simplex at 25 days, 10% slower, so it stays the fallback, not the route.
  HiGHS's parallel interior point (HiPO) is not in the highspy 1.15.1 build installed here; IPX runs on one processor, and the number of
  threads changes nothing for it.
- Results arriving after this version are added to this table in place, with the time they landed (SAST).
- Every option above runs at HiGHS's default tolerances with crossover on; the scaling options multiply costs and bounds by powers of
  two, which HiGHS undoes on output, but its tolerances then apply to the scaled numbers: the dual feasibility tolerance becomes 128
  times wider in rand terms under objective x 2^-7. Whether that counts as loosening is Nick's call; such an option is proposed only if
  its objective and builds equal simplex's, as for interior point.
- Measured beside one to three other solves on this machine, as the reruns would run; times are comparable with each other, not clean.

The 'Solve error' on saved bases in c7 (675 (b) 4). Reproduced on the 25-day LP with HiGHS's log on; two causes, neither in the model.
1. A simplex solve stopped at its time limit hands back a basis that HiGHS marks invalid (valid False: it stopped inside the presolved
   LP, before postsolve; 70,446 of 386,745 columns in a generic 'nonbasic' state). highs_native.py saves it without checking (lines 35-39)
   and the resume loads it marked valid: 'Solve error' in 24 s. This is what s_nogas_c7 met twice in c7.
2. Any warm start skips presolve ('Solving LP with useful basis so presolve not used'). From a partial basis (the 12-day LP's onto the
   25-day: 193,305 of 386,745 columns matched) dual simplex stops at once: 'Dual simplex ratio test failed due to excessive dual values:
   consider scaling down the LP objective coefficients'. The LP's costs span 1e-2 to 1e8 (shedding at VoLL x 365, discounted), and HiGHS
   says so on reading it: 'Consider scaling the objective by 1e-3, or setting the user_objective_scale option to -7'. The same loader
   restarts the 12-day LP from its own optimal basis in 0 iterations, so the loader is sound; free columns put nonbasic at an infinite
   bound (25,920 c_ columns) were a third suspect, but setting them from their bounds did not help.
Fix (proposed; a harness change, not a model change): save a basis only when HiGHS marks it valid, so a resume after a presolved solve
restarts cold instead of failing; use warm starts only if the scaled warm start (row 4 above) reaches simplex's optimum faster than a
cold solve; otherwise none. Skipping presolve also explains why the 11 Oct warm start was slower than a cold solve (RESULTS).

GitHub Actions, the existing optimiser-long-run workflow (675 (c)). Not started; nothing runs there without Nick's go-ahead.
- Runner: ubuntu-latest, GitHub's standard runner, which for a public repository has 4 processors, 16 GB of memory and 14 GB of disk,
  free and unlimited in minutes (GitHub's runner reference, read through a search summary: docs.github.com is blocked in this
  container). Each job is its own machine.
- Limits: a pass job stops at 355 minutes, inside GitHub's 6-hour job limit, keeps its state (the LP cache and any saved basis) as an
  artifact and starts the next job, which resumes it; the engine check job has 120 minutes. One chain per run name (the concurrency
  group); different names run side by side up to the account's limit on concurrent jobs, which depends on the plan and could not be
  checked here (the documentation is blocked).
- What c7's chain and the fix need from it: (1) the settings in full in the settings box: the workflow does not source env_c6.sh and
  env_c6a.sh, so c7's 30-odd keys go in by hand, and its default TF=0.5 must not, since c6's standard (STD=ntcsa) and TF exclude each
  other; (2) its check job hard-codes COMMIT=1 PSE=1 TF=0.5 LNG=1 over all years in one process, where c7's checks run LNG=1 GRID=1
  SS_FC=reservecoal in three year groups with a clean environment: the check step needs changing (a workflow change, not a model
  change); (3) Deep's calibration (the cap moved by the engine's 2035 CO2, round by round) and the checks with no solve (the IRP builds,
  the gas floor) are not workflow runs; (4) pinned versions differ from this container's (node 22.22.0 and jsdom 29.1.1 against
  22.23.4 and 30.1.3), and this container reproduces c7's LP keys on the newer versions, so the first job on the runner should confirm
  c7's pass-1 key (c62ec3e615) before any rerun there is trusted; (5) the fix's settings pass as KEY=VALUE once the pathway reads
  them.
- How many at once: one run a job; 16 GB holds one run at any count to about 105 days on the projections in 9.2; as many at once as the account's limit on
  concurrent jobs, which could not be checked here. The set's 47 solves could then run together, and the elapsed time is the slowest
  chain: Deep's calibration, 2-4 rounds in sequence.
- What becomes public: the repository is public, so anyone signed in to GitHub can read the logs (each run's settings, every pass's LP
  key and objective, builds, the loop's shed by year, and the coal-availability window summaries the pathway prints) and download the
  artifacts (state-<name>: the LP cache with solutions and saved bases and the pathway output, kept 7 days; results-<name>: the pathway
  and engine-check outputs, kept 30 days). They are the kinds of output already committed under harness/pathway/c7, but they would be
  public before Nick has reviewed them.
- ESK files: none is read. pathway_perfail.js, pathcheck.js, env_c6.sh, env_c6a.sh and roof12.js read no ESK*.csv (checked), the
  workflow downloads no Eskom data and refuses paths outside the repository. The runs do read committed files derived from ESK19679:
  every run's demand, wind and solar shapes come from profiles.json, and the page they load also fetches nodal/coal_availability_trace.json
  (the runs' coal availability comes from the engine's own outage draws, not the trace). Both are already public (section 13), and the
  logs print none of their hourly values.

More Code sessions (675 (d)). Each is its own container (4 processors, 15 GB), so two or three side by side carry two or three times
this one's runs. How I would divide them:
- All sessions on the same build commit, each confirming c7's pass-1 key, or the fixed build's own, before its first run; each on its
  own branch (claude/c8-runs-a, -b, -c) writing only to its own output folder (harness/pathway/c8/a, b, c) and its own progress log.
  This session keeps RESULTS, TODO, HANDOVER and the pack refill, and merges the others' outputs.
- Two sessions: A, the pack's runs (rank 1 in 9.4) and J1-J3; B, ranks 5-7.
- Three sessions: A, the central, Deep's calibration, Fossil-free and its variants, s_nogas and s_nogas_dsl; B, the rest of rank 1
  (c7_irpdem, s_irpgas, s_gas2032, the cost-of-capital runs, s_coalsustain) and J1-J3; C, ranks 5-7.
- Each keeps its own jobs alive with background jobs under 2 hours and stops them by PID; each costs its own tokens and needs starting
  on Nick's go-ahead.

The fastest sound route (675 (e)): on what is measured so far: native simplex as now (interior point equal and slower; warm starts fail as they stand),
with the gain from more machines rather than from the solver:
- Three Code sessions (9.7 above): keeps every output private until Nick has seen it; the per-solve limit stays at one 2-hour piece, so
  the highest count by 13 Nov is 25-30 days on the middle assumptions of 9.2 (18 if linking costs three times), with three times the
  margin on the total and room for tests 6, 12, 13 and 15 (9.4).
- GitHub Actions: the most capacity (one run a runner, 355-minute jobs), so about 40 days on the middle assumptions (25 on the high);
  but logs and artifacts are public, the workflow needs the changes listed, Deep's calibration stays outside it, and Nick's go-ahead is
  needed.
- Recommended (ours, rule 366: the route that changes nothing in the model or its checks and publishes nothing early): three sessions,
  at the count test 6 shows is needed if it is 30 days or below; Actions only if the count needed is higher and Nick accepts public
  logs. If a pending scaling option equals simplex's optimum and is faster, it is added and the counts above move up.

## 10. The review's findings and our responses

Checked against the code (index.html on claude/c7-runs, identical to main b0f7999) and the runs' committed outputs. "Confirmed"
means the code does what the review says.

Step 1, the whole optimiser:

| # | Finding | On the code | Response |
|---|---|---|---|
| 1 | Four extremes each weighted a month | Confirmed (12005-12008, 12025). The review's day statistics were measured on the page's default demand; c6e and c7 run ROOF12, which moves four of the eight matched days (the runs used 20, 72, 95, 159, 201, 269, 271, 355). The direction holds on the runs' days: on new wind, windy days 41.7% of the sample against 26.3% of the year, calm 8.3% against 1.1%, cloudy 33.3% against 4.1%. Two of the four extremes are single middle days of three-day windows. | Adopted: extremes at weight 1, three-day windows appended whole (3.1) |
| 2 | Twelve days, re-picked, not clustered | Confirmed (11926-11964); the score also holds mean demand at its evenly spaced level, which the review omits. The literature checks out with caveats: Kotzur's "8 to 12 days" are single buildings relying on grid and gas imports, not national systems; Reichenberg and Hedenus's "50% or more" covers studies with 4 to 12 days and is stated as "may be". | Adopted: clustering with medoids and rescaling (3.1); convergence to about 105 days and beyond (test 6) |
| 3 | Solar level gap hidden by the day choice | Confirmed: 2025 tracking 0.342 and fixed tilt 0.251 against 0.286 and 0.224. Added by our check: the modelled 2025 weather year gives 0.223 fixed tilt against the metered 0.251, so the gap is in the metered data, not 2025's weather. | Rescaling now (3.1); the data question recorded; days from all twelve years after the note |
| 4 | Stress windows are closed loops | Confirmed (12491; 13040-13046) | Variant (e) in test 1 (3.3) |
| 5 | Adequacy rests on 24 runs a year | Confirmed (draws 2, pathway_perfail.js:650; the 20 GWh rule, 13472-13480; the check's 10-40 draws). Loop against check ratios 1.3 to 3.4 times, not 2 to 4. c7 too: 2031 1.5 against 5.3 GWh, 2034 8.2 against 2.8. Five c6e sensitivities stopped at the pass limit; in c7 only s_nogas_c7. | J2 |
| 6 | Coal cheaper and freer in the optimiser | Partly. No no-load fuel term on cm_ (12814-12828) and no synchronous row under 'sync6' (12319-12323): confirmed. But the engine's 6 GW floor is all synchronous plant; coal is lifted only by the deficit left after nuclear, hydro, 30% of battery power and condensers (9290-9298). c7 runs 'inertia', which has its row; c7's check still curtails 28.4 TWh in 2040, so curtailment is not by itself evidence of the missing row. | Coal no-load fuel after the note (12) |
| 7 | Early retirement is a permanent shift | Confirmed (rcmono 12652; 12813, 12819; 12589-12592; none before 2029). s_irpgas: 3,127 MW from 2029, flat. | J1 |
| 8 | No planning reserve margin | Partly: no res_ row at 0 (13136), confirmed; but with the stress target on (c6e, c7) a tgt_ row holds expected shed and reserve shortfall to 20 GWh on the LP's own days (13161-13166), so adequacy is not the loop alone. s_prm10 has run only on c5. | J3 |
| 9 | Perfect foresight to 2040 | Confirmed (one solve, vintage costs, 11848) | Rolling horizon after the note (12) |
| 10 | Cost of capital and construction interest | Right for main's defaults (6.0%, 0.0782 against 0.0937 on a 25-year life); c6e ran at 5.5% (0.0746, 20.4% below 8%), c7 at the blended 6.29%. | Construction interest on all or none after the note (12) |
| - | Smaller items | Lithium's energy cap binds (13193): confirmed; its sensitivity (s_li8h) exists only on c5. Seed tail on today's fleet (12052): confirmed. Inertia slack at VoLL per MW.s (12530): confirmed. acapAt at the midpoint (10140-10145): confirmed. | Seed tail on the plan's fleet (3.1); inertia slack weighting (3.3); the rest unchanged |
| - | What is sound | Confirmed, except: "solved in 455 s" is c6e's whole pass-1 run (LP build, solve and the 15-year engine test); the solve alone of c7's pass 1 took 817 s in its run, with another solve beside it, and 519 s here. LP size not rechecked on c6e; c7's pass-1 LP is 398,529 rows, 229,575 columns and 3.08 million nonzeros (measured here). | - |

Step 2, the design note:

| # | Finding | On the code | Response |
|---|---|---|---|
| 1 | Benchmark and variants differ in solar energy by 12-16% | Confirmed: at 365 days every day is its own, so the benchmark carries 2025's levels (tracking 0.342) while the matched variants carry 0.286 | Adopted: one rescaled year for all (3.1, 6) |
| 2 | The mapping's weights 8-98 and a fit 40% worse than medoids | Confirmed on c7's days: weights 9-98, mean distance 1.26 against 0.90 for 8 k-medoids with the review's extremes; the weighted year 16% high on new wind and 9% low on tracking solar | Adopted: medoids (3.1) |
| 3 | The reserve-row claim; cheap shedding on weight-1 days | Confirmed (13136; 12520, 12525; 12530; 6023, 6029) | Claim withdrawn; target required; inertia slack at VoLL x 365 (3.3) |
| 4 | Pumped storage's reserve rows; the bldHourlySoc dependency | Confirmed (12904-12916; 13064) | Adopted (3.2) |
| 5 | No one-year LP; capped tests | Confirmed (10903-10908; pathway_perfail.js:561-568) | bldOperFrom, its LP-key and equivalence tests, a 2030 test, a full pass-1 LP, binding caps reported (3.4, 6) |
| 6 | Stress windows inconsistent with the demand splice | Confirmed (12772-12777) | Variant (e); default unchanged until it reports (3.3) |
| 7 | Extremes on today's fleet; no peak day; high-demand days nearly vanish | First two confirmed (11973, 12052). The third depends on the demand: on c7's days and demand the mapping keeps 6.6% against 7.1%; under medoids at 18 days high-demand days do fall to 1.4% | Extremes on the plan's fleet; peak day added; shares reported at every count (3.1, 6) |
| 8 | Year-long perfect foresight the engine cannot reproduce | Confirmed (168 h for long stores, pumped storage daily). Kotzur's own linked runs oversized the seasonal store 22-67% (Table C.6), which supports the review's expectation | Test 4's trace; the target or water-value option only if the trace shows it matters (3.5) |
| - | Linking the virtual power plant's batteries is physically wrong but harmless | We differ: the engine runs them inside the lithium fleet with a 48-hour look-ahead, and 2.5 hours of energy bounds what they carry | Linked like lithium (3.2) |
| - | The lvmin reserve rule is stricter than the engine's | Agreed, benign | Kept |
| - | Section 3.2 is exact without self-discharge | The paper calls its Appendix B bound conservative; exactness at zero self-discharge is our reading and the review's, not the paper's. Mantegna et al. add that Kotzur's form can let the level go out of bounds when a day charges and discharges by turns; GenX also bounds each real day's opening level | Adopted: lv within zero and capacity (3.2) |
| - | The 183-day fallback is approximate | Agreed | Labelled approximate (6) |

## 11. The choices that are ours (rule 366)

| Choice | Basis |
|---|---|
| Hierarchical clustering with medoids as the method, k-medoids compared at the chosen count | Kotzur et al. 2018 (Renewable Energy, section 6) recommend hierarchical with medoids; tsam's default; Reichenberg and Hedenus use it |
| Three-day windows appended as all three days | Kotzur's linking makes the order of real days count |
| The lowest net-load day in place of the lowest-demand day | On the plan's fleet the surplus day sizes curtailment and charging |
| A fixed union of extremes in every year, computed by a script | Robust to the fleet the LP chooses; the loop finds failing periods on the solved fleet, as ReEDS does |
| Stress target required with clustered weights | The target row is the reliability standard; pricing weight-1 days at x365 re-creates the over-weighting (Kotzur 2018, section 4.2.2) |
| Inertia slack at VoLL x 365 on every day | The inertia floor is an hourly security limit |
| Windows closed by default until variant (e) reports | Conservative; ReEDS's periodic stress periods |
| The virtual power plant's batteries linked like lithium | The engine runs them inside the lithium fleet |
| lv bounded within zero and capacity on every real day | GenX's improvement on Kotzur (Mantegna et al. 2024, section 2.3.2) |
| Self-discharge in the LP and the engine together, rate 0 until sourced | Two models of the same system read the same constants |
| The threshold for proposing a level target or water values (75% of the LP's long-store discharge, or half its seasonal swing) | A proposal trigger only; Nick decides on the build |
| bldOperFrom as the single-year LP | Keeps every row of the chosen year and none of the others, with a key test and an equivalence test |
| Two stages: k = 2 years of look-ahead, tested at 1 and 3 | A rolling horizon's usual short window; the tests show what it moves |
| Two stages: each step charges the window's annuities and operating costs only | Costs and benefits over the same years, as the one-stage LP treats its horizon end |
| A technology "settles" within 5% or 250 MW of the benchmark | 5%: the order of Reichenberg and Hedenus's cost tolerance; 250 MW: a tenth of a year's wind pace |
| Build-limit test paces from the defined cases ('grid', 'irp', 'deliverable') and the limits lifted | No new numbers |
| Near-optimal ranges with the stress windows fixed at the base run's set | One LP a point, every point independent; Neumann and Brown fix the operating sample |
| Interior point only as a fallback, with crossover | Equal objective and builds to simplex at 25 days, 10% slower (9.7) |

## 12. After the note, recorded in TODO (673 (k))

Clustering days from all twelve weather years (removes the rescaling's dimming and the reference-year dependence); rolling-horizon
solves (review step 1 finding 9); coal no-load fuel on cm_ (finding 6); construction interest on all technologies or none (finding
10); the page's own optimiser on the fixed formulation; and, from this note, the metered 2025 solar level against the modelled 2025
weather year (0.251 against 0.223 fixed tilt).

## 13. Committed files derived from Eskom data (677 (g))

Nick's decision: these stay as they are until after the note. Listed so the note can state the position; nothing changed. Checked on
claude/c7-runs, 3 Nov 2026. Class A: hourly or per-unit hourly series; B: derived results; C: single constants or figures.

| File | Class | What it holds | Read by | Licence field |
|---|---|---|---|---|
| profiles.json | A | ESK19679, calendar 2025, 8,760 hours: demand in MW (two series) and per-unit wind, solar and CSP | the page (index.html:22764), every pathway run and engine check, most of the suite | "Eskom Holdings SOC Ltd, hourly dataset ESK19679 (obtained on request): terms under review; not CC BY." |
| nodal/profiles.json | A | an older copy of the same per-unit series | nothing in the page or the runs | the same |
| profiles_rebuilt.json | A | a rebuild output, the same per-unit series | nothing (written by rebuild_national_profiles.py) | the same |
| profiles_OLD_backup.json | A | the pre-6 Sep national set, four 8,760-hour series (its meta says ESK19243) | nothing | none |
| nodal/coal_availability_trace.json | A | coal availability, 2023-2025, 8,760 hours each, each year divided by its own mean | the page (22740; the '2025, as modelled' preset), the suite (validate_weather, validate_benchmarks, validate_response); loaded but not used by the runs | the Eskom string above |
| nodal/residential_profile.json | A (Eskom's DPET tool, not ESK data) | a household load shape, per unit, 8,760 hours | the page's retail panels (18622, 18891) | "Eskom's website terms apply ... consent ... requested (October 2026) ... To be replaced with an open household shape after the note." |
| harness/ext/coal_swing.json | B | daily coal swing against Eskom's, Jan-Aug 2026: means, minimums, maximums | the reviewer pack (packfill.js) | none |
| stored_panels.json | B | the page's stored risk panels, computed on profiles.json | the page | none |
| nodal/profiles_regional_multiyear.json, profiles_multiyear_corrected.json, ninja_farm_check.json | C | Renewables.ninja wind scaled by one Eskom-calibrated factor (1.0753) | the page and the runs (the twelve weather years) | CC BY-NC-ND 4.0, or none |
| index.html and nodal_engine.js constants | C | coalEAFPct 65, exportsMW 745, nuclearCF 0.66, TAIL_COAL_FACTOR 0.76, the 2025 coal 170.4 TWh, imports' 1,066 MW mean and others, each with its source comment | the page and the runs | - |

Also to state: no ESK*.csv is tracked now (.gitignore has ESK*.csv), but ESK19679.csv was committed on 6 Sep 2026 (22c3f32) and removed
on 2 Oct (4fcd8b8), and both commits are in the public history (SOURCES: "history not purged"; TODO items 4-8 open). The site serves the
repository root (wrangler.toml: directory "./"; .assetsignore excludes only .git, node_modules and a few raw-data patterns), so every file
above is on the live site when main deploys, including the three copies nothing reads (TODO 14jy (a) open). Not checked on the live
site. Recorded decisions: TODO 14bz (profiles.json and the trace kept until after the note, then replaced with open series),
residential_profile.json to be replaced after the note (19 Oct, D2).

Decision of 3 Nov 2026 (Nick, message 680): the repository goes private and three unused copies stop being served: nodal/profiles.json,
profiles_OLD_backup.json and profiles_rebuilt.json, added to .assetsignore (pull request #155, branch claude/unserve-eskom-copies; index.html
untouched; nothing in the page, the runs or the suite reads them). profiles.json, the coal trace and residential_profile.json stay in use
and on the site. Git history is not rewritten ('history not purged' stands, pending legal advice).

Before the switch (680 (b)), found on 3 Nov:
1. Cloudflare Workers Builds: the only deploy, through the GitHub App 'Cloudflare Workers and Pages'; it built main's b0f7999 on 2 Nov. Once
   private, it reaches the repository only if that app's installation covers it: GitHub Settings, Applications, Installed GitHub Apps,
   Cloudflare Workers and Pages, Configure, Repository access 'All repositories' or the repository selected. Cloudflare's documentation was
   blocked here; its private-repository support was read only in its documentation source and a search summary (unverified).
2. GitHub Pages: the repository also publishes there (has_pages true; a build on 2 Nov). On GitHub Free a private repository's Pages site
   is unpublished; Pro keeps it. Things that name the github.io site: README.md:4, verify_deploy.js:17 and :19, validation/mip_solver.py,
   config.js:20 (the Google Solar key restriction), and attribution strings in five nodal/ data files.
3. The Claude GitHub App: Settings, Applications, Installed GitHub Apps, Claude, Configure, repository access including gridtwin-za
   (claude.ai/connect-github installs it). A new session after the switch should clone, push and open a pull request; I will test a push.
4. GitHub Actions: private repositories use the plan's allowance (Free 2,000 Linux minutes a month and 500 MB of artifacts; Pro 3,000 and
   1 GB) on a 2-processor, 8 GB runner. stress-suite.yml runs about 1,100 minutes a month at the recent pace (about 55% of Free).
   optimiser-long-run.yml would exceed Free (October: about 7,500 minutes) and its 8 GB heap equals a private runner's memory. The 'main
   checks' ruleset needs Pro on a private repository.
5. Links (site-copy rules; index.html changes go through the usual rules with a 'Visible text changed' section): index.html:1311 and :5183,
   'LICENSE' links to the file on GitHub: replace with the relative link 'LICENSE' (gridtwinza.org/LICENSE already serves it; the visible
   word is unchanged); index.html:21, an HTML comment naming the repository for commercial licensing (not visible): replace with the
   site's address. REVIEWER_PACK.md:153 ('public at github.com/nickhedley/gridtwin-za'): 'available to reviewers on request'.
   PROVENANCE.md:109: the site's address. Seven nodal/ data files carry 'Commercial licensing: https://github.com/nickhedley/gridtwin-za'.
6. Public dependants: the reviewers given the pack on 30 Oct (they lose access unless added as collaborators; TODO 14jy (c)); the
   advisor (collaborator access or the Claude app); pull requests #95 and #111 are open and only Nick's. No release, fork or star.
And one finding that matters more than the switch: making the repository private hides nothing on gridtwinza.org. The site serves the
whole checkout, and CLAUDE.md, HANDOVER.md, TODO.md, RESULTS.md, RULES.md, REVIEWER_PACK_RECORD.md, .github/ and harness/ all returned
200 on 3 Nov. TODO 14jy (a), the .assetsignore for internal files, is still open and needs to be on main first.

The safest moment for the switch (680 (c)): when no job of mine is pushing or running on GitHub, between the build's pull request merging
and the reruns starting, and after #155 and the internal-files .assetsignore are on main; I will say when. Afterwards: the site's build
stamp within 10 minutes of the next merge (Cloudflare's Retry if not), and a push from this session.


## 14. Version 2.1: messages 678 to 682 (3 Nov 2026, afternoon)

Message 678 approved the build with both settings off by default; 679, 681 and 682 amend sections 3.1, 3.6 and 6 after a further
independent read; 680 is separate (the repository and the site, section 13). Where this section and the ones above differ, this one
stands. Times SAST.

### 14.1 Build status (678; branch claude/storage-link-build, from main b0f7999)

| Item | Done | What |
|---|---|---|
| B1 | 13:03 | highs_native.py saves only a basis HiGHS marks valid; a deadline without one hands the solve to the next piece cold |
| B2 | 13:09 | bldRepWeights 'clustered': rescaled reference year, extremes from repdays/extremes.py, hierarchical or k-medoids, map365 |
| B3 | 13:15 | bldStorageLink: lv per real day, cyclic lnk, lhi/llo with cmx/cmn bounded at 0, lvmin for lithium's and pumped storage's reserve rows, the VPP linked; needs bldHourlySoc 1 |
| B4 | 13:18 | bldOperFrom, the single-year LP; equivalence on 2030: objective identity to 2.6e-14, builds identical |
| B5 | 13:27 | clustered refused without the stress target; inertia slack at VoLL x 365 on every day; bldWindowLink; the reference year (679 (a)) |
| B6 | 13:34 | storeSelfDischargePctDay, all 0, in the LP (linked only) and the engine (hourly) |
| B7 | 13:38 | the engine's pumped-storage level series; pathcheck LEVELS_OUT (the long-store trace); PS_LA_H, new engine code, measurement only (681 (d)); LA_H and LDES_LA_H were already in pathcheck, brought from claude/c7-runs |
| B8 | 13:41 | bldRcFallAway (J1); DRAWS (J2) |
| B9 | 13:50 | LIFT=yearly/all (tests 12, 16), MGA (test 13), bldStage2Year and bldAnnuityToYear with pathway/two_stage.sh (test 15), bldExistPvTrackShare (682 (d), test only) |
| B10 | running | the fix in 14.4 (13:55); BUILD_STAMP 2026-11-03a; no visible text changed (diff_public_text: 0 added, 0 removed); stored panels regenerating; the full suite after, against main's run on the same container |

With every new setting at its default, c7's pass-1 LP key is unchanged (c62ec3e615) after each item, and pathcheck's check of c7's 2040
equals main's to every digit. No slip against 674's plan: the build was planned for 5-6 Nov.

### 14.2 The reference series (679 (a), 681 (f), (g), 682 (a), (b))

Confirmed on c7's settings: modelled 2025 fixed tilt 0.2228 against the twelve-year 0.2236, tracking 0.2949 against 0.2859, new wind 0.4195
against 0.4250. Built as asked: bldRepRefYear '2025' is the default under clustered weights, 'metered' the variant (different in shape as
well as level, 681 (f)), and 'wind:<source>,solar:<source>' takes each from its own source.

Where I disagree, and why (said before the tests build on it):
- The modelled years are too windy in winter. Their annual level was calibrated to the meter, their monthly shape was not: over the five
  full metered years (2019-2022 and 2025), modelled June-August wind is 1.27 times metered and December-February 0.85 times (metered: Eskom
  data, analysis ours; 2018-2023 from PyPSA-RSA's public copy of the Eskom Data Portal series, whose citation is Nick's decision). On a rough
  adequacy proxy (not the engine), metered weather gives 48.4 GWh of unserved energy against 30.8 for the modelled weather of the same
  years. Using modelled 2025 for the calendar days makes the build agree with the engine, but both then carry the same winter bias;
  rescaling fixes only the year's level, not its months. Until Nick decides on a monthly-shape correction for both, the metered variant
  should stand beside the modelled one in tests 1, 6 and 11 (682 (a)), and neither should be called the central reference.
- Modelled 2025's match to the twelve-year means is partly by construction (682 (b)): its fixed-tilt solar is the 2023 PVGIS level by
  construction (2024 and 2025 solar are MERRA-2 2025 timing rescaled to 2023's regional level), its tracking twin is a ratio map applied to
  that, and only its wind level (-1.7% against the twelve-year mean) is 2025's own.

Which modelled years are records (682 (b)):

| Series | 2014-2023 | 2024 | 2025 |
|---|---|---|---|
| Wind | MERRA-2 record, every year its own dates | record | record |
| Solar, fixed tilt | PVGIS-SARAH3 record | filled: MERRA-2 timing at the 2023 level | filled, the same |
| Solar, tracking | the PVGIS record x the ratio map | filled | filled |

All twelve wind years share one level factor (1.0753, Eskom 2022-23). The file's note that 2005-2020 is PVGIS's coverage is SARAH2's range;
SARAH3 runs to 2023. The engine pairs one demand series (2025's shape) with every weather year, so demand and weather coincide only in 2025
(TODO 14cb).

Three data findings for Nick, none acted on (681 (g)):
- Wind's daily spread: metered 0.125 against modelled 0.166 in 2025 (the reviewer's 0.132 against 0.165 is the modern-turbine twin on both
  sides), in every metered year 2018-2025. Not geography (weighting regions by the metered fleet: 0.1653 against 0.1655) and hardly the site
  count; it is the top end of output (modelled hours above 70%: 8.0% against 2.6%), most likely the V90 power curve: the model's own V162
  series scaled to the metered mean closes 60-96% of the gap.
- The modelled wind looks to be on UTC, about two hours early: correlation with metered peaks with the model moved 2.7-3.1 hours later in
  every year. To be confirmed on one Renewables.ninja file header before any shift.
- Modelled calm spells are shorter than metered (14-16 July 2025: metered 4.8% for 36 hours, modelled 12.2%), and leap years drop 31
  December, not 29 February as the comments say.
The effect on 2040 firm capacity and storage (681 (g)) is a single-year test with REP_REF='wind:metered,solar:2025' against '2025' (test
14), run with the tests.

Section 3.1's table on the modelled 2025 basis (14 extremes; the twelve-year shares for wind and solar; 2025's for demand):

| Set | Typical weights | Mean distance | Calm | Windy | Cloudy | High demand | Daily wind spread |
|---|---|---|---|---|---|---|---|
| Modelled 2025 year | - | - | 1.4% | 26.9% | 2.5% | 7.1% | 0.165 |
| Twelve years | - | - | 1.2% | 29.5% | 3.0% | - | 0.170 |
| c7's 12 days at 30.4 | 30.4 | - | 8.3% | 33.3% | 16.7% | 25.0% | 0.148 |
| 22 days: 8 hierarchical + 14 extremes | 25-81 | 0.88 | 0.8% | 17.8% | 0.0% | 10.7% | 0.156 |
| 22 days: 8 k-medoids + 14 extremes | 17-62 | 0.82 | 0.6% | 18.1% | 0.0% | 1.4% | 0.176 |
| 34 days: 20 hierarchical + 14 | 4-40 | 0.72 | 0.8% | 27.7% | 0.0% | 5.5% | 0.159 |
| 34 days: 20 k-medoids + 14 | 9-34 | 0.68 | 0.8% | 31.0% | 0.0% | 1.4% | 0.159 |
| 59 days: 45 hierarchical + 14 | 4-17 | 0.59 | 0.8% | 28.0% | 0.0% | 8.0% | 0.167 |
| 109 days: 95 hierarchical + 14 | 1-11 | 0.43 | 1.4% | 28.5% | 2.7% | 4.4% | 0.171 |

After rescaling, which is now a small residual step (wind about x1.01, solar about x0.97). The cloudy-day artefact of the metered basis
(11-18%) is gone. High-demand days are over-represented at 22 hierarchical days and under-represented by k-medoids at 22 and 34; windy days
reach the year's share from 34 days.

### 14.3 Extremes (679 (e), 681 (a), 682 (c))

Version 2's list missed day 187 (the central's tightest hour in 2027-2030): on the metered series the union is 11 days, not 10. On the
modelled 2025 series it is 14: 113-115 (the three-day wind lull, late April, not 15 July), 160-162, 188, 214, 217-219, 257, 273 and 359.
The two 2025 series disagree on when the year's calm spell fell (daily wind correlation 0.78). extremes.json records the reference
series, the build and commit and each source run's final LP key (c7 c62ec3e615, Deep 21c10407e8, Fossil-free 63bbdcbf72); validate_lp
checks FIXED against it. It is recomputed whenever the reference series changes and, from the fixed optimiser's own builds, before the
reruns, with any movement reported (679 (e)).
Effect of 14 extremes (682 (c)): typical days at each count are n - 14 (8 at 22 days, 20 at 34, 45 at 59). Each extreme adds a calendar day
to every year: 23,300 rows on the pathway LP (section 4), so 14 against 4 is about +230,000 rows, about +60% at 12 days and +10% at 105.
Trimming is tested in test 6: the list less the days the seed and loop windows already cover (the 7-day seed windows overlap none of the
14 on the reference year's calendar), compared on cost, builds and passes. Nothing is trimmed without Nick.

### 14.4 Two stages (679 (b)): k = 4, tested at 3 and 5

- Follows AEMO's shape and not its detail (678 (c)): AEMO's second stage runs multi-year windows (seven years in the 2024 ISP) at five to
  eight load blocks a day, with no look-ahead described; ours runs one year at a time at 365 days with k years of look-ahead.
- Annuities within each step's window, matched to the years whose benefits it counts (Nick's rule); the review's version, every build
  charged to 2040 (ANNUITY_TO=2040), runs as one variant on the prototype, reported against the one-stage LP's treatment and the benchmark.
- No stage-1 floors: stage 1 gives the stress windows only.
- Size by k (measured on the step built for 2030 at k = 2 and 22 days): year y at 365 days, linked, is 481,732 rows; each look-ahead
  year at 22 days about 43,000; the fixed years before y about 25 each. So a step is about 568,000 rows at k = 2, 611,000 at k = 3, 654,000
  at k = 4 and 697,000 at k = 5, shrinking near 2040 where the window is cut. At 34 days each look-ahead year is about 62,000 rows (k = 4:
  about 730,000). Measured (14:08 SAST): the step for 2030 at k = 2 and 22 days solved in 1,128 s (19 minutes, native simplex, optimal,
  two or three other jobs beside it; on the LP before the fix below, whose 26,000 extra rows were trivially satisfied, so slightly high).
  A 365-day linked year solves faster than its size suggests (the 25-day pathway LP, 702,000 rows, took 39 minutes). Each step is
  sequential, 15 steps a pathway, and k changes each step's time roughly as its rows to the power 1.85-2.64 (9.2): k = 4 about 1.3-1.5
  times the measured step, k = 5 against k = 3 about 1.25-1.4 times. So a stage-2 pathway at k = 4 is about 15 x 25-30 minutes, 6-8 hours,
  not the 10-18 hours estimated in 3.6: the prototype on the central and Fossil-free takes about a day on one session, and stage 2 for the
  central, Deep and Fossil-free (678 (c)'s option) fits 10-13 Nov on one session beside the other two.
- Found and fixed in the build (13:52-13:55): with linking and bldOperFrom, the years before y were given linked rows (about 6,600 a year)
  on movement variables that do not exist there; satisfiable with zeros, so no result moved, but a single-year 2040 LP carried about
  90,000 needless rows. Now 23-27 rows a year before y; the default key unchanged.

### 14.5 Acceptance rules (679 (c), 681 (b), (c), (e))

1. Cost settles first: test 11's recommendation is gated on cost convergence (test 6) and on the near-optimal ranges (test 13).
2. A technology on a pace, energy or cumulative limit, or on a committed floor (MIN_BUILD, LI_MIN, GAS_MIN rows), in the compared year
   counts as limit-bound, not settled. Storage is reported in MWh as well as MW.
3. Test 2 adds: lvmin equals the minimum of lv over its mapped days in the solution, and the reserve rows' duals are read and are not all
   zero (the rows bind somewhere) or else reported as vacuous.
4. Test 9 is the reliability gate, on pathcheck's adaptive draws (10 to 40 a weather year) or J2's, not the loop's own verdict at 2 draws;
   test 4's fixed-fleet check is not a gate. Long-store cycling the engine does not realise is a finding in every variant, not only a
   proposal trigger. A first look on c7's Fossil-free 2040 build (before the fix, one draw): the engine holds the 5,000 MW of iron-air at
   455,000-500,000 MWh all year in 2016 and full all year in 2022, so it barely cycles it.
5. The 183-day fallback, if used, is reported as not chronological.
6. New test 16, the free-fleet benchmark (679 (d), 681 (e)): a single-year 2040 LP with no fleet fixed from a recorded run (OPER_FROM=2040
   LIFT=all), the central's demand and Fossil-free's rules, at 365 days against the chosen counts; labelled a method test, not a plan.
   Lifted: the yearly pace bounds, lithium's energy bound, the cumulative rows (offshore path, pumped-storage path, iron-air total), the
   turbine and gas caps and GAS_FIRST, with the committed floors off. Kept: the stress target and the seed windows.

### 14.6 Solar level (678 (b), 682 (d)): evidence for Nick, no level changed

Eskom's metered utility PV fleet (bid windows 1-4, 2,287 MW AC) ran at 0.248-0.264 in every full year since 2019, against 0.217-0.229 for
the model's fixed-tilt series in the same years: 2025's 0.251 is an ordinary year. The gap is in October-February only (metered over
modelled about 1.0 in April-September and 1.2-1.35 in summer), the pattern of single-axis trackers. The metered fleet is 53-58% on
trackers (the Minister's 2019 reply, as in SOURCES; PyPSA-RSA's plant table); plant by plant from PVGIS 2014-2023 at each plant's site and
mounting it gives 0.256, and all on fixed tilt 0.224. The denominator is right (Eskom's hourly installed capacity, AC, the same plants as
the energy; the only 2025 step, +225 MW in December, Grootfontein). The model's existing 3,568.5 MW fleet is about 70% on trackers but runs
on the fixed-tilt profile: on the twelve-year weather that share gives about 0.266 (0.253-0.277), against 0.224 used. New tracking at 0.286
is consistent with stated yields and realised output for BW4-type plants (about 0.28-0.29), possibly 5-15% low for new plants with higher
DC/AC ratios, and 0.7% high from a 2024-25 artefact. The index.html comment that the model and meter agreed in 2023 compared one model
with another (the old profiles.json series); it is wrong. A level change would be for existing utility solar alone (rooftop runs on the
same profile, unmeasured). The single-year 2030 and 2040 tests with bldExistPvTrackShare 0.70 against 0 (mix and coal burn) run with the
acceptance tests (built, B9).

### 14.7 Schedule update (674, 678 (c), 679 (f), 682)

- Build: done 3 Nov except B10 (suite after, stored panels, pull request), running; two days ahead of 674's 5-6 Nov.
- New code in the build list (679 (f), 681 (d)): the pathcheck look-ahead pass-through (LA_H, LDES_LA_H, existing code brought from
  claude/c7-runs) and PS_LA_H (new engine code, measurement only), both in B7.
- Tests 4-9 Nov now carry: tests 1-11 with the mix error, 14 (reference year: twelve years, and the metered and wind-only variants), 16
  (free fleet), 12 (limits), 13 (near-optimal, central 2030 and 2040 first), the solar tracker-share tests, the extremes trimming, the
  self-discharge brackets labelled unsourced. With the build two days early, 4-9 Nov holds them on this machine except tests 13 and 15.
- Test 15 (two stages) is rank 3 on its own Code session from 7 Nov (678 (c)), or from 4 Nov now the build is early, if Nick agrees.
  If it moves the mix materially, the option: stage 2 for the central, Deep and Fossil-free, with every sensitivity as a one-stage
  difference from its own one-stage base. That keeps sensitivities comparable with each other but not with the three stage-2 runs: a
  sensitivity's level would then not be the stage-2 level, only its difference would carry.
- Test 13: the central in 2030 and 2040 first (40 solves and checks); Deep can follow if the reruns finish by 12 Nov on three sessions,
  not on one machine.
- Reruns 10-13 Nov on three sessions (678 (e)), each confirming the LP key first; GitHub Actions not used.
- Slips: none (3 Nov, 13:55 SAST).
