# GridTwin ZA - verified results

Findings fit to quote externally, each with the scenario that produced it. A
number without its scenario is not a result. Every entry states the weather year
and the period, because an annual figure and a July figure are not comparable.

Weather basis, settled 28 Aug 2026 after three attempts. Every result in this file is
now on ten real weather years, 2014-2023, except where a line says otherwise. Read this
before quoting anything.

The dashboard is NOT a synthetic or average year. `profiles.json` carries Eskom
hourly demand for 2025 and a metered wind series at 31.97% CF. The label
"synthetic-normal weather year" used in earlier versions of this file was simply
wrong.

Multi-year results are on ten MERRA-2 years, 2014-2023, capacity-weighted by
technology and bias-corrected to the metered basis. `weatherYearNational()`
previously weighted regions by demand share - Gauteng 31.5%, Northern Cape 1.4% -
when every megawatt of South African wind is in the Cape provinces and Hydra
Central. That produced wind capacity factors of 22.6-27.2%, below the 28-38% band
validate_benchmarks enforces, and no harness caught it because nothing exercised
the multi-year path. An intermediate version of this file reported gas figures ~35%
too high on that broken weighting. Those numbers are WITHDRAWN.

Verification that the current basis is right: 2023 through the multi-year path now
returns 31.97% wind CF, identical to the dashboard for the same year.

2022 IS THE design year, with 2015 close behind. Wind output 46.0 TWh against
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

THE GAP IS REAL. Seriti's 5,553 GWh sits above the worst of ten years. GridTwin
runs the retained Medupi and Kusile ON merit, generating 4,479 GWh in July; Seriti
scale thermal output to a fixed capacity share (~25%) and let gas fill the residual.
That modelling choice remains the leading explanation and IS worth putting to them.

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
run suggested. This IS THE strongest result IN this FILE.

They found the same direction on a five-point ERA5 composite. GridTwin finds it
on regional MERRA-2 profiles at capacity-weighted plant locations. Their
conclusion survives a more granular wind model. This IS THE strongest thing TO
lead with in any outreach.

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

Confirmed across TEN weather years, 28 Aug 2026. Adding 20 GW of 100-hour iron-air
to the Seriti scenario changes July gas by exactly zero in all ten years - not
approximately, not to three significant figures, but to the last digit printed in
every year from 2014 to 2023. July gas itself ranges 1,605 to 3,968 GWh across those
years, so the invariance is not an artefact of a quiet month.

The annual effect is consistent and small: gas falls by about 1.0 TWh in every year,
which is where the value of long-duration storage actually sits. It is a
shoulder-season and spring-curtailment technology, not a winter-drought one.


Their conclusion is that the deficit needs firm wind or seasonal STORAGE. Tested
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
changes July by nothing, to three significant figures. Iron-air alone makes it
worse. There is no surplus to store; the deficit is an energy shortage, not a
shifting problem. Seasonal storage does NOT solve IT either - a stronger claim
than Seriti's own.

Annual effect is real but happens in other months: gas 30.7 to 29.7 TWh,
curtailment to zero.

---

## Lithium duration: the wall, priced

Confirmed across TEN weather years, 28 Aug 2026. Going 4h to 10h cuts annual gas by
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

That is where the first single-year estimate landed too. The intermediate 130-140 GW
figure came from the broken weighting and is withdrawn. The agreement between the
first estimate and the corrected ten-year run is a coincidence of two errors
cancelling, not corroboration - the first was one favourable year, this is the worst
of ten. Cite this one.

THE price IS CURTAILMENT. At 50 GW wind / 60 GW solar the system throws away
75.7 TWh a year on the worst weather year. Building for the worst week and wasting
the output the rest of the year.

### costed, 28 Aug 2026 - and gas is NOT cheaper

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

Removing GAS IS cost-neutral AT THE right BUILD. 50 GW wind with 60 GW solar and no
gas at all costs R285 bn a year - the same as the 25 GW gas scenario, and marginally
cheaper per kWh at R1.36 against R1.37. The trade is R88 bn more capex against R87 bn
less fuel.

But it is only cost-neutral at ONE point on the frontier. Every other no-gas build
tested costs 4% to 12% more, and the wrong mix is expensive: 80 GW wind with 40 GW
solar costs R315 bn for the same job. So this is not "gas is unnecessary", it is
"there exists a build where gas is unnecessary and it is not the obvious one".

