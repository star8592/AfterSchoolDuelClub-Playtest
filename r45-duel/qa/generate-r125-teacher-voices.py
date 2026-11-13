"""Two locally synthesized original Qwen3-TTS lines for the real M01 music teacher."""
from pathlib import Path
from hashlib import sha256
import json,subprocess
import torch,soundfile as sf
from qwen_tts import Qwen3TTSModel
torch.set_num_threads(4)
root=Path(__file__).resolve().parents[1]
out=root/'assets/audio/crowd';out.mkdir(parents=True,exist_ok=True)
snap=list((Path.home()/'.cache/huggingface/hub/models--Qwen--Qwen3-TTS-12Hz-1.7B-CustomVoice/snapshots').glob('*'))
assert snap,'LOCAL_QWEN_MODEL_REQUIRED'
script=[
 ('order','停！停！我说过多少遍了！观众席不是魔法练习场！'),
 ('paper','谁把我的五线谱吹成纸飞机了！两位决斗者，先把地扫干净！')
]
model=Qwen3TTSModel.from_pretrained(str(snap[0]),device_map='cuda:0',
 dtype=torch.bfloat16,attn_implementation='sdpa',local_files_only=True)
assert 'serena' in model.get_supported_speakers()
manifest={'provider':'Qwen3-TTS','model':'Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice',
 'version':'R125','review_status':'pending-human-listening','actor':'M01','clips':{}}
for kind,text in script:
 file=out/f'r125_teacher_{kind}.ogg'
 if not file.exists():
  a,sr=model.generate_custom_voice(text=text,language='Chinese',speaker='serena',
   instruct='一位气场很强但很可爱的学校音乐老师，夸张而幽默地呵斥乱扔魔法的孩子，音量清晰，戏剧式节奏，避免尖锐伤耳。',max_new_tokens=400)
  wav=out/f'.r125_teacher_{kind}.wav';sf.write(str(wav),a[0],sr)
  subprocess.run(['ffmpeg','-nostdin','-y','-loglevel','error','-i',str(wav),
   '-af','highpass=f=110,lowpass=f=7200,acompressor=threshold=-18dB:ratio=1.5:attack=10:release=120,loudnorm=I=-16:TP=-1.5:LRA=9',
   '-c:a','libopus','-b:a','48k','-ar','48000',str(file)],check=True)
  wav.unlink(missing_ok=True)
 duration=round(float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of',
  'default=noprint_wrappers=1:nokey=1',str(file)],text=True)),2)
 assert .6<duration<14 and file.stat().st_size>3000,(kind,duration)
 manifest['clips'][kind]={'file':file.name,'text':text,'speaker':'serena',
  'duration_seconds':duration,'sha256':sha256(file.read_bytes()).hexdigest(),
  'ready':True,'review_status':'pending-human-listening'}
 print('R125_TEACHER_CLIP',kind,file.stat().st_size,duration,flush=True)
(out/'r125-teacher-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('R125_TEACHER_VOICES_PASS',len(manifest['clips']),flush=True)
