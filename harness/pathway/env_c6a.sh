# c6a central's pathway settings (user, 26 Oct 2026, messages 389 and 391): c6's settings (env_c6.sh) with two changes.
# 1. New gas-fired power (CCGT and open-cycle on LNG) from 2032 at the earliest (GAS_FIRST=2032; IGUA-SA's Gas Roadmap, October
#    2026: LNG import terminals unlikely before 2031; SOURCES 'Context for the pack, 26 Oct 2026'). Diesel open-cycle unaffected.
# 2. The 2026 fleet counted for its share of the year in service, from known commissioning dates (RESULTS 'c6's 2026 fleet, plant
#    by plant'): the 2026 committed floors at the MW-equivalent in service in 2026 (wind 1,131 -> 287, solar 1,018 -> 156), the rest
#    in 2027, whose cumulative floors are unchanged; the existing fleet less 187 MW of wind and 115 MW of solar in 2026 only
#    (FLEET_2026). Later years run every plant all year: an assumption, flagged in RESULTS.
# From harness/: source pathway/env_c6a.sh
source "$(dirname "${BASH_SOURCE[0]}")/env_c6.sh"
export GAS_FIRST=2032 FLEET_2026=windMW:-187,pvUtilityMW:-115
export MIN_BUILD=wind:2026:287,wind:2027:2245.5,pv:2026:156,pv:2027:2276,pv:2028:3405
