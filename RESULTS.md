# GridTwin ZA - verified results

Findings fit to quote externally, each with the scenario that produced it. A
number without its scenario is not a result. Every entry states the weather year
and the period, because an annual figure and a July figure are not comparable.

CAVEAT ON EVERYTHING BELOW: all of it is ONE synthetic-normal weather year. The
ten-year run is outstanding and will move these, probably outward, because a bad
wind year is exactly what sets a capacity requirement.

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

## Long-duration storage does not solve a winter wind drought

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
shifting problem. SEASONAL STORAGE DOES NOT SOLVE IT EITHER - a stronger claim
than Seriti's own.

Annual effect is real but happens in other months: gas 30.7 to 29.7 TWh,
curtailment to zero.

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

Seriti scenario with `newCcgtMW: 0`, 10 GW coal flexibilised, 20 GW / 10h storage.
Unserved energy, GWh/yr:

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

The frontier runs 40W/80S through 50W/60S to 70W/40S. So roughly 110 to 120 GW
combined, against Seriti's 45 GW. Two and a half times the build to remove the gas.

THE PRICE IS CURTAILMENT. At 50 GW wind / 60 GW solar the system throws away
94.7 TWh a year, more than 40% of demand. Building for the worst week and wasting
the output the rest of the year. Gas is almost certainly cheaper - but that
comparison needs the storage capex fix first.

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

## Battery saturation in South Africa

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

REQUIRES `asReserveOn`. At defaults the panel shows a flat line and says so,
because South Africa prices no ancillary services today.
