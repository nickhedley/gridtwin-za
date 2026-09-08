# GridTwin ZA - what lives where, and how to run it

Root-versus-nodal confusion has cost time twice: two different `build_capacity.py`
under the same name, and a split builder writing to a filename the generator does
not read. This file exists so that does not happen a third time.

---

## Repo root

```
index.html                  the app, ~14,250 lines, ~1 MB
profiles.json               Load-BEARING. National hourly demand + wind/solar/CSP
                            per-unit series, 8760h. index.html:11378 fetches it
                            from the root, not from nodal/, and falls back
                            Silently to synthetic profiles if absent.
build_capacity.py           THE generator. Lives in nodal/ historically but runs
                            From THE root and reads nodal/... relative to cwd.
                            421 lines. Has step 1b (the supply-area split) and
                            the eskom bucket.
build_hydra_split.py        Builds the supply-area split draft. Same file as
build_supply_area_split.py  build_supply_area_split.py - identical MD5, two names.
```

The sixteen harnesses also sit at the root.

```
control_inventory.json      Baseline for validate_structure. 63 controls. Losing a
                            control fails loudly; adding one is a deliberate act that
                            needs --write-baseline. Commit this FILE.
response_matrix.json        Baseline for validate_response. Every control's measured
                            effect on eight outputs. Commit this FILE.
```

Both were unpinned until 28 Aug 2026, which meant those two harnesses compared against
nothing and could not fail. Re-pin only when a change is intended, never to clear a
failure.

## nodal/

Twenty files fetched by `index.html`, plus harness-only inputs.

```
nodal_engine.js             defines IMPORTS_CF, CARRIER_NM, FIRM_TECHS and more.
                            Four harnesses die with "IMPORTS_CF is not defined"
                            without it.
nodal_dispatch.js
capacity_siting.js
ipp_pipeline.json           generated
regional_renewable_capacity.json   generated
supply_area_split_draft.json       Read BY build_capacity.py
provincial_mix.json         headroom_summary.json      corridor_electrical.json
profiles_regional.json      profiles_regional_multiyear.json
substations_compact.json    substation_bands.json      nersa_registrations.json
reea_projects.json          rooftop_mw_by_region.json  tdp_projects.json
bq_queue.json               redz.json                  transmission_lines.geojson
demand_2025_regional.csv    fleet_by_region_v2.csv
pfl_cod_h1_2026.json        pfl_private_h1_2026.json
regional_renewable_capacity.json
sa_solar_grid.json          ORPHAN. Real PVGIS SARAH2 data, 739 points, nothing
                            fetches it. Do not delete. See STATE open items.
```

Harness-only, not fetched by the page: `regional_renewable_capacity.json` is read
directly by `validate_capacity.js`.

### known inconsistency, unresolved

`build_hydra_split.py` writes to `nodal/hydra_central_split_draft.json`.
`build_capacity.py` reads `nodal/supply_area_split_draft.json`.
The file on disk carries the second name. Re-running the split builder today
would create a second file under the old name and the generator would keep
reading the stale one. Reconcile before regenerating the split.

### delete this

`nodal/build_capacity.py` - a 324-line copy with no step 1b and no eskom bucket.
Running it destroys the Hydra Central split (669 MW wind, 459.5 MW solar reverting
to zero), drops 22 fields, and updates its own fingerprint so the damage looks
consistent. The correct script is at the root.

---

## Running the suite - there is no single working directory

Ten harnesses take the root as `argv[2]` and default to `.`. Two default to
`testroot`. Three ignore the argument entirely.

From the directory holding `index.html` and `nodal/`:

```
node ../validate_lint.js .
node ../validate_structure.js .
node ../validate_invariants.js .
node ../validate_consistency.js .
node ../validate_response.js .
node ../validate_benchmarks.js .
node ../validate_external.js .
node ../validate_solve.js .
node ../validate_capacity.js .
node ../validate_lp.js .
node ../validate_weather.js .
node ../stress_suite.js              # ignores argv, uses cwd
python3 ../audit.py index.html
```

From the parent of that directory:

```
node validate_outputs.js testroot    # hardcodes path.resolve('testroot')
node eng5.js                         # hardcodes testroot/index.html
node jsdom_local2.js                 # hardcodes testroot/index.html
```

`jsdom_local2.js` exits 0 regardless of what it finds. Read its output, do not
check its exit code. Two `ctx.createPattern` errors at index.html:7210 are jsdom
lacking canvas, not a regression.

Node dependencies: `jsdom`, `highs`. `npx eslint` for validate_lint.

---

## Deployment - Cloudflare Pages, NOT GitHub Pages

`gridtwinza.org` is served by a **Cloudflare Pages** project called `gridtwin-za`, which
builds from `main` and runs `npx wrangler deploy`. GitHub Pages also builds this repo and is
correct, but nothing serves from it. Checking GitHub Pages tells you nothing about the live
site.

```
curl -s https://gridtwinza.org/ | grep -o "BUILD_STAMP = '[^']*'"
```

That is the only reliable check. The browser, incognito or not, can show a stale page for
reasons unrelated to the deploy.

### the 25 MiB limit will break your deploy silently

Cloudflare Workers rejects any single asset over 25 MiB. When that happens **the build fails
and the previous deployment keeps serving**, so the site looks fine and simply stops
updating. On 8 Sep 2026 this went unnoticed for two days: `ninja_multiyear_cache.json` at
67 MB failed every build from 6 Sep onward while the site served the last good artifact.

**Every fetch script writes a cache file, and none belong in the repo.** They are raw API
responses, rebuildable, and large:

```
ninja_site_cache.json          single-year Renewables.ninja
ninja_multiyear_cache.json     ten-year wind, 67 MB
pvgis_solar_cache.json         PVGIS solar
```

All are in `.gitignore`. **Any new fetch script must add its cache file there in the same
commit**, not after it breaks something.

To check before pushing:

```
git ls-files -z | xargs -0 ls -l | awk '$5 > 20000000 {printf "%6.1f MB  %s\n", $5/1048576, $9}'
```

### diagnosing a site that will not update

In this order, because each step rules out the one before it:

1. `curl` the live site for the build stamp - not the browser
2. `curl -sI` and read `server:` - `cloudflare` means Pages is the origin, not GitHub
3. Workers & Pages -> gridtwin-za -> Deployments - look for "Latest build failed"
4. Only then consider caching

**On 8 Sep the whole sequence was run backwards**: a `cf-cache-status: HIT` was read as a
cache problem, a cache rule was built and the cache purged twice, and none of it could have
worked because a build had failed. The signal that should have stopped it was the purge
changing nothing.

## Per-session upload set

Project knowledge is injected as text and never reaches the filesystem, so
nothing runnable can live there. Upload each session:

```
index.html
profiles.json
a zip of nodal/            directories do not survive upload individually
the sixteen harnesses
build_capacity.py
```

Then run the full suite before any change. That baseline run is what caught the
two stale rollups on 27 Aug.

---

*GridTwin ZA. Code and documentation © 2026 Nick Hedley, released under CC BY-NC-ND 4.0.
DATA FILES in nodal/ are CC BY 4.0 — attribution only. Changed 6 Sep 2026: they are a
compilation of uncopyrightable facts, and NC-ND blocked both reuse and the ingestion of
BY-SA sources.*
Data files carry their own terms — see sources.md. Model outputs are reproducible from
the scenarios stated; nothing here is a tariff, a forecast, or investment advice.*
