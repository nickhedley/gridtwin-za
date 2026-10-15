# GridTwin ZA – reviewer pack

Draft for an outside energy modeller, 14 October 2026; refreshed on 15 October on the final central run, c5b_14r. Prepared from the project's results log (RESULTS.md), its source register (SOURCES.md) and the validation/ folder. Nothing was re-run for this pack except c5b_14r's engine check, which reproduced the published totals to the digit.

## What this is and how to read it

GridTwin ZA is a South African power-system model by Nick Hedley. It has two parts:

- an hourly dispatch engine that simulates a year on one national node, with coal unit commitment, outage draws and twelve weather years (2014–2025);
- a build optimiser, a linear programme that chooses new capacity each year to 2040 on representative days plus 14-day stress windows.

The two run in a loop. The engine checks each year of the optimiser's plan against an adequacy target, and any year that fails adds stress windows to the next pass.

The central run reviewed here is c5b_14r: build 2026-10-14r (code 6045387), the engine on main since 14 Oct. It replaces c5 (build 2026-10-14i), which the first draft of this pack reviewed. Where a figure exists only for c5, it is kept and labelled as c5's. The sensitivity results in section 4 are provisional until you have read them.

How to read the pack:

- Each section leads with its finding.
- Sources are given in brackets: a RESULTS entry, named by the start of its heading, or a SOURCES section. The full headings are listed at the end.
- Rands are 2026 rands. PV means present value at 8% real from 2026. "Engine PV" is the engine check's system cost over 2026–40.
- Some constants and annual totals come from Eskom's hourly datasets (ESK19679, ESK19243), which were obtained on request. Eskom is credited for the data, and the analysis is the author's, not Eskom's. No hourly or per-unit Eskom values appear here.
- With two to three hours, read sections 1 and 5 first, skim 2 to 4, and spend the remaining time on section 6.

---

## 1. Assumptions

Finding: of 23 rows, 5 are fully sourced and 15 partly sourced. One is unsourced: the LNG cargo size (the utility solar row was corrected on 15 Oct: c5b_14r used the BW6 tracker capex). Two rows mix a sourced value with an unsourced one: coal operation, where the minimum stable level is unsourced, and grid cost, where the free connection on retired-coal sites is a modelling choice.

Status key:

- Sourced: a named, dated source supports the value as used.
- Partly: the source is second-hand, approximate, or covers only part of the value.
- Unsourced: no source is recorded.

