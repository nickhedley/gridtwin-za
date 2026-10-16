# Representative days test (message 122 (1), 15 Oct 2026)

Re-chooses the optimiser's eight evenly spaced calendar days so new wind and tracking solar on the twelve days match their
twelve-year means, keeping bldRepDays' four selected days and equal weights. Result: RESULTS 'PROVISIONAL: representative days test'.

- days_dump_snippet.js: the SN_DAYS block added to the single-node engine check (validation/single_node/pathcheck_sn.patch) to write
  per-day means of new wind, tracking solar, existing wind, fixed-tilt solar and demand, and the twelve-year means. Its output is
  derived from the model's profiles: keep it local, do not commit it.
- rechoose.py <days.json> <out.json>: picks one day per 45-day block (option (a) by choice of days).
- weights.py <days.json>: the reweighting alternative, rejected (it needs 115-132 days of weight on day 180).
- pathway_repdays.patch: REPDAYS override for harness/pathway/pathway_perfail.js (scratch, not on main).
- report.py <harness> <sens dir>: the build, cost, CO2 and adequacy tables.
