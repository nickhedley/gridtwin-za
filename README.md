# GridTwin ZA

**An interactive digital twin of the South African power system.**
Live at: **https://nickhedley.github.io/gridtwin-za/**

Adjust the fleet, demand and policy — the app re-simulates a full year of hourly
dispatch instantly in your browser, and runs a 60-year Monte Carlo in the
background to report load-shedding *risk*, not just a single outcome.

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
6. **Gas CCGT** (if built) — mid-merit
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

## Calibration

The 2026 base year is calibrated to **Eskom's weekly system status reports
(June–July 2026)** and public capacity data:

| Quantity | Model | Reference |
|---|---|---|
| Winter evening peak (grid) | ~27.5 GW | Eskom forecasts 26.3–27.3 GW, winter 2026 |
| Coal fleet EAF | 64 % default | 64.8 % FYTD (Apr–Jul 2026) |
| OCGT diesel load factor | ~0 % | 1.29 % FYTD 2026 |
| Load shedding | Stage 0, P(shed) ≈ 0 | 420+ consecutive days without shedding |
| Embedded rooftop PV | 8.3 GW | Eskom NTC, June 2026 |
| Structural demand decline | built into profile | March 2026 peak 26.5 GW vs 28.9 GW in March 2025 |

**Fleet (2026):** coal 42 GW · nuclear 1.86 GW · wind 3.6 GW · utility PV 4 GW
· rooftop PV 8.3 GW · CSP 0.5 GW · batteries 0.8 GW · pumped storage 2.9 GW /
60 GWh · diesel OCGT 3.4 GW · hydro 0.6 GW · imports 1.15 GW.

**Costs (R/MWh marginal):** coal 480 · nuclear 160 · imports 550 · CCGT 1,750 ·
diesel 6,100. **Emissions (tCO₂/MWh):** coal 1.04 · CCGT 0.37 · diesel 0.78.
**New-build annualised capex (R/kW·yr):** wind 1,650 · PV 1,050 · rooftop 1,150
· battery (4h) 1,500 · CCGT 1,350. **Grid expansion adder:** default
R600/kW·yr applied to new wind and utility PV (adjustable R0–1,200 via the
Policy slider), derived from the Transmission Development Plan 2025–34:
±R390bn of lines and transformers to connect 56 GW ≈ R700/kW·yr annualised.
Rooftop PV and batteries (assumed co-located) are exempt — one reason embedded
solar is worth more than its raw capacity suggests. The reported average
energy cost is (fuel + carbon + new-build capex incl. the grid adder) ÷ grid
energy served — it still excludes existing-fleet capex, distribution and
retail costs, so it is *not* a tariff.

Demand, wind and solar profiles are currently **synthetic but calibrated**
(shape parameters fitted to the reference points above). Replacing them with
actual Eskom Data Portal hourly data is the next milestone; the ingestion
pipeline (`scripts/build_profiles.py`) is already in the repo.

## Limitations — read before quoting results

- **Single node.** Transmission is schematic only; no network *constraints*.
  New-build transmission *cost* is approximated by the grid expansion adder,
  but the model cannot see that grid capacity in the Cape provinces is a
  binding physical constraint on where and how fast renewables can connect.
- **No unit commitment or reserves.** Coal has no minimum-stable-generation or
  ramping constraints; no operating reserve margin is enforced. This makes the
  model slightly optimistic in tight hours.
- **Storage dispatches with simple heuristics**, not optimisation.
- **Monte Carlo varies outages only.** Weather and demand noise are held fixed
  across the 60 runs; real years also vary in weather. Bands understate total
  uncertainty.
- **Costs are indicative** and the cost metric is not a tariff (see above).
- **Synthetic profiles** until the real-data milestone lands.

For decision-grade capacity-expansion analysis, use
[PyPSA-RSA](https://github.com/MeridianEconomics/pypsa-rsa) (Meridian
Economics), which co-optimises investment and dispatch at up to 159-node
spatial resolution with validated input data. GridTwin ZA is deliberately the
opposite trade-off: instant, transparent, and simple enough to reason about.

## Repository

```
index.html                  the entire app (no build step, no dependencies)
scripts/build_profiles.py   Eskom CSV -> profiles.json ingestion pipeline
```

The app is a single self-contained HTML file: vanilla JS, custom canvas
charts, no frameworks, no trackers. Fork it, view source, or open an issue.

### Sharing scenarios

Slider settings are written to the URL. Copy the address bar (or use the
"Copy scenario link" button) to share an exact configuration. Append
`&embed=1` for a chrome-reduced version suitable for iframes.

## Roadmap

1. ~~Monte Carlo outage risk~~ ✅
2. Real Eskom hourly demand / wind / PV profiles (ingestion script ready)
3. 10-region model on the GCCA Eskom transmission supply regions, with
   transfer limits — making the map show flows
4. Precomputed PyPSA-RSA least-cost scenarios as loadable presets

## Licence & disclaimer

MIT licence — reuse freely with attribution.

This is an educational scenario explorer. All outputs are indicative and it is
not planning, investment or operational advice. Not affiliated with Eskom,
the NTCSA, or Meridian Economics.