| Assumption | Value used | Source and date | Status |
|---|---|---|---|
| Demand growth | `DEMAND=irp_esrg`: the growth in UCT ESRG's IRP reference forecast (IRPDemandREF), applied to the measured 2026 base. 2030 index 1.101384 (RESULTS 'c5 demand against IRP 2025') | ESRG workbook, ZivaHub doi:10.25375/uct.26942134. Unchanged since September 2024, before the IRP draft and plan. No source names it as the plan's moderate forecast (RESULTS 'Demand checks before rebasing'), 14 Oct 2026 | partly |
| Demand base, 2026 | c5: 200.62 TWh, which is calendar 2025 domestic demand × 0.9519 with rooftop added back. c5b: September–December scaled at 0.9766 instead, giving 203.03 TWh (RESULTS 'c5b demand inputs built', build 2026-10-14k) | Constants derived from Eskom data. The 0.9519 counted the 2025 step twice for September–December, about 2.4 TWh (RESULTS 'Demand checks before rebasing'). Fix decided 14 Oct 2026 | sourced |
| Returning smelter load (c5b) | Flat 930 MW block from 2027. Sensitivity s_gmcv2029: 675 MW in 2029, 493 MW from 2030 (RESULTS 'c5b demand inputs built') | Contracted 12.8 TWh a year (1.46 GW) at 80% take-or-pay = 1.17 GW, less 0.24 GW already in the base (RESULTS 'Smelter block sized'). Contracted, not yet measured. 14 Oct 2026 | partly |
| Coal fleet | 39,692 MW in 2026 | Eskom integrated report FY2026, as at 31 Mar 2026 (SOURCES 'Kelvin power station') | sourced |
| Coal retirement | IRP 2025 Figure 3, 50-year line, ±250 MW: standing coal 32,433 MW in 2030 and 17,890 MW in 2040 in both c5 and c5b_14r (RESULTS 'c5 inputs, final') | Figure (plan p.12) digitised by Nick Hedley, 13 Oct 2026 (SOURCES 'Currently loaded'). Sensitivities: the 60-year line, and Meridian's ME IRP 2024 dates | partly |
| Coal operation | Coal-only EAF 65%; minimum stable level 0.5 on 16 coal rows | EAF from Eskom data, January–August 2026. The 0.5 is the project's own change to Meridian's data (SOURCES 'Values derived from Eskom's ESK19679'; 'UC_FLEET minimum stable level 0.5') | mixed |
| Carbon tax | 'kept2030': R46.00/t in 2026 rising to R61.31/t in 2030, then held. The full rate (R308–410/t) is a sensitivity (RESULTS 'Carbon in c5's optimiser', build 2026-10-14h) | Carbon Tax Act s5 rates. Allowance kept to 2030 per the 2025 Budget, as reported second-hand. Price neutrality not modelled (SOURCES 'Carbon tax in law'), 14 Oct 2026 | partly |
| Wind | Capex R28,462/kW in 2026, falling 2.86% a year; life 25 years; capacity factor 45.2%. Fixed O&M: c5 R693/kW-yr; c5b R392/kW-yr. c5 gives R848/MWh, or R971/MWh with grid cost (RESULTS 'c5 for the write-up') | Capex and c5b's O&M from BW6 bids (IPP Office note, 7 Nov 2025, January 2024 rands × 1.068); what the O&M bid includes is not defined. Decline from "BNEF", edition not recorded. c5's O&M "from NREL ATB", edition not recorded. Life: no source | partly |
| Utility solar | c5b_14r: single-axis tracking (its pathway file records pvTracking 1), at BW6 preferred bidders' tracker capex, R16,786/kW in 2026 (R15,715 in January 2024 rands × 1.068), falling 3.89% a year (R14,322 in 2030; read from the code on c5b_14r's settings, RESULTS 'Input checks'); tracking profile 28.7% over the twelve weather years. The R12,000/kW fixed-tilt figure is not used. Fixed O&M: c5 R396/kW-yr; c5b R287/kW-yr (BW6 bids, R269 in January 2024 rands) | Capex and c5b's O&M from BW6 bids (IPP Office note, 7 Nov 2025; capacity factor 30.1% stated for the tracker bids); what the bid capex includes is not defined. Decline rate: no source recorded | partly |
| New batteries | Lithium R3,425/kWh (R13,699/kW at 4 hours), falling 3% a year; 5% as a sensitivity (RESULTS 'Lithium on BESIPPPP bid window 3, aged') | BESIPPPP BW3 bids, aged; bid inclusions not published. Decline rate from NREL 2025, as given by the user (SOURCES 'Lithium capex decline'), 13 Oct 2026 | partly |
| Existing batteries | c5: 800 MW, no source. c5b: 68 MW / 292 MWh, the Eskom phase 1 sites operating at mid-2026 and end-2026 (Hex, Pongola, Elandskop) | Of phase 1's 199 MW, Skaapvlei, Paleisheuwel and Graafwater add nothing before 31 Mar 2027 (Minister's reply NW4150, PMG, 21 Sep 2026); Hex's operation (AfDB, 2 Mar 2026); 68 MW installed (AfDB, 1 Jul 2025) (RESULTS 'c5b build') | sourced |
| Gas | CCGT R34,965/kW, flat; central fuel R1,298 per MWh of electricity at 52% efficiency (HHV), January 2026 rands, flat to 2040 (LNG at 13.25% of Brent at USD 80, USD 11.74/MMBtu at the coast plus 0.25 regasification, at R16.50); the code's default R2,003/MWh is not used in c5b_14r (RESULTS 'Input checks'); terminal R354–707/kW-yr, with c5 at 530.5; 0.348 t CO2/MWh (RESULTS 'Gas price cases built') | GridLab, Sep 2025; search extracts; shipping is "the least-sourced input" (SOURCES 'Gas price cases'), 9 Oct 2026 | partly |
| LNG supply | One cargo = one floating storage unit, 170,000 m³ = 4.08 PJ. Reported after the run; not a constraint in the optimiser (RESULTS 'c5 for the write-up') | No source given for the unit size | unsourced |
| Diesel | R6,100/MWh fuel plus R70/MWh variable O&M; existing peakers 3,400 MW | Eskom realised R6,011/MWh in 2025/26 (Parliamentary reply NW1243, 7 May 2026). The 1.5% difference is unexplained (SOURCES 'Diesel fuel price') | partly |
| Discount rate | 8% real; 10% and 11.3% as sensitivities | IEA Cost of Capital Observatory 2025, about 6.5–10% real. IRP 2025 states 11.3%, real or nominal not said (RESULTS 'Deep decarbonisation: no offshore … discount rate sourced'), corrected 11 Oct 2026 | sourced |
| Grid cost | Integration R402/kW-yr. Wind spur R1,010/kW, charged once. No grid cost on connections freed by retired coal; in c5b only solar, storage and gas may use them, within the coal retired. c5b: up to 1,580 MW of Cape wind without the integration charge, output cut 4% (RESULTS 'c5 for the write-up'; 'c5b build') | Integration: TDP 2024 Table 4, R225bn for 46.9 GW (SOURCES 'Sources used for constants'). Spur: ITP Phase 1 line cost, unverified. Freed connections: a modelling choice made 7 Oct 2026; c5b's technology list follows Eskom's repowering pipeline (Engineering News, 17 Jun 2025). Cape allowance: NERSA approval of 29 Apr 2025 and NTCSA's GCCA update of 31 Oct 2025, as reported (Pinsent Masons, 1 Jul 2025; Cliffe Dekker Hofmeyr, 3 Dec 2025) | mixed |
| Imports and exports | Imports: 1,150 MW contract × 0.88 = 1,012 MW in every year (c5); c5b 1,066 MW. Exports: 745 MW, the level since Mozal closed; the IRP holds 11.0 TWh (RESULTS 'Smelter block sized') | Means from Eskom data. The IRP does not say what follows the Cahora Bassa contract, so s_noimp tests imports ending in 2030 | partly |
| Rooftop | 8,942 MW in 2026, plus 900 MW a year to 12.6 GW in 2040. Capex R17,000/kW falling 3.89% a year (RESULTS 'c5 result'; 'Rooftop in the two cost measures') | NTCSA private PV, August 2026, less 488 MW wheeled (SOURCES 'Notes that keep biting'). 900 MW a year matches IRP Table 1 to 2035; no source after 2035 or for the capex | partly |
| Operating reserve | 2,200 MW by product, after NTCSA's ASTR: instantaneous 650 MW peak / 850 off-peak; regulating 830 MW each way in 2026/27 rising to 1,140 by 2030/31; ten-minute 720 / 520 falling to 410 / 210; held from coal headroom and storage with energy behind it, decided with dispatch; held at 2030/31's level after 2031. Open-cycle plant and interruptible load are emergency reserve only (RESULTS 'ASTR reserve rule'; 'Storage reserve decided with dispatch') | NTCSA Ancillary Services Technical Requirements 2026/27–2030/31, Rev 1, 12 Jan 2026, pp. 6–12, as read by the author. Sustain times: instantaneous 10 minutes (ASTR p.6); regulating 60 and ten-minute 30 minutes borrowed from CAISO's rules for non-generator resources (2010) | partly |
| Avon and Dedisa | Run on their contracts until they end (Dedisa end-2030, Avon 20 July 2031): monthly daytime and evening-peak levels, nights zero, 899 GWh a year; fuel and CO2 at the diesel fleet's rates (RESULTS 'Avon and Dedisa as must-run to contract end') | Levels from Eskom data (ESK19679, January–August 2026); September–December are 2025's shape scaled to 2026's level, the author's choice | partly |
| Interruptible load | 1,000 MW, no annual energy cap; called after open-cycle plant, as the last resource before shedding, and to restore reserve once open-cycle is exhausted (RESULTS 'Interruptible load cap tried and withdrawn') | Eskom's certified instantaneous demand response, 1,014 MW (NREL, Demand Response at the Grid Edge, FY24). The order is the author's decision: the ASTR sets none (p.10) | partly |
| VoLL | Engine R9,530/MWh. Optimiser: stress-window shortfall at R87,000/MWh × 365 (RESULTS 'Load shedding now costed'; 'Both measures for every run') | Eskom's Cost of Load Shedding (NERSA review, 2022); the IRP's COUE of R87.85/kWh | sourced |
| Adequacy standard | Mean unserved energy at most half of 0.002% of customer demand: 2.19 GWh in 2030 and 2.78 GWh in 2040 for c5b_14r (c5: 2.08 and 2.66) (RESULTS 'Average system cost per MWh served'; 'c5b on build 2026-10-14r') | The 0.002% is the Australian NEM standard; halving it is the author's choice, 12 Oct 2026. South Africa has only a COUE (RESULTS 'South Africa has no reliability threshold') | partly |

