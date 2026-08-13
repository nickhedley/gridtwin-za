# GridTwin ZA — Provenance and IP record

Copyright © 2026 Nick Hedley. All rights reserved.
Licensed under [CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/).

This document records what in GridTwin ZA is **original work** as distinct from
public data, and provides content fingerprints that can demonstrate copying.
Its purpose is evidentiary: if a third party ships a substantially similar
product, this establishes what existed here first and how it was built.

---

## 1. What is original

The underlying facts — Eskom generation data, NTCSA network files, GCCA
headroom, MERRA-2 weather — are public and remain under their own licences.
None of that is claimed. What is original is the **compilation, correction,
calibration and modelling built on top of it**:

### Assembled datasets

| Dataset | Original contribution |
|---|---|
| `substations_compact.json` | 185 substations reconciled across five independent sources (NTCSA shapefile, OpenStreetMap, Eskom published GPS, DBSA RFP 008 register, manual Plus Codes). Includes corrections not present in any single source — Watershed was 435 km out in the shapefile; Kronos and Helios 225 km; Droeriver/Droerivier was a duplicate; Mookodi and Lomond had wrong regions. Rabbit's position is derived from where its own two 275 kV circuits terminate, agreeing to within 23 m, because it appears in no public substation register. |
| `tdp_projects.json` | 221 planned transmission projects extracted from the NTCSA Transmission Development Plan 2024 (a 180-page PDF with no machine-readable release), geolocated against the substation set, deduplicated across two source documents, and classified by delivery phase. Nine substations that do not yet exist are sited from the TDP's own descriptions. |
| `profiles_regional_multiyear.json` | Ten weather years at capacity-weighted REIPPPP plant coordinates, configured to match the single-year regional profiles exactly so the two are comparable. The coordinate set is itself derived work. |
| `headroom_summary.json` | GCCA connection headroom reconciled to regions used throughout the model. |

### Model

- Chronological merit-order dispatch with unit commitment at **individual unit
  level** (85 units across 31 station groups), respecting minimum stable level,
  minimum up/down times and ramp limits.
- Block-commitment heuristic calibrated against a HiGHS MIP optimiser, with the
  calibration record retained in source comments (8h vs 4h blocks, the corrected
  reasoning, the rejected variable-block approach).
- Capacity-expansion linear programmes, national and regional, including
  per-region GCCA headroom constraints, real corridor transfer limits, and a
  per-region annual build cap.
- Cost assumptions, capacity factors, emissions factors and the fleet parameter
  set, calibrated to Eskom weekly system status reports.

### Presentation

Interface design, visual language, panel structure and explanatory copy.

---

## 2. Content fingerprints

Each published dataset carries a `meta.fingerprint` field: a SHA-256 digest over
the file's own content, prefixed `gtza-`. These are **not** deliberate errors —
the data is correct as published. They are checksums of a specific compilation.

| File | Fingerprint | Compiled |
|---|---|---|
| `tdp_projects.json` | `gtza-1fe160f81a4d6052` | 2026-08-13 |
| `substations_compact.json` | `gtza-1716f8223103ed82` | 2026-08-13 |
| `headroom_summary.json` | `gtza-93f0182456516e03` | 2026-08-13 |
| `profiles_regional_multiyear.json` | `gtza-48046d7c4ac04853` | 2026-08-13 |

A dataset independently assembled from the same public sources would not
reproduce these digests, because it would not reproduce this compilation's exact
corrections, deduplication choices, naming, ordering and derived fields. If a
third party's data yields a matching digest — or contains the specific
corrections listed in section 1 — that is evidence of copying rather than
independent work.

Regenerate a file's digest with:

```bash
python3 -c "
import json,hashlib
d=json.load(open('nodal/tdp_projects.json'))
body=json.dumps({k:v for k,v in d.items() if k!='meta'},sort_keys=True,separators=(',',':'))
print('gtza-'+hashlib.sha256(body.encode()).hexdigest()[:16])
"
```

---

## 3. Distinctive markers

Beyond the digests, these characteristics would be difficult to arrive at
independently and are useful in establishing provenance:

- **Rabbit substation** at −28.68070, 32.13515, sourced `line-geom`. It is in no
  public substation register; the position is inferred from line geometry.
- **Droerivier** retained and **Droeriver** removed as a misspelling — the two
  appeared 400 m apart in source data.
- **Mookodi** assigned to North West, not Northern Cape as some sources record.
- The nine planned-but-unbuilt substations (Coega, Hlaziya, Zanokhanyo, Quattro,
  Bokkom, Umtu, Iphiva, Isundu, Mbewu) with coordinates approximated from TDP
  text descriptions.
- The `src` provenance field on every substation, recording which of six sources
  established its position.

---

## 4. Permitted and prohibited use

**Permitted:** viewing, sharing, linking, citing with attribution; academic and
journalistic reference.

**Prohibited without a commercial licence:** commercial use in whole or part;
distribution of modified or derivative versions; incorporation of the model, its
code, its calibration or its datasets into another product or service.

Commercial licensing enquiries: https://github.com/nickhedley/gridtwin-za

---

*Record compiled 13 August 2026. Update the fingerprint table whenever a dataset
is regenerated, or the digests will no longer match the published files.*
