"""Summarise the PyPSA network cases (message 717 (c)): tie-out against the engine, and every case as a difference from no limits."""
import json, glob, os, sys
S='/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad/'
files=sorted(glob.glob(S+'net_*.json')); R={}
for f in files:
    try: d=json.load(open(f))
    except Exception as e: print('bad', f, e); continue
    key=(d['year'], d['weatherYear'], d['case'], d['siting'], d['losses'], d['coalmin']); R[key]=d
def g(d,c): return d['E_TWh'].get(c,0.0)
def row(d):
    gas=g(d,'ccgt')+g(d,'ocgt'); sto=sum(d['storageDischargeTWh'].values())
    return dict(coal=g(d,'coal'), gas=gas, diesel=g(d,'diesel'), wind=g(d,'wind'), pv=g(d,'pv'), curt=d['curtailedTotalTWh'], curtW=d['curtailedTWh'].get('wind',0), curtP=d['curtailedTWh'].get('pv',0), unsGWh=d['unservedGWh'], sto=sto, cost=d['fuelAndCarbonRbn'], obj=d['objectiveRbn'])
print('== Tie-out: no limits against the engine (TWh; unserved GWh)')
for (y,wy,case,site,L,C),d in sorted(R.items()):
    if case!='nolimit' or site!='reea' or L: continue
    e=d['engine']['E_TWh']; r=row(d)
    print(f"{y} wy{wy} coalmin={C}: coal {e.get('coal',0):.2f}->{r['coal']:.2f} | gas {e.get('ccgt',0):.2f}->{r['gas']:.2f} | diesel {e.get('diesel',0):.3f}->{r['diesel']:.3f} | wind {e.get('wind',0):.2f}->{r['wind']:.2f} | pv {e.get('pv',0):.2f}->{r['pv']:.2f} | curtailed {e.get('curtailed',0):.2f}->{r['curt']:.2f} | storage dis {e.get('ps',0)+e.get('batt',0):.2f}->{r['sto']:.2f} | unserved {d['engine']['shedGWh']:.2f}->{r['unsGWh']:.2f} GWh | solve {d['secs']:.0f}s")
print('\n== Cases as differences from no limits (same year, weather year, siting reea, no losses, coalmin 0 unless stated)')
for (y,wy,case,site,L,C),d in sorted(R.items()):
    base=R.get((y,wy,'nolimit','reea',0,C))
    if case=='nolimit' or not base: continue
    r=row(d); b=row(base)
    bind=sorted([(f['a']+'-'+f['b'], f['hoursAtLimit'], round(f['GWh'])) for f in d['corridors'] if f['hoursAtLimit']>0], key=lambda x:-x[1])
    print(f"{y} wy{wy} {case} {site} losses={L} coalmin={C}: curtailed {r['curt']-b['curt']:+.2f} TWh (wind {r['curtW']-b['curtW']:+.2f}, pv {r['curtP']-b['curtP']:+.2f}) | unserved {r['unsGWh']-b['unsGWh']:+.2f} GWh | coal {r['coal']-b['coal']:+.2f} | gas {r['gas']-b['gas']:+.3f} | diesel {r['diesel']-b['diesel']:+.3f} | storage {r['sto']-b['sto']:+.2f} | fuel+carbon {r['cost']-b['cost']:+.2f} Rbn ({100*(r['cost']-b['cost'])/b['cost']:+.1f}%) | objective {r['obj']-b['obj']:+.2f} Rbn")
    print('     binding (hours at 98% of limit, GWh):', bind[:7])
    print('     curtailed by area TWh:', {k:round(v,2) for k,v in sorted(d['curtailedByRegionTWh'].items(), key=lambda x:-x[1]) if v>0.05})
d0=next(iter(R.values())); print('\nsiting shares (reea):', {t:{k:round(v,3) for k,v in sorted(s.items(), key=lambda x:-x[1]) if v>0.005} for t,s in d0['siting_shares'].items()})
