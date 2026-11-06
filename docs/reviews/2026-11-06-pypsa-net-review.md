# Review of the ten-area PyPSA network test on claude/regional-audit (message 728)

Reviewed 6 Nov 2026, read-only, by an independent session that did not write the test. Branch claude/regional-audit at
316068c (merge base with main 57f70df). Files read in full: docs/regional-audit/pypsa_net.py (v2) and pypsa_net_v1.py,
engine_dump.js, engine_dump_page.js, pathcheck_dump.patch, run_net.sh, test_v2.sh, test_v2c.sh, check_v2_ext.sh, summ718.py,
summ722.py, summ727.py, net_tables.py, tdp_full.py, tdp_lines_full.json, tdp_substation_map.json,
corridor_circuit_counts.json, the README, every result JSON in results/ and results/718/ that a finding below names, and
docs/regional-audit.md's Messages 717 (c), 718, 722 and 727. Public-source research was done by a helper session under
the standing rules (web search first; nothing read from eskom.co.za or ntcsa.co.za; no long PDFs); its sources are listed
at the end. No NTCSA capacity figure and no hourly Eskom series is in this report.

What I ran (every file in the session scratchpad, none committed):

- A fresh engine dump at the record's own build and state: claude/twin-retime 17f42a5 (build 2026-11-05f), the
  every-change pathway (harness/pathway/final/pathway_every_change_05f.json on claude/c7-runs), the patched pathcheck with
  the chain's environment (LNG=1 GRID=1 SS_FC=reservecoal CONG_OFF=1 WX_WINDCORR=1), weather year 2025, seed k = 0, years
  2035 and 2040. The dump's seed (87866504) equals the committed results' seed, so the runs below are comparable to the
  digit with results/718/net_final_2035_wy2025_* and net_final_2040_wy2025_*.
- Nineteen solves of the committed script on that dump (pypsa 1.4.0, linopy 0.10.1, highspy 1.15.1, python 3.13): the
  tie-out variants (no limits, free, commitment floor, coal fixed) for 2035 and 2040; the one-circuit and as-drawn cases
  for both years; the same cases with v1 for 2035; and the as-drawn and one-circuit cases on two corrected corridor
  tables (finding 1). An hour-by-hour comparison of the script's availability series against the engine's (finding 3).
- A recomputation of the 22-line TDP mapping from nodal/tdp_projects.json and the substation files (it reproduces
  tdp_lines_full.json exactly), and of the 727 (a) cost arithmetic from the committed JSONs (finding 4).

## Verdict in short

The script does what the record says, the committed results reproduce to the digit from the committed scripts, and the
energies are counted once. The one-way-pair script is equivalent to the bidirectional one on dispatch. The tie-out holds
in annual energy and does not hold hour by hour. The findings that change what the numbers mean are about inputs and
accounting, not code: the corridor table already carries PyPSA-RSA's N-1 derate and rates every 765 kV line as a 400 kV
line, so the record's "as drawn (N-0)" rows are N-1 rows and every factor case double-derates; two of the table's
corridors are placeholders with no line behind them yet appear among the most binding in every case; and the free-mix
control is priced without the connection reuse pool and the Cape allowance the run's own LP used, which accounts for half
of the "R12-17bn a year cheaper".

## Findings, in order of effect on results

### 1. The corridor table is already an N-1 table at 400 kV ratings; every factor and circuit-drop case derates it a second time (confirmed)

