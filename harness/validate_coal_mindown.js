#!/usr/bin/env node
/**
 * validate_coal_mindown.js: the build LP's coal minimum down time and start-up lead time (bldCoalMinDownLP; user, 7 Nov 2026, message
 * 767 (b); TODO 14ka). The engine keeps a coal unit off for coalMinDownH (24 h central) and then needs its start-up time (warm, 6 h, at
 * 24 h offline) before it runs again; with the switch on, the LP may not commit again, within W = 30 h, coal it took off. Checks:
 *   1. the switch off writes the LP of the switch absent, byte for byte;
 *   2. the switch on writes a shut-down row (csd_) and a down-window row (cmd_) for every hour, each window the W hours back along the
 *      same chain as the commitment rows (W on a chained day; a free-standing day wraps once, 24), W read from the page's engine settings;
 *   starts: with the switch on, each start is priced as a start after the minimum down time (warm), above the hot start;
 *   3. solved (one year, 2035, on the 25 days, 20 GW of new solar fixed so that daily cycling pays), no hour commits coal that was taken
 *      off within W hours: committed + MW taken off in the window <= available, from the solution's commitment alone.
 * With a page copy whose down-window rows are not written (--root <dir>, the fault injected), checks 2 and 3 FAIL (3 of 10 on 7 Nov 2026);
 * with the start-up time left out of the window, 2 of 10; with starts priced hot, 1 of 10.
 * 4. the minimum up time (bldCoalMinUpLP, message 778 (b) (i)): U from UC_FLEET, a cmu_ row an hour, and solved, nothing started within U hours
 *    is decommitted; 5. the start cap (bldCoalStartCap, (ii)): capped at half the uncapped starts, the starts within the cap and binding.
 * 6. reserve on committed coal (bldResCommitLP, message 785 (b)): the row's form against the switch-off row, and solved, every hour's
 *    requirement met by committed headroom plus the other cover.
 * About 4 minutes (eight LPs written, five solved with highs_native.py).
 *
 *   node validate_coal_mindown.js [root] [--root <page folder>]
 */
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const HARNESS = __dirname, RI = process.argv.indexOf('--root');
const PAGE = RI > 0 ? path.resolve(process.argv[RI + 1]) : null;
let pass = 0, fail = 0;
const check = (name, ok, detail) => { if (ok) pass++; else fail++; console.log((ok ? '  ok   ' : '  FAIL ') + name + (ok || !detail ? '' : '  -  ' + detail)); };
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'vcm-'));
const FIX = path.join(TMP, 'fixed.json');
fs.writeFileSync(FIX, JSON.stringify({ build: { b_pv_2030: 20000 } }));   // 20 GW of new solar standing in 2035: midday surplus
// The window from the engine's own settings in the page under test (FIXED.coalMinDownH, FIXED.coalStartupH by COAL_START_OFFLINE_H.sub,
// the start class at that many hours offline), read here, not from the LP code: 24 + 6 (warm, 12-40 h offline) = 30 h central.
const HTML = fs.readFileSync(path.join(PAGE || path.join(HARNESS, 'testroot'), 'index.html'), 'utf8');
const MDH = +(HTML.match(/^\s*coalMinDownH:(\d+),/m) || [])[1], SUH = ((HTML.match(/^\s*coalStartupH:\[([^\]]+)\],/m) || [])[1] || '').split(',').map(Number),
  OFF = ((HTML.match(/const COAL_START_OFFLINE_H = \{ sub: \[([^\]]+)\]/) || [])[1] || '').split(',').map(Number);
const W_CENTRAL = MDH + SUH[MDH < OFF[0] ? 0 : MDH < OFF[1] ? 1 : 2];
check('the engine\'s minimum down time and start-up times read from the page (window ' + W_CENTRAL + ' h)', W_CENTRAL >= 1 && SUH.length === 3 && OFF.length === 2,
  'coalMinDownH ' + MDH + ', coalStartupH ' + SUH + ', COAL_START_OFFLINE_H.sub ' + OFF);

