#!/usr/bin/env node
/**
 * validate_lint.js — the ONE bug class the rest of the suite cannot see.
 *
 * Every other harness exercises the model: it runs a scenario and checks the
 * numbers. That means a fault only shows up on a code path something actually
 * calls. Two shipped anyway:
 *
 *   battEffMix        referenced in hourlyMatch(), declared 156k characters away
 *                     inside simulate(). Broke the site resource query; the
 *                     caller's catch block reported it as an Open-Meteo outage,
 *                     so it looked transient rather than structural.
 *   rtUpdateTraceInfo called twice by the rooftop roof tracer, never defined
 *                     anywhere. Every click while tracing a roof threw.
 *   battKwhours       used in the pre-feasibility report template. Specifying a
 *                     battery threw and the report failed to render.
 *
 * None were reachable by the engine harnesses. All three are the same fault: an
 * identifier that resolves nowhere. eslint's no-undef finds them in seconds.
 *
 * I first tried to write this as a regex check inside validate_structure.js.
 * Three attempts all failed - flagging names declared in other functions, then
 * result-object properties, then mentions inside comments - and the final
 * version still missed the bug it was written for. The lesson is in the file
 * name: use the tool built for the job.
 *
 * ONE RULE ONLY. This is not a style audit. no-undef, nothing else, so it never
 * becomes noise that gets ignored.
 *
 *   node validate_lint.js [root]
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = process.argv[2] || '.';
const TMP_JS = path.join(__dirname, '.lint_inline.js');
const TMP_CFG = path.join(__dirname, '.lint.config.js');

// Names that legitimately come from elsewhere. Each one is here because it is
// genuinely defined outside the inline scripts - not to silence a finding.
const EXTERNAL = [
  // defined in nodal/nodal_engine.js and nodal/nodal_dispatch.js, loaded by <script src>
  'IMPORTS_CF', 'getNodalMIPInputs', 'loadHeadroomLookup', 'loadFirmHeadroomLookup',
  'FIRM_TECHS', 'substationData', 'CARRIER_NM', 'BTM_BATT_R_PER_KWH', 'BTM_DISPLACED_EF',
  // third-party libraries loaded from CDN
  'L', 'deck', 'maplibregl', 'google', 'highs', 'loadHighs', 'Chart',
];

const BROWSER = [
  'window','document','console','setTimeout','clearTimeout','setInterval','clearInterval',
  'fetch','Math','JSON','Object','Array','String','Number','Boolean','Date','Map','Set',
  'WeakMap','Promise','Error','TypeError','isFinite','isNaN','parseInt','parseFloat',
  'encodeURIComponent','decodeURIComponent','requestAnimationFrame','cancelAnimationFrame',
  'navigator','location','history','localStorage','sessionStorage','Worker','Blob','URL',
  'URLSearchParams','FileReader','Image','devicePixelRatio','ResizeObserver','self',
  'Float64Array','Float32Array','Int32Array','Uint8Array','Uint16Array','ArrayBuffer',
  'MouseEvent','KeyboardEvent','Event','CustomEvent','Element','HTMLElement','Node',
  'structuredClone','performance','alert','confirm','prompt','getComputedStyle','matchMedia',
  'Intl','Symbol','Proxy','Reflect','globalThis','atob','btoa','TextEncoder','TextDecoder',
];

function cleanup() {
  for (const f of [TMP_JS, TMP_CFG]) { try { fs.unlinkSync(f); } catch (_) {} }
}

try {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  // Inline scripts only. Files loaded via src are separate scopes that eslint
  // would need told about individually; the externals list covers what they export.
  const blocks = [...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)]
    .map(m => m[1]);
  if (!blocks.length) { console.log('no inline scripts found'); process.exit(1); }
  fs.writeFileSync(TMP_JS, blocks.join('\n;\n'));

  const globals = {};
  [...BROWSER, ...EXTERNAL].forEach(g => { globals[g] = 'readonly'; });
  fs.writeFileSync(TMP_CFG,
    'module.exports = [{ files: ["**/*.js"], languageOptions: { ecmaVersion: 2022, '
    + 'sourceType: "script", globals: ' + JSON.stringify(globals) + ' }, '
    + 'rules: { "no-undef": "error" } }];\n');

  let out = '';
  try {
    execFileSync('npx', ['eslint', '--config', TMP_CFG, TMP_JS],
      { cwd: __dirname, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    out = (e.stdout || '') + (e.stderr || '');
  }

  const findings = out.split('\n')
    .filter(l => /no-undef/.test(l))
    .map(l => l.trim());

  const kb = (fs.statSync(TMP_JS).size / 1024).toFixed(0);
  console.log(`\nUNDEFINED IDENTIFIERS  (${blocks.length} inline blocks, ${kb} KB of JS)`);

  if (!findings.length) {
    console.log('\n1/1 lint checks passed  —  no undefined identifiers');
    cleanup();
    process.exit(0);
  }

  console.log('\nFAILURES:');
  findings.forEach(f => console.log('  ' + f));
  console.log('\n  Each of these is a name used but declared nowhere. If it is legitimately');
  console.log('  defined in an external file, add it to EXTERNAL at the top of this script');
  console.log('  — do not widen the rule.');
  console.log(`\n0/1 lint checks passed  —  ${findings.length} undefined identifier(s)`);
  cleanup();
  process.exit(1);

} catch (err) {
  console.error('lint harness error:', err.message);
  cleanup();
  process.exit(1);
}
