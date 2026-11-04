# Test 15, two stages: results (message 691 (f); basis from message 693)

Draft, filled in as the runs go. Times UTC.

Status (user, 4 Nov 2026): the metered tracking twin on this basis has been found misshapen and is being fixed. These runs stand as a method
and timing comparison with one stage, not as a mix for use.

Settings (all entries below unless stated): branch claude/test15-two-stage-x2xqfl (the brief's claude/test15-two-stage; the session is tied
to this name), made from origin/claude/weather-fixes f9e3e4c, with origin/claude/weather-fixes 75f7203 merged on 4 Nov 2026 (0621c45: FIX_FROM
fixes the VPP and geyser enrolment too, the six-constant wind table, LOOP_YEAR_ONLY). Build 2026-11-04a; index.html unchanged. From harness/:
`bash pathway/test15.sh <run>` (one piece of pathway/two_stage.sh, under 2 hours; RESUME=1 with JOB_DEADLINE, as chain_c7.sh). Settings:
`source pathway/env_c6a.sh; GAS_FIRST=2035 SS=inertia SS_FC=reservecoal COC=blended BTM_STOCK=8 VPP=1 GY=1 COAL_FUEL_ESC=3 COAL_FOM_ESC=1.1
COMPLY=compromise COAL_CARBON_FLOOR=1 SOLVER=native REP_REF=metered REP_EXTREMES=20,161,162,163,187,188,194,195,196,214,218,358 WX_WINDCORR=1
WX_WINDCORR_TABLE=pathway/wx/wind_corr_table_calm6.json CONG_OFF=1 K=4 N=25 FIRST=2026`; no WIN_FROM. Fossil-free adds `PACE=grid LI_CAP=4000
LI_EH=8 IA_TOTAL=5000 FOSSIL_END=2039`; the review's variant adds `ANNUITY_TO=2040`. MAXP is env_c6.sh's 6, which two_stage.sh passes on: the
adequacy loop tests every year in the step's window, and a failing year adds stress windows and the step solves again (message 693 (4), (5)).
Each step: year y on 365 days, the look-ahead years to min(y+4, 2040) at 25 clustered days, linked storage, earlier years' builds fixed
(FIX_FROM). Native HiGHS 1.15.1 (highspy), Node 22.23.4; a 4-core machine with 15 GB memory, at most two solves at a time. Nothing reads
ESK19679. Step files, logs and progress.txt (each step's node PID, each solve's wall time to the 15-second poll, peak memory) are in
harness/pathway/test15/<run>/.

From 13:29 UTC on 4 Nov 2026 (message 698): origin/claude/wind-table merged (871feec; build 2026-11-04b, the enrolment round-off fix: an
enrolment below zero by no more than 1e-6 MW reads as zero, a larger negative stops), with highs_native.py's HIGHS_OPTS (118bd45) and
HIGHS_OPTS={"simplex_strategy": 2, "threads": 2} (parallel dual simplex on 2 threads a run); before, HiGHS's default serial dual simplex.
The step 2026 LP dumps (DUMP_STOP=1) to the key recorded for ts2_central's step 2026 (1faa0496d2d6acf710e3cc110ba4f7ef07904b25) on the
code before and after the merge (the LP files byte-identical), so the finished steps stand. Each piece's first line in progress.txt names
its solver; the step tables below give each step's. No new step starts with under 4,800 s of the piece left (2,700 s before 12:38 UTC).

### Test 8 for comparison: the one-stage pathway on the same basis (main session; message 692 (f))

Settings: as above but one stage, the whole 2026-2040 pathway at 25 clustered days (REP_WEIGHTS=clustered REP_DAYS=25 STORAGE_LINK=1, the
same reference, extremes, wind table and CONG_OFF=1), MAXP=6; main d90ba63 with test 13's HIGHS_OPTS (118bd45), parallel dual simplex
(simplex_strategy 2, threads 2), alone on a 4-core machine. Pass-1 LP key 8e0651f38a, the same LP as test 13's base on this basis. Output
in the main session's container (harness/out/test8p/c7_d25.json), not committed.

