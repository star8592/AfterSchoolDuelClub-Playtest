#!/usr/bin/env python3
"""R115: pixel-exact PNG -> lossless WebP GLB/VRM texture packing.

Requires Pillow with WebP; never modifies vertex geometry, skinning, animation or
materials. Only handles GLB v2 with one local binary buffer; fails closed for
unknown extensions/overlapping views. Without --apply runs analysis only.
"""
import argparse
from hashlib import sha256
from io import BytesIO
import json
from pathlib import Path
import re
import struct
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SUMMONS = ROOT / 'r45-duel/assets/summons'
MODELS = ROOT / 'r45-duel/assets/model'
SPEC_TEXT = (ROOT / 'r45-duel/scene/summon-models.mjs').read_text()
SUMMON_FILES = re.findall(r"^\s*[EGTM]\d{2}:\{file:'([^']+)'", SPEC_TEXT, re.M)
SOURCES = [SUMMONS / f for f in SUMMON_FILES] + [
    MODELS / f for f in ('Shino-original-CC0.vrm', 'Fumiriya-original-CC0.vrm',
                        'Host-HairSample_Female-CC0.vrm', 'Host-HairSample_Male-CC0.vrm')
]
assert len(SUMMON_FILES) == 12 and len(SOURCES) == 16


def read_glb(path):
    raw = path.read_bytes()
    if len(raw) < 20 or raw[:4] != b'glTF' or struct.unpack_from('<I',raw,4)[0] != 2 or struct.unpack_from('<I',raw,8)[0]!=len(raw):
        raise ValueError(f'Invalid glTF2 header: {path}')
    chunks=[];pos=12
    while pos < len(raw):
        length, kind = struct.unpack_from('<I4s',raw,pos);pos+=8
        chunks.append((kind,raw[pos:pos+length]));pos+=length
    if pos!=len(raw) or [k for k,_ in chunks]!=[b'JSON',b'BIN\x00']:
        raise ValueError(f'Unsupported GLB chunks: {path}')
    obj=json.loads(chunks[0][1]);binary=chunks[1][1]
    if len(obj.get('buffers',[]))!=1 or 'uri' in obj['buffers'][0]:
        raise ValueError(f'Unsupported external GLB buffer: {path}')
    return raw,obj,binary


