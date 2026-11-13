"""R132 isolated original source Blender conversion with per-actor receipts."""
import pathlib,subprocess,concurrent.futures,json,sys,time
MODELS={'E03':('ellie','Ellie'),'G02':('snow','Snow'),
 'G03':('jay','Jay'),'G04':('victoria','Victoria'),
 'T03':('rain','Rain'),'T04':('rex','Rex')}
codes=sys.argv[1:] or list(MODELS)
assert all(c in MODELS for c in codes)
d=pathlib.Path('r45-duel/assets/summons')
e=pathlib.Path('r45-duel/qa/evidence/r132');e.mkdir(parents=True,exist_ok=True)
def one(id):
 slug,display=MODELS[id]
 meta=json.loads((d/f'{id}-{display}-Skinned-R119.proof.json').read_text())
 output=d/f'{id}-{display}-Skinned-R132-BakedRest-PILOT.glb'
 cmd=['/home/master/.local/bin/blender','-b','--disable-autoexec',meta['source'],
      '--python','r45-duel/qa/r132-export-baked-rest-skin.py','--',slug,str(output)]
 start=time.monotonic()
 try:
  p=subprocess.run(cmd,capture_output=True,text=True,timeout=270)
  (e/f'{id}-blender-export.log').write_text(p.stdout[-10000:]+'\n'+p.stderr[-4000:])
  status='PASS' if p.returncode==0 and output.exists() else 'FAILED'
  result={'id':id,'source':meta['source'],'status':status,'seconds':round(time.monotonic()-start,1),
       'returncode':p.returncode,'bytes':output.stat().st_size if output.exists() else 0}
  if output.exists() and output.with_suffix('.proof.json').exists():
   proof=json.loads(output.with_suffix('.proof.json').read_text())
   result['proof']={k:proof.get(k) for k in ['status','sha256','r132FKShoulderSourceBaked','visibleSkinnedMeshes','exportedJoints','posedVerticesSampled']}
  if p.returncode:result['error']=p.stdout[-700:]+p.stderr[-700:]
  return result
 except Exception as exc:
  return {'id':id,'status':'FAILED','error':str(exc),'seconds':round(time.monotonic()-start,1)}
results=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=min(3,len(codes))) as pool:
 for res in concurrent.futures.as_completed([pool.submit(one,c) for c in codes]):
  r=res.result();results.append(r)
  print('R132_EXPORT',json.dumps(r,ensure_ascii=False),flush=True)
(e/('r132-source-bake-batch-'+('-'.join(codes))+'.json')).write_text(json.dumps(results,indent=2,ensure_ascii=False))
if any(r['status']!='PASS' for r in results):sys.exit(1)
print('R132_BATCH_SOURCE_BAKE_PASS',len(results),flush=True)
