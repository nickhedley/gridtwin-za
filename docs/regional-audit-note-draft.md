# The network section of the note: draft for review (7 Nov 2026; text adopted from message 779 as trimmed to 250 words, messages 784 (a) and (b); not for publication)

Draft for Nick and the advisor (review by 9 Nov 12:00 SAST). Every figure in the text and the table is the every-change pass (build
2026-11-05f) on the ten-area table of record (corridors_v3.json), weather 2025, and is a placeholder until the final builds replace it; the line
order and the lithium-against-corridor figures are from the earlier table and are rerun on the table of record with the final builds. Method
and cases: docs/regional-audit.md. No NTCSA capacity figures appear here.

## Draft text


The binding limits are the Karoo's exits. With the TDP's lines, the least-cost build curtails 35 TWh in 2035 and 79 TWh in 2040,
against 3 and 13 with no network limits; the Northern Cape's exits to the North West and the Free State are at their limit 8,700 hours a
year. An independent cross-check broadly agrees on the binding corridors.

Today's fleet loses nothing to the inter-area corridors. The curtailment paid for today (R4bn expected this financial year, as reported [1]) comes
from limits inside areas and from how coal is run, outside this test.

At 293 km of line a year, building the TDP's lines in the order of the binding corridors rather than by its dates cuts 2032 curtailment from
20 to 9 TWh, R7.6bn a year.

R2.8bn a year buys 1 TWh less curtailment in 2035 as 2 GW of lithium at the exits, or 45 TWh as corridors: lithium a net cost at the engine's
value of unserved energy, corridors a net saving at either.

With the TDP's lines, Gauteng is short 58 GWh in 2040 because of the Karoo exits: the model's store, at the Eastern Cape and Hydra Central
exits, clears half; 20 GW of corridor beyond the TDP, R5.8bn a year, clears all and 65 TWh of curtailment.

Caveat: ten areas with no limits inside them; the pathway's build fixed and planned without the network; one weather year; perfect foresight;
line costs without substations; no lead times; no voltage or stability limits.

[1] Moneyweb, 6 Nov 2026, reporting Keith Bowen of the NTCSA on a Cresco and Fasken panel (SOURCES on claude/c7-runs); a reported remark, not a published figure.

## The table

| year | case (ten areas, N-1 once, the table of record) | curtailed TWh | unserved GWh | corridor added |
|---|---|---|---|---|
| 2035 | no network limits | 3.1 | 0 | - |
| 2035 | today's corridors | 56.6 | 83 | - |
| 2035 | the plan's inter-area lines by their dates | 35.5 | 1 | - |
| 2035 | corridors buildable at R21,700 per MW-km | 4.6 | 0 | 19.7 GW, R6.0bn a year |
| 2040 | no network limits | 13.1 | 2 | - |
| 2040 | today's corridors | 105.6 | 2,900 | - |
| 2040 | the plan's inter-area lines by their dates | 79.4 | 58 | - |
| 2040 | corridors buildable at R21,700 per MW-km | 15.1 | 2 | 28.6 GW, R8.8bn a year |

All rows the every-change pass on weather 2025 [EC]; the unserved energy is one year's, not the adequacy standard's.

## Figure check against docs/regional-audit.md (7 Nov 2026)

