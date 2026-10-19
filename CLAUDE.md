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
    python3 audit.py testroot/index.html  node eng5.js

Expected (19 Oct 2026, build 2026-10-19b, branch claude/lcp2035-preset, ESK19679.csv present, nothing running beside it):
849/853, node checks 761/765 plus audit 88/88; eng5 5/6 (validate_pathway_presets: 23 checks, about 7.5 minutes). The known failures, each with its
cause and the build it first failed on in RESULTS 'Known failures on build 2026-10-18i' (message 205 (8)):

1. validate_external: 'EDMSA Scenario A CO2 2035 within 22 Mt of the published figure' (cause partly traced; failing on the
   repository's first build, 2026-10-01a).
2. validate_findings: 'with gas, 20 GW of 100-hour iron-air barely moves July' (failing on 13h).
3. validate_consistency: 'high-season off-peak is the cheapest block modelled' (from 14d; the user's decision to replace it
   after the note, TODO 14dy; the NERSA-note premise in its message is contradicted by the 2026/27 booklet, TODO 14gd).
4. validate_benchmarks: 'peakerSeasonRatio is physically plausible' (from 14a).
5. eng5 check 6, 'storage cuts unserved': intended behaviour (user, 16 Oct 2026, message 141): since build 15e spare gas charges
   the existing stores ahead of a forecast shortfall, so 30 GW of new batteries cut unserved 8.3% against the check's 10%; its
   redesign waits for after the note (TODO 14ew).

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
