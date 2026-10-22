#!/usr/bin/env node
// validate_register.js <root>: the input register's checks (user, 22 Oct 2026, messages 310 (b), 312, 313 (c)).
// Fails when an input in the code has no entry in inputs_meta.json, an entry names no input, a SOURCES pointer names a heading
// that does not exist, a 'sourced' entry has no pointer or its confirmed value no longer matches the code, a derived entry has
// no parents, the counts of 'not yet reviewed' or 'no recorded source' (derived counted at their weakest parent) rise above
// inputs_baseline.json (a ratchet: lowering the baseline is allowed, raising it needs the user's say-so), or INPUTS.md is not
// what inputs_register.js would write now.
'use strict';
const fs = require('fs'), path = require('path');
const R = require('./inputs_register.js');
(async () => {
  const root = path.resolve(process.argv[2] || 'testroot');
  const meta = JSON.parse(fs.readFileSync(path.join(__dirname, 'inputs_meta.json'), 'utf8'));
  const baseline = JSON.parse(fs.readFileSync(path.join(__dirname, 'inputs_baseline.json'), 'utf8'));
  const items = await R.extract(root), S = R.readSources(root);
  const { errs, counts } = R.check(items, meta, S, baseline);
  let pass = 0, fail = 0; const ok = (n, c, d) => { c ? pass++ : fail++; console.log((c ? '  ok   ' : '  FAIL ') + n + (c || !d ? '' : '  -  ' + d)); };
  const kind = re => errs.filter(e => re.test(e));
  ok('every input in the code has a register entry', !kind(/^no register entry/).length, kind(/^no register entry/).slice(0, 5).join('; '));
  ok('every register entry names an input in the code', !kind(/names no input/).length, kind(/names no input/).slice(0, 5).join('; '));
  ok('every SOURCES pointer names a heading that exists', !kind(/which does not exist/).length, kind(/which does not exist/).slice(0, 5).join('; '));
  ok('statuses are known, sourced entries point to SOURCES, derived entries list parents',
     !kind(/unknown status|with no SOURCES pointer|no parents listed|has no register entry/).length,
     kind(/unknown status|with no SOURCES pointer|no parents listed|has no register entry/).slice(0, 5).join('; '));
  ok('every sourced value still matches the code', !kind(/the code now reads/).length, kind(/the code now reads/).slice(0, 5).join('; '));
  ok(`'not yet reviewed' and 'no recorded source' within the baseline (${baseline['not yet reviewed']} and ${baseline['no recorded source']})`,
     !kind(/against the baseline/).length, kind(/against the baseline/).join('; '));
  const want = R.writeMd(root, items, meta, counts) + '\n', have = fs.existsSync(path.join(root, 'INPUTS.md')) ? fs.readFileSync(path.join(root, 'INPUTS.md'), 'utf8') : '';
  ok('INPUTS.md is what inputs_register.js writes (never edited by hand)', want === have, 'run node inputs_register.js testroot and commit INPUTS.md');
  console.log('\n  inputs ' + Object.keys(items).length + '; own status ' + JSON.stringify(counts.direct) + '; derived at weakest parent ' + JSON.stringify(counts.effective));
  console.log(`\n${pass}/${pass + fail} register checks passed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
