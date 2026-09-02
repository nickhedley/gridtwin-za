# GridTwin ZA - verified results

## The findings, ranked by how well they would survive a hostile reviewer

Thirty-four sections follow. This index exists because the file passed 1,400 lines and the
strongest results were no longer findable. Ranked by evidential strength, not by how
interesting they are - the two are not the same, and the difference matters when
choosing what to say in public.

### Tier 1 — arithmetic on published data. Nothing to dispute but the source.

**Connection headroom is the binding constraint, not wind speed.** The four best-wind
regions hold 100% of South Africa's existing wind and 7.3% of the national room to add
more. For solar they have zero headroom between them. Quantified 31 Aug 2026 across ten
weather years: **the correlation between wind capacity factor and connection headroom is
-0.91**, and the four worst-resource regions hold 78.3% of the room.
→ "The no-gas frontier", "Locational transmission signal"

**The no-gas frontier is not buildable on today's grid.** It needs 45,388 MW of new wind
and 56,729 MW of new solar; available headroom is 21,520 and 19,940. A 61 GW shortfall.
→ "The no-gas frontier"

### Tier 2 — tested across ten weather years, or against an optimal solve.

**Wind-heavy beats solar-heavy at equal capacity, in every one of ten years, by 15-19%.**
Replicates Seriti Green's own sensitivity on more granular data.
→ "The Seriti Green scenario"

**Long-duration storage does not solve a winter wind drought.** 20 GW of 100-hour
iron-air changes July gas by essentially nothing. Survived a heuristic, an optimal
storage LP, and a reserve-constrained LP - the most-tested result in this file.
→ "Long-duration storage", "Why long-duration storage does not bite"

**Flexibilising coal worsens adequacy in a no-gas system**, ten years out of ten, by
+1,057 to +1,223 GWh against a 4,200 GWh weather spread. Nearly independent of weather,
which is what a mechanism looks like rather than noise.
→ "Flexibilising the coal fleet"

**Solar cannibalises itself; wind does not.** Wind holds 96-107% of the mean price across
the whole build range while solar falls to 2.7%. Every solar plant produces in the same
hours. Re-verified 31 Aug against the corrected constants: four of five build points
reproduce within two points. **Solar already earns 24% below the market average today** -
the published version showed near-parity at the start of the curve and understated it.
→ "Capture rates"

**Connection headroom is worth 66 times more in the best region than the worst.** Duals
on the build LP's headroom constraints, re-verified 31 Aug with row counts reproducing
exactly (119,225 both ways). The EPP submission described a fiftyfold spread; it is
sixty-six-fold. Levels moved with the recalibration, ratios did not.
→ "Locational transmission signal"

**Northern Cape wind peaks at night in every one of ten weather years**, with a 25-40%
day-night swing, and has the best wind-solar complementarity in the country at -0.180.
Independently confirms two of three published Wind Pioneers observations on a different
dataset. Western Cape does not hold - it flips by year, so a single-year study finds
either answer.
→ "Wind Pioneers' diurnal observation"

**Demand response has an optimum near 7.5% and is counterproductive past 15%**, in every
one of ten weather years. The optimum lowers cost in 10/10 and 30% shifting reverses it in
10/10, saving R5.11 to R6.91/MWh at the optimum.
→ "Demand response has an optimum"

**Removing gas is cost-neutral at one point on the frontier, and the no-gas build carries
a seventh of the cost variance.** Ten weather years: the sign of the difference flips six
to four, on a spread of -10 to +3 R bn. But the gas scenario ranges R275-289 bn across
years while the no-gas build ranges R277-279 - same expected cost, far less exposure to a
bad wind year. Only at this one point on the frontier, and only if the connections
existed.
→ "The no-gas frontier"

**Eskom's tariff seasons are inverted against its own dispatch.** Megaflex prices Jun-Aug
as the expensive season; Eskom ran 83% of its peaker energy outside it. The modelled
low-season peak is dearer than the high-season peak, R1,475 against R1,277. Corroborated
by Eskom's own hourly file, so it is not a model artefact.
→ "Eskom's tariff seasons are inverted"

**Solar alone cannot cover more than 49% of a flat industrial load, anywhere in South
Africa.** Eight regions, ten weather years, under two points of spread. The ceiling is the
daylight fraction: only 49.3% of hours have any solar output. Sixteen times the plant buys
eleven points. Wind and a battery solve different halves of the problem, and together
reach 98%. Directly commercial - the wheeling market is sold on renewable share.
→ "Wheeling calculators"

### Tier 3 — single weather year, or dependent on the storage heuristic.

**Storage's ancillary market shrinks as renewables grow**, if curtailed plant may sell
reserve. Binary on that policy choice, insensitive to every numeric parameter.
**South Africa is already past the knee** - re-run 31 Aug puts it near 2.5 GW against an
existing 3.7 GW fleet, so a battery built today already earns a reduced ancillary rate.
The EPP submission's version of this is understated, not wrong.
→ "Battery saturation"

**Co-location value is U-shaped, not rising.** +130% today, +8% in 2030, +386% by 2035.
Arbitrage pays for volatility, and 2026 is volatile from scarcity while 2035 is volatile
from surplus. Corrected 31 Aug - the earlier version reported a rising curve, measured on
constants that suppressed today's scarcity pricing. **"Storage becomes valuable later" is
the wrong conclusion.**
→ "Hybrids"

### Withdrawn — kept deliberately

**~~OCGT: no flat availability factor reproduces both.~~** Withdrawn 31 Aug 2026, hours
after being written, and the successor diagnosis was withdrawn too - see "Validated
against Eskom's audited FY2026 generation". The settled answer is that 63% of Eskom's
peaker output runs below 25 GW of demand, which is reserve and network support rather than
energy, so no availability figure should reproduce it. I read `coalAvail` as the hourly dispatch limit when the binding one
is `cAvail`, capped by a stochastic outage path that was active all along - and I swept
single draws on a distribution where nine draws carry a 75% standard error. Re-run as
means, 61% availability reproduces both. **The second finding this file has withdrawn,
and the first written and withdrawn on the same day.**
→ "Validated against Eskom's audited FY2026 generation"

**~~The heuristic leaves 37% of July gas on the table.~~** Failed three successive tests
and was withdrawn the same day. A findings file that shows what did not survive is more
credible than one showing only what did.
→ "Why long-duration storage does not bite"

### Before quoting anything from this file

Read the fitness-for-purpose section at the top of state.md. Three things must not be
quoted: the withdrawn 37%, the rolling-horizon July figures, and `avgCost` as a tariff -
six of NERSA's thirteen price components are absent from it.

---


Findings fit to quote externally, each with the scenario that produced it. A
number without its scenario is not a result. Every entry states the weather year
and the period, because an annual figure and a July figure are not comparable.

Weather basis, settled 28 Aug 2026 after three attempts. Every result in this file is
now on ten real weather years, 2014-2023, except where a line says otherwise. Read this
before quoting anything.

The dashboard is not a synthetic or average year. `profiles.json` carries Eskom
hourly demand for 2025 and a metered wind series at 31.97% cf. The label
"synthetic-normal weather year" used in earlier versions of this file was simply
wrong.

Multi-year results are on ten MERRA-2 years, 2014-2023, capacity-weighted by
technology and bias-corrected to the metered basis. `weatherYearNational()`
previously weighted regions by demand share - Gauteng 31.5%, Northern Cape 1.4% -
when every megawatt of South African wind is in the Cape provinces and Hydra
Central. That produced wind capacity factors of 22.6-27.2%, below the 28-38% band
validate_benchmarks enforces, and no harness caught it because nothing exercised
the multi-year path. An intermediate version of this file reported gas figures ~35%
too high on that broken weighting. Those numbers are withdrawn.

Verification that the current basis is right: 2023 through the multi-year path now
returns 31.97% wind cf, identical to the dashboard for the same year.

2022 is the design year, with 2015 close behind. Wind output 46.0 TWh against
53.7 TWh in 2023 - a 17% spread. Quote the worst year for anything that sizes
capacity and the range for anything else.

---

## The Seriti Green scenario

Their July 2026 published simulation, reproduced 27-28 Aug 2026.

```
newWindMW    20000 - FIXED.windMW        20 GW total wind
newPvMW      25000 - FIXED.pvUtilityMW   25 GW total utility PV
newBattMW    20000, newBattHours 10      20 GW / 200 GWh
coalDecomMW  32000                       leaves ~10 GW = Medupi + Kusile
newNuclearMW 0
coalEAFPct   70
newCcgtMW    25000                       gas as backup
```

### Peak gas is robust across a decade

```
                       min     mean      max     Seriti
peak gas, July        18.5     19.5     20.6     18 GW
```

Range of 2.1 GW across a decade, so the number that sizes the backup fleet is not
very sensitive to which year you pick. Their 18 GW sits just below the ten-year
minimum, which is what a single-year study should be expected to do.

### Gas energy: the earlier gap was mostly my synthetic profile

```
July gas GWh      min 1,605   mean 2,755   max 3,968 (2015)   Seriti 5,553
annual gas TWh    min  31.1   mean  33.4   max  38.2 (2022)
dashboard 2023          2,761 GWh July - almost exactly the ten-year mean
```

The gap is real. Seriti's 5,553 GWh sits above the worst of ten years. GridTwin
runs the retained Medupi and Kusile on merit, generating 4,479 GWh in July; Seriti
scale thermal output to a fixed capacity share (~25%) and let gas fill the residual.
That modelling choice remains the leading explanation and is worth putting to them.

An intermediate version of this file said the opposite - that the gap was an
artefact and the coal explanation should be dropped. That was the broken weighting.
2023's July gas is 2,761 GWh, within 2% of the ten-year mean, so the dashboard year
is not flattering on this measure even though it is the best wind year.

### Their wind-heavy sensitivity replicates, and more strongly

At equal 45 GW total, no gas, across ten weather years:

```
                unserved GWh:   worst      mean       best
20 GW W / 25 S                 19,664    16,822     15,542
25 GW W / 20 S                 16,792    13,960     12,566
```

Wind-heavy wins in every year, by 15 to 19%. 2022 is worst for both. The direction
holds across a decade of real weather, and the margin is wider than the single-year
run suggested. This is the strongest result in this file.

They found the same direction on a five-point ERA5 composite. GridTwin finds it
on regional MERRA-2 profiles at capacity-weighted plant locations. Their
conclusion survives a more granular wind model. This is the strongest thing to
lead with in any outreach.

### Their solar assumption is self-contradictory

Their page says the 25 GW may include a mix of utility and rooftop, and that
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

## Long-duration storage does not solve a winter wind drought

Confirmed across ten weather years, 28 Aug 2026. Adding 20 GW of 100-hour iron-air
to the Seriti scenario changes July gas by exactly zero in all ten years - not
approximately, not to three significant figures, but to the last digit printed in
every year from 2014 to 2023. July gas itself ranges 1,605 to 3,968 GWh across those
years, so the invariance is not an artefact of a quiet month.

The annual effect is consistent and small: gas falls by about 1.0 TWh in every year,
which is where the value of long-duration storage actually sits. It is a
shoulder-season and spring-curtailment technology, not a winter-drought one.


Their conclusion is that the deficit needs firm wind or seasonal storage. Tested
directly. July gas energy, Seriti scenario:

```
                              July gas   peak    annual gas   new capex   avg cost
lithium 20 GW / 10h          2,815 GWh   19.6      30.7 TWh      R166bn   R1.30/kWh
+ vanadium 10 GW / 8h        2,815 GWh   19.6      30.6 TWh      R222bn   R1.56/kWh
+ iron-air 5 GW / 100h       2,815 GWh   19.6      30.5 TWh      R231bn   R1.61/kWh
+ iron-air 10 GW / 100h      2,815 GWh   19.6      30.2 TWh      R296bn   R1.92/kWh
+ iron-air 20 GW / 100h      2,815 GWh   19.6      29.7 TWh      R425bn   R2.54/kWh
iron-air 20 GW, no lithium   3,015 GWh   19.6      32.6 TWh      R350bn   R2.18/kWh
```

Priced 28 Aug 2026. Before that, vanadium, iron-air and pumped storage were absent
from `newCapexR`, so this table showed all six rows at R166bn and iron-air appeared
to lower average cost. It does the opposite. Twenty gigawatts of iron-air adds
R259bn and takes average cost from R1.30 to R2.54/kWh - nearly double - to buy a
3% annual gas reduction and nothing in July. On price it is the worst option here.

Twenty gigawatts of 100-hour iron-air is two terawatt-hours of storage and it
changes July by nothing, to three significant figures.

SCOPE, measured 2 Sep 2026: this holds WITH GAS. Remove the 25 GW of gas and long-duration
storage becomes decisive - 10 GW of 100-hour iron-air cuts unserved energy from 4,663 to
78 GWh. With gas the deficit is an energy shortage no store can fill; without it the
shortfall concentrates into fewer, deeper hours, which is what a 100-hour store is for.
**Quote either result with its gas assumption or it inverts.** Iron-air alone makes it
worse. There is no surplus to store; the deficit is an energy shortage, not a
shifting problem. Seasonal storage does not solve it either - a stronger claim
than Seriti's own.

Annual effect is real but happens in other months: gas 30.7 to 29.7 TWh,
curtailment to zero.

---

## Lithium duration: the wall, priced

Confirmed across ten weather years, 28 Aug 2026. Going 4h to 10h cuts annual gas by
between 0.55% and 1.63%, mean 0.93%, in every year. It also removes curtailment
almost entirely - 0.167-0.539 TWh at 4h falls to 0.000-0.129 TWh at 10h.

The wall is real and it is tighter than the single-year run suggested: the earlier
1.7% figure was the most favourable year. Under 1% of gas for a 37% capex increase,
in every year tested.


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

Consistency check, unplanned: 20 GW at 10h gives 30.735891678 TWh, identical to
50 GW at 4h. Same stored energy, same answer, two routes.

The capex column is lithium only because this scenario builds only lithium.
Vanadium, iron-air and pumped storage are now in `newCapexR` as well (28 Aug 2026);
before that they were absent and showed as free.

---

## The no-gas frontier

Seriti scenario with `newCcgtMW: 0`, 10 GW coal flexibilised, 20 GW / 10h storage.
Unserved energy, GWh/yr:

Worst of ten weather years - the number that sizes a system:

```
wind\solar     25 GW     40 GW     60 GW     80 GW
   20 GW       20,347     9,229     1,855       577
   40 GW        4,738     1,169       149        40
   50 GW        1,885       452        69        11
   60 GW          702       201        25         0
   70 GW          362       100        11         0
   80 GW          186        51         0         0
```

RESTATED 2 Sep 2026, and the frontier moved OUTWARD. Nineteen of twenty-four cells rose.
The cause is not a model change but a DATA correction: the Eskom Integrated Report 2026
gives pumped storage as 2,724 MW where the model held 2,900, along with smaller corrections
to nuclear and hydro. Isolated at 40 GW wind / 80 GW solar: 1.6 GWh unserved with the old
constants, 4.1 with the corrected ones.

**176 MW less pumped storage moves a 120 GW frontier**, which is worth knowing on its own -
in a no-gas system the flexible fleet is doing more work than its size suggests.

