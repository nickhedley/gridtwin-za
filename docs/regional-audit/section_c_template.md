
## Message 717 (c): PyPSA network sensitivity of the central build (first result, 5 Nov 2026)

What ran. A ten-area, 8,760-hour linear programme in PyPSA 1.4.0 (HiGHS 1.15.1), built on the national engine's own hourly run
rather than on the regional model's data, so that the no-limits case can be tied to the engine first. Build: the committed c7
run harness/pathway/c7/pathway_c7.json on claude/c7-runs (build 2026-11-03a, LP key c62ec3e615), its 2035 and 2040 states from
its committed engine checks, as a stand-in: the every-change pass (build 2026-11-05f) is not on the branch (its outputs are in the
main session's scratchpad, c710/all.json). Weather years 2025 and 2015 (the worst-week year), outage seed k = 0 of the chain's
seeds. Scripts, the patch and every case's result are in docs/regional-audit/ (README there); the engine dumps stay in the
scratchpad because they carry hourly series derived from profiles.json.

Method, in the order the engine's run is taken apart:

- Engine run: harness/pathcheck.js, patched with two lines, writes the engine's hourly run for one weather year after applying
  every setting the pathway recorded (tracking solar on, the rooftop add-back at 0.8895, the coal practice floor, the
  'reservecoal' inertia lift, imports ending in 2030). The LP reads only that dump and the build's own regional files.
- Demand: the engine's served grid load (its demand line less storage charging, plus demand response) plus its rooftop output
  gives the gross load; split by the hourly area shares of nodal/demand_2025_regional.csv (the file of TODO 14fa). Rooftop is a
  must-run generator per area, the national rooftop series at the 0.78 derate, by the shares of nodal/rooftop_mw_by_region.json
  less the private solar inside it. Exports stay inside the national load.
- Wind and solar: each area's series for the weather year from nodal/profiles_regional_multiyear.json at that build (wind at
  the 1.0753 fleet factor, PVGIS solar). Existing wind and solar by the capacity file's MW per area. New wind by the siting
  shares below, on the regional LP's modern-turbine map times the correction (k = 0.9655 on the 'bw6' case); new solar on the
  national tracking ratio by month and hour. Each of the four is scaled so its annual availability equals the engine's own:
  existing wind and solar need no scaling (factor 1.000), new wind 0.966, new solar 0.992, and clipping new solar at 1 per unit
  loses 0.76 of 58.1 TWh in 2035.
- Must-run plant as the engine dispatched it, hour by hour: Koeberg (Western Cape), hydro (Hydra Central), the RMIPPPP hybrids
  (Northern Cape), CSP (600 MW, Northern Cape). Imports: none after 2030.
- Coal: the UC_FLEET groups standing in the year by their dates (14 groups, 25,257 MW in 2035 scaled to the state's 25,916;
  2040 likewise), by area (Mpumalanga, Limpopo, Gauteng), with the engine's own hourly available coal (its outage draw and the
  inertia lift, mean 17,638 MW in 2035) shared pro rata; marginal cost costCoal plus VOM plus carbon. The LP commits nothing,
  so two variants bound the effect: 'floor' imposes 0.57 of the engine's hourly committed coal (the design minimum stable
  level from 2030), 'fixed' imposes the engine's hourly coal output.
- Gas and diesel: combined-cycle and open-cycle LNG at Richards Bay (Kwazulu Natal) at the engine's costs, open cycle at its
  heat-rate ratio of 1.53; diesel 3,400 MW at the fleet's areas (Western Cape 67%, Kwazulu Natal 22%, Eastern Cape 11%).
- Storage: pumped storage 2,724 MW and 60 GWh at Kwazulu Natal 80% and Western Cape 20%; the three operating Eskom batteries;
  new lithium (9,466 MW at 5.3 h in 2035; 13,059 MW at 6.2 h in 2040) at the BESIPPPP shares North West 40%, Free State 35%,
  Northern Cape 25%; round-trip 0.76 and 0.88, cyclic, perfect foresight. Unserved energy at R87,000/MWh in every area.
