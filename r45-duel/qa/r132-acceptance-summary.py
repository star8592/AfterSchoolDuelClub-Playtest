#!/usr/bin/env python3
"""Assemble original QA receipts; not human artistic approval."""
import json,hashlib
from pathlib import Path
qa=Path('r45-duel/qa/evidence')
load=lambda p:json.loads(Path(p).read_text())
root=qa/'r132'
assets=load(root/'r132-six-source-rest-audit.json')
desktop=load(root/'chrome-six-source-poses/r132-desktop-six-closeup-art-report.json')
portrait=load(root/'chrome-six-source-poses/r132-portrait-six-closeup-art-report.json')
rollout=load(root/'r132-rollout-isolation.json')
ground=load(root/'r132-ground-owner-report.json')
full=load(qa/'r124-full-chain/r124-full-chain-report.json')
phil=load(qa/'r131/baked-qa/r131-seven-closeup-art-report.json')
assert assets['passed'] and len(assets['results'])==6
assert desktop['passed'] and len(desktop['checks'])==66
assert portrait['passed'] and len(portrait['checks'])==66
assert rollout['passed'] and len(rollout['cases'])==4
assert ground['passed'] and len(ground['actors'])==12
assert full['passed'] and len(full['checks'])==18
assert phil['passed'] and len(phil['checks'])==22
ids=['E03','G02','G03','G04','T03','T04']
for view in [desktop,portrait]:
 assert set(x['id'] for x in view['actors'])==set(ids)
 assert all(x['armData']['maxSourceWristTravel']>.02 for x in view['actors'])
assert all(x['allOriginalVertexCountsPreserved'] and x['bakedPose'] for x in assets['results'].values())
report={'passed':True,
 'sourceRigCount':6,'sourceActualSkinAndMeshIntegrity':'PASS 6/6',
 'nearCameraDesktop':{'passed':66,'total':66,'viewport':1440},
 'nearCameraPortrait':{'passed':66,'total':66,'viewport':430},
 'rolloutIsolation':{'passed':4,'total':4,'productionDefault':'R97'},
 'officialWholeGame':{'passed':18,'total':18},
 'r131PhilCompatibility':{'passed':22,'total':22},
 'perMeshGroundOwnerProbes':len(ground['actors']),
 'artApproved':False,
 'knownArtBlockers':['G03 source shoe penetrates floor (minimum -0.047 in sampled hit)',
 'T04 source shoe penetrates floor (minimum -0.031 in sampled attack)',
 'E03 source boot penetrates floor (minimum -0.033 in sampled attack)',
 'E03/G04/T04 original source pose does not precisely reproduce R97 artistic proportions'],
 'warnings':['G02/T03 Blender process terminated abnormally on shutdown after complete GLB was exported; source GLB, hashes, non-image buffers and Chrome rendering independently validated'],
 'actors':{id:{'sha256':assets['results'][id]['bakedSha256'],
               'bytes':assets['results'][id]['bakedBytes'],
               'sourceSkinMeshes':assets['results'][id]['sourceSkinnedMeshes'],
               'sourceJoints':assets['results'][id]['sourceJoints']} for id in ids}}
out=root/'r132-convergence-acceptance.json';out.write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('R132_CONVERGENCE_ACCEPTANCE_PASS',json.dumps({
 'sourceMeshes':6,'desktop':66,'portrait':66,'rollout':4,'game':18,
 'e04Compatibility':22,'groundProbes':len(ground['actors']),
 'artApproved':False},ensure_ascii=False))
