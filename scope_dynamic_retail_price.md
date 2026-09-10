# Scope: a shadow dynamic retail price for South Africa

Status: scoped, not built. Written 10 Sep 2026.

The question: what would a South African household pay at 02:00 against 18:00 if the retail
price followed cost? Nobody can currently answer that, because there is no wholesale market
until SAWEM and no dynamic retail product at all.

---

## Why this is worth building

The ERTSA consultation for 2027/28 closed for comment on 2 October 2026 and turns on exactly
this: how Eskom's approved revenue splits between fixed and variable charges. Fixed charges
move from 66.6% to 100% of their glide path and the service and administration charge rises
nearly 50%.

The NERSA market inquiry submission already argues that the tariff blocks do not track cost.
**A shadow dynamic price is the constructive version of that argument** - not "the blocks are
wrong" but "here is what the hours are actually worth".

It is also the first thing GridTwin would produce that a household could act on.

---

## What already exists

| component | status | source |
|---|---|---|
| hourly wholesale shadow price, 8,760 h | BUILT | model marginal price |
| time-of-use block classifier | BUILT | `touBlockOf()`, Megaflex blocks |
| transmission cost | BUILT | `txRPerKWyr` 600, calibrated to TDP R6,964/kW |
| regional differentiation | PARTLY | 10 supply areas, congestion curtailment |

The hard half is done. The wholesale series is the piece other people cannot produce.

---

## The Octopus Agile formula, as the reference

Agile is the right comparator because its formula is published and auditable, which is the
same standard this model holds itself to. Structure:

```
half-hourly rate  =  day-ahead wholesale (EPEX, 30-min auction)
                   + network costs, regional
                   + peak uplift, 16:00-19:00, about 10-14 p/kWh by region
                   + supplier margin
                   + VAT
                   - policy adjustments (a flat 3.5 p/kWh from Apr 2026)
                   subject to a cap
plus a separate daily standing charge, 40-65 p/day
```

Four features worth importing:

1. **The wholesale component is passed through unsmoothed.** No averaging.
2. **A peak uplift sits on top of wholesale**, because the network cost of the evening peak
   is real and separate from the energy cost. Our TOU work found the same thing from the
   other direction: the blocks separate on the tail, not the level.
3. **A cap exists**, so scarcity pricing does not reach the household intact.
4. **The standing charge is separate and is not dynamic.** This is the honest limit on what
   any dynamic tariff can shift, and it matters more in South Africa than in Britain.

---

## The components, and what each would rest on

| component | basis | defensible? |
|---|---|---|
| energy, hourly | model shadow price | MODELLED - see caveat |
| transmission | `txRPerKWyr`, TDP-calibrated | YES, already in the model |
| distribution | Eskom ERTSA schedules | YES, published, but not yet ingested |
| municipal markup | varies by distributor | PARTLY - huge spread, needs a stated choice |
| losses | technical + non-technical | YES, Eskom reports; roughly 10% |
| environmental levy | R6.5bn / sales | YES, Eskom revenue build-up |
| carbon tax | R5.5bn / sales | YES, same |
| retail margin | none in South Africa | imported - Octopus, Nordic suppliers, 2-5% |
| VAT | 15% | YES |

**Only one line is a genuine import**: the retail supply margin, because South Africa has no
competitive retail from which to observe one. Everything else is either in the model or
published by Eskom. That is a much better position than it first appears.

---

## What the output would be

Two things, and the second matters more:

**A shadow hourly retail price**, 8,760 values in c/kWh, decomposed into its components so a
reader can see how much of each hour is energy and how much is wires.

**The shiftable fraction.** What share of a bill a household could actually move by
responding to price. Given the fixed-charge glide path, this is likely to be small and
falling - which is the finding, and it is one the ERTSA consultation should hear.

---

## What would make it dishonest, and how to avoid each

**Presenting a shadow price as a forecast.** Our wholesale figure is a modelled marginal cost
from a dispatch model, not an observed market price. The NERSA correction sent on 8 Sep 2026
exists because a modelled price was treated as more solid than it was. Label it on every
surface, not just in a methods note.

**Ignoring the fixed charge.** A dynamic price that quotes only the variable component would
overstate what a consumer can shift. The standing charge must be shown alongside.

