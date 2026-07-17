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
| CO₂ emissions | From coal, CCGT and diesel (Mt/yr) |
| **Renewables** | wind + utility PV + rooftop PV + CSP, as % of generation |
| **Non-fossil** | Renewables + nuclear + hydro + (mostly-hydro) imports |
| Curtailment | Surplus renewable energy spilled (TWh/yr) |

Renewables and Non-fossil are reported separately on purpose: lumping nuclear
and hydro into a single "clean" figure overstates the renewable build-out.
On 2025 data at default settings, Renewables ≈ 16% and Non-fossil ≈ 27%.
Rooftop (~6.5% of generation) is the softest input — it is reconstructed, not
measured, so the true renewables share could be a point or two lower.

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

The reported average energy cost is (fuel + carbon + new-build capex incl. the
grid adder) ÷ grid energy served — it still excludes existing-fleet capex,
distribution and retail costs, so it is *not* a tariff.

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

## Repository

```
index.html                  the entire app (no build step, no dependencies)
profiles.json               real 2025 Eskom hourly demand/wind/solar profiles
og-card.png                 social preview image
scripts/build_profiles.py   Eskom CSV -> profiles.json ingestion pipeline
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
   transfer limits — making the map show flows
4. Precomputed PyPSA-RSA least-cost scenarios as loadable presets

## Licence & disclaimer

MIT licence — reuse freely with attribution.

This is an educational scenario explorer. All outputs are indicative and it is
not planning, investment or operational advice. Not affiliated with Eskom,
the NTCSA, or Meridian Economics.
