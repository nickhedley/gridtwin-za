#!/bin/bash
# 782: dump the 8 Nov key's central (not a final build) for the ten-area LP. usage: bash dump_key.sh <pathway JSON> <worktree at the key's build> <out prefix>
# The engine check's flags are the key loop's own (harness/pathway/final/key/solve_key.sh on claude/c7-runs: LNG=1 GRID=1 SS_FC=reservecoal CONG_OFF=1
# WX_WINDCORR=1), one seed (K=1, DUMP_K=0), weather 2025, years 2035 and 2040; then the 738 (b) case list and 762 (b)'s fixes on the table of record.
S=/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad; IN=${1:?pathway JSON}; W=${2:?worktree}; P=${3:?out prefix}
python3 $S/sc/make_pathcheck_dump.py $W $W/harness/pathcheck_dump.js || exit 1
[ -e $W/harness/testroot ] || ln -s .. $W/harness/testroot; [ -e $W/harness/node_modules ] || ln -s $S/wt-05f/harness/node_modules $W/harness/node_modules
echo "dump $P pid $$ start $(date -u +%FT%H:%MZ) from $IN in $W" >> $S/run_net_progress.txt
cd $W/harness && env -i PATH="$PATH" HOME="$HOME" LNG=1 GRID=1 SS_FC=reservecoal CONG_OFF=1 WX_WINDCORR=1 K=1 YEARS=2035,2040 IN=$IN OUTC=$S/pathcheck_${P}.json DUMP_WY=2025 DUMP_K=0 DUMP_PAGE=$S/sc/engine_dump_page.js DUMP_OUT=$S/$P node --max-old-space-size=4096 pathcheck_dump.js > $S/pathcheck_${P}.log 2>&1; rc=$?
rm -f $W/harness/pathcheck_dump.js
echo "dump $P done rc=$rc $(date -u +%FT%H:%MZ): $(ls $S/${P}_2035_wy2025.json $S/${P}_2040_wy2025.json 2>/dev/null | wc -l)/2 files" >> $S/run_net_progress.txt
[ $rc -eq 0 ] && bash $S/sc/queue_final_template.sh $P _${P#engine_}
