"""Original R123 stadium emergency announcements (four props).
Repro: uv run --offline --no-project -p 3.12 --with qwen-tts --with soundfile -- python r45-duel/qa/generate-r123-prop-announcer.py
All voices are source-generated locally, never a real person's recording.
"""
from pathlib import Path
from hashlib import sha256
import json,subprocess
import torch,soundfile as sf
from qwen_tts import Qwen3TTSModel

torch.set_num_threads(4)
root=Path(__file__).resolve().parents[1]
out=root/'assets/audio/crowd'
out.mkdir(parents=True,exist_ok=True)
snap=list((Path.home()/'.cache/huggingface/hub/models--Qwen--Qwen3-TTS-12Hz-1.7B-CustomVoice/snapshots').glob('*'))
assert snap, 'LOCAL_QWEN_MODEL_REQUIRED'
script=[
 ('popcorn','体育馆广播通知！刚才的爆米花已经提前退场，请同学们停止空中接玉米！'),
 ('juice','本场紧急提醒！观众席不是饮料喷泉！喝奶茶的同学请把吸管收好！'),
 ('homework','紧急通知！飞进校长室的作业，不算自动上交！请同学们原地捡回！'),
 ('backpack','体育馆消息！一只书包刚刚刷新了本校跳高纪录！主人请去领奖！')
]
model=Qwen3TTSModel.from_pretrained(str(snap[0]),device_map='cuda:0',
 dtype=torch.bfloat16,attn_implementation='sdpa',local_files_only=True)
assert 'ryan' in model.get_supported_speakers()
manifest={'provider':'Qwen3-TTS',
 'model':'Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice',
 'version':'R123','review_status':'pending-human-listening',
 'clips':{}}
for kind,text in script:
 file=out/f'r123_pa_{kind}.ogg'
 if not file.exists():
  a,sr=model.generate_custom_voice(text=text,language='Chinese',
   speaker='ryan',
   instruct='一本正经的校园体育馆运动会主持人，严肃播报荒诞奇闻，微妙喜剧停顿，充满现场感，不要像机器人。',max_new_tokens=430)
  wav=out/f'.r123_pa_{kind}.wav';sf.write(str(wav),a[0],sr)
  subprocess.run(['ffmpeg','-nostdin','-y','-loglevel','error','-i',str(wav),
   '-af','highpass=f=110,lowpass=f=7200,acompressor=threshold=-18dB:ratio=1.5:attack=10:release=120,loudnorm=I=-16:TP=-1.5:LRA=9',
   '-c:a','libopus','-b:a','48k','-ar','48000',str(file)],check=True)
  wav.unlink(missing_ok=True)
 duration=round(float(subprocess.check_output(['ffprobe','-v','error','-show_entries',
  'format=duration','-of','default=noprint_wrappers=1:nokey=1',str(file)],text=True)),2)
 assert .6<duration<14 and file.stat().st_size>3000,(kind,duration)
 manifest['clips'][kind]={'file':file.name,'text':text,'speaker':'ryan',
  'duration_seconds':duration,'sha256':sha256(file.read_bytes()).hexdigest(),
  'ready':True,'review_status':'pending-human-listening'}
 print('R123_PROP_PA',kind,file.stat().st_size,duration,flush=True)
(out/'r123-prop-pa-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('R123_ORIGINAL_QWEN_PA_PASS',len(manifest['clips']),flush=True)
