# GridTwin ZA - handover, 12 September 2026

Build `2026-09-12o`. Suite clean. This session ran long; what follows is what a new session
needs to pick up without re-deriving it.

> SUPERSEDED IN PART, 17 Sep 2026. The current build is `2026-09-17a`, five days and two long
> sessions later, and the suite counts, the retail headline and the cost-recovery figures below
> have all moved. Individual figures are marked where they are known not to reproduce, but
> TREAT ANY UNMARKED NUMBER IN THIS FILE AS UNVERIFIED against the current build. What survives
> reliably is the METHOD sections - the working method, the satellite-work errors, and the
> "measure before concluding" note at the end - none of which depend on a build. RESULTS.md is
> the current record of findings.

---

## Read first

`RULES.md` in full - it is short by design. Then `STATE.md`. Then this.

The one rule that governed most of today: **when a result contradicts the question, say so
first.** It happened repeatedly and the contradictions were the findings.

---

## Where the suite stands

```
validate_lint            2/2
validate_structure      24/25     three data files lost to a container reset, see below
validate_consistency    78/78
validate_inputs         33/33     was 10 at the start of the day
validate_capacity       31/31
validate_findings       32/32
validate_weather        64/64
audit.py                87/87     prose ceiling raised 4200 -> 4250, deliberately
```

**Three data files are missing from the sandbox only, not from the repo:**
`headroom_summary.json`, `tdp_projects.json`, `provincial_mix.json`. They were never staged to
outputs before the container reset. `validate_structure` reads 24/25 because of it. Locally it
will pass.

---

## The retail panel - what changed today

It began the day with 10 input checks and a 731-word note. It now has 33 checks, a 98-word
note, two selectable bases and a delta line.

### errors found and corrected

| what | was | is |
|---|---|---|
| technical loss | 0.10, labelled "technical and non-technical" | 0.08, technical only |
| City Power tariffs | treated as VAT-inclusive | **exclusive** - every municipal figure was 15% low |
| additional energy charge | R0.06/kWh applied to every block | removed, absent from the published schedule |
| IPP obligations | flat R/kWh | scales with sales - REIPPPP is take-or-pay |
| curtailment compensation | absent | 10% PPA threshold, sourced to the March 2024 Addendum |
| retail margin | imported from Europe, unsourced | R0.312/kWh from the CTS, 4% from the R0.30 held |
| LOLE | counted HOURS, called LOLE | LOLH and LOLE computed separately |
| P(shed) | flat 0% | `0 <5%`, the Poisson zero-count bound |
| breakdown | identical on both bases | follows the basis |

### the two bases

**Regulated** is Eskom under NERSA - a revenue requirement over kWh, only fuel and carbon
varying by hour. **Market-indexed** is Agile - the hourly price carries generators' capital
through scarcity, so generation's 67% share leaves the flat block.

```
Deep decarbonisation 2035   regulated    market-indexed
mean, build 2026-09-17a         R4.91             R3.29
day spread                       1.3x              3.1x
```

RETIRED 17 Sep 2026: this table read R5.45 and R3.51 against a preset called "Future mix".
Neither figure reproduces on any current state and both predate three changes - the 12 Sep
`salesMWh` break and its 15 Sep repair, the rooftop capex removal, and the preset's lithium
moving 30 GW to 20 GW. The preset was renamed to Deep decarbonisation on 15 Sep 2026. Do not
reissue the old pair; RESULTS.md carries the current matrix with its full control state.

The market number is LOWER and that is not good news. THE MAGNITUDES OF THAT UNDER-RECOVERY
ARE NOT CURRENTLY QUOTABLE: this paragraph claimed 35% of system cost against 76% today and
132% gas-firmed, with prices zero 56% of the year, and none of those reproduce either. The
denominator is the problem - `totalCost` excludes the existing fleet, which a tariff does not -
and Crisis 2023 returns 4,904% of system cost, which looks like a regression of the ORDC
failure recorded as fixed on 12 Sep. Measured 17 Sep: prices are zero 38% of the year under
Deep decarbonisation. The DIRECTION holds and is well founded. The household pays
less; the capital does not get paid. That is the missing-money problem, and it is why capacity
markets exist.

### what the scarcity pricing follows

PLEXOS, not PyPSA. PyPSA takes price from the dual of the nodal balance constraint, and our
hourly dispatch is a merit-order heuristic with no dual to read. PLEXOS applies an
administratively set Value of Reserve Shortage when a reserve constraint is violated; the
stepped curve here is NREL's shape.

**A first attempt read an ERCOT-style ORDC off `reserveMW` and recovered 5,000% of system
cost.** `reserveMW` is the reserve HELD - a policy input, nearly constant at 4.4 to 6.8% of
load, not a measure of tightness. What discriminates is the DEPTH of shortfall.

---

## Findings worth quoting

