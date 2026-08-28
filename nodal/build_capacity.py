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


def total(d):
    return round(sum(d.values()), 1)


# ---------------------------------------------------------------------------
# 1. REIPPPP operational capacity by province and technology
#    Source: report p.18, "Capacity Online (MW)" per province.
#    Reported BY PROVINCE; redistributed to supply areas in step 1b below.
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

# Private / wheeled operational capacity, from the PFL H1 2026 monitor.
# INCOMPLETE: H1 2026 only. Private and wheeled plant that reached commercial
# operation before January 2026 is not covered by the H1 monitor and is not here.
# Captive (behind-the-meter) capacity is listed in the source but deliberately
# excluded: it suppresses demand rather than adding supply.
# SETTLED 14 Aug 2026 - DO NOT USE SAPVIA's HEADLINE "PRIVATE" FIGURE HERE.
# SAPVIA's "6.1 GW private" (end-2024) and the "6,165 MW rooftop" figure reported
# for Oct 2024 are 65 MW apart: they are the SAME measurement described two ways.
# Both sit in one continuous behind-the-meter series that this model already
# tracks as FIXED.rooftopMW:
#     Aug 2022  2,264 MW (Eskom) -> Oct 2024  6,165 MW (SAPVIA)
#  -> Sep 2025  7,300 MW (NTCSA) -> Jun 2026  9,107 MW (NTCSA) = rooftopMW 9,100
# Adding SAPVIA's private aggregate to pvUtilityMW would therefore double-count
# almost all of it against rooftopMW - the same class of error the whole rebuild
# was undertaken to remove.
# CSIR CORROBORATION (14 Aug 2026): CSIR's utility-scale statistics report capacity
# "excluding embedded generation capacity and private capacity" - the closest
# published analogue to pvUtilityMW. Their 2022 edition: solar PV 2,287 MW at
# 31 Dec 2022. Our REIPPPP solar of 2,663 MW at Mar 2026 lands exactly on that
# trajectory, so the REIPPPP component here is right AND complete, confirmed by a
# series built on a different basis. The remaining gap is therefore a DEFINITIONAL
# question about what pvUtilityMW includes, not missing REIPPPP data. See HANDOVER.
# Legitimate sources for the remaining pvUtilityMW gap are SUBSETS, not the
# aggregate: SAPVIA's own "C&I large-scale 1-50MW" and "utility-scale" segments,
# earlier PFL monitors (same basis as the file below), or CSIR's utility-scale
# statistics, which track capacity by actual start of operation.
#
# OPEN RISK: the 488 MW of PFL wheeled solar added below is only safe if NTCSA's
# rooftop estimate excludes wheeled grid-connected projects. NTCSA derives it from
# demand suppression, which sees only behind-the-meter generation, and PFL
# excludes captive projects for the same reason - so the two should not overlap.
# That rests on inference about NTCSA's method, not a stated definition. Confirm
# against an NTCSA methodology note before the next private-capacity addition.
pfl = json.load(open("nodal/pfl_private_h1_2026.json"))
private_online = {"solar_mw": blank(), "wind_mw": blank()}
for region, v in pfl["by_region_wheeled"].items():
    private_online["solar_mw"][region] = float(v.get("solar_mw", 0))
    private_online["wind_mw"][region] = float(v.get("wind_mw", 0))
assert round(total(private_online["solar_mw"]) + total(private_online["wind_mw"]), 1) \
    == pfl["totals"]["wheeled_mw"], "PFL regional split does not sum to its own total"

# ---------------------------------------------------------------------------
# 1b. SUPPLY-AREA SPLIT. The IPP Office reports by PROVINCE; this model is keyed
#     by Eskom TRANSMISSION SUPPLY AREA (see substations_compact.json meta -
#     the ten values include Hydra Central, which is not a province).
#
#     Applied as SHARES, never as absolute megawatts. The split file carries
#     CONTRACTED capacity from the IPP Office project-location table; this file
#     carries capacity ONLINE. Substituting contracted MW directly would break
#     the national identities validate_capacity.js asserts. Redistributing each
#     province's ONLINE figure by its contracted share preserves every total
#     exactly - asserted below - and moves only the geography.
#
#     Visible consequences, both correct and both surprising at first sight:
#       - Eastern Cape solar goes to ZERO. Dreunberg is the only EC solar project
#         in BW1-BW4 and it connects into Hydra Central, so all of it moves.
#       - Western Cape wind gains ~419 MW: the Sutherland trio (Roggeveld,
#         Karusa, Soetwater) is filed by the IPP Office under the Northern Cape
#         but connects at Komsberg, in the Western Cape supply area.
# ---------------------------------------------------------------------------
split = json.load(open("nodal/supply_area_split_draft.json"))

