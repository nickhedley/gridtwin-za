# Preset captions for the presets PR on c6e (user, 29 Oct 2026, message 485 (c); draft as text, nothing on the page)

Every figure in a caption comes from code, not from typing. Three mechanisms, each marked below:

- `{gen: …}`: read live by the page from the PRESETS object, which `python3 harness/pathway/gen_pathway_presets.py` rewrites from the run
  files. For c6e the generator's configuration points at c6e's files (the four path changes under 'Generator inputs'); the caption
  templates in PRESET_DESC do not change for these figures.
- `{score: …}`: PRESET_SCORES, rewritten by `python3 harness/ext/gen_preset_scores.py` from a rescore
  (`ONLY='<preset>' VARIANTS=page K=20 OUT=ext/rescore_page_<build>.json node ext/preset_rescore.js`, from harness/; about 20 minutes a
  preset; Deep decarbonisation 2035 on seed 120000017, Fossil-free 2040 on 71830529, as recorded in gen_preset_scores.py).
- `{lcp2030: …}`: the three LCOE anchor constants (LCP_2030_LI_CYCLES, LCP_2030_DSL_CF, LCP_2030_WIND_CF), from the central's hooked
  2026–30 engine check, 2030 row (RESULTS 'Message 236', the arithmetic); no script exists yet, see 'Open' below.

Fill markers in the packfill.js form (`<!--fill:KEY-->`) are used only where a figure also appears in the pack; the page never
carries markers.

## Captions as they will read (at most about 40 words each; the weather-year caveat is said once above the presets)

| Preset | Caption | Changes from main (28a) |
|---|---|---|
| Today 2026 | The system as it runs today: the 2026 fleet, demand and coal availability. Opens on this preset. | none (28a wording; the 29a branch already has 'Opens on this preset') |
| 2025, as modelled | The model re-run on 2025's fleet, demand, weather, imports and coal outages (Eskom data, analysis ours). Not a validation: coal output is close to Eskom's, but it sheds far less load than Eskom did. | none |
| IRP's 2030 targets | IRP 2025's 2030 build at the model's costs and demand (IRP plans {gen: IRP2030_DEMAND_GAP_PCT}% more): {gen: P.newWindMW} GW wind, {gen: P.newPvMW} GW solar, {gen: P.newRooftopMW} GW rooftop, {gen: P.newBattMW} GW of {gen: P.newBattHours}-hour batteries, {gen: _presetGas(P)}; {gen: P.coalDecomMW} GW coal retired. | figures move to the IRP pair checked on c6e (irp2025_c6e, group a); template unchanged |
| IRP's 2030 targets, grid delayed | IRP's 2030 targets with {gen: 1 − P.newWindMW / T.newWindMW}% of the new wind and solar unable to connect ({gen: P.newWindMW} GW of wind and {gen: P.newPvMW} GW of solar connect) and curtailment at {gen: P.congestionCurtailPct}%, for a transmission corridor not built in time. | follows the 2030 preset; template unchanged |
| IRP path 2035 | IRP 2025's 2035 build on Least-cost path 2035's demand (IRP plans {gen: IRP2035_DEMAND_GAP_PCT}% more): {gen: P.newWindMW} GW wind, {gen: P.newPvMW} GW solar, {gen: P.newRooftopMW} GW rooftop, {gen: P.newBattMW} GW of {gen: P.newBattHours}-hour batteries, {gen: _presetGas(P)}; {gen: P.coalDecomMW} GW coal retired. | figures move to irp2025_c6e, group b; template unchanged |
| Least-cost path 2035 | The model's least-cost build to 2035: {gen: P.newWindMW} GW wind, {gen: P.newPvMW} GW solar, {gen: P.newRooftopMW} GW rooftop, {gen: P.newBattMW} GW of {gen: P.newBattHours}-hour batteries and {gen: P.newCcgtMW + P.newOcgtMW} GW gas; {gen: P.coalDecomMW} GW coal retired; demand {gen: P.demandGrowthPct}% above 2026 plus {gen: P.demandBlockMW} MW of smelter load. | figures move to c6e's 2035 state (pathway_c6e.json, pathcheck_c6e_b); template unchanged. With new gas from 2035 the gas figure may read 0.0 GW: if it does, the template drops 'and … GW gas' when the sum is zero (a one-line change in PRESET_DESC) |
| Deep decarbonisation 2035 | {gen: P.coalDecomMW} GW of coal retired by 2035, no new gas: {gen: P.newWindMW} GW wind, {gen: P.newPvMW} GW solar, {gen: P.newRooftopMW} GW rooftop, {gen: P.newBattMW} GW {gen: P.newBattHours}-hour batteries, {gen: P.newIronAirMW} GW iron-air. Unserved {score: shed} GWh/yr: within NTCSA's 20 GWh a year and the half-NEM target ({score: target}) it was built to. | `_presetMeets` reworded (message 470 (a): 'within half the Australian standard' goes); scores from a rescore on the PR's build. If the rescore misses the half-NEM target: 'above the half-NEM target ({score: target}) it was built to; within NTCSA's 20 GWh a year', and the re-search question goes to Nick (PRESETS_C6C_PLAN.md) |
| Fossil-free 2040 | No fossil plant by 2040: {gen: P.newWindMW} GW wind, {gen: P.newPvMW} GW solar, {gen: P.newOffshoreMW} GW offshore, {gen: P.newRooftopMW} GW rooftop, {gen: P.newBattMW} GW {gen: P.newBattHours}-hour batteries, {gen: P.newIronAirMW} GW iron-air. Unserved {score: shed} GWh/yr: within NTCSA's 20 GWh a year and the half-NEM target ({score: target}) it was built to. | as above; name kept (message 471) |

