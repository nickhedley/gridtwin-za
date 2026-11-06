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

| state | corridors | curtailed TWh (engine) | unserved GWh (engine) | coal TWh (engine) | diesel TWh (engine) | Western Cape: net import TWh, diesel TWh, unserved GWh | corridors with the most hours carrying a shadow price |
|---|---|---|---|---|---|---|---|
| 2025, as modelled | 0.85 | 0.00 (0.01) | 8.7 (5.4) | 170.7 (170.1) | 1.266 (2.435) | 6.49, 1.226, 8.1 | Eastern Cape to Kwazulu Natal 8 h; Free State to Kwazulu Natal 8 h; Kwazulu Natal to Mpumalanga 8 h |
| 2025, as modelled Koeberg calendar 1:302,60:68 | 0.85 | 0.00 (0.01) | 13.8 (5.4) | 171.0 (170.1) | 1.782 (2.435) | 6.85, 1.715, 13.1 | Free State to Kwazulu Natal 31 h; Kwazulu Natal to Mpumalanga 31 h; Eastern Cape to Kwazulu Natal 27 h |
| 2025, as modelled | as drawn (1.0) | 0.00 (0.01) | 8.7 (5.4) | 170.7 (170.1) | 1.263 (2.435) | 6.48, 1.224, 8.4 | none |
| 2025, as modelled Koeberg calendar 1:302,60:68 | as drawn (1.0) | 0.00 (0.01) | 13.8 (5.4) | 171.0 (170.1) | 1.775 (2.435) | 6.85, 1.708, 13.5 | none |
| 2025, as modelled | 0.7 | 0.00 (0.01) | 8.7 (5.4) | 170.4 (170.1) | 1.527 (2.435) | 6.24, 1.484, 7.5 | Kwazulu Natal to Mpumalanga 2348 h; Free State to Kwazulu Natal 2345 h; Eastern Cape to Hydra Central 1333 h |
| 2025, as modelled Koeberg calendar 1:302,60:68 | 0.7 | 0.00 (0.01) | 13.8 (5.4) | 170.6 (170.1) | 2.119 (2.435) | 6.55, 2.040, 12.6 | Kwazulu Natal to Mpumalanga 2090 h; Free State to Kwazulu Natal 2045 h; Eastern Cape to Hydra Central 1115 h |
| 2025, as modelled | drop one circuit | 0.00 (0.01) | 8.7 (5.4) | 170.7 (170.1) | 1.265 (2.435) | 6.51, 1.226, 7.5 | Eastern Cape to Kwazulu Natal 7 h; Free State to Kwazulu Natal 7 h; Kwazulu Natal to Mpumalanga 7 h |
| 2025, as modelled Koeberg calendar 1:302,60:68 | drop one circuit | 0.00 (0.01) | 13.8 (5.4) | 171.0 (170.1) | 1.783 (2.435) | 6.87, 1.717, 12.6 | Free State to Kwazulu Natal 30 h; Kwazulu Natal to Mpumalanga 30 h; Eastern Cape to Kwazulu Natal 24 h |
| 2025, as modelled | no limits | 0.00 (0.01) | 8.7 (5.4) | 170.7 (170.1) | 1.263 (2.435) | 6.39, 1.224, 8.7 | none |
| 2025, as modelled Koeberg calendar 1:302,60:68 | no limits | 0.00 (0.01) | 13.8 (5.4) | 171.0 (170.1) | 1.775 (2.435) | 6.76, 1.708, 13.8 | none |
| Today 2026 | 0.85 | 0.00 (0.47) | 0.0 (0.0) | 149.0 (150.9) | 0.001 (0.175) | 4.68, 0.001, 0.0 | none |
| Today 2026 Koeberg calendar 116:320,239:243,289:295 | 0.85 | 0.00 (0.47) | 0.0 (0.0) | 148.4 (150.9) | 0.001 (0.175) | 4.10, 0.001, 0.0 | none |
| Today 2026 | as drawn (1.0) | 0.00 (0.47) | 0.0 (0.0) | 149.0 (150.9) | 0.001 (0.175) | 4.68, 0.001, 0.0 | none |
| Today 2026 Koeberg calendar 116:320,239:243,289:295 | as drawn (1.0) | 0.00 (0.47) | 0.0 (0.0) | 148.4 (150.9) | 0.001 (0.175) | 4.10, 0.001, 0.0 | none |
| Today 2026 | 0.7 | 0.00 (0.47) | 0.0 (0.0) | 149.0 (150.9) | 0.001 (0.175) | 4.68, 0.001, 0.0 | Free State to Kwazulu Natal 490 h; Kwazulu Natal to Mpumalanga 489 h; Eastern Cape to Hydra Central 475 h |
| Today 2026 Koeberg calendar 116:320,239:243,289:295 | 0.7 | 0.00 (0.47) | 0.0 (0.0) | 148.4 (150.9) | 0.001 (0.175) | 4.10, 0.001, 0.0 | Kwazulu Natal to Mpumalanga 492 h; Free State to Kwazulu Natal 474 h; Eastern Cape to Hydra Central 461 h |
| Today 2026 | drop one circuit | 0.00 (0.47) | 0.0 (0.0) | 149.0 (150.9) | 0.001 (0.175) | 4.68, 0.001, 0.0 | none |
| Today 2026 Koeberg calendar 116:320,239:243,289:295 | drop one circuit | 0.00 (0.47) | 0.0 (0.0) | 148.4 (150.9) | 0.001 (0.175) | 4.10, 0.001, 0.0 | Hydra Central to Western Cape 18 h; North West to Western Cape 18 h; Northern Cape to Western Cape 18 h |
| Today 2026 | no limits | 0.00 (0.47) | 0.0 (0.0) | 149.0 (150.9) | 0.001 (0.175) | 4.68, 0.001, 0.0 | none |
| Today 2026 Koeberg calendar 116:320,239:243,289:295 | no limits | 0.00 (0.47) | 0.0 (0.0) | 148.4 (150.9) | 0.001 (0.175) | 4.09, 0.001, 0.0 | none |

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