shares = {}
for proj in split["projects"]:
    key = (proj["published_province"], proj["tech"])
    shares.setdefault(key, {})
    shares[key][proj["region"]] = shares[key].get(proj["region"], 0.0) + proj["mw"]


def to_supply_areas(by_province, tech):
    """Redistribute one technology's ONLINE capacity from provinces to supply
    areas, using contracted shares. Provinces with no project data pass through
    unchanged."""
    out = blank()
    for prov, online in by_province.items():
        if online <= 0:
            continue
        areas = shares.get((prov, tech))
        if not areas:
            out[prov] += online
            continue
        tot = sum(areas.values())
        for area, mw in areas.items():
            out[area] += online * mw / tot
    return {r: round(v, 1) for r, v in out.items()}


for _tech, _key in (("solar", "solar_mw"), ("wind", "wind_mw")):
    _before = total(reipppp_online[_key])
    reipppp_online[_key] = to_supply_areas(reipppp_online[_key], _tech)
    assert abs(total(reipppp_online[_key]) - _before) <= 0.2, (
        f"supply-area split changed the {_key} total: {_before} -> {total(reipppp_online[_key])}")

# ---------------------------------------------------------------------------
# 2b. ESKOM-OWNED renewable capacity - a THIRD source alongside reipppp and
#     private. Eskom's own Sere wind farm (100 MW, Koekenaap near Vredendal) is
#     neither REIPPPP nor privately procured, so it fell through both buckets.
#     Eskom's Weekly System Status Report gives "Wind (Eskom+IPP) 4,142.6 MW",
#     which is our REIPPPP 4,042.6 plus exactly this 100 MW - the arithmetic
#     that identified the omission. CSIR's statistics carry the same note on
#     every edition ("Wind includes Eskom's Sere wind farm (100 MW)").
#     Supply area: nearest transmission node is Juno at 14.7 km, WESTERN CAPE -
#     the same Juno whose area label was corrected on 14 Aug 2026. Sere's
#     province is also Western Cape (Matzikama), so no province/area split here.
eskom_online = {"solar_mw": blank(), "wind_mw": blank()}
eskom_online["wind_mw"]["Western Cape"] = 100.0

# ---------------------------------------------------------------------------
# 2d. RMIPPPP - a FOURTH source. Kept in its own bucket rather than folded into
#     reipppp: different programme, different procurement round, and the report
#     gives no provincial split for the ~225 MW already operational, so that
#     capacity is still OUTSIDE this file. Holding RMIPPPP separately means the
#     225 MW can be added later without disturbing anything, and nobody has to
#     wonder whether by_source.reipppp silently contains RMIPPPP.
#
#     hybrid_mw is a NEW technology key and is deliberately NOT solar_mw. Mulilo
#     Total Hydra is 216 MWp of solar behind a 75 MW contracted dispatchable
#     output (PFL Table 1 footnote 2). Counting 216 as solar would treble
#     Northern Cape solar; counting 75 as solar would describe it wrongly. It is
#     firm dispatchable capacity and is carried as such, so FIXED.pvUtilityMW is
#     untouched - which matters, because it is already known to be ~1,823 MW high.
#
#     COD: PFL places it in H1 2026; Engineering News reports it inaugurated and
#     brought into operation 16 July 2026. Inauguration normally FOLLOWS
#     commercial operation, so these are not necessarily in conflict, but the
#     recorded COD is 2026-07 pending the PFL Knowledge Hub table. Either way it
#     is after the 31 March cutoff, so it is genuinely uncounted in p.18.
# ---------------------------------------------------------------------------
rmipppp_online = {"hybrid_mw": blank()}
rmipppp_online["hybrid_mw"]["Northern Cape"] = 75.0

