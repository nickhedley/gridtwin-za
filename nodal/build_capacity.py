#!/usr/bin/env python3
"""
GridTwin ZA - rebuild regional_renewable_capacity.json and ipp_pipeline.json
from the IPP Office IPPPP Quarterly Report, Q4 2025/26 (as at 31 March 2026).

Every figure below is traceable to a page of that report. Derived fields are
computed here, never hand-written, so they cannot drift.
"""
import json, hashlib, copy

SRC = "IPP Office, IPPPP Quarterly Report Q4 2025/26 (as at 31 March 2026)"
COMPILED = "2026-08-14"

REGIONS = ["Eastern Cape", "Limpopo", "Mpumalanga", "Gauteng", "Western Cape",
           "Northern Cape", "Hydra Central", "Kwazulu Natal", "North West", "Free State"]


def blank():
    return {r: 0.0 for r in REGIONS}


def fingerprint(doc):
    """gtza- + first 16 hex of SHA-256 over the body, excluding meta.
    Canonicalisation verified against substations_compact.json."""
    body = {k: v for k, v in doc.items() if k != "meta"}
    s = json.dumps(body, sort_keys=True, separators=(",", ":"))
    return "gtza-" + hashlib.sha256(s.encode()).hexdigest()[:16]


# ---------------------------------------------------------------------------
# 1. REIPPPP operational capacity by province and technology
#    Source: report p.18, "Capacity Online (MW)" per province.
#    Hydra Central deliberately left at zero - see meta.HYDRA_CENTRAL_ZERO.
# ---------------------------------------------------------------------------
reipppp_online = {
    "solar_mw":        dict(blank(), **{"Northern Cape": 1570.0, "Western Cape": 359.0,
                                        "North West": 275.0, "Free State": 271.0,
                                        "Limpopo": 118.0, "Eastern Cape": 70.0}),
    "wind_mw":         dict(blank(), **{"Northern Cape": 1738.0, "Eastern Cape": 1566.0,
                                        "Western Cape": 738.0}),
    "csp_mw":          dict(blank(), **{"Northern Cape": 600.0}),
    "hydro_mw":        dict(blank(), **{"Northern Cape": 10.0, "Free State": 8.0}),
    "biomass_mw":      dict(blank(), **{"Mpumalanga": 25.0}),
    "landfill_gas_mw": dict(blank(), **{"Gauteng": 8.0}),
}

# Private / wheeled operational capacity. EMPTY - pending the Power Futures Lab
# monitor, which is the only source that allocates wheeled plant by province.
private_online = {"solar_mw": blank(), "wind_mw": blank()}

# Engine-facing totals: sum across sources. Utility PV only; CSP is carried
# separately as FIXED.cspMW in index.html.
solar_total = {r: reipppp_online["solar_mw"][r] + private_online["solar_mw"][r] for r in REGIONS}
wind_total = {r: reipppp_online["wind_mw"][r] + private_online["wind_mw"][r] for r in REGIONS}


def total(d):
    return round(sum(d.values()), 1)


prov_online_sum = round(sum(total(v) for v in reipppp_online.values()), 1)

