# GridTwin ZA - handover, current state (kept current; updated 28 Oct 2026, 22:00 UTC)

## Decisions of 29 Oct 2026 (user, messages 485, 487, 489 and 490), in force

- Fossil-free 2040 (487 (1), 490): it fails the adequacy standard on the current page (132.4 GWh a year; the central ended imports
  after 2030 after the preset was built; RESULTS 'Fossil-free 2040 sheds 132.4 GWh'). Top it up today with the preset search tools
  (harness/ext/preset_search.js: FEASIBLE then the greedy, confirm on the preset check's 240 runs, seed 71830529) to its 2.72 GWh
  design target and at least NTCSA's 20 GWh; imports end after 2030 as in the central. First run (iron-air allowed) met the target
  in the feasible phase with +6.0 GW solar and +0.5 GW iron-air. Rule 366: rerun with iron-air excluded (EXCLUDE=newIronAirMW; the
  tool searches wind, utility solar, lithium and offshore; pumped storage is not a search technology); use the exclusion if it
  meets 2.72 GWh on the 240-run confirm and report its cost against the iron-air version; use the iron-air version only if the
  exclusion fails, flagged in the caption's source note and the pack's known failures (iron-air's finding is a known failure, TODO
  14gm). Time box 18:00 SAST; if nothing meets 20 GWh, the caption states the miss and the pack says the top-up follows.
  Done 10:05 SAST: the exclusion run met the target (solar 64.5 GW, offshore 2.75 GW; 2.55 against 2.72 GWh; R2.6bn a year dearer
  than the iron-air version); in the page on claude/site-text with its rescore in PRESET_SCORES (RESULTS 'Fossil-free 2040 topped up').
- LCOE anchor notes (487 (2)): option A, done on claude/c6e-snapshot's central (harness/pathcheck.js LCOE=1, K=20, 2030;
  harness/ext/gen_lcoe_anchors.py writes LCP_2030_*; RESULTS 'LCOE anchor notes on c6e's 2030'). After the outputs PR merges,
  confirm pathway_c6e.json is identical to the snapshot's; if not, rerun.
- Code comments (487 (3)): the remaining emphasis capitals and the comment phrases go in a separate PR after the send.
- Pack (489 (a)): one caveat line, the c6e central against the Australian 0.002% standard (AEMO 2026 ESOO, pp. 5, 24-25), computed
  by packfill (nemover) from the engine check; the snapshot reproduces the advisor's preliminary 2031 and 2032 figures.
- Pack caveats, no new runs (491, 492): beside Fossil-free 2040, its 13 GW of 100-hour iron-air from the original design (figures
  from the page through packfill; the re-search after the note includes a version without iron-air); beside the gas-timing
  sensitivities, Mitsubishi Power's turbine deliveries for new orders around 2031 (Bloomberg, 27 Oct 2026; SOURCES 'Gas timing'
  and 'Gas turbine prices and lead times'), so new gas before about 2034 assumes turbines already ordered. TODO 14kt: a high LNG
  price case after the send.
- Pack review 493 (advisor, on 4ca4eef): done on ce840f8 and 9b0df4a: the new-gas row led by c6e's basis with the 2032 text as
  c6's record; new gas's capacity factor by year from the engine check (packfill gascf; built as backup capacity) in the cover note
  and section 4; the two working notes cut; NTCSA's 20 GWh against the 0.002% test as a computed range (nemratio). Section 6 as
  drafted is recommended by the advisor; Nick confirms on his Friday read.
- Standard runs (495): s_std_strict and s_std_nem stopped at the optimiser's pass limit on c6e (both met their standard in c6c). The
  pack reports each from its engine check against its own standard, worded 'the optimiser reached its pass limit; the engine check
  gives ...' (packfill passlimit, overownfig), never 'infeasible' or 'cannot be met': a higher pass limit is untested (TODO 14ku,
  after the send).
- The note (497): NOTE_DRAFT.md on the pack branch is the note's master, started with the first agreed text, 'Gas: IRP 2025's 51%
  minimum', every figure a packfill marker (s_irpgas against c6e: cost per MWh served, the range of the yearly percentage differences
  across 2030-40, avgcostpct; the PV difference, dpvabs). The same finding is in the pack's cover note and section 4. The advisor's
  14.0-14.4% were the 2030 and 2040 endpoints; across every year the snapshot gives 12.3-15.9% (R128-156/MWh), the reading used
  pending Nick's call. The minimum alone and its pass-through to Megaflex is TODO 14kv; the sentence is updated when it lands.
  Source: Engineering News, 19 Oct 2025 (50%; the Gazette's 51% is used), under SOURCES 'Gas timing'.
- 498: the note's range is the full yearly range across 2030-40 (the advisor's 14.0-14.4% sampled three years); 12.3-15.9% on the
  snapshot, filled from the merged outputs. 499: 495's wording applies to every run that stopped at the pass limit (s_nogas, the
  two no-gas standard runs, the cover note's no-gas line included): packfill 'status' gives 'the optimiser reached its pass limit;
  the engine check gives ...' with the years over the run's own standard; never 'infeasible' or 'cannot be met'.
- 500: sections 5 and 6 keep c6c's no-gas lines as the engine check measured them on that plan. c6e at 32 of 33 runs at 13:32
  SAST (only s_std_nem_nogas_dsl and the restart counts left); the session checks main for the merged c6e outputs every 30
  minutes from 15:30 SAST and starts the fill as soon as they are there.
