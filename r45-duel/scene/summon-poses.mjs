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
// Model-specific short comedic gestures. Angles are directions for real upper-
// arm bones; no additional objects/mesh are spawned. Values are deliberately
// bent rather than sideways T poses. Periods and offsets prevent synchronized
// military-looking movement when five allies share the field.
export const PERSONALITY_BEATS=Object.freeze({
 E03:{name:'得意地给自己加油',period:8.1,offset:5.8,
  positive:[.30,-.24,.93,.62],negative:[-.36,-.72,.58,.57]},
 E04:{name:'小心翼翼递出便当',period:9.3,offset:5.3,
  positive:[.32,-.55,.77,.58],negative:[-.27,-.84,.46,.48]},
 G02:{name:'挠头想答案',native:'Scratch',period:10.7,offset:4.3,duration:1.6},
 G03:{name:'实验失败摊手',period:8.8,offset:6.8,
  positive:[.52,-.55,.65,.78],negative:[-.51,-.55,.65,.75]},
 G04:{name:'一本正经讲计划',native:'Explain',period:9.9,offset:5.1,duration:1.8},
 T03:{name:'热情递送信封',period:8.6,offset:5.9,
  positive:[.34,-.42,.84,.67],negative:[-.41,-.79,.44,.46]},
 T04:{name:'煞有介事地敬礼',native:'Salute',period:11.4,offset:4.7,duration:1.5}
});
const softStep=v=>{const x=Math.max(0,Math.min(1,v));return x*x*(3-2*x)};

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
  const gest=PERSONALITY_BEATS[id],wanted=gest?.[a.side>0?'positive':'negative'];
  a.gestureTarget=wanted?new THREE.Quaternion().setFromUnitVectors(
   a.source,new THREE.Vector3(...wanted.slice(0,3)).normalize()):null;
  a.gestureBend=wanted?new THREE.Quaternion().setFromAxisAngle(
   new THREE.Vector3(0,0,1),-a.side*wanted[3]):null;
  a.animatedBend=a.bend.clone();
 }
 const from=new THREE.Vector3(),to=new THREE.Vector3();
 const swayAxis=new THREE.Vector3(0,0,1),sway=new THREE.Quaternion();
 let weight=1,frame=0,seconds=0,gestureAmount=0;
 function apply(delta,kind){
  const aim=kind==='idle'?1:0;
  seconds+=Math.max(0,delta);
  weight+= (aim-weight)*(1-Math.exp(-Math.max(0,delta)*11));
  const beat=PERSONALITY_BEATS[id];
  if(beat&&!beat.native&&kind==='idle'){
   const t=(seconds+beat.offset)%beat.period;
   // One readable gesture, then a long quiet idle: no constant waving.
   gestureAmount=softStep((t-1.6)/.48)*(1-softStep((t-3.25)/.62));
  }else gestureAmount=0;
  for(const arm of arms){
   const breathing=.018*Math.sin(seconds*1.2+arm.side*.85);
   sway.setFromAxisAngle(swayAxis,breathing);
   arm.animatedTarget.copy(arm.target);
   if(arm.gestureTarget)arm.animatedTarget.slerp(arm.gestureTarget,gestureAmount);
   arm.animatedTarget.multiply(sway);
   arm.shoulder.quaternion.slerp(arm.animatedTarget,weight);
   // Slight elbow bend follows the gesture, otherwise preserve its native
   // rigged idle and let the authored attack/hit clips have full control.
   arm.animatedBend.copy(arm.bend);
   if(arm.gestureBend)arm.animatedBend.slerp(arm.gestureBend,gestureAmount);
   const relaxedForearm=arm.elbow.quaternion.clone().multiply(arm.animatedBend);
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
  return {weight:Number(weight.toFixed(3)),frames:frame,arms:measures,
   gesture:PERSONALITY_BEATS[id]?.name||null,
   gestureAmount:Number(gestureAmount.toFixed(3))};
 }
 function reset(){weight=1;seconds=0;gestureAmount=0;}
 return{apply,inspect,reset,get gestureAmount(){return gestureAmount}};
}
