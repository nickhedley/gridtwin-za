# Test 15, two stages: results (message 691 (f); basis from message 693)

Final for this basis (5 Nov 2026). Times UTC.

## Summary

- Where the runs stopped: the central finished all 15 steps; Fossil-free stopped at step 2033 (7 of 15) and the annuity variant at step
  2029 (3 of 15), each cut twice by the piece deadline. Decision (user, 5 Nov 2026): both left stopped; no relaunch on this basis.
- Why they stopped: a step that needs several passes of 30 to 50 min outlasts one 110-min piece, and a solve cut at the deadline with
  presolve on keeps no valid basis (serial and parallel alike; tested 5 Nov, 'Message 724' below), so the next piece starts that pass again
  cold.
- Time, the central: 14.7 h from its first piece to its last step, 11.3 h of it solving (21 solves, cut ones included), on a machine shared
  with a second run; the one-stage pathway on the same basis took 1.35 h (4,864 s) alone.
- Mix, the central by 2040, two stages against one stage: wind 41,483 against 39,918 MW; solar 26,618 against 23,927; lithium 11,464 MW /
  64,950 MWh against 8,717 / 43,326; OCGT gas 5,272 against 3,950; OCGT diesel 1,658 against 2,582; CCGT 553 against 0; iron-air 300
  against 150; pumped storage 1,500 both. Coal retired early 3,463 MW from 2029 against 220 MW.
- Solver: on step 2026's LP alone on the machine, parallel dual simplex took 708.8 s against serial's 438.8 s, with the same answer
  (Solver timing, below).
- Caveat: the metered tracking twin on this basis is misshapen (status below), so these figures compare method and time, not mixes for use.
- Next (user, 5 Nov 2026): the runs restart on the fixed tracking twin when the main session's restart message comes; it sets the solver on
  the final LP key, probably after a clean timing on a larger step. Planned: the central, Fossil-free and Deep; the annuity variant only if
  time allows. pathway/test15.sh has no Deep run yet; its settings come with the restart message.


## Message 724 (5-6 Nov 2026): the two-stage central on claude/twin-retime; why two runs stopped; what Deep needs

Times UTC. In progress; updated as it runs.

### (a) The two-stage central on claude/twin-retime, build 2026-11-05j

- Code: worktree /home/user/gtza-retime, claude/twin-retime dea3623 (build 2026-11-05j), index.html unchanged; one harness change, this
  branch's basis-file fix (5b98fd3: each solve's basis under its own LP key), applied uncommitted there and recorded here
  (harness/pathway/test15/retime/harness.patch). Script: harness/pathway/test15_retime.sh central; output in the worktree,
  harness/out/tsr_central (copied here when steps finish).
- Settings, read by the script, not retyped, snapshot once to tsr_central/settings.env: run (6)'s as claude/c7-runs be17d91 records them
  for the pass with every change (harness/pathway/final/README.md; the fin pass is that pass plus coal's part-load and the verdict rule,
  message 713): c7's settings (checked against chain_c7.sh's C7 line), env_c6a.sh, GAS_FIRST=2035, WX_WINDCORR=1 CONG_OFF=1
  REP_REF=metered and the old extreme-day list (20,161,162,163,187,188,194,195,196,214,218,358); the verdict rule (VERDICT_TOPUP,
  env_c6.sh on the branch); coal's part-load (FIXED.bldCoalPartLoad) and the curtailment price 0 (FIXED.lpCurtailCostR) are the build's
  defaults; the row's 'parallel dual simplex, presolve off' as HIGHS_OPTS {"simplex_strategy": 2, "threads": 2, "presolve": "off"}.
- Choices (724 (d), the one closest to accuracy): the row's MAXP=1 not taken: each step loops to the standard with env_c6.sh's MAXP=6, as
  test 15 ran (message 693 (4), (5)). The fin pass ran on build 05h; this runs on 05j as asked, so a comparison includes 05i and 05j's Avon
  and Dedisa changes.
- Started 5 Nov 20:01. PIDs per piece in progress.txt. Its tables are the first between the markers below (tsr_central).
- Step 2030: adequate at pass 2 (pass 1: 2034 at 20.20 GWh against 20; pass 2: 3.25). Solves: pass 1 about 48 min over two pieces (cut
  with its basis kept, 074bb0e202, resumed for 3 min), pass 2 64.1 min cold. Wind 2,500 MW, solar 3,277, lithium 2,013 MW / 384 MWh,
  grid-forming 1,142; coal 29,256 MW standing, 3,177 retired early.
- Step 2035: adequate at pass 1 (2035 at 19.28 GWh against 20). Its solve started with 18 min left in piece 11, was cut with its basis kept
  (15716dd566) and finished 36 min into piece 12 (55 min in all). Wind 3,500 MW, solar 551, lithium 364 MW / 2,822 MWh, grid-forming 86;
  coal 22,739 MW standing, 3,177 retired early.
- Step 2034: adequate at pass 2 (pass 1: 2034 at 22.92 GWh against 20; pass 2: 7.41). Pass 1 77.4 min cold; pass 2 warm, cut at piece
  10's deadline after 10 min with its basis kept (1747961ad4) and resumed in piece 11 for 8.6 min. Piece 11 first replayed pass 1 from the
  cache and re-ran its adequacy test (30 min): each piece that resumes a later pass re-runs the earlier passes' tests, now 25 to 30 min
  each with the verdict rule's top-ups (a harness change could keep each pass's test with its cached solution; not made mid-run). Wind
  3,500 MW, solar 3,647, lithium 1,827 MW / 11,794 MWh, OCGT diesel 1,000; coal 23,290 MW standing, 3,177 retired early.
