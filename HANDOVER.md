# GridTwin ZA - handover, 20 September 2026

Build `2026-09-22ao`. Suite 787/790 plus eng5 6/6, measured 22 Sep 2026. Three sessions ran long and the
COST BASIS CHANGED UNDERNEATH EVERYTHING - treat any figure not re-measured since 18 Sep as
stale.

---

## Read first

`RULES.md` in full, it is short by design. Then `STATE.md`. Then this. `RESULTS.md` is current
and carries every finding with its settings; this file is state and direction.

---

## Where the suite stands

Measured 22 Sep 2026 on build `2026-09-22ao`, `profiles.json` at the root, current `nodal/`.
The previous version of this table was a running count and summed wrongly; this one is a run.

```
validate_lint             3/3     phantom keys (peakMW, asReserveFrac, psMW, battMW)
validate_structure       24/24
validate_geo             43/43
validate_capacity        30/31     standing: backup profile file has no licence field
validate_inputs          33/33
validate_findings        32/33     ancillary knee
validate_invariants     173/173   shed-energy cost; ORDC reads available reserve; market-basis cost recovery; curtailment compensation
validate_response        84/84     diesel budget and Koeberg controls added
validate_weather         66/66
validate_lp              50/50
validate_consistency     80/80     gas-firmed band re-derived from AEMC 2025
                                   three panels failed on load timing and passed on rerun
validate_benchmarks      28/28
                                   peakerSeasonRatio confounded by 2025 fleet trend
validate_external         5/6      EDMSA CO2 (known); MTSAO now the risk-adjusted case
validate_outputs         42/42     Crisis 2023 checks now an inline stress scenario
validate_solve            7/7
audit.py                 87/87
total                   787/790

eng5.js                   6/6      check 4 now reads systemCostR, which carries shed energy

Every harness that names a preset now asserts it exists (one check each, 22 Sep 2026).
```

Benchmarks fails on coal against Ember (6.8% vs a 6% band), total generation (233.6 vs
218.8 TWh) and surplusGW (0.7 GW). External fails on NTCSA MTSAO 2030 gas (+333 GWh).

---

## The cost basis changed. This invalidates figures.

`avgCost` at defaults: R548.06 -> R883.50/MWh. Two costs that NO system-cost aggregate had ever
carried were added, and new-build capex started seeing technology learning.

```
                                    was              is
fixed O&M, existing fleet        absent         R61.6bn/yr   Eskom MYPD 6 calibrated
REIPPPP PPA obligation           absent         R11.7bn/yr   delivered output, expires 2034-41
newCapexR                     flat acap*    derived from BLD_COST at vintage
BLD_COST.offshore          R88,200/kW LCOE    R79,200/kW overnight + BLD_FOM
BLD_COST.offshore decl            6.0%            2.6%       ESMAP medium, was above their high
FIXED.rooftopMW                8,731.6          8,942.1      NTCSA Aug-26 less 488 wheeled
Deep decarb solar                52 GW            45 GW      swapped for 1 GW offshore
```

The consequential one for policy work: going fossil-free by 2040 rather than 2050 costs
**R49.3bn a year**, about 12%. Before the `newCapexR` fix the model said R1.2bn, because the
headline could not see ten years of learning. See RESULTS.md.

---

## Engine changes since 17 Sep

**Offshore wind runs on its own profile.** `nodal/profiles_offshore_regional.json`,
Renewables.ninja / MERRA-2 at seven ESMAP regions, twelve years, levels scaled to ESMAP Tables
16/17 and shapes as measured. Falls back to the ONSHORE shape with a console warning if the
file is missing - that fallback is wrong in energy and in variability and must not be quoted.

**The synchronous floor can be met without coal.** Grid-forming batteries at `SYNC_GFM_SHARE`
0.30 and `SYNC_CONDENSER_MW` count toward `SYNC_MIN_MW`. Before this a no-coal run failed the
6,000 MW floor in all 8,760 hours SILENTLY. `syncUnmetH` is returned so it cannot happen again.

**Demand shifting is lossy.** `drShiftLossPct` 6%: 100 MWh out of the peak returns 106 into the
trough. It was energy-neutral, which made demand response a free store.

**CCS applies to a share of the fleet.** `ccsSharePct`, default 100. At 100% the 25% parasitic
load removes about 10 GW of effective capacity and pushes the system onto diesel - a capacity
shock, not a carbon result. Set 24% for Medupi and Kusile.