Where: nodal/nodal_engine.js:9-31 (CORRIDORS, copied at nodal/nodal_engine.py:22-44 and index.html:14307-14318 at
17f42a5 as BLD_CORRIDORS); pypsa_net.py:18-21 (FACTOR, N1C, COUNTS) and 186-198 (cap_ab); the provenance comment at
nodal/nodal_engine.py:14-21 ("rebuilt from PyPSA-RSA's real Existing_Lines.shp geometries ... St-Clair single-line-derated
per its own real length, then summed per corridor"); docs/regional-audit.md 718 (b).

What I measured. PyPSA-RSA's build_topology.py (read by the helper on GitHub) computes each feature's limit as
min(thermal, SIL x 53.736 x length^-0.65) with SIL 602 MW at 400 kV and 2,280 MW at 765 kV, then applies N-1
unconditionally: a corridor with one feature is multiplied by n1_approx_single_lines = 0.7, a corridor with several drops
the feature with the highest limit; base_network.py takes the "_n1" column as p_nom. The model's table reproduces that
rule with the 400 kV SIL for every line. Each single-line corridor in the table equals 0.7 x 602 x 53.736 x km^-0.65 at the
table's own length, to within 1%:

| corridor (table km) | table MW | 0.7 x one 400 kV circuit | lines in the model's own line file (nodal/corridor_electrical.json) |
|---|---|---|---|
| Free State to North West (235) | 651 | 649 | 1, the Mercury to Perseus 765 kV line |
| Mpumalanga to North West (268) | 599 | 596 | 1, the Mercury to Zeus 765 kV line |
| Eastern Cape to KwaZulu-Natal (167) | 813 | 810 | 1 (400 kV) |
| Eastern Cape to Free State (408) | 455 | 454 | 1 (400 kV) |
| Free State to KwaZulu-Natal (450) | 427 | 427 | none (a placeholder) |
| North West to Western Cape (1,139) | 233 | 233 | none (a placeholder) |
| Hydra Central to Northern Cape (187) | 754 | 753 | 4 (one 400 kV, two 220 kV, one more) |
| Northern Cape to Western Cape (164) | 823 | 820 | 2 (400 kV) |
| North West to Northern Cape (229) | 663 | 660 | 2 (400 kV) |

So nine of the 21 corridors, every Karoo exit among them, are one 400 kV circuit at its St Clair loadability times 0.7.
The 765 kV lines the model's own line file lists as existing (Alpha to Beta, two circuits, Free State to Mpumalanga; Beta to
Hydra and Gamma to Perseus, Free State to Hydra Central; Majuba to Umfolozi, KwaZulu-Natal to Mpumalanga; Mercury to
Perseus; Mercury to Zeus) are rated at the 400 kV SIL, 3.8 times below PyPSA-RSA's own 765 kV SIL (2,280 against 602) and
with the thermal cap at 1,788 MW rather than 5,512. The multi-line corridors are consistent with the same method less the
largest circuit (Free State to Hydra Central 2,763 MW for five circuits of which two are 765 kV; Free State to Mpumalanga
2,609 for five of which two are 765 kV).

Three consequences for the record's cases.

- The "as drawn (N-0)" rows of 717 (c), 718 (b) and 722 (a) are N-1 rows. The 0.85, 0.7 and one-circuit cases derate a
  second time; 718 (b)'s verdict that "0.7 on this model's corridor limits double-counts" is right but understates it:
  the circuit-drop case drops a circuit from a limit that already dropped one, and for the single-line corridors it
  multiplies 0.7 by 0.7 (Free State to North West 456 MW for a 765 kV line).
- The circuit counts behind the one-circuit case (corridor_circuit_counts.json, from nodal/corridor_electrical.json,
  which is built from nodal/transmission_lines.geojson) are not the circuits behind the limits (PyPSA-RSA's shapefile).
  Free State to Gauteng is divided by ten circuits ((n - 1)/n = 0.9) on a limit of 1,446 MW that corresponds to about
  1.4 circuits' worth of St Clair loadability; North West to Northern Cape is halved (two circuits) on a limit that is one
  circuit times 0.7.
- The Cape's import limit in the table (Hydra Central to Western Cape 2,377 plus Northern Cape to Western Cape 823,
  3,200 MW) is the size of the 400 kV Cape network before the 765 kV programme: an Eskom scoping study for Hydra to Gamma
  (about 2006 to 2008, as quoted in search results) gave that network 3,400 MW, falling to 2,800 MW with one 400 kV line
  out, and the 765 kV programme since (10,000 MVA planned, 6,000 commissioned by 2014, Kappa to Sterrekus energised
  November 2016, as Engineering News reported) was built to raise it. The model's table rates the one 765 kV circuit it
  has on that corridor as a 400 kV circuit.

Size, measured on the fresh 2040 dump, one circuit dropped, weather year 2025 (base: the committed table):

| case | curtailed TWh | unserved GWh | gas TWh | fuel and carbon R bn |
|---|---|---|---|---|
| base (committed table) | 119.2 | 6,908 | 31.7 | 162.7 |
| the two single-765 kV corridors at one 765 kV circuit (3,000 MW, the TDP convention) | 117.2 | 6,668 | 30.0 | 158.3 |
| the embedded 0.7 removed from the nine single-circuit corridors (table divided by 0.7) | 113.6 | 5,155 | 28.3 | 153.3 |