- Step 2033: adequate at pass 2 (pass 1: 2034 at 21.21 GWh against 20; pass 2: 7.56; 2033 itself 17.72 and 2037 17.46 at pass 2). Pass 1
  70.8 min over two pieces (cut at piece 8's deadline with its basis kept, e9f72ec706, resumed in piece 9); pass 2 9.4 min warm; the
  adequacy tests about 30 min a pass. Wind 3,500 MW, solar 1,151, lithium 1,157 MW / 9,748 MWh, grid-forming 164; coal 24,944 MW standing,
  3,177 retired early.
- Step 2032: adequate at pass 2 (pass 1: 2034 at 20.42 GWh against 20; pass 2: 6.81). Pass 1 75.2 min cold; pass 2 7.2 min warm. Piece 7
  (PID 25225) was stopped by the job's 2-hour limit at 06:06 during pass 2's adequacy test (the test with the verdict rule's top-ups took
  about 24 min a pass here); piece 8 (06:06, PID 4921) replayed both passes from the cache and finished the step at 06:54. From piece 8
  each piece is 6,000 s (PIECE_S), leaving room for a test after a late solve; scheduling only. Wind 3,500 MW, solar 3,752, lithium 1,380
  MW / 11,234 MWh, grid-forming 1,117; coal 26,046 MW standing, 3,177 retired early.
- Step 2031: adequate at pass 2 (pass 1: 2034 at 20.22 GWh against 20; pass 2: 3.28). Pass 1 73.1 min cold; pass 2 6.0 min warm from
  pass 1's basis. Wind 3,500 MW, solar 3,506, lithium 2,582 MW / 11,404 MWh, grid-forming 497; coal 27,699 MW standing, 3,177 retired
  early.
- From piece 6 (02:19 on 6 Nov, PID 12605): WARM=1, so a step's later passes start from the previous pass's basis (recorded in each piece
  line). It changes no LP and no LP key; the optimum's cost is the same, and the builds differ only where the LP has more than one optimal
  build. Chosen for time: Fossil-free's fix test solved a warm pass in 14 min against 99 min cold (above).
- Container restart at about 00:48 on 6 Nov, 1 min after step 2030's pass 1 solved (cached, 074bb0e202): piece 5 (00:49, PID 240) replayed
  it from the cache; pass 1 found 2034 at 20.20 GWh against 20 (three windows added), pass 2 started cold.
- Step 2029: adequate at pass 1 (test 15's central needed two passes here); its solve cut at piece 2's deadline at 23:08 after 28 min with
  its basis kept (977b43a165), resumed in piece 3 ('resume from this LP's own basis') and optimal 33 min later; step 49.3 min in its last
  piece. The verdict rule at work: 2031 at 17.79 GWh on 2 draws, 15.58 on 10, 15.74 on 20; 2033 at 5.20, 10.68, 13.27. Wind 2,500 MW,
  solar 3,063, lithium 438 MW / 0 MWh, grid-forming 330; coal 33,850 MW standing, 3,177 retired early.
- Step 2028: adequate at pass 1; solve 52.4 min, step 66.2 min; wind 2,500 MW, solar 1,129, lithium 0 MW / 660 MWh, grid-forming 15.
- Steps 2026 and 2027: adequate at pass 1, the committed floors (wind 287 and 1,959 MW, solar 156 and 2,120, lithium 360 MW / 1,440 MWh
  and 401 / 1,619); solves 33.2 and 40.2 min with presolve off, steps 41.2 and 50.1 min (the loop's checks with the verdict rule's
  top-ups about 8 to 10 min a step). Test 15's central took 8.5 and 14.0 min to solve the same steps with presolve on, on the old key, so
  this run is slower per step; the presolve and key effects are not separated yet.

### (b) Why Fossil-free stopped at step 2033 and the annuity variant at step 2029

1. A solve cut at a piece's deadline with presolve on keeps no valid basis, on either solver, so the next piece starts that pass cold.
   Test (harness/pathway/test15/retime/basis_at_limit.py, step 2026's LP 1faa0496d2, 120 s limit, each case alone in turn):

   | Solver | Presolve on | Presolve off |
   |---|---|---|
   | Serial | no valid basis (71,127 iterations) | valid basis (258,835) |
   | Parallel, 2 threads | no valid basis (71,846) | valid basis (128,926) |

   The step logs agree: ts2_ff step 2033 and ts2_central_ann step 2029 each ended 'stopped at the job deadline; no valid basis, the next
   piece starts cold'. With presolve off a cut solve keeps its basis and the next piece resumes it (704 (f); run (4) and the 55-day LP in
   the main session). Earlier wording here put this on the parallel solver; it is presolve.
2. Why those steps needed so many long passes: the loop tests every year in the step's window (message 693 (5)), and in both steps only the
   farthest look-ahead year failed; the step's own year passed at pass 1. That year started further over the standard than in any central
   step, and each pass's three 14-day windows caught less of the shortfall, while each pass's LP grew:

   | Step | Failing year, mean GWh against 20, by pass | Shed in the windows added, GWh, by pass | Solve, min, by pass |
   |---|---|---|---|
   | ts2_ff 2033 | 2037: 36.39, 33.43 | 363, 185, 86; 58, 56, 45 | 41.3, 50.8, then cut |
   | ts2_central_ann 2029 | 2033: 44.88 (and 2032: 20.23), 26.04, 23.30, 22.92, 22.09 | 170-50 (six); 77-43; 98-18; 82-11; 8, 8, 7 | 16.8, 28.6, 31.8, 32.9, 37.9, then cut |
   | ts2_central 2029 (for scale) | 2032: 21.28, then none | 152, 88, 45 | |

   With the loop testing year y only (LOOP_YEAR_ONLY=1), both steps would have ended at pass 1; that is a method choice (693 (5) kept
   every year tested), reported, not applied.
3. Fix test beside (a), on each run's own basis and code (build 2026-11-04b), HIGHS_OPTS as (a) (presolve off), WARM=1, pieces of 6,600 s:
   - ts2_central_ann step 2029: passes 1 to 5 from the LP cache; pass 6 started cold at 20:29 with 4,618 s, was stopped at the piece's
     deadline at 21:47 after 77 min and this time kept its basis ('stopped at the job deadline; basis kept for resume b0591c7b8b'). The
     next piece (21:47, PID 22210) replayed passes 1 to 5 and logged 'resume from this LP's own basis': optimal at 22:39 after 33 more
     minutes. The step finished at 22:43: verdict 'pass limit reached' (MAXP=6), 2033 at 21.63 GWh against 20 after 22.09 at pass 5;
     its own year 2029 at 0.04 GWh at pass 1 and at pass 6; year 2029's builds nothing new (wind, solar and lithium 0), coal 37,027 MW.
     The fix gets the step through; the loop on the look-ahead year still ends over the standard. Pass 6 took about 110 min of solving
     with presolve off (two pieces); pass 5, one window smaller, 38 min with presolve on.
   - ts2_ff step 2033: started 22:43 (PID 548), passes 1 and 2 from the cache; pass 3 cold with presolve off, stopped at the deadline at
     00:19 after 86 min with its basis kept (baa6e5b0ff), resumed in the next piece (00:20, PID 20467) and optimal 13.5 min later (about
     99 min in all). Pass 4 started warm from pass 3's basis (WARM=1), was lost to a container restart at about 00:48 after 2 min, started
     warm again in the next piece (00:49, PID 243) and solved in 14.1 min. The step finished at 01:19: verdict 'stall stop' (env_c6.sh's
     STALL=0.1 from pass 4: 31.77 to 31.31 closes under a tenth of the gap); 2037 at 36.39, 33.43, 31.77, 31.31 GWh against 20; its own
     year 2033 at 13.85 throughout; the three windows added after pass 3 held 27.7, 1.5 and 1.5 GWh of shed. Year 2033's builds: wind
     3,500 MW, solar 2,029, lithium 528 MW / 6,768 MWh, grid-forming 2; coal 23,513 MW standing, 4,608 retired early.
   - What presolve off costs, build 05j (harness/pathway/test15/retime/presolve05j.sh, .txt): step 2026's LP dumped with (a)'s settings
     (289bc9a228, the key (a)'s step 2026 solved), parallel dual simplex on 2 threads, beside (a)'s own solve: presolve on 807 s, presolve
     off 1,576 s (1.95 times); same answer (objective within 4.7e-15, all 125 build columns within 2e-12 MW).
   - Result: with presolve off both stopped steps finish, across pieces and a restart; the loop on the look-ahead year ends over the
     standard either way (pass limit, stall). A warm start from the previous pass's basis solved Fossil-free's pass 4 in 14 min against
     pass 3's 99 min cold (different LPs: pass 4 has three more windows).

### What Deep needs beyond its fixed cap

Deep's settings read from chain_c7.sh's deep() line (GAS_CAP=0 OCGD=1 PACE=grid LI_CAP=4000 LI_EH=8 IA_TOTAL=5000 CO2_ELASTIC=50000
CO2CAP=22.809:2035, the cap on 2035-2040), with (a)'s settings, at the chain's first cap (36.382 Mt; structure only), step LPs dumped
without solving (harness/pathway/test15/retime/deep_steps.sh; reports deep_lp_before.txt, deep_lp_patched.txt):

1. Steps 2026 to 2030 stop: 'CO2_ELASTIC: no co2cap_<y> rows (needs CO2CAP or FOSSIL_END)'. No year in their windows is under the cap.
2. The iron-air total counts only the step's free years: step 2031's row is b_ironair_2031 + ... + 2035 <= 5000 and step 2036's 2036 to
   2040, so iron-air fixed by earlier steps is outside it and each step could add 5,000 MW again. Fossil-free (IA_TOTAL=5000) has the same
   row; its two-stage steps to 2032 built no iron-air, so nothing so far is affected.
3. A patch for both (harness only, pathway_perfail.js; harness/pathway/test15/retime/deep_fixes.patch), not applied to any run: the
   total also counts the fixed years' iron-air columns; a window with no year under the cap logs it and prices nothing (still an error
   without CO2CAP or FOSSIL_END). Tested on the same dumps: step 2026 builds its LP; step 2036's row runs 2026 to 2040; HiGHS reads both.
   It changes Fossil-free's and Deep's LP keys (the row's text), not the central's.
4. Also needed: a Deep mode in the run script, the cap fixed from the one-stage Deep's final trial (message 708), and the engine's 2035 CO2
   against 40 Mt reported, with a flag past about 2 Mt. Noted: from step 2036 the row for 2035 (before the step) is empty with its slack,
   harmless.

### (c) Comparison with the fin pass

The fin pass reached claude/c7-runs (f051c9e; harness/pathway/final/pathway_fin_05h.json, engine_fin_05h.json): adequate at pass 1,
objective R1,549.810 bn; engine (K=20) 2030 2.04 GWh (se 0.63), 2035 19.58 (2.19), 2040 11.21 (1.58). Its recorded settings and the
two-stage central's agree in 100 fields; the four that differ are lists over each LP's years (demand, gas, the compliance case's results)
and stage2Year.

The fin pass's side, done on the 05j worktree (scripts and outputs in harness/pathway/test15/retime/compare/):
- Re-cost: the one-stage LP at 25 days with (a)'s settings, pass 1, every build fixed from the fin pass (FIX_FROM, FIX_TO=2040), parallel
  dual simplex on 2 threads with presolve on, 30 min: objective R1,549,810,283,038.68 against the fin pass's own R1,549,810,283,038.70
  (8e-15). The method reproduces the fin pass, and 05i and 05j do not move this LP.
- Engine: pathcheck.js on 05j with the row's settings (K=20 YEARS=2030,2035,2040 LNG=1 GRID=1 SS_FC=reservecoal CONG_OFF=1
  WX_WINDCORR=1), clean environment, 8 min: unserved and CO2 identical to the digit with the fin pass's own check; engine cost 2030
  R242.62 bn against 242.98 (05i and 05j's Avon and Dedisa changes), 2035 and 2040 identical.

Script for the table: harness/pathway/test15_compare.py (the rule read as both: a gap counts when over 250 MW and over 5% of the one-stage
figure). Test 13's 1% ranges: only wind 2040's minimum is measured (24,605 MW, provisional: the old twin); no other range exists yet, so the
rule's third test applies to wind 2040 only and only from below.

2030, final for the mix (steps 2026-2030 fix every build to 2030; step y's year equals step 2040's, checked on test 15's central), engine
on step_2030.json with YEARS=2030 (the same row's settings):

| 2030 | One stage (fin pass) | Two stages | Gap | Outside 5% and 250 MW |
|---|---:|---:|---:|---|
| Wind, MW new from 2026 | 9,746 | 9,746 | 0 | no |
| Solar, MW | 7,179 | 9,745 | +2,566 (+35.7%) | yes |
| Lithium, MW / MWh | 1,588 / 3,719 | 3,212 / 4,103 | +1,624 / +384 | yes / yes |
| Grid-forming, MW | 934 | 1,487 | +553 | yes |
| Coal standing, MW (retired early) | 31,730 (703) | 29,256 (3,177) | -2,474 | yes |
| Engine unserved, GWh (se), limit 20 | 2.04 (0.63) | 7.75 (1.07) | +5.71 | |
| Engine cost, R bn; CO2, Mt; curtailment, TWh | 242.62; 130.9; 1.93 | 241.18; 125.2; 3.31 | | |

In 2030 two stages builds more solar, lithium and grid-forming and retires more coal early; every gap but wind's is outside 5% and 250
MW. The 20-draw engine reads 7.75 against 2.04 GWh (both inside the standard). No headline is called on 20 draws (message 748): the rule
is applied on the 100-draw check below. The loop's own check put 2030 at 1.68 GWh on 2 draws (under the verdict rule's 5 GWh top-up
threshold); the 20-draw check reads 7.75.

2035, final for the mix (steps to 2035 fix every build to 2035), engine on step_2035.json with YEARS=2035:

| 2035 | One stage (fin pass) | Two stages | Gap | Outside 5% and 250 MW |
|---|---:|---:|---:|---|
| Wind, MW new from 2026 | 27,246 | 27,246 | 0 | no |
| Solar, MW | 18,226 | 22,352 | +4,126 (+22.6%) | yes |
| Lithium, MW / MWh | 8,955 / 39,972 | 10,522 / 51,105 | +1,567 / +11,133 | yes / yes |
| OCGT diesel, MW | 0 | 1,000 | +1,000 | yes |
| Grid-forming, MW | 2,947 | 3,351 | +404 | yes |
| Coal standing, MW (retired early) | 25,213 (703) | 22,739 (3,177) | -2,474 | yes |
| Engine unserved, GWh (se), limit 20 | 19.58 (2.19) | 20.16 (2.49) | +0.58 | |
| Engine worst draw, GWh | 182 | 359 | | |
| Engine cost, R bn; CO2, Mt; curtailment, TWh | 270.97; 78.8; 10.36 | 275.56; 70.1; 12.42 | | |

In 2035 two stages again builds more solar, lithium and grid-forming, adds 1,000 MW of diesel open-cycle and retires more coal early;
every gap but wind's is outside the margin. At 20 draws the engine reads 20.16 GWh against 19.58 (inside one standard error; worst draw 359
against 182), at R4.6 bn more engine cost and 8.8 Mt less CO2. 699
(b) is not applied on this: a 0.58 GWh gap at 20 draws cannot decide it (user, 6 Nov 2026, message 748); the rule is applied on the
100-draw check below. The loop's own check read 2035 at 19.28 GWh (step 2035, pass 1).

When the central has all 15 steps: step 2040's output carries every year's build exactly as each
step fixed it (checked on test 15's central: no difference in any year), so it is the engine check's input (pathcheck.js, the fin pass's
20-draw settings, 2030, 2035, 2040). Objective: both builds fixed in the same one-stage LP on 05j (FIX_FROM, all years), so the gap is
the builds' alone. Then the rule of message 699 (b).

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

Run central first, then Fossil-free, the annuity run last (user, 4 Nov 2026). The central finished all 15 steps at 01:43 on 5 Nov: 14.7 h
from its first piece (11:02 on 4 Nov) over 14 pieces, one of them ended by a container restart; 21 solves (cut ones included), 11.3 h of
solve wall time. Fossil-free stopped at step 2033 (21:33 on 4 Nov) and the annuity run at step 2029 (04:09 on 5 Nov), both left stopped
(user, 5 Nov 2026; below). The tables between the markers were regenerated after each finished step from `python3 -I
pathway/test15_summary.py out/ts2_central out/ts2_ff out/ts2_central_ann` (one-stage brackets: the main session's section above).

#### A stopped second solve resumed from the first solve's basis (found and fixed 4 Nov 2026, 5b98fd3)

- The fault: with RESUME, every solve wrote its basis to /tmp/gtza_<node PID>.basis.json. A solve stopped at the piece's deadline whose basis
  HiGHS marks invalid (simplex inside presolve) writes none, so the first pass's optimal basis, still in that file, was kept as the second
  pass's resume basis (<key>.partial.basis.json), and the next piece logged 'start from basis' for it. Answers are still optima of the
  right LP (HiGHS repairs it as an alien basis and solves to optimality), but the resume claim was wrong and the start was a warm start.
- The fix (pathway_perfail.js, harness only): each solve's basis is written under its own LP key, any file of that name removed first; the
  log says resume from this LP's own basis, warm start, or cold. LP keys unchanged (step 2026's dumps to 1faa0496d2 after it).
- Affected: ts2_ff step 2028, pass 2 (kept at 13:28, resumed 13:30, optimal in 884 s; finished, adequate): very likely, not confirmable (the
  file is removed on success); same objective, builds could differ only if the LP has more than one optimal build; not re-solved cold (user,
  4 Nov 2026: the affected steps are recorded, and the runs restart on the fixed tracking twin anyway). ts2_central step 2029, pass 2: the
  kept file was pass 1's (written 13:31:17, pass 2 stopped 14:13); moved aside, so pass 2 starts cold. ts2_central_ann step 2027, pass 2:
  pass 1's (written 14:50:55), resumed 15:07, optimal in 417 s; its builds chose pass 3's stress windows. Its pass 5 (cut at 16:39, in a
  process started before the fix) kept pass 4's basis (written 16:18:41) the same way; moved aside, so pass 5 starts cold. The first basis
  (ts_central step 2028, pass 2, confirmed; ts_ff step 2028, pass 2, likely) is record only.

#### Solver timing

Clean test (user, 4 Nov 2026), run 5 Nov 2026 04:11 to 04:31 UTC with no run going: step 2026's LP dumped afresh with the central's
settings (key 1faa0496d2, the LP the central's step 2026 solved on 4 Nov; 417,625 columns), then solved by highs_native.py serial (HiGHS's
default dual simplex, no HIGHS_OPTS) and on parallel dual simplex (HIGHS_OPTS {"simplex_strategy": 2, "threads": 2}), one after the other,
nothing else solving (4 cores, 15 GB).

| Solver | Wall time, s | Objective, R |
|---|---:|---:|
| Serial | 438.8 | 553,387,718,044.61 |
| Parallel, 2 threads | 708.8 | 553,387,718,044.61 |

- Parallel dual simplex is no faster on this LP: 1.62 times the serial time (270 s more).
- Same answer: objectives within 2.2e-16 of each other, and all 125 build variables within 2e-11 MW. 6,933 dispatch columns differ by more
  than 1 (largest 4,045, a pumped-storage level in 2028): different optima of the same cost, the builds unchanged. The central's own
  solve of this LP on 4 Nov (serial, about 508 s to the 15-second poll) has the same objective to the digit and the same 2026 builds.
- Caveat: one LP, the smallest in the runs (2026 to 2030, its first pass, before the adequacy loop adds any 14-day stress windows), one
  solve each; the larger look-ahead LPs (35 to 50 min) are not measured. Rough pairs from the runs, different LPs, each beside one other
  solve: Fossil-free step 2029 on parallel 48.8 min against the central's step 2029 pass 1 on serial 52.4 min; the annuity run's step 2026
  on parallel 15.9 min against the central's step 2026 on serial 8.5 min.
- The solver for the restart is set in the main session's restart message, probably after a clean timing on a larger step (user, 5 Nov
  2026).

#### Steps cut by a piece and relaunched

Rule (user, 4 Nov 2026): a step past about 90 minutes is let finish if it can; if a piece cuts it, it is relaunched once and recorded.

- ts2_ff step 2033 (to 2037), piece 6 (PID 30282): pass 1 solved cold on parallel in 41.3 min; 2037 at 36.39 against 20 GWh; three
  windows added (2015 day 149 twice, 2016 day 121). Pass 2 started cold at 19:08:44 and was stopped at the job deadline at 19:57:14 after
  48.5 min, with no valid basis kept, so the step had run 95 min. Relaunched once at 19:57 (piece 7, PID 19210): pass 1 from the LP cache
  (03a1f3ee3d), pass 2 cold again with a 5,404 s limit. Pass 2 solved in 50.8 min (optimal 20:53:44); 2037 at 33.43 against 20 GWh;
  three windows added (2022 day 133 twice, 2021 day 161). Pass 3 started cold at 20:58:40 with the 2,066 s left and was stopped at the
  job deadline at 21:33:21, again with no valid basis. The one relaunch used, Fossil-free is left stopped at 7 of 15 steps (21:33). Why:
  this step needs at least three passes of 41 to 51 min each, more than one 110-min piece holds; each solve alone fits in a piece. Passes 1
  and 2 are in the LP cache (03a1f3ee3d, ab2a195959), so a further relaunch would start at pass 3, cold, with about 90 min. Decision
  (user, 5 Nov 2026): left stopped; no relaunch on this basis. The annuity run took the slot at 21:33 (PID 7929), next in line.
- Container restart, about 23:45 (outside any piece): every process stopped; the files, the LP caches and the output folders were kept.
  ts2_central step 2037 had solved for 3 min (pass 1); relaunched at 23:46 (PID 291), its pass 1 cold again. ts2_central_ann step 2028
  (to 2032) had solved passes 1 to 3 (14.8, 21.6, 24.2 min; 2032 at 37.76, 29.51, 23.97 against 20 GWh) and pass 4 for 16 of its 26 min
  (limit 1,563 s), so the piece's deadline would very likely have cut it about 10 min later; the step had run 85 min. Counted as its one
  relaunch: relaunched at 23:46 (PID 373), passes 1 to 3 from the LP cache, pass 4 cold. The two solves the restart stopped left no end
  line, so the tables' solve times leave them out; test15_summary.py counts the stopped piece's finished solves and attempt with the step
  the next piece resumed (fixed 5 Nov 2026).
- ts2_central_ann step 2029 (to 2033), piece of 00:58 (PID 16549): passes 1 to 3 solved cold on parallel (16.8, 28.6, 31.8 min);
  pass 1: 2032 at 20.23 and 2033 at 44.88, pass 2: 2033 at 26.04, pass 3: 2033 at 23.3 against 20 GWh. Pass 4 started at 02:23:38 with
  the 600 s floor and was stopped at the job deadline at 02:33:55 with no valid basis; the step had run 95 min. Relaunched once at
  02:34 (PID 916): passes 1 to 3 from the LP cache (47f42f03fe, 9c0fca1de6, 21d8d7fab2), pass 4 cold with a 5,256 s limit. Pass 4 solved
  in 32.9 min (optimal 03:14:54); 2033 at 22.92 against 20 GWh. Pass 5 started cold with a 3,120 s limit and solved in 37.9 min
  (optimal 03:55:34); 2033 at 22.09. Pass 6, the last under MAXP=6, started cold at 03:58:17 with 677 s and was stopped at the job
  deadline at 04:09:49 with no valid basis (b0591c7b8b). The one relaunch used, the annuity run is left stopped at 3 of 15 steps (04:09).
  Why: this step needs six passes of 17 to 38 min each, more than one 110-min piece holds; each solve alone fits in a piece. Passes 1 to 5
  are in the LP cache (passes 4 and 5: d03f368753, c63c34b260), so a further relaunch would replay them in about 12 min and run pass 6
  cold with about 95 min; at 22.92 then 22.09 GWh, pass 6 would very likely still leave 2033 over the standard. Decision (user, 5 Nov
  2026): left stopped; no relaunch on this basis.

<!-- test15_summary start -->
#### tsr_central (10 of 15 steps)

Fixed builds carried unchanged into later steps: yes, every one

tsr_central: new build by year, MW (lithium also MWh)

| Year | wind | solar | lithium MW | lithium MWh | OCGT diesel | grid-forming |
|---|---:|---:|---:|---:|---:|---:|
| 2026 | 287 | 156 | 360 | 1,440 | 0 | 0 |
| 2027 | 1,959 | 2,120 | 401 | 1,619 | 0 | 0 |
| 2028 | 2,500 | 1,129 | 0 | 660 | 0 | 15 |
| 2029 | 2,500 | 3,063 | 438 | 0 | 0 | 330 |
| 2030 | 2,500 | 3,277 | 2,013 | 384 | 0 | 1,142 |
| 2031 | 3,500 | 3,506 | 2,582 | 11,404 | 0 | 497 |
| 2032 | 3,500 | 3,752 | 1,380 | 11,234 | 0 | 1,117 |
| 2033 | 3,500 | 1,151 | 1,157 | 9,748 | 0 | 164 |
| 2034 | 3,500 | 3,647 | 1,827 | 11,794 | 1,000 | 0 |
| 2035 | 3,500 | 551 | 364 | 2,822 | 0 | 86 |
| 2036 |  |  |  |  |  |  |
| 2037 |  |  |  |  |  |  |
| 2038 |  |  |  |  |  |  |
| 2039 |  |  |  |  |  |  |
| 2040 |  |  |  |  |  |  |
| Total | 27,246 | 22,352 | 10,522 | 51,105 | 1,000 | 3,351 |

tsr_central: coal standing (MW), coal retired ahead of its dates (MW) and kept under the compliance case (MW), year y of each step

| Year | Coal standing | Retired early | Compliance MW kept |
|---|---:|---:|---:|
| 2026 | 39,692 | 0 |  |
| 2027 | 39,692 | 0 |  |
| 2028 | 39,692 | 0 |  |
| 2029 | 33,850 | 3,177 |  |
| 2030 | 29,256 | 3,177 |  |
| 2031 | 27,699 | 3,177 | 3,177 |
| 2032 | 26,046 | 3,177 | 3,177 |
| 2033 | 24,944 | 3,177 | 3,177 |
| 2034 | 23,290 | 3,177 | 3,177 |
| 2035 | 22,739 | 3,177 | 3,177 |

tsr_central: each step (year y on 365 days, the look-ahead years at 25 days)

| Step | Horizon | Passes | Verdict | Solver | Solve wall time, min (each solve, cut ones included) | Step wall time in its last piece, min | Attempts | Peak memory, GB | Years over the standard, pass by pass (mean GWh / limit) | Objective, Rbn |
|---|---|---:|---|---|---|---:|---:|---:|---|---:|
| 2026 | 2030 | 1 | adequate | parallel, 2 threads, presolve off | 33.1 | 41.2 | 1 | 2.4 | pass 1: none | 569.529 |
| 2027 | 2031 | 1 | adequate | parallel, 2 threads, presolve off | 40.2 | 50.1 | 1 | 2.5 | pass 1: none | 567.520 |
| 2028 | 2032 | 1 | adequate | parallel, 2 threads, presolve off | 52.4 | 66.2 | 2 | 2.5 | pass 1: none | 569.646 |
| 2029 | 2033 | 1 | adequate | parallel, 2 threads, presolve off | 28.4, 32.8 | 49.3 | 2 | 2.8 | pass 1: none | 580.417 |
| 2030 | 2034 | 2 | adequate | parallel, 2 threads, presolve off | 45.3, 3.0, 64.0 | 89.2 | 3 | 3.1 | pass 1: 2034: 20.2 / 20<br>pass 2: none | 604.101 |
| 2031 | 2035 | 2 | adequate | parallel, 2 threads, presolve off | 73.1, 6.0 | 107.7 | 2 | 5.0 | pass 1: 2034: 20.2 / 20<br>pass 2: none | 631.188 |
| 2032 | 2036 | 2 | adequate | parallel, 2 threads, presolve off | 75.2, 7.2 | 47.3 | 3 | 1.5 | pass 1: 2034: 20.4 / 20<br>pass 2: none | 663.494 |
| 2033 | 2037 | 2 | adequate | parallel, 2 threads, presolve off | 37.4, 32.5, 9.4 | 97.0 | 2 | 3.9 | pass 1: 2034: 21.2 / 20<br>pass 2: none | 707.044 |
| 2034 | 2038 | 2 | adequate | parallel, 2 threads, presolve off | 77.4, 10.4, 8.6 | 66.0 | 3 | 4.6 | pass 1: 2034: 22.9 / 20<br>pass 2: none | 756.556 |
| 2035 | 2039 | 1 | adequate | parallel, 2 threads, presolve off | 18.6, 35.8 | 68.6 | 2 | 3.3 | pass 1: none | 813.405 |
| 2036 | | | not finished | parallel, 2 threads, presolve off | 16.1 | | 1 | | | |

tsr_central: the adequacy test on each step's own year y at its final pass (mean unserved GWh a year against the limit)

| Year | Pass 1 mean / limit | Final pass mean / limit | Worst weather year (GWh) |
|---|---|---|---|
| 2026 | 0.00 / 20 | 0.00 / 20 | 2014 (0.0) |
| 2027 | 0.00 / 20 | 0.00 / 20 | 2014 (0.0) |
| 2028 | 0.00 / 20 | 0.00 / 20 | 2014 (0.0) |
| 2029 | 0.07 / 20 | 0.07 / 20 | 2019 (0.6) |
| 2030 | 1.68 / 20 | 1.68 / 20 | 2022 (21.0) |
| 2031 | 15.58 / 20 | 15.50 / 20 | 2022 (268.1) |
| 2032 | 15.17 / 20 | 15.33 / 20 | 2024 (193.7) |
| 2033 | 16.66 / 20 | 17.72 / 20 | 2015 (217.5) |
| 2034 | 22.92 / 20 | 7.41 / 20 | 2020 (96.6) |
| 2035 | 19.28 / 20 | 19.28 / 20 | 2017 (344.5) |

#### ts2_central (15 of 15 steps)

Fixed builds carried unchanged into later steps: yes, every one

ts2_central: new build by year, MW (lithium also MWh)

| Year | wind | solar | lithium MW | lithium MWh | iron-air | pumped new | CCGT | OCGT gas | OCGT diesel | grid-forming |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 2026 | 287 | 156 | 360 | 1,440 | 0 | 0 | 0 | 0 | 0 | 0 |
| 2027 | 1,959 | 2,120 | 401 | 1,619 | 0 | 0 | 0 | 0 | 0 | 0 |
| 2028 | 2,500 | 1,129 | 0 | 660 | 0 | 0 | 0 | 0 | 0 | 139 |
| 2029 | 2,500 | 3,063 | 395 | 0 | 0 | 0 | 0 | 0 | 0 | 332 |
| 2030 | 2,500 | 3,277 | 2,219 | 892 | 0 | 0 | 0 | 0 | 0 | 1,292 |
| 2031 | 3,500 | 3,506 | 2,466 | 10,105 | 0 | 0 | 0 | 0 | 0 | 625 |
| 2032 | 3,500 | 3,752 | 1,521 | 9,921 | 0 | 0 | 0 | 0 | 325 | 909 |
| 2033 | 3,500 | 1,437 | 798 | 2,956 | 0 | 0 | 0 | 0 | 72 | 22 |
| 2034 | 3,500 | 1,653 | 425 | 7,755 | 0 | 0 | 0 | 0 | 1,000 | 0 |
| 2035 | 3,500 | 551 | 305 | 4,287 | 0 | 0 | 0 | 611 | 0 | 0 |
| 2036 | 3,500 | 425 | 126 | 3,127 | 0 | 0 | 0 | 638 | 0 | 158 |
| 2037 | 3,500 | 280 | 336 | 1,049 | 0 | 0 | 0 | 1,200 | 0 | 0 |
| 2038 | 2,461 | 1,743 | 0 | 827 | 0 | 1,500 | 0 | 976 | 0 | 0 |
| 2039 | 2,583 | 2,308 | 767 | 9,530 | 150 | 0 | 0 | 1,200 | 261 | 0 |
| 2040 | 2,193 | 1,218 | 1,345 | 10,782 | 150 | 0 | 553 | 647 | 0 | 0 |
| Total | 41,483 | 26,618 | 11,464 | 64,950 | 300 | 1,500 | 553 | 5,272 | 1,658 | 3,477 |

ts2_central: coal standing (MW), coal retired ahead of its dates (MW) and kept under the compliance case (MW), year y of each step

| Year | Coal standing | Retired early | Compliance MW kept |
|---|---:|---:|---:|
| 2026 | 39,692 | 0 |  |
| 2027 | 39,692 | 0 |  |
| 2028 | 39,692 | 0 |  |
| 2029 | 33,564 | 3,463 |  |
| 2030 | 28,970 | 3,463 |  |
| 2031 | 27,413 | 3,463 | 3,463 |
| 2032 | 25,760 | 3,463 | 3,463 |
| 2033 | 24,658 | 3,463 | 3,463 |
| 2034 | 23,004 | 3,463 | 3,463 |
| 2035 | 22,453 | 3,463 | 3,463 |
| 2036 | 21,885 | 3,463 | 3,463 |
| 2037 | 20,195 | 3,463 | 3,463 |
| 2038 | 18,506 | 3,463 | 3,463 |
| 2039 | 16,198 | 3,463 | 3,463 |
| 2040 | 14,427 | 3,463 | 3,463 |

ts2_central: each step (year y on 365 days, the look-ahead years at 25 days)

| Step | Horizon | Passes | Verdict | Solver | Solve wall time, min (each solve, cut ones included) | Step wall time in its last piece, min | Attempts | Peak memory, GB | Years over the standard, pass by pass (mean GWh / limit) | Objective, Rbn |
|---|---|---:|---|---|---|---:|---:|---:|---|---:|
| 2026 | 2030 | 1 | adequate | serial | 8.5 | 11.0 | 1 | 2.4 | pass 1: none | 553.388 |
| 2027 | 2031 | 1 | adequate | serial | 14.0 | 17.0 | 1 | 2.5 | pass 1: none | 551.848 |
| 2028 | 2032 | 1 | adequate | serial | 20.5 | 23.9 | 1 | 2.7 | pass 1: none | 554.393 |
| 2029 | 2033 | 2 | adequate | serial, then parallel, 2 threads | 41.9, 52.4, 38.8, 40.7 | 48.4 | 3 | 3.4 | pass 1: 2032: 21.3 / 20<br>pass 2: none | 567.399 |
| 2030 | 2034 | 2 | adequate | parallel, 2 threads | 35.5, 38.1 | 81.7 | 2 | 4.4 | pass 1: 2032: 21.5 / 20<br>pass 2: none | 590.059 |
| 2031 | 2035 | 2 | adequate | parallel, 2 threads | 35.0, 36.6 | 80.5 | 2 | 3.7 | pass 1: 2032: 21.5 / 20<br>pass 2: none | 618.858 |
| 2032 | 2036 | 2 | adequate | parallel, 2 threads | 39.4, 39.6 | 88.1 | 2 | 3.4 | pass 1: 2032: 20.8 / 20<br>pass 2: none | 654.249 |
| 2033 | 2037 | 1 | adequate | parallel, 2 threads | 32.8 | 37.8 | 2 | 3.1 | pass 1: none | 699.526 |
| 2034 | 2038 | 1 | adequate | parallel, 2 threads | 37.0 | 42.2 | 2 | 2.9 | pass 1: none | 751.008 |
| 2035 | 2039 | 1 | adequate | parallel, 2 threads | 35.0 | 40.2 | 2 | 3.1 | pass 1: none | 807.526 |
| 2036 | 2040 | 1 | adequate | parallel, 2 threads | 34.0 | 39.3 | 2 | 2.9 | pass 1: none | 868.454 |
| 2037 | 2040 | 1 | adequate | parallel, 2 threads | 27.9 | 32.6 | 3 | 2.8 | pass 1: none | 844.648 |
| 2038 | 2040 | 1 | adequate | parallel, 2 threads | 29.2 | 34.0 | 2 | 2.7 | pass 1: none | 823.097 |
| 2039 | 2040 | 1 | adequate | parallel, 2 threads | 20.3 | 24.6 | 2 | 2.8 | pass 1: none | 804.287 |
| 2040 | 2040 | 1 | adequate | parallel, 2 threads | 18.6 | 23.1 | 1 | 2.4 | pass 1: none | 787.344 |

ts2_central: the adequacy test on each step's own year y at its final pass (mean unserved GWh a year against the limit)

| Year | Pass 1 mean / limit | Final pass mean / limit | Worst weather year (GWh) |
|---|---|---|---|
| 2026 | 0.00 / 20 | 0.00 / 20 | 2014 (0.0) |
| 2027 | 0.00 / 20 | 0.00 / 20 | 2014 (0.0) |
| 2028 | 0.00 / 20 | 0.00 / 20 | 2014 (0.0) |
| 2029 | 0.44 / 20 | 0.43 / 20 | 2018 (3.3) |
| 2030 | 1.81 / 20 | 1.81 / 20 | 2022 (16.6) |
| 2031 | 18.89 / 20 | 18.89 / 20 | 2022 (123.8) |
| 2032 | 20.79 / 20 | 12.87 / 20 | 2021 (103.1) |
| 2033 | 11.52 / 20 | 11.52 / 20 | 2016 (43.5) |
| 2034 | 12.45 / 20 | 12.45 / 20 | 2018 (77.2) |
| 2035 | 9.51 / 20 | 9.51 / 20 | 2018 (65.5) |
| 2036 | 7.97 / 20 | 7.97 / 20 | 2020 (73.6) |
| 2037 | 7.98 / 20 | 7.98 / 20 | 2015 (56.9) |
| 2038 | 7.52 / 20 | 7.52 / 20 | 2019 (77.3) |
| 2039 | 12.78 / 20 | 12.78 / 20 | 2015 (102.2) |
| 2040 | 10.46 / 20 | 10.46 / 20 | 2016 (103.4) |

#### ts2_ff (8 of 15 steps)

Fixed builds carried unchanged into later steps: yes, every one

ts2_ff: new build by year, MW (lithium also MWh)

| Year | wind | solar | lithium MW | lithium MWh | OCGT diesel | grid-forming |
|---|---:|---:|---:|---:|---:|---:|
| 2026 | 287 | 156 | 360 | 1,440 | 0 | 0 |
| 2027 | 1,959 | 2,120 | 401 | 1,619 | 0 | 0 |
| 2028 | 1,605 | 1,129 | 0 | 660 | 0 | 0 |
| 2029 | 4,300 | 2,265 | 616 | 0 | 0 | 475 |
| 2030 | 4,300 | 4,759 | 2,358 | 2,320 | 0 | 1,771 |
| 2031 | 3,500 | 5,144 | 2,671 | 10,509 | 0 | 1,034 |
| 2032 | 3,500 | 1,982 | 1,553 | 8,922 | 0 | 79 |
| 2033 | 3,500 | 2,029 | 528 | 6,768 | 459 | 2 |
| 2034 |  |  |  |  |  |  |
| 2035 |  |  |  |  |  |  |
| 2036 |  |  |  |  |  |  |
| 2037 |  |  |  |  |  |  |
| 2038 |  |  |  |  |  |  |
| 2039 |  |  |  |  |  |  |
| 2040 |  |  |  |  |  |  |
| Total | 22,951 | 19,584 | 8,487 | 32,238 | 459 | 3,361 |

ts2_ff: coal standing (MW), coal retired ahead of its dates (MW) and kept under the compliance case (MW), year y of each step

| Year | Coal standing | Retired early | Compliance MW kept |
|---|---:|---:|---:|
| 2026 | 39,692 | 0 |  |
| 2027 | 39,692 | 0 |  |
| 2028 | 39,692 | 0 |  |
| 2029 | 32,419 | 4,608 |  |
| 2030 | 27,825 | 4,608 |  |
| 2031 | 26,268 | 4,608 | 4,608 |
| 2032 | 24,615 | 4,608 | 4,608 |
| 2033 | 23,513 | 4,608 | 4,608 |

ts2_ff: each step (year y on 365 days, the look-ahead years at 25 days)

| Step | Horizon | Passes | Verdict | Solver | Solve wall time, min (each solve, cut ones included) | Step wall time in its last piece, min | Attempts | Peak memory, GB | Years over the standard, pass by pass (mean GWh / limit) | Objective, Rbn |
|---|---|---:|---|---|---|---:|---:|---:|---|---:|
| 2026 | 2030 | 1 | adequate | serial | 9.1 | 11.9 | 1 | 2.3 | pass 1: none | 551.282 |
| 2027 | 2031 | 1 | adequate | serial | 14.2 | 17.1 | 1 | 2.7 | pass 1: none | 547.440 |
| 2028 | 2032 | 2 | adequate | serial, then parallel, 2 threads | 34.9, 27.1, 14.7 | 20.8 | 2 | 4.2 | pass 1: 2031: 21.7 / 20<br>pass 2: none | 551.013 |
| 2029 | 2033 | 1 | adequate | parallel, 2 threads | 48.8 | 52.6 | 1 | 2.8 | pass 1: none | 559.786 |
| 2030 | 2034 | 1 | adequate | parallel, 2 threads | 67.9 | 72.0 | 2 | 2.6 | pass 1: none | 585.201 |
| 2031 | 2035 | 1 | adequate | parallel, 2 threads | 51.1 | 55.3 | 2 | 3.0 | pass 1: none | 623.073 |
| 2032 | 2036 | 1 | adequate | parallel, 2 threads | 39.8 | 44.7 | 2 | 3.0 | pass 1: none | 669.855 |
| 2033 | 2037 | 4 | stall stop | parallel, 2 threads, then parallel, 2 threads, presolve off | 41.3, 48.5, 50.8, 34.6, 86.0, 13.5, 14.1 | 29.8 | 6 | 4.4 | pass 1: 2037: 36.4 / 20<br>pass 2: 2037: 33.4 / 20<br>pass 3: 2037: 31.8 / 20<br>pass 4: 2037: 31.3 / 20 | 726.860 |
| 2034 | | | not finished |  |  | | 1 | | | |

ts2_ff: the adequacy test on each step's own year y at its final pass (mean unserved GWh a year against the limit)

| Year | Pass 1 mean / limit | Final pass mean / limit | Worst weather year (GWh) |
|---|---|---|---|
| 2026 | 0.00 / 20 | 0.00 / 20 | 2014 (0.0) |
| 2027 | 0.00 / 20 | 0.00 / 20 | 2014 (0.0) |
| 2028 | 0.00 / 20 | 0.00 / 20 | 2014 (0.0) |
| 2029 | 0.15 / 20 | 0.15 / 20 | 2020 (1.4) |
| 2030 | 4.14 / 20 | 4.14 / 20 | 2024 (36.8) |
| 2031 | 12.45 / 20 | 12.45 / 20 | 2025 (83.1) |
| 2032 | 10.67 / 20 | 10.67 / 20 | 2021 (39.0) |
| 2033 | 13.85 / 20 | 13.85 / 20 | 2022 (101.9) |

#### ts2_central_ann (4 of 15 steps)

Fixed builds carried unchanged into later steps: yes, every one

ts2_central_ann: new build by year, MW (lithium also MWh)

| Year | wind | solar | lithium MW | lithium MWh |
|---|---:|---:|---:|---:|
| 2026 | 287 | 156 | 360 | 1,440 |
| 2027 | 1,959 | 2,120 | 401 | 1,619 |
| 2028 | 0 | 1,129 | 0 | 660 |
| 2029 | 0 | 0 | 0 | 0 |
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
| Total | 2,246 | 3,405 | 761 | 3,719 |

ts2_central_ann: coal standing (MW), coal retired ahead of its dates (MW) and kept under the compliance case (MW), year y of each step

| Year | Coal standing | Retired early | Compliance MW kept |
|---|---:|---:|---:|
| 2026 | 39,692 | 0 |  |
| 2027 | 39,692 | 0 |  |
| 2028 | 39,692 | 0 |  |
| 2029 | 37,027 | 0 |  |

ts2_central_ann: each step (year y on 365 days, the look-ahead years at 25 days)

| Step | Horizon | Passes | Verdict | Solver | Solve wall time, min (each solve, cut ones included) | Step wall time in its last piece, min | Attempts | Peak memory, GB | Years over the standard, pass by pass (mean GWh / limit) | Objective, Rbn |
|---|---|---:|---|---|---|---:|---:|---:|---|---:|
| 2026 | 2030 | 1 | adequate | parallel, 2 threads | 15.9 | 18.4 | 1 | 2.5 | pass 1: none | 677.140 |
| 2027 | 2031 | 5 | stall stop | parallel, 2 threads | 16.8, 10.3, 7.0, 29.0, 29.2, 18.0, 32.3 | 45.3 | 3 | 4.1 | pass 1: 2031: 47.9 / 20<br>pass 2: 2031: 31.1 / 20<br>pass 3: 2031: 28.2 / 20<br>pass 4: 2031: 26.6 / 20<br>pass 5: 2031: 27.2 / 20 | 743.104 |
| 2028 | 2032 | 5 | adequate | parallel, 2 threads | 14.8, 21.6, 24.2, 27.2, 31.4 | 70.4 | 3 | 4.1 | pass 1: 2032: 37.8 / 20<br>pass 2: 2032: 29.5 / 20<br>pass 3: 2032: 24.0 / 20<br>pass 4: 2032: 20.0 / 20<br>pass 5: none | 776.178 |
| 2029 | 2033 | 6 | pass limit reached | parallel, 2 threads, then parallel, 2 threads, presolve off | 16.8, 28.6, 31.8, 10.1, 32.9, 37.9, 11.5, 77.4, 32.7 | 55.3 | 5 | 4.9 | pass 1: 2032: 20.2 / 20; 2033: 44.9 / 20<br>pass 2: 2033: 26.0 / 20<br>pass 3: 2033: 23.3 / 20<br>pass 4: 2033: 22.9 / 20<br>pass 5: 2033: 22.1 / 20<br>pass 6: 2033: 21.6 / 20 | 802.217 |
| 2030 | | | not finished |  |  | | 1 | | | |

ts2_central_ann: the adequacy test on each step's own year y at its final pass (mean unserved GWh a year against the limit)

| Year | Pass 1 mean / limit | Final pass mean / limit | Worst weather year (GWh) |
|---|---|---|---|
| 2026 | 0.00 / 20 | 0.00 / 20 | 2014 (0.0) |
| 2027 | 0.00 / 20 | 0.00 / 20 | 2014 (0.0) |
| 2028 | 0.00 / 20 | 0.00 / 20 | 2014 (0.0) |
| 2029 | 0.04 / 20 | 0.04 / 20 | 2018 (0.8) |

Cumulative new build, MW (lithium also MWh), built 2026 to the year

| Technology | Year | tsr_central | ts2_central | ts2_ff | ts2_central_ann |
|---|---|---:|---:|---:|---:|
| wind | 2030 | 9,746 | 9,746 | 12,451 |  |
| wind | 2035 | 27,246 | 27,246 |  |  |
| wind | 2040 |  | 41,483 |  |  |
| solar | 2030 | 9,745 | 9,745 | 10,429 |  |
| solar | 2035 | 22,352 | 20,644 |  |  |
| solar | 2040 |  | 26,618 |  |  |
| lithium MW | 2030 | 3,212 | 3,375 | 3,735 |  |
| lithium MW | 2035 | 10,522 | 8,890 |  |  |
| lithium MW | 2040 |  | 11,464 |  |  |
| lithium MWh | 2030 | 4,103 | 4,611 | 6,039 |  |
| lithium MWh | 2035 | 51,105 | 39,635 |  |  |
| lithium MWh | 2040 |  | 64,950 |  |  |
| iron-air | 2030 | 0 | 0 | 0 |  |
| iron-air | 2035 | 0 | 0 |  |  |
| iron-air | 2040 |  | 300 |  |  |
| pumped new | 2030 | 0 | 0 | 0 |  |
| pumped new | 2035 | 0 | 0 |  |  |
| pumped new | 2040 |  | 1,500 |  |  |
| CCGT | 2030 | 0 | 0 | 0 |  |
| CCGT | 2035 | 0 | 0 |  |  |
| CCGT | 2040 |  | 553 |  |  |
| OCGT gas | 2030 | 0 | 0 | 0 |  |
| OCGT gas | 2035 | 0 | 611 |  |  |
| OCGT gas | 2040 |  | 5,272 |  |  |
| OCGT diesel | 2030 | 0 | 0 | 0 |  |
| OCGT diesel | 2035 | 1,000 | 1,397 |  |  |
| OCGT diesel | 2040 |  | 1,658 |  |  |
| grid-forming | 2030 | 1,487 | 1,763 | 2,246 |  |
| grid-forming | 2035 | 3,351 | 3,319 |  |  |
| grid-forming | 2040 |  | 3,477 |  |  |
<!-- test15_summary end -->

### Against the one-stage pass 1 at 25 days (for the main session)

The main session adds the one-stage column from harness/out/test8/c7_d25.json (not in this session):
`python3 -I pathway/test15_summary.py out/ts2_central out/ts2_ff out/ts2_central_ann --one-stage ts2_central=out/test8/c7_d25.json`
(the label must equal the run folder's name; the one-stage figure is shown in brackets where it differs by 1 MW or more). If c7_d25 ran on
c7's settings as the brief gave them (REP_REF=2025, no WX_WINDCORR or CONG_OFF), the comparison mixes the basis change with the two-stage
change; not checked here (the file is not in this session). No Fossil-free one-stage file was named.
