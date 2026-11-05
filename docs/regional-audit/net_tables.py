"""Markdown tables for docs/regional-audit.md section 717 (c), built from the net_*.json results."""
import json, glob
S='/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad/'
R={}
for f in sorted(glob.glob(S+'net_*.json')):
    d=json.load(open(f)); R[(d['year'], d['weatherYear'], d['case'], d['siting'], d['losses'], d['coalmin'])]=d
def g(d,c): return d['E_TWh'].get(c,0.0)
def row(d): return dict(coal=g(d,'coal'), gas=g(d,'ccgt')+g(d,'ocgt'), diesel=g(d,'diesel'), wind=g(d,'wind'), pv=g(d,'pv'), curt=d['curtailedTotalTWh'], curtW=d['curtailedTWh'].get('wind',0), curtP=d['curtailedTWh'].get('pv',0), uns=d['unservedGWh'], sto=sum(d['storageDischargeTWh'].values()), cost=d['fuelAndCarbonRbn'])
out=[]
out.append('| year, weather year | coal, engine | LP free | LP, engine commitment floor | LP, engine coal fixed | curtailed, engine | free | floor | fixed | storage discharge, engine | free | floor | fixed |')
out.append('|---|---|---|---|---|---|---|---|---|---|---|---|---|')
for y in (2035,2040):
    for wy in ('2025','2015'):
        e=R.get((y,wy,'nolimit','reea',0,0)); 
        if not e: continue
        E=e['engine']['E_TWh']; r0=row(e); r1=R.get((y,wy,'nolimit','reea',0,1)); r2=R.get((y,wy,'nolimit','reea',0,2))
        f=lambda d,k: ('%.1f'%row(d)[k]) if d else '-'
        out.append(f"| {y}, {wy} | {E.get('coal',0):.1f} | {r0['coal']:.1f} | {f(r1,'coal')} | {f(r2,'coal')} | {E.get('curtailed',0):.1f} | {r0['curt']:.1f} | {f(r1,'curt')} | {f(r2,'curt')} | {E.get('ps',0)+E.get('batt',0):.1f} | {r0['sto']:.1f} | {f(r1,'sto')} | {f(r2,'sto')} |")
out.append('')
out.append('| year, weather year | case | curtailed, TWh | of it wind | solar | unserved, GWh | coal, TWh | gas | diesel | storage discharge | fuel and carbon, R bn | corridors with a shadow price over 4,000 hours (value of one more MW, R m a year) |')
out.append('|---|---|---|---|---|---|---|---|---|---|---|---|')
label={'n0':"today's limits as drawn (N-0)",'n1':'N-1 (0.7 x today)','n1tdp':'N-1 with TDP lines by year'}
for y in (2035,2040):
    for wy in ('2025','2015'):
        b=R.get((y,wy,'nolimit','reea',0,0))
        if not b: continue
        rb=row(b)
        for case,site,L,C in (('n0','reea',0,0),('n1','reea',0,0),('n1tdp','reea',0,0),('n1','reea',1,0),('n1','fleet',0,0),('n1','reea',0,1)):
            d=R.get((y,wy,case,site,L,C))
            if not d: continue
            base=R.get((y,wy,'nolimit','reea',0,C))
            if not base: continue
            rb2=row(base); r=row(d)
            lab=label[case]+(', losses 6%/1,000 km' if L else '')+(', fleet siting' if site=='fleet' else '')+(', engine commitment floor' if C==1 else '')
            bind=[f"{f['a']} to {f['b']} ({f.get('bindingHours',0)} h, R{f.get('shadowRperMWyr',0)/1e6:.1f}m)" for f in sorted(d['corridors'], key=lambda x:-x.get('shadowRperMWyr',0)) if f.get('bindingHours',0)>=4000]
            out.append(f"| {y}, {wy} | {lab} | {r['curt']-rb2['curt']:+.1f} | {r['curtW']-rb2['curtW']:+.1f} | {r['curtP']-rb2['curtP']:+.1f} | {r['uns']-rb2['uns']:+.1f} | {r['coal']-rb2['coal']:+.1f} | {r['gas']-rb2['gas']:+.1f} | {r['diesel']-rb2['diesel']:+.2f} | {r['sto']-rb2['sto']:+.1f} | {r['cost']-rb2['cost']:+.1f} | {'; '.join(bind[:6])} |")
d0=next(iter(R.values()))
out.append(''); out.append('Siting shares of new wind and solar by supply area (approved REEA records through their nearest substation): wind ' + ', '.join(f"{k} {v:.0%}" for k,v in sorted(d0['siting_shares']['wind'].items(), key=lambda x:-x[1]) if v>0.005) + '; solar ' + ', '.join(f"{k} {v:.0%}" for k,v in sorted(d0['siting_shares']['solar'].items(), key=lambda x:-x[1]) if v>0.005) + '.')
# curtailment by area for the n1 cases
for y in (2035,2040):
    d=R.get((y,'2025','n1','reea',0,0)); t=R.get((y,'2025','n1tdp','reea',0,0))
    if d: out.append(f"Curtailment by area, {y}, weather year 2025, N-1: " + ', '.join(f"{k} {v:.1f}" for k,v in sorted(d['curtailedByRegionTWh'].items(), key=lambda x:-x[1]) if v>0.05) + ' TWh' + (('; with TDP lines: ' + ', '.join(f"{k} {v:.1f}" for k,v in sorted(t['curtailedByRegionTWh'].items(), key=lambda x:-x[1]) if v>0.05) + ' TWh') if t else '') + '.')
print('\n'.join(out))
open(S+'net_tables.md','w').write('\n'.join(out))