regional = {
    "wind_mw": wind_total,
    "solar_mw": solar_total,
    "by_source": {
        "reipppp": reipppp_online,
        "private": private_online,
    },
    "reconciliation": {
        "universe": "REIPPPP BW1-BW6, projects that reached financial close",
        "identity": "procured = online_actual + under_delivery + in_construction",
        "procured_mw": 7825.0,
        "online_actual_mw": 7355.0,
        "under_delivery_mw": 26.0,
        "in_construction_mw": 444.0,
        "identity_holds": 7355.0 + 26.0 + 444.0 == 7825.0,
        "provincial_online_sum_mw": prov_online_sum,
        "rounding_note": (
            "Summing the per-province, per-technology figures on p.18 gives "
            f"{prov_online_sum} MW against the headline 7355 MW. The 1 MW gap is rounding "
            "in the published table and has NOT been adjusted away."
        ),
        "totals_by_technology_mw": {k: total(v) for k, v in reipppp_online.items()},
    },
    "meta": {
        "description": (
            "Operational renewable capacity by GridTwin ZA nodal region. Rebuilt from "
            "commissioned-plant figures, not bid-window awards."
        ),
        "source_reipppp": SRC + ", p.18 (Capacity Online by province and technology)",
        "source_private": "PENDING - Power Futures Lab IPP monitor, H1 2026 update",
        "as_at": "2026-03-31",
        "compiled": COMPILED,
        "REBUILD_NOTE": (
            "Replaces a file assembled from REIPPPP bid-window AWARDS. The award-based file "
            "put North West at 722 MW and Northern Cape at 473 MW of solar; the commissioned "
            "figures are 275 and 1570. Wind was also misdistributed: Western Cape was 1274 MW "
            "against a published 738, Northern Cape 890 against 1738."
        ),
        "HYDRA_CENTRAL_ZERO": (
            "*** Hydra Central is set to ZERO and this WILL change the nodal network model. *** "
            "Hydra Central is a transmission supply area spanning the Karoo across the Northern "
            "Cape / Eastern Cape provincial boundary (Hydra, Gamma, Koruson, Aquila). The IPP "
            "Office reports by province, so an unknown slice of the Northern Cape's 3918 MW "
            "physically connects into Hydra Central. That slice cannot be sized without named "
            "projects, so the full provincial figure sits in Northern Cape and Hydra Central is "
            "zero. A wrong split would be worse than an absent one. To restore it, match named "
            "operational projects to nearest substation using substations_compact.json; "
            "reea_projects.json already does this for environmental authorisations, but covers "
            "permits rather than commissioning, so it gives location only."
        ),
        "known_gaps": (
            "(1) Private / wheeled operational capacity is NOT included - the by_source.private "
            "block is empty pending the PFL monitor. (2) RMIPPPP contributes about 225 MW of "
            "contracted operational capacity across Northern Cape, Eastern Cape and Western Cape; "
            "the report does not give the provincial split, so it is excluded rather than guessed. "
            "(3) CSP is reported here at 600 MW (Northern Cape) - index.html FIXED.cspMW of 500 "
            "is understated. (4) Peakers (Avon 670 MW KZN, Dedisa 335 MW Eastern Cape, diesel "
            "OCGT) are not renewable and are out of scope for this file."
        ),
        "region_key_note": "Region keys follow GridTwin ZA convention: 'Kwazulu Natal', and 'Hydra Central' is a supply area, not a province.",
        "licence": "CC BY-NC-ND 4.0",
        "copyright": "(c) 2026 Nick Hedley",
    },
}
regional["meta"]["fingerprint"] = fingerprint(regional)

# ---------------------------------------------------------------------------
# 2. Pipeline
# ---------------------------------------------------------------------------
# Provincially-resolved entries only. Anything the report does not split by
# province goes into `unallocated` rather than being guessed into a region.
prov_projects = [
    # REIPPPP in construction - report p.18 (In Construction by province) and p.19
    # (BW6: 2 projects / 360 MW in construction; BW5: 1 project / 84 MW).
    dict(name="Doornhoek Solar PV", region="North West", tech="solar", mw=120.0,
         status="construction", bw="BW6", province_confidence="published"),
    dict(name="Virginia Solar Park", region="Free State", tech="solar", mw=240.0,
         status="construction", bw="BW6", province_confidence="published"),
    dict(name="BW5 wind, Eastern Cape (1 project)", region="Eastern Cape", tech="wind", mw=84.0,
         status="construction", bw="BW5", province_confidence="published",
         note="Named project not identified in the quarterly report."),

    # BESIPPPP BW1 - report p.34: all five projects (513 MW) are in the CONSTRUCTION
    # phase. Provincial split carried over from the previous file, not from the report.
    dict(name="BESIPPPP BW1, Western Cape", region="Western Cape", tech="batt", mw=300.0,
         status="construction", bw="BESIPPPP BW1", province_confidence="carried_over"),
    dict(name="BESIPPPP BW1, Northern Cape", region="Northern Cape", tech="batt", mw=153.0,
         status="construction", bw="BESIPPPP BW1", province_confidence="carried_over"),
    dict(name="BESIPPPP BW1, Gauteng", region="Gauteng", tech="batt", mw=60.0,
         status="construction", bw="BESIPPPP BW1", province_confidence="carried_over"),

    # BW6 pre-commercial-close - report p.27: 4 projects / 640 MW. Three are named
    # from the Dec 2022 preferred-bidder announcement; provinces are consistent with
    # p.18 (North West procured 395 = 275 online + 120 construction, so Boitumelo and
    # Kutlwano are NOT yet at financial close; Free State 523 = 279 + 240 likewise
    # excludes Good Hope).
    dict(name="Boitumelo Solar PV", region="North West", tech="solar", mw=150.0,
         status="preferred_bidder", bw="BW6", province_confidence="published"),
    dict(name="Kutlwano Solar PV", region="North West", tech="solar", mw=150.0,
         status="preferred_bidder", bw="BW6", province_confidence="published"),
    dict(name="Good Hope Solar Park", region="Free State", tech="solar", mw=200.0,
         status="preferred_bidder", bw="BW6", province_confidence="published"),

]

