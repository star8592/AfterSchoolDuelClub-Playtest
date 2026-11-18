/**
 * R167 QA-only physically identical spell PointLight slots.
 *
 * At rest the slots remain in the 3D scene with intensity=0. This avoids
 * changing point-light shader counts when up to N spell lights are active,
 * but creates a measurable NONZERO idle GPU cost because Three.js counts
 * visible 0-intensity lights in shader permutations. Never production
 * enable without proof that the tradeoff is worthwhile.
 */
export function createR167SpellLightSlots(THREE,scene,count=2){
 if(![2,4].includes(count))throw Error('R167 supports QA slots 2 or 4 only');
 const root=new THREE.Group();
 root.name='R167_QA_SPELL_LIGHT_SLOTS';
 scene.add(root);
 const slots=[];
 let hits=0,misses=0,leases=0,peak=0,overflow=0,disposed=false;
 for(let i=0;i<count;i++){
  const light=new THREE.PointLight('#ffffff',0,5,2);
  light.name='R167_QA_SPELL_POINT_SLOT_'+i;
  light.userData.r167PoolSlot=i;
  light.position.set(0,0,0);
  root.add(light);
  slots.push({light,inUse:false});
 }
 function acquire(parent,color,x,y,z,distance=3,decay=2){
  if(disposed)throw Error('R167 light slots already disposed');
  const slot=slots.find(s=>!s.inUse);
  if(!slot){
   overflow++;misses++;
   const fallback=new THREE.PointLight(color,0,distance,decay);
   fallback.position.set(x,y,z);
   parent.add(fallback);
   return fallback;
  }
  slot.inUse=true;leases++;hits++;
  slot.light.color.set(color);
  slot.light.intensity=0;
  slot.light.distance=distance;
  slot.light.decay=decay;
  slot.light.castShadow=false;
  slot.light.position.set(x,y,z);
  parent.add(slot.light);
  peak=Math.max(peak,slots.filter(s=>s.inUse).length);
  return slot.light;
 }
 function release(light){
  if(!light)return;
  const slot=slots.find(s=>s.light===light);
  if(!slot){
   // Fallback light was never pooled and is removed with its parent.
   return;
  }
  if(!slot.inUse)throw Error('R167 double-release '+light.name);
  light.intensity=0;
  root.add(light);
  light.position.set(0,0,0);
  slot.inUse=false;
 }
 function dispose(){
  if(disposed)return;
  if(slots.some(s=>s.inUse))throw Error('R167 cannot dispose leased lights');
  for(const slot of slots)slot.light.removeFromParent();
  root.removeFromParent();
  disposed=true;
 }
 return {acquire,release,dispose,
  get stats(){return {
   enabled:true,slots:count,hits,misses,leases,peak,overflow,
   active:slots.filter(s=>s.inUse).length,
   initialIntensityAllZero:slots.every(s=>s.inUse||s.light.intensity===0),
   allSlotsInScene:slots.every(s=>!!s.light.parent),
   disposed
  }}
 };
}