As drawn (no factor), 2040: base 105.4 TWh curtailed and 2,634 GWh unserved; the two 765 kV corridors corrected 99.8 TWh
and 1,796 GWh; the embedded 0.7 removed 95.8 TWh and 862 GWh, with fuel and carbon R17.6bn lower. In 2035 the embedded 0.7
removed takes the as-drawn case from 54.9 to 47.4 TWh curtailed (coal 114.2 to 106.8 TWh, fuel and carbon R82.1bn to
R76.3bn) and the one-circuit case from 68.1 to 63.7 TWh and from 474 to 230 GWh unserved (the run table at the end). So
the second derate is worth 1.8 TWh of unserved energy and R18bn of fuel and carbon on the 2040 as-drawn row, two thirds
of that row's unserved energy. The corrections do not remove the network effect, because the corridors that bind are the
Karoo exits (North West to Northern Cape 332 MW, North West to Western Cape 163, Eastern Cape to KwaZulu-Natal 569, Free
State to Northern Cape and Hydra Central), whose level the table sets at one circuit times 0.7 whatever the factor. The
level of those exits, not the N-1 rule, is the assumption that moves the result most (section "Which single
assumption").

What this means for the record: the table should be rebuilt at voltage-specific ratings before any 2040 number is
quoted, and the "as drawn" row should be renamed N-1 (PyPSA-RSA's rule) or recomputed without the embedded 0.7 and the
dropped circuit. The St Clair curve itself (Dunlop, Gutman and Marchenko 1979) is a per-circuit operating limit with no
contingency allowance, so some N-1 treatment on top of it is standard; dropping one circuit (PyPSA-RSA, ReEDS) and 0.7 on
a thermal sum (PyPSA-Eur) are the two conventions; applying either to a table that already carries one is not.

### 2. Two placeholder corridors with no line behind them are reported as the most binding (confirmed)

Where: nodal/nodal_engine.js:24 and 13 (North West to Western Cape 233 MW over 1,139 km; Free State to KwaZulu-Natal
427 MW over 450 km); nodal/nodal_engine.py:18-20 ("had no matching real lines in the incomplete shapefile and keep the
original single-line handover estimate"); docs/regional-audit.md 717 (c) and 718 (b) tables.

In every limited case these two appear among the corridors with the highest shadow price: North West to Western Cape
binds in 8,036 to 8,759 hours at R55m (2035) to R308m (2040) per MW-year, second in the list in the committed one-circuit
cases, and Free State to KwaZulu-Natal in 5,486 to 8,759 hours. A 233 MW corridor 1,139 km long between the North West and
the Western Cape does not exist; its shadow price is the price gap between the two buses, and reporting it as "the Free
State hub's exits ... and the North West's links to the Northern and Western Cape carry a shadow price in 7,000 to 8,700
hours" (717 (c), Reading) names an artefact. Energy carried: 1.4 TWh a year. Fix: drop both, or give Free State to
KwaZulu-Natal the lines the model's own line file has (none at 400 kV) and the North West to Western Cape pair nothing.

### 3. The tie-out holds in annual energy and not hour by hour; the coal-fixed variant burns 4 TWh of diesel the record's table does not show (confirmed)

Where: pypsa_net.py:101-119 (nat_avail, scaled); docs/regional-audit.md 717 (c) ("Must-run plant, demand, wind and solar
availability match to the gigawatt-hour by construction") and the tie-out tables at lines 448 and 904.

What I measured. The script scales each area's regional series by one national factor so that the fleet's annual energy
equals the engine's; the hourly shape is the regional series' at the siting shares, not the engine's national series.
On the fresh 2035 dump, weather year 2025:

| series | engine TWh | LP TWh | correlation, hourly | mean absolute gap MW | TWh moved between hours (sum of positive gaps) |
|---|---|---|---|---|---|
| existing wind | 14.51 | 14.51 | 0.961 | 237 | 1.0 |
| new wind | 99.14 | 99.14 | 0.943 | 1,561 | 6.8 |
| existing solar | 8.01 | 8.01 | 0.968 | 177 | 0.8 |
| new solar | 44.35 | 44.32 | 0.999 | 135 | 0.6 |
| all | 166.01 | 165.98 | 0.968 | 1,809 | 7.9 |

In 2040 the new-wind gap is 2,334 MW and 10.2 TWh. By hour of day the LP has 0.5 to 0.85 GW more wind than the engine at
19:00 to 23:00 and 0.3 to 0.45 GW less at 05:00 to 11:00 (2035; 0.8 to 1.3 GW and 0.4 to 0.7 GW in 2040), and its new solar
peaks earlier (plus 0.35 GW at 06:00 to 08:00, minus 0.45 GW at 16:00 to 17:00): the regional modern-turbine map at the
approved-record siting shares against the engine's one national series with its wind correction, and the tracking map on
regional fixed-tilt series against the engine's fleet-basis tracking twin.

What it does to the tie-out. With the engine's coal fixed (coalmin 2) the LP cannot absorb the shape difference and burns
4.01 TWh of diesel against the engine's 0.52, curtails 14.36 TWh against 9.80 and leaves 19.5 GWh unserved where the engine
left none (2035, weather 2025; the committed results/718/net_final_2035_wy2025_nolimit_reea_l0_c2.json has the same
4.011 TWh of diesel). In 2040 the fixed variant runs 4.70 TWh of open-cycle gas against the engine's 2.85. The record's
tie-out tables show coal, curtailment and storage and omit diesel and gas, so the "fixed" column reads as a match (coal
71.5 against 71.5) when its fuel and carbon is R74.9bn against the engine's R64.9bn. The free LP hides the gap by moving
coal and storage. Effect on the differences the record reads: the no-limits base already carries a 7.9 to 11.3 TWh hourly
mismatch of the same order as the N-1 rule's effect (13 to 16 TWh of curtailment); its direction on the corridor results
is not known without a run on the engine's own series split by the siting shares, which the script could do by
multiplying the national series by each area's share (the MIX_NAT option does this for the mix cases only).

### 4. The free-mix control is not priced on the run's own accounting; half the "R12-17bn a year cheaper" is the connection reuse pool and the Cape allowance the run's LP used and the control did not (confirmed)

Where: pypsa_net.py:160-170 (CC) and 213-227 (the extendable generators); engine_dump_page.js (the costs block:
bldNetAnnuityAt, bldGridAnn, bldGridCapexKW); index.html:12990-13016 at 17f42a5 (the rp_ and cw_ credits in bldBuildLP);
summ727.py; docs/regional-audit.md 718 (f) and 727 (a).

What I checked. The costs the control uses are the dump's and I reproduced each from the dump's own fields: wind
R2,517,978 per MW-year (net annuity 2,153.98 R/kW-yr plus the integration charge 364), solar R1,600,162, lithium power
R387,822 (the 0.278 power share of the 4-hour annuity plus fixed O&M) and energy R251,805 per MWh-year (the 0.722 share
over four hours), open cycle R3,476,958; discount 0.08 and the technology costs of capital of cocCase blended; the
capacity payment is off, so nothing is netted twice against the unserved price. The 727 (a) gap reproduces from the
committed JSONs: the run's mix at those costs on the same 3-hour blocks less the control, R11.6bn (2035, weather 2025),
R11.1bn (2035, 2015), R16.1bn (2040, 2025), R12.2bn (2040, 2015). So the comparison is on one accounting, the test's own.

What that accounting leaves out, each item from the run's own pathway rows (c7/pathway_every_change_05f.json and its
engine rows) and the LP code at 17f42a5:

- The connection reuse pool. The run's LP let 14,306 MW of its 2035 solar and 20,833 MW of its 2040 solar (plus the 1,500 MW
  of new pumped storage) use connections freed by retired coal, which avoids the whole grid cost per MW from then on
  (index.html:13005, the rp_ credit at the technology's full grid cost GA[t], here the R364/kW-yr integration charge).
  The control prices every MW of solar at R1,600,162 and the run's mix likewise: R5.2bn a year in 2035 and R7.6bn in 2040
  charged to the run that the run never paid, and never offered to the control.
- The Cape wind allowance: 1,580 MW of wind free of the integration charge (index.html:13016, cw_), R0.58bn a year.
- On the run's basis the gap is R5.8bn (2035, 2025), R5.3bn (2035, 2015), R7.9bn (2040, 2025) and R4.0bn (2040, 2015).
  The record's "R12-17bn" should be read as "R4-8bn on the run's accounting, R11-16bn on the test's".
- Open-cycle gas in the control carries no integration charge (pypsa_net.py:170 adds gridConn only; the LP's bldGridAnn
  adds the full R364/kW-yr to gas): R364,000 of R3,840,958 per MW-year, 9.5% cheap. Direction: favours gas in the control;
  the control still builds less gas than the run (1.1 GW against 4.3 in 2040).
- Corridors are annuitised at 0.08 over 40 years (CRF 0.0839; pypsa_net.py:24 with DISC=0.08 in the queues) where the
  run's own cost of capital for transmission is 0.071 (cocRates tx and grid; CRF 0.0759): the corridor annuities of 718 (d)
  are 10.5% high, R4.3 to 4.7bn a year becoming R3.9 to 4.2bn in 2035 and R5.8 to 6.3bn becoming R5.3 to 5.7bn in 2040.
  The default DISC of 0.055 (CRF 0.0623) in the script is not the run's rate either; every committed extendable case set
  0.08, so the default is unused but misleading.

What the accounting cannot do. The run's 2035 mix was built by a 15-year LP under annual build caps (wind at its 3,500 MW
a year cap from 2028 to 2038), on twelve weather years, and passed an adequacy standard of 20 GWh unserved a year over
240 engine draws; the control is one year, one weather year, one outage draw, no reserve, no adequacy constraint, unserved
energy at R87,000/MWh. On this weather year the run's fixed mix leaves 0.0 GWh unserved and the control 0.2 to 2.8 GWh; on
the eleven other weather years and nineteen other draws the control's mix was not tested. The record's argument (1) in
718 (f) that the gap is "not the build-rate cap or foresight on costs" because the LP at 2040 costs still chooses 29 GW of
wind does not meet this: a 2035-only optimum has no reason to hold wind for 2040, and the run's 2035 wind is a waypoint of
a capped path. The 3-hour blocks (stated in the record) understate the value the run's lithium carries: on the fixed run
the blocks cut lithium discharge from 17.4 to 16.3 TWh (no limits) and unserved from 474 to 445 GWh (one circuit),
pypsa_net.py:271-284. None of this makes the control wrong as a sensitivity; it makes "cheaper than the run" a statement
about the test, not about the run.

### 5. The TDP mapping: the two lines that carry the "22 against 20" difference rest on two substation placements the record has not verified, and one of them lands on a single 400 kV circuit (plausible)

Where: docs/regional-audit/tdp_substation_map.json (Isundu, Umtu and seven others placed "from public documents");
nodal/substations_compact.json (Eros: src manual, kv 132, area Eastern Cape, at 30.61 S 29.91 E); tdp_lines_full.json
(Eros to Isundu 765 kV 3,000 MW 2032 and Ariadne to Eros 900 MW 2027 as Eastern Cape to KwaZulu-Natal; Mercury to Umtu
765 kV 3,000 MW 2033 as North West to Northern Cape; Gamma to Grassridge 765 kV 3,000 MW 2032); pypsa_net.py:177-185 and
196-198; docs/regional-audit.md 718 (c).

What I checked. The 22-line list recomputes exactly from nodal/tdp_projects.json, the substation areas and the nine
manual placements; the by-pair and by-year sums in 718 (c) are right; the MW per circuit (900 at 400 kV, 3,000 at 765 kV,
600 at 275 kV) is capacity_siting.js's TDP_KV_MW typed again at pypsa_net.py:181 (one constant in two files); three of the
22 lines have no voltage in the file and take the 900 MW default (Aries to Juno, Matla to Jupiter, Ariadne to Eros); every
line is dated, so none is dropped by the year filter. Units and direction: MW added to both directions of the pair;
corridor pairs with no line today would be added at 300 km, but none occurs.

What the record did not say. The committed 718 (b) table shows the full mapping removing 18.9 TWh more curtailment than
the file's own 20 lines in 2035 and 27.4 TWh in 2040 (one circuit dropped). That difference is two lines: Eros to Isundu
(Isundu placed in KwaZulu-Natal) and Mercury to Umtu (Umtu placed in the Northern Cape). The helper's search found Eros
described as a 400 kV substation near Harding, KwaZulu-Natal (Engineering News, 27 June 2014), with Eros to Ariadne inside
KwaZulu-Natal and Eros to Vuyani (Mthatha) and Eros to Neptune as its Eastern Cape links; Isundu on the authorised Venus to
Sigma to Hector to Ariadne 765 kV corridor near Pietermaritzburg; no public source for a 765 kV Eros. The model's own line
file has one line at Eros, Eros to Vuyani 400 kV, both ends in the Eastern Cape area. So the 3,900 MW the TDP adds to
Eastern Cape to KwaZulu-Natal in the model arrives at a node whose Eastern Cape side is one 400 kV circuit in the model's
own data: whether the Eastern Cape's 12.9 to 14 TWh of curtailment in the TDP cases can leave by this corridor depends on
within-area lines the ten-area model does not carry. If the GCCA supply-area polygon puts Eros in the Eastern Cape area,
as the file's manual placement implies, the mapping follows NTCSA's geography and the record should say so; if not, the
corridor's existing 813 MW and its TDP additions are inside KwaZulu-Natal. Either way the 19 to 27 TWh is an upper bound.
Gamma to Grassridge is a double-circuit 765 kV line in Eskom's own notices ("2 x 765 kV", as quoted in search results) and
is mapped as one 3,000 MW circuit, so the Eastern Cape to Hydra Central relief is understated by half.

### 6. Reproducibility: the one-circuit cases do not run from the committed layout (confirmed)

Where: pypsa_net.py:20 (S_COUNTS = dirname(__file__)/../corridor_circuit_counts.json); the README.

Every n1c and n1ctdp run from docs/regional-audit/ fails with FileNotFoundError unless CIRCUITS names the file, because the
script expects the other session's layout (sc/ beside the counts file). The summary scripts hard-code that session's
scratchpad path. With CIRCUITS set, my v1 run of the one-circuit 2035 case reproduces the committed JSON to the digit
(objective R134.943bn, curtailment 67.873 TWh, unserved 474.15 GWh); the committed results are sound, the instructions are
not. The same class of fault as the record's "crashed on a path defined after its use".

### 7. The one-way-pair script is equivalent to the bidirectional one on dispatch (confirmed)

v1 against v2 on the fresh 2035 dump, no limits: coal 62.881 TWh in both, fuel and carbon R45.12bn in both, curtailment
3.050 against 3.069, storage discharge 10.34 against 10.27 (a degenerate split: no cost on curtailment), objective
R44.511bn against R45.127bn (the R0.6bn circulation reward removed, as the record says). One circuit dropped: coal 126.489,
fuel R93.69bn, unserved 474.15 GWh, the same binding corridors with the same hours and shadow prices in both; curtailment
67.873 against 68.075; objective R134.943bn against R134.946bn (the reward was worth R3m where the corridors bind). The
committed 718 results are v1 except where marked; their objectiveRbn understates by up to R0.6bn in the no-limits cases
and their energies stand. The extendable-corridor pair constraint (pypsa_net.py:300) ties the two directions, so the
expansion is counted once (line 383); capexRbn subtracts the corridor base (line 373).

### 8. Curtailment and unserved reporting: right in every case type, with two things to say (confirmed)

Fixed build: curtailment is availability less output per carrier and area (pypsa_net.py:334-341), unserved is the
unserved generator's energy (line 389). Free siting and free mix: against p_nom_opt since the 5 Nov fix (line 331). Time
blocks: energies, binding hours and shadow prices are scaled by the block length (W), which PyPSA 1.4 applies to the
objective, the stores and the generators alike (checked: a Series assigned to snapshot_weightings broadcasts to all three
columns); curtailment against block means understates peaks, as the record says. The timing-only DAYS cases report the
sample's energies unweighted, as their note says, and none is in a results table. Two things the tables do not show: the
"fixed" tie-out column's diesel and gas (finding 3), and the engine's own unserved energy, 15.6 GWh in 2040 against the
LP's 2.1 with no limits (the engine's reserve and forecast rules). The fuel-and-carbon column prices coal at a flat
costCoal plus VOM plus carbon (line 145) where the engine prices it on its unit merit curve with a part-load factor
(index.html:10007 and 10038), so the column's level is not the engine's (R45.1bn free against the engine's R64.9bn,
which also carries nuclear, diesel and start-ups); the record uses differences, which is right.

### 9. Constants typed twice, and one that is wrong for half the fleet (confirmed, small)

- pypsa_net.py:147-148: the open-cycle heat-rate ratio (10624 / 3600 x 0.52) and VOM (80.19 x 1.068) are FIXED's
  heatRateOcgtKJ, effCcgtHHV, vomOcgt and CPI_JAN24_TO_JAN26 typed again (index.html:5592, 7255); they agree today.
- pypsa_net.py:181: the MW per circuit by voltage is capacity_siting.js:50's table (TDP_KV_MW) typed again.
- The corridor table itself exists three times: nodal/nodal_engine.js:9-31 (21 corridors, read by the script),
  nodal/nodal_engine.py:22-44 (the same 21) and index.html:14307-14318 (BLD_CORRIDORS, 20: the Free State to North West
  corridor is absent from the build LP's copy). The network test reads the first; the page's build LP uses the third.
- pypsa_net.py:231: the commitment floor uses 0.57 for every unit; the engine's design minimum from 2030 is 0.57 for the
  groups whose own minimum is 0.65 and 0.52 for the groups at 0.50 (index.html:6253 and 7476, coalMslDesign [0.57, 0.52]).
  The floor variant's coal is up to 10% high on the 0.50 group; it changes only the "floor" columns.
- pypsa_net.py:151 and 155-158: the diesel, pumped-storage, existing-battery and lithium site shares are typed from
  fleet_units.csv, the nodal engine and the BESIPPPP results rather than read; the record states them as assumptions.

### 10. Smaller points on the energies (confirmed)

- Exports (6.5 TWh of firm exports inside the engine's load line, 2.7% of grid load) are split across every area by the
  demand shares (pypsa_net.py:95-96, 213) rather than placed at the border areas (Mpumalanga, Limpopo, the North West and
  Northern Cape). Direction: eases the hub's eastward exits. Not sized.
- Wind and solar availability: the LP's 165.98 TWh against the engine's 165.79 (output plus curtailment), 0.19 TWh or 0.1%,
  of which 0.03 is clipping; the rest is plausibly the Cape allowance's 4% on 1,580 MW (0.23 TWh), which the engine
  counts outside its curtailment.
- Counted once, as checked: load is the engine's served grid load (loadS less charging plus demand response, which is
  index.html:10068's definition) plus rooftop, and rooftop is regenerated as must-run at the same energy (30.349 TWh in
  both); storage charging is netted; the 68 MW of existing batteries, 2,724 MW of pumped storage, 600 MW of CSP, Koeberg,
  hydro, the hybrids, 3,400 MW of diesel (4,669 in 2040 with the new open-cycle diesel, once), coal from the UC_FLEET groups
  scaled to the state's remaining MW with the engine's hourly availability, and new open-cycle gas as the engine's
  ccgtCap less newOcgtMW. Carbon is the engine's R61.3/t (the kept2030 path's net share; checked at index.html:8360
  against carbonTaxAt) and the engine's coal carbon floor does not apply after 2030, so the LP's carbon agrees.

## Which single assumption moves the result most

From the committed results (2035 and 2040, weather year 2025, one circuit dropped unless stated), the change in
curtailment and unserved energy:

| assumption | 2035: curtailed TWh, unserved GWh | 2040: curtailed TWh, unserved GWh |
|---|---|---|
| today's corridor table against no limits (as drawn) | +51.6, +2 | +91.9, +2,632 |
| corridors extendable at R10,000 per MW-km (removes the table) | -64.1, -474 | -104.9, -6,906 |
| the TDP's 22 inter-area lines at their dates | -48.6, -474 | -63.1, -6,906 |
| siting chosen by the LP under the approved caps | -27.4, -459 | not run |
| the 22-line mapping against the file's 20 lines (Eros to Isundu, Mercury to Umtu) | -18.9, 0 | -27.4, -148 |
| the N-1 rule: 0.7 against as drawn; one circuit; 0.85 | +16.3, +703; +13.2, +473; +7.9, +162 | +18.0, +5,757; +13.9, +4,274; +8.9, +2,559 |
| the embedded 0.7 removed from the nine single-circuit corridors (this review; one circuit, and as drawn) | -4.4, -244; as drawn -7.5, -2 | -5.6, -1,753; as drawn -9.6, -1,772 |
| fleet siting against approved-record siting | +8.1, +555 | not run |
| weather year 2015 against 2025 | -6.5, -277 | -9.4, -1,247 |
| the two 765 kV corridors at one 765 kV circuit (this review; one circuit, and as drawn) | -0.8, -36; as drawn -3.2, -2 | -2.0, -240; as drawn -5.6, -838 |
| the demand split (static shares) | -1.0, -48 | not run |
| losses 6% per 1,000 km | 0.0, +117 | -0.1, +580 |
| the commitment floor (one circuit) | 0.0, 0 (no limits: +9.7 curtailed) | 0.0, 0 |

The corridor table's level is the assumption: its Karoo exits are single 400 kV circuits times 0.7, its 765 kV lines are
rated as 400 kV, and two of its corridors do not exist. Everything else in the record is a sensitivity around that level.
The record's 727 (d) says the same in its own words ("the weak point of every 2040 result"); this review adds that the
weakness is identifiable from the model's own files without a new source, and that the fix (voltage-specific St Clair
ratings on the model's own NTCSA-derived line file, N-1 applied once, the two placeholders removed) is a day's work before
any new data arrives. Where a public anchor exists it points the same way: the pre-765 kV Cape network alone was rated
by Eskom at 3,400 MW, the model's whole Cape import is 3,200.

## What I checked and found sound

- The engine dump: the patched pathcheck applies the pathway's settings (tracking, the add-back, the coal floor, the
  reservecoal lift, imports ending 2030) and the dump's state, caps and energies match the committed engine rows and the
  committed result files' engine block to the digit.
