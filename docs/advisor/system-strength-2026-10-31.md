# System strength and inertia: sources and the model change (advisor, 31 Oct 2026)

Copied from the advisor's project note of 31 Oct 2026 for Claude Code (messages 547, 549, 573). Figures as reported by research
helpers from the sources listed; "not verified" means not read in the primary document. Arithmetic marked "ours".

## What the model does today

- A 6,000 MW minimum synchronous generation floor every hour (SYNC_MIN_MW), "about 15% of peak": unsourced.
- Counts: coal (lifted if short), nuclear and hydro at output, 30% of all battery power as grid-forming (SYNC_GFM_SHARE,
  unsourced), synchronous condensers (SYNC_CONDENSER_MW = 0). New gas does not count.
- Grid-forming capability and condensers carry no cost in the build optimiser.

## Findings

No operator found sets the requirement as MW of synchronous generation scaled to peak. Operators set inertia (MW.s), fault
level (MVA at named nodes) or a minimum number of units online.

South Africa
- Largest credible contingency: three coal units, 3 x 720 = 2,160 MW, 2026/27-2030/31 (NTCSA Ancillary Services Technical
  Requirements, §3.4.2 p.9, signed 12 Jan 2026). The ASTR sets no inertia, fault level, rate-of-change-of-frequency or
  minimum-units requirement. New gas turbines must be able to run as synchronous condensers (§5.1C item 6, p.24). Batteries and
  renewables are excluded from black start until grid-forming technology matures (§4.1 item 13, p.15).
  https://www.ntcsa.co.za/wp-content/uploads/2026/01/ASTR-2026_27-2030_31.pdf
- Inertia minimum: 54 GW.s at 1 Hz/s, 108 GW.s at 0.5 Hz/s (Stellenbosch CRSES, Insights into inertia management, Jul 2025,
  unpaginated); ours: 2,160 MW x 50 Hz / (2 x 1 Hz/s) = 54 GW.s. The only rate-of-change limit cited is 1.5 Hz/s in the Renewable
  Power Plant Grid Code (not verified in the code).
  https://www.crses.sun.ac.za/wp-content/uploads/2025/05/Insights-into-inertia-management.pdf
- CSIR (Oloo et al., Cigre C2-10675, Aug 2024): light-load inertia about 100-110 GW.s; about 40 GW.s tolerable with well-designed
  fast frequency response.
- CSIR (Chown, Wright et al., Cigre 2017, abstract only): at 1 Hz/s, inertia short in about 5% of hours in 2030 and almost half in
  2050; adding inertia, condensers included, costs under 1% of system cost.
- TDP 2024 Rev2: 7 synchronous condensers, 5,850 MVAr in 2025-29 (Gromis, Aggeneis, Ferrum, Gamma, Koruson, Grassridge, Vuyani)
  and 1 unit, 900 MVAr, in 2030-34 (pp. 8, 51, 53-54). No cost given in the pages read.
  https://www.ntcsa.co.za/wp-content/uploads/2025/02/TDP-2024-Public-Report_Rev2.pdf
- Conversions of retired coal units (Eskom RT&D, Tomlinson et al., CIGRE Science & Engineering 33): Komati machines 139 MVA,
  H = 1.3 s (5.2 s with a flywheel); 2021 rand: R265m for the first ~100 MVAr unit, R132m each further unit; new 100 MVAr R411m,
  new 400 MVAr R700m. https://cse.cigre.org/cse-n033/repurposing-coal-power-station-generators-as-synchronous-condensers-on-the-south-african-grid
  Camden and Grootvlei two conversions each (Engineering News, Nov-Dec 2023): $20-50k/MVAr, new machines at least double.
- No grid-forming requirement found in South Africa. MTSAO 2027-2036 does not assess inertia or system strength (p.49).

International
- AEMO 2024 Inertia Report: mainland NEM requirement 36,200 MW.s from Dec 2027; South Australia minimum/secure 4,100/5,600 MW.s.
- South Australia: minimum synchronous units 4 -> 2 (2021, after ElectraNet's four condensers, A$166m) -> 1 (Aug 2025, demand
  above 600 MW); zero possible after EnergyConnect stage 2 (AEMO TPSS Dec 2025 p.29).