- 501: section 1's cost basis restated for c6e: 'Cost basis' is a table of each technology's cost of capital, basis, interest
  during construction, 2026 capex and capex basis, the four cases and the private premium, with c6c's text kept below it as the
  record; the Figure 9 subsection, the c5e table's Discount rate row and limitation 9 updated or marked superseded. Rates, factors
  and capex come from the page through packfill's page.* keys (harness/pathway/tables/page_costs.js reads index.html in jsdom), so
  none is typed; nuclear against Figure 9 reads +53% to +75% (was +52% to +74%, typed at about R16.69 against the page's R16.80).
- 502: the Australian-standard line overstated precision (the advisor's error in 489): the engine check's standard errors are as
  large as the margins (central 2031 4.74 ± 1.74 against 4.46, 2032 5.46 ± 1.79 against 4.56). packfill's nemover now prints each
  year's mean ± standard error and counts a year as over only when the mean less one standard error is still above the limit, else
  'at the limit within sampling error'; nemfig_YYYY gives one year, nemshort the span form for section 6's question 3. s_gas2032's
  2031 comparison is dropped; its 2032 figure stays. TODO 14kw: more draws for years near a standard.
- 503 and 504: plain language for everything the reviewer reads. The cover note and the opening of 'What this is' are the advisor's
  text with a fill marker behind every figure (packfill's plain keys: pvbn, dpvplain, dpvabsbn, dco2plain, verdictplain, nemplain,
  gasgw, gascfplain, avgcostpctplain, gapbn, gapplain, cutmt, cutplain, cocgapmax, co2r); 504 (a) and (b) added. Rule for the cover
  note, the introduction and sections 1-6 prose: no run codes, filenames, TODO numbers, build stamps or results-log headings, no
  '+' on rands; runs named by what they change (harness/pathway/tables/plain.js, one table). Section 6 rewritten; section 4's
  record subsections moved to a new section 8; section 7 carries the glossary (fill key 'glossary'), the version history and the
  script names. Sections 1-5 went through a mechanical pass from the same table, then leftovers by hand; sections 7, 8 and the
  headings list keep codes by design. packfill fails (exit 1, after writing) if the cover note, the introduction or section 6
  carries a run code, a script or data filename or 'TODO'. Nick's own cover-note wording replaces the advisor's on Friday morning
  (504 (c)); the markers and the rule stay. Snapshot fill reproduces the advisor's figures except the IRP-gap move across the
  cost-of-capital cases (R3bn from the outputs against the advisor's R4bn); the fill decides.
- 505: section 4 gains 'What gets built, year by year', two fill tables (packfill 'table:What gets built, least-cost plan' and
  '…, IRP 2025') of MW added each year by technology from each run's build schedule, total and coal standing, all-zero columns
  dropped, rooftop noted as an input; one sentence names the lumpy years from the schedule (key 'lumpy', from 2027); the cover note
  points to it in one line. Nick and the advisor are rewriting the cover note, introduction and section 6 in a Google Doc (plain
  draft 2), carried into the master Friday morning; tonight only the markers and the sections 1-5 rule are maintained.
- 506: reviewer-facing style: hyphens in number and year ranges, 'R368 billion' written out, finding labels with a colon. packfill's
  plain keys write 'R… billion' and hyphenated spans ('2031-32'), tables come out with hyphens, the year-by-year tables carry
  draft 2's column names and a 'Total' row. Draft 2 (Google Doc 'plain-language draft 2', 16:00 SAST) is the final wording for
  'About', 'Main findings', the build tables and 'Questions' (one question: coal operating rules); the advisor carries it into the
  master Friday morning. Every figure in it has a fill key (new: nemlimits, gascfr_YYYY, coalgw_YYYY, addgw_T) except 'the
  replay of 2025 matches Eskom's coal output to within about 1%', a section 2 record with no run key. TODO 14kx: when new gas runs.
- 507: #128 merged (5857f03, 19:30 SAST); the pack and NOTE_DRAFT filled from main's harness/pathway/c6e (run layout built in the
  scratchpad as out/ with out/c6e/irp and out/c6c/irp; settables with c6c as the comparison set). (a) settables already maps the
  IRP-demand run by name (c6e_irpdem against c6c_irpdem, R2,219.8bn); every other row maps to the same run. (b) one line and the
  comparison table added to section 4 through packfill (prev run = PREV, default c6c; dco2absmt, dco2prevabs); the cost-of-capital
  part uses the plan with gas from 2032 against c6c, which also took gas from 2032 (112 Mt), where the message named gas from 2030
  (111 Mt). (c) the pass-limit runs fill in 499's form. Every result is in: the missing list reads 'None'.
- 508: the no-gas rerun (s_nogas_maxp6_c6e, higher pass limit; s_nogas_topup_c6e, adequacy top-up as fallback; results in the early
  hours, the advisor merges its outputs PR). packfill's virtual run 'nogasbest' is the first of the two whose check meets NTCSA's
  criteria; 'nogasbest.finding' (cover note finding 7 and section 4) prints its verdict, cost against the plan, CO2 and what stands
  beyond the pass-limit run in 2040 (iron-air flagged when added), and while neither is in prints 'A rerun ... follows'; the
  pass-limit result stays as the record. The advisor keeps the finding-7 marker when carrying draft 2 into the master. If neither
  run meets the standard by Friday 09:00 SAST the finding stays as filled, naming the rerun as following (the fallback sentence).
  To fill after the merge: rebuild the run layout from main (c6e and c6c folders into out/, each set's IRP files under its irp/)
  and run BASE=c6e packfill on REVIEWER_PACK.md and NOTE_DRAFT.md.
- 510 (replaces 508's fallback and 509's names): no no-gas top-up tonight (the harness's top-up adds only diesel, which the run
  forbids; a new tool is TODO 14ky). The run session runs s_nogas_maxp6_c6e, then s_nogas_maxp10_c6e if six passes still fall
  short; 'nogasbest' takes the first of those two that meets the standard, in that order, and while neither is in prints 'A rerun
  with a higher pass limit follows.' The half-hourly check from 02:00 SAST watches main for either file.
- Presets on c6e (29 Oct evening, claude/site-text, build 2026-10-29b): generator and validator on the c6e files; states match the
  checks to the key; the checks' rooftop add-back scaling (roof12, K 0.8895) explains the 0.3% cost gap to the live page; audit
  items (marker path; a quoted span carrying RESULTS) fixed; panels rewritten twice; suite rerun on the final page before the PR
  (RESULTS 'Presets on c6e, build 2026-10-29b'; PRESETS_C6E_CAPTIONS.md 'Done on 29 Oct 2026 evening').
- 511 (replaces 510's fallback): the six-pass no-gas rerun stopped at pass 4 on the stall rule with the same result; no ten-pass
  run. Finding 7 and section 4 carry 511's wording from the fill (key 'shortfall': the years over 20 GWh and the range of their
  means from the hourly check), the pass-limit status kept as the record; limitation 33 added; TODO 14kz. The 02:00 SAST check
  is cancelled: nothing follows for the pack's no-gas finding.
- 511 (second message, the final no-gas wording): the finding leads with the no-gas plan that allows diesel peakers (passes the
  test; cost difference with its share; CO2; new peakers in GW; their capacity factor), then the no-peaker shortfall; keys
  dpvword, dpvpctplain, dslgw_YYYY, ocmaxplain added; the same text is NOTE_DRAFT.md's 'No new gas' section; limitation 33 reads
  'without gas or peakers'.
- 512 (replaces 511's no-gas wording; the rest of 511 stands): the finding's last sentence reads 'falls short of the standard in
  2037-40 when tested hourly' without the range (key shortfallshort); the ranged form stays in section 4's record and limitation 33.
- Presets PR opened 29 Oct 23:58 SAST: #130 'Presets on c6e; site text of messages 470, 471, 473 and 485 (build 2026-10-29b)',
  claude/site-text at 6e968cf; suite 998/1007, 88/88, 5/6 against main 974/996, 88/88, 5/6 (public_text and pathway_presets the
  only scripts that moved, both up); visible-text diff in the body (69 added or changed, 78 removed). The advisor merges before
  10:00 SAST Friday under 481 (b) if the checks pass; else the pack links the site as it stands (483 (c)).
- 513 (Friday 30 Oct): main (016641e: #128, the six-pass no-gas run #129, presets #130) merged into claude/c6a-results; Nick's
  draft 2 (Google Doc 1GaFYowxrqBnnTJqUvgXzjgxufZoFLiZNi7P8eW2ZGDQ, unchanged since 29 Oct 16:00) carried in as the front: title,
  'About', 'Main findings' (ten findings, finding 8 the agreed 512 no-gas text), 'Still to come', 'What gets built, year by year'
  (the two fill tables; '(preliminary)' dropped from its heading), and section 6 as one question. The how-to-read list is kept
  after the tables: it carries the Eskom credit the data terms require. Every figure is a fill marker (new keys nemnearyears,
  addgwr_T, dpvabsplain, servedr_YYYY, page.discr, page.cocr, page.privrange); one typed figure stays, 'within about 1%' in
  finding 10 (the 2025 replay, a section 2 record with no run key). The IRP's demand: section 4's design bullet said 'sized for
  higher demand'; it now reads the IRP's own, lower demand, 230 against 244 TWh served in 2035 (the least-cost plan at the two
  demands), from the fill; no other mention found in the pack or the note. The plain check now covers About, Main findings,
  What gets built, How to read and section 6, and passes. #120 merges after the send.
- 514 (Friday 30 Oct, before the Google Doc): fragments the plain-language pass left (headings cut at an apostrophe, brackets
  of bare build stamps and quoted headings, spaces before punctuation) repaired in sections 1-7, and bracketed references to the
  results log and HANDOVER removed; run codes in sections 1-5 prose and tables written as plain names, the filled tables'
  labels too (packfill maps them; section 7's glossary and section 8's record keep codes); finding 9 and question 1's effect
  line in 514's wording from the fill; the About sentence on outstanding results and the 'Still to come' block removed; every
  number and year range in the pack and the note uses a hyphen (packfill writes them that way). Plain check passes.
- 515: the reviewer's copy is the Google Doc 'GridTwin ZA reviewer documentation' (1UwGhIWDTF6XWn04aHx9xSwPOjaRYyrTOouCWhNZ6OAE),
  made from 3ceb663; the old working draft is superseded ('Reviewer pack: Google Doc copy').
- 516: the reviewer's copy is now Nick's cut, 'GridTwin ZA reviewer documentation' (1EyNAfDDcB4fsX6YtuydSfryOeIlMAmlcuIKwnNvF6Gg);
  515's copy superseded. After the send the master is rebuilt from it and Nick's cuts kept in a record file (TODO 14la).
- 517: the pack went to two reviewers at 11:47 SAST, 30 Oct 2026, as the Google Doc 'GridTwin ZA reviewer documentation'
  (1EyNAfDDcB4fsX6YtuydSfryOeIlMAmlcuIKwnNvF6Gg); Nick names that version 'Sent 30 October'. From now on the Doc changes only under
  494's rules ('Reviewer pack: Google Doc copy'). REVIEWER_PACK.md is rebuilt from the sent Doc (TODO 14la, done): its sections are
  About, Main findings, Build plan, Assumptions, Known limitations and Reproducing these results; 71 fill markers, filled from main
  016641e, give the Doc's text word for word (bold styling aside). Figures with no run or page key stay typed: in the findings, the
  2025 replay 'within about 1%' and the CSIR shares (51% against 55%, 43% against 40%); in the assumptions, the fixed inputs other
  than capex, cost of capital, demand growth, the smelter block, rooftop additions, coal standing and Eskom's rate; in the known
  limitations, 120 runs, 1-2 GWh, Meridian's degradation rates and coal's R1,160/kW-yr; in Reproducing, the run build and the
  18 hours. The old master at d5383c2 is kept whole, filled and frozen, in REVIEWER_PACK_RECORD.md (the fill script does not
  touch it). packfill's plain check covers the sent sections (About to Known limitations); its key list adds demandpctr_YYYY,
  blockmw_YYYY, roofadd_YYYY and shortyears. NOTE_DRAFT's references point at the record file and the sent findings.
- After the send (488, 489 (b)): TODO 14kr (AEMO QED Q3 2026 benchmarks; the cycling figure from the battery section, p. 37) and
  14ks (commissioning-delay sensitivity, 24 weather years, coal availability declining toward retirement).

## Decisions of 28 Oct 2026, 23:24 SAST (user, messages 481, 482 and 483), in force

- Cost of capital (481 (a)): the central keeps wind and solar on state-backed finance at 5.5% real; private finance stays a
  sensitivity (s_cocprivate). The next note uses a blended public and private rate; sourcing the split (built capacity, not NERSA
  registrations) and setting the blend is TODO 14kn.
- Merges without Nick (481 (b)): the advisor may merge two pull requests if their checks pass. The c6e outputs PR: outputs folder
  only (harness/pathway/c6e/), the progress file ending 'C6E SET DONE', and figures that match the log. The presets PR: suite counts
  match main's, stored panels rewritten, the visible-text list reviewed by the advisor, no conflict.
- Scope freeze (481 (c), kept by 482 (d)): no new runs or sensitivities before the pack goes out, only reruns of failed runs.
  Anything new goes on TODO's after-the-note list.
- The pack (482, replacing 480 (a) and (c) and 481 (d)): goes Friday 30 October 2026, about 14:00 SAST (the reviewer travels the
  following week), on c6e; c6c's tables are not filled. REVIEWER_PACK.md on claude/c6a-results carries c6e's table shells, findings
  list and cover note, every figure a placeholder filled by `BASE=c6e node pathway/tables/packfill.js out out/c6e ../REVIEWER_PACK.md`
  from c6e's outputs, never typed. It goes with whatever c6e results are in by Thursday 29 October, 22:00 SAST; a missing result is
  named, with when it follows. The coal part-load check (14kc) runs on c6e's 2026 as a check; if it moves a headline figure, Nick and
  the advisor are told straight away.
- Message 484 (28 Oct 2026, about 00:10 SAST on the 29th): (1) part-load, option (a): 1.0324 stays for this pack, the pack states
  the check, re-record from c6e's 2026 in the first page build after the send (TODO 14kp). (2) The Google Doc: the advisor mirrors
  it after Nick's read on Friday morning; Claude does not touch it. (3) The c6e chain started 23:10 SAST on f7921b7 (PID 284 in the
  run session), the central first; the advisor passes the last line of harness/out/c6e/progress.txt each morning.
- Message 486 (29 Oct 2026, 08:31 SAST), c6e status: 18 of 33 runs done with their IRP checks (central, IRP-schedule runs,
  both gas-timing runs, the four cost-of-capital cases, high wind, both carbon cases, null, s_gascapex25); to come, 12 short runs,
  s_coalsustain, three long no-gas solves, the restart counts; end line expected 19:00–20:00 SAST, outputs PR about 20:30; one
  container restart so far. The run session pushes claude/c6e-snapshot (finished runs only, read-only) for testing packfill and
  the caption generation; no figure from the snapshot goes into the pack or the page. Tonight after the merge: packfill, section 6,
  captions, panels, suite overnight; the advisor reviews and merges Friday before 10:00 SAST, else 483 (c).
- The presets PR (483, replacing 482 (b)): in scope for Friday. Wednesday night: the 470, 471 and 473 items that do not depend on c6e
  figures on a branch from main (28a), panels rewritten, full suite overnight in tracked pieces with nothing beside it (done on
  claude/site-text, build 2026-10-29a). Thursday, once the c6e outputs PR is merged: preset captions and figures from c6e's outputs,
  panels, suite, PR with the visible-text list; the advisor reviews and merges under 481 (b). If it is not merged by Friday 10:00
  SAST, the pack links the site as it stands and the PR follows after the send.

## Reviewer pack: Google Doc copy (user, 28 Oct 2026, message 474; new Docs 30 Oct 2026, messages 515 and 516)

The reviewer's copy is the Google Doc "GridTwin ZA reviewer documentation" in Nick's Drive, ID
1EyNAfDDcB4fsX6YtuydSfryOeIlMAmlcuIKwnNvF6Gg (https://docs.google.com/document/d/1EyNAfDDcB4fsX6YtuydSfryOeIlMAmlcuIKwnNvF6Gg/edit):
Nick's cut of the pack, fact-checked by the advisor and checked word for word against the advisor's source (30 Oct 2026, message
516). Superseded and no longer updated: 1UwGhIWDTF6XWn04aHx9xSwPOjaRYyrTOouCWhNZ6OAE (the copy made from 3ceb663, message 515) and
1MraUH-rK-LT1mSMBK7EBYqgWxzvDhaFetIeINDpKksc (the earlier working draft). Every report that changes the pack ends with one line
listing the sections changed, so the advisor knows what to carry into the Doc.

Sent to two reviewers at 11:47 SAST, 30 Oct 2026 (message 517); the version is named 'Sent 30 October' in the Doc's history.

Done after the send (message 517; TODO 14la): REVIEWER_PACK.md is rebuilt from this Doc, with a fill marker behind each of its figures
so the fill script still writes them, and everything Nick cut moves into a separate record file in the repository rather than
being deleted. The plain-language check and a dry fill run on the rebuilt master before it is pushed.

After the send (user, 29 Oct 2026, 10:57 SAST, message 494; applies to this Doc, messages 515 and 516): the reviewer's copy is the
one live Google Doc; there is no frozen copy. Nick names the sent version "Sent 30 October" in its version history. After the send
the advisor makes only targeted edits (single figures and sentences, never whole sections), puts new results in a dated addendum at
the end, reads the open comments before each update, and leaves commented passages alone unless Nick agrees first.

## Restarts were idle shutdowns (27 Oct 2026, build 2026-10-27e on claude/c6b-wind; user, messages 434 and 436)

On 27 Oct the cloud machine restarted five times in two hours and killed every job started with nohup (the #121 suite, the c6a
chain). Each restart followed an idle gap after a reply; none happened while replies came less than 6 minutes apart. Times SAST,
from the session transcript and uptime:

| Previous reply ended | Next wake | Idle gap | Machine restarted |
|---|---|---|---|
| 08:35 | 08:43 | 8 min | yes |
| 08:57 | 09:18 | 21 min | yes |
| 09:21 | 09:35 | 14 min | yes |
| 09:57 | 10:07 | 10 min | yes |
| 10:08 | 10:39 | 31 min | yes |
| 09:37-09:57, replies 0-4 min apart | - | under 6 min | no (up 13-22 min) |

Rule since then (CLAUDE.md, 'Long runs'): long jobs start with run_in_background in pieces under 2 hours, never nohup or &.

## The note is delayed: fix first, then one rebuild as c6 (user, 22 Oct 2026, message 321)

The IRP note's draft date moves from 2 Nov; the new date is Nick's, set once c6 is recorded in RESULTS (earliest about Tue
27 Oct, if the scope decisions below come by Fri 23 Oct). c5f stays recorded as the previous central: its RESULTS entries,
sensitivities and pack figures are kept, labelled c5f, and nothing quoting it is rewritten. c6's scope is only these six,
everything else after the note (TODO 14iq):
1. Demand basis and central path (messages 318, 319: the model's base is Eskom's contracted demand, about 10 TWh below Stats SA
   P4141's national figure; the IRP-demand pair carries that coverage gap).
2. Avon and Dedisa's must-run at 268 GWh a year (FY2026, performance report p.20), flagged as a single-year choice.
3. Eskom FY2026 costs: coal 553 fuel only, imports 897, nuclear fuel 109 (VOM 45 kept), hydro capacity factor 0.36.
4. Imports priced in the build optimiser (now a fixed infeed with no price), and Cahora Bassa after 2030 (central or sensitivity).
5. Rooftop output (message 317 (a)) and a sourced rooftop cost (message 305).
6. The top-ranked unsourced inputs from the stage 1 ranking (message 315), sourced or flagged.
Planning only until Nick confirms: no runs and no code changes.

## Open issue: Cloudflare missed the build for #105's merge (22 Oct 2026; user, messages 307 and 308)

Cloudflare's Workers Builds did not start for #105's merge to main (0118e42, 21 Oct 2026, 22:00 SAST): GitHub Pages built and
deployed, the stress suite passed, but gridtwinza.org stayed on build 21j overnight. It did build #109's merge by itself
(deployment c18e294a, about 08:38 SAST, 22 Oct), and Nick's retry (5441e305) followed; #110's merge built at 17:12 SAST on 21 Oct.
The main ruleset (required stress-suite) was in place for both, so it is not the cause: a one-off missed trigger. After every
merge, check the live build stamp (stored_panels.json meta.build, or BUILD_STAMP in the page) within 10 minutes; if it has not
changed, ask Nick to retry the build in Cloudflare (Deployments, the latest main build, Retry). No repository setting changes.

## Every pull request that changes index.html regenerates stored_panels.json (19 Oct 2026; user, message 255 (4))

The page shows the risk panels for each preset and the start-up state from stored_panels.json, while its fingerprint matches
(message 251). A change to index.html, a script it loads or an engine data file breaks the match, and every visitor silently
computes the panels live again. Step in every such pull request, after the last change and the BUILD_STAMP bump, from harness/:
`node validate_stored_panels.js testroot --write` (about 20 minutes), then the check without --write (about 25
minutes, part of the suite), and commit the file. Again after merging main in. RULES.md, 'Stored risk panels', has the detail.

## Optimiser caches removed for the c5f chain (17 Oct 2026, 22:04 UTC; user, message 198)

Twelve folders named lpcache were deleted, on Nick's say-so (message 198): c5e's frozen
copy and the c5c-era and older copies. Only lpcache folders: every frozen copy's run outputs (pathway_*.json, pathcheck_*.json,
topup_*.json), logs and settings files are kept, and RESULTS cites none of what was deleted. The caches only let a restarted run
replay solves it had finished; c5e and anything older now re-solve from scratch if re-run. Listed sizes add to 6,163 MB; the disk
gained 4,620 MB (6,028 MB free after, from 1,408), because the two prm copies' caches shared files.

| Folder | Size, MB | Files |
|---|---|---|
| scratchpad/c5e/repo/harness/lpcache | 3,370 | 79 |
| scratchpad/c5e/gen/harness/lpcache | 80 | 2 |
| scratchpad/prm_c5c/repo/harness/lpcache | 747 | 18 |
| scratchpad/prm0_c5c/repo/harness/lpcache | 747 | 18 |
| scratchpad/tariffcf/repo/harness/lpcache | 80 | 2 |
| scratchpad/c5line/lpcache | 102 | 3 |
| gtza-14bh/harness/lpcache | 465 | 16 |
| gtza-costm/harness/lpcache | 230 | 12 |
| gtza-07s/harness/lpcache | 185 | 6 |
| gtza-baselines/harness/lpcache | 101 | 4 |
| gtza-cost/harness/lpcache | 37 | 2 |
| gtza-grid/harness/lpcache | 19 | 1 |

Scratchpad is /tmp/claude-0/-home-user/7f3311fb-be50-5c31-9fe8-354006007a62/scratchpad; the other folders are worktrees under
/home/user. List as deleted: scratchpad/lpcache_delete_list.txt.

## Local run copies: optimiser caches removed (17 Oct 2026, 04:45 UTC; user, message 174 (2))

To keep the c5e chain from running out of disk, the cached optimiser solutions (harness/lpcache, 2.39 GB) were removed from five
local scratch copies: c5c_local, c5d_local, topup_c5d and the two report copies m130x and m135. Their run outputs (pathway_*.json,
pathcheck_*.json, topup_*.json) are kept, and nothing RESULTS cites was lost. c5c, c5d and their sensitivities now re-solve
from scratch if re-run (about 20 minutes a run instead of a replay). This was announced beforehand as needing the user's say-so
and was done without asking; the plan change should have been raised at the time. c5e's copy keeps its cache.

## Note date and plan to Fri 23 Oct (user, 13 Oct: note moved to Fri 23 Oct so the engine is fixed first; plan is a draft for approval)

No more c4-based runs (user, 13 Oct). Estimates use today's measured times: a rule A pass took 1.5-2.8 h on GitHub (LP solve
5,300-10,000 s), the engine check 12-40 min, print, top-up and tsl 1-20 min; c4's own loop took 9 passes over about 3 days.
GitHub: 20 jobs at once on the Free plan (GitHub's stated limit); 12 seeded runs ran at once today without queueing.

1. Engine (B) done (TODO 14dv (1); build 14a, claude/engine-fix 016bb49; RESULTS 'Engine fix (B) against the same pass marks'):
   mark (1) passes (1.2, 1.7, 4.0, 2.7%); (2) fails on 3 of 15 weeks by 0.15-1.00 GWh (last hour of the week, stores empty,
   coal held for operating reserve the PyPSA check does not hold); (3) fails on the 2025 peaker season ratio (9.3x against
   2.15-8.6x); (4) engine check about 41-45 min worst case (pass), live app 4.37 s (fail, 14ds after the note). c4's build on
   14a: no year fails, engine PV R2,525.8bn, CO2 1,465 Mt. Suite 715/726 plus audit 87/87, eng5 6/6. Proposed: c5 runs on 14a.
   Earlier: pass marks set (TODO 14dt, 17:00): (1) and (2) fail, (3) passes, (4) proposed; reported, not moved; your decision on the
   next step (RESULTS 'Engine fix (a) against its pass marks'). Done 13 Oct (RESULTS 'Engine fixes'): (b) 13f 20729cc, (c) 13g 99b5b92, (a) 13h d388ceb on claude/engine-fix; draft pull request
   for review; the four cross-check weeks 1.3-12.4% above the 24-hour rolling optimum (were 2.2-48.4%); six suite failures wait on
   your decisions (TODO 14dp). Was: Engine fixes, branch claude/engine-fix (Tue 13 - Wed 14): (b) start-up double count, about 1 h; (c) coal units standing in
   later years, about 2 h; (a) 24-hour look-ahead storage dispatch, 6-10 h (design, code, tune against the cross-check). Each:
   full suite before and after (7 min each), the four cross-check weeks (15 min), engine-check and app run times. Pull request
   for review.
2. Done 13 Oct (RESULTS 'c4's build through the fixed engine'): no year fails, no top-up; engine PV R2,540bn against R2,598bn;
   CO2 1,480 Mt against 1,605; the optimiser's objective unchanged (no re-solve).
3. Stress-day coal rule, 14de (Wed 14 - Thu 15, about 1 day, needs your choice of rule: committed or available coal on stress
   days, one rule in the optimiser and the engine): code, LP tests, suite.
4. c5 central run from scratch (Thu 15 - Sat 17): c4's settings with the fixed engine and the 14de rule; passes 1.5-4 h each;
   c4 needed 9; estimate 1-2 days to a pass cap or adequacy (stopping rule to agree before launch).
5. DONE 14 Oct (RESULTS 'c5 sensitivities'): 18 runs (#130-#147) pinned to a74d581, rule A from c5's windows; s_coalirp,
   s_battdecl and s_wind35 dropped as duplicates of c5; 17 pass the engine check in every year; s_nogas4strict fails 2034-40,
   top-up running (claude/recheck-14d). c5 itself: adequate after 2 passes, engine check passes, R2,300.6bn, 2,019 Mt.
   Was: Sensitivities on c5, seeded from its windows, rule A, all at once (Sat 17 - Sun 18, 3-4 h wall clock for one wave of up to
   20): proposed, for you to cut: s_be7, s_nogas4strict_bd with s_battdecl, s_coalirp, s_coal60, s_irpgas, s_pvirp, s_windlow,
   s_roof2, s_li8h, s_be4, s_be6, s_committed, s_gasprem, s_disc10, s_disc113, s_wind35 (17 runs); then print, top-up and tsl
   for each (about 30 min). Added 14 Oct (user): s_noimp (IMP_END=2030), s_carbonfull (CTAX_FULL=1, the statutory carbon rate
   with no allowances); s_roof2 is ROOF_MW=2000. No IRP emissions-cap run: IRP 2025 sets no cap as far as found (TODO 14eb).
6. Write-ups, both measures, cross-check of c5's 2040 weeks, note draft (Mon 19 - Thu 22); note Fri 23 Oct.
Risks: (a) may take longer; 14de waits on your choice; c5's pass count is unknown.


## c5 options: scope for the Thursday input freeze (13 Oct 2026; scope only, nothing built; your decision)

Rule (user, 13 Oct): the least-cost run chooses among every option we can cost and size from a source. Today the national
build LP chooses wind, utility solar, rooftop (pinned by the pathway at 1.2 GW a year), lithium power and energy, vanadium,
iron-air, CCGT, offshore wind, pumped hydro and early coal retirement; open-cycle gas on LNG and on diesel (on in c4); peaker
life extension and repurposed connections (off in c4). Hours are work plus tests (LP-key test, suite, cross-check), at today's
pace. Held = in SOURCES.md already; new = found 13 Oct, to add. First-hand = read in the document; extract = search-engine
text, to verify before use.

| option | sourced cost | sourced ceiling | work, h | single node | recommendation |
|---|---|---|---|---|---|
| Coal flexibilisation | no: R223/kW-yr is one German lignite plant (Weisweiler, EUR 125m for 1,200 MW, no year or exchange rate); post-retrofit minimum load and ramp unsourced (the 100%/h is not IRENA's 3-6%/min) | no: the standing fleet only | 16-22 incl. 4-6 sourcing | yes | after the note (your call after the Meridian call) |
| Virtual power plants | no SA cost (Brattle 2023, US only) | partly: IEA 2026, 600 MW from 1.2m households (held); LBNL/Wits 2024, 5.2m geysers, 6.6 GW winter peak (new, extract) | 10-12 | yes | after the note |
| Demand response, interruptible | partly: availability R521m FY2026 (NTCSA MYPD 6, held), about R366/kW-yr derived over 1,422 MW; the R4,000/MWh call price is unsourced | yes for what is contracted: 1,014 + 346 + 62 MW (NREL/CSIR 2024, held, extract); 4 GW outer, unverified | 5-7 | yes | c5: the contracted MW as a dispatch choice in the LP (the engine already calls 1.2 GW the LP does not have); growth after the note |
| Demand response, shiftable | partly: LBNL-2001576, R3.5m/MW (held, price year not stated) | partly: IEA 2026, about 1 TWh a year for industry (held); 4 GW outer, unverified | 12-14 | yes | after the note (the LP needs a shift formulation; two findings on it already fail after fix (a)) |
| New nuclear | yes: IRP 2025 workbook, 1x1600 MW R176,885/kW, fixed O&M R2,837/kW-yr, 72 months, 30 years (held, first-hand); SMR 12x73 MW R153,378/kW, 48 months (new, first-hand) | yes, by policy: IRP 2025 Table 1, 5,200 MW in 2036-39 (held) | 8-11 | yes | c5: earliest 2036, cumulative cap 5,200 MW by 2039; the engine also needs new nuclear's fixed O&M (missing now) |
| CSP, new | yes: IRP 2025 workbook, trough 0-12 h R83,198-195,045/kW, tower 3-12 h R106,475-158,985/kW, fixed O&M R1,228-1,663/kW-yr, capacity factor at Upington 0.26-0.70 (new, first-hand) | technical only: Fluri 2009, 548 GW (new, abstract); the binding limit is Northern Cape grid headroom (GCCA 2025: none), which a single node cannot see | 16-22 | partly | after the note |
| New coal | no: no unabated coal row in the IRP 2025 workbook; the code's R5,000/kW-yr names no study; Kerwin et al. USD 3,297/kW (held) | 0 by policy (IRP 2025: no new coal) | 8-10 | yes | after the note; a sensitivity at most |
| Carbon capture | partly: IRP 2025 workbook, new coal with 90% capture R149,567/kW (new, first-hand); no retrofit cost; the code's R38,000/kW and R260/MWh disagree | storage: Council for Geoscience atlas 2010, 150 Gt, 98% offshore (new, extract); nothing deployable before the mid-2030s | 12-16 | yes | after the note; first check a possible engine error (the share is not applied to the coal cost at ix:6815) |
| Grid-enhancing technologies | no SA cost: one case, about R3m/km to reconductor a 275 kV line (Energize, Dec 2025, new, first-hand); the 20% uplift is assumed | no SA potential estimate | 6-10, regional LP only | no (no corridors) | after the note |
| Transmission build | yes: TDP 2024 R440bn for 14,500 km, R402/kW-yr (held); the grid-cost switch bldGridCost exists, off in c4 | yes: GCCA 2025 headroom 19.94 GW; delivery 270.8 km a year (held) | 0-2 to switch the grid cost on, plus its run time to measure; corridors only in the regional LP | as the grid-cost adder | c5: decide whether new build pays the grid cost (an existing, sourced option); corridors after the note |
| Imports | no: R550/MWh names no document; no Cahora Bassa tariff; SAPP day-ahead 12.3-17.6 USc/kWh (new, extract) | the 1,150 MW contract ends in 2030 and Mozambique plans to take the power (Engineering News, Feb 2024, new, extract); c4 holds it to 2040 | 4-8 | yes | c5 input, not an option: decide the post-2030 assumption; imports as a choice after the note |
| Rooftop solar | partly: Kerwin et al. USD 1,406, 1,258, 1,110/kW for 2020/30/40 (held); BLD_COST's R17,000/kW unsourced (14ba) | uptake: IRP 2025, 0.9 GW a year (held); 1.2 GW a year unsourced; technical 72 GW (Senatla et al. 2020, new, abstract) | 1-2 | yes | keep as an input, at the sourced 0.9 GW a year: households decide it, and as a planner's choice the LP builds none (RESULTS: zero rooftop is the cost optimum, not a forecast) |

Also offered by the app but not choosable (one line each): solar tracking (a global switch; fixed-tilt R12,000/kW unsourced);
RMIPPPP hybrids (the LP leaves out the existing 335 MW); diesel peaker early retirement (not offered) and life extension (a
R1,500/kW placeholder); coal life extension (not offered); coal availability improvement (no cost); synchronous condensers
(14bc); surplus exports (14by); grid-forming battery share (fixed 0.30, no cost); electrolysers (hydrogen panel only); biomass,
small hydro and compressed air (absent).

Time: the c5 recommendations (interruptible demand response, new nuclear, the grid-cost decision, the import input, the
rooftop basis) add up to 15-22 h with tests, about two working days. Building them after Thursday's freeze moves c5's launch
from Thursday to about Saturday; the engine's pass marks (TODO 14dt) are a separate decision before that.

### Coal flexibilisation (user, 13 Oct)

1. Confirmed in the code (build 13h): c4's build LP and engine check run with it off. The switch is a toggle, default off;
   'Today 2026' leaves it off and both pipeline scripts start from that preset and never set it (pathway_perfail.js:128,
   pathcheck.js:26). In the engine it changes the ramp rate only, from coalRampBasePct 24 to coalRampFlexPct 100 %/h
   (ix:7173-7179), plus a capital charge (ix:8574). It does not change minimum stable level, commitment, start costs or
   part-load. The build LP never reads it: its coal rows are a 0.65 minimum on committed coal and a commitment ramp of
   available coal / 48 per hour (ix:10411, 10455-10463), with no output ramp. Faults found: the charge falls on all standing
   coal, not a retrofitted share; the toggle's value 1 reaches the nodal engine as 1% of the way (nodal_engine.js:457); the
   frontier caption reads it as 'not flexibilised' (ix:4242).
2. Work to make it an optimiser choice, year by year: LP, flexibilised MW by year (cumulative, at most the standing fleet),
   annualised retrofit cost in the objective, a lower minimum and faster commitment ramp for that share (6-8 h); engine, the
   same share applied unit by unit in the commitment step (lower minimum stable level, faster ramp) and the charge on that
   share only (6-8 h); pathway and engine check carry it by year (2 h); sourcing first (4-6 h). About 16-22 h in all.
3. Sources for Eskom-type subcritical units (13 Oct; read = in the document, extract = search text only; not yet in SOURCES):
   - Eskom RT&D, 'Gx Operational Flexibility', RES/TRR/21/1962944 (3 Nov 2023), in Eskom's public notice on its coal
     flexibilisation studies (Oct 2025, an MES exemption condition), read pp. 1-25: procedure-only tests without oil support
     reached about 44-62% of full load across eight stations, against design-data minimums of about 50-69%; mills (60-90% band,
     at least three in service), oil support below 38% of boiler maximum steam flow and air-heater temperature bind first;
     no ramp figures in the pages read; capital (Tier 2 and 3) work neither studied nor costed, targets for 2030-35; start-up
     fuel oil 35-80 t a start. The best 'before' basis, and Eskom's own. Eskom's terms apply: cite and summarise, do not
     reproduce its tables here.
   - India, the closest analogue (500 MW drum subcritical units on high-ash coal): IGEF and vgbe pilots, 32-40% minimum and
     1.5-3%/min (Andal read, others extract); CEA 2019 and 2023 (via Power Line summaries): 40% target, never below 35% on
     high-ash coal, about 1.3%/min achieved with manual mills; capital Rs 60-70m a unit (up to Rs 300m for old units), Dadri
     490 MW Rs 200m; CEA regulations 2023: 40% by 2030, 3%/min above 70% load (extract); NTPC: 7.6-8% heat-rate penalty at
     55% load (extract).
   - Agora Energiewende (2017), Flexibility in thermal power plants, read pp. 1-51: hard coal 25-40% minimum, 3-6%/min at the
     state of the art; old South African plants no more than 1%/min; retrofit 100-500 EUR/kW case by case (citing NREL
     60862); Weisweiler (lignite, not hard coal) about EUR 60m a unit. The current R223/kW-yr rests on Weisweiler alone.
   - Kumar et al. (NREL and Intertek APTECH, 2012), Power Plant Cycling Costs, read: wear per start for large subcritical
     units, USD 59 / 65 / 105 per MW (hot / warm / cold, 2011 USD, lower bounds).
   - Also, extract only: IEA (2018) Advanced Power Plant Flexibility and its annexes; NREL (2013) Flexible Coal; Henderson
     (2014, IEA Clean Coal Centre); Danish Energy Agency (2018); China (Ember 2026 citing the CEC, 500-1,500 CNY/kW).
   - South African planning: CSIR (2020): no literature on how low the existing fleet can run; Meridian (2025): seasonal
     shutdowns save more than a lower minimum; IRP 2025 publishes no coal minimum-generation assumption.
   Best basis: before, Eskom's report; after, the Indian 500 MW pilots and CEA (about 40%, 35% floor; 1.5-3%/min set, about
   1%/min achieved); cost, CEA's per-unit capital with Agora's 100-500 EUR/kW as the deep-retrofit bound, Kumar for wear per
   start. Caveats: Eskom has done the procedure tier only and the mill backlog binds before design limits; sources mix sent-out
   and generated MW and percentages of different ratings; Indian results are short tests; costs differ in year and currency.

### Decision on the first batch of new options (user, 16 Oct 2026, message 136; record only)

Nothing is built before the note goes out (6 Nov). After it, the first batch of new optimiser options is coal flexibility, VPPs,
demand response (interruptible at its contracted MW, plus paid load shifting) and long-duration storage (TODO 14ek). Each is a
year-by-year choice in the build LP with a sourced cost and ceiling, carried through the engine check.

- Order: interruptible demand response, then coal flexibility, VPP, load shifting, long-duration storage. Each on its own branch and
  pull request, with the LP-key test and the suite. One new central and one set of sensitivities at the end of the batch, not after
  each option.
- Coal flexibility is three choices, not a peaker: a lower minimum stable level, a faster ramp and seasonal shutdown, each on a
  flexibilised share of the fleet, with the retrofit cost on that share only. The three faults in the existing switch (above: the
  charge on all standing coal, the nodal engine's 1%, the frontier caption) are fixed in the same work. Basis: Eskom RT&D 2023 for
  before, CEA and the Indian pilots for after, Agora as the deep-retrofit bound, Kumar for wear per start. No values until the
  user's Meridian call notes.
- VPP: no South African cost. Bring the user the options for its cost basis before building; Brattle's US figure is not used
  without the user's decision.

## c5 inputs and stopping rule (13 Oct 2026, 22:00 UTC; proposals for your decision before launch)

Final c5 inputs (your decisions, 14 Oct, second message): tracking on (PVTRK=1); carbon central 'kept2030' (TODO 14eb);
coal on IRP 2025 Figure 3's 50-year line (COAL_DATES=coal_dates_irp2025.json), with Meridian's ME IRP 2024 dates (UC_FLEET,
c4's, no COAL_DATES) and the 60-year line (coal_dates_irp2025_60y.json) as sensitivities; wind 2.5 GW a year to 2030 and
3.5 GW from 2031 (WIND_CAP=3500 WIND_CAP_FROM=2031); lithium capex decline 3% a year (BATT_DECL=0.03, as s_battdecl), with the
model's 5% as a sensitivity. Launched 14 Oct 08:31 UTC: run 38535760468 (#128), claude/c5 at a74d581 (build 14i), pinned.
Settings line and tests: RESULTS 'c5 inputs, final'. Next: its engine check (workflow), stop reason, top-up from claude/recheck-14d.

Update 14 Oct (your decisions, TODO 14dx): #32, #33, #35 and #36 merged (main 7135caf); #34 closed. c5's own branch is
claude/c5, from main: the imports end year (5d5dc10, 14c), 14dr (a89df58, 14d), c4-irp3's three off-by-default pathway
settings including ROOF_MW (191e7cc, 0ec290f, 66d9fb7; carried whole, the commits bundle ROOF_MW with GAS_LIFT, GASFLOOR_VINT,
PV_CAP_YR, TCAP_YR and COAL_AVAIL, all off unless set), the check changes (63a2722, 14e) and the stall stop (b86fc7c, 14f;
STALL=0.1 STALL_FROM=4 with MAXP=6; the verdict records adequate, stall stop or pass limit reached). Top-up and check mode
after c5: claude/recheck-14d (claude/topup merged onto claude/c5; never merged). claude/c5-imports is superseded by claude/c5.

- Imports after 2030 (TODO 14dv (6)): IRP 2025 does not say, as far as the sources reachable here show. Table 1 carries hydro at
  1,600 MW from end 2025 with no additions to 2042, but it lists new capacity only; two web searches (13 Oct) found the
  contract's end (Mozambique's strategy: 31 Dec 2030, about 1,150 MW) and nothing on the IRP's assumption. The gazette's full
  text was not read (long PDF). So, per your rule: 1,150 MW kept, plus a no-imports-after-2030 sensitivity. That needs a
  year-by-year imports setting in the pathway LP and the engine check (none exists; about 1-2 h).
- Built 14 Oct on claude/c5-imports (from step 3): the imports end year (IMP_END=2030 for s_noimp; f0d5dc8, build 14c) and 14dr
  (835b618, build 14d, separate so it can be dropped; it makes mark (2) worse: RESULTS 'c5 inputs').
- Rooftop 0.9 GW a year: the ROOF_MW setting exists on claude/c4-irp3 (merge step 6), not on main or c4-frozen; c5 needs it
  merged or carried. Grid cost: GRID=1 exists on c4-frozen.
- Stress-day coal, 14de (TODO 14dv (5)), evidence and proposal. On c4's three 2030 windows the fixed engine (14a) commits a mean
  of 14.0-15.8 GW against 16.7-17.1 GW available; its lowest hours are 0.36-5.8 GW (midday, low net load); it sheds none.
  The optimiser's stress-window coal (coalAvailFrac) is already the engine's own hourly ceiling, the commitment capped by
  outages, so both sides use one rule on the draw. The gap is which build the draw was made on: the window carries the
  commitment made for the previous pass's plan, and the low hours bind if the new plan has more net load there. Options:
  (A) as now, on 14a (no code; c5 inherits the lag, which shrinks as passes converge); (B) after each solve, re-run each
  window's draw on the plan just solved and re-solve if the commitment moved (one engine run per window per pass, about
  3-4 h of code); (C) first, a GitHub engine-check job of s_coalavail's plan on 14a (about 1 h): if the plan that used
  available coal now passes, the old engine was the cause of its failure. Recommended: C now, then A for c5 unless C
  passes; B after the note.
- Stopping rule (TODO 14dv (9)), proposed: the loop's own adequacy test as in c4 (stop when no year's mean shed is above its
  target); a pass cap of 6 (MAXP=6); and a stall stop: from pass 4, stop when a pass cuts the worst year's shed above target by
  less than 10% (c4's passes 4-7 cut 7-19% each). Whatever stops it: the engine check, then the top-up on any failing year,
  both costs reported, and the stop reason recorded. Time: passes of 1.5-4 h, so at most about 10-20 h; on 14a c4's own build
  already passes the engine check, so c5 may stop sooner.

## Merge order to main by Wed 21 Oct (proposal, 13 Oct; you merge)

Each step simulated in a scratch copy of main with the full suite (ESK19679.csv present; audit 87/87 and eng5 6/6 at every step).
1. Pull request #32, licence lines (1 commit, on main). Suite 724/725 (EDMSA only).
   Step 2 opened 13 Oct as pull request #35 (claude/merge-c4-frozen: #32 merged in, then c4-frozen; conflicts resolved): suite
   808/812 with audit, eng5 6/6; the GitHub stress suite needed one fix (stress_suite.js loads the modern wind map), now green.
   Step 3 opened 13 Oct 22:30 UTC as pull request #36 (claude/merge-engine-fix: engine fixes 13f-14a and 14dp on step 2; build
   14b): suite 807/813 with audit, eng5 6/6, stress suite 290/290. Merge #35 first.
2. The c4 engine, claude/c4-frozen (115 commits, build 12e): per-year stress windows, grid cost and peakers (#20, #21), the
   build-costs code of #22 (BW3 batteries, modern wind, tracking option, hourly storage in the build LP), the 9-12 Oct engine
   and optimiser work (gas and diesel options, coal dates, customer-demand standard, adequacy test) and the long-run workflow.
   Two conflicts: BUILD_STAMP (new stamp) and the workflow file (c4-frozen's, a superset of main's). Suite 721/725 (EDMSA and the
   three findings that wait on #22's preset re-search).
3. Engine fixes, claude/engine-fix (3 commits, 13f-13h). Conflict: BUILD_STAMP only. Suite 715/725 (the six in TODO 14dp; 721 if
   those are settled first). The live site (GitHub Pages, nickhedley.github.io/gridtwin-za) follows main from here.
4. Docs, claude/build-costs's own 65 commits (RESULTS, TODO, HANDOVER, SOURCES, CLAUDE). Clean.
5. Tools, claude/topup and claude/costsplit (topup.js, gasrole.py, costsplit scripts, pathcheck additions, the workflow's
   top-up and tsl modes). Clean.
6. Sensitivity switches: claude/c4-irp3 (contains c4-coalavail), c4-coalirp, c4-windlow, c4-battdecl, c4-diesel. Three conflicts
   in pathcheck.js and pathway_perfail.js where two branches add a field to the same line; kept both. Best done as one branch
   with the LP-key test.
7. .github/print_state.py from claude/print-results (the script only; that branch's print-only workflow stays off main).
   Suite after 4-7: 715/725, the same checks as after 3.
Also any time: #33 (cross-check scripts). Close without merging: #22 (code in 2, docs in 4); claude/stress-per-year, grid-cost and
peakers (inside 2). Hold: regional-phes-07u (regional pumped hydro, inconclusive; its build 08a is not in c4-frozen),
kerwin-demand, gas-annual-flex-regroup (6 Oct notes), fleet-slim (paused). Timing: 1-3 by Thu 15 so c5 can launch from main;
4-7 by Wed 21. For 2, 3 and 6 I would open merge branches with the conflicts resolved, once you approve the order.

Read this block first. Everything below it is older and is superseded wherever it disagrees. Upkeep (user, 12 Oct):
when a run finishes or a decision changes, update this block (run IDs, status, headline numbers) in the same commit. A new session can
take over at any point from this block, CLAUDE.md and TODO.md (items 14cn, 14co, 14bz, 14ay and the FOCUS line).

## Runs, 13 Oct 2026 07:20 UTC

- c4 final: c4-target stopped after pass 9 (user). Pass 9 solved 02:59-06:58 UTC (job 38338261578, 4 h 14 min with the
  replay); the automatic job 10 (38359803131) was cancelled before it started pass 10; replacement job 10 = run
  38359856512 (same settings plus MAXP=9, prev_run 38338261578, code 86bfea4): replayed passes 1-9 from the cache (pass 9
  key 1e8b5aa62a), 'done pass limit reached', exit 0, wrote pathway_c4t.json and pathway_c4t_lp2040.json; its check job
  runs the engine check. This run is c4's final run and the seed of the set.
- Seeded set launched 07:13 UTC (user rules, 13 Oct): rule A, MAXP=1 (one solve on c4's pass-9 windows, then engine
  check, then top-up) for every run but s_nogas4strict; s_nogas4strict rule B, MAXP=3, no top-up. All seed_run
  38359856512, seed_name c4t, settings c4t's plus WIN_FROM=seed/out/pathway_c4t_lp2040.json and MAXP. Run ids by
  dispatch order (names to confirm from each job log's RUN_NAME):

```
s_disc10 38361281441      s_disc113 38361285970     s_gasprem 38361289574     s_committed 38361295036
s_wind35 38361299620      s_li8h 38361303412        s_nogas3 38361308336      s_nogas4 38361312903
s_nogas4strict 38361317217 (MAXP=3)                  s_be4 38361321669         s_be6 38361326157
s_be7 38361331510         s_coalirp 38361335715 (ref claude/c4-coalirp, ee92b00, Figure 3 dates)
```

- s_nogas4strict finished 07:53 UTC (run 38361317217): rule B stopped after pass 1 (no failing year in the loop's test);
  engine check within target every year (worst 9%); R2,838bn PV, 1,331 Mt; no gas or new open-cycle (RESULTS). Print job
  38366303884. No top-up (rule B).
- Gas role (user, 13 Oct, item 2): engine check re-run with gas, diesel and CO2 by fuel (claude/topup, mode check, 833852b):
  c4 run 38365615522, penalty c4 run 38365619101, both done (RESULTS, 'Gas role and the method gap'): c4 gas output 68.8 TWh
  (CCGT 53.1, LNG open-cycle 15.7; CF 41% and 30% in 2040), penalty c4 17.9 TWh (CCGT only, CF 9% in 2040); the 126 Mt gap
  is coal 105, gas 21, diesel 0.1 Mt.
- s_dieselhigh (user, 13 Oct): waits on the user's choice of diesel price basis (SOURCES, 'Diesel fuel price'; TODO 14cj).
  Switch DIESEL_R on branch claude/c4-diesel (3cc075f, tested: LP unchanged when unset). Launch: ref claude/c4-diesel,
  seed_run 38359856512, seed_name c4t, c4's settings plus WIN_FROM, MAXP=1 and DIESEL_R=<value>; then the top-up.
- s_battdecl started 08:13 UTC (user, 13 Oct; TODO 14cw): run 38367769821, ref claude/c4-battdecl (1edd42b; c4-frozen plus
  BATT_DECL, tested: off key e0b93ac712, on only the 28 lithium build cost coefficients change), c4's settings plus
  WIN_FROM, MAXP=1 and BATT_DECL=0.03 (lithium capex -3% a year real, against the engine's 5%), seed 38359856512 / c4t,
  rule A: then print and top-up (claude/topup applies battDecl from 89f3ed0).
- s_nogas4strict_bd finished 08:58 UTC (run 38367947315, ref claude/c4-battdecl 1edd42b; s_nogas4strict plus BATT_DECL=0.03,
  rule B): adequate after one pass, R2,862bn, 1,328 Mt (R24bn above s_nogas4strict). Print 38373115718. The no-gas premium
  is quoted only as s_nogas4strict_bd against s_battdecl (still running).
- s_dieselhigh held (user, 13 Oct): c4's diesel at option (a) adds at most R1.4bn undiscounted (RESULTS). If s_nogas3 or
  s_nogas4 produce more than 1 TWh from diesel in any year (engine check, 'dieselTWh'), run high-diesel versions of them
  at option (a), DIESEL_R=8887, ref claude/c4-diesel, rule A, seeded from c4, labelled an upper bound.
- s_nogas3 finished 08:15 UTC (run 38361308336, name confirmed): as solved R2,593bn, 1,547 Mt, 2036-40 failing the engine
  check (2040 968%). Top-up 38368114518: 4,250 MW, R2,606bn, 2036 over the cap; diesel under 0.5 TWh a year, so no
  high-diesel version.
- s_be6 finished 08:27 UTC (run 38361326157, name confirmed): adequate, R2,550bn, 1,629 Mt; top-up 0 MW (38369362473).
  Flag: R48bn below c4 on the engine check but R88bn above on the optimiser's objective (RESULTS; TODO 14cv).
- s_nogas4 finished 08:27 UTC (run 38361312903, name confirmed): as solved R2,597bn, 1,553 Mt, 2035-40 failing (2040 1,035%);
  Top-up 38369545953: 4,750 MW, R2,612bn, 2036 and 2038 over the cap; diesel at most 0.48 TWh, so no high-diesel version.
- s_committed finished 09:02 UTC (run 38361295036, name confirmed): engine check within target every year, R2,562bn,
  1,602 Mt; top-up 0 MW (38373578065). Same flag as s_be6: R36bn below c4 on the engine check, R9bn above on the LP objective.
- s_wind35 finished 09:11 UTC (run 38361299620, name confirmed): as solved R2,518bn, 1,522 Mt, LP objective R1,661bn;
  2037-40 fail the engine check (2040 500%). Print 38374615434; top-up running (claude/topup, dispatched 09:13).
- TODO 14cv (user, 13 Oct: now, before the note): cost split done for c4, s_be6, s_committed (RESULTS). Cause: the optimiser's
  2030 stress-target penalty and dispatch differences; proposed measure for the note: the engine check. Until agreed, every
  cross-run gap is reported on both measures (optimiser objective and engine check). Tools: branch claude/costsplit (mode lpsplit,
  analysis only); the engine-side split ran locally (scratchpad, not committed).
- s_wind35 top-up (38374666197): 3,000 MW, R2,526bn, 2038 over the cap. s_disc10 finished 09:25 (run 38361281441; engine PV at
  8% R2,688bn as solved, 2040 at 112%; optimiser objective at its own 10% not comparable); print 38376204471, top-up 38376207996.
- s_disc10 top-up (38376207996): 500 MW, R2,688bn. s_disc113 finished 09:34 (run 38361285970): engine R2,763bn at 8%, 2040
  109%; print 38377992313; top-up running. Still running at 09:45: s_gasprem (check job), s_li8h, s_be4, s_be7, s_coalirp,
  s_battdecl.
- s_coal60 started 09:54 UTC (user, 13 Oct): run 38379671167, ref claude/c4-coalirp (53e9ba8), c4's settings plus WIN_FROM,
  MAXP=1 and COAL_DATES=coal_dates_irp2025_60y.json (IRP Figure 3 60-year line; tests: off e0b93ac712, on d27891bfb8, right-hand
  sides only), seed 38359856512 / c4t, rule A: then print and top-up.
- s_coalirp finished 09:49 UTC (run 38361335715): pass limit after one pass, engine R2,588bn as solved, 2039 183% and 2040 439%
  of target; print 38379708616; top-up 38379712300 running. Objective R1,686.2bn, no stress-target penalty.
- s_disc113 top-up (38377995864): 250 MW in 2040, R2,763bn, within the caps.
- s_gasprem finished 09:49 (run 38361289574) and s_be7 10:02 (run 38361331510): print, top-up and tsl dispatched 10:05
  (claude/print-results, claude/topup, claude/costsplit mode tsl). Still running: s_li8h, s_be4, s_battdecl, s_coal60.
- Three items (user, 13 Oct) done (RESULTS, 'Both measures for every run'): objective without the stress-target penalty for
  every run (claude/costsplit mode tsl, runs 38380018380-38380041963): only s_be6 disagrees on direction with the engine
  check (+R10bn against -R49bn); s_committed now agrees. c4 2040 (engine, 480 runs): curtailment in 2,290 h, 613 with lithium
  below 90% full, at most 4.7 of 41.9 TWh absorbable; lithium 119 cycles a year in the engine, 374 in the optimiser. c4 2030
  windows: 2015 22 Mar-4 Apr, 2017 28 Jun-11 Jul, 2023 25 Jan-7 Feb plus the tail week; diesel 6,200 MW both sides; the
  optimiser caps stress-day coal at the engine's committed coal (lowest hour 576 MW) not available coal (never below
  12.6 GW there): TODO 14cx, after the note. Every new run gets a tsl job (claude/costsplit, mode tsl) beside print and top-up.
- s_coalavail started 10:22 UTC (user, 13 Oct: test TODO 14cx before the note, one run): run 38382908890, ref
  claude/c4-coalavail (1143a98; c4-frozen plus COAL_AVAIL, tested: off and on-without-windows key e0b93ac712; on with windows
  only the stress-window cmax and resv numbers change, ramp rows and objective identical), c4's settings plus WIN_FROM,
  MAXP=1 and COAL_AVAIL=1, seed 38359856512 / c4t, rule A: then print, top-up and tsl. Report against c4: 2030 builds (diesel
  open-cycle, lithium), the 2030 penalty, cost on both measures.
- Check-in 10:31: s_coalavail passed its COAL_AVAIL check (still solving after 8 min). s_coalirp top-up 3,250 MW, R2,592bn
  (2039-40 over the caps), still R7bn below c4 on the engine check and R29bn on the objective: agree. s_gasprem R2,617bn with a
  1,750 MW top-up (2040 over the cap), objective without penalty R1,723.0bn: both above c4. s_be7 adequate, R2,614bn, 1,576 Mt;
  its objective leaves out the fixed nuclear's capital, so not comparable. s_li8h (38361303412) and s_be4 (38361321669)
  finished ~10:04; print, top-up and tsl dispatched 10:35. Running: s_battdecl, s_coal60, s_coalavail.
- Decisions (user, 13 Oct, after 10:45): (1) s_coalavail's reserve row stays as built: stress days see the same coal as
  ordinary days. (2) In the note's table every run shows its top-up MW and the years over the build cap in their own
  columns; runs whose top-up breaks a cap (now s_nogas3, s_nogas4, s_wind35, s_gasprem, s_coalirp, all 2036-40) have their
  cost called a lower bound (RESULTS table, 'LB'). (3) s_be7: nuclear basis R10,500/kW a year (USD 7,500/kW overnight, no
  study or price year, 40 years, 8%), no fixed O&M charged for new nuclear; 2040 cost +R9.5bn a year against c4 as solved,
  +R6.8bn against c4 with its top-up; R22bn a year of fixed O&M would be missing at Koeberg's figure (TODO 14cz).
- s_be7 nuclear arithmetic (user, 13 Oct; RESULTS): with interest during construction and the IRP's fixed O&M, s_be7 is
  R2,657bn (ours, USD 7,500), R2,681bn (EIA AEO2023) or R2,700bn (IRP 2025 workbook): +R58, +82 or +101bn against c4; 2040
  gap +R39, +58 or +72bn a year; 2040 CO2 93.5 against c4's 101.3 Mt (-7.8 Mt; R5,040-9,190/t). Engine unchanged (TODO 14cz).
- Check-in 11:21: s_li8h R2,614bn with a 3,000 MW top-up (within the caps), objective R1,702.9bn, no penalty: disagrees with
  the engine on direction (storage-heavy, 8-hour lithium). s_be4 R2,618bn with 750 MW, objective without penalty R1,720.6bn:
  agree. s_be4's floor (user, 13 Oct): 51% on whatever new CCGT is built, not 6 GW forced; it built CCGT only from 2036
  (0.99 GW by 2040) and OCGT on LNG instead; not the IRP's requirement (RESULTS). s_battdecl finished 10:47 (run 38367769821); print, top-up and tsl dispatched 11:23. Running: s_coal60, s_coalavail.
- s_battdecl in (11:40): adequate, no top-up, R2,590bn, 1,603 Mt, objective without penalty R1,729.0bn (engine -R9bn,
  objective +R13.5bn against c4: disagree). Strict no-gas premium (s_nogas4strict_bd against s_battdecl): engine +R272bn,
  objective +R219bn, -275 Mt; 2040 +R71bn and -35 Mt. The note's 2040 table (cost gap, CO2 gap, R/t, UB and LB marks) is in
  RESULTS ('2040 against c4 with its top-up'). Still running: s_coal60, s_coalavail.
- Decision (user, 13 Oct 11:42, replaces the 11:37 message): c4's wind limit unchanged (2,500 MW a year; c4 builds 12.5 GW in
  2026-30, 0.45 GW in 2036, 0.54 GW in 2039). s_wind35 relabelled 'wind limit 3,500 MW a year from 2028 (front-loaded)', its
  2037-40 failures and lower bound noted, out of the note's headline findings. When s_coalavail finishes: if its 2030 new
  diesel open-cycle or lithium differs from c4's by more than 0.5 GW, or its cost by more than R10bn on either measure (engine
  with top-up, or objective without penalty), the new central is c4 + COAL_AVAIL=1, which is s_coalavail itself (same
  settings, rule A from c4, topped up); then rerun from it (ref claude/c4-coalavail, COAL_AVAIL=1, WIN_FROM = its windows):
  s_nogas3, s_nogas4, s_nogas4strict (rule B), s_be6, s_committed and s_irpgas, plus the s_be7 arithmetic against it. If not, c4
  stays the central and only s_irpgas runs, from c4. s_pvirp and s_roof2 go ahead. s_irpgas, s_pvirp and s_roof2 are not
  defined in this session's record: settings asked of the user before any launch. Rooftop stays 1,200 MW a year until s_roof2.
- s_windlow started 11:47 UTC (user, 13 Oct): run 38392619799, ref claude/c4-windlow (71d076e; c4-frozen plus windCase
  recorded in the run and applied by pathcheck.js; the same on claude/topup, 047f9e9), c4's settings plus WIN_FROM, MAXP=1,
  WIND_CASE=low (IRENA global USD 1,041/kW), WIND_CAP=3500 WIND_CAP_FROM=2031; seed 38359856512 / c4t; rule A: then print,
  top-up (claude/topup applies windCase) and tsl. Report wind built by year beside c4's (RESULTS, c4's wind build). Tests:
  off key e0b93ac712; on a9ce3eea84, only the 14 b_wind cost terms and the 2031-40 wind bounds change; check with a recorded
  windCase equals WIND_CASE given directly.
- TODO 14da (c5 wind limit 3,500 MW a year after 2030) and 14db (s_irpgas floor: the optimiser floors all new CCGT, not only
  the 2029-30 6 GW; switch and reporting needed; settings asked of the user).
- s_irpgas, s_pvirp, s_roof2 (user, 13 Oct, settings given 12:00): branch claude/c4-irp3 (0b08ca7; claude/c4-coalavail plus
  GAS_LIFT, GASFLOOR_VINT, PV_CAP_YR, ROOF_MW, all off by default; pathcheck records gasFloorTWh). Rule A, seeded from the
  central (c4, or s_coalavail if it crosses the thresholds; then add COAL_AVAIL=1 and seed from its run), with top-ups; report
  wind and solar built by year beside the central's.
  s_irpgas: GAS_FORCE=2029:3000,2030:3000 GAS_MIN=2032-2034:1250,2035:1000,2036:1250,2037:1500,2038-2040:1250 GAS_LIFT=1
    GASFLOOR=1 GASFLOOR_VINT=2029-2030. Lifted: tcap 2029-30 2,000 to 3,000; gascap 2032-34 and 2036-40 to the minimum (2035
    not); gascap 2029-30 set to 3,000 by GAS_FORCE. Report floored and unfloored gas output (check log, gasFloorTWh).
  s_pvirp: PV_CAP_YR=2026:3553,2027:2886,2028:1760,2029:1314,2030:800,2031:1000,2032:1200,2033:1400,2034:1600,2035:2000,
    2036-2040:1600.
  s_roof2: ROOF_MW=2000 (rooftop fixed at 2,000 MW a year from 2027). Engine cost: new rooftop pays the BLD_COST.rooftop
    annuity (R17,000/kW in 2026, -3.89% a year, 25 years, 8%) plus R495/kW-yr fixed O&M inside newCapexR, so in the engine's
    system cost; btmCapexR (flat R1,150/kW-yr) only removes it from the grid-cost measure; the optimiser's objective has it
    as a constant (fixed build).
  Tests: off key e0b93ac712; s_irpgas 2a7e1ad4c8 (22d2267038 without the vintage switch); s_pvirp f45106c146 (only b_pv
  bounds); s_roof2 f52ec8a659 (only b_rooftop bounds).
- s_coalavail finished 11:40 (run 38382908890); print 38394235656, tsl 38394244895 done; top-up 38394240062 running
  (dispatched 12:01). As solved: engine R2,399bn (c4 R2,598bn), objective R1,514.3bn with no penalty (c4 R1,715.5bn without
  its R12.2bn), 1,864 Mt (c4 1,605); 2030 new diesel open-cycle 0.05 GW (c4 2.8), lithium 5.6 GW (c4 6.6); no wind until 2030
  (c4 2,500 a year from 2026). Fails the engine check and the loop's own test in every year 2030-40 (2040 2,816% of target).
  Rule crossed on every test in. Decision (user, 13 Oct 12:25): c4 stays the note's central; s_coalavail is a finding only
  (it drops c4's 2.8 GW of diesel open-cycle by 2030 and fails the engine check every year from 2030; the 2030 peaking build
  is what the engine needs, given how it commits coal); no rule B run of it before the note; the s_be7 arithmetic stands
  against c4; its top-up runs to the end and is recorded (MW, cost, cap breaches). c5: one stress-day coal rule (TODO 14de).
- Launched 12:10-12:11 UTC, all cancelled 12:26 (decision (a); the six on claude/c4-irp3 could not be told apart while
  running, so the three _c4 ones were cancelled too and relaunched): _ca 38395398203, 38395403267, 38395407641, 38395481991,
  38395489267, 38395492993, 38395498884, 38395502406; first _c4 38395416019, 38395420841, 38395424726.
- Running from c4 (relaunched 12:27, ref claude/c4-irp3 0488f54, seed 38359856512 / c4t, c4's settings + WIN_FROM, MAXP=1,
  rule A; then print, top-up on claude/topup 27337aa, tsl): s_irpgas_c4 38397386689, s_pvirp_c4 38397404456, s_roof2_c4
  38397420439 (dispatched one at a time; ids confirmed by run number 108, 109, 110). Report wind and solar by year beside
  c4's; s_irpgas floored and unfloored gas and its 2029-30 diesel open-cycle beside c4's 1.8 GW; s_roof2 both measures with
  rooftop's share.
- s_irpgas turbine cap (user, 13 Oct 12:20): TCAP_YR=2029:4000,2030:4000 (3,000 MW forced CCGT plus diesel open-cycle's usual
  1,000 MW) so s_irpgas changes only the gas plan; key 9fb3b64f9d, only tcap_2029/2030 change (3,000 to 4,000). Report its
  2029-30 diesel open-cycle beside c4's 1.8 GW (1,000 in 2029, 800 in 2030). In both s_irpgas runs' settings.
- s_roof2 (user, 13 Oct 12:25): report both measures against the central, the engine's total system cost (rooftop capex and
  O&M in) and the grid cost (pathcheck gridCost, flat R1,150/kW-yr of rooftop removed), with rooftop's share of each. The grid
  measure keeps R551-906/kW-yr of rooftop (c4: R42.7bn PV, 1.7%; total measure R114.1bn, 4.4%); RESULTS 'Rooftop in the two
  cost measures', TODO 14dc.
- Check-in 13:25: _ca runs all cancelled. s_coalavail top-up done: 8,000 MW, R2,458bn with it (lower bound: over the caps in
  2033 and 2038), 1,862 Mt; 500 MW restores 2030 (RESULTS). s_coal60 finished 12:50 (run 38379671167, name confirmed from
  artifacts); print, top-up and tsl dispatched 13:25 (print-s_coal60, topup-s_coal60, tsl-s_coal60). Still running: s_windlow
  (38392619799), s_irpgas_c4, s_pvirp_c4, s_roof2_c4. s_phestub held (TODO 14di).
- Fleet table (user, 13 Oct): slim paused, no pull request; decision after the Meridian call. Branch claude/fleet-slim
  (a6dc99c, tests in its commit message); full original on gridtwin-data branch claude/pypsa-rsa-fleet; TODO 14dh. Main
  untouched (origin/main bc21fc2). SOURCES: the fleet file's origin (PyPSA-RSA ME IRP 2024 workbook; 16 coal minimum stable
  levels differ) and NTCSA's GCCA terms (non-commercial, no redistribution without written consent) with our files' stated
  licences. RESULTS: c4's pumped hydro.
- GCCA licence labels (user, 13 Oct): pull request nickhedley/gridtwin-za#29 (branch claude/gcca-terms, 8f76e26) relabels
  GCCA-derived data to NTCSA's website terms (June 2024, clauses 2.1, 2.2, 3.1); nothing removed; suite 724/725 against main's
  723/725 (stamp check fixed; EDMSA remains). Copyright and 'commercial licensing' lines left for Nick. Nick merges.
- Validation (user, 13 Oct): single-node engine (the note's) 2.2% above a single-node PyPSA unit-commitment optimum on the same
  inputs, baseline week, linear coal cost (4.1% with part-load); nodal engine 4.2% above the matched 10-region MIP (RESULTS).
  Pull request nickhedley/gridtwin-za#30 replaces the unreproduced figure in validation/ (not quoted until reproduced). c4 2040
  comparison not done (TODO 14df step 9). Coal start-ups charged twice? (14dl). Coal dates are Meridian's ME IRP 2024 workbook (14cu);
  UC_FLEET's 0.5 minimum stable level on 16 coal rows is ours, unsourced (14dj); stale build outputs (14dk); s_phestub held
  (14di).
- Check-in 14:05: s_coal60 recorded (RESULTS, both tables and its own entry): adequate after one pass, no top-up, engine
  R2,578bn (-21 against c4), objective without the penalty R1,667.7bn (-47.8, agree), 1,639 Mt (+34); 2040 -R5.7bn, +9.1 Mt;
  2.7 GW of coal retired early from 2026 (c4 588 MW). Artifact downloads are blocked by the network policy here; figures come
  from the job logs. s_pvirp_c4 pass done 13:56, check running. Still running: s_windlow (pass since 11:47), s_irpgas_c4,
  s_roof2_c4.
- User, 13 Oct ~14:15: watch nickhedley/gridtwin-za#29 (subscribed); add 'nodal old/' relabel and a commercial-licensing line
  that excludes third-party data (LICENSE, index.html header; suite and stamp); 0.42% lines to the measured 4.2% with 'no
  optimiser cross-check yet' for the pathway engine; reconcile suite counts with CLAUDE.md; s_coalavail finding reworded
  (RESULTS); TODO 14dm (LICENSE data lines); Tubatse statement read by the advisor, figures match (SOURCES).
- User, 13 Oct ~14:20: c4 2040 three-week single-node comparison approved (TODO 14df step 9; three hours; lithium cycles, both
  start-up charges), after the four scenario write-ups; s_coal60 about R620/t against c4 (RESULTS).
- 13 Oct ~14:50: #29 extended (9c4670b: 'nodal old/' relabel; commercial-licensing line excludes third-party data in LICENSE and
  the index.html header; BUILD_STAMP 2026-10-13c; suite 724/725 before and after, audit 87/87, eng5 6/6); subscribed to #29.
  #30 reworded (4539704): measured 4.2%, pathway engine has no optimiser cross-check in the repository yet. Suite counts:
  main 810/812 with audit (EDMSA, stale stamp); main's 805/806 line is stale (its 5 Oct commit run today has 815 checks);
  CLAUDE.md on this branch updated. c4 2040 three weeks (RESULTS): engine 31-50% above the UC optimum, storage scheduling;
  14dl sized; 14dn added. s_pvirp_c4, s_windlow, s_roof2_c4 recorded (RESULTS); s_roof2_c4 top-up 38415714043 running;
  s_irpgas_c4 (38397386689) running.
- 13 Oct ~15:25 (user's six items): 24-hour rolling optimum on the three 2040 weeks (RESULTS): within 0.0-1.0% of the
  full-week optimum (rule 'all'), engine 30-48% above; stress week shed 0 against the engine's 37.3 GWh, recorded as partly the
  storage rule; c5 TODO 14do. Operating share of c4's engine PV 31.8% (2040: 27.8%). Both-measures table has a 2040 lithium
  column with 's' marks (>10% from c4's 126.1 GWh). Scripts on claude/sn-crosscheck, pull request nickhedley/gridtwin-za#31
  (reproduction checked). #29 merged 15:01 (unsubscribed); follow-up branch claude/licence-terms (LICENSE three lines, TDP
  labels, footer line, BUILD_STAMP 2026-10-13d), suite running. The 815 against 812: validate_response's three 'control ... still
  exists' checks for reserveContingencyMW, reserveRegulatingPct and reserveVrePct, controls merged into reserveOperatingMW on
  1 Oct (774dc8d); the stale baselines were regenerated on 6 Oct (9959106), which dropped the three checks.
- TODO 14df (c5: building and running agree, with done-when tests) and 14dg (finer network, GCCA supply areas), both after
  Friday's note (user, 13 Oct); nothing changes now.
- Note wording (user, 13 Oct): in 73% of curtailed hours lithium is at least 90% full; it cycles 119 times a year against
  374; the note states engine costs for storage-heavy plans as an upper bound (RESULTS).
- Measure (user, 13 Oct): the engine check is the note's cost measure, its storage caveat stated each time; every run also
  reports the optimiser objective without the stress-target penalty, and the note says where the two disagree on direction.
  No engine changes before the note.
- After each run: print job (claude/print-results, source_run = its last run) and, for rule A runs, the top-up
  (claude/topup, same inputs). c4: report as solved and with the top-up beside penalty c4 (cost PV, CO2, gas, diesel
  open-cycle and lithium GW in 2030/2035/2040, shed by year; 2039-40 marked failing the loop's own test; Tutuka flag).

## Decisions, 13 Oct 2026 (user), in force

1. c4-target stops after pass 9; no pass 10. Pass 9's solve is never cut (if it reaches the job limit it carries over). Method: when
   pass 9's job ends, cancel the automatic next job and dispatch a replacement on ref claude/build-costs with the same inputs plus
   MAXP=9 in settings (prev_run = the last c4t run, job_no = next, code_sha 86bfea4931d4b0823835c0f7f6ae147cb237b189). It replays
   passes 1-9 from the cache, tests pass 9, writes pathway_c4t.json (verdict 'pass limit reached') and pathway_c4t_lp2040.json, and
   its check job runs the engine check. Report c4 against c3 in the standard table (RESULTS, 'New central'), 2039-40 marked as
   failing the loop's own test.
2. The 12 seeded runs start from every window found through pass 9 (WIN_FROM, the windows pass 9 solved with). Before launch Nick is
   told each run's pass cap and stopping rule; all runs use the same rule. Proposed 13 Oct: A, one pass (MAXP=1, all on c4's windows),
   or B, c4's rule capped at 3 passes. Nick chose A for all but s_nogas4strict (B, no top-up; if it still fails after
   3 passes, report shed against target by year and diesel burnt by the existing peakers).
3. Adequacy top-up (TODO 14ct), branch claude/topup; run it on each finished run and report cost as solved and with the top-up.
4. s_coalirp on IRP Figure 3 as digitised by Nick (ee92b00 on claude/c4-coalirp, tested); start it on its own with c4's final
   windows and the set's rule; do not hold the set for it.
6. Coal (user, 13 Oct): sourced schedule recorded in SOURCES for the next central (TODO 14cu); s_coalirp keeps ee92b00 (sourced
   order moves at most one unit a year, Kelvin aside); the c4 report flags Tutuka 2030-31 in c4 against 2035-40 at 50-year life.
5. Penalty c4 finished 12 Oct 18:12 UTC without a handover (pass 2 ended 75 minutes inside the job limit); the handover is untested.

## Focus (user, 12 Oct 2026)

Until the IRP comparison is drafted, the only goal is c4 as the frozen central, then the seeded set (TODO 14co) and
the 14be comparison steps against it. Report to Nick only: runs started, runs finished or failed, and anything that
changes c4's headline numbers. Local background runs do not survive the session going idle (user): long runs go to
GitHub. The engine (index.html and harness) is not changed until the comparison is drafted.

## c4, frozen (TODO 14cn; RESULTS, "c4 frozen as the central")

- c4 is c4-target: `COMMIT=1 PSE=1 TF=0.5 DEMAND=irp_esrg LI_CAP=3000 OCGT=1 OCGD=1 GAS_CASE=central GAS_FOM_ADD=530.5
  STRESS_TARGET=1`, SOLVER=native, commit 86bfea4 (engine build 2026-10-12e; lithium energy 4 hours of power), with
  profiles.json and the weather-year file as committed there. Penalty c4 (the same without STRESS_TARGET) is the
  method check.
- Both run on GitHub with `.github/workflows/optimiser-long-run.yml`: one solve per job, each job under 6 hours, the
  solve cache and basis passed on as artifact `state-<name>`, the next job started automatically, every job pinned
  to the chain's first commit (86bfea4). The last job runs pathcheck.js (artifact `results-<name>`). GitHub's passes
  reproduce the local LP keys (pass 2 a9e5c71dc2, pass 3 0d4fdcdd1e).
- Status at 13 Oct 03:15 UTC: penalty c4 finished; c4-target running (pass 9):

```
c4-target (name c4t)   run 38255689961 pass 1, 5.4 min | 38256479696 pass 2, 25 min | 38259914914 pass 3, ~78 min
                       | 38269533084 pass 4, ~112 min | 38282680097 pass 5, 118 min (17:13-19:11 UTC)
                       | 38295943224 pass 6, 138 min (19:11-21:29 UTC) | 38310964088 pass 7, ~128 min (21:30-23:37 UTC)
                       | 38323088802 pass 8, 186 min (23:37-02:43 UTC) | 38338261578 pass 9, started 02:43 UTC
penalty c4 (name c4)   run 38255695323 pass 1, ~18 min | 38257824027 pass 2, 4 h 25 min (13:46-18:10 UTC, cold
                       start, 75 min inside the job deadline, so no handover was needed), 'done adequate', engine
                       check ran (artifact results-c4): every year within target (2040 1.17 / 2.60 GWh), cost PV
                       R2,681bn at 8% real, CO2 1,479 Mt 2026-40 (RESULTS, 'Penalty c4 finished')
```

- To check: list the runs of optimiser-long-run.yml (GitHub MCP, actions_list). The list does not show run names;
  a job log's env block shows RUN_NAME. A chain has finished when its newest run's pass job ended with status done
  (exit 0, no "Start the next job") and its check job ran (not skipped). Test runs carry 'test' in the name (user).
- Artifacts cannot be downloaded into the container (the blob host is blocked, and network settings are not to be
  changed until c4 is done), so seeded runs fetch c4-target's state themselves (inputs seed_run and seed_name, on
  branch claude/c4-frozen; tested with run 38257189156).
- Dated estimates (SAST, 13 Oct 05:15): 2040 85.11, 37.37, 9.63, 7.84, 7.27, 6.36, 5.69 GWh against 2.60 after
  passes 1-7 (cuts 56%, 74%, 19%, 7%, 12%, 11%); pass times 5, 25, 78, 112, 118, 138, ~128, 186 min. At about 10% a
  pass it does not reach target by the 14-pass cap. Six more passes at about 3 hours: chain ends about 13 Oct 23:00
  (range 21:00-02:00), still failing 2039-40 on its own test; the seeded set then takes about 4-6 hours. Penalty c4's
  plan passes the engine check in every year (2040 1.17/2.60). Open question to Nick (12 Oct 23:45): run to the cap
  (default), stop at a chosen pass, or seed the set from the windows so far.

- c4-target's stress loop (its own test, worst year, mean shed / target in GWh): pass 1 2038 85.11/2.48 (11 years
  failing); pass 2 2040 37.37/2.61 (5); pass 3 2040 9.63/2.60 (2: 2039, 2040); pass 4 2040 7.84/2.60 (2: 2039 4.59/2.54, 2040);
  pass 5 2040 7.27/2.60 (2: 2039 3.71/2.54, 2040);
  pass 6 2040 6.36/2.60 (2: 2039 3.27/2.54, 2040); pass 7 2040 5.69/2.60 (2: 2039 3.13/2.54, 2040; only 2 new windows
  added, against 6 before). Each job tests the previous pass's plan, then solves the next, so
  pass N's figure is in pass N+1's saved state. The windows each pass added (weather year, days) are printed by the
  print job (run 38340311636 for passes 1-7; the windows added after pass 5 carried 1.1-4.9 GWh of shed each, after
  pass 6 0.16-1.27 GWh). The loop stops when no year fails (half the standard) or at 14 passes (MAXP).
- Reading results: artifacts cannot be downloaded here; use the print-only workflow on branch claude/print-results
  (TODO 14cs): dispatch optimiser-long-run.yml on that ref with name, source_run, source_name. For the IRP note, run it
  on c4-target's final run and on each seeded run's final run.
- Inputs checked 12 Oct (user): combined-cycle capex flat real at 86bfea4 (SOURCES); coal schedule against IRP 2025
  in TODO 14cr. IRP coal-timing run s_coalirp: rebuilt 12 Oct on branch claude/c4-coalirp (66819c2; the
  first build, a hybrid leaving 14.4 GW in 2040, was held by Nick). The dates now track IRP 2025's total coal path
  from the plan's text (Figure 3 could not be read here): 8 GW gone by the start of 2030, then 15 GW in 12 equal steps
  from 2031 to 2042, scaled to 39,692 MW; the four named stations in 2030, then the oldest units first (GEM start
  years). Coal standing 2030 31,978, 2034 27,018, 2040 19,661 MW (c4 30,296, 24,206, 20,848). Switch off, LP key
  e0b93ac712 (unchanged); on, d41c0ccb76, coal-capacity right-hand sides only. Back in the launch check-in: started
  with the set, alongside it, on ref claude/c4-coalirp, seed_run = c4t's final run, seed_name c4t, settings c4t's
  plus WIN_FROM=seed/out/pathway_c4t_lp2040.json COAL_DATES=coal_dates_irp2025.json (TODO 14cr has the table). c4's
  Tutuka, Kriel and Arnot dates are unsourced PyPSA-RSA dates (SOURCES fleet row).

## Seeded set (TODO 14co): 12 runs, start in parallel as soon as c4-target's chain finishes

Dispatch each on ref `claude/c4-frozen` (app and harness identical to 86bfea4; only the workflow differs) with
inputs: name, settings, passes_per_job 1, max_jobs 30, prev_run empty, job_no 1, seed_run = the run id of c4-target's
final job, seed_name c4t. Settings = c4-target's, plus `WIN_FROM=seed/out/pathway_c4t_lp2040.json`, with one change
(a setting named in the change replaces the base's, e.g. LI_CAP, OCGD):

```
s_disc10         DISC=0.10
s_disc113        DISC=0.113
s_gasprem        GAS_PREM=0.015
s_committed      GAS_MIN=2030-2033:1200,2034:200 LI_MIN=2030:4600:18400
s_wind35         WIND_CAP=3500                     (wind limit 3,500 MW a year from 2028 (front-loaded); not a headline run)
s_li8h           LI_EH=8
s_nogas3         GAS_CAP=0                         (no new CCGT or OCGT on LNG; new diesel open-cycle allowed)
s_nogas4         GAS_CAP=0 LI_CAP=4000
s_nogas4strict   GAS_CAP=0 OCGD=0 LI_CAP=4000      (no new gas and no new diesel open-cycle)
s_be4            GASFLOOR=1
s_be6            LI_CAP=550 CAP_FROM=2026
s_be7            NUC_FORCE=2036:1250,2037:1250,2038:1350,2039:1350
```

No-gas decision (user, 12 Oct): the two main runs as above (3 and 4 GW of lithium a year), plus the strict run (existing
peakers stay as in c4; OCGD=0 stops only new diesel open-cycle). In all three report by year: new diesel open-cycle GW
(pathway output, ocgd), diesel burnt in TWh, existing and new (engine check; one fleet in the engine, so any split is
by capacity share and labelled an estimate), shed against target on customer demand, cost (R bn, 2026 present value
at 8% real, engine-checked) and CO2. A run added after the set has started goes in when a slot frees up; nothing
running is restarted or changed. Nick asked to be told, once the set is running, that it is a good moment to start a new session; before
saying so, cancel this session's pending check-ins (delete_trigger) so two sessions do not both act.

## After the set

c4 report against c3 (method test, standard table, three cost lines, lithium value split, shed by year on customer
demand), the #22 merge plan (TODO 14ck), the diesel open-cycle condition (14cj), then the IRP comparison draft
(14be steps, in the 14bd format). Then the profile test: keep the current profiles for c4 and the set; the plain open
profile halves c3's shed (RESULTS, demand-shape sensitivity), so test the open shape quantile-mapped to the measured
load-duration curve and propose the public swap only if it reproduces c3's shed within about 10% (14bz). The coal
preset option (a) and the coal trace's removal from the public repository go with that swap.

## Parked until the comparison is drafted

14bw (the ERA5 download stopped at 28 Feb 2026; files from March are NetCDF4, 14cp), the preset re-search and the
+5% marks (14ay; inventory in RESULTS), Playwright render checks, EarthPV (14cl), new storage classes (14cm), exports
(14by), panels and dashboards, Cloudflare build failures (14cq; the licence lines are live).

## Open decisions and waiting on Nick

- #26 (.mcp.json to main): Nick merges when convenient.
- Eskom's written consent (requested; terms in CLAUDE.md). The weekly Eskom job in gridtwin-data stays disabled.
- Later, with the parked preset work: whether IRP path 2035 keeps +5% or moves to the central path.

## Git and suite

- claude/build-costs is PR #22 (draft, base claude/peakers). Worktree /home/user/gtza-08d is a detached HEAD; push
  with `git push origin HEAD:claude/build-costs`. claude/c4-frozen (worktree /home/user/gtza-c4f) holds the frozen
  code for the set. Never push to main; Nick merges. Commit trailer per CLAUDE.md and the session reminder.
- Suite at build 2026-10-12e (no app change since): 808/812 with ESK19679.csv, 804/809 without; eng5 6/6.
  validate_docs.py (not in the counted suite): 13/20, seven failures that predate 12 Oct.
- Check-ins are send_later triggers bound to the session that booked them; a new session books its own.

---

# GridTwin ZA - handover, 2 October 2026

Build `2026-10-02a`. Suite 802/803 plus eng5 6/6, measured 2 Oct 2026 with `profiles.json` at
the root. The one failure is EDMSA Scenario A CO2 2035 (90.8 against 124 Mt), known and standing.

This top section is complete on its own: read RULES.md in full, then this section, then TODO.md,
then stop and run the suite before changing anything. TODO.md holds the full running to-do list
(124 items on 2 Oct); keep it current and reprint it at the end of each message. Everything below the line "Older handover material" is
kept for its reasoning and is superseded wherever it disagrees with this section.

---

## 7 October 2026: decisions in play (read before section 1, which is from 2 Oct)

Build `2026-10-07s` on PR #22 (claude/build-costs, held). Decisions, all the user's, 7 Oct:

- Central costs need local bid or project data plus an international benchmark (RULES, SOURCES). IRP 2025 cost
  assumptions are a sensitivity only ("the IRP's own assumptions"), never central. CCGT stays at GridLab R34,965/kW.
- Wind, option (c): central R28,463/kW (BW6 compliant); high R30,060 (investment values); low IRENA global. New wind
  on a modern-turbine profile (V162 at 120 m); existing farms keep theirs; capex and profile change together.
- The correction for new wind comes from the farm check, not the fleet's 1.0753: 1.064 central, 1.00 low (07s).
  Re-check against measured output (TODO 14bf). Six suite results moved by the profile await a decision (TODO 14bg).
- Lithium: central BW3 aged to January 2026 (R13,699/kW at 4 h); high BW3 as bid; low R2,026/kWh.
- Solar tracking: an option (bldPvTracking), not default until reported.
- #22 is held until Deep decarbonisation 2035 and Fossil-free 2040 are re-searched on the final costs, from two starts,
  with convergence reported (TODO 14ay). Until then their descriptions make no least-cost claim.
- Queued after the current runs: 14bd (IRP cost set against the final central costs) and 14be ("IRP world").
- Priority runs, in order: grid cost, IRP cost set (done on 07c), BW3 batteries, solar tracking, peakers.

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
IRP path 2035               22.2 onshore / 18.9 solar / 6.1 GW at 4h / 11.6 gas, 6 GW of it at a 51% floor (IRP 2025, 6 Oct 2026); coal -16 GW
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
  The April 2027 switch is conditional (user, 12 Oct 2026): it holds only if the wholesale market
  actually launches then. Re-date the label, and anything keyed to April 2027, to the actual launch date when it
  is announced; until then treat April 2027 as the planned date, not a fact.
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
- Every pathway comparison table carries a new-gas column: GW of new CCGT by 2030 and by 2040, read
  from newCcgtMW (user, 6 Oct 2026), while the 'no new gas' result is provisional.
- Share files before writing the report. The user has had to ask for files repeatedly; the share
  call goes first in any turn that produces one.

### 8. Running the suite

Unchanged; see MANIFEST.md. From the directory holding `index.html` and `nodal/`, the root-taking
harnesses take `.`; `validate_outputs`, `eng5` and `jsdom_local2` run from the parent.
New this session: `validate_structure` has 25 checks (the element-read check), `validate_findings`
39 (curtailment band), `validate_external` 8 (GreenCape build-pace check).

Baselines regenerated 6 Oct 2026 (build `2026-10-05j`): control_inventory.json and
response_matrix.json at the root predated 18 Sep and failed 7 checks. Regenerated with --write-baseline
after a full comparison; RESULTS has every difference and the cause of each of the seven flipped
response cells, four of them inferred because the builds are not in git. Regenerate again only after
the same comparison: a baseline reset without one hides exactly what these files exist to catch.
validate_structure also fails its build-stamp date check on any day after the stamp's date.

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
IRP path 2035               22.2 onshore / 18.9 solar / 6.1 GW at 4h / 11.6 gas, 6 GW of it at a 51% floor
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

Evidence for the fixed-cost half (user, 16 Oct 2026, message 147): Eskom Distribution's EEBI webinar deck (14 Oct 2026,
slide 3) puts about 70% of cost-to-serve on fixed or capacity drivers, and the generation capacity charge recovered about 1.4%
of generation costs in 2025/26. Cited and summarised under Eskom's terms (SOURCES 'Eskom Distribution, EEBI webinar deck').

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
