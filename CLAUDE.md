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
    node validate_outputs.js testroot     node validate_pathway_presets.js testroot
    node validate_public_text.js testroot node validate_stored_panels.js testroot
    node validate_links.js testroot       node validate_worker.js testroot
    node validate_bids.js testroot
    python3 audit.py testroot/index.html  node eng5.js

validate_links.js (user, 20 Oct 2026, message 263 (1)): a ?preset= link, a reload after each preset click, a preset with a
slider moved, and links with new wind and new solar each compute exactly what the click computes; 48 checks, about 5 minutes.
validate_bids.js (user, 28 Oct 2026, messages 468 (d) and 469 (c)): the model's cost of solar, wind and lithium against recent South
African bids, two-sided at 10%; each flag fixed or carrying a stated reason; about 1 minute.
validate_worker.js (user, 20 Oct 2026, message 260 (3)) runs the page in Chromium (/opt/pw-browsers) and checks the engine's
web worker against the page's own engine on start-up and every preset, to the digit: 38 checks, about 20 minutes.

Every pull request that changes index.html first regenerates the stored risk panels:
`node validate_stored_panels.js testroot --write` (RULES.md, 'Stored risk panels').

Expected (19 Oct 2026, build 2026-10-19e, branch claude/presets-214, ESK19679.csv present, nothing running beside it):
880/884, node checks 792/796 plus audit 88/88; eng5 5/6 (validate_pathway_presets: 37 checks, about 12 minutes;
validate_public_text: 22 checks, internal labels, missing values, Eskom Data Portal IDs, code identifiers and the 40-word site-copy cap in visible text, messages 235, 241, 377 and 378). The full suite
takes over 30 minutes: run it in parts or in the foreground. The known failures, each with its
cause and the build it first failed on in RESULTS 'Known failures on build 2026-10-18i' (message 205 (8)):

1. validate_findings: 'with gas, 20 GW of 100-hour iron-air barely moves July' (failing on 13h).
2. validate_consistency: 'high-season off-peak is the cheapest block modelled' (from 14d; the user's decision to replace it
   after the note, TODO 14dy; the NERSA-note premise in its message is contradicted by the 2026/27 booklet, TODO 14gd).
3. validate_benchmarks: 'peakerSeasonRatio is physically plausible' (from 14a).
4. eng5 check 6, 'storage cuts unserved': intended behaviour (user, 16 Oct 2026, message 141): since build 15e spare gas charges
   the existing stores ahead of a forecast shortfall, so 30 GW of new batteries cut unserved 8.3% against the check's 10%; its
   redesign waits for after the note (TODO 14ew).

No longer a known failure (message 524 (b)): validate_external's 'EDMSA Scenario A CO2 2035 within 22 Mt', failing from 2026-10-01a
to 2026-10-23a, passes from 2026-10-24b (PR C's coal rules; 117.0 against 124 Mt on 29b). Cause in RESULTS 'EDMSA Scenario A CO2
2035'. From 30 Oct 2026 every validate_external check runs at the year it names (message 526 (b); RESULTS 'Every external
check at the year it names'): EDMSA 108.1 Mt at 2035.

Each is to be settled after the note by fixing the model, correcting the check with its cause, or withdrawing the finding (TODO 14gm); the iron-air finding stays out of the note and the pack until then. The preset curtailment band passes from the presets build (17i, TODO 14ef). Pumped-storage output passes from 15f (the
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
- "Plant" (user, 31 Oct 2026, messages 569 (a) and 570 (a)): never as a collective noun for several power plants ("REIPPPP
  plant", "coal plant" meaning the fleet, "peaking plant", "spinning plant"); write "plants". "Plant" for one power plant ("the
  Medupi plant") and "plant" describing another noun ("plant outages", "plant-level") are fine.
- End every message with a short running list of the pressing outstanding tasks.
- Push back when something is asserted as safe or settled; never fudge a test to pass.
- Site copy (user, 25 Oct 2026, messages 377 and 378): a slider note or preset caption states the default and its basis in one
  or two sentences, at most about 40 words; no model history, no tutorial wording, no Eskom Data Portal IDs on the page. Every
  pull request that changes visible text includes a "Visible text changed" section from
  `node diff_public_text.js testroot --base <base commit>`; the advisor reviews it before merge (RULES.md, 'Site copy').
- Times (user, 16 Oct 2026, message 165): in chat and PR descriptions, give times in South Africa time (SAST, UTC+2) and
  label them, e.g. "19:58 SAST". RESULTS keeps UTC, labelled, as now, so the record stays consistent.

## Research helpers

Subagents follow the same rules as the main session (user, 13 Oct 2026): web search first; Firecrawl only for a page
the web reader cannot open, never for long PDFs; no reads of eskom.co.za. Put these rules in every research brief.

## Long runs

Pathway loops take 5 to 30 minutes and can use several GB of memory. Run them in the background,
write output to a file, and report progress. Record each background job's PID when it starts and stop it by that PID only, never by
pattern match (pkill -f and the like; RULES.md, 'Stop background jobs by their PID').

Start every long job with the Bash tool's own background option (run_in_background, timeout under 2 hours), never with nohup or &
(user, 27 Oct 2026, messages 434 and 436). These cloud sessions stop nohup and & jobs once a reply ends and the session goes idle,
and an idle session's machine is reclaimed; a run_in_background job is tracked across replies for up to 2 hours and keeps the
session awake. Split longer work into pieces under 2 hours that resume where the last stopped (resumable scripts: the pathway
chains, harness/run_suite pieces, validate_stored_panels.js), and relaunch the next piece at each check-in or completion notice.
Evidence: HANDOVER 'Restarts were idle shutdowns'.
