(function(){
    const over = __OVER__; const yy = __WY__;
    const nat = weatherYearNational(yy); const st = { ...state, ...over, outageSeed: __SEEDBASE__ + __K__ * 104729 + (+yy) * 7919 };
    const prof = { demand: PROFILES.demand, solar: nat.solar, wind: nat.wind, csp: PROFILES.csp, real: true };
    const x = simulate(st, prof, undefined);
    const p = { ...FIXED, ...st };
    const A = a => a ? Array.from(a) : null;
    // the engine's own per-unit series (as simulate forms windU and solarU above its hourly loop)
    const wind = nat.wind, solar = nat.solar;
    const mod = (typeof windModOf === 'function' && ((p.bldWindModern ?? FIXED.bldWindModern) | 0) > 0) ? windModOf(wind) : null;
    const kW = mod ? windNewCorr(p.bldWindCorr) : 1;
    const trk = (((p.bldPvTracking ?? 0) | 0) > 0) ? solarTrkOf(solar) : null;
    const xs = solar.trkOwn ? (existPvTrackShareAt(p) ?? 0) : 0;
    const off = (typeof offshoreSeriesFor === 'function') ? offshoreSeriesFor(nat) : (typeof OFFSHORE_PU !== 'undefined' ? OFFSHORE_PU : null);
    const sum = a => a ? Array.from(a).reduce((q, v) => q + v, 0) : null;
    return JSON.stringify({ build: BUILD_STAMP, weatherYear: yy, seed: st.outageSeed, state: over,
      p: { windMW: p.windMW, pvUtilityMW: p.pvUtilityMW, rooftopMW: p.rooftopMW, cspMW: p.cspMW, nuclearMW: p.nuclearMW, hydroMW: p.hydroMW, hybridMW: p.hybridMW, importsMW: p.importsMW, importsCF: p.importsCF, importsEndYear: p.importsEndYear,
           coalInstalledMW: p.coalInstalledMW, coalEAFPct: p.coalEAFPct, ocgtDieselMW: p.ocgtDieselMW, psPowerMW: p.psPowerMW, psEnergyMWh: p.psEnergyMWh, psEff: p.psEff, battPowerMW: p.battPowerMW, battHours: p.battHours, battEff: p.battEff,
           nuclearCF: p.nuclearCF, hydroCF: p.hydroCF, rooftopDerate: p.rooftopDerate, costCoal: p.costCoal, vomCoal: p.vomCoal, costCcgt: p.costCcgt, vomCcgt: p.vomCcgt, costDiesel: p.costDiesel, vomDiesel: p.vomDiesel, costNuclear: p.costNuclear, costHydro: p.costHydro, costImports: p.costImports,
           emisCoal: p.emisCoal, emisCcgt: p.emisCcgt, emisDiesel: p.emisDiesel, carbonTaxRPerT: p.carbonTaxRPerT, voll: p.voll, reserveOperatingMW: p.reserveOperatingMW, exportMW: p.exportMW, bldWindModern: p.bldWindModern, bldWindCorr: p.bldWindCorr, bldPvTracking: p.bldPvTracking, congestionCurtailPct: p.congestionCurtailPct, congestionCurtailOn: p.congestionCurtailOn, kW, xs },
      E: x.E, shedMWh: x.shedMWh, systemCostR: x.systemCostR, fuelCost: x.fuelCost, co2: x.co2, caps: x.caps, dieselCap: x.dieselCap,
      means: { wind: sum(wind) / 8760, windMod: mod ? sum(mod) / 8760 : null, solar: sum(solar) / 8760, solarTrk: trk ? sum(trk) / 8760 : null, off: off ? sum(off) / 8760 : null, csp: sum(PROFILES.csp) / 8760, demand: sum(PROFILES.demand) / 8760 },
      hourly: { loadS: A(x.loadS), chargePs: A(x.chargePsMW), chargeBatt: A(x.chargeBattMW), curtail: A(x.curtailMW), congest: A(x.congestMW), exportMW: A(x.exportMW), coalAvailable: A(x.coalAvailableMW), coalCommitted: A(x.coalCommittedMW), reserveMW: A(x.reserveMW), drMW: A(x.drMW),
        stack: Object.fromEntries(Object.entries(x.stack).map(([k, v]) => [k, A(v)])),
        pu: { wind: A(wind), windMod: mod ? A(mod) : null, solar: A(solar), solarTrk: trk ? A(trk) : null, solarX: solar.trk ? A(solar.trk) : null, off: off ? A(off) : null, csp: A(PROFILES.csp), demand: A(PROFILES.demand), roof: (PROFILES.roof ? A(PROFILES.roof) : null) } } });
  })()