### THE frontier IS NOT buildable ON today'S grid

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

THE distribution IS THE POINT. The Eastern Cape, Western Cape, Northern Cape and Hydra
Central hold **100% of South Africa's existing wind capacity and 7.3% of the national
room to add more**. For solar those four regions have zero headroom between them. The
Northern Cape and Hydra Central - the two best resources in the country, at 37.9% and
42.5% capacity factor - are at zero for every technology.

So the R285 bn cost-neutral result is not wrong, it is conditional, and the condition
is not currently met. The R600/kW-yr transmission adder in the cost model is a generic
per-kW figure; it is not the cost of creating headroom in the Karoo specifically, which
is where it would have to be created. Treat R285 bn as a floor and the gap to gas as
understated by an amount this model cannot yet price.

What this does NOT mean: headroom is not fixed. It is what the grid can take today, and
the whole purpose of the Transmission Development Plan is to expand it. The finding is
about sequencing, not impossibility - a no-gas system is reachable at roughly the cost
of a gas one, but only after a transmission build that is itself the binding constraint
and is not costed here.

Also unpriced here: land, and the 75.7 TWh of curtailed energy has no compensation
mechanism in this model - under REIPPPP some of it would be paid for.

---

## Flexibilising the coal fleet does NOT improve adequacy

Confirmed across TEN weather years, 28 Aug 2026. It does NOT reverse in any year.
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

TEN years OUT OF TEN, and the effect is remarkably stable: +1,057 to +1,223 GWh,
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
wasting renewables. In a NO-GAS system it becomes an accidental virtue, because
the storage it fills is the only thing left to cover the drought. Flexible coal
backs down properly, generates 2.9 TWh less, and storage delivers 2 TWh less.

What IT IS NOT: the four-hour ramp-aware look-ahead was hypothesised as the cause
and TESTED. It is not. Sweeping `coalLookaheadH` from 2 to 48 hours changes the
flexible case by zero across the whole range, because at 100%/hr the ramp term
swamps the horizon and the floor collapses regardless. The horizon binds only in
the rigid case, where 4h to 12h improves unserved from 14,078 to 13,695 GWh, a
2.7% gain that saturates at 12 and does nothing anywhere else tested.

Scope: this effect appears only with no dispatchable backup at all. With Seriti's
25 GW of gas, flexibilisation makes no difference to adequacy. Flexibilisation is
a curtailment and emissions measure, not an adequacy one. State that caveat
whenever this result is quoted.

Capacity IS THE binding constraint, NOT ramp RATE. Retaining 20 GW of coal instead
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

Ancillary falls 64.8% between 0.5 and 10 GW. Revenue is flat to about 3.8 GW,
where the fleet's contribution first exceeds the reserve requirement (6% of a
32 GW peak = 1,920 MW). The existing fleet is 3,700 MW. The last point at which a
new battery earns the full ancillary rate.

Understates against ERCOT's ~90% because arbitrage is held flat in this model.

Requires `asReserveOn`. At defaults the panel shows a flat line and says so,
because South Africa prices no ancillary services today.

Recomputed 28 Aug 2026. The reserve requirement previously read a hardcoded
32,000 MW through `FIXED.peakMW`, which is not a key - it resolved to undefined
and fell through. It now reads the model's own peak (31,595 MW at default, and
46,193 MW at 50% demand growth, where the old code would still have said 32,000).
The ancillary fall moved 61.6% to 62.1% and the 10 GW figure R75,686 to R74,729.
The knee DID NOT move and the conclusion is unchanged - which is the reassuring
outcome, since a 1.3% input correction producing a large swing would have meant
something else was wrong.

RESERVE rebuilt 28 Aug 2026, and this section now reflects it. The requirement is
contingency + demand share + VRE share, resolved hourly:

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
  Gross        the uncertainty to be covered, driven by available VRE - dispatched
               Plus curtailed - because forecast error is a property of what a plant
               could have produced.
  VRE-provided curtailed plant can ramp back up, so it is an eligible upward-reserve
               provider. ERCOT, EirGrid and AEMO all permit this. Counted at 50% of
               curtailed output, since it must be fast, telemetered and controllable.
  NET          what storage and thermal actually compete for.

```
scenario              gross    VRE provides    NET   curtailment TWh
today, ~5 GW VRE      1,263               0   1,263        0.0
Seriti, 45 GW VRE     1,567               3   1,564        0.2
frontier, 110 GW      2,114           1,457     657      115.3
```