**Grid delay is an emissions event, not a price event.** Renewables 89 to 68 TWh, coal 140 to
157, retail R3.91 to R3.96. The household barely notices; the mix moves a quarter. That
asymmetry is why delay goes unaddressed - nobody on the bill feels it.

**Turn-up is the larger half of constraint cost**, 43% today and 65% under the IRP build, as
the replacement rate goes R412 to R1,012/MWh. Volume and cost are not the same thing.

**Today's cheapest hours are the dirtiest.** Marginal carbon 1.040 in the six cheapest hours
against 1.029 in the six dearest - the cheap hours are overnight coal, the dear ones are
evening gas and storage. Under the IRP 2030 build the sign flips back. So the divergence is
TRANSITIONAL, which argues for fixing the signal now.

**Curtailment reaches the bill through the denominator**, worth about 22% of the Deep
decarbonisation bill and invisible as a line. The 22% is on the pre-15 Sep build and has
not been re-measured since the charging fix or the preset change.

**Inflation is not the problem, the counterfactual is.** Everything is constant 2026 rands.
Holding today's tariff flat is GENEROUS to the status quo: NERSA has approved 8.76% and 8.83%
against a 3% target, and CSIR measures 4.6% real over 2014-25.

---

## The satellite work - a full day, and the ending is not where it started

**The question:** which of South Africa's registered projects were actually built. NERSA has no
system tracking it, the IPP Office quarterly is aggregate with no names, REEA gives 2,597
authorisations with no outcome.

**What was built:** a register of **67 solar arrays and 49 wind farms**, with construction date
brackets, matched to the authorisations claiming each. In `nodal/project_register.json` and on
the map behind a "Built projects" toggle.

```
clean PV assets    59    5,128 MW    CSP, duplicates and unverified excluded
named              57 of 67
```

**Do not repeat the detector work.** Four versions of a spectral change detector were built
before searching the literature. **TransitionZero's TZ-SAM and Microsoft's Global Renewables
Watch already exist, are in the Earth Engine catalog, and are far better.** The detector only
earns its place on what those miss.

**What the detector did establish**, and it holds:
- NDBI detects a complete array where there is vegetation; brightness where there is not.
  Grootspruit fired on NDBI at +0.0825, Mooi Plaats on brightness at -0.0114, neither on the
  other. Terrain decides which index works.
- **Under-construction cannot be detected at 10 m.** Calibrated three states from TZ-SAM's own
  date brackets: complete separates perfectly, during does not separate from nothing.
- An offset search turned 0 false alarms into 11. Taking the minimum of 25 windows finds a
  negative by chance - the approach is structurally wrong, not badly tuned.

**Errors that cost real time, so they are not repeated:**
- A bounding box `[16,-35,33,-22]` was used in every script and takes in Namibia, Lesotho and
  Eswatini. Five assets were foreign. Now `FAO/GAUL/2015/level0`.
- `ee.Join.saveAll` defaults to an INNER join. Three chained joins turned 973 sites into 20.
- **TZ-SAM's capacity model is trained on PV and overstates CSP badly** - Khi Solar One reads
  252 MW against an actual 50. CSP assets carry `capacity_unreliable`.
- Building median composites over 12 km boxes exhausts memory. Reduce each image to numbers
  over the region FIRST, then average the numbers.

**Licence, and it is a decision not a detail.** Solar derives from TZ-SAM, **CC-BY-NC** - it
cannot go into a commercial product. Wind derives from GRW, MIT, and is clean. OpenStreetMap
was rejected for names because ODbL share-alike is incompatible with CC BY-NC-ND.

---

## Open, in the order I would take them

1. **The EPP comment closes 28 September.** Nearest binding date, and it covers exactly what
   the retail panel models - unbundled charges, cost-reflective tariffs, cross-subsidies, and
   whether solar customers contribute to network costs. We hold numbers on the last two that
   are not published anywhere.
2. **Province comparison against NERSA.** 20,131 MW registered across nine provinces against
   satellite-measured built capacity. Says where registration and construction diverge - the
   gap NERSA admits it cannot track. Needs no new data.
3. **A refresh procedure in `SOURCES.md`.** TZ-SAM is quarterly, GRW stopped at Q2 2024.
   Without writing down which quarter and what to re-run, the register ages silently.
4. **19 unnamed arrays**, of which 10 have no authorisation text. Diminishing returns below the
   two Upington sites.
5. **Nothing since build `2026-09-11j` has been seen rendered** except by report. Many of
   today's defects were invisible to the suite - jsdom stubs the canvas and does no layout.

---

## Working method, since it mattered

Every substantive correction today came from a question, not from the suite. The checks test
what was thought to test. Three controls were reported broken and all three were correct but
inert; four orphaned functions were left defined and uncalled; a check was written with
`|| true` and could never fail.

**Measure before concluding.** The habit that worked was running the thing and reading the
number, not reasoning about what it should do. The habit that failed was the reverse, every
time.
