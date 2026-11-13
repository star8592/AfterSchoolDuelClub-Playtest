import subprocess,json,concurrent.futures,pathlib,os
names=[('ellie','E03'),('snow','G02'),('jay','G03'),('victoria','G04'),('rain','T03'),('rex','T04')]
d=pathlib.Path('r45-duel/assets/summons')
def run(pair):
 slug,id=pair;meta=json.loads((d/(f'{id}-'+{'E03':'Ellie','G02':'Snow','G03':'Jay','G04':'Victoria','T03':'Rain','T04':'Rex'}[id]+'-Skinned-R119.proof.json')).read_text())
 p=subprocess.run(['/home/master/.local/bin/blender','-b','--disable-autoexec',meta['source'],'--python','r45-duel/qa/r132-source-rig-preflight.py','--',slug],capture_output=True,text=True,timeout=120)
 lines=[s.split('R132_PREFLIGHT_JSON ',1)[1] for s in p.stdout.splitlines() if 'R132_PREFLIGHT_JSON ' in s]
 if p.returncode!=0 or not lines:raise RuntimeError(slug+':'+p.stderr[-700:]+p.stdout[-900:])
 a=json.loads(lines[0]);return id,a
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
 rows=dict(pool.map(run,names))
for id,a in rows.items():
 print('R132_RIG',id,'rig',a['rig'],'bones',a['rigBones'],'geo',a['geo'],'sourceVertices',a['meshVertices'],
 'FK',[x['name'] for x in a['controls'] if x['name'].startswith('FK-Upper')],flush=True)
p=pathlib.Path('r45-duel/qa/evidence/r132');p.mkdir(exist_ok=True,parents=True)
(p/'six-source-rig-preflight.json').write_text(json.dumps(rows,indent=2,ensure_ascii=False))
print('R132_SIX_RIGS_PREFLIGHT_PASS',len(rows),flush=True)
