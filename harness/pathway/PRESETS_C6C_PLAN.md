# Plan: the presets PR on c6c (message 402; plan written 27 Oct 2026, message 449 (d))

Plan only; the build starts Wednesday morning, once claude/c6c-runs has landed. One branch (claude/presets-c6c) and one PR, on main
after #122 (build 2026-10-27f: coal minimum down time 24 h, practice floor 0.715). Bump BUILD_STAMP; regenerate the stored panels;
full suite before and after; "Visible text changed" from `node diff_public_text.js testroot --base <main>`.

## Which presets, and what each needs

| Preset | How it is made | Rebuild on c6c? | What it needs |
|---|---|---|---|
| Least-cost path 2035 | Generated (gen_pathway_presets.py) from the central's pathway file, 2035 state | Yes | Frozen copy of c6c's run file (harness/out/pathway_c6c.json) to harness/pathway/c6c/pathway_c6c.json, with the run commit in a note; point the generator's entry at it (now harness/pathway/c5f/pathway_c5f.json) |
| IRP path 2035 | Generated from the IRP 2025 build file and its engine check, group b (2031-35) | Yes | harness/out/c6c/irp/pathway_irp2025_c6c.json and pathcheck_irp2025_c6c_b.json copied to harness/pathway/irp2025/ (beside the c5f copies, named for c6c); the generator's 'build', 'check' and 'gap_index' entries pointed at them |
| IRP's 2030 targets | Generated from the same IRP build, engine check group a, 2030 state | Yes | As above, pathcheck_irp2025_c6c_a.json; the PRE2030 comment block restated for c6c (it names c5f, s_irpgas_c5f and s_be6_c5f) |
| IRP's 2030 targets, grid delayed | Generated: the 2030 preset with 60% of its new wind and solar and curtailment capped at 10% | Yes, follows the 2030 preset | Nothing of its own; the generator derives it |
| Deep decarbonisation 2035 | Searched build (least cost meeting half the 0.002% standard), then topped up on independent draws; PRESET_SCORES holds its measured shed | Rescore first; re-search only if it misses | Rescore on build 27f (seed 120000017, 240 runs, the PRESET_SCORES method). If its shed is still at or under the target (2.42 GWh) keep the build and update PRESET_SCORES; if not, the 24 Oct method: search from the current build (FEASIBLE, 2 draws, confirm on 40), then top up on independent draws (seed 71830529, 240 runs). The 24 Oct scratch scripts (deep_c6b) are not in the repository: rewrite them under harness/ext/ this time |
| Fossil-free 2040 | Searched build, no coal and no diesel | No rebuild expected | Coal settings cannot move it; rescore once to confirm PRESET_SCORES (seed 71830529, 240 runs) and record the result |
| Today 2026, 2025, as modelled | State only (year and inputs), no build | No | Nothing to rebuild; their figures move with the engine. The 2025 replay against Eskom is validate_benchmarks' (floor 0.715 applies before 2030) |

## Order and checks

1. Wait for claude/c6c-runs: c6c's central, the IRP pair (irp2025_c6c, groups a, b, c) and c6c_irpdem must be complete; check with
   `node pathway/tables/settables.js out out/c6c c6c c6b` (the 'Not run' list must not name them).
2. Copy the files, repoint the generator, `python3 harness/pathway/gen_pathway_presets.py`, then `--check`.
3. `node validate_pathway_presets.js testroot`: the 13 failures on main (states, coal settings, cost and unserved energy of the three
   run-based presets against c5f's runs) are expected to clear; any that stays is traced before anything else.
4. Deep decarbonisation 2035 rescore (about 20 minutes, tracked job), then re-search only if needed (several hours: start it first
   thing).
5. Stored panels rewrite, full suite, visible-text list, RESULTS entry with every setting and the run commit, pack known failures.

## Open points for Nick

- Whether the run-based presets name c6c in their captions (the captions are 40 words at most; the build basis now says c5f).
- Whether a re-search of Deep decarbonisation 2035, if needed, waits for after the note: the rescore alone tells us.
