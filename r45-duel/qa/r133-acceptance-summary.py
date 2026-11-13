"""Original evidence receipts, not artistic judgement."""
from pathlib import Path
import json
base=Path('r45-duel/qa/evidence')
load=lambda x:json.loads((base/x).read_text())
ground=load('r133/r133-source-shoe-contact-report.json')
isolation=load('r133/r133-six-flag-isolation.json')
official=load('r124-full-chain/r124-full-chain-report.json')
six=load('r132/chrome-six-source-poses/r132-desktop-portrait-six-closeup-art-report.json')
phil=load('r131/baked-qa/r131-seven-closeup-art-report.json')
r132iso=load('r132/r132-rollout-isolation.json')
counts={'shoeContact':len(ground['checks']),'flagIsolation':len(isolation['checks']),
        'officialGame':len(official['checks']),'r132Six':len(six['checks']),
        'r131Phil':len(phil['checks']),'oldRolloutIsolation':len(r132iso['cases'])}
assert counts=={'shoeContact':178,'flagIsolation':6,'officialGame':18,'r132Six':132,'r131Phil':22,'oldRolloutIsolation':4},counts
assert all(x['passed'] for x in [ground,isolation,official,six,phil,r132iso])
assert not ground['errors'] and not isolation['errors']
contact=[x for x in ground['actors'] if x['id'] in ['E03','G03','T04']]
assert len(contact)==30
assert all(x['record']['maxAfterPenetration']<=.0015 for x in contact)
assert all(x['record']['last']['appliedLift']<=.08201 for x in contact)
assert all(abs((x['record']['last']['before'][0]-x['record']['last']['before'][1])-
 (x['record']['last']['after'][0]-x['record']['last']['after'][1]))<.001 for x in contact)
summary={'passed':True,'artApproved':False,'officialDefault':'R97',
 'counts':counts,'contactSource':'actual original weighted SkinnedMesh outsole submeshes',
 'subjects':['E03','G03','T04'],'untouchedQAControl':'G02',
 'floorToleranceSceneUnits':.0015,'maxAllowedCorrectionSceneUnits':.082,
 'notProven':['left/right side independence of E03 outsole submeshes',
   'full physical ankle IK','cost on mobile GPUs','film-level artistic approval'],
 'sourceEvidence':[
  'r45-duel/qa/evidence/r133/r133-source-shoe-contact-report.json',
  'r45-duel/qa/evidence/r133/r133-six-flag-isolation.json',
  'r45-duel/qa/evidence/r132/r132-ground-owner-report.json']}
dest=base/'r133/r133-convergence-acceptance.json'
dest.write_text(json.dumps(summary,ensure_ascii=False,indent=2))
print('R133_REPRODUCIBLE_ACCEPTANCE_PASS',json.dumps(counts,ensure_ascii=False))
