// tmp_cleanup.js: remove a run's temporary solver files when the process ends, whether it succeeds, fails or is stopped
// (user, 20 Oct 2026, message 267 (1); the native-solver path left /tmp/gtza_<pid>.lp, .json and .basis.json behind and filled
// the disk). Call with the path prefix the run writes under; registering the same prefix twice does nothing.
const fs = require('fs'), path = require('path');
const prefixes = new Set();
function sweep(){
  for (const p of prefixes){
    const dir = path.dirname(p), base = path.basename(p);
    let names = [];
    try { names = fs.readdirSync(dir); } catch (e) { continue; }
    for (const n of names) if (n.startsWith(base)) { try { fs.rmSync(path.join(dir, n), { force: true, recursive: true }); } catch (e) {} }
  }
}
let hooked = false;
module.exports = function cleanupOnExit(prefix){
  prefixes.add(prefix);
  if (hooked) return;
  hooked = true;
  process.on('exit', sweep);
  // A stopped run (Ctrl-C, kill) ends through exit, so the files go then too.
  for (const [sig, code] of [['SIGINT', 130], ['SIGTERM', 143], ['SIGHUP', 129]]) process.on(sig, () => process.exit(code));
  process.on('uncaughtException', e => { console.error(e); process.exit(1); });
};
