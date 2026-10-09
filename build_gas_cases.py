# Gas price cases for the pathways (TODO 14bo, user decisions 9 Oct 2026), recomputed from their inputs.
# Writes public_data/gas_price_cases.json: per case and year, the LNG price delivered at the South African coast
# (USD/MMBtu, January 2026 dollars), the fuel cost the model uses (R/MWh at 52% HHV, January 2026 rands, R16.50/USD,
# variable regasification added where the case carries the separate terminal charge), and how each was built.
# Usage: python3 build_gas_cases.py
# Every input below is quoted from a search extract (the source hosts are blocked here); see SOURCES.md, "Gas price
# cases". Shipping is the least-sourced input: a 2018 charter breakeven adjusted with US CPI and a waypoint distance
# estimate; charter rates have likely risen since the Hormuz disruption.
import json, os

YEARS = range(2026, 2041)
FX = 16.50                                  # R/USD, the model's pinned rate
MMBTU_PER_MWH = 1 / 0.293071                # MMBtu of fuel per MWh of fuel
EFF = 0.52                                  # CCGT efficiency (HHV), as costCcgt
GJ_PER_MMBTU = 1.055056
# BLS CPI-U, not seasonally adjusted, 1982-84 = 100
CPI = {'2018 avg': 251.107, '2024 avg': 313.689, 'Jan 2026': 325.252}
F24 = CPI['Jan 2026'] / CPI['2024 avg']    # 2024 dollars to January 2026 dollars
F18 = CPI['Jan 2026'] / CPI['2018 avg']    # 2018 dollars to January 2026 dollars
SA_CPI_JAN24_JAN26 = 1.032 * 1.035          # Stats SA CPI, January 2024 to January 2026
REGAS_USD = 0.25                            # variable regasification (fuel and boil-off), derived, SOURCES 14ak

def hh_2024usd(y):
    # EIA AEO2025 reference Henry Hub, real 2024 USD/MMBtu: 2.88 in 2025, 4.80 in 2050 (Today in Energy), linear
    return 2.88 + (4.80 - 2.88) * (y - 2025) / 25

def shipping(dist_nm, fob):
    # 165,000 m3 TFDE carrier loaded to 98.5%, 0.45 t/m3, 52 MMBtu/t, 17 knots, 3 days in port; boil-off 0.12%/day
    # laden, heel 0.09%/day ballast plus 36 hours; charter USD 60,000/day (OIES Insight 27, 2018 breakeven) in
    # January 2026 dollars. Returns USD/MMBtu delivered: charter for the round trip plus the gas lost on the way,
    # valued at the FOB price.
    days = dist_nm / 17 / 24
    loaded = 165000 * 0.985 * 0.45 * 52
    delivered = loaded * (1 - 0.0012 * days - 0.0009 * (days + 1.5))
    return 60000 * F18 * (2 * days + 3) / delivered + fob * (loaded - delivered) / delivered

def r_per_mwh(usd):
    return usd * FX * MMBTU_PER_MWH / EFF

cases = {}

rows = {}
for y in YEARS:
    hh = hh_2024usd(y) * F24
    fob = 1.15 * hh + 3.00                  # Argus 5 Dec 2025; OIES Quarterly Gas Review 32: 115% HH + USD 3 fee
    s = shipping(8600, fob)                 # US Gulf to Richards Bay
    rows[y] = (fob + s, 'HH %.3f (2024$) x %.4f = %.3f; x 1.15 + 3.00 = %.3f FOB; + shipping %.3f (8,600 nm)'
               % (hh_2024usd(y), F24, hh, fob, s))
cases['low'] = dict(label='Low: US LNG, 115% of Henry Hub plus USD 3, shipped to Richards Bay', terminal=True, rows=rows)

def flat(price_fn):
    p, how = price_fn()
    return {y: (p, how) for y in YEARS}

