import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from '../../assets/meshopt/meshopt_decoder.mjs';
import {retargetClip} from 'three/addons/utils/SkeletonUtils.js';
const canvas=document.querySelector('#screen');
const stage=document.querySelector('#stage'),status=document.querySelector('#status'),readout=document.querySelector('#readout');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.4));
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.background=new THREE.Color('#142234');
scene.fog=new THREE.Fog('#142234',14,36);
scene.add(new THREE.HemisphereLight(0xcfe5ff,0x6d7a89,2.25));
const key=new THREE.DirectionalLight(0xffefdc,3.25);key.position.set(-3,7,9);key.castShadow=true;
key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-12;key.shadow.camera.right=12;key.shadow.camera.top=12;key.shadow.camera.bottom=-12;
scene.add(key);
const rim=new THREE.DirectionalLight(0x95d8ff,2);rim.position.set(4,5,-8);scene.add(rim);
const revision=new URLSearchParams(location.search).get('revision')==='r221'?'r221':'r220';
const viewAngle=new URLSearchParams(location.search).get('camera')||'front';
const focusJay=new URLSearchParams(location.search).get('focus')==='jay';
const motionMode=new URLSearchParams(location.search).get('motion');
const kaykitLocal=motionMode==='kaykitLocal';
const kaykitTrial=motionMode==='kaykit'||kaykitLocal;
if(focusJay)document.body.classList.add('focus-jay');
if(viewAngle==='profile')document.body.classList.add('profile-view');
if(revision==='r221')document.querySelector('h1').textContent='R221｜Jay 手部正向动作 · 真实3D验收';
const camera=new THREE.PerspectiveCamera(focusJay?37:39,1,.1,80);
if(focusJay&&viewAngle==='profile'){
 camera.position.set(5.8,2.13,.95);camera.lookAt(1.6,1.26,0);
}else if(focusJay){camera.position.set(0,2.4,5.7);camera.lookAt(0,1.3,0)}
else{camera.position.set(0,3.1,18);camera.lookAt(0,1.45,0)}
const ground=new THREE.Mesh(new THREE.PlaneGeometry(26,15),new THREE.MeshStandardMaterial({color:0x293a49,roughness:.89,metalness:.08}));
ground.rotation.x=-Math.PI/2;ground.position.y=-.17;ground.receiveShadow=true;scene.add(ground);
for(const x of [-6,-3,0,3,6]){
 const base=new THREE.Mesh(new THREE.CylinderGeometry(1.04,1.15,.11,48),new THREE.MeshStandardMaterial({color:x===6?0x34675e:0x3a4a5f,metalness:.28,roughness:.43}));
 base.position.set(x,-.09,0);base.receiveShadow=true;scene.add(base);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.99,.012,5,64),new THREE.MeshBasicMaterial({color:x===6?0x7bf5c2:0x728bad}));
 ring.rotation.x=-Math.PI/2;ring.position.set(x,-.022,0);scene.add(ring);
}
const entries=[
 {id:'wealth_chef',file:'./assets/wealth_chef.glb',name:'财富小镇·女厨师',
  map:{idle:'Idle_Breathe',draw:'Make_Juice',attack:'Give_Cup',hit:'Receive_Cup',victory:'Give_Cup'}},
 {id:'wealth_teen',file:'./assets/wealth_teen.glb',name:'财富小镇·男孩',
  map:{idle:'Idle_Breathe',draw:'Make_Juice',attack:'Give_Cup',hit:'Receive_Cup',victory:'Give_Cup'}},
 {id:'dandao_healer',file:'./assets/dandao_healer.glb',name:'丹道·洛青荇',
  map:{idle:'idle',draw:'talk',attack:'examine',hit:'talk',victory:'walk'}},
 {id:'old_jay',file:'../../assets/summons/G03-Jay-Landing-R97.glb',name:'决斗社·旧Jay',
  map:{idle:'Idle',draw:'Attack',attack:'Attack',hit:'Hit',victory:'Attack'}},
 {id:'new_jay',
  file:revision==='r221'?'./assets/jay-teen-duel-v02-forward.glb':'./assets/jay-teen-duel-v01.glb',
  name:revision==='r221'?'决斗社·新Jay 正向修正版':'决斗社·新Jay V01反向错误版',
  map:{idle:'Duel_Idle_LookAround',draw:'Duel_DrawCard',attack:'Duel_ThrowCard',hit:'Duel_Recoil',victory:'Duel_Victory'}}
];
const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder),actors=[],errors=[];
// R220 isolated 3D card mockup: same existing G03 artwork follows the true
// right-hand skin joint and detaches at the casting beat.
const gameCardMap=new THREE.TextureLoader().load('../../assets/cards/r109/G03.webp');
gameCardMap.colorSpace=THREE.SRGBColorSpace;
const heldCard=new THREE.Mesh(new THREE.PlaneGeometry(.25,.33),
 new THREE.MeshStandardMaterial({map:gameCardMap,side:THREE.DoubleSide,roughness:.4,
 metalness:.04,transparent:true,opacity:1,depthWrite:false}));
