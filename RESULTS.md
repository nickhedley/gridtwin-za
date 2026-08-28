# GridTwin ZA - verified results

Findings fit to quote externally, each with the scenario that produced it. A
number without its scenario is not a result. Every entry states the weather year
and the period, because an annual figure and a July figure are not comparable.

WEATHER BASIS, settled 28 Aug 2026 after THREE attempts. Read this before quoting
anything.

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

STILL ONE SYNTHETIC YEAR. The DIRECTION is safe - storage cannot fill a deficit
when there is no surplus to store, and that does not change with weather. The
absolute GWh below are understated by roughly a third; re-run on 2022 before
quoting any number here.


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

STILL ONE SYNTHETIC YEAR. Gas figures understated by ~35%. The SHAPE - gas falls
1.7% while capex rises 37% between 4h and 10h - is a ratio and survives; the levels
do not.


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
94.7 TWh a year, more than 40% of demand. Building for the worst week and wasting
the output the rest of the year. Gas is almost certainly cheaper - but that
comparison needs the storage capex fix first.

---

## Flexibilising the coal fleet does NOT improve adequacy

STILL ONE SYNTHETIC YEAR. Re-run across ten years before this is quoted anywhere:
the effect is 1,128 GWh on a base that moves by 4,600 GWh between weather years, so
it is well inside the weather spread and could plausibly reverse in some years.
THIS IS THE WEAKEST RESULT IN THIS FILE.


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
4   GW            186,822              293,887
6   GW            124,548              231,613
8   GW             93,411              200,476
10  GW             74,729              181,794
```

Ancillary falls 62.1% between 0.5 and 10 GW. Revenue is FLAT to about 3.8 GW,
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

CAVEAT ON THE WHOLE PANEL: reserve is sized as a flat share of annual peak
(`sysReserveShare` 0.06, calibrated to Eskom's ~2,200 MW). Professional practice
sizes it as the largest single contingency plus a VRE-scaled component, resolved
hourly. The current form is BLIND TO RENEWABLE BUILD, so under a large build it
understates how much the reserve pot grows and biases the knee EARLIER. Do not
quote the knee for a high-VRE scenario until that is rebuilt.

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
