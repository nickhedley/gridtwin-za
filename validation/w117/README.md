# Wind diagnostics on c5b_14r (message 117, 15 Oct 2026)

Read-only. `pathcheck_w117.patch` turns a copy of harness/pathcheck.js at commit 6045387 (build 2026-10-14r) into
pathcheck_sn.js, which adds three capture modes (SN_SCAN, SN_WEEKS, as in validation/single_node, and SN_W117 here). SN_W117
writes, per year, each weather year's curtailment and new-wind and new-solar capacity factors on c5b_14r's build (draw 0), the
default profile's and the optimiser's 12 calendar days' capacity factors, and the optimiser's cost terms per kW read from the app.

```
cp harness/pathcheck.js harness/pathcheck_sn.js; patch harness/pathcheck_sn.js < validation/w117/pathcheck_w117.patch
cd harness; YEARS=2030,2035,2040 SN_W117=w117.jsonl IN=out/pathway_c5b_14r.json GRID=1 node pathcheck_sn.js
python3 ../validation/w117/build.py out          # (1), from the two pathway files
python3 ../validation/w117/tables117.py w117.jsonl w117_2030.jsonl w117_windlow.jsonl <IRP 2025 assumptions workbook>
```

w117_windlow.jsonl: the same with IN=out/pathway_s_windlow_c5b14r.json WIND_CASE=low. The IRP 2025 workbook ('Additional Data
Assumptions') was supplied by the user and is not in the repository. Results: RESULTS 'Wind diagnostics on c5b_14r'.
