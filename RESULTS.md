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

### Duration substitutes for power, and is worth about 8%

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

## Lithium saturates, and the Deep decarbonisation preset was three times past it

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
