#!/usr/bin/env python3
"""fetch_ember.py - South Africa's rows from Ember's public bulk data files, for validate_benchmarks.

Ember, Electricity Data Explorer bulk downloads (monthly and yearly, long format), CC BY 4.0: attribute Ember.
https://ember-energy.org/data/ ; files at storage.googleapis.com/emb-prod-bkt-publicdata/public-downloads/.
The Ember API is not used (user, 12 Oct 2026: the key could not be injected here).

Writes public_data/ember_za.json: each file's URL, release date (the file's Last-Modified header), SHA-256 and
fetch date, and the South Africa rows of the categories the benchmarks use. Re-run to take a new Ember release;
validate_benchmarks.js reads the release date from the file and prints it.

usage: python3 fetch_ember.py
"""
import csv, hashlib, io, json, os, sys, urllib.request, datetime as dt
from email.utils import parsedate_to_datetime

BASE = 'https://storage.googleapis.com/emb-prod-bkt-publicdata/public-downloads/'
FILES = {'monthly': 'monthly_full_release_long_format.csv', 'yearly': 'yearly_full_release_long_format.csv'}
KEEP = {'Electricity generation', 'Power sector emissions', 'Electricity demand', 'Electricity imports', 'Capacity'}
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'public_data', 'ember_za.json')

out = {'meta': {
    'source': 'Ember, Electricity Data Explorer, bulk data files (monthly and yearly, long format)',
    'licence': 'CC BY 4.0 - https://creativecommons.org/licenses/by/4.0/ ; attribution: Ember',
    'area': 'South Africa', 'fetched': dt.date.today().isoformat(), 'built_by': 'fetch_ember.py', 'files': {}},
    'monthly': [], 'yearly': []}
for kind, name in FILES.items():
    url = BASE + name
    with urllib.request.urlopen(url, timeout=600) as r:
        released = parsedate_to_datetime(r.headers['Last-Modified']).date().isoformat()
        raw = r.read()
    text = raw.decode('utf-8-sig')
    rd = csv.reader(io.StringIO(text)); head = next(rd)
    ix = {h: i for i, h in enumerate(head)}
    tcol = 'Date' if kind == 'monthly' else 'Year'
    for row in rd:
        if row[ix['Area']] != 'South Africa' or row[ix['Category']] not in KEEP or row[ix['Value']] == '': continue
        out[kind].append([row[ix[tcol]], row[ix['Category']], row[ix['Subcategory']], row[ix['Variable']],
                          row[ix['Unit']], float(row[ix['Value']])])
    if not out[kind]: sys.exit('no South Africa rows in ' + url)
    out['meta']['files'][kind] = {'url': url, 'released': released, 'sha256': hashlib.sha256(raw).hexdigest(),
                                  'rows': len(out[kind]), 'columns': [tcol, 'Category', 'Subcategory', 'Variable', 'Unit', 'Value']}
json.dump(out, open(OUT, 'w'), separators=(',', ':'))
print('wrote', OUT, {k: (v['released'], v['rows']) for k, v in out['meta']['files'].items()})
