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
| PyPSA-RSA fleet (Meridian Economics), `fleet_by_region_v2.csv`, public subset `nodal/fleet_units.csv` from build 2026-10-16c (section 'Fleet table: public slim file, private full original'; licence and our use: section 'PyPSA-RSA: licence and what we take', to confirm with Meridian) | static | 51 BASE plants | per-unit UC parameters, GPS, heat rates. Capacity-weighted coal CO2 1.008 t/MWh against our 1.04. THERMAL ONLY - not the wind/solar plant list. DECOMMISSIONING DATES UNSOURCED (checked 12 Oct 2026): one year per half-station, no commissioning dates, no source column; in the repository unchanged since 1 Oct 2026 apart from Camden, Grootvlei and Hendrina moved to 2030 in UC_FLEET on 4 Oct. PyPSA-RSA's public repository (github.com/MeridianEconomics/pypsa-rsa, commit 89872c1, 8 Apr 2026) has a documentation plant table with other dates (Tutuka 2040/2042, Kriel 2024/2028, Arnot 2027/2030) and a Coal_Flexibilisation workbook (scenarios/.../phased_decommissioning.xlsx) with the same station capacities as our file, whose ESKOM_2035 scenario matches our Tutuka (2030 to 2031) and Arnot's first date (2027) but not Kriel (2026 to 2031); neither states a source. Our dates are therefore a PyPSA-RSA schedule of unknown basis (identified 13 Oct 2026: the decommissioning dates of the 'conventional' sheet of Meridian's ME IRP 2024 workbook, scenarios/ME IRP 2024/sub_scenarios/fixed_technologies.xlsx, BASE rows, commit 89872c1: Meridian's scenario assumption, not an Eskom plan; c4's standing coal is bldCoalMW, every UC_FLEET unit with a date after the year, scaled to 39,692 MW in 2026, so c4 retires Tutuka* in 2030 and Tutuka** in 2031 as that workbook does), not IRP 2025's 50-year life (IRP plan p.24: Tutuka's 50-year life falls in 2031-2042, user) |
| Global Energy Monitor, Global Coal Plant Tracker (unit tables on gem.wiki) | one-off | read 12 Oct 2026 | Unit start years for the IRP-timing coal sensitivity (TODO 14cr; harness/coal_dates_irp2025.json on branch claude/c4-coalirp): Tutuka 1985, 1985, 1986, 1987, 1988, 1990; Lethabo 1985, 1986, 1987, 1987, 1989, 1990; Matimba 1987, 1987, 1988, 1989, 1990, 1991; Kendal 1988-1993; Majuba 1996-2001; Kriel 1976, 1976, 1977, 1978, 1979, 1979; Matla 1979, 1980, 1980, 1981, 1982, 1983; Duvha 1980, 1980, 1981 (unit 3, mothballed, not in our file), 1982, 1983, 1984; Kelvin operating Phase B units 1962-1969 (7 x 60 MW; our file has 2 units, 160 MW, given 1962 and 1964). Named stations' operating units by unit order: Arnot 1972, 1971, 1971, 1973, 1974, 1975; Camden 1968, 1967, 1967, 1967, 1967, 1968, 1969, 1969; Grootvlei 1973, 1970, 1969 (units 4-6 mothballed); Hendrina units 2, 4, 5, 6, 7, 10: 1971, 1970, 1971, 1973, 1974, 1977 (units 1, 3, 8, 9 mothballed). Used (rebuild, 12 Oct, commit 66819c2) to order units oldest first while the fleet tracks IRP 2025's total coal path from the plan's text (8 GW gone by the start of 2030, then 15 GW in equal steps at the starts of 2031-2042; Figure 3 could not be read here); the first build's start year + 50 for the five stations (plan p.24 gives only 2031-2042 for them as a group) is superseded. Nameplate of the four stations the IRP names for 2029-30: Arnot 2,352, Camden 1,600, Grootvlei 1,190 (590 mothballed), Hendrina 2,000 (800 mothballed), 7,142 MW with 1,390 mothballed, against 5,030 MW for the same stations in our file (5,249 before scaling to 39,692 MW). GEM's own 'planned retirement' column gives 2030 for Tutuka (all units, as c4 roughly does) and for the four named stations. LICENCE: gem.wiki content is CC BY-NC-SA 4.0 (attribution: Global Energy Monitor), share-alike; kept in its own file, out of CC BY files. Pages read through Firecrawl (gem.wiki and globalenergymonitor.org are not reachable from the container). IRP 2025 assumptions workbook checked first: no coal retirement input (sheets New Tech Properties, Economic Parameters, Learning Rates) |
| IRP 2025 Figure 3, total coal capacity (plan p.12, gazette p.23), digitised by Nick Hedley | one-off | read 13 Oct 2026 | The IRP-timing coal path for s_coalirp (TODO 14cr; harness/coal_dates_irp2025.json on branch claude/c4-coalirp, ee92b00): 50-year-life annual averages read off the figure's gridlines (it has no data labels) and scaled to our 39,692 MW base, accuracy about +-250 MW: 2026-28 39,692; 2029 37,064; 2030 32,388; 2031 30,839; 2032 29,324; 2033 27,886; 2034 26,403; 2035 26,029; 2036 25,350; 2037 23,415; 2038 21,819; 2039 19,825; 2040 17,958 MW. Units retire to track it: Camden, Hendrina, Grootvlei and Arnot (plan p.40) first, then every other unit, oldest first by GEM start year (row below), within half a unit each year. Replaces the text-based path of 12 Oct (8 GW by 2030, then 15 GW in equal steps from 2031), which the reading supersedes |
| IRP 2025 Figure 3, 60-year (delayed shutdown) line, digitised by Nick Hedley | one-off | read 13 Oct 2026 | The delayed-shutdown coal path for s_coal60 (harness/coal_dates_irp2025_60y.json on branch claude/c4-coalirp, 53e9ba8): annual averages scaled to our 39,692 MW base, accuracy about +-250 MW: as the 50-year line to 2035, then 2036 26,116; 2037-2040 26,069 MW. Same closure order and rule as the 50-year file; no unit retires in 2036-40 (fleet 25,916 MW) |
| Lead to check (user, 13 Oct 2026): Exxaro's coal supply contract for Matla | to check | given 13 Oct 2026 | Mining Weekly, 2 April 2026, as given by the user (not read here): the contract runs to 30 November 2043, against Matla's 2034 end date from the environment department's emissions decision (sourced schedule, row below). Check before the next central (TODO 14cu) |
| Lead to check (user, 13 Oct 2026): Eskom's coal-site repowering plans | to check | given 13 Oct 2026 | Oxpeckers #PowerTracker, April 2026, citing Eskom, as given by the user (not read here): repowering at coal sites, including 1,000 MW of gas at Kriel. Check before the next central (TODO 14cu) and against the gas build options |
| Coal decommissioning, sourced schedule (user, 13 Oct 2026; for the next central, TODO 14cu, and s_coalirp's closure order) | occasional | given 13 Oct 2026 | (1) Arnot, Camden, Grootvlei, Hendrina and Kriel phased from 2029, none past 31 March 2030: 5.26 GW in 2029 and 3.14 GW more by March 2030 (NTCSA Medium-Term System Adequacy Outlook 2026-2030, pp.17-19). (2) Duvha by 21 February 2034 and Matla by 20 July 2034, both phased (environment department decision on Eskom's emissions applications, 31 March 2025; Transmission Development Plan 2024). (3) Tutuka, Lethabo, Matimba, Kendal and Majuba at 50-year life by unit, from GEM unit start years (IRP 2025 plan pp.12, 23, 24): Tutuka and Lethabo 2035-2040, Matimba 2037-2041, Kendal 2038-2043, Majuba 2046-2051. (4) Komati closed 2022. Page references as given by Nick; the documents were not read here. Capacity basis: (1) totals 8.40 GW, against 7,889 MW for the same five stations in our fleet file (7,561 MW scaled to 39,692) and 8,752 MW operating nameplate on GEM (10,142 MW with mothballed units) |
| Kelvin power station (Ekurhuleni; not an Eskom station) | static | checked 13 Oct 2026 | In our fleet file (UC_FLEET, PyPSA-RSA fleet_by_region_v2.csv) as 2 units, 160 MW, decommissioned 2027 (no source given there). Eskom's 39,692 MW (integrated report FY2026, FIXED.coalInstalledMW) is Eskom's own fleet and excludes Kelvin, but the build LP scales the whole fleet file (41,416 MW in 2026, Kelvin included) to 39,692 MW, so Kelvin sits inside the modelled total as 153 MW in place of the same amount of Eskom plant. GEM lists 7 operating Phase B units (420 MW, 1962-1969) with planned retirement 2026. s_coalirp's 2030 date for Kelvin comes from its closure rule (oldest first after the named stations), not from a source; no primary source dates Kelvin's closure |
| Renewables.ninja / MERRA-2 | static | 2014-2025, twelve weather years | `profiles_regional_multiyear.json` |
| PVGIS SARAH2 v5.2 | static | 739-point grid, 0.5 deg | `sa_solar_grid.json` - orphan, unused |
| Meridian Economics, *A Vital Ambition* and the CSIR technical report behind it | one-off | Jul 2020 | the least-cost capacity band check in `validate_external.js`, and the directional comparison on gas in results.md |
| Meridian Economics, South Africa Power Market Report | annual | 2025 edition, summary only | corroboration that cheaper solar-plus-storage delays new peaking plant. The report and COMPASS behind it are commercial; only the published summary is used |
| CSIR least-cost study (plexos) | occasional | as cited in `validate_external.js` | external comparison, 2030 coal share |
| Eskom weekly system status | weekly | drift detector only | `validate_capacity.js` |
| NERSA renewable energy monitoring report | half-yearly | 2025, issue 27, March 2026 | curtailment: R402m deemed energy to 67 plants, low demand at night, about 1.0-1.6% of 17,808 GWh (no GWh published; derived from tariffs). Sets the 1.3% stopgap. H1 2024 was 19.9 GWh, 0.2% |
| NTCSA Weekly System Status Report, "Estimated Rooftop PV" monthly rows | weekly | 2026 w3 and w16; the 2025 rows agree in both | Backcast 2025 `rooftopMW` 6,532: the 2025 annual mean of the twelve monthly rows, 6,830.2, less 298.3 MW of wheeled solar the preset already carries in `pvUtilityMW` (2,600 less ESK19679's 2025 mean of 2,301.7). Basis: annual mean, calendar 2025 |
| Eskom hourly dataset ESK19679 | on request | Apr 2022 - Aug 2026, 38,736 h | profiles.json (2025 hourly demand, wind_pu, solar_pu, csp_pu: build_demand_2026.py, rebuild_national_profiles.py), wind bias correction (bias_correct_wind.py), the coal availability trace (row below), the imports constant in nodal_engine.js, night thermal and pumping comparisons, and the validators (validate_weather, validate_benchmarks). No curtailment estimate has been made from it (corrected 12 Oct 2026, 14bw; the row said it fed one): the 2025 curtailment benchmark comes from NERSA's deemed-energy payments. Separates Wind, PV, CSP, Other RE with installed capacity per technology. Wind installed peaks at 4,143 MW, matching the REIPPPP-only fleet - it EXCLUDES wheeled plant |
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
| Renewables.ninja / MERRA-2, regional | static | 2014-2025, twelve years | `profiles_regional_multiyear.json` via `weatherYearNational()` - capacity-weighted; wind bias-corrected x1.0753 in the file (6 Sep 2026: fleet-weighted mean matched to Eskom's observed 2022-2023 output; the earlier 0.848 factor in weatherYearNational is retired, WIND_BIAS = 1.0) |
| Form Energy / Google / Xcel transaction | one-off | 30 GWh, ~usd 77/kWh pre-incentive | `acapIronAir` 12,940 R/kW-yr |
| Eskom Tubatse pumped storage | one-off | R35.9bn, 1.5 GW / 21 GWh, jet plan | `acapPs` 2,360 R/kW-yr |
| Eskom Ingula pumped storage | one-off | R26.8bn reported, 1,332 MW / 21 GWh, built 2006-2017 (Engineering News, 2016) | cross-check on `bldPhesCostBasis` 'tubatse'; no constant reads it |
| DFFE REEA, Red Cap / Impofu | rolling | as at last ingest | the Impofu and Koruson connector endpoints in `transmission_lines.geojson` |

| SolarAfrica SunCentral | one-off | SunCentral 1, 114 MW: commercial operation September 2026 (user, 12 Oct 2026). SunCentral 2 nearing completion. 342 MW is phase one's planned total (SunCentral 1 to 3), not energised capacity: only 114 MW is confirmed | SunCentral 1 belongs in the private capacity at the next rebuild; 2 and 3 stay pipeline. Corrected 23 Sep 2026 (342 MW energised was wrong) and 12 Oct 2026 (commercial operation in September, not pending) |
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
| GridLab / Energy Futures Group / Halcyon, gas turbine costs | one-off | Sep 2025 | `BLD_COST.ccgt` R34,965/kW = USD 2,119: recent combined-cycle projects routinely at USD 2,000/kW or more against USD 1,116-1,427 for 2026-27 completions. Flat in real terms (decl 0) from c4 (12 Oct 2026; commit 86bfea4). GridLab states no escalation rate: its 2% (p.5, footnotes 5-6) is general inflation, used to put EIA and NREL figures into nominal 2030 dollars. GridLab costs are nominal, in-service-year dollars, so R34,965/kW may sit a few percent above a 2026 real basis (user, 12 Oct 2026) |
| South African storage procurement | rolling | as at Sep 2026 | the build-pace judgement: BESIPPPP three windows 1,744 MW/6,976 MWh, RMIPPPP hybrid 600 MW, Eskom's own 343 MW - about 0.6-0.7 GW a year against the 2 GW the default pace assumes |
| Eskom hourly dataset ESK19679, coal availability trace | on request | 2023, 2024, 2025 | `nodal/coal_availability_trace.json`: measured coal-only availability by hour, divided by each year's mean, for `outageTraceYear` |
| IRP 2025 | occasional | gazetted Oct 2025 | the `IRP path 2035` preset's build, interpolated between the published 2030 targets and the 2039 totals; and the emissions comparison, 168 Mt for 2030 (key outcomes; corrected 14 Oct 2026, user: not SAnews's 160) |
| amaBhungane, Eskom station-by-station data | one-off | Feb 2026 | independent corroboration of the fleet-to-coal availability conversion: coal 58% in 2025 against the fleet's 62%, which implies non-coal availability of 89.9% against the 90% assumed |
| Household consumption references | one-off | 2024 | the two reference households in the bill view: Eskom's own 30 kWh a day, and about 190 kWh a month for the average electrified household (Eskom residential demand over Statistics South Africa's household count, as MyBroadband calculated it) |
| IEA, *Electrification* (special report) | one-off | 22 Sep 2026, CC BY 4.0 | the industrial electrification scenario: 40% of fossil low- and medium-temperature industrial heat is competitively electrifiable today, heat pumps deliver 3-5 units of heat per unit of electricity, global electrification rate 23% now to 35% by 2035 in the High Electrification Scenario |
| RMI, grid reliability guide and *Reliability Explored* | rolling | 2026 | the scope note in handover.md: reliability is adequacy, stability and resilience across bulk AND distribution; most outages originate on distribution; renewable deployment has not worsened US reliability outcomes |
| GCCA Annexure A substation limits | annual | as at 2026 | not yet loaded: the per-substation connection limits behind regional congestion, for the nodal work |
| NERSA congestion curtailment approval | one-off | April 2025 (framework to March 2028) | `congestionCurtailPct` 4% is its ceiling; framing for TODO 14aj |
| NTCSA practice note on congestion curtailment | one-off | October 2025 | the 1,580 MW released under the framework (TODO 14aj); not yet read by Claude |
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
| IRP 2025 assumptions workbook, New Tech Properties, Large-Scale Nuclear (EPRI) | new-nuclear cost basis for s_be7 (TODO 14cz) | read 13 Oct 2026 from the local copy (sha1 2317fad5): overnight R167,264-176,885/kW (2023 label), fixed O&M R2,627-3,337/kW-yr, variable O&M R194.5-218.4/MWh, fuel R15.35/GJ, life 30 years, lead time 72-96 months; overnight, so no interest during construction |
| EIA, Annual Energy Outlook 2023, Cost and Performance Characteristics of New Generating Technologies, Table 1 | international benchmark for new-nuclear capex | read 13 Oct 2026 (eia.gov/outlooks/aeo/assumptions/pdf/elec_cost_perf.pdf, via Firecrawl because WebFetch could not resolve eia.gov): large LWR 2,156 MW, total overnight USD 7,777/kW (2022$), fixed O&M USD 136.91/kW-yr, lead time 6 years; excludes interest. Based on Sargent and Lundy (2019), escalated |
| #PowerTracker | primary source for wheeled commissioning | identified 17 Aug 2026; CC BY-SA (user, 13 Oct 2026): a lead only, never cited or ingested; confirm and cite the original source (TODO 14cy) |
| Independent Transmission Infrastructure Procurement Programme (ITIPP) | private capital funds, builds and transfers grid to the state; Impofu and Nuweveld are the working precedents | not yet tracked. Private transmission is a category the model does not represent - it assumes NTCSA builds the network |
| NREL ATB | storage capex cross-check | checked 28 Aug 2026 and it cannot do the job: ATB covers lithium only, with no flow-battery or iron-air line. `acapVrfb` stays single-source |
| NERSA Electricity Regulation Projects Dashboard | the consolidated view of every NERSA consultation - written-comment deadlines, hearing dates and target completions in one table | Issue 04, September 2026, last updated 15 Sep 2026 (read 22 Sep). Appears roughly monthly at `nersa.org.za/files/files/YYYY/MM/ELRStakeholderDashboard-RevN.png`. Reading it on 31 Aug corrected a Trading Rules date this project had wrong by a month, and surfaced four consultations not previously tracked. Check it every session. |
| PFL IPP Knowledge Hub COD table | settles Mulilo's COD month | deep links 404; navigate Research > Knowledge Hub |
| NERSA Trading Rules | governs how wheeling and trading clear | comment due 28 Sep 2026; the locational work is directly reusable |
| #PowerTracker | primary source for wheeled commissioning | identified 17 Aug 2026, not yet ingested; CC BY-SA (user, 13 Oct 2026): a lead only, never cited or ingested; confirm and cite the original source (TODO 14cy) |
| Global Energy Monitor, Global Wind and Solar Power Trackers | project-level status - announced, pre-construction, construction, operating - with coordinates, capacity and owner, updated twice a year, free for research. The nearest thing to RenewMap with South African coverage | to try: the Hydra Central split and the 1,823 MW of unexplained solar are both named-project problems |
| OpenStreetMap power plants | `plant:source=wind` or `solar` with output and construction tags, and geometry. Good for EXISTENCE and LOCATION, weak for status and dates: mappers follow imagery updates, and construction tags are often left behind after completion | to try, as geometry and corroboration alongside a structured source |
| RenewMap | the tool this project wants - status, capacity, grid connections, approvals, milestone history, CSV export - but AUSTRALIA AND NEW ZEALAND ONLY. Recorded as the model of what a South African equivalent would look like | not applicable, checked 23 Sep 2026 |
| Department of Electricity and Energy, media statement on the first section 34 determination under IRP 2025 | the first procurement the IRP actually triggers; the basis for the first-determination scenario (TODO 14au) | statement of 7 Oct 2026, supplied by the user; link not yet recorded. Determination proposed, not gazetted; needs NERSA concurrence (see CALENDAR) |

---

## Fleet table: public slim file, private full original (user, 13 Oct 2026; went ahead 16 Oct 2026, message 146, build 2026-10-16c)

- Public: `nodal/fleet_units.csv`, the only fleet file in this repository, holding only the columns the code reads: Scenario,
  Power Station Name, Carrier, region, Capacity (MW), Decommissioning Date, Marginal Cost (R/MWh), Min Stable Level (%),
  Max Ramp Up and Down (%/h), Min Up and Down Time (h), Start Up Cost (R), GPS Latitude and Longitude. Marginal Cost is heat
  rate x fuel price + variable O&M, computed once from the full table (every reader used only that product), so heat rates,
  fuel prices and variable O&M are not published separately. GPS stays because build_hydra_split.py and
  build_substation_bands.py place plants against substations with it. Dropped: Grouping, unit size and number, commissioning
  date, heat rate, CO2 rate, fuel price, variable and fixed O&M, start-up and shut-down ramp rates, unit start-up and
  shut-down costs, and the spatial-join columns (geometry, NAME_1, index_right, name).
- Private: the full original, `fleet_by_region_v2.csv` (sha256 fdfc541a0cf077a5...), is in the private gridtwin-data repository,
  branch claude/pypsa-rsa-fleet, at pypsa_rsa/fleet_by_region_v2.csv; `fleet_by_region_v2*.csv` is in .gitignore here. Its rows
  are the 51 BASE rows of the 'conventional' sheet of PyPSA-RSA's scenarios/ME IRP 2024/sub_scenarios/fixed_technologies.xlsx
  (commit 89872c1, 8 Apr 2026), with 16 coal minimum stable levels set to 0.5 where the sheet has 0, joined to the GCCA supply
  regions.
- The full table stays in this repository's git history: no history is rewritten (message 146). It also stays on the live site
  until the site is rebuilt from a main that carries this change (TODO 14cq).
- The per-unit table in index.html (UC_FLEET, from the same source: 31 coal groups with capacity, unit size and count, minimum
  stable level, minimum up and down times, start-up cost, marginal cost, decommissioning date and region) is unchanged and
  public. The question for Meridian is now whether fleet_units.csv may stay public (TODO 14dh).
- Every reader of fleet_units.csv stops with an error on a missing column (message 146); blank cells keep their documented
  defaults (no ramp limit where the ramp rates are blank, 19 rows; no minimum up or down time where those are blank, 21 rows).

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
subtracting the known wheeled plant from it. Read at source (user, 17 Oct 2026, message 191 (1)): NTCSA Weekly
System Status Report 2026 week 25, p.6, "Rooftop PV includes ground-mounted as well as all other PV installations that do not
have contracts with NTCSA"; estimated rooftop PV 8,294.5 MW for May 2026 (pp.5-6), where NTCSA notes that month-to-month jumps partly reflect cloudy days.
Wheeled plant sells to private buyers, so it is assumed inside; whether a network-use agreement counts as a contract with NTCSA is open.

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
operation September 2026), Selemela (200 MW AC, Apr 2024), Damlaagte (97.5 MW, Aug 2025), Thakadu
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
   COMMERCIAL OPERATION reached in September 2026 (user, 12 Oct), first reported 1 Oct 2026. Energised with its transmission
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
GridPulse ZA           https://gridpulse.org.za/ , home page, read 26 Oct 2026 (user, messages 394 and 397).
                         Forecast section: GridPulse's comparison of Eskom's day-ahead forecasts with
                         delivered output over the past year: wind and solar about 5% over-forecast,
                         roughly 400 MW in a typical hour (a bias, not the hourly spread); demand
                         within about 2%. Cite as GridPulse's analysis (TODO 14jj). Coal section:
                         about 80% of generation from coal over a year (TODO 14ji). Its plant data
                         re-publish Global Energy Monitor's tracker: cite GEM directly for those
                         (message 395 (b); TODO 14jl). Its reserved-curtailment figure (940 MW by end
                         July 2026) is a lead for TODO 14jn.
PyPSA-CL (Chile)       PyPSA-CL, capacity expansion model of Chile's National Electric System,
                         https://github.com/paredes-vergara/PyPSA-CL (MIT licence). Read 27 Oct 2026
                         (README only; message 418). The README credits the Unit of Planning and
                         Climate Change, Ministry of Energy of Chile, and says it was developed for
                         the Long-Term Energy Planning process (PELP 2028-2032); input data is not
                         distributed with the code. That the Ministry publishes each PELP report's
                         databases (energia.gob.cl/pelp/repositorio) rests on search snippets only:
                         unconfirmed. Uses: note recommendation (TODO 14jr); coal calibration lead
                         (TODO 14jq (a)).
Meridian 2026 reform   Meridian Economics (N. van Doesburgh, G. Steyn, B. Cohen), Electricity market reform
                         in South Africa: the public interest rationale and key risks ahead (briefing note,
                         October 2026; published 26 Oct 2026), https://meridianeconomics.co.za/wp-content/
                         uploads/2026/10/Electricity-market-reform-briefing-note.pdf ; 12 pages. Read
                         27 Oct 2026 from Nick's Drive copy (the site is blocked from the container); pages
                         confirmed by the advisor (message 425). p.1 fn.1: many coal units cannot shut down
                         and restart within a day, so they run for the evening peak, causing curtailment
                         (pack limitation 13, item 6). p.9: SAWEM as drafted is energy-only; the only
                         capacity payments are in Eskom's vesting contracts; missing money for batteries
                         and peakers (limitation 29). p.10: electricity-price neutrality to 2030 "largely
                         shields electricity generation from the tax" (carbon row). Box 1: wind and solar
                         should be eligible for capacity payments in line with their reliability
                         contribution (TODO 14js).
Krutham 2026 trading   Krutham, Trading electricity: Is SA ready for the next financial market?
                         (October 2026), https://www.krutham.com/reports/trading-electricity/ ;
                         6 pages, page numbers from the PDF. Read 26 Oct 2026 (user, messages 398
                         and 400). p.2: SAWEM phases (Eskom Generation to Distribution internally
                         since April 2026; commercial launch Q2 2027; full balancing Q1 2028;
                         capacity and ancillary services markets from 2030) and the expectation of
                         an Eskom-dominated market with little external price discovery until the
                         early 2030s: the basis for the coal practice floor's duration to 2029 and
                         the design minimums from 2030 (pack section 1b). p.6: NTCSA aims to publish
                         internal clearing prices from January 2027; pre-vesting prices are not a
                         market reference. p.5: battery intraday arbitrage and revenue swaps.
                         pp.1, 4: notified maximum demand and fixed distribution charges apply
                         whoever supplies the energy. Paraphrase; cite by page.

Coal minimum down time (user, 27 Oct 2026, messages 442 and 443): FIXED.coalMinDownH 24 h, central from c6c. Our reading of
                         Meridian Economics, Electricity market reform in South Africa (briefing note, 26 Oct 2026), p.1,
                         fn.1: "many coal units are unable to shut down and restart within a day, so they are run continuously
                         in order to be available for the evening peak". No measured minimum down time for South African or
                         comparable large units was found. Literature, read 27 Oct 2026: NREL/Intertek APTECH, Power Plant
                         Cycling Costs (2012, NREL/SR-5500-55433), Table 1-1, p.12, warm starts after 12-40 h offline for
                         large subcritical and 12-72 h for supercritical units (below the band hot, above it cold); Agora
                         Energiewende, Flexibility in thermal power plants (2017), p.44, hot under 8 h offline, warm 8-48 h,
                         cold over 48 h, and Table 1, p.48, hard-coal start-up 2.5-3 h hot and 5-10 h cold; PyPSA-Eur,
                         data/unit_commitment.csv, coal 8 h minimum up and down (no source stated). So the literature ranges
                         8-48 h. The longer value is the more conservative choice for reliability (RULES.md, decisions taken
                         without Nick, message 366). AEMO's 2025 Thermal Audit and Meridian's 2025 flexibility study could not
                         be opened from the container: to read. UC_FLEET's own values (PyPSA-RSA) are kept for c6b, the
                         4-hour sensitivity. With it the practice floor is recalibrated from 0.75 to 0.715 (messages 447 and
                         448): each setting represents one thing; the floor was partly standing in for units kept on for the
                         evening peak, which the down time now represents, so it is matched again to the same measured
                         statistic, Eskom's January-August 2026 sunny low-demand midday coal output over available coal,
                         median 0.623 (ESK19679, Eskom credited, analysis ours; model 0.624 at 0.715, 0.642 at 0.75), the
                         backcast practice of SEM Committee, PLEXOS validation and backcast report, SEM-20-004.
Rooftop PV installed cost, 2025-26 (user, 27 Oct 2026, messages 413 and 416 (b)): the c6b rooftop capex. 2025-26 installer price
                         guides; no authoritative survey of South African rooftop costs was found. All read from search-result
                         snippets on 27 Oct 2026 (this environment could not open .co.za pages): confirm dates, VAT and
                         contents before the pack quotes a single source. Rand per Wp DC excluding VAT, no battery; prices
                         stated with VAT divided by 1.15. Residential: EnergyBee 2026 guides, 5 kW R13.0-17.4, 3-8 kW
                         R13.0-15.7, above 8 kW R10.4-13.9, 10 kW R13.0-16.5 (energybee.co.za; installer guide); VoltFlow,
                         3 Apr 2026, 5 kW R14.8-20.9 (scope not stated). SAPVIA spokesperson's deck, Oct 2026 (via the user,
                         advocacy): components about R7.5-7.8 with no installer margin stated. Commercial and industrial:
                         Focal Energy 2026, ex VAT, R10.40 (50 kWp), 8.70 (100), 7.24 (500), 6.70 (1 MWp)
                         (focalenergy.co.za); Elite Energy (undated), ex VAT, R11-14 (30-100 kWp), 9.5-12 (100-500), 8.5-10.5
                         (500-1,000) (eliteenergy.co.za); an anonymised 30 kWp C&I estimate, 2025, R8.76/Wp DC ex VAT,
                         hybrid inverters, design and installation (seen by the author; not published). Central residential
                         R13.0 (10.0-17.0), C&I R9.5 (7.0-12.5); weighted 30% residential and 70% C&I by installed MW (no
                         sourced split: 675,000 households with panels, StatsSA General Household Survey 2025 as reported, at
                         3-4 kWp is 2.0-2.7 GW of about 8-9 GW; NTCSA: commercial roofs hold the bulk, Engineering News 19 Jun
                         2026). Blend R10.55, taken as R10.5/Wp DC (R12,600/kW AC at 1.2); low R8.0, high R14.0. GreenCape's
                         market intelligence reports not used (user, message 413: conservative and dated). Flags: the retail
                         guides (about R13) and SAPVIA's component figure (about R7.7) are far apart, unexplained; the 30 kWp
                         estimate sits below both vendors' small-system prices.
