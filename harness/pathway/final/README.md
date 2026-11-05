# Final passes (message 720 (e)): run files for the network test

No hourly series: the pathway files hold settings, the build schedule by year and the LP's objective; the engine files hold annual
results per checked year. Eskom data (ESK19679) enter the runs only through the metered reference already in profiles.json; nothing
here is an hourly Eskom-derived series.

| File | What | Code | Settings |
|---|---|---|---|
| pathway_every_change_05f.json | the LP pass with every 707 and 710 change, curtailment price 0 (RESULTS 'Each change sized on run (6), and the one LP pass with every change') | claude/twin-retime 17f42a5, build 2026-11-05f | run (6)'s: c7's settings (SS=inertia SS_FC=reservecoal COC=blended BTM_STOCK=8 VPP=1 GY=1 COAL_FUEL_ESC=3 COAL_FOM_ESC=1.1 COMPLY=compromise COAL_CARBON_FLOOR=1, env_c6a.sh, GAS_FIRST=2035), REP_WEIGHTS=clustered REP_DAYS=25 STORAGE_LINK=1 WX_WINDCORR=1 CONG_OFF=1 REP_REF=metered REP_EXTREMES=20,161,162,163,187,188,194,195,196,214,218,358, pass 1 (MAXP=1), parallel dual simplex, presolve off |
| engine_every_change_05f.json | its engine check | pathcheck.js at 17f42a5 | K=20, YEARS=2030,2035,2040, LNG=1 GRID=1 SS_FC=reservecoal CONG_OFF=1 WX_WINDCORR=1 |
| engine_every_change_05f_gas.json | the same check with the gas record by technology (r.gasDetail) | pathcheck.js at claude/twin-retime 5abefa2 (harness only; unserved identical to the digit) | as above |

| pathway_fin_05h.json | the fin pass: the every-change pass plus coal's part-load factor in the LP (FIXED.bldCoalPartLoad) and the verdict rule (VERDICT_TOPUP {start 2, steps [10, 20], frac [0.25, 0.5]}); adequate at pass 1 (messages 713, 720) | claude/twin-retime 10a98e2, build 2026-11-05h | as the every-change pass (the same extremes), env_c6.sh's VERDICT_TOPUP |
| engine_fin_05h.json | its engine check | pathcheck.js at 10a98e2 | K=20, YEARS=2030,2035,2040, LNG=1 GRID=1 SS_FC=reservecoal CONG_OFF=1 WX_WINDCORR=1 |

The 7 Nov loops follow here when they finish.
