# GridTwin ZA reviewer documentation

## About

This document provides an overview of GridTwin ZA's least-cost pathway for South Africa's power system to 2040, and a comparison with the government's latest Integrated Resource Plan (IRP 2025). Both plans are run through GridTwin ZA's model on the same inputs.

GridTwin ZA is a model of South Africa's power system built by Nick Hedley. It uses a build optimiser, which chooses what to build each year to 2040 at the least total cost, as well as an hourly simulation engine, which runs each year's system through twelve years of historical weather (2014-2025) and includes random plant breakdowns. If a year falls short of reliability standards, the build optimiser considers what is needed to restore reliability. The country is modelled as a single node, so the model doesn't see transmission limits within the country (our 10-node engine is a work in progress).

Notes:

- All rand totals are present values over 2026-40 at an <!--fill:page.discr-->8%<!--/fill--> real discount rate, in 2026 rands. CO2 totals are summed over the same 15 years. "System cost" is the hourly model's cost of running the system over 2026-40, in present value.
- Some inputs and annual totals are derived from two Eskom hourly datasets obtained on request. Eskom is credited for the data; the analysis is ours.

## Main findings

- What gets built: Over 2026-40, GridTwin ZA's least-cost pathway adds <!--fill:base.addgwr_wind-->31<!--/fill--> GW of new wind, <!--fill:base.addgwr_solar-->34<!--/fill--> GW of new utility-scale solar, <!--fill:base.addgwr_rooftop-->18<!--/fill--> GW of new rooftop solar, <!--fill:base.addgwr_batt-->15<!--/fill--> GW of new batteries, <!--fill:base.addgwr_gas-->7<!--/fill--> GW of gas, and no nuclear (these figures are in addition to the fleet installed at the start of 2026). The official IRP 2025 plan adds more wind (<!--fill:irp.addgwr_wind-->36<!--/fill--> GW of new wind), less utility-scale solar (<!--fill:irp.addgwr_solar-->26<!--/fill--> GW), less than half the batteries (<!--fill:irp.addgwr_batt-->7<!--/fill--> GW), more than twice the gas (<!--fill:irp.addgwr_gas-->17<!--/fill--> GW) and <!--fill:irp.addgw_nuclear-->5.2<!--/fill--> GW of nuclear. Coal capacity falls from <!--fill:base.coalgw_2026-->39.7<!--/fill--> GW to <!--fill:base.coalgw_2040-->17.9<!--/fill--> GW in both cases. The tables in the 'Build plan' section below give a breakdown of new build by year.
- Reliability: GridTwin ZA's least-cost pathway passes the NTCSA's adequacy test in every year to 2040. Unserved energy peaks at <!--fill:base.maxmean-->5.5<!--/fill--> GWh a year and peaking plants run at most <!--fill:base.ocmax-->1.9%<!--/fill--> of the time.
  - The NTCSA's adequacy test allows at most 20 GWh of unserved energy a year, and requires peaking plants (open-cycle turbines) to run less than 6% of the time.
  - Against Australia's much stricter standard (unserved energy at most 0.002% of demand, which translates to about <!--fill:base.nemlimits-->4-5.5 GWh<!--/fill--> a year at South Africa's demand levels), the plan meets the limit every year, but sits at about the limit in <!--fill:base.nemnearyears-->2031-32<!--/fill-->.
