# GridTwin ZA - source register

Every external source, how often it publishes, which edition is currently loaded,
and what it feeds. A refresh should be a mechanical check against this table, not
an act of memory.

When a new edition lands: replace the whole block, re-derive, then delete
superseded queue entries. Never add the delta. See RULES.md.

---

## Currently loaded

| source | cadence | edition loaded | feeds |
|---|---|---|---|
| IPP Office, *An Overview - IPPPP* | quarterly | Q4 2025/26, as at 31 Mar 2026, p.18 | `by_source.reipppp`, both identities |
| Power Futures Lab, UCT GSB, IPP monitor | half-yearly | H1 2026 | `by_source.private`, `pfl_cod_h1_2026.json` |
| Ember, South Africa electricity | monthly-ish | 2025 full year + 12m to May 2026 | `validate_benchmarks.js` |
| Renewables.ninja / MERRA-2 | static | 2014-2023, ten weather years | `profiles_regional_multiyear.json` |
| PVGIS SARAH2 v5.2 | static | 739-point grid, 0.5 deg | `sa_solar_grid.json` - orphan, unused |
| CSIR least-cost study (PLEXOS) | occasional | as cited in `validate_external.js` | external comparison, 2030 coal share |
| Eskom weekly system status | weekly | drift detector only | `validate_capacity.js` |
| SAPVIA NERSA Registered Plants Dashboard | rolling | Q1 2026/27, as at 24 Aug 2026 | `nersa_registrations.json` — the CUMULATIVE series |
| NERSA media statements | quarterly | Q1 2026/27 | the QUARTERLY figures in the same file — a different source for a different scope |
| DFFE REEA | rolling | 2,597 authorisations | `reea_projects.json` - permits, not commissioning |
| DFFE REEA, grid-language subset | derived | 161 of 2,597 | `private_grid_candidates.json` - candidate private grid assets |
| Eskom TDP | annual | 2025-2034 edition | `tdp_projects.json`; also underpins the storage and transmission capex constants |
| Revised Electricity Pricing Policy | one-off, for comment | Gazette 55257, GN 7852, 28 Aug 2026 | the price-component mapping in RESULTS.md; submission made 27 Sep |
| NERSA Wholesale Electricity Pricing Methodology | consultation | May 2026 | independent cross-check on the price-component mapping; names balancing costs, which GridTwin lacks |
| NERSA Trading Rules | consultation, v3 | June 2026, comments closed 28 Aug | governs wheeling and trading; comment window missed - see CALENDAR |
| Renewables.ninja / MERRA-2, regional | static | 2014-2023, ten years | `profiles_regional_multiyear.json` via `weatherYearNational()` - capacity-weighted, bias-corrected 0.848 |
| Form Energy / Google / Xcel transaction | one-off | 30 GWh, ~USD 77/kWh pre-incentive | `acapIronAir` 12,940 R/kW-yr |
| Eskom Tubatse pumped storage | one-off | R35.9bn, 1.5 GW / 21 GWh, JET plan | `acapPs` 2,360 R/kW-yr |
| DFFE REEA, Red Cap / Impofu | rolling | as at last ingest | the Impofu and Koruson connector endpoints in `transmission_lines.geojson` |

| SolarAfrica SunCentral | one-off | 342 MW energised of a planned 1 GW | candidate against the 1,823 MW unexplained solar in identity 3 — NOT loaded, press report only |
| Aurora Energy Research | occasional | 2060 outlook, Aug 2026 | independent corroboration of the no-gas frontier: >120 GW new capacity |

## Watched, not yet loaded

| source | why it matters | status |
|---|---|---|
| IPP Office annual *Overview of the IPPPP* | the only route to project NAMES; the quarterly is aggregate throughout | needed for the Hydra Central split |
| PFL IPP Knowledge Hub COD table | settles Mulilo Total Hydra's COD month | deep links 404; navigate Research > Knowledge Hub |
| CSIR REEA database | would replace estimated rooftop and permit data | requested; DFFE `Reapplication@dffe.gov.za` is the better route |
| SSEG registration rules | would replace estimated rooftop with measured | pending |
| Seriti Green monthly simulation | independent SA grid model, published monthly since Jan 2026 | first read Aug 2026; differential test, NOT a validation set |
| Oxpeckers | complementary project data | their data is a validation set |
| #PowerTracker | primary source for wheeled commissioning | identified 17 Aug 2026 |
| NREL ATB | storage capex cross-check | checked 28 Aug 2026 and it cannot do the job: ATB covers lithium only, with no flow-battery or iron-air line. `acapVrfb` stays single-source |
| PFL IPP Knowledge Hub COD table | settles Mulilo's COD month | deep links 404; navigate Research > Knowledge Hub |
| NERSA Trading Rules | governs how wheeling and trading clear | comment due 30 Sep 2026; the locational work is directly reusable |
| #PowerTracker | primary source for wheeled commissioning | identified 17 Aug 2026, not yet ingested |

---

## Contacts

```
Power Futures Lab      pflenquiry.gsb@uct.ac.za
DFFE reapplications    Reapplication@dffe.gov.za
IRENA ltes Network     ltes@irena.org
IPP Office             https://www.ipp-projects.co.za/Publications/
```

