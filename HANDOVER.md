# GridTwin ZA - handover, 2 October 2026

Build `2026-10-02a`. Suite 802/803 plus eng5 6/6, measured 2 Oct 2026 with `profiles.json` at
the root. The one failure is EDMSA Scenario A CO2 2035 (90.8 against 124 Mt), known and standing.

This top section is complete on its own: read RULES.md in full, then this section, then TODO.md,
then stop and run the suite before changing anything. TODO.md holds the full running to-do list
(124 items on 2 Oct); keep it current and reprint it at the end of each message. Everything below the line "Older handover material" is
kept for its reasoning and is superseded wherever it disagrees with this section.

---

## Start here: what the next session needs to know

### 1. The two biggest changes since 30 Sep, both of which move published numbers

**The engine now charges storage from coal when stress is coming** (`chargeFromThermal`, default
1). It used to charge from coal only 23:00 to 05:00. In a solar-heavy system the spare coal is at
midday and the stress at night, so the window never opened when it mattered. Now, in any hour the
engine's own shortfall forecast says energy will be short, it charges from coal headroom up to
that forecast. Off-peak behaviour is unchanged; a calm day burns no extra coal. Setting it to 0
reproduces the old results exactly.

CONSEQUENCE: every adequacy figure in RESULTS.md for a build that keeps coal, dated before 2 Oct,
is pessimistic. Directions re-measured on three key entries all hold (coal flexibilisation, the
electrification wall, a no-gas frontier cell); levels do not. Re-measure before quoting any level.
Fossil-free figures stand: no coal, nothing to charge from.

**Deep decarbonisation was re-sized because of it.** Lithium 20 to 17 GW at 12 hours. Its twelve-
year mean shed had fallen to 0.44 GWh against a 2.07 target. Now 2.02 GWh, system cost R290.5bn to
R283.8bn, regulated retail R4.23 to R4.17/kWh, CO2 unchanged at 30 Mt. Retiring more coal is NOT
available at this build: 2 GW more multiplies shedding seventeen-fold.

### 2. The presets as they stand

```
Today 2026                  the reference; prices nothing; existing fleet
IRP path 2035               22.2 onshore / 18.9 solar / 6.1 GW at 4h / 11.6 gas at a 50% floor; coal -16 GW
Deep decarbonisation 2035   35 onshore / 35 solar / 0 offshore / 10.8 GW new rooftop / 17 GW at 12h
                            + 1 GW iron-air; coal -27 GW (12.7 GW kept); no new gas; reserve and inertia priced
                            curtailment 51 to 68 TWh across twelve weather years
Fossil-free 2040            35 onshore / 55 solar / 7 offshore / 16.8 GW new rooftop / 30 GW at 12h
                            + 1 GW iron-air; all coal and diesel retired; mean shed 1.77 GWh
                            curtailment 90 to 114 TWh across twelve weather years
```

Both transition presets are sized to the cheapest build meeting the NEM standard (0.002% of
demand) with a 2x margin, scored as the mean over twelve weather years.

### 3. The build optimiser: what changed and what it now is

Read RESULTS.md from "The stress-period loop works" upward for the full story. In short:

- The horizon is a control: 2030, 2035 or 2040. Annual steps to 2040 solve in about 8 seconds.
- The build-rate caps were raised: utility solar 2.5 GW a year, rooftop 2 GW (Australia installed
  1.9 GW of rooftop in six months on similar demand; South Africa's record year was 2.6 GW).
  The 2040 schedule is still cap-bound in most years: the pace assumption outweighs the economics.
- Applying a result now carries every technology the optimiser decides, the coal retirement it
  assumed, and its storage duration. Before 2 Oct it carried five technologies and left a preset's
  offshore and iron-air on top, so a build called adequate was tested with plant it never built.
- Seven constants it duplicated from the engine, and got wrong, now read the engine's keys:
  nuclear 0.9 (engine 0.66), hydro, imports, rooftop at full output (engine 0.78), no congestion
  loss (engine 4%), no firm exports (engine 745 MW), and pumped storage counted as reserve with no
  energy behind it. Plus a demand-growth off-by-one and reserve shortfall priced 365 times cheaper
  than shedding on stress days.
- The worst week across all twelve weather years is spliced in as seven stress days, coal derated
  to 0.76 on them (the worst measured week in the availability trace), shedding priced at VoLL x 365.
- A second button runs ReEDS-style stress-period iteration: solve, test against twelve weather
  years, add the failing week, re-solve. On Fossil-free 2040 it still stalls, now at about 7 times
  the standard (30 GWh worst year against 4.4). This morning it was 1,800 times.
- The regional optimiser did NOT get these fixes. They were built and reverted: the LP went from
  23 to 48 MB and past the browser's 900-second limit. Use the national optimiser for adequacy, the
  regional one for siting at a 2030 horizon.

STANDING RULE: an optimiser result is a proposal until the twelve-year dispatch has run on it.

### 4. Other changes, 1-2 Oct

- Rooftop tool: capacity is whole modules (2.58 m2, 620 Wp) at a stated packing factor; a roof-form
  control (flat, single pitch, dual pitch at 0.52 of footprint, complex); an obstruction control
  (clear 0.80 to heavy 0.45, typical 0.69); a "Save sizing sheet" button. A double-count was fixed:
  the tracer and the Google Solar path both wrote area x 0.72 and then rtCalc packed it again.
  Google's Solar API was already wired in; it needs a key in `window.GOOGLE_SOLAR_KEY`.
- Retail: the market basis is labelled "SAWEM, from Apr 2027" and called a counterfactual until then.
  A dead `retSupply` flag found and pinned: the stack models an Eskom-direct customer.
- Four dead element reads found; a structural check now asserts every id read exists. The VPP
  readout, computed for weeks and never displayed, now has a host.
- Curtailment pinned in validate_findings with a 15% band; it spreads 22 to 27% across weather years
  where system cost spreads 1.4%. Spill is set by the weather, shortage by the build.
- The page's scope line now says it answers bulk adequacy, not distribution reliability, and that
  rooftop address and roof lookups go to Google.
- Private-project queue: `nodal/private_pending_h2_2026.json`, six named projects (SunCentral 1,
  Selemela, Damlaagte, Thakadu, Paarde Valley PV2, Discovery Green's portfolio), deliberately not
  loaded. They are a RECLASSIFICATION from rooftop to wheeled when loaded, not an addition: NTCSA's
  weekly private-solar figure already contains them. Reconcile against the PFL H2 monitor, Feb 2027.

### 5. In flight - the next piece of work, in order

1. **Decompose the adequacy loop's remaining factor of about 7.** Same method that found the seven
   constants and the charging rule: take the stalled week, compare every supply line between the
   optimiser and the engine in GWh, and look at the engine's shed hours for what was idle. Candidates
   not yet ruled out: iron-air held 4.4 GWh while the engine shed (check its discharge rule);
   interruptible load (1,200 MW in the engine, absent from the optimiser).
2. **Fraunhofer-style replay on ESK19679.** Real hourly Eskom dispatch, April 2022 to August 2026,
   with a hypothetical battery fleet inserted; measure diesel displaced, peaks shaved, shedding
   avoided. Nothing about the existing system is modelled, so the baseline cannot be argued with,
   and it tests the new charging rule on real midday coal headroom.
3. **The render check, now four sessions overdue.** The user tried to upload a screenshot of the
   rooftop tool on 2 Oct and it failed to send - ask for it again first thing. Check: the rooftop
   roof-form and obstruction controls, module note and sizing sheet; the build panel's horizon
   selector, apply status line and adequacy-loop button; the VPP readout; the nodal panel with
   reserve live at defaults.
4. **A deeper-coal-retirement preset**, if the user wants a third transition scenario: retiring more
   than 27 GW needs firm capacity alongside, so it is a different preset, not a trim.

### 6. Waiting on the user

- Google Solar API: enable it on the existing GridTwin ZA Cloud project, add it to the key's API
  restrictions, set a daily quota of a few hundred, check whether the key is committed to the repo,
  then test Johannesburg and Cape Town addresses. Building Insights is free to 10,000 calls a month.
- Industrial electrification: parked as a research project pending funding. GIZ pitched 2 Oct
  (gas-cliff framing). Six-step scope below. First cut only: 3 GW of flat load lowers retail about
  8 to 11% and hits an adequacy wall near 3 GW - not to be quoted as a result.
- A Sondeva-style tracker of NERSA notices, the Government Gazette and DFFE authorisations:
  probably a separate project. Two pieces belong in GridTwin now - source URLs and an
  active/withdrawn/rejected status on the private queue, and REEA_SHARE weighted by build rate.

### 7. Rules learned this session (all now in RULES.md or below)

- Two models of the same system read the same constants. A literal in the optimiser with an engine
  key is a bug waiting for a scenario.
- Decompose a disagreement in energy before naming its mechanism. The mechanism named first was
  wrong twice on 2 Oct (foresight, then storage foresight); a state-of-charge measurement settled it.
- The system tested must be the system proposed - every technology, not the ones on screen.
- Record what a probe actually tested; never copy a build by hand. A hand-copied build missed 2 GW
  of rooftop and produced a false discrepancy.
- A check that flips green after a model change needs explaining as much as one that flips red.
  (The MTSAO OCGT check passed after the charging fix: 58.9% to 52.9% against their 45%, moved for
  the reason the fix was built.)
- Before believing a match, confirm the key still means what it did: `coalFlexPct` is now an on/off
  switch, so 24 and 100 both read as "on".
- Splitting a constant means hunting for the places that already split it informally (the rooftop
  0.72 double-count).
- A harness that excludes by property name owns that name (`readout` silently dropped a control).
- A curtailment level needs a range, and its profile set named.
- Share files before writing the report. The user has had to ask for files repeatedly; the share
  call goes first in any turn that produces one.

### 8. Running the suite

Unchanged; see MANIFEST.md. From the directory holding `index.html` and `nodal/`, the root-taking
harnesses take `.`; `validate_outputs`, `eng5` and `jsdom_local2` run from the parent.
New this session: `validate_structure` has 25 checks (the element-read check), `validate_findings`
39 (curtailment band), `validate_external` 8 (GreenCape build-pace check).

Background processes in the sandbox are frozen between tool calls, so a long solve must be kept
alive with a running command (a sleep) or it will appear to crawl.

### 9. Dates

```
Feb 2027   PFL IPP monitor, H2 2026: replace by_source.private, reconcile the private queue,
           and move each loaded project from rooftopMW to wheeled in the same commit
Apr 2027   SAWEM launch: change the market-basis label and tooltip on the day
```

---

# Older handover material

Kept for its reasoning. Where it disagrees with the section above, the section above wins.

## Read first

`RULES.md` in full, it is short by design. Then `STATE.md`. Then this. `RESULTS.md` is current
and carries every finding with its settings; this file is state and direction.

---

## Where the suite stands

Measured 22 Sep 2026 on build `2026-09-22at`, `profiles.json` at the root, current `nodal/`.
The previous version of this table was a running count and summed wrongly; this one is a run.

```
validate_lint             3/3     phantom keys (peakMW, asReserveFrac, psMW, battMW)
validate_structure       25/25
validate_geo             43/43
validate_capacity        31/31
validate_inputs          33/33
validate_findings        39/39
validate_invariants     175/175   shed-energy cost; ORDC reads available reserve; market-basis cost recovery; curtailment compensation
validate_response        84/84     diesel budget and Koeberg controls added
validate_weather         66/66
validate_lp              51/51
validate_consistency     80/80     gas-firmed band re-derived from AEMC 2025
                                   three panels failed on load timing and passed on rerun
validate_benchmarks      28/28
                                   peakerSeasonRatio confounded by 2025 fleet trend
validate_external         7/8      EDMSA CO2 (known); MTSAO OCGT 52.9% after the charging fix, was 58.9%
validate_outputs         42/42     Crisis 2023 checks now an inline stress scenario
validate_solve            8/8
audit.py                 87/87
total                   802/803

eng5.js                   6/6      check 4 now reads systemCostR, which carries shed energy

Every harness that names a preset now asserts it exists (one check each, 22 Sep 2026).
```

Benchmarks fails on coal against Ember (6.8% vs a 6% band), total generation (233.6 vs
218.8 TWh) and surplusGW (0.7 GW). External fails on NTCSA MTSAO 2030 gas (+333 GWh).

---

## The cost basis changed. This invalidates figures.

`avgCost` at defaults: R548.06 -> R883.50/MWh. Two costs that NO system-cost aggregate had ever
carried were added, and new-build capex started seeing technology learning.

```
                                    was              is
fixed O&M, existing fleet        absent         R61.6bn/yr   Eskom MYPD 6 calibrated
REIPPPP PPA obligation           absent         R11.7bn/yr   delivered output, expires 2034-41
newCapexR                     flat acap*    derived from BLD_COST at vintage
BLD_COST.offshore          R88,200/kW LCOE    R79,200/kW overnight + BLD_FOM
BLD_COST.offshore decl            6.0%            2.6%       ESMAP medium, was above their high
FIXED.rooftopMW                8,731.6          8,942.1      NTCSA Aug-26 less 488 wheeled
Deep decarb solar                52 GW            45 GW      swapped for 1 GW offshore
```

The consequential one for policy work: going fossil-free by 2040 rather than 2050 costs
**R49.3bn a year**, about 12%. Before the `newCapexR` fix the model said R1.2bn, because the
headline could not see ten years of learning. See RESULTS.md.

---

## Engine changes since 17 Sep

**Offshore wind runs on its own profile.** `nodal/profiles_offshore_regional.json`,
Renewables.ninja / MERRA-2 at seven ESMAP regions, twelve years, levels scaled to ESMAP Tables
16/17 and shapes as measured. Falls back to the ONSHORE shape with a console warning if the
file is missing - that fallback is wrong in energy and in variability and must not be quoted.

**The synchronous floor can be met without coal.** Grid-forming batteries at `SYNC_GFM_SHARE`
0.30 and `SYNC_CONDENSER_MW` count toward `SYNC_MIN_MW`. Before this a no-coal run failed the
6,000 MW floor in all 8,760 hours SILENTLY. `syncUnmetH` is returned so it cannot happen again.

**Demand shifting is lossy.** `drShiftLossPct` 6%: 100 MWh out of the peak returns 106 into the
trough. It was energy-neutral, which made demand response a free store.

**CCS applies to a share of the fleet.** `ccsSharePct`, default 100. At 100% the 25% parasitic
load removes about 10 GW of effective capacity and pushes the system onto diesel - a capacity
shock, not a carbon result. Set 24% for Medupi and Kusile.

**Diesel can be retired.** `dieselDecomMW`, 0-3,400 MW. NOTE: this control, the offshore wiring
and `BLD_FOM` all appeared during the 17-18 Sep session and I cannot account for their
provenance. They work and their comments are accurate. Check them against repo history.

---

## Later on 20 Sep. Six changes and a finding.

**Grid reinforcement is charged.** National slider capacity is allocated to provinces by the
2,597 REEA authorisations - revealed developer preference, not planning - then charged against
each region's headroom through the siting panel's own formula, now extracted as the shared
`gridBuildChargeFor`. Before this the sliders assumed a COPPERPLATE: Fossil-free 2040 put 130
GW beyond headroom, 87% of everything it builds, and connected it free.

**And headroom grows with the transmission plan.** `tdpHeadroomMW` phases in 221 TDP projects
by commissioning year, weighted by published phase because only 17% is in Execution.
`tdpConfidencePct` scales them all.

```
                                    reinforcement   avgCost
Deep decarbonisation 2035, TDP built      R2.35bn    R1,553
Deep decarbonisation 2035, TDP at zero    R9.82bn    R1,591
Fossil-free 2040, TDP built               R7.93bn    R2,185
Fossil-free 2040, TDP at zero            R17.38bn    R2,232
```

Delivering the plan is worth R9.5bn/yr to a fossil-free system.

**Scarcity pricing rebuilt, twice.** A peaker-net-margin circuit breaker on ERCOT's rule - the
cap drops for the rest of the year once cumulative margin passes 3x the cost of new entry.
Crisis 2023 went from 5,430 hours at the ceiling and R14tn of wholesale revenue to 125 hours
and R6.1bn. Then the three-step curve was replaced with the canonical CONTINUOUS form, a
price adder of LOLP x VOLL with LOLP from the normal CDF of reserve forecast error and
ERCOT's half-sigma conservative shift. Two checks now assert the breaker binds and trips.

**Retail rows renamed** from Agile-style, which is Octopus Energy's product name, to Dynamic
pricing, with a third row added: geyser, pool pump and EV charging, 65% moved to the six
cheapest hours. On Today 2026 the three read R3.81, R3.60 and R3.45 - the second increment
moves 26 more points of the day and buys 70% of what the first did.

### The finding: cost recovery was never the right metric

Crisis 2023 recovering 3,862% of system cost was flagged for days as a probable regression. It
was not one. Pricing every unserved hour at the value of lost load is the correct energy-only
rule; the fault was that the system had no EXIT from it, and separately that a system-wide
percentage was never the professional measure. PJM defines missing money per megawatt-year as
the gap between a unit's total costs and its energy and ancillary revenues. Net cost of new
entry is the right statistic and the model now returns the pieces for it.

Also corrected: our R87,000/MWh ceiling is USD 5,273, essentially ERCOT's offer cap, and
ERCOT sets the VOLL in its own curve EQUAL to that cap rather than to consumer interruption
cost. The model was already at the international level.

---

## Presets

```
IRP path 2035               22.2 onshore / 18.9 solar / 6.1 GW at 4h / 11.6 gas at a 50% floor
                            coal -16 GW; the counterfactual to read the two below against
Deep decarbonisation 2035   35 onshore / 35 solar / 0 offshore / 10.8 GW new rooftop / 17 GW at 12h + 1 GW iron-air (NEM standard, 2x margin; re-sized 2 Oct after the charging fix)
                            coal -27 GW, no new gas, reserve and inertia priced
                            curtailment 51 to 68 TWh across twelve weather years, median 63
Fossil-free 2040            35 onshore / 55 solar / 7 offshore / 16.8 GW new rooftop / 30 GW at 12h + 1 GW iron-air (NEM standard, 2x margin)
                            all coal and diesel retired; mean shed 3.1 GWh a year
                            curtailment 90 to 114 TWh across twelve weather years, median 106
IRP 2030, Grid delay        demand +20% (IRP growth on contracted demand, Mozal out), coal EAF 64%
```

Both renamed 19 Sep and both now price reserve and inertia, because leaving inertia unpriced in
a 2040 system models a market that cannot exist. Preset names are referenced by DISPLAY STRING
in twenty harness checks across six files, so renaming one is a coordinated edit.

---

## Three patterns, each seen repeatedly. Read these before searching anything.

**Single-year screening picks the wrong build. Four times now.** Four fossil-free builds showed
zero unserved on 2018; the worst failed at 969 GWh across twelve years. Always score on the
binding year across all twelve.

**The binding year depends on the BUILD, not the weather.** It has come out as 2014, 2016, 2018,
2020 and 2022 in different searches. Wind-heavy builds fail in a wind drought; offshore-leaning
builds fail when the coast is calm.

**The grid keeps missing the winning level. Three times.** Offshore stepped 0/5/10/20 and
0/10/20; the winners were 1 GW and 5 GW. Screen coarsely, then REFINE LOCALLY around the best
few - a uniform finer grid over five dimensions is unaffordable and still misses edges.

---

## More than one chat edits this file

Confirmed 23 Sep 2026. Content appeared in index.html twice this session that no session I can
account for wrote: the 168-hour storage lookahead's comment citing a personal communication from
the System Operator, and three rooftop-bill sliders with their constants. Both came from a
parallel chat working on the same file.

Two consequences, and the second is the one that bites. Unsourced content can arrive without
anyone noticing, so a comment citing a source nobody can find is worth checking rather than
trusting. And two chats editing one file will overwrite each other: whichever installs last wins,
silently. Say which files a session touched, and install them before starting another chat on the
same file.

## Finding named projects and their status

The two oldest data gaps are the same problem: the published sources are aggregate. The Hydra
Central split needs named operational plants matched to substations, and the 1,823 MW of solar
unexplained in identity 3 is private wheeled plant commissioned before the PFL monitor starts.
Both close with a project list carrying coordinates and a status.

Checked 23 Sep 2026, in the order I would try them:

1. Global Energy Monitor's Global Wind and Solar Power Trackers. Project-level, explicit status
   field, coordinates, capacity, owner, free for research, refreshed twice a year.
2. OpenStreetMap. Plant geometry with source and output tags. Good for existence and location,
   weak for status: mappers follow imagery updates, and construction tags are often left behind
   after completion. Use it for geometry and corroboration, not for commissioning dates.
3. Wikipedia's South African power station pages, which carry status, coordinates, construction
   start and expected commissioning, and are more complete than expected. Not a source to cite -
   a fast way to build a candidate list to check against primary sources.
4. #PowerTracker, identified 17 Aug 2026 and still not ingested. The South African source for
   wheeled commissioning specifically.

RenewMap, which prompted this, is Australia and New Zealand only. It is what a South African
equivalent should look like and nothing more.

The test for all of them is the same, and it is worth stating before starting: does the list
close the 1,823 MW, and can it place named plants at Hydra rather than in the Northern Cape?

## What this model does not answer about reliability

Noted 23 Sep 2026 from RMI's grid reliability guide and the decade-of-data work behind it.
Reliability is three things - resource adequacy, operational stability, and resilience - across
both the bulk system and the distribution system. This model does the first, nationally.

That is the right scope for South African load shedding, which is a generation shortfall, and it
is the wrong scope for the outages a Johannesburg or Tshwane household actually experiences,
which are mostly distribution: cable and transformer failures, theft, maintenance backlog. RMI's
US finding is that most outages originate there and that extra generation supply does little for
them. Do not let a distributed-generation case be argued from this model's adequacy results.

Two things worth taking from it regardless. Sequence cheapest first: this project's own
experience matches, since the storage lookahead and the adequacy hold removed gigawatt-hours of
shed energy at no capital cost. And their data shows renewable deployment has not worsened
reliability outcomes in the US, which is the empirical answer to the claim this model keeps
meeting in South African debate.

## Two ideas from other people's tools, 2 Oct 2026

**Replay reality, Fraunhofer-style.** Their price simulator re-clears Germany's actual day-ahead bids
with a hypothetical battery fleet, so nothing about the existing system is modelled and the baseline
cannot be argued with. The South African version needs no market: take ESK19679's real hourly
dispatch, April 2022 to August 2026, insert a battery fleet, and measure what it would have displaced
- diesel burned, peaks shaved, load shedding avoided in 2022 and 2023. It also tests the charging rule
above on real midday coal headroom. Their metrics are worth borrowing for the battery panel: daily
max-minus-min spread, hours above a price threshold, negative-price hours, solar capture value.

**A Sondeva-style tracker.** Sondeva aggregates every renewable project notice in Spain's national
and fourteen regional gazettes daily, links each entry to its official source, and separates active,
withdrawn and rejected. The South African equivalent would index NERSA registration notices, the
Government Gazette and DFFE authorisations. Probably a project of its own rather than a GridTwin
feature, but two pieces belong here now: source URLs and a status field on the private-project
queue, and a REEA_SHARE weighted by how often an authorisation is actually built.

## Report distributions, not single numbers

Prompted 30 Sep 2026 by Discovery Green's EnergyOS, which reframes renewable procurement as a
RISK problem rather than a commodity purchase and prices it with 10,000 consumption simulations,
87 million generation simulations and 200,000 forward price points.

The reframing is the useful part, and this model is half way there already. Adequacy is scored
across twelve weather years and reported as a mean and a worst year. COST is not: every system
cost, retail price and payback in this model is a single number from a single year, and the
weather spread behind it is thrown away.

MEASURED FIRST, 1 Oct 2026, and the headline item turned out to be empty. System cost across
twelve weather years spreads 1.4% on Deep decarbonisation and 0.1% on Fossil-free - because cost
in these builds is capital and fixed O&M, and only fuel cares about the weather. The weather risk
is an adequacy risk, not a cost risk, and adequacy is already reported as a mean and a worst year.

MEASURED TOO, same day: retail price spreads 1.2 to 1.9% across the twelve years, so it is empty
for the same reason. CURTAILMENT spreads 22 to 27% - 51 to 68 TWh on Deep decarbonisation, 90 to
114 on Fossil-free - and that is where the distribution belongs. Every curtailment figure this
project has published is from a single year, including the ones the hydrogen and long-duration
storage arguments rest on.

What is left, in order of value:

1. ~~System cost across the twelve years~~ - DROPPED. The spread does not exist; a panel showing
   it would display a flat line with authority.
2. **The retail price the same way.** A price that holds in a normal year and moves 15% in a wind
   drought is a different proposition from one that does not, and the panel cannot say which it is.
3. **The wheeling and rooftop paybacks the same way**, which is where it matters commercially:
   a payback range beats a payback.

What NOT to copy: their simulation counts. Ten thousand consumption simulations sounds impressive
and this model has twelve REAL weather years behind its variability, which is a stronger basis
than a synthetic distribution fitted to fewer. Report the spread we have rather than manufacturing
a larger one.

## Engine charging from coal: done, and what it leaves

DONE 2 Oct 2026, night. chargeFromThermal (default 1) lets the engine charge storage from coal
headroom in any hour its shortfall forecast says stress is coming. Stalled loop build 83 to 30 GWh
worst year; Deep decarbonisation preset 21 to 5. Fossil-free unaffected. MTSAO OCGT check flipped
from deliberate failure to pass at 52.9% against MTSAO's 45%, for the reason the fix was built.
Deep decarbonisation re-sized: lithium 20 to 17 GW, R6.7bn a year less. More coal cannot be retired
at that build. Loop still stalls at a factor of about 7; decompose again the same way.

## The adequacy loop: seven constants fixed, and the last gap is in the engine

UPDATED 2 Oct 2026, evening. Three more optimiser disagreements fixed - firm exports, reserve
pricing on tail days, a growth off-by-one. Worst year 152 to 83 GWh. The remaining stall is the
ENGINE: it charges storage only from renewable surplus, never from spare coal. In the stalled week
coal had 3 to 4 GW idle at midday while batteries stayed under 3% full, then the night shed about
the same energy. Real operation pumps from coal routinely.

THIS IS THE NEXT PIECE OF WORK, and it is not small: letting the engine charge storage from thermal
headroom when a shortfall is coming changes dispatch in every scenario and moves every adequacy
figure in RESULTS.md, in the optimistic direction for coal-retaining builds. It needs the full
suite before and after, a re-run of the twelve-year preset searches, and a decision about how much
foresight the charging rule may use - the engine looks 168 hours ahead already.

## The adequacy loop: four constants fixed, a factor of 34 left

UPDATED 2 Oct 2026, late. The stall was NOT storage foresight - the engine's battery was empty in
every shed hour. It was four constants the optimiser duplicated and got wrong: nuclear 0.9 against
the engine's 0.66, pumped storage counted as reserve with no energy, rooftop at full output against
a 0.78 derate, and no congestion loss against 4%. Fixed by reading the engine's keys. Worst year
366 to 152 GWh, still stalling at about 34 times the standard. NEXT: decompose the stalled week
again, the same way - compare each supply line between the two models, in GWh, for that week.
And sweep the rest of bldBuildLP for any other literal that has an engine key; four turned up in
one week, which suggests there are more.

The January timing was the engine's summer maintenance schedule: flattening it moves the worst week
to late May without changing the shortfall.

## The adequacy loop exists, and its stall is the finding

ADDED 2 Oct 2026, late. The ReEDS stress-period iteration is built: "Solve, then test against twelve
weather years" in the build panel. On Fossil-free 2040 it ran three passes and stalled at about
340 GWh in the worst year against a 4.4 GWh standard, because the week it would add was already
in the LP. The engine had more coal available that week than the LP assumed, so the residual is
storage dispatch - perfect foresight in the LP, a 168-hour heuristic in the engine. Next step if
this matters: compare the two models' battery state of charge through that week, which would
confirm or kill the explanation in one measurement.

The binding weeks were late January, not winter. Worth a test of its own before anyone repeats it.

## The build optimiser under-provides adequacy by a factor of 60, down from 250

UPDATED 2 Oct 2026. Items 1 and 2 below are DONE: a seven-day tail window with coal derated to the
worst measured week, and the engine's reserve requirement as a row in every hour. Mean shed on the
same 2040 build went 877 to 215 GWh, and wind came back into the build at 16 GW. What is left is
item 3, foresight, which a screening LP cannot close. The regional model has none of this, and that is now a decision rather than an omission: the
same three fixes were built on 2 Oct and took its 2030 LP from 23 MB to 48 MB and past the
browser's 900-second limit. Reverted. The regional optimiser is for WHERE, at a 2030 horizon; the
national one is for adequacy. If the regional fix is ever revisited, the route is fewer regions or
fewer calendar days to pay for the tail, not more hardware.

The original note, kept for the reasoning:

Measured 1 Oct 2026. A build the optimiser calls adequate sheds about 900 GWh a year in the
twelve-year dispatch against a standard of about 3.5. Adding the worst three-day window from the
other weather years, with shedding forbidden on it, cut that from 6,300 GWh and brought wind back
into the build - and left a factor of 250.

Three structural differences, in the order I would close them:

1. **Outages.** The LP gives coal a flat 64% in every hour. The engine draws forced outages with
   480-hour persistence, so a bad fortnight can lose several gigawatts. An outage allowance on the
   tail days - derate coal to the engine's worst-fortnight availability rather than its mean - is
   the cheapest fix and probably the largest.
2. **Reserve.** The LP holds none. The engine holds 2,200 MW plus a share of variable output in
   every hour. Add a reserve row per hour on the tail days at least.
3. **Foresight.** The LP dispatches each day perfectly. The engine looks 168 hours ahead through a
   heuristic. This one is inherent to a screening LP and cannot be closed; it can be measured.

Until then: every optimiser result is a screening proposal, the panel says so on apply, and the
twelve-year dispatch is the arbiter. Do not quote an optimiser build without it.

## Least-cost to 2040, with a build schedule

Requested 30 Sep 2026. Every preset here is a hand-set END STATE: a build somebody chose, checked
against twelve weather years. What the model cannot yet say is what the cheapest PATH looks like -
how much of what, in which year, between now and 2040.

Most of the machinery exists. The build LP co-optimises across years with build-rate caps, prices
capital at each year's vintage, chooses lithium's duration, and credits storage by what its energy
can sustain. What it does not do is reach 2040:

1. ~~BLD_YEARS stops at 2030~~ DONE 1 Oct 2026: the horizon is a control, 2030, 2035 or 2040,
   and the schedule is in RESULTS.md. Annual steps to 2040 solve in 7.6 seconds. What remains is
   below. The original note read: MEASURED 30 Sep 2026 in a variant copy: extending to 2040 in
   two-year steps takes the LP from 31,056 rows to 49,686 and from 1.7 seconds to 2.3. The
   horizon is not the obstacle. Whether annual steps to 2040 stay tractable is the open part.
   And the answer moves: at 2040 the optimiser builds 15 GW of storage AND 6.6 GW of gas at any
   storage pace, where at 2030 it builds no gas at all. See RESULTS.md - the no-gas finding is a
   five-year finding.
2. **Coal retirement should be a DECISION, not an input.** Today `coalDecomMW` is a slider the
   scenario sets. In a least-cost path the LP should choose when each station goes, against its
   own fixed O&M and the cost of replacing it - the per-unit dates in UC_FLEET are already there.
3. **The answer must be checked, not trusted.** The LP screens on representative days with
   perfect foresight; it is a proposal, not a result. Every path it produces goes through the
   twelve-year dispatch against the NEM standard before it becomes a preset, which is how the
   current two were built.
4. **Report the schedule, not just the end state.** The output worth having is a table by year -
   what is built, what retires, what it costs - because that is the thing a plan can be compared
   against. The IRP publishes exactly that shape, and the IRP path preset would then have a
   like-for-like counterpart rather than an end-state comparison.

Worth knowing before starting: the build pace is what decided the gas question, and over fifteen
years it will decide more. A least-cost path at 2 GW a year of storage and one at 0.6 GW are
different plans, not different numbers, so the pace belongs in the output alongside the build.

## An industrial electrification scenario, to be built

SCOPE SET 1 Oct 2026: this is a research project, not a scenario switch, and it is parked until
the data gathering can be done properly. The flat-block measurement in RESULTS.md is a first cut
that says the price loop closes and the adequacy wall is near 3 GW. It is not the answer and
should not be quoted as one.

WHAT THE COMPREHENSIVE VERSION NEEDS, in the order it has to be built:

1. **How much industrial energy use can be electrified, by sector and temperature band.** The
   starting point is the DMRE energy balance - final consumption by sector and fuel - split into
   process heat, motive power, and feedstock. Feedstock cannot be electrified and has to come out
   first. Then heat by temperature: below 100C, 100 to 200C, 200 to 500C, above 500C, because
   heat pumps reach the first two commercially, resistance and induction the third at a cost, and
   the fourth is where the hard-to-abate argument lives. The IEA's 40% competitively electrifiable
   share is a global figure and a placeholder until the South African split exists.
2. **What each sector's load looks like.** Not one national block. Smelters are flat and enormous;
   food and beverage follows shifts; cement and chemicals have their own patterns. Eskom's
   Megaflex customer categories and the hourly dataset are the route to measured shapes, and this
   is the step the whole argument turns on - a flat block and a shift-pattern block give different
   adequacy answers and different prices.
3. **The coefficient of performance by application**, because a heat pump delivering three to five
   units of heat per unit of electricity is what makes the electricity demand smaller than the
   fuel it replaces. Resistance heating is one for one and changes the arithmetic entirely.
4. **The fuel side.** Industrial coal and gas prices, and the gas cliff from about 2028, which is
   the forcing function nobody has priced: industry losing Mozambican gas has to go somewhere.
5. **Where the load sits.** Mpumalanga, Richards Bay, the Vaal and Saldanha are not
   interchangeable on a grid with regional headroom. This is where the nodal model earns its keep.
6. **Only then the loop:** does the price fall enough, and does the fall make the next switch
   cheaper than its fuel alternative.

THE QUESTION, sharpened 1 Oct 2026: is there a virtuous circle? Electrifying industrial heat adds
load; the network and the legacy asset base are fixed costs recovered over sales; so more sales
should mean a lower price for everyone, which in turn should make the next factory's switch to
electricity cheaper. If that loop closes, industrial electrification is not just a decarbonisation
measure, it is a tariff measure, and it argues for itself.

The model can test both halves, and the second half is the one nobody asks:

**Does added industrial load lower the price for existing customers?** The retail stack already
separates fixed from variable cost and divides by sales, so the mechanism is there to measure
rather than assert. What it must also carry is the offsetting term: new load needs new generation
and new network, and the reinforcement charge already prices the second. The question is net.

**Does the lower price make electrification cheaper?** This is the feedback leg. A heat pump
displacing coal or gas heat competes on a delivered-energy basis, so the switch gets cheaper as
R/kWh falls, and at some point it crosses. The model carries the electricity side of that
comparison; the fuel side needs industrial coal and gas prices, which the DMRE energy balance and
the gas-cliff work can supply.

WHAT WOULD FALSIFY IT, and this is the honest version to test first: the added load is not free to
serve. If it lands on the evening peak it needs capacity, and the capacity cost per unit could
exceed the fixed-cost saving per unit. The whole argument turns on the SHAPE - industrial heat is
close to flat and the system spills 50 to 115 TWh a year at midday, so the load may be nearly free
to serve or not, and only a dispatch with the real profile will say which. Do not build it as a
percentage on the demand curve.

Proposed 23 Sep 2026 after the IEA's Electrification special report. The question: what does
electrifying South African industrial heat do to the price everyone else pays?

The hypothesis is that it lowers it, because the network and the legacy asset base are fixed
costs recovered over sales, and sales have been falling since 2012. More load spreads them. This
model can test that directly - the retail stack already separates fixed from variable, and the
sales denominator is already the thing that broke the retail figures in September.

What it needs, roughly in order:

1. A demand block with its own SHAPE, not a percentage on the existing curve. Industrial heat is
   close to flat, which is the opposite of the residential evening peak, and a flat block is the
   best thing that can happen to a system with 100 TWh of midday spill. Adding it as a growth
   percentage would miss the entire point.
2. A size, from the IEA's competitive potential: about 40% of fossil-based low- and
   medium-temperature industrial heat is electrifiable at today's costs. South Africa's
   industrial fuel use has to be sourced separately - the DMRE energy balance is the obvious
   route.
3. Heat pump efficiency of three to five units of heat per unit of electricity, so the
   ELECTRICITY added is a third to a fifth of the fuel displaced. This is what makes the load
   smaller than people expect.
4. The retail read-through, which is the actual finding: the same fixed costs over more sales.
   Watch the sales denominator, the network line and the fixed-charge share in the bill view.

Two things to be honest about when it is built. New load needs new generation and new network,
so the fixed-cost saving is not free - the question is whether a flat load that uses existing
spill costs less to serve than it contributes. And the model has no industrial customer class:
the retail panel is residential, so a price effect would have to be read at the wholesale and
network level rather than off a household bill.

## Open, in the order I would take them

1. **Regional congestion is PROVINCIAL, not nodal.** Allocation and headroom are both by
   province, so the model cannot see which corridor within a province binds. The flat 4%
   congestion derate remains alongside the reinforcement charge and is still a NERSA
   compensation ceiling used as an expected rate.
2. **Offer cap versus economic VOLL.** Both are R87,000 here. ERCOT cut its parameter from
   USD 9,000 to 5,000 after February 2021; MISO caps its curve below its administrative
   load-shed price. Treating it as a policy lever is a scenario we do not offer.
3. **Superseded: regional congestion assignment.** The flat 4% derate is a NERSA compensation CEILING used
   as an expected rate, and a national scaling built on 19 Sep was removed the same day: every
   region holding existing wind has ZERO headroom, and all 19,940 MW of it sits where the wind
   is worst. A national average cannot represent that. The job: route slider capacity through
   regional allocation weighted by revealed developer preference (existing capacity plus the
   2,597 REEA authorisations); congestion per region against regional headroom; a headroom
   growth path from `tdp_projects.json`, currently unused, so a 2040 run does not use a 2025
   snapshot; reconcile with the siting panel, which currently bumps the sliders rather than the
   reverse; then re-measure every curtailment figure.
2. **Nothing since `2026-09-11j` has been seen rendered.** Six controls and several panel
   changes have gone in since. jsdom stubs the canvas and does no layout. A temporal-dead-zone
   error on 17 Sep parsed cleanly, passed a parse check, and was caught only by rendering.
3. **`bessBenchmark` is a price-taker with no capture cap.** Reports R28m/MW-yr arbitrage on a
   R0.75m asset in high-renewables builds. The 284% and 134% cover figures come from it.
4. **Cost-recovery magnitudes not quotable.** Crisis 2023 returns 4,904% of system cost.
5. **Municipal customers are not modelled.** Roughly half of households buy from a
   municipality. Largest scope gap and it blocks the PARI Gauteng work.
6. **Baseline vintage.** Grid demand 217.5 TWh against 209.6 for 2025 and 198.1 annualised for
   2026. Structural decline or cyclical? It blocks the band on the grid-served check.
7. **Re-run both presets with a finer search**, per the pattern above.
8. **`SYNC_MIN_MW` conflates inertia with system strength.** AEMO treats them separately:
   inertia adequate, system strength short and NODAL in MVA. Same category of error as a
   national congestion derate.

---

## Assumptions that are brackets, not measurements

Flagged because each currently carries a published figure:

```
SYNC_GFM_SHARE 0.30        grid-forming share of storage. Used in two places since 19 Sep,
                           when they disagreed at 0.30 and 0.50.
ORDC_SIGMA_FRAC 0.21       reserve forecast error sd. ERCOT measures it by season and time
                           block; no SA equivalent is published. CALIBRATED so a met
                           requirement costs nothing and an empty one approaches the cap.
TDP_PHASE_CONF             Execution 1.0 down to Pre-Concept 0.15. A judgement, not a
                           published probability.
REEA_SHARE                 where new build goes. Revealed preference from authorisations,
                           recompute when the REEA file refreshes.
FLEX_SHIFT_SHARE 0.65      geyser plus pool pump plus EV. The 39% geyser figure is sourced;
                           this increment is reasoned from appliance loads.
drShiftLossPct 6%          LBNL measures 10-20% for pre-cooling; geysers sit lower. Not SA.
fom* per-technology split  international weights; the LEVEL is Eskom. MYPD 6 Table 54 would
                           replace the split and leave the total unchanged.
ppaWindR / ppaSolarR       one average across bid windows. BW4 wind cleared near R620/MWh
                           against BW1 above R1,500.
BLD_COST decl rates        BNEF 2035 for most, ESMAP for offshore. Mixed sources in one table.
```

---

## Working method

**Measure before concluding** still holds, and this week it caught three of my own reversals:
offshore does NOT improve solar economics, the midpoint vintage is MORE accurate rather than a
simplification, and going early DOES cost materially once the headline could see learning.

**A wrong explanation is worse than none.** A comment saying offshore displaced solar from
already-spilled hours was the reverse of what the measurement showed. A superseded comment four
lines from live code cost a day the week before. Both are in RULES.md now.

**Share before reporting.** Three times files were described as delivered when only the copy had
run. The fix is mechanical: end the turn with the file, never write "above" in prose.
