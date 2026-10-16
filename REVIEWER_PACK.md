# GridTwin ZA – reviewer pack

Draft for an outside energy modeller, 14 October 2026; refreshed on 15 October on c5b_14r and on 16 October on the central run, c5d. Prepared from the project's results log (RESULTS.md), its source register (SOURCES.md) and the validation/ folder. One run was made for this pack, s_tariffcf (section 4); otherwise c5d's figures are its own run and engine check, and its engine's suite.

## What this is and how to read it

GridTwin ZA is a South African power-system model by Nick Hedley. It has two parts:

- an hourly dispatch engine that simulates a year on one national node, with coal unit commitment, outage draws and twelve weather years (2014–2025);
- a build optimiser, a linear programme that chooses new capacity each year to 2040 on representative days plus 14-day stress windows.

The two run in a loop. The engine checks each year of the optimiser's plan against an adequacy target, and any year that fails adds stress windows to the next pass.

The central run reviewed here is c5d: c5c's settings on build 2026-10-16a, with the build LP's planning reserve margin off, so adequacy is set by the engine's probabilistic standard alone (RESULTS 'New central c5d'). It replaces c5b_14r (build 2026-10-14r), which the second draft reviewed, and c5 (build 2026-10-14i) before it. Sections 2, 3, 5 and 6 were written on c5b_14r. c5d keeps c5b_14r's build choices A to E (section 4) but not its engine: from build 2026-10-15e pumped storage's reserve is counted once and spare gas charges the existing stores ahead of a forecast shortfall. So each figure in those sections is c5d's where its run outputs or its engine's checks have it, and is otherwise labelled as c5b_14r's (engine build 14r) or c5's. The sensitivity results in section 4 are provisional until you have read them.

How to read the pack:

- Each section leads with its finding.
- Sources are given in brackets: a RESULTS entry, named by the start of its heading, or a SOURCES section. The full headings are listed at the end.
- Rands are 2026 rands. PV means present value at 8% real from 2026. "Engine PV" is the engine check's system cost over 2026–40.
- Some constants and annual totals come from Eskom's hourly datasets (ESK19679, ESK19243), which were obtained on request. Eskom is credited for the data, and the analysis is the author's, not Eskom's. No hourly or per-unit Eskom values appear here.
- With two to three hours, read sections 1 and 5 first, skim 2 to 4, and spend the remaining time on section 6.

---

## 1. Assumptions

Finding: of 24 rows, 5 are fully sourced and 15 partly sourced. Two are unsourced: the LNG cargo size, and the 10% planning reserve margin, which is off in c5d and is now sensitivity s_prm10. Two rows mix a sourced value with an unsourced one: coal operation, where the minimum stable level is unsourced, and grid cost, where the free connection on retired-coal sites is a modelling choice.

Status key:

- Sourced: a named, dated source supports the value as used.
- Partly: the source is second-hand, approximate, or covers only part of the value.
- Unsourced: no source is recorded.

