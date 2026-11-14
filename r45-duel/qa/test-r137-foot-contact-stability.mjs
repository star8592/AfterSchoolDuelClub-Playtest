/** R137: deterministic four-source original-foot stability regression.
 * Unit geometry is deliberately synthetic: it validates correction math,
 * not human art approval or GPU-rendered source-mesh performance.
 */
import assert from 'node:assert/strict';
import {createR136OriginalFootContact} from '../scene/r136-source-foot-contact.mjs';

const SOURCES={
 E04:['GEO-phil_body','GEO-phil_pants'],
 G02:['GEO-snow-shoes_bottom','GEO-snow-shoes_base'],
 G04:['GEO-victoria_boots'],
 T03:['GEO-rain-shoes_1','GEO-rain-shoes_2','GEO-rain-shoes_3','GEO-rain-shoes_4']
};
class TestBox{
 constructor(){this.min={y:0}}
 copy(box){this.min.y=box.min.y;return this}
 applyMatrix4(matrix){this.min.y+=matrix.y;return this}
 isEmpty(){return false}
}
let checks=0;
for(const [id,names] of Object.entries(SOURCES)){
 const baseline=names.map(()=>0);
 const root={
  position:{y:0},userData:{r61:{r119Skin:true}},
  children:[],
  traverse(fn){fn(this);for(const node of this.children)fn(node)},
  updateMatrixWorld(){for(const node of this.children)node.matrixWorld.y=this.position.y}
 };
 names.forEach((name,i)=>root.children.push({
  name,isSkinnedMesh:true,matrixWorld:{y:0},
  boundingBox:{min:{y:0},isEmpty:()=>false},
  computeBoundingBox(){this.boundingBox.min.y=baseline[i]}
 }));
 const probe=createR136OriginalFootContact({Box3:TestBox},root,id);
 let prior=0;
 for(let frame=0;frame<1200;frame++){
  // Alternate planted/raised shoe geometry, measured on the original actor.
  // A previous one-way +=raise passes penetration tests but fails this test.
  const h=[-.056,-.028,.012,-.013,.025,-.043,.004][frame%7];
  baseline.forEach((_,i)=>baseline[i]=h+i*.006);
  const expected=Math.min(.082,Math.max(0,.0005-Math.min(...baseline)));
  const data=probe.apply();
  assert.ok(Math.abs(root.position.y-expected)<1e-7,
   id+' frame '+frame+' actor rose or failed to return to ground');
  assert.ok(Math.abs(data.delta-(expected-prior))<.00002,
   id+' frame '+frame+' incorrect HUD delta');
  assert.ok(data.remainingPenetration<=.00001,
   id+' frame '+frame+' actual lower mesh penetrates floor');
  prior=expected;checks+=3;
 }
 const end=probe.inspect();
 assert.equal(end.frames,1200);
 assert.ok(end.activeLift<.083&&end.maxApplied<.083);
 assert.ok(end.maxStepDelta<.083);
 checks+=4;
}
console.log('R137_REVERSIBLE_FOUR_ORIGINAL_SKINS_PASS',checks,
 'checks; 4 actor rigs x 1200 ground-contact frames, no accumulated rise');
