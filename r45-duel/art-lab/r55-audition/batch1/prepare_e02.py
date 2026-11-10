#!/usr/bin/env python3
"""Stage one original-source-backed paper airplane for Pixal3D lab inference.
Never marks the generated GLB production-approved. Doesn't launch a GPU job.
"""
from __future__ import annotations
import hashlib
import json
import subprocess
from pathlib import Path
from PIL import Image

here=Path(__file__).resolve().parent
src=(here/'../../../art/references/E02-existing-3d-portrait.png').resolve()
out=here/'experiments/E02'
out.mkdir(parents=True,exist_ok=True)
if not src.is_file():
    raise SystemExit(f'REFERENCE_MISSING {src}')
im=Image.open(src).convert('RGBA')
if im.getchannel('A').getextrema() != (0,255):
    raise SystemExit('REFERENCE_HAS_NO_TRUE_TRANSPARENT_MATTE')
bbox=im.getchannel('A').getbbox()
crop=im.crop(bbox)
size=768
scale=.87*size/max(crop.size)
crop=crop.resize((max(1,round(crop.width*scale)),max(1,round(crop.height*scale))),Image.Resampling.LANCZOS)
dst=Image.new('RGBA',(size,size),(0,0,0,0))
dst.alpha_composite(crop,((size-crop.width)//2,(size-crop.height)//2))
input_path=out/'E02-pixal3d-input.png'
dst.save(input_path)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
info={
 'id':'E02',
 'source_reference':str(src),
 'source_reference_sha256':sha(src),
 'source_size':list(im.size),
 'source_alpha_bbox':list(bbox),
 'input_path':str(input_path),
 'input_sha256':sha(input_path),
 'input_size':[size,size],
 'input_is_cropped_upscale_only':True,
 'input_is_final_artist_approved':False,
 'ai_route':'Pixal3D / single view / explicit alpha input',
 'license':'Pixal3D model includes DINOv3 separate terms; commercial release blocked until approved',
 'output_expected':str(out/'E02-pixal3d-r0.glb'),
 'output_exists':(out/'E02-pixal3d-r0.glb').is_file(),
 'default_seed':42,
}
try:
    rows=subprocess.check_output(['nvidia-smi','--query-gpu=memory.total,memory.used,memory.free','--format=csv,noheader,nounits'],text=True,timeout=8).splitlines()
    total,used,free=map(int,rows[0].split(','))
    info['gpu_memory_mib']={'total':total,'used':used,'free':free}
    info['gpu_model_run_ready']=free>=11000
except Exception as e:
    info['gpu_model_run_ready']=False
    info['gpu_check_error']=str(e)
(out/'preflight.json').write_text(json.dumps(info,ensure_ascii=False,indent=2)+'\n')
print('E02_PIXAL_PREFLIGHT',json.dumps(info,ensure_ascii=False))
if not info['gpu_model_run_ready']:
    print('E02_GPU_JOB_NOT_LAUNCHED: need >=11000 MiB available, do not interrupt other projects or browser processes.')
