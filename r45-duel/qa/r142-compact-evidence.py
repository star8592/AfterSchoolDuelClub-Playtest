"""Compact real Z890 Chrome evidence; preserves original check receipts."""
from pathlib import Path
import json
source=Path("r45-duel/qa/evidence/r142/guard-lab/r142-guard-lab-original-source.json")
j=json.loads(source.read_text())
assert j['passed'] is True and len(j['checks'])==86
assert all(x.get('pass') is True for x in j['checks'])
assert {(r['view'],r['id']) for r in j['views']}=={
 ('desktop','T04'),('desktop','G03'),('portrait','T04'),('portrait','G03')}
result={
 'passed':True,'artApproved':False,'checks':j['checks'],
 'source':'Z890 actual Chrome GPU desktop 1440 / portrait 430',
 'defaultOfficialModels':'R97',
 'realPelvisDefHipsWeighted':False,
 'originalActors':{}
}
for r in j['views']:
 legs=r['end']['legs'];shoe=r['end']['shoes'];stage=r['end']['stage']
 tracks=stage.get('sourceTracks',stage.get('sourceRigTrackCount'))
 assert tracks==16
 assert legs['runtimeLegTracks']==8
 assert legs['weightedSourceLegVertexWeight']>=.35
 assert legs['weightedSourceLegBone'] in (
  'DEF-Thigh1.L','DEF-Knee1.L','DEF-Foot.L')
 assert shoe['maxAfterPenetration']<=.0015
 assert shoe['maxAppliedLift']<=.105
 result['originalActors'].setdefault(r['id'],{})[r['view']]={
  'weightedLegTravel':legs['maxLegVertexTravel'],
  'weightedLegMesh':legs['weightedSourceLegMesh'],
  'weightedLegBone':legs['weightedSourceLegBone'],
  'weightedLegVertexWeight':legs['weightedSourceLegVertexWeight'],
  'originalSourceTracks':tracks,
  'outsolePenetration':shoe['maxAfterPenetration'],
  'outsoleMaxCorrection':shoe['maxAppliedLift'],
  'originalShoeMeshes':shoe['shoes'],
  'idleCoverage':r['poses']['idle']['screenWidth'],
  'attackCoverage':r['poses']['attack']['screenWidth'],
  'facing':r['end']['front']
 }
out=source.with_name('r142-original-guard-lab-compact.json')
out.write_text(json.dumps(result,ensure_ascii=False,indent=2))
print('R142_REAL_ORIGINAL_LEG_EVIDENCE_PASS',json.dumps(
 {'checks':86,'actors':list(result['originalActors']),
  'views':list(result['originalActors']['T04']),'bytes':out.stat().st_size}))
