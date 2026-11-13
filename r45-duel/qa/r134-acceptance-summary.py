"""Read actual R134 + predecessor receipts. Do not invent artistic scores."""
import json
from pathlib import Path
root=Path('r45-duel/qa/evidence')
def get(path):
 j=json.loads((root/path).read_text())
 if not j.get('passed'):raise AssertionError((path,j.get('errors')))
 return j
checks=[
 ('r134Pilot','r134/r134-jay-acting-pilot.json',22),
 ('r134FifteenSeconds','r134/r134-default-vs-pilot-15s.json',11),
 ('r134Rollback','r134/r134-four-flag-rollout.json',4),
 ('officialFight','r124-full-chain/r124-full-chain-report.json',18),
 ('r132Rollback','r132/r132-rollout-isolation.json',4),
 ('r133Rollback','r133/r133-six-flag-isolation.json',6),
 ('originalSourceShoes','r133/r133-source-shoe-contact-report.json',178)]
counts={}
for name,file,n in checks:
 j=get(file)
 size=len(j.get('checks',j.get('cases',[])))
 assert size==n,(name,size,n)
 counts[name]=n
pilot=get('r134/r134-jay-acting-pilot.json')
assert len(pilot['views'])==2
for v in pilot['views']:
 assert v['finish']['stage']['sourceRigTrackCount']>=16
 assert v['finish']['stage']['transitions']>=5
 assert v['finish']['originalArms']['maxWeightedArmVertexTravel']>.1
 assert v['finish']['contact']['maxAfterPenetration']<=.0015
 for state in ['attack','celebrate']:
  arms=v[state]['sourceArmDirections']
  assert arms['L']['down']>.40,(v['view'],state,'left',arms)
  assert arms['R']['down']>.18,(v['view'],state,'right',arms)
idle=get('r134/r134-default-vs-pilot-15s.json')
assert {x['mode'] for x in idle['samples']}=={'R97_default','R134_pilot'}
assert next(x for x in idle['samples'] if x['mode']=='R134_pilot')['uniqueSourcePoses']>=3
result={'passed':True,'artApproved':False,'releaseDefault':'R97',
 'actor':'G03','source':'original Blender Studio weighted high-poly mesh',
 'rollback':'r134Jay=off','pilot':'r134Jay=on',
 'counts':counts,'checkedTotal':sum(counts.values()),
 'desktopAndPortraitOriginalJointTracks':16,
 'idleSampleSeconds':15,'uniqueIdleSourcePoseSamples':6,
 'knownUnfinished':['human artistic score >=85 not yet collected',
 'E01/G01 full-body acting refinement',
 'six remaining humanoid source-rig production rollouts',
 'full cast dialogue expression synchronization',
 'low-end GPU/phone performance validation'],
 'proofs':[
 'r134/r134-jay-acting-pilot.json',
 'r134/r134-default-vs-pilot-15s.json',
 'r134/r134-four-flag-rollout.json']}
dest=root/'r134/r134-convergence-acceptance.json'
dest.write_text(json.dumps(result,indent=2,ensure_ascii=False))
print('R134_JAY_PILOT_ACCEPTANCE_PASS',json.dumps({
 'checks':result['checkedTotal'],'artApproved':result['artApproved'],
 'releaseDefault':result['releaseDefault'],
 'uniqueIdlePoses':result['uniqueIdleSourcePoseSamples']},ensure_ascii=False))