- The regional data at the worktree's build: wind and solar series from profiles_regional_multiyear.json at the file's
  scale, the modern-turbine map and correction, the tracking map by month and hour, the demand file's hourly shares, the
  approved-record siting filter (duplicates removed, non-generation records excluded), the capacity file's existing MW.
- The lithium split (power at the 0.278 share, energy per MWh over four hours), round trips, cyclic stores, perfect
  foresight (stated); the coal floor at the engine's committed MW; the engine's coal fixed exactly (71.460 and 45.464 TWh).
- Shadow prices: the upper-bound duals of the two one-way links summed, lower bounds excluded (pypsa_net.py:349-355),
  which is right for a pair; bindingHours on a R1/MWh threshold; the value per MW-year as the sum.
- The 718 (a) today's-fleet cases and the Koeberg calendar: not rerun; the method (KOEBERG_OUT) reads correctly.
- v1 against v2 as above; the committed results reproduce to the digit.

## What I did not check

- Weather year 2015, outage seeds other than k = 0, the Fossil-free and Deep stand-ins, the free-mix cases themselves (no
  3-hour-block solve was rerun; the arithmetic on their JSONs was), the free-siting cases, the losses cases.
- Whether the GCCA supply-area polygons place Eros, Harding and the south coast in the Eastern Cape or KwaZulu-Natal
  area: the file says Eastern Cape by a manual placement; the public record says Harding, KwaZulu-Natal; the polygon
  itself was not opened.
