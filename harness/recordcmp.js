// SETTINGS RECORD COMPARISON (user, 14 Oct 2026: c5's sensitivities; branch claude/recheck-14d, never merged; solves
// nothing). Reads two pathway outputs (pathway_<name>.json) and prints every recorded setting that differs between them,
// so a sensitivity can be confirmed to change only its one setting from the central. The run's results (build, sched,
// log, objective and the like) are left out, except coal standing by year: COAL_DATES is not a recorded field, so the
// input schedule is read from sched[y].coalMW. Settings with no recorded field (WIND_CASE, GAS_CAP) cannot be confirmed
// here; the dispatch line in the run's log is their record.
// Usage, from harness/: node recordcmp.js <central pathway json> <sensitivity pathway json>
const fs = require('fs');
const [A, B] = process.argv.slice(2).map(f => JSON.parse(fs.readFileSync(f, 'utf8')));
const RESULTS = new Set(['build', 'lpWindows', 'mergeMismatch', 'margin', 'secs', 'verdict', 'log', 'sched', 'objective', 'status', 'peakerExt']);
const keys = [...new Set([...Object.keys(A), ...Object.keys(B)])].filter(k => !RESULTS.has(k));
const missing = keys.filter(k => !(k in A) || !(k in B));
const diff = keys.filter(k => (k in A) && (k in B) && JSON.stringify(A[k]) !== JSON.stringify(B[k]));
const show = v => { const s = JSON.stringify(v); return s.length > 300 ? s.slice(0, 300) + '...' : s; };
console.log(`settings recorded: ${keys.length} fields; differing: ${diff.length ? diff.join(', ') : 'none'}`);
for (const k of diff) console.log(`  ${k}: ${show(A[k])} -> ${show(B[k])}`);
if (missing.length) console.log(`  in one record only: ${missing.join(', ')}`);
const coal = r => Object.fromEntries(Object.entries(r.sched || {}).map(([y, s]) => [y, s.coalMW]));
const ca = coal(A), cb = coal(B), cy = Object.keys(ca).filter(y => ca[y] !== cb[y]);
console.log(`coal standing by year (input schedule, sched.coalMW): ${cy.length ? 'differs in ' + cy.map(y => `${y} ${ca[y]} -> ${cb[y]}`).join(', ') : 'same in every year'}`);