- Not carried: the engine's reserve, synchronous floor, demand response and VPP (0.2 GWh); a R0.01/MWh hurdle on each corridor.
- Corridors: the engine's 21 and their lengths. Cases: no limits; today's limits as drawn (N-0, for context); N-1 at 0.7 times
  today's; N-1 with the TDP lines that join two areas, at their TDP year and 0.7 (20 of the TDP's 82 lines; 17 lines have an
  endpoint absent from the substation list, Umtu, Isundu, Coega, Hlaziya and others, and are not counted, so this case
  understates the plan's relief); MW per circuit 900 at 400 kV, 3,000 at 765 kV, 600 at 275 kV (capacity_siting.js). Losses
  sensitivity: 6% per 1,000 km linear (PyPSA-RSA config.yaml) as two one-way links. A corridor "binds" in an hour when its
  capacity carries a shadow price; the sum of those prices is the value of one more MW for a year.
- Siting: approved REEA records (the page's generation filter) assigned to the area of their nearest substation. <<SITING>>
  Alternative: the existing fleet's shares (wind Eastern Cape 42%, Western Cape 27%, Northern Cape 17%, Hydra Central 14%).

Tie-out, no limits, against the engine (TWh; the LP free, with the commitment floor, and with the engine's coal fixed):

<<TIEOUT>>

Explanation of the gap, before reading the cases: with no network and no unit commitment the LP shuts coal in daylight and
curtails 10 TWh less than the engine, which holds its committed coal at the practice floor and cycles storage against its
own forecast. Must-run plant, demand, wind and solar availability match to the gigawatt-hour by construction. Imposing the
engine's committed coal at the design minimum returns coal and curtailment to the engine's (2035: coal 76.3 against 76.3,
curtailment 14.6 against 13.0); fixing the engine's coal returns storage too (21.9 against 23.1). Gas and diesel in the LP
are near zero where the engine burns 0.4 to 0.7 TWh, the engine's reserve and forecast rules. So the differences between
cases, all on the free LP unless stated, are read as network effects on an optimum, with the floor variant showing how much
of each difference survives the engine's own coal practice.

Differences from the no-limits case on the same year, weather year and siting:

<<CASES>>

<<AREAS>>

Reading. With today's corridors, even as drawn (N-0), the Karoo and Cape cannot export the 2035 build's wind and solar: about
45 TWh is curtailed in Hydra Central, the Northern Cape, the Eastern Cape and the Western Cape and inland coal runs instead,
at R30-35bn a year of fuel and carbon. At N-1 it is 58-65 TWh in 2035 and 89-98 TWh in 2040, where gas also runs 32-34 TWh
more and unserved energy appears (91-132 GWh). The TDP lines that join two areas, at their own dates, halve the effect
(2035: +29 to +33 TWh curtailed; 2040: +51 to +59). The Karoo corridors themselves are not the first to bind: the Free
State hub's exits to Gauteng, Mpumalanga, North West and KwaZulu-Natal, the North West's links to the Northern and Western
Cape, and the Eastern Cape to KwaZulu-Natal corridor carry a shadow price in 7,000 to 8,700 hours of 2035, worth R6-8m per
MW-year each, against a line cost of roughly R0.25m per MW-year on the model's own R10,000 per MW-km; with the TDP lines the
same corridors bind in about 5,700 hours at R4m. In 2040 the values reach R33-46m where unserved energy prices the hours.
Losses change the energies by less than 1 TWh (the corridors bind on capacity). Siting new wind and solar by the existing
fleet's shares, which puts more in the Eastern Cape, curtails 6-8 TWh more. With the engine's commitment floor the N-1
difference falls from +65 to +53 TWh in 2035 and from +98 to +86 in 2040.

Caveats. (1) Within-area limits are absent, so every case is a lower bound on congestion. (2) Perfect foresight and no
commitment in the LP; the differences, not the levels, are the measure, and the floor variant bounds the practice effect.
(3) The corridor limits are the model's own: single-circuit St Clair loadability summed per corridor from PyPSA-RSA's
shapefile of unknown vintage; two corridors are estimates; a wrong table moves every case. (4) PyPSA-RSA's licence terms are
still being confirmed. (5) The demand split is the unconfirmed regional file's (14fa). (6) New-build siting is a share of
approved permits, not a plan; the Hydra Central share (23% of wind) rests on the substation list's area for the Karoo sites.
(7) The stand-in build is c7 before the 707 changes; the method does not change for the every-change pass, only the numbers.
(8) Two weather years and one outage seed. (9) No NTCSA capacity figure and no hourly Eskom series is committed.

Rerun on the final key: give me the pathway JSON (and its pathcheck rows) and the build it ran on; the chain is
pathcheck_dump.patch at that build, then run_net.sh, about an hour for the thirty cases.
