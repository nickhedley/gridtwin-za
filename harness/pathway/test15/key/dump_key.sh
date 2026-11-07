#!/bin/bash
# Message 769: the 8 Nov key central's pass-1 LP written (DUMP_STOP=1, no solve) on a worktree, with the settings of claude/c7-runs'
# harness/pathway/final/key/solve_key.sh case 'key' read from that file (EXM, C7, BASE and the case's X lines; env_c6a.sh; GAS_FIRST=2035).
# Usage: dump_key.sh <name> <worktree>. Prints the LP key (sha1 of the LP text).
NM=${1:?}; WT=${2:?}; D=/tmp/claude-0/-home-user-gridtwin-za/89044349-14ce-5480-b08a-321dc7b30183/scratchpad/keycmp
SK=$(cd /home/user/gridtwin-za && git show origin/claude/c7-runs:harness/pathway/final/key/solve_key.sh)
eval "$(echo "$SK" | grep -E '^(EXM|C7|BASE)=')"
X=$(echo "$SK" | sed -n 's/^  key) *X="\(.*\)";;$/\1/p'); [ -n "$X" ] || { echo "no key case in solve_key.sh"; exit 2; }
cd $WT/harness || exit 2; source pathway/env_c6a.sh >/dev/null 2>&1; export GAS_FIRST=2035
echo "settings: $C7 $BASE $X" > $D/$NM.settings
eval "env $C7 $BASE $X SOLVER=native HIGHS_SOLVER=simplex DUMP=0 LPCACHE=$D/lpc_$NM OUT=$D/$NM.json DUMP_LP=$D/$NM DUMP_STOP=1 nice -n 5 node --max-old-space-size=12288 pathway/pathway_perfail.js" > $D/$NM.log 2>&1
echo "$NM rc=$? $(grep -m1 'dumped LP' $D/$NM.log) $(sha1sum $D/${NM}_pass1.lp | cut -c1-40)"
