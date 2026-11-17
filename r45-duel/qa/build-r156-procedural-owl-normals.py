#!/usr/bin/env python3
"""R156: Preserve original glTF identity; replace only two 2K feather normal maps.

Hybrid procedural material: downsample source NORMAL VECTORS, renormalize, add
deterministic low-amplitude multiscale feather microgrooves, renormalize again.
All textures other than the two identified normal maps and all geometry buffers
stay byte-identical to the original GLB. Source artwork is never overwritten.
"""
from __future__ import annotations
import gzip, hashlib, io, json, math, struct, sys
from pathlib import Path
import numpy as np
from PIL import Image

SOURCE = Path('/home/master/projects/after-school-duel-r147-hotfix-20261114/r45-duel/assets/summons/T01-Owl-Innerscene-R84.glb')
OUT = Path(__file__).resolve().parent.parent / 'assets' / 'summons'
EVIDENCE = Path('/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118')
NORM_IDS = {1: 'bird_vane_shared_normal_v3', 4: '902_owl_normal'}
GLB_HEAD = struct.Struct('<4sII')
CHUNK_HEAD = struct.Struct('<II')
MAGIC_JSON=0x4e4f534a
MAGIC_BIN=0x004e4942

def unpack(path):
    data=path.read_bytes()
    magic,version,total=GLB_HEAD.unpack_from(data)
    assert magic==b'glTF' and version==2 and total==len(data)
    off=12
    jlen,jtype=CHUNK_HEAD.unpack_from(data,off)
    assert jtype==MAGIC_JSON;off+=8
    original=json.loads(data[off:off+jlen]);off+=jlen
    blen,btype=CHUNK_HEAD.unpack_from(data,off)
    assert btype==MAGIC_BIN;off+=8
    raw=data[off:off+blen]
    assert off+blen==len(data)
    return original,raw

def pack(obj,data):
    js=json.dumps(obj,ensure_ascii=False,separators=(',',':')).encode('utf-8')
    js+=b' '*((-len(js))%4)
    data+=b'\x00'*((-len(data))%4)
    total=12+8+len(js)+8+len(data)
    return GLB_HEAD.pack(b'glTF',2,total)+CHUNK_HEAD.pack(len(js),MAGIC_JSON)+js+CHUNK_HEAD.pack(len(data),MAGIC_BIN)+data

def vector_norm(a):
    # keep normal Z non-negative and avoid RGB->XYZ normalization artifacts
    length=np.sqrt(np.maximum((a*a).sum(axis=2,keepdims=True),1e-9))
    return a/length

def generate(image_bytes,dim,seed=0):
    src=Image.open(io.BytesIO(image_bytes)).convert('RGB')
    assert src.size==(2048,2048)
    # Browser normal textures are RGB unit vectors encoded in linear storage.
    # Resize in encoded domain then re-normalize tangent-space vectors.
    small=src.resize((dim,dim),Image.Resampling.LANCZOS)
    arr=np.asarray(small,dtype=np.float32)/127.5-1
    arr=vector_norm(arr)
    yy,xx=np.mgrid[0:dim,0:dim].astype(np.float32)
    # Two analytic, seeded, micro-groove waves. No bitmap lookup; these
    # recover inexpensive fine feather-like direction at smaller resolutions.
    # Keep amplitude very low (<~1% RGB), preserving original macro-normal.
    direction=xx*(.105+.005*seed)+yy*(.033+.003*seed)
    micro=np.sin(2*np.pi*direction + .44*np.sin(yy*.051+seed))
    micro2=np.sin(2*np.pi*(xx*.026-yy*.077)+seed*1.7)
    arr[...,0]+=0.011*micro+0.004*micro2
    arr[...,1]+=0.007*micro-0.003*micro2
    arr=vector_norm(arr)
    rgb=np.clip(np.round((arr+1)*127.5),0,255).astype('uint8')
    im=Image.fromarray(rgb,mode='RGB')
    io_out=io.BytesIO()
    im.save(io_out,'WEBP',quality=90,method=6)
    out=io_out.getvalue()
    # Vector-direction fidelity vs original full resolution (normal-metric);
    # downsampling losses are expected but local direction must be preserved.
    original=np.asarray(src.resize((dim,dim),Image.Resampling.LANCZOS),dtype=np.float32)/127.5-1
    original=vector_norm(original)
    rendered=np.asarray(Image.open(io.BytesIO(out)).convert('RGB'),dtype=np.float32)/127.5-1
    rendered=vector_norm(rendered)
    dots=(original*rendered).sum(axis=2)
    min_dot=float(dots.min())
    mean_dot=float(dots.mean())
    rmse=float(np.sqrt(((original-rendered)**2).mean()))
    return out,{'size':[dim,dim],'mean_normal_dot':round(mean_dot,6),
                'min_normal_dot':round(min_dot,6),'vector_rmse':round(rmse,6),
                'source_bytes':len(image_bytes),'generated_webp_bytes':len(out)}