The tool now computes this grid live, so it is reproducible rather than quoted.

On the worst year the frontier runs 40W/80S through 60W/60S to 80W/40S-ish. So
roughly 110 to 120 GW combined, against Seriti's 45 GW - about two and a half
times the build.

That is where the first single-year estimate landed too. The intermediate 130-140 GW
figure came from the broken weighting and is withdrawn. The agreement between the
first estimate and the corrected ten-year run is a coincidence of two errors
cancelling, not corroboration - the first was one favourable year, this is the worst
of ten. Cite this one.

The price is curtailment. At 50 GW wind / 60 GW solar the system throws away
75.7 TWh a year on the worst weather year. Building for the worst week and wasting
the output the rest of the year.

### costed, 28 Aug 2026 - and gas is not cheaper

An earlier version of this file said "gas is almost certainly cheaper, but that
comparison needs the storage capex fix first". The fix is in. The claim was wrong.

Worst weather year (2022), annual costs in R bn. Capex is annualised and includes
grid expansion at R600/kW-yr on new wind and utility PV - about R66 bn a year in the
110 GW cases, so the transmission build to connect it is not being hidden.

```
scenario                        GW W+S  unserved  curt TWh  capex  fuel  carbon  Total  R/kWh
Seriti as published, 25 GW gas      45         0       0.0    166   116       3    285   1.37
no gas, same build                  45    19,664       0.0    135   135       3    293   1.60
no gas, 40W/80S                    120         0      92.3    264    31       2    297   1.41
no gas, 50W/60S                    110         0      75.7    254    29       2    285   1.36
no gas, 60W/60S                    120         0      96.4    276    28       2    305   1.46
no gas, 80W/40S                    120         0     101.8    288    25       1    315   1.51
no gas, 50W/80S                    130         0     112.5    287    29       2    318   1.51
```

### ten weather years, run 31 Aug 2026 — and the neutrality is real

The single-year version could show cost neutrality but not test it. Across all ten:

```
year      with 25 GW gas   no gas 50W/60S   delta
2014                 278              277      -1
2015                 288              279      -9
2016                 279              278      -1
2017                 279              277      -2
2018                 279              278      -1
2019                 275              278      +3
2020                 275              278      +3
2021                 280              278      -2
2022                 289              279     -10
2023                 275              277      +2
```

**the sign flips.** Six years favour the no-gas build, four favour gas, and the spread is
-10 to +3 R bn on a base near R278 bn. That is what cost-neutral actually looks like, and
it is a stronger statement than a single year matching by coincidence.

### and something the single year could not see

```
                       range R bn/yr   spread
Seriti + 25 GW gas         275 - 289      14
no gas, 50W/60S            277 - 279       2
```

**the gas scenario is seven times more weather-exposed on cost.** Its bad years are 2015
and 2022 - poor wind years, where it burns more gas to cover the shortfall. The 110 GW
no-gas build barely registers them, because it is overbuilt enough that a bad wind year is
absorbed by curtailing less.

That reframes the trade. It is not "same cost, pick either". It is **the same expected
cost with a seventh of the variance** - and variance in annual fuel cost is exactly what a
utility hedges, and what a regulator sees as tariff volatility. The overbuild is buying
insurance the single-year comparison priced at zero.

Caveat: this is fuel and capex within the model's cost families. It excludes gas price
risk entirely, which would widen the gas scenario's spread further, and it assumes the
connections exist - which on today's headroom they do not.

---

Re-run 31 Aug 2026 against the corrected constants, same scenarios:

```
scenario                        Total now   published   R/kWh now   published
Seriti as published, 25 GW gas       274         285        1.32        1.37
no gas, 50W/60S                      277         285        1.32        1.36
no gas, 40W/80S                      291         297        1.38        1.41
no gas, 60W/60S                      299         305        1.43        1.46
no gas, 80W/40S                      308         315        1.49        1.51
```

**the finding holds.** Every level fell 3-4% with the recalibration, the ordering is
unchanged, and 50W/60S remains the one no-gas build that matches the gas scenario -
R277 bn against R274 bn, and identical at R1.32/kWh.

One honest nuance: the sign flipped inside the noise. The published version had the
no-gas build marginally cheaper (R1.36 against R1.37); it is now marginally dearer in
total (R277 against R274) and identical per kWh. A 1% gap either way is below what this
model can resolve, so the claim is **cost-neutral**, not "cheaper" - which is how it
should have been stated the first time.

Removing gas is cost-neutral at the right build. 50 GW wind with 60 GW solar and no
gas at all costs about the same as the 25 GW gas scenario. The trade is roughly R90 bn
more capex against R90 bn less fuel.

But it is only cost-neutral at one point on the frontier. Every other no-gas build
tested costs 4% to 12% more, and the wrong mix is expensive: 80 GW wind with 40 GW
solar costs R315 bn for the same job. So this is not "gas is unnecessary", it is
"there exists a build where gas is unnecessary and it is not the obvious one".

### the frontier is not buildable on today's grid

Checked 28 Aug 2026, and this is the finding that governs everything above.

The costing uses the national dispatch model, which has no network. Against
`nodal/headroom_summary.json` (GCCA 2025 plus the Oct 2025 curtailment update),
national connection headroom is:

```
region            wind MW   solar MW    binding corridor
Kwazulu Natal        5,500     5,500     Mpumalanga-Kwazulu Natal
Gauteng              4,680     4,680     Mpumalanga-Gauteng
Limpopo              3,360     3,360     Limpopo-Mpumalanga
Mpumalanga           3,320     3,320     Mpumalanga-Kwazulu Natal
North West           1,660     1,660     Limpopo-North West
Free State           1,420     1,420     Free State-Mpumalanga
Western Cape         1,180         0     Western Cape-Hydra Central
Eastern Cape           400         0     Eastern Cape-Kwazulu Natal
Northern Cape            0         0     Northern Cape-Free State
Hydra Central            0         0     Hydra Central-Western Cape
total               21,520    19,940
```

The 50W/60S frontier needs 45,388 MW of new wind and 56,729 MW of new solar. Available
headroom is 21,520 and 19,940. **Shortfall: 23,868 MW of wind and 36,789 MW of solar -
about 61 GW of connections that do not exist.**

The distribution is the point. The Eastern Cape, Western Cape, Northern Cape and Hydra
Central hold **100% of South Africa's existing wind capacity and 7.3% of the national
room to add more**. For solar those four regions have zero headroom between them. The
Northern Cape and Hydra Central - the two best resources in the country, at 37.9% and
42.5% capacity factor - are at zero for every technology.

So the R285 bn cost-neutral result is not wrong, it is conditional, and the condition
is not currently met. The R600/kW-yr transmission adder in the cost model is a generic
per-kW figure; it is not the cost of creating headroom in the Karoo specifically, which
is where it would have to be created. Treat R285 bn as a floor and the gap to gas as
understated by an amount this model cannot yet price.

What this does not mean: headroom is not fixed. It is what the grid can take today, and
the whole purpose of the Transmission Development Plan is to expand it. The finding is
about sequencing, not impossibility - a no-gas system is reachable at roughly the cost
of a gas one, but only after a transmission build that is itself the binding constraint
and is not costed here.

Also unpriced here: land, and the 75.7 TWh of curtailed energy has no compensation
mechanism in this model - under REIPPPP some of it would be paid for.

---

## Flexibilising the coal fleet does not improve adequacy

Confirmed across ten weather years, 28 Aug 2026. It does not reverse in any year.
This was flagged as the weakest result in this file and it is no longer weak.

```
year     rigid   flexible    delta    coal rigid  coal flex   batt rigid  batt flex
2014     14,921    16,083   +1,162       50.2       47.4         5.79       4.54
2015     17,718    18,775   +1,057       51.1       48.5         5.19       3.94
2016     15,151    16,238   +1,087       50.6       47.8         5.91       4.62
2017     15,377    16,521   +1,144       50.5       47.7         6.35       5.00
2018     15,578    16,693   +1,116       50.6       47.9         6.35       4.97
2019     14,805    15,962   +1,157       50.0       47.2         6.58       5.34
2020     14,413    15,565   +1,152       50.2       47.4         6.92       5.55
2021     15,954    17,178   +1,223       50.5       47.7         6.46       5.07
2022     18,560    19,664   +1,104       50.9       48.4         4.93       3.81
2023     14,381    15,542   +1,161       50.0       47.1         6.41       5.08
```

Ten years out of ten, and the effect is remarkably stable: +1,057 to +1,223 GWh,
a range of 166 GWh, while the underlying unserved energy moves by 4,200 GWh between
best and worst year. So the flexibilisation penalty is nearly independent of weather,
which is much stronger evidence than the single-year run gave. The concern that it
sat inside the weather spread was wrong: it is a mechanism, not noise.

The mechanism is visible in the last four columns and is identical every year. Rigid
coal generates ~2.8 TWh more, and storage delivers ~1.3 TWh more as a result.


Requested as a hypothesis; the test returned the opposite. No gas, 10 GW coal:

```
                    inflexible   flexible     delta
ramp %/hr                 24.0      100.0      +76.0
coal TWh                  50.3       47.4       -2.9
battery TWh                6.8        5.5       -1.3
pumped TWh                 5.4        4.7       -0.7
unserved GWh          14,078.5   15,206.2   +1,127.8
```

Mechanism, confirmed by measurement rather than inference: rigid coal cannot back
off fast enough during renewable surplus, so it is forced to keep generating
(index.html, the coalFloor branch). That forced output charges pumped storage and
batteries. In a normal system this is the well-known pathology of inflexible coal
wasting renewables. In a no-gas system it becomes an accidental virtue, because
the storage it fills is the only thing left to cover the drought. Flexible coal
backs down properly, generates 2.9 TWh less, and storage delivers 2 TWh less.

What it is not: the four-hour ramp-aware look-ahead was hypothesised as the cause
and tested. It is not. Sweeping `coalLookaheadH` from 2 to 48 hours changes the
flexible case by zero across the whole range, because at 100%/hr the ramp term
swamps the horizon and the floor collapses regardless. The horizon binds only in
the rigid case, where 4h to 12h improves unserved from 14,078 to 13,695 GWh, a
2.7% gain that saturates at 12 and does nothing anywhere else tested.

Scope: this effect appears only with no dispatchable backup at all. With Seriti's
25 GW of gas, flexibilisation makes no difference to adequacy. Flexibilisation is
a curtailment and emissions measure, not an adequacy one. State that caveat
whenever this result is quoted.

Capacity is the binding constraint, not ramp rate. Retaining 20 GW of coal instead
of 10 cuts unserved from 15,206 to 768 GWh. Retaining 30 GW takes it to zero.

---

## Battery saturation in South Africa

Weather-independent: driven by the reserve requirement and fleet size, not by wind
or solar output. But see the reserve caveat at the end of this section.


The country has passed the knee - see the re-run below.

Re-run 31 Aug 2026 at the published reserve price of R150/MWh held:

```
fleet      ancillary R/MW/yr    as published
0.5 GW            197,100            197,100
1   GW            197,100                  -
2   GW            197,100                  -
3   GW            167,345            197,100
4   GW            125,509            173,262
6   GW             83,673            115,508
8   GW             62,754             86,631
10  GW             50,204             69,305
```

**the knee has moved earlier, and that strengthens the finding.** Revenue is now flat
only to about 2.5 GW, not 3.8. Ancillary falls 74.5% across the range, not 64.8%.

The cause is the reserve rebuild of 30 Aug 2026, which consolidated the battery panel's
duplicate reserve constants onto the unit commitment's own definition and cut the
requirement about 30%, from 1,768 to 1,263 MW. A smaller requirement is satisfied by a
smaller fleet, so saturation arrives sooner.

**south africa is not approaching the knee. it is already past it.** The existing fleet is
3,700 MW against a knee near 2,500. The published version said the country sat "almost
exactly at the knee" and that 3,700 MW was "the last point at which a new battery earns
the full ancillary rate". Both were one revision out of date: a battery built today
already earns a reduced ancillary rate, not the full one.

The direction of the argument is unchanged and its force is greater.

Understates against ercot's ~90% because arbitrage is held flat in this model.

Requires `asReserveOn`. At defaults the panel shows a flat line and says so,
because South Africa prices no ancillary services today.

Recomputed 28 Aug 2026. The reserve requirement previously read a hardcoded
32,000 MW through `FIXED.peakMW`, which is not a key - it resolved to undefined
and fell through. It now reads the model's own peak (31,595 MW at default, and
46,193 MW at 50% demand growth, where the old code would still have said 32,000).
The ancillary fall moved 61.6% to 62.1% and the 10 GW figure R75,686 to R74,729.
The knee did not move and the conclusion is unchanged - which is the reassuring
outcome, since a 1.3% input correction producing a large swing would have meant
something else was wrong.

Reserve rebuilt 28 Aug 2026, and this section now reflects it. The requirement is
contingency + demand share + vre share, resolved hourly:

```
scenario                  mean MW   max MW
today, ~5 GW VRE            1,768     2,062
Seriti, 45 GW VRE           2,272     3,916
frontier, 110 GW VRE        2,438     3,465
```

So the reserve pot grows with renewable build - 29% larger under the Seriti scenario
than today - which the old flat-share-of-peak version could not show at all. The knee
moves out slightly as a result, and the ancillary fall deepens from 62.1% to 64.8%.

South Africa's 3,700 MW fleet still sits just below the knee. That conclusion has now
survived three separate corrections to how the reserve is computed, which is the main
reason to trust it.

Corrected 28 Aug 2026, and the correction produced the most important storage finding
in this file.

The requirement is now split into three, as professional practice does:
  Gross        the uncertainty to be covered, driven by available vre - dispatched
               Plus curtailed - because forecast error is a property of what a plant
               could have produced.
  vre-provided curtailed plant can ramp back up, so it is an eligible upward-reserve
               provider. ercot, EirGrid and AEMO all permit this. Counted at 50% of
               curtailed output, since it must be fast, telemetered and controllable.
  net          what storage and thermal actually compete for.

```
scenario              gross    VRE provides    NET   curtailment TWh
today, ~5 GW VRE      1,263               0   1,263        0.0
Seriti, 45 GW VRE     1,567               3   1,564        0.2
frontier, 110 GW      2,114           1,457     657      115.3
```

Revised 29 Aug 2026 after an audit found this panel had defined its own reserve
constants in parallel with the ones the unit commitment already used - 930 MW versus
794 MW for the same "largest single credible loss". Now consolidated onto the
commitment definition, which is older and better sourced. Levels drop ~30%; the shape
and the conclusion are unchanged.

### the ancillary market for storage shrinks as renewables grow

At 110 GW of wind and solar the gross requirement rises to 2,114 MW, as expected. But
curtailed renewables supply 1,457 MW of it, and the net pot left for storage collapses
to 657 MW - smaller than today's 1,263 MW, in a system more than twice the size.

This inverts the usual assumption that storage ancillary revenue grows with renewable
penetration. It grows only while curtailment stays low. Past the point where the system
routinely spills wind and solar, the spilled plant becomes the cheapest reserve provider
on the system and storage is competing against a near-zero-marginal-cost incumbent.

The turning point is curtailment, not capacity: the Seriti 45 GW case curtails only
0.2 TWh and the effect is invisible there. It appears between 45 and 110 GW.

