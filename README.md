# GridTwin ZA

**An interactive digital twin of the South African power system.**  
Live at: **https://nickhedley.github.io/gridtwin-za/**

Adjust the fleet, demand and policy — the app re-simulates a full year of hourly dispatch instantly in your browser, runs a 60-year Monte Carlo for load-shedding *risk*, and includes a suite of tools for C&I developers, IPPs, and energy analysts. Driven by **actual Eskom hourly data for 2025**.

Built in the spirit of [PyPSA-CA](https://www.eshansingh.xyz/PyPSA-CA/app/), as the fast intuition layer in front of rigorous optimisation models like [PyPSA-RSA](https://github.com/MeridianEconomics/pypsa-rsa).

---

## What it models

A national-level (single-node) hourly dispatch simulation of one calendar year (8,760 hours). Every slider movement re-solves the year in ~20 ms; scenario settings are encoded in the URL for easy sharing. A full 10-region nodal engine runs on demand via the **Nodal Simulation** panel.

**Merit order.** Each hour, demand is served in sequence:

1. **Rooftop / embedded PV** — behind the meter, nets off demand directly
2. **Wind, utility PV, CSP** — zero marginal cost, curtailed only on surplus
3. **Nuclear, hydro, Cahora Bassa imports** — near-must-run
4. **Coal** — 42 GW installed × EAF, with real ramp limits and unit commitment
5. **Pumped storage & batteries** — discharge before peakers; recharge from surplus renewables and off-peak coal headroom
6. **Gas CCGT** (if built) — LNG-fired at ~R2,800/MWh; dispatched only as backup
7. **Diesel OCGT** — last resort, ~R6,100/MWh
8. **Unserved energy** — reported as load shedding; one stage ≈ 1,000 MW shed

**Outage risk (Monte Carlo).** Coal availability follows a mean-corrected daily AR(1) process around the EAF slider value, calibrated to Eskom's reported unplanned outage volatility. The app dispatches **60 synthetic outage-years** per scenario (asynchronously) and reports P(shed >100 GWh), expected and P90 energy shed, stage exceedance probabilities, and expected diesel burn. When a nodal run exists, all 60 paths are scaled by a corridor correction factor derived from the ratio of nodal to national unserved energy.

---

## Features

### Scenario explorer
- Instant re-solve on every slider change (~20 ms national, ~5 s nodal)
- **Scenario presets:** Today 2026, Crisis 2023, IRP 2025 (by 2030), Gas bridge
- **📌 Pin for comparison** — lock any scenario and compare KPIs side-by-side with a delta column (CO₂ drops 37 Mt, cost +R0.02/kWh etc.)
- **Copy scenario link** — URL encodes all slider positions for sharing
- **↓ CSV** — download 8,760-hour dispatch results with all carriers

### Site Resource Query
Click anywhere on the SA map to get:
- **Solar & wind:** annual capacity factor from PVGIS SARAH2 satellite data (or Open-Meteo ERA5 fallback), monthly profile chart, CSV download
- **Data centre matching:** MW load slider → solar + storage sizing for 50/70/90/100% carbon-free hours
- **Capture price:** IPP revenue estimate and indicative PPA floor by region, for solar and wind, both sides of the transaction
- **Grid connection:** nearest of 159 Eskom substations (with voltage classification: 400kV transmission vs 132kV distribution), GCCA headroom for solar/wind/battery, corridor upgrade cost if headroom is zero
- **Wheeling:** delivered cost calculator (Northern Cape → Gauteng etc.) — PPA + TUoS + losses, vs local generation alternative

### C&I Pre-feasibility report
Enter system size, offtake type, and cost assumptions to generate a downloadable report covering:
- Solar resource (CF, annual yield, data source)
- Financial case (capex, payback, IRR, NPV)
- Regulatory pathway (NERSA registration category, grid connection authority, required documents, timeline)
- Recommended next steps tailored to offtake type

### Network schematic
- 10-region SA transmission map with real corridor flows (post nodal run)
- **REIPPPP project pipeline** overlay — dashed rings showing government-procured projects (BW5/6/7, BESIPPPP, RMIPPPP) by status: grey = preferred bidder, yellow = financial close, green = under construction

### NERSA new project registrations
Cumulative registered capacity panel (19.7 GW, 2,503 projects since 2018), sourced from SAPVIA's NERSA dashboard. Province bars split by solar (yellow) and wind (green). Updated quarterly.

---

## Data

Demand, wind and solar profiles are **actual Eskom hourly data for 2025** (Eskom Data Portal, dataset ESK19243), processed by `scripts/build_profiles.py` into `profiles.json`. Regional solar profiles use PVGIS SARAH2 satellite data (5 km resolution, ~1.22× spread vs national average MERRA-2).

**Observed 2025 (reproduced by the model):** winter peak 31.6 GW (7 July, 18:00), wind CF ~37%, utility PV ~21%, coal ~72% of generation.

---

## Cost assumptions (2026)

| Item | Value | Basis |
|---|---|---|
| Coal marginal cost | R480/MWh | Eskom fuel cost |
| Gas CCGT dispatch cost | **R2,800/MWh** | LNG-fired at ~$14–19/MMBtu spot (Jul 2026) × R19/$ × 8 GJ/MWh. IRP 2025 baseline of $10/MMBtu is below current market |
| Diesel OCGT | R6,100/MWh | Eskom OCGT fuel cost |
| Nuclear | R160/MWh | Variable O&M only |
| Imports (Cahora Bassa) | R550/MWh | Published contract rates |
| **Gas CCGT LCOE** | **R2,500/MWh** | LNG fuel + capital + regasification. Slider range R800–4,000 |
| Utility solar PV LCOE | R550/kWh | REIPPPP BW7 bids averaged R0.46; anchor above unsubsidised |
| Wind LCOE | R750/kWh | BW7 wind bids above solar (none awarded) |
| Battery (4h) LCOE | R1,450/kWh | BNEF 2026, −27% YoY |
| Nuclear LCOE | R1,650/kWh | Wide range; SMRs higher |

---

## KPIs

| KPI | Definition |
|---|---|
| Energy supplied | Total annual generation incl. rooftop (TWh) |
| System cost | Fuel + carbon + annualised capex of *new* build incl. grid adder (R bn/yr) |
| Avg energy cost | System cost ÷ grid energy served (R/kWh) — not a tariff |
| Replacement cost | Every MWh priced at full lifecycle LCOE ÷ grid energy served (R/kWh) |
| CO₂ emissions | From coal, CCGT and diesel (Mt/yr) |
| Renewables | Wind + utility PV + rooftop + CSP, as % of generation |
| Non-fossil | Renewables + nuclear + hydro + imports |
| Curtailment | Surplus renewable energy spilled (TWh/yr) |

---

## Validation

The heuristic dispatch engine is cross-validated against a full MIP (PyPSA + HiGHS) across six scenarios:

| Scenario | Heuristic vs MIP gap |
|---|---|
| Baseline (winter week) | 0.54% |
| Baseline (summer week) | 0.63% |
| Crisis EAF 50% | 0.12% |
| +30 GW solar | 1.56% |
| +20 GW wind | 0.99% |
| 14 GW decommissioned | 0.54% |

See `validation/README.md` for setup and usage of the cross-validation scripts.

---

## Limitations

- **Single node** (national engine). Transmission is schematic only; no network constraints in the fast engine. The 10-region nodal engine captures corridor congestion and regional shortfalls.
- **No full unit commitment in national engine.** Coal has aggregate ramp limits and a commitment lookahead, but not per-unit minimum up/down times. The nodal engine enforces real per-unit constraints.
- **Storage dispatches with bounded heuristics**, not full optimisation.
- **Monte Carlo varies outages only.** Weather and demand are fixed across the 60 runs.
- **Rooftop PV is estimated**, not measured.
- **Gas CCGT costs are highly uncertain** — LNG spot price is $14–19/MMBtu in mid-2026, well above the IRP's $10/MMBtu baseline assumption.
- **Costs are indicative** — not a tariff (excludes distribution, retail and most network costs).

For decision-grade analysis, use [PyPSA-RSA](https://github.com/MeridianEconomics/pypsa-rsa) (Meridian Economics).

---

## File structure

```
index.html                           the entire app (no build step, no dependencies)
profiles.json                        real 2025 Eskom hourly demand/wind/solar profiles
og-card.png                          social preview image (1200×630)
scripts/
  build_profiles.py                  Eskom CSV → profiles.json ingestion pipeline
  parse_nersa_pdf.py                 NERSA quarterly PDF → nersa_registrations.json
  parse_nersa_batch.py               batch parser (identifies PDFs by content, not filename)
  build_pipeline_json.py             REIPPPP pipeline data builder
  fetch_sa_solar_grid.py             PVGIS SARAH2 grid fetcher (run locally, ~33 min)
  fetch_substation_coords.py         OSM substation coordinate updater (run locally, ~30 s)
validation/
  pypsa_crossval_uc.py               cross-validates heuristic against real PyPSA MIP
  mip_solver.py                      Tier 3 "solve this week properly" script
  README.md                          setup and usage guide for validation scripts
nodal/
  nodal_engine.js                    browser-side 10-region dispatch engine
  nodal_dispatch.js                  fetches nodal data + orchestrates full-year run
  fleet_by_region_v2.csv             generation fleet assigned to real GCCA supply regions
  demand_2025_regional.csv           hourly 2025 demand, 10 regions (UCT ZivaHub)
  profiles_regional.json             PVGIS SARAH2 regional solar + MERRA-2 wind profiles
  regional_renewable_capacity.json   installed wind/solar MW per region (REIPPPP sites)
  rooftop_mw_by_region.json          real regional rooftop PV (Eskom, Jun-26)
  region_headroom_lookup.json        GCCA 2025 headroom per region/technology
  firm_headroom_lookup.json          firm headroom (battery/gas)
  headroom_summary.json              compact headroom for Site Resource Query
  substations_compact.json           159 Eskom substations with OSM-corrected coordinates
  ipp_pipeline.json                  REIPPPP pipeline (BW5/6/7, BESIPPPP, RMIPPPP)
  nersa_registrations.json           SAPVIA cumulative + NERSA quarterly data
  sa_solar_grid.json                 PVGIS SARAH2 0.5° grid for Site Resource Query
```

---

## Sources & data provenance

| Source | What it gave us |
|---|---|
| **Eskom Data Portal** (ESK19243, 2025 hourly) | Real 2025 demand, wind and PV profiles |
| **Eskom weekly system status reports** (Jun–Jul 2026) | 2026 baseline calibration: EAF ~64%, winter peak ~27 GW, outage volatility ±1.5 GW |
| **PyPSA-RSA** (Meridian Economics) | 10-region topology, corridor limits, St Clair transfer limits, fleet list with GPS coordinates |
| **UCT ZivaHub** (Merven / ESRG) | Hourly demand split across 10 nodal regions |
| **PVGIS SARAH2** (EU JRC) | Satellite-based solar capacity factors at 5 km resolution for regional and site-specific profiles |
| **REIPPPP BW7 tariffs + IRENA 2024 + BNEF 2026** | LCOE anchors for all technologies |
| **Eskom TDP 2025–34** | Grid expansion adder (~R390bn / 14,500 km), corridor upgrade costs |
| **GCCA 2025 GIS** (NTCSA) | 159 Eskom supply area substations and GCCA headroom by region |
| **OpenStreetMap Overpass API** | Precise GPS coordinates for ~120 of 159 substations |
| **SAPVIA NERSA Registered Plants Dashboard** | Cumulative registered capacity (19.7 GW, 2,503 projects since 2018) |
| **NERSA quarterly media statements** | Per-province quarterly registration data |
| **IPP Office quarterly overview** (ipp-projects.co.za) | REIPPPP project pipeline by status |
| **NTCSA wheeling framework** (2024) | TUoS tariff structure for wheeling calculator |
| **IRP 2025** (Cabinet-approved Oct 2025) | IRP 2025 preset targets: 7.34 GW wind, 11.27 GW solar, 6 GW gas by 2030 |

---

## Roadmap

1. ~~Monte Carlo outage risk~~ ✅
2. ~~Real Eskom hourly demand / wind / PV profiles~~ ✅
3. ~~10-region nodal model with real transfer limits~~ ✅
4. ~~Full nodal dispatch with rooftop, CSP, imports, network-integrated storage~~ ✅
5. ~~Corridor flows on the network schematic map~~ ✅
6. ~~PVGIS SARAH2 regional solar profiles~~ ✅ (1.22× spread vs 1.08× MERRA-2)
7. ~~Site Resource Query — solar/wind CF, data centre matching, capture price, grid connection, wheeling~~ ✅
8. ~~NERSA registrations panel~~ ✅ (SAPVIA cumulative data)
9. ~~REIPPPP pipeline overlay~~ ✅
10. ~~Scenario comparison (pin + delta column)~~ ✅
11. ~~C&I Pre-feasibility report~~ ✅
12. ~~Monte Carlo nodal corridor correction~~ ✅
13. Merge nodal engine into main KPIs/charts as primary model
14. Verified regional battery siting (no complete public site list currently available)
15. Precomputed PyPSA-RSA least-cost scenarios as loadable presets

---

## Licence & disclaimer

**[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)** — free to use, share and adapt with attribution for non-commercial purposes. Commercial use requires explicit written permission from the author.

This is an educational scenario explorer. All outputs are indicative — not planning, investment or operational advice. Not affiliated with Eskom, NTCSA, NERSA, SAPVIA, or Meridian Economics.
