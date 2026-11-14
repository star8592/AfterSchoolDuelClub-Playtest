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
 const limit=id==='T03'?.13:.082;
 const root={
  position:{y:0},userData:{r61:{r119Skin:true,
   getR136CastStage:()=>({currentClip:'R119_Skeletal_Idle'})}},
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
  // Match real summon-presence: reset the glTF root Y to its authored
  // hover/pose every frame, then perform the final outsole pass.
  // Subtracting the previous lift AGAIN here creates fake penetration.
  root.position.y=0;
  // Alternate original weighted soles through planted/raised configurations.
  const h=[-.056,-.028,.012,-.013,.025,-.043,.004,id==='T03'?-.109:-.067][frame%8];
  baseline.forEach((_,i)=>baseline[i]=h+i*.006);
  const delta=.0005-Math.min(...baseline);
  const expected=delta>=0?Math.min(limit,delta):id==='G04'?Math.max(-.04,delta):0;
  const data=probe.apply();
  assert.ok(Math.abs(data.raise-expected)<.00002,
   id+' frame '+frame+' under-corrected this frame\x27s floor pose');
  assert.ok(Math.abs(root.position.y-expected)<1e-7,
   id+' frame '+frame+' actor rose or failed to return to ground');
  assert.ok(Math.abs(data.delta-(expected-prior))<.00002,
   id+' frame '+frame+' incorrect HUD delta');
  assert.ok(data.remainingPenetration<=.00001,
   id+' frame '+frame+' actual lower mesh penetrates floor');
  prior=expected;checks+=4;
 }
 const end=probe.inspect();
 assert.equal(end.frames,1200);
 assert.ok(end.activeLift<=limit+.00001&&end.maxApplied<=limit+.00001);
 assert.ok(end.maxStepDelta<=limit+.00001);
 checks+=4;
}
console.log('R139_REBASED_FOUR_ORIGINAL_SKINS_PASS',checks,
 'checks; 4 actor rigs x 1200 per-frame position resets, grounded mesh');