What this does not say: whether South Africa will permit curtailed renewables to sell
reserve. That is a market-design decision, not a physical one, and it is exactly the
kind of thing the Revised Electricity Pricing Policy is deciding now. If the answer is
yes, the storage business case at high penetration is materially worse than any
published South African analysis assumes.

### sensitivity, tested 29 Aug 2026 — the conclusion is binary, not gradual

Three parameters sit behind this. Varied one at a time, on the 110 GW case, against
today's net requirement of 1,263 MW:

```
VRE-provider share      gross   VRE prov   NET @110GW   shrinks vs today?
  0    (barred)          2,114          0        2,114   NO - it grows
  0.25                   2,114      1,371          743   yes
  0.5  (assumed)         2,114      1,457          657   yes
  0.75                   2,114      1,491          623   yes
  1.0  (all qualifies)   2,114      1,508          606   yes

reserve VRE pct         2.5 -> 521    5.0 -> 657    7.5 -> 804    10 -> 958   all shrink
contingency MW          400 -> 486    794 -> 657    930 -> 718   1600 -> 1,018  all shrink
```

The only thing that matters is whether curtailed vre may sell reserve at all. Bar it
and the pot grows from 1,263 to 2,114 MW, as intuition expects. Allow even a quarter of
curtailed output to qualify and the pot collapses to 743 MW, below today's. Everything
from 0.25 to 1.0 lands in a narrow band of 606-743 MW.

So the 0.5 assumption is not load-bearing. The finding is not sensitive to the
parameter; it is sensitive to a yes/no policy decision, and it flips at a very low
threshold.

Nor does it depend on the other two. Across a fourfold range of contingency size and a
fourfold range of the vre reserve share, the pot at 110 GW is smaller than today's in
every single case.

That is the stronger version of this result, and the one to put to a regulator: the
question is not "how much reserve will curtailed plant provide" but "will it be allowed
to provide any".

The shares (0.03 of load, 0.05 of available vre, 50% of curtailed vre counting as a
provider) are the uncertain part. The structure now follows practice.

---

## Locational transmission signal, measured

Directly relevant to the Revised Electricity Pricing Policy (Gazette 55257,
28 Aug 2026). Policy Position 20 instructs the transmission licence holder, dee and
NERSA to "investigate different options and adopt the most appropriate method for
allocating costs between generators", noting that the current methodology recognises
only peak security and does not reflect the costs different generator types impose.

The regional build LP answers that question directly. Solved to Optimal, default
scenario, masterplan build rate. Shadow prices are summed over the whole horizon from
the `hw_` and `hp_` connection-headroom constraints, and row names were recovered from
the LP text because HiGHS returns rows index-keyed (119,225 rows parsed, 119,225
returned - the counts match, which is the check).

```
region            built wind GW   built PV GW    wind headroom dual   PV headroom dual
Eastern Cape             0.40          0.00              11,046,170            253,733
Hydra Central            0.00          0.00               9,386,271          2,323,075
Western Cape             1.18          0.00               7,774,490          2,300,515
Northern Cape            0.00          0.00               5,188,020          6,984,540
North West               1.66          1.66               2,432,688          1,501,832
Free State               1.42          1.42                 582,177            854,859
Mpumalanga               3.32          0.00                 228,814                  0
Limpopo                  0.54          2.02                       0                  0
Gauteng                  0.00          2.40                       0                  0
Kwazulu Natal            2.48          0.00                       0                  0
```

Re-verified 31 Aug 2026 after the constant corrections. Row counts reproduce exactly
(119,225 parsed, 119,225 returned) and **the spread holds and widens: 66-fold against the
48-fold published**, top wind dual 3,571,840 against a lowest non-zero of 53,841. Levels
fell about threefold - a system with less coal capacity, fewer imports and lower
availability values connection headroom differently - but the ratio between regions is
the claim, and ratios survived. The EPP submission's "fiftyfold spread" is unchanged in
substance and understated if anything.

The finding: the optimiser builds the most wind where the resource is worst.
Mpumalanga takes 3.32 GW at a 25.5% capacity factor and KwaZulu-Natal 2.48 GW at
21.6%, while Hydra Central (42.5%) and the Northern Cape (37.9%) get nothing. The
Eastern Cape stops at 0.40 GW.

The reason is in the second column. Headroom binds hardest in exactly the regions
with the best wind - Eastern Cape, Hydra Central, Western Cape, Northern Cape - and
does not bind at all in Limpopo, Gauteng and KwaZulu-Natal. Connection capacity, not
wind speed, is deciding where the fleet goes.

That is the locational signal the policy asks to be quantified, and it is large:
roughly a fiftyfold spread between the most and least constrained regions.

Units caveat: these are sums of hourly duals over the full LP horizon, so treat them
as a ranking and a relative magnitude, not as a R/MW tariff. Converting them into a
charge would need the horizon normalised and the socialised portion separated, which
is the design question Policy Position 20 leaves open.

Caveat: one build scenario, default settings, single weather year. The ranking is
driven by the headroom data in `nodal/headroom_summary.json`, so it inherits whatever
that file gets wrong. Re-run across weather years before quoting externally.

---

## Demand response has an optimum, and past it makes things worse

Re-verified 31 Aug 2026 against the corrected constants. **The finding holds exactly**:
optimum still at 7.5%, still reverses by 30%. Levels moved with the calibration - avg cost
570.46 -> 585.17 at zero shift - but the shape and the conclusion are unchanged.

Found 28 Aug 2026 while investigating a harness warning, not sought. Dashboard
scenario, sweeping `drShiftPct`:

```
shift %   avg cost R/MWh   peak GW   coal TWh   diesel TWh   curtailment TWh   CO2 Mt
  0            570.46       31.60     161.53        0.011           0.000      170.5
  2.5          569.58       30.81     161.44        0.007           0.000      170.2
  5            568.91       30.02     161.44        0.005           0.000      170.1
  7.5          568.44       29.23     161.46        0.005           0.000      170.0
 15            568.80       29.13     161.74        0.016           0.000      170.3
 30            574.74       29.56     161.84        0.118           0.013      171.2
```

Modest shifting works. The evening peak falls from 31.60 to 29.23 GW, diesel halves
and CO2 falls. The optimum sits near 7.5%.

Past about 15% it reverses. The shifted load builds a new peak in the valley it was
moved into: peak rises again to 29.56 GW, coal goes from 161.46 to 161.84 TWh, diesel
from 0.005 to 0.118, and curtailment appears for the first time. At 30% the system
costs more than with no demand response at all - R574.74/MWh against R570.46.

This is the classic rebound peak, and it matters because demand response is usually
treated as monotonically beneficial in South African discussion. It is not: it is a
peak-shaving tool with a saturation point, and the point is closer than most
programme targets assume.

Mechanism checked, not inferred. The cost curve is driven by fuel, not by the demand
response charge - `drCostR` stays near zero across the whole sweep. So this is a
dispatch effect, not a cost of procuring the response.

The same shape appears in `vppGeyserPoolMW`, minimum near 6 GW of controllable pool
and worse than nothing by 12 GW.

Caveat: one weather year, dashboard scenario, and the shifting logic is a simple
within-day reallocation. The direction and the existence of an optimum are robust;
the 7.5% figure is not a target.

---

## Wholesale price components: what this model can and cannot produce

Mapped 28 Aug 2026 against the component list in section 4 of the Revised Electricity
Pricing Policy (Gazette 55257). Recorded here because it bounds what GridTwin can
honestly say about price, and because the submission argues for published
disaggregation along exactly this list.

```
policy component                 GridTwin term                      status
Energy prices                    fuelCost + startUpCostR            Produced
Carbon pricing mechanisms        carbonCost                         Produced
Congestion management charges    corridor duals in the regional LP  Produced, NOT priced
Transmission network charges     txRPerKWyr inside newCapexR        Partial
Capacity prices                  capacityRevenueR                   Modelled, defaults OFF
Ancillary service charges        asReserveRevenueR, asInertiaRevenueR   Modelled, defaults OFF
Reserve prices                   asReserveRevenueR                  Modelled, defaults OFF
Standby prices                   -                                  Absent
Legacy cost recovery             -                                  Absent
Subsidy charges                  -                                  Absent
Distribution network charges     -                                  Absent
Balancing services               -                                  Absent
Environmental compliance costs   -                                  Absent
```

### cross-checked against NERSA'S own list, 30 Aug 2026

The Wholesale Electricity Pricing Methodology (NERSA consultation, May 2026) enumerates
the wholesale price build-up independently of the EPP. It splits into two groups, and the
split is more useful than either list alone:

```
market costs          energy, transmission charges, system operation charges,
                      balancing costs, market operator charges, other regulated
                      market costs
NON-market costs      legacy charges, bad debt recovery, social and cross-subsidy
                      charges, vesting contract obligations
```

That confirms the split already in this file, from a regulator rather than from
inference. GridTwin produces or can produce every market cost. It produces none of the
Non-market costs, and should not try: they are allocation decisions, not modelling
outputs. The methodology's own framing - that the wholesale cost "extends beyond the
energy price in the day-ahead market" - is the sentence to quote when explaining why
`avgCost` is not a tariff.

Two terms NERSA names that the EPP list did not:

**System operation charges** and **market operator charges**. Neither is in GridTwin and
neither should be - they are institutional costs, not dispatch outcomes.

**Balancing costs.** This one is a modelling quantity and GridTwin does not have it. The
model is hourly, so it has no intra-hour balancing product at all. In a market with
45 GW of wind and solar, balancing is not a rounding error. Worth knowing that the gap
is now named by the regulator rather than only by us.

A note on risk, from the eiug's submission on the Market Code: non-market charges risk
becoming "dumping grounds for unallocated costs". That is the strongest argument for the
disaggregation this project has been advocating - if the market costs are separately
published and checkable, whatever is left in the non-market bucket becomes visible.

---

Three produced, three modelled but switched off because South Africa does not price
them today, one partial, six absent.

What this means for any price claim. GridTwin's `avgCost` is fuel plus carbon plus new
grid-connected capex, divided by grid-served energy. It is not a tariff and does not
try to be - the panel says so. Six of the thirteen components the policy enumerates are
simply not in it, and they are not small: legacy cost recovery and distribution charges
are a large part of what a South African customer actually pays.

The two worth closing, in order.

Transmission is partial and the gap matters for the locational work. `txRPerKWyr` is a
flat R600/kW-yr adder on new wind and utility PV. That is a build cost, not a
use-of-system charge, and it is not locational - so the model prices the grid the same
way whether a plant connects into 5,500 MW of headroom in KwaZulu-Natal or into zero in
the Northern Cape. The corridor duals from the regional LP are the raw material for
fixing that, and they already exist.

Congestion is produced but not priced. The `txa_` shadow prices come out of every
regional solve and are discarded. Converting them into a congestion charge is the
smallest step available toward what Policy Position 20 asks for.

The four remaining absences (standby, legacy, subsidy, distribution) are outside what a
dispatch and capacity-expansion model should attempt. They belong to tariff design, not
to system modelling, and the honest position is to say so rather than approximate them.

---

## Congestion, priced from the corridor duals

The first of the two gaps identified in the price-component mapping. The `txa_`/`txb_`
shadow prices come out of every regional solve and were being discarded. Extracted
28 Aug 2026, default scenario, masterplan pace.

Congestion is rare and concentrated. Nine binding rows out of 38,400 corridor
constraints - 0.023%. Every one of them is the same event:

```
row                    dual R/MW    corridor                        limit MW
txa_10_2028_159_10       199,872    Hydra Central - Western Cape       2,377
txa_14_2028_159_10       199,872    North West - Western Cape            233
txa_15_2028_159_10       199,872    Northern Cape - Western Cape         823
txa_10_2029_159_12       185,067    (same three corridors)
txa_14_2029_159_12       185,067
txa_15_2029_159_12       185,067
txa_10_2030_159_12       171,358    (same three corridors)
txa_14_2030_159_12       171,358
txa_15_2030_159_12       171,358
```

Day 159 is 8 June - midwinter, midday. Flow is into the Western Cape on all three of
its import corridors simultaneously, in the same hour, in three consecutive years. The
dual declines 199,872 to 171,358 as transmission is built out.

### the duals are identical, and that is not an error

Three corridors with different ratings - 2,377, 823 and 233 MW - carry the same shadow
price to the rand. Checked, because it looked like a mapping fault. It is structural:
the Western Cape is fed by exactly these three corridors, and in a transport model with
one balance per region, relaxing any one of them admits the same additional megawatt.
So the marginal value is the same on all three.

**consequence for pricing, and it is the whole point.** You cannot charge each corridor
its own dual and add them up - that triple-counts a single constraint. The economically
meaningful quantity is the rent on the western cape import boundary, not on any wire.
Any congestion charge built off these duals has to be defined on boundaries or on
cutsets, not on individual lines. That is a real design trap and it is invisible until
you look at which rows bind together.

### what this does and does not support

It does not support a claim that South Africa's grid is congested in this scenario -
0.023% of corridor-hours is close to nothing, and this is the default build at the
masterplan pace, which does not push much energy across the network.

It does establish that the machinery works, that the binding boundary is the Western
Cape in winter, and that the duals are recoverable and economically interpretable.
Running it on the 110 GW no-gas frontier is the case where congestion should be
material, and that is the next step.

---

## Locational transmission cost, and the trade-off it exposes

The second gap from the price-component mapping, closed 28 Aug 2026.

`txRPerKWyr` was a flat R600/kW-yr on all new wind and utility PV. It priced the grid
identically whether a plant connected into 5,500 MW of headroom in KwaZulu-Natal or
into zero in the Northern Cape.

The level was right, the shape was not. TDP 2025-2034 is 14,500 km and 210 transformers
for 56 GW at over R390bn - R6,964/kW overnight, which over a 40-year life at 8%
annuitises to R584/kW-yr. So R600 is a sound national average. It just had no variation.

Now: a shallow component every plant pays (25% of the average) plus a deep component
scaling with electrical distance to the load centre, shortest path through the corridor
graph to Gauteng. Weighted so the capacity-weighted mean still reproduces R600 exactly -
this replaces a flat number with a distribution around the same mean.

```
region              km to load   headroom MW   R/kW/yr
Gauteng                      0         9,360       150
North West                  84         3,320       253
Mpumalanga                 102         6,640       275
Free State                 202         2,840       397
Limpopo                    223         6,720       422
Kwazulu Natal              274        11,000       485
Northern Cape              292             0       507
Eastern Cape               441           400       689
Western Cape               456         1,180       707
Hydra Central              479             0       735
```

Nearly a fivefold spread, R150 to R735.

### the headroom is where the cost is low and the resource is bad

This is the finding, and it was not obvious before the numbers existed.

```
capacity-weighted mean distance   368 km   (where the fleet IS)
headroom-weighted mean distance   163 km   (where it CAN go today)
```

The 41,460 MW of available connection headroom sits at less than half the electrical
distance of the existing fleet. Filling it cheapest-first gives an effective rate of
R349/kW-yr - well below the R600 flat rate. So connecting where there is room today is
cheaper in transmission terms than the average plant already built.

