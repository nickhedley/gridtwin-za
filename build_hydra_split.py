#!/usr/bin/env python3
"""
GridTwin ZA - split Northern Cape operational capacity into `Northern Cape` and
`Hydra Central` by matching named projects to their nearest transmission substation.

METHOD
  IPP Office publishes a project-location table (name, contracted capacity,
  province, district municipality, town) covering REIPPPP BW1-BW4 plus the March
  2014 CSP window. Each project is placed at its stated town, and assigned to the
  supply area of the nearest substation in substations_compact.json. This is the
  same nearest-substation approach already used for the environmental register.

  Hydra Central is a transmission supply area spanning the Karoo across the
  Northern Cape / Eastern Cape provincial boundary. Its substations are Hydra,
  Kestrel, Aquila, Gamma, Koruson, Roodekuil and Ruigtevallei.

WHAT THIS DOES NOT COVER
  BW5 onward is absent from the published table, and BW5 is exactly where the
  remaining Karoo wind sits (Phezukomoya, Coleskop, San Kraal). The split below is
  therefore PARTIAL and is written to a separate file for review - it is NOT
  wired into regional_renewable_capacity.json by this script.

TOWN COORDINATES
  Town centroids are geographic reference data, not project data. Each is tagged
  with how it was obtained so a reviewer can check them. Projects sit at a farm
  some distance from the named town, so a project whose two nearest substations
  are close together is flagged `ambiguous` rather than assigned silently.
"""
import json, math, sys

import csv as _csv, math as _math

_ALL = json.load(open("nodal/substations_compact.json"))["subs"]

# The candidate set is TRANSMISSION nodes only. Two classes are excluded:
#
#  (1) Below 220 kV. Those seven entries carry Eskom DISTRIBUTION operating units,
#      which are provincial and in which "Hydra Central" does not exist as a
#      concept. Gariep 132 kV is labelled Free State for that reason; the
#      transmission node serving Gariep is Ruigtevallei, 1.8 km away, Hydra Central.
#
#  (2) Plant-side substations, within 500 m of a power station in fleet_by_region_v2.
#      These are switchyards, not independent nodes. Of the 19 such entries, three
#      disagree with the fleet's own supply area - Gariep, Van der Kloof and Lethabo -
#      and those three are exactly the cases where province differs from supply area.
#      Excluding them asserts nothing new; it just stops a provincial label being
#      used to answer a supply-area question.
def _hav(a, b, c, d):
    R = 6371.0
    p1, p2 = _math.radians(a), _math.radians(c)
    dp, dl = _math.radians(c - a), _math.radians(d - b)
    h = _math.sin(dp/2)**2 + _math.cos(p1)*_math.cos(p2)*_math.sin(dl/2)**2
    return 2 * R * _math.asin(_math.sqrt(h))

_PLANTS = []
for _r in _csv.DictReader(open("nodal/fleet_by_region_v2.csv")):
    if _r.get("Scenario") != "BASE":
        continue
    try:
        _PLANTS.append((float(_r["GPS Latitude"]), float(_r["GPS Longitude"])))
    except (ValueError, KeyError):
        pass

def _plant_side(x):
    return any(_hav(x["lat"], x["lng"], la, lo) < 0.5 for la, lo in _PLANTS)

SUBS = [x for x in _ALL if x["kv"] >= 220 and not _plant_side(x)]
EXCLUDED = [x for x in _ALL if x not in SUBS]

