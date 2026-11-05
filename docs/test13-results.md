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

## Method tests (the method-test message, 4 November)

Three ways to bring one MGA solve, wind 2040 minimum at 1%, inside a piece. Two at a time, two threads each, on the 4 cores; each
with a limit of about 6,690 s (111.5 min) inside a 127-minute job. Runner: harness/pathway/mga/run_one.sh; outputs in
harness/out/mga2/warm, d18 and nopre. No GitHub Actions.

### 1. Warm start (out/mga2/warm)

- Base re-solved to save its optimal basis (scratchpad lptest, 15:29-16:47 UTC, beside the 18-day base and then the 18-day MGA):
  4,672 s wall, 4,638.8 s by HiGHS's clock, parallel dual simplex on 2 threads; objective 1,521,521,735,393.8196, identical to
  out/mga2/base.json. The basis (26 MB) is kept in the scratchpad, off the repository.
- Wind 2040 minimum from that basis, primal simplex (HIGHS_OPTS '{"simplex_strategy":4}', HIGHS_BASIS_IN set), from 16:47 UTC:
  piece 1, 16:47-18:40 UTC beside the 18-day MGA and then presolve off: stopped at its 6,692 s (111.5 min) limit, not solved; a
  valid basis kept (HiGHS takes no presolve when given a basis). Piece 2 resumed from it at 18:41 UTC (my call: the slot was free
  and presolve off runs on regardless; both stop by the morning of 5 November). Piece 2, 18:41-20:33 UTC: not solved, basis kept.
  Piece 3 from 20:34 UTC with HiGHS's log on (out/mga2/warm/highs_p3.log, off the repository): the reloaded basis starts slightly
  primal infeasible (19,342 rows, sum 13,311; most likely the bound perturbation of primal simplex), feasible again within minutes;
  at 4,106 s into piece 3 it is primal feasible with wind standing in 2040 at 26,892 MW (the base: 39,918 MW) and falling by about
  12 MW a minute, with 31,316 dual infeasibilities left. Piece 3 ended at 22:26 UTC, not solved, at 26,380 MW (falling about 10 MW
  a minute at the end), basis kept. Piece 4 started at 22:26 UTC; the container restarted at 22:28 UTC and it restarted from the
  same basis at 22:29 UTC. Piece 4, 22:29-00:21 UTC: not solved, 24,812 MW at its end (falling about 14 MW a minute), dual
  infeasibilities down to 7,285 (sum 0.013); basis kept. Piece 5, 00:22-01:02 UTC: Optimal after 2,346 s.
- Result: solved. HiGHS time across the pieces 29,117 s (8.1 h: 6,692, 6,692, 6,696, 6,691 and 2,346 s, plus about 2 min lost to the
  restart), 16:47 UTC on 4 November to 01:02 UTC on 5 November, always beside a second solve. Primal simplex runs on one thread.
  With the base re-solve that made the basis (4,672 s), 9.4 h. It does not fit inside a piece.