def transform(path,apply):
    original,obj,binary=read_glb(path)
    views=obj.get('bufferViews',[])
    images=obj.get('images',[])
    textures=obj.get('textures',[])
    # Exclude shared/overlapping binary views and unknown compressed layouts.
    spans=sorted((v.get('byteOffset',0),v.get('byteOffset',0)+v['byteLength'],i)
                 for i,v in enumerate(views))
    for (start,end,i),(next_start,_,j) in zip(spans,spans[1:]):
        if end>next_start:
            raise ValueError(f'Overlapping bufferViews: {path} {i}/{j}')
    replacements={};changed_images=set();old_image=0;new_image=0;verified=0
    for i,im in enumerate(images):
        if im.get('mimeType')!='image/png' or 'bufferView' not in im:continue
        view_index=im['bufferView'];v=views[view_index]
        if v.get('buffer',0)!=0:raise ValueError('Unexpected buffer index')
        # Reject a view shared by two images or accessors: conversion must not
        # invalidate independent binary or texture references.
        if sum(x.get('bufferView')==view_index for x in images)!=1:
            raise ValueError('Shared image buffer view')
        if any(a.get('bufferView')==view_index for a in obj.get('accessors',[])):
            raise ValueError('Image view referenced by accessor')
        start=v.get('byteOffset',0);png=binary[start:start+v['byteLength']]
        source=Image.open(BytesIO(png));source.load()
        converted=BytesIO()
        source.save(converted,format='WEBP',lossless=True,exact=True,method=3)
        webp=converted.getvalue()
        if len(webp)>=len(png)*.99:continue
        old_image+=len(png)
        decoded=Image.open(BytesIO(webp));decoded.load()
        if source.convert('RGBA').tobytes()!=decoded.convert('RGBA').tobytes():
            raise ValueError(f'Pixel identity mismatch: {path.name}: image#{i}')
        if view_index in replacements:raise ValueError('Duplicate view replacement')
        replacements[view_index]=webp;changed_images.add(i);new_image+=len(webp);verified+=1
    if not replacements:
        return {'file':str(path.relative_to(ROOT)),'before':len(original),'after':len(original),'converted':0}
    for i in changed_images:images[i]['mimeType']='image/webp'
    updated_textures=0
    for tex in textures:
        src=tex.get('source')
        if src in changed_images:
            if 'EXT_texture_webp' in tex.get('extensions',{}):raise ValueError('Conflicting WebP extension')
            del tex['source']
            tex.setdefault('extensions',{})['EXT_texture_webp']={'source':src}
            updated_textures+=1
    # Unused images can still be changed with their MIME; the actual material
    # references must all resolve through the WebP extension.
    if updated_textures==0: raise ValueError(f'No textures reference optimized image in {path}')
    for key in ('extensionsUsed','extensionsRequired'):
        if 'EXT_texture_webp' not in obj.setdefault(key,[]):obj[key].append('EXT_texture_webp')
    packed=bytearray()
    for start,end,i in spans:
        packed.extend(b'\0'*(-len(packed)%4))
        data=replacements.get(i,binary[start:end])
        views[i]['byteOffset']=len(packed);views[i]['byteLength']=len(data)
        packed.extend(data)
    packed.extend(b'\0'*(-len(packed)%4))
    obj['buffers'][0]['byteLength']=len(packed)
    json_bytes=json.dumps(obj,ensure_ascii=False,separators=(',',':')).encode('utf-8')
    json_bytes+=b' '*(-len(json_bytes)%4)
    header=struct.pack('<4sII',b'glTF',2,12+8+len(json_bytes)+8+len(packed))
    output=header+struct.pack('<I4s',len(json_bytes),b'JSON')+json_bytes+struct.pack('<I4s',len(packed),b'BIN\x00')+packed
    # No vertex/accessor/mesh/material/skin/animation edits whatsoever.
    reparsed=json.loads(json_bytes)
    for key in ('meshes','skins','nodes','animations','accessors','materials'):
        if obj.get(key)!=reparsed.get(key):raise ValueError(f'Integrity mismatch {key}')
    if apply:
        temp=path.with_suffix(path.suffix+'.tmp')
        temp.write_bytes(output)
        _,verify_obj,verify_bin=read_glb(temp)
        if len(verify_bin)!=len(packed) or len(verify_obj['bufferViews'])!=len(views):
            temp.unlink(missing_ok=True);raise ValueError('Round-trip validation failed')
        temp.replace(path)
    return {'file':str(path.relative_to(ROOT)),'before':len(original),'after':len(output),
            'converted':verified,'textures':updated_textures,'image_saving':old_image-new_image,
            'sha256_before':sha256(original).hexdigest(),'sha256_after':sha256(output).hexdigest()}


def main():
    p=argparse.ArgumentParser();p.add_argument('--apply',action='store_true');p.add_argument('--report',type=Path);args=p.parse_args()
    records=[]
    for source in SOURCES:
        r=transform(source,args.apply);records.append(r)
        print(f"{source.name}: {r['before']/1048576:.2f} -> {r['after']/1048576:.2f} MiB; pixel-exact images {r['converted']}",flush=True)
    total_before=sum(x['before'] for x in records);total_after=sum(x['after'] for x in records)
    summary={'files':len(records),'beforeMiB':round(total_before/1048576,3),
             'afterMiB':round(total_after/1048576,3),'savedMiB':round((total_before-total_after)/1048576,3),
             'filesChanged':sum(x['converted']>0 for x in records),'imagesConverted':sum(x['converted'] for x in records)}
    print('SUMMARY',json.dumps(summary,ensure_ascii=False),flush=True)
    if args.report:args.report.write_text(json.dumps({'summary':summary,'files':records},indent=2)+'\n')

if __name__=='__main__':main()
