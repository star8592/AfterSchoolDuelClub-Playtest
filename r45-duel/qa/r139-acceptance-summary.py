"""R139: only count actual Z890 browser receipts, preserve artApproved=False."""
from pathlib import Path
import json
root=Path('r45-duel/qa/evidence')
cases={
 'victoriaFullBody':('r139/victoria/r139-victoria-stage.json',36),
 'distantCamera':('r138/visible-silhouette/r138-visibility-baseline.json',70),
 'fourSourceActing':('r136/four-source/r136-four-source-action.json',83),
 'flagRollback':('r136/four-source/r136-flag-rollback.json',63),
 'ensemble15Sec':('r136/four-source/r136-four-ensemble-15sec.json',36),
 'gameFullChain':('r124-full-chain/r124-full-chain-report.json',18)
}
counts={}
for key,(path,num) in cases.items():
 data=json.loads((root/path).read_text())
 assert data.get('passed') is True,(key,data.get('errors'))
 ck=data.get('checks') or []
 assert len(ck)==num,(key,'unexpected-check-count',len(ck),num)
 assert all(x.get('pass') is True for x in ck),(key,'failing-check')
 counts[key]=num
v=json.loads((root/cases['victoriaFullBody'][0]).read_text())
assert {x['view'] for x in v['views']}=={'desktop','portrait'}
out={}
for x in v['views']:
 leg=x['post']['legs'];shoe=x['post']['shoe'];poses=x['poses']
 assert leg['source']=='real_original_skinned_deform_bones'
 assert leg['runtimeLegTracks']==8
 assert leg['maxLegVertexTravel']>.04
 assert shoe['maxAfter']<=.004
 for state in ('idle','attack'):
  foot=poses[state]['shoe']['last']
  assert foot['victoriaPlanted'] and abs(foot['minAfter']-.0005)<.004
 assert poses['attack']['screenWidth']>poses['idle']['screenWidth']+.003
 out[x['view']]={'sourceLegVertexTravel':leg['maxLegVertexTravel'],
  'idleScreenCoverage':poses['idle']['screenWidth'],
  'attackScreenCoverage':poses['attack']['screenWidth'],
  'outsolePenetration':shoe['maxAfter'],
  'idleSupportMinY':poses['idle']['shoe']['last']['minAfter'],
  'attackSupportMinY':poses['attack']['shoe']['last']['minAfter']}
result={'passed':True,'artApproved':False,
 'mainBase':'b2b98c333a7b051b15a03a74d28d19bf9f2bb452',
 'defaultOfficialModels':'R97','stagePilot':'r136Cast=on',
 'checks':counts,'total':sum(counts.values()),
 'realGpuCameraProof':out,
 'unresolved':['Director aesthetic approval 85/100',
  'Consumer low-end mobile GPU','14-actor integrated emotion and voice'],
 'receipts':[x[0] for x in cases.values()]}
dest=root/'r139/victoria/r139-convergence.json'
dest.parent.mkdir(parents=True,exist_ok=True)
dest.write_text(json.dumps(result,indent=2,ensure_ascii=False))
print('R139_306_REAL_GPU_CHECKS_PASS',json.dumps({
 'total':result['total'],'views':list(out),'artApproved':result['artApproved'],
 'defaultOfficialModels':'R97'},ensure_ascii=False))
