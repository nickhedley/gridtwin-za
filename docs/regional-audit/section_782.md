
## Message 782: the 8 Nov key's central through the 738 (b) case list and 762 (b)'s fixes (7 Nov 2026; the key's central, not a final build; nothing here is to be quoted)

### (a) What ran

The main session recorded the 8 Nov key's final build at 13:52 UTC on claude/c7-runs (commit 1ffa127: harness/pathway/final/key/pathway_key_8nov.json
with its RESULTS entry; pass 2, LP key f60aa29e49, objective R1,587.3bn, no coal retired early). Its build is the fin basis 10a98e2 (2026-11-05h)
with key_on_10a98e2.patch; the branch's patch is byte-identical to the one applied in wt-key10 and a reverse-apply check passes. The chain ran
as prepared in 762 (c): dump_key.sh dumped 2035 and 2040 on weather 2025 with the key loop's own engine flags (LNG, GRID, SS_FC reservecoal, CONG_OFF,
WX_WINDCORR; one seed; the recorded settings carry the key's switches, vppHours 3, vppReservePct 20, btmReservePath 43.2 to 31.8, vppCostRkWyr 500),
then queue_final_template.sh ran the 738 (b) list and 762 (b)'s two fixes on the table of record (corridors_v3.json, area_map_v3.json,
tdp_lines_v3.json), 24 solves, 13:59 to 15:11 UTC, none failed. The two settings with no ten-area form (the battery proposals and the freed-coal
pool) are carried as the dump gives them, as 762 (c) says. Results in docs/regional-audit/results/782/ (net_key_*.json; the engine dumps stay
local); the summary script is summ_key.py and the tables are tables_key.md. The fin basis rows beside the key's are the every-change pass
(2026-11-05f) on the same table, from 756 (c) and 762 (b).

<<TABLES_KEY>>

### (b) Reading

The key's 2040 fleet carries 4 GW more wind and 1.8 GW more lithium than the fin basis, with 0.9 GW less closed-cycle gas; in 2035 it has 1.6 GW
less lithium and 1 GW more diesel. The findings hold with less to clear:

- Today's corridors: 2035 unserved energy 21 GWh (Gauteng 16, KwaZulu-Natal 5) against the fin basis's 83; 2040 1,926 GWh (Gauteng 1,814)
  against 2,900. Cost at R12,300 R156.5bn against R175.7bn in 2040 (R300bn against R392bn at R87,000). The Karoo exits bind 8,700 to 8,760 hours on
  both builds; their shadow value is lower on the key (2035 R11.6m against R20.0m per MW-year).
- The TDP's lines by their dates: 2035 nothing unserved (0.7 GWh on the fin basis); 2040 15 GWh, all Gauteng, against 58. Curtailment is higher on
  the key with every limit case (2040 86.0 against 79.4 TWh with the TDP's lines) because it carries more wind behind the same exits.
- No limits: 2040 cost R26.3bn against R31.5bn (less coal, no unserved energy); 2035 R47.3bn against R45.1bn (less lithium, more coal).
- Priced corridors: 2040 28.8 GW for R8.86bn a year at R21,700 (the fin basis 28.6 GW, R8.82bn); 2035 18.8 GW for R5.74bn (19.7 GW, R5.96bn).
  Free siting leaves 143 GWh unserved in 2040 against 193.
- 762 (b)'s fixes in 2040 with the TDP's lines (3-hour blocks, base 11 GWh): the LP's own lithium is 1.7 GW / 11 GWh at the Eastern Cape and Hydra
  Central exits (none in Gauteng), R2.95bn a year, clears all 11 GWh and nets a saving of R0.18bn at R12,300 and R1.0bn at R87,000 (on the fin basis
  2.2 GW / 18 GWh cleared 20 of 42 GWh, a cost of R0.02bn and a saving of R1.5bn). Corridors at R21,700: 19.5 GW on the same four exits for
  R5.74bn a year clears all of it and 69 TWh of curtailment, a saving of R51.2bn at R12,300 and R52.0bn at R87,000 (hourly 19.6 GW, R51.7bn and
  R52.8bn; the fin basis R54.9bn and R58.0bn). In 2035 the lithium case builds nothing (nothing to clear) and the corridor case buys 12.3 GW for
  R3.49bn, a saving of R16.5bn at either value.
- The sign of the lithium net flips to a saving at R12,300 on the key because the block base's shortfall is small enough for the store to clear all
  of it. The corridor fix stays two orders of magnitude the better net. The Gauteng shortfall remains a Karoo-exit problem on the key.

Caveats: one seed and weather 2025; the key's central, not a final build (the Least-cost, Fossil-free and Deep final builds run from the night of
8 Nov); the draft's figures stay placeholders until then. The engine's own unserved energy in the dump is 5,688 MWh in 2040 on the key against
15,638 on the fin basis (one seed; the loop's verdict rests on its own draws).
