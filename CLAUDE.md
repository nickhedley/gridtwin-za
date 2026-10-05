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
  repository and must never be committed. Keep ESK*.csv in .gitignore. Without it the suite shows
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

Expected with ESK19679.csv present: 805/806, the one failure EDMSA Scenario A CO2 2035; eng5 6/6.

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

## Writing and reporting

- Lead with what changed and what it measured. Short. One flag beats five paragraphs.
- State the finding, the scenario and the caveat; do not explain mechanisms in prose.
- En dashes, never em dashes. No italics. No words in all caps.
- End every message with a short running list of the pressing outstanding tasks.
- Push back when something is asserted as safe or settled; never fudge a test to pass.

## Long runs

Pathway loops take 5 to 30 minutes and can use several GB of memory. Run them in the background,
write output to a file, and report progress.