| Assumption | Value used | Source and date | Status |
|---|---|---|---|
| Demand growth | `DEMAND=irp_esrg`: the growth in UCT ESRG's IRP reference forecast (IRPDemandREF), applied to the measured 2026 base. 2030 index 1.101384 (RESULTS 'c5 demand against IRP 2025') | ESRG workbook, ZivaHub doi:10.25375/uct.26942134. Unchanged since September 2024, before the IRP draft and plan. No source names it as the plan's moderate forecast (RESULTS 'Demand checks before rebasing'), 14 Oct 2026 | partly |
| Demand base, 2026 | c5: 200.62 TWh, which is calendar 2025 domestic demand × 0.9519 with rooftop added back. c5b_14r and c5d: September–December scaled at 0.9766 instead, giving 203.03 TWh (RESULTS 'c5b demand inputs built', build 2026-10-14k) | Constants derived from Eskom data. The 0.9519 counted the 2025 step twice for September–December, about 2.4 TWh (RESULTS 'Demand checks before rebasing'). Fix decided 14 Oct 2026 | sourced |
| Returning smelter load (c5b_14r and c5d) | Flat 930 MW block from 2027. Sensitivity s_gmcv2029: 675 MW in 2029, 493 MW from 2030 (RESULTS 'c5b demand inputs built') | Contracted 12.8 TWh a year (1.46 GW) at 80% take-or-pay = 1.17 GW, less 0.24 GW already in the base (RESULTS 'Smelter block sized'). Contracted, not yet measured. 14 Oct 2026 | partly |
| Coal fleet | 39,692 MW in 2026 | Eskom integrated report FY2026, as at 31 Mar 2026 (SOURCES 'Kelvin power station') | sourced |
| Coal retirement | IRP 2025 Figure 3, 50-year line, ±250 MW: standing coal 32,433 MW in 2030 and 17,890 MW in 2040 in both c5 and c5b_14r (RESULTS 'c5 inputs, final') | Figure (plan p.12) digitised by Nick Hedley, 13 Oct 2026 (SOURCES 'Currently loaded'). Sensitivities: the 60-year line, and Meridian's ME IRP 2024 dates | partly |
| Coal operation | Coal-only EAF 65%; minimum stable level 0.5 on 16 coal rows | EAF from Eskom data, January–August 2026. The 0.5 is the project's own change to Meridian's data (SOURCES 'Values derived from Eskom's ESK19679'; 'UC_FLEET minimum stable level 0.5') | mixed |
| Carbon tax | 'kept2030': R46.00/t in 2026 rising to R61.31/t in 2030, then held. The full rate (R308–410/t) is a sensitivity (RESULTS 'Carbon in c5's optimiser', build 2026-10-14h) | Carbon Tax Act s5 rates. Allowance kept to 2030 per the 2025 Budget, as reported second-hand. Price neutrality not modelled (SOURCES 'Carbon tax in law'), 14 Oct 2026 | partly |
| Wind | c5d: capex R17,773/kW in 2026, the capex BW5's awarded tariff implies (weighted average R495.22/MWh, April 2021 rands, indexed), at BW6 wind bids' 37.24% capacity factor and fixed O&M, over 25 years at 8% real; falling 2.86% a year. New wind runs on the modern-turbine profile without correction: 42.5% over the twelve weather years. Fixed O&M R392/kW-yr (BW6 bids). Because the capex is backed out at 37.24% and new wind runs at 42.5%, it costs R552.4/MWh in 2026 at 8% real before grid charges, 0.876 of BW5's tariff in 2026 rands (R630.6) (RESULTS 'Reviewer pack on c5d'). Sensitivities: BW6 bids' R28,462/kW (s_bw6capex), the 1.064 correction to 45.2% (s_wind1064), BW6 bids' 37.2% (s_wind372), and capex backed out at 42.5%, R20,879/kW, so wind costs its tariff (s_tariffcf) (RESULTS 'New central inputs', build 2026-10-15e) | BW5 tariff: DMRE media statement, 28 Oct 2021, 12 projects; BW6 bids: IPP Office note, 7 Nov 2025, January 2024 rands × 1.068; what the O&M bid includes is not defined. The low end of the evidence (user, message 126 (2)). Decline from "BNEF", edition not recorded. Life: no source | partly |
| Utility solar | c5d: single-axis tracking at R11,755/kW in 2026, the capex the MW-weighted mean of BW7's 18 solar awards implies (R492.53/MWh over 3,940 MW, January 2024 rands, indexed), at BW6 tracker bids' capacity factor and fixed O&M, over its life at 8% real; falling 3.89% a year. Tracking profile 28.7% over the twelve weather years. Fixed O&M R287/kW-yr (BW6 bids, R269 in January 2024 rands). Because the capex is backed out at 30.13% and new solar runs at 28.7%, it costs R552.8/MWh in 2026 at 8% real before grid charges, 1.051 of BW7's tariff in 2026 rands (R526.1) (RESULTS 'Reviewer pack on c5d'). Sensitivities: BW6 tracker bids' R16,786/kW (s_bw6capex), and capex backed out at 28.7%, R11,038/kW, so solar costs its tariff (s_tariffcf) (RESULTS 'New central inputs', build 2026-10-15e) | BW7 awards (BW7_SOLAR_AWARDS, eight of December 2024 and others, as recorded); BW6 bids: IPP Office note, 7 Nov 2025; what the bid capex includes is not defined. Decline rate: no source recorded | partly |
| New batteries | Lithium R3,425/kWh (R13,699/kW at 4 hours), falling 3% a year; 5% as a sensitivity (RESULTS 'Lithium on BESIPPPP bid window 3, aged') | BESIPPPP BW3 bids, aged; bid inclusions not published. Decline rate from NREL 2025, as given by the user (SOURCES 'Lithium capex decline'), 13 Oct 2026 | partly |
| Existing batteries | c5: 800 MW, no source. c5b_14r and c5d: 68 MW / 292 MWh, the Eskom phase 1 sites operating at mid-2026 and end-2026 (Hex, Pongola, Elandskop) | Of phase 1's 199 MW, Skaapvlei, Paleisheuwel and Graafwater add nothing before 31 Mar 2027 (Minister's reply NW4150, PMG, 21 Sep 2026); Hex's operation (AfDB, 2 Mar 2026); 68 MW installed (AfDB, 1 Jul 2025) (RESULTS 'c5b build') | sourced |
| Gas | CCGT R34,965/kW, flat; central fuel R1,298 per MWh of electricity at 52% efficiency (HHV), January 2026 rands, flat to 2040 (LNG at 13.25% of Brent at USD 80, USD 11.74/MMBtu at the coast plus 0.25 regasification, at R16.50); the code's default R2,003/MWh is not used in c5b_14r or c5d (RESULTS 'Input checks'); terminal R354–707/kW-yr, with c5 at 530.5; 0.348 t CO2/MWh (RESULTS 'Gas price cases built') | GridLab, Sep 2025; search extracts; shipping is "the least-sourced input" (SOURCES 'Gas price cases'), 9 Oct 2026 | partly |
| LNG supply | One cargo = one floating storage unit, 170,000 m³ = 4.08 PJ. Reported after the run; not a constraint in the optimiser (RESULTS 'c5 for the write-up') | No source given for the unit size | unsourced |
| Diesel | R6,100/MWh fuel plus R70/MWh variable O&M; existing peakers 3,400 MW | Eskom realised R6,011/MWh in 2025/26 (Parliamentary reply NW1243, 7 May 2026). The 1.5% difference is unexplained (SOURCES 'Diesel fuel price') | partly |
| Discount rate | 8% real; 10% and 11.3% as sensitivities | IEA Cost of Capital Observatory 2025, about 6.5–10% real. IRP 2025 states 11.3%, real or nominal not said (RESULTS 'Deep decarbonisation: no offshore … discount rate sourced'), corrected 11 Oct 2026 | sourced |
| Grid cost | Integration R402/kW-yr. Wind spur R1,010/kW, charged once. No grid cost on connections freed by retired coal; in c5b_14r and c5d only solar, storage and gas may use them, within the coal retired. c5b_14r and c5d: up to 1,580 MW of Cape wind without the integration charge, output cut 4% (RESULTS 'c5 for the write-up'; 'c5b build') | Integration: TDP 2024 Rev 2 Table 4, generation integration plus land pro rata, 51.1% of the five-year R112.5bn, applied to the decade's R440bn: R225bn for 46.9 GW (SOURCES 'Sources used for constants'). Recomputed 15 Oct from the rounded figures: R403/kW-yr against R402, a rounding difference; the five-year share applied to ten years is our assumption; not yet re-read from the primary PDF, so the page and Rev 1's figures are pending. It pays for shared upstream network; BW6 capex likely carries only the dedicated connection, so in principle the two do not overlap (RESULTS 'Wind diagnostics on c5b_14r'). Spur: ITP Phase 1 line cost, unverified. Freed connections: a modelling choice made 7 Oct 2026; the technology list c5b_14r and c5d use follows Eskom's repowering pipeline (Engineering News, 17 Jun 2025). Cape allowance: NERSA approval of 29 Apr 2025 and NTCSA's GCCA update of 31 Oct 2025, as reported (Pinsent Masons, 1 Jul 2025; Cliffe Dekker Hofmeyr, 3 Dec 2025) | mixed |
| Imports and exports | Imports: 1,150 MW contract × 0.88 = 1,012 MW in every year (c5); c5b_14r and c5d 1,066 MW. Exports: 745 MW, the level since Mozal closed; the IRP holds 11.0 TWh (RESULTS 'Smelter block sized') | Means from Eskom data. The IRP does not say what follows the Cahora Bassa contract, so s_noimp tests imports ending in 2030 | partly |
| Rooftop | 8,942 MW in 2026, plus 900 MW a year to 12.6 GW in 2040. Capex R17,000/kW falling 3.89% a year (RESULTS 'c5 result'; 'Rooftop in the two cost measures') | NTCSA private PV, August 2026, less 488 MW wheeled (SOURCES 'Notes that keep biting'). 900 MW a year matches IRP Table 1 to 2035; no source after 2035 or for the capex | partly |
| Operating reserve | 2,200 MW by product, after NTCSA's ASTR: instantaneous 650 MW peak / 850 off-peak; regulating 830 MW each way in 2026/27 rising to 1,140 by 2030/31; ten-minute 720 / 520 falling to 410 / 210; held from coal headroom and storage with energy behind it, decided with dispatch; held at 2030/31's level after 2031. Open-cycle plant and interruptible load are emergency reserve only (RESULTS 'ASTR reserve rule'; 'Storage reserve decided with dispatch') | NTCSA Ancillary Services Technical Requirements 2026/27–2030/31, Rev 1, 12 Jan 2026, pp. 6–12, as read by the author. Sustain times: instantaneous 10 minutes (ASTR p.6); regulating 60 and ten-minute 30 minutes borrowed from CAISO's rules for non-generator resources (2010) | partly |
| Avon and Dedisa | Run on their contracts until they end (Dedisa end-2030, Avon 20 July 2031): monthly daytime and evening-peak levels, nights zero, 899 GWh a year; fuel and CO2 at the diesel fleet's rates (RESULTS 'Avon and Dedisa as must-run to contract end') | Levels from Eskom data (ESK19679, January–August 2026); September–December are 2025's shape scaled to 2026's level, the author's choice | partly |
| Interruptible load | 1,000 MW, no annual energy cap; called after open-cycle plant, as the last resource before shedding, and to restore reserve once open-cycle is exhausted (RESULTS 'Interruptible load cap tried and withdrawn') | Eskom's certified instantaneous demand response, 1,014 MW (NREL, Demand Response at the Grid Edge, FY24). The order is the author's decision: the ASTR sets none (p.10) | partly |
| VoLL | Engine R9,530/MWh. Optimiser: stress-window shortfall at R87,000/MWh × 365 (RESULTS 'Load shedding now costed'; 'Both measures for every run') | Eskom's Cost of Load Shedding (NERSA review, 2022); the IRP's COUE of R87.85/kWh | sourced |
| Planning reserve margin (build LP) | Off in c5d (build 2026-10-16a, FIXED.bldPlanMarginPct 0): adequacy is set by the engine's probabilistic standard alone (next row). Sensitivity s_prm10 restores the 10% margin: each year, firm capacity at least 1.10 × the peak hour of the represented days, wind and solar counting zero, every store at the lesser of its power and its energy over 4 hours. It bound in c5c in every year 2030–40 and set the firm capacity built (RESULTS 'Planning reserve margin in the build LP'; 'New central c5d') | No source for 10%: a modelling choice in the code since 1 Oct 2026, not South Africa's criterion. Turned off by the user, 16 Oct 2026 (message 133) | unsourced (sensitivity only) |
| Adequacy standard | Mean unserved energy at most half of 0.002% of customer demand: 2.19 GWh in 2030 and 2.78 GWh in 2040 for c5d, as for c5b_14r (c5: 2.08 and 2.66) (RESULTS 'Average system cost per MWh served'; 'New central c5d') | The 0.002% is the Australian NEM standard; halving it is the author's choice, 12 Oct 2026. NTCSA's Medium-Term System Adequacy Outlook 2025–2029 deems adequacy met below 20 GWh of unserved energy a year and a 6% open-cycle capacity factor (search extracts, 16 Oct 2026; SOURCES 'Adequacy criteria'); the model's standard is about eight times stricter on unserved energy. IRP 2025 states no numeric criterion | partly |

Build limits in c5, which c5b_14r and c5d keep (RESULTS 'c5 inputs, final'; 'Diagnosis, not deliverable'; 'c5b proposal'; SOURCES 'Tubatse pumped storage'):

- lithium at most 3 GW a year;
- wind at most 2.5 GW a year to 2030 and 3.5 GW a year after;
- new gas from 2030, at most 1,200 MW a year;
- pumped hydro: Tubatse only, 1,500 MW from 2038.

---

## 2. The 2025 replay and the benchmarks

Finding: the 2025 replay matches Eskom on energy. Coal is within about 1% of Eskom's 170.4 TWh. It does not reproduce how 2025 was operated: the model sheds 28–89 GWh against Eskom's 390 GWh and curtails nothing against about 1.0–1.6%. On c5d's engine (build 16c, whose engine check of c5d is identical to 16a's) the benchmark suite passes 28 of 29 checks; the one failure is the peaker seasonal ratio. On c5b_14r's engine (14r) it passed 27 of 29, with pumped-storage output also failing. One external check fails on both: EDMSA Scenario A CO2 in 2035.

