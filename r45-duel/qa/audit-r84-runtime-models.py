#!/usr/bin/env python3
"""R84 actual runtime character model audit. Counts GLB triangles from primitive indices.
Does not equate polygon count alone with final film art; marks source lineage.
"""
from pathlib import Path
import json,struct,hashlib
ROOT=Path(__file__).resolve().parents[1]
SPECS={
 'E02':'E02-PaperPlane-R57.glb',
 'E03':'E03-CheerCaptain-Schoolkid.glb',
 'E04':'E04-CanteenRelay-FoodCourier.glb',
 'G02':'G02-BlackboardExpert-ItEngineer.glb',
 'G03':'G03-Jay-BlenderStudio-R80.glb',
 'G04':'G04-ClubDirector-OfficeManager.glb',
 'M01':'M01-MusicTeacher-PolyforkSchoolTeacher.glb',
 'M02':'M02-CafeteriaAunt-CartoonR76.glb',
 'T01':'T01-BroadcastOwl-PolyforkRadio-R73.glb',
 'T02':'T02-LivingMenu-R59.glb',
 'T03':'T03-MailPair-DeliveryRider.glb',
 'T04':'T04-Rex-BlenderStudio-R80.glb',
}
OLDER={'E03','E04','G02','G04','T03'}
APPROACH={'E02':'original paper airplane / not human',
          'G03':'R80 film style, static body action',
          'T04':'R80 film style, static body action',
          'T01':'rigged owl broadcaster, style review',
          'T02':'original magical menu object',
          'M02':'R76 rounded stylized cafeteria aunt',
          'M01':'R69 rigged music teacher, possible style mismatch'}
def analyze(path):
    raw=path.read_bytes()
    assert raw[:4]==b'glTF',(str(path),'not glb')
    jlen,jtyp=struct.unpack_from('<II',raw,12)
    assert jtyp==0x4E4F534A
    obj=json.loads(raw[20:20+jlen])
    accessor=obj.get('accessors',[])
    tris=0;prims=0
    for mesh in obj.get('meshes',[]):
        for p in mesh.get('primitives',[]):
            prims+=1
            n=accessor[p['indices']]['count'] if 'indices' in p else accessor[p['attributes']['POSITION']]['count']
            if p.get('mode',4)==4:tris+=n//3
            elif p.get('mode')==5:tris+=max(0,n-2)
    return dict(bytes=len(raw),sha256=hashlib.sha256(raw).hexdigest(),tris=tris,
                primitives=prims,meshes=len(obj.get('meshes',[])),
                animations=len(obj.get('animations',[])),skins=len(obj.get('skins',[])),
                textures=len(obj.get('textures',[])))
results={}
for id,filename in SPECS.items():
    path=ROOT/'assets/summons'/filename
    record={'card':id,'runtime_file':filename,**analyze(path)}
    record['quality_status']='KNOWN_LEGACY_LOWPOLY_PROXY_MUST_REPLACE' if id in OLDER else APPROACH.get(id,'needs-art-review')
    results[id]=record
review={
 'audited_at':'2026-11-12',
 'source':'actual runtime path: scene/summon-models.mjs (12 GLB), plus 2 existing source VRMs E01/G01',
 'production_final_art_approved':False,
 'known_legacy_proxy_cards':sorted(OLDER),
 'known_film_direction_cards':['G03','T04'],
 'approved_replacement_binary_available_for_legacy':False,
 'observation':'Sketchfab R78 57-105k-tile high-quality candidate references have sourceBinaryDownloaded=false; must not pretend present. Local R77 models only 6-8k tris and were rejected for art fit. Do not rename old meshes as high-quality.',
 'models':results,
 'safety':'No runtime edits; never replace loaded model with another unrelated character just to hide the low-poly issue',
}
out=ROOT/'qa/evidence/r84/r84-runtime-model-audit.json'
out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps(review,ensure_ascii=False,indent=2)+'\n')
print('R84_ART_AUDIT',json.dumps({i:{'triangles':x['tris'],'animations':x['animations'],'status':x['quality_status']} for i,x in results.items()},ensure_ascii=False))
