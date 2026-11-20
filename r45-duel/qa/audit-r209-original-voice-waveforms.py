#!/usr/bin/env python3
"""R209 quantitative voice quality audit for ALL 92 R208 spells + 2 R209 gasps.
No re-encoding; source file duration, silence, peaks and saturation are measured
from actual offline-decoded Opus, not inferred from manifest metadata.
Subjective expression/pronunciation still needs human listening.
"""
from pathlib import Path
from subprocess import run,PIPE
import json
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
DIR=ROOT/'assets/audio/voices'
manifest=json.loads((ROOT/'assets/audio/voice-manifest.json').read_text())
gasps=json.loads((ROOT/'assets/audio/r209-impact-gasp-manifest.json').read_text())
rows=[]
items=[(h,k,v) for h in ('HOST_PLAYER','HOST_AI') for k,v in manifest['clips'][h].items() if k.startswith('r208_')]
items += [(h,'gasp',v) for h,v in gasps['clips'].items()]
assert len(items)==94
for h,kind,clip in items:
 path=DIR/clip['file']
 proc=run(['ffmpeg','-nostdin','-v','error','-i',str(path),'-ac','1',
  '-ar','16000','-f','f32le','-'],stdout=PIPE,stderr=PIPE,check=True)
 samples=np.frombuffer(proc.stdout,dtype='<f4')
 assert samples.size>3000,path
 duration=samples.size/16000
 peak=float(np.abs(samples).max())
 rms=float(np.sqrt(np.mean(samples.astype(np.float64)**2)))
 clipping=float((np.abs(samples)>.995).mean())
 frame=320
 padded=np.pad(samples,(0,(-len(samples))%frame))
 energy=np.sqrt(np.mean(padded.reshape(-1,frame).astype(np.float64)**2,axis=1))
 threshold=max(.002,peak*.035)
 active=np.flatnonzero(energy>threshold)
 leading=float(active[0]*frame/16000) if len(active) else duration
 trailing=float((len(energy)-1-active[-1])*frame/16000) if len(active) else duration
 warning=[]
 if clipping>.0001:warning.append('clipping')
 if peak<.018:warning.append('weak_signal')
 if leading>.55:warning.append('long_leading_silence')
 if trailing>.68:warning.append('long_trailing_silence')
 if abs(duration-clip['duration_seconds'])>.13:warning.append('manifest_duration_mismatch')
 if rms<.008:warning.append('low_rms')
 rows.append(dict(host=h,kind=kind,file=clip['file'],duration=round(duration,3),
  recordedSeconds=clip['duration_seconds'],peak=round(peak,4),rms=round(rms,4),
  clippedRatio=round(clipping,7),leadingSilence=round(leading,3),
  trailingSilence=round(trailing,3),warnings=warning))
report=dict(files=len(rows),recordingBytes=sum((DIR/x['file']).stat().st_size for x in rows),
 durationRange=[min(x['duration'] for x in rows),max(x['duration'] for x in rows)],
 peakRange=[min(x['peak'] for x in rows),max(x['peak'] for x in rows)],
 rmsRange=[min(x['rms'] for x in rows),max(x['rms'] for x in rows)],
 worstLeading=sorted(rows,key=lambda x:-x['leadingSilence'])[:5],
 worstTrailing=sorted(rows,key=lambda x:-x['trailingSilence'])[:5],
 warningCount=sum(bool(x['warnings']) for x in rows),
 warnings=[x for x in rows if x['warnings']],filesDetail=rows,
 humanListening='pending')
target=ROOT/'qa/evidence/r209-voice-director/r209-original-94-voice-waveform-audit.json'
target.parent.mkdir(parents=True,exist_ok=True)
target.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print('R209_94_ACTUAL_OPUS_WAVEFORMS',json.dumps({k:v for k,v in report.items()
 if k not in ('filesDetail','worstLeading','worstTrailing')},ensure_ascii=False))
if report['warningCount']>0:
 print('R209_AUDIO_OBJECTIVE_WARNINGS',json.dumps(report['warnings'][:18],ensure_ascii=False))
