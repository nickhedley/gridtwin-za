# GridTwin ZA – reviewer pack

Draft for an outside energy modeller, 14 October 2026. Prepared from the project's results log (RESULTS.md), its source register (SOURCES.md) and the validation/ folder. Nothing was re-run for this pack.

## What this is and how to read it

GridTwin ZA is a South African power-system model by Nick Hedley. It has two parts:

- an hourly dispatch engine that simulates a year on one national node, with coal unit commitment, outage draws and twelve weather years (2014–2025);
- a build optimiser, a linear programme that chooses new capacity each year to 2040 on representative days plus 14-day stress windows.

The two run in a loop. The engine checks each year of the optimiser's plan against an adequacy target, and any year that fails adds stress windows to the next pass.

The central run reviewed here is c5, build 2026-10-14i (commit a74d581). Its replacement, c5b, was approved by the author on 14 Oct and its inputs are built (build 2026-10-14l); it has not yet been solved.

How to read the pack:

- Each section leads with its finding.
- Sources are given in brackets: a RESULTS entry, named by the start of its heading, or a SOURCES section. The full headings are listed at the end.
- Rands are 2026 rands. PV means present value at 8% real from 2026. "Engine PV" is the engine check's system cost over 2026–40.
- Some constants and annual totals come from Eskom's hourly datasets (ESK19679, ESK19243), which were obtained on request. Eskom is credited for the data, and the analysis is the author's, not Eskom's. No hourly or per-unit Eskom values appear here.
- With two to three hours, read sections 1 and 5 first, skim 2 to 4, and spend the remaining time on section 6.

---

## 1. Assumptions

