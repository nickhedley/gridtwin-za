"""
GridTwin ZA - Nodal-lite dispatch-with-flows engine (prototype)
Implements the design agreed with the user: national merit-order dispatch,
each generator serves its home region first, surplus routed via corridors
up to transfer limits, with loading-dependent transmission losses.
"""
import pandas as pd
import numpy as np
import json
import networkx as nx

REGIONS = ['Eastern Cape','Limpopo','Mpumalanga','Gauteng','Western Cape',
           'Northern Cape','Hydra Central','Kwazulu Natal','North West','Free State']

# --- Topology & transfer limits, rebuilt from PyPSA-RSA's real Existing_Lines.shp geometries ---
# Each real line segment mapped to its two supply regions (via the real rsa_supply_regions.gpkg
# 10-region GCCA boundaries), St-Clair single-line-derated per its own real length, then summed
# per corridor -> a genuine parallel-circuit-aware limit. Two corridors (Free State-KwaZulu Natal,
# North West-Western Cape) had no matching real lines in the incomplete shapefile and keep the
# original single-line handover estimate. Several corridors here didn't exist in the original
# 16-corridor topology at all (e.g. Limpopo-Mpumalanga) - the real network graph is richer.
CORRIDORS = [
    ('Eastern Cape','Hydra Central', 1124, 295),
    ('Eastern Cape','Free State', 455, 408),
    ('Eastern Cape','Kwazulu Natal', 813, 167),
    ('Free State','Gauteng', 1446, 202),
    ('Free State','Kwazulu Natal', 427, 450),
    ('Free State','Mpumalanga', 2609, 347),
    ('Gauteng','Limpopo', 4041, 271),
    ('Gauteng','Mpumalanga', 13318, 102),
    ('Gauteng','North West', 5680, 84),
    ('Hydra Central','Northern Cape', 754, 187),
    ('Hydra Central','Western Cape', 2377, 278),
    ('Kwazulu Natal','Mpumalanga', 6552, 172),
    ('Limpopo','North West', 5922, 212),
    ('Mpumalanga','North West', 599, 268),
    ('North West','Western Cape', 233, 1139),
    ('Northern Cape','Western Cape', 823, 164),
    ('Limpopo','Mpumalanga', 5138, 121),
    ('Free State','Hydra Central', 2763, 310),
    ('Free State','Northern Cape', 2439, 90),
    ('North West','Northern Cape', 663, 229),
    ('Free State','North West', 651, 235),
]

# Additional regions with new inter-region corridors mean some regions now connect
# that weren't directly linked before (e.g. Limpopo-Mpumalanga) - graph is richer/more accurate.
LOSS_BASE_RATE = 0.035  # 3.5% per 1000km at full rated flow (quadratic in loading)

def loss_fraction(length_km, flow_mw, limit_mw):
    if limit_mw <= 0:
        return 0.0
    loading = min(abs(flow_mw) / limit_mw, 1.0)
    return LOSS_BASE_RATE * (length_km / 1000.0) * (loading ** 2)


