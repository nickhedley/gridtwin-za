# Independent review of claude/twin-retime (dea3623) against main 57f70df

Message 725. Read-only on the branch; nothing on it was edited, merged or configured. Reviewed from the branch's own code and
data in a worktree, with its harness run there; the record (commit messages, SOURCES) was read second and checked against the code.
ESK19679.csv absent, so the Eskom anchor checks were skipped and the metered 2025 series in profiles.json stood in. Times SAST.

## Findings, in order of effect on results

1. **The build LP's CO2 cap row counts coal emissions without the part-load factor the objective now carries.** index.html:13442
   (`capTerms.push((EMIS_COAL * r.weight) ... gc_)`) against the objective at index.html:12923 (`CARBON_AT(y)*EMIS_COAL*bldCoalPartLoadAt(S, y)`)
   and the engine's CO2 at index.html:10659 (`coalFuelMWh*p.emisCoal`, the fuel-equivalent MWh). Inside the LP coal's carbon is priced on
   1.034 to 1.051 times its output (FIXED.bldCoalPartLoad) but capped on 1.000 times it; against the engine the cap undercounts coal CO2 by
   the same 3.4 to 5.1 percent (the engine's own factor on Deep decarbonisation 2035 is 1.066). Size: at a 40 Mt cap with about 30 Mt from
   coal, 1.0 to 2.0 Mt a year the LP's cap does not see. Reaches the capped runs (Deep decarbonisation's calibration, which iterates on the
   engine for this reason) and nothing uncapped. Confirmed by reading; not run.

