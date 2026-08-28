# GridTwin ZA - session log

Reverse chronological. NOTHING HERE IS AUTHORITATIVE. This is the archaeology:
why things were done, what was tried and reverted, what a number used to be.
For what is true NOW, read STATE.md. For the rules, read RULES.md.

An entry here can be stale and that is fine. An entry in STATE.md cannot.

---

## SATURATION CURVE - BUILT AND VERIFIED (27 Aug 2026)

Battery revenue per MW as the national fleet grows, 0.5 to 10 GW. Built in
`bessSaturationCurve()` and `renderBessSaturation()`, wired into `run()`.

WHAT IT SHOWS, measured with reserve pricing switched on:

```
  fleet      ancillary R/MW/yr      total R/MW/yr
  0.5 GW            197,100              304,165
  3   GW            197,100              304,165
  4   GW            189,216              296,281
  6   GW            126,144              233,209
 10   GW             75,686              182,751
```

Ancillary falls 61.6% between 0.5 and 10 GW. That understates against ERCOT's
~90%, and the panel says why: arbitrage is held flat because modelling its
saturation needs a dispatch re-run at every fleet size.

THE KNEE IS THE FINDING, not the percentage. Revenue is FLAT to about 3.8 GW,
then falls. The saturation factor caps at 1 until the fleet's contribution
exceeds the reserve requirement, which at 6% of a 32 GW peak is 1,920 MW,
reached when the fleet passes ~3.8 GW. South Africa's fleet is 3,700 MW. The
country is sitting almost exactly at the knee - the last point at which a new
battery earns the full ancillary rate. That is the story worth telling.

IT SHOWS NOTHING AT DEFAULTS, BY DESIGN. `asReserveOn` and `asInertiaOn` default
false, per the 17 Aug decision that South Africa procures no ancillary services
today. That decision is correct and the global defaults must NOT change - they
would move dispatch across the whole model. Instead the panel explains itself:
with ancillary off it states that the line is flat and shows arbitrage only, and
names the toggle to enable. Verified: no NaN in the rendered HTML.

### FOUR BAD READS OF KEYS THAT DO NOT EXIST

`FIXED.psMW` and `FIXED.battMW` are not keys of FIXED. The real keys are
`psPowerMW` (2,900) and `battPowerMW` (800). Both were read at TWO sites:

    8687  bessRevenueStack     the saturation factor itself
    8751  bessSaturationCurve  the "about here today" marker

All four resolved to `undefined`, fell through `|| 0`, and produced a fleet of
ZERO. The marker pointed at the 0.5 GW row against a real 3,700 MW fleet, and
more consequentially the revenue panel computed its saturation factor against an
empty fleet from the day it was added. Both fixed; the marker now lands on 4 GW.

THE `X || <literal>` RULE NEEDS SHARPENING. As written it covers a fallback that
DISAGREES with a constant. This was a fallback for a key that DOES NOT EXIST -
different failure, identical signature, and the structural check cannot catch it
because there is no constant to compare against. A fallback of `0` produces a
plausible chart rather than a crash, which is why 683 checks passed over it.

PROPOSED HARNESS CHECK: extract every `FIXED.<identifier>` read from the inline
scripts and assert each names a real key of FIXED. It belongs in
`validate_lint.js`, which already does the one-rule job of finding identifiers
that resolve nowhere - this is the same fault one level down, on properties
rather than names. Score it against the pre-fix file first: it must report
exactly four failures at 8687 and 8751. A check that cannot fail proves nothing.

### GOTCHA: these two functions read the GLOBAL state

`bessRevenueStack` and `bessSaturationCurve` read `state` directly rather than
taking it as an argument. A test that overrides state by passing an object to
`simulate()` will silently measure the DEFAULT scenario. This cost a false bug
report during verification: the curve looked broken with ancillary "on" because
the toggle had been set on a copy. Mutate the global, or the test lies.

ALSO IN THIS PASS: `state.asReserveShare` defaults to 0.15 and `_resReqMW` is
hardcoded as 6% of peak in the panel. Both mirror the engine. If either moves in
the engine, this panel silently disagrees - a second copy of a constant, which is
the thing the no-constant-appears-twice rule exists to prevent.

## COD RECONCILIATION - BUILT (27 Aug 2026)

WHY. Mulilo Total Hydra Storage reached commercial operation in H1 2026 and is
counted NOWHERE - not in regional_renewable_capacity.json, not in
ipp_pipeline.json. It was found only because someone read a PFL briefing PDF.
Doornhoek hit the same gap earlier and was caught by hand. Projects fall between
an IPP Office cutoff and the next compile, and nothing was watching.

NEW FILE: nodal/pfl_cod_h1_2026.json
  All 17 projects from PFL Table 1, with mw_installed AND mw_contracted. The two
  differ for storage and hybrids: Mulilo's 216 is MWp of solar behind a 75 MW
  dispatchable contract, and Umoyilanga's 108 sits behind 55 MW. Using the
  installed figure would treble Northern Cape solar.
  13 of 17 now carry a verified COD with a named source. Only ARM Platinum is
  undated; the three captive plants are excluded by design.

NEW CHECK in validate_capacity.js
  Every commissioned project must appear in the capacity file or the pipeline
  file. Reports 17/18 and names Mulilo. THAT FAILURE IS BY DESIGN - a standing
  flag for a real data gap, not a broken test. It goes green when the project is
  added. Do not "fix" it by relaxing the check.

THREE THINGS THE CHECK LEARNED THE HARD WAY
  1. It first flagged EIGHT projects, most wrongly. Projects commissioned before
     the cutoff sit inside IPP Office provincial aggregates and never appear by
     name, so absence is correct for them. Only projects with a verified COD
     AFTER the cutoff must be named.
  2. THE CUTOFF DIFFERS BY ROUTE. Public capacity is IPP Office at 31 Mar 2026;
     private is the PFL monitor, running to 30 Jun. A private project
     commissioned in April is covered; a public one on the same date is not.
     Umsobomvu exposed this - COD April 2026, private, wrongly flagged.
  3. It reads EVERY pfl_cod_*.json, not one filename. Pointing it at a newer H2
     register would silently drop H1 coverage and any unresolved H1 gap with it -
     exactly how Mulilo went missing. Tested with a stub H2 file: both flagged.

MULILO, UNRESOLVED. PFL places it in H1 2026 (to 30 June). Engineering News
reports it "officially inaugurated and brought into operation on July 16, 2026".
Both are after both cutoffs so it is uncounted either way, but the month decides
whether it belongs in 2026 H1 or H2. The PFL IPP Knowledge Hub publishes CODs
and is the source for their Table 1 - that would settle it.

ALSO FIXED: validate_consistency denominator. It excluded imports while the KPI
panel included them; the gap sat inside tolerance until congestion curtailment
widened it. Imports ARE generation delivered to the grid. Fixing it exposed a
second fault - the energy check added importsTWh on top of a dom_ that now
included them, double-counting by exactly E.imports. The rule, stated once:
dom_ is EVERYTHING DELIVERED TO THE GRID, imports in, storage out. Compare
directly, never add a component back. This has caused a false failure twice, in
opposite directions.

## CONGESTION CURTAILMENT - BUILT (27 Aug 2026), plus one open disagreement

WORKS NOW. The 26 Aug attempt failed because it wrote into curtailMW, which the
price engine reads as its oversupply signal:

    ((curtailMW[h]||0) > 1) ? 0 : ...        sets the marginal price to zero

Writing there every hour zeroed the whole series - average price fell from
R755/MWh to -0.03. This version uses its OWN accumulator, congestMW, which is
reported and charted but never consulted by the price engine. Congestion
curtailment does not mean national surplus: one corridor is full while other
regions still import, so it must not zero the national price.

    off          0 TWh   wind 12.92   pv 6.45   price R755
    4% (NERSA)   1.55    wind 12.40   pv 6.19   price R756
    8%           3.10    wind 11.88   pv 5.93   price R757

Defaults ON at 4%, NERSA's approved ceiling from September 2025.

TRAP FOR NEXT TIME: there are TWO windGen declaration sites. The block must go
on the one whose loop accumulates E.wind, or the energy totals do not move while
congestMW does. I put it on the wrong one first and the numbers looked plausible.

OPEN: KPI "Renewables" now reads 17% against the harness's 18.2%. The two use
different DENOMINATORS and always have - the gap was just under tolerance before
curtailment widened it:

    panel     genTWh includes imports, excludes pumped storage and batteries
    harness   dom_   excludes imports, excludes storage

The PANEL looks right. Imports are generation delivered to the grid and belong
in the denominator; storage output is energy already counted once at generation
and would be double-counted.

DO NOT simply relax the harness to make this pass. Decide which definition is
correct, apply it in both places, and write down why. This is also the question
behind "is our renewable share higher than Ember's" - same definitional problem,
and worth settling once.

## MONTEL / MODO-STYLE ADDITIONS (27 Aug 2026)

Four candidates. The first is BUILT (see the entry above); the rest are queued.

1. SATURATION CURVE - battery revenue per MW as the fleet grows, 0.5 to 10 GW.
   Modo's signature chart. The machinery exists: the ancillary panel already
   models the reserve pot as fixed with per-MW revenue falling as the fleet
   grows, calibrated against ERCOT's ~90% fall and GB's 87% to 33%. It computes
   one point and discards the curve. BUILT AND VERIFIED 27 Aug 2026.

2. REVENUE TRAJECTORY BY YEAR - 2026 to 2035. Heavier: needs the build
   optimiser's capacity path feeding the dispatch engine year by year.

3. NEGATIVE AND ZERO PRICE HOURS - priceStats.zeroHours already exists. It is
   the leading indicator of curtailment risk, which matters given curtailment
   jumped an order of magnitude in H1 2026. Small.

4. CAPTURE RATE BY TECHNOLOGY OVER TIME - the cannibalisation story. Capture
   prices per technology already exist; showing solar's erode as penetration
   rises is something nobody publishes for South Africa.

## PPA TOOLKIT - DESIGNED, NOT BUILT (27 Aug 2026)

Prompted by pypsa-ppa.streamlit.app, which optimises a renewable portfolio
against PPA contract terms. Open source, forkable, same solver as GridTwin
(HiGHS) and same profile source (renewables.ninja).

WHY IT IS WORTH BUILDING HERE. Their data note says it plainly: "Currently
supported locations are in Europe only." It runs on ENTSO-E day-ahead prices,
and South Africa has no day-ahead market - SAWEM is still being designed.

GridTwin already produces the missing input. The hourly shadow price series is
the closest thing the country has to a day-ahead curve, and the regional
profiles and wheeling costs sit alongside it. So this is not a port. It is a
thing only GridTwin currently has the inputs for.

WHAT THE WHEELING TAB LACKS
  It prices the network charges - Gen-DUoS, WEPS credit, the GCC exclusion -
  and ignores the CONTRACT, which is what decides whether a portfolio works:
      delivery obligation      the share of load the portfolio must cover
      shortfall cap            how much may be bought from the market
      penalty multiplier       what an uncovered MWh costs
      bid-offer spread         what market cover actually costs
  And it prices one arrangement rather than optimising across arrangements.

THE ONE NUMBER TO BUILD FIRST
  BREAKEVEN PPA PRICE. Given a load profile, a candidate portfolio and a
  region, what price clears? It uses the shadow prices, regional profiles and
  wheeling costs that already exist, and it is the number a developer and an
  off-taker actually negotiate over. Everything else on their feature list is a
  refinement of it.

STEAL THE FRAMING. Their case studies are posed as QUESTIONS, not parameter
sets: "Can a wind-dominant portfolio with no storage hit a 70% delivery
obligation against this weekday-heavy industrial demand?" That is better design
than a scenario dropdown and it costs nothing to adopt.

  South African equivalents worth writing:
    Smelter on Ruraflex     can a Northern Cape wind PPA beat the megaflex
                            tariff once wheeling and the GCC exclusion are paid?
    Mine with a flat load   what does 90% delivery cost against a 24/7 profile
                            when the corridor is already congested?
    Data centre             near-flat load, premium price, near-zero market
                            cover - the case Teraco and others are signing now
    Green hydrogen          flexible demand that follows solar, which is the
                            one South African load that genuinely helps

DECIDED 27 Aug: BUILD IT AS AN ADJACENT SITE, NOT INSIDE GRIDTWIN.

  Fork their repo rather than writing the LP. They have a Fork button and an
  "Import custom timeseries" feature that accepts your own data for any weather
  year, so PyPSA does the optimisation and GridTwin supplies South African
  inputs:
      hourly shadow prices  ->  their spot price series
      regional profiles     ->  their wind and solar series

  Deploy on Streamlit Community Cloud, free. Point a subdomain at it -
  ppa.gridtwinza.org - or give it its own domain if it is to stand alone
  commercially.

  WHY SEPARATE. GridTwin's 290-check suite stays untouched; a bolted-on feature
  is how the price series got broken on 26 Aug. Different audience too:
  GridTwin serves journalists and planners, this serves developers and
  off-takers. Python is fine because the two share DATA, not code.

  FIRST PIECE OF WORK: an exporter that emits GridTwin's shadow prices and
  regional profiles in their CSV template. Contained and testable. Do it at the
  start of a session, not the end of one.

SCOPE WARNING. Their stack is Python, PyPSA, Streamlit, server-side HiGHS.
GridTwin is one HTML file with HiGHS as WASM in the browser. A fork means
maintaining a second stack; building it in means a new LP with contract
constraints plus a levered finance model for IRR and NPV. Multi-session work.

WHO WANTS IT. EIUG's 25 members are industrial off-takers facing tariff
escalation and CBAM exposure, and none of them can currently answer "should I
contract Northern Cape wind or Free State solar, and how much". Their October
conference covers tariff escalation, CBAM and market reform.

## CONGESTION CURTAILMENT - ATTEMPTED AND REVERTED (26 Aug 2026)

WHY IT IS WANTED. Curtailment in H1 2026 ran roughly an order of magnitude above
all of 2025, and IPPs report revenues about 9% below budget. The instant engine
reports ZERO curtailment in the base case because it is single-node and has no
corridors to congest, so the "today" view says something is not happening that
very much is.

THE PARAMETER IS PUBLISHED. NERSA approved a 4% congestion curtailment ceiling in
September 2025, expected to unlock 1,180 MW of Western Cape wind. Compensation
runs only to 2028 under the pilot. That is citable, not fitted.

WHY THE ATTEMPT FAILED - the trap for whoever tries next:

  curtailMW[h] CARRIES TWO MEANINGS. It records curtailed energy, and it is also
  the price engine's signal for oversupply. Writing into it every hour told the
  engine the system was in surplus in all 8,760 hours. The average price
  collapsed from R755/MWh to -0.03 and every capture price went with it.

  The physical reasoning was right: congestion curtailment happens regardless of
  national surplus, so it belongs before residual is computed. The implementation
  reused a variable whose second meaning was never checked.

  A first attempt put the block INSIDE the `if(residual<0)` branch, which meant
  it only fired in hours the country already had too much power - precisely the
  assumption it exists to correct. That version had no effect at all.

WHAT TO DO DIFFERENTLY
  Track congestion curtailment in a SEPARATE accumulator, not curtailMW. Add it
  to reported totals at the end, and leave the price engine's surplus signal
  alone. Check every consumer of curtailMW before touching it.

ALSO NOTE: the two windGen declarations differ. The instant engine uses `let`
because its surplus block reassigns windGen and pvGen; the other site uses
`const`. Forcing both to const throws "Assignment to constant variable".

## BUILD LP - RESOLVED (21 Aug 2026). IT WAS NEVER BROKEN.

The build optimiser solves. The "infeasibility" was entirely in my diagnostic
harness, which passed demand growth as a PERCENTAGE where the code expects a
FRACTION:

    const dg = Math.pow(1 + growth, y - 2026);
    growth:5    ->  demand x 1,296 by 2030,  x10,077,696 by 2035
    growth:0.05 ->  demand x 1.2 by 2030

Unserved energy is bounded at 60,000 MW per region-hour, so serving 1,296x
demand is impossible and the solver said so. The feasibility "boundary" I mapped
between 0% and 2% growth was 1^n versus 3^n - an artefact of my own units error,
not a property of the model.

TWO EARLIER HEADROOM FIXES WERE REVERTED ON THIS BAD EVIDENCE. Both were fine.

WHAT IS NOW FIXED. All storage shares the region's connection headroom, floored
at the region's own peak demand. Verified with a real solve before shipping:

    vanadium   62.70 GW  ->  19.74 GW      headroom now binds
    solves     yes, 164s on the masterplan pace, 6/6 solve checks

LITHIUM AT ZERO - SOLVED. IT IS A DEGENERATE OPTIMUM, NOT A DEFEAT.

The reduced costs settle it (reduced_cost_test.js):

    b_batt      primal 0.0   reduced cost           0
    b_vrfb      primal 0.0   reduced cost           0    built in other regions
    b_ironair   primal 0.0   reduced cost           0
    b_wind      primal 0.0   reduced cost   3,775,890    genuinely uneconomic

A variable at zero with a reduced cost of ZERO is EXACTLY break-even: one more MW
changes the objective by nothing. Compare wind in the same region, 3.8m per MW
short of being worth building - that is what losing actually looks like.

So lithium is not losing to vanadium. Storage sits on a FLAT surface where many
different mixes cost the same, and the simplex lands on whichever vertex it
reaches first. The 19.74 GW vanadium / 0 GW lithium split is one arbitrary point
on that surface, not a finding.

WHAT THIS MEANS FOR THE PANEL. The storage TOTAL is meaningful; the MIX is not.
Presenting a technology split as a model result would be misleading, and small
parameter changes will flip it for no economic reason. Either report storage as a
single total, or add a tie-break that makes the choice deterministic and say what
it is.

THEORIES TESTED AND REFUTED ALONG THE WAY, so they are not retried:
  - out-competed by vanadium   no: lithium alone still builds 0.00
  - duration step change       no: lithium at 8h still builds 0.00
  - existing fleet satisfies   no: BLD_EX_BATT is only 800 MW nationally
  - the rb_ reserve asymmetry  never needed testing once the duals were read

SEPARATE REAL BUG FOUND. vrfb and ironair have NO rate_ or rrate_ build-rate
constraints and no explicit variable bounds, where wind, pv and batt all do:

    wind     rate_ 5   rrate_ 50
    pv       rate_ 5   rrate_ 50
    batt     rate_ 5   rrate_ 50
    vrfb     rate_ 0   rrate_ 0
    ironair  rate_ 0   rrate_ 0

So the two new technologies ignore the build-rate pace entirely - the masterplan
and grid presets do not constrain them. That is why vanadium could reach 62 GW
before the headroom fix. FIX THIS: add vrfb and ironair to whatever emits rate_
and rrate_.

LESSON. Every other harness passed throughout. A harness that checks SHAPE
cannot catch a model that will not solve, and a solve harness with a units bug
is worse than none - it looks like evidence. Check the harness against a known-
good case before trusting it to condemn the model.

## SCOPE-LEAK BUG IN THE SITE RESOURCE QUERY - FIXED (20 Aug 2026)

Reported by the user: clicking the map in the site resource query returned
"Error: battEffMix is not defined / Open-Meteo may be temporarily unavailable."

NOT a network problem. battEffMix is a const declared inside simulate(). It was
referenced from hourlyMatch(), nested in initResourceQuery(), which sits roughly
156,000 characters EARLIER in the file - a different scope entirely, so the name
could never resolve. The caller's catch block then blamed Open-Meteo, which made
a hard code fault look transient.

FIX: hourlyMatch sizes a 24/7-matched build with a 4-hour battery
(battPower = battEnergyMWh / 4), so it is lithium. It now reads the lithium round
trip directly - FIXED.battEff ?? 0.88 - rather than a blended figure that has no
meaning in that function. Checked the same function for other simulate-locals:
battPower is properly declared there, so battEffMix was the only leak.

WHY NOTHING CAUGHT IT. The engine harnesses never call the resource query, and
the structural audit checks DECLARATIONS, not uses.

ATTEMPTED A STRUCTURAL CHECK AND REVERTED IT. Three iterations of a regex to
find simulate()-local names used outside simulate() all failed: the first flagged
names legitimately declared in other functions, the second flagged result-object
properties (r.tierDis), the third flagged mentions inside comments, and the final
version STILL did not catch battEffMix when reintroduced - the "declared outside"
pattern matched `battEffMix)` as though the closing paren made it a parameter.
A check that both false-positives and misses the real bug is worse than none.

THE RIGHT TOOL IS A LINTER, not a regex. eslint's no-undef would catch this class
outright. Worth doing if this recurs; noted rather than half-built.

## BATTERY REVENUE SPLIT PANEL (20 Aug 2026)

New panel showing what share of a four-hour battery's income comes from each of
the three streams every BESS benchmark reports. Requested after reviewing how
Modo Energy and others present it.

THE INDUSTRY CONVENTION, confirmed across Modo's ME BESS indices for GB, ERCOT,
Germany and PJM - all report the same three, and call the combination
"revenue stacking":

    ENERGY ARBITRAGE     charge cheap, discharge dear
    ANCILLARY SERVICES   paid for capacity HELD, not energy delivered
    CAPACITY PAYMENTS    paid for being available, whether or not it runs