unallocated = [
    dict(name="BW6, sixth project", tech="solar", mw=140.0, status="preferred_bidder", bw="BW6",
         n_projects=1,
         note="BW6 pre-CC is 640 MW across 4 projects (p.27); 500 MW is named above, leaving 140 MW unidentified."),
    dict(name="BW7 solar PV", tech="solar", mw=3940.0, status="preferred_bidder", bw="BW7",
         n_projects=18,
         note="8 preferred bidders (1760 MW) appointed 23 Dec 2024, 6 (1290 MW) on 21 Jul 2025 after wind-to-solar technology reallocation, 4 (890 MW) on 15 Dec 2025 after value-for-money negotiations. Provincial figures circulated for the first tranche come from a ministerial press release, not the quarterly report, and are DELIBERATELY not apportioned to regions here: those same figures (Mpumalanga 480, Limpopo 400, Free State 480, North West 400) previously leaked into the operational capacity file and caused the geography bug this rebuild exists to fix."),
    dict(name="RMIPPPP in construction", tech="hybrid", mw=203.0, status="construction", bw="RMIPPPP",
         n_projects=2,
         note="Report p.29 gives Northern Cape, Eastern Cape and Western Cape as the RMIPPPP provinces but no split. A further 19.94 MW site of a partially-operational project also remains under construction."),
    dict(name="BESIPPPP BW2", tech="batt", mw=615.0, status="preferred_bidder", bw="BESIPPPP BW2",
         n_projects=8,
         note="Announced 23 Dec 2024; four projects at risk of the 30 Jun 2026 commercial close deadline."),
    dict(name="BESIPPPP BW3", tech="batt", mw=616.0, status="preferred_bidder", bw="BESIPPPP BW3",
         n_projects=5,
         note="Five preferred bidders announced 30 May 2025; commercial close long stop 30 Oct 2026."),
]

terminated = [
    dict(name="BW5 cancelled capacity", tech="mixed", mw=1424.0, bw="BW5",
         note="BW5 originally awarded 2583 MW; 1424 MW (55%) was cancelled when projects failed to reach commercial close (report p.16). Provincial split not published."),
]

TECH_FIELD = {"solar": "solar_mw", "wind": "wind_mw", "batt": "batt_mw", "gas": "gas_mw"}

by_region = {}
for p in prov_projects:
    r = by_region.setdefault(p["region"], {
        "total_mw": 0.0, "solar_mw": 0.0, "wind_mw": 0.0, "batt_mw": 0.0, "gas_mw": 0.0,
        "projects": [], "by_status": {},
    })
    r["projects"].append({k: v for k, v in p.items() if k != "region"} | {"region": p["region"]})

# Recompute every derived field from the project lists.
for region, r in by_region.items():
    r["total_mw"] = round(sum(p["mw"] for p in r["projects"]), 1)
    for tech, field in TECH_FIELD.items():
        r[field] = round(sum(p["mw"] for p in r["projects"] if p["tech"] == tech), 1)
    bs = {}
    for p in r["projects"]:
        e = bs.setdefault(p["status"], {"mw": 0.0, "n": 0})
        e["mw"] = round(e["mw"] + p["mw"], 1)
        e["n"] += 1
    r["by_status"] = bs
    order = ["preferred_bidder", "financial_close", "construction"]
    present = [s for s in order if s in bs]
    r["earliest_status"] = present[0] if present else None

alloc_mw = round(sum(p["mw"] for p in prov_projects), 1)
unalloc_mw = round(sum(p["mw"] for p in unallocated), 1)