class NodalEngine:
    def __init__(self, demand_csv, profiles_json, fleet_csv, renewable_capacity_json):
        # --- Demand ---
        self.demand = pd.read_csv(demand_csv)
        self.demand_cols = {r: f"{r}_corrected" for r in REGIONS}

        # --- Renewable hourly capacity factor profiles ---
        prof = json.load(open(profiles_json))
        self.wind_pu = prof['wind_pu']
        self.solar_pu = prof['solar_pu']

        # --- Renewable installed capacity per region ---
        cap = json.load(open(renewable_capacity_json))
        self.wind_mw = cap['wind_mw']
        self.solar_mw = cap['solar_mw']

        # --- Thermal/hydro/nuclear fleet ---
        fleet = pd.read_csv(fleet_csv)
        fleet = fleet[fleet['Scenario'] == 'BASE'].copy()

        def marginal_cost(row):
            hr = pd.to_numeric(row['Heat Rate (GJ/MWh)'], errors='coerce')
            fp = pd.to_numeric(row['Fuel Price (R/GJ)'], errors='coerce')
            vom = pd.to_numeric(row['Variable O&M Cost (R/MWh)'], errors='coerce')
            hr = 0 if pd.isna(hr) else hr
            fp = 0 if pd.isna(fp) else fp
            vom = 0 if pd.isna(vom) else vom
            return hr * fp + vom

        fleet['marginal_cost'] = fleet.apply(marginal_cost, axis=1)
        self.fleet = fleet[['Power Station Name','region','Carrier','Capacity (MW)','marginal_cost']].reset_index(drop=True)

        # --- Network graph ---
        self.G = nx.Graph()
        self.G.add_nodes_from(REGIONS)
        for a, b, limit, length in CORRIDORS:
            self.G.add_edge(a, b, limit=limit, length=length)

    def build_generators(self, hour_idx):
        """Returns a list of dicts: name, region, carrier, cost, available_mw, is_renewable"""
        gens = []
        for _, row in self.fleet.iterrows():
            gens.append(dict(name=row['Power Station Name'], region=row['region'],
                              carrier=row['Carrier'], cost=row['marginal_cost'],
                              available_mw=row['Capacity (MW)'], is_renewable=False))
        for r in REGIONS:
            w_mw = self.wind_mw.get(r, 0)
            if w_mw > 0:
                cf = self.wind_pu[r][hour_idx]
                gens.append(dict(name=f'{r} Wind', region=r, carrier='wind', cost=0.0,
                                  available_mw=w_mw * cf, is_renewable=True))
            s_mw = self.solar_mw.get(r, 0)
            if s_mw > 0:
                cf = self.solar_pu[r][hour_idx]
                gens.append(dict(name=f'{r} Solar', region=r, carrier='solar', cost=0.0,
                                  available_mw=s_mw * cf, is_renewable=True))
        gens.sort(key=lambda g: g['cost'])
        return gens

    def dispatch_hour(self, hour_idx):
        demand = {r: float(self.demand.loc[hour_idx, self.demand_cols[r]]) for r in REGIONS}
        remaining_deficit = dict(demand)
        headroom = {(a, b): self.G[a][b]['limit'] for a, b in self.G.edges()}

        gens = self.build_generators(hour_idx)

        gen_log = []       # per-generator dispatch record
        flow_log = []      # per-corridor-usage record
        total_losses = 0.0
        total_curtailed = 0.0

        def edge_key(a, b):
            return (a, b) if (a, b) in headroom else (b, a)

        for gen in gens:
            avail = gen['available_mw']
            if avail <= 1e-9:
                continue
            home = gen['region']

            # 1. serve home region first
            local_take = min(avail, max(remaining_deficit[home], 0))
            remaining_deficit[home] -= local_take
            avail -= local_take
            home_take_record = local_take

            export_record = []
            # 2. route surplus to other deficit regions, nearest (shortest path) first,
            #    only considering paths where every edge still has headroom.
            while avail > 1e-6:
                H = nx.Graph()
                H.add_nodes_from(REGIONS)
                for (a, b) in self.G.edges():
                    if headroom[edge_key(a, b)] > 1e-6:
                        H.add_edge(a, b, length=self.G[a][b]['length'])

                deficit_regions = [r for r in REGIONS if remaining_deficit[r] > 1e-6 and r != home
                                    and nx.has_path(H, home, r)]
                if not deficit_regions:
                    break
                deficit_regions.sort(key=lambda r: nx.shortest_path_length(H, home, r, weight='length'))
                target = deficit_regions[0]
                path = nx.shortest_path(H, home, target, weight='length')
                edges = list(zip(path[:-1], path[1:]))

                bottleneck = min(headroom[edge_key(a, b)] for a, b in edges)
                sent = min(avail, remaining_deficit[target], bottleneck)
                if sent <= 1e-9:
                    break

                total_loss_frac = 0.0
                for (a, b) in edges:
                    length = self.G[a][b]['length']
                    limit = self.G[a][b]['limit']
                    lf = loss_fraction(length, sent, limit)
                    total_loss_frac = 1 - (1 - total_loss_frac) * (1 - lf)
                delivered = sent * (1 - total_loss_frac)
                loss_mw = sent - delivered

                remaining_deficit[target] -= delivered
                avail -= sent
                total_losses += loss_mw
                for (a, b) in edges:
                    headroom[edge_key(a, b)] -= sent
                    flow_log.append(dict(hour=hour_idx, edge=f"{a}-{b}", sent_mw=sent,
                                          via_generator=gen['name']))
                export_record.append(dict(target=target, sent=sent, delivered=delivered, path=path))

            # anything still left is curtailment (renewables) or simply undispatched (thermal)
            if avail > 1e-6 and gen['is_renewable']:
                total_curtailed += avail

            gen_log.append(dict(hour=hour_idx, name=gen['name'], region=home, carrier=gen['carrier'],
                                 cost=gen['cost'], home_take=home_take_record,
                                 exports=export_record, curtailed=avail if gen['is_renewable'] else 0))

        unserved = {r: max(remaining_deficit[r], 0) for r in REGIONS}
        return dict(hour=hour_idx, demand=demand, unserved=unserved,
                     total_losses=total_losses, total_curtailed=total_curtailed,
                     gen_log=gen_log, flow_log=flow_log)
