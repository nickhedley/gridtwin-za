# GridTwin ZA - dated commitments

Things that expire. Checked at the start of every session; anything past its date
either moves to LOG.md as done or gets a new date and a reason.

Last reviewed: 30 Aug 2026.

---

## missed — read this first

```
28 Aug 2026    NERSA Trading Rules v3, written comments. Closed TWO days before this
               Entry WAS written, and this file is why it was missed.
               THE OLD entry WAS WRONG. It read "30 Sep 2026, comment submission,
               Hard deadline". 30 September is the date NERSA expects to finalise the
               rules - a milestone, not a window. The real sequence was: v3 published
               June, comments due 27 July, extended to 28 August. The consultation
               paper states late submissions "will not be considered".
               The error predates the 27 Aug split, so it was wrong for as long as
               this file has existed. A finalisation date misread as an opportunity.
 4 Aug 2026    Wholesale Electricity Pricing Methodology - comments. MISSED.
               Public hearing 19 Aug, also missed. Directly relevant: this is the
               document that defines the wholesale price components GridTwin maps.
 4 Aug 2026    Transitional Generation Pricing and Vesting Contract Framework. MISSED.
```

Still open ON these:
- Public hearings on Trading Rules v3 were "to be announced after the closing date".
  No date found. Check nersa.org.za/notices/public-hearings - oral representations may
  still be possible.
- The rules are not final until 30 September. Material sent to
  `tradingrulesdevelopmentteam@nersa.org.za` marked as late, offered as evidence
  rather than as a formal comment, may still be read. It cannot be worse than silence.
- Version 3 follows v1 and v2, so a further round is plausible. Watch for v4.

## Hard deadlines

```
10 Sep 2026    NERSA public hearing on seriti green energy's trading licence
               application. Different matter, same regulator, and Seriti is already
               an outreach target. Registration to make oral representations closed
               28 Aug; attendance may still be possible. Livestreamed.
30 Sep 2026    NERSA expects to finalise the Trading Rules. NOT a comment deadline -
               see above. The date to watch for the final text, not to submit against.
Q4 2026        SAWEM trading expected to commence. The Market Code (NTCSA) completed
               written comment in June with a hearing on 1 July.
```

## Done, kept for the audit trail

```
27 Sep 2026    Revised Electricity Pricing Policy, Government Notice 7852, Gazette
               55257. SUBMITTED. Four comments: Policy Position 20 (locational
               transmission cost, with the measured shadow prices), section 5.3(a)
               (harmonising load and generator zones), Policy Position 9 (ancillary
               services, with the storage-competition finding), section 4 (published
               disaggregation of the price components).
               Watch FOR: the Department's summary of comments, and any sign that
               Policy Position 20 work has begun - that is when GridTwin's locational
               results become directly useful to them, and the submission offered to
               run scenarios.
```

## Expected publications - watch for these

```
~Nov 2026      IPP Office Q1 2026/27 quarterly (as at 30 Jun 2026).
               Will contain Mulilo Total Hydra if COD was H1; if COD is 2026-07 it
               lands in Q2 instead. Either WAY the double-count guard fires and the
               named entry must be REMOVED. See RULES.md rule 5.
               Also gated on this: the Graspan re-check, and possibly the ~73 MW of
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
               Building Africa is queued behind it deliberately: arriving with a
               developer already engaged beats arriving as a critique of someone's
               coverage.
GitHub Pages   retirement delayed deliberately. Revisit when the new site ships.
Graspan Solar  75 MW, flagged in supply_area_split_draft pending_next_quarterly.
               Refused on 18 Aug because it was NOT in the in-construction
               decomposition and was therefore already inside the online total.
               Re-check on the next quarterly, not before.
~73 MW BW5     solar still outstanding from the supply-area split coverage. Possibly
               Graspan. Absent from the published location table.
Carbon tax     A suspension was under Cabinet consideration in Feb 2026, and NERSA has
               disallowed Eskom recovering carbon tax through tariffs to end-2030. If
               either holds, the compliance price for generation is arguably zero
               rather than R46/t. Recheck before quoting carbon costs externally.
Basemaps       CARTO withdrew keyless access. The 2D map moved to Esri on 30 Aug 2026
               but HAS NOT been verified IN A BROWSER. The 3D page still uses CARTO's
               vector GL style, also unverified. Both need a human to look at them.
Mulilo COD     Recorded as 2026-07 pending the PFL IPP Knowledge Hub COD table.
               Expected to be H1: inauguration normally follows commercial operation.
```

## Standing per-session checks

```
every session  Run the full suite before any change. Report counts.
every session  Confirm profiles.json is at the repo root. Without it the suite
               produces eleven false failures across five harnesses.
every session  Read RULES.md in full. It is short by design.
every session  Check this file. Anything past its date moves or gets a new one.
```