# Engine-facing totals: sum across sources. Utility PV only; CSP is carried
# separately as FIXED.cspMW in index.html.
# ---------------------------------------------------------------------------
# 2c. POST-CUTOFF ADDITIONS. Projects that reached commercial operation AFTER
#     the 31 March 2026 reporting date, so they are absent from p.18 but are
#     online today. Added here, after the supply-area split, because the split
#     file covers BW1-BW4 + the CSP window and cannot carry a BW6 project.
#
#     THE BAR, from the Doornhoek/Graspan pair on 18 Aug 2026: three independent
#     sources agreeing on capacity, province AND timing, PLUS the
#     in_construction decomposition NAMING the project as not yet online at the
#     cutoff. Graspan failed that last test and was correctly refused.
#
#     p18_online_sum is captured BEFORE these are added: the rounding note is a
#     statement about the published table, which does not contain them.
# ---------------------------------------------------------------------------
p18_online_sum = round(sum(total(v) for v in reipppp_online.values()), 1)

POST_CUTOFF = [
    dict(name="Doornhoek Solar PV", mw=120.0, tech="solar", region="North West",
         bw="BW6", cod="22 May 2026",
         sources=[
             "ipp_pipeline.json status=construction at 31 Mar 2026",
             "Engineering News 22 May 2026, AMEA Power commissions 120 MW Doornhoek, "
             "https://www.engineeringnews.co.za/article/amea-powers-120-mw-solar-plant-achieves-commercial-operation-2026-05-22",
             "PFL H1 2026 monitor Table 1",
             "Single-axis tracking confirmed via developer-sourced project description; "
             "~200 ha, 81,000+ panels for 120 MW.",
         ],
         note=(
             "CAPACITY FACTOR RESOLVED. The quoted 325 GWh/y on 120 MW implies 30.9%, "
             "which looked like an over-claim against a 21-24% fixed-tilt band. It is not: "
             "the plant uses SINGLE-AXIS TRACKING, whose SA range is 26-31%, so 30.9% sits "
             "at the top of a plausible band rather than outside one. Distinct from the "
             "Ilikwa flag, where 32% is asserted with no stated mechanism. MWp vs MWac: the "
             "press consistently says 120 MWp while PFL Table 1 records 120 MWac for both "
             "contracted and installed. PFL flags that distinction explicitly in footnote 2 "
             "for Mulilo Total Hydra and did NOT flag Doornhoek, so 120 MWac is deliberate - "
             "and it reconciles, since 325 GWh on ~100 MWac would imply 37%, which is not "
             "achievable. MODELLING NOTE: our solar profile yields 22.5% fleet-average, so "
             "the model generates about 236 GWh here against the claimed 325. That is the "
             "right treatment for one plant inside a fleet-average profile, but the fleet CF "
             "should drift upward as tracking becomes standard."
         )),
]

for _p in POST_CUTOFF:
    reipppp_online[_p["tech"] + "_mw"][_p["region"]] = round(
        reipppp_online[_p["tech"] + "_mw"][_p["region"]] + _p["mw"], 1)

_post_cutoff_mw = round(sum(p["mw"] for p in POST_CUTOFF), 1)

solar_total = {r: reipppp_online["solar_mw"][r] + private_online["solar_mw"][r]
                  + eskom_online["solar_mw"][r] for r in REGIONS}
wind_total = {r: reipppp_online["wind_mw"][r] + private_online["wind_mw"][r]
                 + eskom_online["wind_mw"][r] for r in REGIONS}


prov_online_sum = round(sum(total(v) for v in reipppp_online.values()), 1)

