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
14z. From Weber et al. 2026 (Cell Reports Physical Science, ANU): (a) add pumped hydro to the build optimiser, with a duration choice (about 24, 48 and 160 hours) and South African site costs from the ANU RE100 atlas, checked against Tubatse; (b) review the pumped-storage cost (now Tubatse-based, about R2,090/kWh at 14 hours against the paper's USD 14-47/kWh for large off-river sites) and its 60-year life (paper: about 75); (c) dropped 5 Oct: a 3% real rate is below South Africa's real sovereign yield and too optimistic; any future financing sensitivity should start from the sovereign real yield or NERSA's allowed regulated return; (d) check whether the weighted, chained representative days distort long-duration storage, part of the optimiser-engine gap (14u); (e) near-optimal (MGA) search for gas-free and early-coal-exit pathways within a few percent of least cost; (f) note that gas pathways leave LNG terminal and storage costs out; (g) Ingula (1,332 MW, 21 GWh, R26.8bn reported, Engineering News 2016; built 2006-2017) supports the 'tubatse' cost basis: escalated, about 42% above the atlas fit against Tubatse's 28% (SOURCES; depends on escalating mixed-year spend); (h) the 2033 earliest build date for pumped hydro is optimistic against Ingula's 11 years; (i) ANU South African site spreadsheet requested, awaiting it for (a)
14y. Hydrogen-fuelled power plants as a technology: firm dispatchable capacity with hydrogen fuel cost, fuel storage and efficiency, linked to the electrolyser item (14s) so curtailed energy can make the fuel. Mpumalanga project: HDF Energy's Renewstable Mpumalanga, on 1,782 ha leased from Eskom near Tutuka and Majuba (land tender MWP1247GX): eight plants planned, about 1,500 MW of solar with over 3,500 MWh of hydrogen storage and fuel cells, USD 3bn (HDF, 2023); four-plant Majuba cluster in environmental assessment, 74 MW per plant (SAHRIS). Development stage only; check current status before loading anything. It is solar-plus-hydrogen storage, so it belongs with long-duration storage as much as with firm plant. Reference case: Calistoga Resiliency Center (Energy Vault for PG&E, COD Sept 2025): 8.5 MW peak, 6 MW continuous, 293 MWh, at least 48 hours, PEM fuel cells on liquid hydrogen with batteries for black start; replaces rented diesel for a local microgrid; cost-recovery ceiling USD 46.3m over the project life (LinkedIn post, figures to verify against primary sources). Note the scope: Calistoga is local resilience, not bulk adequacy, which is what this model covers
14v. Second-pass sweep of panel prose for stale text (slider notes done 5 Oct)
14w. Other constants still on R16.21/USD (battery degradation, ATB VOM anchors): move to R16.50 or record why not
14x. Transmission note cites R440bn for 46.9 GW; SOURCES cites over R390bn for 56 GW from the same TDP: reconcile; a third figure from the IEP workshop slides (DEE, 5-6 Oct 2026): about 14,500 km for about R430bn. Find the primary source for each
14u. Optimiser-engine gap: closed by outage-path stress windows (5 Oct, RESULTS): no margin needed. On independent outage draws (5 Oct) both pathways meet the standard every year, worst 2.89 GWh (op) and 3.08 (sd14) against about 3.9. Open: re-test pumped hydro with outage-path windows
14u1. Half-standard pathway: on pathway_op's settings with all-year windows it stalls at about the full standard (2038-2040 near 3.6-3.9 GWh against 1.97 after four passes) and HiGHS (WebAssembly) aborts at pass 5 (RESULTS, 5 Oct). You: native HiGHS for larger LPs, shorter windows, or park? Also decide whether build 05j's window scoping (windowLeadYears, default 4) stays: the 5 Oct pathways only reproduce with it set to 14
14n. Rooftop in system cost: both reported in the pathway (whole and grid cost). Open: show both on the page
14o. Full model audit, as an energy modeller and grid operator: gaps, inconsistencies and errors
14p. Find a published scenario from a professional modelling group and test the model against it
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
26. Model pumped storage energy in the LP, so it can count as reserve honestly
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