Lazard LCOE+ 2025      Levelized Cost of Energy+ (June 2025), Appendix A, LCOE v18.0 key
                         assumptions, p.37: gas peaking (new build) capacity factor 15%-10%.
                         Read 18 Oct 2026 (user, message 199 (1)). DSL_REF_CF 0.10, the bottom of
                         the range, is the reference capacity factor for the diesel open-cycle
                         LCOE anchor (FIXED.lcoeDiesel). An international gas-peaker reference,
                         not a South African diesel figure. Cite; do not reproduce the table.
Eskom TDP 2024           2025-2034: 14,494 km, 210 transformers, 133,000 MVA, 56 GW, about
                         R440bn (DBSA; NTCSA CEO, Aug 2026). txRPerKWyr 402 = generation
                         integration only: R225bn for 46.9 GW of grid-connected generation
                         (56 GW less 9 GW rooftop), R4,800/kW, over 40 years at 8%. The whole
                         plan over 56 GW would give about R660/kW-yr; the earlier 600 came from
                         that method on R390bn. 14,200 km, 53 GW and probably R390bn are
                         TDP 2022. Corrected 6 Oct 2026: this note said R390bn and 600.
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

## External scenario: Kerwin et al. 2026 (TODO 14p)

Kerwin, Fields, Martindale and Quiros-Tortos (2026), "Long term planning for a clean energy transition
in South Africa's electricity sector: an integrated MAED-OSeMOSYS approach", Renewable and Sustainable
Energy Transition, doi 10.1016/j.rset.2026.100162. Open preprint, CC BY 4.0: doi 10.33774/coe-2026-15jfr
(65 pages, read 6 Oct 2026). OSeMOSYS, annual steps 2024-2050, eight time slices (four seasons, day and
night). No discount rate, battery duration or reliability constraint is stated.

```
Demand (A4, MAED baseline, PJ; x 277.78 = GWh)   2020 687.2   2030 746.5 (207.4 TWh)   2040 892.2 (247.8 TWh)
                                                  2050 1,066.5. High demand: 791.7 / 1,043.5 / 1,375.3
Capex USD/kW 2020 / 2030 / 2040 (A5)              wind 1,047 / 1,029 / 1,005; utility PV 877 / 774 / 661;
                                                  rooftop 1,406 / 1,258 / 1,110; BESS (power) 250 / 220 / 190;
                                                  CCGT 1,248 / 1,181 / 1,098; OCGT 1,120 / 1,050 / 961;
                                                  nuclear 6,137; coal 3,297
Fixed O&M USD/kW-yr (A5)                          wind 51, utility PV 24, rooftop 38, BESS 6-5, CCGT 31-28,
                                                  nuclear 119, coal 78
Life, years (A5)                                  wind 25, PV 24, BESS 10, CCGT 30, OCGT 25, nuclear 50, coal 35
Fuel, million USD/PJ (A6)                         domestic coal 3.4-3.8, imported gas 8.6-11, diesel 11-15
Residual capacity GW 2020 / 2030 / 2040 (A8)      coal 37.9 / 30.3 / 21.7; wind 2.5 / 3.4 / 2.0;
                                                  utility PV 2.0 / 2.4 / 1.4; rooftop 1.2 / 5.8 / 5.8;
                                                  nuclear 1.9 / 1.9 / 1.5; "CCGT" 3.4 / 3.4 / 2.3 (in fact
                                                  the diesel OCGT fleet); large hydro 3.3 (hydro plus pumped
                                                  storage); CSP with storage 0.5 / 0.5 / 0.3
Capacity factors (A9)                             wind 0.36 in all eight slices; coal 0.57; utility PV
                                                  0.43-0.61 by day, 0 at night
Build limits GW/yr (A13)                          wind 1.6 (2024-30), 2 (2031-40), 3 (2041-50);
                                                  utility PV 1, 2, 3
Scenario 1 build (C1), cumulative from 2024       2030: wind 11.2, utility PV 7.0, rooftop 3.51, CCGT 0.25,
                                                  biomass + small hydro 0.13. 2040: wind 31.2, PV 25.7,
                                                  rooftop 3.64, BESS 2.75, CCGT 1.91, nuclear 0.93, bio+hydro 0.28
Scenario 1 coal (C5), GW required                 2030 25.2, 2040 12.5. Emissions path (C3): 2030 129.1 Mt,
                                                  2040 64.5 Mt
Baseline build (digitised from Figure C8,          2030: wind 11.2, gas 0.7. 2040: wind 31.2, PV 11.0, BESS 1.4,
 +/-0.05 GW a bar; sums 11.9 and 50.4 GW against   gas 6.8 (gas type not split in the figure)
 Table 2's 11.9 and 50.5)
```

## Congestion curtailment: South Africa's current rule (TODO 14aj)

NERSA's congestion curtailment approval (April 2025) and NTCSA's practice note (October 2025), as
summarised by the user 6 Oct 2026; neither document read by Claude yet. Wind only, Western and Eastern
Cape only, curtailment capped at 4%, releasing 1,580 MW of extra connections (1,180 MW Western Cape,
400 MW Eastern Cape). Extending it to other technologies or regions needs NERSA approval backed by
studies. The model's congestionCurtailPct 4 is this ceiling, not an expected rate.

## IRP 2025 extract (public_data/irp2025_extract.csv)

Government Gazette 53596, notice 6767, 28 Oct 2025. Extracted by the user 6 Oct 2026 by OCR and visual
reading: Table 1 (new capacity by year to 2042, p.31), Figure 5 (committed private capacity by year,
13,892 MW, p.18), the demand definition and the reference-case assumptions (p.11, p.34). Columns checked
against their totals 6 Oct: wind, solar, IPP gas, nuclear, distributed generation and other private
agree. Two to check against the PDF: energy storage sums to 7,930 MW by year against a stated total of
8,223 (the gap equals the two Eskom battery entries, 294 MW); private PV sums to 6,987 against 6,988.
The IRP's new wind in 2026 and 2027 (964 and 2,847 MW) equals the committed private wind.

## Power Futures Lab, Financial Close & Commercial Operations Monitor, H1 2026 (TODO 14u5 step 3)

Alao and Kruger, Power Futures Lab (UCT), briefing "SA IPP FC/COD H1 2026" (v4), 17 Aug 2026, 7 pages. The
PDF was uploaded 6 Oct 2026 and removed from the repo the same day: it states no licence. Figures used:

```
Operational H1 2026        1,920 MW, 17 projects (Table 1): privately procured 1,046 MW in 10 projects,
                           publicly procured 874 MW installed (680 contracted) in 7. Includes Mulilo Total
                           Hydra Storage (75 MW contracted; 216 MWp PV behind it) and Graspan PV (75 MW).
                           Three captive behind-the-meter projects, 88 MW (Lephalale 1 68, PPC Slurry 10,
                           PPC Dwaalboom 10), excluded from the model as before.
Expected H2 2026 COD       2,202 MW, 28 projects; 1,414 private and 789 public (Figure 1, p.5, chart labels)
Financial close 2026       1,713 MW, nine closures
Advanced pipeline          3,243 MW: REI4P BW7 1,520, BW6 640, BESI4P BW2 462, private 621
```

Not from this brief: the 19.3 GW of NERSA registrations, which is press coverage of PFL data (Green
Building Africa, Aug 2026; MyBroadband, about 19,300 MW registered 2018 to Q1 2026). The model's
registrations source is nodal/nersa_registrations.json (SAPVIA dashboard, 20,131 MW to Q1 2026/27).

## Private projects reaching commercial operation, 2026: Koruson 2 (Hartebeesthoek), beside nodal/supply_area_split_draft.json's pending entry

