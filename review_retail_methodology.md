# Methodology review: the shadow dynamic retail price panel

10 September 2026. Requested because the panel exists to show how retail tariffs move under
different energy mixes, and that claim has to hold.

**The headline, after review and challenge.** The panel as first built showed the Future
electricity mix lowering a bill by 6%. The review found four material errors and moved it to
a two-thirds rise. A challenge against Australia's experience then found the review had
double-counted O&M, that demand response was off, and - decisively - that the scenario is a
no-gas stress test. **A gas-firmed 60% renewables build moves a bill by 10%, or nothing.**

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

### 3. New-build fixed O&M - ADDED, THEN REVERSED THE SAME DAY

I added R750/kW-yr of wind O&M on the assumption that `acap*` was capex-only. Challenged
against the market, that was wrong. `acapWind` 1650 R/kW-yr at a 35% capacity factor is
R0.54/kWh - which is what REIPPPP developers actually bid all-in: BW5 R0.50, BW6 R0.58. The
addition pushed wind to R0.78/kWh, above any winning bid.

A constant that reproduces the market price on its own is not missing anything. Removed. The
Future mix fell from R6.16 to R5.55.

**This was my error inside the review**, and the market price is now pinned as a bound in
`validate_consistency` so it cannot be added again.

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

## The challenge that mattered more than the review

Asked whether retail prices could really rise by two thirds under a renewables scenario when
Australia targets 82% without expecting much price movement. Three things, tested:

```
scenario                                   retail   vs today
today                                       R3.66          -
Future mix, no gas, 134 TWh curtailed       R5.55       +52%
Australia-like: 60% RE, gas firming, DR     R4.01       +10%
same, retired coal written off              R3.66        +0%
NTCSA 2030 base, 6 GW gas                   R3.71        +1%
```

**The scenario is the whole story.** The Future electricity mix preset removes gas entirely
and buys adequacy with 97 GW of build and 134 TWh a year of curtailment. Australia keeps
roughly 10 GW of gas for firming. A South African build on that principle moves a bill by
10%, or not at all with coal written off - which is the Australian result.

The no-gas case is a stress test, and the panel had been reporting it as if it were a plan.

**Demand response was off.** `drShiftPct` is 0 in the preset. The panel assumes dynamic
pricing exists while the system underneath was sized with no response to it. Enabling it
cuts cost only if it lets you build less; with a leaner build it takes another 10% off.
Real, and secondary to the gas question.

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

---

## Confidence, stated directly

Asked whether the methodology is now correct. Not fully, and the doubt is specific.

```
item                                        confidence
structure: bottom-up from allowed revenue   high     it is how a tariff is built
today's level, R3.66 vs R3.56               high     within 3%, no calibration
fuel and carbon from dispatch               high     R107.7bn vs Eskom R110.7bn
direction under decarbonisation             high     same sign as system cost
demand response adequacy                    high     tested against the literature
gas-firmed scenario at +10%                 medium   right order; the gaps below apply
no-gas scenario at +52%                     low      three gaps, all pushing it up
```

### three gaps still open, all pushing the scenario figures the same way

**The battery constant.** `acapBatt4h` is R1,500/kW-yr. The model's own EPC figure is
R8,105/kW at four hours; annualised at 8% over 15 years that is R947. The constant is 40-60%
above its own capex unless it carries augmentation and O&M, which nothing says. Batteries are
R67bn of the Future mix's R258bn, so this is worth about R0.15/kWh.

**A 2026 cost base under a future build.** The Future mix has 5% demand growth - a 2030-ish
scenario - and is costed on today's revenue requirement. RCA recoveries (R14.4bn) are a
one-off clawback. Arrear debt (R7.7bn) is municipal non-payment, not a cost of supply. And
the existing fleet's depreciation runs off as plant ages. Roughly R0.30/kWh of today's bill
does not belong in a 2035 bill.

**Today's technology prices for a future build.** `acap*` are 2026 costs. The model already
carries `BLD_COST` with real decline rates - wind 2.9%, PV 3.9%, batteries 5.0% a year - and
the capacity-expansion LPs use them. The retail panel does not. At 2035 prices the Future
mix's capital falls 28%, from R1.05 to R0.75/kWh.

And the two cost families disagree on today: `BLD_COST` annualised gives wind R1,967/kW-yr,
`acapWind` is 1,650. RULES.md records that the model carries four cost representations. The
retail panel picked one without checking it against the others.

### what the three gaps do together

Corrected, they would take the no-gas case from about +52% to +20-25%, and the gas-firmed
case from +10% to near zero. That would put the gas-firmed result squarely on the Australian
finding, which is the external check this panel has.

### what fixing them needs

The decline rates are a small change: use `BLD_COST` with a scenario year. The battery
constant needs its provenance read before it is touched. The cost-base gap is harder: the
model is a single-year snapshot with no concept of when a scenario happens, and a proper fix
needs a year, a depreciation schedule and a demand trajectory. That is an architectural
decision, not a component fix, and it should be taken deliberately.