Revised 29 Aug 2026 after an audit found this panel had defined its OWN reserve
constants in parallel with the ones the unit commitment already used - 930 MW versus
794 MW for the same "largest single credible loss". Now consolidated onto the
commitment definition, which is older and better sourced. Levels drop ~30%; the shape
and the conclusion are unchanged.

### THE ancillary market FOR storage shrinks AS renewables grow

At 110 GW of wind and solar the gross requirement rises to 2,114 MW, as expected. But
curtailed renewables supply 1,457 MW of it, and the NET pot left for storage collapses
to 657 MW - smaller than today'S 1,263 MW, in a system more than twice the size.

This inverts the usual assumption that storage ancillary revenue grows with renewable
penetration. It grows only while curtailment stays low. Past the point where the system
routinely spills wind and solar, the spilled plant becomes the cheapest reserve provider
on the system and storage is competing against a near-zero-marginal-cost incumbent.

The turning point is curtailment, not capacity: the Seriti 45 GW case curtails only
0.2 TWh and the effect is invisible there. It appears between 45 and 110 GW.

What this does NOT SAY: whether South Africa will permit curtailed renewables to sell
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

THE only thing that matters IS whether curtailed VRE MAY sell RESERVE AT ALL. Bar it
and the pot grows from 1,263 to 2,114 MW, as intuition expects. Allow even a quarter of
curtailed output to qualify and the pot collapses to 743 MW, below today's. Everything
from 0.25 to 1.0 lands in a narrow band of 606-743 MW.

So the 0.5 assumption is not load-bearing. The finding is not sensitive to the
parameter; it is sensitive to a yes/no policy decision, and it flips at a very low
threshold.

Nor does it depend on the other two. Across a fourfold range of contingency size and a
fourfold range of the VRE reserve share, the pot at 110 GW is smaller than today's in
every single case.

That IS THE stronger version OF this result, and the one to put to a regulator: the
question is not "how much reserve will curtailed plant provide" but "will it be allowed
to provide any".

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

THE finding: the optimiser builds the most wind where the resource is WORST.
Mpumalanga takes 3.32 GW at a 25.5% capacity factor and KwaZulu-Natal 2.48 GW at
21.6%, while Hydra Central (42.5%) and the Northern Cape (37.9%) get NOTHING. The
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

Modest shifting WORKS. The evening peak falls from 31.60 to 29.23 GW, diesel halves
and CO2 falls. The optimum sits near 7.5%.

Past about 15% IT REVERSES. The shifted load builds a NEW peak in the valley it was
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

### cross-checked against NERSA'S OWN list, 30 Aug 2026

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

That confirms THE split already IN this file, from a regulator rather than from
inference. GridTwin produces or can produce every market cost. It produces none of the
NON-market costs, and should not try: they are allocation decisions, not modelling
outputs. The methodology's own framing - that the wholesale cost "extends beyond the
energy price in the day-ahead market" - is the sentence to quote when explaining why
`avgCost` is not a tariff.

TWO terms NERSA NAMES that THE EPP list DID NOT:

**System operation charges** and **market operator charges**. Neither is in GridTwin and
neither should be - they are institutional costs, not dispatch outcomes.

**Balancing costs.** This one IS a modelling quantity and GridTwin does not have it. The
model is hourly, so it has no intra-hour balancing product at all. In a market with
45 GW of wind and solar, balancing is not a rounding error. Worth knowing that the gap
is now named by the regulator rather than only by us.

A note ON risk, from the EIUG's submission on the Market Code: non-market charges risk
becoming "dumping grounds for unallocated costs". That is the strongest argument for the
disaggregation this project has been advocating - if the market costs are separately
published and checkable, whatever is left in the non-market bucket becomes visible.

---

Three produced, three modelled but switched off because South Africa does not price
them today, one partial, six absent.

What this means FOR ANY price CLAIM. GridTwin's `avgCost` is fuel plus carbon plus new
grid-connected capex, divided by grid-served energy. It is NOT a tariff and does not
try to be - the panel says so. Six of the thirteen components the policy enumerates are
simply not in it, and they are not small: legacy cost recovery and distribution charges
are a large part of what a South African customer actually pays.

THE TWO worth closing, in order.

