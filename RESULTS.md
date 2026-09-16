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

SUPERSEDED 15 Sep 2026. The curtailment figure does not reproduce, though by less
than first reported. Kept because it was published.

Measured on the entry's own settings - Seriti scenario, `newCcgtMW` 0,
`coalDecomMW` 32000 leaving about 10 GW, `coalFlexPct` 100, 20 GW at 10 hours, and
wind and solar read as TOTALS so `newWindMW = 50000 - FIXED.windMW`:

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
The model now runs real 2025 Eskom profiles from `profiles.json`, which carries no
version history, so the August inputs cannot be reconstructed.

WHAT SURVIVES AND WHAT DOES NOT. The unserved-energy grid below has not been re-run.
The 110 to 120 GW combined-build conclusion, and the "two and a half times the build
to remove the gas" claim that rests on it, are UNVERIFIED on this build. At 7.4% on
curtailment the conclusion probably holds, but unserved moved from zero to 79 GWh at
the frontier point, and unserved is what the grid is drawn on. Re-run before quoting.

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
