# GridTwin ZA

**An interactive digital twin of the South African power system.**
Live at: **https://nickhedley.github.io/gridtwin-za/**

Adjust the fleet, demand and policy — the app re-simulates a full year of hourly
dispatch instantly in your browser, and runs a 60-year Monte Carlo in the
background to report load-shedding *risk*, not just a single outcome. It runs on
**actual Eskom hourly data for 2025**.

Built in the spirit of interactive grid models like
[PyPSA-CA](https://www.eshansingh.xyz/PyPSA-CA/app/), as the fast intuition
layer in front of rigorous optimisation models like
[PyPSA-RSA](https://github.com/MeridianEconomics/pypsa-rsa).

---

## What it models

A national-level (single-node) hourly dispatch simulation of one calendar year
(8,760 hours). Every slider movement re-solves the year in ~20 ms; scenario
settings are encoded in the URL, so any configuration can be shared as a link.

**Merit order.** Each hour, demand is served in this sequence:

1. **Rooftop / embedded PV** — behind the meter, nets off demand directly
2. **Wind, utility PV, CSP** — zero marginal cost, curtailed only on surplus
3. **Nuclear (Koeberg), hydro, Cahora Bassa imports** — near-must-run
4. **Coal** — 42 GW installed × EAF, the workhorse
5. **Pumped storage & batteries** — discharge before peakers; recharge from
   surplus renewables and off-peak coal headroom
6. **Gas CCGT** (if built) — priced as mid-merit, but in practice runs only as
   backup/insurance: in a solar-and-battery-rich system, storage absorbs the
   evening peaks and gas is rarely dispatched (near-zero load factor). This
   mirrors the real tension in SA's gas debate, where LNG import economics want
   steady offtake but a renewables-heavy grid needs gas only in droughts.
7. **Diesel OCGT** — last resort, ~R6,100/MWh
8. **Unserved energy** — reported as load shedding; one stage ≈ 1,000 MW shed

**Outage risk (Monte Carlo).** Coal availability is not a flat average: it
follows a mean-corrected daily AR(1) process around the EAF slider value, with
volatility calibrated to the multi-week swings visible in Eskom's reported
unplanned outages. The app dispatches **60 synthetic outage-years** per
scenario (asynchronously, after the deterministic run) and reports:

- P(any load shedding during the year)
- Expected and P90 energy shed
- Probability of reaching at least each stage (exceedance bars)
- Expected diesel burn

This matters because average EAF alone badly understates crisis dynamics — the
2023 load-shedding record was driven by outage *volatility*, not just the
average. With volatility included, the app's "Crisis 2023" preset reproduces a
2023-scale outcome; without it, it doesn't.

## Data

Demand, wind and solar profiles are **actual Eskom hourly data for 2025**
(Eskom Data Portal, dataset ESK19243), processed by `scripts/build_profiles.py`
into `profiles.json`.

- **Demand** is reconstructed to *underlying* demand: Eskom's "Residual Demand"
  is already net of wind and PV, so gross grid demand = residual + wind + PV;
  estimated rooftop generation (~6.5 GW embedded fleet, behind-the-meter and
  absent from Eskom's figures) is then added back, because the app nets rooftop
  off internally.
- **Wind and solar** are converted to per-unit capacity factors against
  estimated nameplate, so app energy = installed MW × Σ(per-unit profile).
- If `profiles.json` is absent, the app falls back to synthetic calibrated
  profiles automatically (the status board shows "synthetic" vs "2025 Eskom").

**Observed 2025 (reproduced by the model):** winter peak 31.6 GW (7 July,
18:00), wind capacity factor ~37%, utility PV ~21%, coal ~72% of generation.

## The KPIs

| KPI | Definition |
|---|---|
| Energy supplied | Total annual generation incl. rooftop (TWh) |
| System cost | Fuel + carbon + annualised capex of *new* build incl. grid adder (R bn/yr) |
| Avg energy cost | System cost ÷ grid energy served (R/kWh) — **not a tariff** |
| Replacement cost | Every MWh (existing + new) priced at its full lifecycle LCOE, ÷ grid energy served (R/kWh) |
| CO₂ emissions | From coal, CCGT and diesel (Mt/yr) |
| **Renewables** | wind + utility PV + rooftop PV + CSP, as % of generation |
| **Non-fossil** | Renewables + nuclear + hydro + (mostly-hydro) imports |
| Curtailment | Surplus renewable energy spilled (TWh/yr) |

Renewables and Non-fossil are reported separately on purpose: lumping nuclear
and hydro into a single "clean" figure overstates the renewable build-out.
On 2025 data at default settings, Renewables ≈ 16% and Non-fossil ≈ 27%.
Rooftop (~6.5% of generation) is the softest input — it is reconstructed, not
measured, so the true renewables share could be a point or two lower.

### Two cost lenses — read both

The app reports cost two ways, because "what does this grid cost?" has two
legitimate answers that point in opposite directions:

- **Avg energy cost** (the "operating" lens) counts fuel, carbon and the capex
  of *newly-built* capacity only. Existing plant is treated as sunk, so today's
  paid-off coal and nuclear are charged just their running cost. This makes the
  *current* coal-heavy grid look cheap (≈R0.41/kWh on 2025 data) and a
  build-heavy transition look expensive.
- **Replacement cost** (the "all-new" lens) prices *every* MWh — existing and
  new alike — at its full lifecycle LCOE, driven by the adjustable LCOE sliders.
  It answers "what would this exact mix cost if built entirely new at today's
  prices?" Because it charges existing coal its *new-build* cost, it makes the
  current grid look expensive (≈R1.21/kWh) and a renewables-heavy mix cheaper
  (≈R1.06/kWh).

The same scenario therefore flips: under the operating lens the transition looks
costlier than today; under the replacement lens it looks cheaper. **Both are
true** — they answer different questions (run what we have vs build it all
fresh), and neither is a consumer tariff (both exclude distribution, retail and
network costs beyond the new-VRE grid adder). The honest reading is to compare
scenarios *within* a lens and to hold both lenses in view; the truth for any
real decision sits between them. Replacement cost uses the slider LCOEs for
wind, PV, rooftop, battery, CSP, CCGT, nuclear and coal, plus fixed lifecycle
values for hydro (R0.60/kWh), imports (R0.55) and pumped storage (R1.40).

## Assumptions

**Fleet (2026 baseline):** coal 42 GW · nuclear 1.86 GW · wind 3.6 GW · utility
PV 4 GW · rooftop PV ~6.5 GW (2025) · CSP 0.5 GW · batteries 0.8 GW · pumped
storage 2.9 GW / 60 GWh · diesel OCGT 3.4 GW · hydro 0.6 GW · imports 1.15 GW.

**Costs (R/MWh marginal):** coal 480 · nuclear 160 · imports 550 · CCGT 1,750 ·
diesel 6,100. **Emissions (tCO₂/MWh):** coal 1.04 · CCGT 0.37 · diesel 0.78.

**New-build annualised capex (R/kW·yr):** wind 1,650 · PV 1,050 · rooftop 1,150
· battery (4h) 1,500 · CCGT 1,350.

**Grid expansion adder:** default R600/kW·yr applied to new wind and utility PV
(adjustable R0–1,200 via the Policy slider), derived from the Transmission
Development Plan 2025–34: ±R390bn of lines and transformers to connect 56 GW ≈
R700/kW·yr annualised. Rooftop PV and batteries (assumed co-located) are exempt
— one reason embedded solar is worth more than its raw capacity suggests.

**Co-located repurposing (Policy toggle).** When enabled, new solar and battery
capacity can inherit the grid connection points of decommissioned coal, avoiding
the transmission adder — but only up to the MW of coal retired (the connection
headroom that retirement frees). Wind is never exempted: the Highveld coalfields
(Mpumalanga, Limpopo) have strong solar irradiance but mediocre wind, so siting
solar on a retired coal connection is geographically credible while siting wind
there is not. The exemption is therefore `min(coal retired, new solar) × adder`.
This lets the model demonstrate the connection-inheritance argument — retiring
coal has grid value beyond the lost megawatts — while respecting its geographic
limit: it does *not* imply that all new renewables avoid transmission cost, only
the modest share that could plausibly sit near the coalfields. It is a
cost-side approximation only; the single-node model does not physically route
that solar through the old connection.

The reported average energy cost is (fuel + carbon + new-build capex incl. the
grid adder) ÷ grid energy served — it still excludes existing-fleet capex,
distribution and retail costs, so it is *not* a tariff.

### LCOE comparison (separate from the cost engine)

The "Levelised cost comparison" panel shows the full-lifecycle build cost of
each technology (R/kWh), with adjustable sliders anchored to current South
African figures:

| Technology | Anchor (R/kWh) | Basis |
|---|---|---|
| Utility solar PV | 0.55 | REIPPPP BW7 (2024) bids averaged R0.46; anchor set slightly above unsubsidised |
| Wind | 0.75 | BW7 wind bids came in above solar (none awarded), signalling higher local cost |
| Rooftop PV | 0.90 | smaller scale, higher per-kW cost |
| New coal | 1.20 | new-build, not the existing paid-off fleet |
| Gas CCGT | 1.50 | fuel-price sensitive |
| Battery (4h) | 1.60 | — |
| Nuclear | 1.65 | wide range; SMRs materially higher |
| CSP | 2.00 | — |
| Diesel OCGT | 5.50 | peaking only |

Anchors blend REIPPPP Bid Window 7 tariffs, IRENA's *Renewable Power Generation
Costs in 2024*, and CSIR-style South African assumptions (≈R18.5/USD). A PPA
tariff is close to but not identical to LCOE (it embeds developer margin), so
the solar and wind anchors sit slightly above the raw bid numbers.

**What the LCOE sliders drive.** They set the "Levelised cost comparison" chart
*and* the **Replacement cost** KPI (see Two cost lenses, above). They do **not**
feed System Cost or Avg energy cost — those use the dispatch engine's marginal
cost (fuel + variable O&M, which sets merit order) plus annualised capex on new
build. Keeping LCOE out of the operating-cost KPIs avoids double-counting the
fuel and O&M that LCOE already bundles in; the replacement-cost KPI is a
*separate* accounting that prices energy purely at LCOE instead. The underlying
dispatch always runs on marginal cost regardless of lens: a plant with high LCOE
but near-zero marginal cost (e.g. solar) is still dispatched first once built.
This mirrors how utilities and the CSIR separate build and dispatch decisions.

## Limitations — read before quoting results

- **Single node.** Transmission is schematic only; no network *constraints*.
  New-build transmission *cost* is approximated by the grid expansion adder,
  but the model cannot see that grid capacity in the Cape provinces is a
  binding physical constraint on where and how fast renewables can connect.
- **No unit commitment or reserves.** Coal has no minimum-stable-generation or
  ramping constraints; no operating reserve margin is enforced. This makes the
  model slightly optimistic in tight hours.
- **Storage dispatches with simple heuristics**, not optimisation. Because it
  has no foresight, it may hold gas plant idle where a real operator would burn
  some to preserve storage for an anticipated bad day.
- **Monte Carlo varies outages only.** Weather and demand are fixed at the
  actual 2025 year across the 60 runs; real years also vary in weather. Bands
  understate total uncertainty.
- **Rooftop is estimated, not measured** (see Data).
- **Costs are indicative** and the cost metric is not a tariff (see above).

For decision-grade capacity-expansion analysis, use
[PyPSA-RSA](https://github.com/MeridianEconomics/pypsa-rsa) (Meridian
Economics), which co-optimises investment and dispatch at up to 159-node
spatial resolution with validated input data. GridTwin ZA is deliberately the
opposite trade-off: instant, transparent, and simple enough to reason about.

## Sources & data provenance

| Source | What it gave us |
|---|---|
| **[Eskom Data Portal](https://www.eskom.co.za/dataportal/)** (dataset ESK19243, 2025 hourly) | The backbone of the live model. Hourly RSA demand, wind and PV columns → the real 2025 profiles in `profiles.json`: demand reconstructed to "underlying" demand (residual + wind + PV, plus estimated rooftop), and per-unit wind (~37% CF) and solar (~21% CF) capacity-factor shapes. This is what took the app from synthetic to "driven by actual Eskom data." |
| **Eskom weekly system status reports** (June–July 2026) | Calibrated the 2026 baseline and several headline figures: EAF ~64%, winter peak ~27 GW, OCGT diesel load factor ~1.3%, the 420-days-without-shedding streak, and the outage-volatility range (±1.5 GW today vs ±2.5–3 GW in 2023) feeding the Monte Carlo. |
| **Eskom NTC / press** (2026) | The ~8.3 GW embedded rooftop-solar figure and the structural-demand-decline story (March 2026 peak down 8.3% y/y), both built into demand assumptions. |
| **[PyPSA-RSA](https://github.com/MeridianEconomics/pypsa-rsa)** (Meridian Economics) | The richest single source for the nodal work: the 10-region network topology, corridor lengths, the St Clair formula and its 400 kV constants (thermal 1,788 MW, SIL 602 MW, 0.7 N-1 derate) used to derive transfer limits, and the full per-station fleet list (capacities, GPS coordinates, decommissioning dates). Also the "decision-grade" backend the app defers to throughout. |
| **[UCT ZivaHub — Spatialized IRP Demand](https://zivahub.uct.ac.za/)** (Merven / ESRG) | `IRPDemandREF_provincial_no_exports.csv` — hourly demand split across all 10 nodal regions. The one piece of nodal data neither derivable nor synthesisable from the other sources. |
| **CSIR, [IRENA Renewable Power Generation Costs 2024](https://www.irena.org/), REIPPPP Bid Window 7 tariffs** | Anchored the LCOE assumptions. BW7 was the strongest single input — solar bids averaging R0.46/kWh (anchor set to R0.55), wind bids coming in high enough that none were awarded (anchor R0.75). IRENA/CSIR filled in nuclear, coal, CCGT, batteries, CSP. |
| **Eskom Transmission Development Plan 2025–34** | Source for the grid-expansion adder (~R390bn / 14,500 km to connect 56 GW, annualised to ~R700/kW·yr, defaulted to R600 in the app) and the evidence base for "transmission is the binding constraint." Also the ~R31m/km blended national line-cost figure used in the nodal capacity-siting tool (from the DEE Minister's April 2025 statement, R440bn / ~14,000km). |
| **[PyPSA-RSA GIS bundle](https://drive.google.com/drive/folders/17f54zTMEfeFZhNByXxLkf9qcZRdhng03)** (`Existing_Lines.shp`, `rsa_supply_regions.gpkg`) | Real transmission line geometries and the actual 10-region GCCA supply-area boundaries (not a province approximation). Used to derive real per-corridor circuit counts (by matching line endpoints to regions) and to correctly assign generation fleet to supply regions — e.g. revealing that Lethabo Power Station's real supply-area is Gauteng, not Free State province, materially changing the nodal dispatch result. |
| **[PyPSA-CA](https://www.eshansingh.xyz/PyPSA-CA/app/)** | Not a data source — the design template for the whole app: instant, transparent, browser-based scenario exploration in front of a rigorous optimisation model. |

## Nodal prototype

A 10-region nodal extension lives in `nodal/` — real regional demand, real fleet-to-region assignment, real transfer-limit corridors (derived from actual line geometries where available), a dispatch-with-flows engine, and a capacity-siting tool ("Where To Build" panel) that checks real grid headroom before charging for new transmission. See `nodal/capacity_siting.py` for the full method and `region_headroom_lookup.json` for precomputed results. This is a prototype, not (yet) the primary model the KPIs above are computed from — the single-node engine remains the app's core.



```
index.html                          the entire app (no build step, no dependencies)
profiles.json                       real 2025 Eskom hourly demand/wind/solar profiles
og-card.png                         social preview image
scripts/build_profiles.py           Eskom CSV -> profiles.json ingestion pipeline
nodal/                               10-region nodal prototype (see "Nodal prototype" above)
  nodal_engine.py                    dispatch-with-flows engine, real corridor topology
  capacity_siting.py                 offline tool: computes real per-region grid headroom
  capacity_siting.js                 browser-side port, powers the "Where To Build" panel
  region_headroom_lookup.json        precomputed headroom per region/technology
  demand_2025_regional.csv           hourly 2025 demand, 10 regions (UCT ZivaHub)
  profiles_regional.json             stylised regional wind/solar profiles (synthetic)
  fleet_by_region_v2.csv             generation fleet assigned to real GCCA supply regions
  regional_renewable_capacity.json   installed wind/solar MW per region (REIPPPP sites)
```

The app is a single self-contained HTML file: vanilla JS, custom canvas charts,
no frameworks, no trackers. Fork it, view source, or open an issue.

### Sharing scenarios

Slider settings are written to the URL. Copy the address bar (or use the
"Copy scenario link" button) to share an exact configuration. Append
`&embed=1` for a chrome-reduced version suitable for iframes.

## Roadmap

1. ~~Monte Carlo outage risk~~ ✅
2. ~~Real Eskom hourly demand / wind / PV profiles~~ ✅
3. 10-region model on the GCCA Eskom transmission supply regions, with
   transfer limits — nodal prototype built (`nodal/`), including a working
   "Where To Build" capacity-siting panel on the live site; not yet the
   primary engine behind the main KPIs, and the map doesn't yet show flows
4. Real (non-synthetic) regional wind/solar profiles for the nodal model —
   the current `nodal/profiles_regional.json` is stylised, not measured
5. Precomputed PyPSA-RSA least-cost scenarios as loadable presets

## Licence & disclaimer

MIT licence — reuse freely with attribution.

This is an educational scenario explorer. All outputs are indicative and it is
not planning, investment or operational advice. Not affiliated with Eskom,
the NTCSA, or Meridian Economics.