WHY THE SPLIT IS THE NUMBER PEOPLE WATCH: ancillary markets are small and
SATURATE as fleets grow, pushing revenue into arbitrage. Published figures used
in the panel note:
    ERCOT   84% ancillary in 2023 -> 35% by 2025, fleet grew ~7x (2.0 -> 14.4 GW)
    Germany 55% ancillary in 2026, forecast 95% wholesale by 2030
    GB      wholesale + Balancing Mechanism ~60% of the stack

SOUTH AFRICA SITS BEFORE THE START OF THAT CURVE - further back than any of
them, because it has NEITHER market. Both sliders default to zero, so the split
reads 100% arbitrage until they are turned on. The panel says so explicitly
rather than showing two empty rows without explanation.

RESULTS, 4h battery on the Future mix with 20 GW of new battery (R k/MW/yr):

    scenario                     arb    anc    cap   total   A/N/C %
    today, no markets            1352      0      0    1352   100/0/0
    + capacity R300/kW/yr        1352      0     75    1427    95/0/5
    + reserve R200 (15% held)    1882    263      0    2144    88/12/0
    + reserve R200 (35% held)    3444    613      0    4058    85/15/0
    all three on                 1882    338     75    2294    82/15/3

EXCLUSIVITY IS ENFORCED, and this needed a second pass. The first version
reported the FULL arbitrage benchmark alongside reserve revenue on the same MW -
exactly the double-count the benchmark panel already warns about as "the classic
error in battery business cases". Arbitrage is now scaled by (1 - held share),
matching the Grid Code rule the dispatch engine enforces.

Note the counterintuitive but correct result: raising the held share RAISES
arbitrage revenue per remaining MW. Holding storage back leaves prices less
smoothed, so the spread widens for whatever is still trading.

De-rating for the capacity stream matches the capacity payment panel - a 4-hour
battery credited at 25% of nameplate. Inertia counts a battery at half its
power, matching inertiaCapableMW in the engine.

290/290 - 46/46 - 138/138 - 14/14 - 18/18 - 9/9 - 77/77 - 40/40 - 16/16 -
33/33 - 29/29.

## NAV LINKS WERE JUMPING TO THE WRONG PLACE - FIXED (19 Aug 2026)

Reported by the user after the panel reorder: clicking Network landed somewhere
unrelated on the page.

TWO SEPARATE BUGS, found in sequence:

1. #nav-network lived on a <section> wrapper. The reorder pulled the panel OUT
   of that section, leaving an empty shell behind. Clicking Network correctly
   jumped to the anchor - which now pointed at a zero-height empty element
   wherever the reorder had left it. Fixed by moving the id onto the panel
   itself and removing four empty section shells the moves left behind.

2. EVEN WITH THE RIGHT ANCHOR, plain #links were still landing wrong. Panels
   above the target are still growing while the browser scrolls - charts
   drawing, tables filling, the Leaflet map loading - so by the time a native
   anchor jump finishes, the target has moved down the page and you land
   somewhere else. scroll-margin-top on the anchors does not help, because it
   only offsets a jump that is already correct; it cannot fix one aimed at a
   moving target.

FIX: intercept nav clicks, scroll to the target manually (accounting for the
60px sticky bar), then correct TWICE more as the layout settles - once after
350ms (smooth scroll duration) and once after 900ms (late-rendering panels).

VERIFIED with a simulated real layout (target at y=2400): expected scroll
position 2400 - 60 = 2340, actual scrollTo() call matched exactly.

290/290 · 46/46 · 138/138 · 14/14 · 9/9 · 77/77 · 40/40 · 16/16 · 18/18 · 33/33 ·
29/29 · 6/6.

## PRICE GAP MEASURED, AND THE TASK RENAMED (18 Aug 2026)

The backlog carried "regional shadow prices - fix the MIP integers, re-solve as
an LP". The user challenged whether it is needed at all, given South Africa has
no locational pricing. HALF THE TASK WAS WRONG AND IS NOW RENAMED.

NOT NEEDED: regional prices. SAWEM clears to a SINGLE NATIONAL System Marginal
Price. Locational pricing is explicitly an option for a future iteration of the
market code, not part of it. Building region-by-region prices would model a market
that does not exist.

STILL REAL: a NETWORK-AWARE NATIONAL price. The capture panel uses instant-engine
prices even after a full model run, because a MIP has no duals. Those prices miss
congestion: when a corridor fills, dearer plant runs and the true marginal cost
rises.

### THE MEASUREMENT

Congestion means less VRE reaches load, so derating delivered VRE brackets what a
network-aware price would do:

    VRE derate   mean price   solar capture   wind capture   curtailed   cost
      0%              R268           19%            67%       100 TWh   R1208
      5%              R290           22%            69%        90 TWh   R1166
     10%              R323           25%            71%        79 TWh   R1124
     15%              R370           27%            71%        69 TWh   R1085
     20%              R428           29%            70%        59 TWh   R1044

SOLAR CAPTURE MOVES 19% -> 25% AT A 10% DERATE. Six points, which on a 19% base is
a THIRD of the value. Wind moves 67% -> 71%, so the effect is materially larger for
solar - which is also the technology whose capture rate is low enough to decide
financeability.

For scale on a plausible derate: at TODAY's build the MIP finds 13.46 TWh of
network curtailment the single-node engine misses, and the full network audit
shows that difference widening as build grows.

### VERDICT

MATERIAL, BUT NOT URGENT, and the reason is the DIRECTION. Congestion RAISES
capture rates here, because it removes surplus that was depressing midday prices.
So the current panel is CONSERVATIVE for solar - it understates what a project
earns. Being wrong in the safe direction on a developer-facing number is the
right way round, and it means the fix can wait behind work that is wrong in the
dangerous direction.

Keep it on the list, renamed, with this measurement attached so the next session
does not have to re-derive whether it is worth the doubled solve time.

## GAS VERSUS COAL RE-RUN WITH CAPACITY PAYMENTS (18 Aug 2026)

Run as an end-to-end test that the capacity payment, the build-LP wiring and the
storage tiers all work together. Two findings, and the first was not expected.

### THE CONCLUSION HAD ALREADY CHANGED, BEFORE ANY CAPACITY PAYMENT

Same comparison as 17 Aug - identical renewables, storage and demand, the only
difference being whether the last coal tranche is RETAINED and flexibilised or
RETIRED and replaced with 9 GW of CCGT:

    scenario              cost   CO2 Mt    RE%   CCGT TWh   coal TWh   LOLE
    coal, no payment      1339     40.6   78.5       0         36.8      0
    gas,  no payment      1305     24.9   84.4       0.51      23.3      2

GAS IS NOW CHEAPER AND CLEANER: R34/MWh less, 15.7 Mt less CO2, 5.9 points more
renewables. On 17 Aug coal won. The reversal is NOT the capacity payment - it is
zero in both rows. It comes from the work done since: per-technology storage
tiers, the export lever, and the corrected utility PV capacity.

WHAT COAL STILL WINS ON IS RELIABILITY: LOLE 0 against 2 hours. So the trade is
now R34/MWh and 15.7 Mt against two hours of shedding a year - a genuinely
different question from the one settled on 17 Aug, and one where reasonable people
would differ. The old conclusion should not be quoted without this correction.

### THE CAPACITY PAYMENT ACTS WHERE IT SHOULD, AND ONLY THERE

Dispatch cost is IDENTICAL at every payment level, which is correct: a capacity
payment is a transfer from consumers to generators, not a resource cost. What it
changes is the revenue split - gas collects R5.48bn at R300/kW/yr against coal's
R3.05bn, because 9 GW of CCGT de-rates at 90% while storage de-rates far lower.

And it changes what the BUILD LP would choose:

    payment        wind      pv   rooftop    batt    ccgt
    none           1752     959      1359    1079    1731
    R300/kW/yr     1752     959      1359    1004    1461
    R600/kW/yr     1752     959      1359     929    1191

CCGT falls 31%, battery 14%, wind and solar UNCHANGED - energy-limited plant earns
nothing, as in every real scheme. At R600/kW/yr CCGT undercuts wind for the first
time, which is exactly the outcome a capacity mechanism is designed to produce and
exactly the risk it carries.

VERDICT ON THE EXPERIMENT: everything works. The payment is inert where it should
be inert (dispatch), live where it should be live (build), and blind to wind and
solar as designed.

## CAPACITY PAYMENTS AND ANCILLARY SERVICES - BUILT (18 Aug 2026)

Three new controls, all defaulting to ZERO so nothing changes until deliberately
turned on. South Africa has none of these mechanisms today.

### CAPACITY PAYMENT (capacityPaymentRkWyr, R/kW/yr)

Paid on DE-RATED MW, following Ireland's all-island market - the closest
structural analogue to SAWEM, being a single national price with one system
operator. De-rating credits a 4-hour battery at 25% of nameplate and a 100-hour
store at 90%, because what matters is capacity you can rely on through a long
event.

WHERE IT ACTS, and this took a false start to get right: NOT on dispatch. A
capacity payment is paid for availability, so it cannot move an energy sweep - the
deep harness correctly flagged it DEAD. It acts on the BUILD LP via
bldNetAnnuity(), offsetting the annuity on eligible firm capacity, which is
exactly how a developer sees it:

    net annuity R/kW/yr in 2030    battery    CCGT    wind
      no payment                      1079    1731    1752
      R300/kW/yr                      1004    1461    1752
      R600/kW/yr                       929    1191    1752

Wind is untouched - energy-limited plant earns nothing, as in every real scheme.

THE PANEL SHOWS THE FINDING THAT MATTERS. At R300/kW/yr on a high-VRE fleet:

    Gas CCGT          3.0 GW   90%   2.7 firm   R0.90bn   paid, never runs
    Lithium-ion 4h   30.8 GW   25%   7.7 firm   R9.24bn   R1,118/MWh
    Vanadium 8h       5.0 GW   45%   2.3 firm   R1.50bn   paid, never runs
    Iron-air 100h    10.0 GW   90%   9.0 firm   R3.00bn   paid, never runs
    Pumped storage    2.9 GW   85%   2.5 firm   R0.87bn   R148/MWh

"Paid, never runs" is a RESULT, not an error, and the panel says so: an asset can
collect a capacity payment across a whole year and deliver no energy, because the
system never reaches the conditions it exists for. That is the central policy risk
of any capacity mechanism and it is what de-rating tries to price.

### ANCILLARY SERVICES (asReserveRMWh, asInertiaRkWyr)

RESERVE, paid on capacity HELD. The Grid Code makes reserve categories exclusive -
capacity held for one cannot count toward another, and cannot simultaneously sell
energy. THE MODEL ENFORCES THAT, and getting it right needed two passes:

  First attempt capped POWER only. Storage discharge went UP, because a lower
  power cap spread discharge over more hours. A real effect, but not what reserve
  means.
  Fix: reserve requires ENERGY standing behind the power too - an SOC floor of
  the same fraction. Reserve you cannot deliver is not reserve.

    today 2026, storage 3.7 GW      storage TWh
      no reserve price                    3.72
      R200/MWh at 15% held                1.51
      R200/MWh at 40% held                0.25

  On a high-VRE fleet with 30 GW of battery the same setting barely moves total
  storage output - it shifts between pumped storage and battery instead. That is
  a genuine finding: at that scale storage is oversized for its arbitrage role,
  so reserve provision is nearly free.

INERTIA, paid per kW of capability. South Africa does NOT procure this at all -
the Market Code lists synchronous condensers but never inertia as a service, while
Eskom's 2026-2030 adequacy outlook flags rising frequency instability as
inverter-based generation grows. Britain holds 120 GVAs as a minimum, Ireland 23
GWs, both with procurement behind them. Earned only by synchronous plant and
grid-forming batteries; wind and solar earn nothing. Pairs with the synchronous
floor slider to ask what price makes batteries displace spinning mass.

### HARNESS CHANGES

capacityPaymentRkWyr and asInertiaRkWyr are EXEMPT from the dispatch sweeps in
stress_deep and validate_response, with the reason stated at the exemption: both
are revenue streams, not dispatch signals. But an exemption that only silences a
check is worthless, so stress_deep gained two POSITIVE checks in its place:

    F1b capacity payment lowers the build annuity on firm capacity
    F1c capacity payment does NOT credit wind

46/46 deep · 290/290 stress · 138/138 invariants · 14/14 consistency ·
18/18 benchmarks · 8/8 structural · 77/77 response · 40/40 LP · 16/16 capacity ·
33/33 outputs · 29/29 audit · 6/6 monotonicity. Control inventory re-baselined at
57; response matrix re-baselined.

STILL OUTSTANDING: re-run the gas-versus-coal comparison of 17 Aug. That analysis
found coal retention beat 9 GW of CCGT partly because the CCGT generates 0.5 TWh a
year and earns almost nothing for existing. A capacity payment changes exactly
that, and the comparison may now invert.

## TWO QUEUED ITEMS (18 Aug 2026)

### A. CURTAILMENT FORECAST SHOWS ZERO TODAY, BUT ESKOM IS ALREADY CURTAILING

Raised by the user, and the concern is right: an industry reader will assume the
box is broken. It is not, and OUR OWN MIP PROVES IT - the same scenario the
instant engine reports as 0 TWh curtailed, the full model reports as 13.46 TWh,
with Eastern Cape-KZN at its limit 3,418 hours a year.

THE CAUSE: the curtailment forecast runs on the INSTANT engine, which is
single-node. With no corridors there is nothing to congest, so surplus only
arises when NATIONAL supply exceeds NATIONAL demand - which today it never does.
Real South African curtailment is overwhelmingly NETWORK-driven and local,
concentrated in exactly the Cape corridors the single-node engine cannot see.

So the forecast is measuring a different thing: the point at which the country as
a whole has more renewable energy than it can absorb, which is a 2030s question.
Eskom's present curtailment is a 2026 question about specific corridors.

FIX NEEDED, and it is a NOTE not a model change: the panel must say plainly that
it forecasts NATIONAL energy-balance curtailment and does not include the
network-driven curtailment already happening today, pointing readers at the full
model for the corridor picture. Without that, the panel reads as broken to
precisely the audience whose trust matters most.

### A-DONE. The curtailment note was written into the panel on 18 Aug. It states
that the forecast runs on the single-node instant engine, sees only NATIONAL
oversupply, and does not include the network-driven curtailment happening today -
pointing readers at the full model, which finds real curtailment on the same
scenario with Eastern Cape-Kwazulu Natal at its limit for thousands of hours.

### C. ANCILLARY SERVICES - RESEARCH (18 Aug 2026)

Asked alongside capacity payments, and the two are closely linked: in most
markets storage earns MORE from ancillary services than from capacity, at least
until the AS market saturates.

SOUTH AFRICA ALREADY HAS A DEFINED AS FRAMEWORK. Eskom publishes Ancillary
Services Technical Requirements on a rolling five-year basis (current document
covers 2023-2027), and the Grid Code sets a minimum requirement per reserve
category, revised annually. Categories are EXCLUSIVE - capacity reserved for one
cannot count toward another, which matters for modelling because a battery cannot
sell the same MW twice:

    INSTANTANEOUS     arrests frequency after a trip; must sustain 10 minutes;
                      responds within 10 seconds
    REGULATING        up and down, continuous second-by-second balancing
    TEN-MINUTE        replaces instantaneous once deployed
    SUPPLEMENTAL      slower replacement
    EMERGENCY         interruptible load, generator emergency capacity, gas turbines

The Market Code splits procurement two ways, which maps neatly onto how we would
model it:
    LONG-TERM AUCTION   system restoration (black start, islanding), reactive
                        power, synchronous condenser operation, emergency and
                        supplemental reserves
    DYNAMIC MARKET      constrained generation, regulating reserve, instantaneous
                        reserves, ten-minute reserves

DEMAND RESPONSE ALREADY PARTICIPATES: up to 1,014 MW of instantaneous DR
responding within SIX SECONDS, plus 364 MW supplemental on 30 minutes' notice and
62 MW of critical-peak reserve. That is directly relevant to our shiftable-load
and VPP sliders, which currently earn nothing for providing this.

THE GAP THAT IS COMING, and it is the interesting one for the model: INERTIA IS
NOT PROCURED AT ALL. The Market Code list above mentions synchronous condensers
but never inertia as a service. Meanwhile Eskom's own Medium-Term System Adequacy
Outlook 2026-2030 flags rising frequency instability as inverter-based generation
grows, unless synchronous condensers or synthetic inertia from grid-forming
batteries are added.

Comparators, useful because our synchronous floor slider models exactly this:
    UK (NESO)        RoCoF limit 1 Hz/s over 500 ms; minimum inertia 120 GVAs,
                     reducing to 102; procured via long-term contracts plus
                     market adjustments
    Ireland (EirGrid) RoCoF 1 Hz/s over 500 ms; minimum inertia 23 GWs; DS3
                     system services framework
    South Africa      no minimum inertia requirement, no procurement mechanism

The recommended path in the SA literature is three steps: define inertia
explicitly in the System Operations Grid Code, set a minimum inertia requirement
as a regulated value with a transparent methodology, then develop a procurement
mechanism.

IMPLICATION FOR THE MODEL. Our synchronous generation floor slider already
represents the PHYSICAL constraint (6 GW baseline, ~15% of peak). What it does
not represent is that nobody is PAID to provide it. Adding an AS revenue stream
would let the model answer a question it currently cannot: at what price does a
grid-forming battery displace a synchronous condenser, and does that change the
economics of retiring coal.

SUGGESTED SEQUENCING: capacity payment first, since it is simpler and the EPP
explicitly signals it. Then AS revenue as a second slider, split into a reserve
component any storage can earn and an inertia component only grid-forming assets
and synchronous plant can earn. Keep the exclusivity rule - a MW selling reserve
is not also selling energy - or the model will double-count storage revenue,
which is the classic error in BESS business cases.

### B. CAPACITY PAYMENTS - RESEARCH AND PROPOSED DESIGN

Motivation: without a capacity payment, iron-air and vanadium earn nothing for
existing, so the model cannot represent why anyone would build them. Same gap
affects CCGT, and it bears on the 17 Aug gas-versus-coal conclusion.

WHAT OTHER MARKETS DO - four archetypes:
  CENTRAL-BUYER AUCTION     PJM, New York, New England, GB, Ireland/SEM.
    An administrator estimates the capacity needed and auctions it years ahead.
  DECENTRALISED OBLIGATION  CAISO resource adequacy, SPP, Australia's Retailer
    Reliability Obligation. Retailers must contract to cover forecast peak plus
    a reserve margin.
  STRATEGIC RESERVE         Germany, Belgium, Sweden, and the NEM. Capacity
    contracted outside the market, run only in scarcity.
  PRICE-DRIVEN / ENERGY-ONLY  ERCOT, Australia's NEM, New Zealand, Singapore,
    Alberta. No capacity payment; a high price cap does the work. ERCOT uses a
    $5,000/MWh cap plus scarcity adders.

THE MECHANISM THAT MATTERS FOR STORAGE IS DE-RATING. Ireland's SEM pays on
DE-RATED MW, with factors set per technology class from historical availability,
unit size AND ENERGY LIMITS - so a 4-hour battery is credited with far less firm
capacity than its nameplate, and a long-duration store with more. GB moved
storage onto a Scaled Equivalent Firm Capacity method in 2024 for the same
reason.

The hard part, well documented in the literature: storage reliability is
INTERTEMPORAL. Whether a store can serve load in a given hour depends on its
entire prior state-of-charge trajectory, so a scalar de-rating factor
misrepresents it. That is a known limitation of every operating scheme, not a
reason to avoid the design.

WHICH FITS SOUTH AFRICA: the central-buyer auction. SAWEM clears to a single
national price with one system operator (NTCSA) and a single historical buyer, so
the Irish SEM is the closest structural analogue - all-island, single price,
de-rated MW, auction-cleared.

PROPOSED IMPLEMENTATION, smallest useful version:
  - one slider, capacityPaymentRkWyr, R/kW/yr, default 0 so nothing changes until
    deliberately turned on
  - de-rating factors by technology, duration-aware, as Ireland does:
      CCGT              ~90%  (availability-limited, not energy-limited)
      lithium 4h        ~25%
      vanadium 8h       ~45%
      iron-air 100h     ~90%
      pumped storage    ~85%
    Figures indicative and to be sourced properly before use.
  - revenue = derated MW x payment, offsetting system cost the way exportRevenueR
    already does
  - RE-RUN THE GAS-VERSUS-COAL COMPARISON afterwards. That conclusion assumed
    idle firm capacity earns nothing, which is exactly what this changes.

ON PUMPED STORAGE, which the user asked about: it IS firm capacity and on the
merits should be paid. The argument for excluding it is that Eskom owns the
fleet, so a payment is a transfer within Eskom rather than an investment signal.
Suggest INCLUDING it with a toggle, since the model is used to ask what NEW build
is worth and the comparison against a 14-hour Tubatse-class scheme is exactly the
interesting one.

## PER-TECHNOLOGY STORAGE TRACKING - DONE (18 Aug 2026, second attempt)

Each of lithium, vanadium and iron-air now keeps its OWN state of charge and its
own round-trip efficiency. Charge and discharge run in efficiency order, best
first, so lithium does the daily cycling and iron-air fills only once lithium is
full - which is what physically happens, and why a 100-hour store is a seasonal
asset rather than a daily one.