Build limits in c5, which c5b_14r keeps (RESULTS 'c5 inputs, final'; 'Diagnosis, not deliverable'; 'c5b proposal'; SOURCES 'Tubatse pumped storage'):

- lithium at most 3 GW a year;
- wind at most 2.5 GW a year to 2030 and 3.5 GW a year after;
- new gas from 2030, at most 1,200 MW a year;
- pumped hydro: Tubatse only, 1,500 MW from 2038.

---

## 2. The 2025 replay and the benchmarks

Finding: the 2025 replay matches Eskom on energy. Coal is within about 1% of Eskom's 170.4 TWh. It does not reproduce how 2025 was operated: the model sheds 28–89 GWh against Eskom's 390 GWh and curtails nothing against about 1.0–1.6%. On c5b_14r's engine (14r) the benchmark suite passes 27 of 29 checks; the failures are the peaker seasonal ratio and pumped-storage output. One external check fails: EDMSA Scenario A CO2 in 2035.

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
- Pumped storage. On 14r the engine produces 3.3 TWh, just below the ±25% band around Eskom's 4.49 TWh (3.37–5.62). The cause is the reserve rule holding pumped-storage energy back for reserve: without that holdback the same run gives 4.97 TWh. It was 3.8 TWh on 14e, before the rule (RESULTS 'Every check moved by the reserve rule and the must-run'; 'Storage reserve decided with dispatch').

### Benchmark suite (validate_benchmarks)

This is a separate 2025 configuration, checked against Ember's monthly file (CC BY 4.0, released 7 Jul 2026; SOURCES 'Ember bulk data') and Eskom annual figures. It passed 27 of 28 checks on builds 14a and 14d, and passes 27 of 29 on 14r, the engine c5b_14r used (the pumped-storage check was added on 14e).

| Check | Model, 14d → 14r | Benchmark | Result on 14r |
|---|---|---|---|
| Coal | 165.57 → 166.64 TWh | Ember 171.26 ±6% | pass |
| Power-sector CO2 | 174.63 → 176.76 Mt | Ember 160.30 ±12% | pass |
| Grid generation | 214.4 → 216.3 TWh | 190–222 | pass |
| Coal capacity factor | 47.6 → 47.9% | 35–60% | pass |
| Surplus 2025 / 2026 | 2.4 / 5.0 → 1.6 / 4.2 GW | 1.2–4 / 4–8 | pass |
| Nuclear, wind, solar, hydro, imports | 10.21, 14.14, 7.11, 2.90, 6.61 TWh, unchanged | various | pass |
| Peaker season ratio | 9.3× → 1.8× | 2.15–8.6× (Eskom 4.3×) | fail |
| Pumped-storage output | 3.8 (14e) → 3.3 TWh | 3.37–5.62 (Eskom 4.49) | fail |