Finding: of 20 rows, 5 are fully sourced and 11 partly sourced. Two are unsourced: the utility solar capex actually used in c5, and the LNG cargo size. Two rows mix a sourced value with an unsourced one: coal operation, where the minimum stable level is unsourced, and grid cost, where the free connection on retired-coal sites is a modelling choice.

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
| Coal retirement | IRP 2025 Figure 3, 50-year line, ±250 MW: c5 standing coal 32,433 MW in 2030 and 17,890 MW in 2040 (RESULTS 'c5 inputs, final') | Figure (plan p.12) digitised by Nick Hedley, 13 Oct 2026 (SOURCES 'Currently loaded'). Sensitivities: the 60-year line, and Meridian's ME IRP 2024 dates | partly |
| Coal operation | Coal-only EAF 65%; minimum stable level 0.5 on 16 coal rows | EAF from Eskom data, January–August 2026. The 0.5 is the project's own change to Meridian's data (SOURCES 'Values derived from Eskom's ESK19679'; 'UC_FLEET minimum stable level 0.5') | mixed |
| Carbon tax | 'kept2030': R46.00/t in 2026 rising to R61.31/t in 2030, then held. The full rate (R308–410/t) is a sensitivity (RESULTS 'Carbon in c5's optimiser', build 2026-10-14h) | Carbon Tax Act s5 rates. Allowance kept to 2030 per the 2025 Budget, as reported second-hand. Price neutrality not modelled (SOURCES 'Carbon tax in law'), 14 Oct 2026 | partly |
| Wind | Capex R28,462/kW in 2026, falling 2.86% a year; life 25 years; capacity factor 45.2%. Fixed O&M: c5 R693/kW-yr; c5b R392/kW-yr. c5 gives R848/MWh, or R971/MWh with grid cost (RESULTS 'c5 for the write-up') | Capex and c5b's O&M from BW6 bids (IPP Office note, 7 Nov 2025, January 2024 rands × 1.068); what the O&M bid includes is not defined. Decline from "BNEF", edition not recorded. c5's O&M "from NREL ATB", edition not recorded. Life: no source | partly |
| Utility solar | Capex used in c5 not stated in RESULTS or SOURCES. On record: R12,000/kW, "no recorded source" (SOURCES 'Optimiser grid cost'), and BW6 preferred bidders R15,715/kW in January 2024 (SOURCES 'Build costs from South African bid data'). Decline 3.89% a year; c5 builds tracking solar. Fixed O&M: c5 R396/kW-yr; c5b R287/kW-yr (BW6 bids, R269 in January 2024 rands) | – | unsourced |
| New batteries | Lithium R3,425/kWh (R13,699/kW at 4 hours), falling 3% a year; 5% as a sensitivity (RESULTS 'Lithium on BESIPPPP bid window 3, aged') | BESIPPPP BW3 bids, aged; bid inclusions not published. Decline rate from NREL 2025, as given by the user (SOURCES 'Lithium capex decline'), 13 Oct 2026 | partly |
| Existing batteries | c5: 800 MW, no source. c5b: 68 MW / 292 MWh, the Eskom phase 1 sites operating at mid-2026 and end-2026 (Hex, Pongola, Elandskop) | Of phase 1's 199 MW, Skaapvlei, Paleisheuwel and Graafwater add nothing before 31 Mar 2027 (Minister's reply NW4150, PMG, 21 Sep 2026); Hex's operation (AfDB, 2 Mar 2026); 68 MW installed (AfDB, 1 Jul 2025) (RESULTS 'c5b build') | sourced |
| Gas | CCGT R34,965/kW, flat; central fuel R1,298/MWh (LNG at 13.25% of Brent at USD 80); terminal R354–707/kW-yr, with c5 at 530.5; 0.348 t CO2/MWh (RESULTS 'Gas price cases built') | GridLab, Sep 2025; search extracts; shipping is "the least-sourced input" (SOURCES 'Gas price cases'), 9 Oct 2026 | partly |
| LNG supply | One cargo = one floating storage unit, 170,000 m³ = 4.08 PJ. Reported after the run; not a constraint in the optimiser (RESULTS 'c5 for the write-up') | No source given for the unit size | unsourced |
| Diesel | R6,100/MWh fuel plus R70/MWh variable O&M; existing peakers 3,400 MW | Eskom realised R6,011/MWh in 2025/26 (Parliamentary reply NW1243, 7 May 2026). The 1.5% difference is unexplained (SOURCES 'Diesel fuel price') | partly |
| Discount rate | 8% real; 10% and 11.3% as sensitivities | IEA Cost of Capital Observatory 2025, about 6.5–10% real. IRP 2025 states 11.3%, real or nominal not said (RESULTS 'Deep decarbonisation: no offshore … discount rate sourced'), corrected 11 Oct 2026 | sourced |
| Grid cost | Integration R402/kW-yr. Wind spur R1,010/kW, charged once. No grid cost on connections freed by retired coal; in c5b only solar, storage and gas may use them, within the coal retired. c5b: up to 1,580 MW of Cape wind without the integration charge, output cut 4% (RESULTS 'c5 for the write-up'; 'c5b build') | Integration: TDP 2024 Table 4, R225bn for 46.9 GW (SOURCES 'Sources used for constants'). Spur: ITP Phase 1 line cost, unverified. Freed connections: a modelling choice made 7 Oct 2026; c5b's technology list follows Eskom's repowering pipeline (Engineering News, 17 Jun 2025). Cape allowance: NERSA approval of 29 Apr 2025 and NTCSA's GCCA update of 31 Oct 2025, as reported (Pinsent Masons, 1 Jul 2025; Cliffe Dekker Hofmeyr, 3 Dec 2025) | mixed |
| Imports and exports | Imports: 1,150 MW contract × 0.88 = 1,012 MW in every year (c5); c5b 1,066 MW. Exports: 745 MW, the level since Mozal closed; the IRP holds 11.0 TWh (RESULTS 'Smelter block sized') | Means from Eskom data. The IRP does not say what follows the Cahora Bassa contract, so s_noimp tests imports ending in 2030 | partly |
| Rooftop | 8,942 MW in 2026, plus 900 MW a year to 12.6 GW in 2040. Capex R17,000/kW falling 3.89% a year (RESULTS 'c5 result'; 'Rooftop in the two cost measures') | NTCSA private PV, August 2026, less 488 MW wheeled (SOURCES 'Notes that keep biting'). 900 MW a year matches IRP Table 1 to 2035; no source after 2035 or for the capex | partly |
| VoLL | Engine R9,530/MWh. Optimiser: stress-window shortfall at R87,000/MWh × 365 (RESULTS 'Load shedding now costed'; 'Both measures for every run') | Eskom's Cost of Load Shedding (NERSA review, 2022); the IRP's COUE of R87.85/kWh | sourced |
| Adequacy standard | Mean unserved energy at most half of 0.002% of customer demand: 2.08 GWh in 2030 and 2.66 GWh in 2040 for c5 (RESULTS 'Average system cost per MWh served'; 'c5 result') | The 0.002% is the Australian NEM standard; halving it is the author's choice, 12 Oct 2026. South Africa has only a COUE (RESULTS 'South Africa has no reliability threshold') | partly |

Build limits in c5 (RESULTS 'c5 inputs, final'; 'Diagnosis, not deliverable'; SOURCES 'Tubatse pumped storage'):

- lithium at most 3 GW a year;
- wind at most 2.5 GW a year to 2030 and 3.5 GW a year after;
- new gas from 2030, at most 1,200 MW a year;
- pumped hydro: Tubatse only, 1,500 MW from 2038.

---

## 2. The 2025 replay and the benchmarks

Finding: the 2025 replay matches Eskom on energy. Coal is within about 1% of Eskom's 170.4 TWh. It does not reproduce how 2025 was operated: the model sheds 28–89 GWh against Eskom's 390 GWh and curtails nothing against about 1.0–1.6%. The benchmark suite passes 27 of 28 checks, the failure being the peaker seasonal ratio. One external check fails: EDMSA Scenario A CO2 in 2035.

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
- Pumped storage. The current engine produces 3.8 TWh, inside a ±25% band around Eskom's 4.49 TWh (RESULTS 'Checks after engine (B) and 14dr', 14e).

### Benchmark suite (validate_benchmarks)

This is a separate 2025 configuration, checked against Ember's monthly file (CC BY 4.0, released 7 Jul 2026; SOURCES 'Ember bulk data') and Eskom annual figures. It passes 27 of 28 checks on builds 14a and 14d.

| Check | Model, 14a → 14d | Benchmark | Result |
|---|---|---|---|
| Coal | 165.22 → 165.57 TWh | Ember 171.26 ±6% | pass |
| Power-sector CO2 | 174.41 → 174.63 Mt | Ember 160.30 ±12% | pass |
| Grid generation | 214.2 → 214.4 TWh | 190–222 | pass |
| Coal capacity factor | 47.5 → 47.6% | 35–60% | pass |
| Surplus 2025 / 2026 | 2.4 / 5.0 GW (14d) | 1.2–4 / 4–8 | pass |
| Nuclear, wind, solar, hydro, imports | 10.21, 14.14, 7.11, 2.90, 6.61 TWh | various | pass |
| Peaker season ratio | 9.3× | 2.15–8.6× (Eskom 4.3×) | fail |

(RESULTS 'Engine fix (B) against the same pass marks', 14a; 'c5 inputs: the imports end year', 14d)

The peaker ratio fails because engine (B) moved evening peaks onto pumped storage. The band was not widened (RESULTS 'Engine fix (B)').

Two points to probe:

- CO2 sits 8.9% above Ember while coal sits 3.3% below. SOURCES records the model's coal factor as 1.04 t/MWh, against 1.008 capacity-weighted in Meridian's fleet file (SOURCES 'Currently loaded').
- Hydro passes at 2.90 TWh, while RESULTS gives Eskom's 2025 hydro as 1.79 TWh. The reference behind the hydro check is not stated in these sources.

### External checks (validate_external)

| Check | Model | Published | Result |
|---|---|---|---|
| CSIR 2030 coal share | 50.5% | 55% ±6 | pass |
| CSIR 2030 renewable share | 43.8% | 40% ±8 | pass |
| EDMSA Scenario A wind 2035 (24.6 GW wind, 28 GW solar, 8 GW 4-hour storage, 4 GW CCGT) | 72.1 TWh | 64 ±12 | pass |
| EDMSA Scenario A CO2 2035, same build | 88.4 Mt | 124 ±22 | fail, below the floor of 102 |
| CSIR least-cost capacity bands | inside | 2030 and 2050 ranges | pass |

(RESULTS 'New wind on the modern-turbine profile at 1.064', 07s, on the current-turbine profile decided for these checks; 'Cross-check against published least-cost work', 23z)

The EDMSA CO2 failure appears in every suite count recorded from 5 Oct to 14 Oct. No cause and no value on the c5 engine is recorded.

---

## 3. The PyPSA cross-check

Finding: on cost, the single-node engine is 1.2% above a single-node PyPSA unit-commitment optimum with 24 hours of sight on the 2026 baseline week, and 1.7–4.0% above it on three storage-heavy 2040 weeks (build 14a). Before the October engine fixes it was 30–48% above on those weeks, and it shed 37.3 GWh where PyPSA shed none. One problem remains. On the engine c5 uses, the engine sheds in 6 of 15 stress weeks where the optimum does not (0.24–4.79 GWh), always in the week's last hour. The PyPSA side holds no operating reserve; the engine holds 2.2–2.5 GW.

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

## 4. c5 against IRP 2025 Table 1 – c5 shown; to be replaced by c5b when it has run

Finding: c5 is adequate in every year with no top-up. Engine PV is R2,300.6bn and CO2 is 2,019 Mt over 2026–40 (RESULTS 'c5 result', 14i). Against IRP Table 1 to 2040, c5 builds:

- a third of the IRP's wind (12.9 against 36.0 GW);
- more solar (34.8 against 25.5 GW);
- 17.6 GW of lithium against 7.2 GW of IRP storage;
- about half the IRP's gas (9.0 against 17.3 GW);
- no nuclear and no pumped hydro.

Its CO2 is below the IRP's (155.5 against 168 Mt in 2030; 131.1 against 142 Mt in 2035), but on a demand about 15 TWh (6%) lower.

| Year | Wind c5 / IRP | Solar c5 / IRP | Lithium c5 GW / GWh | IRP storage | Gas c5 / IRP | IRP nuclear | Coal c5 / IRP Fig 3 | CO2 Mt c5 / IRP |
|---|---|---|---|---|---|---|---|---|
| 2026 | – / 964 | – / 3,553 | 0 / 0 | 144 | – / – | – | 39,692 / 39,692 | 157.3 / – |
| 2027 | – / 2,847 | – / 2,886 | 0 / 0 | 150 | – / – | – | 39,692 / 39,692 | 160.2 / – |
| 2028 | – / 770 | – / 1,760 | 0 / 0 | 615 | – / – | – | 39,692 / 39,692 | 163.0 / – |
| 2029 | – / 760 | 2,665 / 1,314 | 1.27 / 5.1 | 2,615 | – / 3,000 | – | 37,027 / 37,064 | 159.2 / – |
| 2030 | – / 2,000 | 3,277 / 800 | 2.24 / 9.0 | 200 | 1,965 / 3,000 | – | 32,433 / 32,388 | 155.5 / 168 |
| 2031 | – / 2,500 | 3,506 / 1,000 | 1.24 / 4.9 | 200 | 965 / – | – | 30,876 / 30,839 | 151.4 / – |
| 2032 | 601 / 2,600 | 3,752 / 1,200 | 1.25 / 5.0 | 200 | 772 / 1,250 | – | 29,223 / 29,324 | 142.9 / – |
| 2033 | 1,102 / 2,600 | 1,256 / 1,400 | 1.12 / 4.5 | 200 | 670 / 1,250 | – | 28,121 / 27,886 | 139.8 / – |
| 2034 | 1,946 / 3,000 | 1,053 / 1,600 | 1.53 / 6.1 | 200 | 751 / 1,250 | – | 26,467 / 26,403 | 133.8 / – |
| 2035 | 1,385 / 3,000 | 584 / 2,000 | 1.03 / 4.1 | 200 | 341 / 1,000 | – | 25,916 / 26,029 | 131.1 / 142 |
| 2036 | 1,028 / 2,000 | 2,023 / 1,600 | 1.07 / 4.3 | 500 | 386 / 1,250 | 1,250 | 25,348 / 25,350 | 126.7 / – |
| 2037 | 1,600 / 3,000 | 4,161 / 1,600 | 1.76 / 10.2 | 500 | 611 / 1,500 | 1,250 | 23,658 / 23,415 | 115.5 / – |
| 2038 | 1,690 / 3,000 | 4,419 / 1,600 | 1.84 / 12.0 | 500 | 613 / 1,250 | 1,350 | 21,969 / 21,819 | 104.8 / – |
| 2039 | 2,308 / 3,500 | 4,048 / 1,600 | 1.66 / 12.0 | 500 | 1,161 / 1,250 | 1,350 | 19,661 / 19,825 | 92.8 / – |
| 2040 | 1,197 / 3,500 | 4,088 / 1,600 | 1.59 / 12.0 | 500 | 800 / 1,250 | – | 17,890 / 17,958 | 84.8 / – |
| Total | 12,857 / 36,041 | 34,832 / 25,513 | 17.60 / 89.2 | 7,224 | 9,035 / 17,250 | 5,200 | – | 2,019 / – |

Notes on the table:

- Source: RESULTS 'c5 for the write-up'. IRP values are from Table 1 (plan p.31) and Figure 19 (plan p.30). New MW unless stated.
- c5's gas is mostly CCGT (7,522 MW). It also builds 748 MW of OCGT on LNG and 765 MW of diesel open-cycle, both in 2030.
- Rooftop is 900 MW a year in both, from 2027.
- The IRP adds 1,332 MW of pumped hydro in 2037; c5 adds none.
- c5 retires no coal early.

Caveats recorded with the comparison:

- c5 holds no committed pipeline, and its 2026 wind and solar fleet is below the IRP's end-2025 base. Its zeros in 2026–28 are therefore choices made on a smaller base.
- Table 1 gives storage in MW only and does not split gas.
- On the IRP's basis, c5's 2030 demand is 239.9 TWh against 255 TWh. The 15.1 TWh gap is 4.5 TWh of exports and 10.6 TWh of lower domestic demand (RESULTS 'c5 demand against IRP 2025'). With c5b's demand changes, 2030 reaches 255.5 TWh (RESULTS 'Smelter block sized').
- 95% of c5's new wind sits on connections freed by retired coal and pays no grid cost.
- Without carbon tax payments, engine PV is R2,225.6bn (RESULTS 'c5's cost without carbon tax payments').

### What c5b changes (approved 14 Oct, built in 14l, not yet run)

c5b keeps c5's settings and adds the 930 MW smelter block and imports at 1,066 MW (RESULTS 'c5b demand inputs built'), plus (RESULTS 'c5b proposal'; 'c5b build'):

- A. Committed projects as minimum builds: wind 696 MW in 2026 and 886 MW by 2027; solar 354, 609 and 849 MW by 2026, 2027 and 2028; batteries 360 MW / 1,440 MWh in 2026 and 666 MW / 2,664 MWh by 2027. Two solar projects without confirmed financial close are left to the optimiser.
- B. The existing battery fleet at 68 MW / 292 MWh (from 800 MW).
- C. Up to 1,580 MW of Cape wind without the integration charge, with a 4% output cut.
- D. Connections freed by retired coal for solar, storage and gas only.
- E. Fixed O&M at BW6's bids: wind R392 and solar R287/kW-yr.

### The sensitivities (not quoted)

All 18 c5 sensitivities have been run. At the author's instruction their results are not quoted here, and all 18 will be rerun against c5b. Each takes c5's settings, makes one change and runs one pass from c5's stress windows (RESULTS 'Not to be quoted (user, 14 Oct; to be rerun against c5b)').

| Run | Setting changed from c5 |
|---|---|
| s_be7 | IRP nuclear forced: 1,250 MW in 2036–37, 1,350 MW in 2038–39 |
| s_nogas4strict | No new gas or diesel open-cycle; lithium up to 4 GW a year (one scenario, three values) |
| s_coal60 | Coal on Figure 3's 60-year line |
| s_irpgas | IRP 2025's gas plan (one scenario, six values) |
| s_pvirp | Solar capped by year at Table 1 |
| s_windlow | Low wind cost case |
| s_roof2 | Rooftop 2,000 MW a year |
| s_li8h | Lithium energy cap at 8 hours instead of 4 |
| s_be4 | 51% minimum capacity factor on new CCGT |
| s_be6 | Lithium capped at 550 MW a year from 2026 |
| s_committed | Committed gas and lithium minimums, 2030–34 |
| s_gasprem | Gas capital at a 1.5-point finance premium |
| s_disc10 | Discount rate 10% |
| s_disc113 | Discount rate 11.3% |
| s_noimp | No imports after 2030 |
| s_carbonfull | Carbon tax at the full rate |
| s_coalme | Coal on Meridian's ME IRP 2024 dates |
| s_batt5 | Lithium capex falling 5% a year |

Three further runs are proposed alongside c5b: s_gmcv2029, s_measured (no smelter block) and s_cape10 (3,470 MW of Cape wind at 10% curtailment).

---

## 5. Known limitations

Finding: the material limits are structural. The plan is chosen on one node with sampled days. Its adequacy is judged by a heuristic engine that is close to an optimum in ordinary weeks but not at the end of stress weeks. Several inputs that drive the build are unsourced or rest on readings of IRP figures.

Structure

1. Single node. There is no internal transmission, so the model cannot produce local curtailment, and it lets Cape-quality wind connect where Mpumalanga coal retired. The regional optimiser still keeps a daily storage balance, so none of its results is published (RESULTS header, third caveat; 'c5 for the write-up').
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
11. LNG cargo caveat. From 2034, c5 burns more than one cargo in 14 days in 10 of 33 stress-window years. The worst 14 days of each year exceed one cargo every year from 2031 and reach 4.02 cargoes in 2040. So the plan assumes resupply within a two-week stress event (RESULTS 'c5 for the write-up').
12. Battery fleet. c5 ran with 800 MW of existing batteries, which had no source; c5b uses the sourced 68 MW / 292 MWh.
13. Coal operation. The 0.5 minimum stable level is unsourced, and Kelvin sits inside the scaled 39,692 MW (SOURCES 'Kelvin power station').
14. Imports continue after 2030 because the IRP is silent. The IRP ties Mozal's exit to an end of Cahora Bassa supply, which the 2026 data does not show.
15. Carbon. Allowances rest on second-hand reporting, and price neutrality is not modelled.
16. Licences. PyPSA-RSA data is AGPL v3 but listed as MIT in the project's licence file. Use of NTCSA's GCCA data is not clearly permitted. Both are pending (SOURCES 'PyPSA-RSA: licence'; 'NTCSA GCCA 2025 data').
17. Avon and Dedisa's running is left out. These two IPP open-cycle plants (1,005 MW, on 15-year contracts to 2030-31) ran in about 6,300 hours a year in 2024-25 and produced 1.46-1.51 TWh a year; 1.07 TWh a year on the pace of January-August 2026. The model holds them as reserve and runs its whole open-cycle fleet for 0.014 TWh in 2026. At the model's own diesel price this is about R6.6bn a year (R9.0-9.3bn on 2024-25 volumes) and 0.8-1.2 Mt of CO2. It is common to every scenario, so it cancels in every comparison between runs, but every run's absolute cost and 2026-31 CO2 is understated by it (about R30bn of present value to 2031). No change before the note (RESULTS 'Known limitation: Avon and Dedisa's running is not in the model').
18. Reserve rule. The engine lets open-cycle plant and pumped storage (6.1 GW) cover the 2.2 GW operating reserve at full power, so coal holds none back and open-cycle plant runs only when nothing else meets load: in 2026 c5b's engine runs it for 10 GWh in January-August against 88 GWh from Eskom's own turbines, with scarcity in 96 hours against Eskom's 348 hours of interruptible supply. The engine has no rule for Eskom's reserve-restoring interruptible product. With coal carrying the whole reserve instead, the engine overshoots and 2026 fails adequacy; Eskom sits between the two. The base rule understates early-year open-cycle running and flatters early-year adequacy. This is being fixed in the base by product, following NTCSA's ASTR 2026/27-2030/31; on c5b's 2026 the product rule calls interruptible load in 248 hours against Eskom's 348, and c5b and its sensitivities rerun on it once approved (RESULTS 'ASTR reserve rule').
19. Perfect foresight in dispatch. The engine's look-aheads read the run's own future demand, wind and solar: 48 hours for batteries and pumped storage (engine fix (B)), 24 hours for coal commitment, 12 hours for coal ramping, a week for long-duration stores. Coal outages are held at the current hour's state rather than foreseen. A real operator works from forecasts with error, so the engine tends to understate operating cost, peaker and diesel use, shortfall and unserved energy, and to overstate what storage can do, most in renewable-heavy years. The PyPSA cross-check uses the same foresight, so it cannot catch this. Not changed; measuring it needs forecasts with realistic error, which the ten-day outlook (TODO 14ea) would supply (RESULTS 'Known limitation: the engine's look-aheads read the actual future').

---

## 6. Four questions for the reviewer

Each can be answered from this pack in 30–40 minutes. Each is tied to a decision the model rests on.

1. Is the engine fit to judge adequacy?

   Decision: whether c5b's adequacy verdicts and top-ups come from the engine, or wait for a reserve-holding optimum.

   Evidence: the engine is within 1.2–4.1% of a 24-hour PyPSA optimum on cost. It sheds in 6 of 15 stress weeks where the optimum does not, always in the last hour, with storage empty and 2.2–2.5 GW of coal held as reserve that PyPSA does not hold.

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
- Not to be quoted (user, 14 Oct; to be rerun against c5b) … (setting changes only)
- 14de re-check …, 14 Oct 2026
- Checks after engine (B) and 14dr …, 14 Oct 2026
