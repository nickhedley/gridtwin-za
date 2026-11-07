#!/bin/bash
# 782: watch claude/c7-runs for the main session's record of the 8 Nov key's final build. Fetches every 15 minutes for up to 110 minutes; exits when a
# new commit on the branch touches RESULTS.md and adds or changes a file under harness/pathway/final/, or when the window ends (relaunch then).
S=/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad; cd /home/user/gridtwin-za
base=$(cat $S/watch_c7_base.txt 2>/dev/null || git rev-parse origin/claude/c7-runs); echo "$base" > $S/watch_c7_base.txt
echo "watch_c7 pid $$ start $(date -u +%FT%H:%MZ) base $base" >> $S/run_net_progress.txt
for i in $(seq 1 7); do
  git fetch -q origin claude/c7-runs 2>/dev/null; head=$(git rev-parse origin/claude/c7-runs)
  if [ "$head" != "$base" ]; then
    files=$(git diff --name-only $base $head); echo "watch_c7: new commits $(git log --oneline $base..$head | wc -l); files: $(echo "$files" | tr '\n' ' ' | cut -c1-300)" >> $S/run_net_progress.txt
    if echo "$files" | grep -q "^harness/pathway/final/" && echo "$files" | grep -q "^RESULTS.md"; then echo "watch_c7: final/ and RESULTS changed at $head $(date -u +%H:%MZ)" >> $S/run_net_progress.txt; echo "$head" > $S/watch_c7_hit.txt; exit 0; fi
    base=$head; echo "$base" > $S/watch_c7_base.txt
  fi
  sleep 900
done
echo "watch_c7 window ended $(date -u +%FT%H:%MZ), no final-build record yet" >> $S/run_net_progress.txt
