"""Fail closed: only literal real browser receipt evidence can pass R136."""
from pathlib import Path
import json
root=Path('r45-duel/qa/evidence')
cases=[
 ('realSourceStage','r136/four-source/r136-four-source-action.json',83),
 ('flagIsolation','r136/four-source/r136-flag-rollback.json',63),
 ('fourSource15secIdle','r136/four-source/r136-four-ensemble-15sec.json',36),
 ('officialGameFullChain','r124-full-chain/r124-full-chain-report.json',18)]
counts={}
for name,file,expected in cases:
 j=json.loads((root/file).read_text())
 assert j['passed'],(name,j.get('errors'))
 assert len(j['checks'])==expected,(name,len(j['checks']),expected)
 counts[name]=expected
stage=json.loads((root/cases[0][1]).read_text())
idle=json.loads((root/cases[2][1]).read_text())
assert len(stage['views'])==8 and len(idle['views'])==2
expect={'E04':15,'G02':16,'G04':16,'T03':16}
personality={}
for v in stage['views']:
 id=v['id'];who=v['idle']['identity']['identity']
 assert v['idle']['identity']['upperTracks']==expect[id],(id,'tracks')
 assert v['final']['arms']['maxWeightedArmVertexTravel']>.001,(id,'arm')
 assert (v['final']['legs'].get('maxLegVertexTravel') or 0)>.0005,(id,'leg')
 assert v['final']['facing']>.90,(id,'opponent')
 personality.setdefault(id,{})[v['view']]={'identity':who,
  'tracks':expect[id],
  'originalArmVertexTravel':v['final']['arms']['maxWeightedArmVertexTravel'],
  'originalLegVertexTravel':v['final']['legs']['maxLegVertexTravel']}
assert all(len(v)==2 for v in personality.values())
assert len({x['desktop']['identity'] for x in personality.values()})==4
for view in idle['views']:
 assert len(view['samples'])==6
 for sample in view['samples']:
  assert len(sample['actors'])==4
  for actor in sample['actors']:
   assert actor['shoes']['enabled'] and actor['shoes']['maxAfter']<=.004,actor['id']
   assert actor['face']>.90
   assert actor['source']['frames']>0
record={
 'passed':True,'artApproved':False,'defaultOfficialModels':'R97',
 'pilot':'r136Cast=on','independentActorFlags':['r136Cast='+id for id in expect],
 'rollback':'r136Cast=off',
 'oneMainOneOfficialGame':True,'sourceActorEvidence':personality,
 'checks':counts,'total':sum(counts.values()),
 'footwearLimit':'E04 lower hem/body and trousers; other 3 original shoes/boots',
 'knownOutstanding':['No human 85/100 stage director artistic approval',
 'No low-end consumer phone-GPU performance measurements',
 'No final 14-person long-form animation audio/lipsync closure',
 'E04 source Phil has no dedicated independent shoe geometry'],
 'receipts':[row[1] for row in cases]
}
dest=root/'r136/four-source/r136-acceptance-convergence.json'
dest.parent.mkdir(parents=True,exist_ok=True)
dest.write_text(json.dumps(record,ensure_ascii=False,indent=2))
print('R136_FOUR_REAL_CAST_ACCEPTANCE_PASS',json.dumps({
 'total':record['total'],'artApproved':record['artApproved'],
 'defaultOfficialModels':record['defaultOfficialModels'],
 'actors':list(personality)},ensure_ascii=False))