2. **validate_series.js tests the LP's probe, not its rows.** The probe at index.html:13236 records the variables (`sp, spE, spR, spN, csp:
   CSP_PU(i), off`) that the balance row at 13238 is meant to use. A fault in the row alone is invisible: with the LP's CSP put back to the
   flat 0.38 (`exCsp*0.38` in place of `exCsp*CSP_PU(i)`, a copy of the branch) the check passed 23 of 23. The author's three injected faults
   all sat in the shared variables, so they were caught; a row literal or a dropped term is the class that is not. The engine-side rooftop
   fault (`roofS = solar`) was caught (20 of 23) and the engine's grid pool credit removed was caught by validate_invariants (R71.447bn
   against R53.600bn recomputed). Fix: read each hour's coefficient from the LP text or from the `fixed` constant the row is written from.
   Confirmed by test.

3. **Residual gap in new tracking solar between the LP's calendar days and the engine, after the fleet basis.** Measured on the branch:
   the metered twin (what the LP reads on every calendar representative day under equal weights, PVTRK=1) against the engine's twelve-year
   twins, by month: December 0.397 against 0.354 and January 0.383 against 0.342 (+12 percent), July 0.202 against 0.221 (−9 percent); on the
   July mean day 07:00 0.039 against 0.156 and 17:00 0.067 against 0.146. Main read +26 and −25 percent, so the basis fixed most of it. The
   rest is the metered fleet's own seasonal swing (1.64) over the modelled fleet mix's at the derived tracker share (1.42): S_met x G keeps
   about 15 percent more swing than the twins. Not a coding fault; a limit of deriving a twin from the metered series. Reaches the central's
   LP; its effect on the build mix is not sized. Worth a line in RESULTS and the pack's limitations.

4. **The repurposed-connection credit now reaches every published preset cost, on the LP's rule, which has no geography.** gridChargeR
   (index.html:11771) does what the record says: the page basis gives the freed coal MW to the eligible technologies, highest charge first.
   Measured: Fossil-free 2040 credits 39,692 MW at R364/kW-yr, R14.4bn a year (2.4 percent of its R608bn); Least-cost path 2035 and Deep
   decarbonisation 2035 13,776 MW, R5.0bn a year; the gross charge on Least-cost 2035 is R16.95bn (wind, solar, 551 MW CCGT, 649 MW OCGT).
   Wind sited by the register shares (Eastern and Western Cape) takes Mpumalanga coal bays at full credit. The rule was already in the LP;
   the branch carries it into the engine, as asked. Flag for Nick: a cap by region or by technology is the accuracy choice; none is in the LP
   today. Confirmed.

5. **Two record figures do not match the code's effect.** (a) The 2024 and 2025 tracking twins are recorded as −4.8 percent; measured
   −3.1 percent (0.29552 to 0.28643 and 0.29486 to 0.28586, nodal/profiles_solar_tracking.json). (b) The tariff-derived wind capex is
   recorded as −2.2 percent; measured −2.66 percent (R17,773 to R17,301 per kW): the 2.2 is the tariff's move and the fixed O&M
   subtraction in bldTariffCapex amplifies it. Both series and constants are right; the record is not. Confirmed.

6. **Lithium by vintage uses one duration multiplier for every vintage.** index.html:10291 passes battDurationMult(p.newBattHours), the
   fleet's average hours, into `_vintR`, where the LP charges each vintage's own MWh (eb_batt_y). Second order while vintages' hours are
   close; not sized. Open-cycle gas never takes the vintage path (`_useV` needs BLD_COST[tech], index.html:10286; ocgt and ocgd have no entry)
   but its capex and fixed O&M are flat real, so the midpoint equals the vintage. Note only.

7. **pathcheck's WX_FIX and LULL test wrappers build new wind arrays without the year's offshore series** (`.off` is not copied where
   `.mod` is), so in those modes offshoreSeriesFor falls to its third branch, the twelve-year average, silently (harness/pathcheck.js, the
   LULL and WX_FIX blocks). Test modes only; the record does not mention it. Low.

8. **The loop's verdict at two draws.** VERDICT_TOPUP as recorded: every year at 2 draws, topped up to 10 at 5 GWh and 20 at 10 GWh
   (env_c6.sh), nested seeds, the LP's draws unchanged, the final pathcheck gate kept. With per-run shed as skewed as the checks show
   (Deep decarbonisation: 240 runs, mean 0.09 GWh, one run 18 GWh), a two-draw mean under 5 GWh is weak evidence that the mean is under
   20 GWh. The implementation matches the record; the statistical weight of the early stop is Nick's decision (713 (b)). No code fault found.

## Each item against the record, LP against engine

- Tracking twin and re-timing: retime_pvgis.py does what it says. The ten PVGIS years' annual means are unchanged to five decimals
  (meta.annual_mean_before_after); their energy-weighted hour moves from 12.80-12.83 to 12.34-12.37 against the metered fleet's 12.39 and
  the 2024-2025 years' 12.39; the 2024-2025 twins from 11.86 to 12.42; the fleet-basis metered twin at 12.40 with 0.09 percent of hours
  clipped (4.7 on main). validate_shapes 8/8, validate_weather 68/69 (the Eskom anchor), validate_series 23/23, validate_lp 60/60,
  validate_structure 27/27, validate_pathway_presets 63/65 (below) on the branch. The fleet map and scales are written by harness/solar_trk_k.js and checked at load. Same
  treatment in LP and engine on calendar and clustered days (finding 3 is the residual).
- Rooftop: build_demand_2026.py builds roof_pu as weatherYearNational builds 2025's fixed tilt (mean 0.22278; demand 202.795 to 201.204 TWh,
  the 2025 backcast 205.839 to 204.561); the engine, the LP (calendar, clustered and tail days), twelveYearDemand, roof12.js and the
  behind-the-meter day all read it; K 1.0037. The add-back shape against the ten PVGIS years' removal shape differs by at most 154 MW in any
  hour of the mean day (was 915); against 2024-2025 nothing. roof12.js's swallowed line was repaired in 0ef7431; it computes now.
- CSP: the LP reads PROFILES.csp at the day's calendar hour (index.html:13198), the engine the same series; consistent. Finding 2 is the check.
- Offshore: OFFSHORE_BY_YEAR built in P_OFF with one factor 1.117 (ESMAP 0.516 over the file's 0.462), clipped; weatherYearNational carries
  the year's series on wind.off (corrected and stored wind alike); the engine takes the profile's own (the metered profile 2025), the LP
  the same on calendar days and the day's own on tail, stress and clustered days, unscaled as in the engine. Consistent.
- Diesel key: the forecast's firm capacity reads dieselAvailMW(p) (index.html:8303), which holds new diesel open cycle, and the separate
  newOcgdMW term was removed: no double count.
- pathcheck re-applying settings: nine recorded keys applied before the twelve-year means are read, the caches keyed or cleared, CHECK_ON
  logged and recorded (recordedSettings). PAGE_BASIS=1 prices the midpoint vintage and the page's pool rule; the vintage map is summed
  against what stands and a technology stood down to zero leaves it. As recorded.
- Grid charge on one basis: gridChargeR equals bldGridAnn or bldGridIntegRkW per MW; the pool credit and the Cape credit are each taken
  once and the Cape MW are those not on the pool; offshore is in it; the charge enters newCapexR once (index.html:10315) and the decomposition
  slice is the same rands (10335); pathcheck stops above R1m a year between the engine and the optimiser basis; validate_invariants
  recomputes the basis independently and caught the injected fault. Per MW: wind and solar 364, CCGT and OCGT 383, pumped storage 549,
  vanadium and iron-air 42, lithium and rooftop 0 (the page default without tracking charges solar 446: BLD_COST.pv carries no connection flag).
- Midpoint and own-year vintages: by vintage where pathcheck passes the schedule, midpoint on the page; rooftop's btmCapexR takes the same
  rands as newCapexR. Finding 6 is the one approximation.
- Curtailment price 0: FIXED.lpCurtailCostR 0, CURT_COST the sensitivity, the objective writes a zero coefficient on crt_; the LP keys
  elsewhere unchanged (validate_lp 60/60).
- Coal's part-load table: applied to coal's fuel and carbon price, not to the 2030 floor, as the engine; the engine exports coalFuelMWh and
  pathcheck reports the factor. Finding 1 is the cap row.
- Avon and Dedisa: one rule (avonDedisaContractShare) for the contract charge and the fomDiesel exemption; 2026-2030 share 1 (−R361.8m a
  year of fixed O&M), 2031 share 0.3653 (Avon's 670 of 1,005 MW for 200 days: +R794.2m of contract charge, −R132.2m of fixed O&M, net
  +R662.0m as recorded), 2032 nothing; otherIppR 2030 R5,965m, 2031 R4,585m. The must-run rule uses the same day count. The build LP is
  untouched.
- Unserved price and the CPI link: costUnservedR 9,530 x 1.291 = R12,306/MWh; the April 2021 to January 2022 link 100.2 over 96.7
  (1.036) agrees with the Stats SA January 2022 release (100.2) and with April 2021 reconstructed from 2021's monthly changes (about 96.8).
- Discounting: summ.js and packfill.js take the run's recorded rate, 8 percent for runs that recorded none.
- Checks changed: tdpConfidencePct moved to the build-only list with its cause (the engine is flat now); drInterruptMW's context from
  55 to 52 percent availability with its cause and the same threshold; the siting check pinned to a recorded gap (−14.79 percent) beside
  its direct tier test; 'transmission is charged once' now an exact recomputation (stronger); the retail panel's text pin restated.
  validate_pathway_presets points at 05g checks run on PAGE_BASIS with each build's recorded rooftop K replaced by the page's, so the
  reference files were made under modified inputs; recorded, with the roof12 check failing until the presets are regenerated.
- Worker: ENGINE_FNS carries gridChargeR, bldGridIntegRkW, bldGridAnn, bldGridCapexKW, bldGrid132Ratio, offshoreSeriesFor and
  avonDedisaContractShare; ENGINE_DATA carries OFFSHORE_BY_YEAR, SOLAR_TRK_MAPS, BLD_GRID and GRID_RP_T. validate_worker was not run here.

## The preset validator on the branch: 63 of 65, one failure more than the record

validate_pathway_presets on dea3623: the roof12 known failure as recorded, and "IRP's 2030 targets: 2030 system cost within 0.01% of the
engine check: page R280.173bn, check R280.535bn (-0.129%)". The record (fdaafaa, build 05g) says 64 of 65. The gap is R0.362bn, which is
the Avon and Dedisa fixed O&M exemption of 7dfeb99 (build 05i, R361.8m a year in 2026-2030): the 2030 preset's reference check was made on
05g, before it, and was not rerun. The 2035 and 2040 presets are untouched (no exemption after 2031). Rerun the IRP 2030 check on the
final build, with the others when the presets are regenerated.

## Before the pull request

- stored_panels.json is not regenerated on the branch (BUILD_STAMP 2026-11-05j): validate_stored_panels will fail and visitors compute
  live until `node validate_stored_panels.js testroot --write`. PRESET_SCORES and the 05g preset checks predate the rooftop change.
- The two record figures in finding 5.
- Finding 1 and finding 2 are the two code changes I would make before the central runs on this code.

## Not checked

The retime script's solar-position arithmetic beyond its measured effect; the regional LP; the worker in Chromium; the full suite
(structure, lp, weather, shapes, series and pathway_presets were run); gas_starts.js and gas_xover.js (report only); test12.py and
tvalue.py; build_capacity.py's rebuild beyond the record's statement that no regional value moved (validate_capacity not run);
whether Avon's contract ends on 20 July 2031; the ESMAP level factor's basis.
