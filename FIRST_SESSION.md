Paste this as the first message in Claude Code on the web:

Read CLAUDE.md, RULES.md, HANDOVER.md, TODO.md and MANIFEST.md. Then:

1. Make sure ESK*.csv is in .gitignore.
2. In harness/, create the link `ln -s .. testroot` and run `npm install jsdom highs eslint`.
3. Run the full suite as CLAUDE.md describes and report the counts, noting which checks are skipped
   or fail because ESK19679.csv is not present. Do not change any model files.
4. If the suite matches the expected counts (allowing for ESK19679.csv), run
   `node pathway/pathway_half.js` from harness/ in the background (OUT=pathway_half.json). It is the
   least-cost pathway to 2040 at half the reliability standard, with outage-path stress windows.
   When it finishes, run pathcheck.js on it (IN=pathway_half.json OUTC=pathcheck_half.json) and
   report the build by 2040, whether every year meets half the standard, cost and CO2 over
   2026-2040, against harness/pathway/pathcheck_op.json (the same run at the full standard).
5. Put the results in RESULTS.md and TODO.md on a new branch and open a pull request.
