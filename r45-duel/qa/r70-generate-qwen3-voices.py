#!/usr/bin/env python3
"""Create reproducible original game dialogues from official Qwen3-TTS.
Requires isolated qwen-tts env + locally cached Qwen 1.7B CustomVoice.
Never invokes legacy IndexTTS or voice imitation of a real public figure.
"""
import os,json,sys,subprocess,hashlib,datetime,shutil
from pathlib import Path
import torch
import numpy as np
import soundfile as sf
from qwen_tts import Qwen3TTSModel
BASE=Path(__file__).resolve().parents[1]
lines=json.loads((BASE/'qa/r70-qwen3-voice-lines.json').read_text())
root=Path.home()/'.cache/huggingface/hub/models--Qwen--Qwen3-TTS-12Hz-1.7B-CustomVoice/snapshots'
models=[p for p in root.iterdir() if p.is_dir()]
assert len(models)>=1,'Required approved Qwen model snapshot not found'
MODEL=str(models[0]);OUT=BASE/'assets/audio/voices';OUT.mkdir(parents=True,exist_ok=True)
manifest_path=BASE/'assets/audio/voice-manifest.json'
manifest=json.loads(manifest_path.read_text())
assert manifest['provider']=='Qwen3-TTS'
manifest.update(model=lines['model'],status='partial-verified-Qwen3-TTS',language='Chinese')
# Each run can intentionally produce only a small group, then resume without regenerating.
want=sys.argv[1:] or list(lines['characters'])
print('QWEN3_LOAD',MODEL,'voices',want,flush=True)
model=Qwen3TTSModel.from_pretrained(MODEL,device_map='cuda:0',dtype=torch.bfloat16,attn_implementation='sdpa')
for character in want:
    role=lines['characters'].get(character)
    if role is None:raise ValueError('unknown character '+character)
    for kind,text in role['lines'].items():
        slug=character+'-'+kind
        path=OUT/(slug+'.ogg')
        if path.exists() and path.stat().st_size>6000:
            print('REUSE',path,flush=True)
        else:
            with torch.inference_mode():
                w,sr=model.generate_custom_voice(text=text,language='Chinese',speaker=role['speaker'],instruct=role['instruct'])
            data=np.asarray(w[0],dtype='float32')
            assert .72<len(data)/sr<14,f'Unexpected Qwen generated duration {character}:{kind} {len(data)/sr:.2f}s'
            assert np.isfinite(data).all() and np.max(np.abs(data))>.01,'Audio silent/nonfinite'
            wav=OUT/(slug+'.wav');sf.write(wav,data,sr)
            subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(wav),'-ac','1','-ar','24000','-c:a','libopus','-b:a','36k',str(path)],check=True)
            wav.unlink(missing_ok=True)
        assert path.stat().st_size>6000
        duration=float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(path)],check=True,capture_output=True,text=True).stdout.strip())
        manifest.setdefault('clips',{}).setdefault(character,{})[kind]={
         'file':path.name,'model':'Qwen3-TTS-12Hz-1.7B-CustomVoice','speaker':role['speaker'],
         'text':text,'duration_seconds':round(duration,2),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
         'ready':True,'review_status':'pending-human-listening'
        }
        manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
        print('QWEN3_VOICE_DONE',character,kind,round(duration,2),path.stat().st_size,flush=True)
print('QWEN3_BATCH_COMPLETE',list(manifest['clips']),flush=True)
