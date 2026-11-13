"""Reproducible real source QA. Explicit artistic approval stays false."""
from pathlib import Path
import json
base=Path('r45-duel/qa/evidence')
cases=[
 ('pairSources','r135/original-pair/r135-pair-original-source-stage.json',53),
 ('flagRollback','r135/original-pair/r135-independent-flag-isolation.json',25),
 ('continuousIdle','r135/original-pair/r135-pair-original-idle-15sec.json',16),
 ('actualCardGame','r124-full-chain/r124-full-chain-report.json',18)]
metrics={}
for name,path,expected in cases:
 j=json.loads((base/path).read_text())
 assert j['passed'],(name,j.get('errors'))
 assert len(j['checks'])==expected,(name,len(j['checks']),expected)
 metrics[name]=expected
stage=json.loads((base/cases[0][1]).read_text())
assert len(stage['views'])==4
actors={}
for view in stage['views']:
 who=view['id']
 v=view['victory']['stage']
 assert v['sourceTracks']>=16
 assert (who=='E03' and v['lift']>.05) or (who=='T04' and v['lift']==0)
 assert view['restored']['shoe']['maxAfterPenetration']<=.0015
 assert view['restored']['sourceArms']['maxWeightedArmVertexTravel']>.001
 assert view['restored']['legs']['maxLegVertexTravel']>(.025 if who=='E03' else .014)
 actors.setdefault(who,[]).append({
  'view':view['view'],'identity':view['idle']['stage']['identity'],
  'source':view['idle']['file'],
  'actualBoneTracks':v['sourceTracks'],
  'weightedArmVertexTravel':view['restored']['sourceArms']['maxWeightedArmVertexTravel'],
  'weightedLegVertexTravel':view['restored']['legs']['maxLegVertexTravel'],
  'maxShoePenetration':view['restored']['shoe']['maxAfterPenetration'],
  'measuredCheerLift':v['lift'],
  'returns':view['restored']['stage']['returns']})
for who in ('E03','T04'):assert len(actors[who])==2
idle=json.loads((base/cases[2][1]).read_text())
assert len(idle['views'])==2
result={'passed':True,'artApproved':False,'defaultRelease':'R97',
 'oneOfficialMain':True,
 'pilotFlag':'r135Pair=on','perActorFlags':['r135Pair=E03','r135Pair=T04'],
 'rollback':'r135Pair=off',
 'priorJayStage':'r134Jay=on unaffected',
 'checks':metrics,'totalChecks':sum(metrics.values()),
 'originalHighPolySkinActors':actors,
 'unfinished':['Human director 85/100 art review for both identities',
  'Real low-end mobile GPU and full multi-round performance',
  'Further animation polish against M02 benchmark for every role'],
 'evidence':[
  'r135/original-pair/r135-pair-original-source-stage.json',
  'r135/original-pair/r135-independent-flag-isolation.json',
  'r135/original-pair/r135-pair-original-idle-15sec.json',
  'r124-full-chain/r124-full-chain-report.json']}
path=base/'r135/original-pair/r135-convergence-acceptance.json'
path.parent.mkdir(parents=True,exist_ok=True)
path.write_text(json.dumps(result,ensure_ascii=False,indent=2))
print('R135_SOURCE_PAIR_ACCEPTANCE_PASS',json.dumps({
 'checks':result['totalChecks'],'artApproved':False,'defaultRelease':'R97',
 'identityCounts':{k:len(v) for k,v in actors.items()}},ensure_ascii=False))
