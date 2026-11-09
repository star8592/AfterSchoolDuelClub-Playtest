"""CPU-only segmentation of existing full-body reference. No image synthesis, no fake detail."""
from PIL import Image,ImageFilter
from pathlib import Path
from rembg import remove, new_session
from io import BytesIO
import json,hashlib
base=Path(__file__).resolve().parent
src=base/'reference/M01_r32_single_character_reference.webp'
dest=base/'input/M01_isolated_rgba.png'
im=Image.open(src).convert('RGB')
assert im.size==(569,940)
session=new_session('u2net')
out=remove(im,session=session).convert('RGBA')
a=out.getchannel('A')
# record transparent coverage; visual review remains mandatory
canvas=Image.new('RGBA',(1024,1024))
out.thumbnail((910,910),Image.Resampling.LANCZOS)
canvas.alpha_composite(out,((1024-out.width)//2,(1024-out.height)//2))
canvas.save(dest,optimize=True)
d={'source_size':[569,940],'source_hash':hashlib.sha256(src.read_bytes()).hexdigest(),'source_type':'R32_embedded_single_pose_NOT_original_concept_sheet','matte_backend':'rembg_u2net_cpu','output_size':list(canvas.size),'alpha_extrema':list(canvas.getchannel('A').getextrema()),'alpha_zero_ratio':round(sum(1 for a in canvas.getchannel('A').getdata() if a==0)/(1024*1024),4),'no_generated_detail':True,'manual_mask_review_passed':False,'art_approved':False}
(base/'evidence/local-matte-intake.json').write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(d,ensure_ascii=False),flush=True)
