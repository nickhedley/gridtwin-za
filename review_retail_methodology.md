# Methodology review: the shadow dynamic retail price panel

10 September 2026. Requested because the panel exists to show how retail tariffs move under
different energy mixes, and that claim has to hold.

**The headline: the review reversed the conclusion.** The panel as first built showed the
Future electricity mix lowering a household bill by 6%. Corrected, it raises one by roughly
two thirds. Four of the seven findings were material and are fixed; three are recorded as
assumptions.

```
                            before review    after review
today                              R3.92           R3.66     Homepower actual R3.56
Future mix, stranded               R3.68           R6.16
Future mix, written off            R3.08           R5.86
```

Today's figure moved closer to the real tariff - within 3% - while the scenario figures
moved far. That is what fixing a denominator and adding missing costs should do.

---

## Findings

### 1. Two denominators in one sum, and the wrong one - FIXED

Model-derived costs were divided by generation (222.6 TWh). Eskom-derived components were
per kWh of dispatchable energy sent out (190.81 TWh). Two bases in one sum, and 190.81 is
wrong regardless: it excludes wind and solar IPP energy, which Eskom buys and sells.

Eskom recovers its revenue over what it sells. RSA contracted energy demand, 2025: 209.55 TWh.
The model's generation less rooftop self-consumption, storage throughput and exports lands at
204 TWh, which agrees.

**Effect:** every Eskom component was 9% high. And the scenario sales base now shrinks when a
scenario adds rooftop - the Future mix sells 181 TWh against today's 204 - so fixed costs are
spread over fewer units. That is a real dynamic and it was absent.

### 2. The written-off case wrote off the transmission network - FIXED

`existingCap = (depreciation + return on assets) x coalFrac`. Those two lines are
whole-company: Koeberg, the pumped storage schemes, Medupi, Kusile, and every kilometre of
wire. Scaling all of it by the coal fraction meant retiring coal wrote off the grid. In the
all-coal-gone case it went to zero.

Only the coal-specific share moves. Generation is 67% of NERSA's allowed revenue; coal is
roughly 80% of generation assets; so about 54% of asset costs are at stake. The rest stays.

**Effect:** the stranded-versus-written-off gap fell from 25% of a bill to about 5%.

### 3. New-build fixed O&M was absent - FIXED

`acap*` is annualised capex only. A wind farm still needs maintaining once it is paid for.
Wind R750, PV R300, batteries R400, CCGT R300 per kW-year, mid-range of NREL ATB and REIPPPP
disclosures. On the Future mix: R61bn a year, R0.34/kWh on the corrected sales base.

**Effect:** the largest single omission by value.

### 4. Generation sales counted curtailment - FIXED

The first sales calculation summed every numeric field in the energy object, which includes
curtailed energy, exports and storage charging. The Future mix came out at 460 TWh of sales
against a real figure near 180. Now sums the same generation keys the energy balance uses.

### 5. The municipal markup double-counts Eskom distribution - RECORDED, NOT FIXED

The markup applies to the whole Eskom cost, which already contains Eskom Distribution at
about R0.67/kWh. A municipal customer does not pay Eskom Distribution; they pay a bulk
tariff and their municipality's own network and margin. So for a municipal customer the panel
charges distribution twice, and for an Eskom-direct customer the markup should be zero.

The honest structure is a switch - supplied by Eskom, or by a municipality - rather than a
slider that blends both and describes neither. Not built in this review because it changes
the panel's controls; the slider at 40% is left and the caveat is stated.

### 6. Closure and rehabilitation costs were absent - added as an assumption

Retiring 27 GW of coal carries closure, rehabilitation and social costs that someone pays in
both the stranded and written-off cases. Added at R1,500/kW annualised at 8%. Small on the
Future mix - R0.02/kWh - and worth having because its absence would be an omission with a
known sign. No fleet-wide South African figure is published; this is an estimate.

### 7. Carbon is 62% high - RECORDED, KNOWN

Model R7.8bn against Eskom's approved R4.8bn, because the model pins carbon at R550/t where
the statutory rate is R308 with allowances taking it lower. the state file open item 2. Small in
the retail total.

### Also: the opex scaling is an assumption

60% of Eskom operating costs are taken as coal-station-specific and fall with retirement.
Employee benefits are R37bn of R93bn, largely in generation; the rest is mostly maintenance.
Plausible, unsourced, and now labelled as such in the data file.

---

## What was checked and found sound

**The fuel spend.** Modelled R107.7bn against Eskom's approved R110.7bn - 2.7% apart. That is
an independent validation of the dispatch model itself and worth stating on its own.

**New-build capital.** The model's `newCapexR` of R257.6bn a year on the Future mix
reconciles by hand: 45 GW wind at R1,650 plus 52 GW PV at R1,050 plus 30 GW of six-hour
batteries plus 20 GW rooftop is R220-260bn. And it matches the model's own system cost of
R1,445/MWh for that scenario.

**IPP purchases held fixed.** Existing PPAs are an obligation on plant already built; new
build is `newCapexR`. Scaling them with new capacity was the first error found, before this
review, and it double-counted.

**The hourly shape.** Only fuel and carbon vary by hour, following the marginal price, scaled
to recover their annual spend. Everything else is a capacity or obligation cost and is flat.
Defensible, and the reason the daily spread is so narrow.

---

## What the corrected panel says

```
component, R/kWh            today    Future mix
fuel and carbon             0.529         0.138
existing fleet capital      0.452         0.452   stranded
new build capital           0.000         1.423
new build fixed O&M         0.000         0.339
new grid                    0.000         0.070   a floor - TDP implies ~0.23
generation opex             0.384         0.384
IPP obligations             0.275         0.275
closure                     0.000         0.018
sales base, TWh               204           181
```

**Fuel is cheap to remove. The capital that replaces it is not**, and it is spread over fewer
kWh because the same scenario adds 20 GW of rooftop.

Two caveats carry forward. The new-grid line is roughly a third of what the Transmission
Development Plan implies, so the scenario figure is a floor. And the scenario tested is an
aggressive no-gas build sized for adequacy at 110-120 GW; a moderate decarbonisation that
kept gas as backup would look very different and is the more useful next test.

---

## Checks in place

`validate_consistency`:

- the build lands within 15% of Homepower at today's system, with no calibration. The
  method's only check on itself. Verified by quadrupling IPP purchases: fires at R5.13.
- the price responds to the Future mix by more than 20% in either direction. Replaces a
  check that asserted it FALLS - a check that encodes a conclusion gets edited when the
  conclusion changes.
- the retail price moves the same way as the model's system cost.
- the panel states the grid floor, the stranded choice, and that it is regulatory.

One process finding: the scenario-response check existed, then vanished when its surrounding
block was replaced during the rebuild, and nothing noticed. the state file already names this
failure mode for `eng5`. It happened again here.
