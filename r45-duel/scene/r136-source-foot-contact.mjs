/**
 * Four per-actor original skin mesh floor-contact probes.
 * Uses the actual source SkinnedMesh posed bounding boxes, not invented
 * collider shoes, dummy joints, or replacement GLBs.
 */
const FOOT_SKINS=Object.freeze({
 E04:['GEO-phil_body','GEO-phil_pants'],
 G02:['GEO-snow-shoes_bottom','GEO-snow-shoes_base'],
 G04:['GEO-victoria_boots'],
 T03:['GEO-rain-shoes_1','GEO-rain-shoes_2','GEO-rain-shoes_3','GEO-rain-shoes_4']
});
const MAX_CORRECTION=.082;
const CLEAR=.0005;
const canonical=x=>String(x||'').toLowerCase().replace(/[^a-z0-9]/g,'');
export function createR136OriginalFootContact(THREE,root,id){
 const expected=FOOT_SKINS[id];
 if(!expected||!root?.userData?.r61?.r119Skin)
  throw Error('R136 floor probe only permitted on original weighted cast '+id);
 const found=new Map();
 root.traverse(o=>{
  if(!o.isSkinnedMesh)return;
  // GLTFLoader preserves the source GEO suffix, but some Blender 5 exports
  // prepend Data_ to the mesh node; never use a generic mesh fallback.
  const authored=expected.find(n=>canonical(o.name)===canonical(n)||
   canonical(o.name)===canonical('Data_'+n));
  if(authored){
   if(found.has(authored))throw Error('R136 duplicate original foot skin '+id+'/'+authored);
   found.set(authored,o);
  }
 });
 const missing=expected.filter(n=>!found.has(n));
 if(missing.length){
  const available=[];root.traverse(o=>{if(o.isSkinnedMesh)available.push(o.name)});
  throw Error('R136 cannot access exact original lower skin '+id+'/'+missing+
   '; actual weighted source '+JSON.stringify(available));
 }
 const meshes=expected.map(n=>found.get(n));
 const bbox=new THREE.Box3();
 let frames=0,corrections=0,maxBefore=0,maxAfter=0,maxApplied=0,
  maxGap=0,last=null;
 const sample=()=>{
  root.updateMatrixWorld(true);
  return meshes.map(o=>{
   o.computeBoundingBox();
   if(!o.boundingBox||o.boundingBox.isEmpty())
    throw Error('R136 empty original skinned footwear '+id+'/'+o.name);
   bbox.copy(o.boundingBox).applyMatrix4(o.matrixWorld);
   return bbox.min.y;
  });
 };
 function apply(){
  const before=sample();
  if(before.some(x=>!Number.isFinite(x)))throw Error('R136 invalid skin floor '+id);
  const below=Math.min(...before),raise=below<CLEAR?Math.min(MAX_CORRECTION,CLEAR-below):0;
  if(raise>0){
   root.position.y+=raise;root.updateMatrixWorld(true);corrections++;
  }
  const after=sample(),min=Math.min(...after);
  frames++;
  maxBefore=Math.max(maxBefore,Math.max(0,-below));
  maxAfter=Math.max(maxAfter,Math.max(0,-min));
  maxApplied=Math.max(maxApplied,raise);
  maxGap=Math.max(maxGap,Math.max(...after)-Math.min(...after));
  last={actor:id,skins:expected,before:before.map(x=>+x.toFixed(5)),
   after:after.map(x=>+x.toFixed(5)),raise:+raise.toFixed(5),
   supportedMesh:expected[after.indexOf(min)],
   remainingPenetration:+Math.max(0,-min).toFixed(5),
   correctionClamped:raise>=MAX_CORRECTION-.00001};
  return last;
 }
 return{apply,inspect:()=>({enabled:true,actor:id,
  kind:id==='E04'?'actual_full_body_and_pants_lower_hem':
   'original_weighted_shoe_or_boot_geometry',
  source:'actual_original_rendered_skinned_lower_mesh',
  skins:meshes.map(x=>x.name),frames,corrections,maxBefore:+maxBefore.toFixed(5),
  maxAfter:+maxAfter.toFixed(5),maxApplied:+maxApplied.toFixed(5),
  maxSampleGap:+maxGap.toFixed(5),last})};
}
