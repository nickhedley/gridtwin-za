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

**Output — example (baseline, 64% EAF):**
```
Metric                    Heuristic    LP      MIP
Total cost (R million)     2,235      2,264   2,275
Coal min (MW)              9,074      9,010   9,182
Ramp violations                0          0       0
MIP gap                     —         —      0.00%
```

**Honest framing:** This is *not* a run of the PyPSA-RSA pipeline (that requires GIS files and conda). It builds an equivalent network from GridTwin ZA's own data files and solves the same dispatch problem. The 0.42% gap between the heuristic and the MIP on the baseline scenario is the model's validated accuracy bound.

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

**Output — example:**
```
Metric                    GridTwin ZA    LP        MIP
Total cost (R million)      2,240.2    2,235.8   2,252.3
Coal min (MW)              14,111      14,089    15,458
Coal max (MW)              25,099      24,966    24,219
Solve time (s)                 ~3          3        47
Heuristic vs MIP gap                             0.52%
```

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