**Diesel can be retired.** `dieselDecomMW`, 0-3,400 MW. NOTE: this control, the offshore wiring
and `BLD_FOM` all appeared during the 17-18 Sep session and I cannot account for their
provenance. They work and their comments are accurate. Check them against repo history.

---

## Later on 20 Sep. Six changes and a finding.

**Grid reinforcement is charged.** National slider capacity is allocated to provinces by the
2,597 REEA authorisations - revealed developer preference, not planning - then charged against
each region's headroom through the siting panel's own formula, now extracted as the shared
`gridBuildChargeFor`. Before this the sliders assumed a COPPERPLATE: Fossil-free 2040 put 130
GW beyond headroom, 87% of everything it builds, and connected it free.

**And headroom grows with the transmission plan.** `tdpHeadroomMW` phases in 221 TDP projects
by commissioning year, weighted by published phase because only 17% is in Execution.
`tdpConfidencePct` scales them all.

```
                                    reinforcement   avgCost
Deep decarbonisation 2035, TDP built      R2.35bn    R1,553
Deep decarbonisation 2035, TDP at zero    R9.82bn    R1,591
Fossil-free 2040, TDP built               R7.93bn    R2,185
Fossil-free 2040, TDP at zero            R17.38bn    R2,232
```

Delivering the plan is worth R9.5bn/yr to a fossil-free system.

**Scarcity pricing rebuilt, twice.** A peaker-net-margin circuit breaker on ERCOT's rule - the
cap drops for the rest of the year once cumulative margin passes 3x the cost of new entry.
Crisis 2023 went from 5,430 hours at the ceiling and R14tn of wholesale revenue to 125 hours
and R6.1bn. Then the three-step curve was replaced with the canonical CONTINUOUS form, a
price adder of LOLP x VOLL with LOLP from the normal CDF of reserve forecast error and
ERCOT's half-sigma conservative shift. Two checks now assert the breaker binds and trips.

**Retail rows renamed** from Agile-style, which is Octopus Energy's product name, to Dynamic
pricing, with a third row added: geyser, pool pump and EV charging, 65% moved to the six
cheapest hours. On Today 2026 the three read R3.81, R3.60 and R3.45 - the second increment
moves 26 more points of the day and buys 70% of what the first did.

### The finding: cost recovery was never the right metric

Crisis 2023 recovering 3,862% of system cost was flagged for days as a probable regression. It
was not one. Pricing every unserved hour at the value of lost load is the correct energy-only
rule; the fault was that the system had no EXIT from it, and separately that a system-wide
percentage was never the professional measure. PJM defines missing money per megawatt-year as
the gap between a unit's total costs and its energy and ancillary revenues. Net cost of new
entry is the right statistic and the model now returns the pieces for it.

Also corrected: our R87,000/MWh ceiling is USD 5,273, essentially ERCOT's offer cap, and
ERCOT sets the VOLL in its own curve EQUAL to that cap rather than to consumer interruption
cost. The model was already at the international level.

---

## Presets

```
Deep decarbonisation 2035   35 onshore / 35 solar / 0 offshore / 10.8 GW new rooftop / 25 GW at 8h + 1 GW iron-air (NEM standard)
                            coal -27 GW, no new gas, reserve and inertia priced
Fossil-free 2040            35 onshore / 55 solar / 7 offshore / 16.8 GW new rooftop / 42 GW at 8h + 1 GW iron-air (NEM standard)
                            all coal and diesel retired; mean shed 3.1 GWh a year
IRP 2030, Grid delay        demand +20% (IRP growth on contracted demand, Mozal out), coal EAF 64%
```

Both renamed 19 Sep and both now price reserve and inertia, because leaving inertia unpriced in
a 2040 system models a market that cannot exist. Preset names are referenced by DISPLAY STRING
in twenty harness checks across six files, so renaming one is a coordinated edit.

---

## Three patterns, each seen repeatedly. Read these before searching anything.

**Single-year screening picks the wrong build. Four times now.** Four fossil-free builds showed
zero unserved on 2018; the worst failed at 969 GWh across twelve years. Always score on the
binding year across all twelve.

**The binding year depends on the BUILD, not the weather.** It has come out as 2014, 2016, 2018,
2020 and 2022 in different searches. Wind-heavy builds fail in a wind drought; offshore-leaning
builds fail when the coast is calm.

**The grid keeps missing the winning level. Three times.** Offshore stepped 0/5/10/20 and
0/10/20; the winners were 1 GW and 5 GW. Screen coarsely, then REFINE LOCALLY around the best
few - a uniform finer grid over five dimensions is unaffordable and still misses edges.