WHAT THE FIRST ATTEMPT MISSED, and how the second found it: there is a THIRD
charging path. Beyond the surplus branch and the coal-forced surplus branch,
storage is also pre-charged FROM COAL ahead of the evening peak
(`if(head>0 && battSoc<battTargetCeiling)`). At default settings there is zero
curtailment, so that is the ONLY route by which the battery ever charges. Missing
it collapsed the default case from 0.272 TWh to 0.002 while every high-VRE case
looked fine.

THE METHOD THAT WORKED - shadow mode:
  1. Add tiers ALONGSIDE the scalar, mirroring every operation, changing nothing.
  2. Assert hour by hour that the tier sum tracks the scalar, recording the worst
     divergence as tierDrift.
  3. Only then let the tiers govern the amounts.
Step 2 is what made the difference. It showed drift of exactly ZERO with lithium
alone and hundreds of GWh once multiple tiers existed - and that drift WAS the
error the blended scalar had been making all along.

ONE MORE BUG CAUGHT IN STEP 3. With the tiers governing, adding iron-air first
made E.batt FALL from 6.685 to 3.074 TWh and cost RISE. Cause: battSoc kept its
own running total credited at the BLENDED efficiency, so it understated stored
energy, and since btLim = min(battPower, battSoc) that throttled discharge.
Adding storage reduced output, which is nonsense. Fixed by DERIVING battSoc from
the tier sum - one source of truth - via syncBattSoc().

RESULT, all reconciling and drift zero everywhere:

    case              E.batt   li     vrfb    fe    feChg   curt   cost
    default           0.2725   0.272  0      0      0         0     568
    futuremix         6.6854   6.685  0      0      0       100    1208
    +10 GW iron-air   6.6854   6.685  0      0      1.111    98.7  1201
    coal 36 retired  13.5355  13.119  0      0.417  2.037    84.7  1111

Iron-air charges 1.111 TWh and discharges NOTHING until coal is retired to 36 GW,
at which point it delivers 0.417 TWh. That is the honest picture and it is now
visible per technology rather than hidden in an aggregate.

RESPONSE MATRIX: one cell changed, newVrfbMW -> avgCost, from inert to
responsive. Vanadium previously had no effect on cost at all. Re-baselined.

## PER-TECHNOLOGY STORAGE TRACKING: FIRST ATTEMPT, REVERTED (18 Aug 2026)

Prompted by the user asking how we would know whether iron-air was ever deployed,
given all three battery-class technologies share one aggregate.

THE INVESTIGATION FOUND A REAL PROBLEM. Adding 10 GW of iron-air to the Future mix:

    charged      14.71 -> 21.61 TWh   (+6.90)
    discharged   12.02 -> 12.02 TWh   ( 0.00)
    curtailed      100 ->  92.9 TWh   (-7.10)

6.9 TWh goes in and NOTHING comes out. At 45% round trip it stores 3.1 TWh into a
fleet holding 1.2 TWh, so it cycles - but the system never needs the output,
because coal must-run already covers every deficit hour. Same mechanism as the
17 Aug storage-idle finding, now hidden inside an aggregate.

THE REPORTING CONSEQUENCE: curtailment is reported 7.1 TWh LOWER, as though that
energy was put to use. It was absorbed and lost. Economically harmless - the
energy was free - but a developer reading "curtailment fell" would conclude their
project spills less, when nothing was delivered.

THE FIX WAS ATTEMPTED AND REVERTED. Splitting battSoc into per-technology tiers,
each with its own SOC and efficiency, charging and discharging in round-trip
order. It worked for the cases it was built for - iron-air discharge became
visible at 0.42 TWh with coal retired to 36 GW, and the tier totals reconciled
against E.batt - but it BROKE THE DEFAULT CASE: battery discharge collapsed from
0.272 TWh to 0.002. The tiers were never charged at default, and I could not find
why within a reasonable time. Reverted rather than left in.

    after revert: battery 0.272 TWh, PS 3.45 TWh, cost R568 - all restored
    290/290 · 44/44 · 138/138 · 14/14 · 18/18 · 9/9 · 76/76 · 33/33 · 29/29 · 16/16

WHAT TO DO DIFFERENTLY NEXT TIME. The change touched eight call sites of a scalar
that the engine threads through charging, discharging, cost basis and the
marginal-price logic. It should be done by first introducing tiers ALONGSIDE the
existing battSoc, asserting the two agree hour by hour across every scenario, and
only then removing the scalar. Attempting the swap in one pass gave no way to see
which of the eight sites diverged.

THE UNDERLYING GAP REMAINS: vanadium and iron-air are invisible in the mix,
dispatch and price panels, and a blended round-trip efficiency is still applied to
lithium charging when lithium should charge at 88%.

## REVISED ELECTRICITY PRICING POLICY - ASSESSED, NOT YET ACTED ON (18 Aug 2026)

Source: DEE Media Briefing, Energy Pricing Policy Update, Dr Kgosientsho Ramokgopa,
18 August 2026. It is a DRAFT out for consultation - public comments, then NEDLAC,
then Cabinet, then gazetting - so the recommendation is to wait for gazetting
rather than build to something that will move.

TESTED AND NOT MATERIAL:

  ITEM 7, price caps and volatility smoothing. This looked most likely to bite
  and does not. Our shadow price bottoms at -R225 and never exceeds R804 in the
  Future electricity mix, so an UPPER cap never binds. Applying a zero FLOOR moves
  capture rates by only 1-2 points and the mean price from R282 to R292. Our
  negative prices are shallow because coal's must-run floor sets them, not a
  deep-negative subsidy chase.

  ITEM 8, net-billing with exports credited at avoided cost rather than retail.
  Neither tool is exposed. GridTwin models rooftop as REDUCING DEMAND -
  self-consumption - and Rewiring SA also values self-consumption only, with no
  export credit assumed anywhere (its only "export" references are CBAM). So
  neither overstates household returns, and a policy crediting exports below
  retail does not invalidate either.

QUEUED AS EXPLICIT TASKS (18 Aug 2026), with scoping so they can be picked up cold:

  TASK A - WHEELING NETWORK CONTRIBUTION
    Add a cost per MWh on wheeled generation, covering network maintenance and the
    social-subsidy contribution. Falls on the PRIVATE bucket only - 470 MW wind and
    488 MW solar today, and 1,046 MW of new private capacity reached commercial
    operation in H1 2026 alone, so the base is growing fast.
    WHERE IT LANDS: reduces the achieved price in the capture-rate panel for
    private/wheeled projects, so the panel needs to distinguish wheeled from
    grid-supply projects rather than treating a region uniformly. That is a
    structural change to captureRate(), not just a constant.
    BLOCKED ON: the actual charge. The EPP states the principle; the number will
    come from NERSA's tariff methodology. Do not invent one - a made-up charge
    would silently reprice every private project in the model.

  TASK B - CAPACITY PAYMENT
    Add revenue for firm capacity held available but not dispatched. We currently
    pay nothing for it, so peakers and storage are understated.
    WHY IT MATTERS BEYOND THE ARITHMETIC: it bears directly on the gas-versus-coal
    conclusion of 17 Aug. That analysis found coal retention beat 9 GW of CCGT
    partly because the CCGT generates only 0.5 TWh a year and earns almost nothing
    for existing. A capacity payment changes exactly that: idle firm capacity
    becomes financeable, and the comparison may invert. The conclusion should be
    re-run, not assumed to hold.
    WHERE IT LANDS: the cost/revenue side of simulate(), and the LCOE comparison
    in the build optimiser. Also the adequacy panel, which currently frames firm
    capacity as a physical fact rather than something anyone is paid to provide.
    BLOCKED ON: the mechanism. Capacity charge on consumers, or capacity payment
    to generators, or both - the briefing says charges are "necessary" without
    specifying the design.

MATERIAL AND GENUINELY UNMODELLED - the two to act on once gazetted:

  EQUITABLE CONTRIBUTION FROM WHEELING. "Wheeling customers and independent
  traders must contribute fairly to network maintenance and social subsidies."
  That is a new cost falling on exactly the private wheeled projects now running
  at 1,046 MW a half-year, and nothing in the model charges it. It would reduce
  wheeled project returns, which bears directly on the capture-rate panel.

  CAPACITY CHARGES. "Capacity charges are necessary to incentivize and ensure
  reliable generation infrastructure." We have no capacity payment at all, so we
  UNDERSTATE revenue for peakers and storage - the assets adequacy depends on.
  This bears on the gas-versus-coal question settled on 17 Aug: a capacity payment
  changes whether idle firm capacity is financeable, and our conclusion assumed it
  is not paid for.

OPPORTUNITY: NERSA to publish a 10-year electricity price forecast ANNUALLY. That
becomes an official benchmark to validate the cost panel against, replacing our
own derivation. Watch for the first publication.

  DO NOT EXTRAPOLATE RECENT INCREASES. NERSA got Eskom's regulatory asset base
  wrong by R54.7bn and is recovering the error over three years:

      2026/27     R12.0bn
      2027/28     R23.0bn
      thereafter  R19.7bn

  FY2027 increases were 8.76% Eskom-direct and 9.01% municipal. Strip the
  clawback and they would have been 5.36% and 6.19%. So roughly 3.4 percentage
  points of this year's increase is a one-off correction, and it is FRONT-LOADED
  - the 2027/28 tranche is nearly double this year's.

  A forecast fitted to recent increases therefore over-projects, because it
  treats a three-year correction as permanent escalation. Model the clawback as
  a separate, time-limited component rather than folding it into a smooth rate.

  Figures are from press coverage of the NERSA decision, not the decision
  documents. Verify against NERSA's own publication before using them in
  anything that goes out.

COST DECOMPOSITION - BIGGER THAN IT LOOKS. Filed originally as "map the cost
panel labels onto the EPP decomposition". Investigated 26 Aug 2026: it is not a
labelling task and should not be attempted as one.

  The policy defines total cost of supply as five components:
      wholesale energy
      generation capacity / standby
      transmission / distribution
      ancillary / balancing
      legacy / subsidy

  THERE IS NOTHING TO RELABEL. avgCost is a single number:

      avgCost = (fuelCost - curtailFuelCost + carbonCost + gridCapexR
                 + drCostR - exportRevenueR) / gridServed

  The components exist inside simulate() but no panel displays them separately.
  So the work is BUILDING a breakdown panel, not renaming rows on one.

  TWO THINGS TO FIX FIRST, or the panel will be worse than none:

  1. gridCapexR IS MISNAMED. It is newCapexR minus btmCapexR - grid-side
     GENERATION capex, not transmission. Under the EPP that belongs in
     "generation capacity", not "transmission/distribution". A panel built on
     the current naming would file it under the wrong heading and look
     authoritative while doing so.

  2. TWO CATEGORIES ARE NOT MODELLED. Transmission and distribution costs are
     absent from avgCost entirely, and legacy/subsidy appears nowhere. A
     five-row panel with two rows reading zero misrepresents the model rather
     than clarifying it.

  So the real question is whether to model network costs at all - which is a
  scope decision, not a formatting one. Read the EPP's own definitions before
  starting; the five-way split above is a summary and the boundaries between
  categories are where the difficulty will be.

## CURTAILMENT FORECAST - BUILT (18 Aug 2026)

curtailmentForecast() + renderCurtailmentForecast(), panel below Capture rate.
The capture panel answers "what would I earn today". This answers what a
developer is actually financing against: WHAT HAPPENS AS THE QUEUE AHEAD OF ME
BUILDS OUT.

Runs the dispatch engine at a ladder of national VRE build levels on top of the
current scenario, split 55:45 solar to wind - roughly the mix the build optimiser
chooses once transmission is priced. About 60ms per level, so six points cost
under half a second: computed on demand rather than precomputed and left to go
stale.

FROM TODAY 2026, share of each region's output curtailed:

    extra VRE      now   +10   +20   +35   +50   +70 GW
    solar, all      0%    0%    1%   12%   29%   45-46%
    wind, best      0%    0%    0%    3%    8%   15%   (Limpopo)
    wind, worst     0%    0%    1%    7%   14%   24%   (Eastern Cape)

THE KNEE IS THE POINT. Curtailment is flat to +20 GW and then rises sharply -
nothing, nothing, 12%, 29%, 45%. Where that knee sits matters far more than
today's number, and a project reaching COD in 2029 faces the system on the far
side of it.

AND THE TWO TECHNOLOGIES BEHAVE COMPLETELY DIFFERENTLY:
  SOLAR - every region lands within 1 point of every other (45-46% at +70 GW).
    Siting does not help. Solar generates at the same hours wherever it sits, so
    the curve is national: what matters is WHEN you connect, not where.
  WIND - a 9-point spread, Limpopo 15% against Eastern Cape 24%. Siting is worth
    real money, and the ranking mirrors the capture-rate finding: the best wind
    resource areas curtail MOST, because that is where the wind fleet already is.

Together with the capture panel this is the developer-facing answer nothing else
in the market gives, because it needs a dispatch model to produce and the
interconnection-analytics tools do not have one.

ONE BUG WORTH RECORDING: the summary line originally reported "curtailment passes
25% first in X, last in Y". For SOLAR every region ties, so it read "first in
Northern Cape at +50, last in Gauteng at +50" - which looks like a bug and buries
the actual finding, that siting is irrelevant. For WIND nothing crosses 25% at
all (top is 24%), so it fell through to "no region passes 25%" and threw away the
9-point spread entirely. Technically true, completely useless. Restructured so
the SPREAD always reports and the threshold is a secondary clause.

## CAPTURE RATE BY REGION - BUILT (18 Aug 2026)

captureRate() + renderRegionalCapture(), new panel below Wholesale shadow price.
Roadmap item 1, and the machinery was indeed nine-tenths present: hourly shadow
prices from the dispatch engine, 8,760 per-unit values per region per technology
in profiles_regional.json.

    capture rate = revenue-weighted price / time-weighted average price
                 = sum(gen_h x price_h) / (sum(gen_h) x mean(price))

At 100% a plant earns the average price. FUTURE ELECTRICITY MIX, mean R282/MWh:

    WIND                              SOLAR
    Limpopo        109%  R305         Mpumalanga      18%  R38
    North West     104%  R288         Limpopo         17%  R37
    Gauteng        100%  R279         Gauteng         17%  R35
    Mpumalanga      94%  R260         North West      16%  R33
    Free State      92%  R254         Kwazulu Natal   16%  R32
    Northern Cape   87%  R241         Free State      16%  R32
    Hydra Central   73%  R202         Eastern Cape    15%  R30
    Eastern Cape    71%  R195         Hydra Central   14%  R28
    Western Cape    66%  R183         Western Cape    13%  R25

THE HEADLINE: SITING MATTERS FOR WIND, BARELY FOR SOLAR. Wind capture spans 43
points across regions; solar spans 4. Wind regimes differ enough that where you
build changes what you earn. Solar generates at much the same hours everywhere,
so it cannibalises itself wherever it sits - and at 72 GW it captures 13-18% of
the average price while being curtailed 67% of the time.

Note the inversion within wind: the WORST capture rates are in the best wind
resource areas (Western Cape 66%, Eastern Cape 71%), because that is where the
wind fleet is concentrated and therefore where wind depresses its own price. The
best are in Limpopo and North West, which have modest wind but almost no
competing wind nearby. That is a genuinely useful developer signal and the exact
thing a capacity-factor map hides.

METHOD AND ITS LIMIT, stated in the panel: regional GENERATION profiles combined
with the NATIONAL hourly price, because the instant engine is single-node. That
measures WHEN a region generates relative to the national price, which is the
dominant effect. It does NOT capture locational price differences from
congestion - the full MIP prices each region separately. Curtailment applies the
system-wide spill share hour by hour, so a plant generating in surplus hours is
curtailed more.

BUG FOUND AND FIXED WHILE BUILDING IT, and it is one we have now seen twice:
renderCapture() ALREADY EXISTED, for the captureResult panel. Declaring a second
function of the same name silently overrode it - the later declaration wins, and
nothing warns. The new panel rendered with the OLD panel's numbers while looking
entirely healthy, showing 100% capture across every region in a scenario where
the real answer was 13-18%.

It took four wrong hypotheses to find: stale lastRes, a debounced re-render, hook
placement in the render chain, and only then the name collision. The tell was
that captureRate() called DIRECTLY returned 10% while renderCapture() rendered
100% from the same object.

GUARD ADDED: validate_structure.js now checks for DUPLICATE FUNCTION DECLARATIONS
as well as duplicate FIXED keys. It already caught the constant case (lcoePs) and
had exactly the same blind spot for functions. Mine renamed to
renderRegionalCapture; the incumbent left alone.

## STRATEGIC ROADMAP - two long-term builds (18 Aug 2026)

Added after reviewing what interconnection-analytics firms are building elsewhere
(Nira Energy, Pearl Street/SUGAR, GridUnity, Paces, Pivvot; and Atomic Canyon's
NIVA in nuclear). NONE of them operate in South Africa. These are the two things
worth owning here, in order.

### 1. CAPTURE-RATE AND CURTAILMENT FORECAST BY CONNECTION POINT

The question that decides whether a project is financeable, and the one the
international tools STRUCTURALLY cannot answer. Nira sells "where can I connect"
from ISO data; it has no dispatch model, so it cannot say what the energy is
worth once connected. We have the dispatch model. That is the wedge.

Curtailment is not hypothetical: the PFL H1 2026 monitor names grid access and
"increasing curtailment of renewables" as the significant risks to the current
build rate, and the Future electricity mix preset already produces 121 TWh of it.

ALREADY BUILT, nine of the ten pieces needed:
    hourly shadow price          marginalP
    curtailment by hour          curtailMW
    per-region curtailment       applyCurtailmentToMap
    regional dispatch MIP        getNodalMIPInputs
    GCCA headroom by region      bldHeadroom
    Where To Build siting        sitePortfolio
    DC power flow diagnostic     dcFlows (built, not yet wired to a panel)
    REDZ permitting overlay      redzData
    BESS revenue benchmark       bessBenchmark - the pattern to copy
    substation register          substations_compact.json, 185 sites with regions

MISSING: a captureRate() that combines them. For a given technology at a given
connection point, over a given scenario:
    capture rate = sum(generation x hourly price) / (sum(generation) x mean price)
plus expected curtailment share, plus the sensitivity of both to coal retirement
and to how much VRE arrives nearby first.

FIRST STEP: capture rate at REGION level for wind and solar under each preset.
That is a small addition to the existing engine and immediately useful - a
developer wants to know whether Northern Cape solar captures 70% or 45% of the
average price in 2030. Connection-point granularity comes after, and needs the
substation-to-region mapping we already have.

THE HONEST GAP: Nira's moat is ISO-accurate power flow - real impedances, study
replication. Ours are ASSIGNED from voltage class, with no N-1. For "will my
project pass the cost-allocation study" that difference is decisive, and closing
it needs data NTCSA does not publish. Do not claim study-grade accuracy.

### 2. DOCUMENT ASSISTANT - grid code, connection process, bid window rules

The Atomic Canyon pattern: one industry's fragmented documentary knowledge, made
navigable, VALIDATED BY THE INDUSTRY'S OWN BODIES. NIVA's moat is not the model,
it is that INPO, EPRI and NEI ran the solicitation - which is what made operators
trust it.

The South African corpus is scattered across hundreds of PDFs that every
developer re-reads badly: the Grid Code, Eskom/NTCSA connection process, IPP
Office bid window requirements, NERSA registration rules, EIA and REDZ
requirements.

THE LESSON TO TAKE, and it is about sequencing not technology: credibility comes
from partnering with SAWEA, SAPVIA or the IPP Office rather than building it
alone and hoping. Approach them before building, not after.

### WHY THIS ORDER

Capture rate first because the machinery is nine-tenths built, it answers a
question nothing else can, and it needs no partner to be useful. The document
assistant is higher value but gated on a relationship, so start that conversation
in parallel and build while it develops.

MARKET CONSTRAINT WORTH REMEMBERING: South Africa builds roughly 4 GW a year
against a US pipeline in the hundreds. That argues for a tool a developer pays
for because it answers a question nothing else can - not one competing on
breadth.

## DOORNHOEK ADDED - and why it passed where Graspan failed (18 Aug 2026)

Engineering News, 22 May 2026: AMEA Power commissioned the 120 MW Doornhoek solar
PV plant near Klerksdorp, North West - the FIRST Bid Window 6 project to reach
commercial operation. Added to by_source.reipppp solar, North West.

THE TEST IT PASSED, stated as a rule for next time. Three independent sources
agreeing on capacity, province AND timing, plus the in_construction decomposition
NAMING the project:

    ipp_pipeline.json   status 'construction' at 31 Mar 2026, 120 MW, BW6, North West
    Engineering News    commissioned, dated 22 May 2026 - after the cutoff
    PFL H1 2026         Table 1, among the 17 H1 CODs

Graspan had none of that. Its 75 MW was absent from the 444 MW construction
decomposition, and our own coverage note recorded ~73 MW of unattributed BW5
SOLAR already inside the online total. Same report, same day, opposite answer -
the difference is whether the source data can NAME the capacity as not yet online
at the cutoff.