# Town centroids, decimal degrees. Reference geography, cross-checkable against
# any gazetteer. Marked `low` where the town is large or the project is known to
# sit well outside it, which widens the ambiguity band.
TOWNS = {
    "Pofadder": (-29.132, 19.396, "ok"),      "Upington": (-28.448, 21.256, "ok"),
    "Postmasburg": (-28.334, 23.070, "ok"),   "De Aar": (-30.649, 24.012, "ok"),
    "Copperton": (-29.937, 22.294, "ok"),     "Phillipstown": (-30.436, 24.470, "ok"),
    "Kenhardt": (-29.348, 21.155, "ok"),      "Douglas": (-29.058, 23.771, "ok"),
    "Kathu": (-27.696, 23.049, "ok"),         "Kimberley": (-28.741, 24.763, "ok"),
    "Hanover": (-31.072, 24.463, "ok"),       "Victoria West": (-31.397, 23.116, "ok"),
    "Loeriesfontein": (-30.951, 19.434, "ok"),"Noupoort": (-31.187, 24.947, "ok"),
    "Sutherland": (-32.395, 20.663, "ok"),    "Springbok": (-29.665, 17.886, "ok"),
    "Aggeneys": (-29.201, 18.808, "ok"),      "Groblershoop": (-28.897, 21.983, "ok"),
    "Kakamas": (-28.769, 20.616, "ok"),       "Prieska": (-29.664, 22.748, "low"),
    # Other provinces - needed to check whether any non-Northern-Cape project
    # also sits in a different supply area from its province.
    "Molteno": (-31.393, 26.360, "ok"),       "Port Elizabeth": (-33.960, 25.602, "low"),
    "Humansdorp": (-34.031, 24.769, "ok"),    "Cookhouse": (-32.746, 25.809, "ok"),
    "Caledon": (-34.230, 19.426, "ok"),       "Hopefield": (-33.062, 18.351, "ok"),
    "Bloemfontein": (-29.085, 26.159, "low"), "Polokwane": (-23.904, 29.469, "low"),
    "Dendron": (-23.371, 29.318, "ok"),       "Rustenburg": (-25.667, 27.242, "low"),
    "Bedford": (-32.677, 26.089, "ok"),       "Grahamstown": (-33.310, 26.523, "ok"),
    "Coega": (-33.750, 25.679, "ok"),         "Stutterheim": (-32.570, 27.424, "ok"),
    "Gouda": (-33.313, 19.031, "ok"),         "Vredenburg": (-32.907, 17.988, "ok"),
    "Burgersdorp": (-30.999, 26.330, "ok"),   "Boshof": (-28.539, 25.246, "ok"),
    "Aurora": (-32.708, 18.483, "ok"),        "Vredendal": (-31.668, 18.502, "ok"),
    "Clarens": (-28.514, 28.421, "ok"),       "Mkuze": (-27.610, 32.039, "ok"),
    "Johannesburg": (-26.204, 28.047, "low"), "Jacobsdal": (-29.135, 24.777, "ok"),
    "Lephalale": (-23.671, 27.750, "ok"),     "Clanwilliam": (-32.180, 18.889, "ok"),
    "Nelspruit": (-25.475, 30.970, "ok"),     "Hamburg": (-33.288, 27.481, "ok"),
    "Swellendam": (-34.022, 20.442, "ok"),    "Brits": (-25.635, 27.780, "ok"),
    "Klerksdorp": (-26.852, 26.667, "ok"),    "Zeerust": (-25.536, 26.077, "ok"),
    "Vryburg": (-26.955, 24.728, "ok"),       "Bethlehem": (-28.230, 28.310, "ok"),
    "Touwsrivier": (-33.336, 20.038, "ok"),   "Malmesbury": (-33.460, 18.727, "ok"),
    "Kimberley ": (-28.741, 24.763, "ok"),
}

