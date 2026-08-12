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
- **Grid connection:** nearest of 186 Eskom transmission substations, GCCA headroom for solar/wind/battery, corridor upgrade cost if headroom is zero. 185 carry verified GPS coordinates; each marker shows its provenance and planned substations are flagged as not yet built
- **Wheeling:** delivered cost calculator (Northern Cape → Gauteng etc.) — PPA + TUoS + losses, vs local generation alternative

### Rooftop solar calculator
Satellite roof tracer and financial model for a specific building:
- **Trace your roof** on hybrid satellite imagery (Esri, with street labels) — click the corners and the area is computed and fed into the model, less a 72% usable factor for setbacks and obstructions
- **Address search or GPS coordinates** — OpenStreetMap geocoding, with results flagged street-level where house-number data is missing; pasting coordinates copied from any mapping app lands exactly on the property
- **Site-specific solar CF** fetched for the traced location rather than a national average
- **Self-consumption model** — solar only offsets a bill when generation coincides with load, so coverage is capped by how much demand actually falls in the solar window. Rates scale with system size relative to demand, and with battery capacity measured against the site's own daily usage
- **Optional appliance profile** — tick the appliances you have to replace the generic assumption with a load profile derived from them, and see a quantified load-shifting opportunity ("moving your geyser and pool pump to midday would lift coverage from X% to Y%")

### Optimal dispatch (MIP)
**Run the full model** re-solves the whole system as a true mixed-integer program using HiGHS compiled to WebAssembly — no server required. Coal unit commitment, storage scheduling and corridor flows are co-optimised across all 10 regions simultaneously, over either 52 representative days (~30 s) or the full 8,760 hours (~4 min). The KPIs, energy mix and dispatch chart switch to the optimum, corridor lines on the schematic thicken and redden by utilisation, and per-region curtailment appears on the map.

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
| Coal marginal cost | R546/MWh | Eskom FY2025 primary energy cost |
| Gas CCGT dispatch cost | **R2,800/MWh** | LNG-fired at ~$14–19/MMBtu spot (Jul 2026) × R19/$ × 8 GJ/MWh. IRP 2025 baseline of $10/MMBtu is below current market |
| Diesel OCGT | R6,100/MWh | Eskom OCGT fuel cost |
| Nuclear | R160/MWh | Variable O&M only |
| Imports (Cahora Bassa) | R550/MWh | Published contract rates |
| **Gas CCGT LCOE** | **R2,500/MWh** | LNG fuel + capital + regasification. Slider range R800–4,000 |
| Utility solar PV LCOE | R550/MWh | REIPPPP BW7 bids averaged R0.46; anchor above unsubsidised |
| Wind LCOE | R750/MWh | BW7 wind bids above solar (none awarded) |
| Battery (4h) LCOE | R1,450/MWh | BNEF 2026, −27% YoY |
| Nuclear LCOE | R1,650/MWh | Wide range; SMRs higher |

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

The instant heuristic engine is benchmarked against the in-browser MIP optimiser
(HiGHS via WebAssembly), solving identical scenarios:

| Scenario | Heuristic vs MIP gap |
|---|---|
| Today's system (no new solar) | −0.5% |
| +10 GW solar | −0.8% |
| +25 GW solar | +5.7% |
| +40 GW solar | +4.8% |

The heuristic commits coal in **4-hour blocks** — six per day. This lets units shut down through
a deep midday solar trough and restart for the evening peak, which day-level
commitment structurally could not: a fully-committed fleet has a ~15 GW minimum
stable floor while a high-solar midday trough falls to ~2 GW, forcing unavoidable
overproduction. Moving to 8-hour blocks cut the mean gap from 10.4% to 4.0%.

Block size was chosen by benchmarking against the MIP on both cost and cycling.
4-hour blocks track it better on each: cost gap +5.7%/+4.8% versus +7.9%/+6.5% for
8-hour, and 7,902 annual start-ups versus the MIP's own 9,281 (8-hour understates
at 5,618). An earlier version rejected 4-hour blocks by comparing modelled starts
against the real fleet's ~500–1,500/yr, but that is not like-for-like — the model
uses 31 unit groups rather than 90+ individual units, and the MIP optimum itself
implies ~3,200 starts even with no new solar.