But those are the regions with the worst wind: KwaZulu-Natal at 21.6% capacity factor
holds 11,000 MW of headroom; Hydra Central at 42.5% holds none.

So the trade-off Policy Position 20 describes is now quantified from both ends. Build
near load: cheap grid, poor resource. Build in the Karoo: excellent resource, R735/kW-yr
of grid, and no headroom to connect into at all.

### the rate now rises with build volume

Regions fill cheapest-first, so a bigger programme costs more per kW - which is true and
was previously not modelled at all.

```
new wind + PV       effective R/kW-yr
     1,000 MW              150
    10,000 MW              157
    20,000 MW              217
    41,460 MW              349    all existing headroom consumed
    60,000 MW              468
   102,000 MW              578    the no-gas frontier
```

Previously 102 GW cost the same per kW as 1 GW.

Caveat: electrical distance to a single load centre is a proxy. A full treatment prices
against the actual network build required, which is what the corridor duals would give
if the congestion work is carried further. The shallow share of 25% is an assumption.

---

## Capture rates: solar cannibalises itself, wind does not

Measured 29 Aug 2026. Capture rate is the price a technology actually achieves as a
share of the time-weighted mean price - what a merchant project earns against what the
market averages. Computed from the model's own hourly shadow price against each
technology's dispatched output.

Re-run 31 Aug 2026 against the corrected constants, reproducing the published scenario
exactly - no storage, same build points:

```
wind GW  solar GW  batt GW   mean R/MWh   wind capture   solar capture   solar R/MWh   curt TWh
    4.6       3.3        0          999          97.8%           75.7%           756        0.0
   15        15          0          716          96.3%           90.9%           651        0.8
   20        25          0          549         100.2%           49.3%           271        9.9
   30        35          0          417         106.8%           14.7%            61       35.2
   50        60          0          227          97.2%            2.7%             6      111.9
```

**the asymmetry is the finding, and it survives.** Wind holds 96-107% of the mean price
across the whole range. Solar falls to 2.7%. At 50 GW of solar a merchant plant earns
R6/MWh against wind's R221 - not a discount, an evaporation. Four of the five rows
reproduce within two points of the 29 Aug measurement.

### the first row moved, and it matters

Today's fleet was published at 98.4% solar capture against a R755 mean. It now reads
**75.7% against a R999 mean.** The corrections of 31 Aug - coal capacity down 5.8%,
imports down 52%, availability down three points - revealed scarcity pricing that the
old constants suppressed. The mean price rose 32%, and the new expensive hours are
Evening hours, when solar does not produce.

**So solar already earns a quarter below the market average today**, before any
cannibalisation from new build. The published version showed near-parity and understated
the starting point. The direction of the finding is unchanged; its starting level was
wrong.

This is the same correction that produced the hybrid U-shape: today's system has real
scarcity pricing, and both findings had been measured on a model that did not.

The mechanism is coincidence. Every solar plant in the country produces in the same
hours, so adding solar drives the price toward zero in precisely the hours solar earns.
Wind output is diverse across sites and runs at night, so it keeps meeting hours when
something dispatchable is still setting the price. Zero-price hours go from none to
6,065 - 69% of the year - across this range.

### storage is what protects solar's revenue, and the effect is large

The rows above carry no storage, which overstates the collapse. Scaling batteries
alongside the build (6-hour lithium):

```
wind GW  solar GW  batt GW   mean R/MWh   solar capture   solar R/MWh
   15        15         5           741          100.1%           742
   20        25        10           677           89.1%           604
   30        35        20           484           54.1%           261
   50        60        40           245           22.6%            55
```

At 30 GW wind / 35 GW solar, adding 20 GW of storage lifts solar capture from 14.5% to
54.1% and the achieved price from R59 to R261/MWh - a fourfold improvement in project
revenue. At the top of the range it is 2.5% to 22.6%, roughly ninefold.

SO the storage case is not primarily about adequacy. Elsewhere in this file storage
does almost nothing for winter security. Here it is worth more than anything else
tested, because it is the only thing standing between a solar developer and a merchant
price of R5/MWh. Those two findings are not in tension - they answer different
questions, and a developer cares about the second.

Caveats: single weather year; capture is computed against the model's shadow price,
which has no price floor, no exports beyond the modelled cap and no bilateral
contracting - all of which lift real capture rates. Published capture rates in
high-penetration markets (California, Chile) fall to 40-60% rather than single digits,
so treat the direction and the wind/solar asymmetry as the result, not the absolute
levels at the extreme end. `captureRate()` in index.html already computes this
per-region for a single build; what is new here is the curve across builds.

---

## Why long-duration storage does not bite: the two conditions never co-occur

Asked 30 Aug 2026: should the dispatch look ahead seasonally, so iron-air charges in
summer for winter? Tested, and the answer is more interesting than a dispatch fix.

```
scenario                     storage TWh   Fe full cycles   July gas GWh   curtailed TWh
45 GW VRE, lithium only             7.36                -           2742             0.2
45 GW VRE, + iron-air 20 GW         8.43              4.2           2742             0.0
110 GW VRE, lithium only            7.61                -              0           100.3
110 GW VRE, + iron-air 20 GW        7.61              3.8              0            98.1
110 GW VRE, + iron-air 40 GW        7.61              1.9              0            95.8
```

**at 45 GW there is a deficit but no surplus.** Annual curtailment is 0.2 TWh. A
seasonal store needs terawatt-hours of spare energy to fill it; there are 200 GWh in the
whole year, and the system is still running 50 TWh of coal. Perfect foresight would have
had nothing to charge with.

**at 110 GW there is an enormous surplus but no deficit.** Curtailment is 100 TWh, and
July gas is already zero because the build itself covers the drought. There is nothing
left for storage to improve.

So seasonal storage needs both a large surplus and a large deficit, and in these two
scenarios they never co-occur. That is a stronger and more general finding than "storage
does not help in July".

### correction, 30 Aug 2026: I conflated surplus with curtailment

The paragraph above says a seasonal store "would have nothing to charge with" because
annual curtailment is 0.2 TWh. **That reasoning is wrong.** Storage charges from cheap
energy, not only from energy that would otherwise be spilled. Measured on the Seriti
scenario:

```
price floor            R690/MWh in every month - coal sets it, and it never goes lower
spare coal capacity    10.2 TWh across 7,305 hours, with 10 GW of coal retained
```

So there is cheap energy available all year. A 45%-efficient store charging at R690
delivers at about R1,533/MWh, against gas clearing near R1,968. **Long-duration
arbitrage against gas is in the money**, and the model was not doing it.

South Africa also curtails today at low penetration for network reasons - localised
Cape constraints - which a single-node national model cannot see at all. That is a real
limitation of this engine, not evidence that no surplus exists.

### two dispatch defects found, one fixed

**fixed - the charging horizon was 25 hours, fixed.** `anticipatedShortfall` summed the
next 25 hours to set the charge target. That is right for a 4-10 hour battery and
useless for a 100-hour store: one day's anticipated shortfall is trivial against 2 TWh,
so iron-air never saw a reason to fill. It now scales with the longest storage on the
system, capped at one week - beyond that perfect foresight does more work than the
storage does.

**not fixed - efficiency merit order starves long-duration storage.** `tierCharge` fills
best round trip first: lithium 0.88, then vanadium 0.75, then iron-air 0.45. Lithium
empties every day, so it always has room, so it absorbs the cheap charging and iron-air
is never reached. Fixing the horizon changed July gas by nothing at all for exactly this
reason.

Efficiency-first is right for a single hour and wrong across a week: the correct rule
fills the long store when a long event is coming, even at worse round trip, because
lithium cannot hold energy that far. That is a real dispatch rewrite and has not been
attempted.

### the rewrite was attempted, measured, and reverted - 30 Aug 2026

Against how the literature says this should be done. Production cost models run one- to
two-day horizons to match day-ahead markets, which cannot capture a multi-day store's
inter-temporal value; published estimates put the cost of getting it wrong at 4-14% of
operational value and 14-34% of capacity credit. The recommended treatment is
opportunity-value dispatch - a reservation price per store reflecting expected future
scarcity - not an efficiency merit order.

Two changes made. Per-tier lookahead horizons, so a 10-hour battery looks at tonight and
a 100-hour store at the coming week instead of both being asked about the next 25 hours.
And charging served in order of unmet need against those horizons, efficiency only as a
tie-break.

```
                              storage TWh    July gas GWh
efficiency order (before)            8.42            2742
unmet-need order (rewrite)           7.44            2810
```

It made things worse, so it was reverted. Filling a 45%-efficient store ahead of an
88%-efficient one destroys more energy than the earlier availability recovers. **Unmet
need is not value.** The heuristic had no test of whether the arbitrage was worth making,
and ordering alone cannot express one.

What would actually work: charge a tier only when the current marginal cost is below its
expected discharge value times the round trip. That is a value function on state of
charge, which needs an LP rather than a merit order - the same reason plexos and PyPSA
co-optimise storage across the horizon instead of ranking it.

### then the price-taker gate - built, and it settles the question

The missing piece was an economic test. Two-pass price-taker: run once to get the hourly
marginal price, build a reservation price per tier from the 90th percentile over its own
forward horizon, then re-run charging a tier only when

```
    cost now  <  reservation price  x  round-trip efficiency
```

`simulateTwoPass()` in index.html. One extra simulate call, about 590 ms.

**the gate says the arbitrage is in the money.** In early July the reservation price is
R2,020/MWh. Iron-air at 45% needs 690 < 2020 x 0.45 = 909, which clears comfortably. So
charging a 100-hour store from R690 coal to displace R1,968 gas is worth doing, and the
model's failure to do more of it is not an economic judgement.

**but the gate does not bind, so it changes nothing on its own.** Both tiers pass, so
gate-plus-ordering behaves exactly as ordering alone: July gas 2,742 -> 2,810 GWh with
20 GW of iron-air, and -> 2,832 with vanadium. Reverted a second time.

### why no ordering heuristic can fix this

The gate answers "is this trade worth making". The question that decides the megawatt is
comparative - is it worth more in the 45% store or the 88% one - and that depends on
whether the coming event is longer than the short store can cover, given both states of
charge. **That is a value function on state of charge, and a ranking cannot express
one.** Measured twice, not assumed.

Which is exactly why plexos and PyPSA co-optimise storage across the horizon rather than
ranking it, and why the fix is a storage-only LP: take the non-storage dispatch as given
and let HiGHS optimise charge, discharge and SOC across all 8,760 hours. About 50,000
variables for three tiers - small against the LPs this project already solves - and the
dual on the SOC constraint is the opportunity value, an output no South African study
currently publishes.

Kept: the per-tier horizons and the price-taker gate, both correct on their own merits
and both neutral in these scenarios. The gate will bind where prices are lower - it is
inert here only because July scarcity makes every trade worthwhile.
Reverted: the ordering, twice.

Perfect foresight caveat: pass two sees pass one's realised prices. A real operator
forecasts. Anything from this path is an upper bound on long-duration storage value.

### the storage LP, built and solved - and it settles both questions

`storage_lp.js`. Price-taker formulation: charge, discharge and state of charge as
decision variables across all 8,760 hours, SOC balance as a constraint, cyclic so no
free energy, objective to buy cheap and sell dear against the marginal price series
from a prior dispatch. This is what plexos and PyPSA do.

```
52,560 variables · 4.0 MB · solved optimal in 3.0 seconds
```

Three seconds, which is worth noting against the regional build LP's 90-780. The
storage problem is small.

```
tier    charged TWh   discharged TWh   peak SOC MWh   July discharge GWh
li            12.48            10.98        200,000                  995
fe             3.20             1.44        941,568                   18
```

**the iron-air result survives the fair test.** Given perfect foresight, an LP, and no
merit order to starve it, a 20 GW / 2 TWh iron-air fleet displaces **18 GWh of July gas
out of 2,742**. It does fill - peak state of charge reaches 941,568 MWh, 47% of capacity,
which the heuristic never approached - so this is no longer a dispatch artefact. The 45%
round trip is simply punishing enough that the energy is better left in coal. The
provisional flag is removed: "long-duration storage does not solve a winter wind drought"
now holds under an optimal dispatch, not just a heuristic one.

**~~the heuristic may be under-using lithium~~ - withdrawn 30 Aug 2026, see below.** The LP finds 995 GWh of July gas that lithium could displace and the
heuristic does not, which would be 37% of July gas by the technology actually deployed.
Imposing that schedule did not reproduce the saving - the fixed-point test returned July
gas of 2,751-2,816 against the heuristic's 2,742. The claim is unverified. Full account
in "fixed-point iteration" below.

Caveats, and they matter for how the 37% is read:
- perfect foresight. The LP sees the whole year; a real operator forecasts. Upper bound.
- price-taker. The objective uses a fixed marginal price series and does not re-clear
  the market, so the displaced gas is an estimate of the opportunity, not a re-solved
  system cost.
- The serveable and chargeable limits are approximations from the pass-one dispatch.

### opportunity value, from the duals — a number nobody here publishes

The dual on each SOC balance row is what one more MWh in that store is worth in that
hour. 35,040 rows parsed, 35,040 returned, so the mapping is sound.

```
tier      mean      p50      p90      max     R/MWh
li        1,789    2,020    2,020    2,020
fe        2,020    2,020    2,020    2,020
```

Stored energy is worth about R2,020/MWh at the margin - the scarcity ceiling. Iron-air's
is higher than lithium's because it is rarely the binding store, so its shadow price sits
at the ceiling rather than being competed down. **That is the storage revenue signal, and
it is not published for South Africa anywhere.**

### rolling horizon — and a result that must not be read as it looks

A full-year solve sees every hour before deciding anything; no operator does. Production
cost models solve a window, step forward and carry SOC. Both now run.

```
                                July displacement    annual discharge   solve
perfect foresight, full year      1,013 GWh (36.9%)        12.42 TWh    3.0 s
rolling 168 h window, 24 h step   1,032 GWh (37.6%)        11.26 TWh    6.8 s (365 solves)
rolling 336 h window, 48 h step   1,100 GWh (40.1%)        11.66 TWh    6.0 s (183 solves)
```

**limited foresight appeared to beat perfect foresight on july. Resolved - it was the
crude end-of-window floor, replaced with a terminal value function; all three runs now
agree at 36.5%. The original diagnosis below was only half right.** That
combination is impossible for the quantity being optimised, and the explanation is that
July displacement is not the objective. The LP maximises arbitrage value across the whole
year. Perfect foresight spends storage wherever the price spread is best, which is not
necessarily July; the myopic runs cannot see those better opportunities and serve July
more or less by accident. Annual discharge - closer to the actual objective - behaves
correctly: 12.42 TWh with foresight against 11.26 and 11.66 without.

So do not quote the rolling july figures as an improvement. The honest reading is that
the 37% is robust to foresight assumptions, which is the useful conclusion, and that
comparing runs on a metric neither is optimising invites exactly this error.

### the five gaps, addressed 30 Aug 2026 — four closed, one cannot be

**1. Terminal value function, replacing the crude end-of-window floor. Closed, and it
Fixed the paradox.** Each rolling window now values energy left in the store at the
expected price beyond the horizon, rather than requiring it to end where it started.

```
                                    before        after
rolling 168 h, July displacement     37.6%        36.5%
rolling 336 h, July displacement     40.1%        36.5%
perfect foresight                    36.9%        36.5%
```