- Passes: 1, adequate at pass 1. Solve 4,527 s (LP written 11:13:14 UTC, solved 12:28:41); the whole run 4,864 s. Objective R1,521.522bn.
- The loop's engine at pass 1 (2 draws a weather year), mean GWh against 20: 2026-2029 0; 2030 2.3; 2031 5.0; 2032 3.2; 2033 7.8; 2034
  17.0; 2035 16.7; 2036 12.6; 2037 10.7; 2038 8.4; 2039 11.6; 2040 18.8.
- Year 2028's own build, against step 2028 above: wind 1,222 MW (two stages 2,500), solar 1,129, rooftop 1,200, lithium 0 MW / 660 MWh.
- Cumulative new build, MW (lithium MW / MWh):

| | 2030 | 2035 | 2040 |
|---|---:|---:|---:|
| Wind | 8,468 | 25,968 | 39,918 |
| Solar | 6,976 | 17,400 | 23,927 |
| Lithium | 1,708 / 3,719 | 8,228 / 27,059 | 8,717 / 43,326 |
| Open-cycle gas / diesel | 0 / 0 | 0 / 506 | 3,950 / 2,582 |
| CCGT | 0 | 0 | 0 |
| Iron-air; pumped storage | 0; 0 | 0; 0 | 150; 1,500 |

- Coal retired early: 220 MW from 2029. The engine's reliability gate on this build (pathcheck, adaptive draws, 2030-2040) is running.

### Step 2028 with the loop testing year 2028 only, against every year in the window (message 693 (5))

