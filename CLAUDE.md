# GridTwin ZA - instructions for Claude Code

Read at the start of every session. Then read RULES.md in full, and HANDOVER.md, TODO.md and
MANIFEST.md before changing anything. RESULTS.md holds every finding with its settings.

## The user

Nick Hedley, energy transition analyst, Johannesburg. A coding beginner: explain each step in plain
terms, ask a clarifying question when a request is ambiguous, and never assume he can debug code.

## Layout in this repository

- Repo root: index.html (the app), profiles.json, nodal/, the markdown docs.
- harness/: the test harnesses; harness/pathway/: the pathway scripts and recorded 5 Oct 2026 runs.
  They expect the app in a folder called testroot beside them, so create a link once per
  environment: `ln -s .. harness/testroot`. Run everything from harness/ (pathway scripts as
  `node pathway/pathway_half.js`), with `testroot` as the root argument.
- Install harness dependencies in harness/: `npm install jsdom highs eslint`.
- ESK19679.csv is Eskom data obtained on request, all rights reserved. It is not in this
  repository and must never be committed. Keep ESK*.csv in .gitignore. Terms (user, 12 Oct 2026):
  ESK19679 and ESK19243 carry no licence of their own, so Eskom's website terms and the Data Portal
  disclaimer apply (personal, educational or non-commercial use; no reproduction, distribution or
  publication without written consent; clause 2.10, no automated collection from the website).
  Consent has been requested. Until it is given: keep ESK files local; derived results and single
  calibration constants may be published, with Eskom credited and a note that the analysis is ours,
  not Eskom's; never publish raw or per-unit hourly series; no scripted fetches from eskom.co.za
  beyond one-off checks. Without it the suite shows
  one failing and three skipped checks in validate_weather and validate_benchmarks; say so when
  reporting counts.

## Running the suite (from harness/)

    node validate_lint.js testroot        node validate_structure.js testroot
    node validate_geo.js testroot         node validate_capacity.js testroot
    node validate_inputs.js testroot      node validate_findings.js testroot
    node validate_invariants.js testroot  node validate_response.js testroot
    node validate_weather.js testroot     node validate_lp.js testroot
    node validate_consistency.js testroot node validate_benchmarks.js testroot
    node validate_external.js testroot    node validate_solve.js testroot
    node validate_outputs.js testroot     python3 audit.py testroot/index.html
    node eng5.js

Expected (17 Oct 2026, build 2026-10-17a, branch claude/tou-171 on main a9691ab, ESK19679.csv present, preset searches
running beside it): 820/825, node checks 733/738 plus audit 87/87; eng5 5/6. 17a moves the time-of-use windows to Eskom's
2025/26 schedule and splits validate_consistency's Megaflex median check in two, both passing (message 183 (1); RESULTS
'Time-of-use windows on Eskom's 2025/26 schedule'). On 16h (central c5e, branch claude/c5e): 819/824, node checks 732/737 plus
audit 87/87; eng5 5/6. The same on 16g (branch claude/pack-c5d on main 8f10c8e) and 16e
(main aa23aa5): 16g adds the s_tariffcf flag, off, and 16h makes 'run' the default; neither changes a check's status (RESULTS
'Build 2026-10-16h'). 16e added one check, passing (validate_consistency
'CCS at the default share cuts emissions part of the way', message 157 (3)). On build 16c (main e6da3eb, nothing else running) it
was 818/823; on 15f 816/821; 16b added two checks, both passing (the LICENSE list, the LCOE anchors' capacity factors). 815/821 and eng5 6/6 on build 15d, branch claude/comply. eng5's one failure, check 6 'storage cuts
unserved', is intended behaviour (user, 16 Oct 2026, message 141): since build 15e spare gas charges the existing stores ahead of
a forecast shortfall (laGasCharge), which cuts unserved energy with no new batteries by 12%, so 30 GW of new batteries cut it
8.3% against the check's 10% (RESULTS 'New central c5d'). The check is unchanged; its redesign waits for after the note (TODO
14ew). Build 16a measured the same counts. The five known failures, by check name, each with its cause in RESULTS ('Scenario switch and load timing' lists them; values on
15f in 'Build 2026-10-15f: suite and every check that changed status'):

1. validate_external: 'EDMSA Scenario A CO2 2035 within 22 Mt of the published figure' (cause only partly traced, RESULTS
   'EDMSA Scenario A CO2 2035').
2. validate_findings: 'with gas, 20 GW of 100-hour iron-air barely moves July'.
3. validate_findings: 'preset curtailment sits within its weather band' (waits on the preset re-search, TODO 14ef).
4. validate_consistency: 'high-season off-peak is the cheapest block modelled' (the Megaflex block).
5. validate_benchmarks: 'peakerSeasonRatio is physically plausible'.

Pumped-storage output passes from 15f (the
storage fix). 'The build stamp is not stale' (validate_structure)
fails whenever BUILD_STAMP is older than the day the suite runs. Without ESK19679.csv, validate_weather adds a
failure (the missing Eskom reference) and validate_benchmarks skips the fleet-normalised wind check.

## Rules that matter most (RULES.md has the full set)

1. Run the full suite before and after any change to index.html, and report the counts.
2. Never relax a check to make a change pass; establish the cause first.
3. Recompute, never hand-edit derived data. No constant appears twice.
4. Before believing a zero or a null, confirm the key exists.
5. Bump BUILD_STAMP in index.html on every delivered change.
6. Record every finding in RESULTS.md with the build stamp and every setting needed to reproduce it.
7. Keep TODO.md current.

## Working with git

Never push to main. Make each change on a new branch and open a pull request, with a short
description of what changed and the suite counts. Nick reviews and merges.

## Render checks

Render checks on a fresh page load use the Playwright tools (the 'playwright' MCP server in .mcp.json) when they are
available; otherwise a Playwright script against /opt/pw-browsers/chromium.

## Writing and reporting

- Lead with what changed and what it measured. Short. One flag beats five paragraphs.
- State the finding, the scenario and the caveat; do not explain mechanisms in prose.
- En dashes, never em dashes. No italics. No words in all caps.
- End every message with a short running list of the pressing outstanding tasks.
- Push back when something is asserted as safe or settled; never fudge a test to pass.
- Times (user, 16 Oct 2026, message 165): in chat and PR descriptions, give times in South Africa time (SAST, UTC+2) and
  label them, e.g. "19:58 SAST". RESULTS keeps UTC, labelled, as now, so the record stays consistent.

## Research helpers

Subagents follow the same rules as the main session (user, 13 Oct 2026): web search first; Firecrawl only for a page
the web reader cannot open, never for long PDFs; no reads of eskom.co.za. Put these rules in every research brief.

## Long runs

Pathway loops take 5 to 30 minutes and can use several GB of memory. Run them in the background,
write output to a file, and report progress.
