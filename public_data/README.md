# GridTwin ZA published data

CC BY 4.0. Attribution required; reuse, modification and commercial use permitted.
Cite as: GridTwin ZA, gridtwinza.org, accessed <date>.

Compiled from published South African sources. A project fact - name, capacity, technology,
location, commissioning date - is not copyrightable; these files are the compilation, and
the compilation is what is licensed.

## Files

**operational_renewable_capacity.csv** - what is BUILT, by region, technology and
procurement route. The route split is the part that does not exist elsewhere: the IPP
Office covers REIPPPP and RMIPPPP only, so any single published source is incomplete for
private and wheeled plant.

**ipp_pipeline.csv** - contracted but not yet operational, separated into allocated to a
region, unallocated, and terminated. Terminated projects sit outside the procured identity.

**transmission_substations.csv** - 189 substations with coordinates, voltage and supply-area
assignment.

**connection_headroom.csv** - NTCSA GCCA connection headroom by supply area. Wind and solar
share headroom and are not additive.

**environmental_authorisations.csv** - DFFE permits with coordinates. Permits, not plants:
permitted capacity exceeds built by roughly ten times.

**irp2025_extract.csv** - IRP 2025 (Government Gazette 53596, 28 Oct 2025) by OCR and visual
reading: Table 1 new capacity by year to 2042, committed private capacity by year, the demand
definition and reference-case assumptions. Check any single value against the gazette before relying
on it; the storage total does not match its yearly values (SOURCES.md).

**anu_phes_za_summary.csv** - off-river pumped hydro sites from the ANU RE100 atlas South Africa
shortlist (6,921 site pairs outside protected areas, downloaded Oct 2026), aggregated by the model's ten
supply areas (nearest substation) and cost class (AAA cheapest, then AA, A, B): sites, energy (GWh) and
power (GW). Two sets: 'gross' counts every listed pair, but the atlas offers several sizes on the same
reservoirs, so gross totals overlap and must not be added; 'nonOverlap' uses each reservoir once (best
figure of merit first). Derived from the atlas; attribute ANU RE100 (Blakers et al.). The site list
itself is not republished here until its licence is confirmed.

## The one thing to get right

**Do not add operational capacity to pipeline to permits.** They are three different
universes and double-counting across them is the most common error with South African
capacity data. Operational is built; pipeline is contracted and unbuilt; permits are
authorisations that may never be either.

## Checking a copy against the source

Every CSV header carries the `gtza-` fingerprint of the JSON it came from. Those hash the
data body excluding metadata, so they change when the data changes and not when its
documentation does. If a fingerprint no longer matches the file in `nodal/`, that dataset
has been revised since your copy was made.

## Known limitations, stated rather than buried

- Hydra Central is a transmission supply area spanning the Karoo, not a province. Some
  Northern Cape capacity physically connects there; the split is not fully resolved.
- Private and wheeled capacity covers H1 2026 only. Plant commissioned before January 2026
  is not in the source monitor.
- RMIPPPP contributes about 225 MW across three provinces with no published split, so it
  sits outside the regional file.
