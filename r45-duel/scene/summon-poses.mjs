/**
 * R65 — natural relaxed poses for the actual Gobkit humanoid GLB skeletons.
 * No geometry replacements, proxy arms, mesh edits or gameplay state changes.
 * GLB joints have exporter-generated random names, so identify shoulder pairs
 * by their shared chest topology and the lateral elbow bind vectors.
 */
const RELAXED_HUMANS=Object.freeze({
 E03:{positive:[.26,-.89,.36,.35],negative:[-.37,-.79,.45,.48]}, // playful class captain
 E04:{positive:[.31,-.89,.30,.28],negative:[-.28,-.84,.47,.48]}, // courier
 G02:{positive:[.23,-.86,.44,.55],negative:[-.29,-.92,.27,.23]}, // thinking expert
 G03:{positive:[.28,-.83,.48,.43],negative:[-.28,-.84,.45,.46]}, // lab student
 G04:{positive:[.28,-.95,.23,.18],negative:[-.37,-.78,.49,.55]}, // director
 T03:{positive:[.28,-.86,.44,.53],negative:[-.29,-.92,.28,.22]}, // mail courier
 T04:{positive:[.23,-.96,.20,.20],negative:[-.34,-.82,.42,.40]}  // guard
});
export const RELAXED_POSE_IDS=Object.freeze(Object.keys(RELAXED_HUMANS));

export function createSummonPose(THREE,instance,id){
 const profile=RELAXED_HUMANS[id];
 if(!profile)return null;
 const bones=new Set();
 instance.traverse(o=>{if(o.isSkinnedMesh)for(const bone of o.skeleton.bones)bones.add(bone)});
 const boneChild=o=>o.children.filter(x=>x.isBone&&bones.has(x));
 const pairs=[];
 for(const chest of bones){
  const candidates=boneChild(chest).map(shoulder=>{
   const elbow=boneChild(shoulder)[0];
   if(!elbow||boneChild(shoulder).length!==1)return null;
   const d=elbow.position;
   // Leg children descend in bind space; arms extend laterally.
   if(Math.abs(d.x)<Math.max(Math.abs(d.y),Math.abs(d.z))*.90)return null;
   const side=Math.sign(d.x);
   return side?{shoulder,elbow,side,source:d.clone().normalize()}:null;
  }).filter(Boolean);
  if(candidates.length===2&&candidates[0].side!==candidates[1].side)
   pairs.push(candidates);
 }
 if(pairs.length!==1)throw Error(`R65 ${id}: expected one anatomically identified arm pair; got ${pairs.length}`);
 const arms=pairs[0];
 for(const a of arms){
  const cfg=profile[a.side>0?'positive':'negative'];
  a.target=new THREE.Quaternion().setFromUnitVectors(a.source,new THREE.Vector3(...cfg.slice(0,3)).normalize());
  a.bend=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),-a.side*cfg[3]);
  a.animatedTarget=a.target.clone();
 }
 const from=new THREE.Vector3(),to=new THREE.Vector3();
 const swayAxis=new THREE.Vector3(0,0,1),sway=new THREE.Quaternion();
 let weight=1,frame=0,seconds=0;
 function apply(delta,kind){
  const aim=kind==='idle'?1:0;
  seconds+=Math.max(0,delta);
  weight+= (aim-weight)*(1-Math.exp(-Math.max(0,delta)*11));
  for(const arm of arms){
   // Breathing-scale asymmetry only; never turn resting arms into a salute.
   const breathing=.018*Math.sin(seconds*1.2+arm.side*.85);
   sway.setFromAxisAngle(swayAxis,breathing);
   arm.animatedTarget.copy(arm.target).multiply(sway);
   arm.shoulder.quaternion.slerp(arm.animatedTarget,weight);
   // Preserve original author animation on attacks; add a modest idle elbow
   // bend only to the native idle pose for a relaxed non-T stance.
   const relaxedForearm=arm.elbow.quaternion.clone().multiply(arm.bend);
   arm.elbow.quaternion.slerp(relaxedForearm,weight);
  }
  frame++;
 }
 function inspect(){
  const measures=arms.map(a=>{
   a.shoulder.getWorldPosition(from);a.elbow.getWorldPosition(to);
   const distance=Math.max(.001,from.distanceTo(to));
   return {side:a.side,drop:Number(((to.y-from.y)/distance).toFixed(3)),
    spread:Number((Math.abs(to.x-from.x)/distance).toFixed(3))};
  });
  return {weight:Number(weight.toFixed(3)),frames:frame,arms:measures};
 }
 function reset(){weight=1;seconds=0;}
 return{apply,inspect,reset};
}
