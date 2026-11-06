#!/bin/bash
# Follow-on to queue10b (6 Nov 2026, 727 (a) weather 2015, 2040): the one-bus case in 3-hour blocks did not finish in a two-hour window
# (6,830 s, still 59,000 primal infeasibilities), so: the wind-forced case first (3-hour blocks, as the rest of the table), then the whole
# 2040 weather-2015 split again in 6-hour blocks (control, caps lifted, one bus, wind forced; labelled h6, a consistent fallback), then one
# more attempt at the 3-hour one-bus case with whatever window is left. Resumable.
S=/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad; R=$S/sc/run_net.sh; W=$S/wt-05f; P=engine_final
export MIX=1 MIX_INTEG=1
echo "queue10c pid $$ start $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
HSTEP=3 SUFFIX=_mix_control_runwind_h3 MIX_MIN=wind:40722 bash $R $W $P "2040 2015 nolimit reea 0 1"
HSTEP=6 SUFFIX=_mix_control_h6 bash $R $W $P "2040 2015 nolimit reea 0 1"
HSTEP=6 SUFFIX=_mix_control_nocap_h6 MIX_NOCAP=1 bash $R $W $P "2040 2015 nolimit reea 0 1"
HSTEP=6 SUFFIX=_mix_control_onebus_h6 MIX_NAT=1 MIX_NOCAP=1 bash $R $W $P "2040 2015 nolimit reea 0 1"
HSTEP=6 SUFFIX=_mix_control_runwind_h6 MIX_MIN=wind:40722 bash $R $W $P "2040 2015 nolimit reea 0 1"
HSTEP=3 SUFFIX=_mix_control_onebus_h3 MIX_NAT=1 MIX_NOCAP=1 bash $R $W $P "2040 2015 nolimit reea 0 1"
echo "queue10c done $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
