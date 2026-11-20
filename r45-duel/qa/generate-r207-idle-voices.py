#!/usr/bin/env python3
"""Offline original character-accurate R207 voices. No runtime TTS.
An existing recorded speaker is kept for each character. Sources and actual
Opus content SHA are checked before touching the original manifest.
"""
import json
import subprocess
from hashlib import sha256
from pathlib import Path
import numpy as np
import soundfile as sf
import torch
from qwen_tts import Qwen3TTSModel

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/audio/voices'
MANIFEST=ROOT/'assets/audio/voice-manifest.json'
lines=json.loads(subprocess.check_output(
 ['node','--input-type=module','-e',
  "import('./r207-idle-chatter.mjs').then(m=>console.log(JSON.stringify(m.R207_IDLE_LINES)))"],
 cwd=ROOT,text=True))
old=json.loads(MANIFEST.read_text())
assert old['provider']=='Qwen3-TTS'
assert len(lines)==16
snap=list((Path.home()/'.cache/huggingface/hub/models--Qwen--Qwen3-TTS-12Hz-1.7B-CustomVoice/snapshots').glob('*'))
assert snap,'QWEN3_TTS_LOCAL_CACHE_MISSING'
style={
 'HOST_PLAYER':'活泼灵动、有点调皮的校园女生，像和同学嘀咕，轻快幽默自然，轻声但字清晰。',
 'HOST_AI':'嘴硬但可爱的校园男生，闲聊像吐槽同桌，俏皮带笑，不要宣读台词。',
 'E01':'跑得气喘却不服输的学生，开玩笑时快慢有变化。',
 'E02':'轻盈的小纸飞机拟人声音，聪明可爱，轻快，不尖叫。',
 'E03':'校园加油队队长，阳光热血但音量适中，像鼓励朋友。',
 'E04':'风风火火的食堂接力员，节奏快，有点馋，像朋友聊天。',
 'G01':'爱整活的橡皮筋建筑师，机灵、一本正经胡说八道。',
 'G02':'认真谨慎的黑板密码专家，小声却急切，字字清楚。',
 'G03':'充满好奇的实验学长，沉迷实验的轻松自言自语。',
 'G04':'严肃的社团计划总监，把荒唐话说得一本正经。',
 'M01':'充满戏剧趣味的音乐老师，念节拍有韵律，温和活泼，不要吼。',
 'M02':'有烟火气、护短的食堂阿姨，爽朗有趣，像边做饭边开玩笑。',
 'T01':'爱插嘴的校园猫头鹰，略古灵精怪、轻快有趣，不要刺耳。',
 'T02':'会吐槽的食堂菜单，带一点傲娇，像边抱怨边偷笑。',
 'T03':'认真热心但偶尔迷糊的信使，有点急促，亲切。',
 'T04':'沉稳守门人，规矩中带笑意，像在劝一群闹腾的学生。'
}
torch.set_num_threads(3)
torch.set_grad_enabled(False)
model=Qwen3TTSModel.from_pretrained(str(snap[0]),device_map='cuda:0',
 dtype=torch.bfloat16,attn_implementation='sdpa',local_files_only=True)
supported={v.lower() for v in model.get_supported_speakers()}
print('R207_SUPPORTED_SPEAKERS',sorted(supported),flush=True)
ready=[]
for actor,variants in lines.items():
 assert len(variants)==2 and actor in old['clips']
 oldEntry=old['clips'][actor]
 entry=oldEntry.get('enter') or oldEntry.get('cast')
 assert entry and entry['speaker']
 speaker=entry['speaker'].lower()
 assert speaker in supported,(actor,speaker)
 for n,text in enumerate(variants):
  kind='idle' if n==0 else 'idle_v2'
  path=OUT/(actor+'-r207_'+kind+'.ogg')
  if not path.exists() or path.stat().st_size<1800:
   print('R207_SYNTH_BEGIN',actor,kind,flush=True)
   data,sr=model.generate_custom_voice(text=text,language='Chinese',
     speaker=speaker,instruct=style[actor],max_new_tokens=280)
   arr=np.asarray(data[0],dtype='float32')
   assert np.isfinite(arr).all() and np.max(np.abs(arr))>.004,(actor,kind,'silent')
   wav=OUT/('.r207-'+actor+'-'+kind+'.wav')
   sf.write(wav,arr,sr)
   subprocess.run(['ffmpeg','-nostdin','-y','-hide_banner','-loglevel','error',
     '-i',str(wav),'-af','highpass=f=95,lowpass=f=7800,acompressor=threshold=-19dB:ratio=1.5:attack=10:release=110,loudnorm=I=-16:TP=-1.5:LRA=9',
     '-c:a','libopus','-b:a','42k','-ar','48000',str(path)],check=True)
   wav.unlink(missing_ok=True)
  duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration',
    '-of','default=noprint_wrappers=1:nokey=1',str(path)],text=True))
  assert .55<duration<13 and path.stat().st_size>1800,(actor,kind,duration)
  oldEntry[kind]={'file':path.name,
   'model':'Qwen3-TTS-12Hz-1.7B-CustomVoice','speaker':speaker,
   'text':text,'duration_seconds':round(duration,2),
   'sha256':sha256(path.read_bytes()).hexdigest(),
   'ready':True,'review_status':'pending-human-listening',
   'license':'project-original-fictional-performance'}
  ready.append((actor,kind))
  print('R207_CLIP_READY',len(ready),'of',len(lines)*2,actor,kind,round(duration,2),path.stat().st_size,flush=True)
assert len(ready)==32
tmp=MANIFEST.with_suffix('.r207.tmp')
tmp.write_text(json.dumps(old,ensure_ascii=False,indent=2)+'\n')
tmp.replace(MANIFEST)
print('R207_ALL_16_CHARACTERS_32_REAL_QWEN_OPUS_READY',flush=True)