# REIPPPP BW1-BW4 + CSP window, Northern Cape entries only, from the IPP Office
# project-location table. Capacity is contracted MW as published.
PROJECTS = [
    # (name, mw, tech, town, bid window)
    ("Kaxu Solar One", 100.00, "csp", "Pofadder", "BW1"),
    ("Khi Solar One", 50.00, "csp", "Upington", "BW1"),
    ("Nobelsfontein Phase 1", 75.00, "wind", "Victoria West", "BW1"),
    ("Lesedi Solar Photovoltaic Park", 64.00, "solar", "Postmasburg", "BW1"),
    ("Mulilo Solar PV De Aar", 10.00, "solar", "De Aar", "BW1"),
    ("Mulilo Solar PV Prieska", 20.00, "solar", "Copperton", "BW1"),
    ("Konkoonsies Solar Energy Facility", 9.65, "solar", "Pofadder", "BW1"),
    ("Kalkbult", 72.50, "solar", "Phillipstown", "BW1"),
    ("Aries Solar Energy Facility", 9.65, "solar", "Kenhardt", "BW1"),
    ("Mainstream De Aar PV", 45.60, "solar", "De Aar", "BW1"),
    ("Greefspan PV Power Plant", 9.90, "solar", "Douglas", "BW1"),
    ("Kathu Solar Plant", 75.00, "solar", "Kathu", "BW1"),
    ("Solar Capital De Aar", 75.00, "solar", "De Aar", "BW1"),
    ("Mainstream Droogfontein", 45.60, "solar", "Kimberley", "BW1"),
    ("Herbert PV Power Plant", 19.98, "solar", "Douglas", "BW1"),
    ("Bokpoort CSP project", 50.00, "csp", "Groblershoop", "BW2"),
    ("Solar Capital De Aar 3", 75.00, "solar", "De Aar", "BW2"),
    ("Sishen Solar Facility", 74.00, "solar", "Kathu", "BW2"),
    ("Linde", 36.80, "solar", "Hanover", "BW2"),
    ("Jasper Power Company", 75.00, "solar", "Postmasburg", "BW2"),
    ("Upington Airport", 8.90, "solar", "Upington", "BW2"),
    ("Neusberg Hydro Electrical Project", 10.00, "hydro", "Kakamas", "BW2"),
    ("Ilanga CSP 1 / Karoshoek Solar One", 100.00, "csp", "Upington", "BW3"),
    ("!XiNa Solar One", 100.00, "csp", "Pofadder", "BW3"),
    ("Longyuan Mulilo De Aar 2 North", 138.96, "wind", "De Aar", "BW3"),
    ("Longyuan Mulilo De Aar Maanhaarberg", 96.48, "wind", "De Aar", "BW3"),
    ("Loeriesfontein 2", 138.23, "wind", "Loeriesfontein", "BW3"),
    ("Noupoort", 79.05, "wind", "Noupoort", "BW3"),
    ("Khobab Wind", 137.74, "wind", "Loeriesfontein", "BW3"),
    ("Adams Solar PV 2", 75.00, "solar", "Kathu", "BW3"),
    ("Mulilo Sonnedix Prieska PV", 75.00, "solar", "Copperton", "BW3"),
    ("Mulilo Prieska PV", 75.00, "solar", "Copperton", "BW3"),
    ("Kathu Solar Park", 100.00, "csp", "Kathu", "CSP2014"),
    ("Redstone Solar Thermal Power Project", 100.00, "csp", "Postmasburg", "CSP2014"),
    ("Roggeveld Wind Farm", 140.00, "wind", "Sutherland", "BW4"),
    ("The Karusa Wind Farm", 139.80, "wind", "Sutherland", "BW4"),
    ("The Soetwater Wind Farm", 139.40, "wind", "Sutherland", "BW4"),
    ("Kangnas", 136.70, "wind", "Springbok", "BW4"),
    ("Copperton Windfarm", 102.00, "wind", "Copperton", "BW4"),
    ("Garob Wind Farm", 135.93, "wind", "Copperton", "BW4"),
    ("Sirius Solar PV Project One", 75.00, "solar", "Upington", "BW4"),
    ("Droogfontein 2 Solar", 75.00, "solar", "Kimberley", "BW4"),
    ("Dyason's Klip 1", 75.00, "solar", "Upington", "BW4"),
    ("Dyason's Klip 2", 75.00, "solar", "Upington", "BW4"),
    ("Konkoonsies II Solar Facility", 75.00, "solar", "Pofadder", "BW4"),
    ("Aggeneys Solar Project", 40.00, "solar", "Aggeneys", "BW4"),
    ("Solar Capital Orange", 75.00, "solar", "Loeriesfontein", "BW4"),
    ("Greefspan PV Power Plant No. 2", 55.00, "solar", "Douglas", "BW4"),
    # ---- BW5, Northern Cape, ONLINE at 31 Mar 2026 ------------------------------
    # Source: DMRE media statement 28 Oct 2021 (BW5 preferred bidders) - project,
    # capacity, province and LOCAL MUNICIPALITY for all 25 projects.
    # Both sit in Umsobomvu LM "on the boundary of the Eastern Cape and Northern
    # Cape Provinces" (EDF) - exactly what Hydra Central exists to represent.
    # These need NO nearest-substation inference: EDF's cluster is called
    # KORUSON 1, named for the substation it connects to, and Koruson is a Hydra
    # Central node in substations_compact.json. A stated connection point beats
    # a proximity guess, so they are sited AT Koruson.
    ("San Kraal WEF", 140.00, "wind", "Noupoort", "BW5"),
    ("Phezukomoya WEF", 140.00, "wind", "Noupoort", "BW5"),
    # Du Plessis Dam PV 1, Emthanjeni LM = De Aar, joins the five other De Aar
    # projects on Hydra. Identified by ELIMINATION, and the arithmetic agrees:
    # the Northern Cape online total leaves 73.4 MW of BW5 solar unaccounted for,
    # against 75 MW contracted here - a 1.6 MW shortfall consistent with the
    # under-delivery already in the capacity identities. The alternative
    # candidate, Graspan (Siyancuma, 75 MW), was COMMISSIONED IN APRIL 2026 -
    # after the 31 Mar 2026 reporting date this file is built against - so it is
    # not in the online total. Both had reached financial close, which is why FC
    # could not settle it and the COD date had to.
    ("Du Plessis Dam Solar PV 1", 75.00, "solar", "De Aar", "BW5"),
    # Non-Northern-Cape projects, same table. Included to test whether any of them
    # also sit in a different supply area from their stated province.
    ("Dorper Wind Farm", 97.53, "wind", "Molteno", "BW1"),
    ("Metrowind Van Stadens", 27.00, "wind", "Port Elizabeth", "BW1"),
    ("Kouga Red Cap - Oyster Bay", 80.00, "wind", "Humansdorp", "BW1"),
    ("Jeffreys Bay", 138.00, "wind", "Humansdorp", "BW1"),
    ("Cookhouse Wind Farm", 138.60, "wind", "Cookhouse", "BW1"),
    ("Dassieklip Wind Energy Facility", 27.00, "wind", "Caledon", "BW1"),
    ("Hopefield Wind Farm", 65.40, "wind", "Hopefield", "BW1"),
    ("Letsatsi Solar PV Park", 64.00, "solar", "Bloemfontein", "BW1"),
    ("Witkop Solar Park", 30.00, "solar", "Polokwane", "BW1"),
    ("Soutpan Solar Park", 28.00, "solar", "Dendron", "BW1"),
    ("RustMo1 Solar Farm", 6.93, "solar", "Rustenburg", "BW1"),
    ("Touwsrivier Solar Park", 36.00, "solar", "Touwsrivier", "BW1"),
    ("Slimsun Swartland Solar Park", 5.00, "solar", "Malmesbury", "BW1"),
    ("Amakhala Wind Project", 133.70, "wind", "Bedford", "BW2"),
    ("Tsitsikamma Community Wind Farm", 94.80, "wind", "Humansdorp", "BW2"),
    ("Waainek Wind Power", 23.28, "wind", "Grahamstown", "BW2"),
    ("Grassridge Onshore Wind", 59.80, "wind", "Coega", "BW2"),
    ("Chaba Wind Power", 21.00, "wind", "Stutterheim", "BW2"),
    ("Gouda Wind Project", 135.50, "wind", "Gouda", "BW2"),
    ("Wind Farm West Coast 1", 90.82, "wind", "Vredenburg", "BW2"),
    ("Dreunberg", 69.60, "solar", "Burgersdorp", "BW2"),
    ("Boshoff Solar Park", 60.00, "solar", "Boshof", "BW2"),
    ("Aurora-Rietvlei Solar Power", 9.00, "solar", "Aurora", "BW2"),
    ("Vredendal Solar Park", 8.82, "solar", "Vredendal", "BW2"),
    ("Stortemelk Power Plant", 4.40, "hydro", "Clarens", "BW2"),
    ("Mkuze", 16.50, "biomass", "Mkuze", "BW3"),
    ("Joburg Landfill Gas to Electricity", 18.00, "lfg", "Johannesburg", "BW3"),
    ("Nojoli Wind Farm", 86.60, "wind", "Bedford", "BW3"),
    ("Red Cap - Gibson Bay", 110.00, "wind", "Humansdorp", "BW3"),
    ("Pulida Solar Park", 75.00, "solar", "Jacobsdal", "BW3"),
    ("Tom Burke Solar Park", 60.00, "solar", "Lephalale", "BW3"),
    ("Electra Capital", 75.00, "solar", "Clanwilliam", "BW3"),
    ("Ngodwana Energy Project", 25.00, "biomass", "Nelspruit", "BW4"),
    ("The Nxuba Wind Farm", 138.90, "wind", "Cookhouse", "BW4"),
    ("Golden Valley Wind", 117.72, "wind", "Cookhouse", "BW4"),
    ("Oyster Bay Wind Farm", 140.00, "wind", "Humansdorp", "BW4"),
    ("Wesley-Ciskei", 32.70, "wind", "Hamburg", "BW4"),
    ("Perdekraal East", 107.76, "wind", "Touwsrivier", "BW4"),
    ("Excelsior Wind Energy Facility", 31.90, "wind", "Swellendam", "BW4"),
    ("De Wildt", 50.00, "solar", "Brits", "BW4"),
    ("Bokamoso", 67.90, "solar", "Klerksdorp", "BW4"),
    ("Zeerust", 75.00, "solar", "Zeerust", "BW4"),
    ("Waterloo Solar Park", 75.00, "solar", "Vryburg", "BW4"),
    ("Kruisvallei Hydro", 4.70, "hydro", "Bethlehem", "BW4"),
]

