# Test 15, two stages: results (message 691 (f); basis from message 693)

Draft, filled in as the runs go. Times UTC.

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

Running; tables to follow from `python3 -I pathway/test15_summary.py out/ts2_central out/ts2_ff out/ts2_central_ann`.

### Against the one-stage pass 1 at 25 days (for the main session)

The main session adds the one-stage column from harness/out/test8/c7_d25.json (not in this session):
`python3 -I pathway/test15_summary.py out/ts2_central out/ts2_ff out/ts2_central_ann --one-stage ts2_central=out/test8/c7_d25.json`
(the label must equal the run folder's name; the one-stage figure is shown in brackets where it differs by 1 MW or more). If c7_d25 ran on
c7's settings as the brief gave them (REP_REF=2025, no WX_WINDCORR or CONG_OFF), the comparison mixes the basis change with the two-stage
change; not checked here (the file is not in this session). No Fossil-free one-stage file was named.
