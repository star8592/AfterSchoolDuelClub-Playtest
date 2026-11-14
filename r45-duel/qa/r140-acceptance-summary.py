"""R140 only real Z890 browser receipts count; never claim art approval."""
from pathlib import Path
import json
root=Path('r45-duel/qa/evidence')
cases={
 'originalFacialStage':('r140/source-faces/r140-real-source-face.json',170),
 'fourOriginalQwenVoices':('r140/source-faces/r140-all-four-actual-qwen.json',54),
 'victoriaFullBody':('r139/victoria/r139-victoria-stage.json',36),
 'distantCamera':('r138/visible-silhouette/r138-visibility-baseline.json',70),
 'fourSourceActing':('r136/four-source/r136-four-source-action.json',83),
 'flagRollback':('r136/four-source/r136-flag-rollback.json',63),
 'ensemble15sec':('r136/four-source/r136-four-ensemble-15sec.json',36),
 'officialCardGame':('r124-full-chain/r124-full-chain-report.json',18),
 'originalHostVoices':('r122-qwen-mouth/r122-real-qwen-mouth-report.json',28)
}
checked={}
payloads={}
for label,(path,num) in cases.items():
 j=json.loads((root/path).read_text())
 assert j.get('passed') is True,(label,j.get('errors'))
 checks=j.get('checks',[])
 assert len(checks)==num,(label,'wrong-count',len(checks),num)
 assert all(x.get('pass') is True for x in checks),(label,'failed-check')
 checked[label]=num
 payloads[label]=j
face=payloads['originalFacialStage']
voice=payloads['fourOriginalQwenVoices']
host=payloads['originalHostVoices']
assert {v['view'] for v in face['views']}=={'desktop','portrait'}
assert all(set(v['actors'])=={'E04','G02','G04','T03'} for v in face['views'])
assert {v['view'] for v in voice['voices']}=={'desktop','portrait'}
for row in voice['voices']:
 assert set(row['voices'])=={'E04','G02','G04','T03'}
 assert row['duplicateCardVoiceIsolated'] is True
 assert all(x['maxMouth']>.09 for x in row['voices'].values())
assert len(host.get('voices',[]))==2
tot=sum(checked.values())
assert tot==558,tot
receipt={
 'passed':True,'total':tot,'newOriginalActorChecks':224,
 'artApproved':False,'mainBase':'8470695396687e40ebb3aeedf68871ac449de3b5',
 'defaultOfficialModels':'R97','onlyPilot':'r136Cast=on',
 'sourceFaceIds':['E04','G02','G04','T03'],
 'voiceSource':'pre-recorded Qwen3 browser HTMLAudioElement playing callbacks',
 'voiceAlignment':'estimated-syllable-timing, not phoneme forced alignment',
 'duplicateIdentitySpeechIsolated':True,
 'checks':checked,
 'sampledFacialActors':{
  v['view']:{id:{'states':list(row['states']),
    'maxJawAngle':max(x['jawAngle'] for x in row['states'].values()),
    'peakMorph':max(x['maxMorph'] for x in row['states'].values())}
   for id,row in v['actors'].items()} for v in face['views']
 },
 'realVoiceMouthPeak':{
  v['view']:{id:x['maxMouth'] for id,x in v['voices'].items()}
  for v in voice['voices']
 },
 'unresolved':['Human director 85/100 acceptance',
  'Low-end real phone GPU','Full remaining cast face/voice parity',
  'Official site/default high-poly rollout'],
 'receipts':[x[0] for x in cases.values()]
}
dest=root/'r140/source-faces/r140-convergence.json'
dest.parent.mkdir(parents=True,exist_ok=True)
dest.write_text(json.dumps(receipt,indent=2,ensure_ascii=False))
print('R140_558_REAL_GPU_CHECKS_PASS',json.dumps({
 'total':tot,'new':receipt['newOriginalActorChecks'],
 'artApproved':False,'default':'R97'},ensure_ascii=False))