The impossible result - limited foresight beating perfect foresight - was an artefact of
the crude floor, and it is gone. All three now agree at 36.5%. **That is a much stronger
finding than the original: the 37% survives, and it no longer depends on foresight
assumptions at all.**

**2. Self-discharge. closed.** SOC carries a per-hour loss: 0.004%/h lithium,
0.05%/h iron-air. Immaterial for a 10-hour battery, about 5% over a full 100-hour
iron-air cycle. Estimates, not sourced - no South African source gives them, and they are
flagged in the code rather than promoted to `FIXED`.

**3. Cycle-life cost. closed.** R250/MWh of throughput for lithium, R50 for iron-air,
standing in for degradation. It stops the LP cycling for a one-rand spread. It also lets
the model express something it previously could not: vanadium's electrolyte does not
degrade, which is a genuine commercial advantage.

Visible in the duals, which are no longer pinned to the scarcity ceiling:

```
tier      mean      p50      p90      max      R/MWh
li        1,563    1,769    1,771    1,774
fe        1,925    1,969    2,025    2,133
```

**4. reserve CO-optimised against arbitrage. Closed** (opt-in, `--reserve`). Power sold
as reserve cannot also discharge, and energy behind it cannot be spent. Until now the
model let a battery sell both at once, which overstates storage revenue.

```
                      iron-air discharge   peak SOC MWh   July contribution
without reserve             1.44 TWh          941,568         18 GWh
with reserve                0.77 TWh          242,264          7 GWh
```

**iron-air's energy role halves once it must also hold reserve**, and its peak state of
charge falls by three quarters. Its opportunity value rises correspondingly - p90 from
2,025 to 2,377 - because the energy is scarcer. July displacement is unchanged at 36.5%,
so lithium absorbs the difference.

**5. fixed-point iteration. run, and it does not converge - which is the finding.**

The LP optimises against prices the heuristic produced. Impose its schedule, re-dispatch,
take the new prices, re-solve. Five rounds with 0.5 damping:

```
round   mean |dP| R/MWh   July gas GWh   storage TWh
  1              352.3           2779          7.91
  2              265.1           2816          7.91
  3              239.2           2779          7.63
  4              216.7           2805          7.84
  5              198.6           2751          7.91
```

Price movement falls slowly - 352 to 199 R/MWh - and July gas oscillates between 2,751
and 2,816 with no trend. Storage flattens the peaks it was built to exploit, which
removes the spread that justified the schedule. This is the known failure mode and it
happened.

### and it puts the 37% in doubt - read this before quoting it

Every iterated July figure (2,751-2,816 GWh) is at or above the heuristic's 2,742. The
LP predicted 1,000 GWh of displacement. **Imposing the schedule did not deliver it.**

Two explanations, and they are not equally flattering:

1. The price-taker objective is arbitrage value, not gas displacement. Discharging in an
   hour when gas was running is counted as displacing gas, but the real dispatch
   re-optimises around the schedule and the gas returns elsewhere. If so, the 37% was
   never a gas saving - it was a bookkeeping artefact.
2. my test is one-sided. `_forcedDischargeMW` is a cap, deliberately, so no infeasible
   state can be forced in. But that means where the LP wants more discharge than the
   heuristic gives, the cap cannot deliver it. Storage throughput fell, 8.42 -> 7.91 TWh,
   which is the signature of a binding cap rather than a better schedule.

### the two-sided test, attempted - and why I stopped

A second override was built to replace the heuristic's discharge outright rather than
cap it, and to count what the engine could not follow:

```
round   July gas GWh   schedule the engine could not follow
  1             2779                            3,843 GWh
  2             2816                            3,398 GWh
  3             2779                            2,850 GWh
  4             2805                            2,847 GWh
  5             2751                            3,044 GWh
```

About 3,000 GWh of a roughly 11 TWh schedule is not physically followable - close to
30% of it.

**but the test is still one-sided, and I should not present the clipping as a verdict.**
Discharge was overridden; charging was not. The store is still filled by the heuristic,
so it cannot possibly discharge to the LP's plan - the clipping largely measures my own
incomplete override, not the schedule's infeasibility.

### retire the 37%, DO NOT chase it

Three rounds of testing have each revealed another layer, and the direction of travel is
consistent: every time the schedule is brought closer to the real engine, the predicted
saving fails to appear. Combined with the fact that the LP's objective is arbitrage value
rather than gas displacement, the reasonable conclusion is that **the 37% was an
accounting artefact of the price-taker formulation** and is not a real dispatch gap.

What would settle it properly is storage inside the unit commitment - the thing a
price-taker LP is defined not to do. That is a genuine model rebuild, and it should be
justified by something better than chasing a number that has failed three tests.

**DO NOT repeat "the heuristic leaves 37% of July gas on the table".** It is withdrawn.
What survives is everything the LP established that did not depend on that accounting:
the opportunity-value duals, the iron-air result, and the reserve-versus-arbitrage
trade-off.

**6. CO-optimisation with unit commitment. not closed, and not closeable here.** A
price-taker LP takes prices as given. Genuine co-optimisation means storage inside the
commitment problem, which is a different and much larger model - that is the difference
between this and plexos. The available partial answer is a fixed-point iteration: re-run
the dispatch with the LP's schedule, take the new prices, re-solve, repeat. Worth doing;
not done.

Next: the 37% is large enough to justify embedding the LP in the engine rather than
leaving it as a probe. The dual on the SOC balance is the opportunity value - the number
the two-pass gate was approximating - and no South African study publishes it.

**~~SO the headline result is now provisional.~~ resolved - see above.** "Iron-air changes July gas by exactly
zero in all ten years" was measured on a dispatch that structurally cannot charge it.
The finding may survive - the efficiency penalty is severe and the July deficit is large
- but it has not been tested against a dispatch that gives long-duration storage a fair
chance. Do not repeat the claim externally until it has.

### what a seasonal lookahead would and would not fix

The dispatch has no lookahead of any kind. Tiers are sorted by round-trip efficiency, so
iron-air at 45% charges last and discharges last, purely on whether this hour has a
surplus or a deficit. It cannot deliberately hold energy for a future event.

But adding foresight would not change either row above, because in one there is nothing
to store and in the other nothing to serve. **The untested case is in between** - roughly
60 to 80 GW of vre, where curtailment has begun but the drought is not yet covered. That
is where a seasonal lookahead could bite, and it has not been run.

### and iron-air is not a seasonal technology anyway

100 hours is about four days. Form Energy markets it as multi-day storage, sized for
extended weather events, not for shifting summer into winter. Seasonal shifting needs
thousands of hours - large-reservoir pumped hydro, hydrogen, or thermal.

The 45% round trip compounds it: charging in summer to discharge in winter throws away
55% of the energy on the way. At 20 GW / 2 TWh, absorbing even 2.2 TWh of a 100 TWh
surplus takes the whole fleet through several cycles. Capacity is the binding limit at
that scale, not dispatch intelligence.

So the honest position: the model does not give seasonal operation a fair test, and
should say so - but in the scenarios examined the conditions for it do not arise, and
iron-air is the wrong technology to test it with.

---

## Merchant value trajectory to 2035 - and who is exposed to it

Measured 30 Aug 2026. Each year's installed base is the current fleet plus the build
pace compounded, then dispatched and priced. Achieved revenue is output-weighted against
the model's hourly shadow price.

Re-run 31 Aug 2026 against the corrected constants.

```
                        2026    2029    2032    2035     fall
IRP pace (2.2 GW wind, 1.5 GW solar a year)
  wind R/MWh             977     771     733     653     -33%
  solar R/MWh            756     743     730     633     -16%
  total wind+solar GW    7.9    19.0    30.1    41.2

Masterplan (2.5 / 2.0)
  wind R/MWh             977     763     720     600     -39%
  solar R/MWh            756     744     717     559     -26%
  total GW               7.9    21.4    34.9    48.4

Grid pace (4.3 / 4.0 - all remaining GCCA headroom by 2030)
  wind R/MWh             977     740     530     323     -67%
  solar R/MWh            756     741     437     139     -82%
  total GW               7.9    32.8    57.7    82.6
  curtailment TWh        0.0     0.2    16.3    57.3
```

**solar is unchanged from the published version** - the same -16%, -26% and -82%. **wind
Is not.** Its 2026 starting point moves from R758 to R977, and its fall steepens from
-59% to -67% at grid pace.

The reason is the scarcity pricing the 31 Aug constant corrections revealed. Wind produces
in the evening hours that are now expensive; solar does not. So wind starts 29% above
solar today, where the published version had them within 2% of each other.

**the practical point changes.** Wind's advantage over solar is larger today than
published - R977 against R756, not R758 against R743 - and it therefore has further to
fall. A wind project's merchant case is stronger now and erodes faster; a solar project's
was always weaker and erodes on the same path as before.

**merchant value of solar energy falls 82&#37; by 2035 at grid pace, 16&#37; at IRP pace.**
The build rate, a policy choice rather than a market outcome, moves this five times more
than anything about an individual project.

### who actually bears this - the correction that matters

An earlier version of this section said "a solar PPA signed today loses 82&#37; of its
value". **That was wrong.** A PPA is a contract at a fixed or cpi-indexed price for a set
term. Wholesale prices falling does not reduce the seller's revenue during that term -
insulating the seller is precisely what the contract is for.

What the numbers above measure is the merchant value of the energy. Who that reaches:

```
CONTRACTED SELLER, in term    NOT EXPOSED. A 20-year REIPPPP PPA signed in 2026 runs to
                              2046; 2035 is mid-term and the tariff is unchanged.
THE OFFTAKER                  FULLY EXPOSED. Eskom or a corporate buyer pays a contracted
                              R0.55/kWh for energy worth R0.13 on the market. The
                              contract did not remove the loss, it moved it.
NEW PPAs                      EXPOSED. A buyer signing in 2032 prices against expected
                              merchant value, so offered tariffs fall even though
                              existing ones do not.
MERCHANT AND PARTLY-MERCHANT  DIRECTLY EXPOSED. Corporate PPAs with floating or
                              partly-merchant structures track this closely.
POST-TERM ASSET VALUE         EXPOSED. Residual value after PPA expiry, and any
                              repowering case, rests on the merchant tail.
CURTAILMENT RISK              DEPENDS ON THE CONTRACT. Whether a curtailed MWh is paid
                              for is a clause, not a market outcome. At 59 TWh of
                              curtailment that clause is worth more than the tariff.
```

**So this is not a warning to project developers holding signed PPAs. It is a warning
about what those contracts will cost the party on the other side, and about what the next
round of contracts will be worth.** That is a more useful finding, and a different one.

### the compression is double, and that is the part usually missed

Capture rate and the price pool fall together. At grid pace in 2035 solar captures 40&#37;
of a mean price that has itself fallen from R756 to R331. Neither number alone shows the
damage: 40&#37; sounds survivable, R331 sounds survivable, and the product is R133.

Anyone quoting capture rate alone is understating the problem by roughly half.

### the cliff edge is sharper than the average suggests

Nothing much happens for four years, then it goes quickly. At grid pace, solar holds
above R680 through 2030 and reaches R133 five years later. The inflection is where
curtailment starts: 0.2 TWh in 2029, 1.8 in 2030, 17.2 by 2032.

**Curtailment is the leading indicator**, and it is observable years before the value
arrives. Anyone watching national curtailment has warning; anyone watching only capture
rate does not.

It also compounds the contract question: at 59 TWh spilled, whether a curtailed MWh is
paid for under the PPA matters more to the seller than the tariff does.

Caveats: single weather year; merchant revenue against the model's shadow price, which
has no floor, no bilateral contracting and limited exports - all of which lift real
outcomes. Storage scales with the build at each pace's own rate, which materially
protects solar. The direction and the order of magnitude are the result, not the levels.

---

## Hybrids: co-locating a battery, and the U-shape nobody expects

Revised 31 Aug 2026. An earlier version of this section reported the uplift rising
monotonically with penetration - 2-6% today, 166-408% by 2035. **That was measured on
pre-correction constants and the shape was wrong.** Coal capacity was 5.8% too high,
imports more than double reality, and availability three points optimistic, which between
them suppressed the scarcity pricing that co-location actually monetises.

Re-run with the audited constants. Project-level price-taker LP, battery behind the meter
so it charges only from its own plant, 4-hour duration, grid pace:

```
                       SOLAR R/MWh                    WIND R/MWh
battery          2026     2030     2035        2026     2030     2035
none              756      690      139         977      698      323
25% of plant    1,004      714      359       1,152      716      445
50% of plant    1,252      733      558       1,320      731      510
100% of plant   1,743      742      677       1,627      740      575

solar uplift     +130%      +8%    +386%
wind  uplift      +66%      +6%     +78%
```

### the value is U-shaped, not rising

**Today +130%. In 2030 +8%. In 2035 +386%.** Co-location is worth a great deal now, very
little in five years, and a great deal again in ten.

The reason is that arbitrage pays for volatility, and volatility has two different
causes at the two ends:

- **2026 is volatile from scarcity.** Coal sets the price most hours and diesel sets it
  in the tight ones, so the spread is large. A battery monetises that immediately.
- **2030 is comfortable.** About 41 GW of wind and solar with storage built alongside;
  prices flatten, spreads collapse, and there is little to trade.
- **2035 is volatile from surplus.** At 82 GW, midday solar is worth almost nothing and
  evening scarcity returns. Solar bare collapses to R139 and a battery restores it to
  R677.

**A developer's conclusion should not be "storage becomes valuable later".** It is
valuable now for one reason, briefly less so, then valuable again for the opposite
reason. The two are not the same trade and would not be financed the same way.

### what this means for the PPA question

The exposure identified above sits with offtakers, new contracts and post-term value.
Co-location changes those numbers at both ends of the period, and a buyer pricing a
contract in 2032 is pricing the trough rather than either peak.

Caveats: perfect foresight of prices, so an upper bound. No battery capex is netted off -
this is the revenue side only, and a battery at 100% of plant capacity is a very large
investment. Single weather year. Grid pace is the fastest of the three build paces and
the most punishing on capture.

Validation: the browser-speed greedy in the capture panel tracks this LP within 4.7%
across twelve cases and is conservative in eleven of them.

---

*GridTwin ZA. Code and documentation © 2026 Nick Hedley, released under CC BY-NC-ND 4.0.
Data files carry their own terms — see sources.md. Model outputs are reproducible from
the scenarios stated; nothing here is a tariff, a forecast, or investment advice.*

---

## Validated against Eskom's audited FY2026 generation

The integrated report publishes generation by technology and a full energy balance. This
is the first time the model has been checked technology by technology against audited
national data rather than against a benchmark band.

```
technology       Eskom FY2026   GridTwin    delta
coal                   165.4       161.5    -2.4%
nuclear                 11.6        11.4    -1.8%
wind                    11.6        12.4    +6.7%
solar PV                 6.8         6.2    -8.7%
CO2                    184.5       170.5    -7.6%
```

**Four of five technologies inside 9%, coal and nuclear inside 3%.** For a model built
from public data with no access to Eskom's dispatch, that is the strongest corroboration
in this file.

### two gaps that are real, not rounding

