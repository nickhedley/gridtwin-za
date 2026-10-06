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
| PyPSA-RSA fleet (Meridian Economics), `fleet_by_region_v2.csv` | static | 51 BASE plants | per-unit UC parameters, GPS, heat rates. Capacity-weighted coal CO2 1.008 t/MWh against our 1.04. THERMAL ONLY - not the wind/solar plant list |
| Renewables.ninja / MERRA-2 | static | 2014-2025, twelve weather years | `profiles_regional_multiyear.json` |
| PVGIS SARAH2 v5.2 | static | 739-point grid, 0.5 deg | `sa_solar_grid.json` - orphan, unused |
| Meridian Economics, *A Vital Ambition* and the CSIR technical report behind it | one-off | Jul 2020 | the least-cost capacity band check in `validate_external.js`, and the directional comparison on gas in results.md |
| Meridian Economics, South Africa Power Market Report | annual | 2025 edition, summary only | corroboration that cheaper solar-plus-storage delays new peaking plant. The report and COMPASS behind it are commercial; only the published summary is used |
| CSIR least-cost study (plexos) | occasional | as cited in `validate_external.js` | external comparison, 2030 coal share |
| Eskom weekly system status | weekly | drift detector only | `validate_capacity.js` |
| NERSA renewable energy monitoring report | half-yearly | 2025, issue 27, March 2026 | curtailment: R402m deemed energy to 67 plants, low demand at night, about 1.0-1.6% of 17,808 GWh (no GWh published; derived from tariffs). Sets the 1.3% stopgap. H1 2024 was 19.9 GWh, 0.2% |
| NTCSA Weekly System Status Report, "Estimated Rooftop PV" monthly rows | weekly | 2026 w3 and w16; the 2025 rows agree in both | Backcast 2025 `rooftopMW` 6,532: the 2025 annual mean of the twelve monthly rows, 6,830.2, less 298.3 MW of wheeled solar the preset already carries in `pvUtilityMW` (2,600 less ESK19679's 2025 mean of 2,301.7). Basis: annual mean, calendar 2025 |
| Eskom hourly dataset ESK19679 | on request | Apr 2022 - Aug 2026, 38,736 h | curtailment estimate. Separates Wind, PV, CSP, Other RE with installed capacity per technology. Wind installed peaks at 4,143 MW, matching the REIPPPP-only fleet - it EXCLUDES wheeled plant |
| Eskom hourly dataset ESK19243 | on request | calendar 2025 | OCGT seasonality. Superseded for most purposes by ESK19679 |
| SAPVIA NERSA Registered Plants Dashboard | rolling | Q1 2026/27, as at 24 Aug 2026 | `nersa_registrations.json` — the cumulative series |
| NERSA media statements | quarterly | Q1 2026/27 | the quarterly figures in the same file — a different source for a different scope |
| DFFE REEA | rolling | 2,597 authorisations | permits, not commissioning. Used for profile SITE LOCATIONS (build_profile_sites.py) and | `reea_projects.json` - permits, not commissioning |
| DFFE REEA, grid-language subset | derived | 161 of 2,597 | `private_grid_candidates.json` - candidate private grid assets |
| Eskom TDP | annual | 2025-2034 edition | `tdp_projects.json`; also underpins the storage and transmission capex constants |
| Revised Electricity Pricing Policy | one-off, for comment | Gazette 55257, gn 7852, 28 Aug 2026 | the price-component mapping in results.md; submission made 27 Sep |
| NERSA Wholesale Electricity Pricing Methodology | consultation | May 2026 | independent cross-check on the price-component mapping; names balancing costs, which GridTwin lacks |
| Energy Council of South Africa, Electricity Wholesale Tariff Series, ch. 1-3 | one-off, 2026 (UK PACT-funded) | flip-book at energycouncil.org.za/insights/analysis/; PDFs held by the user | retail stack and the planned SAWEM transition basis (TODO 14af-14ai); no constant reads it yet |
| NERSA Trading Rules | consultation, v3 | June 2026; comments extended to 28 Sep 2026 (dashboard Issue 04) | governs wheeling and trading - see calendar |
| Renewables.ninja / MERRA-2, regional | static | 2014-2025, twelve years | `profiles_regional_multiyear.json` via `weatherYearNational()` - capacity-weighted, bias-corrected 0.848 |
| Form Energy / Google / Xcel transaction | one-off | 30 GWh, ~usd 77/kWh pre-incentive | `acapIronAir` 12,940 R/kW-yr |
| Eskom Tubatse pumped storage | one-off | R35.9bn, 1.5 GW / 21 GWh, jet plan | `acapPs` 2,360 R/kW-yr |
| Eskom Ingula pumped storage | one-off | R26.8bn reported, 1,332 MW / 21 GWh, built 2006-2017 (Engineering News, 2016) | cross-check on `bldPhesCostBasis` 'tubatse'; no constant reads it |
| DFFE REEA, Red Cap / Impofu | rolling | as at last ingest | the Impofu and Koruson connector endpoints in `transmission_lines.geojson` |

| SolarAfrica SunCentral | one-off | 114 MW of a 342 MW phase 1 energised 26 Aug 2026, not yet at commercial operation | pipeline, not capacity. Corrected 23 Sep 2026: an earlier entry here said 342 MW energised, which was wrong on the figure and the status |
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
| IEA, *Electrification* (special report) | one-off | 22 Sep 2026, CC BY 4.0 | the industrial electrification scenario: 40% of fossil low- and medium-temperature industrial heat is competitively electrifiable today, heat pumps deliver 3-5 units of heat per unit of electricity, global electrification rate 23% now to 35% by 2035 in the High Electrification Scenario |
| RMI, grid reliability guide and *Reliability Explored* | rolling | 2026 | the scope note in handover.md: reliability is adequacy, stability and resilience across bulk AND distribution; most outages originate on distribution; renewable deployment has not worsened US reliability outcomes |
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
| Global Energy Monitor, Global Wind and Solar Power Trackers | project-level status - announced, pre-construction, construction, operating - with coordinates, capacity and owner, updated twice a year, free for research. The nearest thing to RenewMap with South African coverage | to try: the Hydra Central split and the 1,823 MW of unexplained solar are both named-project problems |
| OpenStreetMap power plants | `plant:source=wind` or `solar` with output and construction tags, and geometry. Good for EXISTENCE and LOCATION, weak for status and dates: mappers follow imagery updates, and construction tags are often left behind after completion | to try, as geometry and corroboration alongside a structured source |
| RenewMap | the tool this project wants - status, capacity, grid connections, approvals, milestone history, CSV export - but AUSTRALIA AND NEW ZEALAND ONLY. Recorded as the model of what a South African equivalent would look like | not applicable, checked 23 Sep 2026 |

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

**NTCSA's weekly privately-procured solar PV table is the rooftop source, and the model already
uses it.** Confirmed 1 Oct 2026 from practitioners' own description, which matches the method in
the code: the weekly table, by province and nationally, covers EVERYTHING that is not REIPPPP or
RMIPPPP - wheeled utility plant and behind-the-meter rooftop, ground and roof mounted, residential
through mining. It is a measured figure, not an estimate, which makes it the best rooftop source
available; registration data is incomplete and will stay that way. Rooftop is obtained by
subtracting the known wheeled plant from it.

WHICH MEANS THE QUEUE BELOW IS A RECLASSIFICATION, NOT AN ADDITION. `FIXED.rooftopMW` 8,942.1 is
the August 2026 NTCSA figure less the 488 MW of wheeled solar in `by_source.private`, which covers
H1 2026 only. Every pre-2026 wheeled plant is therefore already inside the model, counted once, as
rooftop. Loading one moves capacity between buckets rather than adding it: add to
`by_source.private`, subtract the same figure from `rooftopMW`, in one commit. The totals are
right today and the two buckets are wrong by roughly 300 MW, rising to 414 with SunCentral 1.

The same subtraction applies to Backcast 2025, on its own year: 6,830.2 MW is the 2025 annual mean
of the monthly rows (Jan 6,177.5 to Dec 7,463.6), and the 298.3 MW taken off is the wheeled solar
the preset counts in `pvUtilityMW`. That 298.3 is implied by the preset's 2,600, whose own
derivation is not recorded. The previous 6,900 carried no date or basis.

Vetted 2 Oct 2026: the 298.3 does not hold up. ESK19679's Eskom-visible solar sat at 2,285 MW from
January to November 2025 and reached 2,510 in December; wind rose from 3,443 to 3,863. The preset's
2,600 and 3,900 sit just above those year-end values, so they read as year-end figures, not annual
means plus wheeled plant. Selemela (200 MW, Apr 2024) and Damlaagte (97.5 MW, 23 Aug 2025) total
297.5 at year-end but about 235 as a 2025 mean, so they do not explain the gap on the basis the
subtraction assumes. The preset now mixes an annual-mean rooftop with year-end utility capacity.

It also suggests an answer to the open question about `FIXED.pvUtilityMW` 3,271, which nobody can
source: it equals REIPPPP solar 2,783 plus the H1 2026 wheeled 488 exactly. That is a hypothesis
from arithmetic rather than a provenance, and the repo history is still what would confirm it.

**The private-project queue.** Six named projects observed from trade press now sit in
`nodal/private_pending_h2_2026.json`, deliberately NOT loaded: SunCentral 1 (114 MW, commercial
operation Oct 2026), Selemela (200 MW AC, Apr 2024), Damlaagte (97.5 MW, Aug 2025), Thakadu
(255 MW, 2027), Paarde Valley PV2 (120 MW, end 2026) and Discovery Green's 740 MW portfolio,
which is an aggregate rather than a plant and is there as a scale check only. 1,526 MW in total.
The file says what to do when the February 2027 monitor lands: replace `by_source.private` from
it, then delete whatever the monitor already carries. An entry the monitor omits is a question
for Power Futures Lab, not a licence to hand-edit.

**Pre-2026 private solar, and why the 1,823 MW gap is gone.** Checked 23 Sep 2026 against the
data file rather than against the note that described it. The solar identity BALANCES:

```
by_source          solar MW
REIPPPP               2,783
private                 488
Eskom                     0
rmipppp                   0
sum                   3,271  =  FIXED.pvUtilityMW 3,271
```

The 1,823 MW was measured when the constant read 4,974 and REIPPPP solar read 2,663. Both have
since been corrected, and the note describing the gap outlived the gap - which is the failure
mode state.md warns about in its own opening lines. Two turns of work today went into chasing
it before anyone checked the file.

WHAT IS STILL MISSING, and it is a different thing. by_source.private covers H1 2026 only, so
wheeled plant commissioned earlier is absent - not as an unexplained residual, but as capacity
nobody has counted:

```
Selemela 1 and 2, North West     256 MWp / 200 MW AC   COD 24 Apr 2024   SOLA for Tronox
Damlaagte, Free State                       97.5 MW    COD 23 Aug 2025   Mainstream for Sasol
```

Adding them BREAKS the identity unless the national constant rises with them, which is the right
question to settle first: 3,271 is a grid-supply figure, and Eskom's own series exclude wheeled
plant - ESK19679's installed wind matches the REIPPPP-only fleet exactly. If the constant shares
that boundary, the model is understating national solar by roughly 300 MW of named plant plus
whatever else predates the monitor. Load the plant and the constant in one commit, as rule 5 says.

NOT pre-2026, so not part of the identity question, but now LIVE and belonging in the capacity
file at the next rebuild:

```
SunCentral 1, between Hanover and De Aar, Northern Cape   114 MW
   COMMERCIAL OPERATION reached, reported 1 Oct 2026. Energised with its transmission
   infrastructure in August; financial close Feb 2025, R1.8bn, Investec and RMB. SolarAfrica,
   backed by African Infrastructure Investment Managers and Helios. 548,856 modules.
   ONE-TO-MANY WHEELING: the plant is allocated across multiple commercial and industrial
   customers rather than tied to a single offtaker, which is why it does not appear as any one
   company's PPA. SunCentral 2 is in late construction and 3 starts shortly, for 342 MW in
   phase one of a planned 1 GW.
Paarde Valley PV2, near De Aar                            120 MW
   Financial close Nov 2024, commercial operation targeted end of 2026. Still pipeline.
```

Two things to carry forward from SunCentral 1. It is a clean test of the energised-versus-COD
distinction this register records: energised in August, commercial operation announced six weeks
later, and only the second date puts capacity in the model. And the one-to-many model is a
category the private data does not currently represent - the PFL monitor counts wheeled capacity
by project, not by the number of offtakers behind it, so a plant like this is invisible in any
source that works from corporate PPA announcements.

Two traps that caught this list out. Wheeled projects are quoted in MWp where the model works in
MW AC - Selemela is 256 MWp and 200 MW AC, 22% apart. And ENERGISED is not COMMERCIAL OPERATION,
the same distinction that settled Mulilo Total Hydra's placement in August.

**Municipal retail, from Yelland's newsletter, Sep 2026.** Two figures the retail panel's
municipal path should carry. From 1 October 2026 City Power receives 70% of the City of
Johannesburg's electricity revenue within 48 hours under a new ring-fencing arrangement, which
means the CITY RETAINS 30% OF GROSS ELECTRICITY REVENUE - out of which City Power must cover
finance costs, Eskom purchases, staff, operations, maintenance, depreciation and reinvestment.
And municipal arrears to Eskom reached R120.26bn by July 2026, which Eskom projects could reach
R358bn by 2030/31 without intervention. Neither is in the model; the first is the more useful,
because it is a measurable wedge between what a Johannesburg household pays and what reaches the
distributor.

**Private pipeline, same source.** Scatec's 255 MW Thakadu solar is under construction for
commercial operation in 2027. Discovery Green reports more than 740 MW under construction across
50-plus business customers. GreenCape estimates 12.9 GW of investable new renewable generation to
2030, R161.2bn. The last is a useful external check on this model's build-rate assumptions: 12.9
GW over four years is about 3.2 GW a year across all technologies.

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
Ingula                   R26.8bn reported for 1,332 MW / 21 GWh, about 15.8 h (Engineering News,
                         2016); construction 2006-2017. R20,100/kW as reported; at the ~5.1% a
                         year implied by the Tubatse escalation, about R33,000/kW in 2026 rands,
                         about 42% above the unscaled atlas fit at 15.8 h (Tubatse: 28% at 14 h).
                         Supports the 'tubatse' basis. Approximate: spend is mixed-year nominal,
                         and unescalated it sits about 13% below the fit. Eleven years to build
                         against the optimiser's 2033 earliest pumped-hydro date (TODO 14z).
Carbon Tax Act Phase 2   R308/t headline from 1 Jan 2026, generation allowances up to
                         85% -> carbonTaxRPerT 46. SEE CALENDAR: a suspension was under
                         consideration and NERSA has disallowed tariff recovery to 2030.
FX                       R16.50/USD, 180-day trailing average to 26 Aug 2026 (range
                         15.90-17.25; spot 15.97). A period average, deliberately - a
                         capital constant must not move 8% on a currency tick.
                         Supersedes the R16.21 and R16.80 used elsewhere in the file.
```

## Energy Council of South Africa, Electricity Wholesale Tariff Series (2026)

Chapters 1-3, UK PACT-funded, on unbundling the wholesale tariff for SAWEM. Online as flip-books at
energycouncil.org.za/insights/analysis/. PDFs supplied by the user 6 Oct 2026 (ch. 1, 14 pp; ch. 2, 22 pp;
ch. 3, 22 pp; created 28 May 2026). No licence stated, so not committed to the repo. Searched, not yet
read in full: ch. 3 gives vesting contracts as usually lasting 5-7 years before phasing out (UK Pool,
Singapore NEMS, Chile), "but may be extended indefinitely", with volumes reduced under NERSA-approved
transition arrangements. It gives no starting vesting share.

```
At SAWEM launch      most volume trades under vesting contracts (two-way contracts for difference
                     between the central purchasing agency, Eskom Generation and distributors that are
                     market participants) and legacy contracts (Section 34 IPP PPAs)
Legacy charge        the difference between contract prices and the hourly market price, recovered
                     from all consumers
Vesting volumes      set quarterly by NERSA; shrink as the market matures, typically over 5-7 years
Wholesale tariff     seven parts: energy (time of use), generation capacity, legacy, transmission use
                     of system, losses, ancillary services, subsidies
Chapter 2            the 1980s transmission charging zones are now inverted relative to grid
                     constraints: support for the model's locational grid costs (TODO 14ai)
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
