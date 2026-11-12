#!/usr/bin/env python3
"""Deterministic-ish R99 music-versus-voice balancing.

Process the existing, project-generated Qwen3 Opus voices, no replacement TTS.
One-pass EBU R128 loudnorm to -16 integrated LUFS, -1.5 dBTP. Preserve each
speaker and sentence; SHA256 manifest updated together for asset integrity.
"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from tempfile import TemporaryDirectory
import hashlib,json,subprocess,os,sys
ROOT=Path(__file__).resolve().parent.parent/'assets/audio'
MANIFEST=ROOT/'voice-manifest.json'
data=json.loads(MANIFEST.read_text())
if data.get('loudness_profile_r99')=='EBU_R128_-16LUFS_-1.5dBTP':
 print('R99_NORMALIZE_ALREADY_APPLIED',len([x for v in data['clips'].values() for x in v.values()]))
 sys.exit(0)
items={x['file']:x for v in data['clips'].values() for x in v.values()}
assert len(items)==98,'Expected 98 unique real Qwen voices'
def work(item,tmp):
 filename,meta=item
 src=ROOT/'voices'/filename
 assert src.exists() and hashlib.sha256(src.read_bytes()).hexdigest()==meta['sha256'],filename+' sha mismatch before processing'
 out=Path(tmp)/filename
 cmd=['ffmpeg','-hide_banner','-nostdin','-loglevel','error','-y','-i',str(src),
  '-af','loudnorm=I=-16:TP=-1.5:LRA=8:linear=true',
  '-vn','-c:a','libopus','-b:a','56k','-ar','48000','-vbr','on',str(out)]
 subprocess.run(cmd,check=True,capture_output=True,timeout=45)
 assert out.stat().st_size>1000,filename+' too small'
 return filename,out,hashlib.sha256(out.read_bytes()).hexdigest()
with TemporaryDirectory(prefix='.r99-qwen-lufs-',dir=ROOT/'voices') as tmp:
 results={}
 with ThreadPoolExecutor(max_workers=4) as executor:
  tasks=[executor.submit(work,item,tmp) for item in items.items()]
  for task in as_completed(tasks):
   name,out,sha=task.result();results[name]=(out,sha)
   if len(results)%20==0: print('R99_LUFS_PROGRESS',len(results),flush=True)
 assert len(results)==98
 for name,meta in items.items():
  out,sha=results[name]
  os.replace(out,ROOT/'voices'/name)
  meta['sha256']=sha
  meta['loudness_processing']='EBU R128 target -16 LUFS / -1.5 dBTP; Qwen3 source voice preserved'
data['loudness_profile_r99']='EBU_R128_-16LUFS_-1.5dBTP'
MANIFEST.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
print('R99_NORMALIZE_COMPLETE',len(results),'all new checksums written')
