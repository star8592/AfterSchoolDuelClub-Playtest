#!/usr/bin/env python3
"""Collect only official public source metadata; never bypass auth or mislabel as downloaded."""
import json,hashlib,requests
from pathlib import Path
here=Path(__file__).resolve().parent
models=[
 ('female-high-fidelity-cast','dcaa822909ae4e04ad7eb85bc371a8c4','校园女性与双人协作女搭档基底；不冒充男孩加油队长'),
 ('schoolboy-high-fidelity','92b4b22d14194be191c0df00f6e62b3d','少年人物基底供 E03/G02 分别评估；未加队长服装、黑板或眼镜'),
 ('adult-high-fidelity-man','a69c8962f4a14ea89bf623d716a81411','教师与成年角色的统一美术基底候选'),
 ('teacher-contrast','2e824e4c1d224fb8824937f134f1592f','教师职业类型参考；艺术风格不同，不纳入统一美术基线')]
s=requests.Session();s.headers['User-Agent']='AfterSchoolDuel-R78-source-metadata-audit/1.0'
rows=[]
for key,uid,intent in models:
 r=s.get('https://api.sketchfab.com/v3/models/'+uid,timeout=20);r.raise_for_status();j=r.json()
 lic=j.get('license') or {};images=j.get('thumbnails',{}).get('images',[])
 thumbnails=sorted(images,key=lambda a:a.get('width',0)*a.get('height',0),reverse=True)
 assert j.get('isDownloadable') and lic.get('slug')=='by' and (j.get('faceCount') or 0)>25000,uid
 row={'id':key,'uid':uid,'title':j.get('name'),'creator':(j.get('user') or {}).get('displayName'),
 'creator_username':(j.get('user') or {}).get('username'),'triangles':j.get('faceCount'),
 'vertices':j.get('vertexCount'),'isDownloadable':j.get('isDownloadable'),
 'license':lic.get('fullName'),'licenseSlug':lic.get('slug'),'licenseRequirements':lic.get('requirements'),
 'licenseUrl':lic.get('url'),'sourceUrl':j.get('viewerUrl'),
 'embedUrl':'https://sketchfab.com/models/'+uid+'/embed',
 'thumbnail':thumbnails[0].get('url') if thumbnails else None,
 'thumb_variants':len(thumbnails), 'roleIntent':intent,
 'authorSaysRigged':True,'authorSays100PlusFaceBlendshapes':key!='teacher-contrast',
 'sourceBinaryDownloaded':False,'localMeshValidated':False,'localAnimationValidated':False,
 'artApproved':False,'readyForGame':False,'renderSource':'licensed upstream official viewer, not local GLB',
 'artReview':'primary_same_artist' if key!='teacher-contrast' else 'reject_mismatched_style'}
 # Cache the artist's official thumbnail locally; never mistake it for a 3D model.
 previews=here/'previews';previews.mkdir(parents=True,exist_ok=True)
 preview=previews/(key+'.jpg')
 if not preview.exists():
  image=s.get(row['thumbnail'],timeout=25);image.raise_for_status()
  assert image.headers.get('content-type','').startswith('image/')
  preview.write_bytes(image.content)
 raw=preview.read_bytes()
 row['thumbnailLocal']='../art-lab/r78-high-fidelity/previews/'+preview.name
 row['thumbnailSha256']=hashlib.sha256(raw).hexdigest()
 row['thumbnailBytes']=len(raw)
 rows.append(row);print('R78_SOURCE_OFFICIAL_VERIFIED',json.dumps({k:row[k] for k in ['id','title','creator','triangles','license','isDownloadable','sourceBinaryDownloaded']},ensure_ascii=False),flush=True)
# Sketchfab documents require account OAuth for actual source archives.
probe=s.get('https://api.sketchfab.com/v3/models/'+models[0][1]+'/download',timeout=14)
print('R78_SOURCE_ARCHIVE_AUTH_CHECK',probe.status_code,probe.text[:160])
out={'schema':'r78-high-fidelity-casting-v1','base_version':'R77','frozen_game_version':'R76 20 cards',
 'modelCount':len(rows),'primaryCount':3,'binaryDownloadAuthStatus':probe.status_code,
 'accessNote':'Official Sketchfab Download API requires authenticated user; do not bypass it, falsely claim local GLB, or use model viewer cache as a source archive.',
 'authorLicenseAudit':'Official metadata verified 2026-11-11; CC BY 4.0 attribution required; not a final third-party content provenance audit.',
 'candidates':rows}
(here/'sketchfab-source-audit.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
assert probe.status_code in (401,403)