PROV = {
    "Dorper Wind Farm": "Eastern Cape",
    "Metrowind Van Stadens": "Eastern Cape",
    "Kouga Red Cap - Oyster Bay": "Eastern Cape",
    "Jeffreys Bay": "Eastern Cape",
    "Cookhouse Wind Farm": "Eastern Cape",
    "Dassieklip Wind Energy Facility": "Western Cape",
    "Hopefield Wind Farm": "Western Cape",
    "Letsatsi Solar PV Park": "Free State",
    "Witkop Solar Park": "Limpopo",
    "Soutpan Solar Park": "Limpopo",
    "RustMo1 Solar Farm": "North West",
    "Touwsrivier Solar Park": "Western Cape",
    "Slimsun Swartland Solar Park": "Western Cape",
    "Amakhala Wind Project": "Eastern Cape",
    "Tsitsikamma Community Wind Farm": "Eastern Cape",
    "Waainek Wind Power": "Eastern Cape",
    "Grassridge Onshore Wind": "Eastern Cape",
    "Chaba Wind Power": "Eastern Cape",
    "Gouda Wind Project": "Western Cape",
    "Wind Farm West Coast 1": "Western Cape",
    "Dreunberg": "Eastern Cape",
    "Boshoff Solar Park": "Free State",
    "Aurora-Rietvlei Solar Power": "Western Cape",
    "Vredendal Solar Park": "Western Cape",
    "Stortemelk Power Plant": "Free State",
    "Mkuze": "Kwazulu Natal",
    "Joburg Landfill Gas to Electricity": "Gauteng",
    "Nojoli Wind Farm": "Eastern Cape",
    "Red Cap - Gibson Bay": "Eastern Cape",
    "Pulida Solar Park": "Free State",
    "Tom Burke Solar Park": "Limpopo",
    "Electra Capital": "Western Cape",
    "Ngodwana Energy Project": "Mpumalanga",
    "The Nxuba Wind Farm": "Eastern Cape",
    "Golden Valley Wind": "Eastern Cape",
    "Oyster Bay Wind Farm": "Eastern Cape",
    "Wesley-Ciskei": "Eastern Cape",
    "Perdekraal East": "Western Cape",
    "Excelsior Wind Energy Facility": "Western Cape",
    "De Wildt": "North West",
    "Bokamoso": "North West",
    "Zeerust": "North West",
    "Waterloo Solar Park": "North West",
    "Kruisvallei Hydro": "Free State"
}  # everything else is Northern Cape
# ---------------------------------------------------------------------------
# SITE COORDINATES - per-project overrides, decimal degrees (WGS 84).
#
# Town centroids are the WEAKEST input in this whole split: they are the one
# thing not taken from a published table, and a project sits at a farm some
# distance from the town it is filed under. Dreunberg proved the point - its
# real site is 21.5 km from Burgersdorp, which moved Ruigtevallei 18 km closer
# and Delphi 21 km further, widening the Hydra Central margin from 33 km to
# 72 km. A single real coordinate beats any refinement of the matching rule.
#
# Anything listed here bypasses the town lookup entirely and is treated as
# `site` confidence: no ambiguity flag, no tie-break, because the input is no
# longer a proxy. Add projects as coordinates are sourced - the contested ones
# first (see `flagged_for_review` in the output).
SITE_COORDS = {
    "Dreunberg":        (-30.8373,  26.2055),   # user-supplied, WGS 84
    # Koruson substation itself - the STATED connection point for EDF's Koruson 1
    # cluster, not a proximity estimate. See the BW5 note in PROJECTS.
    "San Kraal WEF":    (-31.355,   24.822),
    "Phezukomoya WEF":  (-31.355,   24.822),
    "Dorper Wind Farm": (-31.48028, 26.44056),  # 31d28'49"S 26d26'26"E; 12.4 km from Molteno
    # De Wildt: FOUR candidate locations were considered, spanning 32 km and
    # splitting between the Gauteng and North West supply areas. Resolved by two
    # independent sources agreeing to within 200 m: a decimal pair -25.6332,
    # 27.9307 and plus code 9W8H+5P Brits (= -25.63456, 27.92931). A DMS reading
    # 25d36'35"S 27d43'49"E proved 20 km off and is DISCARDED; a substation at
    # 8J36+VW Maroelakop is 32.5 km away and is a mine supply node, not this
    # project's site. Nearest transmission node Dinaledi 9.7 km (Gauteng) vs
    # Lomond 18.7 km (North West) - a 2:1 difference, so Gauteng despite the
    # 9.0 km gap falling under TIEBREAK_KM (the tie-break is for centroids, not
    # for real coordinates). Published province is North West: this is a genuine
    # province-vs-supply-area divergence, not an error. Tightest cross-area call
    # in the set - worth checking against the connection agreement if ever available.
    "De Wildt":         (-25.63456, 27.92931),
}

