#!/usr/bin/env python3
"""Copy already sourced game art studies/CC0 models into isolated R61 runtime.
Prototypes are PLAYABILITY_ONLY and not approved final character art.
Source data, licenses and checksums preserved; no render dependency on art lab.
"""
from pathlib import Path
import json, hashlib, shutil
ROOT=Path(__file__).resolve().parents[2]
OUT=Path(__file__).resolve().parent
AUD=ROOT/'art-lab/r55-audition'
META={x['name']:x for x in json.loads((AUD/'models.json').read_text())}
ASSETS=[
 ('E02','E02-PaperPlane-R57.glb','batch1/character-studies/E02/E02-PaperPlane-R57-Refined-STUDY.glb','original_project_study','Original project paper plane 3D prototype; image-to-3D final art pending'),
 ('E03','E03-CheerCaptain-Schoolkid.glb','models/Schoolkid.glb','gobkit_cc0','Temporary school student model; NOT distinct captain final art'),
 ('E04','E04-CanteenRelay-FoodCourier.glb','models/FoodCourier.glb','gobkit_cc0','Food courier base; canteen relay runner outfit pending'),
 ('G02','G02-BlackboardExpert-ItEngineer.glb','models/ItEngineer.glb','gobkit_cc0','IT engineer supports code expert concept; blackboard identity still missing'),
 ('G03','G03-ReverseLab-WhiteCoatDoctor.glb','models/WhiteCoatDoctor.glb','gobkit_cc0','White-coat lab worker base; distinct student scientist appearance missing'),
 ('G04','G04-ClubDirector-OfficeManager.glb','models/OfficeManager.glb','gobkit_cc0','Office manager base, independent club director final art pending'),
 ('T01','T01-BroadcastOwl-BarnOwl.glb','models/BarnOwl.glb','gobkit_cc0','Bird 3D base, broadcaster costume R56 stays study until integrated'),
 ('T02','T02-LivingMenu-R59.glb','batch1/character-studies/T02/materials/T02-LivingMenu-R59-IllustratedStudy.glb','original_project_study','Original animated living menu technical design candidate, final visual art pending'),
 ('T03','T03-MailPair-DeliveryRider.glb','models/DeliveryRider.glb','gobkit_cc0','Delivery rider as a mailroom messenger, distinct matching pair design pending'),
 ('T04','T04-ClubGuardian-SecurityGuard.glb','models/SecurityGuard.glb','gobkit_cc0','Security guard as activities room gatekeeper, original costume pending')
]
entries=[]
for card_id,name,source,source_type,note in ASSETS:
 p=AUD/source
 assert p.is_file(),p
 b=p.read_bytes()
 assert b[:4]==b'glTF'
 base=source.split('/')[-1]
 m=META.get(base.removesuffix('.glb'))
 if source_type=='gobkit_cc0':
  assert m is not None and m['license']=='CC0 1.0' and m['sha256']==hashlib.sha256(b).hexdigest()
 dest=OUT/name
 dest.write_bytes(b)
 record={
  'card_id':card_id,'file':name,'source_repository_path':str(p.relative_to(ROOT)),
  'sha256':hashlib.sha256(b).hexdigest(),'bytes':len(b),
  'license':m['license'] if m else 'Original project-owned prototype, verify upstream texture sources before commercial release',
  'source_url':m['source'] if m else 'internal original art study in same project repository',
  'mode':'PLAYABILITY_PROTOTYPE_NOT_FINAL_ART','art_approved':False,'match_note':note,
  'skeleton_animation':source_type=='gobkit_cc0'
 }
 entries.append(record)
assert len(entries)==10 and len({x['card_id'] for x in entries})==10
(OUT/'runtime-assets.json').write_text(json.dumps({'version':'R61','release_status':'PLAYABILITY_ONLY','approved_final_art':0,'models':entries},ensure_ascii=False,indent=2)+'\n')
print('R61_GAME_ASSET_COPY',len(entries),sum(x['bytes'] for x in entries),'total bytes')
