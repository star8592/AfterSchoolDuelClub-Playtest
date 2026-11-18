#!/usr/bin/env python3
"""R168 fail-closed Chrome CPU sampling and rejected diagnostics/warmup audit."""
from pathlib import Path
import json,shutil
SRC=Path('/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118/r168-cpu-profile')
OUT=Path(__file__).resolve().parent/'evidence/r168-cpu-profile'
OUT.mkdir(parents=True,exist_ok=True)
inputs=[
 ('r168-cpu-profile-summary.json','original-unmodified'),
 ('r168-cpu-profile-disabled.json','skip-shader-log'),
 ('r168-cpu-profile-actual-prewarm.json','compile-real-spell'),
 ('r168-cpu-profile-offscreen-draw.json','render-hidden-spell')]
cases=[]
for name,variant in inputs:
 path=SRC/name
 assert path.exists(),path
 d=json.loads(path.read_text())
 assert len(d['cases'])==2 and not d['errors'],(variant,d['errors'])
 assert d['assets']['models']==16 and d['assets']['cards']==60
 assert d['assets']['bytes']==75569762 and d['assets']['sourceVerified']
 if variant!='original-unmodified':
  assert d['shaderLinkAudit']['passed'] and d['shaderLinkAudit']['checked']>=150
 first,repeat=d['cases']
 def longest(c):
  return max([t['duration'] for t in c['finished']['tasks']],default=0)
 logs=['getProgramInfoLog','getProgramParameter','getShaderInfoLog','shaderSource']
 item={
  'variant':variant,'programsLinkAudited':d.get('shaderLinkAudit',{}).get('checked'),
  'shaderLinkPassed':d.get('shaderLinkAudit',{}).get('passed'),
  'firstCastLongTaskMs':longest(first),
  'repeatCastLongTaskMs':longest(repeat),
  'firstCastRAF99Ms':first['frame']['p99'],
  'repeatCastRAF99Ms':repeat['frame']['p99'],
  'warmupMs':d.get('warmup',{}).get('elapsedMs',0),
  'warmupMethod':d.get('warmup',{}).get('method') or
   ('compile' if d.get('warmup') else 'none'),
  'initialWebGLDiagnosticsCheckEnabled':d.get('assets',{}).get('shaderMode',{}).get('checkShaderErrors',True),
  'firstCastProfiledHotspotsMs':{
   fn:round(sum(x['selfMs'] for x in first['profile']['top'] if x['function']==fn),3)
   for fn in logs},
  'sampleCount':first['profile']['samples'],
 }
 cases.append(item)
 shutil.copy2(path,OUT/name)
 for phase in ('first','repeat'):
  for candidate in (SRC/f'r168-CPU-{phase}.cpuprofile',
                    SRC/f'r168-CPU-{variant}-{phase}.cpuprofile',
                    SRC/f'r168-CPU-{d.get("tag","default")}-{phase}.cpuprofile'):
   if candidate.exists():
    shutil.copy2(candidate,OUT/f'{variant}-{phase}.cpuprofile')
    break
  else:
   raise FileNotFoundError((variant,phase))
summary={
 'testDate':'2026-11-18',
 'realChromeCases':len(cases)*2,
 'source':'Original R147 with optional QA-only scene code; original asset hashes/sizes unchanged',
 'realModels':16,'allCards':60,'rawModelBytes':75569762,
 'testHost':'Z890 RTX5070Ti Chrome 157 Vulkan, CPU throttle x2',
 'cases':cases,
 'importantInterpretation':[
  'CPU profiler sampled self times cover an observation window and must NOT be equated with a single long-task wall duration',
  'First cast blocks on WebGL shader driver diagnosis/parameter queries, while repeat cast avoids most of that cost',
  'The actual hidden 4x4 render prewarm is extra work at load (792.7 ms) and did not remove first-cast stalls',
  'Disabling shader error checks moves the driver wait to getProgramParameter rather than fixing first-cast jank',
  'No technique in this group meets a no-regression/high-fidelity release standard',
  'This is Z890 desktop, NOT real Android',
 ],
 'releaseDecision':'NO-GO / draft / official R147 untouched'
}
(OUT/'r168-final-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
print('R168_FINAL',json.dumps(cases,ensure_ascii=False))