**OCGT: the model runs 217 GWh against Eskom's 1,898. explained 31 Aug 2026, and it is a
Scope difference rather than a modelling error.**

Eskom's own hourly file `ESK19243.csv` records `Eskom OCGT Generation` for all of 2025 -
what the peakers actually did. Two things fall out.

### the seasonality is right

```
month      model share   Eskom share
Jan              16.5%         16.0%
Feb              17.2%         17.0%
Jul               7.1%          6.0%
Sep               2.9%          0.0%

Jan-Mar : Jul-Sep     model 3.9:1     Eskom 8.5:1
```

Peakers run eight and a half times more in late summer and autumn than in winter, because
maintenance is scheduled away from the winter peak. The model reproduces January and
February to within half a point, and if anything its 3:1 maintenance concentration is too
Mild.

### the level differs because eskom does not dispatch peakers on merit

```
Eskom OCGT ran in 2,016 hours - 23% of the year - and across the WHOLE demand range:

demand decile        demand MW        mean OCGT MW
 3                 19.5-20.2k                   85
 6                 21.6-22.3k                  198
 8                 23.1-24.1k                  256
10                 25.5-31.2k                  688

output at demand above 28,000 MW      209 GWh    11% of the total
output at demand below 25,000 MW    1,203 GWh    63% of the total
```

**Sixty-three per cent of Eskom's peaker generation happens below 25 GW of demand**, with
roughly 25.8 GW of coal available - hours where a merit-order model has no reason to start
a peaker at all, and correctly does not.

That output is reserve provision, network support and ramping. none of those are priced by
an energy merit order, so a model that dispatches on economics alone cannot reproduce
them, and tuning availability until it does would be fitting the right total for the wrong
reason.

**this closes the four-point EAF gap.** Reproducing Eskom's outturn appeared to need ~61%
availability against an audited 65.2%. It does not: the missing energy is non-energy
services, and lowering availability would have manufactured scarcity to imitate them.
`coalEAFPct` stays at the audited value.

What it means for results: peaking cost and emissions are understated in the base case,
and the understatement is concentrated in the moderate-demand hours where reserve is held
rather than in the tight ones. Direction is unchanged - reality is dirtier and dearer than
the model.

---

## Transmission cost: two published routes that bracket the constant

`txRPerKWyr` underpins the locational transmission work and the EPP submission, and until
31 Aug 2026 it rested on one derivation. Eskom's FY2026 capex plan gives a second,
independent route.

```
ROUTE 1  Eskom TDP (in the model since the start)
  R390bn / 56 GW  =  R6,964/kW overnight  ->  ~R700/kW-yr gross
  R26.9m per route-km

ROUTE 2  Eskom FY2026 results, capex plan FY2027-31
  R343bn x 46% to NTCSA = R157.8bn, delivering 8,362 km and 82,425 MVA
  R18.9m per route-km
  if unlocked capacity scales with route-km: 32.3 GW -> ~R490/kW-yr gross

MODEL DEFAULT  R600/kW-yr, net of the share already committed
```

**the two routes bracket the default.** R490 and R700 gross, with the model at R600 net.
That is the useful result: an independent source does not overturn the constant, it puts
bounds either side of it.

### what this does not establish — three assumptions doing real work

1. **"Capacity unlocked scales with route-km" is an assumption, not a finding.** It is
   the step converting 8,362 km into 32.3 GW, and the R490 depends entirely on it.
   Corridors differ enormously in what they unlock per kilometre - that is the whole
   point of the locational analysis this constant feeds.
2. **The 46% NTCSA share is read off a donut chart** in the results presentation, not a
   stated figure. Treat it as approximate.
3. **Scopes differ.** NTCSA capex covers transformers, substations and refurbishment, not
   only new lines for renewables. The TDP figure is renewables-integration specific. The
   per-km numbers - R26.9m against R18.9m - are the cleaner comparison, and they still
   differ by 30% for reasons the sources do not resolve.

Conclusion: no change to the constant. It was defensible on one source and is better
supported by two, and the slider note now shows both bounds rather than one derivation.

---

## Surplus capacity: the model agrees with Eskom, within a definition nobody published

Eskom FY2026: *improved generation availability has created an estimated 2-3 GW surplus
capacity, positioning Eskom to attract new demand rather than ration it.* First time in
over a decade, and the first published figure this project can test its adequacy side
against rather than its energy side.

Measured at the model's annual peak, 31,595 MW:

```
gross headroom at the annual peak                  4,754 MW
less operating reserve held                        3,366 MW = 3.4 GW
less reserve AND contracted imports                2,894 MW = 2.9 GW
less reserve, imports AND VRE credit at peak       2,190 MW = 2.2 GW

Eskom                                              2,000-3,000 MW
```

**two of the three defensible definitions sit inside eskom's range**, and the third is
13% above its top. Eskom does not state its method, so the honest reading is agreement
rather than a match.

The definitional question is real and not a quibble. Contracted Cahora Bassa imports are
capacity, but they are not capacity Eskom can sell to a new customer. vre at the winter
evening peak contributes 704 MW of a 8,483 MW fleet, so whether it counts at all depends
on what firm means. Those two choices move the answer by 1.2 GW - more than the width of
Eskom's own range.

Now a benchmark check, band 1.8-4.0 GW, deliberately spanning the definitions rather than
picking the flattering one. **It is the first check on the adequacy side against a
published national figure**: if the model ever calls the system comfortable while Eskom
calls it tight, that is where it will show.

---

## Wind Pioneers' diurnal observation, tested across ten weather years

Wind Pioneers published a South African prospecting study in Aug 2026 arguing that wind
prospecting should answer "is the wind right for our project?" rather than "where is the
wind?" - two sites with equal mean speed can generate at very different hours. Their
stated observation: Western and Eastern Cape peak in daytime, Northern Cape at night.

Tested on GridTwin's regional profiles - MERRA-2 via Renewables.ninja, Vestas V90 at 80 m,
capacity-weighted to actual plant locations. A different derivation from theirs.

First run was single-year and two of its conclusions did not survive the ten-year test.
Both are recorded below, because the difference is the point.

```
region           wind CF   day/mean       night/mean      holds across 10 yrs
Northern Cape      0.379   0.829-0.889    1.110-1.162     NIGHT, 10/10
North West         0.332   0.790-0.900    1.092-1.194     NIGHT, 10/10
Free State         0.268   0.892-1.004    1.020-1.139     NIGHT, 10/10
Eastern Cape       0.367   0.989-1.057    0.896-0.966     DAY,   10/10
Western Cape       0.365   0.950-1.032    0.967-1.031     MIXED - flips by year
Hydra Central      0.425   0.997-1.059    0.950-1.005     MIXED - flips by year
```

day = 08-17 SAST, night = 20-05 SAST, each against that region's own mean.

**their northern cape claim is right and stronger than they stated** - night-peaking in
every one of ten years, with a 25-40% day-night swing. Eastern Cape day-peaking also holds
10/10. **Western Cape does not**: it flips between day and night across years, so a
single-year study can find either.

### the hybrid case, also ten years

Hourly wind-solar correlation within each region. Negative means they complement.

```
region           min      max      mean     holds
Northern Cape   -0.233   -0.149   -0.180    negative 10/10   <- best in the country
North West      -0.176   -0.099   -0.144    negative 10/10
Western Cape    -0.104   -0.025   -0.062    negative 10/10
Free State      -0.092   -0.015   -0.054    negative 10/10
Eastern Cape    -0.031    0.013   -0.007    MIXED
Hydra Central   -0.047    0.037   -0.004    MIXED
```

**Their Northern Cape hybrid argument is correct and it is the best case in South Africa** -
the strongest complementarity of any region, in every year tested.

### two single-year conclusions that did not survive

On calendar 2023 alone the first run produced two striking claims. Neither holds:

```
CLAIMED  North West has the best complementarity, at -0.155.
ACTUALLY Northern Cape is best at -0.180 mean. 2023 happened to be North West's
         strongest year and Northern Cape's weakest.

CLAIMED  Hydra Central has the best wind AND positive wind-solar correlation - best
         wind in the country, worst place for a hybrid.
ACTUALLY Hydra Central averages -0.004 across ten years and flips sign. It is NEUTRAL
         for hybrids, not bad. The 2023 value of +0.028 was inside the year-to-year
         spread, and "best wind, worst hybrid" was a story built on one year.
```

**The second was about to be sent to an external company.** It was caught by running the
ten-year file that already existed - the same file the single-year run had not used.

### the dimension missing from the framing

They map wind in space and time and ask whether it fits the project. On GridTwin's
headroom data the binding constraint is neither: **the four best-wind regions hold 100% of
existing wind and 7.3% of the national room to add more, and Northern Cape and Hydra
Central - the two best resources here - are at zero headroom for every technology.**

A perfect diurnal match at a site with no connection is not a project. That complements
their work rather than criticising it: they answer whether the wind fits the offtaker, and
the unanswered question is whether the grid will take it.

---

## Eskom's tariff seasons are inverted against its own dispatch

Prompted by Ausgrid's dynamic network tariff going live in Australia, and directly
relevant to the Eskom Retail Tariff Structural Adjustment now open for comment.

Eskom's Megaflex time-of-use structure prices **June to August as the high-demand
season** - the expensive one. Two independent tests say the system is not tight then.

### eskom's own measured dispatch

`ESK19243.csv`, Eskom's hourly file for 2025, records what its peakers actually did:

```
tariff season          Eskom OCGT run     share of hours
low  (Sep-May)            1,583 GWh              75%
high (Jun-Aug)              315 GWh              25%
```

**Eskom ran 83% of its peaker energy in the season its own tariff calls cheap.** Peakers
run when the system is short, so this is the operator's own revealed measure of scarcity,
not a model output.

### and the modelled shadow price agrees

Hourly shadow price within each Megaflex block:

```
block               hours     mean    median      p95
high/peak             330    1,277       750    6,206
low/peak              975    1,475       749    6,206
high/offpeak          528      744       744      760
low/offpeak         1,560      787       737      757
weekend (both)      2,496      868       748    6,206
```

Two things fall out.

**the low-season peak is dearer than the high-season peak** - R1,475 against R1,277. The
seasonal labels are the wrong way round.

**the blocks barely discriminate on a typical hour.** Every median sits between R737 and
R755, a spread of 2%. What separates the blocks is entirely the tail: p95 runs from R757
off-peak to R6,206 in peak, standard and weekend. A fixed block cannot see that, because
the expensive hours are scattered rather than scheduled.

**Weekends are called cheap and carry a p95 of R6,206.** Off-peak and weekend hours are
50.8% of energy and carry 41% of the system's hourly cost - closer to proportional than a
cheap-rate label implies.

### why this is not a model artefact

The summer scarcity is driven by maintenance scheduled away from the winter peak, and that
seasonality is **corroborated by Eskom's measured OCGT dispatch at 8.5:1 Jan-Mar against
Jul-Sep** - see the peaker section. Model and operator agree independently.

### what it does not say

Not that Megaflex is wrong as a tariff. Retail tariffs recover network and fixed costs, not
just energy, and the high-demand season reflects peak demand, which genuinely is in winter.
The finding is narrower: **peak demand and system scarcity are in different seasons in
South Africa**, and a tariff built on the first does not price the second. That is exactly
the gap a dynamic or scarcity-linked component would close, and it is what makes the
Ausgrid model relevant here rather than merely interesting.

---

## Wheeling calculators: the 65% is real, the shape behind it is the story

Energy Brokers publishes a free wheeled-energy estimator whose worked example claims a
9 GWh/yr industrial user can reach 25% lower costs, 65% renewable coverage and 5,000+
tonnes of carbon avoided. Tested against our regional profiles over ten weather years,
matching a flat 1,027 kW industrial load in the Northern Cape.

### the coverage claim holds

```
mix                       ten-year range      mean
solar only 2 MW            35.7 - 36.7%      36.3%
solar only 4 MW            41.2 - 41.9%      41.6%
wind only 2 MW             57.5 - 64.2%      61.2%
wind 1 + solar 2 MW        61.0 - 65.7%      63.7%
wind 2 + solar 3 MW        78.4 - 83.9%      81.1%
```

65% is achievable with a wind and solar mix. It needs roughly three megawatts of
generation for a one megawatt load, which is the part a headline number hides.

### solar alone cannot pass 49% of a flat load, anywhere in South Africa

Extended to eight regions and ten weather years. The result is a physical limit, not a
regional quirk.

```
region           solar 2 MW   solar 4 MW   solar 8 MW
Northern Cape         36.6%        41.8%        44.5%
Western Cape          34.9%        40.5%        43.5%
Eastern Cape          35.7%        41.2%        44.1%
Free State            36.2%        41.8%        44.6%
North West            36.4%        41.9%        44.8%
Limpopo               36.0%        41.9%        44.5%
Mpumalanga            36.0%        41.6%        44.4%
Gauteng               36.1%        41.8%        44.5%
```

**Under two points of spread across the whole country at every build level.** The best
solar resource in South Africa buys a wheeling customer barely one point more coverage
than the worst.

The ceiling is the daylight fraction. **Only 49.3% of hours in the year have any solar
output at all**, so no quantity of panels can serve a flat load in the other half:

```
solar  2 MW for a 1 MW load    36.6%
solar  4 MW                    41.8%
solar  8 MW                    44.5%
solar 16 MW                    46.1%
solar 32 MW                    47.6%     sixteen times the plant, eleven points
```

### what actually breaks it

```
solar 4 MW alone                        41.8%
   add a 4-hour battery                 58.2%    +16.4
   add 1 MW of wind                     67.3%    +25.5
   add both                             83.5%    +41.7
wind 2 + solar 4 + 2 MW / 8 MWh         98.0%
```

**Wind buys more than a battery, and both together buy more than the sum of either.** A
battery moves solar within the day; wind produces in hours solar never does. For a
24-hour industrial load they solve different halves of the same problem.

### why this matters commercially

South Africa's wheeling market is growing quickly and is sold largely on renewable share.
**A solar-only contract is capped near 45% regardless of contracted capacity**, and a
buyer scaling up a solar-only deal to raise their share is buying eleven points for
sixteen times the plant. The lever is diversity, not volume.



### and this is where a battery earns its place

```
solar 2 MW, no battery                36.3%
solar 2 MW + 1 MW / 4 MWh             44.0%    +7.7
solar 4 MW + 1 MW / 4 MWh             57.6%   +21.3
wind 1 + solar 2 + 1 MW / 4 MWh       76.9%   +13.1
```

A battery is worth far more on a solar-heavy contract than a mixed one, because it is
substituting for the diversity wind provides directly. On 4 MW of solar it adds 21 points.

### the carbon figure depends on a factor nobody states

```
9 GWh at 65% renewable = 5.85 GWh displaced

GridTwin modelled grid mix   0.780 t/MWh    4,563 t
a common SA grid factor      0.95           5,558 t
Eskom coal-only              1.04           6,084 t
calculator claims                           5,000+ t
```

Their number sits inside the plausible range, but the range is a third wide and the
answer turns entirely on which emission factor is used. **Any wheeling estimate quoting
avoided carbon should state its factor**; without it the figure cannot be checked or
compared between offers.

### what was not tested