function lp(name, coalState){
  const env = { ...process.env, OPER_FROM: '2035', HORIZON: '2035', FIX_FROM: FIX, FIX_TO: '2034', MAXP: '1', LPCACHE: path.join(TMP, 'lpc_' + name),
    OUT: path.join(TMP, name + '.json'), DUMP_LP: path.join(TMP, name), DUMP_STOP: '1', ...(PAGE ? { PAGE_ROOT: PAGE } : {}) };
  if (coalState) env.COAL_STATE = coalState; else delete env.COAL_STATE;
  delete env.HIGHS_OPTS;
  const r = cp.spawnSync('bash', ['-c', 'source pathway/env_c6a.sh >/dev/null 2>&1; exec node --max-old-space-size=8192 pathway/pathway_perfail.js'],
    { cwd: HARNESS, env, encoding: 'utf8', maxBuffer: 1 << 26 });
  const f = path.join(TMP, name + '_pass1.lp');
  return { rc: r.status, log: (r.stdout || '') + (r.stderr || ''), file: f, text: fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null };
}

// 1. Off is the LP without the switch.
const a = lp('absent', null), b = lp('off', '{"bldCoalMinDownLP":0}');
check('the switch off writes the LP of the switch absent, byte for byte', !!a.text && a.text === b.text, 'rc ' + a.rc + '/' + b.rc + ((a.log.match(/Error: [^\n]*/) || [''])[0]));
check('without the switch, no csd_ or cmd_ row', !!a.text && !/^ (csd|cmd)_/m.test(a.text), 'rows present');
const z = lp('alloff', '{"bldCoalMinDownLP":0,"bldCoalMinUpLP":0,"bldCoalStartCap":null,"bldResCommitLP":0}');
check('the four switches off (down time, up time, start cap, reserve on committed coal) write the LP of the switches absent, byte for byte', !!a.text && a.text === z.text, 'differs');

// 2. On: one csd_ and one cmd_ row an hour, each window W back along the commitment chain.
const c = lp('on', '{"bldCoalMinDownLP":1}');
check('the switch on writes its LP', c.rc === 0 && !!c.text, 'rc ' + c.rc + '; ' + ((c.log.match(/Error: [^\n]*/) || [''])[0]));
const T = c.text || '';
const prev = {}, win = {}, rhs = {}, rcCoef = {};
for (const m of T.matchAll(/^ csd_(\S+): sd_\1 - cm_(\S+) \+ cm_\1 >= 0$/gm)) prev[m[1]] = m[2];
for (const m of T.matchAll(/^ cmd_(\S+): cm_\1((?: \+ [0-9.]+ rc_\d{4})?)((?: \+ sd_\S+)+) <= ([0-9.]+)$/gm)){
  win[m[1]] = m[3].trim().split(' + ').filter(Boolean).map(t => t.replace(/^\+ /, '').replace(/^sd_/, ''));
  rhs[m[1]] = +m[4]; const rc = m[2].match(/([0-9.]+) rc_/); rcCoef[m[1]] = rc ? +rc[1] : 0; }
const hours = [...T.matchAll(/^ cmax_(\S+): cm_\1/gm)].map(m => m[1]);
check('a csd_ and a cmd_ row for every committed hour', hours.length > 0 && hours.every(k => prev[k] && win[k]), hours.length + ' hours, ' + Object.keys(prev).length + ' csd_, ' + Object.keys(win).length + ' cmd_');
const expect = k => { const out = [], seen = new Set(); let q = k; while (out.length < W_CENTRAL && !seen.has(q)){ seen.add(q); out.push(q); q = prev[q]; if (!q) break; } return out; };
const bad = hours.filter(k => win[k] && JSON.stringify(win[k]) !== JSON.stringify(expect(k)));
check('each window holds the ' + W_CENTRAL + ' hours back along the chain (a free-standing day wraps once)', hours.length > 0 && bad.length === 0, bad.length + ' windows differ, first ' + bad[0]);
check('chained days reach ' + W_CENTRAL + ' hours', Object.values(win).some(v => v.length === W_CENTRAL), 'no window of ' + W_CENTRAL);

// Starts priced after the minimum down time: each su_ cost with the switch on above the switch off's (a warm start against a hot one).
const suCost = t => { const o = {}; if (!t) return o; const i = t.indexOf(' obj:'), j = t.indexOf('\nSubject To');
  for (const m of t.slice(i, j).replace(/\n/g, ' ').matchAll(/([-+]?\s*[0-9.eE+-]+)\s+su_(\S+)/g)) o[m[2]] = +m[1].replace(/\s/g, ''); return o; };
const s0 = suCost(b.text), s1 = suCost(c.text), sk = Object.keys(s1);
const ratio = sk.length ? sk.reduce((a, k) => a + s1[k] / s0[k], 0) / sk.length : NaN;
console.log('  info: start cost with the switch on over off, mean ' + ratio.toFixed(3) + ' over ' + sk.length + ' starts');
check('with the switch on each start is priced above the hot start (after the minimum down time)', sk.length > 0 && sk.every(k => s0[k] > 0 && s1[k] > s0[k]),
  sk.filter(k => !(s1[k] > s0[k])).length + ' of ' + sk.length + ' not above');

