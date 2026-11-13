/**
 * R126: real M01 skinned-bone acting. Keeps the licensed original glTF
 * model, Idle/Walk/Run, 31 source joints and all real bound vertices intact.
 * Motion clips are ADDITIVE to source Idle, not mannequin/proxy replacements.
 * No HP, combat rule, or original art mutations.
 */
const PROFILES=Object.freeze({
 R126_M01_Conduct:{duration:3.0,tempo:1,angles:{
  RightArm:[[0,0,0],[-.10,0,-.28],[-.28,0,-.46],[-.02,0,.10],[0,0,0]],
  RightForeArm:[[0,0,0],[-.12,0,.02],[-.32,0,.08],[.04,0,.05],[0,0,0]],
  LeftArm:[[0,0,0],[-.05,0,.12],[-.12,0,.22],[.05,0,-.19],[0,0,0]],
  LeftForeArm:[[0,0,0],[.13,0,0],[.23,0,-.04],[-.10,0,0],[0,0,0]],
  Spine2:[[0,0,0],[.025,-.035,0],[.04,.028,0],[-.015,.02,0],[0,0,0]],
  Neck:[[0,0,0],[.025,-.04,0],[-.08,.02,0],[.05,.03,0],[0,0,0]]
 }},
 R126_M01_Order:{duration:1.8,angles:{
  RightArm:[[0,0,0],[-.23,0,-.38],[-.43,.05,-.78],[-.34,.03,-.63],[0,0,0]],
  RightForeArm:[[0,0,0],[-.15,0,.04],[-.56,0,.10],[-.28,0,.06],[0,0,0]],
  LeftArm:[[0,0,0],[-.11,0,.18],[-.25,0,.31],[-.22,0,.16],[0,0,0]],
  LeftForeArm:[[0,0,0],[.14,0,0],[.29,0,.08],[.10,0,.04],[0,0,0]],
  Spine2:[[0,0,0],[-.06,.03,0],[-.15,.09,-.04],[-.12,.06,0],[0,0,0]],
  Head:[[0,0,0],[.03,.07,0],[-.09,.12,0],[-.06,.09,0],[0,0,0]],
  Neck:[[0,0,0],[-.03,0,0],[-.07,.045,0],[-.04,.03,0],[0,0,0]]
 }},
 R126_M01_Shocked:{duration:1.05,angles:{
  RightArm:[[0,0,0],[.08,0,-.16],[.20,0,-.43],[.06,0,-.12],[0,0,0]],
  LeftArm:[[0,0,0],[.06,0,.19],[.19,0,.44],[.05,0,.13],[0,0,0]],
  RightForeArm:[[0,0,0],[.16,0,0],[.35,0,.04],[.13,0,0],[0,0,0]],
  LeftForeArm:[[0,0,0],[.14,0,0],[.32,0,0],[.12,0,0],[0,0,0]],
  Spine2:[[0,0,0],[.11,0,0],[.18,0,-.04],[.055,0,0],[0,0,0]],
  Head:[[0,0,0],[.11,0,0],[.26,0,.04],[.08,0,0],[0,0,0]]
 }},
 R126_M01_Cheer:{duration:1.55,angles:{
  RightArm:[[0,0,0],[-.28,0,-.33],[-.64,0,-.65],[-.33,0,-.26],[0,0,0]],
  LeftArm:[[0,0,0],[-.23,0,.32],[-.60,0,.65],[-.27,0,.24],[0,0,0]],
  RightForeArm:[[0,0,0],[-.18,0,.1],[-.30,0,.18],[-.10,0,.07],[0,0,0]],
  LeftForeArm:[[0,0,0],[-.17,0,-.08],[-.30,0,-.18],[-.10,0,-.06],[0,0,0]],
  Spine2:[[0,0,0],[-.06,0,0],[-.13,0,0],[-.045,0,0],[0,0,0]],
  Head:[[0,0,0],[-.05,0,0],[-.11,0,0],[-.025,0,0],[0,0,0]]
 }}
});
export const R126_TEACHER_ACTION_NAMES=Object.freeze(Object.keys(PROFILES));
export function createR126MusicTeacherClips(THREE,instance){
 const linked=new Set();
 instance.traverse(o=>{if(o.isSkinnedMesh)for(const bone of o.skeleton?.bones||[])linked.add(bone)});
 const named=new Map([...linked].map(x=>[x.name,x]));
 const essentials=['RightArm','RightForeArm','LeftArm','LeftForeArm','Spine2','Head'];
 if(essentials.some(n=>!named.get(n)?.isBone))
  throw Error('R126_M01 must animate SOURCE visible weighted joints: '+essentials.filter(n=>!named.has(n)).join(','));
 const clips=Object.entries(PROFILES).map(([name,spec])=>{
  const t=Array.from({length:5},(_,i)=>spec.duration*i/4);
  const tracks=Object.entries(spec.angles).map(([boneName,angles])=>{
   const bone=named.get(boneName);
   if(!bone)throw Error('R126_M01 missing linked bone '+boneName);
   const values=[];
   for(const [x,y,z] of angles){
    const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(x,y,z,'XYZ'));
    values.push(q.x,q.y,q.z,q.w);
   }
   return new THREE.QuaternionKeyframeTrack(bone.uuid+'.quaternion',t,values);
  });
  return new THREE.AnimationClip(name,spec.duration,tracks);
 });
 return{clips,sourceBones:linked.size,sourceSkinnedMeshes:(()=>{
  let total=0;instance.traverse(x=>{if(x.isSkinnedMesh)total++});return total;
 })(),tracked:named};
}