---

## Notes that keep biting

**The IPP Office covers REIPPPP and RMIPPPP only.** No private, no wheeled, no
captive, no Eskom-owned. A private wheeled project can never appear in a
provincial aggregate, so absence from the named files is NOT evidence it is
already counted.

**Captive capacity is deliberately excluded.** 88 MW in the H1 2026 monitor. It
sits behind the meter and suppresses demand rather than adding supply.

**Projects commissioned before the as_at date sit inside provincial aggregates**
and will never appear by name. Absence from the named files is expected for
those. This logic applies to public projects only - see the first note.

**RMIPPPP** contributes about 225 MW of contracted operational capacity across
Northern Cape, Eastern Cape and Western Cape. The report names the three
provinces but gives no split, so it sits OUTSIDE the regional file.
`by_source.rmipppp` now exists to hold it when a split is published.

**ERA5 versus SARAH2.** The code's own comment records Open-Meteo ERA5
overestimating solar by 10 to 15% against SARAH2's roughly 5%. Relevant when
comparing against any study built on an ERA5 composite.


---

## Original source notes, carried across verbatim

**IPP Office** — https://www.ipp-projects.co.za/Publications/
Quarterly *"An Overview – IPPPP"* reports. The current data is from **Q4 2025/26, as at
31 March 2026**; page 18 carries capacity online and in construction by province and
technology, which is the table the rebuild is built on. Covers REIPPPP and RMIPPPP
**only** — no private or wheeled capacity. The quarterly gives no project names; the
annual overview does.

**Power Futures Lab, UCT GSB** — Alao, O. & Kruger, W. (2026). *South African IPPs:
financial close and commercial operations monitor, H1 2026 update.* H1 2026 saw 1,920 MW
reach commercial operation — 874 MW grid supply, 958 MW wheeled, 88 MW captive. The
captive capacity is deliberately excluded from installed capacity: it sits behind the
meter and suppresses demand rather than adding supply. Knowledge Hub:
https://powerfutureslab.co.za — deep links 404; navigate via Research → Knowledge Hub,
or email pflenquiry.gsb@uct.ac.za The extracted H1 2026 table is committed as
`nodal/pfl_private_h1_2026.json`; `build_capacity.py` reads it and asserts its regional
split sums to its own stated total.

---

---

## Sources used for constants, not for data files

These do not populate a JSON file, but a number in `FIXED` rests on each. Changing the
source means changing the constant, so they belong in this register.

```
Eskom TDP 2025-2034      14,500 km + 210 transformers for 56 GW at >R390bn
                         = R6,964/kW overnight, 40-yr life at 8% -> R584/kW-yr.
                         Validates txRPerKWyr 600 as a national AVERAGE.
                         The locational spread around it (R150 Gauteng to R735 Hydra
                         Central) comes from the corridor graph, not from the TDP.
Form Energy transaction  USD ~77/kWh PRE-incentive (the ~33 figure is after US 45X
                         credits, which South Africa does not get) -> acapIronAir.
Vanadium turnkey range   USD 450/kWh at 8h, 25-yr life -> acapVrfb 5,565.
                         Single SOURCE. NREL ATB cannot corroborate it. Vanadium price
                         swings alone moved systems 45-120/kWh over 2025-26, so treat
                         +/-20% as the honest band.
Tubatse                  R35.9bn for 1.5 GW (JET plan, 2022 rands), escalated four
                         years at SA CPI -> R29,200/kW, 60-yr civil life -> acapPs.
Carbon Tax Act Phase 2   R308/t headline from 1 Jan 2026, generation allowances up to
                         85% -> carbonTaxRPerT 46. SEE CALENDAR: a suspension was under
                         consideration and NERSA has disallowed tariff recovery to 2030.
FX                       R16.50/USD, 180-day trailing average to 26 Aug 2026 (range
                         15.90-17.25; spot 15.97). A period average, deliberately - a
                         capital constant must not move 8% on a currency tick.
                         Supersedes the R16.21 and R16.80 used elsewhere in the file.
```

## Sources consulted and rejected

Recording these so they are not re-investigated.

```
NREL ATB                 for vanadium and iron-air: covers lithium ONLY. Its 2024
                         anchor of USD 334/kWh for 4h lithium in the US is a useful
                         cross-check on acapBatt4h (~USD 194/kWh implied) - the gap is
                         plausible, since South Africa buys Chinese rather than
                         US-installed - but it cannot speak to the other chemistries.
PyPSA-ZA cost comparison it CO-optimises investment and operation, so its "+20% for 95%
                         CO2 reduction" compares two optimised builds. GridTwin
                         dispatches a specified build. Not the same question; left out
                         of validate_external deliberately, with the reasoning in that
                         file so it is not re-added.
```

---

*GridTwin ZA. Code and documentation © 2026 Nick Hedley, released under CC BY-NC-ND 4.0.
Data files carry their own terms — see SOURCES.md. Model outputs are reproducible from
the scenarios stated; nothing here is a tariff, a forecast, or investment advice.*