AMBIGUITY_KM = 40.0   # cross-area candidates closer together than this are ambiguous
TIEBREAK_KM  = 10.0   # inside this, a town centroid cannot separate them - see below


def haversine(a, b, c, d):
    R = 6371.0
    p1, p2 = math.radians(a), math.radians(c)
    dp, dl = math.radians(c - a), math.radians(d - b)
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(h))


rows, flagged = [], []
for name, mw, tech, town, bw in PROJECTS:
    if name in SITE_COORDS:
        lat, lng = SITE_COORDS[name]
        conf = "site"                    # a real location, not a proxy
    else:
        lat, lng, conf = TOWNS[town]
    d = sorted(((haversine(lat, lng, s["lat"], s["lng"]), s) for s in SUBS), key=lambda x: x[0])
    (d1, s1), (d2, s2) = d[0], d[1]
    region = s1["area"]
    published = PROV.get(name, "Northern Cape")

    # Only a CROSS-AREA contest is ambiguous. The first pass also flagged low
    # town confidence, which produced five reviews where both candidates sat in
    # the SAME supply area and the answer could not change either way - noise
    # that buries the two decisions that matter.
    cross = (s2["area"] != s1["area"])
    amb = cross and (d2 - d1 < AMBIGUITY_KM) and conf != "site"

    # TIE-BREAK. Inside TIEBREAK_KM the projects sit at a farm some distance from
    # the named town, so a town centroid cannot separate the two candidates - the
    # measurement is finer than the input. Rather than flip a coin, keep the
    # PUBLISHED province when it is one of the two candidates: it is the sourced
    # attribution, and this moves capacity only where the evidence is clear.
    tiebreak = None
    if conf != "site" and cross and (d2 - d1) < TIEBREAK_KM and s1["area"] != published and s2["area"] == published:
        tiebreak = f'kept published {published} over {s1["area"]} ({d2 - d1:.1f} km apart)'
        region = published
    row = dict(name=name, mw=mw, tech=tech, town=town, bw=bw, region=region,
               published_province=published, tiebreak=tiebreak,
               nearest=s1["n"], km=round(d1, 1),
               second=s2["n"], second_region=s2["area"], second_km=round(d2, 1),
               town_confidence=conf, ambiguous=amb)
    rows.append(row)
    if amb and not tiebreak:
        flagged.append(row)

