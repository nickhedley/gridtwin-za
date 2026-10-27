# GridTwin ZA – reviewer pack

Draft for an outside energy modeller, 14 October 2026; refreshed on 15 October on c5b_14r, on 16 October on c5d and on 17 October on c5e. This refresh, begun 24 October 2026, moves the pack to c6, the central run on build 2026-10-25a (main with the coal pull request, PR C, and NTCSA's adequacy test as the standard, PR D). c6's results and its comparison with IRP 2025, from the runs of 25–26 October, are in section 4 (provisional until the note); every c5e and c5f figure in this pack is superseded and marked as such, kept only as the record of the previous central. Prepared from the project's results log (RESULTS.md), its source register (SOURCES.md) and the validation/ folder.

## What this is and how to read it

GridTwin ZA is a South African power-system model by Nick Hedley. It has two parts:

- an hourly dispatch engine that simulates a year on one national node, with coal unit commitment, outage draws and twelve weather years (2014–2025);
- a build optimiser, a linear programme that chooses new capacity each year to 2040 on representative days plus 14-day stress windows.

The two run in a loop. The engine checks each year of the optimiser's plan against an adequacy target, and any year that fails adds stress windows to the next pass.

The central run reviewed here is c6 (results in section 4, provisional). It keeps c5f's settings (c5e's, with rooftop at 1,200 MW a year from 2027, Msenge Emoyeni's 69 MW of wind in the base, s_constr2's floors as the committed minimums, and wheeled wind's load added back; RESULTS 'New central c5f') and changes three things, each in its own reviewed pull request (section 1, 'What c6 changes'):

- inputs from Eskom's FY2026 reports: coal fuel R553/MWh, nuclear fuel R109/MWh, imports R897/MWh, coal CO2 1.108 t/MWh sent out, hydro at its FY2023–26 mean, Avon and Dedisa at 268 GWh a year, rooftop R15,000/kW AC (PR A, build 2026-10-22e; RESULTS 'c6 PR A');
- imports priced in the build optimiser, and the Cahora Bassa contract ending after 2030 in the central case (PR B, build 2026-10-23a; RESULTS 'c6 PR B');
- coal operated as a system operator and a unit-commitment model would: commitment that weighs start costs, a practice floor calibrated to Eskom's 2026 operation and design minimums from 2030, sourced start costs, a corrected synchronous floor and ramp, and the build optimiser on the same rules (PR C, build 2026-10-24a; section 1b).

c5f (build 2026-10-17g) and c5e (build 2026-10-16h) before it are superseded: their figures remain below only where marked.

How to read the pack:

- Each section leads with its finding.
- Sources are given in brackets: a RESULTS entry, named by the start of its heading, or a SOURCES section. The full headings are listed at the end.
- Rands are 2026 rands. PV means present value at 8% real from 2026. "Engine PV" is the engine check's system cost over 2026–40.
- Some constants and annual totals come from Eskom's hourly datasets (ESK19679, ESK19243), which were obtained on request. Eskom is credited for the data, and the analysis is the author's, not Eskom's. No hourly or per-unit Eskom values appear here.
- What this pack does not contain: content of Eskom's reports beyond derived, fleet-level figures credited to Eskom; any Eskom hourly or per-unit data (ESK19679, ESK19243); NTCSA's GCCA files. Derived figures are credited to their source, and the analysis is the author's.
- With two to three hours, read sections 1 and 5 first, skim 2 to 4, and spend the remaining time on section 6.

---

## 1. Assumptions

### What c6 changes

Finding: c6 changes eleven inputs from c5f, each computed in the page from a printed figure rather than typed, and each with its source in SOURCES ('c6 inputs'; 'Coal flexibility benchmarks'). The rest of the c5e table further below still holds for c6.

| Input | c5e / c5f | c6 | Source | Status |
|---|---|---|---|---|
| Coal fuel | R546/MWh, carbon levy included | R553/MWh sent out (R91.5bn over 165,431 GWh) | Eskom performance report FY2026, pp.56 and 7 | sourced |
| Nuclear fuel | R160/MWh | R109/MWh, variable O&M R45 kept | Same, p.56 | sourced |
| Imports | R550/MWh, no source; free in the build optimiser; to 2040 | R897/MWh, full cost, priced in the optimiser at the fixed contracted infeed; end after 2030 (to 2040 as sensitivity s_imp) | Same, p.56; the IRP is silent after the contract | sourced (price); choice (end year) |
| Coal CO2 | 1.04 t/MWh, no source | 1.108 t CO2/MWh sent out: Eskom's 184.0 Mt less its own open-cycle output at the diesel factor, over coal sent out | Same, pp.35 and 7 | sourced |
| Hydro | Capacity factor 0.55 | 0.3625, the FY2023–26 mean on 602 MW | Eskom's hourly data (derived figure) | sourced |
| Avon and Dedisa | 899 GWh a year | 268 GWh a year, the same hourly shape | Eskom performance report FY2026, p.20 | sourced |
| Rooftop capex | R17,000/kW, no source | R15,000/kW AC (R12,500/kW DC x 1.2) | 'PV and rooftop cross-checks' | partly |
| Coal availability | 65% coal only | 65% coal only, confirmed against Week 42's 68.32% whole-fleet figure (64.8% coal only) | Eskom Week 42 report, p.3; the hourly data, January–August 2026 | sourced |
| Coal commitment, minimums, start costs, ramp, synchronous floor | see section 1b | see section 1b | section 1b | mixed |
| Build optimiser's coal | minimum 0.65 of committed; commitment moving at most 1/48 of available coal an hour | each year's minimum and the hot-start cost of the units standing, as in the engine; the 48-hour rule a sensitivity | section 1b | follows the engine |
| Coal flexibility option | ramp only (24% to 100% an hour), R223/kW-yr on all coal | three steps: none; Tier 1 (design minimums from the start); Tiers 1–3 (also 40% for units retiring after 2035, the faster ramp on them, R223/kW-yr on them) | section 1b | partly |

The c5e table below is kept as the record of the previous central; a row changed above is superseded there.

c5e's table (superseded where 'What c6 changes' lists the row). Finding: of 24 rows, 5 are fully sourced and 15 partly sourced. Two are unsourced: the LNG cargo size, and the 10% planning reserve margin, which is off from c5d on and is sensitivity s_prm10. Two rows mix a sourced value with an unsourced one: coal operation, where the minimum stable level is unsourced, and grid cost, where the free connection on retired-coal sites is a modelling choice.

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
| Adequacy standard | c6: planned to NTCSA's unserved-energy criterion (MTSAO 2026–2030, section 3, p.11), mean unserved energy at most 20 GWh a year; c6 meets both criteria of NTCSA's medium-term adequacy test (the system operator's test, not a planning standard); the open-cycle criterion is reported for every run and planned to only in s_ntcsa_both; the worst run's shedding shown beside it (user decision, 25 Oct 2026). Earlier centrals: at most half of 0.002% of customer demand, 2.19 GWh in 2030 and 2.78 GWh in 2040 for c5e and c5d, as for c5b_14r (c5: 2.08 and 2.66), kept in c6 as s_std_strict (RESULTS 'Average system cost per MWh served'; 'New central c5e') | NTCSA's test is the system operator's, not a legislated planning standard; the 0.002% is the Australian NEM standard; halving it was the author's choice, 12 Oct 2026. NTCSA's Medium-Term System Adequacy Outlook deems adequacy met below 20 GWh of unserved energy a year and a 6% open-cycle capacity factor (2026–2030 edition, section 3, p.11; its study is not a generation resource plan, p.ii; SOURCES 'Adequacy criteria'); the earlier standard (s_std_strict in c6) is about eight times stricter on unserved energy; the 6% open-cycle criterion is reported, not planned to. IRP 2025 states no numeric criterion | partly |

Build limits in c5, which c5b_14r, c5d and c5e keep (RESULTS 'c5 inputs, final'; 'Diagnosis, not deliverable'; 'c5b proposal'; SOURCES 'Tubatse pumped storage'):

- lithium at most 3 GW a year;
- wind at most 2.5 GW a year to 2030 and 3.5 GW a year after;
- new gas from 2030, at most 1,200 MW a year;
- pumped hydro: Tubatse only, 1,500 MW from 2038.

c5e connects 15.5 GW of new wind and utility solar in 2026–30. NTCSA's stated programme for 2024–30 is 16.2 GW: 13 GW of new renewables through transformer upgrades plus 3.2 GW from the first private transmission tender by August 2029. At least 1.3 GW connected in 2024–25, so c5e's early build is above it. (GreenCape MIR 2026, p.20, citing NTCSA 2024; 2024–25 connections: NERSA via SolarQuarter, 10 Apr 2026; SOLA's Selemela 2 and 3 project pages; Mainstream, 23 Aug 2025; Sibanye-Stillwater, 1 Apr 2025, for Castle; Sasol, 10 Oct 2024, for Msenge Emoyeni; GEM, September 2026 release, for Springbok; RESULTS 'c5e's new wind and solar against NTCSA's connection programme')

---

## 1b. Coal in c6

Finding: c6 operates coal as a system operator would and as unit-commitment models do (PLEXOS and its peers), within a heuristic engine: commitment weighs start costs, minimum levels follow Eskom's operation now and its design minimums from 2030, start costs are sourced, and the build optimiser plans on the same rules. Each choice was made by the author and the advisor (24 October), or, where taken without them, follows a stated practice (RULES, 'Decisions taken without Nick follow practice'). Results on c6 itself come with section 4 on 29 October (RESULTS 'c6 PR C, build 2026-10-24a', '369' and '370'; build 2026-10-24b).

What the engine does (RESULTS 'Coal commitment against standard practice'):

- Commitment. Units are committed in 4-hour blocks, cheapest first, to each block's peak net load plus the operating reserve. Before a running unit is switched off, the engine looks up to 24 hours ahead for the block that needs it again and keeps it on at its minimum when restarting would cost more than running at minimum, net of the fuel that minimum output saves elsewhere (none when it only spills solar). This is a rule, not the cost-minimising mixed-integer commitment a production-cost model solves (benchmarked against one below).
- Minimum levels. To 2029, a practice floor: every unit's minimum at least 0.75 of capacity. It is calibrated like for like, as a backcast is: on sunny, low-demand days, the 2026 replay's lowest midday coal output as a share of available coal matches Eskom's January–August 2026 median, 0.623 (Eskom's hourly data; derived, analysis ours; SEM Committee, PLEXOS validation and backcast report, SEM-20-004, for the practice). From 2030, the design minimums: 0.57 for the groups at 0.65 and 0.52 for those at 0.50, the class averages of the fleet's design minimums (Eskom, 2023; derived, fleet-level). NTCSA's report of curtailment of up to 3 GW on one winter day of 2026 is a check, not the target (the author accepted the measured calibration, 24 October). Flag: at 0.75 the 2026 replay's winter midday curtailment peak is 5.5 GW against NTCSA's reported 3 GW (0.70 would give 3.1 GW but misses the measured statistic), which NTCSA describes as system-wide oversupply with no split against congestion curtailment published. Duration: the floor holds to 2029 and the design minimums apply from 2030 because the wholesale market is phased in over those years. Eskom Generation has traded with Eskom Distribution inside the market since April 2026, commercial launch is targeted for the second quarter of 2027, full balancing for the first quarter of 2028, and capacity and ancillary services markets from 2030; Krutham expects a market dominated by Eskom, with little price discovery from outside it, until the early 2030s (Krutham, Trading electricity: Is SA ready for the next financial market?, October 2026, p.2, https://www.krutham.com/reports/trading-electricity/).
- Start costs, per MW of capacity per start, hot, warm or cold by hours offline and class (NREL and Intertek APTECH, Power Plant Cycling Costs, NREL/SR-5500-55433, 2012, tables 1-1 and 1-3; 2011 dollars to January 2026 rands at US CPI-U and R16.50): wear and other start costs, plus start fuel as one combined figure (NREL's whole start fuel less Eskom's fuel oil, oil on the model's diesel price basis, coal at the model's R47.94/GJ; NREL/Intertek and Eskom, analysis ours). The forced outages a start causes are costed too (NREL table 1-1's median EFOR impact per start, at a year of lost output at the 2026 replay's mean marginal price plus a peaker's annual capacity cost). Large subcritical units: R2,524 hot, R3,050 warm, R4,521 cold; supercritical (Medupi, Kusile): R2,393, R3,282, R4,840. The earlier per-unit start costs (PyPSA-RSA, R99–160 per MW, price base not stated) are 15–45 times lower.
- Start-up time: 2 hours to synchronise from hot (AEMO 2025 Thermal Audit), 10 from cold (Agora Energiewende, 2017, the upper end of 5–10) and 6 from warm (unsourced, flagged), then loading to the minimum at the unit's ramp, that output must-run. With 4 hours' minimum down a unit cannot come off for a 4–8 hour midday trough and be back for the evening.
- Minimum up and down times 8 and 4 hours for 97% of capacity (PyPSA-RSA's fleet); 24 hours down as a sensitivity.
- Ramp 24% of available coal an hour (Agora Energiewende, 2017), now honoured in commitment as well as dispatch: units load over the hours after a start and walk down before they come off.
- Synchronous floor: coal is lifted to keep 6 GW of synchronous plant, counting nuclear and hydro at their output and imports not at all (they arrive over HVDC); grid-forming batteries count at 30% of their power (unsourced, flagged).
- Operating reserve is held on committed coal and storage every hour, whether or not it is priced. Coal's share of the ten-minute reserve is capped at its ramp times ten minutes (PLEXOS practice: reserve limited by ramp times the reserve's timeframe); instantaneous reserve is governor response, which a sourced primary-response share would cap, but the Grid Code's figure could not be confirmed, so it and regulating reserve are not capped (flagged).
- Build optimiser: each year's capacity-weighted minimum of the units standing (0.75 in 2026, 0.54 in 2030, 0.53 in 2035, 0.52 in 2040) and the hot-start cost per MW of commitment added (about R2,110). Its earlier rule, commitment moving at most 1/48 of available coal an hour, is the s_rate48 sensitivity.

Tested before the central was set (2026 replay and Least-cost path 2035, twelve weather years by ten outage draws; RESULTS 'c6 PR C'):

- Starts per unit a year: 19 in 2026, against Eskom's costing assumption of about 12 (an assumption for reserve shutdowns, not a measurement) and Australia's black-coal units' about 7 (September 2026, AEMO data; derived, analysis ours); 28 in Least-cost path 2035. Before PR C: 115 and 251; before the start-up time: 27 and 70. Two-shifting ends in 2026 and falls from 46% to 4% of days in Least-cost path 2035, at 2.5 TWh more curtailment there.
- Against an optimum on the same rules (a unit-commitment MIP on eight weeks of one run; RESULTS '370'): in Least-cost path 2035 the engine is 1.3% dearer, but the optimum cycles coal about five times as often (147 against 28 starts per unit a year; 41 against 2 two-shift days in 56). Real practice cycles far less (Eskom, Australia), which suggests real cycling costs exceed NREL's lower bounds. The engine stays for c6; calibrating start costs so an optimum reproduces observed starts is for after the note.
- Committing on a forecast rather than the actual hours changes starts little; with yesterday's net load as the forecast, Least-cost path 2035 sheds about 250 GWh a year against 3 (RESULTS 'Coal commitment against standard practice').

Caveats: start costs are NREL's lower bounds; restart risk is not costed; Australia's units run down to about 40% and rarely start; the model pays nothing for curtailed renewables (no deemed energy), so a higher coal floor looks cheaper than it is. What the engine leaves out against a production-cost model: a cost-minimising commitment, a governor-response limit on instantaneous reserve, a minimum number of synchronous units rather than MW, and no-load cost in the commitment decision.

Sensitivities on coal in c6's run set: s_coalpractice (the practice floor held to 2040), s_mindn24 (24 hours down), s_rate48 (the optimiser's old rate rule), s_spotoil (fuel oil at spot), s_wearp75 (NREL's 75th-percentile wear, a named result given the MIP finding).

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

### c6a's 2026 against Eskom's calendar 2026 (the main validation; message 392 (a))

c6a's 2026 coal is 150.4 TWh against about 153.9 TWh for Eskom's calendar 2026 on its January–August trend (each line's calendar 2025
times January–August 2026 over January–August 2025; Eskom's hourly data, derived, analysis ours): 3.5 TWh (2.3%) low. Against FY2026
(165.4 TWh, Eskom performance report, p.7) it is 14.9 TWh low; exports explain 7.9 TWh of that: c6a carries firm exports only (6.6 TWh
against Eskom's 14.5 TWh in FY2026 and about 8.7 TWh on the 2026 trend), and Mozal's suspension from February 2026 takes about 2 TWh a
year of non-firm exports out (limitation 27). Coal's share of generation, rooftop in and imports and storage out: 75.1% for the year,
against Ember's 80.5% for January–August 2026 (coal 80.5%, solar 8.0%, wind 4.8%; Ember, CC BY 4.0). The 2025 backcast stays within
1.3 TWh of calendar 2025 (below). c6's FY2026 comparison is kept below for the record.

### c6's 2026 against Eskom's FY2026 (superseded by c6a; the record)

c6's 2026 coal is 146.8 TWh against Eskom's 165.4 TWh for FY2026 (Eskom performance report, p.7); its CO2 163.5 Mt against 184.0 Mt (p.35). The gap is explained line by line to 0.0 TWh, and nothing in the engine is wrong: on 2025's inputs the 2025 replay (build 2026-10-25a) gives 169.1 TWh of coal against Eskom's 170.4 (−0.8%). The 2026 gap is inputs and scope (Eskom data, analysis ours; RESULTS 'c6's 2026 coal and CO2 against Eskom's FY2026'):

| Line, TWh | c6 2026 | Eskom FY2026 | Effect on c6's coal |
|---|---|---|---|
| Exports | 6.6 (firm only) | 14.5 | −7.9 |
| Wind, utility solar, CSP and RMIPPPP hybrid | 29.1 | 18.7 | −10.4 |
| Imports | 9.3 | 6.8 | −2.6 |
| Open-cycle, nuclear, hydro, pumped storage (net) | 11.2 | 14.6 | +3.4 |
| Domestic grid load met | 189.8 | 190.9 | −1.1 |
| Coal | 146.8 | 165.4 | −18.6 |

- Financial against calendar year: Eskom's own coal is falling, 170.4 TWh in calendar 2025 and about 153.9 for calendar 2026 on the January–August trend; against that, c6 is 7.1 TWh low, more than all of it wind and solar.
- The new coal rules (PR C) add about 0.8 TWh of coal in 2026; they narrow the gap, they do not cause it.
- Coal-first dispatch, as an operating-practice sensitivity: holding coal ahead of contracted wind and solar up to NERSA's measured 2025 curtailment (about 1.0–1.6% of REIPPPP output) adds 0.18–0.28 TWh of coal and 0.2–0.3 Mt of CO2 in the 2026 replay; the central already includes 0.23 TWh of it (the 1.3% stopgap).
- CO2 follows coal: c6's factor is calibrated to Eskom's FY2026, so 163.5 Mt plus the coal gap at Eskom's factor (+20.7), less c6's slightly higher part-load factor (−0.8), plus Eskom's own open-cycle output (+0.6) is 184.0 Mt.
- Two flags, limitation 27: exports outside c6's scope, and the full-year output of plant commissioned during 2026, which, corrected plant by plant, adds 4.7 TWh of coal and 5.1 Mt of CO2 in 2026.

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

## 4. c6a against IRP 2025, and the sensitivities

The design, fixed before the runs (user, 22–24 October, messages 321, 322, 329, 363):

- Same assumptions, different build. The IRP plan's build (Table 1, coal retiring on Figure 3's 50-year line) is run through the same engine, with every c6 input, outage draw and weather year, so any gap in cost, CO2 or adequacy is the build, not the assumptions. c6 is the build the optimiser chooses on those assumptions.
- Two demand bases. c6's own (the measured 2026 base on the growth of UCT ESRG's IRP reference forecast, with the contracted smelter block), and the IRP's own: IRP 2025's Moderate forecast as published, digitised from its Figure 2 (no table is published; reading error about 1 TWh, 3 TWh in 2031, 2032 and 2034), at the IRP's own level, converted to the model's demand basis for definitions only: exports, other onsite generation and 2026 rooftop solar removed (ESRG's split of the same forecast), then 0.951, Eskom's 2025 coverage of Stats SA's electricity available for distribution (194.6 of 204.6 TWh), held to 2040 (user, 25 October, message 370 (a); RESULTS '370'). On that basis the IRP's own forecast is 2–7% below c6's demand. Four runs: c6, the IRP plan at c6's demand, c6 re-optimised at the IRP's demand, and the IRP plan at the IRP's demand. The first pair isolates the build; the second shows how much of any gap is the IRP being sized for higher demand.
- Reliability standard (user decision, 25 October, message 373): NTCSA's medium-term adequacy test, mean unserved energy at most 20 GWh a year (NTCSA, Medium-Term System Adequacy Outlook 2026–2030, section 3, p.11; a Monte Carlo mean, pp.10–11; SOURCES 'Adequacy criteria'), as closest to South African practice. It is the system operator's adequacy test, not a legislated planning standard, and NTCSA states its study is not a generation resource plan (p.ii). c6 is planned to NTCSA's unserved-energy criterion (i) and meets both criteria of NTCSA's medium-term adequacy test (the system operator's test, not a planning standard); the second criterion, an open-cycle gas capacity factor under 6% a year, is reported for every run and year, with the years it is exceeded (all open-cycle output, Eskom's diesel turbines with Avon and Dedisa and new open-cycle on diesel or LNG, over the installed capacity of the same plant for the whole year; combined-cycle excluded; RESULTS 'Message 376'), and s_ntcsa_both plans c6 to both criteria. Two further sensitivities: s_koeberg_winter (Koeberg's 2025–26 monthly output, its winter outages repeated, same annual factor; the central keeps Koeberg flat at 0.66, as Eskom plans refuelling outside winter) and the cost of restarting coal units after forced outages, which the engine does not charge, shown as its own line in every cost table (a cost-only adjustment, the same for every run). Each run's engine check: twelve weather years by ten outage draws a year; the mean of the draws judged against 20 GWh, with the worst run's shedding shown beside it. Sensitivities on the standard: s_std_strict (the earlier half of the NEM's 0.002% of customer demand, about 2.2–2.8 GWh a year) for c6 and each sensitivity, and s_std_nem (the NEM's 0.002% itself) for c6 and s_nogas. Whether no new gas needs diesel peakers is reported under each standard.
- Sensitivities (16 runs with the four above and c6's null): gas capex +25% (s_gascapex25); new gas from 2032 (s_gas2032); no new gas (s_nogas); imports to 2040 (s_imp); demand flat and falling 1% a year (s_demlow); and on coal, s_coalpractice, s_mindn24, s_rate48, s_spotoil and s_wearp75 (section 1b).
- Reported: build by year against Table 1, engine present value 2026–40 and its components, CO2 by year, adequacy by year, and cost and CO2 for each sensitivity against c6.

### c6a results (runs of 26–27 October 2026, build 2026-10-26b; the central from 26 October; provisional until the note)

c6a is c6 with new gas (CCGT and open-cycle on LNG) from 2032 at the earliest (IGUA-SA's Gas Roadmap, October 2026), the 2026 fleet
counted for its share of the year in service, and rooftop on 2025's basis (the 2026 mean less wheeled plant; the 2027 step to the
end-2026 level; the add-back on the twelve-year solar mean). c6 stays below as the earlier result.

c6a meets both of NTCSA's criteria in every year: mean unserved energy at most 4.3 GWh against 20 GWh (worst single run 163 GWh) and
an open-cycle capacity factor of at most 1.4%. As in c6, no new gas without new open-cycle fails the unserved-energy criterion from 2037.

| Run | Both NTCSA criteria | Mean unserved, highest year, GWh | Worst run, GWh | Open-cycle capacity factor, highest year | Engine PV, R bn | Against c6a, R bn | CO2 2026–40, Mt |
|---|---|---|---|---|---|---|---|
| c6a | met | 4.3 | 163 | 1.4% | 2294.7 | – | 1810 |
| null | met | 4.3 | 163 | 1.4% | 2294.7 | +0.0 | 1810 |
| s_ntcsa_both | met | 4.3 | 163 | 1.4% | 2294.7 | +0.0 | 1810 |
| s_koeberg_winter | met | 4.7 | 193 | 1.3% | 2305.8 | +11.1 | 1794 |
| s_gascapex25 | met | 4.6 | 151 | 1.8% | 2303.1 | +8.4 | 1775 |
| s_gas2030 | met | 3.7 | 126 | 1.3% | 2295.0 | +0.3 | 1811 |
| s_nogas | not met: unserved over 20 GWh in 2037, 2038, 2039, 2040 | 133.4 | 317 | 2.1% | 2346.6 | +51.9 | 1620 |
| s_nogas_dsl | met | 11.0 | 157 | 1.4% | 2304.3 | +9.6 | 1622 |
| s_imp | met | 3.3 | 107 | 1.4% | 2284.8 | −9.9 | 1782 |
| s_demlowflat | met | 3.2 | 135 | 1.3% | 1981.4 | −313.3 | 1720 |
| s_demlowm1 | met | 2.1 | 80 | 1.4% | 1894.5 | −400.3 | 1713 |
| c6a_irpdem | met | 3.4 | 104 | 1.2% | 2181.2 | −113.6 | 1753 |
| s_coalpractice | met | 3.8 | 138 | 1.0% | 2314.7 | +20.0 | 1924 |
| s_mindn24 | met | 4.4 | 163 | 1.4% | 2286.6 | −8.1 | 1835 |
| s_rate48 | met | 4.3 | 164 | 1.4% | 2296.6 | +1.9 | 1822 |
| s_spotoil | met | 4.4 | 164 | 1.4% | 2295.5 | +0.8 | 1811 |
| s_wearp75 | met | 4.3 | 164 | 1.4% | 2296.0 | +1.3 | 1811 |
| s_be6 | met | 1.1 | 42 | 1.0% | 2334.7 | +40.0 | 1789 |
| s_be7 | met | 4.3 | 159 | 1.4% | 2326.4 | +31.7 | 1783 |
| s_irpgas | met | 0.3 | 27 | 0.5% | 2484.4 | +189.7 | 1793 |
| s_std_strict | met | 2.4 | 190 | 1.2% | 2299.3 | +4.5 | 1768 |
| s_std_strict_nogas_dsl | met | 5.0 | 237 | 1.2% | 2310.4 | +15.7 | 1583 |
| s_nofleet | met | 4.3 | 163 | 1.4% | 2294.6 | −0.1 | 1805 |
| s_noroofh | met | 4.3 | 155 | 1.3% | 2300.8 | +6.1 | 1766 |
| s_windbw6 | met | 11.2 | 353 | 2.7% | 2355.0 | +60.3 | 1943 |

Still running at 05:30 SAST, 27 October: the three NEM-standard runs; the restart-cost line follows them. s_std_strict_nogas did not
finish (a build pass hit its 2-hour limit); c6's did not meet the standard either.

The IRP 2025 build on c6a's paths, checked by the same engine (IRP comparison as at 27 October 2026, before the government briefing on
the Gas IPP Procurement Programme, 28 October. [Briefing: one sentence to follow.]):

| Run | 20 GWh | Strict (half NEM) | Mean unserved, highest year / worst run, GWh | Open-cycle CF, highest year | Engine PV, R bn | Against the optimised plan at the same demand | CO2 2030 / 2035 / 2040, Mt | CO2 2026-40, Mt | Curtailed wind and solar 2026-40, TWh | Restart line PV, R bn |
|---|---|---|---|---|---|---|---|---|---|---|
| IRP 2025 build, c6a demand | met | met | 0.00 / 0 | 0.15% | 2591.8 | +297.1 against c6a (2294.7) | 125.3 / 104.7 / 62.4 | 1731 (c6a 1810) | 271.3 (c6a 139.9) | – |
| IRP 2025 build, IRP 2025 demand | met | met | 0.00 / 0 | 0.10% | 2527.4 | +346.3 against c6a_irpdem (2181.2) | 116.8 / 96.7 / 55.8 | 1607 (c6a_irpdem 1753) | 339.9 (c6a_irpdem 144.5) | – |

Against c6, c6a emits 50 Mt more over 2026–40 (1,810 against 1,760 Mt): 44 Mt from the rooftop changes (about 1 GW more rooftop from
2027 and its output on the twelve-year solar mean, against which the optimiser builds 1.1 GW less wind by 2030 and 2–3 GW less utility
solar by 2035–40), 5 Mt from the 2026 fleet correction (2026 only), and less than 1 Mt from gas starting in 2032 rather than 2030
(RESULTS 'c6a, the new central').

Wind cost, for the central decision (RESULTS 'c6a'; capex implied by BW5's awarded tariff on the model's assumptions R20,874/kW, the
c6a central; BW6's compliant bids R28,462/kW, corroborated by IRP 2025's workbook BW6 base case, R27,446/kW, and Koruson 1's
disclosed investment, about R27,400/kW):

| Run | Wind GW 2030/35/40 | Utility solar GW 2030/35/40 | Lithium GW 2035/40 | Gas GW 2035/40 | Engine PV R bn | CO2 2026-40 Mt | Mean unserved max / worst run GWh | IRP build PV, same wind cost | IRP gap R bn |
|---|---|---|---|---|---|---|---|---|---|
| c6a (wind central: capex implied by BW5's awarded tariff, R20,874/kW) | 7.3 / 24.8 / 33.7 | 9.3 / 13.9 / 24.0 | 9.0 / 12.7 | 3.3 / 9.2 | 2294.7 | 1810 | 4.3 / 163 | 2591.8 | +297.1 |
| s_windbw6_c6a (BW6 compliant bids, R28,462/kW) | 2.7 / 17.1 / 31.0 | 9.5 / 16.9 / 26.3 | 9.3 / 13.6 | 3.5 / 8.8 | 2355.0 | 1943 | 11.2 / 353 | 2666.5 | +311.5 |

### c6 results (runs of 25–26 October 2026, build 2026-10-25a; superseded by c6a, the record of the earlier central)

c6 meets both criteria of NTCSA's medium-term adequacy test (the system operator's test, not a planning standard) in every year: mean unserved energy at most 3.3 GWh against 20 GWh (worst single run 120 GWh), and an open-cycle capacity factor of 0.13–1.43% against 6%. Every run below meets both except the two runs with no new gas and no new diesel open-cycle (s_nogas, s_std_nem_nogas), which fail the unserved-energy criterion from 2037. Mean unserved energy is the mean over the engine check's runs in the year with the highest mean; the worst run is the single weather-year and outage draw with the most shedding in any year. Central set: 120 runs a year (twelve weather years by ten outage draws); engine PV at 8% real, 2026–40; the restart line is the cost of coal restarts after forced outages, which the engine does not charge, added as its own line (RESULTS 'c6 under NTCSA's 20 GWh test').

Central set, planned to NTCSA's 20 GWh (s_std_nem and the two NEM no-gas runs are planned to the NEM's 0.002%, s_std_strict_nogas_dsl to half of it):

| Run | Both NTCSA criteria | Mean unserved, highest year, GWh | Worst run, GWh | Open-cycle capacity factor, highest year | Engine PV, R bn | Against c6, R bn | CO2 2026–40, Mt | Restart line, PV R bn |
|---|---|---|---|---|---|---|---|---|
| c6 | met | 3.3 | 120 | 1.4% | 2300.0 | – | 1760 | 6.8 |
| s_std_nem | met | 2.6 | 194 | 1.4% | 2299.8 | −0.2 | 1760 | 6.8 |
| s_ntcsa_both | met | 3.3 | 120 | 1.4% | 2300.0 | +0.0 | 1760 | 6.8 |
| s_koeberg_winter | met | 2.6 | 125 | 1.2% | 2309.7 | +9.8 | 1757 | 6.8 |
| s_gascapex25 | met | 3.9 | 140 | 1.9% | 2306.2 | +6.2 | 1723 | 6.8 |
| s_gas2032 | met | 4.1 | 152 | 1.3% | 2299.7 | −0.2 | 1759 | 6.8 |
| s_nogas | not met: unserved over 20 GWh in 2037, 2038, 2039, 2040 | 140.4 | 322 | 2.2% | 2350.8 | +50.8 | 1609 | 6.8 |
| s_nogas_dsl | met | 7.2 | 162 | 1.3% | 2309.2 | +9.2 | 1609 | 6.8 |
| s_std_strict_nogas_dsl | met | 12.7 | 237 | 1.3% | 2313.7 | +13.8 | 1574 | 6.8 |
| s_std_nem_nogas | not met: unserved over 20 GWh in 2037, 2038, 2039, 2040 | 115.3 | 277 | 1.9% | 2355.5 | +55.5 | 1554 | 6.8 |
| s_std_nem_nogas_dsl | met | 12.4 | 257 | 1.3% | 2309.2 | +9.2 | 1605 | 6.8 |
| s_imp | met | 3.4 | 110 | 1.4% | 2289.3 | −10.6 | 1745 | 6.8 |
| s_demlowflat | met | 3.1 | 131 | 1.3% | 1984.4 | −315.5 | 1685 | 6.8 |
| s_demlowm1 | met | 1.6 | 71 | 1.4% | 1898.6 | −401.3 | 1665 | 6.8 |
| c6_irpdem | met | 3.2 | 99 | 1.3% | 2185.8 | −114.2 | 1703 | 6.8 |
| s_coalpractice | met | 2.7 | 99 | 1.1% | 2322.0 | +22.0 | 1871 | 6.8 |
| s_mindn24 | met | 3.3 | 120 | 1.4% | 2293.1 | −6.9 | 1786 | 6.8 |
| s_rate48 | met | 3.1 | 131 | 1.6% | 2299.6 | −0.4 | 1816 | 6.8 |
| s_spotoil | met | 3.3 | 121 | 1.5% | 2300.7 | +0.8 | 1761 | 7.4 |
| s_wearp75 | met | 3.3 | 123 | 1.5% | 2301.2 | +1.2 | 1765 | 7.6 |
| s_be6 | met | 0.6 | 30 | 1.5% | 2339.4 | +39.5 | 1799 | 6.8 |
| s_be7 | met | 3.5 | 118 | 1.3% | 2331.5 | +31.5 | 1735 | 6.8 |
| s_irpgas | met | 0.2 | 10 | 1.0% | 2486.4 | +186.4 | 1751 | 6.1 |

c6 under each standard. The standard barely moves c6: NTCSA's 20 GWh and the NEM's 0.002% give the same build; half the NEM adds 1.3 GW of wind and 1.5 GW of lithium in 2030 and costs R3.6bn more.

| | Engine PV, R bn | Mean unserved, highest year, GWh | Worst run, GWh | Open-cycle CF, highest year | CO2 2026-40, Mt | 2030 | 2035 | 2040 |
|---|---|---|---|---|---|---|---|---|
| c6, NTCSA 20 GWh | 2300.0 | 3.3 | 120 | 1.4% | 1760 | wind 8.4, solar 9.3, Li 3.4 GW, CCGT 0.0, open-cycle 0.0 | wind 25.9, solar 16.0, Li 9.1 GW, CCGT 2.9, open-cycle 0.2 | wind 33.6, solar 27.2, Li 13.0 GW, CCGT 8.0, open-cycle 0.9 |
| c6, s_std_strict | 2303.6 | 2.3 | 178 | 1.2% | 1731 | wind 9.7, solar 9.3, Li 4.9 GW, CCGT 0.0, open-cycle 0.2 | wind 27.2, solar 15.5, Li 9.0 GW, CCGT 2.9, open-cycle 0.2 | wind 33.7, solar 26.9, Li 13.0 GW, CCGT 8.1, open-cycle 0.9 |
| c6, s_std_nem | 2299.8 | 2.6 | 194 | 1.4% | 1760 | wind 8.4, solar 9.3, Li 3.4 GW, CCGT 0.0, open-cycle 0.0 | wind 25.9, solar 16.0, Li 9.1 GW, CCGT 2.9, open-cycle 0.2 | wind 33.6, solar 27.2, Li 13.0 GW, CCGT 8.0, open-cycle 0.9 |

Gas results as at 27 October 2026, before the government briefing on the Gas IPP Procurement Programme (28 October). [Briefing: one sentence to follow.]

Gas supply against the IRP's timing. The IRP build has 6 GW of new CCGT in 2029–30 (s_irpgas's 3,000 MW in each year). Industrial gas users place the gas cliff in mid-2028, when Sasol's pipeline gas to industry ends (Sasol bridges some customers with methane-rich gas from Secunda to June 2030), and see new LNG import terminals as unlikely before 2031 (IGUA-SA, Gas Roadmap for South Africa 2025–42, May 2026 update, as reported by Engineering News, 18 May 2026; the October 2026 edition and its 2031 terminal date are as reported by C. Yelland, EE Business Intelligence, 26 October 2026, not read here). c6 builds its first new gas in 2031 (268 MW), about 1 GW by 2033 and 3.1 GW by 2035, so it shares the risk on a smaller scale; s_gas2032, no new gas before 2032, costs R0.2bn less than c6, so in c6's plan a later gas date costs nothing. The IRP's 6 GW in 2029–30 depends on fuel that may not be there.

No new gas, with and without new diesel open-cycle, under each standard. Without new diesel peakers, no new gas fails NTCSA's unserved-energy criterion from 2037 under every standard. With them allowed, the optimiser builds 3.6–3.8 GW of diesel open-cycle by 2040, running at an open-cycle capacity factor of at most 1.3%, and the plan meets both NTCSA criteria, at R9–10bn above c6 and R42–51bn below no gas without peakers; it misses the stricter standards it was planned to in some years. "No new gas needs diesel peakers" holds under all three.

| Standard | Run | Meets its standard | Both NTCSA criteria | New diesel open-cycle MW, 2035 / 2036 / 2037 / 2038 / 2040 | Open-cycle CF, highest year | Mean unserved, highest year / worst run, GWh | PV, R bn | Against c6 | Against no gas |
|---|---|---|---|---|---|---|---|---|---|
| NTCSA 20 GWh | no new gas, no new peakers | no (2037-2040) | no: over 20 GWh in 2037, 2038, 2039, 2040 | 0 / 0 / 0 / 0 / 0 | 2.2% | 140.4 / 322 | 2350.8 | +50.8 | – |
| NTCSA 20 GWh | no new gas, peakers allowed | yes | yes | 0 / 124 / 1,124 / 1,790 / 3,709 | 1.3% | 7.2 / 162 | 2309.2 | +9.2 | -41.6 |
| Strict (half NEM) | no new gas, no new peakers | no (2035-2040) | no: over 20 GWh in 2037, 2038, 2039, 2040 | 0 / 0 / 0 / 0 / 0 | 1.8% | 121.1 / 302 | 2364.5 | +60.9 | – |
| Strict (half NEM) | no new gas, peakers allowed | no (2031-2040) | yes | 344 / 344 / 1,344 / 2,018 / 3,824 | 1.3% | 12.7 / 237 | 2313.7 | +10.1 | -50.7 |
| NEM 0.002% | no new gas, no new peakers | no (2035-2040) | no: over 20 GWh in 2037, 2038, 2039, 2040 | 0 / 0 / 0 / 0 / 0 | 1.9% | 115.3 / 277 | 2355.5 | +55.6 | – |
| NEM 0.002% | no new gas, peakers allowed | no (2036-2040) | yes | 0 / 159 / 1,159 / 1,826 / 3,633 | 1.3% | 12.4 / 257 | 2309.2 | +9.4 | -46.3 |

IRP comparison as at 27 October 2026, before the government briefing on the Gas IPP Procurement Programme (28 October). [Briefing: one sentence to follow.]

Nuclear timing risk. The IRP build includes IRP 2025's 5.2 GW of new nuclear from 2036 (s_be7's schedule). The site process is early: Eskom's draft scoping report (WSP, April 2026) names Thyspunt as the preferred site, and a full environmental impact assessment follows only if the Department of Forestry, Fisheries and the Environment accepts the scoping; the area holds a provisional Grade I heritage declaration (SAHRA, January 2025) to at least February 2027 (Daily Maverick, 14 April 2026). The draft EIA is now reported for the first quarter of 2027, with no authorisation and no vendor chosen (C. Yelland, EE Business Intelligence, 26 October 2026). A first unit in 2036 would leave about nine years from a draft EIA to operation. c6 builds no new nuclear, so the timing risk sits on the IRP side of the comparison.

The IRP 2025 build on c6's paths (Table 1's wind and solar, s_irpgas's gas with its 51% floor, s_be6's storage, s_be7's 5.2 GW of nuclear from 2036, coal on Figure 3's dates), checked by the same engine at c6's demand and at the IRP's own (2030 demand 7.0% below c6's):

| Run | 20 GWh | Strict (half NEM) | Mean unserved, highest year / worst run, GWh | Open-cycle CF, highest year | Engine PV, R bn | Against the optimised plan at the same demand | CO2 2030 / 2035 / 2040, Mt | CO2 2026-40, Mt | Restart line PV, R bn |
|---|---|---|---|---|---|---|---|---|---|
| IRP 2025 build, c6 demand | met | met | 0.00 / 0 | 0.17% | 2590.9 | +290.9 against c6 (2300.0) | 126.2 / 105.3 / 63.0 | 1741 (c6 1760) | 6.8 |
| IRP 2025 build, IRP 2025 demand | met | met | 0.00 / 0 | 0.11% | 2525.5 | +339.7 against c6_irpdem (2185.8) | 117.1 / 97.3 / 56.5 | 1614 (c6_irpdem 1703) | 6.8 |

Reliability explains little of the gap. The IRP build has no unserved energy in any year or run (mean 0.00 GWh, worst run 0), more than NTCSA's 20 GWh asks. c6 planned to the strictest standard run, half the NEM's 0.002% (s_std_strict), costs R2,303.6bn, R3.6bn more than c6's R2,300.0bn; the IRP build costs R2,590.9bn, R290.9bn more. Caveat: s_std_strict still has a mean of 2.3 GWh unserved in its highest year (178 GWh worst run); no run was planned to zero (RESULTS 'c6's 2026 coal and CO2 against Eskom's FY2026').

Curtailment, surplus wind and solar, TWh (the 1.3% stopgap on utility wind and solar comes on top in every run):

| Run | 2026 | 2030 | 2035 | 2040 | 2026–40 |
|---|---|---|---|---|---|
| c6 | 2.0 | 2.6 | 12.0 | 20.7 | 152.4 |
| IRP 2025 build, c6's demand | 4.8 | 3.3 | 16.9 | 44.3 | 255.4 |
| c6 at IRP 2025's demand (c6_irpdem) | 2.6 | 4.3 | 11.6 | 19.8 | 156.6 |
| IRP 2025 build, IRP 2025's demand | 5.6 | 8.7 | 22.1 | 50.1 | 322.9 |
| c5f (previous central, reference) | 0.0 | 0.0 | 4.3 | 11.3 | |

c6 curtails 7.2%, 3.4%, 7.7% and 9.8% of its available utility wind and solar in 2026, 2030, 2035 and 2040; about 11% in 2040 with the stopgap. The least-cost build minimises total system cost with no penalty on curtailment beyond the energy lost, so its curtailment is optimal only within the options modelled, where the only sinks for surplus are storage of all kinds (lithium, iron-air, flow, pumped storage). Electrolysers, flexible exports to SAPP, demand flexibility, virtual power plants, interruptible load and grid-enhancing technologies are outside c6's option set (limitation 22; the next note).

s_std_strict, the set planned to half of the NEM standard (about 2.2–2.8 GWh a year; up to 480 runs a year; open-cycle factor computed apart, as these checks predate it), judged against NTCSA's two criteria:

| Run | Both NTCSA criteria | Mean unserved, highest year, GWh | Worst run, GWh | Open-cycle capacity factor, highest year | Engine PV, R bn | Against c6, R bn | CO2 2026–40, Mt |
|---|---|---|---|---|---|---|---|
| c6 | met | 2.3 | 178 | 1.2% | 2303.6 | – | 1731 |
| s_gascapex25 | met | 3.1 | 218 | 1.8% | 2308.7 | +5.1 | 1704 |
| s_gas2032 | met | 2.6 | 181 | 1.2% | 2303.5 | −0.1 | 1731 |
| s_nogas | not met: unserved over 20 GWh in 2037, 2038, 2039, 2040 | 121.1 | 302 | 1.8% | 2364.5 | +60.9 | 1504 |
| s_imp | met | 1.9 | 190 | 1.1% | 2293.5 | −10.1 | 1726 |
| s_demlowflat | met | 2.3 | 131 | 1.2% | 1984.3 | −319.3 | 1685 |
| s_demlowm1 | met | 1.1 | 79 | 1.3% | 1898.5 | −405.1 | 1665 |
| c6_irpdem | met | 2.4 | 219 | 1.2% | 2185.6 | −118.0 | 1703 |
| s_coalpractice | met | 1.9 | 99 | 1.0% | 2321.9 | +18.3 | 1872 |
| s_mindn24 | met | 3.2 | 178 | 1.2% | 2297.3 | −6.3 | 1760 |
| s_rate48 | met | 2.3 | 168 | 1.3% | 2303.1 | −0.5 | 1778 |
| s_spotoil | met | 2.3 | 177 | 1.2% | 2304.6 | +0.9 | 1732 |
| s_wearp75 | met | 2.3 | 178 | 1.3% | 2305.0 | +1.4 | 1733 |

s_nogas under the strict standard is at 20.0 GWh in 2037, inside its ±1.6 GWh interval, and well over 20 GWh in 2038–2040.

### c5e against IRP 2025 Table 1, and the sensitivities (superseded by c6; the record of the previous central)

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
| s_carbonfull | Carbon tax at the full statutory rate (d) | +299.3 | -265.1 | +302.7 | yes |
| s_irpgas | IRP 2025's gas plan (d) | +202.7 | -29.9 | +150.9 | yes |
| s_comply_full | Coal emissions compliance, full (d) | +171.1 (with charge) | -2.0 | -0.0 | no |
| s_disc113 | Discount rate 11.3% | +123.0 | +120.1 | not comparable (a) | not judged |
| s_bw6capex | Wind and solar capex at BW6 bids (wind R28,462/kW, solar R16,786/kW), the high end of the evidence | +110.1 | +203.0 | +100.8 | yes |
| s_detgas | Determined gas: 3,000 MW by 2030 (IRP 2019 section 34) plus 5,000 MW in 2031–37 (GN 8021), additional on our reading (d) | +81.3 | +114.9 | +46.3 | yes |
| s_disc10 | Discount rate 10% | +75.0 | +80.6 | not comparable (a) | not judged |
| s_roof2 | Rooftop 2,000 MW a year (b) | +54.1 | -7.4 | +48.0 | yes |
| s_comply_comp | Coal emissions compliance, Eskom's recommended plan | +52.3 (with charge) | +0.0 | -0.0 | no |
| s_prm10 | Planning reserve margin 10% over peak (the c5c rule) | +35.5 | +14.1 | +32.2 | yes |
| s_be7 | IRP nuclear forced: 1,250 MW in 2036–37, 1,350 MW in 2038–39 | +35.5 | -18.8 | -46.8 | no |
| s_be6 | Battery storage on IRP 2025's Table 1 schedule (c) | +33.5 | +55.6 | +19.7 | yes |
| s_nogas4strict | No new gas or diesel open-cycle; lithium up to 4 GW a year | +28.0 (top-up) | -228.9 | +45.2 | yes |
| s_noimp | No imports after 2030 (s_imp2030) | +25.7 | +26.5 | +55.8 | yes |
| s_committed | Committed gas (1,200 MW a year 2030–33, 200 MW in 2034) and lithium minimums (d) | +24.8 | +115.2 | +19.6 | yes |
| s_wind372 | New wind at BW6 bids' 37.2%, c5e's capex held | +24.0 | +97.0 | +36.9 | yes |
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
(c) Since 17 Oct 2026 (message 185 (3)): cumulative new battery storage (lithium, vanadium flow and iron-air) capped at IRP 2025 Table 1's storage column year by year, Eskom BESS included (144, 294, 909 and 3,524 MW by 2026-29, +200 MW a year in 2030-35, +500 in 2036-40, 7,224 MW by 2040; IRP 2025, Table 1, p.31; public_data/irp2025_extract.csv), never below the committed floor (STOR_CUM; run s_be6t1_c5e). As first run, lithium at 550 MW a year (the build LP's BLD_PACE.irp): +R25.2bn, +67.8 Mt, +R14.5bn.
(d) Rerun 17 Oct 2026 with no coal retired ahead of Figure 3 before 2029 (RC_FROM=2029, the pathway's default from then; messages 185 (2) and 187 (1); runs *_rc29_c5e). As first run, when the optimiser could retire coal from 2026 (engine PV / CO2 / objective against the null, and the MW retired from 2026): s_irpgas +185.4 / -128.9 / +136.1, 6,185 MW; s_comply_full +154.2 / -100.6 / -6.5, 2,955 MW; s_detgas +79.4 / -1.5 / +45.9, 1,422 MW; s_carbonfull +294.0 / -285.4 / +302.1, 1,256 MW; s_committed +22.5 / +81.7 / +19.0, 609 MW. On the rerun only s_irpgas (5,772 MW from 2029) and s_comply_full (71 MW from 2029) retire coal early.

What the author takes from the table (RESULTS 'New central c5e'; 'Reviewer pack on c5e'):

- Pass mark 5, set before the runs: the two cost measures move the same way on 23 of the 28 comparable runs. Three of the exceptions are structural: the compliance charge (s_comply_comp, s_comply_full) and s_be7's forced nuclear capital sit outside the objective. s_coalme (engine -R0.5bn, objective +R21.8bn) and s_be4 (-R1.7bn, +R6.3bn) move engine PV by under R2bn and are not traced.
- s_nogas4strict fails the standard in 2034–40 as solved (largest 8.34 GWh in 2037, against a target of 2.58). Its mean unserved energy stays below NTCSA's 20 GWh a year in every year; its worst single run is 103–218 GWh a year from 2033. 1,250 MW of diesel open-cycle in 2034–37 closes the gap for +R7.4bn, +R28.0bn against the null; on c5d it needed 1,500 MW.
- Determined gas costs +R81.3bn on the engine and +R46.3bn on the objective against least cost. The IRP's gas beyond the determinations accounts for R121.4bn of s_irpgas's engine premium (R104.6bn on the objective). With no coal retired before 2029 (d), s_irpgas retires 5,772 MW from 2029, when the forced gas arrives, and cuts CO2 by 29.9 Mt against the null; when the optimiser could retire coal from 2026 it retired 6,185 MW that year and cut 128.9 Mt. The same holds for s_comply_full (2.0 Mt instead of 100.6) and s_detgas (+114.9 Mt instead of -1.5): most of their CO2 cut came from coal closed in 2026-28 (RESULTS 'RC_FROM=2029 is the pathway's default').
- s_li8h: the 4-hour lithium energy cap binds on c5e in 2039 only, at 12,000 MWh; with 8 hours the run builds 12,714 MWh that year, and engine PV moves -R0.1bn and CO2 -0.5 Mt. On c5d it did not bind. For reference, Modo Energy puts the marginal value of a battery's second hour in the Netherlands, January–September 2026, at EUR 92k/MW-yr and of its fourth at EUR 14k, in a market where balancing services dominate battery revenue (SOURCES 'Modo Energy: Netherlands battery revenue by duration').
- s_committed raises CO2 by 115.2 Mt on c5e with no coal retired before 2029 (81.7 as first run, 18.6 on c5d), and s_be6 on Table 1's storage schedule by 55.6 Mt (67.8 at 550 MW a year of lithium, 22.6 on c5d). In the first runs, existing coal makes up energy the optimiser no longer builds wind, solar and lithium for: s_committed's gas and lithium minimums give 2030–33 their firm capacity, so it defers 2.8 GW of 2028–29 wind to 2033–38 and drops 3.6 GW of 2032–33 solar (coal +78.9 TWh, 2028–36); s_be6's 550 MW a year cuts 4.7 GW of lithium and 10.8 GW of solar, replaced by wind, coal (+61.6 TWh) and gas. s_committed's larger effect on c5e goes with its dearer wind: its null builds only the committed wind in 2026–27 and stays below the 2.5 GW cap in 2028, where c5d's built at the cap; s_be6's larger effect on c5e is not fully traced (RESULTS 's_committed and s_be6 on c5e, by carrier and year').
- s_constr (a sensitivity only, not in the table): with the committed floors raised to the projects confirmed under construction from pages read (wind 2,105.5 MW by 2027, solar 3,210 MW by 2028), engine PV rises R1.9bn and CO2 falls 12.5 Mt, mostly in 2026–28; wind and solar arrive earlier, the totals by 2040 do not change; adequate after two passes (RESULTS 's_constr on c5e'). With Karreebosch, Ukuqala and Teraco added (s_constr2: wind 2,245.5 MW by 2027, solar 3,405 MW by 2028), +R2.0bn and -15.0 Mt, adequate after two passes (RESULTS 's_constr's floors, by project and year').
- Every other run's engine check is below target in every year (caveat above): 8 runs after one pass, 22 after two.

---

## 5. Known limitations

Finding (c6 where marked; otherwise as written for c5e): the material limits are structural. The plan is chosen on one node with sampled days. Its adequacy is judged by a heuristic engine that is close to an optimum in ordinary weeks but not at the end of stress weeks. Several inputs that drive the build are unsourced or rest on readings of IRP figures.

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
13. Coal operation (c6; section 1b). The minimums are sourced as fleet-level figures (the practice floor calibrated to Eskom's 2026 operation, the design minimums class averages of Eskom's design figures), and Kelvin sits inside the scaled 39,692 MW (SOURCES 'Kelvin power station'). Where the coal treatment departs from standard practice:
    Each is on the list for after the note unless marked built. Effect given where it has been measured (RESULTS 'c6 PR C', '369', '370' and 'Coal commitment against standard practice').

    1. Commitment by a cost-weighing rule (4-hour blocks, cheapest first, kept on when restarting costs more), not a unit-commitment optimisation (PLEXOS and peers solve a mixed-integer commitment over a rolling horizon). Measured: starts per unit a year 19 in the 2026 replay against Eskom's costing assumption of about 12 and Australia's about 7; 28 in Least-cost path 2035. Against a mixed-integer optimum on the same rules: 1.3% dearer in Least-cost path 2035 and at most 1.9% above the solver's bound in 2026, but the optimum cycles coal about five times as often in 2035 (147 against 28 starts; 41 against 2 two-shift days in 56) and twice as often in 2026, which real practice does not: real cycling costs are probably above NREL's lower bounds.
    2. Start-up time (built in c6): 2 / 6 / 10 hours to synchronise hot, warm and cold, then loading at the ramp; the warm time is unsourced. Measured: 2026 starts 27 to 19 and two-shifting ends; Least-cost path 2035 starts 70 to 28, curtailment 6.2 to 8.7 TWh. Not modelled: a unit cannot be re-committed within the day for an unforeseen shortfall.
    3. Synchronous floor as a national MW total (6 GW, plus grid-forming batteries at 0.30 of their power, unsourced), not a minimum number of synchronous units by region, as in AEMO's system strength practice. Measured: counting imports out and nuclear and hydro at their output adds about 0.9 TWh of curtailment in Least-cost path 2035 and raises the coal-curtailment scenario's curtailed fuel from R14.8bn to R21.8bn.
    4. Reserve limited by ramp (built in c6 for the ten-minute reserve, in the engine's reserve accounting only): instantaneous reserve is governor response and is not capped, pending a sourced primary-response share; regulating is not capped; the build optimiser does not cap reserve by ramp. Measured: capping all three products by the fleet ramp would report 2.4 TWh of reserve shortfall in 2026, which the real system does not show; with the ten-minute cap alone, 0.6 GWh.
    5. Perfect foresight: commitment sees the hours it commits for. Measured: committing on yesterday's net load instead, Least-cost path 2035 sheds about 250 GWh a year against 3 and curtails 3.4-3.8 TWh more; on half that error, 1.4-1.9 TWh more (upper bounds: no re-commitment within the day).
    6. The 2026-2029 practice floor (0.75) is one proxy for several causes: units not reaching their design minimum when asked, operators keeping units online for the peaks, and caution after load-shedding years. Its end in 2029 follows SAWEM's phasing (Krutham, October 2026, p.2; section 1b). Measured: it makes 2026 curtail about 1.1 TWh a year (0.2 TWh in the one-year default run) and gives a 5.5 GW winter midday peak against NTCSA's reported 3 GW (at 0.75 with the start-up time; 4.8 GW at 0.77 before it).
    7. Minimum up and down times (8 and 4 hours for 97% of capacity) from PyPSA-RSA's fleet, not Eskom. Measured: 24 hours down cuts starts to 24.5 (2026) and 66 (Least-cost path 2035), but the latter then sheds 229 GWh against 3.
    8. Start costs are NREL/Intertek's lower bounds; cycling's effect on forced outages is now costed (NREL table 1-1's EFOR impact, built), restart risk is not. Measured: pricing all start fuel at coal, a cheaper start, doubled 2026's starts (29 to 63, before the start-up time); the MIP finding (item 1) suggests real cycling costs are higher still; the 75th-percentile wear is a named result (s_wearp75).
    9. Curtailed renewables are not paid (no deemed energy), so curtailment looks free. Measured (at a 0.77 floor, before the start-up time): in 2026, R217.8bn against R219.1bn at 0.60, the difference mostly PPA payments not made on curtailed output.
    10. Restarts after forced outages are not costed, in the engine or the optimiser: forced outages are drawn unit by unit but applied as a fleet availability cap, so a returning unit never starts (operators and unit-commitment models charge each return as a start). Measured on c6's run under the strict standard: 5.6 returns per unit a year, costed as cold starts at R0.9bn in 2026 falling to R0.4bn in 2040 with the fleet, R10.2bn over 2026–40 undiscounted (R11.9bn with the forced-outage term), about 0.4% of system cost. Shown as its own line in every cost table, a cost-only adjustment; in the optimiser it could shift early retirement only at the margin (RESULTS 'Restarts after forced outages are not costed').
14. Imports end after 2030 in c6 (PR B): the IRP is silent on what follows the Cahora Bassa contract, and ties Mozal's exit to its end, which the 2026 data does not show; s_imp keeps them to 2040. Priced at Eskom's FY2026 R897/MWh in both the engine and the optimiser.
15. Carbon. Allowances rest on second-hand reporting, and price neutrality is not modelled.
16. Licences. PyPSA-RSA data is AGPL v3 but listed as MIT in the project's licence file. Use of NTCSA's GCCA data is not clearly permitted. Both are pending (SOURCES 'PyPSA-RSA: licence'; 'NTCSA GCCA 2025 data').
17. Avon and Dedisa. These two IPP open-cycle plants (1,005 MW) run on their contracts until they end (Dedisa end-2030, Avon 20 July 2031) at 268 GWh a year in c6 (Eskom performance report FY2026, p.20), on the monthly daytime and evening-peak shape of Eskom's January–August 2026 data; c5e and c5f ran them at 899 GWh. Fuel and CO2 at the diesel fleet's rates.
18. Reserve rule. Since build 14m the engine and the optimiser hold the 2,200 MW operating reserve by product, following NTCSA's ASTR 2026/27–2030/31; open-cycle plant and interruptible load count only as emergency reserve. What remains: the sustain times for regulating (60 minutes) and ten-minute reserve (30 minutes) are borrowed from CAISO; the requirement is held at 2030/31's level after 2031 (the document's last year), which understates it in the high-renewable years; interruptible load (1,000 MW) is called after open-cycle plant by the author's decision, since the ASTR sets no order; and on c5b_14r's engine (14r) holding pumped-storage energy for reserve took 2025 pumped-storage output to 3.3 TWh, below the benchmark band; on c5d's and c5e's engine it is 3.6 TWh, inside it (section 2) (RESULTS 'ASTR reserve rule'; 'Storage reserve decided with dispatch'; 'Interruptible load cap tried and withdrawn').
19. Perfect foresight in dispatch. The engine's look-aheads read the run's own future demand, wind and solar: 48 hours for batteries and pumped storage (engine fix (B)), 24 hours for coal commitment, 12 hours for coal ramping, a week for long-duration stores. Coal outages are held at the current hour's state rather than foreseen. A real operator works from forecasts with error, so the engine tends to understate operating cost, peaker and diesel use, shortfall and unserved energy, and to overstate what storage can do, most in renewable-heavy years. The PyPSA cross-check uses the same foresight, so it cannot catch this. Not changed; measuring it needs forecasts with realistic error, which the ten-day outlook (TODO 14ea) would supply (RESULTS 'Known limitation: the engine's look-aheads read the actual future'). For scale only: Modo Energy applies a 0.80 calibration, from backtests, to its battery revenue figures for the Netherlands (January–September 2026); it is a reference for the size of the foresight effect, not a correction applied here (SOURCES 'Modo Energy: Netherlands battery revenue by duration'). Coal commitment tested on a forecast (c6's rules on Least-cost path 2035): with yesterday's net load as the forecast, starts barely move but about 250 GWh a year is shed against 3, and curtailment rises 3.4–3.8 TWh; with half that error, 1–2 GWh more is shed. The engine does not re-commit within the day, as operators do, so these are upper bounds (RESULTS 'Coal commitment against standard practice').
20. No emissions compliance cost on coal running past 2030. Eskom told the NCOP select committee on 10 June 2025 that full compliance with the Minimum Emission Standards would need about R257bn of capital plus R6.3bn a year, and its recommended plan R77bn plus R2.1bn a year (sulphur dioxide at Kusile and Medupi; particulates and nitrogen oxides at six stations) (PMG; Sunday Independent/IOL, 21 June 2025). Medupi's flue-gas desulphurisation alone is estimated at R41.7bn (Eskom's FY2026 integrated report, as reported by Business Day, 2 September 2026). The model charges none of this, so coal kept past 2030 looks cheaper than it is, and s_coal60's saving on c5e (R14.3bn of engine PV against the null) excludes it. The rand year of Eskom's figures is not stated. A sensitivity is being built (COMPLY, TODO 14em).
21. New gas deliverability. The optimiser can build CCGT and open-cycle gas from 2030 at its stated capex. Wood Mackenzie (1 April 2026, as reported by Power Engineering and Utility Dive) expects turbine prices near USD 600/kW by end-2027, nearly triple 2019, with lead times of about six years and order books sold through 2027. New gas from 2030 may not be deliverable on those lead times, and its capex may be understated; neither is modelled (SOURCES 'Gas turbine supply').
22. Options the optimiser cannot choose. The build LP cannot choose coal flexibility, virtual power plants, demand response (interruptible or shifted load) or a general long-duration store; their effect on cost and adequacy is not in any run. They are the first batch of new options after the note (HANDOVER 'c5 options'). The same holds for the sinks for surplus wind and solar: c6's build minimises total system cost with no penalty on curtailment, so its curtailment (section 4) is optimal only within the options modelled, where storage of all kinds is the only sink; electrolysers, flexible exports to SAPP, demand flexibility, virtual power plants, interruptible load and grid-enhancing technologies are outside its option set (c6 curtails 9.8% of its available utility wind and solar in 2040). Coal minimum stable levels in the code (build 2026-10-16a): the build LP holds committed coal at no less than 0.65 of what is committed (bldCoalMinFrac), with commitment moving by at most available coal / 48 per hour; the engine's unit commitment uses each station row's own minimum, 0.65 on 15 rows (Arnot, Duvha, Grootvlei, Hendrina part, Kelvin, Kriel, Lethabo part, Matla, Tutuka) and 0.50 on 16 (Camden, Hendrina part, Kendal, Komati, Kusile, Lethabo part, Majuba, Matimba, Medupi), 0.563 weighted by capacity over 41,530 MW (UC_FLEET). The 0.50 is the project's own change to Meridian's data, unsourced (SOURCES 'UC_FLEET minimum stable level 0.5'); the engine's fleet-average curve (0.54–0.65) is not used while unit commitment is on.
23. Midday coal commitment, curtailment and deemed energy (user, 16 Oct 2026, message 143 (3), and 17 Oct 2026, message 180 (1); RESULTS 'The 2026 replay curtails almost nothing for oversupply'). Today's midday curtailment comes from coal given priority over wind and solar: the System Operator keeps coal online at minimum stable level through daylight for the morning and evening peaks and curtails renewables last, up to 3 GW on a winter day in 2026 (NTCSA, as reported by SAPVIA and Engineering News, 30 Jul 2026). The engine instead takes coal units off over midday in 4-hour commitment blocks (BLOCK_HOURS). In c5e, the engine's midday coal decommitment costs about R1.8bn (0.8% of that year's engine cost) more than holding every coal unit at a 0.75 minimum in 2026 and R2.4bn (1.0%) more in 2030, and about R2.0bn (0.8%) less in 2035 (12 weather years; 10 draws in 2026 and 20 in 2030 and 2035, as in c5e's own engine check; no start-up costs) (RESULTS 'Coal priority in c5e's 2026'). The planned wholesale market (SAWEM) is designed to produce economic dispatch, and NERSA's roadmap has the market's external simulation running into early 2027 (W. Mkhize, NERSA, webinar of 14 Oct 2026, slide 12; SOURCES 'NERSA: wholesale market roadmap'). So the 2026 replay's near-absence of oversupply curtailment understates curtailment, midday coal burn and deemed energy mainly in 2026–27, if the market starts on time. A market changes the incentive, not unit minimums or restart times, so some midday coal remains and the engine's 4-hour blocks may still understate curtailment after 2027. Deemed energy for curtailed REIPPPP output is not in the engine's cost: upper bound R11.3bn on c5e over 2026–40 (R6.5bn in present value at 8%; c5d R13.7bn and R7.8bn) (RESULTS 'Reviewer pack on c5e'). For scale: c5e curtails 7.0% of its utility wind and solar in 2040 (5.7% surplus plus the 1.3% stopgap; 4.0% in 2035), against 2.2–10% in European systems (UK 10%, 2024; Ireland 9.7%, 2023; Germany 6.8%, 2023; Netherlands 4.9%, 2024; Spain 2.2%, 2024; methods differ; Beyond Fossil Fuels, Ember, E3G and IEEFA, May 2025, p.18) (RESULTS 'c5e's curtailment against Europe's').
24. Degradation is not modelled (user, 17 Oct 2026, message 163). Meridian's best estimates are 0.3% a year for wind and 0.5% for solar PV (Meridian Economics, June 2020, Table 1, p.iii). At 8% over 25 years, with degradation from year 2, levelised output falls 2.42% (wind) and 3.99% (solar); from year 1, 2.71% and 4.47%. On c5e's basis the omission cancels in the cost per MWh, which stays at the tariff; lifetime output per MW is overstated by those amounts, so capacity is understated for a given energy, and capex per kW is overstated: wind R20,879 against R20,272 (2.9%), solar R11,038 against R10,476 (5.1%). On c5d's basis, with capex fixed, cost per MWh was understated by 2.5% (wind) and 4.2% (solar) (RESULTS 'Degradation is not modelled').
25. Private plant and NTCSA's rooftop estimate (user, 17 Oct 2026, messages 187 (2), 188, 190 (1), 191 (1)-(2) and 193 (1)). c5e's base omits Msenge Emoyeni wind, 69 MW, wheeled to Sasolburg since October 2024 (Sasol release, 10 Oct 2024); the next central loads it. One rule applies to all private solar: NTCSA's rooftop PV estimate counts all PV without contracts with NTCSA, ground-mounted included (Weekly System Status Report 2026 week 25, p.6), and c5e's rooftop is that estimate for August 2026, 9,430.1 MW, less the 488 MW of wheeled solar c5e loads as utility solar (Mooi Plaats 240, Bolobedu 148, ARM Platinum 100). If wheeled plants are inside the estimate, the assumption, every private solar plant is counted once: the 488 MW as utility solar, and Selemela 2 and 3, Damlaagte and Springbok (about 450 MW) as rooftop, on the rooftop profile. If they are not, because a wheeling plant's network-use agreement counts as a contract with NTCSA, c5e's 2026 base is about 0.94 GW short: 488 MW taken off rooftop that the estimate never held, and about 450 MW of wheeled solar missing. Captive solar behind the meter (88 MW in the H1 2026 monitor) is inside the estimate either way. No model change before the note. (RESULTS 'Private wheeled plant operating since 2024-25') Castle wind, 89 MW, wheeled to Sibanye-Stillwater since 1 April 2025 (Sibanye-Stillwater SENS, 1 Apr 2025; Energize, 15 Apr 2025), is not in the base of c5e or c5f but is one of the plants behind their committed 2026 wind floor, so both carry it from 2026 as new build and charge it new-build capital, about R1.9bn overnight (effect on engine PV not measured); c5e left its load out of demand and c5f adds it back (0.277 TWh a year), so in c5f it serves its own load. The next central moves it from the floor to the base. (RESULTS 'New central c5f')
26. Koeberg runs flat at 0.66 sent-out in every hour, with no refuelling outages. In 2025 and 2026 its output fell in winter (May–August at about 0.65 of the annual mean), so for 2026–2030 the flat derate is optimistic in the season when adequacy binds; it would be conservative only if refuelling were kept out of winter, as an operator plans it. s_koeberg_winter repeats the 2025–26 monthly shape at the same annual factor. Whole-unit refuelling outages, placed as Eskom schedules them, are after the note (RESULTS 'Restarts after forced outages are not costed'; derived from Eskom data, analysis ours).
27. 2026 against Eskom's reported totals (c6; section 2). c6 carries firm exports only (6.6 TWh against Eskom's 14.5 TWh in FY2026, about 8.7 on the 2026 trend), so its coal and CO2 cover domestic load and firm exports and are below Eskom's reported totals by the non-firm exports' share. And c6 runs plant commissioned during 2026, or not yet, for the whole year: no plant is counted twice, but its 2026 fleet in service is about 4.78 GW of wind against 5.81 and 3.31 GW of utility solar against 4.29 (each plant's months in service; Eskom's metered installed capacity for the contracted fleet). Corrected, 2026 coal is 151.5 TWh against 146.8 (+4.7), CO2 168.6 Mt against 163.5 (+5.1), coal's share of generation 74.9% against 72.5%; 2026 only. Separately, the demand series adds rooftop back on 2025's sunny solar profile while the engine check removes it on twelve weather years, so c6's grid load is about 1.7 TWh a year above the measured base in every year (about 1.5 TWh of coal a year; not fixed). On January–August 2026, Ember reads coal 80.5%, solar 8.0% and wind 4.8% of generation; c6, corrected, 75.7%, 10.8% and 7.3%, with private wind (which Ember does not count) and rooftop 11% above Ember's estimate (RESULTS 'c6's 2026 fleet, plant by plant'). Rooftop: 2025's 6,532 MW and 2026's 8,942 MW are the same NTCSA series on different bases (2025 an annual mean less wheeled solar, 2026 the August point less only H1 2026 wheeled solar); on 2025's basis 2026 is about 8,050–8,180 MW, and 297.5 MW of named wheeled solar (Selemela 2 and 3, Damlaagte) sits inside c6's rooftop. Neither moves 2026 coal, since the demand series adds back what the engine removes; from 2027 c6's rooftop grows 1,200 MW a year from 8,942, against a recent pace near 2,400 (RESULTS 'Rooftop: the two figures are one series on two bases').
28. Drought risk to imports. c6 runs imports at the measured April–August 2026 flow (1,066 MW, 9.3 TWh a year) to 2030, mostly Cahora Bassa, with no drought case. The Zambezi River Authority has cut Kariba's 2027 water allocation for power from 36 to 23 billion cubic metres (−36%) on forecasts of a strong El Niño (The Herald, Harare, October 2026; Lusaka Times, 20 October 2026); Cahora Bassa lies downstream on the same river, so a drought year can cut what it sends south. An imports-drought sensitivity is for the next note (TODO 14jg).


Known failures in the suite (build 2026-10-24a: node checks 957/982 plus audit 88/88, eng5 6/6; each with its cause in RESULTS, none relaxed):

- validate_findings: with gas, 20 GW of 100-hour iron-air barely moves July (the finding is kept out of the note and the pack until settled).
- validate_consistency: high-season off-peak is the cheapest block modelled (the check's premise is contradicted by the 2026/27 tariff booklet; to be replaced).
- validate_benchmarks: peakerSeasonRatio's plausibility; and the 2025 replay's CO2 against Ember's (184.6 against 160.3 Mt: Ember applies a fixed coal factor of 0.900 t CO2e per MWh net, Eskom measured 1.108 t per MWh sent out; kept failing until Ember's basis is reconciled).
- validate_invariants: unserved energy rises from 2,200 to 6,000 MW of reserve in one stressed draw: restoring reserve spends stored energy a later hour needed (TODO 14iy).
- validate_pathway_presets: the presets built on c5f's runs differ from the engine's c6 coal rules and inputs until the presets build, which follows this pack.
- New with PR C, each traced to a coal setting and kept failing pending the author's review (RESULTS 'c6 PR C'): three published findings of the engine before PR C (demand response reversing at a 30% shift; a build rate wasting more when sustained longer; a low build rate staying at the congestion floor), which the practice floor and start-cost weighing move, to be restated on c6; curtailment at defaults (0.2 TWh a year, the floor's intended effect); the average-cost and coal-curtailment anchors (start costs, weighing and the synchronous floor); interruptible load never called in Today 2026, with more coal online; the shadow hourly price spread, flattened by more coal online at midday.
- No longer failing from build 2026-10-24a: EDMSA Scenario A's 2035 CO2 is within 22 Mt of the published figure; eng5's check that storage cuts unserved energy passes.

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
- c6 PR A, inputs on build 2026-10-22e …, 22 Oct 2026
- Coal report for c6, measurements …, 22-23 Oct 2026
- c6 PR B, build 2026-10-23a …, 23 Oct 2026
- Coal commitment against standard practice; commitment on a forecast; reserve on committed coal …, 24 Oct 2026
- c6 PR C, build 2026-10-24a: the coal central …, 24 Oct 2026
- c6 PR C, message 369 (a)-(e) …, 24 Oct 2026
- c6 PR C, message 370: the MIP benchmark of coal commitment … ('370' in the text), 24 Oct 2026
- Restarts after forced outages are not costed …, 25 Oct 2026
- Message 376: c6 meets both criteria of NTCSA's medium-term adequacy test (wording corrected, message 381) …, 25 Oct 2026
