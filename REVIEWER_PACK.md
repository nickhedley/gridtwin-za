# GridTwin ZA – reviewer pack

Draft for an outside energy modeller, 14 October 2026; refreshed on 15 October on c5b_14r, on 16 October on c5d and on 17 October on the central run, c5e. Prepared from the project's results log (RESULTS.md), its source register (SOURCES.md) and the validation/ folder. No run was made for this refresh: c5e's figures are its own run and engine check, and its engine's suite.

## What this is and how to read it

GridTwin ZA is a South African power-system model by Nick Hedley. It has two parts:

- an hourly dispatch engine that simulates a year on one national node, with coal unit commitment, outage draws and twelve weather years (2014–2025);
- a build optimiser, a linear programme that chooses new capacity each year to 2040 on representative days plus 14-day stress windows.

The two run in a loop. The engine checks each year of the optimiser's plan against an adequacy target, and any year that fails adds stress windows to the next pass.

The central run reviewed here is c5e: c5d's settings on build 2026-10-16h, with new wind and solar capex backed out of their awarded tariffs at the capacity factors each runs at, so each costs its tariff per MWh (RESULTS 'New central c5e'). The author chose this basis on 16 October after the third draft's s_tariffcf, whose build c5e equals in every variable. c5e replaces c5d (build 2026-10-16a), which the third draft reviewed, and c5b_14r (build 2026-10-14r) and c5 (build 2026-10-14i) before it. Its engine is c5d's: build 16h changes only the capex basis (RESULTS 'Build 2026-10-16h'). c5d's engine differs from c5b_14r's: from build 2026-10-15e pumped storage's reserve is counted once and spare gas charges the existing stores ahead of a forecast shortfall. Sections 2, 3, 5 and 6 were written on c5b_14r, so each figure in them is c5e's where its run outputs or its engine's checks have it, and is otherwise labelled as c5d's, c5b_14r's (engine build 14r) or c5's. The sensitivity results in section 4 are provisional until you have read them.

How to read the pack:

- Each section leads with its finding.
- Sources are given in brackets: a RESULTS entry, named by the start of its heading, or a SOURCES section. The full headings are listed at the end.
- Rands are 2026 rands. PV means present value at 8% real from 2026. "Engine PV" is the engine check's system cost over 2026–40.
- Some constants and annual totals come from Eskom's hourly datasets (ESK19679, ESK19243), which were obtained on request. Eskom is credited for the data, and the analysis is the author's, not Eskom's. No hourly or per-unit Eskom values appear here.
- With two to three hours, read sections 1 and 5 first, skim 2 to 4, and spend the remaining time on section 6.

---

## 1. Assumptions

Finding: of 24 rows, 5 are fully sourced and 15 partly sourced. Two are unsourced: the LNG cargo size, and the 10% planning reserve margin, which is off from c5d on and is sensitivity s_prm10. Two rows mix a sourced value with an unsourced one: coal operation, where the minimum stable level is unsourced, and grid cost, where the free connection on retired-coal sites is a modelling choice.

Status key:

- Sourced: a named, dated source supports the value as used.
- Partly: the source is second-hand, approximate, or covers only part of the value.
- Unsourced: no source is recorded.

