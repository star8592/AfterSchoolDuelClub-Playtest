/**
 * R133: research-only SOURCE outsole contact, for the actual Blender Studio
 * weighted SkinnedMesh shoes. No fake foot joints, proxies or physics changes.
 *
 * Read the two real outsole meshes AFTER source animation, hit, lunge and
 * rotation. The lowest of the original outsole submeshes is the current contact
 * candidate; if it is below the ARENA plane, make the minimal positive Y
 * correction needed for contact. An above-ground hop remains untouched.
 * The relative height difference between outsole submeshes is preserved.
 * Each game frame reconstructs the base board pose; correction never accrues.
 *
 * Do not activate on default R97 or the chef; strict explicit QA opt-in only.
 */
const OUTSOLES=Object.freeze({
 E03:['Data_GEO-ellie_boots_5','Data_GEO-ellie_boots_6'],
 G03:['Data_GEO-jay_shoes_base_1','Data_GEO-jay_shoes_base_2'],
 T04:['Data_GEO-rex_shoes_1','Data_GEO-rex_shoes_2']
});
// R142: source Rex's genuine weighted-hip defensive brace can briefly
// place the author-made outsole a little deeper than 0.082. Preserve
// a per-actor finite cap and report actual cap usage; no accumulating rise.
const MAX_LIFT=Object.freeze({E03:.082,G03:.082,T04:.105});
const FLOOR_CLEARANCE=.0005;
export function createR133SourceShoeContact(THREE,actor,id){
 const expected=OUTSOLES[id];
 if(!expected||!actor?.userData?.r61?.r132BakedRestOriginalSource)
  throw Error('R133 cannot ground a non-R132 original actor '+id);
 const seen=new Map();
 actor.traverse(o=>{
  if(!o.isSkinnedMesh)return;
  for(const name of expected)if(o.name===name){
   if(seen.has(name))throw Error('R133 duplicate real source outsole '+name);
   seen.set(name,o);
  }
 });
 if(expected.some(name=>!seen.has(name)))
  throw Error('R133 original source outsole missing '+id+' '+expected.filter(n=>!seen.has(n)));
 const shoes=expected.map(name=>seen.get(name));
 const tempBox=new THREE.Box3();
 let frames=0,corrections=0,maxPenetrationBefore=0,
  maxAfterPenetration=0,maxAppliedLift=0,maxFootSeparation=0,last=null;
 const sample=()=>{
  actor.updateMatrixWorld(true);
  return shoes.map(o=>{
   o.computeBoundingBox();
   if(!o.boundingBox||o.boundingBox.isEmpty())throw Error('R133 empty original outsole '+o.name);
   tempBox.copy(o.boundingBox).applyMatrix4(o.matrixWorld);
   return tempBox.min.y;
  });
 };
 function apply(){
  const before=sample();
  if(before.some(v=>!Number.isFinite(v)))throw Error('R133 nonfinite source sole '+id);
  const min=Math.min(...before);
  // A finite vertical correction in source scene units, with no motion
  // toward the ground while an intentional hop has both feet airborne.
  const limit=MAX_LIFT[id];
  const lift=min<FLOOR_CLEARANCE?Math.min(limit,FLOOR_CLEARANCE-min):0;
  if(lift>0){
   actor.position.y+=lift;
   actor.updateMatrixWorld(true);
   corrections++;
  }
  const after=sample();
  const support=after.indexOf(Math.min(...after));
  const minimum=Math.min(...after);
  frames++;
  maxPenetrationBefore=Math.max(maxPenetrationBefore,Math.max(0,-min));
  maxAfterPenetration=Math.max(maxAfterPenetration,Math.max(0,-minimum));
  maxAppliedLift=Math.max(maxAppliedLift,lift);
  maxFootSeparation=Math.max(maxFootSeparation,Math.abs(after[0]-after[1]));
  const report={actor:id,source:'two_original_weighted_skinned_outsoles',
   shoes:expected,
   before:before.map(v=>+v.toFixed(5)),
   after:after.map(v=>+v.toFixed(5)),
   appliedLift:+lift.toFixed(5),
   selectedSupport:expected[support],
   intentionalAirborne:min>=FLOOR_CLEARANCE,
   corrected:lift>0,correctionLimit:limit,clamped:lift>=limit-.00001};
  last=report;
  return report;
 }
 return{apply,inspect:()=>({
  enabled:true,actor:id,source:'two_original_weighted_skinned_outsoles',
  shoes:expected,frames,corrections,correctionLimit:MAX_LIFT[id],
  maxPenetrationBefore:+maxPenetrationBefore.toFixed(5),
  maxAfterPenetration:+maxAfterPenetration.toFixed(5),
  maxAppliedLift:+maxAppliedLift.toFixed(5),
  maxFootSeparation:+maxFootSeparation.toFixed(5),last
 })};
}
