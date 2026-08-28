# GridTwin ZA - verified results

Findings fit to quote externally, each with the scenario that produced it. A
number without its scenario is not a result. Every entry states the weather year
and the period, because an annual figure and a July figure are not comparable.

WEATHER BASIS, settled 28 Aug 2026 after THREE attempts. EVERY result in this file is
now on ten real weather years, 2014-2023, except where a line says otherwise. Read this
before quoting anything.

The dashboard is NOT a synthetic or average year. `profiles.json` carries Eskom
hourly demand for 2025 and a METERED wind series at 31.97% CF. The label
"synthetic-normal weather year" used in earlier versions of this file was simply
wrong.

Multi-year results are on ten MERRA-2 years, 2014-2023, capacity-weighted by
technology and bias-corrected to the metered basis. `weatherYearNational()`
previously weighted regions by DEMAND share - Gauteng 31.5%, Northern Cape 1.4% -
when every megawatt of South African wind is in the Cape provinces and Hydra
Central. That produced wind capacity factors of 22.6-27.2%, below the 28-38% band
validate_benchmarks enforces, and no harness caught it because nothing exercised
the multi-year path. An intermediate version of this file reported gas figures ~35%
too high on that broken weighting. Those numbers are WITHDRAWN.

Verification that the current basis is right: 2023 through the multi-year path now
returns 31.97% wind CF, identical to the dashboard for the same year.

2022 IS THE DESIGN YEAR, with 2015 close behind. Wind output 46.0 TWh against
53.7 TWh in 2023 - a 17% spread. Quote the WORST year for anything that sizes
capacity and the RANGE for anything else.

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

### Peak gas is ROBUST across a decade

```
                       min     mean      max     Seriti
peak gas, July        18.5     19.5     20.6     18 GW
```

Range of 2.1 GW across a decade, so the number that sizes the backup fleet is not
very sensitive to which year you pick. Their 18 GW sits just BELOW the ten-year
minimum, which is what a single-year study should be expected to do.

### Gas ENERGY: the earlier gap was mostly my synthetic profile

```
July gas GWh      min 1,605   mean 2,755   max 3,968 (2015)   Seriti 5,553
annual gas TWh    min  31.1   mean  33.4   max  38.2 (2022)
dashboard 2023          2,761 GWh July - almost exactly the ten-year mean
```

THE GAP IS REAL. Seriti's 5,553 GWh sits ABOVE the worst of ten years. GridTwin
runs the retained Medupi and Kusile ON MERIT, generating 4,479 GWh in July; Seriti
scale thermal output to a fixed capacity share (~25%) and let gas fill the residual.
That modelling choice remains the leading explanation and IS worth putting to them.

An intermediate version of this file said the opposite - that the gap was an
artefact and the coal explanation should be dropped. That was the broken weighting.
2023's July gas is 2,761 GWh, within 2% of the ten-year mean, so the dashboard year
is not flattering on this measure even though it is the best WIND year.

### Their wind-heavy sensitivity replicates, and more strongly

At equal 45 GW total, no gas, across ten weather years:

```
                unserved GWh:   worst      mean       best
20 GW W / 25 S                 19,664    16,822     15,542
25 GW W / 20 S                 16,792    13,960     12,566
```

Wind-heavy wins in EVERY year, by 15 to 19%. 2022 is worst for both. The direction
holds across a decade of real weather, and the margin is WIDER than the single-year
run suggested. THIS IS THE STRONGEST RESULT IN THIS FILE.

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

## Long-duration storage does not solve a winter wind drought

CONFIRMED ACROSS TEN WEATHER YEARS, 28 Aug 2026. Adding 20 GW of 100-hour iron-air
to the Seriti scenario changes July gas by EXACTLY ZERO in all ten years - not
approximately, not to three significant figures, but to the last digit printed in
every year from 2014 to 2023. July gas itself ranges 1,605 to 3,968 GWh across those
years, so the invariance is not an artefact of a quiet month.

The annual effect is consistent and small: gas falls by about 1.0 TWh in every year,
which is where the value of long-duration storage actually sits. It is a
shoulder-season and spring-curtailment technology, not a winter-drought one.


Their conclusion is that the deficit needs firm wind or SEASONAL STORAGE. Tested
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

PRICED 28 Aug 2026. Before that, vanadium, iron-air and pumped storage were ABSENT
from `newCapexR`, so this table showed all six rows at R166bn and iron-air appeared
to LOWER average cost. It does the opposite. Twenty gigawatts of iron-air adds
R259bn and takes average cost from R1.30 to R2.54/kWh - nearly double - to buy a
3% annual gas reduction and NOTHING in July. On price it is the worst option here.

