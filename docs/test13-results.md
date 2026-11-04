# Test 13: near-optimal ranges on the central, 2030 and 2040

A method run on a provisional basis (HANDOVER 'Message 691', brief B; message 693). Draft: filled in as the runs finish. Times UTC.

## Basis (message 693)

- Build 2026-11-04a (index.html unchanged), branch claude/test13-mga from origin/claude/weather-fixes, with weather-fixes merged at
  message 693 (3) (the six-constant wind table, WX_WINDCORR_TABLE, the FIX_FROM fix, pathcheck's cost-of-capital and rpCum fixes).
- Settings: `source pathway/env_c6a.sh`; GAS_FIRST=2035 SS=inertia SS_FC=reservecoal COC=blended BTM_STOCK=8 VPP=1 GY=1 COAL_FUEL_ESC=3
  COAL_FOM_ESC=1.1 COMPLY=compromise COAL_CARBON_FLOOR=1 SOLVER=native; REP_REF=metered
  REP_EXTREMES=20,161,162,163,187,188,194,195,196,214,218,358 WX_WINDCORR=1 WX_WINDCORR_TABLE=pathway/wx/wind_corr_table_calm6.json
  CONG_OFF=1; REP_WEIGHTS=clustered REP_DAYS=25 STORAGE_LINK=1 MAXP=1 DUMP=0. No WIN_FROM. Runner: harness/pathway/mga/run_mga.sh;
  outputs in harness/out/mga2.
- MGA (Neumann and Brown 2021, Eq. 15): the LP's cost becomes a row, cost <= (1 + slack) x MGA_FSTAR, the base's pass-1 objective,
  and the objective minimises or maximises a group's new-build MW standing in the year (wind: onshore and offshore; solar: utility
  PV; lithium: power, with MWh reported; ldes: vanadium, iron-air and new pumped storage; coal: standing coal, through early
  retirement).
- No Eskom data is read: the metered reference is profiles.json, the extremes are given, the wind table is committed.
- Machine: 4 cores, 15 GB. Solver: HiGHS 1.15.1 (highspy), parallel dual simplex on 2 threads (below).

## Solver (message 693 (1))

Timed on message 691's base LP (c7's settings with REP_REF=2025 and the old extremes, congestion on; 25 clustered linked days, pass
1; 703,433 rows, 422,595 columns; harness/out/mga/base_pass1.lp, sha1 71091a41). Each ran with others beside it on the 4 cores.

| Solver (HiGHS options) | Wall time | Result |
|---|---|---|
| Dual simplex, serial (default) | over 5,791 s (97 min) | stopped at the piece's limit; no valid basis to resume from |
| Interior point with crossover | over 6,600 s (110 min) | stopped at its limit, not optimal |
| Interior point without crossover | 605 s | status Unknown, objective 1.3e16: not usable |
| Parallel dual simplex, 2 threads (simplex_strategy 2, threads 2) | 3,851 s (64 min) | Optimal, objective 1,511,417,623,845.253 |
| Dual simplex with presolve off | over 77 min | stopped at message 693 |
| Primal simplex from the base's optimal basis, on the first MGA LP | over 14 min | stopped at message 693 |

Parallel dual simplex on 2 threads is the fastest and the only one to finish inside a 2-hour piece; every solve below uses it
(HIGHS_OPTS='{"simplex_strategy":2,"threads":2}'), two at a time from the base on. Each run records the options and HiGHS's own
solve seconds in its passLog method.

Message 691's base (kept in harness/out/mga/base.json, superseded): objective 1,511,417,623,845.253; the engine check put mean unserved
energy across the weather years above the 20 GWh a year standard in 2031 and 2033-2040 (2040: 110 GWh).

## Base (message 693)

harness/out/mga2/base.json, run 11:02-12:24 UTC on 4 November. Pass 1 at 25 clustered linked days (LP key 8e0651f38a; 116 MB LP).

- Objective (MGA_FSTAR): 1,521,521,735,393.82. Solve 4,484 s (75 min) by HiGHS's clock, parallel dual simplex on 2 threads, alone
  on the machine; 81 min for the whole run with the engine check.
- Engine check (the amendment to step 5: the base's check first, the 40 solves only if it passes): adequate. Mean unserved energy
  across the weather years, GWh, against the 20 GWh a year standard:

  | 2026-2029 | 2030 | 2031 | 2032 | 2033 | 2034 | 2035 | 2036 | 2037 | 2038 | 2039 | 2040 |
  |---|---|---|---|---|---|---|---|---|---|---|---|
  | 0 | 2.3 | 5.0 | 3.2 | 7.8 | 17.0 | 16.7 | 12.7 | 10.7 | 8.4 | 11.6 | 18.8 |

  So the adequacy loop was not needed and the ranges are measured on this LP (no WIN_FROM). 2040 is within 1.2 GWh of the standard.
- New-build MW standing (from 2026; existing plants excluded) and coal standing:

  | Year | Wind (all onshore) | Solar | Lithium MW | Lithium MWh | LDES (pumped storage, iron-air) | Coal | Gas |
  |---|---|---|---|---|---|---|---|
  | 2030 | 8,468 | 6,976 | 1,707 | 3,719 | 0 | 32,213 | 0 |
  | 2040 | 39,918 | 23,927 | 8,716 | 43,325 | 1,650 (1,500, 150) | 17,670 | 6,533 |

## Merge of claude/wind-table (message 698 (b))

Merged at the first piece end (commit a3c41c5; build 2026-11-04b): the enrolment round-off fix, and the wind correction on by
default with the six-constant table. Seven conflicts, all where wind-table holds the newer version of weather-fixes' lines (wind
correction 1 not 0, DATA_V 10, the six-constant table, NEW_WIND_CF_12Y re-measured, the table load moved, the build stamp), taken
from wind-table; index.html, pathcheck.js, nodal_dispatch.js and wind_corr_table.json then equal wind-table's. The settings are
unchanged, the table path included. The base LP's key is unchanged: 8e0651f38a18d5c2014eb508e720f99c5c3e90e0 before and after the
merge, the same as test 8's pass 1 (LP built with DUMP_STOP=1, not solved; the two LP files byte-identical). The base rerun on
build 2026-11-04b (out/mga2/base_04b.json, the cached solution replayed, engine check redone) gives the same build, the same
unserved energy in every year and the verdict adequate; only the run time differs.

## Ranges

The first two MGA solves, side by side from 12:25 UTC, two threads each on the 4 cores, each with a 6,698 s (111.6 min) limit:

| Run | Wall time | Result |
|---|---|---|
| wind_2040_min_0.01 | 6,698 s, stopped at the limit (12:25-14:17) | not solved; no valid basis to resume from |
| wind_2040_max_0.01 | 6,698 s, stopped at the limit (12:25-14:18) | not solved; no valid basis to resume from |

The base solved in 75 min alone; the MGA LPs did not solve in 112 min with a second solve beside them. Under message 693 (1) the
40 solves stop here until Nick chooses how to go on.
