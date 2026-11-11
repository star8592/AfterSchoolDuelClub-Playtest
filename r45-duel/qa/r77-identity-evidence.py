"""Small source+visual-evidence guard, NOT an automatic art approval score."""
import hashlib,json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
source=json.loads((root/'art-lab/r77-targeted-cast/sources/inventory.json').read_text())
assert len(source)==8
for x in source:
 p=root/x['source_path'];assert p.is_file(),p
 assert len(p.read_bytes())==x['bytes'] and hashlib.sha256(p.read_bytes()).hexdigest()==x['sha256'],x['id']
 assert x['license']=='MIT embedded full text' and x['status']=='source-only-not-approved'
qa=root/'qa/evidence/r77'
a=json.loads((qa/'R77_CAST_COMPARISON_RESULTS.json').read_text())
b=json.loads((qa/'closeup/closeup-qa.json').read_text())
assert len(a)==10 and all(x['pass'] and not x['errors'] for x in a)
assert len(b)==10 and all(x['pass'] and not x['errors'] for x in b)
assert set(x['role'] for x in a)=={'E03','G02','T03'}
manifest=json.loads((root/'assets/characters/CAST_MANIFEST.json').read_text())
runtime=json.loads((root/'assets/summons/runtime-assets.json').read_text())
cards={x['id']:x for x in manifest['unitCards']}
records={x['card_id']:x for x in runtime['models']}
for k,name in [('E03','E03-CheerCaptain-Schoolkid.glb'),('G02','G02-BlackboardExpert-ItEngineer.glb'),('T03','T03-MailPair-DeliveryRider.glb')]:
 assert records[k]['file']==name and not records[k]['art_approved'],k
 assert not cards[k]['unique3DCharacterComplete']
print('R77_IDENTITY_SOURCE_AND_ART_GUARD',json.dumps({'sources':len(source),'reused':sum(x['source_state'].startswith('reused') for x in source),'new':sum(x['source_state'].startswith('new') for x in source),'wide_and_portrait_scenes':len(a),'closeup_views':len(b),'unchanged_playable_cast':['E03','G02','T03'],'approved_replacements':0}))
