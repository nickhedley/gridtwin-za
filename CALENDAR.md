# GridTwin ZA - dated commitments

Things that expire. Checked at the start of every session; anything past its date
either moves to LOG.md as done or gets a new date and a reason.

Last reviewed: 12 Sep 2026.

---

## Hard deadlines

```
28 Sep 2026    DRAFT ELECTRICITY PRICING POLICY - comment closes. Gazetted
               28 Aug 2026, replaces the 2008 policy. NEAREST BINDING DATE,
               and more directly in scope than the Trading Rules two days
               later.
               It covers, item for item, what the retail panel already
               models: unbundled charges across generation, transmission,
               distribution and retail; cost-reflective tariffs; EXPLICIT
               cross-subsidies; protection for vulnerable households; and
               whether solar-equipped customers using the grid for backup
               make a fair contribution to network costs.
               We hold numbers on the last two that are not published
               anywhere else - the fixed-charge share at 200 kWh, the 62x
               spread in fixed charges across distributors, and the finding
               that today's cheapest hours are the dirtiest.
30 Sep 2026    NERSA Trading Rules - comment submission. HARD DEADLINE, no
               extension assumed.
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

## Expected publications - watch for these

```
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
