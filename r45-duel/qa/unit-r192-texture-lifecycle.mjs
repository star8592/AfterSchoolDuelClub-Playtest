import assert from 'node:assert/strict';
import {installTextureLifecycleTrace} from '../scene/texture-gpu-lifecycle.mjs';
import {inspectMorphTextureBudget} from '../scene/morph-texture-budget.mjs';

// Test instrumentation against isolated fake WebGL; no browser or user Chrome touched.
const created=new Set();
const gl={
  createTexture(){const t={name:'t'+(created.size+1)};created.add(t);return t},
  deleteTexture(t){created.delete(t)},
  texImage3D(){return true},texStorage3D(){return true},texSubImage3D(){return true}
};
const canvas={getContext(kind){return kind==='webgl2'?gl:null}};
const trace=installTextureLifecycleTrace(canvas);
assert.equal(canvas.getContext('webgl2'),gl);
const one=gl.createTexture(),two=gl.createTexture();
assert.equal(trace.idFor(one),1);
assert.equal(trace.idFor(two),2);
gl.texStorage3D(0,1,34836,8,4,3);
gl.texSubImage3D(0,0,0,0,0,8,4,3,6408,5126,new Float32Array(8*4*3*4));
const fakeRenderer={info:{memory:{textures:2}}};
const early=trace.snapshot(fakeRenderer,[trace.idFor(one)]);
assert.equal(early.installed,true);
assert.equal(early.trackedLive,2);
assert.equal(early.arrayAllocations3D,1);
assert.equal(early.arrayUploadedFloatPayloadMiB,0.001);
gl.deleteTexture(two);
assert.equal(trace.snapshot(fakeRenderer,[trace.idFor(one)]).trackedLive,1);
const data=(values)=>({itemSize:3,normalized:false,count:values.length/3,array:new Float32Array(values)});
function geom(id,offset=0){
 const pos=data([0,0,0,1,0,0,0,1,0]);
 const morph=data([0,0,offset,1,0,0,0,1,0]);
 return {uuid:id,isBufferGeometry:true,name:'face'+id,
   attributes:{position:pos},morphAttributes:{position:[morph]},index:null,
   morphTargetsRelative:false,drawRange:{start:0,count:Infinity},groups:[],userData:{}};
}
const g1=geom('one'),g2=geom('two'),g3=geom('three',0.1);
const roots=[g1,g2,g3].map((g,i)=>({name:'root'+i,traverse(fn){
 fn({name:'mesh'+i,geometry:g,visible:true,morphTargetInfluences:[0]});
}}));
const r=inspectMorphTextureBudget({children:roots},{capabilities:{maxTextureSize:16384}});
assert.equal(r.uniqueMorphGeometries,3);
assert.equal(r.exactDuplicateGroups.length,1);
assert.equal(r.exactDuplicateGroups[0].count,2);
assert.equal(r.exactDuplicateGroups[0].verifiedByteEqual,true);
assert.equal(r.possibleDuplicateShapes.length,1);
assert.notEqual(g1,g2);
assert.equal(g1.morphAttributes.position[0].array[2],0);
console.log('R192_UNIT_TRACE_AND_EXACT_DUPLICATE_GUARD_PASS',
  JSON.stringify({tracked:early.trackedLive,alloc3D:early.arrayAllocations3D,
   morphGeometries:r.uniqueMorphGeometries,exactGroupCount:r.exactDuplicateGroups.length}));