| year, weather year | corridors | curtailed TWh | unserved GWh | coal TWh | gas TWh | fuel and carbon R bn | corridors binding over 4,000 h |
|---|---|---|---|---|---|---|---|
| 2035, 2015 | 0.85 | +53.4 | +26.7 | +53.1 | +0.0 | +39.7 | North West to Western Cape (7697 h, R20.7m); North West to Northern Cape (7697 h, R20.6m); Eastern Cape to Kwazulu Natal (6808 h, R19.2m); Free State to Kwazulu Natal (6900 h, R19.0m); Free State to Mpumalanga (6853 h, R18.6m); Free State to North West (6853 h, R18.6m); Free State to Gauteng (6853 h, R18.6m) |
| 2035, 2015 | as drawn (1.0) | +45.8 | +0.0 | +45.7 | +0.0 | +32.4 | North West to Western Cape (7062 h, R5.6m); North West to Northern Cape (7033 h, R5.6m); Eastern Cape to Kwazulu Natal (6436 h, R5.0m); Free State to Kwazulu Natal (6259 h, R4.6m); Free State to Mpumalanga (6255 h, R4.6m); Free State to North West (6255 h, R4.6m); Free State to Gauteng (6255 h, R4.6m) |
| 2035, 2015 | 0.7 | +61.7 | +561.1 | +59.1 | +0.0 | +55.8 | Free State to Kwazulu Natal (8157 h, R135.4m); Eastern Cape to Kwazulu Natal (7392 h, R133.8m); North West to Northern Cape (8239 h, R112.4m); North West to Western Cape (8230 h, R112.2m); Free State to Mpumalanga (7478 h, R100.9m); Free State to North West (7478 h, R100.9m); Free State to Gauteng (7478 h, R100.9m); Kwazulu Natal to Mpumalanga (4071 h, R34.5m) |
| 2035, 2015 | drop one circuit | +58.6 | +197.1 | +57.4 | +0.0 | +47.3 | North West to Northern Cape (8071 h, R56.9m); North West to Western Cape (7931 h, R56.3m); Eastern Cape to Kwazulu Natal (6611 h, R46.8m); Free State to Northern Cape (4418 h, R32.3m); Free State to Hydra Central (4204 h, R31.5m); Free State to Kwazulu Natal (5427 h, R25.3m); Free State to Mpumalanga (5338 h, R24.6m); Free State to North West (5338 h, R24.6m); Free State to Gauteng (5338 h, R24.6m |
| 2035, 2015 | drop one circuit with TDP | +30.6 | +0.0 | +30.2 | +0.0 | +21.1 | North West to Northern Cape (5479 h, R3.8m); North West to Western Cape (5479 h, R3.8m); Eastern Cape to Kwazulu Natal (5479 h, R3.8m); Free State to Hydra Central (5433 h, R3.7m); Free State to Northern Cape (5433 h, R3.7m); Eastern Cape to Free State (5433 h, R3.7m) |
| 2035, 2015 | drop one circuit with TDP (TDP: tdp_lines_full.json) | +13.8 | +0.0 | +13.3 | +0.0 | +9.3 | none |
| 2035, 2015 | 0.7 with TDP | +31.4 | +0.0 | +31.1 | +0.0 | +21.7 | Eastern Cape to Kwazulu Natal (5592 h, R3.8m); North West to Northern Cape (5586 h, R3.8m); North West to Western Cape (5586 h, R3.8m); Free State to Hydra Central (5508 h, R3.7m); Free State to Northern Cape (5508 h, R3.7m); Eastern Cape to Free State (5508 h, R3.7m) |
| 2035, 2015 | 0.7 with TDP (TDP: tdp_lines_full.json) | +14.3 | +0.0 | +13.8 | +0.0 | +9.7 | none |
| 2035, 2025 | 0.85 | +59.6 | +163.6 | +58.9 | +0.0 | +44.0 | North West to Western Cape (7908 h, R38.3m); North West to Northern Cape (7920 h, R37.7m); Free State to Kwazulu Natal (7341 h, R33.0m); Free State to Mpumalanga (7323 h, R32.7m); Free State to North West (7323 h, R32.7m); Free State to Gauteng (7323 h, R32.7m); Eastern Cape to Kwazulu Natal (7129 h, R32.3m) |
| 2035, 2025 | 0.85 with TDP | +25.6 | +0.0 | +25.1 | +0.0 | +17.5 | Eastern Cape to Kwazulu Natal (4996 h, R3.3m); North West to Northern Cape (4996 h, R3.3m); North West to Western Cape (4996 h, R3.3m); Free State to Hydra Central (4813 h, R3.2m); Free State to Northern Cape (4813 h, R3.2m); Eastern Cape to Free State (4813 h, R3.2m) |
| 2035, 2025 | 0.85 with TDP (TDP: tdp_lines_full.json) | +8.3 | +0.0 | +7.7 | +0.0 | +5.4 | none |
| 2035, 2025 | as drawn (1.0) | +51.6 | +1.5 | +51.3 | +0.0 | +37.0 | North West to Northern Cape (7464 h, R6.8m); North West to Western Cape (7460 h, R6.8m); Eastern Cape to Kwazulu Natal (6848 h, R5.9m); Free State to Mpumalanga (6862 h, R5.9m); Free State to North West (6862 h, R5.9m); Free State to Gauteng (6862 h, R5.9m); Free State to Kwazulu Natal (6862 h, R5.9m) |
| 2035, 2025 | 1.0 with TDP | +17.5 | +0.0 | +16.9 | +0.0 | +11.8 | none |
| 2035, 2025 | 1.0 with TDP (TDP: tdp_lines_full.json) | +2.9 | +0.0 | +2.5 | +0.0 | +1.8 | none |
| 2035, 2025 | 0.7 | +68.0 | +704.8 | +66.0 | +0.0 | +54.2 | Free State to Kwazulu Natal (8209 h, R69.6m); Eastern Cape to Kwazulu Natal (7474 h, R68.4m); North West to Northern Cape (8330 h, R63.6m); North West to Western Cape (8327 h, R63.5m); Free State to Mpumalanga (7732 h, R52.1m); Free State to North West (7732 h, R52.1m); Free State to Gauteng (7732 h, R52.1m); Kwazulu Natal to Mpumalanga (4324 h, R17.5m) |
| 2035, 2025 | drop one circuit | +64.8 | +474.2 | +63.6 | +0.0 | +48.6 | North West to Western Cape (8036 h, R55.0m); North West to Northern Cape (8130 h, R55.0m); Eastern Cape to Kwazulu Natal (6809 h, R38.2m); Free State to Northern Cape (4680 h, R32.1m); Free State to Hydra Central (4505 h, R30.1m); Free State to Kwazulu Natal (5486 h, R23.0m); Free State to Mpumalanga (5474 h, R23.0m); Free State to North West (5474 h, R23.0m); Free State to Gauteng (5474 h, R23.0m |
| 2035, 2025 | drop one circuit with TDP | +35.1 | +0.0 | +34.6 | +0.0 | +24.2 | Eastern Cape to Kwazulu Natal (6009 h, R4.2m); North West to Northern Cape (6014 h, R4.2m); North West to Western Cape (6011 h, R4.2m); Free State to Northern Cape (5992 h, R4.1m); Free State to Hydra Central (5989 h, R4.1m); Eastern Cape to Free State (5986 h, R4.1m) |
| 2035, 2025 | drop one circuit with TDP (TDP: tdp_lines_full.json) | +16.2 | +0.0 | +15.6 | +0.0 | +10.9 | none |
| 2035, 2025 | 0.7 with TDP | +36.0 | +0.0 | +35.5 | +0.0 | +25.0 | Eastern Cape to Kwazulu Natal (6122 h, R4.4m); North West to Northern Cape (6124 h, R4.3m); North West to Western Cape (6123 h, R4.3m); Free State to Northern Cape (6068 h, R4.1m); Free State to Hydra Central (6067 h, R4.1m); Eastern Cape to Free State (6063 h, R4.1m) |
| 2035, 2025 | 0.7 with TDP (TDP: tdp_lines_full.json) | +16.8 | +0.0 | +16.2 | +0.0 | +11.3 | North West to Western Cape (4053 h, R2.6m); North West to Northern Cape (4048 h, R2.6m) |
| 2040, 2015 | as drawn (1.0) | +84.1 | +1279.4 | +53.3 | +25.5 | +107.9 | North West to Western Cape (8564 h, R171.8m); North West to Northern Cape (8559 h, R171.3m); Free State to North West (8387 h, R161.9m); Free State to Mpumalanga (8387 h, R161.9m); Free State to Gauteng (8387 h, R161.9m); Free State to Kwazulu Natal (8387 h, R161.9m); Eastern Cape to Kwazulu Natal (8116 h, R161.2m) |
| 2040, 2015 | 0.7 | +102.1 | +7968.3 | +53.6 | +32.0 | +147.3 | North West to Northern Cape (8751 h, R502.0m); North West to Western Cape (8750 h, R501.8m); Free State to Kwazulu Natal (8645 h, R491.0m); Free State to Mpumalanga (8645 h, R490.9m); Free State to North West (8645 h, R490.9m); Free State to Gauteng (8645 h, R490.9m); Eastern Cape to Kwazulu Natal (8214 h, R473.8m) |
| 2040, 2015 | drop one circuit | +98.1 | +5660.7 | +53.6 | +31.1 | +141.5 | North West to Northern Cape (8743 h, R353.7m); North West to Western Cape (8722 h, R352.4m); Eastern Cape to Kwazulu Natal (8063 h, R319.0m); Free State to Kwazulu Natal (7742 h, R230.2m); Free State to Mpumalanga (7742 h, R230.2m); Free State to North West (7742 h, R230.2m); Free State to Gauteng (7742 h, R230.2m) |
| 2040, 2015 | drop one circuit with TDP | +62.8 | +0.0 | +49.9 | +11.3 | +60.2 | North West to Northern Cape (7222 h, R14.2m); Free State to Northern Cape (7219 h, R14.1m); North West to Western Cape (7200 h, R14.1m); Eastern Cape to Kwazulu Natal (7196 h, R14.1m); Free State to Hydra Central (7194 h, R14.0m); Eastern Cape to Free State (7192 h, R14.0m) |
| 2040, 2015 | drop one circuit with TDP (TDP: tdp_lines_full.json) | +37.4 | +0.0 | +35.1 | +1.0 | +26.6 | North West to Western Cape (5670 h, R5.2m); Free State to Hydra Central (5659 h, R5.2m); North West to Northern Cape (5660 h, R5.2m); Free State to Northern Cape (5651 h, R5.2m); Eastern Cape to Kwazulu Natal (4226 h, R3.8m); Eastern Cape to Free State (4250 h, R3.8m) |
| 2040, 2015 | 0.7 with TDP | +63.9 | +0.0 | +50.2 | +12.1 | +62.5 | Eastern Cape to Kwazulu Natal (7285 h, R14.9m); North West to Northern Cape (7298 h, R14.9m); North West to Western Cape (7293 h, R14.9m); Free State to Northern Cape (7210 h, R14.6m); Free State to Hydra Central (7204 h, R14.6m); Eastern Cape to Free State (7195 h, R14.6m) |
| 2040, 2015 | 0.7 with TDP (TDP: tdp_lines_full.json) | +38.3 | +0.0 | +35.9 | +1.2 | +27.5 | North West to Western Cape (5753 h, R5.4m); North West to Northern Cape (5738 h, R5.3m); Free State to Hydra Central (5729 h, R5.3m); Free State to Northern Cape (5714 h, R5.2m); Eastern Cape to Kwazulu Natal (4226 h, R3.9m); Eastern Cape to Free State (4250 h, R3.8m) |
| 2040, 2025 | 0.85 | +100.8 | +5191.3 | +63.0 | +27.4 | +121.9 | North West to Northern Cape (8682 h, R257.0m); North West to Western Cape (8683 h, R256.9m); Free State to Mpumalanga (8650 h, R256.2m); Free State to North West (8650 h, R256.2m); Free State to Gauteng (8650 h, R256.2m); Free State to Kwazulu Natal (8650 h, R256.2m); Eastern Cape to Kwazulu Natal (8174 h, R248.1m) |
| 2040, 2025 | 0.85 with TDP | +57.1 | -0.0 | +49.5 | +6.0 | +47.5 | Eastern Cape to Kwazulu Natal (6924 h, R8.9m); North West to Northern Cape (6925 h, R8.9m); North West to Western Cape (6924 h, R8.9m); Free State to Northern Cape (6915 h, R8.8m); Free State to Hydra Central (6914 h, R8.8m); Eastern Cape to Free State (6914 h, R8.8m) |
| 2040, 2025 | 0.85 with TDP (TDP: tdp_lines_full.json) | +28.1 | -0.0 | +26.5 | +0.1 | +18.8 | North West to Western Cape (5019 h, R3.5m); North West to Northern Cape (5014 h, R3.5m); Free State to Hydra Central (4992 h, R3.5m); Free State to Northern Cape (4987 h, R3.5m) |
| 2040, 2025 | as drawn (1.0) | +91.9 | +2632.1 | +62.9 | +22.0 | +107.2 | North West to Northern Cape (8541 h, R198.0m); North West to Western Cape (8544 h, R197.9m); Free State to Mpumalanga (8460 h, R196.8m); Free State to North West (8460 h, R196.8m); Free State to Gauteng (8460 h, R196.8m); Free State to Kwazulu Natal (8460 h, R196.8m); Eastern Cape to Kwazulu Natal (8162 h, R191.8m) |
| 2040, 2025 | 1.0 with TDP | +44.3 | -0.0 | +40.6 | +2.1 | +32.8 | North West to Northern Cape (6208 h, R6.3m); North West to Western Cape (6208 h, R6.3m); Eastern Cape to Kwazulu Natal (6208 h, R6.3m); Free State to Hydra Central (6186 h, R6.3m); Free State to Northern Cape (6186 h, R6.3m); Eastern Cape to Free State (6186 h, R6.3m) |
| 2040, 2025 | 1.0 with TDP (TDP: tdp_lines_full.json) | +16.0 | -0.0 | +14.7 | +0.0 | +10.3 | none |
| 2040, 2025 | 0.7 | +110.0 | +8388.7 | +63.0 | +32.0 | +139.1 | North West to Northern Cape (8759 h, R308.6m); North West to Western Cape (8759 h, R308.5m); Free State to Kwazulu Natal (8759 h, R308.0m); Free State to Mpumalanga (8759 h, R308.0m); Free State to North West (8759 h, R308.0m); Free State to Gauteng (8759 h, R308.0m); Eastern Cape to Kwazulu Natal (8178 h, R294.3m) |
| 2040, 2025 | drop one circuit | +105.8 | +6906.2 | +63.0 | +30.0 | +131.2 | North West to Northern Cape (8701 h, R291.3m); North West to Western Cape (8659 h, R290.0m); Eastern Cape to Kwazulu Natal (7932 h, R265.6m); Free State to Mpumalanga (7124 h, R136.8m); Free State to North West (7124 h, R136.8m); Free State to Gauteng (7124 h, R136.8m); Free State to Kwazulu Natal (7124 h, R136.8m) |
| 2040, 2025 | drop one circuit with TDP | +70.2 | +148.2 | +56.8 | +11.1 | +67.5 | North West to Northern Cape (7535 h, R32.6m); North West to Western Cape (7522 h, R32.5m); Free State to Northern Cape (7533 h, R32.5m); Eastern Cape to Kwazulu Natal (7508 h, R32.2m); Free State to Hydra Central (7511 h, R32.2m); Eastern Cape to Free State (7502 h, R32.1m) |
| 2040, 2025 | drop one circuit with TDP (TDP: tdp_lines_full.json) | +42.8 | -0.0 | +39.5 | +1.6 | +31.1 | North West to Western Cape (6252 h, R6.2m); North West to Northern Cape (6240 h, R6.2m); Free State to Hydra Central (6221 h, R6.1m); Free State to Northern Cape (6224 h, R6.1m); Eastern Cape to Kwazulu Natal (4766 h, R4.8m); Eastern Cape to Free State (4805 h, R4.8m) |
| 2040, 2025 | 0.7 with TDP | +71.4 | +201.0 | +57.3 | +11.7 | +69.4 | North West to Northern Cape (7583 h, R48.5m); North West to Western Cape (7579 h, R48.4m); Eastern Cape to Kwazulu Natal (7566 h, R48.2m); Free State to Northern Cape (7572 h, R48.1m); Free State to Hydra Central (7561 h, R47.9m); Eastern Cape to Free State (7544 h, R47.8m) |
| 2040, 2025 | 0.7 with TDP (TDP: tdp_lines_full.json) | +43.8 | -0.0 | +40.3 | +1.9 | +32.2 | North West to Western Cape (6338 h, R6.4m); North West to Northern Cape (6329 h, R6.3m); Free State to Hydra Central (6307 h, R6.2m); Free State to Northern Cape (6306 h, R6.2m); Eastern Cape to Kwazulu Natal (4742 h, R4.9m); Eastern Cape to Free State (4817 h, R4.8m) |

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

| year, weather year | base | cost R per MW-km | built MW | MW-km (thousand) | capex R bn | R bn a year | curtailed left TWh (no-limits, base without expansion) | unserved GWh | by corridor (MW) |
|---|---|---|---|---|---|---|---|---|---|
| 2035, 2015 | 0.7 | 10,000 | 27,224 | 5,432 | 54.3 | 4.56 | 3.6 (2.8, 64.5) | 0.0 | North West to Northern Cape 9,178; Eastern Cape to Kwazulu Natal 6,264; Northern Cape to Western Cape 5,639; Eastern Cape to Hydra Central 3,410; Free State to Northern Cape 1,769; Free State to Gauteng 963 |
| 2035, 2015 | drop one circuit | 10,000 | 25,874 | 5,158 | 51.6 | 4.33 | 3.6 (2.8, 61.4) | 0.0 | North West to Northern Cape 11,169; Northern Cape to Western Cape 6,306; Eastern Cape to Kwazulu Natal 4,790; Eastern Cape to Hydra Central 1,864; Free State to Northern Cape 1,131; Hydra Central to Northern Cape 613 |
| 2035, 2025 | 0.7 | 10,000 | 28,072 | 5,564 | 55.6 | 4.67 | 3.8 (3.1, 71.0) | 0.0 | North West to Northern Cape 9,191; Eastern Cape to Kwazulu Natal 6,432; Northern Cape to Western Cape 6,004; Eastern Cape to Hydra Central 3,365; Free State to Northern Cape 1,914; Free State to Gauteng 1,165 |
| 2035, 2025 | drop one circuit | 10,000 | 26,485 | 5,286 | 52.9 | 4.43 | 3.8 (3.1, 67.9) | 0.0 | North West to Northern Cape 11,122; Northern Cape to Western Cape 6,498; Eastern Cape to Kwazulu Natal 5,194; Eastern Cape to Hydra Central 2,086; Free State to Northern Cape 1,088; Hydra Central to Northern Cape 497 |
| 2035, 2025 | drop one circuit with TDP | 10,000 | 11,699 | 2,063 | 20.6 | 1.73 | 3.7 (3.1, 38.1) | 0.0 | North West to Northern Cape 4,656; Northern Cape to Western Cape 2,502; Eastern Cape to Kwazulu Natal 2,305; Free State to Northern Cape 2,236 |
| 2035, 2025 | 0.7 | 21,700 | 24,164 | 4,922 | 106.8 | 8.96 | 5.1 (3.1, 71.0) | 0.0 | North West to Northern Cape 9,300; Eastern Cape to Kwazulu Natal 5,947; Northern Cape to Western Cape 5,117; Eastern Cape to Hydra Central 2,956; Free State to Northern Cape 735; Free State to Gauteng 109 |
| 2035, 2025 | drop one circuit | 21,700 | 23,723 | 4,686 | 101.7 | 8.53 | 5.0 (3.1, 67.9) | 0.0 | North West to Northern Cape 11,190; Northern Cape to Western Cape 5,768; Eastern Cape to Kwazulu Natal 3,754; Hydra Central to Northern Cape 1,312; Free State to Northern Cape 955; Eastern Cape to Hydra Central 743 |
| 2040, 2015 | drop one circuit | 10,000 | 34,661 | 6,969 | 69.7 | 5.84 | 12.6 (11.5, 109.5) | 0.0 | North West to Northern Cape 11,584; Eastern Cape to Kwazulu Natal 8,176; Northern Cape to Western Cape 7,238; Eastern Cape to Hydra Central 4,902; Free State to Northern Cape 2,143; Free State to Gauteng 618 |
| 2040, 2025 | 0.7 | 10,000 | 38,431 | 7,454 | 74.5 | 6.25 | 14.1 (13.1, 123.1) | 2.1 | North West to Northern Cape 9,587; Eastern Cape to Kwazulu Natal 8,621; Northern Cape to Western Cape 7,580; Eastern Cape to Hydra Central 5,389; Free State to Northern Cape 4,281; Free State to Gauteng 2,973 |
| 2040, 2025 | drop one circuit | 10,000 | 35,678 | 7,143 | 71.4 | 5.99 | 14.1 (13.1, 119.0) | 2.1 | North West to Northern Cape 11,726; Eastern Cape to Kwazulu Natal 8,264; Northern Cape to Western Cape 7,691; Eastern Cape to Hydra Central 4,976; Free State to Northern Cape 2,339; Free State to Gauteng 682 |
| 2040, 2025 | drop one circuit with TDP | 10,000 | 20,095 | 3,656 | 36.6 | 3.07 | 14.0 (13.1, 83.3) | 2.1 | North West to Northern Cape 8,738; Northern Cape to Western Cape 5,998; Free State to Northern Cape 2,910; Eastern Cape to Kwazulu Natal 2,450 |
| 2040, 2025 | 0.7 | 21,700 | 34,596 | 6,802 | 147.6 | 12.38 | 15.4 (13.1, 123.1) | 2.1 | North West to Northern Cape 9,905; Eastern Cape to Kwazulu Natal 8,277; Northern Cape to Western Cape 6,767; Eastern Cape to Hydra Central 4,591; Free State to Northern Cape 2,977; Free State to Gauteng 2,077 |
| 2040, 2025 | drop one circuit | 21,700 | 32,064 | 6,497 | 141.0 | 11.82 | 15.4 (13.1, 119.0) | 2.1 | North West to Northern Cape 11,991; Eastern Cape to Kwazulu Natal 7,758; Northern Cape to Western Cape 7,036; Eastern Cape to Hydra Central 4,032; Free State to Northern Cape 1,247 |

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

| year, weather year | corridors | wind shares chosen | solar shares chosen | curtailed TWh (fixed REEA siting) | unserved GWh (fixed REEA siting) | coal TWh (fixed) |
|---|---|---|---|---|---|---|
| 2035, 2025 | 0.7 | Northern Cape 32%, Eastern Cape 23%, Hydra Central 16%, Western Cape 15%, Mpumalanga 10%, Kwazulu Natal 2%, North West 1%, Free State 1% | North West 54%, Mpumalanga 23%, Gauteng 18%, Kwazulu Natal 5% | 41.6 (71.0) | 137.1 (704.8) | 101.9 (128.9) |
| 2035, 2025 | 0.7, extendable at R10,000 per MW-km | Northern Cape 38%, Hydra Central 37%, Eastern Cape 23%, Kwazulu Natal 2% | Northern Cape 68%, North West 32% | 5.0 (3.8) | 0.0 (0.0) | 56.5 (63.5) |
| 2035, 2025 | drop one circuit | Northern Cape 24%, Eastern Cape 23%, Hydra Central 21%, Western Cape 18%, Mpumalanga 10%, Kwazulu Natal 2%, North West 1%, Free State 1% | North West 95%, Kwazulu Natal 5% | 40.5 (67.9) | 14.9 (474.2) | 100.5 (126.5) |
| 2035, 2025 | drop one circuit, extendable at R10,000 per MW-km | Northern Cape 38%, Hydra Central 37%, Eastern Cape 23%, Kwazulu Natal 2% | Northern Cape 68%, North West 32% | 5.0 (3.8) | 0.0 (0.0) | 56.5 (63.5) |
| 2035, 2025 | drop one circuit with TDP (full TDP, 22 lines) | Northern Cape 38%, Hydra Central 27%, Eastern Cape 21%, Mpumalanga 10%, Kwazulu Natal 2%, North West 1%, Free State 1% | North West 100% | 7.9 (19.3) | 0.0 (0.0) | 65.3 (78.5) |
| 2035, 2025 | 0.7 with TDP | Northern Cape 38%, Hydra Central 25%, Eastern Cape 23%, Mpumalanga 10%, Kwazulu Natal 2%, North West 1%, Free State 1% | North West 100% | 20.7 (39.1) | 0.0 (0.0) | 78.0 (98.4) |

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

| year, weather year | case | blocks | wind GW (run) | solar GW (run) | lithium GW, GWh (run) | open cycle GW (run) | corridors built MW | coal TWh (engine) | curtailed TWh (engine) | unserved GWh | new-build cost R bn a year | fuel and carbon R bn | cost R bn (new build, corridors, fuel and carbon, unserved at the value of lost load) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2035, 2015 | drop one circuit, corridors at R10,000, integration charge removed | 3 h | 21.9 (27.2) | 16.6 (17.7) | 6.2, 26.5 (8.8, 38.2) | 0.00 (0.00) | 12,932 | 88.8 (76.0) | 6.0 (9.0) | 4.1 | 79.0 | 64.4 | 143.7 |
    mix by area, wind GW: Northern Cape 10.3, Hydra Central 5.6, Eastern Cape 4.8, Kwazulu Natal 0.6, North West 0.3, Free State 0.2; solar GW: Limpopo 9.2, Western Cape 3.7, Northern Cape 3.7; lithium GW: Limpopo 2.2, Northern Cape 1.9, Western Cape 1.3, Free State 0.5, Hydra Central 0.3; open cycle GW: 
| 2035, 2015 | no limits, integration charge kept | 3 h | 22.7 (27.2) | 12.8 (17.7) | 6.6, 26.9 (8.8, 38.2) | 0.00 (0.00) | 0 | 90.6 (76.0) | 3.7 (9.0) | 2.7 | 87.1 | 66.9 | 154.2 |
    mix by area, wind GW: Northern Cape 10.3, Hydra Central 8.9, Eastern Cape 1.9, Kwazulu Natal 0.6, Mpumalanga 0.4, North West 0.3, Free State 0.2; solar GW: Western Cape 8.5, Northern Cape 3.5, Limpopo 0.8; lithium GW: Gauteng 4.3, Eastern Cape 1.1, Limpopo 1.0, Free State 0.2; open cycle GW: 
| 2035, 2025 | drop one circuit, corridors at R10,000, integration charge removed | 3 h | 22.5 (27.2) | 15.6 (17.7) | 6.6, 23.2 (8.8, 38.2) | 0.00 (0.00) | 14,361 | 83.9 (71.5) | 7.4 (9.8) | 0.7 | 78.5 | 61.8 | 140.4 |
    mix by area, wind GW: Northern Cape 10.3, Eastern Cape 6.2, Hydra Central 5.0, Kwazulu Natal 0.6, North West 0.3; solar GW: Northern Cape 10.0, North West 5.0, Western Cape 0.5; lithium GW: Northern Cape 4.7, Limpopo 0.9, Free State 0.6, Hydra Central 0.3, Western Cape 0.1; open cycle GW: 
| 2035, 2025 | drop one circuit, integration charge kept | 3 h | 12.4 (27.2) | 23.1 (17.7) | 7.8, 43.8 (8.8, 38.2) | 0.67 (0.00) | 0 | 104.9 (71.5) | 4.1 (9.8) | 3.1 | 84.5 | 79.1 | 163.8 |
    mix by area, wind GW: Northern Cape 4.3, Hydra Central 3.6, Eastern Cape 1.7, Mpumalanga 1.6, Kwazulu Natal 0.6, North West 0.3, Free State 0.2; solar GW: North West 20.7, Mpumalanga 1.4, Kwazulu Natal 0.9; lithium GW: North West 4.9, Hydra Central 1.4, Northern Cape 1.3, Free State 0.1, Eastern Cape 0.1; open cycle GW: Kwazulu Natal 0.67
| 2035, 2025 | drop one circuit with TDP, corridors at R10,000, integration charge removed | 3 h | 22.7 (27.2) | 15.7 (17.7) | 6.9, 23.6 (8.8, 38.2) | 0.00 (0.00) | 5,915 | 83.0 (71.5) | 8.3 (9.8) | 0.3 | 77.6 | 60.8 | 138.5 |
    mix by area, wind GW: Northern Cape 10.3, Hydra Central 7.9, Eastern Cape 3.4, Kwazulu Natal 0.6, North West 0.3; solar GW: Northern Cape 12.0, North West 3.2, Western Cape 0.5; lithium GW: Northern Cape 5.4, Hydra Central 0.4, Kwazulu Natal 0.4, Eastern Cape 0.4, Free State 0.3; open cycle GW: 
| 2035, 2025 | drop one circuit with TDP, integration charge kept | 3 h | 19.9 (27.2) | 15.7 (17.7) | 6.9, 28.0 (8.8, 38.2) | 0.00 (0.00) | 0 | 91.5 (71.5) | 5.1 (9.8) | 0.9 | 85.0 | 68.3 | 153.4 |
    mix by area, wind GW: Northern Cape 10.3, Hydra Central 5.4, Eastern Cape 3.0, Kwazulu Natal 0.6, North West 0.3, Free State 0.2; solar GW: North West 10.7, Northern Cape 3.7, Western Cape 1.3; lithium GW: Northern Cape 3.3, Eastern Cape 1.2, Limpopo 1.1, Hydra Central 1.1, Gauteng 0.3; open cycle GW: 
| 2035, 2025 | no limits, integration charge kept, caps | 3 h | 22.2 (27.2) | 13.7 (17.7) | 7.0, 24.6 (8.8, 38.2) | 0.00 (0.00) | 0 | 86.1 (71.5) | 5.4 (9.8) | 0.2 | 86.7 | 63.9 | 150.6 |
    mix by area, wind GW: Northern Cape 10.3, Hydra Central 8.0, Eastern Cape 3.2, Kwazulu Natal 0.6; solar GW: Northern Cape 13.7; lithium GW: Gauteng 6.5, Eastern Cape 0.5; open cycle GW: 
| 2035, 2025 | no limits, integration charge kept | 3 h | 22.2 (27.2) | 13.7 (17.7) | 7.0, 24.6 (8.8, 38.2) | 0.00 (0.00) | 0 | 86.1 (71.5) | 5.3 (9.8) | 0.2 | 86.7 | 63.9 | 150.6 |
    mix by area, wind GW: Northern Cape 10.3, Hydra Central 8.0, Eastern Cape 3.2, Kwazulu Natal 0.6; solar GW: Northern Cape 13.7; lithium GW: Limpopo 3.8, Gauteng 2.5, Eastern Cape 0.5, Free State 0.3; open cycle GW: 
| 2035, 2025 | no limits, integration charge kept | 6 h | 21.8 (27.2) | 14.2 (17.7) | 3.7, 22.4 (8.8, 38.2) | 0.00 (0.00) | 0 | 85.5 (71.5) | 4.8 (9.8) | 2.3 | 84.6 | 63.2 | 148.0 |
    mix by area, wind GW: Northern Cape 10.3, Hydra Central 7.9, Eastern Cape 2.9, Kwazulu Natal 0.6; solar GW: Northern Cape 14.2; lithium GW: Gauteng 3.7; open cycle GW: 
| 2040, 2015 | no limits, integration charge kept | 3 h | 31.5 (40.7) | 33.5 (24.8) | 11.1, 68.1 (11.0, 60.9) | 1.75 (4.34) | 0 | 52.1 (49.0) | 14.4 (20.2) | 0.0 | 144.1 | 49.0 | 193.1 |
    mix by area, wind GW: Hydra Central 11.3, Northern Cape 10.3, Eastern Cape 6.1, Mpumalanga 2.7, Kwazulu Natal 0.6, North West 0.3; solar GW: Western Cape 15.6, Limpopo 14.6, Free State 2.4, Northern Cape 1.0; lithium GW: Western Cape 5.2, Limpopo 3.4, Northern Cape 1.8, Hydra Central 0.8; open cycle GW: Kwazulu Natal 1.55, Gauteng 0.21
| 2040, 2025 | drop one circuit, corridors at R10,000, integration charge removed | 3 h | 26.9 (40.7) | 40.3 (24.8) | 14.4, 98.4 (11.0, 60.9) | 0.00 (4.34) | 20,088 | 46.7 (45.5) | 13.6 (22.1) | 3.4 | 123.9 | 38.7 | 162.9 |
    mix by area, wind GW: Northern Cape 10.3, Hydra Central 7.7, Eastern Cape 6.2, Mpumalanga 1.4, Kwazulu Natal 0.6, North West 0.3, Free State 0.2, Gauteng 0.1; solar GW: Northern Cape 25.3, Limpopo 7.9, North West 6.5, Mpumalanga 0.6; lithium GW: Northern Cape 10.6, North West 2.4, Hydra Central 0.6, Limpopo 0.3, Free State 0.3, Gauteng 0.1; open cycle GW: 
| 2040, 2025 | drop one circuit, integration charge kept | 3 h | 16.4 (40.7) | 52.1 (24.8) | 18.5, 115.4 (11.0, 60.9) | 1.87 (4.34) | 0 | 67.7 (45.5) | 16.1 (22.1) | 0.0 | 149.4 | 59.7 | 209.1 |
    mix by area, wind GW: Northern Cape 4.7, Hydra Central 4.7, Eastern Cape 3.0, Mpumalanga 2.7, Kwazulu Natal 0.6, North West 0.3, Free State 0.2, Gauteng 0.1; solar GW: North West 24.7, Limpopo 15.7, Mpumalanga 4.0, Free State 3.4, Gauteng 3.1, Kwazulu Natal 0.9, Western Cape 0.1; lithium GW: North West 7.2, Limpopo 5.8, Gauteng 2.0, Free State 1.8, Northern Cape 0.8, Hydra Central 0.5, Eastern Cape 0.3; open cycle GW: Kwazulu Natal 1.83, Mpumalanga 0.02, North West 0.02
| 2040, 2025 | drop one circuit with TDP, corridors at R10,000, integration charge removed | 3 h | 27.4 (40.7) | 39.1 (24.8) | 14.4, 96.3 (11.0, 60.9) | 0.01 (4.34) | 9,209 | 46.3 (45.5) | 14.4 (22.1) | 6.5 | 121.3 | 38.8 | 160.7 |
    mix by area, wind GW: Northern Cape 10.3, Hydra Central 9.1, Eastern Cape 6.2, Kwazulu Natal 0.6, Mpumalanga 0.5, North West 0.3, Free State 0.2, Gauteng 0.1; solar GW: Northern Cape 24.2, North West 10.0, Limpopo 4.8; lithium GW: Northern Cape 10.6, North West 3.2, Free State 0.5, Limpopo 0.1, Eastern Cape 0.1; open cycle GW: Kwazulu Natal 0.01
| 2040, 2025 | no limits, integration charge kept | 3 h | 29.1 (40.7) | 31.9 (24.8) | 13.2, 87.1 (11.0, 60.9) | 1.08 (4.34) | 0 | 49.1 (45.5) | 10.5 (22.1) | 2.8 | 139.0 | 42.5 | 181.7 |
    mix by area, wind GW: Hydra Central 11.2, Northern Cape 10.3, Eastern Cape 6.2, Kwazulu Natal 0.6, North West 0.3, Free State 0.2, Mpumalanga 0.2, Gauteng 0.1; solar GW: Northern Cape 31.9; lithium GW: Gauteng 10.1, Limpopo 1.5, Free State 1.4, Eastern Cape 0.2; open cycle GW: Western Cape 1.08
The cost column is the sum of its components, not the objective PyPSA reports: in the no-limits cases that objective is R0.6bn lower, because the R0.01 per MWh tie-breaking cost on the bidirectional corridors rewards flow in the negative direction and the LP circulates it round every loop of the unlimited network; no bus balance, dispatch or mix changes (the 718 (f) caveats).

Reading (the run on build 2026-11-05f; the LP in 3-hour blocks, weather year 2025; the 2040 priced-corridor, capped, weather-2015, full-TDP and fixed-corridor 2040 cases were still in the queue when this was written and are filled in as they land).

Control (no limits, the integration charge kept, the run's own costs and commitment floor). In 2035 the LP builds 22.2 GW of wind against the run's 27.2, 13.7 GW of solar against 17.7 and 7.0 GW / 25 GWh of lithium against 8.8 / 38, no open cycle (the run none), and runs coal at 86 TWh against the engine's 71.5, curtailing 5.3 TWh against 9.8; cost R150.6bn a year (new build R86.7bn, fuel and carbon R63.9bn). The run's own mix on the same blocks and costs (the fixed-build 3-hour case) costs R52.2bn of fuel and carbon plus R110.0bn of annuities, R162.2bn, so the single-year LP is R11.6bn a year (7.1%) cheaper in the 2035 year by building 5 GW less wind, 4 GW less solar and 2 GW less lithium. In 2040 the gap widens: 29.1 GW of wind against 40.7, 31.9 GW of solar against 24.8, 13.2 GW / 87 GWh of lithium against 11.0 / 61 and 1.1 GW of open cycle against 4.3; coal 49 TWh against 45.5, curtailment 10.5 against 22.1; cost R181.7bn against R197.8bn for the run's mix on the same blocks (R37.5bn of fuel and carbon plus R160.3bn of annuities at the 2040 costs), R16.1bn a year (8.1%).

The gap, and what the checks say. (1) Not the build-rate cap or foresight on costs: the pathway builds wind at its annual cap every year from 2028 to 2038 on the way to 40.7 GW in 2040, but the LP at 2040 costs (wind R2.28m per MW-year, 9% below 2035; solar R1.43m, 11% below) still chooses 29 GW, and takes more solar and lithium and less open cycle instead; a binding pace cap would show as the LP wanting more wind than the run, not less. What does bind in 2040 is the LP's own siting cap: new wind and solar in each area are capped at the area's approved capacity (the REEA records the siting of (e) uses), and the LP's 29 GW is where the three best wind areas run out (Northern Cape 10.3 GW and Eastern Cape 6.2 at their caps, Hydra Central 11.2 of 11.7; capacity factors 0.37 to 0.40 in the regional series); the next wind is the Western Cape's 17.8 GW at 0.33, which the LP declines in favour of solar and lithium. The national model's marginal wind carries the national series, so part of the 2040 gap is the LP's per-area profiles and caps, which the national model does not have. In 2035 the LP leaves 3.7 GW of Hydra Central and 3 GW of Eastern Cape capacity unused, so there the 22 GW is a choice, not a cap. (2) Not the national caps (31.9 GW of wind, 21.3 of solar and 10.2 of lithium in 2035): the LP's choice sits below each of them, and the capped case, run, returns the same mix and the same R150.6bn to the rand (only the lithium's siting between Gauteng and Limpopo, to which the LP is indifferent, differs). (3) Not the block length: the 6-hour control chose 21.8 GW of wind and 14.2 of solar, the 3-hour 22.2 and 13.7; blocks move lithium (3.7 GW at 6 h, 7.0 at 3 h), not wind. (4) Left, and not testable with this LP: the pathway's adequacy standard, 20 GWh of unserved energy on 20 weather years at the K = 20 check, where the LP sees one weather year at the value of lost load (its controls leave 0.2 and 2.8 GWh unserved); the pathway's 25 clustered plus 12 extreme days against the LP's whole year in blocks, which weight the winter evenings differently; and the coupling of the one pathway LP across years, in which capacity built for 2040's demand (15% above 2035's) and for the standard is counted in 2035's mix. The weather-2015 controls (below) say how far one weather year moves the choice: 0.5 GW of wind in 2035, 2.4 GW in 2040. On the LP's accounting the R11 to 16bn a year is an upper bound on what the standard, the day weighting and the coupling together cost in those two years, and it is the figure to carry to the discussion of the standard after the note; it is not a network cost.

Corridors priced (the integration charge removed, corridors extendable at R10,000 per MW-km from one circuit dropped). 2035: the LP builds 22.5 GW of wind, 15.6 of solar, 6.6 GW / 23 GWh of lithium and 14.4 GW of corridor (North West to Northern Cape 8.0 GW, Eastern Cape to KwaZulu-Natal 5.2, Free State to Northern Cape 1.2) for R2.35bn a year; coal 84 TWh, curtailment 7.4, unserved 1 GWh; cost R140.4bn. Against the control the mix barely moves (2 GW more solar, 0.4 GW less lithium, 3 GW of wind shifted from Hydra Central to the Eastern Cape). On the same accounting the control's mix without the charge costs R137.6bn, so the network costs R2.8bn a year in this framing: the corridors R2.35bn and the rest dispatch. The explicit inter-area cost replaces an integration charge of R15.6bn (R364 per kW-year on 42.9 GW), which is the charge's job: it stands for the within-area grid as well, which this LP does not carry, so the two are not the same thing and the difference is not a saving. The 14.4 GW is half the 26.5 GW the fixed-build case of (d) built, because the LP that can also choose the mix puts 5 GW of solar in the North West beside the load instead of carrying it. 2040: the LP builds 26.9 GW of wind (Northern Cape 10.3, Hydra Central 7.7, Eastern Cape 6.2, Mpumalanga 1.4), 40.3 GW of solar (Northern Cape 25.3, Limpopo 7.9, North West 6.5), 14.4 GW / 98 GWh of lithium (Northern Cape 10.6, North West 2.4), no open cycle, and 20.1 GW of corridor (North West to Northern Cape 10.7 GW, Eastern Cape to KwaZulu-Natal 5.7, Free State to Northern Cape 1.7, Hydra Central to Northern Cape 1.0) for R3.35bn a year; coal 47 TWh, curtailment 13.6, unserved 3 GWh; cost R162.9bn against the control's R159.5bn without the charge, so the network costs R3.4bn a year in 2040, nearly all of it the corridors. Against the control the LP trades 2 GW of wind and the 1.1 GW of open cycle for 8 GW more solar and 1 GW more lithium, in the Northern Cape beside the wind, and carries it out on the Karoo exit; the 20.1 GW is just over half the 35 to 38 GW the fixed-build case of 722 (a) built for 2040. With the plan's 22 inter-area lines in place first (the full-TDP start, 2035), the LP builds 5.9 GW of corridor beyond them (North West to Northern Cape 2.8, Free State to Northern Cape 2.0, Eastern Cape to KwaZulu-Natal 1.1) for R0.85bn a year, the mix within 0.3 GW of the control's, cost R138.5bn: the plan's lines take the 2035 network cost in this framing from R2.8bn to R1.0bn a year and the corridor build from 14.4 to 5.9 GW, and what the LP adds beyond the plan is a second Karoo exit and the Free State to Northern Cape link.

Today's corridors as a hard limit (the integration charge kept, corridors fixed at one circuit dropped). The LP moves the build from Cape wind to North West solar and storage: 12.4 GW of wind (Northern Cape 4.3, Hydra Central 3.6, Eastern Cape 1.7, Mpumalanga 1.6), 23.1 GW of solar (North West 20.7), 7.8 GW / 44 GWh of lithium (North West 4.9) and 0.7 GW of open cycle in KwaZulu-Natal; coal 105 TWh, 19 above the control; cost R163.8bn, R13.2bn a year above the control. So in the mix framing the network cost of today's corridors is R13bn a year and a different build; with corridors buildable at R10,000 per MW-km it is R2.8bn and the control's build. 2040: the same move, larger. The LP builds 16.4 GW of wind (Northern Cape 4.7, Hydra Central 4.7, Eastern Cape 3.0, Mpumalanga 2.7), 52.1 GW of solar (North West 24.7, Limpopo 15.7, Mpumalanga 4.0 and Gauteng 3.1, each the whole of the area's approved capacity, Free State 3.4), 18.5 GW / 115 GWh of lithium (North West 7.2, Limpopo 5.8, Gauteng 2.0) and 1.9 GW of open cycle in KwaZulu-Natal, against the control's 29.1, 31.9, 13.2 GW / 87 GWh and 1.1; coal 68 TWh, 19 above the control; curtailment 16 TWh; cost R209.1bn, R27.4bn a year above the control's R181.7bn. Every approved solar record in the coal provinces and the North West is filled, so the 2040 figure rests on those records as much as on the corridor table; with more approved capacity there the LP would move further and the gap would be smaller, with less it would be larger.

The plan's lines as a fixed network (the full TDP's 22 inter-area lines at one circuit dropped, corridors fixed, the integration charge kept; 2035): 19.9 GW of wind (Northern Cape 10.3, Hydra Central 5.4, Eastern Cape 3.0), 15.7 GW of solar (North West 10.7, Northern Cape 3.7), 6.9 GW / 28 GWh of lithium; coal 92 TWh, curtailment 5.1, unserved 1 GWh; cost R153.4bn, R2.8bn a year above the control, against R13.2bn on today's corridors. On this framing the plan's inter-area lines take the 2035 network cost from R13bn to R3bn a year, the same R3bn the LP reaches from today's network by buying 14.4 GW of corridor itself, and with the lines in place it buys 5.9 GW more and gets to R1bn. For 2040 the same case (the plan's lines first, corridors priced) builds 9.2 GW beyond them (North West to Northern Cape 4.9, Eastern Cape to KwaZulu-Natal 2.1, Free State to Northern Cape 2.1) for R1.41bn a year, with 27.4 GW of wind, 39.1 of solar and 14.4 GW / 96 GWh of lithium; cost R160.7bn against the control's R159.5bn without the charge, so the plan's lines take the 2040 network cost in this framing from R3.4bn to R1.2bn a year and the corridor build from 20.1 to 9.2 GW.

