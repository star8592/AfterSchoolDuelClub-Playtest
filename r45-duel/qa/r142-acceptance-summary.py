"""R142 strict GPU source-rig closure: legacy R141 858 + 86 true leg checks.
Evidence must exist, be current worktree-generated, and contain no failing
checks. This never certifies human art direction or public deployment.
"""
from pathlib import Path
import json
root=Path("r45-duel/qa/evidence")
cases={
 "r142GuardLabAuthenticSourceLegs":("r142/guard-lab/r142-guard-lab-original-source.json",86),
 "r141ThreeSourceFaceVoice":("r141/seven-source-faces/r141-real-three-source-face-voice.json",152),
 "r141DuplicateTwoCampQwen":("r141/seven-source-faces/r141-double-card-voice-isolation.json",32),
 "r134JaySourceActing":("r134/r134-jay-acting-pilot.json",22),
 "r135EllieRexSourceStage":("r135/original-pair/r135-pair-original-source-stage.json",53),
 "r135SourceIdle15sec":("r135/original-pair/r135-pair-original-idle-15sec.json",16),
 "r135FlagIsolation":("r135/original-pair/r135-independent-flag-isolation.json",25),
 "r140FourSourceFaces":("r140/source-faces/r140-real-source-face.json",170),
 "r140FourQwenClips":("r140/source-faces/r140-all-four-actual-qwen.json",54),
 "r139Victoria":("r139/victoria/r139-victoria-stage.json",36),
 "r138CameraSilhouette":("r138/visible-silhouette/r138-visibility-baseline.json",70),
 "r136FourActors":("r136/four-source/r136-four-source-action.json",83),
 "r136Rollback":("r136/four-source/r136-flag-rollback.json",63),
 "r136Ensemble15":("r136/four-source/r136-four-ensemble-15sec.json",36),
 "r124OfficialCardFight":("r124-full-chain/r124-full-chain-report.json",18),
 "r122DuelistVoice":("r122-qwen-mouth/r122-real-qwen-mouth-report.json",28)
}
groups={}
data={}
for name,(f,expect) in cases.items():
 j=json.loads((root/f).read_text())
 assert j.get('passed') is True,(name,'reported failure',j.get('errors'))
 checks=j.get('checks') or []
 assert len(checks)==expect,(name,len(checks),expect)
 assert all(c.get('pass') is True for c in checks),(name,'failed check')
 groups[name]=expect
 data[name]=j
assert sum(groups.values())==944,sum(groups.values())
pilot=data["r142GuardLabAuthenticSourceLegs"]
assert {v['view'] for v in pilot['views']}=={'desktop','portrait'}
assert {(v['view'],v['id']) for v in pilot['views']}=={
 ('desktop','T04'),('desktop','G03'),('portrait','T04'),('portrait','G03')}
visible={}
for v in pilot['views']:
 id=v['id'];leg=v['end']['legs'];shoe=v['end']['shoes'];stage=v['end']['stage']
 track=stage.get('sourceTracks',stage.get('sourceRigTrackCount'))
 assert track==16,(id,track)
 assert leg['runtimeLegTracks']==8
 assert leg['source']=='real_original_skinned_deform_bones'
 assert leg['weightedSourceLegBone'] in ('DEF-Thigh1.L','DEF-Knee1.L','DEF-Foot.L')
 assert leg['weightedSourceLegVertexWeight']>=.35
 assert leg['maxLegVertexTravel']>=(.027 if id=='T04' else .051)
 assert shoe['source']=='two_original_weighted_skinned_outsoles'
 assert shoe['maxAfterPenetration']<=.0015
 assert shoe['maxAppliedLift']<=.105
 visible.setdefault(id,{})[v['view']]={
   'legVertexTravel':leg['maxLegVertexTravel'],
   'weightedSourceBone':leg['weightedSourceLegBone'],
   'weightedSourceVertexWeight':leg['weightedSourceLegVertexWeight'],
   'realPelvisDirectWeight':False if id=='T04' else None,
   'shoePenetration':shoe['maxAfterPenetration'],
   'maxFloorLift':shoe['maxAppliedLift'],
   'attackCoverage':v['poses']['attack']['screenWidth'],
   'idleCoverage':v['poses']['idle']['screenWidth'],
   'sourceTracks':track}
old=data['r135EllieRexSourceStage']
t04=[v for v in old['views'] if v['id']=='T04']
assert len(t04)==2
assert all(v['restored']['legs']['maxLegVertexTravel']>=.027
           and v['idle']['stage']['sourceTracks']==16
           and v['restored']['shoe']['maxAfterPenetration']<=.0015 for v in t04)
res={
 'passed':True,'total':944,'newChecks':86,'legacyRetested':858,
 'mainBase':'23138dc206801101b48c683406c77f45fdd94ab0',
 'artApproved':False,'defaultOfficialModels':'R97',
 'originalSourceActors':['T04','G03'],'independentPilotFlags':{
 'T04':'r135Pair=on','G03':'r134Jay=on'},
 'unweightedRexPelvisRejected':True,
 'originalFootCompensationCaps':{'T04':.105,'G03':.082,'E03':.082},
 'checks':groups,'sourceLegGpuMetrics':visible,
 'notComplete':['Director 85/100 art signoff',
   'Low-end real mobile GPU test',
   'Default high-poly production rollout',
   'Other full-cast drama and acting'],
 'evidencePaths':[c[0] for c in cases.values()]
}
p=root/'r142/guard-lab/r142-convergence.json'
p.parent.mkdir(parents=True,exist_ok=True)
p.write_text(json.dumps(res,ensure_ascii=False,indent=2))
print('R142_944_REAL_GPU_CHECKS_PASS',json.dumps({
 'total':944,'new':86,'historic':858,
 'noFakePelvis':True,'artApproved':False,'default':'R97'},ensure_ascii=False))
