"""R113 original Qwen3-TTS from cached 1.7B model, no remote synthesis."""
from pathlib import Path
from hashlib import sha256
import json,subprocess,time
import torch,soundfile as sf
from qwen_tts import Qwen3TTSModel
torch.set_num_threads(4)
ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/'assets/audio/pa';DEST.mkdir(parents=True,exist_ok=True)
snaps=list((Path.home()/'.cache/huggingface/hub/models--Qwen--Qwen3-TTS-12Hz-1.7B-CustomVoice/snapshots').glob('*'))
assert snaps
PA='热情、清楚、滑稽的校园体育馆广播员，运动会现场语气，声音自然。'
CHAT='像学生之间小声讲话，带一点调皮和不服气，语气自然，普通话清楚。'
lines=[
 ('start','同学们注意！放学后决斗社，现在开战！','ryan',PA),
 ('pressure','注意注意！比赛进入白热化阶段！双方同学请稳住！','ryan',PA),
 ('win_player','恭喜我方队伍获胜！掌声响起来！全队开始胜利舞蹈！','ryan',PA),
 ('win_ai','恭喜对方队伍获胜！掌声送给他们！开始胜利舞蹈！','ryan',PA),
 ('draw','双方打成平手！没关系，下课铃还没响，再战一局！','ryan',PA),
 ('whisper_player','嘘……听说食堂今天又做茄子炒香蕉。','vivian',CHAT),
 ('whisper_ai','别说了，阿姨就在旁边！','dylan',CHAT),
 ('challenge_player','这手牌要是输了，我就把课桌吃了！','vivian',CHAT),
 ('challenge_ai','那你先准备好筷子。','dylan',CHAT)
]
model=Qwen3TTSModel.from_pretrained(str(snaps[0]),device_map='cuda:0',
 dtype=torch.bfloat16,attn_implementation='sdpa',local_files_only=True)
assert {line[2] for line in lines}.issubset(set(model.get_supported_speakers()))
manifest={'provider':'Qwen3-TTS','model':'Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice',
 'version':'R113','provenance':'Offline Z890 model inference; audition pending',
 'review_status':'pending-human-listening','clips':{}}
start=time.time()
for key,text,speaker,instruct in lines:
 target=DEST/f'r113_{key}.ogg';tmp=DEST/f'.r113_{key}.wav'
 if key=='start' and Path('/tmp/asdc-r113-announcer-pilot.wav').is_file():
  tmp.write_bytes(Path('/tmp/asdc-r113-announcer-pilot.wav').read_bytes())
 else:
  wav,sr=model.generate_custom_voice(text=text,language='Chinese',
   speaker=speaker,instruct=instruct,max_new_tokens=330)
  sf.write(str(tmp),wav[0],sr)
 subprocess.run(['ffmpeg','-nostdin','-y','-loglevel','error','-i',str(tmp),
  '-af','highpass=f=120,lowpass=f=6800,acompressor=threshold=-18dB:ratio=1.6:attack=10:release=110,loudnorm=I=-16:TP=-1.5:LRA=9',
  '-c:a','libopus','-b:a','48k','-ar','48000',str(target)],check=True)
 tmp.unlink(missing_ok=True)
 duration=round(float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration',
  '-of','default=noprint_wrappers=1:nokey=1',str(target)],text=True)),2)
 assert .75<duration<13 and target.stat().st_size>3000,(key,duration)
 manifest['clips'][key]={'file':target.name,'text':text,'speaker':speaker,
  'kind':'stadium' if key in ('start','pressure','win_player','win_ai','draw') else 'social',
  'duration_seconds':duration,'ready':True,
  'sha256':sha256(target.read_bytes()).hexdigest(),
  'review_status':'pending-human-listening'}
 print('R113_QWEN_CLIP',key,target.stat().st_size,duration,'elapsed',round(time.time()-start,1),flush=True)
(DEST/'announcer-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('R113_QWEN_BATCH_PASS',len(manifest['clips']),sum((DEST/x['file']).stat().st_size for x in manifest['clips'].values()),flush=True)
