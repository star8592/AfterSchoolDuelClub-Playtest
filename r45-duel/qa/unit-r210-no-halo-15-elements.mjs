import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from '../assets/three/build/three.module.js';
import {createR210PhysicalElements,R210_ELEMENT_PROFILES} from '../scene/campus-r210-material-elements.mjs';
import {CARD_ELEMENTS,SPELL_SIGNATURES} from '../scene/spell-response-contract.mjs';
import {CARDS} from '../engine.mjs';

const elements=Object.keys(R210_ELEMENT_PROFILES),spells=CARDS.filter(c=>c.kind==='spell');
assert.equal(spells.length,46);
assert.equal(elements.length,15);
assert.equal(new Set(elements.map(k=>R210_ELEMENT_PROFILES[k].motion)).size,15);
assert.equal(new Set(elements.map(k=>R210_ELEMENT_PROFILES[k].primary)).size>=10,true);
for(const spell of spells){
 const sig=SPELL_SIGNATURES[spell.id];
 assert(sig&&sig.element===CARD_ELEMENTS[spell.id]);
 assert(R210_ELEMENT_PROFILES[sig.element],'missing material '+spell.id);
}
const source=readFileSync(new URL('../scene/campus-r210-material-elements.mjs',import.meta.url),'utf8');
for(const forbidden of ['new THREE.TorusGeometry(','new THREE.RingGeometry(','new THREE.PointLight(','new THREE.ShaderMaterial('])
 assert(!source.includes(forbidden),'Forbidden generic halo/GPU light '+forbidden);
const scene=new THREE.Scene(),fx=createR210PhysicalElements(THREE,scene);
let time=1;
for(const [i,element] of elements.entries()){
 const id=Object.keys(CARD_ELEMENTS).find(x=>CARD_ELEMENTS[x]===element);
 const yes=fx.spawn({id,element},new THREE.Vector3(i*.1,.2,.3),time,{kind:'host'});
 assert.equal(yes,true,element);
 fx.update(time+.25);
 const live=fx.stats;
 assert(live.active<=3&&live.peak<=3&&live.maxDrawCalls<=6);
 assert.equal(live.last.element,element);
 const mesh=fx.root.getObjectByName('R210_'+element+'_'+id+'_host');
 assert(mesh?.children?.length===2);
 assert(mesh.children.every(x=>x.isInstancedMesh));
 assert(mesh.children.every(x=>x.geometry?.type!=='TorusGeometry'&&
  x.geometry?.type!=='RingGeometry'));
 assert(mesh.children.every(x=>x.count<=18));
 time+=1.4;fx.update(time);
}
assert.equal(fx.stats.spawned,15);
assert.equal(fx.stats.active,0);
assert.equal(fx.stats.addedGenericHalos,0);
assert.equal(fx.stats.addedPointLights,0);
assert.equal(fx.stats.addedCustomShaders,0);
assert.equal(fx.stats.gameplayMutations,0);
assert.equal(fx.spawn({id:'K99',element:'nonsense'},new THREE.Vector3(0,0,0),time),false);
fx.dispose();
assert.equal(scene.children.includes(fx.root),false);
console.log('R210_46_REAL_SPELL_ELEMENTS_15_ORIGINAL_PHYSICAL_MOTIONS_NO_HALO_PASS',JSON.stringify({
 spells:46,distinctElements:15,distinctMotionTypes:15,maximumActiveFx:3,
 maximumDrawCallsPer3Fx:6,instancesPerFx:29,
 noTorus:true,noRingGeometry:true,noPointLights:true,
 noCustomShaders:true,gameplayMutations:0
}));