Transmission is partial and the gap matters for the locational work. `txRPerKWyr` is a
flat R600/kW-yr adder on new wind and utility PV. That is a build cost, not a
use-of-system charge, and it is not locational - so the model prices the grid the same
way whether a plant connects into 5,500 MW of headroom in KwaZulu-Natal or into zero in
the Northern Cape. The corridor duals from the regional LP are the raw material for
fixing that, and they already exist.

Congestion is produced BUT NOT PRICED. The `txa_` shadow prices come out of every
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

Congestion IS rare AND CONCENTRATED. Nine binding rows out of 38,400 corridor
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

### THE duals ARE identical, AND that IS NOT AN error

Three corridors with different ratings - 2,377, 823 and 233 MW - carry the same shadow
price to the rand. Checked, because it looked like a mapping fault. It is structural:
the Western Cape is fed by exactly these three corridors, and in a transport model with
one balance per region, relaxing ANY ONE of them admits the same additional megawatt.
So the marginal value is the same on all three.

**consequence FOR pricing, and it is the whole point.** You cannot charge each corridor
its own dual and add them up - that triple-counts a single constraint. The economically
meaningful quantity is the rent on the western cape import boundary, not on any wire.
Any congestion charge built off these duals has to be defined on boundaries or on
cutsets, not on individual lines. That is a real design trap and it is invisible until
you look at which rows bind together.

### what this does AND does NOT support

It does NOT support a claim that South Africa's grid is congested in this scenario -
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

THE level WAS right, THE shape WAS NOT. TDP 2025-2034 is 14,500 km and 210 transformers
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

### THE headroom IS where THE cost IS LOW AND THE resource IS BAD

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

### THE rate NOW rises with build volume

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

```
wind GW  solar GW  batt GW   mean R/MWh   wind capture   solar capture   solar R/MWh   curt TWh
    4.6       3.3        0          755         100.2%           98.4%           743        0.0
   15        15          0          701          96.8%           91.9%           644        0.8
   20        25          0          544         100.6%           47.7%           260        9.9
   30        35          0          410         106.2%           14.5%            59       35.2
   50        60          0          215          95.9%            2.5%             5      113.5
```

**THE asymmetry IS THE FINDING.** Wind holds 96-106% of the mean price across the whole
range. Solar falls from 98% to 2.5%. At 50 GW of solar a merchant plant earns R5/MWh
against wind's R206 - not a discount, an evaporation.

The mechanism is coincidence. Every solar plant in the country produces in the same
hours, so adding solar drives the price toward zero in precisely the hours solar earns.
Wind output is diverse across sites and runs at night, so it keeps meeting hours when
something dispatchable is still setting the price. Zero-price hours go from none to
6,065 - 69% of the year - across this range.

### storage IS what protects solar'S revenue, and the effect is large

The rows above carry NO storage, which overstates the collapse. Scaling batteries
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

SO THE storage case IS NOT primarily about ADEQUACY. Elsewhere in this file storage
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

**AT 45 GW there IS A deficit BUT NO SURPLUS.** Annual curtailment is 0.2 TWh. A
seasonal store needs terawatt-hours of spare energy to fill it; there are 200 GWh in the
whole year, and the system is still running 50 TWh of coal. Perfect foresight would have
had nothing to charge with.

**AT 110 GW there IS AN enormous surplus BUT NO DEFICIT.** Curtailment is 100 TWh, and
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

So there IS cheap energy available all year. A 45%-efficient store charging at R690
delivers at about R1,533/MWh, against gas clearing near R1,968. **Long-duration
arbitrage against gas is in the money**, and the model was not doing it.

South Africa also curtails today at low penetration for network reasons - localised
Cape constraints - which a single-node national model cannot see at all. That is a real
limitation of this engine, not evidence that no surplus exists.

### TWO dispatch defects found, ONE FIXED

**FIXED - the charging horizon was 25 hours, fixed.** `anticipatedShortfall` summed the
next 25 hours to set the charge target. That is right for a 4-10 hour battery and
useless for a 100-hour store: one day's anticipated shortfall is trivial against 2 TWh,
so iron-air never saw a reason to fill. It now scales with the longest storage on the
system, capped at one week - beyond that perfect foresight does more work than the
storage does.

**NOT FIXED - efficiency merit order starves long-duration storage.** `tierCharge` fills
best round trip first: lithium 0.88, then vanadium 0.70, then iron-air 0.45. Lithium
empties every day, so it always has room, so it absorbs the cheap charging and iron-air
is never reached. Fixing the horizon changed July gas by nothing at all for exactly this
reason.

