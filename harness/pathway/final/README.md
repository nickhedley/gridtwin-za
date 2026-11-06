# Final passes (message 720 (e)): run files for the network test

No hourly series: the pathway files hold settings, the build schedule by year and the LP's objective; the engine files hold annual
results per checked year. Eskom data (ESK19679) enter the runs only through the metered reference already in profiles.json; nothing
here is an hourly Eskom-derived series.

| File | What | Code | Settings |
|---|---|---|---|
| pathway_every_change_05f.json | the LP pass with every 707 and 710 change, curtailment price 0 (RESULTS 'Each change sized on run (6), and the one LP pass with every change') | claude/twin-retime 17f42a5, build 2026-11-05f | run (6)'s: c7's settings (SS=inertia SS_FC=reservecoal COC=blended BTM_STOCK=8 VPP=1 GY=1 COAL_FUEL_ESC=3 COAL_FOM_ESC=1.1 COMPLY=compromise COAL_CARBON_FLOOR=1, env_c6a.sh, GAS_FIRST=2035), REP_WEIGHTS=clustered REP_DAYS=25 STORAGE_LINK=1 WX_WINDCORR=1 CONG_OFF=1 REP_REF=metered REP_EXTREMES=20,161,162,163,187,188,194,195,196,214,218,358, pass 1 (MAXP=1), parallel dual simplex, presolve off |
| engine_every_change_05f.json | its engine check | pathcheck.js at 17f42a5 | K=20, YEARS=2030,2035,2040, LNG=1 GRID=1 SS_FC=reservecoal CONG_OFF=1 WX_WINDCORR=1 |
| engine_every_change_05f_gas.json | the same check with the gas record by technology (r.gasDetail) | pathcheck.js at claude/twin-retime 5abefa2 (harness only; unserved identical to the digit) | as above |
| pathway_every_change_ocgtirp_05f.json | the every-change pass with open-cycle capex on the IRP's basis (bldOcgtCostCase 'irp', message 714 (d)); one pass, adequate | claude/twin-retime 17f42a5 (gtza-all) | as the every-change pass, OCGT_COST=irp |
| engine_every_change_ocgtirp_05f_gas.json | its engine check with the gas record by technology | pathcheck.js at claude/twin-retime 06b (gtza-rt) | K=20, YEARS=2030,2035,2040, LNG=1 GRID=1 SS_FC=reservecoal CONG_OFF=1 WX_WINDCORR=1 |

| pathway_fin_05h.json | the fin pass: the every-change pass plus coal's part-load factor in the LP (FIXED.bldCoalPartLoad) and the verdict rule (VERDICT_TOPUP {start 2, steps [10, 20], frac [0.25, 0.5]}); adequate at pass 1 (messages 713, 720) | claude/twin-retime 10a98e2, build 2026-11-05h | as the every-change pass (the same extremes), env_c6.sh's VERDICT_TOPUP |
| engine_fin_05h.json | its engine check | pathcheck.js at 10a98e2 | K=20, YEARS=2030,2035,2040, LNG=1 GRID=1 SS_FC=reservecoal CONG_OFF=1 WX_WINDCORR=1 |

| pathway_loop_base_05h.json | the 7 Nov baseline loop: the fin basis (10a98e2), metered 2025 reference with extreme days recomputed on this build (20, 159, 161-163, 187, 194-196, 218, 358-360), new wind at 42.0%; adequate after pass 1 (messages 720, 721) | claude/twin-retime 10a98e2, build 2026-11-05h | scratchpad loops/solve_loop.sh base: run (6)'s settings, MAXP=6, VERDICT_TOPUP |
| engine_loop_base_05h.json | its engine check | pathcheck.js at 10a98e2 | K=20, YEARS=2030,2035,2040, LNG=1 GRID=1 SS_FC=reservecoal CONG_OFF=1 WX_WINDCORR=1 |

| pathway_loop_mix_05h.json | the 7 Nov mixed-reference loop: wind metered, solar modelled 2025 (REP_REF=wind:metered,solar:2025), its extreme days recomputed on this build (20, 159, 161-163, 187, 194-196, 214, 218, 358, 359); adequate after pass 1 by the loop's verdict (the pass-1 run, the loop's own job stopped at the job limit during the same verdict) | claude/twin-retime 10a98e2, build 2026-11-05h | scratchpad loops/solve_loop.sh mix (P1=1 for this file) |
| engine_loop_mix_05h.json | its engine check | pathcheck.js at 10a98e2 | K=20, YEARS=2030,2035,2040, as above |

| pathway_loop_w3724_05h.json | the 7 Nov loop with new wind at BW6 bids' 37.24% (WIND_CORR=bw6), the baseline's days; adequate after pass 2 by the loop's verdict | 10a98e2 + the verdict cache (harness) | as the baseline loop, WIND_CORR=bw6 |
| engine_loop_w3724_05h.json | its engine check | pathcheck.js at 10a98e2 | K=20, YEARS=2030,2035,2040, as above |
| pathway_loop_m24_05h.json | the 7 Nov loop on the metered 2024 reference (REP_REF=metered with PROFILES_LOCAL, the local-only 2024 profile, never committed; its extreme days 0, 40, 42-44, 175-177, 201-203, 346); adequate after pass 2 by the loop's verdict | 10a98e2 + the verdict cache (harness) | as the baseline loop, PROFILES_LOCAL |
| engine_loop_m24_05h.json | its engine check | pathcheck.js at 10a98e2 | K=20, YEARS=2030,2035,2040, as above |

The common 100-draw check (message 726 (a): the same seeds for every case, SEED_BASE 71830529; 2034-2036, and 2040 where the 20-draw
check reads over 15 GWh), on each loop's final build:

| File | Loop | Settings |
|---|---|---|
| engine_loop_base_05h_k100.json | baseline (final at pass 1) | K=100, YEARS=2034,2035,2036, LNG=1 GRID=1 SS_FC=reservecoal CONG_OFF=1 WX_WINDCORR=1 |
| engine_loop_mix_05h_k100.json | mixed reference (final at pass 1) | K=100, YEARS=2034,2035,2036,2040, as above |
| engine_loop_w3724_05h_k100.json | 37.24% wind (final after pass 2) | K=100, YEARS=2034,2035,2036, as above |
| engine_loop_m24_05h_k100.json | metered 2024 (final after pass 2; fails the gate in 2035 and 2040) | K=100, YEARS=2034,2035,2036,2040, as above |

Comparison runs (on worktrees that differ from the fin basis by one stated change each, on no branch):

| File | Run | Settings |
|---|---|---|
| pathway_loop_w40_05h_cmp.json, engine_loop_w40_05h_cmp.json, engine_loop_w40_05h_cmp_k100.json | new wind at 40% (726 (e)); adequate at pass 1 | gtza-w40: windNewCorr 'cf0.40' (WIND_CORR=cf0.40); the baseline's days |
| pathway_rpcap_05h_cmp.json, engine_rpcap_05h_cmp.json, engine_rpcap_05h_cmp_k100.json | the freed-connection pool capped at the same-area MW (733); one pass, adequate | gtza-rpcap: rpcap_ rows, 0 MW in 2026 to 658 MW in 2035 and 1,290 MW in 2040, linear |
| engine_loop_w3724_05h_pass1_k100.json | the 37.24% loop's pass 1 on the 100-draw gate (746) | as engine_loop_w3724_05h_k100.json |

The metered 2024 loop follows here when it finishes; its reference profile is Eskom-derived and stays local (only the build and the
engine checks are committed).
