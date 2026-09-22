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