(RESULTS 'Engine fix (B) against the same pass marks', 14a; 'c5 inputs: the imports end year', 14d; 'Scenario switch and load timing', the 14r suite of 15 Oct)

The peaker ratio failed high on 14a–14d because engine (B) moved evening peaks onto pumped storage. On 14r it fails low: Avon and Dedisa's nearly flat contract output (now in the model) dilutes a small dispatched component, and the model's first-quarter 2025 shortage is too small (TODO 14eg). Neither band was widened (RESULTS 'Engine fix (B)'; 'Every check moved by the reserve rule and the must-run').

Two points to probe:

- CO2 sits 10.3% above Ember while coal sits 2.7% below (14r). SOURCES records the model's coal factor as 1.04 t/MWh, against 1.008 capacity-weighted in Meridian's fleet file (SOURCES 'Currently loaded').
- Hydro passes at 2.90 TWh, while RESULTS gives Eskom's 2025 hydro as 1.79 TWh. The reference behind the hydro check is not stated in these sources.

### External checks (validate_external)

| Check | Model | Published | Result |
|---|---|---|---|
| CSIR 2030 coal share | 50.9% (14r) | 55% ±6 | pass |
| CSIR 2030 renewable share | 43.3% (14r) | 40% ±8 | pass |
| EDMSA Scenario A wind 2035 (24.6 GW wind, 28 GW solar, 8 GW 4-hour storage, 4 GW CCGT) | 72.1 TWh (07s; passes on 14r) | 64 ±12 | pass |
| EDMSA Scenario A CO2 2035, same build | 83.3 Mt (14r; 88.4 on 07s) | 124 ±22 | fail, below the floor of 102 |
| CSIR least-cost capacity bands | inside | 2030 and 2050 ranges | pass |

(RESULTS 'New wind on the modern-turbine profile at 1.064', 07s, on the current-turbine profile decided for these checks; 'Cross-check against published least-cost work', 23z)