CASCADE, all updated together:
    reipppp solar North West   225 -> 345 MW
    online_actual              7,355 -> 7,475 MW
    in_construction            444 -> 324 MW   (Virginia 240 + BW5 EC wind 84 remain)
    FIXED.pvUtilityMW          3,151 -> 3,271 MW
    fingerprints               regional_renewable_capacity + ipp_pipeline recomputed
    ipp_pipeline               Doornhoek status construction -> online, COD recorded
    stress_deep H2             pinned display figure 3.2 -> 3.3 GW

Utility PV generation 6.21 -> 6.45 TWh, capacity factor unchanged at 22.5%.

CAPACITY-FACTOR CAUTION RESOLVED, not merely noted. The quoted 325 GWh/y on 120 MW
implies 30.9%, which looked like an over-claim against a 21-24% fixed-tilt band.
It is not: Doornhoek uses SINGLE-AXIS TRACKING (developer-sourced; ~200 ha,
81,000+ panels), and the SA range for tracking is 26-31%. So 30.9% sits at the top
of a plausible band rather than outside one. This is DISTINCT from the Ilikwa flag,
where 32% is asserted for a Free State plant with no stated mechanism - there the
number has no explanation, here it does.

MWp vs MWac, checked because it would have changed the answer: the press
consistently says 120 MWp while PFL Table 1 records 120 MWac for both contracted
and installed. PFL flags that distinction explicitly in footnote 2 for Mulilo Total
Hydra and did NOT flag Doornhoek, so 120 MWac is deliberate. It also reconciles -
325 GWh on ~100 MWac (if 120 were MWp) would imply 37%, which is not achievable.

MODELLING NOTE: our solar profile yields 22.5% fleet-average, so the model
generates about 236 GWh here against the claimed 325. That is the correct
treatment for one plant inside a fleet-average profile, but the FLEET capacity
factor should drift upward as tracking becomes standard - worth revisiting when
enough of the fleet is tracked to move the national profile.

REMAINING GAP IS NOW SMALL. Of the 444 MW in construction at 31 March, only
Doornhoek appears in PFL's H1 COD list. Virginia Solar Park (240) and the BW5
Eastern Cape wind (84) did not commission. The other H1 public CODs - Phezukomoya,
Coleskop, Grootspruit - were therefore already online at 31 March, which is
consistent with their earlier financial close years. The public H1 reconciliation
is effectively closed.

## POWER FUTURES LAB H1 2026 MONITOR INGESTED (18 Aug 2026)

Alao & Kruger, South African IPPs: Financial Close & COD Monitor, H1 2026 update,
UCT GSB Power Futures Lab, 17 Aug 2026. This is the report the queue was waiting
for, and it resolves every pending entry.

OUR PRIVATE FILE MATCHED THE REPORT EXACTLY - all 10 privately-procured H1
projects, 1,046 MW, name for name. The double-count work of 17 Aug is also
vindicated: Mooi Plaats (240 MW) and Umsobomvu (140 MW) are confirmed as H1 CODs,
so removing them from the queue was right.

QUEUE RESOLVED:
  GRASPAN PV 75 MW - ADDED, THEN REVERSED THE SAME DAY. It was ALREADY COUNTED.
    PFL confirms COD in H1 2026 and the queue file recorded April 2026, which
    looked safely post-cutoff, so I added it. Two independent checks say
    otherwise:
      1. in_construction 444 MW at 31 March decomposes EXACTLY to Doornhoek 120 +
         Virginia Solar Park 240 + BW5 Eastern Cape wind 84 (ipp_pipeline.json).
         Graspan is not among them. Being inside procured and not in
         construction, it must have been online.
      2. The queue file's OWN coverage note already recorded ~73 MW of
         unattributed BW5 SOLAR inside the online total, identified as either
         Graspan or Du Plessis Dam PV 1. Graspan is 75 MW of BW5 solar.
    The second point is the one that stings: our own file said this before I
    touched it, in the same note I read to get the April COD date. I took the
    part that supported adding and did not weigh the part that did not.
  HARTEBEESTHOEK 140 MW - NOT operational. Our June 2026 COD was WRONG. The
    report lists "Anglo's Hartebeesthoek (140 MW)" among the 21 private projects
    EXPECTED in H2 2026. Held, re-dated.
  UMMBILA EMOYENI 155 MW - NOT operational. "Seriti's Ummbila Emoyeni" also
    appears in the H2 expected list. Held.
  ILIKWA 50 MW - H2, awaiting the H2 monitor. Commissioned 3 August 2026 (user),
    which is after the 30 June H1 cutoff, so its absence from the H1 report is
    EXPECTED. I initially flagged it as uncorroborated because PFL did not
    mention it - that reasoning was WRONG. The report names only the LARGEST of
    the 21 private H2 projects, so a 50 MW project would never have appeared in
    that list. Absence from a named subset is not evidence of absence, and I
    should not have treated it as such.

ADDING 75 MW BROKE THREE IDENTITIES AT ONCE, and the validator caught all three
(all since reversed, but the mechanism is worth keeping):
    sum(provincial online) = published national online   7431 vs 7355
    FIXED.pvUtilityMW = reipppp solar + private solar    3226 vs 3151
    file fingerprint matches body

All three had to move together. online_actual rose 75 and in_construction FELL 75
- Graspan was under construction at 31 March and commissioned in April, so a
committed project delivered; procured_mw is unchanged because nothing new was
procured. FIXED.pvUtilityMW 3151 -> 3226. Fingerprint recomputed.

That cascade is the point of those checks: a single number added to one province
must reconcile against the national total, the engine-facing constant and the
file's own hash, or the model dispatches less solar than the regions hold. It is
the same identity that caught the phantom-MW bug originally.

WHAT WE STILL CANNOT DO: the other six public H1 CODs (799 MW - Mulilo Total
Hydra, Phezukomoya, Coleskop, Doornhoek, Umoyilanga 2, Grootspruit) cannot be
added, because the report gives H1 as a whole rather than month by month and the
reipppp bucket already covers everything to 31 March. Adding all of them would
double-count whatever commissioned in Q1. The in_construction figure bounds it:
at most 470 MW of the 874 MW public H1 total commissioned after March, so roughly
404 MW is already in the bucket. Per-project COD dates are needed, and the IPP
Office Q1 2026/27 quarterly (due ~September) will supply them.

## SLIDER FILL LAGGED THE THUMB ON ANY PROGRAMMATIC CHANGE (18 Aug 2026)

Spotted by the user from a screenshot: a grey gap between the left end of the
demand-growth track and where the orange fill started.

The fill is a CSS gradient driven by a --val custom property, and the formula
computing it was correct. The bug was that updateTrack() was only ever called on
RENDER and on USER DRAG. applyState() - which is what a URL parameter, a preset,
or "load this build into the model" goes through - set el.value and never
refreshed the fill. The thumb moved; the paint stayed put.

WHY DEMAND GROWTH SHOWED IT AND NOTHING ELSE DID: it is the only slider with a
NEGATIVE minimum. Rendered at its default of 0 on a -10..120 track, the fill sits
at 7.7%; a URL setting +5 moves the thumb to 11.5% and leaves 3.8% of track
mispainted. Every other slider had the identical bug, but starts at zero, so the
stale fill and the new thumb were usually close enough to be invisible.

FIX: updateSliderFill(el) as a standalone function, called from applyState as
well as the drag handler. Declared as a FUNCTION DECLARATION rather than assigned
to window - the slider renderer runs earlier in the file, and an assignment would
not exist yet when it calls this. The first attempt did exactly that and threw.

Verified 46/46 sliders paint correctly on load, after a preset, and at a negative
value.

WORTH NOTING FOR THE HARNESSES: nothing automated could have caught this. jsdom
computes no layout and the value was always right - only the paint was wrong. It
belongs squarely in the session-6 visual class, and it took a screenshot.

## LICENCE GAPS CLOSED ACROSS THE DATA FILES (18 Aug 2026)

Nine of seventeen JSON files under nodal/ carried no licence at all - including
corridor_electrical.json, created the previous day. A copier taking only the
unlicensed files had a much easier argument, so every file now carries the same
notice, matching the existing string verbatim:

    licence      CC BY-NC-ND 4.0 - https://creativecommons.org/licenses/by-nc-nd/4.0/
    attribution  GridTwin ZA - nickhedley.github.io/gridtwin-za
    licence_note Licence covers this COMPILATION - the assembly, correction and
                 structuring of the underlying data. Source data remains under its
                 own terms; see the source field.

That last line matters and is not boilerplate: what is licensed is the compilation
work, not Eskom's or NERSA's underlying data. Saying so is both accurate and
stronger than a bare notice, because it states precisely what a copier would be
taking. meta is written FIRST in each file so the terms are visible before the
data rather than several thousand numbers down.

TWO REAL BREAKAGES, both from the same cause and both worth recording. Three files
had NO meta block at all, so adding one introduced a non-numeric key into objects
that code iterates:

  * nodal_dispatch.js line 83 iterated every key of rooftop_mw_by_region to
    subtract wheeled private solar. It would have applied arithmetic to the meta
    block and turned the object into NaN.
  * validate_capacity.js summed Object.values() of the same file and produced
    "NaN - 488 = NaN vs 8619.4".

The VALIDATOR caught the second one, which is the system working: a metadata
change with no modelling intent silently corrupted a capacity identity, and the
suite refused to pass. Both fixed by FILTERING ON TYPE rather than excluding
'meta' by name, so the next non-numeric key added does not break them the same
way.

CONTEXT, from the user asking whether the site could simply be cloned: it can, and
trivially - it is a static site with no backend, so view-source, a repo fork or a
curl of the JSON is all it takes. Nothing technical will change that. Licensing
makes infringement unambiguous rather than arguable; the real protection is the
UPDATE CADENCE, since a clone is a snapshot and goes visibly stale the moment a
capacity figure is corrected or a project queued.

## REGIONAL TRADE: SAPP PLANNED LINKS, IMPORTS AND EXPORTS (17 Aug 2026)

Source: SAPP Generation-Transmission Master Plan Update, Public Presentation of
Draft Key Results, 28 July 2026 (user-supplied PDF; sapp.co.zw blocks automated
fetching).

THE KEY EXTRACTION, and it is not in the headline slides: COMMISSIONING YEARS ARE
READABLE FROM THE TRANSMISSION UTILISATION TABLES. An interface with blank cells
until a year and figures thereafter is a link that does not exist until then -
more reliable than press announcements, because it is what the plan's own model
assumed.

    2026  Mozambique-Malawi          2030  Angola-Namibia, Angola-Zambia
    2028  Zambia-Tanzania            2030  ZIMBABWE-SOUTH AFRICA
    2029  Namibia-Botswana                 Malawi-Tanzania, Mozambique-Tanzania
          Zambia-Malawi              2032  Zambia-Botswana
          Zambia-Mozambique

ZIMBABWE-SOUTH AFRICA IS THE ONLY NEW DIRECT LINK TO THE COUNTRY IN THE ENTIRE
PLAN, and it runs at 92-98% utilisation from the year it opens, in every
scenario. A corridor that congested on day one is a planning signal in itself.
Benchmark commissions it 2030; Full Regional Integration and Renewable Energy
both delay it to 2035.

3D MAP LAYER. Eight planned interconnectors added to transmission_lines.geojson,
drawn in amber and DIMMER than anything energised so the map never implies a line
exists when it does not. The direct-to-SA link is brighter and thicker than the
regional legs. Routes are INDICATIVE - the plan gives interfaces and utilisation,
not alignments - and the legend says so.

IMPORTS SLIDER, 0-8 GW, default at today's interconnection. The note leads with
the honest point: THE WIRE IS NOT THE BINDING CONSTRAINT. SAPP has a regional
supply deficit, and the plan's own benchmark requires every member to hold firm
capacity of 100% of its peak and generate 80% of its annual energy internally -
so there is limited surplus to buy, by design as much as by shortage.

EXPORTS, and this is the more interesting lever. Storage charges FIRST, because
stored energy fetches more in the domestic evening peak than the regional pool
pays; only what storage cannot absorb is exported; only what cannot be exported
is curtailed. Revenue offsets the system bill directly - the energy was going to
be spilled, so every rand is incremental.

    no exports     0 TWh exported            121 TWh curtailed   R1,339/MWh
    2 GW export    9.0 TWh over 4,657 h      112 TWh curtailed   R1,257/MWh
    5 GW export   21.3 TWh over 4,657 h      100 TWh curtailed   R1,157/MWh

R9.6bn of revenue at 5 GW, and R182/MWh off system cost. That is a bigger move
than any capex assumption argued over this week.

THE CAVEAT IS IN THE SLIDER NOTE, not buried: total SAPP demand outside South
Africa is roughly 40-50 TWh a year, so a surplus in the tens of TWh cannot all
find a home. Worse, the plan shows cross-border flows FALLING as regional
renewables rise - 3% lower under Full Regional Integration, 8% lower under
Renewable Energy - because everyone's surplus arrives in the same hours. The
export case is real but bounded, and the bound is demand rather than wires.

## VPP RUNNING TOTAL, and four visual-sweep fixes (17 Aug 2026)

From the user's session-6 sweep.

VPP TOTAL. The national enrolment slider and Where To Build placements are
ADDITIVE - the slider means "a national programme spread by demand share", siting
means "these specific municipalities on top". Deliberate, but nothing said so:
site 850 MW across two provinces, look at a slider reading 0%, and concluding the
siting did nothing is entirely reasonable. A live readout now sits under the
slider:

    850 MW of controllable load in the model - 0 MW from the national programme
    above, plus 850 MW sited in Where To Build (Kwazulu Natal 500 MW, Western
    Cape 350 MW).

This introduced a new SLIDERS entry type, `readout:true`: renders a live summary
line, writes nothing to state. Both stress_deep and validate_structure had to
learn the distinction - a readout cannot perturb an output and is not a control,
so it is excluded rather than exempted case by case.

SCHEMATIC CLICKS. The panel text promises "click any line or label for exact
figures". The implementation used native SVG <title> elements - the browser's slow
delayed tooltip, hover only, the exact behaviour removed from every other panel.
setTooltip (which the structural audit had flagged as orphaned, written for this
and never wired in) now also adds .tipbar and data-tip, so schematic elements
route through the shared delegated handler: instant, pointer cursor, responds to a
tap. Figures still only populate after Run the full model, because flows come from
the MIP.

APPLY-BUILD FEEDBACK. "Load this build into the model" scrolled to the KPI row and
left its confirmation behind at the build panel, out of sight - so it appeared to
do nothing but move the page. A banner now appears AT THE DESTINATION naming what
changed, and clears after 12 seconds so it cannot linger describing a scenario
that has since moved on.

EAF SLIDER ORDER. The part-load heat-rate slider, added earlier the same day, was
anchored in the wrong place and landed between EAF and its three indented outage
settings - so those appeared to belong to part-load. Moved below them.

COMPARISON PANEL. Values were always correct; both columns were CAPTIONED
identically, because the current column re-read the active preset button which
stays highlighted after a slider moves. It now reads "Current scenario" when it
differs, and says plainly when nothing has changed rather than pretending to
compare.

## COLLAPSIBLE SLIDER GROUPS (17 Aug 2026)

The scenario panel reached 51 controls and ran well past the bottom of the result
columns, so the last two groups sat below the fold and were effectively hidden
anyway. Each of the eight groups is now a native <details>, which brings keyboard
support and screen-reader semantics for free.

    open    Demand, Existing coal fleet, New build, Demand-side & flexibility,
            System operation, Grid
    closed  Policy & prices (5), LCOE assumptions (12)

The two closed are the ones that sit below the other columns and are least often
touched. Everything above stays open so the panel still reads as a scenario at a
glance.

A COLLAPSED GROUP DECLARES ITSELF, and this is the part that matters. Hiding
controls is only safe if the user can still see that something inside has been
changed - otherwise a scenario silently carries a setting nobody remembers making,
which is a worse failure than a long panel. Closed groups show "5 settings", and
if any differ from their default, "5 settings · 1 changed" in the alert colour.
Verified: changing the carbon price and the wind LCOE lights both badges.

Implementation note: controls are appended to the CURRENT GROUP rather than to
the panel, tracked by a `currentGroup` variable set when each header is created.
All 51 still render and validate_structure's inventory check still passes, since
it uses a descendant selector.

## BUG: "PEAK DEMAND" WAS DEMAND PLUS STORAGE CHARGING (17 Aug 2026)

Found by the user querying why the Future electricity mix preset reported 50.5 GW
of peak demand on 5% demand growth. It should have been about 33 GW, and the
demand model was right - the LABEL was wrong.

    reported "peak demand"        50.46 GW   at 09:00
      of which storage charging   29.64 GW   <- the entire discrepancy
      actual demand that hour     20.82 GW
    TRUE peak demand              33.17 GW
    expected from 5% growth       33.18 GW   <- matches exactly

peak was taken from loadS, which INCLUDES charging. Charging is a real draw on the
network but it is not demand: it is the system buying energy to sell back later,
and it is discretionary in a way demand is not. The peak hour was 09:00 - mid
morning, when 30 GW of new batteries charge off surplus solar. A charging peak,
reported as a demand peak.

WHY IT MATTERED MORE THAN IT LOOKS: it misled in exactly the scenarios storage
exists for. Someone reading 5% demand growth against a 60% jump in peak would
reasonably conclude the demand model was broken, and could have "fixed" a demand
series that was correct. It also silently inflated every peak-related figure in
high-storage scenarios.

FIX: simulate() now returns THREE figures and every label says which it means.
  peak           demand only, charging excluded - what "peak demand" claims to be
  peakGridLoad   the maximum the network actually carries, charging included
  peakChargeMW   the largest charging draw in any hour

The mix panel shows the second and third only when charging is material, so
today's view stays uncluttered while a storage-heavy scenario explains itself:
"Peak demand: 33.2 GW, peak grid load 50.5 GW including up to 33.7 GW of storage
charging."

Today's default is unchanged at 31.6 GW, because charging there peaks at 2.8 GW
and never coincides with the evening demand peak. That is why the bug survived:
it is invisible until storage is large.

NOTE FOR SESSION 3: the cross-panel consistency checker did NOT catch this. It
verified that every panel agreed with the engine - and they did, because they all
read the same wrong quantity. Agreement between panels is not correctness when
the shared source is mislabelled. Worth adding a check that peak demand moves
roughly in proportion to the demand-growth slider.

## BUG HUNT SESSION 5: STRUCTURAL AND CODE AUDIT (17 Aug 2026)

validate_structure.js + control_inventory.json. 8/8. Static analysis plus a DOM
pass, hunting things the code no longer does, does twice, or does in a way that
swallows a legitimate value. None of these produce a wrong-LOOKING number, which
is exactly why they survive.

VERIFIED AGAINST ALL THREE BUG CLASSES IT EXISTS FOR:
  * duplicate FIXED key (the lcoePs bug)   -> caught: "the LATER definition wins"
  * falsy-zero x || N (the CCS bug)        -> caught: "use ?? so 0 is honoured"
  * a control disappearing (the reorder)   -> caught, but only after a fix, below

THE CONTROL-COUNT CHECK WAS NOT ENOUGH ON ITS OWN, and finding that out mattered.
Comparing definitions against rendered controls passes when a DEFINITION is
deleted, because both counts drop together. The 17 Aug reorder bug was that shape:
a script rebuilt SLIDERS, placed everything it recognised and silently lost the
one id it did not, so the repurpose toggle vanished while state.repurpose was
still read by the dispatch engine - the model ran permanently on its default with
no way to change it. The inventory is now pinned to control_inventory.json, so
losing a control fails loudly while adding one is a deliberate baseline update.

CHECKS: duplicate keys in FIXED; `param || nonZeroDefault` anywhere in live code;
orphaned functions; every fetch() target existing on disk; every defined control
rendering; the inventory baseline; every slider carrying a note; every PRESET key
mapping to something real.

ONE REAL FIX: `p.battHours || 4` in my own battFleetHours fallback from earlier
the same day. Low impact — it is only reached when battPower is zero — but it is
the exact pattern that caused seven CCS bugs, and consistency matters more than
the individual case.

FIVE ORPHANED FUNCTIONS FOUND, now documented rather than silently dead:
dcFlows (the DC power flow engine built the same day and never wired to a panel —
precisely the runNodalYear trap repeating), plus subLookupArea, resolveColor,
mixHex and setTooltip, small helpers left from earlier iterations. Kept and
labelled, because the distinction that matters is whether the next person can
tell live code from dead.

THREE OVER-STRICT CHECKS CORRECTED, each a false-positive class worth naming:
  * Orphan detection counted only `fn(`. Functions passed as CALLBACKS or wired
    through an onclick attribute carry no parentheses, so twelve live functions
    were reported dead. Then, once fixed, functions defined in nodal/ files were
    still miscounted because the raw sources were not searched.
  * Requiring a note on every slider flagged the LCOE group, which deliberately
    shares one explanation rather than repeating it nine times.
  * Comment-stripping is essential before any of this: this codebase contains
    long comments explaining these very bugs, so a raw scan reports the
    documentation as the defect.

## BUG HUNT SESSION 4: PER-CARRIER BENCHMARKS (17 Aug 2026)

