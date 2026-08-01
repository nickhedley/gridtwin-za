"""
GridTwin ZA cross-validation against a real PyPSA network.

Honest framing: this does NOT run the actual PyPSA-RSA pipeline (that requires GIS data from
Google Drive / ntcsa.co.za that isn't accessible here, plus conda for geopandas/fiona/rasterio,
which isn't available in this environment either). What it DOES do: build a real pypsa.Network
object, using the exact same real data GridTwin ZA itself uses (same 10-region topology, same
corridor limits, same fleet costs, same demand, same renewable profiles), and solve it with a
real solver (HiGHS via linopy). That's a genuine, real optimization to compare our heuristic
against - just not literally "their repo," since that's not reachable from here.

Uses Link components for corridors (not Line/reactance-based power flow), matching GridTwin ZA's
own transport-style routing model - this keeps the comparison about DISPATCH LOGIC specifically,
not a different network physics representation.
"""
import pandas as pd
import numpy as np
import json
import pypsa

REGIONS = ['Eastern Cape','Limpopo','Mpumalanga','Gauteng','Western Cape',
           'Northern Cape','Hydra Central','Kwazulu Natal','North West','Free State']

CORRIDORS = [
  ['Eastern Cape','Hydra Central', 1124, 295],
  ['Eastern Cape','Free State', 455, 408],
  ['Eastern Cape','Kwazulu Natal', 813, 167],
  ['Free State','Gauteng', 1446, 202],
  ['Free State','Kwazulu Natal', 427, 450],
  ['Free State','Mpumalanga', 2609, 347],
  ['Gauteng','Limpopo', 4041, 271],
  ['Gauteng','Mpumalanga', 13318, 102],
  ['Gauteng','North West', 5680, 84],
  ['Hydra Central','Northern Cape', 754, 187],
  ['Hydra Central','Western Cape', 2377, 278],
  ['Kwazulu Natal','Mpumalanga', 6552, 172],
  ['Limpopo','North West', 5922, 212],
  ['Mpumalanga','North West', 599, 268],
  ['North West','Western Cape', 233, 1139],
  ['Northern Cape','Western Cape', 823, 164],
  ['Limpopo','Mpumalanga', 5138, 121],
  ['Free State','Hydra Central', 2763, 310],
  ['Free State','Northern Cape', 2439, 90],
  ['North West','Northern Cape', 663, 229],
  ['Free State','North West', 651, 235],
]

def build_topology_only():
    n = pypsa.Network()
    n.set_snapshots(range(3))  # placeholder, will be replaced
    for r in REGIONS:
        n.add('Bus', r, carrier='AC')
    for a, b, limit_mw, length_km in CORRIDORS:
        n.add('Link', f'{a} <-> {b}', bus0=a, bus1=b, p_nom=limit_mw, p_min_pu=-1, efficiency=1.0,
              carrier='corridor')
    return n

def load_real_data():
    demand_df = pd.read_csv('demand_2025_regional.csv')
    demand = {r: demand_df[f'{r}_corrected'].values for r in REGIONS}

    profiles = json.load(open('profiles_regional.json'))
    wind_pu = {r: np.array(profiles['wind_pu'][r]) for r in REGIONS}
    solar_pu = {r: np.array(profiles['solar_pu'][r]) for r in REGIONS}

    cap = json.load(open('regional_renewable_capacity.json'))
    rooftop_mw = json.load(open('rooftop_mw_by_region.json'))

    fleet_df = pd.read_csv('fleet_by_region_v2.csv')
    fleet_df = fleet_df[fleet_df['Scenario'] == 'BASE'].copy()
    for col in ['Heat Rate (GJ/MWh)', 'Fuel Price (R/GJ)', 'Variable O&M Cost (R/MWh)', 'Capacity (MW)',
                'Max Ramp Up (%/h)', 'Max Ramp Down (%/h)', 'Min Stable Level (%)',
                'Min Up Time (h)', 'Min Down Time (h)', 'Start Up Cost (R)']:
        fleet_df[col] = pd.to_numeric(fleet_df[col], errors='coerce').fillna(0)
    fleet_df['marginal_cost'] = fleet_df['Heat Rate (GJ/MWh)'] * fleet_df['Fuel Price (R/GJ)'] + fleet_df['Variable O&M Cost (R/MWh)']

    return demand, wind_pu, solar_pu, cap, rooftop_mw, fleet_df