// 3. Solved: from the commitment alone, nothing taken off within W hours is committed again.
let viol = [];
if (c.text){
  const solf = path.join(TMP, 'on_sol.json');
  const r = cp.spawnSync('python3', ['highs_native.py', c.file, solf, '900'], { cwd: HARNESS, encoding: 'utf8', env: { ...process.env, HIGHS_OPTS: '{"simplex_strategy": 2, "threads": 2}' } });
  const S = fs.existsSync(solf) ? JSON.parse(fs.readFileSync(solf, 'utf8')) : null;
  check('the switch-on LP solves to optimality', !!S && S.Status === 'Optimal', S ? S.Status : 'no solution (rc ' + r.status + ')');
  if (S){
    const v = n => (S.Columns[n] || { Primal: 0 }).Primal;
    // The chain from the commitment rows themselves (csu_ or csd_): rebuild it without the down-window rows, so the check holds even where
    // they are missing.
    const chain = {};
    for (const m of T.matchAll(/^ csu_(\S+): su_\1 - cm_\1 \+ cm_(\S+) >= 0$/gm)) chain[m[1]] = m[2];
    for (const k of Object.keys(prev)) chain[k] = prev[k];
    const cmaxRhs = {}; for (const m of T.matchAll(/^ cmax_(\S+): cm_\1(?: \+ ([0-9.]+) rc_\d{4})? <= ([0-9.]+)$/gm)) cmaxRhs[m[1]] = [+(m[2] || 0), +m[3]];
    const rcv = (T.match(/rc_(\d{4})/) || [])[1]; const rcVal = rcv ? v('rc_' + rcv) : 0;
    for (const k of hours){
      let lhs = v('cm_' + k) + (cmaxRhs[k] ? cmaxRhs[k][0] * rcVal : 0), q = k; const seen = new Set();
      for (let j = 0; j < W_CENTRAL && q && !seen.has(q); j++){ seen.add(q); const p = chain[q]; if (!p) break; lhs += Math.max(0, v('cm_' + p) - v('cm_' + q)); q = p; }
      if (cmaxRhs[k] && lhs > cmaxRhs[k][1] + 1) viol.push([k, +(lhs - cmaxRhs[k][1]).toFixed(1)]);
    }
    let taken = 0; for (const k of hours){ const p = chain[k]; if (p) taken += Math.max(0, v('cm_' + p) - v('cm_' + k)); }
    console.log('  info: MW of commitment taken off over the year\'s hours ' + taken.toFixed(0) + '; hours over the window rule ' + viol.length);
    check('no hour commits coal taken off within ' + W_CENTRAL + ' h (committed + taken off in the window <= available)', viol.length === 0,
      viol.length + ' hours over, the largest by ' + Math.max(...viol.map(x => x[1])) + ' MW at ' + (viol.sort((x, y) => y[1] - x[1])[0] || [])[0]);
  }
}

// Shared: solve an LP file; the commitment chain from the csu_ rows; the year's starts (MW of commitment added, representative days' weights).
const solve = (lpf, name) => { const solf = path.join(TMP, name + '_sol.json');
  cp.spawnSync('python3', ['highs_native.py', lpf, solf, '900'], { cwd: HARNESS, encoding: 'utf8', env: { ...process.env, HIGHS_OPTS: '{"simplex_strategy": 2, "threads": 2}' } });
  return fs.existsSync(solf) ? JSON.parse(fs.readFileSync(solf, 'utf8')) : null; };
const chainOf = t => { const ch = {}; for (const m of t.matchAll(/^ csu_(\S+): su_\1 - cm_\1 \+ cm_(\S+) >= 0$/gm)) ch[m[1]] = m[2]; return ch; };
// The representative days' weights: each day's gc_ coefficient in the objective is the year's coal cost x its weight, so the weights are the
// coefficients scaled to sum to 365 over the days that are not stress days (d >= 1000, left out of the cap as of the gas floor).
const dayW = t => { const i = t.indexOf(' obj:'), j = t.indexOf('\nSubject To'), g = {};
  for (const m of t.slice(i, j).replace(/\n/g, ' ').matchAll(/([-+]?\s*[0-9.eE+-]+)\s+gc_2035_(\d+)_0\b/g)) if (+m[2] < 1000) g[m[2]] = +m[1].replace(/\s/g, '');
  const tot = Object.values(g).reduce((a, x) => a + x, 0); return Object.fromEntries(Object.entries(g).map(([d, x]) => [d, 365 * x / tot])); };
