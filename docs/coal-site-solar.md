# Coal-site solar: a solar class the build LP chooses, and a national spare-capacity pool

Design note for message 763 (a). No code. Branch claude/coal-site-solar from claude/twin-retime a77c7b2 (build 2026-11-06b).
Written 7 Nov 2026, 09:40-09:50 SAST; section 2a added 10:20 SAST (message 773); sections 2b and 2c added 10:45 SAST (message 774). Build only on Nick's word (763 (b)); claude/c7-runs is not touched.

## 1. What the model does today, and what the 8 Nov key does

Today (the pool). The build LP lets any new resource except rooftop, offshore and the technologies in bldRpExclude take a
connection freed by retired coal: rp_<t>_<y> MW of that year's build, which earns back the technology's whole grid cost
(the spur annuity plus the integration charge, GA[t], R/kW-yr) from that year on; rppool_<y> holds the sum of every rp_ to
year y at or below the coal MW retired by then, nationally (index.html, bldBuildLP, the rp_ block and rppool_ rows; the
engine prices the same use through gridChargeR, message 710 (c)). The solar that takes a freed connection runs on the
national new-solar profile, the metered tracking twin at the twelve-year mean of 0.28445, as if it stood in the Northern
Cape. With one national node the LP cannot tell the difference, so it fills the pool with solar first (the highest charge
among the technologies allowed, wind being barred in c7's central) and that solar's energy is overstated.

Two facts set the size of the problem:

| year | coal retired by the model's own dates, MW (bldCoalMW(2026) less bldCoalMW(y)) | of it in Mpumalanga (UC_FLEET region) |
|---|---|---|
| 2030 | 9,396 | 9,243 (98%) |
| 2035 | 15,486 | 15,333 (99%) |
| 2040 | 18,844 | 16,986 (90%; Lethabo's first three units, Gauteng in UC_FLEET, make the rest) |

So the pool's size is almost right for Mpumalanga already; what is wrong is the profile the pooled solar runs on, and that
the LP never has to choose between a cheaper connection on a poorer resource and a dearer one on a better resource.

The 8 Nov key (message 733; RESULTS 'The 7 Nov table' and 'The 8 Nov key's worktree'). The pool is capped at the same-area
MW: rpcap_ rows at 0 / 658 / 1,290 MW in 2026 / 2035 / 2040, the regional audit's siting share of new solar for Mpumalanga
(3%, docs/regional-audit.md). Against the national pool it cut new solar 3.0 / 2.1 / 3.7 GW in 2030 / 2035 / 2040, added
0.5 / 0.6 / 1.5 GW of wind and cost R21.7bn of LP objective (equal adequacy). That cap answers a different question from
this note's: it asks how much of the solar the LP would build anyway happens to land in Mpumalanga. This note makes the
Mpumalanga solar a choice the LP prices on its own resource, up to the coal MW retired there.

## 2. The design: a second utility-solar class, 'pvc'

One national LP, one new technology key, pvc (solar at coal sites). Everything below is in bldBuildLP unless it says engine.

- Variables: b_pvc_<y>, MW built in year y; K_pvc_<y> with bldCumVars on (kdef_ rows), as every other technology.
- Objective: the same capital charge as pv (capCharge('pv', y, yy): BLD_COST.pv with its decline, bldPvCase, bldAnnuity at
  solar's cost of capital, fixed O&M) and no grid cost: GA['pvc'] = 0, so neither the 132 kV spur nor the integration charge
  txRPerKWyr x bldGridIntVreShare. That is the whole economic difference from pv: R364/kW-yr of integration charge at 7.1%
  plus the spur annuity, against about 7% less energy and a different daily and seasonal shape (section 3).
- Balance rows: + spC x AVP(h) per MW of K_pvc_<y>, spC the day's Mpumalanga per-unit output at that hour (section 3), AVP the
  same availability factor as pv. Curtailment (crt_), the congestion derate and the stress rows see it as solar, as they see pv.
- The cap, one row per year: pvccap_<y>: sum of b_pvc_<yy> for yy <= y <= M(y), M(y) the coal MW retired in Mpumalanga by the
  start of year y, scaled as bldCoalMW scales the fleet: a new function bldCoalRetiredMW(y, 'Mpumalanga') beside bldCoalRawMW,
  reading UC_FLEET's region field and BLD_COAL_UNIT_DATES, so a pathway's COAL_DATES override moves the cap with the fleet.
  Komati (114 MW, retired 2022) is outside bldCoalMW(2026) and so outside the cap, as it is outside today's pool; counting it
  would be a one-line change if Nick wants Eskom's Komati repowering inside.
- Early retirement (rc_<y>): today's rppool_ adds rc_ to the pool. rc_ is on by default (bldCoalEarlyOn 1, so it is in the
  key's LP; the compliance cost itself is 'none' in c7's central) and is national MW with no station attached. The cap adds
  rc_<y> x Mpumalanga's share of the coal MW standing at the start of year y (a per-year constant from UC_FLEET's region
  field, computed, not typed): 28,455 of 39,692 MW in 2026, rising as the Mpumalanga stations close first and falling after
  2038 when Lethabo's units go. Decision D4.
- Build rate: pvc draws on the same yearly solar pace as pv (RATE.pv with bldPvRateGrowthPct): b_pv_<y> + b_pvc_<y> <= the
  pace, so the class adds no delivery capacity the model did not have. The pvccap_ rows are the only other limit.
- The pool: rp_pv_ columns are removed (pv pays the full charge, no pool). Wind stays in bldRpExclude. What the pool does for
  storage and gas is decision D1 (section 8).
- The same-area cap (rpcap_ rows) is switched off when the class is on; the two are alternatives, never both.
- Switch: FIXED.bldPvCoalSite, 0 or 1. At 0 the LP text is byte for byte today's (the LP-key test, as the system-strength
  switch was tested). At 1 the class is on. Decision D2 says what the page's default is.
- Outputs: bldBuildToState and the pathway's schedule record b_pvc as newPvCoalMW; the LP dump keeps pv and pvc apart so the
  report (763 (c)) can say solar at coal sites and elsewhere by year.

What the LP will then weigh, per MW of pvc against pv, in 2026 money: it saves GA['pv'] a year (the integration charge at
bldGridIntVreShare plus the 132 kV spur annuity; GA['pv'] on the current page, from the code, not typed here) and gives up about
6.6% of annual energy, more in summer and none in winter (section 3). The class should therefore fill early and fast, up to the
cap, unless summer curtailment makes the marginal MW worthless; the run will say. Expect the answer to sit between the national
pool (solar on freed connections at the national profile) and the same-area cap (almost none), and closer to the pool.

## 2a. Eskom's repowering pipeline beside the cap and the key's pool (message 773)

Eskom's pipeline at six stations (Engineering News, 17 Jun 2025, cited at FIXED.bldRpExclude): solar PV 3,184 MW, batteries
700 MW, gas 1,000 MW at Kriel, wind 168 MW at Arnot, about 5 GW in all. Station by station (the same article), beside each
station's coal MW on the model's dates (UC_FLEET, scaled as bldCoalMW scales the fleet) and its closure year:

| station | pipeline solar, MW | other pipeline MW | coal MW retired (scaled) | closure (UC_FLEET) | solar as a share of the freed MW |
|---|---|---|---|---|---|
| Komati | 122 | battery 150 | 109 (retired 2022, outside bldCoalMW(2026)) | 2022 | 112% |
| Grootvlei | 195 | battery 150 | 546 | 2030 | 36% |
| Arnot | 800 | battery 200, wind 168 | 2,013 | 2027 and 2029 | 40% |
| Camden | 680 | – | 1,419 | 2030 | 48% |
| Hendrina | 587 | – | 1,052 | 2030 | 56% |
| Kriel | 800 | battery 200, gas 1,000 (being assessed) | 2,530 | 2028 and 2030 | 32% |
| six stations | 3,184 | 1,718 | 7,669 | | 42% |

Set beside the two limits:

| year | class cap: coal MW retired in Mpumalanga (section 2) | the key's same-area pool (rpcap_, message 733) | pipeline solar at stations retired by then |
|---|---|---|---|
| 2029 | 3,177 | 0 (2026 row; between rows the cap steps with the siting share) | 1,600 (Arnot, Kriel's first three units) |
| 2030 | 9,243 | about 300-400 (interpolated between the 2026 and 2035 rows) | 3,062 (all but Komati) |
| 2035 | 15,333 | 658 | 3,062 |
| 2040 | 16,986 | 1,290 | 3,062 |

Three readings. The key's same-area pool is below Eskom's own plan at six stations by a factor of about five in 2035 and 2.5 in
2040, so the 8 Nov key's central understates coal-site solar on the evidence we hold. The class's cap is three times the
pipeline in 2030 and five times it in 2035: the pipeline uses about 42% of the freed MW at its six stations for solar, and
none of the Tutuka, Duvha, Matla, Kriel-later or Majuba MW, where no project is public. Komati's 122 MW sits above that
station's 109 MW of freed capacity (its pipeline includes a battery and wind on the same connection), which bears on D3.

Status (searched 7 Nov 2026; web, Eskom's site not read): the 17 Jun 2025 article reports National Treasury approval for
Eskom to continue large-scale renewables and development begun at Hendrina, Camden and Grootvlei; the gas at Kriel is being
assessed; a World Bank programme document (P514521, 2025) frames a repowering programme of up to 1,572 MW of solar and wind and
850 MW of batteries; Engineering News (6 Mar 2026) reports Eskom's shut, repower or run-on decision promised for September
2026, with the answer turning on new capacity being contractually secured. No financial close or construction start was found
for any of the six beyond Komati's first phase, and the outcome of the September decision was not found. To verify before the
run (one search; TODO when built).

Floor, cap or check. Recommendation: a check, not a floor and not a cap.

- Not a cap. The pipeline is one owner's programme at six stations. The physical limit on the class is the freed connection
  MW, which is what the cap already is; private developers on Eskom's leased station land and the stations without a public
  project would add to the pipeline, not be bounded by it. Capping the class at 3,184 MW would write Eskom's 2025 plan into
  every year to 2040.
- Not a floor in the central. Planning practice (the IRP's own treatment, the model's MIN_BUILD floors for the 2026-27 fleet in
  service) fixes only committed capacity: at financial close or under construction. None of the six is shown to be there. A
  floor would force 3,062 MW of coal-site solar by 2030 whatever its cost, and would hide the one thing the class is built to
  find: whether solar on a freed connection at Mpumalanga's resource is worth building at the model's costs.
- A check, two parts. (1) The run reports the class's build in 2029, 2030 and 2035 against the pipeline's 1,600 / 3,062 /
  3,062 MW; if the LP builds less than the pipeline at the stations retired by then, that is a finding (Eskom's programme is
  dearer than the alternatives on these costs), reported, not corrected. (2) A sensitivity, one LP, with the pipeline as a
  floor on the class (b_pvc cumulative >= the station-by-station MW from each closure year), labelled 'Eskom's pipeline
  committed', so the cost of treating the plan as firm is on the record beside the central. If a station reaches financial
  close before the key is final, that station's MW moves from the sensitivity to the central's floor, as the 2026-27 fleet did.
- D1 is affected: 700 MW of batteries and 1,000 MW of gas at the same six sites are evidence that storage and gas do take
  freed connections in practice (RULES.md, decisions without Nick follow practice), which favours D1 (ii): the pool stays for
  storage and gas, sharing the Mpumalanga MW with the class in one row. Section 8 is updated.

## 2b. Variant 2: a national spare-capacity pool (message 774)

A simpler alternative to the class, run beside it in (c), never with it in one LP. The first H MW of new wind and utility
solar, counted together and cumulatively over 2026-40, pay no integration charge; every MW beyond H pays the flat charge
(txRPerKWyr x bldGridIntVreShare), as today. H is illustrative: 5,000 and 10,000 MW. It is not an NTCSA figure, and the
repository holds no NTCSA capacity figure to replace it with; the caption and RESULTS say so.

The mechanism is the Cape allowance's (cw_ and cwpool in bldBuildLP), with two differences: it covers solar as well as
wind, and it loses no output (the Cape allowance cuts bldCapeCurtPct of its wind's output; the spare pool is spare, so nothing
is curtailed for it).

- Variables: hp_wind_<y> and hp_pv_<y>, MW of that year's build on the pool.
- Objective: each earns back the integration charge from its year on, discounted, exactly as cw_<y> does (the same _cwTx
  sum; the spur annuity is still paid, since the plant is connected wherever it is built).
- Rows: hpb_<t>_<y>: hp_<t>_<y> <= b_<t>_<y>, and for wind hp_wind_<y> + cw_<y> <= b_wind_<y> when the Cape allowance is on, so
  no MW is credited twice; hppool: the sum of every hp_ over both technologies and all years <= H.
- Profile: none. The pool has no location, so wind and solar run on their national profiles as today. That is the point of
  the variant and its limit: it says nothing about where the spare capacity is.
- The freed-coal pool (rp_) and the same-area cap are off when the spare pool is on: the spare pool replaces them, so new
  solar and storage and gas pay their full grid cost and early retirement earns no connection credit. That is the second
  thing the variant tests (section 2c).
- Switch: FIXED.bldSparePoolMW, 0 off (LP text byte for byte today's), else H in MW.
- Engine: gridChargeR credits u.gridHpMW (by technology, from pathcheck's record of the run's hp_ columns) at
  bldGridIntegRkW(t), as it credits the Cape wind; on the page basis, without a run record, min(H, new wind + new solar) at
  that rate (wind and solar pay the same integration charge, so the order between them does not matter).
- Harness: pathway_perfail.js SPARE=H sets the switch and records sched[y].hp by technology; pathcheck.js carries it to the
  engine as cum; validate_lp.js check 'spare-capacity pool': hp_ columns exist only with the switch on; hppool's right-hand
  side equals H; the objective coefficient of hp_pv_<y> equals the discounted sum of the integration charge from y (to R1)
  and not GA['pv']; hpb_ holds hp plus cw at or below the year's wind build; no rp_ column exists while the switch is on.
  Injected faults: (i) hp_ credited at GA['pv'] instead of the integration charge; (ii) hppool dropped; (iii) rp_ left on
  beside the pool. Each seen to FAIL and reverted.

Hours added: about 2.5 (LP 1, engine 0.5, harness and check 1). Runs added in (c): two pass-1 LPs (H 5,000 and 10,000) with
their 20-draw checks, about 2 hours each including the check, two at a time with the class's run.

## 2c. What (c) reports for each variant, beside the key (message 774)

For the key, the national pool, the class and the spare pool at each H, one table: by year 2030, 2035 and 2040, new wind,
solar at coal sites, solar elsewhere, lithium, curtailment and unserved (20 draws, with the standard error); and for every year
2026-40 the coal retired early (rc_<y>, sched[y].earlyRetMW) beside the coal standing, the LP objective (2026-40 by
construction) and CO2.

Why early retirement is in the table. Today's pool and the class both add early-retired MW to the freed-connection budget
(rppool_ subtracts rc_; the class's cap adds rc_ at Mpumalanga's share, D4), so retiring a unit early earns a connection
credit as well as saving its running and compliance costs. The spare pool breaks that link. The difference in rc_ by year
between the class and the spare pool is therefore the connection credit's share of the LP's early retirement, which no run
has isolated.

CO2 2026-40: the LP's own CO2 row by year, which from build 2026-11-06a is coal's emissions with the part-load factor on the
engine's basis (RESULTS 'The review of claude/twin-retime of 6 Nov', finding 1), summed over the horizon for every case on one
basis at no extra solving; the engine check's CO2 at 2030, 2035 and 2040 at 20 draws beside it as the check. A full-horizon
engine CO2 at 20 draws is about 65 minutes a case (4.3 minutes a year) and is offered only if Nick wants it after the first
table.

## 3. The profile: where it comes from and its provenance

Two sources were named. Recommendation: A.

A (recommended). The Mpumalanga series of nodal/profiles_regional_multiyear.json, solar_pu['Mpumalanga'], twelve weather years
2014-2025, 8,760 hours each, per unit. Provenance from the file's meta: PVGIS-SARAH3 at 5 km, aspect 180, tilt = latitude, 10%
system loss, at the region's capacity-weighted centroid (fetch_real_regional_profiles.py); on SAST; leap years handled (message
684); re-timed by the sun's height on claude/twin-retime (retime_pvgis.py, f3af8b0, message 707 (b)); meta.solar_borrowed_years
says which region-years outside PVGIS coverage keep MERRA-2 timing rescaled to the PVGIS level (to be listed for Mpumalanga in
RESULTS when built). This is the same file weatherYearNational already reads for every modelled weather year, so the
Mpumalanga series of weather year y is the one whose national weighted sum the rest of the system runs on in that year: the
hour-by-hour correlation with the other regions, with wind and with demand is the measured one. Licence: the file is the
project's own compilation (CC BY-NC-ND 4.0, underlying PVGIS, EU JRC, free to use with attribution). No Eskom data enters it,
so the Eskom rule in CLAUDE.md does not bind: the series, its twin and every result may be published.

Measured today from that file (twelve years, capacity-weighted national fixed tilt against Mpumalanga fixed tilt):

| | national weighted (FIXED_PV_CF_12Y basis) | Mpumalanga | ratio |
|---|---|---|---|
| annual mean, per unit | 0.2236 | 0.2089 | 0.934 |
| June | 0.201 | 0.208 | 1.036 |
| December | 0.229 | 0.198 | 0.863 |
| by hour, June (07:00 / 12:00 / 16:00) | 0.06 / 0.71 / 0.23 | 0.16 / 0.72 / 0.18 | earlier and shorter day |

Mpumalanga is 7% below the fleet's mean over the year, above it from May to August (dry winters), 11-14% below it from October
to March (summer rain), and about an hour earlier in the day (it lies east of the Northern Cape). The winter and morning shape is
the part that matters for adequacy; the summer deficit is the part that matters for curtailment. Both are what the LP should see.

The tracking twin. New solar in the key is on tracking (bldPvTracking 1). The class gets its twin as pv gets it: solarTrkOf
applied to the Mpumalanga fixed-tilt series, the national month-by-hour tracking ratio map SOLAR_TRK_G and the metered scale
SOLAR_TRK_K from nodal/profiles_solar_tracking_map.json. The map is national, so the twin is an estimate for Mpumalanga, stated
as such; its twelve-year mean is measured when built (expected about 0.266 per unit against 0.284 nationally) and recorded as
NEW_PVC_CF_12Y beside NEW_PVTRK_CF_12Y, generated, not typed.

On the representative days. A clustered day is the reference year's series rescaled so the year's mean equals the twelve-year
mean (bldRepDays 'clustered'); a tail or stress day carries its own weather year's series (nat.solar). The class follows the
same rule with its own key: r.solarC on every day, from the Mpumalanga series of the day's year (the reference year 2025 for
clustered days, rescaled to the class's own twelve-year mean by the same bldScaleTo rule; the window's year for stress days),
through the twin when tracking is on. Finding 3's factors (f3d, in the key) apply to the national twin's days; the class's days
take the same factors, since the factors correct timing, not level (to confirm on the key's worktree).

B (not recommended). The national new-solar shape (the metered 2025 tracking twin, ESK19679) scaled by month to Mpumalanga's
monthly means from the PVGIS file. It keeps the national hour-by-hour weather on a plant that is 1,000 km from most of the
fleet, so it carries the wrong correlation with wind and demand and the wrong time of day (the table above: Mpumalanga's
June morning is three times the national value at 07:00). It is also derived from Eskom's hourly series, so under the Eskom
rule its per-unit hourly series could not be published, only results. It is the right fallback only if the PVGIS file were
found wrong for Mpumalanga, which the regional audit did not find.

Practice (RULES.md, decisions without Nick): the IRP's own modelling (CSIR for the DMRE) and PyPSA-RSA run solar by supply
area on reanalysis or satellite profiles per area, with transmission between areas; a national-only model that prices a
regional resource is the simplification, and giving the class its own area's profile is the smallest step toward that practice.
Eskom's own repowering pipeline (solar 3,184 MW, batteries 700, gas 1,000 at Kriel, wind 168 at Arnot; Engineering News, 17 Jun
2025, already at FIXED.bldRpExclude) is the evidence that coal-site solar is a real class, not a modelling device.

## 4. What must change in the engine (simulate and its readers)

1. A new state key, newPvCoalMW (FIXED default 0; a slider only if D2 says the page shows the class, else state only).
2. The series. weatherYearNational attaches solar.mp (Float64Array, the year's Mpumalanga series) beside the weighted
   national solar, as wind.off carries offshore; PROFILES.solar gets solarMp for the metered profile from the file's 2025
   series (the metered reference has no Mpumalanga meter; the PVGIS 2025 series is the only hourly Mpumalanga record we hold).
   A new pvCoalSeriesFor(prof), beside offshoreSeriesFor, returns the day's series, with the twin through solarTrkOf when
   tracking is on. Loud failure, never a silent fallback to the national shape (rule 7): a build with newPvCoalMW > 0 and no
   Mpumalanga series throws.
3. solarU, the blended per-unit utility series: (E x existing + N x twin + C x Mpumalanga twin) / (E + N + C), C = newPvCoalMW;
   pvCap = pvUtilityMW + newPvMW + newPvCoalMW. Everything downstream (dispatch, curtailment, congestion shape, capture price,
   the twelve-year adequacy test, the risk panels) then sees one utility fleet, as it does for tracking today.
4. Costs. newCapexR prices the class at pv's capex by vintage (bldVintageMW gains a pvc entry; the page's midpoint-vintage path
   likewise). gridChargeR adds pvc at rate 0 and drops pv from GRID_RP_T when the class is on; the pool credit for the other
   technologies follows D1. The engine's pool use from pathcheck (u.gridRpMW) no longer carries pv.
5. Reports. The dispatch CSV, the energy mix and the new-build tables show solar as one line plus a 'of which at coal sites'
   figure; pathcheck rows gain newPvCoalMW and its energy; the regional path (bldBuildRegionalLP, nodal_engine.js) is untouched.
6. BUILD_STAMP bumped; stored_panels.json regenerated (RULES.md 'Stored risk panels'; index.html changes, so the fingerprint
   moves even with the switch off).

## 5. The harness

- harness/pathway/pathway_perfail.js: PVC=1 sets bldPvCoalSite; the schedule records b_pvc_ as sched[y].pvc; the pool record
  drops pv.
- harness/pathcheck.js: cum.pvc to over.newPvCoalMW, vintage by year; gridRpMW without pv.
- harness/validate_series.js (the LP-against-engine series probe, SPROBE): the class's column and its per-unit series
  compared to the digit, as pv's are.
- harness/validate_lp.js, the check 763 (b) asks for, 'coal-site solar class' (section 6).
- validate_structure, validate_outputs, validate_invariants: the new key in their lists where every new-build key is listed.
- Full suite before and after, counts reported with the known failures (CLAUDE.md).

## 6. The check, and the fault it must catch

In validate_lp.js, with bldPvCoalSite 1 on the page state and the twelve weather years loaded (as the other LP checks run):

1. Switch at 0: the LP text equals the text with the key absent, byte for byte.
2. Switch at 1: b_pvc_<y> columns exist for every year; no rp_pv_ column exists; pvccap_<y> rows exist with the right-hand side
   equal to bldCoalRetiredMW(y, 'Mpumalanga') to one decimal for 2030, 2035 and 2040 (computed in the check from UC_FLEET,
   not typed).
3. The profile reaches the LP: on a June representative day at 07:00 the balance coefficient of K_pvc exceeds K_pv's, and on a
   December day at 15:00 it is below it (the shape of section 3; the check reads the coefficients from the LP text).
4. The charge: the objective coefficient of b_pvc_<y> equals b_pv_<y>'s less the discounted sum of GA['pv'] from y, to R1.
5. The engine: newPvCoalMW 1,000 and newPvMW 0 against newPvMW 1,000 and newPvCoalMW 0 on the same year give solar energy in the
   ratio of the two twins' annual means to 0.5%, and gridChargeR's figure for the first is lower by 1,000 x GA['pv'] x 1,000.
6. The rate: the pace row holds pv plus pvc.

Fault injection before the pull request (763 (b)), each recorded in RESULTS with the FAIL line: (i) the class's balance
coefficient read from the national series instead of Mpumalanga's (check 3 fails); (ii) GA['pvc'] set to GA['pv'] (check 4
fails); (iii) the cap row dropped (check 2 fails); (iv) the engine reading solar instead of solar.mp for the class (check 5
fails). Each fault reverted and the check seen to pass again.

## 7. Hours, timeline and whether 9 Nov 18:00 SAST can be met

| step | hours (one session, nothing long beside it) |
|---|---|
| LP class, cap function, switch, outputs | 2.5 |
| engine: series, blend, costs, reports | 2.5 |
| harness: perfail, pathcheck, validate_series, the new check with four injected faults | 2.5 |
| suite before and after (in parts) with the stored panels regenerated and checked (about 45 min of it) | 3 wall, part unattended |
| pull request with the counts and the visible-text section (none expected) | 0.5 |
| (c): one pass-1 LP on the key's settings, 25 clustered days, linking, PVC=1 | 1.5-2.2 (80-86 min beside one other solve; two pieces under 2 h) |
| (c): engine check at 20 draws, 2030, 2035, 2040 | 0.3 (17 min for four years at K=20) |
| (c): the national-pool comparison on the same settings, if the main session has not run it | 1.5-2.2 + 0.3 |
| write-up in RESULTS, beside the key and the national pool | 0.5 |

Build and test about 11 hours of session time from the go, 13.5 with the spare pool (section 2b); the runs about 2.5 hours
for the class alone, about 5 with the two spare-pool cases solved two at a time, 7 with the national-pool comparison as well.

The deadline can be met if two things hold:

1. The go arrives by Saturday 7 Nov about 18:00 SAST (20:00 for the class alone), so the pull request is open by Sunday
   morning and the three runs are done by Sunday afternoon. A go on Sunday morning leaves the runs finishing at about Sunday
   22:00 SAST: a miss of about four hours; the class alone would miss by about two.
2. The 8 Nov key's code is reachable. Its settings depend on patches that exist only in the main session's worktrees, on no
   branch (RESULTS 'The 8 Nov key's worktree': gtza-k8's battery proposals, gtza-f3d's factors behind bldRepF3d, gtza-w40's
   'cf0.40' in windNewCorr, gtza-rpcap's rpcap_ rows behind bldRpSameAreaCap). On claude/twin-retime's head none of these
   keys exists and windNewCorr rejects 'cf0.40'. Without them (c) would run on the key's settings that do exist here (metered
   2025, GAS_FIRST=2035, 25 clustered days, linking, CONG_OFF=1, WX_WINDCORR=1, open-cycle capex 0.74) with new wind at the
   six-constant table's correction rather than 40%, and would not be the key's basis. The fix is one push from the main
   session: gtza-key's index.html, pathcheck.js and pathway_perfail.js diffs to a branch (say claude/key-patches), which this
   branch merges before (b) is built, so the class sits on the key's code and the LP-key test at switch 0 compares against
   the key's own pass 1 (key 48ffc38a70 with every switch off, 761 (a)).

If either fails, (c) by 9 Nov 18:00 SAST is not met; what can still be delivered by then is (b) merged into claude/twin-retime
and the class's run on twin-retime's own settings, labelled as not the key's basis.

## 8. Decisions for Nick

- D1. The pool for storage and gas. 'No pool' in 763 can mean (i) the rp_ mechanism goes entirely when the class is on, the
  freed MW being the class's alone; or (ii) rp_ stays for lithium, vanadium, iron-air, gas and pumped storage, sharing the
  Mpumalanga MW with the class in one row. Batteries pay no integration charge in the LP as it stands (bldGridBattHalf off),
  so (ii) matters only for gas and pumped storage. Recommendation (revised, message 773): (ii), since Eskom's own pipeline puts
  700 MW of batteries and 1,000 MW of gas on the same six sites (section 2a); (i) is the simpler LP if Nick prefers the literal
  reading.
- D2. The page. (i) bldPvCoalSite 0 on the page, 1 in the pathway's environment: no visible text, no preset moves, the page's
  stored panels regenerate for the fingerprint only; or (ii) a page control with a caption, which changes visible text and
  needs the advisor's review before merge. Recommendation: (i) for this pull request; (ii) after the key, if the class enters
  the central.
- D3. Komati inside the cap or not (section 2). Recommendation: not, to match bldCoalMW's 2026 basis; a line if wanted.
- D4. Early retirement's share of the cap (section 2): rc_ at Mpumalanga's share of the coal standing that year, or none
  (the cap on scheduled closures only, conservative). Recommendation: the share, computed.
- D5. Profile A (PVGIS Mpumalanga, twelve years) or B (national shape by month). Recommendation: A.
- D6. Whether the main session pushes the key's patches to a branch (section 7, item 2).
- D7. The spare pool's H counted cumulatively over 2026-40 (as cwpool counts the Cape allowance), not per year.
  Recommendation: cumulative, the literal 'first H MW'.
- D8. With the spare pool on, the freed-coal pool and the same-area cap are off (section 2b), so the two variants are
  alternatives in separate runs. Recommendation: yes; a combined run only if the first table asks for it.

## 10. What was built (7 Nov 2026, build 2026-11-07a; message 777)

Built as designed, with these readings taken while Nick was offline (each with its reason):

- The class's tracking twin is PVGIS's own single-axis tracking series for Mpumalanga, year by year (nodal/profiles_solar_tracking.json,
  the file the national twin's modelled years already read), not the national month-by-hour map applied to the fixed-tilt series:
  the real series exists for every year, so an estimate was not needed. Its twelve-year mean is 0.2552 per unit (fixed tilt 0.2089),
  computed at run time (bldPvCoalTwelveYearMeans), never typed.
- The class's own seasonal factors (D5): bldRepF3dApply, finding 3's rule as the key's inline code, applied to the class's days against
  its own twelve-year month means (bldPvCoalF3d 1, on when the reference is metered), recorded as days.f3dC and in the pathway's
  output (pvCoalDays) beside the national record. The rule caps each scaled hour at 1 per unit, as the key's does; on the key's
  settings seven of the class's 600 representative hours sit above the class series' own maximum (0.849 against 0.826), reported by
  validate_lp, not failed: changing the cap would change the rule. For Nick.
- D1 (ii): one row per year, pvccap_<y>, holds the class and every freed connection of storage and gas (rp_, wind barred) within the
  Mpumalanga MW; the national rppool_ row stays as it was for rp_ alone, so storage and gas are bounded by the tighter of the two.
  Freed MW outside Mpumalanga (Kelvin 2027, Lethabo 2038-40, about 2.0 GW by 2040) are offered to nobody while the class is on: a
  simplification, TODO 14mn.
- D4: early retirement enters the cap at Mpumalanga's share of the coal standing that year (bldCoalRegionShare, 0.717 in 2026 falling
  to 0.55 by 2040), computed from UC_FLEET; with the compliance option (COMPLY=compromise in the key) rc_ is in the LP.
- The class draws on utility solar's yearly pace (pvcpace_<y>: b_pv + b_pvc at or below the solar rate with its growth), so it adds
  no delivery capacity; its own bound is the same rate.
- The same-area cap (the key's rpcap_ rows) is off in the (c) worktree by FIXED.bldRpSameAreaCap 0, not by code: the cap is the key
  patch's, not this branch's. With the class on it would otherwise bind storage and gas's freed MW at 658 MW.
- Spare pool (2b): built as designed; hp_ columns, hpb_ rows (wind's shared with cw_), hppool at H; the freed-coal pool off with it.
  The engine credits the run's recorded hp_ MW (gridHpMW) at the integration charge, or the page rule without a run.
- Page (D2 (i)): FIXED.bldPvCoalSite 0, newPvCoalMW 0 and bldSparePoolMW 0; no slider, no visible text; newPvCoalMW in
  PRESET_NON_SLIDER_KEYS so a build applied from the optimiser does not leak into the next preset. BUILD_STAMP 2026-11-07a.
- Identity: with every switch off, the (c) worktree (this branch plus harness/pathway/final/key/key_on_twin-retime_2d86faa.patch)
  builds the key's pass-1 LP with SHA-1 c10bea45a9085fc64401496b11dbdd309be35c78, the key's own (RESULTS on claude/c7-runs,
  message 768 (b)), to every digit; and on the page default the LP text with the switch off is byte for byte the base's.
- validate_lp.js: 19 checks for the class and the pool, each family proved on an injected fault (the class on the national twin in the
  rows; the class charged solar's grid cost; the cap row dropped; the engine running the class on the national twin; the pool credited
  at the whole grid cost; the pool row dropped; the freed pool left on beside the spare pool; the class's typical days rescaled to the
  national target table). The last was the fault the first (c) run found: the clustered days' typical-day rescale read the national
  target table, which has no entry for the class, so the days could not be built; fixed in 942b559.
- Harness: pathway_perfail.js PVC=1 and SPARE=H, sched[y].pvc and sched[y].hp, the output's pvCoal, sparePoolMW and pvCoalDays;
  pathcheck.js carries the run's switches, cum.pvc to newPvCoalMW, the class's vintages and gridHpMW to the engine.

## 9. Sources used in this note

- index.html on a77c7b2: FIXED.bldRpExclude and its comment (Eskom's repowering pipeline, Engineering News, 17 Jun 2025);
  bldBuildLP's rp_, rppool_, cw_ and balance rows; bldGridAnn, bldGridIntegRkW, gridChargeR (message 710 (c)); UC_FLEET's
  region field; bldCoalRawMW, bldCoalMW; weatherYearNational, solarTrkOf, offshoreSeriesFor; simulate's solarU blend.
- nodal/profiles_regional_multiyear.json meta (solar_source, solar_borrowed_years, solar_timezone, compiled 2026-11-05);
  nodal/regional_renewable_capacity.json solar_mw (the national weights); nodal/profiles_solar_tracking_map.json meta.
- claude/c7-runs RESULTS 'The 7 Nov table', 'The 8 Nov key's worktree and its checks before the loop'; HANDOVER (h), the
  pass timings; claude/regional-audit docs/regional-audit.md (siting shares, the regional data inventory).
- Section 2a: Engineering News, 'Eskom reports progress on 5 GW repowering pipeline as $2.6bn CIF approval is secured',
  17 Jun 2025 (the station-by-station MW); Engineering News, 'Repowering coal power stations', 6 Mar 2026 (the September
  2026 decision); World Bank Program Information Document P514521 (the 1,572 MW and 850 MW programme frame); web search,
  7 Nov 2026, Eskom's site not read.
- The figures in section 3 were computed on 7 Nov 2026 from the file as it stands on a77c7b2 (scratchpad, not committed);
  the build recomputes them in the check and in RESULTS.