- AEMO has not accepted grid-forming batteries as a source of protection-grade fault current; trial launched Jul 2026 (TPSS
  pp. 27, 43). Fault current figures vary: NREL 2020 gives grid-forming inverters 4-6 pu for under 10 cycles, below 2 pu steady
  state; others give 1.1-1.5 pu against 3-5 pu (or 10 pu) for synchronous machines.
  https://aemo.com.au/-/media/files/major-publications/tpss/2025-transition-plan-for-system-security.pdf
- GB stability pathfinders: 12.5, 6.75 and 15.6 GVA.s; £5.3-8.9m per GVA.s a year (Frontier Economics). GB minimum inertia
  140 -> 120 GVA.s (2023).
- Ireland: SNSP 75% now, 95% by 2030; large units online 8 -> 7, to 3 or fewer by 2030; inertia floor 23 GVA.s; 1 Hz/s
  (EirGrid/SONI Operational Policy Roadmap 2025-2035).
- Costs: AEMO 2024 ISP App. 7 (p.21): system strength remediation up to A$137k per MW of new inverter capacity in REZs (upper
  bound); flywheel on a condenser A$1,818/MW.s (p.22). Grid-forming premium on a new battery about A$60-70k per 250 MW (testing
  only; GHD for ElectraNet, draft, p.13) or 5% of project cost (Transgrid MCC report, p.36); clutch on a new gas turbine for
  condenser mode A$0.75-5.9m per unit, O&M A$75-150k/yr (GHD, pp. 15-16). New condensers about US$0.45-0.9m per MVA (ERCOT,
  ISO-NE).
  https://wa.aemo.com.au/-/media/files/major-publications/isp/2024/appendices/a7-system-security.pdf?la=en
  https://electranet.com.au/wp-content/uploads/2025/04/02122024-ElectraNet-System-Strength-Options-Cost-Study_Draft-Public-Version.pdf
  https://www.transgrid.com.au/media/m5ycbumc/260825_transgrid_system-strength_final-mcc-report-1.pdf
- Cost of the requirement in planning studies: 0.01-0.22% of system cost (Ullmark et al. 2021, Renewable Energy 173); leaving it
  out at planning stage and enforcing afterwards adds 0.5-3.1% (Wogrin et al. 2020, arXiv 2007.04843); under 1% (CSIR 2017).

## The model change (messages 547, 549; minimum version for the note, 573)

1. Replace the 6 GW floor with an hourly inertia floor: sum of H x S online >= 50 x largest contingency / (2 x RoCoF limit).
   Central: the largest credible loss standing that year (2,160 MW while three 720 MW coal units can trip together, falling as
   coal retires), RoCoF 1 Hz/s; sensitivities 0.5 Hz/s and a flat 40 GW.s. One contingency value per year in the LP.
2. The floor goes into the build LP (representative days and stress windows) and the engine.
3. Count inertia only while a machine spins, at its own H: coal and nuclear as committed; pumped storage when pumping or
   generating; hydro at output; CSP; new gas whenever it runs, or in condenser mode at a small energy cost plus the clutch cost.
4. TDP 2024's condensers as committed plants (5,850 MVAr in 2025-29, 900 MVAr in 2030-34; H 1.3 s; flywheel 5.2 s as an
   option), and a condenser build option at Eskom's conversion and new-build costs.
5. Batteries: drop the free 30% credit. Grid-forming is a build choice at a 5% capex premium, counting toward inertia only (not
   fault level), limited each hour by the battery's unused power.
6. Fault level: for the note, a sensitivity only (a cost per kW of new inverter capacity beyond what the TDP-based grid charge
   covers; AEMO's A$137k/MW as the upper bound).
7. Report per scenario: hours below the floor, inertia by source, and the cost of meeting it. Check: on a plan close to CSIR's
   2030, the share of hours below a 1 Hz/s floor before condensers, against CSIR's about 5%.
8. Stated limitations: fault level national, not by substation; no voltage control; the 1 Hz/s limit borrowed from Ireland and
   AEMO, as South Africa has none. Full version after the note: TODO 14lt.