`_presetMeets`, drafted (reads PRESET_SCORES only; the 20 GWh figure from the page's standard constant, not typed):

    Unserved {shed} GWh/yr: within NTCSA's {ntcsaGWh} GWh a year and the half-NEM target ({target}) it was built to.
    Unserved {shed} GWh/yr: above the half-NEM target ({target}) it was built to; within NTCSA's {ntcsaGWh} GWh a year.
    Unserved {shed} GWh/yr: above NTCSA's {ntcsaGWh} GWh a year.                      (only if a rescore ever lands there)

## The three LCOE anchor notes (message 471 (f))

Now: "In the model's least-cost pathway in 2030: 103 cycles a year: R4.73/kWh" (lithium), "the fleet runs at 2.7%: R17.78/kWh"
(diesel), wind at 41.7% (all three from c5f's 2030, build 2026-10-17g). Two options, Nick's call on Thursday:

- A (preferred if c6e's outputs land by early afternoon): restate from c6e's 2030. Needs a hooked 2026–30 check of pathway_c6e.json
  (twelve weather years x 20 draws, about 35 minutes; the hook captures lithium discharge, diesel output and new-wind output, which
  the plain engine check does not keep), then the three constants written by a small script from its 2030 row
  ({lcp2030: cycles = TWh discharged / lithium MWh; dslCF = TWh / (3,400 MW x 8.76); windCF = TWh / (new wind MW x 8.76)}). The
  notes then read "In c6e's least-cost pathway in 2030: …".
- B: drop the pathway sentence from the three notes; each keeps its reference-parameter anchor (365 cycles, 10% capacity factor,
  the twelve-year wind factor), which already carries the default and its basis within the 40-word rule.

## Generator inputs for c6e (gen_pathway_presets.py; four path changes, no logic change)

| Entry | Now (c5f) | For c6e |
|---|---|---|
| Least-cost path 2035: build, check | harness/pathway/c5f/pathway_c5f.json, pathcheck_c5f_b.json | harness/pathway/c6e/pathway_c6e.json, pathcheck_c6e_b.json (frozen copies from the outputs PR; the run commit in the block's comment) |
| IRP path 2035: build, check, gap_index | harness/pathway/irp2025/pathway_irp2025.json, pathcheck_irp2025_b.json, index_irpdem.json | harness/pathway/irp2025/pathway_irp2025_c6e.json, pathcheck_irp2025_c6e_b.json (copied from out/c6e/irp), the c6e index (index_irp2025fig2_c6.json, the one chain_c6e.sh runs c6e_irpdem on) |
| IRP's 2030 targets (and grid delayed): build, check | pathway_irp2025.json, pathcheck_irp2025_a.json | pathway_irp2025_c6e.json, pathcheck_irp2025_c6e_a.json |
| c5f_demand() | pathway_c5f.json (C5F_DEMAND, C5F_BUILD_CAPS) | pathway_c6e.json; the generated identifiers keep their names on Thursday (renaming them is code churn in the presets block), with the block's comment saying they are c6e's |

Then `python3 harness/pathway/gen_pathway_presets.py` and `--check`; `node validate_pathway_presets.js testroot` (the 13 failures on main,
the presets built on c5f's runs, are expected to clear; any that stays is traced first).

## Also in the presets PR (message 485 (b); comments, not visible text)

- Capitals in code comments: 'SHADOW' (index.html about line 15758) and 'NOT' (about line 16859), lower-cased; a scan of comment
  lines for other emphasis capitals before the PR (the scan excludes acronyms and constant names).
- Six comment phrases: 'no recorded source' at about lines 3208 (the own-use tariff: TODO 14kl), 5849 (lithium 12 hours: cite the
  RESULTS sweep), 6735 (emisCoal history: SOURCES 'Eskom FY2026'), 10328, 10341, 10354, 10362, 10375 (cost history lines: each to
  its SOURCES entry or TODO 14cw), and 'no wholesale market' at about lines 15758, 16784 and 16859 (SAWEM wording, as the visible
  text now has). Each replaced by the source now in SOURCES or a TODO number.

## Open

- Option A or B for the LCOE anchor notes (above).
- Whether the run-based presets name c6e in their captions (PRESETS_C6C_PLAN.md's open point; the templates above do not).
- Deep decarbonisation 2035's rescore result decides whether a re-search is needed; a re-search is after the note under the scope
  freeze (message 481 (c)), so the caption would carry the 'above the half-NEM target' form until then.
