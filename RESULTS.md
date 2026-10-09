# GridTwin ZA - verified results

Findings fit to quote externally, each with the scenario that produced it. A
number without its scenario is not a result. Every entry states the weather year
and the period, because an annual figure and a July figure are not comparable.

THE SCENARIO INCLUDES THE PANEL'S OWN CONTROLS, not just the external comparison.
Added 15 Sep 2026 after three entries in one day could not be reproduced from what
was written down: the retail headlines, which do not record basis, scenario year,
or whether the figure is a week or an annual mean; the battery saturation table,
which did not record the reserve price; and the derived knee, which recorded a
number the code no longer produces. Every entry must carry the preset, the
scenario year, and every toggle that is not at its default. An entry that cannot
be re-derived from what it states is not a result either.

SECOND CAVEAT, 2 Oct 2026: every adequacy figure below for a build that KEEPS COAL predates the
engine charging storage from coal ahead of stress, and is pessimistic by some amount. Directions
re-measured on three key entries all hold; levels do not. See "Which earlier findings the charging
fix touches".

Third caveat, 8 Oct 2026: every result from the build optimiser (the national build LP, bldBuildLP, and the
regional one, bldBuildRegionalLP) on a build before `2026-10-08c` is provisional. Both LPs kept one storage energy
balance per day, so a store could discharge in the morning energy it charged that afternoon (entry "Why the engine
sheds where the optimiser served in full"). Build `2026-10-08c` gives the national LP an hourly state of charge (entry
"Hourly state of charge in the build LP"); the regional LP still has the daily balance (TODO 14bn),
and no regional optimiser result is to be published until it is fixed with 14bj (user, 8 Oct). Entries whose main
finding is an optimiser output carry "pending the storage fix" in the heading and stay as written until re-run.
Engine-only results (dispatch, adequacy checks of a fixed build, preset searches scored on the engine) are unaffected.

CAVEAT ON EVERYTHING BELOW: all of it is ONE synthetic-normal weather year. The
ten-year run is outstanding and will move these, probably outward, because a bad
wind year is exactly what sets a capacity requirement.

---

## The system cost was missing a third of itself

Build `2026-09-20a`, 18-19 Sep 2026. Two costs that no system-cost aggregate had ever carried
were added in one session. `avgCost` at defaults went R548.06 to R883.50/MWh.

**Fixed O&M for the existing fleet, R61.6bn/yr, 34% of system cost at defaults.** Before this,
`totalCost` and `gridCost` were fuel plus carbon plus new-build capital. Medupi cost fuel and
carbon; Koeberg cost essentially nothing. Staff, maintenance, overhauls, insurance and rates
were absent for 39.7 GW of coal and everything else already built.

THE BIAS RAN ONE WAY. Retiring coal appeared to save only fuel and carbon when it also stops a
maintenance bill that does not fall with output. Every coal-versus-renewables comparison this
model has produced understated the case for replacement. Retiring 27 GW now saves R31.4bn of
O&M the model previously could not see.

Calibrated to Eskom's own filing, not to benchmarks: Generation MYPD 6 (NERSA, Aug 2024)
Table 1 gives R55,093m of opex over the Table 4 fleet of 46,686 MW. Our constants reproduce
that to 99.9% on that fleet. Relative weights across technologies are international
(European vintage study) because the filing gives no split.

  THREE CAVEATS. It is an APPLICATION, not an outturn, and NERSA applies a prudency test, so
  it is an upper bound. It includes CENTRALISED SERVICES allocated to Generation. And the
  per-technology split is the weakest part - Table 54 of the same filing would replace it.

**The REIPPPP PPA obligation, R11.7bn/yr.** Existing wind and solar cost the system NOTHING
before this: there is no `costWind` or `costPv`, so their fuel and carbon are zero, and
`newCapexR` covers new build only. Nearly 8 GW of IPP renewables generated free electricity in
every scenario the model had ever run.

Only REIPPPP is charged - 4,042 MW wind and 2,783 MW solar. `by_source` separates the fleet to
the megawatt, and private wheeled (470/488) and Eskom-owned (100/0) carry fixed O&M like every
other existing asset. The distinction is not sunk cost: a PPA is a CONTRACT, not an asset, and
Eskom pays because it signed.

CHARGED ON DELIVERED OUTPUT. Curtailment up to 10% is uncompensated per the March 2024
Addendum and deemed energy above that is already modelled, so charging contracted output would
count the curtailed portion twice. Rolls off 2034-2041 as the twenty-year PPAs expire.

### Sunk capital stays out, and that is deliberate

PyPSA's convention: for existing plant the annuity is a constant in the objective and cannot be
avoided by any decision, while fixed O&M is exactly what `coalDecomMW` stops paying. Same
reasoning excludes stranded assets from system cost - retiring Medupi early consumes no
additional resources, it means capital is not recovered from customers. That is a transfer and
it belongs in the retail panel, which has a stranded basis.

---

## New-build capex was blind to ten years of learning

Build `2026-09-20a`, 19 Sep 2026. `newCapexR` read the flat `acap*` constants, which hold the
same quantity as `BLD_COST` + `BLD_FOM` and never decline. Rule 6: no constant appears twice.

Now derived from `bldCapex` at the scenario vintage. The same fossil-free build:

```
build year   newCapex R bn   totalCost R bn   avgCost R/MWh
2026                 520.7            537.5          2,609
2035                 462.6            478.4          2,309
2040                 434.5            445.7          2,143
2050                 386.1            396.4          1,893
```

GOING EARLY COSTS R49.3bn A YEAR, about 12%, between 2040 and 2050. BEFORE THIS FIX THE MODEL
SAID R1.2bn, all of it residual PPA. An answer to a live policy question was an artefact of a
duplicated constant.

Decline rates were already sourced - BNEF 2035: solar -30%, storage -25%, onshore wind -23%,
CCGT rising on the 16% jump BNEF recorded in 2025. Offshore's 2.6% comes from ESMAP instead, so
the table mixes sources.

VINTAGE IS THE MIDPOINT and that is correct, not a simplification. A 2040 scenario is a fleet
built progressively from 2026, so its average capex is the midpoint; pricing it all at 2040
would assume nothing was built until the final year. Assumes a LINEAR build-out - a real
transition is back-loaded, so this is mildly conservative.

---

## Offshore wind is not near baseload

Build `2026-09-20a`, 18 Sep 2026. Twelve weather years, Renewables.ninja / MERRA-2 at seven
ESMAP regions, levels scaled to ESMAP Tables 16 and 17, shapes as measured.

```
group        CF      hours below 10% of rating   longest drought   CV
offshore     0.516                       18.2%              83 h   0.69
onshore      0.368                       14.1%              35 h   0.67
```

The ESMAP report describes offshore as having lower variability and providing near baseload
capacity. ON THESE PROFILES IT DOES NOT. Offshore delivers 40% more energy and spends MORE of
the year effectively absent. Droughts run 62 to 103 hours against 22 to 45 onshore. Every
offshore region has a first-percentile hour of exactly zero; every onshore region has a
positive floor.

AND SIX OF SEVEN REGIONS TROUGH IN MAY, the seventh in June, while onshore troughs spread
across February and March. Seven sites over 2,000 km of coastline and three weather systems,
all failing in the same month. Whatever spatial diversity offshore buys, it does not buy
SEASONAL diversity - and seasonal is what the winter wind drought is about.

### The siting objection, tested and dismissed

The first measurement compared developer-selected onshore sites (capacity-weighted centroids of
real REIPPPP plants) against arbitrary offshore water, which is not a fair test. Three
candidates per region were screened on 2018 and the best kept. Result: 18.3% -> 18.2%, drought
79 h -> 83 h. NOT A SITING ARTEFACT.

The turbine cuts the same way and strengthens it: a V164 8000 has LOWER specific power than the
onshore V90 2000, so it should be flatter. It is not.

CAVEAT: MERRA-2 is reanalysis at about 50 km and will understate short sharp lulls at every
site, so absolute drought lengths are soft. The comparison between them is not.

---

## Headroom is where the wind is not

Build `2026-09-20a`, 19 Sep 2026. `headroom_summary.json` against `regional_renewable_capacity`:

```
region            headroom MW   existing wind   existing solar   wind CF
Northern Cape               0             790           1,283      0.379
Eastern Cape                0           1,896               0      0.367
Western Cape                0           1,257             359      0.365
Hydra Central               0             669             460      0.425
KwaZulu-Natal           5,500               0               0      0.216
Gauteng                 4,680               0              50      0.247
Limpopo                 3,360               0             506      0.235
Mpumalanga              3,320               0               0      0.255
North West              1,660               0             445      0.332
Free State              1,420               0             169      0.268
```

EVERY REGION HOLDING EXISTING WIND HAS ZERO HEADROOM. All 19,940 MW of it sits in regions with
almost no renewables and the worst resource in the country.

That is the South African grid problem in one table, and it is why a national average cannot
represent congestion: a national figure divides capacity in the Cape by headroom in Gauteng.
A scaled national derate was built on 19 Sep and REMOVED the same day for exactly this reason -
it looked more authoritative than a flat 4% while resting on no better foundation.

The 4% itself is NERSA's Congestion Curtailment Framework CEILING, the most an IPP may be
curtailed before compensation, used as though it were an expected rate.

---

## A fossil-free system fails a stability constraint the model was not checking

Build `2026-09-20a`, 19 Sep 2026. `SYNC_MIN_MW` is 6,000 MW and only coal, nuclear, hydro and
imports counted toward it. Non-coal synchronous plant is 3,460 MW, so the balance came from
coal via `Math.min(cAvail, syncDeficit)`.

WITH NO COAL THAT TERM IS ZERO AND THE FLOOR WAS SILENTLY UNMET. The fossil-free build ran at
3,460 MW against a 6,000 MW requirement in every hour and reported nothing.

Grid-forming batteries and synchronous condensers now count:

```
Fossil-free 2040, 30% grid-forming        floor met in all 8,760 hours
Fossil-free, 0% grid-forming              floor UNMET in all 8,760 hours
Fossil-free + 2 GW synchronous condensers floor met
```

SO A FOSSIL-FREE SOUTH AFRICA IS FEASIBLE ON SYSTEM STRENGTH ONLY IF ABOUT 30% OF THE STORAGE
FLEET IS GRID-FORMING - 12 GW at this build. If none of it is, the system fails every hour
regardless of how much energy it has.

### Do not add synchronous condensers

AEMO is moving AWAY from them: a July 2026 report has them turning to battery inverters because
syncons are proving expensive and hard to find. South Australia, past 50% renewables, installed
four totalling about 508 MVA for AUD 166m, with 1,670 MVA more identified - and the pivot to
inverters came before the next tranche was built.

AEMO ALSO SAYS INERTIA IS NOT THE PROBLEM. Declaring shortfalls under an 80%-renewables-by-2030
scenario they foresaw no issues on inertia; what binds is SYSTEM STRENGTH, the fault level at a
node, in MVA. Our single national MW floor stands in for both, which is the same category of
error as a national congestion derate.

UPDATED 23 Sep 2026, AEMO's FY26 Engineering Roadmap webinar. Frequency, inertia and voltage
control are now business as usual there, where inertia was the headline challenge a few years
ago, and AEMO has opened a three-part workplan on whether grid-forming batteries can substitute
for synchronous machines in meeting minimum system strength. The reason is ours: syncons have
become expensive and slow to deliver while the grid-forming battery fleet has grown.

BUT THE SUBSTITUTION IS NOT SETTLED. AEMO's 2025 position was that protection-quality fault
current remains a key limitation of grid-forming inverters, and its own simulations and early
hardware-in-the-loop relay testing find that misoperation of some protection elements is
possible. Trials with market participants and an ARENA-funded UNSW project run through 2026,
with the Transition Plan for System Security due in December.

WHAT THIS MODEL CANNOT SEE, stated rather than modelled. The binding property is protection-
quality fault current at a node, in MVA, and it depends on the control strategy of the inverters
installed - responses are software, and they vary by manufacturer, where a synchronous machine's
is physics and predictable. A national megawatt floor cannot represent that, and SYNC_GFM_SHARE
0.30 is a bracket for a substitution ratio that the one market testing it has not yet fixed.

### Inertia is worth R4.6bn a year to storage, and it was invisible

Pricing reserve and inertia in Fossil-free 2040:

```
reserve revenue   R0.24bn/yr
inertia revenue   R4.59bn/yr        totalCost unchanged at R445.7bn in all cases
```

Nineteen times the reserve revenue, essentially all of it to the battery fleet. Both were
recorded as pure TRANSFERS - system cost does not move. That was verified on Fossil-free 2040
only, where unserved energy is zero either way, and it does not generalise. See the correction
below. Both toggles now default ON in the two high-renewables presets: leaving
inertia unpriced in a 2040 system models a market that cannot exist. They stay OFF for Today
2026 and Crisis 2023, where South Africa genuinely prices nothing.


### Correction, 21 Sep 2026: reserve is now held whether priced or not

Build `2026-09-21c`, 21 Sep 2026. Presets as stored, default weather year and worst of twelve.

Operating reserve is a flat 2,200 MW (`reserveOperatingMW`, NTCSA ASTR 2026/27-2030/31 Table 7),
held every hour priced or not. Dispatch may not take spare capacity below it; demand beyond that
is shed. Storage counts only as far as it can sustain output for one hour (`asHoldHours`).
Pricing now changes payments only: unserved energy is identical priced and unpriced.

```
unserved GWh                   build 21b     build 21b     build 21c
                              pricing off    pricing on
Today 2026         default           2.7           2.7          50.4
                   worst of 12        23            23           205
Deep decarb 2035   default          83.6          85.3         112.9
                   worst of 12       203           196           268
Fossil-free 2040   default             0             0             0
                   worst of 12         0             0             0
Crisis 2023        default        17,281        17,281        29,817
```

Fossil-free 2040 stays at zero in all twelve years. Today 2026 reaches Stage 4 in the default
year, against Stage 2 before; mean wholesale price R1,101 to R1,440/MWh.

Caveat: Today 2026 has not been checked against Eskom's 2025 load-shedding record. Do not quote
it until it has.

Caveat: totalCost carries no cost of unserved energy, so Crisis 2023 falls from R363.6bn to
R282.1bn while shedding 12.5 TWh more. Do not compare system cost across runs that shed
different amounts.

Reserve and inertia pricing are now pure transfers: unserved energy, totalCost and avgCost are
identical priced and unpriced on Today 2026, Deep decarbonisation 2035 and Fossil-free 2040.
The R445.7bn figure above predates the 18-20 Sep cost basis; Fossil-free 2040 reads R453.6bn.

`validate_invariants` asserts on six cases that pricing leaves unserved energy unchanged, and
that unserved energy rises with the requirement.

### Demand re-anchored to 2026, exports counted once, 21-22 Sep 2026

Build `2026-09-22a`. Generator `build_demand_2026.py`, reading ESK19679 directly.

RSA Contracted Demand includes exports (it equals Residual Demand plus Total RE, a supply-side
measure), and the engine adds its own firm exports, so 6.6 TWh was counted twice. The series is
now contracted demand less exports: calendar 2025 hourly shape, scaled by 0.9442, the Jan-Aug
2026 vs Jan-Aug 2025 ratio of domestic demand. Domestic grid demand 194.6 -> 183.8 TWh.

The 0.938 ratio used on 21 Sep came from a harness note and was not reproducible: contracted
demand including exports falls by 0.920, domestic demand by 0.944. Exports fell 9.7 -> 5.7 TWh.

```
                       unserved GWh default      worst of 12       avgCost R/MWh
                       21c      21d     22a      21c   21d   22a     21c    22a
Today 2026             50.4     3.5     0         205    40   5.4     880    901
Deep decarb 2035      112.9    41.0     0         268    80  11.5   1,549  1,785
Fossil-free 2040          0       0     0           0     0     0   2,184  2,563
```

Today 2026 against reality, no load shedding in 2026: zero in the default year; 11 of 12
weather years shed a little, mean 2.2 GWh, worst 5.4.

Crisis 2023 against reality: demand set to 2023 domestic demand including load shed (ESK19679:
contracted less exports plus MLR, ILS and IOS, 231.4 TWh), +24% on the 2026 base. The model
sheds 19.6 TWh against 16.6 TWh actually shed in 2023, and burns 13.3 TWh of diesel against
5.2 TWh of OCGT generation.

Caveat: OCGT use at 2026 is far below reality, 0.01 TWh against 3.4 TWh in 2025. Caveat: avgCost
rises because fixed costs are spread over less energy. Caveat: provisional ratio from eight
months; replace with the full-year 2026 figure.

### Coal outages calibrated to Eskom's own data, 22 Sep 2026

Build `2026-09-22b`. The planned-outage season was unsourced and three times as seasonal as
Eskom's: peak to trough 3.0x against 1.8x in ESK19679 (2023-2025 PCLF). The forced share of
outages was 47% against 67% measured for 2025 (73% in 2023, 61% in 2026 to August). Both now
come from ESK19679; Crisis 2023 carries its own 73%.

```
coal availability, Feb / Jun      before          Eskom
at 65% EAF                        54% / 76%       57% / 60% (2025)
at 50% EAF                        37% / 66%       53% / 58% (2023)
```

```
                      unserved, default year    12 weather years        actual
Crisis 2023           19.6 -> 13.0 TWh          mean 15.3, worst 16.9   16.6 TWh (2023)
2025 conditions        280 -> 125 GWh           mean 191, worst 247     390 GWh (2025)
Today 2026                0 -> 0                mean 0.5, worst 2.5     0 (2026)
```

2025 conditions: demand +5.5% (domestic 194.6 TWh) and coal EAF 58%, which is ESK19679's 2025
fleet EAF of 62.4% with nuclear, OCGT, hydro and pumped storage removed. On these settings coal
reads 159.3 TWh against Ember's 164 sent-out, and grid generation 206.0 TWh against Eskom's
audited 206.0 TWh for FY2026.

Caveat: the model burns far less peaker fuel than Eskom does except in a crisis, where it burns
far more. Diesel 0.5 TWh at 2025 conditions against 3.4 TWh of OCGT output; 14.0 TWh in Crisis
2023 against 5.2 TWh. Open items: OCGTs count as reserve while idle, and no diesel budget.

Caveat: the Megaflex ordering claim in the NERSA correction note (high-season off-peak the
cheapest block) holds at 2025 conditions. At 2026 conditions coal sets the price in all but
about 11 hours and no block separates.

### Imports on the demand series' own basis; OCGTs moved to emergency reserve, 22 Sep 2026

Build `2026-09-22c`.

Imports: `IMPORTS_CF` 0.41 -> 0.88, ESK19679 Jan-Aug 2026 mean 1,012 MW on the 1,150 MW
contract. The demand series comes from ESK19679, whose supply side counts these flows; Eskom's
audited purchases (4.09 TWh FY2026) are 2.7 TWh narrower. Crisis 2023 and the 2025 benchmark
scenario now carry their own year's trade (2023: imports 1,233 MW, exports 1,284; 2025: 755 and
1,705, both including Mozal, which stopped in March 2026).

Reserve: the ASTR puts gas turbines in emergency reserve and makes categories exclusive, so idle
OCGT and CCGT no longer count toward the 2,200 MW operating reserve. Coal headroom and storage
hold it; peakers serve the balance before any load is shed.

```
                         unserved GWh           diesel TWh            actual
                         before   22c           before   22c          unserved / OCGT
Today 2026                   0      0 (12y max 0.1)   0.00   0.08     0 / 1.2 annualised
2025 conditions            280     96           0.83   2.37           390 / 3.4
Crisis 2023             13,019  6,890           14.1   20.4           16,560 / 5.2
```

Normal years move toward reality on peaker use; winter peakers now run, and the winter evening
price is 1.55x the night price at 2026 conditions, against 1.03x before.

Crisis 2023 moves away from it: with no fuel limit the OCGTs run at 68% load factor against
18% in 2023. A diesel budget of the actual 5.24 TWh, spread evenly by month, gives 19.4 TWh
unserved. Shipped in build 2026-09-22d; see the entry below.

### Diesel budget, 22 Sep 2026

Build `2026-09-22d`. `dieselBudgetTWh`, spread evenly by month; unlimited by default (30 TWh,
above the fleet's 29.8 TWh physical maximum). Crisis 2023 carries 2023's actual 5.25 TWh
(ESK19679: Eskom OCGT 3.57 + IPP OCGT 1.68). 2023 OCGT output was flat across the year, not
winter-weighted, hence even months.

```
Crisis 2023            before    22d                              actual 2023
unserved TWh              6.9   19.4 (12 years: mean 21.2, worst 22.7)   16.6
shed hours              3,204   5,620                                    6,837
diesel TWh               20.4    5.25                                     5.25
```

Crisis 2023 now overshoots by 17% in the default year and 28% on the twelve-year mean. Today
2026 and 2025 conditions are unchanged: the budget does not bind outside a crisis.

### Load shedding now costed; coal EAF is coal-only, 22 Sep 2026

Build `2026-09-22e`.

System cost: `systemCostR` = supply cost + unserved energy at `costUnservedR`, R9.53/kWh, Eskom's
Cost of Loadshedding (COUE methodology review and 2020 update, NERSA 2022). The IRP's COUE of
R87.85/kWh values short unplanned outages; load shedding is scheduled and partly mitigated.
Supply cost (`totalCost`, `avgCost`) is unchanged.

```
R bn/yr                         supply   shed energy   system
Today 2026                       172.5           0.0    172.5
Crisis 2023, diesel budget       237.7         184.8    422.5
Crisis 2023, unlimited diesel    321.2          65.7    386.9
```

The budget-limited crisis now costs more than the unlimited one; on supply cost alone it looked
R84bn cheaper.

Coal EAF: `coalEAFPct` applies to coal only, while Eskom's published EAF covers the whole fleet
and runs 4-5 points higher. ESK19679 estimates: 2023 coal 49.7 (fleet 54.7), 2025 58.4 (62.4),
2026 Jan-Aug 65.3 (68.1). Entering the fleet figure for Crisis 2023 halves shedding:

```
Crisis 2023 at coal EAF     unserved TWh   coal TWh
50 (coal-only estimate)            19.4      162.2
52                                 13.9      169.0
54.7 (fleet EAF)                    8.2      176.8
actual 2023                        16.6      165.6
```

### ORDC read the requirement as availability, 22 Sep 2026

Build `2026-09-22f`. `marketPriceSeries` compared the engine's reserve requirement, read as if it
were reserve available, against 6% of peak through `asReserveFrac`, a key that does not exist.
The engine now returns `reserveAvailMW` per hour (committed coal headroom within its ramp, storage
discharge headroom sustainable for one hour, and charging that can stop), and the ORDC compares it
with the hourly requirement. The only callers are the retail panel's market basis: the annual
shadow rows (`retailRaw`) and the week chart (`retailHourly`).

```
                        scarcity hours      market R/kWh     engine R/kWh
                        before   after      before   after
Today 2026                   0     268       0.822   0.822        0.821
Deep decarb 2035         8,760       0       0.850   0.153        0.153
Fossil-free 2040         8,760       0      12.359   0.105        0.105
Crisis 2023              3,138   1,777      24.01    24.00        21.15   (5,622 VoLL hours)
```

Retail, shadow dynamic row, annual, panel year 2035, regulated / market basis:

```
Today 2026              R3.75 / R2.81
Deep decarb 2035        R6.02 / R2.44     was R3.85 on the market basis
Fossil-free 2040        R8.78 / R3.31     was R28.15
Crisis 2023             R3.95 / R54.76    VoLL hours, not ORDC; not a tariff
```

On this build Today 2026 read zero scarcity hours before the fix only by coincidence: the 2,200 MW
requirement happened to exceed the 1,764 MW that 6% of peak gave. Every market-basis figure in
this file dated before 22 Sep 2026, including the retail headline table below, is superseded.

Caveat: Crisis 2023's market basis is set by 5,622 hours of load actually shed at the price cap.
That is the energy-only rule, not a usable tariff.

### Shedding calibration: Crisis 2023 and 2025, 22 Sep 2026

Build `2026-09-22g`. Model shedding is compared as unserved energy plus interruptible load, against
Eskom's MLR + ILS + IOS, because the model's 1,200 MW interruptible block is used heavily (4.9 TWh
in Crisis 2023) while Eskom's ILS was 0.07 TWh: its industrial curtailment sits inside MLR.

Correction: RSA Contracted Demand already includes load shed. Residual demand counts MLR, ILS and
IOS as resources (2023: 208.7 TWh of generation plus 16.8 TWh of reductions = 225.9 contracted).
The Crisis 2023 demand set on 22 Sep added the shed load a second time. Fixed: 214.6 TWh domestic,
+16% on the 2026 base (was +24%).

```
                         shed + interruptible, TWh      actual 2023
Crisis 2023, +24%               26.7                    16.75
Crisis 2023, +16%               13.8
```

Diagnostic, not shipped: the same runs with Eskom's actual daily coal availability from ESK19679
in place of the modelled outage path.

```
                         model outages   actual availability   actual
2025 conditions, GWh          277               270              570
Crisis 2023, TWh             14.3              10.7            16.75
```

With actual availability, 2025 shedding moves into January to May, as it happened; the modelled
path spread it across the year because it has no within-year fleet improvement. The level stays
at about half of actual in both years.

The residual shortfall has identifiable sources: the scenarios run today's fleet, not the year's
(Koeberg 11.5 TWh against 8.1 in 2023 and 10.2 in 2025; wind, solar and RMIPPPP hybrids about 6
TWh above 2023), and wheeled private plant is probably counted twice, once as supply and once
by its absence from contracted demand (about 2.5 TWh a year). Unverified.

### Wheeled plant counted once; Koeberg by year, 22 Sep 2026

Build `2026-09-22h`.

Wheeled plant, verified: ESK19679's installed wind and PV in August 2026 (4,143 and 2,780 MW) sit
469 and 491 MW below FIXED, matching the 470 and 488 MW wheeled. Contracted demand is the sum of
resources Eskom contracts with, so load served by wheeled plant is absent from it, while the engine
supplies that load from its private fleet. `build_demand_2026.py` now adds each wheeled plant's
Jan-Aug 2026 output, from its COD in `pfl_cod_h1_2026.json`, to the 2026 side of the ratio: 1.03
TWh, ratio 0.9442 -> 0.9519, domestic demand 183.8 -> 185.3 TWh. ARM Platinum has no published
COD and is taken as April. Pre-2026 private wheeling is not sourced and is taken as zero.

Koeberg: `nuclearCF` is now a control. Crisis 2023 sets 0.49 (8.13 TWh, unit 1 in its
life-extension outage); the 2025 benchmark conditions set 0.62 (10.21 TWh). Demand re-solved to
the same domestic targets: Crisis 2023 +15%, 2025 +4.6%. The unit-commitment forecast read a
hardcoded 0.90 for nuclear; it now reads `nuclearCF`.

```
                        shed + interruptible          actual
Crisis 2023             15.8 TWh (was 13.8)           16.75 TWh
2025 conditions          266 GWh (was 277)             570 GWh
Today 2026              0; twelve-year worst 0.6 GWh  0
```

Crisis 2023 is now 5% under actual. 2025 remains about half, and the timing test above shows why:
the model has no within-year fleet improvement.

Not fixed: wind, solar and RMIPPPP hybrids run at today's fleet in every scenario, about 6 TWh a
year above 2023. There is no control for the existing renewable fleet by year.

### Crisis 2023 preset deleted, 22 Sep 2026

Build `2026-09-22i`. The preset is gone; every Crisis 2023 figure in this file is historical. Its
last calibration stands as recorded above: 15.8 TWh of shed and interruptible load against 16.75
actual, on today's fleet. The checks that used it now run the same settings inline as a stress
scenario, so none were lost: removing the preset had silently taken validate_outputs from 40/40
to 36/36, because a missing preset button returns null and its checks were skipped.

### Peak surplus matches Eskom on Eskom's convention, 22 Sep 2026

Build `2026-09-22k`. Eskom reports surplus as available capacity against demand net of wind and
solar, with no reserve deducted (29 Aug 2025: 29,132 MW available against 25,797 MW demand). The
engine now returns hourly coal availability (`coalAvailableMW`), and the benchmark reads it at the
hour residual demand peaks.

```
                          model     Eskom
2025 conditions           3.4 GW    2-3 GW stated for FY2026; 3.3 GW on 29 Aug 2025
Today 2026                7.1 GW    about 6 GW, winter 2026 outlook (22 Apr 2026)
```

After the 2,200 MW operating reserve the same figures are 1.2 and 4.9 GW. The previous check
deducted reserve and ignored wind and solar at the peak; it read -0.9 GW.

### Earlier findings re-measured on build 2026-09-22n

Everything below changed after 19 Sep: the reserve rebuild, the 2026 demand anchor, exports and
wheeled plant counted once, imports, outage calibration, and shed energy costed. Default weather
year unless stated.

Offshore swap, Deep decarbonisation 2035. No longer better on all four.

```
                        cost R bn   curtail TWh   Mt CO2   worst of 12 years
45 W / 52 S / 0 off        331.8        140.1      21.1     6.1 GWh (2020)
45 W / 45 S / 1 off        324.6        129.0      20.3    14.3 GWh (2020)
```

Lithium saturation, Deep decarbonisation 2035 at 6h. Still saturates, now at about 3.5 TWh of
discharge (was 8.1). The system-cost optimum moved down from 20 GW:

```
new lithium   system cost R bn   unserved GWh   curtail TWh   discharge TWh
 5 GW                 311.0           146          132.6          2.68
10 GW                 312.3            42          129.5          3.34
20 GW (preset)        324.6             0          129.0          3.54
```

At the R9.53/kWh cost of load shedding the optimum is 5 GW; at the IRP's COUE of R87.85/kWh it
is 10 GW. 10 -> 20 GW costs R12.3bn a year to avoid 42 GWh, R293/kWh.

Fossil-free 2040: zero unserved energy in all twelve years still holds. The offshore ranking
reversed: more offshore is now cheaper, not dearer.

```
                          cost R bn   curtail TWh
55 W / 90 S /  5 off         456.1        252.2     (preset)
45 W / 90 S /  8 off         447.9        235.2
40 W / 90 S / 10 off         447.7        228.9
```

The preset's 5 GW rests on deployability (ESMAP's medium path, 5 GW by 2040), which stands.
The 19 Sep claim that more offshore costs more does not.

Going fossil-free by 2040 rather than 2050 still costs about R49bn a year: R456.1bn against
R407.0bn (was R49.3bn).

IRP and Grid delay presets: their +16% demand was set to reach the IRP's 255 TWh for 2030 on the
old base, and reached only 216 TWh after the re-anchor, so both read Stable. Now +35% (254.3 TWh):
the IRP build sheds 47 GWh (Stage 4 peak) and Grid delay 77 GWh; both read Constrained. Caveat:
that the IRP's 255 TWh is the same measure as the model's grid demand including exports is
inherited from the original calibration, not re-verified.

### Preset changes: Deep decarbonisation lithium, Fossil-free offshore, 22 Sep 2026

Build `2026-09-22o`.

Deep decarbonisation 2035, lithium 20 -> 10 GW. Default weather year, cost with shed energy at
the IRP's cost of unserved energy (R87.85/kWh):

```
offshore \ lithium      5 GW     8 GW    10 GW    12 GW    15 GW    20 GW
0 GW                   318.6    311.1    309.7    310.1    312.5    317.1
1 GW (preset)          322.4    315.8    315.7    316.7    319.4    324.6
2 GW                   326.5    321.7    322.0    323.7    326.2    332.1
```

10 GW is the lithium optimum at every offshore level. Each gigawatt of offshore adds about R7bn a
year and removes about 15 GWh of shed energy, R400-500/kWh; the cost optimum is 0 GW offshore.
Twelve years at 10 GW lithium, 1 GW offshore: 42.5 GWh default year, mean 32.9, worst 73.1 (2018).

Fossil-free 2040, offshore 5 -> 10 GW, above ESMAP's medium path by choice. Onshore wind searched
at 10 GW offshore, twelve years each:

```
onshore wind    unserved, worst of 12     cost R bn
20 GW           73 GWh (2022)                386.8
25 GW (preset)  0 in all 12                  401.8
30 GW           0                            416.8
40 GW           0                            447.7
```

The new preset is R54bn a year cheaper than the 55/90/5 build (R456.1bn) with the same result of
zero shed energy in twelve years; curtailment 182.5 TWh against 252.2. Solar (90 GW) and lithium
(40 GW at 8h) were not re-searched and are probably also above what the 2026 demand base needs.

### IRP demand verified against the IRP; Fossil-free re-searched; discount rate, 22 Sep 2026

Build `2026-09-22p`.

IRP 2025 section 3.1: the forecast is consumption of all systems connected to the transmission
and distribution grid, excluding pumping, battery charging and station auxiliaries, including
network losses; cross-border sales are an input, and a MozalOut sensitivity is run. Figure 2 puts
2024 at about 240 TWh against 219.7 TWh of Eskom contracted demand, so the IRP's level is not the
model's. The presets now take the IRP's growth: 255/240 on 2024 contracted demand, less Mozal
(stopped March 2026), about 225 TWh, +20%. The IRP's 66-68% EAF is the whole fleet; coal alone
is about 64%.

```
                     demand TWh   coal EAF   unserved GWh   CO2 Mt   IRP
IRP 2030             224.2        64%        1.2 (Stage 1)  148.3    unserved 0.00 TWh in 2030; 168 Mt
Grid delay           224.2        64%        2.8 (Stage 2)  165.5
```

The 22 Sep +35% (254.3 TWh) read the IRP's level as the model's and overstated demand by about
30 TWh. The IRP-consistent setting reproduces the IRP's own finding of an adequate system in 2030.

Fossil-free 2040, re-searched with offshore fixed at 10 GW, twelve years each. Coarse screen:

```
solar \ lithium (8h)    20 GW          30 GW          40 GW
50 GW                   872 GWh        378            205
70 GW                   390            104             40
90 GW                   215             47              0     R401.8bn (25 GW onshore)
```

Refined with onshore wind free:

```
onshore / solar / lithium    worst of 12    cost R bn
30 / 60 / 40                 21.7 GWh          354.3
35 / 55 / 40                 18.9              359.4
35 / 60 / 40                  0 (all 12)       369.6   (preset)
30 / 70 / 40                  0                374.9
40 / 60 / 35                  0                377.1
```

R32bn a year cheaper than 25/90/40 at the same standard, curtailment 150.1 TWh against 182.5.

Discount rate: new build is annualised at 8% real over each technology's life (bldAnnuity), as
PyPSA and PLEXOS annualise at a WACC. At 11.3% (withdrawn as an IRP figure; see below) total cost rises R47.7bn (+15%)
on Deep decarbonisation, R68.2bn (+18%) on Fossil-free and R16.0bn on the IRP preset. 8% is not
sourced in the code (sourced later the same day).

### Deep decarbonisation: no offshore, 20 GW lithium; discount rate sourced, 22 Sep 2026

Build `2026-09-22q`. Deep decarbonisation 2035 with no offshore, twelve years each:

```
lithium   default yr   mean    worst of 12      cost R bn
16 GW        19.8       5.1    24.9 (2020)        311.8
18 GW         6.6       2.7    21.4               314.4
19 GW         4.3       2.2    20.0               315.7
20 GW         0.5       1.7    18.6 (preset)      317.1
```

Each gigawatt costs about R1.3bn a year and removes about 1 GWh of mean shed energy. The worst
year stays near 19-25 GWh at every level: 2020 is short of energy, which 6-hour lithium cannot
cover.

Discount rate. Correction: the 22 Sep note that the IRP uses 11.3% is withdrawn; no discount rate
appears in the IRP 2025 gazette text, and the figure was not sourced. The 11.3% results stand as a
sensitivity only. Evidence for South Africa:

```
source                                               basis                   rate
IEA Cost of Capital Observatory 2025, SA, 2024       nominal after tax       solar 11.0-13.5%, batteries 11.0-13.5%
  same, breakdown                                    equity IRR / debt       12.5-13.5% / 11.0-13.0%, 65-70% debt
  same, hydro                                        nominal after tax       13.0-16.0%
REIPPPP bid window 1 -> 4                            real equity IRR         17% -> about 9.5%
PyPSA-ZA (CSIR, FIAS)                                annualisation           8%
IRP 2023 (per D Nicholls, former Eskom CNO)          real                    above 8%
OECD NEA/IEA Projected Costs                         real                    3, 7, 10%
```

At 3-4.5% inflation the IEA nominal range is about 6.5-10% real; the model's 8% real sits in it.

### Market-indexed retail prices vetted, 22 Sep 2026

Build `2026-09-22r`. Annual hourly mean of the shadow dynamic row, R/kWh, stranded basis on,
scenario years 2026 / 2035 / 2040.

One model error, fixed. The new-transmission line in the retail stack (TDP cost of R6,964 per kW
of new wind and solar, 40 years at 8%) divided by 1,000 once too often and read about
R0.0003/kWh. Corrected:

```
                          newGrid R/kWh   regulated before / after   market before / after
Today 2026                    0.000             4.12 / 4.12                2.83 / 2.83
Deep decarbonisation 2035     0.328             5.88 / 6.55                2.44 / 2.66
Fossil-free 2040              0.361             7.13 / 7.86                2.90 / 3.14
```

Offshore wind is not in the new-transmission count.

One structural gap, not fixed. The market basis prices energy at the hourly wholesale price and
keeps 33% (NETWORK_RETAIL_SHARE) of every other line in the stack. Wholesale revenue against
system cost:

```
                          market mean R/kWh   zero-price hours   market revenue   system cost   recovered
Today 2026                      0.80                 0            R156.3bn        R173.7bn        90%
Deep decarbonisation 2035       0.18             6,205             R34.9bn        R317.1bn        11%
Fossil-free 2040                0.17             5,384             R33.4bn        R369.6bn         9%
```

Lines the market basis drops at 67%, R/kWh, Deep / Fossil-free: new-build capital 1.22 / 1.89;
REIPPPP PPA 0.36 / 0.38; curtailment compensation 0.35 / 0.43. These are contracts and annuities
that do not lapse under a market. The 33% share is calibrated on today's revenue split and is
applied to generation lines as well, so part of the new-build capital survives as if it were
network. The market-indexed price in these presets is the energy-only wholesale price, not a
price that recovers the cost of the build.

Consequence for validate_consistency: the gas-firmed 60% renewables check moves from under 15% to
+15.3% (R4.75 against R4.12) with the transmission cost restored. Left failing; not relaxed.

### Market basis rebuilt; REIPPPP expiry by bid window, 22 Sep 2026

Build `2026-09-22s`. Retail annual hourly mean, R/kWh, stranded on, scenario years 2026 / 2035 / 2040.

REIPPPP contracts now expire by bid window, twenty years after commercial operation
(REIPPPP_VINTAGES): BW1 2034, BW2 2035, BW3 2037, BW3.5 2039, BW4 2041, BW5-6 2045. Share still
running: 100% in 2026, 67% in 2035, 45% in 2040. It replaces a linear roll-off to zero by 2041,
which ended BW5-6 contracts too early and BW1-3 too late; the engine and the retail IPP line now
read the same schedule. The retail IPP line had no expiry at all.

Market basis: hourly wholesale energy, plus network and retail as a fixed R126.0bn (32.8% of
NERSA's 2025/26 allowance) over scenario sales plus new transmission, plus a contract levy:
new-build capital and fixed O&M under two-sided contracts for difference, REIPPPP PPAs while they
run, curtailment compensation, stranded coal when that toggle is on, decommissioning and legacy
items, less the market revenue those contracted plants earn. The existing Eskom fleet is merchant.

```
                          regulated   market   energy   network   contract levy
Today 2026                   4.12      4.01     0.80      0.68        0.33
Deep decarbonisation 2035    6.31      6.81     0.18      1.12        1.89
Fossil-free 2040             7.44      8.42     0.17      1.19        2.62
```

Before this: market 2.83 / 2.66 / 3.14. The market basis now pays for the build.

The market basis now reads above the regulated one in both high-renewables presets. Most of it is
network: the market basis holds network at today's rand amount, while the regulated basis runs
all existing asset costs, network included, off towards a 35% floor by 2045. The two bases treat
the same network differently; not yet reconciled.

The regulated means also moved (Deep 6.55 to 6.31, Fossil-free 7.86 to 7.44) with the PPA expiry,
which also takes the gas-firmed consistency check back under 15%.

Open: Eskom's IPP bill in the retail stack is R0.275/kWh, about R58bn a year; the engine's REIPPPP
charge is R11.7bn. The engine prices PPAs at bid-year tariffs without CPI indexation.

### Network held in both retail bases; REIPPPP priced at Eskom's indexed cost, 22 Sep 2026

Build `2026-09-22t`.

REIPPPP PPA. The engine priced wind at R682/MWh and solar at R591, bid-year tariffs never
indexed, and left CSP out. Now one rate, Eskom's average cost of renewable IPP energy in FY2025,
R2,189/MWh (Eskom results presentation 2025), on REIPPPP wind, solar and CSP output. The charge at
today's defaults goes R11.7bn to R42.6bn, on 19.5 TWh.

```
                          system cost R bn   PPA R bn   avgCost R/MWh
Today 2026                      204.6            42.6          1,059
Grid delay                      305.7            40.1          1,221
IRP 2030                        312.9            42.6          1,238
Deep decarbonisation 2035       335.1            15.9          1,846
Fossil-free 2040                390.9            13.6          2,160
```

The retail IPP line is now the engine's charge, re-timed to the panel's year. It was Eskom's whole
IPP allowance, R0.275/kWh, which also carried IPP OCGT diesel (already in the fuel line), never
expired, and included other programmes. Not carried now: the DoE peakers' capacity charges, other
IPP programmes (R833/MWh in FY2025), RMIPPPP. That is most of the R0.08/kWh fall in today's line.

Network. Both bases now hold network and retail at today's R126.0bn, spread over scenario sales,
plus new transmission. In the regulated basis only generation's share of operating costs and
existing capital runs off or scales with the coal fleet, and all fixed costs are spread over
scenario sales relative to today's.

```
R/kWh                     regulated   market
Today 2026                   3.95      3.70
Deep decarbonisation 2035    6.68      6.23
Fossil-free 2040             8.20      7.95
```

Regulated today is R3.95 against R4.12 before, from the IPP line.

Two checks now fail and were not relaxed:
- validate_consistency, gas-firmed 60% renewables at 2035: R4.98 against R3.95, +26% (limit 15%).
  The benchmark (AEMO/AEMC finding no material price rise) needs re-deriving before it can judge
  a bill that now carries held network costs and new transmission.
- validate_findings, demand response reverses at high shift: R1,058.31 at 30% against R1,059.09
  at zero. The published margin was about R1/MWh either way; the finding is not robust.

### IPP contracts from NERSA's decision; network corrected; two checks re-derived, 22 Sep 2026

Build `2026-09-22u`. Source for the IPP lines: NERSA MYPD6 NTCSA Reasons for Decision (June
2025), Table 25, Eskom's FY2026 application by programme.

REIPPPP is now priced by bid window with each window's own expiry: R50.3bn on 26.4 TWh in FY2026,
R1,908/MWh, from R3,852/MWh for BW1 to R591 for BW6. The dearest windows expire first, so the
rate on REIPPPP output falls to R1,060/MWh by 2035 and R531 by 2040. It replaces the single R2,189
rate of the previous build.

Other IPP contracts added to the engine and the retail line: DoE peakers' capital charge R2,174m
to 2030 (their diesel is already in fuel), RMIPPPP R1,294m in FY2026 rising to R3,791m, and the
short-term programmes R7,981m in FY2026. The short-term programmes are assumed to end with MYPD6;
the table does not say. Storage contracts are left to new build.

Network was wrong by more than half. It was 32.8% of NERSA's allowance, everything outside
Generation, but NTCSA's R95.6bn carries R66.5bn of IPP purchases and R10.2bn of imports. Network
and retail are NTCSA's wires business R17.0bn plus Distribution R39.3bn: R56.4bn, 14.7%. The
generation opex left by the split is about R54bn, against R55.1bn in Eskom's Generation filing.

```
                          system cost R bn   REIPPPP   other IPP   avgCost
Today 2026                      210.6          37.1        11.4       1,090
Deep decarbonisation 2035       334.6          11.6         3.8       1,842
Fossil-free 2040                388.5           7.4         3.8       2,146

retail R/kWh              regulated   market   network
Today 2026                   4.02      3.09      0.27
Deep decarbonisation 2035    6.34      5.59      0.64
Fossil-free 2040             7.65      7.27      0.69
```

Today's regulated R4.02 sits 5% above Homepower's R3.82 all-in, inside the 8% check.

The market basis now reads below the regulated one because the existing Eskom fleet is merchant:
it earns the wholesale price and no levy, and at today's defaults that leaves its fixed costs,
about R0.57/kWh, unrecovered. South Africa's market design pairs trading with a vesting contract
for the legacy fleet (NERSA's Wholesale Tariff Methodology and Vesting Contract consultation), so
this basis probably understates. Not changed.

Gas-firmed check re-derived. The old band, |move| under 15%, had no source. AEMC Residential
Electricity Price Trends 2025, full cost stack on AEMO's Step Change: -5% to 2030, +13% to 2035,
up to +20% in its delay case. Band now -10% to +20%; the build measures +14%. A plausibility
check only: the NEM is not South Africa.

Demand-response finding holds on the right metric. Average cost hid it: shifted load returns
with a 6% loss, raising energy served. System cost, defaults: R210.57bn at 0%, R210.28bn at 7.5%,
R212.23bn at 30%, peak 29,628 MW rising to 30,069 MW. At 2025 conditions the reversal is sharper:
R224.65bn at 0% to R241.48bn at 30%, shed energy 90.5 to 175.5 GWh.

### Vesting contract for Eskom's existing fleet on the market basis, 22 Sep 2026

Build `2026-09-22v`. The existing Eskom fleet now sits under a two-sided vesting contract: its
fixed costs (generation opex and existing capital, stranded coal when that toggle is on) less the
margin it earns in the market over running costs, carried in the contract levy. Cahora Bassa
imports are netted the same way. Precedents: Singapore, the Australian states in the 1990s,
Ontario's regulated OPG assets; NERSA is consulting on a vesting contract alongside its Wholesale
Tariff Methodology. Full coverage for the whole scenario, where real contracts usually cover a
declining share.

```
R/kWh                     regulated   market   vesting   Eskom margin   contract levy
Today 2026                   4.02      3.91     0.41         0.16           0.69
Deep decarbonisation 2035    6.34      6.19     0.41        -0.02           2.07
Fossil-free 2040             7.65      7.51     0.24         0.01           2.67
```

The two bases now recover the same costs and differ by 2-3% in the mean; the market basis differs
in shape. validate_consistency's week check compared means and was changed to compare the hourly
series (mean hourly gap above 1% of the mean); it fails on a copy with the week frozen to one basis.

### Retail panel vetted: why high-renewables prices rise, 22 Sep 2026

Build `2026-09-22w`. Regulated basis, Eskom-direct residential, stranded on.

One error fixed: deemed-energy curtailment compensation was paid on all curtailed wind and solar,
including new build whose capital newCap already recovers. It is a REIPPPP contract term; now
REIPPPP's share only, while its contracts run. Deep decarbonisation 2035 R6.34 to R5.69/kWh,
Fossil-free 2040 R7.65 to R6.82. An invariant now fails on the double count.

Where Deep decarbonisation's R1.67/kWh rise over today's R4.02 comes from, at retail (each line
before loss, allocation and VAT, times 2.03):

```
new-build capital and O&M          +2.57
new transmission (TDP per kW)      +0.66
network over fewer grid sales      +0.10
fuel and carbon saved              -0.90
REIPPPP expiry                     -0.33
existing opex and capital          -0.37
other                              -0.05
```

Build screen, Deep decarbonisation, 20 GW lithium, no offshore, default weather year:

```
wind / solar GW   shed GWh   spill TWh   system cost R bn   retail R/kWh
25 / 20               370         29            290.3            4.79
30 / 30                61         59            309.6            5.05
35 / 30                35         70            321.4            5.12
45 / 45 (preset)        1        125            382.2            5.69
```

The preset spills half its wind and solar potential: it was sized for higher demand and for
near-zero shedding. Utility solar delivers a 7.5% capacity factor; 29 GW of rooftop takes the
midday. Leaner builds cut R0.5-0.9/kWh.

Why this differs from Australia's outlook: AEMC's falling prices come from renewables displacing
wholesale prices of A$100/MWh and more. South Africa's baseline is depreciated coal at about
R0.58/kWh of fuel and carbon. Unspilled new wind costs about R0.75/kWh (37% capacity factor) and
solar R0.64 (24%) at this model's 2030 capex and 8%; that is roughly cost-neutral, but at 50% spill it doubles.

Open, not changed:
- The residential allocation (1.622, Eskom cost-to-serve C12 against the system) multiplies the
  whole stack, so every generation cost increase is scaled by 62%. Residential's premium is
  mostly network and retail. Needs the cost-to-serve study's component split.
- Price per grid kWh is not the bill: 20 GW of new rooftop cuts grid sales and raises fixed cost
  per kWh while rooftop households' bills fall. AEMC reports bills as well.
- New transmission at R6,964 per kW of all new wind and solar is the TDP average; solar sited
  near load needs less.

### Both high-renewables presets re-optimised on cost; preset buttons dropped the year, 22 Sep 2026

Build `2026-09-22x`. Objective: mean system cost over twelve weather years plus shed energy at the
IRP's cost of unserved energy, R87.85/kWh (R0.0879bn per GWh). Screened on the default year, then
the best candidates run across all twelve.

Deep decarbonisation 2035 (coal -27 GW, 6h lithium, no offshore):

```
rooftop / wind / solar / lithium GW   objective R bn   mean cost   mean shed GWh   worst
0 / 25 / 45 / 20                            263.4          247.3            184       446 (2022)
0 / 35 / 35 / 15   (preset)                 263.7          246.4            197       362 (2022)
5 / 35 / 30 / 15                            264.8          245.6            218       400
20 / 25 / 30 / 20                           267.3          253.3            160       403
```

Fossil-free 2040 (10 GW offshore held, 8h lithium):

```
rooftop / wind / solar / lithium GW   objective R bn   mean cost   mean shed GWh   worst
0 / 20 / 60 / 35                            318.5          296.6            250       874 (2022)
0 / 20 / 60 / 30                            318.9          288.6            345     1,173 (2022)
0 / 25 / 60 / 35   (preset)                 319.5          310.0            108       412 (2022)
8 / 25 / 60 / 35                            328.0          323.1             55       258 (2016)
0 / 30 / 60 / 40                            334.6          332.3             26       123 (2016)
```

The optimum is flat in both; the presets take a build within R1bn of the cheapest with less shed
energy. Against the near-zero-shedding builds they replace: Deep R382.2bn to R257.0bn a year on its
default year including shed energy, Fossil-free R369.6bn to R311.5bn.

Rooftop: less new rooftop lowers system cost, by about R4bn a year on Deep and R8.5bn on
Fossil-free, because rooftop costs R17,000/kW against R12,000 for utility solar and adds midday
energy these systems already spill. Households install it against a retail price, not a system
cost; zero new rooftop is the cost optimum, not a forecast.

Retail, regulated / market, R/kWh: Today 4.02 / 3.91; Deep decarbonisation 4.34 / 4.43;
Fossil-free 5.49 / 5.41.

Caveat on reliability: both builds shed at Stage 8 in some hours of the default year (166 and 20
GWh). The IRP's cost of unserved energy values short interruptions; long, deep shortfalls cost
more. The reliability standard is a policy choice these presets now make on cost alone.

A defect found on the way: applyState set sliders only, so the preset buttons dropped scenarioYear
and the page priced these two presets at 2026 capex and contracts, R103bn a year higher on
Fossil-free than every harness measured. Fixed; an invariant checks every preset key is applied.

Also found, not fixed: newCapexR depends on whether the weather-year file has finished loading
(the transmission curve is built there). The same build read R180.1bn or R169.7bn of new capital
depending on load timing.

### High-renewables presets rebuilt to the NEM reliability standard; rooftop 1.2 GW a year, 22 Sep 2026

Build `2026-09-22z`. Supersedes the cost-with-COUE presets of build `2026-09-22x`, which shed at
Stage 8 in some hours. Standard: the Australian NEM's, expected unserved energy at most 0.002% of
demand, taken as the mean over twelve weather years. Objective: cheapest mean system cost meeting
it. Rooftop grows 1.2 GW a year from 2026 (IRP: 0.9 GW): 10.8 GW new by 2035, 16.8 GW by 2040.

Deep decarbonisation 2035 (coal -27 GW, no offshore), limit 3.7 GWh:

```
wind / solar / lithium GW, hours    mean cost R bn   mean shed GWh   worst
25 / 40 / 35, 8h                          290.4             18.3        93 (2016)
30 / 40 / 35, 8h                          302.3              4.0        31
45 / 35 / 45, 6h                          302.7              3.7        23      misses by 0.03
35 / 35 / 35, 8h  (preset)                305.0              2.7        20 (2020)
35 / 40 / 40, 6h                          305.8              2.6        16
35 / 40 / 35, 8h                          314.9              0.5         5
```

Fossil-free 2040 (10 GW offshore held, 8h lithium), limit 3.5 GWh:

```
wind / solar / lithium GW           mean cost R bn   mean shed GWh   worst
30 / 50 / 45                              348.2              7.5        52 (2020)
30 / 55 / 40                              349.8              7.9        61
30 / 55 / 45  (preset)                    357.8              2.2        26 (2020)
30 / 60 / 40                              359.9              2.9        35
35 / 50 / 45                              362.4              2.0        24
```

Default weather year: no shedding in either. Retail regulated / market R/kWh: Today 4.02 / 3.91;
Deep decarbonisation 5.32 / 5.19; Fossil-free 6.57 / 6.42. Grid demand 183.3 and 173.0 TWh.

Reliability at the NEM standard costs R42bn a year on Deep decarbonisation (R305.0bn against
R263.7bn at the cost optimum) and R38bn on Fossil-free (R357.8bn against R319.5bn).

Load timing fixed: the transmission-cost curve is built at start-up, the page runs once when all
engine inputs have settled, and window.GTZA_READY marks it. New-build cost for the same build is
now stable across page loads (R169.72bn in four of four).

### Retail panel vetted again: two errors, one method question, 22 Sep 2026

Build `2026-09-22aa`. Regulated basis, Eskom-direct residential, R/kWh.

Error 1, the sales denominator. Retail sales subtracted storage charging and storage discharge,
so energy delivered from storage was never counted as sold. Sales read 172.1 TWh against 183.3
served on Deep decarbonisation 2035 and 155.4 against 173.0 on Fossil-free 2040; today 187.1
against 191.8. Every fixed cost per kWh was inflated by the storage throughput. An invariant now
requires sales to equal energy served.

Error 2, battery O&M counted twice. The ATB's 2.5% battery fixed O&M includes augmentation
(ATB 2024), and a separate 4% of capex a year was added for augmentation on top. That 2.5% was
also taken on 4-hour capex whatever the duration. Now 2.5% of capex at the built duration, no
separate augmentation.

```
                          before   after   stranded coal off   today = 1
Today 2026                 4.02     3.98         3.98             1.00
Deep decarbonisation 2035  5.32     4.92         4.67             1.24
Fossil-free 2040           6.57     5.81         5.53             1.46
```

Method question, not changed: the residential allocation (1.622) multiplies the whole stack.
Applying a load-shape factor g to generation and new transmission, and calibrating the premium
on existing network and retail so today still reads R3.98:

```
g      network factor   Deep 2035   Fossil-free 2040
1.00        5.14           4.62          5.26
1.15        4.29           4.69          5.39
1.30        3.44           4.77          5.53
whole stack (current)      4.92          5.81
```

g is not sourced; Eskom's cost-to-serve study would give it.

What remains is real in the model: reliability to the NEM standard (35-45 GW of 8-hour lithium,
65-119 TWh spilled), new transmission at the TDP average (R0.24-0.32/kWh before allocation), and
retiring coal early while its capital is still being paid. The comparison is also against
today's price, which rests on a largely depreciated fleet; the IRP's own counterfactual retires
8 GW of coal by 2030 and 15 GW more by 2042 regardless.

### Residential premium from the cost-to-serve study by component, 22 Sep 2026

Build `2026-09-22ab`. Source: Eskom 2024/25 Standard tariffs cost-to-serve study (NERSA submission,
July 2024), Table 41, allocated costs in R million, C12 urban residential <500V (1,409 GWh)
against the system total (170,947 GWh).

```
component                         C12 c/kWh   system c/kWh   ratio
energy ToU + capacity + legacy        215.6          171.4   1.258
Transmission network                    5.7            4.2   1.36
network and retail (Tx, Dx, retail)   104.8           26.1   4.02
total                                 320.4          197.5   1.622
```

The earlier derivation in this conversation (1.19 and 4.26) was wrong: it assumed the system's
energy cost from the study's 86% functionalisation and left energy capacity out of the
residential side. The table itself gives 1.258 and 4.02.

Two changes. The single 1.622 factor is replaced by these three: generation and hourly energy at
1.258, new transmission at 1.36, existing network and retail at 4.02. And the separate R0.30/kWh
retail margin is removed: it was the CTS retail cost (R9.24 per PoD per day), which is already in
Eskom's allowed revenue and was already inside the 1.622.

```
R/kWh, regulated / market     before        after
Today 2026                  3.98 / 3.91   3.75 / 3.69
Deep decarbonisation 2035   4.92 / 4.83   4.55 / 4.48
Fossil-free 2040            5.81 / 5.73   5.31 / 5.24
```

Today against Homepower's R3.82 all-in: 1.8% below, from 4% above. Weighting by the residential
load profile adds 1% on either basis.

Known overlap: the 1.258 includes the study's ToU weighting of residential energy, and the
profile-weighted rows then apply the modelled hourly shape as well. On today's regulated basis
that is 0.8%.

### Retail panel, third sweep: the page compared scenarios against the wrong today, 22 Sep 2026

Build `2026-09-22ac`.

Defect fixed: the retail panel's year slider defaulted to 2035 whatever the preset. On the page,
Today 2026 therefore read R3.29/kWh, today's fleet priced with 2035 contract expiries and asset
run-off, against R3.75 at its own year. Every scenario looked 20-40% dearer than today by that
comparison. The preset buttons now set the retail year to the scenario's year; an invariant
checks it. The harnesses always passed the year explicitly and never saw it.

Decomposition, regulated basis, R/kWh at retail (each line through the CTS factors, losses and
VAT):

```
                       Today 2026   Deep 2035   Fossil-free 2040
fuel and carbon            0.89        0.22          0.07
existing generation opex   0.41        0.20          0.09
existing capital           0.48        0.16          0.06
stranded coal capital         -        0.19          0.22
IPP contracts              0.40        0.16          0.11
imports, levies, other     0.22        0.15          0.18
new wind                      -        0.73          0.63
new solar                     -        0.40          0.62
new offshore                  -           -          0.69
new lithium                   -        0.55          0.66
new transmission              -        0.38          0.49
network and retail         1.35        1.42          1.50
total                      3.75        4.56          5.32
```

Four lines carry most of the rise, each a choice or a method question rather than an error:
- Offshore on Fossil-free, R0.69: 10 GW, twice ESMAP's medium path, at R79,200/kW.
- Lithium, R0.55-0.66: 35-45 GW at 8h to meet the NEM reliability standard.
- Stranded coal, R0.19-0.22: the generation asset base keeps recovering on its run-off schedule.
- New transmission, R0.38-0.49: the TDP average, R6,964 per kW of all new wind and solar. The
  engine's own transmission charge for the same builds, filling existing headroom first on its
  distance curve, is R16.8bn a year on Deep and R25.7bn on Fossil-free against the retail line's
  R40.9bn and R49.6bn. Using the engine's figure would take R0.22-0.24/kWh off. Two methods for one
  cost, not reconciled.

Network and retail rises only through falling grid sales as rooftop grows (191.8 to 173.0 TWh).

Against the right today: Deep decarbonisation +21%, Fossil-free +42%.

### Transmission reconciled to what the TDP buys; offshore and iron-air tested, 22 Sep 2026

Build `2026-09-22ad`.

What the TDP buys. TDP 2024 (NTCSA public report, Rev 2) Table 4, first five years, R112.5bn:
new generation integration R54.3bn, network strengthening R26.4bn, land and rights R4.9bn,
refurbishment R17.8bn, telecoms, real estate, IT and equipment R9.1bn. The decade total is R440bn
(not R390bn). Its 56 GW of new generation includes 9 GW of rooftop solar and 15.9 GW of gas.
Generation integration with land pro rata is 51.1% of the plan: R225bn for 46.9 GW of
grid-connected generation, R4,800/kW, R402/kW-yr over 40 years at 8%.

Both old methods were off. The retail line charged R6,964/kW (the whole TDP over all 56 GW,
refurbishment and load strengthening included) to wind and solar only. The engine's R600/kW-yr
was the same whole-TDP figure, and its curve filled the cheapest headroom first whatever the
technology, pricing new wind as if it could connect in Gauteng at a quarter of the average.

One method now: txRPerKWyr R402/kW-yr, flat, on new wind, utility solar not on retired-coal
sites, and offshore (plus its export grid), with the engine's regional reinforcement. The retail
panel reads the engine's figure.

```
R/kWh, regulated / market   before        after
Today 2026                3.75 / 3.69   3.75 / 3.69
Deep decarbonisation 2035 4.55 / 4.48   4.34 / 4.28   +16%
Fossil-free 2040          5.31 / 5.24   5.06 / 4.99   +35%
```

Offshore on Fossil-free, twelve weather years, NEM standard 3.5 GWh:

```
offshore / wind / solar / lithium GW   mean cost R bn   mean shed GWh   worst
10 / 30 / 55 / 45  (preset)                 359.4             2.2        26 (2020)
 5 / 40 / 55 / 50                           355.4             3.3        39 (2020)
 5 / 35 / 60 / 50                           350.6             3.7        44      misses
 0 / 55 / 60 / 50                           366.1             2.8        33 (2020)
 0 / 50 / 55 / 50                           344.0            15.5       101      misses
```

5 GW of offshore meets the standard R4.0bn a year cheaper than 10 GW; none costs R6.7bn more
than 10 GW. Offshore's steadier output is worth something, but less than 10 GW of it.

Iron-air (100h, R127,050/kW in 2026) in place of lithium, twelve years:

```
Deep decarbonisation, 35 wind / 35 solar         mean cost   mean shed   worst
35 GW lithium (preset)                              306.6        2.7       19.6
25 GW lithium + 2 GW iron-air                       308.4        4.5       23.8
20 GW lithium + 3 GW iron-air                       309.1        6.0       26.6
Fossil-free, 10 off / 30 wind / 55 solar
45 GW lithium (preset)                              359.4        2.2       25.8
35 GW lithium + 2 GW iron-air                       360.2       11.6       64.6
```

In every swap tested, iron-air costs more and sheds more. 1 GW of iron-air costs about as much a
year as 5 GW of 8-hour lithium. Caveat: the engine's long-duration dispatch has not been checked
against a perfect-foresight benchmark, so this is a finding about the model as built.

### Offshore level refined; storage dispatch benchmarked; transmission overlap sized, 22 Sep 2026

Build `2026-09-22ad`, no code change.

Offshore on Fossil-free 2040, twelve weather years, NEM limit 3.46 GWh. Cheapest build found at
each level that passes:

```
offshore / wind / solar / lithium GW   mean cost R bn   mean shed GWh
 5 / 40 / 55 / 50                           355.4            3.3
 6 / 38 / 55 / 50                           357.8            2.5     37/55/49 misses (3.6)
 7 / 35 / 55 / 48                           354.3            3.4
 8 / 33 / 55 / 47                           355.1            3.1
10 / 30 / 55 / 45  (preset)                 359.4            2.2
```

Flat from 5 to 8 GW, within R1.1bn; 7 GW is the cheapest found, R5.1bn below 10 GW. The search
steps wind and lithium in 1-2 GW, so differences under about R1bn are within its resolution.

Storage dispatch against perfect foresight (ldes_series.js, ldes_lp.js at the repo root).
Fossil-free, weather year 2020 (its worst), 16.8 GW new rooftop. The surplus and deficit are taken
from an engine run with no new storage; the LP then dispatches the new storage optimally against
them, cyclic over the year, efficiencies as the engine's (lithium 0.88, iron-air 0.45).

```
new storage                        engine shed GWh   perfect-foresight shed GWh
45 GW lithium 8h                         25.8                   0.0
35 GW lithium 8h                            -                  58.1
25 GW lithium 8h                            -                 138.1
35 GW lithium + 2 GW iron-air            64.6                   0.0
```

The engine's rule-based dispatch leaves 26 GWh unserved that optimal dispatch avoids, and it
handles iron-air badly: 2 GW of 100-hour storage discharged 27 GWh in the engine and took 58 GWh
of shortfall to zero in the LP. The finding that iron-air never helps is a finding about the
dispatch rule, not the technology. Perfect foresight is an upper bound: real operators forecast
days, not a year. The LP also ignores reserve holding, which the engine does.

Transmission overlap. The regional reinforcement charge prices capacity beyond existing plus
TDP-built headroom; the flat R402/kW-yr prices every new MW at the TDP average. Capacity beyond
headroom pays both:

```
                            within headroom   beyond   reinforcement   overlap at R402
Deep decarbonisation 2035        64.8 GW       5.2 GW      R1.22bn         R2.08bn
Fossil-free 2040                 83.4 GW      11.6 GW      R2.67bn         R4.65bn
```

The two charges also count different capacity: reinforcement includes the solar on retired-coal
sites, which the flat charge exempts.

### Long-duration dispatch fixed; both presets re-optimised with iron-air, 22 Sep 2026

Build `2026-09-22ae`.

The fix. In a deficit hour, if lithium alone is projected to run short within 48 hours, stores
of 100 hours or more discharge first at up to their power, keeping lithium for the peak hours.
The projection is net load before storage less firm thermal capacity. Otherwise lithium still
goes first. Found by testing rules against the perfect-foresight LP on Fossil-free 2020: pure
lithium-first leaves a low-power 100-hour store unable to cover the peaks once lithium is empty;
long-first cycles iron-air daily at 45% and wastes it.

```
Fossil-free, weather year 2020        before   after   perfect foresight
35 GW lithium + 2 GW iron-air         64.6      5.1           0
25 GW lithium + 3 GW iron-air        105.6     10.4           0
45 GW lithium only                    25.8     25.8           0
```

The lithium-only gap is not this rule. 29.7 GWh of that run's residual is operating reserve
held on storage and passed to peakers that a fossil-free system does not have, which the LP
ignores; with reserve holding off the engine still sheds 21.4 GWh in four hours against a greedy
0 on the same residual. Open: in those four hours demand response returns 1,200 MW of shifted
load into the shortage.

Re-optimised, twelve weather years, NEM standard:

```
Deep decarbonisation 2035 (limit 3.67 GWh)     mean cost R bn   mean shed   worst
35 W / 35 S / 35 GW Li                              306.6           2.7      19.6
35 W / 35 S / 25 GW Li + 1 GW iron-air (preset)     298.6           2.4      18.0 (2016)
35 W / 35 S / 20 GW Li + 2 GW iron-air              299.2           0.5       5.0
35 W / 35 S / 20 GW Li + 1 GW iron-air              289.5           4.8      misses

Fossil-free 2040 (limit 3.46 GWh)
10 off / 30 W / 55 S / 45 GW Li                     359.5           2.2      25.8
10 off / 30 W / 55 S / 30 GW Li + 2 GW iron-air     352.2           2.4      26.4
 7 off / 35 W / 55 S / 35 GW Li + 2 GW iron-air     350.2           2.5      30.2 (2020) preset
 5 off / 40 W / 55 S / 35 GW Li + 2 GW iron-air     348.2           3.9      misses
```

Iron-air now earns its place: R8.0bn a year off Deep decarbonisation and R9.3bn off Fossil-free.
Supersedes the finding that iron-air appears in no robust build; that was the dispatch rule.

Retail, regulated / market R/kWh: Today 3.75 / 3.69; Deep decarbonisation 4.27 / 4.21 (+14%);
Fossil-free 4.96 / 4.89 (+32%).

### Storage follow-ups: a dispatch bug, long-duration O&M, twelve-year benchmark, 22 Sep 2026

Build `2026-09-22af`.

Bug in the lookahead of build `2026-09-22ae`: the long tier could discharge in the lookahead
pass and again in the ordinary pass in the same hour, up to twice its power. Fixed. Every
iron-air figure in the entry above was flattered by it.

Long-duration fixed O&M: vanadium and iron-air carried zero. Now R165/kW-yr, PNNL's Energy
Storage Technology and Cost Characterization Report (July 2019), $10/kW-yr for all battery
chemistries within a $6-20 range, at R16.50. Not chemistry-specific.

Adequacy hold: in a projected shortfall within 48 hours, storage no longer sells ahead of coal.
Small effect on these presets (Deep 2016 22.8 to 20.5 GWh, 2020 16.8 to 15.2).

Benchmark, preset builds, all twelve weather years. Engine shed against perfect-foresight
dispatch of the new storage on the same residual:

```
                      years shedding   engine GWh          optimal GWh
Deep decarbonisation  2016, 2020       16.5, 8.3 (ae)      0, 0
Fossil-free           2020             30.2 (ae)           2.0
Fossil-free 2020, 30 W/55 S/10 off, 35 GW Li + 2 GW Fe:   64.6 before, 9.1 now, 0 optimal
```

In every other year both shed nothing. The remaining gap is lithium dispatch, not the
long-duration rule: in Deep 2016 the optimum uses no iron-air at all and still sheds nothing.
Mean over twelve years, the engine is about 2 GWh a year more pessimistic than optimal on both
presets. Not yet explained; reserves account for part of it on Fossil-free only.

Correction: the entry above said demand response returns 1,200 MW of shifted load into
shortage hours. It does not. That series is interruptible load being called, which is right.

Presets re-measured, twelve years:

```
Deep decarbonisation, unchanged build               mean cost 298.8   mean shed 2.97   passes 3.67
Fossil-free, 7 off/35 W/55 S/35 Li/2 Fe (ae build)  mean cost 350.6   mean shed 3.68   misses 3.46
Fossil-free candidates
  42 GW Li + 1 GW iron-air  (new preset)                        353.3            3.09
  37 GW Li + 2 GW iron-air                                      353.8            2.55
  50 GW Li, no iron-air                                         357.5            2.22
  40 GW Li + 1 GW iron-air                                      350.0            4.81   misses
```

Iron-air is worth R4.2bn a year on Fossil-free against lithium alone, down from R9.3bn before the
bug and O&M corrections.

Retail regulated / market R/kWh: Deep decarbonisation 4.27 / 4.21; Fossil-free 4.99 / 4.92.

External check now failing: NTCSA MTSAO 2030 with 6 GW of gas delayed publishes 86 GWh unserved;
the engine reads 4.4, outside the 55 GWh band. Cause established: the adequacy hold. Without it
the check passes. Not widened.

### The NTCSA MTSAO mismatch: professional practice and what the 86 GWh assumes, 22 Sep 2026

Build `2026-09-22af`, no code change.

How professional adequacy models dispatch storage:

```
AEMO ESOO        storage fully optimised to reduce unserved energy, perfect foresight;
                 AEMO notes the risk is greatest for very short storage and penalises
                 2-hour batteries for it
ENTSO-E ERAA     sequential Monte Carlo (Antares, among others), perfect foresight one week
                 ahead; a share of capacity is reserved for balancing and not dispatched
NTCSA MTSAO      Monte Carlo on demand, wind, solar and unplanned outages, "dispatching
                 available generators optimally", multi-nodal, results the mean of samples
```

All three dispatch storage to minimise shortfall with foresight longer than 48 hours. The
adequacy hold is in line with practice and more conservative than it; selling ahead of coal
regardless of a coming shortfall was the outlier.

What the 86 GWh is (MTSAO 2026-2030, section 7.4.1.2): high EAF (67%), moderate demand
(264 TWh in 2030, Mozal assumed to 2030), all new capacity with the 6 GW of CCGT delayed,
8.4 GW of coal and Cahora Bassa's 1.15 GW gone by March 2030, reserves of 3,800 MW held,
Monte Carlo mean, transmission-constrained.

The engine on the harness scenario, with and without the hold:

```
                                          with hold   without
default weather, one outage path             4.4        54.1
20 outage draws, mean                        4.6        39.6
12 weather years x 3 draws, mean            13.0        37.9
same, 3.8 GW less utility solar             22.9           -
```

The old agreement came from dispatch that sold storage ahead of coal, which none of the
professional models do. What the engine still lacks against the MTSAO:
- Monte Carlo averaging in the check: the mean over weather years and outage draws is three
  times the single run.
- Transmission: the MTSAO is multi-nodal and attributes part of its unserved energy to
  network constraints; the engine is national.
- The capacity mapping: the MTSAO's all-new category is 29.7 GW in 2030 including the 6 GW
  of gas, so about 23.7 GW without it, rooftop included. The harness enters 27.5 GW. Not
  confirmed; the category breakdown is in figures that do not extract as text.

### Lookahead window measured; NTCSA check rebuilt, 22 Sep 2026

Build `2026-09-22ag`.

Correction: the entries above describe a 48-hour lookahead. The code has run at 168 hours
since build `2026-09-22af`, and every `af` preset figure was measured at 168. Its comment
cited a personal communication from the System Operator that this project cannot source; it
now cites ENTSO-E's week-ahead ERAA practice and the sweep below. The window is overridable as
ldesLookaheadH.

```
Fossil-free, 2020, 35 GW Li + 2 GW Fe   window h:   1     12    24    48    96   168   336
shed GWh                                          64.6  43.4  30.5   9.1   9.1   9.1  52.1

Twelve-year mean shed, preset builds              48 h       96 h      168 h
Fossil-free 2040 (limit 3.46)                     3.49       3.09      3.09
Deep decarbonisation 2035 (limit 3.67)            3.65       2.97      2.97
```

Past about a week the rule spends iron-air too early. A longer window would need an
optimisation, not this rule.

NTCSA check rebuilt: mean over twelve weather years x three outage draws, as the MTSAO reports
a Monte Carlo mean; capacity re-derived from the MTSAO's categories less the model's 2026 fleet
(wind 4,400, PV 10,900, rooftop 1,800, batteries 2,150 MW, against 6,700 / 15,000 / 3,800 /
2,000 entered before); coal EAF 64, the project's conversion of the MTSAO's 67% fleet EAF;
0.34 GW of Acacia and Port Rex retired.

```
                                        engine GWh   NTCSA   band
rebuilt, coal EAF 64 (the check)            211.7       86     55    fails, +125.7
rebuilt, coal EAF 67                         76.1       86     55    passes
old inputs, 36-draw mean                     13.0       86
```

The EAF conversion decides the check. The engine sheds with peakers at full output and coal at
its available ceiling, so the shortfall is real in the model. Still missing: the MTSAO's
transmission component, which would raise its figure relative to a national model, not lower it.

### Where the NTCSA gap comes from, 22 Sep 2026

Build `2026-09-22ag`, no code change. Rebuilt MTSAO case, mean of twelve weather years x two
outage draws, against NTCSA's 86 GWh:

```
                                                    mean shed GWh
rebuilt check as it stands                              240.7
+ Cahora Bassa at 1,150 MW all year                      79.9
+ non-Eskom firm plant, 2,100 MW                         43.3
+ both                                                   12.1
+ non-Eskom firm and Cahora Bassa pro-rata (288 MW)      32.0
+ the same at coal EAF 67 instead of 64                   9.1
```

Two inputs, not the EAF conversion, carry most of it:

- Cahora Bassa. The check zeroes imports for all of 2030; the MTSAO has the contract running to
  March 2030. A quarter of it, 288 MW on an annual average, is worth 55 GWh of shed energy here.
- Non-Eskom plant. The MTSAO counts 2,387 MW of non-Eskom generation contributing 10.5 TWh -
  1,328 MW coal, 582 gas, 198 cogeneration, 180 pumped storage. The model's fleet is Eskom's
  only, so that capacity is absent from every scenario, not just this check.

The old check read 13 GWh because its 8 GW of surplus new renewables offset the missing firm
capacity. Two errors cancelling.

Open question before the check is fixed: whether the demand series covers the load those
non-Eskom plants serve. Eskom contracted demand is 210.5 TWh in this case against the MTSAO's
264 TWh national figure, and the difference is losses, exports, rooftop self-consumption and
possibly that load. Adding their generation without their demand would flatter the model.

### NTCSA check rebuilt on a robust case; outage share measured, 22 Sep 2026

Build `2026-09-22ah`.

The non-Eskom fleet stays out, and the energy balance says why. Eskom's hourly dataset for 2025:
coal 170.4 TWh, nuclear 10.2, Eskom OCGT 1.9, hydro 1.8, pumped storage 4.5, imports 6.6,
contracted IPP renewables 18.1 and the DoE peakers 1.5, summing to 214.9 TWh, which after 6.0 TWh
of pumping matches contracted demand of 209.6. It is a closed Eskom-plus-contracted-IPP balance
with no non-Eskom coal in it, so those stations and the load they serve are both outside the
model's universe. Adding their capacity without their demand would flatter every scenario.

The 86 GWh comparison is retired. It sits at the edge of adequacy, where the answer moves faster
than the inputs are known: 5% more demand took the same case from 186 to 635 GWh, and a flat
availability derate in place of the unit-level outage model took it from 186 to 43.

Replaced by the MTSAO's risk-adjusted 2030 case, whose two published outputs are far from zero:

```
                        model (12 years x 2 draws)   MTSAO
unserved energy                   4.5 TWh            more than 4 TWh
OCGT utilisation                   47.6%             about 45%
```

The demand mapping is what makes it line up, and it is the sensitive input. Eskom contracted
demand ex-exports was about 204.7 TWh in 2024 against the MTSAO's national 243 TWh, a ratio of
1.187; their 264 TWh in 2030 is then 222.4 TWh on this model's basis, +15% on its base, against
the +8.6% the check used before. Coal EAF 56, from their 60% fleet figure.

Forced-outage share measured, from ESK19679, unplanned over total capability loss:

```
2022   2023   2024   2025   2026 Jan-Aug
 73     73     66     67      61
```

It falls as availability recovers, so it is now taken from the same year as coalEAFPct: 61, was
67 against a 2026 EAF. Deep decarbonisation's mean shed energy goes 2.97 to 2.34 GWh a year;
Fossil-free is unchanged, having no coal. The peaker-seasonality benchmark, which had been
failing, now passes: 28/28.

Not measured: the 72-hour mean repair time. ESK19679 carries fleet capability loss, not per-unit
outage events, so it cannot be derived from it, and it is worth a factor of four on shed energy
in a tight case.

### Outage repair time sourced and calibrated, 22 Sep 2026

Build `2026-09-22ai`. The 72-hour mean repair time was unsourced. Two routes were tried.

Published figures do not fit this fleet. Deakin et al. (2022), comparing outage models against
ENTSO-E data, use 40 hours for coal with 0.86 availability, after Edwards et al. (2017). The same
paper finds those Markov models far less persistent than the real data they represent: European
fleets show a week-lag autocorrelation of 0.27 to 0.70 against about zero in the model.

So the value is calibrated to persistence instead, from Eskom's own hourly series. Unplanned
capability loss in 2025 has an autocorrelation of 0.91 at a day, 0.70 at a week and 0.44 at a
month; total fleet availability, 0.92 and 0.79. The modelled availability path against those:

```
repair time h      24 h lag    1 week lag
 40                  0.54         0.21
 72 (was)            0.77         0.29
120                  0.84         0.34
240                  0.88         0.47
480 (now)            0.96         0.74
observed                0.92         0.79
```

It changes little: a 2025 backcast goes 4 to 7 GWh of shed energy, the NTCSA risk-adjusted case
4.8 to 4.5 TWh. What matters is unit-level outages at all, not their length - the same case reads
43 GWh with a flat availability derate against 186 with unit-level outages. Both presets still
meet the reliability standard: Deep decarbonisation 3.35 GWh mean shed against its 3.67 limit,
Fossil-free 3.09 against 3.46.

Two checks were reading one outage draw and now average three, because at 480 hours a single path
carries several GWh of noise: the reserve-requirement invariant (7.7 / 5.0 / 227.3 GWh on the base
seed, which inverts the first two) and the 2026 surplus benchmark (8.6 GW on the base seed, 6.5 as
a three-draw mean).

### The 2025 backcast, and what it says

Bigger than the repair time: at 2025 conditions the model sheds 4 to 7 GWh where Eskom shed
390 GWh (the same figure the MTSAO reports for the year to September). Demand is not the reason -
the model's 196.1 TWh and 29.6 GW peak match contracted demand ex-exports of 194.7 TWh and 30.5 GW.
Nor is diesel: the model burns 0.26 TWh against Eskom's 3.4 TWh of OCGT, so Eskom shed load while
burning more fuel than the model uses.

What is left is the shape of availability. Real 2025 fleet availability has a fifth percentile of
54.5% and a minimum of 46.7% around a 62.4% mean, and those troughs persist for weeks. The
modelled path has a similar spread but disperses faster. The fix that professional models use is
to drive the simulation with historical availability traces rather than synthetic draws - MISO
builds hourly outage adders from GADS history, AEMO uses historical reference years. ESK19679
carries the hourly series to do it.

### Historical availability traces built; the backcast gap is not availability, 22 Sep 2026

Build `2026-09-22aj`. `nodal/coal_availability_trace.json` holds measured coal-only availability
for 2023, 2024 and 2025 from ESK19679: Eskom installed capacity less planned, unplanned and other
capability loss, less nuclear at its measured output and the other 5,758 MW at 90%, over coal
capacity. Each year is divided by its own mean, so the file carries shape and the level stays
the scenario's coalEAFPct. Set outageTraceYear and coal availability follows that year's measured
hours instead of the Markov draw; unset, nothing changes. A check asserts both the level and the
persistence.

Correction to the entry above: that 2025 backcast ran the 2026 fleet against 2025 availability -
wind 4,512 MW rather than about 3,900, solar 3,271 against 2,600, rooftop 8,942 against 6,900,
batteries 800 against 500, Medupi 4 and Kusile 6 already back. On the 2025 fleet it sheds 13 GWh
rather than 7.

The trace does not close the gap. On the 2025 fleet and the measured 2025 shape the model sheds
1.6 GWh, against 13 for the Markov draw and Eskom's actual 390 GWh of load shedding.

What the Eskom data says about those hours. Load was reduced in 1,048 hours of 2025, and in them
demand averaged 26.2 GW while coal generated 20.0 GW - against roughly 23 GW of coal that was
nominally available at that year's availability. Eskom reduced load with about 3 GW of available
coal not generating, and burned 3.4 TWh of OCGT doing it, against this model's 0.6 TWh. So the
binding difference is not how much plant is available but how much of it can actually be
delivered in the hour: minimum stable levels, ramp limits, units available but not synchronised,
and reserve protection. The model treats available capacity as dispatchable up to its commitment
schedule.

The trace is worth having regardless - it is the right input for backcasts and removes a
synthetic assumption from them - but the calibration item stays open and now has a direction.

### The 2025 backcast decomposed; a Backcast 2025 preset, 22 Sep 2026

Build `2026-09-22ak`. Eskom shed 390 GWh in 2025 and burned 3.4 TWh of OCGT doing it. The 202
hours in which it shed, against the model driven by the same measured availability:

```
                        Eskom actual   model
demand                     24,645        23,634   (Eskom includes 1,566 MW of exports)
coal available             19,588        19,865
coal generated             18,943        17,975   (the model holds 2,200 MW of reserve)
OCGT                          942           655
pumped storage                390           423
load shed                   1,931             8
```

Deliverability is not the problem: Eskom's coal generated 96.5% of its available capacity in
those hours and 98.5% in the year's 200 highest-demand hours, so there is no systematic 3 GW of
available-but-undeliverable plant. The earlier reading of that came from comparing those hours
against the annual mean availability rather than the hour's own.

Three inputs explain most of the rest, and two were again 2026 values on a 2025 run:

- Exports. FIXED.exportsMW is 745 MW, the post-Mozal level. Exports averaged 1,705 MW in 2025
  and 1,566 in the hours Eskom shed. Correcting it takes the backcast from 2 to 6 GWh.
- Peakers. The model dispatches the full 3.06 GW OCGT fleet when short; Eskom managed 942 MW in
  those hours while using 3.4 TWh over the year. Limiting the fleet to what Eskom delivered takes
  the backcast to 131 GWh.
- The rest is demand: the model's year is 204.5 TWh against contracted 209.6.

```
2025 backcast, cumulative              shed GWh
as first run (2026 fleet)                    7
2025 fleet                                  13
+ measured availability trace                2
+ 2025 export level                          6
+ peakers held to 1.4 GW                   131
Eskom actual                               390
```

New preset, Backcast 2025: the 2025 fleet, demand, exports and measured coal availability in one
place, so this cannot be run on today's fleet by accident again. It sheds 6 GWh.

Open: why Eskom's peakers delivered under a gigawatt in its tightest hours while the model
delivers three. Fuel logistics and station availability are the candidates, and neither is in
ESK19679.

### Common-mode trips added; Today 2026 expected shedding roughly triples, 3 Oct 2026

Build `2026-10-03d`. Professional tools (GE MARS, AEMO's ESOO, PLEXOS) draw forced outages unit by
unit, independently; correlation is added as a common-mode failure rate that takes a group out
together, with its own repair rate (Billinton and Allan; Singh). Done here per station, with the
independent rate reduced so the EAF is unchanged. 0 events reproduces the independent draw exactly.

Calibrated to ESK19679 2023-2025 on two statistics, checked on two it was not fitted to:

```
                            measured            calibrated (60 draws)
days losing >8% in 24h      9, 16, 16           14       fitted
largest 6-hour fall         0.136-0.152         0.154    fitted
1st percentile              0.73-0.83           0.78     not fitted
worst week                  0.76-0.87           0.80     not fitted
```

5 events per station-year, each taking half the station's units, 36-hour repair (February 2025:
8 of 10 tripped units back within about a day and a half).

Today 2026, 960 draws, each with its own outage path and one of twelve weather years:

```
                         mean shed GWh   worst-year mean
independent                  0.07              0.7
common-mode                  0.19              2.0
null, same random use        0.06              0.7
```

At 48% EAF, eight draws: 0.102 to 0.111 TWh. Still under the 0.002% standard (about 4 GWh) at
today's fleet. Coal presets other than Today 2026 not yet re-measured over many draws.

> RENAMED 3 Oct 2026: `Latest IRP's 2030 targets` is now `IRP's 2030 targets`. Entries before
> then use the old name.

> RENAMED 4 Oct 2026: `Grid delay` is now `IRP's 2030 targets, grid delayed`, and `Backcast 2025` is
> now `2025, as modelled`. Entries before then use the old names. Both buttons carry hover text.

> CORRECTED 7 Oct 2026: `IRP's 2030 targets` and `IRP's 2030 targets, grid delayed` (and their old
> names `Latest IRP's 2030 targets` and `Grid delay`) carried 300 MW of new storage until build
> `2026-10-07f`; IRP 2025 Table 1 has 3,724 MW by 2030. Every figure for either preset before 07f used
> 300 MW, in these entries: "Earlier findings re-measured on build 2026-09-22n"; "IRP demand verified
> against the IRP"; "Network held in both retail bases"; "Coal presets re-measured with common-mode
> trips"; "Both forecasts on planned coal and outage state"; "Adequacy loop converges"; "Adequacy loop
> decomposed"; "A 2035 counterfactual"; "The IRP emissions comparison, redone"; "Coal utilisation is
> where this model and the IRP disagree"; "Fleet availability to coal availability"; "The two 2030
> presets were priced at 2026"; and both 6 Oct gas-floor entries. Not affected: "A growth percentage
> is not a demand mapping" (demand only). `IRP path 2035` also changed at 07f (storage 6.1 to 4.7 GW,
> gas 11.6 to 10.75 GW, wind and solar from an interpolation to Table 1). Effect on one run: see
> "IRP presets rebuilt from Table 1", 7 Oct 2026.

### A coal operating floor does not reproduce 2025's curtailment either, 4 Oct 2026

Build `2026-10-04a`, Backcast 2025, stopgap off (curtailment setting 0). Test only, in a copy: coal
held at or above a share of its available capacity in every hour.

```
floor      night coal mean / p5 / min    curtailment         at night (22-05)
none         18,355 / 15,667 / 14,054    0
55-70%       unchanged                   0
80%          18,186 / 15,194 / 12,994    5 GWh, 0.03%        100%
85%          18,061 / 15,340 / 13,224    697 GWh, 3.9%       42%
90%          18,376 / 16,046 / 14,002    3,214 GWh, 18%      33%
Eskom 2025   19,177 / 16,144 / 13,210    about 1.0-1.6%      mostly night
```

The floor does not bind until about 80% of available coal, then curtailment jumps past the target
in one step and lands mostly at midday on solar, not at night on wind. Wrong timing and no stable
setting in between. Together with the minimum-stable test (up to 1.4x, no curtailment) and the
demand-definition test (ruled out), no system-wide mechanism tried reproduces 2025: night
curtailment of about 1% with clean days.

The remaining explanation is local: NERSA says plants were curtailed to keep the grid stable at
low demand, which on long, lightly loaded lines in the Northern and Eastern Cape points to voltage
or stability limits at specific substations, not national surplus. A single-node dispatch cannot
produce that. The stopgap stays; its timing could be moved to wind at night.

### The 08c central pass 2 did not solve in eight hours; a sparser LP and three ways to shrink it, tested on the first pass, 9 Oct 2026

Central pathway on build `2026-10-08c` (v_half_c1_p1_08c: Today 2026, demand +5% to 2040, half standard, COMMIT 1,
PSE 1, TF 0.5, WPP 3, MAXP 14, native HiGHS). Pass 1 solved in 23 min (simplex). Its engine check added 12 distinct
14-day windows, bound from the first failing year to 2040: 1,036 window days over 2031-2040 (168 in 2040). The pass-2
LP is 237.7 MB (07s: 204.2 MB). Simplex ran 7 h 52 min and interior point 4 h 52 min (net of a 58 min pause) on it,
neither finishing; both were stopped at 01:00 UTC (user rule, 8 Oct). The 07s pass 2 took 7 h 58 min on simplex.

Sparser LP (bldCumVars, build `2026-10-08d`, off by default). Two thirds of the first-pass LP's nonzeros (1.37 of 2.02
million) are the same build sums repeated in every hourly row. One cumulative-capacity variable per technology and year
(K_<t>_<y> = K_<t>_<y-1> + b_<t>_<y>) is an exact rewrite: 0.89 million nonzeros, 28.9 MB against 49.9. On the first
pass (harness/ext/hs_lp.js) it gives the same objective to 14 significant figures and all 225 build decisions identical
(no difference above 0.001 MW). Interior point 509 s against 806 s dense (1.6 times faster); simplex slower (stopped at
2,962 s against 1,505 s). Below the user's threshold of twice as fast, so not used.

Shrink options, first pass (the run's own pass-1 LP; interior point, which matched simplex to 14 significant figures;
base objective R1,227.40bn). Cost is the option's build re-costed on the full 12-day model where the option changes the
model. GW built by the year shown.

```
option                      LP size          solve     cost vs base   build moves (GW)
base (12 days, 2026-2040)   49.9 MB          ~13 min(+) -
8 representative days       38.3 MB (-23%)   ~7 min     +0.036%        2040: solar +1.7, wind -0.8, lithium -0.6, gas +0.17
6 representative days       32.6 MB (-35%)   ~5 min     +0.21%         2030: solar -2.4; gas +0.36 throughout
five-year blocks            11.4 / 28.0 /    <2, 2.5,   +1.47%         2030: solar +5.2, wind +2.3, gas -0.68, coal
  (2026-30, then 2031-35,   49.9 MB (*)      4 min                     retired +1.5; 2040: lithium +1.9, solar +3.2
  then 2036-40, earlier
  builds fixed)
```
(+) Interior point on the near-identical first-pass LP of harness/ext/hs_lp.js (806 s); solve times include no page
load. (*) The harness keeps earlier years in each block's LP with their builds fixed, so it measures the blocks' effect on
cost and build, not their speed; true blocks need a start year in bldBuildLP. With every build to 2035 fixed, the full
2026-2040 LP solved in about 4 min against 13: the build decisions that tie the years together are what make it hard.

At pass 2 the calendar days are a small part of the LP (12 a year against up to 175 stress days), so fewer
representative days shrink it by only about 5% (8 days) or 7% (6 days).

Stress windows. Merging windows from the same weather year and outage draw that overlap (MERGE_WIN) cuts the pass-2 LP
from 237.7 to 198.2 MB (-17%). Tested on a pass-2 LP holding only the four overlapping
2023 windows (WIN_YEARS=2023), interior point: unmerged, four windows binding from 2031, 2035, 2039 and 2040 (98.5 MB),
solved in 1 h 54 min, objective R1,279.69bn; merged, one 21-day window binding from 2031 (85.6 MB), still solving
after 2 h 10 min. On this test merging made the LP slower, not faster; its effect on cost and build follows when it
finishes. The same unmerged LP is being solved without crossover (HIGHS_CROSSOVER=off), to measure how much of interior
point's time the final vertex step takes.
Binding each window only in the years it failed, not from then to 2040, would cut window days from 1,036 to 420 (or
588 with the following year): about -45% on the pass-2 LP, at the risk of more passes. Not tested.

Harness: pathway_perfail.js switches REP_DAYS, MERGE_WIN, WIN_YEARS, FIX_FROM/FIX_TO, GROWTH_PA and CUMV; outputs in the
session scratchpad (shrink/). The harness with no switch set writes the run's pass-1 and pass-2 LPs byte for byte.

### Hourly state of charge in the build LP (bldHourlySoc): no store borrows within a day any more, 8 Oct 2026

Build `2026-10-08c` (user decision 8 Oct, TODO 14bl): (1) an hourly level for every store on stress days; (2) the
window start a free level, with the window ending where it started; (3) calendar days measured first and given an
hourly level too if the problem showed up on more than a handful of days.

Calendar days, measured first on the 07s central pass-2 LP (hash a8a71a7a) and its cached solution
(harness/ext/soc_borrow_cal.py): on 244 of 358 calendar store-days that move energy within the day, the within-day dip
exceeds the lowest start level the daily balance allows. Lithium 132 (largest shortfall 103 GWh), pumped storage 67,
iron-air 45. So calendar days are included.

What changed in bldBuildLP (FIXED.bldHourlySoc, default 1):
- Stress days (weight 1): a level per store per hour, s_<store>_<y>_<d>_<h> (hour 23 is the day's e_), moved each hour
  by that hour's charge and discharge (sh_ rows), between zero and capacity (shc_ rows). This replaces the daily soc_
  row, the half-full opening and send_ on those days. The first day of each window starts from the window's own closing
  level, a free variable: the window opens with no energy it did not store, and puts back what it takes. Battery
  reserve is limited by the level at the start and at the end of each hour.
- Calendar days (weight about 30): the day-to-day chain stays (soc_: e_d = e_prev + weight x net), and c_ (the
  cumulative movement within the day, free) holds the hourly level between zero and capacity on the first real day of
  the block (from e_prev) and on the last (from e_d - c_23). The days in between lie on a straight line between those
  two, so both ends cover them. Battery reserve uses the same two levels.
- Not as first asked, accepted by the user 8 Oct (stated in the page's methods notes from build `2026-10-08d`): each
  calendar day is not made to cycle. A cycle per representative day
  would stop storage moving energy from one day to the next, which is what the chain is for (iron-air and pumped
  storage across a still week). The rule above enforces the hourly limits without that loss.
- bldHourlySoc 2: stress days only. 0: the old daily balance; the LP text is byte-identical to 08b (central
  first-pass LP: same length, 33,676,729, and hash).

Central first-pass LP (harness/ext/hs_lp.js: Today 2026, demand +5% to 2040, coal minimum, pumped-storage energy, two
outage draws, half standard), native HiGHS, simplex; two solves at a time:

```
bldHourlySoc      LP MB   lines     solve s   objective R bn   calendar store-days borrowing
0 (old)           33.7    243,680   297       1,174.27         178 of 266 (lithium 115, up to 51.3 GWh; pumped storage 63)
2 stress days     36.5    263,330   475       1,174.32         180 of 262 (lithium 112, up to 53.6 GWh; pumped storage 68)
1 (default)       49.9    365,930   1,505     1,180.47         0 of 285
```

- Only storage rows differ between 0 and 1 (rbe, rbq, soc, send; added sh, shc, cr, cla, cua, clb, cub), plus the
  free bounds of the 17,280 c_ variables. On 1 the lowest stress-day hourly level is zero (-5e-12).
- The objective rises with each step, as it must when the LP loses energy it could borrow: stress days alone add
  R0.05bn, calendar days R6.15bn (0.52%). On 0, lithium also borrows on 2 of the 7 seed stress days of 2040 (up to
  32.7 GWh).
- Solve time: 1 takes 5.1 times as long as 0 on the first pass. The 07s central pass 2 took 7 h 58 min on simplex;
  scaled alike it would take about 40 h, longer than the container stays up. Interior point is being timed on the
  same LP; the runtime estimate and the solver choice follow. (9 Oct: on pass 2 neither finished in eight hours;
  entry above.)

Suite 804/809 plus eng5 6/6 without ESK19679.csv, identical to 08b check by check (validate_lp's LP grows from 7.56
to 11.42 million characters, 51/51). The central pathway, the no-gas test and the Fossil-free proposal are being rerun
on 08c; the runtime estimate and the solver question follow from the central run's pass 2.

### Why the engine sheds where the optimiser served in full: the LP's storage keeps one energy balance per day, 8 Oct 2026

07s central pathway (v_half_c1_p1_07s), model year 2040, the window where the engine shed most: weather year 2016,
outage draw 0 (seed 36225520), days 279-292 (LP stress period 1, days 1130-1143). Engine: pathcheck.js
WINDOW_DUMP=2016,36225520,279,14 on the same 2040 build (K=1 YEARS=2040). LP: the pass-2 LP regenerated with
DUMP_LP (hash a8a71a7a) and its cached solution. Hour by hour (scripts in the session scratchpad, to be committed with
the fix):

- The shed: day 290, hours 13-14, 6.6 and 5.1 GW (11.7 GWh). Engine lithium starts day 290 at 89 GWh, runs dry at hour
  13 and sheds; diesel, gas and coal are all at their limits. The LP starts the day at 75 GWh, discharges 117 GWh by
  hour 14 with no charging before hour 15, then charges 27, 19 and 9 GW in hours 15-17. Tracked by the hour, its
  lithium would sit about 42 GWh below zero at hour 14. Pumped storage does the same: empty in the engine from hour
  12, discharging at 2,724 MW in the LP in hours 13-14.
- Cause: in the LP each store has one energy balance per day (soc_<store>_<y>_<d>: end-of-day energy = previous day's
  + 0.88 x charge - discharge, summed over the day), with no hourly state of charge, so the order of hours within a day
  is not enforced: energy charged at 15:00 can serve 13:00. The engine tracks state of charge every hour.
- How widespread, 2040: within-day energy goes below zero on 106 of 203 stress days for lithium (deepest -113 GWh),
  10 for pumped storage (-7 GWh), 7 for iron-air (under 1 GWh). Typical case: the window's first day starts from a
  fixed 1.6 GWh of lithium and the morning peak (hours 7-8) is covered with energy stored from midday solar.
- Ruled out on this window: coal availability (identical, 7.3-7.4 GW, both at it in the shed hours), coal commitment
  and ramps (coal at availability in both), pumped-storage constants (2,724 MW and 60,000 MWh in both), imports and
  demand (the energy each model asks of dispatchable plant and storage agrees within 2% on days 289-291: 279 against
  274, 276 against 272, 176 against 172 GWh), reserves (engine requirement 2.3 GW against 16 GW available, so no
  shedding to hold reserve; the LP holds none on the battery).
- Secondary differences, not the cause here: the LP starts every window from fixed constants (lithium 1.6 GWh, half
  the existing 3.2 GWh with nothing for new build; pumped storage 30 GWh; iron-air 0), while the engine carries its own
  state in (lithium 137 GWh at day 279); and in the run-up days the LP cycles storage on the midday surplus and burns
  no coal, while the engine holds its storage near full and burns 73-194 GWh of coal a day.
- Calendar days use the same daily balance with day weights; not measured here.

### PROVISIONAL pending the storage fix - Stress windows planned to the standard under-build ninefold against the engine: 2038 planned 2.17 GWh, engine 19.4 GWh, 8 Oct 2026

Run v_half_c1_p1_08b_st, build `2026-10-08b`, bldStressTarget 1 (STRESS_TARGET=1), otherwise as the central pathway
(half standard, COMMIT=1, PSE=1, demand +5%, legislated carbon tax, stress loop per year, 14-day windows, three windows
per failing year per pass, simplex). Stopped after pass 3 (user decision, 8 Oct 2026; pass 4 was cut off by a
container restart). The LP's own expected shed against the engine's mean over the loop's 24 runs, GWh:

```
pass  windows  LP slack used           LP planned 2038   engine mean, failing years (limit about 2.0)
1     seed     none                    2.17              2030 2.8, 2034 11.9, 2036 18.5, 2038 27.3, 2040 27.8
2     33       2030: 1.20 GWh          2.17              2035 2.0, 2036 9.5, 2037 10.3, 2038 21.0, 2039 19.9, 2040 19.4
3     51       2030: 1.18 GWh          2.17              2034 7.1, 2036 8.2, 2037 8.1, 2038 19.4, 2039 18.5, 2040 17.3
```

- The target row binds in most years from 2030 (the LP plans to the target, as built), but the engine sheds about nine
  times more on the same build, and each pass of 18 windows moves the late years by about 1-2 GWh: at that pace the
  loop would not converge inside its 14 passes.
- Two causes: shed in runs and weeks with no window counts in the engine's mean but nowhere in the LP; and on the
  windows themselves the engine sheds more than the LP plans (as on the central build, below). VoLL x 365 hid both by
  serving every window in full.
- Solve times: pass 2 35 min, pass 3 1 h 50 min (the central pathway's pass 2, VoLL x 365, took 7 h 58 min).
- Decision (user, 8 Oct 2026): keep the VoLL x 365 method (option D); bldStressTarget stays in the code, off. The
  LP-engine divergence on a single window is investigated first (TODO 14bl).

### PROVISIONAL pending the storage fix - Build LP option: stress windows planned to the standard (bldStressTarget), and reported shed on an adaptive sample, 8 Oct 2026

Build `2026-10-08b` (user decision, TODO 14bk (a), option (i)). bldStressTarget 1: every operating cost on a stress day
(the loop's windows and the seed tail) is weighted as one run of the loop's check, 1 / (draws x weather years) = 1/24,
so shedding stays above diesel in the merit order; a row per year, tgt_<y>, holds expected unserved energy plus reserve
shortfall (calendar days at their weights, stress days at 1/24) to targetFrac x 0.002% of the LP's annual demand
(2030: 2,110 MWh at the half standard), with a slack tsl_<y> priced at VoLL x 365 per expected MWh. The loop logs, per
pass and year, the LP's expected shed, the target and the slack used (bldStressLog lpTarget). Default 0: the LP text is
byte-identical to 07u (checked on the central pathway's first-pass LP: same length and hash), so the central case and
the solve cache are untouched. Harness: STRESS_TARGET=1 in pathway_perfail.js.

pathcheck.js now samples reported shed adaptively (user, 8 Oct 2026): batches of 10 draws (120 runs) until the 95%
interval of the mean is within +/-20% of the target, at most 480 runs; each year reports nRuns, ci95Half and
ciPctOfTarget. K=<n> keeps a fixed sample. Checked on the 07s central pathway, 2039: 480 runs, mean 0.910 GWh, standard
error 0.173, interval +/-17% of the target, identical to the fixed 480-run check above.

Suite 804/809 plus eng5 6/6 without ESK19679.csv, unchanged.

### PROVISIONAL pending the storage fix - The 07s central pathway overshoots the half standard: pace caps and fully served stress windows, 8 Oct 2026

MEASURED 8 Oct 2026 (TODO 14bk (c)): 480 runs a year (12 weather years x 40 outage draws) on the final build, 2036-2040,
in both seed schemes (pathcheck.js K=40 YEARS=2036-2040; SEED_BASE=20260816 is the loop's own scheme, the default
71830529 the engine check's). Mean shed, GWh (standard error); target about 1.97:

```
year   loop 24 runs   loop seeds 480    engine 24 runs   engine seeds 480   pooled 960   share of target
2036   0.44           0.41 (0.08)       0.00             0.26 (0.06)        0.33         17%
2037   0.22           0.33 (0.07)       0.00             0.19 (0.06)        0.26         13%
2038   1.11           1.02 (0.18)       0.02             0.72 (0.14)        0.87         44%
2039   1.51           1.25 (0.21)       0.28             0.91 (0.17)        1.08         55%
2040   0.73           0.56 (0.14)       0.36             0.36 (0.10)        0.46         23%
```

- The overshoot is real but about half the target in the tightest year (2039, 55%, roughly 40-70% at 95%), not the
  factor of seven the 24-run engine check implied: its 24 runs were mild (0.28 in 2039 against 0.91 on 480 runs of
  the same seed base). The two 480-run sets differ by 1.2-1.4 standard errors each year; they lean the same way every
  year because the draws reuse seeds across model years. Worst single run 27-40 GWh in 2038-2040.
- Implication: two draws a year is too few to report shed against the target. Shed figures from pathcheck at K=2 in
  earlier entries are samples, not measurements.

The figures below were the first, 24-run reading and are superseded by the table above for 2036-2040.

Same run as below (v_half_c1_p1_07s). Engine check mean shed against the half-standard target (about 1.97 GWh):
0.00 GWh every year 2026-2037, then 0.02 (2038), 0.28 (2039), 0.26 (2040), so the worst year sits at 14% of the
target. The loop's own pass-2 check, on its own outage seeds, puts 2038-2040 at 1.11, 1.51 and 0.73 GWh (56-76%):
two draws a year is a small sample and the mean is set by rare draws.

What drives it, from the cached pass-2 solution (lpcache a8a71a7a..., reduced costs on the build variables):
- Pace caps, 2026-2030: wind at its 2.5 GW/yr cap with reduced cost about -R160m per MW, solar on its cap path
  (-R118m per MW to 2030, binding to 2034), new gas at 0 before 2030 and at its 1.2 GW cap in 2030 (-R649m per MW),
  iron-air at its 150 MW cap 2029-2030, lithium at 2 GW/yr in eleven of fifteen years (small reduced costs).
- CORRECTED 8 Oct 2026 (user question): this entry first said the capped early build was set by energy value, not the
  reliability target. Wrong. Splitting each reduced cost into the rows it enters (pass-2 LP regenerated with
  DUMP_LP, hash a8a71a7a matching the cached solution; each hour's price matched to the cost of the resource that sets
  it; parts sum exactly to the reported reduced cost):

```
value per MW of the 2030 build                       gas      wind     solar
stress hours priced by shedding (VoLL x 365)         66%      60%      27%
stress hours, scarcity carried by storage/energy     22%      32%      68%
hourly reserve rows (stress shortfall at VoLL x 365) 14%      -1%      -2%
fuel, VOM and carbon, all hours                      0.6%     3.7%     2.3%
other                                                -2%       5%       5%
total value, R m per MW (discounted)                 670      184      126
share from the year 2030 itself                      97%      91%      93%
```

  The 2030 stress windows drive it: the caps stop the build covering them (28.1 GWh still shed there), and with that
  shortage priced at VoLL x 365 every capped resource in 2026-2030 is worth far more than it costs. The zero shed in
  other years is the by-product of building at full pace for 2030's worst windows. The planning-margin row (res_)
  does not bind.
- Stress windows served in full: pass 1 added 33 windows (the worst 14 days of failing draws, 55-102 GWh shed each).
  With shedding there priced at VoLL x 365, the pass-2 LP leaves no unserved energy in any stress hour except in 2030
  (28.1 GWh in 9 hours). Serving the worst week of each failing draw is a far stricter test than a mean over 24 runs.
- On those same windows the LP is more optimistic than the engine in 2036-2040: re-dispatched on the final build the
  engine sheds in 6 to 13 windows a year, up to 11.7 GWh in one window (2040), where the LP shed none. 2030-2035 agree
  (no shed). This remaining optimiser-engine gap offsets part of the overshoot but not much of it.
- Caveat: the cost of the overshoot needs a run (TODO 14bk); probability-weighting the stress windows, option (a),
  bears directly on the 2030 windows that drive the capped build.

### PROVISIONAL pending the storage fix - Central pathway on the final costs: new gas 3.22 -> 1.45 GW, no LNG window above one cargo, 8 Oct 2026

Pathway v_half_c1_p1_07s, build `2026-10-07s` (worktree frozen at 92b5d1a), against v_half_c1_p1 on `2026-10-07c`: half
standard (TF=0.5), coal commitment on (COMMIT=1), pumped-storage energy on (PSE=1), demand +5% to 2040, legislated
carbon tax path, stress loop per year, SOLVER=native simplex, TL 28800. Converged: pass 1 added 33 stress windows,
pass 2 none; verdict adequate. Engine check (pathcheck, LNG=1): twelve weather years x two outage draws. Final
central costs: wind BW6 R28,462/kW on the modern-turbine profile at 1.064, lithium BW3 aged R13,699/kW. Each run
costed at its own prices.

```
                              07c (old costs)              07s (final costs)
new gas GW, 2030/35/40        1.20 / 3.22 / 3.22           1.20 / 1.45 / 1.45
gas CF and hours, 2030        0.1%, 6 h                    0.0%, 2 h
gas CF and hours, 2033        2.6%, 372 h                  3.7%, 363 h
gas CF and hours, 2035        6.5%, 844 h                  7.3%, 684 h
gas CF and hours, 2038        16.2%, 1,767 h               16.2%, 1,482 h
gas CF and hours, 2040        20.6%, 2,147 h               19.6%, 1,773 h
coal retired by 2040          28.9 GW                      26.2 GW
2040 wind / solar GW          17.5 / 49.6                  17.1 / 43.3
2040 lithium GW               27.4                         23.6
2040 iron-air / vanadium GW   0.75 / 1.25                  0.30 / 0
2040 pumped hydro GW          0                            0
CO2 2026-2040                 1,212 Mt                     1,195 Mt
system cost 2026-2040         R3,981bn                     R3,929bn
worst-year mean shed          0.92 GWh                     0.28 GWh (24 runs; 1.08 on 960 runs, see above)
LNG check by year: stress windows binding the year above one cargo, of those tested (worst 14 days
of the year's 24 runs, in cargoes):
  2030                        0 of 3 (0.03)                0 of 3 (0.02)
  2033                        0 of 12 (0.39)               0 of 12 (0.35)
  2035                        0 of 18 (0.76)               0 of 18 (0.52)
  2038                        8 of 27 (1.23)               0 of 27 (0.56)
  2040                        10 of 33 (1.23)              0 of 33 (0.57)
```

- Solver: simplex solved pass 2 in 7 h 58 min; interior point (HIGHS_SOLVER=ipm) on the same LP did not finish in 8 h.
  On the regional LP (07u, Deep decarbonisation inputs, 2040) interior point solved in 26 min where simplex did not
  finish in 4 h. National runs stay on simplex, regional on interior point (user rule, 8 Oct 2026). The objective
  check across the two methods is still to do, on a solve both can finish.
- Caveat: the gas figures are the half-standard pathway's; the 07c column predates wind and battery bid costs.

### Preset re-search on the final central costs: Deep decarbonisation R289.7bn from two starts within 0.7%; Fossil-free R348.9bn from one so far, 7-8 Oct 2026

Build `2026-10-07s` engine (07t and 07u change only the build LPs), harness/ext/preset_search.js, EXT=1, the 4 Oct
method: target half of 0.002% of served energy, fixed at the start; steps 2, 1, 0.5 GW (iron-air 0.5, 0.25, 0.125;
offshore 1, 0.5, 0.25); rooftop fixed; lithium at 12 h; offshore capped at 1 GW (2035) and 5 GW (2040). Costs: wind
BW6 R28,462/kW on the modern-turbine profile at 1.064, lithium BW3 aged R13,699/kW. Deep scored on twelve weather
years x 2 outage draws, confirmed on 40 draws (480 runs); Fossil-free on twelve years x 1 (no coal). Start A: the
current preset. Start B: the build optimiser's proposal at half the standard (HORIZON 2035, GAS_CAP 0, COAL_DECOM
27000, COMMIT 1, PSE 1; vanadium 1.75 GW and CCGT 0 held from it). Outputs: harness/ext/search_*.json.

```
                      wind    solar   Li 12h  iron-air  offshore  vanadium   R bn/yr   shed GWh (target)
Deep, preset as is    32.5    29.5    19.0    1.125     0         -          325.2     0.00
Deep, A final         32.5    27.5     9.0    1.5       0         -          289.7     1.98 (2.01), 480 runs
Deep, B start         23.6    34.5    14.0    1.0       0.5       1.75       301.3     1.91
Deep, B final         30.6    25.5     7.0    2.0       0.5       1.75       291.8     1.94 (2.07), 480 runs
FF, preset as is      35      45      32      2.25      5         -          386.5     0.00
FF, A final           35      51      22      4.25      1         -          348.9     1.84 (2.01), 12 runs
```

- Deep: the two starts end on different builds, R2.1bn (0.7%) apart; both meet the stricter target (2.01 GWh). The
  cheapest found by the stated method is A, R289.7bn: lithium 19 -> 9 GW at 12 h, iron-air 1.125 -> 1.5 GW.
- Method extension, 7 Oct 2026: A missed the target on the 480-run confirmation (2.56 GWh) and no single smallest
  top-up met it (2.07 to 2.42); top-up rounds now repeat from the most cost-effective top-up until one does (round 2:
  solar +0.5 GW after iron-air +0.125 GW). B needed none.
- Fossil-free B: the proposal (HORIZON 2040, GAS_CAP 0, COAL_DECOM 42000, DSL_DECOM 3400) was infeasible on 07s
  (fixed in 07t), then timed out at 4 h and was cut off twice by container restarts and memory; still to run.
- Caveat: the targets differ slightly by start (fixed at each start's served energy); presets are not yet changed.

### Regional optimiser: new wind on the modern-turbine profile, matching its capex, 7 Oct 2026

Build `2026-10-07u` (TODO 14bh). Since 07r the regional LP priced new wind at the modern capex (R28,463/kW) on the
regional file's V90 output (nodal/profiles_regional.json). Every wind MW in that LP is new build, so its output now
takes the modern profile: a per-region map from raw V90 to V162 output (build_wind_modern.py, the same fit as the national
profile; profiles_wind_modern_map.json regional_map) times WIND_NEW_CORR. Regional new-wind capacity factor, Deep
decarbonisation 2035 inputs, V90 -> modern at 1.064: Eastern Cape 36.7 -> 46.3%, Hydra Central 42.5 -> 53.6%,
KwaZulu-Natal 21.6 -> 29.3%, Limpopo 23.5 -> 32.7% (all ten in the run log). The tracking-solar option now raises an
error in the regional LP (no regional tracking profile). A guard as in the national LP keeps opts.state and the page
state on one cost case. Suite 804/809 plus eng5 6/6, unchanged.

- Found on the way (TODO 14bi): profiles_regional.json is raw V90 output (maximum 0.991; no scaling recorded), while
  the national file carries the fleet factor 1.0753. With modern wind off, the regional LP's wind is on a lower basis
  than the national model's.

### Build LP: coal-limit rounding made retiring all coal infeasible; fixed, 7 Oct 2026

Build `2026-10-07t`. The Fossil-free 2040 optimiser proposal (HORIZON=2040, GAS_CAP=0, COAL_DECOM=42000, DSL_DECOM=3400,
COMMIT=1, PSE=1, TF=0.5) solved its first pass and returned Infeasible on the second. IIS: one row, cmax_2040_1190_0
(cm + 0.5092 rc_2040 <= 10,614.9) against rc_2040 >= 20,847.5. The coefficient was written to 4 decimals and the
right-hand side to 1, so the coal capacity each cmax row implied ranged 20,841 to 20,847.6 MW in 2040; forcing all coal
out then needed negative commitment. The right-hand side is now written from the rounded coefficient and rounded up to
0.1 MW. Affects only runs that force all coal out; suite unchanged at 804/809 (lp 51/51, solve 8/8). The 07s national
runs never bind rc_ at its bound.

### PROVISIONAL - With gas, 100-hour iron-air removes July gas on the modern-turbine profile (was: barely moves it); depends on the new-wind correction, 7 Oct 2026

Build `2026-10-07s`, default profile set, the validate_findings LDES scenario: slider defaults; Seriti build (20 GW wind,
25 GW solar, 20 GW lithium at 10 h, 32 GW coal retired, EAF 70%) plus 25 GW new CCGT; then 20 GW of iron-air at 100 h.
Iron-air charging tagged by source on an instrumented copy of 07s (scratch only, not committed); the tagged total
equals the engine's own tierChg.fe in every case (4,970, 6,256 and 6,265 GWh).

```
GWh                      Jan   Feb   Mar   Apr   May   Jun   Jul   Aug   Sep   Oct   Nov   Dec    year
modern off    charge       0     0     0     0     0     0    78   448   110  2113  1654   567    4970
              disch.       0    48  1315   637     0     0     9   228     0     0     0     0    2237
              gas, no      0    57  1316  1799  1166   757   846  1256     0     0     0     0    7197
              gas, Fe      0     0     0  1166  1166   755   832  1023     0     0     0     0    4942
modern 1.00   charge       0     0     0     0    87   358   662   705   885  2894   665     0    6256
              disch.       0     0   573  1112   315    41   340   434     0     0     0     0    2815
              gas, no      0     0   581  1122   524   265   524   887     0     0     0     0    3903
              gas, Fe      0     0     0     0   214   224   184   438     0     0     0     0    1060
modern 1.064  charge       0     0     0     0   242   543   926   811  1177  2566     0     0    6265
              disch.       0     0   336   857   341   151   426   708     0     0     0     0    2819
              gas, no      0     0   346   869   338   151   425   713     0     0     0     0    2842
              gas, Fe      0     0     0     0     0     0     0     0     0     0     0     0       0
```

- July gas with iron-air: 846 -> 832 GWh on the current-turbine profile, 524 -> 184 at 1.00, 425 -> 0 at 1.064. Gas
  for the year: 7,197 -> 4,942, 3,903 -> 1,060, 2,842 -> 0 GWh. The finding reverses at both correction cases.
- Source of iron-air charge: renewable surplus 96-97%, forced surplus 2-3%, coal headroom 1%, at all three. In the
  surplus hours that fill it, generation is 48-56% solar, 30-39% wind, 5% coal.
- What changes: on the current profile iron-air fills only from July to December and empties in February to April.
  On the modern profile it also fills from May to August, 2.5 TWh at 1.064 against 0.5 TWh, on winter wind
  surplus, and discharges in the same months.
- Caveats: one weather year (the default profile); the year is cyclic (the second pass starts from the first pass's
  year-end state of charge, so the February-April discharge is last spring's surplus); the 1.064 correction rests on two
  Eastern Cape farms (TODO 14bf). Provisional until re-measured on the twelve weather years.

### New wind on the modern-turbine profile at 1.064: six suite results move, a pinned corner re-pinned, 7 Oct 2026

Build `2026-10-07s`: nodal/profiles_wind_modern.json stored uncorrected; new wind's output x 1.064 (bldWindCorr 'central';
'low' 1.00), clipped at 1, in engine and LP (WIND_NEW_CORR). Fixes two 07r defects found by the suite: the national map
was built only with the weather years, so any dispatch with new wind threw before they loaded (invariants, response and
outputs could not run); and the switch's fallback read 0 against a default of 1. ESK19679.csv absent.

```
suite                       07o          07r (before)    07s
passed                      807 of 809   718 of 760      801 of 809 (799 before the map licence and the re-pin below)
eng5                        6/6        6/6            6/6
```

Moved by the profile (each check returns to its 07o value with bldWindModern 0, measured on a copy of 07s):

```
check                                        modern off      modern on (1.064)    band
CSIR 2030 coal share                         50.5%           46.1%                55% +/-6
CSIR 2030 renewable share                    43.8%           48.1%                40% +/-8
EDMSA Scenario A CO2 2035                    88.4 Mt         76.8 Mt              124 +/-22 (already failing)
EDMSA Scenario A wind 2035                   within band     85.2 TWh             64 +/-12
wind capture at 110 GW, no storage           86%             79%                  85-115%
July gas with 20 GW iron-air, with gas       846 -> 832      425 -> 0 GWh         < 2% change
preset curtailment, default profile          in band         Deep 71.6, FF 124.4  52.7, 96.3 +/-15%
coal-curtailment corner, curtailFuelCost     R14.10bn        R16.67bn             re-pinned 13.9 -> 16.7
```

- Existing farms keep the old profile: Today 2026 and '2025, as modelled' give identical results on 07o and 07s, every
  engine output compared on the default profile and all twelve weather years (26 runs, no difference). Both carry no
  new wind, so the modern path is never entered.
- Presets on the default profile (Deep decarbonisation 2035): wind 101.2 TWh at 1.064 against 98.2 at 1.00; system cost
  R321.1bn against R322.2bn; no unserved energy in either.
- Decided 7 Oct (user): CSIR and EDMSA builds run on the current-turbine profile, their own basis (validate_external,
  bldWindModern 0); the modern-profile values above are kept as a sensitivity and printed by the harness, not checked.
  The two findings are recorded as updated, not re-pinned; the preset curtailment pin is re-pinned after the re-search. The corner is a
  pin whose purpose (a non-zero term) still holds; available wind there 200.7 -> 247.3 TWh, curtailment 373.4 -> 433.4.
- Caveat: one sample year (2019) sets the modern mapping; the preset searches restart on this build (TODO 14ay).

Published findings updated (user, 7 Oct 2026: recorded here, checks not re-pinned; reason for both: new wind on the
modern-turbine profile at 1.064, build 07s, against the current-turbine profile, 07o):

- Wind holds its capture rate, solar does not (validate_findings 3). Scenario: 50 GW wind, 60 GW solar in total, no
  storage, default profile. Wind capture 86% -> 79% (check: 85-115%); solar 2.6% -> 0.4%. Wind now loses some value at
  this build; the asymmetry with solar stands.
- With gas, 100-hour iron-air barely moves July (validate_findings, LDES scope; RESULTS "Long-duration storage in a
  system that has gas"). Scenario: Seriti build (20 GW wind, 25 GW solar, 20 GW lithium at 10 h, 32 GW coal retired,
  EAF 70%) plus 25 GW new CCGT, then 20 GW of 100-hour iron-air. July gas 846 -> 832 GWh (-1.7%) becomes 425 -> 0 GWh
  (-100%; check: under 2%). On the modern profile July gas halves before iron-air, and iron-air then removes the rest:
  the finding reverses in this scenario.

External comparisons, each further from its benchmark (modern off -> 1.00 -> 1.064):

```
check                         scenario                                       off     1.00    1.064   published
CSIR 2030 coal share          20 GW wind, 15 GW solar, 285 TWh, EAF 65%      50.5%   47.5%   46.1%   55% +/-6
CSIR 2030 renewable share     same                                           43.8%   46.8%   48.1%   40% +/-8
EDMSA Scenario A CO2 2035     24.6 GW wind, 28 GW solar, 8 GW 4 h, 4 GW CCGT 88.4    80.1    76.8    124 +/-22 Mt
EDMSA Scenario A wind 2035    same                                           72.1    81.5    85.2    64 +/-12 TWh
```

### Modern-turbine wind against developer-stated output: the factor that matches is 1.063 to 1.065, not the fleet's 1.0753, 7 Oct 2026

Build `2026-10-07r` data, check_wind_farms.py (output ninja_farm_check.json): Vestas V162 5600 at 120 m, Renewables.ninja
MERRA-2, local_time=true, at each farm's REEA location, weather years 2016, 2019, 2021, 2023, capacity factor clipped at 1.
Stated output is the developer's annual figure (net, P50 by convention), treated as an expected value, possibly optimistic.

```
                 raw CF    x 1.0753    stated    factor matching stated
Impofu (330 MW)  41.1%     44.0%       43.6%     1.0645
San Kraal (140)  47.4%     50.7%       50.2%     1.0628
Phezukomoya      47.5%     50.9%       none      -
Umsobomvu        48.0%     51.3%       none      -
```

- Uncorrected, the modern profile sits about 6% below both stated figures; with the fleet's 1.0753 about 1% above.
- The two farms agree on the matching factor to 0.2%. Phezukomoya and Umsobomvu sit within 0.6 points of their
  neighbour San Kraal, so the nearby sites are consistent.
- Weather spread: Impofu 39.2% to 43.3% raw across the four years, so one year's figure is not a fair test.
- Caveat: two farms with stated output, both Eastern Cape; stated figures may be optimistic, which would put the
  right factor lower. Decided 7 Oct (user): 1.064 central, 1.00 low; re-check when measured output exists (TODO 14bf).

### PROVISIONAL pending the storage fix - IRP 2025's own cost set on the central pathway: about the same gas build, a fifth of its running, 10 GW more coal kept, 7 Oct 2026

Pathway v_half_c1_p1_costirp against v_half_c1_p1, both build `2026-10-07c` code: half standard, coal commitment on,
pumped-storage energy on, demand +5% to 2040, legislated carbon tax path, stress loop per year. COSTSET=irp2025: the IRP
2025 assumptions workbook's capex paths (wind, solar, lithium, CCGT, offshore), CCGT fuel, O&M and heat rate, x 1.068
to 2026 rands (harness/pathway/costset_irp2025.json). Engine check: twelve weather years x two outage draws, LNG on.
Each run is costed at its own prices, so the cost totals do not rank the two.

```
                         central (07c costs)        IRP cost set
new gas GW 2030/35/40    1.20 / 3.22 / 3.22         1.20 / 3.87 / 3.87
gas CF 2035, 2040        6.5%, 20.6%                2.6%, 3.2%
gas hours 2035, 2040     844, 2,147                 399, 395
coal retired by 2040     28.9 GW                    18.8 GW
2040 wind/solar/Li GW    17.5 / 49.6 / 27.4         14.2 / 10.2 / 7.3
CO2 2026-2040            1,212 Mt                   1,785 Mt
system cost 2026-2040    R3,981bn                   R3,395bn
LNG, worst 14-day lull   1.23 cargoes (2038-40)     0.97 cargoes
```

- The IRP cost set prices lithium at R24,362/kW at 4 h in 2026, about 78% above the central lithium cost now in use
  (BESIPPPP bid window 3 aged to January 2026, R13,699/kW) and three times the 07c figure (R8,105). Its solar
  (R15,734) and wind (R27,446) are also above the 07c figures; its CCGT (R18,610) is about half.
- Caveat: the central column is the 07c baseline, not today's central costs (wind on BW6 bids, lithium on BW3 aged);
  the comparison is re-run on those (TODO 14bd).

### Wind and lithium on South African bid data: Deep decarbonisation's new-build capital R0.936 to R1.205/kWh, 7 Oct 2026

Build `2026-10-07q`. Wind central on BW6 compliant bids (R28,463/kW, was R21,000 unsourced; IRENA 2024 global onshore
USD 1,041/kW, R17,180) and lithium on BW3 aged to January 2026 (R13,699/kW, was R8,105). Deep decarbonisation 2035,
retail year 2035, 40% margin, vintage 2030.5: new-build capital R0.936 -> R1.205/kWh; wind alone gives R1.045 (+0.109),
the battery the rest (+0.160). The preset builds are being re-searched on these costs (TODO 14ay).

### Lithium on BESIPPPP bid window 3, aged to January 2026: Deep decarbonisation's new-build capital R0.936 to R1.096/kWh, 7 Oct 2026

Superseded the same day by the aged central (user decision): BW3's equipment share at the bid date (BNEF global
turnkey interpolated to May 2025, USD 143/kWh at R16.50, 61% of the bid) aged to January 2026 at BNEF's 2025 rate
(x 0.795), the rest held at CPI: R3,425/kWh, R13,699/kW at 4 h (R3,373 at the May 2025 rate of about R18/USD).
Build `2026-10-07p`: Deep decarbonisation 2035 new-build capital R1.096/kWh (central), R1.160 (high, BW3 as bid),
R0.936 (low, R2,026/kWh). The entry below records the as-bid figure.

### Lithium on BESIPPPP bid window 3 as bid raises Deep decarbonisation's new-build capital from R0.936 to R1.160/kWh, 7 Oct 2026

Build `2026-10-07o` (lithium at BESIPPPP bid window 3, R15,962/kW at 4 h, inclusions not stated) against the
same build with the previous R8,105/kW. Deep decarbonisation 2035 preset, retail year 2035, panel at 40%
margin, vintage 2030.5 (validate_consistency.js, 'new-build capital matches the hand computation').

- New-build capital per kWh sold: R0.936 -> R1.160 (+24%). The battery input is the whole change.
- The preset carries 19 GW of lithium at 12 h, so it is the most battery-heavy preset and moves most.
- The effect on the central pathway's build (v_half_c1_p1_battbw3) is queued; not yet measured.
- Caveat: the BW3 figure is a project value whose inclusions are not published.

### PROVISIONAL pending the storage fix - Existing diesel peakers run almost never from 2030 on the half-standard pathway, 7 Oct 2026

Pathway pathway_v_half_c1_p1.json (build `2026-10-07c`: half standard, coal commitment on, pumped-storage
energy on, demand +5% to 2040, legislated carbon tax path), dispatched by the engine in each year, twelve
weather years (2014-2025) x two outage draws (seed base 71830529). Fleet 3,400 MW in every year: no
retirement dates were applied before build 07h. Script: peakers.js (scratch), as pathcheck.js.

```
year   TWh     mean hours   worst-draw hours   peak MW
2026   0.063   94           126                2,492
2028   0.002   3            19                 592
2030   0       0            0                  0
2032   0       0            0                  0
2034   0.001   0            4                  478
2035   0.001   0            4                  568
2036   0.001   0            2                  429
2038   0       0            2                  283
2040   0.001   0            4                  283
```

- Hours are fleet hours with output above 1 MW, mean over the 24 runs.
- The fleet is still counted in every adequacy test and pays fixed O&M (R360/kW-yr, about R1.2bn a year).
- IRP 2025 (3.2.1.2.2, p.13) retires Acacia and Port Rex in 2025-2026 and Ankerlig and Gourikwa in the
  mid-2040s; the retirement option (bldPeakerRet, build 07h) tests what replacing them costs.

### IRP presets rebuilt from Table 1; the 2030 presets had 300 MW of storage, not 3,724, 7 Oct 2026

Build `2026-10-07f` against `2026-10-07e`. Each preset at its own defaults, default weather year,
default outage seed, annual gas floor (51% on 6 GW). Source: public_data/irp2025_extract.csv (IRP 2025
Table 1, cumulative new build).

```
                                  storage MW     gas TWh       unserved GWh   CO2 Mt         R/MWh
IRP's 2030 targets                300 -> 3,724   26.67 26.73   0.95 0         126.9 127.6    1,278.5 1,288.4
IRP's 2030 targets, grid delayed  300 -> 3,724   26.73 26.78   1.39 0         147.9 149.0    1,259.7 1,267.4
IRP path 2035                     6,100 -> 4,724 13.31 14.22   0 0            60.8 64.0      1,465.6 1,404.7
```

- 2030 presets: wind 7,341 and solar 10,313 MW (were 7,340 and 10,300); grid delayed 0.6 of each,
  4,405 and 6,188. The added storage takes unserved energy to zero and costs about R8-10/MWh.
- IRP path 2035 is now Table 1 to 2035: wind 21,041, solar 17,513, rooftop 9,000, storage 4,724,
  gas 10,750 MW (was an interpolation: 22.2, 18.9, 10.8, 6.1 and 11.6 GW). Curtailment 34.3 to 28.2
  TWh, gas floor unmet 13.49 to 12.58 TWh, gas running hours 4,765 to 4,991.
- Caveat: one weather year, one outage draw. Earlier entries that used these presets are listed in
  the CORRECTED note above "A coal operating floor does not reproduce 2025's curtailment either".

### The IRP gas floor is now an annual minimum; IRP path 2035 still falls 13.5 TWh short of it, 6 Oct 2026

Build `2026-10-06g` against `2026-10-06f`. The IRP 2025 rule is a 51% minimum annual capacity factor
on 6 GW of CCGT, 2030 to 2040, not an hourly must-run. ccgtForceLoad now applies it as an annual
minimum (simulateGasAnnualFloor):
- Gas first dispatches on merit.
- If the first 6 GW produce less than 51% of a year's energy, the floor is set at 6 GW in the highest
  net-load hours (netLoadPre), enough to cover the gap, and the year is re-run.
- The loop repeats until output is within 0.5% of the target, or after at most four re-runs.
The hourly version is kept as a sensitivity (FIXED ccgtForceHourly 1, not on the panel).

Correction to the 06f entry below: ccgtFloorUnmetMWh left out surplus hours, where the engine skips
the floor. It now counts them. Under the hourly rule, IRP path 2035's shortfall was 15.6 TWh at 06f,
not 6.4.

Each preset at its own settings, synthetic-normal weather year, seeded outage draw, simulate() once
(scratchpad preset_gas.js). Target 26.8 TWh (51% x 6 GW x 8,760 h).

```
preset                            rule     gas TWh  floor unmet TWh  gas hours  CO2 Mt  avgCost R/MWh
IRP's 2030 targets                annual   26.67    0.13             5,216      126.9   1278.5
                                  hourly   24.81    2.66             8,465      127.9   1266.6
IRP's 2030 targets, grid delayed  annual   26.73    0.07             4,891      147.9   1259.7
                                  hourly   27.90    0.04             8,760      147.2   1267.4
IRP path 2035 (11.6 GW gas)       annual   13.31    13.49            4,765      60.8    1465.6
                                  hourly   11.24    15.57            4,814      60.8    1446.2
```

- On the 2030 presets the annual rule meets the target, with gas running in 4,900 to 5,200 hours
  rather than nearly every hour.
- IRP path 2035 cannot meet it: the floor is set in every hour, yet gas runs in only 4,765 because the
  rest are surplus hours.
- The hourly sensitivity reproduces 06f exactly, apart from the corrected unmet figure.
- Unserved energy is the same under both rules.
- Caveat: one weather year. The annual rule runs the year two to five times, about 2 to 4 s in the
  browser when the toggle is on.

### Shiftable load is non-residential, the VPP is households, and the shared cap is reported, 6 Oct 2026

Build `2026-10-06g`. The two controls drew on the same loads: shiftable load's note listed water
heating and EV charging, which are the VPP pool's geysers and home charging. They are now exclusive
by definition:
- Shiftable load: industrial, commercial, agricultural and municipal.
- VPP: households.
Both still move load out of the six highest net-load hours under one cap of 45% of the hour.
simulate() now returns shiftCapH, shiftCappedMWh and shiftMovedMWh, and the VPP readout says when the
cap binds.
- Today 2026 with shiftable 20% and a 12 GW pool fully enrolled: the cap binds in 2,190 hours (every
  peak hour) and 11.8 TWh a year cannot be moved.
- Shiftable 3% alone: the cap never binds.

The old note said load moves into "the six lowest" hours. The engine spreads it over up to twelve, and
the note now says so.

Size, in the note:
- 1% of each peak hour is about 270 MW. That is the mean demand in each day's six highest hours,
  26.6 GW on the 2026 profile.
- 1% moves 0.58 TWh a year (simulate, shiftMovedMWh; linear to at least 4%).
- The IEA (2026) puts industry's technical potential for load shifting in South Africa at about
  1 TWh a year (verified, printed p.25), so about 1.7% on this slider.
- The 1.5 GW the Demand Management Programme delivers is peak shaving, mainly by large industrial
  users (p.24-25). That is the interruptible-load control, not this one.
- NREL and CSIR (2024) quote Eskom Transmission at about 4 GW of demand response and load shifting
  combined, still unverified. That makes about 15% an outer ceiling.

### Control panel regrouped into six sections, 6 Oct 2026

Build `2026-10-06g`. The sections are now Demand; Supply and build; Storage and flexibility; Grid and
connections; Prices and markets; Retail and household bill. The build cost (LCOE) settings are a
subgroup of Supply and build. Cause of the old mix: capacity payments, Koeberg, imports and exports
sat after the Voltage settings subgroup inside Household bill.

No harness asserts group names or order, saved links key on control ids, and control_inventory.json
lists ids only. Prices and markets starts closed, as Policy and prices did.

Checked before labelling (scratchpad ctl_probe.js; 10 GW wind, 10 GW solar, 3 GW batteries, 6 GW coal
retired):
- Grid headroom beyond the plan feeds only the build optimiser, and is labelled so.
- Grid-enhancing technologies feed only the Where To Build siting panel, and are labelled so.
- The grid expansion cost and repurposed coal connections are not optimiser-only: they move the engine's
  own system cost once new wind and solar exist (avgCost R1,112 to R1,196/MWh across txRPerKWyr 0 to
  1,200; R1,151 to R1,140 with repurpose on).
- validate_response listed those two as build-only, so it never saw them. They now carry a sweep
  context instead.

response_matrix.json was regenerated with --write-baseline. Before regenerating, the only drift was
two cells, txRPerKWyr -> avgCost and repurpose -> avgCost, both from inert to responsive and both
explained by the new context. The falsy-zero notes are the same as at 06f. Suite before (06f on
main): 805/807. After (06g): 807/809. The two added checks are the two newly swept controls. The
failures are the same two as before (weather 63/64 without ESK19679.csv; EDMSA Scenario A CO2 2035).
eng5 6/6.

### The IRP gas floor is now 51% on 6 GW, 2030-2040; IRP path 2035 unmet floor falls from 20.2 to 6.4 TWh, 6 Oct 2026

CORRECTED 6 Oct 2026, build 06g: the floor-unmet column below left out surplus hours. Under the hourly
rule IRP path 2035 was 15.6 TWh short at 06f, not 6.4. See the entry above.

Build `2026-10-06f` against `2026-10-06a`. ccgtForceLoad now follows the IRP 2025 reference case
(Government Gazette 53596, 28 Oct 2025, p.34): a 51% minimum load factor on 6 GW of CCGT, scenario
years 2030 to 2040 (FIXED ccgtForceLoadPct, ccgtForceLoadMW, ccgtForceFromYear, ccgtForceToYear).
Before: 50% on all new CCGT in any year. Still an hourly must-run floor, which is stricter than the
IRP's annual factor. Each preset at its own settings, synthetic-normal weather year, seeded outage
draw, simulate() once (scratchpad preset_gas.js):

```
preset                              year  CCGT    gas TWh      floor unmet TWh   CO2 Mt        avgCost R/MWh
                                                  06a   06f    06a    06f        06a    06f    06a     06f
IRP's 2030 targets                  2030  6 GW    24.5  24.8   2.46   2.64       128.0  127.9  1264.6  1266.6
IRP's 2030 targets, grid delayed    2030  6 GW    27.4  27.9   0.03   0.04       147.5  147.2  1264.5  1267.4
IRP path 2035                       2035  11.6 GW 13.3  11.2   20.2   6.4        60.8   60.8   1465.4  1446.2
```

The 2030 presets move by under 2%. IRP path 2035 moves because only 6 of its 11.6 GW now carry the
floor. Unserved energy unchanged in all three. The toggle does nothing before 2030 or after 2040,
so at the Today 2026 default it has no effect; validate_response now sweeps it at scenario year 2030.

### PROVISIONAL pending the storage fix - External test, Kerwin et al. 2026, part 2: our optimiser on their inputs builds more solar and storage, less gas, 6 Oct 2026

Builds on `2026-10-05j`; pathchecks on `2026-10-06a` (only pumped hydro's default and the stamp differ;
pumped hydro is off). harness/ext/kerwin_part2.js (LOOP=0 and LOOP=1, SOLVER=native, TL=3600),
outputs kerwin_part2_loop0/1.json and pathcheck_kerwin_loop0/1.json. Horizon 2040 (2050 dropped by
agreement: the optimiser's horizon ends at 2040).

Their inputs: demand to 247.8 TWh in 2040 at one growth rate (demandGrowthPct 23.54; their path is 0.8%
a year to 2030 then 1.8%, so 2030 is about 1.7% high); capex, fixed O&M and lives for wind, utility PV,
rooftop and CCGT (A5 at R16.50/USD; 2026 interpolated, decline from 2030-2040: wind R17,097/kW falling
0.24% a year, PV R13,451 falling 1.57%, rooftop R21,734 falling 1.24%, CCGT R19,929 falling 0.73%);
residual coal (A8, interpolated: 33.3 GW 2026, 30.3 2030, 21.7 2040, replacing bldCoalMW); wind and PV
build caps (A13: 1.6 and 1.0 GW a year to 2030, 2.0 and 2.0 after). Ours, by the user's choice: 8% real
discount rate, legislated carbon tax path, battery cost, life and duration (BATT_POWER_SHARE is a
constant, so their battery power cost cannot be set alone), coal fuel cost, existing non-coal fleet, gas
no earlier than 2030. Rooftop chosen under our rate cap. Vanadium, iron-air, offshore and pumped hydro
off. Not representable: nuclear, biomass, small hydro, CSP and open-cycle gas as separate builds; their
battery energy cost and duration; their eight time slices. Loop settings as pathway_op: windows on
every year (windowLeadYears 14), 14-day, draws 2, testEvery 2, up to 14 passes.

New build from 2026 (theirs: baseline from Figure C8 less their 2024-25 build):

                         2030                                  2040
                 theirs   ours no loop  ours loop      theirs   ours no loop  ours loop
wind GW          8.0      6.4           8.0            28.0     22.4          28.0
utility PV GW    0        5.0           5.0            11.0     25.0          25.0
rooftop GW       0        4.0           8.0            0        4.0           8.0
battery GW       0        8.7 (30.6 GWh) 8.0 (32.9)    1.4      12.4 (74.5)   14.6 (85.2)
gas GW           0.7      0.8           1.2            6.8      4.9           3.9
coal GW (all)    30.3     30.3          30.3           21.7     21.7          21.7

Twelve weather years x two independent draws (SEED_BASE 71830529), against the 0.002% standard:
no loop fails 2039 (6.12 against 4.97 GWh) and 2040 (9.57 against 5.07); the loop build (ten passes,
nine windows, all for 2040, no margin) meets every year, worst 0.85 of the standard. Over 2026-2040:
R3,544bn and 1,739 Mt without the loop; R3,626bn (+2.3%) and 1,609 Mt with it. Coal share 59% / 33%
(2030 / 2040) without, 56% / 30% with, against their 61.8% / 34.3%. CO2 2030: 132.0 / 121.5 Mt against
their 155.9; 2040: 89.0 / 77.9 against 111.1.

Finding: on the same demand, capex, coal and build caps, wind agrees (both at the cap with the loop),
but our optimiser builds about twice their solar (at the cap every year), about ten times their
storage and less gas. Hourly chronology values solar-plus-storage, which their day-night time slices
and flat wind do not see; and their 2040 build, dispatched hourly, sheds 19 times the standard (part 1)
where ours meets it at 2.3% more cost than ours without the loop.

Caveats: battery cost and duration are ours; their 2024-25 build is subtracted from a digitised figure;
the objective with stress windows is not comparable with the one without (TODO 31); two draws per year.

### External test, Kerwin et al. 2026: their systems shed when dispatched hourly; the gap is energy, not power, 6 Oct 2026

Build `2026-10-05j`, suite 804/807 plus eng5 6/6 on 6 Oct with ESK19679.csv absent (failures: EDMSA
CO2, the Eskom reference, the build-stamp date). harness/ext/kerwin_part1.js, output kerwin_part1.json.
Their inputs are in SOURCES ("External scenario: Kerwin et al. 2026").

Settings. Today 2026 preset; scenarioYear 2030 or 2040; demand set to their Table A4 baseline (207.4 and
247.8 TWh; demandGrowthPct 3.36 and 23.54 on our 200.62 TWh profile). Their residual fleet replaces
ours: coalDecomMW = 39,692 - their coal; windMW, pvUtilityMW, rooftopMW, nuclearMW, cspMW and
ocgtDieselMW from Table A8. Hydro, pumped storage and imports are ours. Their new build cumulative from
2024 as newWindMW, newPvMW, newRooftopMW, newBattMW (4 h, assumed), newCcgtMW (all their gas),
newNuclearMW; biomass and small hydro (0.13-0.28 GW) left out. Scenario 1 coal is their own phase-out
(C5: 25.2 and 12.5 GW), because the engine has no emissions cap. Twelve weather years x two outage
draws on pathcheck's independent seeds (SEED_BASE 71830529). Standard: 0.002% of demand.

                       mean shed   standard  x std  curtail  CO2 ours  CO2 theirs  smallest fix tested
                       GWh         GWh              TWh      Mt        Mt
Baseline 2030          4.47        4.16      1.1    0.0      135.6     155.9       +250 MW 4 h battery or gas
Baseline 2040          94.3        5.07      19     6.6      99.6      111.1       +3.0 GW gas; no battery size
Scenario 1 2030        134         4.05      33     1.0      116.0     129.1       +3.0 GW gas; no battery size
Scenario 1 2040        5,428       5.02      1,080  20.1     64.9      64.5        +12.25 GW gas; no battery size
S1 2030, their residual coal 30.3 GW   3.84   4.06   meets  1.2   118.6
S1 2040, their residual coal 21.7 GW   368    4.96   74     25.6  83.4

"No battery size": 4 h lithium added up to 64 GW does not meet the standard. Checked that it is not a
cap: on Scenario 1 2040 (one draw per year), 0 / 10 / 30 / 64 GW extra take mean shed 5,404 / 4,112 /
3,240 / 2,657 GWh, battery discharge in 2016 2.8 to 14.3 TWh; at 12 h, 4,751 to 2,091 GWh. Curtailment
falls 20 to 5-7 TWh. The remaining shortfall is energy over multi-day lulls, which 4-12 h lithium
cannot shift enough of. Firm capacity (gas, here) closes it; long-duration storage is not yet tested
(TODO 14p(a)).

Finding: their 2030 baseline is about adequate; every other system fails the standard by 19 to about
1,000 times, and the shortfall is energy over multi-day lulls, which need firm or long-duration
capacity. Of what was tested, added gas meets the standard and 4-12 h lithium does not; pumped hydro
and iron-air are not yet tested (TODO 14p(a)). Their wind
runs at a flat 0.36 in all eight time slices (A9), so their model never sees a wind lull. The authors
say as much: their model "does not capture sub-annual balancing requirements". CO2 agrees where coal
capacity is set the same (Scenario 1 2040: 64.9 against 64.5 Mt).

Caveats: battery duration assumed (4 h); the baseline build is digitised from a figure; demand
definitions not reconciled (their final demand against our system demand; levels agree within 0.5% in
2026); two draws per weather year.

### Pumped hydro's earliest build year moved from 2033 to 2035, 6 Oct 2026

Build `2026-10-06a`, suite 805/807 plus eng5 6/6 with ESK19679.csv absent (before: 804/807 at
`2026-10-05j`; the one change is the build-stamp date check; failures EDMSA CO2 and the Eskom reference).
New FIXED key bldPhesFirstYear 2035 replaces the literal 2033 in the build LP. Why: Ingula took 11
years (2006-2017), so a first scheme that does not yet exist is more honestly in service nine years
from now than seven; a smaller off-river scheme could be quicker. 2033 is kept as a sensitivity
(bldPhesFirstYear: 2033). LP bounds checked: b_phes is 0 to 2034 and 1,500 MW from 2035 by default,
and from 2033 with the sensitivity. Nothing in the suite moves: pumped hydro is off by default
(bldPhesOn 0). The 5 Oct pumped-hydro pathway (pathway_ph160a, which built none) used 2033.

### Curtailment timing: the IEP workshop and NERSA's 2025 report disagree, 6 Oct 2026

Not a model result; a point for the IEP comment. The DEE's input-assumptions workshop (5-6 Oct 2026,
slides photographed, not published) describes curtailment as midday solar. NERSA's 2025 monitoring
report (issue 27, March 2026) describes R402m of deemed energy to 67 REIPPPP plants, curtailed at
night when demand was low, to keep the grid stable (see "Curtailment re-based on 2025" below).

What is established: night, low demand, stability. What is inferred: that it was mostly wind (from
the timing and the deemed-energy tariffs), and that it was local rather than system-wide (open,
TODO 14a1; a single-node model cannot see local stability limits). The model's own surplus
curtailment in high-solar builds is midday, so the department's description fits the future system
better than the 2025 record.

Caveat: cite the department's wording only once the slides are published.

### Harness baselines regenerated: what had changed since they were written, 6 Oct 2026

Build `2026-10-05j`. control_inventory.json (validate_structure) and response_matrix.json
(validate_response) at the repo root were written before 18 Sep (base avgCost R571/MWh) and failed
1 structure and 6 response checks. Compared against the current build, then regenerated with
--write-baseline; the new matrix came out byte-identical on three separate runs. After: response
85/85; structure 25/26, the one failure the build-stamp date check (stamp 2026-10-05, run 6 Oct).

Controls: 64 to 76. Removed reserveContingencyMW, reserveRegulatingPct, reserveVrePct (one flat
reserveOperatingMW since 21 Sep; reserveVrePct is still a FIXED key the engine reads). Added
asVoltageOn, asVoltagePotRm, asVoltageRMWyr, billFeedInR, billGenPct, billSelfConsumePct,
capacityPaymentLdsRkWyr, ccsSharePct, dieselBudgetTWh, dieselDecomMW, drShiftLossPct,
newOffshoreMW, nuclearCF, reserveOperatingMW, tdpConfidencePct. asReserveOn and asReserveRMWh still
exist but the response sweep now skips them by id (revenue levers since 21 Sep); exportsMW is newly
swept.

Base at defaults, old to new: coal 161.2 to 145.9 TWh, CO2 170 to 155.2 Mt, avgCost 571.07 to
1,093.99 R/MWh, replAvg 1,536.53 to 1,515.57, avgPrice 810.31 to 790.53, renewable share 19.42 to
21.43%; curtailment and loss-of-load hours 0 in both.

Seven response cells flipped. "Responsive" means the sweep's spread exceeds 0.01% of the base value,
or one hour for loss-of-load hours. All seven already stand at build 2026-10-01a, the oldest
index.html in git, so none can be bisected. Current values, and the cause with its evidence:

battHours -> avgCost, now responsive: 1,094.23 / 1,096.23 / 1,096.18 at 0 / 4 / 12 h (battPowerMW
  8,000). Inferred: the 18-19 Sep system-cost additions.
coalFlexPct -> avgPrice, now responsive: 790.53 to 787.41. Inferred: coalFlexPct became an on/off
  toggle (see the coal flexibilisation entry).
ccgtForceLoad -> coalTWh, now responsive: 145.95 to 128.59 TWh. Traced: the sweep now gives it
  4,000 MW of CCGT to force on (CONTEXT in validate_response); with no CCGT it cannot move coal.
newNuclearMW -> rePct, now inert: 21.432 to 21.431 across 0-10 GW (1 Oct build: 21.142 to 21.140).
  Measured: a threshold case. New nuclear displaces coal almost one for one, so the renewable share
  moves 0.001-0.002 points, under the 0.002 threshold.
drShiftPct -> loleHrs, now inert: 0 hours at every point to 30%. Inferred: the 28 Aug note recorded
  a rebound peak with diesel at 30%; later fleet and reserve changes leave no shed hour.
reserveEnabled -> rePct, now inert: 21.432 both ways. Inferred: the 21 Sep reserve rework (held
  every hour, one flat requirement); with no curtailment at defaults the share does not move.
importsMW -> loleHrs, now responsive: 1 hour at zero imports, 0 from 2,000 MW (1 Oct build: 2).
  Measured; cause inferred: the 22 Sep imports re-basing and later engine changes leave the base
  with one shed hour when imports are removed.

Caveat: four of the seven causes are inferred from dated entries, not reproduced; the builds that
would show them are not in git.

### PROVISIONAL pending the storage fix - Pumped storage: the optimiser does not over-use it and the engine does not under-use it; the gap is foresight, 7 Oct 2026

Build `2026-10-06e` (optimiser run) and `2026-10-06h` (engine).
- Run: half-standard coal-minimum pathway with existing pumped storage modelled as energy in the
  optimiser (bldPsEnergy 1, COMMIT 1, TF 0.5, TL 14400; pathway_v_half_c1_p1.json, 2 passes, adequate).
- Method: its 2040 build dispatched by the engine on the same twelve 2040 stress windows, weather years
  and outage seeds (harness/pathway/psboth.js), with the optimiser's own daily storage balance rebuilt from
  its pdis and pchg (variants_6oct/psboth_c1p1.json).
- Existing pumped storage: 2,724 MW, 60 GWh, 76% round trip.

```
                                   optimiser                    engine
level at window start              30 GWh, fixed (half full)    25-53 GWh, median about 41
level at window end                30 GWh (must refill)         6-21 GWh
net energy drawn per window        0 by construction            15-40 GWh
discharge, all 12 windows          3,264 GWh                    3,661 GWh (12% more)
shed in the windows                0                            16.5 GWh, 2016 days 277-279 only
```

- The optimiser gets no free opening energy (fixed 6 Oct, 06d) and discharges less in total.
- The engine draws its store down further. The engine-side checks of 6 Oct agree:
  - In 2015 day 80 the energy held back was used later in the same event.
  - Switching off the 26-hour peak floor raised shed across the windows from 43.7 to 61.3 GWh.
- The only shed gap is in two overlapping 2016 windows. There the engine empties pumped storage, while
  the optimiser keeps at least 8.4 GWh on the same build: it sees the whole 14 days and balances storage
  per day, not per hour.
- That is an optimism of the method for every store, not of pumped storage.

Decision (user, 7 Oct): bldPsEnergy on by default from build `2026-10-07a`.

Effect on the half-standard coal-minimum pathway (checked on independent draws):

```
pumped storage energy   new gas 2030/2040  gas CF/h 2040   cost R bn  CO2 Mt  worst year GWh
off (06e default)       1.2 / 3.6 GW       17.1% / 1,911   3,918      1,206   0.18
on (07a default)        1.2 / 3.22 GW      20.6% / 2,147   3,981      1,212   0.92
```

The gas, LNG-cost and storage variants of 6-7 Oct (entry below) ran with it off. They stand as
comparisons with each other, but need re-running with it on before any is quoted (TODO 26).

### PROVISIONAL, and pending the storage fix - Half-standard pathway: a coal minimum in the optimiser brings 3.6 GW of backup gas that neither LNG costs nor long-duration storage displace, 6-7 Oct 2026

Builds `2026-10-06e` (optimiser runs) and `2026-10-06h` (checks; the engine is unchanged between them).
harness/pathway/pathway_perfail.js and pathcheck.js.
- Pathway runs: Today 2026, demand +5% to 2040, half the 0.002% standard (TF 0.5), per-failing-year
  14-day stress windows (WPP 3, LEAD 0, testEvery 1, MAXP 14), native HiGHS (simplex; TL 7200 or 14400 s).
- Checks: twelve weather years x two independent outage draws (SEED_BASE 71830529), legislated carbon
  path, LNG=1.
- Outputs are in harness/pathway/variants_6oct/.
Provisional because it rests on one demand path and on the commitment formulation.

Coal minimum (bldCoalCommit, 65% of committed coal, commitment ramp coalCapMean/48 per hour), pumped
storage energy off:

```
run                    new gas     cost 2026-40  CO2     worst year  2040 solar/lithium  coal retired  margin
                       2030/2040   R bn          Mt      GWh         GW                  by 2040, GW   needed
no coal minimum        0.67/0.67   3,590         1,412   0.46        36.8 / 21.1         22.5          5,000 MW, 9 passes
coal minimum           1.2 / 3.6   3,918         1,206   0.18        48.6 / 29.1         28.8          none, 2 passes
```

The no-minimum run on 06e reproduces 06c to within a few MW in six cells, so the other 06d/06e changes
do not move the build; the difference is the coal minimum. Gas runs as backup: on the coal-minimum path
2.1% capacity factor (335 h) in 2033, 5.5% (779 h) in 2035, 17.1% (1,911 h) in 2040.

Sensitivities on the coal-minimum path (all build 1.2 GW of gas a year in 2030-2032, the yearly cap):

```
run                                          new gas   gas CF/h 2040   cost R bn  CO2 Mt  built
base                                         3.6 GW    17.1% / 1,911   3,918      1,206
(a) 14ak gas costs, coastal central          3.6 GW    19.7% / 2,132   3,918      1,203   fuel R1,813.5/MWh, +R260/kW-yr
(b1) pumped hydro from 2035, current caps    3.6 GW    17.1% / 1,911   3,918      1,206   pumped hydro 0
(b2) iron-air 500, lithium 3,000 MW/yr 2028  3.6 GW    16.8% / 1,882   3,883      1,197   iron-air 0.5 GW, pumped hydro 0
(b3) no caps on iron-air or pumped hydro     3.6 GW    15.2% / 1,759   3,908      1,206   iron-air 0.74 GW, pumped hydro 0
     (bounding case, not a plan)
b1-b3 on the 'anu2026' pumped-hydro basis    identical to the Tubatse rows to the MW and the rand
```

- (a) Fuel is about 9% cheaper once the flat USD 2/MMBtu adder is replaced (USD 0.25 regas fuel, no
  transport at Richards Bay), and the terminal's fixed cost (R260/kW-yr, SOURCES) offsets it. Gas runs
  a little more.
- (b) Pumped hydro is offered in every b run: its variables are in the final LP, and its dispatch is
  zero in every 2040 stress hour. It is never built, on either cost basis. Even unconstrained, iron-air
  adds only about 0.3 GW.
- At these costs, long-duration storage does not displace the backup gas. The binding limit is the gas
  build cap.

LNG storage (one 170,000 m3 storage unit, 0.45 t/m3, 53.37 GJ/t from the IRP 2025 assumptions, no heel:
4.08 PJ, about 590 GWh of gas generation at 52%):
- Through 2035, every stress window is within one cargo.
- From 2036-2038 on, a 14-day lull in a bad weather year (2015 day 80 the worst) burns up to 1.37-1.38
  cargoes. That is 8-10 of the loop's 30 windows in 2040, in every run above.
- The pathway's adequacy from then on assumes at least one cargo is delivered during a two-week event.

Caveats:
- Half standard, one demand path.
- Coastal gas only; most IPP gas bids are inland, where transport adds about USD 1.2/MMBtu.
- R260/kW-yr is above OIES's FSRU range (about R145-230).
- Pumped hydro is 48 h only, from 2035.
- The pumped-storage energy run (TODO 26) is still to come.

### Settings each 5 Oct pathway used, so they stay reproducible, recorded 6 Oct 2026

Common to all: Today 2026, demand growth 5% to 2040, horizon 2040, gas no earlier than 2030, rooftop
1.2 GW a year from 2027, perYear loop, draws 2, marginStepMW 1000, maxPasses 14 unless stated, highs-js
(WebAssembly) solver. Windows bind every model year at every build before `05j`; the scope option did not
exist yet.

```
script, output                 build  commit    loop                                        notes
pathway.js, pathway6           05a    a08cc0e   testEvery 2; 7-day weather window per pass  reference pathway, superseded
pathway_pv15.js, pathway_pv15  05b    bff06d5   as 05a                                      solar cap growth 15%
pathway_c462.js, pathway_c462  05b    bff06d5   as 05a                                      carbon path to R462
pathway_sd14.js, pathway_sd14  05f    not in git testEvery 2, stressDays 14                 14-day windows
pathway_ph160a.js              05f    not in git testEvery 2, stressDays 14                 pumped hydro, first year 2033
pathway_op.js, pathway_op      05g    d1be2a3   testEvery 2, stressDays 14, maxPasses 12    outage-path windows
pathway_half.js                05j    -         testEvery 3, stressDays 10, maxPasses 10,   superseded (scope too narrow)
                                                targetFrac 0.5, windowsPerPass 1, windowLeadYears 1
```

Reproduction: pathway_op reproduces exactly on `05j` and `06a` with windowLeadYears 14 (pathway_half_op.js,
TF=1, LEAD=14). It does not reproduce on `06b` or later, where windows are added per failing year
(windowsPerPass, default scope the failing year itself). `05f` was never committed; sd14 and ph160a can
only be re-run approximately, on `05g` with the same options.

### PROVISIONAL pending the storage fix - Build 05j changed stress-window scope; the 5 Oct pathways do not reproduce on it, 5 Oct 2026

Build `2026-10-05j`. Between `05g` (pathway_op recorded) and `05j` each stress window became scoped to
its fromYear on: the failing model year minus opts.windowLeadYears (default 4). At `05g` every window
bound every model year. Not recorded in RESULTS at the time.

Effect: pathway_op.js on `05j` no longer converges in two passes; its 2016 window binds only from
2036, 2032-2034 are never repaired, windows pile up and HiGHS (highs-js 1.15.3, WebAssembly) aborts.
With windowLeadYears 14 (every window from 2026) it reproduces pathway_op.json exactly: same
objective, same schedule to the MW, adequate in two passes (pathway_half_op.js TF=1).

Every pathway entry below dated 5 Oct was run at or before `05g`, so with all-year windows.

### SUPERSEDED 6 Oct 2026 - Half-standard pathway on pathway_op's settings: stalls near the full standard, solver limit at pass 5, 5 Oct 2026

Superseded by the per-failing-year stress loop (builds 2026-10-06b and 06c, branch claude/stress-per-year),
which reaches half the standard; kept for the record of why this run stalled. Cause: windows reached only
the worst year, so 2032-2036 were never repaired; with every-year windows the WebAssembly solver ran out
of memory, and with native HiGHS (6 Oct) the run hit the 3,600 s limit at solve 13 with no build saved.

Build `2026-10-05j`. pathway_half_op.js: pathway_op's settings (draws 2, testEvery 2, stressDays 14,
windowsPerPass 1) plus targetFrac 0.5 and windowLeadYears 14 (all-year windows, as at `05g`). Fresh
HiGHS instance per solve.

Mean shed against half the standard (about 1.97 GWh), years failing only:
pass 1  2032 2.51, 2034 4.44, 2036 5.70, 2038 8.27, 2040 8.39   (identical to pathway_op pass 1)
pass 2  2036 2.10, 2038 3.90, 2040 3.71
pass 3  2036 2.25, 2038 3.60, 2040 3.58
pass 4  2036 2.15, 2038 3.57, 2040 3.86
Pass 5's solve (five 14-day windows on fifteen model years) aborted in HiGHS; no build recorded.

Finding: after the first window, three more each moved 2038-2040 by under 0.4 GWh. The loop sits at
about the full standard, not half. The earlier half-standard run (pathway_half, windowLeadYears 1,
below) is superseded as a test of the target: it was scoped too narrowly to repair 2032-2036.

Caveat: not converged; no build or cost to quote. Two draws per weather year.

### PROVISIONAL pending the storage fix - Pathways re-checked on independent outage draws: both still meet the standard every year, 5 Oct 2026

Build `2026-10-05j`, suite 803/812 with ESK19679.csv absent (see the half-standard entry below).
pathcheck.js until now drew the same outage seeds as the loop's own adequacy test, so its means
reproduced the loop's and were not an independent check. It now uses SEED_BASE 71830529 + k x
104729 + y x 7919, which collides with no seed in index.html; SEED_BASE=20260816 reproduces the old
runs exactly (pathcheck_op re-run, largest difference 0). Twelve weather years x two draws, legislated
carbon path, PH 14. Outputs pathcheck_op_s2.json and pathcheck_sd14_s2.json in harness/pathway/.

Outage-path pathway (pathway_op): every year 2026-2040 meets the standard. Worst year 2038 and 2040,
2.89 GWh against 3.92 and 3.88 (loop's draws: 3.90 in 2038). Mean over the fifteen years 0.96 GWh
against 1.34. Cost R3,462bn (3,463), CO2 1,520 Mt (1,522).

Fourteen-day pathway (pathway_sd14): every year meets the standard. Worst 2039, 3.08 GWh against
3.91 (loop's draws: 3.38 in 2038). Mean 0.77 GWh against 0.93. Cost R3,479bn (3,480), CO2 1,513 Mt
(1,514).

Caveat: two draws per weather year. On fresh draws both builds shed less than on the draws they were
sized against, which is the expected direction for an in-sample test, but two draws do not pin the
size of the difference. The worst single run is still 31 to 33 GWh in 2040 on both.

### SUPERSEDED 6 Oct 2026 - Half-standard pathway did not converge: fails even the full standard in 2034-2038, 5 Oct 2026

Superseded by the per-failing-year stress loop (builds 2026-10-06b and 06c, branch claude/stress-per-year),
which reaches half the standard; kept for the record of why this run stalled. Cause: windows reached only
the worst year, so 2032-2036 were never repaired; with every-year windows the WebAssembly solver ran out
of memory, and with native HiGHS (6 Oct) the run hit the 3,600 s limit at solve 13 with no build saved.

Build `2026-10-05j`, suite 803/812 plus eng5 6/6 with ESK19679.csv absent (803/805 leaving out seven
checks against stale baseline files, see TODO). pathway_half.js, recorded in harness/pathway/
(pathway_half.json, pathcheck_half.json). Today 2026, demand growth 5% to 2040, horizon 2040, gas no
earlier than 2030, rooftop fixed at 1.2 GW a year from 2027. Loop: perYear, targetFrac 0.5, draws 2,
testEvery 3, stressDays 10, maxPasses 10, windowsPerPass 1, windowLeadYears 1, marginStepMW 1000.
Check: pathcheck.js, twelve weather years x two outage draws, legislated carbon path, PH 14.

Verdict "pass limit reached": ten passes, nine outage-path windows added, all for model years 2038
and 2040, no margin used. With windowLeadYears 1 each window binds only from the year before, so the
build to 2036 barely moved and 2032 and 2035 never changed across passes (2.51 and 4.52 GWh).

By 2040: 15.2 GW onshore, 30.9 GW solar, 16.8 GW new rooftop, 19.4 GW lithium at 107 GWh (5.5
hours), 0.25 GW vanadium, no iron-air, no gas, no offshore; 1.35 GW of coal retired early in
2039-2040.

Half the standard is met in 2026-2031 only. The full standard is failed in 2034 (4.44 against 3.95
GWh), 2035 (4.52, 3.93), 2036 (5.70, 3.92) and 2038 (4.87, 3.90). The full-standard run
(pathcheck_op.json) met the full standard every year.

Over 2026-2040: cost R3,384bn against R3,463bn at the full standard (2.3% lower), grid cost R3,239bn
against R3,319bn; CO2 1,585 Mt against 1,522 (4.1% higher). 2040: CO2 73.6 Mt (82.4), curtailment
43 TWh (33), whole-system R234bn (229).

Caveat: not a half-standard pathway. It is cheaper because it is less reliable, not because a
stricter target found a better build. Not to be quoted as the cost of the presets' 2x margin.

Second caveat: this check used the loop's own outage seeds (20260816 + k x 104729 + y x 7919 in
both), so its means reproduce the loop's exactly. Fixed since; see the independent-seed entry above.

### PROVISIONAL pending the storage fix - Outage-path stress windows replace the capacity margin: no margin needed, R17bn cheaper, 5 Oct 2026

PROVISIONAL, 6 Oct 2026: the "no gas" build below came from a build LP with no coal minimum and no
pumped-storage energy, the two gaps the 2040 decomposition found (RESULTS, 6 Oct). Re-runs with both
(build 2026-10-06d) are under way; do not quote the build mix until they are done.

Build `2026-10-05g`, suite 805/806, pathway_op.js. The engine now records hourly coal availability
(coalAvailFrac). Each failing engine run (weather year and outage draw) becomes its own 14-day
stress window in the optimiser carrying that run's hourly coal path, instead of the flat 0.76
derate; a window already held is skipped, and the capacity margin is only a logged fallback. After
NREL's ReEDS, whose stress periods come from a reliability model that samples outages.

One window was enough: 2016, days 279-292, the draw that shed 65.8 GWh. Converged in two passes with
no margin, against six passes and 4,000 MW with flat-derate windows.

By 2040: 11.9 GW onshore, 26.7 GW solar, 14.0 GW lithium at 90 GWh (about 6.4 hours), 0.75 GW
vanadium, 0.45 GW iron-air, no gas, no offshore, no early coal retirement.

Every year checked on twelve weather years x two outage draws meets the standard (corrected 5 Oct:
the loop's own draws, not fresh ones; see the independent-seed entry above). 2038 sits at
the line, 3.90 against 3.91 GWh, so the build is on the
standard with no spare margin, unlike the presets' 2x design. Over 2026-2040: cost R3,463bn against
R3,480bn for the flat-derate 14-day pathway, CO2 1,522 Mt against 1,514.

### PROVISIONAL pending the storage fix - Fourteen-day pathway verified; pumped hydro not chosen even at its best case, 5 Oct 2026

Build `2026-10-05f`, suite 805/806. The 14-day pathway (pathway_sd14) checked year by year on twelve
weather years x two outage draws (corrected 5 Oct: the loop's own draws, not fresh ones): every year meets the standard, worst mean shed 3.38 GWh
(2038) against about 3.9. Over 2026-2040: cost R3,480bn against R3,493bn
for the 7-day reference (0.4% lower), CO2 1,514 Mt against 1,473 (3% higher).
2040: CO2 84.5 Mt, curtailment 34 TWh, whole-system R232bn, grid R212bn.

Pumped hydro in the same loop, best case: 160-hour schemes at the unscaled atlas cost (about
R50,300/kW, R314/kWh), 8% real, 60-year life, available from 2033 up to 6 GW. The optimiser builds
none, and the pathway is identical to the one without the option. (The 48-hour Tubatse-cost run,
more expensive per kWh, was not completed; it cannot do better.)

Why: the loop closes the remaining gap with a capacity margin on stress days, and a megawatt of
lithium meets a megawatt of margin far more cheaply than a megawatt of 160-hour pumped hydro. What
pumped hydro is good at, energy over a long lull, is only partly visible to the optimiser, which
still needs a 4,000 MW margin. Not a finding that pumped hydro is uneconomic in South Africa: a
finding that this optimiser, with this margin method, cannot value it yet.

### PROVISIONAL pending the storage fix - Fourteen-day stress windows: margin 5,000 to 4,000 MW; coal derate already at the bad-outage level, 5 Oct 2026

Build `2026-10-05f` (suite not yet run), pathway_sd14.js. The per-year loop can now add stress
windows of stressDays (here 14) that open a week before the failing week, so the optimiser must
carry storage through the run-up as well as the lull. Same reference pathway otherwise.

Margin needed 5,000 to 4,000 MW, six passes against seven. By 2040: 10.4 GW onshore (12.1), 28.5 GW
solar (26.0), 15.6 GW lithium at 90 GWh (81), 0.75 vanadium, 0.43 iron-air, 0.29 gas (0.73). Not yet
checked year by year on independent draws.

Coal derate left at 0.76: measured, the engine's coal in its shed hours averages 85% of the mean
available, and on the 2016 stress week's bad draw 10,426 MW against the optimiser's 10,299. The
derate already sits at the engine's bad-outage level; what remains is storage energy over long lulls.

Pumped hydro fixed O&M sourced: NREL ATB 2022, USD 18/kW-yr, R297 at R16.50 (was an assumed R250).

### PROVISIONAL pending the storage fix - Battery reserve in the optimiser now energy-limited, as in the engine; small effect, 5 Oct 2026

Build `2026-10-05e`. Confirmed: the storage held back while load is shed is the engine's reserve rule
(shed load before reserve falls below the requirement; storage counts as reserve up to what its
stored energy sustains for asHoldHours), the practice of operators who shed firm load to keep
contingency reserve. The optimiser counted full battery power as reserve even when empty. It now
uses a battery-reserve variable limited by unused power and by stored energy over asHoldHours.

Effect on the 2040 build at zero stress margin: engine mean shed 8.9 to 8.6 GWh, build almost
unchanged. Correct, but not the main gap. What remains is multi-day lulls draining a 6.7-hour
lithium fleet, with outage timing the optimiser's single tail derate cannot represent.

### PROVISIONAL pending the storage fix - Optimiser-engine gap, first decomposition: the engine's storage, not coal, 5 Oct 2026

Build `2026-10-05d`, gapdiag.js (harness folder). The reference pathway's 2040 build as the optimiser
sizes it with no stress margin, run in the engine on twelve weather years x two outage draws: mean
shed 8.9 GWh against a 3.9 GWh standard, 103 shed hours in 39 events.

In the engine's shed hours: coal 11,540 MW (above the optimiser's stressed 10,300), diesel at its
full 3,400, pumped storage 1,350, lithium discharging 140 MW from about 275 MWh of a 101 GWh fleet,
wind and solar 2,560. Before the largest events lithium was 50-98% full 48 hours ahead and empty
by the event: multi-day lulls that a 6.6-hour fleet cannot bridge.

The optimiser's own stress week (2016, days 286-292) sheds 53.9 GWh on one outage draw with coal
averaging 10,426 MW, against the optimiser's 10,299 and no shedding; on the other draw, coal 11,436
and no shedding. The optimiser's coal assumption is not the gap.

Storage held back while load is shed: in 47 of 103 shed hours vanadium held over 300 MWh; in the
inspected hours vanadium (500-2,000 MWh) and lithium (200 MWh) discharged nothing. Unresolved
whether that is the reserve the engine holds every hour (the reserve note says load is shed before
reserve falls below 2,200 MW) or a dispatch fault. Next: establish which, then re-run the loop.

### Slider notes: stale figures fixed, fleet numbers now computed, gas fuel on R16.50/USD, 5 Oct 2026

Build `2026-10-05d`. Trimmed on request: Diesel retired, Diesel budget, energy lost in shifting.
Fleet figures in notes (wind, utility PV, rooftop, lithium, pumped storage, coal) are now computed
from FIXED, so they cannot drift; they had read 3.2, 8.6 and 2.9 GW against constants of 3.3, 8.9
and 2.7. New check in validate_findings fails on the old notes and passes now. Lithium-duration
note now matches the 2 Oct result (lithium cheapest to about 16 hours; only cells scale with
duration). Congestion toggle note no longer quotes unsourced 2026 figures. Interruptible-load note
reads diesel and VOLL from FIXED. TDP edition named. costCcgt 1,968 to 2,003 R/MWh: the project's
R16.50/USD rate, not R16.21 (fallbacks, the methods table, validate_consistency and audit.py follow).
Suite 805/806.

### PROVISIONAL pending the storage fix - Pathway sensitivities: solar build-cap growth and a shadow carbon price, 5 Oct 2026

Build `2026-10-05b`, same method and checks as the reference pathway below (every year on twelve
weather years x two outage draws; every year meets the standard in both). pathway_pv15.js and
pathway_c462.js, outputs pathway_pv15/pathcheck_pv15 and pathway_c462/pathcheck_c462 json.

Solar build cap growing 15% a year instead of 7%: 10.0 GW onshore and 28.9 GW solar by 2040 against
12.1 and 26.0, lithium unchanged at 15.7 GW, gas 0.3 against 0.7 GW. Cost over 2026-2040 0.4% lower
(R3,478 against R3,493bn), CO2 3% higher (1,518 against 1,473 Mt), mean shed in 2038 3.6 against
1.5 GWh. The 7% assumption barely matters; 7% stays central.

Shadow carbon price, the full R462/t headline rate from 2026 with no allowances: the optimiser now
retires coal early, from 2032, 6.5 GW ahead of schedule by 2040 (14.3 GW left against 20.8). By 2040
15.0 GW onshore, 42.7 GW solar, 22.5 GW lithium (130 GWh), 1.25 GW vanadium, 0.75 GW iron-air, 1.55 GW
gas; still no offshore. Stress margin 8,000 MW, ten passes.

```
              2030    2035    2040    2026-2040
CO2 Mt ref    96.5    88.0    82.3     1,473
CO2 Mt R462   91.0    73.2    62.2     1,307
curtail ref    3.5    15.3    32.7   TWh
curtail R462   6.4    40.2    55.9   TWh
```

Reported system cost includes the carbon tax, a transfer. Net of it, resource cost in 2040 is
R223bn on the reference against R254bn at R462/t, and over 2026-2040 R3,348bn
against R3,629bn: 165 Mt less CO2 for about R281bn, about R1,700/t abated.

Caveat: the 8,000 MW stress margin shows the optimiser-engine gap widening as coal leaves; the
emissions-cap pathway still needs a sourced electricity cap.

### PROVISIONAL pending the storage fix - Reference pathway on the legislated carbon tax, with CO2 and both cost measures, 5 Oct 2026

Build `2026-10-05b`. The build optimiser now prices carbon on the legislated Phase 2 path
(carbonTaxPathOn): headline R308/t in 2026 to R462/t in 2030 (2022 Budget), allowances cut 2.5
points a year from 2027 (Treasury Phase 2 paper), so the effective rate rises from R46/t in 2026
to R115.5/t in 2030, held flat after. The per-year check uses the same path. Otherwise as the 5 Oct
pathway. Loop: seven passes, two weeks added, stress margin 5,000 MW.

By 2040: 12.1 GW onshore, 26.0 GW solar, 15.7 GW lithium (81 GWh, about 5.2 hours), 0.93 GW
vanadium, 0.45 GW iron-air, 0.73 GW gas, 16.8 GW rooftop. No offshore, no early coal retirement:
at R115.5/t retiring early still does not pay.

Every year checked on twelve weather years x two outage draws. Cumulative new GW; coal GW; shed
mean and standard GWh; CO2 Mt; curtailment TWh; whole-system cost and grid cost (without
consumer-funded rooftop, the ISP convention), R bn:

```
year   wind    pv  batt  hrs   coal   shed  std     CO2  curt   whole   grid
2026    2.5   2.5   2.0  1.0   39.7   0.01 4.03   144.7   0.0   220.8  220.8
2027    5.0   5.2   4.0  1.0   38.5   0.00 4.05   130.7   0.1   233.3  232.0
2028    7.5   7.2   6.0  1.0   37.4   0.00 4.07   118.2   0.5   243.1  240.4
2029   10.0   7.2   8.0  1.0   36.4   0.00 4.05   109.3   1.0   238.6  234.5
2030   12.1  10.5  10.0  1.0   30.3   0.00 3.99    96.5   3.5   239.3  233.8
2031   12.1  12.2  10.9  1.4   28.6   0.00 3.97    93.6   5.4   237.4  230.5
2032   12.1  13.0  11.8  1.9   27.0   0.02 3.94    92.1   7.0   237.2  228.9
2033   12.1  14.9  12.5  2.2   25.9   0.05 3.93    90.2  10.2   238.6  229.0
2034   12.1  16.4  13.4  3.0   24.2   0.13 3.92    88.6  13.1   230.7  219.7
2035   12.1  17.4  13.5  3.0   24.2   0.14 3.90    88.0  15.3   227.3  214.9
2036   12.1  19.9  14.4  4.0   22.6   0.45 3.90    85.9  19.7   231.1  217.3
2037   12.1  19.9  14.5  4.0   22.6   0.59 3.89    85.9  20.8   225.8  210.6
2038   12.1  21.6  15.5  4.9   20.8   1.52 3.90    83.7  23.5   228.6  212.1
2039   12.1  23.4  15.6  5.0   20.8   1.33 3.88    83.1  27.5   228.8  210.8
2040   12.1  26.0  15.7  5.2   20.8   1.13 3.87    82.3  32.7   232.7  213.4
```

Every year meets the standard. CO2 falls from 145 to 82 Mt, almost all of it from the coal
schedule. Consumer-funded rooftop is R13-19bn a year of whole-system cost by the late 2030s.

### Pathway assumptions checked against professional practice, 5 Oct 2026

Rooftop solar in system cost. AEMO's ISP takes consumer energy resources as a forecast input and
leaves their cost out, as consumers pay it; that is contested (AEMC rule change ERC406, critics who
call it incomplete whole-system costing). ReEDS takes distributed PV from dGen, outside the
optimisation. GridTwin's system cost includes new rooftop capital (acapRooftop in newCapexR and in
the build LP). Proposal: report both, grid system cost without consumer-funded rooftop (the ISP
convention) and whole-system cost with it, labelled.

Carbon prices. Planners differ: legislated prices go into reference cases; climate targets are
usually imposed as emissions budgets or caps (AEMO's ISP, the IRP's emissions trajectory, the DBSA/
PCC scenarios) rather than as an invented price. GridTwin uses the effective South African rate,
R46/t after allowances. Proposal: keep the legislated rate in the reference pathway (its Phase 2
escalation to be checked), add a pathway under an NDC emissions cap, and a shadow-price
sensitivity. Needs pathway CO2 reported first.

Solar build cap growth. Precedents: RFF's Haiku limits each fuel to its historical maximum growth
rising 7% a year; the IEA-ETSAP TIAM framework allows additions to grow 15% a year without extra
cost; ReEDS applies a growth penalty relative to the previous year. Proposal: keep 7% as central,
15% as a sensitivity.

### PROVISIONAL pending the storage fix - Least-cost pathway to 2040, adequate in every year, 5 Oct 2026

Build `2026-10-05a`; pathway.js and pathcheck.js in the harness folder, outputs pathway6.json and
pathcheck6.json. Supersedes the two pathway drafts below.

Method, after NREL's ReEDS. The build optimiser solves 2026-2040 in annual steps. Every second model
year (and 2040) is then dispatched hourly on twelve weather years with two outage draws each and
judged on expected unserved energy, the mean, against 0.002% of demand. The worst week of the
worst failing year joins the optimiser; when that week is already there, a stress-day margin rises
by 1,000 MW instead, as utilities calibrate a planning reserve margin to an adequacy study. Seven
passes: two weeks added (2016 for model year 2038, 2015 for 2040), margin 4,000 MW. Then all fifteen
years checked, twelve weather years x two outage draws. Corrected 5 Oct: pathcheck then used the
loop's own seed formula, so these were probably the loop's draws, not fresh ones (not re-verified
for this build).

Assumptions. Start Today 2026; demand +5% by 2040. Coal retires on Eskom's unit schedule scaled to
39,692 MW in 2026; the optimiser may retire earlier (it does not). Gas from 2030 only. Offshore on
ESMAP's medium path (not chosen). New rooftop fixed at 1.2 GW a year from 2027. Solar build cap 2.5
GW a year growing 7% a year (assumption). Lithium duration chosen by the optimiser, 1-20 hours.

```
      built that year GW       cumulative new GW        coal   shed GWh mean/std/worst   TWh          R bn
year  wind   pv batt  gas    wind    pv  batt   GWh     GW
2026   2.5  2.5  2.0  0.0     2.5   2.5   2.0   2.0   39.7   0.01 4.03   0.2   135.3   0.0  220.8
2027   2.5  2.7  2.0  0.0     5.0   5.2   4.0   4.0   38.5   0.00 4.05   0.0   121.5   0.1  231.6
2028   2.5  0.0  2.0  0.0     7.5   5.2   6.0   6.0   37.4   0.00 4.06   0.0   112.9   0.2  238.2
2029   0.0  0.0  2.0  0.0     7.5   5.2   8.0   8.0   36.4   0.00 4.04   0.0   111.9   0.3  229.0
2030   0.6  3.3  2.0  0.6     8.1   8.5  10.0  14.1   30.3   0.00 3.99   0.0   103.0   1.0  226.9
2031   0.0  3.5  0.9  0.0     8.1  12.0  10.9  20.7   28.6   0.01 3.97   0.2    97.0   2.8  226.0
2032   0.0  2.7  0.9  0.0     8.1  14.7  11.8  27.9   27.0   0.03 3.96   0.4    93.6   5.6  227.4
2033   0.0  2.3  0.6  0.0     8.1  17.0  12.5  33.0   25.9   0.06 3.95   1.5    91.7   9.1  229.3
2034   0.0  1.7  0.9  0.0     8.1  18.7  13.4  44.6   24.2   0.43 3.94   5.5    90.5  12.3  221.7
2035   0.0  0.2  0.1  0.0     8.1  18.9  13.5  46.2   24.2   0.44 3.93   5.6    90.2  13.5  217.7
2036   0.0  3.0  0.9  0.0     8.1  21.9  14.4  62.6   22.6   2.49 3.94  19.9    87.8  18.2  222.3
2037   0.0  0.3  0.1  0.0     8.1  22.2  14.5  64.8   22.6   2.13 3.92  21.7    87.6  19.6  217.4
2038   1.1  5.6  0.8  0.0     9.2  27.9  15.3  83.9   20.8   2.82 3.93  30.7    81.8  29.2  226.3
2039   0.0  0.2  0.1  0.0     9.2  28.1  15.4  84.2   20.8   2.92 3.92  31.3    81.8  30.7  224.5
2040   0.0  0.3  0.1  0.0     9.2  28.4  15.5  87.1   20.8   2.74 3.90  32.0    81.7  32.4  225.8
```

By 2040: 9.2 GW onshore, 28.4 GW solar, 15.5 GW lithium (87 GWh, about 5.6 hours), 0.75 GW vanadium,
0.43 GW iron-air, 0.62 GW gas (2030), 16.8 GW rooftop; no offshore, no early coal retirement. Coal
output 135 to 82 TWh; system cost R218-238bn a year throughout; curtailment rises to 32 TWh. Every
year meets the standard on the mean (at most 2.9 against about 3.9 GWh); the worst weather year
reaches 30-32 GWh in 2038-2040.

Caveats. The 4,000 MW stress margin is calibrated, not physical: it measures how far the optimiser
and the hourly engine still disagree about stress weeks, and should be reported as a planning
reserve margin. Gas in 2030 assumes an import terminal that is not financed. The solar-cap growth is
an assumption. At an effective carbon price of about R46/t nothing retires early; a carbon-price
sensitivity is open. CO2 not yet reported. Tested every second year in the loop, every year after.

### PROVISIONAL pending the storage fix - Coal schedule scaled to Eskom's 39,692 MW; pathway re-run falls further short, 4 Oct 2026

Build `2026-10-04f`. UC_FLEET's unit sizes summed to 41.4 GW in 2026 against Eskom's nominal
39,692 MW (integrated report FY2026). Both build LPs now scale the schedule's shape so 2026 equals
FIXED.coalInstalledMW (factor 0.958): 39.7 GW in 2026, 30.3 GW in 2030, 24.2 GW in 2035, 20.8 GW
in 2040.

Pathway re-run on it (Today 2026 to 2040, gas from 2030, rooftop at uptake): still no early
retirement and no offshore. The adequacy loop stalls further out than before: 2040 worst year
41.2 GWh and mean 7.3 GWh on one outage path, against a 3.9 GWh standard. With 1 GW less coal in
2040, the optimiser's builds fall further short of what the hourly engine needs. The optimiser-
engine gap, not the schedule, is now the blocker for a publishable pathway. Suite 804/805.

### PROVISIONAL pending the storage fix - Build optimiser: coal retirement and offshore are decisions; the solar cap grows, 4 Oct 2026

Build `2026-10-04e`. Three changes to bldBuildLP. Coal may retire ahead of Eskom's unit schedule
(rc_<y>, cumulative, irreversible), saving fomCoal (R1,160/kW-yr) a year; it may not run past its
scheduled date. Offshore wind is a build option on the engine's offshore profile, capped at ESMAP's
medium path (none before 2032, 1 GW by 2035, 5 GW by 2040). Utility solar's build cap grows 7% a year
from 2.5 GW (6.4 GW by 2040), an assumption for a scaling industry, not a sourced rate.

Coal schedule corrected: Camden, Hendrina and Grootvlei now close in 2030, not 2024-2027. Their 17
units run under an emissions exemption to 31 March 2030, and the IRP 2025 requires the five older
stations, with Arnot and Kriel, to close by 2030. Coal the optimiser sees in 2026 went 38.5 to
41.4 GW. Life extension beyond the schedule is not offered; Eskom attributed R8.4bn of the MYPD 6
maintenance increase to keeping those five stations running, and that is inside fomCoal.

Re-run of the pathway before the schedule correction (Today 2026 to 2040, gas from 2030, rooftop at
uptake): no early coal retirement, no offshore. At an effective carbon price of about R46/t, saved
fixed O&M never pays for replacement, and onshore wind, solar and storage beat offshore. Solar uses
the growing cap, 3.0-3.5 GW a year in 2029-32, 25 GW new by 2040; wind 10.8 GW, lithium 13.5 GW at
about 6.4 hours. Mean shed still exceeds the standard in 2038-2040 (4.2-4.4 against 3.9 GWh). To be
re-run on the corrected schedule. Suite 804/805.

### PROVISIONAL pending the storage fix - Least-cost pathway to 2040: first draft, short of the standard from 2038, 4 Oct 2026

Build `2026-10-04d`, pathway.js and pathcheck.js (harness folder). Start: Today 2026. Build optimiser,
annual steps to 2040, stress-period loop on. Demand +5% by 2040. Coal retires on Eskom's unit
schedule (UC_FLEET), 38.5 GW in 2026 to 21.8 GW in 2040: an input, as in the IRP. Gas allowed from
2030 only (no import terminal before). New rooftop fixed at 1.2 GW a year from 2027 (16.8 GW by
2040). Offshore is not an optimiser technology. Pace caps: the masterplan pace.

Every year then dispatched on twelve weather years x two outage draws. GW built that year, GW
cumulative new, coal remaining; shed against the 0.002% standard, GWh; coal TWh; curtailment TWh;
system cost R bn:

```
year  wind   pv batt  GWh    cum: wind    pv  batt   coal    shed   std    coal  curt    cost
2026    2.5  2.5  2.0   2.0     2.5   2.5   2.0   38.5    0.14  4.03   135.3    0.0   219.0
2027    2.5  0.0  2.0   2.0     5.0   2.5   4.0   37.1    0.09  4.03   126.4    0.0   226.0
2028    0.0  2.5  0.7   0.7     5.0   5.0   4.7   35.8    0.05  4.03   120.7    0.1   228.2
2029    0.0  2.5  0.6   0.9     5.0   7.5   5.4   34.8    0.02  4.02   115.3    0.5   219.7
2030    0.0  2.5  1.7  10.2     5.0  10.0   7.0   31.6    0.06  3.99   109.8    1.1   219.4
2031    0.0  2.5  1.0   7.0     5.0  12.5   8.0   29.9    0.12  3.97   105.3    2.5   218.2
2032    0.0  2.5  1.0   8.4     5.0  15.0   8.9   28.1    0.51  3.95   101.9    4.7   219.6
2033    0.0  2.5  0.7   5.7     5.0  17.5   9.6   27.0    1.06  3.95    99.4    7.9   221.6
2034    1.6  2.5  0.7  11.1     6.6  20.0  10.3   25.3    1.86  3.94    93.5   12.9   216.0
2035    0.0  0.1  0.1   1.1     6.6  20.1  10.4   25.3    1.96  3.93    93.3   14.1   211.9
2036    2.4  1.3  0.6  16.6     9.0  21.4  10.9   23.5    3.08  3.92    86.9   18.6   216.7
2037    0.0  0.2  0.1   1.1     9.0  21.6  11.0   23.5    3.01  3.90    86.8   19.9   211.7
2038    2.0  2.5  1.8  17.2    11.0  24.1  12.9   21.8    4.14  3.90    80.8   26.1   217.6
2039    0.0  0.0  0.2   1.1    11.0  24.1  13.1   21.8    4.35  3.88    80.9   27.2   215.8
2040    0.0  0.1  0.1   1.1    11.0  24.2  13.2   21.8    4.34  3.86    80.9   28.6   216.6
```

Built by 2040: about 11 GW onshore, 24 GW solar, 13 GW lithium (86 GWh, about 6.6 hours), 0.5 GW
vanadium, 0.15 GW iron-air, no gas. Solar hits its 2.5 GW a year cap in most years, so the pace
assumption, not cost, sets the schedule. System cost stays near R212-228bn a year while coal
output falls from 135 to 81 TWh.

Not yet a result: mean shedding exceeds the standard in 2038-2040 (4.1-4.3 against 3.9 GWh), and
from 2034 it is above the presets' half-standard design. The loop tests only the final year on
one outage path (it read 2.15 GWh mean); per-year checks with outage draws read higher. Next: add
the failing years' worst weeks to the LP, or top up per year, and re-check. CO2 not reported: the
key read returned zero (co2Mt is not on the result object); coal TWh stands in.

### Both transition presets re-sized, 4 Oct 2026

Build `2026-10-04d`. Both had been sized with congestion at 4% (double-counted) and on one outage
draw, so both sat far inside their target. Re-sized to the least system cost meeting half the
0.002% standard, the presets' existing design rule, with the target fixed at the starting build's
level (cutting rooftop would otherwise raise grid demand and loosen it).

Method: greedy search from each preset. Every technology alone, and every pair (one cut by twice
the step, one raised by the step), at 2, then 1, then 0.5 GW (iron-air 0.5, 0.25, 0.125; offshore
1, 0.5, 0.25). Cheapest move that still meets the target, repeated until none helps. New rooftop
held at expected uptake: behind-the-meter solar is a household decision, taken as a forecast in
IRP-style planning, not a planner's choice. Lithium held at 12 hours. Fossil-free scored on twelve
weather years (no coal, so outage draws do not matter); Deep on twelve years x two draws, then
checked on 480 draws.

```
GW                        onshore  solar  offshore  lithium  iron-air  cost R bn  shed GWh  curtail TWh
Deep decarbonisation old     35      35      0        17      1.0       286.8               67.4
                     new     32.5    29.5    0        19      1.125     279.5     1.98*      ~51
Fossil-free 2040     old     35      55      7        30      1.0       338.4     0.18      113.1
                     new     35      45      5        32      2.25      323.1     1.98       84.2
* mean of 480 draws, target 2.07; on the default single draw 2.59
```

About R7bn and R15bn a year cheaper, at target rather than far inside it. Solar cut most, lithium
up a little, curtailment down 16 and 29 TWh.

Deep's search build (29.0 GW solar) shed 2.32 GWh on 480 draws, over target: two draws per year
were optimistic. Four smallest top-ups tested on the same 480 draws all met it (lithium +0.5 GW
1.96, iron-air +0.125 1.82, onshore +0.5 1.87, solar +0.5 1.98); solar was cheapest, R279.5bn.

Offshore in Fossil-free held at 5 GW, ESMAP's deployable path to 2040. The unconstrained search
chose 5.25 GW at R322.0bn; at exactly 5 GW that build shed 3.76 GWh, so the result is sensitive to
the last quarter-gigawatt of offshore. The old preset's 7 GW was above the deployable path.

Re-pinned for the deliberate change: preset curtailment band (validate_findings) 65.2/119.7 to
52.7/96.3 TWh; Deep's new-build capital (validate_consistency) R1.019 to R0.936/kWh. Suite 804/805.

### Backcast 2025 now runs 2025's own demand, 4 Oct 2026

Build `2026-10-04a`. build_demand_2026.py also writes demand_2025 to profiles.json: calendar 2025
contracted demand less exports, unscaled (194.62 TWh domestic), rooftop added back at Backcast
2025's 6,532 MW x 0.78, read from the preset so there is one source. The 2026 series is unchanged,
byte for byte. demandYear 2025 swaps it in for single runs and weather years; Backcast 2025 sets
it and drops its +2.5% demand fudge.

Against Eskom's 2025 contracted demand, MW:

```
              00-04    09-15    16-20    21-23    peak               energy TWh
before         -523     +919     -371     -615    27,182 / 27,770    209.4 / 209.6
now             -52     +108      -27      -87    27,674 / 27,770    209.6 / 209.6
```

Backcast 2025 on its own profile: shed 28.3 GWh (was 19.1), peakers 2.25 TWh, coal 168.6 TWh
against Eskom's 170.4. Twelve weather years, mean 32.5 GWh. Eskom shed 390 GWh and burned 3.4 TWh
of peakers. Suite 804/805.

### The demand-shape gap is the backcast's, not the model's: a 2026 profile run as 2025, 3 Oct 2026

Build `2026-10-03g`. profiles.json demand is a 2026 series: Eskom's 2025 contracted demand less
exports, scaled by 0.9519 to 2026, with rooftop added back at 8,942.1 MW x 0.78 so the engine
removes exactly that. Backcast 2025 runs it with rooftopMW 6,532 and demand +2.5%. The engine then
removes 2.4 GW less rooftop than was added back, which appears as midday demand, and the +2.5%
leaves everything else 2.4% low.

Test: undo both, demand +5.05% (1/0.9519) and rooftop 9,394 (8,942 x 1.0505), so the engine
reproduces 2025's net demand exactly. Against Eskom's 2025 contracted demand, MW:

```
                 00-04    09-15    16-20    21-23    peak             shed GWh
backcast now      -523     +919     -371     -615    27,182 / 27,770     19.1
undone             -63     +119      -46     -104    27,651 / 27,770     27.0
```

Confirmed. Today 2026 and every forward preset use the profile at the rooftop it was built with,
so their shape is right; the earlier entry saying the gap affects every scenario overstated it.
The 9,394 MW is a test setting only: it would report 2025 rooftop output wrongly. The fix is a 2025
demand series built from ESK19679 with 2025 rooftop (6,532) added back and no scaling, chosen when
the scenario year is 2025. With the shape corrected the backcast sheds 27 GWh, not 19.

### Night demand definitions: ruled out as the curtailment cause; the model's demand shape is off, 3 Oct 2026

Eskom's glossary: residual demand is what dispatchable resources supply (Eskom generation,
imports, dispatchable IPPs, IOS); RSA contracted demand is residual demand plus self-dispatched
generation such as renewables. It does not say how pumping is treated. ESK19679 settles it: across
2025, contracted demand equals the sum of all supply columns (including IOS, ILS and load shed)
less pumping load, to a mean of 7 MW and an SD of 20 MW at night. So contracted demand excludes
pumping, includes exports and adds back load shed. The model's comparable line is its load before
storage charging (rawDemand less rooftop plus firm exports), which is defined the same way.

Like for like, Backcast 2025 against Eskom 2025, MW:

```
hours    model    Eskom    model less Eskom
00-04   20,059   20,582       -523
05-08   24,092   24,251       -159
09-15   25,509   24,589       +919
16-20   26,361   26,731       -370
21-23   22,194   22,809       -615
year     209.4    209.6 TWh
peak     27,184   27,770      -586   both at 18:00
```

Night demand in the model is lower than Eskom's, which would make surplus curtailment more likely,
not less. Ruled out as the cause.

But the shape is wrong in a way that matters: the evening peak is 0.6 GW (2%) low, which flatters
adequacy, and middays are 0.9 GW high, which hides solar surplus. The likeliest cause is rooftop
netting (too little rooftop output subtracted at midday) or the demand profile's own shape; not
yet tested.

### Correction: ESK19679 timestamps are 12-hour clock, and two figures above were wrong, 3 Oct 2026

ESK19679 writes "2025-01-01 12:00:00 AM". Reading the hour as the two digits after the date folded
AM and PM together. Re-parsed:

```
                                        reported      corrected
Eskom 2025 shedding at 22:00-06:00         40%           30%
Eskom 2025 night (00-05) thermal mean   19,329 MW     19,177 MW
Eskom 2025 night pumping mean              997 MW      1,849 MW
Eskom 2025 night thermal p5 / min    15,894/11,247  16,144/13,210
```

The weekend share (54%), pumping while shedding and every daily or index-based figure are
unaffected. The entry below compared Today 2026 with Eskom's nights; the claim that the model pumps
twice as hard as Eskom is withdrawn. On the like-for-like comparison, Backcast 2025 against 2025:

```
hour     Eskom thermal   model coal    Eskom pumping   model PS pumping
00-03       ~18,900        ~17,700         ~2,000            ~1,300
06-16       ~19,300        ~19,400           ~300              ~50
17-20       ~20,300        ~20,300            ~40              ~25
```

The backcast follows Eskom's daily shape to within about 1 GW; at night it runs about 1 GW less
coal and pumps about 0.7 GW less. Its night coal p5 and minimum (15,436 and 13,613 MW) sit close to
Eskom's. Raising every unit's minimum stable level up to 1.4x produces no curtailment at all on
the backcast. So the 2025 curtailment is not reproduced by a coal-minimum change; the remaining
candidates are the demand definition at night (model load includes charging; Eskom's contracted
demand may not), an operating floor Eskom holds on coal above technical minimum, and local
stability curtailment at specific plants, which a single-node model cannot see. The 1.3% stopgap
stays.

### Curtailment re-based on 2025: a stopgap at 1.3%, and why the dispatch produces none, 3 Oct 2026

Build `2026-10-03g`. NERSA's 2025 monitoring report (issue 27, March 2026): R402m of deemed energy
to 67 REIPPPP plants, against R46.2m in H1 2024, curtailed at night when demand was low, to keep
the grid stable. No GWh figure; at H1 2024's implied R2.32/kWh it is about 173 GWh, at the wind
tariff of R1.42 about 283 GWh: 1.0-1.6% of 17,808 GWh. The congestion framework (April 2025 to
March 2028) covers only new wind in the Eastern and Western Cape, capped at 4%.

Stopgap: congestionCurtailPct 1.3, labelled as standing in for 2025's curtailment. Right on energy,
wrong on timing: it takes energy from every hour, where the real loss was wind at night. Today 2026
now loses 280 GWh, 1.2%. The iron-air finding passes again (July gas 2,209 to 2,209 GWh); it failed
only at 0.24%, so it is sensitive to how much renewable energy is delivered. Suite 804/805.

Why the dispatch produces no surplus curtailment, Today 2026 against Eskom's 2025 nights (00-05):

```
                        model     Eskom 2025
coal / thermal MW      17,124       19,329
storage charging MW     2,294          997  (Eskom: pumping only)
coal min stable MW     10,739
night thermal p5 / min               15,894 / 11,247
```

Coal never comes within 300 MW of its minimum stable level at night, so there is always room to
back down. The model pumps over twice as hard as Eskom overnight and serves less from coal.
Raising every unit's minimum stable level is not the answer: x1.3 gives 4 GWh of curtailment and
x1.45 gives 1,100 GWh, with only 46% of it at night. The calibration belongs on Backcast 2025,
against Eskom's 2025 night thermal distribution and pumping, before the stopgap is removed.

### Congestion loss: a double count found, and the default set to the measured 0.24%, 3 Oct 2026

Build `2026-10-03f`. Why 7.2% and not 4%: the loss was booked twice, once in the net-load forecast
loop and again in dispatch. Dispatch applied it once; the reported total counted it twice (1.72 TWh
reported for 0.92 lost). At a 4% setting the reported share is now 3.7% of wind, solar and CSP,
which is 4% of wind and solar.

Default congestionCurtailPct 4 to 0.24, the measured rate (19.9 GWh against 8,397 GWh, NERSA,
January to June 2024). 4% stays available as the framework ceiling; the slider step went from 0.5
to 0.01, or the page would have snapped 0.24 to zero. Grid delay keeps its 10%.

Twelve weather years, one outage path:

```
                          before (4%)                  after (0.24%)
                     mean shed  worst  curtail TWh   mean shed  worst  curtail TWh
Today 2026              0        0         0            0        0         0
Deep decarbonisation    1.72    15.3      62.4         0.08      0.9      69.0
Fossil-free 2040        1.77    21.2     105.5         0         0       116.1
```

Both transition presets were sized with 4% of their wind and solar lost to congestion. They now sit
far inside their reliability target and are over-built; curtailment rises because more energy is
delivered into the same surpluses. Every curtailment range and preset-sizing figure above this
entry was measured at 4%.

Two harness results moved. The iron-air finding (Seriti scenario: 20 GW of 100-hour iron-air
barely moves July gas) now reads a 6.0% change, 803 to 754 GWh, against a published "nothing to
three significant figures": with more energy delivered there is some surplus for it to store.
Left failing pending a decision. The Homeflex shadow spread passes, 1.1x to 2.5x on eight draws,
because the representative week's peak price rose (3.40 to 7.39 R/kWh on the base draw). Why the
peak rose is not established.

### Curtailment: the model loses 7% of Today's renewables to congestion; reality is about 0.2%, 3 Oct 2026

Build `2026-10-03e`, Today 2026, default profile. The weather-extremes panel reports 0% because it
counts only surplus curtailment, which is zero. Congestion is counted separately and not shown:

```
                                  model            measured
renewable output                  22.2 TWh
surplus curtailment               0                 -
congestion loss                   1.72 TWh, 7.2%    19.9 GWh in H1 2024 against 8.4 TWh, about 0.2%
```

The measured figure is NERSA's renewable monitoring report for January to June 2024 (up from 4.6
GWh a year earlier, mostly late night to early morning, R46.2m of deemed energy to 40 IPPs). The
model applies congestionCurtailPct, 4%, which is NERSA's Congestion Curtailment Framework ceiling,
not an expected rate; Eskom said congestion curtailment would only be needed once the 3,470 MW in
its GCCA 2025 addendum connects, from about 2026. Why the model's share reads 7.2% rather than 4%
is not yet established. Every renewable-output and curtailment figure on a build near today's is
pessimistic by roughly this amount.

### Coal presets re-measured with common-mode trips, 480 draws each, 3 Oct 2026

Build `2026-10-03d`. Each draw its own outage path and one of twelve weather years, 40 per year.

```
                             mean shed GWh            worst-year mean GWh
                          independent  common-mode   independent  common-mode
Today 2026                    0.07        0.19           0.7          2.0      (960 draws)
Grid delay                    0.93        1.26           6.2          6.3
Latest IRP's 2030 targets     0.44        0.63           3.4          3.6
IRP path 2035                 0           0              0            0
Deep decarbonisation 2035     1.08        1.36          12.2         12.8
```

Common-mode trips raise mean shedding by a quarter to a half on every coal preset that sheds, and
barely move the worst year. Every preset stays under the 0.002% standard on the mean.

Deep decarbonisation was sized to a 2.07 GWh target on one outage path, where it read 2.02. Over
480 paths it reads 1.08 independent and 1.36 with common-mode: the single path was a bad one, and
the preset carries more margin than its 2x design. Re-sizing on many draws is open.

### Peaker seasonality is the fleet's 2025 recovery, not a season; check re-specified, 4 Oct 2026

ESK19679 by quarter, MW of unplanned outage and Q1/Q3 peaker output:

```
        Q1 unplanned   Q3 unplanned   Eskom Q1/Q3   model on that year's trace
2023       16,646         16,078          0.8               1.1
2024       14,701         11,404          2.1               6.9
2025       13,753         10,466          4.3               3.2
```

The 2025 ratio comes from the fleet recovering through the year; planned maintenance adds 1.3 GW
in Q1 against 3.3 GW from unplanned. 2023, bad all year, has none. Given each year's measured
availability the model reproduces the pattern; a seeded draw has no recovery trend, so it shows
1.1x, which is right for forward scenarios.

The benchmark's 8.5x was Eskom's own OCGTs only (8.4x in ESK19679); with the IPP OCGTs the model
also dispatches, it is 4.3x. The check now runs on the 2025 trace against 4.3x, band half to
double (2.15-8.6), and reads 3.2x on every outage draw. The band was set after seeing 3.2. On the
old seeded basis it would read 1.1x and fail. The old comment's mechanism, maintenance scheduled
away from winter, was the smaller part and is replaced. Suite 804/805.

### Seed sweep: three more draw-dependent checks, and peaker seasonality fails, 4 Oct 2026

Build `2026-10-04c`. Every simulation harness re-run on three copies that differ only in the
default outage draw. A check that flips is reading one draw.

```
check                                     normal / A / B / C        fix
peakerSeasonRatio (benchmarks)            2.6 / 0.2 / 0.9 / 0.5x    re-specified, see entry above
exports cut unserved (findings)           pass / pass / pass / fail mean of 8 draws: 18.9 -> 8.1 GWh
drInterruptCostR moves an output (resp.)  pass / pass / pass / fail measured 2025 outage trace
```

Unaffected on all three draws: invariants, consistency, weather, external, outputs, eng5.

Peaker seasonality is the real finding. Eskom's peakers ran 8.5x more in January to March 2025
than in July to September; the model's run 1.1x, so its peakers are not seasonal. It passed only
because the default draw put its shortages in summer. Likely cause: Eskom concentrates planned coal
maintenance in summer, and February-March 2025 held most of the year's shedding. Standing failure.
Suite 803/805.

### Three checks were passing on one lucky outage draw, 3 Oct 2026

Changing the random draw moved three harness results with no change to the fleet. Each now reads
the mean or median of eight draws:

```
check                                   one seed, before / after    eight-draw value
Homeflex shadow spread (consistency)       2.3x / 1.1x                 1.1x, FAILS
surplusGW 2025 (benchmarks)                2.2 / -2.0 GW              2.0 / 1.5 GW, passes
storage cuts unserved, eng5 check 6        20% / 6%                    11% / 11%, passes
```

The Homeflex check now fails on both builds, and that is the finding: in seven of eight outage
draws the shadow price of a representative winter week varies 1.1x against Homeflex's 3.9x. It
only matched when a scarcity event fell in that week. The hourly shadow price is nearly flat in a
normal week. Standing failure until the shadow price shape is investigated.

### Forward outage draws are independent per unit; they match Eskom's tails but miss its sudden drops, 3 Oct 2026

Build `2026-10-03c`. genUnitOutagePath draws each coal unit as its own two-state Markov chain, same
forced-outage rate and 480-hour repair time for every unit, nothing shared between units. Sixty
draws at 2025's coal availability (0.577) against ESK19679's measured coal-only availability,
each over its own mean:

```
                          2023    2024    2025    synthetic median (range of 60)
hourly sd                0.076   0.121   0.118    0.097 (0.069-0.140)
1st percentile           0.831   0.730   0.797    0.793 (0.674-0.851)
worst week               0.868   0.760   0.825    0.800 (0.682-0.879)
largest 6-hour fall      0.141   0.136   0.152    0.086 (0.066-0.132)
days falling >8% in 24h      9      16      16        4 (1-8)
```

The spread and the depth of bad weeks are reproduced. Sudden falls are not: 2024 and 2025 had two
to four times as many days losing more than 8% of the coal fleet in 24 hours as any of sixty
independent draws, and their largest 6-hour falls sit above the whole synthetic range. ESK19679
puts 4 to 7 such days a year in unplanned and other losses, not planned outage starts.

So correlated failures are real in Eskom's fleet (February 2025: Majuba's five units and Camden on
control systems) and show up as fast, short drops, not deeper troughs. They matter where storage
and peakers must respond within hours. Backcast 2025 is unaffected, as it runs on the measured
trace; every forward coal scenario runs on the independent draw. Adequacy effect not yet measured.

### The backcast gap, re-measured: inputs explain the energy, operation explains the shedding, 3 Oct 2026

Build `2026-10-03c`. Backcast 2025, its own 2025 profile. ESK19679 against the model, TWh:

```
                       Eskom 2025   model before   model now
coal                      170.4         161.6        168.9
imports                     6.57          8.87         6.57
hydro                       1.79          2.90         1.79
peakers                     3.36          1.29         2.32
pumped storage gen          4.49          2.76         2.67
shed, GWh                    390           9.4         17.6
```

The preset carried a typical year's imports (CF 0.88) and hydro (0.55), not 2025's drought (0.652,
0.339), and demand 2.5% below contracted. Set to Eskom's measured 2025 values, the model needs 7
TWh more coal and 1 TWh more peaking, and coal lands within 1% of Eskom's. Hydro was a literal in
three places; now hydroCF, read by the engine and the build LP.

What is left is operation, not energy. Eskom's own 2025 data:

```
shedding                    390 GWh on 17 days; about 70% in three weekends, 31 Jan to 9 Mar
shed 22:00-06:00            30% (corrected from 40%, see 12-hour clock entry)
shed at weekends            54%
pumping while shedding      about 1,000 MW on average; pumped-storage output 390 MW
peakers while shedding      941 MW of about 3,000
```

Eskom sheds to refill pumped storage and diesel for the week ahead (its stated one-week cycle),
on top of any hourly shortfall. The model sheds shortfall only. That is the adequacy standard's
measure, so the remaining gap is not an error in adequacy terms, but the backcast cannot
reproduce Eskom's shedding without Eskom's reserve targets, which are not published.

Tested and rejected: a reserve-floor rule that sheds to pump storage above a fixed share. At 30%,
50% and 70% floors it shed 1,064, 1,236 and 1,329 GWh, three times Eskom. Removed rather than
left in unsourced.

Added, off by default: Eskom's diesel tank and delivery limit (Ankerlig and Gourikwa, 82.5 GWh on
site, about 431 MW of deliverable output; Mining Weekly 2015, Business Day 2022). On in Backcast
2025. It does not bind there, and on by default it took NTCSA's MTSAO 2030 OCGT check from 45% to
34% utilisation, against the MTSAO's own assumption.

Not yet checked: whether the forward outage draws treat each unit independently. Correlated
failures (Majuba's five units and Camden in February 2025) are what US adequacy work found
standard models miss.

New check: every preset key must reach the model. Backcast 2025's importsCF and hydroCF were
dropped by applyState without error; it failed on that and passes now.

### Both forecasts on planned coal and outage state; no thermal charging into the peak, 3 Oct 2026

Build `2026-10-03b`. The coal-only charging forecast now uses the same coal basis as the
coal-and-gas forecast: planned commitment capped by the outage state held forward, not mean EAF.
Adopted on the user's decision for consistency, knowing it moves the backcast away from 2025.

As first built it charged storage from coal at the annual demand peak: default grid peak 29.6 to
31.7 GW, and four checks failed (peak-demand agreement, the demand-response finding, reserve
monotonicity at 55% EAF, peaker seasonality 1.9x against a 2-12x band). Thermal charging is now
barred from the day's expensive hours, as operators do not pump into the peak. All four pass.

```
                                     03a     switched     03b adopted    Eskom actual
Backcast 2025, own profile, shed GWh  13.8       0.3           9.4            390
Backcast 2025, OCGT TWh               1.58       1.03          1.29           3.4
Backcast 2025, twelve-year mean GWh   11.0       2.2           6.5
Today 2026, twelve-year mean GWh      1.93       0             0
Stalled loop build, worst year GWh    3.3        3.3           6.1            standard 4.46
```

The loop still converges: adequate on pass 2, worst year 4.3 GWh (2018) against 4.44. Build 15.4 GW
wind, 31.5 solar, 12.8 lithium at 6h, 2.7 gas. Grid delay, both IRP presets and Deep decarbonisation
unchanged to the reported precision. Suite 803/804.

Caveat: the backcast gap widens, and the planned-plus-outage basis is more foresight than Eskom's
2025 operation showed. Adequacy results on coal-retaining builds now describe an operator with good
outage information who does not pump into the peak.

### Adequacy loop converges: gas ahead of storage on a realistic coal forecast, 3 Oct 2026

Build `2026-10-03a`. Same stalled build and settings as the entry below, twelve weather years.

```
                       worst yr GWh   mean GWh   gas TWh   cost R bn
02d                        34.4          8.15      0.04      219.9
02e  gas charges           11.2          3.19      0.46      220.5
03a  gas ahead of storage   3.3          0.33      0.77      221.0
standard                    4.48
```

Two changes. Gas runs ahead of storage when the forecast shortfall beyond coal and gas exceeds the
energy storage holds, covering only what coal headroom cannot. And that forecast takes coal at its
planned commitment capped by the outage state held forward, not the mean EAF: 14.1 GW against 11.4
to 12.2 GW available in the stalled week.

The loop now reaches adequate on pass 2: worst year 4.0 GWh (2022) against 4.55. Build: 11.3 GW
wind, 34.8 solar, 14.2 lithium at 6h, 3.5 gas, 17.9 GW coal retired. A proposal until the presets
are re-run on it.

A first version placed gas after the reserve cap and raised Grid delay's worst year from 3.9 to 7.8
GWh. All seven presets unchanged across twelve years. The coal-only charging forecast still uses the
mean EAF; switching it takes Today 2026 from 1.93 GWh mean shed to zero.

### PROVISIONAL pending the storage fix - Adequacy loop decomposed: idle gas, then storage spent before idle gas, 2 Oct 2026

Build `2026-10-02e`. Fossil-free 2040 preset, horizon 2040, the loop's stalled build (14.6 GW wind,
32.7 solar, 2 rooftop, 13.0 lithium at 5h, 2.8 CCGT, 0.5 vanadium, 0.15 iron-air, 21.8 GW coal
kept). Stalled week 2016, days 17-23, twelve weather years, regional profiles.

The week in energy, before the change:

```
GWh                        optimiser (2040)   engine (2016)
coal                            1,721            1,800
gas                               325              120
lithium discharge                 399              182
shed                                0               30
before the first shed hour: coal headroom 113, gas idle 222
```

In every shed hour coal, gas, iron-air, vanadium and interruptible load were at their limits and
lithium was empty. The engine charged storage from coal headroom under forecast stress and never
from gas; the optimiser charges from both. Gas now charges storage when the forecast shortfall
exceeds coal and gas together, up to that shortfall (chargeFromThermal governs both).

```
                         mean GWh   worst yr GWh   standard   gas TWh   cost R bn
before                      8.15        34.4          4.45      0.04      219.9
gas to forecast (coal)      2.60        10.3          4.46      2.11      223.3
gas to forecast (c+g)       3.19        11.2          4.46      0.46      220.5   adopted
```

Charging gas to the coal-only forecast burns 2.1 TWh a year: that forecast is positive in 96% of
hours. The adopted rule keeps about nine tenths of the gain for a fifth of the gas. Loop stalls at 11.2
against 4.46, a factor of 2.5 (was 7.7).

What is left: on day 3 lithium discharged 57 GWh with nothing shed while 20 GWh of gas sat idle; days
4 and 5 then shed 10 GWh with lithium empty.

Presets: only Grid delay moves (mean 2.61 to 2.15 GWh, worst 7.3 to 3.9). Today 2026, Latest IRP's
2030 targets, IRP path 2035, Deep decarbonisation, Fossil-free and Backcast 2025 unchanged to the
reported precision.

### Lithium beyond 12 hours: a flat basin, cheapest at 16, 2 Oct 2026

Build `2026-10-02d`. Each preset as defined, only lithium power and duration varied. Twelve weather
years (2014-2025, regional profiles, capacity-weighted). For each duration, the least power whose
mean shed meets the presets' own target, half the 0.002% standard; searched to 100 MW.

```
                  Deep decarbonisation 2035              Fossil-free 2040
hours        GW    GWh   worst yr GWh  cost R bn     GW    GWh   worst yr GWh  cost R bn
  8        25.5    204        24.0       289.9      44.4   355        24.8       340.9
 10        20.4    204        24.0       288.6      35.6   356        24.5       339.0
 12        17.0    204        24.0       287.7      29.7   356        24.2       337.7
 14        14.6    204        23.3       287.2      25.4   356        24.6       336.7
 16        12.6    201        23.6       286.3      22.3   357        24.2       336.2
 18        11.7    211        21.7       287.9      20.3   365        24.1       336.9
 20        10.9    218        19.6       289.2      18.8   376        21.9       338.2
```

Adequacy is set by stored energy, not power, from 8 to 16 hours: about 204 GWh on Deep
decarbonisation and 356 on Fossil-free at every duration in that range. Cost is lowest at 16 hours
on both, R1.4bn and R1.5bn a year below 12 hours, 0.5%. Curtailment does not move (63.3 to 63.8 and
105.2 to 105.5 TWh). Reserve and synchronous floors met in every hour of every year at 12 and 16.

Caveats: 0.5% is inside the cost uncertainty: lithium capital is one source (NREL 2025 split, linear
in energy), with no augmentation or calendar degradation. Fewer inverters at long duration means
less grid-forming capability if SYNC_GFM_SHARE applies per megawatt; the floor still held. Ofgem's
first LDES window scored 16-18 hour lithium above 8-12 hour on security of supply and avoided
curtailment; this agrees on the first and finds nothing on the second.

The slider and the build LP were capped at 12 hours, so neither could reach this range. Both now
read LI_MAX_HOURS, 20. Presets unchanged at 12.

### Backcast 2025 rooftop sourced as a 2025 annual mean, 2 Oct 2026

Build `2026-10-02c`. Backcast 2025, its own preset, nothing else changed; the coal-charging rule on
unless stated. Rooftop 6,900 MW had no date or basis. Now 6,532: the 2025 annual mean of NTCSA's
monthly Estimated Rooftop PV rows, 6,830.2, less 298.3 MW of wheeled solar already in
`pvUtilityMW`. Source and basis in SOURCES.md.

```
rooftop MW   chargeFromThermal   shed GWh   OCGT TWh
6,900                0             12.3       1.52
6,900                1             11.9       1.52
6,532                1             13.8       1.58
Eskom actual                       390        3.4
```

The charging fix moved the backcast 0.4 GWh further from Eskom's 390; the rooftop correction moved
it 1.9 GWh closer. Peaker delivery remains the open gap.

### Reserve requirement now grows with variable generation, 22 Sep 2026

Build `2026-09-22al`. The ASTR's 2,200 MW of operating reserve is sized to 2030/31 on today's
fleet, and the model held exactly that in every scenario, so a 2040 system with 90 GW of wind
and solar carried the same reserve as one with 8. NREL's Operating Reserves and Variable
Generation (TP-5500-51978, 2011) sets out the planning rule: 3% of load plus 5% of variable
generation. Only the variable-generation term is added, and only above the output the ASTR was
written against, so today still comes out at 2,200 MW.

```
                          mean requirement MW   peak MW
Today 2026                       2,237           2,415
Backcast 2025                    2,221           2,360
Deep decarbonisation 2035        3,283           5,211
Fossil-free 2040                 3,535           6,012
```

Both presets still meet the reliability standard: Deep decarbonisation 3.42 GWh mean shed against
3.67, Fossil-free 3.09 against 3.46. An invariant now requires the requirement to rise with the
build; it fails on the previous build, where both read 2,200.

Also measured and inert: asHoldHours, how long storage must be able to sustain reserve output,
moves nothing between 0.25 and 2 hours on any preset. At these storage scales the energy test
never binds, so the value is not worth arguing about.

The Backcast 2025 preset now carries its own caveat: it sheds about 6 GWh against Eskom's actual
390, the difference is peaker delivery, and it should not be read as a validation.

### Storage dispatch: a state-of-charge floor does not help, and the benchmark is biased

Build `2026-09-22am`. Hourly state of charge per tier is now returned (socByTier), diagnostic
only. The storage questions of this session could not be settled without it: only throughput was
visible.

What it shows on Deep decarbonisation 2035 in 2016, the worst year. Lithium runs at 84% of its
200 GWh on 20 January and falls to 63% by the 495th hour, 28% by the 510th and empty by the
530th, where the system sheds 38 GWh. The event needs about 150 GWh over 40 hours and only
36 GWh of surplus arrives in the middle of it.

A strategic floor was built and removed. Holding back a share of lithium, released when the
forecast shows a shortfall in the lookahead window, made things worse:

```
floor share of lithium energy    0     15%    25%    40%    60%
Deep decarbonisation 2016       38      38    43.7   48.4   72.8
Fossil-free 2020                37.1   37.1   37.7   64.4  119.0
```

In these systems the release condition is true in most hours, so the floor is either inert or it
blocks discharge in hours that genuinely need it. Conserving energy does not help when the calls
on the store are real: the engine discharges 9.25 TWh and every megawatt-hour of it is covering
residual demand.

Charging is not the problem either. Only 0.5 TWh of the year's 61.6 TWh of spill occurs while the
store has room, across 90 hours. The store is full whenever there is surplus to take.

And the benchmark flatters the optimum. Its surplus series is the engine's charging plus its
curtailment, and the engine's charging includes pumped storage pumping - about 2.8 TWh a year that
the LP is free to put into the battery instead. Part of the measured gap is that. The benchmark
should net out pumping before the gap is quantified again, which is the next step rather than
another dispatch rule.

Sizing is the honest reading in the meantime: doubling duration to 16 hours, or power to 50 GW,
removes the 2016 shedding entirely.

### Iron-air already behaves seasonally

Build `2026-09-22am`, default weather year:

```
                            iron-air discharge   cycles/yr   months
Deep decarbonisation 2035         33 GWh            0.33      July only
Fossil-free 2040                   0                0         none this year
```

It fills through the year and empties into the winter, which is what the technology is for and
what the earlier 20 GW measurement found (92% July, 8% August). At a third of a cycle a year it
cannot be paid by an energy price: the capacity-payment argument in this file's long-duration
entry is the same finding at preset scale.

### The storage dispatch gap was mostly the benchmark, 22 Sep 2026

Build `2026-09-22an`. Charging is now split by destination (chargePsMW, chargeBattMW),
diagnostic only, and the benchmark rebuilt around it.

The old comparison took the residual from a run with the new storage REMOVED - a different
system, with different unit commitment and different pumped storage - and its surplus series was
the engine's total charging, which credited the battery with pumped storage's pumping: 8.07 TWh
of it on Deep decarbonisation 2035 in 2016.

The fair test asks whether an optimal schedule of the same store could have covered what the
engine actually asked of it, from what was actually available to charge it:

```
                                   engine shed   perfect foresight   gap
Deep decarbonisation 2035, 2016        38.0            30.8          7.2 GWh
Fossil-free 2040, 2020                 37.1            33.8          3.3 GWh
old comparison, Deep 2016              38.0             0.0         38.0
```

So the engine's storage dispatch is within about 10% of optimal, not a factor of anything. Over
twelve years the dispatch penalty is roughly 0.6 GWh a year on Deep decarbonisation and 0.3 on
Fossil-free, against a reliability standard of 3.7 and 3.5. The shed energy in those years is the
build being too small in a bad year, not the rule being wrong.

That also closes the entries above: the strategic floor was tested against an unreachable target,
and the "2 GWh a year against optimal" figure quoted earlier was measured the same way.
ldes_bench_all.js now builds the corrected series.

### Transmission charged once, region by region, 22 Sep 2026

Build `2026-09-22ao`. Until now every new MW paid a flat TDP-average rate AND capacity beyond a
region's headroom paid a separate reinforcement charge, both pricing the same deep network:
R2.1bn a year of double charge on Deep decarbonisation 2035 and R4.7bn on Fossil-free 2040.

One charge now, allocated to regions by REEA share and priced in three tiers, the supply-curve
treatment PyPSA and ReEDS use:

```
within today's GCCA headroom     0.25 x base   a bay, a transformer, a short line
within headroom the TDP builds   base x the region's distance multiplier
beyond both                      1.5 x that    new corridors past the published plan
```

The 1.5 is a judgement; the rest is the TDP-derived R402/kW-yr and the distance curve the model
already carried. Solar on retired-coal sites is exempt upstream and never reaches this.

```
                          transmission R bn/yr   was (flat + reinforcement)
Deep decarbonisation 2035          14.5                    18.4
Fossil-free 2040                   18.6                    24.1
```

How much of the TDP arrives now changes the bill, because it moves MW between the second tier and
the third: Fossil-free pays R18.6bn with the plan delivered, R21.8bn at half confidence and
R27.1bn with none of it. An invariant asserts both that response and the absence of the old
reinforcement line.

Retail, regulated / market R/kWh: Today 3.75 / 3.70; Deep decarbonisation 4.24 / 4.17;
Fossil-free 4.93 / 4.86.

The siting panel still carries its own inline copy of the old beyond-headroom arithmetic, and
capacity_siting.js's shared version is now unwired and labelled as such. Wiring the panel to the
tiered charge is the remaining half of this job.

### The siting panel now prices a megawatt as the engine does, 22 Sep 2026

Build `2026-09-22ap`. The panel ran its own arithmetic - corridor length times R31m per km over
45 years, with a grid-enhancing-technology uplift - while the engine priced the same megawatt
with the tiered regional charge. Two formulas for one cost.

Both now call txTierCharge, extracted for the purpose. The panel splits a proposed build across
the same three tiers and reports the annual charge and its R/MWh, with grid-enhancing technology
enlarging the headroom that pays the shallow rate rather than sitting in its own branch.

```
1,000 MW of wind            annual charge   R/MWh
KwaZulu-Natal, headroom         R101m        57.4
Northern Cape, none             R510m       139.0
```

An invariant checks the panel against the rates directly: a region with headroom must come out at
the shallow rate, one without at the beyond-the-plan rate. It fails on the previous build, where
the panel returns no annual charge at all.

capacity_siting.js still holds its own copy for a path the page does not use; the allowed-orphan
entry now says so.

### A 2035 counterfactual, and 27 TWh of phantom gas it exposed, 22 Sep 2026

Build `2026-09-22ar`.

New preset, IRP path 2035: what the published plan builds by 2035, on the same demand, rooftop
and weather as Deep decarbonisation 2035, so a comparison measures the transition rather than the
passage of time. Coal down 16 GW (Eskom's shutdown schedule to 2030 plus the MTSAO's 17 GW of
coal and gas by 2035); build straight-line interpolated between the IRP's published 2030 targets
and its 2039 totals - wind 22.2 GW, solar 18.9, storage 6.1 at 4h, gas 11.6 - with the IRP's 50%
minimum gas load factor on. The interpolation is mine; the IRP does not publish 2035 capacities.

```
                            R/kWh reg / mkt   system R bn   CO2 Mt   gas TWh   spill TWh
Today 2026                    3.75 / 3.70        210.4       155        0         0
IRP path 2035                 4.16 / 4.03        284.6        62       13.5      32.6
Deep decarbonisation 2035     4.24 / 4.17        291.2        29        0        65.7
Fossil-free 2040              4.93 / 4.86        346.8         0        0       120.4
```

Read against the plan rather than against today, Deep decarbonisation costs 2% more at retail and
halves the emissions. Against today it looked 13% dearer, which was comparing a 2035 system with
a 2026 one whose coal is largely paid off.

The defect it exposed. With the 50% gas floor on, forced output was added to generation and the
residual then clamped at zero, so in any hour the system did not need it the energy was burned,
counted and emitted with nothing on the other side of the balance. On this build that was 27.3
TWh of phantom gas against 34 TWh of gas generation. Forced output now serves the residual, then
displaces coal to its floor, then charges storage; what cannot be absorbed is not generated and
is recorded as an unmet floor. An invariant asserts the balance and fails on the old build by
36.6 TWh.

What moved: IRP path gas 34.0 to 13.5 TWh and CO2 74 to 62 Mt; the IRP 2030 preset 129 Mt against
the 148 recorded in the open items, so that comparison against the IRP's own 168 Mt needs redoing.
And the 50% floor is not reachable at this build: 20.4 TWh of it goes unmet, which is a finding
about the policy rather than the model.

### The IRP emissions comparison, redone, 22 Sep 2026

Build `2026-09-22as`. The open item recorded 148 Mt against the IRP's 168. Both figures are
superseded: the phantom-gas fix moved ours, and the IRP's own published number is 160 Mt.

```
IRP's 2030 targets preset      model          IRP 2025 as announced
grid demand                   224.2 TWh       255 TWh forecast (247 here with rooftop)
coal                          110.9 TWh       about 144 implied
gas                            24.7 TWh       about 26 at a 50% load factor on 6 GW
wind, solar, rooftop           86.8 TWh
CO2                            129 Mt         about 160 Mt
```

The IRP's 160 Mt implies roughly 144 TWh of coal at this model's 1.04 t/MWh, against the 110.9
the model dispatches. The difference is not the renewable build, which is nearly the same 87 TWh
either way, and only 3% is the demand level. It is that the model dispatches the remaining coal
on merit against that renewable output and the new gas, while the IRP's trajectory implies the
coal fleet running far harder. Whose coal utilisation is right is a real question and this is the
number to put to them, rather than a discrepancy to reconcile away.

Scope, stated rather than adjusted for: the model's universe is Eskom contracted demand excluding
exports, so its Today 2026 emissions are 155 Mt against Eskom's own roughly 180 Mt on 170 TWh of
coal. The gap above is larger than that scope difference.

Not comparable: the IRP path 2035 preset emits 62 Mt, but it runs at the transition presets'
demand (+5%) rather than the IRP's own (+20%), by design, so it cannot be read against the IRP's
142 Mt for 2035. Its preset comment now says so.

### Coal utilisation is where this model and the IRP disagree, 22 Sep 2026

Build `2026-09-22as`, IRP's 2030 targets preset, default weather year. The emissions gap traced
to one quantity: how hard the remaining coal fleet runs.

```
                               coal TWh   % of available   gas TWh   spill TWh   CO2 Mt
as the preset stands              110.9        62             24.7       0.6       129
at 68% EAF instead of 64          111.3        59             24.4       0.6       130
at the IRP's 255 TWh demand       117.3        66             25.9       0.3       136
with the plan's new wind and
solar removed                     156.1        88             29.4       0         175
IRP 2025 as announced             about 144    about 81       about 26              160
```

Available energy is the fleet after the plan's 8 GW of retirements at 64% availability, 177.7 TWh.

What the table says. Neither availability nor demand moves the answer much: 4 points of EAF moves
emissions by 1 Mt and the IRP's own demand level by 7. Removing the plan's renewables moves it by
46. So the disagreement is displacement - whether 87 TWh of new wind, solar and rooftop pushes the
coal fleet down to about 62% of its available energy, as the dispatch here does, or whether coal
keeps running at roughly today's rate, which is what the IRP's 160 Mt implies.

The model is not spilling to get there: 0.6 TWh of curtailment, so the renewables are absorbed and
the coal backs off. The MTSAO expects the same behaviour in the same years - coal at minimum
generation through the middle of the day and ramping up to 7 GW into the evening peak - and warns
about what that does to plant wear.

This is the question to put to the IRP team rather than a discrepancy to reconcile: at their build,
does their model keep coal at 80% utilisation, and if so, what stops the renewables displacing it?
A findings check now pins our side at 52-72% so that drift toward their figure is noticed.

### Export levels: today's constant is right, and every scenario holds it flat, 22 Sep 2026

Build `2026-09-23a`. The backcast needed 1,705 MW where the model carries 745, which raised the
question of whether other scenarios have the same vintage problem. They do not, but they do carry
an assumption worth stating.

Monthly export means in ESK19679: 1,687 MW in January 2026, 1,703 in February, 987 in the
transition month of March as Mozal stopped, then 684, 600, 652, 722 and 822 from April to August.
The settled post-Mozal level is about 700 MW, so the constant's 745 is right for 2026 and after.

What is assumed rather than derived is that it stays at 745 through 2035 and 2040. At the
pre-Mozal level instead:

```
                              spill TWh   shed GWh   system cost R bn   CO2 Mt
Deep decarbonisation 2035        65.7 -> 59.1   0 -> 5.7    291.2 -> 282.1   29 -> 32
IRP path 2035                    32.6 -> 29.6   0 -> 0      284.6 -> 279.8   62 -> 67
```

A restarted smelter, or SAPP demand growing into the same 1 GW, absorbs 6.6 TWh of what Deep
decarbonisation otherwise spills and is worth R9bn a year of system cost - and it starts the
preset shedding, so that build would need a little more capacity to stay inside the standard.
Imports need no such correction: the model delivers about 1,016 MW on average against 962 to
1,223 MW measured across the same post-Mozal months.

### Fleet availability to coal availability, in one function, 23 Sep 2026

Build `2026-09-23b`. Eskom, NERSA, the IRP and the MTSAO all publish availability for the whole
Eskom fleet; this model runs on coal alone, which is lower because nuclear, hydro, pumped storage
and the OCGTs are more available. The conversion was done by hand each time - 64 for the IRP's
66-68, 56 for the MTSAO's 60 - and hand conversions drift.

coalEafFromFleet now does it, and the presets and the MTSAO check call it:

```
                                         was     now
IRP 2030, Grid delay, IRP path 2035       64      63.0   (the IRP's 67% fleet)
Backcast 2025                             58.4    57.7   (2025's 62.4% fleet, nuclear 0.620)
MTSAO risk-adjusted check                 56      54.4   (the MTSAO's 60% fleet)
```

Against the years it can be measured on, with that year's nuclear output:

```
year         fleet   function   measured
2023          54.7      49.0      49.7
2025          62.4      57.7      58.4
2026 to Aug   68.1      64.7      65.3
```

Within 0.7 points, and a findings check holds it there. Nothing moves materially: the IRP 2030
preset stays at 129 Mt, the backcast goes from 6 to 9 GWh of shed energy, and the MTSAO case
stays inside its bands.

The non-coal availability behind it, 90%, cannot be read from ESK19679, which carries fleet
capability loss rather than per-station availability. It is corroborated instead, 23 Sep 2026.
amaBhungane's station-by-station Eskom data puts the coal fleet at 58% in calendar 2025 against
the 62% Eskom quotes for the whole fleet. Solving this arithmetic for that pair - fleet 62.4%,
nuclear at its measured 0.620 - gives non-coal availability of 89.9%, against the 90% assumed.
An independent, station-level number lands on the assumption to a tenth of a point.

Koeberg sits outside it. Nuclear enters the conversion at its own factor, 0.620 in 2025 and
0.609 in 2026 from the hourly data, so its stop-start does not ride on the 90%. What the
non-coal figure covers is hydro, pumped storage and the OCGTs, and the hourly data shows all
three reaching nameplate at some point in each year - pumped storage and hydro above it, the
OCGTs at 94 to 97% - so a 90% annual availability is consistent with what they deliver.

The live exposure is FIXED.nuclearCF at 0.70 for forward scenarios against 0.61 measured, which
moves a conversion by 0.4 points and is a separate open item.

### Koeberg's factor moved to the latest rolling year, 23 Sep 2026

Build `2026-09-23c`. The constant read 0.70, and it was right for the window it came from - the
twelve months to May 2026 measure exactly 0.700 sent-out on 1,880 MW. That window has since
rolled past a refuelling outage.

```
calendar 2022   0.631        12m to May 2026   0.700
calendar 2023   0.493        12m to Aug 2026   0.655
calendar 2024   0.472        2026 to August    0.609
calendar 2025   0.620
```

Now 0.66, the latest rolling twelve months, rather than a judgement about how far the recovery
from the 2023 and 2024 steam generator and life-extension outages runs. Backcast 2025 takes its
own year's 0.620. The rolling year is the figure to re-read when ESK19679 refreshes: a calendar
year lands on or off an outage.

What moved: nuclear 11.5 to 10.9 TWh a year, coal up by about the same, CO2 up 1 Mt on the coal
presets, and the backcast from 9.2 to 12.3 GWh of shed energy. The fleet-to-coal availability
conversion shifts 0.2 points, since it nets nuclear out at this factor.

Two pinned checks moved with it, deliberately. The curtailed-coal-fuel identity goes 14.642 to
13.9 R bn. And the physical check on Koeberg's output was assuming a 75-95% capacity factor,
which it has not delivered since 2022: rebased to 9-14 TWh, wide enough that a real return to
international performance still passes.

### Iron-air: what is sourced, what is not, and how much it matters, 23 Sep 2026

Build `2026-09-23d`.

Round-trip efficiency corroborated. Trade analysis of aqueous iron-air puts it at 40-50% against
85-90% for lithium, so the model's 0.45 is the midpoint of the published range. The build LP was
reading a hardcoded 0.45 of its own; it now reads the same constant as the dispatch.

Efficiency barely matters here, which is the point of the technology:

```
Deep decarbonisation, 35 W / 35 S / 25 GW Li + 1 GW Fe   mean cost R bn   mean shed GWh
iron-air at 0.35                                             294.9            4.05
iron-air at 0.45                                             294.9            3.83
iron-air at 0.55                                             294.9            3.66
```

Cost does not move at all, because the charging energy is spill, and shedding moves by a tenth of
a gigawatt-hour a year. A technology that runs a third of a cycle a year is not sensitive to how
much energy it loses on the way in.

Chemistry-specific O&M still does not exist at fleet scale. The one figure in circulation is
$5-15/MWh of throughput, from trade commentary rather than a cost study, and at this cycle count
it is about R5m a year against R165m of fixed O&M. The PNNL fixed figure stays.

Degradation likewise has no usable source, and at a third of a cycle a year a cycle-life limit
cannot bind inside a twenty-year life. Calendar degradation is the open question, and nobody has
fleet data yet.

Capex is where the answer lives. At the R127,050/kW this model uses, 1 GW of iron-air costs about
R8.4bn a year at a 2030 vintage, and it beats the lithium-only build by about R2.4bn. Forty per
cent dearer and the two are level; at Form Energy's USD 20/kWh target, R33,000/kW, iron-air wins
by roughly R6bn a year instead.

Lithium-only builds that meet the same standard, for anyone who wants to run without it: Deep
decarbonisation 35 GW at 8h, R302.7bn against R300.3bn; Fossil-free 50 GW, R351.2bn against
R348.5bn. Both preset comments now carry the alternative.

### Presets nudged back inside the standard

Koeberg's move from 0.70 to 0.66 took both presets marginally outside the NEM standard - Deep
decarbonisation to 3.83 GWh mean shed against 3.67, Fossil-free to 3.47 against 3.46. Lithium
raised 25 to 28 GW and 42 to 43 GW respectively:

```
                            mean cost R bn   mean shed GWh   worst
Deep decarbonisation 2035        300.3            2.40       27.3 (2016)
Fossil-free 2040                 348.5            2.90       34.8 (2020)
```

### Battery capital splits into power and energy, and both presets move to 12 hours

Build `2026-09-23f`, 23 Sep 2026. Battery capital scaled straight off duration, so an 8-hour
system cost exactly twice a 4-hour one of the same power. That makes inverters and balance of
plant free, and prices 20 GW at 8h the same as 40 GW at 4h - the same stored energy with twice
the power, for nothing.

NREL's Cost Projections for Utility-Scale Battery Storage (2025 update) splits the 2024 benchmark
into $241/kWh of energy capacity and about $372/kW of power capacity. At four hours that is
$1,336/kW, of which 27.8% is power. Capital at duration h is now the 4-hour constant times
(0.278 + 0.722 x h/4): unchanged at 4 hours, 1.72 times at 8 rather than 2.

Longer duration is therefore cheaper than the old scaling made it, and both presets move:

```
Deep decarbonisation 2035, same 1.75 GWh mean shed     mean cost R bn
20 GW at 12h + 1 GW iron-air  (preset)                     293.8
24 GW at 10h                                               294.8
30 GW at 8h                                                296.3

Fossil-free 2040, same 1.77 GWh mean shed
30 GW at 12h + 1 GW iron-air  (preset)                     338.3
36 GW at 10h                                               339.7
45 GW at 8h                                                341.7
```

Shedding is identical across 8, 10 and 12 hours on Fossil-free, so that system is energy-limited
rather than power-limited. The duration finding has been re-derived from 8h to 12h.

Both presets are now sized to about half the reliability limit rather than just inside it - 1.75
GWh against 3.67 on Deep decarbonisation, 1.77 against 3.46 on Fossil-free. The last three
sessions have twice pushed a preset out of compliance through an ordinary input refresh; the
margin costs about 1% of system cost and stops that. The definition they now carry is the
cheapest build meeting the standard with a 2x margin, which is still reproducible.

```
                          system R bn   retail regulated R/kWh
Today 2026                    210.7             3.75
Deep decarbonisation 2035     290.2             4.23
Fossil-free 2040              338.1             4.85
```

Two classes of lithium, 4-hour and 8-hour, were considered and are not needed: the dispatch pools
storage into one reservoir, and with power and energy now priced separately the build search can
already choose duration on cost. What is still open is that the build LP only offers 4-hour
lithium.

Due a re-run on this pricing: the storage saturation table and the duration-substitutes-for-power
finding, both measured when duration scaled linearly.

### Storage saturation and duration, re-run on the power-and-energy split

Build `2026-09-23f`, 23 Sep 2026. Both of the storage findings above were measured when battery
capital scaled straight off duration. Re-run here on Deep decarbonisation 2035 with the preset's
other settings held, shed energy priced at the IRP's cost of unserved energy, R87.85/kWh.

Saturation, at 12 hours, default weather year:

```
new lithium GW   system R bn   + shed at COUE   shed GWh   spill TWh   discharge TWh   cycles/yr
 0                  268.4          344.6           867        77.6         0.04            4
 5                  262.8          271.6           100        69.6         2.24           32
10                  269.2          270.2            11        66.2         4.72           36
15                  279.1          279.2             1        65.2         6.14           32
20                  290.2          290.2             0        65.2         6.20           25
25                  301.4          301.4             0        65.2         6.28           20
30                  312.5          312.5             0        65.2         6.28           17
40                  334.8          334.8             0        65.2         6.28           13
```

Saturation survives and is sharper than the old table: discharge stops moving at about 6.3 TWh
past 15 GW, spill stops moving at 65.2 TWh past 15 GW, and cycling falls from 36 a year to 13.
On the default year alone the cost optimum against COUE is around 10 GW; the preset carries 20
because it is sized on twelve weather years with a reliability margin, which the old entry's
single-year sweep could not see.

Duration, at equal stored energy of 240 GWh, twelve weather years:

```
                    mean cost R bn   mean shed GWh   worst
20 GW at 12h             293.8            1.75       20.5 (2016)
30 GW at 8h              296.3            1.75       20.5
60 GW at 4h              303.9            1.75       20.5
```

The old claim was that duration substitutes for power and is worth about 8%. On the corrected
pricing it is worth 3.3% between 4 and 12 hours, and the reliability is IDENTICAL to a tenth of a
gigawatt-hour across all three - the same stored energy buys the same reliability whatever the
power rating, because this system is energy-limited. The old 8% compared 20 GW at 12h with 40 GW
at 8h, which is 240 GWh against 320, so it was partly measuring more storage rather than better
storage.

Method, for the record: twelve weather years rather than one binding year, both cost and
reliability reported, shed energy priced rather than compared against zero, and no duration
assumed - which is what the two superseded entries each lacked one of.

### The build LP now prices lithium at the scenario's duration, 23 Sep 2026

Build `2026-09-23g`. Both build LPs offered 4-hour lithium at a 4-hour price whatever the
dispatch was running, so they were choosing between wind, solar, lithium, vanadium and iron-air
on the wrong economics - and both high-renewables presets now build at 12 hours.

bldStoreList hands each LP the same technology list with lithium at the scenario's duration and
the matching capital multiplier. The build coefficient now moves with it:

```
newBattHours    4        8         12
b_batt_2030   688,207  1,185,093  1,681,978
ratio           1.000    1.722      2.444
```

A perturbation check in validate_lp asserts those ratios; it reads 1.000 at every duration on
the previous build.

Still fixed, and the next step: the LP cannot CHOOSE the duration, because power and energy are
one build variable per technology. Splitting them - a variable in kilowatts and another in
kilowatt-hours, with the state-of-charge cap on the second, as PyPSA does - is what would let it
optimise duration rather than take it as given. The cost split that would price it now exists,
so this is wiring rather than sourcing.

### PROVISIONAL pending the storage fix - The build LP now chooses lithium's duration, 23 Sep 2026

Build `2026-09-23h`. Lithium is two build decisions rather than one: b_batt in megawatts for
inverters and balance of plant, eb_batt in megawatt-hours for cells, which is the PyPSA
formulation. The state-of-charge cap and the within-day discharge limit read the energy variable,
so the LP sets the duration instead of being handed one.

```
                          R/MW-yr or R/MWh-yr
power, b_batt_2030             191,322
energy, eb_batt_2030           124,221
recombined at 4 hours          688,207    the 4-hour annuity the constant is quoted at
power share                      0.278    BATT_POWER_SHARE, from the NREL split
```

Duration is bounded to 1 to 12 hours, matching what the rest of the model offers, so the LP
cannot answer with a 40-hour lithium system the dispatch could not run. Vanadium and iron-air
keep fixed durations: neither has a published power and energy split, and inventing one would be
worse than stating the limit.

The perturbation check that asserted the old behaviour is replaced by one that asserts the new
formulation: the two coefficients must recombine to the 4-hour annuity, the power share must
match the constant, and the duration rows must exist. On the previous build it reports that
lithium is still one build decision at a fixed duration.

### PROVISIONAL pending the storage fix - Solving it found a second thing: capacity credit was free of duration

Build `2026-09-23i`, 23 Sep 2026. With power and energy separated, the build LP was solved rather
than just built - dumped from the page and run through HiGHS offline (lp_dump.js).

The first solve built lithium at the one-hour floor: 550 MW of inverters a year and the minimum
energy the duration rule allowed. The reason was in the reserve-margin row, which counted a
megawatt of storage toward firm capacity whatever it could sustain. Free capacity credit for an
asset with no energy behind it.

Fixed by crediting storage at the lesser of what is built and its energy over four hours, which
is where published ELCC work puts the knee. The LP now answers:

```
                     built GW   built GWh   hours   credited GW
Deep decarbonisation 2035   2.75      11.0      4         2.75
Fossil-free 2040            2.75      11.0      4         2.75
```

Four hours in both, and exactly at the knee: it buys the energy that earns full capacity credit
and stops, because beyond that the marginal energy has no value at this margin in this LP. Both
scenarios build the same because lithium is at its build-rate cap of 550 MW a year, which is the
binding constraint rather than the economics - worth remembering before reading anything else
into the number.

Also fixed: the duration rows were named dmin_/dmax_, which is the diesel rows' prefix, so the
harness check was matching diesel rows rather than the new ones and would have passed with the
duration bounds missing entirely. Renamed battdur_min_/battdur_max_, and the check now requires
the capacity-credit rows too.

### PROVISIONAL pending the storage fix - The build pace was the answer, not the economics, 23 Sep 2026

Build `2026-09-23j`. The build LP defaulted to the IRP 2025 pace, whose 550 MW a year of storage
comes from the plan's 8.5 GW by 2039. That cap bound in every scenario solved, so the LP was
reporting the plan's procurement schedule rather than what the system wants. South Africa is
already building faster than that: the storage windows alone have run near 0.6 GW each, with
Eskom's own programme and private projects on top.

A new default pace, Deliverable: Masterplan rates for wind, solar and gas with storage at 2.5 GW
a year. The storage figure is a judgement about what can be delivered, not a published target,
and it says so. The IRP pace stays as an option, which is the right constraint for questions
about the plan.

What the LP answers once the cap is lifted:

```
                            at the IRP pace              at the deliverable pace
Deep decarbonisation 2035   2.75 GW batt, 4h, 2.5 gas    5.9 GW batt, 3.6h, no gas
Fossil-free 2040            2.75 GW batt, 4h, 5.9 gas    8.7 GW batt, 4h, no gas
```

The gas is the finding. At 550 MW a year of storage the LP builds gas to cover the evening peak;
at 2.5 GW a year it builds none in either scenario, because storage is cheaper than gas once it
is allowed to arrive fast enough. The same question the IRP is answering with 16 GW of gas by
2039, and the answer here turns on the procurement pace rather than the relative cost.

Neither run is at the new cap, so these are economics rather than a constraint - which was the
point of lifting it.

### PROVISIONAL pending the storage fix - Gas and the build pace: the sensitivities, 23 Sep 2026

Build `2026-09-23k`, Fossil-free 2040 through the build LP, solved offline with HiGHS.

Storage pace is what decides it:

```
storage build rate MW/yr    batteries built GW   duration   gas built GW
 500                                2.5             4h          2.0
1000                                5.0             4h          0.9
1500                                7.5             4h          0
2000                                8.7             4h          0
2500 (the default)                  8.7             4h          0
```

Gas disappears between 1.0 and 1.5 GW a year of storage. Above 2 GW a year storage stops at 8.7
GW on its own economics rather than the cap, so the answer is no longer pace-limited.

Gas cost is not what decides it. At the deliverable pace the LP builds no gas at any fuel price
from R1,000 to R2,800/MWh, and none at any capital cost from R12,000/kW - USD 727, below every
current benchmark - up to the R34,965 the model carries. A four-hour battery is simply cheaper
per kilowatt of firm capacity than a CCGT, and it earns arbitrage on top.

So the finding is narrow and strong at the same time: on this model's costs, new gas is not
economic for covering the evening peak at any plausible gas price, PROVIDED storage can be built
at 1.5 GW a year or more. Below that, gas returns - which is the position the IRP's own storage
schedule puts the country in.

What this does not cover, and should be said whenever it is quoted. The FUEL price is derived
from the LNG chain - a full-year JKM reference of about $18.50/MMBtu delivered, through
efficiency and exchange rate to R1,968/MWh - so the gas price is not the weak point. What sits
outside the model is the INFRASTRUCTURE case: the import terminal's capital as a lumpy
investment rather than a per-unit adder, industrial gas demand to share those fixed costs, the
Mozambique supply cliff that makes the terminal urgent, and the argument that gas plant anchors
the terminal so industry can be supplied. A power-sector model cannot weigh that last one,
because the benefit sits outside it. Corrected 23 Sep 2026: an earlier version of this entry said
the model had no LNG import economics at all, which was wrong about the fuel price. It also assumes the reliability standard on
the twelve-year average, and the weather years are reanalysis.

The CCGT capital constant, which carried no note, is now sourced: GridLab's September 2025 study
of actual projects puts recent combined-cycle capital at USD 2,000/kW or more against USD
1,116-1,427 for 2026 and 2027 completions, and the model's R34,965/kW is USD 2,119. The negative
decline rate is deliberate: gas turbine capital is rising.

### PROVISIONAL pending the storage fix - What South Africa is actually building, against the pace the gas result needs

Build `2026-09-23l`, 23 Sep 2026. The no-gas result holds above about 1.5 GW a year of storage,
so the question is what the country has actually procured.

```
programme                         procured        note
BESIPPPP, three windows        1,744 MW / 6,976 MWh   online by 2027/28, four-hour systems
RMIPPPP hybrid storage           600 MW / 2,545 MWh
Eskom's own projects             343 MW / 1,440 MWh   mostly slipped
total                          about 2.7 GW           over roughly four years
```

That is 0.6 to 0.7 GW a year, close to the IRP's 550 MW rather than to the pace the default
assumes. So the default is an ambition about three times the achieved rate, and the threshold the
gas result needs, 1.5 GW a year, is still two to three times it.

The default was trimmed from 2.5 to 2 GW a year on 23 Sep 2026, and nothing moved: 2 GW is the
SMALLEST rate at which the build LP is not sitting at its cap. At 1.5 it builds exactly its
five-year allowance of 7.5 GW, so the pace is answering; at 2 and at 2.5 it builds 8.7 GW on
Fossil-free and 5.6 on Deep decarbonisation, and stops on cost. Choosing the smallest
non-binding value leaves the assumption doing as little work as it can.

This cuts both ways and both should be said. The IRP's storage schedule is not obviously too slow
against what the country has delivered - it is roughly what is happening. But the consequence is
that the plan's gas case is a consequence of its own storage pace: on this model's costs, storage
at two to three times the current rate removes the need for new gas entirely, and storage at the
current rate does not.

One corroboration worth noting: every procured project is a four-hour system, which is the
duration the build LP chooses when it is free to choose.

The pace comment now carries this evidence, so the 2.5 GW figure cannot be mistaken for a
measurement.

### The optimiser now says what it chose and what it was stopped by, 23 Sep 2026

Build `2026-09-23n`. Two gaps in how the build LP reports itself, both of which could let a
constrained answer read as an economic one.

The regional optimiser - the default selection - never said when a technology was at its build
rate. The national one has carried that flag for weeks. It now does too, read off the duals on
the national build-rate rows rather than recomputed.

And neither reported the duration the LP chose, which only became a decision yesterday. Both now
read it out, in hours and in GWh across GW, and say when it is sitting on the 1-hour floor or the
12-hour ceiling rather than choosing on cost. That is the distinction the whole exercise turned
on: the first solve after the split sat on the floor, and without this line the only way to know
was to dump the LP.

### One capacity-credit rule for every store, 23 Sep 2026

Build `2026-09-23o`. Lithium was credited at what its energy could sustain from yesterday, while
vanadium and iron-air were still credited at fixed multiples of a lithium megawatt - 1.8 and 3.6
times. An iron-air megawatt therefore counted as 3.6 MW of firm capacity in the reserve margin.

That was a relative derate from an era when lithium's duration was fixed at four hours. Once
lithium's duration became a decision the two treatments could not both stand.

Every store is now credited at the lesser of its power and its energy over four hours. A
four-hour lithium, an eight-hour vanadium and a hundred-hour iron-air all count fully; a shorter
store counts proportionally.

Nothing moved in either scenario - neither long-duration technology is built at its current cost,
and not at iron-air's optimistic USD 20/kWh either, so the inflated credit was never what kept it
out. The point is that the next person changing a storage cost will get an answer from one rule
rather than two.

Stated simplification: real effective load-carrying capability rises somewhat with duration
beyond four hours and falls as storage penetration grows. No South African study exists to
calibrate either effect, so the rule is flat above four hours.

### The reserve price is sourced now, and the ancillary numbers are quotable

Build `2026-09-23p`, 23 Sep 2026. The ancillary revenue figures rested on two numbers with no
derivation: a reserve price of R150/MWh and a 15% held-back share. The price now has a source.

NTCSA's MYPD 6 revenue application, Table 10, is what the System Operator actually pays.
FY2026: reserves R1,445m and demand-response reserves R521m, so R1.97bn for reserve. Against a
reserve requirement whose hourly mean this model puts at 2,237 MW, that is R100/MWh of capacity
held, against the 150 assumed. The rest of that table is not reserve and is not in the number:
reactive power R468m, system restoration R376m, Power Alert R78m.

```
                            assumed R150    applied R100    approved R52
ancillary revenue          R197,100/MW-yr  R131,400/MW-yr  R68,328/MW-yr
paid to the 3.5 GW fleet   R695m           R463m           R241m
share of the reserve pot   35%             24%             24%
```

Which of the two derivations is the default matters, and it is the lower one. NTCSA APPLIED for
R1,966m of reserve; NERSA APPROVED R1,518m of ancillary services in total, of which the
application's reserve share is about R1,017m. An application is not an outturn and NERSA applies
a prudency test - the same reasoning the fixed O&M block already carries - so the default is
R52/MWh with R100 as the upper bound. Quote the range, not a point.

Twenty-four per cent of the reserve pot going to storage, with the rest to coal and demand
response, is the right order: Eskom Generation is still the largest reserve provider. A check
now asserts the model never pays storage more than the whole approved allowance.

The 15% held share stays a judgement and is labelled as one. ERCOT batteries offer far more than
that, but they do it in a market that pays for it, and South Africa has none to bid into.
Sensitivity is linear, so any revenue figure quoted from this panel has to carry the share with
it.

What this means for the ancillary recommendation: the saturation SHAPE was always robust, and
the revenue LEVEL is now defensible to within the one remaining assumption. The knee is
unchanged at about 4.5 GW against a 3.5 GW fleet, because the knee depends on the requirement
rather than on the price.

### The rest of the ancillary budget: where it sits, and what is not modelled

Build `2026-09-23q`, 23 Sep 2026. NTCSA's ancillary services are R2,946m in FY2026, of which
this model prices only reserve. Checked where the others sit rather than assuming they were
missing.

They are already in the retail stack. NETWORK_RETAIL_R carries NTCSA's wires business including
R1,518m of approved ancillary services, so reactive power, system restoration and Power Alert
are inside the network line a household pays. They are correctly ABSENT from system cost, for
the same reason reserve and inertia payments are: they are transfers to providers, not
resources consumed.

What is not modelled is the REVENUE side of two of them, and one is growing fast:

```
NTCSA application            FY2026    FY2027    FY2028    FY2030
system restoration            R376m     R785m   R1,689m   R3,741m
reactive power and voltage    R468m     R436m     R475m     R637m
```

System restoration spend is applied to rise nearly tenfold by FY2030, because a grid with less
synchronous plant needs more black-start capability in more places, and NTCSA says so in its own
risk section. Batteries and grid-forming inverters can provide both black start and reactive
power. Neither is a revenue stream in the storage panel, so every storage business case here is
missing them.

That is a gap worth naming rather than filling badly: there is no South African price for either
service yet, which is precisely what the ancillary market design work would settle.

### Voltage support priced; system restoration deliberately not

Build `2026-09-23r`, 23 Sep 2026. Checked first that neither service was hiding in a generic
ancillary bucket: the model had exactly three ancillary levers - reserve, inertia and capacity
payments - and no reactive power or black start anywhere.

Reactive power is now a revenue line, off by default. A battery inverter can supply or absorb
reactive power whether or not it is moving energy, and NTCSA buys R468m of it a year.

```
                        R/MW-yr
GB obligatory service    34,500   about GBP 1,500/MW-yr, what batteries have actually earned
GB Capenhurst contract   60,000   about GBP 2,600/MW-yr over nine years, the only long-term
                                  reactive-power deal a battery has won - the default here
```

It saturates on the reserve principle, against NTCSA's own R468m budget: R60,000/MW-yr at
today's 3.5 GW fleet, 45% of the budget, falling to R46,800 at 10 GW. A check asserts it can
never exceed what the System Operator buys.

Against a reserve line of R68,328/MW-yr, voltage support is nearly as large. That is the finding:
a service South Africa already pays for, that storage can provide, and that no storage business
case here has been counting.

System restoration is NOT priced, deliberately. It is the bigger budget - R376m in FY2026 rising
to R3,741m by FY2030 - but no battery anywhere has yet won a restoration contract; NESO has taken
batteries only as far as feasibility studies. There is no price to put here and inventing one
would be worse than the gap.

Corroboration for a constant already in the model: GB stability contracts, which pay for inertia
and short-circuit level from grid-forming batteries, cleared at GBP 5,000-25,000/MW-yr, about
R115,000-575,000. The model's inertia payment is R100,000/MW-yr, at the bottom of that range.

### The bill, not the rate, 23 Sep 2026

> A BRIEFING VERSION of this finding was issued on 23 Sep 2026 for use outside the project -
> self-contained, with the model, the scenarios and the caveats written out. It is a snapshot,
> not a second source of truth: if any of the numbers below move, it needs reissuing, and the
> copy in circulation should be replaced rather than corrected in place.
>
> RATE CORRECTED 23 Sep 2026. The box priced the bill off the unweighted mean of the hourly
> series, which appears nowhere on screen - and which the table's own comment calls a figure
> describing no customer, since nobody consumes flat across 8,760 hours. It now uses the
> load-weighted "Dynamic pricing, habits unchanged" row, which a reader can find in the table
> above it. Today 2026 moves R3.75 to R3.78/kWh; the 900 kWh bill R3,909 to R3,936, the 190 kWh
> bill R1,248 to R1,254. The fixed shares, 14% and 43%, are unchanged.

> CUT BACK the same day. The retail panel now shows only the translation from R/kWh to a monthly
> bill, with the fixed charge and its share. The rooftop comparison was removed from the panel:
> it needs a self-consumption share and an export-credit assumption that nothing else in that
> panel uses, and the distributional finding belongs here, where the caveats sit beside it. The
> numbers below stand; they are just no longer on screen.

Build `2026-09-23s`. Every figure in the retail panel was R/kWh, and no household experiences
R/kWh: it experiences a monthly bill with a fixed charge in it, which is precisely what the
revised pricing policy is arguing about. The panel now shows both.

Two reference households, because South Africa does not have one. Eskom has used 30 kWh a day -
900 kWh a month - in tariff work for years, and the Homepower fixed charge of R536 applies to
that class. The average electrified household actually uses about 190 kWh a month, from Eskom's
residential demand over Statistics South Africa's household count. Eskom's reference describes a
minority, and the gap between the two IS the affordability argument.

Monthly bills, regulated basis, rooftop covering 60% of consumption and no export credit:

```
                             900 kWh household          190 kWh household
                          no roof   roof   saved      no roof   roof   saved
Today 2026                 R3,909  R1,885   52%        R1,248   R821    34%
IRP path 2035              R4,286  R2,036   52%        R1,328   R853    36%
Deep decarbonisation 2035  R4,341  R2,058   53%        R1,339   R857    36%
Fossil-free 2040           R4,898  R2,281   53%        R1,457   R904    38%
```

The finding is in the last column. Cutting 60% of consumption cuts the larger household's bill by
about half, and the smaller one's by about a third, because the fixed charge is 43% of that
household's bill before a single unit is bought. Rooftop pays a household that already uses a lot
far better than one that does not, at the same self-consumption share, and the fixed charge is
the reason.

That is the same mechanism the pricing policy raises from the other side, asking whether
solar-equipped households using the grid for backup contribute fairly to network costs. On these
numbers the fixed charge is already doing most of that work for the small household and much less
of it for the large one.

### Four harnesses now wait on the page rather than a stopwatch, 23 Sep 2026

No model change. validate_benchmarks, validate_consistency, validate_response and
validate_outputs each slept a fixed 4 to 4.5 seconds before measuring anything. That is right
until the day the page takes longer - a slower machine, one more data file - and then the harness
measures a half-loaded page and reports failures that are not there. This project has already
paid for that lesson once, in the eleven false failures a missing profiles.json produced.

index.html sets GTZA_READY when every input has settled and the first run has finished. All four
now poll it, keeping the old delay as a ceiling rather than as the wait. Counts are unchanged -
28/28, 80/80, 84/84 and 42/42 - which is the point: the same answer, no longer resting on the
page being fast enough.

Still on timers: validate_solve, which waits on a solver rather than on page load, and
validate_external, which polls the weather-year load it triggers itself.

### The two 2030 presets were priced at 2026, 23 Sep 2026

Build `2026-09-23u`. The IRP's 2030 targets and Grid delay carried no scenario year, so both
defaulted to 2026: their new build was priced at 2026 capital with no learning, and the retail
panel charged them 2026 contract positions. A 2030 scenario should be priced at 2030.

```
                            new capex R bn    system R bn    avgCost R/MWh
IRP's 2030 targets, at 2026        69.8           298.4          1,298
                    at 2030        67.5           290.7          1,263
Grid delay, at 2026                53.7           296.5          1,290
            at 2030                52.5           289.9          1,261
```

About R8bn a year and 3% of average cost on each, all of it four years of technology learning the
presets were not seeing. Retail comes out at R3.59 and R3.58/kWh regulated.

Small in itself, and worth noting for the class of error rather than the size: a preset that
names a year in its own title had no year set, and nothing checked. The two transition presets
and IRP path 2035 all carry theirs.

### Storage discharging at a zero price: does not reproduce, 23 Sep 2026

Build `2026-09-23v`. A standing defect recorded 120 hours in Deep decarbonisation where batteries
discharged into a zero price. Re-measured on both high-renewables presets:

```
                             hours discharging at a price under R10   discharging while spilling
Deep decarbonisation 2035                      0                                 0
Fossil-free 2040                               0                                 0
```

Nothing to fix. The storage dispatch has been rebuilt twice since that note - the long-duration
lookahead, then the adequacy hold - and the presets themselves have changed shape. Closed by
measurement rather than by a change.

What the same measurement did show, and it is deliberate: Deep decarbonisation prices negative in
772 hours, 8.8% of the year, as low as R225/MWh below zero. That is the coal-forced spill rule
working as designed - coal pinned at its must-run floor while wind and solar spill - and the
comment behind it records the calibration: an earlier version priced every spill hour negative
and produced 5,614 negative hours, 64% of the year, against roughly 460 in Germany in 2024. The
current rule counts only hours where removing coal's floor would have absorbed the spill.

### Housekeeping batch, 23 Sep 2026

Build `2026-09-23w`. Five items cleared in one pass, and two of them were checks that could not
fail.

**A preset that names a year must set it.** Both IRP presets carried 2030 in their titles and no
scenario year, which cost R8bn a year each in unpriced technology learning, and nothing was
looking. A findings check now compares every preset's title against its scenarioYear. It caught
two more: Today 2026 set none, and Backcast 2025 set 2026. Both fixed, and the retail year
control now reaches back to 2025 so the backcast can express its own year.

**eng5's storage check could not fail.** Its tolerance was an absolute 0.02 TWh, 20 GWh, against
a total variation across the sweep of about 16 GWh - so a regression that RAISED unserved energy
by anything up to 20 GWh passed. Now each step may rise by at most 2% of the starting value and
the sweep as a whole must cut unserved energy by a tenth. Tested against synthetic series: a flat
sweep and a rising sweep both fail the new rule and both passed the old one.

**capacity_siting.js lost its own siting path.** gridBuildChargeFor and evaluateDeployment priced
a connection with corridor length times a cost per km, while the engine and the panel priced the
same megawatt with the tiered regional charge. Two formulas for one cost, and neither had a
caller. Deleted, and the allowed-orphan entry in validate_structure deleted with them.

Worth recording how that went wrong first: the deletion left a stray brace, the file stopped
parsing, and the symptoms were FIRM_TECHS undefined in one harness and tdpConfidencePct reported
as a dead control in another - neither of which points at a missing closing brace. The suite
found it immediately; reading the two failures did not.

**Two data files carry a licence now**, so validate_capacity is 31/31 with no standing flag.

**SOURCES** gained the GCCA Annexure A substation limits as a watched source and the Northern
Cape export-by-day pattern as the natural first regional validation test.

### Batch B: rooftop, municipal bills and a caveat the panel needed, 23 Sep 2026

Build `2026-09-23x`.

**The rooftop view, rebuilt with arithmetic behind it.** Three controls - self-consumption, system
size and feed-in rate - now feed a calculation: grid purchases fall by what is used as generated,
exports earn the feed-in rate, and the fixed charge does not move.

**Municipal households are in it too**, at City Power Johannesburg's real Residential Single Phase
80A tariff: five inclining blocks from R2.8827 to R3.9319 before VAT, plus R1,289.23 a month
fixed. Those rows do not move with the scenario - they are what that household pays today, for
comparison. A national municipal average would describe nobody, since fixed charges vary by a
factor of 62 across distributors.

At a system sized to 100% of annual use, 60% self-consumed, exporting at Cape Town's R1.53:

```
                        no rooftop   with rooftop   saved
Today 2026
  Eskom direct, 900 kWh    R3,936        R1,345      66%
  Eskom direct, 190 kWh    R1,254          R707      44%
  City Power, 900 kWh      R4,661        R2,125      54%
  City Power, 190 kWh      R2,112        R1,618      23%
Fossil-free 2040
  Eskom direct, 900 kWh    R4,898        R1,730      65%
  Eskom direct, 190 kWh    R1,457          R788      46%
```

The City Power rows are the sharper version of the earlier finding. That distributor's fixed
charge is R1,482 a month with VAT, so a 190 kWh household saves 23% from a system covering its
entire annual consumption, against 54% for the 900 kWh household on the same tariff. Blocks make
it worse rather than better: the small household never reaches the higher blocks, so the units it
displaces are the cheapest ones on the schedule.

**And the market basis now says when it cannot be quoted.** Above 100 shed hours it prices every
one of them at the shortage price, so the mean is an administrative ceiling rather than a market
outcome. The panel says so, with the hour count, and points at the regulated basis. Tested on a
forced-shedding scenario: 955 hours, warning shown.

### A growth percentage is not a demand mapping, 23 Sep 2026

Build `2026-09-23y`. The two demand derivations in this model looked inconsistent - the IRP
preset at +20%, the NTCSA check at +15% - and reconciling them showed the percentage is the wrong
thing to compare.

The same setting lands on a different TWh in every scenario, because the base moves with the
rooftop fleet:

```
preset                       demand setting   Eskom-served TWh
Deep decarbonisation 2035          +5%             183.3
IRP path 2035                      +5%             183.3
Fossil-free 2040                   +5%             173.0
IRP's 2030 targets                +20%             224.2
```

Ten terawatt-hours between two presets on the same setting, because Fossil-free builds 16.8 GW of
new rooftop against 10.8 and rooftop is behind the meter.

So the target is the TWh and the percentage is only how this model is told to reach it. On that
basis the NTCSA check was wrong: its derivation asks for 222.4 TWh and +15% produces 217.1. It is
now +18%, which produces 224.3.

THAT CHANGES THE COMPARISON, and not in our favour:

```
                          unserved TWh   OCGT utilisation
NTCSA risk-adjusted 2030   more than 4        about 45%
this model at +15%             5.9              52.4%
this model at +18%             7.9              58.9%
```

The unserved check still passes. The OCGT check now fails at 58.9% against a band topping out at
58. That is the right outcome rather than a problem to fix: the demand figure was derived, the
peakers work harder than NTCSA's at that demand, and the check says so. Tuning the demand back to
15% to keep the check green would be fitting the input to the answer.

Also documented, because it had never been written down: the +5% carried by the two transition
presets and the IRP counterfactual is about half a percent a year to 2035 - electrification and
industrial recovery against efficiency and continued grid defection. It is not the IRP's
forecast and not a forecast of this project's own. It is held constant across the three so the
comparison between them is about the build.

### Megawatts retired is not value retired, 23 Sep 2026

Build `2026-09-23z`. With the stranded-cost toggle off, retired coal was removed from the asset
base in proportion to MW retired - while the regulated asset base was also being run down by its
own run-off schedule. The same reduction twice, and in the wrong proportion: retirement runs
oldest first, and the oldest units are the most depreciated, so megawatts overstate the book
value leaving the base.

Value share now, from the per-unit retirement dates the engine already carries. A unit's
remaining book value is proportional to its remaining life, so a station retiring in 2027 carries
almost nothing and Medupi carries almost all of its capital.

```
R/kWh in the retail stack        existing capital        stranded part
Deep decarbonisation 2035
  stranded on                     0.222 (unchanged)   0.121 -> 0.064
  stranded off                    0.101 -> 0.158              0
Fossil-free 2040
  stranded on                     0.177 (unchanged)   0.142 (unchanged)
  stranded off                    0.035 (unchanged)           0
```

Deep decarbonisation is where it bites, because it retires 27 GW of a 39.7 GW fleet - mostly old
plant. Half the stranded cost it was carrying was not stranded at all: those assets were nearly
written off. And with the toggle off, its existing-capital line rises by 5.7c/kWh, because the
MW-proportional removal had been stripping out book value that is still in the base.

Fossil-free does not move, which is the check on the correction: it retires everything, so value
share and megawatt share are both zero.

### The short-term IPP programmes, sourced

Same build. The model ends their cost after FY2028 and the MYPD 6 table does not say when they
end, so the contract structure decides it. NTCSA's own page: the Standard Offer is three-year
contracts with existing producers, and Emergency Generation is daily, weekly or monthly offers
dispatched on price. Neither carries a tail, so ending the cost is what the contracts support.

The risk runs the other way, and the comment now says so: these are re-procured rather than
expired, and have been since 2022. R9,787m a year is about 5c/kWh on the transition presets'
183 TWh - larger than the entire new-transmission line in the retail stack.

### Cross-check against published least-cost work, 23 Sep 2026

Build `2026-09-23z`. A full PyPSA-ZA comparison is not available - that model co-optimises
investment and operation while this one dispatches a specified build, which is the reason it was
kept out of the external checks in the first place. Two weaker but real comparisons instead.

**A band check, now in the suite.** The CSIR's systems-analysis technical report gives least-cost
installed capacity ranges across CO2 ambition levels: 15-40 GW of solar and 20-45 GW of wind by
2030, rising to 30-75 and 35-70 by 2050, with no new nuclear, coal or CSP in any least-cost mix.
Both presets sit inside:

```
                           wind GW   solar GW
Deep decarbonisation 2035     39.6      38.3
Fossil-free 2040              46.6      58.3
CSIR 2030 range              20-45     15-40
CSIR 2050 range              35-70     30-75
```

Not agreement - different horizons, different method - but a preset landing outside those ranges
would be a claim no published South African least-cost study supports, and the check now says so.

**A comparison worth more than the band.** An independent 2024 study of firm-dispatchable
generation in South Africa finds a renewable-based system needs 49 GW of new wind, 14 GW of new
utility solar, 24 GWh of new batteries and 15 GW of firm-dispatchable plant running at 5%
utilisation, retaining 12.9 GW of baseload.

Ours retains 12.7 GW of coal, which is the same answer on baseload. The difference is the last
two lines: they carry 24 GWh of storage and 15 GW of peakers; we carry 243 GWh of storage and no
gas at all.

That is the storage-versus-firm trade this project measured from the other direction on the build
pace: with little storage the system needs firm capacity, and the crossover in our model is
somewhere above 1.5 GW a year of storage procurement. Two independent models, the same trade,
resolved differently because they assume different storage volumes. Worth putting to them.

### The nodal model held no reserve unless someone priced it, 23 Sep 2026

Build `2026-09-24a`. The regional MIP has proper reserve constraints - discharge and reserve
competing for the same megawatts, reserve backed by stored energy rather than promised - but they
were only built when the reserve requirement passed in was above zero, and that requirement was
set only when the user switched ancillary PRICING on.

So at defaults the nodal model dispatched with no reserve held at all, while the national engine
held 2,200 MW in every hour of every scenario. Two models of the same system, one ignoring a
requirement the other treats as binding.

Whether reserve is PAID FOR is a market question; whether it is HELD is not. The requirement now
follows reserveEnabled, which is what the engine itself uses, so the nodal path is live at
defaults: about 9.6% of mean load, the ASTR's 2,200 MW over 22,901 MW. The contingency term is a
fixed megawatt figure that cannot be expressed as a share of load and is still excluded, which
understates the requirement rather than inventing a conversion.

The exports sensitivity is closed too, without a preset: the slider's own note now carries the
measurement. At the pre-Mozal 1,705 MW, Deep decarbonisation absorbs 6.6 TWh of what it otherwise
spills and saves R9bn a year, but starts shedding 5.7 GWh in the default weather year.

### A harness for the nodal MIP, and the shortcut it prices, 23 Sep 2026

Build `2026-09-24a`. Nothing in the suite exercised the regional MIP, which is how it came to be
dispatching with no reserve held at defaults. validate_solve now covers it, 8/8.

The check rebuilds buildDayLP from MIP_WORKER_SRC - the same string the page hands to its Web
Worker - so it tests the code that actually runs rather than a copy. It asserts the reserve
variables and rows appear when reserve is enabled, are absent when it is not, and that the
requirement is the ASTR figure rather than something invented locally.

The first version of the check passed on the BROKEN build, which is the more useful lesson. It
tested the builder, and the builder was always right: the defect was in the caller, which set the
requirement to zero unless ancillary pricing was on. The requirement is now computed in a named
function, mipReserveFrac, so a harness can ask what the nodal model is being told to hold without
running a worker. The check reads that function with pricing off - the default - and fails on the
previous build.

Measured in the browser while testing this, and worth recording: on Today 2026 the average
wholesale shadow price is R786 from the instant engine and R765 from the solved MIP, 2.7% apart.
That gap is the cost of the instant model's block commitment - it commits coal in four-hour
blocks where the MIP starts and stops on the hour. Small enough to justify the shortcut, and now
a number rather than an assumption.

### Two reported defects, both already fixed, 30 Sep 2026

Build `2026-09-30a`. The parallel session reported two defects it had introduced and not fixed.
Both are gone in this build, and the measurements say so rather than the code reading as though
they should be.

**The 15% reserve share does not withhold dispatch.** It was said to hold storage back in hours
that shed load, taking Deep decarbonisation from 84 to 134 GWh unserved with reserve pricing on,
and Fossil-free's worst of twelve years from 0 to 46. Here the held share appears in exactly two
places, both inside the ancillary revenue loop, and pricing reserve changes nothing:

```
                                unserved GWh, reserve unpriced / priced
Deep decarbonisation 2035, 2016            20.5 / 20.5
Fossil-free 2040, 2020                     21.2 / 21.2
twelve-year mean, Fossil-free              1.77 / 1.77
```

**The scarcity curve reads availability, not the requirement.** It was said to read the
requirement as though it were available reserve, pricing scarcity in 8,754 of 8,760 hours. The two
are separate arrays here - at hour 100, requirement 2,200 MW against 6,304 MW available, means of
2,237 and 6,558 across the year - and Today 2026 prices above R2,000/MWh in 65 hours.

Both look like casualties of the 21 to 22 Sep reserve rework, which introduced the availability
series and the continuous LOLP curve. Recorded because a defect reported and silently fixed is
indistinguishable from one still live.

### PROVISIONAL pending the storage fix - The no-gas result is a five-year result. At 2040 the optimiser builds gas.

Measured 30 Sep 2026 on build `2026-09-30a`, with BLD_YEARS extended to 2040 in a variant copy -
eight two-year steps rather than five annual ones. Not installed; this is a scoping measurement
for the least-cost path work.

The horizon extension is CHEAP, which was the first thing worth knowing and the opposite of what
the spec assumed: the LP goes from 31,056 rows to 49,686 and from 1.7 seconds to 2.3.

The answer changes:

```
horizon to 2030 (installed)     8.7 GW batteries at 4h, no gas
horizon to 2040                15.3 GW batteries at 4h, 6.8 GW gas
   at 3 GW/yr storage          16.1 GW, 6.6 GW gas
   at 4 GW/yr storage          16.1 GW, 6.6 GW gas
```

Storage saturates at 16.1 GW on its own economics - raising the pace past 3 GW a year changes
nothing - and the optimiser still wants about 6.6 GW of gas. So the finding recorded earlier today,
that no new gas is economic provided storage arrives fast enough, HOLDS ONLY TO 2030. Over fifteen
years, with demand compounding and coal retiring on its own per-unit schedule, four-hour storage
cannot cover the firm gap at any procurement rate, and gas returns.

That is a correction to something this file asserted this morning, and it is the more interesting
result: the gas question is not settled by the storage build rate, it is POSTPONED by it.

Two caveats on the number itself. Two-year steps are a crude approximation of a fifteen-year path
and the build-rate caps apply per step rather than per year. And the LP screens on representative
days with perfect foresight - 6.6 GW of gas is a proposal to be checked against twelve weather
years, not a result, exactly as the presets were.

### PROVISIONAL pending the storage fix - Meridian's own work says the same thing about gas, on the same horizon

30 Sep 2026. A numerical cross-check against PyPSA-RSA is not available: it is a tool rather than
a published results set, its multi-horizon runs need a commercial solver, and Meridian's scenario
work now sits inside COMPASS, which is commercial. What is public is directional, and it lines up
with this week's correction rather than with the claim it replaced.

**A Vital Ambition (Meridian, with the CSIR technical report, July 2020).** An ambitious renewable
build means the decision to build expensive new gas infrastructure "can be avoided for at least a
decade and might not be necessary". Written in 2020, so their decade runs to about 2030.

This model, measured this week: no new gas is built to 2030 at any plausible gas price, and about
6.6 GW appears once the horizon runs to 2040. Two models, opposite methods - they co-optimise
investment and operation, this one dispatches a specified build - reaching the same shape of
answer, including its hedge. Their "might not be necessary" is the part our 2040 run does not
support at four-hour storage.

**Meridian's 2025 Power Market Report, from its published summary.** A 20% fall in costs in early
2025 "supercharges solar-plus-storage", prioritises batteries for new capacity services and
DELAYS THE NEED FOR NEW PEAKING PLANT, while reducing the scale of wind.

Delay rather than remove is exactly the revision made here on 30 Sep: the storage build rate
postpones the gas question rather than settling it. That two independent models built on different
principles both land on "later, not never" is the strongest corroboration this finding has.

What this does not give us is a number to check against. If a numerical cross-check is wanted, the
CSIR capacity ranges already in validate_external are the closest public thing, and the rest would
need Meridian to share scenario outputs.

### The rooftop tool now counts modules, and knows a pitched roof is not flat

Build `2026-09-30a`, 30 Sep 2026. Two changes prompted by a German roof-layout tool that packs
real modules around real obstructions where ours multiplied area by a density.

**Whole modules, and the packing loss made visible.** Capacity was area x 165 Wp/m2, a figure that
is right in aggregate and hides what it is made of. It is now a module of 2.58 m2 and 620 Wp, at
69% packing after walkways, edge setbacks and obstructions - which multiplies back to the same 165,
so no result moved. The count rounds DOWN to whole modules, as a layout does: a 2,000 m2 flat roof
gives 534 modules and 331.1 kWp, against 330 kWp before.

**A pitched roof is not its footprint.** Satellite imagery measures the horizontal projection. On a
flat roof that is what you build on; on a dual-pitch roof only one plane faces the sun usefully,
about half the footprint, and the tilt gives back a few per cent of surface. The tool had no way to
say so, so a pitched roof was being treated as though every square metre faced north:

```
2,000 m2 measured        modules   kWp
flat                         534   331.1
single pitch, north          508   315.0
dual pitch, north plane      278   172.4
complex or multi-facet       187   115.9
```

A dual-pitch house was overstated by about 1.9 times. The default is flat, which is what the tool
has always assumed, so nothing changes unless the user says what they have - but the option to say
it now exists, and the note under the control explains what was measured.

**Obstructions are the user's to state.** Packing was a single 0.69 standing in for walkways,
setbacks, chimneys, vents, skylights and rooftop plant at once - a property of the roof in front
of you, not a constant. Four named cases now, typical still 0.69, so nothing moves by default:

```
2,000 m2 flat roof, share 100%     kWp
clear, few penetrations          384.4
typical                          331.1
cluttered, HVAC and skylights    264.1
heavily obstructed               215.8
```

The share-of-roof control was doing two jobs at once and is now one: a build choice about phasing
or budget, with obstructions handled separately. Someone choosing 75% because the roof is cluttered
was previously applying the clutter twice.

Also added, from the same source: the tool states what it does not do. No string design, no
structural check, and an installer still has to survey the roof. The model's own scope line now
says it answers bulk adequacy rather than distribution reliability, and that nothing is uploaded.

The prose ratchet caught this: the additions took always-visible text from 4,228 words to 4,257
against a 4,250 ceiling. Trimmed to 4,240 by cutting two notes the option labels already said.

### The market basis names its own start date, 1 Oct 2026

Build `2026-10-01a`. The retail panel's second basis was labelled "post-ERAA" and its tooltip said
ERAA made it possible from H2 2026, which has now passed without it. NTCSA is standing up a market
surveillance unit for a SAWEM launch in April 2027, so that is the date.

The option now reads "Market-indexed (SAWEM, from Apr 2027)" and the tooltip says what it is until
then: a counterfactual that prices a market whose counterparty does not yet exist. No number
moved; a reader can now tell whether the figure describes a market that exists.

This is the second label in two weeks that outlived its own date, after the Eskom chair's term in
CALENDAR. Dates in labels go stale silently, where dates in CALENDAR get checked every session.

So the page was swept for the rest of them, 1 Oct 2026. Seventeen year references in visible text,
and only two classes matter. Most are DATED INPUTS - "NTCSA estimates 9.1 GW at June 2026",
"corrected on 6 September 2026", the TDP's own edition name - which date a source rather than make
a claim about the future, and should stay. The new SAWEM label is the only forward date on the
page, and CALENDAR now carries an instruction to change it on the day it launches.

The sweep did find something else. The build optimiser's own description said "least-cost build
schedule to 2030" with no hint that the horizon is load-bearing - and this week's measurement
showed it is: the same optimiser builds no gas to 2030 and 6.6 GW to 2040. It now says so in six
words. A scope stated without its consequence is not much better than an unstated one.

### The rooftop tool produces something you can hand to an installer

Build `2026-10-01a`, 1 Oct 2026. The tool computed a system, a yield and a payback and gave the
user nothing to take away. A Save sizing sheet button now writes a plain-text sheet with every
assumption named: measured footprint, roof form, the area facing the sun, share built on, the
obstruction case and its packing factor, module count and size, capacity, battery, capital cost,
resource and capacity factor, orientation and shading multipliers, generation, self-consumption,
export, bill, saving, payback, escalation and avoided CO2.

Plain text rather than PDF, deliberately. The sheet exists so an installer can disagree with a
specific LINE rather than with the number at the bottom, and a PDF would add a formatting
dependency nobody asked for. It ends with what the tool does not do: no string design, no inverter
selection, no structural check, module count is a packing estimate rather than a layout, and the
yield is modelled from satellite-derived resource data rather than measured on that roof.

Nothing in the model moved. The sheet reads the figures already on screen.

### A retail control that does not exist, and has not for some time

Build `2026-10-01a`, 1 Oct 2026. Going to add City Power's new revenue split to the municipal path,
I found there is no municipal path to add it to.

`renderRetail` reads an element with id `retSupply` on every render to decide whether the household
buys from a municipality or from Eskom. There is no such element anywhere in the page, so the read
falls through to its default and the flag has been pinned to "municipal" since the control was
removed.

It is also inert. Measured: passing the flag either way leaves every numeric component of the cost
stack identical and the hourly mean at R3.7481. The municipal comparison moved to the real City
Power tariff in `RETAIL_T.municipal`, which does not consult the flag.

Rule 7's exact shape, in the retail panel this time: a read of a key that does not exist, resolving
to a default that makes a plausible number rather than a crash. Nothing caught it because nothing
was looking at the panel's inputs, only at its outputs.

Pinned explicitly and labelled rather than deleted, because the question it was asking is real and
unanswered: about half of South African households buy from a municipality, and the stack models an
Eskom-direct customer. Deleting the flag would delete the reminder.

And City Power's split is in the tariff data rather than the stack, because it does not belong in a
household price. From 1 October the city retains 30% of gross electricity revenue and transfers 70%
to City Power within 48 hours, out of which the distributor must cover Eskom purchases, finance
costs, staff, maintenance, depreciation and reinvestment. That is a wedge between what a household
pays and what reaches the network, not an addition to the bill.

### Three more dead element reads, and a check so there is no fourth

Build `2026-10-01a`, 1 Oct 2026. The retail flag found this morning was not alone. A sweep of every
`getElementById` in the page against every id it defines:

```
retSupply      the retail supplier flag, read every render, pinned and labelled this morning
retMarkup      the retail markup slider, removed when real tariff data arrived
retMarkupVal   its readout, same
vppTotal       the host for a VPP readout - and this one is different
```

**The VPP readout was computed and never shown.** `updateVppTotal` works out the controllable load
that actually reaches the optimiser, splits it into the national programme and sited capacity, and
writes it to an element that has never existed - so it returned at the first line on every call.
The function is sound; nothing created its host. Sliders can now declare a readout host, the VPP
enrolment slider declares one, and the line renders: at 40% enrolment, 1,600 MW of controllable
load, all from the national programme.

The markup pair was deleted. The flag stays, pinned and documented, for the reason given this
morning.

**And a structural check now asserts that every id read is an id defined**, with concatenated ids
listed by prefix and renderer-created hosts named. It fails on this morning's build with all three.
25/25 structural checks.

Two process notes worth keeping. Deleting the markup lines took two working statements with them -
the harness caught it immediately, consistency dropping 80 to 59 and lint failing on an undefined
variable, which is the before-and-after rule earning its place again. And the readout property I
added collided with a property name `validate_response` already uses to EXCLUDE readout-only
controls from its sweep, which silently dropped the VPP enrolment slider from 70 controls to 69.
Renamed. A harness that excludes by property name is a contract on the page's vocabulary, and
nothing says so in either file.

### The build pace, against an independent pipeline estimate

Build `2026-10-01a`, 1 Oct 2026. GreenCape puts investable new renewable generation to 2030 at
12.9 GW and R161.2bn, about 3.2 GW a year across utility-scale and behind-the-meter together. The
default build pace allows 8.7 GW a year.

A loose check, because the two numbers measure different things: the model's pace is what it
ALLOWS the optimiser to build, GreenCape's is what is currently investable. Sitting well above it
is defensible and now recorded. Sitting BELOW it would mean the model forbids a build the market
already has money for, and that is what the check catches.

Worth holding against the storage figure specifically. The default allows 2 GW a year of storage,
about three times the 0.6 to 0.7 GW South African procurement has achieved, and the gas result
turns on being above 1.5. Against GreenCape's pipeline the whole 8.7 GW is nearly three times what
is investable today. The model is not claiming the market will do this; it is declining to forbid
it.

### The missing wheeled plant is not missing. It is in the rooftop line.

Build `2026-10-01a`, 1 Oct 2026. Practitioners describing how to measure South African solar
confirmed the method this model already uses, and in doing so located a week's worth of
"missing" capacity.

NTCSA publishes, weekly and by province, the installed privately procured solar PV: everything
that is not REIPPPP or RMIPPPP, wheeled and behind-the-meter together, ground and roof mounted,
residential through mining. Measured rather than estimated. Rooftop is what is left after
subtracting the wheeled plant from it, and `FIXED.rooftopMW` 8,942.1 is exactly that - the August
2026 figure less the 488 MW of wheeled solar in `by_source.private`.

THE SUBTRACTION IS INCOMPLETE. The private block covers H1 2026 only, so every wheeled plant
commissioned earlier is still inside the NTCSA total and has never been taken out:

```
Selemela 1 and 2     200 MW AC   Apr 2024
Damlaagte             97.5 MW    Aug 2025
SunCentral 1         114 MW      Oct 2026
```

About 414 MW, counted once, as rooftop, when it is grid-supply wheeled plant. The national total
is right and the two buckets are wrong. That matters because rooftop sits behind the meter and
suppresses demand while a wheeled plant supplies the grid, and the two carry different profiles -
so the model is slightly overstating behind-the-meter generation and understating grid supply.

Loading one of these is a RECLASSIFICATION: add to `by_source.private`, subtract the same figure
from `rooftopMW`, same commit. The queue file says so now, and the constant finally has a comment
explaining where it comes from, which it did not before.

One more thing falls out of the arithmetic: `FIXED.pvUtilityMW` 3,271, which nobody could source,
is REIPPPP solar 2,783 plus the H1 2026 wheeled 488 exactly. That is a hypothesis rather than a
provenance - the repo history is still what would settle it - but it is the first explanation that
fits.

### What the reclassification would move, measured before deciding

Build `2026-10-01a`, 1 Oct 2026. Moving 414 MW from rooftop to utility PV, measured rather than
assumed, so the decision to do it now or wait for February rests on a number:

```
                              served TWh   rooftop TWh   utility PV TWh   system R bn
Today 2026, as is                 191.83         15.36             6.92         210.7
Today 2026, reclassified          192.54         14.65             7.79         210.8
Deep decarbonisation, as is       183.31         33.91            44.02         290.2
Deep decarbonisation, reclassified 184.02        33.20            44.65         290.4

retail, Today 2026, regulated     R3.748/kWh  ->  R3.734/kWh
sales                              191.83 TWh  ->  192.54 TWh
```

Small and in the direction the physics requires. Grid-served demand rises 0.7 TWh because
generation that was suppressing demand behind a meter now supplies the grid, sales rise with it,
and the retail price falls 1.4 cents because the same fixed costs spread over more units. System
cost moves R0.1bn, emissions not at all.

So: real, consistent, and below the threshold at which anything published would change. No reason
to rush it ahead of the February monitor, which replaces the private block wholesale anyway and
will carry SunCentral 1 and probably more. Doing it now would mean two edits to the same constants
where one will do, and rule 5 says replace rather than add.

The value of measuring it was not the decision. It was confirming the direction: if the
reclassification had moved served demand DOWN, the model's accounting of behind-the-meter
generation would have been backwards, and that would have mattered a great deal more than 0.7 TWh.

### A queue for named private projects, rather than losing them

Build `2026-10-01a`, 1 Oct 2026. Six named private and wheeled projects have come out of trade
press over the past week and none of them can be loaded. The pipeline file is IPP Office
programmes only and says so in its own description; the private block comes from the Power Futures
Lab monitor and is replaced wholesale every half year, so adding a press report to it is exactly
the delta-adding rule 5 forbids; and adding solar would break identity 3 unless the national
constant moves, which nobody can currently justify.

So they sit in `nodal/private_pending_h2_2026.json`, named, with their dates, sources and the
reason each is not loaded:

```
SunCentral 1                114 MW    commercial operation Oct 2026
Selemela 1 and 2            200 MW    Apr 2024, pre-monitor
Damlaagte                    97.5 MW  Aug 2025, pre-monitor
Thakadu                     255 MW    under construction, 2027
Paarde Valley PV2           120 MW    under construction, end 2026
Discovery Green portfolio   740 MW    an aggregate, scale check only
```

The file carries its own instruction for February 2027: replace the private block from the new
monitor, then DELETE from the queue whatever the monitor already carries. An entry the monitor
omits is a question for Power Futures Lab rather than a licence to hand-edit. CALENDAR points at
it on the monitor's date.

The alternative was a note in a markdown file that nobody reads at the moment it matters, which is
how the 1,823 MW gap outlived its own correction by a month.

### The default profile set spills more than the regional one, and it is not drift

Build `2026-10-01a`, 1 Oct 2026. Pinning curtailment in the suite surfaced a discrepancy worth
recording before someone treats it as a regression.

```
                              default profiles   twelve-year regional range
Deep decarbonisation 2035             65.2 TWh                 51.5 to 68.3
Fossil-free 2040                     119.7 TWh                 90.4 to 114.2
```

Deep decarbonisation sits inside its band. Fossil-free sits about 5% ABOVE the regional maximum.

The two are different sources, not different years: the default set is national and Eskom-derived,
the twelve-year set is regional MERRA-2 at capacity-weighted plant locations. Levels from one are
not interchangeable with the other, and the project's own source register already records that
reanalysis and satellite-derived irradiance differ by 10 to 15%. A 5% offset on spill, which is a
residual between two large numbers, is well inside that.

The practical consequence: say which profile set a curtailment figure came from, not just which
year. The suite now pins both presets at their default-profile values within 15%, wide enough to
absorb the offset and narrow enough to catch a build or dispatch change. 39/39 findings.

### The two presets' curtailment, reissued with ranges

Build `2026-10-01a`, 1 Oct 2026. The figures most often quoted from this model are the two
presets', and they now carry what they always needed:

```
                              curtailment TWh across twelve weather years
                              min    median    max    spread
Deep decarbonisation 2035    51.5      63.0   68.3     26.7%
Fossil-free 2040             90.4     106.4  114.2     22.4%
```

Quote the median with the range, or the range alone. A single year from either distribution can
be out by a sixth, and the handover's preset block now carries both.

The older figures audited below are not reissued: two describe presets that no longer exist, and
the other two are build comparisons where the comparison survives and only the levels are soft.

### Which published curtailment figures need a range, 1 Oct 2026

Audited after the spread measurement below. Every curtailment figure in this file is a single
number; the ones that still describe the current model need a range, and several describe builds
that no longer exist.

```
figure                                     status
Fossil-free 2040, 199 TWh curtailed        STALE BUILD: that entry is the 55/90/5 build at
                                           2026-09-20a. The preset is now 35/55/7 and today's
                                           twelve-year range is 90 to 114 TWh
Deep decarbonisation, 101.5 to 100.9 TWh   STALE BUILD: the 45/45 preset. Now 35/35, range
  in the demand-response entry             51 to 68 TWh
Fossil-free, 182.5 TWh against 252.2       CURRENT BUILD, single year. The comparison between
  in the 22 Sep preset search              builds survives; the levels need the range
Deep decarbonisation, 150.1 against 182.5  CURRENT BUILD, single year. Same.
No-gas frontier, 101.7 TWh at 50W/60S      A SCENARIO, not a preset, and its own entry already
                                           says the profile set is the probable cause of a 7.4%
                                           unexplained gap. The twelve-year range is the better
                                           explanation and was not available when it was written
Electrolyser scope note, 101.7 TWh         Inherits the frontier figure above
```

THE RULE THAT FOLLOWS, and it belongs with the weather-year rule already in rules.md: a
curtailment figure quoted without its weather year is a number with a sixth of itself missing. The
comparisons between builds survive - they were run on the same year - but no single level should
leave this file without either a year attached or a range beside it.

Not reissued here, because reissuing six figures across three builds is a session of its own and
two of them describe presets that no longer exist. Recorded so the next person reissues them
knowingly rather than discovering the problem again.

### Where the weather spread actually is: curtailment, by a factor of twenty

Build `2026-10-01a`, 1 Oct 2026. Having ruled out cost, the same twelve weather years were run for
retail price and curtailment:

```
Deep decarbonisation 2035        min    median      max   spread
system cost R bn              291.56    293.86   295.63     1.4%
retail, regulated R/kWh         2.79      2.82     2.83     1.2%
retail, market R/kWh            2.88      2.91     2.93     1.9%
CURTAILMENT TWh                51.50     63.00    68.30    26.7%

Fossil-free 2040
system cost R bn              338.25    338.34   338.41     0.0%
retail, regulated R/kWh         2.62      2.64     2.66     1.4%
retail, market R/kWh            2.80      2.82     2.85     1.8%
CURTAILMENT TWh                90.40    106.40   114.20    22.4%
```

Prices move about as little as cost, for the same reason. Curtailment moves TWENTY TIMES MORE than
cost: 51 to 68 TWh on Deep decarbonisation, 90 to 114 on Fossil-free. A single-year curtailment
figure can be out by a sixth of itself, and every curtailment number this project has published
is from one year.

That is where a distribution earns its place, and it is the one quantity nobody thought to ask
about. The hydrogen and electrolyser work rests on spill; so does the case for long-duration
storage; so does the 45% of demand thrown away in the no-gas frontier. All of it quoted from
single years.

The retail prices above are unweighted hourly means on a probe basis, not the panel's load-weighted
figures - usable for SPREAD, not as levels.

CURTAILMENT WAS ALSO NEARLY REPORTED AS ZERO. The first run read `E.curtail`, which is not a key;
the real one is `E.curtailed`. It returned undefined, fell through to zero, and printed a tidy
0.0% spread in all twelve years. Rule 7's shape again, caught only because a flat zero next to a
26% spread looked wrong.

### System cost barely moves with the weather, so the distribution is not worth building

Build `2026-10-01a`, 1 Oct 2026. Before building the cost-distribution view the Discovery Green
framing suggested, the spread was measured. It is not there.

```
system cost, R bn a year, across twelve weather years
                            min     median     max    spread
Deep decarbonisation 2035   291.6     293.9   295.6      1.4%
Fossil-free 2040            338.2     338.3   338.4      0.1%
```

Twelve real weather years, including the drought years that set the capacity requirement, and the
cost of a fossil-free system moves by one part in a thousand.

The reason is structural and worth stating: system cost in a high-renewables build is capital and
fixed operating cost, neither of which cares what the wind did. Fuel is the only weather-sensitive
line, and Fossil-free has almost none. The weather risk in these systems is not a cost risk at
all - it is an ADEQUACY risk, and that is already reported as a mean and a worst year.

So the feature is not worth building as specified, and the spec in handover.md has been corrected
rather than left to be implemented by someone who would get the same flat answer. Where variability
does live, and where a distribution would earn its place: the market-indexed retail price, which is
set by scarcity hours rather than by annual cost, and curtailment. Neither has been measured across
twelve years yet.

Measuring before building cost nothing and saved a panel that would have shown a flat line with
authority.

### The virtuous circle is real, and it runs into a wall at about 3 GW

Build `2026-10-01a`, 1 Oct 2026. A FIRST CUT at the industrial electrification question, measured
before building anything: a flat block of extra load added to the demand series, which is what
industrial heat looks like, and nothing else changed.

```
                        R/kWh reg   sales TWh   system R bn   shed GWh   curtail TWh
Today 2026
  as is                     3.748       191.8         210.7        0.0          0.0
  +1 GW flat                3.640       200.6         216.7        1.9          0.0
  +3 GW flat                3.453       218.1         228.8        4.3          0.0
  +5 GW flat                3.314       235.5         243.9       30.7          0.0
Deep decarbonisation 2035
  as is                     2.838       183.3         290.2        0.0         65.2
  +1 GW flat                2.723       192.5         292.5        0.0         58.1
  +3 GW flat                2.529       210.8         297.6       81.0         44.0
  +5 GW flat                2.392       228.4         306.0      675.7         30.6
```

THE LOOP CLOSES, and harder than expected. Three gigawatts of flat industrial load takes the
regulated price from R3.75 to R3.45 on today's system, and from R2.84 to R2.53 on Deep
decarbonisation - roughly 8% and 11% off the price EVERY customer pays, residential included.

The mechanism is visible in the columns. System cost rises, because the energy has to be
generated: R210.7bn to R228.8bn on today's system. Sales rise faster, because the fixed costs
underneath - network, legacy capital, the IPP contracts - do not move at all. On Deep
decarbonisation there is a second gain: curtailment falls 65.2 to 44.0 TWh, so a third of the new
load is served by energy that was being thrown away.

AND THE WALL IS ADEQUACY, not cost. Shed energy is the column that breaks: 0 to 81 GWh at +3 GW
on Deep decarbonisation, and 676 GWh at +5 GW, which is far outside the reliability standard both
presets are built to. Today's system holds longer - 30.7 GWh at +5 GW - because it still has coal.

So the honest version of the big-picture argument: industrial electrification does lower the price
for everyone, by about 3% per gigawatt added, and it does it partly by using spill that is
currently wasted. But each gigawatt also has to be covered on the worst winter evening, and past
about 3 GW the build has to grow with it. The question for the full scenario is whether the extra
build costs less than the fixed-cost saving - which is exactly the test the handover spec now
specifies, and this measurement does not answer.

CAVEATS, and they are substantial. A flat block is a crude stand-in: real industrial heat has
shift patterns and some of it could be flexible, which would change the adequacy wall completely.
Nothing here models the heat pumps, their capital, or the fuel they displace, so this says nothing
yet about whether the switch is worth making for the factory. And the load is national, with no
regard for where the grid can take it.

### The usable-area deduction was being taken twice, 1 Oct 2026

Build `2026-10-01a`. Going to wire Google's Solar API into the rooftop tool, I found it was already
wired - and that this week's packing-factor work had broken it.

The Solar API path and the manual tracer both wrote a REDUCED area into the roof-area field:
measured footprint times 0.72, a usable factor for walkways, plant, setbacks and obstructions.
That was correct until 30 Sep, when rtCalc gained its own roof-form factor and its own packing
factor - 0.69 typical, for exactly those losses. Since then a measured roof carried the deduction
twice:

```
                        area written    then packed at    effective
before 30 Sep              0.72            1.00              0.72
since 30 Sep               0.72            0.69              0.50
corrected                  1.00            0.69              0.69
```

A traced or auto-measured 1,000 m2 roof came out 28% smaller than the same roof typed in by hand,
and nothing said so: both paths produced plausible numbers. Typed areas were never affected, which
is why the figures published on 30 Sep stand - they were typed.

The field now holds what it says it holds, the measured footprint, and the obstruction control
does the reducing where the user can see it.

WHAT THIS SAYS ABOUT THE CHANGE THAT CAUSED IT. Decomposing a constant into its parts is the right
move and it is also where double-counting starts: the moment 165 Wp/m2 became module times packing,
every OTHER place that had quietly applied a packing factor became a duplicate. Rule 6 says no
constant appears twice; the corollary is that splitting a constant means hunting for the places
that already did the splitting informally.

The Solar API integration itself predates this session and is more complete than expected: it
fetches building insights, converts each roof segment's real pitch and azimuth into the same yield
multiplier the dropdown uses, draws the measured roof, and falls back to manual tracing where
there is no coverage. It needs a Google Maps Platform key in window.GOOGLE_SOLAR_KEY. Building
Insights is free to 10,000 calls a month and $0.01 a call after that.

### Which earlier findings the charging fix touches, and three re-measured

Build `2026-10-02a`, 2 Oct 2026, night. 69 entries in this file report adequacy for a build that keeps
coal; every one predates the engine charging storage from coal ahead of stress, so their shed figures
are pessimistic by some amount. Rather than re-run 69, the three that carry a mechanism someone might
quote were re-measured both ways on the current build:

```
                                                  old rule     new rule
FLEXIBILISING COAL, no gas, 10 GW coal, default year (unserved GWh)
  rigid coal                                         6,703        6,556
  flexible coal                                      7,897        7,297
  flexible worse by                                 +1,194         +741
ELECTRIFICATION WALL, Deep decarbonisation, flat load added (unserved GWh)
  +3 GW                                                133          116
  +5 GW                                                868          764
NO-GAS FRONTIER, 50 GW wind / 60 GW solar, 10 GW coal, default year
  unserved GWh                                           0            0
  curtailment TWh                                    120.9        121.1
```

ALL THREE DIRECTIONS HOLD. Flexibilising coal still worsens adequacy in a no-gas system - the fix
narrows the penalty by 38% because flexible coal can now charge storage when it sees stress, but rigid
coal still forces more energy into storage. The electrification wall stays near 3 GW. The frontier
cell is unchanged.

THE LEVELS DO NOT. Every number above differs from what its entry published - 14,078 and 15,206 GWh
for flexibilisation in August, 81 and 676 GWh for the electrification wall yesterday - because each
has been through a month of model changes as well as this one. Quote directions from those entries;
re-measure before quoting any level.

A KEY THAT CHANGED SHAPE, caught re-measuring. The flexibilisation entry describes "ramp %/hr 24
against 100". coalFlexPct is now a toggle, read as true or false, so setting it to 24 or 100 both mean
"flexible" and give identical results. The first re-measurement came out identical for rigid and
flexible for exactly that reason. Rule 7's shape again: a value that resolves to something plausible
rather than an error.

### Deep decarbonisation re-sized, and why more coal cannot go

Build `2026-10-02a`, 2 Oct 2026, night. With the engine able to charge from coal ahead of stress, the
Deep decarbonisation preset's twelve-year mean shed fell to 0.44 GWh against a target of 2.07 - half
the 0.002% standard, the margin both presets carry. It was over-built. Every trim below is against
twelve weather years:

```
Deep decarbonisation 2035              mean GWh   worst GWh   system R bn   CO2 Mt
preset as it was, lithium 20 GW            0.44         5.2         290.5       30
lithium 17 GW (CHOSEN)                     2.02        24.0         283.8       30
lithium 18 GW                              1.65        19.6         286.1       30
lithium 16 GW                              2.73        32.1         281.6       30   misses
solar 32 GW                                1.96        23.5         286.2       30
rooftop 8 GW                               1.70        20.3         285.9       30
wind 30 GW                                 4.46        52.8         280.3       35   misses
coal retired 29 GW, build unchanged        7.67        75.6         285.8       28   misses
coal retired 31 GW, build unchanged       46.71       215.5         280.8       25   misses
target                                     2.07
```

Lithium 17 GW at 12 hours is the cheapest trim that holds the margin: R6.7bn a year less, the
regulated retail price R4.23 to R4.17/kWh, emissions unchanged. Solar and rooftop trims also hold
but save less. Wind does not trim at all: 5 GW less doubles the shedding and adds 5 Mt of CO2,
because wind is what covers the evenings the coal no longer does.

AND MORE COAL CANNOT GO AT THIS BUILD. Retiring two more gigawatts saves R4.7bn and multiplies
shedding by seventeen; four more takes the worst year past 200 GWh. The charging fix made coal MORE
valuable, not less - its headroom now fills storage - so the remaining 12.7 GW is doing firm work
the renewables and storage in this build cannot replace. Retiring more needs more firm capacity
alongside it, which is a different preset rather than a trim of this one.

Fossil-free 2040 is unchanged: it has no coal to charge from, so the fix does not touch it.

### The OCGT check that flipped, read out

The MTSAO 2030 risk-adjusted case, mean over twelve weather years and two outage draws:

```
                         old rule   new rule   MTSAO
OCGT utilisation          58.9%      52.9%     about 45%
unserved energy           7.9 TWh    6.8 TWh   more than 4 TWh
```

It passes because it moved, not because the band did: storage charged from midday coal now covers
evening hours the OCGTs used to. The mechanism is the one the fix was built for, and the direction is
toward the MTSAO on both measures. Still eight points above their 45%, so this is closer, not matched.

### The engine now charges storage from coal when it can see stress coming

Build `2026-10-02a`, 2 Oct 2026, night. The fix the entry below scoped. The engine charged storage
from spare coal only between 23:00 and 05:00, the classic pumping window. In a solar-heavy system the
coal headroom sits at midday and the stress at night, so the window never opened when it mattered.
Now, in any hour, when the engine's own shortfall forecast says energy will be short, it charges
from coal headroom up to that forecast. Off-peak behaviour is unchanged; a calm day burns no coal to
fill storage it will not need. `chargeFromThermal` 0 restores the old rule, and does exactly - the
stalled build reproduces 83 GWh with it off.

```
                                  old rule   new rule
stalled loop build, worst year     83 GWh     30 GWh
                    mean of twelve 31 GWh    7.2 GWh
Deep decarbonisation, worst year   21 GWh      5 GWh
                      mean          1.7 GWh    0.4 GWh
                      system cost  R290.2bn   R290.5bn
                      coal          27.2 TWh   27.8 TWh   CO2 unchanged at 30 Mt
Fossil-free 2040 preset            no change - there is no coal to charge from
```

THE DIRECTION OF EARLIER WORK. Every adequacy figure the engine produced for a build that keeps coal
was pessimistic, and the Deep decarbonisation preset is the clearest case: sized for the NEM standard
with a twofold margin under the old rule, it now sits at about 5 GWh in its worst year against that
standard, which means it carries more storage than it needs. Its preset search should be re-run
before its storage figure is quoted again. Fossil-free figures stand, because the change cannot touch
a system with no thermal plant.

The cost is small and real: 0.6 TWh more coal burned to fill storage ahead of stress, R0.3bn a year,
and no measurable carbon change.

THE SUITE MOVED IN ONE PLACE, and it needs understanding rather than celebrating. The MTSAO OCGT check
that has failed deliberately since 23 Sep, at 58.9% against a 45% band, now passes: storage charged
from coal is displacing OCGT burn. Rule 2 cuts both ways - a check that flips green after a model
change is as much a question as one that flips red. The new value has not yet been read out.

The adequacy loop still stalls, now at 30 GWh against a 4.4 GWh standard, a factor of about 7 where
it was 19 this afternoon and 1,800 this morning.

### PROVISIONAL pending the storage fix - Three more disagreements, and the last of the gap is the engine's, not the optimiser's

Build `2026-10-02a`, 2 Oct 2026, evening. The sweep and the second decomposition.

**The sweep of the optimiser's literals** found three more places where it disagreed with the engine
it is tested against, all fixed:

```
firm exports                 optimiser: none        engine: 745 MW of load, shaped to demand
reserve shortfall, tail days priced at 1 day        shedding priced at 365: so the LP dropped
                                                    reserve where the engine sheds to keep it
demand growth to 2040        fifteenth root, 1.0466 engine 1.05; an off-by-one in yesterday's fix
```

The engine's mean shed in the last stalled week, 2,338 MW, sat almost exactly on its reserve
requirement of 2,254 MW: it sheds load to hold reserve, as an operator would. The optimiser, paying
365 times more for shedding than for missing reserve, simply did not hold it.

Remaining literals checked and left: CSP at a flat 0.38 against the engine's profile (the optimiser
is the more pessimistic of the two), the 1.10 planning margin and the storage wear costs (optimiser
only, no engine equivalent).

```
Fossil-free 2040 through the loop      worst year GWh   mean GWh
before any alignment                              366        185
after four constants                              152         66
after seven                                        83         26 to 31
standard                                          4.4
```

**And what remains is the engine.** In the stalled week, January 2016, the engine sheds at night -
46 hours, almost all between 18:00 and 08:00, at 1,420 MW on average - with lithium empty and coal
at full. At midday on the same days coal ran at 7.7 to 9.0 GW against 11.4 to 11.9 GW available,
and the batteries charged at 52 to 276 MW and never passed 3% full.

```
midday, January 2016   coal running   coal available   battery charging   battery max
day 20                       7,877           11,419                  67            1%
day 21                       7,682           11,875                 276            3%
day 22                       8,970           11,574                  52            1%
```

Three to four gigawatts of coal headroom for seven hours a day is about 20 GWh. The nights shed
about 20 GWh. The engine charges storage only from renewable surplus, never from spare thermal
capacity; the optimiser charges from whatever is cheapest. That is the remaining gap, and on this
evidence it is the ENGINE that is wrong: Eskom pumps its storage schemes from coal overnight as a
matter of routine, and an operator facing a night of shedding with three gigawatts idle at noon
would charge the batteries.

So the direction of every adequacy figure the engine has produced for a coal-retaining build is
pessimistic by however much of this it does. Not quoted until measured: the fix is a change to the
engine's dispatch and moves every result in this file, which makes it a session of its own.

Also caught on the way: my own probe of the stalled week first came out at 115 GWh against the
loop's 83. The difference was 2 GW of rooftop the optimiser had built and I had left out when
copying the build by hand - which is the lesson of the apply-button bug, learned again an hour later.
The probe that records what the loop actually tested is the one to trust.

### PROVISIONAL pending the storage fix - The stall was not foresight. Four constants the optimiser and engine disagreed on.

Build `2026-10-02a`, 2 Oct 2026, later the same day. Both open questions from the entry below were
measured, and the first overturns its conclusion.

**State of charge settles it.** In every hour the engine shed during the stalled week, its battery
was below 10% charge, and on three of those days it never charged at all. The engine was not
holding energy back for a week it could not see; there was no surplus to store. So the gap was an
energy shortfall, which means the optimiser was counting supply the engine did not have. The
explanation in the entry below - storage foresight - was wrong, and so was the earlier one it
replaced.

Decomposing the week found where:

```
                              optimiser assumed        engine has
nuclear availability          0.90, hardcoded          nuclearCF 0.66, Koeberg's record
pumped storage as reserve     all 2,724 MW             empty that week, delivered 314 MW
rooftop output                full solar profile       rooftopDerate 0.78
congestion on wind, solar     none                     congestionCurtailPct, 4%
```

Every one is a second copy of a constant that disagreed with the first - rule 6, four times, in a
function written to cross-check the other. Nuclear alone was 451 MW the optimiser counted in every
hour of every year. The optimiser now reads the engine's keys for all four, and pumped storage is
out of its reserve until its energy is modelled.

```
Fossil-free 2040 through the loop      worst year GWh   mean GWh   weeks it found
before the four fixes                             366        185   January, January
after, pass 4                                     152         66   January, late May, June
standard                                          4.5
```

Better by more than half, and the loop now finds winter weeks. It still stalls, at about 34 times
the standard. What remains has not been decomposed; the same week-by-week comparison is the method.

**Summer maintenance decides when, not whether.** Flattening the engine's planned coal maintenance
across the year moves the worst week from mid-January to late May, and barely moves the shortfall:
worst year 365 to 350 GWh, mean 193 to 194. The January finding below was an artefact of where the
engine schedules outages and should not be repeated as a property of the system.

### PROVISIONAL pending the storage fix - The stress-period loop works, and it stalls - which locates the remaining gap

Build `2026-10-02a`, 2 Oct 2026. The build optimiser now has the iteration NREL's ReEDS uses: solve,
test the build against the full chronological dispatch across twelve weather years, add the worst
week where it failed as a stress period, re-solve. A second button runs it; it stops when the worst
year sheds less than 0.002% of demand, after five passes, or when the week it would add is already
in the optimisation.

Fossil-free 2040 at the deliverable pace:

```
pass   wind GW   solar GW   batt GW   gas GW   worst year GWh   standard   week added
1         16.4       26.7      12.1      1.4      366 (2022)        4.4    2022, day 24
2         17.0       26.8      12.3      1.2      348 (2016)        4.4    2016, day 18
3         14.2       31.3      13.5      1.6      338 (2016)        4.5    stalled
```

STALLED on pass three: the worst week was already in the optimisation and the build still sheds in
it. That is the loop's most useful output, because it rules out the explanation I offered
yesterday morning and confirms the one I withdrew yesterday afternoon.

It is not coal. In the stalled week the engine had 11,734 MW of coal available on average; the
optimiser assumed 10,581. The optimiser was MORE pessimistic about coal, and the engine still shed
in 65 of 168 hours. With the week in the LP, the coal derate tightened and reserve held in both
models, what remains is how storage is dispatched: the LP runs the week with perfect knowledge of
it, the engine with a 168-hour heuristic. So the residual is foresight after all - not because
iteration cannot reach it, but because the loop reached it and found it there. That is a measured
statement now rather than an assumed one.

AND THE WEEKS IT FOUND ARE IN JANUARY. Days 18 and 24, late summer, in both 2022 and 2016. Every
discussion of this system's adequacy - including this file's - has been about the winter wind
drought. This build, solar-heavy and holding 21.8 GW of coal, fails in summer instead. The engine
schedules planned coal maintenance into summer (its seasonal factor peaks at 1.23 in January),
which is the likely reason, and unproven. A build's binding week depends on the build, which is
the pattern this file has recorded four times for the binding YEAR; it holds for the season too.

A BUG FOUND IN TESTING THE LOOP, and present in the apply button since it was written. Only five
technologies were carried from the optimiser into the sliders, so a preset's offshore wind and
iron-air stayed on top of the optimiser's build. On Fossil-free that meant 7 GW of offshore and
1 GW of 100-hour iron-air the optimiser never built, and the first loop run called the build
adequate at 3 GWh. Without them it sheds 366. Both paths now carry every technology the optimiser
decides and zero the ones it does not.

### PROVISIONAL pending the storage fix - The same fix for the regional model was built, measured, and reverted

Build `2026-10-02a`, 2 Oct 2026. The regional build optimiser was given the national model's
three fixes: tail days carrying each region's OWN worst-week wind and solar from the twelve-year
file, coal derated to the worst measured week on them, and its existing reserve co-optimisation
switched on - which its own comment said to do "when peakers retire", exactly what these
scenarios do.

It does not fit in the browser:

```
regional LP, Fossil-free, 2030 horizon     size     solved within
before the change                          23 MB    not within 360 s CPU
after the change                           48 MB    not within 940 s CPU
after the change, 2040 horizon            200 MB    not attempted
browser limit                                       900 s
```

So the regional model was already slow on this scenario, and the fix pushed it past the limit.
REVERTED, not shipped: an optimiser that times out reports nothing, which is worse than a screen
known to be optimistic. The code now says why, at the point a future reader would try again.

THE PRACTICAL RULE THAT FOLLOWS. Use the national optimiser for adequacy and the build total; use
the regional one for WHERE, on a horizon of 2030. Its adequacy is uncorrected and it should not be
quoted for whether a build keeps the lights on.

Two things learned along the way worth keeping. The sandbox freezes background processes between
calls, which is why the first measurements looked like the solves were progressing at half speed:
they were simply not running. And one check that came back clean - the weights the weather-year
aggregation divides by sum to exactly 1, so a division that looked like a double normalisation is
a no-op, as it should be.

### PROVISIONAL pending the storage fix - The optimiser now holds reserve and expects outages. The gap closed from 250 to 60.

Build `2026-10-02a`, 2 Oct 2026. Two of the three structural gaps between the build optimiser and
the dispatch engine are closed; the third is inherent to a screening LP.

**Outages.** The tail window is now seven days rather than three, and coal on it is derated to the
worst measured week: 0.76 of the annual mean, from the coal availability trace (2024, the worst of
three years; 0.87 and 0.83 in the others). Calendar days keep the mean.

**Reserve.** Every hour now carries the engine's requirement - the ASTR's 2,200 MW plus 5% of
variable output above the 2026 fleet's - as headroom on coal, gas, diesel, lithium and pumped
storage above what is dispatched. A slack priced at VoLL keeps early years feasible and reports
the shortfall rather than hiding it; it is zero in every solve so far.

**Tail-day shedding is priced, not forbidden.** A hard zero made 2026 infeasible - nothing can be
built fast enough to cover a derated winter week that year - and an LP that cannot solve reports
nothing. Shedding on the tail is now priced as if that week came round every week, VoLL x 365,
which says the same thing with a price on it. Note the objective is no longer comparable with
earlier runs: it carries that penalty.

The same 2040 build, Fossil-free preset, coal matched, through twelve weather years:

```
screen                                  LP build (GW)                           mean shed GWh
no tail                                 31.8 solar, 13.8 batt, no wind                 6,307
three-day tail, priced                  34.8 solar, 15.6 batt, 7.0 wind                  731
three-day tail, outage + reserve        31.5 solar, 14.5 batt, 8.4 wind, 3.8 gas          250
seven-day tail, outage + reserve        26.7 solar, 12.1 batt, 16.4 wind, 1.4 gas         215
standard                                                                           about 3.5
```

From 1,800 times the standard to 60. And watch the wind column: none, then 7, then 8, then 16 GW.
Every step that makes the screen's winter more like the engine's puts more wind in the build. The
preset search, which used the engine directly, settled on 35 GW. The screen is converging on the
engine's answer from below as its winter gets harder, which is the right direction and a decent
check that the fixes are the right fixes.

WHAT REMAINS is foresight. The LP dispatches each day knowing the day; the engine looks 168 hours
ahead through a heuristic and holds storage back for what might come. The remaining factor of 60
is mostly that, and it cannot be closed in a screening LP - only measured. So: every optimiser
result is still a proposal, the panel still says so on apply, and the twelve-year dispatch is
still the arbiter. But the proposals are now in the right neighbourhood.

The regional model does not have any of this yet: it screens on eight calendar days with mean
coal and no reserve, and says so in its code.

### PROVISIONAL pending the storage fix - Four fixes to the build optimiser, and the one that did not work

Build `2026-10-01a`, 1 Oct 2026, following the correction below.

**The coal the optimiser assumed now travels with its build.** Applying a result to the sliders
sets coal retirement to the optimiser's own per-unit figure - 17,939 MW retired for 2040, 21.8 GW
standing - and sets the storage duration it chose. The status line says what coal it assumed and
that the result is a screening result until the twelve weather years have run. Before this, the
apply button handed a coal-backed build to a dispatch with no coal in it.

**The growth root follows the horizon.** demandGrowthPct was converted to an annual rate with a
hardcoded fifth root, right for five years and wrong for fifteen. It now takes the horizon's root.

**The tail from the other eleven years is in the screen.** The worst three-day net-load window
across all twelve weather years - June 2015 under the screen's own weighting - is spliced into the
representative days with its own wind and solar shapes, and those days may not shed at all. The
regional model keeps its calendar days, because it indexes regional shapes and the tail carries
only national ones; that blindness is stated in the code rather than hidden.

**AND IT IS NOT ENOUGH.** Measured on the same 2040 build, coal matched, through twelve years:

```
                                        LP build                              mean shed GWh   worst
no tail days                            31.8 solar, 13.8 batt, no wind              6,307     7,590
tail days, priced                       34.8 solar, 15.6 batt, 7 wind                 731     1,414
tail days, forbidden to shed            31.5 solar, 14.2 batt, 7.8 wind, 0.3 gas      877     1,580
standard                                                                            about 3.5
```

The tail days cut the shortfall nine-fold and bring wind back - 7 to 8 GW where there was none -
which confirms what the correction below says about why wind vanished. But 877 GWh against a
3.5 GWh standard is a factor of 250, and more days will not close that.

The gap is structural. The optimiser gives coal a flat 64% availability in every hour; the engine
draws outages with 480-hour persistence that can take gigawatts out for weeks. The optimiser holds
no operating reserve; the engine holds 2,200 MW plus a share of variable output. The optimiser
dispatches each day with perfect foresight; the engine looks 168 hours ahead through a heuristic.
Each of those makes the engine's winter harder than the optimiser's, and together they are the
250.

So the build optimiser is a screen and only a screen, and the panel now says so on every apply.
Closing the gap properly means putting the engine's reserve and an outage allowance into the LP,
which is a session of its own and is on the list.

### PROVISIONAL pending the storage fix - CORRECTION: the no-wind result is not what the economics want. It is what coal and a
### representative-day screen allow.

Build `2026-10-01a`, 1 Oct 2026, same day as the entry it corrects below. The claim that wind,
rooftop and gas are "artefacts of the cap" was chased and does not survive. Two things the sweep
did not see.

**The optimiser keeps 21.8 GW of coal in 2040.** It retires coal on the per-unit dates in UC_FLEET,
not on the preset's coalDecomMW, so a "Fossil-free 2040" run of the build optimiser is a run with
more than half the coal fleet still standing. Nothing on screen says so. The no-wind build was
never a fossil-free build: it was 60 GW of solar and 28 GW of batteries riding on 21.8 GW of coal
for every winter night. Coal was the firm capacity, and that is why wind looked unnecessary.

**And the screen cannot see the tail.** The same builds, run through the full twelve-year dispatch
with the coal the optimiser actually assumed:

```
                                                  mean shed GWh   worst year GWh   standard
unbound: 60.5 GW solar, 27.6 GW batt, no wind              92.0        313.1 (2022)    about 3.5
capped:  4.1 wind, 37.5 solar, 17.2 roof, 25.6 batt      185.2        429.7 (2022)    about 3.5
```

Both fail the NEM standard by a factor of 25 to 50. The representative-day screen under-provides
adequacy because its twelve days do not contain the 2022 winter, and that is exactly what the
handover spec said would happen: the optimiser proposes, the twelve-year dispatch disposes.

**With the coal removed, the no-wind build is not a system at all:** 47.5 TWh a year unserved,
52 TWh in the worst year, shedding in all twelve years. That is the measurement that settles it.
In a genuinely fossil-free system wind is essential, which is what the preset search found weeks
ago - 35 GW of it - and what the unbound optimiser could not see because it had coal to lean on.

WHAT STANDS from the sweep below: the cap range being worth only 3.2% of the objective, and rooftop
losing to utility solar on a shared profile. WHAT DOES NOT: "wind, rooftop and gas are artefacts of
the cap." Wind is an artefact of the retained coal and the screen's blindness to the tail. Do not
repeat the earlier framing.

TWO THINGS TO FIX, both now on the list. The build panel must say which coal it assumes, because a
user selecting Fossil-free 2040 and reading a least-cost path is being shown a coal-backed system
under a fossil-free label. And every optimiser result needs the twelve-year dispatch run before it
is reported - which this one got only because someone asked.

### PROVISIONAL pending the storage fix - What the economics actually want: utility solar and batteries, and nothing else

Build `2026-10-01a`, 1 Oct 2026. The build caps were raised until they stopped binding. Fossil-free
2040, annual steps, every cap scaled by the same multiple:

```
caps x       objective R bn   wind GW   utility solar GW   rooftop GW   batt GW   gas GW
1 (current)         1,127.4       4.1               37.5         17.2      25.6      0.8
1.5                 1,103.4       0.0               53.6          6.9      27.6      0.0
2                   1,094.1       0.0               59.4          1.0      27.6      0.0
3                   1,090.4       0.0               60.5          0.0      27.6      0.0
5                   1,090.3       0.0               60.5          0.0      27.6      0.0
10                  1,090.3       0.0               60.5          0.0      27.6      0.0
```

Unbound, the optimiser builds 60.5 GW of utility solar and 27.6 GW of batteries. No wind, no
rooftop, no gas. The answer stops moving at three times the current caps, so that is where the
economics stop being constrained by the pace assumption.

THREE THINGS WORTH SITTING WITH.

WIND, ROOFTOP AND GAS ARE ALL ARTEFACTS OF THE CAP. Each appears only because solar and storage
are not allowed to build fast enough. At 1.5x the caps wind is gone entirely; by 2x rooftop is
nearly gone; gas disappears between 1x and 1.5x. Every one of them is in the current schedule as a
SUBSTITUTE for solar that the model is forbidden to build, not because it is cheaper.

THE WHOLE RANGE IS WORTH ONLY R37bn, 3.2% of the objective. Fifteen years of building at ten times
the current pace saves 3% against building at the current one. That is the strongest argument yet
that the pace assumption, which moves R28.5bn on its own, is doing more work than it can carry -
and also that the urgency case here is not a cost case.

THE UNBOUND SCHEDULE IS NOT A PLAN. It builds 7.6 to 8.6 GW of solar in single years and nothing
in 2026 to 2029 except batteries, because with perfect foresight and no ramp limits there is no
reason to start early. A real build cannot do that, which is exactly why the caps exist. The right
reading is not "build 60 GW of solar" but "every megawatt of wind, rooftop and gas in the capped
schedule is there because of the cap".

CAVEATS. Rooftop and utility solar share a resource profile here, so the model has little reason
to prefer rooftop once utility solar is unconstrained - it does not see the network cost rooftop
avoids, nor the household's own reasons for installing it. Wind's disappearance is more striking
and less easily explained away, and deserves its own test: this model's wind is regionally
profiled and capacity-weighted, so a result that says 'no wind at all' should be interrogated
before it is repeated.

### PROVISIONAL pending the storage fix - Raising the solar caps nearly removes the gas, 1 Oct 2026

Build `2026-10-01a`. The deliverable pace now allows 2.5 GW a year of utility solar and 2 GW of
rooftop, against 2.0 and 1.0. The schedule below was cap-bound in almost every year, so this moves
the answer more than any cost assumption does:

```
                      wind GW   solar GW   rooftop GW   batt GW   gas GW   objective R bn
caps 2.0 / 1.0           11.4       30.0         12.2      20.5      2.9          1,155.9
caps 2.5 / 2.0            4.1       37.5         17.2      25.6      0.8          1,127.4
```

Gas falls from 2.9 GW to 0.8, wind from 11.4 to 4.1, and the objective by R28.5bn. Building solar
and storage faster removes most of the case for both gas and wind - which is the same trade the
storage-pace work found, now with the solar side of it attached.

THE EVIDENCE FOR THE CAPS, with its disagreement left in. South Africa added 2.6 GW of solar in
2023, its record, though sources differ on whether that figure is all solar or residential rooftop
alone; 1.1 GW in 2024 after demand fell 60 to 80% when load shedding eased; and 1.6 GW in 2025,
against SAPVIA's own forecast of 2.5 to 3 GW for that year. Australia installed 1.9 GW of ROOFTOP
in six months on annual demand close to South Africa's.

So 4.5 GW a year across both lines is above every year South Africa has recorded and below what a
comparable system currently absorbs. A cap is permission, not a forecast: it says the optimiser
may build this fast, not that the market will. That distinction matters more here than usual,
because the result moves R28.5bn on it.

WHAT THIS DOES NOT SETTLE. Australia's rate rests on fifteen years of installer base, household
finance and connection rules that South Africa does not have at that scale. And the schedule is
STILL cap-bound: solar runs at 2,500 MW in all fifteen years and rooftop at 2,000 in eight, so
the optimiser would take more if offered it. The binding constraint is the assumption, not the
economics, and no run has yet found the level at which that stops being true.

### PROVISIONAL pending the storage fix - The least-cost path to 2040, and the year it reaches for gas

Build `2026-10-01a`, 1 Oct 2026. The build optimiser's horizon is now a control - 2030, 2035 or
2040 - where it was fixed at five years. Fifteen annual steps is 93,156 rows and solves in 7.6
seconds against 31,056 rows and 1.7 seconds, so the horizon was never the obstacle the spec
assumed.

The schedule, Fossil-free 2040 at the deliverable pace, MW built each year:

```
2026-2028   pv 2,000      batt 1,530-1,580                    rooftop from 2028
2029-2032   pv 2,000      batt 1,830-2,000   rooftop 1,000
2033        pv 2,000      batt   910         rooftop 1,000   wind   683   GAS 563
2034        pv 2,000      batt 1,153         rooftop 1,000   wind 2,500   GAS 704
2035        pv 2,000      batt   767         rooftop 1,000   wind   478
2036        pv 2,000      batt 1,143         rooftop 1,000   wind 2,500   GAS 744
2037        pv 2,000      batt   798         rooftop 1,000   wind 2,500
2038        pv 2,000      batt 1,077         rooftop 1,000   wind 2,500   GAS 876
2039-2040   pv 2,000      batt   880-1,410   rooftop 1,000   wind   257
```

THREE THINGS THE SCHEDULE SAYS that an end-state figure cannot.

Solar and rooftop build at their caps in every single year, and wind at its cap in four. The
answer is substantially "build as fast as you are allowed", which means the pace assumption is
doing more work than the economics - and the pace is three times what South African procurement
has achieved.

Wind arrives in 2033 and not before. Solar and storage are cheaper per unit of energy early; wind
earns its place only once the system is deep enough into coal retirement to need the winter
energy. A plan that front-loads wind is not what least cost looks like here.

Gas appears in four separate years and totals about 2.9 GW, less than half the 6.6 GW the
two-year-step approximation gave. The coarser run overstated it, which is the right direction to
be wrong in but worth recording: the 6.6 GW figure should not be quoted now that an annual run
exists.

CAVEATS. Coal retirement is still an INPUT, not a decision - the optimiser is told when stations
go, and letting it choose would change the gas years. This is a screening run on representative
days with perfect foresight, so the 2.9 GW of gas is a proposal to be tested against twelve
weather years before it becomes a finding. And the gas it builds has nowhere to come from: no
import terminal operates before 2030 and the first reaches FID in 2028.

---

## Fossil free, re-measured

Build `2026-09-20a`, 19 Sep 2026. Replaces the superseded entry at the top of this file.

```
Fossil-free 2040
55 GW onshore wind, 90 solar, 5 offshore, 20 rooftop, 40 GW lithium at 8h
all 39.7 GW coal and all 3.4 GW diesel retired, no gas
zero unserved energy in all twelve weather years, zero diesel burned in any
R442.3bn/yr, 199 TWh curtailed, 150 GW of new capacity
```

THE OFFSHORE LEVEL IS SET BY DEPLOYABILITY, NOT COST. ESMAP's medium path is 5 GW by 2040 and
15 GW by 2050, and the mix follows:

```
                              total GW   curtail TWh   cost R bn
55 W / 90 S /  5 offshore          150         199.2       442.3   2040
45 W / 90 S /  8 offshore          143         180.9       444.9
40 W / 90 S / 10 offshore          140         174.0       450.6   2050
```

More offshore buys less curtailment and costs more. Ten gigawatts of offshore replaces forty of
onshore wind - the same ratio in every fossil-free run.

BINDING YEAR 2014 for every fossil-free build, against 2016 for Deep decarbonisation. A system
with no coal fails on a different weather pattern than one retaining 12.7 GW.

### Single-year screening picked the wrong build FOUR TIMES

Four builds showed zero unserved on 2018 alone; the worst of them failed at 969 GWh across
twelve years. The binding year has now come out as 2014, 2016, 2018, 2020 and 2022 depending
on the build, which is the point: THE BINDING YEAR DEPENDS ON THE BUILD, not on the weather
alone. Wind-heavy builds fail in a wind drought; offshore-leaning builds fail when the coast
is calm.

### And the grid missed the winning level three times

Offshore stepped 0/5/10/20 in one search and 0/10/20 in another. The winner was 1 GW in Deep
decarbonisation and 5 GW in fossil-free, and neither was tested. The ESMAP shapefile's wind
classes are integer bins that could not rank within a class either. THE STEP SIZE KEEPS
EXCLUDING THE INTERESTING REGION - screen coarsely, then refine locally.

---

## Deep decarbonisation, re-optimised with offshore

> RENAMED 19 Sep 2026: the preset key is now `Deep decarbonisation 2035`, and the fossil-free
> one is `Fossil-free 2040`. Entries dated before then use the old names and are left as they
> were written.


Build `2026-09-20a`, 19 Sep 2026. Now 45 GW onshore wind, 45 solar, 1 offshore, 20 rooftop,
20 GW lithium at 6h, scenarioYear 2035. Twelve weather years:

```
                     total GW   worst yr GWh   curtail TWh   cost R bn   Mt CO2
45 W / 52 S / 0 off        97            197         112.3        294.1       40
45 W / 45 S / 1 off        91            184         103.1        290.4       39
```

Better on cost, reliability, curtailment, emissions and total capacity at once.

THE GAIN IS THE SMALLER SOLAR FLEET, NOT THE OFFSHORE. Holding solar at 45 GW and ADDING
offshore makes solar worse:

```
                          solar spilled   capture R/MWh
45 solar, no offshore             61.1%             155
45 solar + 1 GW offshore          62.2%             135
45 solar + 5 GW offshore          66.2%              95
```

Offshore competes with solar for the same headroom despite peaking at different times, because
the system is already saturated - any additional energy displaces something. A first version of
this entry claimed offshore displaced solar from already-spilled hours. It does not, and the
measurement is the other way round.

SOLAR SPILLS 61% OF ITS POTENTIAL in this preset either way. A 45 GW solar fleet delivers about
what a 17 GW one would if it could sell everything.

1 GW is the only deployable level: ESMAP put 1 GW offshore by 2035 in their medium and high
scenarios.

---

## Demand response was free storage

Build `2026-09-20a`, 19 Sep 2026. The shift was energy-neutral - 100 MWh out of the peak
returned 100 MWh into the trough - which made demand response a lossless store in the dispatch.

A geyser reheated six hours later has lost standing heat; a pre-cooled building conditions space
that did not need it. Now 6%, so 100 MWh returns 106. LBNL measures 10-20% for pre-cooling;
water heating sits lower and South African shiftable load is geyser-dominated. A BRACKET, not a
South African measurement.

Effect is small at Deep decarbonisation levels - curtailment 101.5 to 100.9 TWh - because the
returned energy lands in hours that were spilling anyway. It matters where the trough is tight.

THE SUBSTITUTION FINDING ABOVE (6.8% of load buying 20 GW of renewables) WAS MEASURED WITHOUT
IT and is therefore optimistic.

---

## SUPERSEDED - A fossil-free South Africa, scored on its worst year

> Every figure below predates 18-19 Sep 2026 and is stale on FOUR counts: fixed O&M for the
> existing fleet was absent, the REIPPPP PPA obligation was absent, offshore wind did not
> exist in the model, and BLD_COST.offshore was back-solved from an LCOE. See "Fossil free,
> re-measured" below. The METHOD survives - score on the binding year, never a single year -
> and it is the method that mattered.

Build `2026-09-17a`, 17 Sep 2026. 72 builds x 12 weather years, 864 dispatches.

CONSTRAINTS. All coal retired (`coalDecomMW` 42,000 against 39,692 MW installed), all
diesel retired (`dieselDecomMW` 3,400), no new gas, no new nuclear. Kept: Koeberg
1,880 MW, hydro 602 MW, CSP 600 MW, the 1,150 MW Cahora Bassa import at 85% (hydro),
existing wind, solar, rooftop and pumped storage. NO BUILD BURNS ANY DIESEL IN ANY
YEAR, so the constraint holds rather than being approximated.

SCORED ON THE BINDING YEAR, not the average. A build that works in a good year and
fails in a bad one is not a plan.

```
zero unserved energy in EVERY one of twelve years - 22 of 72 builds
  cheapest   80 GW wind / 100 GW solar / 40 GW lithium at 8h
             R421.5bn/yr, 234.9 TWh curtailed

worst year under 100 GWh/yr
  cheapest   60 GW wind / 100 GW solar / 40 GW lithium at 8h
             R373.8bn/yr, 83 GWh in its worst year, 8 GWh on average
```

INSURANCE AGAINST THE TWELFTH YEAR COSTS R48BN A YEAR, 13%, to go from 83 GWh of
unserved energy to none.

### The binding year is 2018 and 2014, not 2016

```
year   builds it binds for
2018                    23
2014                    22
2020                    16
2016                     9
2015                     2
```

An earlier single-year run used 2016 because it was worst at one specific build. It is
not the worst year generally. SINGLE-WORST-YEAR DESIGN OPTIMISES AGAINST THE WRONG YEAR
for two thirds of builds.

### The mean is useless here

The best builds average 4 to 8 GWh of unserved energy a year while their worst year runs
39 to 94. An average would describe a system that fails.

### Iron-air appears in none of the 22 robust builds

At `BLD_COST.ironair` R127,050/kW it loses to overbuilding wind in every weather year
tested. This is now a twelve-year result rather than a single-year artefact, and it
rests entirely on the cost: at Form Energy's USD 20/kWh target the figure is R33,000/kW
and the conclusion reverses.

### SUPERSEDED 23 Sep 2026 - Duration substitutes for power, and is worth about 8%

20 GW at 12 hours appears repeatedly among the cheapest robust builds against 40 GW at
8 hours. Same energy, fewer inverters. On the 2018 binding year, 20 GW at 12h costs
R355.9bn with 97 GWh unserved against R385.8bn at 40 GW / 8h with none.

CAVEATS. One dispatch model, national, with a flat 4% congestion derate rather than
real siting. Nuclear is an uncurtailable flat block contributing 11.5 TWh it can never
back off in a system spilling 235 TWh. And the twelve weather years are reanalysis, not
twelve realised South African years, so the tails may be understated.

---

## What a capacity payment for long-duration storage would have to be

Build `2026-09-17a`, 17 Sep 2026. Iron-air, 100 hours, vintage 2030.5, worst weather year.

```
overnight cost                        R127,050/kW   (R96,172 at the 2030.5 vintage)
annualised, 20 yr at 8%                 R9,795/kW-yr
model's capacity payment default           R300/kW-yr

build    discharge   energy revenue   annual capex   payment needed
10 GW     0.44 TWh          R4.14bn        R98.0bn      R9,382/kW-yr
20 GW     0.50 TWh          R2.25bn       R195.9bn      R9,683/kW-yr
```

THIRTY-TWO TIMES THE MODEL'S DEFAULT RATE, and that is a FLOOR: iron-air has no fixed
O&M anywhere in the model.

TWO THINGS SHARPER THAN THE HEADLINE.

Energy revenue FALLS as you build more, R4.14bn at 10 GW to R2.25bn at 20 GW, because
the second tranche removes the scarcity hours the first was earning in. INSURANCE
DESTROYS ITS OWN REVENUE. That is the clearest statement of why this cannot be an
energy-market asset.

And the payment needed per kW RISES with the build, R9,382 to R9,683, for the same
reason. There is no volume discount; it gets worse.

### The cost constant was wrong by a factor of three

`BLD_COST.ironair` read R39,000/kW until 17 Sep 2026, which is Form Energy's stated
USD 20/kWh TARGET plus a little. Its own comment said to check the figure if iron-air
ever started winning in the optimiser. It had started winning. Corrected to R127,050/kW,
the pre-incentive price implied by the Form Energy / Google / Xcel 30 GWh deal at
USD 77/kWh, which is what `FIXED.acapIronAir` already used and sourced. ANY EARLIER
RESULT WHERE IRON-AIR WON THE OPTIMISER IS SUSPECT.

### South Africa has no reliability threshold to compare this against

The Grid Code and Distribution Network Code require a NERSA-approved Cost of Unserved
Energy, approved 2015 and updated 2016, and COUE is an IRP input. So the test is
ECONOMIC, not a fixed ceiling, and the right comparison is the break-even cost of
unserved energy rather than a capacity rate. On Deep decarbonisation that break-even is
R7,929/kWh at 27 GW of coal retired and R154/kWh with the coal gone - a fiftyfold
improvement, because the asset finally has something to do. PRICING A CAPACITY PAYMENT
FOR LONG DURATION IN TODAY'S SYSTEM ANSWERS A QUESTION NOBODY HAS.

---

## Daily demand flexibility substitutes for about 20 GW of renewables

Build `2026-09-17a`, 17 Sep 2026. Binding year 2018, all coal and diesel retired,
cheapest build with zero unserved energy at each level of `drShiftPct`.

```
flexibility, % of annual load      cheapest build                     cost R bn   curtail TWh
0.0                                60 GW W / 100 GW S / 40 GW batt        373.8         171.7
2.2                                60 GW W / 100 GW S / 40 GW batt        373.8         172.0
4.5                                80 GW W /  60 GW S / 40 GW batt        350.0         159.9
6.8                                60 GW W /  80 GW S / 40 GW batt        338.0         134.9
```

6.8% of annual load shifted within the day buys 20 GW OF RENEWABLES, R35.8BN A YEAR
AND 36.8 TWH LESS CURTAILMENT - about 10% of system cost.

THREE THINGS THE TABLE SAYS.

The return is NON-LINEAR and starts at nothing. 2.2% changes the build not at all and
makes curtailment marginally worse. Gains appear above about 4%, because flexibility
has to be large enough to move the binding hour.

It substitutes SOLAR, not wind. Every step down removes solar while wind holds or
rises. Shifting load within a day aligns it with the midday solar peak; it does nothing
for a multi-day wind drought, which is what wind capacity is there to cover.

The CURTAILMENT gain is the larger prize: R35.8bn of cost against 36.8 TWh of avoided
spill.

### The control cannot express more than 6.8%

`drShiftPct` is labelled as a share of daily load but takes that share of each of the
SIX HIGHEST NET-LOAD HOURS, so the share of annual energy moved is about a quarter of
the slider value. Its maximum of 30% reaches 6.8% of annual load. The label was
corrected on 17 Sep 2026 to show both numbers.

For context, NREL puts demand response at about 5% of annual demand made flexible in a
decarbonised US grid by 2035, so 6.8% is already at the optimistic end and 15% would be
three times a published estimate.

REBOUND IS MODELLED. The dispatch water-fills the shifted load into the twelve lowest
net-load hours rather than dumping it in blocks, because dumping produced an artificial
05:00 rebound spike where returning load collided with storage charging.

---

## SUPERSEDED 23 Sep 2026 - Lithium saturates, and the Deep decarbonisation preset was three times past it

> Measured when battery capital scaled straight off duration, which priced an 8-hour system at
> twice a 4-hour one and made inverters free. Re-run below. The saturation itself survives; the
> cost column does not.

Build `2026-09-17a`, 17 Sep 2026. Swept on Deep decarbonisation at 6 hours; system cost
already carries new-build capex.

```
new lithium   system cost   new capex   unserved GWh   curtail TWh   cycles/yr
0 GW             R233.2bn    R190.1bn          1,481         129.1         234
2 GW             R231.9bn    R194.6bn          1,052         127.0         189
5 GW             R232.1bn    R201.4bn            657         124.6         157
10 GW            R236.2bn    R212.6bn            334         122.1         113
15 GW            R244.8bn    R223.9bn            189         121.1          84
20 GW            R255.3bn    R235.1bn             78         120.8          65
30 GW            R277.5bn    R257.6bn             27         120.5          44
45 GW            R311.1bn    R291.4bn              0         120.4          30
```

DISCHARGE SATURATES AT ABOUT 8.1 TWH. Going 20 to 45 GW more than doubles the fleet and
adds 2% more delivered energy. Curtailment barely moves across a thirty-fold increase in
storage, 128 to 120 TWh, because the spill is SEASONAL and a six-hour asset cannot reach it.

With unserved energy priced, the optimum is 8 GW at R20/kWh, 12 at R50, and 20 GW at
R100 and above, where it stops moving. Going 20 to 30 GW costs R22.2bn/yr to avoid
51 GWh, needing a cost of unserved energy above R435/kWh.

THE PRESET CARRIED 30 GW AND WAS MOVED TO 20 ON 17 SEP 2026. Everything that rested on
it moved with it: new-build capital R0.886 to R0.823/kWh, the retail headline R5.08 to
R4.91 regulated and R3.61 to R3.29 market-indexed, and both spreads WIDENED because less
storage means less price-smoothing.

Cycling at 1 GW on this preset is 203 times a year, which is what advanced markets see.
The 44 at 30 GW was saturation, not a dispatch fault.

---

## The storage endowment, and why it mattered only at long duration

Fixed 17 Sep 2026. Storage used to start each year at a flat 70% for pumped and 50% for
batteries, with no cyclic close, so the year opened with free stored energy that appeared
in no balance. The dispatch now runs the year TWICE, the second pass starting where the
first finished.

```
scenario                  endowment   avgCost with / without   unserved GWh with / without
defaults                     44 GWh          548 / 548                    3 / 3
Crisis 2023                  44 GWh        1296 / 1296             17,504 / 17,522
Deep decarbonisation        104 GWh        1179 / 1179                   78 / 87
plus 20 GW iron-air       1,104 GWh        2459 / 2432                    0 / 9
```

AT PRESET SCALE IT MOVED NOTHING, so no published figure needed rebasing. It bit only
where the endowment was large relative to the gap, which is exactly long-duration
storage: half of 100 hours is 50 hours of free energy.

It also diverged from this project's own cross-validation. `validation_README` records
the PyPSA comparison's initial state of charge as computed with CYCLIC INITIALISATION
rather than hardcoded, so the browser model and the comparison were not starting from
the same system, and the 0.42% agreement between them was measured across that difference.

---

## The Seriti Green scenario

Their July 2026 published simulation, reproduced 27-28 Aug 2026.

CAPACITIES ARE TOTALS. The control is `newWindMW`, which carries NEW BUILD ONLY, so
the value to enter is the total less the existing fleet. Both are written out below,
because the expression form caused a mis-set scenario on 15 Sep 2026 and because it
DRIFTS: `FIXED.windMW` was 4,458 when this entry was written and is 4,612 now, so
the same expression gives a different new-build figure while the total does not move.
Enter the total, derive the control value, and check the result.

```
control        enter          total          note
newWindMW      15,388         20,000 MW      total less FIXED.windMW 4,612
newPvMW        21,729         25,000 MW      total less FIXED.pvUtilityMW 3,271
newBattMW      20,000         20 GW / 200 GWh   newBattHours 10
coalDecomMW    32,000                        leaves ~10 GW = Medupi + Kusile
newNuclearMW   0
coalEAFPct     70
newCcgtMW      25,000                        gas as backup
```

### Where the two models agree

```
                    GridTwin July      Seriti July
peak gas               19.6 GW            18 GW
curtailment                  0                0
unserved                     0                0
```

### Where they differ, and why

```
gas energy            2,815 GWh        5,553 GWh
```

GridTwin dispatches the retained Medupi and Kusile ON MERIT, running 4,479 GWh in
July. Seriti scale thermal output to a fixed capacity share (~25%) and let gas
fill the residual. Most of the gap is that one modelling choice. UNCONFIRMED -
this reading has not been put to them yet.

### Their wind-heavy sensitivity replicates, and more strongly

At equal 45 GW total, no gas:

```
                unserved GWh    RE residual
20 GW W / 25 S        15,206          56.4%
25 GW W / 20 S        12,355          58.0%
```

They found the same direction on a five-point ERA5 composite. GridTwin finds it
on regional MERRA-2 profiles at capacity-weighted plant locations. Their
conclusion survives a more granular wind model. THIS IS THE STRONGEST THING TO
LEAD WITH in any outreach.

### Their solar assumption is self-contradictory

Their page says the 25 GW may include a mix of utility and rooftop, AND that
existing embedded generation is already in Eskom's demand data. Both cannot hold.
Read both ways:

```
25 GW utility PV on top of rooftop     51.4% total mix, 31.3 TWh gas
25 GW including the 8.6 GW rooftop     46.5% total mix, 41.9 TWh gas
```

Five points of penetration and a third of the gas energy. Larger than most of the
differences between the two models.

### Their installed base is light

```
              Seriti      GridTwin register
wind           4 GW              4,612 MW
utility PV   2.6 GW              3,271 MW
```

The 2.6 looks like a REIPPPP-only figure omitting privately wheeled and
Eskom-owned plant.

---

## Long-duration storage in a system that has gas - SCOPE CORRECTED

UPDATED 7 Oct 2026, build 07s: with new wind on the modern-turbine profile, the with-gas test reads July gas
425 -> 0 GWh with 20 GW of 100-hour iron-air (was 846 -> 832); provisional, see "PROVISIONAL - With gas, 100-hour iron-air removes July gas".

Their conclusion is that the deficit needs firm wind or SEASONAL STORAGE. Tested
directly. July gas energy, Seriti scenario:

```
lithium 20 GW / 10h                 2,815 GWh    19.6 GW peak
+ vanadium 10 GW / 8h               2,815 GWh    19.6 GW peak
+ iron-air 5 GW / 100h              2,815 GWh    19.6 GW peak
+ iron-air 10 GW / 100h             2,815 GWh    19.6 GW peak
+ iron-air 20 GW / 100h             2,815 GWh    19.6 GW peak
iron-air 20 GW, no lithium          3,015 GWh    19.6 GW peak
```

Twenty gigawatts of 100-hour iron-air is two TERAWATT-hours of storage and it
changes July by NOTHING, to three significant figures. Iron-air alone makes it
worse. There is no surplus to store; the deficit is an energy shortage, not a
shifting problem.

Annual effect is real but happens in other months: gas 30.7 to 29.7 TWh,
curtailment to zero.

### SCOPE CORRECTED 17 Sep 2026. This does not generalise.

The entry originally ended "SEASONAL STORAGE DOES NOT SOLVE IT EITHER - a stronger
claim than Seriti's own". That claim was wrong and has been removed.

It was measured on the Seriti scenario, which carries 25 GW OF GAS and spills NOTHING.
Of course a store did nothing: there was no surplus to put in it. In a high-renewables
build there is over 100 TWh of spill a year, and the same technology behaves completely
differently. Measured on build `2026-09-17a`, all coal retired, Deep decarbonisation:

```
coal retired   iron-air   unserved GWh   Fe discharge TWh
27 GW             0 GW              78               0.00
27 GW            20 GW               0               0.16
32 GW             0 GW             368               0.00
32 GW            20 GW               0               0.64
37 GW             0 GW           1,257               0.00
37 GW            20 GW               0               2.18
42 GW             0 GW           2,359               0.00
42 GW            20 GW               0               3.99
```

LONG-DURATION STORAGE REPLACES COAL'S ADEQUACY ROLE COMPLETELY, at every level of
retirement, up to and including the whole fleet. On the worst weather year at 50 GW
wind / 60 GW solar, 20 GW of 100-hour storage takes 250 GWh of unserved energy to zero.

And it does it at UNDER TWO CYCLES A YEAR. 3.99 TWh discharged against 2 TWh of
installed energy is 0.84 cycles at full coal retirement; 0.25 cycles on the worst
weather year. Discharge is 92% in July and 8% in August, nothing in the other ten
months - it fills over summer and empties into the winter, which is the seasonal
insurance behaviour the technology is for.

THE NUMBER TO QUOTE IS THE CYCLE COUNT, NOT THE MEGAWATT-HOURS. An asset that runs
less than once a year cannot be paid by an energy price at any scarcity level, because
it is not there for the energy. That is the capacity-payment argument as a measurement
rather than an assertion.

CAVEAT ON THE OLD FIGURES ABOVE. The July table predates the cyclic storage fix of
17 Sep 2026, when storage stopped being handed a free half-tank at hour zero. At
long-duration scale that endowment was up to 1 TWh against gaps of tens of GWh. The
figures below the correction are post-fix; the July table is not.

---

## Lithium duration: the wall, priced

Seriti scenario, varying `newBattHours`:

```
duration    gas TWh    curtailment TWh    new capex R bn
   4h         31.26          0.689              121
   6h         30.91          0.312              136
   8h         30.80          0.203              151
  10h         30.74          0.158              166
  12h         30.68          0.112              181
```

4h to 10h: gas down 1.7%, capex up 37%.

CONSISTENCY CHECK, unplanned: 20 GW at 10h gives 30.735891678 TWh, IDENTICAL to
50 GW at 4h. Same stored energy, same answer, two routes.

CAVEAT: the capex column covers lithium only. Vanadium, iron-air and pumped
storage are ABSENT from `newCapexR` - see STATE.md open items.

---

## The no-gas frontier

SUPERSEDED 15 Sep 2026. The curtailment figure does not reproduce, though by less
than first reported. Kept because it was published.

Measured on the entry's own settings - Seriti scenario, `newCcgtMW` 0,
`coalDecomMW` 32000 leaving about 10 GW, `coalFlexPct` 100, 20 GW at 10 hours, and
and wind and solar read as TOTALS: enter newWindMW 45,388 for 50,000 MW total, newPvMW 56,729 for 60,000 MW total.

```
50 GW wind / 60 GW solar     published        measured 15 Sep
curtailment                   94.7 TWh              101.7 TWh
unserved                         0 GWh                 79 GWh
```

7.4% apart. A FIRST MEASUREMENT REPORTED 29%, and that was an error in the
measurement, not the model: `newWindMW` was passed as 50000 rather than
50000 - FIXED.windMW, giving 54.6 GW of wind and 63.3 of solar against the intended
50 and 60, and 121.8 TWh of spill. Recorded because the entry's own notation is what
made it easy to get wrong.

RULED OUT BY MEASUREMENT, not by argument, on the oversized run:

```
                          curtail TWh   unserved TWh
oversized frontier              121.8          0.052
reserve requirement off         121.7          0.050
reserveVrePct 0                 121.5          0.050
congestion derate off           133.5          0.042
```

The 29 Aug reserve consolidation was the leading candidate and it is not the cause.
The gross requirement is larger at this build than at defaults, 2,322 MW against
1,309, but switching reserve off entirely moves curtailment 0.1 TWh. Congestion runs
the OTHER WAY: removing the 4% derate raises spill to 133.5 TWh.

> CAUSE CONFIRMED 1 Oct 2026, and the gap is smaller than the noise it sits in. The same
> scenario run across twelve weather years gives curtailment of 99.8 to 123.5 TWh, median 115.8,
> a spread of 20.5%. The August 94.7 and September 101.7 differ by 7.4%, which is a third of the
> weather spread: two runs of the same build on different profile sets would be expected to
> differ by about this much or more. The hypothesis below was right, and neither figure should
> have been quoted as a level without a range.
>
> Note the unserved figure barely moves - 359 to 361 GWh across all twelve years - so the
> adequacy side of this entry is robust where the spill side is not. That asymmetry is the
> general finding: shortage is set by the build, spill by the weather.

PROBABLE CAUSE OF THE REMAINING 7.4%, UNPROVEN: the profile set. This file's own
opening caveat says every entry was measured on one synthetic-normal weather year.
The model now runs real 2025 Eskom profiles from `profiles.json`, and the regional
weather set went from ten years to twelve. A frontier is defined by its worst week,
which is exactly what changes when the weather set changes. `profiles.json` carries
no version history, so the August inputs cannot be reconstructed and this stays a
candidate rather than a finding. A 7.4% unexplained gap reads differently from the
29% first reported: the 110 to 120 GW conclusion probably survives it.

WHAT SURVIVES. The grid below has been RE-RUN on this build, 15 Sep 2026. The 110 to
120 GW combined-build conclusion and the "two and a half times the build to remove
the gas" claim are THRESHOLD-DEPENDENT and do not stand on their own: at the Australian
0.002% standard the same grid gives 160 GW. The August
grid drew the frontier where unserved read exactly zero, and on this build nothing
reaches zero anywhere. See the re-run below.

RE-RUN 15 Sep 2026, build `2026-09-15a`. The conclusion survives, the method does not.

Settings as above: `newCcgtMW` 0, `coalDecomMW` 32000 leaving about 10 GW,
`coalEAFPct` 70, `coalFlexPct` 100, `newBattMW` 20000, `newBattHours` 10,
`newNuclearMW` 0. Capacities are TOTALS; the control takes new build, so each cell
enters total less `FIXED.windMW` 4,612 or `FIXED.pvUtilityMW` 3,271.

Unserved energy, GWh/yr:

```
wind\solar     25 GW     40 GW     60 GW     80 GW
   20 GW       22,528    12,338     3,498     1,045
   30 GW        9,591     3,731       620       184
   40 GW        3,441     1,013       182        59
   50 GW        1,200       361        79        41
   60 GW          476       168        49        23
   70 GW          270       124        37        15
   80 GW          164       102        23         4
```

Curtailment, TWh/yr, same grid:

```
wind\solar     25 GW     40 GW     60 GW     80 GW
   20 GW          0.0       3.2      24.0      60.8
   30 GW          1.7      14.3      47.7      88.6
   40 GW         12.5      34.9      74.4     115.7
   50 GW         32.8      60.4     101.7     144.0
   60 GW         58.9      88.9     130.3     172.7
   70 GW         87.0     117.6     159.2     201.5
   80 GW        116.2     147.3     189.4     231.7
```

NOTHING REACHES ZERO. Every cell is higher than the August run, between 1.5x and
12x, and the minimum anywhere in the grid is 4 GWh at 80W/80S. The frontier as the
August entry drew it - the locus where unserved becomes exactly zero - does not
exist on this build.

But exact zero was never a reliability standard. It is a rounding. The answer depends
entirely on the threshold, and THE THRESHOLD IS NOT A DETAIL - it moves the
conclusion by 40 GW:

```
threshold                            frontier              combined build
0.002% unserved energy, 4.3 GWh      80W / 80S only              160 GW
100 GWh, 0.046%                      50W/60S and 40W/80S      110-120 GW
exactly zero (August run)            several cells            110-120 GW
```

SOUTH AFRICA HAS NO PUBLISHED FIXED THRESHOLD, and that is deliberate. The Grid Code
and the Distribution Network Code require a NERSA-approved Cost of Unserved Energy,
approved 2015 with levels updated 2016, and COUE is an IRP input parameter. The
intended test is ECONOMIC: build until the marginal cost of avoiding unserved energy
equals COUE. Not a fixed ceiling.

The 0.002% line is the Australian NEM reliability standard, alongside the usual
0.1 days/yr LOLE and 2.4 h/yr LOLH. It is the only published standard cited here and
it is not South Africa's.

The 100 GWh line is MINE, chosen on 15 Sep 2026 AFTER seeing the grid, and it happens
to reproduce the August conclusion. That is a reason to distrust it, not to rely on
it. It is 23x looser than the Australian standard.

WHAT TO QUOTE. Not "110 to 120 GW". Either quote the grid with the threshold attached,
or do the COUE comparison properly - the model carries costs, so the economic test is
available and has not been run. Until then the two-and-a-half-times claim is a
function of a number nobody sourced.

THE PRICE IS CURTAILMENT. At 50 GW wind / 60 GW solar the system throws away
101.7 TWh a year, against 94.7 in August, more than 45% of demand. Building for the
worst week and wasting the output the rest of the year. Gas is almost certainly
cheaper - but that comparison needs the storage capex fix first.

### The August grid, for reference

```
wind\solar     25 GW     40 GW     60 GW     80 GW
   20 GW       15,206     5,775       661        89
   30 GW        5,804     1,274        95        10
   40 GW        1,870       251        20         0
   50 GW          574       108         0         0
   60 GW          184        35         0         0
   70 GW          102         0         0         0
   80 GW           26         0         0         0
```

---

## The electrolyser panel answers a different question from the hydrogen pipeline

NOT A FINDING. A scope note, written 16 Sep 2026 to stop one being written by mistake.
It sits here because the 101.7 TWh of spill above is exactly what makes a reader reach
for electrolysers as the answer.

WHAT THE MODEL DOES. The panel treats hydrogen as a BUYER OF CURTAILED ENERGY: a
flexible sink that runs when there is spill, priced at R1.05/kWh from a $4/kg target.
It answers "what would curtailed energy be worth if something could absorb it".

WHAT IS ACTUALLY BEING BUILT. South Africa's National Green Hydrogen Deal Book, first
wave announced 15 Sep 2026, is six projects:

```
Phelan Green e-SAF, Saldanha Bay        construction Q1 2027, first export Q1 2029
Hive Energy green ammonia, Coega        early prep done, not at FID
Saldanha hydrogen DRI                   prefeasibility
Prieska Power Reserve, Northern Cape    development, domestic ammonia
Green e-Fuels methanol, Gauteng         prefeasibility, European demand
Green Hydrogen Solutions, Eastern Cape  FEED complete, domestic, smaller scale
```

Export ammonia, e-SAF, methanol and direct reduced iron. Every one is a FIRM
INDUSTRIAL LOAD with heavy capital and downstream chemistry that does not cycle
freely. They will contract dedicated generation, not grid spill. So the two are not
the same thing and the panel's number must NOT be quoted as what these projects would
pay or absorb.

THREE THINGS THAT FOLLOW.

The modelled load is flexible and the real one is not, so the panel's curtailment
capture is an upper bound on what a firm plant could take.

The panel is NATIONAL and the pipeline is at Saldanha, Coega, Prieska and Gauteng. A
multi-gigawatt load at Saldanha changes corridor flows. The model has ten regions and
corridor limits and could carry this; it does not yet.

Nothing is at scale before 2029. One project has a construction date. Any scenario
leaning on electrolyser demand before 2030 is ahead of the pipeline.

NO PUBLISHED ELECTROLYSER CAPACITY. Neither the announcement nor the coverage gives
MW, so `h2GW` has nothing to calibrate against. The Deal Book itself may carry them.

The minister's own framing is worth keeping, because it is this file's discipline in
someone else's words: inclusion in a Deal Book is not FID, priority status is not
construction, a memorandum of understanding is not a bankable customer agreement, an
expression of investment interest is not committed capital, and none of these on its
own constitutes a gigawatt.

---

## Flexibilising the coal fleet does NOT improve adequacy

Requested as a hypothesis; the test returned the opposite. No gas, 10 GW coal:

```
                    inflexible   flexible     delta
ramp %/hr                 24.0      100.0      +76.0
coal TWh                  50.3       47.4       -2.9
battery TWh                6.8        5.5       -1.3
pumped TWh                 5.4        4.7       -0.7
unserved GWh          14,078.5   15,206.2   +1,127.8
```

MECHANISM, confirmed by measurement rather than inference: rigid coal cannot back
off fast enough during renewable surplus, so it is forced to keep generating
(index.html, the coalFloor branch). That forced output charges pumped storage and
batteries. In a normal system this is the well-known pathology of inflexible coal
wasting renewables. In a NO-GAS system it becomes an accidental virtue, because
the storage it fills is the only thing left to cover the drought. Flexible coal
backs down properly, generates 2.9 TWh less, and storage delivers 2 TWh less.

WHAT IT IS NOT: the four-hour ramp-aware look-ahead was hypothesised as the cause
and TESTED. It is not. Sweeping `coalLookaheadH` from 2 to 48 hours changes the
flexible case by ZERO across the whole range, because at 100%/hr the ramp term
swamps the horizon and the floor collapses regardless. The horizon binds only in
the RIGID case, where 4h to 12h improves unserved from 14,078 to 13,695 GWh, a
2.7% gain that saturates at 12 and does nothing anywhere else tested.

SCOPE: this effect appears ONLY with no dispatchable backup at all. With Seriti's
25 GW of gas, flexibilisation makes no difference to adequacy. Flexibilisation is
a CURTAILMENT and EMISSIONS measure, not an adequacy one. State that caveat
whenever this result is quoted.

CAPACITY IS THE BINDING CONSTRAINT, NOT RAMP RATE. Retaining 20 GW of coal instead
of 10 cuts unserved from 15,206 to 768 GWh. Retaining 30 GW takes it to zero.

---

## The retail headline, and the sign flip the old pair hid

> SUPERSEDED 22 Sep 2026: every market-basis figure below was produced by an ORDC that read
> the reserve requirement as availability. See "ORDC read the requirement as availability".

Build `2026-09-15a`. Shadow dynamic row, ANNUAL average, not a week. Panel controls
are `retBasis`, `retYear`, `retStranded` and nothing else; no electrolyser or
curtailment-sale setting reaches this panel.

```
preset                 year  stranded  basis   mean    spread   salesTWh  newCap
Deep decarbonisation   2035  on        reg     R5.38    1.1x     181.09   1.033
Deep decarbonisation   2035  on        mkt     R3.71    2.6x     181.09   1.033
Deep decarbonisation   2035  off       reg     R5.14    1.2x     181.09   1.033
Deep decarbonisation   2035  off       mkt     R3.63    2.7x     181.09   1.033
Deep decarbonisation   2026  on        reg     R6.22    1.1x     181.09   1.223
Deep decarbonisation   2026  on        mkt     R3.98    2.4x     181.09   1.223
Today 2026             2035  on        reg     R3.66    1.9x     213.61   0.000
Today 2026             2035  on        mkt     R4.54    2.6x     213.61   0.000
Today 2026             2026  on        reg     R4.08    1.8x     213.61   0.000
Today 2026             2026  on        mkt     R4.68    2.5x     213.61   0.000
```

THE MARKET BASIS CHANGES SIGN AGAINST THE REGULATED ONE. Higher on Today 2026,
R4.54 against R3.66. Lower on Deep decarbonisation, R3.71 against R5.38. With coal
and gas setting the price a market recovers more than the regulated allowance;
with zero-price hours over half the year it recovers far less. Quote both presets
or neither.

### The superseded pair

HANDOVER recorded R5.45 regulated and R3.51 market-indexed. Neither appears in any
of the sixteen states above. They are NOT REPRODUCIBLE on this build and should not
be reissued. They predate the 12 Sep `salesMWh` break and its 15 Sep repair, and
rescaling does not recover them either: 5.45 x 181.09/197.24 = 5.00.

### Why the denominator looks wrong and is not

Checked 15 Sep 2026 and rejected. `sales_twh` is 209.55, while Eskom reports
electricity sales of 189,723 GWh for FY2025 and 178,032 GWh for FY2026 - apparently
10% apart. The panel grosses up by `RETAIL_LOSS` of 8% at index.html:12386 and
12494, so the constant sits at the system level and the output sits at the meter:

```
384,610 / 209.55 = R1.8354   grossed up 8%  ->  R1.9950 at the meter
384,610 / 189.72 = R2.0272   already at the meter
denominators     209.55 x 0.92 = 192.8  against a reported 189.7
```

1.6% apart, not 10%. Moving to reported sales without also removing the gross-up
would double-count losses.

---

## Battery saturation in South Africa

SUPERSEDED 15 Sep 2026. The claim below is wrong and the correction inverts it.
Kept in full rather than edited, because it was published and someone may have
seen it.

### What was published

The country sits almost exactly at the knee.

```
fleet      ancillary R/MW/yr      total R/MW/yr
0.5 GW            197,100              304,165
3   GW            197,100              304,165
4   GW            189,216              296,281
6   GW            126,144              233,209
10  GW             75,686              182,751
```

Ancillary falls 61.6% between 0.5 and 10 GW. Revenue is FLAT to about 3.8 GW,
where the fleet's contribution first exceeds the reserve requirement (6% of a
32 GW peak = 1,920 MW). The existing fleet is 3,700 MW. The last point at which a
new battery earns the full ancillary rate.

Understates against ERCOT's ~90% because arbitrage is held flat in this model.

### The input, recovered

Not recorded at the time. Recovered by test on 15 Sep 2026: `asReserveOn` with
`asReserveRMWh` 150 and `asReserveShare` 0.15 returns 197,100 at a 0.5 GW fleet,
exactly. R22.50 and R45 were tried first and return 29,565 and 59,130.

### Why it is wrong

The 6% of a 32 GW peak was never a rule the model held. The panel did its own
flat-share-of-peak calculation and read `FIXED.peakMW`, which is NOT A KEY, so it
fell through to a hardcoded 32,000 - rule 7's exact shape, a fallback for a key
that does not exist, producing a plausible number rather than a crash. The 29 Aug
2026 consolidation replaced it with the engine's hourly series, and nobody
returned to the finding the bug had produced.

The requirement the model now holds is hourly:

```
reserveMWAt(h) = 794 MW contingency + 2.0% of net load + 5.0% of VRE output
```

net of VRE-provided reserve. Measured means, build 2026-09-15a:

```
scenario                     resReq mean    % of peak    knee = 2 x mean
defaults                        1,309 MW         3.9%           2,618 MW
Deep decarbonisation              829            2.4%           1,658
20 GW wind + 25 GW solar        1,199            3.6%           2,399
```

### The corrected claim

THE KNEE IS 2,618 MW, NOT 3,800. The existing 3,700 MW fleet is already 41% PAST
it, at a saturation factor of 0.71. A battery built today does not earn the full
ancillary rate; that point passed some time ago.

> CORRECTED AGAIN 23 Sep 2026, and it moves back the other way. The knee is twice the mean
> reserve requirement, and that requirement has changed twice since: to the ASTR's 2,200 MW on
> 21 Sep, and then growing with variable generation on 23 Sep. At defaults it now reads 2,237 MW,
> so the knee is about 4.5 GW against an existing fleet of 3.5 GW - pumped storage 2,724 MW plus
> 800 MW of batteries. South Africa is APPROACHING the knee, not past it: a battery built today
> still earns the full ancillary rate, and the saturation factor is 1.0.
>
> The sweep confirms it: revenue is flat at R197,100/MW-yr to 4 GW, then falls to R146,972 at
> 6 GW and R88,183 at 10 GW.
>
> The direction of the argument is unchanged and the urgency is lower than the September entry
> claimed. What matters for policy is that the knee is close - one procurement round of storage
> reaches it - so pricing ancillary services is worth settling before the fleet crosses it rather
> than after.

This points the same way as the old finding but harder. The case for pricing
ancillary services is more urgent, not less, because the saturation is already
here rather than approaching.

Note the direction on the second row: the requirement FALLS as renewables grow,
because curtailed VRE provides reserve in this model. That is the opposite of the
flat-percentage behaviour the old entry assumed.

### What is NOT reissued, and why

The ancillary column reproduces at R150/MWh and falls 73.8% across the range
rather than 61.6%, starting between 0.5 and 3 GW rather than staying flat to 3.8.
The TOTAL column does not reproduce: it now reads about R2.6m/MW/yr against a
published R304,165, a factor of 23. The old entry says arbitrage is held flat.
That was true when it was written and is not true now.

CAUSE ESTABLISHED 15 Sep 2026, and it is not a defect. The marginal price series
gained a scarcity tail from the VoRS work of 11-12 Sep. Capping the series
reproduces the old figure: at R1,500 arbitrage is 189,560 and at R1,000 it is
33,357, against a backed-out published 125,959. Uncapped it is 2,135,964, and six
hours above R20,000 carry 20% of that. See STATE.md open item 7.

No replacement table is published here, and that is now a PUBLISHING DECISION
rather than an open question. A battery revenue figure resting 20% on six hours of
an administratively set shortage price is a number about an assumption. If it is
reissued it must carry the VoRS shape with it.

REQUIRES `asReserveOn`. At defaults the panel shows a flat line and says so,
because South Africa prices no ancillary services today.
