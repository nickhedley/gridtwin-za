# The 8 Nov key (message 761): code and how to rebuild it

The key's settings (761 (a)): reference metered 2025; f3d (finding 3's solar factors on the representative days, band 0.80-1.25);
battery proposals 1-3 (enrolled power E / 3 with 20% kept; R500 a year per kW of enrolled power, wear kept; the non-enrolled reserve
43.2% in 2026 to 31.8% by 2030, held after, the 2026 stock at its 2026 reserve); new wind at 40% (WIND_CORR=cf0.40); the freed-coal
pool capped at the same-area MW (0 / 658 / 1,290 MW in 2026 / 2035 / 2040, linear); one stage; the central's 13 extremes as frozen
(20, 159, 161-163, 187, 194-196, 218, 358-360); open-cycle capex at 0.74; c7's central settings otherwise (pathway/env_c6a.sh,
GAS_FIRST=2035, 25 clustered days, linking, CONG_OFF=1, WX_WINDCORR=1, the verdict rule).

None of this is on a branch yet: the changes live in two comparison worktrees and in these patches.
- key_on_10a98e2.patch: onto the fin basis 10a98e2 (gtza-key, where the central loop runs; 7 Nov 2026). With bldRepF3d 0,
  bldRpSameAreaCap 0, the four battery keys null and no WIND_CORR, it builds the fin basis's pass-1 LP byte for byte (key 48ffc38a70).
- key_on_twin-retime_2d86faa.patch: onto claude/twin-retime at 2d86faa (PR #161 with PR #162 merged), for the Deep and Fossil-free
  runs (Test 15). One conflict resolved by hand: pathcheck.js's per-run record line keeps both the gas record (gx) and the battery and
  deemed-energy fields. 06b does not change the central's LP (RESULTS 'The review of claude/twin-retime of 6 Nov').
Both patches have the key's switches on (FIXED: vppHours 3, vppReservePct 20, btmReservePath [[2026,43.2],[2030,31.8]],
vppCostRkWyr 500, bldRepF3d 1, bldRpSameAreaCap 1); new wind at 40% is the run's WIND_CORR=cf0.40.

Rebuild: git worktree add --detach <dir> <base>; git apply <patch>; link harness/node_modules and harness/testroot; run as
solve_key.sh (its case 'key': REP_REF=metered, the 13 extremes, WIND_CORR=cf0.40; the loop to its verdict; then pathcheck K=20).
The engine check must run on the same worktree (pathcheck reads the battery keys from the run's record and FIXED).
- highs_native_log.patch (user, 7 Nov 2026, message 780 (c)): one log line per solve, its starting basis, iterations and objective,
  printed to stderr and appended to HIGHS_LOG when set (the loop discards the wrapper's stderr, so pieces are launched with
  HIGHS_LOG=<the loop's log>). Installed in gtza-key, gtza-keynp and gtza-key342 at 09:08 UTC, kw42's piece boundary. Short test on a
  5.6 MB single-year LP: LP sha1 unchanged, output and saved basis byte-identical to the old wrapper's, objective equal. To go into the
  final commit with the key's patches (768 (c)).