def build_network(start_hour, n_hours, coal_eaf_pct=64, true_soc=None, unit_commitment=False):
    demand, wind_pu, solar_pu, cap, rooftop_mw, fleet_df = load_real_data()
    n = pypsa.Network()
    snapshots = pd.RangeIndex(n_hours)
    n.set_snapshots(snapshots)

    for r in REGIONS:
        n.add('Bus', r, carrier='AC')
    for a, b, limit_mw, length_km in CORRIDORS:
        n.add('Link', f'{a} <-> {b}', bus0=a, bus1=b, p_nom=limit_mw, p_min_pu=-1, efficiency=1.0, carrier='corridor')

    sl = slice(start_hour, start_hour + n_hours)

    # loads - real regional demand, net of real rooftop PV (same treatment as GridTwin ZA - rooftop
    # is a grid-facing demand reduction, not a dispatchable generator, to match exactly)
    for r in REGIONS:
        raw = demand[r][sl]
        rt_mw = rooftop_mw.get(r, 0)
        rooftop_gen = np.minimum(rt_mw * solar_pu[r][sl] * 0.94, raw * 0.9)
        net_demand = raw - rooftop_gen
        n.add('Load', f'{r} load', bus=r, p_set=net_demand)

    # thermal fleet - real units, real marginal costs, coal gets the same EAF derate GridTwin ZA uses
    carrier_costs_seen = set()
    for _, row in fleet_df.iterrows():
        region = row['region']
        if region not in REGIONS:
            continue
        carrier = row['Carrier']
        cap_mw = row['Capacity (MW)']
        if carrier == 'coal':
            cap_mw = cap_mw * coal_eaf_pct / 100
        gname = row['Power Station Name'] + '_' + str(row.name)
        if carrier == 'coal' and unit_commitment:
            # Real per-unit UC parameters straight from the fleet data (PyPSA-RSA sourced).
            # p_min_pu is the Min Stable Level: a synchronised unit cannot go below it.
            n.add('Generator', gname, bus=region, p_nom=cap_mw, marginal_cost=row['marginal_cost'],
                  carrier=carrier, committable=True,
                  p_min_pu=float(row['Min Stable Level (%)']),
                  ramp_limit_up=min(1.0, float(row['Max Ramp Up (%/h)'])),
                  ramp_limit_down=min(1.0, float(row['Max Ramp Down (%/h)'])),
                  min_up_time=int(row['Min Up Time (h)']),
                  min_down_time=int(row['Min Down Time (h)']),
                  start_up_cost=float(row['Start Up Cost (R)']))
        else:
            n.add('Generator', gname, bus=region, p_nom=cap_mw, marginal_cost=row['marginal_cost'], carrier=carrier)

    # wind/solar - real regional capacity, real hourly profiles as p_max_pu (allows curtailment)
    for r in REGIONS:
        w_mw = cap['wind_mw'].get(r, 0)
        s_mw = cap['solar_mw'].get(r, 0)
        if w_mw > 0:
            n.add('Generator', f'{r} wind', bus=r, p_nom=w_mw, marginal_cost=0,
                  p_max_pu=wind_pu[r][sl], carrier='wind')
        if s_mw > 0:
            n.add('Generator', f'{r} solar', bus=r, p_nom=s_mw, marginal_cost=0,
                  p_max_pu=solar_pu[r][sl], carrier='solar')

    # pumped storage - real sites (Ingula/Drakensberg in KZN, Palmiet in Western Cape)
    PS_MW_BY_REGION = {'Kwazulu Natal': 2332, 'Western Cape': 568}
    PS_ENERGY_MWH_BY_REGION = {'Kwazulu Natal': 60000 * (2332/2900), 'Western Cape': 60000 * (568/2900)}
    for r, mw in PS_MW_BY_REGION.items():
        soc0 = true_soc[r]['ps'] if true_soc else PS_ENERGY_MWH_BY_REGION[r]*0.7
        n.add('StorageUnit', f'{r} pumped storage', bus=r, p_nom=mw,
              max_hours=PS_ENERGY_MWH_BY_REGION[r]/mw, efficiency_store=0.76, efficiency_dispatch=1.0,
              cyclic_state_of_charge=False, state_of_charge_initial=soc0, carrier='pumped_storage')

    # batteries - flagged estimate split, same as GridTwin ZA (no complete public site list exists)
    BATT_SHARE_BY_REGION = {'Western Cape': 0.35, 'Eastern Cape': 0.25, 'Northern Cape': 0.20, 'Kwazulu Natal': 0.20}
    batt_total_mw = 800  # national baseline, matches single-node app's default
    for r, share in BATT_SHARE_BY_REGION.items():
        mw = batt_total_mw * share
        soc0 = true_soc[r]['batt'] if true_soc else mw*4*0.5
        n.add('StorageUnit', f'{r} battery', bus=r, p_nom=mw, max_hours=4,
              efficiency_store=0.88, efficiency_dispatch=1.0,
              cyclic_state_of_charge=False, state_of_charge_initial=soc0, carrier='battery')

    # CSP - real Northern Cape/Hydra Central plants, must-take (not curtailable), same synthetic
    # evening-shifted shape as GridTwin ZA (real historical CSP dispatch profiles aren't public)
    hours = np.arange(start_hour, start_hour + n_hours) % 24
    eve = np.where((hours >= 10) & (hours <= 22), np.exp(-((hours - 17)**2) / 18), 0)
    csp_profile = np.minimum(1, 0.6 * eve)
    CSP_MW_BY_REGION = {'Northern Cape': 450, 'Hydra Central': 50}
    for r, mw in CSP_MW_BY_REGION.items():
        n.add('Generator', f'{r} CSP', bus=r, p_nom=mw, marginal_cost=0,
              p_max_pu=csp_profile, p_min_pu=csp_profile, carrier='csp')

    # Cahora Bassa imports - fixed 0.85 CF must-take, entering via Gauteng, matches GridTwin ZA
    n.add('Generator', 'Cahora Bassa imports', bus='Gauteng', p_nom=1150, marginal_cost=550,
          p_max_pu=0.85, p_min_pu=0.85, carrier='imports')

    return n