---

## Open, in the order I would take them

1. **Regional congestion is PROVINCIAL, not nodal.** Allocation and headroom are both by
   province, so the model cannot see which corridor within a province binds. The flat 4%
   congestion derate remains alongside the reinforcement charge and is still a NERSA
   compensation ceiling used as an expected rate.
2. **Offer cap versus economic VOLL.** Both are R87,000 here. ERCOT cut its parameter from
   USD 9,000 to 5,000 after February 2021; MISO caps its curve below its administrative
   load-shed price. Treating it as a policy lever is a scenario we do not offer.
3. **Superseded: regional congestion assignment.** The flat 4% derate is a NERSA compensation CEILING used
   as an expected rate, and a national scaling built on 19 Sep was removed the same day: every
   region holding existing wind has ZERO headroom, and all 19,940 MW of it sits where the wind
   is worst. A national average cannot represent that. The job: route slider capacity through
   regional allocation weighted by revealed developer preference (existing capacity plus the
   2,597 REEA authorisations); congestion per region against regional headroom; a headroom
   growth path from `tdp_projects.json`, currently unused, so a 2040 run does not use a 2025
   snapshot; reconcile with the siting panel, which currently bumps the sliders rather than the
   reverse; then re-measure every curtailment figure.
2. **Nothing since `2026-09-11j` has been seen rendered.** Six controls and several panel
   changes have gone in since. jsdom stubs the canvas and does no layout. A temporal-dead-zone
   error on 17 Sep parsed cleanly, passed a parse check, and was caught only by rendering.
3. **`bessBenchmark` is a price-taker with no capture cap.** Reports R28m/MW-yr arbitrage on a
   R0.75m asset in high-renewables builds. The 284% and 134% cover figures come from it.
4. **Cost-recovery magnitudes not quotable.** Crisis 2023 returns 4,904% of system cost.
5. **Municipal customers are not modelled.** Roughly half of households buy from a
   municipality. Largest scope gap and it blocks the PARI Gauteng work.
6. **Baseline vintage.** Grid demand 217.5 TWh against 209.6 for 2025 and 198.1 annualised for
   2026. Structural decline or cyclical? It blocks the band on the grid-served check.
7. **Re-run both presets with a finer search**, per the pattern above.
8. **`SYNC_MIN_MW` conflates inertia with system strength.** AEMO treats them separately:
   inertia adequate, system strength short and NODAL in MVA. Same category of error as a
   national congestion derate.

---

## Assumptions that are brackets, not measurements

Flagged because each currently carries a published figure:

```
SYNC_GFM_SHARE 0.30        grid-forming share of storage. Used in two places since 19 Sep,
                           when they disagreed at 0.30 and 0.50.
ORDC_SIGMA_FRAC 0.21       reserve forecast error sd. ERCOT measures it by season and time
                           block; no SA equivalent is published. CALIBRATED so a met
                           requirement costs nothing and an empty one approaches the cap.
TDP_PHASE_CONF             Execution 1.0 down to Pre-Concept 0.15. A judgement, not a
                           published probability.
REEA_SHARE                 where new build goes. Revealed preference from authorisations,
                           recompute when the REEA file refreshes.
FLEX_SHIFT_SHARE 0.65      geyser plus pool pump plus EV. The 39% geyser figure is sourced;
                           this increment is reasoned from appliance loads.
drShiftLossPct 6%          LBNL measures 10-20% for pre-cooling; geysers sit lower. Not SA.
fom* per-technology split  international weights; the LEVEL is Eskom. MYPD 6 Table 54 would
                           replace the split and leave the total unchanged.
ppaWindR / ppaSolarR       one average across bid windows. BW4 wind cleared near R620/MWh
                           against BW1 above R1,500.
BLD_COST decl rates        BNEF 2035 for most, ESMAP for offshore. Mixed sources in one table.
```

---

## Working method

**Measure before concluding** still holds, and this week it caught three of my own reversals:
offshore does NOT improve solar economics, the midpoint vintage is MORE accurate rather than a
simplification, and going early DOES cost materially once the headline could see learning.

**A wrong explanation is worse than none.** A comment saying offshore displaced solar from
already-spilled hours was the reverse of what the measurement showed. A superseded comment four
lines from live code cost a day the week before. Both are in RULES.md now.

**Share before reporting.** Three times files were described as delivered when only the copy had
run. The fix is mechanical: end the turn with the file, never write "above" in prose.