Per-day adaptive block sizing was also tested and rejected: a trigger based on
whether committed minimum stable generation exceeds the day's trough fires on no
days below 10 GW of new solar and on every day above 25 GW, so it collapses into a
fixed short block with extra complexity. The residual high-solar gap is inherent to
block-level commitment; press **Run the full model** for the true optimum.

Benchmark scripts: `calibrate_heuristic.js`, `calibrate_block_commitment.js`.

---

## Limitations

- **Single node** (national engine). Transmission is schematic only; no network constraints in the fast engine. The 10-region nodal engine captures corridor congestion and regional shortfalls.
- **Block-level unit commitment in the national engine.** Coal is committed per unit in 8-hour blocks with real minimum up/down times, minimum stable levels and start-up costs, but not hour-by-hour. The MIP optimiser (Run the full model) commits hourly and co-optimises storage and corridor flows across all 10 regions.
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
  fetch_osm_substations.py           bulk Overpass fetch + name matching, distance-guarded
validation/
  pypsa_crossval_uc.py               cross-validates heuristic against real PyPSA MIP
  mip_solver.py                      Tier 3 "solve this week properly" script
  calibrate_heuristic.js             benchmarks the heuristic's reserve margin vs the MIP
  calibrate_block_commitment.js      benchmarks commitment block size vs the MIP
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
  substations_compact.json           186 substations, 185 with verified GPS coordinates
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
| **GCCA 2025 GIS** (NTCSA) | Supply-area polygons and GCCA connection headroom by region |
| **NTCSA `Existing_Substations.shp`** | Exact point coordinates for 17 network-expansion substations |
| **DBSA RFP 008 Appendix A** | National transmission substation register with GPS coordinates and voltage ratings, existing and planned |
| **Eskom published substation GPS coordinates** | Northern Cape transmission substations |
| **OpenStreetMap Overpass API** (ODbL) | GPS coordinates for 104 substations, name-matched and verified against the real transmission network |
| **SAPVIA NERSA Registered Plants Dashboard** | Cumulative registered capacity (19.7 GW, 2,503 projects since 2018) |
| **NERSA quarterly media statements** | Per-province quarterly registration data |
| **IPP Office quarterly overview** (ipp-projects.co.za) | REIPPPP project pipeline by status |
| **Eskom BESS Phase 1 per-site ratings** | Verified regional battery split (199 MW / 833 MWh across 8 named sites) |
| **NTCSA wheeling framework** (2024) | TUoS tariff structure for wheeling calculator |
| **PyPSA-ZA** (Hörsch & Calitz 2017, arXiv:1710.11199) | Published least-cost 2040 mixes used for the two PyPSA scenario presets |
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
13. ~~In-browser MIP optimiser (HiGHS/WebAssembly) co-optimising commitment, storage and corridor flows~~ ✅
14. ~~Rooftop solar calculator with satellite roof tracer and appliance load profiling~~ ✅
15. ~~Verified substation GPS coordinates~~ ✅ (185 of 186, cross-checked against the transmission network)
16. ~~Block-level unit commitment calibrated against the MIP~~ ✅
17. ~~Verified regional battery siting~~ ✅ (Eskom BESS Phase 1 per-site MW, all 8 sites)
18. ~~Least-cost scenario presets~~ ✅ (two presets from the published PyPSA-ZA study — PyPSA-RSA itself publishes no ready-made scenario outputs, so these are derived from published results rather than from re-running the model)
19. Seasonal load profiles in the rooftop tool (winter geyser load is materially higher than the annual average)

---

## Licence & disclaimer

**[CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/)** — free to view, share and link to with attribution, for non-commercial purposes. Commercial use, or distributing modified or derivative versions, requires explicit written permission from the author. This covers the model, calibration and code; the underlying public datasets remain under their own licences and are credited in the application footer.

This is an educational scenario explorer. All outputs are indicative — not planning, investment or operational advice. Not affiliated with Eskom, NTCSA, NERSA, SAPVIA, or Meridian Economics.
