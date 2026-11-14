/** R144 genuine weighted Rex pelvis, original R132 mesh reweighted in PILOT GLB.
 * Requires R143 real trunk & R128 original legs. Original R132 and R97 intact.
 */
const norm=x=>String(x||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const PROFILE=Object.freeze({
 'R119_Skeletal_Idle':[
  [0,0],[.25,-.011],[.5,.01],[.75,-.008],[1,0]],
 'R119_Skeletal_Attack':[
  [0,0],[.20,-.04],[.48,-.09],[.75,-.028],[1,0]],
 'R119_Skeletal_Hit':[
  [0,0],[.2,.045],[.45,.105],[.74,.038],[1,0]],
 'R119_Skeletal_Walk':[
  [0,0],[.25,-.06],[.5,.06],[.75,-.055],[1,0]],
 'R119_Skeletal_Challenge':[
  [0,0],[.25,-.022],[.50,-.07],[.75,-.022],[1,0]],
 'R119_Skeletal_Worry':[
  [0,0],[.25,.045],[.5,.085],[.75,.034],[1,0]],
 'R119_Skeletal_Celebrate':[
  [0,0],[.25,-.04],[.50,.065],[.75,.028],[1,0]]
});
const lerp=(curve,t)=>{
 for(let i=1;i<curve.length;i++)if(t<=curve[i][0]){
  const [t0,v0]=curve[i-1],[t1,v1]=curve[i];
  return v0+(v1-v0)*(t-t0)/(t1-t0);
 }
 return curve.at(-1)[1];
};
export function createR144GenuineRexPelvis(THREE,instance){
 const bones=new Map(),skinned=[];
 instance.traverse(node=>{
  if(node.isBone){
   const name=norm(node.name);
   if(bones.has(name))throw Error('R144 duplicated original joint '+name);
   bones.set(name,node);
  }
  if(node.isSkinnedMesh)skinned.push(node);
 });
 const find=name=>{
  const b=bones.get(norm(name));
  if(!b?.isBone)throw Error('R144 original Rex joint missing '+name);
  return b;
 };
 const hip=find('DEF-Hips'),spine=find('DEF-Spine'),
  left=find('DEF-Thigh1.L'),right=find('DEF-Thigh1.R');
 if(hip.children.length!==0||hip.parent!==spine.parent||
    hip.parent!==left.parent||hip.parent!==right.parent)
  throw Error('R144 unrecognized original Rex flat hip/rest hierarchy');
 const samples=[],observed=new Set();
 let genuineHipInfluences=0,highHipInfluences=0;
 for(const mesh of skinned){
  const ib=mesh.skeleton.bones.indexOf(hip);
  const aw=mesh.geometry.attributes.skinWeight;
  const aj=mesh.geometry.attributes.skinIndex;
  if(ib<0||!aj||!aw)continue;
  let got=null;
  for(let v=0;v<aj.count;v++){
   for(let k=0;k<4;k++)if(aj.getComponent(v,k)===ib&&
    aw.getComponent(v,k)>=.00001){
    genuineHipInfluences++;
    if(aw.getComponent(v,k)>=.2)highHipInfluences++;
    if(!got&&aw.getComponent(v,k)>=.60)
     got={mesh,vertex:v,weight:aw.getComponent(v,k),source:'hips'};
   }
  }
  if(got&&(/rexbelt|rexshorts|rexbeltbuckle/i.test(norm(mesh.name)))){
   if(!observed.has(mesh.uuid)){samples.push(got);observed.add(mesh.uuid);}
  }
 }
 if(genuineHipInfluences<5000||highHipInfluences<4700||samples.length<2)
  throw Error('R144 source Rex pelvis is not actually weighted '+genuineHipInfluences+'/'+highHipInfluences+'/'+samples.length);
 // Also sample the real original chest and thigh vertices: skinning must
 // remain unchanged after parent restoration, not just the pelvis vertices.
 for(const target of [spine,left,right]){
  let found=null;
  for(const mesh of skinned){
   const boneIndex=mesh.skeleton.bones.indexOf(target);
   const inds=mesh.geometry.attributes.skinIndex;
   const weights=mesh.geometry.attributes.skinWeight;
   if(boneIndex<0||!inds||!weights)continue;
   for(let i=0;i<inds.count&&!found;i++)for(let k=0;k<4;k++){
    if(inds.getComponent(i,k)===boneIndex&&weights.getComponent(i,k)>.40){
     found={mesh,vertex:i,weight:weights.getComponent(i,k),
      source:target.name};break;
    }
   }
   if(found)break;
  }
  if(!found)throw Error('R144 no actual source weighted vertex '+target.name);
  samples.push(found);
 }
 const pos=new THREE.Vector3();
 const read=()=>samples.map(s=>{
  pos.fromBufferAttribute(s.mesh.geometry.attributes.position,s.vertex);
  s.mesh.applyBoneTransform(s.vertex,pos);
  return pos.clone();
 });
 instance.updateMatrixWorld(true);
 const before=read(),changed=[];
 for(const child of [spine,left,right]){
  const prior=child.getWorldPosition(new THREE.Vector3());
  hip.attach(child);
  instance.updateMatrixWorld(true);
  const drift=prior.distanceTo(child.getWorldPosition(new THREE.Vector3()));
  if(drift>2e-5)throw Error('R144 detached Rex original source rest '+child.name+'/'+drift);
  changed.push({child:child.name,parent:hip.name,maxJointRestDrift:drift});
 }
 const after=read();
 const maxSkinRestDrift=Math.max(...after.map((v,i)=>v.distanceTo(before[i])),0);
 if(maxSkinRestDrift>2e-4)throw Error('R144 original Rex source mesh bind drift '+maxSkinRestDrift);
 const rest=hip.quaternion.clone();
 const pivotSamples=samples.filter(x=>x.source==='hips');
 const start=pivotSamples.map(s=>{
  pos.fromBufferAttribute(s.mesh.geometry.attributes.position,s.vertex);
  s.mesh.applyBoneTransform(s.vertex,pos);return pos.clone();
 });
 let maxHipAngle=0,maxWeightedHipVertexTravel=0,frames=0;
 const buildClips=(clips)=>{
  if(!Array.isArray(clips)||clips.length!==7)
   throw Error('R144 Rex seven original animation clips absent');
  return clips.map(clip=>{
   const curve=PROFILE[clip.name];
   if(!curve||clip.tracks.length!==16)
    throw Error('R144 Rex expected sixteen genuine source tracks '+clip.name+'/'+clip.tracks.length);
   const t=clip.tracks[0].times,values=[];
   for(const ti of t){
    const theta=lerp(curve,Math.min(1,Math.max(0,ti/clip.duration)));
    const q=rest.clone().multiply(new THREE.Quaternion()
     .setFromEuler(new THREE.Euler(theta,0,theta*.21,'XYZ')));
    values.push(q.x,q.y,q.z,q.w);
   }
   const track=new THREE.QuaternionKeyframeTrack(hip.uuid+'.quaternion',t,values);
   return new THREE.AnimationClip(clip.name,clip.duration,[...clip.tracks,track]);
  });
 };
 const update=()=>{
  frames++;
  maxHipAngle=Math.max(maxHipAngle,rest.angleTo(hip.quaternion));
  for(let i=0;i<pivotSamples.length;i++){
   const s=pivotSamples[i];
   pos.fromBufferAttribute(s.mesh.geometry.attributes.position,s.vertex);
   s.mesh.applyBoneTransform(s.vertex,pos);
   maxWeightedHipVertexTravel=Math.max(maxWeightedHipVertexTravel,
    pos.distanceTo(start[i]));
  }
 };
 const inspect=()=>({
  enabled:true,actor:'T04',source:'original_weighted_source_rex_pelvis',
  originalR132MeshUnchanged:true,
  originalHip:hip.name,originalSkinJoint:hip.name,
  highWeightSourceVertices:highHipInfluences,
  sourceVerticesWithNonzeroPelvisWeight:genuineHipInfluences,
  sourceHipSampleMeshes:pivotSamples.map(s=>s.mesh.name),
  maxRestSkinVertexDrift:maxSkinRestDrift,
  sourceChildLinks:changed,
  maxHipRotation:+maxHipAngle.toFixed(5),
  maxWeightedPelvisVertexTravel:+maxWeightedHipVertexTravel.toFixed(5),
  sourceAnimationTracks:17,
  frames
 });
 return{buildClips,update,inspect};
}
