import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../assets/model');
const manifest=JSON.parse(readFileSync(resolve(root,'r213-thumblite-manifest.json')));
const sha=b=>createHash('sha256').update(b).digest('hex');
const align=n=>(n+3)&~3;
function glb(buffer){
 assert.equal(buffer.toString('ascii',0,4),'glTF');
 assert.equal(buffer.readUInt32LE(4),2);
 assert.equal(buffer.readUInt32LE(8),buffer.length);
 const jl=buffer.readUInt32LE(12),js=JSON.parse(buffer.subarray(20,20+jl).toString());
 const binStart=20+jl+8,binLen=buffer.readUInt32LE(20+jl);
 assert.equal(buffer.subarray(20+jl+4,20+jl+8).toString('hex'),'42494e00');
 assert.equal(js.buffers[0].byteLength,binLen);
 return {json:js,bytes:buffer.subarray(binStart,binStart+binLen)};
}
assert.equal(manifest.entries.length,4);
for(const entry of manifest.entries){
 const original=readFileSync(resolve(root,entry.file));
 const trimmed=readFileSync(resolve(root,entry.optimized));
 assert.equal(sha(original),entry.originalSha256);
 assert.equal(sha(trimmed),entry.optimizedSha256);
 assert.equal(original.length,entry.sourceBytes);
 assert.equal(trimmed.length,entry.optimizedBytes);
 const a=glb(original),b=glb(trimmed);
 // Semantic glTF arrays/metadata MUST be the same: only BIN views shifted.
 for(const key of ['accessors','meshes','skins','animations','nodes','materials',
   'textures','images','samplers','scenes','scene','extensions','extensionsUsed',
   'extensionsRequired']){
   assert.deepEqual(b.json[key],a.json[key],entry.file+' changed '+key);
 }
 assert.equal(b.json.bufferViews.length,a.json.bufferViews.length);
 const th=a.json.images.find(x=>x.name==='Thumbnail');
 const vi=th.bufferView;
 const oldview=a.json.bufferViews[vi],newview=b.json.bufferViews[vi];
 assert.equal(oldview.byteOffset,newview.byteOffset);
 assert(newview.byteLength<oldview.byteLength/8);
 let verified=0;
 for(let i=0;i<a.json.bufferViews.length;i++){
   const old=a.json.bufferViews[i],now=b.json.bufferViews[i];
   assert.equal(old.buffer,now.buffer);
   if(old.buffer!==0||i===vi)continue;
   const o=a.bytes.subarray(old.byteOffset,old.byteOffset+old.byteLength);
   const n=b.bytes.subarray(now.byteOffset,now.byteOffset+now.byteLength);
   assert.equal(sha(o),sha(n),entry.file+' non-thumbnail binary bufferView changed '+i);
   verified++;
 }
 assert(verified>10);
 const p=oldview.byteOffset;
 assert.equal(sha(a.bytes.subarray(0,p)),sha(b.bytes.subarray(0,p)));
 assert.equal(sha(a.bytes.subarray(align(p+oldview.byteLength))),
  sha(b.bytes.subarray(align(p+newview.byteLength))));
 console.log(entry.file,'bytes original',entry.sourceBytes,'optimized',entry.optimizedBytes,
  'independent binary bufferViews unchanged',verified);
}
console.log('R213_FOUR_VRM_METADATA_ONLY_BINARY_IDENTITY_PASS',{assets:4,
   materialTexelBytesUnchanged:true,skinBonesMorphsUnchanged:true,metadataThumbnailUpdated:true});

