#!/bin/bash
# Fifteenth queue (6 Nov 2026, message 738 (d)): the control and the 727 (a) split on the run's own accounting: the connection reuse pool (new solar
# up to the run's pool without the integration charge), the Cape wind allowance (1,580 MW of Western Cape wind without it), the integration charge
# on new open cycle; no limits, so no corridors. 3-hour blocks, weather 2025, 2035 and 2040. The test's-accounting cases are queue10a's. Resumable.
S=/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad; R=$S/sc/run_net.sh; W=$S/wt-05f; P=engine_final
export HSTEP=3 MIX=1 MIX_INTEG=1 GAS_INTEG=1 WIND_CAPE_MW=1580
echo "queue15 pid $$ start $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
for y in 2035 2040; do
  POOL=14306; [ $y = 2040 ] && POOL=22333; RW=27246; [ $y = 2040 ] && RW=40722
  SUFFIX=_mix_control_runacct_h3 PV_CREDIT_MW=$POOL bash $R $W $P "$y 2025 nolimit reea 0 1"
  SUFFIX=_mix_control_runacct_nopool_h3 bash $R $W $P "$y 2025 nolimit reea 0 1"   # (732 on the repriced costs) the same accounting without the reuse pool
  SUFFIX=_mix_control_nocap_runacct_h3 PV_CREDIT_MW=$POOL MIX_NOCAP=1 bash $R $W $P "$y 2025 nolimit reea 0 1"
  SUFFIX=_mix_control_onebus_runacct_h3 PV_CREDIT_MW=$POOL MIX_NAT=1 MIX_NOCAP=1 bash $R $W $P "$y 2025 nolimit reea 0 1"
  SUFFIX=_mix_control_runwind_runacct_h3 PV_CREDIT_MW=$POOL MIX_MIN=wind:$RW bash $R $W $P "$y 2025 nolimit reea 0 1"
done
echo "queue15 done $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
