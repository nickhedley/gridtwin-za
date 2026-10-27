# Brief: run the c6b set in a fresh session

For a new Claude Code session on nickhedley/gridtwin-za (messages 428 (a) and 432 (a)). It runs the c6b set now, on PR #121's
commit 2603be5 (build 2026-10-27e), not after the merge, and commits its outputs. The pack, RESULTS write-up and 426 stay with the session that wrote this brief.

Read CLAUDE.md and RULES.md first; their rules apply. The ones that matter here:

- Never push to main. Commit the outputs on a new branch and open a pull request; Nick merges.
- Record each background job's PID when you start it and stop it by that PID only. Never use pkill -f or kill by pattern.
- Run nothing else beside the set: two solves at a time already use about 15 GB.
- ESK19679.csv is not needed for these runs. Never commit ESK*.csv.
- Times in messages to Nick are SAST (UTC+2), labelled. Logs stay in UTC.
- Writing style: en dashes, never em dashes; no italics; no words in all caps.

## 1. Check out the run commit

This brief lives at harness/pathway/C6B_RUN_BRIEF.md on the branch head, not at 2603be5. Read it from there before checking out
the run commit: `git show origin/claude/c6b-wind:harness/pathway/C6B_RUN_BRIEF.md`.

    git fetch origin claude/c6b-wind
    git checkout --detach 2603be5
    git log --oneline -1                                   # expect 2603be5 Fossil-free 2040 caption: ...
    grep -o "BUILD_STAMP = '[0-9a-z-]*'" index.html         # must be '2026-10-27e'; stop and tell Nick if not
    ls harness/pathway/chain_c6b.sh harness/pathway/env_c6.sh harness/pathway/env_c6a.sh harness/pathway/make_ret.py \
       harness/pathway/ret_counter.js harness/pathway/tables/

Run on 2603be5 itself, not on a later head of the branch: later commits on claude/c6b-wind are harness-only (the header comment
of chain_c6b.sh, the resumable stored-panels step) and do not change index.html, but the runs must name one commit.

## 2. Set up (once per container)

    cd harness && npm install jsdom highs eslint && pip install highspy && ln -s .. testroot

## 3. Start the set

From the repository root:

    mkdir -p harness/out/c6b
    nohup bash harness/pathway/chain_c6b.sh > harness/out/c6b/chain.out 2>&1 &
    echo $! > harness/out/c6b/chain.pid

Settings: the script sources harness/pathway/env_c6a.sh, which sources env_c6.sh. Each run's own changes sit on its line in
chain_c6b.sh. Progress, one line per event: harness/out/c6b/progress.txt.

## 4. The run order (message 428 (b)), already in the script

1. c6b central; s_irpgas, s_be6, s_be7 and c6b at IRP 2025's demand; then the IRP pair's build files and checks.
2. The wind cases (s_windlow, s_windhigh) and the IRP pair at each.
3. The carbon cases (s_carbontreasury, s_carbonhold) and the IRP pair on each.
4. The IRP pair at a high nuclear charge (check only; the figure stays out of the pack until Nick confirms it).
5. The rest of the 20 GWh set and the standard runs, short solves first, then s_coalsustain (R500/kW-yr of sustaining capital on existing coal).
6. Solves over 30 minutes, last: s_nogas, s_std_strict_nogas_dsl, s_std_nem_nogas_dsl.
7. Restart counts (make_ret.py builds harness/pathcheck_ret.gen.js from the commit's own check; outputs in harness/out/c6b/ret/).

Run times on c6a: most solves 6–10 min; s_irpgas and s_std_strict 14–21 min; s_nogas and s_std_strict_nogas_dsl 34–38 min; each
engine check 10–30 min; the whole set about 9 hours.

## 5. Container restarts

The container may restart without warning; on 27 Oct it restarted every 20–40 minutes. The script is resumable:

- After a restart, check the PID in harness/out/c6b/chain.pid. If it is gone and progress.txt has no "C6B SET DONE", start the
  set again with the same commands as in section 3. Finished runs and checks are skipped.
- Schedule a check-in about every 30 minutes (send_later) so a restart never leaves the set stopped for long.
- A run that starts twice without output is logged in progress.txt as "NOT RUN <name>". Report each one to Nick as not run,
  with the reason (container restarts or the time limit). Do not delete its attempts file to force a third try unless Nick asks.

## 6. Tables, when the set is done

From harness/:

    node pathway/tables/packtable.js out c6b null_c6b s_nogas_c6b s_nogas_dsl_c6b s_gascapex25_c6b s_gas2030_c6b s_imp_c6b \
      s_demlowflat_c6b s_demlowm1_c6b s_coalpractice_c6b s_mindn24_c6b s_rate48_c6b s_spotoil_c6b s_wearp75_c6b \
      s_koeberg_winter_c6b s_ntcsa_both_c6b s_windlow_c6b s_windhigh_c6b s_carbontreasury_c6b s_carbonhold_c6b s_coalsustain_c6b \
      s_std_strict_c6b s_std_nem_c6b s_std_strict_nogas_dsl_c6b s_std_nem_nogas_dsl_c6b > out/c6b/packtable.md
    CENTRAL=c6b node pathway/tables/irptable.js out out/c6b/irp > out/c6b/irptable.md
    node pathway/tables/summ.js out c6b > out/c6b/summ_c6b.txt

Runs that did not finish are skipped by the scripts; list them separately.

## 7. Commit the outputs

On a new branch, claude/c6b-runs, from 2603be5:

- Copy into harness/pathway/c6b/: out/pathway_*c6b*.json, out/pathcheck_*c6b*_?.json, out/c6b/irp/*.json, out/c6b/ret/ret_*.json,
  out/c6b/progress.txt and the three table files. No logs, no lpcache folders, no ESK files.
- Commit message: what was run, on commit 2603be5 and build 2026-10-27e, and the runs not run.
- Open a pull request titled "c6b run set: outputs (build 2026-10-27e)". The body: the run commit (2603be5), the build stamp, the start and
  end times (SAST), every run with its verdict, the runs not run with reasons, and the two tables. No RESULTS edit: the other
  session writes RESULTS and the pack from these files.

## 8. After Nick merges #121

Confirm the merged page is the page the runs used, and report it in the results PR:

    git fetch origin main
    git diff --stat 2603be5 origin/main -- index.html     # expect no output: identical
    git diff 2603be5 origin/main -- index.html | head -50 # if not identical, what changed

If index.html differs (the #121 suite forced a page change), say which runs the change invalidates (any run whose optimiser or
engine check reads the changed code or data) and that they rerun on the merged commit. A change to stored_panels.json, captions or
text alone invalidates none.

## 9. Report to Nick

One short message: done or not, the PR link, the runs not run and why, and the c6b central's headline (verdict, engine PV, CO2
2026-40, highest-year mean and worst-run unserved). End with a short list of what is outstanding.
