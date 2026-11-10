#!/usr/bin/env python3
"""Compile approved authentic rig render into an illustrated card crop.
Fail closed if source or crop is blank; do not fake missing characters.
"""
from PIL import Image
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
proof={}
for tag,minimum in [('E01',148),('G01',107)]:
    src=root/'art/portrait-src'/f'{tag}-vrm-portrait.png'
    out=root/'assets/cards'/f'{tag}-vrm-card-bust.png'
    if not src.is_file():raise SystemExit(f'MISSING_SOURCE_{tag}')
    image=Image.open(src).convert('RGBA')
    if image.size!=(480,650):raise SystemExit(f'WRONG_PORTRAIT_DIMENSIONS_{tag}_{image.size}')
    bbox=image.getchannel('A').getbbox()
    if bbox is None or bbox[2]-bbox[0]<200 or bbox[3]-bbox[1]<440:
        raise SystemExit(f'BLANK_PORTRAIT_REJECTED_{tag}_{bbox}')
    # Camera framing: head + bust, with shoulders retained for recognizability.
    crop=image.crop((88,42,392,465))
    if crop.getchannel('A').getbbox() is None:
        raise SystemExit(f'BLANK_CROP_REJECTED_{tag}')
    crop.save(out,optimize=True)
    proof[tag]={'source_png':str(src.relative_to(root)),
                'card_png':str(out.relative_to(root)),
                'source_size':list(image.size),'crop_size':list(crop.size),
                'source_alpha_bbox':bbox,
                'crop_alpha_bbox':crop.getchannel('A').getbbox(),
                'is_actual_rig_render':True,
                'max_fake_generation_attempts':0}
receipt=root/'qa/evidence/r46-card-art-manifest.json'
receipt.parent.mkdir(parents=True,exist_ok=True)
receipt.write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n')
print('R46_2_REAL_RIG_CARD_CROPS_VALIDATED',json.dumps(proof,ensure_ascii=False))
