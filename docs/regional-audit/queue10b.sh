#!/bin/bash
# Tenth queue, runner B (6 Nov 2026, message 727 (a)): the control's gap split, weather 2015: area caps lifted; one bus on the national series; wind forced to the run's MW. 3-hour blocks. Resumable.
S=/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad; R=$S/sc/run_net.sh; W=$S/wt-05f; P=engine_final
export HSTEP=3
echo "queue10b pid $$ start $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
SUFFIX=_mix_control_nocap_h3 MIX=1 MIX_INTEG=1 MIX_NOCAP=1 bash $R $W $P "2035 2015 nolimit reea 0 1"
SUFFIX=_mix_control_onebus_h3 MIX=1 MIX_INTEG=1 MIX_NAT=1 MIX_NOCAP=1 bash $R $W $P "2035 2015 nolimit reea 0 1"
SUFFIX=_mix_control_runwind_h3 MIX=1 MIX_INTEG=1 MIX_MIN=wind:27246 bash $R $W $P "2035 2015 nolimit reea 0 1"
SUFFIX=_mix_control_nocap_h3 MIX=1 MIX_INTEG=1 MIX_NOCAP=1 bash $R $W $P "2040 2015 nolimit reea 0 1"
SUFFIX=_mix_control_onebus_h3 MIX=1 MIX_INTEG=1 MIX_NAT=1 MIX_NOCAP=1 bash $R $W $P "2040 2015 nolimit reea 0 1"
SUFFIX=_mix_control_runwind_h3 MIX=1 MIX_INTEG=1 MIX_MIN=wind:40722 bash $R $W $P "2040 2015 nolimit reea 0 1"
echo "queue10b done $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
