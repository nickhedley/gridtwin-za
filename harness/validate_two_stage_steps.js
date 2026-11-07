#!/usr/bin/env node
/**
 * validate_two_stage_steps.js: Deep's and Fossil-free's settings build the right LP in a two-stage step (test 15, messages 724 (b) and
 * 760 (c)). Two faults it catches, each found in test 15 on claude/twin-retime build 2026-11-05j:
 *   1. CO2_ELASTIC in a step whose window holds no year under the cap (Deep's 2026-2030 steps; the cap from 2035): the step stopped with
 *      'CO2_ELASTIC: no co2cap_<y> rows'. Now it logs that nothing is priced and writes the LP.
 *   2. IA_TOTAL in a step with earlier years fixed (FIX_FROM): the total row (iatot) counted only the step's free years, so iron-air fixed
 *      by earlier steps fell outside it and each step could add IA_TOTAL again. Now the row counts every year's iron-air column.
 * Each case writes a step's LP (DUMP_LP, DUMP_STOP=1; nothing is solved) with the central's settings (pathway/env_c6a.sh) and Deep's
 * settings read from pathway/chain_c7.sh's deep() line, at the chain's first cap (36.382 Mt; structure only), on the page's default days.
 * About 2 minutes.
 *
 *   node validate_two_stage_steps.js [root] [--script <pathway script>]
 *     --script: the pathway script to test (default pathway/pathway_perfail.js); a copy without the fix must FAIL both cases.
 */
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const HARNESS = __dirname;
const SI = process.argv.indexOf('--script');
const SCRIPT = SI > 0 ? path.resolve(process.argv[SI + 1]) : path.join(HARNESS, 'pathway', 'pathway_perfail.js');
let pass = 0, fail = 0;
const check = (name, ok, detail) => { if (ok) pass++; else fail++; console.log((ok ? '  ok   ' : '  FAIL ') + name + (ok || !detail ? '' : '  -  ' + detail)); };

const chain = fs.readFileSync(path.join(HARNESS, 'pathway', 'chain_c7.sh'), 'utf8');
const deepAt = chain.search(/^deep\(\)\{/m), deepLine = deepAt < 0 ? '' : chain.slice(deepAt);   // deep() and what follows it
const DEEP = (deepLine.match(/GAS_CAP=[^$]*CO2CAP=\S+/) || [''])[0].trim();
check('Deep\'s settings read from chain_c7.sh\'s deep() line', /IA_TOTAL=\d+/.test(DEEP) && /CO2_ELASTIC=\d+/.test(DEEP) && /CO2CAP=[0-9.]+:2035/.test(DEEP), DEEP || 'deep() line not found');
const env0 = Object.fromEntries(DEEP.split(/\s+/).filter(Boolean).map(kv => kv.split('=')));
const cap = 36.382, CAPY = [2035, 2036, 2037, 2038, 2039, 2040].map(y => y + ':' + cap).join(',');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'v2s-'));
const FIX = path.join(TMP, 'fixed.json');
fs.writeFileSync(FIX, JSON.stringify({ build: { b_ironair_2030: 120 } }));   // one earlier step's iron-air, fixed

function dump(name, extra){
  const env = { ...process.env, ...env0, CO2CAP_YEARS: CAPY, MAXP: '1', STRESS_TARGET: '1', LPCACHE: path.join(TMP, 'lpc_' + name),
    OUT: path.join(TMP, name + '.json'), DUMP_LP: path.join(TMP, name), DUMP_STOP: '1', ...extra };
  delete env.HIGHS_OPTS;
  const r = cp.spawnSync('bash', ['-c', 'source pathway/env_c6a.sh >/dev/null 2>&1; export ' + Object.keys(env0).map(k => k + '=' + env0[k]).join(' ') +
    '; exec node --max-old-space-size=8192 ' + JSON.stringify(SCRIPT)], { cwd: HARNESS, env, encoding: 'utf8', maxBuffer: 1 << 26 });
  const lp = path.join(TMP, name + '_pass1.lp');
  return { rc: r.status, log: (r.stdout || '') + (r.stderr || ''), lp: fs.existsSync(lp) ? fs.readFileSync(lp, 'utf8') : null };
}

// 1. A window with no year under the cap: step 2026, window 2026-2027 (the cap starts in 2035).
const a = dump('step2026', { OPER_FROM: '2026', HORIZON: '2027' });
check('step 2026 (no year under the cap) writes its LP', a.rc === 0 && !!a.lp, 'rc ' + a.rc + '; ' + ((a.log.match(/Error: [^\n]*/) || [''])[0]));
check('step 2026 says nothing is priced', /CO2_ELASTIC: no year under the cap in this LP; nothing priced/.test(a.log), 'no such log line');
check('step 2026 holds no co2cap row', !!a.lp && !/^ co2cap_\d{4}:/m.test(a.lp), 'a co2cap row is present');

// 2. Earlier years fixed: step 2036, window 2036-2037, b_ironair_2030 fixed at 120 MW.
const b = dump('step2036', { OPER_FROM: '2036', HORIZON: '2037', FIX_FROM: FIX, FIX_TO: '2035' });
check('step 2036 writes its LP', b.rc === 0 && !!b.lp, 'rc ' + b.rc + '; ' + ((b.log.match(/Error: [^\n]*/) || [''])[0]));
const row = b.lp ? ((b.lp.match(/^ iatot: (.*) <= ([0-9.]+)$/m) || [])) : [];
const terms = row[1] ? row[1].split(' + ').map(s => s.trim()) : [];
const yrs = terms.map(t => +t.slice(-4)).sort();
const all = Array.from({ length: 12 }, (_, i) => 2026 + i);
check('the iron-air total holds the fixed year (b_ironair_2030)', terms.includes('b_ironair_2030'), 'iatot: ' + (row[1] || 'missing'));
check('the iron-air total holds every year 2026-2037 once', JSON.stringify(yrs) === JSON.stringify(all), 'years ' + JSON.stringify(yrs));
check('the iron-air total is IA_TOTAL', row[2] !== undefined && +row[2] === +env0.IA_TOTAL, 'rhs ' + row[2]);
check('b_ironair_2030 is fixed at 120 in the LP', !!b.lp && /^ b_ironair_2030 = 120$/m.test(b.lp), 'bound not found');
check('the capped years carry their slack (co2sl_2036, co2sl_2037)', !!b.lp && /^ co2cap_2036: .* - co2sl_2036 <= /m.test(b.lp) && /^ co2cap_2037: .* - co2sl_2037 <= /m.test(b.lp), 'slack missing');

fs.rmSync(TMP, { recursive: true, force: true });
console.log('\n' + pass + '/' + (pass + fail) + ' passed' + (SI > 0 ? ' (script ' + SCRIPT + ')' : ''));
process.exit(fail ? 1 : 0);
