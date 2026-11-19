/**
 * R203: projectile extracted from actual authored Blender GLB actor groups.
 * Keep the machine / classroom background at caster position: only its
 * correct detachable parts fly across the wide arena. Share original
 * geometry/materials and never create a fake low-poly replacement.
 */
export const R203_NEW_SIGNATURE_IDS=Object.freeze(['K04','S08','P03','X05','Q07']);
export const R203_PROJECTILE_ACTORS=Object.freeze({
 K04:Object.freeze(['K04_CHILI_ACTOR','K04_MOONCAKE_ACTOR']),
 S08:Object.freeze(['S08_FLYING_CAN_ACTOR']),
 X05:Object.freeze(['X05_PAPER_GALAXY_ACTOR']),
 Q07:Object.freeze(['Q07_CARDBOARD_MOON_ACTOR'])
});
export function createR203AuthoredProjectile(THREE,root,props,id){
 const wanted=R203_PROJECTILE_ACTORS[id];
 if(!wanted)return null;
 const carrier=new THREE.Group();carrier.name='R203_ORIGINAL_GLB_PROJECTILE_'+id;
 const payload=new THREE.Group();carrier.add(payload);
 let meshCount=0;
 for(const name of wanted){
  const original=props.getObjectByName(name);
  if(!original||original.isMesh)throw Error('R203 missing authored Blender object group '+id+':'+name);
  const object=original.clone(true);
  // The group may be nested under the Blender-imported staged size scale.
  const originalScale=original.getWorldScale(new THREE.Vector3());
  const localScale=original.scale;
  if(localScale.x&&localScale.y&&localScale.z){
   object.scale.multiply(new THREE.Vector3(
    originalScale.x/localScale.x,
    originalScale.y/localScale.y,
    originalScale.z/localScale.z));
  }
  object.traverse(o=>{if(o.isMesh)meshCount++});
  payload.add(object);
 }
 if(meshCount<1)throw Error('R203 original detached prop has no real mesh '+id);
 root.add(carrier);
 const bbox=new THREE.Box3().setFromObject(payload,true);
 if(bbox.isEmpty()){root.remove(carrier);throw Error('R203 empty real actor geometry '+id)}
 const center=bbox.getCenter(new THREE.Vector3());
 payload.position.sub(center);
 return {carrier,payload,meshCount,names:wanted,
  originalMeshSource:true,geometryBuffersAltered:false};
}