- Wind 2040 minimum at 1% (out/mga2/warm/wind_2040_min_0.01.json, out/mga2/warm/summary.json; LP key 8a0389e6d5, MGA_FSTAR
  1,521,521,735,393.8196): wind standing in 2040 24,605 MW against the base's 39,918 MW (-15,313 MW). The cost row binds at +1.000%.
  No new wind is built from 2036 on. New-build MW standing in 2040:

  | Run | Wind | Solar | Lithium MW | Lithium MWh | LDES | Coal | Gas |
  |---|---|---|---|---|---|---|---|
  | Base | 39,918 | 23,927 | 8,716 | 43,325 | 1,650 (pumped storage 1,500, iron-air 150) | 17,670 | 6,533 |
  | Wind 2040 minimum, 1% | 24,605 | 43,139 | 13,605 | 85,794 | 1,500 (pumped storage) | 17,890 | 5,017 |

  Engine check: adequate. Mean unserved energy, GWh (2026-2029 zero):

  | 2030 | 2031 | 2032 | 2033 | 2034 | 2035 | 2036 | 2037 | 2038 | 2039 | 2040 |
  |---|---|---|---|---|---|---|---|---|---|---|
  | 2.5 | 5.4 | 3.9 | 7.8 | 17.8 | 16.7 | 9.7 | 10.4 | 12.2 | 14.1 | 19.4 |

  On a provisional basis (the metered tracking twin is being fixed, which will change this LP's key): a method result, not a range for
  the note.
- The run's log says "start from basis none (cold)": that line reports only pathway's own resume basis. The solver process was
  checked to hold HIGHS_BASIS_IN pointing at the saved base basis.

### 2. 18 days (out/mga2/d18)

REP_DAYS=18: the 12 extremes kept, the typical days cut from 13 to 6; every other setting as the base.

- 18-day base (out/mga2/d18/base.json, LP key 0625d938ec, 94 MB LP), 15:29-16:05 UTC beside the base re-solve: solve 1,780 s by
  HiGHS's clock (30 min), 36 min for the whole run with the engine check.
- Objective 1,501,917,683,865.20 against the 25-day base's 1,521,521,735,393.82: 1.29% lower (R19.6bn).
- Engine check: adequate. Mean unserved energy, GWh, against the 20 GWh a year standard (2026-2029 zero):

  | 2030 | 2031 | 2032 | 2033 | 2034 | 2035 | 2036 | 2037 | 2038 | 2039 | 2040 |
  |---|---|---|---|---|---|---|---|---|---|---|
  | 1.3 | 5.3 | 13.3 | 13.7 | 19.0 | 13.1 | 8.2 | 8.2 | 11.7 | 18.1 | 16.6 |

- New-build MW standing against the 25-day base (out/mga2/d18/summary.json):

  | Year | Days | Wind | Solar | Lithium MW | Lithium MWh | LDES | Coal | Gas |
  |---|---|---|---|---|---|---|---|---|
  | 2030 | 25 | 8,468 | 6,976 | 1,707 | 3,719 | 0 | 32,213 | 0 |
  | 2030 | 18 | 9,746 | 9,217 | 1,698 | 3,719 | 0 | 31,931 | 0 |
  | 2040 | 25 | 39,918 | 23,927 | 8,716 | 43,325 | 1,650 | 17,670 | 6,533 |
  | 2040 | 18 | 40,489 | 24,209 | 8,203 | 42,759 | 1,650 | 17,388 | 6,688 |

- Wind 2040 minimum on the 18-day base (MGA_FSTAR 1,501,917,683,865.2021), cold, parallel dual simplex on 2 threads, 16:05-17:57
  UTC beside the warm start: stopped at its 6,694 s (111.6 min) limit, not solved, no valid basis to resume from. So 18 days
  halves the base's solve but does not bring the MGA solve inside a piece.

### 3. Presolve off (out/mga2/nopre)

Wind 2040 minimum at 25 days, cold, parallel dual simplex on 2 threads with presolve off (HIGHS_OPTS
'{"simplex_strategy":2,"threads":2,"presolve":"off"}'), from 17:58 UTC beside the warm start; to be carried across pieces if a valid
basis survives the limit:
piece 1, 17:58-19:50 UTC beside the warm start: stopped at its 6,694 s (111.6 min) limit, not solved; a valid basis kept. Piece 2
resumed from it at 19:51 UTC; 19:51-21:43 UTC, not solved, basis kept. Piece 3 from 21:43 UTC with HiGHS's log on
(out/mga2/nopre/highs_p3.log): dual feasible, 152,434 primal infeasibilities at its start, dual objective -5,260 (a lower bound on
wind standing with the perturbed costs): far from the optimum after 224 minutes. At 2,673 s into piece 3 the dual objective was
-3,859, rising about 30 a minute, with 155,245 primal infeasibilities. The container restarted at 22:28 UTC and piece 3 was lost;
it restarted from the 21:43 basis at 22:29 UTC. Piece 3, 22:29-00:21 UTC: not solved, dual objective 8,888 at its end (rising about
100 a minute), 160,621 primal infeasibilities; basis kept. Piece 4 from 00:22 UTC. HiGHS's log names simplex_strategy 2 as SIP, the
task-parallel dual simplex, with concurrency 8 on 2 threads.

### Summary

To follow when the warm start and presolve off finish.