The 25% saving. It depends on the buyer's blended tariff, the wheeling charge and the PPA
price, none of which are published here. It is the number a buyer should press hardest on,
because it is the one this analysis cannot corroborate.

---

## Green hydrogen from curtailment needs far more overbuild than the roadmap assumes

South Africa's hydrogen strategy leans on diverting surplus renewable energy to
electrolysers rather than spilling it. The curtailment series to test that is computed
hourly, so this is arithmetic on data already in the model.

```
scenario          curtailed   hours at   500 MW electrolyser
                              non-zero    CF      LCOH R/kg
today                 0 TWh          0    0%              -
45 GW VRE          2.86 TWh        442  4.9%            285
grid pace 2035    57.64 TWh      4,245 47.8%             29
110 GW VRE       110.82 TWh      5,208 58.8%             24
```

**At the 45 GW build most South African scenarios assume, an electrolyser running only on
curtailed energy achieves a 4.9% capacity factor.** Electrolyser economics are
capex-dominated - with free energy the entire cost is capital recovery - so low capacity
factor is fatal rather than merely poor. R285/kg against a grey hydrogen benchmark near
R30-45.

The relationship is exact: **cost is inversely proportional to capacity factor.** A
twelvefold gap in capacity factor is a twelvefold gap in cost, and nothing else in the
calculation moves.

### where it does work

At grid pace by 2035, or at the 110 GW no-gas frontier, curtailment reaches 4,000-5,000
hours a year and the same electrolyser reaches 48-59% capacity factor and R24-29/kg. That
is competitive.

**So curtailment-driven hydrogen is not an early-transition play.** It requires the
overbuild that produces sustained curtailment, which on our own frontier work means
roughly 110-120 GW of wind and solar. Positioning it as a way to make today's build more
economic has the causation backwards: the curtailment has to exist first, and today there
is none at all.

CAVEATS: electrolyser capex at R18,000/kW carries wide uncertainty and is a parameter
rather than a fixed number; 52 kWh/kg is system-level including balance of plant against a
thermodynamic floor of 39.4. Curtailed energy is priced at zero, which is generous - in
practice it would carry some network charge.

---

## Grid-enhancing technologies against building line, per megawatt unlocked

The model already had a toggle for grid-enhancing technologies giving a 20% headroom
uplift. It answered "could we" and never "should we", because it carried no cost.

Line cost uses the range established from two independent published routes - R18.9m/km
from Eskom's own FY2027-31 capex plan, R26.9m/km from the TDP.

```
Eastern Cape - KwaZulu-Natal, 167 km, the most congested corridor in the model
at 3,080 hours a year at its limit

option                        cost      per MW unlocked    versus line
new line                   R3.82bn            R2.55m                 -
dynamic line rating        R0.006bn           R0.033m           76x cheaper
topology optimisation      R0.025bn           R0.208m           12x cheaper
advanced power flow control R0.090bn          R0.300m            8x cheaper
```

**The cheapest option is between eight and seventy-six times cheaper per megawatt
unlocked**, and on the longer Western Cape to Hydra Central corridor the dynamic line
rating ratio reaches 127x because line cost scales with distance while sensor cost barely
does.

### the comparison is per megawatt, and that is the only honest basis

A new line and a set of sensors are not alternatives in kind: one adds a corridor, the
other extracts more from the corridor already there. What they share is that both release
capacity, and capacity is what a constrained developer is queuing for. A new line unlocks
several times more, and the ratios say nothing about whether the smaller amount is enough.

### the weakest input, stated

**The grid-enhancing costs are international ranges, not South African tenders.** No
published NTCSA procurement is available. The line costs are well sourced and the uplift
percentages are conventional, but the capital costs are the number to interrogate first -
which is why the output is a ratio rather than a business case.

---

## Electrolyser siting: resource points at the Karoo, water points at the coast

An electrolyser is worth most where the resource is best and the grid will not take it -
which is a real place in South Africa, because the correlation between wind capacity
factor and connection headroom is -0.91.

```
region            combined CF    headroom MW
Hydra Central           31.3%              0
Northern Cape           30.5%              0
Eastern Cape            28.3%            400
KwaZulu-Natal           21.0%         11,000
```

**The two best resources in the country cannot connect.** An off-grid electrolyser
monetises exactly the resource a generator cannot sell, so it is worth most where a
generator is worth least.

### and then water reverses the answer

Electrolysis needs roughly 9-10 litres of demineralised water per kg of hydrogen, plus
cooling. The Northern Cape has the best resource in South Africa and the least water.

```
weighting                     top three
resource only                 Hydra Central · Northern Cape · Western Cape
+ water, ports excluded       Western Cape · Eastern Cape · North West
+ water weighted double       KwaZulu-Natal · Western Cape · Eastern Cape
```

PORTS DROPPED 2 Sep 2026. Hydrogen can be used in domestic heavy industry, so export access
is one commercial case among several and weighting it prejudges the buyer. Removing it
changes the third place: **North West, not KwaZulu-Natal.** KwaZulu-Natal reaches the top
three only when water is weighted double, because it has ample water and the worst combined
resource in the country at 20.6%.

**Adding water and export access moves the answer from the Karoo to the coast entirely.**
Hydra Central and the Northern Cape fall out of the top three altogether once water is
scored at all.

That is the finding, and it is a caution rather than a recommendation: **any siting
analysis that ranks on resource alone will point at the Karoo and be wrong.** The
resource case and the water case run in opposite directions across the same geography.

### what is modelled, and what is asserted

```
resource quality      MODELLED - ten weather years, capacity-weighted regional profiles
grid headroom         MODELLED - NTCSA GCCA, and it is the inverse signal
water stress          ASSERTED - three coarse levels from public knowledge
port access           ASSERTED - three coarse levels; Boegoebaai flagged as PROPOSED
industrial demand     NOT MODELLED - needs a dataset this project does not have
```

The two asserted layers are deliberately three-level rather than numeric. A hydrological
or logistics dataset would let them be scored properly; inventing decimals from general
knowledge would give a precision the inputs cannot support.

**The weights are the caller's, not the model's.** Whether resource beats water beats
export access is a commercial judgement, so the tool returns every region scored on each
dimension and lets the user move the weighting - the ranking above shifts completely
between the three weightings shown, which is the honest way to present it.

---

## EDMSA Scenario A: the 2035 endpoint agrees to 0.2%, the starting point does not

The Energy Council's Energy Data and Modelling South Africa platform published Scenario A
(As-Is Baseline) on 7 May 2026, built in PLEXOS. Reproduced in GridTwin from its stated
assumptions: EAF 70%, demand growth 2% a year, roughly 5 GW a year of renewables, 4 GW of
CCGT, 4.1 GW of coal retirement.

### the endpoint is close to identical

```
2035                    GridTwin      EDMSA Scenario A
CO2 Mt                     123.8                   124
wind TWh                    64.1                   64+
unserved energy                0        0 by 2034
```

**Two independently built models, one in PLEXOS and one in a browser, landing within 0.2%
on 2035 emissions and exactly on wind output.** That is the strongest external corroboration
this project has, and it is worth more than agreement with a single number would be,
because the models share almost no code, data pipeline or authorship.

### the 2025 starting point differs by 11%, and availability does not explain it

```
                    coal TWh    CO2 Mt
GridTwin, EAF 65       165.6     174.5     validated against Eskom's audited FY2026
GridTwin, EAF 70       165.9     175.0
EDMSA Scenario A                    195
```

Raising availability to their assumption moves our answer by 0.5 Mt. **The gap is 20 Mt and
availability accounts for half a megatonne of it.**

RESOLVED 1 Sep 2026 by a third route. Eskom burnt 96.5 Mt of coal in FY2026 for about
165 TWh, and the emissions that implies depend entirely on calorific value:

```
CV 19 GJ/t   ->  173.4 Mt   1.049 t/MWh     our emisCoal is 1.040
CV 20 GJ/t   ->  182.6 Mt   1.104 t/MWh
CV 21 GJ/t   ->  191.7 Mt   1.159 t/MWh
```

Our factor corresponds to roughly 19 GJ/t, defensible for Eskom's low-grade burn, and we
sit within 0.3% of Ember's power-sector figure. **Three numbers are in circulation and they
measure three different things**: Ember's 175 Mt is power-sector CO2; Eskom's 184.5 is
group Scope 1 across all greenhouse gases; EDMSA's 195 is unstated. The question to ask is
which boundary, not which is right. Our 174.5 Mt is benchmarked against
Eskom's own audited reporting, so the difference is a scope or factor question rather than
a dispatch one: it may include embedded and private generation, or use a different emission
factor. It is the first thing to ask about.

### the 2032 adequacy trough does not reproduce

They identify 2029-2032 as the critical window, with unserved energy peaking at 49.51 GWh
in 2032. Reconstructing that year gives **zero unserved energy** in GridTwin.

Stated with appropriate caution: our reconstruction of their build PATH is approximate -
they specify endpoints and a CCGT determination, not an annual schedule - so a timing
difference is the likely explanation rather than a disagreement about adequacy. The
endpoints agreeing while the path differs is exactly what a path assumption does.

### where the two models genuinely disagree

Scenario A's assumption table records **"Grid Readiness: Adequate per TDP 2023/24; IRP 2025
Section D confirms transmission adequacy through 2030"** - and its key insights then say
"grid absorption capacity, not just installed capacity, is emerging as the binding
constraint."

Those two statements sit uneasily together, and our data supports the second against the
first. On NTCSA's GCCA 2025, **the four best wind regions hold 7.3% of national headroom
and the two best are at zero for every technology.** The correlation between wind capacity
factor and available headroom is -0.91.

TDP 2023/24 is a plan; GCCA 2025 is a snapshot of what can connect today. A scenario that
assumes the plan is delivered will not see the constraint its own insights identify.

### a small thing, said plainly

The executive summary states capacity growing "from approximately 66 MW in 2025 to over
120 MW by 2035", twice. Megawatts for gigawatts - a typo rather than a modelling issue, but
it is in the first paragraph a reader meets.

---

## An annual build trigger cannot see the risk it is meant to catch

EDMSA Scenario A's central question is whether new capacity is being added in line with
what the system can efficiently absorb, and its Action 5 proposes a monitoring trigger:
**"Implement a 5 GW per annum renewable addition monitoring trigger. If annual additions
exceed this threshold, convene a system flexibility review."**

Tested directly. Renewable output wasted, as economic plus congestion curtailment, against
the share of generation it represents. Demand grows 2% a year as their scenario assumes.

```
annual rate      sustained 5 years   sustained 10 years
2 GW/yr                       4.0%                 4.0%
4 GW/yr                       4.0%                 5.9%
5 GW/yr                       4.2%                 9.8%
6 GW/yr                       4.8%                15.3%
8 GW/yr                       8.1%                25.9%
10 GW/yr                     13.9%                34.6%
```

**The same rate produces very different outcomes depending on how long it runs.** Five
gigawatts a year wastes 4.2% of renewable output over five years and 9.8% over ten. The
rate is identical; only the accumulation differs.

### so the trigger measures the wrong variable

An annual threshold is satisfied indefinitely while waste compounds underneath it. A
programme running at 4.9 GW a year never trips a 5 GW trigger, and after a decade is
wasting close to a tenth of what it generates.

**The binding variable is cumulative capacity against demand, not the rate of addition.**
A trigger on installed VRE as a multiple of peak demand, or on measured curtailment itself,
would catch what the annual rate cannot.

### the 4% floor is not oversupply

Note the flat 4.0% at low build rates. That is the NERSA-approved congestion curtailment
ceiling, not economic surplus - output spilled because a corridor is full while other
regions still import. **It exists today at zero economic curtailment**, which matters for
their framing: their band 3, "uncontrolled excess capacity results in curtailment", is
already partly happening for a reason that has nothing to do with excess capacity.

Economic curtailment - genuine surplus nobody wants - only becomes material above about
4 GW a year sustained for a decade.

### what this does not say

Not that curtailment is a reason to build less. Our own frontier work shows removing gas
entirely requires 110-120 GW and throws away more than 40% of output, and is still roughly
cost-neutral, because the capex of overbuild is cheaper than the fuel it displaces. **Waste
is a price, not a verdict.** The question a monitoring framework should ask is whether the
waste is bought deliberately or accumulated by inattention, and an annual rate trigger
cannot tell those apart.

---

## Heat: the damage comes through demand, not through derated plant

The model carries no temperature data, so this is a stress test rather than a forecast:
apply the physical effects of a hot spell and see what the system does. Four channels, each
with a physical basis - solar -0.40%/degC, thermal -0.15%/degC, cooling demand +1.2%/degC,
line rating -0.8%/degC, all against a 25degC baseline.

**Why this matters more in South Africa than elsewhere.** This model's shortage hours fall
in January to March, and Eskom's own dispatch confirms it - 8.5 times more peaker energy in
Jan-Mar than Jul-Sep, because maintenance is scheduled away from the winter peak. **The
tight season is the hot season.** In a northern-hemisphere system heat and system stress
fall in opposite halves of the year; here they coincide.

```
+degC   EAF used   demand   unserved GWh   short hours   worst stage
    0       65.0       +0%            5.5             5             3
    3       64.7     +3.6%           27.8            30             4
    5       64.5       +6%           67.0            57             4
    8       64.2     +9.6%          162.7           122             6
   12       63.8    +14.4%          500.2           344             7
```

### one channel does almost all of it

```
at +8degC                    unserved GWh
baseline                              5.5
thermal derate only                   8.1      +2.6
cooling demand only                 124.6    +119.1
both together                       162.7    +157.2
```

**Cooling demand does forty-six times the damage that plant derating does.** At +8degC the
thermal derate costs 1.2 points of availability; the demand uplift is nearly 10%. The
effect that dominates the popular account of heat and power systems - power stations
struggling in the heat - is the smaller half by a wide margin.

And the two do not simply add: together they produce 1.29 times the sum of the parts,
because a derated fleet meets a raised peak.

### what follows for adaptation spending

If heat is a material risk to South African adequacy, **the lever is cooling load, not plant
cooling**. Demand-side measures - efficiency standards for air conditioning, time-of-use
signals in summer, demand response contracted for hot evenings - address the channel doing
119 of the 157 GWh. Upgrading condensers addresses 2.6.

That is a testable claim rather than a preference, and it inverts where adaptation
attention usually goes.

### what is NOT modelled, stated plainly

Solar output derate and transmission line rating derate are **reported but not injected**,
because neither has a scenario lever in the engine. At +8degC they would remove a further
3.2% of solar output and 6.4% of line rating - both making the picture worse, so the
figures above are conservative.

Drought and cooling-water constraints are not modelled at all. Nor is the correlation
between heat and low wind, which is the mechanism behind most northern-hemisphere
heat-driven adequacy events.

---

## Marginal carbon: a renewable megawatt-hour in South Africa avoids more than the average

Every corporate emissions report uses AVERAGE carbon intensity - total emissions over total
generation. For a procurement decision that is the wrong number. Average asks how dirty the
grid is; **marginal asks what one more or one fewer kilowatt-hour actually causes.**

```
average intensity          834 gCO2/kWh
marginal intensity       1,026 gCO2/kWh mean, 1,040 median
hours with a clean margin   35 of 8,760

what sets the margin        coal 8,398 h  ·  diesel 327  ·  storage 30  ·  shortage 5
```

