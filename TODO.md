# GridTwin ZA - running to-do list

Merged 2 Oct 2026 from the previous chat's list and this one; build `2026-10-05g`. Items marked
"You:" need the user's decision or action; the rest are work Claude can take on. Pressing items at the
end of each message; the full list on request.

Done this session, removed: control_inventory.json and response_matrix.json compared and regenerated (14u3, RESULTS 6 Oct); pathcheck given its own outage seeds and both pathways re-checked (14u2, RESULTS 5 Oct); offshore file placed in nodal/; ESK19679.csv added to MANIFEST's
upload set as local-only; licence check read (it tests presence only; the zip copy was stale);
eng5 check 3 fixed and shown to fail on an injected defect; rooftop footer relabelled (the figure
was site-specific, the region name was wrong); full suite with all inputs present, 802/803 plus
eng5 6/6; Backcast 2025 rooftop sourced as a 2025 annual mean and re-measured; list reprints
only pressing items, full list on request; lithium duration swept 8 to 20 hours and the 12-hour
cap raised to 20; adequacy loop decomposed and gas charging added; backcast subtraction vetted; adequacy loop converges after gas-ahead-of-storage (validate_findings check added); both forecasts on planned coal, no thermal charging into the peak; backcast inputs set to 2025 measured; diesel tank added; preset-key check added; common-mode outage trips added and calibrated; three seed-fragile checks moved to eight-draw means.

---

## Install this session's files

1. You: replace index.html, profiles.json and build_demand_2026.py (root), pathway.js and pathcheck.js (harness folder), validate_consistency.js, eng5.js, validate_findings.js, validate_consistency.js, validate_benchmarks.js and audit.py (harness folder), MANIFEST.md, TODO.md, SOURCES.md and RESULTS.md (root)
2. You: replace MANIFEST.md, TODO.md, SOURCES.md and RESULTS.md in project knowledge too
3. You: commit and push; never commit the zip

## Eskom data in the repo

4. Untrack ESK19679.csv: move it out, commit the deletion, add ESK*.csv via Repository settings, commit, push, move it back (a .gitignore line alone does not untrack a file already committed)
5. You: check the terms you received ESK19679 under – does it permit redistribution? The portal notice reads all rights reserved
6. You: confirm whether the repo is public
7. If restricted: purge it from history, step by step, together
8. ESK19243 is probably in the same position – check it too

## Licences and duplicates

9. You: nine nodal/ files still say CC BY-NC-ND against the 6 Sep move to CC BY 4.0; the two Renewables.ninja-derived profiles may need to stay non-commercial
10. You: which profiles.json copy does nodal_engine.js's Node path need? nodal/profiles.json is an older, different copy

## Backcast

14. You: model OCGT deliverability under stress, the known cause of the backcast gap?

## Next, in order

