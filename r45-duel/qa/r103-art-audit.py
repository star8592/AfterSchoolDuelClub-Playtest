#!/usr/bin/env python3
from pathlib import Path
from PIL import Image,ImageStat
import hashlib,json
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/cards/r103'
m=json.loads((OUT/'manifest.json').read_text())
expected={'E01','E02','E03','E04','E05','E06','G01','G02','G03','G04','G05','G06','M01','M02','T01','T02','T03','T04','T05','T06'}
assert set(m['art'])==expected,'20 cards differ from actual engine'
checks=0;total=0
for id,art in m['art'].items():
 file=OUT/(id+'.webp')
 raw=file.read_bytes();total+=len(raw)
 assert hashlib.sha256(raw).hexdigest()==art['sha256'],id;checks+=1
 assert len(raw)==art['bytes'] and 10_000<len(raw)<150_000,id;checks+=1
 img=Image.open(file)
 assert img.size==(620,780) and img.format=='WEBP',id;checks+=1
 stat=ImageStat.Stat(img.resize((40,50)))
 assert sum(stat.stddev)>85,id;checks+=1
 assert art['source_kind'] in {'original project vector illustration','actual 3D model render from project GLB/VRM'},id;checks+=1
 if id in {'E02','E05','E06','G05','G06','T05','T06'}:
  assert art['source_kind'].startswith('original project'),id;checks+=1
 else:
  assert art['source_kind'].startswith('actual 3D'),id;checks+=1
assert total<1_000_000;checks+=1
assert len(list(OUT.glob('*.webp')))==20;checks+=1
report={'ok':True,'checks':checks,'source_3d_portraits':13,
 'original_event_and_plane_art':7,'unique_cards':20,'all_image_bytes':total,
 'source_note':'Upstream 3D commercial rights still pending full R101 audit'}
e=ROOT/'qa/evidence/r103';e.mkdir(parents=True,exist_ok=True)
(e/'r103-art-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print('R103_ART_AUDIT',json.dumps(report,ensure_ascii=False))
