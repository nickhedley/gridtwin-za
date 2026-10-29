// plain.js: one plain name and one-line description per run code, for everything the reviewer reads (user, 29 Oct 2026, message 503
// (b) and (c)). packfill.js writes the glossary in section 7 of the reviewer pack from this table, names missing results by it and
// checks that the cover note, the introduction and section 6 carry no run code; settables.js may label table rows from it.
// Keys are run codes without the set suffix ('s_gas2032', not 's_gas2032_c6e'); 'base' is the central run, 'irp' the IRP build.
const PLAIN = {
  base:               ['the least-cost plan', "the model's own least-cost build on the central assumptions"],
  irpdem:             ["the least-cost plan at IRP 2025's demand", "the same optimisation on IRP 2025's own Moderate demand forecast"],
  null:               ['no new build', 'the existing fleet alone, for the cost of doing nothing'],
  irp:                ["IRP 2025's build", "IRP 2025's Table 1 build run through the same hourly model on the same inputs"],
  irp_irpdem:         ["IRP 2025's build at its own demand", "IRP 2025's build at its own Moderate demand forecast"],
  irp_nuc12000:       ["IRP 2025's build, nuclear at USD 12,000/kW", "the IRP build with nuclear capex at the high case"],
  irp_nuclife60:      ["IRP 2025's build, 60-year nuclear life", 'the IRP build with nuclear annuitised over 60 years'],
  irp_irpdem_nuc12000:["IRP 2025's build at its own demand, nuclear at USD 12,000/kW", 'as above, at the IRP demand'],
  irp_irpdem_nuclife60:["IRP 2025's build at its own demand, 60-year nuclear life", 'as above, at the IRP demand'],
  s_gas2032:          ['gas allowed from 2032', 'new gas may be built from 2032 instead of 2035'],
  s_gas2030:          ['gas allowed from 2030', 'new gas may be built from 2030'],
  s_gas2035_nodsl:    ['no new diesel peakers', 'the central without new open-cycle plant on diesel'],
  s_gascapex25:       ['gas capex 25% higher', 'CCGT and open-cycle capex raised a quarter'],
  s_nogas:            ['no new gas or diesel peakers', 'no new gas plant of any kind and no new diesel open-cycle'],
  s_nogas_maxp6:      ['no new gas or diesel peakers, pass limit 6', 'the no-gas run with the optimiser allowed six passes instead of the default (messages 508, 510)'],
  s_nogas_maxp10:     ['no new gas or diesel peakers, pass limit 10', 'the no-gas run with the optimiser allowed ten passes, run if six still fall short (message 510)'],
  s_nogas_dsl:        ['no new gas, diesel peakers allowed', 'no new gas plant; new open-cycle on diesel may be built'],
  s_std_strict:       ['half the Australian standard', 'planned to half of 0.002% of customer demand instead of NTCSA’s 20 GWh'],
  s_std_nem:          ['the Australian standard', 'planned to 0.002% of customer demand'],
  s_std_strict_nogas: ['no new gas or diesel peakers, half the Australian standard', 'not run: the solve exceeds two hours'],
  s_std_nem_nogas:    ['no new gas or diesel peakers, Australian standard', 'not run: the solve exceeds two hours'],
  s_std_strict_nogas_dsl:['no new gas, diesel peakers allowed, half the Australian standard', 'as its name says'],
  s_std_nem_nogas_dsl:['no new gas, diesel peakers allowed, Australian standard', 'as its name says'],
  s_ntcsa_both:       ['planned to both NTCSA criteria', 'the open-cycle capacity factor under 6% enforced in the plan, not only reported'],
  s_cocplan:          ['one 8% rate for every technology', 'the planning convention: every technology at the 8% discount rate'],
  s_cocprivate:       ['private-sector rates for wind, solar and batteries', 'wind and solar 1.5 points and batteries 2 points above the state-backed rates'],
  s_cochigh:          ['high cost of capital', "every rate on the IEA's South African solar level, 9% real"],
  s_coclow:           ['low cost of capital', 'every rate one point below the central; network unchanged'],
  s_irpgas:           ["IRP 2025's gas plan with its 51% minimum", '6 GW of new combined-cycle gas required to run at least 51% of the time from 2030, on the IRP’s own gas dates'],
  s_imp:              ['imports kept to 2040', 'the Cahora Bassa flow continues after 2030'],
  s_demlowflat:       ['flat demand', 'no demand growth after 2026'],
  s_demlowm1:         ['demand falling 1% a year', 'demand falls 1% a year from 2026'],
  s_coalpractice:     ['coal practice floor held to 2040', 'the 2026 coal operating floor kept to 2040 instead of ending in 2029'],
  s_coalsustain:      ['coal sustaining capital charged', 'R500/kW-yr of sustaining capital on existing coal'],
  s_rate48:           ['the 48-hour coal commitment rule', "the build optimiser's earlier rule: commitment moving at most 1/48 of available coal an hour"],
  s_spotoil:          ['coal starts fuelled at spot oil prices', 'start-up fuel priced at spot fuel oil instead of the central assumption'],
  s_wearp75:          ['high coal cycling wear', 'start wear costs at the 75th percentile of NREL’s range'],
  s_koeberg_winter:   ["Koeberg's winter outages", 'Koeberg on its 2025–26 monthly shape, winter outages repeated, same annual output'],
  s_carbontreasury:   ["Treasury's carbon price path", 'allowances cut to none from 2031, then a straight line to USD 120/t in 2050'],
  s_carbonhold:       ['2030 carbon rate held', 'the 2030 statutory rate held from 2031 instead of the effective rate'],
  s_be6:              ["IRP 2025's build schedule forced", "the optimiser made to build IRP 2025's Table 1 schedule"],
  s_be7:              ["IRP 2025's nuclear forced", "5.2 GW of nuclear built in 2036–39 as IRP 2025 schedules it"],
  s_windhigh:         ['high wind capex', 'onshore wind at disclosed project investment values, about R30,000/kW'],
  s_windlow:          ['low wind capex (dropped)', "wind at the capex BW5's tariff implies; dropped from the 28 October set as it counts wind's finance twice"],
  s_mindn24:          ['24-hour coal down time', 'the 24-hour minimum down time as a sensitivity on the 26 October version (central from 27 October)'],
  s_prm10:            ['10% planning reserve margin', 'the build optimiser holds firm capacity at 1.10 times the peak (off in the central)'],
  s_coal60:           ["coal retiring on IRP 2025's 60-year line", 'coal retirement dates from the 60-year line of Figure 3 instead of the 50-year line'],
  s_pvbw6:            ["solar on BW6's bid capex at 8%", 'the 27 October version with every technology on construction cost at 8% real'],
  s_disc5:            ['every technology at 5% real', 'the 27 October version with every technology on construction cost at 5% real'],
  s_discirp:          ["every technology at IRP 2025's 11.3%", 'the 27 October version with every technology at 11.3%'],
};
// Versions of the central, by the date of the build each ran on.
const VERSIONS = { c4:'the 12 October version', c5:'the 14 October version', c5b:'the 14 October version (second)', c5c:'the 14 October version (third)', c5b_14r:'the 14 October version', c5d:'the 15 October version', c5e:'the 16 October version', c5f:'the 17 October version',
  c6:'the 25 October version', c6a:'the 26 October version', c6b:'the 4-hour down-time variant', c6c:'the 27 October version',
  c6e:'the 28 October version' };
// A run name with or without a set suffix, e.g. 's_gas2032_c6e' or 'irp2025_c6e_cocplan', to its plain name.
function plainName(n){
  if (!n) return n; let r=n;
  const m=r.match(/^irp2025_(c\d[a-z]?)(?:_(.+))?$/); if (m) r=m[2]?('irp_'+m[2]):'irp';
  r=r.replace(/_c\d[a-z]?$/,'').replace(/^(c\d[a-z]?)_irpdem$/,'irpdem').replace(/^c\d[a-z]?$/,'base').replace(/^null$/,'null');
  return (PLAIN[r]||[])[0]||n;
}
module.exports={PLAIN,VERSIONS,plainName};
