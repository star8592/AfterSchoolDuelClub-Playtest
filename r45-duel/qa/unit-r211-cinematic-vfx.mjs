import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import * as THREE from '../assets/three/build/three.module.js';
import {createR211CinematicVfx,R211_HERO_CARDS} from '../scene/campus-r211-cinematic-vfx.mjs';
import {SPELL_SIGNATURES} from '../scene/spell-response-contract.mjs';
assert.deepEqual(Object.keys(R211_HERO_CARDS),['E06','T05','S08']);
for(const [id,element] of Object.entries(R211_HERO_CARDS))
 assert.equal(SPELL_SIGNATURES[id].element,element);
for(const element of ['fire','water']){
 const p=new URL('../assets/vfx/r211-'+element+'-flipbook.webp',import.meta.url);
 const buf=readFileSync(p);
 assert.equal(buf.toString('ascii',0,4),'RIFF');
 assert.equal(buf.toString('ascii',8,12),'WEBP');
 assert(statSync(p).size<160000,'atlas should be compact for browser cold load');
}
const source=readFileSync(new URL('../scene/campus-r211-cinematic-vfx.mjs',import.meta.url),'utf8');
for(const forbidden of ['TorusGeometry','RingGeometry','PointLight','ShaderMaterial','WebGLRenderTarget'])
 assert(!source.includes(forbidden),'no generic glow or runtime shader '+forbidden);
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera();
const fx=createR211CinematicVfx(THREE,scene,{camera});
let t=10;
for(const [id] of Object.entries(R211_HERO_CARDS)){
 assert.equal(fx.spawn(SPELL_SIGNATURES[id],new THREE.Vector3(1,0,2),t,{kind:'host'}),true,id);
 fx.update(t+.1); t+=.15;
}
assert.equal(fx.stats.spawned,3);
assert.equal(fx.stats.peak,3);
assert.equal(fx.stats.addedGenericHalos,0);
assert.equal(fx.stats.addedGlobalLights,0);
assert.equal(fx.stats.gameplayMutations,0);
assert.equal(fx.spawn(SPELL_SIGNATURES['K06'],new THREE.Vector3(),t),false);
fx.update(t+2);
assert.equal(fx.stats.active,0);
assert.equal(fx.stats.expired,3);
fx.dispose();
assert(!scene.children.includes(fx.root));
console.log('R211_THREE_HERO_CARDS_OFFLINE_FLIPBOOK_NODE_QA_PASS',JSON.stringify({
 cards:Object.keys(R211_HERO_CARDS),maxConcurrent:3,
 noGlobalLight:true,noGenericHalo:true,gameplayMutations:0,webpOptimized:true}));