Twenty gigawatts of 100-hour iron-air is two TERAWATT-hours of storage and it
changes July by NOTHING, to three significant figures. Iron-air alone makes it
worse. There is no surplus to store; the deficit is an energy shortage, not a
shifting problem. SEASONAL STORAGE DOES NOT SOLVE IT EITHER - a stronger claim
than Seriti's own.

Annual effect is real but happens in other months: gas 30.7 to 29.7 TWh,
curtailment to zero.

---

## Lithium duration: the wall, priced

CONFIRMED ACROSS TEN WEATHER YEARS, 28 Aug 2026. Going 4h to 10h cuts annual gas by
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

CONSISTENCY CHECK, unplanned: 20 GW at 10h gives 30.735891678 TWh, IDENTICAL to
50 GW at 4h. Same stored energy, same answer, two routes.

The capex column is lithium only because this scenario builds only lithium.
Vanadium, iron-air and pumped storage are now in `newCapexR` as well (28 Aug 2026);
before that they were absent and showed as free.

---

## The no-gas frontier

Seriti scenario with `newCcgtMW: 0`, 10 GW coal flexibilised, 20 GW / 10h storage.
Unserved energy, GWh/yr:

WORST of ten weather years - the number that sizes a system:

```
wind\solar     25 GW     40 GW     60 GW     80 GW
   20 GW       19,664     9,289     1,311       298
   40 GW        4,294       899        77         0
   50 GW        1,606       262        21         0
   60 GW          516       134         0         0
   70 GW          233        51         0         0
   80 GW          107        12         0         0
```

On the worst year the frontier runs 40W/80S through 60W/60S to 80W/40S-ish. So
roughly 110 to 120 GW combined, against Seriti's 45 GW - about two and a half
times the build.

That is where the FIRST single-year estimate landed too. The intermediate 130-140 GW
figure came from the broken weighting and is withdrawn. The agreement between the
first estimate and the corrected ten-year run is a coincidence of two errors
cancelling, not corroboration - the first was one favourable year, this is the worst
of ten. Cite this one.

THE PRICE IS CURTAILMENT. At 50 GW wind / 60 GW solar the system throws away
75.7 TWh a year on the worst weather year. Building for the worst week and wasting
the output the rest of the year.

### COSTED, 28 Aug 2026 - and gas is NOT cheaper

An earlier version of this file said "gas is almost certainly cheaper, but that
comparison needs the storage capex fix first". The fix is in. The claim was wrong.

Worst weather year (2022), annual costs in R bn. Capex is annualised and INCLUDES
grid expansion at R600/kW-yr on new wind and utility PV - about R66 bn a year in the
110 GW cases, so the transmission build to connect it is not being hidden.

```
scenario                        GW W+S  unserved  curt TWh  capex  fuel  carbon  TOTAL  R/kWh
Seriti as published, 25 GW gas      45         0       0.0    166   116       3    285   1.37
no gas, same build                  45    19,664       0.0    135   135       3    293   1.60
no gas, 40W/80S                    120         0      92.3    264    31       2    297   1.41
no gas, 50W/60S                    110         0      75.7    254    29       2    285   1.36
no gas, 60W/60S                    120         0      96.4    276    28       2    305   1.46
no gas, 80W/40S                    120         0     101.8    288    25       1    315   1.51
no gas, 50W/80S                    130         0     112.5    287    29       2    318   1.51
```

REMOVING GAS IS COST-NEUTRAL AT THE RIGHT BUILD. 50 GW wind with 60 GW solar and no
gas at all costs R285 bn a year - the SAME as the 25 GW gas scenario, and marginally
cheaper per kWh at R1.36 against R1.37. The trade is R88 bn more capex against R87 bn
less fuel.

But it is only cost-neutral at ONE point on the frontier. Every other no-gas build
tested costs 4% to 12% more, and the wrong mix is expensive: 80 GW wind with 40 GW
solar costs R315 bn for the same job. So this is not "gas is unnecessary", it is
"there exists a build where gas is unnecessary and it is not the obvious one".

### THE FRONTIER IS NOT BUILDABLE ON TODAY'S GRID

Checked 28 Aug 2026, and this is the finding that governs everything above.

