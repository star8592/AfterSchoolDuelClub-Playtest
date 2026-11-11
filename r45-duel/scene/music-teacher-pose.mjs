/**
 * M01 music-teacher candidate: real shoulder/elbow/wrist two-bone IK.
 * Does not mutate the source mesh or replace the rig with simplified geometry.
 * Reapplies natural elbow placement after original Idle animation.
 */
export function createMusicTeacherPose(THREE,model){
 const sides={
  L:['LeftArm','LeftForeArm','LeftHand',-1],
  R:['RightArm','RightForeArm','RightHand',1]
 };
 const bones={};
 for(const [side,names] of Object.entries(sides)){
  const [s,e,w,sign]=names;
  const shoulder=model.getObjectByName(s),elbow=model.getObjectByName(e),wrist=model.getObjectByName(w);
  if(!shoulder?.isBone||!elbow?.isBone||!wrist?.isBone)
   throw Error('M01 exact source arm chain missing: '+side);
  bones[side]={shoulder,elbow,wrist,sign};
 }
 const qDelta=new THREE.Quaternion(),qBone=new THREE.Quaternion(),qParent=new THREE.Quaternion();
 const p0=new THREE.Vector3(),p1=new THREE.Vector3(),p2=new THREE.Vector3();
 const direction=new THREE.Vector3(),target=new THREE.Vector3(),pole=new THREE.Vector3(),elbowGoal=new THREE.Vector3();
 const oldVec=new THREE.Vector3(),newVec=new THREE.Vector3(),axis=new THREE.Vector3();
 const last={};
 function rotate(bone,from,to){
  if(from.lengthSq()<1e-8||to.lengthSq()<1e-8)return;
  qDelta.setFromUnitVectors(from.normalize(),to.normalize());
  bone.getWorldQuaternion(qBone);qBone.premultiply(qDelta);
  bone.parent.getWorldQuaternion(qParent);bone.quaternion.copy(qParent.invert().multiply(qBone));
  bone.updateWorldMatrix(true,false);
 }
 function solveArm(side,beat=0){
  const {shoulder,elbow,wrist,sign}=bones[side];
  model.updateWorldMatrix(true,true);
  shoulder.getWorldPosition(p0);elbow.getWorldPosition(p1);wrist.getWorldPosition(p2);
  const a=p0.distanceTo(p1),b=p1.distanceTo(p2),length=a+b;
  const gesture=side==='R'?beat:0;
  // Stage directions relative to each shoulder. A readable conductor gesture
  // on the right, soft low elbow on the other side; never straight-out arms.
  target.copy(p0).add(new THREE.Vector3(sign*length*(.35+gesture*.06),
   -length*(.78-gesture*.37), -length*(.12+gesture*.12)));
  direction.copy(target).sub(p0);const desired=direction.length();direction.normalize();
  const d=THREE.MathUtils.clamp(desired,Math.abs(a-b)+.014,length-.018);
  const axial=(a*a-b*b+d*d)/(2*d),radial=Math.sqrt(Math.max(0,a*a-axial*axial));
  pole.set(sign, -.10+gesture*.25, .30+gesture*.13);
  axis.copy(pole).addScaledVector(direction,-pole.dot(direction));
  if(axis.lengthSq()<.001)axis.set(sign,0,.2);
  axis.normalize();
  elbowGoal.copy(p0).addScaledVector(direction,axial).addScaledVector(axis,radial);
  oldVec.copy(p1).sub(p0);newVec.copy(elbowGoal).sub(p0);
  rotate(shoulder,oldVec,newVec);
  elbow.getWorldPosition(p1);wrist.getWorldPosition(p2);
  oldVec.copy(p2).sub(p1);newVec.copy(target).sub(p1);
  rotate(elbow,oldVec,newVec);
  wrist.getWorldPosition(p2);
  last[side]={error:+p2.distanceTo(target).toFixed(4),
   bend:+(Math.PI-Math.acos(THREE.MathUtils.clamp((a*a+b*b-d*d)/(2*a*b),-1,1))).toFixed(3),
   wrist:p2.toArray().map(n=>+n.toFixed(3)),target:target.toArray().map(n=>+n.toFixed(3)),
   reach:+length.toFixed(3)};
 }
 function apply(beat=0){
  // After animation Mixer updates the authored Idle joints, overlay arm goals.
  for(const side of ['L','R'])solveArm(side,THREE.MathUtils.clamp(beat,0,1));
 }
 return {apply,inspect(){return {...last}},source:'Polyfork School Teacher',approved:false};
}
