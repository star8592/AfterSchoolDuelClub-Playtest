import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {selectMorphTextureMode} from './r194-float16-capability.mjs';
import {makeHalfMorphVendorOverlay} from './r193-half-morph-overlay.mjs';
const valid={ready:true,webgl2:true,supported:true,maxTextureSize:32768,
 maxArrayTextureLayers:2048,contextLoss:{requested:false,lost:false,restored:false,reProbePass:false}};
assert.equal(selectMorphTextureMode(valid).mode,'rgba16f');
assert.equal(selectMorphTextureMode(valid,{requested:false}).mode,'rgba32f');
assert.equal(selectMorphTextureMode(valid,{requireRestore:true}).mode,'rgba32f','unrun restore probe must fail closed');
assert.equal(selectMorphTextureMode(valid,{forceReject:true}).mode,'rgba32f');
assert.equal(selectMorphTextureMode({...valid,supported:false,reason:'test unsupported'}).mode,'rgba32f');
assert.equal(selectMorphTextureMode(null).mode,'rgba32f');
assert.equal(selectMorphTextureMode({...valid,maxTextureSize:1024}).mode,'rgba32f');
assert.equal(selectMorphTextureMode({...valid,maxArrayTextureLayers:32}).mode,'rgba32f');
assert.equal(selectMorphTextureMode({...valid,contextLoss:{requested:true,lost:true,restored:false,reProbePass:false}},{requireRestore:true}).mode,'rgba32f');
assert.equal(selectMorphTextureMode({...valid,contextLoss:{requested:true,lost:true,restored:true,reProbePass:true}},{requireRestore:true}).mode,'rgba16f');
const raw=readFileSync('r45-duel/assets/three/build/three.module.js','utf8');
const patched=makeHalfMorphVendorOverlay(raw,{native:true});
assert(patched.includes('r193HalfPayload'));
assert(!raw.includes('r193HalfPayload'),'Vendored Three.js unexpectedly changed');
console.log('R194_PURE_POLICY_AND_ORIGINAL_VENDOR_PASS',JSON.stringify({
 cases:10,fullPrecisionOnlyOnReject:true,originalVendorUntouched:true}));