The costing uses the NATIONAL dispatch model, which has no network. Against
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
TOTAL               21,520    19,940
```

The 50W/60S frontier needs 45,388 MW of new wind and 56,729 MW of new solar. Available
headroom is 21,520 and 19,940. **Shortfall: 23,868 MW of wind and 36,789 MW of solar -
about 61 GW of connections that do not exist.**

THE DISTRIBUTION IS THE POINT. The Eastern Cape, Western Cape, Northern Cape and Hydra
Central hold **100% of South Africa's existing wind capacity and 7.3% of the national
room to add more**. For solar those four regions have ZERO headroom between them. The
Northern Cape and Hydra Central - the two best resources in the country, at 37.9% and
42.5% capacity factor - are at zero for every technology.

So the R285 bn cost-neutral result is not wrong, it is CONDITIONAL, and the condition
is not currently met. The R600/kW-yr transmission adder in the cost model is a generic
per-kW figure; it is not the cost of creating headroom in the Karoo specifically, which
is where it would have to be created. Treat R285 bn as a FLOOR and the gap to gas as
understated by an amount this model cannot yet price.

WHAT THIS DOES NOT MEAN: headroom is not fixed. It is what the grid can take TODAY, and
the whole purpose of the Transmission Development Plan is to expand it. The finding is
about sequencing, not impossibility - a no-gas system is reachable at roughly the cost
of a gas one, but only after a transmission build that is itself the binding constraint
and is not costed here.

Also unpriced here: land, and the 75.7 TWh of curtailed energy has no compensation
mechanism in this model - under REIPPPP some of it would be paid for.

---

## Flexibilising the coal fleet does NOT improve adequacy

CONFIRMED ACROSS TEN WEATHER YEARS, 28 Aug 2026. It does NOT reverse in any year.
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

TEN YEARS OUT OF TEN, and the effect is remarkably STABLE: +1,057 to +1,223 GWh,
a range of 166 GWh, while the underlying unserved energy moves by 4,200 GWh between
best and worst year. So the flexibilisation penalty is nearly INDEPENDENT of weather,
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

## Battery saturation in South Africa

Weather-independent: driven by the reserve requirement and fleet size, not by wind
or solar output. But see the reserve caveat at the end of this section.


The country sits almost exactly at the knee.

```
fleet      ancillary R/MW/yr      total R/MW/yr
0.5 GW            197,100              304,165
3   GW            197,100              304,165
4   GW            173,262              280,327
6   GW            115,508              222,573
8   GW             86,631              193,696
10  GW             69,305              176,369
```

Ancillary falls 64.8% between 0.5 and 10 GW. Revenue is FLAT to about 3.8 GW,
where the fleet's contribution first exceeds the reserve requirement (6% of a
32 GW peak = 1,920 MW). The existing fleet is 3,700 MW. The last point at which a
new battery earns the full ancillary rate.

Understates against ERCOT's ~90% because arbitrage is held flat in this model.

REQUIRES `asReserveOn`. At defaults the panel shows a flat line and says so,
because South Africa prices no ancillary services today.

RECOMPUTED 28 Aug 2026. The reserve requirement previously read a hardcoded
32,000 MW through `FIXED.peakMW`, which is not a key - it resolved to undefined
and fell through. It now reads the model's own peak (31,595 MW at default, and
46,193 MW at 50% demand growth, where the old code would still have said 32,000).
The ancillary fall moved 61.6% to 62.1% and the 10 GW figure R75,686 to R74,729.
The KNEE DID NOT MOVE and the conclusion is unchanged - which is the reassuring
outcome, since a 1.3% input correction producing a large swing would have meant
something else was wrong.

RESERVE REBUILT 28 Aug 2026, and this section now reflects it. The requirement is
contingency + demand share + VRE share, resolved hourly:

```
scenario                  mean MW   max MW
today, ~5 GW VRE            1,768     2,062
Seriti, 45 GW VRE           2,272     3,916
frontier, 110 GW VRE        2,438     3,465
```

So the reserve pot GROWS with renewable build - 29% larger under the Seriti scenario
than today - which the old flat-share-of-peak version could not show at all. The knee
moves out slightly as a result, and the ancillary fall deepens from 62.1% to 64.8%.

South Africa's 3,700 MW fleet still sits just below the knee. That conclusion has now
survived three separate corrections to how the reserve is computed, which is the main
reason to trust it.

CORRECTED 28 Aug 2026, and the correction produced the most important storage finding
in this file.

The requirement is now split into three, as professional practice does:
  GROSS        the uncertainty to be covered, driven by AVAILABLE VRE - dispatched
               PLUS curtailed - because forecast error is a property of what a plant
               could have produced.
  VRE-PROVIDED curtailed plant can ramp back up, so it is an eligible upward-reserve
               provider. ERCOT, EirGrid and AEMO all permit this. Counted at 50% of
               curtailed output, since it must be fast, telemetered and controllable.
  NET          what storage and thermal actually compete for.

```
scenario              gross    VRE provides    NET   curtailment TWh
today, ~5 GW VRE      1,768               0   1,768        0.0
Seriti, 45 GW VRE     2,273               4   2,268        0.2
frontier, 110 GW      3,096           2,098     998      115.3
```

### THE ANCILLARY MARKET FOR STORAGE SHRINKS AS RENEWABLES GROW

At 110 GW of wind and solar the gross requirement rises to 3,096 MW, as expected. But
curtailed renewables supply 2,098 MW of it, and the NET pot left for storage collapses
to 998 MW - SMALLER THAN TODAY'S 1,768 MW, in a system more than twice the size.

This inverts the usual assumption that storage ancillary revenue grows with renewable
penetration. It grows only while curtailment stays low. Past the point where the system
routinely spills wind and solar, the spilled plant becomes the cheapest reserve provider
on the system and storage is competing against a near-zero-marginal-cost incumbent.

The turning point is curtailment, not capacity: the Seriti 45 GW case curtails only
0.2 TWh and the effect is invisible there. It appears between 45 and 110 GW.

WHAT THIS DOES NOT SAY: whether South Africa will permit curtailed renewables to sell
reserve. That is a market-design decision, not a physical one, and it is exactly the
kind of thing the Revised Electricity Pricing Policy is deciding now. If the answer is
yes, the storage business case at high penetration is materially worse than any
published South African analysis assumes.

The shares (0.03 of load, 0.05 of available VRE, 50% of curtailed VRE counting as a
provider) are the uncertain part. The structure now follows practice.

---

## Locational transmission signal, measured

Directly relevant to the Revised Electricity Pricing Policy (Gazette 55257,
28 Aug 2026). Policy Position 20 instructs the transmission licence holder, DEE and
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

THE FINDING: the optimiser builds the MOST wind where the resource is WORST.
Mpumalanga takes 3.32 GW at a 25.5% capacity factor and KwaZulu-Natal 2.48 GW at
21.6%, while Hydra Central (42.5%) and the Northern Cape (37.9%) get NOTHING. The
Eastern Cape stops at 0.40 GW.

The reason is in the second column. Headroom binds hardest in exactly the regions
with the best wind - Eastern Cape, Hydra Central, Western Cape, Northern Cape - and
does not bind at all in Limpopo, Gauteng and KwaZulu-Natal. Connection capacity, not
wind speed, is deciding where the fleet goes.

That is the locational signal the policy asks to be quantified, and it is large:
roughly a fiftyfold spread between the most and least constrained regions.

UNITS CAVEAT: these are sums of hourly duals over the full LP horizon, so treat them
as a RANKING and a relative magnitude, not as a R/MW tariff. Converting them into a
charge would need the horizon normalised and the socialised portion separated, which
is the design question Policy Position 20 leaves open.

CAVEAT: one build scenario, default settings, single weather year. The ranking is
driven by the headroom data in `nodal/headroom_summary.json`, so it inherits whatever
that file gets wrong. Re-run across weather years before quoting externally.

---

## Demand response has an optimum, and past it makes things worse

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

MODEST SHIFTING WORKS. The evening peak falls from 31.60 to 29.23 GW, diesel halves
and CO2 falls. The optimum sits near 7.5%.

PAST ABOUT 15% IT REVERSES. The shifted load builds a NEW peak in the valley it was
moved into: peak rises again to 29.56 GW, coal goes from 161.46 to 161.84 TWh, diesel
from 0.005 to 0.118, and curtailment appears for the first time. At 30% the system
costs MORE than with no demand response at all - R574.74/MWh against R570.46.

This is the classic rebound peak, and it matters because demand response is usually
treated as monotonically beneficial in South African discussion. It is not: it is a
peak-shaving tool with a saturation point, and the point is closer than most
programme targets assume.

MECHANISM CHECKED, not inferred. The cost curve is driven by FUEL, not by the demand
response charge - `drCostR` stays near zero across the whole sweep. So this is a
dispatch effect, not a cost of procuring the response.

The same shape appears in `vppGeyserPoolMW`, minimum near 6 GW of controllable pool
and worse than nothing by 12 GW.

CAVEAT: one weather year, dashboard scenario, and the shifting logic is a simple
within-day reallocation. The DIRECTION and the existence of an optimum are robust;
the 7.5% figure is not a target.