- Cost and emissions: Over 2026-40, the least-cost plan costs <!--fill:base.pvbn-->R2,315 billion<!--/fill--> in present value terms (with an <!--fill:page.discr-->8%<!--/fill--> real discount rate applied) and emits <!--fill:base.co2-->1,739<!--/fill--> Mt of CO2. Annual emissions fall from <!--fill:base.co2r_2026-->167<!--/fill--> Mt in 2026 to <!--fill:base.co2r_2040-->68<!--/fill--> Mt in 2040.
- Against IRP 2025: Relative to GridTwin ZA's least-cost pathway, the IRP 2025's build plan sees system costs rise <!--fill:irp.gapbn-->R368 billion<!--/fill--> over 2026-40, though emissions are marginally lower (<!--fill:irp.cutmt-->8 Mt<!--/fill--> less CO2 over the 15 years).
- Gas timing: The plan builds no new gas before 2035, given procurement delays (the first gas bid window appointed no bidders), uncertainty over LNG import infrastructure, and five-year turbine backlogs. Our least-cost pathway adds <!--fill:base.gasgw_2035-->1.2<!--/fill--> GW of gas by 2035 and <!--fill:base.gasgw_2040-->7.2<!--/fill--> GW in total by 2040. Gas runs at a <!--fill:base.gascfr_2035-->5%<!--/fill--> capacity factor in 2035 and <!--fill:base.gascfr_2040-->8%<!--/fill--> in 2040, meaning it operates as backup capacity. Allowing gas from 2032 changes the plan's cost by <!--fill:s_gas2032.dpvabsplain-->less than R1 billion<!--/fill-->.
- Applying IRP 2025's gas minimum: IRP 2025 requires 6 GW of new gas plants (CCGT) to run at least 51% of the time from 2030. IRP 2025's gas build, run with this minimum, raises system costs per unit of electricity by <!--fill:s_irpgas.avgcostpctplain-->12-16%<!--/fill--> over 2030-40 relative to our least-cost pathway, or <!--fill:s_irpgas.dpvabsbn-->R198 billion<!--/fill--> in present value terms. The government says the minimum is there to anchor LNG imports for industrial gas users, but all electricity consumers – manufacturers included – would carry the cost. Applied on its own to our pathway's gas plants, which arrive from 2035, the minimum adds <!--fill:s_gasfloor.dpvabsbn-->R26 billion<!--/fill--> and raises costs per unit of electricity by <!--fill:s_gasfloor.avgcostpctr_2040-->8%<!--/fill--> by 2040 (so much of the <!--fill:s_irpgas.avgcostpctplain-->12-16%<!--/fill--> comes from IRP 2025's larger and earlier gas build). The forced gas displaces coal, cutting CO2 by <!--fill:s_gasfloor.dco2absmt-->15<!--/fill--> Mt over 2026-40, but adds <!--fill:s_gasfloor.dcurt_2040-->11.5<!--/fill--> TWh of wind and solar curtailment in 2040.
- Cost of capital: Our central pathway finances each technology at its own cost of capital for state-backed projects. In real terms, we apply a capital cost of <!--fill:page.cocr.pv-->5.5%<!--/fill--> for wind and solar, <!--fill:page.cocr.batt-->6.8%<!--/fill--> for batteries, and <!--fill:page.cocr.ccgt-->8%<!--/fill--> for gas (we calculated financing costs from actual bid results where possible, and applied cost-of-capital gaps between technologies using a 2025 study by CEPA). Using a single <!--fill:page.cocr.planning.pv-->8%<!--/fill--> rate for every technology, as some planning studies do, adds <!--fill:s_cocplan.dpvabsbn-->R83 billion<!--/fill--> to system costs. If wind, solar and battery projects are instead financed as if all are built outside the state's procurement process (implying that financing costs are <!--fill:page.privrange-->1.5-2<!--/fill--> percentage points higher), system costs rise by <!--fill:s_cocprivate.dpvabsbn-->R57 billion<!--/fill-->.
- No gas: A plan with no gas, using wind, solar and batteries with diesel peakers as backup, passes NTCSA's adequacy test in every year to 2040. It costs only <!--fill:s_nogas_dsl.dpvabsbn-->R13 billion<!--/fill--> more over 2026-40 (<!--fill:s_nogas_dsl.dpvpctplain-->0.6%<!--/fill-->) and emits <!--fill:s_nogas_dsl.dco2absmt-->106<!--/fill--> Mt less CO2. It adds <!--fill:s_nogas_dsl.dslgw_2040-->3.5<!--/fill--> GW of new diesel peakers, which run <!--fill:s_nogas_dsl.ocmaxplain-->about 1%<!--/fill--> of the time.
- Keeping old coal plants running: If Eskom's coal stations must spend R500 per kW a year on upkeep to stay open, which the central plan omits, the plan's cost rises by <!--fill:s_coalsustain.dpvabsbn-->R145 billion<!--/fill-->. It still retires no coal early, so its CO2 is unchanged.
- Checks against reality: The model's replay of 2025 is within <!--fill:replay.withinpct-->1%<!--/fill--> of Eskom's actual coal output (<!--fill:replay.coal-->169.2<!--/fill--> against <!--fill:replay.eskom-->170.4<!--/fill--> TWh). Meanwhile, run on the same build pathway as the CSIR’s least-cost study, the model reproduces that study’s 2030 coal share (<!--fill:ext.csircoal-->52%<!--/fill--> against CSIR's 55%) and renewable share (<!--fill:ext.csirre-->42%<!--/fill--> against 40%).

## Build plan

The tables below show new capacity added each year, in MW. Rooftop solar is an input, not an optimiser choice. We assume <!--fill:base.roofadd_2028-->1,200<!--/fill--> MW of rooftop solar is added per year from 2028 in the least-cost plan (after a catch-up step to the end-2026 level in 2027), while IRP 2025's <!--fill:irp.roofadd_2028-->900<!--/fill--> MW a year to 2035 is in the IRP build (the second table). Remaining coal is the same in both cases and is aligned with IRP 2025's retirement schedule.

**GridTwin ZA's least-cost build plan**

<!--fill:table:What gets built, least-cost plan-->

| Year | Wind | Utility-scale solar | Rooftop solar | Batteries | Gas (CCGT) | Gas (open-cycle) | Diesel peakers | Total new | Remaining coal |
|---|---|---|---|---|---|---|---|---|---|
| 2026 | 287 | 156 | 0 | 360 | 0 | 0 | 0 | 803 | 39,692 |
| 2027 | 1,959 | 2,120 | 2,202 | 401 | 0 | 0 | 0 | 6,682 | 39,692 |
| 2028 | 0 | 1,129 | 1,200 | 0 | 0 | 0 | 0 | 2,329 | 39,692 |
| 2029 | 2,500 | 1,512 | 1,200 | 774 | 0 | 0 | 0 | 5,986 | 37,027 |
| 2030 | 2,500 | 3,277 | 1,200 | 2,195 | 0 | 0 | 0 | 9,172 | 32,433 |
| 2031 | 3,500 | 3,506 | 1,200 | 2,693 | 0 | 0 | 0 | 10,899 | 30,876 |
| 2032 | 3,500 | 3,752 | 1,200 | 1,637 | 0 | 0 | 0 | 10,089 | 29,223 |
| 2033 | 3,500 | 3,131 | 1,200 | 1,391 | 0 | 0 | 0 | 9,222 | 28,121 |
| 2034 | 3,500 | 4,163 | 1,200 | 1,864 | 0 | 0 | 0 | 10,727 | 26,467 |
| 2035 | 1,316 | 0 | 1,200 | 0 | 551 | 649 | 0 | 3,716 | 25,916 |
| 2036 | 125 | 0 | 1,200 | 20 | 730 | 470 | 0 | 2,545 | 25,348 |
| 2037 | 3,500 | 762 | 1,200 | 739 | 1,193 | 7 | 0 | 7,401 | 23,658 |
| 2038 | 3,500 | 2,299 | 1,200 | 809 | 1,200 | 0 | 0 | 9,008 | 21,969 |
| 2039 | 2 | 5,209 | 1,200 | 1,399 | 1,200 | 0 | 152 | 9,162 | 19,661 |
| 2040 | 1,688 | 2,814 | 1,200 | 959 | 1,200 | 0 | 0 | 7,861 | 17,890 |
| Total | 31,377 | 33,830 | 17,802 | 15,241 | 6,074 | 1,126 | 152 | 105,602 | - |

<!--/fill-->

**IRP 2025's build plan, as run in the GridTwin ZA model**

<!--fill:table:What gets built, IRP 2025-->

| Year | Wind | Utility-scale solar | Rooftop solar | Batteries | Pumped storage | Gas (CCGT) | Gas (open-cycle) | Nuclear | Total new | Remaining coal |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026 | 964 | 3,553 | 0 | 360 | 0 | 0 | 0 | 0 | 4,877 | 39,692 |
| 2027 | 2,847 | 2,886 | 900 | 401 | 0 | 0 | 0 | 0 | 7,034 | 39,692 |
| 2028 | 770 | 1,760 | 900 | 0 | 0 | 0 | 0 | 0 | 3,430 | 39,692 |
| 2029 | 760 | 1,314 | 900 | 292 | 0 | 3,000 | 0 | 0 | 6,266 | 37,027 |
| 2030 | 2,000 | 800 | 900 | 863 | 0 | 3,000 | 0 | 0 | 7,563 | 32,433 |
| 2031 | 2,500 | 1,000 | 900 | 2,008 | 0 | 0 | 0 | 0 | 6,408 | 30,876 |
| 2032 | 2,600 | 1,200 | 900 | 200 | 0 | 618 | 632 | 0 | 6,150 | 29,223 |
| 2033 | 2,600 | 1,400 | 900 | 200 | 0 | 889 | 361 | 0 | 6,350 | 28,121 |
| 2034 | 3,000 | 1,600 | 900 | 200 | 0 | 1,200 | 50 | 0 | 6,950 | 26,467 |
| 2035 | 3,000 | 2,000 | 900 | 200 | 0 | 696 | 304 | 0 | 7,100 | 25,916 |
| 2036 | 2,000 | 1,600 | 0 | 500 | 0 | 568 | 682 | 1,250 | 6,600 | 25,348 |
| 2037 | 3,000 | 1,600 | 0 | 500 | 1,332 | 1,200 | 300 | 1,250 | 9,182 | 23,658 |
| 2038 | 3,000 | 1,600 | 0 | 500 | 0 | 1,200 | 50 | 1,350 | 7,700 | 21,969 |
| 2039 | 3,500 | 1,600 | 0 | 500 | 0 | 1,127 | 123 | 1,350 | 8,200 | 19,661 |
| 2040 | 3,500 | 1,600 | 0 | 500 | 0 | 954 | 296 | 0 | 6,850 | 17,890 |
| Total | 36,041 | 25,513 | 8,100 | 7,224 | 1,332 | 14,452 | 2,798 | 5,200 | 100,660 | - |

<!--/fill-->

## Assumptions

| Input | Value | Source | Status |
|---|---|---|---|
| Demand growth | Grows with UCT ESRG's IRP reference forecast, applied to the measured 2026 base: <!--fill:base.demandpctr_2030-->10%<!--/fill--> above 2026 by 2030, <!--fill:base.demandpctr_2035-->27%<!--/fill--> by 2035 and <!--fill:base.demandpctr_2040-->46%<!--/fill--> by 2040. A <!--fill:base.blockmw_2030-->930<!--/fill--> MW block of returning smelter load is added from 2027. IRP 2025's own forecast is lower (<!--fill:irpdem.servedr_2035-->230<!--/fill--> against <!--fill:base.servedr_2035-->244<!--/fill--> TWh served in 2035) and is run as a sensitivity | UCT ESRG IRP reference forecast workbook (ZivaHub, doi:10.25375/uct.26942134); 2026 base from Eskom's hourly data; smelter load from its reported 80% take-or-pay contract | Partly sourced |
| Rooftop solar installed | 8.1 GW in 2026 (the 2026 average of Eskom's estimate, less wheeled plants to avoid double counting), stepping to the end-2026 level in 2027, then <!--fill:base.roofadd_2028-->1,200<!--/fill--> MW a year to 2040 | Eskom's rooftop estimate (9.4 GW by August 2026); 1,200 MW of additions per year is our assumption | Partly sourced |
| Coal fleet and retirement | <!--fill:base.coalgw_2026-->39.7<!--/fill--> GW in 2026, retiring on IRP 2025's schedule: <!--fill:base.coalgw_2030-->32.4<!--/fill--> GW remaining in 2030, <!--fill:base.coalgw_2035-->25.9<!--/fill--> GW in 2035, <!--fill:base.coalgw_2040-->17.9<!--/fill--> GW in 2040 | Eskom integrated report FY2026; IRP 2025 Figure 3, 50-year line | Partly sourced |
| Coal availability | Energy availability factor of 65% for coal (the whole-fleet figure is 68.3%) | Eskom week 42 system status report, p.3; Eskom hourly data, January-August 2026 | Sourced |
| Coal operating rules | Units are switched on in 4-hour blocks, with the cheapest first. Once off, a unit stays off for at least 24 hours. Until 2029, units cannot run below 71.5% of capacity (the level that reproduces Eskom's lowest midday coal output in 2026); from 2030 they can run down to their design minimums. Output can change by up to 24% of available coal an hour. Each start carries a start-up cost. At least 6 GW of synchronous plants must stay online | Minimum off time: our reading of Meridian Economics (2026), against published values of 8-48 hours; floors calibrated to Eskom fleet data; ramp rates from Agora Energiewende (2017); start costs from NREL and Intertek (2012); 6 GW floor is our assumption | Mixed |
| Coal emissions | 1.074 tonnes of CO2/MWh before part-load effects, calibrated so the model's 2026 rate matches Eskom's FY2026 rate of <!--fill:base.eskomrate-->1.108<!--/fill--> t/MWh sent out (Eskom's 184.0 Mt, less its own open-cycle output, over coal sent out) | Eskom performance report FY2026, pp.7 and 35 | Sourced (calibrated) |
| Nuclear | Koeberg runs flat; fuel is R109/MWh plus R45/MWh in variable O&M | Eskom performance report FY2026, p.56 | Sourced |
| Hydro | Capacity factor of 0.36 (the FY2023-26 mean) | Eskom hourly data (derived) | Sourced |
| Imports | Cahora Bassa at R897/MWh (full cost) at the contracted infeed. Ends after 2030 (kept to 2040 as a sensitivity) | Eskom performance report FY2026, p.56. IRP 2025 says nothing about what follows the Cahora Bassa contract | Sourced (price); our choice (end year) |
| Exports | 745 MW of firm exports | Eskom hourly data | Sourced |
| Avon and Dedisa peakers | 268 GWh of output a year on their measured hourly shape, until their contracts end (Dedisa end-2030, Avon 20 July 2031) | Eskom performance report FY2026, p.20 | Sourced |
| Interruptible load | 1,000 MW, with no annual energy cap. Called after open-cycle plants, as the last resource before load shedding | Eskom's certified instantaneous demand response, 1,014 MW (NREL, Demand Response at the Grid Edge, FY24) | Partly sourced |
| Coal fuel costs | R553/MWh sent out (R91.5bn over 165,431 GWh) | Eskom performance report FY2026, pp.7 and 56 | Sourced |
| Gas costs | New CCGT costs R<!--fill:page.capex.ccgt-->34,965<!--/fill-->/kW; new open-cycle R<!--fill:page.capex.ocgt-->25,778<!--/fill-->/kW. Fuel is R1,298 per MWh of electricity at 52% efficiency, flat to 2040 (LNG at 13.25% of a USD 80 Brent price, USD 11.74/MMBtu at the coast, plus USD 0.25 regasification, at R16.50/USD) | GridLab (September 2025) for CCGT capex; open-cycle at the EIA's cost ratio to CCGT; the fuel price is our gas price case | Partly sourced |
| Diesel costs | R6,100/MWh fuel plus R70/MWh in variable O&M | Eskom's realised R6,011/MWh in 2025/26 (parliamentary reply NW1243, May 2026) | Sourced |
| Onshore wind capex | R<!--fill:page.capex.wind-->28,462<!--/fill-->/kW | Bid window 6 compliant bids (IPP Office, November 2025) | Sourced |
| Utility-scale solar capex | R<!--fill:page.capex.pv-->16,786<!--/fill-->/kW (single-axis tracking) | Bid window 6 compliant bids (IPP Office, November 2025) | Sourced |
| Rooftop solar capex | R10,500/kW DC (R12,600/kW AC) | Blend of 2025-26 installer price guides, and feedback from industry leads | Partly sourced |
| Lithium-ion battery capex | R3,425/kWh (R<!--fill:page.capex.batt-->13,699<!--/fill-->/kW at 4 hours), falling 3% a year | BESIPPPP bid window 3 bids, aged to 2026; decline rate from NREL (2025) | Partly sourced |
| Cost of capital | By technology, in real terms pre-tax, for state-backed procurement: solar and wind <!--fill:page.coc.pv-->5.5%<!--/fill-->, batteries and pumped storage <!--fill:page.coc.batt-->6.8%<!--/fill-->, gas and new coal <!--fill:page.coc.ccgt-->8.0%<!--/fill-->, nuclear <!--fill:page.coc.nuclear-->8.5%<!--/fill-->, network <!--fill:page.coc.tx-->7.1%<!--/fill-->. Interest during construction is added where a cost is quoted before financing | Levels from South African bid results; gaps between technologies from CEPA (2025); network from NERSA's allowed return for Eskom | Partly sourced |
| Grid costs | Integration costs of R402/kW-yr. Wind spur R1,010/kW, charged once. No grid cost on connections freed by retired coal | Integration: Transmission Development Plan 2024 (Rev 2, Table 4), R225bn for 46.9 GW; spur: ITP Phase 1 line cost, unverified; freed connections are our choice | Mixed |
| Carbon tax rate | Legislated effective rate to 2030: R46.00/t in 2026 after allowances, rising to R61.31/t in 2030 (2026 rands). Held flat after 2030, with two higher paths as sensitivities | Carbon Tax Act rates | Sourced to 2030, assumed after |
| Operating reserve | The model keeps about 2,200 MW of spare capacity ready at all times, in the three types the system operator specifies: instant reserve that responds within seconds (650-850 MW), regulating reserve that follows small swings in demand and supply (830 MW up and down, rising to 1,140 MW by 2030/31), and 10-minute reserve that replaces lost plants (520-720 MW, falling to 210-410 MW by 2030/31). It is held on running coal units and on batteries and pumped storage with energy in them. Peaking plants and interruptible load count only as emergency reserve | NTCSA Ancillary Services Technical Requirements 2026/27-2030/31 (January 2026), pp.6-12; how long each reserve must be held is borrowed from CAISO's rules (2010) | Partly sourced |
| LNG supply | Reported in cargoes after the run (one cargo = one floating storage unit, 170,000 m³ = 4.08 PJ); not a limit in the optimiser | None found for the cargo size | Assumption |
| Build limits | Per year, at most: wind 2.5 GW to 2030 and 3.5 GW after; utility-scale solar 2.5 GW in 2026, rising 7% a year; lithium-ion batteries 3 GW; gas 1.2 GW; pumped hydro is Tubatse only (1,500 MW from 2038) | Our assumptions, set against South Africa's delivery record and IRP 2025's build rates | Assumption |

## Known limitations

- The engine is single node (for now), meaning the model cannot produce local curtailment.
- The model relies on representative days and stress windows. Without new gas or new peakers, the plan the optimiser finds meets the standard in its own stress windows but falls short when tested hourly in <!--fill:s_nogas.shortyears-->2037-40<!--/fill-->; we are investigating why.
- The engine is both the cost measure and the gauge of adequacy. Each year's unserved energy is a mean over 120 simulated years, with a sampling error of about 1-2 GWh near the Australian standard's limit.
- The comparison with an optimised dispatch model (PyPSA) was measured on a mid-October build and is being repeated on the current one.
- No inertia or system-strength requirement is in the build. The optimiser never pays for synchronous condensers or grid-forming batteries, which flatters renewable-heavy results. The engine enforces a 6 GW synchronous minimum and the build optimiser does not.
- Freed coal connections carry no grid cost.
- Coal is committed by a cost-weighing rule (4-hour blocks, cheapest first, kept on when restarting costs more), not a unit-commitment optimisation (PLEXOS and peers solve a mixed-integer commitment over a rolling horizon).
- Synchronous floor as a national MW total (6 GW, plus grid-forming batteries at 0.30 of their power), not a minimum number of synchronous units by region, as in AEMO's system strength practice.
- Reserve is limited by ramp rates.
- Perfect foresight in dispatch: The model assumes the grid operator has perfect foresight over the next 48 hours for batteries and pumped storage, 24 hours for coal commitment, 12 hours for coal ramping, and a week for long-duration storage options.
- Curtailed renewables are not paid, so curtailment looks free.
- Restarts after forced outages are not yet costed.
- No emissions compliance cost on coal running past 2030.
- Options the optimiser cannot choose: The build LP cannot yet choose coal flexibility, virtual power plants, demand response (interruptible or shifted load) or a general long-duration storage option.
- Degradation is not yet modelled. Meridian's estimates are 0.3% a year for wind and 0.5% for solar PV.
- Koeberg runs flat at 0.66 sent-out in every hour, with no refuelling outages.
- We do not yet model drought risk to imports.
- Market design and capacity: The build is a least-cost plan, as if one planner built it. SAWEM as drafted is an energy-only market: the only capacity payments are those in Eskom's vesting contracts, not open to other participants, and Meridian Economics warns of a missing-money problem in which energy sales alone may not justify batteries, peakers or other dispatchable capacity. Delivering the least-cost build therefore needs a capacity mechanism or continued public procurement. Capacity and ancillary services markets are planned from 2030, but not yet designed. A capacity-mechanism sensitivity is on the list for the next note.
- We do not charge sustaining capital on existing coal. Coal's fixed cost (R1,160/kW-yr) is calibrated to MYPD6 operating costs, which exclude capital, so future refurbishment and sustaining costs are not charged, though early retirement would avoid these costs.
- Extreme midday solar: With very large solar the engine still cycles coal more than current practice.

## Reproducing these results

- The model runs in a browser at [gridtwinza.org](http://gridtwinza.org).
- The code, the run scripts and every run's outputs are public at github.com/nickhedley/gridtwin-za. The runs in this document are in harness/pathway/c6e, made on build 2026-10-28a. A full set of runs takes about 18 hours.
- Eskom's hourly data are not in the repository, given the terms on which Eskom supplied them. Figures derived from them are credited above.
