#!/usr/bin/env python3
"""R85 explicit source-of-truth manifest and fail-closed character model audit."""
from pathlib import Path
import json,hashlib,struct,re
BASE=Path(__file__).resolve().parents[1]
registry=(BASE/'scene/summon-models.mjs').read_text()
specs=dict(re.findall(r"^ ([A-Z]\d\d):\{file:'([^']+)'",registry,re.M))
assert len(specs)==12,specs
retired=['E03-CheerCaptain-Schoolkid.glb','E04-CanteenRelay-FoodCourier.glb',
'G02-BlackboardExpert-ItEngineer.glb','G04-ClubDirector-OfficeManager.glb',
'T03-MailPair-DeliveryRider.glb']
assert not (set(retired)&set(specs.values()))
existing=json.loads((BASE/'assets/summons/runtime-assets.json').read_text())
old={x['card_id']:x for x in existing.get('models',[])}
source={
 'E03':('phil','https://studio.blender.org/characters/phil/v1/'),
 'E04':('gabby','https://studio.blender.org/characters/gabby/v3/'),
 'G02':('lunte','https://studio.blender.org/characters/lunte/v4/'),
 'G03':('jay','https://studio.blender.org/characters/jay/v1/'),
 'G04':('victoria','https://studio.blender.org/characters/victoria/v1/'),
 'T03':('ellie','https://studio.blender.org/characters/ellie/v1/'),
 'T04':('rex','https://studio.blender.org/characters/rex/v1/')
}
models=[]
for id,file in specs.items():
 p=BASE/'assets/summons'/file
 assert p.is_file() and p.stat().st_size>40000,p
 data=p.read_bytes();assert data[:4]==b'glTF'
 n,t=struct.unpack_from('<II',data,12)
 assert t==0x4E4F534A
 j=json.loads(data[20:20+n])
 triangles=0;targetMeshes=0
 for m in j.get('meshes',[]):
  for primitive in m.get('primitives',[]):
   a=j['accessors'][primitive['indices']]['count'] if 'indices' in primitive else j['accessors'][primitive['attributes']['POSITION']]['count']
   if primitive.get('mode',4)==4:triangles+=a//3
   if len(primitive.get('targets',[]))==3:targetMeshes+=1
 isnew=id in source
 if isnew:
  assert '-R85-Acting.glb' in file,(id,file)
  assert triangles>=20000 and targetMeshes>=5,(id,triangles,targetMeshes)
  weights=[w for m in j.get('meshes',[]) for w in m.get('weights',[])]
  assert len(weights)>=15 and set(weights)=={0},(id,set(weights))
 src=source.get(id)
 entry={
  'card_id':id,'file':file,'bytes':len(data),
  'sha256':hashlib.sha256(data).hexdigest(),
  'triangles':triangles,'mesh_count':len(j.get('meshes',[])),
  'native_animation_clips':len(j.get('animations',[])),
  'artist_rig_baked_morph_count':targetMeshes,
  'art_approved':False,
  'source_url':src[1] if src else old.get(id,{}).get('source_url'),
  'license':'Blender Studio CC-BY' if src else old.get(id,{}).get('license','review'),
  'art_state':'R85_FILM_CANDIDATE_ROLE_CLOTHING_PENDING' if src else 'R76_SURVIVING_SOURCE_REVIEW',
  'action_ready':targetMeshes>=5 or len(j.get('animations',[]))>0 or id=='E02'
 }
 models.append(entry)
out={
 'version':'R85','release_status':'PLAYABLE_ACTING_FILM_CAST_NOT_FINAL_ART',
 'productionCharacterArtApproved':False,
 'unit_glb_count':len(models),
 'permanent_vrm_roles':{'E01':'Shino-original-CC0.vrm','G01':'Fumiriya-original-CC0.vrm'},
 'retired_legacy_runtime_models':retired,
 'source_of_truth':'scene/summon-models.mjs',
 'source_artists':'Blender Studio character library, original artist mesh + native Blender IK baked to morph targets',
 'all_legacy_humanoid_recasts_live':all(id in source for id in ['E03','E04','G02','G04','T03']),
 'final_identity_art_pending':['E03','E04','G02','G04','T03'],
 'models':models,
}
target=BASE/'assets/summons/runtime-assets.json'
target.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
evid=BASE/'qa/evidence/r85/r85-runtime-art-mesh-audit.json'
evid.parent.mkdir(exist_ok=True,parents=True)
evid.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
print('R85_RUNTIME_ART_AUDIT',json.dumps({'models':len(models),'recasts':[x['card_id'] for x in models if 'R85-Acting' in x['file']],'tris':{x['card_id']:x['triangles'] for x in models},'noOldRuntimeFiles':True},ensure_ascii=False))