### The '2025, as modelled' preset

The preset runs the 2025 fleet, 2025 demand (194.62 TWh domestic), exports of 1,705 MW, 2025's drought hydro and 58.4% coal availability.

| 2025, TWh | Eskom (author's analysis) | Model, build 03c | Model, build 04a/12e |
|---|---|---|---|
| Coal | 170.4 | 168.9 | 168.6 |
| Imports / hydro | 6.57 / 1.79 | 6.57 / 1.79 | – |
| Diesel peakers | 3.36 | 2.32 | 2.25 |
| Pumped storage | 4.49 | 2.67 | – |
| Shed, GWh | 390 | 17.6 | 28.3 (hourly coal trace) |

(RESULTS 'The backcast gap, re-measured', 03c; 'Backcast 2025 now runs 2025's own demand', 04a; 'Preset inventory at build 2026-10-12e')

Where the replay falls short:

- Shedding. Since the hourly coal trace was taken out of the public repository on 12 Oct, the preset sheds 67.0 GWh at its own seed and 88.5 GWh on average over 20 seeds (range 5.6–134). Monthly availability factors did not help (RESULTS 'Retiring the coal availability trace', 12e).
- Why. The model sheds only to cover a shortfall in the hour. Eskom also shed to refill pumped storage and diesel for the week ahead, against reserve targets it does not publish (RESULTS 'The backcast gap, re-measured'). Holding the peakers to 1.4 GW took modelled shedding to 131 GWh (RESULTS 'The 2025 backcast decomposed', 22ak).
- Curtailment. The model curtails none, against about 1.0–1.6%. That range is derived from NERSA's deemed-energy payments, since NERSA gives no GWh figure. No system-wide mechanism the author tried reproduces it, and local grid limits, which a single node cannot see, are the explanation on record. A flat 1.3% stopgap stands in (RESULTS 'Curtailment re-based on 2025'; 'A coal operating floor does not reproduce 2025's curtailment either').
- Pumped storage. On c5d's engine (16c) it produces 3.6 TWh, inside the ±25% band around Eskom's 4.49 TWh (3.37–5.62) (RESULTS 'Reviewer pack on c5d'). On c5b_14r's engine (14r) it produced 3.3 TWh, just below the band: the reserve rule held pumped-storage energy back for reserve, and without that holdback the same run gave 4.97 TWh. It was 3.8 TWh on 14e, before the rule (RESULTS 'Every check moved by the reserve rule and the must-run'; 'Storage reserve decided with dispatch').

### Benchmark suite (validate_benchmarks)

This is a separate 2025 configuration, checked against Ember's monthly file (CC BY 4.0, released 7 Jul 2026; SOURCES 'Ember bulk data') and Eskom annual figures. It passed 27 of 28 checks on builds 14a and 14d, 27 of 29 on 14r, the engine c5b_14r used (the pumped-storage check was added on 14e), and 28 of 29 on 16c, whose engine is c5d's.

| Check | Model, 14d → 14r (c5b_14r's engine) | Model, 16c (c5d's engine) | Benchmark | Result on 14r / 16c |
|---|---|---|---|---|
| Coal | 165.57 → 166.64 TWh | 166.83 TWh | Ember 171.26 ±6% | pass / pass |
| Power-sector CO2 | 174.63 → 176.76 Mt | 176.87 Mt | Ember 160.30 ±12% | pass / pass |
| Grid generation | 214.4 → 216.3 TWh | 216.7 TWh | 190–222 | pass / pass |
| Coal capacity factor | 47.6 → 47.9% | 48.0% | 35–60% | pass / pass |
| Surplus 2025 / 2026 | 2.4 / 5.0 → 1.6 / 4.2 GW | 1.6 / 4.2 GW | 1.2–4 / 4–8 | pass / pass |
| Nuclear, wind, solar, hydro, imports | 10.21, 14.14, 7.11, 2.90, 6.61 TWh, unchanged | the same | various | pass / pass |
| Peaker season ratio | 9.3× → 1.8× | 1.7× | 2.15–8.6× (Eskom 4.3×) | fail / fail |
| Pumped-storage output | 3.8 (14e) → 3.3 TWh | 3.6 TWh | 3.37–5.62 (Eskom 4.49) | fail / pass |

(RESULTS 'Engine fix (B) against the same pass marks', 14a; 'c5 inputs: the imports end year', 14d; 'Scenario switch and load timing', the 14r suite of 15 Oct; 'Reviewer pack on c5d', the 16c suite of 16 Oct)

The peaker ratio failed high on 14a–14d because engine (B) moved evening peaks onto pumped storage. On 14r and 16c it fails low: Avon and Dedisa's nearly flat contract output (now in the model) dilutes a small dispatched component, and the model's first-quarter 2025 shortage is too small (TODO 14eg). Neither band was widened (RESULTS 'Engine fix (B)'; 'Every check moved by the reserve rule and the must-run').

Two points to probe:

- CO2 sits 10.3% above Ember while coal sits 2.6% below (16c, c5d's engine; 2.7% below on 14r). SOURCES records the model's coal factor as 1.04 t/MWh, against 1.008 capacity-weighted in Meridian's fleet file (SOURCES 'Currently loaded').
- Hydro passes at 2.90 TWh, while RESULTS gives Eskom's 2025 hydro as 1.79 TWh. The reference behind the hydro check is not stated in these sources.

### External checks (validate_external)

| Check | Model | Published | Result |
|---|---|---|---|
| CSIR 2030 coal share | 50.9% (14r and 16c) | 55% ±6 | pass |
| CSIR 2030 renewable share | 43.3% (14r and 16c) | 40% ±8 | pass |
| EDMSA Scenario A wind 2035 (24.6 GW wind, 28 GW solar, 8 GW 4-hour storage, 4 GW CCGT) | 72.1 TWh (07s; passes on 14r and 16c) | 64 ±12 | pass |
| EDMSA Scenario A CO2 2035, same build | 83.3 Mt (14r and 16c; 88.4 on 07s) | 124 ±22 | fail, below the floor of 102 |
| CSIR least-cost capacity bands | inside | 2030 and 2050 ranges | pass |

(RESULTS 'New wind on the modern-turbine profile at 1.064', 07s, on the current-turbine profile decided for these checks; 'Cross-check against published least-cost work', 23z)

The EDMSA CO2 failure appears in every suite count recorded since 5 Oct. Its cause is only partly known. The September 2026 rebuild of the wind profile raised wind output about 11% (calibrated to Eskom measurement; EDMSA's is not) and moved the figure from -0.2 to -14.1 Mt, inside the band as widened that day; the check's own note adds that the earlier agreement was partly two models sharing a bias. By 1 Oct, the first build in the repository, it read 90.8 Mt (gap -33.2): the step past the band happened in September, in builds that cannot be re-run, and is not traced; so is the later fall to 83.3 Mt on 14r, unchanged on 16c. It runs on the current-turbine profile, so the modern-turbine decision (7 Oct) does not touch it (RESULTS 'EDMSA Scenario A CO2 2035 (validate_external): already failing').

---

## 3. The PyPSA cross-check

Every figure in this section is c5b_14r's, on engine build 14r. The cross-check has not been re-run on c5d's engine.

Finding: on c5b_14r's own weeks, like for like (operating reserve by product, Avon and Dedisa must-run and interruptible load on the PyPSA side as well), the engine is 1.2% above a single-node PyPSA unit-commitment optimum with 24 hours of sight on the 2026 baseline, 1.1% on 2040 May and 3.5% on 2040 November. In stress it is not close: 26.0% above on the 2040 stress week and 3.1–26.0% (median 8.6%) on the 15 worst stress weeks found in 360 engine-check runs of c5b_14r's 2026–2040. The engine sheds 123.0 GWh across those 15 weeks; the optimum sheds none, with the additions on or off, and covers the reserve in every hour. So mark (1), within 5%, fails on 13 of the 15 and mark (2), no more shed than the optimum, on all 15 (chosen as the engine's worst weeks, so its shedding is by construction; the optimum's none is the finding). The earlier reading, that the engine sheds because it holds coal as reserve which the optimum does not, no longer stands (RESULTS 'Like-for-like cross-check on c5b_14r's weeks').

Engine above the 24-hour optimum on c5b_14r's weeks, %, by what the PyPSA side includes (engine build 14r):

| Week | all off | reserve only | must-run only | interruptible only | all on |
|---|---|---|---|---|---|
| base (2026, default profiles, hour 3264) | +5.6 | +5.6 | +1.2 | +5.6 | +1.2 |
| may (2040, weather 2025, hour 3264) | +1.0 | +1.3 | +1.0 | +1.1 | +1.1 |
| nov (2040, weather 2025, hour 7848) | +3.3 | +3.8 | +3.3 | +3.5 | +3.5 |
| stress (2040, weather 2021, hour 897) | +21.8 | +23.0 | +21.8 | +24.3 | +26.0 |
| stress14d (2040, weather 2016, hour 6807) | +1.0 | +0.9 | +1.0 | +5.2 | +5.1 |

The 15 stress weeks:

| Setting | Gap median, % | Gap range, % | Weeks the engine sheds | Weeks the optimum sheds | Engine shed GWh | Optimum shed GWh |
|---|---|---|---|---|---|---|
| all off | +7.8 | +2.2 to +21.8 | 15 | 0 | 123.0 | 0.0 |
| reserve only | +8.0 | +2.5 to +23.0 | 15 | 0 | 123.0 | 0.0 |
| must-run only | +7.8 | +2.2 to +21.8 | 15 | 0 | 123.0 | 0.0 |
| interruptible only | +8.9 | +3.0 to +24.3 | 15 | 0 | 123.0 | 0.0 |
| all on | +8.6 | +3.1 to +26.0 | 15 | 0 | 123.0 | 0.0 |

Caveats: differences between settings under about 1% are an artefact of the rolling windows (single-week solves show reserve adds nothing measurable to the optimum's cost); one bus, one outage draw per week; both sides see the actual week ahead (limitation 19).

Earlier, on c4's weeks: the engine was 1.2% above the optimum on the 2026 baseline and 1.7–4.0% above on three storage-heavy 2040 weeks (build 14a), down from 30–48% before the October engine fixes.

### What was compared

Both sides run the same week with the same inputs (RESULTS 'Single-node engine (the note's) against a single-node PyPSA unit-commitment optimum', 12e; 'c4 2040, three weeks'):

- load net of rooftop;
- renewables available as in the engine;
- nuclear, hydro and imports as must-take;
- coal available hour by hour;
- the coal units' minimum stable levels and minimum up and down times;
- the engine's starting commitment and ramp limit;
- each store's start and end state of charge;
- shed at R9,530/MWh.
- on 14r, switchable: the engine's reserve products by hour, its delivered Avon and Dedisa must-run, and 1,000 MW of interruptible load at R4,000/MWh (validation/single_node, sn_pypsa40_roll_x.py).

PyPSA 1.4.0 runs on one bus, solved by HiGHS 1.15.1 to a 0.1% gap. The weeks are the Today 2026 baseline, plus May, November and the worst stress week of c4's 2040 build, which carries 22.5 GW of lithium. The fair comparator is a 24-hour rolling optimum: 48-hour windows, 24 hours kept from each.

| Engine over the 24-hour optimum | 2026 baseline | 2040 May | 2040 Nov | 2040 stress | Stress shed, engine / PyPSA |
|---|---|---|---|---|---|
| c4 engine, 12e | +2.2% | +30.1% | +48.4% | +46.1% | 37.3 / 0 GWh |
| fixes, 13h | +1.3% | +7.3% | +12.4% | +6.6% | 0 / 0 |
| engine (B), 14a | +1.2% | +1.7% | +4.0% | +2.7% | 0 / 0 |
| outages over standing units, 14d | +1.2% | +3.3% | +4.1% | +2.3% | – |

(RESULTS 'Engine fixes (builds 2026-10-13f to 13h …)'; 'Engine fix (B) against the same pass marks'; 'c5 inputs: the imports end year'. c5's commit a74d581, build 14i, contains the 14d change.)

What the steps showed:

- Foresight was not the cause. With 24 hours of sight, PyPSA came within 0–1% of the full-week optimum. The old engine's storage rule, which discharged only in each day's most expensive quarter, cycled lithium 1.6–2.5 times a week against PyPSA's 5.5–6.2 (RESULTS 'c4 2040, three weeks').
- In every week where the old engine shed, the 24-hour dispatch shed nothing. So the earlier adequacy verdicts and top-ups rested partly on that rule (RESULTS '24-hour dispatch sheds nothing where the engine sheds').
- The pass marks were set in advance. Mark (1), within 5%, passes on 14a. Mark (2), no more shed than the optimum, fails in 3 of 15 weeks on 14a and 6 of 15 on 14d. The author recorded these failures without changing anything (RESULTS 'Checks after engine (B) and 14dr'). On 14d, c4's rescanned mean shed is 0.27 GWh (2039) and 0.41 GWh (2040), against a target of about 2.5 GWh.

### The validation/ folder

pypsa_crossval_uc.py and mip_solver.py build a 10-region PyPSA network from the project's own data and compare it with the nodal engine, not the single-node engine c5 uses. Re-run on 13 Oct, the nodal engine came out 4.2% above the matched MIP on a winter week: R2,321.7m against R2,228.0m (RESULTS 'Validation re-run against PyPSA, baseline winter week').

The folder's README calls a 0.42% gap "the model's validated accuracy bound". RESULTS says that figure is not to be quoted until reproduced, for two reasons: neither script computes the engine's side, and the README's own example puts the engine below the MIP, which an optimum should not allow. The single-node scripts behind the table above are on branch claude/sn-crosscheck, not in this validation/ folder.

Recorded caveats: one bus; one outage draw per week; perfect sight within each window; a few weeks rather than a full year.

---

## 4. c5d against IRP 2025 Table 1, and the sensitivities

Finding: c5d is adequate on its first pass, and the engine check passes in every year with no top-up. Engine PV is R2,204.9bn and CO2 is 1,533.7 Mt over 2026–40 (RESULTS 'New central c5d'). Against IRP 2025 Table 1 over 2026–40 it builds:

- less wind (31.8 against 36.0 GW);
- about the same utility solar (24.7 against 25.5 GW);
- 12.2 GW / 53.1 GWh of lithium against 7.2 GW of IRP storage;
- about half the IRP's gas (8.9 GW of CCGT and 31 MW of open-cycle on LNG, against 17.3 GW);
- no nuclear and no pumped hydro.

Its CO2 is below the IRP's (122.0 against 168 Mt in 2030; 80.3 against 142 Mt in 2035), on a lower demand: c5d serves 220.4 TWh of customer demand in 2030, while the IRP's 168 Mt goes with 255 TWh on its own basis.

| Year | Wind c5d / IRP | Solar c5d / IRP | Rooftop c5d / IRP DG | Lithium c5d MW / MWh | IRP storage MW | CCGT | Open-cycle LNG / diesel | IRP gas | IRP nuclear | Coal standing c5d / IRP Fig 3 | CO2 Mt c5d / IRP |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 2026 | 1,580 / 964 | 354 / 3,553 | - / 900 | 360 / 1,440 | 144 | - | - / - | - | - | 39,692 / 39,692 | 152.6 / – |
| 2027 | 2,500 / 2,847 | 255 / 2,886 | 900 / 900 | 306 / 1,224 | 150 | - | - / - | - | - | 39,692 / 39,692 | 153.8 / – |
| 2028 | 2,500 / 770 | 240 / 1,760 | 900 / 900 | - / - | 615 | - | - / - | - | - | 39,692 / 39,692 | 146.6 / – |
| 2029 | 2,500 / 760 | 2,665 / 1,314 | 900 / 900 | - / - | 2,615 | - | - / - | 3,000 | - | 37,027 / 37,064 | 133.7 / – |
| 2030 | 2,500 / 2,000 | 3,277 / 800 | 900 / 900 | 2,524 / 4,860 | 200 | - | - / - | 3,000 | - | 32,433 / 32,388 | 122.0 / 168 |
| 2031 | 3,500 / 2,500 | 2,887 / 1,000 | 900 / 900 | 1,780 / 6,290 | 200 | - | - / - | - | - | 30,876 / 30,839 | 108.4 / – |
| 2032 | 3,500 / 2,600 | 2,547 / 1,200 | 900 / 900 | 1,183 / 4,828 | 200 | 452 | - / - | 1,250 | - | 29,223 / 29,324 | 94.7 / – |
| 2033 | 3,500 / 2,600 | 378 / 1,400 | 900 / 900 | 507 / 993 | 200 | 882 | - / - | 1,250 | - | 28,121 / 27,886 | 87.5 / – |
| 2034 | 3,500 / 3,000 | 747 / 1,600 | 900 / 900 | 662 / 1,477 | 200 | 1,200 | - / - | 1,250 | - | 26,467 / 26,403 | 80.7 / – |
| 2035 | 1,249 / 3,000 | 394 / 2,000 | 900 / 900 | 550 / 2,332 | 200 | 555 | 31 / - | 1,000 | - | 25,916 / 26,029 | 80.3 / 142 |
| 2036 | 1,027 / 2,000 | - / 1,600 | 900 / - | 172 / 161 | 500 | 1,050 | - / - | 1,250 | 1,250 | 25,348 / 25,350 | 81.6 / – |
| 2037 | 902 / 3,000 | 1,953 / 1,600 | 900 / - | 919 / 4,836 | 500 | 1,200 | - / - | 1,500 | 1,250 | 23,658 / 23,415 | 79.8 / – |
| 2038 | 2,583 / 3,000 | 1,674 / 1,600 | 900 / - | 871 / 3,968 | 500 | 1,200 | - / - | 1,250 | 1,350 | 21,969 / 21,819 | 74.6 / – |
| 2039 | - / 3,500 | 4,123 / 1,600 | 900 / - | 1,428 / 10,554 | 500 | 1,200 | - / - | 1,250 | 1,350 | 19,661 / 19,825 | 70.4 / – |
| 2040 | 414 / 3,500 | 3,178 / 1,600 | 900 / - | 977 / 10,156 | 500 | 1,200 | - / - | 1,250 | - | 17,890 / 17,958 | 67.0 / – |
| Total | 31,755 / 36,041 | 24,672 / 25,513 | 12,600 / 9,000 | 12,239 / 53,119 | 7,224 | 8,939 | 31 / 0 | 17,250 | 5,200 | – | 1,533.7 / – |

Notes on the table:

- Build from c5d's own pathway file (local run, build 2026-10-16a); CO2 from its engine check (TF=0.5 LNG=1 GRID=1). Generated from the run outputs and public_data/irp2025_extract.csv.
- "IRP storage" is Table 1's energy storage plus Eskom BESS, in MW only.
- The IRP adds 1,332 MW of pumped hydro in 2037; c5d adds none. Rooftop is 900 MW a year in both to 2035; the IRP lists no distributed generation after 2035.
- c5d retires no coal early; its standing coal follows Figure 3 within 250 MW. 1,580 MW of its wind is Cape wind without the integration charge (C below).
- Every year's mean unserved energy is below its target; the closest is 2031, at 50% of target.
- The optimiser's objective is R1,403.0bn, with no stress-target penalty. Without carbon tax payments, engine PV is R2,146.6bn: the payments are R7.0bn in 2026, R7.5bn in 2030 and R4.1bn in 2040, R58.3bn in present value.

Caveats recorded with the comparison:

- The IRP's 2026–28 rows include build already under construction; c5d holds only the committed floors (A below).
- Table 1 gives storage in MW only and does not split gas.
- On the IRP's own basis, the 2030 demand reaches 255.5 TWh (RESULTS 'Smelter block sized'); the engine's 220.4 TWh is customer demand served, a different measure.

For comparison: c5b_14r had engine PV R2,393.5bn and CO2 1,991.9 Mt (RESULTS 'c5b on build 2026-10-14r, the final base'); c5c, with the 10% margin, R2,257.5bn and 1,548.9 Mt (RESULTS 'New central c5c').

### What c5d changes from c5b_14r

- Central inputs (RESULTS 'New central inputs', build 2026-10-15e): new wind capex from BW5's awarded tariff, R17,773/kW (was BW6 bids' R28,462); tracking solar from BW7's 18 awards, R11,755/kW (was BW6 tracker bids' R16,786); new wind's profile uncorrected, 42.5% (was 45.2%); no spur on bid-derived wind and solar, whose bids include the connection; the optimiser's calendar days chosen by rule.
- Engine (build 2026-10-15e; RESULTS 'New central c5c'): pumped storage's reserve counted once; spare gas charges the existing stores ahead of a forecast shortfall.
- The planning reserve margin is off (build 2026-10-16a; RESULTS 'New central c5d'). The 10% margin is sensitivity s_prm10.

Carried from c5b_14r: Demand (RESULTS 'c5b demand inputs built'): September–December scaled at 0.9766 in place of 0.9519, a flat 930 MW smelter block from 2027, and imports at 1,066 MW. Build choices (RESULTS 'c5b proposal'; 'c5b build'):

- A. Committed projects as minimum builds: wind 696 MW in 2026 and 886 MW by 2027; solar 354, 609 and 849 MW by 2026, 2027 and 2028; batteries 360 MW / 1,440 MWh in 2026 and 666 MW / 2,664 MWh by 2027. Two solar projects without confirmed financial close are left to the optimiser.
- B. The existing battery fleet at 68 MW / 292 MWh (from 800 MW).
- C. Up to 1,580 MW of Cape wind without the integration charge, with a 4% output cut.
- D. Connections freed by retired coal for solar, storage and gas only.
- E. Fixed O&M at BW6's bids: wind R392 and solar R287/kW-yr.

Engine and optimiser (builds 14m–14r; section 1 and limitations 17–18): operating reserve by product after NTCSA's ASTR; Avon and Dedisa run on their contracts; interruptible load at 1,000 MW, called after open-cycle plant; open-cycle plant restores reserve. c5b_14r needed five passes: 2030 failed the loop's adequacy test until the tail-day stress margin reached 3,000 MW.

### The sensitivities: provisional until you have read them

Each run takes c5d's settings, makes one change, and runs up to three passes from scratch. The reference is a null run made the same way with no change: R2,204.9bn engine PV, 1,533.7 Mt and objective R1,403.0bn, the same LP as c5d's first pass (RESULTS 'c5d sensitivities, 30 runs against the null').

| Run | Change from c5d | Engine PV vs null, R bn | CO2 2026–40 vs null, Mt | Objective vs null, R bn | Same direction |
|---|---|---|---|---|---|
| s_carbonfull | Carbon tax at the full statutory rate | +295.9 | -176.3 | +299.3 | yes |
| s_irpgas | IRP 2025's gas plan | +193.5 | -180.5 | +140.5 | yes |
| s_comply_full | Coal emissions compliance, full | +153.1 (with charge) | -108.9 | -7.4 | no |
| s_bw6capex | Wind and solar capex at BW6 bids (wind R28,462/kW, solar R16,786/kW), the high end of the evidence | +140.9 | +297.0 | +132.2 | yes |
| s_disc113 | Discount rate 11.3% | +126.3 | +151.4 | not comparable (a) | not judged |
| s_detgas | Determined gas: 3,000 MW by 2030 (IRP 2019 section 34) plus 5,000 MW in 2031–37 (GN 8021), additional on our reading | +79.2 | -49.3 | +44.9 | yes |
| s_disc10 | Discount rate 10% | +77.8 | +97.6 | not comparable (a) | not judged |
| s_prm10 | Planning reserve margin 10% over peak (the c5c rule) | +52.6 | +15.1 | +44.6 | yes |
| s_comply_comp | Coal emissions compliance, Eskom's recommended plan | +52.3 (with charge) | +0.0 | -0.0 | no |
| s_roof2 | Rooftop 2,000 MW a year | +52.1 | -16.9 | +49.3 | yes |
| s_be7 | IRP nuclear forced: 1,250 MW in 2036–37, 1,350 MW in 2038–39 | +36.6 | -24.7 | -45.5 | no |
| s_nogas4strict | No new gas or diesel open-cycle; lithium up to 4 GW a year | +32.0 (top-up) | -184.5 | +48.9 | yes |
| s_wind372 | New wind at BW6 bids' 37.2% | +30.6 | +132.1 | +44.4 | yes |
| s_committed | Committed gas (1,200 MW a year 2030–33, 200 MW in 2034) and lithium minimums | +27.0 | +18.6 | +23.3 | yes |
| s_be6 | Lithium capped at 550 MW a year from 2026 | +25.4 | +22.6 | +13.4 | yes |
| s_noimp | No imports after 2030 (s_imp2030) | +25.0 | +42.1 | +54.6 | yes |
| s_pvirp | Solar capped by year at Table 1 | +10.7 | +8.5 | +10.0 | yes |
| s_cape10 | 3,470 MW of Cape wind at 10% curtailment | +2.1 | +21.9 | -0.4 | no |
| s_coalme | Coal on Meridian's ME IRP 2024 dates | +1.6 | -38.6 | +23.9 | yes |
| s_gasprem | Gas capital at a 1.5-point finance premium | +1.3 | -19.6 | +6.8 | yes |
| s_li8h | Lithium energy cap at 8 hours instead of 4 | +0.0 | +0.0 | -0.0 | yes |
| s_be4 | 51% minimum capacity factor on new CCGT | -3.4 | -24.5 | +6.2 | no |
| s_grid50 | Integration charge R201/kW-yr (half) for new wind and solar | -3.6 | -60.8 | -33.0 | yes |
| s_grid0 | Integration charge R0 for new wind and solar | -5.8 | -128.2 | -70.4 | yes |
| s_batt5 | Lithium capex falling 5% a year instead of 3% | -9.4 | -15.9 | -6.8 | yes |
| s_wind1064 | New wind at the 1.064 correction (45.2%) | -13.0 | -51.5 | -21.9 | yes |
| s_coal60 | Coal on Figure 3's 60-year line | -14.8 | +22.7 | -26.8 | yes |
| s_gmcv2029 | Smelter block 930 MW to 2028, 675 MW in 2029, 493 MW from 2030 | -23.0 | +3.4 | -25.7 | yes |
| s_measured | No smelter block (measured demand only) | -60.2 | -23.1 | -66.1 | yes |
| s_disc6 | Discount rate 6% | -75.3 | -38.4 | not comparable (a) | not judged |

(a) The objective is at the run's own discount rate, not comparable with the null's at 8%; engine PV, at 8%, is.
"With charge": engine PV includes the emissions compliance charge, which the objective does not carry. "Top-up": with 1,500 MW of diesel open-cycle (below).

What the author takes from the table (RESULTS, as above):

- Pass mark 5, set before the runs: the two cost measures move the same way on 22 of the 27 comparable runs. Three of the exceptions are structural: the compliance charge (s_comply_comp, s_comply_full) and s_be7's forced nuclear capital sit outside the objective. s_be4 and s_cape10 move by less than R10bn and are not traced.
- s_nogas4strict fails the standard in 2034–40. Its mean unserved energy stays below NTCSA's 20 GWh a year in every year (largest 9.07 GWh, 2037); its worst single run is 96–210 GWh a year from 2033. 1,500 MW of diesel open-cycle by 2037 closes the gap for +R8.4bn, +R32.0bn against the null.
- Determined gas costs +R79.2bn on the engine and +R44.9bn on the objective against least cost. The IRP's gas beyond the determinations accounts for R114.3bn of s_irpgas's engine premium (R95.6bn on the objective). s_irpgas's build retires 7,167 MW of coal early, from 2029, which carries its CO2 cut (RESULTS 'c5d sensitivities').
- s_li8h: the 4-hour lithium energy cap does not bind on c5d; its build equals the null's.
- Every other run's engine check is below target in every year.

---

## 5. Known limitations

Finding: the material limits are structural. The plan is chosen on one node with sampled days. Its adequacy is judged by a heuristic engine that is close to an optimum in ordinary weeks but not at the end of stress weeks. Several inputs that drive the build are unsourced or rest on readings of IRP figures.

Structure

1. Single node. There is no internal transmission, so the model cannot produce local curtailment, and in c5 it let Cape-quality wind connect where Mpumalanga coal retired (c5b_14r and c5d bar wind from freed connections, choice D; limitation 10). The regional optimiser still keeps a daily storage balance, so none of its results is published (RESULTS header, third caveat; 'c5 for the write-up').
2. Representative days and stress windows. On c4's 2040 build, lithium cycles 374 times a year in the optimiser against 119 in the engine. In c4's 2030 stress windows the optimiser planned on coal the engine commits less of: 14.0–15.8 GW committed against 16.7–17.1 GW available (RESULTS 'Both measures for every run'; '14de re-check').
3. The engine is both the cost measure and the judge of adequacy. Its cost is an upper bound, and on c5b_14r's engine (14r) it still shed in stress weeks where a 24-hour optimum does not (section 3; not re-run on c5d's engine).
4. No inertia or system-strength requirement in the build. The optimiser never pays for synchronous condensers or grid-forming batteries, which flatters renewable-heavy results, the no-gas case most. The engine enforces a 6 GW synchronous minimum and the optimiser does not. That floor (unsourced) that raises coal output when coal is there; once coal is gone the shortfall is counted but costs nothing, gas plant does not count towards it, and 30% of battery power counts as grid-forming at no extra cost (RESULTS 'Known limitation: no inertia or system-strength requirement').
5. Weather. Single runs, preset figures and most suite checks use one year of hourly shapes; the pathway engine check behind every c-run's adequacy verdict and engine PV, the loop's adequacy test and its stress windows use twelve weather years, 2014–2025 (RESULTS header, corrected 14 Oct 2026). The optimiser's representative days come from the one year.

Inputs

6. Demand basis. Domestic demand fell about 1.9 GW in mid-2025, mostly from suspended ferrochrome smelters. c5 counted that step twice for September–December. The 930 MW block is contracted, not measured: about 0.5 GW was back by mid-2026, and Glencore-Merafe's agreement ends in May 2029. The IRP gives 255 TWh both "in 2030" and "by 2029", and the author has set the target to 2030 (RESULTS 'Demand checks before rebasing'; 'Smelter block sized').
7. The ESRG workbook dates from September 2024 and is not confirmed as the plan's final forecast.
8. IRP figure readings. Coal is the author's digitisation of Figure 3 (±250 MW). The IRP's 2024 demand was read visually from Figure 2, which is still to be read properly. The IRP's peak forecast was not found.
9. Wind and solar cost. c5d backs capex out of awarded tariffs, wind BW5's R495.22/MWh and solar BW7's MW-weighted R492.53/MWh, at BW6 bids' typical capacity factors (wind 37.24%, tracking solar 30.13%; the IPP Office's note does not define them). New build runs at 42.5% and 28.7%. So at 8% real in 2026, before grid charges, new wind costs R552.4/MWh against BW5's R630.6 in 2026 rands (x0.876), and solar R552.8 against BW7's R526.1 (x1.051) (RESULTS 'Reviewer pack on c5d'). s_tariffcf backs capex out at the capacity factors each runs at, so each costs its tariff (section 4). A tariff is a 20-year CPI-indexed price including the developer's return, so it is close to, not the same as, a levelised cost. Wind O&M has no recorded edition, and life is unsourced.
10. Freed coal connections carry no grid cost. In c5 this was worth R9.95bn of the objective to wind; c5b_14r and c5d bar wind from them, and the credit for solar, storage and gas remains a modelling choice (RESULTS 'c5b proposal').
11. LNG cargo caveat. In c5d's engine check (LNG=1; one cargo is one floating storage unit, 4.08 PJ, no heel), the worst 14 days of each year's runs exceed one cargo every year from 2035 (1.03) and reach 3.15 cargoes in 2040; 2032–34 stay below one (0.22–0.93), and c5d burns no LNG before 2032. So from 2035 the plan assumes resupply within a two-week stress event. c5d is adequate on its first pass and has no stress windows, so c5's stress-window measure (10 of 33 window-years above one cargo from 2034) has no c5d counterpart (RESULTS 'Reviewer pack on c5d'; 'c5 for the write-up').
12. Battery fleet. c5 ran with 800 MW of existing batteries, which had no source; c5b_14r and c5d use the sourced 68 MW / 292 MWh.
13. Coal operation. The 0.5 minimum stable level is unsourced, and Kelvin sits inside the scaled 39,692 MW (SOURCES 'Kelvin power station').
14. Imports continue after 2030 because the IRP is silent. The IRP ties Mozal's exit to an end of Cahora Bassa supply, which the 2026 data does not show.
15. Carbon. Allowances rest on second-hand reporting, and price neutrality is not modelled.
16. Licences. PyPSA-RSA data is AGPL v3 but listed as MIT in the project's licence file. Use of NTCSA's GCCA data is not clearly permitted. Both are pending (SOURCES 'PyPSA-RSA: licence'; 'NTCSA GCCA 2025 data').
17. Avon and Dedisa. Since build 14p these two IPP open-cycle plants (1,005 MW) run on their contracts until they end (Dedisa end-2030, Avon 20 July 2031): monthly daytime and evening-peak levels from Eskom's January–August 2026 data, 899 GWh a year, with fuel and CO2 counted. c5 and earlier runs left this out, which understated their cost by about R6.6bn a year and their CO2 by 0.8–1.2 Mt a year to 2031. What remains: September–December use 2025's seasonal shape scaled to 2026's level (the author's choice), and night running is left out (4.5% of 2026's energy) (RESULTS 'Avon and Dedisa as must-run to contract end').
18. Reserve rule. Since build 14m the engine and the optimiser hold the 2,200 MW operating reserve by product, following NTCSA's ASTR 2026/27–2030/31; open-cycle plant and interruptible load count only as emergency reserve. What remains: the sustain times for regulating (60 minutes) and ten-minute reserve (30 minutes) are borrowed from CAISO; the requirement is held at 2030/31's level after 2031 (the document's last year), which understates it in the high-renewable years; interruptible load (1,000 MW) is called after open-cycle plant by the author's decision, since the ASTR sets no order; and on c5b_14r's engine (14r) holding pumped-storage energy for reserve took 2025 pumped-storage output to 3.3 TWh, below the benchmark band; on c5d's engine it is 3.6 TWh, inside it (section 2) (RESULTS 'ASTR reserve rule'; 'Storage reserve decided with dispatch'; 'Interruptible load cap tried and withdrawn').
19. Perfect foresight in dispatch. The engine's look-aheads read the run's own future demand, wind and solar: 48 hours for batteries and pumped storage (engine fix (B)), 24 hours for coal commitment, 12 hours for coal ramping, a week for long-duration stores. Coal outages are held at the current hour's state rather than foreseen. A real operator works from forecasts with error, so the engine tends to understate operating cost, peaker and diesel use, shortfall and unserved energy, and to overstate what storage can do, most in renewable-heavy years. The PyPSA cross-check uses the same foresight, so it cannot catch this. Not changed; measuring it needs forecasts with realistic error, which the ten-day outlook (TODO 14ea) would supply (RESULTS 'Known limitation: the engine's look-aheads read the actual future').
20. No emissions compliance cost on coal running past 2030. Eskom told the NCOP select committee on 10 June 2025 that full compliance with the Minimum Emission Standards would need about R257bn of capital plus R6.3bn a year, and its recommended plan R77bn plus R2.1bn a year (sulphur dioxide at Kusile and Medupi; particulates and nitrogen oxides at six stations) (PMG; Sunday Independent/IOL, 21 June 2025). Medupi's flue-gas desulphurisation alone is estimated at R41.7bn (Eskom's FY2026 integrated report, as reported by Business Day, 2 September 2026). The model charges none of this, so coal kept past 2030 looks cheaper than it is, and s_coal60's saving on c5d (R14.8bn of engine PV against the null) excludes it. The rand year of Eskom's figures is not stated. A sensitivity is being built (COMPLY, TODO 14em).
21. New gas deliverability. The optimiser can build CCGT and open-cycle gas from 2030 at its stated capex. Wood Mackenzie (1 April 2026, as reported by Power Engineering and Utility Dive) expects turbine prices near USD 600/kW by end-2027, nearly triple 2019, with lead times of about six years and order books sold through 2027. New gas from 2030 may not be deliverable on those lead times, and its capex may be understated; neither is modelled (SOURCES 'Gas turbine supply').
22. Options the optimiser cannot choose. The build LP cannot choose coal flexibility, virtual power plants, demand response (interruptible or shifted load) or a general long-duration store; their effect on cost and adequacy is not in any run. They are the first batch of new options after the note (HANDOVER 'c5 options'). Coal minimum stable levels in the code (build 2026-10-16a): the build LP holds committed coal at no less than 0.65 of what is committed (bldCoalMinFrac), with commitment moving by at most available coal / 48 per hour; the engine's unit commitment uses each station row's own minimum, 0.65 on 15 rows (Arnot, Duvha, Grootvlei, Hendrina part, Kelvin, Kriel, Lethabo part, Matla, Tutuka) and 0.50 on 16 (Camden, Hendrina part, Kendal, Komati, Kusile, Lethabo part, Majuba, Matimba, Medupi), 0.563 weighted by capacity over 41,530 MW (UC_FLEET). The 0.50 is the project's own change to Meridian's data, unsourced (SOURCES 'UC_FLEET minimum stable level 0.5'); the engine's fleet-average curve (0.54–0.65) is not used while unit commitment is on.
23. Midday coal commitment, curtailment and deemed energy (user, 16 Oct 2026, message 143 (3); RESULTS 'The 2026 replay curtails almost nothing for oversupply'). The engine takes coal units off over midday in 4-hour commitment blocks (BLOCK_HOURS), which NTCSA says the System Operator does not do: it keeps coal online at minimum stable level through daylight for the morning and evening peaks and curtails renewables last (SAPVIA; Engineering News, 30 Jul 2026). The 2026 replay curtails almost nothing for oversupply, against NTCSA's up to 3 GW on a winter day in 2026, so midday oversupply, coal burn and curtailment are likely understated in the pathway years. Deemed energy for curtailed REIPPPP output is not in the engine's cost: upper bound R13.7bn on c5d over 2026-40 (R7.8bn in present value at 8%).

---

## 6. Four questions for the reviewer

Each can be answered from this pack in 30–40 minutes. Each is tied to a decision the model rests on.

1. Is the engine fit to judge adequacy?

   Decision: whether c5d's adequacy verdicts and any top-ups come from the engine, or wait for a reserve-holding optimum.

   Evidence: on c5b_14r's engine (build 14r; not re-run on c5d's), the engine is within 1.1–3.5% of a 24-hour PyPSA optimum on ordinary weeks but 3.1–26.0% above it on c5b_14r's 15 worst stress weeks, where it sheds 123.0 GWh and the optimum, holding the same reserve, sheds none (section 3). The engine's adequacy verdicts and top-ups therefore rest partly on its dispatch, not only on the build.

   Question: would you accept the verdicts on this evidence? If not, which one further test would you require?