Weather year 2015 (the controls; the priced-corridor cases on weather 2015 are in the queue). 2035: the LP builds 22.7 GW of wind (22.2 on weather 2025; Northern Cape 10.3, Hydra Central 8.9, Eastern Cape 1.9), 12.8 GW of solar (13.7), now in the Western Cape (8.5 GW) rather than the Northern Cape, and 6.6 GW / 27 GWh of lithium (7.0 / 25); coal 91 TWh against the engine's 76, curtailment 3.7 against 9.0; cost R154.2bn against R165.4bn for the run's mix on the same blocks (R55.4bn of fuel and carbon plus R110.0bn of annuities), R11.2bn a year (6.8%). 2040: 31.5 GW of wind (29.1; Hydra Central 11.3, Northern Cape 10.3, Eastern Cape 6.1, Mpumalanga 2.7, the last at its cap), 33.5 GW of solar (31.9; Western Cape 15.6 at its cap, Limpopo 14.6), 11.1 GW / 68 GWh of lithium (13.2 / 87) and 1.8 GW of open cycle (1.1); coal 52 TWh against 49, curtailment 14.4 against 20.2; cost R193.1bn against R205.3bn (R45.0bn plus R160.3bn), R12.2bn a year (5.9%). So one weather year moves the LP's wind by 0.5 GW in 2035 and 2.4 GW in 2040, moves the solar's siting more than its size, and moves the gap between R11bn and R16bn a year; the wind choice, 22 to 23 GW in 2035 and 29 to 32 in 2040 against the run's 27 and 41, is not a weather-year accident. The 2040 state on weather 2015 is the first full-year case run on the corrected script: its objective and its component sum agree to R2m, the tie-breaking cent on 229 TWh of real corridor flow.