def central(brent_2026usd, note):
    fob = 0.1325 * brent_2026usd            # oil-indexed slope, FOB (S&P Global, 7 May 2024: 13.2% FOB, 14.2% DES)
    s = shipping(4200, fob)                 # Ras Laffan to Richards Bay, waypoint estimate (no published distance)
    return fob + s, '%s; x 13.25%% = %.3f FOB; + shipping %.3f (4,200 nm)' % (note, fob, s)

cases['central'] = dict(label='Central: 13.25% of Brent at USD 80 (IEA WEO 2025 STEPS, 2024 dollars)', terminal=True,
                        rows=flat(lambda: central(80 * F24, 'Brent 80 (2024$) x %.4f = %.3f' % (F24, 80 * F24))))
cases['brent100'] = dict(label='Central slope at Brent USD 100 (2026 dollars)', terminal=True,
                         rows=flat(lambda: central(100.0, 'Brent 100 (2026$)')))
cases['high'] = dict(label='High: JKM 2026 full-year estimate, delivered (no shipping added)', terminal=True,
                     rows=flat(lambda: (19.80, 'JKM 2026 full-year estimate USD 19.80 (Jan-Sep average 17.76 with '
                                               'Oct-Dec at 25.8), DES, nominal 2026 dollars')))
irp_r_gj = 260.8866 * SA_CPI_JAN24_JAN26
cases['irp'] = dict(label='IRP 2025 as published: R260.89/GJ, January 2024 rands, flat real, no terminal or adder',
                    terminal=False,
                    rows=flat(lambda: (irp_r_gj / FX * GJ_PER_MMBTU,
                                       'R260.8866/GJ (IRP 2025 workbook, New Tech Properties) x %.4f = R%.2f/GJ'
                                       % (SA_CPI_JAN24_JAN26, irp_r_gj))))

out = {'meta': {
    'what': 'LNG price delivered at the South African coast (USD/MMBtu, January 2026 dollars) and the fuel cost the '
            'model uses (R/MWh of electricity at 52%% HHV, January 2026 rands, R16.50/USD). Cases with terminal=true '
            'add USD %.2f/MMBtu variable regasification to the fuel cost and carry the LNG terminal as a separate '
            'fixed charge per kW of new gas (GAS_FOM_ADD, R354-707/kW-yr on the send-out basis); the IRP case does not.'
            % REGAS_USD,
    'conversions': {'US CPI 2024 avg to Jan 2026': round(F24, 4), 'US CPI 2018 avg to Jan 2026': round(F18, 4),
                    'SA CPI Jan 2024 to Jan 2026': round(SA_CPI_JAN24_JAN26, 4), 'R per USD': FX},
    'least_sourced': 'Shipping: a 2018 charter breakeven (OIES Insight 27) adjusted with US CPI and a waypoint distance '
                     'estimate; charter rates have likely risen since the Hormuz disruption (Fearnleys: one-year charter '
                     'about USD 100,000/day in March 2026).',
    'built_by': 'build_gas_cases.py, 9 Oct 2026'}, 'cases': {}}
for k, c in cases.items():
    yrs = {}
    for y, (usd, how) in c['rows'].items():
        fuel_usd = usd + (REGAS_USD if c['terminal'] else 0)
        yrs[str(y)] = {'coast_usd_mmbtu': round(usd, 4), 'fuel_r_mwh': round(r_per_mwh(fuel_usd), 2), 'how': how}
    out['cases'][k] = {'label': c['label'], 'terminal': c['terminal'], 'years': yrs}

dst = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'public_data', 'gas_price_cases.json')
with open(dst, 'w') as f:
    json.dump(out, f, indent=1)
for k, c in out['cases'].items():
    print('%-9s' % k, '  '.join('%s USD %6.2f R%5.0f/MWh' % (y, c['years'][y]['coast_usd_mmbtu'], c['years'][y]['fuel_r_mwh'])
                               for y in ('2026', '2030', '2035', '2040')))