2. Should contracted smelter load be in the central case?

   Decision: whether c5d's central case carries the flat 930 MW block, or uses the measured base and keeps the block as a sensitivity (s_measured: -R60.2bn of engine PV against c5d's null).

   Evidence: with the block, 2030 reaches 255.5 TWh on the IRP's basis; without it, about 247 TWh. Only about 0.5 GW was visibly back by mid-2026.

   Question: in a central planning case, would you include industrial load that is contracted but not yet measured?

3. At which capacity factor should wind and solar capex be backed out of their tariffs?

   Decision: c5d backs capex out at BW6 bids' typical capacity factors (wind 37.24%, solar 30.13%); s_tariffcf backs it out at the capacity factors new build runs at (42.5% and 28.7%). The author decides on the central after this run.

   Evidence: on the central basis new wind costs R552.4/MWh, 0.876 of BW5's awarded tariff in 2026 rands, and solar R552.8/MWh, 1.051 of BW7's (limitation 9). The capacity factors behind the awarded tariffs are not published. s_tariffcf's result is in section 4.

   Question: should the capex be backed out at the bid window's typical capacity factor, at the capacity factor the model runs new build at, or at another figure, and from which source?

4. Should LNG resupply constrain the optimiser?

   Decision: whether c5d limits stress-window gas burn to one floating storage unit per 14 days.

   Evidence: in c5d's engine check, the worst 14 days of each year exceed one cargo every year from 2035 (1.03) and reach 3.15 cargoes in 2040 (limitation 11). c5d has no stress windows, so c5's measure (10 of 33 window-years above one cargo) has no c5d counterpart.

   Question: is one cargo a fortnight realistic for the terminal the cost assumes (R354–707/kW-yr)? If not, what storage or resupply rate would you use, and from which source?