validate_benchmarks.js. 18/18. Reconciles EVERY CARRIER against published data,
not just the national total - a total can match while two carriers are wrong in
opposite directions, which is exactly how the wind nameplate and the nuclear
basis error survived for months.

    carrier          model    bench     gap    band
    coal            160.98   164.00    -1.8%   ±6%
    nuclear          11.41    10.95    +4.2%   ±8%
    wind             12.92    11.60   +11.3%   ±15%
    solarUtility      6.21     6.50    -4.4%   ±20%
    hydro             2.89     2.90    -0.3%   ±25%
    imports           8.56     8.56    +0.0%   ±5%
    co2             169.90   175.00    -2.9%   ±12%

Every entry carries BOTH a tolerance and the reason a gap exists. The rule: a gap
with a documented reason is fine; a gap without one is a bug not yet found. A wide
band with a vague reason is how a real error hides, so each wide band justifies
itself in the file.

Basis handled per carrier: the model is SENT-OUT, Ember publishes GROSS, and the
conversion uses each carrier's own auxiliary rate - coal 7.7%, nuclear 5%,
renewables nil. Applying one national factor is what made coal look 11% short on
16 Aug.

CAPACITY FACTORS ARE CHECKED SEPARATELY, and the reason is the point of the whole
session: energy and CF errors CANCEL. Verified by reintroducing the wind nameplate
bug (wind_pu inflated 1.1668x, the original error):

    wind energy   15.07 TWh vs 11.60 benchmark   +29.9%   CAUGHT, band ±15%
    wind CF       37.3%                          INSIDE the 28-38% band

The capacity-factor test alone would have missed it entirely. It took the energy
reconciliation to catch it, and the original bug survived precisely because the
energy total matched Ember to 0.2% while the nameplate was 578 MW light.

One directional assertion beyond the bands: WIND MUST READ ABOVE the
NTCSA-metered benchmark, because the model counts privately wheeled plant that
Ember excludes. A model figure BELOW it would mean capacity is missing, and a
symmetric tolerance would not catch that.

## BUG HUNT SESSION 3: CROSS-PANEL CONSISTENCY (17 Aug 2026)

validate_consistency.js. 13/13. Unlike sessions 1 and 2 this reads the RENDERED
DOM, because the bug class is specifically "the engine is right but the panel
shows something else".

VERIFIED AGAINST THE BUG IT EXISTS FOR. Reverting the psDailyFloor fix makes it
report: "at the peak hour storage delivers 0 MW while being counted as firm
capacity". That is exactly the contradiction that stood undetected for weeks -
the adequacy panel counted 2.9 GW of pumped storage as firm while dispatch
produced 0.04 TWh, both numbers on screen, nothing comparing them.

Checks: KPI panel against the engine for energy, renewables, curtailment, average
cost and replacement cost; every peak-demand figure on the page agreeing; storage
counted as firm actually discharging over the year AND present at the annual peak;
regional wind and solar summing to the national constants; regional rooftop net of
wheeled solar summing to FIXED.rooftopMW; the VPP pool reaching the optimiser
matching the sliders; and the mix totalling sensibly.

FOUR FIRST-RUN FAILURES, ALL MY CHECK RATHER THAN THE MODEL — and each one is a
definitional trap worth recording:

  * "Energy supplied" INCLUDES IMPORTS. It is everything delivered to the system,
    not domestic generation. I compared against the domestic total and reported a
    9 TWh discrepancy that did not exist.
  * Renewables prints as a WHOLE PERCENT. 18 against 18.458 is display rounding.
    Compare at the precision actually shown.
  * A loose peak-demand regex matched "firm capacity 39.2 GW" because the word
    peak appeared within forty characters. Then, once anchored, it matched prose
    that DELIBERATELY contrasts the model with Eskom's reported ~27 GW - which is
    the caveat explaining the definitional gap, not a contradiction. Now excludes
    passages naming Eskom.
  * ROOFTOP IS DELIBERATELY NOT A DIRECT SUM. rooftop_mw_by_region.json is kept
    VERBATIM ESKOM so the source stays traceable, and nodal_dispatch.js subtracts
    privately wheeled solar per region at load time - otherwise that plant is
    counted once as supply and again inside the rooftop netting. The 488 MW gap I
    flagged is exactly by_source.private.solar_mw, i.e. the subtraction working.
    The identity to assert is file MINUS wheeled == FIXED, which now passes.

That last one is the most instructive: a 5.7% discrepancy in a capacity constant
looked exactly like the phantom-MW bug of 15 Aug, and was in fact the FIX for it
working correctly. Reading the code before believing the check mattered.

## BUG HUNT SESSION 2: PARAMETER RESPONSE MATRIX (17 Aug 2026)

validate_response.js + response_matrix.json. Sweeps every control at six points
across its range and records which of eight outputs move and in which direction.
72/72 across 58 controls x 8 outputs. Baseline committed - a future change that
alters the matrix without explanation is a regression, and diffing it is a much
faster review than reading a diff.

VERIFIED AGAINST A REAL BUG. The CCS falsy-zero of 15 Aug was reintroduced
(p.ccsCaptureRatePct ?? 90 back to || 90) and the detector caught it exactly:

    capture   0%  ->  co2  23.97 Mt   <- identical to 90%, the tell
    capture  45%  ->  co2 123.58 Mt
    capture  90%  ->  co2  23.97 Mt

FIVE ITERATIONS, and every wrong version is worth recording because each was
plausible:

  1. NO ENABLING CONTEXTS. Eight controls reported dead because the thing they
     govern was off - interruptible load with no shortage, VPP pool at zero
     enrolment, gas cost with no gas running. Same discipline stress_deep uses:
     every exemption carries its reason.
  2. ZERO-CHECK COMPARED AGAINST A CONTEXTLESS BASE, so every context-dependent
     parameter looked identical at zero. Twenty lines of noise.
  3. NO MONOTONICITY GATE. The falsy-zero signature is "zero sits on the wrong
     side of the trend", which says nothing when there is no trend. The VPP
     controls are legitimately non-monotonic - peak falls to about 50% enrolment,
     then relocates to the small hours and rises - and produced eleven false
     positives.
  4. NO MATERIALITY THRESHOLD. Sub-0.5% dispatch wiggles from a marginal unit
     changing order were being reported alongside real findings. A genuine
     falsy-zero bug is a STEP - 23.97 against 123.58 - so anything under 1% of
     base is noise.
  5. IT ONLY ITERATED SLIDERS. Several meaningful-zero constants live in FIXED
     and are reachable only by URL - including every CCS parameter. The
     reintroduced bug passed 65/65 because the harness never touched it. An
     EXTRA block now sweeps them explicitly.

  Plus one self-inflicted: a comment containing backticks inside a template
  literal terminated the literal and broke the file.

TWO CONTROLS CORRECTLY EXEMPTED, both with reasons in the code:
  * outVolPct drives runMC() - the Monte Carlo risk panel - and nothing in
    simulate(). It is the VOLATILITY of the outage distribution, which only means
    anything across repeated draws.
  * battHours governs the EXISTING fleet duration; newBattHours governs new
    build. Sweeping it with 10 GW of new battery swamped an 800 MW fleet and the
    control looked dead at a 0.3% response.

REMAINING NOTES ARE NOT BUGS: drShiftPct and vppGeyserPoolMW trip the trend test
because both have genuinely non-monotonic responses that the monotonicity gate
does not fully filter at the margin. Left visible rather than suppressed - they
are cheap to re-check and suppressing them risks hiding a real one later.

## BUG HUNT SESSION 1: PHYSICAL INVARIANTS (17 Aug 2026)

validate_invariants.js. Asserts what must be true in every one of 8,760 hours,
across 11 scenarios including every corner - everything off, everything maxed, a
fleet that cannot meet load, and a system drowning in surplus. 145/147 passing.

Checks: supply equals demand hourly; nothing negative; nothing exceeds capacity;
curtailment cannot exceed available VRE; part-load multiplier >= 1 when coal runs
and exactly 1 when idle; discharge within power rating; round-trip physical;
CO2 at or above coal energy x emission factor; costs non-negative; peak sane; and
each storage fleet cycling a plausible number of times a year.

IT FOUND A REAL BUG, which is the point.

  LONG-DURATION STORAGE SITS IDLE IN A HIGH-VRE SYSTEM
    scenario  +50 GW wind, +50 GW PV, +30 GW batt, +5 GW PS, +8 GW VRFB, +8 GW Fe-air
    battery-class capacity   987 GWh
    battery-class discharge  0.023 TWh  =  0.0 cycles/yr
    pumped storage           6.209 TWh  = 41   cycles/yr  (healthy)
    CURTAILED                116.1 TWh

  987 GWh idle while 116 TWh is thrown away is not physically sensible. Pumped
  storage cycles fine, so the psDailyFloor fix of 16 Aug repaired the PS path
  ONLY - the battery-class path appears to have the same ceiling collapse that
  pumped storage had. At 987 GWh against 46.8 GW of power the fleet needs 21
  hours at full power to fill, and the charging target looks to be sized on a
  daily cycle that cannot reach it. NOT YET FIXED - first task next session.

RESOLVED, AND THE MODEL WAS RIGHT ALL ALONG. The idle-storage finding was
investigated to the end. It is NOT a bug, and two plausible-sounding fixes were
written before the diagnosis was correct.

    5,744 hours had coal generating 18 TWh WHILE 116 TWh was curtailed
    simultaneously.

Coal was at its MUST-RUN floor - minimum stable level, ramp-readiness for the
next peak, and the synchronous generation floor - so it was already serving the
load. There was no deficit for storage to discharge into, and storage cannot
displace plant that physically cannot turn down. The battery charged, filled, and
correctly stopped.

    retire 0 GW coal    battery 0.02 TWh over  37 hours
    retire 20 GW coal   battery 0.04 TWh over  32 hours
    retire 35 GW coal   battery 3.40 TWh over 883 hours, curtailment -22 TWh,
                                              CO2 -20 Mt

Storage was never broken. Coal was in the way.

THE RESULT IS WORTH KNOWING IN ITS OWN RIGHT: at very high VRE the binding
constraint is COAL MUST-RUN, not storage. Building large amounts of storage
without retiring coal achieves almost nothing. That is a real planning insight and
the model produced it correctly.

WHAT I ALMOST BROKE: I was one step from adding an "economic displacement" pass to
make storage discharge against coal. It would have let storage push coal below its
minimum stable level and synchronous floor - physically impossible, and it would
have quietly improved every high-VRE result by breaking the constraint that makes
those results honest.

TWO GENUINE FIXES WERE MADE ALONG THE WAY, both real bugs even though neither was
the cause:
  * Charging credited p.battEff (lithium, 0.88) to EVERY technology. battEffMix
    was introduced on 17 Aug for exactly this and then used in only one of the
    three places that add to battSoc, so an iron-air fleet at 45% round trip was
    charged as though it were lithium.
  * battDailyFloor sized the fleet on p.battHours - the lithium duration - even
    when the fleet averages 21 h.

THE CHECK WAS REMOVED, not retargeted. Idle storage is not a reliable bug signal:
it is frequently the correct answer, and asserting otherwise would have driven a
wrong fix into the dispatch. The pumped-storage cycling check STAYS, because PS
has an explicit daily cycling discipline and its collapse was a genuine bug.
138/138.

THREE ITERATIONS TO GET THE CHECK RIGHT, each worth recording:
  * v1 keyed the storage check on CURTAILMENT being present. The default scenario
    curtails nothing, so it never ran - the reintroduced storage bug passed
    132/132.
  * v2 measured cycles but SUMMED pumped storage and batteries. The reintroduced
    bug passed at 11.8 cycles/yr because PS collapsed to 0.7 while the battery
    rose from 0.27 to 0.70 TWh and covered for it. Aggregating hid the very bug
    the check exists to find.
  * v3 checks each fleet separately. Verified by reintroducing the 16 Aug storage
    bug: pumped storage drops to 0.7 cycles/yr and three scenarios fail.

  A check that has never been shown to fail on a known bug is not evidence of
  anything. Reintroducing the bug to prove the guard fires is the step that
  matters, and it caught two bad versions of my own check.

TWO EARLY FAILURES WERE THE CHECK'S FAULT, NOT THE MODEL'S:
  * round-trip 44.99 in a coal-retired scenario - the system was short 8,063 of
    8,760 hours, so there was nothing to charge from and storage simply drained
    its opening state. Ratio now only evaluated when charging is material.
  * CO2 below the coal floor with CCS on - capture legitimately breaks that
    identity. Floor now applies only with capture off.

# GridTwin ZA — handover

**Live site:** https://nickhedley.github.io/gridtwin-za/
**Repo:** github.com/nickhedley/gridtwin-za
**Handover written:** 14 August 2026

> Supersedes the handover of the same date. The capacity rebuild described there is
> **done**; what follows is the resulting state, the open items, and the rules that
> came out of it. Two identities in the original brief were wrong and are corrected
> below. If you spot others, say so rather than fudging a test to pass.

---

## Final platform sweep (15 Aug 2026)

Last full pass before hand-off. Two real bugs, three comment contradictions, and
a standing list of the weak assumptions that remain BY DESIGN.

**Bug 1 - nodal engines still double-counted the wheeled 488 MW.** The
pvUtilityMW correction fixed the national engine, but both nodal consumers
(nodal_engine.js and nodal_dispatch.js) net rooftop off demand from
rooftop_mw_by_region.json - which contains the wheeled fleet - while the same
plant generates as supply from by_source.private. Both now subtract
by_source.private.solar_mw per region at load (rooftop file stays verbatim
Eskom). Limpopo was the dramatic case: 388 of its 561.8 MW "rooftop" was Mooi
Plaats + Bolobedu. National reconciles exactly: 9,107.4 - 488 = 8,619.4.

**Bug 2 - a fourth and fifth `coalEAFPct || 64`.** Two more sites missed by the
earlier fix (the build-LP invocation and the CSV export filename). The LP one
mattered doubly because the EAF slider's minimum is now 0, making EAF=0
reachable from the UI. All five sites now use `??`. The one remaining `|| 0` is
a pure display of the value itself, where zero is fine.

**Comment contradictions removed:** the pre-correction pvUtilityMW paragraph
("4,974 stands with a known gap") still sat in FIXED above the new derivation
saying the opposite; the rooftop-distortion note still described the double
count as uncorrectable; and the hybrid window comment now states the half-hour
approximation (hourly model runs the 05:00-21:30 contract window to 22:00 -
long rather than short, because the obligation is availability, not a cap).

**Verified clean:** the build worker is a pure HiGHS solver (no stale copy of
any dispatch or cost logic); every remaining `|| <number>` fallback is on a
parameter that cannot legitimately be zero or is display-only.

**Weak assumptions that remain, deliberately - the honest list:**
- Hydro at a flat 0.55 CF and imports at 0.85 all year: no drought risk, no
  Cahora Bassa outage scenario. Both are fixed infeeds.
- Demand is the single 2025 hourly series scaled; no structural reshaping
  (electrification, mining closures) beyond the growth slider.
- battEff 0.88 applied once on charge; no degradation, no calendar ageing.
- The 2026-baseline CAPTURE table's regional SHAPE is judgement calibrated to
  IRP/Meridian commentary; the LEVEL now tracks the live model but the regional
  spread does not re-derive per scenario.
- Wheeling TUoS is a distance-scaled approximation of NTCSA's zonal tariff, not
  the actual zone matrix; losses likewise.
- BTM_DISPLACED_EF 0.95 is a judgement between the model's grid average (0.78)
  and its marginal coal (1.04).
- Hybrid CF 0.85 within its window is asserted, not derived from RMIPPPP
  performance data (none published).

## Two-pass professional audit (16 Aug 2026) - two real defects

ENERGY-SYSTEM PASS. Physical limits, merit order, capacity factors, emissions
consistency and seasonality all checked out - coal peaks at 98% of its available
capacity, ramps stay well inside fleet capability, CO2 reconciles exactly to
carrier x emission factor, winter/summer ratio 1.15. ONE serious defect:

  STORAGE WAS IDLE. 2.9 GW of pumped storage produced 0.042 TWh for the year
  against the 3-4 TWh Eskom's schemes actually deliver, and charged in ZERO
  hours. Cause: the charge ceiling was gated on anticipatedShortfall ALONE -
      psTargetCeiling = min(psEnergyMWh*0.85, anticipatedShortfall[h])
  and in a surplus system that term is zero almost everywhere, so the ceiling
  collapsed, storage could never recharge, and it coasted on its opening state
  of charge before sitting idle. The adequacy panel meanwhile counted the same
  2.9 GW as FIRM capacity, so the two panels disagreed. Fixed by adding a daily
  cycling floor (enough stored energy to cover the plant's rating through a
  4-hour evening peak) while keeping anticipatedShortfall as the term that lifts
  the target higher before genuine stress. Result: PS 0.04 -> 3.45 TWh, charging
  4.79 TWh, round-trip 0.776 (real PS is 75-78%), peak coal 27.97 -> 27.60 GW,
  coal +1.1 TWh which is exactly the round-trip loss.

CODER PASS. 149 top-level declarations, no duplicate names, 12 fetches with 9
catch handlers, no JSON.parse without a guard. ONE class of defect:

  SEVEN MORE FALSY-ZERO BUGS. `x || N` returns N when x is 0. Confirmed live:
  setting ANY CCS slider to zero changed nothing - capture rate 0 still reported
  23.3 Mt instead of 220.7. Converted 12 sites to `??`: ccsPenaltyPct,
  ccsCaptureRatePct, ccsOpexR, ccsCapexR, ccsTsR, coalInstalledMW, battHours.
  This is the same bug found in coalEAFPct on 15 Aug, so a standing guard is now
  in stress_deep.js (check G0) that sweeps every parameter whose zero is a real
  scenario and fails if the answer does not move.

Also noted, not defects: 7 declarations referenced once (event handlers wired
through onclick attributes, so the reference is in markup not script).

## Basis audit: every carrier is now sent-out (16 Aug 2026)

Prompted by asking whether the gross/sent-out distinction was applied
CONSISTENTLY. It was not - nuclear was the one carrier on the wrong basis.

    coal        residual; coefficients are Eskom per-sent-out      SENT-OUT  ok
    wind        Eskom ESK19243 metered hourly profile              SENT-OUT  ok
    utility PV  Eskom ESK19243 metered hourly profile              SENT-OUT  ok
    CSP         Eskom normalised feed-in profile                   SENT-OUT  ok
    hydro       fixed infeed                                       SENT-OUT  ok
    imports     metered at the border                              SENT-OUT  ok
    rooftop     behind-the-meter; netted against a demand series   consistent
                built by adding rooftop back, so the two agree
    nuclear     nuclearCF                                          WAS GROSS

nuclearCF had been set to 0.75 from Ember's 11.5 TWh / 1.86 GW = 70.6% - but
that is GROSS. At ~5% house load the observed SENT-OUT CF is 67.1%, so 0.75 sat
12% above the figure it was meant to match. Corrected to 0.70, which keeps the
intended modest recovery allowance on the right basis. Nuclear 12.20 -> 11.41
TWh; coal absorbs the difference, 157.0 -> 159.9 TWh.

DOES THE BASIS EXPLAIN THE RENEWABLES GAP? No. Renewables carry no meaningful
auxiliary load, so gross = sent-out for them and converting Ember changes their
figures not at all. Wind stays +22% and solar +11% against Ember, and those
remain what was already documented: 470 MW of privately wheeled wind Eskom does
not meter, unmodelled network curtailment, and a rooftop capacity factor (17.6%)
above the 14.9% Ember implies - the derate acknowledged as soft.

## RESOLVED: coal "11% below Ember" was gross vs sent-out (16 Aug 2026)

NOT a model error. Ember reports GROSS generation; this model produces SENT-OUT.

THE TEST THAT SETTLES IT. Our coal is purely residual - demand minus every other
source - so the coal gap IS the total supply gap, and the total is the right
thing to test. Converting Ember to a sent-out basis at standard auxiliary rates
(coal 7.7%, nuclear 5%, renewables nil, since only thermal plant carries
meaningful house load for mills, fans, ID/FD and FGD):

    Ember gross                     224.59 TWh
    Ember sent-out                  210.26 TWh
    plus our imports 8.56           218.82 TWh
    OUR MODEL                       218.87 TWh     <- 0.02% apart

On a sent-out basis Ember's coal is 164.0 TWh against our 157.0, and that 7 TWh
remainder is almost exactly offset by our higher renewables - rooftop capture
(+2.0) and privately wheeled wind (+2.6) - both already documented.

WHY COSTS AND EMISSIONS ARE FINE. costCoal (R546/MWh, Eskom FY2025 primary
energy) and emisCoal (1.04 tCO2/MWh) are both per SENT-OUT MWh, which is the
standard Eskom convention. Applying them to sent-out generation is correct.
Grossing up generation without also converting the coefficients would have
DOUBLE-COUNTED auxiliary consumption and overstated both cost and CO2 by ~8%.

DO NOT add an auxiliary-consumption term to close this gap. The earlier
suspicion that coal, CO2 and fuel cost were understated by a tenth was wrong,
and acting on it would have introduced a real error into figures that are
currently right.

## Peak demand: investigated 16 Aug 2026, NOT an error

The model peaks at 31.6 GW against Eskom's quoted winter evening peaks of
24.9-28.7 GW, and this looked like a 10% overstatement. It is not. Two findings
settle it:

