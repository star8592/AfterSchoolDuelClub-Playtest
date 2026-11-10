/**
 * Offline GLB/VRM intake preflight.
 * Reads glTF metadata without importing any historic model to the live game.
 * The result is technical evidence only; it is NEVER an art-approval signal.
 *
 * Usage: node r45-duel/art/qa/inspect-model-candidate.mjs <path.glb|path.vrm>...
 */
import {readFileSync,statSync} from 'node:fs';
import {basename} from 'node:path';
import {createHash} from 'node:crypto';
const input=process.argv.slice(2);
if(!input.length){console.error('Pass model candidate file paths');process.exit(2)}
const all=[];
for(const file of input){
 try{
  const b=readFileSync(file);
  if(b.length<20||b.toString('utf8',0,4)!=='glTF')throw Error('Not a GLB/VRM container');
  const version=b.readUInt32LE(4),total=b.readUInt32LE(8);
  if(version!==2||total!==b.length)throw Error('Unsupported/invalid GLB container');
  const chunkLength=b.readUInt32LE(12),chunkTag=b.toString('utf8',16,20);
  if(chunkTag!=='JSON'||20+chunkLength>b.length)throw Error('GLB JSON chunk invalid');
  const model=JSON.parse(b.toString('utf8',20,20+chunkLength));
  const primitives=(model.meshes||[]).flatMap(m=>m.primitives||[]);
  const triangles=primitives.reduce((n,p)=>{
   const accessor=model.accessors?.[p.indices]||model.accessors?.[p.attributes?.POSITION]||null;
   if(!accessor)return n;
   if(p.mode===5||p.mode===6)return n+Math.max(0,accessor.count-2);
   return n+Math.floor(accessor.count/3);
  },0);
  const skinJoints=(model.skins||[]).reduce((n,s)=>n+((s.joints||[]).length),0);
  const record={
   name:basename(file),bytes:statSync(file).size,
   sha256:createHash('sha256').update(b).digest('hex'),
   gltfVersion:version,meshes:model.meshes?.length||0,primitives:primitives.length,
   estimatedTriangleFaces:triangles,materials:model.materials?.length||0,
   textures:model.textures?.length||0,skins:model.skins?.length||0,
   skinJoints,animations:model.animations?.length||0,
   nodes:model.nodes?.length||0,extensionsUsed:model.extensionsUsed||[],
   automaticArtApproval:false,
   humanReferenceReview:'NOT_DONE',
   nextAction:'Compare original art at 0/45/90/180 with game skinning and movement before production use'
  };
  all.push(record);
  console.log('R53_MODEL_TECHNICAL_INTAKE',JSON.stringify(record));
 }catch(e){
  all.push({name:basename(file),error:String(e),automaticArtApproval:false});
  process.exitCode=2;
 }
}
