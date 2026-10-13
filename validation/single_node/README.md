# Single-node engine against a single-node PyPSA optimum

Cross-check of the engine behind the pathway costs (index.html `simulate()`, the engine check's engine) against a PyPSA
unit-commitment optimum on the same inputs, one week at a time. Results and settings are in RESULTS.md on the docs branch
(entries 'Single-node engine (the note's) against a single-node PyPSA unit-commitment optimum' and 'c4 2040, three weeks').

## What it compares

The engine runs a full year as usual. A read-only hook (`engine_hook.patch`, two lines in `simulate()`) records, for each hour
of the chosen week, what the engine had to work with and what it did: load, wind and solar output and curtailment, CSP,
hybrids, must-take nuclear, hydro and imports, coal available and committed, each store's state of charge, and its running
fuel, carbon and start-up costs. Nothing in the engine changes.

The PyPSA model is one bus with the same inputs: the same load (less the engine's demand response), renewables available as
the engine's output plus its curtailment, must-take nuclear, hydro and imports, coal available each hour, the engine's
commitment pre-pass fleet (all 85 UC_FLEET units scaled by coal standing / 41,530, as `buildUCSchedule` does), minimum stable
levels and up/down times, the fleet ramp limit, the engine's starting commitment, CCGT, OCGT on LNG at the engine's heat-rate
multiple, diesel, pumped storage, lithium and iron-air starting at the engine's state of charge and ending at least at it, and
shed at the engine's unserved-energy cost. Costs are the engine's own: coal at full-load cost, the two start-up charges.

`sn_pypsa40.py` sees the whole week in advance. `sn_pypsa40_roll.py` sees 24 hours ahead: each day is optimised over that day
and the next, the first day is kept, and the window moves on. `eng40_cost.py` decomposes the engine's week and checks the
parts against its own totals (no residual).

## Files

| file | what it does |
|---|---|
| `make_root.sh` | unpacks the repository at a commit into a new folder and applies `engine_hook.patch` |
| `engine_hook.patch` | the read-only hook, against index.html at claude/c4-frozen (fa7d8af, engine build 2026-10-12e) |
| `sn_run.js` | the 2026 baseline week: Today 2026 preset, default profiles, one outage seed |
| `sn_run40.js` | a 2040 week on c4's build: `scan` finds each weather year's worst 168 hours of shed; `week` records a week |
| `c4_2040_state_topup.json` | c4's 2040 state as the engine check builds it, plus the 1,000 MW top-up |
| `sn_pypsa.py` | baseline-week PyPSA model (84 units: Komati excluded; the engine's pre-pass has 85) |
| `sn_pypsa40.py` | 2040 PyPSA model, full-week sight, `lp` or `mip` |
| `sn_pypsa40_roll.py` | 2040 PyPSA model, 24-hour rolling; `NEUTRAL=fe` (default) or `NEUTRAL=all` for the rule on stores at each window's end |
| `eng40_cost.py` | the engine's week cost, decomposed |

## Running it

Node with the harness dependencies (`npm install jsdom` in harness/), and Python with the versions used here:
pypsa 1.4.0, linopy 0.10.0, highspy 1.15.1, pandas 3.0.6, numpy 2.4.6, xarray 2026.9.0.

```
bash validation/single_node/make_root.sh . fa7d8af /tmp/sn_root
cd harness
NODE_PATH=$PWD/node_modules node ../validation/single_node/sn_run40.js /tmp/sn_root scan ../validation/single_node/c4_2040_state_topup.json scan.json
NODE_PATH=$PWD/node_modules node ../validation/single_node/sn_run40.js /tmp/sn_root week ../validation/single_node/c4_2040_state_topup.json wk_may.json 2025 3264 168 87866504
python3 ../validation/single_node/eng40_cost.py wk_may.json
INIT=engine python3 ../validation/single_node/sn_pypsa40.py wk_may.json mip mip_may.json
NEUTRAL=all python3 ../validation/single_node/sn_pypsa40_roll.py wk_may.json roll_all_may.json 24
```

The weeks of 13 Oct 2026: May (weather 2025, hours 3264-3431, seed 87866504), November (weather 2025, hours 7848-8015, seed
87866504), stress (weather 2016, hours 6807-6974, seed 87795233; the worst 168 hours of the scan). Seeds are the engine check's
first draw, 71830529 + weather year x 7919. The baseline week: `node sn_run.js /tmp/sn_root 3264 168 12345 base_week.json`, then
`INIT=engine python3 sn_pypsa.py base_week.json mip base_mip.json`.

The week files hold hourly series derived from the model's profiles. Keep them local; do not commit them (.gitignore here).

## Results, 13 Oct 2026 (R million a week; engine at full-load coal cost)

| week | engine | 24-hour rolling ('all') | full-week optimum | engine over rolling | shed, engine / PyPSA |
|---|---|---|---|---|---|
| 2026 baseline | 2,210.6 | - | 2,162.9 | (+2.2% over full week) | 0 / 0 |
| 2040 May | 2,165.6 | 1,664.7 | 1,655.2 | +30.1% | 0 / 0 |
| 2040 November | 1,485.0 | 1,000.4 | 990.7 | +48.4% | 0 / 0 |
| 2040 stress | 3,202.5 | 2,192.0 | 2,191.5 | +46.1% | 37.3 GWh / 0 |

The 2040 gap is the engine's storage rule: lithium cycles about 2 times a week in the engine against 5.5-6 in either PyPSA
run, and sits near full when the midday surplus arrives. Caveats: one bus; three weeks and one outage draw each; both sides use
the engine's 2040 coal representation (all 85 units, each at 49% of its size).

## Licences

PyPSA (MIT), linopy (MIT), HiGHS (MIT). The inputs are the repository's own files at the commit used.
