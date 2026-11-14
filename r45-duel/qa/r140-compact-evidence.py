"""Compact authentic R140 original-source face and voice GPU receipts.
Read the raw Z890 Chrome browser reports; never invent counters.
"""
from pathlib import Path
import json
base=Path('r45-duel/qa/evidence/r140/source-faces')
face=json.loads((base/'r140-real-source-face.json').read_text())
voice=json.loads((base/'r140-all-four-actual-qwen.json').read_text())
assert face['passed'] is True and len(face['checks'])==170
assert voice['passed'] is True and len(voice['checks'])==54
assert all(x['pass'] for x in face['checks']+voice['checks'])
assert len(face['views'])==len(voice['voices'])==2
result={
 'passed':True,'artApproved':False,
 'source':'real GPU Chrome on Z890 original authored GLB, desktop 1440 + portrait 430',
 'voiceSource':'confirmed Qwen3 HTMLAudioElement playing and stop callbacks',
 'notForcedPhonemeAlignment':True,
 'checks':{'face':face['checks'],'voice':voice['checks']},
 'faces':{},
 'voices':{}
}
for stage in face['views']:
 view=stage['view']
 assert set(stage['actors'])=={'E04','G02','G04','T03'}
 result['faces'][view]={}
 for id,actor in stage['actors'].items():
  stateMap=actor['states']
  assert set(stateMap)=={'idle','attack','hit','celebrate'}
  result['faces'][view][id]={
   'originalModel':True,'stages':{
    name:{
     'state':s['state'],'maxJaw':s['jawAngle'],
     'maxOriginalMorph':s['maxMorph'],
     'actualTargets':[{'name':t['target'],'mesh':t['mesh'],
                       'weight':t['weight']} for t in s['targets']]
    } for name,s in stateMap.items()}
  }
for item in voice['voices']:
 view=item['view']
 assert set(item['voices'])=={'E04','G02','G04','T03'}
 assert item['duplicateCardVoiceIsolated']
 result['voices'][view]={id:{'maxActualMouth':r['maxMouth'],
    'realStopSerial':r['serialStopped']} for id,r in item['voices'].items()}
 result['voices'][view]['duplicateCardVoiceIsolated']=True
dest=base/'r140-face-voice-compact.json'
dest.write_text(json.dumps(result,ensure_ascii=False,indent=2))
print('R140_COMPACT_AUTHENTIC_EVIDENCE_PASS',
      {'faceChecks':170,'voiceChecks':54,'views':list(result['faces']),
       'fileBytes':dest.stat().st_size})