1. DEFINITIONAL. Eskom quotes peak demand against ESKOM FLEET availability -
   "evening peak 27,177 MW, available capacity 30,878 MW". IPP renewables and
   imports serve load on top of that, so the quoted figure is not total system
   demand. Netting them off the model (1.0 GW IPP wind/CSP/hybrid + 1.0 GW
   Cahora Bassa at the peak hour) gives 29.6 GW against Eskom's 28.7 - about 3%
   apart, on a 2025 series that predates further decline.

2. THE ENERGY SIDE RULES OUT INFLATION. The model generates 210.3 TWh against
   Ember's 224.6 TWh. It is 6% LOW on energy. A demand series inflated 10% could
   not produce that. Scaling demand down 9% to "fix" the peak would drive coal to
   139 TWh against Ember's 177.7 - a 22% shortfall, far worse than the 11% we
   already carry.

The demand duration curve is also well formed: top hour only 1.9% above the
10th, load factor 77.5%, squarely in the normal 75-80% range for South Africa.
No spikes, no artefacts.

DO NOT rescale the demand series to close this gap. The validation panel now
states the definitional difference instead of implying an error.

## queue_project.js — intake tool for trade-press sightings (17 Aug 2026)

Asked whether we could scrape trade press. Finding articles is the easy half and
a Google Alert does it free; the hard half is trusting what an announcement says,
because announcements are marketing documents.

    node queue_project.js --name "..." --mw 155 --tech wind --area Mpumalanga \
         --cod "August 2026" --bucket private --gwh 480 --turbines 25 \
         --source "https://..." [--commit]

Dry-run by default. It refuses to queue anything that fails, and it checks:

  * CAPACITY FACTOR against physics. Ilikwa's announced ">140 GWh" over 50 MW is
    a 32% CF, which is not achievable in the Free State - the tool says so and
    tells you to use the nameplate. This is the check that justifies the tool.
  * EQUIPMENT SANITY. Turbines must imply 1.5-8 MW machines, panels 250-800 W.
    A miss usually means the MW figure is AC while the equipment count is DC, or
    that a phase boundary has been crossed.
  * BUCKET, and what it implies downstream - private goes to by_source.private
    and never touches the Eskom reconciliation; reipppp does.
  * DUPLICATES against the existing queue, normalised so punctuation differences
    do not slip through.
  * DOUBLE-COUNTING against the capacity file's as_at date.

WHAT WAS DELIBERATELY NOT BUILT: an actual scraper. Privately wheeled
commissioning has no registry and no disclosure obligation - PowerFutureLab
themselves use media reports - so there is nothing structured to scrape. RSS
feeds and Google Alerts cover the finding half at zero cost and zero
maintenance, and South Africa commissions well under one private project a week,
so the volume never justifies a fragile HTML scraper. The value was always in
validation, not fetching.

## DOUBLE-COUNT GUARD, and the REPLACE-never-ADD rule (17 Aug 2026)

THE RULE. When a new PowerFutureLab monitor or IPP Office quarterly lands, it
ALREADY CONTAINS the projects sitting in our queue - that is what a later
reporting date means. So the update is REPLACE, never ADD:

    1. Replace by_source.private (or .reipppp) wholesale from the new edition
    2. Re-derive FIXED.windMW / FIXED.pvUtilityMW from the rebuilt file
    3. THEN delete the queue entries the new edition now covers

Adding queued megawatts on top of a refreshed source counts them twice. Not
hypothetical: FIXED.pvUtilityMW carried 1,823 phantom MW until 15 Aug 2026
because 488 MW of wheeled plant sat in the utility AND rooftop buckets at once.

validate_capacity.js now enforces this. It compares each queued project's COD
against the capacity file's as_at date and prints a DOUBLE-COUNT RISK block
listing any project the file should already contain. Tested by simulating a
Sep-2026 file with the August projects still queued - all six were correctly
flagged. When nothing is at risk it states the rule instead, so the next person
reads it before they need it rather than after.

## "FUTURE ELECTRICITY MIX" PRESET REBUILT (17 Aug 2026)

The old preset was a hand-set guess. Replaced after a systematic sweep.

    OLD  decom 21 GW, wind 28.5, pv 42.5, rooftop 15, batt 20, no flex
         67.0% RE, 67 Mt CO2, R1,033/MWh, LOLE 0 (3h stressed)

    NEW  decom 27 GW + FLEXIBILISED, wind 45, pv 52, rooftop 20, batt 30, no gas
         78.5% RE, 87.4% non-fossil, 41 Mt CO2, R1,339/MWh, LOLE 0 (0h stressed)

CO2 down 39%, renewables up 11.5 points, and PERFECTLY RELIABLE - zero unserved
hours even with coal 10 points below plan, which no other option managed.

FIVE FINDINGS DROVE IT.

1. THE OLD SPLIT WAS BACKWARDS. Holding total VRE constant and shifting from
   solar-heavy to wind-heavy bought decarbonisation almost free: 28.5/42.5 gave
   67% RE and 67 Mt; 50/21 gave 75.4% and 48 Mt for R6/MWh more. South Africa
   peaks on winter EVENINGS when solar is zero.

2. BATTERIES WERE OVER-BUILT AND UNDER-WORKED at shallow coal retirement. With
   only 21 GW retired, 10/20/30/40 GW of battery gave IDENTICAL renewables, CO2
   and curtailment while cost rose R976 to R1,204. They only earn their keep once
   the system is genuinely tight.

3. GAS WAS REJECTED, on the user's argument about LNG price exposure. Quantified
   first: a 5x LNG shock costs only R20/MWh, 1.6% of system cost, because 9 GW of
   CCGT generates 0.5 TWh a year - a 0.6% capacity factor, insurance rather than
   energy. So the PRICE risk is small. But average price still moves 10% because
   gas sets the marginal price in exactly the scarcity hours it runs, and the
   SUPPLY risk is the real one: given the gas cliff, stranded firm capacity is
   worse than expensive firm capacity. Coal retention has no equivalent failure
   mode.

4. RETAINED COAL + FLEXIBILISATION BEATS GAS ON RELIABILITY at similar cost:
   LOLE 0 (0 stressed) against 5 (6 stressed), R1,288 vs R1,275. It costs 12 Mt
   more CO2 and about 4 points of renewables share. Flexibilisation itself is
   excellent value - +1.8pp RE and -4 Mt for R2/MWh, by letting coal get out of
   the way of wind and solar rather than blocking them.

5. SOLAR-LEANING IS DEFENSIBLE DESPITE COSTING EMISSIONS, on the user's point
   that wind corridors need transmission upgrades while solar sites almost
   anywhere. The GCCA data agrees - Eastern Cape wind headroom is 400 MW while
   KZN and Gauteng hold thousands of MW of solar headroom. Decisive evidence:
   the transmission-aware regional optimiser, asked what mix IT wants now that
   corridors are priced, chose 52:48 wind:solar and built NO new transmission,
   siting within existing headroom instead. The national model's uniform
   R600/kW/yr adder understates wind's real network cost, so its wind-heavy
   optimum is biased.

THE AMBITION LADDER, for anyone wanting to move the preset up or down. All rungs
use coal+flex and a solar-leaning mix; marginal abatement cost is the cost of
moving up one rung.

    decom 18 / W35 PV40 b22    71.8% RE   57 Mt   R1,113   LOLE 0 (0)
    decom 22 / W40 PV46 b26    75.1% RE   49 Mt   R1,228   LOLE 0 (0)   R2,947/t
    decom 27 / W45 PV52 b30    78.5% RE   41 Mt   R1,339   LOLE 0 (0)   R2,844/t  <- CHOSEN
    decom 31 / W50 PV58 b34    81.4% RE   33 Mt   R1,462   LOLE 0 (3)   R3,152/t
    decom 35 / W55 PV64 b38    84.6% RE   25 Mt   R1,585   LOLE 3 (5)   R3,152/t

THE MAC IS FLAT at R2,800-3,200/tCO2 across the whole ladder, so there is no
natural knee - the choice is a judgement about ambition, not an optimisation
result. The 27 GW rung was chosen as the last one that is PERFECTLY reliable:
zero unserved hours both as planned and with coal 10 points below plan. Above it
the stressed case starts to shed.

TWO REALITY CHECKS WORTH KEEPING. R1,339/MWh system cost sits BELOW current Eskom
retail tariffs of roughly R1,500-2,000/MWh, though the measures differ - system
cost excludes distribution, retail margin and debt service. And R2,900/tCO2 is far
above the SA carbon tax (R236 headline, ~R46 effective) and above EU CBAM
(~R1,550), so this abatement is NOT justified by carbon pricing. It is justified
by replacing a fleet that is retiring anyway, which is why coal decommissioning
rather than carbon price is the driver in this preset.

ALSO TESTED AND REJECTED: shifting utility PV to rooftop. Rooftop needs no
transmission at all, so it should have been favoured by the same logic as
solar-over-wind - but it moved neither emissions nor renewables share and cost
R18/MWh more, because rooftop LCOE is higher in the model. The transmission
advantage is real but the model's uniform R600/kW/yr adder cannot express it,
the same bias that affects wind.

CURTAILMENT reaches 121 TWh, which the brief explicitly de-prioritised. It is the
honest cost of a VRE-led system without long-duration storage, and the relevant
panels show it.

## EXTREME-EVENT HANDLING (17 Aug 2026)

The expansion optimiser works over 12 representative days. Two changes, because a
plan can look adequate on a sample and fail on an event the sample never held.

1. BETTER DAY SELECTION. bldRepDays previously chose the tightest single HOUR, the
slackest day, and the rest at even calendar intervals. Nothing selected for a
SUSTAINED event - a five-day winter wind drought simply did not exist in the
sample. Two extra windows are now chosen deliberately:

    worst 3-day rolling NET LOAD   sustained scarcity
    worst 3-day rolling WIND       the drought itself

The sample now clusters where it should: three of eight days fall in late June and
early July, where previously none did. Standard practice - representative days
plus explicitly chosen extreme periods, rather than hoping a sample catches the
tail.

2. FULL-YEAR STRESS TEST, run automatically after every solve. Rather than making
the optimiser see 8,760 hours - which is not browser-tractable, ~30x the LP and
minutes to solve - this takes the build the optimiser CHOSE and runs it through
the hourly dispatch engine, which already does full chronology with unit
commitment, lumpy outages and reserve. Then it does it again with coal 10 points
below plan, because the tight years are the ones where availability also
disappoints.

Three verdicts, all tested: holds up / holds at plan but fails under stress /
sheds on a full year.

IT IMMEDIATELY SAID SOMETHING USEFUL. The standard optimiser output (11 GW wind,
7.5 GW solar, 2.8 GW battery) has ZERO unserved energy across the full year as
planned - but sheds for 3 hours once coal runs 10 points worse. The plan has no
margin for a bad year, which the 12-day sample could never have shown.

It is a validation step, not an optimisation change. It cannot fix a bad plan; it
tells you when the plan you have is one.

## CHRONOLOGICAL STORAGE, and what it revealed (17 Aug 2026)

Storage in the regional expansion LP balanced WITHIN each representative day, so
it could never bank energy from a windy day for a still one. Now linked: state of
charge carries between representative days, weighted by how many real days each
stands for, bounded by built energy capacity.

    e_<region>_<year>_<day>   stored level at the end of that representative day
    soc_ rows                 e_k = e_(k-1) + weight x (0.88 x charge - discharge)
    ecap_ rows                e_k <= 4 x built capacity + existing
    bldRepDays                now returns days in CALENDAR order with prevD

Default case unchanged within noise: R615.9bn vs R616.0bn, batt 2.8 vs 2.7 GW,
and slightly faster at 14.7s. So the feature does not perturb today's answer.

IT MADE NO DIFFERENCE TO THE COAL-RETIRED CASE, AND THE REASON MATTERS MORE THAN
THE FEATURE. With 30 GW of coal retired and build caps lifted, both the within-day
and the chronological model build 21.5 GW wind, 19.9 GW solar and 0.4 GW storage.
Peak stored level reaches 1.4 GWh against a 1.7 GWh capacity, so the linking is
active and binding - it simply does not change the decision.

The cause: THE ONLY STORAGE IN THE BUILD SET IS A 4-HOUR BATTERY. Its energy
capacity is 4x its power rating. Linking days lets it carry charge across
midnight, but four hours of energy cannot ride out a multi-day wind drought
however it is scheduled. The optimiser was not being short-sighted; it was
correctly declining to buy a technology that cannot do the job.

SO THE REAL GAP IS THE TECHNOLOGY SET, NOT THE CHRONOLOGY. A coal-retired South
African system needs LONG-DURATION storage - pumped hydro (8-20h, and SA already
runs 2.9 GW of it), compressed air, thermal, or hydrogen for anything seasonal.
The build set offers wind, pv and batt only. Adding a long-duration option is the
next thing worth doing, and the chronological linking built here is a PREREQUISITE
for it: without day-to-day carry, a 20-hour store would look no better than a
4-hour one.

## A REAL BUG FOUND BY THIS TEST: bldCoalByRegion ignored coalDecomMW

The regional build optimiser retired coal ONLY on each unit's published
decommissioning date and ignored the "Coal decommissioned" slider entirely - while
the panel above it printed "using the scenario set above ... X GW retired". The
display and the model disagreed.

Caught by running a 30 GW-retired scenario and getting byte-identical builds and
an identical R616bn objective to the base case. Anyone testing a coal-retirement
scenario in the regional optimiser had been getting the base case back.

Fixed: extra retirement beyond published dates now comes off OLDEST FIRST, which
matches how a real programme would run and how the national engine treats it. The
same scenario now costs R4,335bn rate-capped, or R2,903bn with caps lifted.

## PART-LOAD HEAT RATE (17 Aug 2026)

Third of three PLEXOS-gap features. Coal was costed at a flat R546/MWh whatever
its load factor. Real units burn more fuel per MWh when backed off - auxiliaries,
mills, fans and boiler losses are largely fixed and spread over less output.

    HR(x) = HR_nominal x (1 + k x (1/x - 1)),  x = coalGen / committed capacity
    k = coalPartLoadK, default 0.10, on a slider; x floored at 0.35

At MSL (~55%) with k=0.10 the multiplier is about 1.08 - within the 5-12% range
usually quoted for subcritical coal between MSL and full load.

DISTINCT FROM THE MERIT CURVE, and additive to it. _coalMeritCurve already varied
the marginal cost by WHICH station is at the margin as output rises. Part-load is
the separate effect that EACH RUNNING STATION is less efficient when backed off.
Both now apply.

THE FINDING: the penalty grows with solar, because solar is what pushes coal to
part load.

                          mean multiplier   CO2 Mt   avg cost
    today, k=0                     1.000     167.4     561.9
    today, k=0.10                  1.015     169.9     568.7
    +20 GW PV, k=0                 1.000     130.4     605.2
    +20 GW PV, k=0.10              1.036     134.3     616.0

Ignoring part-load overstates the CO2 saving from 20 GW of solar by 1.4 Mt, about
4%. Modest now, larger at higher penetration - and only visible in an hourly model.

TWO BUGS FOUND WHILE BUILDING IT, both from placement:
  * thermalP read partLoadF BEFORE the array was written, so part-load never
    reached the marginal price. Prices did not move at all until the computation
    was hoisted above the price expression.
  * CO2 was computed from E.coal x emisCoal - energy SOLD, not fuel BURNED - so
    emissions ignored the multiplier entirely. Now uses coalFuelMWh, which is coal
    output scaled by the multiplier. This is the physically important half: the
    whole point is that a backed-off fleet emits more per MWh delivered.

## RESERVE CO-OPTIMISATION: built, correct, and defaults OFF (17 Aug 2026)

Second of three PLEXOS-gap features. Energy and reserve now compete for the same
capacity in the regional LP - a unit sells its headroom as energy OR holds it as
standby, never both:

    rc_/rdz_/rb_       reserve from coal, diesel, battery per region-hour
    cmax_/dmax_/bdmax_ now read gc + rc <= capacity, so the two compete
    resq_ rows         national requirement per hour: 794 MW contingency
                       + 2% of load + 5% of VRE
    dual on resq_      the RESERVE SHADOW PRICE

The VRE term references wind and solar ACTUALLY BUILT AND DISPATCHED, as LP
variables on the left-hand side rather than a precomputed constant. That matters:
the optimiser then sees that building more renewables RAISES the reserve
requirement, which is a real cost of a high-VRE system that a fixed right-hand
side would hide from it.

THE RESULT, and why it defaults off. The shadow price is ZERO in all 960 modelled
hours, at every fleet availability tested down to EAF 45%. South Africa has 3.4 GW
of OCGT sitting idle against a requirement near 1.9 GW, so the constraint is
always slack and standby capacity is worth nothing at the margin.

That is the SAME conclusion the hourly dispatch engine reached independently on
16 Aug - 7.1 GW of fast-start against a 1.3 GW need. Two separately written parts
of the model agreeing is a real check on both.

Keeping it on costs ~50% more solve time (16.4s to 26.3s) for a number that does
not move, so RESERVE_COOPT = false. With it off the LP is byte-identical to the
pre-reserve version (14,307,739 chars, R616.0bn, same builds, same corridors) -
verified, so the feature cannot silently perturb the default answer.

TURN IT ON when peakers retire, when a scenario strips out the OCGT fleet, or if
an ancillary services market is proposed and someone needs to know what it would
clear at. The machinery is correct; it is the South African system that makes it
uninteresting today.

## DC POWER FLOW - BUILT (17 Aug 2026)

nodal/corridor_electrical.json + a PTDF engine in index.html. All 439 lines
mapped, none unmapped: 97 inter-regional across 19 corridors, 321 intra-regional
(correctly ignored at this resolution).

METHOD. Line LENGTH computed from real geometry in transmission_lines.geojson.
REACTANCE assigned from voltage class using standard overhead-line values
(0.40 ohm/km at 220-275 kV, 0.30 at 400, 0.28 at 533-765), converted to per-unit
on a 100 MVA base; parallel lines add susceptance. This is exactly how PyPSA and
PyPSA-Eur do it - impedance is not measured anywhere, it is assigned from voltage
class and scaled by length. Endpoints resolved to regions via
substations_compact.json, falling back to nearest substation.

WHAT IT SHOWS. 1,000 MW from the Northern Cape to Gauteng produces 2,884 MW of
total absolute flow across FOURTEEN corridors - including Eastern Cape-KZN, which
is nowhere near any sensible route. A transport model routes all 1,000 MW down
the cheapest path and sees none of this. That gap is the loop flow, and it is why
a transport model can be wrong about WHICH corridor loads up.

DELIBERATELY A DIAGNOSTIC, NOT A CONSTRAINT. Coupling network physics into the LP
is the "correct" move, but the headroom-transmission coupling attempted the same
day made the LP intractable (45s to 850s+ without converging). So dcFlows() takes
regional net injections and returns physical flows and corridor utilisation,
answering "what would really happen" without touching solve time. The in-browser
PTDF was verified against a Python prototype - identical to the megawatt.

CAVEATS, also in the JSON meta: assigned rather than measured reactance; no
conductor bundling, circuit-count-per-tower or series compensation; no N-1. Good
enough to show flows follow physics rather than economics; not a load-flow study.

BUG FOUND AND FIXED THE SAME DAY: the three 533 kV circuits were being treated as
AC lines. They are the Apollo-Cahora Bassa HVDC link, and HVDC does NOT obey DC
power flow - its flow is set by converter controls, not impedance. Including it
let the PTDF route loop flow through a link that physically cannot carry any, and
it also corrupted the Gauteng-Limpopo corridor, which appeared as 1,384 km when
the real AC distance is 351 km, because a 1,000 km line to Mozambique was being
counted into it. Now excluded; the import is already represented as
FIXED.importsMW.

ON PyPSA-RSA, AND A CORRECTION. I suggested its parameters could replace ours
with "measured values". That was overstated. PyPSA-RSA descends from
PyPSA-Eur/PyPSA-Earth, which ASSIGN reactance from voltage class and length -
the same method used here. Adopting their file would mainly buy a better
line-type mapping, not measured impedance, which is not public for Eskom's
network.

SERIES COMPENSATION - NOW MODELLED (17 Aug 2026). This was the largest remaining
error and it has been fixed. Eskom has series-compensated its 400 and 765 kV
lines since 1975; the Cape Corridor alone has six capacitors at four sites, rated
450 to over 1,300 Mvar. A series capacitor CANCELS part of the line's inductive
reactance, so a compensated line is electrically SHORTER than its length implies
and carries MORE flow. Modelling it as uncompensated made the long Cape corridors
look high-reactance and under-used - the exact opposite of why the capacitors
were installed.

Applied as 50% on 765 kV and 40% on 400 kV lines over 250 km; none on short
lines, where there is no economic case. These are the standard published degrees
(historically to 50%, modern schemes to 80%), NOT per-scheme Eskom settings,
which are not public. The JSON meta says so.

Effect on corridor susceptance, higher meaning electrically shorter:

    Free State - Hydra Central      228.8 -> 438.7   +92%
    Eastern Cape - Hydra Central    152.1 -> 292.1   +92%
    Free State - Mpumalanga         201.4 -> 383.9   +91%
    Hydra Central - Western Cape    121.0 -> 177.0   +46%
    Gauteng - Mpumalanga            564.7 -> 564.7    +0%  (short, uncompensated)

