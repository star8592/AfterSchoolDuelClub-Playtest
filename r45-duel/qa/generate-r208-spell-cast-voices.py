#!/usr/bin/env python3
"""R208: offline, truthful Qwen voice for all 46 campus absurd spell casts.
Two original host speakers, 92 distinct Opus recordings. NEVER runtime TTS.
Existing files are revalidated and reused; manifest switches only after all pass.
"""
from pathlib import Path
from hashlib import sha256
import json,subprocess
import numpy as np
import soundfile as sf
import torch
from qwen_tts import Qwen3TTSModel

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/audio/voices'
MANIFEST=ROOT/'assets/audio/voice-manifest.json'
cmd=['node','--input-type=module','-e',
 "import('./scene/campus-magic-bible.mjs').then(m=>console.log(JSON.stringify(m.SCHOOL_MAGIC_IDENTITIES)))"]
spells=json.loads(subprocess.check_output(cmd,cwd=ROOT,text=True))
assert len(spells)==46
original=json.loads(MANIFEST.read_text())
assert original['provider']=='Qwen3-TTS'
snap=list((Path.home()/'.cache/huggingface/hub/models--Qwen--Qwen3-TTS-12Hz-1.7B-CustomVoice/snapshots').glob('*'))
assert snap,'R208_LOCAL_QWEN_CACHE_REQUIRED'
torch.set_num_threads(3)
torch.set_grad_enabled(False)
model=Qwen3TTSModel.from_pretrained(str(snap[0]),
 device_map='cuda:0',dtype=torch.bfloat16,attn_implementation='sdpa',local_files_only=True)
speakers={'HOST_PLAYER':'serena','HOST_AI':'dylan'}
assert set(speakers.values()).issubset(set(model.get_supported_speakers()))
styles={
 'HOST_PLAYER':'精力充沛又调皮的校园女生，在魔法卡真正甩出去的瞬间俏皮叫招，动作鲜明、节奏快速自然、抑扬顿挫，不能用播音腔或尖叫。',
 'HOST_AI':'嘴硬机灵的校园男生，甩出滑稽魔法时像和同学打闹，惊喜得意的短句，节奏鲜明，不能用播音腔或持续大喊。'
}
completed=[]
for card in sorted(spells):
 text=spells[card]['lines']['cast']
 assert 6<=len(text)<80
 for host,speaker in speakers.items():
  path=OUT/(host+'-r208_'+card+'.ogg')
  if not path.is_file() or path.stat().st_size<1700:
   print('R208_SYNTH_BEGIN',len(completed)+1,host,card,flush=True)
   sound,sr=model.generate_custom_voice(text=text,language='Chinese',
    speaker=speaker,instruct=styles[host],max_new_tokens=250)
   arr=np.asarray(sound[0],dtype='float32')
   assert np.isfinite(arr).all() and .5<len(arr)/sr<13 and np.max(abs(arr))>.004
   wav=OUT/('.r208-'+host+'-'+card+'.wav')
   sf.write(wav,arr,sr)
   subprocess.run(['ffmpeg','-nostdin','-y','-hide_banner','-loglevel','error',
    '-i',str(wav),
    '-af','highpass=f=105,lowpass=f=7600,acompressor=threshold=-19dB:ratio=1.5:attack=10:release=110,loudnorm=I=-16:TP=-1.5:LRA=9',
    '-c:a','libopus','-b:a','42k','-ar','48000',str(path)],check=True)
   wav.unlink(missing_ok=True)
  duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries',
   'format=duration','-of','default=noprint_wrappers=1:nokey=1',str(path)],text=True))
  assert .55<duration<13 and path.stat().st_size>1700,(host,card,duration)
  original['clips'][host]['r208_'+card]={
   'file':path.name,'model':'Qwen3-TTS-12Hz-1.7B-CustomVoice',
   'speaker':speaker,'text':text,'duration_seconds':round(duration,2),
   'sha256':sha256(path.read_bytes()).hexdigest(),'ready':True,
   'review_status':'pending-human-listening','license':'project-original-fictional-performance'}
  completed.append((host,card,duration,path.stat().st_size))
  print('R208_QWEN_CLIP_READY',len(completed),'of',len(spells)*2,host,card,
   round(duration,2),path.stat().st_size,flush=True)
assert len(completed)==92
tmp=MANIFEST.with_suffix('.r208.tmp')
tmp.write_text(json.dumps(original,ensure_ascii=False,indent=2)+'\n')
tmp.replace(MANIFEST)
print('R208_46_DISTINCT_SPELLS_92_LOCAL_ORIGINAL_QWEN_HOST_CLIPS_PASS',flush=True)