agg = {}
for r in rows:
    a = agg.setdefault(r["region"], {})
    a[r["tech"]] = round(a.get(r["tech"], 0) + r["mw"], 2)

out = {
    "method": "nearest transmission substation to the project's location; real site coordinates where known (SITE_COORDS), otherwise the stated town's centroid",
    "sited_projects": sorted(SITE_COORDS),
    "source": "IPP Office, REIPPPP project location table (BW1-BW4 + Mar 2014 CSP window), ipp-projects.co.za",
    "coverage": ("BW1-BW4 + CSP window from the IPP Office project-location table, PLUS the two "
                 "BW5 Northern Cape wind projects online at 31 Mar 2026 (San Kraal, Phezukomoya) "
                 "from the DMRE BW5 preferred-bidder statement. STILL OUTSTANDING: ~73 MW of BW5 "
                 "solar in the online total - either Graspan (Siyancuma, would be Northern Cape) "
                 "and the BW5 solar project online at that date, Du Plessis Dam PV 1. "
                 "PENDING ADDITION for the next quarterly: Graspan Solar (Siyancuma, 75 MW) was "
                 "commissioned in April 2026, just after this reporting date - it belongs to the "
                 "Northern Cape supply area and should be added when the capacity file rolls "
                 "forward. BW5 projects that were terminated (1,424 MW) are correctly absent."),
    "pending_next_quarterly": [
        {"name": "Graspan Solar", "mw": 75.0, "tech": "solar",
         "municipality": "Siyancuma", "area": "Northern Cape", "cod": "April 2026"}
    ],
    "ambiguity_threshold_km": AMBIGUITY_KM,
    "by_region": agg,
    "flagged_for_review": flagged,
    "projects": rows,
}
out["excluded_substations"] = [{"n": x["n"], "kv": x["kv"], "label": x["area"],
     "why": "below 220 kV" if x["kv"] < 220 else "plant-side switchyard"} for x in EXCLUDED]
