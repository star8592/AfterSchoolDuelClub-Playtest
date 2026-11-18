#!/usr/bin/env python3
"""Audit first cast shader count and idle GPU tax for permanent light slots."""
import json,shutil
from pathlib import Path
SRC=Path('/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118/r167-light-slots')
OUT=Path(__file__).resolve().parent/'evidence/r167-light-slots'
OUT.mkdir(parents=True,exist_ok=True)
variants={}
examples=[]
for p in sorted(SRC.glob('r167-*.json')):
 d=json.loads(p.read_text())
 for row in d['experiments']:
  assert row['pass'] and not row['errors'],(p.name,row['variant'],row['errors'])
  assert row['before']['modelCount']==16 and row['before']['cards']==60
  assert row['before']['bytes']==75569762
  assert row['idle']['details']['gpu']['supported']
  assert row['before']['lights']['lights']['point']==4+row['n']
  assert len(row['casts'])==2 and all(x['after']['gpu']['n']>=70 for x in row['casts'])
  v=row['variant']
  idle=row['idle']['details']['gpu']
  first=row['casts'][0];last=row['casts'][1]
  arr={
   'experiment':p.name,'viewport':d['viewport'],'variant':v,
   'poolSlots':row['n'],
   'idleGpuMs':{k:idle[k] for k in ('n','p50','p95','p99','max')},
   'idleRaf':row['idle']['p95'],
   'programsBeforeFirstCast':first['start']['programs'],
   'programsAfterFirstCast':first['after']['shader']['programs'],
   'firstSpellProgramDifference':first['after']['shader']['programs']-first['start']['programs'],
   'firstCastLargestLongTaskMs':max([t['duration'] for t in first['after']['tasks']],default=0),
   'firstCastRafP95Ms':first['frame']['p95'],
   'firstCastRafP99Ms':first['frame']['p99'],
   'secondCastLargestLongTaskMs':max([t['duration'] for t in last['after']['tasks']],default=0),
   'poolOverflow':row['final']['slots'].get('overflow',0),
   'poolPeak':row['final']['slots'].get('peak',0),
   'poolActiveAfter':row['final']['slots'].get('active',0)
  }
  variants.setdefault((d['viewport'],v),[]).append(arr)
  examples.append(arr)
 shutil.copy2(p,OUT/p.name)
 for row in d['experiments']:
  for kind in ('idle','spell'):
   f=SRC/f"r167-{d['viewport']}-{row['variant']}-{kind}.png"
   if f.exists():shutil.copy2(f,OUT/f.name)
for view in ('desktop','mobile'):
 base=variants.get((view,'baseline'),[])
 if not base:continue
 ref=base[0]['idleGpuMs']['p50']
 for key,vals in variants.items():
  if key[0]!=view or key[1]=='baseline':continue
  for item in vals:
   item['idleMedianGpuChangePctVsFirstBaseline']=round(
    100*(item['idleGpuMs']['p50']/ref-1),2)
summary={'testedCases':len(examples),'allPassed':True,
 'realModelsUnchanged':16,'realCardsUnchanged':60,'realModelBytes':75569762,
 'hardware':'Z890 Chrome Vulkan RTX5070Ti; mobile viewport is NOT Android hardware',
 'experiments':examples,
 'visualQuality':'No spell geometry, materials, animations or point-light brightness/coordinates changed in opt-in variants; whole-frame pixel equivalence is NOT asserted',
 'releaseStatus':'NO-GO pending idle GPU budget and true mobile evidence',
 'productionDefaultChanged':False}
(OUT/'r167-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
print('R167_FINAL',json.dumps(summary,ensure_ascii=False)[:6000])
