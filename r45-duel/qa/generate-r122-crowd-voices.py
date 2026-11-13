"""R122 self-authored school spectators' startled cries; offline Qwen3-TTS.
No remote synthesis, copied performer recordings, or fake spoken subtitles.
Requires the existing locally cached 1.7B custom-voice model.
"""
from pathlib import Path
from hashlib import sha256
import json,subprocess,torch,soundfile as sf
from qwen_tts import Qwen3TTSModel

torch.set_num_threads(4)
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/audio/crowd';OUT.mkdir(parents=True,exist_ok=True)
snaps=list((Path.home()/'.cache/huggingface/hub/models--Qwen--Qwen3-TTS-12Hz-1.7B-CustomVoice/snapshots').glob('*'))
if not snaps: raise RuntimeError('OFFLINE_QWEN_MODEL_NOT_CACHED')
lines=[
 ('ricochet_a','ricochet','啊！我的爆米花！','vivian'),
 ('ricochet_b','ricochet','哎呀，这玩意儿怎么会拐弯！','dylan'),
 ('overshoot_a','overshoot','啊啊啊！别往看台扔啊！','vivian'),
 ('overshoot_b','overshoot','救命！头发炸起来啦！','dylan'),
 ('shockwave_a','shockwave','哎哟！我的帽子！','ryan'),
 ('shockwave_b','shockwave','天呐，书包飞走啦！','serena'),
 ('misfire_a','misfire','哇！打偏了！打偏了！','ryan'),
 ('misfire_b','misfire','同学，看清楚！我只是观众！','serena')
]
scene='校园动画喜剧的看台观众，突然被魔法吓到，短促夸张、急促惊叫和搞笑吐槽；不要真实痛苦、不要恐怖氛围。'
model=Qwen3TTSModel.from_pretrained(str(snaps[0]),device_map='cuda:0',
 dtype=torch.bfloat16,attn_implementation='sdpa',local_files_only=True)
supported=set(model.get_supported_speakers())
assert all(speaker in supported for _,_,_,speaker in lines)
manifest={'provider':'Qwen3-TTS','model':'Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice',
 'version':'R122','clips':{},'review_status':'pending-human-listening'}
for key,scenario,text,speaker in lines:
 target=OUT/f'r122_{key}.ogg'
 if not target.is_file():
  wav,sr=model.generate_custom_voice(text=text,language='Chinese',
   speaker=speaker,instruct=scene,max_new_tokens=300)
  tmp=OUT/f'.r122_{key}.wav'
  sf.write(str(tmp),wav[0],sr)
  subprocess.run(['ffmpeg','-nostdin','-y','-loglevel','error',
   '-i',str(tmp),'-af',
   'highpass=f=115,lowpass=f=7200,acompressor=threshold=-19dB:ratio=1.6:attack=10:release=120,loudnorm=I=-16:TP=-1.5:LRA=9',
   '-c:a','libopus','-b:a','48k','-ar','48000',str(target)],check=True)
  tmp.unlink(missing_ok=True)
 duration=round(float(subprocess.check_output(['ffprobe','-v','error','-show_entries',
  'format=duration','-of','default=noprint_wrappers=1:nokey=1',str(target)],text=True)),2)
 if not (.4<duration<9 and target.stat().st_size>2000):
  raise RuntimeError(f'BAD_VOICE_ASSET {key} {duration} {target.stat().st_size}')
 manifest['clips'][key]={'file':target.name,'text':text,'speaker':speaker,
  'scenario':scenario,'duration_seconds':duration,'ready':True,
  'sha256':sha256(target.read_bytes()).hexdigest(),'review_status':'pending-human-listening'}
 print('R122_VOICE',key,target.stat().st_size,duration,flush=True)
(OUT/'crowd-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('R122_CROWD_QWEN8_PASS',len(manifest['clips']),flush=True)
