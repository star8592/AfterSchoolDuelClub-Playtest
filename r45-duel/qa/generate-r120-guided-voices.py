"""Original offline narrated duel voice set via cached Qwen3-TTS 1.7B.

Run: uv run --offline --no-project -p 3.12 --with qwen-tts --with soundfile -- python r45-duel/qa/generate-r120-guided-voices.py
Preserve generated clip hash/voice/text metadata; do not claim human audition.
"""
from pathlib import Path
from hashlib import sha256
import json,re,subprocess,time
import torch,soundfile as sf
from qwen_tts import Qwen3TTSModel
ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/'assets/audio/tutorial';DEST.mkdir(parents=True,exist_ok=True)
SOURCE=(ROOT/'guided-tutorial.mjs').read_text()
PATTERN=r"^ ([a-z0-9_]+):\{side:'(player|ai)',text:'([^']+)'\}"
lines=[(k,side,phrase) for k,side,phrase in re.findall(PATTERN,SOURCE,re.M)]
assert len(lines)==14,len(lines)
snapshots=list((Path.home()/'.cache/huggingface/hub/models--Qwen--Qwen3-TTS-12Hz-1.7B-CustomVoice/snapshots').glob('*'))
assert snapshots,'Only use genuine local licensed model snapshot; do not fall back to remote API.'
torch.set_num_threads(4)
model=Qwen3TTSModel.from_pretrained(str(snapshots[0]),device_map='cuda:0',
 dtype=torch.bfloat16,attn_implementation='sdpa',local_files_only=True)
voices={'player':('serena','活泼清楚的女学生，认真地教别人玩卡牌，说话像校园伙伴，语速适中。'),
        'ai':('dylan','自然幽默的男学生，像朋友一起对战，解释自己操作时热情清楚，普通话自然。')}
assert {v[0] for v in voices.values()}.issubset(set(model.get_supported_speakers()))
manifest={'provider':'Qwen3-TTS','model':'Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice',
 'version':'R120','provenance':'Z890 offline original speech; no realtime synthesis',
 'review_status':'pending-human-listening','clips':{}}
start=time.monotonic()
for key,side,words in lines:
 speaker,instruction=voices[side]
 dest=DEST/f'r120_{key}.ogg';wav=DEST/f'.r120_{key}.wav'
 if not dest.exists():
  audio,sr=model.generate_custom_voice(text=words,language='Chinese',
    speaker=speaker,instruct=instruction,max_new_tokens=480)
  sf.write(wav,audio[0],sr)
  subprocess.run(['ffmpeg','-nostdin','-y','-loglevel','error','-i',str(wav),
    '-af','highpass=f=105,lowpass=f=7400,acompressor=threshold=-18dB:ratio=1.5:attack=9:release=110,loudnorm=I=-16:TP=-1.5:LRA=9',
    '-c:a','libopus','-b:a','48k','-ar','48000',str(dest)],check=True)
  wav.unlink(missing_ok=True)
 duration=round(float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration',
  '-of','default=noprint_wrappers=1:nokey=1',str(dest)],text=True)),2)
 assert .6<duration<26 and dest.stat().st_size>3500,(key,duration)
 manifest['clips'][key]={'file':dest.name,'text':words,'speaker':speaker,'side':side,
  'duration_seconds':duration,'sha256':sha256(dest.read_bytes()).hexdigest(),
  'ready':True,'review_status':'pending-human-listening'}
 print('GUIDED_QWEN_CLIP',key,side,duration,dest.stat().st_size,'elapsed',round(time.monotonic()-start,1),flush=True)
(DEST/'tutorial-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('GUIDED_QWEN_BATCH_PASS',len(manifest['clips']),sum((DEST/x['file']).stat().st_size for x in manifest['clips'].values()),flush=True)
