# Test 13's settings on message 693's basis, shared by run_mga.sh and run_loop.sh: c7's (env_c6a.sh and the rest), REP_REF=metered with
# the 12 metered extremes, the six-constant wind table, congestion off, 25 clustered linked days, solve cache in out/mga2/lpc.
# MAXP, DUMP and the solver options are set by each script or its launch.
source "$(dirname "${BASH_SOURCE[0]}")/../env_c6a.sh"
export GAS_FIRST=2035 SS=inertia SS_FC=reservecoal COC=blended BTM_STOCK=8 VPP=1 GY=1 COAL_FUEL_ESC=3 COAL_FOM_ESC=1.1 COMPLY=compromise \
  COAL_CARBON_FLOOR=1 SOLVER=native
export REP_REF=metered REP_EXTREMES=20,161,162,163,187,188,194,195,196,214,218,358 WX_WINDCORR=1 \
  WX_WINDCORR_TABLE=pathway/wx/wind_corr_table_calm6.json CONG_OFF=1
export REP_WEIGHTS=clustered REP_DAYS=25 STORAGE_LINK=1 LPCACHE=out/mga2/lpc RESUME=1
