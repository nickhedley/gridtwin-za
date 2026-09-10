# Scope: closing the three retail panel gaps

Written 10 Sep 2026. Status: scoped, not built.

The retail panel's scenario figures are upper bounds because of three things that push the
same way. This scopes the fix for each against how the reference models handle it, and ends
with the one decision that has to be taken first.

```
gap                                          effect on Future mix    reference practice
new build at 2026 prices, no decline         about +R0.30/kWh        NREL ATB, CSIRO GenCost
2026 one-offs and RAB carried to a future    about +R0.30/kWh        RAB roll-forward
battery constant above its own capex         about +R0.15/kWh        ATB capex + O&M + augmentation
```

---

## The decision first: a scenario year

Every reference model that projects a tariff into the future is anchored to a year. AEMO's
Integrated System Plan reports 2030, 2040 and 2050 snapshots. The AEMC's residential price
trends run year by year. NTCSA's adequacy outlook is annual. Ofgem's price controls roll the
asset base forward one year at a time.

GridTwin is a single-year snapshot with no concept of when a scenario happens. The Future
electricity mix is "a system that exists", not "2035". That is fine for adequacy - a July
wind drought is a July wind drought - and wrong for cost, because every capital line depends
on when the plant was bought and how much of the old fleet is still being paid for.

**Proposed: a `scenarioYear` control, 2026 to 2040, default 2035.** Not a pathway - the
dispatch stays a single representative year at that date, which is what a target-year
snapshot is. Everything below keys off it.

This is the architectural decision. Once a year exists, the three fixes are each small.

---

## Gap 1: technology cost decline

**Reference practice.** NREL's Annual Technology Baseline gives capex, fixed O&M and
performance by technology and year to 2050, in three trajectories - conservative, moderate,
advanced. CSIRO's GenCost does the same for Australia and is what the ISP consumes. Both
express it as a cost per kW by commissioning year; the model reads the year, looks up the
cost, annuitises over the technology's life.

**What the model already has.** `BLD_COST` carries a 2026 cost and a real annual decline
rate per technology - wind 2.9%, PV 3.9%, batteries 5.0%, from the same ATB lineage. The
capacity-expansion LPs use it through `bldAnnuity()` over `BLD_LIFE`. The retail panel uses
`acap*` instead, which has no decline and does not agree with `BLD_COST` on today.

**The fix.** The retail panel uses `BLD_COST` and `bldAnnuity()`, and retires `acap*` for this
purpose. One cost family, not two - that is rule 6 applied to formulas.

Cost at the scenario year is `c2026 x (1 - decl)^(year - 2026)`. But a 2035 fleet was not all
bought in 2035. Reference practice is to price each vintage at its own commissioning year and
sum. Without a pathway the honest approximation is the mid-point: price the build at
`(2026 + year) / 2`. State it.

**What it does.** At 2035 prices the Future mix's capital falls 28%, from R1.05 to R0.75/kWh
on the corrected sales base.

---

## Gap 2: the cost base over time

**Reference practice.** A regulated tariff recovers a revenue requirement, and every
regulator rolls it forward the same way:

```
RAB(t+1) = RAB(t) + capex(t) - depreciation(t)
revenue(t) = opex(t) + depreciation(t) + RAB(t) x WACC + one-offs with end dates
```

Ofgem's RIIO does this annually with published depreciation profiles. NERSA's MYPD does it
for three-year windows. AEMO does not model tariffs but the AEMC's price trends apply exactly
this to network businesses.

**What the model has.** A 2026 snapshot of Eskom's revenue requirement, decomposed. It is
correct for 2026 and carries three things forward that do not persist:

- **RCA recoveries, R14.4bn.** The regulatory clearing account claws back past variances
  over a fixed window. The current tranche ends with MYPD6 in 2027/28.
- **Arrear debt, R7.7bn.** Municipal non-payment. Structural rather than one-off, but it is
  a transfer, not a cost of supply, and reference models exclude it from cost-reflective
  tariffs.