Efficiency-first is right for a single hour and wrong across a week: the correct rule
fills the long store when a long event is coming, even at worse round trip, because
lithium cannot hold energy that far. That is a real dispatch rewrite and has not been
attempted.

### THE rewrite WAS attempted, measured, AND reverted - 30 Aug 2026

Against how the literature says this should be done. Production cost models run one- to
two-day horizons to match day-ahead markets, which cannot capture a multi-day store's
inter-temporal value; published estimates put the cost of getting it wrong at 4-14% of
operational value and 14-34% of capacity credit. The recommended treatment is
opportunity-value dispatch - a reservation price per store reflecting expected future
scarcity - not an efficiency merit order.

TWO changes MADE. Per-tier lookahead horizons, so a 10-hour battery looks at tonight and
a 100-hour store at the coming week instead of both being asked about the next 25 hours.
And charging served in order of unmet need against those horizons, efficiency only as a
tie-break.

```
                              storage TWh    July gas GWh
efficiency order (before)            8.42            2742
unmet-need order (rewrite)           7.44            2810
```

IT made things worse, so it was reverted. Filling a 45%-efficient store ahead of an
88%-efficient one destroys more energy than the earlier availability recovers. **Unmet
need is not value.** The heuristic had no test of whether the arbitrage was worth making,
and ordering alone cannot express one.

What would actually work: charge a tier only when the current marginal cost is below its
expected discharge value times the round trip. That is a value function on state of
charge, which needs an LP rather than a merit order - the same reason PLEXOS and PyPSA
co-optimise storage across the horizon instead of ranking it.

### then THE price-taker gate - built, and it settles the question

The missing piece was an economic test. Two-pass price-taker: run once to get the hourly
marginal price, build a reservation price per tier from the 90th percentile over its own
forward horizon, then re-run charging a tier only when

```
    cost now  <  reservation price  x  round-trip efficiency
```

`simulateTwoPass()` in index.html. One extra simulate call, about 590 ms.

**THE gate says THE arbitrage IS IN THE MONEY.** In early July the reservation price is
R2,020/MWh. Iron-air at 45% needs 690 < 2020 x 0.45 = 909, which clears comfortably. So
charging a 100-hour store from R690 coal to displace R1,968 gas is worth doing, and the
model's failure to do more of it is not an economic judgement.

**BUT THE gate does NOT bind, so it changes nothing on its own.** Both tiers pass, so
gate-plus-ordering behaves exactly as ordering alone: July gas 2,742 -> 2,810 GWh with
20 GW of iron-air, and -> 2,832 with vanadium. Reverted a second time.

### WHY NO ordering heuristic CAN FIX this

The gate answers "is this trade worth making". The question that decides the megawatt is
comparative - is it worth more in the 45% store or the 88% one - and that depends on
whether the coming event is longer than the short store can cover, given both states of
charge. **That is a value function on state of charge, and a ranking cannot express
one.** Measured twice, not assumed.

Which is exactly why PLEXOS and PyPSA co-optimise storage across the horizon rather than
ranking it, and why the fix is a storage-only LP: take the non-storage dispatch as given
and let HiGHS optimise charge, discharge and SOC across all 8,760 hours. About 50,000
variables for three tiers - small against the LPs this project already solves - and the
dual on the SOC constraint IS the opportunity value, an output no South African study
currently publishes.

Kept: the per-tier horizons and the price-taker gate, both correct on their own merits
and both neutral in these scenarios. The gate will bind where prices are lower - it is
inert here only because July scarcity makes every trade worthwhile.
Reverted: the ordering, twice.

Perfect foresight caveat: pass two sees pass one's realised prices. A real operator
forecasts. Anything from this path is an upper bound on long-duration storage value.

### THE storage LP, built AND solved - and it settles both questions

`storage_lp.js`. Price-taker formulation: charge, discharge and state of charge as
decision variables across all 8,760 hours, SOC balance as a constraint, cyclic so no
free energy, objective to buy cheap and sell dear against the marginal price series
from a prior dispatch. This is what PLEXOS and PyPSA do.

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

**THE iron-AIR result survives THE fair TEST.** Given perfect foresight, an LP, and no
merit order to starve it, a 20 GW / 2 TWh iron-air fleet displaces **18 GWh of July gas
out of 2,742**. It does fill - peak state of charge reaches 941,568 MWh, 47% of capacity,
which the heuristic never approached - so this is no longer a dispatch artefact. The 45%
round trip is simply punishing enough that the energy is better left in coal. The
provisional flag is removed: "long-duration storage does not solve a winter wind drought"
now holds under an optimal dispatch, not just a heuristic one.