14bb. External comparison candidate (14p): WWF and UCT ESRG illustrative IEP on SATIMGE (WWF Nedbank Green Trust, March 2026) - check whether its electricity results are published
14aa. Integrated Energy Plan input data and assumptions stakeholder workshop (DEE), 5 Oct 2026: the input-assumptions phase of South Africa's first IEP, so the figures are drafts. Watch for the assumptions report to be published for comment, and comment on demand. Slides photographed, not yet citable; the Refreshed Electricity Sector forecast is not published on the DEE, DMRE or Presidency sites (searched 5 Oct); ask the organisers for the deck. Meanwhile the gazetted IRP 2025 (28 Oct 2025) is citable: demand 255 TWh by 2029, EAF 66% (2025) to 68% (2030), committed private capacity in its section 3.4; DMRE's User-Friendly-IRP-2025.pdf blocks automated download, so download it by hand. (a) Demand: IRP 2025 rebased about 240 TWh (2025) to 265 (2030) and 308 (2036), 1.5-2% a year; Refreshed about 268 (2030) and 330 (2036), about 3% a year. Reconcile the definition first (our 2025 contracted demand is 209.6 TWh) and set it against measured decline (RSA contracted demand down 7.7% year to date, Eskom weekly report wk 39). Then run the pathway under each as demand scenarios. (b) Private generation: IRP 2025 13.9 GW by 2030 (7.0 PV, 6.4 wind); Refreshed 18.3 GW (10.4 PV, 7.0 wind), from about 2.1-2.5 GW today. Check against the PFL monitor and the private queue, then consider it as committed or anticipated build in the pathway (the ISP convention), with the 2026 step (2.1 to 6.8 GW in a year) tested for plausibility
14ab. From the IEP input-assumptions workshop slides (DEE, 5-6 Oct 2026; photographed, not yet published): benchmark candidate, residual load about 7 GW at midday ramping about 20 GW into the evening peak. Measure the model's 2026 values before adding a check
14ac. Same slides: compare headroom by region with the slide's figures (projects against available capacity): south-west 23.9 GW against about 0, central 25.1 against 3.1, north-west 19.3 against 12.2. TDP 2024 statistics on the slide: 53 GW pipeline, 15.4 GW coal retirement, 14,200 km of lines
14ad. Retail panel, from the same slides: the draft Electricity Pricing Policy proposes capacity charges, wheeling and trader contributions to network and subsidy costs, cost reflectivity phased in over five years, and excluding excessive non-technical losses from tariffs. Noted for the retail stack; no change until the policy is final
14ae. IEP comment point (RESULTS, 6 Oct): the department describes curtailment as midday solar; NERSA's 2025 report describes night-time curtailment at low demand for grid stability. Confirm wind and local stability with NTCSA first (14a1)
14af. Later, after 14p and 14u1. Retail panel, SAWEM transition basis (Energy Council tariff series, SOURCES): keep the regulated and market-indexed bases unchanged, and relabel market-indexed as the fully competitive end state, after vesting ends. Add a third basis, 'SAWEM transition': vesting share x wholesale energy charge + (1 - share) x hourly market price, plus the legacy charge (14ag). The vesting share follows the scenario year: high at the April 2027 launch, declining over 5-7 years. First step: search the SAWEM Market Code and NERSA consultation papers for a published vesting share; if none, propose a labelled placeholder (80-90%) and a decline path, with sources, for the user's approval before building. Show all three bases side by side. Answers item 63
14ag. Later. New output: legacy charge per kWh = (REIPPPP contract cost - value of REIPPPP output at the hourly market price) / sales; report how it changes as solar grows
14ah. Later. Map the retail stack to the seven wholesale tariff components: energy (time of use), generation capacity, legacy, transmission use of system, losses, ancillary services, subsidies
14ai. Later. Cite the tariff series' chapter 2 (1980s transmission charging zones now inverted relative to grid constraints) as support for the model's locational grid costs
14aj. Later. Cable pooling, after Lithuania's grid-access rules since 2023: wind and solar may connect up to 200% of available connection capacity, because their peak overlap is about 7% of hours; batteries can add 100% more under system-supporting operating rules; curtailment follows a priority order (source: Tracevičius, CEEnergyNews op-ed, 2026). Steps: (1) with the twelve-year regional profiles, measure for each region how often combined wind and solar output exceeds connection capacity at 150%, 200% and 300% overbooking; (2) for the congested regions, set curtailment under pooling against the avoided grid reinforcement cost from gridBuildChargeFor (capacity_siting.js, not index.html); (3) propose a pooled-connection option for the pathway. Report before changing index.html. South Africa's current rule (SOURCES): NERSA's congestion curtailment approval (April 2025) and NTCSA's practice note (October 2025), wind only, Western and Eastern Cape only, 4% curtailment cap, 1,580 MW extra (1,180 Western Cape, 400 Eastern Cape); extending it needs NERSA approval backed by studies. Frame the pooling analysis as that study: what extending to solar, batteries and the Northern Cape would unlock, in MW by region, and at what curtailment
14ak. In progress 6 Oct: central costs applied as a pathway sensitivity only (SOURCES); index.html default unchanged until reviewed. Step (3) answered from the IRP 2025 assumptions workbook: gas R260.89/GJ (Jan 2024 rand, about USD 15/MMBtu), flat, with no separate terminal or pipeline cost. OIES NG-123 and the Zululand terminal size verified; FSRU fixed cost from OIES is USD 47-75m a year, below the USD 84m central used. Gas infrastructure costs (extends 14z(f)). costCcgt's delivered LNG price (FY2026 JKM about $16.5/MMBtu) already carries a flat, unsourced ~$2/MMBtu for regasification and transport (index.html, the costCcgt note). (1) Replace that flat adder, not add to it, with a sourced regasification and transport charge per GJ that depends on terminal utilisation; (2) charge the terminal's fixed cost, or a take-or-pay minimum offtake, to new gas build in the optimiser, with the planned Zululand / Richards Bay FSRU (over 4 mtpa) as the reference project; (3) check the IRP 2025's own treatment. Report the effect on the pathway and the IRP preset before changing defaults
14al. Done 6 Oct (build 06g): shiftable load is non-residential, the VPP is households, one shared 45% cap with a readout when it binds, 'six lowest hours' corrected. Open: verify the NREL/CSIR 2024 and IEA 2025 figures in the documents (SOURCES; proxy blocked them)
14am. Done 6 Oct (build 06g): six sections (Demand first). Of the four grid controls called optimiser-only, two are (headroom: build optimiser; grid-enhancing technologies: siting panel); grid expansion cost and repurposing move the engine's cost, so validate_response now sweeps them with new build
14an. PRIORITY (user, 7 Oct). Price formation. When gas runs, the hourly price must be at least gas's running cost; storage should be priced at the opportunity cost of its stored energy, not below the unit that is running. Found 7 Oct: in the half-standard coal-minimum pathway gas runs when the model price averages R1,830/MWh against its R2,081 running cost, so its energy margin is negative. Report which outputs change before changing anything: the market retail basis, the revenue stacks and the missing-money figures
14ao. Reconcile CCGT capex: model R34,965/kW (2026, rising 2% a year) against IRP 2025 R18,653/kW (2x1 9F.05, January 2024 rands). Find a current source that reflects the 2025-26 gas turbine shortage. Meanwhile run the gas tests at both values
14ap. Approved 7 Oct, to build. Capacity payments, technology-neutral: paid per MW of firm capacity credited, existing and new plant alike; removed from the build optimiser entirely (transfers must not change the least-cost build), kept in the engine and panels as revenue. Placeholder credits until 14u4: storage min(1, h/4) (the optimiser's margin rule), thermal at availability, wind 13% and solar about 0 (2040 net-load peak, 7 Oct). Label R300/kW-yr as a placeholder and show the net cost of new entry beside it (missing money for the pathway's backup gas, 7 Oct: about R3,800-4,300/kW-yr installed at the model's capex)
14aq. Low priority, no action yet (user, 7 Oct). ANU RE100 atlases: (a) the offshore wind atlas as a cross-check on ESMAP's South African offshore zones; (b) check whether ANU's PV and wind heat maps cover South Africa, as a possible input to the cable-pooling study (14aj)
14ar. PRIORITY before any pathway is quoted (user, 7 Oct). The build optimiser charges no grid cost to any technology, while the engine adds txRPerKWyr to new wind, solar and offshore afterwards, so the optimiser picks them without it. Charge grid integration and regional reinforcement inside the optimiser for all new resources (wind, solar, offshore, pumped hydro, batteries, gas), lower where a resource can use an existing substation or a retired coal site (repurposed connections). Line and bay costs: a South African source if one exists, otherwise a labelled international placeholder (MISO cost estimation guide, NREL ReEDS/reV spur costs, in rand). Report the effect on the pathway build before changing defaults Decided 7 Oct (user): central ITP R15.5m/km including substations; high MISO R37m/km plus R76m per bay; batteries one bay per scheme, no integration charge, sensitivity at half; R402/kW-yr integration for every new resource except repurposed connections, which extend to all new resources up to the coal MW retired. Connection rule: every technology pays a spur from zero distance to its own nearest substation, sized by connection voltage (wind and solar 132 kV; large pumped hydro and gas 400 kV with N-1); 'only beyond the 18 km median' kept as the sensitivity for capex that already includes connection. Capex boundary checked 7 Oct: BLD_COST wind R21,000 and PV R12,000/kW have no recorded source (only the BNEF decline rates are), so the boundary is unclear and the user's rule makes charge-from-zero central. IRP 2025's REIPPPP BW6 lines (R25,695 and R14,731/kW, 2026, Jan 2024 rands) are labelled REIPPPP BW6, so probably bid-derived and inclusive of developer-funded connection (not confirmed; the workbook gives no definition); reconcile our levels against them.
14as. Existing diesel peakers (user, 7 Oct). Found: the 3.4 GW (Eskom's 2,380 MW: Ankerlig 1,338, Gourikwa 746, Acacia and Port Rex; IPP Avon 670 and Dedisa 335) stays in full to 2040 in every pathway; dieselDecomMW is 0 and nothing retires it by age; Avon and Dedisa lose only their capital charge when their contracts end in 2030-31. Source each station's commissioning year and design life and propose retirement dates (Acacia and Port Rex date from the 1970s); report the effect on the pathway before changing defaults
14at. Option to convert existing OCGTs to gas as an alternative to new gas build (user, 7 Oct): conversion cost instead of new capex, with fuel delivery to each site: Ankerlig (Atlantis) and Gourikwa (Mossel Bay) are in the Western Cape, far from the Richards Bay terminal and with no gas pipeline; Dedisa (Coega) is near a possible Eastern Cape terminal (Ngqura, Ukwanda LNG); Avon (KwaZulu-Natal) is nearer Richards Bay and the Lilly pipeline. Report before changing defaults
14au. After the run queue and the grid-cost work (14ar) (user, 7 Oct). First-determination scenario, from the DEE statement of 7 Oct 2026 (SOURCES): 4.6 GW battery storage and 5 GW gas by about 2030-32, no new public wind or solar in that window, private build per the PFL tiers. Compare with the central least-cost pathway: adequacy, curtailment by region, cost and gas running hours (with the new-gas column, gas capacity factor and the LNG check). Update the inputs when the gazetted determination lands (CALENDAR).
14av. PRIORITY before any IRP gas comparison is quoted (user, 7 Oct). Build costs. CCGT stays at R34,965/kW (GridLab, Sep 2025, project data at USD 2,000/kW or more amid the turbine shortage); IRP 2025's R18,653/kW (January 2024, 17,423 on its 2026 path) is a sensitivity, not a correction. Wind R21,000 and solar R12,000/kW have no recorded source and sit about 18% below IRP BW6: source them from South African bid data. Found 7 Oct: IPP Office REIPPPP historical data note (7 Nov 2025, January 2024 rands) BW6 wind compliant R26,647/kW, BW6 solar preferred (tracking) R15,715; x 1.068 (SA CPI) gives R28,459 and R16,784 in 2026 rands. Report before changing defaults. Sensitivity: the central pathway on the IRP 2025 workbook's full cost set (COSTSET=irp2025, queued), with the gas columns. Decided 7 Oct (user): wind takes the IRP 2025 path value, R27,446/kW (2026 rands), as default once the cost-set run reports; bid-derived, so it then pays only the spur beyond the typical connection (BLD_COST.wind.connIncl). Solar capex waits for the tracking profile (14aw); the two switch together. CHANGED 7 Oct (user): wind takes the BW6 bid evidence directly, R28,463/kW (compliant bids x CPI; the user's R28,459 is the same at 1.068), with the IRP's R27,446 as a cross-check only. Done in build 07q, connIncl. IRP 2025 cost assumptions are a sensitivity only (RULES). CHANGED again 7 Oct (user), option (c), build 07r: central R28,463/kW (BW6 compliant overnight); high R30,060 (disclosed investment values, EDF BW5 Koruson and Impofu); low IRENA 2024 global (USD 1,041/kW x R16.50). New wind on a modern-turbine profile (Vestas V162 5600 at 120 m, nodal/profiles_wind_modern.json, bldWindModern); existing farms keep theirs; capex and profile change together. The correction for new wind is set from the farm check (check_wind_farms.py), not inherited from the fleet's 1.0753: 7 Oct, factor matching developer-stated output Impofu 1.0645, San Kraal 1.0628; Decided 7 Oct (user): 1.064 central, 1.00 low (bldWindCorr). Done in build 07s: the file is stored uncorrected and the factor applied in index.html (WIND_NEW_CORR), engine and LP; the national map loads at start-up (07r threw on any dispatch with new wind before the weather years loaded).
14aw. Solar tracking option (user, 7 Oct): existing utility solar keeps its profile; new utility solar on a single-axis tracking profile (Renewables.ninja tracking option, same sites) at the BW6 tracker capex in 2026 rands. Build as an option and report the effect on the central pathway before making it default. Blocked 7 Oct: renewables.ninja and PVGIS are not reachable from the cloud environment. Unblocked 7 Oct: re.jrc.ec.europa.eu added by the user. PVGIS SARAH3 single-axis tracking at the ten fixed-tilt solar points (build_solar_tracking.py); 2024-2025 outside SARAH3 coverage take the PVGIS tracking/fixed ratio by month and hour. Source switch from Renewables.ninja recorded in the file. On switching: new solar at BW6 tracker capex (R16,784/kW, 2026 rands), connIncl, spur beyond the typical connection only.
14ax. Battery cost basis (user, 7 Oct), report before changing anything: total installed cost per kWh at 4 h on one basis, stating what each figure includes (grid connection, local content, EPC, development), for BLD_COST.batt (R8,105/kW = R2,026/kWh), the BESIPPPP rounds (BW1 R27,888/kW January 2024; BW2 R12.8bn for 2,460 MWh; BW3 R9.5bn for 2,464 MWh, May 2025) and current international turnkey prices (BNEF 2025, USD 117/kWh global, excluding EPC and grid connection), with the fall in cell prices since 2023. Decided 7 Oct (user): BESIPPPP BW3 central (R3,990/kWh, R15,962/kW at 4 h; 'inclusions not stated'), the old R8,105/kW the low case (BATT_CAPEX=8105). Done in build 07j: BLD_COST.batt from the BW3 figures, connIncl (no connection bay); report the effect on the central pathway. CHANGED 7 Oct (user), build 07p: central is BW3 aged to January 2026 (equipment share at BNEF's 2025 decline, the rest at CPI), R3,425/kWh, R13,699/kW at 4 h; high BW3 as bid (R15,962/kW); low R2,026/kWh (R8,105/kW). bldBattCase. Replace with first-determination bid prices when published.
14ay. Before #22 merges (user, 7 Oct). Re-search Deep decarbonisation 2035 and Fossil-free 2040 on the BW3 battery cost and the connection rule: least system cost meeting half the 0.002% standard, the 4 Oct method (harness/ext/preset_search.js; Deep on twelve years x two draws then 480, Fossil-free on twelve years). Until then their descriptions make no least-cost claim. Started 7 Oct: on BW3 the unchanged builds cost R320.6bn (Deep, was R279.6bn) and R383.9bn (Fossil-free, was R323.1bn) a year. The connection rule does not reach the presets while bldGridCost is off. CHANGED 7 Oct (user): re-search on the final central costs (BW3 aged lithium, option (c) wind on the modern-turbine profile with its chosen correction), so it restarts once the wind profile is rebuilt. Two starts per preset (the current preset, and the build optimiser's proposal at half the standard re-checked in the engine); report convergence; describe the result as the cheapest found by the stated method, not the global least cost. #22 held until this is done.
14az. Low priority, after the current runs (user, 7 Oct). Southern Africa grid layer for the 3D map, visual only, no change to model results: SADC high-voltage lines from the World Bank / energydata.info Africa transmission network (check its licence) or OpenStreetMap power lines via Overpass (ODbL, attribution); cross-border interconnectors highlighted and labelled with SAPP's published transfer limits (sapp.co.zw/interconnectors, /transfer-limits). SAPP's grid map image is all rights reserved: a visual cross-check only, never copied. Needs energydata.info and overpass-api.de in network access.
14ba. Central costs against the RULES test (local evidence plus an international benchmark), 7 Oct 2026. Meet it: wind (BW6 bids; IRENA 2024 USD 1,041/kW), lithium (BW3 aged; BNEF turnkey 2025). Pending a switch: solar, R12,000/kW unsourced (it sits at IRENA 2024's global USD 691/kW, R11,400), moves to BW6 tracker R16,786 with the tracking profile (14aw). Gaps: rooftop R17,000 (no source recorded); CCGT R34,965 (GridLab, international only; no South African CCGT bid); vanadium flow, iron-air (international only; no South African project); offshore (ESMAP, South Africa-specific study, no bid); pumped hydro ('anu2026', Blakers personal communication on South African sites; Ingula as local cross-check). Close each or record why it cannot be closed.
14bc. Synchronous condensers and grid-forming risk (user, 7 Oct). (1) Synchronous condensers in the build optimiser as an option: new build, and conversion of retired coal units (reusing generator and connection), each with a sourced cost per MVA. (2) SYNC_GFM_SHARE as a tested assumption: run 0%, 15% and 30%; propose 15% as central until South African evidence exists; report the effect on cost, build and syncUnmetH, especially Fossil-free 2040. (3) Revise the RESULTS entry advising against synchronous condensers: grid-forming inverters are still proving themselves at scale, and Australian transmission companies have continued procuring condensers. (4) Note in RESULTS that the national MW floor stands in for nodal system strength (MVA), which needs grid studies.
14bd. After the current runs (user, 7 Oct). Re-run the IRP cost-set comparison (COSTSET=irp2025) against the final central costs (BW6 wind on the modern-turbine profile, lithium BW3 aged), same table: new gas GW, capacity factor and running hours by year, coal retired, wind, solar and storage built, total cost and CO2, LNG check. Report against IRP 2025 Table 1 cumulative new gas (6.0 / 10.75 / 17.25 GW by 2030/35/40; 18.25 by 2042). Rerun after the storage fix (09a).
14be. After the current runs (user, 7 Oct). 'IRP world' run: IRP 2025 demand (public_data/irp2025_extract.csv, reconciled to the model's demand basis), the IRP cost set and the IRP coal schedule (3.2.1.1.3: 50-year life, 8 GW down 2029-2030, a further 15 GW 2034-2042) together, half standard, same method; report in the same format as 14bd. Differences to test one at a time as well as together, so the gap can be attributed (RESULTS, gas fuel entry, 9 Oct): the earmarked 6 GW of gas in 2029-2030 with its 51% minimum capacity factor 2030-2040; IRP demand on the model's basis; the IRP coal schedule; the IRP discount rate (11.3%, not in the cost-set run); the IRP's reliability criterion or reserve margin (to be sourced); the IRP build pace (BLD_PACE.irp); nuclear 5.2 GW 2036-2039; rooftop 0.9 GW a year. Order and scope set by the user, 9 Oct: one at a time in this order, then all together: (1) demand at the IRP's path after putting both on one basis (losses, exports), and state in the methods the source of the pathways' 0.35% a year; (2) keep the 2030 gas cap as the default (deliverability: GE Vernova Q1 2026 earnings call, Power Engineering 23 Apr 2026, about three-year lead times and about 10 GW of 2029-30 slots left worldwide; no LNG terminal yet; procurement only started with the 7 Oct determination; cite in the methods), run the relaxed cap once as a diagnosis only, labelled not deliverable, and wherever 2030 gas is reported say it sits on the deliverability cap; (3) discount rate: confirm whether the IRP's 11.3% is real or nominal and compare on one basis; (4) the 51% minimum running requirement; (5) gas pre-decided as in the IRP; (6) storage pace at the IRP's 0.55 GW a year; (7) nuclear as in the IRP. Work order (user): the 09a central run and its 07s comparison, then the gas price cases (14bo), then 14be (demand first), then the no-gas test (14bm), then the Fossil-free proposal.
14bf. When data allows (user, 7 Oct). Re-check the new-wind correction (WIND_NEW_CORR, 1.064 central) against measured output once Impofu and Umsobomvu have a full year of operation, and against any published output from farms outside the Eastern Cape (the fit rests on two Eastern Cape farms). check_wind_farms.py; record in RESULTS.
14bg. You: decide (7 Oct). The modern-turbine profile moves six suite checks that are results, not pins (RESULTS 7 Oct, build 07s): external, CSIR 2030 coal and renewable shares and EDMSA Scenario A wind and CO2 2035 (their wind MW now produce modern-turbine energy, not the study's); findings, wind capture at 110 GW (86% to 79%), iron-air in July with gas (846 to 832 GWh becomes 425 to 0), preset curtailment band (to be re-measured after the preset re-search, 14ay). Options per check: run the external study's build on the current-turbine profile (its own basis), or re-measure and revise the finding. Left failing until decided. Decided 7 Oct (user): external builds on the current-turbine profile, modern as a sensitivity (done); the two findings recorded as updated in RESULTS, not re-pinned (wind capture; iron-air with gas, now a provisional finding run at 1.00 and 1.064 with monthly charge and discharge); preset curtailment re-pinned after the re-search (14ay).
14bh. Regional optimiser: new wind there prices modern capex (bldCostEntry) on the old regional profile (nodal/profiles_regional.json, Renewables.ninja 2023, V90 at 80 m, plant centroids), a 07r defect. Fix: export per-region modern/current maps from build_wind_modern.py, check that file's correction basis, apply map x WIND_NEW_CORR to new wind only in bldBuildRegionalLP; test; suite. Until then the regional pumped-hydro run uses WINDMOD=0 (old capex and old profile together; ext/regional_phes_07s_windlegacy.json, labelled) and is rerun after the fix (user, 7 Oct). Done 7 Oct, build 07u: per-region maps from build_wind_modern.py applied to new wind in bldBuildRegionalLP (and its capacity-factor readout), times WIND_NEW_CORR; tracking solar raises an error there; state guard added. Next: rerun the regional pumped-hydro run with modern wind on.
14bi. Regional wind basis (found 7 Oct): nodal/profiles_regional.json is raw V90 output (max 0.991, no scaling recorded), the national file carries the fleet factor 1.0753. With modern wind off the regional LP's wind sits about 7% below the national basis. Decide whether the regional file takes the fleet factor; recompute, do not hand-edit.
14bk. Pathway overshoot (found 8 Oct 2026, RESULTS): the 07s central pathway runs at 14% of the half standard in its worst year. Options to test, one run each, report cost and the engine check: (a) weight shedding in a stress window by its probability (one draw of one weather year) instead of VoLL x 365; (b) a release step in the stress loop that drops windows or capacity while the engine check is far below target (the loop only adds); (c) more draws in the loop's own check, so it and pathcheck agree. Decide with the user before changing the method. Decided 8 Oct (user): (c) first, in both checks (more draws for 2036-2040 in the loop's final check and in pathcheck, e.g. 480), then (a); (b) skipped for now. Found 8 Oct: the 2030 stress windows, not energy value, drive the capped 2026-2030 build (RESULTS). (c) done 8 Oct: 480 runs a year, worst year 2039 at 55% of the target pooled (RESULTS). (a) decided 8 Oct (user): option (i), built as bldStressTarget (08b), central run v_half_c1_p1_08b_st running; reported shed now adaptive in pathcheck (to +/-20% of target, max 480 runs). Earlier note: probability weights on the windows plus a per-year constraint holding weighted window shed to the target, or weights alone (which turns the standard into a VoLL trade). Decided 8 Oct (user): option (D), keep VoLL x 365; bldStressTarget stays off in the code; three-pass result in RESULTS.
14bl. PRIORITY (user, 8 Oct 2026). Optimiser and engine disagree on the same stress window and build: on the 07s central build the engine sheds up to 11.7 GWh in a 2040 window the LP served in full. Run both on that window, list hour by hour where they diverge (storage at window start, coal commitment and ramps, pumped-storage energy, reserves, outage draws, imports), report the cause before changing anything. Cause found 8 Oct (RESULTS): the LP's storage keeps one energy balance per day, so energy charged later in a day serves earlier hours; within-day energy goes below zero on 106 of 203 stress days for lithium in 2040. Fix approved by the user 8 Oct and built in `2026-10-08c` (bldHourlySoc 1): hourly level on stress days with a cyclic window start, and an hourly level on calendar days checked on the first and last real day of each block (RESULTS). Every earlier optimiser result is marked provisional. Next: the central rerun on 08c with the adaptive engine check, then 14bm, then the Fossil-free proposal. The two-ends calendar-day rule was accepted by the user 8 Oct and is stated in the methods notes (build 2026-10-08d). Runtime (user, 8 Oct): if neither pass-2 solve of the central rerun (simplex in the run, interior point alongside) has finished by 01:00, stop and propose ways to shrink the pass-2 LP (duplicate stress windows, fewer representative days, five-year blocks), each tested on the first pass for its effect on cost and build, and report before choosing. 9 Oct: neither finished (simplex 7 h 52 min, interior point 4 h 52 min); both stopped at 01:00; sparser LP (bldCumVars, exact, 1.6 times faster on interior point) and the shrink options tested (RESULTS). 9 Oct (user): cost scaling tested on two LPs (it does not make the stress-window LP converge without crossover); fallback adopted, per-year stress windows (bldWindowsPerYear, build 2026-10-09a), cited in the methods notes (ReEDS documentation; Mai et al. 2024). Central rerun, 14bm and the Fossil-free proposal running on 09a.
14bm. Next in the queue (user, 8 Oct 2026): no-gas test on the 07s costs (GAS_CAP=0), adaptive engine check, shed per year against target and the cost difference from the central case. Stopped 8 Oct on the old formulation (user); rerun on 08c after the central case, then the Fossil-free proposal (HORIZON 2040, GAS_CAP 0, COAL_DECOM 42000, DSL_DECOM 3400).
14bo. Gas price review (user, 9 Oct 2026; after the 09a central run is compared with 07s, change nothing before): three delivered cases (low: 115% Henry Hub + USD 3 liquefaction + shipping to SA; central: 12.5-14% of a cited long-run Brent; high: 2026 JKM average with Sept-Oct, about USD 25.8, plus delivery), report the central in R/MWh; LNG terminal and pipeline as a fixed annual cost per GW of new gas (Transnet R7bn+ for 2 mtpa; Standard Bank/ENN 23 Jul 2026, about USD 1.5bn for two terminals) instead of the flat USD 2/MMBtu; inland adder (Lilly pipeline R9.00/GJ, NERSA 2025/26, once reversed; cited ssLNG trucking before); new OCGT on LNG as a build option (capex, heat rate, VOM, cited); IRP 2025 gas price for comparison; fix the costCcgt comment (1968 against 2003) and check emisCcgt (0.35 t/MWh). Report new gas 2030/35/40, running hours and system cost per case. Sourcing under way.
14bp. Diagnosis only, low priority, after the 09a central run and its check (user, 9 Oct): on the 2023-windows pass-2 LP, interior point without crossover with (a) the stress-window shed penalty capped at VoLL x 10, (b) HiGHS's most aggressive scaling option.
14bn. Regional build LP (bldBuildRegionalLP) still keeps one storage energy balance per day (found 8 Oct 2026 with 14bl). Its results are provisional; fix it together with 14bj (user, 8 Oct; 14bj is on the regional branch claude/regional-phes-07u). No regional optimiser result is to be published before then.
14u4 extended (user, 7 Oct): measure firm capacity for all resources, coal and gas with correlated outages, storage with credit that declines as the fleet grows, and wind and solar; then use the measured values for both the optimiser margin and the capacity payments (14ap)
14z. From Weber et al. 2026 (Cell Reports Physical Science, ANU): (a) add pumped hydro to the build optimiser, with a duration choice (about 24, 48 and 160 hours) and South African site costs from the ANU RE100 atlas, checked against Tubatse; (b) review the pumped-storage cost (now Tubatse-based, about R2,090/kWh at 14 hours against the paper's USD 14-47/kWh for large off-river sites) and its 60-year life (paper: about 75); (c) dropped 5 Oct: a 3% real rate is below South Africa's real sovereign yield and too optimistic; any future financing sensitivity should start from the sovereign real yield or NERSA's allowed regulated return; (d) check whether the weighted, chained representative days distort long-duration storage, part of the optimiser-engine gap (14u); (e) near-optimal (MGA) search for gas-free and early-coal-exit pathways within a few percent of least cost; (f) note that gas pathways leave LNG terminal and storage costs out; (g) Ingula (1,332 MW, 21 GWh, R26.8bn reported, Engineering News 2016; built 2006-2017) supports the 'tubatse' cost basis: escalated, about 42% above the atlas fit against Tubatse's 28% (SOURCES; depends on escalating mixed-year spend); (h) done 6 Oct: pumped hydro's earliest year moved to 2035 (bldPhesFirstYear; 2033 kept as a sensitivity), because Ingula took 11 years (RESULTS); (i) ANU South African shortlist received 7 Oct, CC BY 4.0 (Blakers, 7 Oct): public_data/anu_phes_shortlist_za.csv and its summary by supply area and class; proposal for regional pumped-hydro options awaiting approval; (j) done 6 Oct (build 06h): 'anu2026' off-river cost basis (Blakers, personal communication: USD 1,100/kW + 14/kWh incl. 50% contingency; 738 Class AA/AAA sites, 340 TWh, top 30 hold 43 TWh) is the default, 'tubatse' the conservative sensitivity; site-level data to follow
14y. Hydrogen-fuelled power plants as a technology: firm dispatchable capacity with hydrogen fuel cost, fuel storage and efficiency, linked to the electrolyser item (14s) so curtailed energy can make the fuel. Mpumalanga project: HDF Energy's Renewstable Mpumalanga, on 1,782 ha leased from Eskom near Tutuka and Majuba (land tender MWP1247GX): eight plants planned, about 1,500 MW of solar with over 3,500 MWh of hydrogen storage and fuel cells, USD 3bn (HDF, 2023); four-plant Majuba cluster in environmental assessment, 74 MW per plant (SAHRIS). Development stage only; check current status before loading anything. It is solar-plus-hydrogen storage, so it belongs with long-duration storage as much as with firm plant. Reference case: Calistoga Resiliency Center (Energy Vault for PG&E, COD Sept 2025): 8.5 MW peak, 6 MW continuous, 293 MWh, at least 48 hours, PEM fuel cells on liquid hydrogen with batteries for black start; replaces rented diesel for a local microgrid; cost-recovery ceiling USD 46.3m over the project life (LinkedIn post, figures to verify against primary sources). Note the scope: Calistoga is local resilience, not bulk adequacy, which is what this model covers
14v. Second-pass sweep of panel prose for stale text (slider notes done 5 Oct)
14w. Other constants still on R16.21/USD (battery degradation, ATB VOM anchors): move to R16.50 or record why not
14x. Done 6 Oct: TDP 2024 is 14,494 km, 210 transformers, 133,000 MVA, 56 GW, about R440bn; 14,200 km, 53 GW and probably R390bn are TDP 2022. SOURCES corrected; txRPerKWyr stays 402 (generation integration only, the right method). Open: the IEP slides' 'about 14,500 km for about R430bn' is probably the same plan rounded; confirm when the slides are published
14x1. Low priority. Sensitivity 'whole-plan grid cost': txRPerKWyr at about 660 (the whole TDP 2024, R440bn over 56 GW) against the model's 402, only to show how much the results depend on the grid-cost method; not a proposed change
14u. Optimiser-engine gap: closed by outage-path stress windows (5 Oct, RESULTS): no margin needed. On independent outage draws (5 Oct) both pathways meet the standard every year, worst 2.89 GWh (op) and 3.08 (sd14) against about 3.9. Open: re-test pumped hydro with outage-path windows
14u1. Half-standard pathway: the 5 Oct runs did not converge (RESULTS, superseded). Being redone with stress windows for every failing year (fix 2, build 2026-10-06b), duration-dependent storage credit on stress days (2026-10-06c) and native HiGHS, on branch claude/stress-per-year; results provisional until the margin-credit test and the 2040 decomposition are done
14u4. Later. South African storage capacity credit (ELCC) by duration, to replace the 4 h placeholder (bldMarginHoldHours, 6 Oct 2026): add 1 GW of 1, 2, 4, 8 and 12 h storage to the 2030 and 2040 builds, measure unserved energy avoided against 1 GW of firm capacity across twelve weather years, and fit the credit curve. Sources: PJM ELCC class ratings 2026/27 and 2027/28 (2027/28: 4 h 58%, 8 h 70%, 10 h 78%); NREL capacity credit studies (2023, 2025)
14u5. Pathway programme, after fix 2 (14u1) and 14p(c), in order, reporting after each step before the next (user, 6 Oct 2026):
  (1) re-run the full-standard reference pathway on the current build and re-check it on independent draws;
  (2) demand scenarios: measured Eskom trend, IRP 2025 and the IEP refreshed forecast (about 3% a year), once demand definitions are reconciled (14aa). IRP 2025 (public_data/irp2025_extract.csv): about 238 TWh in 2024 and about 255 TWh in 2030, 2.3% a year, defined as grid consumption including losses, excluding pumping, battery charging and station auxiliaries, including cross-border sales; ours is about 210-217 TWh. Check exports and self-generation as the likely cause of the gap;
  (3) committed private and procured capacity, NOT the IRP's 13.9 GW. Source: Power Futures Lab Financial Close & Commercial Operations Monitor, H1 2026 update (Alao and Kruger, 17 Aug 2026). Tiers: (a) operational H1 2026, 1,920 MW in 17 named projects (Table 1): check each against by_source and nodal/private_pending_h2_2026.json; (b) expected H2 2026 COD, 2,202 MW in 28 projects (1,414 private, 789 public: the brief's Figure 1, p.5, chart labels), fixed build in 2026; (c) 2026 financial closes, 1,713 MW, fixed build around 2028; (d) advanced pipeline 3,243 MW (REI4P BW7 1,520, BW6 640, BESI4P BW2 462, private 621) as the central case with a delay sensitivity; (e) NERSA registrations as an upper bound only: primary source nodal/nersa_registrations.json (SAPVIA NERSA dashboard, 20,131 MW to Q1 2026/27; NERSA's all-technology figure 21.9 GW), cross-checked against the 19.3 GW in press coverage of PFL data (Green Building Africa, Aug 2026; MyBroadband, about 19,300 MW registered 2018 to Q1 2026), which is not from this brief. The IEP workshop's refreshed private build (18.3 GW by 2030) as a cross-check scenario until published. The brief confirms Mulilo Total Hydra Storage (75 MW contracted) and Graspan PV (75 MW) reached COD in H1 2026: close the standing Mulilo flag in validate_capacity and the Graspan calendar item, following the double-count rules. Captive behind-the-meter projects (Lephalale 1, PPC Slurry, PPC Dwaalboom, 88 MW) stay excluded;
  (4) 14ak gas infrastructure costs;
  (5) 14z long-duration storage, pumped hydro and iron-air, as build options;
  (6) run the full IRP 2025 build (public_data/irp2025_extract.csv, Table 1) through the same hourly test, with a side-by-side year-by-year comparison, including 18.25 GW of new gas (3 GW Eskom 2029, 3 GW IPP 2030, 12.25 GW IPP 2032-2042) and 5.2 GW of nuclear (2036-2039). The IRP preset models only the 2030 gas and needs updating
14n. Rooftop in system cost: both reported in the pathway (whole and grid cost). Open: show both on the page
14o. Full model audit, as an energy modeller and grid operator: gaps, inconsistencies and errors
14p. Find a published scenario from a professional modelling group and test the model against it. Kerwin et al. 2026 (MAED-OSeMOSYS) done (RESULTS, 6 Oct): part 1, their systems shed 19 to 1,000 times the standard when dispatched hourly, except baseline 2030; part 2, our optimiser on their inputs builds twice their solar and ten times their storage, and meets the standard with the loop. Open: their battery power cost needs BATT_POWER_SHARE to be settable. Next: (a) test part 1's failing builds (Scenario 1 2030 and 2040, baseline 2040) with long-duration storage instead of gas, pumped hydro at the default cost and iron-air, and report what closes the gap and at what cost; (b) until (a) is done, word the finding as 'multi-day lulls need firm or long-duration capacity', not 'gas is needed'; (c) reconcile their demand definition (MAED final demand) with ours
14q. Remaining tool and calculation gaps between GridTwin and professional models
14r. Solar cap growth: 7% central; 15% sensitivity done (RESULTS, 5 Oct): 0.4% cheaper, 3% more CO2
14s. Least-cost mix: test higher rooftop uptake, and electrolysers to absorb curtailment; also micro data centres at solar and wind farms and EV chargers (Axios, 1 Oct 2026; Rune, Soluna, Xeal; kilowatts to tens of megawatts), modelled only as a flexible absorber of curtailment in this test; high chip costs push such sites toward firm load, which belongs in the demand scenarios
14t. Carbon: legislated-path reference and R462/t shadow-price sensitivity done (RESULTS, 5 Oct). Open: NDC emissions-cap pathway with a sourced electricity cap; report resource cost net of carbon tax on the page
14l. Pathway to 2040 done (RESULTS, 5 Oct). Open: carbon-price sensitivity; report CO2; life-extension option; shrink the 4,000 MW stress margin by narrowing the optimiser-engine gap; expose the per-year loop in the build panel
14k. You: re-run the preset search letting lithium choose 12 to 20 hours?
14g. ITP Phase I slipped (final RFP Q2 2027): find the seven corridors in tdp_projects.json and move their commissioning to about 2030-31; re-measure the 2030 presets
14h. Grid delay holds back 40% of 2030 wind and solar on a judgement; the ITP's 3,222 MW is about 18% of that preset's new wind and solar, a sourced basis for the size of the delay
14j. Rooftop and site tools: an export limit at the connection point as its own input (PV DC, inverter AC and export limit are different quantities)
14a1. Night curtailment: system-wide causes exhausted (coal minimums, an operating floor, demand definitions). You: ask NTCSA whether 2025 curtailment was local stability at specific substations. Then decide: reshape the 1.3% stopgap to wind at night, or model it regionally in the nodal engine
14a2. Check every script that reads ESK19679 timestamps for the 12-hour clock (AM/PM) – one analysis this session got it wrong
14b2. The iron-air finding passes at 1.3% and failed at 0.24%: it is sensitive to delivered renewable energy; re-state it with that range once curtailment is calibrated
14b3. Explain why the Homeflex check flipped green: the representative week's peak price rose 3.40 to 7.39 R/kWh after the congestion fix
14b4. Re-measure the curtailment ranges quoted in RESULTS and outreach (51-68 and 90-114 TWh were at 4%)
14c. Show congestion loss alongside surplus curtailment in the wind and solar extremes panel, so 0% is not read as no curtailment
14a. You: re-size either preset to 16-hour lithium? 0.5% cheaper, inside the cost uncertainty
15. You: EAF 55–60% unserved rise (4.00, 5.39, 5.69 GWh, present with the charging rule off) – investigate now or park?
16d. Investigate the flat shadow price: a normal winter week varies 1.1x against Homeflex's 3.9x (standing failure in validate_consistency)
16b2. You: the backcast's remaining gap is Eskom's reserve-refill shedding; ask Eskom or NTCSA for their weekly emergency-reserve targets?
16c. You: the RMIPPPP hybrids (335 MW, 1.8 TWh) – were they delivering in 2025? Turning them off brings backcast coal to 170.3 against 170.4
16a. Run the converged loop build through the presets' twelve-year test before treating it as a result
16b. You: backcast capacities – move solar and wind to 2025 annual means (2,302 and 3,642) alongside rooftop 6,830?

## Follow-through on the engine change

17. You: a deeper-coal-retirement preset with firm capacity alongside – worth building as a third scenario?
18. Re-measure a level before quoting it from any coal-retaining entry dated before 2 Oct

## From other people's tools

19. You: build a Fraunhofer-style replay on ESK19679 – real dispatch, hypothetical batteries, no modelled baseline?
20. Add the daily spread, hours above a threshold and solar capture value to the battery panel
21. You: a Sondeva-style tracker of NERSA notices, the Gazette and DFFE authorisations – separate project?
22. Add source URLs and active, withdrawn, rejected status to the private-project queue
23. Weight REEA_SHARE by how often an authorisation is actually built

## Build optimiser

24. Iron-air held 4.4 GWh while the engine shed – check its discharge rule
25. Interruptible load: 1,200 MW in the engine, absent from the optimiser
26. Model pumped storage energy in the LP, so it can count as reserve honestly. Done 7 Oct (build 07a): bldPsEnergy on by default after the decomposition (RESULTS, 7 Oct) found no LP over-use or engine under-use; the remaining gap is the LP's within-window foresight. Open: re-run the half-standard gas variants (a, b1-b3) with it on before quoting them
27. Regional: test a year-by-year solve before concluding the adequacy fix cannot fit
28. Give wind and solar a capacity credit in the margin row, rather than zero
29. Make coal retirement a decision variable
30. Render the schedule as a table in the panel; say on screen when a cap binds
31. Label the objective as not comparable with runs before the tail penalty

## Industrial electrification, parked

32. You: also approach the JET Funding Platform, UK PACT, IGUA-SA or the PCC?
33. Six-step research scope is in HANDOVER

## Rooftop pitch detection

34. You: set a daily quota cap on the Solar API – the live site shows it already works
35. You: check whether the existing key is already committed to the repo
36. You: test coverage on a Cape Town address too

## Decisions

38. You: make roof form an unavoidable choice rather than defaulting to flat?
39. You: build a curtailment distribution into the panel?
40. You: rewrite the outreach pieces that lean on spill, with ranges?
41. You: ask the WhatsApp group whether a published wheeled-plant list exists?
42. You: build a real municipal path, or keep the Eskom-direct stack with City Power as comparison?
43. You: quote the PARI design phase separately from delivery, or one fixed fee?
44. You: keep or drop the opening concession in the Meridian letter
45. You: verify the check count, submission date and City Power figures before sending
46. You: chase SSEG registrations and the CSIR REEA database – or is NTCSA weekly now the answer?
47. You: ask Meridian for scenario outputs, or leave the cross-check directional?
48. You: check the repo history for the solar constant
49. You: scope City Power outage data by cause and feeder into the PARI proposal?
50. You: approach the firm-dispatchable authors on the storage-versus-firm difference?
51. You: does the PARI note need the three-metro version before the proposal?
52. You: the City Power result is publishable on its own – worth a separate write-up?
53. You: keep the briefing as a dated snapshot outside the repo, or discard after use?
54. You: write up the ancillary recommendation as a NERSA submission?
55. You: is the fixed-charge-versus-rooftop finding worth a Pricing Policy follow-up?
56. You: develop the storage-pace-versus-gas result for outreach?
57. You: raise the coal-utilisation question with the IRP team?
58. You: write up the unreachable 50% gas floor for outreach?
59. You: should the retail panel show IRP path 2035 as the default comparison?
60. You: add an AEMO-style short-battery penalty for forecast error?
61. You: stranded coal – toggle on by default, or off?
62. You: retail box – market-indexed headline with a regulated reference line?
63. You: vesting coverage – full, or declining? Answered by the user 6 Oct: declining; see 14af

## Rooftop tool

64. Sweep for other places that apply a factor rtCalc now applies
65. State the composition order in the code: footprint, then roof face, then packing
66. A harness check that the traced path and the typed path agree for the same roof

## Render check, four sessions overdue

67. You: screenshot the rooftop section below the fold – roof-form and obstruction controls, module note, one click of the sizing sheet
68. A traced roof (the auto-measured path is now seen working)
69. The build panel: horizon selector, apply status line, adequacy-loop button and its table
70. The VPP readout line, which has never been seen rendering
71. The nodal panel with reserve live at defaults
72. A regional optimiser run on your machine: how long does it actually take in the browser?
73. Confirm the live site is on 2026-10-05g after the push, and the new footer label shows

## Named projects

74. SunCentral 1's region needs settling against substations_compact.json before loading
75. Global Energy Monitor's trackers, for the Hydra split
76. OpenStreetMap for geometry; #PowerTracker still not ingested

## Standing practices (not tasks; read each session)

77. Run the full suite before and after any change, and report counts
78. Confirm profiles.json and ESK19679.csv are at the repo root
79. Rebuild the nodal/ zip from the current folder each session
80. Read RULES.md in full at the start of each session
81. Share files before writing the report
82. Never commit the upload zip or Eskom on-request data
83. Before believing a zero, confirm the key exists – and a match, confirm the key still means what it did
84. Before claiming what the page does not do, check what it does
85. Splitting a constant means hunting for the places that already split it informally
86. An optimiser result is a proposal until the twelve-year dispatch has run on it
87. The system tested must be the system proposed – every technology, not the ones on screen
88. Two models of the same system read the same constants
89. Decompose a disagreement in energy before naming its mechanism
90. Record what a probe actually tested; never copy a build by hand
91. A check that flips green after a model change needs explaining too
92. Watch the control and scenario counts beside each ratio
93. Measure before building
94. Name the profile set as well as the weather year on any spill figure
95. A capacity figure needs its date and basis – year-end, mid-year or annual mean

## For PARI, if the work proceeds

96. The same calculation across the three metros with the GTI rooftop data
97. Price the four levers: scaled fixed charge, municipal feed-in, shared generation, free basic electricity
98. City Power outage data by cause and feeder
99. Municipal arrears at R120bn, R358bn by 2030/31 – context, not model

## Assumptions register (read when quoting, not worked through)

100. Backcast 2025 mixes an annual-mean rooftop (6,532) with year-end utility solar and wind (2,600, 3,900); the 298.3 MW subtraction does not hold up
101. Backcast 2025 sheds 28.3 GWh against Eskom's 390 on 2025's own demand, imports and hydro; the remainder is reserve-refill shedding the model does not do
102. Coal-retaining adequacy levels before 2 Oct are pessimistic; directions re-measured on three entries hold
103. coalFlexPct is an on/off switch; older entries describe it as a ramp percentage
104. Deep decarbonisation carries 19 GW of lithium at 12h and Fossil-free 32 GW, re-sized 4 Oct; lithium duration held at 12h in the search
105. The remaining 12.7 GW of coal in Deep decarbonisation is binding; retiring more needs firm capacity alongside
106. OCGT utilisation in the MTSAO case is 52.9% against their 45%
107. The adequacy loop converges on Fossil-free 2040 at a 2040 horizon (worst year 4.0 against 4.55); not tested on other presets or horizons
108. REEA_SHARE treats every authorisation as equally likely to be built
109. Planned coal maintenance decides when a build fails, not whether
110. Pumped storage is excluded from the LP's reserve until its energy is modelled
111. The regional optimiser is for siting at a 2030 horizon; its adequacy is uncorrected
112. Tail coal derate 0.76 is the worst measured week in the availability trace
113. The optimiser retains 21.8 GW of coal in 2040 and applies that with its build
114. Wind and solar get zero capacity credit in the optimiser's margin row
115. The deliverable pace allows 4.5 GW of solar a year, above South Africa's record and below Australia's current rate
116. The +3 GW price effect is a flat-block first cut, not an electrification result
117. Spill is set by the weather, shortage by the build
118. The default profile set spills about 5% above the regional set on Fossil-free
119. System cost and retail price are weather-insensitive
120. Rooftop is NTCSA's private total less known wheeled plant; the subtraction is about 414 MW short
121. The retail stack models an Eskom-direct customer; the municipal flag is pinned and inert
122. Rooftop module 2.58 m2 at 620 Wp; packing 0.80 to 0.45 by stated case, typical 0.69
123. Roof form defaults to flat; a dual-pitch roof is about 0.52 of its footprint
124. The 2040 gas build assumes terminals that are not financed and cannot operate before 2030
125. The model answers bulk resource adequacy only
126. Nodal reserve excludes the contingency term
127. Coal book value tracks remaining life
128. Short-term IPP cost ends FY2028 unless re-procured
129. Demand is a TWh target, not a percentage
130. Voltage payment of R60k/MW-yr is a GB contract price
131. Reserve held-back share of 15% – revenue only
132. Reserve price R52/MWh approved, R100 applied
133. Capacity credit flat above four hours
134. Storage pace of 2 GW a year
135. LNG fuel cost derived; terminal and industrial demand outside the model
136. Existing renewables never retire
137. Grid-forming share of 30%
138. Vanadium and iron-air fixed durations in the build LP
138a. Lithium duration capped at 20 hours (LI_MAX_HOURS); dispatch tested 8 to 20 only
138c. Eskom diesel tank and delivery limit off by default (it conflicts with the MTSAO's 45% OCGT assumption), on in Backcast 2025
138b. Both storage forecasts use planned coal commitment capped by the outage state held forward (101-hour horizon); thermal plant does not charge storage in the day's expensive hours. Backcast 2025 sheds 9.4 GWh against Eskom's 390
139. Nine nodal/ data files carry CC BY-NC-ND, not the CC BY 4.0 the data files moved to on 6 Sep
140. eng5 check 3 tolerates a single-step rise of up to 2% of the starting value; the measured 1.7 GWh rise at EAF 55–60% passes it
