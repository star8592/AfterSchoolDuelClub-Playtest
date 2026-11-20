#!/usr/bin/env python3
"""R209 original two-speaker impact exclamations, not synthetic in browser.
They play quietly *only* during real interruptible spell voice and actual
authoritative hurt; preserve the full recorded source + subsequent retort.
"""
from pathlib import Path
from hashlib import sha256
import json,subprocess
import numpy as np
import soundfile as sf
import torch
from qwen_tts import Qwen3TTSModel
root=Path(__file__).resolve().parents[1]
out=root/'assets/audio/voices'
snap=list((Path.home()/'.cache/huggingface/hub/models--Qwen--Qwen3-TTS-12Hz-1.7B-CustomVoice/snapshots').glob('*'))
assert snap
torch.set_num_threads(3)
torch.set_grad_enabled(False)
model=Qwen3TTSModel.from_pretrained(str(snap[0]),device_map='cuda:0',
 dtype=torch.bfloat16,attn_implementation='sdpa',local_files_only=True)
roles={
 'HOST_PLAYER':('serena','哎哟！','校园女生突然被滑稽物品砸中，一声极其短促的小惊呼。轻快、自然、有点幽默，不要长喊。'),
 'HOST_AI':('dylan','哎呀！','校园男生被莫名其妙的东西砸到，发出极短的一声搞笑惊呼。轻快自然，不要惨叫。')}
manifest={'provider':'Qwen3-TTS','version':'R209','source':'original-Qwen3-TTS-1.7B-CustomVoice',
 'review_status':'pending-human-listening','clips':{}}
for id,(speaker,text,style) in roles.items():
 file=id+'-r209-impact-gasp.ogg';path=out/file
 if not path.exists() or path.stat().st_size<1500:
  samples,sr=model.generate_custom_voice(text=text,language='Chinese',speaker=speaker,
   instruct=style,max_new_tokens=160)
  data=np.asarray(samples[0],dtype='float32')
  assert np.isfinite(data).all() and .25<len(data)/sr<8 and max(abs(data))>.004
  wav=out/('.r209-'+id+'.wav');sf.write(wav,data,sr)
  subprocess.run(['ffmpeg','-nostdin','-y','-hide_banner','-loglevel','error',
   '-i',str(wav),'-af',
   'highpass=f=105,lowpass=f=7800,acompressor=threshold=-20dB:ratio=1.4:attack=5:release=75,loudnorm=I=-16:TP=-1.5:LRA=9',
   '-c:a','libopus','-b:a','42k','-ar','48000',str(path)],check=True)
  wav.unlink(missing_ok=True)
 duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries',
  'format=duration','-of','default=noprint_wrappers=1:nokey=1',str(path)],text=True))
 assert .4<duration<5,(id,duration)
 manifest['clips'][id]={'file':file,'speaker':speaker,'text':text,
  'duration_seconds':round(duration,2),'sha256':sha256(path.read_bytes()).hexdigest(),
  'ready':True,'review_status':'pending-human-listening'}
 print('R209_REAL_GASP',id,duration,path.stat().st_size,flush=True)
target=root/'assets/audio/r209-impact-gasp-manifest.json'
target.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('R209_TWO_ORIGINAL_QWEN_HIT_EXCLAMATIONS_READY',flush=True)
