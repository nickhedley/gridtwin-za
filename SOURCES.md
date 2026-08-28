# GridTwin ZA - source register

Every external source, how often it publishes, which edition is currently loaded,
and what it feeds. A refresh should be a mechanical check against this table, not
an act of memory.

When a new edition lands: REPLACE the whole block, re-derive, THEN delete
superseded queue entries. Never add the delta. See RULES.md.

---

## Currently loaded

| source | cadence | edition loaded | feeds |
|---|---|---|---|
| IPP Office, *An Overview - IPPPP* | quarterly | Q4 2025/26, as at 31 Mar 2026, p.18 | `by_source.reipppp`, both identities |
| Power Futures Lab, UCT GSB, IPP monitor | half-yearly | H1 2026 | `by_source.private`, `pfl_cod_h1_2026.json` |
| Ember, South Africa electricity | monthly-ish | 2025 full year + 12m to May 2026 | `validate_benchmarks.js` |
| Renewables.ninja / MERRA-2 | static | 2014-2023, ten weather years | `profiles_regional_multiyear.json` |
| PVGIS SARAH2 v5.2 | static | 739-point grid, 0.5 deg | `sa_solar_grid.json` - ORPHAN, unused |
| CSIR least-cost study (PLEXOS) | occasional | as cited in `validate_external.js` | external comparison, 2030 coal share |
| Eskom weekly system status | weekly | drift detector only | `validate_capacity.js` |
| NERSA registrations | rolling | as at last ingest | `nersa_registrations.json` |
| DFFE REEA | rolling | 2,597 authorisations | `reea_projects.json` - permits, not commissioning |
| Eskom TDP | annual | as at last ingest | `tdp_projects.json` |

## Watched, not yet loaded

| source | why it matters | status |
|---|---|---|
| IPP Office annual *Overview of the IPPPP* | the only route to PROJECT NAMES; the quarterly is aggregate throughout | needed for the Hydra Central split |
| PFL IPP Knowledge Hub COD table | settles Mulilo Total Hydra's COD month | deep links 404; navigate Research > Knowledge Hub |
| CSIR REEA database | would replace estimated rooftop and permit data | requested; DFFE `Reapplication@dffe.gov.za` is the better route |
| SSEG registration rules | would replace ESTIMATED rooftop with measured | pending |
| Seriti Green monthly simulation | independent SA grid model, published monthly since Jan 2026 | first read Aug 2026; differential test, NOT a validation set |
| Oxpeckers | complementary project data | their data is a validation set |
| #PowerTracker | primary source for wheeled commissioning | identified 17 Aug 2026 |
| NREL ATB | storage capex cross-check | needed before the vanadium constant is adopted |

---

## Contacts

```
Power Futures Lab      pflenquiry.gsb@uct.ac.za
DFFE reapplications    Reapplication@dffe.gov.za
IRENA LTES Network     ltes@irena.org
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

**Projects commissioned BEFORE the as_at date sit inside provincial aggregates**
and will never appear by name. Absence from the named files is expected for
those. This logic applies to PUBLIC projects only - see the first note.

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
