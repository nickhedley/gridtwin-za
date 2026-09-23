# GridTwin ZA - source register

Every external source, how often it publishes, which edition is currently loaded,
and what it feeds. A refresh should be a mechanical check against this table, not
an act of memory.

When a new edition lands: replace the whole block, re-derive, then delete
superseded queue entries. Never add the delta. See rules.md.

---

## Currently loaded

| source | cadence | edition loaded | feeds |
|---|---|---|---|
| IPP Office, *An Overview - ipppp* | quarterly | Q4 2025/26, as at 31 Mar 2026, p.18 | `by_source.reipppp`, both identities |
| Power Futures Lab, UCT GSB, IPP monitor | half-yearly | H1 2026 | `by_source.private`, `pfl_cod_h1_2026.json` |
| Ember, South Africa electricity | monthly-ish | 2025 full year + 12m to May 2026 | `validate_benchmarks.js` |
| PyPSA-RSA fleet, `fleet_by_region_v2.csv` | static | 51 BASE plants | per-unit UC parameters, GPS, heat rates. Capacity-weighted coal CO2 1.008 t/MWh against our 1.04. THERMAL ONLY - not the wind/solar plant list |
| Renewables.ninja / MERRA-2 | static | 2014-2023, ten weather years | `profiles_regional_multiyear.json` |
| PVGIS SARAH2 v5.2 | static | 739-point grid, 0.5 deg | `sa_solar_grid.json` - orphan, unused |
| CSIR least-cost study (plexos) | occasional | as cited in `validate_external.js` | external comparison, 2030 coal share |
| Eskom weekly system status | weekly | drift detector only | `validate_capacity.js` |
| Eskom hourly dataset ESK19679 | on request | Apr 2022 - Aug 2026, 38,736 h | curtailment estimate. Separates Wind, PV, CSP, Other RE with installed capacity per technology. Wind installed peaks at 4,143 MW, matching the REIPPPP-only fleet - it EXCLUDES wheeled plant |
| Eskom hourly dataset ESK19243 | on request | calendar 2025 | OCGT seasonality. Superseded for most purposes by ESK19679 |
| SAPVIA NERSA Registered Plants Dashboard | rolling | Q1 2026/27, as at 24 Aug 2026 | `nersa_registrations.json` — the cumulative series |
| NERSA media statements | quarterly | Q1 2026/27 | the quarterly figures in the same file — a different source for a different scope |
| DFFE REEA | rolling | 2,597 authorisations | permits, not commissioning. Used for profile SITE LOCATIONS (build_profile_sites.py) and | `reea_projects.json` - permits, not commissioning |
| DFFE REEA, grid-language subset | derived | 161 of 2,597 | `private_grid_candidates.json` - candidate private grid assets |
| Eskom TDP | annual | 2025-2034 edition | `tdp_projects.json`; also underpins the storage and transmission capex constants |
| Revised Electricity Pricing Policy | one-off, for comment | Gazette 55257, gn 7852, 28 Aug 2026 | the price-component mapping in results.md; submission made 27 Sep |
| NERSA Wholesale Electricity Pricing Methodology | consultation | May 2026 | independent cross-check on the price-component mapping; names balancing costs, which GridTwin lacks |
| NERSA Trading Rules | consultation, v3 | June 2026; comments extended to 28 Sep 2026 (dashboard Issue 04) | governs wheeling and trading - see calendar |
| Renewables.ninja / MERRA-2, regional | static | 2014-2023, ten years | `profiles_regional_multiyear.json` via `weatherYearNational()` - capacity-weighted, bias-corrected 0.848 |
| Form Energy / Google / Xcel transaction | one-off | 30 GWh, ~usd 77/kWh pre-incentive | `acapIronAir` 12,940 R/kW-yr |
| Eskom Tubatse pumped storage | one-off | R35.9bn, 1.5 GW / 21 GWh, jet plan | `acapPs` 2,360 R/kW-yr |
| DFFE REEA, Red Cap / Impofu | rolling | as at last ingest | the Impofu and Koruson connector endpoints in `transmission_lines.geojson` |