The EDMSA CO2 failure appears in every suite count recorded since 5 Oct. Its cause is only partly known. The September 2026 rebuild of the wind profile raised wind output about 11% (calibrated to Eskom measurement; EDMSA's is not) and moved the figure from -0.2 to -14.1 Mt, inside the band as widened that day; the check's own note adds that the earlier agreement was partly two models sharing a bias. By 1 Oct, the first build in the repository, it read 90.8 Mt (gap -33.2): the step past the band happened in September, in builds that cannot be re-run, and is not traced; so is the later fall to 83.3 Mt on 14r. It runs on the current-turbine profile, so the modern-turbine decision (7 Oct) does not touch it (RESULTS 'EDMSA Scenario A CO2 2035 (validate_external): already failing').

---

## 3. The PyPSA cross-check

Finding: on cost, the single-node engine is 1.2% above a single-node PyPSA unit-commitment optimum with 24 hours of sight on the 2026 baseline week, and 1.7–4.0% above it on three storage-heavy 2040 weeks (build 14a). Before the October engine fixes it was 30–48% above on those weeks, and it shed 37.3 GWh where PyPSA shed none. One problem remains. On 14d, the engine c5 used, the engine sheds in 6 of 15 stress weeks where the optimum does not (0.24–4.79 GWh), always in the week's last hour. The PyPSA side holds no operating reserve; the engine holds 2.2–2.5 GW.

Not re-run on 14r, the engine c5b_14r uses. Since 14d it holds operating reserve by product (ASTR), runs Avon and Dedisa on their contracts, calls 1,000 MW of interruptible load after open-cycle plant and restores reserve with open-cycle plant. None of these has a counterpart on the PyPSA side, which holds no reserve.

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

## 4. c5b_14r against IRP 2025 Table 1, and the sensitivities

Finding: c5b_14r is adequate after five passes, and the engine check passes in every year with no top-up. Engine PV is R2,393.5bn and CO2 is 1,991.9 Mt over 2026–40 (RESULTS 'c5b on build 2026-10-14r, the final base'). Against IRP Table 1 to 2040, c5b_14r builds:

- under half the IRP's wind (17.0 against 36.0 GW);
- more solar (36.9 against 25.5 GW);
- 20.2 GW / 93.9 GWh of lithium against 7.2 GW of IRP storage;
- under half the IRP's gas (8.1 GW: 7,152 MW CCGT, 673 MW open-cycle on LNG and 309 MW on diesel, against 17.3 GW);
- no nuclear and no pumped hydro.

Its CO2 is below the IRP's (150.2 against 168 Mt in 2030; 128.6 against 142 Mt in 2035), on a lower demand: c5b_14r serves 220.6 TWh of customer demand in 2030, while the IRP's 168 Mt goes with 255 TWh on its own basis.

| Year | Wind c5b_14r / IRP | Solar c5b_14r / IRP | Rooftop c5b_14r / IRP DG | Lithium c5b_14r MW / MWh | IRP storage MW | CCGT | Open-cycle LNG / diesel | IRP gas | IRP nuclear | Coal standing c5b_14r / IRP Fig 3 | CO2 Mt c5b_14r / IRP |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 2026 | 696 / 964 | 354 / 3,553 | - / 900 | 913 / 2,665 | 144 | - | - / - | - | - | 39,692 / 39,692 | 155.6 / – |
| 2027 | 190 / 2,847 | 255 / 2,886 | 900 / 900 | 1,329 / 4,316 | 150 | - | - / - | - | - | 39,692 / 39,692 | 165.5 / – |
| 2028 | - / 770 | 240 / 1,760 | 900 / 900 | 463 / 1,478 | 615 | - | - / - | - | - | 39,692 / 39,692 | 167.7 / – |
| 2029 | - / 760 | 2,994 / 1,314 | 900 / 900 | 1,776 / 5,234 | 2,615 | - | - / - | 3,000 | - | 37,027 / 37,064 | 163.1 / – |
| 2030 | 2,473 / 2,000 | 3,277 / 800 | 900 / 900 | 2,231 / 8,978 | 200 | 527 | 673 / 309 | 3,000 | - | 32,433 / 32,388 | 150.2 / 168 |
| 2031 | - / 2,500 | 3,506 / 1,000 | 900 / 900 | 330 / 5,501 | 200 | 826 | - / - | - | - | 30,876 / 30,839 | 146.6 / – |
| 2032 | - / 2,600 | 3,752 / 1,200 | 900 / 900 | 1,035 / 4,139 | 200 | 986 | - / - | 1,250 | - | 29,223 / 29,324 | 140.6 / – |
| 2033 | 1,476 / 2,600 | 1,872 / 1,400 | 900 / 900 | 1,310 / 5,239 | 200 | 484 | - / - | 1,250 | - | 28,121 / 27,886 | 135.0 / – |
| 2034 | 1,805 / 3,000 | 1,058 / 1,600 | 900 / 900 | 1,460 / 5,840 | 200 | 826 | - / - | 1,250 | - | 26,467 / 26,403 | 129.7 / – |
| 2035 | 853 / 3,000 | 617 / 2,000 | 900 / 900 | 825 / 3,301 | 200 | 548 | - / - | 1,000 | - | 25,916 / 26,029 | 128.6 / 142 |
| 2036 | 421 / 2,000 | 1,822 / 1,600 | 900 / - | 821 / 3,284 | 500 | 633 | - / - | 1,250 | 1,250 | 25,348 / 25,350 | 126.3 / – |
| 2037 | 2,339 / 3,000 | 3,741 / 1,600 | 900 / - | 1,986 / 7,945 | 500 | 383 | - / - | 1,500 | 1,250 | 23,658 / 23,415 | 114.1 / – |
| 2038 | 2,865 / 3,000 | 4,188 / 1,600 | 900 / - | 1,792 / 12,000 | 500 | 660 | - / - | 1,250 | 1,350 | 21,969 / 21,819 | 100.9 / – |
| 2039 | 2,050 / 3,500 | 4,781 / 1,600 | 900 / - | 2,078 / 12,000 | 500 | 745 | - / - | 1,250 | 1,350 | 19,661 / 19,825 | 88.9 / – |
| 2040 | 1,825 / 3,500 | 4,455 / 1,600 | 900 / - | 1,854 / 12,000 | 500 | 534 | - / - | 1,250 | - | 17,890 / 17,958 | 79.3 / – |
| Total | 16,993 / 36,041 | 36,912 / 25,513 | 12,600 / 9,000 | 20,203 / 93,920 | 7,224 | 7,152 | 673 / 309 | 17,250 | 5,200 | – | 1,991.9 / – |

Notes on the table:

- Build from c5b_14r's own output (the local reproduction at 6045387, whose solves carry GitHub's cache keys); CO2 from its engine check, re-run on 15 Oct on main and on the current build with byte-identical results, equal to GitHub's. Generated, not copied, from the run files and public_data/irp2025_extract.csv (Table 1, plan p.31; IRP CO2 from Figure 19, plan p.30). IRP coal standing is Figure 3's 50-year line as read by the author (harness/coal_dates_irp2025.json). New MW unless stated.
- "IRP storage" is Table 1's energy storage plus Eskom BESS, in MW only.
- The IRP adds 1,332 MW of pumped hydro in 2037; c5b_14r adds none. Rooftop is 900 MW a year in both to 2035; the IRP lists no distributed generation after 2035.
- c5b_14r retires no coal early. 1,580 MW of its wind is Cape wind without the integration charge (C below).
- Every year's mean unserved energy is below its target; the closest is 2037, at 71% of target (1.825 against 2.578 GWh).
- The optimiser's objective is R1,598.1bn, with no stress-target penalty. Without carbon tax payments, engine PV is R2,319.2bn: the payments are R7.2bn in 2026, R9.2bn in 2030 and R4.9bn in 2040, R74.2bn in present value (the same method as RESULTS 'c5's cost without carbon tax payments').

Caveats recorded with the comparison:

- The IRP's 2026–28 rows include build already under construction; c5b_14r holds only the committed floors (A below).
- Table 1 gives storage in MW only and does not split gas.
- On the IRP's own basis, c5b's 2030 demand reaches 255.5 TWh (RESULTS 'Smelter block sized'); the engine's 220.6 TWh is customer demand served, a different measure.

For comparison, c5 (build 14i) had engine PV R2,300.6bn and CO2 2,019 Mt (RESULTS 'c5 result'; 'c5 for the write-up'). Its full table is in RESULTS 'c5 for the write-up'.

### What c5b_14r changes from c5

