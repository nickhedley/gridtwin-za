# HANDOVER.md — superseded

This file was a single 3,622-line document holding everything: rules, current state,
file layout, findings, sources and dated commitments. It was split on 27 August 2026
because a document that long stops being read, and a document that stops being read
starts being wrong.

It is kept as a stub rather than deleted so that anyone holding an old copy, or an old
link, lands here rather than on a 404 or on stale content.

## Where everything went

```
RULES.md       The eight durable rules. Short by design. READ THIS FIRST, in full,
               at the start of every session. Everything in it was learned by
               getting it wrong at least once.
STATE.md       What is true right now. Rewritten in place, never appended to. Opens
               with a fitness-for-purpose section: what the model can carry, what it
               cannot, and which published results depend on which assumptions.
               If this disagrees with LOG.md, this file wins.
MANIFEST.md    What lives where — repo root versus nodal/ — and how to run the suite.
               There is no single working directory that runs every harness.
RESULTS.md     Findings fit to quote externally, each with the scenario that produced
               it. A number without its scenario is not a result.
SOURCES.md     Every external source: cadence, edition loaded, what it feeds. Also
               the constants that rest on a source but populate no file, and the
               sources consulted and REJECTED, so that work is not repeated.
CALENDAR.md    Dated commitments. Checked at the start of every session. Every entry
               names its source and says what KIND of date it is — a comment window
               was missed in August because one entry did neither.
LOG.md         Session archaeology. Gitignored. NEVER authoritative.
```

## If you read only one thing

`RULES.md`, then the fitness-for-purpose section at the top of `STATE.md`. Between them
they cover how to work on this safely and what it can honestly be used for.

---

*GridTwin ZA. Code and documentation © 2026 Nick Hedley, released under CC BY-NC-ND 4.0.
Data files carry their own terms — see SOURCES.md. Model outputs are reproducible from
the scenarios stated; nothing here is a tariff, a forecast, or investment advice.*
