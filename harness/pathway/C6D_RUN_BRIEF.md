# Brief: run the c6d set (message 458)

For the run session on nickhedley/gridtwin-za that ran c6c. Let the c6c set finish and open its outputs PR first (c6c is now the
low-solar-cost sensitivity); then run c6d on main once Nick merges the solar-cost PR (build 2026-10-27g: new utility solar costed
from BW6's compliant tracker bids, R16,786/kW, as wind is from BW6's; everything else as c6c). c6d is c6c's settings and run set on
that page, rerun in full, because the adequacy loops may move. The pack, RESULTS and the analysis stay with the session that wrote
this brief.

Read CLAUDE.md and RULES.md first; their rules apply. The ones that matter here:

- Never push to main. Commit the outputs on a new branch and open a pull request; Nick merges.
- Start long jobs with the Bash tool's run_in_background, never nohup or & (CLAUDE.md, 'Long runs').
- Record each background job's PID when you start it and stop it by that PID only. Never use pkill -f or kill by pattern.
- Run nothing else beside the set: two solves at a time already use about 15 GB.
- ESK19679.csv is not needed for these runs. Never commit ESK*.csv.
- Times in messages to Nick are SAST (UTC+2), labelled. Logs stay in UTC.
- Writing style: en dashes, never em dashes; no italics; no words in all caps.

## 1. Check out the run commit

    git fetch origin main
    git checkout --detach origin/main
    git log --oneline -1                                   # the minimum down time PR's merge commit
    grep -o "BUILD_STAMP = '[0-9a-z-]*'" index.html         # must be '2026-10-27g'; stop and tell Nick if not
    grep -n "coalMinDownH:24" index.html                    # the 24-hour default must be there
    grep -n "coalMslPracticeFloor:0.715" index.html         # the recalibrated floor must be there
    grep -n "bldPvCase:'bw6'" index.html                   # solar on BW6's compliant bids must be the default
    ls harness/pathway/chain_c6d.sh harness/pathway/env_c6.sh harness/pathway/env_c6a.sh harness/pathway/make_ret.py \
       harness/pathway/ret_counter.js harness/pathway/tables/ harness/pathway/irpcheck_coalsustain.sh

Record the commit; every run of the set must name it. Do not start c6d before the c6c set has finished and its outputs PR is open: the two sets share
harness/out.

## 2. Set up (once per container)

    cd harness && npm install jsdom highs eslint && pip install highspy && ln -s .. testroot

## 3. Start the set

Start it with the Bash tool's own background option (run_in_background: true, timeout 7000000 ms, just under 2 hours), not with
nohup or &. In these cloud sessions a process started with nohup or & is stopped a few minutes after a reply ends, and an idle
session's machine is reclaimed; a run_in_background job is tracked across replies for up to 2 hours (message 434). From the
repository root, as the background command:

    mkdir -p harness/out/c6d && echo $$ > harness/out/c6d/chain.pid && exec bash harness/pathway/chain_c6d.sh >> harness/out/c6d/chain.out 2>&1

When the job ends (the set is done, or the 2-hour limit stops it) you are notified. If progress.txt has no "C6D SET DONE", start
the same command again: the script is resumable and skips every finished run and check. So the set runs as a series of pieces
under 2 hours each. No solve in the set takes over 40 minutes on c6a's timings, so each piece finishes at least one run.

Settings: the script sources harness/pathway/env_c6a.sh, which sources env_c6.sh. Each run's own changes sit on its line in
chain_c6d.sh. Progress, one line per event: harness/out/c6d/progress.txt.

## 4. The run order (message 428 (b)), already in the script