Demand (RESULTS 'c5b demand inputs built'): September–December scaled at 0.9766 in place of 0.9519, a flat 930 MW smelter block from 2027, and imports at 1,066 MW. Build choices (RESULTS 'c5b proposal'; 'c5b build'):

- A. Committed projects as minimum builds: wind 696 MW in 2026 and 886 MW by 2027; solar 354, 609 and 849 MW by 2026, 2027 and 2028; batteries 360 MW / 1,440 MWh in 2026 and 666 MW / 2,664 MWh by 2027. Two solar projects without confirmed financial close are left to the optimiser.
- B. The existing battery fleet at 68 MW / 292 MWh (from 800 MW).
- C. Up to 1,580 MW of Cape wind without the integration charge, with a 4% output cut.
- D. Connections freed by retired coal for solar, storage and gas only.
- E. Fixed O&M at BW6's bids: wind R392 and solar R287/kW-yr.

Engine and optimiser (builds 14m–14r; section 1 and limitations 17–18): operating reserve by product after NTCSA's ASTR; Avon and Dedisa run on their contracts; interruptible load at 1,000 MW, called after open-cycle plant; open-cycle plant restores reserve. c5b_14r needed five passes: 2030 failed the loop's adequacy test until the tail-day stress margin reached 3,000 MW.

### The sensitivities: provisional until you have read them

Each run takes c5b_14r's settings, makes one change, and runs up to three passes from c5b_14r's stress windows. The reference is a null run made the same way with no change (R2,388.4bn engine PV, 1,996.7 Mt, objective R1,591.6bn), not c5b_14r itself, which needed a 3,000 MW stress margin that a seeded run starts without. Engine PV is at 8% real with any adequacy top-up. The objective is the optimiser's, without its stress-target penalty, which was zero in every run. Every figure below is generated from the run outputs (RESULTS 'PROVISIONAL until the reviewer has read them: c5b_14r sensitivities').

| Run | Change from c5b_14r | Engine PV vs null, R bn | CO2 2026–40 vs null, Mt | Objective vs null, R bn | Same direction |
|---|---|---|---|---|---|
| s_carbonfull | Carbon tax at the full statutory rate | +364.5 | -273.3 | +396.5 | yes |
| s_disc113 | Discount rate 11.3% | +147.7 | +109.2 | not comparable (a) | not judged |
| s_irpgas | IRP 2025's gas plan | +130.8 | +162.8 | +104.5 | yes |
| s_disc10 | Discount rate 10% | +89.5 | +67.7 | not comparable (a) | not judged |
| s_be6 | Lithium capped at 550 MW a year from 2026 | +71.0 | +117.4 | +69.0 | yes |
| s_detgas | Determined gas: 3,000 MW by 2030 (IRP 2019 section 34) plus 5,000 MW in 2031–37 (GN 8021), additional on our reading | +38.8 | +69.5 | +16.0 | yes |
| s_roof2 | Rooftop 2,000 MW a year (top-up 250 MW) | +34.8 | -22.5 | +25.3 | yes |
| s_noimp | No imports after 2030 | +31.6 | +9.3 | +65.9 | yes |
| s_be7 | IRP nuclear forced: 1,250 MW in 2036–37, 1,350 MW in 2038–39 | +31.2 | -0.9 | -55.6 | no (b) |
| s_nogas4strict | No new gas or diesel open-cycle; lithium up to 4 GW a year | +27.9 (c) | -568.0 | +89.5 | yes |
| s_be4 | 51% minimum capacity factor on new CCGT | +21.0 | -33.0 | +7.4 | yes |
| s_coalme | Coal on Meridian's ME IRP 2024 dates | +14.9 | -60.0 | +34.3 | yes |
| s_pvirp | Solar capped by year at Table 1 | +12.7 | +41.8 | +17.3 | yes |
| s_gasprem | Gas capital at a 1.5-point finance premium | +5.3 | -30.4 | +9.9 | yes |
| s_committed | Committed gas (1,200 MW a year 2030–33, 200 MW in 2034) and lithium minimums | +1.9 | +10.3 | +1.9 | yes |
| s_cape10 | 3,470 MW of Cape wind at 10% curtailment | +1.6 | +1.8 | +1.4 | yes |
| s_li8h | Lithium energy cap at 8 hours instead of 4 | not quoted (d) | | | no |
| s_batt5 | Lithium capex falling 5% a year instead of 3% | -8.8 | -21.3 | -11.7 | yes |
| s_windlow | Low wind cost case | -10.0 | -190.5 | -49.8 | yes |
| s_coal60 | Coal on Figure 3's 60-year line | -14.5 | +88.1 | -30.6 | yes |
| s_gmcv2029 | Smelter block 930 MW to 2028, 675 MW in 2029, 493 MW from 2030 | -31.8 | -10.9 | -35.5 | yes |
| s_measured | No smelter block (measured demand only) | -79.1 | -52.9 | -85.3 | yes |

(a) The objective is at the run's own discount rate, not comparable with the null's at 8%; engine PV, at 8%, is.
(b) Forced nuclear's capital is not in the objective, so the objective falls by the energy the nuclear displaces; the engine, which carries the capital, puts s_be7 above the null. Structural.
(c) With a top-up of 1,500 MW of diesel open-cycle. Quoted as: does not meet the adequacy standard from 2034 without new peaking plant; the cheapest fix is 1,500 MW of diesel open-cycle by 2037, about +R28bn. The top-up itself is R8.7bn of that; diesel open-cycle is excluded in this run, so the top-up prices the gap rather than being a build the run allows.
(d) No material effect: both measures within R0.5bn of the null (engine +0.4, objective -0.1), in opposite directions.