---

## RESULTS entry headings drawn on

- GridTwin ZA – verified results (header caveats)
- Load shedding now costed; coal EAF is coal-only, 22 Sep 2026
- Deep decarbonisation: no offshore, 20 GW lithium; discount rate sourced, 22 Sep 2026
- The 2025 backcast decomposed; a Backcast 2025 preset, 22 Sep 2026
- Cross-check against published least-cost work, 23 Sep 2026
- South Africa has no reliability threshold to compare this against
- The backcast gap, re-measured: inputs explain the energy, operation explains the shedding, 3 Oct 2026
- Curtailment re-based on 2025: a stopgap at 1.3%, and why the dispatch produces none, 3 Oct 2026
- Backcast 2025 now runs 2025's own demand, 4 Oct 2026
- A coal operating floor does not reproduce 2025's curtailment either, 4 Oct 2026
- Lithium on BESIPPPP bid window 3, aged to January 2026 …, 7 Oct 2026
- New wind on the modern-turbine profile at 1.064 …, 7 Oct 2026
- Gas price cases built: central R1,298/MWh fuel …, 9 Oct 2026
- Diagnosis, not deliverable – With no gas deliverability cap the central builds 7.6 GW of gas in 2030 …
- Average system cost per MWh served … (the adequacy target's definition), 11 Oct 2026
- Preset inventory at build 2026-10-12e …, 12 Oct 2026
- Retiring the coal availability trace …, 12 Oct 2026
- Both measures for every run …, 13 Oct 2026
- Rooftop in the two cost measures (for s_roof2) …, 13 Oct 2026
- Single-node engine (the note's) against a single-node PyPSA unit-commitment optimum …, 13 Oct 2026
- c4 2040, three weeks …, 13 Oct 2026
- 24-hour dispatch sheds nothing where the engine sheds …, 13 Oct 2026
- Engine fixes (builds 2026-10-13f to 13h …), 13 Oct 2026
- Validation re-run against PyPSA, baseline winter week …, 13 Oct 2026
- Engine fix (B) against the same pass marks (build 2026-10-14a) …, 14 Oct 2026
- c5 inputs: the imports end year … and 14dr …, 14 Oct 2026
- c5 inputs, final (14 Oct 2026) …
- c5 result: adequate after two passes …, 14 Oct 2026
- c5b proposal for the user's approval …, 14 Oct 2026
- c5b build (build 2026-10-14l) …, 14 Oct 2026
- Known limitation: the engine's look-aheads read the actual future, not a forecast …, 14 Oct 2026
- Known limitation: no inertia or system-strength requirement …, 14 Oct 2026
- c5b demand inputs built (build 2026-10-14k …), 14 Oct 2026
- Smelter block sized, 2030 test against 255 passes …, 14 Oct 2026
- Demand checks before rebasing …, 14 Oct 2026
- Carbon in c5's optimiser …, 14 Oct 2026
- c5 demand against IRP 2025 …, 14 Oct 2026
- c5's cost without carbon tax payments …, 14 Oct 2026
- c5 for the write-up …, 14 Oct 2026
- 14de re-check …, 14 Oct 2026
- Checks after engine (B) and 14dr …, 14 Oct 2026
- ASTR reserve rule: proposal by product …, 14 Oct 2026
- Avon and Dedisa as must-run to contract end (build 2026-10-14p …), 14 Oct 2026
- Every check moved by the reserve rule and the must-run, with cause and verdict (build 2026-10-14p) …, 14 Oct 2026
- Storage reserve decided with dispatch, the restore step … (build 2026-10-14q …), 14 Oct 2026
- Interruptible load cap tried and withdrawn (build 2026-10-14r …), 14 Oct 2026
- c5b on build 2026-10-14r, the final base …, 14 Oct 2026
- PROVISIONAL until the reviewer has read them: c5b_14r sensitivities …, 14-15 Oct 2026
- Scenario switch and load timing … (build 2026-10-15a), 15 Oct 2026 (the suite on 14r)
- New central inputs (messages 125 (1)-(2) and 126 (2)-(4), build 2026-10-15e) …, 15 Oct 2026
- New central c5c and its first ten sensitivities (build 2026-10-15f) …, 16 Oct 2026
- Planning reserve margin in the build LP …, 16 Oct 2026
- New central c5d: c5c's settings with the planning margin off (build 2026-10-16a) …, 16 Oct 2026
- c5d sensitivities, 30 runs against the null …, 16 Oct 2026
- Fleet table out of the public repository …, 16 Oct 2026
- Reviewer pack on c5d …, 16 Oct 2026
