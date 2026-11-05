# Regional audit: scripts and results (messages 712 and 717)

Scratch scripts behind docs/regional-audit.md, kept here so the measurements can be repeated. Nothing in this folder is
loaded by the page, the harness or the suite; the site's .assetsignore hides docs/. No file here carries an hourly series:
the engine dumps the scripts read (derived from profiles.json, an Eskom-derived series) stay in the session scratchpad.

## Message 717 (c): PyPSA network sensitivity of a national-engine run

1. `pathcheck_dump.patch`: two lines added to harness/pathcheck.js (apply to a scratch copy, never to the harness) so that,
   with DUMP_WY, DUMP_K, DUMP_PAGE and DUMP_OUT set, pathcheck writes the national engine's hourly run for one weather year
   and one outage seed after applying every setting the pathway recorded. `engine_dump_page.js` is the page-side code it runs.
   Run as the chain does: `LNG=1 GRID=1 SS_FC=reservecoal K=1 YEARS=2035,2040 IN=<pathway json> OUTC=<out> DUMP_WY=2025
   DUMP_K=0 DUMP_PAGE=engine_dump_page.js DUMP_OUT=<prefix> node pathcheck_dump.js`, from harness/ at the run's own build.
   `engine_dump.js` does the same from a pathcheck row alone (without the pathway's recorded settings; not used for the results).
2. `pypsa_net.py`: the ten-area, 8,760-hour PyPSA LP built from an engine dump and the build's own regional files (see its
   docstring for the cases, the siting choices and the sensitivities). About a minute a solve with HiGHS.
3. `run_net.sh`: resumable runner over a list of cases. `net_summary.py` and `net_tables.py`: the comparison against the engine
   and the differences from the no-limits case, as printed in docs/regional-audit.md.
4. `results/`: one JSON per case (annual energies, curtailment by technology and area, unserved, corridor flows and hours at
   the limit, the siting shares and the scaling notes). Named net_<year>_wy<weather year>_<case>_<siting>_l<losses>_c<coalmin>.json.

Python environment: pypsa 1.4.0, linopy 0.10.1, highspy 1.15.1, pandas 3.1.1 (a venv; `pip install pypsa highspy pandas linopy`).