**Averaging across municipalities.** The markup spread between metros is large enough that a
national average describes nobody. Pick one distributor, name it, and offer others.

**Implying it is achievable now.** Dynamic retail pricing needs a settlement mechanism, smart
metering and a supply licence. None exists. The output is what the hours are worth, not what
anyone could charge.

---

## Dependencies, in order

1. **Ingest the Eskom ERTSA tariff schedules.** The 2027/28 consultation paper has the
   component breakdown. This is the single largest missing piece and it is published.
2. **Choose and document a municipal markup.** One named distributor to start.
3. **Source a retail margin.** Octopus is the transparent case; state that it is imported.
4. **Decide the cap.** Agile caps at 100 p/kWh. Ours should cap below the value of lost load,
   or the panel inherits the R80,000/MWh shortage hours.

## What to check before trusting the output

The diurnal wind shape is currently wrong - our trough sits four hours early against Eskom's
metered fleet, correlation 0.60. **A dynamic retail price is a claim about WHEN power is
cheap.** That is precisely the axis where our data is weakest, and this should not ship until
to-do item 18 is resolved or the limitation is stated on the panel itself.

---

## The fixed/variable split, both sides, with numbers

Worked 10 Sep 2026. This is the part that can be computed today without building anything.

### Octopus Agile, for reference

```
standing charge      40-65 p/day, NOT dynamic
unit rate            half-hourly, wholesale-linked, capped
peak uplift          10-14 p/kWh, 16:00-19:00, regional
```

A typical British household at 2,700 kWh a year pays about GBP 182 in standing charge
against GBP 594 of energy. **Fixed share about 24%**, and the standing charge is the part
dynamic pricing cannot touch.

### Eskom Homepower 4, 2026/27

Fixed R536 a month - network capacity R10.44/day, service and admin R6.60/day, generation
capacity R0.82/day. Energy R3.5556/kWh including VAT, flat, the same at 03:00 as at 18:00.

```
kWh/month    energy R   fixed R   total R   fixed share
      300       1,067       536     1,603           33%
      600       2,133       536     2,669           20%
      900       3,200       536     3,736           14%
    2,000       7,111       536     7,647            7%
```

**The fixed share is already regressive**: 33% for a small household, 7% for a large one. At
typical consumption South Africa sits near Octopus - but a low-consumption home is at double
the British share before the glide path finishes.

### What is still to move

The phase-in is not complete. Service and admin went from 33.33% fixed in FY2026 to 66.66%
in FY2027; the generation capacity charge from 20% to 30%.

```
component               fixed now   at 100%   still to move   R/day
service and admin            6.60      9.90            3.30
generation capacity          0.82      2.73            1.91
network capacity            10.44     10.44            0.00   already fully fixed
                                                       5.21 R/day = R159/month
```

### The two scenarios

Revenue-neutral at 900 kWh a month, so the energy rate falls by what the fixed charge gains.

```
                    A. frozen              B. completes
fixed               R536/month             R695/month
energy              R3.5556/kWh            R3.3789/kWh

kWh/mo     A total   B total   change   A fixed%   B fixed%
   200       1,247     1,371     +124        43%        51%
   400       1,958     2,047      +88        27%        34%
   600       2,669     2,722      +53        20%        26%
   900       3,736     3,736       +0        14%        19%
 1,200       4,803     4,750      -53        11%        15%
 2,000       7,647     7,453     -194         7%         9%
```

**Revenue-neutral in aggregate and regressive by household.** A 200 kWh home pays R124 a
month more; a 2,000 kWh home pays R194 less. And the small household's bill becomes **51%
fixed** - more than half of it beyond the reach of any dynamic tariff, before one exists.

### why this matters for the dynamic price

The shiftable fraction is the whole point of a dynamic tariff, and it is falling fastest for
the households with least room to respond. **Completing the glide path takes a 200 kWh home
from 43% to 51% unshiftable.** Whatever a dynamic price could save them, it applies to less
than half their bill.

Caveats. Homepower 4 only, 80 A single-phase, Eskom direct - municipal customers face a
different structure and their own markup. The revenue-neutral basis is 900 kWh a month; a
different basis moves the crossover but not the direction. Figures are the 2026/27 schedule
at 8.76%, so the 2027/28 ERTSA at 8.83% shifts the level and not the shape.
