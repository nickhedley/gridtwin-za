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
    const KEEP = ['scenarioYear','newWindMW','newPvMW','newRooftopMW','newBattMW','newBattHours','newVrfbMW','newIronAirMW','newCcgtMW','newOcgtMW','newOcgdMW','newOffshoreMW','newNuclearMW','newPsMW','newPsHours','coalDecomMW','demandGrowthPct','demandBlockMW','windCapeMW','carbonTaxRPerT','dieselDecomMW','demandYear']; const stOut = {}; for (const k of KEEP) if (st[k] !== undefined) stOut[k] = st[k];
    // the build LP's own costs for the scenario year (R per kW-year, net of the capacity payment as bldBuildLP prices them), for the free-mix test
    const costs = (() => { try { const y = +(st.scenarioYear || 2026), S = { ...FIXED, ...st }, out = { year: y, disc: BLD_DISC, battPowerShare: (typeof BATT_POWER_SHARE !== 'undefined' ? BATT_POWER_SHARE : null), txRPerKWyr: S.txRPerKWyr ?? FIXED.txRPerKWyr, gridIntVreShare: S.bldGridIntVreShare ?? FIXED.bldGridIntVreShare, gridCost: S.bldGridCost ?? FIXED.bldGridCost, tech: {} };
      for (const t of ['wind','pv','pvtrk','batt','ocgt','ocgd','ccgt','rooftop']){ try { const m = t === 'batt' ? (typeof BATT_POWER_SHARE !== 'undefined' ? BATT_POWER_SHARE : 1) : 1;
        out.tech[t] = { netAnnuity: bldNetAnnuityAt(t, y, m), gross: (bldAnnuity(bldCapex(t, y), BLD_LIFE[t], t) + bldFom(t, y)) * m, capex: bldCapex(t, y), fom: bldFom(t, y), life: BLD_LIFE[t], capPay: capPayRate(t) * (BLD_DERATE[t] ?? 0),
          gridAnn: (typeof bldGridAnn === 'function' ? bldGridAnn(t === 'pvtrk' ? 'pv' : t, S) : null), gridConn: (typeof bldGridCapexKW === 'function' ? bldAnnuity(bldGridCapexKW(t === 'pvtrk' ? 'pv' : t, S), BLD_GRID.lifeY, 'grid') : null) }; } catch (e) { out.tech[t] = { error: String(e.message).slice(0, 120) }; } }
      try { out.battEnergyRkWhyr = (bldAnnuity(bldCapex('batt', y), BLD_LIFE.batt, 'batt') + bldFom('batt', y)) * (1 - BATT_POWER_SHARE) / 4; } catch (e) { out.battEnergyRkWhyr = null; }
      try { out.pace = Object.fromEntries(Object.entries(BLD_PACE).map(([k, v]) => [k, v])); } catch (e) {}
      try { out.mcCoal = S.costCoal + S.vomCoal, out.mcCcgt = S.costCcgt + S.vomCcgt; } catch (e) {}
      return out; } catch (e) { return { error: String(e.message).slice(0, 160) }; } })();
    return JSON.stringify({ build: BUILD_STAMP, weatherYear: yy, seed: st.outageSeed, state: { ...stOut, ...over }, costs,
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