The central's step 2028 run twice from the same state, at the same time on the same machine: once as the pathway runs it (every year
2026-2032 tested), once with LOOP_YEAR_ONLY=1 (year 2028 only) on a copy of out/ts2_central made after step 2027 (its step_2026.json and
step_2027.json; two_stage.sh rebuilt fixed.json from them, equal to the central's, 50 entries). Each with its own empty LP cache. Started
11:31 UTC.

| | Every year in the window tested | Year 2028 only (LOOP_YEAR_ONLY=1) |
|---|---:|---:|
| Solves | 1 | 1 |
| Verdict | adequate at pass 1 | adequate at pass 1 |
| Solve wall time, min | 20.5 | 20.6 |
| Step wall time, min | 23.9 | 21.7 |
| Peak memory, GB | 2.7 | 2.7 |
| Objective, Rbn | 554.393 | 554.393 |
| Wind, MW | 2,500 | 2,500 |
| Solar, MW | 1,129 | 1,129 |
| Rooftop, MW | 1,200 | 1,200 |
| Lithium, MW / MWh | 0 / 660 | 0 / 660 |
| Grid-forming, MW | 139 | 139 |
| VPP enrolment, GWh; geyser control, MW | 0; 0 | 0; 0 |
| Coal standing, MW | 39,692 | 39,692 |

- Identical: the same single LP, so the same builds in every year of the window (every exact build column equal) and the same objective.
  The 2.2 minutes between them is the adequacy test on the four look-ahead years.
- Every year passed at pass 1. Mean unserved a year against the 20 GWh standard, worst weather year in brackets: 2028 0.00 (2014, 0.0 GWh);
  2029 0.11 (2018, 1.2); 2030 9.67 (2018, 69.0); 2031 8.20 (2015, 56.4); 2032 15.38 (2019, 125.9). Year 2028 does not tell the two ways
  apart on this basis; a step whose look-ahead year fails would.
- Caveat: one step. The main runs keep every year tested (message 693 (5)).

### The first basis, REP_REF=2025: stopped at step 2028, kept for the record (message 693 (1))

Settings: as above but `REP_REF=2025 REP_EXTREMES=113,114,115,141,161,162,163,187,188,214,217,218,219,257,273,359`, no WX_WINDCORR, no
CONG_OFF, before the merge (f9e3e4c, FIX_FROM fixing builds but not the VPP or geyser enrolment). Run 07:47-09:56 UTC; files in
harness/pathway/test15/ts_central and ts_ff.

| Step | Central | Fossil-free |
|---|---|---|
| 2026 (to 2030) | adequate at pass 1; solve 9.5 min, step 12.2 min, 2.6 GB | adequate at pass 1 |
| 2027 (to 2031) | adequate at pass 1; solve 14.5 min, step 17.5 min, 2.7 GB | adequate at pass 1 |
| 2028 (to 2032) | pass 1 (solve 36.4 min): 2032 at 21.32 against 20 GWh; three windows added (2019 day 135, 2021 day 327, 2018 day 81). Pass 2 solved (cut at the piece's deadline, resumed from its basis), then stopped on the VPP check below | pass 1: 2031 at 25.06 and 2032 at 38.77 against 20 GWh; six windows added. Pass 2 solved, then stopped on the same check |

- New build, both runs alike: 2026 wind 287, solar 156, lithium 360 MW / 1,440 MWh (the committed floors); 2027 wind 1,959, solar 2,120,
  lithium 401 MW / 1,619 MWh. Coal standing 39,692 MW both years, none retired early.
- The stop: pass 2's solution held the 2028 VPP enrolment (vppp_2028) at -9.07e-11 MW, within the solver's feasibility tolerance (1e-7), and
  the engine's adequacy test rejects any enrolment below zero (index.html 8627, `vppEnrolGWh must be 0 or more: -2.27e-13`; Fossil-free
  -2.01e-13). Its cap check beside it allows 1e-4 GWh; the zero check allows none. Every relaunch would stop at the same place (the solve is
  cached). Since the merge, FIX_FROM also fixes the enrolment, so a tiny negative fixed in one step would reach every later step's test.
  Decision (user, 4 Nov 2026): the fix goes on claude/wind-table (a value negative within the solver's tolerance reads as zero; a larger
  negative still stops, with a check), and this test moves to that branch's head when it lands; no local patch. A run that stops on the check
  before then is left stopped.

### The central, Fossil-free and the central with ANNUITY_TO=2040 (message 693 (6))

Running, central first, then Fossil-free, the annuity run last (user, 4 Nov 2026). The tables between the markers are regenerated after
each finished step from `python3 -I pathway/test15_summary.py out/ts2_central out/ts2_ff out/ts2_central_ann` (one-stage brackets: the main
session's section above).

#### A stopped second solve resumed from the first solve's basis (found and fixed 4 Nov 2026, 5b98fd3)

- The fault: with RESUME, every solve wrote its basis to /tmp/gtza_<node PID>.basis.json. A solve stopped at the piece's deadline whose basis
  HiGHS marks invalid (simplex inside presolve) writes none, so the first pass's optimal basis, still in that file, was kept as the second
  pass's resume basis (<key>.partial.basis.json), and the next piece logged 'start from basis' for it. Answers are still optima of the
  right LP (HiGHS repairs it as an alien basis and solves to optimality), but the resume claim was wrong and the start was a warm start.
- The fix (pathway_perfail.js, harness only): each solve's basis is written under its own LP key, any file of that name removed first; the
  log says resume from this LP's own basis, warm start, or cold. LP keys unchanged (step 2026's dumps to 1faa0496d2 after it).
- Affected: ts2_ff step 2028, pass 2 (kept at 13:28, resumed 13:30, optimal in 884 s; finished, adequate): very likely, not confirmable (the
  file is removed on success); same objective, builds could differ only if the LP has more than one optimal build; not re-solved cold (user,
  4 Nov 2026: the affected steps are recorded, and the runs restart on the fixed tracking twin anyway). ts2_central step 2029, pass 2: the kept file was pass 1's (written 13:31:17, pass 2
  stopped 14:13); moved aside, so pass 2 starts cold. ts2_central_ann step 2027, pass 2: pass 1's (written 14:50:55), resumed 15:07,
  optimal in 417 s; its builds chose pass 3's stress windows. Its pass 5 (cut at 16:39, in a process started before the fix) kept pass 4's
  basis (written 16:18:41) the same way; moved aside, so pass 5 starts cold. The first basis (ts_central step 2028, pass 2, confirmed; ts_ff step 2028,
  pass 2, likely) is record only.