| Assumption | Value used | Source and date | Status |
|---|---|---|---|
| Demand growth | `DEMAND=irp_esrg`: the growth in UCT ESRG's IRP reference forecast (IRPDemandREF), applied to the measured 2026 base. 2030 index 1.101384 (RESULTS 'c5 demand against IRP 2025') | ESRG workbook, ZivaHub doi:10.25375/uct.26942134. Unchanged since September 2024, before the IRP draft and plan. No source names it as the plan's moderate forecast (RESULTS 'Demand checks before rebasing'), 14 Oct 2026 | partly |
| Demand base, 2026 | c5: 200.62 TWh, which is calendar 2025 domestic demand × 0.9519 with rooftop added back. c5b_14r, c5d and c5e: September–December scaled at 0.9766 instead, giving 203.03 TWh (RESULTS 'c5b demand inputs built', build 2026-10-14k) | Constants derived from Eskom data. The 0.9519 counted the 2025 step twice for September–December, about 2.4 TWh (RESULTS 'Demand checks before rebasing'). Fix decided 14 Oct 2026 | sourced |
| Returning smelter load (c5b_14r, c5d and c5e) | Flat 930 MW block from 2027. Sensitivity s_gmcv2029: 675 MW in 2029, 493 MW from 2030 (RESULTS 'c5b demand inputs built') | Contracted 12.8 TWh a year (1.46 GW) at 80% take-or-pay = 1.17 GW, less 0.24 GW already in the base (RESULTS 'Smelter block sized'). Contracted, not yet measured. 14 Oct 2026 | partly |
| Coal fleet | 39,692 MW in 2026 | Eskom integrated report FY2026, as at 31 Mar 2026 (SOURCES 'Kelvin power station') | sourced |
| Coal retirement | IRP 2025 Figure 3, 50-year line, ±250 MW: standing coal 32,433 MW in 2030 and 17,890 MW in 2040 in both c5 and c5b_14r (RESULTS 'c5 inputs, final') | Figure (plan p.12) digitised by Nick Hedley, 13 Oct 2026 (SOURCES 'Currently loaded'). Sensitivities: the 60-year line, and Meridian's ME IRP 2024 dates | partly |
| Coal operation | Coal-only EAF 65%; minimum stable level 0.5 on 16 coal rows | EAF from Eskom data, January–August 2026. The 0.5 is the project's own change to Meridian's data (SOURCES 'Values derived from Eskom's ESK19679'; 'UC_FLEET minimum stable level 0.5') | mixed |
| Carbon tax | 'kept2030': R46.00/t in 2026 rising to R61.31/t in 2030, then held. The full rate (R308–410/t) is a sensitivity (RESULTS 'Carbon in c5's optimiser', build 2026-10-14h) | Carbon Tax Act s5 rates. Allowance kept to 2030 per the 2025 Budget, as reported second-hand. Price neutrality not modelled (SOURCES 'Carbon tax in law'), 14 Oct 2026 | partly |
| Wind | c5e: capex R20,879/kW in 2026, the capex BW5's awarded tariff implies (weighted average R495.22/MWh, April 2021 rands, indexed) at the 42.5% capacity factor new wind runs at, with BW6 wind bids' fixed O&M, over 25 years at 8% real; falling 2.86% a year. So new wind costs BW5's tariff in 2026 rands, R630.6/MWh, at 8% real before grid charges (RESULTS 'Build 2026-10-16h'). New wind runs on the modern-turbine profile without correction: 42.5% over the twelve weather years; Meridian's 2020 range is 35–45%, best estimate 40% (SOURCES 'Meridian Economics'). Fixed O&M R392/kW-yr (BW6 bids). c5d backed the capex out at BW6 wind bids' 37.24% instead: R17,773/kW, R552.4/MWh, 0.876 of the tariff (RESULTS 'Reviewer pack on c5d'). Sensitivities: BW6 bids' R28,462/kW (s_bw6capex); the 1.064 correction to 45.2% (s_wind1064) and BW6 bids' 37.2% (s_wind372), both holding c5e's capex (RESULTS 'New central c5e') | BW5 tariff: DMRE media statement, 28 Oct 2021, 12 projects; BW6 bids: IPP Office note, 7 Nov 2025, January 2024 rands × 1.068; what the O&M bid includes is not defined. The low end of the evidence (user, message 126 (2)). Capacity-factor basis chosen by the user, 16 Oct 2026 (message 161). Decline from "BNEF", edition not recorded. Life: no source | partly |
| Utility solar | c5e: single-axis tracking at R11,038/kW in 2026, the capex the MW-weighted mean of BW7's 18 solar awards implies (R492.53/MWh over 3,940 MW, January 2024 rands, indexed) at the 28.7% capacity factor new tracking solar runs at, with BW6 tracker bids' fixed O&M, over its life at 8% real; falling 3.89% a year, 43% lower by 2040 (for reference, Meridian's 2020 path has wind and solar levelised cost about a third lower by 2040; Figure 1, p.v, on NREL ATB 2019 learning). So new solar costs BW7's tariff in 2026 rands, R526.1/MWh, at 8% real before grid charges (RESULTS 'Build 2026-10-16h'). Tracking profile 28.7% over the twelve weather years; Meridian's 2020 range for solar PV is 22–26%, best estimate 24%, tracking or fixed not stated. Fixed O&M R287/kW-yr (BW6 bids, R269 in January 2024 rands). c5d backed the capex out at BW6 tracker bids' 30.13% instead: R11,755/kW, R552.8/MWh, 1.051 of the tariff (RESULTS 'Reviewer pack on c5d'). Sensitivity: BW6 tracker bids' R16,786/kW (s_bw6capex) (RESULTS 'New central c5e') | BW7 awards (BW7_SOLAR_AWARDS, eight of December 2024 and others, as recorded); BW6 bids: IPP Office note, 7 Nov 2025; what the bid capex includes is not defined. Capacity-factor basis chosen by the user, 16 Oct 2026 (message 161). Decline rate: no source recorded; Meridian's path is a reference, not a source for it | partly |
| New batteries | Lithium R3,425/kWh (R13,699/kW at 4 hours), falling 3% a year; 5% as a sensitivity (RESULTS 'Lithium on BESIPPPP bid window 3, aged') | BESIPPPP BW3 bids, aged; bid inclusions not published. Decline rate from NREL 2025, as given by the user (SOURCES 'Lithium capex decline'), 13 Oct 2026 | partly |
| Existing batteries | c5: 800 MW, no source. c5b_14r, c5d and c5e: 68 MW / 292 MWh, the Eskom phase 1 sites operating at mid-2026 and end-2026 (Hex, Pongola, Elandskop) | Of phase 1's 199 MW, Skaapvlei, Paleisheuwel and Graafwater add nothing before 31 Mar 2027 (Minister's reply NW4150, PMG, 21 Sep 2026); Hex's operation (AfDB, 2 Mar 2026); 68 MW installed (AfDB, 1 Jul 2025) (RESULTS 'c5b build') | sourced |
| Gas | CCGT R34,965/kW, flat; central fuel R1,298 per MWh of electricity at 52% efficiency (HHV), January 2026 rands, flat to 2040 (LNG at 13.25% of Brent at USD 80, USD 11.74/MMBtu at the coast plus 0.25 regasification, at R16.50); the code's default R2,003/MWh is not used in c5b_14r, c5d or c5e (RESULTS 'Input checks'); terminal R354–707/kW-yr, with c5 at 530.5; 0.348 t CO2/MWh (RESULTS 'Gas price cases built') | GridLab, Sep 2025; search extracts; shipping is "the least-sourced input" (SOURCES 'Gas price cases'), 9 Oct 2026 | partly |
| LNG supply | One cargo = one floating storage unit, 170,000 m³ = 4.08 PJ. Reported after the run; not a constraint in the optimiser (RESULTS 'c5 for the write-up') | No source given for the unit size | unsourced |
| Diesel | R6,100/MWh fuel plus R70/MWh variable O&M; existing peakers 3,400 MW | Eskom realised R6,011/MWh in 2025/26 (Parliamentary reply NW1243, 7 May 2026). The 1.5% difference is unexplained (SOURCES 'Diesel fuel price') | partly |
| Discount rate | 8% real; 10% and 11.3% as sensitivities | IEA Cost of Capital Observatory 2025, about 6.5–10% real. IRP 2025 states 11.3%, real or nominal not said (RESULTS 'Deep decarbonisation: no offshore … discount rate sourced'), corrected 11 Oct 2026 | sourced |
| Grid cost | Integration R402/kW-yr. Wind spur R1,010/kW, charged once. No grid cost on connections freed by retired coal; in c5b_14r, c5d and c5e only solar, storage and gas may use them, within the coal retired. c5b_14r, c5d and c5e: up to 1,580 MW of Cape wind without the integration charge, output cut 4% (RESULTS 'c5 for the write-up'; 'c5b build') | Integration: TDP 2024 Rev 2 Table 4, generation integration plus land pro rata, 51.1% of the five-year R112.5bn, applied to the decade's R440bn: R225bn for 46.9 GW (SOURCES 'Sources used for constants'). Recomputed 15 Oct from the rounded figures: R403/kW-yr against R402, a rounding difference; the five-year share applied to ten years is our assumption; not yet re-read from the primary PDF, so the page and Rev 1's figures are pending. It pays for shared upstream network; BW6 capex likely carries only the dedicated connection, so in principle the two do not overlap (RESULTS 'Wind diagnostics on c5b_14r'). Spur: ITP Phase 1 line cost, unverified. Freed connections: a modelling choice made 7 Oct 2026; the technology list c5b_14r, c5d and c5e use follows Eskom's repowering pipeline (Engineering News, 17 Jun 2025). Cape allowance: NERSA approval of 29 Apr 2025 and NTCSA's GCCA update of 31 Oct 2025, as reported (Pinsent Masons, 1 Jul 2025; Cliffe Dekker Hofmeyr, 3 Dec 2025) | mixed |
| Imports and exports | Imports: 1,150 MW contract × 0.88 = 1,012 MW in every year (c5); c5b_14r, c5d and c5e 1,066 MW. Exports: 745 MW, the level since Mozal closed; the IRP holds 11.0 TWh (RESULTS 'Smelter block sized') | Means from Eskom data. The IRP does not say what follows the Cahora Bassa contract, so s_noimp tests imports ending in 2030 | partly |
| Rooftop | 8,942 MW in 2026, plus 900 MW a year to 12.6 GW in 2040. Capex R17,000/kW falling 3.89% a year (RESULTS 'c5 result'; 'Rooftop in the two cost measures') | NTCSA private PV, August 2026, less 488 MW wheeled (SOURCES 'Notes that keep biting'). 900 MW a year matches IRP Table 1 to 2035; no source after 2035 or for the capex | partly |
| Operating reserve | 2,200 MW by product, after NTCSA's ASTR: instantaneous 650 MW peak / 850 off-peak; regulating 830 MW each way in 2026/27 rising to 1,140 by 2030/31; ten-minute 720 / 520 falling to 410 / 210; held from coal headroom and storage with energy behind it, decided with dispatch; held at 2030/31's level after 2031. Open-cycle plant and interruptible load are emergency reserve only (RESULTS 'ASTR reserve rule'; 'Storage reserve decided with dispatch') | NTCSA Ancillary Services Technical Requirements 2026/27–2030/31, Rev 1, 12 Jan 2026, pp. 6–12, as read by the author. Sustain times: instantaneous 10 minutes (ASTR p.6); regulating 60 and ten-minute 30 minutes borrowed from CAISO's rules for non-generator resources (2010) | partly |
| Avon and Dedisa | Run on their contracts until they end (Dedisa end-2030, Avon 20 July 2031): monthly daytime and evening-peak levels, nights zero, 899 GWh a year; fuel and CO2 at the diesel fleet's rates (RESULTS 'Avon and Dedisa as must-run to contract end') | Levels from Eskom data (ESK19679, January–August 2026); September–December are 2025's shape scaled to 2026's level, the author's choice | partly |
| Interruptible load | 1,000 MW, no annual energy cap; called after open-cycle plant, as the last resource before shedding, and to restore reserve once open-cycle is exhausted. In the 2025 replay it is called for 87.1 GWh, against Eskom's 69.5 GWh of interruptible load (ILS) in 2025 (section 2) (RESULTS 'Interruptible load cap tried and withdrawn'; 'The 2025 replay against Eskom's 2025 like for like') | Eskom's certified instantaneous demand response, 1,014 MW (NREL, Demand Response at the Grid Edge, FY24). The order is the author's decision: the ASTR sets none (p.10) | partly |
| VoLL | Engine R9,530/MWh. Optimiser: stress-window shortfall at R87,000/MWh × 365 (RESULTS 'Load shedding now costed'; 'Both measures for every run') | Eskom's Cost of Load Shedding (NERSA review, 2022); the IRP's COUE of R87.85/kWh | sourced |
| Planning reserve margin (build LP) | Off in c5d and c5e (from build 2026-10-16a, FIXED.bldPlanMarginPct 0): adequacy is set by the engine's probabilistic standard alone (next row). Sensitivity s_prm10 restores the 10% margin: each year, firm capacity at least 1.10 × the peak hour of the represented days, wind and solar counting zero, every store at the lesser of its power and its energy over 4 hours. It bound in c5c in every year 2030–40 and set the firm capacity built (RESULTS 'Planning reserve margin in the build LP'; 'New central c5d') | No source for 10%: a modelling choice in the code since 1 Oct 2026, not South Africa's criterion. Turned off by the user, 16 Oct 2026 (message 133) | unsourced (sensitivity only) |
| Adequacy standard | Mean unserved energy at most half of 0.002% of customer demand: 2.19 GWh in 2030 and 2.78 GWh in 2040 for c5e and c5d, as for c5b_14r (c5: 2.08 and 2.66) (RESULTS 'Average system cost per MWh served'; 'New central c5e') | The 0.002% is the Australian NEM standard; halving it is the author's choice, 12 Oct 2026. NTCSA's Medium-Term System Adequacy Outlook 2025–2029 deems adequacy met below 20 GWh of unserved energy a year and a 6% open-cycle capacity factor (search extracts, 16 Oct 2026; SOURCES 'Adequacy criteria'); the model's standard is about eight times stricter on unserved energy. IRP 2025 states no numeric criterion | partly |

Build limits in c5, which c5b_14r, c5d and c5e keep (RESULTS 'c5 inputs, final'; 'Diagnosis, not deliverable'; 'c5b proposal'; SOURCES 'Tubatse pumped storage'):

- lithium at most 3 GW a year;
- wind at most 2.5 GW a year to 2030 and 3.5 GW a year after;
- new gas from 2030, at most 1,200 MW a year;
- pumped hydro: Tubatse only, 1,500 MW from 2038.

c5e connects 15.5 GW of new wind and utility solar in 2026–30. NTCSA's stated programme for 2024–30 is 16.2 GW: 13 GW of new renewables through transformer upgrades plus 3.2 GW from the first private transmission tender by August 2029. At least 1.3 GW connected in 2024–25, so c5e's early build is above it. (GreenCape MIR 2026, p.20, citing NTCSA 2024; 2024–25 connections: NERSA via SolarQuarter, 10 Apr 2026; SOLA's Selemela 2 and 3 project pages; Mainstream, 23 Aug 2025; Sibanye-Stillwater, 1 Apr 2025, for Castle; Sasol, 10 Oct 2024, for Msenge Emoyeni; GEM, September 2026 release, for Springbok; RESULTS 'c5e's new wind and solar against NTCSA's connection programme')

---

## 2. The 2025 replay and the benchmarks

Finding: the 2025 replay matches Eskom on energy. Coal is within about 1% of Eskom's 170.4 TWh. It does not reproduce how 2025 was operated: on c5e's engine (build 16h) it sheds 4.3 GWh and calls 87.1 GWh of interruptible load, against Eskom's 390.0 GWh of manual load reduction and 69.5 GWh of interruptible load (ILS), and it curtails nothing against about 1.0–1.6%. On c5e's engine, as on c5d's (16c, the same values), the benchmark suite passes 28 of 29 checks; the one failure is the peaker seasonal ratio. On c5b_14r's engine (14r) it passed 27 of 29, with pumped-storage output also failing. One external check fails on every engine: EDMSA Scenario A CO2 in 2035.

The adequacy caveat, carried beside every adequacy verdict from the engine in this pack (RESULTS 'The 2025 replay against Eskom's 2025 like for like'): "2025 replay (16h): 91.4 GWh shed or interrupted (4.3 shed plus 87.1 interruptible load); 76.4 GWh with interruptible load capped at Eskom's 69.5 GWh (6.9 shed), against Eskom's 459.5 GWh in 2025 (390.0 manual load reduction plus 69.5 interruptible load, ILS; IOS left out). ESK19679 totals."

### The '2025, as modelled' preset

The preset runs the 2025 fleet, 2025 demand (194.62 TWh domestic), exports of 1,705 MW, 2025's drought hydro and 58.4% coal availability.

| 2025, TWh | Eskom (author's analysis) | Model, build 03c | Model, build 04a/12e | Model, build 16h (c5e's engine) |
|---|---|---|---|---|
| Coal | 170.4 | 168.9 | 168.6 | 168.9 |
| Imports / hydro | 6.57 / 1.79 | 6.57 / 1.79 | – | – |
| Diesel peakers | 3.36 | 2.32 | 2.25 | 2.56 |
| Pumped storage | 4.49 | 2.67 | 2.32 (12e) | 4.01 |
| Shed, GWh | 390 (manual load reduction) | 17.6 | 28.3 (hourly coal trace) | 4.3 |
| Interruptible load called, GWh | 69.5 (ILS) | – | – | 87.1 |

(RESULTS 'The backcast gap, re-measured', 03c; 'Backcast 2025 now runs 2025's own demand', 04a; 'Preset inventory at build 2026-10-12e'; 'Fixed presets and the 2025 replay', 12e and 16h, the page run; 'The 2025 replay against Eskom's 2025 like for like')

Where the replay falls short:

- Shedding. On 12e, once the hourly coal trace was taken out of the public repository, the preset shed 67.0 GWh at its own seed and 88.5 GWh on average over 20 seeds (range 5.6–134); monthly availability factors did not help (RESULTS 'Retiring the coal availability trace', 12e). Run as the page runs it, the replay sheds 28.3 GWh on 12e and 4.3 GWh on 16h. Switched off one at a time on 16h, interruptible load (from 14r) would add 27.3 GWh and Avon and Dedisa's must-run 4.3 GWh; the reserve rule adds 1.7 GWh. With interruptible load capped at Eskom's 69.5 GWh for the year it sheds 6.9 GWh (RESULTS 'Fixed presets and the 2025 replay'; 'The 2025 replay against Eskom's 2025 like for like').
- Why. The model sheds only to cover a shortfall in the hour. Eskom also shed to refill pumped storage and diesel for the week ahead, against reserve targets it does not publish (RESULTS 'The backcast gap, re-measured'). Holding the peakers to 1.4 GW took modelled shedding to 131 GWh (RESULTS 'The 2025 backcast decomposed', 22ak).
- Curtailment. The model curtails none, against about 1.0–1.6%. That range is derived from NERSA's deemed-energy payments, since NERSA gives no GWh figure. No system-wide mechanism the author tried reproduces it, and local grid limits, which a single node cannot see, are the explanation on record. A flat 1.3% stopgap stands in (RESULTS 'Curtailment re-based on 2025'; 'A coal operating floor does not reproduce 2025's curtailment either').
- Pumped storage. On c5d's and c5e's engine (16c and 16h) the benchmark configuration produces 3.6 TWh, inside the ±25% band around Eskom's 4.49 TWh (3.37–5.62) (RESULTS 'Reviewer pack on c5d'), and the 2025 page run 4.01 TWh (RESULTS 'Fixed presets and the 2025 replay'). On c5b_14r's engine (14r) it produced 3.3 TWh, just below the band: the reserve rule held pumped-storage energy back for reserve, and without that holdback the same run gave 4.97 TWh. It was 3.8 TWh on 14e, before the rule (RESULTS 'Every check moved by the reserve rule and the must-run'; 'Storage reserve decided with dispatch').

### Benchmark suite (validate_benchmarks)

This is a separate 2025 configuration, checked against Ember's monthly file (CC BY 4.0, released 7 Jul 2026; SOURCES 'Ember bulk data') and Eskom annual figures. It passed 27 of 28 checks on builds 14a and 14d, 27 of 29 on 14r, the engine c5b_14r used (the pumped-storage check was added on 14e), and 28 of 29 on 16c, whose engine is c5d's, and on 16h, c5e's, with the same values.

| Check | Model, 14d → 14r (c5b_14r's engine) | Model, 16c and 16h (c5d's and c5e's engine) | Benchmark | Result on 14r / 16c and 16h |
|---|---|---|---|---|
| Coal | 165.57 → 166.64 TWh | 166.83 TWh | Ember 171.26 ±6% | pass / pass |
| Power-sector CO2 | 174.63 → 176.76 Mt | 176.87 Mt | Ember 160.30 ±12% | pass / pass |
| Grid generation | 214.4 → 216.3 TWh | 216.7 TWh | 190–222 | pass / pass |
| Coal capacity factor | 47.6 → 47.9% | 48.0% | 35–60% | pass / pass |
| Surplus 2025 / 2026 | 2.4 / 5.0 → 1.6 / 4.2 GW | 1.6 / 4.2 GW | 1.2–4 / 4–8 | pass / pass |
| Nuclear, wind, solar, hydro, imports | 10.21, 14.14, 7.11, 2.90, 6.61 TWh, unchanged | the same | various | pass / pass |
| Peaker season ratio | 9.3× → 1.8× | 1.7× | 2.15–8.6× (Eskom 4.3×) | fail / fail |
| Pumped-storage output | 3.8 (14e) → 3.3 TWh | 3.6 TWh | 3.37–5.62 (Eskom 4.49) | fail / pass |

(RESULTS 'Engine fix (B) against the same pass marks', 14a; 'c5 inputs: the imports end year', 14d; 'Scenario switch and load timing', the 14r suite of 15 Oct; 'Reviewer pack on c5d', the 16c suite of 16 Oct; the 16h suite of 16 Oct, the same values (RESULTS 'Build 2026-10-16h'))

The peaker ratio failed high on 14a–14d because engine (B) moved evening peaks onto pumped storage. On 14r, 16c and 16h it fails low: Avon and Dedisa's nearly flat contract output (now in the model) dilutes a small dispatched component, and the model's first-quarter 2025 shortage is too small (TODO 14eg). Neither band was widened (RESULTS 'Engine fix (B)'; 'Every check moved by the reserve rule and the must-run').

Two points to probe:

- CO2 sits 10.3% above Ember while coal sits 2.6% below (16c and 16h, c5d's and c5e's engine; 2.7% below on 14r). SOURCES records the model's coal factor as 1.04 t/MWh, against 1.008 capacity-weighted in Meridian's fleet file (SOURCES 'Currently loaded').
- Hydro passes at 2.90 TWh, while RESULTS gives Eskom's 2025 hydro as 1.79 TWh. The reference behind the hydro check is not stated in these sources.

### External checks (validate_external)

| Check | Model | Published | Result |
|---|---|---|---|
| CSIR 2030 coal share | 50.9% (14r, 16c and 16h) | 55% ±6 | pass |
| CSIR 2030 renewable share | 43.3% (14r, 16c and 16h) | 40% ±8 | pass |
| EDMSA Scenario A wind 2035 (24.6 GW wind, 28 GW solar, 8 GW 4-hour storage, 4 GW CCGT) | 72.1 TWh (07s; passes on 14r, 16c and 16h) | 64 ±12 | pass |
| EDMSA Scenario A CO2 2035, same build | 83.3 Mt (14r, 16c and 16h; 88.4 on 07s) | 124 ±22 | fail, below the floor of 102 |
| CSIR least-cost capacity bands | inside | 2030 and 2050 ranges | pass |

(RESULTS 'New wind on the modern-turbine profile at 1.064', 07s, on the current-turbine profile decided for these checks; 'Cross-check against published least-cost work', 23z)

The EDMSA CO2 failure appears in every suite count recorded since 5 Oct. Its cause is only partly known. The September 2026 rebuild of the wind profile raised wind output about 11% (calibrated to Eskom measurement; EDMSA's is not) and moved the figure from -0.2 to -14.1 Mt, inside the band as widened that day; the check's own note adds that the earlier agreement was partly two models sharing a bias. By 1 Oct, the first build in the repository, it read 90.8 Mt (gap -33.2): the step past the band happened in September, in builds that cannot be re-run, and is not traced; so is the later fall to 83.3 Mt on 14r, unchanged on 16c and 16h. It runs on the current-turbine profile, so the modern-turbine decision (7 Oct) does not touch it (RESULTS 'EDMSA Scenario A CO2 2035 (validate_external): already failing').

---

## 3. The PyPSA cross-check

Every figure in this section is c5b_14r's, on engine build 14r. The cross-check has not been re-run on c5d's engine, which c5e shares.

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

## 4. c5e against IRP 2025 Table 1, and the sensitivities

Finding: c5e is adequate after two passes, and the engine check passes in every year with no top-up; the closest year is 2031, at 52% of target. Engine PV is R2,235.7bn and CO2 is 1,627.7 Mt over 2026–40, R30.8bn and 94.0 Mt above c5d (RESULTS 'New central c5e'). Against IRP 2025 Table 1 over 2026–40 it builds:

- less wind (29.4 against 36.0 GW);
- more utility solar (27.9 against 25.5 GW);
- 13.0 GW / 62.6 GWh of lithium against 7.2 GW of IRP storage;
- about half the IRP's gas (8.2 GW of CCGT and 214 MW of open-cycle on LNG, against 17.3 GW);
- no nuclear and no pumped hydro.

Its CO2 is below the IRP's (132.8 against 168 Mt in 2030; 86.2 against 142 Mt in 2035), on a lower demand: c5e serves 220.4 TWh of customer demand in 2030, while the IRP's 168 Mt goes with 255 TWh on its own basis.

Adequacy caveat, for every engine verdict in this section (section 2): "2025 replay (16h): 91.4 GWh shed or interrupted (4.3 shed plus 87.1 interruptible load); 76.4 GWh with interruptible load capped at Eskom's 69.5 GWh (6.9 shed), against Eskom's 459.5 GWh in 2025 (390.0 manual load reduction plus 69.5 interruptible load, ILS; IOS left out). ESK19679 totals."

| Year | Wind c5e / IRP | Solar c5e / IRP | Rooftop c5e / IRP DG | Lithium c5e MW / MWh | IRP storage MW | CCGT | Open-cycle LNG / diesel | IRP gas | IRP nuclear | Coal standing c5e / IRP Fig 3 | CO2 Mt c5e / IRP |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 2026 | 696 / 964 | 354 / 3,553 | - / 900 | 360 / 1,440 | 144 | - | - / - | - | - | 39,692 / 39,692 | 155.8 / – |
| 2027 | 190 / 2,847 | 255 / 2,886 | 900 / 900 | 306 / 1,224 | 150 | - | - / - | - | - | 39,692 / 39,692 | 165.7 / – |
| 2028 | 2,320 / 770 | 390 / 1,760 | 900 / 900 | - / - | 615 | - | - / - | - | - | 39,692 / 39,692 | 158.9 / – |
| 2029 | 2,500 / 760 | 3,063 / 1,314 | 900 / 900 | 1,000 / - | 2,615 | - | - / - | 3,000 | - | 37,027 / 37,064 | 145.0 / – |
| 2030 | 2,500 / 2,000 | 3,277 / 800 | 900 / 900 | 3,000 / 11,118 | 200 | 214 | 214 / - | 3,000 | - | 32,433 / 32,388 | 132.8 / 168 |
| 2031 | 3,500 / 2,500 | 2,660 / 1,000 | 900 / 900 | 125 / 180 | 200 | - | - / - | - | - | 30,876 / 30,839 | 119.4 / – |
| 2032 | 3,500 / 2,600 | 3,173 / 1,200 | 900 / 900 | 1,636 / 6,717 | 200 | - | - / - | 1,250 | - | 29,223 / 29,324 | 103.8 / – |
| 2033 | 3,480 / 2,600 | 1,286 / 1,400 | 900 / 900 | 794 / 3,052 | 200 | 597 | - / - | 1,250 | - | 28,121 / 27,886 | 94.0 / – |
| 2034 | 2,707 / 3,000 | 1,094 / 1,600 | 900 / 900 | 718 / 2,572 | 200 | 1,200 | - / - | 1,250 | - | 26,467 / 26,403 | 88.2 / – |
| 2035 | 1,821 / 3,000 | 290 / 2,000 | 900 / 900 | 420 / 1,234 | 200 | 676 | - / - | 1,000 | - | 25,916 / 26,029 | 86.2 / 142 |
| 2036 | 1,954 / 2,000 | 600 / 1,600 | 900 / - | 449 / 2,354 | 500 | 708 | - / - | 1,250 | 1,250 | 25,348 / 25,350 | 83.7 / – |
| 2037 | 1,566 / 3,000 | 1,791 / 1,600 | 900 / - | 872 / 4,466 | 500 | 1,200 | - / - | 1,500 | 1,250 | 23,658 / 23,415 | 80.5 / – |
| 2038 | 1,706 / 3,000 | 2,075 / 1,600 | 900 / - | 933 / 5,255 | 500 | 1,200 | - / - | 1,250 | 1,350 | 21,969 / 21,819 | 76.5 / – |
| 2039 | 990 / 3,500 | 4,249 / 1,600 | 900 / - | 1,358 / 12,000 | 500 | 1,200 | - / - | 1,250 | 1,350 | 19,661 / 19,825 | 70.0 / – |
| 2040 | - / 3,500 | 3,357 / 1,600 | 900 / - | 1,006 / 11,001 | 500 | 1,200 | - / - | 1,250 | - | 17,890 / 17,958 | 67.3 / – |
| Total | 29,430 / 36,041 | 27,914 / 25,513 | 12,600 / 9,000 | 12,977 / 62,613 | 7,224 | 8,195 | 214 / 0 | 17,250 | 5,200 | – | 1,627.7 / – |

Notes on the table:

- Build from c5e's own pathway file (local run, build 2026-10-16h); CO2 from its engine check (TF=0.5 LNG=1 GRID=1). Generated from the run outputs and public_data/irp2025_extract.csv.
- "IRP storage" is Table 1's energy storage plus Eskom BESS, in MW only.
- The IRP adds 1,332 MW of pumped hydro in 2037; c5e adds none. Rooftop is 900 MW a year in both to 2035; the IRP lists no distributed generation after 2035.
- c5e retires no coal early; its standing coal follows Figure 3 within 250 MW. 1,580 MW of its wind is Cape wind without the integration charge (C below).
- The first pass failed 2030 (3.74 GWh of mean unserved energy against 2.19), which added three stress windows for 2030; on the second pass every year's mean unserved energy is below its target, the closest 2031 at 52%.
- The optimiser's objective is R1,434.4bn, with the stress-target slack at zero. Without carbon tax payments, engine PV is R2,173.6bn: the payments are R7.2bn in 2026, R8.1bn in 2030 and R4.1bn in 2040, R62.2bn in present value.

Caveats recorded with the comparison:

- The IRP's 2026–28 rows include build already under construction; c5e holds only the committed floors (A below).
- Table 1 gives storage in MW only and does not split gas.
- On the IRP's own basis, the 2030 demand reaches 255.5 TWh (RESULTS 'Smelter block sized'); the engine's 220.4 TWh is customer demand served, a different measure.

For comparison: c5d had engine PV R2,204.9bn and CO2 1,533.7 Mt (RESULTS 'New central c5d'); c5c, with the 10% margin, R2,257.5bn and 1,548.9 Mt (RESULTS 'New central c5c'); c5b_14r R2,393.5bn and 1,991.9 Mt (RESULTS 'c5b on build 2026-10-14r, the final base').

### What c5e changes from c5d

- Wind and tracking solar capex backed out of their awarded tariffs at the capacity factors new build runs at, 42.5% and 28.7%, instead of BW6 bids' 37.24% and 30.13%: wind R20,879/kW (was R17,773) and solar R11,038/kW (was R11,755), so each costs its tariff per MWh, R630.6 and R526.1 in 2026 rands (build 2026-10-16h, FIXED.bldTariffCfBasis 'run'; RESULTS 'Build 2026-10-16h'). Only the central cost cases are tariff-derived: BW6 bids' capex (s_bw6capex) is unchanged, and s_wind1064 and s_wind372 hold c5e's capex (user, message 161).
- Nothing else: c5e's other settings and its engine are c5d's.
- Against c5d: 2.3 GW less new wind and 3.2 GW more utility solar by 2040, 0.7 GW more lithium and 0.7 GW less CCGT; in 2026–27 only the committed wind (886 MW, against c5d's 4,080 MW); engine PV +R30.8bn, objective +R31.4bn, CO2 +94.0 Mt, most of it before 2035 (2030: 132.8 against 122.0 Mt) (RESULTS 'New central c5e').

### What c5d changed from c5b_14r, which c5e keeps

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

Each run takes c5e's settings, makes one change, and runs up to three passes from scratch on a frozen copy of build 2026-10-16h. The reference is a null run made the same way with no change: R2,235.7bn engine PV, 1,627.7 Mt and objective R1,434.4bn, the same figures as c5e (RESULTS 'New central c5e'). s_tariffcf, run on c5d for the third draft, is now the central and has no row; s_roof05 (rooftop 500 MW a year) is new. s_wind1064 and s_wind372 hold c5e's wind capex.

| Run | Change from c5e | Engine PV vs null, R bn | CO2 2026–40 vs null, Mt | Objective vs null, R bn | Same direction |
|---|---|---|---|---|---|
| s_carbonfull | Carbon tax at the full statutory rate, being rerun (e) | +294.0 | -285.4 | +302.1 | yes |
| s_irpgas | IRP 2025's gas plan, superseded (d) | +185.4 | -128.9 | +136.1 | yes |
| s_comply_full | Coal emissions compliance, full, being rerun (e) | +154.2 (with charge) | -100.6 | -6.5 | no |
| s_disc113 | Discount rate 11.3% | +123.0 | +120.1 | not comparable (a) | not judged |
| s_bw6capex | Wind and solar capex at BW6 bids (wind R28,462/kW, solar R16,786/kW), the high end of the evidence | +110.1 | +203.0 | +100.8 | yes |
| s_detgas | Determined gas: 3,000 MW by 2030 (IRP 2019 section 34) plus 5,000 MW in 2031–37 (GN 8021), additional on our reading, being rerun (e) | +79.4 | -1.5 | +45.9 | yes |
| s_disc10 | Discount rate 10% | +75.0 | +80.6 | not comparable (a) | not judged |
| s_roof2 | Rooftop 2,000 MW a year (b) | +54.1 | -7.4 | +48.0 | yes |
| s_comply_comp | Coal emissions compliance, Eskom's recommended plan | +52.3 (with charge) | +0.0 | -0.0 | no |
| s_prm10 | Planning reserve margin 10% over peak (the c5c rule) | +35.5 | +14.1 | +32.2 | yes |
| s_be7 | IRP nuclear forced: 1,250 MW in 2036–37, 1,350 MW in 2038–39 | +35.5 | -18.8 | -46.8 | no |
| s_nogas4strict | No new gas or diesel open-cycle; lithium up to 4 GW a year | +28.0 (top-up) | -228.9 | +45.2 | yes |
| s_noimp | No imports after 2030 (s_imp2030) | +25.7 | +26.5 | +55.8 | yes |
| s_be6 | Lithium at IRP 2025's pace, 550 MW a year, superseded (c) | +25.2 | +67.8 | +14.5 | yes |
| s_wind372 | New wind at BW6 bids' 37.2%, c5e's capex held | +24.0 | +97.0 | +36.9 | yes |
| s_committed | Committed gas (1,200 MW a year 2030–33, 200 MW in 2034) and lithium minimums, being rerun (e) | +22.5 | +81.7 | +19.0 | yes |
| s_pvirp | Solar capped by year at Table 1 | +8.1 | +5.0 | +10.8 | yes |
| s_gasprem | Gas capital at a 1.5-point finance premium | +2.9 | -25.0 | +6.4 | yes |
| s_cape10 | 3,470 MW of Cape wind at 10% curtailment | +2.1 | +1.6 | +0.2 | yes |
| s_li8h | Lithium energy cap at 8 hours instead of 4 | -0.1 | -0.5 | -0.0 | yes |
| s_coalme | Coal on Meridian's ME IRP 2024 dates | -0.5 | -45.8 | +21.8 | no |
| s_be4 | 51% minimum capacity factor on new CCGT | -1.7 | -28.1 | +6.3 | no |
| s_grid50 | Integration charge R201/kW-yr (half) for new wind and solar | -3.5 | -88.6 | -30.2 | yes |
| s_grid0 | Integration charge R0 for new wind and solar | -6.2 | -201.3 | -68.8 | yes |
| s_batt5 | Lithium capex falling 5% a year instead of 3% | -9.6 | -15.5 | -7.8 | yes |
| s_wind1064 | New wind at the 1.064 correction (45.2%), c5e's capex held | -12.2 | -48.8 | -19.5 | yes |
| s_coal60 | Coal on Figure 3's 60-year line | -14.3 | +28.5 | -26.8 | yes |
| s_roof05 | Rooftop 500 MW a year (b) | -18.9 | +5.0 | -16.2 | yes |
| s_gmcv2029 | Smelter block 930 MW to 2028, 675 MW in 2029, 493 MW from 2030 | -24.9 | -8.1 | -27.4 | yes |
| s_measured | No smelter block (measured demand only) | -64.1 | -25.8 | -70.1 | yes |
| s_disc6 | Discount rate 6% | -79.2 | -88.7 | not comparable (a) | not judged |

(a) The objective is at the run's own discount rate, not comparable with the null's at 8%; engine PV, at 8%, is.
"With charge": engine PV includes the emissions compliance charge, which the objective does not carry. "Top-up": with 1,250 MW of diesel open-cycle (below).
(b) Engine PV counts rooftop capex as system cost and leaves out what households save on bills and any distribution effect.
(c) 550 MW a year is the build LP's IRP 2025 pace (BLD_PACE.irp). Corrected 17 Oct 2026 (message 185 (3)): Table 1's storage column, Eskom BESS included (IRP 2025, Table 1, p.31; public_data/irp2025_extract.csv), reaches 7,224 MW of new storage by 2040 and about 8.2 GW by 2042; the 8.5 GW first given here counted Eskom's 294 MW twice, since the extract's 2026-42 total (8,223 MW) already includes it. Superseded: s_be6 is being rerun with cumulative new battery storage (lithium, vanadium flow and iron-air together) capped at Table 1's column (144, 294, 909 and 3,524 MW by 2026-29, +200 MW a year in 2030-35, +500 a year in 2036-40), never below the committed floor, as 'Battery storage on IRP 2025's Table 1 schedule'.
(d) Superseded (message 185 (2)): s_irpgas retires 6,185 MW of coal ahead of Figure 3 from 2026, which IRP 2025 Figure 3 and NTCSA's MTSAO do not; it is being rerun with no coal retired before 2029 (RC_FROM=2029).
(e) Being rerun (message 187 (1)): each retires coal ahead of Figure 3 from 2026 by the optimiser's choice (s_comply_full 2,955 MW, s_detgas 1,422, s_carbonfull 1,256, s_committed 609); RC_FROM=2029 is the pathway's default from 17 Oct 2026, and these figures stand until the reruns.

What the author takes from the table (RESULTS 'New central c5e'; 'Reviewer pack on c5e'):

- Pass mark 5, set before the runs: the two cost measures move the same way on 23 of the 28 comparable runs. Three of the exceptions are structural: the compliance charge (s_comply_comp, s_comply_full) and s_be7's forced nuclear capital sit outside the objective. s_coalme (engine -R0.5bn, objective +R21.8bn) and s_be4 (-R1.7bn, +R6.3bn) move engine PV by under R2bn and are not traced.
- s_nogas4strict fails the standard in 2034–40 as solved (largest 8.34 GWh in 2037, against a target of 2.58). Its mean unserved energy stays below NTCSA's 20 GWh a year in every year; its worst single run is 103–218 GWh a year from 2033. 1,250 MW of diesel open-cycle in 2034–37 closes the gap for +R7.4bn, +R28.0bn against the null; on c5d it needed 1,500 MW.
- Determined gas costs +R79.4bn on the engine and +R45.9bn on the objective against least cost. The IRP's gas beyond the determinations accounts for R106.0bn of s_irpgas's engine premium (R90.2bn on the objective). s_irpgas's build retires 6,185 MW of coal early from 2026 and 6,519 MW from 2029, which carries its CO2 cut (on c5d, 7,167 MW from 2029). Before the forced gas arrives in 2029, 2026–28 are covered by earlier wind, solar and lithium (+1.3, +5.2 and +0.9 GW by 2028 against the null) and the remaining coal; the engine check passes in those years, at 8–18% of target. Superseded (d): the 2026 retirement is the optimiser's choice, which IRP 2025 Figure 3 and NTCSA's MTSAO do not make; s_irpgas is being rerun with none before 2029. s_comply_full, s_detgas, s_carbonfull and s_committed also retire 0.6–3.0 GW early from 2026 (RESULTS 'Reviewer pack on c5e').
- s_li8h: the 4-hour lithium energy cap binds on c5e in 2039 only, at 12,000 MWh; with 8 hours the run builds 12,714 MWh that year, and engine PV moves -R0.1bn and CO2 -0.5 Mt. On c5d it did not bind. For reference, Modo Energy puts the marginal value of a battery's second hour in the Netherlands, January–September 2026, at EUR 92k/MW-yr and of its fourth at EUR 14k, in a market where balancing services dominate battery revenue (SOURCES 'Modo Energy: Netherlands battery revenue by duration').
- s_committed and s_be6 raise CO2 by 81.7 and 67.8 Mt on c5e (18.6 and 22.6 on c5d). In both, existing coal makes up energy the optimiser no longer builds wind, solar and lithium for: s_committed's gas and lithium minimums give 2030–33 their firm capacity, so it defers 2.8 GW of 2028–29 wind to 2033–38 and drops 3.6 GW of 2032–33 solar (coal +78.9 TWh, 2028–36); s_be6's 550 MW a year cuts 4.7 GW of lithium and 10.8 GW of solar, replaced by wind, coal (+61.6 TWh) and gas. s_committed's larger effect on c5e goes with its dearer wind: its null builds only the committed wind in 2026–27 and stays below the 2.5 GW cap in 2028, where c5d's built at the cap; s_be6's larger effect on c5e is not fully traced (RESULTS 's_committed and s_be6 on c5e, by carrier and year').
- s_constr (a sensitivity only, not in the table): with the committed floors raised to the projects confirmed under construction from pages read (wind 2,105.5 MW by 2027, solar 3,210 MW by 2028), engine PV rises R1.9bn and CO2 falls 12.5 Mt, mostly in 2026–28; wind and solar arrive earlier, the totals by 2040 do not change; adequate after two passes (RESULTS 's_constr on c5e').
- Every other run's engine check is below target in every year (caveat above): 8 runs after one pass, 22 after two.

---

## 5. Known limitations

Finding: the material limits are structural. The plan is chosen on one node with sampled days. Its adequacy is judged by a heuristic engine that is close to an optimum in ordinary weeks but not at the end of stress weeks. Several inputs that drive the build are unsourced or rest on readings of IRP figures.

Structure

1. Single node. There is no internal transmission, so the model cannot produce local curtailment, and in c5 it let Cape-quality wind connect where Mpumalanga coal retired (c5b_14r, c5d and c5e bar wind from freed connections, choice D; limitation 10). The regional optimiser still keeps a daily storage balance, so none of its results is published (RESULTS header, third caveat; 'c5 for the write-up'). NESO called 1,200 MW of emergency interconnector support for London and the South East when planned transmission did not return to service, with supply available elsewhere in GB; a single-node adequacy test counts such a case as adequate (SOURCES 'NESO: emergency assistance').
2. Representative days and stress windows. On c4's 2040 build, lithium cycles 374 times a year in the optimiser against 119 in the engine. In c4's 2030 stress windows the optimiser planned on coal the engine commits less of: 14.0–15.8 GW committed against 16.7–17.1 GW available (RESULTS 'Both measures for every run'; '14de re-check').
3. The engine is both the cost measure and the judge of adequacy. Its cost is an upper bound, and on c5b_14r's engine (14r) it still shed in stress weeks where a 24-hour optimum does not (section 3; not re-run on c5d's or c5e's engine). Every adequacy verdict carries the 2025 replay caveat (section 2).
4. No inertia or system-strength requirement in the build. The optimiser never pays for synchronous condensers or grid-forming batteries, which flatters renewable-heavy results, the no-gas case most. The engine enforces a 6 GW synchronous minimum and the optimiser does not. That floor (unsourced) that raises coal output when coal is there; once coal is gone the shortfall is counted but costs nothing, gas plant does not count towards it, and 30% of battery power counts as grid-forming at no extra cost (SYNC_GFM_SHARE 0.30, unsourced: the code's AEMO and National Grid ESO examples support grid-forming batteries in principle, not the share) (RESULTS 'Known limitation: no inertia or system-strength requirement'). SNSP on EirGrid's definition (non-synchronous generation, rooftop and battery discharge included, plus HVDC imports, over demand with storage charging plus exports): c5e's largest hour passes Ireland's 75% operating limit from 2029 (82%) and reaches 97% in 2040; hours above 75% rise from 43 a year in 2029 to 2,926 in 2035 and 4,080 in 2040 (Beyond Fossil Fuels, Ember, E3G and IEEFA, May 2025, pp.21-22; RESULTS 'SNSP on c5e').
5. Weather. Single runs, preset figures and most suite checks use one year of hourly shapes; the pathway engine check behind every c-run's adequacy verdict and engine PV, the loop's adequacy test and its stress windows use twelve weather years, 2014–2025 (RESULTS header, corrected 14 Oct 2026). The optimiser's representative days come from the one year.

Inputs

6. Demand basis. Domestic demand fell about 1.9 GW in mid-2025, mostly from suspended ferrochrome smelters. c5 counted that step twice for September–December. The 930 MW block is contracted, not measured: about 0.5 GW was back by mid-2026, and Glencore-Merafe's agreement ends in May 2029. The IRP gives 255 TWh both "in 2030" and "by 2029", and the author has set the target to 2030 (RESULTS 'Demand checks before rebasing'; 'Smelter block sized').
7. The ESRG workbook dates from September 2024 and is not confirmed as the plan's final forecast.
8. IRP figure readings. Coal is the author's digitisation of Figure 3 (±250 MW). The IRP's 2024 demand was read visually from Figure 2, which is still to be read properly. The IRP's peak forecast was not found.
9. Wind and solar cost. c5e backs capex out of awarded tariffs, wind BW5's R495.22/MWh and solar BW7's MW-weighted R492.53/MWh, at the capacity factors new build runs at (42.5% and 28.7%), so at 8% real in 2026, before grid charges, each costs its tariff in 2026 rands: wind R630.6/MWh and solar R526.1 (RESULTS 'Build 2026-10-16h'). c5d backed them out at BW6 bids' typical capacity factors (37.24% and 30.13%; the IPP Office's note does not define them), which put wind at 0.876 of its tariff and solar at 1.051 (RESULTS 'Reviewer pack on c5d'); c5e's basis costs +R30.8bn of engine PV and +94.0 Mt against c5d (section 4). The capacity factors behind the awarded tariffs are not published. A tariff is a 20-year CPI-indexed price including the developer's return, so it is close to, not the same as, a levelised cost. Wind O&M has no recorded edition, and life is unsourced.
10. Freed coal connections carry no grid cost. In c5 this was worth R9.95bn of the objective to wind; c5b_14r, c5d and c5e bar wind from them, and the credit for solar, storage and gas remains a modelling choice (RESULTS 'c5b proposal').
11. LNG cargo caveat. In c5e's engine check (LNG=1; one cargo is one floating storage unit, 4.08 PJ, no heel), the worst 14 days of each year's runs exceed one cargo every year from 2035 (1.05) and reach 3.04 cargoes in 2040; 2030–34 stay below one (0.21–0.95), and c5e burns no LNG before 2030. So from 2035 the plan assumes resupply within a two-week stress event. c5e needed a second pass, so it has stress windows: re-dispatched, 3 of its 33 window-years exceed one cargo (2038–40, at most 1.56), against c5's 10 of 33 from 2034. c5d's worst 14 days were 1.03 cargoes in 2035 and 3.15 in 2040, with no stress windows (RESULTS 'Reviewer pack on c5e'; 'Reviewer pack on c5d'; 'c5 for the write-up').
12. Battery fleet. c5 ran with 800 MW of existing batteries, which had no source; c5b_14r, c5d and c5e use the sourced 68 MW / 292 MWh.
13. Coal operation. The 0.5 minimum stable level is unsourced, and Kelvin sits inside the scaled 39,692 MW (SOURCES 'Kelvin power station').
14. Imports continue after 2030 because the IRP is silent. The IRP ties Mozal's exit to an end of Cahora Bassa supply, which the 2026 data does not show.
15. Carbon. Allowances rest on second-hand reporting, and price neutrality is not modelled.
16. Licences. PyPSA-RSA data is AGPL v3 but listed as MIT in the project's licence file. Use of NTCSA's GCCA data is not clearly permitted. Both are pending (SOURCES 'PyPSA-RSA: licence'; 'NTCSA GCCA 2025 data').
17. Avon and Dedisa. Since build 14p these two IPP open-cycle plants (1,005 MW) run on their contracts until they end (Dedisa end-2030, Avon 20 July 2031): monthly daytime and evening-peak levels from Eskom's January–August 2026 data, 899 GWh a year, with fuel and CO2 counted. c5 and earlier runs left this out, which understated their cost by about R6.6bn a year and their CO2 by 0.8–1.2 Mt a year to 2031. What remains: September–December use 2025's seasonal shape scaled to 2026's level (the author's choice), and night running is left out (4.5% of 2026's energy) (RESULTS 'Avon and Dedisa as must-run to contract end').
18. Reserve rule. Since build 14m the engine and the optimiser hold the 2,200 MW operating reserve by product, following NTCSA's ASTR 2026/27–2030/31; open-cycle plant and interruptible load count only as emergency reserve. What remains: the sustain times for regulating (60 minutes) and ten-minute reserve (30 minutes) are borrowed from CAISO; the requirement is held at 2030/31's level after 2031 (the document's last year), which understates it in the high-renewable years; interruptible load (1,000 MW) is called after open-cycle plant by the author's decision, since the ASTR sets no order; and on c5b_14r's engine (14r) holding pumped-storage energy for reserve took 2025 pumped-storage output to 3.3 TWh, below the benchmark band; on c5d's and c5e's engine it is 3.6 TWh, inside it (section 2) (RESULTS 'ASTR reserve rule'; 'Storage reserve decided with dispatch'; 'Interruptible load cap tried and withdrawn').
19. Perfect foresight in dispatch. The engine's look-aheads read the run's own future demand, wind and solar: 48 hours for batteries and pumped storage (engine fix (B)), 24 hours for coal commitment, 12 hours for coal ramping, a week for long-duration stores. Coal outages are held at the current hour's state rather than foreseen. A real operator works from forecasts with error, so the engine tends to understate operating cost, peaker and diesel use, shortfall and unserved energy, and to overstate what storage can do, most in renewable-heavy years. The PyPSA cross-check uses the same foresight, so it cannot catch this. Not changed; measuring it needs forecasts with realistic error, which the ten-day outlook (TODO 14ea) would supply (RESULTS 'Known limitation: the engine's look-aheads read the actual future'). For scale only: Modo Energy applies a 0.80 calibration, from backtests, to its battery revenue figures for the Netherlands (January–September 2026); it is a reference for the size of the foresight effect, not a correction applied here (SOURCES 'Modo Energy: Netherlands battery revenue by duration').
20. No emissions compliance cost on coal running past 2030. Eskom told the NCOP select committee on 10 June 2025 that full compliance with the Minimum Emission Standards would need about R257bn of capital plus R6.3bn a year, and its recommended plan R77bn plus R2.1bn a year (sulphur dioxide at Kusile and Medupi; particulates and nitrogen oxides at six stations) (PMG; Sunday Independent/IOL, 21 June 2025). Medupi's flue-gas desulphurisation alone is estimated at R41.7bn (Eskom's FY2026 integrated report, as reported by Business Day, 2 September 2026). The model charges none of this, so coal kept past 2030 looks cheaper than it is, and s_coal60's saving on c5e (R14.3bn of engine PV against the null) excludes it. The rand year of Eskom's figures is not stated. A sensitivity is being built (COMPLY, TODO 14em).
21. New gas deliverability. The optimiser can build CCGT and open-cycle gas from 2030 at its stated capex. Wood Mackenzie (1 April 2026, as reported by Power Engineering and Utility Dive) expects turbine prices near USD 600/kW by end-2027, nearly triple 2019, with lead times of about six years and order books sold through 2027. New gas from 2030 may not be deliverable on those lead times, and its capex may be understated; neither is modelled (SOURCES 'Gas turbine supply').
22. Options the optimiser cannot choose. The build LP cannot choose coal flexibility, virtual power plants, demand response (interruptible or shifted load) or a general long-duration store; their effect on cost and adequacy is not in any run. They are the first batch of new options after the note (HANDOVER 'c5 options'). Coal minimum stable levels in the code (build 2026-10-16a): the build LP holds committed coal at no less than 0.65 of what is committed (bldCoalMinFrac), with commitment moving by at most available coal / 48 per hour; the engine's unit commitment uses each station row's own minimum, 0.65 on 15 rows (Arnot, Duvha, Grootvlei, Hendrina part, Kelvin, Kriel, Lethabo part, Matla, Tutuka) and 0.50 on 16 (Camden, Hendrina part, Kendal, Komati, Kusile, Lethabo part, Majuba, Matimba, Medupi), 0.563 weighted by capacity over 41,530 MW (UC_FLEET). The 0.50 is the project's own change to Meridian's data, unsourced (SOURCES 'UC_FLEET minimum stable level 0.5'); the engine's fleet-average curve (0.54–0.65) is not used while unit commitment is on.
23. Midday coal commitment, curtailment and deemed energy (user, 16 Oct 2026, message 143 (3), and 17 Oct 2026, message 180 (1); RESULTS 'The 2026 replay curtails almost nothing for oversupply'). Today's midday curtailment comes from coal given priority over wind and solar: the System Operator keeps coal online at minimum stable level through daylight for the morning and evening peaks and curtails renewables last, up to 3 GW on a winter day in 2026 (NTCSA, as reported by SAPVIA and Engineering News, 30 Jul 2026). The engine instead takes coal units off over midday in 4-hour commitment blocks (BLOCK_HOURS). In c5e, the engine's midday coal decommitment costs about R1.8bn (0.8% of that year's engine cost) more than holding every coal unit at a 0.75 minimum in 2026 and R2.4bn (1.0%) more in 2030, and about R2.0bn (0.8%) less in 2035 (12 weather years; 10 draws in 2026 and 20 in 2030 and 2035, as in c5e's own engine check; no start-up costs) (RESULTS 'Coal priority in c5e's 2026'). The planned wholesale market (SAWEM) is designed to produce economic dispatch, and NERSA's roadmap has the market's external simulation running into early 2027 (W. Mkhize, NERSA, webinar of 14 Oct 2026, slide 12; SOURCES 'NERSA: wholesale market roadmap'). So the 2026 replay's near-absence of oversupply curtailment understates curtailment, midday coal burn and deemed energy mainly in 2026–27, if the market starts on time. A market changes the incentive, not unit minimums or restart times, so some midday coal remains and the engine's 4-hour blocks may still understate curtailment after 2027. Deemed energy for curtailed REIPPPP output is not in the engine's cost: upper bound R11.3bn on c5e over 2026–40 (R6.5bn in present value at 8%; c5d R13.7bn and R7.8bn) (RESULTS 'Reviewer pack on c5e'). For scale: c5e curtails 7.0% of its utility wind and solar in 2040 (5.7% surplus plus the 1.3% stopgap; 4.0% in 2035), against 2.2–10% in European systems (UK 10%, 2024; Ireland 9.7%, 2023; Germany 6.8%, 2023; Netherlands 4.9%, 2024; Spain 2.2%, 2024; methods differ; Beyond Fossil Fuels, Ember, E3G and IEEFA, May 2025, p.18) (RESULTS 'c5e's curtailment against Europe's').
24. Degradation is not modelled (user, 17 Oct 2026, message 163). Meridian's best estimates are 0.3% a year for wind and 0.5% for solar PV (Meridian Economics, June 2020, Table 1, p.iii). At 8% over 25 years, with degradation from year 2, levelised output falls 2.42% (wind) and 3.99% (solar); from year 1, 2.71% and 4.47%. On c5e's basis the omission cancels in the cost per MWh, which stays at the tariff; lifetime output per MW is overstated by those amounts, so capacity is understated for a given energy, and capex per kW is overstated: wind R20,879 against R20,272 (2.9%), solar R11,038 against R10,476 (5.1%). On c5d's basis, with capex fixed, cost per MWh was understated by 2.5% (wind) and 4.2% (solar) (RESULTS 'Degradation is not modelled').
25. Private wheeled plant from 2024–25 (user, 17 Oct 2026, messages 187 (2), 188, 190 (1) and 191 (1)-(2)). c5e's base omits Msenge Emoyeni wind, 69 MW, wheeled to Sasolburg since October 2024 (Sasol release, 10 Oct 2024); the next central loads it. About 450 MW of private wheeled solar from 2024–25 (Selemela 2 and 3, Damlaagte, Springbok) is assumed to be inside c5e's rooftop total, on NTCSA's definition of its rooftop PV estimate (all PV without contracts with NTCSA, ground-mounted included; Weekly System Status Report 2026 week 25, p.6), and is not loaded; whether a network-use agreement counts as such a contract is open. (RESULTS 'Private wheeled plant operating since 2024-25')

---

## 6. Four questions for the reviewer

Each can be answered from this pack in 30–40 minutes. Each is tied to a decision the model rests on.

1. Is the engine fit to judge adequacy?

   Decision: whether c5e's adequacy verdicts and any top-ups come from the engine, or wait for a reserve-holding optimum.

   Evidence: on c5b_14r's engine (build 14r; not re-run on c5d's or c5e's), the engine is within 1.1–3.5% of a 24-hour PyPSA optimum on ordinary weeks but 3.1–26.0% above it on c5b_14r's 15 worst stress weeks, where it sheds 123.0 GWh and the optimum, holding the same reserve, sheds none (section 3). The engine's adequacy verdicts and top-ups therefore rest partly on its dispatch, not only on the build. The 2025 replay on c5e's engine (section 2): "2025 replay (16h): 91.4 GWh shed or interrupted (4.3 shed plus 87.1 interruptible load); 76.4 GWh with interruptible load capped at Eskom's 69.5 GWh (6.9 shed), against Eskom's 459.5 GWh in 2025 (390.0 manual load reduction plus 69.5 interruptible load, ILS; IOS left out). ESK19679 totals."

   Question: would you accept the verdicts on this evidence? If not, which one further test would you require?

2. Should contracted smelter load be in the central case?

   Decision: whether c5e's central case carries the flat 930 MW block, or uses the measured base and keeps the block as a sensitivity (s_measured: -R64.1bn of engine PV against c5e's null).

   Evidence: with the block, 2030 reaches 255.5 TWh on the IRP's basis; without it, about 247 TWh. Only about 0.5 GW was visibly back by mid-2026.

   Question: in a central planning case, would you include industrial load that is contracted but not yet measured?

3. At which capacity factor should wind and solar capex be backed out of their tariffs?

   Decision: taken on 16 October (message 161). c5e backs capex out at the capacity factors new build runs at (42.5% and 28.7%), so each costs its awarded tariff per MWh; c5d backed it out at BW6 bids' typical capacity factors (37.24% and 30.13%).

   Evidence: on c5d's basis new wind cost R552.4/MWh, 0.876 of BW5's awarded tariff in 2026 rands, and solar R552.8/MWh, 1.051 of BW7's (limitation 9). The capacity factors behind the awarded tariffs are not published. c5e costs +R30.8bn of engine PV and +94.0 Mt of CO2 against c5d, with 2.3 GW less wind and 3.2 GW more solar by 2040 (section 4).

   Question: is the capacity factor the model runs new build at the right basis, rather than the bid window's typical one or another figure, and from which source?

4. Should LNG resupply constrain the optimiser?

   Decision: whether c5e limits stress-window gas burn to one floating storage unit per 14 days.

   Evidence: in c5e's engine check, the worst 14 days of each year exceed one cargo every year from 2035 (1.05) and reach 3.04 cargoes in 2040; re-dispatched, 3 of c5e's 33 stress-window-years exceed one cargo (2038–40), against c5's 10 of 33 (limitation 11).

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
- The 2026 replay curtails almost nothing for oversupply …, 16 Oct 2026
- New central c5e: c5d's settings with wind and solar capex backed out at the capacity factor each runs at …, 16-17 Oct 2026
- Build 2026-10-16h, central c5e …, 16 Oct 2026
- The 2025 replay against Eskom's 2025 like for like …, 17 Oct 2026
- Fixed presets and the 2025 replay, build by build from 12e to 16h … (branch claude/presets-132), 17 Oct 2026
- Reviewer pack on c5e …, 17 Oct 2026
- Degradation is not modelled …, 17 Oct 2026
- c5e's new wind and solar against NTCSA's connection programme …, 17 Oct 2026
- c5e's curtailment against Europe's …, 17 Oct 2026
- SNSP on c5e, EirGrid's definition …, 17 Oct 2026
- s_constr on c5e …, 17 Oct 2026
- s_committed and s_be6 on c5e, by carrier and year …, 17 Oct 2026