Caveats. New wind and solar are capped per area at the approved capacity (50 GW of wind, 138 GW of solar in all), which binds the 2040 wind as above; no within-area limits, so the North West solar the LP sites beside the load is unconstrained inside the area; 3-hour blocks understate curtailment and the lithium value where a peak is shorter than a block; one weather year; the LP's objective carries no within-area grid cost where corridors are priced; the engine's commitment floor on coal applies to the standing fleet in every case; the run's costs are the dump's for the year (2035 and 2040 differ by the engine's learning). Cost, throughout, is the sum of new-build annuities, corridor annuities, fuel and carbon and unserved energy at the value of lost load (R87,000 per MWh), not the objective PyPSA reports: in the no-limits cases that objective is R0.6bn lower, because the R0.01 per MWh tie-breaking cost on the bidirectional corridors rewards flow in the negative direction, and with a million megawatts of capacity the LP circulates it round every loop (19 of the 21 corridors carry it in most hours). The circulation changes no bus balance and so no dispatch, curtailment or mix, the binding-hour and shadow-price columns come from the duals and do not see it, and the limited cases carry at most a few million rand of it; it is a fault in the scratch script all the same. Fixed at 07:06 SAST on 6 Nov 2026 (pypsa_net.py: every corridor a pair of one-way links tied by a constraint, the capital cost on one of them; the old script kept as pypsa_net_v1.py): on three 25-day checks of the 2035 state (the no-limits free mix, the extendable fixed build and the extendable free mix; docs/regional-audit/results/v2check/) the two scripts agree on every capacity, corridor, fuel and unserved figure, the corridor flow falls from 9,794 to 12 TWh in the no-limits case, and the objective rises by R0.616bn there and by R0.005bn in the limited cases. Queue cases started after the switch carry a script field and ran the corrected script; the 2040 weather-2015 control is the full-year check on a control (objective and component sum equal to R2m), and the full-year check on an extendable case follows when a solver slot is free.

### 718 (g): the demand split

- 2035, 2025, 0.7: curtailed 68.1 TWh with BLD_LOAD_SHARE against 71.0 with the file's shares; unserved 511.5 against 704.8 GWh; coal 126.6 against 128.9; binding: North West to Northern Cape (8141 h, R54.8m); North West to Western Cape (7995 h, R54.3m); Free State to Northern Cape (7844 h, R53.7m); Free State to Hydra Central (7671 h, R52.2m); Eastern Cape to Kwazulu Natal (6723 h, R39.8m); Eastern Cape to Free State (6215 h, R39.2m)
- 2035, 2025, drop one circuit: curtailed 66.9 TWh with BLD_LOAD_SHARE against 67.9 with the file's shares; unserved 426.3 against 474.2 GWh; coal 125.4 against 126.5; binding: North West to Northern Cape (8220 h, R50.6m); Free State to Northern Cape (8220 h, R50.2m); North West to Western Cape (7844 h, R49.2m); Free State to Hydra Central (7810 h, R47.8m); Eastern Cape to Kwazulu Natal (6576 h, R37.0m); Eastern Cape to Free State (6458 h, R36.7m)
- 2035, 2025, no limits: curtailed 3.1 TWh with BLD_LOAD_SHARE against 3.1 with the file's shares; unserved 0.0 against 0.0 GWh; coal 62.9 against 62.9; binding:

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

| year, weather year | coal, engine | LP free | LP, engine commitment floor | LP, engine coal fixed | curtailed, engine | free | floor | fixed | storage discharge, engine | free | floor | fixed |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2035, 2025 | 71.5 | 62.9 | 74.2 | 71.5 | 9.8 | 3.1 | 12.7 | 14.0 | 18.5 | 10.3 | 17.4 | 16.7 |
| 2035, 2015 | 76.0 | 68.5 | 78.6 | 76.0 | 9.0 | 2.8 | 11.4 | 13.0 | 18.0 | 10.5 | 16.8 | 16.5 |
| 2040, 2025 | 45.5 | 36.9 | 46.9 | 45.5 | 22.1 | 13.1 | 22.1 | 23.6 | 24.9 | 23.4 | 26.5 | 26.6 |
| 2040, 2015 | 49.0 | 41.7 | 51.1 | 49.0 | 20.2 | 11.5 | 20.0 | 21.1 | 24.5 | 23.8 | 26.0 | 26.0 |

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
| 2035, 2025 | today's limits as drawn (N-0) | +51.6 | +45.2 | +6.5 | +1.5 | +51.3 | +0.0 | +0.19 | -0.5 | +37.0 | North West to Northern Cape (7464 h, R6.8m); North West to Western Cape (7460 h, R6.8m); Eastern Cape to Kwazulu Natal (6848 h, R5.9m); Free State to Mpumalanga (6862 h, R5.9m); Free State to North West (6862 h, R5.9m); Free State to Gauteng (6862 h, R5.9m) |
| 2035, 2025 | 0.85 x today | +59.6 | +50.3 | +9.3 | +163.6 | +58.9 | +0.0 | +0.46 | -0.0 | +44.0 | North West to Western Cape (7908 h, R38.3m); North West to Northern Cape (7920 h, R37.7m); Free State to Kwazulu Natal (7341 h, R33.0m); Free State to Mpumalanga (7323 h, R32.7m); Free State to North West (7323 h, R32.7m); Free State to Gauteng (7323 h, R32.7m) |
| 2035, 2025 | N-1 (0.7 x today) | +68.0 | +55.4 | +12.6 | +704.8 | +66.0 | +0.0 | +1.30 | +0.6 | +54.2 | Free State to Kwazulu Natal (8209 h, R69.6m); Eastern Cape to Kwazulu Natal (7474 h, R68.4m); North West to Northern Cape (8330 h, R63.6m); North West to Western Cape (8327 h, R63.5m); Free State to Mpumalanga (7732 h, R52.1m); Free State to North West (7732 h, R52.1m) |
| 2035, 2025 | N-1, one circuit dropped | +64.8 | +53.3 | +11.6 | +474.2 | +63.6 | +0.0 | +0.66 | -0.0 | +48.6 | North West to Western Cape (8036 h, R55.0m); North West to Northern Cape (8130 h, R55.0m); Eastern Cape to Kwazulu Natal (6809 h, R38.2m); Free State to Northern Cape (4680 h, R32.1m); Free State to Hydra Central (4505 h, R30.1m); Free State to Kwazulu Natal (5486 h, R23.0m) |
| 2035, 2025 | N-1 with TDP lines by year | +36.0 | +33.0 | +3.0 | +0.0 | +35.5 | +0.0 | +0.04 | -2.6 | +25.0 | Eastern Cape to Kwazulu Natal (6122 h, R4.4m); North West to Northern Cape (6124 h, R4.3m); North West to Western Cape (6123 h, R4.3m); Free State to Northern Cape (6068 h, R4.1m); Free State to Hydra Central (6067 h, R4.1m); Eastern Cape to Free State (6063 h, R4.1m) |
| 2035, 2025 | one circuit dropped, with TDP lines by year | +35.1 | +32.4 | +2.7 | +0.0 | +34.6 | +0.0 | +0.01 | -3.1 | +24.2 | Eastern Cape to Kwazulu Natal (6009 h, R4.2m); North West to Northern Cape (6014 h, R4.2m); North West to Western Cape (6011 h, R4.2m); Free State to Northern Cape (5992 h, R4.1m); Free State to Hydra Central (5989 h, R4.1m); Eastern Cape to Free State (5986 h, R4.1m) |
| 2035, 2025 | N-1 (0.7 x today), losses 6%/1,000 km | +67.9 | +57.6 | +10.3 | +816.2 | +67.1 | +0.0 | +1.72 | -0.1 | +57.6 | Eastern Cape to Kwazulu Natal (7632 h, R78.5m); Free State to Kwazulu Natal (8709 h, R74.6m); North West to Northern Cape (8754 h, R74.1m); North West to Western Cape (8323 h, R69.7m); Free State to Gauteng (8741 h, R56.2m); Free State to North West (8718 h, R56.1m) |
| 2035, 2025 | N-1 (0.7 x today), fleet siting | +74.6 | +60.6 | +13.9 | +1263.5 | +71.0 | +0.0 | +2.41 | +0.5 | +64.6 | Eastern Cape to Kwazulu Natal (8342 h, R126.8m); North West to Western Cape (8248 h, R104.4m); North West to Northern Cape (8247 h, R104.3m); Free State to Kwazulu Natal (7962 h, R81.7m); Free State to Mpumalanga (6027 h, R55.1m); Free State to North West (6027 h, R55.1m) |
| 2035, 2025 | N-1 (0.7 x today), engine commitment floor | +58.3 | +49.8 | +8.6 | +704.8 | +54.7 | +0.0 | +1.30 | -6.5 | +46.3 | Free State to Kwazulu Natal (8209 h, R69.6m); Eastern Cape to Kwazulu Natal (7474 h, R68.4m); North West to Northern Cape (8330 h, R63.6m); North West to Western Cape (8327 h, R63.5m); Free State to Mpumalanga (7732 h, R52.1m); Free State to North West (7732 h, R52.1m) |
| 2035, 2015 | today's limits as drawn (N-0) | +45.8 | +40.2 | +5.6 | +0.0 | +45.7 | +0.0 | +0.07 | -0.0 | +32.4 | North West to Western Cape (7062 h, R5.6m); North West to Northern Cape (7033 h, R5.6m); Eastern Cape to Kwazulu Natal (6436 h, R5.0m); Free State to Kwazulu Natal (6259 h, R4.6m); Free State to Mpumalanga (6255 h, R4.6m); Free State to North West (6255 h, R4.6m) |
| 2035, 2015 | 0.85 x today | +53.4 | +45.3 | +8.1 | +26.7 | +53.1 | +0.0 | +0.42 | +0.8 | +39.7 | North West to Western Cape (7697 h, R20.7m); North West to Northern Cape (7697 h, R20.6m); Eastern Cape to Kwazulu Natal (6808 h, R19.2m); Free State to Kwazulu Natal (6900 h, R19.0m); Free State to Mpumalanga (6853 h, R18.6m); Free State to North West (6853 h, R18.6m) |
| 2035, 2015 | N-1 (0.7 x today) | +61.7 | +50.4 | +11.3 | +561.1 | +59.1 | +0.0 | +2.33 | +1.3 | +55.8 | Free State to Kwazulu Natal (8157 h, R135.4m); Eastern Cape to Kwazulu Natal (7392 h, R133.8m); North West to Northern Cape (8239 h, R112.4m); North West to Western Cape (8230 h, R112.2m); Free State to Mpumalanga (7478 h, R100.9m); Free State to North West (7478 h, R100.9m) |
| 2035, 2015 | N-1, one circuit dropped | +58.6 | +48.3 | +10.3 | +197.1 | +57.4 | +0.0 | +1.16 | +0.9 | +47.3 | North West to Northern Cape (8071 h, R56.9m); North West to Western Cape (7931 h, R56.3m); Eastern Cape to Kwazulu Natal (6611 h, R46.8m); Free State to Northern Cape (4418 h, R32.3m); Free State to Hydra Central (4204 h, R31.5m); Free State to Kwazulu Natal (5427 h, R25.3m) |
| 2035, 2015 | N-1 with TDP lines by year | +31.4 | +28.8 | +2.6 | +0.0 | +31.1 | +0.0 | -0.00 | -2.3 | +21.7 | Eastern Cape to Kwazulu Natal (5592 h, R3.8m); North West to Northern Cape (5586 h, R3.8m); North West to Western Cape (5586 h, R3.8m); Free State to Hydra Central (5508 h, R3.7m); Free State to Northern Cape (5508 h, R3.7m); Eastern Cape to Free State (5508 h, R3.7m) |
| 2035, 2015 | one circuit dropped, with TDP lines by year | +30.6 | +28.3 | +2.3 | +0.0 | +30.2 | +0.0 | -0.00 | -2.7 | +21.1 | North West to Northern Cape (5479 h, R3.8m); North West to Western Cape (5479 h, R3.8m); Eastern Cape to Kwazulu Natal (5479 h, R3.8m); Free State to Hydra Central (5433 h, R3.7m); Free State to Northern Cape (5433 h, R3.7m); Eastern Cape to Free State (5433 h, R3.7m) |
| 2040, 2025 | today's limits as drawn (N-0) | +91.9 | +77.9 | +14.0 | +2632.1 | +62.9 | +22.0 | +2.70 | -6.5 | +107.2 | North West to Northern Cape (8541 h, R198.0m); North West to Western Cape (8544 h, R197.9m); Free State to Mpumalanga (8460 h, R196.8m); Free State to North West (8460 h, R196.8m); Free State to Gauteng (8460 h, R196.8m); Free State to Kwazulu Natal (8460 h, R196.8m) |
| 2040, 2025 | 0.85 x today | +100.8 | +83.0 | +17.8 | +5191.3 | +63.0 | +27.4 | +3.21 | -7.9 | +121.9 | North West to Northern Cape (8682 h, R257.0m); North West to Western Cape (8683 h, R256.9m); Free State to Mpumalanga (8650 h, R256.2m); Free State to North West (8650 h, R256.2m); Free State to Gauteng (8650 h, R256.2m); Free State to Kwazulu Natal (8650 h, R256.2m) |
| 2040, 2025 | N-1 (0.7 x today) | +110.0 | +88.2 | +21.7 | +8388.7 | +63.0 | +32.0 | +4.43 | -8.9 | +139.1 | North West to Northern Cape (8759 h, R308.6m); North West to Western Cape (8759 h, R308.5m); Free State to Kwazulu Natal (8759 h, R308.0m); Free State to Mpumalanga (8759 h, R308.0m); Free State to North West (8759 h, R308.0m); Free State to Gauteng (8759 h, R308.0m) |
| 2040, 2025 | N-1, one circuit dropped | +105.8 | +85.3 | +20.5 | +6906.2 | +63.0 | +30.0 | +3.83 | -8.6 | +131.2 | North West to Northern Cape (8701 h, R291.3m); North West to Western Cape (8659 h, R290.0m); Eastern Cape to Kwazulu Natal (7932 h, R265.6m); Free State to Mpumalanga (7124 h, R136.8m); Free State to North West (7124 h, R136.8m); Free State to Gauteng (7124 h, R136.8m) |
| 2040, 2025 | N-1 with TDP lines by year | +71.4 | +62.9 | +8.5 | +201.0 | +57.3 | +11.7 | +0.75 | -5.3 | +69.4 | North West to Northern Cape (7583 h, R48.5m); North West to Western Cape (7579 h, R48.4m); Eastern Cape to Kwazulu Natal (7566 h, R48.2m); Free State to Northern Cape (7572 h, R48.1m); Free State to Hydra Central (7561 h, R47.9m); Eastern Cape to Free State (7544 h, R47.8m) |
| 2040, 2025 | one circuit dropped, with TDP lines by year | +70.2 | +62.2 | +8.0 | +148.2 | +56.8 | +11.1 | +0.69 | -5.5 | +67.5 | North West to Northern Cape (7535 h, R32.6m); North West to Western Cape (7522 h, R32.5m); Free State to Northern Cape (7533 h, R32.5m); Eastern Cape to Kwazulu Natal (7508 h, R32.2m); Free State to Hydra Central (7511 h, R32.2m); Eastern Cape to Free State (7502 h, R32.1m) |
| 2040, 2025 | N-1 (0.7 x today), engine commitment floor | +101.0 | +82.3 | +18.6 | +8388.7 | +53.0 | +32.0 | +4.43 | -12.1 | +132.1 | North West to Northern Cape (8759 h, R308.6m); North West to Western Cape (8759 h, R308.5m); Free State to Kwazulu Natal (8759 h, R308.0m); Free State to Mpumalanga (8759 h, R308.0m); Free State to North West (8759 h, R308.0m); Free State to Gauteng (8759 h, R308.0m) |
| 2040, 2015 | today's limits as drawn (N-0) | +84.1 | +71.3 | +12.8 | +1279.4 | +53.3 | +25.5 | +2.69 | -5.0 | +107.9 | North West to Western Cape (8564 h, R171.8m); North West to Northern Cape (8559 h, R171.3m); Free State to North West (8387 h, R161.9m); Free State to Mpumalanga (8387 h, R161.9m); Free State to Gauteng (8387 h, R161.9m); Free State to Kwazulu Natal (8387 h, R161.9m) |
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
| 2035, 2025 | as drawn | 114.2 | 0.0 | 0.38 | 66.3 (0.0) | 45.0 | 7.9 | 0.0, 0.0 | 1.9 | 54.7 (47.3, 7.4, 0.0) | 2 | - | North West to Northern Cape (7464 h, R6.8m); North West to Western Cape (7460 h, R6.8m); Eastern Cape to Kwazulu Natal (6848 h, R5.9m); Free State to Mpumalanga (6862 h, R5.9m); Free State to North West (6862 h, R5.9m) |
| 2035, 2025 | 0.7 | 128.9 | 0.0 | 1.49 | 56.1 (0.0) | 38.9 | 8.5 | 0.0, 0.0 | 2.4 | 71.0 (57.6, 13.4, 0.0) | 705 | - | Free State to Kwazulu Natal (8209 h, R69.6m); Eastern Cape to Kwazulu Natal (7474 h, R68.4m); North West to Northern Cape (8330 h, R63.6m); North West to Western Cape (8327 h, R63.5m); Free State to Mpumalanga (7732 h, R52.1m) |
| 2035, 2025 | 0.7 (extendable at R10,000/MW-km) | 63.5 | 0.0 | 0.19 | 110.3 (0.0) | 51.9 | 7.8 | 0.0, 0.0 | 2.1 | 3.8 (3.3, 0.4, 0.0) | 0 | 28,072, 4.67 | none over 4,000 h |
| 2035, 2025 | 0.7 (extendable at R21,700/MW-km) | 64.7 | 0.0 | 0.19 | 108.9 (0.0) | 52.1 | 7.7 | 0.0, 0.0 | 1.9 | 5.1 (4.8, 0.3, 0.0) | 0 | 24,164, 8.96 | none over 4,000 h |
| 2035, 2025 | one circuit dropped | 126.5 | 0.0 | 0.85 | 58.2 (0.0) | 39.9 | 8.3 | 0.0, 0.0 | 2.0 | 67.9 (55.4, 12.4, 0.0) | 474 | - | North West to Western Cape (8036 h, R55.0m); North West to Northern Cape (8130 h, R55.0m); Eastern Cape to Kwazulu Natal (6809 h, R38.2m); Free State to Northern Cape (4680 h, R32.1m); Free State to Hydra Central (4505 h, R30.1m) |
| 2035, 2025 | one circuit dropped (extendable at R10,000/MW-km) | 63.5 | 0.0 | 0.19 | 110.3 (0.0) | 51.9 | 7.8 | 0.0, 0.0 | 2.1 | 3.8 (3.4, 0.4, 0.0) | 0 | 26,485, 4.43 | none over 4,000 h |
| 2035, 2025 | one circuit dropped (extendable at R21,700/MW-km) | 64.6 | 0.0 | 0.19 | 109.0 (0.0) | 52.0 | 7.7 | 0.0, 0.0 | 1.9 | 5.0 (4.6, 0.4, 0.0) | 0 | 23,723, 8.53 | none over 4,000 h |
| 2035, 2025 | one circuit dropped, full TDP | 78.5 | 0.0 | 0.19 | 95.0 (0.0) | 51.7 | 5.0 | 0.0, 0.0 | 1.7 | 19.3 (18.7, 0.6, 0.0) | 0 | - | none over 4,000 h |
| 2035, 2025 | one circuit dropped, full TDP (extendable at R10,000/MW-km) | 63.4 | 0.0 | 0.19 | 110.4 (0.0) | 51.9 | 7.9 | 0.0, 0.0 | 2.1 | 3.7 (3.3, 0.4, 0.0) | 0 | 11,699, 1.73 | none over 4,000 h |
| 2035, 2015 | no limits | 68.5 | 0.0 | 0.16 | 105.5 (0.0) | 51.6 | 8.4 | 0.0, 0.0 | 2.2 | 2.8 (1.9, 1.0, 0.0) | 0 | - | none over 4,000 h |
| 2035, 2015 | as drawn | 114.3 | 0.0 | 0.24 | 65.3 (0.0) | 46.0 | 8.4 | 0.0, 0.0 | 2.1 | 48.6 (42.1, 6.5, 0.0) | 0 | - | North West to Western Cape (7062 h, R5.6m); North West to Northern Cape (7033 h, R5.6m); Eastern Cape to Kwazulu Natal (6436 h, R5.0m); Free State to Kwazulu Natal (6259 h, R4.6m); Free State to Mpumalanga (6255 h, R4.6m) |
| 2035, 2015 | 0.7 | 127.6 | 0.0 | 2.49 | 55.2 (0.0) | 40.3 | 9.0 | 0.0, 0.0 | 2.8 | 64.5 (52.2, 12.3, 0.0) | 561 | - | Free State to Kwazulu Natal (8157 h, R135.4m); Eastern Cape to Kwazulu Natal (7392 h, R133.8m); North West to Northern Cape (8239 h, R112.4m); North West to Western Cape (8230 h, R112.2m); Free State to Mpumalanga (7478 h, R100.9m) |
| 2035, 2015 | 0.7 (extendable at R10,000/MW-km) | 69.2 | 0.0 | 0.16 | 104.3 (0.0) | 52.1 | 8.2 | 0.0, 0.0 | 2.0 | 3.6 (3.1, 0.5, 0.0) | 0 | 27,224, 4.56 | none over 4,000 h |
| 2035, 2015 | one circuit dropped | 125.9 | 0.0 | 1.32 | 57.2 (0.0) | 41.3 | 8.9 | 0.0, 0.0 | 2.6 | 61.4 (50.1, 11.3, 0.0) | 197 | - | North West to Northern Cape (8071 h, R56.9m); North West to Western Cape (7931 h, R56.3m); Eastern Cape to Kwazulu Natal (6611 h, R46.8m); Free State to Northern Cape (4418 h, R32.3m); Free State to Hydra Central (4204 h, R31.5m) |
| 2035, 2015 | one circuit dropped (extendable at R10,000/MW-km) | 69.2 | 0.0 | 0.16 | 104.2 (0.0) | 52.1 | 8.2 | 0.0, 0.0 | 2.0 | 3.6 (3.1, 0.5, 0.0) | 0 | 25,874, 4.33 | none over 4,000 h |
| 2035, 2015 | one circuit dropped, full TDP | 81.8 | 0.0 | 0.16 | 91.4 (0.0) | 51.9 | 6.0 | 0.0, 0.0 | 1.6 | 16.6 (16.0, 0.6, 0.0) | 0 | - | none over 4,000 h |
| 2040, 2025 | no limits | 36.9 | 1.8 | 0.33 | 153.2 (0.0) | 66.5 | 16.7 | 0.0, 0.2 | 6.5 | 13.1 (9.5, 3.6, 0.0) | 2 | - | none over 4,000 h |
| 2040, 2025 | as drawn | 99.8 | 23.7 | 3.02 | 75.2 (0.0) | 52.6 | 14.0 | 0.0, 0.1 | 2.8 | 105.0 (87.5, 17.6, 0.0) | 2634 | - | North West to Northern Cape (8541 h, R198.0m); North West to Western Cape (8544 h, R197.9m); Free State to Mpumalanga (8460 h, R196.8m); Free State to North West (8460 h, R196.8m); Free State to Gauteng (8460 h, R196.8m) |
| 2040, 2025 | 0.7 | 99.9 | 33.7 | 4.75 | 64.9 (0.0) | 44.8 | 11.8 | 0.0, 0.1 | 2.5 | 123.1 (97.8, 25.3, 0.0) | 8391 | - | North West to Northern Cape (8759 h, R308.6m); North West to Western Cape (8759 h, R308.5m); Free State to Kwazulu Natal (8759 h, R308.0m); Free State to Mpumalanga (8759 h, R308.0m); Free State to North West (8759 h, R308.0m) |
| 2040, 2025 | 0.7 (extendable at R10,000/MW-km) | 37.6 | 1.8 | 0.33 | 150.4 (0.0) | 68.3 | 16.3 | 0.0, 0.2 | 6.1 | 14.1 (12.3, 1.8, 0.0) | 2 | 38,431, 6.25 | none over 4,000 h |
| 2040, 2025 | 0.7 (extendable at R21,700/MW-km) | 38.8 | 1.8 | 0.33 | 148.6 (0.0) | 68.9 | 16.3 | 0.0, 0.2 | 5.8 | 15.4 (14.1, 1.3, 0.0) | 2 | 34,596, 12.38 | none over 4,000 h |
| 2040, 2025 | one circuit dropped | 99.9 | 31.7 | 4.16 | 67.8 (0.0) | 46.1 | 12.3 | 0.0, 0.1 | 2.4 | 119.0 (94.9, 24.1, 0.0) | 6908 | - | North West to Northern Cape (8701 h, R291.3m); North West to Western Cape (8659 h, R290.0m); Eastern Cape to Kwazulu Natal (7932 h, R265.6m) |
| 2040, 2025 | one circuit dropped (extendable at R10,000/MW-km) | 37.6 | 1.8 | 0.33 | 150.4 (0.0) | 68.3 | 16.3 | 0.0, 0.2 | 6.2 | 14.1 (12.3, 1.8, 0.0) | 2 | 35,678, 5.99 | none over 4,000 h |
| 2040, 2025 | one circuit dropped (extendable at R21,700/MW-km) | 38.7 | 1.8 | 0.33 | 148.6 (0.0) | 68.9 | 16.3 | 0.0, 0.2 | 5.8 | 15.4 (14.1, 1.2, 0.0) | 2 | 32,064, 11.82 | none over 4,000 h |
| 2040, 2025 | one circuit dropped, full TDP | 76.3 | 3.4 | 0.33 | 111.8 (0.0) | 65.1 | 12.8 | 0.0, 0.2 | 3.3 | 55.9 (50.9, 5.0, 0.0) | 2 | - | North West to Western Cape (6252 h, R6.2m); North West to Northern Cape (6240 h, R6.2m); Free State to Hydra Central (6221 h, R6.1m); Free State to Northern Cape (6224 h, R6.1m); Eastern Cape to Kwazulu Natal (4766 h, R4.8m) |
| 2040, 2025 | one circuit dropped, full TDP (extendable at R10,000/MW-km) | 37.5 | 1.8 | 0.33 | 150.6 (0.0) | 68.2 | 16.5 | 0.0, 0.2 | 5.9 | 14.0 (12.1, 1.9, 0.0) | 2 | 20,095, 3.07 | none over 4,000 h |
| 2040, 2015 | no limits | 41.7 | 3.6 | 0.44 | 145.7 (0.0) | 67.0 | 17.1 | 0.0, 0.2 | 6.5 | 11.5 (8.1, 3.4, 0.0) | 0 | - | none over 4,000 h |
| 2040, 2015 | as drawn | 95.1 | 29.1 | 3.13 | 74.4 (0.0) | 54.2 | 14.6 | 0.0, 0.2 | 4.0 | 95.5 (79.3, 16.2, 0.0) | 1279 | - | North West to Western Cape (8564 h, R171.8m); North West to Northern Cape (8559 h, R171.3m); Free State to North West (8387 h, R161.9m); Free State to Mpumalanga (8387 h, R161.9m); Free State to Gauteng (8387 h, R161.9m) |
| 2040, 2015 | 0.7 | 95.4 | 35.5 | 7.25 | 64.3 (0.0) | 46.3 | 12.7 | 0.0, 0.1 | 3.6 | 113.6 (89.4, 24.1, 0.0) | 7968 | - | North West to Northern Cape (8751 h, R502.0m); North West to Western Cape (8750 h, R501.8m); Free State to Kwazulu Natal (8645 h, R491.0m); Free State to Mpumalanga (8645 h, R490.9m); Free State to North West (8645 h, R490.9m) |
| 2040, 2015 | one circuit dropped | 95.4 | 34.6 | 6.63 | 66.9 (0.0) | 47.6 | 13.4 | 0.0, 0.1 | 3.7 | 109.5 (86.8, 22.8, 0.0) | 5661 | - | North West to Northern Cape (8743 h, R353.7m); North West to Western Cape (8722 h, R352.4m); Eastern Cape to Kwazulu Natal (8063 h, R319.0m); Free State to Kwazulu Natal (7742 h, R230.2m); Free State to Mpumalanga (7742 h, R230.2m) |
| 2040, 2015 | one circuit dropped (extendable at R10,000/MW-km) | 42.6 | 3.6 | 0.44 | 142.9 (0.0) | 68.7 | 16.7 | 0.0, 0.2 | 6.1 | 12.6 (10.8, 1.8, 0.0) | 0 | 34,661, 5.84 | none over 4,000 h |
| 2040, 2015 | one circuit dropped, full TDP | 76.8 | 4.6 | 0.44 | 109.3 (0.0) | 66.0 | 14.2 | 0.0, 0.2 | 3.8 | 48.8 (44.4, 4.4, 0.0) | 0 | - | North West to Western Cape (5670 h, R5.2m); Free State to Hydra Central (5659 h, R5.2m); North West to Northern Cape (5660 h, R5.2m); Free State to Northern Cape (5651 h, R5.2m); Eastern Cape to Kwazulu Natal (4226 h, R3.8m) |
    engine 2035, 2025: coal 71.5, gas 0.0, diesel 0.52, wind incl. offshore 107.8, solar 48.2, storage 18.5, curtailed 9.8, unserved 0 GWh; LP no limits: curtailed 3.1, unserved 0
    engine 2035, 2015: coal 76.0, gas 0.0, diesel 0.84, wind incl. offshore 102.0, solar 48.7, storage 18.0, curtailed 9.0, unserved 6 GWh; LP no limits: curtailed 2.8, unserved 0
    engine 2040, 2025: coal 45.5, gas 2.8, diesel 0.63, wind incl. offshore 149.1, solar 61.4, storage 24.9, curtailed 22.1, unserved 16 GWh; LP no limits: curtailed 13.1, unserved 2
    engine 2040, 2015: coal 49.0, gas 5.0, diesel 1.31, wind incl. offshore 141.6, solar 62.1, storage 24.5, curtailed 20.2, unserved 0 GWh; LP no limits: curtailed 11.5, unserved 0
    free mix, 2035, 2025, no limits, corridors at R0: wind 22.2 GW (run 27.2), solar 13.7 (17.7), lithium 7.0 GW / 25 GWh (8.8 / 38), open cycle 0.0 (0.0); corridors 0 MW, R0.00bn a year; curtailed 5.4 TWh, unserved 0 GWh; new-build R86.7bn a year, fuel and carbon R63.9bn
    free mix, 2035, 2025, no limits, corridors at R0: wind 22.2 GW (run 27.2), solar 13.7 (17.7), lithium 7.0 GW / 25 GWh (8.8 / 38), open cycle 0.0 (0.0); corridors 0 MW, R0.00bn a year; curtailed 5.3 TWh, unserved 0 GWh; new-build R86.7bn a year, fuel and carbon R63.9bn
    free mix, 2035, 2025, no limits, corridors at R0: wind 21.8 GW (run 27.2), solar 14.2 (17.7), lithium 3.7 GW / 22 GWh (8.8 / 38), open cycle 0.0 (0.0); corridors 0 MW, R0.00bn a year; curtailed 4.8 TWh, unserved 2 GWh; new-build R84.6bn a year, fuel and carbon R63.2bn
    free mix, 2035, 2025, one circuit dropped, corridors at R10,000: wind 22.5 GW (run 27.2), solar 15.6 (17.7), lithium 6.6 GW / 23 GWh (8.8 / 38), open cycle 0.0 (0.0); corridors 14,361 MW, R2.35bn a year; curtailed 7.4 TWh, unserved 1 GWh; new-build R78.5bn a year, fuel and carbon R61.8bn
    free mix, 2035, 2025, one circuit dropped, corridors at R0: wind 12.4 GW (run 27.2), solar 23.1 (17.7), lithium 7.8 GW / 44 GWh (8.8 / 38), open cycle 0.7 (0.0); corridors 0 MW, R0.00bn a year; curtailed 4.1 TWh, unserved 3 GWh; new-build R84.5bn a year, fuel and carbon R79.1bn
    free mix, 2035, 2025, one circuit dropped, full TDP, full TDP, corridors at R10,000: wind 22.7 GW (run 27.2), solar 15.7 (17.7), lithium 6.9 GW / 24 GWh (8.8 / 38), open cycle 0.0 (0.0); corridors 5,915 MW, R0.85bn a year; curtailed 8.3 TWh, unserved 0 GWh; new-build R77.6bn a year, fuel and carbon R60.8bn
    free mix, 2035, 2025, one circuit dropped, full TDP, full TDP, corridors at R0: wind 19.9 GW (run 27.2), solar 15.7 (17.7), lithium 6.9 GW / 28 GWh (8.8 / 38), open cycle 0.0 (0.0); corridors 0 MW, R0.00bn a year; curtailed 5.1 TWh, unserved 1 GWh; new-build R85.0bn a year, fuel and carbon R68.3bn
    free mix, 2035, 2015, no limits, corridors at R0: wind 22.7 GW (run 27.2), solar 12.8 (17.7), lithium 6.6 GW / 27 GWh (8.8 / 38), open cycle 0.0 (0.0); corridors 0 MW, R0.00bn a year; curtailed 3.7 TWh, unserved 3 GWh; new-build R87.1bn a year, fuel and carbon R66.9bn
    free mix, 2035, 2015, one circuit dropped, corridors at R10,000: wind 21.9 GW (run 27.2), solar 16.6 (17.7), lithium 6.2 GW / 27 GWh (8.8 / 38), open cycle 0.0 (0.0); corridors 12,932 MW, R2.16bn a year; curtailed 6.0 TWh, unserved 4 GWh; new-build R79.0bn a year, fuel and carbon R64.4bn
    free mix, 2040, 2025, no limits, corridors at R0: wind 29.1 GW (run 40.7), solar 31.9 (24.8), lithium 13.2 GW / 87 GWh (11.0 / 61), open cycle 1.1 (4.3); corridors 0 MW, R0.00bn a year; curtailed 10.5 TWh, unserved 3 GWh; new-build R139.0bn a year, fuel and carbon R42.5bn
    free mix, 2040, 2025, one circuit dropped, corridors at R10,000: wind 26.9 GW (run 40.7), solar 40.3 (24.8), lithium 14.4 GW / 98 GWh (11.0 / 61), open cycle 0.0 (4.3); corridors 20,088 MW, R3.35bn a year; curtailed 13.6 TWh, unserved 3 GWh; new-build R123.9bn a year, fuel and carbon R38.7bn
    free mix, 2040, 2025, one circuit dropped, corridors at R0: wind 16.4 GW (run 40.7), solar 52.1 (24.8), lithium 18.5 GW / 115 GWh (11.0 / 61), open cycle 1.9 (4.3); corridors 0 MW, R0.00bn a year; curtailed 16.1 TWh, unserved 0 GWh; new-build R149.4bn a year, fuel and carbon R59.7bn
    free mix, 2040, 2025, one circuit dropped, full TDP, full TDP, corridors at R10,000: wind 27.4 GW (run 40.7), solar 39.1 (24.8), lithium 14.4 GW / 96 GWh (11.0 / 61), open cycle 0.0 (4.3); corridors 9,209 MW, R1.41bn a year; curtailed 14.4 TWh, unserved 6 GWh; new-build R121.3bn a year, fuel and carbon R38.8bn
    free mix, 2040, 2015, no limits, corridors at R0: wind 31.5 GW (run 40.7), solar 33.5 (24.8), lithium 11.1 GW / 68 GWh (11.0 / 61), open cycle 1.8 (4.3); corridors 0 MW, R0.00bn a year; curtailed 14.4 TWh, unserved 0 GWh; new-build R144.1bn a year, fuel and carbon R49.0bn

Fossil-free stand-in (s_ff2040_c7, build 2026-11-03a)
| year, weather year | corridors | coal | gas | diesel | wind (offshore) | solar | lithium | flow, iron-air | pumped | curtailed (wind, solar, offshore) | unserved | corridors built MW, R bn a year | corridors with a shadow price over 4,000 h |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2035, 2025 | no limits | 0.7 | 0.0 | 0.00 | 127.7 (0.0) | 112.0 | 41.9 | 2.5, 0.0 | 4.6 | 66.3 (30.5, 35.9, 0.0) | 0 | - | none over 4,000 h |
| 2035, 2025 | as drawn | 76.4 | 0.0 | 0.00 | 64.6 (0.0) | 86.3 | 11.5 | 1.2, 0.0 | 1.2 | 155.1 (93.6, 61.5, 0.0) | 0 | - | North West to Northern Cape (8760 h, R6.0m); North West to Western Cape (8760 h, R6.0m); Free State to Kwazulu Natal (8760 h, R6.0m); Free State to Mpumalanga (8760 h, R6.0m); Free State to North West (8760 h, R6.0m) |
| 2035, 2025 | one circuit dropped | 89.9 | 0.0 | 0.00 | 56.4 (0.0) | 80.7 | 9.6 | 1.1, 0.0 | 0.9 | 169.0 (101.8, 67.2, 0.0) | 0 | - | Free State to Kwazulu Natal (8760 h, R6.1m); North West to Northern Cape (8760 h, R6.1m); North West to Western Cape (8760 h, R6.1m); Free State to Mpumalanga (8760 h, R6.1m); Free State to North West (8760 h, R6.1m) |
| 2035, 2025 | one circuit dropped (extendable at R10,000/MW-km) | 1.2 | 0.0 | 0.00 | 109.4 (0.0) | 125.3 | 44.8 | 2.0, 0.0 | 2.4 | 71.4 (48.8, 22.5, 0.0) | 0 | 22,645, 3.57 | none over 4,000 h |
| 2035, 2025 | one circuit dropped, full TDP | 13.6 | 0.0 | 0.00 | 99.7 (0.0) | 118.2 | 41.8 | 1.3, 0.0 | 1.6 | 88.1 (58.5, 29.6, 0.0) | 0 | - | North West to Northern Cape (7137 h, R4.6m); North West to Western Cape (6837 h, R4.4m); Eastern Cape to Kwazulu Natal (5222 h, R3.4m); Free State to Northern Cape (4961 h, R3.2m); Free State to Hydra Central (4573 h, R3.0m) |
| 2035, 2015 | no limits | 2.7 | 0.0 | 0.00 | 122.1 (0.0) | 113.8 | 45.5 | 2.4, 0.0 | 4.6 | 58.0 (26.0, 32.1, 0.0) | 0 | - | none over 4,000 h |
| 2035, 2015 | as drawn | 76.6 | 0.0 | 0.00 | 63.9 (0.0) | 86.8 | 12.5 | 1.3, 0.0 | 1.3 | 143.3 (84.2, 59.1, 0.0) | 0 | - | North West to Northern Cape (8760 h, R6.0m); North West to Western Cape (8760 h, R6.0m); Free State to Mpumalanga (8760 h, R6.0m); Free State to North West (8760 h, R6.0m); Free State to Gauteng (8760 h, R6.0m) |
| 2035, 2015 | one circuit dropped | 90.2 | 0.0 | 0.00 | 56.2 (0.0) | 80.5 | 10.3 | 1.1, 0.0 | 1.1 | 157.3 (92.0, 65.3, 0.0) | 0 | - | Free State to Kwazulu Natal (8760 h, R6.2m); North West to Northern Cape (8760 h, R6.2m); North West to Western Cape (8760 h, R6.2m); Free State to Mpumalanga (8760 h, R6.2m); Free State to North West (8760 h, R6.2m) |
| 2035, 2015 | one circuit dropped (extendable at R10,000/MW-km) | 3.7 | 0.0 | 0.00 | 107.2 (0.0) | 126.2 | 45.2 | 2.1, 0.0 | 2.9 | 60.6 (41.0, 19.6, 0.0) | 0 | 24,595, 3.95 | none over 4,000 h |
| 2035, 2015 | one circuit dropped, full TDP | 15.5 | 0.0 | 0.00 | 95.9 (0.0) | 120.1 | 42.9 | 1.5, 0.0 | 1.5 | 78.0 (52.2, 25.7, 0.0) | 0 | - | North West to Northern Cape (5893 h, R3.8m); North West to Western Cape (5695 h, R3.7m); Eastern Cape to Kwazulu Natal (4146 h, R2.7m) |
| 2040, 2025 | no limits | 0.0 | 0.0 | 0.00 | 151.8 (14.6) | 133.9 | 37.0 | 1.6, 0.9 | 3.6 | 207.8 (70.7, 129.2, 7.9) | 0 | - | none over 4,000 h |
| 2040, 2025 | as drawn | 0.0 | 0.0 | 0.00 | 70.0 (10.1) | 121.7 | 30.9 | 1.3, 0.0 | 0.7 | 306.3 (152.5, 141.4, 12.4) | 57578 | - | Free State to Mpumalanga (8760 h, R729.9m); Free State to Kwazulu Natal (8760 h, R729.9m); Free State to Gauteng (8760 h, R729.9m); North West to Northern Cape (8760 h, R729.8m); North West to Western Cape (8760 h, R729.8m) |
| 2040, 2025 | 0.7 | 0.0 | 0.0 | 0.00 | 61.0 (9.1) | 113.3 | 24.5 | 1.1, 0.0 | 0.5 | 324.7 (161.5, 149.8, 13.3) | 74943 | - | Free State to Kwazulu Natal (8760 h, R739.6m); Free State to Mpumalanga (8760 h, R734.5m); Free State to Gauteng (8760 h, R734.5m); North West to Northern Cape (8760 h, R732.1m); North West to Western Cape (8760 h, R732.1m) |
| 2040, 2025 | one circuit dropped | 0.0 | 0.0 | 0.00 | 62.0 (9.0) | 117.1 | 26.9 | 1.2, 0.0 | 0.5 | 320.0 (160.5, 146.1, 13.4) | 70633 | - | Free State to Kwazulu Natal (8760 h, R732.3m); Free State to Mpumalanga (8760 h, R732.3m); Free State to Gauteng (8760 h, R732.3m); North West to Northern Cape (8760 h, R732.1m); North West to Western Cape (8760 h, R732.1m) |
| 2040, 2025 | one circuit dropped (extendable at R10,000/MW-km) | 0.0 | 0.0 | 0.00 | 76.9 (21.1) | 171.9 | 65.4 | 3.5, 1.5 | 0.8 | 238.3 (145.6, 91.3, 1.4) | 0 | 19,739, 2.53 | none over 4,000 h |
| 2040, 2025 | one circuit dropped, full TDP | 0.0 | 0.0 | 0.00 | 95.7 (15.8) | 150.2 | 51.4 | 2.8, 1.2 | 3.2 | 246.5 (126.8, 112.9, 6.7) | 4170 | - | none over 4,000 h |
| 2040, 2015 | no limits | 0.0 | 0.0 | 0.00 | 144.4 (15.0) | 139.6 | 42.5 | 2.2, 1.7 | 4.2 | 191.2 (63.9, 120.0, 7.3) | 0 | - | none over 4,000 h |
| 2040, 2015 | as drawn | 0.0 | 0.0 | 0.00 | 69.1 (10.9) | 121.1 | 30.4 | 1.3, 0.0 | 0.9 | 289.2 (139.3, 138.5, 11.4) | 58110 | - | Free State to Mpumalanga (8760 h, R729.6m); Free State to Gauteng (8760 h, R729.6m); Free State to Kwazulu Natal (8760 h, R729.6m); North West to Northern Cape (8760 h, R729.5m); North West to Western Cape (8760 h, R729.5m) |
| 2040, 2015 | one circuit dropped | 0.0 | 0.0 | 0.00 | 61.4 (9.7) | 116.2 | 26.3 | 1.3, 0.0 | 0.6 | 302.9 (147.0, 143.4, 12.5) | 71194 | - | Free State to Kwazulu Natal (8760 h, R733.1m); Free State to Mpumalanga (8760 h, R733.0m); Free State to Gauteng (8760 h, R733.0m); North West to Northern Cape (8760 h, R732.3m); North West to Western Cape (8760 h, R732.3m) |
| 2040, 2015 | one circuit dropped (extendable at R10,000/MW-km) | 0.0 | 0.0 | 0.00 | 77.4 (20.7) | 175.5 | 68.0 | 3.6, 2.1 | 0.9 | 216.5 (130.9, 84.0, 1.5) | 0 | 19,971, 2.63 | none over 4,000 h |
| 2040, 2015 | one circuit dropped, full TDP | 0.0 | 0.0 | 0.00 | 93.1 (16.2) | 152.3 | 52.6 | 2.9, 1.0 | 3.7 | 228.5 (115.3, 107.3, 6.0) | 4790 | - | Free State to Mpumalanga (4141 h, R317.9m); Free State to Gauteng (4141 h, R317.9m); Free State to Kwazulu Natal (4141 h, R317.9m); North West to Northern Cape (4141 h, R317.7m); North West to Western Cape (4141 h, R317.7m) |
    engine 2035, 2025: coal 15.1, gas 0.0, diesel 0.00, wind incl. offshore 120.2, solar 96.1, storage 36.4, curtailed 87.6, unserved 0 GWh; LP no limits: curtailed 66.3, unserved 0
    engine 2035, 2015: coal 18.7, gas 0.0, diesel 0.00, wind incl. offshore 114.9, solar 98.1, storage 40.3, curtailed 77.2, unserved 0 GWh; LP no limits: curtailed 58.0, unserved 0
    engine 2040, 2025: coal 0.0, gas 0.0, diesel 0.00, wind incl. offshore 153.5, solar 107.0, storage 30.0, curtailed 244.6, unserved 0 GWh; LP no limits: curtailed 207.8, unserved 0
    engine 2040, 2015: coal 0.0, gas 0.0, diesel 0.00, wind incl. offshore 148.3, solar 112.8, storage 36.2, curtailed 223.0, unserved 0 GWh; LP no limits: curtailed 191.2, unserved 0

Deep decarbonisation stand-in (s_deep40nogas_c7, build 2026-11-03a)
| year, weather year | corridors | coal | gas | diesel | wind (offshore) | solar | lithium | flow, iron-air | pumped | curtailed (wind, solar, offshore) | unserved | corridors built MW, R bn a year | corridors with a shadow price over 4,000 h |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2035, 2025 | no limits | 18.8 | 0.0 | 0.00 | 131.0 (3.7) | 77.3 | 17.0 | 0.0, 0.0 | 7.7 | 59.2 (27.2, 31.2, 0.8) | 0 | - | none over 4,000 h |
| 2035, 2025 | as drawn | 89.5 | 0.0 | 0.01 | 65.3 (3.0) | 68.6 | 9.0 | 0.0, 0.0 | 1.3 | 134.2 (92.9, 39.8, 1.5) | 0 | - | North West to Northern Cape (8360 h, R5.9m); North West to Western Cape (8362 h, R5.9m); Free State to Mpumalanga (8263 h, R5.8m); Free State to North West (8263 h, R5.8m); Free State to Gauteng (8263 h, R5.8m) |
| 2035, 2025 | one circuit dropped | 102.9 | 0.0 | 0.23 | 57.4 (2.5) | 63.6 | 9.8 | 0.0, 0.0 | 1.3 | 147.6 (100.8, 44.8, 2.0) | 2 | - | Free State to Kwazulu Natal (8309 h, R13.4m); Eastern Cape to Kwazulu Natal (7997 h, R12.8m); North West to Northern Cape (8650 h, R12.6m); North West to Western Cape (8566 h, R12.5m); Free State to Mpumalanga (8307 h, R11.9m) |
| 2035, 2025 | one circuit dropped (extendable at R10,000/MW-km) | 19.6 | 0.0 | 0.00 | 115.9 (4.0) | 90.9 | 17.2 | 0.0, 0.0 | 7.5 | 60.2 (42.3, 17.5, 0.5) | 0 | 26,625, 4.47 | none over 4,000 h |
| 2035, 2025 | one circuit dropped, full TDP | 38.5 | 0.0 | 0.00 | 98.2 (4.0) | 87.6 | 15.1 | 0.0, 0.0 | 4.2 | 81.4 (60.0, 20.9, 0.5) | 0 | - | North West to Western Cape (5459 h, R3.6m); North West to Northern Cape (5458 h, R3.6m); Eastern Cape to Kwazulu Natal (4314 h, R2.8m); Free State to Northern Cape (4153 h, R2.8m); Free State to Hydra Central (4142 h, R2.8m) |
| 2035, 2015 | no limits | 25.7 | 0.0 | 0.01 | 123.4 (3.7) | 77.4 | 17.0 | 0.0, 0.0 | 7.2 | 55.1 (24.8, 29.6, 0.7) | 0 | - | none over 4,000 h |
| 2035, 2015 | as drawn | 89.9 | 0.0 | 0.01 | 64.7 (3.1) | 68.6 | 9.9 | 0.0, 0.0 | 1.4 | 123.1 (83.4, 38.4, 1.4) | 0 | - | North West to Western Cape (8192 h, R5.7m); North West to Northern Cape (8176 h, R5.7m); Free State to Mpumalanga (7971 h, R5.6m); Free State to North West (7971 h, R5.6m); Free State to Gauteng (7971 h, R5.6m) |
| 2035, 2015 | one circuit dropped | 103.4 | 0.0 | 0.02 | 57.1 (2.6) | 63.3 | 10.5 | 0.0, 0.0 | 1.5 | 136.5 (91.0, 43.7, 1.8) | 0 | - | North West to Northern Cape (8575 h, R6.8m); North West to Western Cape (8489 h, R6.7m); Free State to Kwazulu Natal (8012 h, R6.4m); Eastern Cape to Kwazulu Natal (7688 h, R6.2m); Free State to Mpumalanga (8002 h, R6.1m) |
| 2035, 2015 | one circuit dropped (extendable at R10,000/MW-km) | 26.5 | 0.0 | 0.01 | 108.9 (4.0) | 90.5 | 17.1 | 0.0, 0.0 | 7.0 | 56.1 (39.2, 16.5, 0.4) | 0 | 26,128, 4.41 | none over 4,000 h |
| 2035, 2015 | one circuit dropped, full TDP | 42.5 | 0.0 | 0.01 | 93.8 (4.0) | 87.7 | 15.3 | 0.0, 0.0 | 4.2 | 74.1 (54.3, 19.3, 0.4) | 0 | - | North West to Western Cape (4912 h, R3.2m); North West to Northern Cape (4900 h, R3.1m) |
| 2040, 2025 | no limits | 7.3 | 0.0 | 0.04 | 142.7 (3.5) | 111.2 | 41.7 | 0.0, 0.0 | 6.2 | 74.9 (33.0, 41.0, 1.0) | 0 | - | none over 4,000 h |
| 2040, 2025 | as drawn | 90.3 | 0.0 | 4.08 | 68.6 (2.8) | 87.2 | 25.8 | 0.0, 0.0 | 2.7 | 173.7 (107.0, 65.0, 1.7) | 5877 | - | Free State to Kwazulu Natal (8760 h, R261.1m); North West to Northern Cape (8760 h, R260.5m); North West to Western Cape (8760 h, R260.5m); Free State to Mpumalanga (8760 h, R260.5m); Free State to North West (8760 h, R260.5m) |
| 2040, 2025 | 0.7 | 95.4 | 0.0 | 8.85 | 59.8 (2.3) | 78.0 | 23.7 | 0.0, 0.0 | 2.1 | 192.3 (115.9, 74.2, 2.2) | 14018 | - | Free State to Kwazulu Natal (8760 h, R488.1m); Eastern Cape to Kwazulu Natal (8450 h, R474.8m); North West to Northern Cape (8760 h, R438.2m); North West to Western Cape (8760 h, R438.2m); Free State to Mpumalanga (8760 h, R438.2m) |
| 2040, 2025 | one circuit dropped | 96.0 | 0.0 | 6.76 | 60.6 (2.3) | 81.8 | 25.5 | 0.0, 0.0 | 2.8 | 187.6 (115.0, 70.4, 2.2) | 11292 | - | Free State to Kwazulu Natal (8760 h, R402.9m); Eastern Cape to Kwazulu Natal (8395 h, R393.2m); North West to Northern Cape (8760 h, R392.2m); North West to Western Cape (8760 h, R392.2m); Free State to Mpumalanga (8760 h, R392.2m) |
| 2040, 2025 | one circuit dropped (extendable at R10,000/MW-km) | 8.2 | 0.0 | 0.04 | 121.2 (4.1) | 130.0 | 42.4 | 0.0, 0.0 | 5.6 | 77.0 (54.4, 22.2, 0.4) | 0 | 30,162, 4.74 | none over 4,000 h |
| 2040, 2025 | one circuit dropped, full TDP | 36.6 | 0.0 | 0.07 | 102.0 (3.9) | 117.2 | 33.9 | 0.0, 0.0 | 2.4 | 109.2 (73.6, 35.0, 0.6) | 0 | - | North West to Northern Cape (7207 h, R5.0m); North West to Western Cape (7173 h, R4.9m); Eastern Cape to Kwazulu Natal (5768 h, R3.8m); Free State to Northern Cape (4067 h, R2.9m); Free State to Hydra Central (4015 h, R2.8m) |
| 2040, 2015 | no limits | 12.0 | 0.0 | 0.19 | 135.4 (3.6) | 113.0 | 43.3 | 0.0, 0.0 | 6.2 | 67.1 (29.1, 37.1, 0.9) | 0 | - | none over 4,000 h |
| 2040, 2015 | as drawn | 90.0 | 0.0 | 5.79 | 67.8 (2.9) | 87.6 | 27.7 | 0.0, 0.0 | 3.6 | 160.8 (96.6, 62.6, 1.5) | 4982 | - | Free State to Kwazulu Natal (8756 h, R307.0m); North West to Northern Cape (8756 h, R306.1m); North West to Western Cape (8756 h, R306.1m); Free State to Mpumalanga (8756 h, R306.1m); Free State to North West (8756 h, R306.1m) |
| 2040, 2015 | one circuit dropped | 93.0 | 0.0 | 8.71 | 60.4 (2.4) | 81.5 | 25.8 | 0.0, 0.0 | 3.0 | 174.7 (104.0, 68.7, 2.0) | 12567 | - | Free State to Kwazulu Natal (8757 h, R547.6m); North West to Northern Cape (8757 h, R535.1m); North West to Western Cape (8757 h, R535.0m); Free State to Mpumalanga (8757 h, R534.5m); Free State to North West (8757 h, R534.5m) |
| 2040, 2015 | one circuit dropped (extendable at R10,000/MW-km) | 13.0 | 0.0 | 0.19 | 116.1 (4.0) | 130.1 | 43.0 | 0.0, 0.0 | 5.9 | 68.9 (48.4, 20.1, 0.4) | 0 | 30,874, 4.87 | none over 4,000 h |
| 2040, 2015 | one circuit dropped, full TDP | 38.9 | 0.0 | 0.23 | 97.7 (3.9) | 118.8 | 34.6 | 0.0, 0.0 | 2.5 | 98.6 (66.7, 31.3, 0.5) | 0 | - | North West to Western Cape (6689 h, R4.6m); North West to Northern Cape (6711 h, R4.5m); Eastern Cape to Kwazulu Natal (5160 h, R3.4m); Free State to Hydra Central (4014 h, R2.8m); Free State to Northern Cape (4052 h, R2.7m) |
    engine 2035, 2025: coal 33.2, gas 0.0, diesel 0.07, wind incl. offshore 125.0, solar 71.1, storage 22.3, curtailed 72.6, unserved 0 GWh; LP no limits: curtailed 59.2, unserved 0
    engine 2035, 2015: coal 41.4, gas 0.0, diesel 0.12, wind incl. offshore 117.5, solar 70.2, storage 23.4, curtailed 68.3, unserved 0 GWh; LP no limits: curtailed 55.1, unserved 0
    engine 2040, 2025: coal 20.3, gas 0.0, diesel 0.14, wind incl. offshore 139.4, solar 101.5, storage 39.4, curtailed 88.8, unserved 0 GWh; LP no limits: curtailed 74.9, unserved 0
    engine 2040, 2015: coal 25.9, gas 0.0, diesel 0.33, wind incl. offshore 132.7, solar 102.6, storage 42.8, curtailed 79.5, unserved 0 GWh; LP no limits: curtailed 67.1, unserved 0

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
lithium, is the one to read for that build: pending, in the queue. (3) The corridor table itself (St Clair sums from PyPSA-RSA's
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
| net_final_2035_wy2025_nolimit_reea_l0_c1_mix_control_h6.json | 2026-11-05f, 2035, 2025 | no limits, mix | 1,460 (6 h blocks) | 210300 | 441010 | 3 | 297 | 300 | 1.2 |
| net_final_2035_wy2015_n1c_reea_l0_c1_mix_ext10k_h3.json | 2026-11-05f, 2035, 2015 | one circuit dropped, mix, corridors extendable at R10,000 (script v2) | 2,920 (3 h blocks) | 481903 | 1004633 | 3 | 2928 | 2930 | 2.4 |
| net_final_2035_wy2015_nolimit_reea_l0_c1_h3.json | 2026-11-05f, 2035, 2015 | no limits, fixed build | 2,920 (3 h blocks) | 297840 | 645320 | 2 | 10 | 13 | 1.4 |
| net_final_2035_wy2015_nolimit_reea_l0_c1_mix_control_h3.json | 2026-11-05f, 2035, 2015 | no limits, mix | 2,920 (3 h blocks) | 420540 | 881930 | 2 | 1596 | 1599 | 2.0 |
| net_final_2035_wy2025_n1c_reea_l0_c1_h3.json | 2026-11-05f, 2035, 2025 | one circuit dropped, fixed build | 2,920 (3 h blocks) | 297840 | 645320 | 2 | 10 | 12 | 1.4 |
| net_final_2035_wy2025_n1c_reea_l0_c1_mix_ext10k_h3.json | 2026-11-05f, 2035, 2025 | one circuit dropped, mix, corridors extendable at R10,000 | 2,920 (3 h blocks) | 420562 | 881951 | 3 | 2732 | 2735 | 2.2 |
| net_final_2035_wy2025_n1c_reea_l0_c1_mix_n1c_fixedcorr_h3.json | 2026-11-05f, 2035, 2025 | one circuit dropped, mix | 2,920 (3 h blocks) | 420540 | 881930 | 2 | 3741 | 3744 | 2.1 |
| net_final_2035_wy2025_n1ctdp_reea_l0_c1_tdpfull_mix_ext10k_h3.json | 2026-11-05f, 2035, 2025 | one circuit dropped, full TDP, mix, corridors extendable at R10,000 | 2,920 (3 h blocks) | 420562 | 881951 | 3 | 2342 | 2344 | 2.2 |
| net_final_2035_wy2025_n1ctdp_reea_l0_c1_tdpfull_mix_fixed_h3.json | 2026-11-05f, 2035, 2025 | one circuit dropped, full TDP, mix | 2,920 (3 h blocks) | 420540 | 881930 | 3 | 3195 | 3198 | 2.1 |
| net_final_2035_wy2025_nolimit_reea_l0_c1_h3.json | 2026-11-05f, 2035, 2025 | no limits, fixed build | 2,920 (3 h blocks) | 297840 | 645320 | 2 | 12 | 15 | 1.4 |
| net_final_2035_wy2025_nolimit_reea_l0_c1_mix_control_caps_h3.json | 2026-11-05f, 2035, 2025 | no limits, mix | 2,920 (3 h blocks) | 420540 | 881933 | 2 | 1165 | 1168 | 2.4 |
| net_final_2035_wy2025_nolimit_reea_l0_c1_mix_control_h3.json | 2026-11-05f, 2035, 2025 | no limits, mix | 2,920 (3 h blocks) | 420540 | 881930 | 2 | 1213 | 1215 | 2.0 |
| net_final_2040_wy2015_nolimit_reea_l0_c1_h3.json | 2026-11-05f, 2040, 2015 | no limits, fixed build | 2,920 (3 h blocks) | 335800 | 732920 | 2 | 14 | 16 | 1.8 |
| net_final_2040_wy2015_nolimit_reea_l0_c1_mix_control_h3.json | 2026-11-05f, 2040, 2015 | no limits, mix (script v2) | 2,920 (3 h blocks) | 516900 | 1086330 | 3 | 2274 | 2277 | 2.5 |
| net_final_2040_wy2025_n1c_reea_l0_c1_h3.json | 2026-11-05f, 2040, 2025 | one circuit dropped, fixed build | 2,920 (3 h blocks) | 335800 | 732920 | 2 | 13 | 15 | 1.8 |
| net_final_2040_wy2025_n1c_reea_l0_c1_mix_ext10k_h3.json | 2026-11-05f, 2040, 2025 | one circuit dropped, mix, corridors extendable at R10,000 | 2,920 (3 h blocks) | 455602 | 963711 | 2 | 4580 | 4582 | 2.3 |
| net_final_2040_wy2025_n1c_reea_l0_c1_mix_n1c_fixedcorr_h3.json | 2026-11-05f, 2040, 2025 | one circuit dropped, mix | 2,920 (3 h blocks) | 455580 | 963690 | 3 | 2715 | 2718 | 2.2 |
| net_final_2040_wy2025_n1ctdp_reea_l0_c1_tdpfull_mix_ext10k_h3.json | 2026-11-05f, 2040, 2025 | one circuit dropped, full TDP, mix, corridors extendable at R10,000 (script v2) | 2,920 (3 h blocks) | 516943 | 1086393 | 3 | 3616 | 3619 | 2.4 |
| net_final_2040_wy2025_nolimit_reea_l0_c1_h3.json | 2026-11-05f, 2040, 2025 | no limits, fixed build | 2,920 (3 h blocks) | 335800 | 732920 | 2 | 15 | 17 | 1.8 |
| net_final_2040_wy2025_nolimit_reea_l0_c1_mix_control_h3.json | 2026-11-05f, 2040, 2025 | no limits, mix | 2,920 (3 h blocks) | 455580 | 963690 | 3 | 1487 | 1490 | 2.3 |
| net_deep_2035_wy2015_n0_reea_l0_c0.json | 2026-11-03a, 2035, 2015 | as drawn, fixed build | 8,760 | 954840 | 2058600 | 2 | 37 | 40 | 3.6 |
| net_deep_2035_wy2015_n1c_reea_l0_c0.json | 2026-11-03a, 2035, 2015 | one circuit dropped, fixed build | 8,760 | 954840 | 2058600 | 2 | 38 | 40 | 3.6 |
| net_deep_2035_wy2015_n1c_reea_l0_c0_ext10k.json | 2026-11-03a, 2035, 2015 | one circuit dropped, fixed build, corridors extendable at R10,000 | 8,760 | 954862 | 2058621 | 2 | 550 | 552 | 4.0 |
| net_deep_2035_wy2015_n1ctdp_reea_l0_c0_tdpfull.json | 2026-11-03a, 2035, 2015 | one circuit dropped, full TDP, fixed build | 8,760 | 954840 | 2058600 | 3 | 40 | 43 | 4.2 |
| net_deep_2035_wy2015_nolimit_reea_l0_c0.json | 2026-11-03a, 2035, 2015 | no limits, fixed build | 8,760 | 954840 | 2058600 | 3 | 39 | 42 | 4.2 |
| net_deep_2035_wy2025_n0_reea_l0_c0.json | 2026-11-03a, 2035, 2025 | as drawn, fixed build | 8,760 | 954840 | 2058600 | 2 | 37 | 39 | 3.6 |
| net_deep_2035_wy2025_n1c_reea_l0_c0.json | 2026-11-03a, 2035, 2025 | one circuit dropped, fixed build | 8,760 | 954840 | 2058600 | 3 | 40 | 43 | 4.2 |
| net_deep_2035_wy2025_n1c_reea_l0_c0_ext10k.json | 2026-11-03a, 2035, 2025 | one circuit dropped, fixed build, corridors extendable at R10,000 | 8,760 | 954862 | 2058621 | 2 | 560 | 562 | 4.0 |
| net_deep_2035_wy2025_n1ctdp_reea_l0_c0_tdpfull.json | 2026-11-03a, 2035, 2025 | one circuit dropped, full TDP, fixed build | 8,760 | 954840 | 2058600 | 3 | 39 | 41 | 3.6 |
| net_deep_2035_wy2025_nolimit_reea_l0_c0.json | 2026-11-03a, 2035, 2025 | no limits, fixed build | 8,760 | 954840 | 2058600 | 2 | 49 | 51 | 4.1 |
| net_deep_2040_wy2015_n0_reea_l0_c0.json | 2026-11-03a, 2040, 2015 | as drawn, fixed build | 8,760 | 954840 | 2058600 | 3 | 37 | 40 | 4.2 |
| net_deep_2040_wy2015_n1c_reea_l0_c0.json | 2026-11-03a, 2040, 2015 | one circuit dropped, fixed build | 8,760 | 954840 | 2058600 | 3 | 39 | 41 | 3.6 |
| net_deep_2040_wy2015_n1c_reea_l0_c0_ext10k.json | 2026-11-03a, 2040, 2015 | one circuit dropped, fixed build, corridors extendable at R10,000 | 8,760 | 954862 | 2058621 | 2 | 726 | 728 | 4.3 |
| net_deep_2040_wy2015_n1ctdp_reea_l0_c0_tdpfull.json | 2026-11-03a, 2040, 2015 | one circuit dropped, full TDP, fixed build | 8,760 | 954840 | 2058600 | 2 | 37 | 40 | 3.6 |
| net_deep_2040_wy2015_nolimit_reea_l0_c0.json | 2026-11-03a, 2040, 2015 | no limits, fixed build | 8,760 | 954840 | 2058600 | 2 | 38 | 40 | 4.2 |
| net_deep_2040_wy2025_n0_reea_l0_c0.json | 2026-11-03a, 2040, 2025 | as drawn, fixed build | 8,760 | 954840 | 2058600 | 3 | 41 | 43 | 4.2 |
| net_deep_2040_wy2025_n1_reea_l0_c0.json | 2026-11-03a, 2040, 2025 | 0.7, fixed build | 8,760 | 954840 | 2058600 | 3 | 41 | 44 | 4.2 |
| net_deep_2040_wy2025_n1c_reea_l0_c0.json | 2026-11-03a, 2040, 2025 | one circuit dropped, fixed build | 8,760 | 954840 | 2058600 | 3 | 41 | 44 | 4.2 |
| net_deep_2040_wy2025_n1c_reea_l0_c0_ext10k.json | 2026-11-03a, 2040, 2025 | one circuit dropped, fixed build, corridors extendable at R10,000 | 8,760 | 954862 | 2058621 | 2 | 517 | 519 | 4.0 |
| net_deep_2040_wy2025_n1ctdp_reea_l0_c0_tdpfull.json | 2026-11-03a, 2040, 2025 | one circuit dropped, full TDP, fixed build | 8,760 | 954840 | 2058600 | 2 | 38 | 41 | 3.6 |
| net_deep_2040_wy2025_nolimit_reea_l0_c0.json | 2026-11-03a, 2040, 2025 | no limits, fixed build | 8,760 | 954840 | 2058600 | 3 | 47 | 50 | 4.1 |
| net_ff_2035_wy2015_n0_reea_l0_c0.json | 2026-11-03a, 2035, 2015 | as drawn, fixed build | 8,760 | 972360 | 2119920 | 2 | 42 | 44 | 4.3 |
| net_ff_2035_wy2015_n1c_reea_l0_c0.json | 2026-11-03a, 2035, 2015 | one circuit dropped, fixed build | 8,760 | 972360 | 2119920 | 2 | 42 | 45 | 4.3 |
| net_ff_2035_wy2015_n1c_reea_l0_c0_ext10k.json | 2026-11-03a, 2035, 2015 | one circuit dropped, fixed build, corridors extendable at R10,000 | 8,760 | 972382 | 2119941 | 2 | 2194 | 2196 | 3.7 |
| net_ff_2035_wy2015_n1ctdp_reea_l0_c0_tdpfull.json | 2026-11-03a, 2035, 2015 | one circuit dropped, full TDP, fixed build | 8,760 | 972360 | 2119920 | 3 | 47 | 50 | 4.3 |
| net_ff_2035_wy2015_nolimit_reea_l0_c0.json | 2026-11-03a, 2035, 2015 | no limits, fixed build | 8,760 | 972360 | 2119920 | 2 | 48 | 51 | 3.7 |
| net_ff_2035_wy2025_n0_reea_l0_c0.json | 2026-11-03a, 2035, 2025 | as drawn, fixed build | 8,760 | 972360 | 2119920 | 3 | 63 | 66 | 4.2 |
| net_ff_2035_wy2025_n1c_reea_l0_c0.json | 2026-11-03a, 2035, 2025 | one circuit dropped, fixed build | 8,760 | 972360 | 2119920 | 3 | 56 | 59 | 3.5 |
| net_ff_2035_wy2025_n1c_reea_l0_c0_ext10k.json | 2026-11-03a, 2035, 2025 | one circuit dropped, fixed build, corridors extendable at R10,000 | 8,760 | 972382 | 2119941 | 2 | 1604 | 1607 | 4.3 |
| net_ff_2035_wy2025_n1ctdp_reea_l0_c0_tdpfull.json | 2026-11-03a, 2035, 2025 | one circuit dropped, full TDP, fixed build | 8,760 | 972360 | 2119920 | 2 | 61 | 64 | 4.3 |
| net_ff_2035_wy2025_nolimit_reea_l0_c0.json | 2026-11-03a, 2035, 2025 | no limits, fixed build | 8,760 | 972360 | 2119920 | 2 | 73 | 75 | 4.2 |
| net_ff_2040_wy2015_n0_reea_l0_c0.json | 2026-11-03a, 2040, 2015 | as drawn, fixed build | 8,760 | 1112520 | 2435280 | 2 | 57 | 59 | 4.1 |
| net_ff_2040_wy2015_n1c_reea_l0_c0.json | 2026-11-03a, 2040, 2015 | one circuit dropped, fixed build | 8,760 | 1112520 | 2435280 | 2 | 60 | 62 | 4.1 |
| net_ff_2040_wy2015_n1c_reea_l0_c0_ext10k.json | 2026-11-03a, 2040, 2015 | one circuit dropped, fixed build, corridors extendable at R10,000 | 8,760 | 1112542 | 2435301 | 3 | 808 | 811 | 5.0 |
| net_ff_2040_wy2015_n1ctdp_reea_l0_c0_tdpfull.json | 2026-11-03a, 2040, 2015 | one circuit dropped, full TDP, fixed build | 8,760 | 1112520 | 2435280 | 3 | 62 | 64 | 4.3 |
| net_ff_2040_wy2015_nolimit_reea_l0_c0.json | 2026-11-03a, 2040, 2015 | no limits, fixed build | 8,760 | 1112520 | 2435280 | 2 | 58 | 60 | 4.2 |
| net_ff_2040_wy2025_n0_reea_l0_c0.json | 2026-11-03a, 2040, 2025 | as drawn, fixed build | 8,760 | 1112520 | 2435280 | 3 | 73 | 76 | 4.1 |
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
| net_final_2040_wy2015_n0_reea_l0_c0.json | 2026-11-05f, 2040, 2015 | as drawn, fixed build | 8,760 | 1007400 | 2198760 | 3 | 48 | 51 | 3.7 |
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
| net_final_2040_wy2025_n0_reea_l0_c0.json | 2026-11-05f, 2040, 2025 | as drawn, fixed build | 8,760 | 1007400 | 2198760 | 2 | 50 | 53 | 4.3 |
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
| net_today_2025_wy2025_n0_reea_l0_c0_koeberg.json | 2026-11-04b, 2025, 2025 | as drawn, fixed build, Koeberg calendar | 8,760 | 657000 | 1436640 | 10 | 88 | 98 | 2.9 |
| net_today_2025_wy2025_n1_reea_l0_c0_koeberg.json | 2026-11-04b, 2025, 2025 | 0.7, fixed build, Koeberg calendar | 8,760 | 657000 | 1436640 | 8 | 109 | 117 | 2.9 |
| net_today_2025_wy2025_n1c_reea_l0_c0.json | 2026-11-04b, 2025, 2025 | one circuit dropped, fixed build | 8,760 | 657000 | 1436640 | 2 | 28 | 30 | 3.0 |
| net_today_2025_wy2025_n1c_reea_l0_c0_koeberg.json | 2026-11-04b, 2025, 2025 | one circuit dropped, fixed build, Koeberg calendar | 8,760 | 657000 | 1436640 | 8 | 97 | 104 | 2.9 |
| net_today_2025_wy2025_nolimit_reea_l0_c0_koeberg.json | 2026-11-04b, 2025, 2025 | no limits, fixed build, Koeberg calendar | 8,760 | 657000 | 1436640 | 7 | 87 | 94 | 3.0 |
| net_today_2026_wy2025_f085_reea_l0_c0_koeberg.json | 2026-11-04b, 2026, 2025 | f085, fixed build, Koeberg calendar | 8,760 | 657000 | 1436640 | 4 | 45 | 49 | 2.9 |
| net_today_2026_wy2025_n0_reea_l0_c0_koeberg.json | 2026-11-04b, 2026, 2025 | as drawn, fixed build, Koeberg calendar | 8,760 | 657000 | 1436640 | 4 | 57 | 62 | 2.9 |
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
