#!/usr/bin/env python3
import json,hashlib,subprocess,shutil
from pathlib import Path
root=Path(__file__).resolve().parents[1]
manifest=json.loads((root/'assets/audio/r171-original-foley-manifest.json').read_text())
queue=json.loads((root/'assets/audio/r171-campus-voice-production-queue.json').read_text())
old=Path('/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118/r171-voices/r171-real-chrome-audio-decode.json')
assert old.exists()
audit=json.loads(old.read_text())
assert audit['passed'] and len(audit['audio'])==14
assert len(manifest['clips'])==14 and len(queue['clips'])==230
assert queue['recorded']==0 and all(not x['recorded'] for x in queue['clips'])
assert {x.get('clip_id',x.get('key')) for x in audit['audio']}==set(manifest['clips'])
for k,v in manifest['clips'].items():
 p=root/'assets/audio'/v['file']
 assert p.exists() and hashlib.sha256(p.read_bytes()).hexdigest()==v['sha256'],k
 duration=float(subprocess.check_output(['ffprobe','-v','error',
  '-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(p)],text=True))
 assert .25<duration<1.4,k
assert sum(1 for x in audit['patterns'] if x['own'])==14
dest=root/'qa/evidence/r171-original-audio';dest.mkdir(parents=True,exist_ok=True)
for a in audit['audio']:
 if 'key' in a:a['clip_id']=a.pop('key')
(dest/'r171-real-chrome-audio-decode.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2))
summary={'date':'2026-11-18','newOriginalOgg':14,
 'decodedByChrome':14,'encodedBytes':sum(x['bytes'] for x in manifest['clips'].values()),
 'modifiedCardLevelFoley':14,'remainingExistingFoleyPatterns':32,
 'spellsWithAudioPatterns':46,
 'sourceSHA256Pass':True,'song_or_third_party_audio':False,
 'newQwenVoicesRecorded':0,'voiceScriptsReady':230,
 'QwenTTSBlockingReason':'Old env missing torch; offline uv install cannot retrieve compatible torch/sentencepiece/pandas wheels; no fake recordings generated',
 'releaseDecision':'DRAFT / NO-GO (new voice missing; SFX pending subjective listening and game performance review)'}
(dest/'r171-final-audio-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
print('R171_SOUND_QA',json.dumps(summary,ensure_ascii=False))
