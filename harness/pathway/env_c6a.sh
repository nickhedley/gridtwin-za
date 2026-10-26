# c6a central's pathway settings (user, 26 Oct 2026, messages 389 and 391): c6's settings (env_c6.sh) with two changes.
# 1. New gas-fired power (CCGT and open-cycle on LNG) from 2032 at the earliest (GAS_FIRST=2032; IGUA-SA's Gas Roadmap, October
#    2026: LNG import terminals unlikely before 2031; SOURCES 'Context for the pack, 26 Oct 2026'). Diesel open-cycle unaffected.
# 2. The 2026 fleet counted for its share of the year in service, from known commissioning dates (RESULTS 'c6's 2026 fleet, plant
#    by plant'): the 2026 committed floors at the MW-equivalent in service in 2026 (wind 1,131 -> 287, solar 1,018 -> 156), the rest
#    in 2027, whose cumulative floors are unchanged; the existing fleet less 187 MW of wind, 115 MW of solar and 41 MW of RMIPPPP
#    hybrid (Hydra, 75 MW from 16 Jul 2026) in 2026 only (FLEET_2026). Later years run every plant all year: an assumption, flagged
#    in RESULTS.
# 3. Rooftop added back on the twelve-year mean solar in the build LP and engine check (ROOF12=1, pathway/roof12.js; messages
#    391 (b) and 392 (c)); the page keeps the add-back matched to its own 2025 profile.
# 4. Rooftop: 2026 at the year's mean on 2025's basis (FIXED.rooftopMW, from the rooftop PR), and from 2027 the trajectory starts at the
#    estimated end-2026 level (ROOF_FROM_END2026=1, nodal/rooftop_ntcsa_2026.json), then +1,200 MW a year (message 392 (b)).
# From harness/: source pathway/env_c6a.sh
source "$(dirname "${BASH_SOURCE[0]}")/env_c6.sh"
export GAS_FIRST=2032 FLEET_2026=windMW:-187,pvUtilityMW:-115,hybridMW:-41 ROOF12=1 ROOF_FROM_END2026=1
export MIN_BUILD=wind:2026:287,wind:2027:2245.5,pv:2026:156,pv:2027:2276,pv:2028:3405
# Without the rooftop PR's data file the 2027 step cannot be taken: switch it off and say so (message 392 (f)).
if [ ! -f "$(dirname "${BASH_SOURCE[0]}")/../../nodal/rooftop_ntcsa_2026.json" ]; then unset ROOF_FROM_END2026; echo "env_c6a: nodal/rooftop_ntcsa_2026.json absent, ROOF_FROM_END2026 off" >&2; fi
