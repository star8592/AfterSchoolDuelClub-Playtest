/**
 * R68: reach targets using the actual VRM shoulder→elbow→wrist two-bone rig.
 * A shoulder-roll alone leaves arms in the recognizable open-A bind shape.
 * The hand targets and elbow poles produce readable, character-specific
 * silhouettes without fake arm meshes, rig edits, or camera-facing cheats.
 */
export const VRM_HERO_POSES=Object.freeze({
 E01:{name:'护住邮差包·俏皮挥手',
   idle:{R:[-.075,-.15,-.235],L:[-.17,-.275,-.07]},
   entrance:{R:[.24,.21,-.145],L:[-.085,-.165,-.18]},
   beat:{R:[.28,.20,-.17],L:[-.065,-.16,-.18]},
   pole:{R:[1,-.25,.35],L:[-1,-.34,.24]}},
 G01:{name:'托腮思考·一手叉腰',
   idle:{R:[.025,.24,-.205],L:[-.22,-.345,-.075]},
   entrance:{R:[.22,.265,-.18],L:[-.075,-.15,-.245]},
   beat:{R:[.20,.24,-.18],L:[-.12,-.21,-.205]},
   pole:{R:[1,-1,.42],L:[-1,-.35,.2]}}
});
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

export function createVrmTwoBonePose(THREE,model,id){
 const profile=VRM_HERO_POSES[id];if(!profile)return null;
 const root=model;
 const chest=model.getObjectByName('J_Bip_C_Chest');
 if(!chest)throw Error('R68 missing source chest joint for '+id);
 const arms={};
 for(const side of ['R','L']){
  const prefix='J_Bip_'+side+'_';
  const upper=model.getObjectByName(prefix+'UpperArm'),lower=model.getObjectByName(prefix+'LowerArm'),hand=model.getObjectByName(prefix+'Hand');
  if(!upper?.isBone||!lower?.isBone||!hand?.isBone)
   throw Error(`R68 missing ${side} original two-bone skeleton`);
  arms[side]={upper,lower,hand};
 }
 const vec=()=>new THREE.Vector3();
 const rootQ=new THREE.Quaternion(),parentQ=new THREE.Quaternion(),boneQ=new THREE.Quaternion();
 const from=vec(),to=vec(),wrist=vec(),wish=vec(),targetPoint=vec(),out=vec(),direction=vec(),pole=vec(),rel=vec(),elbowTarget=vec(),newElbow=vec(),newWrist=vec();
 const delta=new THREE.Quaternion(),qWorld=new THREE.Quaternion();
 const report={R:{},L:{}};
 const chestP=vec();
 function rotateBoneToward(bone,oldDirection,desiredDirection){
  if(oldDirection.lengthSq()<1e-8||desiredDirection.lengthSq()<1e-8)return;
  oldDirection.normalize();desiredDirection.normalize();
  delta.setFromUnitVectors(oldDirection,desiredDirection);
  bone.getWorldQuaternion(boneQ);
  qWorld.copy(delta).multiply(boneQ);
  bone.parent.getWorldQuaternion(parentQ);
  bone.quaternion.copy(parentQ.invert().multiply(qWorld));
  bone.updateWorldMatrix(true,false);
 }
 function solveSingle(side,target,polePreference){
  const {upper,lower,hand}=arms[side];
  root.updateWorldMatrix(true,false);
  upper.getWorldPosition(from);lower.getWorldPosition(to);hand.getWorldPosition(wrist);
  const a=from.distanceTo(to),b=to.distanceTo(wrist);
  // A hand must remain physically reachable. Clamp targets instead of
  // stretching/reshaping the original bone lengths.
  wish.copy(target).sub(from);
  const wantDistance=wish.length();
  if(wantDistance<1e-6)return;
  direction.copy(wish).normalize();
  const length=clamp(wantDistance,Math.abs(a-b)+.018,a+b-.015);
  const axial=(a*a-b*b+length*length)/(2*length);
  const radial=Math.sqrt(Math.max(0,a*a-axial*axial));
  pole.copy(polePreference).addScaledVector(direction,-polePreference.dot(direction));
  if(pole.lengthSq()<.001)pole.set(side==='R'?1:-1,0,.2).addScaledVector(direction,-direction.x);
  pole.normalize();
  elbowTarget.copy(from).addScaledVector(direction,axial).addScaledVector(pole,radial);
  out.copy(to).sub(from);rel.copy(elbowTarget).sub(from);
  rotateBoneToward(upper,out,rel);
  lower.getWorldPosition(newElbow);hand.getWorldPosition(newWrist);
  out.copy(newWrist).sub(newElbow);rel.copy(target).sub(newElbow);
  rotateBoneToward(lower,out,rel);
  hand.getWorldPosition(newWrist);
  report[side]={error:Number(newWrist.distanceTo(target).toFixed(4)),
   elbowOut:Number(Math.abs(newElbow.x-from.x).toFixed(3)),
   reach:Number(wantDistance.toFixed(3)),segmentLength:Number((a+b).toFixed(3)),
   hand:[newWrist.x,newWrist.y,newWrist.z].map(x=>Number(x.toFixed(3)))};
 }
 function apply(kind='idle',blend=1){
  const target=profile[kind]||profile.idle;
  root.getWorldQuaternion(rootQ);
  chest.getWorldPosition(chestP);
  for(const side of ['R','L']){
   const base=profile.idle[side],special=target[side];
   rel.set(...base).lerp(new THREE.Vector3(...special),clamp(blend,0,1));
   targetPoint.copy(rel).applyQuaternion(rootQ).add(chestP);
   pole.set(...profile.pole[side]).applyQuaternion(rootQ);
   solveSingle(side,targetPoint,pole);
  }
 }
 return{apply,inspect:()=>({name:profile.name,
   arms:{R:{...report.R},L:{...report.L}}})};
}
