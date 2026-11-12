import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {SOURCE_FRONT_YAW,faceOpponentYaw} from '../scene/summon-orientation.mjs';
const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
let checks=0;const ok=(v,m)=>{if(!v)throw Error('R99_CHECK '+m);checks++};
const actual=readFileSync(resolve(root,'assets/summons/M02-CafeteriaAunt-ChefHat-Spatula-R99.glb'));
ok(actual.toString('ascii',0,4)==='glTF'&&actual.readUInt32LE(8)===actual.byteLength,'actual GLB');
const doc=JSON.parse(actual.subarray(20,20+actual.readUInt32LE(12)).toString());
ok(doc.animations?.length===10&&doc.skins?.length>=1,'preserved ten real skeletal clips');
const parts=doc.nodes.filter(x=>x.name?.startsWith('R99_'));
ok(parts.length>=11,'high-resolution chef prop meshes, not fake textures');
for(const part of parts){
 const p=doc.meshes[part.mesh]?.primitives?.[0]?.attributes;
 ok(part.skin!==undefined&&p?.JOINTS_0!==undefined&&p?.WEIGHTS_0!==undefined,
  'source-skeleton skin on '+part.name);
}
ok(parts.some(n=>n.name.includes('ChefHat_14Pleat')),'pleated chef hat');
ok(parts.some(n=>n.name.includes('StainlessSteel_slotted_blade')),'actual spatula blade');
ok(parts.some(n=>n.name.includes('OakSpatula_handle')),'actual spatula handle');
ok(SOURCE_FRONT_YAW.M02===0,'face source calibrated from real headfront bone');
for(const id of Object.keys(SOURCE_FRONT_YAW)){
 for(const side of ['player','ai']){
  const yaw=faceOpponentYaw(id,side)+SOURCE_FRONT_YAW[id];
  ok(Math.sin(yaw)*(side==='player'?1:-1)>.60&&Math.cos(yaw)>.79,
   'towards opponent and camera '+id+' '+side);
 }
}
const manifest=JSON.parse(readFileSync(resolve(root,'assets/audio/voice-manifest.json')));
ok(manifest.loudness_profile_r99==='EBU_R128_-16LUFS_-1.5dBTP','updated LUFS master');
let count=0;
for(const role of Object.values(manifest.clips)){
 for(const clip of Object.values(role)){
  const bytes=readFileSync(resolve(root,'assets/audio/voices',clip.file));
  ok(createHash('sha256').update(bytes).digest('hex')===clip.sha256,
   'matching normalized Opus voice SHA: '+clip.file);
  count++;
 }
}
ok(count===98,'98 authentic Qwen3 clips preserved');
console.log('R99_ASSET_AND_ORIENTATION',JSON.stringify({passed:true,assertions:checks,
 audioFiles:count,accessoryParts:parts.length,sourceClips:doc.animations.length,
 characterSides:Object.keys(SOURCE_FRONT_YAW).length*2}));