#### Solver timing

No clean comparison yet (the same LP both ways under the same load). Rough pairs, different LPs: Fossil-free step 2029 on parallel 48.8 min
against the central's step 2029 pass 1 on serial 52.4 min, each beside one other solve; the annuity run's step 2026 on parallel 15.9 min
beside one other solve, against the central's step 2026 on serial 8.5 min alone. The clean test (user, 4 Nov 2026): step 2026's LP
(1faa0496d2) solved both ways, each alone on the machine, when the runs leave it idle.

<!-- test15_summary start -->
#### ts2_central (4 of 15 steps)

Fixed builds carried unchanged into later steps: yes, every one

ts2_central: new build by year, MW (lithium also MWh)

| Year | wind | solar | lithium MW | lithium MWh | grid-forming |
|---|---:|---:|---:|---:|---:|
| 2026 | 287 | 156 | 360 | 1,440 | 0 |
| 2027 | 1,959 | 2,120 | 401 | 1,619 | 0 |
| 2028 | 2,500 | 1,129 | 0 | 660 | 139 |
| 2029 | 2,500 | 3,063 | 395 | 0 | 332 |
| 2030 |  |  |  |  |  |
| 2031 |  |  |  |  |  |
| 2032 |  |  |  |  |  |
| 2033 |  |  |  |  |  |
| 2034 |  |  |  |  |  |
| 2035 |  |  |  |  |  |
| 2036 |  |  |  |  |  |
| 2037 |  |  |  |  |  |
| 2038 |  |  |  |  |  |
| 2039 |  |  |  |  |  |
| 2040 |  |  |  |  |  |
| Total | 7,246 | 6,468 | 1,156 | 3,719 | 471 |

ts2_central: coal standing (MW), coal retired ahead of its dates (MW) and kept under the compliance case (MW), year y of each step

| Year | Coal standing | Retired early | Compliance MW kept |
|---|---:|---:|---:|
| 2026 | 39,692 | 0 |  |
| 2027 | 39,692 | 0 |  |
| 2028 | 39,692 | 0 |  |
| 2029 | 33,564 | 3,463 |  |

ts2_central: each step (year y on 365 days, the look-ahead years at 25 days)

| Step | Horizon | Passes | Verdict | Solver | Solve wall time, min (each solve, cut ones included) | Step wall time in its last piece, min | Attempts | Peak memory, GB | Years over the standard, pass by pass (mean GWh / limit) | Objective, Rbn |
|---|---|---:|---|---|---|---:|---:|---:|---|---:|
| 2026 | 2030 | 1 | adequate | serial | 8.5 | 11.0 | 1 | 2.4 | pass 1: none | 553.388 |
| 2027 | 2031 | 1 | adequate | serial | 14.0 | 17.0 | 1 | 2.5 | pass 1: none | 551.848 |
| 2028 | 2032 | 1 | adequate | serial | 20.5 | 23.9 | 1 | 2.7 | pass 1: none | 554.393 |
| 2029 | 2033 | 2 | adequate | serial, then parallel, 2 threads | 41.9, 52.4, 38.8, 40.7 | 48.4 | 3 | 3.4 | pass 1: 2032: 21.3 / 20<br>pass 2: none | 567.399 |
| 2030 | | | not finished |  |  | | 1 | | | |

ts2_central: the adequacy test on each step's own year y at its final pass (mean unserved GWh a year against the limit)

