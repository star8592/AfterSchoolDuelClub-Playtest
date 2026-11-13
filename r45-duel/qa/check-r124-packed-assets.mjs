import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {resolve} from 'node:path';
const base=resolve(import.meta.dirname,'../assets/summons');
const manifest=JSON.parse(readFileSync(resolve(base,'r124-packed-manifest.json'),'utf8'));
const files=Object.entries(manifest.files);
assert.equal(manifest.compression,'gzip');assert.equal(files.length,12);
let totalSrc=0,totalDst=0;
for(const [file,entry] of files){
 assert.match(file,/^[A-Za-z0-9_-]+\.glb$/);
 const orig=readFileSync(resolve(base,file)),pack=readFileSync(resolve(base,file+'.gz'));
 assert.equal(orig.subarray(0,4).toString(),'glTF');
 assert.deepEqual(gunzipSync(pack),orig,'gzip must reproduce IDENTICAL GLB bytes for '+file);
 assert.equal(createHash('sha256').update(orig).digest('hex'),entry.sha256);
 assert.equal(createHash('sha256').update(pack).digest('hex'),entry.packedSha256);
 assert.equal(statSync(resolve(base,file)).size,entry.sourceBytes);
 assert.equal(pack.length,entry.packedBytes);
 totalSrc+=orig.length;totalDst+=pack.length;
}
assert.equal(totalSrc,manifest.sourceBytes);assert.equal(totalDst,manifest.packedBytes);
assert.ok(totalDst/totalSrc<.8);
console.log('R124_WIRE_GLB_LOSSLESS_PASS',JSON.stringify({models:files.length,sourceMiB:+(totalSrc/1048576).toFixed(2),packedMiB:+(totalDst/1048576).toFixed(2),savedPercent:+((1-totalDst/totalSrc)*100).toFixed(1),realBinaryIdentity:true}));
