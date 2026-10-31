# Virtual power plants, behind-the-meter batteries and grid-enhancing technologies: modelling practice (advisor, 31 Oct 2026)

Copied from the advisor's project note of 31 Oct 2026 for Claude Code (messages 550, 573). "Secondary" means not read in the
primary document. The central behind-the-meter battery stock figure follows separately from the advisor.

## Virtual power plants and distributed flexibility

Practice
- Brattle, Real Reliability (May 2023, technical appendix pp. 10-19): bottom-up sizing, eligible devices x participation x kW per
  device; participation of eligible customers: thermostats 30%, water heaters 30%, EV charging 40%, home batteries 20% (1% of
  customers eligible); home battery 7.5 kW / 22.5 kWh, 15 events a year of 3 h; battery programme $140 a year non-incentive plus
  $500 a year incentive per participant. Net cost per kW-year for 400 MW of resource adequacy: VPP $42.85, utility battery $68.68,
  gas peaker $103.50 (helper's division of Table 4).
  https://www.brattle.com/wp-content/uploads/2023/04/Real-Reliability-The-Value-of-Virtual-Power-Technical-Appendix_5.3.2023.pdf
- Brattle for GridLab, California (Apr 2024): optimised dispatch within programme limits, value stacking without double
  counting; batteries 100 events of 2 h; EVs 150 events of 4 h.
- AEMO (2025 CER forecast; 2024 and 2026 ISP): battery uptake an input; passive and coordinated storage separate; coordination
  share by scenario; 90% round trip, 1.8% a year degradation; solar-plus-battery homes cut evening peak about 1 kW per household
  against solar-only (secondary).
  https://www.aemo.com.au/-/media/files/stakeholder_consultation/consultations/nem-consultations/2025/draft-2026-fau/aemo-2025-distributed-pv-and-batteries-vpp-forecast-report.pdf
- E3 RESOLVE: shed demand response as a linear build option up to a potential cap, with call limits per year, month and day,
  maximum duration and an availability profile. https://docs.ethree.com/projects/resolve/en/latest/system/electric/resources/shed_dr.html
- NREL (2022): EV managed charging with participation as a sensitivity (5%, 30%, 100%).
- US DOE Liftoff VPPs (2023; 2025 update): US VPPs 30-60 GW in 2023; net cost 40% below a utility battery and 60% below a peaker;
  best programmes about 50% enrolment.

Measured performance
- California DSGS batteries, 2024: about 91 MW above baseline from 270 MW nameplate (about 34%)
  (https://efiling.energy.ca.gov/GetDocument.aspx?tn=266629); test on 29 Jul 2025, 539 MW average from over 100,000 batteries
  for 2 h (secondary).
- PG&E ELRP VPP group, 2023: 2.96 kW per site average per event.
- Octopus Saving Sessions 2022/23: 128 MW average, about 700,000 participants.
- South Australia VPP: about 1.9 MW of 2 MW in under 10 seconds (frequency event, 2020).

South Africa
- Rooftop solar above 8.3 GW (NTCSA, Jun 2026); 675,000 households with solar (Stats SA 2025). No published estimate of installed
  home or business battery MWh; GreenCape: business behind-the-meter batteries about 400 MWh a year at about R5,000/kWh installed
  (Energy Services 2025, pp. 24-25). https://greencape.co.za/wp-content/uploads/2025/04/Energy-Services-2025.pdf
- Eskom residential and small business demand response pilot: up to 50 MW, 1-5 MW per aggregator, at least 1 h, at most
  2 events a day and 500 h a year (2023, secondary). Supplemental Demand Response: minimum 500 kW, at least 2 h; contracted MW not
  published. Cape Town Power Heroes: 60 MW target, geysers and pool pumps, no results published.

Minimum for the note (573)
1. Behind-the-meter batteries: a passive share on a self-consumption profile (charging from rooftop surplus, discharging in the
   evening) as an input path, and a coordinated share dispatched as storage. Cases 1, 3 and 5 GWh until the central stock figure.
2. A VPP build option sized from device counts x enrolment x kW, limited by events and duration, credited at delivered, not
   nameplate, capacity (about a third of nameplate in DSGS's first year), with a programme cost per kW-year (about $43/kW-yr,
   Brattle 2023), linear up to a cap. Decision point Thu 5 Nov midday: in c7 if it passes the suite, otherwise a sensitivity.
3. Full version after the note: TODO 14lu.

## Grid-enhancing technologies (after the note)

Practice
- PyPSA-Eur: hourly dynamic line rating from ERA5 weather (atlite), capped by a maximum rating factor (example 1.3). Glaum and
  Hofmann (TU Berlin, arXiv 2208.04716): capacity +52% at high wind, about +20% at low solar.
- RMI/Quanta, PJM (Feb 2024): DLR as a flat 10% uprate on overloaded lines when wind exceeds 3 ft/s; then power flow control, then
  topology optimisation; +6.6 GW by 2027. https://rmi.org/wp-content/uploads/dlm_uploads/2024/02/GETs_insight_brief_v3.pdf
- Brattle/WATT, Kansas and Oklahoma (2021): GETs raised hostable new renewables from 2,580 to 5,250 MW for about $90m upfront plus
  $10m a year. https://watt-transmission.org/unlocking-the-queue/
- Measured DLR gains: Oncor +6-14% for 84-91% of the time; Elia up to +30%; NREL: full DLR 8% above static in half of hours, but
  ratings fall below static in hot, calm hours (ambient-adjusted 4% below static in 20% of hours for half of lines).
  https://nrel.gov/docs/fy25osti/91599.pdf
- Reconductoring with advanced conductors: +50-110% capacity in 18 months to 3 years, under half the cost of new lines for the same
  capacity (Berkeley/GridLab 2024, secondary).
- Storage as transmission: Waratah, 700 MW contracted to Transgrid as a protection scheme; capacity used this way must be kept out
  of energy arbitrage.

South Africa
- GCCA 2025: 0 MW connection capacity in the Northern, Western and Eastern Cape and Hydra Central.
- TDP 2024 public forum (30 Oct 2024): phase 1 "enhance and optimise existing corridors", listing DLR, power flow controllers,
  topology optimisation and high-temperature low-sag conductors; 14,494 km of new lines in 2025-34 against industry capacity of
  about 800 km a year; new lines take 8-10 years. No NTCSA DLR pilot, NERSA position or South African reconductoring cost found.

Minimum for the model (after the note, 550 items 3-4)
1. Apply the heat-stress line-rating derating to transfer limits in hot, calm hours (computed today, not applied).
2. DLR as an hourly, wind-linked uplift on corridors capped at 1.3, or a flat 10% in windy hours, as a sensitivity.
3. Reconductoring as a build option on existing corridors (about twice the capacity, 1-3 year lead time), as a sensitivity until
   a South African cost is found; check overlap with the TDP-based grid charge.