const startsOf = (S, t) => { const v = n => (S.Columns[n] || { Primal: 0 }).Primal, ch = chainOf(t), w = dayW(t);
  let s = 0; for (const [k, p] of Object.entries(ch)){ const d = k.split('_')[1]; if (+d >= 1000) continue; s += w[d] * Math.max(0, v('cm_' + k) - v('cm_' + p)); }
  return s; };

// 4. Minimum up time (bldCoalMinUpLP, message 778 (b) (i)): U from UC_FLEET in the page (the capacity-weighted median of min_up), one
// cmu_ row an hour over the U hours back along the chain, and solved, nothing started within U hours is decommitted.
const UCF = JSON.parse((HTML.match(/const UC_FLEET = (\[[\s\S]*?\]);/) || [])[1] || '[]').map(g => [+g.min_up, +g.cap]).sort((a, b) => a[0] - b[0]);
let UQ = 0; { const tot = UCF.reduce((a, g) => a + g[1], 0); let c0 = 0; for (const [mu, cap] of UCF){ c0 += cap; if (c0 >= tot / 2){ UQ = mu; break; } } }
const uShare = UCF.filter(g => g[0] === UQ).reduce((a, g) => a + g[1], 0) / UCF.reduce((a, g) => a + g[1], 0);
check('the engine\'s minimum up time read from UC_FLEET (median by capacity ' + UQ + ' h, ' + (100 * uShare).toFixed(0) + '% of the capacity)', UQ >= 1, 'UC_FLEET not read');
const u = lp('up', '{"bldCoalMinUpLP":1}'), TU = u.text || '';
const upWin = {}; for (const m of TU.matchAll(/^ cmu_(\S+): cm_\1((?: - su_\S+)+) >= 0$/gm)) upWin[m[1]] = m[2].trim().split(' - ').filter(Boolean).map(x => x.replace(/^- /, '').replace(/^su_/, ''));
const uh = [...TU.matchAll(/^ cmax_(\S+): cm_\1/gm)].map(m => m[1]), uch = chainOf(TU);
const uexp = k => { const out = [], seen = new Set(); let q = k; while (out.length < UQ && !seen.has(q)){ seen.add(q); out.push(q); q = uch[q]; if (!q) break; } return out; };
check('minimum up time on: a cmu_ row for every committed hour, each over the ' + UQ + ' hours back along the chain', uh.length > 0 && uh.every(k => upWin[k] && JSON.stringify(upWin[k]) === JSON.stringify(uexp(k))),
  uh.length + ' hours, ' + Object.keys(upWin).length + ' cmu_ rows, ' + uh.filter(k => upWin[k] && JSON.stringify(upWin[k]) !== JSON.stringify(uexp(k))).length + ' windows differ');
if (u.text){ const S = solve(u.file, 'up'); check('the minimum-up LP solves to optimality', !!S && S.Status === 'Optimal', S ? S.Status : 'no solution');
  if (S){ const v = n => (S.Columns[n] || { Primal: 0 }).Primal; const vu = [];
    for (const k of uh){ let st = 0, q = k; const seen = new Set();
      for (let j = 0; j < UQ && q && !seen.has(q); j++){ seen.add(q); const p = uch[q]; if (!p) break; st += Math.max(0, v('cm_' + q) - v('cm_' + p)); q = p; }
      if (st > v('cm_' + k) + 1) vu.push([k, +(st - v('cm_' + k)).toFixed(1)]); }
    console.log('  info: minimum up time on, starts over the year ' + startsOf(S, TU).toFixed(0) + ' MW; hours under the rule ' + vu.length);
    check('no hour has less committed than was started within ' + UQ + ' h', vu.length === 0, vu.length + ' hours under, the largest by ' + Math.max(...vu.map(x => x[1])) + ' MW'); } }