What the author takes from the table (RESULTS, as above):

- Pass mark 5, set before the runs: the two cost measures move the same way on 18 of the 20 comparable runs. The exceptions are s_be7 and s_li8h (notes b and d).
- Determined gas costs +R16–39bn against least cost (objective +R16.0bn, engine +R38.8bn). The IRP's gas beyond the determinations accounts for about R90bn of s_irpgas's premium (engine R91.9bn, objective R88.5bn).
- Every run's engine check is below target in every year except s_nogas4strict (2034–40) and s_roof2 (2038, by 0.0036 GWh, topped up).

---

## 5. Known limitations

Finding: the material limits are structural. The plan is chosen on one node with sampled days. Its adequacy is judged by a heuristic engine that is close to an optimum in ordinary weeks but not at the end of stress weeks. Several inputs that drive the build are unsourced or rest on readings of IRP figures.

Structure

1. Single node. There is no internal transmission, so the model cannot produce local curtailment, and in c5 it let Cape-quality wind connect where Mpumalanga coal retired (c5b_14r bars wind from freed connections; limitation 10). The regional optimiser still keeps a daily storage balance, so none of its results is published (RESULTS header, third caveat; 'c5 for the write-up').
2. Representative days and stress windows. On c4's 2040 build, lithium cycles 374 times a year in the optimiser against 119 in the engine. In c4's 2030 stress windows the optimiser planned on coal the engine commits less of: 14.0–15.8 GW committed against 16.7–17.1 GW available (RESULTS 'Both measures for every run'; '14de re-check').
3. The engine is both the cost measure and the judge of adequacy. Its cost is an upper bound, and it still sheds in stress weeks where a 24-hour optimum does not (section 3).
4. No inertia or system-strength requirement in the build. The optimiser never pays for synchronous condensers or grid-forming batteries, which flatters renewable-heavy results, the no-gas case most. The engine enforces a 6 GW synchronous minimum and the optimiser does not. That floor (unsourced) that raises coal output when coal is there; once coal is gone the shortfall is counted but costs nothing, gas plant does not count towards it, and 30% of battery power counts as grid-forming at no extra cost (RESULTS 'Known limitation: no inertia or system-strength requirement').
5. Weather. Single runs, preset figures and most suite checks use one year of hourly shapes; the pathway engine check behind every c-run's adequacy verdict and engine PV, the loop's adequacy test and its stress windows use twelve weather years, 2014–2025 (RESULTS header, corrected 14 Oct 2026). The optimiser's representative days come from the one year.

Inputs

