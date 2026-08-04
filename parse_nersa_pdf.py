"""
GridTwin ZA — NERSA quarterly PDF parser.

Reads a NERSA media statement PDF and extracts:
  - Quarter label and date
  - Table 1: technology breakdown (facilities, MW, province distribution)
  - Table 2: province breakdown (facilities, MW, investment cost)
  - Table 3: cumulative annual totals

Appends results to nodal/nersa_registrations.json.

USAGE:
  python3 parse_nersa_pdf.py <path_to_pdf>
  
  e.g. python3 parse_nersa_pdf.py ~/Downloads/MediaStatement-NERSA*.pdf

HOW TO UPDATE EACH QUARTER (~15 minutes):
  1. Download the latest NERSA media statement from nersa.org.za
     (Publications → Media Statements → search "registers generation facilities")
  2. Run: python3 parse_nersa_pdf.py ~/Downloads/MediaStatement-NERSA*.pdf
  3. Review the output and confirm the numbers look right
  4. Commit nodal/nersa_registrations.json to the repo
"""

import sys, json, re, os
import pdfplumber
from pathlib import Path

PROVINCE_MAP = {
    'Gauteng':       'Gauteng',
    'Western Cape':  'Western Cape',
    'Limpopo':       'Limpopo',
    'KwaZulu-Natal': 'Kwazulu Natal',
    'North West':    'North West',
    'Free State':    'Free State',
    'Eastern Cape':  'Eastern Cape',
    'Northern Cape': 'Northern Cape',
    'Mpumalanga':    'Mpumalanga',
}

ABBREV_MAP = {
    'GP': 'Gauteng',      'WC': 'Western Cape', 'LP': 'Limpopo',
    'KZN': 'Kwazulu Natal','NW': 'North West',  'FS': 'Free State',
    'EC': 'Eastern Cape', 'NC': 'Northern Cape', 'MP': 'Mpumalanga',
}

TECH_MAP = {
    'Solar PV': 'solar', 'Wind': 'wind',   'BESS': 'batt',
    'Biogas':  'biomass','Hydro': 'hydro', 'Gas':  'gas',
    'Coal':    'coal',   'CHP':  'cogen',  'Biomass': 'biomass',
}

def clean_num(s):
    if not s: return 0.0
    s = str(s).strip().replace('\xa0',' ').replace(' ','').replace(',','.')
    s = re.sub(r'[^\d.]', '', s)
    try: return float(s)
    except: return 0.0

def parse_abbrev_string(s):
    """Parse '66 – GP, 50 – WC, 15 – LP' into {region: count}"""
    out = {}
    for m in re.finditer(r'(\d+)\s*[-–]\s*([A-Z]+)', str(s)):
        n, abbr = int(m.group(1)), m.group(2)
        region = ABBREV_MAP.get(abbr)
        if region:
            out[region] = out.get(region, 0) + n
    return out