// 5. The start cap (bldCoalStartCap, message 778 (b) (ii)): the year's starts uncapped, then capped at half of them; the capped LP's starts,
// from its commitment alone on the days' weights, within the cap (1 MW), and the cap binding.
const f0 = lp('cap0', '{"bldCoalMinUpLP":0}'), S0 = f0.text ? solve(f0.file, 'cap0') : null, st0 = S0 ? startsOf(S0, f0.text) : NaN;
const capMW = Math.round(st0 / 2), f1 = lp('cap1', JSON.stringify({ bldCoalStartCap: { 2035: capMW } })), T1 = f1.text || '';
check('the start cap writes one cscap_2035 row over every typical hour\'s su_', (T1.match(/^ cscap_2035: /gm) || []).length === 1 && !/^ cscap_2035: .*su_2035_1\d\d\d_/m.test(T1), 'row count ' + (T1.match(/^ cscap_2035: /gm) || []).length);
const S1 = f1.text ? solve(f1.file, 'cap1') : null, st1 = S1 ? startsOf(S1, T1) : NaN;
console.log('  info: starts over the year uncapped ' + st0.toFixed(0) + ' MW; capped at ' + capMW + ': ' + st1.toFixed(0) + ' MW');
check('capped, the year\'s starts are within the cap (1 MW)', S1 && S1.Status === 'Optimal' && st1 <= capMW + 1, 'starts ' + st1.toFixed(1) + ' against ' + capMW);
check('the cap binds (starts within 1% of it)', st1 >= 0.99 * capMW, 'starts ' + st1.toFixed(1) + ' against ' + capMW);

// 6. Reserve on committed coal (bldResCommitLP, message 785 (b)). The requirement each hour is read from the switch-off LP's own row (its
// right-hand side is available coal less the requirement plus the hydro cover, its b_ terms the growth term): with the switch on, the row
// carries - cm_ and no rc_, its right-hand side is the off row's less available coal, and solved, committed headroom (cm_ - gc_) plus the
// battery, pumped-storage, gas, diesel and slack cover meets the requirement in every hour (1 MW).
const rowsOf = t => { const o = {}; for (const m of (t || '').matchAll(/^ resv_(\S+): (.*) <= (-?[0-9.]+)$/gm)) o[m[1]] = { lhs: m[2], rhs: +m[3] }; return o; };
const capOf = t => { const o = {}; for (const m of (t || '').matchAll(/^ cmax_(\S+): cm_\1(?: \+ [0-9.]+ rc_\d{4})? <= ([0-9.]+)$/gm)) o[m[1]] = +m[2]; return o; };
const R0 = rowsOf(f0.text), ro = lp('rescom', '{"bldResCommitLP":1}'), R1 = rowsOf(ro.text), CAP = capOf(f0.text), rk = Object.keys(R0);
const shapeBad = rk.filter(k => !R1[k] || !R1[k].lhs.startsWith('gc_' + k + ' - cm_' + k + ' - ') || / rc_\d{4}/.test(R1[k].lhs) || !(Math.abs(R1[k].rhs - (R0[k].rhs - CAP[k])) <= 0.2));
check('reserve on committed coal: each resv_ row carries - cm_, no rc_, and the off row\'s right-hand side less available coal (0.2 MW)', rk.length > 0 && shapeBad.length === 0,
  shapeBad.length + ' of ' + rk.length + ' rows differ, first ' + shapeBad[0] + ': ' + (R1[shapeBad[0]] ? R1[shapeBad[0]].lhs.slice(0, 60) + ' <= ' + R1[shapeBad[0]].rhs : 'missing'));
const covered = (S, k) => { const v = n => (S.Columns[n] || { Primal: 0 }).Primal, row = R0[k];
  const grow = [...row.lhs.matchAll(/([0-9.]+) (b_\S+)/g)].reduce((a, m) => a + (+m[1]) * v(m[2]), 0);
  const need = CAP[k] - row.rhs + grow, have = v('cm_' + k) - v('gc_' + k) + ['rgo_', 'rd_', 'rb_', 'rp_', 'rsl_'].reduce((a, q) => a + v(q + k), 0);
  return have - need; };
if (ro.text){ const S6 = solve(ro.file, 'rescom'); check('the reserve-on-committed LP solves to optimality', !!S6 && S6.Status === 'Optimal', S6 ? S6.Status : 'no solution');
  if (S6){ const short = rk.filter(k => covered(S6, k) < -1), offShort = S0 ? rk.filter(k => covered(S0, k) < -1).length : NaN;
    console.log('  info: hours whose reserve is not covered by committed headroom and storage: switch off ' + offShort + ', on ' + short.length + ' of ' + rk.length);
    check('every hour\'s reserve is met by committed coal headroom plus the storage, hydro and gas cover', short.length === 0, short.length + ' hours short, first ' + short[0]); } }

fs.rmSync(TMP, { recursive: true, force: true });
console.log('\n' + pass + '/' + (pass + fail) + ' passed' + (PAGE ? ' (page ' + PAGE + ')' : ''));
process.exit(fail ? 1 : 0);
