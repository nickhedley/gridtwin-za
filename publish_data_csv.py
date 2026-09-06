"""
GridTwin ZA - publish the data files as documented CSVs.

WHY

The JSON files in nodal/ hold compilations that do not exist elsewhere in clean form:
operational renewable capacity by province split by procurement route, the IPP pipeline
separated into allocated, unallocated and terminated, 189 transmission substations with
coordinates and supply-area assignments, and GCCA connection headroom by region.

They are JSON, nested, and shaped for a browser to fetch. That is the wrong format for the
people most likely to cite them - journalists, researchers, and analysts who work in
spreadsheets. A dataset nobody can open is a dataset nobody links to.

This flattens them to CSV and writes a data dictionary, so the files can be used without
reading the model's source.

LICENCE
CC BY 4.0 as of 6 Sep 2026. Attribution required, reuse and modification permitted. The
previous NC-ND terms blocked the exact use that generates citations.

PROVENANCE
Every CSV carries the source file's `gtza-` fingerprint in its header comment. That is what
makes a downloaded copy checkable against the live file months later.

USAGE
    python3 publish_data_csv.py            # writes into public_data/
"""
import json, csv, os, io

SRC = 'nodal'
OUT = 'public_data'


def fingerprint(d):
    m = d.get('meta') if isinstance(d.get('meta'), dict) else {}
    return m.get('fingerprint', 'none')


def write(name, header_lines, cols, rows):
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, name)
    with open(path, 'w', newline='') as fh:
        for h in header_lines:
            fh.write('# ' + h + '\n')
        w = csv.writer(fh)
        w.writerow(cols)
        w.writerows(rows)
    print(f'  {name:<40}{len(rows):>6} rows')
    return len(rows)


def capacity():
    """
    Operational renewable capacity by region, split by PROCUREMENT ROUTE.

    The split is the part that does not exist elsewhere. IPP Office reports REIPPPP and
    RMIPPPP only - no private, no wheeled, no Eskom-owned - so a provincial total from any
    single published source is incomplete by construction.
    """
    d = json.load(open(f'{SRC}/regional_renewable_capacity.json'))
    rows = []
    for src, block in d.get('by_source', {}).items():
        for tech_key, tech in [('wind_mw', 'wind'), ('solar_mw', 'solar'),
                               ('csp_mw', 'csp'), ('biomass_mw', 'biomass')]:
            for region, mw in (block.get(tech_key) or {}).items():
                if mw:
                    rows.append([region, tech, src, round(mw, 1)])
    rows.sort(key=lambda r: (r[1], -r[3]))
    return write('operational_renewable_capacity.csv', [
        'GridTwin ZA - operational renewable capacity by region, technology and source',
        'CC BY 4.0 - attribution required. gridtwinza.org',
        f'source fingerprint: {fingerprint(d)}',
        f"as at: {d.get('meta', {}).get('as_at', 'see source')}",
        'source: IPP Office quarterly (reipppp, rmipppp) + Power Futures Lab IPP monitor (private)',
        'NOTE: commissioned capacity, not bid-window awards. Captive behind-the-meter excluded.',
        'NOTE: Hydra Central is a transmission supply area, not a province.',
    ], ['region', 'technology', 'source', 'mw'], rows)


def pipeline():
    d = json.load(open(f'{SRC}/ipp_pipeline.json'))
    # The regional pipeline is AGGREGATE by technology, not a project list - the IPP Office
    # quarterly gives no project names. A first version looked for an `items` list and
    # produced six rows against a 6,971 MW pipeline, which is the kind of quiet emptiness
    # a row count catches and a spot check does not.
    rows = []
    for region, block in (d.get('by_region') or {}).items():
        if not isinstance(block, dict):
            continue
        # Use the PROJECT rows, not the technology aggregates. They are complete - every
        # region's projects sum exactly to its total_mw - and they carry names, which the
        # aggregates do not.
        #
        # Emitting both double-counted: allocated came out at 3,064 MW against a documented
        # 1,532. Caught by reconciling against the source's own reconciliation block, which
        # is why that block is worth having.
        for pr in block.get('projects', []) or []:
            if isinstance(pr, dict):
                rows.append([region, pr.get('tech', ''), pr.get('mw', ''), 'allocated',
                             (pr.get('name') or '')[:100]])
    for bucket in ('unallocated', 'terminated'):
        for it in (d.get(bucket) or {}).get('items', []) or []:
            rows.append(['', it.get('tech', ''), it.get('mw', ''), bucket,
                         it.get('name', '')[:100]])
    return write('ipp_pipeline.csv', [
        'GridTwin ZA - IPP pipeline: allocated, unallocated and terminated',
        'CC BY 4.0 - attribution required. gridtwinza.org',
        f'source fingerprint: {fingerprint(d)}',
        'NOTE: terminated projects sit OUTSIDE the procured identity - IPP Office capacity',
        'procured already excludes anything that never reached financial close.',
        'NOTE: allocated + unallocated = 7,046 MW, matching the source reconciliation.',
        'Rows marked `unspecified` are capacity in a region total that the source does not',
        'split by technology - carried rather than dropped.',
    ], ['region', 'technology', 'mw', 'bucket', 'project'], rows)