THRESHOLD AUDIT, prompted by "are capacitors modelled everywhere they exist?".
The answer was NO, and the 250 km cut-off was excluding the very lines it should
have caught: the three DROERIVIER-HYDRA circuits at 247 km and BACCHUS-PROTEUS at
249 km. Droerivier, Bacchus and Proteus are all Western Cape substations on the
main Cape supply corridor - the arbitrary threshold was missing the case
compensation exists for, by three kilometres. Moved to 200 km; Hydra Central -
Western Cape susceptance went 177.0 to 220.4.

SENSITIVITY WAS THEN TESTED rather than assumed, across thresholds of 150, 200,
250 and 300 km. Corridor susceptance moves 0-16%, most corridors under 10%. So the
arbitrariness is BOUNDED and does not drive the answer - but it is arbitrary.
Eskom does not publish which individual lines carry series capacitors or at what
degree, so this remains a heuristic and the JSON meta says so. Anyone quoting a
specific corridor's number should know it rests on an assumed compensation rule.

The pattern is right: compensation strengthens precisely the corridors where
distance was limiting transfer, and leaves short ones untouched. A 1,500 MW
Northern Cape to Western Cape transfer - the solar export case - now flows mostly
down the compensated Hydra-Western Cape backbone, which is what it was built for.

REMAINING, in order:
  1. Conductor bundling and circuit count per tower. Parallel circuits ARE
     captured (they appear as separate geojson features, e.g. "... 1" and
     "... 2"), but bundling within a circuit is not.
  2. N-1 screening, which is a load flow per outage per hour and is not a browser
     workload at all.
  3. Per-scheme compensation degrees, if Eskom ever publishes them - the 50/40%
     used here are standard values, not measured settings.

## SERIOUS BUG: hw_/hp_ HEADROOM CONSTRAINTS WERE SILENTLY MISSING (17 Aug 2026)

While reverting the headroom-transmission coupling earlier the same day, the
revert replaced everything from a comment down to the hb_ row - DELETING the hw_
and hp_ constraints and leaving only the prose describing them. Wind and solar
connection headroom went completely unenforced.

NOTHING CAUGHT IT. The LP still built, still solved, still returned Optimal, and
all 290 stress checks, 44 deep checks and 33 output checks still passed. It was
found only by counting constraint families in the emitted LP and noticing hb_ was
present while hw_ and hp_ were not.

A silently missing constraint is the worst failure mode this model has: the answer
looks entirely normal and is simply wrong. Every "the optimiser builds exactly to
headroom" statement made after the revert was drawing on a run where headroom was
not enforced.

GUARD ADDED. validate_lp.js now audits the emitted LP for required constraint
families - bal_, cmax_, hw_, hp_, hb_, rate_, dur_, soc_, txa_ - and fails loudly
if any family has zero rows. 40/40 checks pass. This class of bug cannot recur
silently.

## GRID BEYOND GCCA - a one-slider answer to "should we build more grid?"

state.gridBeyondGccaPct, 0-150%, in the Grid section. Scales every region's
connection headroom in the build optimiser. Verified: total 2030 wind headroom
goes 21,520 MW at 0% to 34,432 MW at +60%, exactly 1.60x.

WHY A MULTIPLIER RATHER THAN THE PROPER COUPLING. Coupling headroom row-by-row to
the tx_ variables is the correct model and made the LP intractable (45s to 850s+).
This gets most of the policy answer - "what would a bigger build programme
unlock?" - for no solve cost at all. What it cannot do is say WHICH corridors to
build; the transmission expansion variables and the DC flow diagnostic already
address that.

WORTH KNOWING: at DEFAULT build rates the multiplier changes nothing, because the
build RATE caps bind long before headroom does - 11 GW of wind over five years
against 21.5 GW of headroom. Headroom only becomes the binding constraint in
high-ambition scenarios where build rates are also lifted. That is itself a useful
finding: for realistic build programmes, GCCA headroom is not what limits South
Africa - the rate at which projects can be delivered is.

## LONG-DURATION STORAGE: three technologies added (17 Aug 2026)

Four-hour lithium cannot ride out a multi-day lull however it is scheduled, which
is why the coal-retired test built almost none of it. Three options that can:

    PUMPED STORAGE   14 h, 78% RTE, capped 6 GW    newPsMW
    VANADIUM FLOW     8 h, 70% RTE, uncapped       newVrfbMW
    IRON-AIR        100 h, 45% RTE, uncapped       newIronAirMW

PUMPED STORAGE follows Eskom's Tubatse spec - 1,500 MW / 21 GWh, i.e. 14 hours -
which has EU/AFD grant funding and a Q1 2026 feasibility study. SA already runs
Ingula 1,330, Drakensberg 1,000, Palmiet 400 and Steenbras 180 MW. CAPPED AT 6 GW
because SITING, not water, is the constraint: pumped storage is closed-loop, so it
consumes evaporation and an initial fill rather than a continuous draw. What limits
it is needing two reservoirs several hundred metres apart vertically AND the water
to fill them. Four schemes in a century says single-digit GW, not tens.

VANADIUM's case is industrial rather than purely economic: Bushveld Minerals runs
Vametco (Brits) and Vanchem (Mpumalanga), built an electrolyte plant in East
London, and deployed Eskom's first utility-scale VRFB at Rosherville.

IRON-AIR is the only genuinely multi-day option - 100 hours, under $20/kWh,
geology-independent. The 45% round trip is the trade: it charges on energy that
would otherwise be curtailed and accepts the loss.

INTEGRATION. New pumped storage joins the PS fleet (same technology). Vanadium and
iron-air join the battery-class aggregate, which now carries an ENERGY-WEIGHTED
duration and round-trip efficiency instead of a hardcoded 0.88 - a fleet that is
mostly iron-air genuinely does behave less efficiently. Replacement-cost LCOE is
blended the same way. The chronological storage linking built earlier the same day
was the prerequisite: without day-to-day carry a 100-hour store looks no better
than a 4-hour one.

THREE BUGS FOUND WHILE BUILDING IT:
  * A regex swapping p.psPowerMW to the new totals also rewrote the INSIDE of the
    new declarations, so psPowerTot was defined as psPowerTot + newPs. Caught by a
    "cannot access before initialization" error on first run.
  * lcoePs ALREADY EXISTED at 1400 further down, used by the replacement-cost KPI.
    Defining it a second time at 1150 silently let the later one win. Removed;
    single-sourced now.
  * The new LCOE sliders were inert until the blended battery cost was wired -
    flagged by the deep harness as dead controls, which is exactly its job.

## SCOPED, NOT YET BUILT: power flow, and long-duration storage (17 Aug 2026)

### 1. DC POWER FLOW - the data gap I claimed does NOT exist

I said earlier we could not do power flow because the line data lacks length and
impedance. The length half was WRONG. Line length is computable from our own
geometry: nodal/transmission_lines.geojson has 439 LineStrings with coordinates
and voltage, giving 41,844 km:

    400 kV   252 lines   26,885 km      765 kV    14 lines    4,579 km
    275 kV   155 lines    7,884 km      533 kV     3 lines    1,049 km
    220 kV    15 lines    1,446 km

And impedance does not need to be measured. PyPSA derives r, x and b by mapping
each line to a STANDARD LINE TYPE LIBRARY keyed on voltage, then scaling by
length and circuit count - the same method PyPSA-Eur uses for Europe and
PyPSA-Earth for Africa, both validated against TSO reference models.

BETTER STILL, PyPSA-RSA already exists and is open source
(github.com/MeridianEconomics/pypsa-rsa, maintained by Meridian Economics,
originally CSIR). It models South Africa at 1, 10, 27, 34 and 159 nodes - and its
10-node resolution uses the GCCA 2025 Eskom Transmission Supply Regions, THE SAME
TEN REGIONS THIS MODEL USES. It also solves with HiGHS, as we do. So its network
parameters may be directly transferable rather than needing derivation.

REMAINING QUESTION is computational, not data: a DC load flow per hour is
tractable, but N-1 contingency screening is a load flow per outage per hour and
is not a browser workload. Scope it as DC flow without N-1 first.

### 2. LONG-DURATION STORAGE - enough cost data exists, with real caveats

IRON-AIR (Form Energy) is the strongest candidate for South Africa:
    system cost   under $20/kWh, roughly a tenth of lithium
    duration      100 hours
    RTE           40-50% - the catch, and it is a big one
    status        early commercial; first gigafactory (West Virginia) shipping,
                  75+ GWh under agreement, but limited operating experience, so
                  lenders price it as unproven
    SA fit        GEOLOGY-INDEPENDENT, which matters here

CAES needs salt caverns or similar formations, which South Africa largely lacks -
that alone probably rules it out domestically. For reference: ~$1,500-2,300/kW on
the power side, $50-90/kWh on energy depending on whether the reservoir is cavern
or vessel, RTE 45-70%.

MODELLING NOTE, and it is the important one: our storage assumes 0.88 round-trip.
Iron-air at 0.45 is a fundamentally different asset - it would charge on otherwise
curtailed energy (of which the new preset has 121 TWh) and accept the loss,
because the alternative is unserved load. The chronological storage linking built
on 17 Aug is a PREREQUISITE: without day-to-day carry a 100-hour store looks no
better than a 4-hour one, which is exactly why the coal-retired test built almost
no storage.

The user has noted long-duration is not currently on South Africa's radar - no
pipeline, no credible domestic options - so this is scoped rather than queued.

## WHY THE OPTIMISER BUILDS NO TRANSMISSION AT HIGH RENEWABLES (17 Aug 2026)

Asked why a 41 GW renewable build reinforced ZERO corridors. It is not a bug in
the transmission code, but it IS an inconsistency worth knowing about.

The optimiser built 21.5 GW wind and 19.9 GW solar. National GCCA headroom is
21.52 GW wind and 19.94 GW solar. It built EXACTLY to headroom and stopped - so
it never reached a corridor limit, and reinforcing a corridor could never pay for
itself. Transmission expansion was a decision variable that could not earn its
keep at high VRE.

That is incoherent, because GCCA headroom IS a network constraint: it exists
because the corridor cannot take more, so building that corridor should raise it.

FIX IMPLEMENTED AND REVERTED. Coupling hw_/hp_ to the tx_ variables on each
region's binding_corridor is the right model, and it was written and tested. It
made the LP INTRACTABLE - solve time went from ~45s to over 850s without
converging, twice. A tool nobody can run is worse than one with a documented
limitation, so it was reverted and the reasoning left in the code at the point
where the constraint is built.

HOW TO READ TRANSMISSION RESULTS. Expansion is real and works where corridors
bind BEFORE headroom does - at default settings it correctly reinforces the
Eastern Cape-KZN and Hydra-Western Cape corridors, the two GCCA independently
reports as binding. In high-renewables scenarios headroom binds first, and a
"no transmission built" result means "no corridor is the binding constraint
here", NOT "no network investment is needed". The GCCA headroom figure already
embeds the network build required to release it.

IF SOMEONE WANTS TO FIX IT PROPERLY: the likely route is not tighter coupling but
fewer coupled rows - e.g. one headroom-transmission link per region per HORIZON
rather than per year, or solving transmission in an outer loop around a
headroom-fixed inner LP.

## TRANSMISSION EXPANSION IS NOW A DECISION VARIABLE (17 Aug 2026)

First of three PLEXOS-gap features. The regional build LP previously took corridor
transfer limits as FIXED and priced transmission with one flat national adder
(txRPerKWyr) - it could say what the grid cost, never where it should go. Now:

    tx_<corridor>_<year>   MW of extra transfer capacity, a decision variable
    txa_/txb_ constraints  flow <= existing rating + everything built to date
    objective              annuitised at R10,000/MW-km over 40 years, so a line
                           competes with a wind farm on the same basis

20 corridors x 5 years = 100 variables, 38,400 linking constraints. Solves
Optimal in 17.5s.

THE RESULT IS A CHECK ON THE METHOD. At default settings it reinforces exactly
two corridors:

    Eastern Cape - Kwazulu Natal   339 MW built on an 813 MW existing rating
    Hydra Central - Western Cape   291 MW built on a 2,377 MW rating
    total about R1.4bn of network capex

Those are the two corridors GCCA independently reports as binding - the Eastern
Cape is the best wind region with 400 MW of wind headroom and ZERO solar, and
Hydra/Western Cape both have zero solar headroom. Nothing about GCCA headroom is
fed into this LP, so the agreement is evidence the corridor topology and costs
are behaving.

CAVEATS BUILT IN. TX_MAX_MW_PER_CORRIDOR caps the build at 4,000 MW per corridor
per year: without it the LP buys tens of gigawatts of line to avoid a little
curtailment, which is arithmetically optimal and physically absurd given real
permitting and construction times. Corridor lengths use GCCA binding-corridor
distances where they exist and straight-line proxies elsewhere, and the panel
says which. R10,000/MW-km comes from NTCSA TDP-scale figures for 400 kV double
circuit (~R12-18m/km carrying ~1,400 MW).

## VPP SITING MOVED INTO WHERE TO BUILD (17 Aug 2026)

The single-select "where it is sited" dropdown was scrapped the same day it was
built. It let you pick only ONE province, which is wrong for something that
would realistically run in several municipalities at once - Cape Town and
eThekwini are both pursuing VPPs right now.

VPP is now a TECHNOLOGY in Where To Build, alongside solar, wind, coal, CCGT,
nuclear and battery. That tool already does per-region MW allocation with a
committed portfolio, so multiple simultaneous placements come for free.

TWO THINGS IT NEEDED THAT OTHER TECHNOLOGIES DO NOT:

  1. A VPP CONSUMES NO CONNECTION HEADROOM. Everything else in that tool is new
     plant asking to connect and drawing down the region's GCCA allowance. A VPP
     aggregates load ALREADY behind the meter - no new connection, no grid-build
     charge, and if anything it relieves the network. Running it through the
     headroom path would have blocked legitimate siting and wrongly billed it.
     It is instead checked against what the region plausibly holds: its share of
     national electricity demand times the national pool.

  2. NO NATIONAL SLIDER TO BUMP. Every other technology increments a "new build"
     slider when sited. A VPP has none, because it is existing load. sliderIdFor
     returns null for it and the caller guards - defaulting to newPvMW, as the
     old fallback did, would have added phantom solar on every VPP placement.

The national sliders still work and now mean "a national programme, spread by
demand share". Sited VPPs add ON TOP, so you can model a national rollout,
a set of municipal pilots, or both. One bug caught in testing: the pool function
returned early when national enrolment was zero, silently discarding sited VPPs -
which is the NORMAL case, since no national programme exists but pilots do.

## SITE-BASED VPPs, via the live MIP (17 Aug 2026)

A VPP can now be SITED. The national sliders set the size and enrolment; a new
"where it is sited" selector places it either nationally or in one region.

WHY THE MIP AND NOT A NODAL DISPATCH. The regional build optimiser is the live
regional machinery - runNodalYear was never wired (see above). getNodalMIPInputs
already carries per-region load and corridors, so a sited VPP enters exactly
where the optimiser can see it, and the question becomes the one a municipality
actually has: does a VPP here change what the least-cost plan builds, and where?

