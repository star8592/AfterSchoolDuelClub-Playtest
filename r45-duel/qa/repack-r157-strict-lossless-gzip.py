#!/usr/bin/env python3
"""R157: Repack the 12 published canonical GLB.gz files without touching
a single decompressed GLB byte. Keep all artwork, normals, UV, bones, animations.
Only gzip entropy coding changes (level 1 -> 9); original binary GLBs untouched.

Run: python3 r45-duel/qa/repack-r157-strict-lossless-gzip.py \
 --source-assets /path/to/existing/r45-duel/assets \
 --output-assets /path/to/R157/r45-duel/assets \
 --manifest /path/to/R157/r45-duel/r125-asset-fingerprints.js \
 --report /path/to/reproducible/report.json
"""
from __future__ import annotations
import argparse
import gzip
import hashlib
import json
import os
import re
import sys
from pathlib import Path

NAMES=(
'E02-R60-PhotoPaper-WingFlex-STUDY.glb',
'E03-Ellie-Landing-R97.glb',
'E04-Phil-Landing-R97.glb',
'G02-Snow-Landing-R97.glb',
'G03-Jay-Landing-R97.glb',
'G04-Victoria-Landing-R97.glb',
'M01-MusicTeacher-PolyforkSchoolTeacher.glb',
'M02-CafeteriaAunt-ChefHat-Ladle-R114.glb',
'T01-Owl-Innerscene-R84.glb',
'T02-LivingMenu-R59.glb',
'T03-Rain-Landing-R97.glb',
'T04-Rex-Landing-R97.glb',
)
def digest(b):
 return hashlib.sha256(b).hexdigest()
def main():
 parser=argparse.ArgumentParser()
 base=Path(__file__).resolve().parent.parent
 parser.add_argument('--source-assets',type=Path,default=base/'assets')
 parser.add_argument('--output-assets',type=Path,default=base/'assets')
 parser.add_argument('--manifest',type=Path,default=base/'r125-asset-fingerprints.js')
 parser.add_argument('--report',type=Path,default=base/'qa/evidence/r157-strict-lossless/repack.json')
 a=parser.parse_args()
 source=a.source_assets/'summons'
 dest=a.output_assets/'summons'
 manifest=a.manifest.read_text()
 record=[]
 patch_manifest=manifest
 for name in NAMES:
  p=source/name
  prior=source/(name+'.gz')
  wire=prior.read_bytes()
  glb=p.read_bytes()
  key='summons/'+name+'.gz'
  token=r'("'+re.escape(key)+r'":\s*")([0-9a-f]{64})(")'
  match=re.search(token,patch_manifest)
  if not match:raise ValueError('missing official R125 version key '+key)
  assert match.group(2)==digest(wire),('source/manifest content mismatch',key)
  assert gzip.decompress(wire)==glb,('prior source gzip mismatch',name)
  candidate=gzip.compress(glb,compresslevel=9,mtime=0)
  assert len(candidate)<len(wire),('recompression did not save bytes',name)
  assert gzip.decompress(candidate)==glb,('changed decompressed bytes',name)
  # Equal source GLB hash means every material, texture, vertex, animation
  # and VRM/GLTF extension byte remains identical.
  dest.mkdir(parents=True,exist_ok=True)
  out=dest/(name+'.gz')
  tmp=out.with_name(out.name+'.building')
  tmp.write_bytes(candidate)
  assert gzip.decompress(tmp.read_bytes())==glb
  os.replace(tmp,out)
  assert gzip.decompress(out.read_bytes())==glb
  candidate_sha=digest(candidate)
  patch_manifest=re.sub(token,lambda m:m.group(1)+candidate_sha+m.group(3),patch_manifest,count=1)
  row={'path':key,'source_glb':name,'source_glb_sha256':digest(glb),
       'source_gz_sha256':digest(wire),'output_gz_sha256':candidate_sha,
       'original_gz_bytes':len(wire),'optimized_gz_bytes':len(candidate),
       'saved_bytes':len(wire)-len(candidate),'decoded_GLBytes_identical':True}
  record.append(row)
  print('R157_STRICT_LOSSLESS_PASS',name,row['saved_bytes'],flush=True)
 a.manifest.write_text(patch_manifest)
 report={'kind':'r157 exact-gltf-byte gzip optimization','assets':record,
         'assets_count':len(record),'original_wire_bytes':sum(x['original_gz_bytes'] for x in record),
         'new_wire_bytes':sum(x['optimized_gz_bytes'] for x in record),
         'saved_bytes':sum(x['saved_bytes'] for x in record),
         'gltf_binary_byte_identical':True,
         'jpg_webp_png_or_shaders_modified':False}
 a.report.parent.mkdir(parents=True,exist_ok=True)
 a.report.write_text(json.dumps(report,ensure_ascii=False,indent=2))
 print('R157_STRICT_LOSSLESS_COMPLETE',json.dumps({k:v for k,v in report.items() if k!='assets'}),flush=True)
if __name__=='__main__':main()