| SolarAfrica SunCentral | one-off | 342 MW energised of a planned 1 GW | candidate against the 1,823 MW unexplained solar in identity 3 — not loaded, press report only |
| Aurora Energy Research | occasional | 2060 outlook, Aug 2026 | independent corroboration of the no-gas frontier: >120 GW new capacity |
| AEMO Engineering Roadmap / Transition Plan for System Security | annual | FY26 roadmap, Sep 2026 | the syncon and grid-forming findings in results.md; the roadmap merges into the TPSS from Dec 2026 |
| NTCSA MYPD 6 revenue application, Table 10 | three-yearly | FY2026-FY2028, Aug 2024 | what the System Operator pays for ancillary services: reserves R1,445m, demand response R521m, reactive power R468m, system restoration R376m in FY2026. Behind asReserveRMWh and asVoltagePotRm |
| GB ancillary contract outcomes (NESO pathfinders, ORPS, stability market) | rolling | as at 2026 | the only prices a battery has actually been paid for voltage and stability: Capenhurst GBP 2,600/MW-yr, ORPS about GBP 1,500, stability GBP 5,000-25,000. Behind asVoltageRMWyr and a cross-check on asInertiaRkWyr |
| Eskom cost-to-serve study | occasional | 2024/25, Table 41 | the residential allocation factors in the retail panel: generation 1.258, new transmission 1.361, network and retail 4.021 (C12 urban residential against the system average) |
| Eskom TDP 2024, Table 4 | annual | 2024 edition | generation integration is 51% of the first five years' R112.5bn, R225bn for 46.9 GW = R4,800/kW = `txRPerKWyr` 402 |
| PNNL Grid Energy Storage Technology Cost and Performance Assessment | occasional | 2019 | iron-air and vanadium fixed O&M at USD 10/kW-yr, R165. NOT chemistry-specific: PNNL gives one figure for all battery chemistries |
| NTCSA Medium Term System Adequacy Outlook | annual | 2026-2030 | the external adequacy comparison in `validate_external.js`: the risk-adjusted 2030 case, more than 4 TWh unserved and OCGT near 45% |
| Deakin et al., *Comparing Generator Unavailability Models with Empirical Distributions* | one-off | 2022 | the published repair-time figures rejected for this fleet (40 h for coal, after Edwards 2017) and the persistence evidence behind `outageMttrH` 480 |
| NREL, *Operating Reserves and Variable Generation* (TP-5500-51978) | one-off | 2011 | the 3+5 rule behind `reserveVrePct` 5: the regulating requirement scales at 5% of variable generation |
| NREL, *Cost Projections for Utility-Scale Battery Storage* | annual | 2025 update (docs 93281) | the power and energy split behind `BATT_POWER_SHARE` 0.278: USD 241/kWh of energy and about USD 372/kW of power in 2024 |
| GridLab / Energy Futures Group / Halcyon, gas turbine costs | one-off | Sep 2025 | `BLD_COST.ccgt` R34,965/kW = USD 2,119: recent combined-cycle projects routinely at USD 2,000/kW or more against USD 1,116-1,427 for 2026-27 completions |
| South African storage procurement | rolling | as at Sep 2026 | the build-pace judgement: BESIPPPP three windows 1,744 MW/6,976 MWh, RMIPPPP hybrid 600 MW, Eskom's own 343 MW - about 0.6-0.7 GW a year against the 2 GW the default pace assumes |
| Eskom hourly dataset ESK19679, coal availability trace | on request | 2023, 2024, 2025 | `nodal/coal_availability_trace.json`: measured coal-only availability by hour, divided by each year's mean, for `outageTraceYear` |
| IRP 2025 | occasional | gazetted Oct 2025 | the `IRP path 2035` preset's build, interpolated between the published 2030 targets and the 2039 totals; and the emissions comparison, about 160 Mt for 2030 |
| amaBhungane, Eskom station-by-station data | one-off | Feb 2026 | independent corroboration of the fleet-to-coal availability conversion: coal 58% in 2025 against the fleet's 62%, which implies non-coal availability of 89.9% against the 90% assumed |
| Household consumption references | one-off | 2024 | the two reference households in the bill view: Eskom's own 30 kWh a day, and about 190 kWh a month for the average electrified household (Eskom residential demand over Statistics South Africa's household count, as MyBroadband calculated it) |
| GCCA Annexure A substation limits | annual | as at 2026 | not yet loaded: the per-substation connection limits behind regional congestion, for the nodal work |
| CSIR systems analysis technical report | occasional | as cited | least-cost installed capacity ranges by 2030 and 2050, the band check in `validate_external.js` |
| Firm-dispatchable generation in South Africa (arXiv 2403.15037) | one-off | 2024 | independent renewable-based build: 49 GW wind, 14 GW solar, 24 GWh storage, 15 GW firm at 5% utilisation, 12.9 GW baseload retained |

| Eskom annual results and integrated report | annual | FY2026, **as at 31 March 2026** | EAF calibration, the `reShareResid` benchmark, fleet nominal capacity and the audited energy balance. year-end snapshot: the renewable register here runs to 30 June 2026, so three months sit on one side of any comparison and not the other |

## Watched, not yet loaded

