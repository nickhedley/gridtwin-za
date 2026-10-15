# GridTwin ZA — Validation scripts

This folder contains independent validation tools that verify GridTwin ZA's heuristic dispatch engine against real optimisation models. They are **offline scripts**, not part of the browser app.

---

## `pypsa_crossval_uc.py` — Cross-validation against PyPSA

Builds a real `pypsa.Network` using the same 10-region topology, corridor transfer limits, fleet costs, demand profiles, and renewable profiles as GridTwin ZA, then solves it with HiGHS via linopy — first as an LP (storage dispatch only) and then as a full MIP (unit commitment with per-unit minimum up/down times, start-up costs, and ramp limits).

The comparison tells you how closely the browser heuristic tracks the true optimum for a given scenario.

**Setup:**
```
pip install pypsa highspy pandas linopy
```

**Usage:**
```
python3 pypsa_crossval_uc.py
```

**Output, measured 13 Oct 2026 (baseline week, 64% EAF, storage starting at the nodal engine's state):** the script prints the LP
objective (R2,210.7m) and generation by carrier; it does not compute the heuristic's side. The earlier example here had the heuristic below
the MIP, which an optimum does not allow, and could not be reproduced.

**Honest framing:** This is *not* a run of the PyPSA-RSA pipeline (that requires GIS files and conda). It builds an equivalent network from GridTwin ZA's own data files and solves the same dispatch problem. Measured 13 Oct 2026, baseline winter week (mip_solver.py's default --week winter, hours 3264-3431 of the 2025 data), coal EAF 64%, no new build, matched starting state: the 10-region heuristic (nodal/nodal_engine.js, main bc21fc2) costs R2,321.7m against R2,228.0m for the matched PyPSA MIP (mip_solver.py), 4.2% more, when the MIP is given the engine's starting storage, battery split, pumped-storage energy and imports (CF 0.88); PyPSA 1.4.0, HiGHS 1.15.1, mip_rel_gap 0.5% (0.11% reached). The heuristic's week is priced on this script's basis (fleet marginal cost per MWh, imports R550/MWh, renewables and storage zero, plus start-ups). The MIP sees the whole week in advance, so the gap is an upper bound on the heuristic's inefficiency. This checks the 10-region engine only. The single-node engine behind the pathway costs (index.html simulate()) is cross-checked separately in validation/single_node/: 2.2% above a single-node PyPSA unit-commitment optimum in the 2026 baseline week, and 30-48% above a 24-hour rolling optimum in three weeks on c4's 2040 build, where the engine's storage rule is the gap (README there; results in RESULTS.md, 13 Oct 2026).

**Reproducibility:** Storage initial SoC is computed by running `nodal_engine.js` with cyclic initialisation (not hardcoded), so the script produces the same result for any scenario.

---

## `mip_solver.py` — Tier 3 "solve this week properly" script

Solves a specific GridTwin ZA scenario for one representative week (168 hours) using a full PyPSA MIP with per-unit unit commitment. Takes 30–50 seconds on a typical laptop — too slow for the browser but useful for scenario-specific validation.

**Setup:**
```
pip install pypsa highspy pandas linopy
```

**Usage:**
```
# Match your GridTwin ZA URL parameters:
python3 mip_solver.py --coalDecomMW 14000 --newWindMW 33000 --newPvMW 36500

# Or paste your URL directly:
python3 mip_solver.py --url "nickhedley.github.io/gridtwin-za/?coalDecomMW=14000&newWindMW=33000"

# Summer week instead of winter:
python3 mip_solver.py --week summer --coalDecomMW 6000 --newPvMW 20000

# LP only (faster, no unit commitment):
python3 mip_solver.py --lp-only

# See all options:
python3 mip_solver.py --help
```

**Output, measured 13 Oct 2026 (default winter week, as shipped: storage 50% / 30% full, imports CF 0.85):**
```
Metric                              LP          MIP
Total cost (R million)          2191.75      2204.35
Coal min (MW)                     12789        14389
Coal max (MW)                     25099        24219
```
The script does not compute the heuristic's side; the earlier example could not be reproduced. Run it from the repository root (it looks for nodal/ beside itself).

---

## Interpretation guide

| Gap | Meaning |
|-----|---------|
| < 1% | Excellent — heuristic is effectively optimal for this scenario |
| 1–3% | Good — minor dispatch inefficiencies, acceptable for planning |
| 3–10% | Moderate — heuristic is making meaningful dispatch errors (check high-battery or high-solar scenarios) |
| > 10% | Large — scenario may be at the edge of the heuristic's validity (extreme overbuild, very low coal floor) |

The heuristic tends to underperform the MIP most in scenarios with:
- Large battery fleets (greedy dispatch can mistime charge/discharge)
- Very high solar penetration (coal commitment timing becomes critical)
- Low synchronous generation floor (more dispatch freedom = harder to approximate)

---

## Data dependencies

Both scripts read from the `nodal/` folder. Run from the repo root:

```
gridtwin-za/
├── nodal/
│   ├── nodal_engine.js          (required by mip_solver.py for SoC init)
│   ├── fleet_by_region_v2.csv
│   ├── demand_2025_regional.csv
│   ├── profiles_regional.json
│   └── regional_renewable_capacity.json
├── validation/
│   ├── pypsa_crossval_uc.py     (this folder)
│   └── mip_solver.py
└── README.md
```

---

## Licence

Validation scripts are MIT licensed. PyPSA is MIT. HiGHS is MIT. See repo root `LICENSE`.
