"""R138: fail-closed, real-GPU 70 + legacy 200 browser receipt convergence.
Run from repository root after Z890 Chrome scripts complete.
Only recorded browser evidence counts; no art score is fabricated.
"""
from pathlib import Path
import json
root=Path('r45-duel/qa/evidence')
cases=[
 ('sourceActing','r136/four-source/r136-four-source-action.json',83),
 ('flagIsolation','r136/four-source/r136-flag-rollback.json',63),
 ('ensemble15sec','r136/four-source/r136-four-ensemble-15sec.json',36),
 ('cardFullChain','r124-full-chain/r124-full-chain-report.json',18),
 ('distantCamera','r138/visible-silhouette/r138-visibility-baseline.json',70)
]
counts={}
for label,path,expect in cases:
    data=json.loads((root/path).read_text())
    assert data.get('passed') is True,(label,'not-passed',data.get('errors'))
    checks=data.get('checks',[])
    assert len(checks)==expect,(label,len(checks),expect)
    assert all(x.get('pass') is True for x in checks),(label,'failed-check')
    counts[label]=expect
stage=json.loads((root/cases[0][1]).read_text())
assert len(stage.get('views',[]))==8
distant=json.loads((root/cases[-1][1]).read_text())
samples=distant.get('samples',[])
assert len(samples)==6,('distant-samples',len(samples))
identity={x.get('id') for x in samples}
assert identity=={'G02','G04','T03'}
views={x.get('view') for x in samples}
assert views=={'desktop','portrait'}
threshold={'G02':.25,'G04':.28,'T03':.20}
metrics={}
for x in samples:
    id=x['id'];view=x['view'];poses=x['poses']
    assert set(poses)=={'idle','attack','hit','celebrate'}
    assert x['visibleDelta']>=threshold[id],(id,view,'gesture-low')
    assert poses['attack']['coverageWidth']>=poses['idle']['coverageWidth']+.003,(id,view,'attack-not-visible')
    for state,entry in poses.items():
        assert entry['stage']['enabled'] is True,(id,view,state,'not-source')
        assert entry['front']>.90,(id,view,state,'facing')
        assert entry['feet']['enabled'] and entry['feet']['maxAfter']<=.004,(id,view,state,'floor')
    if id=='T03':
        arms=poses['idle']['stage']['arms']
        assert arms['L']['spread']>.08 and arms['R']['spread']>.08
    metrics.setdefault(id,{})[view]={
      'celebrateIdleArmDirectionChange':x['visibleDelta'],
      'idleCoverage':poses['idle']['coverageWidth'],
      'attackCoverage':poses['attack']['coverageWidth']
    }
assert all(len(v)==2 for v in metrics.values())
result={
 'passed':True,'checks':counts,'total':sum(counts.values()),
 'sourceMainR137':'f3c014d','defaultOfficialModels':'R97','pilot':'r136Cast=on',
 'artApproved':False,'gpuCameraMetrics':metrics,
 'stillOpen':['Human director 85/100 visual acceptance','Low-end phone GPU',
              'Final 14-character animation/voice/facial closure'],
 'receipts':[x[1] for x in cases]
}
p=root/'r138/visible-silhouette/r138-convergence.json'
p.parent.mkdir(parents=True,exist_ok=True)
p.write_text(json.dumps(result,indent=2,ensure_ascii=False))
print('R138_CAMERA_AND_GAME_REGRESSION_PASS',json.dumps(
 {'total':result['total'],'actors':list(metrics),'artApproved':False},
 ensure_ascii=False))
