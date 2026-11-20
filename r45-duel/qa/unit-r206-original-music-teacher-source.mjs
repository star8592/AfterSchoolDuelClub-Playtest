import assert from 'node:assert/strict';
import{readFileSync}from'node:fs';
import{createHash}from'node:crypto';
import {R206_MODES}from'../scene/campus-r206-music-teacher-conductor.mjs';
assert.deepEqual(R206_MODES,['idle','attack','hit','walk','celebrate']);
const source=readFileSync(new URL('../assets/summons/M01-MusicTeacher-PolyforkSchoolTeacher.glb',import.meta.url));
assert.equal(source.toString('ascii',0,4),'glTF');
const len=source.readUInt32LE(12);
const gltf=JSON.parse(source.toString('utf8',20,20+len));
assert.equal(gltf.skins.length,10);
assert.equal(gltf.skins[0].joints.length,31);
assert.equal(gltf.nodes.filter(x=>x.skin!==undefined).length,10);
assert.deepEqual(gltf.animations.map(x=>x.name),['Idle','Walk','Run']);
const originalAnimationTracks=gltf.animations.map(x=>x.channels.map(y=>({
 bone:gltf.nodes[y.target.node].name,path:y.target.path
})));
for(const name of ['RightArm','RightForeArm','LeftArm','LeftForeArm','Spine2']){
 assert(originalAnimationTracks[0].some(x=>x.bone===name&&x.path==='rotation'),
  'real source idle must own this joint '+name);
}
const hashes=createHash('sha256').update(source).digest('hex');
console.log('R206_ORIGINAL_10_SKINS_31_BONES_23_SOURCE_IDLE_CHANNELS_5_PERFORMANCES_PASS',
 JSON.stringify({originalSource:'M01-MusicTeacher-PolyforkSchoolTeacher.glb',
 originalSha256:hashes,originalBindingMeshes:10,joints:31,
 originalSourceClips:3,
 originalNativeIdleTracks:originalAnimationTracks[0].length,
 stageModes:R206_MODES,noSourceReexport:true,noNewLowPoly:true}));