- **Existing fleet depreciation and return, R0.45/kWh.** Runs off as plant ages. Most of the
  coal fleet is past half its regulatory life; Medupi and Kusile are not.

**The fix.** Three parameters, each with a source:

```
rca_ends_fy            2028     NERSA MYPD6 decision
arrears_in_tariff      false    exposed as a toggle; default excluded, labelled as a transfer
existing_rab_runoff    linear to a floor by 2045
```

The run-off needs the generation RAB and its weighted remaining life. NERSA publishes the
RAB in each MYPD decision - the 2025-26 redetermination put it at the centre of a R54bn
correction, so the figure is current and contested. A linear run-off to the Medupi-Kusile
residual by 2045 is a defensible first cut and should be labelled as one.

**And it interacts with the stranded control.** Under "stranded", retired coal's RAB keeps
running off on its original schedule - the consumer pays until it is fully depreciated. Under
"written off", it stops at retirement. Today's control approximates that with a share; with a
year it becomes the actual schedule, which is what a regulator would see.

**Demand.** `demandGrowthPct` is currently a total. With a year it becomes annual and
compounds: `sales(year) = sales(2026) x (1 + g)^(year - 2026)`, less rooftop at that year. The
Future mix's 5% then means 5% a year, which is high; the preset needs revisiting.

---

## Gap 3: the battery constant

**Reference practice.** ATB separates battery cost into capex per kW at a stated duration,
fixed O&M as a share of capex per year, and augmentation - the replacement of degraded cells
to hold capacity over the project life, typically 2-3% of capex a year. Life 15-20 years.
Annuitised, a 4h system at ATB moderate 2026 lands around R1,000-1,150/kW-yr all-in at 8%.

**What the model has.** `acapBatt4h` at R1,500/kW-yr with no stated decomposition. Its own
`BLD_COST.batt` is R8,105/kW; annuitised over 15 years at 8% that is R947. The gap is either
augmentation and O&M folded in without saying so, or a constant that has drifted.

**The fix.** Read the constant's provenance before touching it - it may have been set
deliberately. If it carries augmentation, split it: capex from `BLD_COST` with decline,
augmentation as an explicit 2.5% of capex a year, fixed O&M as 1.5%. If it has drifted,
retire it in favour of `BLD_COST` as above. Either way the retail panel stops reading
`acap*`, which resolves gap 1 and gap 3 in the same change.

---

## What this does not touch

The dispatch engine, the adequacy results, the frontier, the findings in RESULTS.md. All of
those are single-year and correct as such. The year is a cost-side parameter; it changes what
a kWh costs to recover, not how the system runs.

It also does not touch the discount rate. `BLD_DISC` is 8% real. South African IPP projects
finance at roughly 10-12% nominal, 5-7% real; Eskom's regulated real return is 7-8%. Eight
per cent is defensible and toward the high end, and it applies to both the LPs and the panel,
so changing it is a separate decision with wider effects.

---

## Validation

Three checks, each against something external:

1. **2026 reproduces today.** With `scenarioYear` at 2026, every figure must match the
   current panel - R3.66 against Homepower's R3.56. The year adds nothing at its origin.
2. **The gas-firmed scenario at 2035 lands near zero.** Australia's ISP and the AEMC both find
   a gas-firmed high-renewables build does not raise prices materially. This is the one
   external result the panel can be checked against, and it should reproduce it within a few
   per cent once the three gaps close.
3. **`BLD_COST` and the retired `acap*` agree on 2026.** If they do not, the constant that
   disagrees has drifted and needs its provenance read. This is the check that would have
   caught gap 3 before it was built on.

---

## Order of work

1. Add `scenarioYear`. Everything else keys off it.
2. Switch the panel from `acap*` to `BLD_COST` via `bldAnnuity()`. Closes gaps 1 and 3.
3. Add the RAB run-off and the one-off end dates. Closes gap 2.
4. Make demand growth annual. Revisit the Future mix preset's 5%.
5. Run the three validations. The gas-firmed 2035 result is the one that matters.

Effort is modest once the year exists. The year is the decision.