1. c6d central; s_irpgas, s_be6, s_be7 and c6d at IRP 2025's demand; then the IRP pair's build files and checks.
2. The wind cases (s_windlow, s_windhigh) and the IRP pair at each.
3. The carbon cases (s_carbontreasury, s_carbonhold) and the IRP pair on each.
4. The IRP pair at a high nuclear charge (check only; the figure stays out of the pack until Nick confirms it).
5. The rest of the 20 GWh set and the standard runs, short solves first, then s_coalsustain (R500/kW-yr of sustaining capital on existing coal).
6. Solves over 30 minutes, last: s_nogas, s_std_strict_nogas_dsl, s_std_nem_nogas_dsl.
7. Restart counts (make_ret.py builds harness/pathcheck_ret.gen.js from the commit's own check; outputs in harness/out/c6d/ret/).

Run times on c6a: most solves 6–10 min; s_irpgas and s_std_strict 14–21 min; s_nogas and s_std_strict_nogas_dsl 34–38 min; each
engine check 10–30 min; the whole set about 9 hours.

## 5. Restarts and stops

- On 27 Oct the machine was reclaimed whenever the session sat idle for 6 minutes or more after a reply, and the session woke on
  a fresh machine with every nohup job gone (message 434 (b)). A run_in_background job keeps the session from going idle while it
  runs.
- If the set stops anyway (a reclaimed machine, or the 2-hour limit), check harness/out/c6d/progress.txt and start the command in
  section 3 again. Finished runs and checks are skipped.
- A run that starts twice without output is logged in progress.txt as "NOT RUN <name>". Report each one to Nick as not run,
  with the reason (container restarts or the time limit). Do not delete its attempts file to force a third try unless Nick asks.
- Stop the set only by the PID in harness/out/c6d/chain.pid (and its children by their own PIDs), never by pattern.

## 6. Tables, when the set is done

From harness/:

    node pathway/tables/packtable.js out c6d null_c6d s_nogas_c6d s_nogas_dsl_c6d s_gascapex25_c6d s_gas2030_c6d s_imp_c6d \
      s_demlowflat_c6d s_demlowm1_c6d s_coalpractice_c6d s_rate48_c6d s_spotoil_c6d s_wearp75_c6d \
      s_koeberg_winter_c6d s_ntcsa_both_c6d s_windlow_c6d s_windhigh_c6d s_carbontreasury_c6d s_carbonhold_c6d s_coalsustain_c6d \
      s_std_strict_c6d s_std_nem_c6d s_std_strict_nogas_dsl_c6d s_std_nem_nogas_dsl_c6d > out/c6d/packtable.md
    CENTRAL=c6d node pathway/tables/irptable.js out out/c6d/irp > out/c6d/irptable.md
    node pathway/tables/summ.js out c6d > out/c6d/summ_c6d.txt

Runs that did not finish are skipped by the scripts; list them separately.

## 7. Commit the outputs (outputs folder only, on a branch built fresh from main)

Build the branch from origin/main as it is when the set is done, not from the run commit, so the pull request carries nothing
but the outputs (message 453: a branch cut from an older commit carried other commits and could have reverted main):

    git fetch origin main && git checkout -b claude/c6d-runs origin/main

- Copy into harness/pathway/c6d/: out/pathway_*c6d*.json, out/pathcheck_*c6d*_?.json, out/c6d/irp/*.json, out/c6d/ret/ret_*.json,
  out/c6d/progress.txt and the three table files. No logs, no lpcache folders, no ESK files.
- Before opening the pull request, list the changed files: `git diff --name-only origin/main`. Every line must start with
  harness/pathway/c6d/; if any does not, stop and tell Nick.
- Commit message: what was run, on which commit and build 2026-10-27g, and the runs not run.
- Open a pull request titled "c6d run set: outputs (build 2026-10-27g)". The body: the run commit, the build stamp, the start and
  end times (SAST), every run with its verdict, the runs not run with reasons, the two tables and the changed-file list. No
  RESULTS edit: the other session writes RESULTS and the pack from these files.

## 8. The s_coalsustain IRP check

After the set, as a tracked job from the repository root: `CENTRAL=c6d bash harness/pathway/irpcheck_coalsustain.sh "$PWD"`.
Add harness/out/c6d/irp/pathway_irp2025_c6d_coalsustain.json and pathcheck_irp2025_c6d_coalsustain_{a,b,c}.json to the outputs.

## 9. Report to Nick

One short message: done or not, the PR link, the runs not run and why, and the c6d central's headline (verdict, engine PV, CO2
2026-40, highest-year mean and worst-run unserved). End with a short list of what is outstanding.