def parse_pdf(pdf_path):
    with pdfplumber.open(pdf_path) as pdf:
        full_text = '\n'.join(p.extract_text() or '' for p in pdf.pages)
        tables = []
        for p in pdf.pages:
            for t in p.extract_tables():
                if t and len(t) > 1:
                    tables.append(t)

    # Extract quarter and date from title
    quarter_match = re.search(
        r'((?:\d+(?:st|nd|rd|th)?|first|second|third|fourth)\s+quarter\s+of\s+the\s+(\d{4}/\d{2,4})\s+financial\s+year)',
        full_text, re.IGNORECASE)
    date_match = re.search(r'^(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})', full_text, re.MULTILINE)
    period_match = re.search(r'\((\w+)\s+to\s+(\w+)\s+(\d{4})\)', full_text)

    pub_date = date_match.group(1).strip() if date_match else 'Unknown'
    if period_match:
        period = f"{period_match.group(1)}–{period_match.group(2)} {period_match.group(3)}"
    else:
        period = pub_date
    # Use calendar year quarter from the period (e.g. July-Sep 2025 → Q3 2025)
    # Clearer than NERSA's April-March financial year format
    MONTH_TO_Q = {'january':'Q1','february':'Q1','march':'Q1','april':'Q2','may':'Q2',
        'june':'Q2','july':'Q3','august':'Q3','september':'Q3','october':'Q4',
        'november':'Q4','december':'Q4'}
    pm = re.search(r'(\w+)[–-]\w+\s+(\d{4})', period, re.IGNORECASE)
    if pm and pm.group(1).lower() in MONTH_TO_Q:
        quarter_label = f"{MONTH_TO_Q[pm.group(1).lower()]} {pm.group(2)}"
    elif quarter_match:
        quarter_label = re.sub(r'\s+', ' ', quarter_match.group(1).strip().title())
    else:
        quarter_label = pub_date
    if False:
        period = pub_date

    total_match = re.search(r'(\d[\d\s]+)\s*MW.*?R(\d[\d.,]+)\s*billion', full_text)
    total_mw = clean_num(total_match.group(1)) if total_match else 0
    total_invest = float(total_match.group(2).replace(',','.')) if total_match else 0

    # Find Table 1 (technology breakdown) — has 'Technology' header
    table1_raw = next((t for t in tables if t[0] and 'Technology' in str(t[0])), None)
    tech_rows = []
    if table1_raw:
        for row in table1_raw[1:]:
            tech_name = str(row[0] or '').strip()
            if not tech_name or tech_name.lower() == 'total':
                continue
            tech_key = TECH_MAP.get(tech_name, tech_name.lower().replace(' ','_'))
            # collect province string across all columns
            prov_str = ' '.join(str(c) for c in row[3:] if c)
            tech_rows.append({
                'tech': tech_key,
                'tech_label': tech_name,
                'facilities': int(clean_num(row[1])),
                'mw': clean_num(row[2]),
                'province_distribution': parse_abbrev_string(prov_str),
            })

    # Find Table 2 (province breakdown) — has 'Province' header
    table2_raw = next((t for t in tables if t[0] and 'Province' in str(t[0][0] if isinstance(t[0],list) else t[0])), None)
    province_rows = {}
    if table2_raw:
        for row in table2_raw[1:]:
            pname = str(row[0] or '').strip()
            if not pname or pname.lower() == 'total':
                continue
            region = PROVINCE_MAP.get(pname)
            if region:
                province_rows[region] = {
                    'facilities': int(clean_num(row[1])),
                    'mw': clean_num(row[2]),
                    'investment_rm': clean_num(row[3]),
                }

    # Find Table 3 (annual cumulative) — has 'Year' header
    table3_raw = next((t for t in tables if t[0] and 'Year' in str(t[0])), None)
    annual_totals = {}
    if table3_raw:
        for row in table3_raw[1:]:
            year = re.sub(r'\D', '', str(row[0] or ''))[:4]
            if len(year) == 4 and year.isdigit():
                annual_totals[year] = {
                    'facilities': int(clean_num(row[1])),
                    'mw': clean_num(row[2]),
                    'investment_rm': clean_num(row[3]),
                }

    return {
        'quarter_label': quarter_label,
        'period': period,
        'published': pub_date,
        'total_facilities': sum(r['facilities'] for r in tech_rows) or int(clean_num(re.search(r'registered (\d[\d ]+) generation', full_text, re.IGNORECASE).group(1))) if re.search(r'registered (\d[\d ]+) generation', full_text, re.IGNORECASE) else 0,
        'total_mw': total_mw or sum(r['mw'] for r in tech_rows),
        'total_investment_rbn': total_invest,
        'by_technology': tech_rows,
        'by_province': province_rows,
        'annual_cumulative': annual_totals,
        'source_file': Path(pdf_path).name,
    }

def main():
    if len(sys.argv) < 2:
        print('Usage: python3 parse_nersa_pdf.py <path_to_nersa_pdf>')
        sys.exit(1)

    pdf_path = sys.argv[1]
    if not os.path.exists(pdf_path):
        print(f'File not found: {pdf_path}')
        sys.exit(1)

    print(f'Parsing {Path(pdf_path).name}...')
    data = parse_pdf(pdf_path)

    print(f'\n  Quarter:     {data["quarter_label"]}')
    print(f'  Period:      {data["period"]}')
    print(f'  Published:   {data["published"]}')
    print(f'  Facilities:  {data["total_facilities"]}')
    print(f'  Capacity:    {data["total_mw"]} MW')
    print(f'  Investment:  R{data["total_investment_rbn"]} bn')
    print(f'\n  Technology breakdown:')
    for r in data['by_technology']:
        print(f'    {r["tech_label"]:<12} {r["mw"]:>8.1f} MW  ({r["facilities"]} facilities)')
    print(f'\n  Province breakdown (MW):')
    for region, v in sorted(data['by_province'].items(), key=lambda x: -x[1]['mw']):
        print(f'    {region:<18} {v["mw"]:>8.1f} MW  ({v["facilities"]} facilities)')

    # Load or create the cumulative JSON
    out_path = os.path.join(os.path.dirname(__file__), 'nodal/nersa_registrations.json')
    if os.path.exists(out_path):
        existing = json.load(open(out_path))
    else:
        existing = {'meta': {}, 'quarters': [], 'annual_cumulative': {}}

    existing['meta'] = {
        'description': 'NERSA quarterly generation facility registrations, parsed from NERSA media statements. '
                       'Covers all registered generation facilities (private/C&I/embedded, not just REIPPPP). '
                       'Province data maps to GridTwin ZA 9-region network (Hydra Central excluded — '
                       'NERSA uses standard 9 provinces). '
                       'Source: NERSA media statements at nersa.org.za. '
                       'Update: run parse_nersa_pdf.py with the latest quarterly PDF.',
        'last_updated': data['published'],
        'total_registered_since_2018_mw': data['annual_cumulative'].get('2025', {}).get('mw', 0)
            or sum(v.get('mw',0) for v in data['annual_cumulative'].values()),
    }

    # Add/replace this quarter (keyed by period)
    quarters = [q for q in existing.get('quarters', []) if q.get('period') != data['period']]
    quarters.append(data)
    quarters.sort(key=lambda q: q.get('published', ''))
    existing['quarters'] = quarters
    existing['annual_cumulative'] = data['annual_cumulative']  # always use latest

    json.dump(existing, open(out_path, 'w'), indent=2)
    print(f'\nWritten to {out_path}')
    print(f'Total quarters in file: {len(existing["quarters"])}')

if __name__ == '__main__':
    main()
