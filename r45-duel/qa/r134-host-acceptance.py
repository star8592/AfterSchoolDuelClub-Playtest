"""R134 genuine VRM host functional checks, never artistic sign-off."""
from pathlib import Path
import json
root=Path('r45-duel/qa/evidence')
idle=json.loads((root/'r134/duelist-hosts/r134-two-host-15sec-report.json').read_text())
game=json.loads((root/'r124-full-chain/r124-full-chain-report.json').read_text())
assert idle['passed'] and len(idle['checks'])==38,(idle.get('errors'),len(idle['checks']))
assert game['passed'] and len(game['checks'])==18,(game.get('errors'),len(game['checks']))
assert len(idle['views'])==4
profiles={}
for x in idle['views']:
 assert x['view'] in ('desktop','portrait')
 assert x['mode'] in ('enabled','rollback')
 for actor in ('E01','G01'):
  poses=[next(h for h in sample['hosts'] if h['id']==actor)['posture']['r134Idle']
         for sample in x['samples']]
  if x['mode']=='enabled':
   assert all(p is not None for p in poses)
   assert len(set(p['story'] for p in poses))>=2
   assert len(set((p['headYaw'],p['thighL'],p['thighR']) for p in poses))>=4
   profiles.setdefault(actor,{})[x['view']]=sorted(set(p['story'] for p in poses))
  else:assert all(p is None for p in poses)
report={'passed':True,'artApproved':False,'source':'two original CC0 VRM podium rigs',
 'defaultEnabled':True,'rollbackQuery':'r134Hosts=off',
 'tests':{'realVRM15SecondIdleDesktopPortraitAndRollback':'38/38',
          'actualGameCardGrip15FingersVoiceSpell':'18/18'},
 'validatedHostPersonalityBeats':profiles,'next':['human artistic closeup and full-action review',
 'real consumer mobile device frame time','remaining eleven summon performance improvements']}
dest=root/'r134/duelist-hosts/r134-host-acceptance.json'
dest.write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('R134_2_HOSTS_REAL_VRM_ACCEPTANCE_PASS',json.dumps(report['tests']))
