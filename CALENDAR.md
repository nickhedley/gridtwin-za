# GridTwin ZA - dated commitments

Things that expire. Checked at the start of every session; anything past its date
either moves to LOG.md as done or gets a new date and a reason.

Last reviewed: 30 Aug 2026.

---

## Hard deadlines

```
30 Sep 2026    NERSA Trading Rules - comment submission. HARD DEADLINE, no extension
               assumed. NOW THE NEAREST BINDING DATE. Nothing drafted for it yet.
               The locational and congestion work done for the EPP submission is
               directly reusable: Trading Rules govern how wheeling and trading
               actually clear, so the headroom and congestion findings apply.
```

## Done, kept for the audit trail

```
27 Sep 2026    Revised Electricity Pricing Policy, Government Notice 7852, Gazette
               55257. SUBMITTED. Four comments: Policy Position 20 (locational
               transmission cost, with the measured shadow prices), section 5.3(a)
               (harmonising load and generator zones), Policy Position 9 (ancillary
               services, with the storage-competition finding), section 4 (published
               disaggregation of the price components).
               WATCH FOR: the Department's summary of comments, and any sign that
               Policy Position 20 work has begun - that is when GridTwin's locational
               results become directly useful to them, and the submission offered to
               run scenarios.
```

## Expected publications - watch for these

```
~Nov 2026      IPP Office Q1 2026/27 quarterly (as at 30 Jun 2026).
               Will contain Mulilo Total Hydra if COD was H1; if COD is 2026-07 it
               lands in Q2 instead. EITHER WAY the double-count guard fires and the
               named entry must be REMOVED. See RULES.md rule 5.
               ALSO gated on this: the Graspan re-check, and possibly the ~73 MW of
               BW5 solar.
~Feb 2027      PFL IPP monitor, H2 2026 update. Replaces by_source.private wholesale.
               Same removal discipline. Will settle Mulilo's COD if the Knowledge Hub
               has not already.
annual         IPP Office "An Overview of the IPPPP" - the named-project layer. The
               only published route to a fuller Hydra Central split.
monthly        Seriti Green grid simulation. Published since Jan 2026; the August
               edition covered July and is reproduced in RESULTS.md. Each new edition
               is a free differential test - and now a warm contact rather than a cold
               one, once the outreach email goes.
rolling        Eskom Transmission Development Plan. The 2025-2034 edition (14,500 km,
               210 transformers, 56 GW, >R390bn) underpins acapVrfb / acapIronAir /
               acapPs and the R600/kW-yr transmission adder. A new edition moves all
               of them.
```

## Undated but time-sensitive

```
UJ conference  EIUG outreach is gated on this. Mike Teke chairs both Seriti Resources
               and the UJ council - one connection, two routes.
Seriti reply   The outreach email is drafted and ready to send to Peter Venn. Green
               Building Africa is queued BEHIND it deliberately: arriving with a
               developer already engaged beats arriving as a critique of someone's
               coverage.
GitHub Pages   retirement DELAYED deliberately. Revisit when the new site ships.
Graspan Solar  75 MW, flagged in supply_area_split_draft pending_next_quarterly.
               Refused on 18 Aug because it was NOT in the in-construction
               decomposition and was therefore already inside the online total.
               Re-check on the NEXT quarterly, not before.
~73 MW BW5     solar still outstanding from the supply-area split coverage. Possibly
               Graspan. Absent from the published location table.
Carbon tax     A suspension was under Cabinet consideration in Feb 2026, and NERSA has
               disallowed Eskom recovering carbon tax through tariffs to end-2030. If
               either holds, the COMPLIANCE price for generation is arguably ZERO
               rather than R46/t. Recheck before quoting carbon costs externally.
Basemaps       CARTO withdrew keyless access. The 2D map moved to Esri on 30 Aug 2026
               but HAS NOT BEEN VERIFIED IN A BROWSER. The 3D page still uses CARTO's
               vector GL style, also unverified. Both need a human to look at them.
Mulilo COD     Recorded as 2026-07 pending the PFL IPP Knowledge Hub COD table.
               Expected to be H1: inauguration normally FOLLOWS commercial operation.
```

## Standing per-session checks

```
every session  Run the full suite BEFORE any change. Report counts.
every session  Confirm profiles.json is at the repo root. Without it the suite
               produces eleven false failures across five harnesses.
every session  Read RULES.md in full. It is short by design.
every session  Check this file. Anything past its date moves or gets a new one.
```