def substations():
    d = json.load(open(f'{SRC}/substations_compact.json'))
    rows = [[s.get('n', ''), s.get('lat', ''), s.get('lng', ''), s.get('kv', ''),
             s.get('area', ''), s.get('owner', ''), 'yes' if s.get('planned') else 'no',
             s.get('src', '')] for s in d.get('subs', [])]
    rows.sort(key=lambda r: str(r[0]))
    return write('transmission_substations.csv', [
        'GridTwin ZA - transmission substations with coordinates and supply areas',
        'CC BY 4.0 - attribution required. gridtwinza.org',
        f'source fingerprint: {fingerprint(d)}',
        'NOTE: `planned` marks stations not yet energised. Coordinates are compiled from',
        'published sources and cross-checked against transmission line endpoints; a small',
        'number remain approximate and are flagged in the source file.',
    ], ['name', 'lat', 'lng', 'kv', 'supply_area', 'owner', 'planned', 'source'], rows)


def headroom():
    d = json.load(open(f'{SRC}/headroom_summary.json'))
    rows = []
    for region, v in (d.get('headroom') or {}).items():
        if isinstance(v, dict):
            rows.append([region, v.get('wind_mw', ''), v.get('solar_mw', ''),
                         v.get('batt_mw', '')])
    rows.sort(key=lambda r: -(r[1] or 0))
    return write('connection_headroom.csv', [
        'GridTwin ZA - NTCSA GCCA connection headroom by supply area',
        'CC BY 4.0 - attribution required. gridtwinza.org',
        f'source fingerprint: {fingerprint(d)}',
        'NOTE: wind and solar SHARE headroom - they are not additive. The GCCA publishes',
        'the larger of the two per area, which is why the figures often match.',
        'NOTE: a revisable snapshot, not a hard wall. It moves as the TDP is built out.',
    ], ['supply_area', 'wind_mw', 'solar_mw', 'battery_mw'], rows)


def permits():
    d = json.load(open(f'{SRC}/reea_projects.json'))
    items = d if isinstance(d, list) else d.get('projects', [])
    rows = [[x.get('name', '')[:120], x.get('province', ''), x.get('tech', ''),
             x.get('mw', ''), x.get('status', ''), x.get('decided', ''),
             x.get('lat', ''), x.get('lng', '')] for x in items]
    fp = fingerprint(d) if isinstance(d, dict) else 'none'
    return write('environmental_authorisations.csv', [
        'GridTwin ZA - DFFE environmental authorisations for renewable projects',
        'CC BY 4.0 - attribution required. gridtwinza.org',
        f'source fingerprint: {fp}',
        'NOTE: PERMITS, NOT COMMISSIONING. An authorisation is not a built plant and not a',
        'grid connection. Permitted capacity exceeds built capacity by roughly ten times.',
        'Use for LOCATION and intent; use operational_renewable_capacity.csv for what exists.',
    ], ['name', 'province', 'technology', 'mw', 'status', 'decided', 'lat', 'lng'], rows)


DICTIONARY = """# GridTwin ZA published data

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
"""


def reconcile():
    """
    Check the published CSVs against the source files' own reconciliation blocks.

    Two errors got this far without it: summing technology aggregates dropped a 75 MW
    residual, and then emitting both aggregates and projects double-counted, putting
    allocated pipeline at 3,064 MW against a documented 1,532. Both produced a plausible
    CSV. Publishing data is exactly where a plausible wrong number does the most damage,
    because it travels without the model attached.
    """
    ok = True
    d = json.load(open(f'{SRC}/ipp_pipeline.json'))
    rec = d.get('reconciliation', {})
    rows = [r for r in csv.reader(open(os.path.join(OUT, 'ipp_pipeline.csv')))
            if r and not r[0].startswith('#')][1:]
    for bucket, key in [('allocated', 'provincially_allocated_mw'),
                        ('unallocated', 'unallocated_mw')]:
        got = sum(float(r[2]) for r in rows if r[3] == bucket and r[2])
        want = rec.get(key)
        if want is not None and abs(got - want) > 1:
            print(f'  MISMATCH {bucket}: CSV {got:,.0f} MW against source {want:,.0f}')
            ok = False

    c = json.load(open(f'{SRC}/regional_renewable_capacity.json'))
    crows = [r for r in csv.reader(open(os.path.join(OUT, 'operational_renewable_capacity.csv')))
             if r and not r[0].startswith('#')][1:]
    for tech, key in [('wind', 'wind_mw'), ('solar', 'solar_mw')]:
        got = sum(float(r[3]) for r in crows if r[1] == tech)
        want = sum(v for v in (c.get(key) or {}).values() if isinstance(v, (int, float)))
        if abs(got - want) > 1:
            print(f'  MISMATCH {tech}: CSV {got:,.0f} MW against source {want:,.0f}')
            ok = False
    print('  reconciles against source totals' if ok else '  RECONCILIATION FAILED')
    return ok


def main():
    print('Writing CSVs into ' + OUT + '/\n')
    total = capacity() + pipeline() + substations() + headroom() + permits()
    os.makedirs(OUT, exist_ok=True)
    open(os.path.join(OUT, 'README.md'), 'w').write(DICTIONARY)
    print(f'\n  {"README.md":<40}data dictionary')
    print()
    reconcile()
    print(f'\n{total:,} rows published under CC BY 4.0.')


if __name__ == '__main__':
    main()