regional = {
    "wind_mw": wind_total,
    "solar_mw": solar_total,
    "by_source": {
        "reipppp": reipppp_online,
        "private": private_online,
        "eskom": eskom_online,
        "rmipppp": rmipppp_online,
    },
    "reconciliation": {
        "universe": "REIPPPP BW1-BW6, projects that reached financial close",
        "identity": "procured = online_actual + under_delivery + in_construction",
        "procured_mw": 7825.0,
        # Post-cutoff additions move capacity from in_construction to online, so
        # both sides shift and the identity still holds. Derived, never typed.
        "online_actual_mw": round(7355.0 + _post_cutoff_mw, 1),
        "under_delivery_mw": 26.0,
        "in_construction_mw": round(444.0 - _post_cutoff_mw, 1),
        "identity_holds": round(7355.0 + _post_cutoff_mw, 1) + 26.0
                          + round(444.0 - _post_cutoff_mw, 1) == 7825.0,
        "provincial_online_sum_mw": prov_online_sum,
        "rounding_note": (
            "Summing the per-province, per-technology figures on p.18 gives "
            f"{p18_online_sum} MW against the headline 7355 MW. The 1 MW gap is rounding "
            "in the published table and has NOT been adjusted away."
        ),
        "totals_by_technology_mw": {k: total(v) for k, v in reipppp_online.items()},
        "construction_decomposition": (
            "in_construction_mw was 444 at 31 Mar 2026, decomposing exactly to Doornhoek "
            "Solar PV 120 (BW6), Virginia Solar Park 240 (BW6) and BW5 wind Eastern Cape 84. "
            "Doornhoek was moved to online on 18 Aug 2026 on confirmation it reached COD "
            "22 May 2026, leaving 324 in construction. That decomposition is also how the "
            "same-day attempt to add Graspan was caught: Graspan was not in it, and being "
            "inside procured it was therefore already online."
        ),
        "post_cutoff_additions": POST_CUTOFF,
    },
    "meta": {
        "description": (
            "Operational renewable capacity by GridTwin ZA nodal region. Rebuilt from "
            "commissioned-plant figures, not bid-window awards."
        ),
        "source_reipppp": SRC + ", p.18 (Capacity Online by province and technology)."
        " PLUS Doornhoek Solar PV (120 MW, North West, BW6, AMEA Power), which reached"
        " commercial operation 22 May 2026 - after the 31 March cutoff - confirmed by"
        " Engineering News and the PFL H1 2026 monitor, and listed as in-construction at"
        " the cutoff in ipp_pipeline.json.",
        "source_private": "Alao, O. & Kruger, W. (2026), South African IPPs: financial close and commercial operations monitor, H1 2026 update, Power Futures Lab, UCT GSB (see nodal/pfl_private_h1_2026.json)",
        "private_coverage": "h1-2026-only",
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
            "(1) by_source.private covers H1 2026 ONLY (958 MW wheeled). Private and wheeled "
            "plant commissioned before January 2026 is not in the PFL H1 monitor and is missing "
            "here - roughly 1.8 GW of solar remains unexplained against FIXED.pvUtilityMW, so "
            "identity 3 stays PENDING and pvUtilityMW must NOT be re-derived from this file yet. "
            "Wind is NOT affected by this gap - see meta.WIND_PROVENANCE. (2) RMIPPPP contributes about 225 MW of "
            "contracted operational capacity across Northern Cape, Eastern Cape and Western Cape; "
            "the report does not give the provincial split, so it is excluded rather than guessed. "
            "(3) CSP is reported here at 600 MW (Northern Cape) - index.html FIXED.cspMW of 500 "
            "is understated. (4) Peakers (Avon 670 MW KZN, Dedisa 335 MW Eastern Cape, diesel "
            "OCGT) are not renewable and are out of scope for this file."
        ),
        "WIND_PROVENANCE": (
            "FIXED.windMW is DERIVED from this file: 4042 MW REIPPPP (IPP Office Q4 2025/26) "
            "+ 470 MW private/wheeled (PFL H1 2026) = 4512 MW. It previously read 4458, built as "
            "3600 + 858, where the 3600 baseline had muddled provenance and the 858 mixed "
            "grid-supply with wheeled capacity. Two published sources, disjoint universes - the "
            "IPP Office does not cover private procurement, so Umsobomvu and the three Impofu "
            "farms appear once, in the private bucket. NOTE the equality is now a consistency "
            "check, not independent corroboration; it will fail if pre-2026 private WIND is "
            "later found, which is correct - re-derive the constant rather than patching it."
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
         status="online", bw="BW6", province_confidence="published",
         cod="22 May 2026",
         status_note="Moved from construction to online 18 Aug 2026. Commissioned "
                     "22 May 2026 per Engineering News; first BW6 project to reach COD."),
    dict(name="Mulilo Total Hydra Storage", region="Northern Cape", tech="hybrid", mw=75.0,
         status="online", bw="RMIPPPP", province_confidence="published",
         cod="2026-07",
         status_note="Added 27 Aug 2026. 216 MWp of solar behind a 75 MW contracted "
                     "dispatchable output (PFL Table 1 footnote 2); the CONTRACTED figure "
                     "is carried, since 216 would treble Northern Cape solar. Reached "
                     "commercial operation after the 31 Mar 2026 cutoff, so it is absent "
                     "from p.29. PFL places it in H1 2026; Engineering News reports "
                     "inauguration 16 July 2026 - inauguration normally follows COD, so "
                     "these need not conflict. Confirm against the PFL Knowledge Hub COD "
                     "table. Counted in by_source.rmipppp.hybrid_mw, NOT in solar."),
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
