# GridTwin ZA - dated commitments

Things that expire. Checked at the start of every session; anything past its date
either moves to LOG.md as done or gets a new date and a reason.

Last reviewed: 22 Sep 2026, against NERSA's Electricity Regulation Projects Dashboard,
Issue 04 (September 2026, last updated 15 Sep 2026).

---

## Hard deadlines

```
28 Sep 2026    NERSA Trading Rules - written comments close. Extended to this
               date (NERSA dashboard Issue 04); member workshop in October,
               target completion 31 Oct 2026. Governs how wheeling and trading
               clear. Six days from this review. The Megaflex ordering claim
               holds at 2025 conditions only - date it if it is quoted.
29 Sep 2026    Draft Rule on Mediation and Arbitration - written comments close.
               Public hearing 8 Oct 2026. Low relevance to the model.
30 Sep 2026    TDP Rules (content of the TDP, section 35(3A)) - with the
               Minister, target 30 Sep. Watch: tdp_projects.json and the
               headroom growth path rest on the TDP.
6 Oct 2026     EMAF workshop on the Vesting Contract Framework and the
               Wholesale Tariff Methodology, both in finalisation, target
               31 Oct 2026. The methodology is the cross-check on the
               price-component mapping; vesting contracts bear on the
               market-indexed retail basis.
8 Oct 2026     Public hearings: Eskom Retail Tariff Structural Adjustment
               (ERTSA; written comments closed about 7 Sep) and the Mediation
               and Arbitration rule. ERTSA is directly relevant to the retail
               panel's Homeflex and Homepower comparisons.
Oct 2026       Price and Tariff Rule - consultation paper to be published in
               October, subject to the Electricity Pricing Policy; target
               30 Nov 2026. Sets unbundled prices and tariffs, which is what
               the retail panel models. The most relevant open consultation.
31 Oct 2026    Market Code - Energy Regulator decision expected (member
               workshop held 15 Sep). KPIs for Municipalities Rules - target
               completion; hearing held 14 Aug, Treasury engagement under way.
               Bears on the municipal-customer gap and the PARI work.
Nov 2026       Two-year Pilot Tariff for Crypto Currency Mining and Other
               Customers - to ELS and the Energy Regulator in November; comment
               and hearing dates to be confirmed.
TBC            Market Surveillance Framework - revisions requested by ELS
               after 1 Sep submission.
Underway       CoS Framework Review; Compliance Enforcement Rules. No dates.
31 Dec 2027    INDEPENDENT TSO, state-owned, outside Eskom. Treasury's RFP
               for a transaction adviser names this date, and the mandate
               explicitly EXCLUDES reconsidering the policy - the TSO owns
               and controls the network. The Electricity Regulation Act
               allows until end-2029, so this pulls the reform forward two
               years. NTCSA stays an interim Eskom subsidiary until then.
               Bears on the market-indexed basis in the retail panel: that
               mode assumes a competitive wholesale market, and this is when
               its counterparty exists.
```

## Recently closed

```
20 Sep 2026    Draft Electricity Pricing Policy - comment closed (this file
               said 28 Sep; corrected). The Price and Tariff Rule above follows
               from it.
```

## Expected publications - watch for these

```
Dec 2026       AEMO Transition Plan for System Security. Absorbs the Engineering Roadmap and
               carries workplans for system strength, oscillatory stability and system
               restoration, plus a damping study due before it. The first published position
               on whether grid-forming batteries can substitute for synchronous machines,
               which is what SYNC_GFM_SHARE 0.30 and the no-syncons finding rest on.
~Nov 2026      IPP Office Q1 2026/27 quarterly (as at 30 Jun 2026).
               Will contain Mulilo Total Hydra if COD was H1; if COD is 2026-07
               it lands in Q2 instead. EITHER WAY the double-count guard fires
               and the named entry must be REMOVED. See RULES.md rule 5.
~Feb 2027      PFL IPP monitor, H2 2026 update. Replaces by_source.private
               wholesale. Same removal discipline.
Jan 2027       Full calendar 2026 RSA Contracted Demand (ESK19679). Replace the
               provisional Jan-Aug ratio (0.9442, domestic) by re-running
               build_demand_2026.py on the full year, then re-measure every preset.
annual         IPP Office "An Overview of the IPPPP" - the named-project layer.
               The only published route to the Hydra Central split.
monthly        Seriti Green grid simulation. Published since Jan 2026; the
               August edition covered July. Next one is a free differential test.
```

## Leadership, because two model assumptions rest on people

```
Oct 2026       Eskom chair Mteto Nyati's term ends. He was the source of the
               inflation-linked tariff aspiration the retail panel briefly
               used as a zero-real counterfactual. DROPPED 12 Sep 2026 -
               NERSA has approved 8.76% and 8.83% against a 3% inflation
               target, so 5.8 points real is already law for the year after
               next, and no counterfactual should rest on one person's
               stated aim. Recorded here because the assumption existed.
FY 2026/27     Eskom Group CFO Calib Cassim retires after 24 years. The
               allowed-revenue decomposition this panel is built on comes
               from his finance function.
```

## Waiting on someone else, nothing to do until it lands

```
Jan 2027       The annual data refresh, all in one pass: Koeberg's rolling twelve months, the
               demand ratio against the full 2026 year, the imports factor, and wheeled output.
               Each of these drifted separately during 2026 and each cost a re-measurement.
when published Battery restoration contracts. System restoration is NTCSA's fastest-growing
               ancillary line, R376m in FY2026 to R3,741m by FY2030, and no battery anywhere
               has won a restoration contract yet - NESO has taken them only to feasibility.
               There is no price to model until one is awarded.
when published Iron-air calendar degradation. No fleet data exists. Cycle life cannot bind at
               a third of a cycle a year, so calendar life is the open question.
if needed      EDMSA scenario A. Our 90 Mt against their 124 Mt for 2035 is a real disagreement
               between two models, correctly flagged by validate_external. Reconcile only if
               their scenario is needed for something.
if we publish  A worst-year or shedding-depth cap alongside the average reliability standard.
               Only worth adding if a published claim invites the question "how bad is the
               worst hour?"
```

## Undated but time-sensitive

```
UJ conference  EIUG outreach is gated on this. Mike Teke chairs both Seriti
               Resources and the UJ council - one connection, two routes.
GitHub Pages   retirement DELAYED deliberately. Revisit when the new site ships.
Graspan Solar  75 MW, flagged in supply_area_split_draft pending_next_quarterly.
               Refused on 18 Aug because it was NOT in the in-construction
               decomposition and was therefore already inside the online total.
               Re-check on the NEXT quarterly, not before.
~73 MW BW5     solar still outstanding from the supply-area split coverage.
               Possibly Graspan. Absent from the published location table.
```

## Standing per-session checks

```
every session  Run the full suite BEFORE any change. Report counts.
every session  Confirm profiles.json is at the repo root. Without it the suite
               produces eleven false failures across five harnesses.
every session  Read RULES.md in full. It is short by design.
```