TWO EFFECTS, both regional:
  1. Controllable geysers move WITHIN each day out of that region's highest
     net-load hours into its lowest, water-filled (dumping rebuilds the peak in
     the small hours - the rebound that dogged Eskom's ripple control). Strictly
     energy-neutral per region per day.
  2. Enrolled household batteries join that region's storage through the same
     extraBattByRegion hook the Where To Build tool uses.
  Applied to a COPY of regionLoad - the engine caches it, and mutating it would
  contaminate every later run.

THE SPLIT IS BY ELECTRICITY DEMAND, NOT ROOFTOP PV. Rooftop tracks who could
afford panels; the geyser and home-battery fleet tracks where power is consumed.
The Northern Cape is 6.8% of national rooftop but 2.1% of demand - a threefold
overstatement - because it has sun and few people. Shares come from the model's
own demand_2025_regional.csv so they cannot drift from what the optimiser
dispatches against.

At 75% enrolment of a 4 GW pool: National spreads 2,994 MW over ten regions;
Western Cape concentrates 400 MW; Gauteng 1,120 MW; Northern Cape only 84 MW.
Cape Town's municipal VPP is therefore a governance and market-design pioneer
rather than a system-scale intervention - Gauteng is where the megawatts are.

TWO BUGS FOUND WHILE BUILDING IT:
  * The control panel had no SELECT type at all - only ranges and toggles. Added.
  * applyState() assumed every control has a cv_ readout and an fmt(). A select
    has neither, so it THREW and aborted applyState PART WAY THROUGH - every
    preset silently stopped applying at the first select it met, and scenarios
    downstream ran on stale values. Caught by validate_outputs dropping 33 -> 30
    the moment the picker was added. That harness earned its keep.

## T&D LOSSES: correctly ABSENT, do not add them (17 Aug 2026)

Agreed to add transmission and distribution losses to the national engine, then
checked before implementing. It would have been an ERROR.

The demand series is Eskom's TRANSMISSION-LEVEL demand - what generators must
send out - and is therefore already gross of downstream losses:

    our grid demand           205.66 TWh
    Eskom FY2024 billed sales 183.31 TWh
    implied gap                22.35 TWh = 10.9%,  against Eskom's reported 9.1%

Adding a 9% loss factor would have taken generation from 218.91 to 239.25 TWh
against an Ember-equivalent of 218.82 - and since coal is the swing producer the
entire 20 TWh lands on it, moving coal from 2% BELOW its benchmark to 11% ABOVE.

The 0.02% Ember reconciliation established the same morning is the proof: it only
holds because generation equals demand, which is correct at this model boundary.
Recorded in the site's caveats so the absence reads as a decision, not an
oversight.

## RETIRED: runNodalYear() (17 Aug 2026)

Never called from index.html. Defined in nodal_dispatch.js, referenced only in
comments - 13.7 KB, 61% of that file, parsed on every load and never executed.
The live "nodal" capability is getNodalMIPInputs() feeding the regional build
optimiser, which works over representative days rather than 8,760 hours.

Not deleted, but given an unmissable header saying it is unwired and why:
cost (8,760h x 10 regions with per-hour Dijkstra, doubled for the GET pass),
duplication (a second engine answering the same questions as simulate(), with no
reconciliation test between them), and scope (hourly corridor congestion is an
operations question; this is a planning tool). Its one real advantage was
transmission losses - and that turned out to be a non-issue, see above.

If an hourly nodal view is ever wanted, treat it as its own project and start
with a reconciliation test against simulate().

## RESOLVED: 380 MW double count caught before rollforward (17 Aug 2026)

Investigated the Mooi Plaats flag. BOTH it and Umsobomvu were already counted.

    nodal/pfl_private_h1_2026.json projects[] contains:
      Mooi Plaats   240 MW solar  LIMPOPO        Anglo American Mogalakwena
      Umsobomvu     140 MW wind   NORTHERN CAPE  EDF, Noupoort

Both were already inside by_source.private. Rolling the queue forward as written
would have overstated pvUtilityMW by 240 MW and windMW by 140 MW - 380 MW of
phantom capacity, the identical failure mode to the original pvUtilityMW bug.
Both entries removed from the queue; the resolution is recorded in
resolved_double_counts[] so the finding survives the deletion.

TWO PROVINCE ERRORS ALSO CORRECTED. The trade coverage of the Koruson 2 cluster
led me to place Mooi Plaats in the Northern Cape; the monitor puts it in LIMPOPO
against an Anglo Mogalakwena offtake. A cluster's name and a plant's location are
different things. Umsobomvu I had moved to the Eastern Cape on Mining Weekly's
say-so; the monitor says Northern Cape, and Noupoort is in the Northern Cape, so
the monitor is right.

THE ROOT CAUSE, now fixed in tooling. The two buckets have DIFFERENT EFFECTIVE
DATES and the guard was comparing everything to one of them:

    reipppp   anchored to meta.as_at              31 Mar 2026
    private   anchored to the PFL H1 monitor      30 JUN 2026  <- three months later

Comparing a wheeled COD against 31 March clears anything from April-June as "not
yet counted" when the monitor almost certainly has it. validate_capacity.js now
derives the private basis from meta.private_coverage ("h1-2026-only" -> 30 Jun),
applies the right basis per bucket, AND name-matches the queue against
pfl_private_h1_2026.json projects[] - a name match being definitive where date
arithmetic is only indicative.

STILL AMBIGUOUS: Hartebeesthoek (140 MW wind, June 2026). Its COD is inside the
monitor's coverage but it is NOT in the project list - either the June date
slipped into H2, or the monitor missed it. Queued with an explicit instruction to
NAME-CHECK against the next monitor rather than add on date logic.

## THE QUEUE IS NOT A COMPLETE RECORD (17 Aug 2026)

Flagged by the user: alerts only started being shared today, so commissionings
between the 31 Mar basis and now were captured only by chance. Coverage by month:

    April   Graspan, Umsobomvu          May   NOTHING - unchecked
    June    Hartebeesthoek              July  Ummbila Emoyeni
    August  Ilikwa                            (all found retrospectively)

MAY IS BLANK and other months are probably incomplete. Treat the queue as "what
we happened to see", never as an exhaustive list.

WHY THIS MATTERS LESS THAN IT LOOKS. The gap self-heals on rollforward: the next
IPP Office quarterly and PowerFutureLab monitor contain EVERYTHING, including
what we missed, and the update procedure REPLACES the bucket wholesale rather
than adding queued items. So the queue only needs to be good enough to know
roughly where we stand in the interim - it is not the system of record.

WHAT IT DOES AFFECT: reading the model TODAY. The live fleet understates reality
by at least the 800 MW queued, and by an unknown amount more.

CODs CORRECTED THE SAME DAY, and worth learning from. All five newsletter
projects were queued as "August 2026" because the piece said the Koruson 2
cluster was "now fully operational". That was the completion of the LAST unit,
not the COD of all three. Primary sources give:
    Mooi Plaats solar 240 MW    ~March 2026   (Mining Weekly, 24 Apr)
    Umsobomvu wind 140 MW        April 2026   (Mining Weekly, 24 Apr)
    Hartebeesthoek wind 140 MW   June 2026    (Mining Weekly: "on track for June")
    Ummbila Emoyeni ph1 155 MW   July 2026    (Engineering News, 7 Aug)
Hartebeesthoek was also moved from Northern Cape to EASTERN Cape per the source.

MOOI PLAATS IS NOW FLAGGED AS A DOUBLE-COUNT RISK: at ~March 2026 its COD is at
or before the 31 Mar basis, so it may ALREADY be in by_source.private. Verify
before rollforward - adding it would double count 240 MW. The guard catches this
automatically now that the COD is right, which is precisely why COD accuracy in
the queue matters more than it appears.

LESSON: a commissioning announcement dates the ANNOUNCEMENT, not the COD. Always
chase the primary trade report for the actual date.

## PRIMARY SOURCE FOUND for wheeled commissioning: #PowerTracker (17 Aug 2026)

CORRECTION to the note below, which said no systematic source existed for
privately wheeled commissioning and that trade press was therefore the fastest
signal. That was wrong.

Oxpeckers #PowerTracker (powertracker.oxpeckers.org) carries an explicit ENERGY
WHEELING category and sends EMAIL ALERTS on point changes. It flagged Ilikwa's
commissioning the same week. That is the event-driven source the workflow was
missing - a wheeled commissioning now surfaces immediately rather than waiting
up to six months for the next PowerFutureLab monitor.

ACTION: subscribe to alerts. It is now first in the SOURCE CALENDAR printed by
validate_capacity.js.

LICENCE, and why we do not simply ingest it. PowerTracker content is CC BY-SA
4.0; our data files are CC BY-NC-ND 4.0. Those do not compose - Share-Alike
would require our derivative to carry BY-SA, which conflicts with both the NC
and ND terms. The resolution is the one we already use for IPP Office and Eskom
figures: a project FACT (name, MW, technology, location, COD) is not
copyrightable, so we use PowerTracker to DISCOVER and VERIFY, record the fact in
our own compilation with attribution, and never copy the dataset. queue_project.js
recognises a PowerTracker URL in --source and prints this note.

PowerFutureLab remains the AUTHORITATIVE half-yearly reconciliation; PowerTracker
is the fast alert. They are complements, not substitutes - use PowerTracker to
know something happened, and the monitor to true up the totals.

## STAYING CURRENT: the structural problem, and what tooling can do

Asked how we avoid missing project commissionings. The honest answer is that the
two categories behave completely differently:

REIPPPP is well covered. The IPP Office quarterly is authoritative, and Eskom's
WEEKLY system status report gives installed totals by technology - so a jump in
its Wind or PV line is a same-week signal that something commissioned. The
validation panel already compares against it.

PRIVATELY WHEELED IS NOT COVERED, and this is the real exposure. It is the
fastest-growing category in South Africa, and:
  * Eskom's weekly report does NOT include it - only NTCSA-contracted plant
    appears there, so no amount of watching Eskom will reveal a wheeled project
  * its only systematic source, the PowerFutureLab monitor, is HALF-YEARLY
  * so the file can be six months behind on the segment moving quickest

That means trade press is not a poor substitute for a proper source - for
wheeled capacity it is genuinely the FASTEST signal available. Queuing from it,
as done on 17 Aug for Koruson 2, Ilikwa and Ummbila Emoyeni, is the right
workflow rather than a workaround.

validate_capacity.js now prints a DATA FRESHNESS block on every run: how old the
file is, whether a newer IPP Office quarterly should exist (quarter end + 75
days), a louder warning once private coverage passes 180 days, the MW already in
construction, and a SOURCE CALENDAR with what to check and how often. It also
states the drift-detector limitation above, so the next person does not assume
Eskom's weekly covers everything.

## QUEUED: five privately wheeled projects commissioned Aug 2026 (17 Aug)

Koruson 2 (Envusa, 520 MW: Umsobomvu 140 + Hartebeesthoek 140 wind, Mooi Plaats
240 solar), Ilikwa (Mainstream, 50 MW solar, Free State) and Ummbila Emoyeni
phase 1 (Seriti Green, 155 MW wind, Mpumalanga). Total 435 MW wind + 290 MW
solar, ALL privately wheeled rather than REIPPPP.

NOT hand-added, for the same reason as Graspan: the capacity file is anchored to
the IPP Office Q4 (31 Mar) and PowerFutureLab H1 2026 monitor, and these
commissioned in August. Queued in supply_area_split_draft.json instead, and
validate_capacity.js now prints BUCKET-AWARE instructions - private wheeled goes
to by_source.private and does NOT touch the Eskom Week-32 reconciliation, because
Eskom does not meter it. The previous single instruction said "add to reipppp"
for everything, which would have sent the next person to the wrong bucket.

On rollforward these would take windMW 4,612 -> 5,047 and pvUtilityMW 3,151 ->
3,516 (with Graspan). Note that would WIDEN the gap against Ember's Wind line,
correctly: Ember counts only NTCSA-contracted plant, so more wheeled capacity
means the model should read further above it, and the validation note explaining
that will need its numbers updated.

DATA CAUTION recorded in the queue entry: Ilikwa's announced ">140 GWh/yr" over
50 MW implies a 32% capacity factor, which is not credible for Free State solar
(our regional profile gives ~22%, single-axis tracking reaches 26-28%). Use the
nameplate, not the announced energy.

Also notable for the model's structure: Ummbila Emoyeni puts private wind in
MPUMALANGA, where regional wind capacity is currently zero - the coal heartland
is starting to host renewables, and the regional file will need a Mpumalanga
wind entry it has never had.

## RESOLVED: wind_nameplate_est in profiles.json (16 Aug 2026)

`profiles.json` normalised Eskom's metered hourly wind output against
`wind_nameplate_est = 3466` MW, giving `wind_cf_2025 = 0.373`. The METERED
ENERGY was always right - 3,466 x 8760 x 0.373 = 11.33 TWh against Ember's
11.35 TWh for calendar 2025, agreeing to 0.2% - but the divisor understated the
operating fleet, so every per-unit value was inflated by ~1.17x.

Re-derived by requiring the series to reproduce Ember's 11.6 TWh (12 months to
May 2026) over the 4,142 MW fleet Eskom actually meters (REIPPPP 4,042 + Eskom
Sere 100). That solves to 4,044 MW - which lands on the REIPPPP wind fleet
independently, a check on the method rather than a fitted value. `wind_pu` was
rescaled by 0.8629 and `wind_cf_2025` is now 0.3197.

Result: model wind 15.0 -> 12.9 TWh, of which 11.60 TWh is Ember-comparable
(exactly Ember's 11.6) and 1.32 TWh is the 470 MW of privately wheeled wind that
Eskom does not meter and Ember does not count.

DO NOT compensate for anything like this with an availability or loss derate in
the engine. That was tried on 16 Aug 2026 and reverted: the national profiles are
METERED output (Eskom Data Portal ESK19243), so availability, electrical losses
and real curtailment are already inside them, and the regional Renewables.ninja
series additionally carries an explicit 10% PV system loss. A derate charges
those losses twice, and would have produced roughly the right number by the wrong
mechanism - breaking the moment anyone corrected the nameplate.

`pv_nameplate_est` (2,789 MW, CF 20.8%) was checked the same way and LEFT ALONE.
Ember's Solar line is all solar - utility plus distributed - so there is no clean
utility-only external anchor, and 20.8% is a reasonable SA fixed-tilt figure.

## Three planner/developer features added (15 Aug 2026)

1. **System adequacy panel** (above the validation block). LOLE (h/yr with
   unserved load), EUE (GWh/yr), and monthly reserve margin as a 12-bar chart
   with hover detail. Firm capacity = coal x EAF + nuclear x0.9 + hydro +
   imports x0.85 + peakers + storage power + hybrid x CF; wind/solar excluded
   from firm by convention (they reduce residual load), matching Eskom's weekly
   OR framing. Verified: LOLE/EUE reconcile exactly with the run's unserved
   hours; defaults show 0 LOLE, firm 39.2 GW, min margin 24% (Jun).
2. **Unified project pre-feasibility** (was solar-only). Solar / wind / hybrid
   (60/40, same convention as the data-centre tab). Wind CF comes from the
   clicked region's profile (same source as the resource tab); wind capex R21/W
   (the main model's build cost); opex 1.5%/2.5%/2.0% of capex by tech. The
   report shows the chosen tech's CF and swaps "peak sun hours" for
   "equivalent full-load hours" on non-solar.
3. **Site curtailment risk in the Grid connection tab.**
   applyCurtailmentToMap now publishes per-region shares
   (window.__nodalCurtByRegion), and the grid tab shows "curtailment risk at
   this connection: X%" - the SAME numbers on the SAME basis as the schematic
   labels, so the two can never disagree. Prompts to run the full model when no
   nodal result exists.

CCS module kept as-is per user decision - it is live government policy
discussion and the module's role is answering "why doesn't SA just do CCS"
quantitatively.

## Final platform sweep (15 Aug 2026) - the eight-list problem

A new carrier must be added to EVERY hardcoded carrier list, and the app had
EIGHT of its own beyond the test suites' copies. All were missing `hybrid`:

1. `DISP_ORDER` - the dispatch chart's own stack order. **The rendered chart was
   drawing without the hybrid band**: 285 MW of served generation invisible, the
   stack top floating below the demand line through 05:00-21:00. Slipped every
   suite because stress_suite validates its own (updated) key list, not the
   chart's. Worst per-hour gap now 0 MW.
2. `genKeys` in the avgCost path - hybrid's 1.77 TWh was missing from the
   gridServed DENOMINATOR while its costs sat in the numerator: **average system
   cost was overstated ~0.9%** (R550.2 -> R545.5 at defaults).
3. The same `genKeys` copy in the nodal cost overlay.
4. KPI `genTWh` plus `reShare`/`nonFossilShare` - hybrid is renewable, so the
   renewable share was understated ~0.9 pp.
5. The CSV export carrier list and its names map (now `Hybrid (RMIPPPP)`).
6. The weather-spread generation total.
7. The energy-mix donut list.
8. The accessibility dispatch table's hand-rolled total.

`lcoeOf` also gained `hybrid: 1900` (RMIPPPP awarded tariffs cluster
R1.5-2.3/kWh; midpoint) so replacement-cost weighting covers all served energy.

Also fixed in the sweep: **the NERSA category rules were two amendments stale** -
the pre-feasibility tab said a generation licence is required above 10 MWp,
which is pre-2021 law. The Aug 2021 ERA amendment raised the threshold to
100 MW and the Dec 2022 amendment (effective Jan 2023) removed it entirely:
generation of any size registers rather than licenses, and the binding steps
are environmental authorisation and the grid connection agreement. The tab now
states the post-2023 regime and says NERSA is no longer the timeline driver.

Checked clean: the BLD and MIP worker sources carry no stale VOLL (the 60000s
remaining in the file are LP variable bounds and the pumped-storage energy
constant); scenario presets reference only live sliders and current defaults;
permalink state, season toggles and CSV downloads verified against the new
carrier; no `E.x+E.y` hand-rolled sum anywhere lacks hybrid (regex-swept).

## Site Resource Query box - cross-tab audit (15 Aug 2026)

All seven tabs audited for internal consistency, cross-tab consistency, and
consistency with the main model. Three real defects fixed, one structural fix:

1. **Battery cost disagreed 4.5x between adjacent tabs.** Rooftop priced
   behind-the-meter batteries at R6,500/kWh installed; pre-feasibility priced the
   same thing at R1,450/kWh - a utility cell-pack figure mislabelled "installed
   (BNEF 2026)". A 100 kWh C&I battery really lands ~R500-700k, not R145k, so
   pre-feas payback figures were materially flattering. Both tabs now read ONE
   shared constant `BTM_BATT_R_PER_KWH = 6500` (utility-scale EPC in the main
   model is R2,625/kWh for contrast - BTM does not get that price).
2. **Wheeling tab carried its own hardcoded 2026 capture table** (Northern Cape
   solar R490 etc.) while the Capture tab tracked the live model - the two tabs
   could show different capture prices for the same region on the same screen.
   Both now call one `captureFor(region)` helper: live-adjusted when a model run
   exists, 2026 baseline otherwise, and the footer says which. The "vs local"
   comparison also previously hardcoded "Gauteng ~R600/700"; it now prices
   building at the consumption region through the same helper.
3. **Data-centre tab sized on national profiles but labelled with site CFs.**
   The hourly-matching bisect ran against the national solar shape (22.5% CF)
   while the header quoted the clicked site's CF (e.g. 26.5% in the Northern
   Cape) - a ~10%+ sizing mislabel. It now simulates on the REGIONAL profiles
   from profiles_regional.json (solar shape rescaled to the site's own CF; wind
   used directly since its mean IS the displayed CF) and the header says which
   profiles sized the build. Also removed a dead `cfHours = cf + 0.17` relic
   from the pre-hourly-model era.
4. **One emission factor.** Pre-feas and rooftop each hardcoded 0.95 kg/kWh; now
   one `BTM_DISPLACED_EF = 0.95` with the honest justification: the model's grid
   AVERAGE is 0.78 tCO2/MWh but its MARGINAL generator is coal (1.04) for 8,700+
   h/yr, and displaced generation is marginal - 0.95 is deliberately between.
   `PPA_MARGIN = 0.12` similarly unified across capture and wheeling.

Checked and left alone: grid-connection tab (reads the same headroom_summary and
substation kv as the nodal engine - already consistent); capture-fraction row now
shows the live fraction when live (it previously showed the static one next to a
live price, so the row could not reproduce the price beside it); wheeling TUoS
(R100-230/MWh distance-scaled) and losses (2%+0.003%/km, cap 6%) are within the
NTCSA framework's published brackets; the flat-24/7-load assumption in wheeling's
annual-energy line is now stated rather than silent.

## Deep stress test (15 Aug 2026) - two bugs found and fixed

`stress_deep.js` (repo root, `node stress_deep.js` against a checkout in
`testroot/`) probes cross-talk the standing suites don't: price<->cost coherence
per marginal technology, exact VOM decomposition, hybrid window physics, basis-
replay visibility, a full every-slider-moves-something sweep with per-slider
enabling contexts, extreme-scenario boundedness, EAF/carbon monotonicity, and
rendered-panel consistency. 40 checks; all pass as of this date.

It found two real defects on its first run:

1. **`(p.coalEAFPct || 64)` - falsy-zero fallback.** EAF=0 silently became 64%:
   "total coal collapse" scenarios showed ZERO unserved energy with the whole
   fleet dead. Fixed with `??` at three sites (dispatch, LP inputs, and a third
   consumer), plus the same fix on `syncMinMW`. After the fix, EAF=0 correctly
   yields ~122 TWh unserved and unserved is monotone in EAF.
2. **LP VoLL drift.** Both build LPs hardcoded `VOLL = 60000` while dispatch
   prices unserved energy at `FIXED.voll = 87000` (CSIR cost of unserved
   energy) - planning penalised blackouts 31% cheaper than operations priced
   them. Both LPs now read `S.voll ?? 87000`. The national build LP re-solved
   Optimal (R335.8bn, builds at the IRP rate caps) after the change.

Two things it flagged that are NOT bugs, recorded to save the next person the
investigation: storage discharge exceeds charging by up to the fleet's initial
state of charge (~64 GWh, drawn down once per year - a convention, not free
energy); and `outVolPct`/`getsEnabled` legitimately move nothing in the
deterministic engine (Monte Carlo panel and nodal corridors respectively).

## Known distortion: `rooftopMW` is not all rooftop

Eskom's footnote to the series `FIXED.rooftopMW` is taken from reads:

> Rooftop PV includes ground-mounted as well as all other PV installations that do
> not have contracts with NTCSA.

The bucket is **contractual, not physical**. Any ground-mounted farm selling to a
private offtaker has no NTCSA contract and lands here rather than in Eskom's PV
line - Mooi Plaats (240 MW), Bolobedu (148 MW) and the rest of the PFL wheeled
list are inside the 9,100 MW.

**Why it matters here.** `rooftopMW` nets off demand: it is modelled as demand
suppression, never curtailed, and takes no connection headroom. Ground-mounted
grid-connected plant is the opposite - it is supply, it can be curtailed, and it
competes for headroom. So an unknown slice of this constant is modelled as the
wrong kind of thing. The effect is to understate utility-scale generation and to
understate the curtailment and headroom pressure it creates, which is exactly what
the nodal engine exists to measure.

**Not corrected, deliberately.** Eskom publishes one number and does not break out
the ground-mounted share. Fixing it needs that split, not an estimate: an estimate
would move capacity between two constants that are each independently sourced,
which is a worse position than a documented distortion. Candidate sources are
SAPVIA's portal segments (C&I large-scale 1-50 MW and utility-scale are the
ground-mounted candidates) or PFL's wheeled-project monitor, which lists such
projects individually and is already a source in this model.

**Interaction with the pvUtilityMW gap below:** the 488 MW of PFL wheeled solar
currently in `by_source.private` is inside Eskom's rooftop figure too, so it is
double-counted today. That is a live error, unlike the distortion above.

## The pvUtilityMW gap - RESOLVED 15 Aug 2026

`pvUtilityMW` was a hand-set 4,974 MW carrying an unexplained 1,823 MW above its
sourced components. Eskom's Weekly System Status Report (Week 32, Aug 2026)
settled it: their "PV" line - NTCSA-contracted utility PV - is **2,780.2 MW**,
which our REIPPPP figure of 2,663 MW (31 Mar 2026) reproduces exactly after
adding Graspan (75 MW, COD Apr 2026, after our reporting date) and ~42 MW of
later CODs. So the REIPPPP component was complete all along; there was never a
hidden pre-2026 wheeled fleet; **the constant was simply wrong** - the same
failure and the same fix as `windMW` (4,458 -> 4,512). CSIR's utility-scale
series corroborates independently.

Corrected values, both now derived and strictly asserted (16/16, zero pending):

    pvUtilityMW = 2,663 REIPPPP + 488 PFL wheeled            = 3,151
    rooftopMW   = 9,107.4 (Eskom Jun-26 table) - 488 wheeled = 8,619.4

The 488 subtraction removes the **double count**: Eskom's rooftop bucket is
contractual (their footnote: includes ground-mounted plant without NTCSA
contracts), so the wheeled fleet sat in both constants. The two identities now
share one sourced number (`by_source.private`) and cannot drift apart. The
earlier PFL-monitor request and the "definitional question" below it are moot;
the sections that discussed them are superseded by this one.

Impact: removes 2,311 MW of phantom solar from the national engine (the nodal
engine already used the correct file). Default average price R738.6 -> R741.3
(+0.4%); diesel hours 14 -> 16 - slightly less midday solar, slightly more
evening scarcity. The validation panel now shows both constants against Eskom's
Week 32 lines with the reconciliation in the notes.

## Supply-area split (applied 14 Aug 2026)

The IPP Office reports by PROVINCE; this model is keyed by Eskom TRANSMISSION
SUPPLY AREA - ten values including Hydra Central, which is not a province at all.
`build_capacity.py` step 1b redistributes each province's ONLINE capacity using
CONTRACTED shares from `nodal/supply_area_split_draft.json`, built by
`build_supply_area_split.py` from the IPP Office project-location table (BW1-BW4
+ CSP window) plus the DMRE BW5 preferred-bidder statement.

**Applied as shares, never as absolute megawatts.** The split file carries
contracted capacity; this file carries capacity online. Substituting contracted MW
directly would break the national identities. The build asserts each technology's
total is unchanged to within 0.2 MW.

Two consequences that look like bugs and are not:

- **Eastern Cape solar is ZERO.** Dreunberg is the only EC solar project in
  BW1-BW4 and it connects into Hydra Central, so all 70 MW moves. Verified with a
  real site coordinate: Ruigtevallei 70.5 km vs Delphi 142.6 km.
- **Western Cape wind gains ~419 MW.** Roggeveld, Karusa and Soetwater are filed
  by the IPP Office under the Northern Cape but connect at Komsberg, in the
  Western Cape supply area. This is the Hydra Central distortion running the
  opposite way, and it is the reason the split exists at all.

Hydra Central goes from 88 MW wind / 256 MW solar to **669 / 459 MW**. Its largest
single input is EDF's Koruson 1 cluster (San Kraal + Phezukomoya, 280 MW), sited at
Koruson substation on a STATED connection point rather than a proximity estimate.

Pending: Graspan Solar (75 MW, Siyancuma, Northern Cape) was commissioned in April
2026, just after the 31 Mar 2026 reporting date. It belongs to the Northern Cape
supply area and should be added when the capacity file rolls forward - see
`pending_next_quarterly` in the split file.
