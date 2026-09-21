"""
GridTwin ZA - Interactive capacity siting: "where should new wind/solar go?"

Given a region + technology + MW the user wants to deploy, this:
1. Finds the REAL hosting headroom of that region under today's network
   (by incrementally adding capacity to the dispatch engine and watching
   for curtailment to start biting).
2. If the requested MW exceeds headroom, sizes and prices the additional
   transmission capacity needed on the binding corridor, using the same
   St Clair method as the rest of the model, and a real (blended, national-
   average) transmission cost figure: ~R31m/km, sourced from the Minister of
   Electricity and Energy's April 2025 statement (R440bn / ~14,000km TDP).
"""
import pandas as pd
import numpy as np
from nodal_engine import NodalEngine, REGIONS, loss_fraction

LINE_COST_PER_KM = 31_000_000   # R, blended national average across voltage classes (source: DEE Minister, Apr 2025)
LINE_LIFETIME_YEARS = 45        # typical EHV asset life assumption
HOURS_PER_YEAR = 8760
CURTAILMENT_THRESHOLD = 0.02    # 2% of the marginal capacity's energy - headroom ceiling test


class CapacitySitingTool:
    def __init__(self, engine: NodalEngine, day_start_hour: int):
        self.eng = engine
        self.day_start = day_start_hour  # representative 24h window to test against

    def _run_day_with_addon(self, region, tech, extra_mw):
        """Temporarily bump a region's installed capacity and re-run the 24h dispatch,
        returning total curtailment (MW-hours) attributable to that region+tech."""
        cap_dict = self.eng.wind_mw if tech == 'wind' else self.eng.solar_mw
        original = cap_dict.get(region, 0)
        cap_dict[region] = original + extra_mw
        try:
            total_curtailed_from_target = 0.0
            for h in range(self.day_start, self.day_start + 24):
                result = self.eng.dispatch_hour(h)
                for g in result['gen_log']:
                    if g['region'] == region and g['carrier'] == tech:
                        total_curtailed_from_target += g['curtailed']
        finally:
            cap_dict[region] = original  # always restore, even if something goes wrong
        return total_curtailed_from_target

    def find_headroom(self, region, tech, max_search_mw=3000, step_mw=100):
        """Ramp up capacity in `region` for `tech` until curtailment crosses the
        threshold. Returns the last MW level that stayed under threshold (the
        real, network-derived hosting headroom)."""
        last_good = 0
        for test_mw in np.arange(step_mw, max_search_mw + step_mw, step_mw):
            curtailed_mwh = self._run_day_with_addon(region, tech, test_mw)
            # approximate representative capacity factor for this region/tech to turn
            # curtailed-MWh-over-the-day into a share of that increment's own energy
            cf_profile = self.eng.wind_pu[region] if tech == 'wind' else self.eng.solar_pu[region]
            day_cf_avg = np.mean(cf_profile[self.day_start:self.day_start + 24])
            expected_energy_mwh = test_mw * day_cf_avg * 24
            curtail_share = curtailed_mwh / expected_energy_mwh if expected_energy_mwh > 0 else 0
            if curtail_share > CURTAILMENT_THRESHOLD:
                return last_good
            last_good = test_mw
        return last_good  # never hit the threshold within search range

    def binding_corridor(self, region, tech, test_mw):
        """At a capacity level known to cause curtailment, find which corridor(s)
        leaving `region` are most saturated -> the one that needs reinforcing."""
        cap_dict = self.eng.wind_mw if tech == 'wind' else self.eng.solar_mw
        original = cap_dict.get(region, 0)
        cap_dict[region] = original + test_mw
        try:
            saturation = {}  # edge -> (times_full, total_sent)
            for h in range(self.day_start, self.day_start + 24):
                result = self.eng.dispatch_hour(h)
                flows = pd.DataFrame(result['flow_log'])
                if len(flows) == 0:
                    continue
                touching = flows[flows['edge'].str.contains(region)]
                for edge, grp in touching.groupby('edge'):
                    saturation.setdefault(edge, 0)
                    saturation[edge] += grp['sent_mw'].sum()
        finally:
            cap_dict[region] = original
        if not saturation:
            return None
        return max(saturation, key=saturation.get)

    def deploy(self, region, tech, requested_mw, max_search_mw=8000, step_mw=250):
        headroom = self.find_headroom(region, tech, max_search_mw=max_search_mw, step_mw=step_mw)
        result = dict(region=region, tech=tech, requested_mw=requested_mw, headroom_mw=headroom)

        if requested_mw <= headroom:
            result['grid_build_needed'] = False
            result['shortfall_mw'] = 0
            result['grid_build_charge_R_per_MWh'] = 0
            result['note'] = f"Fits within existing grid headroom ({headroom:.0f} MW available) - no new transmission needed."
            return result

        shortfall_mw = requested_mw - headroom
        edge = self.binding_corridor(region, tech, requested_mw)
        result['grid_build_needed'] = True
        result['shortfall_mw'] = shortfall_mw
        result['binding_corridor'] = edge

        if edge is None:
            result['note'] = "Could not identify a single binding corridor (shortfall may route via multiple paths) - grid-build charge is approximate."
            length_km = 300  # generic fallback assumption, flagged
        else:
            a, b = edge.split('-')
            match = [c for c in self.eng.G.edges(data=True) if {c[0], c[1]} == {a, b}]
            length_km = match[0][2]['length'] if match else 300

        # cost of a new line sized to carry (at least) the shortfall, same corridor length
        capex = length_km * LINE_COST_PER_KM
        annual_capex = capex / LINE_LIFETIME_YEARS

        cf_profile = self.eng.wind_pu[region] if tech == 'wind' else self.eng.solar_pu[region]
        annual_cf = np.mean(cf_profile)
        annual_energy_mwh = shortfall_mw * annual_cf * HOURS_PER_YEAR

        grid_charge_per_mwh = annual_capex / annual_energy_mwh if annual_energy_mwh > 0 else float('nan')

        result['binding_corridor_length_km'] = round(length_km)
        result['new_line_capex_R'] = round(capex)
        result['annualised_capex_R_per_year'] = round(annual_capex)
        result['grid_build_charge_R_per_MWh'] = round(grid_charge_per_mwh, 1)
        result['note'] = (f"{shortfall_mw:.0f} MW exceeds headroom on {edge or 'the export path'}. "
                           f"Reinforcing that corridor (~{length_km:.0f} km) costs an estimated "
                           f"R{capex/1e6:.0f}m, adding R{grid_charge_per_mwh:.0f}/MWh to the "
                           f"shortfall portion's generation cost.")
        return result
