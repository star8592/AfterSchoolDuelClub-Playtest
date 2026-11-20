/**
 * R206 – music teacher's source-skeleton pose correction.
 * Original M01 PolyforkSchoolTeacher: ten genuinely skinned source meshes,
 * 31 true bones, three real Idle/Walk/Run clips and R126 gestures.
 *
 * The old SOURCE Idle spreads both arms nearly straight. R126's additive
 * +/-0.2 rad gestures animate the joints but cannot make an intended
 * natural rest pose out of an inherited nearly-T source animation.
 *
 * Set bounded target DIRECTIONS on the REAL upper and lower source arms,
 * computed against the current original animated shoulder -> elbow ->
 * wrist vectors AFTER original Three.AnimationMixer.update. This does
 * not mutate geometry, textures, source files or inverse bind matrices.
 * All targets are relative to the original character model, not a camera.
 */

export const R206_MODES=Object.freeze(['idle','attack','hit','walk','celebrate']);
export function createR206RealConductorPose(THREE,source,sourceBones,{
 reducedMotion=false}={}){
 const names=['LeftArm','LeftForeArm','LeftHand',
  'RightArm','RightForeArm','RightHand','Spine2','Neck','Head'];
 const joints=Object.fromEntries(names.map(name=>[name,sourceBones.get(name)]));
 if(names.some(x=>!joints[x]?.isBone))
  throw Error('R206 M01 original skinned joint absent: '+names.filter(n=>!joints[n]?.isBone));
 let meshes=0,bound=0;
 source.traverse(o=>{if(o.isSkinnedMesh){
  meshes++;
  const linked=o.skeleton?.bones||[];
  if(linked.includes(joints.RightArm)&&linked.includes(joints.LeftArm))bound++;
 }});
 if(meshes<10||bound<8)
  throw Error('R206 music teacher must have original 10 REAL skinned Blender meshes, got '+meshes+' '+bound);
 const rootQuat=new THREE.Quaternion(),inverseRoot=new THREE.Quaternion(),
  parentQuat=new THREE.Quaternion(),parentInv=new THREE.Quaternion(),
  delta=new THREE.Quaternion(),nowQuat=new THREE.Quaternion(),
  p1=new THREE.Vector3(),p2=new THREE.Vector3(),curr=new THREE.Vector3(),
  target=new THREE.Vector3(),curLocal=new THREE.Vector3(),
  destLocal=new THREE.Vector3(),tmp=new THREE.Vector3();
 const up=new THREE.Vector3(0,1,0),forward=new THREE.Vector3(0,0,1),
  identityQuat=new THREE.Quaternion();
 const sides={};
 for(const side of ['Left','Right']){
  const upper=joints[side+'Arm'],lower=joints[side+'ForeArm'],
   hand=joints[side+'Hand'];
  source.updateWorldMatrix(true,true);
  const baseline=lower.getWorldPosition(p2).sub(upper.getWorldPosition(p1));
  source.getWorldQuaternion(rootQuat);
  inverseRoot.copy(rootQuat).invert();
  const outward=baseline.clone().applyQuaternion(inverseRoot);
  outward.y=0;
  // Genuine skeleton basis; preserve artist's two different arm directions.
  if(outward.lengthSq()<.0001)outward.set(side==='Right'?1:-1,0,0);
  outward.normalize();
  sides[side]={upper,lower,hand,outward,
   upperLength:baseline.length(),
   lowerLength:hand.getWorldPosition(p2).distanceTo(lower.getWorldPosition(p1))};
 }
 let time=0,mode='idle',phase='downbeat',armFrames=0,totalCorrected=0,
  maxSourceJointAngle=0,peakWristMotion=0;
 const initialRightWrist=new THREE.Vector3();
 let wristReferenceCaptured=false;
 const stages=[],snapshots=[];
 function direction(side,elbow,down,front){
  const result=destLocal.copy(sides[side].outward).multiplyScalar(elbow)
   .addScaledVector(up,down).addScaledVector(forward,front);
  return result.normalize();
 }
 const lerp=(a,b,t)=>a+(b-a)*t;
 function rotateSourceBone(bone,child,desired,blend){
  if(blend<=0)return 0;
  bone.updateWorldMatrix(true,true);
  const a=bone.getWorldPosition(p1),b=child.getWorldPosition(p2);
  curr.copy(b).sub(a).normalize();
  source.getWorldQuaternion(rootQuat);
  // Convert desired original MODEL-space direction to world space;
  // then into the original animated bone's PARENT local frame.
  target.copy(desired).applyQuaternion(rootQuat);
  bone.parent.getWorldQuaternion(parentQuat);
  parentInv.copy(parentQuat).invert();
  curLocal.copy(curr).applyQuaternion(parentInv).normalize();
  tmp.copy(target).applyQuaternion(parentInv).normalize();
  delta.setFromUnitVectors(curLocal,tmp);
  // Bounded source real joint angular change, never 360 degree flip.
  let angle=delta.angleTo(identityQuat);
  if(!Number.isFinite(angle)||angle>Math.PI*.9)return 0;
  const limit=bone===joints.RightArm||bone===joints.LeftArm?1.36:1.20;
  if(angle>limit)delta.slerp(identityQuat,1-limit/angle);
  nowQuat.copy(bone.quaternion).premultiply(delta);
  bone.quaternion.slerp(nowQuat,blend);
  bone.updateWorldMatrix(true,true);
  return Math.min(angle,limit)*blend;
 }
 function update(dt,kind='idle'){
  if(!Number.isFinite(dt)||dt<0)return;
  time+=Math.min(.07,dt);
  mode=typeof kind==='string'?kind:'idle';
  const kindKey=mode.startsWith('R126_')?
    mode.includes('Order')?'attack':mode.includes('Shocked')?'hit':
    mode.includes('Cheer')?'celebrate':'idle':mode;
  const tick=time*(reducedMotion?.83:1);
  const lead=.5+.5*Math.sin(tick*2.35);
  const snap=.5+.5*Math.sin(tick*4.70+.35);
  const breath=.5+.5*Math.sin(tick*1.21);
  const visibleEnvelope=reducedMotion?.62:1;
  // The idle is NOT T-pose, ever: both elbows below shoulder; right hand
  // keeps time in front of the chest, left hand rests at the waist.
  let rightUp=.24,rightDown=-.81,rightFront=.48;
  let rightForearmOut=-.24,rightForearmDown=.17,rightForearmFront=.83;
  let leftUp=.19,leftDown=-.87,leftFront=.34;
  let leftForearmOut=-.22,leftForearmDown=-.33,leftForearmFront=.72;
  phase=lead>.67?'downbeat':lead<.32?'preparation':'conducting';
  if(kindKey==='idle'){
   rightUp+=.075*lead;rightDown+=.125*lead;rightFront+=.145*lead;
   rightForearmDown+=.13*snap;
   leftUp+=.045*breath;
   leftForearmDown+=.08*breath;
  }else if(kindKey==='attack'){
   rightUp=.35+.10*snap;rightDown=-.32+.15*lead;rightFront=.81+.1*lead;
   rightForearmOut=-.32;rightForearmDown=.22+.12*lead;rightForearmFront=.89;
   leftUp=.18;leftDown=-.57;leftFront=.56;
   leftForearmOut=-.32;leftForearmDown=.09;leftForearmFront=.80;
   phase=lead>.57?'fortissimo-strike':'conductor-windup';
  }else if(kindKey==='hit'){
   rightUp=.24;rightDown=-.43;rightFront=.65;
   rightForearmDown=.54;rightForearmFront=.70;
   leftUp=.24;leftDown=-.48;leftFront=.58;
   leftForearmDown=.49;leftForearmFront=.73;
   phase='shocked-guard';
  }else if(kindKey==='celebrate'){
   rightUp=.34;rightDown=.08;rightFront=.79;
   rightForearmOut=-.12;rightForearmDown=.45;rightForearmFront=.74;
   leftUp=.33;leftDown=.02;leftFront=.80;
   leftForearmOut=-.10;leftForearmDown=.44;leftForearmFront=.80;
   phase='grand-finale';
  }else if(kindKey==='walk'){
   rightUp=.16;rightDown=-.89;rightFront=.25;
   rightForearmDown=-.35;rightForearmFront=.68;
   leftUp=.18;leftDown=-.85;leftFront=.29;
   leftForearmDown=-.38;leftForearmFront=.62;
   phase='walking';
  }
  const blend=visibleEnvelope;
  // Correct the source upper arm first, then recompute original elbow
  // transformation BEFORE posing its original lower arm.
  let angle=0;
  angle=Math.max(angle,rotateSourceBone(sides.Right.upper,sides.Right.lower,
   direction('Right',rightUp,rightDown,rightFront),blend));
  angle=Math.max(angle,rotateSourceBone(sides.Right.lower,sides.Right.hand,
   direction('Right',rightForearmOut,rightForearmDown,rightForearmFront),blend));
  angle=Math.max(angle,rotateSourceBone(sides.Left.upper,sides.Left.lower,
   direction('Left',leftUp,leftDown,leftFront),blend));
  angle=Math.max(angle,rotateSourceBone(sides.Left.lower,sides.Left.hand,
   direction('Left',leftForearmOut,leftForearmDown,leftForearmFront),blend));
  maxSourceJointAngle=Math.max(maxSourceJointAngle,angle);
  armFrames++;totalCorrected+=4;
  source.updateWorldMatrix(true,true);
  const hand=sides.Right.hand.getWorldPosition(p2);
  if(!wristReferenceCaptured){
   initialRightWrist.copy(hand);wristReferenceCaptured=true;
  }
  peakWristMotion=Math.max(peakWristMotion,hand.distanceTo(initialRightWrist));
  if(stages.at(-1)!==phase){stages.push(phase);if(stages.length>24)stages.shift()}
 }
 function inspect(){
  source.updateWorldMatrix(true,true);
  const sourceQuaternion=source.getWorldQuaternion(rootQuat);
  const armObservations={};
  for(const side of ['Left','Right']){
   const o=sides[side];
   const shoulder=o.upper.getWorldPosition(p1).clone();
   const elbow=o.lower.getWorldPosition(p2).clone();
   const hand=o.hand.getWorldPosition(p2).clone();
   const dir=elbow.sub(shoulder);
   armObservations[side]={
    upperLength:+o.upperLength.toFixed(4),
    lowerLength:+o.lowerLength.toFixed(4),
    elbowBelowShoulder:+(-dir.y).toFixed(4),
    upperHorizontal:+Math.hypot(dir.x,dir.z).toFixed(4),
    dropRatio:+(-dir.y/Math.max(.0001,dir.length())).toFixed(4),
    handWorld:hand.toArray().map(x=>+x.toFixed(3))
   };
  }
  return {enabled:true,mode,phase,time:+time.toFixed(3),
   observedStages:[...stages],
   originalSkinnedMeshes:meshes,sourceMeshesStillBound:bound,
   originalSourceBones:sourceBones.size,
   armFrames,totalCorrected,maxAppliedSourceJointAngle:+maxSourceJointAngle.toFixed(4),
   peakWristMotion:+peakWristMotion.toFixed(4),
   sourceGeometryReplaced:false,sourceMaterialReplaced:false,
   externalAssets:0,newRenderPasses:0,
   arms:armObservations};
 }
 return{update,inspect};
}
