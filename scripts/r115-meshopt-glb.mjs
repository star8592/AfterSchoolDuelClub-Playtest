/** R115 pixel + vertex byte-exact compression for GLB2/VRM (requires WebP stage first).
 * Meshoptimizer 1.1.1, MIT (see r45-duel/assets/meshopt/LICENSE.md).
 * Only compresses bufferViews reached through standard glTF accessors; no
 * quantization, no topology change, no skin/animation edits, no material edits.
 * Preserves all original bytes after decode; browser decoder is vendored.
 */
import {readFileSync,writeFileSync,renameSync} from 'node:fs';
import {join,resolve,relative} from 'node:path';
import {MeshoptEncoder} from './vendor/meshoptimizer/meshopt_encoder.mjs';
import {MeshoptDecoder} from '../r45-duel/assets/meshopt/meshopt_decoder.mjs';
import {createHash} from 'node:crypto';
await Promise.all([MeshoptEncoder.ready,MeshoptDecoder.ready]);
const cwd=resolve(import.meta.dirname,'..');
const scene=readFileSync(join(cwd,'r45-duel/scene/summon-models.mjs'),'utf8');
const sources=[...scene.matchAll(/^\s*[EGTM]\d{2}:\{file:'([^']+)'/gm)].map(x=>join(cwd,'r45-duel/assets/summons',x[1]));
sources.push(...['Shino-original-CC0.vrm','Fumiriya-original-CC0.vrm','Host-HairSample_Female-CC0.vrm','Host-HairSample_Male-CC0.vrm'].map(x=>join(cwd,'r45-duel/assets/model',x)));
if(sources.length!==16)throw Error('Expected 16 original models');
const kinds={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},component={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4};
const sha=b=>createHash('sha256').update(b).digest('hex');
const pad4=n=>(4-(n%4))%4;
const reports=[];
for(const file of sources){
 const raw=readFileSync(file);
 if(raw.toString('utf8',0,4)!=='glTF'||raw.readUInt32LE(4)!==2||raw.readUInt32LE(8)!==raw.length)throw Error('Invalid GLB '+file);
 const jsonLen=raw.readUInt32LE(12),json=JSON.parse(raw.subarray(20,20+jsonLen).toString()),bin=raw.subarray(28+jsonLen);
 if(json.buffers.length!==1||json.buffers[0].uri)throw Error('Expected GLB one local buffer');
 const spans=json.bufferViews.map((v,i)=>({i,offset:v.byteOffset||0,end:(v.byteOffset||0)+v.byteLength})).sort((a,b)=>a.offset-b.offset);
 for(let i=1;i<spans.length;i++)if(spans[i-1].end>spans[i].offset)throw Error('Overlapping views');
 const accesses=new Map();
 for(const a of json.accessors||[]){if(a.bufferView===undefined)continue;const stride=kinds[a.type]*component[a.componentType];if(!accesses.has(a.bufferView))accesses.set(a.bufferView,new Set());accesses.get(a.bufferView).add(stride);}
 const fallback={byteLength:bin.length,extensions:{EXT_meshopt_compression:{fallback:true}}};
 const blocks=[];let bytes=0,compressed=0,verified=0;
 function add(data){const p=Buffer.alloc(pad4(bytes));if(p.length){blocks.push(p);bytes+=p.length;}const position=bytes;blocks.push(data);bytes+=data.length;return position;}
 for(const {i,offset,end} of spans){
  const v=json.bufferViews[i],orig=bin.subarray(offset,end),sizes=accesses.get(i);
  // Small, unreferenced, and image views remain exactly the same GLB bytes.
  let stride=sizes?.size===1?[...sizes][0]:4;
  if(stride>256||stride%4||orig.length%stride)stride=4;
  const candidate=sizes?.size&&orig.length>=8192&&orig.length%4===0;
  const enc=candidate?Buffer.from(MeshoptEncoder.encodeGltfBuffer(orig,orig.length/stride,stride,'ATTRIBUTES')):null;
  if(enc && enc.length<orig.length*.95){
   const dec=Buffer.from(await MeshoptDecoder.decodeGltfBufferAsync(orig.length/stride,stride,enc,'ATTRIBUTES'));
   if(!dec.equals(orig))throw Error('Bit-level mismatch '+relative(cwd,file)+' view '+i);
   const pos=add(enc);v.buffer=1;v.byteOffset=offset;
   v.extensions??={};v.extensions.EXT_meshopt_compression={buffer:0,byteOffset:pos,byteLength:enc.length,byteStride:stride,count:orig.length/stride,mode:'ATTRIBUTES'};
   compressed++;verified++;continue;
  }
  v.byteOffset=add(orig);v.buffer=0;
 }
 if(!compressed){reports.push({file:relative(cwd,file),before:raw.length,after:raw.length,viewsCompressed:0});console.log('UNCHANGED',relative(cwd,file));continue;}
 json.buffers[0].byteLength=bytes+pad4(bytes);json.buffers.push(fallback);
 for(const key of ['extensionsUsed','extensionsRequired']){json[key]??=[];if(!json[key].includes('EXT_meshopt_compression'))json[key].push('EXT_meshopt_compression');}
 let jsonOut=Buffer.from(JSON.stringify(json),'utf8');jsonOut=Buffer.concat([jsonOut,Buffer.alloc(pad4(jsonOut.length),0x20)]);
 const binOut=Buffer.concat([...blocks,Buffer.alloc(pad4(bytes))]);
 const header=Buffer.alloc(20);header.write('glTF',0);header.writeUInt32LE(2,4);header.writeUInt32LE(28+jsonOut.length+binOut.length,8);
 header.writeUInt32LE(jsonOut.length,12);header.write('JSON',16);
 const binHeader=Buffer.alloc(8);binHeader.writeUInt32LE(binOut.length,0);binHeader.write('BIN\0',4);
 const output=Buffer.concat([header,jsonOut,binHeader,binOut]);
 if(output.length>=raw.length)throw Error('Compressed larger '+file);
 const restored=JSON.parse(output.subarray(20,20+jsonOut.length).toString());
 for(const key of ['accessors','meshes','materials','skins','animations','nodes'])if(JSON.stringify(json[key])!==JSON.stringify(restored[key]))throw Error('Metadata changed '+key);
 if(process.argv.includes('--apply')){const temp=file+'.meshopt-tmp';writeFileSync(temp,output);renameSync(temp,file);}
 const report={file:relative(cwd,file),before:raw.length,after:output.length,viewsCompressed:compressed,verified,
 beforeSHA256:sha(raw),afterSHA256:sha(output)};
 reports.push(report);console.log('COMPRESSED',report.file,(report.before/1048576).toFixed(2),'->',(report.after/1048576).toFixed(2),'MiB','views',compressed);
}
const summary={beforeMiB:reports.reduce((a,r)=>a+r.before,0)/1048576,afterMiB:reports.reduce((a,r)=>a+r.after,0)/1048576,convertedViews:reports.reduce((a,r)=>a+r.viewsCompressed,0)};
console.log('R115_MESHOPT',JSON.stringify(summary));
if(process.argv.includes('--apply'))writeFileSync('/tmp/r115-meshopt-report.json',JSON.stringify({summary,reports},null,2));
