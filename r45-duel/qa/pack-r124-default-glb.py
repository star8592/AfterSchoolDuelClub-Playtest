"""R124 deterministic GZIP wire-only copies of original CC0/approved GLBs.
No geometry, original media, pose, bone, texture or material modification.
"""
from pathlib import Path
from hashlib import sha256
import gzip, io, json

FILES = (
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
root = Path(__file__).resolve().parents[1] / 'assets/summons'
manifest = {'version':'R124','type':'lossless-gzip-wire-only','sourceFormat':'glTF-binary',
            'compression':'gzip','files':{},'sourceBytes':0,'packedBytes':0}
for file in FILES:
 src=(root/file).read_bytes()
 assert src[:4]==b'glTF' and len(src)>100
 packed_buffer=io.BytesIO()
 with gzip.GzipFile(fileobj=packed_buffer,mode='wb',filename='',mtime=0,compresslevel=1) as z:
  z.write(src)
 packed=packed_buffer.getvalue()
 assert gzip.decompress(packed)==src
 (root/(file+'.gz')).write_bytes(packed)
 manifest['files'][file]={'sha256':sha256(src).hexdigest(),
   'packedSha256':sha256(packed).hexdigest(),'sourceBytes':len(src),'packedBytes':len(packed)}
 manifest['sourceBytes']+=len(src)
 manifest['packedBytes']+=len(packed)
(root/'r124-packed-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('R124_LOSSLESS_PACK_PASS',json.dumps({'files':len(FILES),
 'originalMiB':round(manifest['sourceBytes']/1048576,2),
 'packedMiB':round(manifest['packedBytes']/1048576,2),
 'percentSaved':round(100*(1-manifest['packedBytes']/manifest['sourceBytes']),1)}))