- Koruson 2, Hartebeesthoek wind, 140 MW, Eastern Cape (user, 21 Oct 2026, messages 290 and 291). In a LinkedIn post of 6 Aug 2026
  (https://www.linkedin.com/posts/edf-edfpowersolutions-envusa-share-7491036493961138176-HhFB/; not read here), EDF power solutions
  reported Hartebeesthoek in commercial operation from August 2026 at 130 MW, with the last 10 MW due in September, completing
  Koruson 2: Mooi Plaats (240 MW PV), Umsobomvu (140 MW wind) and Hartebeesthoek (140 MW wind), about 50 turbines in all. EDF's
  project page (southafrica.edf-powersolutions.com/operational/koruson-2/) gives June 2026 for all three; the post is the more
  specific. Koruson 2 is private, not REIPPPP: Envusa Energy sells its output to Anglo American's mines under 20-year offtake
  agreements, over Eskom's grid, with no bid window (EDF's project page). PFL's H1 2026 monitor (17 Aug 2026), which lists
  "Anglo's Hartebeesthoek (140 MW)" among private projects expected in H2 2026, names the same plant. OpenStreetMap shows 25
  turbines mapped at about 31.25S 25.01E. The capacity file's pending entry (H2 2026) is unchanged until the project tracker update
  after the note; build_hydra_split.py and build_capacity.py are not rerun (TODO 14dk: a rerun erases queue_project.js's additions).

## Pumped hydro, off-river cost basis 'anu2026' (TODO 14z, build 06h)

Andrew Blakers (ANU, RE100 group), personal communication by email to Nick Hedley, 6 Oct 2026:
- Off-river pumped hydro costs USD 1,100/kW plus USD 14/kWh, including 50% contingency.
- South Africa has 738 Class AA and AAA sites holding 340 TWh between them. The top 30 hold 43 TWh.
- Site-level data to follow; Nick is downloading the shortlist.

Use in the model:
- bldPhesCapexKW 'anu2026' gives (1,100 + 14 x hours) x R16.50/USD, for example R29,238/kW at 48 hours.
- It is the default basis since build 06h.
- 'tubatse' (the Weber et al. fit scaled to Tubatse's R29,200/kW at 14 hours; R37,450/kW at 48 hours) is
  the conservative sensitivity, because river-based schemes cost more for flood design.

## Sources consulted and rejected

## Non-residential shiftable load (drShiftPct note, build 06g)

Found 6 Oct 2026 by web search. Only the LBNL report could be opened and checked. NREL and IEA are
still blocked from this environment, so their figures come from search extracts. Verify those figures
and pages before quoting.

- Matsuda-Dunn, McKenna, Desai (NREL) and Mukoma (CSIR), Determining and Unlocking Untapped
  Demand-Side Management Potential in South Africa: Demand Response at the Grid Edge,
  NREL/TP-6A40-88042, January 2024, https://www.nrel.gov/docs/fy24osti/88042.pdf. It quotes Eskom
  Transmission:
  - an identified base of 8-9 GW of demand response and load shifting;
  - less about 3 GW non-flexible and 1.4 GW already used;
  - leaving about 4 GW.
  It mixes interruptible and shiftable load, is mostly industrial, and is closer to a technical than
  an economic potential (about 2022). It also gives Eskom's contracted demand response: 1,014 MW
  instantaneous, 346 MW supplemental and 62 MW critical peak day. That is interruptible, not shifted.
- IEA, Scaling Up Demand Flexibility: From peak management to efficient system operation (2026; it
  cites sources accessed in May 2026), CC BY 4.0. VERIFIED from the copy the user uploaded:
  - "In South Africa, demand flexibility measures have already avoided around 1.5 GW or 5% of annual
    peak demand" (printed p.8).
  - "In South Africa today, most flexibility is provided by industrial users" (p.9).
  - The Demand Management Programme "has delivered up to 1.5 GW of peak shaving, mainly from large
    industrial consumers, with a smaller but significant amount from residential water heaters and
    pool pumps" (p.24-25).
  - "Industry has the greatest shifting potential at around 1 TWh annually" (p.25, with a chart of
    technical potential by sector and end use, 2025).
  - Hot water controls in 1.2 million households (10%) "could unlock 600 MW of additional peak
    shaving capacity" (p.25). This is a cross-check on the VPP geyser pool.
  - Model use: 1 TWh a year is about 1.7% on drShiftPct, where 1% moves 0.58 TWh.
- Covary and de la Rue du Can (LBNL, for USAID and DMRE), South Africa: Energy Efficiency Demand Side
  Management Experience (2004-2022), LBNL-2001576, October 2023,
  https://eta-publications.lbl.gov/sites/default/files/usaid_dmre_report_1.pdf. VERIFIED in the document
  (6 Oct 2026):
  - "The total savings from the ESCO model were 769 MW of demand savings and 2,327 GWh of energy savings
    (Skinner, 2012)" (printed p.7). These are figures to 2012 and combine efficiency with load shift.
  - Table 2 (printed p.8): R3.5M/MW for load shifting and peak clipping alike; R5.25M/MW for
    efficiency.
  - "Eskom achieved a saving of 1 216 MW" against 1,037 MW targeted (printed p.5), stated as 2011-2013
    there but as April 2010-March 2013 on printed p.6.
- Model use: the IEA's about 1 TWh a year (about 1.7%) as the verified technical potential for industry;
  NREL and CSIR's 4 GW (about 15%) only as an outer ceiling until verified.

## LNG import infrastructure costs (TODO 14ak, pathway sensitivity only, 6 Oct 2026)

Search extracts only (proxy blocked the documents). Applied in harness/pathway/pathway_perfail.js and
pathcheck.js as GAS_FUEL_R and GAS_FOM_ADD. Not an index.html default.
- FSRU fixed charges:
  - Engro Elengy, Pakistan: tolling USD 0.66/MMBtu; capacity charge USD 228,016/day, payable whatever
    the use.
  - Moheshkhali, Bangladesh: about USD 217-237k/day per FSRU, obligatory whatever the throughput.
  - Lubmin FSRU, Germany: about USD 150k/day.
  - OIES NG-123, Songhurst, The Outlook for Floating Storage and Regasification Units, July 2017.
    VERIFIED from the copy the user uploaded:
    - leasing USD 110-160k/day, plus operating cost USD 20-45k/day, so USD 130-205k/day in total
      (printed p.30);
    - tolling rates USD 0.60-0.94/MMBtu at a 50% load factor (QED Consulting, quoted p.30);
    - about USD 1/MMBtu at 50% use for an FSRU, against about USD 2 for an onshore terminal (p.30);
    - boil-off 0.10-0.15% of the cargo by weight per day (p.5);
    - new-build FSRUs typically 170,000 m3 (p.10), which is general and not the Zululand terminal's
      own figure.
    So USD 47-75 m a year for one FSRU, against the USD 84 m central used below. The Zululand
    terminal is a storage unit with onshore regas, about USD 1 bn, so its cost need not follow the
    FSRU range.
- Zululand Energy Terminal, Richards Bay:
  - a Vopak and Transnet Pipelines joint venture, 25-year concession;
  - Phase 1 is a floating storage unit plus onshore regas, about 3 mtpa; Phase 2 is above 4 mtpa;
  - about USD 1 bn for both phases;
  - investment decision Q1 2028, Phase 1 operating about 2030;
  - Eskom heads of agreement as foundation customer, 5 Jun 2026; no take-or-pay terms published.
  Sources: pgjonline (Mar 2026), Mining Weekly (5 Jun 2026), Zawya. VERIFIED in Engineering News,
  "Eskom signs agreement with Zululand Energy Terminal as it seeks to advance 3 GW Richards Bay
  gas-fired power project", 5 Jun 2026 (user's printed copy):
  - Phase 1 is "a 170 000 m3 floating storage unit and an onshore regasification plant with a yearly
    capacity of about 3-million tons". Phase 2 takes it to "over 4-million tons" with an onshore tank.
  - It connects to the Lilly pipeline.
  - Eskom's 3,000 MW plant at Richards Bay: "mid-merit", 25 years, power from 2031.
  - IPP gas bids, all on imported LNG: 440 MW Mpumalanga, 990 MW KwaZulu-Natal, 600 MW Gauteng,
    800 MW Mpumalanga. Most are inland, so transport cost applies to them.
  The USD 1 bn cost and the 2028 investment decision are not in this article.
- Inland transport: the Lilly pipeline is about 23 PJ/yr, too small for a 3 GW plant. The ROMPCO
  tariff was R13.34/GJ in 2016 on its first expansion and R12.87/GJ on the second (Business Day,
  30 Nov 2016, search summary), about USD 0.85/MMBtu. An inland plant would need a new pipeline.
- Not confirmed in any document: Engro's USD 228,016/day (its USD 0.66/MMBtu tolling fee is a lead
  from a 2017 Profit article), and LNG density, energy per tonne and heel share. Engineering News
  (5 Jun 2026) on the Zululand terminal is still blocked from this environment. The LNG storage check uses 0.45 t/m3 and 54.9 GJ/t (HHV) as settings until a source is
  found.
- IRP 2025, Additional Data and Assumptions workbook (user's copy, New Tech Properties sheet), in
  January 2024 rand at R18.35/USD:
  - gas fuel R260.89/GJ in the first year with no escalation, about USD 15.0/MMBtu;
  - no separate LNG terminal or pipeline cost appears in the workbook, so import infrastructure is
    either in that fuel price or left out (the workbook does not say);
  - 2x1 9F.05 CCGT: heat rate 6,900 kJ/kWh (52.2%), overnight R18,653/kW, fixed O&M R501/kW-yr,
    variable O&M R61/MWh, 30 years, availability 97.5%;
  - Open-cycle central capex (user decision 12 Oct 2026; build 2026-10-12b): EIA AEO2023 Cost and Performance
    Characteristics of New Generating Technologies, 2022 dollars: frame combustion turbine USD 867/kW, multi-shaft
    combined cycle USD 1,176/kW; ratio 0.737 applied to the model's CCGT capex, R34,965/kW x 0.737 = R25,778/kW in 2026,
    same real escalation as CCGT. The IRP's R12,981/kW stays the low case. NREL ATB 2025 not used (atb.nlr.gov blocked).
  - Basis of the CCGT capex R34,965/kW (BLD_COST.ccgt): USD 2,119/kW at R16.50, flat in real terms from c4 (12 Oct 2026;
    the earlier 2% a year real rise had no source: GridLab's 2%, p.5 footnotes 5-6, is general inflation used to put EIA
    and NREL figures into nominal 2030 dollars, not a real escalation); matched on
    23 Sep 2026 to GridLab's September 2025 study (recent combined-cycle projects routinely at USD 2,000/kW or more,
    against USD 1,116-1,427 for plants completing 2026-27 and the ATB's USD 1,638 for 2030). The constant predates that
    sourcing and its dollar year is not recorded; GridLab's figures are nominal, in-service-year dollars, so R34,965/kW
    may sit a few percent above a 2026 real basis (user, 12 Oct 2026); converted at R16.50, without a CPI step.
  - 9F.05 OCGT (user's figures, 11 Oct 2026; build 2026-10-11f): heat rate 10,624 kJ/kWh (33.9% on the basis on which
    the CCGT's 6,900 gives 52.2%, the efficiency costCcgt and emisCcgt use), overnight R12,981/kW (the low capex case),
    fixed O&M R423.89/kW-yr, variable O&M R80.19/MWh; all x SA CPI 1.032 x 1.035 to January 2026. Life taken as the
    CCGT's 30 years. The central capex (NREL ATB 2025) is still to be supplied; atb.nlr.gov is blocked here.
  - gas energy content 53.37 MJ/kg, used for the LNG storage check.
- Derived (not sourced):
  - Regas fuel and boil-off: USD 0.25/MMBtu.
  - Transport: 0 at Richards Bay; USD 1.2/MMBtu central inland.
  - Terminal fixed cost: USD 84 m/yr central (55-130), spread over 3 mtpa shared by about 5.4 GW at
    50% load. That gives R260/kW-yr central, R170-460.
- Applied (central, coastal):
  - costCcgt R1,813/MWh: the R2,003 default's USD 18.50 delivered becomes USD 16.75. The flat
    USD 2/MMBtu adder is replaced, not added to.
  - New CCGT fixed O&M raised by R260/kW-yr.

## Committed procurement: section 34 determination, 7 Oct 2026 (user, 12 Oct 2026)

- Ministerial determination under section 34 of the Electricity Regulation Act, 7 Oct 2026 (user's reading): 5,000 MW of
  gas-to-power and 4,600 MW of battery storage, procured by the IPP Office. No commercial operation dates, battery
  duration or gas capacity factor are published.
- Battery procured so far: 1,744 MW / 6,976 MWh (4 hours); used as the assumed duration of the 4,600 MW (judgement).
- Unclear whether the first gas round (closed 29 May 2026) sits inside the 5,000 MW, so 5 GW is treated as a minimum.
  Settled 15 Oct 2026 (user, message 108), as our reading: the 5,000 MW (GN 8021, gazetted 14 Oct 2026) covers Table 1's
  2031-37 IPP gas only and is additional to the 3,000 MW determined under IRP 2019; see 'Gas-to-power 3,000 MW' below.
- Use: the pre-decided set for TODO 14be step 5 (replacing IRP Table 1's gas by year), run as 'committed procurement'
  against the new central: at least 5 GW of new gas at the 1.2 GW a year cap from 2030 (GAS_MIN), technology not stated
  in the determination, modelled as CCGT (judgement).

## IPP Office website terms (REIPPPP data): no open licence (read 13 Oct 2026)

https://www.ipp-projects.co.za/WebsiteDisclaimer, 'Website terms and conditions', version May 2016, read 13 Oct 2026 through
Firecrawl (the site does not resolve from this environment through WebFetch). Clause 7.1: the site's contents are protected by
copyright and are the IPP Office's property unless stated otherwise; 7.2: any unauthorised use of its contents, information or
materials is prohibited; 9.1: no link to the site without written permission; footer '(c) IPP Office May 2016. All rights remain
reserved.' No open licence is published. So LICENSE's 'REIPPPP project data: DMRE / IPP Office - public domain' was wrong; the
follow-up pull request to #29 corrects it (TODO 14dm). Our REIPPPP-derived files (regional_renewable_capacity.json,
ipp_pipeline.json and others) hold project facts and figures cited from IPP Office reports, credited.

## Values derived from Eskom's ESK19679 and ESK19243 (register, user 12 Oct 2026)

User decision 12 Oct 2026: Eskom-derived constants stay for now; the open question is the hourly series only. Both
datasets were obtained on request, all rights reserved. Terms checked (user, 12 Oct 2026): they came through the Data
Portal's five-year request with no licence of their own, so Eskom's website terms and the portal disclaimer apply:
personal, educational or non-commercial use only; no reproduction, distribution or publication without written
consent; no automated collection from the website without written consent (clause 2.10). Consent requested: email
'Permission request: Eskom Data Portal data in GridTwin ZA' from nick.hedley@gridtwinza.org to Eskom's Media Desk, 12 Oct 2026
11:57 UTC; acknowledged by the Media Desk on 13 Oct 07:43 UTC ('attending to it'); no answer yet (checked 13 Oct). Until
it is given: ESK files stay local; derived results and single calibration constants (as listed below) may be
published, with Eskom credited and a note that the analysis is GridTwin ZA's, not Eskom's; no raw or per-unit hourly
series; no scripted fetches from eskom.co.za beyond one-off checks (the gridtwin-data weekly fetch is disabled).
The hourly series below are to be replaced in the public repository by open versions, after their effect on c4 is
reported (history not purged). Each constant below is a summary figure (a mean, a ratio or a
calibrated parameter); its basis is in the comment beside it in the file named.

Constants (kept):

| Value | Where | Basis |
|---|---|---|
| coalEAFPct 65 | index.html FIXED | coal-only availability, Jan-Aug 2026 (65.3): fleet availability less nuclear at its output and the other 5,758 MW at 90%; 2023 49.7, 2025 58.4, FY2026 61.4 |
| IMPORTS_CF 0.88 (read by importsCF) | nodal/nodal_engine.js | International Imports, Jan-Aug 2026 mean 1,012 MW on the 1,150 MW contract |
| firm exports 745 MW | index.html FIXED | International Exports, mean since March 2026 (monthly means 684-822 MW after Mozal stopped) |
| nuclearCF 0.66 | index.html FIXED | Koeberg sent-out on 1,880 MW, rolling twelve months to August 2026 (calendar 2022-2025: 0.631, 0.493, 0.472, 0.620) |
| outageForcedSharePct 61 | index.html FIXED | UCLF / (PCLF + UCLF + OCLF), Jan-Aug 2026 |
| outagePlannedSeason (12 monthly factors) | index.html FIXED | monthly PCLF over its annual mean, average of 2023-2025 |
| outageMttrH 480 | index.html FIXED | calibrated to the persistence of 2025 unplanned capability loss (autocorrelation 0.91 at a day, 0.70 at a week) |
| outageCmPerStationYr 5, outageCmMttrH 36, outageCmUnitShare 0.5 | index.html FIXED | calibrated to 2023-2025: 14 days a year losing over 8% of coal in 24 hours (measured 9, 16, 16), largest 6-hour fall 0.154 of mean (measured 0.136-0.152) |
| dieselBudgetTWh spread evenly by month | index.html FIXED | 2023 OCGT output flat across the year (a shape choice, not a number) |
| coal availability conversion, measured pairs | index.html (coal-only function) and validate_findings.js | fleet against coal-only availability 2023, 2025 and 2026 to August, with that year's nuclear factor |
| '2025, as modelled' preset: coal availability 58.4%, exports 1,705 MW, imports 0.652, hydro 0.339, wind 3,900 and solar 2,600 MW Eskom-visible plus private, 2,301.7 MW 2025 mean Eskom-visible solar (rooftop 6,532 derivation) | index.html presets | calendar 2025 means |
| TAIL_COAL_FACTOR 0.76 | index.html bldBuildLP (every pathway run) | coal on stress-window tail days derated to the worst measured 168-hour window over its annual mean (2024; 2023 0.87, 2025 0.83), read from nodal/coal_availability_trace.json |
| weather-year wind scaling 1.0753 | nodal/profiles_regional_multiyear.json (bias_correct_wind.py) | scales the MERRA-2 regional wind so its capacity-weighted national mean matches Eskom-measured 2022-23 |
| benchmark bands: 2025 imports, peaker seasonality 2.15-8.6, 2025 trade, coal EAF 58% with Koeberg 62% | harness/validate_benchmarks.js, validate_consistency.js, validate_outputs.js | calendar 2025 figures; validate_weather and validate_benchmarks also read ESK19679.csv at run time when it is present |

Hourly series (the open question; terms under review, not CC BY):

- profiles.json: demand and demand_2025 (RSA Contracted Demand less International Exports, calendar 2025, plus
  rooftop added back; demand scaled 0.9519 to 2026), wind_pu, solar_pu, csp_pu (calendar 2025 output over that hour's
  installed capacity). Copies: nodal/profiles.json, profiles_rebuilt.json.
- profiles_OLD_backup.json: an older ESK19243 hourly set.
- nodal/coal_availability_trace.json: coal-only availability by hour, 2023-2025, each year divided by its mean
  (outageTraceYear).

## Eskom Green targets (user, 12 Oct 2026)

Eskom Green: 21 GW by 2035 and 32 GW by 2040; first batteries 1 GW / 4 GWh. As given by the user; primary source
(Eskom statement or report, with date and page) still to be recorded before any figure is used in a scenario.

## Grid delivery pace, 2025/26 (TODO 14bj addition, user, 12 Oct 2026)

Chris Yelland newsletter, October 2026: 270.8 km of transmission line delivered in 2025/26 against a 423 km target;
1,230 of 1,657 MW reached commercial operation on time in 2025/26.

## Ember bulk data for validate_benchmarks (user, 12 Oct 2026)

Ember, Electricity Data Explorer, bulk data files, CC BY 4.0: attribute Ember. South Africa's rows are in
public_data/ember_za.json (fetch_ember.py), with each file's URL, release date (Last-Modified) and SHA-256. In use:
monthly file released 2026-07-07 (latest month March 2026), yearly file released 2026-06-23. validate_benchmarks
takes coal, nuclear, wind and power-sector CO2 from the monthly file and prints the release date. The Ember API was
tried first and dropped: the proxy answered 'injection failed ("Ember")', HTTP 502, with the key as a network secret
(body parameter api_key), and again with api_key=placeholder in the URL.

Which Ember file (user, 12 Oct 2026). Ember's methodology (Ember Electricity Data Methodology, May 2024, South
Africa section): yearly generation is the Energy Institute's annual series; monthly generation is Eskom's data,
with coal topped up from Stats SA load data because Eskom's data undercounts coal; the latest year is the previous
annual value moved by the change in the monthly data (so summed months need not equal the yearly figure). The two
files agree within 2% to 2021; the coal gap opens in 2022 (3.2 TWh), 2023 (8.9), 2024 (12.0), and 2025 carries
2024's 12.0 exactly (197.5 against 185.6 TWh; CO2 169.7 against 160.3 Mt, the same 6.4%). A steady block of captive
plant, such as Sasol's own stations, would show in every year, so the gap is a divergence between the two source
series since 2022, not an identified coverage item; the Energy Institute's coverage of autoproducers is not stated.
Choice: the MONTHLY file, which follows the Eskom-connected system the model covers. validate_benchmarks prints the
yearly figures beside it.

Wind benchmark basis (user, 12 Oct 2026). The model sat 21.5% above Ember (12 months to March 2026) inside a 25%
band. Cause: capacity. The model runs its 4,612 MW all year (wheeled private plant Ember does not count, about
470 MW, and plants commissioned through 2025 and early 2026 counted from 1 January); the Eskom-metered fleet
averaged about 3,652 MW in 2025: Ember's end-2024 3.44 GW (IRENA) and the REIPPPP fleet at end-2025, 3,763 MW
(Engineering News, 9 Jan 2026, citing the IPP Office), plus Eskom's Sere, 100 MW. Capacity alone gives x1.263; the
model reads x1.246 on calendar 2025. The benchmark is now calendar 2025 (the profile's year, so weather drops out),
scaled to the model's fleet, with a 5% band (was 25%); the model reads -1.4%.

Figures that moved with the switch (2025 unless stated): coal gross 185.6 TWh (was 177.7, not reproducible from
the current files; the yearly file says 197.5, which includes generation outside Eskom's metering), nuclear 10.21 TWh
(was 11.5), wind 11.64 TWh for the 12 months to March 2026 (was 11.60 to May 2026), CO2 160.3 Mt (was 175; yearly
169.7). Utility-scale solar stays at 6.5 TWh from Ember's website: the bulk files carry solar only in total.

## ERA5 reanalysis, Google Cloud copy (ARCO-ERA5): licence and attribution (user, 12 Oct 2026)

Use: the open replacement for profiles.json's wind and solar (user, 12 Oct 2026) and the 14bw curtailment
back-estimate. User decision 12 Oct 2026: take ERA5 from the Google Cloud copy, not the Copernicus Climate Data Store
(cds.climate.copernicus.eu is refused here, and the Cloud copy needs no account).

- Data: ERA5 hourly data on single levels, ECMWF for the Copernicus Climate Change Service (C3S), 0.25 deg. Dataset
  DOI 10.24381/cds.adbb2d47; reference Hersbach, H. et al. (2020), The ERA5 global reanalysis, Q. J. R. Meteorol. Soc.
  146, 1999-2049, doi:10.1002/qj.3803.
- Copy used: Google Cloud public dataset gs://gcp-public-data-arco-era5 (ARCO-ERA5, google-research/arco-era5; the
  copy's code is Apache-2.0, the data stays under the Copernicus licence). Raw daily NetCDF per variable under
  raw/date-variable-single_level/YYYY/MM/DD/<variable>/surface.nc (NetCDF classic, uncompressed, so a latitude band
  can be read by byte range). Coverage checked 12 Oct 2026 from the store's metadata: final ERA5 1940-01-01 to
  2026-06-30, preliminary ERA5T to 2026-10-03, last updated 2026-10-12. (Google's dataset page in translation still
  says the copy stops in May 2023; the bucket shows otherwise.)
- Licence: CC BY 4.0. Search extracts (ECMWF forum, "CC-BY licence to replace Licence to use Copernicus Products on
  02 July 2025"; the page itself is blocked here) state that from 2 July 2025 Copernicus products from the Climate,
  Atmosphere and Early Warning data stores are under CC BY 4.0 in place of the Licence to use Copernicus Products.
  Verify on the ECMWF page when it can be read.
- Attribution wording (Copernicus; the ARCO-ERA5 README repeats it): for unmodified data, "Generated using Copernicus
  Climate Change Service information [year]"; for modified data, as here (regridded, converted to per-unit output),
  "Contains modified Copernicus Climate Change Service information [year]"; and "Neither the European Commission nor
  ECMWF is responsible for any use that may be made of the Copernicus information or data it contains." Name ECMWF as
  originator, the dataset, the Google Cloud copy as access route, the licence (CC BY 4.0, with a link) and that the
  data were modified.

## Gas price cases (TODO 14bo, build 09f, 9 Oct 2026)

All quotes are search extracts (the source hosts are blocked from this environment). Computed by build_gas_cases.py
into public_data/gas_price_cases.json; conversions there (US CPI-U 2024 average to January 2026 1.0369, 2018 average
to January 2026 1.2953; SA CPI January 2024 to January 2026 1.0681; R16.50/USD).
- Low: EIA AEO2025 reference Henry Hub, real 2024 USD, 2.88 in 2025 and 4.80 in 2050 (EIA Today in Energy), linear
  between (user confirmed); US LNG at 115% of Henry Hub plus a USD 3.00 tolling fee (Argus, 5 Dec 2025; OIES Quarterly
  Gas Review 32, Apr 2026); shipped 8,600 nm to Richards Bay.
- Central: 13.25% of Brent (range 12.5-14%), a free-on-board slope (S&P Global, 7 May 2024: 13.2% FOB against 14.2%
  delivered), at Brent USD 80 in 2024 dollars (IEA WEO 2025 STEPS, via an IISD explainer; dollar year probably 2024),
  shipped about 4,200 nm from Ras Laffan (waypoint estimate; no published distance found). Brent USD 100 run as well.
- High: JKM 2026 full-year estimate USD 19.80, delivered North Asia, taken as the delivered price at the South
  African coast with no shipping added (Jan-Sep average 17.76 from EIA, IEA Gas Market Report Q3-2026 and
  Reuters/LSEG monthly figures, with Oct-Dec at the early October front month of about 25.8).
- IRP 2025 as published: R260.89/GJ, January 2024 rands, flat real, no terminal or adder (assumptions workbook, New
  Tech Properties). No terminal charge is added in this case, matching the IRP.
- Shipping, the least-sourced input: a 165,000 m3 carrier, 17 knots, 3 days in port, boil-off 0.12%/day laden, heel
  0.09%/day; charter USD 60,000/day, a 2018 breakeven (OIES Insight 27), adjusted with US CPI. Charter rates have
  likely risen since the Hormuz disruption (Fearnleys: one-year charter about USD 100,000/day in March 2026).
- Variable regasification USD 0.25/MMBtu (derived, 14ak section above) is added to every case but the IRP's.
- LNG terminal as a fixed cost per kW of new gas on the send-out basis, R354-707/kW-yr (Ngqura about R22bn plus R2bn
  for the berth, 3.6 Mt/yr; Richards Bay R7bn for 2 mtpa; Standard Bank, ENN 23 Jul 2026, USD 1.5bn for two
  terminals; computed at 8% over 25 years, 53.37 GJ/t, 6,900 kJ/kWh), applied with GAS_FOM_ADD to new gas in the
  optimiser and the cost readout alike.

## Gas CCGT emissions factor (TODO 14bo, build 09e, 9 Oct 2026)

- US EPA, GHG Emission Factors Hub: natural gas, 53.06 kg CO2 per MMBtu on a higher heating value basis.
- emisCcgt = 53.06 / 1000 / 0.293071 MWh per MMBtu / 0.52 = 0.348 t/MWh, at the 52% (HHV) efficiency costCcgt
  uses. The previous 0.37 implied 48.9%. IRP 2025 OCGT units at the same factor: 9F.05 0.534, 9HA.02 0.475 t/MWh.

## ANU RE100 pumped hydro atlas, South Africa shortlist (TODO 14z, 7 Oct 2026)

Downloaded by Nick Hedley, Oct 2026: 6,921 off-river site pairs, none in protected areas, with URLs
stripped. It gives each pair's class (AAA, AA, A, B), head, energy (GWh), duration (h), system size,
reservoir type and figure of merit. Class AA and AAA: 741 sites and 341 TWh gross, matching Blakers'
"738 sites, 340 TWh" (personal communication, 6 Oct). Sizes overlap: the same reservoirs appear in up to
111 pairs. Each reservoir counted once, the shortlist holds 2,688 sites and 287 TWh.

Licence: CC BY 4.0. Andrew Blakers (ANU RE100), personal communication to Nick Hedley, 7 Oct 2026,
confirming that the ANU Pumped Hydro Atlases are released under CC BY 4.0. The shortlist is republished as
public_data/anu_phes_shortlist_za.csv with the attribution line "Source: ANU RE100 Group, Global Pumped
Hydro Atlas, South Africa shortlist (downloaded Oct 2026), CC BY 4.0." as its first line. Aggregates:
public_data/anu_phes_za_summary.csv, made by harness/ext/anu_summary.py.

Source: ANU RE100 Group, Global Pumped Hydro Atlas, South Africa shortlist (downloaded Oct 2026), CC BY 4.0.



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

## First section 34 determination under IRP 2025 (media statement, 7 Oct 2026)

Department of Electricity and Energy media statement, 7 Oct 2026, supplied by the user; the link is not
yet recorded and the determination text is not yet published. Proposed: 4,600 MW battery storage and
5,000 MW gas-to-power. No new wind or solar in this determination; a later determination is to cover
them, hybrids and pumped storage. Gas is framed as flexible (start-up, ramping, minimum levels, fuel
logistics, operating profile); the statement does not mention the IRP's 51% minimum load factor.

Bearing on the model: the engine's annual gas floor (51% on 6 GW, 2030-2040) rests on IRP 2025, not on
this determination. Nothing changes until the gazetted determination and NERSA's concurrence are read.
Not loaded; feeds the first-determination scenario (TODO 14au) once it is built.

## Energy Storage and Gas New Generation Capacity Determination, gazetted 14 Oct 2026 (user, message 104)

Government Gazette 55543, General Notice 8021, 14 Oct 2026 (signed 10 Oct 2026); citation supplied by the user, not opened in
this session. 9,600 MW to be procured from independent power producers, NTCSA as buyer: energy storage 4,600 MW (Table 1,
'Energy Storage', 2026-42) and gas 5,000 MW (Table 1, 'Gas - IPP Programme', 2031-37). No technology, storage duration or fuel
is specified. Deviations from the timetable are allowed for grid capacity (para 5). This is the gazetted form of the 7 Oct 2026
media statement below.

Our reading (user, 15 Oct 2026, message 108): the 5,000 MW covers Table 1's 2031-37 IPP gas only, so it is additional to the
3,000 MW of IPP gas determined under IRP 2019 (next entry), 8,000 MW in all. The determination does not say so in words; this is
our reading, not its text.

Use: sensitivity s_detgas (message 104; sources corrected in message 108), c5b_14r plus a cumulative floor on new IPP gas
(pathway setting GAS_CUM): 3,000 MW by 2030 (the IRP 2019 section 34 gas determination, next entry; IRP 2025 assumes all 3 GW on
the grid by 2030), CCGT with the IRP's 50% minimum load factor (plan pp.35-36), treated as in s_irpgas; then 3,833 (2032), 4,666
(2033), 5,499 (2034), 6,167 (2035), 7,000 (2036), 8,000 MW (2037), this determination's 5,000 MW spread over Table 1's 2032-37
IPP gas years (7,500 MW) in proportion, CCGT and open-cycle on LNG together, the optimiser choosing the type. The run is
unchanged; only its sources were corrected.

## Gas-to-power 3,000 MW: section 34 determination under IRP 2019, and IRP 2025's assumption (user, 15 Oct 2026, message 108)

- Ministerial determination under section 34 of the Electricity Regulation Act, made under IRP 2019: 3,000 MW of gas-to-power
  for 2024-27; NERSA concurrence September 2020. Reported by Cliffe Dekker Hofmeyr, 14 Sep 2020 (citation supplied by the user,
  not opened in this session).
- IRP 2025, plan p.16 (gazette p.28): 'gazetted for 3 GW of capacity through the GAS IPPPP BW1; however, currently, 2 GW has
  been offered to the market ... The IRP 2025 assumes all 3 GW will be available on the grid by 2030.' (Quoted by the user. This
  replaces message 104's 'IRP 2025 p.12', which was wrong.)
- Use: the 2030 3,000 MW step of s_detgas's GAS_CUM floor (entry above).

## Optimiser grid cost (TODO 14ar, build 07g, 7 Oct 2026)

Decisions are the user's (7 Oct 2026). Constants in BLD_GRID, index.html; distances regenerated by
harness/ext/grid_distances.py.

- Central line cost: Independent Transmission Projects Phase I, USD 1bn for 1,164 km, about R15.5m/km
  including substations, so no separate bays. South African, unverified.
- High: MISO Transmission Cost Estimation Guide, 345 kV class as the 400 kV equivalent, R37m/km (central of
  R34-44m) and R76m per bay (USD 4.4m, middle of the MTEP24 range). US labour and land; probably high for
  South Africa.
- 132 kV: the 400 kV figure times 0.607, NREL reV's MISO cost of a 205 MW-class (138 kV) line, USD 1,446,469
  per mile, over a 400 kV line interpolated by voltage between its 400 MW (230 kV, 1,694,747) and 1,500 MW
  (500 kV, 2,787,303) classes (2019 USD, reV code on GitHub). A ratio only, not a level.
- Circuit ratings: 132 kV 205 MW (the reV class); 400 kV 1,000 MW (MISO 345 kV 750 MW scaled by voltage squared).
- Storage bay: the high-case 132 kV bay (R76m x 0.607) per 90 MW scheme, the BESIPPPP BW1 preferred bidders'
  mean (IPP Office REIPPPP historical data note, 7 Nov 2025).
- Integration: txRPerKWyr, R402/kW-yr (TDP 2024 Table 4, generation integration share).
- Distances, straight line to the nearest substation: wind 37.7 km and solar 21.9 km, MW-weighted over 254
  and 1,161 approved DFFE REEA projects (nodal/reea_projects.json); beyond 18 km, 22.0 and 9.7. Pumped hydro
  73.4 km to 275 kV or more, GWh-weighted over the ANU AAA and AA class medians (beyond 18 km, 55.4). Gas
  7.5 km: Richards Bay 11.9 km to Athene, Coega 3.1 km to Dedisa (port coordinates approximate). The median
  over all 2,392 approved projects is 16.6 km; the 18 km threshold is the user's earlier figure.
- No recorded source (user, 21 Oct 2026, messages 303 (b) and 304 (b); build 2026-10-21l): BLD_COST PV R12,000/kW fixed tilt and
  rooftop R17,000/kW are marked 'no recorded source' on the page (assumptions table and capex line). Both are in the
  repository's first commit, 774dc8d (1 Oct 2026, 19:04 SAST), with no source given. That commit's comment attributes only the
  decline rates (3.89% a year, BNEF 2035 forecasts, no document named) and gives dollar equivalents at R16.2/USD (PV about
  USD 740/kW); TODO 14ba (7 Oct) notes R12,000 sits near IRENA 2024's global USD 691/kW (about R11,400), a benchmark, not a
  source. Rooftop's only partial reference is Kerwin et al., USD 1,406/1,258/1,110/kW for 2020/30/40 (HANDOVER), not the
  R17,000. If a source is found before 6 Nov, it replaces the label here and on the page.
  Cross-checks beside the label (user, 22 Oct 2026, message 305; benchmarks, not sources; the label stays):
  - Utility fixed-tilt PV (BLD_COST.pv, R12,000/kW): IRENA, Renewable Power Generation Costs in 2024, utility-scale PV global
    weighted average total installed cost USD 691/kW (2024 USD; about R11,400 at R16.50). GreenCape, Energy Services Market
    Intelligence Report 2023: embedded PV over 1 MWp R8,000-9,500/kWp (2022 prices; about R9,600-11,400 in January 2026 rands on
    the model's CPI chain, x1.20; VAT treatment not stated).
  - Rooftop (BLD_COST.rooftop, R17,000/kW): a 30 kWp commercial and industrial rooftop estimate, 2025, seen by the author
    (anonymised; not a published source): R302,204 including VAT (R262,786 excluding) for 30.0 kWp of modules on 24 kW of
    hybrid inverters, no battery, design, installation and certificate of compliance included. Excluding VAT R8.76/Wp DC, about
    R10,950/kW AC; in January 2026 rands (x1.035, CPI_JAN25_TO_JAN26) about R9.07/Wp DC and R11,330/kW AC; including VAT about
    R13,000/kW AC. GreenCape 2023: under 100 kWp R11,000-15,000/kWp, 100-500 kWp R10,500-13,000/kWp (2022 prices; about
    R13,200-18,000 and R12,600-15,600 in January 2026 rands; VAT treatment not stated). EnergyBee guide, 29 Sep 2026: grid-tied
    homes without battery R12-19 per watt (installer market prices, presumably including VAT; no sources given).
  - Basis: the public figures do not say whether they are per kW DC or AC, and the model's own basis for either figure is not
    recorded. c5f builds tracking solar (pvTracking 1; BLD_COST.pvtrk derived from the BW7 solar awards, R11,038/kW in 2026),
    so BLD_COST.pv reaches only runs with tracking off, the page's default (bldPvTracking 0) among them; rooftop's R17,000 does
    enter c5f. The commercial estimate excluding VAT is about a third below R17,000/kW AC. TODO 14im.
  - Lead (message 317 (c); from a SAPVIA spokesperson's deck, Oct 2026, advocacy; not a source until a primary one is found):
    home kit costs including VAT, PV R7/Wp installed, inverter R2,000/kW, battery R2,400/kWh.
- Wind and solar capex boundary: BLD_COST wind R21,000 and PV R12,000/kW have no recorded source, so whether
  they include connection is unclear; charge from zero is central and beyond-18-km the sensitivity. Under
  REIPPPP the developer funds the dedicated connection (Eskom budget quote and cost estimate letter;
  self-build or Eskom build), so bid-derived capex probably includes it.

## Existing diesel peakers: dates and life extension (TODO 14as, build 07h, 7 Oct 2026)

- IRP 2025, section 3.2.1.2.2, p.13 (Gazette 53596 p.24): Port Rex and Acacia, 314 MW, end of life
  2025-2026; Ankerlig and Gourikwa mid-2040s; Avon and Dedisa, procured on 15-year contracts, expire
  2030-2031. Section 3.2.1.1.3, same page: coal 50-year end of life, 8 GW reduction 2029-2030, a further
  15 GW 2034-2042. Page references supplied by the user.
- About 30 years (user's default): PyPSA-RSA fleet_by_region_v2.csv decommissioning dates, Ankerlig 2039 and
  Gourikwa 2038; Eskom heritage page: Gourikwa phase 1 in commercial operation 2007, phase 2 and Ankerlig
  phase 2 started August 2007.
- Fleet in the model: 3,400 MW (Ankerlig 1,338, Gourikwa 746, Acacia and Port Rex, Avon 670, Dedisa 335).
  The fleet file has Acacia and Port Rex at 342 MW; the IRP's 314 MW is what retires.
- Life extension: R1,500/kW, a labelled placeholder. UK Capacity Market, government response (2025): the
  capex threshold for a refurbishing unit's three-year agreement lowered to GBP 65/kW (proposed GBP 50/kW,
  after a Baringa study), a policy threshold set for CCGTs, not a measured cost. Sensitivity R4,000/kW.
  No South African figure found.
- Fixed O&M: fomDiesel R360/kW-yr on every MW online, Avon and Dedisa included after their contracts.
- Avon and Dedisa must-run to contract end (user, 14 Oct 2026, message 88; build 2026-10-14o): Dedisa commissioned end-2015,
  Avon 20 July 2016 (POWER Magazine, 25 July 2016), 15-year terms, so Dedisa to end-2030 and Avon to 20 July 2031 (IRP 2025
  3.2.1.2.2, contracts expire 2030-2031). Levels: Eskom data ESK19679, column 'Dispatchable IPP OCGT' (Avon and Dedisa
  together), monthly means of the daytime block (05-16) and evening block (17-20), 2025 and January-August 2026; derived by
  harness/derive_avon_dedisa.py from the local file, 24 monthly figures published with Eskom credited, the analysis ours, not
  Eskom's; no hourly series.

## Storage sustain times for operating reserve (user, message 97; build 2026-10-14q)

- Instantaneous 10 minutes: NTCSA ASTR 2026/27-2030/31 (January 2026), p.6.
- Regulating 60 minutes and ten-minute 30 minutes: CAISO, Non-Generator Resources, revised draft final proposal (10 February
  2010), continuous-energy rules for regulation (60 minutes) and for spinning and non-spinning reserve (30 minutes). Citation
  supplied by the user; the document was not opened from this session. Borrowed because the ASTR states no sustain time for
  either product; cited assumptions. Superseded: regulating 1 hour and ten-minute 3 hours (message 86).

## Interruptible load: annual energy (user, message 98; build 2026-10-14q)

- 177 GWh a year: Eskom data ESK19679, 2025, ILS (interruptible load supply) 69.5 GWh plus IOS (interruption of supply,
  excluding ILS and manual load reduction) 107.8 GWh, aggregate only, Eskom credited, the analysis ours. Corrected 17 Oct 2026
  (user, message 176 (2)): until then this line called the two together "the two interruptible products"; IOS is not
  interruptible load alone. It covers contracted and mandatory demand reduction used by Eskom National Control and also
  interruptions of supply due to transmission (USAID and DMRE, South Africa: Energy Efficiency Demand Side Management
  Experience 2004-2022, June 2023, as found by web search; the report was not opened), and the data does not split the two. The
  like-for-like interruptible load is ILS, 69.5 GWh. The 177 GWh was a calibration to observed use, tried as an annual cap in build
  14q and withdrawn in 14r; nothing in the code uses it (drInterruptAnnualMWh defaults to 0). Manual load reduction (390 GWh in
  2025, on 17 days between 31 Jan and 15 May) is a separate, instructed product and is not counted.

## Interruptible load: contracted size (user, message 94; 14 Oct 2026; applied as 1,000 MW in build 2026-10-14q, message 95)

- NREL, Demand Response at the Grid Edge (FY24; data to about 2022), https://docs.nrel.gov/docs/fy24osti/88042.pdf: Eskom's
  certified instantaneous demand response 1,014 MW; supplemental 346 MW; critical peak day 62 MW.
- Meridian Economics, Resolving the power crisis part A: insights from 2021 (June 2022),
  https://meridianeconomics.co.za/wp-content/uploads/2022/06/Resolving-Load-Shedding-Part-A-2021-analysis-01.pdf: interruptible
  load shed up to 842 MW over 218 hours, 57 GWh in 2021.
- NTCSA ASTR 2026/27-2030/31 (January 2026), p.10: emergency reserve 1,200 MW, made up of interruptible loads, generator emergency
  capacity (EL1) and gas turbines; the engine's drInterruptMW 1,200 has no source of its own.
- Eskom data ESK19679, aggregates only: ILS and IOS together 2025 at most 1,541 MW, 99th percentile 515 MW (IOS mixes demand
  reduction with transmission interruptions; see the annual-energy entry above).

## Gas and diesel turbines' minimum stable level for online reserve headroom (user, message 90; build 2026-10-14n)

- SONI (System Operator for Northern Ireland), CCGT Minimum Function Specification: continuous stable operation at 50% of
  module MCR, 35% for its gas turbines in open cycle. Read from a web-search excerpt on 14 Oct 2026; the document's host could not
  be reached from this environment, so the page and revision are not confirmed. Used as 0.5 for every gas and diesel turbine
  (reserveGasMinStableFrac), the author's assumption; no South African figure found.
- Running hours on the half-standard pathway (pathway_v_half_c1_p1.json, build 07c, twelve weather years x
  two outage draws): 94 h a year in 2026, 3 in 2028, zero from 2030 (worst draw at most 4 h).

## Diesel fuel price, costDiesel: basis (TODO 14cj, 13 Oct 2026)

- Engine: FIXED.costDiesel R6,100/MWh of output, fuel only (vomDiesel R70 separate). Its note reads 'Eskom OCGT: recent
  runs reported at ~R6,011/MWh (Mar 2026)': Eskom's realised diesel spend per MWh of open-cycle output for 2025/26 to
  date. No Brent price, exchange rate or source document was recorded with it; R6,100 is 1.5% above R6,011, reason not
  recorded (in the engine since the repository's first commit, 1 Oct 2026).
- Parliamentary reply NW1243, Minister of Electricity and Energy, 7 May 2026 (pmg.org.za/committee-question/37559):
  diesel consumed at Eskom's open-cycle stations, costs before rebates. 2024/25: 686,386,567 litres, R13,182,984,487
  (R19.21/litre). April 2025 to February 2026: 258,389,725 litres, R4,750,701,063 (R18.39/litre). Purchases 2025/26:
  270,017,374 litres, R4,818,471,905 (R17.85/litre). At R18.39/litre, R6,011/MWh is 327 litres per MWh (our division).
- Reply NW1530, same date (committee-question/37553): 2025/26 diesel expenditure R6.4bn (Eskom weekly power alert,
  3 Apr 2026), 62.46% below 2024/25.
- Brent and rand over the consumption period, April 2025 to February 2026, means of monthly values: Brent $67.21/bbl
  (EIA, FRED MCOILBRENTEU), R17.39/$ (Federal Reserve G.5, FRED EXSFUS), Brent in rand R1,169/bbl (mean of the monthly
  products). 2024/25 (April 2024 to March 2025): R1,437/bbl. Dated basis: R6,100/MWh goes with Brent about $67 at R17.39/$.
- Scaling to the 12 Oct weekly check (Brent $103.3, R16.49/$, R1,703/bbl, x1.457): R8,887/MWh if the whole price moves
  with Brent in rand. Eskom's own price moved less: from 2024/25 to 2025/26 its cost per litre fell 4.3% while Brent in
  rand fell 18.6% (about 0.23 of the move), consistent with fixed levies, margins and contract terms in the price. A
  build-up holding levies fixed would fall in between; the levies are not yet sourced. Choice of basis for s_dieselhigh:
  the user's.

## Lithium capex decline: the engine's rate against its cited source (TODO 14cw, 13 Oct 2026)

- Engine: BLD_COST.batt (and its high and low cases) decl 0.05, a 5% real fall a year from 2026: -37% by 2035, -51% by
  2040. The BLD_COST comment cites BNEF's 2035 forecasts, -25% for storage, about 3.1% a year over 2026-35. Solar (decl
  0.0389, -30% by 2035) and onshore wind (0.0286, -23%) match their cited rates; storage does not, and no source for 5%
  is recorded.
- Public forecasts, as given by the user (13 Oct 2026), not re-read here: NREL 2025 battery cost projections, mid case,
  2024 dollars, about -23% over 2026-35 (2.9% a year); Wood Mackenzie, Middle East and Africa 4-hour storage cost, -33%
  over 2026-35 (4.4% a year).
- Sensitivity s_battdecl (BATT_DECL=0.03, -24% by 2035, -35% by 2040) on c4's settings measures the effect. The next
  central uses a sourced decline rate (user, 13 Oct 2026).

## Build costs from South African bid data (TODO 14av, 14aw, 14ax; builds 07j and 07k, 7 Oct 2026)

Decisions are the user's (7 Oct 2026).

- IPP Office, South African REIPPPP historical data note, 7 Nov 2025 (uploaded by the user), January 2024
  terms: BW6 solar preferred bidders R15,715/kW (single-axis tracking, capacity factor 30.1%), BW6 solar
  compliant R19,756, BW6 wind compliant R26,647 (no wind was awarded), BESS BW1 preferred R27,888/kW at 4 h
  (including 6% augmentation). Fixed O&M R269 (solar), R367 (wind), R678 (BESS) per kW-yr. Bid ranges: solar
  R14,000-23,000, wind R19,000-36,000, storage R23,000-43,000. What the overnight cost includes is not defined;
  under REIPPPP the developer funds the dedicated connection, so it probably includes it.
- Costs on the latest market evidence per technology (user, 28 Oct 2026, message 462, reversing message 458): new utility solar
  stays on BW7's awarded tariffs (FIXED.bldPvCase 'central': the capex the MW-weighted mean of BW7's 18 solar awards, R492.53/MWh,
  implies on the run basis, R10,998/kW, about R0.53/kWh in 2026 rands; the awards span about 46-49c/kWh). Wind stays on BW6's
  compliant construction cost at 8% real (R28,462/kW): no wind tariff has been awarded since BW5, and BW7's compliant wind bids
  were rejected as too high. BW7's tariffs imply that solar developers finance at roughly 5% real over 30 years: BW6's tracker bid
  construction cost (above, R16,786/kW in 2026) with R287/kW-yr fixed O&M costs R0.52/kWh at the bids' 30.1% capacity factor at
  5% real over 30 years, against R0.74/kWh at 8% over 25 years. BW7's per-kW construction cost is not published (no IPP Office or
  DBSA figure found, web search 28 Oct 2026; neither site can be opened from the cloud environment). Sensitivities on c6c:
  every technology, solar included, on construction cost (PV_CASE=bw6) at 8% real (s_pvbw6_c6c), 5% real (s_disc5_c6c,
  DISC=0.05) and IRP 2025's 11.3% (s_discirp_c6c, DISC=0.113; messages 465, 466). Meridian's review of the IRP 2023 discounts
  at 8.2% real (Meridian Economics, Review of IRP 2023, slide 16: "future costs are discounted at 8.2% real"). IRP 2025 states 'a
  discount rate of 11.3%' (Gazette p.34); neither the plan text nor its assumptions workbook says real or nominal (the workbook's
  Economic Parameters sheet gives only 2023's average South African inflation, 5.7%); read as real, as its costs are in constant
  January 2024 rands. Read as nominal at 5.7% it would be about 5.3% real.
  BW7's disclosed R31.4bn for the first 1,760 MW (department statement, as reported by Green Building Africa and Engineering News,
  6 Jan 2025), about R18,470/kW in 2026 rands, is an upper reference only; it may include connection, development and financing.
- SA CPI, January 2024 to January 2026: 1.032 x 1.035 = 1.068 (Stats SA headline, 3.2% y/y January 2025 and
  3.5% y/y January 2026, as reported; the Stats SA site is not reachable from the cloud environment).
- IRP 2025 assumptions workbook (uploaded by the user), Learning Rates sheet, base case: onshore wind (BW6)
  R25,695/kW in 2026 (January 2024 rands), x 1.068 = R27,446/kW. The user's choice for the wind default once
  the IRP cost-set pathway run reports.
- BESIPPPP bid window 3, preferred bidders 30 May 2025: 616 MW / 2,464 MWh at five NTCSA substations in the
  Free State, R9.5bn (DEE media statement; SAnews; Engineering News). R3,856/kWh; one year at CPI 3.5% gives
  R3,990/kWh, R15,962/kW at 4 h: BLD_COST.batt from build 07j, INCLUSIONS NOT STATED. Bid window 2 (Dec 2024):
  615 MW / 2,460 MWh, R12.8bn, 31% local content. BW3's average evaluation price was 40% below BW1 and 8% below BW2.
- BNEF Energy Storage System Cost Survey 2025: turnkey (battery racks, PCS, EMS; excluding EPC and grid
  connection) USD 117/kWh global, 73 China, 177 Europe, 219 US; 2024 USD 165, 40% below 2023 (via
  Energy-Storage.news). BNEF battery price survey 2025: stationary-storage packs USD 70/kWh, 45% below 2024;
  lowest LFP cells USD 36/kWh. The old BLD_COST.batt (R8,105/kW, R2,026/kWh, no recorded source) sits at the
  global turnkey level and is the low case.
- Solar tracking profile: PVGIS (EC JRC) v5_3, PVGIS-SARAH3, single horizontal axis north-south, 10% system
  loss, at the ten fixed-tilt points (build_solar_tracking.py; nodal/profiles_solar_tracking.json). The user
  asked for Renewables.ninja's tracking option; it is not reachable from the cloud environment, so PVGIS was
  used, which is the source of the existing fixed-tilt solar too. SARAH3 covers 2005-2023; 2024 and 2025 use
  the PVGIS tracking/fixed ratio by region, month and hour.
- Modern-turbine wind profile (new wind, bldWindModern): Renewables.ninja MERRA-2 (CC BY-NC 4.0), Vestas V162 5600
  at 120 m, at the 98 sites of profile_sites.json, sample year 2019, mapped onto every year of the existing file in
  50 bins per region (build_wind_modern.py; nodal/profiles_wind_modern.json and the national map
  nodal/profiles_wind_modern_map.json). Stored uncorrected. Correction for new wind 1.064 central, 1.00 low
  (index.html WIND_NEW_CORR; user decision, 7 Oct 2026), fitted to developer-stated annual output: Impofu 330 MW,
  1,260 GWh (Enel) and San Kraal 140 MW, 616 GWh (EDF), check_wind_farms.py, weather years 2016, 2019, 2021, 2023.

## Carbon tax in law and IRP 2025 on emissions (user, 14 Oct 2026; research helper, HTML pages and search extracts, no PDFs)

- Rate before allowances, Carbon Tax Act 15 of 2019 s5, Acts Online consolidated text (unofficial), read 14 Oct 2026,
  https://www.acts.co.za/carbon-tax-act-2019/5__rate_of_tax : 2024 R190 (s5(2)(b)); 2025 R236 (s5(2)(c)); 2026 R308 (s5(2A));
  2027 R347, 2028 R385, 2029 R424 (s5(2B)(a)-(c)); 2030 R462 (s5(2C)); as amended by the Taxation Laws Amendment Act 20 of 2022
  (GG 47826, 5 Jan 2023) and, for 2024, the Rates and Monetary Amounts Amendment Act 45 of 2024 (GG 51829, 24 Dec 2024). After
  2030, s5(3): increased by amounts the Minister announces in each Budget; none in law. Index.html CARBON_TAX_LAW (build 14g).
- Announced, not legislated: 2022 Budget Review, chapter 4 (page not seen): "at least US$30 by 2030, accelerating to higher
  levels by 2035, 2040 and up to US$120 beyond 2050".
- Allowances: 2025 Budget Review (May 2025), chapter 4, as reported in search extracts and law-firm notes (Cliffe Dekker
  Hofmeyr), page not seen: the basic tax-free allowance is kept to 31 Dec 2030, with consultation on reductions from 1 Jan
  2031; the earlier proposal to cut allowances from 2027 was dropped. The model's allowance path (85% in 2026 cut 2.5 points
  a year to 75% in 2030) predates this (TODO 14eb). Section 14 caps allowances at 95%. The generation levy is replaced by the
  carbon tax from 1 Jan 2026, with a floor on a generator's liability of R0.035/kWh after the renewable-premium deduction
  (s6(2) as substituted by the Taxation Laws Amendment Act 5 of 2026, GG 54448, 1 Apr 2026; Acts Online).
- c5 central carbon path (user decision, 14 Oct 2026; index.html carbonTaxAt, carbonAllowancePath 'kept2030', build 14h): the
  February 2025 Budget documents as reported by Engineering News, 19 Feb 2025: 'maintenance of the basic tax-free allowance
  until December 31, 2030, rather than reducing it from 2027' (the user's citation; not re-read here). The model holds its
  2026 net share (R46 of R308) to 2030 on the rates in law and holds the 2030 value after. Caveat: electricity price
  neutrality is also extended to 31 Dec 2030 and may lower generators' net cost further; not modelled.
- Nominal to 2026 rands: South Africa's inflation target, 3% with a 1-point band, announced by National Treasury and the SARB on
  12 Nov 2025 (MTBPS), https://www.treasury.gov.za/comm_media/press/2025/2025111201%20Announcement%20of%20the%20new%20inflation%20target%20for%20South%20Africa.pdf
  (PDF, not read; via SAnews, https://www.sanews.gov.za/node/78213, and Polity, 13 Nov 2025). CARBON_CPI_PA = 0.03 deflates the
  rates in law for 2027-2030 in 'kept2030' and carbonTaxFull; 'cut2027' stays nominal as c4 ran it.
- Carbon budgets: R640/t on emissions above an allocated budget, s5(5) and s6(6) inserted by the 2026 Act; in force only from a
  date the Minister of Finance sets by Gazette notice (none seen).
- IRP 2025 (GG 53596, 28 Oct 2025): no emissions constraint found. Search extracts of the gazette and the user-friendly IRP
  2025 (pages not seen): the sector emission targets are in draft, so "the application of the Carbon Tax Act ... is used as a
  proxy in the IRP 2025"; emissions are a result: 168 Mt CO2 in 2030 (at 66-68% availability and 255 TWh), 142 Mt in 2035
  ("a 22% reduction"), Figure 19 'CO2 Emissions Trajectory'; 168 Mt is said to sit within the NDC range of 350-420 Mt CO2-eq
  for the economy. The IRP's carbon price assumption, US$50/t in 2040 and US$100/t in 2050 "based on the National Treasury
  guidance", is also from an extract only. IRP 2019 (notice 1360 of 2019, s4.4, Acts Online) applied the peak-plateau-decline
  trajectory as its primary assumption, with a carbon-budget scenario of 5,470 Mt cumulative.
- Not reached (PDFs): the IRP 2025 gazette and user-friendly version (dmre.gov.za), Budget Reviews 2022, 2025 and 2026, Acts 5
  of 2026 and 45 of 2024.

## Single-axis tracking share of South African utility solar (TODO 14aw; read 14 Oct 2026, research helper, HTML pages only)

- REIPPPP BW1-BW4, PPA contracted MW by mounting: Minister of Energy, reply to parliamentary question NW368 (question dated
  15 Mar 2019), PMG, https://pmg.org.za/committee-question/11216/ (read directly). Single-axis / fixed MW: BW1 162.9 / 427.9
  (plus 36 MW dual-axis CPV), BW2 240.4 / 176.7, BW3 75.0 / 360.0, BW4 812.9 / 0; BW1-4 together 1,291.2 / 964.7, 56% single-axis.
  The totals match the published window totals (627, 417, 435, 813 MW). Caveat: a 2019 listing of contracted plants, not as built;
  two plants of about 33 MW may use azimuth rather than horizontal single-axis trackers (search snippet only).
- "By BW4 all the projects had adopted tracker solutions": T. Creamer, Engineering News, 5 Oct 2020, as republished by Array
  Technologies, https://arraytechinc.com/press-release/spanish-solar-tracking-group-establishes-formal-presence-in-south-africa/
- BW6: preferred bidders single-axis tracking, capacity factor 30.1% (IPP Office REIPPPP historical data note, 7 Nov 2025, as
  uploaded by the user; build costs section below).
- Later plants confirmed on trackers (operating): Scatec Grootfontein, BW5, 225 MWac (TGS Prediktor release, 12 Jun 2026); SOLA
  Lichtenburg wheeling plants, 126 and 130 MW (pv magazine, 17 Jul 2024; Engineering News, 2 Aug 2024); Envusa Mooi Plaats 240
  MWac (Green Building Africa, 19 Mar 2026). Tracker orders: GameChange about 500 MW for southern Africa (PV Tech, 26 Apr 2024);
  FTC Solar about 840 MW with Lubanzi-Inala (GlobeNewswire, 23 Feb 2026). No fixed-tilt utility plant after BW3 found.
- Estimate (ours): of the model's 3,271 MW of operating utility solar, about 965 MW is fixed-tilt (BW1-3), so about 70%
  single-axis if every later plant tracks; 62% confirmed project by project (2,012 MW). Pipeline about 95-100% single-axis,
  resting on BW4 and BW6 being all tracking, the confirmed later plants and the tracker orders; most BW5-7 projects are not
  confirmed one by one. Not read (PDFs): IPP Office 'Focus on solar PV' reports, DMRE and DBSA bidder lists, GreenCape reports.

## International benchmarks for central build costs (RULES, 7 Oct 2026)

- IRENA, Renewable Power Generation Costs in 2024 (July 2025): global weighted average total installed cost,
  onshore wind USD 1,041/kW (R17,180 at R16.50), utility-scale solar USD 691/kW (R11,400); India 525 and China 591
  for solar. South African BW6 bids sit about 66% (wind) and 47% (tracking solar) above these.
- Wind central from build 07q: BW6 compliant bids R26,647/kW (January 2024) x 1.068 = R28,463/kW. IRP 2025's BW6
  base case (R27,446/kW, 2026) is a cross-check only.
- Lithium central from build 07p: BW3 aged to January 2026 (equipment share at BNEF's 2025 turnkey decline),
  R3,425/kWh; BNEF turnkey 2024 USD 165/kWh, 2025 USD 117/kWh.

## PyPSA-RSA: licence and what we take (user, 13 Oct 2026)

Licence (user, 13 Oct, per the GitHub page github.com/MeridianEconomics/pypsa-rsa): AGPL v3. Checked in our local clone at
commit 89872c1 (8 Apr 2026): README.md carries SPDX-License-Identifier AGPL-3.0-or-later and the AGPL v3 badge, and
licenses/ holds AGPL-3.0-or-later.txt. The same folder also holds CC-BY-4.0.txt and CC0-1.0.txt; the documentation files
carry CC-BY-4.0 headers; a few scripts carry MIT or GPL-3.0-or-later headers. Its data-licence table
(docs/configtables/licenses.csv) lists the supply-region shapefiles (supply_regions/11-supply.shp, RSA.shp; source Eskom GCCA)
as BY, NC, SA with changes marked, so those boundaries carry the GCCA terms, not AGPL. The 10-supply resolution is built on the
GCCA 2025 transmission supply regions (README).

What we take from it (every file found, 13 Oct 2026; repository searched for PyPSA-RSA, Existing_Lines, reipppp_, fleet_by_region):
- fleet_by_region_v2.csv (nodal/fleet_by_region_v2.csv, identical copies at the root and in 'nodal old/', and in 'nodal old.zip'):
  the thermal fleet; UC_FLEET in index.html (unit sizes, ramp and minimum-load parameters, heat rates, GPS, decommissioning
  dates) and the unit parameters in nodal/nodal_dispatch.js. Origin (checked 13 Oct 2026): the 51 BASE rows of the
  'conventional' sheet of PyPSA-RSA's public workbook scenarios/ME IRP 2024/sub_scenarios/fixed_technologies.xlsx (commit
  89872c1), equal in all 25 shared columns except Min Stable Level, which is 0.5 in ours and 0 in the workbook for 16 coal
  rows (Camden*, Camden**, Hendrina*, Kendal*, Kendal**, Komati, Kusile*, Kusile**, Kusile***, Lethabo**, Majuba*, Majuba**,
  Matimba*, Matimba**, Medupi*, Medupi**); plus five spatial-join columns (geometry, NAME_1, index_right, name, region) assigning
  each plant to a GCCA supply region. Who made those two changes, and when, is not recorded: this repository's history starts
  on 1 Oct 2026 (774dc8d), with the file already present, and no build script or note for it was found. Committed in our public
  repository. A slimmed replacement (branch claude/fleet-slim) and a private copy of the full file (gridtwin-data, branch
  claude/pypsa-rsa-fleet) are paused, user, 13 Oct: decision after the Meridian call.
- Existing_Lines.shp: topology and transfer limits. The CORRIDORS tables (limit MW, length km) in nodal/nodal_engine.py,
  nodal/nodal_engine.js, validation/pypsa_crossval_uc.py and validation/mip_solver.py were rebuilt from its line geometries
  (nodal_engine.py header); two corridors (Free State-KwaZulu Natal, North West-Western Cape) keep an earlier estimate. The
  corridor reactances in nodal/corridor_electrical.json come from nodal/transmission_lines.geojson, whose own metadata gives
  Eskom TDP plus SAPP planning data, not PyPSA-RSA.
- rsa_supply_regions.gpkg: the 10-region GCCA boundaries used to assign each line to its two regions (nodal_engine.py
  header); PyPSA-RSA's naming, origin to confirm. PyPSA-RSA's licence table puts its supply-region files under the GCCA's
  BY-NC-SA terms.
- reipppp_wind_data.csv and reipppp_solar_data.csv: capacity-weighted centroids of REIPPPP plants, used as the coordinates for
  the regional wind and solar profiles (nodal/profiles_regional.json meta 'coords'; fetch_real_regional_profiles.py). Not on
  disk (build_profile_sites.py); the multi-site rebuild (profiles_regional_rebuilt.json) takes locations from REEA instead.
- data/eskom_pu_profiles.csv: the CSP per-unit hourly profile (Eskom, calendar 2021) in profiles.json and nodal/profiles.json
  (meta csp_source). Eskom data in origin; not in PyPSA-RSA's data-licence table.
Our LICENSE file lists 'PyPSA-RSA network topology and fleet data (Meridian Economics) - MIT', which disagrees with the
repository's own AGPL v3; to correct once Meridian has answered.

Our use: to confirm with Meridian (user raising it on the 13 Oct call): the terms for the fleet file and the transfer limits,
whether the NC-SA terms on the GCCA region boundaries reach our 10-region topology, and the attribution they want. TODO 14df
step 8 and 14dg step 2 depend on the answer. The app's footer links PyPSA-RSA to
github.com/PyPSA/pypsa-za (the earlier PyPSA-ZA repository), not MeridianEconomics/pypsa-rsa; fix with the next app change.

## PyPSA, the library (validation/), not PyPSA-RSA (user, 13 Oct 2026)

validation/pypsa_crossval_uc.py and validation/mip_solver.py import the PyPSA library (pypsa, github.com/PyPSA/PyPSA) and solve
with HiGHS through linopy. Licence, from its own repository (checked 13 Oct 2026): MIT (LICENSE on master: 'MIT License,
Copyright (c) 2015-2026 PyPSA contributors'; README SPDX-License-Identifier MIT). The scripts build their own network from
GridTwin ZA's data files and do not run PyPSA-RSA's code; their CORRIDORS table is the Existing_Lines.shp-derived one above, so
they use PyPSA-RSA data but not its code.

## NTCSA GCCA 2025 data: NTCSA's own terms, and our files built on it (user, 13 Oct 2026)

We took the GCCA 2025 supply-area boundaries and headroom figures from NTCSA directly (ntcsa.co.za/gcca/: 'GCCA 2025 GIS files
(zip)', 'GCCA 2025 Results (xlsx)', 'GCCA 2025 (pdf)'). Checked 13 Oct 2026 (ntcsa.co.za read through Firecrawl; the report
PDF and the zip not opened):
- No licence specific to the GCCA data on the GCCA page or found in the report; the report editions carry a liability
  disclaimer ('provided "AS IS"', from search summaries, wording of the 2025 PDF not confirmed).
- The site-wide Website Terms and Conditions (NTCSA, 'Last updated: June 2024', linked as 'Terms of use' from every page)
  govern: 2.1 'The NTCSA licenses the user to view, download, and print the content of the NTCSA website, provided that such
  content is used for private, personal, educational, and/or noncommercial purposes only.' 2.2 'Content from the NTCSA website
  may not be used or exploited by users for any commercial and non-private purposes without the prior written consent of the
  NTCSA.' 2.8 small, accurate quotations in inverted commas, acknowledged. 2.10 no crawlers or robots without consent. 3.1 all
  intellectual property, including downloads and databases, is NTCSA's or licensed to it; other rights reserved. 3.1.2 no
  unauthorised copying, reproduction, distribution, dissemination or publication. Page footer: '@2024 National Transmission
  Company South Africa SOC Ltd ... All rights reserved'. Website enquiries: webmaster2@eskom.co.za; GCCA page: info@ntcsa.co.za.
- So publishing GCCA-derived boundaries or headroom in a public repository is not clearly permitted without NTCSA's written
  consent (not legal advice). Eskom's old GCCA page (eskom.co.za/eskom-divisions/tx/gcca/) returns 404.

Our files built on it, and the licence each states now:
- public_data/connection_headroom.csv: 'CC BY 4.0 - attribution required'; public_data/README.md: CC BY 4.0.
- nodal/substation_bands.json, nodal/firm_headroom_lookup.json, nodal/region_headroom_lookup.json: CC BY 4.0.
- nodal/substations_compact.json: CC BY 4.0 ('changed from CC BY-NC-ND on 6 Sep 2026'), copyright Nick Hedley.
- nodal/headroom_summary.json, nodal/bq_queue.json: CC BY-NC-ND 4.0, copyright Nick Hedley.
- nodal/supply_area_split_draft.json: CC BY-NC-ND 4.0 (licence said to cover the compilation).
- Built on the 10 GCCA supply regions without naming GCCA: nodal/regional_renewable_capacity.json, nodal/profiles_regional.json,
  nodal/rooftop_mw_by_region.json (CC BY 4.0 each); nodal/demand_2025_regional.csv (no licence line; ESRG regional demand);
  the CORRIDORS limits in the nodal engines (via rsa_supply_regions.gpkg).
- The repository LICENSE lists 'GCCA connection capacity data: NTCSA - public domain', which NTCSA's terms contradict.
None of these self-assigned licences can grant more than NTCSA's terms allow for the underlying data. Nothing changed now.

## Tubatse pumped storage: support for BLD_PHES_CAPS central and bldPhesHours 14 (user, 13 Oct 2026)

- Eskom media statement, 13 Oct 2026 (as given by the user; read by the advisor on 13 Oct 2026, figures match; eskom.co.za cannot
  be read from this environment):
  request for qualification for Tubatse pumped storage, 1.5 GW, about 21 GWh, up to 14 hours, near Roossenekal, Limpopo, water
  from De Hoop Dam; closes 30 Nov 2026; Eskom is seeking an IRP 2025 allocation and a section 34 determination.
- Engineering News, 22 May 2026 (checked by the user, 9 Oct; already cited at BLD_PHES_CAPS in index.html): construction from
  2028, operation about 2038.
- Supports: BLD_PHES_CAPS central (Tubatse alone, 1,500 MW from 2038) and bldPhesHours 14 (21 GWh on 1.5 GW).
- Cost: c4's optimiser prices new pumped hydro on the 'anu2026' basis, R21,384/kW at 14 hours ((USD 1,100/kW + USD 14/kWh x 14)
  x 16.5); the 'tubatse' basis gives R29,264/kW ((1,226 + 11.4 x 14) x 1.28 x 16.5). The engine check already charges new pumped
  hydro at acapPs, R2,360/kW-yr, from Tubatse (R35.9bn in 2022 rands, JET plan, escalated to about R29,200/kW, 60 years at 8%),
  so c4's engine cost already prices its 1,354 MW at Tubatse's cost; only the optimiser's build decision uses the cheaper basis.

## UC_FLEET minimum stable level 0.5 on 16 coal rows: our change to Meridian's data, unsourced (user, 13 Oct 2026)

UC_FLEET in index.html (msl) and fleet_by_region_v2.csv (Min Stable Level) carry 0.5 for 16 coal rows where Meridian's ME IRP
2024 workbook has 0: Camden*, Camden**, Hendrina*, Kendal*, Kendal**, Komati, Kusile*, Kusile**, Kusile***, Lethabo**, Majuba*,
Majuba**, Matimba*, Matimba**, Medupi*, Medupi**. Every other value of those rows matches the workbook. The 0.5 is our change,
made before this repository's history begins (1 Oct 2026), with no source or note found. c4 uses it (unit commitment in the
engine and the optimiser's coal minimums). Not changed; to source (TODO 14dj).


## IRP 2025 emissions and REIPPPP wind tariffs (c5 write-up, 14 Oct 2026; research helper, HTML pages and search extracts, no PDFs)

IRP 2025 emissions:
- Gazette: Government Gazette 53596, notice 6767, 28 October 2025, https://www.gov.za/sites/default/files/gcis_document/202510/53596gon6767.pdf
  (link seen on UCT Libraries, 30 Oct 2025; PDF not opened). Acts Online (29 Oct 2025): the version gazetted after hours on
  28 Oct was withdrawn and replaced by a revised version on 29 Oct, so page numbers may differ between versions.
- Figure 19 'CO2 Emissions Trajectory (Mt)', plan p.30, section 4.7.3 (user, 14 Oct 2026, from the full plan): 168 Mt in
  2030 and 142 Mt in 2035 for the electricity sector. Cite the Mt only (user): the plan's '22% reduction' does not match
  its own numbers (15.5%), and SAnews's 160 Mt is not used.
- 168 Mt goes with 255 TWh in 2030 and is '39.9%' of the NDC (extracts). No other year found; Figure 19's values not seen.
- 168 to 142 Mt is 15.5%, not 22%; the base of the 22% is not stated. SAnews, 19 Oct 2025 (read): 'approximately 160
  million tonnes of carbon dioxide (CO2) equivalent by 2030, declining to 142 million tonnes by 2035'. Cliffe Dekker
  Hofmeyr, 19 Nov 2025 (read): 168 Mt is about 40% of the 420 Mt CO2-eq NDC target. The plan labels the figures CO2;
  secondary sources call them CO2-eq; nothing read says whether other gases are included.

REIPPPP onshore wind tariffs:
- BW5 (preferred bidders 28 Oct 2021): 1,608 MW in 12 wind projects (gov.za statement, 8 Dec 2022, read). Weighted average
  wind R495/MWh fully indexed (R495.22; Crown Publications 4 Nov 2021 and Engineering News 28 Oct 2021, read; DMRE statement
  28 Oct 2021, extract), lowest R344.25/MWh (TaiyangNews, 29 Oct 2021, read). Price base: about April 2021 (RFP released
  12 April 2021); not confirmed. The 8 Dec 2022 statement restates BW5 solar R428.79 as R454.23 (x 1.059) at BW6's base.
  Only 784 MW of BW5 wind had signed agreements by 8 Dec 2022.
- BW6 (8 Dec 2022): no wind awarded; 4,116 MW of wind bids, all in the Eastern and Western Cape supply areas, with no grid
  capacity confirmed by Eskom (gov.za statement, 8 Dec 2022, read).
- BW7 (23 Dec 2024; further awards July and Dec 2025): no wind awarded; 8 wind bids, 4 compliant (gov.za, 23 Dec 2024, read);
  the minister said the wind tariffs were too high (Green Building Africa, 23 Dec 2024, read); after value-for-money
  negotiations with four wind bidders, only solar was appointed (Engineering News, 15 Dec 2025, read). No wind tariff
  published.
- BW4 (16 Apr 2015): onshore wind R619/MWh fully indexed, April 2014 rands (Engineering News, read).
- Indexation: BW5 bidders submitted partial and full CPI-indexed prices; the 'fully indexed' price is quoted (White & Case,
  17 May 2022, read).
- Converting BW5 to January 2026 rands (approximate, ours): x 1.059 (the IPP Office's own BW5-to-BW6 restatement) then the
  January CPI rates in BLD_COST's wind_high note (6.9%, 5.3%, 3.2%, 3.5%), about x 1.27 in all: about R620-630/MWh.

## IRP 2025 demand forecast and the Cape wind curtailment allowance (user messages 65, 67-69, 14 Oct 2026)

IRP 2025 demand (research helper: web search; DEE hosts blocked here, and the plan is a long PDF, so no IRP page was read
first-hand; wording from search summaries, pages not known; to confirm against the plan):
- IRP 2025 key outcomes: '... meet the energy demand forecast of 255 TWh in 2030' (with the 168 Mt). Assumptions section:
  'electricity energy demand forecast of 255 TWh by 2029'. 'The electricity demand forecast developed by ESRG ...'.
- TaiyangNews, A. Bhambhani, 'South Africa Targets 25 GW Solar PV By 2039 Under IRP 2025', 22 Oct 2025: 'Government
  estimates show the country's electricity demand to rise to 255 TWh by 2029.'
- DEE, Draft IRP stakeholder workshops deck, November 2024 (search summary): Reference Case 'based on the Moderate forecast',
  which 'includes the impact of Mozal smelter'.
- ESRG, UCT, 'High Spatial and Temporal Resolution End-use Electricity Demand Projection Model', web page, undated (read):
  'The results of these efforts have already been directly used to provide the electricity demand projection scenarios used
  in the latest national Draft IRP 2024 and 2025.'
- G. Ireland, Demand-Spatialization-South-Africa, GitHub repository (MIT licence; read 21 Oct 2026, message 271 (9)): provincial
  hourly demand, 2023-2050, ESRG v2024 national projections split by Eskom provincial transformer data. nodal/demand_2025_regional.csv
  is its spatialized_outputs/IRPDemandREF_provincial_no_exports.csv, model_year 2025, rotated by -96 hours (sha256 of the file read
  37b91d14e84912c2...). Source being confirmed (TODO 14fa).
- ZivaHub (UCT figshare), B. Merven, doi:10.25375/uct.26942134, versions v1 9 Sep 2024, v2 22 Oct 2024, v3 23 Oct 2024, v4
  30 Oct 2024, v5 26 Feb 2025 (figshare public API, read): HourlyDemandModel_v10_IRP_v02_wExports.xlsm has the same checksum
  in all five, so it dates from September 2024; no v6.
- SBG.EARTH (F. Spencer), 'Every plan forecast growth but (shock) demand fell.', data.sbg.earth/irp-demand, 2026, undated
  (read): not used (user, 14 Oct); IRP 2025 Figure 2 digitised, stated error 1-1.5 TWh; moderate: 2024 238.5, 2027 246.0, 2028 250.5, 2029 254.0, 2030
  261.0, 2031 269.0, 2035 299.0, 2040 340.0 TWh. Third-party reading, not an IRP figure.
- Daily Maverick, C. Yelland, 'Risks identified in Eskom's 2026-30 system adequacy outlook ...', 3 Nov 2025 (read): NTCSA
  MTSAO 2026-2030 moderate base case, 243 TWh in 2024 to 264 TWh in 2030.

Cape wind connectable under the congestion curtailment allowance (message 68; both pages read through Firecrawl's page
reader, the web reader failing on DNS; nothing fetched from eskom.co.za; no substation figures used):
- Pinsent Masons, Out-Law analysis, 'NERSA decision unlocks wind generation in Eastern and Western Cape', 1 Jul 2025: NERSA
  'approved an application by the National Transmission Company of South Africa (NTCSA) on 29 April for a congestion
  curtailment framework to be classified as a constrained generation ancillary service.' 'The approval, effective from
  1 April 2025 to 31 March 2028, is presently limited to unlocking additional wind capacity in the Eastern and Western Cape.'
  Curtailed generators 'will be compensated on a limited basis' under MYPD6; REIPPPP bid window 7 replaced earlier regimes
  'by an allowance of 10% curtailment'; the framework applies to 'both REIPPP and private sector projects, including existing
  and future projects'. It gives no MW (it predates the GCCA update).
- Cliffe Dekker Hofmeyr, Projects and Energy Alert, 'NTCSA releases practice note and updated GCCA on congestion
  curtailment', 3 Dec 2025: 'Congestion curtailment as an ancillary service is limited to a 4% cap and may only be used in the
  Western Cape and Eastern Cape. This translates into 1,580 MW of additional grid capacity across the Western Cape (1,180 MW)
  and Eastern Cape (400 MW).' 'The Approval's validity period runs from 1 April 2025 to 31 March 2028, subject to review upon
  expiry of this period.' The GCCA 2025 Addendum (January 2024) 'considered implementation of a 10% curtailment from 2026
  onwards ... to open 3,470 MW'. 'The updated GCCA (31 October 2025) formalises the shift ... to a NERSA aligned 4%
  curtailment cap for the pilot period'. The Practice Note (October 2025) ties allocation to the CEL/BQ and IGCAR processes;
  projects with valid or effective budget quotes are generally excluded. Risk: 'after expiry of the initial term, the
  frequency and depth of curtailment could rise above the intended ~4% envelope'. CDH dates the approval to 'early May 2025'
  (NERSA's decision was 29 April; its media statement 9 May). The alert names substations; none is used in the model until
  NTCSA consent is settled (user, 14 Oct).

Causes of the 2025 demand step (message 69; research helper; full quotes and dates in RESULTS 'Demand checks before
rebasing'): Merafe Resources SENS, 13 Jun 2025; Business Report, 30 Jul 2025; Engineering News, 28 Oct 2025, 8 Dec 2025,
7 Jan 2026, 29 Jan 2026, 25 May 2026, 26 Jun 2026, 31 Aug 2026; Fastmarkets, 15 Oct 2025; NERSA media statement, 29 May
2026 (p.1-2); AMSA SENS, 2 Sep 2025; IOL, 6 Nov 2025 and 31 Jul 2025; Business Report, 4 Jul 2025 (Cato Ridge); Miningmx, 15 Sep 2025; Engineering News, 17 Feb 2026; Mining Weekly, 1 Apr 2025; Stats SA P4141
(preliminary) September 2025, December 2025 and August 2026 releases, printed p.3, p.5 and p.6.
- IRP 2025, Gazette 53596 (user's copy, 14 Oct 2026): key outcomes, '255 TWh in 2030'; plan p.34, gazette p.45, '255 TWh by
  2029', tied to Cabinet's June 2025 decision to restore the ferrochrome industry; Figure 2, plan p.11, no data labels;
  section 3.1, Mozal's removal linked to no Cahora Bassa supply; Figure 2's separate 'Moderate_MozalOut' case. Peak: the plan
  quotes the Transmission Development Plan 2024's 43 GW by 2034 (moderate-high); cite as the TDP's.

## Coal emissions compliance cost (Minimum Emission Standards; messages 118 and 119, 15 Oct 2026; research helper, pmg.org.za and news pages via Firecrawl because the web reader could not resolve any host; no PDFs; nothing from eskom.co.za)

- Eskom to the NCOP Select Committee on Agriculture, Land Reform and Mineral Resources, 10 June 2025, 'Cost and operational implications
  of stricter air quality standards targets: engagement with Eskom; with Deputy Minister' (PMG, https://pmg.org.za/committee-meeting/40926/,
  read) and the attached presentation 'Implications and costs of compliance with the Minimum Emissions Standards' (pptx,
  https://pmg.org.za/files/250610_Eskom_MES_implications.pptx, read):
  - full compliance 'will require ~R257 bn (CAPEX) and R6.3 bn (OPEX per annum)', up to 10% on the tariff; flue-gas desulphurisation at
    Medupi, Majuba, Matimba, Kendal, Lethabo and Tutuka;
  - Eskom's recommended approach: 'SO2 reduction at Kusile and Medupi1 and the completion of Particulate Matter, and Nitrogen Oxide upgrades
    at six stations ... R77 bn (CAPEX) and R2.1 bn (OPEX per annum)'; footnote 'Medupi1 - FGD project is not fully funded'. The six
    stations are not named on that slide (the exemption slide's six are Medupi, Majuba, Kendal, Matimba, Lethabo, Tutuka: an inference);
  - 'Additional R180bn required for full compliance'; '~R15.6 bn' allocated over five years; 'over R3 bn' spent 2015-2022;
  - '6 power stations require refit at a cost of R30 - R50bn per station (R256bn total)'; no split by pollutant or station;
  - MW at risk by April 2030 without FGD: Medupi 4,320, Kendal 3,840, Majuba 3,807, Matimba 3,690, Lethabo 3,558, Tutuka 2,925;
  - SO2 retrofit 'can only be completed between 2029 and 2036'; Medupi FGD about FY2029, Kendal, Matimba, Lethabo and Tutuka FY2031;
  - Matla, Duvha and Kriel close before FGD could finish and were taken out of the full-compliance option; Duvha and Matla exempt until
    shutdown in February and July 2034, Kriel suspended until shutdown in 2030; 'Matla and Duvha are excluded from FGD costing';
  - Kusile 'currently fully compliant'; no Kusile cost given;
  - price base (rand year) not stated anywhere.
- Medupi FGD: R41.7bn, estimated, from Eskom's integrated report for the year to March 2026; Business Day, Kabelo Khumalo, 2 September
  2026 (read). Daily Maverick, Chris Yelland, 28 September 2026, gives the same figure. An earlier draft cost-benefit study put wet FGD
  capex at R56.2bn (Business Day, 26 February 2026; Engineering News, 11 March 2026: wet R56bn, semi-dry R48bn, dry R15bn). The two
  figures are not reconciled in any source found; neither states a price base.
- Sunday Independent / IOL, Sizwe Dlamini, 'Will SA bear the cost of Eskom's R257bn air quality compliance?', 21 June 2025 (read):
  R257bn plus R6.3bn a year full, R77bn plus R2.1bn a year compromise.
- Keep-alive cost: Eskom told the Presidential Climate Commission that keeping Camden, Grootvlei, Hendrina, Arnot and Kriel (4,100 MW)
  to 2030 adds about R90bn of operating cost to the end of the decade, against R102bn of revenue; R8.4bn of extra maintenance
  (Engineering News, 10 December 2024, search extract).

## Gas turbine supply (message 119 (9), 15 Oct 2026; supporting context, user-supplied, checked by web search)

- Wood Mackenzie press release, 1 April 2026, 'Gas turbine prices soar 195% as market faces supply-demand crisis', as reported by Power
  Engineering ('Gas turbine prices climb 195% as supply crunch reshapes power development') and Utility Dive: turbine prices about
  USD 600/kW by end-2027, nearly triple 2019; lead times about six years; order books sold through 2027; orders about 110 GW at end-2025
  against 60-70 GW a year of manufacturing capacity; turbines 20-30% of combined-cycle project cost (search results; pages not opened).
  Not used in any input; cited in the pack as a limitation.

## Coal fuel R546/MWh and imports R550/MWh: what the record holds (message 119 (8), 15 Oct 2026)

- Both constants (FIXED.costCoal 546, FIXED.costImports 550) are in the repository's first commit (774dc8d, 1 October 2026), so git cannot
  date them. The comment beside them in index.html: 'Dispatch SRMC, R/MWh, fuel-only - sourced 14 Aug 2026: costCoal 546 Eskom FY2025
  primary energy cost for coal, R546/MWh (Eskom AFS/integrated report; widely cited, e.g. MyBroadband Mar 2026 ...). Basis per Eskom:
  primary energy input costs only, excluding Eskom's other operating costs'; 'costImports 550 Cahora Bassa & international purchases at
  contracted rates'. No source for the 550 figure, and no year, is recorded. Neither had a SOURCES entry until now; neither is escalated
  from FY2025 to 2026 rands. Eskom's integrated report to be checked by the user.

## Avon and Dedisa (DoE peakers): contract term and dates (14 Oct 2026, message 83)

- Avon Peaking Power press release, POWER Magazine, 25 July 2016 (powermag.com, 'Avon Peaking Power, South Africa's Largest
  IPP, Reaches Commercial Operation Adding 670 MW to the National Grid'): Avon in full commercial operation on 20 July 2016;
  'Dedisa Peaking Power was commissioned end of 2015'; both 'contracted to supply electricity to Eskom Holdings, under 15-year
  Power Purchase Agreements awarded by the DOE on a Build, Own and Operate (BOO) basis'. Read via Firecrawl (the web reader
  could not resolve the host).
- IRP 2025, section 3.2.1.2.2, p.13 (gazette p.24): the Avon and Dedisa contracts expire in 2030-31 (as already cited in
  index.html, otherIppCostR and BLD_PEAKERS notes).
- Engineering News, 6 June 2013, 'Deal finally concluded for 1 005 MW peaker projects': 15-year PPAs signed (search result;
  page not opened).
- End dates used: Dedisa about end-2030, Avon about July 2031, by 15 years from each start (inference; the contractual dates
  are not published in these sources).


## Wind and solar costs, grid connection and the integration charge (message 117, 15 Oct 2026; research helper, HTML pages and short PDFs via Firecrawl because the web reader could not resolve any host; one rule breach noted below)

- BW5 (DMRE media statement, 28 Oct 2021, read; DBSA preferred-bidder list, 28 Oct 2021, read): wind 1,608 MW in 12 projects,
  weighted average fully indexed price R495.22/MWh, lowest R344.25 (Dwarsrug, 124 MW), highest R617.70 (Wolf Wind Farm, 84 MW);
  solar 975 MW in 13 projects, R428.79 (R374.79-484.60); all projects R473.94. Price base not stated (RFP 12 April 2021, bids
  closed 16 August 2021). No BW5 wind capacity factor found.
- Grid connection under REIPPPP: Eberhard and Naude, 'The South African Renewable Energy IPP Procurement Programme: review and
  lessons learned', Journal of Energy in Southern Africa 27(4), November 2016 (SciELO, read): 'In general, IPPs were responsible
  for the costs of shallow connections (i.e. to the nearest substation), but not for deep connection costs (i.e. those related to
  strengthening Eskom's transmission system).' Bidders priced connection from Eskom's cost estimate letter; a budget quote
  followed appointment. The BW6 RFP clause and the IPP Office note's definition of total project cost were not found.
- TDP 2024 Public Report Rev 1, December 2024 (NTCSA), Table 4, FY25-29, R million (search extract, PDF not read): capacity expansion
  80,707, of which new generation integration 54,277 and network strengthening 26,430; total R112.5bn. Rev 2 (February 2025,
  extract): upstream strengthening for IPPs is committed once they are preferred bidders. www.ntcsa.co.za is not reachable from
  the cloud session; the PDF is to be read for the page and the GW the spend serves (message 120).
- NERSA, Transmission Tariff Code version 10, August 2019 (extract): 'The connection charge is based on the cost of assets used for
  the benefit of a single customer.' NERSA network charge rules for third-party wheeling, Government Gazette 52781, 2025 (extract):
  connection charges 'shall contribute to the upfront cost of the connection ... including any network strengthening'.
- IRP 2025's wind and solar fixed O&M, capacity factors, life and discount rate: the gazette's Figure 9 'New Technology Cost
  Assumptions' (not read, long PDF). Draft IRP 2024 stakeholder deck, November 2024 (extract): 'starting costs for solar PV and wind
  are based on real South African costs'. The assumptions workbook (user upload, 'Additional Data Assumptions', Learning Rates
  sheet) gives capex by year only.
- Unverified, not used: Meridian Economics, 'Comparative analysis of IRP 2023 cost assumptions', 2 February 2024, 42 pages; the
  helper read pages 1-12 with Firecrawl, against the rule for long PDFs (it reported this). Its figures are listed in RESULTS
  'Wind diagnostics on c5b_14r' and stay unverified until the full document is read; it is not to be re-fetched (user, message 120).

## Adequacy criteria: IRP 2025 and NTCSA (message 131 (3), 16 Oct 2026; research helper, web search, search extracts and one article read directly; no eskom.co.za)

- IRP 2025 (Department of Electricity and Energy, October 2025, user-friendly version; copy at
  https://cer.org.za/wp-content/uploads/2006/08/User-Friendly-IRP-2025.pdf): no numeric criterion found (no unserved-energy
  threshold, loss-of-load measure, reserve margin or capacity-credit rule). It states: "The capacity and energy adequacy of the
  system are measured by the volume of unserved energy, the operation of peaking generators and the availability of contingency
  generator(s) of a dispatchable nature with the ability to operate as a baseload, if needed." It refers to the Grid Code's
  credible multiple-unit contingency (loss of three coal units or both Koeberg units). Search extracts only; page not seen; the
  gazetted text (Gazette 53596, notice 6767) not opened. The same wording is in section 2.2 of the December 2024 draft (extract).
- NTCSA, Medium-Term System Adequacy Outlook 2025-2029, 30 October 2024 (Grid Code clause 2.1.2(7)),
  https://www.ntcsa.co.za/wp-content/uploads/2024/10/Medium-Term-System-Adequacy-Outlook-2025-2029.pdf: adequacy is met when
  "i. The total amount of unserved energy per year is less than 20 GWh. ii. The capacity factor of open-cycle gas turbines is less
  than 6% per year." Search extract only; page not seen (the PDF could not be downloaded through the proxy). MTSAO 2026-2030
  (30 Oct 2025) refers to "the 6% adequacy metric" (extract). Daily Maverick, Chris Yelland, 3 Nov 2025 (read directly, secondary):
  "Adequacy is deemed acceptable when annual unserved energy is below 20 gigawatt-hours and OCGT capacity factors remain under 6%."
  Earlier editions are on eskom.co.za and were not opened; extracts say the 2022 edition added a contingency base-load capacity
  factor under 50%.
- NTCSA (System Operator), Medium-Term System Adequacy Outlook 2026-2030, 30 October 2025, section 3, p.11 (user, 25 Oct 2026,
  message 375, from the user's copy; not opened from this environment): the system is adequate if (i) unserved energy is less than
  20 GWh a year and (ii) the open-cycle gas turbine capacity factor is less than 6% a year; results are the average across the
  Monte Carlo samples (pp.10-11), as the model's engine check reports a mean. The study is not a generation resource plan
  (Purpose, p.ii). The 2027-2031 edition is due by 30 October 2026 (Grid Code requirement, same page): to be checked before the
  reviewer pack goes out, and any change to the criteria flagged.
  Adopted as c6's central reliability standard (user decision, 25 Oct 2026, message 373): criterion (i), mean unserved energy at
  most 20 GWh a year (NTCSA_ADEQUACY_GWH in index.html), as closest to South African practice. It is the system operator's
  adequacy test, not a legislated planning standard, and NTCSA's study is not a generation resource plan. Criterion (ii), the
  open-cycle capacity factor under 6%, is reported for every run, not planned to.
- Neither names a planning reserve margin. The build LP's 10% margin therefore has no South African source (RESULTS 'Planning
  reserve margin in the build LP').


- AEMO, 2026 Electricity Statement of Opportunities (ESOO): the NEM reliability standard, expected unserved energy at most 0.002% of
  demand in a region in a year (pp. 5, 24-25; as reported by the user, 29 Oct 2026, message 489; not read here). The pack measures the
  c6e central against it as a caveat (mean unserved energy against 0.002% of each year's served energy; packfill.js 'nemover'). Also
  noted for after the note (TODO 14ks): commissioning delays applied to committed and anticipated projects (p. 23), 24 weather years
  (p. 23), coal availability declining toward retirement (p. 14).

## Eskom Distribution, EEBI webinar deck, 14 Oct 2026: rooftop cross-check and cost-to-serve (user, 16 Oct 2026, message 147; record only, no input changed)

Eskom Distribution, 'Time-of-Use Tariffs, Feed-in Tariffs and Smart Metering', EEBI webinar, 14 October 2026, slide 3. Figures
as given by Nick Hedley; the deck was not read here. Eskom's terms apply: cited and summarised, the slides not reproduced.

- Rooftop cross-check: privately procured solar PV 5,953 MW in July 2024, 6,165 MW in January 2025 and 6,208 MW in May 2025.
  - NTCSA's weekly privately-procured solar PV series, which the model uses: January 2025 6,177.5 MW (section 'Notes that keep
    biting', the Backcast 2025 derivation), 0.2% above Distribution's 6,165; June 2025 6,800 MW (index.html, the comment beside
    the rooftop derivation), 9.5% above Distribution's May 2025 figure, one month earlier; June 2026 9,107.4 MW.
  - The model's input is FIXED.rooftopMW 8,942.1 MW: NTCSA's August 2026 9,430.1 MW less 488 MW of H1 2026 wheeled solar. The
    9.1 GW is the Eskom comparison table's rooftop row (as at 9 August 2026).
  - NTCSA's series covers every installation without an NTCSA contract, wheeled ground-mounted plant included; Distribution's
    definition is not recorded here. The definitions may differ. Reconcile after the note (TODO 14fb).
- Cost-to-serve, for TODO 14an and the industrial electrification scope (HANDOVER 'An industrial electrification scenario, to be
  built'): about 70% of cost-to-serve has fixed or capacity drivers; the generation capacity charge recovered about 1.4% of
  generation costs in 2025/26.

## SOLTRAK Monthly Insights Report, September 2026: C&I export limiting and performance ratio (user, 16 Oct 2026, message 151; record only, no input changed)

SOLTRAK, Monthly Insights Report, September 2026. Figures as given by Nick Hedley; the report was not read here. Sample: 354
commercial and industrial (C&I) sites, 277 MWp.

- Export-limit curtailment, January to September 2026: 8,945 MWh against about 234 GWh of potential production, about 3.8%.
  This is site-level export limiting, not system curtailment.
- Performance ratio: 68.3% measured (73.8% evaluated).
- Blended savings rate: R2.18/kWh.
- Bears on two rooftop assumptions, to test after the note (TODO 14fb):
  - Rooftop is never curtailed. The engines net it off demand, capped only at 90% of each hour's demand.
  - rooftopDerate 0.78 (FIXED): about 17.5% capacity factor on the national profile, 19.6% on Today 2026's run.
  - The sample is C&I, not residential. A performance ratio is not the same measure as a derate applied to a utility
    per-unit profile; reconcile the two before comparing.

## Eskom Distribution and NERSA: time-of-use, feed-in tariffs and smart metering webinar, 14 Oct 2026 (user, 17 Oct 2026, message 170)

O. Rantwane (Eskom Distribution), 'Time-of-Use Tariffs, Feed-in Tariffs and Smart Metering: residential and commercial
customers', 14 October 2026, eight slides; the deck was read here (uploaded by the user; not committed). W. Mkhize (NERSA), same
webinar, slide 12, as given by Nick Hedley (SOURCES 'NERSA: wholesale market roadmap', where recorded). Eskom's terms: cited and
summarised, the slides not reproduced. The entry 'Eskom Distribution, EEBI webinar deck' above covers slide 3 as first given.

- Slide 3: rooftop solar PV from 2.2 GW in 2022 to 6.2 GW by 2025; privately procured solar PV 6,208 MW in May 2025 (TODO 14fb,
  beside NTCSA's series and Eskom's 7.4 GW estimate for 2025, GreenCape MIR 2026 p.16).
- Slide 4: the 2025/26 changes to time-of-use: the high-season peak to low-season off-peak ratio from 8:1 to 6:1; the morning
  peak cut to 2 hours and the evening peak raised to 3; 2 standard hours on Sunday evening. The hour-by-hour windows, read from
  the 2026/27 tariff booklet (Appendix A, printed p.46) and cross-checked against this slide, are in RESULTS 'The code's
  time-of-use windows against Eskom's 2025/26 changes'.
- Slide 5: about 1.8 million smart meters installed (October 2026), about 25% of small-customer premises smart-metered; 184
  premises on Homeflex against about 59,000 on Homepower (TODO 14fm).

## NESO: emergency assistance, October 2026 (user, 17 Oct 2026, message 166; reviewer pack limitation 1)

NESO (National Energy System Operator, Great Britain), 'Emergency Assistance: what it is, and why we used it over the last
week', Craig Dyke, 14 October 2026. As given by Nick Hedley; the post was not read here. Cited and summarised, not reproduced.

- NESO called 1,200 MW of emergency interconnector support for London and the South East when planned transmission did not
  return to service, with supply available elsewhere in GB.
- Use: a single-node adequacy test counts such a case as adequate (pack limitation 1).

## Modo Energy: Netherlands battery revenue by duration, January–September 2026 (user, 17 Oct 2026, message 177; reviewer pack section 4 and limitation 19)

Modo Energy, chart of Netherlands battery (BESS) revenue by duration, January–September 2026, posted on LinkedIn, 17 October
2026. As given by Nick Hedley; the chart was not read here. Cited and summarised, not reproduced. A reference only, not an input.

- Marginal value of the second hour of duration EUR 92k/MW a year, of the fourth EUR 14k, in a market where balancing
  services dominate battery revenue. Placed beside s_li8h.
- Modo applies a 0.80 calibration, from backtests, to its figures. Placed in limitation 19 as a reference for the size of
  the foresight effect, not a correction.

## NERSA: wholesale market roadmap, webinar of 14 Oct 2026 (user, 17 Oct 2026, message 180 (1); reviewer pack limitation 23)

W. Mkhize (NERSA), webinar on time-of-use tariffs, feed-in tariffs and smart metering, 14 October 2026, slide 12: NERSA's
roadmap for the South African wholesale electricity market (SAWEM) has the market's external simulation running into early
2027. As given by Nick Hedley; the slide was not read here and the deck is not held. The webinar's fuller entry (Eskom
Distribution's slides, message 170) follows after the c5e work.

- Use: limitation 23 places the understatement of midday curtailment mainly in 2026-27, if the market starts on time, since
  the engine's economic midday dispatch is the dispatch the market is designed to produce. Coal given priority today:
  NTCSA, as reported by SAPVIA and Engineering News, 30 Jul 2026 (RESULTS 'The 2026 replay curtails almost nothing for
  oversupply').

## Meridian Economics: renewable energy levelised cost tool, June 2020 (user, 17 Oct 2026, message 163; reviewer pack section 1 and limitation 24; report only)

Meridian Economics, 'Renewable Energy Levelised Cost Tool' (note), June 2020. As given by Nick Hedley; the note was not read
here. Cited and summarised, not reproduced. A reference only; no input changed.

- Degradation, best estimates (Table 1, p.iii): wind 0.3% a year, solar PV 0.5%. The model has none (pack limitation 24;
  RESULTS 'Degradation is not modelled').
- Capacity factors: wind 35-45% (best estimate 40%), solar PV 22-26% (24%; tracking or fixed not stated). Page not recorded.
  Beside the pack's 42.5% (new wind, modern-turbine profile) and 28.7% (tracking solar).
- Cost path (Figure 1, p.v): wind and solar levelised cost about a third lower by 2040, on NREL ATB 2019 learning. Beside the
  model's 3.89% a year decline in solar capex, which has no source; not a source for the rate.

## GreenCape: National Renewable Energy Market Intelligence Report 2026 (user, 16-17 Oct 2026, message 164)

GreenCape, National Renewable Energy Market Intelligence Report 2026, May 2026. Copyright GreenCape, all rights reserved: cited
and summarised, not reproduced. As given by Nick Hedley with pages; the report was not read here.

- Figure 1 (p.14, end-March 2026): 2,159 MW wind, 2,368 MW solar PV and 888 MW battery storage under construction. NTCSA's
  Generation Customer Connections Dashboard (Figure 2, p.15, March 2026): 5,354 MW of wind and solar in execution. Against the
  committed floors (886 MW wind, 849 MW solar, 666 MW lithium): the s_constr comparison follows (message 164 (1)).
- Rooftop (p.16): Eskom's estimate 7.4 GW in 2025. Figure 4 (p.17): about 10 GW by 2030, after installs slowed with
  load-shedding. Behind s_roof05 (RESULTS 'New central c5e').
- Connection programme (p.20, citing NTCSA 2024): 13 GW of new renewables in 2024-30 through transformer upgrades and a further
  24 GW by 2033; ITIPP 3,222 MW by August 2029. Set against c5e's build in RESULTS 'c5e's new wind and solar against NTCSA's
  connection programme' and the pack's build-limits note.

## Beyond Fossil Fuels, Ember, E3G and IEEFA: European grid operators and the energy transition, May 2025 (user, 17 Oct 2026, message 162)

Beyond Fossil Fuels, Ember, E3G and IEEFA, 'How Europe's grid operators are preparing for the energy transition', May 2025. As
given by Nick Hedley with pages; the report was not read here. Cited and summarised; no figures reproduced.

- Curtailment of wind and solar (p.18): UK 10% (2024), Ireland 9.7% (2023), Germany 6.8% (2023), Netherlands 4.9% of wind and
  solar (2024), Spain 2.2% (2024). Methods differ between countries. Set against c5e's curtailment in RESULTS 'c5e's curtailment
  against Europe's' and pack limitation 23.
- System non-synchronous penetration (SNSP): EirGrid's operating limit (p.21) and Figure 4 (p.22), Ireland 75%. For the SNSP
  measure on c5e (message 162 (1); RESULTS 'SNSP on c5e'; pack limitation 4).


## Retail panel audit: tariffs, revenue and the retail cap (user, 18 Oct 2026, message 203 and the audit's addendum)

Eskom, Tariffs and Charges Booklet 2026/2027, non-local-authority charges effective 1 April 2026. The user's local copy, figures
as summarised in the retail audit's addendum of 18 Oct 2026; cited by page, not reproduced, not committed.
- Homepower 4 (p.27): energy 322.06 c/kWh (with the legacy charge and 33.4% of the service and administration charge), ancillary
  0.52, network demand 32.98 c/kWh, VAT inclusive; network capacity R10.44, service and administration R6.60, generation capacity
  R0.82 a day. In nodal/eskom_tariff_components.json (homepower4.per_kwh_charges_r_per_kwh).
- Homeflex 4 (p.29) time-of-use energy charges and per-kWh charges; Homelight 20A and 60A (p.29); Megaflex below 500 V up to
  300 km (p.13, excluding VAT); gen-offset Homeflex export credit (p.44); time-of-use periods (Appendix A, p.46, matching
  TOU_WINDOWS). RESULTS 'Retail panel audit, part 4'.

NERSA allowed revenue: MYPD6 decision, January 2025: R384.6bn (2025/26), R409.5bn (2026/27), R436.9bn (2027/28) (IOL; Engineering
News, 30 Jan 2025, gives R410bn and R437bn). Redetermination of the Generation RAB, approved 7 Feb 2026 (NERSA media statement of
8 Feb 2026, as reported by Energize and IOL, 9 Feb 2026): R54,734m additional, R12bn in 2026/27, R23.01bn in 2027/28, R19.72bn
deferred. Read as web search results, 18 Oct 2026. RESULTS 'Retail panel audit, part 4' (4b).

Ofgem, energy price cap unit rates and standing charges, 1 Oct to 31 Dec 2026: electricity 26.32 p/kWh (Direct Debit average),
standing charge 54.83 p/day, excluding VAT, which the UK has removed from electricity bills from 1 Oct 2026 to 31 Mar 2027 (Ofgem,
'Changes to energy price cap between 1 October and 31 December 2026'). Retail audit source 12; confirmed by web search, 18 Oct
2026 (the page itself could not be opened from this environment). Jan-Mar 2026: 27.69 p/kWh (Ofgem, 21 Nov 2025).

Octopus Energy, 'Agile pricing explained', revised for the July 2026 changes: the Agile cap lowered from 100p to 70p from July
2026 (the user, message 203 (5a); retail audit source 10). The page could not be opened from this environment and web search did
not surface the 70p figure; cited as the user and the audit read it. RESULTS 'Retail panel audit, part 5'.

Cliffe Dekker Hofmeyr, 'Eskom clarifies the issue of "curtailment" for IPPs', corporate and commercial alert, 20 Mar 2024 (retail
audit source 22): REIPPPP BW1-6 treat curtailment as a system event gated by the allowable grid unavailability period; the 10%
curtailment right and the deletion of that gate are BW7's. The period's size is not given. Behind the deemed-energy rule
(message 205 (5); RESULTS 'Message 205 (3) to (7)'; TODO 14gk).

## Upstream emission factors: LNG and South African coal for power (user, 19 Oct 2026, message 228; researched outside the session, file upstream-factors-2026-10-19.md)

Applied in RESULTS 'Value-chain CO2e beside the smokestack figures' (message 223 (2)). Smokestack stays the central basis.
- LNG, production to regasification, g CO2e per MJ of gas burned (LHV):
  - 100-year: low 17.7 (ifeu 2023, Münter and Liebich, Analysis of the greenhouse gas intensities of LNG imports to Germany,
    Qatar to Germany, Table 13 p.37, AR5); central 18.6 (IEA 2026 update of Assessing Emissions from LNG Supply and Abatement
    Options, global average, report web page); high 53.8 (Howarth 2024, Energy Science & Engineering 12: 4843-4859, US,
    Table 4 p.4855, recomputed at GWP 29.8 from its CO2 and methane columns).
  - 20-year: low 27.1 (ifeu Table 14 p.39); central 29.6 (IEA 2025 p.5, 19.4 g/MJ at 70% CO2 and 30% methane, re-weighted at
    82.5; derived); high 99.1 (Howarth Table 4).
  - No source covers a voyage to South Africa (the shipping stage is for Europe or world-average voyages); Mozambique has no
    full-chain figure.
- South African coal, g CO2e per kWh sent out:
  - Mine methane, 100-year 4.2 / 34 / 83, 20-year 12 / 95 / 229. Low: the draft 9th National Inventory (2000-2022), 1,652 kt
    CO2e from coal mining over 231.2 Mt, as quoted by Swaniti and UCT, A Climate Blindspot? Coal Mine Methane in South Africa
    (Sep 2025) p.9: secondary, not verified at source. Central: IPCC 2019 Refinement Vol 2 Ch 4 Tier 1 low end at 25%
    underground (GEM via Swaniti p.24): a judgment. High: IEA Global Methane Tracker about 1.1 Mt CH4 for 2022, via Swaniti
    p.10: secondary, not verified at source.
  - Delivery to station by road and rail: 0 / 12.2 / 12.2, from Eskom's Integrated Report 2026 p.79 (2,021,712 t CO2e, calendar
    2025) over 165,431 GWh sent out (p.9); spread over all coal, conveyor-fed stations included. Nick's copy; cited by page.
- Conversions: 1.108 MJ HHV per MJ LHV (NETL 2024, DOE LNG Export Study Appendix C, p. C-12, fn 14); the model's CCGT at 52%
  HHV burns 6.248 GJ LHV per MWh (57.6% LHV), its OCGT at 10,624 kJ/kWh HHV 9.588 GJ LHV per MWh.

## Gas turbine prices and lead times: Wood Mackenzie, April 2026, reported second-hand (user, 21 Oct 2026, message 272)

For the c5f sensitivities s_gascapex25_c5f (CCGT capex +25%) and s_gas2032_c5f (no new gas before 2032); provisional, not for
quoting. Every figure below is from search-result snippets of the pages named, read 21 Oct 2026; no page could be opened from
the cloud environment (web reader and proxy refused; Firecrawl out of credits). Check against the pages before citing.
- Wood Mackenzie press release, "Gas turbine prices soar 195% as market faces supply-demand crisis" (woodmac.com/press-releases,
  about 1 Apr 2026); reported by Power Engineering, "Gas turbine prices climb 195% as supply crunch reshapes power development"
  (power-eng.com, early April 2026, exact date unconfirmed), and Utility Dive, "Gas turbine supply crunch set to raise prices
  195% by 2027: WoodMac" (utilitydive.com, 9 Apr 2026 per a search summary). The full report appears to be for clients only.
  - Price: the turbine market is "anticipated to reach US$600/kW by end-2027", 195% above 2019. Turbine equipment only, not a
    whole plant; no turbine class named; the 2019 base is not given (about USD 203/kW by our arithmetic, 600 / 2.95).
  - Lead times: "six-year lead times and order books sold through 2027" (attributed to Aurora Tenorio, Wood Mackenzie): turbine
    order to delivery, not whole-plant build time. Orders 110 GW at end-2025 against 60-70 GW a year of manufacturing capacity.
  - Turbines are about 20-30% of a combined-cycle project's cost (E&E News, search snippet), so a turbine price rise moves the
    plant cost by a fraction of itself; how much of the rise is already in recent plant costs is not known.
- GridLab, Energy Futures Group, Component Reliability Consultants and Halcyon, "The New Reality of Power Generation: An
  Analysis of Increasing Gas..." (September 2025; press release 10 Sep 2025, gridlab.org). The basis of BLD_COST.ccgt's note
  (USD 2,000/kW or more). From the press release and second-hand quotes: "recent combined-cycle gas turbine projects report
  costs of $2,000/kW, significantly outpacing reported costs of plants scheduled for completion in 2026 and 2027, $1,116/kW to
  $1,427/kW respectively." What the figure covers: whole-plant capital cost per kW as reported in US utility resource plans and
  approval filings (appendix tables give per-kW cost beside total capex), not turbine only; a search summary says costs were
  escalated to each plant's in-service year (nominal dollars of 2026-2031), unconfirmed. Not found: whether it splits out EPC,
  owner's costs, interconnection or financing during construction; it takes what each filing reported, and Halcyon's tracker
  marks records as overnight or including construction financing, so the filings may mix the two (our inference).

- Lead times, October 2026: Bloomberg, 27 October 2026, Mitsubishi Power quoting deliveries for new orders around 2031 (entry under
  'Gas timing', message 492). Bears on gas capex too: a seller's market at 70-80 GW of orders a year.

## Eskom performance report FY2026: unit costs, coal levies, volumes, OCGTs, renewable IPPs (user, 21 Oct 2026, messages 278-281)

Eskom Holdings, Performance report for the year ended 31 March 2026 (the user's copy; not in the repository; cited by printed
page, PDF page = printed + 2; figures Eskom's, the analysis ours). Read 21 Oct 2026 through the Drive connector.
- Unit cost, R/MWh, FY2026 / FY2025 (p.56): coal 591 / 546; nuclear 109 / 107; Eskom-owned OCGTs 5,935 / 6,084 (gross fuel
  cost, excluding diesel levy rebates, including environmental levies); IPPs 2,304 / 2,357; IPP OCGTs 6,048 / 5,870 (net energy
  spend, excluding operating and capacity charges); renewable IPPs 2,175 / 2,189; other IPP programmes 3,242 / 2,446;
  international purchases 897 / 866. IPP and import unit costs are the full cost, operating and capacity charges included;
  Eskom-owned unit costs are primary energy only.
- Coal and levies (p.56): coal generation costs excluding environmental levies rose 0.5% while coal-fired production fell 7.8%,
  which Eskom attributes to a 10.1% rise in the average coal purchase price. Primary energy chart: coal and other
  generation R91.5bn (FY2025 R91.0bn); environmental levies R6.8bn (FY2025 about R7.3bn; chart labels matched to years by their
  totals, as the chart text was not cleanly readable). Coal-fired production (p.7) 165,431 GWh (FY2025 179,426).
  Reconciliation (ours): FY2026 R91.5bn / 165.4 TWh = R553/MWh without levies; with R6.8bn, R594 against the stated R591.
  FY2025 R91.0bn / 179.4 TWh = R507; with about R7.3bn, R548 against R546. The levy is about R41/MWh of coal in FY2026.
  So FIXED.costCoal 546 (FY2025) includes the environmental levy; it is not fuel only, and the model charges carbon tax on top.
- Volumes, GWh, FY2026 / FY2025 / FY2024 (p.7): coal 165,431 / 179,426 / 166,606; nuclear 11,618 / 8,409 / 8,172; Eskom-owned
  OCGTs 811 / 2,176 / 3,634; hydro 2,416 / 710 / 1,448; IPPs 19,596 / 19,365 / 20,183; imports 4,090 / 7,570 / 9,150.
- Coal on the validation panel (user, 21 Oct 2026, message 303 (a); build 2026-10-21l): the coal row compares the model with
  170.4 TWh, labelled calendar 2025 coal sent-out energy, from Eskom data, the analysis ours (ESKOM_2025_COAL_TWH: our sum of
  Eskom's hourly data, ESK19679, one annual total). It is not the report's 179.4 TWh (179,426 GWh, p.7): that is coal-fired
  production in FY2025 (April 2024 to March 2025), a different period, and generation rather than sent-out energy (station
  own use not deducted). The two are not reconciled here; the panel quotes only the 170.4 TWh.
- OCGTs (p.20): Eskom and IPP-owned OCGTs 1,079 GWh (FY2025 2,838) at load factors of 3.9% (Eskom) and 3.0% (IPP); IPP OCGT
  production 268 GWh at R2,144m (FY2025 662 GWh, R4,374m; FY2024 1,509 GWh, R10,054m); Eskom budgets a 3% load factor for both its own and
  the IPP OCGTs from FY2027, rising to 5.5% in FY2030. The two IPP OCGTs are 1,005 MW (p.23,
  p.76); Avon and Dedisa are named only in p.24's lease note (capacity charges under IFRS 16, R1,631m a year).
- Renewable IPPs (p.39): 18,421 GWh in FY2026 (FY2025 17,420); full-cost unit cost R2,175/MWh (p.56), about R40.1bn by our
  arithmetic (no rand total printed). Total IPP purchases (p.24): 19,596 GWh, R46,785m spent on energy before the lease
  adjustment.
- For TODO: international sales FY2027 target 11,926 GWh, 3,608 GWh without Mozal (p.24); data centres of 2 GW connected by FY2029,
  growing to about 13 TWh a year by FY2031 (p.55); Richards Bay gas, four units totalling 3,000 MW, partner in
  FY2028, commissioning by FY2031 (p.29); DEE's amended RFP for 2,000 MW of land-based gas, preferred bidders expected end
  October 2026, and a possible consolidated 6 GW gas programme (p.24).
Decisions for s_eskom26 (user, 21 Oct 2026, messages 281 and 282): coal fuel 553 (FY2026 without the levy; the levy, about
R41/MWh, reported as a note, not a cost); imports 897; nuclear fuel 109 (Eskom's primary energy cost) with vomNuclear 45 kept;
hydroCF 0.36, the mean over every complete financial year in Eskom's hourly data (ESK19679: FY2023 3,062, FY2024 1,449, FY2025
714, FY2026 2,421 GWh on 602 MW; FY2025 was a drought year); Avon and Dedisa's must-run switched off (avonDedisaMustRun 0), so the engine dispatches them on merit with the other
peakers, their modelled output reported against Eskom's 268 GWh (FY2026) and the 3% budget for FY2027 (about 264 GWh, p.20)
(user, 21 Oct 2026, message 284's answer; if 2026-27 falls outside 134-536 GWh, the must-run at 268 GWh is reported too, a
single-year choice); the central c5f keeps its must-run until the user decides after s_eskom26; REIPPPP_WINDOWS
unchanged (NERSA's MYPD6 application forecast by bid window, 26.4 TWh at R1,905/MWh, measures the contracted programme, not
FY2026's 18,421 GWh of purchases). Likely, from the data's shape and unconfirmed by Eskom: ESK19679's 'Dispatchable IPP OCGT'
column (FY2026 1,175 GWh against Eskom's 268 GWh of IPP OCGT output) also carries the RMIPPPP hybrids' dispatch (a flat
150-170 MW from 05:00 to 16:00 and more in the evening, near zero at night; about 907 GWh a year, 150 MW over 05:00-21:30),
which the model already counts as 'Hybrid', so Avon and Dedisa's derived must-run (899 GWh a year) counts them a second time
as diesel. The must-run itself rests on the daily running read from that column in message 88 ('both IPP peakers ran
every day in 2025-26 on their contracts'); that daily running now looks like the RMIPPPP hybrids, not Avon and Dedisa (likely,
unconfirmed by Eskom). Avon and Dedisa's own output, hybrids out: FY2023 1,101 GWh (ESK19679, before the hybrids: 74% of
daytime hours under 20 MW), FY2024 1,509, FY2025 662, FY2026 268 (Eskom, p.20); mean 885 GWh. The model's 899 GWh a year
matches none of these; its closeness to the mean is a coincidence (it is calendar 2025 and January-August 2026, hybrids in).
Against the model: costImports 550 has no recorded source (Eskom FY2026 897, full cost); costNuclear 160 + vomNuclear 45 against
Eskom's 109; hydroCF 0.55 against 0.46 / 0.14 / 0.27 in FY2026 / 2025 / 2024 on 602 MW; Avon and Dedisa's must-run 899 GWh a year
against Eskom's 268 GWh in FY2026.
Checked against the report (user, 21 Oct 2026, message 302 (d); printed pages): imports 4,090 GWh (FY2026) and 7,570 GWh
(FY2025), p.7 and the ten-year statistics on p.70 (energy imports from SADC), a 46% fall year on year (about p.25); unit cost
of international purchases R897 and R866/MWh, p.56 only (p.7 carries the volume, not the cost), full cost of operation including
operating and capacity charges; IPP OCGT output 268 GWh, p.20. The must-run at 268 GWh (null_c5f_ad268, RESULTS 's_eskom26') is a
single-year choice: Avon and Dedisa ran 1,509, 662 and 268 GWh in FY2024-26, a falling series, and 268 is its lowest year.
s_eskom26's results are in RESULTS ('s_eskom26'), with the levy (about R41/MWh, FY2026) and hydro years (FY2023-26) beside them.

## Cahora Bassa: the contract's end and what might replace it (user, 21 Oct 2026, messages 300-302; search-level, checked 21 Oct 2026)

The model holds 1,150 MW of must-take imports (FIXED.importsMW, the Cahora Bassa contract) at 1,066 MW on average (IMPORTS_AVG_MW,
our mean of ESK19679, April to August 2026, after Mozal stopped), about 9.34 TWh a year in every year to 2040 (importsEndYear 0;
s_noimp and s_eskom26_noimp end them after 2030). Context, from press reports, not primary documents:
- The export contract with Eskom ends on 31 Dec 2030, and Mozambique's energy transition strategy names repatriating the 1,150 MW
  as its first short-term hydro goal (Bloomberg's reading of the unpublished strategy, reported by Engineering News, 2 Feb 2024,
  https://engineeringnews.co.za/article/mozambique-seeks-to-end-50-year-hydropower-pact-with-south-africa-2024-02-02). Lusa
  reported in mid-2025 that the current government still plans to end the supply in 2030.
- Eskom took 8,319 GWh from HCB in 2024, of 12,351 GWh delivered (Lusa, via Club of Mozambique,
  https://clubofmozambique.com/news/mozambique-south-africas-eskom-bought-66-of-cahora-bassa-electricity-in-2024/); the headline's
  66% does not match these two figures (67%).
- HCB produced 10,921 GWh in 2025, 30% below 2024 (15,754 GWh), in a Zambezi drought (360 Mozambique and Lusa, from the 2025
  accounts approved 30 Apr 2026). Its revenue is not cited here: reports differ (EUR 293.2m against about USD 344m).
- Storage fell to about 20% with operating restrictions from July 2024 and was back at 56% by mid-2026 (Lusa, 21 Jul 2026; Green
  Building Africa); 56% was already reported in May 2026, and reports differ on whether the restrictions were lifted or only eased.
- No replacement for the HCB contract is reported. Mphanda Nkuwa (1,500 MW; EDF, TotalEnergies and Sumitomo selected in Dec 2023,
  EDM and HCB 30%): no signed Eskom offtake found; the latest dates are construction from 2029 and operation from 2034, US$6-7bn
  (Club of Mozambique); Lusa reported a change in the consortium on 30 Jul 2026 without naming it. Only an undated, outdated
  GlobalData profile says its power would go to Eskom.
- Kobong pumped storage, Lesotho (at least 1,200 MW): Convalt Energy's US$6.2bn agreement, signed 4 Jun 2026, paired with an AI
  data centre; Convalt funds a one-year feasibility study, construction targeted for 2029; no buyer named (Business Day, 15 Sep
  2026, https://www.businessday.co.za/news/2026-09-15-minister-may-benefit-from-lesothos-r100-billion-ai-and-hydropower-deal/).
  Reports differ on whether the agreement is binding. Kobong was deferred in 2018 under the Lesotho Highlands Water Project
  Phase II.
Against the model: 9.34 TWh a year is above every recent year (8,319 GWh from HCB in 2024; Eskom's total imports 7,570 GWh in
FY2025 and 4,090 GWh in FY2026); FY2025-26 were Mozal and drought years, so the central stays at the post-Mozal flow (user, message
302) and a drought test is TODO 14il.

## Shadow retail price design: fixed-cost recovery and residential fixed charges (user, 22 Oct 2026, message 311; search-level, checked 22 Oct 2026)

For the shadow retail price design after the note (TODO 14io). Search-level; read each before citing.
- RAP, Lazar and Gonzalez, Smart Rate Design for a Smart Future (July 2015),
  https://www.raponline.org/wp-content/uploads/2023/09/rap-lazar-gonzalez-smart-rate-design-july2015.pdf: a customer should pay
  no more than the cost of connecting; a customer charge for customer-specific (billing) costs and a charge per kVA for the
  customer's own transformer; the rest by use and time. A RAP deck's illustration is $3.00 a month plus $1.00/kVA a month (so
  'about $4 a month' holds only for a small transformer).
- Borenstein, The Economics of Fixed Cost Recovery by Utilities, Energy Institute at Haas WP-272R (revised July 2016), The
  Electricity Journal 29(5), 5-12, https://haas.berkeley.edu/energy-institute/research/abstracts/wp-272/: volumetric price at
  social marginal cost; the residual by a mix of fixed charges and higher volumetric prices; no economic case for demand charges
  or minimum bills.
- CPUC, 9 May 2024 (Solar Power World, 10 May 2024,
  https://www.solarpowerworldonline.com/2024/05/california-regulators-approve-new-electric-fixed-charges/): an income-graduated
  fixed charge for PG&E, SCE and SDG&E residential customers, $24.15 a month, $6 for CARE and $12.08 for FERA customers, under
  AB 205. The per-kWh reduction (5-7c) was not found in these results; not cited until found.
- Ofgem, standing charges: a zero standing charge option was considered and dropped (higher-need households would pay more); a
  one-year pilot of lower standing charge tariffs from April 2026 with EDF, E.ON, Octopus and British Gas (Ofgem, 'Lower standing
  charge tariffs: next steps'; a British Gas derogation from SLC 22B, August 2026). No final rule requiring every supplier to
  offer one was found. Standing charges cover network costs, supplier-failure costs and investment.
- AEMC pricing review (draft, December, before the February 2026 submissions): more of the network charge moved to a fixed component. IEEFA's critique, via
  RenewEconomy (https://reneweconomy.com.au/higher-fixed-network-tariffs-could-cancel-out-the-savings-from-the-cheaper-home-batteries-rebate/):
  low and medium users, efficiency investors and solar and battery owners pay more; IEEFA's own report not found. The AEMC
  argues the volumetric status quo disadvantages renters; separate modelling finds most households gain.
- NERSA, 18 February 2025 (Engineering News, 24 February 2025,
  https://www.engineeringnews.co.za/article/nersa-approves-generation-capacity-charge-sets-out-other-retail-tariff-plan-changes-2025-02-24):
  Eskom's retail tariff restructure approved for 2025/26: the generation capacity charge phased in at 20% in 2025/26 and 30% in
  each of the two following years; inclining blocks removed for Homelight and Homepower prepaid customers; a fixed charge phased in
  for Homepower and Homeflex; peak to standard ratio 1:8 to 1:6.

## Leads from a SAPVIA spokesperson's deck (user, 22 Oct 2026, message 317; Frank Spencer, Enerset and sbg.earth, October 2026)

Advocacy material; the deck is not in the repository and is not cited. Each lead below names the primary source to cite once
checked; none is checked yet.
- Rooftop output: sbg.earth estimates about 12.9 TWh a year from rooftop solar. Against the model: RESULTS 'Rooftop output
  against sbg.earth' (message 317 (a)).
- Meridian Economics, SA Power Market Report (September 2026): WEPS estimates (wholesale electricity price).
- Eskom Homeflex 1, 2026/27 time-of-use rates: R7.91/kWh winter evening peak, R2.79 at noon; Gen-offset credits 737c and 343c
  (Eskom's 2026/27 tariff booklet, local to Nick, cite by page; the model already reads Homeflex credits from booklet p.44).
- City of Cape Town small-scale embedded generation feed-in, 2026/27: 107.98c plus a flat 25c incentive; time-of-use feed-in
  625.73c and 243.47c, not yet available (City of Cape Town tariff schedule 2026/27).
- The fixed-charge leads are in TODO 14io and the VPP lead in TODO 14ip.


## c6 inputs: coal availability, coal CO2, rooftop basis, the demand coverage and Kelvin (user, 22 Oct 2026, messages 318-319, 322-328; build 2026-10-22e, c6 PR A)

Eskom's performance report FY2026 (year to 31 March 2026; Nick's copy, cited by printed page, paraphrased, Eskom credited) and its
weekly System Status report, 2026 Week 42 (12-18 October). The arithmetic is ours, not Eskom's.

- Coal availability (coalEAFPct 65, coal only; messages 326 and 328). Three figures that measure different things:
  - Week 42 report, p.3: energy availability factor 68.32% for calendar 2026 to date, whole fleet (nuclear, open cycle, hydro and
    pumped storage included); 62.44% for 2025. The page's stored whole-fleet figure (ESKOM_FLEET_EAF_PCT) is this one from build
    2026-10-22e (was Week 32's 67.95%).
  - Performance report, p.21: 65.16% for FY2026 (60.60% FY2025), also whole fleet; targets 68% for FY2027 and 70% from FY2028.
  - The model's coalEAFPct is coal only, calendar year: 65, against 65.3% from Eskom's hourly data for January-August 2026
    (ESK19679, our estimate, EAF_HISTORY) and 64.8% from Week 42 converted.
  - The conversion (coalEafFromFleet): available MW = whole-fleet % x the whole fleet (48,298 MW: coal 39,692, nuclear 1,880,
    hydro 602, pumped storage 2,724, open cycle 3,400); less nuclear at its output (1,880 x 0.66) and the other 6,726 MW at 90%;
    over coal's 39,692 MW. Each whole-fleet point is 48,298 / 39,692 = 1.22 coal points, so 68.32% gives 64.8%, 68% gives 64.4%
    and 70% gives 66.8%; FY2026's 65.16% gives 60.9% (61.4% from the hourly data). The 'Eskom targets' sensitivity after the note
    uses 64.4 and 66.8 (TODO 14ir).
- Coal and nuclear capacity (message 323): coalInstalledMW 39,692 MW nominal (p.6), sourced; nuclearMW 1,880 MW nominal (p.6),
  both Koeberg units rerated to 940 MW in March 2026 (p.23), sourced.
- Coal CO2 (emisCoal; messages 323 and 325): Eskom's CO2 for FY2026, 184.0 Mt (p.35; FY2025 204.6, FY2024 190.4), covers coal,
  gas turbines and start-up oil. Less Eskom's own open-cycle output (811 GWh, p.7) at the model's diesel factor (0.78 t/MWh),
  over coal sent out (165,431 GWh, p.7): 1.108 t CO2/MWh sent out. The model has no separate start-up oil, so it belongs in the
  coal factor. The engine applies emisCoal to coal output times the part-load multiplier, whose 2026 mean in c5f was 1.0262, so
  emisCoal = 1.108 / 1.0262 = 1.080 (was 1.04, no recorded source); validate_benchmarks holds Today 2026's rate within 0.5% of
  1.108 (1.104 on build 22e). CO2, not CO2e: carbon tax is levied on CO2e, 1.112 on the same basis (Integrated Report 2026),
  so the carbon cost is about 0.3% low. No second constant. FY2025 on the same basis is about 1.13 (Eskom's own FY2025
  open-cycle output not in hand; calendar 2025's 3.4 TWh, Eskom and IPP, gives 1.126).
- Rooftop basis (messages 322 (c) and 324 (a)): NTCSA's rooftop series (8,942.1 MW after wheeled solar; Week 42 confirms 9,430.1 MW
  for August-September 2026, so FIXED.rooftopMW is current) does not state DC or AC; the engine treats capacity times the
  utility profile, which behaves as AC. So the cost is AC: R12,500/kW DC (excluding VAT, January 2026 rands, a judgement across
  the sources in 'PV and rooftop cross-checks'; R9,000-16,000 DC for the later sensitivity) x a DC/AC ratio of 1.2 (typical
  range 1.1-1.3) = R15,000/kW AC (was R17,000, no recorded source).
- The demand coverage gap (messages 318, 319, 322 (b) and 324 (b)): the model's customer demand is Eskom's RSA contracted demand
  less exports, plus wheeled load, plus a rooftop add-back; without rooftop it is about 188 TWh against Stats SA's P4141
  electricity available for distribution, 204.6 TWh in 2025. About 10 TWh of the gap is supply Eskom's series does not see
  (municipal and private embedded generation), consistent with the model's supply side, which also leaves it out. The one
  known overlap with demand: Kelvin (153 MW in the fleet, scaled within 39,692 MW, closed from 2027), a municipal-area plant kept
  in the model's supply (message 324 (b)); Steenbras and other municipal plants are outside the model's supply.
  Recorded as consistent.
- The IRP pair's demand (message 324 (c)): ESRG's domestic grid demand scaled by 194.6/204.6 = 0.951, Eskom's 2025 coverage share
  of P4141, with no export gap folded in. The scaling assumes the coverage share stays constant over 2026-40.

## Leads for the regional model and the all-options pathway (user, 22 Oct 2026, message 330; leads only, after the note, TODO 14is)

- SAPP, draft Generation and Transmission Master Plan Update (2026 consultation, sapp.co.zw; the final is pending). Chapter 4 lists
  South Africa's interconnectors: existing Songo-Apollo HVDC 1,920 MW; Maputo-Arnot (two circuits) 1,110 MW; Ressano
  Garcia-Komatipoort 168 MW; Phokoje-Matimba 829/649 MW; Segoditshane-Spitzkop (three) 649 MW; Namibia 170/464 MW per link;
  Eswatini 183 and 357 MW; Lesotho 92 MW. Planned: Obib-Oranjemund 611 MW (2026); BOSA Isang-Mahikeng 650 MW (2027); ZISA
  Nzhelele-Triangle 650 MW (2030); Mozambique 600 MW (2030); Inga 3-Merensky 1,500 MW HVDC (on hold). Chapters 1-3, 6-8 and 15
  (demand, generation plans, scenarios, alignment with national plans and the CMP) for the regional model and for South
  Africa's import and export options. Against the model: nodal/corridor_electrical.json has no cross-border link (it leaves the
  Apollo-Cahora Bassa HVDC out on purpose); imports are a fixed infeed capped at the 1,150 MW Cahora Bassa contract, not the
  1,920 MW line; importsEndYear ends the contract, not the line. The terms of SAPP's consultation documents are to be checked
  before any layer is published (message 332 (b)).
- IRENA, SPLAT-CMP (Advancements in continental power system planning for Africa, July 2024): data in AUDA-NEPAD's Mwanga database
  (cmpmwanga.nepad.org); resource zones open access (Sterl et al., 2023); a results dashboard; the SPLAT user guide at
  splat-tutorial.readthedocs.io; the GitHub repository's licence to check; interconnector costs by distance, voltage and terrain
  on SAPP data, a candidate cost basis for new links.
- AUDA-NEPAD pre-feasibility studies for four SAPP interconnectors under the CMP, due end-2026: identify them when published.

## Virtual power plants: costs to source (user, 22 Oct 2026, message 333; leads, TODO 14it)

- Brattle, Real Reliability: The Value of Virtual Power, technical appendix (May 2023): Table 3, 2022 dollars per participant:
  smart water heaters $315 one-off, $55 a year non-incentive, $30 a year incentive; home batteries $0, $140, $500; managed EV
  charging $0, $80, $100. Table 4: net cost $42.85/kW-yr for a VPP, $68.68 for a utility battery, $103.50 for a gas peaker.
  Household devices are excluded as already owned.
- South African leads: geyser controller cost and incentive (Plentify; Cape Town's Smart Geyser pilot; Engineering News, 9 Jul
  2026: R1,200 a year bill saving and about R1,800 per geyser a year saved, company-reported); the battery participant fee
  (Plentify-Deye, undisclosed); the enrolment cap from the 2.7 GWh Plentify-Deye pool, aggregated, not contracted.
- The model today: enrolled geysers bring batteries at 0.35 kW per geyser kW, 4 hours, with no enablement, programme or
  participant cost (the VPP slider's note says so from build 22e). Participant bill savings and payments are transfers, for the
  retail panels, not system cost.

## Coal flexibility benchmarks for UC_FLEET (user, 22 Oct 2026, messages 336 (b), 341 (c), 343 (a) and 344 (a); recorded, no model change)

What other fleets show or what the literature measures, beside the model's UC_FLEET (minimum stable 0.65 for 15 groups and 0.50, our
fill-in, for 16; minimum up and down 8 and 4 h for 28 groups; start-up costs R99-160 per MW per start; TODO 14iu). Each figure is
a unit's capability or a fleet's practice; they are not interchangeable.
- AEMO, 2025 Thermal Audit (November 2025), as given by the user: coal units' design minimum stable operating level typically 40%
  (pp.20, 23); time at minimum 13-16% of operating hours in 2024-25 (p.18); two-shifting trialled in New South Wales only and not
  pursued in Queensland (cost, fatigue) or Victoria (flame stability) (pp.36-38, 46-47); about 2 hours' notice to desynchronise or
  resynchronise (p.25). AEMO's 2025-26 IASR workbook (unit-level minimum stable levels, ramp rates, start costs and times) is to be
  compared unit by unit with UC_FLEET (message 344 (b)); aemo.com.au is not reachable from the analysis environment, 22 Oct 2026.
- NREL and Intertek APTECH, Power Plant Cycling Costs, NREL/SR-5500-55433 (N. Kumar, P. Besuner, S. Lefton, D. Agan, D. Hilleman;
  April 2012, published July 2012). NREL was renamed the National Laboratory of the Rockies (NLR) in December 2025; cited as
  published. All costs 2011 US dollars (p.11), lower bounds, per MW of capacity per start [hot, warm, cold]; figures as given by the
  user (messages 360, 361) pending a read of the PDF from docs.nlr.gov:
  - table 1-1, p.12, wear (capital and maintenance), medians: large subcritical coal $59, $65, $105; supercritical $54, $64, $104.
    75th percentiles (the sensitivity, p.33: units more susceptible to cycling than typical): $68, $78, $124; $63, $89, $120.
    Hot, warm, cold by time offline: warm 12-40 h for large subcritical, 12-72 h for supercritical; hot below, cold above.
  - table 1-3, p.30, start-up fuel, the whole fuel per start: large subcritical 7.5, 10.0, 14.0 MMBtu/MW; supercritical 10.1,
    17.1, 20.1. Other start costs: $5.61, $7.98, $10.15; $5.81, $8.62, $11.58.
  To January 2026 rands in the model (COAL_START_*): US CPI-U 325.252 (January 2026, BLS, FRED CPIAUCNS) over 224.939 (2011
  annual average), x1.4460, at R16.50 to the dollar (the model's rate). Wear plus other costs, large subcritical: hot R1,541, warm
  R1,741, cold R2,747 per MW per start; supercritical R1,427, R1,733, R2,758. Start fuel (oil and coal, one combined fleet-level
  figure per start type, NREL/Intertek (2012) and Eskom, analysis ours): large subcritical R562, R792, R1,125; supercritical R693,
  R1,151, R1,433 (central, heavy fuel oil on the model's diesel price basis); spot oil R694, R1,000, R1,426; R825, R1,359, R1,735.
  The coal in start fuel is priced at the model's R47.94/GJ (below). These replace the earlier estimate of about R1,500 per MW
  (wear alone, at June 2026 CPI). With start fuel, R2,103-3,872 (large subcritical) and R2,120-4,191 (supercritical) per MW per start, against UC_FLEET's R99-160 per MW: about 13-39 times higher. Whether PyPSA-RSA's start costs
  include wear or only fuel is not documented (question for Meridian, TODO 14hu).
- The model's coal cost per GJ, R47.94 (message 361 (b)): costCoal R553/MWh sent out (Eskom FY2026 integrated report: coal and
  other generation primary energy cost R91.5 bn, p.56, over coal sent out 165,431 GWh, p.7) over 11.53 GJ/MWh, the heat rate implied
  by the model's coal CO2 of 1.108 t/MWh sent out (Eskom's CO2, p.35, less its open-cycle output at the diesel factor) at 96.1 kg
  CO2/GJ (IPCC 2006 Guidelines for National Greenhouse Gas Inventories, vol. 2, ch. 1, table 1.4, sub-bituminous coal). Residual
  fuel oil 40.4 GJ/t (same, table 1.2), used in the start-fuel split. Heating values: IPCC's are net; NREL's MMBtu are taken as
  given; the basis difference is within about 5% of the start fuel.
- Central Electricity Authority (India), as given by the user: India's large subcritical fleet runs at a 55% technical minimum (a
  CEA committee, reported by Power Line, 6 March 2026); 40% by 2030 only with retrofits (CEA flexible operation regulations, 2023).
- Agora Energiewende, Flexibility in thermal power plants (2017), table 1, as given by the user (p.48): hard coal minimum load 25-40%
  of rating, ramp 1.5-4% a minute, hot start 2.5-3 h, cold start 5-10 h. Page, columns ('commonly used' against 'state of the art')
  and what the model's other ramp citations measure are not yet checked against the document (message 337 (b); TODO 14iu).
- Eskom's own hourly data (ESK19679; Eskom credited, analysis ours), as demonstrated practice, a lower bound on capability (message
  336 (a)): the coal fleet's hour-to-hour rise at the 99.9th percentile 1,950 MW in 2025 and 2,349 MW in January-August 2026 (8.9%
  and 9.2% of available coal); its daily minimum over maximum 0.87 (2025) and 0.82 (2026) at the median, 0.72 at the lowest day.

## Coal report sources (user, 23 Oct 2026, messages 345, 347 (b), 348, 349; RESULTS 'Coal report for c6, measurements')

- Eskom, Research, Testing and Development, Generation Operational Flexibility (RES/TRR/21/1962944, November 2023), in Eskom's
  minimum emission standards exemption flexibilisation notice (October 2025). Held by the user. The report bars publication of its
  contents without written permission: used locally only; no per-unit figure in this repository or in public text; only derived
  fleet-level statements, credited to Eskom, the analysis ours, paraphrased.
- Ember, Electricity Data Methodology (May 2024), pp.15-17 (emissions factors: lifecycle, all gases, coal from UNECE 2020 plant
  factors blended by coal grade; 6% gross adjustment for thermal) and the hydro footnote (pumped storage excluded where possible);
  South Africa section (monthly generation from Eskom, annual from EI). Read 23 Oct 2026 from ember-energy.org.
- AEMO, MMSDM monthly archive, October 2025 (DISPATCH_UNIT_SCADA, GENUNITS, DUALLOC), nemweb.com.au. AEMO's copyright permissions
  grant a general permission to use AEMO material for any purpose with accurate attribution to AEMO (aemo.com.au, 'Copyright
  Permissions', read through a search extract on 23 Oct 2026; www.aemo.com.au is not reachable from the analysis environment).
  Files kept local; derived statistics only; analysis ours.
- Brent, 2023 average $83/b: EIA, Today in Energy, January 2024. Rand per dollar, 2023 average 18.4535: Federal Reserve G.5A (FRED
  AEXSFUS). US CPI-U, January 2026, 325.252: BLS release of 13 Feb 2026 (FRED CPIAUCNS).
- PyPSA-RSA, scenarios/ME IRP 2024/sub_scenarios/fixed_technologies.xlsx (commit 89872c1): unit start-up costs; no price base
  stated; config.yaml's costs block (year 2030, R18.24/$) applies to technology costs.

## Context for the pack, 26 Oct 2026 (user, message 388; no input changed)

Pointer: C. Yelland, EE Business Intelligence weekly note, 26 October 2026 (Nick's copy, not read here). Originals cited where found
(web search, 26 Oct 2026); where none was found the item is marked 'as reported'.
- Gas: IGUA-SA, Gas Roadmap for South Africa 2025-42, update of May 2026 (Engineering News, 18 May 2026, 'Industrial gas users
  outline policy actions needed to avert gas cliff'): gas cliff from mid-2028; Sasol's methane-rich gas from Secunda to external
  customers July 2028 to June 2030 (Engineering News, 16 Sep 2026). The October 2026 edition and 'LNG terminals unlikely before
  2031': as reported (Yelland); not read. Basis of Nick's decision on gas from 2032 (message 389).
- Kariba: Zambezi River Authority, 2027 allocation for power 23 billion cubic metres against 36 in 2026 (-36%), on forecasts of a
  strong El Nino; 11.5 each for ZPC and ZESCO (The Herald, Harare, 'ZRA slashes Kariba water allocation for 2027', October 2026;
  Lusaka Times, 20 Oct 2026).
- Thyspunt: Eskom's draft scoping report (WSP, April 2026) names Thyspunt the preferred site for 5,200 MW; a full EIA follows if
  DFFE accepts the scoping (Daily Maverick, 14 Apr 2026); SAHRA's provisional Grade I heritage declaration, January 2025, to at least
  February 2027. Draft EIA in Q1 2027, no authorisation or vendor: as reported (Yelland).
- Tubatse pumped storage: Eskom's two-stage strategic-partner process with Eskom Green, RFQ then RFP; 1.5 GW, about 21 GWh, four
  reversible units, up to 14 hours at full output; land secured, environmental authorisation granted, water from De Hoop Dam
  (Engineering News, 13 Oct 2026; Energy-Storage.news, October 2026). RFP due 30 Nov 2026: as reported, not confirmed.
- Ekurhuleni: Section 34 determination for about 2,400 MW from IPPs, announced by the Minister on 19 Oct 2026: 1,237 MW solar PV
  (1,137 embedded), 780 MW gas (535 wheeled), 183 MW waste-to-energy, 200 MW other (SAnews; EWN, 19 Oct 2026).
- Cape Town: 500 MW energy-trader tender, PPAs of one to ten years, minimum 5 MW a project, delivery within 36 months, responses
  closed 13 May 2026 (Engineering News, 1 Apr 2026; Mining Weekly, 24 Apr 2026).
- eThekwini: Project Smart Solar with Plentify, 280 households and facilities with solar and batteries, applications from June 2026
  (Engineering News, 3 Jun 2026). GreenCape VPP sandbox (1-4 providers, about 150 households, February-September 2027): as
  reported, no original found.

Private South African solar, disclosed costs 2024-26 (user, 28 Oct 2026, message 455 (d); reference only, a cross-check like the
wind high case; from search-result summaries of 28 Oct 2026, the articles not opened from this container (.co.za pages blocked):
confirm scope, AC or DC, and whether the figure is total capex or the financing raised before any use):
                         Sibanye-Stillwater, Springbok solar, 150 MW, estimated R2.8bn, commercial operation September 2025:
                         about R18,700/kW (Engineering News, Sibanye-Stillwater renewable energy projects update, 29 May 2026).
                         SolarAfrica, SunCentral 2, 114 MW, financial close R1.5bn, February 2026: about R13,200/kW, possibly
                         financing only (Engineering News, 10 Feb 2026; SolarQuarter, 20 Aug 2026). SolarAfrica, SunCentral 1,
                         114 MW: R1.8bn reported at financial close (Engineering News, 25 Feb 2025) and R5bn capex in a later
                         update (Engineering News, 2 Oct 2026); scopes differ, unresolved. For comparison (January 2026 rands):
                         BW6 tracker bids R16,786/kW, IRP 2025 Figure 9 R16,785-21,101/kW, the central's BW7-implied R10,998/kW.

BW7 solar as the reference (user, 28 Oct 2026, message 457; solar only, wind stays on BW6 as BW7 awarded no wind). Three points, in
January 2026 rands, on the central's basis (8% real, 25 years, fixed O&M R287/kW-yr, new tracking solar's run capacity factor 28.6%):
                         Lower (bid tariff): the first eight BW7 awards (1,760 MW, DMRE preferred bidders list, Dec 2024, as
                         held in BW7_SOLAR_AWARDS) average R461.15/MWh MW-weighted, the "average bid tariff R0.46/kWh" of Green
                         Building Africa, 'Eight solar projects awarded preferred bidder status in REIPPPP BW 7', and Engineering
                         News, 6 Jan 2025. Price base date not stated in the DMRE lists; no IPP Office or DBSA note giving it was
                         found (web search, 28 Oct 2026); the model takes January 2024 (RFP issued 14 Dec 2023, bids due Aug
                         2024), so x1.0681 to R492.6/MWh and an implied capex of about R10,100/kW, R0.49/kWh.
                         High (disclosed investment): R31.4bn for the same 1,760 MW (department statement, as reported in both
                         articles), R17,841/kW, taken as early-2025 rands, x1.035 to about R18,470/kW, about R0.81/kWh; like
                         wind's disclosed investment values, it may include connection, development and financing costs. The
                         later 890 MW tranche reported R16bn, about R18,000/kW (allAfrica, "Ramokgopa Announces 890mw Solar Boost", 17 Dec 2025, as summarised by a web search, not read).
                         Central (compliant bid capex): no BW7 bid capex has been published by the IPP Office (searched 28 Oct
                         2026), so there is no BW7 central point; the nearest published compliant-bid figure is BW6's tracker
                         bids, R16,786/kW, about R0.74/kWh.
                         The solar central now: R10,998/kW, R0.53/kWh, backed out of all 18 BW7 awards' MW-weighted tariff
                         (R492.53/MWh over 3,940 MW), so it sits near the lower point.

## National Energy Efficiency Strategy 2026-2035 (user, 28 Oct 2026, message 444 (a); reference for a later demand case, no input changed)

- Department of Electricity and Energy, NEES 2026-2035 presentation (October 2026; PDF held by Nick; the strategy document of
  19 Sep 2026 also seen): 132 PJ of savings by 2035, by sector: industry 40.7, transport 43.3, commercial and public 34.8,
  residential 13.3 PJ. No electricity share and no peak-demand target are given. It states that efficiency is absent from the IRP
  and proposes treating it as a supply-side-equivalent resource. It cites IRP 2025's R2.33 trillion of investment to 2050.

## Gas timing (user, 28 Oct 2026, message 475)

- NERSA, Feedback report on the NERSA gas dialogues of 1 July 2026 (October 2026;
  https://www.nersa.org.za/files/files/2026/10/FeedbackReportontheNERSAGasDialoguesof1July2026.pdf; quoted by Nick, not read from
  this container): "Standard procurement may be too rigid"; LNG expected around 2029-30; bankability depends on infrastructure
  finance and anchor demand. Basis for s_gas2035_c6e beside the gas-from-2032 central.
- Department of Electricity and Energy, statement of 28 October 2026 (PDF held by Nick, to be placed in Drive; message 477): Gas IPP
  bid window 1 (2,000 MW sought; four bids for 2,830 MW, received 29 May 2026) appointed no preferred bidders, mainly because
  bidders could not assure gas supply (imports from Mozambique; no LNG terminal); a bid window 1.5 is to follow, with details before
  the end of 2026. Basis for c6e's central taking new gas from 2035 (bid window 1.5's rules by early 2027, financial close 2028-29 at
  the earliest once an LNG terminal is committed, three to four years to build a CCGT); 2032 is the sensitivity s_gas2032_c6e.

- Bloomberg, 'Mitsubishi Power: High Gas Turbine Demand Is Pushing Out Deliveries to 2031', 27 October 2026 (paywalled; the user
  holds the text; as reported by the user, 29 Oct 2026, message 492; not read here). Mitsubishi Power Asia Pacific's chief
  executive: new orders deliver around 2031; the 2028 and 2029 slots are almost full; global orders this year about 70-80 GW.
  Bearing on gas build timing: new gas before about 2034 assumes turbines already ordered (the pack, section 4, beside the
  gas-timing sensitivities). See also 'Gas turbine prices and lead times' below.

- Engineering News, 'IRP 2025 raises gas load factor to 50% as adjustments are also made to accommodate nuclear and "clean coal"',
  19 October 2025 (as reported by the user, 29 Oct 2026, message 497; not read here): the Minister's briefing, gas-to-power to anchor
  gas demand for industrial users and the LNG imports needed as Sasol's Mozambican supply runs down. The article gives 50%; the
  Gazette gives 51% (Government Gazette 53596, p.34), the figure the model and the note use. Used for the note's first agreed text
  (NOTE_DRAFT.md) and the pack's s_irpgas finding.

## Cost of capital by technology (user, 28 Oct 2026, messages 468 and 469; build 2026-10-28a)

Two rates. The discount rate that weights each year stays 8% real, one for all (BLD_DISC). Meridian Economics' review of the IRP
2023 discounts "future costs ... at 8.2% real" (slide 16, read by the advisor); SATIMGE's global rate 8.2% (search snippet only);
IRP 2025 states "a discount rate of 11.3%" (Gazette p.34), real or nominal not stated in the plan or its assumptions workbook (read
as real: its costs are in constant January 2024 rands). Capital charges and interest during construction take each technology's
real pre-tax cost of capital (bldCoc). The central is the cost of capital for state-backed procurement (REIPPPP, BESIPPPP), the only
South African bid evidence.

Central rates and their basis (message 469 as amended):
- Utility solar 5.5%: the rate at which BW6's compliant tracker bid capex (R15,715/kW, IPP Office REIPPPP historical data note,
  7 Nov 2025, January 2024 terms; R16,786 in 2026) with BW6's fixed O&M reproduces BW6's average tariff (R490.48/MWh, base 1 April
  2022, about R590 in 2026) over the model's 25-year solar life at the bids' 30.1% capacity factor: 5.6%. On the same capex BW5's
  R428.79 (base taken as April 2021) gives 4.7% and BW7's MW-weighted R492.53 (base taken as January 2024) 4.2%.
- Onshore wind 5.5%: equal to solar. CEPA for DESNZ, Hurdle rates for electricity generation (final report 30 July 2025, pre-tax
  real at 31 December 2024; read by the advisor) gives solar PV and onshore wind the same 7.6% under a CfD; the premia depend mainly
  on the revenue model, and South Africa's wind and solar have the same state-backed contracts.
- Lithium storage 6.8%: solar + 1.3 points, CEPA's gap (lithium under a capacity-market contract 8.9% against 7.6%). It rests
  first on BESIPPPP BW1's capacity charge (about R420 per MW per hour of availability against about R28m/MW of capital, R10.09bn
  for 360 MW: about 13% of capital a year over the 15-year contract, about 7% real if the charge is CPI-indexed and covers fixed O&M,
  about 10% if it covers capital only). The charge is levied per MW of contracted capacity per hour of availability (BW3 award
  table, energy-storage.news, search snippet only; the BW2 list notes the evaluation price is the present value of the capital cost
  recovery charge and the energy output payment). Its indexation and what it covers are not confirmed: to read in the BESIPPPP RFP.
- Pumped storage 6.8%: solar + 1.3 (CEPA: pumped hydro 8.9%).
- New gas (CCGT, open-cycle on LNG and on diesel) 8.0%: no South African gas bid; many development and commercial lenders exclude
  new gas; LNG import supply and price risk; stranding risk under tightening carbon policy; a lower rate would make gas cheaper on
  assumption alone (message 469, rule 366).
- Nuclear 8.5%: CEPA's 7.6% for large nuclear holds only under the UK's regulated asset base; South Africa has none (CEPA's SMRs
  8.9%). Construction risk stays in nuclear's high capex case (USD 12,000/kW).
- New coal 8.0%: as gas (no new coal is built).
- Transmission, grid connection, coal retrofits and peaker life extension 7.1%: NERSA's allowed real pre-tax WACC for Eskom
  (MYPD4, as reported in a parliamentary reply; search snippet only; MYPD6's figure not found).
- Rooftop: the discount rate (owners' finance, outside state procurement; no evidence for another rate).
- Cross-checks: NREL ATB 2024 (read; real pre-tax, no tax credits): solar 5.46%, wind 5.77%, pumped storage 6.01%, nuclear 7.20%,
  gas and coal 8.06%. IEA Cost of Capital Observatory, South Africa: solar 11-13.5% nominal after tax (2023-24), about 9.0% real
  pre-tax at 4.5% inflation grossing up equity only (search snippets; the high case's level). The 2018 Europe Economics (NERA)
  figures used in BEIS 2020 are replaced by CEPA 2025.

Cases (FIXED.bldCocCase): 'high', the same gaps on the IEA's 9.0% for solar (wind 9.0, storage 10.3, gas 11.5, nuclear 12.0, network
9.0); 'low', the central less one point (network unchanged); 'planning', one rate for all (BLD_DISC), as IRP 2025 does; 'private',
private and merchant finance for wind, solar and lithium (corporate PPAs, wheeling via traders, the wholesale market from 2027):
wind and solar +1.5 points, lithium +2.0 (user, 28 Oct 2026, message 472; PDF supplied by Nick). CEPA for DESNZ (July 2025), section
5.3.3, Table 5.22 (p.116): investor survey, impact of a merchant revenue model on the overall hurdle rate, all technologies +1.5% to
+3%, median +1.5%; on equity, solar PV and onshore wind +1% to +3%. Supporting evidence: Brookfield Renewable Partners, uncontracted
minus contracted discount rates +1.2-1.3% (Table 5.23, p.119); Europe Economics (2018), merchant minus CfD, solar PV and onshore wind
+0.8% (Table 5.24, p.119); CEPA's conclusion (p.120): the +1.5% median is consistent with the other evidence. Wind and solar take the
survey median; lithium +2.0, inside the survey range, as storage is more exposed to price swings. South African private deals are
mostly corporate PPAs, partly contracted, so a full merchant premium makes this case an upper bound for private finance. The
state-backed central stands; private is a sensitivity (Nick, 28 Oct 2026); blending by a sourced public and private split is
next-note work. No South African figure for the private premium was found: REIPPPP benchmarks only (BW5 debt margin
about 2.5%, equity IRR 11.35%, Intellidex; 54+ projects, nominal equity IRR 12.3%, senior debt 10.2%, gearing 70.8%, Cresco,
6 Mar 2024; search snippets). Public and private split of new build, partly sourced (search snippets): BNEF, corporate PPAs backed
48% of 1.4 GW in 2025 and are expected to back 73% of 2.3 GW in 2026; NERSA registrations since 2018, 16,461 MW by October 2025
(solar 11,443, wind 5,018), registered not built; GreenCape, 6 GW private solar and 3.5 GW private wind by 2030.

Interest during construction: only where the capital cost is quoted before financing; bid capex and announced project values
(REIPPPP wind and solar, BESIPPPP lithium) are assumed to include financing. Build years (spend uniform, mid-year; the project's
assumptions, checked against NREL ATB 2024's construction finance factors, gas 1.114, coal 1.235, large nuclear 1.30, pumped storage
1.064): CCGT 3, open-cycle 2, offshore 3, vanadium and iron-air 1, pumped storage 6, nuclear 8, coal 6, transmission 3, grid
connection 2. At the central rates: CCGT 1.125, open-cycle 1.081, nuclear 1.410, coal 1.271, pumped storage 1.226, transmission 1.110.

Lives (unchanged, message 469 (d)), with their sources: wind and solar 25 years (the model's since build 07j; REIPPPP PPAs run 20
years; NREL ATB 2024's recovery period is 30 for every technology, technical lives longer); lithium 15 (BESIPPPP's 15-year contract;
McCall et al. 2019, read); vanadium flow 25 and iron-air 20 (BLD_LIFE comments: cycle and calendar life, iron-air a judgement);
CCGT and open-cycle 30 (the model's; ATB technical life 55); pumped storage 60 (civil works; acapPs's comment; ATB hydro 100);
nuclear 40 (the model's; ATB technical 60; a 60-year sensitivity, NUC_LIFE=60); new coal 40 (ATB technical 75); transmission and
grid connection 40 (TX_LIFE_YEARS, BLD_GRID.lifeY). IRP 2025's lives were not found (EPRI 2017's cost tables could not be read).

Bid check (validate_bids.js, two-sided at 10%): solar against BW5-7, wind against BW5, lithium against BESIPPPP BW3's capacity charge
(about R204-235/MW/h; base taken as 2025, not found); CPI April 2022 5.9% (Stats SA release, search snippet). Explained flags: wind
above BW5 (BW5's prices do not hold: 784 MW of BW5 wind signed by December 2022, no wind tariff awarded since, BW7's compliant wind
bids rejected as too high; message 469 (c)); lithium below BW3 (equipment prices fell after the bid: BNEF turnkey survey, USD 165/kWh
in 2024, 117 in 2025, as in BLD_COST.batt). RMIPPPP not checked (hybrids to a firm profile; powerships bundle fuel and a 72.7%
take-or-pay; weighted average evaluation price R1,575/MWh, April 2020 base; search snippet).
