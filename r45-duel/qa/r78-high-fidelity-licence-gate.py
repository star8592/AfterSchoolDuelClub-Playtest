#!/usr/bin/env python3
"""Stop poor/mismatched sources from being called final. Read-only on game files."""
from pathlib import Path
import hashlib,json
root=Path(__file__).resolve().parents[1]
j=json.loads((root/'art-lab/r78-high-fidelity/sketchfab-source-audit.json').read_text())
rows=j['candidates'];primary=[x for x in rows if x['artReview']=='primary_same_artist']
assert j['binaryDownloadAuthStatus']==401
assert len(rows)==4 and len(primary)==3
assert len({x['uid'] for x in rows})==4
assert {x['creator'] for x in primary}=={'Canino3d'}
assert min(x['triangles'] for x in primary)>50000
for x in rows:
 assert x['licenseSlug']=='by' and x['isDownloadable']
 assert x['sourceUrl'].startswith('https://sketchfab.com/3d-models/')
 assert not x['sourceBinaryDownloaded'] and not x['readyForGame'] and not x['artApproved']
 assert not x['localMeshValidated'] and not x['localAnimationValidated']
 f=(root/'qa'/x['thumbnailLocal']).resolve();assert f.exists() and f.is_file()
 assert len(f.read_bytes())==x['thumbnailBytes'] and hashlib.sha256(f.read_bytes()).hexdigest()==x['thumbnailSha256']
manifest=json.loads((root/'assets/summons/runtime-assets.json').read_text())
for id in ['E03','G02','T03']:
 x=next(x for x in manifest['models'] if x['card_id']==id)
 assert not x['art_approved'] and 'R78' not in x['file']
qa=root/'qa/evidence/r78/R78_WEB_MODEL_QA.json'
if qa.exists():
 checks=json.loads(qa.read_text());assert len(checks)==4 and all(x['pass'] for x in checks)
print('R78_HIFI_LICENSE_SOURCE_AND_GAME_SAFETY_PASS',json.dumps({'sources':len(rows),'primary':len(primary),'minPrimaryTriangles':min(x['triangles'] for x in primary),'allAuthorLicenceCCBY':True,'officialThumbnailsShaVerified':True,'binaryModelsReceived':False,'productionArtApproved':0,'gameE03G02T03Untouched':True}))
