# c6 central's pathway settings (build 2026-10-25a, runs of 25-26 Oct 2026; RESULTS 'c6 under NTCSA's 20 GWh test'), sourced by
# the scripts that rerun c6 or a sensitivity on it (s_gascommit.sh). From harness/: source pathway/env_c6.sh
# c5f's settings (rooftop 1,200 MW a year from 2027, s_constr2's floors as committed minimums) on PR C's coal rules, planned to
# NTCSA's medium-term adequacy test, mean unserved energy at most 20 GWh a year (STD=ntcsa; user decision, 25 Oct 2026, message 373).
export COMMIT=1 PSE=1 DEMAND=irp_esrg LI_CAP=3000 OCGT=1 OCGD=1 GAS_CASE=central GAS_FOM_ADD=530.5 STRESS_TARGET=1 GRID=1 ROOF_MW=1200 COAL_AVAIL=1 PVTRK=1 COAL_DATES=coal_dates_irp2025.json BATT_DECL=0.03 WIND_CAP=3500 WIND_CAP_FROM=2031 MAXP=6 STALL=0.1 STALL_FROM=4 DEM_BLOCK=2027:930 IMP_AVG_MW=1066 CAPE_WIND=1580:4 RP_EXCL=wind MIN_BUILD=wind:2026:1131,wind:2027:2245.5,pv:2026:1018,pv:2027:2276,pv:2028:3405 LI_MIN=2026:360:1440,2027:760.5:3059,2028:760.5:3719 SOLVER=native
export STD=ntcsa
# The loop's verdict on its own draws (user, 5 Nov 2026, message 713 (b); messages 704 (d), 711): every year at 2 draws, topped up to 10
# at 5 GWh (a quarter of the 20 GWh limit) and to 20 at 10 GWh; the LP's stress-target draws stay at DRAWS (the key does not move).
# The final gate (pathcheck at adaptive draws) stays on every run regardless.
export VERDICT_TOPUP='{"start":2,"steps":[10,20],"frac":[0.25,0.5]}'
unset TF   # STD sets the standard; STD and TF are exclusive (pathway_perfail.js)