| figure in the text | source in the doc | table | status with the final builds |
|---|---|---|---|
| 35 and 79 TWh with the TDP's lines; 3 and 13 TWh with no limits | 756 (c), tables756.md: 35.5 and 79.4; 3.1 and 13.1 | v3 | changes (every-change pass) |
| the Northern Cape's exits at their limit about 8,700 hours | 756 (c): North West to Northern Cape 8,754 and 8,760 h, Free State to Northern Cape 8,650 and 8,756 h with the TDP's lines | v3 | changes little; rerun |
| today's fleet loses nothing to the inter-area corridors | 739 (a) on the earlier table: the 2025 and 2026 fleets curtail nothing, no corridor binds 1,000 hours. Rerun on the table of record (queue25, 7 Nov): still no curtailment and nothing unserved beyond the Koeberg calendar's 14 GWh in 2025, but one corridor is now at its limit for long spells with a shadow value near nil: 2025, Mpumalanga to North West 4,048 h at R0.00m per MW-year; Eastern Cape to Free State 2,246 h at R0.00m per MW-year; Northern Cape to Western Cape 2,070 h at R0.01m per MW-year; 2026, Mpumalanga to North West 3,137 h at R0.00m per MW-year; Free State to Northern Cape 2,486 h at R0.00m per MW-year; North West to Northern Cape 2,177 h at R0.00m per MW-year. So 'does not fill' is not quite right on the table of record; 'loses nothing to the inter-area corridors' is | v3 | does not depend on the final builds (today's dumps) |
| R4bn expected this financial year, as reported | SOURCES on claude/c7-runs: Moneyweb, 6 Nov 2026, reporting Keith Bowen of the NTCSA on a Cresco and Fasken panel; a reported remark, not a published figure (784 (c)) | - | external |
| 2032 curtailment 20 to 9 TWh at 293 km a year, R7.6bn | 743 (c), tables743.md: 20.1 to 9.4 TWh; fuel and carbon R81.0bn to R73.4bn | v2 (the 2030 and 2032 dumps) | changes (final builds and v3) |
| R2.8bn buys 1 TWh as 2 GW of lithium or 45 TWh as corridors | 731, tables731.md: 55.4 to 54.2 TWh for R2.79bn; 18.0 GW of corridor at R21,700 for R2.79bn, 55.4 to 10.0 TWh | v2 | changes (final builds and v3; on v3 the corridor price per MW is higher) |
| lithium a net cost at the engine's value, corridors a net saving at either | 754 in 731: 2 GW at 4 h net a cost of R1.2bn at R12,300 and a saving of R1.1bn at R87,000; corridors a saving of R32 to 44bn | v2 | the signs are expected to hold; rerun |
| Gauteng short 58 GWh in 2040 with the TDP's lines | 762 (b): 58 GWh hourly (42 GWh in the 3-hour blocks the lithium case uses) | v3 | changes |
| the store at the Eastern Cape and Hydra Central exits clears half | 762 (b): 2.2 GW / 18 GWh, 20 of the 42 GWh in the block case | v3 | changes |
| 20 GW of corridor, R5.8bn a year, clears all of it and 65 TWh | 762 (b): 19.6 GW for R5.81bn, 42 to 0 GWh and 79.0 to 13.8 TWh in blocks (hourly 19.7 GW, 58 to 2 GWh) | v3 | changes |
| the table | 756 (c) rows on v3, the no-limits rows from 738 (b) | v3 | changes |

Which figures change once the final builds are in: every number in the text and the table except the today's-fleet sentence (today's dumps,
not the final builds) and the reported R4bn (external). The line-order and lithium-against-corridor figures also move from the earlier table
to the table of record when rerun. The signs (lithium a net cost at the engine's value, corridors a saving at either) and the order of the
binding corridors are the findings expected to hold.

On the 8 Nov key's central (782, 7 Nov 2026; not a final build; the draft's figures stay placeholders): with the TDP's lines 32.7 and 86.0 TWh,
with no limits 2.8 and 16.0; today's corridors 53.0 TWh and 21 GWh in 2035, 112.5 TWh and 1,926 GWh in 2040; the plan's lines 0 and 15 GWh;
corridors at R21,700 4.3 TWh (18.8 GW, R5.7bn a year) and 18.0 TWh (28.8 GW, R8.9bn); the Karoo exits still at their limit about 8,700 hours;
Gauteng short 15 GWh hourly (11 in blocks), the store (1.7 GW / 11 GWh, Eastern Cape and Hydra Central) clears all of it and nets a saving at
either value; 19.5 GW of corridor for R5.7bn clears it and 69 TWh. The 2032 and R2.8bn figures were not rerun on the key.