**~~THE heuristic MAY BE under-using lithium~~ - withdrawn 30 Aug 2026, see below.** The LP finds 995 GWh of July gas that lithium could displace and the
heuristic does not, which would be 37% of July gas by the technology actually deployed.
Imposing that schedule DID NOT reproduce THE saving - the fixed-point test returned July
gas of 2,751-2,816 against the heuristic's 2,742. The claim is UNVERIFIED. Full account
in "FIXED-point iteration" below.

Caveats, and they matter for how the 37% is read:
- perfect FORESIGHT. The LP sees the whole year; a real operator forecasts. Upper BOUND.
- price-TAKER. The objective uses a FIXED marginal price series and does not re-clear
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

### rolling horizon — and a result that must NOT be read as it looks

A full-year solve sees every hour before deciding anything; no operator does. Production
cost models solve a window, step forward and carry SOC. Both now run.

```
                                July displacement    annual discharge   solve
perfect foresight, full year      1,013 GWh (36.9%)        12.42 TWh    3.0 s
rolling 168 h window, 24 h step   1,032 GWh (37.6%)        11.26 TWh    6.8 s (365 solves)
rolling 336 h window, 48 h step   1,100 GWh (40.1%)        11.66 TWh    6.0 s (183 solves)
```

**limited foresight appeared TO beat perfect foresight ON JULY. Resolved - it was the
crude end-of-window floor, replaced with a terminal value function; all three runs now
agree at 36.5%. The original diagnosis below was only half right.** That
combination is impossible for the quantity being optimised, and the explanation is that
July displacement is NOT the objective. The LP maximises arbitrage value across the whole
year. Perfect foresight spends storage wherever the price spread is best, which is not
necessarily July; the myopic runs cannot see those better opportunities and serve July
more or less by accident. Annual discharge - closer to the actual objective - behaves
correctly: 12.42 TWh with foresight against 11.26 and 11.66 without.

SO DO NOT quote THE rolling july figures AS AN IMPROVEMENT. The honest reading is that
the 37% is robust to foresight assumptions, which is the useful conclusion, and that
comparing runs on a metric neither is optimising invites exactly this error.

### THE five gaps, addressed 30 Aug 2026 — four closed, one cannot be

**1. Terminal value function, replacing the crude end-of-window floor. Closed, AND IT
FIXED THE PARADOX.** Each rolling window now values energy left in the store at the
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

**2. Self-DISCHARGE. CLOSED.** SOC carries a per-hour loss: 0.004%/h lithium,
0.05%/h iron-air. Immaterial for a 10-hour battery, about 5% over a full 100-hour
iron-air cycle. Estimates, not sourced - no South African source gives them, and they are
flagged in the code rather than promoted to `FIXED`.

**3. Cycle-life COST. CLOSED.** R250/MWh of throughput for lithium, R50 for iron-air,
standing in for degradation. It stops the LP cycling for a one-rand spread. It also lets
the model express something it previously could not: vanadium's electrolyte does not
degrade, which is a genuine commercial advantage.

Visible in the duals, which are no longer pinned to the scarcity ceiling:

```
tier      mean      p50      p90      max      R/MWh
li        1,563    1,769    1,771    1,774
fe        1,925    1,969    2,025    2,133
```

**4. RESERVE CO-optimised against ARBITRAGE. Closed** (opt-in, `--reserve`). Power sold
as reserve cannot also discharge, and energy behind it cannot be spent. Until now the
model let a battery sell both at once, which overstates storage revenue.

```
                      iron-air discharge   peak SOC MWh   July contribution
without reserve             1.44 TWh          941,568         18 GWh
with reserve                0.77 TWh          242,264          7 GWh
```

**iron-AIR'S energy role halves once IT must also hold RESERVE**, and its peak state of
charge falls by three quarters. Its opportunity value rises correspondingly - p90 from
2,025 to 2,377 - because the energy is scarcer. July displacement is unchanged at 36.5%,
so lithium absorbs the difference.

**5. FIXED-point ITERATION. RUN, AND IT does NOT converge - which is the finding.**

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

### AND IT puts THE 37% IN doubt - read this before quoting it