| Year | Pass 1 mean / limit | Final pass mean / limit | Worst weather year (GWh) |
|---|---|---|---|
| 2026 | 0.00 / 20 | 0.00 / 20 | 2014 (0.0) |
| 2027 | 0.00 / 20 | 0.00 / 20 | 2014 (0.0) |
| 2028 | 0.00 / 20 | 0.00 / 20 | 2014 (0.0) |
| 2029 | 0.44 / 20 | 0.43 / 20 | 2018 (3.3) |

#### ts2_ff (5 of 15 steps)

Fixed builds carried unchanged into later steps: yes, every one

ts2_ff: new build by year, MW (lithium also MWh)

| Year | wind | solar | lithium MW | lithium MWh | grid-forming |
|---|---:|---:|---:|---:|---:|
| 2026 | 287 | 156 | 360 | 1,440 | 0 |
| 2027 | 1,959 | 2,120 | 401 | 1,619 | 0 |
| 2028 | 1,605 | 1,129 | 0 | 660 | 0 |
| 2029 | 4,300 | 2,265 | 616 | 0 | 475 |
| 2030 | 4,300 | 4,759 | 2,358 | 2,320 | 1,771 |
| 2031 |  |  |  |  |  |
| 2032 |  |  |  |  |  |
| 2033 |  |  |  |  |  |
| 2034 |  |  |  |  |  |
| 2035 |  |  |  |  |  |
| 2036 |  |  |  |  |  |
| 2037 |  |  |  |  |  |
| 2038 |  |  |  |  |  |
| 2039 |  |  |  |  |  |
| 2040 |  |  |  |  |  |
| Total | 12,451 | 10,429 | 3,735 | 6,039 | 2,246 |

ts2_ff: coal standing (MW), coal retired ahead of its dates (MW) and kept under the compliance case (MW), year y of each step

| Year | Coal standing | Retired early | Compliance MW kept |
|---|---:|---:|---:|
| 2026 | 39,692 | 0 |  |
| 2027 | 39,692 | 0 |  |
| 2028 | 39,692 | 0 |  |
| 2029 | 32,419 | 4,608 |  |
| 2030 | 27,825 | 4,608 |  |

ts2_ff: each step (year y on 365 days, the look-ahead years at 25 days)

| Step | Horizon | Passes | Verdict | Solver | Solve wall time, min (each solve, cut ones included) | Step wall time in its last piece, min | Attempts | Peak memory, GB | Years over the standard, pass by pass (mean GWh / limit) | Objective, Rbn |
|---|---|---:|---|---|---|---:|---:|---:|---|---:|
| 2026 | 2030 | 1 | adequate | serial | 9.1 | 11.9 | 1 | 2.3 | pass 1: none | 551.282 |
| 2027 | 2031 | 1 | adequate | serial | 14.2 | 17.1 | 1 | 2.7 | pass 1: none | 547.440 |
| 2028 | 2032 | 2 | adequate | serial, then parallel, 2 threads | 34.9, 27.1, 14.7 | 20.8 | 2 | 4.2 | pass 1: 2031: 21.7 / 20<br>pass 2: none | 551.013 |
| 2029 | 2033 | 1 | adequate | parallel, 2 threads | 48.8 | 52.6 | 1 | 2.8 | pass 1: none | 559.786 |
| 2030 | 2034 | 1 | adequate | parallel, 2 threads | 67.9 | 72.0 | 2 | 2.6 | pass 1: none | 585.201 |
| 2031 | | | not finished |  |  | | 1 | | | |

ts2_ff: the adequacy test on each step's own year y at its final pass (mean unserved GWh a year against the limit)

| Year | Pass 1 mean / limit | Final pass mean / limit | Worst weather year (GWh) |
|---|---|---|---|
| 2026 | 0.00 / 20 | 0.00 / 20 | 2014 (0.0) |
| 2027 | 0.00 / 20 | 0.00 / 20 | 2014 (0.0) |
| 2028 | 0.00 / 20 | 0.00 / 20 | 2014 (0.0) |
| 2029 | 0.15 / 20 | 0.15 / 20 | 2020 (1.4) |
| 2030 | 4.14 / 20 | 4.14 / 20 | 2024 (36.8) |

