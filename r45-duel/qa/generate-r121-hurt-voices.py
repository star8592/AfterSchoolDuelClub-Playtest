#!/usr/bin/env python3
"""R121 original character-specific short hit reactions from cached Qwen3-TTS."""
from pathlib import Path
from hashlib import sha256
import json,subprocess,time
import numpy as np
import soundfile as sf
import torch
from qwen_tts import Qwen3TTSModel
ROOT=Path(__file__).resolve().parents[1]
path=ROOT/'assets/audio/voice-manifest.json'
manifest=json.loads(path.read_text())
DEST=ROOT/'assets/audio/voices'
lines={
 'E01':'哎哟！铃声没追上，魔法倒追上了！',
 'E02':'哎呀！我的纸飞机怎么也中招了！',
 'E03':'哎呀！加油声不能当盾牌呀！',
 'E04':'哎哟！这盒饭差点被打翻了！',
 'G01':'哇！我刚搭好的结构全散啦！',
 'G02':'哎呀！这题不能这么乱解呀！',
 'G03':'实验失控！赶快往后撤！',
 'G04':'我宣布！现在暂停三秒！',
 'M01':'哎哟！你把我的节拍打乱啦！',
 'M02':'哎呀！我的大勺子差点飞啦！',
 'T01':'各位听众！我刚才被击中了！',
 'T02':'本菜单暂时不能正常翻页！',
 'T03':'哎呀！包裹飞了，快接住！',
 'T04':'报告！活动室需要紧急加固！'}
styles={
 'E01':'活泼急性子的学生受击惊叫，反应短促又滑稽，清楚自然。',
 'E02':'爱折纸的学生受击惊叫，轻快又惊奇，短促，不拖沓。',
 'E03':'热情啦啦队长突然吃亏，夸张但不刺耳。',
 'E04':'学生食堂跑腿员突然被击中，着急又搞笑。',
 'G01':'聪明男学生突遭反击，呆萌惊讶，不要严肃。',
 'G02':'爱解题的学霸受击，紧张又不服输。',
 'G03':'实验学长遇到突发状况，理工生式幽默。',
 'G04':'少年社团管理者一本正经被魔法打断，反差喜剧。',
 'M01':'温和音乐老师突然乱了拍子，带一点慌乱。',
 'M02':'幽默食堂厨师保护自己的大勺子，诙谐有力。',
 'T01':'校园广播员边播报边哎哟，播音员夸张但清晰。',
 'T02':'拟人魔法菜单惊慌尖叫，俏皮但不要尖锐刺耳。',
 'T03':'快递员抱怨包裹飞走，着急幽默。',
 'T04':'一本正经的守门人受击，搞笑的官方公告语气。'}
assert set(lines)==set(styles)
for key in lines:
 assert key in manifest['clips'] and manifest['clips'][key].get('enter'),key
cache=Path.home()/'.cache/huggingface/hub/models--Qwen--Qwen3-TTS-12Hz-1.7B-CustomVoice/snapshots'
models=list(cache.glob('*'))
assert models,'Cached original Qwen3-TTS model not found'
torch.set_num_threads(4)
print('R121_VOICE_MODEL_LOADING',flush=True)
model=Qwen3TTSModel.from_pretrained(str(models[0]),device_map='cuda:0',dtype=torch.bfloat16,
 attn_implementation='sdpa',local_files_only=True)
