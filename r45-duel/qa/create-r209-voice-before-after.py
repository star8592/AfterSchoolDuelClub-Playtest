#!/usr/bin/env python3
"""Create two labeled reconstruction mixes from ORIGINAL on-disk recordings.
This is an explanatory A/B mix using real verified Chrome collision timing,
NOT a capture of the Chrome audio stream.
"""
from pathlib import Path
from subprocess import run,check_output
from json import dumps
root=Path(__file__).resolve().parents[1]
a=root/'assets/audio'
d=root/'qa/evidence/r209-voice-director'
d.mkdir(parents=True,exist_ok=True)
files=[
 a/'voices/HOST_PLAYER-r208_S08.ogg',
 a/'voices/HOST_AI-r203_S08.ogg',
 a/'voices/HOST_AI-r209-impact-gasp.ogg',
 a/'r102_rubber_squeak.ogg'
]
for p in files:assert p.is_file(),p
inputs=[arg for p in files for arg in ['-i',str(p)]]
base="aformat=sample_rates=48000:channel_layouts=stereo,"
castbase=base+'volume=0.76'
castduck=base+"volume='if(between(t,1.051,1.61),0.55,0.76)':eval=frame"
voices=[
 ('r209-baseline-interrupted-S08-original-voices.m4a',[
  f'[0:a]{castbase},atrim=0:1.051,asetpts=PTS-STARTPTS[cast]',
  f'[1:a]{base}adelay=1051:all=1,volume=0.72[hurt]',
  f'[3:a]{base}adelay=1051:all=1,volume=0.24[impact]',
  '[cast][hurt][impact]amix=inputs=3:duration=longest:dropout_transition=0,alimiter=limit=0.93[out]'
 ]),
 ('r209-fixed-S08-complete-cast-impact-gasp-retort.m4a',[
  f'[0:a]{castduck}[cast]',
  f'[1:a]{base}adelay=2810:all=1,volume=0.72[hurt]',
  f'[2:a]{base}adelay=1051:all=1,volume=0.39[gasp]',
  f'[3:a]{base}adelay=1051:all=1,volume=0.24[impact]',
  '[cast][hurt][gasp][impact]amix=inputs=4:duration=longest:dropout_transition=0,alimiter=limit=0.93[out]'
 ])
]
for name,filters in voices:
 path=d/name
 run(['ffmpeg','-nostdin','-y','-hide_banner','-loglevel','error',*inputs,
  '-filter_complex',';'.join(filters),'-map','[out]','-c:a','aac',
  '-b:a','112k','-movflags','+faststart',str(path)],check=True)
 metadata=check_output(['ffprobe','-v','error','-show_entries','format=duration,size',
  '-of','default=noprint_wrappers=1',str(path)],text=True).strip()
 print('R209_REAL_ORIGINAL_VOICES_RECONSTRUCTION',name,metadata,flush=True)
print('R209_AB_COMPARE_READY_browser_capture_is_NOT_claimed',flush=True)
