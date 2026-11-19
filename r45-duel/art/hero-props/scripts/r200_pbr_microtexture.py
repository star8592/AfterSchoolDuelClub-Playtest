#!/usr/bin/env python3
"""R200: non-destructive textured variant of existing high-detail Blender GLBs.

Preserves ALL original geometry, skins, animations, source nodes, names, PBR
base-color factors and metallic/roughness factors. Adds small deterministic
repeating material-specific micro-surface textures ONLY to materials whose
mesh primitives already have TEXCOORD_0. No shader/light per frame, no fake
low-poly replacement, no network dependency.
"""
import argparse, hashlib, io, json, math, struct
from pathlib import Path
import numpy as np
from PIL import Image

def pad4(data,byte=b'\0'):
    return data + byte*((4-len(data)%4)%4)

def parse_glb(p):
    data=Path(p).read_bytes()
    assert data[:4]==b'glTF' and struct.unpack_from('<II',data,4)[0]==2
    chunks=[];offset=12
    while offset<len(data):
        size,kind=struct.unpack_from('<II',data,offset);offset+=8
        chunks.append((kind,data[offset:offset+size]));offset+=size
    assert len(chunks)==2 and chunks[0][0]==0x4e4f534a and chunks[1][0]==0x004e4942
    return json.loads(chunks[0][1]),bytearray(chunks[1][1])

def png_bytes(a):
    im=Image.fromarray(a.astype(np.uint8),'RGBA')
    b=io.BytesIO();im.save(b,format='PNG',optimize=True,compress_level=8)
    return b.getvalue()

def kind_of(name):
    t=name.lower()
    for key,terms in [
     ('wood',['wood','walnut','ash','timber','handle','lacquer','desk']),
     ('chalk',['chalk','felt','dust','limestone','foam','fiber','cotton']),
     ('metal',['iron','steel','brass','silver','metal','rivet','rim','hinge','enamel']),
     ('food',['banana','eggplant','jelly','caramel','calyx','sauce','sesame','fruit','skin','pudding','berry']),
    ]:
        if any(word in t for word in terms):return key
    return 'fine'

def textures(name,seed,size=128):
    rng=np.random.default_rng(seed)
    raw=rng.random((size,size))
    # multi-octave noise; no runtime shaders, no animation, fixed small textures
    layer=np.zeros((size,size),np.float32)
    for i,(scale,amp) in enumerate([(5,.44),(19,.29),(49,.17),(size,.10)]):
        low=(rng.random((scale,scale))*255).astype('uint8')
        high=np.asarray(Image.fromarray(low,'L').resize((size,size),Image.Resampling.BICUBIC),dtype=np.float32)/255
        layer+=amp*high
    y,x=np.indices((size,size))
    k=kind_of(name)
    if k=='wood':
        grain=np.sin(x*.47+.8*np.sin(y*.08)+layer*2.7)*.35
        contrast=(layer-.5)*.9+grain*.33
    elif k=='metal':
        grain=np.sin(y*.82+layer*1.4)*.21
        contrast=(layer-.5)*.66+grain*.35
    elif k=='chalk':
        pores=np.where(raw>.93,-.47,0)
        contrast=(layer-.5)*.75+pores
    elif k=='food':
        flecks=np.where(raw>.968,-.24,0)
        contrast=(layer-.5)*1.1+flecks
    else:contrast=(layer-.5)*.7
    # Keep original source colors intact: only ~3-7% diffuse variation.
    variation=np.clip(249+contrast*14,234,255)
    rgba=np.zeros((size,size,4),dtype=np.uint8)
    rgba[:,:,:3]=variation[:,:,None]
    rgba[:,:,3]=255
    # glTF orm: green stores roughness multiplier and blue metallic multiplier
    orm=np.full((size,size,4),255,dtype=np.uint8)
    orm[:,:,1]=np.clip(235+contrast*24,198,255).astype('uint8')
    return png_bytes(rgba),png_bytes(orm),k

def inject(source,target):
    doc,binary=parse_glb(source)
    materials=doc.get('materials',[])
    # Only materials for which every associated primitive has UV0 are safe.
    uv_by_material={}
    for mesh in doc.get('meshes',[]):
        for pr in mesh.get('primitives',[]):
            mat=pr.get('material')
            if mat is None:continue
            uv_by_material.setdefault(mat,[]).append('TEXCOORD_0' in pr.get('attributes',{}))
    views=doc.setdefault('bufferViews',[])
    images=doc.setdefault('images',[])
    samplers=doc.setdefault('samplers',[])
    textures_list=doc.setdefault('textures',[])
    sample=len(samplers)
    samplers.append({'magFilter':9729,'minFilter':9987,'wrapS':10497,'wrapT':10497})
    touched=[];sizes=[]
    for i,mat in enumerate(materials):
        if not all(uv_by_material.get(i,[False])):continue
        pbr=mat.setdefault('pbrMetallicRoughness',{})
        if pbr.get('baseColorTexture') or pbr.get('metallicRoughnessTexture'):continue
        name=mat.get('name') or f'PBR Material {i}'
        seed=int(hashlib.sha256((name+'|R200').encode()).hexdigest()[:8],16)
        col,orm,kind=textures(name,seed)
        nums=[]
        for label,img in [('albedo',col),('orm',orm)]:
            offset=len(binary)
            binary.extend(pad4(img))
            view_id=len(views)
            views.append({'buffer':0,'byteOffset':offset,'byteLength':len(img)})
            image_id=len(images)
            images.append({'bufferView':view_id,'mimeType':'image/png',
                           'name':f'R200_{kind}_{i}_{label}'})
            tex_id=len(textures_list)
            textures_list.append({'sampler':sample,'source':image_id})
            nums.append(tex_id)
            sizes.append(len(img))
        pbr['baseColorTexture']={'index':nums[0],'texCoord':0}
        pbr['metallicRoughnessTexture']={'index':nums[1],'texCoord':0}
        touched.append({'name':name,'kind':kind,'bytes':sum(sizes[-2:])})
    if not touched:raise RuntimeError('No UV-safe PBR material in '+str(source))
    doc['buffers'][0]['byteLength']=len(binary)
    json_chunk=pad4(json.dumps(doc,ensure_ascii=False,separators=(',',':')).encode(),' '.encode())
    bin_chunk=pad4(bytes(binary))
    whole=12+8+len(json_chunk)+8+len(bin_chunk)
    glb=struct.pack('<4sII',b'glTF',2,whole)+struct.pack('<II',len(json_chunk),0x4e4f534a)+json_chunk+struct.pack('<II',len(bin_chunk),0x004e4942)+bin_chunk
    Path(target).write_bytes(glb)
    return {'source':str(source),'target':str(target),'materialsWithPbrMicrotexture':len(touched),
       'originalMaterials':len(materials),'addedTextures':len(touched)*2,
       'newImageBytes':sum(sizes),'sourceBytes':Path(source).stat().st_size,
       'targetBytes':len(glb),'materials':touched}

if __name__=='__main__':
    a=argparse.ArgumentParser()
    a.add_argument('source');a.add_argument('target')
    x=a.parse_args();print(json.dumps(inject(x.source,x.target),ensure_ascii=False))