| source | why it matters | status |
|---|---|---|
| IPP Office annual *Overview of the ipppp* | the only route to project names; the quarterly is aggregate throughout | needed for the Hydra Central split |
| PFL IPP Knowledge Hub COD table | settles Mulilo Total Hydra's COD month | deep links 404; navigate Research > Knowledge Hub |
| CSIR REEA database | would replace estimated rooftop and permit data | requested; DFFE `Reapplication@dffe.gov.za` is the better route |
| SSEG registration rules | would replace estimated rooftop with measured | pending |
| Seriti Green monthly simulation | independent SA grid model, published monthly since Jan 2026 | first read Aug 2026; differential test, not a validation set |
| Oxpeckers | complementary project data | their data is a validation set |
| #PowerTracker | primary source for wheeled commissioning | identified 17 Aug 2026 |
| Independent Transmission Infrastructure Procurement Programme (ITIPP) | private capital funds, builds and transfers grid to the state; Impofu and Nuweveld are the working precedents | not yet tracked. Private transmission is a category the model does not represent - it assumes NTCSA builds the network |
| NREL ATB | storage capex cross-check | checked 28 Aug 2026 and it cannot do the job: ATB covers lithium only, with no flow-battery or iron-air line. `acapVrfb` stays single-source |
| NERSA Electricity Regulation Projects Dashboard | the consolidated view of every NERSA consultation - written-comment deadlines, hearing dates and target completions in one table | Issue 04, September 2026, last updated 15 Sep 2026 (read 22 Sep). Appears roughly monthly at `nersa.org.za/files/files/YYYY/MM/ELRStakeholderDashboard-RevN.png`. Reading it on 31 Aug corrected a Trading Rules date this project had wrong by a month, and surfaced four consultations not previously tracked. Check it every session. |
| PFL IPP Knowledge Hub COD table | settles Mulilo's COD month | deep links 404; navigate Research > Knowledge Hub |
| NERSA Trading Rules | governs how wheeling and trading clear | comment due 28 Sep 2026; the locational work is directly reusable |
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
provincial aggregate, so absence from the named files is not evidence it is
already counted.

**Eskom sales, the observed series.** The figures were removed from the demand slider note
on 2 Sep 2026 when it was shortened; the note keeps the direction ("demand has been
declining in recent years") and this is where the numbers behind it live.

```
FY2012   224+ TWh     the peak
FY2024   183.3 TWh
FY2025   189.7 TWh
FY2026   178.0 TWh    a 6.2% fall, industrial demand down 22.5%
```

The decline runs from FY2012, not from a recent turn - Eskom has reported falling sales for
more than ten years against a 2012 peak above 224 TWh (Mining Weekly, 31 Aug 2026). FY2025
was higher than FY2024, so it is a TREND rather than a year-on-year fall, which is why the
slider note says "since 2012" and not "every year". Eskom attributes FY2026 to weaker
industrial demand, embedded self-generation and energy efficiency.

Eskom targets stabilisation at 178 TWh. **The recent trend is DOWN**, so any positive
setting on the demand growth slider is a forward assumption rather than an extrapolation.
Relevant whenever a demand-growth scenario is quoted.

**Northern Cape exports by day and imports by night.** The regional profiles show the Northern
Cape exporting through the middle of the day and importing after dark, which is what a
solar-heavy region with little local demand does. Nothing asserts it yet; it is the natural
first regional validation test when the nodal work resumes, because it is a pattern the data
must reproduce rather than a number to calibrate.

**Captive capacity is deliberately excluded.** 88 MW in the H1 2026 monitor. It
sits behind the meter and suppresses demand rather than adding supply.

**Projects commissioned before the as_at date sit inside provincial aggregates**
and will never appear by name. Absence from the named files is expected for
those. This logic applies to public projects only - see the first note.

**RMIPPPP** contributes about 225 MW of contracted operational capacity across
Northern Cape, Eastern Cape and Western Cape. The report names the three
provinces but gives no split, so it sits outside the regional file.
`by_source.rmipppp` now exists to hold it when a split is published.

**ERA5 versus SARAH2.** The code's own comment records Open-Meteo ERA5
overestimating solar by 10 to 15% against SARAH2's roughly 5%. Relevant when
comparing against any study built on an ERA5 composite.


---

## Original source notes, carried across verbatim

**IPP Office** — https://www.ipp-projects.co.za/Publications/
Quarterly *"An Overview – ipppp"* reports. The current data is from **Q4 2025/26, as at
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
DATA FILES in nodal/ are CC BY 4.0 — attribution only. Changed 6 Sep 2026: they are a
compilation of uncopyrightable facts, and NC-ND blocked both reuse and the ingestion of
BY-SA sources.*
Data files carry their own terms — see sources.md. Model outputs are reproducible from
the scenarios stated; nothing here is a tariff, a forecast, or investment advice.*