#### ts2_central_ann (1 of 15 steps)

Fixed builds carried unchanged into later steps: yes, every one

ts2_central_ann: new build by year, MW (lithium also MWh)

| Year | wind | solar | lithium MW | lithium MWh |
|---|---:|---:|---:|---:|
| 2026 | 287 | 156 | 360 | 1,440 |
| 2027 |  |  |  |  |
| 2028 |  |  |  |  |
| 2029 |  |  |  |  |
| 2030 |  |  |  |  |
| 2031 |  |  |  |  |
| 2032 |  |  |  |  |
| 2033 |  |  |  |  |
| 2034 |  |  |  |  |
| 2035 |  |  |  |  |
| 2036 |  |  |  |  |
| 2037 |  |  |  |  |
| 2038 |  |  |  |  |
| 2039 |  |  |  |  |
| 2040 |  |  |  |  |
| Total | 287 | 156 | 360 | 1,440 |

ts2_central_ann: coal standing (MW), coal retired ahead of its dates (MW) and kept under the compliance case (MW), year y of each step

| Year | Coal standing | Retired early | Compliance MW kept |
|---|---:|---:|---:|
| 2026 | 39,692 | 0 |  |

ts2_central_ann: each step (year y on 365 days, the look-ahead years at 25 days)

| Step | Horizon | Passes | Verdict | Solver | Solve wall time, min (each solve, cut ones included) | Step wall time in its last piece, min | Attempts | Peak memory, GB | Years over the standard, pass by pass (mean GWh / limit) | Objective, Rbn |
|---|---|---:|---|---|---|---:|---:|---:|---|---:|
| 2026 | 2030 | 1 | adequate | parallel, 2 threads | 15.9 | 18.4 | 1 | 2.5 | pass 1: none | 677.140 |
| 2027 | | | not finished | parallel, 2 threads | 16.8, 10.3, 7.0, 29.0, 29.2, 18.0 | | 2 | | | |

ts2_central_ann: the adequacy test on each step's own year y at its final pass (mean unserved GWh a year against the limit)

| Year | Pass 1 mean / limit | Final pass mean / limit | Worst weather year (GWh) |
|---|---|---|---|
| 2026 | 0.00 / 20 | 0.00 / 20 | 2014 (0.0) |

Cumulative new build, MW (lithium also MWh), built 2026 to the year

| Technology | Year | ts2_central | ts2_ff | ts2_central_ann |
|---|---|---:|---:|---:|
| wind | 2030 |  | 12,451 |  |
| wind | 2035 |  |  |  |
| wind | 2040 |  |  |  |
| solar | 2030 |  | 10,429 |  |
| solar | 2035 |  |  |  |
| solar | 2040 |  |  |  |
| lithium MW | 2030 |  | 3,735 |  |
| lithium MW | 2035 |  |  |  |
| lithium MW | 2040 |  |  |  |
| lithium MWh | 2030 |  | 6,039 |  |
| lithium MWh | 2035 |  |  |  |
| lithium MWh | 2040 |  |  |  |
| grid-forming | 2030 |  | 2,246 |  |
| grid-forming | 2035 |  |  |  |
| grid-forming | 2040 |  |  |  |
<!-- test15_summary end -->

### Against the one-stage pass 1 at 25 days (for the main session)

The main session adds the one-stage column from harness/out/test8/c7_d25.json (not in this session):
`python3 -I pathway/test15_summary.py out/ts2_central out/ts2_ff out/ts2_central_ann --one-stage ts2_central=out/test8/c7_d25.json`
(the label must equal the run folder's name; the one-stage figure is shown in brackets where it differs by 1 MW or more). If c7_d25 ran on
c7's settings as the brief gave them (REP_REF=2025, no WX_WINDCORR or CONG_OFF), the comparison mixes the basis change with the two-stage
change; not checked here (the file is not in this session). No Fossil-free one-stage file was named.