Every iterated July figure (2,751-2,816 GWh) is at or above the heuristic's 2,742. The
LP predicted 1,000 GWh of displacement. **Imposing the schedule did not deliver it.**

TWO explanations, and they are not equally flattering:

1. The price-taker objective is arbitrage value, not gas displacement. Discharging in an
   hour when gas was running is counted as displacing gas, but the real dispatch
   re-optimises around the schedule and the gas returns elsewhere. If so, the 37% was
   never a gas saving - it was a bookkeeping artefact.
2. MY test IS ONE-SIDED. `_forcedDischargeMW` is a CAP, deliberately, so no infeasible
   state can be forced in. But that means where the LP wants more discharge than the
   heuristic gives, the cap cannot deliver it. Storage throughput fell, 8.42 -> 7.91 TWh,
   which is the signature of a binding cap rather than a better schedule.

### THE TWO-sided test, attempted - AND WHY I stopped

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

**BUT THE test IS still ONE-sided, AND I should NOT present THE clipping AS A VERDICT.**
Discharge was overridden; charging was not. The store is still filled by the heuristic,
so it cannot possibly discharge to the LP's plan - the clipping largely measures my own
incomplete override, not the schedule's infeasibility.

### retire THE 37%, DO NOT chase IT

Three rounds of testing have each revealed another layer, and the direction of travel is
consistent: every time the schedule is brought closer to the real engine, the predicted
saving fails to appear. Combined with the fact that the LP's objective is arbitrage value
rather than gas displacement, the reasonable conclusion is that **the 37% was an
accounting artefact of the price-taker formulation** and is not a real dispatch gap.

What would settle IT properly is storage inside the unit commitment - the thing a
price-taker LP is defined not to do. That is a genuine model rebuild, and it should be
justified by something better than chasing a number that has failed three tests.

**DO NOT repeat "the heuristic leaves 37% of July gas on the table".** It is withdrawn.
What survives is everything the LP established that did NOT depend on that accounting:
the opportunity-value duals, the iron-air result, and the reserve-versus-arbitrage
trade-off.

**6. CO-optimisation with unit COMMITMENT. NOT closed, AND NOT closeable HERE.** A
price-taker LP takes prices as GIVEN. Genuine co-optimisation means storage inside the
commitment problem, which is a different and much larger model - that is the difference
between this and PLEXOS. The available partial answer is a fixed-point iteration: re-run
the dispatch with the LP's schedule, take the new prices, re-solve, repeat. Worth doing;
not done.

Next: the 37% is large enough to justify embedding the LP in the engine rather than
leaving it as a probe. The dual on the SOC balance is the opportunity value - the number
the two-pass gate was approximating - and no South African study publishes it.

**~~SO THE headline result IS NOW PROVISIONAL.~~ resolved - see above.** "Iron-air changes July gas by exactly
zero in all ten years" was measured on a dispatch that structurally cannot charge it.
The finding may survive - the efficiency penalty is severe and the July deficit is large
- but it has not been tested against a dispatch that gives long-duration storage a fair
chance. Do not repeat the claim externally until it has.

### what A seasonal lookahead would AND would NOT FIX

The dispatch has NO lookahead of any kind. Tiers are sorted by round-trip efficiency, so
iron-air at 45% charges last and discharges last, purely on whether this hour has a
surplus or a deficit. It cannot deliberately hold energy for a future event.

But adding foresight would not change either row above, because in one there is nothing
to store and in the other nothing to serve. **The untested case is in between** - roughly
60 to 80 GW of VRE, where curtailment has begun but the drought is not yet covered. That
is where a seasonal lookahead could bite, and it has not been run.

### AND iron-AIR IS NOT A seasonal technology anyway

100 hours is about four DAYS. Form Energy markets it as multi-day storage, sized for
extended weather events, not for shifting summer into winter. Seasonal shifting needs
thousands of hours - large-reservoir pumped hydro, hydrogen, or thermal.

The 45% round trip compounds it: charging in summer to discharge in winter throws away
55% of the energy on the way. At 20 GW / 2 TWh, absorbing even 2.2 TWh of a 100 TWh
surplus takes the whole fleet through several cycles. Capacity is the binding limit at
that scale, not dispatch intelligence.

So the honest position: the model does not give seasonal operation a fair test, and
should say so - but in the scenarios examined the conditions for it do not arise, and
iron-air is the wrong technology to test it with.