heldCard.name='R220_JAY_SKINNED_HAND_CARD_EXPERIMENT';heldCard.visible=false;
heldCard.renderOrder=2;scene.add(heldCard);
const cardHome=new THREE.Vector3(),cardRelease=new THREE.Vector3(),cardTarget=new THREE.Vector3();
let cardReleased=false;

let phase='idle',auto=false,phaseElapsed=0,animationClock=new THREE.Clock(),accumulated=0;
const phases=['idle','draw','attack','hit','victory'];
function resize(){
 const width=Math.max(640,stage.clientWidth),height=Math.max(300,stage.clientHeight);
 renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();
}
window.addEventListener('resize',resize);resize();
function playActor(actor,kind){
 const name=actor.config.map[kind]||actor.config.map.idle;
 const clip=actor.clips.find(c=>c.name===name);
 if(!clip){errors.push('Missing action '+actor.config.id+' '+name);return false}
 actor.mixer.stopAllAction();actor.kaykitMixer?.stopAllAction();
 const mixer=name.startsWith('KayKit_')?actor.kaykitMixer:actor.mixer;
 if(!mixer)throw Error('Retarget runtime mixer missing');
 const a=mixer.clipAction(clip);a.reset().setEffectiveWeight(1);
 const loop=kind==='idle';a.setLoop(loop?THREE.LoopRepeat:THREE.LoopOnce,loop?Infinity:1);
 a.clampWhenFinished=!loop;a.play();
 actor.current=name;
 return true;
}
function setPhase(kind){
 if(!phases.includes(kind))return false;
 phase=kind;phaseElapsed=0;cardReleased=false;heldCard.visible=false;
 for(const a of actors)playActor(a,kind);
 document.querySelectorAll('button[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===kind));
 status.textContent='真实骨骼动作状态：'+({idle:'待机呼吸',draw:'抽牌',attack:'甩牌 / 交互',hit:'受击',victory:'胜利'}[kind]);
 return true;
}
const ready=Promise.all(entries.map(async(c,i)=>{
 console.log('R220_LOADING',c.id,c.file);
 const gltf=await loader.loadAsync(c.file);console.log('R220_FETCH_COMPLETE',c.id);const obj=gltf.scene;
 const box=new THREE.Box3().setFromObject(obj);const size=box.getSize(new THREE.Vector3());
 if(!Number.isFinite(size.y)||size.y<.3)throw Error('Invalid GLB '+c.id);
 const anchor=new THREE.Group();anchor.name='STAGE_'+c.id;
 anchor.position.x=focusJay?(i===3?-1.6:i===4?1.6:(i-2)*3):(i-2)*3;
 anchor.visible=(!focusJay||i>=3)&&!(focusJay&&viewAngle==='profile'&&i===3);
 const scale=2.43/size.y;
 obj.scale.setScalar(scale);
 obj.position.set(-(box.min.x+box.max.x)/2*scale,-box.min.y*scale,-(box.min.z+box.max.z)/2*scale);
 obj.rotation.y=0;
 anchor.add(obj);scene.add(anchor);
 const bones=[];obj.traverse(node=>{
  if(node.isMesh){node.castShadow=true;node.receiveShadow=true;node.frustumCulled=false}
  if(node.isBone)bones.push(node);
 });
 const mixer=new THREE.AnimationMixer(obj);
 const record={config:c,root:obj,anchor,clips:gltf.animations,mixer,bones,
  rest:bones.map(b=>b.quaternion.clone()),current:null,
  bbox:{height:size.y,width:size.x,depth:size.z},skinMeshes:0};
 obj.traverse(node=>{if(node.isSkinnedMesh)record.skinMeshes++});
 actors[i]=record;status.textContent='已载入 '+actors.filter(Boolean).length+'/5 '+c.name;console.log('R220_READY_ACTOR',c.id,bones.length);
 console.log('R220_REAL_GLB',c.id,'bones',bones.length,'skinned',record.skinMeshes,
  'clips',gltf.animations.map(a=>a.name));
 return record;
})).then(async()=>{
 if(kaykitTrial){
  const lib=await loader.loadAsync('./assets/kaykit_general.glb');
  const findSkinned=root=>{let mesh=null;root.traverse(n=>{if(!mesh&&n.isSkinnedMesh)mesh=n});return mesh};
  const sourceSkin=findSkinned(lib.scene),targetSkin=findSkinned(actors[4].root);
  // KayKit's animation-only GLB has 23 real Bone nodes but zero mesh nodes.
  // SkeletonUtils supports a Skeleton as the source, not only SkinnedMesh.
  const srcBones=[];lib.scene.traverse(n=>{if(n.isBone)srcBones.push(n)});
  const sourceRig=sourceSkin||(srcBones.length?new THREE.Skeleton(srcBones):null);
  if(!sourceRig||!targetSkin)throw Error('KayKit source/target actual skeleton missing');
  console.log('R220_KAYKIT_SOURCE',srcBones.length,'bones, mesh',!!sourceSkin,'names',srcBones.map(b=>b.name).join(','),'TARGETS',targetSkin.skeleton.bones.map(b=>b.name).join(','));
  console.log('R220_TARGET_TRACK_SAMPLE',actors[4].clips.find(c=>c.name==='Duel_ThrowCard').tracks.slice(0,8).map(t=>t.name).join(','));
  console.log('R220_KAYKIT_TRACK_SAMPLE',lib.animations.find(c=>c.name==='Throw').tracks.slice(0,8).map(t=>t.name).join(','));
  const names={
   Hips:'hips',Spine:'spine',Spine02:'chest',Head:'head',
   LeftArm:'upperarml',LeftForeArm:'lowerarml',LeftHand:'handl',
   RightArm:'upperarmr',RightForeArm:'lowerarmr',RightHand:'handr',
   LeftUpLeg:'upperlegl',LeftLeg:'lowerlegl',LeftFoot:'footl',LeftToeBase:'toesl',
   RightUpLeg:'upperlegr',RightLeg:'lowerlegr',RightFoot:'footr',RightToeBase:'toesr'
  };
  if(kaykitLocal){
   const inverse=Object.fromEntries(Object.entries(names).map(([target,source])=>[source,target]));
   const sourceRest=new Map(srcBones.map(b=>[b.name,b.quaternion.clone()]));
   const targetRest=new Map(targetSkin.skeleton.bones.map(b=>[b.name,b.quaternion.clone()]));
   for(const sourceClip of lib.animations.filter(c=>['Idle_A','Throw','Hit_A','Interact'].includes(c.name))){
    const tracks=[];
    for(const track of sourceClip.tracks){
     if(!track.name.endsWith('.quaternion'))continue;
     const name=track.name.slice(0,-'.quaternion'.length),targetName=inverse[name];
     if(!targetName)continue;
     const restA=sourceRest.get(name),restB=targetRest.get(targetName);
     if(!restA||!restB)continue;
     const output=new Float32Array(track.values.length);
     const inverseA=restA.clone().invert(),q=new THREE.Quaternion();
     for(let k=0;k<track.times.length;k++){
      q.fromArray(track.values,k*4);
      const delta=inverseA.clone().multiply(q);
      restB.clone().multiply(delta).normalize().toArray(output,k*4);
     }
     tracks.push(new THREE.QuaternionKeyframeTrack(targetName+'.quaternion',track.times,output));
    }
    if(tracks.length<15)throw Error('R220 local retarget missing full body: '+sourceClip.name+' '+tracks.length);
    const clip=new THREE.AnimationClip('KayKitLocal_'+sourceClip.name,sourceClip.duration,tracks);
    actors[4].clips.push(clip);
    console.log('R220_KAYKIT_LOCAL',clip.name,'full-body-rotation-tracks',tracks.length);
   }
   actors[4].config.map={idle:'KayKitLocal_Idle_A',draw:'KayKitLocal_Interact',
    attack:'KayKitLocal_Throw',hit:'KayKitLocal_Hit_A',victory:'KayKitLocal_Interact'};
  }else{
   for(const sourceClip of lib.animations.filter(c=>['Idle_A','Throw','Hit_A','Interact'].includes(c.name))){
    const converted=retargetClip(targetSkin,sourceRig,sourceClip,{names,hip:'__no_root__',fps:24});
   converted.name='KayKit_'+sourceClip.name;
   if(!converted.tracks.length)throw Error('KayKit retarget produced empty clip '+sourceClip.name);
   actors[4].clips.push(converted);
   console.log('R220_KAYKIT_RETARGET',converted.name,'sourceTracks',sourceClip.tracks.length,'targetTracks',converted.tracks.length,converted.tracks.map(t=>t.name).join(','));
  }
  targetSkin.skeleton.pose();
  actors[4].kaykitMixer=new THREE.AnimationMixer(targetSkin);
   actors[4].config.map={idle:'KayKit_Idle_A',draw:'KayKit_Interact',attack:'KayKit_Throw',hit:'KayKit_Hit_A',victory:'KayKit_Interact'};
  }
 }
 setPhase('idle');status.textContent='5/5 真实GLB已加载 · 点击动作进行同镜头对照';
 window.__r220Ready=true;
 if(revision==='r221'){
  document.querySelector('.actor.new b').textContent='新 Jay · R221 正向修正版';
  document.querySelector('.actor.new span').textContent='Blender 肩/肘轴修正 · 11套骨骼动画';
 }else{
  document.querySelector('.actor.new b').textContent='新 Jay · R220 方向错误基线';
 }

}).catch(e=>{
 errors.push(String(e));status.textContent='资源加载失败 '+String(e);window.__r220Ready=false;
});
function metrics(){
 return actors.filter(Boolean).map(a=>{
  let activeBones=0,maxAngle=0;
  for(let i=0;i<a.bones.length;i++){
   const angle=a.bones[i].quaternion.angleTo(a.rest[i]);
   if(angle>.08)activeBones++;maxAngle=Math.max(maxAngle,angle);
  }
  const clip=a.clips.find(c=>c.name===a.current);
  const channels=clip?.tracks?.length??0;
  // Authoritative browser-side world-space geometry proof; positive Z is forward
  // after Blender (-Y) -> glTF(+Z) conversion.
  a.anchor.updateMatrixWorld(true);
  const depth={};
  for(const side of ['Left','Right']){
   const sh=a.bones.find(b=>b.name===side+'Arm'),
    elbow=a.bones.find(b=>b.name===side+'ForeArm'),
    hand=a.bones.find(b=>b.name===side+'Hand');
   if(sh&&elbow&&hand){
    const vSh=sh.getWorldPosition(new THREE.Vector3()),
     vEl=elbow.getWorldPosition(new THREE.Vector3()),
     vHand=hand.getWorldPosition(new THREE.Vector3());
    depth[side.toLowerCase()+'HandForwardM']=+(vHand.z-vSh.z).toFixed(3);
    depth[side.toLowerCase()+'ElbowForwardM']=+(vEl.z-vSh.z).toFixed(3);
   }
  }
  return {id:a.config.id,name:a.config.name,clip:a.current,
   clips:a.clips.map(c=>c.name),bones:a.bones.length,
   activeBones,maxAngleRad:+maxAngle.toFixed(3),
   animationTracks:channels,handDepth:depth,skinnedMeshes:a.skinMeshes,
   skinDimensions:a.bbox};
 });
}
window.__r220QA={
 revision,viewAngle,setPhase,
 get ready(){return window.__r220Ready===true},
 get current(){return phase},
 get state(){return {actors:metrics(),errors,drawCalls:renderer.info.render.calls,
 triangles:renderer.info.render.triangles,loaded:actors.filter(Boolean).length}}
};
document.querySelectorAll('button[data-mode]').forEach(b=>b.addEventListener('click',()=>{
 auto=false;document.querySelector('#autoplay').classList.remove('active');setPhase(b.dataset.mode);
}));
document.querySelector('#autoplay').addEventListener('click',e=>{
 auto=!auto;e.target.classList.toggle('active',auto);if(auto)setPhase('draw');
});
function updateLiveCard(){
 const actor=actors[4];
 if(!actor||!(phase==='draw'||phase==='attack')){heldCard.visible=false;return}
 const hand=actor.bones.find(b=>b.name==='RightHand');
 if(!hand){heldCard.visible=false;return}
 actor.anchor.updateMatrixWorld(true);hand.getWorldPosition(cardHome);
 cardHome.y+=.04;cardHome.z+=.06;
 if(phase==='draw'||phaseElapsed<.68){
  heldCard.position.copy(cardHome);cardReleased=false;
  heldCard.material.opacity=1;heldCard.visible=true;
 }else{
  if(!cardReleased){cardRelease.copy(cardHome);cardReleased=true}
  const t=Math.min(1,(phaseElapsed-.68)/.65);
  cardTarget.copy(actors[3]?.anchor.position||new THREE.Vector3(-1.6,0,0));
  cardTarget.y=1.46;cardTarget.z=.15;
  const e=t*t*(3-2*t);
  heldCard.position.copy(cardRelease).lerp(cardTarget,e);
  heldCard.position.y+=.55*Math.sin(t*Math.PI);
  heldCard.material.opacity=t>.8?Math.max(0,(1-t)/.2):1;
  heldCard.visible=t<1;
 }
 heldCard.quaternion.copy(camera.quaternion);
 heldCard.rotation.z=.16*Math.sin(phaseElapsed*3);
}
function render(){
 requestAnimationFrame(render);
 const dt=Math.min(.05,animationClock.getDelta());
 phaseElapsed+=dt;
 for(const a of actors.filter(Boolean)){a.mixer.update(dt);a.kaykitMixer?.update(dt)}
 if(auto){if(phaseElapsed>2.6)setPhase(phases[(phases.indexOf(phase)+1)%phases.length])}
 updateLiveCard();
 renderer.render(scene,camera);
 accumulated+=dt;
 if(accumulated>.5&&window.__r220Ready){
  accumulated=0;const data=metrics();const jay=data.find(x=>x.id==='new_jay'),old=data.find(x=>x.id==='old_jay');
  readout.textContent='旧Jay骨骼位移 '+old?.activeBones+' / '+old?.bones+
   '  ·  新Jay骨骼位移 '+jay?.activeBones+' / '+jay?.bones+
   '  ·  绘制 '+renderer.info.render.calls+'次';
 }
}
render();