**Until then the scenario figures are upper bounds.** The panel should say so, and the
gas-firmed case is the one to quote.

---

## Confidence after the gap fixes, 10 Sep 2026

**The validation is now partly circular, and that is the most important thing on this page.**

The residential allocation factor of 1.29 is Homepower's energy rate divided by Eskom's
average price. Both are published, but one of them is the figure the panel is validated
against. Before it existed, a 40% municipal markup was carrying the same job silently, so the
check was passing for the wrong reason - this is better, and it is not what it was.

```
bottom-up components, no allocation      R2.66    independent
x residential allocation 1.29            R3.43    one published ratio
Homepower actual                         R3.56
residual                                    -4%   the part that still tests something
```

The ratio that would close the gap exactly is 1.34. Using 1.29 leaves a few per cent
unexplained, and that residual is the honest measure of what the check is worth. The band is
8% and must not be tightened - doing so would fit the model to its own validation.

**What I would still say with confidence:**

- the structure, which is how a regulated tariff is actually built
- the component decomposition, each line sourced to NERSA or Eskom
- fuel and carbon, from dispatch, within 2.7% of Eskom's approved spend
- new-build capital, hand-reconciled to R1.033/kWh and pinned
- the direction and rough magnitude under different mixes
- that a gas-firmed build moves a bill far less than a no-gas one

**What I would not:**

- the level to better than about 10%
- the no-gas scenario, which depends on assumptions that compound
- anything resting on the RAB run-off, which is a straight line where a schedule exists
- the residential allocation, which is one ratio doing a lot of work

**And the largest uncertainty is not in the model.** The gas-firmed scenario assumes 8 GW of
new CCGT is procurable and connected by 2035, with LNG import capacity for 15.5 TWh a year.
South African gas-to-power procurement has stalled for a decade. If that gas does not arrive,
the no-gas case is not a stress test - it is the outcome.

---

## The four tightening items, 10 Sep 2026

NERSA's Reasons for Decision on Eskom's Retail Tariff Plan (18 Feb 2025) turned out to
contain three of the four. It fetched directly.

### 1. The circular allocation - IMPROVED, not eliminated

The document gives Eskom's Cost to Serve allocation basis: cost causation by supply voltage,
location density, load profile and points of delivery, with R19.05bn of generation fixed cost
allocated to the capacity charge, 7% of generation cost. What it does NOT give is the
per-category allocated cost in rands, which is in the CTS study itself.

**So the residential factor is still 1.29 derived from published prices.** What changed is
that its composition is now known - see item 3 - and part of it is identified as a transfer
rather than a cost.

Carry NERSA's own warning with it: it found the CTS functionalises revenue as 86/4/10 across
Generation, NTCSA and Distribution against its own MYPD6 apportionment of 62/28/10, called
that a material inconsistency, and imposed ring-fencing conditions. The CTS is published but
not endorsed as consistent with MYPD6.

### 2. Multi-tariff validation - DONE

All six Homeflex rates are now held, from Table 7 - the gap previously flagged as unfillable.
Homelight 20A at 191.69 c/kWh and 60A at 243.68 c/kWh, both flat, both with no fixed charge.

Three structural relationships are now asserted, and none is fitted:

```
Homelight 20A < Homelight 60A              the lifeline carries the larger subsidy
Homeflex annual average < Homepower flat   or nobody would take a tariff they are forced onto
Homeflex peak > 1.3x Homepower flat        NERSA set the peak-to-standard ratio at 1:6
```

The Homeflex spread also corrected: **3.9x on the full six-rate annual table**, against the
4.4x previously quoted from the winter pair alone.

### 3. Cross-subsidies - QUANTIFIED, and it corrected an assumption

Table 15: total cross-subsidies R10.9bn. Recipients are Homelight 20A and 60A, Landrate,
Ruraflex and Nightsave Rural. **Homepower is not on that list** - it pays the affordability
subsidy rather than receiving it.

So part of the 29% residential premium over Eskom's average price is Homepower funding
Homelight. That is a transfer, not a cost of serving a Homepower household, and I had
attributed the whole premium to cost causation.

NERSA also approved reducing the electrification and rural subsidy by 69% and the
affordability subsidy by 53%.

### 4. The RAB run-off - PARTLY CLOSED

The R54bn settlement has a published liquidation schedule: **R12bn in 2026/27, R23bn in
2027/28, R19.7bn thereafter**, with tariff impacts of 3.4% and 2.64%. The panel had treated
it as a single expiry year, which overstated recovery in 2027 and understated it in 2029.
Now on the schedule.

The generation RAB itself and its remaining life are still not available at the level a real
depreciation schedule needs - the redetermination gives the revenue effect, not the asset
base. The run-off stays linear and says so.