- A corrected corridor table: I changed eleven numbers in a scratch copy to size the double derate and the 765 kV rating;
  I did not rebuild the table from the line file, and the sizes above are those two edits only.
- The 60 within-area TDP lines, the demand file (14fa), PyPSA-RSA's licence, and whether the national series' regional
  weights or the siting shares are the better hourly shape (finding 3 measures the gap, not which side is right).
- The 718 (d) unit costs (R10,000 and R21,700 per MW-km): R10,000 is index.html:14326's comment at 17f42a5 (a
  TDP-reported R12-18m per km over about 1,400 MW), not a computed figure; not researched further. All index.html line
  numbers in this report are at 17f42a5 (build 2026-11-05f), the build the test ran on.

## Runs made (scratchpad, not committed)

Engine dump: build 2026-11-05f, pathway_every_change_05f.json, weather year 2025, seed 87866504, 2035 and 2040.

| case (script v2 unless stated) | year | curtailed TWh | unserved GWh | coal TWh | gas TWh | diesel TWh | storage TWh | fuel and carbon R bn |
|---|---|---|---|---|---|---|---|---|
| engine | 2035 | 9.80 | 0.0 | 71.46 | 0.00 | 0.52 | 18.51 | 64.9 (fuelCost) |
| no limits, free | 2035 | 3.07 | 0.0 | 62.88 | 0.00 | 0.19 | 10.27 | 45.1 |
| no limits, free, v1 | 2035 | 3.05 | 0.0 | 62.88 | 0.00 | 0.19 | 10.34 | 45.1 |
| no limits, commitment floor | 2035 | 12.98 | 0.0 | 74.18 | 0.00 | 0.19 | 16.69 | 53.0 |
| no limits, coal fixed | 2035 | 14.36 | 19.5 | 71.46 | 0.00 | 4.01 | 15.88 | 74.9 |
| one circuit dropped | 2035 | 68.08 | 474.2 | 126.49 | 0.00 | 0.85 | 9.65 | 93.7 |
| one circuit dropped, v1 (= committed) | 2035 | 67.87 | 474.2 | 126.49 | 0.00 | 0.85 | 10.31 | 93.7 |
| engine | 2040 | 22.11 | 15.6 | 45.46 | 2.85 | 0.63 | 24.87 | |
| no limits, free | 2040 | 13.40 | 2.1 | 36.88 | 1.75 | 0.33 | 22.44 | 31.5 |
| no limits, coal fixed | 2040 | 24.53 | 2.1 | 45.46 | 4.70 | 0.34 | 23.91 | 43.8 |
| as drawn | 2040 | 105.4 | 2,634 | 99.8 | 23.7 | 3.02 | | 138.6 |
| as drawn, two 765 kV corridors at 3,000 MW | 2040 | 99.8 | 1,796 | 99.2 | 20.0 | 2.87 | | 129.4 |
| one circuit dropped | 2040 | 119.2 | 6,908 | 99.9 | 31.7 | 4.16 | 14.8 | 162.7 |
| one circuit dropped, two 765 kV corridors at 3,000 MW | 2040 | 117.2 | 6,668 | 99.9 | 30.0 | 4.06 | 13.8 | 158.3 |
| one circuit dropped, embedded 0.7 removed on nine corridors | 2040 | 113.6 | 5,155 | 99.9 | 28.3 | 3.81 | | 153.3 |
| as drawn, embedded 0.7 removed on nine corridors | 2040 | 95.8 | 862 | 98.8 | 18.3 | 2.15 | 18.0 | 121.0 |
| as drawn | 2035 | 54.9 | 2 | 114.2 | 0.00 | 0.38 | 9.3 | 82.1 |
| as drawn, two 765 kV corridors at 3,000 MW | 2035 | 51.7 | 0 | 110.8 | 0.00 | 0.33 | 7.1 | 79.5 |
| as drawn, embedded 0.7 removed on nine corridors | 2035 | 47.4 | 0 | 106.8 | 0.00 | 0.27 | 9.2 | 76.3 |
| one circuit dropped, two 765 kV corridors at 3,000 MW | 2035 | 67.3 | 438 | 125.6 | 0.00 | 0.85 | 8.0 | 93.0 |
| one circuit dropped, embedded 0.7 removed on nine corridors | 2035 | 63.7 | 230 | 122.3 | 0.00 | 0.75 | 8.9 | 90.1 |

Hourly mismatch (finding 3) from hourly_mismatch.py on the same dumps. Research by the helper session: PyPSA-RSA
build_topology.py, base_network.py and config.yaml on GitHub (raw), PyPSA-ZA's num_lines.csv and the 2017 paper's
abstract, PyPSA-Eur config and Xiong et al. 2024 (arXiv 2408.17178), ReEDS model documentation and Brown et al. 2023
(arXiv 2308.03612), Engineering News reports of 2013, 2014, 2016 and 2019 on the 765 kV programme and on Eros, Ariadne
and Venus, an Eskom Hydra to Gamma scoping study and Eskom EIA notices as quoted in search results, the Hitachi Energy
Cape Corridor page (snippet), Daily Maverick and Renewable Watch on the TDP's kilometres; every item from a search
snippet or a GitHub raw file, none from eskom.co.za or ntcsa.co.za, no PDF opened.
