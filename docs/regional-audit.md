# Audit of the 10-region model (message 712), 5 Nov 2026

Audited on main 57f70df (build 2026-11-04b) with claude/twin-retime read at 7b46b18 for what changes. Branch
claude/regional-audit holds only this file. Nothing in index.html, nodal/ or the harness changed. Every figure below was
measured on this container (scripts listed at the end; Today 2026 unless stated); nothing is inferred from code alone
except where marked "read".

## Summary

1. The regional build LP (Where to build, "Regional" is the default choice) balances gross demand against coal, diesel,
   new wind, new solar, new storage and corridor flows only. Nuclear, hydro, imports, existing wind and solar, CSP and
   rooftop are absent from its balance rows: about 60 TWh a year of supply the national model has. It therefore plans
   188 TWh of coal in 2026 (the national engine runs 149) and builds to its caps. Found by reading the emitted LP.
2. The dispatch engine and the full-model MIP run on a 2025 regional demand file 13.6% above the national series
   (230.4 against 202.8 TWh), with Koeberg and the hydro fleet at full nameplate, 500 MW of CSP, 3,073 MW of shut coal
   units, fixed imports in every year, no offshore, no gas option, no tracking solar and no wind correction. Their coal
   is 160 TWh against the national 149, for those reasons and not for the network.
3. The network as drawn barely binds: lifting every corridor limit moves coal by 0.04 TWh, cost by 0.03%, unserved and
   renewable curtailment by nothing, in both the heuristic engine and the MIP, even though four Karoo and Cape corridors
   sit at their limit for 2,100 to 3,350 hours a year. The limits are N-0 sums of single-circuit loadability, about 1.4
   times the N-1 secure values PyPSA-RSA, PyPSA-Eur and ReEDS would set; its corridor losses, 0.02% of demand, are about a
   hundredth of the network's published 2.3%, which counts every transmission loss and is not a like-for-like measure.
4. Of this week's ten faults, three reach the regional path: the wind clock (fixed there by PR 159), the PVGIS stamp
   (not fixed: twin-retime re-times the twelve-year file and leaves nodal/profiles_regional.json 27 minutes late) and the
   wind correction (never applied there). The rooftop add-back, CSP, offshore and the diesel key have regional
   counterparts that differ from the national model rather than copy its fault.
5. The 13 Oct PyPSA figure (engine 4.2% above the matched MIP) is not current. On today's data and matched inputs the
   engine's winter week costs R2,317.6m against a PyPSA MIP of R2,260.2m: 2.5% (3.4% against the LP).
6. A like-for-like run of the final central build through the 10-region dispatch by 16 Nov needs the regional path to
   read the national scenario (demand by year, imports, coal retirements, every new-build technology) and the national
   constants first: four fixes of a day or two each. The weather basis (single year, uncorrected, no tracking or offshore
   twins) is a larger job and would stay a caveat.

## (a) Inventory

Code on the 10-region path (read):

- nodal/nodal_engine.js: the hourly dispatch engine (merit order with Dijkstra routing over 21 corridors, per-unit coal
  commitment, two storage charging passes, a 6 GW synchronous floor) and the constants the path lives on: CORRIDORS
  (limit MW, km), pumped-storage and battery siting, BESIPPPP siting for new batteries, GCCA_HEADROOM_MW (the connection
  caps for slider-driven new build), CSP_MW_BY_REGION (450 + 50), IMPORTS_MW, IMPORTS_AVG_MW, IMPORTS_COST, the GET uplift.
- nodal/nodal_dispatch.js: the browser loader (loadNodalData: six files, the private-solar subtraction from rooftop),
  getNodalMIPInputs (net load by region, coal units, storage, corridors for the MIP), applyVppToRegionLoad.
  runNodalYear is defined, marked retired on 17 Aug 2026, and nothing calls it; the hourly engine therefore runs in the
  browser only through getRegionalNetLoad, never as a dispatch.
- index.html: MIP_WORKER_SRC with buildDayLP (one day, 24 hours, coal commitment binaries, storage, corridor flows
  with a R0.05/MWh/km hurdle, slack at costDiesel, reserve rows when reserveEnabled), runMIP, applyMIPResult,
  showMIPBanner, renderMIPSummary (the full-model card), runCurtailmentAudit (six MIP solves), bldBuildRegionalLP with
  BLD_CORRIDORS, BLD_CORRIDOR_KM, BLD_LOAD_SHARE, BLD_EX_BATT, bldCoalByRegion, bldLoadRegionalData, runDelayAnalysis
  (the TDP delay comparison), windCFForRegion and runPrefeas (pre-feasibility), wheelCoverage (wheeling), captureRate
  and renderRegionalCapture, computeLocationalBess, applyCorridorFlowsToMap and applyCurtailmentToMap.
- nodal/capacity_siting.js: the headroom lookups, tdpHeadroomMW and REEA_SHARE (siting of national build by province).
- Harness: validate_solve.js (builds and solves the regional LP on Deep decarbonisation 2035 with tracking off; checks
  the day MIP's reserve rows), validate_lp.js (constraint families of the regional LP; asserts "Regional" is the Where
  to build default), validate_structure.js (the three nodal scripts in the fingerprint; nodal_engine.js owns IMPORTS_CF),
  validate_capacity.js (the capacity file's identities). validation/mip_solver.py and pypsa_crossval_uc.py: PyPSA checks
  of this engine, both carrying their own copy of CORRIDORS and stale constants (imports 0.85, 800 MW of batteries on the
  old four-site split, 48 and 12 GWh of pumped storage).
- Not loaded by the page: nodal/nodal_engine.py (the Python original), the root copy nodal_engine.js (58 lines behind
  nodal/: BESS shares of the eight sites, IMPORTS_CF 0.85, 800 MW of batteries; hidden by .assetsignore).

Data the path reads (read; sizes measured): demand_2025_regional.csv (230.4 TWh, 2025, source being confirmed, TODO
14fa); profiles_regional.json (wind: Renewables.ninja 2023, one centroid per region, V90 at 80 m, uncorrected; solar:
PVGIS 2019; both now on SAST); regional_renewable_capacity.json (wind 4,681 MW, solar 3,568.5 MW by region);
fleet_units.csv (51 BASE rows: coal 41,530 MW nameplate, Sasol coal 728, nuclear 1,854, hydro 600, diesel open-cycle
3,077 plus 342 of aviation-fuel units, RMIPPPP 578, Sasol gas 425); rooftop_mw_by_region.json (9,430 MW less 785 MW
private solar = 8,645); profiles.json csp_pu; headroom_summary.json and region_headroom_lookup.json (GCCA);
tdp_projects.json; profiles_wind_modern_map.json regional_map (the regional LP's modern-turbine wind); reea_projects.json.

Page panels fed by it: Run the full model (52 representative days or 365) rewrites the KPIs, energy mix, dispatch chart,
prices and fifteen price panels, the map's corridor flows and curtailment labels, the full-model card and the locational
battery benchmark; the Curtailment forecast's audit button (six MIP solves); Generation capacity build rates with
"Regional" selected by default and its TDP delay comparison; the pre-feasibility wind tile; wheeling coverage; the
regional capture panel.

National results and constants that read nodal files or nodal_engine.js (read; each a place a regional data fix moves
national numbers):

| national read | from | reaches |
|---|---|---|
| FIXED.importsCF | IMPORTS_CF in nodal/nodal_engine.js | every engine run and LP |
| FIXED.battPowerMW, battHours | EXISTING_BATT_MW, EXISTING_BATT_MWH in nodal_engine.js | every engine run |
| FIXED.windMW 4,681, pvUtilityMW 3,568.5 | regional_renewable_capacity.json (build_capacity.py; validate_capacity asserts) | every run |
| FIXED.rooftopMW 8,135.7 | rooftop_mw_by_region.json and rooftop_ntcsa_2026.json | every run |
| the twelve weather years (weatherYearNational, bldTwelveYearMeans, NEW_WIND_CF_12Y, tracking and modern maps) | profiles_regional_multiyear.json weighted by regional_renewable_capacity.json wind_mw and solar_mw | risk panels, pathway runs, presets' engine checks |
| OFFSHORE_PU | profiles_offshore_regional.json | engine and LP offshore |
| COAL_TRACE | coal_availability_trace.json | engine outage traces |
| the engine's grid charge txChargeFor inside newCapexR (main only) | bldTxCurve from CORRIDORS + headroom_summary.json + regional_renewable_capacity.json, HEADROOM_LOOKUP, TDP_PROJECTS, REEA_SHARE | every engine cost on main; twin-retime replaces it with gridChargeR on the LP's flat basis, so this read ends there |
| wind_corr_table.json | nodal/ | national weather years only |

## (b) This week's faults, measured on the regional path

| fault | reaches the regional path? | measured on main 57f70df | on claude/twin-retime |
|---|---|---|---|
| wind clock | yes, and fixed there | PR 159 moved every region's wind in profiles_regional.json two hours later (means unchanged to 4 decimals); read by the dispatch, MIP, regional LP, pre-feasibility, wheeling and capture | unchanged |
| leap years | no | the regional readers use the single 2023 and 2019 series, which have no 29 February; the twelve-year file (fixed by PR 159) feeds national paths and the site panel's P90 only | unchanged |
| PVGIS stamps about 25 minutes late | yes, and not fixed | profiles_regional.json's solar (PVGIS 2019) sits at the same timing as the twelve-year file's 2019 on main (lag 0 to 1 minute in all ten regions); twin-retime moves the twelve-year 2019 series 26 to 28 minutes earlier and leaves profiles_regional.json as it is | after merge, regional solar peaks about 27 minutes later than national solar |
| 2024-25 tracking twins early | no reader | the regional LP refuses tracking (BLD_REGIONAL_TRK_MSG); the dispatch and MIP have no tracking profile. All six run-based presets carry bldPvTracking 1, so the regional LP and the delay comparison refuse every preset and run only on the default state | unchanged |
| tracking twin shape | no reader | as above | unchanged |
| rooftop add-back | no add-back exists | the dispatch and MIP net 8,645 MW of rooftop at a 0.94 derate (national 0.78), capped at 90% of regional demand, from a demand series whose rooftop basis is unconfirmed (14fa): 15.4 TWh removed from 230.4; no scaling to a twelve-year mean | unchanged |
| six-constant wind correction | not applied | the dispatch, MIP, pre-feasibility, wheeling and capture use the raw 2023 V90 file; the regional LP applies windNewCorr('none') = 1 to its modern map. Capacity-weighted existing wind 0.377 in that file against 0.3545 on the metered 2025 series (Today 2026) and 0.3562 twelve-year corrected (PR 159) | unchanged |
| CSP | different fault | dispatch and MIP: profiles.json csp_pu on 500 MW hard-coded (CSP_MW_BY_REGION) against FIXED.cspMW 600: 1.27 against 1.52 TWh. Regional LP: no CSP at all (see summary 1) | the LP fix is national only |
| offshore | absent | no offshore term in the engine, the MIP's inputs or the regional LP. Deep decarbonisation 2035's 1,000 MW is 4.5 TWh a year at the national 0.516; Fossil-free 2040's 5,000 MW is 22.6 TWh | unchanged |
| the absent diesel key | no such read; four capacities instead | fleet file 3,419 MW (open-cycle rows, 2026 retirement dates ignored) at R4,300/MWh in the dispatch; the MIP's post-processing reads lastRes.dieselCap (exists: 3,400) with a fallback literal of 3,000; the regional LP bounds diesel at 4,000 MW at costDiesel plus VOM and carbon; FIXED.ocgtDieselMW is 3,400 | unchanged |

Found alongside (measured): Koeberg and the hydro fleet run at nameplate in the dispatch (16.0 and 5.0 TWh against the
national 10.9 and 1.9, which apply nuclearCF 0.66 and hydroCF 0.36); the dispatch drops 0.7 TWh of must-take imports in
hours with no deficit, uncounted; the MIP holds 58 GWh of pumped storage (power x 20 h) against 60 in the engine and the
page; the MIP's units are Eskom coal only, so Sasol coal, diesel, gas and RMIPPPP (5.6 TWh in the dispatch) fall to
Eskom coal or the slack; the full-model card's "curtailment" is the MIP's coal against the national engine's net load
(known, G6-M2, TODO 14hz (d)).

## (c) Known items, confirmed and sized

- 14fz (regional tracking solar): confirmed. The guard throws in bldBuildRegionalLP and runDelayAnalysis. Size: six of
  seven presets carry bldPvTracking 1, so the regional LP runs on none of them; validate_solve tests it on Deep with
  tracking forced off (wind 2.71 GW, solar 10.0 GW built by 2030; 49.9 s).
- 14gz (regional imports): confirmed in the four places named (getRegionalNetLoad, buildForecastNeed twice,
  buildGenerators). Size: 1,066 MW in every hour of every scenario, 9.34 TWh available and 8.63 dispatched at Today 2026;
  the national engine ends imports after 2030 (importsEndYear), so every 2035 and 2040 regional run carries about 9 TWh
  the national run does not.
- 14hy (readers of the single-site wind file): confirmed for windCFForRegion, wheelCoverage and WIND_MOD_REG, and the
  list is longer: the dispatch and the MIP (loadNodalData), the regional LP (bldRegProfiles) and the capture panel read
  the same file. Size, 2023 single centroid against the twelve-year multi-site P50: Kwazulu Natal 0.216 against 0.329,
  Free State 0.268 against 0.311, North West 0.331 against 0.297, Northern Cape 0.379 against 0.403, Western Cape 0.365
  against 0.341; capacity-weighted 0.377 against 0.370 (the twelve-year file carries the 1.0753 fleet factor).
- 14fa (regional demand file): confirmed. Its national column is 230.39 TWh against profiles.json's 202.79 (2026) and
  205.84 (2025 with rooftop added back): 13.6% and 11.9% higher, correlation 0.892 and 0.912, peak 34,261 against
  30,322 MW. Its regional shares (Gauteng 28%, Kwazulu Natal 19%, Mpumalanga 12%) differ from BLD_LOAD_SHARE (31.5%,
  15.5%, 17.5%) that the regional LP uses: two demand splits on one path.
- 14hz (a) (REEA filter): confirmed. REEA_SHARE is a typed table from a 56,848 MW wind and 160,212 MW solar file;
  today's reea_projects.json holds 54,564 and 155,427 MW over every status. Recomputed with reeaGenerationRecords on
  approved records: 49,967 and 138,448 MW; the largest share moves by 0.021 (wind) and 0.051 (solar, Northern Cape 0.369
  to 0.318). The charge it feeds (txChargeFor) is retired from the engine on twin-retime.
- RESULTS 'The same fix for the regional model was built, measured, and reverted': confirmed as it stands. The regional LP
  is 23.2 million characters and 255,181 rows (validate_solve on Deep; my build at Today 2026 the same: 8 calendar days,
  mean coal, no reserve rows, no tail days), solving in 50 to 159 s in Node against the browser's 120 and 900 s limits.
  Its 8 days are bldRepDays(8) with the tail days filtered out, so twin-retime's clustered-day work does not change it.

## (d) Network data

Source and basis (read; SOURCES 'PyPSA-RSA: licence and what we take', nodal_engine.py header): the 21 corridor limits
were rebuilt from PyPSA-RSA's Existing_Lines.shp (repository commit 89872c1, 8 Apr 2026; the shapefile's own vintage is
not recorded) by mapping each line to its two GCCA supply regions, applying a St Clair loadability per circuit from its
length, and summing circuits per corridor. Two corridors (Free State to Kwazulu Natal 427 MW, North West to Western Cape
233 MW) keep an earlier single-line estimate. The same table is typed in five files (nodal_engine.js, nodal_engine.py,
BLD_CORRIDORS in index.html, mip_solver.py, pypsa_crossval_uc.py); BLD_CORRIDORS drops the 21st corridor (Free State to
North West) and uses its own km table (eight from headroom_summary.json, twelve straight-line proxies, 300 km default).

N-1: none. The limits are summed circuit loadability (N-0). Losses: the dispatch engine 3.5% per 1,000 km at full
loading, quadratic in loading (52.9 GWh a year at Today 2026, 0.02% of demand); the MIP none (a R0.05/MWh/km hurdle);
the regional LP none. Growth: the dispatch and MIP limits are static (a 20% GET uplift on corridors above 30% average
utilisation exists but reaches only Where to build's headroom); the regional LP has an expansion variable per corridor
(R10,000/MW-km, 40 years, at most 4,000 MW per corridor per year) that never couples to the GCCA headroom caps, so at
high renewables the caps bind first and no corridor is ever built (documented in the code; the coupling was built and
reverted on 17 Aug 2026). Curtailment: in the engine a renewable's output left after its home region and every reachable
deficit is curtailed, then offered to storage; in the MIP a free curt_ variable in each region's balance; in the regional
LP crt_ at lpCurtailCostR (0 in the central from twin-retime).

Against practice (research helper, 5 Nov 2026; URLs in its note, kept with the scratch files): PyPSA-RSA sets per-circuit
thermal ratings by voltage, a St Clair curve, s_max_pu 0.7 as the N-1 approximation, drops the highest-rated circuit per
corridor, a further 30% derate on single-circuit corridors, losses of 6% per 1,000 km linear, and adds TDP lines by build
year; PyPSA-ZA (CSIR 2017) used an N-1 factor of 1/0.7 and no losses; PyPSA-Eur and PyPSA-Earth use s_max_pu 0.7; ReEDS
computes interface limits by DC power flow, N-0 for model zones with an N-1 variant, losses 1% per 100 miles (6.2% per
1,000 km), expansion allowed from eight years out; ENTSO-E's NTC is total transfer capability less a reliability margin.
Published South African transmission losses are 2.3% (2022/23, a parliamentary reply read from a search extract) against
this engine's 0.02% (inter-regional corridor losses only, so not like for like: about a hundredth, corrected 5 Nov 2026,
message 717). So the corridor limits here are about 1.4 times the N-1 secure values the published zonal models use, the
engine's losses are far below any published figure, and nothing grows with the TDP except in the regional LP's uncoupled variable. The draft IRP 2024
and NTCSA's adequacy outlook run multi-nodal PLEXOS models; NTCSA's connection-capacity figures are not quoted here.

## (e) Validation

Today 2026, main 57f70df, every corridor limit lifted to 1e9 MW against the limits as drawn, and against the national
engine on the same build (page defaults, metered 2025 series). Energies in TWh a year.

| | national engine | nodal engine, limits as drawn | nodal engine, lifted | day MIP, 365 days, as drawn | day MIP, lifted |
|---|---|---|---|---|---|
| demand series | 202.8 (+6.6 exports) | 230.4 | 230.4 | net load 164.3 | 164.3 |
| coal (incl. Sasol) | 149.3 | 160.5 | 160.5 | 164.5 | 164.5 |
| nuclear | 10.9 | 16.0 | 16.0 | in net load at 0.90 | |
| hydro | 1.9 | 5.0 | 5.0 | in net load at 0.55 | |
| imports | 9.3 | 8.6 | 8.6 | in net load at 0.927 | |
| wind | 14.1 | 15.5 | 15.5 | in net load | |
| utility solar | 7.7 | 7.2 | 7.2 | in net load | |
| CSP | 1.5 | 1.3 | 1.3 | in net load | |
| rooftop | 14.0 | 15.4 | 15.4 | in net load | |
| pumped storage discharge | 4.1 | 0.26 | 0.26 | 0.86 | 0.85 |
| diesel | 0.18 | 0.02 | 0.02 | 0.0005 | 0.0001 |
| unserved, GWh | 0 | 0 | 0 | 0 | 0 |
| renewable curtailment | 0.28 | 0 | 0 | 0 | 0 |
| forced coal surplus (min stable, sync floor) | in E.curtailed | 0.50 | 0.50 | not modelled | |
| losses, GWh | none | 52.9 | 0 | none | none |
| cost basis | fuel R108.4bn | fleet marginal R106.9bn | R106.9bn | objective R100.0bn | R100.0bn |

Every difference and its cause (measured where a number is given, read where not):

- Network effect: lifting the limits moves coal by 0.04 TWh, the engine's cost by 0.03% and the MIP's objective by
  0.02%; unserved and renewable curtailment stay at zero. Four corridors are at their limit for long stretches (Eastern
  Cape to Kwazulu Natal 813 MW: 3,347 hours in the engine, 3,128 in the MIP; Hydra Central to Northern Cape 754 MW:
  3,275; Northern Cape to Western Cape 823 MW: 3,204; North West to Northern Cape 663 MW: 2,820), but the energy finds
  another path, so the drawn network changes national totals by less than 0.1% at today's fleet.
- Demand: +27.6 TWh gross from the regional file (14fa), minus no exports (the file is "no exports"; the national engine
  serves 6.6 TWh of firm exports). This is the largest cause of the coal gap.
- Nuclear +5.2 and hydro +3.1 TWh: full nameplate in fleet_units.csv with no availability factor; the national engine's
  0.66 and 0.36.
- Wind +1.4 TWh: the 2023 file's 0.377 against the metered 0.3545, and no curtailment of wind in the regional engine.
- Solar -0.6 and CSP -0.25 TWh: PVGIS 2019 single centroids at 0.229 against the metered 0.251; 500 against 600 MW.
- Rooftop +1.4 TWh: 8,645 MW at a 0.94 derate against 8,135.7 at 0.78.
- Pumped storage -3.8 TWh: the engine charges only in cheap hours with an anticipated coal shortfall or from curtailed
  renewables, and at Today 2026 coal does not fall short, so storage barely cycles; the national engine cycles it daily.
- Coal +11.2 TWh (engine) and +15.2 (MIP): the residual of the above; the MIP's units are Eskom coal only, so Sasol coal
  and the small thermal plants (5.6 TWh) fall to it.
- Cost: not comparable; the regional path prices coal at the PyPSA-RSA file's R562 to R772/MWh by unit, the national at
  costCoal 553 plus VOM 80 and carbon.
- Run time: engine 1.7 s a year; MIP 365 days in 203 s (0.55 s a day, every day optimal within 2%); 52 days in 30 s.

PyPSA (RESULTS 'Validation re-run against PyPSA', 13 Oct 2026: engine 4.2% above the matched MIP): re-run on main
57f70df, winter week hours 3264 to 3431, coal EAF 64%, no new build, PyPSA 1.4.0, linopy 0.10.1, highspy 1.15.1, pandas
3.1.1, mip_rel_gap 0.5% (0.36% reached), 7 s. The PyPSA network is matched to today's engine: its own starting state
after a cyclic warm-up (every store empty at hour 3264, 24 of 33 coal units committed), Hex, Pongola and Elandskop
batteries, 48,248 and 11,752 MWh of pumped storage, imports at 0.927, both coal carriers at the EAF, rooftop netted as
the engine nets it, unserved at R87,000/MWh. The engine's week is priced on PyPSA's basis (fleet marginal cost per MWh,
imports R550, renewables and storage zero, plus start-ups).

| R million, the week | engine | PyPSA LP | PyPSA MIP |
|---|---|---|---|
| total | 2,317.6 (energy 2,313.4, start-ups 4.2) | 2,240.8 | 2,260.2 (energy 2,247.4, start-ups 11.1) |
| engine above | | +3.4% | +2.5% |
| coal, GWh | 3,344 | 3,303 | 3,309 |
| storage discharge, GWh | 62.3 | 14.1 | 34.7 |
| diesel, GWh | 5.5 | 0 | 0 |
| imports, GWh | 168.4 | 179.1 | 179.1 |
| curtailed, GWh | 19.0 | 0 | 0 |

So 4.2% is not current: 2.5%. Where the gap sits: diesel the optimum never runs (R23.6m), 10.7 GWh of must-take imports
the engine drops, more storage cycling, and 35 GWh more coal. Caveats: PyPSA sees the week in advance, so the gap is an
upper bound on the engine's inefficiency; the engine holds a 6 GW synchronous floor and losses, PyPSA neither; the 13 Oct
match used imports 0.88 and the pre-14 Oct battery split, so part of the move from 4.2% is the inputs, not the engine.
This checks the 10-region engine only, as before; the single-node engine's check is in validation/single_node/.

## (f) Plan (superseded for now by message 717: L1 and R2 to R7 wait until after the note)

Ranked fixes (size: S under half a day, M a day or two, L a week; "moves" says what changes):

1. L1, M. The regional LP's balance: add the existing fleet (nuclear, hydro, imports with importsEndYear, existing wind,
   solar, CSP, rooftop) as the national LP's `fixed` term, by region. Moves: every Where to build regional result and the
   TDP delay comparison; today both plan for a system 60 TWh short of supply. Nothing national.
2. R2, M. One scenario in, one fleet: the dispatch and MIP read the scenario (scenarioYear and demandGrowthPct on the
   demand, importsMW and importsEndYear (14gz), coalDecomMW through unit dates, newCcgtMW, newOcgtMW, newOffshoreMW with
   a regional offshore series, newVrfbMW, newIronAirMW, newPsMW with newBattHours) and the national constants (nuclearCF,
   hydroCF, cspMW 600, rooftopMW and rooftopDerate, ocgtDieselMW and costDiesel, psEnergyMWh). Moves: the full-model
   KPIs and card, the curtailment audit. Nothing national if IMPORTS_CF and EXISTING_BATT_MW stay as the page reads them.
3. R3, M. Demand: replace demand_2025_regional.csv's level with profiles.json's series split by the file's regional
   shares (or confirm the file, 14fa), and use one regional split in the LP too. Moves: coal and cost in every regional
   result by about a tenth; the LP's regional shares. National: none (the file is read nowhere national).
4. R4, S. The coal fleet: retire units by date and scale nameplate to coalInstalledMW as UC_FLEET does (3,073 MW of shut
   units run today); Sasol coal and the small thermal units into the MIP. Moves: regional coal and commitment. National:
   none.
5. R5, S. Network: an N-1 factor on the corridor limits (0.7, as PyPSA-RSA and PyPSA-Eur) with a stated source, losses
   at a linear rate per 1,000 km with a source, and the corridor table read from one place by all five files. Moves: at
   today's fleet almost nothing (summary 3); at 2035 builds, unknown until R2 lands. National: none, unless the
   corridor table also feeds bldTxCurve on main (it does; twin-retime ends that).
6. R6, M. Weather: re-time profiles_regional.json's solar as twin-retime re-times the twelve-year file, apply the wind
   correction (or move the regional readers to the twelve-year multi-site file, 14hy), and give the regional LP a
   tracking twin (14fz) and an offshore series. Moves: every regional result. National: none unless a shared file
   changes; twin-retime's new validate_shapes.js does not check profiles_regional.json, so add it there.
7. R7, S. Housekeeping: delete the stale root nodal_engine.js, refresh mip_solver.py and pypsa_crossval_uc.py to the
   engine's constants, the MIP's 20 h pumped storage to psEnergyMWh, the 3,000 fallback to FIXED.ocgtDieselMW.

Cross-check of the final central build through the 10-region dispatch by 16 Nov: possible as a run (the MIP covers a year
in under four minutes in Node and the engine in two seconds), and worthless as a comparison until R2, R3 and R4 are in,
because today the regional path cannot take the central's demand year, imports, retirements, gas, offshore or storage
durations, and its existing fleet differs from the national one in every carrier. With R2 to R4 (about four working days
plus the suite and the stored panels) the run would still sit on one uncorrected weather year with a 27-minute solar lag
and no tracking twin, which should be stated as its caveat rather than fixed first (R6 is a week). Recommended: R2, R3,
R4 on one branch, then the cross-check at the central's 2026, 2030, 2035 and 2040 states, reported as a network
sensitivity (limits as drawn against lifted) rather than as a second adequacy figure.

Fixes that could change national results: a change to regional_renewable_capacity.json's wind_mw or solar_mw (the
twelve-year weights and FIXED.windMW, pvUtilityMW), to rooftop_mw_by_region.json, to IMPORTS_* or ESKOM_BESS_OPERATING in
nodal_engine.js, to profiles_regional_multiyear.json, profiles_offshore_regional.json, coal_availability_trace.json or the
tracking and modern-wind maps; and on main, to CORRIDORS, headroom_summary.json, region_headroom_lookup.json,
tdp_projects.json or REEA_SHARE through txChargeFor (retired on twin-retime). None of L1, R2, R3, R4 or R5 touches those
if the shared constants are left where they are.

Not checked: the ESRG demand file's rooftop basis (14fa; needs the source's confirmation); the shapefile's vintage behind
the corridor limits; the GET uplift and the TDP delay panel's headroom release against their sources; any browser run
(the MIP and the regional LP ran in Node); the regional LP and MIP at 2035 and 2040 states (the presets are refused or
not carried, summary 2); the full suite (nothing changed); NTCSA's own corridor ratings (not public).

## Scripts and outputs

Scratch only, not committed, in this session's scratchpad: sc/nodal_year.js (the engine for a year, limits as drawn or
lifted), sc/mip_year.js (buildDayLP from index.html over 365 or 52 days in Node with the highs package), sc/national_today.js
and sc/regional_lp_probe.js (the page in jsdom: the national engine's presets; the regional LP built, parsed and solved),
sc/week_price.js (the engine's winter week priced on PyPSA's basis), sc/pypsa_week.py (the matched PyPSA network), and
the research helper's note. Each writes a JSON beside it with every setting used.

## Message 717 (a): every figure that came through the regional path (5 Nov 2026)

Scope: figures produced by the regional build LP (Where to build, "Regional"), the TDP delay comparison, the day MIP (Run the full
model and the curtailment audit) or the nodal dispatch engine. Searched by script: RESULTS.md (84 of 521 sections match the
regional-path words; every matched line read), REVIEWER_PACK.md and REVIEWER_PACK_RECORD.md, README.md, STATE.md, NOTE_DRAFT.md,
PRESET_TABLE.md, validation/, harness/validate_findings.js and validate_solve.js, stored_panels.json, and the rendered page text
(harness/render_text.js, 47 regional-path sentences with a number read). "Pack" means REVIEWER_PACK.md.

| figure | produced by | recorded in | pack | page |
|---|---|---|---|---|
| Winter week R2,321.7m, 4.2% above the matched PyPSA MIP (4.9% above the LP); diesel 5.5 GWh, storage 74.9 GWh, curtailment 16.9 GWh (13 Oct 2026, bc21fc2) | nodal engine | RESULTS 'Validation re-run against PyPSA'; validation/mip_solver.py docstring; REVIEWER_PACK_RECORD section 7 | no (the record only) | no |
| validation_README: LP R2,210.7m (13 Oct) and the earlier unreproduced 0.42% | nodal engine | validation/; the record says not to quote the 0.42% | no | no |
| Fleet slim check: the engine CLI identical before and after; the page loads 51 units, 49,134 MW (16 Oct) | nodal engine | RESULTS 'Fleet table out of the public repository' | no | no |
| stress_suite.js nodal sections (unserved, pumped-storage discharge, monotonicity; 290/290) on every push | nodal engine | GitHub stress-suite workflow logs; RESULTS 14 Oct (c5b launch) | no | no |
| "~5 s nodal" re-solve | runNodalYear, which nothing calls | README.md (the page links README) | no | README only |
| Today 2026 figures of this audit (5 Nov) | nodal engine, day MIP, regional LP | docs/regional-audit.md | no | no |
| Heuristic against the in-browser MIP: -0.5%, -0.8%, +5.7%, +4.8% by scenario; 8-hour blocks cut the mean gap from 10.4% to 4.0%; start-ups 7,902 against the MIP's 9,281 (8-hour 5,618); the MIP implies about 3,200 starts (no build stamp; before 1 Oct 2026) | day MIP | README.md 'calibration'; index.html comments near the block-commitment constant (calibrate_heuristic.js is not in the repository) | no | README only |
| Instant engine against the MIP on Today 2026: R786 against R765 shadow price, 2.7% (23 Sep 2026) | day MIP | RESULTS 'A harness for the nodal MIP'; STATE.md item 4 | no | no |
| The nodal MIP's reserve, 9.6% of mean load (23 Sep 2026); validate_solve asserts 9 to 11% | day MIP | RESULTS 'The nodal model held no reserve'; STATE.md item 5 | no | no |
| "PyPSA MIP reference of 15,207 MW" | a MIP of unknown provenance | an index.html comment (line 5210) | no | no |
| validate_solve's regional test build on Deep (tracking off): wind 10.78 to 6.03 GW, solar 7.62 to 7.80 GW with the capex change (16 Oct); today wind 2.71 GW, solar 10.0 GW | regional LP | RESULTS 'Build 2026-10-16h'; the harness log | no | no |
| Regional optimiser on the modern-turbine profile; its wind about 7% below the national basis with modern wind off (7 Oct) | regional LP | RESULTS 7 Oct (two entries) | no | no |
| LP sizes 23, 48 and 200 MB; 360 and 940 s; interior point 26 min on Deep 2040 (2 and 8 Oct) | regional LP | RESULTS 'The same fix for the regional model...' and 8 Oct; HANDOVER | no | no |
| "builds exactly to national headroom" with the two headroom totals (17 Aug) | regional LP | a code comment in bldBuildRegionalLP and HANDOVER | no (NTCSA figures: not for publication) | no |
| Delay comparison: no recorded figure; after a run the page prints the slip's cost and "52% of the 221 mapped projects" | delay comparison | the page, after a run only | no | after a run |
| Page text without figures: the full-model caption, "52 representative days with a 2% optimality gap", the full-model card, the map's corridor flows and curtailment labels, the locational battery benchmark, the curtailment forecast's network audit, Where to build's regional table | day MIP, regional LP | the page, after a run only | no | after a run |

Adjacent, from regional data rather than the four computations: the Provincial electricity mix panel's demand shares
(demand_2025_regional.csv, on the page, tagged "source being confirmed"); the pre-feasibility wind capacity factors and the
wheeling coverage (profiles_regional.json, on the page after input); the capture panel's regional ordering; the GETs panel's
corridor lengths; the site panel's P50 and P90 (the twelve-year file). validate_findings runs none of the four: its check 5
('solar alone cannot pass the daylight fraction') reads Northern Cape's twelve-year solar and the curtailment pin's band
reads the twelve-year set. stored_panels.json holds the national Monte Carlo, adequacy and capture panels only; nodal_engine.js,
nodal_dispatch.js and every regional data file are in its fingerprint, so a change to any of them invalidates the stored
panels. REVIEWER_PACK.md carries no regional-path figure; the record quotes the 4.2% and warns off the 0.42%. The pack's
'single node' limitation line (record, section 'Known limitations') is the only place the pack speaks of the network.

## Message 717 (b): site guard, proposal (not built; tested in a scratch copy of main 57f70df)

The smallest change, seven lines of index.html (the stamp bumped as rule 5 requires):

```
-              <option value="0">National &ndash; how much, and when</option>
-              <option value="1" selected>Regional &ndash; also where, within grid limits</option>
+              <option value="0" selected>National &ndash; how much, and when</option>
+              <option value="1" disabled>Regional &ndash; also where, within grid limits (switched off)</option>
-            <div ...>Regional uses each province&rsquo;s own wind and solar profile, its GCCA connection headroom, and real corridor limits between regions.</div>
+            <div ...>Defaults to National. The Regional choice is switched off: it plans against gross demand without the existing nuclear, hydro, import, wind, solar and rooftop fleet, so its builds are not comparable with the rest of the page.</div>
-            <strong id="mipCaveat">The full model runs on 2025 regional demand and its own regional weather data, and does not dispatch gas; its results are not comparable with the presets.</strong>
+            <strong id="mipCaveat">The full model runs on its own regional demand, weather and fleet data, with fixed imports and no gas, so its figures do not compare with the rest of the page.</strong>
-              <button id="delayRunBtn" onclick="runDelayAnalysis()"
+              <button id="delayRunBtn" disabled onclick="runDelayAnalysis()"
-              <span id="delayStatus" ...></span>
+              <span id="delayStatus" ...>Switched off: the comparison runs on the regional model above, whose builds are not comparable with the rest of the page.</span>
-const BUILD_STAMP = '2026-11-04b';
+const BUILD_STAMP = '<the day's stamp>';
```

No script changes: the option is disabled and the default moved, so the page cannot select the regional LP; the button is
disabled, so the delay comparison cannot run; bldBuildRegionalLP, runDelayAnalysis and the day MIP stay as they are, so the
harness keeps testing them. The banner and the full-model card read the mipCaveat text, so the new sentence reaches both.

Checks it touches, run on the scratch copy:

| check | result | cause |
|---|---|---|
| validate_lp 'Where To Build defaults to the regional LP' | fails (59/60): bldRegional = 0 | the guard moves the default by design. Restate the check to 'Where to build defaults to the national LP and the regional option is disabled' (message 717 (b)); keep 'bldBuildRegionalLP is reachable' and the regional LP's constraint-family checks, which still pass |
| validate_lp, the other 59 | pass | |
| validate_public_text | 32/32: slider notes over 40 words 0 of 76, preset captions 0 of 8 | the three new sentences are 36, 25 and 20 words; no identifier, no Data Portal ID |
| audit.py | 88/88; tutorial phrases none; prose 4,248 words against the 4,250 ceiling | two words of headroom: any further sentence must cut one elsewhere |
| validate_structure | 27/27 with the stamp bumped | the select and the button are not in control_inventory.json |
| validate_solve | pending (it builds the regional LP directly; expected unchanged) | |
| validate_stored_panels | will fail until regenerated | any change to index.html changes the fingerprint: run --write, then the check, in the pull request |
| validate_findings, validate_response, validate_links, validate_worker | not touched | none names the two controls; the grid-delay finding uses the preset, not the panel |

Visible text changed (harness/diff_public_text.js --base 57f70df; 2,193 sentences before, 2,195 after):

- Added or changed (5): the mipCaveat sentence above; "Regional – also where, within grid limits (switched off)"; "Defaults to
  National."; "The Regional choice is switched off: it plans against gross demand without the existing nuclear, hydro, import,
  wind, solar and rooftop fleet, so its builds are not comparable with the rest of the page."; "Switched off: the comparison
  runs on the regional model above, whose builds are not comparable with the rest of the page."
- Removed (3): the old mipCaveat sentence; "Regional – also where, within grid limits"; "Regional uses each province's own wind
  and solar profile, its GCCA connection headroom, and real corridor limits between regions."

Not relaxed: no check widened; one restated with its cause. Build after the combined PR merges, on Nick's word.

## Message 717 (c): PyPSA network sensitivity of the central build (first result, 5 Nov 2026)

What ran. A ten-area, 8,760-hour linear programme in PyPSA 1.4.0 (HiGHS 1.15.1), built on the national engine's own hourly run
rather than on the regional model's data, so that the no-limits case can be tied to the engine first. Build: the committed c7
run harness/pathway/c7/pathway_c7.json on claude/c7-runs (build 2026-11-03a, LP key c62ec3e615), its 2035 and 2040 states from
its committed engine checks, as a stand-in: the every-change pass (build 2026-11-05f) is not on the branch (its outputs are in the
main session's scratchpad, c710/all.json). Weather years 2025 and 2015 (the worst-week year), outage seed k = 0 of the chain's
seeds. Scripts, the patch and every case's result are in docs/regional-audit/ (README there); the engine dumps stay in the
scratchpad because they carry hourly series derived from profiles.json.

Method, in the order the engine's run is taken apart:

- Engine run: harness/pathcheck.js, patched with two lines, writes the engine's hourly run for one weather year after applying
  every setting the pathway recorded (tracking solar on, the rooftop add-back at 0.8895, the coal practice floor, the
  'reservecoal' inertia lift, imports ending in 2030). The LP reads only that dump and the build's own regional files.
- Demand: the engine's served grid load (its demand line less storage charging, plus demand response) plus its rooftop output
  gives the gross load; split by the hourly area shares of nodal/demand_2025_regional.csv (the file of TODO 14fa). Rooftop is a
  must-run generator per area, the national rooftop series at the 0.78 derate, by the shares of nodal/rooftop_mw_by_region.json
  less the private solar inside it. Exports stay inside the national load.
- Wind and solar: each area's series for the weather year from nodal/profiles_regional_multiyear.json at that build (wind at
  the 1.0753 fleet factor, PVGIS solar). Existing wind and solar by the capacity file's MW per area. New wind by the siting
  shares below, on the regional LP's modern-turbine map times the correction (k = 0.9655 on the 'bw6' case); new solar on the
  national tracking ratio by month and hour. Each of the four is scaled so its annual availability equals the engine's own:
  existing wind and solar need no scaling (factor 1.000), new wind 0.966, new solar 0.992, and clipping new solar at 1 per unit
  loses 0.76 of 58.1 TWh in 2035.
- Must-run plant as the engine dispatched it, hour by hour: Koeberg (Western Cape), hydro (Hydra Central), the RMIPPPP hybrids
  (Northern Cape), CSP (600 MW, Northern Cape). Imports: none after 2030.
- Coal: the UC_FLEET groups standing in the year by their dates (14 groups, 25,257 MW in 2035 scaled to the state's 25,916;
  2040 likewise), by area (Mpumalanga, Limpopo, Gauteng), with the engine's own hourly available coal (its outage draw and the
  inertia lift, mean 17,638 MW in 2035) shared pro rata; marginal cost costCoal plus VOM plus carbon. The LP commits nothing,
  so two variants bound the effect: 'floor' imposes 0.57 of the engine's hourly committed coal (the design minimum stable
  level from 2030), 'fixed' imposes the engine's hourly coal output.
- Gas and diesel: combined-cycle and open-cycle LNG at Richards Bay (Kwazulu Natal) at the engine's costs, open cycle at its
  heat-rate ratio of 1.53; diesel 3,400 MW at the fleet's areas (Western Cape 67%, Kwazulu Natal 22%, Eastern Cape 11%).
- Storage: pumped storage 2,724 MW and 60 GWh at Kwazulu Natal 80% and Western Cape 20%; the three operating Eskom batteries;
  new lithium (9,466 MW at 5.3 h in 2035; 13,059 MW at 6.2 h in 2040) at the BESIPPPP shares North West 40%, Free State 35%,
  Northern Cape 25%; round-trip 0.76 and 0.88, cyclic, perfect foresight. Unserved energy at R87,000/MWh in every area.
- Not carried: the engine's reserve, synchronous floor, demand response and VPP (0.2 GWh); a R0.01/MWh hurdle on each corridor.
- Corridors: the engine's 21 and their lengths. Cases: no limits; today's limits as drawn (N-0, for context); N-1 at 0.7 times
  today's; N-1 with the TDP lines that join two areas, at their TDP year and 0.7 (20 of the TDP's 82 lines; 17 lines have an
  endpoint absent from the substation list, Umtu, Isundu, Coega, Hlaziya and others, and are not counted, so this case
  understates the plan's relief); MW per circuit 900 at 400 kV, 3,000 at 765 kV, 600 at 275 kV (capacity_siting.js). Losses
  sensitivity: 6% per 1,000 km linear (PyPSA-RSA config.yaml) as two one-way links. A corridor "binds" in an hour when its
  capacity carries a shadow price; the sum of those prices is the value of one more MW for a year.
- Siting: approved REEA records (the page's generation filter) assigned to the area of their nearest substation. Shares: wind Western Cape 36%, Hydra Central 23%, Northern Cape 21%, Eastern Cape 12%, Mpumalanga 5%, Kwazulu Natal 1%, North West 1%; solar Northern Cape 25%, North West 18%, Free State 15%, Hydra Central 13%, Limpopo 11%, Western Cape 11%, Mpumalanga 3%, Gauteng 2%, Eastern Cape 1%, Kwazulu Natal 1%.
  Alternative: the existing fleet's shares (wind Eastern Cape 42%, Western Cape 27%, Northern Cape 17%, Hydra Central 14%).

Tie-out, no limits, against the engine (TWh; the LP free, with the commitment floor, and with the engine's coal fixed):

| year, weather year | coal, engine | LP free | LP, engine commitment floor | LP, engine coal fixed | curtailed, engine | free | floor | fixed | storage discharge, engine | free | floor | fixed |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2035, 2025 | 76.3 | 63.0 | 76.3 | 76.3 | 13.0 | 3.3 | 14.6 | 15.5 | 23.1 | 13.3 | 22.9 | 21.9 |
| 2035, 2015 | 84.7 | 70.2 | - | 84.7 | 14.2 | 3.3 | - | 16.8 | 22.5 | 14.6 | - | 21.8 |
| 2040, 2025 | 55.8 | 42.4 | 55.4 | 55.8 | 25.6 | 13.3 | 25.6 | 27.7 | 32.6 | 30.8 | 33.8 | 32.6 |
| 2040, 2015 | 63.7 | 50.4 | - | 63.7 | 26.0 | 13.2 | - | 27.9 | 32.3 | 31.4 | - | 32.8 |

Explanation of the gap, before reading the cases: with no network and no unit commitment the LP shuts coal in daylight and
curtails 10 TWh less than the engine, which holds its committed coal at the practice floor and cycles storage against its
own forecast. Must-run plant, demand, wind and solar availability match to the gigawatt-hour by construction. Imposing the
engine's committed coal at the design minimum returns coal and curtailment to the engine's (2035: coal 76.3 against 76.3,
curtailment 14.6 against 13.0); fixing the engine's coal returns storage too (21.9 against 23.1). Gas and diesel in the LP
are near zero where the engine burns 0.4 to 0.7 TWh, the engine's reserve and forecast rules. So the differences between
cases, all on the free LP unless stated, are read as network effects on an optimum, with the floor variant showing how much
of each difference survives the engine's own coal practice.

Differences from the no-limits case on the same year, weather year and siting:

| year, weather year | case | curtailed, TWh | of it wind | solar | unserved, GWh | coal, TWh | gas | diesel | storage discharge | fuel and carbon, R bn | corridors with a shadow price over 4,000 hours (value of one more MW, R m a year) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 2035, 2025 | today's limits as drawn (N-0) | +48.7 | +39.4 | +9.3 | +0.0 | +48.2 | +0.0 | +0.01 | -2.1 | +33.8 | North West to Northern Cape (7181 h, R5.0m); North West to Western Cape (7171 h, R5.0m); Free State to Kwazulu Natal (6797 h, R4.6m); Free State to Mpumalanga (6796 h, R4.6m); Free State to North West (6796 h, R4.6m); Free State to Gauteng (6796 h, R4.6m) |
| 2035, 2025 | N-1 (0.7 x today) | +64.7 | +48.3 | +16.4 | +1.6 | +63.8 | +0.7 | +0.05 | -1.2 | +45.9 | Free State to Kwazulu Natal (8312 h, R8.4m); Eastern Cape to Kwazulu Natal (7176 h, R7.3m); North West to Northern Cape (8139 h, R7.0m); North West to Western Cape (8112 h, R6.9m); Free State to Mpumalanga (7774 h, R6.4m); Free State to North West (7774 h, R6.4m) |
| 2035, 2025 | N-1 with TDP lines by year | +32.8 | +28.6 | +4.2 | +0.0 | +32.2 | +0.0 | +0.00 | -3.7 | +22.5 | Eastern Cape to Kwazulu Natal (5776 h, R3.9m); North West to Northern Cape (5770 h, R3.9m); North West to Western Cape (5770 h, R3.9m); Free State to Hydra Central (5711 h, R3.7m); Free State to Northern Cape (5711 h, R3.7m); Eastern Cape to Free State (5709 h, R3.7m) |
| 2035, 2025 | N-1 (0.7 x today), losses 6%/1,000 km | +64.6 | +50.9 | +13.7 | +2.3 | +65.0 | +1.1 | +0.06 | -1.9 | +47.5 | Free State to Kwazulu Natal (8705 h, R8.7m); Eastern Cape to Kwazulu Natal (7270 h, R7.7m); North West to Northern Cape (8743 h, R7.2m); North West to Western Cape (8121 h, R6.7m); Free State to Gauteng (8683 h, R6.5m); Free State to North West (8659 h, R6.4m) |
| 2035, 2025 | N-1 (0.7 x today), fleet siting | +70.9 | +52.9 | +18.0 | +5.4 | +68.8 | +1.6 | +0.20 | -1.5 | +51.7 | Eastern Cape to Kwazulu Natal (8139 h, R10.6m); North West to Northern Cape (7800 h, R8.5m); North West to Western Cape (7787 h, R8.3m); Free State to Kwazulu Natal (8097 h, R7.9m); Free State to Mpumalanga (6291 h, R5.2m); Free State to North West (6291 h, R5.2m) |
| 2035, 2025 | N-1 (0.7 x today), engine commitment floor | +53.4 | +43.9 | +9.6 | +1.6 | +50.4 | +0.7 | +0.05 | -10.9 | +36.6 | Free State to Kwazulu Natal (8312 h, R8.4m); Eastern Cape to Kwazulu Natal (7176 h, R7.3m); North West to Northern Cape (8139 h, R7.0m); North West to Western Cape (8112 h, R6.9m); Free State to Mpumalanga (7774 h, R6.4m); Free State to North West (7774 h, R6.4m) |
| 2035, 2015 | today's limits as drawn (N-0) | +43.0 | +35.0 | +8.0 | +0.0 | +42.5 | +0.0 | +0.02 | -2.8 | +29.8 | North West to Western Cape (6591 h, R4.7m); North West to Northern Cape (6573 h, R4.6m); Eastern Cape to Kwazulu Natal (5962 h, R4.1m); Free State to North West (6015 h, R4.0m); Free State to Mpumalanga (6015 h, R4.0m); Free State to Gauteng (6015 h, R4.0m) |
| 2035, 2015 | N-1 (0.7 x today) | +57.9 | +43.0 | +14.9 | +3.8 | +56.9 | +0.6 | +0.13 | -1.8 | +41.5 | Free State to Kwazulu Natal (7962 h, R7.4m); Eastern Cape to Kwazulu Natal (6702 h, R6.5m); North West to Northern Cape (7753 h, R6.5m); North West to Western Cape (7737 h, R6.4m); Free State to Mpumalanga (7016 h, R5.2m); Free State to North West (7016 h, R5.2m) |
| 2035, 2015 | N-1 with TDP lines by year | +29.4 | +25.5 | +4.0 | +0.0 | +28.7 | +0.0 | +0.00 | -4.5 | +20.1 | Eastern Cape to Kwazulu Natal (4998 h, R3.4m); North West to Northern Cape (4993 h, R3.4m); North West to Western Cape (4993 h, R3.4m); Free State to Hydra Central (4895 h, R3.2m); Free State to Northern Cape (4895 h, R3.2m); Eastern Cape to Free State (4894 h, R3.2m) |
| 2035, 2015 | N-1 (0.7 x today), losses 6%/1,000 km | +57.8 | +45.4 | +12.4 | +5.0 | +58.2 | +1.0 | +0.17 | -2.2 | +43.2 | Free State to Kwazulu Natal (8681 h, R8.6m); Eastern Cape to Kwazulu Natal (6876 h, R8.0m); North West to Northern Cape (8756 h, R7.7m); North West to Western Cape (7752 h, R7.2m); Free State to Gauteng (8689 h, R6.2m); Free State to North West (8651 h, R6.1m) |
| 2040, 2025 | today's limits as drawn (N-0) | +80.5 | +61.2 | +19.3 | +0.0 | +61.1 | +17.8 | +0.02 | -7.9 | +67.3 | North West to Northern Cape (8272 h, R10.6m); North West to Western Cape (8268 h, R10.6m); Free State to Kwazulu Natal (8096 h, R10.3m); Free State to Mpumalanga (8096 h, R10.3m); Free State to North West (8096 h, R10.3m); Free State to Gauteng (8096 h, R10.3m) |
| 2040, 2025 | N-1 (0.7 x today) | +98.4 | +70.5 | +27.9 | +90.7 | +61.9 | +34.0 | +0.46 | -10.0 | +94.4 | Free State to Kwazulu Natal (8628 h, R42.9m); North West to Northern Cape (8682 h, R42.8m); North West to Western Cape (8660 h, R42.7m); Free State to Mpumalanga (8627 h, R42.4m); Free State to North West (8627 h, R42.4m); Free State to Gauteng (8627 h, R42.4m) |
| 2040, 2025 | N-1 with TDP lines by year | +58.8 | +48.2 | +10.6 | +0.0 | +51.5 | +5.7 | +0.00 | -7.0 | +43.8 | Eastern Cape to Kwazulu Natal (7103 h, R7.2m); North West to Northern Cape (7075 h, R6.9m); North West to Western Cape (7069 h, R6.9m); Free State to Northern Cape (5621 h, R5.7m); Free State to Hydra Central (5612 h, R5.7m); Eastern Cape to Free State (5591 h, R5.6m) |
| 2040, 2025 | N-1 (0.7 x today), losses 6%/1,000 km | +98.4 | +72.7 | +25.7 | +155.0 | +62.0 | +35.3 | +0.51 | -11.6 | +96.9 | North West to Northern Cape (8759 h, R45.6m); Free State to Gauteng (8759 h, R45.1m); Free State to North West (8759 h, R45.1m); Free State to Mpumalanga (8724 h, R44.4m); Free State to Kwazulu Natal (8725 h, R44.3m); North West to Western Cape (8675 h, R42.9m) |
| 2040, 2025 | N-1 (0.7 x today), fleet siting | +106.5 | +77.2 | +29.4 | +455.2 | +62.4 | +40.5 | +0.96 | -10.8 | +108.6 | North West to Northern Cape (8638 h, R68.6m); North West to Western Cape (8620 h, R68.4m); Eastern Cape to Kwazulu Natal (8412 h, R66.8m); Free State to Kwazulu Natal (8324 h, R50.7m); Free State to Mpumalanga (8316 h, R50.3m); Free State to North West (8316 h, R50.3m) |
| 2040, 2025 | N-1 (0.7 x today), engine commitment floor | +86.2 | +65.4 | +20.7 | +90.7 | +49.0 | +34.0 | +0.46 | -13.0 | +85.3 | Free State to Kwazulu Natal (8628 h, R42.9m); North West to Northern Cape (8682 h, R42.8m); North West to Western Cape (8660 h, R42.7m); Free State to Mpumalanga (8627 h, R42.4m); Free State to North West (8627 h, R42.4m); Free State to Gauteng (8627 h, R42.4m) |
| 2040, 2015 | today's limits as drawn (N-0) | +71.3 | +54.4 | +16.9 | +0.0 | +53.6 | +16.1 | +0.04 | -7.9 | +59.9 | North West to Northern Cape (7982 h, R10.6m); North West to Western Cape (7980 h, R10.6m); Free State to Kwazulu Natal (7670 h, R9.9m); Free State to Mpumalanga (7670 h, R9.9m); Free State to North West (7670 h, R9.9m); Free State to Gauteng (7670 h, R9.9m) |
| 2040, 2015 | N-1 (0.7 x today) | +89.0 | +62.8 | +26.2 | +132.0 | +54.2 | +32.4 | +0.43 | -10.2 | +86.2 | North West to Northern Cape (8640 h, R38.1m); North West to Western Cape (8626 h, R37.9m); Free State to Kwazulu Natal (8507 h, R32.8m); Free State to Mpumalanga (8507 h, R32.4m); Free State to North West (8507 h, R32.4m); Free State to Gauteng (8507 h, R32.4m) |
| 2040, 2015 | N-1 with TDP lines by year | +51.5 | +42.7 | +8.7 | +0.0 | +45.1 | +5.0 | +0.00 | -6.5 | +38.3 | Eastern Cape to Kwazulu Natal (6518 h, R6.3m); North West to Northern Cape (6480 h, R6.1m); North West to Western Cape (6474 h, R6.1m); Free State to Northern Cape (5473 h, R5.2m); Free State to Hydra Central (5465 h, R5.2m); Eastern Cape to Free State (5450 h, R5.2m) |
| 2040, 2015 | N-1 (0.7 x today), losses 6%/1,000 km | +89.0 | +65.0 | +24.0 | +188.5 | +54.3 | +33.7 | +0.49 | -11.4 | +88.8 | North West to Northern Cape (8760 h, R41.0m); North West to Western Cape (8625 h, R38.5m); Free State to Gauteng (8760 h, R33.7m); Free State to North West (8760 h, R33.7m); Free State to Mpumalanga (8654 h, R33.1m); Free State to Kwazulu Natal (8567 h, R33.0m) |

Curtailment by area, 2035, weather year 2025, N-1: Hydra Central 26.9, Northern Cape 18.9, Eastern Cape 11.0, Western Cape 10.3, Free State 0.9 TWh; with TDP lines: Eastern Cape 12.9, Hydra Central 12.5, Northern Cape 10.3, Western Cape 0.5 TWh.
Curtailment by area, 2040, weather year 2025, N-1: Hydra Central 39.9, Northern Cape 32.5, Western Cape 20.3, Eastern Cape 15.5, Free State 3.5 TWh; with TDP lines: Hydra Central 26.0, Northern Cape 23.6, Eastern Cape 18.8, Western Cape 3.7, Free State 0.1 TWh.

Reading. With today's corridors, even as drawn (N-0), the Karoo and Cape cannot export the 2035 build's wind and solar: about
45 TWh is curtailed in Hydra Central, the Northern Cape, the Eastern Cape and the Western Cape and inland coal runs instead,
at R30-35bn a year of fuel and carbon. At N-1 it is 58-65 TWh in 2035 and 89-98 TWh in 2040, where gas also runs 32-34 TWh
more and unserved energy appears (91-132 GWh). The TDP lines that join two areas, at their own dates, halve the effect
(2035: +29 to +33 TWh curtailed; 2040: +51 to +59). The Karoo corridors themselves are not the first to bind: the Free
State hub's exits to Gauteng, Mpumalanga, North West and KwaZulu-Natal, the North West's links to the Northern and Western
Cape, and the Eastern Cape to KwaZulu-Natal corridor carry a shadow price in 7,000 to 8,700 hours of 2035, worth R6-8m per
MW-year each, against a line cost of roughly R0.25m per MW-year on the model's own R10,000 per MW-km; with the TDP lines the
same corridors bind in about 5,700 hours at R4m. In 2040 the values reach R33-46m where unserved energy prices the hours.
Losses change the energies by less than 1 TWh (the corridors bind on capacity). Siting new wind and solar by the existing
fleet's shares, which puts more in the Eastern Cape, curtails 6-8 TWh more. With the engine's commitment floor the N-1
difference falls from +65 to +53 TWh in 2035 and from +98 to +86 in 2040.

Caveats. (1) Within-area limits are absent, so every case is a lower bound on congestion. (2) Perfect foresight and no
commitment in the LP; the differences, not the levels, are the measure, and the floor variant bounds the practice effect.
(3) The corridor limits are the model's own: single-circuit St Clair loadability summed per corridor from PyPSA-RSA's
shapefile of unknown vintage; two corridors are estimates; a wrong table moves every case. (4) PyPSA-RSA's licence terms are
still being confirmed. (5) The demand split is the unconfirmed regional file's (14fa). (6) New-build siting is a share of
approved permits, not a plan; the Hydra Central share (23% of wind) rests on the substation list's area for the Karoo sites.
(7) The stand-in build is c7 before the 707 changes; the method does not change for the every-change pass, only the numbers.
(8) Two weather years and one outage seed. (9) No NTCSA capacity figure and no hourly Eskom series is committed.

Rerun on the final key: give me the pathway JSON (and its pathcheck rows) and the build it ran on; the chain is
pathcheck_dump.patch at that build, then run_net.sh, about an hour for the thirty cases.

## Message 718: the corridor table and the question the note depends on (6 Nov 2026; nothing here is to be quoted)

Builds. "Every-change pass": harness/pathway/final/pathway_every_change_05f.json on claude/c7-runs, its 2035 and 2040 states
from its engine rows, run at build 2026-11-05f (claude/twin-retime 17f42a5) through the patched pathcheck (2035: wind 27,246,
solar 17,711, lithium 8,811 MW at 4.3 h, coal 14,307 MW retired; 2040: wind 40,722, solar 24,831, lithium 11,004 MW at 5.5 h,
open-cycle gas 4,342 MW, diesel open cycle 1,269 MW, coal 22,333 MW retired); the free-mix test uses that build's own costs
(bldNetAnnuityAt, bldGridAnn, the lithium power and energy split) at the run's cost of capital (cocCase blended, discount
0.08). "Today's fleet": the page's Today 2026 and '2025, as modelled' presets at main 57f70df (build 2026-11-04b). Weather
years 2025 and 2015, outage seed k = 0. Method as in 717 (c), with: corridor cases 1.0 (as drawn), 0.85, 0.7 and "one circuit
dropped" ((n - 1)/n from the circuit counts of nodal/corridor_electrical.json, single circuit 0.7, PyPSA-RSA's rule; counts
only, no rating used); the TDP's inter-area lines by year from the full mapping of (c), as single new circuits at 0.7 in the
one-circuit-dropped case; corridors extendable at a cost per MW-km annuitised over 40 years at 0.08 (CRF 0.0839); new wind and
solar siting chosen by the LP, each area capped at its approved REEA MW, the national total fixed; the free mix with lithium
as a store priced on power (the 0.278 share) and energy, open-cycle gas and corridors extendable by area, the engine's
commitment floor (0.57 of its committed coal) on, the connection charge kept and the integration charge (R364/kW-yr) removed
when corridors are priced; the demand split by BLD_LOAD_SHARE as the alternative to the regional file's hourly shares. Every
case's JSON is in docs/regional-audit/results/718/ with the scripts (pypsa_net.py, run_net.sh, the queues, summ718.py).

Two faults found and fixed while running (both before any result was written up; the affected cases rerun): the
one-circuit-dropped cases had all crashed on a path defined after its use, which the runner's exit-code logging hid; and new
diesel open-cycle capacity was counted twice in the 2040 cases. A third, in reporting only: the free-siting and free-mix
cases' curtailment was computed against a zero nameplate; fixed, those cases rerun. The machine's memory killed about fifty
solves when five ran at once; the queues now run two at a time.

Verdict in one line: on today's corridors the central build's wind and solar cannot leave the Cape and the Karoo at any
factor from 1.0 to 0.7, the one-circuit rule sits between 0.85 and 0.7, the TDP's inter-area lines remove most of the 2035
effect and about 60% of 2040's, and the LP removes the rest for R4 to 6bn a year of corridors, a quarter to a third of what
the integration charge already collects.

### 718 (a): today's fleet through the corridor table, against what happened

What ran. The page's '2025, as modelled' and 'Today 2026' presets at build 2026-11-04b, weather year 2025, seed k = 0, dumped
and run through the ten-area LP at no limits, as drawn, 0.85, 0.7 and one circuit dropped. Western Cape supply is Koeberg as
the engine ran it (flat, two units at the engine's nuclear capacity factor) in the first set of rows and on a calendar in the
second: one 930 MW unit out on the days the public record gives, 2025 days 1 to 302 (unit 1's long-term operation outage
from January to its reconnection on 29 October 2025) and 60 to 68 (unit 2's trip of about 1 March 2025); 2026 days 116 to
320 (unit 2's outage from 26 April 2026, still out on 23 October with return expected in November), 239 to 243 (unit 1's
trip of 27 August 2026, both units off, taken as a unit for five days) and 289 to 295 (the protection trip of about 22
October 2026). The calendar is nameplate, so its annual energy differs from the engine's flat series (2025: 9.35 TWh against
the engine's 10.21; 2026: 11.45 against 10.87, the engine's own capacity factor carrying more outage than the calendar);
the engine's seed-drawn outages are not a calendar. Diesel 3,400 MW at the fleet's sites, Western Cape 67%.

(no rows yet)

Reading. 2025 as modelled (coal 170 TWh, diesel 2.4 TWh, 5.4 GWh unserved in the engine): the LP curtails nothing at any
factor and serves the same load; at 0.7 the Mpumalanga and Free State exits to KwaZulu-Natal carry a shadow price in about
2,350 hours and Western Cape diesel rises by 0.26 TWh (1.5 TWh at 0.7 against 1.2 with no limits), the only network effect
of size; the Cape imports 6.2 to 6.5 TWh net in every case. The LP's 8.7 GWh unserved appears at every factor, no limits
included, so it is not a network effect: the engine met those hours with demand response (109 GWh over 168 hours, up to
1,000 MW), which the LP does not carry, and the solver places the shortfall at one bus by indifference. The LP burns 1.2
TWh less diesel than the engine (perfect foresight, no operating reserve). With Koeberg on its 2025 calendar the unserved
energy is 13.8 GWh at every factor including no limits (so again not a network effect), Western Cape diesel 1.7 TWh with
no limits and 2.0 at 0.7, and the binding hours fall slightly (the Cape imports more and the KwaZulu-Natal exits bind
less). Today 2026 (coal 151 TWh, diesel 0.18 TWh, nothing unserved, 0.47 TWh curtailed in the engine): the LP curtails
nothing, runs no diesel and serves everything at every factor, calendar or not; at 0.7 the same corridors carry a shadow
price in about 490 hours; with the 2026 calendar the Cape's three inlets (Hydra Central, North West and Northern Cape to
Western Cape) bind for 18 hours in the one-circuit case. Nothing in the 2026 table is tight, and the 2025 calendar at 0.7
adds diesel, not unserved energy: no case is too tight.

Against the public record (docs/regional-audit/research_718a_public_record.md, every figure with its source; from search
snippets, no Eskom page opened). Calendar 2025 had six load-shedding bouts between 31 January and 15 May 2025, the worst
Stage 6 on 23 February after four Camden units tripped; CSIR counts 749 GWh shed in the first half of 2025 against 4,126
GWh in the first half of 2024; none since 16 May 2025, 525 days by 23 October 2026. Eskom's open-cycle turbines burned
2,609 GWh of diesel from April 2024 to March 2025 (R15.6bn) and 1,078 GWh from April 2025 to March 2026 (R6.4bn); 147 GWh
from April to mid-September 2026. The energy availability factor was 60.6% in FY2025 and about 65% in FY2026; winter
unplanned outages fell from 14.6 GW in early June 2025 to 8 GW by late August 2026. No transmission-corridor constraint on
the Cape was reported in 2025 or 2026; the Western Cape events were a 132 kV fault that cut both Koeberg units to 100 MW
on about 20 January 2026 and the May 2026 storm. Curtailment of wind and solar is reported as rising from 2025 to 2026
(NTCSA's claims bottleneck of about R2bn in June 2026, 1,000 solar curtailment instructions a month) with no published GWh.

So: the model's 2025 state, with the seed's outages and weather year 2025, sits between the two calendar years it
straddles. Its 2.4 TWh of diesel is a little under FY2025's 2.6 TWh and well above FY2026's 1.1; its 5 GWh of unserved
energy (the LP's 9 to 14) is two orders below the 749 GWh CSIR counted for the first half of 2025, because the engine's
availability input sits above what the fleet delivered in early 2025, when the six bouts followed boiler-tube failures and
Camden's trips, not a network limit. The 2026 state's 0.18 TWh of diesel and no unserved energy agree in direction with
FY2026's 1.1 TWh and the load-shedding-free run since May 2025, the model lower on diesel. Neither year's public record
contains a corridor constraint, and the model's table at any factor from 1.0 to 0.7 produces none on today's fleet: 0.7
moves 0.26 to 0.3 TWh of diesel into the Cape in the 2025 state and nothing in 2026. The test does not separate 0.85 from
0.7 on today's fleet; it says today's fleet does not stress the corridors as drawn, which is consistent with the record.
Caveats: the regional wind and solar series for the 2025 state are scaled by 0.81 and 0.85 to the engine's availability
(the capacity file's MW per area exceeds the page's 2025 fleet); the 2025 state is the page's preset, not calendar 2025;
one outage draw.

### 718 (b): the 0.7 factor, and what the three models apply it to (read 5 Nov 2026 from the repositories)

- PyPSA-RSA (MeridianEconomics/pypsa-rsa, master): scripts/build_topology.py gives each circuit a St Clair loadability,
  St_Clair = min(thermal, SIL x 53.736 x length^-0.65), sums circuits per region pair, and makes the N-1 limit by dropping
  the circuit with the highest St Clair limit per corridor; a corridor with a single circuit is derated by the config's
  n1_approx_single_lines, 0.7. scripts/base_network.py sets each corridor's capacity from the St_Clair_limit_n1 column
  alone (p_nom), never from the thermal or SIL columns, and does not apply the config's s_max_pu 0.7 ("n-1 approximation"
  in the config, unused in the code); losses 6% per 1,000 km through two one-way links. So PyPSA-RSA puts no 0.7 on a
  multi-circuit corridor's St Clair sum: it removes one circuit.
- PyPSA-Eur (config/config.default.yaml): lines: s_max_pu 0.7 on s_nom, which is the thermal rating of the line type per
  voltage (Al/St 240/40 4-bundle 380 kV and so on); the docs call it a correction for N-1 security and reactive flows. It
  is applied to thermal ratings, not to a loadability curve, and PyPSA-Earth copies it.
- ReEDS 2.0 (docs/source/model_documentation.md): existing AC interface capacities come from a nodal DC power flow;
  between model zones they are calculated under N-0; between planning regions N-1 is approximated by dropping the
  interregional line that contributes the most capacity; new interzonal AC capacity's contribution to planning-subregion
  limits is derated by 15%; losses 1% per 100 miles AC; a hurdle of $0.01/MWh against degeneracy.

Verdict: 0.7 on this model's corridor limits double-counts for long corridors. The limits are already St Clair sums (the
curve carries its stability and voltage margin, which is why it falls with length), and none of the three models puts a
0.7 on a St Clair sum: PyPSA-Eur's 0.7 sits on thermal ratings, PyPSA-RSA and ReEDS drop one circuit. The like-for-like
N-1 for this table is "drop one circuit per corridor", (n - 1)/n with n the corridor's circuit count (single circuit 0.7),
run here as case n1c from the circuit counts of the local corridor file; the counts only are used, no rating. Until Nick
settles it every case is reported at 1.0, 0.85, 0.7 and n1c.

The factor on the every-change pass, every case, differences from the no-limits case of the same year and weather year
(TWh, GWh, R bn; the "with TDP" rows use the 20 inter-area lines of the file's own mapping, the "(TDP: tdp_lines_full.json)"
rows the full mapping of (c), 22 lines):

(no rows yet)

What the table says about the factor. The one-circuit rule sits between 0.85 and 0.7 in every year and weather year, closer
to 0.7 (2035, weather year 2025: curtailment +51.6 as drawn, +59.6 at 0.85, +64.8 one circuit dropped, +68.0 at 0.7; 2040:
+91.9, +100.8, +105.8, +110.0), because the corridors that bind are the two- and three-circuit Karoo and Free State ones
where (n - 1)/n is 0.5 to 0.67. Unserved energy separates the rules more than curtailment does (2040, weather year 2025:
2.6 TWh as drawn, 5.2 at 0.85, 6.9 one circuit dropped, 8.4 at 0.7). With the TDP lines the four rules converge (2035:
+16.2 to +16.8 TWh on the full mapping), so the choice of rule matters on today's corridors and not on the plan's. Until
Nick settles it, every case stays reported at all four.

### 718 (c): the TDP in full

### 718 (c): the TDP in full

The accounting (sc/tdp_full.py on nodal/tdp_projects.json at build 2026-11-05f, 221 projects, 82 of them lines):

| class | lines | at 400 kV / 765 kV / kV not given | km stated (lines with a length) | phase |
|---|---|---|---|---|
| joining two supply areas | 22 | 12 / 7 / 3 | 4,765 km (15 of 22) | execution 5, definition 7, concept 4, planned 6 |
| inside one supply area | 60 | 41 / 7 / 12 | 6,486 km (39 of 60) | execution 10, definition 15, concept 6, pre-concept 6, planned 23 |
| an endpoint still unmapped | 0 | | | |

Before the mapping, 17 lines had an endpoint absent from nodal/substations_compact.json. Nine substations were placed in a
supply area from public documents (the TDP 2025 project sheets and Eskom's grid-connection capacity assessment maps as
reported): Umtu (Northern Cape), Isundu, Mbewu and Iphiva (KwaZulu-Natal), Quattro (Gauteng), Hlaziya, Zanokhanyo and Coega
(Eastern Cape), Bokkom (Western Cape); the map is docs/regional-audit/tdp_substation_map.json. Every line now has both ends in
an area. Lines inside one area by area: Northern Cape 12, Western Cape 12, Eastern Cape 10, KwaZulu-Natal 8, Limpopo 5,
Gauteng 4, Mpumalanga 3, North West 3, Free State 2, Hydra Central 1; they are the within-area limits the ten-area model does
not carry, so the full-TDP case uses only the 22 inter-area lines and still omits the relief the 60 give within areas.

Inter-area capacity added, at 900 MW a 400 kV circuit and 3,000 MW a 765 kV circuit (capacity_siting.js), by year of the
TDP's date: 2025 3,900 MW; 2027 3,600; 2028 5,700; 2029 7,800; 2030 900; 2032 7,800; 2033 4,800; 34,500 MW in all by 2033.
By pair: Free State to Mpumalanga 3,900; Hydra Central to Western Cape 3,900; North West to Northern Cape 3,900; Eastern
Cape to KwaZulu-Natal 3,900; Limpopo to North West 3,000; Free State to Hydra Central 3,000; Eastern Cape to Hydra Central
3,000; Northern Cape to Western Cape 2,700; Gauteng to Mpumalanga 1,800; and 900 each for Free State to Gauteng, Free State
to KwaZulu-Natal, Gauteng to North West, Limpopo to Mpumalanga, Hydra Central to Northern Cape and Free State to Northern
Cape. In the LP each addition is a single new circuit at 0.7 in the drop-one-circuit case (one circuit of a new line is lost
at N-1 unless the line is double-circuit, which the TDP sheet does not say), and at the case's factor otherwise.

Against the public statements. The lines with a stated length sum to 11,251 km by 2034 (420 km by 2025, 1,833 by 2027,
4,495 by 2029, 10,165 by 2032); 28 of the 82 lines carry no length in the file. NTCSA's TDP 2024 (the plan for 2025 to
2034) is reported as about 14,500 km of new lines and 56 GW of new generation to connect over the ten years (Engineering
News, 30 October 2024, "NTCSA revises latest TDP considering uptick in expected generation capacity"), at about R440bn over
ten years (Daily Maverick, 18 June 2026, "SA's transmission build opens a R440bn test for private capital and local
industry"); at its launch NTCSA put 30 GW of utility-scale renewables connected by the end of 2029, with 11 GW and 1,250 km
of lines by financial year 2027 on a R112bn five-year budget (NTCSA launch statement of 7 October 2024 as reported by Green
Building Africa and ESI Africa). So the file's stated lengths cover about three quarters of the plan's kilometres and the
28 unstated lines plausibly hold the rest; the accounting cannot confirm the total, and the file's 1,833 km dated by 2027 sit above
the 1,250 km NTCSA named for financial year 2027, which is the build-pace question, not a mapping one. The
generation-connection figures (56 GW over the plan, 30 GW by 2029, the remaining 26 GW after) are connection capacity, not
inter-area transfer, and are not comparable with the 34,500 MW above, which is transfer capacity between the model's areas on
the circuit assumptions. No NTCSA grid-capacity figure is used anywhere in this work.

What the full mapping does in the LP (the "(TDP: tdp_lines_full.json)" rows above). 2035, weather year 2025, one circuit
dropped: curtailment +16.2 TWh above no limits (19.3 TWh in all) against +35.1 with the file's own 20 lines and +64.8 with
today's corridors; no unserved energy; coal +15.6 TWh. 2040: +42.8 (55.9 in all) against +70.2 and +105.8; no unserved
energy; coal +39.5, gas +1.6. Weather year 2015 the same within 3 TWh. So the plan's inter-area lines, at their dates,
remove three quarters of the 2035 network effect and 60% of 2040's on this build.

Why 2040 still curtails 43 TWh above no limits, by area and corridor. The 2040 build's new wind sits 36% in the Western
Cape, 23% in Hydra Central and 21% in the Northern Cape, and its new solar 25% in the Northern Cape and 13% in Hydra
Central (the approved-records shares), so with no limits the three areas export 146 TWh net (Northern Cape 52.6, Hydra
Central 49.1, Western Cape 44.6). Their exits with the full TDP at one circuit dropped are North West to Northern Cape 3,062
MW (663 today plus 3,900), Free State to Northern Cape 2,256 (2,439 plus 900), Free State to Hydra Central 4,402 (2,763 plus
3,000), Eastern Cape to Hydra Central 2,943 (1,124 plus 3,000) and North West to Western Cape 163 (233 today, no TDP line):
about 12.8 GW, which at full use all year is 112 TWh against the 146 needed, and the diurnal shape of solar and the Cape's
wind leaves less. The LP therefore curtails Hydra Central 26.6 TWh, the Northern Cape 13.1, the Eastern Cape 9.7 and the
Western Cape 6.5, and the three exits bind in 6,200 hours each at R6.2m per MW-year (North West to Western Cape, Free
State to Northern Cape, Free State to Hydra Central, North West to Northern Cape), the Eastern Cape's two exits (to
KwaZulu-Natal 3,299 MW, to the Free State 318) in 4,800 hours. The Free State hub's eastward exits (to Mpumalanga 4,904
MW, Gauteng 1,931, KwaZulu-Natal 929) bind only 991 hours: the plan relieves the hub; it does not add enough on the
Karoo's own exits for a fleet sited by the approved records. In 2035 the same five corridors bind in 3,900 hours at R2.5m,
and the Karoo curtails 19 TWh (Hydra Central 10.2, Eastern Cape 4.6, Northern Cape 3.7).

What this does not say. The 60 within-area TDP lines are absent, so the model cannot tell whether the Karoo's own
collection network or the corridor exits are the real limit; the exits here are the model's St Clair sums plus the TDP
lines at 900 and 3,000 MW a circuit, and North West to Western Cape (233 MW) is one of the two estimated corridors.

### 718 (d): corridors chosen by the LP

(no rows yet)

Reading. Given the 2035 build and today's corridors at 0.7 or one circuit dropped, the LP adds 26 to 28 GW of corridor (5.2
to 5.6 million MW-km) at R10,000 per MW-km, R52 to 56bn of capex and R4.3 to 4.7bn a year, and curtailment falls from 61 to
71 TWh to 3.6 to 3.8, within 0.7 TWh of the no-limits case; in 2040, 35 to 38 GW, R70 to 75bn, R5.8 to 6.3bn a year, with
curtailment at 12.6 to 14.1 against 11.5 to 13.1 with no limits. The corridors chosen: North West to Northern Cape 9 to 12
GW, Eastern Cape to KwaZulu-Natal 5 to 9, Northern Cape to Western Cape 6 to 8, Eastern Cape to Hydra Central 2 to 5, Free
State to Northern Cape 1 to 4, Free State to Gauteng 0.6 to 3. The LP builds nearly to the no-limits optimum because the
corridor annuity (R839 per MW-km a year; R0.3 to 0.6m per MW-year on these corridors) is far below the shadow values of the
fixed cases (R20 to 300m per MW-year). At the TDP-derived R21,700 per MW-km: the LP builds 23.7 to 24.2 GW in 2035 (4.7 to 4.9 million MW-km, R102 to 107bn of capex, R8.5 to 9.0bn a year) and 32.1
to 34.6 GW in 2040 (6.5 to 6.8 million MW-km, R141 to 148bn, R11.8 to 12.4bn a year), 10% less corridor than at R10,000
with 1.3 TWh more curtailment left (5.0 to 5.1 TWh in 2035, 15.4 in 2040), the same six corridors in the same order. The
choice is insensitive to the unit cost over this range because the fixed cases' shadow values sit so far above either
annuity; the annuity doubles, the corridor built hardly moves. At R21,700 the 2035 corridor annuity is half the
integration charge and a quarter of the TDP's R36.9bn a year.

Against the integration charge and the TDP. The build LP's integration charge (txRPerKWyr R364 per kW-year on new wind and
solar, the whole VRE share) collects R16.4bn a year on the 2035 build's 44,957 MW and R23.9bn on 2040's 65,553 MW, three to
four times the corridor annuity the ten-area LP chooses at R10,000 per MW-km (R4.3 to 4.7bn and R5.8 to 6.3bn). The TDP's
R440bn over ten years is R44bn a year of capex, or R36.9bn a year annuitised at 0.08 over 40 years, eight times the LP's
corridor annuity: the TDP also buys the 60 within-area lines, 133,000 MVA of transformation and the generation
connections, none of which the ten-area LP prices, and it serves all three builds and the coal provinces' outflows (Free
State to Mpumalanga 3,900 MW, Limpopo to North West 3,000), which this build does not use. By corridor, the LP wants about
three times the TDP's North West to Northern Cape capacity and 1.5 to 2 times its Eastern Cape to KwaZulu-Natal and
Northern Cape to Western Cape capacity, and nothing on the hub's eastward lines. So the charge is not low against what the
corridors cost in this test; what the test cannot say is what the within-area network costs, which is where the TDP's
money mostly goes.

### 718 (e): siting chosen by the LP

(no rows yet)

Reading. The 2035 build has 27,246 MW of new wind and 17,711 MW of new utility solar to place. The caps are the approved
REEA records by area: wind Western Cape 17,805 MW, Hydra Central 11,684, Northern Cape 10,344, Eastern Cape 6,190,
Mpumalanga 2,680, KwaZulu-Natal 649, North West 350, Free State 190, Gauteng 75 (49,967 in all); solar Northern Cape
34,195, North West 24,711, Free State 20,685, Hydra Central 18,062, Limpopo 15,690, Western Cape 15,584, Mpumalanga 4,045,
Gauteng 3,150, Eastern Cape 1,376, KwaZulu-Natal 950 (138,448). Given the choice, the LP moves the new solar out of the
Northern Cape, Free State, Limpopo, Western Cape and Hydra Central (the REEA shares: 25%, 15%, 11%, 11%, 13%) and puts
all of it next to the load: with one circuit dropped 95% in the North West (16.8 GW of its 24.7 GW cap) and 5% in
KwaZulu-Natal (its cap); at 0.7, where the North West's own exits are tighter, 54% North West, 23% Mpumalanga and 18%
Gauteng, the last two at their caps; with the TDP lines 100% North West. Wind it spreads: the Western Cape's share falls from
36% to 15 to 18%, the Eastern Cape's rises from 12% to 21 to 23%, Hydra Central's and the Northern Cape's stay at 16 to 27%
and 24 to 38%, and Mpumalanga, KwaZulu-Natal, the North West and the Free State are each filled to their cap (10%, 2%, 1%,
1%), which says the LP wants more wind near the load than the records allow. The result: curtailment on today's corridors
falls from 68 to 71 TWh to 40 to 42 (no limits 3.1), unserved energy from 474 to 705 GWh to 15 to 137, and coal from 126
to 129 TWh to 100 to 102; with the full TDP from 19.3 TWh to 7.9 and coal from 78.5 to 65.3. Free siting removes two
fifths of the corridor penalty on today's corridors and three fifths with the TDP; what is left is wind in the Eastern
Cape (17.2 TWh curtailed), Hydra Central (13.5) and the Northern Cape (9.1), where the records put it. The shadow price of
the North West to Northern Cape corridor falls from R55m to R8m per MW-year. Two caveats. The within-area limits are
absent, so 17 GW of solar in one area is a lower-bound result: the records cap the MW, they do not say the North West's
own 400 kV network can take it, and the LP values that area for its position beside Gauteng's load and inside the
coal provinces' corridor cluster, not for its resource. And the record totals (50 GW of wind, 138 GW of solar) are large
against the build, so the caps bind only on wind in the four small areas; a cap by substation or by the TDP's generation
connection capacity would bind far more.

### 718 (f): the mix chosen by the LP

(no rows yet)

Reading (the run on build 2026-11-05f; the LP in 3-hour blocks, weather year 2025; the 2040 priced-corridor, capped, weather-2015, full-TDP and fixed-corridor 2040 cases were still in the queue when this was written and are filled in as they land).

Control (no limits, the integration charge kept, the run's own costs and commitment floor). In 2035 the LP builds 22.2 GW of wind against the run's 27.2, 13.7 GW of solar against 17.7 and 7.0 GW / 25 GWh of lithium against 8.8 / 38, no open cycle (the run none), and runs coal at 86 TWh against the engine's 71.5, curtailing 5.3 TWh against 9.8; cost R150.6bn a year (new build R86.7bn, fuel and carbon R63.9bn). The run's own mix on the same blocks and costs (the fixed-build 3-hour case) costs R52.2bn of fuel and carbon plus R110.0bn of annuities, R162.2bn, so the single-year LP is R11.6bn a year (7.1%) cheaper in the 2035 year by building 5 GW less wind, 4 GW less solar and 2 GW less lithium. In 2040 the gap widens: 29.1 GW of wind against 40.7, 31.9 GW of solar against 24.8, 13.2 GW / 87 GWh of lithium against 11.0 / 61 and 1.1 GW of open cycle against 4.3; coal 49 TWh against 45.5, curtailment 10.5 against 22.1; cost R181.7bn against R197.8bn for the run's mix on the same blocks (R37.5bn of fuel and carbon plus R160.3bn of annuities at the 2040 costs), R16.1bn a year (8.1%).

The gap, and what the checks say. (1) Not the build-rate cap or foresight on costs: the pathway builds wind at its annual cap every year from 2028 to 2038 on the way to 40.7 GW in 2040, but the LP at 2040 costs (wind R2.28m per MW-year, 9% below 2035; solar R1.43m, 11% below) still chooses 29 GW, and takes more solar and lithium and less open cycle instead; a binding pace cap would show as the LP wanting more wind than the run, not less. What does bind in 2040 is the LP's own siting cap: new wind and solar in each area are capped at the area's approved capacity (the REEA records the siting of (e) uses), and the LP's 29 GW is where the three best wind areas run out (Northern Cape 10.3 GW and Eastern Cape 6.2 at their caps, Hydra Central 11.2 of 11.7; capacity factors 0.37 to 0.40 in the regional series); the next wind is the Western Cape's 17.8 GW at 0.33, which the LP declines in favour of solar and lithium. The national model's marginal wind carries the national series, so part of the 2040 gap is the LP's per-area profiles and caps, which the national model does not have. In 2035 the LP leaves 3.7 GW of Hydra Central and 3 GW of Eastern Cape capacity unused, so there the 22 GW is a choice, not a cap. (2) Not the national caps (31.9 GW of wind, 21.3 of solar and 10.2 of lithium in 2035): the LP's choice sits below each of them, and the capped case, run, returns the same mix and the same R150.6bn to the rand (only the lithium's siting between Gauteng and Limpopo, to which the LP is indifferent, differs). (3) Not the block length: the 6-hour control chose 21.8 GW of wind and 14.2 of solar, the 3-hour 22.2 and 13.7; blocks move lithium (3.7 GW at 6 h, 7.0 at 3 h), not wind. (4) Left, and not testable with this LP: the pathway's adequacy standard, 20 GWh of unserved energy on 20 weather years at the K = 20 check, where the LP sees one weather year at the value of lost load (its controls leave 0.2 and 2.8 GWh unserved); the pathway's 25 clustered plus 12 extreme days against the LP's whole year in blocks, which weight the winter evenings differently; and the coupling of the one pathway LP across years, in which capacity built for 2040's demand (15% above 2035's) and for the standard is counted in 2035's mix. The weather-2015 controls (below) say how far one weather year moves the choice: 0.5 GW of wind in 2035, 2.4 GW in 2040. On the LP's accounting the R11 to 16bn a year is an upper bound on what the standard, the day weighting and the coupling together cost in those two years, and it is the figure to carry to the discussion of the standard after the note; it is not a network cost.

Corridors priced (the integration charge removed, corridors extendable at R10,000 per MW-km from one circuit dropped). 2035: the LP builds 22.5 GW of wind, 15.6 of solar, 6.6 GW / 23 GWh of lithium and 14.4 GW of corridor (North West to Northern Cape 8.0 GW, Eastern Cape to KwaZulu-Natal 5.2, Free State to Northern Cape 1.2) for R2.35bn a year; coal 84 TWh, curtailment 7.4, unserved 1 GWh; cost R140.4bn. Against the control the mix barely moves (2 GW more solar, 0.4 GW less lithium, 3 GW of wind shifted from Hydra Central to the Eastern Cape). On the same accounting the control's mix without the charge costs R137.6bn, so the network costs R2.8bn a year in this framing: the corridors R2.35bn and the rest dispatch. The explicit inter-area cost replaces an integration charge of R15.6bn (R364 per kW-year on 42.9 GW), which is the charge's job: it stands for the within-area grid as well, which this LP does not carry, so the two are not the same thing and the difference is not a saving. The 14.4 GW is half the 26.5 GW the fixed-build case of (d) built, because the LP that can also choose the mix puts 5 GW of solar in the North West beside the load instead of carrying it. 2040: the LP builds 26.9 GW of wind (Northern Cape 10.3, Hydra Central 7.7, Eastern Cape 6.2, Mpumalanga 1.4), 40.3 GW of solar (Northern Cape 25.3, Limpopo 7.9, North West 6.5), 14.4 GW / 98 GWh of lithium (Northern Cape 10.6, North West 2.4), no open cycle, and 20.1 GW of corridor (North West to Northern Cape 10.7 GW, Eastern Cape to KwaZulu-Natal 5.7, Free State to Northern Cape 1.7, Hydra Central to Northern Cape 1.0) for R3.35bn a year; coal 47 TWh, curtailment 13.6, unserved 3 GWh; cost R162.9bn against the control's R159.5bn without the charge, so the network costs R3.4bn a year in 2040, nearly all of it the corridors. Against the control the LP trades 2 GW of wind and the 1.1 GW of open cycle for 8 GW more solar and 1 GW more lithium, in the Northern Cape beside the wind, and carries it out on the Karoo exit; the 20.1 GW is just over half the 35 to 38 GW the fixed-build case of 722 (a) built for 2040. With the plan's 22 inter-area lines in place first (the full-TDP start, 2035), the LP builds 5.9 GW of corridor beyond them (North West to Northern Cape 2.8, Free State to Northern Cape 2.0, Eastern Cape to KwaZulu-Natal 1.1) for R0.85bn a year, the mix within 0.3 GW of the control's, cost R138.5bn: the plan's lines take the 2035 network cost in this framing from R2.8bn to R1.0bn a year and the corridor build from 14.4 to 5.9 GW, and what the LP adds beyond the plan is a second Karoo exit and the Free State to Northern Cape link.

Today's corridors as a hard limit (the integration charge kept, corridors fixed at one circuit dropped). The LP moves the build from Cape wind to North West solar and storage: 12.4 GW of wind (Northern Cape 4.3, Hydra Central 3.6, Eastern Cape 1.7, Mpumalanga 1.6), 23.1 GW of solar (North West 20.7), 7.8 GW / 44 GWh of lithium (North West 4.9) and 0.7 GW of open cycle in KwaZulu-Natal; coal 105 TWh, 19 above the control; cost R163.8bn, R13.2bn a year above the control. So in the mix framing the network cost of today's corridors is R13bn a year and a different build; with corridors buildable at R10,000 per MW-km it is R2.8bn and the control's build. 2040: the same move, larger. The LP builds 16.4 GW of wind (Northern Cape 4.7, Hydra Central 4.7, Eastern Cape 3.0, Mpumalanga 2.7), 52.1 GW of solar (North West 24.7, Limpopo 15.7, Mpumalanga 4.0 and Gauteng 3.1, each the whole of the area's approved capacity, Free State 3.4), 18.5 GW / 115 GWh of lithium (North West 7.2, Limpopo 5.8, Gauteng 2.0) and 1.9 GW of open cycle in KwaZulu-Natal, against the control's 29.1, 31.9, 13.2 GW / 87 GWh and 1.1; coal 68 TWh, 19 above the control; curtailment 16 TWh; cost R209.1bn, R27.4bn a year above the control's R181.7bn. Every approved solar record in the coal provinces and the North West is filled, so the 2040 figure rests on those records as much as on the corridor table; with more approved capacity there the LP would move further and the gap would be smaller, with less it would be larger.

The plan's lines as a fixed network (the full TDP's 22 inter-area lines at one circuit dropped, corridors fixed, the integration charge kept; 2035): 19.9 GW of wind (Northern Cape 10.3, Hydra Central 5.4, Eastern Cape 3.0), 15.7 GW of solar (North West 10.7, Northern Cape 3.7), 6.9 GW / 28 GWh of lithium; coal 92 TWh, curtailment 5.1, unserved 1 GWh; cost R153.4bn, R2.8bn a year above the control, against R13.2bn on today's corridors. On this framing the plan's inter-area lines take the 2035 network cost from R13bn to R3bn a year, the same R3bn the LP reaches from today's network by buying 14.4 GW of corridor itself, and with the lines in place it buys 5.9 GW more and gets to R1bn. For 2040 the same case (the plan's lines first, corridors priced) builds 9.2 GW beyond them (North West to Northern Cape 4.9, Eastern Cape to KwaZulu-Natal 2.1, Free State to Northern Cape 2.1) for R1.41bn a year, with 27.4 GW of wind, 39.1 of solar and 14.4 GW / 96 GWh of lithium; cost R160.7bn against the control's R159.5bn without the charge, so the plan's lines take the 2040 network cost in this framing from R3.4bn to R1.2bn a year and the corridor build from 20.1 to 9.2 GW.

Weather year 2015 (the controls and the priced-corridor cases). 2035: the LP builds 22.7 GW of wind (22.2 on weather 2025; Northern Cape 10.3, Hydra Central 8.9, Eastern Cape 1.9), 12.8 GW of solar (13.7), now in the Western Cape (8.5 GW) rather than the Northern Cape, and 6.6 GW / 27 GWh of lithium (7.0 / 25); coal 91 TWh against the engine's 76, curtailment 3.7 against 9.0; cost R154.2bn against R165.4bn for the run's mix on the same blocks (R55.4bn of fuel and carbon plus R110.0bn of annuities), R11.2bn a year (6.8%). 2040: 31.5 GW of wind (29.1; Hydra Central 11.3, Northern Cape 10.3, Eastern Cape 6.1, Mpumalanga 2.7, the last at its cap), 33.5 GW of solar (31.9; Western Cape 15.6 at its cap, Limpopo 14.6), 11.1 GW / 68 GWh of lithium (13.2 / 87) and 1.8 GW of open cycle (1.1); coal 52 TWh against 49, curtailment 14.4 against 20.2; cost R193.1bn against R205.3bn (R45.0bn plus R160.3bn), R12.2bn a year (5.9%). So one weather year moves the LP's wind by 0.5 GW in 2035 and 2.4 GW in 2040, moves the solar's siting more than its size, and moves the gap between R11bn and R16bn a year; the wind choice, 22 to 23 GW in 2035 and 29 to 32 in 2040 against the run's 27 and 41, is not a weather-year accident. With corridors priced on weather 2015 (2035) the LP builds 12.9 GW of corridor for R2.16bn a year on the same links as on weather 2025 (North West to Northern Cape 7.0 GW, Eastern Cape to KwaZulu-Natal 4.4, Free State to Northern Cape 1.0), with 21.9 GW of wind, 16.6 of solar and 6.2 GW / 27 GWh of lithium, and the network costs R2.5bn a year against its own control, so the 2035 network cost in this framing is R2.5 to 2.8bn across the two weather years. For 2040 on weather 2015 the LP builds 17.9 GW of corridor for R2.95bn a year (North West to Northern Cape 6.9, Eastern Cape to KwaZulu-Natal 5.5, Northern Cape to Western Cape 2.5, Eastern Cape to Hydra Central 1.6, Free State to Northern Cape 1.3), with 28.9 GW of wind, 43.7 of solar (Limpopo 15.7, Western Cape 14.0, North West 9.4) and 14.1 GW / 86 GWh of lithium, and the network costs R2.4bn a year against its own control, so the 2040 figure is R2.4 to 3.4bn across the two weather years, the solar's siting moving with the weather year (the Northern Cape on 2025, Limpopo and the Western Cape on 2015) while the wind and the corridors do not. The 2040 state on weather 2015 is the first full-year case run on the corrected script: its objective and its component sum agree to R2m, the tie-breaking cent on 229 TWh of real corridor flow.

Caveats. New wind and solar are capped per area at the approved capacity (50 GW of wind, 138 GW of solar in all), which binds the 2040 wind as above; no within-area limits, so the North West solar the LP sites beside the load is unconstrained inside the area; 3-hour blocks understate curtailment and the lithium value where a peak is shorter than a block; one weather year; the LP's objective carries no within-area grid cost where corridors are priced; the engine's commitment floor on coal applies to the standing fleet in every case; the run's costs are the dump's for the year (2035 and 2040 differ by the engine's learning). Cost, throughout, is the sum of new-build annuities, corridor annuities, fuel and carbon and unserved energy at the value of lost load (R87,000 per MWh), not the objective PyPSA reports: in the no-limits cases that objective is R0.6bn lower, because the R0.01 per MWh tie-breaking cost on the bidirectional corridors rewards flow in the negative direction, and with a million megawatts of capacity the LP circulates it round every loop (19 of the 21 corridors carry it in most hours). The circulation changes no bus balance and so no dispatch, curtailment or mix, the binding-hour and shadow-price columns come from the duals and do not see it, and the limited cases carry at most a few million rand of it; it is a fault in the scratch script all the same. Fixed at 07:06 SAST on 6 Nov 2026 (pypsa_net.py: every corridor a pair of one-way links tied by a constraint, the capital cost on one of them; the old script kept as pypsa_net_v1.py): on three 25-day checks of the 2035 state (the no-limits free mix, the extendable fixed build and the extendable free mix; docs/regional-audit/results/v2check/) the two scripts agree on every capacity, corridor, fuel and unserved figure, the corridor flow falls from 9,794 to 12 TWh in the no-limits case, and the objective rises by R0.616bn there and by R0.005bn in the limited cases. Queue cases started after the switch carry a script field and ran the corrected script; the 2040 weather-2015 control is the full-year check on a control (objective and component sum equal to R2m), and on the full-year extendable check (the 2035 fixed build with corridors extendable, hourly) the corrected script returns the original's 26,485 MW on the same corridors to the megawatt, the same fuel, coal, curtailment, binding hours and shadow prices, and an objective R5m higher (the cent on the circulation the limited network allowed), in 320 s against 704 s; so the results on the original script stand, and only the objective field of its no-limits files carries the artefact.

### 718 (g): the demand split

(no rows yet)

Reading. BLD_LOAD_SHARE is one static share per area; the regional demand file's shares are hourly. The annual means
differ: Gauteng 31.5% static against 28.0% in the file, Mpumalanga 17.5 against 11.9, Free State 5.5 against 2.9, Western
Cape 11.5 against 10.0, and the other way KwaZulu-Natal 15.5 against 19.2, North West 7.5 against 11.0, Limpopo 4.8
against 9.2, Eastern Cape 4.2 against 5.0, Northern Cape 1.4 against 2.1; the file's shares also move through the year
(Gauteng 22.5 to 32.7%, KwaZulu-Natal 14.8 to 21.4%). The static split puts more of the load inside the coal provinces,
where the coal sits, and less at the end of the KwaZulu-Natal and Limpopo corridors, so it eases the result: curtailment
71.0 to 68.1 TWh at 0.7 and 67.9 to 66.9 with one circuit dropped, unserved energy 705 to 512 and 474 to 426 GWh, coal 2 TWh
lower, the same six corridors binding in the same order; with no limits the two splits give the same 3.1 TWh. One to three
TWh of curtailment, a twentieth of the corridor effect: the demand split is not what decides these results, the corridor
table is. The file's split stays the base case, since it carries the hourly shape; the test says the choice does not
matter to the finding.

### 717 (c) rerun on the every-change pass (build 2026-11-05f)

Tie-out with no limits, against the engine (TWh; the LP free, with the commitment floor, and with the engine's coal fixed):

| year, weather year | coal, engine | LP free | LP, engine commitment floor | LP, engine coal fixed | curtailed, engine | free | floor | fixed | storage discharge, engine | free | floor | fixed | gas, engine | free | floor | fixed | diesel, engine | free | floor | fixed |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2035, 2025 | 71.5 | 62.9 | 74.2 | 71.5 | 9.8 | 3.1 | 12.7 | 14.0 | 18.5 | 10.3 | 17.4 | 16.7 | 0.00 | 0.00 | 0.0 | 0.0 | 0.52 | 0.19 | 0.2 | 4.0 |
| 2035, 2015 | 76.0 | 68.5 | 78.6 | 76.0 | 9.0 | 2.8 | 11.4 | 13.0 | 18.0 | 10.5 | 16.8 | 16.5 | 0.00 | 0.00 | 0.0 | 0.0 | 0.84 | 0.16 | 0.2 | 4.2 |
| 2040, 2025 | 45.5 | 36.9 | 46.9 | 45.5 | 22.1 | 13.1 | 22.1 | 23.6 | 24.9 | 23.4 | 26.5 | 26.6 | 2.85 | 1.75 | 1.8 | 4.7 | 0.63 | 0.33 | 0.3 | 0.3 |
| 2040, 2015 | 49.0 | 41.7 | 51.1 | 49.0 | 20.2 | 11.5 | 20.0 | 21.1 | 24.5 | 23.8 | 26.0 | 26.0 | 5.00 | 3.57 | 3.6 | 6.8 | 1.31 | 0.44 | 0.4 | 0.4 |

The gap before reading the cases: as on the stand-in, the free LP shuts coal in daylight and curtails 7 to 9 TWh less than the
engine; the commitment floor returns coal to within 3 TWh of the engine's and curtailment to within 3; fixing the engine's
coal returns coal exactly and leaves curtailment 1 to 4 TWh above the engine's, which is not a difference in supply: with
coal fixed and no cost on curtailment or on cycling, the LP is indifferent between charging a store and curtailing, so the
"fixed" column's curtailment and storage columns are degenerate and only their sum is comparable (2035: engine 9.8 plus
18.5 against the LP's 14.0 plus 16.7). Availability, must-run plant and demand match by construction.

Differences from the no-limits case on the same year and weather year (every row of the stand-in table rerun, plus the 0.85
and one-circuit cases):

| year, weather year | case | curtailed, TWh | of it wind | solar | unserved, GWh | coal, TWh | gas | diesel | storage discharge | fuel and carbon, R bn | corridors with a shadow price over 4,000 hours (value of one more MW, R m a year) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 2035, 2025 | N-1 (PyPSA-RSA's table, labelled 'as drawn (N-0)' before 738) | +51.6 | +45.2 | +6.5 | +1.5 | +51.3 | +0.0 | +0.19 | -0.5 | +37.0 | North West to Northern Cape (7464 h, R6.8m); North West to Western Cape (7460 h, R6.8m); Eastern Cape to Kwazulu Natal (6848 h, R5.9m); Free State to Mpumalanga (6862 h, R5.9m); Free State to North West (6862 h, R5.9m); Free State to Gauteng (6862 h, R5.9m) |
| 2035, 2025 | 0.85 x today | +59.6 | +50.3 | +9.3 | +163.6 | +58.9 | +0.0 | +0.46 | -0.0 | +44.0 | North West to Western Cape (7908 h, R38.3m); North West to Northern Cape (7920 h, R37.7m); Free State to Kwazulu Natal (7341 h, R33.0m); Free State to Mpumalanga (7323 h, R32.7m); Free State to North West (7323 h, R32.7m); Free State to Gauteng (7323 h, R32.7m) |
| 2035, 2025 | N-1 (0.7 x today) | +68.0 | +55.4 | +12.6 | +704.8 | +66.0 | +0.0 | +1.30 | +0.6 | +54.2 | Free State to Kwazulu Natal (8209 h, R69.6m); Eastern Cape to Kwazulu Natal (7474 h, R68.4m); North West to Northern Cape (8330 h, R63.6m); North West to Western Cape (8327 h, R63.5m); Free State to Mpumalanga (7732 h, R52.1m); Free State to North West (7732 h, R52.1m) |
| 2035, 2025 | N-1, one circuit dropped | +64.8 | +53.3 | +11.6 | +474.2 | +63.6 | +0.0 | +0.66 | -0.0 | +48.6 | North West to Western Cape (8036 h, R55.0m); North West to Northern Cape (8130 h, R55.0m); Eastern Cape to Kwazulu Natal (6809 h, R38.2m); Free State to Northern Cape (4680 h, R32.1m); Free State to Hydra Central (4505 h, R30.1m); Free State to Kwazulu Natal (5486 h, R23.0m) |
| 2035, 2025 | N-1 with TDP lines by year | +36.0 | +33.0 | +3.0 | +0.0 | +35.5 | +0.0 | +0.04 | -2.6 | +25.0 | Eastern Cape to Kwazulu Natal (6122 h, R4.4m); North West to Northern Cape (6124 h, R4.3m); North West to Western Cape (6123 h, R4.3m); Free State to Northern Cape (6068 h, R4.1m); Free State to Hydra Central (6067 h, R4.1m); Eastern Cape to Free State (6063 h, R4.1m) |
| 2035, 2025 | one circuit dropped, with TDP lines by year | +35.1 | +32.4 | +2.7 | +0.0 | +34.6 | +0.0 | +0.01 | -3.1 | +24.2 | Eastern Cape to Kwazulu Natal (6009 h, R4.2m); North West to Northern Cape (6014 h, R4.2m); North West to Western Cape (6011 h, R4.2m); Free State to Northern Cape (5992 h, R4.1m); Free State to Hydra Central (5989 h, R4.1m); Eastern Cape to Free State (5986 h, R4.1m) |
| 2035, 2025 | N-1 (0.7 x today), losses 6%/1,000 km | +67.9 | +57.6 | +10.3 | +816.2 | +67.1 | +0.0 | +1.72 | -0.1 | +57.6 | Eastern Cape to Kwazulu Natal (7632 h, R78.5m); Free State to Kwazulu Natal (8709 h, R74.6m); North West to Northern Cape (8754 h, R74.1m); North West to Western Cape (8323 h, R69.7m); Free State to Gauteng (8741 h, R56.2m); Free State to North West (8718 h, R56.1m) |
| 2035, 2025 | N-1 (0.7 x today), fleet siting | +74.6 | +60.6 | +13.9 | +1263.5 | +71.0 | +0.0 | +2.41 | +0.5 | +64.6 | Eastern Cape to Kwazulu Natal (8342 h, R126.8m); North West to Western Cape (8248 h, R104.4m); North West to Northern Cape (8247 h, R104.3m); Free State to Kwazulu Natal (7962 h, R81.7m); Free State to Mpumalanga (6027 h, R55.1m); Free State to North West (6027 h, R55.1m) |
| 2035, 2025 | N-1 (0.7 x today), engine commitment floor | +58.3 | +49.8 | +8.6 | +704.8 | +54.7 | +0.0 | +1.30 | -6.5 | +46.3 | Free State to Kwazulu Natal (8209 h, R69.6m); Eastern Cape to Kwazulu Natal (7474 h, R68.4m); North West to Northern Cape (8330 h, R63.6m); North West to Western Cape (8327 h, R63.5m); Free State to Mpumalanga (7732 h, R52.1m); Free State to North West (7732 h, R52.1m) |
| 2035, 2015 | N-1 (PyPSA-RSA's table, labelled 'as drawn (N-0)' before 738) | +45.8 | +40.2 | +5.6 | +0.0 | +45.7 | +0.0 | +0.07 | -0.0 | +32.4 | North West to Western Cape (7062 h, R5.6m); North West to Northern Cape (7033 h, R5.6m); Eastern Cape to Kwazulu Natal (6436 h, R5.0m); Free State to Kwazulu Natal (6259 h, R4.6m); Free State to Mpumalanga (6255 h, R4.6m); Free State to North West (6255 h, R4.6m) |
| 2035, 2015 | 0.85 x today | +53.4 | +45.3 | +8.1 | +26.7 | +53.1 | +0.0 | +0.42 | +0.8 | +39.7 | North West to Western Cape (7697 h, R20.7m); North West to Northern Cape (7697 h, R20.6m); Eastern Cape to Kwazulu Natal (6808 h, R19.2m); Free State to Kwazulu Natal (6900 h, R19.0m); Free State to Mpumalanga (6853 h, R18.6m); Free State to North West (6853 h, R18.6m) |
| 2035, 2015 | N-1 (0.7 x today) | +61.7 | +50.4 | +11.3 | +561.1 | +59.1 | +0.0 | +2.33 | +1.3 | +55.8 | Free State to Kwazulu Natal (8157 h, R135.4m); Eastern Cape to Kwazulu Natal (7392 h, R133.8m); North West to Northern Cape (8239 h, R112.4m); North West to Western Cape (8230 h, R112.2m); Free State to Mpumalanga (7478 h, R100.9m); Free State to North West (7478 h, R100.9m) |
| 2035, 2015 | N-1, one circuit dropped | +58.6 | +48.3 | +10.3 | +197.1 | +57.4 | +0.0 | +1.16 | +0.9 | +47.3 | North West to Northern Cape (8071 h, R56.9m); North West to Western Cape (7931 h, R56.3m); Eastern Cape to Kwazulu Natal (6611 h, R46.8m); Free State to Northern Cape (4418 h, R32.3m); Free State to Hydra Central (4204 h, R31.5m); Free State to Kwazulu Natal (5427 h, R25.3m) |
| 2035, 2015 | N-1 with TDP lines by year | +31.4 | +28.8 | +2.6 | +0.0 | +31.1 | +0.0 | -0.00 | -2.3 | +21.7 | Eastern Cape to Kwazulu Natal (5592 h, R3.8m); North West to Northern Cape (5586 h, R3.8m); North West to Western Cape (5586 h, R3.8m); Free State to Hydra Central (5508 h, R3.7m); Free State to Northern Cape (5508 h, R3.7m); Eastern Cape to Free State (5508 h, R3.7m) |
| 2035, 2015 | one circuit dropped, with TDP lines by year | +30.6 | +28.3 | +2.3 | +0.0 | +30.2 | +0.0 | -0.00 | -2.7 | +21.1 | North West to Northern Cape (5479 h, R3.8m); North West to Western Cape (5479 h, R3.8m); Eastern Cape to Kwazulu Natal (5479 h, R3.8m); Free State to Hydra Central (5433 h, R3.7m); Free State to Northern Cape (5433 h, R3.7m); Eastern Cape to Free State (5433 h, R3.7m) |
| 2040, 2025 | N-1 (PyPSA-RSA's table, labelled 'as drawn (N-0)' before 738) | +91.9 | +77.9 | +14.0 | +2632.1 | +62.9 | +22.0 | +2.70 | -6.5 | +107.2 | North West to Northern Cape (8541 h, R198.0m); North West to Western Cape (8544 h, R197.9m); Free State to Mpumalanga (8460 h, R196.8m); Free State to North West (8460 h, R196.8m); Free State to Gauteng (8460 h, R196.8m); Free State to Kwazulu Natal (8460 h, R196.8m) |
| 2040, 2025 | 0.85 x today | +100.8 | +83.0 | +17.8 | +5191.3 | +63.0 | +27.4 | +3.21 | -7.9 | +121.9 | North West to Northern Cape (8682 h, R257.0m); North West to Western Cape (8683 h, R256.9m); Free State to Mpumalanga (8650 h, R256.2m); Free State to North West (8650 h, R256.2m); Free State to Gauteng (8650 h, R256.2m); Free State to Kwazulu Natal (8650 h, R256.2m) |
| 2040, 2025 | N-1 (0.7 x today) | +110.0 | +88.2 | +21.7 | +8388.7 | +63.0 | +32.0 | +4.43 | -8.9 | +139.1 | North West to Northern Cape (8759 h, R308.6m); North West to Western Cape (8759 h, R308.5m); Free State to Kwazulu Natal (8759 h, R308.0m); Free State to Mpumalanga (8759 h, R308.0m); Free State to North West (8759 h, R308.0m); Free State to Gauteng (8759 h, R308.0m) |
| 2040, 2025 | N-1, one circuit dropped | +105.8 | +85.3 | +20.5 | +6906.2 | +63.0 | +30.0 | +3.83 | -8.6 | +131.2 | North West to Northern Cape (8701 h, R291.3m); North West to Western Cape (8659 h, R290.0m); Eastern Cape to Kwazulu Natal (7932 h, R265.6m); Free State to Mpumalanga (7124 h, R136.8m); Free State to North West (7124 h, R136.8m); Free State to Gauteng (7124 h, R136.8m) |
| 2040, 2025 | N-1 with TDP lines by year | +71.4 | +62.9 | +8.5 | +201.0 | +57.3 | +11.7 | +0.75 | -5.3 | +69.4 | North West to Northern Cape (7583 h, R48.5m); North West to Western Cape (7579 h, R48.4m); Eastern Cape to Kwazulu Natal (7566 h, R48.2m); Free State to Northern Cape (7572 h, R48.1m); Free State to Hydra Central (7561 h, R47.9m); Eastern Cape to Free State (7544 h, R47.8m) |
| 2040, 2025 | one circuit dropped, with TDP lines by year | +70.2 | +62.2 | +8.0 | +148.2 | +56.8 | +11.1 | +0.69 | -5.5 | +67.5 | North West to Northern Cape (7535 h, R32.6m); North West to Western Cape (7522 h, R32.5m); Free State to Northern Cape (7533 h, R32.5m); Eastern Cape to Kwazulu Natal (7508 h, R32.2m); Free State to Hydra Central (7511 h, R32.2m); Eastern Cape to Free State (7502 h, R32.1m) |
| 2040, 2025 | N-1 (0.7 x today), engine commitment floor | +101.0 | +82.3 | +18.6 | +8388.7 | +53.0 | +32.0 | +4.43 | -12.1 | +132.1 | North West to Northern Cape (8759 h, R308.6m); North West to Western Cape (8759 h, R308.5m); Free State to Kwazulu Natal (8759 h, R308.0m); Free State to Mpumalanga (8759 h, R308.0m); Free State to North West (8759 h, R308.0m); Free State to Gauteng (8759 h, R308.0m) |
| 2040, 2015 | N-1 (PyPSA-RSA's table, labelled 'as drawn (N-0)' before 738) | +84.1 | +71.3 | +12.8 | +1279.4 | +53.3 | +25.5 | +2.69 | -5.0 | +107.9 | North West to Western Cape (8564 h, R171.8m); North West to Northern Cape (8559 h, R171.3m); Free State to North West (8387 h, R161.9m); Free State to Mpumalanga (8387 h, R161.9m); Free State to Gauteng (8387 h, R161.9m); Free State to Kwazulu Natal (8387 h, R161.9m) |
| 2040, 2015 | N-1 (0.7 x today) | +102.1 | +81.4 | +20.7 | +7968.3 | +53.6 | +32.0 | +6.81 | -7.4 | +147.3 | North West to Northern Cape (8751 h, R502.0m); North West to Western Cape (8750 h, R501.8m); Free State to Kwazulu Natal (8645 h, R491.0m); Free State to Mpumalanga (8645 h, R490.9m); Free State to North West (8645 h, R490.9m); Free State to Gauteng (8645 h, R490.9m) |
| 2040, 2015 | N-1, one circuit dropped | +98.1 | +78.7 | +19.4 | +5660.7 | +53.6 | +31.1 | +6.19 | -6.5 | +141.5 | North West to Northern Cape (8743 h, R353.7m); North West to Western Cape (8722 h, R352.4m); Eastern Cape to Kwazulu Natal (8063 h, R319.0m); Free State to Kwazulu Natal (7742 h, R230.2m); Free State to Mpumalanga (7742 h, R230.2m); Free State to North West (7742 h, R230.2m) |
| 2040, 2015 | N-1 with TDP lines by year | +63.9 | +56.6 | +7.3 | +0.0 | +50.2 | +12.1 | +0.31 | -4.6 | +62.5 | Eastern Cape to Kwazulu Natal (7285 h, R14.9m); North West to Northern Cape (7298 h, R14.9m); North West to Western Cape (7293 h, R14.9m); Free State to Northern Cape (7210 h, R14.6m); Free State to Hydra Central (7204 h, R14.6m); Eastern Cape to Free State (7195 h, R14.6m) |
| 2040, 2015 | one circuit dropped, with TDP lines by year | +62.8 | +55.9 | +6.9 | +0.0 | +49.9 | +11.3 | +0.22 | -4.6 | +60.2 | North West to Northern Cape (7222 h, R14.2m); Free State to Northern Cape (7219 h, R14.1m); North West to Western Cape (7200 h, R14.1m); Eastern Cape to Kwazulu Natal (7196 h, R14.1m); Free State to Hydra Central (7194 h, R14.0m); Eastern Cape to Free State (7192 h, R14.0m) |

Siting shares of new wind and solar by supply area (approved REEA records through their nearest substation): wind Western Cape 36%, Hydra Central 23%, Northern Cape 21%, Eastern Cape 12%, Mpumalanga 5%, Kwazulu Natal 1%, North West 1%; solar Northern Cape 25%, North West 18%, Free State 15%, Hydra Central 13%, Limpopo 11%, Western Cape 11%, Mpumalanga 3%, Gauteng 2%, Eastern Cape 1%, Kwazulu Natal 1%.
Curtailment by area, 2035, weather year 2025, N-1: Hydra Central 28.4, Northern Cape 18.8, Western Cape 12.2, Eastern Cape 11.4, Free State 0.3 TWh; with TDP lines: Eastern Cape 14.2, Hydra Central 13.8, Northern Cape 10.2, Western Cape 0.8 TWh.
Curtailment by area, 2040, weather year 2025, N-1: Hydra Central 44.4, Northern Cape 33.7, Western Cape 26.0, Eastern Cape 17.8, Free State 1.2 TWh; with TDP lines: Hydra Central 30.8, Northern Cape 25.1, Eastern Cape 22.2, Western Cape 6.4 TWh.

Reading, against the stand-in. The every-change pass moves every number a little and no conclusion: as drawn the 2035
effect is +52 TWh of curtailment (stand-in +45), at 0.7 +68 (+65), at one circuit dropped +65; with the file's 20 TDP
lines +36 (+31); 2040 at 0.7 +110 (+98) with 8.4 TWh unserved (stand-in 0.1), and with the TDP lines +71. The 2040 unserved
energy is new: the pass's 2040 state carries less lithium and more open-cycle gas than the stand-in, and the gas sits in
KwaZulu-Natal behind the binding exits. The same corridors bind (the Free State hub's exits, North West to the Northern
and Western Cape, Eastern Cape to KwaZulu-Natal) at R50 to 70m per MW-year in 2035 and R140 to 310m in 2040. Losses and
fleet siting move the energies as before (losses under 1 TWh; fleet siting +7 TWh). The commitment floor cuts the 0.7
difference from +68 to +58 TWh in 2035 and from +110 to +101 in 2040. Caveats as in 717 (c).

Scripts and outputs: docs/regional-audit/ (pypsa_net.py, run_net.sh, queue_final.sh to queue5.sh, summ718.py, summ722.py,
net_tables.py, tdp_full.py, the TDP mapping files, corridor_circuit_counts.json); every case's JSON in
docs/regional-audit/results/718/; the engine dumps stay in the scratchpad (hourly series derived from profiles.json).

## Message 722: the three builds through the network test, the ten-area LP's time, and one soft link (6 Nov 2026; nothing here is to be quoted)

Builds as labelled in each part. Every case's JSON is in docs/regional-audit/results/718/ with the 718 cases (the prefixes
net_final_, net_ff_, net_deep_); scripts in docs/regional-audit/.

### 722 (a): the three builds through the network test

Builds. Least-cost: the every-change pass (harness/pathway/final/pathway_every_change_05f.json on claude/c7-runs, build
2026-11-05f). Fossil-free: the committed s_ff2040_c7 run (build 2026-11-03a) as a labelled stand-in. Deep decarbonisation:
the committed s_deep40nogas_c7 run (build 2026-11-03a) as a labelled stand-in. Both stand-ins rerun on their finals when
given: the chain is the patched pathcheck at that build (pathcheck_dump.js in the worktree's harness, DUMP_WY, DUMP_K,
DUMP_PAGE, DUMP_OUT), then queue5.sh's lists with the new prefix. Weather years 2025 and 2015, seed k = 0, the method of
717 (c) with the additions of 718 and the three builds' extra plant (below).

Least-cost (every-change pass, build 2026-11-05f)
| year, weather year | corridors | coal | gas | diesel | wind (offshore) | solar | lithium | flow, iron-air | pumped | curtailed (wind, solar, offshore) | unserved | corridors built MW, R bn a year | corridors with a shadow price over 4,000 h |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2035, 2025 | no limits | 62.9 | 0.0 | 0.19 | 111.5 (0.0) | 51.4 | 8.0 | 0.0, 0.0 | 2.4 | 3.1 (2.2, 0.9, 0.0) | 0 | - | none over 4,000 h |
| 2035, 2025 | N-1 (PyPSA-RSA's table, labelled 'as drawn' before 738) | 114.2 | 0.0 | 0.38 | 66.3 (0.0) | 45.0 | 7.9 | 0.0, 0.0 | 1.9 | 54.7 (47.3, 7.4, 0.0) | 2 | - | North West to Northern Cape (7464 h, R6.8m); North West to Western Cape (7460 h, R6.8m); Eastern Cape to Kwazulu Natal (6848 h, R5.9m); Free State to Mpumalanga (6862 h, R5.9m); Free State to North West (6862 h, R5.9m) |
| 2035, 2025 | 0.7 | 128.9 | 0.0 | 1.49 | 56.1 (0.0) | 38.9 | 8.5 | 0.0, 0.0 | 2.4 | 71.0 (57.6, 13.4, 0.0) | 705 | - | Free State to Kwazulu Natal (8209 h, R69.6m); Eastern Cape to Kwazulu Natal (7474 h, R68.4m); North West to Northern Cape (8330 h, R63.6m); North West to Western Cape (8327 h, R63.5m); Free State to Mpumalanga (7732 h, R52.1m) |
| 2035, 2025 | 0.7 (extendable at R10,000/MW-km) | 63.5 | 0.0 | 0.19 | 110.3 (0.0) | 51.9 | 7.8 | 0.0, 0.0 | 2.1 | 3.8 (3.3, 0.4, 0.0) | 0 | 28,072, 4.67 | none over 4,000 h |
| 2035, 2025 | 0.7 (extendable at R21,700/MW-km) | 64.7 | 0.0 | 0.19 | 108.9 (0.0) | 52.1 | 7.7 | 0.0, 0.0 | 1.9 | 5.1 (4.8, 0.3, 0.0) | 0 | 24,164, 8.96 | none over 4,000 h |
| 2035, 2025 | one circuit dropped | 126.5 | 0.0 | 0.85 | 58.2 (0.0) | 39.9 | 8.3 | 0.0, 0.0 | 2.0 | 67.9 (55.4, 12.4, 0.0) | 474 | - | North West to Western Cape (8036 h, R55.0m); North West to Northern Cape (8130 h, R55.0m); Eastern Cape to Kwazulu Natal (6809 h, R38.2m); Free State to Northern Cape (4680 h, R32.1m); Free State to Hydra Central (4505 h, R30.1m) |
| 2035, 2025 | one circuit dropped (extendable at R10,000/MW-km) | 63.5 | 0.0 | 0.19 | 110.3 (0.0) | 51.9 | 7.8 | 0.0, 0.0 | 2.1 | 3.8 (3.4, 0.4, 0.0) | 0 | 26,485, 4.43 | none over 4,000 h |
| 2035, 2025 | one circuit dropped (extendable at R21,700/MW-km) | 64.6 | 0.0 | 0.19 | 109.0 (0.0) | 52.0 | 7.7 | 0.0, 0.0 | 1.9 | 5.0 (4.6, 0.4, 0.0) | 0 | 23,723, 8.53 | none over 4,000 h |
| 2035, 2025 | one circuit dropped, full TDP | 78.5 | 0.0 | 0.19 | 95.0 (0.0) | 51.7 | 5.0 | 0.0, 0.0 | 1.7 | 19.3 (18.7, 0.6, 0.0) | 0 | - | none over 4,000 h |
| 2035, 2025 | one circuit dropped, full TDP (extendable at R10,000/MW-km) | 63.4 | 0.0 | 0.19 | 110.4 (0.0) | 51.9 | 7.9 | 0.0, 0.0 | 2.1 | 3.7 (3.3, 0.4, 0.0) | 0 | 11,699, 1.73 | none over 4,000 h |
| 2035, 2015 | no limits | 68.5 | 0.0 | 0.16 | 105.5 (0.0) | 51.6 | 8.4 | 0.0, 0.0 | 2.2 | 2.8 (1.9, 1.0, 0.0) | 0 | - | none over 4,000 h |
| 2035, 2015 | N-1 (PyPSA-RSA's table, labelled 'as drawn' before 738) | 114.3 | 0.0 | 0.24 | 65.3 (0.0) | 46.0 | 8.4 | 0.0, 0.0 | 2.1 | 48.6 (42.1, 6.5, 0.0) | 0 | - | North West to Western Cape (7062 h, R5.6m); North West to Northern Cape (7033 h, R5.6m); Eastern Cape to Kwazulu Natal (6436 h, R5.0m); Free State to Kwazulu Natal (6259 h, R4.6m); Free State to Mpumalanga (6255 h, R4.6m) |
| 2035, 2015 | 0.7 | 127.6 | 0.0 | 2.49 | 55.2 (0.0) | 40.3 | 9.0 | 0.0, 0.0 | 2.8 | 64.5 (52.2, 12.3, 0.0) | 561 | - | Free State to Kwazulu Natal (8157 h, R135.4m); Eastern Cape to Kwazulu Natal (7392 h, R133.8m); North West to Northern Cape (8239 h, R112.4m); North West to Western Cape (8230 h, R112.2m); Free State to Mpumalanga (7478 h, R100.9m) |
| 2035, 2015 | 0.7 (extendable at R10,000/MW-km) | 69.2 | 0.0 | 0.16 | 104.3 (0.0) | 52.1 | 8.2 | 0.0, 0.0 | 2.0 | 3.6 (3.1, 0.5, 0.0) | 0 | 27,224, 4.56 | none over 4,000 h |
| 2035, 2015 | one circuit dropped | 125.9 | 0.0 | 1.32 | 57.2 (0.0) | 41.3 | 8.9 | 0.0, 0.0 | 2.6 | 61.4 (50.1, 11.3, 0.0) | 197 | - | North West to Northern Cape (8071 h, R56.9m); North West to Western Cape (7931 h, R56.3m); Eastern Cape to Kwazulu Natal (6611 h, R46.8m); Free State to Northern Cape (4418 h, R32.3m); Free State to Hydra Central (4204 h, R31.5m) |
| 2035, 2015 | one circuit dropped (extendable at R10,000/MW-km) | 69.2 | 0.0 | 0.16 | 104.2 (0.0) | 52.1 | 8.2 | 0.0, 0.0 | 2.0 | 3.6 (3.1, 0.5, 0.0) | 0 | 25,874, 4.33 | none over 4,000 h |
| 2035, 2015 | one circuit dropped, full TDP | 81.8 | 0.0 | 0.16 | 91.4 (0.0) | 51.9 | 6.0 | 0.0, 0.0 | 1.6 | 16.6 (16.0, 0.6, 0.0) | 0 | - | none over 4,000 h |
| 2040, 2025 | no limits | 36.9 | 1.8 | 0.33 | 153.2 (0.0) | 66.5 | 16.7 | 0.0, 0.2 | 6.5 | 13.1 (9.5, 3.6, 0.0) | 2 | - | none over 4,000 h |
| 2040, 2025 | N-1 (PyPSA-RSA's table, labelled 'as drawn' before 738) | 99.8 | 23.7 | 3.02 | 75.2 (0.0) | 52.6 | 14.0 | 0.0, 0.1 | 2.8 | 105.0 (87.5, 17.6, 0.0) | 2634 | - | North West to Northern Cape (8541 h, R198.0m); North West to Western Cape (8544 h, R197.9m); Free State to Mpumalanga (8460 h, R196.8m); Free State to North West (8460 h, R196.8m); Free State to Gauteng (8460 h, R196.8m) |
| 2040, 2025 | 0.7 | 99.9 | 33.7 | 4.75 | 64.9 (0.0) | 44.8 | 11.8 | 0.0, 0.1 | 2.5 | 123.1 (97.8, 25.3, 0.0) | 8391 | - | North West to Northern Cape (8759 h, R308.6m); North West to Western Cape (8759 h, R308.5m); Free State to Kwazulu Natal (8759 h, R308.0m); Free State to Mpumalanga (8759 h, R308.0m); Free State to North West (8759 h, R308.0m) |
| 2040, 2025 | 0.7 (extendable at R10,000/MW-km) | 37.6 | 1.8 | 0.33 | 150.4 (0.0) | 68.3 | 16.3 | 0.0, 0.2 | 6.1 | 14.1 (12.3, 1.8, 0.0) | 2 | 38,431, 6.25 | none over 4,000 h |
| 2040, 2025 | 0.7 (extendable at R21,700/MW-km) | 38.8 | 1.8 | 0.33 | 148.6 (0.0) | 68.9 | 16.3 | 0.0, 0.2 | 5.8 | 15.4 (14.1, 1.3, 0.0) | 2 | 34,596, 12.38 | none over 4,000 h |
| 2040, 2025 | one circuit dropped | 99.9 | 31.7 | 4.16 | 67.8 (0.0) | 46.1 | 12.3 | 0.0, 0.1 | 2.4 | 119.0 (94.9, 24.1, 0.0) | 6908 | - | North West to Northern Cape (8701 h, R291.3m); North West to Western Cape (8659 h, R290.0m); Eastern Cape to Kwazulu Natal (7932 h, R265.6m) |
| 2040, 2025 | one circuit dropped (extendable at R10,000/MW-km) | 37.6 | 1.8 | 0.33 | 150.4 (0.0) | 68.3 | 16.3 | 0.0, 0.2 | 6.2 | 14.1 (12.3, 1.8, 0.0) | 2 | 35,678, 5.99 | none over 4,000 h |
| 2040, 2025 | one circuit dropped (extendable at R21,700/MW-km) | 38.7 | 1.8 | 0.33 | 148.6 (0.0) | 68.9 | 16.3 | 0.0, 0.2 | 5.8 | 15.4 (14.1, 1.2, 0.0) | 2 | 32,064, 11.82 | none over 4,000 h |
| 2040, 2025 | one circuit dropped, full TDP | 76.3 | 3.4 | 0.33 | 111.8 (0.0) | 65.1 | 12.8 | 0.0, 0.2 | 3.3 | 55.9 (50.9, 5.0, 0.0) | 2 | - | North West to Western Cape (6252 h, R6.2m); North West to Northern Cape (6240 h, R6.2m); Free State to Hydra Central (6221 h, R6.1m); Free State to Northern Cape (6224 h, R6.1m); Eastern Cape to Kwazulu Natal (4766 h, R4.8m) |
| 2040, 2025 | one circuit dropped, full TDP (extendable at R10,000/MW-km) | 37.5 | 1.8 | 0.33 | 150.6 (0.0) | 68.2 | 16.5 | 0.0, 0.2 | 5.9 | 14.0 (12.1, 1.9, 0.0) | 2 | 20,095, 3.07 | none over 4,000 h |
| 2040, 2015 | no limits | 41.7 | 3.6 | 0.44 | 145.7 (0.0) | 67.0 | 17.1 | 0.0, 0.2 | 6.5 | 11.5 (8.1, 3.4, 0.0) | 0 | - | none over 4,000 h |
| 2040, 2015 | N-1 (PyPSA-RSA's table, labelled 'as drawn' before 738) | 95.1 | 29.1 | 3.13 | 74.4 (0.0) | 54.2 | 14.6 | 0.0, 0.2 | 4.0 | 95.5 (79.3, 16.2, 0.0) | 1279 | - | North West to Western Cape (8564 h, R171.8m); North West to Northern Cape (8559 h, R171.3m); Free State to North West (8387 h, R161.9m); Free State to Mpumalanga (8387 h, R161.9m); Free State to Gauteng (8387 h, R161.9m) |
| 2040, 2015 | 0.7 | 95.4 | 35.5 | 7.25 | 64.3 (0.0) | 46.3 | 12.7 | 0.0, 0.1 | 3.6 | 113.6 (89.4, 24.1, 0.0) | 7968 | - | North West to Northern Cape (8751 h, R502.0m); North West to Western Cape (8750 h, R501.8m); Free State to Kwazulu Natal (8645 h, R491.0m); Free State to Mpumalanga (8645 h, R490.9m); Free State to North West (8645 h, R490.9m) |
| 2040, 2015 | one circuit dropped | 95.4 | 34.6 | 6.63 | 66.9 (0.0) | 47.6 | 13.4 | 0.0, 0.1 | 3.7 | 109.5 (86.8, 22.8, 0.0) | 5661 | - | North West to Northern Cape (8743 h, R353.7m); North West to Western Cape (8722 h, R352.4m); Eastern Cape to Kwazulu Natal (8063 h, R319.0m); Free State to Kwazulu Natal (7742 h, R230.2m); Free State to Mpumalanga (7742 h, R230.2m) |
| 2040, 2015 | one circuit dropped (extendable at R10,000/MW-km) | 42.6 | 3.6 | 0.44 | 142.9 (0.0) | 68.7 | 16.7 | 0.0, 0.2 | 6.1 | 12.6 (10.8, 1.8, 0.0) | 0 | 34,661, 5.84 | none over 4,000 h |
| 2040, 2015 | one circuit dropped, full TDP | 76.8 | 4.6 | 0.44 | 109.3 (0.0) | 66.0 | 14.2 | 0.0, 0.2 | 3.8 | 48.8 (44.4, 4.4, 0.0) | 0 | - | North West to Western Cape (5670 h, R5.2m); Free State to Hydra Central (5659 h, R5.2m); North West to Northern Cape (5660 h, R5.2m); Free State to Northern Cape (5651 h, R5.2m); Eastern Cape to Kwazulu Natal (4226 h, R3.8m) |
    engine 2035, 2025: coal 71.5, gas 0.0, diesel 0.52, wind incl. offshore 107.8, solar 48.2, storage 18.5, curtailed 9.8, unserved 0 GWh; LP no limits: curtailed 3.1, unserved 0
    engine 2035, 2015: coal 76.0, gas 0.0, diesel 0.84, wind incl. offshore 102.0, solar 48.7, storage 18.0, curtailed 9.0, unserved 6 GWh; LP no limits: curtailed 2.8, unserved 0
    engine 2040, 2025: coal 45.5, gas 2.8, diesel 0.63, wind incl. offshore 149.1, solar 61.4, storage 24.9, curtailed 22.1, unserved 16 GWh; LP no limits: curtailed 13.1, unserved 2
    engine 2040, 2015: coal 49.0, gas 5.0, diesel 1.31, wind incl. offshore 141.6, solar 62.1, storage 24.5, curtailed 20.2, unserved 0 GWh; LP no limits: curtailed 11.5, unserved 0
    free mix, 2035, 2025, no limits, corridors at R0: wind 22.2 GW (run 27.2), solar 13.7 (17.7), lithium 7.0 GW / 25 GWh (8.8 / 38), open cycle 0.0 (0.0); corridors 0 MW, R0.00bn a year; curtailed 5.4 TWh, unserved 0 GWh; new-build R86.7bn a year, fuel and carbon R63.9bn
    free mix, 2035, 2025, no limits, corridors at R0: wind 21.9 GW (run 27.2), solar 14.3 (17.7), lithium 7.1 GW / 25 GWh (8.8 / 38), open cycle 0.0 (0.0); corridors 0 MW, R0.00bn a year; curtailed 5.9 TWh, unserved 0 GWh; new-build R87.0bn a year, fuel and carbon R63.7bn
    free mix, 2035, 2025, no limits, corridors at R0: wind 22.2 GW (run 27.2), solar 13.7 (17.7), lithium 7.0 GW / 25 GWh (8.8 / 38), open cycle 0.0 (0.0); corridors 0 MW, R0.00bn a year; curtailed 5.3 TWh, unserved 0 GWh; new-build R86.7bn a year, fuel and carbon R63.9bn
    free mix, 2035, 2025, no limits, corridors at R0: wind 21.8 GW (run 27.2), solar 14.2 (17.7), lithium 3.7 GW / 22 GWh (8.8 / 38), open cycle 0.0 (0.0); corridors 0 MW, R0.00bn a year; curtailed 4.8 TWh, unserved 2 GWh; new-build R84.6bn a year, fuel and carbon R63.2bn
    free mix, 2035, 2025, no limits, corridors at R0: wind 24.7 GW (run 27.2), solar 9.7 (17.7), lithium 5.0 GW / 16 GWh (8.8 / 38), open cycle 0.0 (0.0); corridors 0 MW, R0.00bn a year; curtailed 4.6 TWh, unserved 4 GWh; new-build R83.6bn a year, fuel and carbon R65.0bn
    free mix, 2035, 2025, no limits, corridors at R0: wind 25.1 GW (run 27.2), solar 12.6 (17.7), lithium 6.7 GW / 26 GWh (8.8 / 38), open cycle 0.0 (0.0); corridors 0 MW, R0.00bn a year; curtailed 3.7 TWh, unserved 5 GWh; new-build R92.5bn a year, fuel and carbon R63.0bn
    free mix, 2035, 2025, no limits, corridors at R0: wind 27.2 GW (run 27.2), solar 9.6 (17.7), lithium 5.9 GW / 20 GWh (8.8 / 38), open cycle 0.0 (0.0); corridors 0 MW, R0.00bn a year; curtailed 9.3 TWh, unserved 3 GWh; new-build R91.2bn a year, fuel and carbon R61.0bn
    free mix, 2035, 2025, one circuit dropped, corridors at R10,000: wind 22.5 GW (run 27.2), solar 15.6 (17.7), lithium 6.6 GW / 23 GWh (8.8 / 38), open cycle 0.0 (0.0); corridors 14,361 MW, R2.35bn a year; curtailed 7.4 TWh, unserved 1 GWh; new-build R78.5bn a year, fuel and carbon R61.8bn
    free mix, 2035, 2025, one circuit dropped, corridors at R0: wind 12.4 GW (run 27.2), solar 23.1 (17.7), lithium 7.8 GW / 44 GWh (8.8 / 38), open cycle 0.7 (0.0); corridors 0 MW, R0.00bn a year; curtailed 4.1 TWh, unserved 3 GWh; new-build R84.5bn a year, fuel and carbon R79.1bn
    free mix, 2035, 2025, one circuit dropped, full TDP, full TDP, corridors at R10,000: wind 22.7 GW (run 27.2), solar 15.7 (17.7), lithium 6.9 GW / 24 GWh (8.8 / 38), open cycle 0.0 (0.0); corridors 5,915 MW, R0.85bn a year; curtailed 8.3 TWh, unserved 0 GWh; new-build R77.6bn a year, fuel and carbon R60.8bn
    free mix, 2035, 2025, one circuit dropped, full TDP, full TDP, corridors at R0: wind 19.9 GW (run 27.2), solar 15.7 (17.7), lithium 6.9 GW / 28 GWh (8.8 / 38), open cycle 0.0 (0.0); corridors 0 MW, R0.00bn a year; curtailed 5.1 TWh, unserved 1 GWh; new-build R85.0bn a year, fuel and carbon R68.3bn
    free mix, 2035, 2015, no limits, corridors at R0: wind 22.7 GW (run 27.2), solar 12.8 (17.7), lithium 6.6 GW / 27 GWh (8.8 / 38), open cycle 0.0 (0.0); corridors 0 MW, R0.00bn a year; curtailed 3.7 TWh, unserved 3 GWh; new-build R87.1bn a year, fuel and carbon R66.9bn
    free mix, 2035, 2015, no limits, corridors at R0: wind 24.8 GW (run 27.2), solar 10.1 (17.7), lithium 4.5 GW / 20 GWh (8.8 / 38), open cycle 0.0 (0.0); corridors 0 MW, R0.00bn a year; curtailed 3.3 TWh, unserved 9 GWh; new-build R85.4bn a year, fuel and carbon R66.3bn
    free mix, 2035, 2015, one circuit dropped, corridors at R10,000: wind 21.9 GW (run 27.2), solar 16.6 (17.7), lithium 6.2 GW / 27 GWh (8.8 / 38), open cycle 0.0 (0.0); corridors 12,932 MW, R2.16bn a year; curtailed 6.0 TWh, unserved 4 GWh; new-build R79.0bn a year, fuel and carbon R64.4bn
    free mix, 2040, 2025, no limits, corridors at R0: wind 29.1 GW (run 40.7), solar 31.9 (24.8), lithium 13.2 GW / 87 GWh (11.0 / 61), open cycle 1.1 (4.3); corridors 0 MW, R0.00bn a year; curtailed 10.5 TWh, unserved 3 GWh; new-build R139.0bn a year, fuel and carbon R42.5bn
    free mix, 2040, 2025, one circuit dropped, corridors at R10,000: wind 26.9 GW (run 40.7), solar 40.3 (24.8), lithium 14.4 GW / 98 GWh (11.0 / 61), open cycle 0.0 (4.3); corridors 20,088 MW, R3.35bn a year; curtailed 13.6 TWh, unserved 3 GWh; new-build R123.9bn a year, fuel and carbon R38.7bn
    free mix, 2040, 2025, one circuit dropped, corridors at R0: wind 16.4 GW (run 40.7), solar 52.1 (24.8), lithium 18.5 GW / 115 GWh (11.0 / 61), open cycle 1.9 (4.3); corridors 0 MW, R0.00bn a year; curtailed 16.1 TWh, unserved 0 GWh; new-build R149.4bn a year, fuel and carbon R59.7bn
    free mix, 2040, 2025, one circuit dropped, full TDP, full TDP, corridors at R10,000: wind 27.4 GW (run 40.7), solar 39.1 (24.8), lithium 14.4 GW / 96 GWh (11.0 / 61), open cycle 0.0 (4.3); corridors 9,209 MW, R1.41bn a year; curtailed 14.4 TWh, unserved 6 GWh; new-build R121.3bn a year, fuel and carbon R38.8bn
    free mix, 2040, 2015, no limits, corridors at R0: wind 31.5 GW (run 40.7), solar 33.5 (24.8), lithium 11.1 GW / 68 GWh (11.0 / 61), open cycle 1.8 (4.3); corridors 0 MW, R0.00bn a year; curtailed 14.4 TWh, unserved 0 GWh; new-build R144.1bn a year, fuel and carbon R49.0bn
    free mix, 2040, 2015, one circuit dropped, corridors at R10,000: wind 28.9 GW (run 40.7), solar 43.7 (24.8), lithium 14.1 GW / 86 GWh (11.0 / 61), open cycle 0.4 (4.3); corridors 17,906 MW, R2.95bn a year; curtailed 22.4 TWh, unserved 0 GWh; new-build R129.5bn a year, fuel and carbon R42.4bn

Fossil-free stand-in (s_ff2040_c7, build 2026-11-03a)
| year, weather year | corridors | coal | gas | diesel | wind (offshore) | solar | lithium | flow, iron-air | pumped | curtailed (wind, solar, offshore) | unserved | corridors built MW, R bn a year | corridors with a shadow price over 4,000 h |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2035, 2025 | no limits | 0.7 | 0.0 | 0.00 | 127.7 (0.0) | 112.0 | 41.9 | 2.5, 0.0 | 4.6 | 66.3 (30.5, 35.9, 0.0) | 0 | - | none over 4,000 h |
| 2035, 2025 | N-1 (PyPSA-RSA's table, labelled 'as drawn' before 738) | 76.4 | 0.0 | 0.00 | 64.6 (0.0) | 86.3 | 11.5 | 1.2, 0.0 | 1.2 | 155.1 (93.6, 61.5, 0.0) | 0 | - | North West to Northern Cape (8760 h, R6.0m); North West to Western Cape (8760 h, R6.0m); Free State to Kwazulu Natal (8760 h, R6.0m); Free State to Mpumalanga (8760 h, R6.0m); Free State to North West (8760 h, R6.0m) |
| 2035, 2025 | one circuit dropped | 89.9 | 0.0 | 0.00 | 56.4 (0.0) | 80.7 | 9.6 | 1.1, 0.0 | 0.9 | 169.0 (101.8, 67.2, 0.0) | 0 | - | Free State to Kwazulu Natal (8760 h, R6.1m); North West to Northern Cape (8760 h, R6.1m); North West to Western Cape (8760 h, R6.1m); Free State to Mpumalanga (8760 h, R6.1m); Free State to North West (8760 h, R6.1m) |
| 2035, 2025 | one circuit dropped (extendable at R10,000/MW-km) | 1.2 | 0.0 | 0.00 | 109.4 (0.0) | 125.3 | 44.8 | 2.0, 0.0 | 2.4 | 71.4 (48.8, 22.5, 0.0) | 0 | 22,645, 3.57 | none over 4,000 h |
| 2035, 2025 | one circuit dropped, full TDP | 13.6 | 0.0 | 0.00 | 99.7 (0.0) | 118.2 | 41.8 | 1.3, 0.0 | 1.6 | 88.1 (58.5, 29.6, 0.0) | 0 | - | North West to Northern Cape (7137 h, R4.6m); North West to Western Cape (6837 h, R4.4m); Eastern Cape to Kwazulu Natal (5222 h, R3.4m); Free State to Northern Cape (4961 h, R3.2m); Free State to Hydra Central (4573 h, R3.0m) |
| 2035, 2015 | no limits | 2.7 | 0.0 | 0.00 | 122.1 (0.0) | 113.8 | 45.5 | 2.4, 0.0 | 4.6 | 58.0 (26.0, 32.1, 0.0) | 0 | - | none over 4,000 h |
| 2035, 2015 | N-1 (PyPSA-RSA's table, labelled 'as drawn' before 738) | 76.6 | 0.0 | 0.00 | 63.9 (0.0) | 86.8 | 12.5 | 1.3, 0.0 | 1.3 | 143.3 (84.2, 59.1, 0.0) | 0 | - | North West to Northern Cape (8760 h, R6.0m); North West to Western Cape (8760 h, R6.0m); Free State to Mpumalanga (8760 h, R6.0m); Free State to North West (8760 h, R6.0m); Free State to Gauteng (8760 h, R6.0m) |
| 2035, 2015 | one circuit dropped | 90.2 | 0.0 | 0.00 | 56.2 (0.0) | 80.5 | 10.3 | 1.1, 0.0 | 1.1 | 157.3 (92.0, 65.3, 0.0) | 0 | - | Free State to Kwazulu Natal (8760 h, R6.2m); North West to Northern Cape (8760 h, R6.2m); North West to Western Cape (8760 h, R6.2m); Free State to Mpumalanga (8760 h, R6.2m); Free State to North West (8760 h, R6.2m) |
| 2035, 2015 | one circuit dropped (extendable at R10,000/MW-km) | 3.7 | 0.0 | 0.00 | 107.2 (0.0) | 126.2 | 45.2 | 2.1, 0.0 | 2.9 | 60.6 (41.0, 19.6, 0.0) | 0 | 24,595, 3.95 | none over 4,000 h |
| 2035, 2015 | one circuit dropped, full TDP | 15.5 | 0.0 | 0.00 | 95.9 (0.0) | 120.1 | 42.9 | 1.5, 0.0 | 1.5 | 78.0 (52.2, 25.7, 0.0) | 0 | - | North West to Northern Cape (5893 h, R3.8m); North West to Western Cape (5695 h, R3.7m); Eastern Cape to Kwazulu Natal (4146 h, R2.7m) |
| 2040, 2025 | no limits | 0.0 | 0.0 | 0.00 | 151.8 (14.6) | 133.9 | 37.0 | 1.6, 0.9 | 3.6 | 207.8 (70.7, 129.2, 7.9) | 0 | - | none over 4,000 h |
| 2040, 2025 | N-1 (PyPSA-RSA's table, labelled 'as drawn' before 738) | 0.0 | 0.0 | 0.00 | 70.0 (10.1) | 121.7 | 30.9 | 1.3, 0.0 | 0.7 | 306.3 (152.5, 141.4, 12.4) | 57578 | - | Free State to Mpumalanga (8760 h, R729.9m); Free State to Kwazulu Natal (8760 h, R729.9m); Free State to Gauteng (8760 h, R729.9m); North West to Northern Cape (8760 h, R729.8m); North West to Western Cape (8760 h, R729.8m) |
| 2040, 2025 | 0.7 | 0.0 | 0.0 | 0.00 | 61.0 (9.1) | 113.3 | 24.5 | 1.1, 0.0 | 0.5 | 324.7 (161.5, 149.8, 13.3) | 74943 | - | Free State to Kwazulu Natal (8760 h, R739.6m); Free State to Mpumalanga (8760 h, R734.5m); Free State to Gauteng (8760 h, R734.5m); North West to Northern Cape (8760 h, R732.1m); North West to Western Cape (8760 h, R732.1m) |
| 2040, 2025 | one circuit dropped | 0.0 | 0.0 | 0.00 | 62.0 (9.0) | 117.1 | 26.9 | 1.2, 0.0 | 0.5 | 320.0 (160.5, 146.1, 13.4) | 70633 | - | Free State to Kwazulu Natal (8760 h, R732.3m); Free State to Mpumalanga (8760 h, R732.3m); Free State to Gauteng (8760 h, R732.3m); North West to Northern Cape (8760 h, R732.1m); North West to Western Cape (8760 h, R732.1m) |
| 2040, 2025 | one circuit dropped (extendable at R10,000/MW-km) | 0.0 | 0.0 | 0.00 | 76.9 (21.1) | 171.9 | 65.4 | 3.5, 1.5 | 0.8 | 238.3 (145.6, 91.3, 1.4) | 0 | 19,739, 2.53 | none over 4,000 h |
| 2040, 2025 | one circuit dropped, full TDP | 0.0 | 0.0 | 0.00 | 95.7 (15.8) | 150.2 | 51.4 | 2.8, 1.2 | 3.2 | 246.5 (126.8, 112.9, 6.7) | 4170 | - | none over 4,000 h |
| 2040, 2015 | no limits | 0.0 | 0.0 | 0.00 | 144.4 (15.0) | 139.6 | 42.5 | 2.2, 1.7 | 4.2 | 191.2 (63.9, 120.0, 7.3) | 0 | - | none over 4,000 h |
| 2040, 2015 | N-1 (PyPSA-RSA's table, labelled 'as drawn' before 738) | 0.0 | 0.0 | 0.00 | 69.1 (10.9) | 121.1 | 30.4 | 1.3, 0.0 | 0.9 | 289.2 (139.3, 138.5, 11.4) | 58110 | - | Free State to Mpumalanga (8760 h, R729.6m); Free State to Gauteng (8760 h, R729.6m); Free State to Kwazulu Natal (8760 h, R729.6m); North West to Northern Cape (8760 h, R729.5m); North West to Western Cape (8760 h, R729.5m) |
| 2040, 2015 | one circuit dropped | 0.0 | 0.0 | 0.00 | 61.4 (9.7) | 116.2 | 26.3 | 1.3, 0.0 | 0.6 | 302.9 (147.0, 143.4, 12.5) | 71194 | - | Free State to Kwazulu Natal (8760 h, R733.1m); Free State to Mpumalanga (8760 h, R733.0m); Free State to Gauteng (8760 h, R733.0m); North West to Northern Cape (8760 h, R732.3m); North West to Western Cape (8760 h, R732.3m) |
| 2040, 2015 | one circuit dropped (extendable at R10,000/MW-km) | 0.0 | 0.0 | 0.00 | 77.4 (20.7) | 175.5 | 68.0 | 3.6, 2.1 | 0.9 | 216.5 (130.9, 84.0, 1.5) | 0 | 19,971, 2.63 | none over 4,000 h |
| 2040, 2015 | one circuit dropped, full TDP | 0.0 | 0.0 | 0.00 | 93.1 (16.2) | 152.3 | 52.6 | 2.9, 1.0 | 3.7 | 228.5 (115.3, 107.3, 6.0) | 4790 | - | Free State to Mpumalanga (4141 h, R317.9m); Free State to Gauteng (4141 h, R317.9m); Free State to Kwazulu Natal (4141 h, R317.9m); North West to Northern Cape (4141 h, R317.7m); North West to Western Cape (4141 h, R317.7m) |
    engine 2035, 2025: coal 15.1, gas 0.0, diesel 0.00, wind incl. offshore 120.2, solar 96.1, storage 36.4, curtailed 87.6, unserved 0 GWh; LP no limits: curtailed 66.3, unserved 0
    engine 2035, 2015: coal 18.7, gas 0.0, diesel 0.00, wind incl. offshore 114.9, solar 98.1, storage 40.3, curtailed 77.2, unserved 0 GWh; LP no limits: curtailed 58.0, unserved 0
    engine 2040, 2025: coal 0.0, gas 0.0, diesel 0.00, wind incl. offshore 153.5, solar 107.0, storage 30.0, curtailed 244.6, unserved 0 GWh; LP no limits: curtailed 207.8, unserved 0
    engine 2040, 2015: coal 0.0, gas 0.0, diesel 0.00, wind incl. offshore 148.3, solar 112.8, storage 36.2, curtailed 223.0, unserved 0 GWh; LP no limits: curtailed 191.2, unserved 0
    free mix, 2035, 2025, one circuit dropped, corridors at R10,000: wind 16.8 GW (run 39.0), solar 26.3 (55.3), lithium 0.0 GW / 0 GWh (36.0 / 320), open cycle 0.0 (0.0); corridors 15,417 MW, R2.07bn a year; curtailed 4.7 TWh, unserved 0 GWh; new-build R70.6bn a year, fuel and carbon R54.2bn
    free mix, 2040, 2025, one circuit dropped, corridors at R10,000: wind 23.6 GW (run 56.5), solar 68.0 (100.5), lithium 10.3 GW / 108 GWh (56.0 / 480), open cycle 1.8 (0.0); corridors 23,884 MW, R3.34bn a year; curtailed 36.3 TWh, unserved 5 GWh; new-build R153.8bn a year, fuel and carbon R3.2bn

Deep decarbonisation stand-in (s_deep40nogas_c7, build 2026-11-03a)
| year, weather year | corridors | coal | gas | diesel | wind (offshore) | solar | lithium | flow, iron-air | pumped | curtailed (wind, solar, offshore) | unserved | corridors built MW, R bn a year | corridors with a shadow price over 4,000 h |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2035, 2025 | no limits | 18.8 | 0.0 | 0.00 | 131.0 (3.7) | 77.3 | 17.0 | 0.0, 0.0 | 7.7 | 59.2 (27.2, 31.2, 0.8) | 0 | - | none over 4,000 h |
| 2035, 2025 | N-1 (PyPSA-RSA's table, labelled 'as drawn' before 738) | 89.5 | 0.0 | 0.01 | 65.3 (3.0) | 68.6 | 9.0 | 0.0, 0.0 | 1.3 | 134.2 (92.9, 39.8, 1.5) | 0 | - | North West to Northern Cape (8360 h, R5.9m); North West to Western Cape (8362 h, R5.9m); Free State to Mpumalanga (8263 h, R5.8m); Free State to North West (8263 h, R5.8m); Free State to Gauteng (8263 h, R5.8m) |
| 2035, 2025 | one circuit dropped | 102.9 | 0.0 | 0.23 | 57.4 (2.5) | 63.6 | 9.8 | 0.0, 0.0 | 1.3 | 147.6 (100.8, 44.8, 2.0) | 2 | - | Free State to Kwazulu Natal (8309 h, R13.4m); Eastern Cape to Kwazulu Natal (7997 h, R12.8m); North West to Northern Cape (8650 h, R12.6m); North West to Western Cape (8566 h, R12.5m); Free State to Mpumalanga (8307 h, R11.9m) |
| 2035, 2025 | one circuit dropped (extendable at R10,000/MW-km) | 19.6 | 0.0 | 0.00 | 115.9 (4.0) | 90.9 | 17.2 | 0.0, 0.0 | 7.5 | 60.2 (42.3, 17.5, 0.5) | 0 | 26,625, 4.47 | none over 4,000 h |
| 2035, 2025 | one circuit dropped, full TDP | 38.5 | 0.0 | 0.00 | 98.2 (4.0) | 87.6 | 15.1 | 0.0, 0.0 | 4.2 | 81.4 (60.0, 20.9, 0.5) | 0 | - | North West to Western Cape (5459 h, R3.6m); North West to Northern Cape (5458 h, R3.6m); Eastern Cape to Kwazulu Natal (4314 h, R2.8m); Free State to Northern Cape (4153 h, R2.8m); Free State to Hydra Central (4142 h, R2.8m) |
| 2035, 2015 | no limits | 25.7 | 0.0 | 0.01 | 123.4 (3.7) | 77.4 | 17.0 | 0.0, 0.0 | 7.2 | 55.1 (24.8, 29.6, 0.7) | 0 | - | none over 4,000 h |
| 2035, 2015 | N-1 (PyPSA-RSA's table, labelled 'as drawn' before 738) | 89.9 | 0.0 | 0.01 | 64.7 (3.1) | 68.6 | 9.9 | 0.0, 0.0 | 1.4 | 123.1 (83.4, 38.4, 1.4) | 0 | - | North West to Western Cape (8192 h, R5.7m); North West to Northern Cape (8176 h, R5.7m); Free State to Mpumalanga (7971 h, R5.6m); Free State to North West (7971 h, R5.6m); Free State to Gauteng (7971 h, R5.6m) |
| 2035, 2015 | one circuit dropped | 103.4 | 0.0 | 0.02 | 57.1 (2.6) | 63.3 | 10.5 | 0.0, 0.0 | 1.5 | 136.5 (91.0, 43.7, 1.8) | 0 | - | North West to Northern Cape (8575 h, R6.8m); North West to Western Cape (8489 h, R6.7m); Free State to Kwazulu Natal (8012 h, R6.4m); Eastern Cape to Kwazulu Natal (7688 h, R6.2m); Free State to Mpumalanga (8002 h, R6.1m) |
| 2035, 2015 | one circuit dropped (extendable at R10,000/MW-km) | 26.5 | 0.0 | 0.01 | 108.9 (4.0) | 90.5 | 17.1 | 0.0, 0.0 | 7.0 | 56.1 (39.2, 16.5, 0.4) | 0 | 26,128, 4.41 | none over 4,000 h |
| 2035, 2015 | one circuit dropped, full TDP | 42.5 | 0.0 | 0.01 | 93.8 (4.0) | 87.7 | 15.3 | 0.0, 0.0 | 4.2 | 74.1 (54.3, 19.3, 0.4) | 0 | - | North West to Western Cape (4912 h, R3.2m); North West to Northern Cape (4900 h, R3.1m) |
| 2040, 2025 | no limits | 7.3 | 0.0 | 0.04 | 142.7 (3.5) | 111.2 | 41.7 | 0.0, 0.0 | 6.2 | 74.9 (33.0, 41.0, 1.0) | 0 | - | none over 4,000 h |
| 2040, 2025 | N-1 (PyPSA-RSA's table, labelled 'as drawn' before 738) | 90.3 | 0.0 | 4.08 | 68.6 (2.8) | 87.2 | 25.8 | 0.0, 0.0 | 2.7 | 173.7 (107.0, 65.0, 1.7) | 5877 | - | Free State to Kwazulu Natal (8760 h, R261.1m); North West to Northern Cape (8760 h, R260.5m); North West to Western Cape (8760 h, R260.5m); Free State to Mpumalanga (8760 h, R260.5m); Free State to North West (8760 h, R260.5m) |
| 2040, 2025 | 0.7 | 95.4 | 0.0 | 8.85 | 59.8 (2.3) | 78.0 | 23.7 | 0.0, 0.0 | 2.1 | 192.3 (115.9, 74.2, 2.2) | 14018 | - | Free State to Kwazulu Natal (8760 h, R488.1m); Eastern Cape to Kwazulu Natal (8450 h, R474.8m); North West to Northern Cape (8760 h, R438.2m); North West to Western Cape (8760 h, R438.2m); Free State to Mpumalanga (8760 h, R438.2m) |
| 2040, 2025 | one circuit dropped | 96.0 | 0.0 | 6.76 | 60.6 (2.3) | 81.8 | 25.5 | 0.0, 0.0 | 2.8 | 187.6 (115.0, 70.4, 2.2) | 11292 | - | Free State to Kwazulu Natal (8760 h, R402.9m); Eastern Cape to Kwazulu Natal (8395 h, R393.2m); North West to Northern Cape (8760 h, R392.2m); North West to Western Cape (8760 h, R392.2m); Free State to Mpumalanga (8760 h, R392.2m) |
| 2040, 2025 | one circuit dropped (extendable at R10,000/MW-km) | 8.2 | 0.0 | 0.04 | 121.2 (4.1) | 130.0 | 42.4 | 0.0, 0.0 | 5.6 | 77.0 (54.4, 22.2, 0.4) | 0 | 30,162, 4.74 | none over 4,000 h |
| 2040, 2025 | one circuit dropped, full TDP | 36.6 | 0.0 | 0.07 | 102.0 (3.9) | 117.2 | 33.9 | 0.0, 0.0 | 2.4 | 109.2 (73.6, 35.0, 0.6) | 0 | - | North West to Northern Cape (7207 h, R5.0m); North West to Western Cape (7173 h, R4.9m); Eastern Cape to Kwazulu Natal (5768 h, R3.8m); Free State to Northern Cape (4067 h, R2.9m); Free State to Hydra Central (4015 h, R2.8m) |
| 2040, 2015 | no limits | 12.0 | 0.0 | 0.19 | 135.4 (3.6) | 113.0 | 43.3 | 0.0, 0.0 | 6.2 | 67.1 (29.1, 37.1, 0.9) | 0 | - | none over 4,000 h |
| 2040, 2015 | N-1 (PyPSA-RSA's table, labelled 'as drawn' before 738) | 90.0 | 0.0 | 5.79 | 67.8 (2.9) | 87.6 | 27.7 | 0.0, 0.0 | 3.6 | 160.8 (96.6, 62.6, 1.5) | 4982 | - | Free State to Kwazulu Natal (8756 h, R307.0m); North West to Northern Cape (8756 h, R306.1m); North West to Western Cape (8756 h, R306.1m); Free State to Mpumalanga (8756 h, R306.1m); Free State to North West (8756 h, R306.1m) |
| 2040, 2015 | one circuit dropped | 93.0 | 0.0 | 8.71 | 60.4 (2.4) | 81.5 | 25.8 | 0.0, 0.0 | 3.0 | 174.7 (104.0, 68.7, 2.0) | 12567 | - | Free State to Kwazulu Natal (8757 h, R547.6m); North West to Northern Cape (8757 h, R535.1m); North West to Western Cape (8757 h, R535.0m); Free State to Mpumalanga (8757 h, R534.5m); Free State to North West (8757 h, R534.5m) |
| 2040, 2015 | one circuit dropped (extendable at R10,000/MW-km) | 13.0 | 0.0 | 0.19 | 116.1 (4.0) | 130.1 | 43.0 | 0.0, 0.0 | 5.9 | 68.9 (48.4, 20.1, 0.4) | 0 | 30,874, 4.87 | none over 4,000 h |
| 2040, 2015 | one circuit dropped, full TDP | 38.9 | 0.0 | 0.23 | 97.7 (3.9) | 118.8 | 34.6 | 0.0, 0.0 | 2.5 | 98.6 (66.7, 31.3, 0.5) | 0 | - | North West to Western Cape (6689 h, R4.6m); North West to Northern Cape (6711 h, R4.5m); Eastern Cape to Kwazulu Natal (5160 h, R3.4m); Free State to Hydra Central (4014 h, R2.8m); Free State to Northern Cape (4052 h, R2.7m) |
    engine 2035, 2025: coal 33.2, gas 0.0, diesel 0.07, wind incl. offshore 125.0, solar 71.1, storage 22.3, curtailed 72.6, unserved 0 GWh; LP no limits: curtailed 59.2, unserved 0
    engine 2035, 2015: coal 41.4, gas 0.0, diesel 0.12, wind incl. offshore 117.5, solar 70.2, storage 23.4, curtailed 68.3, unserved 0 GWh; LP no limits: curtailed 55.1, unserved 0
    engine 2040, 2025: coal 20.3, gas 0.0, diesel 0.14, wind incl. offshore 139.4, solar 101.5, storage 39.4, curtailed 88.8, unserved 0 GWh; LP no limits: curtailed 74.9, unserved 0
    engine 2040, 2015: coal 25.9, gas 0.0, diesel 0.33, wind incl. offshore 132.7, solar 102.6, storage 42.8, curtailed 79.5, unserved 0 GWh; LP no limits: curtailed 67.1, unserved 0
    free mix, 2035, 2025, one circuit dropped, corridors at R10,000: wind 23.7 GW (run 39.0), solar 16.7 (39.8), lithium 3.1 GW / 19 GWh (14.3 / 49), open cycle 0.0 (0.0); corridors 16,584 MW, R2.76bn a year; curtailed 7.9 TWh, unserved 13 GWh; new-build R80.3bn a year, fuel and carbon R51.8bn
    free mix, 2040, 2025, one circuit dropped, corridors at R10,000: wind 28.0 GW (run 43.7), solar 38.2 (57.0), lithium 12.1 GW / 96 GWh (23.7 / 147), open cycle 0.0 (0.0); corridors 21,358 MW, R3.49bn a year; curtailed 17.0 TWh, unserved 0 GWh; new-build R122.8bn a year, fuel and carbon R35.6bn

Reading. Least-cost 2035: with no limits the LP curtails 3 TWh; today's corridors as drawn take that to 55 TWh and at 0.7
to 71 TWh with coal 51 to 66 TWh higher; one circuit dropped sits at 68 TWh (2040: 119 TWh with 6.9 TWh unserved); the
extendable case removes the effect for R4.3 to 4.7bn a year of corridors (26 to 28 GW added, the North West to Northern
Cape, Eastern Cape to KwaZulu-Natal and Northern Cape to Western Cape pairs first); 2040 likewise at R5.8 to 6.3bn a year
(35 to 38 GW).

Fossil-free 2035 (39 GW of new wind, 55 GW of solar, 36 GW of lithium at 8.9 h, 5 GW of flow batteries; coal 15 TWh in the
engine): the engine itself curtails 88 TWh and the LP with no limits 66 TWh. Today's corridors as drawn take that to 155 TWh
and one circuit dropped to 169 TWh, with coal rising from 1 TWh to 76 to 90 TWh, which is the whole of the standing fleet
running: the Cape and Karoo cannot export, so Mpumalanga and Limpopo run coal that the national build had retired in
practice. The full TDP (22 inter-area lines by their dates) brings curtailment to 88 TWh and coal to 14 TWh, with the Karoo
corridors (North West to Northern Cape and Western Cape, Eastern Cape to KwaZulu-Natal, the Free State hub) still carrying
a shadow price in 4,600 to 7,100 hours at R3 to 5m per MW-year. Corridors extendable at R10,000 per MW-km bring it to 71
TWh (5 TWh above no limits) for 22.6 GW of corridor and R3.6bn a year: North West to Northern Cape 6.1 GW, Eastern Cape to
KwaZulu-Natal 4.8 GW, Northern Cape to Western Cape 4.1 GW, Free State to Northern Cape 2.9 GW, Free State to Gauteng 2.8
GW. Weather year 2015: 24.6 GW and R4.0bn a year (North West to Northern Cape 7.0 GW, Northern Cape to Western Cape 5.3, Eastern Cape to KwaZulu-Natal 5.0), curtailment 61 TWh and coal 4.

Fossil-free 2040 (56.5 GW of new wind, 100.5 GW of solar, 5 GW offshore, 56 GW of lithium at 8.6 h, 7.5 GW of flow, 5 GW of
iron-air, 1.5 GW of new pumped storage; no coal, no gas, no diesel): the engine curtails 245 TWh, the LP with no limits 208
TWh and serves everything. On today's corridors the LP cannot: 57.6 TWh unserved as drawn, 75 TWh at 0.7, 70.6 TWh with
one circuit dropped, nearly all of it in Mpumalanga (46 TWh) and the North West (12 TWh). With no coal in the coal
provinces, the night load there has to come through the Free State hub and the Karoo links, whose capacities in the
model's table are 0.2 to 2.6 GW (Free State to Mpumalanga 2,609 MW, Free State to Gauteng 1,446 MW, North West to Northern
Cape 663 MW, North West to Western Cape 233 MW), and every one of them carries a shadow price in all 8,760 hours at about
R730m per MW-year, the value of unserved energy. The full TDP brings unserved energy to 4.2 TWh (Mpumalanga 3.0, North
West 1.2) and curtailment to 247 TWh, with the same corridors binding in 3,100 hours at R254m per MW-year, which says the
plan's inter-area lines are not enough for this build on the table's capacities. The extendable case for 2040 builds 19.7 GW of corridor (weather year 2015: 20.0 GW) for R2.5 to 2.6bn a year, Free State to Gauteng 9.9 GW and Free State to Northern Cape 7.4 to 7.7 GW first, then Eastern Cape to KwaZulu-Natal 1.6 to 1.8 GW, and serves everything. It does so by moving the supply rather than carrying the wind: against the no-limits case wind falls from 152 TWh to 77 (146 TWh of it curtailed), solar rises from 134 to 172, offshore from 15 to 21 and lithium discharge from 37 to 65 TWh, and curtailment is 238 TWh (2015: 217), 30 TWh above no limits. At R10,000 per MW-km the LP finds 20 GW of Free State hub capacity cheaper than unserved energy, and the rest of the Cape's wind cheaper to curtail than to carry to the North West's solar and lithium. The first figure rests on the table's ratings for the hub and Karoo corridors, the second on the storage siting by the BESIPPPP shares.

Deep decarbonisation 2035 (39 GW of new wind, 39.8 GW of solar, 14.3 GW of lithium at 3.5 h, 1 GW offshore; coal 33 TWh in
the engine): no limits 59 TWh curtailed (the engine 73); as drawn 134 TWh and one circuit dropped 148 TWh, with coal at 90
to 103 TWh, again the standing fleet run flat out; the full TDP 81 TWh with coal 38. Deep 2040 (43.7 GW of wind, 57 GW of
solar, 23.7 GW of lithium at 6.2 h, 2 GW of new diesel open cycle, 1 GW offshore; coal 20 TWh): no limits 75 TWh (the engine
89); as drawn 174 TWh with 5.9 TWh unserved and 4.1 TWh of diesel; at 0.7 192 TWh and 14.0 TWh unserved; one circuit
dropped 188 TWh and 11.3 TWh unserved (Mpumalanga 8.4, North West 2.9), coal 96 TWh; the full TDP 109 TWh with nothing
unserved and coal 37, the Karoo exits (North West to Northern Cape and Western Cape 7,200 hours at R5m, Eastern Cape to
KwaZulu-Natal 5,800, Free State to Northern Cape and Hydra Central 4,000) still binding. Corridors extendable at R10,000 per MW-km: 2035 builds 26.6 GW for R4.5bn a year (North West to Northern Cape 9.8 GW, Northern Cape to Western Cape 6.0, Eastern Cape to KwaZulu-Natal 5.6, Eastern Cape to Hydra Central 3.0, Free State to Northern Cape 1.5) and brings curtailment to 60 TWh, 1 above no limits, with coal 20 TWh; 2040 builds 30.2 GW for R4.7bn a year (North West to Northern Cape 7.5, Eastern Cape to KwaZulu-Natal 5.9, Northern Cape to Western Cape 5.1, Free State to Northern Cape 4.8, Free State to Gauteng 3.7, Eastern Cape to Hydra Central 3.2), serves everything, and brings curtailment to 77 TWh, 2 above no limits, with coal 8 TWh. Weather year 2015: the fixed cases within 10%; extendable 26.1 and 30.9 GW for R4.4 and 4.9bn.
Deep sits between the other two: with 20 TWh of coal still standing in 2040 it serves the coal provinces on the plan's
lines where Fossil-free cannot, and curtails twice what the central build does.

What the three builds say together. (1) The central build's network cost is a few billion rand a year and the test's
measure of it is curtailment; the Fossil-free build's is adequacy: on today's corridors and with the TDP's inter-area
lines it cannot serve the coal provinces at night once coal is gone, and the test's measure becomes unserved energy and
the corridor capacity the LP would build to remove it; Deep is adequate on the plan's lines and not on today's. With corridors buildable at R10,000 per MW-km every build is served: the central build for R4.3 to 6.3bn a year (26 to 38 GW), Deep for R4.4 to 4.9bn (26 to 31 GW) on the same Karoo exits as the central build, and Fossil-free for R3.6 to 4.0bn in 2035 (23 to 25 GW) and R2.5 to 2.6bn in 2040 (20 GW), the last on the Free State hub instead of the Karoo exits and by curtailing the Cape's wind rather than carrying it. (2) The
storage siting assumption (lithium, flow and iron-air by the BESIPPPP shares, in the North West, Free State and Northern
Cape) decides the Fossil-free result more than wind and solar siting does; the free-mix case, which lets the LP site
lithium, is the one to read for that build: with corridors priced at R10,000 per MW-km, the integration charge removed and the run's own 2040 costs, on 6-hour blocks (the 3-hour form ran two hours of simplex without finishing), the LP sites its lithium in the Northern Cape (7.5 GW / 79 GWh of its 10.3 GW / 108 GWh, beside 34 GW of solar), the North West (1.9 GW) and Limpopo (0.9), not by the BESIPPPP shares, and buys 23.9 GW of corridor (Free State to Northern Cape 7.2 GW, North West to Northern Cape 6.7, Eastern Cape to KwaZulu-Natal 5.7, Free State to Gauteng 3.8) for R3.3bn a year. But it is not the Fossil-free build it is siting for: offered the run's menu at the run's costs on one weather year, it builds 23.6 GW of wind against the run's 56.5, 68 GW of solar against 100.5, a fifth of the lithium (10.3 GW / 108 GWh against 56 / 480) and 1.8 GW of open-cycle gas the build forbids, and serves the year with 5 GWh unserved and 36 TWh curtailed (the engine 245). The run's 56 GW of lithium is the adequacy standard's (20 weather years at the K = 20 check), which this LP does not see, so as posed the case says where a 10 GW store goes, not where 56 GW go; that test is badly posed for this build and is not run further as written. The case to read is the variant with no open cycle and the lithium held at the run's 56,017 MW / 480 GWh with its siting free (run on the rebuilt table, N-1 once, corridors at R10,000 and the run's 0.071, 6-hour blocks; queue19): with no gas and 56.0 GW / 480 GWh of lithium held, the LP sites the lithium in the Northern Cape (13.7 GW), the Free State (12.3), the North West (11.7), Limpopo (6.6), Hydra Central (3.9), the Eastern Cape (3.6), Mpumalanga (2.3) and the Western Cape (1.8): beside the solar and at the hub, half of it where the BESIPPPP shares put it (the North West, Free State and Northern Cape carry 37.7 GW against the shares' 56). It still builds 18.1 GW of wind and 73.8 of solar against the run's 56.5 and 100.5, buys 17.7 GW of corridor (Free State to Northern Cape 10.9, Free State to Gauteng 5.1, Eastern Cape to KwaZulu-Natal 0.9) for R1.13bn a year, curtails 38 TWh, serves everything, and discharges only 5.6 TWh from the held stores, since a build sized to the load on one weather year has little to shift. The siting answer stands (the LP spreads the stores to the solar and the hub rather than the three BESIPPPP provinces); the build answer does not, for the reason above. The same case for Fossil-free 2035 and for Deep 2040 (6-hour blocks) says the same thing more plainly: offered the run's menu at the run's costs with the standing coal fleet available, the LP keeps the coal running (77 TWh against the Fossil-free 2035 engine's 15, 43 against Deep 2040's 20), builds no lithium at all for Fossil-free 2035 (the run 36 GW) and half of Deep 2040's (12 GW against 24, in the Northern Cape and North West), and buys 15 to 21 GW of corridor; the builds' retirements and adequacy standard are what the free mix lacks, so for the stand-ins the fixed-build cases above are the test and the free mix is not. (3) The corridor table itself (St Clair sums from PyPSA-RSA's
shapefile, two corridors estimated) carries the whole weight of the 2040 results; its Free State hub and Karoo capacities
are the figures to check against a real rating before any of this is quoted. (4) The within-area limits are absent in
every case, so the central build's numbers are a lower bound, and the Fossil-free and Deep builds get no within-area
relief from the 60 TDP lines the model does not carry.

What the Fossil-free and Deep builds need from the network test that the central build does not (from their 2035 and 2040
states at build 2026-11-03a; the stand-ins are the committed s_ff2040_c7 and s_deep40nogas_c7 runs, to be rerun on their
finals when given).

1. Offshore wind sited. Fossil-free 2040 has 5,000 MW and Deep 1,000 MW; the engine runs one national series (the seven
   ESMAP sites' mean, scaled to 0.516). The ten-area test needs the MW by site: here equal shares (Northern Cape one site,
   Western Cape three, Eastern Cape two, KwaZulu-Natal one), each site's own series from the offshore file scaled to the
   engine's energy. A Cape-heavy offshore fleet lands on the corridors the onshore Cape fleet already fills.
2. Long-duration stores sited. Fossil-free 2040 has 7,500 MW of flow batteries (8 h) and 5,000 MW of iron-air (100 h) on
   top of 56,017 MW of lithium at 8.6 h; 2035 has 5,000 MW of flow. The engine sites none of it. Here flow and iron-air
   follow the BESIPPPP shares (North West, Free State, Northern Cape) as lithium does; the free-mix case lets the LP site
   lithium but not the long-duration stores. With no coal and no gas in 2040, the stores are the only dispatchable supply
   beside Koeberg, hydro and pumped storage, so the corridor result is a storage-siting result as much as a wind and solar
   one. The central build's 11 GW of lithium does not carry this weight.
3. New pumped storage. Fossil-free 2040 has 1,500 MW at 14 h (round trip 0.78). The engine adds it to the national pumped
   store. Here it is placed in Limpopo (the Tubatse site); the choice matters because it is the one large store in the
   coal provinces once coal is gone.
4. No coal, no gas, no diesel. Fossil-free 2040 retires the whole coal fleet (39,692 MW decommissioned), the 3,400 MW of
   diesel turbines and builds no gas. Every inland bus then depends on imports from the Cape, the Karoo and the stores, so
   the inland corridors (Free State hub, Limpopo and Mpumalanga to Gauteng) bind in the other direction from the central
   build's. The LP's coal floor and the engine's commitment practice are moot; the tie-out variant 'floor' does not exist
   for this build, and the no-limits case is the only tie-out.
5. The scale of curtailment. The engine itself curtails 245 TWh in Fossil-free 2040 (wind 153 and solar 107 TWh served)
   and 89 TWh in Deep 2040; 88 TWh in Fossil-free 2035. The network adds to a base that is already a third of availability,
   so the test's differences from no limits are read against a large base, and the within-area limits the model lacks
   matter more (100 GW of solar in the Northern Cape and North West files' shares is far beyond the approved-records MW
   used for siting).
6. Synchronous condensers. Fossil-free 2040 carries 9,775 MVA of condensers; they move no energy and the ten-area LP does
   not see them, but their placement is a network question the stability work owns, not this test.
7. Deep's 2,000 MW of new diesel open-cycle turbines (2040) go to the diesel sites by the fleet's shares; with coal at 20
   TWh and offshore 1,000 MW, Deep sits between the other two builds and needs nothing the script does not now carry.

### 722 (b): the ten-area LP's time, measured, and a 15-year chronological pathway on ten areas, extrapolated

Measured (every case's JSON carries a timing block: build seconds, solve seconds, peak memory from getrusage, variable and
constraint counts from linopy; HiGHS 1.15.1 dual simplex with presolve and parallel on, PyPSA 1.4.0; the machine shared
with one other solve of the same kind throughout, so the times are conservative by perhaps a third):

| file | build, year, weather year | case | hours (block) | variables | constraints | build s | solve s | total s | peak GB |
|---|---|---|---|---|---|---|---|---|---|
| timing_final_2035_wy2025_n1c_mix_ext10k_d25.json | 2026-11-05f, 2035, 2025 | one circuit dropped, mix, corridors extendable at R10,000 | 600 | 86482 | 181311 | 4 | 64 | 67 | 0.8 |
| net_deep_2035_wy2025_n1c_reea_l0_c1_mix_ext10k_h6.json | 2026-11-03a, 2035, 2025 | one circuit dropped, mix, corridors extendable at R10,000 (script v2) | 1,460 (6 h blocks) | 251223 | 522833 | 3 | 446 | 449 | 1.5 |
| net_deep_2040_wy2025_n1c_reea_l0_c1_mix_ext10k_h6.json | 2026-11-03a, 2040, 2025 | one circuit dropped, mix, corridors extendable at R10,000 (script v2) | 1,460 (6 h blocks) | 251223 | 522833 | 3 | 592 | 595 | 1.5 |
| net_ff_2035_wy2025_n1c_reea_l0_c1_mix_ext10k_h6.json | 2026-11-03a, 2035, 2025 | one circuit dropped, mix, corridors extendable at R10,000 (script v2) | 1,460 (6 h blocks) | 254143 | 533053 | 3 | 220 | 223 | 1.5 |
| net_ff_2040_wy2025_n1c_reea_l0_c1_mix_ext10k_h6.json | 2026-11-03a, 2040, 2025 | one circuit dropped, mix, corridors extendable at R10,000 (script v2) | 1,460 (6 h blocks) | 277503 | 585613 | 3 | 2776 | 2779 | 1.5 |
| net_final_2035_wy2025_nolimit_reea_l0_c1_mix_control_h6.json | 2026-11-05f, 2035, 2025 | no limits, mix | 1,460 (6 h blocks) | 210300 | 441010 | 3 | 297 | 300 | 1.2 |
| net_final_2035_wy2015_n1c_reea_l0_c1_mix_ext10k_h3.json | 2026-11-05f, 2035, 2015 | one circuit dropped, mix, corridors extendable at R10,000 (script v2) | 2,920 (3 h blocks) | 481903 | 1004633 | 3 | 2928 | 2930 | 2.4 |
| net_final_2035_wy2015_nolimit_reea_l0_c1_h3.json | 2026-11-05f, 2035, 2015 | no limits, fixed build | 2,920 (3 h blocks) | 297840 | 645320 | 2 | 10 | 13 | 1.4 |
| net_final_2035_wy2015_nolimit_reea_l0_c1_mix_control_h3.json | 2026-11-05f, 2035, 2015 | no limits, mix | 2,920 (3 h blocks) | 420540 | 881930 | 2 | 1596 | 1599 | 2.0 |
| net_final_2035_wy2015_nolimit_reea_l0_c1_mix_control_nocap_h3.json | 2026-11-05f, 2035, 2015 | no limits, mix (script v2) | 2,920 (3 h blocks) | 481860 | 1004570 | 3 | 2097 | 2100 | 2.4 |
| net_final_2035_wy2025_n1c_reea_l0_c1_h3.json | 2026-11-05f, 2035, 2025 | one circuit dropped, fixed build | 2,920 (3 h blocks) | 297840 | 645320 | 2 | 10 | 12 | 1.4 |
| net_final_2035_wy2025_n1c_reea_l0_c1_mix_ext10k_h3.json | 2026-11-05f, 2035, 2025 | one circuit dropped, mix, corridors extendable at R10,000 | 2,920 (3 h blocks) | 420562 | 881951 | 3 | 2732 | 2735 | 2.2 |
| net_final_2035_wy2025_n1c_reea_l0_c1_mix_n1c_fixedcorr_h3.json | 2026-11-05f, 2035, 2025 | one circuit dropped, mix | 2,920 (3 h blocks) | 420540 | 881930 | 2 | 3741 | 3744 | 2.1 |
| net_final_2035_wy2025_n1ctdp_reea_l0_c1_tdpfull_mix_ext10k_h3.json | 2026-11-05f, 2035, 2025 | one circuit dropped, full TDP, mix, corridors extendable at R10,000 | 2,920 (3 h blocks) | 420562 | 881951 | 3 | 2342 | 2344 | 2.2 |
| net_final_2035_wy2025_n1ctdp_reea_l0_c1_tdpfull_mix_fixed_h3.json | 2026-11-05f, 2035, 2025 | one circuit dropped, full TDP, mix | 2,920 (3 h blocks) | 420540 | 881930 | 3 | 3195 | 3198 | 2.1 |
| net_final_2035_wy2025_nolimit_reea_l0_c1_h3.json | 2026-11-05f, 2035, 2025 | no limits, fixed build | 2,920 (3 h blocks) | 297840 | 645320 | 2 | 12 | 15 | 1.4 |
| net_final_2035_wy2025_nolimit_reea_l0_c1_mix_control_caps_h3.json | 2026-11-05f, 2035, 2025 | no limits, mix | 2,920 (3 h blocks) | 420540 | 881933 | 2 | 1165 | 1168 | 2.4 |
| net_final_2035_wy2025_nolimit_reea_l0_c1_mix_control_credit_h3.json | 2026-11-05f, 2035, 2025 | no limits, mix (script v2) | 2,920 (3 h blocks) | 511070 | 1063001 | 3 | 1559 | 1563 | 2.5 |
| net_final_2035_wy2025_nolimit_reea_l0_c1_mix_control_h3.json | 2026-11-05f, 2035, 2025 | no limits, mix | 2,920 (3 h blocks) | 420540 | 881930 | 2 | 1213 | 1215 | 2.0 |
| net_final_2035_wy2025_nolimit_reea_l0_c1_mix_control_nocap_h3.json | 2026-11-05f, 2035, 2025 | no limits, mix (script v2) | 2,920 (3 h blocks) | 481860 | 1004570 | 3 | 1485 | 1487 | 2.4 |
| net_final_2035_wy2025_nolimit_reea_l0_c1_mix_control_onebus_h3.json | 2026-11-05f, 2035, 2025 | no limits, mix (script v2) | 2,920 (3 h blocks) | 481860 | 1004570 | 3 | 2345 | 2348 | 2.2 |
| net_final_2035_wy2025_nolimit_reea_l0_c1_mix_control_runwind_h3.json | 2026-11-05f, 2035, 2025 | no limits, mix (script v2) | 2,920 (3 h blocks) | 481860 | 1004571 | 3 | 1606 | 1609 | 2.2 |
| net_final_2040_wy2015_n1c_reea_l0_c1_mix_ext10k_h3.json | 2026-11-05f, 2040, 2015 | one circuit dropped, mix, corridors extendable at R10,000 (script v2) | 2,920 (3 h blocks) | 516943 | 1086393 | 3 | 4536 | 4539 | 2.6 |
| net_final_2040_wy2015_nolimit_reea_l0_c1_h3.json | 2026-11-05f, 2040, 2015 | no limits, fixed build | 2,920 (3 h blocks) | 335800 | 732920 | 2 | 14 | 16 | 1.8 |
| net_final_2040_wy2015_nolimit_reea_l0_c1_mix_control_h3.json | 2026-11-05f, 2040, 2015 | no limits, mix (script v2) | 2,920 (3 h blocks) | 516900 | 1086330 | 3 | 2274 | 2277 | 2.5 |
| net_final_2040_wy2025_n1c_reea_l0_c1_h3.json | 2026-11-05f, 2040, 2025 | one circuit dropped, fixed build | 2,920 (3 h blocks) | 335800 | 732920 | 2 | 13 | 15 | 1.8 |
| net_final_2040_wy2025_n1c_reea_l0_c1_mix_ext10k_h3.json | 2026-11-05f, 2040, 2025 | one circuit dropped, mix, corridors extendable at R10,000 | 2,920 (3 h blocks) | 455602 | 963711 | 2 | 4580 | 4582 | 2.3 |
| net_final_2040_wy2025_n1c_reea_l0_c1_mix_n1c_fixedcorr_h3.json | 2026-11-05f, 2040, 2025 | one circuit dropped, mix | 2,920 (3 h blocks) | 455580 | 963690 | 3 | 2715 | 2718 | 2.2 |
| net_final_2040_wy2025_n1ctdp_reea_l0_c1_tdpfull_mix_ext10k_h3.json | 2026-11-05f, 2040, 2025 | one circuit dropped, full TDP, mix, corridors extendable at R10,000 (script v2) | 2,920 (3 h blocks) | 516943 | 1086393 | 3 | 3616 | 3619 | 2.4 |
| net_final_2040_wy2025_nolimit_reea_l0_c1_h3.json | 2026-11-05f, 2040, 2025 | no limits, fixed build | 2,920 (3 h blocks) | 335800 | 732920 | 2 | 15 | 17 | 1.8 |
| net_final_2040_wy2025_nolimit_reea_l0_c1_mix_control_h3.json | 2026-11-05f, 2040, 2025 | no limits, mix | 2,920 (3 h blocks) | 455580 | 963690 | 3 | 1487 | 1490 | 2.3 |
| net_deep_2035_wy2015_n0_reea_l0_c0.json | 2026-11-03a, 2035, 2015 | N-1 (PyPSA-RSA's table, labelled 'as drawn' before 738), fixed build | 8,760 | 954840 | 2058600 | 2 | 37 | 40 | 3.6 |
| net_deep_2035_wy2015_n1c_reea_l0_c0.json | 2026-11-03a, 2035, 2015 | one circuit dropped, fixed build | 8,760 | 954840 | 2058600 | 2 | 38 | 40 | 3.6 |
| net_deep_2035_wy2015_n1c_reea_l0_c0_ext10k.json | 2026-11-03a, 2035, 2015 | one circuit dropped, fixed build, corridors extendable at R10,000 | 8,760 | 954862 | 2058621 | 2 | 550 | 552 | 4.0 |
| net_deep_2035_wy2015_n1ctdp_reea_l0_c0_tdpfull.json | 2026-11-03a, 2035, 2015 | one circuit dropped, full TDP, fixed build | 8,760 | 954840 | 2058600 | 3 | 40 | 43 | 4.2 |
| net_deep_2035_wy2015_nolimit_reea_l0_c0.json | 2026-11-03a, 2035, 2015 | no limits, fixed build | 8,760 | 954840 | 2058600 | 3 | 39 | 42 | 4.2 |
| net_deep_2035_wy2025_n0_reea_l0_c0.json | 2026-11-03a, 2035, 2025 | N-1 (PyPSA-RSA's table, labelled 'as drawn' before 738), fixed build | 8,760 | 954840 | 2058600 | 2 | 37 | 39 | 3.6 |
| net_deep_2035_wy2025_n1c_reea_l0_c0.json | 2026-11-03a, 2035, 2025 | one circuit dropped, fixed build | 8,760 | 954840 | 2058600 | 3 | 40 | 43 | 4.2 |
| net_deep_2035_wy2025_n1c_reea_l0_c0_ext10k.json | 2026-11-03a, 2035, 2025 | one circuit dropped, fixed build, corridors extendable at R10,000 | 8,760 | 954862 | 2058621 | 2 | 560 | 562 | 4.0 |
| net_deep_2035_wy2025_n1ctdp_reea_l0_c0_tdpfull.json | 2026-11-03a, 2035, 2025 | one circuit dropped, full TDP, fixed build | 8,760 | 954840 | 2058600 | 3 | 39 | 41 | 3.6 |
| net_deep_2035_wy2025_nolimit_reea_l0_c0.json | 2026-11-03a, 2035, 2025 | no limits, fixed build | 8,760 | 954840 | 2058600 | 2 | 49 | 51 | 4.1 |
| net_deep_2040_wy2015_n0_reea_l0_c0.json | 2026-11-03a, 2040, 2015 | N-1 (PyPSA-RSA's table, labelled 'as drawn' before 738), fixed build | 8,760 | 954840 | 2058600 | 3 | 37 | 40 | 4.2 |
| net_deep_2040_wy2015_n1c_reea_l0_c0.json | 2026-11-03a, 2040, 2015 | one circuit dropped, fixed build | 8,760 | 954840 | 2058600 | 3 | 39 | 41 | 3.6 |
| net_deep_2040_wy2015_n1c_reea_l0_c0_ext10k.json | 2026-11-03a, 2040, 2015 | one circuit dropped, fixed build, corridors extendable at R10,000 | 8,760 | 954862 | 2058621 | 2 | 726 | 728 | 4.3 |
| net_deep_2040_wy2015_n1ctdp_reea_l0_c0_tdpfull.json | 2026-11-03a, 2040, 2015 | one circuit dropped, full TDP, fixed build | 8,760 | 954840 | 2058600 | 2 | 37 | 40 | 3.6 |
| net_deep_2040_wy2015_nolimit_reea_l0_c0.json | 2026-11-03a, 2040, 2015 | no limits, fixed build | 8,760 | 954840 | 2058600 | 2 | 38 | 40 | 4.2 |
| net_deep_2040_wy2025_n0_reea_l0_c0.json | 2026-11-03a, 2040, 2025 | N-1 (PyPSA-RSA's table, labelled 'as drawn' before 738), fixed build | 8,760 | 954840 | 2058600 | 3 | 41 | 43 | 4.2 |
| net_deep_2040_wy2025_n1_reea_l0_c0.json | 2026-11-03a, 2040, 2025 | 0.7, fixed build | 8,760 | 954840 | 2058600 | 3 | 41 | 44 | 4.2 |
| net_deep_2040_wy2025_n1c_reea_l0_c0.json | 2026-11-03a, 2040, 2025 | one circuit dropped, fixed build | 8,760 | 954840 | 2058600 | 3 | 41 | 44 | 4.2 |
| net_deep_2040_wy2025_n1c_reea_l0_c0_ext10k.json | 2026-11-03a, 2040, 2025 | one circuit dropped, fixed build, corridors extendable at R10,000 | 8,760 | 954862 | 2058621 | 2 | 517 | 519 | 4.0 |
| net_deep_2040_wy2025_n1ctdp_reea_l0_c0_tdpfull.json | 2026-11-03a, 2040, 2025 | one circuit dropped, full TDP, fixed build | 8,760 | 954840 | 2058600 | 2 | 38 | 41 | 3.6 |
| net_deep_2040_wy2025_nolimit_reea_l0_c0.json | 2026-11-03a, 2040, 2025 | no limits, fixed build | 8,760 | 954840 | 2058600 | 3 | 47 | 50 | 4.1 |
| net_ff_2035_wy2015_n0_reea_l0_c0.json | 2026-11-03a, 2035, 2015 | N-1 (PyPSA-RSA's table, labelled 'as drawn' before 738), fixed build | 8,760 | 972360 | 2119920 | 2 | 42 | 44 | 4.3 |
| net_ff_2035_wy2015_n1c_reea_l0_c0.json | 2026-11-03a, 2035, 2015 | one circuit dropped, fixed build | 8,760 | 972360 | 2119920 | 2 | 42 | 45 | 4.3 |
| net_ff_2035_wy2015_n1c_reea_l0_c0_ext10k.json | 2026-11-03a, 2035, 2015 | one circuit dropped, fixed build, corridors extendable at R10,000 | 8,760 | 972382 | 2119941 | 2 | 2194 | 2196 | 3.7 |
| net_ff_2035_wy2015_n1ctdp_reea_l0_c0_tdpfull.json | 2026-11-03a, 2035, 2015 | one circuit dropped, full TDP, fixed build | 8,760 | 972360 | 2119920 | 3 | 47 | 50 | 4.3 |
| net_ff_2035_wy2015_nolimit_reea_l0_c0.json | 2026-11-03a, 2035, 2015 | no limits, fixed build | 8,760 | 972360 | 2119920 | 2 | 48 | 51 | 3.7 |
| net_ff_2035_wy2025_n0_reea_l0_c0.json | 2026-11-03a, 2035, 2025 | N-1 (PyPSA-RSA's table, labelled 'as drawn' before 738), fixed build | 8,760 | 972360 | 2119920 | 3 | 63 | 66 | 4.2 |
| net_ff_2035_wy2025_n1c_reea_l0_c0.json | 2026-11-03a, 2035, 2025 | one circuit dropped, fixed build | 8,760 | 972360 | 2119920 | 3 | 56 | 59 | 3.5 |
| net_ff_2035_wy2025_n1c_reea_l0_c0_ext10k.json | 2026-11-03a, 2035, 2025 | one circuit dropped, fixed build, corridors extendable at R10,000 | 8,760 | 972382 | 2119941 | 2 | 1604 | 1607 | 4.3 |
| net_ff_2035_wy2025_n1ctdp_reea_l0_c0_tdpfull.json | 2026-11-03a, 2035, 2025 | one circuit dropped, full TDP, fixed build | 8,760 | 972360 | 2119920 | 2 | 61 | 64 | 4.3 |
| net_ff_2035_wy2025_nolimit_reea_l0_c0.json | 2026-11-03a, 2035, 2025 | no limits, fixed build | 8,760 | 972360 | 2119920 | 2 | 73 | 75 | 4.2 |
| net_ff_2040_wy2015_n0_reea_l0_c0.json | 2026-11-03a, 2040, 2015 | N-1 (PyPSA-RSA's table, labelled 'as drawn' before 738), fixed build | 8,760 | 1112520 | 2435280 | 2 | 57 | 59 | 4.1 |
| net_ff_2040_wy2015_n1c_reea_l0_c0.json | 2026-11-03a, 2040, 2015 | one circuit dropped, fixed build | 8,760 | 1112520 | 2435280 | 2 | 60 | 62 | 4.1 |
| net_ff_2040_wy2015_n1c_reea_l0_c0_ext10k.json | 2026-11-03a, 2040, 2015 | one circuit dropped, fixed build, corridors extendable at R10,000 | 8,760 | 1112542 | 2435301 | 3 | 808 | 811 | 5.0 |
| net_ff_2040_wy2015_n1ctdp_reea_l0_c0_tdpfull.json | 2026-11-03a, 2040, 2015 | one circuit dropped, full TDP, fixed build | 8,760 | 1112520 | 2435280 | 3 | 62 | 64 | 4.3 |
| net_ff_2040_wy2015_nolimit_reea_l0_c0.json | 2026-11-03a, 2040, 2015 | no limits, fixed build | 8,760 | 1112520 | 2435280 | 2 | 58 | 60 | 4.2 |
| net_ff_2040_wy2025_n0_reea_l0_c0.json | 2026-11-03a, 2040, 2025 | N-1 (PyPSA-RSA's table, labelled 'as drawn' before 738), fixed build | 8,760 | 1112520 | 2435280 | 3 | 73 | 76 | 4.1 |
| net_ff_2040_wy2025_n1_reea_l0_c0.json | 2026-11-03a, 2040, 2025 | 0.7, fixed build | 8,760 | 1112520 | 2435280 | 3 | 84 | 87 | 4.8 |
| net_ff_2040_wy2025_n1c_reea_l0_c0.json | 2026-11-03a, 2040, 2025 | one circuit dropped, fixed build | 8,760 | 1112520 | 2435280 | 2 | 83 | 86 | 4.9 |
| net_ff_2040_wy2025_n1c_reea_l0_c0_ext10k.json | 2026-11-03a, 2040, 2025 | one circuit dropped, fixed build, corridors extendable at R10,000 | 8,760 | 1112542 | 2435301 | 4 | 755 | 759 | 4.9 |
| net_ff_2040_wy2025_n1ctdp_reea_l0_c0_tdpfull.json | 2026-11-03a, 2040, 2025 | one circuit dropped, full TDP, fixed build | 8,760 | 1112520 | 2435280 | 3 | 80 | 83 | 4.8 |
| net_ff_2040_wy2025_nolimit_reea_l0_c0.json | 2026-11-03a, 2040, 2025 | no limits, fixed build | 8,760 | 1112520 | 2435280 | 3 | 83 | 86 | 4.9 |
| net_final_2035_wy2015_n1_reea_l0_c0_ext10k.json | 2026-11-05f, 2035, 2015 | 0.7, fixed build, corridors extendable at R10,000 | 8,760 | 893542 | 1935981 | 2 | 758 | 760 | 3.4 |
| net_final_2035_wy2015_n1c_reea_l0_c0.json | 2026-11-05f, 2035, 2015 | one circuit dropped, fixed build | 8,760 | 893520 | 1935960 | 2 | 40 | 42 | 4.0 |
| net_final_2035_wy2015_n1c_reea_l0_c0_ext10k.json | 2026-11-05f, 2035, 2015 | one circuit dropped, fixed build, corridors extendable at R10,000 | 8,760 | 893542 | 1935981 | 2 | 629 | 632 | 3.4 |
| net_final_2035_wy2015_n1c_reea_l0_c1.json | 2026-11-05f, 2035, 2015 | one circuit dropped, fixed build | 8,760 | 893520 | 1935960 | 2 | 39 | 41 | 4.0 |
| net_final_2035_wy2015_n1ctdp_reea_l0_c0.json | 2026-11-05f, 2035, 2015 | one circuit dropped, full TDP, fixed build | 8,760 | 893520 | 1935960 | 3 | 41 | 43 | 3.9 |
| net_final_2035_wy2015_n1ctdp_reea_l0_c0_tdpfull.json | 2026-11-05f, 2035, 2015 | one circuit dropped, full TDP, fixed build | 8,760 | 893520 | 1935960 | 3 | 41 | 44 | 3.9 |
| net_final_2035_wy2015_n1tdp_reea_l0_c0_tdpfull.json | 2026-11-05f, 2035, 2015 | n1tdp, fixed build | 8,760 | 893520 | 1935960 | 3 | 45 | 48 | 3.4 |
| net_final_2035_wy2015_nolimit_reea_l0_c1.json | 2026-11-05f, 2035, 2015 | no limits, fixed build | 8,760 | 893520 | 1935960 | 2 | 37 | 40 | 3.9 |
| net_final_2035_wy2015_nolimit_reea_l0_c2.json | 2026-11-05f, 2035, 2015 | no limits, fixed build | 8,760 | 893520 | 1935960 | 2 | 51 | 53 | 4.0 |
| net_final_2035_wy2025_f085tdp_reea_l0_c0_tdpfull.json | 2026-11-05f, 2035, 2025 | f085tdp, fixed build | 8,760 | 893520 | 1935960 | 3 | 43 | 46 | 3.9 |
| net_final_2035_wy2025_n0tdp_reea_l0_c0_tdpfull.json | 2026-11-05f, 2035, 2025 | n0tdp, fixed build | 8,760 | 893520 | 1935960 | 2 | 43 | 45 | 3.9 |
| net_final_2035_wy2025_n1_reea_l0_c0_bld.json | 2026-11-05f, 2035, 2025 | 0.7, fixed build | 8,760 | 893520 | 1935960 | 2 | 38 | 39 | 4.0 |
| net_final_2035_wy2025_n1_reea_l0_c0_ext21k.json | 2026-11-05f, 2035, 2025 | 0.7, fixed build, corridors extendable at R21,700 | 8,760 | 893542 | 1935981 | 2 | 491 | 493 | 3.4 |
| net_final_2035_wy2025_n1_reea_l0_c0_sitefree.json | 2026-11-05f, 2035, 2025 | 0.7, fixed build, free siting | 8,760 | 902300 | 1953522 | 2 | 236 | 238 | 3.6 |
| net_final_2035_wy2025_n1_reea_l0_c0_sitefree_ext10k.json | 2026-11-05f, 2035, 2025 | 0.7, fixed build, corridors extendable at R10,000, free siting | 8,760 | 902322 | 1953543 | 2 | 2016 | 2018 | 3.8 |
| net_final_2035_wy2025_n1_reea_l0_c1.json | 2026-11-05f, 2035, 2025 | 0.7, fixed build | 8,760 | 893520 | 1935960 | 3 | 57 | 61 | 3.9 |
| net_final_2035_wy2025_n1c_fleet_l0_c0.json | 2026-11-05f, 2035, 2025 | one circuit dropped, fixed build | 8,760 | 823440 | 1795800 | 3 | 37 | 40 | 3.7 |
| net_final_2035_wy2025_n1c_reea_l0_c0.json | 2026-11-05f, 2035, 2025 | one circuit dropped, fixed build | 8,760 | 893520 | 1935960 | 3 | 40 | 42 | 3.9 |
| net_final_2035_wy2025_n1c_reea_l0_c0_bld.json | 2026-11-05f, 2035, 2025 | one circuit dropped, fixed build | 8,760 | 893520 | 1935960 | 2 | 38 | 40 | 3.9 |
| net_final_2035_wy2025_n1c_reea_l0_c0_ext10k.json | 2026-11-05f, 2035, 2025 | one circuit dropped, fixed build, corridors extendable at R10,000 | 8,760 | 893542 | 1935981 | 3 | 704 | 707 | 3.4 |
| net_final_2035_wy2025_n1c_reea_l0_c0_ext10k_ipmtest.json | 2026-11-05f, 2035, 2025 | one circuit dropped, fixed build, corridors extendable at R10,000 | 8,760 | 893542 | 1935981 | 2 | 1834 | 1836 | 3.1 |
| net_final_2035_wy2025_n1c_reea_l0_c0_ext21k.json | 2026-11-05f, 2035, 2025 | one circuit dropped, fixed build, corridors extendable at R21,700 | 8,760 | 893542 | 1935981 | 2 | 506 | 508 | 3.4 |
| net_final_2035_wy2025_n1c_reea_l0_c0_sitefree.json | 2026-11-05f, 2035, 2025 | one circuit dropped, fixed build, free siting | 8,760 | 902300 | 1953522 | 2 | 209 | 211 | 4.0 |
| net_final_2035_wy2025_n1c_reea_l0_c0_sitefree_ext10k.json | 2026-11-05f, 2035, 2025 | one circuit dropped, fixed build, corridors extendable at R10,000, free siting | 8,760 | 902322 | 1953543 | 2 | 1811 | 1813 | 3.8 |
| net_final_2035_wy2025_n1c_reea_l0_c1.json | 2026-11-05f, 2035, 2025 | one circuit dropped, fixed build | 8,760 | 893520 | 1935960 | 3 | 43 | 46 | 3.9 |
| net_final_2035_wy2025_n1c_reea_l1_c0.json | 2026-11-05f, 2035, 2025 | one circuit dropped, fixed build | 8,760 | 1077480 | 2303880 | 3 | 47 | 50 | 4.7 |
| net_final_2035_wy2025_n1ctdp_reea_l0_c0.json | 2026-11-05f, 2035, 2025 | one circuit dropped, full TDP, fixed build | 8,760 | 893520 | 1935960 | 2 | 41 | 43 | 4.0 |
| net_final_2035_wy2025_n1ctdp_reea_l0_c0_tdpfull.json | 2026-11-05f, 2035, 2025 | one circuit dropped, full TDP, fixed build | 8,760 | 893520 | 1935960 | 3 | 41 | 43 | 3.9 |
| net_final_2035_wy2025_n1ctdp_reea_l0_c0_tdpfull_ext10k.json | 2026-11-05f, 2035, 2025 | one circuit dropped, full TDP, fixed build, corridors extendable at R10,000 | 8,760 | 893542 | 1935981 | 2 | 209 | 211 | 3.4 |
| net_final_2035_wy2025_n1ctdp_reea_l0_c0_tdpfull_sitefree.json | 2026-11-05f, 2035, 2025 | one circuit dropped, full TDP, fixed build, free siting | 8,760 | 902300 | 1953522 | 2 | 216 | 218 | 4.0 |
| net_final_2035_wy2025_n1tdp_reea_l0_c0_sitefree.json | 2026-11-05f, 2035, 2025 | n1tdp, fixed build, free siting | 8,760 | 902300 | 1953522 | 2 | 261 | 263 | 4.0 |
| net_final_2035_wy2025_n1tdp_reea_l0_c0_tdpfull.json | 2026-11-05f, 2035, 2025 | n1tdp, fixed build | 8,760 | 893520 | 1935960 | 3 | 41 | 43 | 4.0 |
| net_final_2035_wy2025_nolimit_reea_l0_c0_bld.json | 2026-11-05f, 2035, 2025 | no limits, fixed build | 8,760 | 893520 | 1935960 | 2 | 38 | 40 | 3.9 |
| net_final_2040_wy2015_n0_reea_l0_c0.json | 2026-11-05f, 2040, 2015 | N-1 (PyPSA-RSA's table, labelled 'as drawn' before 738), fixed build | 8,760 | 1007400 | 2198760 | 3 | 48 | 51 | 3.7 |
| net_final_2040_wy2015_n1_reea_l0_c0.json | 2026-11-05f, 2040, 2015 | 0.7, fixed build | 8,760 | 1007400 | 2198760 | 3 | 52 | 55 | 4.4 |
| net_final_2040_wy2015_n1c_reea_l0_c0.json | 2026-11-05f, 2040, 2015 | one circuit dropped, fixed build | 8,760 | 1007400 | 2198760 | 2 | 50 | 53 | 3.8 |
| net_final_2040_wy2015_n1c_reea_l0_c0_ext10k.json | 2026-11-05f, 2040, 2015 | one circuit dropped, fixed build, corridors extendable at R10,000 | 8,760 | 1007422 | 2198781 | 2 | 1427 | 1429 | 4.3 |
| net_final_2040_wy2015_n1c_reea_l0_c1.json | 2026-11-05f, 2040, 2015 | one circuit dropped, fixed build | 8,760 | 1007400 | 2198760 | 2 | 47 | 50 | 3.8 |
| net_final_2040_wy2015_n1ctdp_reea_l0_c0.json | 2026-11-05f, 2040, 2015 | one circuit dropped, full TDP, fixed build | 8,760 | 1007400 | 2198760 | 2 | 56 | 59 | 4.3 |
| net_final_2040_wy2015_n1ctdp_reea_l0_c0_tdpfull.json | 2026-11-05f, 2040, 2015 | one circuit dropped, full TDP, fixed build | 8,760 | 1007400 | 2198760 | 3 | 55 | 57 | 4.3 |
| net_final_2040_wy2015_n1tdp_reea_l0_c0.json | 2026-11-05f, 2040, 2015 | n1tdp, fixed build | 8,760 | 1007400 | 2198760 | 2 | 55 | 57 | 4.3 |
| net_final_2040_wy2015_n1tdp_reea_l0_c0_tdpfull.json | 2026-11-05f, 2040, 2015 | n1tdp, fixed build | 8,760 | 1007400 | 2198760 | 3 | 53 | 56 | 4.4 |
| net_final_2040_wy2015_nolimit_reea_l0_c0.json | 2026-11-05f, 2040, 2015 | no limits, fixed build | 8,760 | 1007400 | 2198760 | 3 | 48 | 52 | 4.3 |
| net_final_2040_wy2015_nolimit_reea_l0_c1.json | 2026-11-05f, 2040, 2015 | no limits, fixed build | 8,760 | 1007400 | 2198760 | 2 | 48 | 50 | 4.4 |
| net_final_2040_wy2015_nolimit_reea_l0_c2.json | 2026-11-05f, 2040, 2015 | no limits, fixed build | 8,760 | 1007400 | 2198760 | 2 | 70 | 73 | 4.3 |
| net_final_2040_wy2025_f085_reea_l0_c0.json | 2026-11-05f, 2040, 2025 | f085, fixed build | 8,760 | 1007400 | 2198760 | 2 | 49 | 51 | 4.4 |
| net_final_2040_wy2025_f085tdp_reea_l0_c0.json | 2026-11-05f, 2040, 2025 | f085tdp, fixed build | 8,760 | 1007400 | 2198760 | 3 | 52 | 55 | 4.4 |
| net_final_2040_wy2025_f085tdp_reea_l0_c0_tdpfull.json | 2026-11-05f, 2040, 2025 | f085tdp, fixed build | 8,760 | 1007400 | 2198760 | 3 | 61 | 64 | 4.3 |
| net_final_2040_wy2025_n0_reea_l0_c0.json | 2026-11-05f, 2040, 2025 | N-1 (PyPSA-RSA's table, labelled 'as drawn' before 738), fixed build | 8,760 | 1007400 | 2198760 | 2 | 50 | 53 | 4.3 |
| net_final_2040_wy2025_n0tdp_reea_l0_c0.json | 2026-11-05f, 2040, 2025 | n0tdp, fixed build | 8,760 | 1007400 | 2198760 | 3 | 54 | 56 | 4.4 |
| net_final_2040_wy2025_n0tdp_reea_l0_c0_tdpfull.json | 2026-11-05f, 2040, 2025 | n0tdp, fixed build | 8,760 | 1007400 | 2198760 | 3 | 54 | 57 | 4.4 |
| net_final_2040_wy2025_n1_reea_l0_c0.json | 2026-11-05f, 2040, 2025 | 0.7, fixed build | 8,760 | 1007400 | 2198760 | 2 | 49 | 51 | 3.7 |
| net_final_2040_wy2025_n1_reea_l0_c0_ext10k.json | 2026-11-05f, 2040, 2025 | 0.7, fixed build, corridors extendable at R10,000 | 8,760 | 1007422 | 2198781 | 3 | 1922 | 1924 | 3.7 |
| net_final_2040_wy2025_n1_reea_l0_c0_ext21k.json | 2026-11-05f, 2040, 2025 | 0.7, fixed build, corridors extendable at R21,700 | 8,760 | 1007422 | 2198781 | 2 | 1030 | 1032 | 3.8 |
| net_final_2040_wy2025_n1_reea_l0_c1.json | 2026-11-05f, 2040, 2025 | 0.7, fixed build | 8,760 | 1007400 | 2198760 | 2 | 55 | 57 | 3.7 |
| net_final_2040_wy2025_n1c_reea_l0_c0.json | 2026-11-05f, 2040, 2025 | one circuit dropped, fixed build | 8,760 | 1007400 | 2198760 | 3 | 49 | 52 | 3.7 |
| net_final_2040_wy2025_n1c_reea_l0_c0_ext10k.json | 2026-11-05f, 2040, 2025 | one circuit dropped, fixed build, corridors extendable at R10,000 | 8,760 | 1007422 | 2198781 | 3 | 1434 | 1437 | 3.8 |
| net_final_2040_wy2025_n1c_reea_l0_c0_ext21k.json | 2026-11-05f, 2040, 2025 | one circuit dropped, fixed build, corridors extendable at R21,700 | 8,760 | 1007422 | 2198781 | 2 | 793 | 795 | 4.5 |
| net_final_2040_wy2025_n1c_reea_l0_c1.json | 2026-11-05f, 2040, 2025 | one circuit dropped, fixed build | 8,760 | 1007400 | 2198760 | 2 | 50 | 52 | 3.7 |
| net_final_2040_wy2025_n1c_reea_l1_c0.json | 2026-11-05f, 2040, 2025 | one circuit dropped, fixed build | 8,760 | 1191360 | 2566680 | 3 | 60 | 63 | 5.1 |
| net_final_2040_wy2025_n1ctdp_reea_l0_c0.json | 2026-11-05f, 2040, 2025 | one circuit dropped, full TDP, fixed build | 8,760 | 1007400 | 2198760 | 2 | 55 | 57 | 4.3 |
| net_final_2040_wy2025_n1ctdp_reea_l0_c0_tdpfull.json | 2026-11-05f, 2040, 2025 | one circuit dropped, full TDP, fixed build | 8,760 | 1007400 | 2198760 | 5 | 89 | 94 | 4.2 |
| net_final_2040_wy2025_n1ctdp_reea_l0_c0_tdpfull_ext10k.json | 2026-11-05f, 2040, 2025 | one circuit dropped, full TDP, fixed build, corridors extendable at R10,000 | 8,760 | 1007422 | 2198781 | 2 | 384 | 386 | 4.5 |
| net_final_2040_wy2025_n1tdp_reea_l0_c0.json | 2026-11-05f, 2040, 2025 | n1tdp, fixed build | 8,760 | 1007400 | 2198760 | 3 | 53 | 56 | 4.3 |
| net_final_2040_wy2025_n1tdp_reea_l0_c0_tdpfull.json | 2026-11-05f, 2040, 2025 | n1tdp, fixed build | 8,760 | 1007400 | 2198760 | 10 | 134 | 144 | 3.5 |
| net_final_2040_wy2025_nolimit_reea_l0_c0.json | 2026-11-05f, 2040, 2025 | no limits, fixed build | 8,760 | 1007400 | 2198760 | 3 | 47 | 49 | 4.4 |
| net_final_2040_wy2025_nolimit_reea_l0_c1.json | 2026-11-05f, 2040, 2025 | no limits, fixed build | 8,760 | 1007400 | 2198760 | 3 | 64 | 67 | 4.4 |
| net_final_2040_wy2025_nolimit_reea_l0_c2.json | 2026-11-05f, 2040, 2025 | no limits, fixed build | 8,760 | 1007400 | 2198760 | 3 | 63 | 66 | 4.3 |
| net_standin_2035_wy2015_n1_reea_l0_c0_ext10k.json | 2026-11-03a, 2035, 2015 | 0.7, fixed build, corridors extendable at R10,000 | 8,760 | 911062 | 1971021 | 2 | 750 | 753 | 3.9 |
| net_standin_2035_wy2025_n1_reea_l0_c0_bld.json | 2026-11-03a, 2035, 2025 | 0.7, fixed build | 8,760 | 911040 | 1971000 | 3 | 47 | 51 | 3.3 |
| net_standin_2035_wy2025_n1c_reea_l0_c0_ext10k.json | 2026-11-03a, 2035, 2025 | one circuit dropped, fixed build, corridors extendable at R10,000 | 8,760 | 911062 | 1971021 | 2 | 673 | 675 | 4.0 |
| net_standin_2035_wy2025_n1ctdp_reea_l0_c0.json | 2026-11-03a, 2035, 2025 | one circuit dropped, full TDP, fixed build | 8,760 | 911040 | 1971000 | 3 | 48 | 51 | 3.3 |
| net_standin_2040_wy2015_n1_reea_l0_c0_ext10k.json | 2026-11-03a, 2040, 2015 | 0.7, fixed build, corridors extendable at R10,000 | 8,760 | 911062 | 1971021 | 3 | 932 | 935 | 3.9 |
| net_standin_2040_wy2025_f085_reea_l0_c0.json | 2026-11-03a, 2040, 2025 | f085, fixed build | 8,760 | 911040 | 1971000 | 3 | 44 | 47 | 3.9 |
| net_today_2025_wy2025_f085_reea_l0_c0_koeberg.json | 2026-11-04b, 2025, 2025 | f085, fixed build, Koeberg calendar | 8,760 | 657000 | 1436640 | 5 | 96 | 101 | 2.9 |
| net_today_2025_wy2025_n0_reea_l0_c0_koeberg.json | 2026-11-04b, 2025, 2025 | N-1 (PyPSA-RSA's table, labelled 'as drawn' before 738), fixed build, Koeberg calendar | 8,760 | 657000 | 1436640 | 10 | 88 | 98 | 2.9 |
| net_today_2025_wy2025_n1_reea_l0_c0_koeberg.json | 2026-11-04b, 2025, 2025 | 0.7, fixed build, Koeberg calendar | 8,760 | 657000 | 1436640 | 8 | 109 | 117 | 2.9 |
| net_today_2025_wy2025_n1c_reea_l0_c0.json | 2026-11-04b, 2025, 2025 | one circuit dropped, fixed build | 8,760 | 657000 | 1436640 | 2 | 28 | 30 | 3.0 |
| net_today_2025_wy2025_n1c_reea_l0_c0_koeberg.json | 2026-11-04b, 2025, 2025 | one circuit dropped, fixed build, Koeberg calendar | 8,760 | 657000 | 1436640 | 8 | 97 | 104 | 2.9 |
| net_today_2025_wy2025_nolimit_reea_l0_c0_koeberg.json | 2026-11-04b, 2025, 2025 | no limits, fixed build, Koeberg calendar | 8,760 | 657000 | 1436640 | 7 | 87 | 94 | 3.0 |
| net_today_2026_wy2025_f085_reea_l0_c0_koeberg.json | 2026-11-04b, 2026, 2025 | f085, fixed build, Koeberg calendar | 8,760 | 657000 | 1436640 | 4 | 45 | 49 | 2.9 |
| net_today_2026_wy2025_n0_reea_l0_c0_koeberg.json | 2026-11-04b, 2026, 2025 | N-1 (PyPSA-RSA's table, labelled 'as drawn' before 738), fixed build, Koeberg calendar | 8,760 | 657000 | 1436640 | 4 | 57 | 62 | 2.9 |
| net_today_2026_wy2025_n1_reea_l0_c0_koeberg.json | 2026-11-04b, 2026, 2025 | 0.7, fixed build, Koeberg calendar | 8,760 | 657000 | 1436640 | 3 | 42 | 45 | 3.1 |
| net_today_2026_wy2025_n1c_reea_l0_c0.json | 2026-11-04b, 2026, 2025 | one circuit dropped, fixed build | 8,760 | 657000 | 1436640 | 2 | 27 | 29 | 3.0 |
| net_today_2026_wy2025_n1c_reea_l0_c0_koeberg.json | 2026-11-04b, 2026, 2025 | one circuit dropped, fixed build, Koeberg calendar | 8,760 | 657000 | 1436640 | 2 | 28 | 30 | 3.0 |
| net_today_2026_wy2025_nolimit_reea_l0_c0_koeberg.json | 2026-11-04b, 2026, 2025 | no limits, fixed build, Koeberg calendar | 8,760 | 657000 | 1436640 | 10 | 73 | 83 | 2.9 |

In short, on this machine (16 GB, the shared cloud container):

- A fixed build, ten areas, 8,760 hours: 0.9 to 1.1 million variables and 2.0 to 2.4 million constraints (the central
  2035 state 893,520 and 1,935,960; Fossil-free 2040 1,112,520 and 2,435,280); 2 to 3 s to build, 37 to 90 s to solve, 3.5
  to 5 GB at peak. The whole case set of 718 on three builds (about 150 fixed-build solves) is two to three machine-hours.
- The same with the 21 corridor capacities as variables (extendable corridors): 630 to 1,920 s (10 to 32 minutes), the
  same memory; the dual simplex pays for the investment coupling. The free-siting case (20 generator capacities as
  variables): 289 s. An interior-point run of the same extendable case (HiGHS IPM, crossover off) took 1,834 s against the dual simplex's 704
s, to the same objective (R49.97bn) and the same 26,485 MW of corridor, at 3.1 GB against 3.4: on this problem the
interior point is 2.6 times slower, so the simplex stays.
- The free mix (wind, solar, lithium power and energy, open-cycle gas and corridors extendable by area, about 60
  investment variables) on 25 evenly spaced days (600 hours): 86,482 variables, 181,311 constraints, 4 s to build, 64 s to
  solve, 0.8 GB. On 8,760 hours the dual simplex did not finish: 7,154 s and 1.87 million iterations when the queue's
  two-hour limit stopped it, still primal infeasible (the extendable-corridor cases, 21 investment variables, take 10 to
  32 minutes; the free mix adds about 60, among them the lithium energy variables, which couple every hour of the year
  through the stores). On the whole year in 6-hour blocks (1,460 steps; every series the block mean, each step weighted
  6 h in the objective and the stores): 210,300 variables, 441,010 constraints, 297 s to solve, 1.2 GB. In 3-hour blocks
  (2,920 steps): 420,540 variables, 881,930 constraints, 1,213 s to solve (20 minutes), 2.0 GB, four times the 6-hour time for twice the
steps. The two block sizes agree on wind and solar (22.2 against 21.8 GW, 13.7 against 14.2) and differ on lithium power
(7.0 against 3.7 GW at 24.6 against 22.4 GWh), which is the evening peak the 6-hour block flattens. The 718 (f) cases are run in 3-hour blocks, which keep the year's chronology and the daily
  storage cycle; a block understates curtailment and the lithium value wherever a peak is shorter than the block.

Extrapolation to a 15-year chronological pathway on ten areas (2026 to 2040, every year at 8,760 hours, the free mix with
corridors). Two shapes. (i) One LP with perfect foresight across the years, as the national chain's LP has: 15 years of the
8,760-hour free mix is about 17 million variables and 36 million constraints, five to six times this machine's memory at
the 4 to 5 GB a year the fixed cases take, so it does not fit here at all and would need a 128 GB machine and an interior
point solver; the time cannot be measured on this machine and is not extrapolated. (ii) Myopic, one year at a time with
capacities carried forward, which is how the ten-area runs were done here. At full hourly resolution one year alone is
over two hours of dual simplex, so a 15-year pass is a day or more of solver time and does not fit the chain's two-hour
window. In 3-hour blocks: 15 sequential free-mix solves, each 420,540 variables, 881,930 constraints, 1,213 s to solve (20 minutes), 2.0 GB, four times the 6-hour time for twice the
steps. The two block sizes agree on wind and solar (22.2 against 21.8 GW, 13.7 against 14.2) and differ on lithium power
(7.0 against 3.7 GW at 24.6 against 22.4 GWh), which is the evening peak the 6-hour block flattens, plus a fixed-build check solve per year at
hourly resolution (about a minute), plus the engine's own pathcheck (about 20 minutes a pass at the recorded 300 to 700 s
of LP time), so one pass is 5 to 19 hours of solver time (the 3-hour-block control took 1,213 s for 2035 and 1,487 s for 2040, the capped control 1,165 s, the mix with extendable corridors 2,732 s for 2035 and 4,580 s for 2040, the mix on today's corridors fixed 3,741 s for 2035 and 2,715 s for 2040, the mix on the plan's lines with corridors extendable 2,342 s: 15 years at 1,165 to 4,580 s a year), which does not fit the chain's two-hour window in one piece and would have to run year by year in pieces that resume. At 25 days a year the same pass is 15 × 64 s, about 16 minutes of solver time
plus the pathcheck, and fits the window whole. Three to six passes of a chain (the calibration loops the c7 chains ran) multiply accordingly.

What it would need to build (after the soft link of (c), which it supersedes): (1) a year-stepping wrapper that carries
built capacities forward by vintage with retirements, the engine's build-rate caps and pace rules, the TDP lines at their
dates and the regional demand split by year (the regional demand file is one year; it would need the engine's growth and
block by area); (2) a regional adequacy rule, since the national chain's adequacy check (the engine's unserved-energy
standard on 20 weather years) has no ten-area form, and a myopic ten-area build that passes nationally can leave an area
short, which is what the Fossil-free 2040 case shows; (3) the within-area limits, or the result is the same lower bound
as here; (4) the costs by area where they differ (connection by area at least); (5) checks: a tie-out of every year's
no-limits case to the national chain's engine row (as 717 (c)), a recorded-run check in the style of validate_pathway_presets
for the ten-area chain, the week-engine comparison of 712 (e) at the chosen days, memory under 6 GB a solve and a pass
under two hours, and the counts in RESULTS. Order of work: the wrapper and the adequacy rule are each about two days, the
checks three; two weeks for a first chronological pass on 25 days a year, after the note.

### 722 (c): one soft link from the ten-area run to the national LP (design; nothing built)

What it is. The national build LP keeps its own shape (one bus, its representative days, its costs). The ten-area run supplies
two technology-specific inputs for one re-solve: a network curtailment share for each generating technology, and a corridor
charge per kW-year for each technology that replaces the flat integration charge. Both come from the ten-area run of the
build the national LP produced, so the link is one pass of a fixed-point loop; a second pass checks that the shares move by
less than the tolerance below.

The two inputs.

1. Network curtailment share c_t, per technology t (new wind, new solar, existing wind, existing solar, offshore where built),
   per model year with a run (2035 and 2040; years between them interpolated, years before 2035 taken as zero until a 2030 run
   exists): c_t = (curtailed energy of t in the ten-area case with today's corridors less one circuit and the TDP lines at
   their dates) less (curtailed energy of t in the no-limits case), divided by t's available energy. The no-limits subtraction
   keeps national oversupply where the national LP already sees it and passes only the part the network adds. Applied as a
   derate of the availability the national LP sees for t: the hourly per-unit series times (1 - c_t) on the representative
   days. A derate, not an energy haircut, so the LP still sees when t is curtailed only on average; the within-day shape of
   network curtailment is lost (it falls on windy and sunny hours), which overstates t's firm value a little. The alternative,
   a curtailment series by hour of the representative days from the ten-area run, carries the shape but ties the input to one
   weather year's days; it is the second step if the first moves the mix.
2. Corridor charge g_t, R per kW-year, per technology, replacing the flat integration charge (txRPerKWyr times the VRE share,
   R364/kW-yr at build 2026-11-05f): the annuity of the corridor capacity the extendable ten-area run builds (R per MW-km times
   MW-km, 40 years at the run's discount rate), allocated to new wind and new solar by each technology's share of the net
   export of the exporting areas in the hours the expanded corridors carry a shadow price in the fixed-corridor run, divided
   by that technology's new MW. Lithium gets no corridor charge (it sits where the LP puts it); open-cycle gas none. Where the
   extendable run builds nothing, g_t is zero and the connection charge alone remains. The allocation rule is the design's
   one judgement; the alternative (by new MW) is reported beside it.

Which national inputs change. (a) The availability series of new wind and new solar (and the existing fleet's, if c_ex is not
negligible) on the LP's representative days, by (1 - c_t). (b) The integration charge: bldGridCost's VRE term replaced by g_t
per technology; the connection charge (bldGridCapexKW) untouched. (c) Nothing else: costs, discount rate, the adequacy rule,
the commitment floor, the engine's checks stay. The engine's own pathcheck still runs with no network; the network effect
enters only through the LP's inputs.

What it needs from the main session. (1) A hook in the pathway chain that takes a per-technology availability derate by year
and a per-technology grid charge by year (two small JSON files) and applies them where the chain sets state.bldGridCost and
the wind correction: a state key or an environment variable read by the chain's pathway script, with a check that the
recorded run carries the values it used (as pathcheck checks pvTracking and cocCase now). (2) One chain run with them, and
its pathcheck. (3) Agreement on the allocation rule and the tolerance (shares moving by less than one point of availability
between passes, which is below the weather-year spread).

What this session does. The ten-area runs exist for the central build at 2035 and 2040 (both weather years); the script to
turn them into the two files is a morning's work (read the case JSONs, form c_t and g_t, write the files, print the table).

How many days. One day for the extraction script and the table (this session); one day for the chain hook (main session);
half a day for the chain run and pathcheck (about 10 minutes of solver time per pass at the recorded 300 to 700 s, the
pathcheck about 20 minutes); one day for the second ten-area pass on the new build and the convergence check (two engine
dumps, eight LP cases, about an hour of machine time); one day to write it up. Four working days end to end if the main
session's hook lands on day two, with the second pass optional.

What it does not do. It does not move storage or gas by area, does not price within-area limits, and does not change the
adequacy check; a build that passes the national check can still fail a regional one, which is the hard link (722 (b)).

## Message 727: the control's gap split, new wind's supply curve, the pending cases, sources for the corridor ratings (6 Nov 2026; nothing here is to be quoted)

### 727 (a): the control's gap from the run, split (build 2026-11-05f; 3-hour blocks, the run's own costs, the integration charge kept, no limits)

Cases, each from the control: area caps lifted (every area's new wind and solar unbounded, the regional series kept); one bus (every area's new wind and solar on the engine's national series, no caps, which with no limits is a copper plate on the national series); wind forced to the run's MW (a floor at the run's new wind, the rest free). Cost is new build plus fuel and carbon plus unserved energy at the value of lost load; the gap is the run's own mix on the same blocks less the case.

| year, weather year | case | wind GW (run) | solar GW (run) | lithium GW, GWh (run) | open cycle GW (run) | coal TWh | curtailed TWh | cost R bn | gap to the run R bn |
|---|---|---|---|---|---|---|---|---|---|
| 2035, 2025 | control (per-area series, approved caps) | 22.2 (27.2) | 13.7 (17.7) | 7.0, 25 (8.8, 38) | 0.00 (0.00) | 86.1 | 5.3 | 150.6 | 11.6 |
    wind by area GW: Northern Cape 10.3, Hydra Central 8.0, Eastern Cape 3.2, Kwazulu Natal 0.6; solar: Northern Cape 13.7
| 2035, 2025 | area caps lifted | 24.7 (27.2) | 9.7 (17.7) | 5.0, 16 (8.8, 38) | 0.00 (0.00) | 87.2 | 4.6 | 148.9 | 13.3 |
    wind by area GW: Northern Cape 20.5, Kwazulu Natal 2.2, Eastern Cape 2.1; solar: Northern Cape 9.7
| 2035, 2025 | one bus on the national series, no caps | 25.1 (27.2) | 12.6 (17.7) | 6.7, 26 (8.8, 38) | 0.00 (0.00) | 84.3 | 3.7 | 155.9 | 6.3 |
    wind by area GW: Gauteng 9.8, Kwazulu Natal 8.4, North West 4.9, Western Cape 1.2, Free State 0.7, Eastern Cape 0.1; solar: Kwazulu Natal 4.7, Gauteng 4.3, Eastern Cape 1.3, Western Cape 1.0, North West 0.9, Limpopo 0.4
| 2035, 2025 | wind forced to the run's MW | 27.2 (27.2) | 9.6 (17.7) | 5.9, 20 (8.8, 38) | 0.00 (0.00) | 82.2 | 9.3 | 152.4 | 9.8 |
    wind by area GW: Northern Cape 10.3, Hydra Central 8.3, Eastern Cape 6.2, Western Cape 1.4, Kwazulu Natal 0.6, North West 0.3; solar: Northern Cape 9.6
| 2035, 2025 | the run's fixed build in 6-hour blocks | pending (queue10d) | | | | | | | |
| 2035, 2015 | control (per-area series, approved caps) | 22.7 (27.2) | 12.8 (17.7) | 6.6, 27 (8.8, 38) | 0.00 (0.00) | 90.6 | 3.7 | 154.2 | 11.1 |
    wind by area GW: Northern Cape 10.3, Hydra Central 8.9, Eastern Cape 1.9, Kwazulu Natal 0.6, Mpumalanga 0.4, North West 0.3, Free State 0.2; solar: Western Cape 8.5, Northern Cape 3.5, Limpopo 0.8
| 2035, 2015 | area caps lifted | 24.8 (27.2) | 10.1 (17.7) | 4.5, 20 (8.8, 38) | 0.00 (0.00) | 90.4 | 3.3 | 152.4 | 12.9 |
    wind by area GW: Northern Cape 18.8, Kwazulu Natal 4.6, Hydra Central 1.4; solar: Western Cape 6.4, Northern Cape 2.9, Limpopo 0.9
| 2035, 2015 | one bus on the national series, no caps | 26.4 (27.2) | 11.9 (17.7) | 6.5, 27 (8.8, 38) | 0.46 (0.00) | 86.4 | 3.4 | 162.0 | 3.4 |
    wind by area GW: Gauteng 10.2, Kwazulu Natal 8.8, North West 5.0, Western Cape 1.4, Free State 0.6, Eastern Cape 0.4; solar: Kwazulu Natal 4.8, Gauteng 4.0, North West 0.9, Eastern Cape 0.9, Western Cape 0.8, Limpopo 0.5
| 2035, 2015 | wind forced to the run's MW | 27.2 (27.2) | 9.7 (17.7) | 6.1, 23 (8.8, 38) | 0.00 (0.00) | 84.6 | 6.4 | 154.5 | 10.9 |
    wind by area GW: Hydra Central 11.0, Northern Cape 10.3, Eastern Cape 4.7, Kwazulu Natal 0.6, North West 0.3, Free State 0.2; solar: Western Cape 8.0, Northern Cape 1.7
| 2040, 2025 | control (per-area series, approved caps) | 29.1 (40.7) | 31.9 (24.8) | 13.2, 87 (11.0, 61) | 1.08 (4.34) | 49.1 | 10.5 | 181.7 | 16.1 |
    wind by area GW: Hydra Central 11.2, Northern Cape 10.3, Eastern Cape 6.2, Kwazulu Natal 0.6, North West 0.3, Free State 0.2, Mpumalanga 0.2, Gauteng 0.1; solar: Northern Cape 31.9
| 2040, 2025 | area caps lifted | 39.8 (40.7) | 19.2 (24.8) | 10.3, 45 (11.0, 61) | 0.00 (4.34) | 47.8 | 13.7 | 171.6 | 26.2 |
    wind by area GW: Northern Cape 29.8, Kwazulu Natal 7.2, Eastern Cape 1.7, North West 1.1; solar: Northern Cape 19.2
| 2040, 2025 | one bus on the national series, no caps | 35.0 (40.7) | 28.1 (24.8) | 11.6, 60 (11.0, 61) | 3.98 (4.34) | 48.5 | 12.4 | 194.3 | 3.6 |
    wind by area GW: Gauteng 13.0, Kwazulu Natal 9.4, North West 5.3, Mpumalanga 2.5, Limpopo 2.1, Western Cape 1.5, Free State 1.1; solar: Gauteng 7.8, Kwazulu Natal 7.4, North West 3.4, Limpopo 3.4, Western Cape 2.2, Eastern Cape 2.1, Mpumalanga 1.6, Free State 0.3
| 2040, 2025 | wind forced to the run's MW | 40.7 (40.7) | 21.5 (24.8) | 11.2, 56 (11.0, 61) | 1.98 (4.34) | 46.1 | 19.4 | 186.6 | 11.3 |
    wind by area GW: Hydra Central 11.7, Northern Cape 10.3, Western Cape 8.6, Eastern Cape 6.2, Mpumalanga 2.7, Kwazulu Natal 0.6, North West 0.3, Free State 0.2, Gauteng 0.1; solar: Northern Cape 21.5
| 2040, 2015 | control (per-area series, approved caps) | 31.5 (40.7) | 33.5 (24.8) | 11.1, 68 (11.0, 61) | 1.75 (4.34) | 52.1 | 14.4 | 193.1 | 12.2 |
    wind by area GW: Hydra Central 11.3, Northern Cape 10.3, Eastern Cape 6.1, Mpumalanga 2.7, Kwazulu Natal 0.6, North West 0.3; solar: Western Cape 15.6, Limpopo 14.6, Free State 2.4, Northern Cape 1.0
| 2040, 2015 | area caps lifted | 37.5 (40.7) | 26.5 (24.8) | 10.4, 52 (11.0, 61) | 1.19 (4.34) | 48.9 | 16.3 | 186.1 | 19.1 |
    wind by area GW: Northern Cape 27.5, Kwazulu Natal 7.5, Eastern Cape 2.5; solar: Western Cape 16.4, Limpopo 8.7, Free State 1.4
| 2040, 2015 | one bus on the national series, no caps | pending | | | | | | | |
| 2040, 2015 | wind forced to the run's MW | 40.7 (40.7) | 25.6 (24.8) | 10.6, 59 (11.0, 61) | 1.67 (4.34) | 47.9 | 20.4 | 196.5 | 8.7 |
    wind by area GW: Hydra Central 11.7, Northern Cape 10.3, Western Cape 8.6, Eastern Cape 6.2, Mpumalanga 2.7, Kwazulu Natal 0.6, North West 0.3, Free State 0.2, Gauteng 0.1; solar: Western Cape 15.6, Limpopo 9.6, Free State 0.4
| 2040, 2015 | control (per-area series, approved caps) (6-hour blocks) | 31.0 (40.7) | 34.1 (24.8) | 9.0, 69 (11.0, 61) | 1.74 (4.34) | 50.0 | 13.1 | 189.7 | 13.0 |
    wind by area GW: Hydra Central 11.7, Northern Cape 10.3, Eastern Cape 5.3, Mpumalanga 2.7, Kwazulu Natal 0.6, North West 0.3; solar: Western Cape 15.6, Limpopo 10.4, Northern Cape 4.8, Free State 3.4
| 2040, 2015 | area caps lifted (6-hour blocks) | 36.7 (40.7) | 26.4 (24.8) | 8.6, 52 (11.0, 61) | 1.17 (4.34) | 48.8 | 13.7 | 183.5 | 19.2 |
    wind by area GW: Northern Cape 26.8, Kwazulu Natal 8.5, Eastern Cape 1.5; solar: Western Cape 19.9, Limpopo 6.5
| 2040, 2015 | one bus on the national series, no caps (6-hour blocks) | 37.3 (40.7) | 27.3 (24.8) | 7.6, 49 (11.0, 61) | 3.25 (4.34) | 50.2 | 15.3 | 201.1 | 1.6 |
    wind by area GW: Gauteng 13.7, Kwazulu Natal 9.5, North West 5.7, Mpumalanga 2.8, Limpopo 2.1, Western Cape 1.8, Free State 1.3, Eastern Cape 0.4; solar: Kwazulu Natal 7.8, Gauteng 7.4, Limpopo 3.4, North West 3.2, Western Cape 2.0, Eastern Cape 1.9, Mpumalanga 1.5, Free State 0.2
| 2040, 2015 | wind forced to the run's MW (6-hour blocks) | 40.7 (40.7) | 24.5 (24.8) | 7.2, 45 (11.0, 61) | 2.01 (4.34) | 48.6 | 19.7 | 193.8 | 8.9 |
    wind by area GW: Hydra Central 11.7, Northern Cape 10.3, Western Cape 8.6, Eastern Cape 6.2, Mpumalanga 2.7, Kwazulu Natal 0.6, North West 0.3, Free State 0.2, Gauteng 0.1; solar: Western Cape 15.6, Limpopo 6.0, Free State 1.6, Hydra Central 0.8, Northern Cape 0.5

Reading, 2035 on weather 2025 (the 2040 cases and the weather-2015 set are filled in as they land). The control's gap to the run is R11.6bn a year with 5.0 GW less wind. (1) Area caps: lifted, the LP takes 2.5 GW more wind (24.7 GW, 20.5 of it in the Northern Cape, whose approved 10.3 GW was the binding cap) and 4 GW less solar, and is R1.7bn a year cheaper, so the caps cost the LP R1.7bn and hold 2.5 GW of wind out of its mix; they are not a reason for the gap, they narrow it. (2) Regional resource: on one bus with the engine's national series the LP takes 25.1 GW of wind and 12.6 of solar and costs R155.9bn, R5.3bn a year more than with its own regional siting, so the regional series (the three best areas at 0.43 to 0.46 against the national 0.415) are worth R5.3bn a year to the LP and are 45% of the gap; the gap left on one bus is R6.3bn. (3) Wind forced to the run's 27.2 GW: the LP drops solar to 9.6 GW and lithium to 5.9 GW / 20 GWh, curtails 9.3 TWh (the run 9.8) and costs R152.4bn, R1.8bn a year above its own choice, R360,000 per MW-year on the 5.0 GW it did not want, which is the LP's margin between the run's wind and its own solar and lithium at those costs; the gap left to the run is then R9.8bn, the cost of the run's other choices (4 GW more solar, 3 GW more lithium) at the LP's valuation. So in 2035 the regional resource explains about R5bn of the R11.6bn, the caps work the other way by R1.7bn, the run's extra wind costs the LP R1.8bn to accept, and R6 to 10bn is left for the adequacy standard, the day weighting and the coupling across years, which this LP cannot see. 2040 on weather 2025 (the run 40.7 GW of wind against the control's 29.1; the gap R16.1bn a year). (1) Area caps: lifted, the LP builds 39.8 GW of wind, the run's within a gigawatt (29.8 of it in the Northern Cape, three times its approved record), 19.2 GW of solar against the control's 31.9 and 10.3 GW / 45 GWh of lithium against 13.2 / 87, and is R10.1bn a year cheaper than its capped control (R171.6bn; the gap to the run R26.2bn). (2) Regional resource: on one bus with the engine's national series the LP builds 35.0 GW of wind, 28.1 of solar, 11.6 GW / 60 GWh of lithium and 4.0 GW of open cycle (the run 4.3) and costs R194.3bn, R12.6bn a year more than with its own regional siting, so the regional series are worth R12.6bn to the LP, 78% of the gap, and the gap left on one bus is R3.6bn. (3) Wind forced to the run's 40.7 GW: the LP fills the Western Cape (8.6 GW) and Mpumalanga (2.7) after the three best areas, drops solar to 21.5 GW and lithium to 11.2 GW / 56 GWh, curtails 19.4 TWh (the run 22.1) and costs R186.6bn, R4.9bn a year above its own choice, R420,000 per MW-year on the 11.6 GW it did not want (R360,000 in 2035); the gap left is R11.3bn. So of 2040's 29.1 against 40.7 GW: 10.7 GW is the area caps, which hold the LP's wind out of the best areas; the regional resource is worth R12.6bn of the R16.1bn and would have the LP build 5.9 GW more wind on the national series than on its own, because on one series solar and wind are closer substitutes; and R3.6bn a year is left for the adequacy standard, the day weighting and the coupling across years, which this LP cannot see, against R6.3bn in 2035. The run's extra wind costs the LP R4.9bn a year to accept. Weather 2015, 2035 (the control 22.7 GW of wind, the gap R11.1bn): caps lifted 24.8 GW (18.8 of it in the Northern Cape), R1.8bn cheaper, the gap R12.9bn; one bus on the national series 26.4 GW of wind and 11.9 of solar at R162.0bn, R7.8bn more than the regional siting (70% of the gap), the gap left R3.4bn; wind forced to 27.2 GW costs the LP only R0.3bn a year (R67,000 per MW-year on 4.5 GW; the LP is close to indifferent on this weather year, where it takes 22.7 GW unforced), the gap left R10.9bn. So the split holds its shape across the weather years: the caps work against the LP by R1.7 to 1.8bn, the regional resource is worth R5.3 to 7.8bn (45 to 70% of the 2035 gap) and R12.6bn in 2040, R3.4 to 3.6bn is left on one bus in every case run, and the run's extra wind costs the LP R0.3 to 1.8bn in 2035 and R4.9bn in 2040. 2040 on weather 2015, first row: caps lifted, the LP builds 37.5 GW of wind (27.5 in the Northern Cape) against the control's 31.5 and the run's 40.7, R7.0bn cheaper (R186.1bn; the gap R19.1bn), so the caps are 6 of the 9 GW on that weather year. Wind forced to 40.7 GW on weather 2015: the LP keeps 25.6 GW of solar and 10.6 GW / 59 GWh of lithium, curtails 20.4 TWh (the control 14.4) and costs R196.5bn, R3.4bn a year above its own choice, R370,000 per MW-year on the 9.2 GW it did not want (R420,000 on weather 2025), and the gap left is R8.7bn. The one-bus case on weather 2015 in 3-hour blocks did not finish in a two-hour window (6,830 s, 59,000 primal infeasibilities left), so the 2040 weather-2015 split is repeated in 6-hour blocks, all four cases with the run's own fixed build at the same block length, labelled in the table. The 6-hour rows agree with the 3-hour ones where both exist (the control's gap R13.0bn against R12.2bn, caps lifted R19.2bn against R19.1bn, wind forced R8.9bn against R8.7bn), so the one-bus row can be read from them: on one bus with the national series the LP builds 37.3 GW of wind and 27.3 of solar at R201.1bn, R11.4bn a year more than with its own regional siting, 88% of the gap, and R1.6bn is left. So on weather 2015 the 2040 regional resource is worth R11.4bn of R13.0bn against R12.6bn of R16.1bn on weather 2025, and the remainder on one bus is R1.6 to 3.6bn across the two weather years in 2040 and R3.4 to 6.3bn in 2035.

### 727 (b): new wind's supply curve by area (build 2026-11-05f)

The approved capacity by area (REEA records, status Approved, as the siting of 718 (e) uses) in the order of the capacity factor the LP sees: the regional modern-turbine series, scaled so that the approved-share fleet's energy equals the engine's national new-wind series (the scaling is the same factor for every area, so the order and the spread are the regional data's, the level the engine's). Beside it the unscaled series, and the LP's choice in each control. Caveat (user, message 727): approved records are not a resource limit; the curve is the approved pipeline in capacity-factor order, not the country's wind resource, and the Western Cape's 17.8 GW sits where it does because of its records' series, not because the Cape's wind is used up.

Weather year 2025. national new-wind series (the engine's, engine_final_2035_wy2025.json): capacity factor 0.4154; existing-fleet series 0.3539; the regional series are scaled so that the approved-share fleet's energy equals the national series' (factor in the case notes) The engine's national new-wind series is the 42% figure of the model's cost basis (41.5% on this weather year, 39.3% on 2015); the Bid Window 6 wind bids' own capacity factor is 37.24% (RESULTS, 'New wind's capacity factor').

| area | capacity factor, regional series as scaled | unscaled modern-turbine series | approved MW | cumulative MW | LP wind MW, 2035 | LP wind MW, 2040 |
|---|---|---|---|---|---|---|
| Hydra Central | 0.458 | 0.478 | 11,684 | 11,684 | 8,028 | 11,151 |
| Northern Cape | 0.444 | 0.464 | 10,344 | 22,028 | 10,344 | 10,344 |
| Eastern Cape | 0.431 | 0.450 | 6,190 | 28,218 | 3,153 | 6,190 |
| Western Cape | 0.389 | 0.407 | 17,805 | 46,023 | 0 | 0 |
| KwaZulu-Natal | 0.378 | 0.396 | 649 | 46,672 | 649 | 649 |
| Free State | 0.359 | 0.375 | 190 | 46,862 | 0 | 190 |
| North West | 0.344 | 0.360 | 350 | 47,212 | 0 | 350 |
| Mpumalanga | 0.292 | 0.305 | 2,680 | 49,892 | 0 | 184 |
| Gauteng | 0.258 | 0.269 | 75 | 49,967 | 0 | 75 |
| Limpopo | 0.256 | 0.268 | 0 | 49,967 | 0 | 0 |
| total | | | 49,967 | | 22,174 | 29,133 |

Weather year 2015. national new-wind series (the engine's, engine_final_2035_wy2015.json): capacity factor 0.3926; existing-fleet series 0.3328; the regional series are scaled so that the approved-share fleet's energy equals the national series' (factor in the case notes)

| area | capacity factor, regional series as scaled | unscaled modern-turbine series | approved MW | cumulative MW | LP wind MW, 2035 | LP wind MW, 2040 |
|---|---|---|---|---|---|---|
| Hydra Central | 0.442 | 0.470 | 11,684 | 11,684 | 8,928 | 11,320 |
| Northern Cape | 0.427 | 0.454 | 10,344 | 22,028 | 10,344 | 10,344 |
| Eastern Cape | 0.384 | 0.409 | 6,190 | 28,218 | 1,893 | 6,117 |
| KwaZulu-Natal | 0.376 | 0.400 | 649 | 28,868 | 649 | 649 |
| Free State | 0.375 | 0.400 | 190 | 29,058 | 190 | 0 |
| North West | 0.370 | 0.394 | 350 | 29,408 | 350 | 350 |
| Western Cape | 0.357 | 0.380 | 17,805 | 47,212 | 0 | 0 |
| Mpumalanga | 0.315 | 0.335 | 2,680 | 49,892 | 372 | 2,680 |
| Gauteng | 0.281 | 0.299 | 75 | 49,967 | 0 | 0 |
| Limpopo | 0.276 | 0.294 | 0 | 49,967 | 0 | 0 |
| total | | | 49,967 | | 22,727 | 31,461 |

Reading. The LP's wind sits on the top of the curve: the three areas above 0.43 (Hydra Central, Northern Cape, Eastern Cape; 28.2 GW approved) and the small Free State, North West and KwaZulu-Natal records. In 2035 it stops at 22 GW inside the top three, a cost choice at those capacity factors; in 2040 it fills them and the small records (29.1 GW on weather 2025, 31.5 on 2015, the last with Mpumalanga's 2.7 GW at 0.315) and declines the next step, the Western Cape's 17.8 GW at 0.389 (0.357 on weather 2015), six to ten points below the national series the pathway's marginal wind runs on. That is the regional-resource part of the 2040 gap: the pathway builds its 41st gigawatt at the national 41.5%, the ten-area LP would have to build it at 38.9% or less, and at the run's costs it takes solar and lithium instead. How much of the gap that is, against the caps and the rest, is the split of (a).

### 727 (c): the pending cases

Done above (718 (f) and 722 (a)): 2040 priced corridors (R3.4bn a year, 20.1 GW), the full TDP priced (2035 R1.0bn and 5.9 GW, 2040 R1.2bn and 9.2 GW) and fixed (2035, R2.8bn above the control), the capped control (the same mix and cost as the control), weather 2015 (the controls and the 2035 priced case; the 2040 priced case on weather 2015 is in the queue), and Fossil-free's free mix (6-hour blocks; badly posed for that build as written; the no-gas, lithium-held variant run on the rebuilt table, in 722 (a)'s reading). Corridors beyond the full TDP at R21,700 per MW-km (the free mix, 3-hour blocks, on the rebuilt table per 738 (f): the plan's lines first, N-1 once, corridors at the run's 0.071, the integration charge removed). 2035: the LP builds 23.0 GW of wind, 16.3 of solar and 6.9 GW / 24 GWh of lithium, and 8.8 GW of corridor beyond the plan (Free State to Northern Cape 7.8, Free State to Gauteng 1.0) for R1.25bn a year; coal 81 TWh, curtailment 8.5; cost R138.2bn against the control's R137.6bn without the charge, so with the plan's lines in place and the rest priced at R21,700 the 2035 network costs R0.6bn a year in this framing (R1.0bn at R10,000 on the old table's mapping). 2040: 27.3 GW of wind, 39.9 of solar, 14.4 GW / 97 GWh of lithium and 0.0 GW of open cycle, with 15.4 GW of corridor beyond the plan (Free State to Northern Cape 11.2, Free State to Gauteng 4.2) for R2.06bn a year; coal 45 TWh, curtailment 14.1; cost R160.6bn against the control's R159.5bn without the charge, a network cost of R1.1bn a year with the plan's lines in place and the rest at R21,700 (R1.2bn at R10,000 on the old table's mapping). The fixed-build form at R21,700 from today's network is in 738 (b).

### 727 (d): public sources that could check the Free State hub and Karoo corridor ratings

The corridor table (St Clair sums over PyPSA-RSA's shapefile, two corridors estimated) is the weak point of every 2040 result above. Sources that carry the figures to check it against, none read for this note:

1. Eskom's Transmission Development Plan (the TDP 2025 to 2034 document, published on the Eskom website under Transmission; a long PDF): its network diagrams give each main transmission line's voltage and the number of circuits by corridor, and its supply-area sections state the transfer limits the planners use (the Cape corridor and the Central corridor, which are the Karoo exits here; the Free State and Gauteng supply areas, which are the hub), with the lines by in-service year. It is the primary source for both the ratings and the TDP dates the model uses.
2. The Generation Connection Capacity Assessment (GCCA 2025, Eskom, same site): capacity available to connect by main transmission substation and supply area. It is a connection figure, not a corridor rating, so it checks the within-area limits the model lacks rather than the corridor table.
3. The NTCSA's grid capacity publications (the Transmission Network Capacity statements from 2024, under the National Transmission Company South Africa): corridor and supply-area limits, the figures the user has ruled out of anything for publication; they can check the table in private.
4. The SAPP Pool Plan (Southern African Power Pool, 2017 revision, public): line ratings for the 765 and 400 kV backbone by circuit, which cover the Hydra to Cape and Free State lines.
5. The IRP 2019 and its 2023 draft (DMRE): the transmission annexure states the corridor expansions the plan assumes and their capacities, a cross-check on the TDP's additions rather than on today's ratings.
6. PyPSA-RSA's own documentation (the repository and the 2023 paper): states which line parameters the shapefile carries and how its authors rated them, so the St Clair assumption here can be compared with theirs.

The rule that this session reads nothing from eskom.co.za and no long PDFs stands, so items 1 and 2 are for the user or a later session to fetch; item 4 and 6 are open web pages.

## Message 729: a regional cap on the freed-coal connection credit (6 Nov 2026; build 2026-11-05f, the every-change pass; report only, nothing changes in the national model; corrected per message 732: lithium pays no grid charge and cannot use the credit, and the effect of a cap is the credit it removes)

The rule as the pathway runs it (RESULTS, 'c5b build', message 74; index.html, rppool): new solar, storage and gas may take a connection freed by retired coal, in total no more than the coal retired so far, nationally; each MW on one avoids its grid cost from then on; wind is barred (FIXED.bldRpExclude = wind in the chains). The page's own default bars nothing, so wind may take them too. Lithium's grid cost in the build LP is nil, so it takes nothing from the pool in practice (the run's pool is solar, and in 2040 the new pumped storage), and it is left out of the eligible plants here. The credit is valued at the integration charge the mix cases use, R364 per kW-year (about R146 per MWh to solar at 28.5%), on the MW that could sit on a freed connection in the same area as the retired coal, and in the same or a neighbouring area (neighbours by the corridor table; the matching a transportation LP). Retired coal by area: the page's unit list (UC_FLEET) with its decommissioning years, scaled to the engine's cumulative retirement in the year. New plants by area: the approved-record shares that 718 (e)'s siting uses (wind and solar by the REEA records, gas at Richards Bay, new pumped storage at Tubatse), and the LP's own choice in the 718 (f) control (no limits, the run's costs; its gas in the Western Cape). Script: docs/regional-audit/rpcap.py; output rpcap_out.md.

### 2035

New-solar capacity factor by area (the regional tracking series as scaled; national 0.286): Northern Cape 0.304, Western Cape 0.294, Hydra Central 0.287, North West 0.284, Free State 0.277, Eastern Cape 0.272, Mpumalanga 0.271, Gauteng 0.270, Limpopo 0.261, KwaZulu-Natal 0.242; new wind: Hydra Central 0.458, Northern Cape 0.444, Eastern Cape 0.431, Western Cape 0.389, KwaZulu-Natal 0.378, Free State 0.359, North West 0.344, Mpumalanga 0.292, Gauteng 0.258, Limpopo 0.256
Build 2026-11-05f, 2035: coal retired 14,307 MW of 39,692 (the fleet list's retired units 16,273 MW, scaled); the run's pool 14,306 MW (pv 14,306) = R5.21bn a year at R364 per kW-year; new wind 27,246, solar 17,711, lithium 8,811, gas 0, pumped storage 0 MW.

| area | coal retired MW | new MW, approved-record shares (wind; solar, lithium, gas, pumped) | new MW, LP siting (wind; solar, lithium, gas, pumped) | neighbours |
|---|---|---|---|---|
| Mpumalanga | 14,166 | 1,461; 517, 0, 0, 0 | 0; 0, 0, 0, 0 | Free State, Gauteng, KwaZulu-Natal, Limpopo, North West |
| Gauteng | 141 | 41; 403, 0, 0, 0 | 0; 0, 2,484, 0, 0 | Free State, Limpopo, Mpumalanga, North West |
| Eastern Cape | 0 | 3,376; 176, 0, 0, 0 | 3,153; 0, 500, 0, 0 | Free State, Hydra Central, KwaZulu-Natal |
| Limpopo | 0 | 0; 2,007, 0, 0, 0 | 0; 0, 3,774, 0, 0 | Gauteng, Mpumalanga, North West |
| Western Cape | 0 | 9,708; 1,994, 0, 0, 0 | 0; 0, 0, 0, 0 | Hydra Central, North West, Northern Cape |
| Northern Cape | 0 | 5,640; 4,374, 2,203, 0, 0 | 10,344; 13,732, 0, 0, 0 | Free State, Hydra Central, North West, Western Cape |
| Hydra Central | 0 | 6,371; 2,311, 0, 0, 0 | 8,028; 0, 0, 0, 0 | Eastern Cape, Free State, Northern Cape, Western Cape |
| KwaZulu-Natal | 0 | 354; 122, 0, 0, 0 | 649; 0, 0, 0, 0 | Eastern Cape, Free State, Mpumalanga |
| North West | 0 | 191; 3,161, 3,496, 0, 0 | 0; 0, 0, 0, 0 | Free State, Gauteng, Limpopo, Mpumalanga, Northern Cape, Western Cape |
| Free State | 0 | 104; 2,646, 3,112, 0, 0 | 0; 0, 284, 0, 0 | Eastern Cape, Gauteng, Hydra Central, KwaZulu-Natal, Mpumalanga, North West, Northern Cape |

| siting | rule | eligible new MW (solar, gas, pumped storage; wind where allowed; no lithium) | usable in the same area, MW (R bn a year) | removed by a same-area cap, R bn a year | usable in the same or a neighbouring area, MW (R bn a year) | removed by a neighbour cap, R bn a year | the run takes, MW (R bn a year) |
|---|---|---|---|---|---|---|---|
| approved-record shares | pathway (wind barred) | 17,711 | 658 (R0.24bn) | R4.97bn | 8,856 (R3.22bn) | R1.98bn | 14,306 (R5.21bn) |
| approved-record shares | the page's (wind allowed) | 44,957 | 2,119 (R0.77bn) | R4.44bn | 11,007 (R4.01bn) | R1.20bn | 14,306 (R5.21bn) |
| the LP's choice (control) | pathway (wind barred) | 13,732 | 0 (R0.00bn) | R5.21bn | -0 (R-0.00bn) | R5.21bn | 14,306 (R5.21bn) |
| the LP's choice (control) | the page's (wind allowed) | 35,907 | 0 (R0.00bn) | R5.21bn | 649 (R0.24bn) | R4.97bn | 14,306 (R5.21bn) |

### 2040

New-solar capacity factor by area (the regional tracking series as scaled; national 0.286): Northern Cape 0.304, Western Cape 0.294, Hydra Central 0.287, North West 0.284, Free State 0.277, Eastern Cape 0.272, Mpumalanga 0.271, Gauteng 0.270, Limpopo 0.261, KwaZulu-Natal 0.242; new wind: Hydra Central 0.458, Northern Cape 0.444, Eastern Cape 0.431, Western Cape 0.389, KwaZulu-Natal 0.378, Free State 0.359, North West 0.344, Mpumalanga 0.292, Gauteng 0.258, Limpopo 0.256
Build 2026-11-05f, 2040: coal retired 22,333 MW of 39,692 (the fleet list's retired units 19,777 MW, scaled); the run's pool 22,333 MW (pv 20,833, phes 1,500) = R8.13bn a year at R364 per kW-year; new wind 40,722, solar 24,831, lithium 11,004, gas 5,611, pumped storage 1,500 MW.

| area | coal retired MW | new MW, approved-record shares (wind; solar, lithium, gas, pumped) | new MW, LP siting (wind; solar, lithium, gas, pumped) | neighbours |
|---|---|---|---|---|
| Mpumalanga | 20,143 | 2,184; 725, 0, 0, 0 | 184; 0, 0, 0, 0 | Free State, Gauteng, KwaZulu-Natal, Limpopo, North West |
| Gauteng | 2,190 | 61; 565, 0, 0, 0 | 75; 0, 10,066, 0, 0 | Free State, Limpopo, Mpumalanga, North West |
| Eastern Cape | 0 | 5,045; 247, 0, 0, 0 | 6,190; 0, 226, 0, 0 | Free State, Hydra Central, KwaZulu-Natal |
| Limpopo | 0 | 0; 2,814, 0, 0, 1,500 | 0; 0, 1,512, 0, 1,500 | Gauteng, Mpumalanga, North West |
| Western Cape | 0 | 14,510; 2,795, 0, 0, 0 | 0; 0, 0, 1,082, 0 | Hydra Central, North West, Northern Cape |
| Northern Cape | 0 | 8,430; 6,133, 2,751, 0, 0 | 10,344; 31,890, 0, 0, 0 | Free State, Hydra Central, North West, Western Cape |
| Hydra Central | 0 | 9,522; 3,240, 0, 0, 0 | 11,151; 0, 0, 0, 0 | Eastern Cape, Free State, Northern Cape, Western Cape |
| KwaZulu-Natal | 0 | 529; 170, 0, 5,611, 0 | 649; 0, 0, 0, 0 | Eastern Cape, Free State, Mpumalanga |
| North West | 0 | 285; 4,432, 4,366, 0, 0 | 350; 0, 0, 0, 0 | Free State, Gauteng, Limpopo, Mpumalanga, Northern Cape, Western Cape |
| Free State | 0 | 155; 3,710, 3,887, 0, 0 | 190; 0, 1,446, 0, 0 | Eastern Cape, Gauteng, Hydra Central, KwaZulu-Natal, Mpumalanga, North West, Northern Cape |

| siting | rule | eligible new MW (solar, gas, pumped storage; wind where allowed; no lithium) | usable in the same area, MW (R bn a year) | removed by a same-area cap, R bn a year | usable in the same or a neighbouring area, MW (R bn a year) | removed by a neighbour cap, R bn a year | the run takes, MW (R bn a year) |
|---|---|---|---|---|---|---|---|
| approved-record shares | pathway (wind barred) | 31,942 | 1,290 (R0.47bn) | R7.66bn | 19,528 (R7.11bn) | R1.02bn | 22,333 (R8.13bn) |
| approved-record shares | the page's (wind allowed) | 72,664 | 3,536 (R1.29bn) | R6.84bn | 22,333 (R8.13bn) | R0.00bn | 22,333 (R8.13bn) |
| the LP's choice (control) | pathway (wind barred) | 34,472 | 0 (R0.00bn) | R8.13bn | 1,500 (R0.55bn) | R7.58bn | 22,333 (R8.13bn) |
| the LP's choice (control) | the page's (wind allowed) | 63,606 | 259 (R0.09bn) | R8.04bn | 2,948 (R1.07bn) | R7.06bn | 22,333 (R8.13bn) |

### Reading

1. The retired coal is Mpumalanga's: 14.2 of the 14.3 GW retired by 2035 and 20.1 of 22.3 GW by 2040 (the rest Gauteng), on the unit list's dates. Nothing in Limpopo or the Free State is retired by 2040.
2. Same-area cap, approved-record shares: the plants that could use those connections are Mpumalanga's and Gauteng's own approved solar, 0.7 GW in 2035 and 1.3 GW in 2040. The cap removes R5.0bn a year of the R5.2bn the run takes in 2035 and R7.7bn of R8.1bn in 2040 (95%).
3. Same-or-neighbouring cap, approved-record shares: Mpumalanga's neighbours (the North West, Free State, Limpopo, Gauteng, KwaZulu-Natal) hold 8.3 GW of the records' solar in 2035, so 8.9 GW of the pool is usable and the cap removes R2.0bn a year; in 2040 they hold 11.7 GW of solar, the 1.5 GW of pumped storage and 5.6 GW of gas at Richards Bay, so 19.5 GW is usable and the cap removes R1.0bn.
4. On the LP's own siting the control puts every megawatt of solar in the Northern Cape, which neighbours neither Mpumalanga nor Gauteng, so either cap removes the whole credit in 2035 (R5.2bn) and all but the pumped storage's R0.55bn in 2040 (R7.6bn removed).
5. Wind allowed (the page's rule) adds Mpumalanga's approved wind, 1.5 GW in 2035 and 2.2 GW in 2040, under the same-area cap, and the Western Cape's and Eastern Cape's wind does not reach: the removed credit falls to R4.4bn and R6.8bn (same area) and R1.2bn and nil (neighbour) on the shares. At a flat R364 per kW-year the choice of technology changes who takes the credit, not its rand.

Whether it is large enough to change the mix. On the basis of message 732 the effect of a cap is the credit it removes: R5.0bn a year in 2035 and R7.7bn in 2040 at the same-area cap on the records' siting, R2.0bn and R1.0bn at the neighbour cap, and R5.2bn and R7.6bn on the LP's siting under either. Against the LP's gap to the run (R11.6bn in 2035, R16.1bn in 2040, 718 (f)) the same-area cap is 43% and 48% of it, so it is not small: a run that lost the credit would be dearer by nearly half the gap the LP finds. Whether it moves wind against solar is a different question. The credit is worth about R146 per MWh to solar (R364 per kW-year at 28.5%), and wind is barred from it, so on the run's rule solar with the credit costs about R493 per MWh against R639 without it and wind's R693 at the national 41.5%; solar sits below wind per MWh either way, and what decides between them in the LP is the evening and the winter, which a per-MWh figure does not carry. The test is the free mix with the integration charge kept, run with and without the credit on the pathway rule (new solar up to the run's pool, 14,306 MW in 2035 and 22,333 in 2040, without the charge; wind barred), 2035 and 2040 on weather 2025: in the queue (queue13.sh), the control without the credit being the 718 (f) control. First result, 2035: with the credit on the pool (14,306 MW of solar without the charge, worth R5.21bn a year) the LP builds 14.3 GW of solar against 13.7 without it and 21.9 GW of wind against 22.2, lithium 7.1 GW against 7.0, coal and curtailment within 1 TWh, and its cost falls by R5.2bn, the credit itself: the credit is pocketed on solar the LP was building anyway and moves 0.3 GW of wind to 0.6 GW of solar, no more. Set beside the wind-forced case of 727 (a), where the run's 5 GW of extra wind costs the LP R1.8bn a year (R360,000 per MW-year, about the integration charge), the credit is of the size that would move wind if wind could have it, and does not move it when solar has it, because the LP's solar is limited by the midday it fills, not by its cost. 2040: with the credit on the pool (22,333 MW, R8.13bn a year) the LP builds the same mix to the decimal (29.1 GW of wind, 31.9 of solar, 13.2 GW / 87 GWh of lithium, 1.1 GW of open cycle) and its cost falls by the credit; curtailment moves 0.4 TWh. So on the test's accounting the credit does not move wind against solar in either year: it is a transfer on solar the LP builds anyway, 0.6 GW of extra solar in 2035 and none in 2040. The same pair on the run's accounting (the Cape allowance and the integration charge on gas as well, with and without the pool; message 738 (d) and (f)) is in queue15; its 2035 pair is in: with the Cape allowance and the gas charge on both, the control without the pool builds 22.8 GW of wind and 13.2 of solar (R149.7bn), with the pool 22.1 and 14.3 (R144.5bn), so on the repriced costs the credit moves 0.7 GW of wind to 1.1 GW of solar in 2035, against 0.3 to 0.6 on the test's accounting, and the gap to the run is R12.0bn without the pool and R11.9bn with it. The 2040 pair on the repriced costs: without the pool the control builds 30.0 GW of wind and 32.9 of solar at R181.2bn, with the pool 30.0 and 32.9 at R173.0bn, the same mix to the decimal, the cost lower by the R8.1bn credit, and the gap to the run R19.2bn without it and R19.2bn with it. So on the run's accounting, as on the test's, the credit moves 0.7 GW of wind in 2035 and nothing in 2040. The judgement, amended (message 756 (d)): the credit is a transfer of R5 to 8bn a year on solar, and it moves the mix only where it reaches the margin. In the ten-area LP the credit covers the first 14,306 (2035) or 22,333 MW (2040) of solar; the 2035 LP's solar with the credit equals the pool (14.3 GW), so the credit sits at the margin and moves 0.3 to 0.7 GW of wind, while the 2040 LP builds 31.9 GW of solar, 9.6 GW beyond the pool with or without the credit, so the credit is inframarginal there and the mix is the same to the decimal. The main session's pathway pass with the same-area cap (claude/c7-runs, RESULTS 'The 7 Nov table', d2672c5) moves 2040 solar from 24.3 to 20.6 GW and wind from 43.8 to 45.3 for R21.7bn on its LP: its 2040 solar sits within 2 GW of the 22.3 GW pool, so the cap reaches its margin, and its LP carries the adequacy standard and the coupling across years, which price the marginal solar and wind differently from this one-year LP. So a cap changes the run's cost by nearly half the ten-area gap and changes its mix where the credited solar is marginal, by 3.7 GW of solar and 1.5 of wind in the pathway's own 2040; it does not change this LP's 2040 mix because this LP's solar is not at the pool.

## Message 731 (and 737): battery against corridor on the central build (build 2026-11-05f, the every-change pass; the first cut of 737: weather 2025, 2035 and 2040, today's corridors and the TDP's lines, lithium at 4 h in steps of 2, 5 and 10 GW against corridors at R21,700 per MW-km; nothing to be quoted)

Method. The fixed build of 722 (a) (the run's own plants, hourly, no commitment floor, losses off) on today's corridors with one circuit dropped, and on the full TDP's lines by their dates. Lithium is added at the four binding exits (North West, Northern Cape, Hydra Central, Eastern Cape) in equal shares, cyclic, at the build's own lithium costs (power and energy annuities from the dump's cost block), and compared with corridor additions at R21,700 per MW-km (and R10,000 where run) whose annual cost is capped at the lithium step's; the LP chooses which corridors. A budget above the unconstrained expansion's cost repeats the unconstrained case, which stands for it. Annual cost is fuel and carbon plus unserved energy at the value of lost load plus the addition's annuity; the build's own annuities are the same in every row and left out.

### 731: battery against corridor (net figures at both values of unserved energy, R12,300 per MWh, the engine's cost of load shedding, first, and R87,000, the LP's penalty; message 754) (build 2026-11-05f, the every-change pass; the rebuilt corridor table, N-1 once, corridors at the run's 0.071; fixed build, hourly, no commitment floor, losses off; lithium at the four exits in equal shares at the build's own lithium costs; corridor additions capped at the same annual cost)

2035, weather 2025, the LP's own lithium (3-hour blocks): 1.9 GW / 18 GWh (Hydra Central 1.3, Eastern Cape 0.6)

| addition | curtailed TWh | coal TWh | gas and diesel TWh | unserved GWh | fuel and carbon R bn | addition, gross R bn a year | saves in fuel and carbon | saves in unserved energy at R12,300 per MWh | net cost at R12,300, R bn a year | saves in unserved energy at R87,000 | net cost at R87,000 | sign of the net between the two | annual cost at R12,300 R bn | annual cost at R87,000 | corridors built |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| none | 55.4 | 114.1 | 0.61 | 96.4 | 83.53 | 0.00 | - | - | - | - | - | - | 84.72 | 91.92 |
| lithium 2 GW at 4 h | 54.2 | 113.1 | 0.53 | 65.9 | 82.31 | 2.79 | 1.22 | 0.37 | 1.20 | 2.65 | -1.08 | changes | 85.91 | 90.84 |
| corridors at R10,000 per MW-km for the same R2.79bn: 31.7 GW (the unconstrained expansion, whose cost is below the budget) | 3.4 | 63.2 | 0.19 | 0.0 | 45.34 | 2.31 | 38.19 | 1.19 | -37.07 | 8.38 | -44.27 | same | 47.65 | 47.65 | Free State to Northern Cape 13.8; Free State to Gauteng 8.3; Northern Cape to Western Cape 4.7; Hydra Central to Northern Cape 3.0; Eastern Cape to Kwazulu Natal 1.9
| corridors at R21,700 per MW-km for the same R2.79bn: 18.0 GW | 10.0 | 69.4 | 0.19 | 0.0 | 49.68 | 2.79 | 33.85 | 1.19 | -32.25 | 8.38 | -39.44 | same | 52.47 | 52.47 | Free State to Northern Cape 9.1; Free State to Gauteng 4.0; Northern Cape to Western Cape 1.8; Hydra Central to Northern Cape 1.7; Eastern Cape to Kwazulu Natal 1.3
| lithium 2 GW at 8 h | 53.5 | 112.5 | 0.46 | 54.5 | 81.52 | 4.80 | 2.02 | 0.52 | 2.27 | 3.64 | -0.86 | changes | 86.99 | 91.06 |
| corridors at R10,000 per MW-km for the same R4.80bn: 31.7 GW (the unconstrained expansion, whose cost is below the budget) | 3.4 | 63.2 | 0.19 | 0.0 | 45.34 | 2.31 | 38.19 | 1.19 | -37.07 | 8.38 | -44.27 | same | 47.65 | 47.65 | Free State to Northern Cape 13.8; Free State to Gauteng 8.3; Northern Cape to Western Cape 4.7; Hydra Central to Northern Cape 3.0; Eastern Cape to Kwazulu Natal 1.9
| corridors at R21,700 per MW-km for the same R4.80bn: 28.3 GW (the unconstrained expansion, whose cost is below the budget) | 4.1 | 63.8 | 0.19 | 0.0 | 45.73 | 4.47 | 37.80 | 1.19 | -34.51 | 8.38 | -41.71 | same | 50.21 | 50.21 | Free State to Northern Cape 12.7; Free State to Gauteng 7.2; Northern Cape to Western Cape 4.0; Hydra Central to Northern Cape 2.7; Eastern Cape to Kwazulu Natal 1.7
| lithium 5 GW at 4 h | 53.0 | 112.0 | 0.42 | 48.7 | 80.93 | 6.98 | 2.60 | 0.59 | 3.79 | 4.14 | 0.23 | same | 88.50 | 92.14 |
| corridors at R10,000 per MW-km for the same R6.98bn: 31.7 GW (the unconstrained expansion, whose cost is below the budget) | 3.4 | 63.2 | 0.19 | 0.0 | 45.34 | 2.31 | 38.19 | 1.19 | -37.07 | 8.38 | -44.27 | same | 47.65 | 47.65 | Free State to Northern Cape 13.8; Free State to Gauteng 8.3; Northern Cape to Western Cape 4.7; Hydra Central to Northern Cape 3.0; Eastern Cape to Kwazulu Natal 1.9
| corridors at R21,700 per MW-km for the same R6.98bn: 28.3 GW (the unconstrained expansion, whose cost is below the budget) | 4.1 | 63.8 | 0.19 | 0.0 | 45.73 | 4.47 | 37.80 | 1.19 | -34.51 | 8.38 | -41.71 | same | 50.21 | 50.21 | Free State to Northern Cape 12.7; Free State to Gauteng 7.2; Northern Cape to Western Cape 4.0; Hydra Central to Northern Cape 2.7; Eastern Cape to Kwazulu Natal 1.7
| lithium 5 GW at 8 h | 51.7 | 111.0 | 0.32 | 23.7 | 79.58 | 12.01 | 3.96 | 0.89 | 7.16 | 6.32 | 1.74 | same | 91.88 | 93.65 |
| corridors at R10,000 per MW-km for the same R12.01bn: 31.7 GW (the unconstrained expansion, whose cost is below the budget) | 3.4 | 63.2 | 0.19 | 0.0 | 45.34 | 2.31 | 38.19 | 1.19 | -37.07 | 8.38 | -44.27 | same | 47.65 | 47.65 | Free State to Northern Cape 13.8; Free State to Gauteng 8.3; Northern Cape to Western Cape 4.7; Hydra Central to Northern Cape 3.0; Eastern Cape to Kwazulu Natal 1.9
| corridors at R21,700 per MW-km for the same R12.01bn: 28.3 GW (the unconstrained expansion, whose cost is below the budget) | 4.1 | 63.8 | 0.19 | 0.0 | 45.73 | 4.47 | 37.80 | 1.19 | -34.51 | 8.38 | -41.71 | same | 50.21 | 50.21 | Free State to Northern Cape 12.7; Free State to Gauteng 7.2; Northern Cape to Western Cape 4.0; Hydra Central to Northern Cape 2.7; Eastern Cape to Kwazulu Natal 1.7
| lithium 10 GW at 4 h | 51.6 | 110.9 | 0.31 | 23.7 | 79.46 | 13.95 | 4.07 | 0.89 | 8.98 | 6.32 | 3.56 | same | 93.70 | 95.48 |
| corridors at R10,000 per MW-km for the same R13.95bn: 31.7 GW (the unconstrained expansion, whose cost is below the budget) | 3.4 | 63.2 | 0.19 | 0.0 | 45.34 | 2.31 | 38.19 | 1.19 | -37.07 | 8.38 | -44.27 | same | 47.65 | 47.65 | Free State to Northern Cape 13.8; Free State to Gauteng 8.3; Northern Cape to Western Cape 4.7; Hydra Central to Northern Cape 3.0; Eastern Cape to Kwazulu Natal 1.9
| corridors at R21,700 per MW-km for the same R13.95bn: 28.3 GW (the unconstrained expansion, whose cost is below the budget) | 4.1 | 63.8 | 0.19 | 0.0 | 45.73 | 4.47 | 37.80 | 1.19 | -34.51 | 8.38 | -41.71 | same | 50.21 | 50.21 | Free State to Northern Cape 12.7; Free State to Gauteng 7.2; Northern Cape to Western Cape 4.0; Hydra Central to Northern Cape 2.7; Eastern Cape to Kwazulu Natal 1.7
| lithium 10 GW at 8 h | 50.0 | 109.7 | 0.18 | 0.0 | 77.75 | 24.02 | 5.78 | 1.19 | 17.06 | 8.38 | 9.86 | same | 101.78 | 101.78 |
| corridors at R10,000 per MW-km for the same R24.02bn: 31.7 GW (the unconstrained expansion, whose cost is below the budget) | 3.4 | 63.2 | 0.19 | 0.0 | 45.34 | 2.31 | 38.19 | 1.19 | -37.07 | 8.38 | -44.27 | same | 47.65 | 47.65 | Free State to Northern Cape 13.8; Free State to Gauteng 8.3; Northern Cape to Western Cape 4.7; Hydra Central to Northern Cape 3.0; Eastern Cape to Kwazulu Natal 1.9
| corridors at R21,700 per MW-km for the same R24.02bn: 28.3 GW (the unconstrained expansion, whose cost is below the budget) | 4.1 | 63.8 | 0.19 | 0.0 | 45.73 | 4.47 | 37.80 | 1.19 | -34.51 | 8.38 | -41.71 | same | 50.21 | 50.21 | Free State to Northern Cape 12.7; Free State to Gauteng 7.2; Northern Cape to Western Cape 4.0; Hydra Central to Northern Cape 2.7; Eastern Cape to Kwazulu Natal 1.7
| the LP's own lithium: 2.2 GW / 20 GWh (Hydra Central 1.5, Eastern Cape 0.7) | 52.1 | 111.3 | 0.40 | 33.2 | 80.30 | 5.94 | 3.24 | 0.78 | 1.93 | 5.49 | -2.79 | changes | 86.64 | 89.13 |
| none, in 3-hour blocks (the base for the block rows) | 55.1 | 113.6 | 0.54 | 74.1 | 82.80 | 0.00 | - | - | - | - | - | - | 83.71 | 89.24 |
| the LP's own lithium, with corridors at R21,700 too (3-hour blocks): the LP builds no lithium; with corridors at R21,700 too: 28.0 GW of corridor for R4.44bn | 3.7 | 63.3 | 0.14 | 0.0 | 45.11 | 4.44 | 37.69 | 0.91 | -34.16 | 6.44 | -39.69 | same | 49.55 | 49.55 | Free State to Northern Cape 12.6; Free State to Gauteng 7.1; Northern Cape to Western Cape 3.9; Hydra Central to Northern Cape 2.6; Eastern Cape to Kwazulu Natal 1.8
| the LP's own lithium (3-hour blocks): 1.9 GW / 18 GWh (Hydra Central 1.3, Eastern Cape 0.6) | 52.1 | 111.2 | 0.36 | 32.5 | 79.96 | 5.37 | 2.84 | 0.51 | 2.02 | 3.61 | -1.08 | changes | 85.73 | 88.16 |

2035, weather 2025, the TDP's lines (the rebuilt table, N-1 once; tdp_lines_v2.json)

| addition | curtailed TWh | coal TWh | gas and diesel TWh | unserved GWh | fuel and carbon R bn | addition, gross R bn a year | saves in fuel and carbon | saves in unserved energy at R12,300 per MWh | net cost at R12,300, R bn a year | saves in unserved energy at R87,000 | net cost at R87,000 | sign of the net between the two | annual cost at R12,300 R bn | annual cost at R87,000 | corridors built |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| none | 30.8 | 90.0 | 0.19 | 0.0 | 64.11 | 0.00 | - | - | - | - | - | - | 64.11 | 64.11 |
| lithium 2 GW at 4 h | 29.4 | 88.8 | 0.13 | 0.0 | 62.83 | 2.79 | 1.28 | 0.00 | 1.51 | 0.00 | 1.51 | same | 65.62 | 65.62 |
| corridors at R21,700 per MW-km for the same R2.79bn: 11.9 GW (the unconstrained expansion, whose cost is below the budget) | 4.0 | 63.7 | 0.19 | 0.0 | 45.68 | 2.11 | 18.43 | 0.00 | -16.32 | 0.00 | -16.32 | same | 47.80 | 47.80 | Free State to Northern Cape 7.8; Eastern Cape to Kwazulu Natal 3.0; Free State to Gauteng 1.0
| lithium 5 GW at 4 h | 27.7 | 87.2 | 0.08 | 0.0 | 61.46 | 6.98 | 2.65 | 0.00 | 4.32 | 0.00 | 4.32 | same | 68.43 | 68.43 |
| corridors at R21,700 per MW-km for the same R6.98bn: 11.9 GW (the unconstrained expansion, whose cost is below the budget) | 4.0 | 63.7 | 0.19 | 0.0 | 45.68 | 2.11 | 18.43 | 0.00 | -16.32 | 0.00 | -16.32 | same | 47.80 | 47.80 | Free State to Northern Cape 7.8; Eastern Cape to Kwazulu Natal 3.0; Free State to Gauteng 1.0
| lithium 10 GW at 4 h | 25.6 | 85.4 | 0.02 | 0.0 | 59.80 | 13.95 | 4.31 | 0.00 | 9.64 | 0.00 | 9.64 | same | 73.75 | 73.75 |
| corridors at R21,700 per MW-km for the same R13.95bn: 11.9 GW (the unconstrained expansion, whose cost is below the budget) | 4.0 | 63.7 | 0.19 | 0.0 | 45.68 | 2.11 | 18.43 | 0.00 | -16.32 | 0.00 | -16.32 | same | 47.80 | 47.80 | Free State to Northern Cape 7.8; Eastern Cape to Kwazulu Natal 3.0; Free State to Gauteng 1.0

2040, weather 2025, the LP's own lithium (3-hour blocks): 6.0 GW / 115 GWh (Hydra Central 2.8, Eastern Cape 2.0, Limpopo 0.7, Gauteng 0.4, Kwazulu Natal 0.1)

| addition | curtailed TWh | coal TWh | gas and diesel TWh | unserved GWh | fuel and carbon R bn | addition, gross R bn a year | saves in fuel and carbon | saves in unserved energy at R12,300 per MWh | net cost at R12,300, R bn a year | saves in unserved energy at R87,000 | net cost at R87,000 | sign of the net between the two | annual cost at R12,300 R bn | annual cost at R87,000 | corridors built |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| none | 103.2 | 99.5 | 25.15 | 2459.1 | 136.23 | 0.00 | - | - | - | - | - | - | 166.47 | 350.17 |
| lithium 2 GW at 4 h | 102.3 | 99.4 | 24.49 | 2316.3 | 134.42 | 2.40 | 1.81 | 1.76 | -1.17 | 12.42 | -11.83 | same | 165.31 | 338.33 |
| corridors at R21,700 per MW-km for the same R2.40bn: 16.5 GW | 40.9 | 63.0 | 2.41 | 2.1 | 50.47 | 2.40 | 85.75 | 30.22 | -113.58 | 213.76 | -297.12 | same | 52.90 | 53.05 | Free State to Northern Cape 8.9; Free State to Gauteng 3.9; Hydra Central to Northern Cape 1.9; Eastern Cape to Kwazulu Natal 1.2; Northern Cape to Western Cape 0.6
| lithium 2 GW at 8 h | 101.8 | 99.4 | 24.12 | 2243.1 | 133.37 | 4.13 | 2.86 | 2.66 | -1.39 | 18.79 | -17.52 | same | 165.09 | 332.64 |
| corridors at R10,000 per MW-km for the same R4.13bn: 44.1 GW (the unconstrained expansion, whose cost is below the budget) | 13.8 | 37.3 | 2.08 | 2.1 | 31.77 | 3.21 | 104.45 | 30.22 | -131.47 | 213.76 | -315.00 | same | 35.01 | 35.16 | Free State to Northern Cape 18.6; Free State to Gauteng 12.0; Northern Cape to Western Cape 6.8; Hydra Central to Northern Cape 4.4; Eastern Cape to Kwazulu Natal 2.4
| lithium 5 GW at 4 h | 101.2 | 99.4 | 23.75 | 2169.1 | 132.31 | 5.99 | 3.91 | 3.57 | -1.49 | 25.23 | -23.15 | same | 164.98 | 327.01 |
| corridors at R10,000 per MW-km for the same R5.99bn: 44.1 GW (the unconstrained expansion, whose cost is below the budget) | 13.8 | 37.3 | 2.08 | 2.1 | 31.77 | 3.21 | 104.45 | 30.22 | -131.47 | 213.76 | -315.00 | same | 35.01 | 35.16 | Free State to Northern Cape 18.6; Free State to Gauteng 12.0; Northern Cape to Western Cape 6.8; Hydra Central to Northern Cape 4.4; Eastern Cape to Kwazulu Natal 2.4
| corridors at R21,700 per MW-km for the same R5.99bn: 38.8 GW | 15.2 | 38.5 | 2.08 | 2.1 | 32.63 | 5.99 | 103.59 | 30.22 | -127.83 | 213.76 | -311.36 | same | 38.65 | 38.80 | Free State to Northern Cape 16.4; Free State to Gauteng 10.9; Northern Cape to Western Cape 5.1; Hydra Central to Northern Cape 4.1; Eastern Cape to Kwazulu Natal 2.2
| lithium 5 GW at 8 h | 100.2 | 99.3 | 23.14 | 2040.3 | 130.47 | 10.31 | 5.76 | 5.15 | -0.59 | 36.43 | -31.87 | same | 165.88 | 318.29 |
| corridors at R10,000 per MW-km for the same R10.31bn: 44.1 GW (the unconstrained expansion, whose cost is below the budget) | 13.8 | 37.3 | 2.08 | 2.1 | 31.77 | 3.21 | 104.45 | 30.22 | -131.47 | 213.76 | -315.00 | same | 35.01 | 35.16 | Free State to Northern Cape 18.6; Free State to Gauteng 12.0; Northern Cape to Western Cape 6.8; Hydra Central to Northern Cape 4.4; Eastern Cape to Kwazulu Natal 2.4
| corridors at R21,700 per MW-km for the same R10.31bn: 40.5 GW (the unconstrained expansion, whose cost is below the budget) | 14.5 | 37.9 | 2.08 | 2.1 | 32.22 | 6.31 | 104.01 | 30.22 | -127.92 | 213.76 | -311.46 | same | 38.55 | 38.71 | Free State to Northern Cape 17.1; Free State to Gauteng 11.2; Northern Cape to Western Cape 5.8; Hydra Central to Northern Cape 4.2; Eastern Cape to Kwazulu Natal 2.2
| lithium 10 GW at 4 h | 100.0 | 99.2 | 23.01 | 2028.2 | 129.99 | 11.98 | 6.24 | 5.30 | 0.44 | 37.49 | -31.75 | changes | 166.91 | 318.42 |
| corridors at R10,000 per MW-km for the same R11.98bn: 44.1 GW (the unconstrained expansion, whose cost is below the budget) | 13.8 | 37.3 | 2.08 | 2.1 | 31.77 | 3.21 | 104.45 | 30.22 | -131.47 | 213.76 | -315.00 | same | 35.01 | 35.16 | Free State to Northern Cape 18.6; Free State to Gauteng 12.0; Northern Cape to Western Cape 6.8; Hydra Central to Northern Cape 4.4; Eastern Cape to Kwazulu Natal 2.4
| corridors at R21,700 per MW-km for the same R11.98bn: 40.5 GW (the unconstrained expansion, whose cost is below the budget) | 14.5 | 37.9 | 2.08 | 2.1 | 32.22 | 6.31 | 104.01 | 30.22 | -127.92 | 213.76 | -311.46 | same | 38.55 | 38.71 | Free State to Northern Cape 17.1; Free State to Gauteng 11.2; Northern Cape to Western Cape 5.8; Hydra Central to Northern Cape 4.2; Eastern Cape to Kwazulu Natal 2.2
| lithium 10 GW at 8 h | 98.9 | 99.2 | 22.32 | 1854.6 | 127.85 | 20.63 | 8.37 | 7.43 | 4.82 | 52.59 | -40.33 | changes | 171.29 | 309.84 |
| corridors at R10,000 per MW-km for the same R20.63bn: 44.1 GW (the unconstrained expansion, whose cost is below the budget) | 13.8 | 37.3 | 2.08 | 2.1 | 31.77 | 3.21 | 104.45 | 30.22 | -131.47 | 213.76 | -315.00 | same | 35.01 | 35.16 | Free State to Northern Cape 18.6; Free State to Gauteng 12.0; Northern Cape to Western Cape 6.8; Hydra Central to Northern Cape 4.4; Eastern Cape to Kwazulu Natal 2.4
| corridors at R21,700 per MW-km for the same R20.63bn: 40.5 GW (the unconstrained expansion, whose cost is below the budget) | 14.5 | 37.9 | 2.08 | 2.1 | 32.22 | 6.31 | 104.01 | 30.22 | -127.92 | 213.76 | -311.46 | same | 38.55 | 38.71 | Free State to Northern Cape 17.1; Free State to Gauteng 11.2; Northern Cape to Western Cape 5.8; Hydra Central to Northern Cape 4.2; Eastern Cape to Kwazulu Natal 2.2
| none, in 3-hour blocks (the base for the block rows) | 102.9 | 99.5 | 24.75 | 2334.4 | 135.08 | 0.00 | - | - | - | - | - | - | 163.79 | 338.17 |
| the LP's own lithium, with corridors at R21,700 too (3-hour blocks): the LP builds no lithium; with corridors at R21,700 too: 40.4 GW of corridor for R6.32bn | 13.8 | 37.2 | 1.88 | 0.0 | 31.12 | 6.32 | 103.95 | 28.71 | -126.35 | 203.10 | -300.73 | same | 37.44 | 37.44 | Free State to Northern Cape 17.1; Free State to Gauteng 11.2; Northern Cape to Western Cape 5.8; Hydra Central to Northern Cape 4.0; Eastern Cape to Kwazulu Natal 2.2
| the LP's own lithium (3-hour blocks): 6.0 GW / 115 GWh (Hydra Central 2.8, Eastern Cape 2.0, Limpopo 0.7, Gauteng 0.4, Kwazulu Natal 0.1) | 98.4 | 99.3 | 21.78 | 1560.9 | 126.35 | 26.79 | 8.72 | 9.51 | 8.55 | 67.29 | -49.23 | changes | 172.34 | 288.94 |

2040, weather 2025, the TDP's lines (the rebuilt table, N-1 once; tdp_lines_v2.json)

| addition | curtailed TWh | coal TWh | gas and diesel TWh | unserved GWh | fuel and carbon R bn | addition, gross R bn a year | saves in fuel and carbon | saves in unserved energy at R12,300 per MWh | net cost at R12,300, R bn a year | saves in unserved energy at R87,000 | net cost at R87,000 | sign of the net between the two | annual cost at R12,300 R bn | annual cost at R87,000 | corridors built |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| none | 73.5 | 88.2 | 9.32 | 22.1 | 83.09 | 0.00 | - | - | - | - | - | - | 83.36 | 85.01 |
| lithium 2 GW at 4 h | 72.2 | 87.4 | 8.87 | 14.9 | 81.37 | 2.40 | 1.72 | 0.09 | 0.59 | 0.63 | 0.05 | same | 83.94 | 85.05 |
| corridors at R21,700 per MW-km for the same R2.40bn: 13.8 GW | 19.6 | 42.5 | 2.09 | 2.1 | 35.48 | 2.40 | 47.61 | 0.25 | -45.46 | 1.74 | -46.96 | same | 37.90 | 38.05 | Free State to Northern Cape 8.4; Eastern Cape to Kwazulu Natal 3.5; Free State to Gauteng 1.9
| lithium 5 GW at 4 h | 70.8 | 86.5 | 8.39 | 5.9 | 79.46 | 5.99 | 3.63 | 0.20 | 2.16 | 1.41 | 0.95 | same | 85.52 | 85.96 |
| corridors at R21,700 per MW-km for the same R5.99bn: 21.1 GW (the unconstrained expansion, whose cost is below the budget) | 14.4 | 37.9 | 2.08 | 2.1 | 32.18 | 3.77 | 50.90 | 0.25 | -47.38 | 1.74 | -48.87 | same | 35.98 | 36.13 | Free State to Northern Cape 10.9; Eastern Cape to Kwazulu Natal 4.5; Free State to Gauteng 3.8; Northern Cape to Western Cape 2.0
| lithium 10 GW at 4 h | 69.2 | 85.5 | 7.87 | 0.0 | 77.27 | 11.98 | 5.82 | 0.27 | 5.89 | 1.92 | 4.24 | same | 89.25 | 89.25 |
| corridors at R21,700 per MW-km for the same R11.98bn: 21.1 GW (the unconstrained expansion, whose cost is below the budget) | 14.4 | 37.9 | 2.08 | 2.1 | 32.18 | 3.77 | 50.90 | 0.25 | -47.38 | 1.74 | -48.87 | same | 35.98 | 36.13 | Free State to Northern Cape 10.9; Eastern Cape to Kwazulu Natal 4.5; Free State to Gauteng 3.8; Northern Cape to Western Cape 2.0

### The LP's chosen lithium by area where the free mix gives it (718 (f) cases; block length stated)

| year, weather year | case | blocks | lithium GW, GWh | by area GW |
|---|---|---|---|---|
| 2035, 2015 | 2035_wy2015_n1c_reea_l0_c1_mix_ext10k_h3 | 3 h | 6.2, 27 | Limpopo 2.2, Northern Cape 1.9, Western Cape 1.3, Free State 0.5, Hydra Central 0.3 |
| 2035, 2015 | 2035_wy2015_nolimit_reea_l0_c1_mix_control_h3 | 3 h | 6.6, 27 | Gauteng 4.3, Eastern Cape 1.1, Limpopo 1.0, Free State 0.2 |
| 2035, 2015 | 2035_wy2015_nolimit_reea_l0_c1_mix_control_nocap_h3 | 3 h | 4.5, 20 | Western Cape 2.1, Northern Cape 1.4, Hydra Central 1.0 |
| 2035, 2015 | 2035_wy2015_nolimit_reea_l0_c1_mix_control_onebus_h3 | 3 h | 6.5, 27 | Gauteng 2.2, Northern Cape 1.0, Eastern Cape 1.0, Kwazulu Natal 1.0, North West 0.5, Western Cape 0.4, Hydra Central 0.3, Free State 0.2 |
| 2035, 2015 | 2035_wy2015_nolimit_reea_l0_c1_mix_control_runwind_h3 | 3 h | 6.1, 23 | Northern Cape 2.7, Western Cape 2.6, Hydra Central 0.8 |
| 2035, 2025 | 2035_wy2025_n1c_reea_l0_c1_mix_ext10k_h3 | 3 h | 6.6, 23 | Northern Cape 4.7, Limpopo 0.9, Free State 0.6, Hydra Central 0.3, Western Cape 0.1 |
| 2035, 2025 | 2035_wy2025_n1c_reea_l0_c1_mix_n1c_fixedcorr_h3 | 3 h | 7.8, 44 | North West 4.9, Hydra Central 1.4, Northern Cape 1.3, Free State 0.1, Eastern Cape 0.1 |
| 2035, 2025 | 2035_wy2025_n1ctdp_reea_l0_c1_tdpfull_mix_ext10k_h3 | 3 h | 6.9, 24 | Northern Cape 5.4, Hydra Central 0.4, Kwazulu Natal 0.4, Eastern Cape 0.4, Free State 0.3 |
| 2035, 2025 | 2035_wy2025_n1ctdp_reea_l0_c1_tdpfull_mix_fixed_h3 | 3 h | 6.9, 28 | Northern Cape 3.3, Eastern Cape 1.2, Limpopo 1.1, Hydra Central 1.1, Gauteng 0.3 |
| 2035, 2025 | 2035_wy2025_nm1tdp_reea_l0_c1_v2tdp_mix_ext21k_h3 | 3 h | 6.9, 24 | Northern Cape 5.0, Eastern Cape 0.7, North West 0.6, Free State 0.6 |
| 2035, 2025 | 2035_wy2025_nolimit_reea_l0_c1_mix_control_caps_h3 | 3 h | 7.0, 25 | Gauteng 6.5, Eastern Cape 0.5 |
| 2035, 2025 | 2035_wy2025_nolimit_reea_l0_c1_mix_control_credit_h3 | 3 h | 7.1, 25 | Northern Cape 6.1, Hydra Central 0.9 |
| 2035, 2025 | 2035_wy2025_nolimit_reea_l0_c1_mix_control_h3 | 3 h | 7.0, 25 | Limpopo 3.8, Gauteng 2.5, Eastern Cape 0.5, Free State 0.3 |
| 2035, 2025 | 2035_wy2025_nolimit_reea_l0_c1_mix_control_nocap_h3 | 3 h | 5.0, 16 | Northern Cape 3.8, Hydra Central 1.1, Eastern Cape 0.2 |
| 2035, 2025 | 2035_wy2025_nolimit_reea_l0_c1_mix_control_nocap_runacct_h3 | 3 h | 5.6, 20 | Northern Cape 4.4, Hydra Central 0.9, Western Cape 0.3 |
| 2035, 2025 | 2035_wy2025_nolimit_reea_l0_c1_mix_control_onebus_h3 | 3 h | 6.7, 26 | Gauteng 2.3, Eastern Cape 1.2, Northern Cape 1.0, Kwazulu Natal 0.8, Western Cape 0.5, North West 0.4, Hydra Central 0.4, Free State 0.2 |
| 2035, 2025 | 2035_wy2025_nolimit_reea_l0_c1_mix_control_onebus_runacct_h3 | 3 h | 6.8, 27 | Gauteng 2.3, Eastern Cape 1.2, Northern Cape 1.0, Kwazulu Natal 0.9, North West 0.5, Western Cape 0.4, Hydra Central 0.3, Free State 0.2 |
| 2035, 2025 | 2035_wy2025_nolimit_reea_l0_c1_mix_control_runacct_h3 | 3 h | 7.0, 24 | Northern Cape 5.8, Hydra Central 0.8, Western Cape 0.4 |
| 2035, 2025 | 2035_wy2025_nolimit_reea_l0_c1_mix_control_runacct_nopool_h3 | 3 h | 6.7, 23 | Northern Cape 5.3, Hydra Central 1.0, Western Cape 0.4 |
| 2035, 2025 | 2035_wy2025_nolimit_reea_l0_c1_mix_control_runwind_h3 | 3 h | 5.9, 20 | Northern Cape 4.8, Hydra Central 0.8, Western Cape 0.4 |
| 2035, 2025 | 2035_wy2025_nolimit_reea_l0_c1_mix_control_runwind_runacct_h3 | 3 h | 5.6, 19 | Northern Cape 4.8, Hydra Central 0.8 |
| 2040, 2015 | 2040_wy2015_n1c_reea_l0_c1_mix_ext10k_h3 | 3 h | 14.1, 86 | Limpopo 4.8, Western Cape 4.5, North West 2.4, Hydra Central 0.7, Northern Cape 0.5, Gauteng 0.5, Eastern Cape 0.3, Free State 0.3 |
| 2040, 2015 | 2040_wy2015_nolimit_reea_l0_c1_mix_control_h3 | 3 h | 11.1, 68 | Western Cape 5.2, Limpopo 3.4, Northern Cape 1.8, Hydra Central 0.8 |
| 2040, 2015 | 2040_wy2015_nolimit_reea_l0_c1_mix_control_nocap_h3 | 3 h | 10.4, 52 | Western Cape 4.5, Northern Cape 2.4, Limpopo 2.2, Hydra Central 0.8, Eastern Cape 0.5 |
| 2040, 2015 | 2040_wy2015_nolimit_reea_l0_c1_mix_control_runwind_h3 | 3 h | 10.6, 59 | Western Cape 5.8, Limpopo 2.4, Hydra Central 1.5, Northern Cape 1.0 |
| 2040, 2025 | 2040_wy2025_n1c_reea_l0_c1_mix_ext10k_h3 | 3 h | 14.4, 98 | Northern Cape 10.6, North West 2.4, Hydra Central 0.6, Limpopo 0.3, Free State 0.3, Gauteng 0.1 |
| 2040, 2025 | 2040_wy2025_n1c_reea_l0_c1_mix_n1c_fixedcorr_h3 | 3 h | 18.5, 115 | North West 7.2, Limpopo 5.8, Gauteng 2.0, Free State 1.8, Northern Cape 0.8, Hydra Central 0.5, Eastern Cape 0.3 |
| 2040, 2025 | 2040_wy2025_n1ctdp_reea_l0_c1_tdpfull_mix_ext10k_h3 | 3 h | 14.4, 96 | Northern Cape 10.6, North West 3.2, Free State 0.5, Limpopo 0.1, Eastern Cape 0.1 |
| 2040, 2025 | 2040_wy2025_nm1tdp_reea_l0_c1_v2tdp_mix_ext21k_h3 | 3 h | 14.4, 97 | Northern Cape 9.7, North West 3.8, Free State 0.5, Eastern Cape 0.4 |
| 2040, 2025 | 2040_wy2025_nolimit_reea_l0_c1_mix_control_credit_h3 | 3 h | 13.2, 87 | Northern Cape 12.6, Hydra Central 0.7 |
| 2040, 2025 | 2040_wy2025_nolimit_reea_l0_c1_mix_control_h3 | 3 h | 13.2, 87 | Gauteng 10.1, Limpopo 1.5, Free State 1.4, Eastern Cape 0.2 |
| 2040, 2025 | 2040_wy2025_nolimit_reea_l0_c1_mix_control_nocap_h3 | 3 h | 10.3, 45 | Northern Cape 8.8, Hydra Central 0.9, Eastern Cape 0.5 |
| 2040, 2025 | 2040_wy2025_nolimit_reea_l0_c1_mix_control_nocap_runacct_h3 | 3 h | 10.5, 48 | Northern Cape 9.2, Hydra Central 0.8, Eastern Cape 0.6 |
| 2040, 2025 | 2040_wy2025_nolimit_reea_l0_c1_mix_control_onebus_h3 | 3 h | 11.6, 60 | Gauteng 4.2, Kwazulu Natal 1.7, North West 1.7, Eastern Cape 1.5, Northern Cape 0.9, Western Cape 0.7, Free State 0.5, Hydra Central 0.4 |
| 2040, 2025 | 2040_wy2025_nolimit_reea_l0_c1_mix_control_onebus_runacct_h3 | 3 h | 12.9, 69 | Gauteng 4.8, Kwazulu Natal 2.0, North West 2.0, Eastern Cape 1.5, Northern Cape 0.9, Western Cape 0.8, Free State 0.6, Hydra Central 0.4 |
| 2040, 2025 | 2040_wy2025_nolimit_reea_l0_c1_mix_control_runacct_h3 | 3 h | 13.5, 90 | Northern Cape 12.7, Hydra Central 0.7, Western Cape 0.1 |
| 2040, 2025 | 2040_wy2025_nolimit_reea_l0_c1_mix_control_runacct_nopool_h3 | 3 h | 13.5, 90 | Northern Cape 12.7, Hydra Central 0.7, Western Cape 0.1 |
| 2040, 2025 | 2040_wy2025_nolimit_reea_l0_c1_mix_control_runwind_h3 | 3 h | 11.2, 56 | Northern Cape 8.6, Hydra Central 1.5, Western Cape 1.0 |
| 2040, 2025 | 2040_wy2025_nolimit_reea_l0_c1_mix_control_runwind_runacct_h3 | 3 h | 11.5, 59 | Northern Cape 9.1, Hydra Central 1.3, Western Cape 1.0 |
| 2035, 2025 | 2035_wy2025_nolimit_reea_l0_c1_mix_control_h6 | 6 h | 3.7, 22 | Gauteng 3.7 |
| 2040, 2015 | 2040_wy2015_nolimit_reea_l0_c1_mix_control_h6 | 6 h | 9.0, 69 | Northern Cape 3.8, Western Cape 3.2, Limpopo 1.3, Hydra Central 0.7 |
| 2040, 2015 | 2040_wy2015_nolimit_reea_l0_c1_mix_control_nocap_h6 | 6 h | 8.6, 52 | Western Cape 4.9, Northern Cape 2.2, Hydra Central 0.7, Limpopo 0.6, Eastern Cape 0.2 |
| 2040, 2015 | 2040_wy2015_nolimit_reea_l0_c1_mix_control_onebus_h6 | 6 h | 7.6, 49 | Gauteng 3.1, North West 1.3, Kwazulu Natal 0.9, Eastern Cape 0.9, Northern Cape 0.5, Hydra Central 0.3, Free State 0.3, Western Cape 0.3 |
| 2040, 2015 | 2040_wy2015_nolimit_reea_l0_c1_mix_control_runwind_h6 | 6 h | 7.2, 45 | Western Cape 5.3, Hydra Central 1.8, Limpopo 0.1 |

Reading (the first cut of 737: weather 2025, lithium at 4 h in steps of 2, 5 and 10 GW, corridors at R21,700, on the rebuilt table; the full table above, docs/regional-audit/tables731.md). (1) Lithium at the four exits barely moves the network result. On today's corridors in 2035, 10 GW at 4 h (R13.95bn a year) takes curtailment from 55.4 to 51.6 TWh and unserved energy from 96 to 24 GWh; 2 GW (R2.79bn) takes them to 54.2 TWh and 66 GWh. In 2040, 10 GW takes curtailment from 103.2 to 100.0 TWh and unserved energy from 2,459 to 2,028 GWh. A battery behind a binding exit can only shift the hour it exports in; it cannot export more, and these exits bind in 8,200 to 8,700 hours of the year. (2) Corridors for the same money remove the effect. The 2 GW step's R2.79bn buys 18.0 GW of corridor at R21,700 in 2035 (Free State to Northern Cape 9.1 GW, Free State to Gauteng 4.0, Northern Cape to Western Cape 1.8, Hydra Central to Northern Cape 1.7, Eastern Cape to KwaZulu-Natal 1.3) and takes curtailment to 10.0 TWh with nothing unserved; the 5 GW step's money buys the whole unconstrained expansion (28.3 GW, R4.47bn) and takes it to 4.1 TWh. In 2040 the 2 GW step's R2.40bn buys 16.5 GW and takes curtailment from 103 to 41 TWh and unserved energy from 2,459 to 2 GWh; the 5 GW step's R5.99bn buys 38.8 GW and 15.2 TWh. Annual cost (fuel and carbon, the addition, and unserved energy at R12,300 per MWh, the engine's cost of load shedding, with the figure at R87,000, the LP's penalty, in brackets; message 754): the 2 GW lithium step moves 2035's R84.7bn to R85.9bn (R91.9bn to R90.8bn), the same money in corridors to R52.5bn (R52.5bn); in 2040 R166.5bn to R165.3bn (R350bn to R338bn) against R52.9bn (R53.1bn) for the corridors. At the engine's value the 2035 lithium step is a net cost and the 2040 step a small net saving; at the LP's penalty both are savings; the corridors are savings at either (the signs case by case in 743 (a)). (3) With the TDP's lines in place first the gap narrows and the order does not change: 2035's 10 GW of lithium takes 30.8 TWh to 25.6, the 2 GW step's money in corridors (11.9 GW, the whole expansion the LP wants beyond the plan, R2.11bn: Free State to Northern Cape 7.8, Eastern Cape to KwaZulu-Natal 3.0, Free State to Gauteng 1.0) takes it to 4.0 TWh; in 2040, 10 GW of lithium takes 73.5 TWh to 69.2 and 22 GWh unserved to nil, the 2 GW step's money in corridors (13.8 GW) to 19.6 TWh. (4) Where the LP itself sites lithium when it may (the second table, 3-hour and 6-hour blocks): in the Northern Cape beside the solar, the North West, Limpopo and Gauteng, and never at the exits as a substitute for a corridor; the free mix with corridors priced builds 6 to 14 GW of lithium and 13 to 20 GW of corridor together.

Would the rest of the 208 change the reading? Not the order. The 1 GW step sits between none and 2 GW on every column; 8 hours doubles each step's energy and cost (R2.40bn becomes R4.80bn for 2 GW in 2035), which buys more corridor for the same money, so the comparison moves further the corridors' way; R10,000 per MW-km buys 1.5 to 2 times the corridor at R21,700 for the same rand (the R10,000 rows above are the unconstrained expansions, which every lithium step's money already covers at that price); weather 2015 moved curtailment by 6 to 9 TWh and the corridor set not at all in the old-table cases. What the rest would add is the size of the lithium's own effect at 8 hours (a few TWh more) and the two weather years' spread; it cannot make a store at an exit that binds in 8,500 hours worth more than the exit.

What the result cannot show. (1) Within-area limits: the model carries the 21 inter-area corridors only, so lithium placed in an area relieves the exit and nothing inside the area, and a corridor bought relieves the exit and nothing behind it; both are lower bounds on what either would have to do. (2) Perfect foresight: the LP dispatches the year knowing it, so the lithium's cycles and the corridor's hours are the best case for each; a real operator's storage does less, and the comparison between them is fairer than either figure alone. (3) Blocks: these cases are hourly, but the free-mix lithium in the second table is on 3-hour (and 6-hour) blocks, which flatten the evening peak and understate the lithium's value and the curtailment the block hides. (4) One weather year (2025) in this cut, and one lithium duration.

## Message 738: the corridor table rebuilt, the cases rerun on it, the control repriced, the tie-out widened (6 Nov 2026; after the review of 728 in docs/reviews/2026-11-06-pypsa-net-review.md; build 2026-11-05f; scratch and this branch only; nothing to be quoted)

The review's findings stand: the old table was PyPSA-RSA's N-1 table at 400 kV ratings, so every factor case here derated it twice and the 'as drawn' rows were N-1 rows; two of its corridors were placeholders with no line behind them; and the free-mix control was priced on the test's accounting, not the run's. The earlier network results are superseded for corridor sizes by what follows.

### (a) The corridor table rebuilt from the model's own line file

Method (docs/regional-audit/build_corridors.py; output corridors_v2.json and corridor_table_v2.md with every circuit). Lines: nodal/transmission_lines.geojson (450 features, NTCSA-derived; 317 existing, 133 planned), each end placed in its area by nodal/substations_compact.json (the 125 unnamed features placed by their end points; all of them planned, so none is in today's table), cross-border lines and the Cahora Bassa HVDC excluded, existing status only; the planned ones are the TDP's and enter through the TDP file. Per circuit: the lower of the voltage class's thermal rating and the St Clair loadability at the circuit's own length (SIL x 53.736 x km to the power -0.65, as PyPSA-RSA applies it), SIL 2,280 MW at 765 kV and 602 MW at 400 kV (PyPSA-RSA's values, from the review), 285 MW at 275 kV, 182 at 220 kV and 66 at 132 kV by voltage squared from the 400 kV value (an assumption, stated); thermal by class from the model's own line file (nodal/corridor_electrical.json's MVA per class: 3,000 at 765 kV, 1,400 at 400 kV, 400 at 275 kV, 250 at 220 kV). Corridor: the sum of its circuits (the thermal-and-loadability sensitivity), and N-1 applied once: the sum less the largest circuit where there are two or more, 0.7 times the circuit where there is one (PyPSA-RSA's rule). In the TDP cases N-1 is applied once over the existing circuits and the TDP's lines together. Corridor length for pricing: the mean of its circuits. Source for every circuit: the line file's own label (the full list in corridor_table_v2.md). No NTCSA capacity figure is used: the ratings are computed from voltage and length.

| corridor | old MW, old km (the table: PyPSA-RSA N-1 at 400 kV ratings) | circuits in the line file (existing) | km, mean | thermal and loadability sum MW | N-1 once MW | new N-1 against old |
|---|---|---|---|---|---|---|
| Gauteng to Mpumalanga | 13,318, 102 | 8 x 400 kV, 4 x 275 kV | 102 | 12,568 | 11,168 | 0.84 |
| KwaZulu-Natal to Mpumalanga | 6,552, 172 | 1 x 765 kV, 7 x 400 kV | 172 | 11,375 | 8,375 | 1.28 |
| Gauteng to North West | 5,680, 84 | 4 x 400 kV, 3 x 275 kV | 66 | 6,800 | 5,400 | 0.95 |
| Free State to Hydra Central | 2,763, 310 | 2 x 765 kV, 3 x 400 kV | 310 | 7,865 | 4,865 | 1.76 |
| Free State to Mpumalanga | 2,609, 347 | 2 x 765 kV, 3 x 400 kV | 347 | 7,202 | 4,838 | 1.85 |
| Limpopo to North West | 5,922, 212 | 5 x 400 kV, 2 x 275 kV | 212 | 5,316 | 3,916 | 0.66 |
| Free State to Gauteng | 1,446, 202 | 1 x 400 kV, 9 x 275 kV | 60 | 5,000 | 3,600 | 2.49 |
| Limpopo to Mpumalanga | 5,138, 121 | 2 x 400 kV, 3 x 275 kV | 121 | 3,447 | 2,214 | 0.43 |
| Mpumalanga to North West | 599, 268 | 1 x 765 kV | 268 | 3,000 | 2,100 | 3.51 |
| Free State to North West | 651, 235 | 1 x 765 kV | 235 | 3,000 | 2,100 | 3.23 |
| Hydra Central to Western Cape | 2,377, 278 | 3 x 400 kV | 246 | 2,709 | 1,803 | 0.76 |
| Gauteng to Limpopo | 4,041, 271 | 2 x 400 kV, 1 x 275 kV | 107 | 3,200 | 1,800 | 0.45 |
| Eastern Cape to KwaZulu-Natal | 813, 167 | 1 x 400 kV | 167 | 1,161 | 813 | 1.00 |
| Northern Cape to Western Cape | 823, 164 | 1 x 400 kV | 171 | 1,144 | 801 | 0.97 |
| Eastern Cape to Hydra Central | 1,124, 295 | 2 x 400 kV | 295 | 1,606 | 801 | 0.71 |
| North West to Northern Cape | 663, 229 | 1 x 400 kV | 199 | 1,038 | 726 | 1.10 |
| Hydra Central to Northern Cape | 754, 187 | 1 x 400 kV, 2 x 220 kV | 64 | 1,578 | 500 | 0.66 |
| Eastern Cape to Free State | 455, 408 | 1 x 400 kV | 408 | 650 | 455 | 1.00 |
| Free State to Northern Cape | 2,439, 90 | 2 x 275 kV | 90 | 800 | 400 | 0.16 |
| Free State to KwaZulu-Natal | 427, 450 | none (a placeholder; dropped) | - | 0 | 0 | 0 |
| North West to Western Cape | 233, 1,139 | none (a placeholder; dropped) | - | 0 | 0 | 0 |
| total | 58,827 | 77 circuits | | 79,459 | 56,676 | 0.96 |

What changed. The 765 kV lines (Alpha to Beta, Beta to Hydra, Gamma to Perseus, Majuba to Umfolozi, Mercury to Perseus, Mercury to Zeus) rated at their own voltage lift the Free State hub's corridors 1.8 to 3.5 times (Free State to Hydra Central 4,865 MW, Free State to Mpumalanga 4,838, the two Mercury lines 2,100 each). The two placeholders are gone. Seven corridors fall, because the line file has fewer circuits on them than the old table's PyPSA-RSA sum implied: Free State to Northern Cape (two 275 kV circuits, 400 MW against 2,439), Limpopo to Mpumalanga, Gauteng to Limpopo, Hydra Central to Northern Cape, Limpopo to North West, Eastern Cape to Hydra Central and Hydra Central to Western Cape (0.43 to 0.76 of the old). Those seven are where the line file's coverage, not the rating method, sets the figure, and the Karoo exits are among them: the rebuilt table is the model's own data at voltage-specific ratings, not a better survey of the lines. The total is 56.7 GW N-1 against the old 58.8, and 79.5 GW with limits only.

### (b) The main cases on the rebuilt table

Table: docs/regional-audit/tables738.md (the rows below), every case's JSON in results/718/ with the suffix _v2.

| case | curtailed TWh (wind, solar) | unserved GWh | coal TWh | gas TWh | diesel TWh | storage TWh | fuel and carbon R bn | corridors built or siting | binding corridors over 4,000 h (value of one more MW, R m a year) |
|---|---|---|---|---|---|---|---|---|---|
| 2035, weather 2025: no limits | 3.1 (2.2, 0.9) | 0 | 62.9 | 0.00 | 0.19 | 10.3 | 45.1 | - | none over 4,000 h |
| 2035, weather 2025: old table, PyPSA-RSA's N-1 (labelled 'as drawn' before 738) | 54.7 (47.3, 7.4) | 2 | 114.2 | 0.00 | 0.38 | 9.8 | 82.1 | - | North West to Northern Cape (7464 h, R6.8m); North West to Western Cape (7460 h, R6.8m); Eastern Cape to Kwazulu Natal (6848 h, R5.9m); Free State to Mpumalanga (6862 h, R5.9m); Free State to North West (6862 h, R5.9m); Free State to Gauteng (6862 h, R5.9m); Free State to Kwazulu Natal (6862 h, R5.9m) |
| 2035, weather 2025: old table, one circuit dropped (a second derate) | 67.9 (55.4, 12.4) | 474 | 126.5 | 0.00 | 0.85 | 10.3 | 93.7 | - | North West to Western Cape (8036 h, R55.0m); North West to Northern Cape (8130 h, R55.0m); Eastern Cape to Kwazulu Natal (6809 h, R38.2m); Free State to Northern Cape (4680 h, R32.1m); Free State to Hydra Central (4505 h, R30.1m); Free State to Kwazulu Natal (5486 h, R23.0m); Free State to Mpumalanga (5474 h, R23.0m); Free State to North West (5474 h, R23.0m); Free State to Gauteng (5474 h, R23.0m |
| 2035, weather 2025: rebuilt table, limits only (thermal and loadability; the sensitivity) | 29.4 (25.1, 4.3) | 0 | 88.6 | 0.00 | 0.20 | 6.5 | 63.2 | - | North West to Northern Cape (6061 h, R4.2m); Free State to Northern Cape (6061 h, R4.2m) |
| 2035, weather 2025: rebuilt table, N-1 once (the central) | 55.4 (44.0, 11.4) | 96 | 114.1 | 0.00 | 0.61 | 6.6 | 83.5 | - | North West to Northern Cape (8242 h, R21.6m); Free State to Northern Cape (8242 h, R21.6m); Free State to Hydra Central (5486 h, R7.8m); Eastern Cape to Kwazulu Natal (4286 h, R5.9m); Eastern Cape to Free State (4286 h, R5.9m) |
| 2035, weather 2025: rebuilt table, N-1 once, commitment floor by design minimum | 55.4 (44.0, 11.4) | 96 | 114.1 | 0.00 | 0.61 | 6.6 | 83.5 | - | North West to Northern Cape (8242 h, R21.6m); Free State to Northern Cape (8242 h, R21.6m); Free State to Hydra Central (5486 h, R7.8m); Eastern Cape to Kwazulu Natal (4286 h, R5.9m); Eastern Cape to Free State (4286 h, R5.9m) |
| 2035, weather 2025: rebuilt table, the TDP's lines by their dates, N-1 once (Eros in KwaZulu-Natal, no Umtu line, Gamma to Grassridge twice) | 30.8 (27.0, 3.8) | 0 | 90.0 | 0.00 | 0.19 | 6.4 | 64.1 | - | North West to Northern Cape (5693 h, R3.8m); Free State to Northern Cape (5693 h, R3.8m); Eastern Cape to Kwazulu Natal (4361 h, R3.0m); Eastern Cape to Free State (4361 h, R3.0m); Free State to Hydra Central (4361 h, R3.0m) |
| 2035, weather 2025: the same with the Eros to Isundu, Ariadne to Eros and Mercury to Umtu lines (the range) | 21.1 (19.7, 1.4) | 0 | 80.3 | 0.00 | 0.19 | 6.5 | 57.3 | - | North West to Northern Cape (4599 h, R3.0m); Free State to Northern Cape (4599 h, R3.0m) |
| 2035, weather 2025: rebuilt table, corridors extendable at R10,000 per MW-km | 3.4 (3.4, 0.0) | 0 | 63.2 | 0.00 | 0.19 | 10.1 | 45.3 | 31.7 GW, R2.31bn: Free State to Northern Cape 13.8; Free State to Gauteng 8.3; Northern Cape to Western Cape 4.7; Hydra Central to Northern Cape 3.0; Eastern Cape to Kwazulu Natal 1.9 | none over 4,000 h |
| 2035, weather 2025: rebuilt table, corridors extendable at R21,700 per MW-km | 4.1 (4.0, 0.0) | 0 | 63.8 | 0.00 | 0.19 | 9.9 | 45.7 | 28.3 GW, R4.47bn: Free State to Northern Cape 12.7; Free State to Gauteng 7.2; Northern Cape to Western Cape 4.0; Hydra Central to Northern Cape 2.7; Eastern Cape to Kwazulu Natal 1.7 | none over 4,000 h |
| 2035, weather 2025: rebuilt table, free siting of new wind and solar | 31.1 (29.9, 1.2) | 3 | 89.6 | 0.00 | 0.29 | 7.4 | 64.4 | - wind: Hydra Central 36%, Eastern Cape 22%, Northern Cape 14%, Western Cape 13%, Mpumalanga 10%, Kwazulu Natal 2% | Free State to Northern Cape (6411 h, R4.9m); North West to Northern Cape (6408 h, R4.9m); Eastern Cape to Kwazulu Natal (5221 h, R3.8m); Eastern Cape to Free State (5221 h, R3.8m); Free State to Hydra Central (5269 h, R3.7m) |
| 2035, weather 2025: old table, one circuit dropped, full TDP (for comparison) | 19.3 (18.7, 0.6) | 0 | 78.5 | 0.00 | 0.19 | 6.7 | 56.0 | - | none over 4,000 h |
| 2040, weather 2025: no limits | 13.1 (9.5, 3.6) | 2 | 36.9 | 1.75 | 0.33 | 23.4 | 31.5 | - | none over 4,000 h |
| 2040, weather 2025: old table, PyPSA-RSA's N-1 (labelled 'as drawn' before 738) | 105.0 (87.5, 17.6) | 2,634 | 99.8 | 23.75 | 3.02 | 16.9 | 138.6 | - | North West to Northern Cape (8541 h, R198.0m); North West to Western Cape (8544 h, R197.9m); Free State to Mpumalanga (8460 h, R196.8m); Free State to North West (8460 h, R196.8m); Free State to Gauteng (8460 h, R196.8m); Free State to Kwazulu Natal (8460 h, R196.8m); Eastern Cape to Kwazulu Natal (8162 h, R191.8m) |
| 2040, weather 2025: old table, one circuit dropped (a second derate) | 119.0 (94.9, 24.1) | 6,908 | 99.9 | 31.74 | 4.16 | 14.8 | 162.7 | - | North West to Northern Cape (8701 h, R291.3m); North West to Western Cape (8659 h, R290.0m); Eastern Cape to Kwazulu Natal (7932 h, R265.6m); Free State to Mpumalanga (7124 h, R136.8m); Free State to North West (7124 h, R136.8m); Free State to Gauteng (7124 h, R136.8m); Free State to Kwazulu Natal (7124 h, R136.8m) |
| 2040, weather 2025: rebuilt table, limits only (thermal and loadability; the sensitivity) | 71.0 (59.4, 11.6) | 31 | 86.6 | 7.92 | 0.42 | 15.3 | 79.9 | - | North West to Northern Cape (7649 h, R13.6m); Free State to Northern Cape (7649 h, R13.6m); Free State to Hydra Central (5358 h, R7.8m); Eastern Cape to Kwazulu Natal (4873 h, R7.2m); Eastern Cape to Free State (4873 h, R7.2m) |
| 2040, weather 2025: rebuilt table, N-1 once (the central) | 103.2 (82.0, 21.2) | 2,459 | 99.5 | 21.84 | 3.31 | 15.6 | 136.2 | - | North West to Northern Cape (8732 h, R191.2m); Free State to Northern Cape (8732 h, R191.2m); Free State to Hydra Central (7085 h, R154.6m); Eastern Cape to Kwazulu Natal (5632 h, R138.7m); Eastern Cape to Free State (5632 h, R138.7m) |
| 2040, weather 2025: rebuilt table, N-1 once, commitment floor by design minimum | 103.2 (82.0, 21.2) | 2,459 | 99.5 | 21.84 | 3.31 | 15.6 | 136.2 | - | North West to Northern Cape (8732 h, R191.2m); Free State to Northern Cape (8732 h, R191.2m); Free State to Hydra Central (7085 h, R154.6m); Eastern Cape to Kwazulu Natal (5632 h, R138.7m); Eastern Cape to Free State (5632 h, R138.7m) |
| 2040, weather 2025: rebuilt table, the TDP's lines by their dates, N-1 once (Eros in KwaZulu-Natal, no Umtu line, Gamma to Grassridge twice) | 73.5 (62.5, 10.9) | 22 | 88.2 | 8.89 | 0.44 | 15.8 | 83.1 | - | North West to Northern Cape (7442 h, R13.7m); Free State to Northern Cape (7442 h, R13.7m); Eastern Cape to Kwazulu Natal (6125 h, R9.8m); Eastern Cape to Free State (6125 h, R9.8m); Free State to Hydra Central (6125 h, R9.8m) |
| 2040, weather 2025: the same with the Eros to Isundu, Ariadne to Eros and Mercury to Umtu lines (the range) | 59.1 (52.2, 6.9) | 4 | 78.6 | 4.12 | 0.34 | 15.2 | 65.7 | - | North West to Northern Cape (6742 h, R7.3m); Free State to Northern Cape (6742 h, R7.3m); Eastern Cape to Kwazulu Natal (5090 h, R5.5m); Free State to Hydra Central (5090 h, R5.5m); Eastern Cape to Free State (5090 h, R5.5m) |
| 2040, weather 2025: rebuilt table, corridors extendable at R10,000 per MW-km | 13.8 (13.7, 0.1) | 2 | 37.3 | 1.75 | 0.33 | 22.6 | 31.8 | 44.1 GW, R3.21bn: Free State to Northern Cape 18.6; Free State to Gauteng 12.0; Northern Cape to Western Cape 6.8; Hydra Central to Northern Cape 4.4; Eastern Cape to Kwazulu Natal 2.4 | none over 4,000 h |
| 2040, weather 2025: rebuilt table, corridors extendable at R21,700 per MW-km | 14.5 (14.4, 0.1) | 2 | 37.9 | 1.75 | 0.33 | 22.4 | 32.2 | 40.5 GW, R6.31bn: Free State to Northern Cape 17.1; Free State to Gauteng 11.2; Northern Cape to Western Cape 5.8; Hydra Central to Northern Cape 4.2; Eastern Cape to Kwazulu Natal 2.2 | none over 4,000 h |
| 2040, weather 2025: rebuilt table, free siting of new wind and solar | 70.4 (68.5, 1.8) | 174 | 85.3 | 10.75 | 0.84 | 24.2 | 87.5 | - wind: Western Cape 33%, Hydra Central 29%, Eastern Cape 15%, Northern Cape 13%, Mpumalanga 7% | Free State to Northern Cape (8420 h, R35.6m); North West to Northern Cape (8214 h, R35.5m); Free State to Hydra Central (6432 h, R26.6m); Eastern Cape to Free State (5574 h, R23.8m); Eastern Cape to Kwazulu Natal (5566 h, R23.8m) |
| 2040, weather 2025: old table, one circuit dropped, full TDP (for comparison) | 55.9 (50.9, 5.0) | 2 | 76.3 | 3.39 | 0.33 | 16.2 | 62.6 | - | North West to Western Cape (6252 h, R6.2m); North West to Northern Cape (6240 h, R6.2m); Free State to Hydra Central (6221 h, R6.1m); Free State to Northern Cape (6224 h, R6.1m); Eastern Cape to Kwazulu Natal (4766 h, R4.8m); Eastern Cape to Free State (4805 h, R4.8m) |
| 2035, weather 2015: no limits | 2.8 (1.9, 1.0) | 0 | 68.5 | 0.00 | 0.16 | 10.5 | 48.9 | - | none over 4,000 h |
| 2035, weather 2015: old table, PyPSA-RSA's N-1 (labelled 'as drawn' before 738) | 48.6 (42.1, 6.5) | 0 | 114.3 | 0.00 | 0.24 | 10.5 | 81.3 | - | North West to Western Cape (7062 h, R5.6m); North West to Northern Cape (7033 h, R5.6m); Eastern Cape to Kwazulu Natal (6436 h, R5.0m); Free State to Kwazulu Natal (6259 h, R4.6m); Free State to Mpumalanga (6255 h, R4.6m); Free State to North West (6255 h, R4.6m); Free State to Gauteng (6255 h, R4.6m) |
| 2035, weather 2015: old table, one circuit dropped (a second derate) | 61.4 (50.1, 11.3) | 197 | 125.9 | 0.00 | 1.32 | 11.4 | 96.2 | - | North West to Northern Cape (8071 h, R56.9m); North West to Western Cape (7931 h, R56.3m); Eastern Cape to Kwazulu Natal (6611 h, R46.8m); Free State to Northern Cape (4418 h, R32.3m); Free State to Hydra Central (4204 h, R31.5m); Free State to Kwazulu Natal (5427 h, R25.3m); Free State to Mpumalanga (5338 h, R24.6m); Free State to North West (5338 h, R24.6m); Free State to Gauteng (5338 h, R24.6m |
| 2035, weather 2015: rebuilt table, limits only (thermal and loadability; the sensitivity) | 25.3 (21.4, 3.8) | 0 | 90.4 | 0.00 | 0.16 | 7.1 | 64.2 | - | North West to Northern Cape (5433 h, R3.6m); Free State to Northern Cape (5433 h, R3.6m) |
| 2035, weather 2015: rebuilt table, N-1 once (the central) | 49.5 (39.0, 10.5) | 1 | 114.6 | 0.00 | 0.38 | 7.9 | 82.5 | - | North West to Northern Cape (8112 h, R8.0m); Free State to Northern Cape (8112 h, R8.0m); Free State to Hydra Central (5205 h, R4.3m) |
| 2035, weather 2015: rebuilt table, N-1 once, commitment floor by design minimum | 49.5 (39.0, 10.5) | 1 | 114.6 | 0.00 | 0.38 | 8.1 | 82.5 | - | North West to Northern Cape (8087 h, R8.0m); Free State to Northern Cape (8087 h, R8.0m); Free State to Hydra Central (5205 h, R4.3m) |
| 2035, weather 2015: rebuilt table, the TDP's lines by their dates, N-1 once (Eros in KwaZulu-Natal, no Umtu line, Gamma to Grassridge twice) | 26.6 (23.3, 3.3) | 0 | 91.8 | 0.00 | 0.16 | 7.0 | 65.1 | - | North West to Northern Cape (5037 h, R3.4m); Free State to Northern Cape (5037 h, R3.4m); Eastern Cape to Kwazulu Natal (4041 h, R2.7m); Eastern Cape to Free State (4041 h, R2.7m); Free State to Hydra Central (4041 h, R2.7m) |
| 2035, weather 2015: the same with the Eros to Isundu, Ariadne to Eros and Mercury to Umtu lines (the range) | 18.1 (16.8, 1.3) | 0 | 83.3 | 0.00 | 0.16 | 7.3 | 59.2 | - | none over 4,000 h |
| 2035, weather 2015: rebuilt table, corridors extendable at R10,000 per MW-km | 3.2 (3.2, 0.0) | 0 | 68.9 | 0.00 | 0.16 | 10.3 | 49.1 | 31.1 GW, R2.25bn: Free State to Northern Cape 13.8; Free State to Gauteng 8.2; Northern Cape to Western Cape 4.5; Hydra Central to Northern Cape 3.0; Eastern Cape to Kwazulu Natal 1.6 | none over 4,000 h |
| 2035, weather 2015: rebuilt table, corridors extendable at R21,700 per MW-km | 3.9 (3.8, 0.0) | 0 | 69.5 | 0.00 | 0.16 | 10.1 | 49.6 | 27.4 GW, R4.28bn: Free State to Northern Cape 12.5; Free State to Gauteng 7.0; Northern Cape to Western Cape 3.7; Hydra Central to Northern Cape 2.6; Eastern Cape to Kwazulu Natal 1.5 | none over 4,000 h |
| 2035, weather 2015: rebuilt table, free siting of new wind and solar | 27.8 (26.8, 1.0) | 0 | 91.1 | 0.00 | 0.15 | 8.4 | 64.6 | - wind: Hydra Central 41%, Eastern Cape 22%, Northern Cape 16%, Mpumalanga 10%, Western Cape 6%, Kwazulu Natal 2% | North West to Northern Cape (6224 h, R4.2m); Free State to Northern Cape (6224 h, R4.2m); Eastern Cape to Kwazulu Natal (4848 h, R3.4m); Eastern Cape to Free State (4848 h, R3.4m); Free State to Hydra Central (4927 h, R3.3m) |
| 2035, weather 2015: old table, one circuit dropped, full TDP (for comparison) | 16.6 (16.0, 0.6) | 0 | 81.8 | 0.00 | 0.16 | 7.6 | 58.2 | - | none over 4,000 h |
| 2040, weather 2015: no limits | 11.5 (8.1, 3.4) | 0 | 41.7 | 3.57 | 0.44 | 23.8 | 39.4 | - | none over 4,000 h |
| 2040, weather 2015: old table, PyPSA-RSA's N-1 (labelled 'as drawn' before 738) | 95.5 (79.3, 16.2) | 1,279 | 95.1 | 29.09 | 3.13 | 18.8 | 147.3 | - | North West to Western Cape (8564 h, R171.8m); North West to Northern Cape (8559 h, R171.3m); Free State to North West (8387 h, R161.9m); Free State to Mpumalanga (8387 h, R161.9m); Free State to Gauteng (8387 h, R161.9m); Free State to Kwazulu Natal (8387 h, R161.9m); Eastern Cape to Kwazulu Natal (8116 h, R161.2m) |
| 2040, weather 2015: old table, one circuit dropped (a second derate) | 109.5 (86.8, 22.8) | 5,661 | 95.4 | 34.64 | 6.63 | 17.2 | 181.0 | - | North West to Northern Cape (8743 h, R353.7m); North West to Western Cape (8722 h, R352.4m); Eastern Cape to Kwazulu Natal (8063 h, R319.0m); Free State to Kwazulu Natal (7742 h, R230.2m); Free State to Mpumalanga (7742 h, R230.2m); Free State to North West (7742 h, R230.2m); Free State to Gauteng (7742 h, R230.2m) |
| 2040, weather 2015: rebuilt table, limits only (thermal and loadability; the sensitivity) | 62.6 (52.1, 10.5) | 0 | 86.9 | 8.09 | 0.57 | 18.3 | 81.4 | - | North West to Northern Cape (7440 h, R10.8m); Free State to Northern Cape (7440 h, R10.8m); Free State to Hydra Central (5051 h, R6.7m); Eastern Cape to Kwazulu Natal (4545 h, R5.9m); Eastern Cape to Free State (4545 h, R5.9m) |
| 2040, weather 2015: rebuilt table, N-1 once (the central) | 94.1 (74.1, 20.0) | 1,424 | 94.5 | 27.23 | 3.38 | 16.4 | 144.6 | - | North West to Northern Cape (8751 h, R143.5m); Free State to Northern Cape (8751 h, R143.5m); Free State to Hydra Central (6826 h, R94.9m); Eastern Cape to Kwazulu Natal (5175 h, R75.1m); Eastern Cape to Free State (5175 h, R75.1m) |
| 2040, weather 2015: rebuilt table, N-1 once, commitment floor by design minimum | 94.1 (74.1, 20.0) | 1,424 | 94.5 | 27.23 | 3.38 | 16.4 | 144.6 | - | North West to Northern Cape (8751 h, R143.5m); Free State to Northern Cape (8751 h, R143.5m); Free State to Hydra Central (6826 h, R94.9m); Eastern Cape to Kwazulu Natal (5175 h, R75.1m); Eastern Cape to Free State (5175 h, R75.1m) |
| 2040, weather 2015: rebuilt table, the TDP's lines by their dates, N-1 once (Eros in KwaZulu-Natal, no Umtu line, Gamma to Grassridge twice) | 64.8 (55.0, 9.8) | 0 | 88.2 | 9.07 | 0.50 | 18.5 | 83.9 | - | North West to Northern Cape (7046 h, R10.5m); Free State to Northern Cape (7046 h, R10.5m); Eastern Cape to Kwazulu Natal (5798 h, R8.4m); Free State to Hydra Central (5798 h, R8.4m); Eastern Cape to Free State (5798 h, R8.4m) |
| 2040, weather 2015: the same with the Eros to Isundu, Ariadne to Eros and Mercury to Umtu lines (the range) | 51.4 (45.3, 6.1) | 0 | 78.9 | 4.96 | 0.44 | 17.8 | 68.3 | - | North West to Northern Cape (6232 h, R6.0m); Free State to Northern Cape (6232 h, R6.0m); Eastern Cape to Kwazulu Natal (4770 h, R4.6m); Free State to Hydra Central (4770 h, R4.6m); Eastern Cape to Free State (4770 h, R4.6m) |
| 2040, weather 2015: rebuilt table, corridors extendable at R10,000 per MW-km | 12.2 (12.0, 0.2) | 0 | 42.2 | 3.57 | 0.44 | 23.1 | 39.7 | 43.7 GW, R3.13bn: Free State to Northern Cape 18.3; Free State to Gauteng 12.4; Northern Cape to Western Cape 6.2; Hydra Central to Northern Cape 4.5; Eastern Cape to Kwazulu Natal 2.3 | none over 4,000 h |
| 2040, weather 2015: rebuilt table, corridors extendable at R21,700 per MW-km | 13.0 (12.8, 0.2) | 0 | 42.9 | 3.57 | 0.44 | 23.0 | 40.2 | 39.5 GW, R6.07bn: Free State to Northern Cape 16.8; Free State to Gauteng 11.1; Northern Cape to Western Cape 5.2; Hydra Central to Northern Cape 4.3; Eastern Cape to Kwazulu Natal 2.1 | none over 4,000 h |
| 2040, weather 2015: rebuilt table, free siting of new wind and solar | 61.8 (60.1, 1.7) | 24 | 85.2 | 12.41 | 0.98 | 25.1 | 91.8 | - wind: Western Cape 34%, Hydra Central 29%, Eastern Cape 15%, Northern Cape 13%, Mpumalanga 7% | North West to Northern Cape (8303 h, R29.6m); Free State to Northern Cape (8303 h, R29.6m); Free State to Hydra Central (6225 h, R15.1m); Eastern Cape to Free State (5193 h, R12.3m); Eastern Cape to Kwazulu Natal (5185 h, R12.3m) |
| 2040, weather 2015: old table, one circuit dropped, full TDP (for comparison) | 48.8 (44.4, 4.4) | 0 | 76.8 | 4.56 | 0.44 | 18.2 | 66.0 | - | North West to Western Cape (5670 h, R5.2m); Free State to Hydra Central (5659 h, R5.2m); North West to Northern Cape (5660 h, R5.2m); Free State to Northern Cape (5651 h, R5.2m); Eastern Cape to Kwazulu Natal (4226 h, R3.8m); Eastern Cape to Free State (4250 h, R3.8m) |

Reading. (1) N-1 once on the rebuilt table lands where the old table's N-1 row did: 2035 curtailment 55.4 TWh against 54.7, coal 114 against 114, unserved 96 GWh against 2; 2040 103.2 TWh against 105.0, unserved 2,459 GWh against 2,634, gas 21.8 against 23.8 TWh. The old one-circuit row (67.9 and 119.0 TWh, 474 and 6,908 GWh) was the second derate and is withdrawn as the central; the old N-1 row stands as what PyPSA-RSA's table says. (2) What moved is where it binds. The 765 kV hub corridors no longer bind (Free State to Mpumalanga and to Hydra Central at 4,800 MW each carry the hub), and the two placeholders are gone from the list; the binding exits are now the Northern Cape's, North West to Northern Cape (726 MW) and Free State to Northern Cape (400 MW, the two Boundary to Perseus 275 kV circuits) in 8,200 to 8,700 hours at R22m (2035) to R191m (2040) per MW-year, with Hydra Central to Northern Cape (500 MW) and the Free State to Hydra Central behind them. That is the line file's own coverage of the Northern Cape's exits, the area with 34 GW of approved solar and 10 GW of approved wind in the siting: five circuits at 400 kV and below. (3) Limits only (no N-1) is the lower bound: 29.4 TWh in 2035 and 71.0 in 2040, unserved 0 and 31 GWh. The whole N-1 convention is worth 26 to 32 TWh of curtailment a year on this table, which is the size of the result the earlier rows attributed to the 0.7 factor. (4) The TDP's lines by their dates, N-1 once, with Eros in KwaZulu-Natal, no Umtu line and Gamma to Grassridge as two circuits: 30.8 TWh in 2035 and 73.5 in 2040 (unserved 0 and 22 GWh); with the Eros and Umtu lines as the file had them, 21.1 and 59.1 TWh. The range the two placements span is 10 to 14 TWh a year, and the old table's full-TDP row (19.3 and 55.9) sat below both because it also carried the placeholders and the double derate. (5) Corridors buildable from the N-1 central at R10,000 per MW-km and the run's 0.071: 31.7 GW for R2.31bn a year in 2035 and 44.1 GW for R3.21bn in 2040, Free State to Northern Cape first (13.8 and 18.6 GW), then Free State to Gauteng (8.3 and 12.0), Northern Cape to Western Cape, Hydra Central to Northern Cape and Eastern Cape to KwaZulu-Natal, which removes the whole effect (3.4 and 13.8 TWh curtailed, nothing unserved); at R21,700, 28.3 GW for R4.47bn and 40.5 GW for R6.31bn. The earlier figures (26 to 38 GW for R4.3 to 6.3bn at 0.08) are superseded: more corridor, less money, and on different links, the Northern Cape's exits rather than the North West's. (6) Free siting on the rebuilt table (the LP choosing wind and solar by area under the approved caps): 31.1 TWh in 2035 and 70.4 in 2040, the wind to Hydra Central (36%, 29%), the Eastern Cape, the Western Cape (13%, 33%) and the Northern Cape (14%, 13%), the solar to the North West (100%, 93%): the LP sites away from the Northern Cape's exits, and curtailment falls to the limits-only level. (7) The commitment floor by design minimum changes nothing on the N-1 central in either year: coal runs flat out behind the exits whatever the floor. (8) Weather 2015 (queue17; the rows in the table): the same picture at lower levels, N-1 once 49.5 TWh in 2035 and 94.1 in 2040 (the old N-1 row 48.6 and 95.5; unserved 1 and 1,424 GWh), limits only 25.3 and 62.6, the TDP's lines 26.6 and 64.8 (18.1 and 51.4 with the Eros and Umtu lines), corridors buildable at R10,000 31.6 GW for R2.3bn and 43.7 GW for R3.1bn on the same links in the same order, free siting 27.8 and 61.8. The stand-ins on the rebuilt table are in queue18.

### (c) Eros, Umtu and Gamma to Grassridge

Eros. The public record places the Eros 400 kV substation near Harding, KwaZulu-Natal (Engineering News, 27 June 2014, on the Eastern Cape strengthening projects: the line from Eros to the new Vuyani substation at Mthatha, with about 25 km still to be built), and Eskom's own project page describes the Eros to Neptune 400 kV network as running from KwaZulu-Natal into the Eastern Cape (search summary, not read from eskom.co.za). The model's substation file places Eros in the Eastern Cape by hand (src manual, 132 kV, at 30.61 S 29.91 E, which is Harding). No public source links Eros to the Isundu 765 kV line; Isundu's own record (Engineering News, 29 May 2015) ties it to the Venus to Sigma to Hector to Ariadne 765 kV corridor near Pietermaritzburg and to Mbewu. So the central mapping here puts Eros in KwaZulu-Natal: the existing Eros to Vuyani 400 kV circuit becomes the Eastern Cape to KwaZulu-Natal corridor (813 MW N-1 once, the same figure the old table carried), and the TDP's Ariadne to Eros 400 kV and Eros to Isundu 765 kV lines are inside KwaZulu-Natal and add nothing between the areas. The range: with Eros in the Eastern Cape (the file's placement) those two lines add 3,900 MW to the corridor by 2032 and the existing corridor has no circuit in the line file; both cases are run (queue14, tdp_lines_v2.json against tdp_lines_v2_with.json).

Umtu. No public source places Umtu or confirms a Mercury to Umtu 765 kV line; a commercial project listing gives an Umtu 765/400 kV substation upgrade expected in 2027 at 'Umtu, Cape' (power-technology.com, a paid profile), and Eskom's Mercury to Ferrum line runs 428 km through a new Mookodi substation to Ferrum near Kathu (search summary). The model's TDP file maps Mercury to Umtu as North West to Northern Cape, 3,000 MW in 2033. Central: left out; the range runs it in the with-case.

Gamma to Grassridge. Two 765 kV lines of about 360 km each, from Gamma (Northern Cape side of the Karoo) to Grassridge (Eastern Cape), with two 765 kV feeder bays at Gamma and two 2,000 MVA 765/400 kV transformers at Grassridge (SAHRIS project record for the NTCSA application, sahris.org.za/node/373779; Eskom's EIA notice 12/12/20/801 for two 765 kV lines, as quoted in search results). The model's line file has both circuits as planned features (Southern Grid Phase 3 and Phase 4). Mapped here as two circuits of 3,000 MW in 2032 (tdp_lines_v2.json), against one before.

### (d) The control and the 727 (a) split on the run's accounting

On the run's accounting applied to both sides, the 2035 control takes the pool on 14.3 GW of its solar and the Cape allowance on its wind, costs R144.5bn against the run's mix at R156.4bn priced the same way, and the gap is R11.9bn, against R11.6bn on the test's accounting. The repricing moves both sides by the same credits and the LP's mix by 0.6 GW of solar, so the gap does not halve: the review's R5.8bn is the run credited and the control not, which is not a like-for-like comparison. Corridors at 0.071 do not enter the no-limits control. With the area caps lifted on the run's accounting the LP takes 22.3 GW of wind against 24.7 on the test's, since the credited solar is cheaper to it, and the gap is R13.0bn against R13.3bn. On one bus the run's accounting gives a gap of R6.8bn against R6.3bn on the test's, the same reading. In 2040 the control on the run's accounting builds 30.0 GW of wind and 32.9 of solar (22.3 credited) at R173.0bn against the run's mix at R192.3bn, a gap of R19.2bn against R16.1bn on the test's: the run's 4.3 GW of open cycle now carries the integration charge (R1.6bn) where the LP's 0.6 GW carries R0.2bn, and the pool credits both sides the same 22.3 GW. The repricing therefore widens the 2040 gap and leaves 2035's unchanged; on neither year does it halve it. With the area caps lifted on the run's accounting the 2040 LP builds 38.0 GW of wind (39.8 on the test's) and 22.3 GW of solar, exactly the pool, so the credit fills the pool and no more, with 10.5 GW / 48 GWh of lithium, at R163.7bn, R9.3bn below its capped control and R28.6bn below the run's mix priced the same way (R26.2bn on the test's). Without the reuse pool (732's pair on the repriced costs) the 2040 control builds the same 30.0 GW of wind and 32.9 of solar as with it: the pool credits 22.3 GW of a solar build the LP makes anyway, so in 2040 it moves nothing and the gap is R19.2bn either way; in 2035 the same pair moves 0.7 GW of wind (22.1 against 22.8) and R0.1bn of gap. On one bus with the national series the 2040 LP on the run's accounting builds 33.6 GW of wind (35.0 on the test's), 31.5 of solar (22.3 credited), 12.9 GW / 69 GWh of lithium and 3.4 GW of open cycle, at R186.9bn against the run's mix at R192.3bn: a gap of R5.4bn against R3.6bn on the test's, so the regional resource is worth R13.8bn of the R19.2bn (72%, against 78% on the test's). Wind forced to the run's 40.7 GW on the run's accounting costs the LP R6.1bn a year above its own choice (R4.9bn on the test's; R570,000 per MW-year on the 10.7 GW it did not want) and leaves a gap of R13.2bn (R11.3bn). So the 2040 split on the run's accounting keeps its shape: the caps hold 8.0 of the 10.7 GW out of the LP's mix (38.0 GW uncapped), the regional resource is R13.8bn of the gap, R5.4bn is left on one bus, and the run's extra wind costs the LP R6.1bn to accept; every figure a little larger than on the test's accounting because the credited solar is cheaper to the LP and the run's open cycle carries the charge. The full table (docs/regional-audit/tables738d.md):

| year | case | accounting | wind GW (run) | solar GW (run) | of it credited | lithium GW, GWh | open cycle GW | cost R bn | the run's mix R bn | gap R bn |
|---|---|---|---|---|---|---|---|---|---|---|
| 2035 | control | the test's | 22.2 (27.2) | 13.7 (17.7) | 0.0 | 7.0, 25 | 0.00 | 150.6 | 162.2 | 11.6 |
| 2035 | control | the run's | 22.1 (27.2) | 14.3 (17.7) | 14.3 | 7.0, 24 | 0.00 | 144.5 | 156.4 | 11.9 |
| 2035 | area caps lifted | the test's | 24.7 (27.2) | 9.7 (17.7) | 0.0 | 5.0, 16 | 0.00 | 148.9 | 162.2 | 13.3 |
| 2035 | area caps lifted | the run's | 22.3 (27.2) | 14.3 (17.7) | 14.3 | 5.6, 20 | 0.00 | 143.5 | 156.4 | 13.0 |
| 2035 | one bus on the national series | the test's | 25.1 (27.2) | 12.6 (17.7) | 0.0 | 6.7, 26 | 0.00 | 155.9 | 162.2 | 6.3 |
| 2035 | one bus on the national series | the run's | 24.3 (27.2) | 14.3 (17.7) | 14.3 | 6.8, 27 | 0.00 | 149.7 | 156.4 | 6.8 |
| 2035 | wind forced to the run's MW | the test's | 27.2 (27.2) | 9.6 (17.7) | 0.0 | 5.9, 20 | 0.00 | 152.4 | 162.2 | 9.8 |
| 2035 | wind forced to the run's MW | the run's | 27.2 (27.2) | 12.0 (17.7) | 12.0 | 5.6, 19 | 0.00 | 147.4 | 156.4 | 9.0 |
| 2035 | control without the reuse pool (the Cape allowance and the gas charge kept; 732's pair on the repriced costs) | the run's less the pool | 22.8 (27.2) | 13.2 (17.7) | 0.0 | 6.7, 23 | 0.00 | 149.7 | 161.7 | 12.0 |
| 2040 | control | the test's | 29.1 (40.7) | 31.9 (24.8) | 0.0 | 13.2, 87 | 1.08 | 181.7 | 197.8 | 16.1 |
| 2040 | control | the run's | 30.0 (40.7) | 32.9 (24.8) | 22.3 | 13.5, 90 | 0.64 | 173.0 | 192.3 | 19.2 |
| 2040 | area caps lifted | the test's | 39.8 (40.7) | 19.2 (24.8) | 0.0 | 10.3, 45 | 0.00 | 171.6 | 197.8 | 26.2 |
| 2040 | area caps lifted | the run's | pending | | | | | | | |
| 2040 | one bus on the national series | the test's | 35.0 (40.7) | 28.1 (24.8) | 0.0 | 11.6, 60 | 3.98 | 194.3 | 197.8 | 3.6 |
| 2040 | one bus on the national series | the run's | pending | | | | | | | |
| 2040 | wind forced to the run's MW | the test's | 40.7 (40.7) | 21.5 (24.8) | 0.0 | 11.2, 56 | 1.98 | 186.6 | 197.8 | 11.3 |
| 2040 | wind forced to the run's MW | the run's | pending | | | | | | | |

### (e) The tie-out: diesel and gas, the hourly correlation, the counts-file path, the floor

The hourly correlation of the LP's availability series (the regional series at the siting shares, scaled to the engine's annual energy) against the engine's national series (docs/regional-audit/hourly_corr.py):

2035, weather 2025.

| series | engine TWh | LP TWh | hourly correlation | mean absolute gap MW | TWh moved between hours |
|---|---|---|---|---|---|
| existing wind | 14.51 | 14.51 | 0.961 | 237 | 1.0 |
| new wind | 99.14 | 99.14 | 0.943 | 1,561 | 6.8 |
| existing solar | 8.01 | 8.01 | 0.968 | 177 | 0.8 |
| new solar | 44.35 | 44.32 | 0.999 | 135 | 0.6 |
| all | 166.01 | 165.98 | 0.968 | 1,809 | 7.9 |

2040, weather 2025.

| series | engine TWh | LP TWh | hourly correlation | mean absolute gap MW | TWh moved between hours |
|---|---|---|---|---|---|
| existing wind | 14.51 | 14.51 | 0.961 | 237 | 1.0 |
| new wind | 148.18 | 148.18 | 0.943 | 2,334 | 10.2 |
| existing solar | 8.01 | 8.01 | 0.968 | 177 | 0.8 |
| new solar | 62.18 | 62.13 | 0.999 | 189 | 0.8 |
| all | 232.88 | 232.83 | 0.966 | 2,580 | 11.3 |

The tie-out holds in annual energy to 0.03 TWh and not hour by hour: the new wind's shape differs most (correlation 0.943, a mean absolute gap of 1.6 GW in 2035 and 2.3 GW in 2040, 7 to 10 TWh moved between hours), the solar's least. The tie-out tables (717 (c)) now carry diesel and gas columns, which show the coal-fixed variant burning 4.0 TWh of diesel in 2035 (the engine 0.5) and 4.7 TWh of gas in 2040 (the engine 2.9) to absorb that shape difference; the free and floor variants hide it in coal and storage. The counts-file path now resolves beside the script (the committed layout) and one level up (the scratch layout). The commitment floor now uses each area's capacity-weighted design minimum from the fleet's groups (0.57 for the groups whose own minimum is 0.65, 0.52 for the groups at 0.50, the page's coalMslDesign from 2030) instead of 0.57 for every unit; the floor variants are rerun on the rebuilt table (queue14, coalmin 1).

### (g) The three builds through the network test on the rebuilt table (722 (a) rerun; queue18)

| build, year: case | curtailed TWh | unserved GWh | coal TWh | gas TWh | diesel TWh | storage TWh | fuel and carbon R bn | corridors built | binding corridors over 4,000 h |
|---|---|---|---|---|---|---|---|---|---|
| Fossil-free 2035: no limits | 66.3 | 0 | 0.7 | 0.00 | 0.00 | 49.0 | 0.5 | - | none over 4,000 h |
| Fossil-free 2035: old table, PyPSA-RSA's N-1 (was 'as drawn') | 155.1 | 0 | 76.4 | 0.00 | 0.00 | 13.8 | 53.4 | - | North West to Northern Cape (8760 h, R6.0m); North West to Western Cape (8760 h, R6.0m); Free State to Kwazulu Natal (8760 h, R6.0m); Free State to Mpumalanga (8760 h, R6.0m); Free State to North West (8760 h, R6.0m); Free State to Gauteng (8760 h, R6.0m); Eastern Cape to Kwazulu Natal (8400 h, R5.8 |
| Fossil-free 2035: old table, one circuit dropped (superseded) | 169.0 | 0 | 89.9 | 0.00 | 0.00 | 11.7 | 62.8 | - | Free State to Kwazulu Natal (8760 h, R6.1m); North West to Northern Cape (8760 h, R6.1m); North West to Western Cape (8760 h, R6.1m); Free State to Mpumalanga (8760 h, R6.1m); Free State to North West (8760 h, R6.1m); Free State to Gauteng (8760 h, R6.1m); Eastern Cape to Kwazulu Natal (8149 h, R5.7 |
| Fossil-free 2035: rebuilt, limits only | 107.2 | 0 | 30.7 | 0.00 | 0.00 | 31.7 | 21.4 | - | North West to Northern Cape (8580 h, R5.7m); Free State to Northern Cape (8580 h, R5.7m); Free State to Hydra Central (6145 h, R4.0m); Eastern Cape to Kwazulu Natal (5403 h, R3.5m); Eastern Cape to Free State (5403 h, R3.5m) |
| Fossil-free 2035: rebuilt, N-1 once | 141.7 | 0 | 63.0 | 0.00 | 0.00 | 16.5 | 44.0 | - | North West to Northern Cape (8760 h, R5.9m); Free State to Northern Cape (8760 h, R5.9m); Free State to Hydra Central (7207 h, R4.8m); Eastern Cape to Kwazulu Natal (5739 h, R3.8m); Eastern Cape to Free State (5741 h, R3.8m) |
| Fossil-free 2035: rebuilt, the TDP's lines | 109.3 | 0 | 32.8 | 0.00 | 0.00 | 31.0 | 22.9 | - | North West to Northern Cape (8580 h, R5.7m); Free State to Northern Cape (8580 h, R5.7m); Eastern Cape to Kwazulu Natal (6738 h, R4.4m); Free State to Hydra Central (6738 h, R4.4m); Eastern Cape to Free State (6738 h, R4.4m) |
| Fossil-free 2035: rebuilt, corridors at R10,000 | 73.8 | 0 | 1.0 | 0.00 | 0.00 | 54.1 | 0.7 | 22.5 GW, R1.50bn: Free State to Northern Cape 10.5; Free State to Gauteng 5.6; Hydra Central to Northern Cape 3.6; Northern Cape to Western Cape 1.7; Eastern Cape to Kwazulu Natal 1.0 | none over 4,000 h |
| Fossil-free 2035: rebuilt, corridors at R21,700 | 74.1 | 0 | 1.3 | 0.00 | 0.00 | 54.4 | 0.9 | 20.6 GW, R2.94bn: Free State to Northern Cape 10.1; Free State to Gauteng 5.1; Hydra Central to Northern Cape 3.2; Northern Cape to Western Cape 1.1; Eastern Cape to Kwazulu Natal 1.1 | none over 4,000 h |
| Fossil-free 2040: no limits | 207.8 | 0 | 0.0 | 0.00 | 0.00 | 43.2 | 0.0 | - | none over 4,000 h |
| Fossil-free 2040: old table, PyPSA-RSA's N-1 (was 'as drawn') | 306.3 | 57,578 | 0.0 | 0.00 | 0.00 | 32.9 | 0.0 | - | Free State to Mpumalanga (8760 h, R729.9m); Free State to Kwazulu Natal (8760 h, R729.9m); Free State to Gauteng (8760 h, R729.9m); North West to Northern Cape (8760 h, R729.8m); North West to Western Cape (8760 h, R729.8m); Free State to North West (8760 h, R729.8m); Eastern Cape to Kwazulu Natal ( |
| Fossil-free 2040: old table, one circuit dropped (superseded) | 320.0 | 70,633 | 0.0 | 0.00 | 0.00 | 28.7 | 0.0 | - | Free State to Kwazulu Natal (8760 h, R732.3m); Free State to Mpumalanga (8760 h, R732.3m); Free State to Gauteng (8760 h, R732.3m); North West to Northern Cape (8760 h, R732.1m); North West to Western Cape (8760 h, R732.1m); Free State to North West (8760 h, R732.1m); Eastern Cape to Kwazulu Natal ( |
| Fossil-free 2040: rebuilt, limits only | 251.7 | 7,635 | 0.0 | 0.00 | 0.00 | 61.8 | 0.0 | - | North West to Northern Cape (4453 h, R348.3m); Free State to Northern Cape (4453 h, R348.3m) |
| Fossil-free 2040: rebuilt, N-1 once | 274.4 | 29,008 | 0.0 | 0.00 | 0.00 | 55.2 | 0.0 | - | North West to Northern Cape (7933 h, R647.5m); Free State to Northern Cape (7932 h, R645.9m); Free State to Hydra Central (7127 h, R576.9m); Eastern Cape to Kwazulu Natal (6482 h, R525.0m); Eastern Cape to Free State (6475 h, R522.9m) |
| Fossil-free 2040: rebuilt, the TDP's lines | 253.7 | 9,422 | 0.0 | 0.00 | 0.00 | 61.8 | 0.0 | - | North West to Northern Cape (4454 h, R351.4m); Free State to Northern Cape (4454 h, R351.4m) |
| Fossil-free 2040: rebuilt, corridors at R10,000 | 242.9 | 0 | 0.0 | 0.00 | 0.00 | 65.4 | 0.0 | 11.9 GW, R0.70bn: Free State to Northern Cape 7.1; Free State to Gauteng 4.9 | none over 4,000 h |
| Fossil-free 2040: rebuilt, corridors at R21,700 | 242.9 | 0 | 0.0 | 0.00 | 0.00 | 65.6 | 0.0 | 11.8 GW, R1.51bn: Free State to Northern Cape 7.1; Free State to Gauteng 4.7 | none over 4,000 h |
| Deep 2035: no limits | 59.2 | 0 | 18.8 | 0.00 | 0.00 | 24.7 | 13.2 | - | none over 4,000 h |
| Deep 2035: old table, PyPSA-RSA's N-1 (was 'as drawn') | 134.2 | 0 | 89.5 | 0.00 | 0.01 | 10.3 | 62.6 | - | North West to Northern Cape (8360 h, R5.9m); North West to Western Cape (8362 h, R5.9m); Free State to Mpumalanga (8263 h, R5.8m); Free State to North West (8263 h, R5.8m); Free State to Gauteng (8263 h, R5.8m); Free State to Kwazulu Natal (8263 h, R5.8m); Eastern Cape to Kwazulu Natal (8024 h, R5.6 |
| Deep 2035: old table, one circuit dropped (superseded) | 147.6 | 2 | 102.9 | 0.00 | 0.23 | 11.0 | 73.3 | - | Free State to Kwazulu Natal (8309 h, R13.4m); Eastern Cape to Kwazulu Natal (7997 h, R12.8m); North West to Northern Cape (8650 h, R12.6m); North West to Western Cape (8566 h, R12.5m); Free State to Mpumalanga (8307 h, R11.9m); Free State to North West (8307 h, R11.9m); Free State to Gauteng (8307 h |
| Deep 2035: rebuilt, limits only | 93.6 | 0 | 49.8 | 0.00 | 0.00 | 14.7 | 34.8 | - | North West to Northern Cape (6861 h, R4.6m); Free State to Northern Cape (6861 h, R4.6m); Free State to Hydra Central (5371 h, R3.5m); Eastern Cape to Kwazulu Natal (4809 h, R3.2m); Eastern Cape to Free State (4809 h, R3.2m) |
| Deep 2035: rebuilt, N-1 once | 125.4 | 0 | 80.2 | 0.00 | 0.02 | 7.1 | 56.2 | - | North West to Northern Cape (8596 h, R6.1m); Free State to Northern Cape (8596 h, R6.1m); Free State to Hydra Central (7155 h, R4.9m); Eastern Cape to Kwazulu Natal (5798 h, R4.0m); Eastern Cape to Free State (5796 h, R4.0m) |
| Deep 2035: rebuilt, the TDP's lines | 96.5 | 0 | 52.6 | 0.00 | 0.00 | 13.7 | 36.7 | - | North West to Northern Cape (7024 h, R4.6m); Free State to Northern Cape (7024 h, R4.6m); Eastern Cape to Kwazulu Natal (6190 h, R4.1m); Eastern Cape to Free State (6190 h, R4.1m); Free State to Hydra Central (6190 h, R4.1m) |
| Deep 2035: rebuilt, corridors at R10,000 | 60.9 | 0 | 19.3 | 0.00 | 0.00 | 24.8 | 13.5 | 31.0 GW, R2.27bn: Free State to Northern Cape 13.7; Free State to Gauteng 8.4; Northern Cape to Western Cape 4.7; Hydra Central to Northern Cape 2.5; Eastern Cape to Kwazulu Natal 1.7 | none over 4,000 h |
| Deep 2035: rebuilt, corridors at R21,700 | 61.6 | 0 | 20.0 | 0.00 | 0.00 | 24.8 | 14.0 | 27.5 GW, R4.27bn: Free State to Northern Cape 12.3; Free State to Gauteng 7.4; Northern Cape to Western Cape 3.6; Hydra Central to Northern Cape 2.6; Eastern Cape to Kwazulu Natal 1.5 | none over 4,000 h |
| Deep 2040: no limits | 74.9 | 0 | 7.3 | 0.00 | 0.04 | 47.9 | 5.4 | - | none over 4,000 h |
| Deep 2040: old table, PyPSA-RSA's N-1 (was 'as drawn') | 173.7 | 5,877 | 90.3 | 0.00 | 4.08 | 28.4 | 88.4 | - | Free State to Kwazulu Natal (8760 h, R261.1m); North West to Northern Cape (8760 h, R260.5m); North West to Western Cape (8760 h, R260.5m); Free State to Mpumalanga (8760 h, R260.5m); Free State to North West (8760 h, R260.5m); Free State to Gauteng (8760 h, R260.5m); Eastern Cape to Kwazulu Natal ( |
| Deep 2040: old table, one circuit dropped (superseded) | 187.6 | 11,292 | 96.0 | 0.00 | 6.76 | 28.3 | 109.2 | - | Free State to Kwazulu Natal (8760 h, R402.9m); Eastern Cape to Kwazulu Natal (8395 h, R393.2m); North West to Northern Cape (8760 h, R392.2m); North West to Western Cape (8760 h, R392.2m); Free State to Mpumalanga (8760 h, R392.2m); Free State to North West (8760 h, R392.2m); Free State to Gauteng ( |
| Deep 2040: rebuilt, limits only | 124.9 | 30 | 51.0 | 0.00 | 0.35 | 30.5 | 37.8 | - | North West to Northern Cape (8468 h, R14.3m); Free State to Northern Cape (8468 h, R14.3m); Free State to Hydra Central (6464 h, R10.0m); Eastern Cape to Kwazulu Natal (5746 h, R9.0m); Eastern Cape to Free State (5746 h, R9.0m) |
| Deep 2040: rebuilt, N-1 once | 159.6 | 3,085 | 79.3 | 0.00 | 3.38 | 28.2 | 76.4 | - | North West to Northern Cape (8760 h, R180.1m); Free State to Northern Cape (8760 h, R180.1m); Free State to Hydra Central (7411 h, R158.0m); Eastern Cape to Kwazulu Natal (6146 h, R146.1m); Eastern Cape to Free State (6146 h, R146.1m) |
| Deep 2040: rebuilt, the TDP's lines | 127.7 | 58 | 53.7 | 0.00 | 0.42 | 30.3 | 40.2 | - | North West to Northern Cape (8267 h, R15.1m); Free State to Northern Cape (8267 h, R15.1m); Eastern Cape to Kwazulu Natal (6998 h, R12.4m); Free State to Hydra Central (6998 h, R12.4m); Eastern Cape to Free State (6998 h, R12.4m) |
| Deep 2040: rebuilt, corridors at R10,000 | 78.0 | 0 | 7.9 | 0.00 | 0.04 | 51.5 | 5.8 | 32.6 GW, R2.27bn: Free State to Northern Cape 14.8; Free State to Gauteng 8.9; Northern Cape to Western Cape 3.7; Hydra Central to Northern Cape 3.6; Eastern Cape to Kwazulu Natal 1.6 | none over 4,000 h |
| Deep 2040: rebuilt, corridors at R21,700 | 78.5 | 0 | 8.4 | 0.00 | 0.04 | 51.8 | 6.2 | 29.9 GW, R4.38bn: Free State to Northern Cape 13.9; Free State to Gauteng 8.7; Hydra Central to Northern Cape 3.3; Northern Cape to Western Cape 2.5; Eastern Cape to Kwazulu Natal 1.5 | none over 4,000 h |
| Central 2035: no limits | 3.1 | 0 | 62.9 | 0.00 | 0.19 | 10.3 | 45.1 | - | none over 4,000 h |
| Central 2035: old table, PyPSA-RSA's N-1 (was 'as drawn') | 54.7 | 2 | 114.2 | 0.00 | 0.38 | 9.8 | 82.1 | - | North West to Northern Cape (7464 h, R6.8m); North West to Western Cape (7460 h, R6.8m); Eastern Cape to Kwazulu Natal (6848 h, R5.9m); Free State to Mpumalanga (6862 h, R5.9m); Free State to North West (6862 h, R5.9m); Free State to Gauteng (6862 h, R5.9m); Free State to Kwazulu Natal (6862 h, R5.9 |
| Central 2035: old table, one circuit dropped (superseded) | 67.9 | 474 | 126.5 | 0.00 | 0.85 | 10.3 | 93.7 | - | North West to Western Cape (8036 h, R55.0m); North West to Northern Cape (8130 h, R55.0m); Eastern Cape to Kwazulu Natal (6809 h, R38.2m); Free State to Northern Cape (4680 h, R32.1m); Free State to Hydra Central (4505 h, R30.1m); Free State to Kwazulu Natal (5486 h, R23.0m); Free State to Mpumalang |
| Central 2035: rebuilt, limits only | 29.4 | 0 | 88.6 | 0.00 | 0.20 | 6.5 | 63.2 | - | North West to Northern Cape (6061 h, R4.2m); Free State to Northern Cape (6061 h, R4.2m) |
| Central 2035: rebuilt, N-1 once | 55.4 | 96 | 114.1 | 0.00 | 0.61 | 6.6 | 83.5 | - | North West to Northern Cape (8242 h, R21.6m); Free State to Northern Cape (8242 h, R21.6m); Free State to Hydra Central (5486 h, R7.8m); Eastern Cape to Kwazulu Natal (4286 h, R5.9m); Eastern Cape to Free State (4286 h, R5.9m) |
| Central 2035: rebuilt, the TDP's lines | 30.8 | 0 | 90.0 | 0.00 | 0.19 | 6.4 | 64.1 | - | North West to Northern Cape (5693 h, R3.8m); Free State to Northern Cape (5693 h, R3.8m); Eastern Cape to Kwazulu Natal (4361 h, R3.0m); Eastern Cape to Free State (4361 h, R3.0m); Free State to Hydra Central (4361 h, R3.0m) |
| Central 2035: rebuilt, corridors at R10,000 | 3.4 | 0 | 63.2 | 0.00 | 0.19 | 10.1 | 45.3 | 31.7 GW, R2.31bn: Free State to Northern Cape 13.8; Free State to Gauteng 8.3; Northern Cape to Western Cape 4.7; Hydra Central to Northern Cape 3.0; Eastern Cape to Kwazulu Natal 1.9 | none over 4,000 h |
| Central 2035: rebuilt, corridors at R21,700 | 4.1 | 0 | 63.8 | 0.00 | 0.19 | 9.9 | 45.7 | 28.3 GW, R4.47bn: Free State to Northern Cape 12.7; Free State to Gauteng 7.2; Northern Cape to Western Cape 4.0; Hydra Central to Northern Cape 2.7; Eastern Cape to Kwazulu Natal 1.7 | none over 4,000 h |
| Central 2040: no limits | 13.1 | 2 | 36.9 | 1.75 | 0.33 | 23.4 | 31.5 | - | none over 4,000 h |
| Central 2040: old table, PyPSA-RSA's N-1 (was 'as drawn') | 105.0 | 2,634 | 99.8 | 23.75 | 3.02 | 16.9 | 138.6 | - | North West to Northern Cape (8541 h, R198.0m); North West to Western Cape (8544 h, R197.9m); Free State to Mpumalanga (8460 h, R196.8m); Free State to North West (8460 h, R196.8m); Free State to Gauteng (8460 h, R196.8m); Free State to Kwazulu Natal (8460 h, R196.8m); Eastern Cape to Kwazulu Natal ( |
| Central 2040: old table, one circuit dropped (superseded) | 119.0 | 6,908 | 99.9 | 31.74 | 4.16 | 14.8 | 162.7 | - | North West to Northern Cape (8701 h, R291.3m); North West to Western Cape (8659 h, R290.0m); Eastern Cape to Kwazulu Natal (7932 h, R265.6m); Free State to Mpumalanga (7124 h, R136.8m); Free State to North West (7124 h, R136.8m); Free State to Gauteng (7124 h, R136.8m); Free State to Kwazulu Natal ( |
| Central 2040: rebuilt, limits only | 71.0 | 31 | 86.6 | 7.92 | 0.42 | 15.3 | 79.9 | - | North West to Northern Cape (7649 h, R13.6m); Free State to Northern Cape (7649 h, R13.6m); Free State to Hydra Central (5358 h, R7.8m); Eastern Cape to Kwazulu Natal (4873 h, R7.2m); Eastern Cape to Free State (4873 h, R7.2m) |
| Central 2040: rebuilt, N-1 once | 103.2 | 2,459 | 99.5 | 21.84 | 3.31 | 15.6 | 136.2 | - | North West to Northern Cape (8732 h, R191.2m); Free State to Northern Cape (8732 h, R191.2m); Free State to Hydra Central (7085 h, R154.6m); Eastern Cape to Kwazulu Natal (5632 h, R138.7m); Eastern Cape to Free State (5632 h, R138.7m) |
| Central 2040: rebuilt, the TDP's lines | 73.5 | 22 | 88.2 | 8.89 | 0.44 | 15.8 | 83.1 | - | North West to Northern Cape (7442 h, R13.7m); Free State to Northern Cape (7442 h, R13.7m); Eastern Cape to Kwazulu Natal (6125 h, R9.8m); Eastern Cape to Free State (6125 h, R9.8m); Free State to Hydra Central (6125 h, R9.8m) |
| Central 2040: rebuilt, corridors at R10,000 | 13.8 | 2 | 37.3 | 1.75 | 0.33 | 22.6 | 31.8 | 44.1 GW, R3.21bn: Free State to Northern Cape 18.6; Free State to Gauteng 12.0; Northern Cape to Western Cape 6.8; Hydra Central to Northern Cape 4.4; Eastern Cape to Kwazulu Natal 2.4 | none over 4,000 h |
| Central 2040: rebuilt, corridors at R21,700 | 14.5 | 2 | 37.9 | 1.75 | 0.33 | 22.4 | 32.2 | 40.5 GW, R6.31bn: Free State to Northern Cape 17.1; Free State to Gauteng 11.2; Northern Cape to Western Cape 5.8; Hydra Central to Northern Cape 4.2; Eastern Cape to Kwazulu Natal 2.2 | none over 4,000 h |

Reading. The rebuilt table changes the stand-ins' 2040 results more than the central build's, because their coal is gone and the Free State hub's 765 kV lines, rated at their own voltage, now carry the inland night. Fossil-free 2040: unserved energy on today's corridors N-1 once is 29.0 TWh against the old N-1 row's 57.6 (and the superseded one-circuit row's 70.6); with limits only 7.6 TWh; with the TDP's lines (tdp_lines_v2.json: Eros in KwaZulu-Natal, no Umtu line, Gamma to Grassridge twice) 9.4 TWh, against the old mapping's 4.2 TWh, which carried the Eros and Umtu lines; and corridors buildable at R10,000 per MW-km serve everything for 11.9 GW and R0.70bn a year (Free State to Northern Cape 7.1 GW, Free State to Gauteng 4.9), against 20 GW and R2.5bn on the old table. Fossil-free 2035: 141.7 TWh curtailed and 63 TWh of coal on N-1 once (the old N-1 row 155.1 and 76), 107.2 and 31 with limits only, 109.3 and 33 with the TDP's lines, and 22.5 GW of corridor for R1.50bn a year takes it to 73.8 TWh with 1 TWh of coal. Deep: 2035 125.4 TWh and 80 TWh of coal on N-1 once (the old row 134.2 and 90), 96.5 with the TDP's lines; 2040 159.6 TWh and 3.1 TWh unserved on N-1 once (the old row 173.7 and 5.9), 127.7 TWh and 58 GWh with the TDP's lines, and 32.6 GW of corridor for R2.27bn a year removes it. What the three builds say together is as in 722 (a): the central build's network cost is a few billion rand a year and curtailment is its measure; Fossil-free's is adequacy, now 29 TWh unserved on today's corridors rather than 58, with the plan's inter-area lines leaving 9 TWh and the LP's own 12 GW of corridor, on the Free State hub's exits to the Northern Cape and Gauteng, removing it; Deep is adequate on the plan's lines and 3 TWh short on today's. The corridors the LP buys are the same links for every build (Free State to Northern Cape first, then Free State to Gauteng, Hydra Central to Northern Cape, Northern Cape to Western Cape, Eastern Cape to KwaZulu-Natal), and the stand-ins stay on build 2026-11-03a until their finals are given.

### (f) What follows on the rebuilt table and the repriced costs

The 732 credit pair and 737's first cut (731) run on the rebuilt table and the run's accounting after (b) and (d); the queued cases on the old table (the R21,700 beyond-TDP mixes, the Fossil-free variant, the 731 first cut on the old table) were not launched.

## Message 739: today's fleets on the rebuilt table, the Northern Cape's exits, the corridor build in kilometres against the industry's rate (6 Nov 2026; adds to 738; build 2026-11-05f, the every-change pass, and the 2026-11-04b today's-fleet dumps; nothing to be quoted)

### (a) Today's fleets on the rebuilt table

The 718 (a) cases rerun on the rebuilt table (queue16b): the 2025 and 2026 states of the today's-fleet dumps (build 2026-11-04b, weather 2025), fixed build, hourly, Koeberg on its calendar (a unit out on days 1 to 302 and 60 to 68, as 718 (a)), N-1 once and limits only, beside the old table's rows and no limits.

| fleet (build 2026-11-04b) | case | curtailed TWh | unserved GWh | coal TWh | diesel TWh | corridors binding over 1,000 hours | hours at the limit, any corridor |
|---|---|---|---|---|---|---|---|
| 2025 | no limits | 0.00 | 14 | 171.0 | 1.77 | none | 0 (Eastern Cape to Hydra Central) |
| 2025 | old table, PyPSA-RSA's N-1 (labelled 'as drawn' before 738) | 0.00 | 14 | 171.0 | 1.77 | none | 8760 (Gauteng to Limpopo) |
| 2025 | old table, one circuit dropped | 0.00 | 14 | 171.0 | 1.78 | none | 8760 (Gauteng to Limpopo) |
| 2025 | rebuilt table, limits only | 0.00 | 14 | 171.0 | 1.77 | none | 1455 (Eastern Cape to Free State) |
| 2025 | rebuilt table, N-1 once | 0.00 | 14 | 171.0 | 1.77 | none | 4062 (Mpumalanga to North West) |
| 2025 | the engine itself | 0.01 | 0 | 170.1 | 2.43 | | |
| 2026 | no limits | 0.00 | 0 | 148.4 | 0.00 | none | 0 (Eastern Cape to Hydra Central) |
| 2026 | old table, PyPSA-RSA's N-1 (labelled 'as drawn' before 738) | 0.00 | 0 | 148.4 | 0.00 | none | 8760 (Gauteng to Limpopo) |
| 2026 | old table, one circuit dropped | 0.00 | 0 | 148.4 | 0.00 | none | 8760 (Gauteng to Limpopo) |
| 2026 | rebuilt table, limits only | 0.00 | 0 | 150.5 | 0.00 | none | 1381 (North West to Northern Cape) |
| 2026 | rebuilt table, N-1 once | 0.00 | 0 | 150.5 | 0.00 | none | 3116 (Mpumalanga to North West) |
| 2026 | the engine itself | 0.47 | 0 | 150.9 | 0.17 | | |

Reading. Today's fleets curtail nothing on the rebuilt table, under N-1 once or limits only, in either year, and nothing is unserved beyond the 14 GWh of 2025 that the no-limits case carries too (the Koeberg calendar against the engine's flat Koeberg, not the network). No corridor binds in 1,000 hours; the most any corridor sits at its limit is a few hundred hours. Curtailment by area is nil everywhere, the Northern Cape included, with its 2025 fleet of about 4 GW of solar and 1 GW of wind behind the five exit circuits. The public record (search summaries): the 2025 GCCA, as reported, finds the connection capacity of the Eastern and Western Cape, the Northern Cape and Hydra Central fully absorbed, which is a statement about connecting new plants, not about curtailing the ones there; Eskom's curtailment framework of 2023 to 2024 offered new wind in the Cape provinces up to 10% curtailment to connect 3,470 MW, and modelled that curtailment at R650m a year against R2.6bn a year for the grid; no public figure of curtailed GWh by province in 2024 or 2025 was found, and the IPP Office's or NERSA's operational reports would hold it. On that record the real system did not curtail the existing Cape fleets at scale and did not cut customers for want of a corridor in 2025, and neither does the rebuilt table, so the table is not too tight for today's fleet by this test. What the test cannot say is whether the exits are right for 2035, when the siting puts 34 GW of approved solar and 10 GW of approved wind in the Northern Cape behind the same five circuits plus the plan's three lines; the binding there is the siting's weight on the line file's exits, and the public record's own statement that the Kronos to Hydra line overloads at today's allocation points the same way.

### (b) The Northern Cape's exits against public sources, and the coordinate-placed features

The line file's exits from the Northern Cape area (existing status): Hydra to Kronos 400 kV (one circuit, 188 km) and the two Van der Kloof to Roodekuil 220 kV circuits to Hydra Central; Ferrum to Mookodi 400 kV (one circuit, 199 km) to the North West; Boundary to Perseus 275 kV (two circuits, 90 km) to the Free State; Helios to Juno 400 kV (one circuit, 171 km) to the Western Cape. N-1 once that is 2,427 MW out of the province in all; with limits only 4,560 MW.

What the public record says (search summaries; nothing read from eskom.co.za or ntcsa.co.za). The Hydra to Kronos basic assessment (SAHRIS, draft BAR) names Aries to Kronos to Hydra 400 kV as one of three major backbone corridors that move power to and from the Northern Cape, says the existing Kronos to Hydra line will overload under the current generation allocation, and proposes a second 187 km Hydra to Kronos 400 kV line with the series compensation on the first bypassed. Eskom's transmission projects page describes the Mercury to Ferrum line as 428 km from Mercury (near Orkney, North West) through a new Mookodi substation to Ferrum (near Kathu), and an industry database dates Ferrum to Mookodi as commissioned in 2018. The Upington strengthening scheme is a 145 km 400 kV line from Aries to Upington, nearing completion in a December 2025 report, and a Ferrum to Upington 400 kV line is tendered: both inside the province. Juno to Gromis (282 km, 400 kV, Namaqualand Strengthening Phase 2) and Boundary to Ferrum are in the planned private-procurement round of 1,164 km of 400 kV lines (Engineering News, 1 and 18 April 2025). The 2025 GCCA, as reported, finds the grid capacity in the Eastern and Western Cape, the Northern Cape and Hydra Central fully absorbed (Engineering News, 2024 to 2025). Hydra's 765 kV substation was commissioned in 2013.

So the three backbone corridors the public record names are the three 400 kV exits the line file carries (Kronos to Hydra, Ferrum to Mookodi to Mercury, Helios to Juno), each a single circuit today, and the file adds the two 275 kV Kimberley circuits to Perseus and two 220 kV circuits at Van der Kloof. No existing 400 kV or 765 kV exit was found in the public record that the file misses; the planned ones (the second Hydra to Kronos line, Juno to Gromis, Aries to Juno, Beta to Boundary, Mercury to Umtu) are in the TDP file by their dates. The record also says the existing Kronos to Hydra line overloads at today's allocation, which is what the rebuilt table shows: that exit, with the Boundary to Perseus pair and Ferrum to Mookodi, binds in 8,200 to 8,700 hours of 2035 and 2040. The range for the exits, where the public record does not settle the ratings, is the N-1 once figure (2,427 MW) to the limits-only figure (4,560 MW); both cases are run (738 (b)) and the difference is 26 to 32 TWh of curtailment a year.

The 125 coordinate-placed features are all planned lines, so none is in today's table; 111 of them run inside one area and touch nothing here. The 14 that cross an area boundary were placed by their end points against the substation file, and each matches the pair the TDP file maps the same project to by its named substations where the project is in both (Zeus to Perseus, Perseus to Gamma and Gamma to Kappa as the second Zeus to Sterrekus line; the two Gamma to Grassridge circuits; Juno to Gromis; Beta to Boundary; Borutho to Silimela; Kusile to Lulamisa; Matla to Jupiter; Ariadne to Eros, which with Eros at Harding is a KwaZulu-Natal line). One, labelled only by its ends (Aries to Hydra, 351 km, planned), is placed between Hydra Central and the Northern Cape; the public record has no Aries to Hydra line (Aries connects to Kronos), so it is most likely the second Kronos to Hydra line drawn to Aries, and it enters nothing here because the TDP file carries Hydra to Kronos (2028) by name. The placement risk is confined to the TDP cases, where the TDP file's own mapping governs, not the geometry.

### (c) The corridor build in kilometres of line against the industry's rate

The priced cases at R21,700 per MW-km are in 738 (b) (28.3 GW for R4.47bn a year in 2035, 40.5 GW for R6.31bn in 2040, on the same links as at R10,000). Each priced case's corridor MW converted into circuits at one circuit's St Clair rating for the corridor's own length, and so into km of line (docs/regional-audit/km_convert.py):

| case | year | corridor MW added | MW-km (million) | km of 400 kV line (circuits) | km of 765 kV line (circuits) | annual cost R bn | years at 800 km a year, 765 kV | at 400 kV |
|---|---|---|---|---|---|---|---|---|
| 2035_wy2025_nm1_reea_l0_c0_v2_ext10k | 2035 | 31,662 | 3.04 | 2,345 (23.6) | 1,014 (10.6) | 2.31 | 1.3 | 2.9 |
| 2035_wy2025_nm1_reea_l0_c0_v2_ext21k | 2035 | 28,330 | 2.72 | 2,092 (21.1) | 906 (9.4) | 4.47 | 1.1 | 2.6 |
| 2040_wy2025_nm1_reea_l0_c0_v2_ext10k | 2040 | 44,147 | 4.23 | 3,262 (33.0) | 1,409 (14.7) | 3.21 | 1.8 | 4.1 |
| 2040_wy2025_nm1_reea_l0_c0_v2_ext21k | 2040 | 40,506 | 3.83 | 2,950 (30.2) | 1,278 (13.5) | 6.31 | 1.6 | 3.7 |

Delivery, from public statements (search summaries): local industry can build about 800 km of transmission line a year (NTCSA's presentation to the Portfolio Committee, via SAWEA), the TDP's first five years need 14,494 km and 210 transformers for about R112bn (2024 TDP, as reported), the need is put at 1,450 km a year on average by the DBSA and at a minimum of about 2,000 km a year by the NTCSA in 2026 (Daily Maverick, 18 June 2026), and Eskom installed 293 km in 2024/25 after 74 km the year before (Engineering News, 10 October 2025); a line takes 8 to 10 years from concept to energisation (the user's figure; the TDP's own phases). The model's planned lines (the line file's 133 planned features) are 12,956 km, of which 4,003 km (31%) cross an area boundary.

Assumption, stated: 800 km a year from 2026, of which the inter-area corridors get the inter-area share of the planned lines' kilometres (31%), so 248 km a year of inter-area line: 990 km by 2030, 2,230 km by 2035, 3,470 km by 2040. On that assumption the LP's corridor build from today's network at 765 kV (1,014 km by 2035, 1,409 by 2040) is deliverable in full by 2031 and by 2032, and at 400 kV (2,345 and 3,262 km) 95% by 2035 and 100% by 2040; the whole industry rate, undivided, would deliver either in two to four years. The TDP's own 14,494 km, by contrast, is 18 years of the 800 km rate (22% by 2030, 50% by 2035, 77% by 2040) and 49 years of the 293 km actually built in 2024/25. So what the rate limits is not the handful of corridors this LP wants but the 12,956 km of mostly within-area lines the TDP builds around them, which this ten-area model does not carry. The case with corridors limited to what the rate allows (TX_KM_BUDGET, 765 kV and 400 kV variants, from today's network at R10,000): run (TX_KM_BUDGET of 2,225 km by 2035 and 3,461 km by 2040, the 31% inter-area share of 800 km a year from 2026, converted at 765 kV and, as the tighter variant, at 400 kV). It binds only in the 400 kV variant of 2035: 30.3 GW of corridor for R2.19bn a year (2,225 km of 400 kV line) against the unconstrained 31.7 GW and R2.31bn, with curtailment 3.7 TWh against 3.4 and nothing unserved; at 765 kV, and in 2040 at either voltage, the budget is above what the LP builds (1,014 and 1,409 km at 765 kV, 3,262 km at 400 kV in 2040 against the 3,461 km budget) and the case is the unconstrained one. On the stated assumption the industry's rate does not limit these corridors; it limits the TDP's own 12,956 km, of which the rate from 2026 delivers 25% by 2030, 56% by 2035 and 86% by 2040 (at the 293 km actually built in 2024/25, 9%, 20% and 32%). Two cautions: the 31% share is the planned lines' own split between inter-area and within-area kilometres, and a planner would not hand the inter-area corridors a fixed share; and the conversion rates a new circuit at the St Clair loadability for the corridor's length, so a long corridor costs more kilometres per megawatt than a short one, which is why the Free State to Northern Cape exit (90 km) is the LP's first build at every price.

## Message 741: the model's priority corridors against the TDP's planned lines (6 Nov 2026; from results in hand, no new solves; the rebuilt table, weather 2025, build 2026-11-05f; priority corridors to test, not lines to build; nothing to be quoted)

Method. For each inter-area corridor of the rebuilt table (738 (a)): the hours at its limit and the value of one more MW for a year (the shadow price summed over the year) in the fixed build on today's corridors (N-1 once) and with the TDP's lines by their dates (tdp_lines_v2.json: Eros in KwaZulu-Natal, no Umtu line, Gamma to Grassridge as two circuits); the corridor MW the LP builds when corridors are extendable from today's network at R10,000 and R21,700 per MW-km, and from the plan's network at R21,700 (737's first cut, the unconstrained expansion); the TDP's planned lines on the corridor by name, year, voltage and phase with the MW they add, the Eros and Umtu lines of the with-range marked; and the shortfall, what the LP still builds with the plan in place ('not binding in this test' where it builds nothing and the corridor binds under 1,000 hours with the plan). The ranking table sets the fixed build's values (approved-record siting) beside the free-siting case's (the LP's own siting under the approved caps). Script docs/regional-audit/summ741.py; output tables741.md.

### 741, 2035, weather 2025 (build 2026-11-05f; the rebuilt table, N-1 once; the TDP file tdp_lines_v2.json, Eros in KwaZulu-Natal, no Umtu line, Gamma to Grassridge twice)

| corridor | today: hours at the limit, value of one more MW (R m a year) | with the TDP's lines: hours, value | LP builds without the plan, GW (R10,000; R21,700) | LP builds with the plan, GW (R21,700) | the TDP's lines on the corridor (name, year, kV, phase, MW) | MW the plan adds | shortfall (what the LP still builds with the plan) |
|---|---|---|---|---|---|---|---|
| North West to Northern Cape | 8,242 h, R21.6m | 5,693 h, R3.8m | 0.0; 0.0 | 0.0 | Mercury–Umtu 765 kV line (2033, 765 kV, Concept, 3,000 MW) [with-range only]; Ferrum–Mookodi 400 kV line (2027, 400 kV, Planned, 900 MW) | 900 | 0.0 GW short |
| Free State to Northern Cape | 8,242 h, R21.6m | 5,693 h, R3.8m | 13.8; 12.7 | 7.8 | Beta–Boundary 400 kV line (2029, 400 kV, Execution, 900 MW) | 900 | 7.8 GW short |
| Hydra Central to Northern Cape | 2,763 h, R13.8m | 1,332 h, R0.8m | 3.0; 2.7 | 0.0 | Hydra–Kronos 400 kV line (2028, 400 kV, Execution, 900 MW) | 900 | 0.0 GW short |
| Hydra Central to Western Cape | 2,089 h, R12.4m | 1,292 h, R0.8m | 0.0; 0.0 | 0.0 | Droerivier–Gamma 400 kV line (2033, 400 kV, Concept, 900 MW); Gamma–Kappa 765 kV line (2029, 765 kV, Definition, 3,000 MW) | 3,900 | 0.0 GW short |
| Free State to Hydra Central | 5,486 h, R7.8m | 4,361 h, R3.0m | 0.0; 0.0 | 0.0 | Perseus–Gamma 765 kV line (2029, 765 kV, Definition, 3,000 MW) | 3,000 | 0.0 GW short |
| Eastern Cape to Kwazulu Natal | 4,286 h, R5.9m | 4,361 h, R3.0m | 1.9; 1.7 | 3.0 | Eros–Isundu 765 kV line (2032, 765 kV, Planned, 3,000 MW) [with-range only]; Ariadne–Eros line (2027, 400 assumed kV, Planned, 900 MW) [with-range only] | 0 | 3.0 GW short |
| Eastern Cape to Free State | 4,286 h, R5.9m | 4,361 h, R3.0m | 0.0; 0.0 | 0.0 | none | 0 | 0.0 GW short |
| Eastern Cape to Hydra Central | 1,247 h, R1.9m | 0 h, R0.0m | 0.0; 0.0 | 0.0 | Gamma–Grassridge 765 kV line, circuit 1 (2032, 765 kV, Planned, 3,000 MW); Gamma–Grassridge 765 kV line, circuit 2 (2032, 765 kV, Planned, 3,000 MW) | 6,000 | not binding in this test |
| Northern Cape to Western Cape | 753 h, R1.4m | 52 h, R0.0m | 4.7; 4.0 | 0.1 | Paulputs–Juno 400 kV line (2027, 400 kV, Execution, 900 MW); Aries–Juno line (2033, 400 assumed kV, Concept, 900 MW); Juno–Gromis 400 kV line (2027, 400 kV, Planned, 900 MW) | 2,700 | not binding in this test |
| Free State to Kwazulu Natal (no corridor today) | none | 0 h, R0.0m | - | 0.0 | Merapi–Sorata 400 kV line (2030, 400 kV, Concept, 900 MW) | 900 | - |
| Free State to Gauteng | 0 h, R0.0m | 0 h, R0.0m | 8.3; 7.2 | 1.0 | Lethabo–Makalu 400 kV line (2032, 400 kV, Definition, 900 MW) | 900 | 1.0 GW short |
| Gauteng to Limpopo | 0 h, R0.0m | 0 h, R0.0m | 0.0; 0.0 | 0.0 | none | 0 | not binding in this test |
| Free State to North West | 0 h, R0.0m | 0 h, R0.0m | 0.0; 0.0 | 0.0 | none | 0 | not binding in this test |
| Limpopo to Mpumalanga | 0 h, R0.0m | 0 h, R0.0m | 0.0; 0.0 | 0.0 | Borutho–Silimela 400 kV line (2028, 400 kV, Definition, 900 MW) | 900 | not binding in this test |
| Free State to Mpumalanga | 0 h, R0.0m | 0 h, R0.0m | 0.0; 0.0 | 0.0 | Highveld–Emkhiweni 400 kV line (2028, 400 kV, Definition, 900 MW); Zeus–Perseus 765 kV line (2028, 765 kV, Definition, 3,000 MW) | 3,900 | not binding in this test |
| Gauteng to Mpumalanga | 0 h, R0.0m | 0 h, R0.0m | 0.0; 0.0 | 0.0 | Kusile–Lulamisa 400 kV line (2025, 400 kV, Execution, 900 MW); Matla–Jupiter line (2032, 400 assumed kV, Planned, 900 MW) | 1,800 | not binding in this test |
| Gauteng to North West | 0 h, R0.0m | 0 h, R0.0m | 0.0; 0.0 | 0.0 | Pluto–Westgate 400 kV line (2029, 400 kV, Definition, 900 MW) | 900 | not binding in this test |
| Kwazulu Natal to Mpumalanga | 0 h, R0.0m | 0 h, R0.0m | 0.0; 0.0 | 0.0 | none | 0 | not binding in this test |
| Limpopo to North West | 0 h, R0.0m | 0 h, R0.0m | 0.0; 0.0 | 0.0 | Medupi–Ngwedi 765 kV line (2025, 765 kV, Execution, 3,000 MW) | 3,000 | not binding in this test |
| Mpumalanga to North West | 0 h, R0.0m | 0 h, R0.0m | 0.0; 0.0 | 0.0 | none | 0 | not binding in this test |

Ranking by the value of one more MW, 2035, weather 2025: approved-record siting against the LP's own siting (free siting; wind Hydra Central 36%, Eastern Cape 22%, Northern Cape 14%, Western Cape 13%, Mpumalanga 10%, Kwazulu Natal 2%)

| rank | approved-record siting (fixed build) | R m a year | the LP's siting (free siting) | R m a year |
|---|---|---|---|---|
| 1 | North West to Northern Cape | 21.6 | Free State to Northern Cape | 4.9 |
| 2 | Free State to Northern Cape | 21.6 | North West to Northern Cape | 4.9 |
| 3 | Hydra Central to Northern Cape | 13.8 | Eastern Cape to Kwazulu Natal | 3.8 |
| 4 | Hydra Central to Western Cape | 12.4 | Eastern Cape to Free State | 3.8 |
| 5 | Free State to Hydra Central | 7.8 | Free State to Hydra Central | 3.7 |
| 6 | Eastern Cape to Kwazulu Natal | 5.9 | Hydra Central to Northern Cape | 1.1 |
| 7 | Eastern Cape to Free State | 5.9 | Northern Cape to Western Cape | 0.8 |
| 8 | Eastern Cape to Hydra Central | 1.9 | Eastern Cape to Hydra Central | 0.8 |

### 741, 2040, weather 2025 (build 2026-11-05f; the rebuilt table, N-1 once; the TDP file tdp_lines_v2.json, Eros in KwaZulu-Natal, no Umtu line, Gamma to Grassridge twice)

| corridor | today: hours at the limit, value of one more MW (R m a year) | with the TDP's lines: hours, value | LP builds without the plan, GW (R10,000; R21,700) | LP builds with the plan, GW (R21,700) | the TDP's lines on the corridor (name, year, kV, phase, MW) | MW the plan adds | shortfall (what the LP still builds with the plan) |
|---|---|---|---|---|---|---|---|
| North West to Northern Cape | 8,732 h, R191.2m | 7,442 h, R13.7m | 0.0; 0.0 | 0.0 | Mercury–Umtu 765 kV line (2033, 765 kV, Concept, 3,000 MW) [with-range only]; Ferrum–Mookodi 400 kV line (2027, 400 kV, Planned, 900 MW) | 900 | 0.0 GW short |
| Free State to Northern Cape | 8,732 h, R191.2m | 7,442 h, R13.7m | 18.6; 17.1 | 10.9 | Beta–Boundary 400 kV line (2029, 400 kV, Execution, 900 MW) | 900 | 10.9 GW short |
| Free State to Hydra Central | 7,085 h, R154.6m | 6,125 h, R9.8m | 0.0; 0.0 | 0.0 | Perseus–Gamma 765 kV line (2029, 765 kV, Definition, 3,000 MW) | 3,000 | 0.0 GW short |
| Eastern Cape to Kwazulu Natal | 5,632 h, R138.7m | 6,125 h, R9.8m | 2.4; 2.2 | 4.5 | Eros–Isundu 765 kV line (2032, 765 kV, Planned, 3,000 MW) [with-range only]; Ariadne–Eros line (2027, 400 assumed kV, Planned, 900 MW) [with-range only] | 0 | 4.5 GW short |
| Eastern Cape to Free State | 5,632 h, R138.7m | 6,125 h, R9.8m | 0.0; 0.0 | 0.0 | none | 0 | 0.0 GW short |
| Hydra Central to Northern Cape | 1,724 h, R36.6m | 1,320 h, R3.8m | 4.4; 4.2 | 0.0 | Hydra–Kronos 400 kV line (2028, 400 kV, Execution, 900 MW) | 900 | 0.0 GW short |
| Hydra Central to Western Cape | 1,278 h, R33.8m | 1,221 h, R3.5m | 0.0; 0.0 | 0.0 | Droerivier–Gamma 400 kV line (2033, 400 kV, Concept, 900 MW); Gamma–Kappa 765 kV line (2029, 765 kV, Definition, 3,000 MW) | 3,900 | 0.0 GW short |
| Eastern Cape to Hydra Central | 1,636 h, R17.5m | 0 h, R0.0m | 0.0; 0.0 | 0.0 | Gamma–Grassridge 765 kV line, circuit 1 (2032, 765 kV, Planned, 3,000 MW); Gamma–Grassridge 765 kV line, circuit 2 (2032, 765 kV, Planned, 3,000 MW) | 6,000 | not binding in this test |
| Northern Cape to Western Cape | 685 h, R2.8m | 110 h, R0.3m | 6.8; 5.8 | 2.0 | Paulputs–Juno 400 kV line (2027, 400 kV, Execution, 900 MW); Aries–Juno line (2033, 400 assumed kV, Concept, 900 MW); Juno–Gromis 400 kV line (2027, 400 kV, Planned, 900 MW) | 2,700 | 2.0 GW short |
| Free State to Kwazulu Natal (no corridor today) | none | 0 h, R0.0m | - | 0.0 | Merapi–Sorata 400 kV line (2030, 400 kV, Concept, 900 MW) | 900 | - |
| Free State to Gauteng | 0 h, R0.0m | 0 h, R0.0m | 12.0; 11.2 | 3.8 | Lethabo–Makalu 400 kV line (2032, 400 kV, Definition, 900 MW) | 900 | 3.8 GW short |
| Gauteng to Limpopo | 0 h, R0.0m | 0 h, R0.0m | 0.0; 0.0 | 0.0 | none | 0 | not binding in this test |
| Free State to North West | 0 h, R0.0m | 0 h, R0.0m | 0.0; 0.0 | 0.0 | none | 0 | not binding in this test |
| Mpumalanga to North West | 0 h, R0.0m | 0 h, R0.0m | 0.0; 0.0 | 0.0 | none | 0 | not binding in this test |
| Limpopo to Mpumalanga | 0 h, R0.0m | 0 h, R0.0m | 0.0; 0.0 | 0.0 | Borutho–Silimela 400 kV line (2028, 400 kV, Definition, 900 MW) | 900 | not binding in this test |
| Free State to Mpumalanga | 0 h, R0.0m | 0 h, R0.0m | 0.0; 0.0 | 0.0 | Highveld–Emkhiweni 400 kV line (2028, 400 kV, Definition, 900 MW); Zeus–Perseus 765 kV line (2028, 765 kV, Definition, 3,000 MW) | 3,900 | not binding in this test |
| Gauteng to Mpumalanga | 0 h, R0.0m | 0 h, R0.0m | 0.0; 0.0 | 0.0 | Kusile–Lulamisa 400 kV line (2025, 400 kV, Execution, 900 MW); Matla–Jupiter line (2032, 400 assumed kV, Planned, 900 MW) | 1,800 | not binding in this test |
| Gauteng to North West | 0 h, R0.0m | 0 h, R0.0m | 0.0; 0.0 | 0.0 | Pluto–Westgate 400 kV line (2029, 400 kV, Definition, 900 MW) | 900 | not binding in this test |
| Kwazulu Natal to Mpumalanga | 0 h, R0.0m | 0 h, R0.0m | 0.0; 0.0 | 0.0 | none | 0 | not binding in this test |
| Limpopo to North West | 0 h, R0.0m | 0 h, R0.0m | 0.0; 0.0 | 0.0 | Medupi–Ngwedi 765 kV line (2025, 765 kV, Execution, 3,000 MW) | 3,000 | not binding in this test |

Ranking by the value of one more MW, 2040, weather 2025: approved-record siting against the LP's own siting (free siting; wind Western Cape 33%, Hydra Central 29%, Eastern Cape 15%, Northern Cape 13%, Mpumalanga 7%)

| rank | approved-record siting (fixed build) | R m a year | the LP's siting (free siting) | R m a year |
|---|---|---|---|---|
| 1 | North West to Northern Cape | 191.2 | Free State to Northern Cape | 35.6 |
| 2 | Free State to Northern Cape | 191.2 | North West to Northern Cape | 35.5 |
| 3 | Free State to Hydra Central | 154.6 | Free State to Hydra Central | 26.6 |
| 4 | Eastern Cape to Kwazulu Natal | 138.7 | Eastern Cape to Free State | 23.8 |
| 5 | Eastern Cape to Free State | 138.7 | Eastern Cape to Kwazulu Natal | 23.8 |
| 6 | Hydra Central to Northern Cape | 36.6 | Hydra Central to Northern Cape | 9.0 |
| 7 | Hydra Central to Western Cape | 33.8 | Hydra Central to Western Cape | 7.2 |
| 8 | Eastern Cape to Hydra Central | 17.5 | Eastern Cape to Hydra Central | 3.4 |

### 741, 2035, weather 2015 (build 2026-11-05f; the rebuilt table, N-1 once; the TDP file tdp_lines_v2.json, Eros in KwaZulu-Natal, no Umtu line, Gamma to Grassridge twice)

| corridor | today: hours at the limit, value of one more MW (R m a year) | with the TDP's lines: hours, value | LP builds without the plan, GW (R10,000; R21,700) | LP builds with the plan, GW (R21,700) | the TDP's lines on the corridor (name, year, kV, phase, MW) | MW the plan adds | shortfall (what the LP still builds with the plan) |
|---|---|---|---|---|---|---|---|
| North West to Northern Cape | 8,112 h, R8.0m | 5,037 h, R3.4m | 0.0; 0.0 | - | Mercury–Umtu 765 kV line (2033, 765 kV, Concept, 3,000 MW) [with-range only]; Ferrum–Mookodi 400 kV line (2027, 400 kV, Planned, 900 MW) | 900 | binding with the plan; the plan-plus-corridors case is weather 2025 only |
| Free State to Northern Cape | 8,112 h, R8.0m | 5,037 h, R3.4m | 13.8; 12.5 | - | Beta–Boundary 400 kV line (2029, 400 kV, Execution, 900 MW) | 900 | binding with the plan; the plan-plus-corridors case is weather 2025 only |
| Free State to Hydra Central | 5,205 h, R4.3m | 4,041 h, R2.7m | 0.0; 0.0 | - | Perseus–Gamma 765 kV line (2029, 765 kV, Definition, 3,000 MW) | 3,000 | binding with the plan; the plan-plus-corridors case is weather 2025 only |
| Hydra Central to Northern Cape | 2,924 h, R3.7m | 1,000 h, R0.6m | 3.0; 2.6 | - | Hydra–Kronos 400 kV line (2028, 400 kV, Execution, 900 MW) | 900 | binding with the plan; the plan-plus-corridors case is weather 2025 only |
| Eastern Cape to Kwazulu Natal | 3,799 h, R3.1m | 4,041 h, R2.7m | 1.6; 1.5 | - | Eros–Isundu 765 kV line (2032, 765 kV, Planned, 3,000 MW) [with-range only]; Ariadne–Eros line (2027, 400 assumed kV, Planned, 900 MW) [with-range only] | 0 | binding with the plan; the plan-plus-corridors case is weather 2025 only |
| Eastern Cape to Free State | 3,799 h, R3.1m | 4,041 h, R2.7m | 0.0; 0.0 | - | none | 0 | binding with the plan; the plan-plus-corridors case is weather 2025 only |
| Hydra Central to Western Cape | 1,917 h, R2.2m | 961 h, R0.6m | 0.0; 0.0 | - | Droerivier–Gamma 400 kV line (2033, 400 kV, Concept, 900 MW); Gamma–Kappa 765 kV line (2029, 765 kV, Definition, 3,000 MW) | 3,900 | not binding in this test |
| Northern Cape to Western Cape | 1,072 h, R1.5m | 59 h, R0.0m | 4.5; 3.7 | - | Paulputs–Juno 400 kV line (2027, 400 kV, Execution, 900 MW); Aries–Juno line (2033, 400 assumed kV, Concept, 900 MW); Juno–Gromis 400 kV line (2027, 400 kV, Planned, 900 MW) | 2,700 | not binding in this test |
| Eastern Cape to Hydra Central | 1,426 h, R1.2m | 0 h, R0.0m | 0.0; 0.0 | - | Gamma–Grassridge 765 kV line, circuit 1 (2032, 765 kV, Planned, 3,000 MW); Gamma–Grassridge 765 kV line, circuit 2 (2032, 765 kV, Planned, 3,000 MW) | 6,000 | not binding in this test |
| Free State to Kwazulu Natal (no corridor today) | none | 0 h, R0.0m | - | - | Merapi–Sorata 400 kV line (2030, 400 kV, Concept, 900 MW) | 900 | - |
| Free State to Gauteng | 0 h, R0.0m | 0 h, R0.0m | 8.2; 7.0 | - | Lethabo–Makalu 400 kV line (2032, 400 kV, Definition, 900 MW) | 900 | not binding in this test |
| Gauteng to Limpopo | 0 h, R0.0m | 0 h, R0.0m | 0.0; 0.0 | - | none | 0 | not binding in this test |
| Free State to North West | 0 h, R0.0m | 0 h, R0.0m | 0.0; 0.0 | - | none | 0 | not binding in this test |
| Limpopo to Mpumalanga | 0 h, R0.0m | 0 h, R0.0m | 0.0; 0.0 | - | Borutho–Silimela 400 kV line (2028, 400 kV, Definition, 900 MW) | 900 | not binding in this test |
| Free State to Mpumalanga | 0 h, R0.0m | 0 h, R0.0m | 0.0; 0.0 | - | Highveld–Emkhiweni 400 kV line (2028, 400 kV, Definition, 900 MW); Zeus–Perseus 765 kV line (2028, 765 kV, Definition, 3,000 MW) | 3,900 | not binding in this test |
| Gauteng to Mpumalanga | 0 h, R0.0m | 0 h, R0.0m | 0.0; 0.0 | - | Kusile–Lulamisa 400 kV line (2025, 400 kV, Execution, 900 MW); Matla–Jupiter line (2032, 400 assumed kV, Planned, 900 MW) | 1,800 | not binding in this test |
| Gauteng to North West | 0 h, R0.0m | 0 h, R0.0m | 0.0; 0.0 | - | Pluto–Westgate 400 kV line (2029, 400 kV, Definition, 900 MW) | 900 | not binding in this test |
| Kwazulu Natal to Mpumalanga | 0 h, R0.0m | 0 h, R0.0m | 0.0; 0.0 | - | none | 0 | not binding in this test |
| Limpopo to North West | 0 h, R0.0m | 0 h, R0.0m | 0.0; 0.0 | - | Medupi–Ngwedi 765 kV line (2025, 765 kV, Execution, 3,000 MW) | 3,000 | not binding in this test |
| Mpumalanga to North West | 0 h, R0.0m | 0 h, R0.0m | 0.0; 0.0 | - | none | 0 | not binding in this test |

Ranking by the value of one more MW, 2035, weather 2015: approved-record siting against the LP's own siting (free siting; wind Hydra Central 41%, Eastern Cape 22%, Northern Cape 16%, Mpumalanga 10%, Western Cape 6%, Kwazulu Natal 2%)

| rank | approved-record siting (fixed build) | R m a year | the LP's siting (free siting) | R m a year |
|---|---|---|---|---|
| 1 | North West to Northern Cape | 8.0 | North West to Northern Cape | 4.2 |
| 2 | Free State to Northern Cape | 8.0 | Free State to Northern Cape | 4.2 |
| 3 | Free State to Hydra Central | 4.3 | Eastern Cape to Kwazulu Natal | 3.4 |
| 4 | Hydra Central to Northern Cape | 3.7 | Eastern Cape to Free State | 3.4 |
| 5 | Eastern Cape to Kwazulu Natal | 3.1 | Free State to Hydra Central | 3.3 |
| 6 | Eastern Cape to Free State | 3.1 | Hydra Central to Northern Cape | 0.9 |
| 7 | Hydra Central to Western Cape | 2.2 | Northern Cape to Western Cape | 0.9 |
| 8 | Northern Cape to Western Cape | 1.5 | Eastern Cape to Hydra Central | 0.8 |

### 741, 2040, weather 2015 (build 2026-11-05f; the rebuilt table, N-1 once; the TDP file tdp_lines_v2.json, Eros in KwaZulu-Natal, no Umtu line, Gamma to Grassridge twice)

| corridor | today: hours at the limit, value of one more MW (R m a year) | with the TDP's lines: hours, value | LP builds without the plan, GW (R10,000; R21,700) | LP builds with the plan, GW (R21,700) | the TDP's lines on the corridor (name, year, kV, phase, MW) | MW the plan adds | shortfall (what the LP still builds with the plan) |
|---|---|---|---|---|---|---|---|
| North West to Northern Cape | 8,751 h, R143.5m | 7,046 h, R10.5m | 0.0; 0.0 | - | Mercury–Umtu 765 kV line (2033, 765 kV, Concept, 3,000 MW) [with-range only]; Ferrum–Mookodi 400 kV line (2027, 400 kV, Planned, 900 MW) | 900 | binding with the plan; the plan-plus-corridors case is weather 2025 only |
| Free State to Northern Cape | 8,751 h, R143.5m | 7,046 h, R10.5m | 18.3; 16.8 | - | Beta–Boundary 400 kV line (2029, 400 kV, Execution, 900 MW) | 900 | binding with the plan; the plan-plus-corridors case is weather 2025 only |
| Free State to Hydra Central | 6,826 h, R94.9m | 5,798 h, R8.4m | 0.0; 0.0 | - | Perseus–Gamma 765 kV line (2029, 765 kV, Definition, 3,000 MW) | 3,000 | binding with the plan; the plan-plus-corridors case is weather 2025 only |
| Eastern Cape to Kwazulu Natal | 5,175 h, R75.1m | 5,798 h, R8.4m | 2.3; 2.1 | - | Eros–Isundu 765 kV line (2032, 765 kV, Planned, 3,000 MW) [with-range only]; Ariadne–Eros line (2027, 400 assumed kV, Planned, 900 MW) [with-range only] | 0 | binding with the plan; the plan-plus-corridors case is weather 2025 only |
| Eastern Cape to Free State | 5,175 h, R75.1m | 5,798 h, R8.4m | 0.0; 0.0 | - | none | 0 | binding with the plan; the plan-plus-corridors case is weather 2025 only |
| Hydra Central to Northern Cape | 1,985 h, R48.6m | 1,248 h, R2.1m | 4.5; 4.3 | - | Hydra–Kronos 400 kV line (2028, 400 kV, Execution, 900 MW) | 900 | binding with the plan; the plan-plus-corridors case is weather 2025 only |
| Hydra Central to Western Cape | 1,431 h, R45.2m | 1,133 h, R1.9m | 0.0; 0.0 | - | Droerivier–Gamma 400 kV line (2033, 400 kV, Concept, 900 MW); Gamma–Kappa 765 kV line (2029, 765 kV, Definition, 3,000 MW) | 3,900 | binding with the plan; the plan-plus-corridors case is weather 2025 only |
| Eastern Cape to Hydra Central | 1,825 h, R20.4m | 0 h, R0.0m | 0.0; 0.0 | - | Gamma–Grassridge 765 kV line, circuit 1 (2032, 765 kV, Planned, 3,000 MW); Gamma–Grassridge 765 kV line, circuit 2 (2032, 765 kV, Planned, 3,000 MW) | 6,000 | not binding in this test |
| Northern Cape to Western Cape | 793 h, R3.3m | 129 h, R0.3m | 6.2; 5.2 | - | Paulputs–Juno 400 kV line (2027, 400 kV, Execution, 900 MW); Aries–Juno line (2033, 400 assumed kV, Concept, 900 MW); Juno–Gromis 400 kV line (2027, 400 kV, Planned, 900 MW) | 2,700 | not binding in this test |
| Free State to Kwazulu Natal (no corridor today) | none | 0 h, R0.0m | - | - | Merapi–Sorata 400 kV line (2030, 400 kV, Concept, 900 MW) | 900 | - |
| Free State to Gauteng | 0 h, R0.0m | 0 h, R0.0m | 12.4; 11.1 | - | Lethabo–Makalu 400 kV line (2032, 400 kV, Definition, 900 MW) | 900 | not binding in this test |
| Gauteng to Limpopo | 0 h, R0.0m | 0 h, R0.0m | 0.0; 0.0 | - | none | 0 | not binding in this test |
| Free State to North West | 0 h, R0.0m | 0 h, R0.0m | 0.0; 0.0 | - | none | 0 | not binding in this test |
| Limpopo to Mpumalanga | 0 h, R0.0m | 0 h, R0.0m | 0.0; 0.0 | - | Borutho–Silimela 400 kV line (2028, 400 kV, Definition, 900 MW) | 900 | not binding in this test |
| Mpumalanga to North West | 0 h, R0.0m | 0 h, R0.0m | 0.0; 0.0 | - | none | 0 | not binding in this test |
| Free State to Mpumalanga | 0 h, R0.0m | 0 h, R0.0m | 0.0; 0.0 | - | Highveld–Emkhiweni 400 kV line (2028, 400 kV, Definition, 900 MW); Zeus–Perseus 765 kV line (2028, 765 kV, Definition, 3,000 MW) | 3,900 | not binding in this test |
| Gauteng to Mpumalanga | 0 h, R0.0m | 0 h, R0.0m | 0.0; 0.0 | - | Kusile–Lulamisa 400 kV line (2025, 400 kV, Execution, 900 MW); Matla–Jupiter line (2032, 400 assumed kV, Planned, 900 MW) | 1,800 | not binding in this test |
| Gauteng to North West | 0 h, R0.0m | 0 h, R0.0m | 0.0; 0.0 | - | Pluto–Westgate 400 kV line (2029, 400 kV, Definition, 900 MW) | 900 | not binding in this test |
| Kwazulu Natal to Mpumalanga | 0 h, R0.0m | 0 h, R0.0m | 0.0; 0.0 | - | none | 0 | not binding in this test |
| Limpopo to North West | 0 h, R0.0m | 0 h, R0.0m | 0.0; 0.0 | - | Medupi–Ngwedi 765 kV line (2025, 765 kV, Execution, 3,000 MW) | 3,000 | not binding in this test |

Ranking by the value of one more MW, 2040, weather 2015: approved-record siting against the LP's own siting (free siting; wind Western Cape 34%, Hydra Central 29%, Eastern Cape 15%, Northern Cape 13%, Mpumalanga 7%)

| rank | approved-record siting (fixed build) | R m a year | the LP's siting (free siting) | R m a year |
|---|---|---|---|---|
| 1 | North West to Northern Cape | 143.5 | North West to Northern Cape | 29.6 |
| 2 | Free State to Northern Cape | 143.5 | Free State to Northern Cape | 29.6 |
| 3 | Free State to Hydra Central | 94.9 | Free State to Hydra Central | 15.1 |
| 4 | Eastern Cape to Kwazulu Natal | 75.1 | Hydra Central to Northern Cape | 14.5 |
| 5 | Eastern Cape to Free State | 75.1 | Eastern Cape to Free State | 12.3 |
| 6 | Hydra Central to Northern Cape | 48.6 | Eastern Cape to Kwazulu Natal | 12.3 |
| 7 | Hydra Central to Western Cape | 45.2 | Hydra Central to Western Cape | 12.2 |
| 8 | Eastern Cape to Hydra Central | 20.4 | Eastern Cape to Hydra Central | 3.5 |

The weather-2015 tables follow the 2025 ones where run; the plan-plus-corridors column (737's first cut) is weather 2025 only.

### Reading

Short in the plan, on this model: (1) Free State to Northern Cape. Two 275 kV circuits today (400 MW N-1), the plan's Beta to Boundary 400 kV line (2029, in execution) adds 900 MW, and the LP still builds 7.8 GW on it in 2035 and 10.9 GW in 2040 with the plan in place, the largest shortfall on any corridor, because it is the Northern Cape's shortest exit (90 km) and the LP prefers it to the North West and Hydra Central exits whenever it may choose. It binds in 8,200 hours today at R22m (2035) to R191m (2040) per MW-year and still in 5,700 to 6,400 hours with the plan. (2) Eastern Cape to KwaZulu-Natal. One 400 kV circuit (813 MW N-1); the plan adds nothing between the areas on the central mapping (Ariadne to Eros and Eros to Isundu are inside KwaZulu-Natal with Eros at Harding), and the LP builds 3.0 GW in 2035 and 4.5 GW in 2040 beyond the plan; with Eros in the Eastern Cape the plan adds 3,900 MW by 2032 and the shortfall falls away, which is the Eros range of 738 (c) in one corridor. (3) Free State to Gauteng. The hub's link to the load: it does not bind today (the Northern Cape's power cannot reach it), but once the Free State exit is opened the LP builds 8 to 12 GW on it from today's network, and 1.0 GW (2035) and 3.8 GW (2040) beyond the plan's Lethabo to Makalu 400 kV line (2032, 900 MW); it is short in the plan only together with (1). (4) North West to Northern Cape and Hydra Central to Northern Cape bind as hard as the Free State exit today (the same hours and value, since any exit relieves the Northern Cape), and the plan's Ferrum to Mookodi (2027) and second Hydra to Kronos (2028) lines, 900 MW each, leave them binding in 5,700 and 1,300 hours; the LP builds nothing on them with the plan because it builds the Free State exit instead, so they are short or ample only together with (1).

Not binding in this test, on this model (message 743 (e): 'ample' withdrawn): Eastern Cape to Hydra Central (the two Gamma to Grassridge circuits, 6,000 MW by 2032, against a corridor that binds in 1,200 hours today and none with the plan, and on which the LP builds nothing); Northern Cape to Western Cape (Paulputs to Juno, Juno to Gromis and Aries to Juno, 2,700 MW by 2033, against 4 to 7 GW the LP builds from today's network and 0.1 to 2.0 GW with the plan); Hydra Central to Western Cape (Gamma to Kappa 765 kV and Droerivier to Gamma, 3,900 MW, binding 2,100 hours today and 1,300 with the plan, nothing built); Free State to Hydra Central (Perseus to Gamma 765 kV, 3,000 MW; the LP builds nothing with or without the plan, since the hub's 765 kV lines already carry 4,865 MW N-1); and the coal-belt corridors, which never bind. What this test cannot see of those lines' purposes: the N-1 security and voltage support inside the areas they serve (the Cape corridor's stability limit, the Eastern Cape's and Namaqualand's supply security), the connection capacity they create for plants inside the area (the GCCA's business, which the ten-area model does not carry), the retirement or de-rating of the 400 kV lines they parallel, load growth and new industrial demand at the receiving end (Coega, the Northern Cape's mines and the Namaqualand coast), reactive power and short-circuit strength for inverter-based plants, and the export and wheeling flows outside the national balance; a line that does not bind here can be the line the planners need most for any of these.

How the ranking moves. Under approved-record siting the top of the list is the Northern Cape's exits together (North West to Northern Cape and Free State to Northern Cape at the same value, since either relieves the province), then Free State to Hydra Central, Hydra Central to Northern Cape and Hydra Central to Western Cape in 2035, and the two Eastern Cape corridors in 2040. Under the LP's own siting (wind to Hydra Central, the Eastern and Western Cape and less to the Northern Cape; solar to the North West) the same two Northern Cape exits stay at the top but at a fifth of the value (R4.9m against R21.6m per MW-year in 2035, R36m against R191m in 2040), and the Eastern Cape's two corridors rise above the Hydra Central ones: the priority set is the same, its weight is not, and the weight the records' siting puts on the Northern Cape (34 GW of approved solar and 10 GW of wind behind five circuits) is what makes those exits the first priority by a wide margin. Between weather years the order holds: the same top three in 2035 and 2040 on weather 2015, at lower values (R8m against R22m in 2035, R144m against R191m in 2040), with Hydra Central to Northern Cape moving between fourth and sixth.

Caveats. The model carries 19 inter-area corridors and no within-area limits, so a corridor that reads ample here can still be short of the within-area lines that feed it, and the shortfalls are lower bounds; no stability or voltage study stands behind any figure, the ratings are St Clair loadability at the circuit's length; the Eros and Umtu range decides the Eastern Cape to KwaZulu-Natal and North West to Northern Cape rows; the seven corridors on which the line file carries fewer circuits than the old table (738 (a)) include three of the four Northern Cape exits; and the values are one weather year, one outage draw, one build. No NTCSA capacity figure is used or committed. These are priority corridors to test against the planners' own ratings and studies, not lines to build.

## Message 743: batteries against corridors net of savings, lead times, delivery, today's fleet, 'ample' (6 and 7 Nov 2026; after the 7 November deliverables; build 2026-11-05f, the every-change pass; nothing to be quoted)

### (a) Batteries against corridors, net of what each saves; the LP choosing battery sites and sizes; 8 hours

Net of what each saves, at both values of unserved energy (message 754): R12,300 per MWh first, the engine's cost of load shedding (costUnservedR, which index.html carries as R9,530 in 2020 prices and applies unescalated, message 264; R12,300 is that figure in January 2026 rand by the page's CPI factor, and is the one used here so that regional and national costs sit on one basis), and R87,000 second, the LP's own penalty (FIXED.voll). The 731 tables (docs/regional-audit/tables731.md) carry gross, the fuel and carbon saved, the unserved energy saved and the net at each value, the sign between them, and the annual cost at each. On today's corridors in 2035 the 2 GW lithium step at 4 hours nets a cost of R1.2bn (a saving of R1.1bn at R87,000: R2.8bn gross, R1.2bn of fuel and carbon saved, 30 GWh of unserved energy saved worth R0.4bn at R12,300 and R2.7bn at R87,000), 5 GW nets a cost of R3.8bn (R0.2bn) and 10 GW R9.0bn (R3.6bn), while corridors for the same money net savings of R32 to 37bn (R39 to 44bn), nearly all of it coal displaced (51 TWh). With the TDP's lines in place the lithium steps net costs of R1.5 to 9.6bn at either value, there being no unserved energy left to save, and corridors for the same money a saving of R16.3bn. In 2040 on today's corridors the 2 GW step nets a saving of R1.2bn (R11.8bn), 5 GW a saving of R1.5bn (R23.2bn) and 10 GW a cost of R0.4bn (a saving of R31.8bn), and the corridors for the same money savings of R114 to 131bn (R297 to 315bn), of which R30bn (R214bn) is the 2.46 TWh of unserved energy; with the TDP's lines the lithium nets costs of R0.6 to 5.9bn (R0.1 to 4.2bn) and the corridors savings of R45 to 47bn (R47 to 49bn). So at R12,300 the lithium steps are a net cost everywhere but the two small 2040 steps, and the corridors a net saving everywhere; at R87,000 the 2040 lithium steps become savings carried by the unserved energy.

Where the sign changes between the two values, case by case: in 2035, lithium 2 GW at 4 hours and at 8 hours (costs of R1.2bn and R2.3bn at R12,300, savings of R1.1bn and R0.9bn at R87,000) and the LP's own lithium in both forms (below); in 2040, lithium 10 GW at 4 hours and at 8 hours (costs of R0.4bn and R4.8bn against savings of R31.8bn and R40.3bn) and the LP's own 6 GW store (below). Every other lithium row keeps its sign (a cost at both values for 5 and 10 GW in 2035, for every step with the TDP's lines in either year, and for 5 GW at 8 hours in 2035; a saving at both for 2 and 5 GW in 2040 on today's corridors), and every corridor row is a saving at both. Between R9,530, as the engine applies it, and R12,300 one row changes: 2040, lithium 5 GW at 8 hours, a saving of R0.6bn at R12,300 and a cost of R0.6bn at R9,530. Your arithmetic for the LP's own lithium in 2035 checks against the case file: R5.94bn gross, R3.24bn of fuel and carbon saved, 63.1 GWh of unserved energy saved, R0.78bn at R12,300, a net cost of R1.93bn, against a net saving of R2.79bn at R87,000 (R5.49bn).

The LP choosing its own lithium (sites and sizes free by area at the build's own lithium costs, the build's plants fixed, today's corridors, hourly; 2035): 2.2 GW / 20 GWh, 9.3 hours, in Hydra Central (1.5 GW / 13.7 GWh) and the Eastern Cape (0.7 / 6.5) and nowhere else, R5.9bn a year gross, saving R3.2bn of fuel and carbon and 63 GWh of unserved energy, net a cost of R1.9bn at R12,300 and a saving of R2.8bn at R87,000: it cuts unserved energy from 96 to 33 GWh and curtailment from 55.4 to 52.1 TWh. So the store the LP wants is an adequacy store at the two Karoo exits where the shortfall sits, long rather than short, not a curtailment store; at the LP's own penalty it is worth R2.8bn net against R40bn net for corridors at the same money, and at the engine's cost of load shedding it does not pay. It does not choose the North West or the Northern Cape, where the 731 steps put it. The 2040 case and the partners with corridors priced at R21,700 beside the free lithium were run in 3-hour blocks, labelled, with a block base for each year, because the hourly 2035 case took 6,216 s alone at 6 GB and its priced partner did not fit a two-hour window (queue20b and 20c). In 3-hour blocks the 2035 LP buys 1.9 GW / 18 GWh in the same two areas (the hourly 2.2 / 20), net a cost of R2.0bn at R12,300 and a saving of R1.1bn at R87,000 against its block base. In 2040 it buys 6.0 GW / 115 GWh, 19 hours, in Hydra Central (2.8 GW), the Eastern Cape (2.0), Limpopo (0.7), Gauteng (0.4) and KwaZulu-Natal (0.1), for R26.8bn a year gross; it saves R8.7bn of fuel and carbon and 773 GWh of unserved energy (2,334 to 1,561 GWh), worth R9.5bn at R12,300 and R67.3bn at R87,000, so net a cost of R8.6bn at the engine's value and a saving of R49.2bn at the LP's, while curtailment moves from 102.9 to 98.4 TWh and coal not at all: again an adequacy store, now a very long one, where the 2040 shortfall sits, which the LP builds because its penalty is seven times the engine's cost of load shedding. Offered corridors at R21,700 per MW-km beside its own lithium, the 2035 LP builds no lithium at all and 28.0 GW of corridor for R4.44bn a year (Free State to Northern Cape 12.6, Free State to Gauteng 7.1, Northern Cape to Western Cape 3.9, Hydra Central to Northern Cape 2.6, Eastern Cape to KwaZulu-Natal 1.8), which takes curtailment to 3.7 TWh and unserved energy to nothing, net a saving of R34.2bn (R39.7bn): given both, the LP sees no case for the store once the exits are open. The 2040 partner says the same: no lithium and 40.4 GW of corridor for R6.32bn a year (Free State to Northern Cape 17.1, Free State to Gauteng 11.2, Northern Cape to Western Cape 5.8, Hydra Central to Northern Cape 4.0, Eastern Cape to KwaZulu-Natal 2.2), curtailment 13.8 TWh, nothing unserved, net a saving of R126bn (R301bn) against the block base, where its own store without corridors nets a cost of R8.6bn (a saving of R49bn). So with both on the menu the LP buys the corridors and no store in either year; the store it buys when the corridors are withheld is the adequacy it cannot otherwise reach, and it pays only at the LP's penalty. The 8-hour steps (hourly, at the four exits): in 2035 the longer store nets costs of R2.3bn, R7.2bn and R17.1bn at 2, 5 and 10 GW at R12,300 (a saving of R0.9bn and costs of R1.7bn and R9.9bn at R87,000), against R1.2bn, R3.8bn and R9.0bn at 4 hours (a saving of R1.1bn, costs of R0.2bn and R3.6bn), since the extra energy has nothing to move once the night is covered; in 2040 the 8-hour stores net a saving of R1.4bn, a saving of R0.6bn and a cost of R4.8bn (savings of R17.5bn, R31.9bn and R40.3bn at R87,000), because each extra hour removes more of the unserved energy, which is worth seven times as much at the LP's penalty, and 10 GW at 8 hours still leaves 1,855 of the 2,459 GWh. What the test cannot capture, on either side: (1) the adequacy standard, which the national chain sets on 20 weather years and this LP sees on one, so the unserved energy here is one year's and a store sized to it is not the standard's; (2) reserves and frequency response, which the engine's reserve rule buys and a battery supplies while a corridor does not; (3) the within-area and distribution value, since the model has no within-area limits, and a battery at a constrained substation relieves what no inter-area corridor can; (4) lead time, a battery in one to two years against a line in eight to ten, which (b) tests at 2030 and 2032; (5) the corridor's other purposes, N-1 security, voltage support and the Cape's import at night with Koeberg out, which (d) and (e) take up; (6) the perfect foresight of the dispatch, which flatters both; (7) the costs: lithium at the build's own R388,000 per MW-year and R252,000 per MWh-year, corridors at R10,000 or R21,700 per MW-km for the line alone without the substations and within-area works the TDP's rand carry.

### (b) Lead times: 2030 and 2032 with only the TDP's lines due by then

The record on the engine dumps (user, 7 Nov 2026, message 756 (a)): the dumps' hourly demand, wind and solar for weather 2025 derive from profiles.json, itself derived from ESK19679, and add nothing profiles.json does not already publish, which the 3 Nov decision covers; one pushed commit on this branch (74ef884) held the 2030 and 2032 dumps and the next removed them; the user's decision is to leave the history as it is, and .gitignore now excludes engine dumps so none can be committed again.

Cases (the every-change pass at 2030 and 2032, dumped from the chain on weather 2025, seed 0; fixed build, hourly, the rebuilt table N-1 once; the TDP's inter-area lines at their dates, so 14 lines and 21,000 MW are in service by 2030 and 18 lines and 28,800 MW by 2032; lithium added at the four exits in equal shares at 4 hours, 2 and 10 GW, at the build's own lithium costs; tables743.md). 2030: with no limits the build curtails nothing and runs 115 TWh of coal; on today's corridors it curtails 5.8 TWh and runs 6 TWh more coal (R4.2bn a year of fuel and carbon), with the North West to Northern Cape exit at its limit 7,600 hours and Free State to Northern Cape 6,600; the TDP's lines due by 2030 take that to 0.7 TWh and R0.5bn above no limits. Lithium on today's corridors: 2 GW cuts curtailment by 1.1 TWh and coal by 1 TWh, saves R1.3bn and costs R3.2bn, a net cost of R2.0bn at R12,300 per MWh of unserved energy (R1.8bn at R87,000; message 754, both values in tables743.md); 10 GW cuts 3.5 TWh for R16.3bn gross, a net cost of R13.2bn (R13.1bn). With the TDP's lines in place the same additions net R2.5bn (R2.3bn) and R15.0bn (R14.8bn) of cost. 2032: no limits 0.3 TWh curtailed, coal 94 TWh; today's corridors 23.3 TWh and coal 117 (R16.6bn a year more fuel and carbon), the two Karoo exits at their limit 8,100 to 8,500 hours at R4.9m per MW-year; the TDP's lines due by 2032 take it to 8.7 TWh and R6.0bn above no limits. Lithium on today's corridors: 2 GW cuts 1.4 TWh, net cost R1.6bn at R12,300 (R1.0bn at R87,000); 10 GW cuts 4.7 TWh, net cost R11.2bn (R10.6bn); with the TDP's lines, R1.8bn (R1.2bn) and R11.9bn (R11.2bn). No sign changes between the two values in either year: every lithium addition is a net cost at both. The 9.1 GWh of unserved energy in 2032 is in the no-limits case too, so it is the national build's one-year shortfall, not the network's, and it is the one thing the lithium does that the lines do not (2 GW removes 8 of the 9 GWh, R0.1bn at R12,300 and R0.7bn at R87,000). So in neither year do batteries do more than corridors: the lines due by the year remove 88% of today's curtailment in 2030 and 63% in 2032, and 2 to 10 GW of lithium at the exits removes 19 to 60% of what is left at a net cost in every case at either value, because the lead-time years are curtailment years, not shortfall years, and a 4-hour store at an exit moves a few hours of a day's surplus while the exit is at its limit 7,000 to 8,500 hours a year. The lead-time argument for batteries holds only where the lines are not delivered: at 293 km a year by the TDP's dates (c) 2032 curtails 20.1 TWh, close to today's corridors, and there 2 GW of lithium would still cut about 1.4 TWh, where the ordering of the same kilometres by the priority ranking cuts 10.7.

### (c) Delivery: the TDP's lines competing for the same kilometres

The schedule (docs/regional-audit/delivery.py; the domestic planned lines of the model's line file, tdp_planned_domestic.json): every planned line is built in order from 2026 at 800 or 293 km a year, inter-area and within-area lines competing for the same kilometres, and is in service the year its kilometres are fully funded. Orderings: the TDP's own dates (the TDP file's year for the inter-area lines, the within-area lines after them, since the line file carries no date for them), and the model's priority ranking (the inter-area lines in the order of their corridor's value of one more MW in the 2035 N-1 case on the rebuilt table, the within-area lines after). Nine of the TDP file's 20 inter-area lines have no drawn geometry in the line file (Lethabo to Makalu, Merapi to Sorata, Pluto to Westgate, Medupi to Ngwedi, Highveld to Emkhiweni, Droerivier to Gamma, Aries to Juno, Juno to Gromis, Matla to Jupiter), so they take no kilometres here and keep their TDP dates: the schedule is optimistic for them.

TDP file lines with no planned feature in the line file (kept at their TDP dates, 0 km): ['Lethabo–Makalu 400 kV line', 'Merapi–Sorata 400 kV line', 'Pluto–Westgate 400 kV line', 'Medupi–Ngwedi 765 kV line', 'Highveld–Emkhiweni 400 kV line', 'Droerivier–Gamma 400 kV line', 'Aries–Juno line', 'Juno–Gromis 400 kV line', 'Matla–Jupiter line']
| rate km a year | ordering | inter-area lines in service by 2030 (MW) | by 2032 | by 2035 | by 2040 | year the last domestic line is delivered |
|---|---|---|---|---|---|---|
| 800 | dates | 16 (27,000) | 18 (28,800) | 20 (30,600) | 20 (30,600) | 2039 |
    inter-area delivery years: Medupi–Ngwedi 765 kV line 2025; Kusile–Lulamisa 400 kV line 2027; Paulputs–Juno 400 kV line 2027; Ferrum–Mookodi 400 kV line 2027; Juno–Gromis 400 kV line 2027; Zeus–Perseus 765 kV line 2028; Hydra–Kronos 400 kV line 2028; Borutho–Silimela 400 kV line 2028; Highveld–Emkhiweni 400 kV line 2028; Perseus–Gamma 765 kV line 2029; Gamma–Kappa 765 kV line 2029; Beta–Boundary 400 kV line 2029; Pluto–Westgate 400 kV line 2029; Merapi–Sorata 400 kV line 2030; Gamma–Grassridge 765 kV line, circuit 1 2032; Gamma–Grassridge 765 kV line, circuit 2 2032; Lethabo–Makalu 400 kV line 2032; Matla–Jupiter line 2032; Droerivier–Gamma 400 kV line 2033; Aries–Juno line 2033
| 800 | priority | 15 (26,100) | 18 (28,800) | 20 (30,600) | 20 (30,600) | 2039 |
    inter-area delivery years: Medupi–Ngwedi 765 kV line 2025; Ferrum–Mookodi 400 kV line 2027; Beta–Boundary 400 kV line 2029; Hydra–Kronos 400 kV line 2028; Juno–Gromis 400 kV line 2027; Gamma–Kappa 765 kV line 2029; Perseus–Gamma 765 kV line 2029; Highveld–Emkhiweni 400 kV line 2028; Gamma–Grassridge 765 kV line, circuit 1 2032; Gamma–Grassridge 765 kV line, circuit 2 2032; Pluto–Westgate 400 kV line 2029; Paulputs–Juno 400 kV line 2030; Kusile–Lulamisa 400 kV line 2030; Zeus–Perseus 765 kV line 2030; Merapi–Sorata 400 kV line 2030; Borutho–Silimela 400 kV line 2031; Lethabo–Makalu 400 kV line 2032; Matla–Jupiter line 2032; Droerivier–Gamma 400 kV line 2033; Aries–Juno line 2033
| 293 | dates | 9 (12,300) | 13 (15,900) | 18 (24,600) | 20 (30,600) | 2062 |
    inter-area delivery years: Medupi–Ngwedi 765 kV line 2025; Kusile–Lulamisa 400 kV line 2027; Juno–Gromis 400 kV line 2027; Paulputs–Juno 400 kV line 2028; Ferrum–Mookodi 400 kV line 2028; Highveld–Emkhiweni 400 kV line 2028; Pluto–Westgate 400 kV line 2029; Zeus–Perseus 765 kV line 2030; Merapi–Sorata 400 kV line 2030; Hydra–Kronos 400 kV line 2031; Borutho–Silimela 400 kV line 2032; Lethabo–Makalu 400 kV line 2032; Matla–Jupiter line 2032; Perseus–Gamma 765 kV line 2033; Droerivier–Gamma 400 kV line 2033; Aries–Juno line 2033; Gamma–Kappa 765 kV line 2034; Beta–Boundary 400 kV line 2035; Gamma–Grassridge 765 kV line, circuit 1 2036; Gamma–Grassridge 765 kV line, circuit 2 2037
| 293 | priority | 9 (12,300) | 12 (17,100) | 17 (25,800) | 20 (30,600) | 2062 |
    inter-area delivery years: Medupi–Ngwedi 765 kV line 2025; Ferrum–Mookodi 400 kV line 2027; Beta–Boundary 400 kV line 2029; Juno–Gromis 400 kV line 2027; Highveld–Emkhiweni 400 kV line 2028; Hydra–Kronos 400 kV line 2029; Pluto–Westgate 400 kV line 2029; Gamma–Kappa 765 kV line 2030; Merapi–Sorata 400 kV line 2030; Perseus–Gamma 765 kV line 2031; Lethabo–Makalu 400 kV line 2032; Matla–Jupiter line 2032; Droerivier–Gamma 400 kV line 2033; Gamma–Grassridge 765 kV line, circuit 1 2033; Aries–Juno line 2033; Gamma–Grassridge 765 kV line, circuit 2 2034; Paulputs–Juno 400 kV line 2035; Kusile–Lulamisa 400 kV line 2036; Zeus–Perseus 765 kV line 2037; Borutho–Silimela 400 kV line 2038

Why 12,956 km here and 14,494 km in public. The model's line file holds 133 planned features of 12,956 km by the great-circle length of the drawn geometry; 8 of them (2,597 km) are SAPP interconnectors outside South Africa (Angola to Namibia and to Zambia, Zambia to Botswana, Mozambique and Tanzania, Namibia to Botswana, Mozambique to Malawi, Zimbabwe to South Africa), which leaves 10,358 km of domestic planned line, 4,004 inter-area and 6,355 within-area. The public 14,494 km is the 2024 TDP's first five-year horizon as reported (the lines to be built in 2025 to 2029 with their 210 transformers for about R112bn). The two differ because the file is a drawn subset of the plan (the nine inter-area lines above and an unknown number of within-area ones have no geometry in it; the file's planned set was assembled from the TDP's project list and public maps at 2026-11-05f), because great-circle lengths of drawn routes understate route lengths by a tenth or more, and because the file's set is not the TDP's five-year horizon but the projects the model carries to 2040. So the schedule above delivers the file's lines, not the TDP's programme: at 800 km a year the inter-area lines arrive within a year or two of their dates in either ordering, with the last domestic line in 2039; at 293 km a year (the 2024/25 rate) 9 inter-area lines (12,300 MW) are in service by 2030, 13 by 2032, 17 to 18 by 2035 and all 20 by 2040, the last domestic line in 2062. The rate-limited LP cases on these delivery sets are The delivered sets (delivery.py: the TDP's 20 inter-area lines ordered by the TDP's own dates or by the priority ranking of 741, delivered at 800 or 293 km a year of the domestic plan's 12,956 km, each line's in-service year the year its kilometres are reached; tdp_del_*.json) run as fixed builds beside the plan by its dates. At 800 km a year the rate does not bind the inter-area lines by 2032 in either order (the same 14 lines by 2030 and 18 by 2032 as the plan's dates; by priority 13 by 2030, with the same result to a tenth of a TWh), so the 800 km rows equal the plan's. At 293 km a year the order decides: by the TDP's dates 9 lines (12,300 MW) are in by 2030 and 13 (15,900 MW) by 2032, and the build curtails 4.3 and 20.1 TWh against the plan's 0.7 and 8.7, with coal 4 and 11 TWh higher and R2.6bn and R8.1bn a year of fuel and carbon; by the priority ranking the same kilometres give 9 lines (12,300 MW) by 2030 and 12 lines but 17,100 MW by 2032 (the 765 kV lines first), and the build curtails 3.0 and 9.4 TWh, within 2.3 and 0.7 TWh of the plan on its dates, at R1.0bn and R7.6bn a year less than the dates' order. So at the slow rate the ranking is worth 1.3 TWh and R1.0bn a year in 2030 and 10.7 TWh and R7.6bn in 2032, nearly the whole of what the slow rate costs; the binding corridors are the same two Karoo exits in every set (North West to Northern Cape and Free State to Northern Cape, 7,200 to 8,400 hours). 2035: at 293 km a year by the TDP's dates 18 of the 20 lines (24,600 MW) are in, and the build curtails 31.2 TWh against the plan's 30.8 (R0.3bn a year); by the priority ranking 17 lines but 25,800 MW, and the result is the plan's to the decimal. 2040: every set equals the plan, since all 20 inter-area lines are delivered by 2039 even at 293 km a year (the rate holds the domestic plan's last line to 2062, but the inter-area lines are 31% of the kilometres and come early in both orders). So the delivery rate matters to the inter-area lines in 2030 to 2035 only, and the ordering matters most in 2032, where the ranking recovers R7.6bn a year of the slow rate's R8.1bn.

### (d) Today's fleet: not too tight is not right

What the zero shows. On the rebuilt table today's fleets (2025 and 2026 states) curtail nothing and bind no corridor in 1,000 hours under either rule (739 (a)). That says the inter-area corridors, as the line file carries them and the table rates them, are not the limit on today's plants; it does not say the ratings are right, since a table twice as loose would give the same zero. Three comparisons.

Against the public Kronos to Hydra overload. The Hydra to Kronos basic assessment says the existing Kronos to Hydra 400 kV line will experience thermal overload with the current generation allocation, which is the connection capacity allocated to plants connecting at Kronos and Aries under the GCCA's rules, not the fleet standing in 2025. On the rebuilt table that corridor sits at 500 MW N-1 once (one 400 kV circuit at 1,078 MW and two 220 kV circuits) and does not bind for today's fleet; in the 2035 state, with 34 GW of approved solar and 10 GW of wind sited in the Northern Cape, it and the province's other exits bind in 8,200 hours. The public statement and the table agree on where the overload comes from, the plants allocated to the Northern Cape rather than those running today, and the table says nothing about the line's rating beyond its voltage and length.

Against the 2026 comparison in RESULTS (message 690, parts 1 and 2, on claude/c7-runs): the metered Eskom-visible solar fleet of about 2,650 MW was curtailed about 0.55 TWh in January to August 2026, about 207 MWh per MW, with about 560 MW cut at 11:00 to 14:00 in March to August; the single-node engine without the flat congestion figure produces 9.8 MWh per MW, with daytime pumping held at its metered level 102 (47% of the gap), and with 2026's midday demand as well 160 (77%); the remaining fifth, about 46 MWh per MW or 0.12 TWh in eight months, is the record's upper bound on network limits, since it also holds the curtailment order and the remaining demand and pumping differences. The ten-area LP on the rebuilt table, which adds the inter-area network to that single node, produces none of that fifth: so what the metered fleet loses to the network is inside the areas, at the substations and 132 kV networks the GCCA counts and this model does not carry, or in operation (real-time N-1 security, outages, reactive limits), which perfect foresight and pro-rata hourly curtailment do not see. The difference is explained by the setup's scope and foresight, not by the table: a tighter inter-area table would curtail the wrong plants in the wrong hours.

Could the table be too loose anywhere. Yes, in four places. (1) Within the areas: every area is a copper plate, so the North West's 25 GW of approved solar and the Northern Cape's 34 GW meet no limit until they reach an exit; the GCCA says their connection capacity is fully absorbed today. (2) The 765 kV lines are rated at the St Clair loadability for their length (2,360 to 3,000 MW a circuit), with no stability or voltage limit and no series-compensation setting; the public Cape corridor limit before the 765 kV programme (3,400 MW for the 400 kV network) was a stability figure, and the table's Hydra Central to Western Cape at 1,803 MW N-1 plus Northern Cape to Western Cape at 801 is below it, so the Cape import reads tight rather than loose, but the Free State hub's 765 kV corridors (4,838 and 4,865 MW N-1 once) carry no such limit and may be loose. (3) The Gauteng to Mpumalanga and KwaZulu-Natal to Mpumalanga corridors (11 and 8 GW N-1 once) never bind in any case; whether they should is a load-flow question. (4) The 220 kV and 275 kV circuits take a thermal class rating from the line file (250 and 400 MVA) rather than their own conductors. None of these is settled by the zero for today's fleet.

### (e) 'Ample' withdrawn

Done in 741: 'look ample' is now 'not binding in this test', with the purposes of those lines the test cannot see (within-area N-1 security and voltage support, connection capacity for plants inside the area, the retirement of the lines they parallel, load growth at the receiving end, reactive power and short-circuit strength, export and wheeling flows).

## Message 753: the DBSA report's corridor limits as a cross-check on the rebuilt table (6 Nov 2026; nothing here is to be quoted; a cross-check, not a replacement; no limit in the table changed)

Source: DBSA, National Treasury, NPC and PCC, 2025, South Africa's Energy Sector Investment Requirements to Achieve Energy Security and Net
Zero Goals by 2050 (PwC Strategy& and Osmotic Engineering Group), Annexure B, Table 45 (N-1 SIL, loadability and PV transfer by corridor for
2025, 2030 and 2035), Table 47 (line transfer limits) and Figure 58 (the corridor map); Table 14 for the corridor lengths. All rights reserved; the
extract the user supplied is not committed and the report's table is not reproduced; the comparison uses the lower of loadability and PV transfer
(table45_lowerof.json). The report's model is PSSE, steady state only, built from the TDP2032, the GCCA and public data with no Eskom case file,
benchmarked against the GCCA 2025; its areas are the GCCA transmission supply areas, which are the ten areas here (substations_compact.json's
area field holds the supply area, not the province; Hydra Central is one of them).

### 753 (a): the comparison

Your first pass checks: ours 52,476 MW on the 17 corridors against the report's 38,301 for 2025, 1.37 times (56,676 and 1.48 with the two
Mercury 765 kV corridors the report does not list). Two corrections to the ranges: Eastern Cape to KwaZulu-Natal is 1.53, outside the export
range of 0.67 to 1.12; and two inland corridors sit below one (Limpopo to North West 0.78, Free State to Mpumalanga 0.87), so the inland range
is 0.78 to 6.82, with the six above 1.39 all on Gauteng, Mpumalanga and Limpopo's borders. Free State to Gauteng 3,600 against 528 and Gauteng
to Limpopo 1,800 against 496 are as you had them.

| corridor | our circuits | km, ours (crossing) | km, report (Table 14) | report 2025 | ours N-1 once | ours / report | ours, limits only | ours at the report's ratings | report 2030 | report 2035 | ours with the TDP's lines, N-1 once (TDP MW added) | ours with TDP / report 2035 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Free State to Gauteng | 1 x 400 kV, 9 x 275 kV | 60 | 382 | 528 (PV) | 3,600 | 6.82 | 5,000 | 4,254 | 570 | 589 (L) | 4,500 (900) | 7.64 |
| Gauteng to Limpopo | 2 x 400 kV, 1 x 275 kV | 107 | 392 | 496 (PV) | 1,800 | 3.63 | 3,200 | 1,473 | 496 | 256 (PV) | 1,800 (0) | 7.03 |
| Gauteng to North West | 4 x 400 kV, 3 x 275 kV | 66 | 247 | 2,574 (PV) | 5,400 | 2.10 | 6,800 | 4,418 | 2,574 | 1,972 (PV) | 6,300 (900) | 3.19 |
| Limpopo to Mpumalanga | 2 x 400 kV, 3 x 275 kV | 121 | 334 | 1,156 (PV) | 2,214 | 1.92 | 3,447 | 2,418 | 1,118 | 1,182 (PV) | 3,114 (900) | 2.63 |
| Gauteng to Mpumalanga | 8 x 400 kV, 4 x 275 kV | 102 | 234 | 6,008 (PV) | 11,168 | 1.86 | 12,568 | 8,891 | 6,008 | 4,811 (PV) | 12,968 (1,800) | 2.70 |
| Eastern Cape to KwaZulu-Natal | 1 x 400 kV | 167 | 723 | 533 (PV) | 813 | 1.53 | 1,161 | 700 | 818 | 1,786 (L) | 813 (0) | 0.46 |
| KwaZulu-Natal to Mpumalanga | 1 x 765 kV, 7 x 400 kV | 172 | 297 | 6,032 (PV) | 8,375 | 1.39 | 11,375 | 7,000 | 6,032 | 5,272 (PV) | 8,375 (0) | 1.59 |
| Northern Cape to Western Cape | 1 x 400 kV | 171 | 1039 | 714 (PV) | 801 | 1.12 | 1,144 | 700 | 655 | 809 (PV) | 2,700 (2,700) | 3.34 |
| Free State to Hydra Central | 2 x 765 kV, 3 x 400 kV | 310 | 528 | 4,409 (PV) | 4,865 | 1.10 | 7,865 | 5,500 | 4,836 | 5,460 (PV) | 7,865 (3,000) | 1.44 |
| North West to Northern Cape | 1 x 400 kV | 199 | 647 | 694 (PV) | 726 | 1.05 | 1,038 | 700 | 1,405 | 1,648 (L) | 900 (900) | 0.55 |
| Hydra Central to Western Cape | 3 x 400 kV | 246 | 553 | 1,919 (PV) | 1,803 | 0.94 | 2,709 | 2,000 | 3,655 | 3,655 (L) | 3,609 (3,900) | 0.99 |
| Eastern Cape to Hydra Central | 2 x 400 kV | 295 | 411 | 894 (L) | 801 | 0.90 | 1,606 | 1,000 | 293 | 1,050 (PV) | 4,606 (6,000) | 4.39 |
| Free State to Mpumalanga | 2 x 765 kV, 3 x 400 kV | 347 | 471 | 5,531 (PV) | 4,838 | 0.87 | 7,202 | 5,500 | 6,144 | 8,456 (L) | 8,102 (3,900) | 0.96 |
| Free State to Northern Cape | 2 x 275 kV | 90 | 682 | 486 (PV) | 400 | 0.82 | 800 | 473 | 992 | 1,891 (PV) | 800 (900) | 0.42 |
| Eastern Cape to Free State | 1 x 400 kV | 408 | 564 | 555 (PV) | 455 | 0.82 | 650 | 700 | 645 | 645 (L) | 455 (0) | 0.71 |
| Limpopo to North West | 5 x 400 kV, 2 x 275 kV | 212 | 629 | 5,027 (PV) | 3,916 | 0.78 | 5,316 | 4,945 | 5,027 | 5,027 (PV) | 5,316 (3,000) | 1.06 |
| Hydra Central to Northern Cape | 1 x 400 kV, 2 x 220 kV | 64 | 531 | 745 (L) | 500 | 0.67 | 1,578 | 605 | 745 | 745 (L) | 1,400 (900) | 1.88 |
| total, the 17 | | | | 38,301 | 52,476 | 1.37 | 73,459 | 51,277 | 42,013 | 45,254 | 73,623 | 1.63 |
| with our two Mercury 765 kV corridors (not in the report) | | | | | 56,676 | 1.48 | | | | | | |

Reading. (1) The per-circuit rating assumption is not the cause of the 1.37: our line set at the report's own ratings (400 kV 1,000 MW, 765 kV
2,500, N-1 once) totals 51,277, within 2% of our 52,476, because the report's flat compensated limit is above our St Clair figure on the long
export corridors and below our thermal figure on the short inland ones, and the two nearly cancel. (2) The corridors above 1.5 are the inland
ones, and on every one of them the report's binding figure is the PV transfer, a steady-state voltage limit below its own loadability (Gauteng
to Mpumalanga 6,008 against 9,461; Gauteng to North West 2,574 against 5,133; Limpopo to Mpumalanga 1,156 against 1,788); our table has no
voltage limit, so on these the gap is partly real. (3) On two of them the larger cause is which lines each side counts, below. (4) On the export
corridors the two tables agree within 10 to 33%, but on the Cape corridor by coincidence: the report's 2025 case carries the Gamma to Kappa 765
kV line (its named contingency), which the model's line file does not carry at all. (5) By 2035 the report's limits grow to 45,254 MW and ours
with the TDP's 20 inter-area lines to 73,623 (1.63): the report's 2035 network is the TDP2032's, and on four corridors its 2035 figure is below
its 2025 one (Gauteng to Mpumalanga, Gauteng to North West, Gauteng to Limpopo, KwaZulu-Natal to Mpumalanga), which a voltage limit can do as
the dispatch changes and a thermal table cannot.

### 753 (b): the cause on each corridor beyond 1.5 times either way

The report names its corridors by supply area and, for each figure, the contingency that sets it; those names say which lines it counts. Ours are
the line file's circuits whose two ends the substation file places in different areas (build_corridors.py), so a substation on the wrong side of a
supply-area boundary moves whole circuits between corridors. Checked by reverse geocoding every substation's coordinates to its province
(Nominatim; a province is not a supply area, so a mismatch is a flag, not a verdict): 189 substations checked, 0 unresolved; 7 the file places in Hydra Central, which spans the Northern Cape, Eastern Cape and Free State provinces by design (Eastern Cape, Northern Cape); 15 others whose province differs from the file's supply area: Acornhoek (file Limpopo, province Mpumalanga); Boundary (file Northern Cape, province Free State); Carmel (file North West, province Gauteng); Dinaledi (file Gauteng, province North West); Eros (file Eastern Cape, province Kwazulu Natal); Komsberg (file Western Cape, province Northern Cape); Makalu (file Gauteng, province Free State); Manogeng (file Mpumalanga, province Limpopo); Mercury (file North West, province Free State); Midas (file North West, province Gauteng); Pelly (file Limpopo, province Gauteng); Pluto (file North West, province Gauteng); Scafell (file Gauteng, province Free State); Silimela (file Mpumalanga, province Limpopo); Sorata (file Kwazulu Natal, province Free State). The file's area is its GCCA supply-area assignment, and a supply area need not follow the province, so each is a flag to settle against the GCCA's supply-area polygons, not a correction made here; the ones that sit on a corridor in the table are Lethabo's neighbours on the Vaal, Makalu and Scafell (file Gauteng, province Free State); Dinaledi at Brits (file Gauteng, province North West); Mercury (file North West, province Free State); Pluto and Midas on the West Rand (file North West, province Gauteng; with Hera to Midas, Lulamisa to Pluto, Pluto to Thuso, Mercury to Midas, Hermes to Pluto and Matimba to Pluto and Midas on them, they decide the Gauteng to North West and Limpopo to North West corridors); Pelly in Tshwane (file Limpopo, province Gauteng; Esselen to Pelly is the 275 kV circuit in Gauteng to Limpopo); Boundary (file Northern Cape, province Free State; its two 275 kV lines to Perseus are the whole Free State to Northern Cape corridor); Manogeng and Silimela (file Mpumalanga, province Limpopo) and Acornhoek (file Limpopo, province Mpumalanga) on Limpopo to Mpumalanga; and Eros (file Eastern Cape, province KwaZulu-Natal; already overridden to KwaZulu-Natal in the rebuilt table). Where the report's own corridor naming settles a side it is said under the corridor; the rest wait for the polygons. Full list: geocheck.tsv.

1. Free State to Gauteng, 3,600 against 528 (6.82). Ours counts ten circuits with a mean length of 60 km: Lethabo to Glockner at 400 kV (21 km)
   and 275 kV, Lethabo to Makalu (two), Rigi (two), Eiger and Snowdon, all 13 to 62 km, and Everest to Makalu (184 km) and Everest to Snowdon
   (220 km) at 275 kV. The report's corridor is 382 km long and its contingencies are Makalu to Everest and Snowdon to Everest: the two long 275 kV
   lines from the Free State hub to the Vaal, and nothing else, which is why its SIL (248 MW) is one 275 kV line's and its loadability 589. So the
   report puts Lethabo power station and its evacuation lines on the Gauteng side. So does the model's own fleet file (nodal/fleet_units.csv:
   Lethabo's units are Gauteng generation, retiring in 2038 and 2041), so the LP already dispatches Lethabo on the Gauteng bus; but the
   substation file places the Lethabo substation in the Free State (from the DBSA register; the province is the Free State, as is Makalu's, which
   the file has in Gauteng), so the corridor builder counts Lethabo's own 13 to 62 km ties into the Vaal load, eight of our ten circuits and
   3,200 of the 3,600 MW, as Free State to Gauteng capacity. In the LP that capacity is pure transit from the Free State bus, which physically
   those lines are not: they connect Lethabo's bus, and reach the Free State hub only through Makalu and the Everest lines. On our two Everest lines alone the
   corridor is 800 MW, N-1 once 400, against the report's 528 to 589. Cause: the boundary and the lines counted; a real difference of 0.7 to 0.8
   on the long lines. For the LP this matters in 2040, when 3,200 MW of Free State to Gauteng capacity that is physically Lethabo's stub lines is
   open to transit (and 3,600 before), and it is the corridor the priced cases build on (Free State to Gauteng 1.0 to 4.2 GW in 727 (c)). Candidate change, not made:
   Lethabo's ties counted as Gauteng-internal (the Lethabo substation on the Gauteng side, as the report and the fleet file have it), leaving
   the Everest pair.
2. Gauteng to Limpopo, 1,800 against 496 (3.63). Ours: Dinaledi to Spitskop, two 400 kV circuits of 110 km at the thermal 1,400 MW, and Esselen to
   Pelly at 275 kV. The report's corridor is 392 km, Gauteng to the Polokwane load (its contingencies Borutho to Silimela 400 kV and Tabor to
   Witkop 275 kV), with a SIL of 316 MW: one 400 kV path and a 275 kV one at that length. Dinaledi is at Brits, in the North West by province (the
   file has it in Gauteng, from OpenStreetMap), so the two Dinaledi to Spitskop circuits are North West to Limpopo on the report's boundary and on
   the province's, leaving Esselen to Pelly (N-1 once 280 MW) against the report's 496; and Apollo to Dinaledi moves to Gauteng to North West.
   Cause: the boundary. The rest, the within-Limpopo path from Spitskop to Polokwane that the report's figure measures, is a within-area limit
   this model does not carry. Candidate change, not made: Dinaledi on the North West side.
3. Gauteng to North West, 5,400 against 2,574 (2.10). Ours: four 400 kV circuits (Hera to Midas, Bighorn to Dinaledi, Lulamisa to Pluto, Pluto to
   Thuso) and three 275 kV, 6,800 MW in all; the report's loadability 5,133 is the same set at its ratings (ours at its ratings 4,418 N-1 once),
   and its figure is the PV transfer, 2,574, with the loss of Lulamisa to Pluto: a voltage limit at half the loadability, in the direction Gauteng
   to North West. Cause: a real difference (the voltage limit), with the boundary a part (Bighorn to Dinaledi is North West-internal on the
   province). Caveat for the LP: a PV limit is for one direction and one dispatch; the LP's heavy flow on this corridor in 2035 and 2040 is North
   West to Gauteng (Karoo wind through Mookodi, Mercury and Pluto), the direction the report did not test.
4. Limpopo to Mpumalanga, 2,214 against 1,156 (1.92). Ours: Arnot to Merensky (152 km) and Duvha to Leseding (206 km) at 400 kV, Acornhoek to
   Marathon (two) and Senakangwedi to Simplon at 275 kV. The report's loadability 1,788 is one 400 kV circuit and two 275 kV at its ratings, and its
   contingencies (Duvha to Manogeng in 2025 and 2030, Foskor to Spencer in 2035) run through the Lowveld; its figure is again the PV transfer.
   Cause: one 400 kV circuit counted on a different side (Merensky and Senakangwedi serve the Steelpoort valley, which the report's Mpumalanga
   supply area may take in; the province puts Merensky in Limpopo) and the voltage limit. Open.
5. Gauteng to Mpumalanga, 11,168 against 6,008 (1.86). Ours: eight 400 kV circuits and four 275 kV, 12,568 MW; the report's loadability 9,461 is
   the same twelve at its ratings (ours at its ratings 8,891 N-1 once); its figure is the PV transfer with the Hera 400/275 kV transformer out,
   6,008 in 2025 and 4,811 in 2035, in the direction Gauteng to Mpumalanga. Cause: the rating assumption for a fifth of the gap and the voltage
   limit for the rest, a real difference. The same caveat: the corridor's heavy flow is Mpumalanga to Gauteng, coal to the load, which is not the
   direction tested, and the report does not say whether its PV transfer is the whole transfer at the nose point or the increment above its base
   case; if the latter, the absolute limit is higher than 6,008 and the gap narrower.
6. Eastern Cape to KwaZulu-Natal, 813 against 533 (1.53). Ours: one circuit, Eros to Vuyani 400 kV, 167 km, St Clair 1,161 MW, N-1 once at 0.7.
   The report's corridor is 723 km (Table 14), the whole coastal path from the Eastern Cape hub to Ariadne, and its 2025 figure is the PV
   transfer with a Northern Cape contingency (Mookodi to Ferrum) out, 533, against a loadability of 677 for the path at that length. Cause: the
   length definition (hub to hub against the crossing segment) and the single-circuit N-1 rule; a difference of 1.2 to 1.5 that the within-area
   path explains.
7. Hydra Central to Northern Cape, 500 against 745 (0.67, at the edge). Ours: Hydra to Kronos 400 kV (187 km, 1,078 MW) and the two 2 km Van der
   Kloof to Roodekuil 220 kV station ties; N-1 once removes Hydra to Kronos and leaves the two ties, 500. The report's loadability is 745 for the
   same Hydra to Kronos line, its N-1 the Hydra transformer. Cause: our N-1 rule on a corridor whose second and third circuits are a hydro
   station's 220 kV ties; without them the rule gives 0.7 of 1,078, 754, the report's figure. Not a real difference.

The Cape corridor (Hydra Central to Western Cape, 0.94): the agreement is a coincidence. Ours is three 400 kV circuits, Droerivier to Hydra, N-1
once 1,803. The report's 2025 figure, 1,919, is the PV transfer with the Gamma to Kappa 765 kV line out, and its loadability 2,305 is the three
400 kV circuits at its ratings after that outage; so the report's 2025 network carries Gamma to Kappa at 765 kV and the line file does not carry
it at all (its eight existing 765 kV features are Alpha to Beta twice, Beta to Hydra, Gamma to Hydra, Gamma to Perseus, Mercury to Perseus,
Mercury to Zeus and Majuba to Umfolozi; Kappa to Sterrekus 765 kV, commissioned in November 2016, is missing too, within the Western Cape). The
TDP file carries a Gamma to Kappa 765 kV line for 2029, which is the plan's second line (the heritage assessment for the "Gamma-Kappa 2nd 765 kV"
line, Heritage Western Cape; Eskom's 2012 series-capacitor paper names Gamma as a capacitor site on the 765 kV Cape lines; SAnews on the 2016
commissioning: "the Western Cape is now connected to the 765 kV network over and above the 400 kV network"). With the first line in the table at
370 km (St Clair 2,628 MW) the corridor is 5,337 MW with limits only and 2,709 N-1 once (the 765 kV line out), 1.4 times the report. The
in-service date of the first line and whether it ran at 400 kV for a period are not settled from what could be read here (Engineering News
refused the fetch; eskom.co.za is not read). Candidate change, not made: add the first Gamma to Kappa 765 kV line to the existing set.

The two Mercury 765 kV corridors. Our table carries Mercury to Perseus (235 km) as Free State to North West and Mercury to Zeus (268 km) as
Mpumalanga to North West, each a single 765 kV circuit at 3,000 MW, N-1 once 2,100, because the substation file places Mercury in the North
West (a manual placement; the coordinates are in the Free State by province, Fezile Dabi, just south of the Vaal near Orkney). The report lists
neither corridor: its contingencies put Mercury to Zeus in Free State to Mpumalanga and Perseus to Mercury in Northern Cape to Free State, so it
treats the Perseus, Mercury, Zeus path as the Free State's 765 kV link to Mpumalanga, with Mercury on the Free State side; Table 14 has a Free
State to North West corridor of 369 km with no capacity in any scenario. On the report's placing, our Free State to Mpumalanga would gain Mercury
to Zeus (10,202 MW, N-1 once 7,202, against the report's 5,531 to 6,144), Free State to North West would be the three 400 kV lines from Mercury to
Hermes, Midas and Mookodi (4,200 MW, N-1 once 2,800), and Mpumalanga to North West would disappear. Either placing is defensible; what the LP
sees is the same 765 kV path either way, and the choice moves which area's bus the Karoo and Free State flows enter Gauteng's neighbours from.
In the comparison table the two corridors are shown apart and not counted in the 17.

### 753 (c): the sensitivity

The causes in (b) leave the gap open on the Gauteng corridors (the voltage limits) and settle the Free State to Gauteng and Gauteng to Limpopo
gaps as boundary differences that the table should take up after review; so the sensitivity is warranted and is prepared, to run after the 7 Nov
reports' solvers (four fixed-build hourly cases of a few minutes each): the report's 2025 limits as today's corridors and its 2035 limits as a
stand-in for the TDP's lines, 2035 and 2040 on weather 2025, beside the rebuilt table's N-1 once and with-TDP cases of 738 (b); corridor files
corridors_dbsa_2025.json and corridors_dbsa_2035.json (build_dbsa_corridors.py; one pseudo-circuit per corridor; the two Mercury corridors at our
N-1 once values, labelled), taken as they stand by a CAP_AS_IS switch in pypsa_net.py; queue22.sh. The priority ranking is read from the same
runs (hours at limit and shadow value by corridor, as 741). Results (queue22; fixed build, hourly, no commitment floor; the report's limits taken as they stand, the two Mercury corridors at our N-1 once values; tables753c.md):

| year | corridor limits | total MW (the 17 + Mercury) | curtailed TWh | coal TWh | gas and diesel TWh | unserved GWh | fuel and carbon R bn | cost with unserved energy at the value of lost load R bn | corridors at limit, in order (hours; shadow value R m per MW-year) |
|---|---|---|---|---|---|---|---|---|---|
| 2035 | the rebuilt table, N-1 once (today's corridors) | 56,676 | 55.4 | 114.1 | 0.61 | 96.4 | 83.5 | 91.9 | North West to Northern Cape 8,758 h, R21.6m; Free State to Northern Cape 8,728 h, R21.6m; Eastern Cape to KwaZulu-Natal 6,234 h, R5.9m; Free State to Hydra Central 5,863 h, R7.8m; Free State to Gauteng 5,785 h, R0.0m; Eastern Cape to Free State 4,732 h, R5.9m |
| 2035 | the report's 2025 limits as today's corridors | 42,501 | 57.9 | 116.5 | 0.65 | 81.2 | 85.5 | 92.5 | North West to Northern Cape 8,756 h, R21.8m; Free State to Northern Cape 8,719 h, R21.8m; Free State to Gauteng 8,710 h, R0.0m; Eastern Cape to KwaZulu-Natal 7,855 h, R9.7m; Free State to Hydra Central 6,911 h, R12.0m; Gauteng to Limpopo 6,562 h, R0.0m |
| 2035 | the rebuilt table with the TDP's lines, N-1 once | 78,453 | 30.8 | 90.0 | 0.19 | 0.0 | 64.1 | 64.1 | North West to Northern Cape 8,735 h, R3.8m; Free State to Northern Cape 8,502 h, R3.8m; Eastern Cape to KwaZulu-Natal 7,960 h, R3.0m; Free State to KwaZulu-Natal 7,895 h, R0.0m; Free State to Gauteng 5,516 h, R0.0m; Eastern Cape to Free State 4,839 h, R3.0m |
| 2035 | the report's 2035 limits as the stand-in for the TDP's lines | 49,454 | 29.4 | 88.4 | 0.20 | 193.8 | 63.0 | 79.9 | Free State to Gauteng 8,613 h, R30.9m; North West to Northern Cape 8,574 h, R3.8m; Free State to Northern Cape 7,031 h, R3.8m; Free State to Hydra Central 5,538 h, R3.5m; Eastern Cape to KwaZulu-Natal 5,246 h, R2.0m; Gauteng to Limpopo 5,112 h, R30.9m |
| 2040 | the rebuilt table, N-1 once (today's corridors) | 56,676 | 103.2 | 99.5 | 25.15 | 2,459.1 | 136.2 | 350.2 | Free State to Northern Cape 8,760 h, R191.2m; North West to Northern Cape 8,760 h, R191.2m; Free State to Gauteng 7,656 h, R0.0m; Free State to Hydra Central 7,335 h, R154.6m; Eastern Cape to KwaZulu-Natal 6,934 h, R138.7m; Eastern Cape to Free State 6,168 h, R138.7m |
| 2040 | the report's 2025 limits as today's corridors | 42,501 | 106.7 | 99.7 | 27.24 | 3,430.0 | 141.3 | 439.7 | Free State to Northern Cape 8,760 h, R208.6m; Free State to Gauteng 8,760 h, R13.8m; North West to Northern Cape 8,760 h, R208.6m; Gauteng to Limpopo 8,353 h, R13.8m; Eastern Cape to KwaZulu-Natal 7,971 h, R163.0m; Free State to Hydra Central 7,904 h, R183.0m |
| 2040 | the rebuilt table with the TDP's lines, N-1 once | 78,453 | 73.5 | 88.2 | 9.32 | 22.1 | 83.1 | 85.0 | North West to Northern Cape 8,760 h, R13.7m; Free State to Northern Cape 8,752 h, R13.7m; Eastern Cape to KwaZulu-Natal 8,438 h, R9.8m; Free State to Gauteng 8,280 h, R0.0m; Free State to KwaZulu-Natal 8,128 h, R0.0m; Free State to Hydra Central 6,550 h, R9.8m |
| 2040 | the report's 2035 limits as the stand-in for the TDP's lines | 49,454 | 71.8 | 86.3 | 5.35 | 3,956.6 | 72.2 | 416.5 | Free State to Gauteng 8,760 h, R247.3m; North West to Northern Cape 8,746 h, R8.9m; Free State to Northern Cape 8,378 h, R8.9m; Gauteng to Limpopo 7,744 h, R247.3m; Free State to Hydra Central 7,136 h, R8.1m; Eastern Cape to KwaZulu-Natal 6,063 h, R5.1m |

Reading. (1) As today's corridors the two tables give nearly the same system: on the report's 2025 limits the 2035 build curtails 57.9 TWh against 55.4 on ours, runs 2 TWh more coal, and costs R2.0bn a year more in fuel and carbon; in 2040, 106.7 TWh against 103.2, with 3.4 TWh of unserved energy against 2.5 and R5bn more fuel and carbon. The 37% more corridor capacity in our table buys a 4% lower curtailment, because the capacity that differs sits on the Gauteng corridors and the binding ones are the two Karoo exits on both tables (North West to Northern Cape and Free State to Northern Cape, at their limit over 8,700 hours in every case). (2) As the stand-in for the TDP's lines the report's 2035 limits curtail less than our table with the TDP's lines (29.4 against 30.8 TWh in 2035; 71.8 against 73.5 in 2040) and run less coal and gas, but leave 194 GWh of unserved energy in 2035 and 3,957 GWh in 2040 where ours leaves 0 and 22, all of it behind the Free State to Gauteng corridor (589 MW in the report's 2035 against our 4,500 with the TDP's line) and, in 2040, Gauteng to Limpopo (256 against 1,800): at those limits Gauteng and Limpopo cannot be fed at night from the Free State hub and the Karoo, and the LP values a megawatt on Free State to Gauteng at R31m a year in 2035 and R247m (the value of lost load) in 2040. (3) So the priority ranking changes: the two Karoo exits stay first and second on both tables, but on the report's limits Free State to Gauteng is at its limit 8,600 to 8,760 hours in every case and carries the highest shadow value of any corridor in 2035 with the plan's lines and in 2040 throughout, with Gauteng to Limpopo beside it in 2040; on our table neither appears above Eastern Cape to KwaZulu-Natal and Free State to Hydra Central. That is the Lethabo question of (b) seen from the other side: our 3,600 MW there is Lethabo's stub lines, the report's 589 is the Everest pair, and the fleet file already dispatches Lethabo on the Gauteng bus, so the transit the LP needs from the Free State hub into Gauteng in 2040 runs on capacity that is too loose in ours and, since the report's figure leaves out the 765 kV path through Mpumalanga and Mercury that our table carries as separate corridors, possibly too tight in the report's. The candidate change (Lethabo's ties as Gauteng-internal, the Everest pair left) would bring our table to the report's on this corridor and bring the unserved energy with it, so the decision matters to the 2040 results and to which lines the TDP's Free State to Gauteng additions are (the TDP file's 900 MW there is the Lethabo to Makalu 400 kV line, which on that view is Gauteng-internal too). (4) What stays the same: curtailment within 5%, coal within 2 TWh, the Karoo exits first, and the TDP's lines as the thing that halves curtailment, on either table.

### 753 (d): the report's odd rows, recorded and not corrected

- Eastern Cape to KwaZulu-Natal, 2035: SIL 2,455 MW above loadability 1,786 (a SIL cannot exceed a loadability on the same path; one of the two is
  mislabelled or from a different line set, the 2035 contingency being Ariadne to Eros).
- Hydra Central to Eastern Cape, 2030: PV transfer 293 MW with Perseus to Gamma 765 kV out, below the 2025 figure of 1,104 and the 2035 figure of
  1,050, while the loadability doubles from 2025 to 2030; a 2030 network weaker than 2025's at a Free State contingency.
- Four corridors whose 2035 figure is below their 2025 one: Gauteng to Mpumalanga (6,008 to 4,811), Gauteng to North West (2,574 to 1,972), Gauteng
  to Limpopo (496 to 256) and KwaZulu-Natal to Mpumalanga (6,032 to 5,272), each a PV transfer; and Limpopo to Mpumalanga 2030 (1,118) below 2025
  (1,156). Possible for a voltage limit as the dispatch changes; odd for a plan year with more lines.
- Hydra Central to Northern Cape: PV transfer above loadability in all three years, so the loadability binds; the corridor does not grow with the
  Hydra to Kronos second line the TDP has for 2028.
- The report's contingency for Eastern Cape to KwaZulu-Natal in 2025 is Mookodi to Ferrum, a Northern Cape line.

Treatment: a cross-check. No limit in the rebuilt table is changed; the candidates above (Lethabo's ties, Dinaledi's side, the first Gamma to Kappa
765 kV line, Mercury's side) are for the user's decision, each with its cause stated here, and would be made in build_corridors.py and reported
with the old and new figures by corridor.

## Message 756: the corridor table under one rule on a labelled copy, and the reruns on it (7 Nov 2026, revised 22:15; nothing here is to be quoted; scratch and branch only; the table of record, corridors_v2.json, is not changed; the user decides on the copy in the morning)

### (a) The record on the engine dumps

The user's decision is to leave the branch history as it is. The record: the dumps' hourly demand, wind and solar for weather 2025 derive from
profiles.json, itself derived from ESK19679, and add nothing profiles.json does not already publish, which the 3 Nov decision covers; .gitignore
now excludes engine dumps (engine_*_wy*.json and the four prefixes), so none can be committed again.

### (b) One rule for every substation, generator and line end, on a labelled copy (corridors_v3.json)

The rule: the area is the supply region of the boundary set the fleet file already uses, which is PyPSA-RSA's rsa_supply_regions.gpkg (the
10-region layer, named by the GCCA supply areas: Eastern Cape, Free State, Gauteng, Hydra Central, KwaZulu Natal, Limpopo, Mpumalanga, North
West, Northern Cape, Western Cape; nodal_engine.py's own note names it as the source of the fleet's regions and the original corridor
mapping; the file is PyPSA-RSA's public data bundle, Google Drive folder 17f54zTMEfeFZhNByXxLkf9qcZRdhng03, read here under the project's
own terms and not committed). Applied by point in polygon to all 189 substations (area_assign.py; area_map_v3.json), it changes ten:

| substation | the file's area | under the rule |
|---|---|---|
| Anderson | North West | Gauteng |
| Dwarsberg | North West | Limpopo |
| Eros | Eastern Cape | KwaZulu-Natal (as the public record had it) |
| Gariep | Free State | Hydra Central |
| Highveld | Free State | Gauteng |
| Juno | Western Cape | Northern Cape (the file's hand correction to the Western Cape is reversed by the rule) |
| Lethabo | Free State | Gauteng (as the fleet file has its units) |
| Lomond | North West | Gauteng |
| Mookodi | North West | Northern Cape |
| Van der Kloof | Northern Cape | Hydra Central |

Of the fifteen province flags of 753 (and Lethabo, Dinaledi and Mercury), the rule changes Lethabo, Eros and Mookodi and leaves Makalu, Scafell, Dinaledi, Mercury, Pluto,
Midas, Pelly, Boundary, Manogeng, Silimela, Acornhoek, Carmel, Komsberg and Sorata where the file has them: a supply area need not follow the
province, and the rule, not the province or the report, decides. Dinaledi stays in Gauteng and Mercury in the North West.

The labelled copy of the corridor table under the rule (build_corridors.py with AREA_MAP; corridors_v3.json; corridor_table_v3_raw.md; the table
of record is corridors_v2.json, unchanged): 19 corridors, 52,888 MW N-1 once against 56,675 in the table of record, 73,900 MW with limits
only. Five corridors change:

| corridor | circuits before (v2) | N-1 once MW before | circuits after (the rule) | N-1 once MW after | limits only MW after | circuits moved |
|---|---|---|---|---|---|---|
| Gauteng to North West | 4 x 400 kV, 3 x 275 kV | 5,400 | 4 x 400 kV, 1 x 275 kV | 4,600 | 6,000 | out: LOMOND MINERVA 1; LOMOND MINERVA 2 |
| Free State to Gauteng | 1 x 400 kV, 9 x 275 kV | 3,600 | 2 x 275 kV | 400 | 800 | out: LETHABO EIGER 1; LETHABO GLOCKNER 1; LETHABO GLOCKNER 2; LETHABO MAKALU 1; LETHABO MAKALU 2; LETHABO RIGI 1; LETHABO RIGI 2; LETHABO SNOWDON 1 |
| Northern Cape to Western Cape | 1 x 400 kV | 801 | 1 x 400 kV | 823 | 1,176 | out: HELIOS JUNO 1 in: AURORA JUNO 1 |
| North West to Northern Cape | 1 x 400 kV | 726 | 1 x 400 kV | 663 | 947 | out: FERRUM MOOKODI 1 in: MERCURY MOOKODI 1 |
| Hydra Central to Northern Cape | 1 x 400 kV, 2 x 220 kV | 500 | 1 x 400 kV | 754 | 1,078 | out: VAN DER KLOOF ROODEKUIL 1; VAN DER KLOOF ROODEKUIL 2 |
| total (all corridors) | | 56,675 | | 52,888 | 73,900 | 5 corridors changed of 19 |

Free State to Gauteng loses Lethabo's eight ties into the Vaal (3,200 MW) and is the Everest 275 kV pair, 400 MW N-1 once; Gauteng to North
West loses the two Lomond to Minerva 275 kV circuits; Northern Cape to Western Cape swaps Helios to Juno (now Northern Cape internal) for
Aurora to Juno; North West to Northern Cape swaps Ferrum to Mookodi (now Northern Cape internal) for Mercury to Mookodi; Hydra Central to
Northern Cape loses the two Van der Kloof 220 kV ties, so its N-1 once is 0.7 of the single Hydra to Kronos circuit, 754 MW. The other
fourteen corridors are unchanged, the two Mercury 765 kV corridors among them.

The TDP file under the same rule (tdp_lines_v3.json, from tdp_lines_v2.json by the lines' named ends): five of the 20 inter-area lines
become internal and drop out (Lethabo to Makalu, now Gauteng internal; Paulputs to Juno, Aries to Juno and Juno to Gromis, Northern Cape
internal; Ferrum to Mookodi, Northern Cape internal), and Highveld to Emkhiweni moves from Free State to Mpumalanga to Gauteng to Mpumalanga;
15 lines remain (17 in the with-range). The approved-record siting, which places each record by its nearest substation, moves under the rule
too (reea_shares_v3.md): Juno's records go to the Northern Cape (wind 10,344 to 11,099 MW), Gariep's and Van der Kloof's to Hydra Central
(solar 18,062 to 22,659 MW, from the North West's 24,711 to 21,931 and the Free State's 20,685 to 19,537), and the Free State's 190 MW of wind
to Gauteng; the totals are unchanged. The existing renewable fleet by area (regional_renewable_capacity.json, from the IPP Office's figures by
province) and the rooftop and demand splits carry no coordinates, so the rule cannot be applied to them here; they stay as they are and are
noted. The fleet file itself already uses the set.

Gamma to Kappa 765 kV, the first line. Public sources found (none on eskom.co.za or ntcsa.co.za; the pages themselves are outside the
session's network, so these are the search summaries): a contractor's project page (Mkhulu EDP, 'Gamma Kappa A 765 kV transmission line')
gives the construction as completed in 2011 to 2012; SAnews on 29 November 2016, reporting the Kappa to Sterrekus commissioning, says the
Western Cape 'is now connected to the 765 kV network over and above the 400 kV network', which needs Gamma to Kappa in service at 765 kV by
that date; Heritage Western Cape's assessment is for the 'Gamma-Kappa 2nd 765 kV line'. No public source gives the energisation date of the
first line itself, so by the user's condition it is not added to the copy; it is run as a labelled sensitivity (corridors_v3gk.json,
extra_lines_gk.json: 356.5 km by the substations' coordinates, St Clair 2,688 MW, which makes Hydra Central to Western Cape 5,396 MW with
limits only and 2,709 N-1 once against 1,803), and goes in if the user takes 'in service by November 2016' as the date.

### (c) The reruns on the labelled copy

Cases (queue23a, 23b, 23c; CORR_FILE corridors_v3.json, AREA_MAP area_map_v3.json, the TDP file tdp_lines_v3.json): 738 (b)'s main cases
for 2035 and 2040 (N-1 once, limits only, the TDP's lines and the with-range, corridors priced at R10,000 and R21,700, free siting, the
commitment floor); 743 (a)'s 2040 free lithium in 3-hour blocks with and without corridors at R21,700, with its block base; the Gamma to
Kappa sensitivity as fixed builds. 753 (c)'s report-limit cases do not change (the report's limits and the two Mercury corridors are as they
were); its comparison is re-read against the copy. Results, before and after, at both values of unserved energy: pending (the queues are running).

### (d) 732: why the pathway's same-area cap moves the 2040 mix and the ten-area test does not

Amended in the 729 judgement: the credit moves the mix only where it reaches the margin. The ten-area 2040 LP builds 31.9 GW of solar, 9.6
GW beyond the 22.3 GW pool with or without the credit, so the credit is inframarginal and the mix is the same to the decimal; the pathway's
2040 solar sits within 2 GW of the pool, so the cap reaches its margin and moves 3.7 GW of solar and 1.5 of wind, for R21.7bn on its LP, which
also carries the adequacy standard and the coupling across years. 'About a gigawatt of wind at most' is withdrawn.