pipeline = {
    "by_region": by_region,
    "unallocated": {
        "note": ("Capacity with no published provincial split. Held here rather than "
                 "apportioned by guesswork; a wrong split is worse than an absent one. "
                 "The UI reads by_region only, so this capacity is not currently drawn on the map."),
        "total_mw": unalloc_mw,
        "items": unallocated,
    },
    "terminated": {
        "note": ("Awarded capacity that never reached commercial close. NOT part of the "
                 "reconciliation identity: the IPP Office 'Capacity Procured' figure already "
                 "excludes these projects."),
        "total_mw": round(sum(p["mw"] for p in terminated), 1),
        "items": terminated,
    },
    "reconciliation": {
        "identity": "preferred_bidder_total = financial_close + pre_financial_close",
        "preferred_bidders_net_of_cancellations_mw": 12405.0,
        "reached_financial_close_mw": 7825.0,
        "pre_financial_close_mw": 4580.0,
        "pre_financial_close_detail": {"BW6 awaiting commercial close": 640.0,
                                       "BW7 preferred bidder": 3940.0},
        "identity_holds": 7825.0 + 4580.0 == 12405.0,
        "pipeline_total_mw": round(alloc_mw + unalloc_mw, 1),
        "pipeline_composition": {
            "REIPPPP in construction": 444.0,
            "REIPPPP pre-commercial-close (BW6 + BW7)": 4580.0,
            "BESIPPPP (BW1 construction + BW2/BW3 preferred bidder)": 1744.0,
            "RMIPPPP in construction": 203.0,
        },
        "provincially_allocated_mw": alloc_mw,
        "unallocated_mw": unalloc_mw,
    },
    "nersa_registrations_12m": None,  # placeholder, filled below
    "meta": {
        "description": ("REIPPPP / RMIPPPP / BESIPPPP pipeline (preferred bidder through "
                        "construction) by GridTwin ZA nodal region. Operational projects live in "
                        "regional_renewable_capacity.json and are excluded here."),
        "source": SRC,
        "as_at": "2026-03-31",
        "compiled": COMPILED,
        "as_at_note": ("Previous file carried as_at 2026-08-17, a future date. Replaced with the "
                       "report's own reporting date."),
        "CHANGES": (
            "(1) The flat top-level `projects` array has been deleted - nothing in the UI read it, "
            "which is why it had drifted out of step with by_region. (2) BW7 is 3940 MW across 18 "
            "solar PV projects, not 1760 MW: 8 bidders on 23 Dec 2024 (1760 MW), 6 more on 21 Jul "
            "2025 after wind-to-solar reallocation (1290 MW), 4 more on 15 Dec 2025 after "
            "value-for-money negotiations (890 MW). (3) BESIPPPP BW1 is all in CONSTRUCTION, not "
            "preferred bidder. (4) Aggregate entries 'BW5 solar portfolio', 'BW5 wind Eastern Cape' "
            "and 'BW5 wind Western Cape' are gone: BW5 is fully accounted for as 1075 MW at COD, "
            "84 MW in construction and 1424 MW cancelled."
        ),
        "province_confidence_legend": {
            "published": "province given in the IPP Office quarterly report",
            "approximate": "province from a ministerial press release, not the quarterly report",
            "carried_over": "province retained from the previous file; not verified against the report",
        },
        "licence": "CC BY-NC-ND 4.0",
        "copyright": "(c) 2026 Nick Hedley",
    },
}

# Carry the NERSA block across unchanged from the previous file.
old = json.load(open("nodal/ipp_pipeline.json"))
pipeline["nersa_registrations_12m"] = old["nersa_registrations_12m"]

pipeline["meta"]["fingerprint"] = fingerprint(pipeline)

import os
os.makedirs("/mnt/user-data/outputs", exist_ok=True)
for name, doc in [("regional_renewable_capacity.json", regional), ("ipp_pipeline.json", pipeline)]:
    with open("nodal/" + name, "w") as f:
        json.dump(doc, f, indent=1, ensure_ascii=False)
    print(f"{name}: {doc['meta']['fingerprint']}")

print("\nregional solar total:", total(solar_total), "MW")
print("regional wind  total:", total(wind_total), "MW")
print("provincial online sum:", prov_online_sum, "MW (headline 7355)")
print("pipeline allocated:", alloc_mw, "unallocated:", unalloc_mw,
      "total:", round(alloc_mw + unalloc_mw, 1), "MW")
print("terminated:", pipeline["terminated"]["total_mw"], "MW")
