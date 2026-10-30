# 30 Oct 2026 runs on build 2026-10-29b (016641e)

Engine runs only; no optimiser. Times UTC. Eskom figures: ESK19679 annual sums as recorded in RESULTS (Eskom credited; the analysis is ours, not Eskom's).

## a. The 2025 replay and validate_external

Replay: the preset '2025, as modelled' as the page runs it (applyState, simulate on PROFILES, its trace year 2025), one run; replay2025_29b.js, output replay2025_29b.txt.

2025, as modelled (build 2026-10-29b): coal 169.2 TWh against Eskom's 170.4 (−0.7%)

validate_external.js at 016641e, run with every check's detail printed (a copy whose check() also logs passes; the checks are unchanged): validate_external_29b.txt. 8/8 passed.

| Check | Result | Detail |
|---|---|---|
| csir2030CoalShare within 6 points of CSIR least-cost study (PLEXOS), extended IRP analysis | pass | model 55.3% vs published 55% (gap 0.3 pts, band ±6) |
| csir2030ReShare within 8 points of CSIR least-cost study — renewable share implied by the coal figure | pass | model 38.2% vs published 40% (gap -1.8 pts, band ±8) |
| NTCSA MTSAO 2030 risk-adjusted: unserved energy above 4 TWh | pass | 5.2 TWh over 24 draws against the MTSAO's "more than 4 TWh" |
| NTCSA MTSAO 2030 risk-adjusted: OCGT utilisation near 45% | pass | 56.5% against the MTSAO's about 45% |
| the default build pace is not below the investable pipeline | pass | 10.2 GW a year allowed against GreenCape's 12.9 GW to 2030, about 3.2 GW a year of investable pipeline |
| preset builds sit inside the CSIR least-cost capacity ranges | pass | Deep decarbonisation 45.2 GW wind and 46.3 solar; Fossil-free 57.9 and 68.1 |
| EDMSA Scenario A CO2 2035 within 22 Mt of the published figure | pass | 117.0 against 124 Mt, gap -7.0 |
| EDMSA Scenario A wind 2035 within 12 TWh of the published figure | pass | 65.6 against 64 TWh, gap +1.6 |

Flag: 'EDMSA Scenario A CO2 2035 within 22 Mt' passes (117.0 against 124 Mt). CLAUDE.md lists it as known failure 1, failing since build 2026-10-01a.

## b. TODO 14kv (a): the 51% gas minimum alone (s_gasfloor_c6e)

pathway_s_gasfloor_c6e.json is pathway_c6e.json with gasFloor.engine=1 (ccgtForceLoad: 51% annual capacity factor on up to 6,000 MW of CCGT, 2030–2040); same build, the optimiser not run. Comparator: c6e's own build checked on the same build (pathcheck_c6e_29b_*), identical in every year to the recorded check on 2026-10-28a: yes. Engine check as the set (LNG=1 GRID=1, three year groups, 120 runs a year). New CCGT standing: none before 2035, 551 MW in 2035, 6,074 MW in 2040.

| | c6e | s_gasfloor_c6e | Difference |
|---|---|---|---|
| Engine PV 2026–40, R bn | 2314.7 | 2340.3 | +25.6 |
| With grid, R bn | 2323.1 | 2348.8 | +25.6 |
| CO2 2026–40, Mt | 1738.6 | 1724.0 | −14.6 |
| Gas 2026–40, TWh | 15.2 | 86.1 | +70.9 |

| Year | System cost per MWh served, c6e / floor, R | Difference, R/MWh | System cost, difference, R bn | CO2, c6e / floor, Mt | Gas, c6e / floor, TWh | Floor target / unmet, TWh | Coal, c6e / floor, TWh | Mean unserved, c6e / floor, GWh |
|---|---|---|---|---|---|---|---|---|
| 2030 | 1057.5 / 1057.5 | +0.0 | +0.0 | 140.0 / 140.0 | 0.00 / 0.00 | 0.00 / 0.00 | 125.1 / 125.1 | 1.2 / 1.2 |
| 2031 | 1047.7 / 1047.7 | +0.0 | +0.0 | 134.1 / 134.1 | 0.00 / 0.00 | 0.00 / 0.00 | 120.0 / 120.0 | 4.7 / 4.7 |
| 2032 | 1051.6 / 1051.6 | +0.0 | +0.0 | 118.3 / 118.3 | 0.00 / 0.00 | 0.00 / 0.00 | 105.4 / 105.4 | 5.5 / 5.5 |
| 2033 | 1057.7 / 1057.7 | +0.0 | +0.0 | 104.5 / 104.5 | 0.00 / 0.00 | 0.00 / 0.00 | 92.7 / 92.7 | 4.2 / 4.2 |
| 2034 | 1016.2 / 1016.2 | +0.0 | +0.0 | 90.4 / 90.4 | 0.00 / 0.00 | 0.00 / 0.00 | 80.0 / 80.0 | 3.1 / 3.1 |
| 2035 | 997.1 / 1003.4 | +6.3 | +1.7 | 90.5 / 89.4 | 0.54 / 2.73 | 2.46 / 0.00 | 80.1 / 78.3 | 1.4 / 1.3 |
| 2036 | 1001.7 / 1015.7 | +14.0 | +3.9 | 94.0 / 91.6 | 1.19 / 6.19 | 5.72 / 0.01 | 83.5 / 79.2 | 1.6 / 1.5 |
| 2037 | 982.7 / 1010.2 | +27.5 | +7.8 | 87.0 / 83.0 | 1.88 / 11.42 | 11.05 / 0.02 | 77.2 / 69.7 | 0.8 / 0.8 |
| 2038 | 1001.2 / 1046.8 | +45.6 | +13.1 | 77.8 / 74.0 | 2.31 / 16.66 | 16.41 / 0.03 | 68.9 / 59.9 | 2.3 / 2.3 |
| 2039 | 1005.1 / 1065.5 | +60.5 | +17.9 | 73.0 / 70.3 | 3.97 / 22.04 | 21.78 / 0.04 | 64.3 / 55.1 | 1.1 / 1.0 |
| 2040 | 1020.1 / 1097.1 | +77.0 | +23.0 | 67.5 / 66.8 | 5.30 / 27.02 | 26.81 / 0.07 | 59.1 / 50.5 | 0.9 / 0.8 |

2026–2029 are identical (no floor before 2030); 2030–2034 are identical (no CCGT standing). System cost per MWh: the engine's avgCost over gridServed, served-weighted across runs (pathcheck avgCostRMWh). Curtailed wind and solar in 2040: 25.1 TWh in c6e, 36.6 with the floor.

## c. TODO 14kx: when c6e's new gas runs (2035 and 2040)

gashourly_c6e.js: pathcheck.js at 016641e with per-run gas by month and lull shares added (definitions in its header); c6e's central (pathway_c6e.json), YEARS=2035,2040, 120 runs a year. Its cost, CO2 and gas match pathcheck_c6e_c.json. Gas is stack.ccgt (new CCGT and open cycle on LNG; there is no existing CCGT). Wind and solar resource: each hour's weather-year national wind and solar profiles times the fleet standing that year, before dispatch and curtailment.

| Year | Gas, GWh | Jan | Feb | Mar | Apr | May | Jun | Jul | Aug | Sep | Oct | Nov | Dec |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2035 | 539 | 32 | 25 | 50 | 95 | 100 | 84 | 58 | 52 | 22 | 11 | 6 | 4 |
| 2040 | 5299 | 313 | 421 | 625 | 836 | 851 | 608 | 463 | 510 | 321 | 178 | 108 | 65 |

| Year | Share in the lowest tenth of hours by wind and solar (876 h) | Hours with gas running in them | Share in hours below half the mean (hours a year) | Share in multi-day lulls (days a year) | Hours with gas running |
|---|---|---|---|---|---|
| 2035 | 43.5% | 214 | 84.8% (3102) | 2.0% (0.5) | 533 |
| 2040 | 51.2% | 528 | 91.9% (3150) | 1.2% (0.5) | 1165 |

Caveat: hours below half the mean are over a third of the year (mostly windless nights), so that share says gas runs at night, not only in lulls. The multi-day lull test (three or more consecutive days below 60% of the mean day) finds half a day a year, too strict to separate winter lulls; a looser threshold is a rerun of this script.
