#!/bin/bash
# 731: run a corridor-budget case only when its budget is below the unconstrained expansion's annual cost; otherwise the unconstrained case is the
# answer and the summariser reads it. usage: run_budget.sh <unconstrained json> <budget R/yr> <run_net.sh args...>  (SUFFIX, TX_EXT, TX_BUDGET etc. in env)
S=/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad; U=$1; B=$2; shift 2
if [ -s "$U" ]; then
  full=$($S/pyenv/bin/python -c "import json,sys; print(json.load(open(sys.argv[1]))['expansionTotal']['annualRbn']*1e9)" "$U")
  if [ "$(echo "$B >= $full" | bc -l)" = "1" ]; then echo "skip budget R$B >= unconstrained R$full for $SUFFIX $*" >> $S/run_net_progress.txt; exit 0; fi
fi
TX_BUDGET=$B bash $S/sc/run_net.sh "$@"
