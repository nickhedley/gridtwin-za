# Note draft (master; the Google Doc copy follows the pack's rules, HANDOVER 'Reviewer pack: Google Doc copy')

First agreed text (user, 29 Oct 2026, message 497). Every figure sits between fill markers that `BASE=c6e node pathway/tables/packfill.js
out out/c6e ../NOTE_DRAFT.md` (from harness/ of the run commit) writes from c6e's outputs; none is typed. The pack sent
to reviewers on 30 Oct 2026 (REVIEWER_PACK.md) carries the same findings in its main findings, so the reviewers see them before
they are published.

## Gas: IRP 2025's 51% minimum

IRP 2025's gas plan, with 6 GW of new CCGT required to run at least 51% of the time from 2030, raises the system's cost per unit of electricity by about <!--fill:s_irpgas.avgcostpct-->12.3-15.9<!--/fill-->% against the least-cost plan over 2030-40 (R<!--fill:s_irpgas.dpvabs-->198.0<!--/fill-->bn more in present value). The Minister has said the minimum is there to anchor LNG imports for industrial gas users; all electricity customers would carry the cost. The run also changes the gas build, so the minimum's effect alone is not yet isolated.

Basis: s_irpgas against c6e, the engine check's cost per MWh served (avgCostRMWh) by year, the range of the yearly percentage differences across every year 2030-40 (the 2030 and 2040 endpoints alone give a narrower range), and the engine PV difference 2026-40 at 8% real (RESULTS; the reviewer pack's record of 30 Oct 2026, REVIEWER_PACK_RECORD.md, section 4; the sent pack's finding 'Applying IRP 2025's gas minimum'). The minimum alone, and its pass-through to Megaflex, is TODO 14kv; this sentence is updated when it lands. Sources: Government Gazette 53596, p.34 (51%); Engineering News, 19 October 2025 (the Minister's briefing; it gives 50%); SOURCES 'Gas-to-power' and 'Gas timing'.

## No new gas

No new gas: A plan with no new gas, using wind, solar and batteries with diesel peakers as backup, passes NTCSA's adequacy test in every year to 2040. It costs <!--fill:s_nogas_dsl.dpvabsbn-->R13 billion<!--/fill--> <!--fill:s_nogas_dsl.dpvword-->more<!--/fill--> over 2026-40 (<!--fill:s_nogas_dsl.dpvpctplain-->0.6%<!--/fill-->) and emits <!--fill:s_nogas_dsl.dco2plain-->106 Mt less<!--/fill--> CO2. It adds <!--fill:s_nogas_dsl.dslgw_2040-->3.5<!--/fill--> GW of new diesel peakers, which run <!--fill:s_nogas_dsl.ocmaxplain-->about 1%<!--/fill--> of the time. Without any new peakers, the plan <!--fill:s_nogas.shortfallshort-->falls short of the standard in 2037-40 when tested hourly<!--/fill-->, and whether a system with neither gas nor peakers can meet the standard is not yet established.

Basis: the no-gas run with diesel peakers allowed and the no-gas run without them, each against the least-cost plan, from their hourly checks (twelve weather years by ten outage draws a year); system cost in present value 2026-40 at 8% real; CO2 summed over the same years; the peakers' capacity factor is the open-cycle fleet's highest year from the year new peakers first stand. The six-pass rerun of the no-peaker case stopped on the stall rule at the same result (REVIEWER_PACK_RECORD.md, section 4 and limitation 33; the sent pack's 'No gas' finding and its known limitations).