# FILENAME RECONCILED 29 Aug 2026. This wrote nodal/hydra_central_split_draft.json
# while build_capacity.py has always READ nodal/supply_area_split_draft.json. The file
# on disk carries the second name, so re-running this script would have created a
# SECOND draft under the old name and the generator would have gone on reading the
# stale one - silently, because both files would exist and look plausible.
# The reader is the authority: this now writes the name build_capacity.py expects.
# If you rename again, change BOTH or neither.
OUT = "nodal/supply_area_split_draft.json"
json.dump(out, open(OUT, "w"), indent=1, ensure_ascii=False)

print("Contracted capacity by supply area (BW1-BW4 + CSP window, Northern Cape projects):")
for reg in sorted(agg):
    tot = round(sum(agg[reg].values()), 1)
    print(f"  {reg:16s} {tot:8.1f} MW   " + "  ".join(f"{k} {v}" for k, v in sorted(agg[reg].items())))
tb = [r for r in rows if r["tiebreak"]]
sited = [r for r in rows if r["town_confidence"] == "site"]
print(f"\n{len(sited)} placed by real site coordinates (town centroid bypassed):")
for r in sited:
    print(f"  {r['name'][:38]:38s} {r['mw']:7.2f} MW  -> {r['nearest']} {r['km']} km ({r['region']}), "
          f"2nd {r['second']} {r['second_km']} km ({r['second_region']}), margin {r['second_km']-r['km']:.1f} km")
print(f"\n{len(tb)} resolved by tie-break (cross-area, under {TIEBREAK_KM} km apart, kept published province):")
for r in tb:
    print(f"  {r['name'][:38]:38s} {r['mw']:7.2f} MW  {r['tiebreak']}")
print(f"\n{len(flagged)} of {len(rows)} projects flagged for review "
      f"(nearest two substations in DIFFERENT supply areas, within {AMBIGUITY_KM} km, no tie-break)")
for r in flagged:
    print(f"  {r['name'][:38]:38s} {r['mw']:7.2f} MW  {r['nearest']} ({r['km']} km, {r['region']}) "
          f"vs {r['second']} ({r['second_km']} km, {r['second_region']})")