def build(dim):
    source,old_bin=unpack(SOURCE)
    # Ensure material normal references are real EXT_texture_webp images,
    # not thumbnails. Only these two image entries are replaced.
    normal_indices={source['textures'][m['normalTexture']['index']]['extensions']['EXT_texture_webp']['source']
      for m in source['materials'] if 'normalTexture' in m}
    assert normal_indices==set(NORM_IDS),normal_indices
    from copy import deepcopy
    obj=deepcopy(source)
    # GLB has TWO declared buffers:
    #   buffer 0 = actual GLB BIN: embedded images + Meshopt encoded payload
    #   buffer 1 = VIRTUAL decompressed Meshopt buffer (no GLB BIN bytes).
    # Never reinterpret virtual bufferViews as spans of buffer 0!
    assert len(source['buffers'])==2
    assert source['buffers'][1].get('extensions',{}).get('EXT_meshopt_compression',{}).get('fallback') is True
    replace={}
    audits=[]
    segments=[]
    for i,name in NORM_IDS.items():
        im=source['images'][i]
        assert im['name']==name and im['mimeType']=='image/webp'
        ix=im['bufferView']
        v=source['bufferViews'][ix]
        assert v['buffer']==0
        offset=v.get('byteOffset',0)
        old=old_bin[offset:offset+v['byteLength']]
        new,metrics=generate(old,dim,seed=i)
        replace[ix]=new
        obj['images'][i]['name']=name+f'_R156_HYBRID_PROCEDURAL_{dim}'
        audits.append({'id':i,'bufferView':ix,**metrics})
        old_end=(offset+v['byteLength']+3)&~3
        segments.append((offset,old_end,ix,new))
    segments.sort()
    assert segments[0][1]<=segments[1][0]
    # Explicitly verify no other true BIN view or Meshopt compressed payload
    # overlaps the two replaced image regions.
    for start,end,ix,new in segments:
        for i,v in enumerate(source['bufferViews']):
            if v['buffer']==0 and i!=ix:
                a=v.get('byteOffset',0);b=a+v['byteLength']
                assert b<=start or a>=end,('overlapping true view',i,ix)
            ext=v.get('extensions',{}).get('EXT_meshopt_compression')
            if ext and ext['buffer']==0:
                a=ext.get('byteOffset',0);b=a+ext['byteLength']
                assert b<=start or a>=end,('overlapping meshopt payload',i,ix)
    # Rebuild actual BIN by replacing only known image spans; preserve all
    # other binary bytes identically and translate every true offset.
    out=bytearray()
    cursor=0
    shifts=[]
    for start,end,ix,new in segments:
        assert cursor<=start and start%4==0
        out.extend(old_bin[cursor:start])
        new_start=len(out)
        out.extend(new)
        out.extend(b'\x00'*((-len(out))%4))
        obj['bufferViews'][ix]['byteOffset']=new_start
        obj['bufferViews'][ix]['byteLength']=len(new)
        shifts.append((end,len(out)))
        cursor=end
    out.extend(old_bin[cursor:])
    new_bin=bytes(out)
    def translate(offset):
        shift=0
        for start,end,ix,_ in segments:
            if start<=offset<end:
                raise AssertionError(('unexpected referenced offset inside replaced image',ix,offset))
            if offset>=end:
                # New buffer length by this point vs old end
                shift += (end-start)-((replace[ix].__len__()+3)&~3)
        return offset-shift
    for i,view in enumerate(source['bufferViews']):
        if view['buffer']==0 and i not in replace:
            obj['bufferViews'][i]['byteOffset']=translate(view.get('byteOffset',0))
        ext=view.get('extensions',{}).get('EXT_meshopt_compression')
        if ext and ext['buffer']==0:
            obj['bufferViews'][i]['extensions']['EXT_meshopt_compression']['byteOffset']=translate(ext.get('byteOffset',0))
    obj['buffers'][0]['byteLength']=len(new_bin)
    prefix=f'T01-Owl-Innerscene-R156-HybridNormal-{dim}'
    asset=OUT/(prefix+'.glb')
    raw=pack(obj,bytes(new_bin))
    asset.write_bytes(raw)
    packed=gzip.compress(raw,compresslevel=9,mtime=0)
    gz=OUT/(prefix+'.glb.gz')
    gz.write_bytes(packed)
    # Structural audit: every non-image original BIN view and compressed
    # Meshopt payload still matches the original bytes, even when offsets move.
    parsed,rb=unpack(asset)
    for key in ('nodes','meshes','accessors','materials','textures','skins','animations','samplers'):
        assert source.get(key)==parsed.get(key),key
    assert len(parsed['bufferViews'])==len(source['bufferViews'])
    assert len(parsed['images'])==len(source['images'])
    for i,v in enumerate(source['bufferViews']):
        nv=parsed['bufferViews'][i]
        assert nv['buffer']==v['buffer'],i
        if v['buffer']==1:
            # Virtual decompressed view offsets stay identical; only the
            # compressed source BIN byteOffset must follow the moved bytes.
            clean_new=json.loads(json.dumps(nv))
            clean_old=json.loads(json.dumps(v))
            ext_new=clean_new.get('extensions',{}).get('EXT_meshopt_compression')
            ext_old=clean_old.get('extensions',{}).get('EXT_meshopt_compression')
            if ext_new and ext_old:
                ext_new['byteOffset']=ext_old['byteOffset']
            assert clean_new==clean_old,('virtual meshopt decoded view mutated',i)
        elif i not in replace:
            sv=old_bin[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']]
            dv=rb[nv['byteOffset']:nv['byteOffset']+nv['byteLength']]
            assert sv==dv,('original view changed',i)
        e0=v.get('extensions',{}).get('EXT_meshopt_compression')
        if e0 and e0['buffer']==0:
            e1=nv['extensions']['EXT_meshopt_compression']
            assert all(e1.get(k)==value for k,value in e0.items() if k!='byteOffset')
            a=e0.get('byteOffset',0);b=e1.get('byteOffset',0)
            assert old_bin[a:a+e0['byteLength']]==rb[b:b+e1['byteLength']],('compressed meshopt changed',i)
    assert gzip.decompress(packed)==raw
    return {'variant':dim,'asset':asset.name,'packed':gz.name,
        'glb_original_bytes':SOURCE.stat().st_size,'glb_variant_bytes':len(raw),
        'gz_original_bytes':(SOURCE.with_suffix(SOURCE.suffix+'.gz')).stat().st_size,
        'gz_variant_bytes':len(packed),'saved_wire_bytes':
        (SOURCE.with_suffix(SOURCE.suffix+'.gz')).stat().st_size-len(packed),
        'original_hash':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
        'variant_hash':hashlib.sha256(raw).hexdigest(),
        'packed_hash':hashlib.sha256(packed).hexdigest(),
        'other_geometry_materials_textures_identical':True,
        'normal_replacements':audits}

def main():
    OUT.mkdir(parents=True,exist_ok=True);EVIDENCE.mkdir(parents=True,exist_ok=True)
    results=[build(1024),build(512)]
    report={'purpose':'hybrid procedural feather microdetail with source normal retained at reduced resolution',
       'source':SOURCE.name,'variants':results}
    path=EVIDENCE/'r156-owl-hybrid-normals.json'
    path.write_text(json.dumps(report,ensure_ascii=False,indent=2))
    for item in results:
        print('R156_ASSET_PASS',item['variant'],'wire_saved',item['saved_wire_bytes'],
          'bytes','packed',item['gz_variant_bytes'],flush=True)
    print('R156_FINISHED',str(path),flush=True)

if __name__=='__main__':main()
