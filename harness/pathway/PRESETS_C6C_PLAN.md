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

## Two visible-text fixes to carry in the same PR (user, 27 Oct 2026, message 451; not in #122)

Both change visible text only; they ride the presets PR's panels rewrite and suite, so no extra cycle.

1. Full model caption (index.html, beside the full-model button). Now: "(The instant model commits coal by a rule in 4-hour blocks and
   keeps a unit off for at least 24 hours once it comes off, so units seldom come off over midday; NTCSA says the System Operator
   does not do that.)" The last clause is ambiguous after the 24-hour wording. Proposed: "(The instant model commits coal by a
   rule in 4-hour blocks and keeps a unit off for at least 24 hours once it comes off. NTCSA reports that the System Operator keeps
   coal online through daylight for the morning and evening peaks (Engineering News, 30 July 2026).)" Check the source line against
   SOURCES and the pack's limitation 23 (NTCSA, as reported by SAPVIA and Engineering News, 30 Jul 2026) before writing it, and
   keep the caption within the 40-word site-copy cap and the audit's prose ceiling (4,250 words; at the ceiling now).
2. Methods table, coal row. Now: "1.07 tCO2/MWh (our figure; Eskom's FY2026 report implies 1.11)", which reads as a 4% gap.
   Proposed: "1.07 tCO2/MWh at full load; 1.109 in 2026 with part-load running, against 1.108 implied by Eskom's FY2026 report".
   All three from constants, not typed: FIXED.emisCoal (data-num emisCoal), FIXED.emisCoal x COAL_PARTLOAD_2026 and
   COAL_CO2_PER_MWH_FY26 (two new data-num entries beside emisCoal).

## Site text (user, 28 Oct 2026, message 470; the advisor's sift of the 2,163 visible sentences on main, build 27f)

Carried in the presets PR; each figure restated from measurement on the PR's build, not typed.

a. Stale:
   - Fossil-free 2040 keeps its name (message 471: the 2045 horizon is next-note work); its caption is refreshed only.
   - Every preset caption restated from the central set's runs (c6c, or c6e if it lands first); "within half the Australian
     standard" replaced by NTCSA's 20 GWh.
   - "Eskom does not since South Africa does not yet have an independent system operator and competitive market": NTCSA is the
     system operator; say how dispatch works now (NTCSA dispatches on Eskom's merit order under its grid code; SAWEM trading
     inside Eskom since April 2026, commercial launch targeted for 2027, Krutham, October 2026).
   - Both "no wholesale market (yet)" lines: as above.
   - "DMRE / IPP Office" -> Department of Electricity and Energy.
   - "Grid Connection Capacity Assessment" -> Generation Connection Capacity Assessment.
   - The PyPSA unit-commitment comparison figures: re-measure on the PR's build, or date them with their build (engine 14r).
   - "12,000 fixed tilt (no recorded source)": source BLD_COST.pv or say what it is (fixed-tilt, used only with tracking off).
   - The rooftop tab's "indicative and unsourced" brackets: align with SOURCES 'Rooftop PV installed cost, 2025-26'.
b. Internal or tutorial, remove or plain: "Update these figures when Eskom publishes; the comparison is only as current as the
   date above."; "Read that carefully before comparing:"; "This is because a quarter of each plant's output…"; "So where the model
   runs a different mix…"; "This matters most in high-renewable scenarios…"; "…good enough to show that flows follow physics rather
   than economics"; "The page opens here." -> "Opens on this preset."; "Buffalo curve": source it or describe plainly.
c. Cadence: review the 56 "X – not Y" / ", not Y" / "rather than" contrasts; keep only those where the contrast carries
   information.
d. validate_public_text: fail on "(no recorded source)", "Update these figures", "Read that carefully", "This is because" and
   "no wholesale market".

## Site text, full read (user, 28 Oct 2026, message 471; the advisor's line-by-line read of all 2,163 visible sentences, build 27f)

Items (a) and (b) are in the cost-of-capital PR (build 2026-10-28a). The rest go in the presets PR, each figure restated from
measurement on the PR's build:
c. Lithium: slider "on 0.1 GW existing (4h)" against the battery chart's "3.0 GW fleet <- about here today": reconcile; say what each
   counts.
d. CCS note "The engine runs coal as one block": check against unit-level commitment; restate.
e. "-243 MW of privately wheeled wind" (validation, wind row): ABOUT_NUM.windFleet prints FIXED.windMW - ESKOM_WIND_LINE_MW, which is
   negative: fix the sign or the wording at its source.
f. Old least-cost figures ("103 cycles a year: R4.73/kWh"; "the fleet runs at 2.7%: R17.78/kWh"; rooftop "the same in the least-cost
   pathway's 2030"; "system cost is lowest at about 16 hours"): restate from the headline set with its name, or remove
   (LCP_2030_* constants come from c5f).
g. "each region's connection headroom is the network Eskom plans to build (GCCA)" -> NTCSA.
h. Pumped storage R1.40/kWh "An assumption; no published source": Meridian's IRP 2023 review (R31,800/kW, 20 h); source it or keep
   the flag.
i. Header "for planners and project developers" against footer "educational tool, not planning advice": Nick to decide.
j. "Hive's Coega project, the most advanced in Africa": source or drop; "Avg industrial 2026 ≈ R2.50/kWh" and "5% Eskom historical"
   escalation: basis (nominal or real) and source.
k. "Leandra ... has yet to inject a single tonne": date it.
l. Tutorial, advice or AI-sounding lines (the list in message 471 (l)): cut or state plainly; "Baseline is 6 GW, or ~15% of SA's
   peak - Eskom's historical practice": source it.
m. Glitches: "check the box in the box in the left column"; "Top 0% of hours" in the price-duration list; the storage-price
   limitation sentence repeated in the prices and price-setting panels.
n. validate_public_text: add the clearest of these patterns beside message 470 (d)'s.
