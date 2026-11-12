#!/usr/bin/env python3
"""Evidence ledger for individual illustrated R109 cards."""
import hashlib,json,math,argparse
from pathlib import Path
from PIL import Image,ImageStat
ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/'assets/cards/r109'
CLASSIC={'E01','E02','E03','E04','E05','E06','G01','G02','G03','G04','G05','G06','M01','M02','T01','T02','T03','T04','T05','T06'}
NEW={f'{c}{i:02d}' for c in 'KQSPX' for i in range(1,9)}
EXPECTED=CLASSIC|NEW
def ahash(img):
 a=img.convert('L').resize((9,8),Image.Resampling.LANCZOS)
 pixels=list(a.get_flattened_data() if hasattr(a,"get_flattened_data") else a.getdata())
 bits=0
 for y in range(8):
  for x in range(8):
   bits=(bits<<1)|(pixels[y*9+x]>pixels[y*9+x+1])
 return bits
rows={};hashes={}
for c in sorted(EXPECTED):
 p=ASSETS/(c+'.webp')
 if not p.is_file():continue
 raw=p.read_bytes();im=Image.open(p)
 if im.format!='WEBP' or im.size!=(620,780):
  raise SystemExit(f'BAD ART {c}: {im.format} {im.size}')
 stats=ImageStat.Stat(im.convert('RGB').resize((48,60)))
 if sum(stats.stddev)<58:raise SystemExit(f'FLAT/BROKEN ART {c}: {stats.stddev}')
 if len(raw)<10_000 or len(raw)>700_000:raise SystemExit(f'INVALID SIZE {c} {len(raw)}')
 hash_value=hashlib.sha256(raw).hexdigest()
 if hash_value in hashes.values():raise SystemExit(f'IDENTICAL ART {c}')
 hashes[c]=hash_value
 rows[c]={'file':'assets/cards/r109/'+p.name,'sha256':hash_value,'bytes':len(raw),
  'source':'R103 3D render / project illustration' if c in CLASSIC else 'Z-Image Turbo original local generation',
  'license_review':'R103 upstream character license needs release audit' if c in CLASSIC else 'Z-Image Turbo Apache-2.0; review individual image before publication',
  'image_size':[620,780],'difference_hash':hex(ahash(im))}
# Similarity is a warning, not a false assertion of identical content.
pairs=[]
for i,(a,h1) in enumerate(hashes.items()):
 im1=Image.open(ASSETS/(a+'.webp'));p1=ahash(im1)
 for b in list(hashes.keys())[i+1:]:
  p2=ahash(Image.open(ASSETS/(b+'.webp')))
  dist=(p1^p2).bit_count()
  if dist<5:pairs.append([a,b,dist])
status={'illustrated':len(rows),'expected':60,'classic':sum(k in CLASSIC for k in rows),
'new':sum(k in NEW for k in rows),'complete':len(rows)==60,'totalWebPBytes':sum(r['bytes'] for r in rows.values()),
'nearDuplicateHashWarnings':pairs,'cards':rows}
path=ROOT/'qa/evidence/r109/r109-art-release-ledger.json'
path.parent.mkdir(parents=True,exist_ok=True)
path.write_text(json.dumps(status,ensure_ascii=False,indent=2)+'\n')
print('R109_ART_AUDIT',json.dumps({k:v for k,v in status.items() if k!='cards'},ensure_ascii=False))
cli=argparse.ArgumentParser();cli.add_argument('--strict',action='store_true');args=cli.parse_args()
if args.strict and not status['complete']:raise SystemExit('60 image files not finished')
