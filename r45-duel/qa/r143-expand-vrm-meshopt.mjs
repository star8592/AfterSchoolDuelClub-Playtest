#!/usr/bin/env node
/* R143: read-only meshoptimizer VRM decompressor for rigorous skin auditing.
 * Writes an isolated temporary DERIVED glb; never overwrites user art.
 * Uses the exact meshopt decoder shipped and exercised by the game itself.
 */
import {readFileSync,writeFileSync} from 'node:fs';
import {MeshoptDecoder} from '../assets/meshopt/meshopt_decoder.mjs';
const input=process.argv[2],output=process.argv[3];
if(!input||!output)throw Error('usage: node r143-expand-vrm-meshopt.mjs <input.vrm> <temporary-out.glb>');
const bytes=readFileSync(input);
if(bytes.toString('ascii',0,4)!=='glTF')throw Error('not a glTF2 binary');
if(bytes.readUInt32LE(8)!==bytes.length)throw Error('invalid GLB length');
let off=12,doc=null,binary=null;
while(off<bytes.length){
 const len=bytes.readUInt32LE(off),type=bytes.toString('ascii',off+4,off+8);
 const data=bytes.subarray(off+8,off+8+len);
 if(type==='JSON')doc=JSON.parse(data.toString('utf8'));
 if(type==='BIN\0')binary=data;
 off+=8+len;
}
if(!doc||!binary)throw Error('missing GLB chunks');
await MeshoptDecoder.ready;
const result=[binary];let total=binary.length,decoded=0;
for(const view of doc.bufferViews||[]){
 const ext=view.extensions?.EXT_meshopt_compression;
 if(!ext)continue;
 if(ext.buffer!==0||!Number.isInteger(ext.count)||!Number.isInteger(ext.byteStride))
  throw Error('unsupported meshopt compression source');
 const compressed=binary.subarray(ext.byteOffset,ext.byteOffset+ext.byteLength);
 const target=new Uint8Array(ext.count*ext.byteStride);
 MeshoptDecoder.decodeGltfBuffer(target,ext.count,ext.byteStride,compressed,
  ext.mode,ext.filter||'NONE');
 const pad=(-total)&3;
 if(pad){result.push(Buffer.alloc(pad));total+=pad;}
 view.buffer=0;view.byteOffset=total;view.byteLength=target.byteLength;
 if(ext.mode==='ATTRIBUTES')view.byteStride=ext.byteStride;
 else delete view.byteStride;
 delete view.extensions.EXT_meshopt_compression;
 if(Object.keys(view.extensions).length===0)delete view.extensions;
 result.push(Buffer.from(target));total+=target.byteLength;
 decoded++;
}
if(!decoded)throw Error('VRM does not contain Meshopt-compressed views');
const pad=(-total)&3;if(pad){result.push(Buffer.alloc(pad));total+=pad;}
doc.buffers=[{byteLength:total}];
for(const field of ['extensionsUsed','extensionsRequired']){
 if(doc[field])doc[field]=doc[field].filter(x=>x!=='EXT_meshopt_compression');
}
const j=Buffer.from(JSON.stringify(doc),'utf8');
const paddedJson=Buffer.alloc((j.length+3)&~3,0x20);j.copy(paddedJson);
const dst=Buffer.allocUnsafe(12+8+paddedJson.length+8+total);
dst.write('glTF',0,'ascii');dst.writeUInt32LE(2,4);dst.writeUInt32LE(dst.length,8);
dst.writeUInt32LE(paddedJson.length,12);dst.write('JSON',16,'ascii');
paddedJson.copy(dst,20);
let pos=20+paddedJson.length;
dst.writeUInt32LE(total,pos);dst.write('BIN\0',pos+4,'ascii');pos+=8;
for(const chunk of result){chunk.copy(dst,pos);pos+=chunk.length}
if(pos!==dst.length)throw Error('decoded binary length mismatch');
writeFileSync(output,dst);
process.stdout.write(JSON.stringify({decodedViews:decoded,derivedBytes:dst.length})+'\n');