6. Demand basis. Domestic demand fell about 1.9 GW in mid-2025, mostly from suspended ferrochrome smelters. c5 counted that step twice for September–December. The 930 MW block is contracted, not measured: about 0.5 GW was back by mid-2026, and Glencore-Merafe's agreement ends in May 2029. The IRP gives 255 TWh both "in 2030" and "by 2029", and the author has set the target to 2030 (RESULTS 'Demand checks before rebasing'; 'Smelter block sized').
7. The ESRG workbook dates from September 2024 and is not confirmed as the plan's final forecast.
8. IRP figure readings. Coal is the author's digitisation of Figure 3 (±250 MW). The IRP's 2024 demand was read visually from Figure 2, which is still to be read properly. The IRP's peak forecast was not found.
9. Wind cost. Capex comes from bids in a window that awarded no wind. O&M has no recorded edition. Life is unsourced. c5's 2026 wind cost is about 35% above BW5's average tariff, or 55% with grid cost (RESULTS 'c5 for the write-up').
10. Freed coal connections carry no grid cost. In c5 this was worth R9.95bn of the objective to wind; c5b bars wind from them, and the credit for solar, storage and gas remains a modelling choice (RESULTS 'c5b proposal').
11. LNG cargo caveat. From 2034, c5 burns more than one cargo in 14 days in 10 of 33 stress-window years. The worst 14 days of each year exceed one cargo every year from 2031 and reach 4.02 cargoes in 2040. So the plan assumes resupply within a two-week stress event (RESULTS 'c5 for the write-up'). Not recomputed for c5b_14r, which builds less open-cycle gas on LNG (673 MW against c5's 748) and less CCGT (7,152 against 7,522 MW).
12. Battery fleet. c5 ran with 800 MW of existing batteries, which had no source; c5b uses the sourced 68 MW / 292 MWh.
13. Coal operation. The 0.5 minimum stable level is unsourced, and Kelvin sits inside the scaled 39,692 MW (SOURCES 'Kelvin power station').
14. Imports continue after 2030 because the IRP is silent. The IRP ties Mozal's exit to an end of Cahora Bassa supply, which the 2026 data does not show.
15. Carbon. Allowances rest on second-hand reporting, and price neutrality is not modelled.
16. Licences. PyPSA-RSA data is AGPL v3 but listed as MIT in the project's licence file. Use of NTCSA's GCCA data is not clearly permitted. Both are pending (SOURCES 'PyPSA-RSA: licence'; 'NTCSA GCCA 2025 data').
17. Avon and Dedisa. Since build 14p these two IPP open-cycle plants (1,005 MW) run on their contracts until they end (Dedisa end-2030, Avon 20 July 2031): monthly daytime and evening-peak levels from Eskom's January–August 2026 data, 899 GWh a year, with fuel and CO2 counted. c5 and earlier runs left this out, which understated their cost by about R6.6bn a year and their CO2 by 0.8–1.2 Mt a year to 2031. What remains: September–December use 2025's seasonal shape scaled to 2026's level (the author's choice), and night running is left out (4.5% of 2026's energy) (RESULTS 'Avon and Dedisa as must-run to contract end').
18. Reserve rule. Since build 14m the engine and the optimiser hold the 2,200 MW operating reserve by product, following NTCSA's ASTR 2026/27–2030/31; open-cycle plant and interruptible load count only as emergency reserve. What remains: the sustain times for regulating (60 minutes) and ten-minute reserve (30 minutes) are borrowed from CAISO; the requirement is held at 2030/31's level after 2031 (the document's last year), which understates it in the high-renewable years; interruptible load (1,000 MW) is called after open-cycle plant by the author's decision, since the ASTR sets no order; and holding pumped-storage energy for reserve takes 2025 pumped-storage output to 3.3 TWh, below the benchmark band (section 2) (RESULTS 'ASTR reserve rule'; 'Storage reserve decided with dispatch'; 'Interruptible load cap tried and withdrawn').
19. Perfect foresight in dispatch. The engine's look-aheads read the run's own future demand, wind and solar: 48 hours for batteries and pumped storage (engine fix (B)), 24 hours for coal commitment, 12 hours for coal ramping, a week for long-duration stores. Coal outages are held at the current hour's state rather than foreseen. A real operator works from forecasts with error, so the engine tends to understate operating cost, peaker and diesel use, shortfall and unserved energy, and to overstate what storage can do, most in renewable-heavy years. The PyPSA cross-check uses the same foresight, so it cannot catch this. Not changed; measuring it needs forecasts with realistic error, which the ten-day outlook (TODO 14ea) would supply (RESULTS 'Known limitation: the engine's look-aheads read the actual future').
20. No emissions compliance cost on coal running past 2030. Eskom told the NCOP select committee on 10 June 2025 that full compliance with the Minimum Emission Standards would need about R257bn of capital plus R6.3bn a year, and its recommended plan R77bn plus R2.1bn a year (sulphur dioxide at Kusile and Medupi; particulates and nitrogen oxides at six stations) (PMG; Sunday Independent/IOL, 21 June 2025). Medupi's flue-gas desulphurisation alone is estimated at R41.7bn (Eskom's FY2026 integrated report, as reported by Business Day, 2 September 2026). The model charges none of this, so coal kept past 2030 looks cheaper than it is, and s_coal60's saving (R14.5bn of engine PV against the null) excludes it. The rand year of Eskom's figures is not stated. A sensitivity is being built (COMPLY, TODO 14em).
21. New gas deliverability. The optimiser can build CCGT and open-cycle gas from 2030 at its stated capex. Wood Mackenzie (1 April 2026, as reported by Power Engineering and Utility Dive) expects turbine prices near USD 600/kW by end-2027, nearly triple 2019, with lead times of about six years and order books sold through 2027. New gas from 2030 may not be deliverable on those lead times, and its capex may be understated; neither is modelled (SOURCES 'Gas turbine supply').

---

## 6. Four questions for the reviewer

Each can be answered from this pack in 30–40 minutes. Each is tied to a decision the model rests on.

1. Is the engine fit to judge adequacy?

   Decision: whether c5b's adequacy verdicts and top-ups come from the engine, or wait for a reserve-holding optimum.

   Evidence: on 14a and 14d the engine is within 1.2–4.1% of a 24-hour PyPSA optimum on cost. It sheds in 6 of 15 stress weeks where the optimum does not, always in the last hour, with storage empty and 2.2–2.5 GW of coal held as reserve that PyPSA does not hold. The comparison has not been re-run on 14r, the engine c5b_14r uses (section 3).

   Question: would you accept the verdicts on this evidence? If not, which one further test would you require?

2. Should contracted smelter load be in the central case?

   Decision: whether c5b's central case carries the flat 930 MW block, or uses the measured base and keeps the block as a sensitivity (s_measured).

   Evidence: with the block, 2030 reaches 255.5 TWh on the IRP's basis; without it, about 247 TWh. Only about 0.5 GW was visibly back by mid-2026.

   Question: in a central planning case, would you include industrial load that is contracted but not yet measured?

3. What grid and O&M cost should new wind carry on one node?

   Decision: taken for c5b (C, D and E above); the reviewer's view decides whether it stays.

   Evidence: c5's new wind costs R848–971/MWh, 35–55% above BW5. 95% of it sits on free freed-coal connections. O&M accounts for about R76–82/MWh of the gap.

   Question: without geography, would you charge wind the full integration cost everywhere, keep the freed-connection credit, or adopt the proposal as written?

4. Should LNG resupply constrain the optimiser?

   Decision: whether c5b limits stress-window gas burn to one floating storage unit per 14 days.

   Evidence: from 2034, 10 of 33 window-years exceed one cargo, and the worst 14 days reach 4.02 cargoes in 2040.

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
