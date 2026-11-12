import json,struct,hashlib,pathlib
root=pathlib.Path(__file__).resolve().parents[1]
pairs={
'E01':'model/Shino-original-CC0.vrm','G01':'model/Fumiriya-original-CC0.vrm',
'E02':'summons/E02-R60-PhotoPaper-WingFlex-STUDY.glb',
'E03':'summons/E03-Ellie-Landing-R97.glb',
'E04':'summons/E04-Phil-Landing-R97.glb',
'G02':'summons/G02-Snow-Landing-R97.glb',
'G03':'summons/G03-Jay-Landing-R97.glb',
'G04':'summons/G04-Victoria-Landing-R97.glb',
'M01':'summons/M01-MusicTeacher-PolyforkSchoolTeacher.glb',
'M02':'summons/M02-CafeteriaAunt-ChefHat-Spatula-R99.glb',
'T01':'summons/T01-Owl-Innerscene-R84.glb',
'T02':'summons/T02-LivingMenu-R59.glb',
'T03':'summons/T03-Rain-Landing-R97.glb',
'T04':'summons/T04-Rex-Landing-R97.glb',
'HOST_PLAYER':'model/Host-HairSample_Female-CC0.vrm',
'HOST_AI':'model/Host-HairSample_Male-CC0.vrm'}
results={}
for role,name in pairs.items():
 b=(root/'assets'/name).read_bytes();n=struct.unpack_from('<I',b,12)[0]
 assert b[:4]==b'glTF' and b[16:20]==b'JSON'
 g=json.loads(b[20:20+n]);j={k for sk in g.get('skins',[]) for k in sk['joints']}
 chans=[c['target'] for a in g.get('animations',[]) for c in a.get('channels',[])]
 morph=sum(c['path']=='weights' for c in chans)
 skinrot=sum(c['path']=='rotation' and c.get('node') in j for c in chans)
 meta=g.get('extensions',{}).get('VRM',{}).get('meta',{})
 results[role]={'file':name,'sha256':hashlib.sha256(b).hexdigest(),'bytes':len(b),
   'skins':len(g.get('skins',[])),'joint_count':len(j),
   'clips':[a.get('name') for a in g.get('animations',[])],
   'morph_channels':morph,'animated_skin_rotations':skinrot,
   'license':meta.get('licenseName'),'commercial_allowed':meta.get('commercialUssageName')}
assert len(results)==16
assert sum(results[k]['morph_channels']>0 and results[k]['animated_skin_rotations']==0 for k in ('E03','E04','G02','G03','G04','T03','T04'))==7
assert all(results[k]['license']=='CC0' and results[k]['commercial_allowed']=='Allow' for k in ('HOST_PLAYER','HOST_AI'))
assert len({x['sha256'] for x in results.values()})==16
out=root/'qa/evidence/r105/model-rig-census.json'
out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps({'passed':True,'count':16,'models':results,
 'limitations':['7 film avatars use shape-key clips, not native animated shoulder joints',
 'T01 owl is a static nonhuman model, not animated','Visual QA still needed']},ensure_ascii=False,indent=2)+'\n')
print('R105_MODEL_CENSUS_PASS 16/16; morph-only=7, static owl=1')