supported=set(model.get_supported_speakers())
print('R121_VOICE_MODEL_READY',sorted(supported),flush=True)
start=time.monotonic()
for key,text in lines.items():
 meta=manifest['clips'][key]['enter']
 speaker=meta['speaker'].lower().replace(' ','_')
 assert speaker in supported,(key,speaker)
 target=DEST/(key+'-hurt.ogg')
 if not target.is_file() or target.stat().st_size<3500:
  wav=DEST/('.r121-'+key+'-hurt.wav')
  audio,sr=model.generate_custom_voice(text=text,language='Chinese',speaker=speaker,
    instruct=styles[key],max_new_tokens=420)
  data=np.asarray(audio[0],dtype='float32')
  assert .55<len(data)/sr<14 and np.isfinite(data).all() and np.max(np.abs(data))>.004,(key,sr,data.shape)
  sf.write(wav,data,sr)
  subprocess.run(['ffmpeg','-nostdin','-y','-hide_banner','-loglevel','error',
    '-i',str(wav),'-af','highpass=f=110,lowpass=f=7400,acompressor=threshold=-20dB:ratio=1.7:attack=9:release=100,loudnorm=I=-16:TP=-1.5:LRA=9',
    '-c:a','libopus','-b:a','40k','-ar','48000',str(target)],check=True)
  wav.unlink(missing_ok=True)
 dur=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration',
  '-of','default=noprint_wrappers=1:nokey=1',str(target)],text=True))
 assert .55<dur<14 and target.stat().st_size>3500,(key,dur)
 manifest['clips'][key]['hurt']={
  'file':target.name,'model':'Qwen3-TTS-12Hz-1.7B-CustomVoice',
  'speaker':speaker,'text':text,'duration_seconds':round(dur,2),
  'sha256':sha256(target.read_bytes()).hexdigest(),'ready':True,
  'review_status':'pending-human-listening',
  'license':'project-original-fictional-performance'}
 path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
 print('R121_ROLE_HURT_DONE',key,round(dur,2),target.stat().st_size,
       'elapsed',round(time.monotonic()-start),flush=True)
lines_v2={
 'E01':'这一下简直比迟到还吓人！',
 'E02':'纸飞机！快来帮我挡一下！',
 'E03':'我的加油口号都被打断啦！',
 'E04':'别碰我的饭盒！那是热的！',
 'G01':'不好！橡皮筋要断啦！',
 'G02':'不对不对！这一步算错了！',
 'G03':'等等，实验报告里没有这一项！',
 'G04':'这可不在我的日程安排里！',
 'M01':'喂！你这可是突然变调！',
 'M02':'谁把我的锅盖当飞盘啦！',
 'T01':'紧急插播！本台主持人遭到袭击！',
 'T02':'今天的推荐菜！是撤退！',
 'T03':'这单快递差点被魔法签收啦！',
 'T04':'警告！禁止在门口乱丢魔法！'}
for key,words in lines_v2.items():
 speaker=manifest['clips'][key]['enter']['speaker'].lower().replace(' ','_')
 dest=DEST/(key+'-hurt_v2.ogg')
 if not dest.is_file() or dest.stat().st_size<3500:
  wav=DEST/('.r121-'+key+'-hurt_v2.wav')
  audio,sr=model.generate_custom_voice(text=words,language='Chinese',speaker=speaker,
    instruct=styles[key],max_new_tokens=420)
  data=np.asarray(audio[0],dtype='float32')
  assert .55<len(data)/sr<14 and np.isfinite(data).all() and np.max(np.abs(data))>.004,(key,sr,data.shape)
  sf.write(wav,data,sr)
  subprocess.run(['ffmpeg','-nostdin','-y','-hide_banner','-loglevel','error',
    '-i',str(wav),'-af','highpass=f=110,lowpass=f=7400,acompressor=threshold=-20dB:ratio=1.7:attack=9:release=100,loudnorm=I=-16:TP=-1.5:LRA=9',
    '-c:a','libopus','-b:a','40k','-ar','48000',str(dest)],check=True)
  wav.unlink(missing_ok=True)
 dur=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration',
  '-of','default=noprint_wrappers=1:nokey=1',str(dest)],text=True))
 assert .55<dur<14 and dest.stat().st_size>3500,(key,dur)
 manifest['clips'][key]['hurt_v2']={
  'file':dest.name,'model':'Qwen3-TTS-12Hz-1.7B-CustomVoice',
  'speaker':speaker,'text':words,'duration_seconds':round(dur,2),
  'sha256':sha256(dest.read_bytes()).hexdigest(),'ready':True,
  'review_status':'pending-human-listening',
  'license':'project-original-fictional-performance'}
 path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
 print('R121_ROLE_HURT_V2_DONE',key,round(dur,2),dest.stat().st_size,flush=True)
print('R121_28_REAL_QWEN_ROLE_HURTS_PASS',len(lines)+len(lines_v2),flush=True)