if __name__ == '__main__':
    true_soc = {
        'Eastern Cape': {'ps': 0, 'batt': 108.86874997959437},
        'Limpopo': {'ps': 0, 'batt': 0},
        'Mpumalanga': {'ps': 0, 'batt': 0},
        'Gauteng': {'ps': 0, 'batt': 0},
        'Western Cape': {'ps': 345.34400000000005, 'batt': 887.0399991072829},
        'Northern Cape': {'ps': 0, 'batt': 142.40310556485392},
        'Hydra Central': {'ps': 0, 'batt': 0},
        'Kwazulu Natal': {'ps': 1417.8560000000002, 'batt': 86.95499986247275},
        'North West': {'ps': 0, 'batt': 0},
        'Free State': {'ps': 0, 'batt': 0},
    }
    n = build_network(start_hour=3264, n_hours=168, true_soc=true_soc)
    print('Buses:', len(n.buses))
    print('Links:', len(n.links))
    print('Generators:', len(n.generators))
    print('Storage units:', len(n.storage_units))
    print('Loads:', len(n.loads))

    # sanity check: does supply capacity even cover peak demand before we try to solve?
    total_load = sum(n.loads_t.p_set[c].sum() for c in n.loads_t.p_set.columns)
    print(f'\nTotal demand this week: {total_load/1e3:.1f} GWh')

    import time
    t0 = time.time()
    status, condition = n.optimize(solver_name='highs')
    print(f'\nSolve status: {status}, condition: {condition}, time: {time.time()-t0:.1f}s')

    if status == 'ok':
        print(f'Objective (total system cost, R): {n.objective/1e6:.2f} million')
        gen_by_carrier = n.generators_t.p.T.groupby(n.generators.carrier).sum().T.sum()
        print('\nGeneration by carrier (MWh):')
        print(gen_by_carrier.sort_values(ascending=False))
        storage_dispatch = n.storage_units_t.p.clip(lower=0).sum().sum()
        print(f'\nTotal storage discharge: {storage_dispatch:.0f} MWh')
