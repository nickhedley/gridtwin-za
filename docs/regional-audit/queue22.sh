#!/bin/bash
# Twenty-second queue (6 Nov 2026, message 753 (c)): fixed-build curtailment and unserved energy on the report's corridor limits (DBSA 2025, Annexure B
# Table 45, lower of loadability and PV transfer): its 2025 limits as today's corridors and its 2035 limits as a stand-in for the TDP's lines, 2035 and
# 2040, weather 2025, hourly, no commitment floor, beside the rebuilt table's cases of queue14. Runs after the 7 Nov reports' solvers. Resumable.
S=/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad; R=$S/sc/run_net.sh; W=$S/wt-05f; P=engine_final
export CAP_AS_IS=1
echo "queue22 pid $$ start $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
for y in 2035 2040; do
  CORR_FILE=$S/corridors_dbsa_2025.json SUFFIX=_dbsa2025 bash $R $W $P "$y 2025 nm1 reea 0 0"
  CORR_FILE=$S/corridors_dbsa_2035.json SUFFIX=_dbsa2035 bash $R $W $P "$y 2025 nm1 reea 0 0"
done
echo "queue22 done $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
