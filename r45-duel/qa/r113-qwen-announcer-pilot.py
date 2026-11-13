"""Smoke the local, official Qwen3-TTS 1.7B model. Does not change game assets."""
import os,time
import torch
import soundfile as sf
from qwen_tts import Qwen3TTSModel
from pathlib import Path
checkpoints=list((Path.home()/'.cache/huggingface/hub/models--Qwen--Qwen3-TTS-12Hz-1.7B-CustomVoice/snapshots').glob('*'))
assert checkpoints, 'Cache missing official Qwen checkpoint'
checkpoint=str(checkpoints[0])
print('R113_LOCAL_SNAPSHOT',checkpoint,flush=True)
torch.set_num_threads(4)
t=time.time()
model=Qwen3TTSModel.from_pretrained(checkpoint,
 device_map='cuda:0',dtype=torch.bfloat16,
 attn_implementation='sdpa',local_files_only=True)
print('R113_TTS_LOADED',round(time.time()-t,2),model.get_supported_speakers(),flush=True)
speaker=next((s for s in model.get_supported_speakers() if str(s).lower()=='ryan'),
 model.get_supported_speakers()[0])
wav,sr=model.generate_custom_voice(text='同学们注意！放学后决斗社，现在开战！',
 language='Chinese',speaker=speaker,
 instruct='充满体育馆主持人的活力，像学校运动会广播，音节清晰幽默。',
 max_new_tokens=300)
sf.write('/tmp/asdc-r113-announcer-pilot.wav',wav[0],sr)
print('R113_TTS_PILOT',{'speaker':speaker,'sample_rate':sr,
 'duration':round(len(wav[0])/sr,2),'elapsed':round(time.time()-t,2)},flush=True)
