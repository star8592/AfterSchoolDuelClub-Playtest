#!/usr/bin/env python3
"""Ten ORIGINAL Qwen3-TTS 1.7B character-hit lines (two actors x five props).
Qwen source is cached locally. No browser runtime synthesis or copied voices.
"""
from pathlib import Path
from hashlib import sha256
import json,subprocess,time
import numpy as np
import soundfile as sf
import torch
from qwen_tts import Qwen3TTSModel

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/audio/voices'
manifestPath=ROOT/'assets/audio/voice-manifest.json'
old=json.loads(manifestPath.read_text())
cache=Path.home()/'.cache/huggingface/hub/models--Qwen--Qwen3-TTS-12Hz-1.7B-CustomVoice/snapshots'
snapshots=list(cache.glob('*'))
assert snapshots,'Qwen3-TTS original 1.7B custom-voice cache missing'
script={
 'E06':('哎哟！谁拿黑板擦砸我的脑袋！','哎呀！黑板擦擦的是我这张脸呀！'),
 'Q05':('阿嚏！粉笔记者会怎么开到我鼻子里了！','阿嚏！这采访我拒绝，粉笔灰太大啦！'),
 'K01':('等等！为什么茄子和香蕉都砸过来了！','救命！我头上怎么多了一道黑暗料理！'),
 'K07':('啊！蛤蟆怎么跳到我肩膀上了！','呀！这布丁里面居然藏着一只蛤蟆！'),
 'P07':('哎哟喂！天鹅滑冰怎么滑到我脚下啦！','啊呀！冰太滑了，我的鞋都刹不住啦！')
}
instruct={
 'HOST_AI':'夸张但自然的校园喜剧男生。突然被滑稽物件碰撞受惊，情绪跳跃，语句清晰，短促有节奏。不要恐怖，不要真实痛苦。',
 'HOST_PLAYER':'活泼幽默的校园女生。被荒诞校园魔法砸中，先惊叫再快速吐槽，夸张而不尖锐，真实有性格。'
}
torch.set_num_threads(4)
model=Qwen3TTSModel.from_pretrained(str(snapshots[0]),device_map='cuda:0',
 dtype=torch.bfloat16,attn_implementation='sdpa',local_files_only=True)
supported=set(model.get_supported_speakers())
assert {'serena','dylan'}.issubset(supported)
begin=time.monotonic();completed=[]
for id,(boy,girl) in script.items():
 for host,text,speaker in [('HOST_AI',boy,'dylan'),('HOST_PLAYER',girl,'serena')]:
  path=OUT/(host+'-r202_'+id+'.ogg')
  if not path.is_file() or path.stat().st_size<2000:
   wav=OUT/('.r202-'+host+'-'+id+'.wav')
   samples,sr=model.generate_custom_voice(text=text,language='Chinese',
    speaker=speaker,instruct=instruct[host],max_new_tokens=290)
   data=np.asarray(samples[0],dtype='float32')
   duration=len(data)/sr
   assert .65<duration<12 and np.isfinite(data).all() and np.max(np.abs(data))>.004
   sf.write(wav,data,sr)
   subprocess.run(['ffmpeg','-nostdin','-y','-hide_banner','-loglevel','error',
    '-i',str(wav),'-af',
    'highpass=f=105,lowpass=f=7600,acompressor=threshold=-19dB:ratio=1.6:attack=10:release=110,loudnorm=I=-16:TP=-1.5:LRA=9',
    '-c:a','libopus','-b:a','42k','-ar','48000',str(path)],check=True)
   wav.unlink(missing_ok=True)
  length=float(subprocess.check_output(['ffprobe','-v','error','-show_entries',
   'format=duration','-of','default=noprint_wrappers=1:nokey=1',str(path)],text=True))
  assert .55<length<12 and path.stat().st_size>2000,(host,id,length)
  old['clips'][host]['r202_'+id]={
   'file':path.name,'model':'Qwen3-TTS-12Hz-1.7B-CustomVoice',
   'speaker':speaker,'text':text,
   'duration_seconds':round(length,2),'sha256':sha256(path.read_bytes()).hexdigest(),
   'ready':True,'review_status':'pending-human-listening',
   'license':'project-original-fictional-performance'}
  completed.append(path)
  print('R202_CHARACTER_VOICE_READY',host,id,round(length,2),path.stat().st_size,
        'elapsed',round(time.monotonic()-begin,1),flush=True)
# Only write manifest once every 10 actual Opus files have been checked.
assert len(completed)==10
temp=manifestPath.with_suffix('.r202-writing.tmp')
temp.write_text(json.dumps(old,ensure_ascii=False,indent=2)+'\n')
temp.replace(manifestPath)
print('R202_TEN_ORIGINAL_QWEN_CHARACTER_VOICES_PASS',len(completed),
      'elapsed',round(time.monotonic()-begin),flush=True)