**Coal sets the margin in 96% of hours.** So a renewable megawatt-hour bought here displaces
coal at 1,040 g/kWh, not the average mix at 834 - and average-factor accounting
**undercredits South African renewable procurement by about 23%.**

### this inverts the usual worry about 24/7 matching

The standard concern on a coal-heavy grid is that buying clean power at night displaces
nothing, because the marginal unit is already clean. **Here there is almost no such hour** -
35 in the year. The concern is a northern-hemisphere one, imported into a system where it
does not apply.

### and it responds correctly to the build

```
clean-margin hours, today          35 of 8,760
clean-margin hours, 130 GW VRE  7,678 of 8,760
```

The undercrediting shrinks as the grid decarbonises, which is the right behaviour and the
reason this cannot be a fixed factor.

### why it is the right basis for CBAM

The EU's Carbon Border Adjustment Mechanism prices embedded emissions in imported steel,
aluminium and cement. An exporter claiming a figure below the grid average needs an hourly,
causal basis - which a marginal series is and an annual average is not.

CAVEAT, and it is important: storage and demand response are excluded from the margin
because they SHIFT emissions rather than cause them. Crediting them would double-count the
charging hour. That exclusion is a judgement, and a different convention would give a
different answer in the 30 hours where storage is marginal.

---

## Batteries are the most expensive way to relieve a corridor, per megawatt

Extending the non-wires comparison beyond transmission technologies to the two a
distribution utility actually controls.

```
Eastern Cape - KwaZulu-Natal, 167 km, 1,500 MW, 3,080 hours a year at limit

option                              per MW unlocked    versus line
dynamic line rating                        R0.033m        76x cheaper
topology optimisation                      R0.208m        12x cheaper
advanced power flow control                R0.300m         8x cheaper
new line                                   R2.55m                  -
demand response, 5% of rating              R2.500m         about equal
battery, 10% of rating, 4h                 R8.105m         3x DEARER
```

**A battery is three times more expensive per megawatt unlocked than building the line**,
and demand response is roughly a wash. Batteries as a non-wires alternative are widely
promoted; on this metric, for this purpose, they are the worst option on the list.

### the caveat that makes this fair

**Per megawatt unlocked is not the whole value of a battery.** It also arbitrages, provides
reserve, and can be moved when the constraint does. The comparison prices one service and a
battery sells several - so this understates it, and the right reading is that congestion
relief alone does not justify a battery, not that batteries are poor investments.

Two further asymmetries run the other way. A line lasts fifty years and a battery fifteen,
so a like-for-like annualisation would widen the gap. And a battery DEFERS rather than
removes a constraint: the deferral ends when load grows past it, while a line does not
expire.

---

## Stacking energy and reserve revenue overstates a battery by 1 to 6%

GridTwin computes arbitrage from the dispatch and ancillary revenue separately, from a rate
on capacity held. Nothing forces the two to agree, and a battery cannot discharge at full
power while holding that same power in reserve. `storage_coopt.js` co-optimises them in one
LP to size the error.

```
100 MW / 4h, a representative price week x 52

                                  R m/yr   MWh discharged   MW-h reserve
energy only                        102.8          103,990              0
energy + reserve, STACKED          122.5          103,990        873,600
energy + reserve, CO-OPTIMISED     119.7          103,990        767,530

stacking overstates revenue by 2.4%
```

### the battery gives up reserve, not energy

Discharge is IDENTICAL under both. The co-optimised battery holds 12% less reserve, in
exactly the hours it is discharging - because in those hours energy is worth more than
reserve, and it correctly sells the dearer product. **The error is entirely
over-claimed reserve.**

That is a more comfortable result than the alternative. If the stack had cost energy, every
arbitrage figure in the model would need revisiting; as it is, only the ancillary line is
affected.

### it matters most for short-duration batteries

```
duration    reserve R11.25/MW-h    R22.50    R45.00
1h                        4.7%       5.1%      5.6%
2h                        1.8%       2.4%      3.2%
4h                        1.5%       2.4%      3.8%
8h                        1.1%       2.0%      3.4%
```

A one-hour battery is overstated by 5%, an eight-hour one by 2%. Short-duration assets
spend a larger share of their hours at full power, so the conflict binds more often. The
error also rises with the reserve price, which is the expected direction and a reason to
re-test if South Africa ever prices ancillary services properly.

### so the model's revenue figures are defensible, with a caveat now quantified

At the durations South Africa is actually building - two to four hours - the overstatement
is 2 to 4%. That is smaller than the uncertainty on capex, and it does not change any
published finding. **But it is a real bias in one direction, and it should be stated
whenever a battery revenue figure is quoted rather than left implicit.**

CAVEAT: this is a PRICE-TAKER model. The battery is assumed too small to move prices, which
is right for a merchant asset and wrong for a system study. It answers what a battery can
earn, not what the system should build.

---

## The instant heuristic dispatches storage on state of charge, not on price

The instant path dispatches storage heuristically; the network-aware path co-optimises it in
an LP. How much does the approximation cost?

**This is the question that produced the withdrawn "37% of July gas" claim on 30 Aug**, so
the answer is measured and then attacked rather than reported.

### the clean observation, independent of any value judgement

```
1,800 MW / 7,200 MWh, the model's own hourly prices, 52 weeks

                    revenue    discharged    average price achieved
heuristic            R355m       473 GWh              R754/MWh
perfect foresight  R3,066m       497 GWh            R6,169/MWh
```

Both discharge almost the same ENERGY - 473 against 497 GWh. **The heuristic achieves
R754/MWh against a market median of R748 - a ratio of 1.01.**

CORRECTED 1 Sep 2026: an earlier version of this table gave R694/MWh. That figure was the
margin NET of the R60/MWh cycle cost, labelled as a price achieved. The substance is
unchanged and slightly strengthened - 1.01 times the median is closer to the average hour
than 0.93 would have been. It is discharging at roughly the average hour,
which means it is not targeting peaks at all. That is a clean, checkable statement and it
does not depend on believing any revenue figure.

### and a qualification this section originally lacked

**The heuristic is not trying to maximise revenue.** The dispatch order in the instant model
is deliberate and documented at the code: nuclear, hydro and imports are fixed infeeds, coal
is must-run within unit-commitment limits, **storage moves on state of charge**, and gas and
diesel are the flexible margin. It is a SYSTEM dispatch model serving net load, not a
merchant optimiser chasing price.

So "it is not targeting peaks" is factually right and was framed as though it were a
failing. It is not. Judging a system dispatcher by revenue capture measures it against an
objective it does not hold - the same category error as expecting a merit-order model to
reproduce Eskom's peaker running, which is recorded elsewhere in this file.

**What survives:** the instant path's storage timing should not be read as a merchant
signal, and any battery revenue figure taken from it understates what an optimising operator
would earn. That is a caveat on interpretation, not a defect in the model.

### the headline gap is also not trustworthy, and here is why

```
price cap        heuristic captures
uncapped                     10.7%
R6,300 (diesel)              13.6%
R2,000                       67.3%
```

Almost all of the apparent gap comes from hours priced above R2,000 - the diesel and
scarcity hours. **A 1,800 MW battery is not a price taker in a scarcity hour.** Discharging
into a shortage removes the shortage, so the R87,000 value of lost load does not survive its
own arrival. The LP is capturing value that the act of capturing destroys.

That is exactly the error that collapsed the 37% claim: an optimisation exploiting a price
signal that would not exist once it acted on it.

### two errors, running in opposite directions

**Flattering the heuristic:** its revenue here excludes charging cost, while the LP's
objective includes it. The true gap on that axis is larger than measured.

**Flattering the LP:** perfect foresight over a whole week, and the price-taker assumption
that fails in exactly the hours carrying the value.

### what can honestly be said

The heuristic is not targeting peaks, and a better one would capture more. **The size is
bounded below by roughly a third at a R2,000 cap and is not reliably measurable above it**,
because the model would have to re-price the system after each battery decision - which is
what the network-aware MIP already does.

So the useful conclusion is not a percentage. It is that **the co-optimised run is the
answer and the instant one is an approximation**, and any battery revenue figure quoted from
the instant path should say so.

---

## Every terawatt-hour of curtailed renewables is replaced by coal, almost exactly

South African IPPs report substantial curtailment with belated Eskom compensation, and
NERSA approved a 4% congestion ceiling in September 2025. What does using it cost, and who
pays?

```
ceiling   spilled TWh   coal TWh   CO2 Mt   R/MWh   IPP revenue lost
    0%           0.00      164.8    173.7   582.2            R0.00bn
    4%           0.77      165.6    174.5   585.2            R0.70bn
   10%           1.94      166.7    175.7   589.5            R1.79bn
   15%           2.90      167.6    176.6   593.2            R2.76bn
```

**The substitution is one for one.** Each terawatt-hour of spilled renewable output is
replaced by very close to a terawatt-hour of coal, and carries very close to one megatonne
of CO2 with it - which follows directly from an emission factor of 1.04 t/MWh, and is a
useful arithmetic check on the whole chain.

### how big is this against what IPPs are actually paid?

NTCSA states it administers approximately **R45 billion a year in payments to independent
power producers** (media statement, 1 September 2026).

```
ceiling   modelled revenue loss   share of total IPP payments
    4%              R0.70bn                          1.6%
   10%              R1.79bn                          4.0%
   15%              R2.76bn                          6.1%
```

A useful sanity check on the modelled figure, and a scale for the dispute: at the approved
ceiling this is one and a half per cent of the sector's revenue, concentrated on whichever
plants are curtailed rather than spread across all of them.

The same statement records **just under 3,000 curtailment claims processed in July and
August alone**, following elevated volumes in April and May. That is the administrative
footprint of the effect priced below.

### three parties, three different bills

At the approved 4% ceiling:

```
generators   R0.70bn a year of lost revenue, or about R910 per MWh spilled
consumers    system cost up R3.0/MWh, roughly half a per cent
the climate  +0.8 Mt CO2
```

**The generator bears the cost concentrated; the consumer bears it diffusely.** That
asymmetry is why curtailment compensation is contested: R0.70bn is material to a project
and R3/MWh is invisible on a bill.

### what this does NOT show

Not that the ceiling is being misused. It exists for genuine congestion, and our own
headroom data supports the case for it - the two best wind regions in the country have zero
connection headroom, so some spill is physical rather than discretionary.

**And the model does not represent dispatch PREFERENCE at all.** It dispatches on merit
order between Eskom and IPP plant, with no mechanism for an operator favouring its own
units when the system is in surplus. If that is happening, the numbers above are a floor:
they price the approved ceiling, not any use of it beyond what congestion requires.

Separating the two needs metered curtailment instructions by plant, which is not public.
That is the data request worth making rather than a modelling problem worth solving.

---

## Compressed air and gravity storage in mine shafts: the arithmetic first

Prompted by Hydrostor's Silver City project, 200 MW / 1,600 MWh in a cavern inside an
operating silver mine, cleared by AEMO on 2 September 2026. The obvious South African
question is whether our mine shafts make the same thing possible here.

Two separate questions, and they have different answers.

### as national storage, the existing finding already covers it

Compressed air is an energy-shifting asset like any other, so it faces the constraint the
iron-air test found. Added to a high-renewables build:

```
configuration      July gas GWh   annual gas TWh
no long-duration          2,409            28.40
+5 GW / 24h               2,409            28.20
+10 GW / 24h              2,409            28.04
```

**July does not move at all.** Ten gigawatts of 24-hour storage changes the winter month by
nothing to four significant figures, and annual gas by 1.3%. The winter deficit is an energy
shortage, not a shifting problem, and no duration fixes it. That result now covers
compressed air as well as iron-air and vanadium.

### gravity storage in a shaft is energy-poor, and the bound is decisive

```
mass        drop      energy
1,000 t   1,000 m     2.7 MWh
1,000 t   3,000 m     8.2 MWh
10,000 t  3,000 m    81.8 MWh
```

To match one Hydrostor project - 1,600 MWh - with a 3 km drop you must raise and lower
**195,719 tonnes**, about 25,000 cubic metres of steel, or roughly twenty-seven Eiffel
Towers. Mponeng, the deepest mine in the world, is about 4 km.

Power is not the problem: at 5 m/s that mass gives nearly 10 GW while it is moving. **Energy
is the problem**, and it is set by mass times height, which is why gravity storage keeps
being proposed and rarely built.

### the Broken Hill case is not a national storage case, and that is the useful part

Silver City replaces two 25 MW diesel generators at the end of a **260 km single line**,
with 50 MW / 250 MWh reserved for outage backup. The existing 50 MW battery could not do
it, having been configured unable to island.

That is local resilience on a constrained radial feed, not national adequacy. **South Africa
has that problem too**, and this model already identifies where: the corridor congestion
figures show Eastern Cape to KwaZulu-Natal at its limit 3,080 hours a year, and the two best
wind regions hold zero connection headroom.

So the question worth asking is not whether compressed air helps the national build - it
does not, on the evidence above - but **which South African points are radially fed,
peaker-backed and congested enough for the Broken Hill logic to apply.**

### that question is answerable, and the answer is short

Radiality is computable from the transmission line file: a substation with exactly one
connection is a radial endpoint. Of 172 substations in the existing network, **35 are
radial**.

Cross-referencing those against South Africa's open-cycle peaking fleet:

```
station      kV   supply area      peaker MW   fed from    radial?
Ankerlig    400   Western Cape         1,338   Koeberg     2 links
Gourikwa    400   Western Cape           740   Proteus     YES
Avon        275   KwaZulu-Natal          670   Impala      3 links
Dedisa      400   Eastern Cape           335   Poseidon    2 links
Acacia      400   Western Cape           171   Koeberg     3 links
```

**Gourikwa is the only peaker-backed radial endpoint in the network** - 740 MW of
open-cycle gas turbine at Mossel Bay, hanging off a single 400 kV connection to Proteus.
That is the Broken Hill shape: expensive liquid-fuelled backup at the end of a radial feed.

The other four peaking stations are all meshed with two or more connections, so the
resilience case that carried Silver City does not transfer to them.

### and the supply-area view agrees

```
supply area        corridors   total MVA   wind headroom
KwaZulu-Natal              2      15,600           5,500
Western Cape               2      10,000           1,180
Free State                 6      38,000           1,420
```

Only two supply areas are near-radial, and the Western Cape is one of them - the same
province as Gourikwa, on a corridor the model has at its limit 799 hours a year.

### what this does NOT establish

The model has no representation of islanding, so it cannot say whether Gourikwa's feed
actually fails, how often, or what an outage there would cost. Broken Hill's case rested on
a two-week blackout and an eight-hour one before it - lived events, not modelled risk.

Nor does it say compressed air is the right answer there rather than a battery configured to
island, which is what Broken Hill's existing battery could not do. **What the analysis
supports is a shortlist of one, and a reason to look at it.**

### what is asserted rather than modelled

Cavern integrity, shaft condition and geology are outside this model entirely. Hydrostor
excavates a purpose-built cavern with hydrostatic compensation rather than using a shaft as
found, which is a material distinction for any South African analogue: an abandoned gold
shaft is not a sealed pressure vessel.
