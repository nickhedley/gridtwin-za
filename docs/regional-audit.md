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
