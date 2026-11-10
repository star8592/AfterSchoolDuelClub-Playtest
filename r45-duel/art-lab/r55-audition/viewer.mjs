import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const $=id=>document.getElementById(id);
const canvas=$('canvas');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.7));
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.25;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.background=new THREE.Color('#101d2c');
const camera=new THREE.PerspectiveCamera(36,1,.05,150);
const hemi=new THREE.HemisphereLight('#d5e7ff','#2f4662',2.0);scene.add(hemi);
const key=new THREE.DirectionalLight('#ffe1b3',3.3);key.position.set(4,8,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);scene.add(key);
const fill=new THREE.DirectionalLight('#98c9ff',2);fill.position.set(-5,5,-2);scene.add(fill);
const ground=new THREE.Mesh(new THREE.CircleGeometry(4.3,90),new THREE.MeshStandardMaterial({color:'#1c3344',metalness:.28,roughness:.36}));
ground.rotation.x=-Math.PI/2;ground.position.y=-.018;ground.receiveShadow=true;scene.add(ground);
const ring=new THREE.Mesh(new THREE.TorusGeometry(2.20,.013,6,120),
 new THREE.MeshBasicMaterial({color:'#87d2e9',transparent:true,opacity:.35}));
ring.rotation.x=-Math.PI/2;ring.position.y=.013;scene.add(ring);
const holder=new THREE.Group();scene.add(holder);
let records=[],active=null,idx=0,mixer=null,accessoryMixer=null,accessoryClips=[],motion=null,spin=0,azimuth=.47,elevation=.23,zoom=7.2;
let paperFlight=null,architectPose=null;
let loadToken=0,diagnostics={loaded:false,meshes:0,animations:0,error:null};
const OWL_STUDY='batch1/character-studies/T01/T01-BroadcastOwl-R56-STUDY.glb';
const E02_STUDY='batch1/character-studies/E02/E02-PaperPlane-R57-Refined-STUDY.glb';
const T02_STUDY='batch1/character-studies/T02/T02-LivingMenu-R58-AnimateStudy.glb';
const G01_STUDY='batch1/character-studies/G01/G01-ElasticArchitect-R59-PropsSTUDY.glb';
const studyQuery=new URLSearchParams(location.search).get('study');
let owlStudy=studyQuery==='T01-R56';
let e02Study=studyQuery==='E02-R57';
let t02Study=studyQuery==='T02-R58';
let g01Study=studyQuery==='G01-R59';
function refreshG01Variant(){
 const b=$('g01-variant');b.hidden=records[idx]?.id!=='G01';
 b.textContent=g01Study?'当前：R59 建筑师配件 · 点击查看原始':'当前：原始通用 VRM · 点击看建筑师';
}
$('g01-variant').addEventListener('click',()=>{g01Study=!g01Study;select(idx)});
function refreshT02Variant(){
 const b=$('t02-variant');
 b.hidden=records[idx]?.id!=='T02';
 b.textContent=t02Study?'当前：R58 活菜单翻页 · 点击看原始':'当前：旧活菜单 · 点击看动态版';
}
$('t02-variant').addEventListener('click',()=>{t02Study=!t02Study;select(idx)});

function refreshE02Variant(){
 const b=$('e02-variant');
 b.hidden=records[idx]?.id!=='E02';
 b.textContent=e02Study?'当前：R57 纸翼精修 · 点击看原始':'当前：旧纸飞机 · 点击看精修版';
}
$('e02-variant').addEventListener('click',()=>{e02Study=!e02Study;select(idx)});

function refreshOwlVariant(){
 const button=$('owl-variant');
 button.hidden=records[idx]?.id!=='T01';
 button.textContent=owlStudy?'当前：R56 改造试验 · 点击看原始':'当前：原始 CC0 猫头鹰 · 点击看改造';
}
$('owl-variant').addEventListener('click',()=>{owlStudy=!owlStudy;select(idx)});

const loader=new GLTFLoader();
const ambient=[];

function fit(){
 const r=canvas.getBoundingClientRect();
 if(r.width<1||r.height<1)return;
 renderer.setSize(r.width,r.height,false);
 camera.aspect=r.width/r.height;camera.updateProjectionMatrix();
}
window.addEventListener('resize',fit);fit();
function placeCamera(){
 const paper=records[idx]?.id==='E02';
 const elev=Math.max(-.12,Math.min(1.04,elevation));
 camera.position.set(zoom*Math.sin(azimuth)*Math.cos(elev),
  (paper?1.15:2.0)+zoom*Math.sin(elev),
  zoom*Math.cos(azimuth)*Math.cos(elev));
 camera.lookAt(0,paper?.5:1.25,0);
}
function disposeGroup(){
 while(holder.children.length)holder.remove(holder.children[0]);
 mixer?.stopAllAction();accessoryMixer?.stopAllAction();
 mixer=null;accessoryMixer=null;accessoryClips=[];motion=null;paperFlight=null;architectPose=null;
 while(ambient.length){const m=ambient.pop();if(m.parent)m.parent.remove(m);
  m.geometry?.dispose?.();m.material?.dispose?.();}
}
function getColors(id){const c=id[0];return c==='E'?['#ffd281','#a6604d']:c==='G'?['#86e4be','#4e8278']:['#93ccff','#467ea9']}
function basic(hex,emissive=.1){return new THREE.MeshStandardMaterial({color:hex,metalness:.35,roughness:.32,emissive:hex,emissiveIntensity:emissive})}
function shape(geo,mat,x=0,y=0,z=0){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;holder.add(m);ambient.push(m);return m}
function previewSpell(id){
 const [glow,base]=getColors(id);const mat=basic(base),spark=basic(glow,.65);
 if(id==='E05'){
  shape(new THREE.CylinderGeometry(.42,.32,1.1,12),mat,0,1.35,0).rotation.z=-.23;
  shape(new THREE.ConeGeometry(.53,.84,20),spark,-.2,1.42,.03).rotation.z=-Math.PI/2;
 }else if(id==='E06'){
  shape(new THREE.BoxGeometry(1.5,.73,.7),basic('#deddd4'),0,1.5,0).rotation.z=.32;
  shape(new THREE.BoxGeometry(1.42,.2,.67),mat,0,1.09,0).rotation.z=.32;
 }else if(id==='G05'){
  shape(new THREE.BoxGeometry(2,.12,1.0),basic('#aa744a'),0,1.1,0);
  for(const sign of [-1,1])for(const z of [-.32,.32])shape(new THREE.CylinderGeometry(.045,.045,1.1,10),mat,sign*.75,.55,z);
 }else if(id==='G06'){
  for(let i=0;i<5;i++)shape(new THREE.BoxGeometry(1.3,.035,1.7),basic(i%2?'#b8cce2':'#f5e8c4'),i*.04,.68+i*.15,-i*.08).rotation.y=i*.12;
 }else if(id==='T05'){
  shape(new THREE.CylinderGeometry(.55,.38,.55,48),basic('#f8d8a4'),0,.65,0);
  shape(new THREE.CylinderGeometry(.50,.50,.035,48),basic('#bfe5bf'),0,.96,0);
  for(let i=0;i<5;i++)shape(new THREE.SphereGeometry(.12,12,12),spark,(i-2)*.17,1.28,.02);
 }else if(id==='T06'){
  shape(new THREE.BoxGeometry(.96,1.64,.60),mat,0,1.25,0);
  for(const y of [.8,1.62]){const c=shape(new THREE.TorusGeometry(y===.8?.31:.19,.07,9,48),spark,0,y,.32);c.rotation.y=0}
 }
 const core=new THREE.Group();holder.add(core);
 for(let i=0;i<5;i++){
  const r=new THREE.Mesh(new THREE.TorusGeometry(.9+i*.18,.014,6,70),new THREE.MeshBasicMaterial({
   color:glow,transparent:true,opacity:.35-i*.04,blending:THREE.AdditiveBlending,depthWrite:false}));
  r.rotation.x=Math.PI/2;r.position.y=1.25;core.add(r);ambient.push(r);
 }
 return core;
}
function playClip(request){
 if(architectPose){
  architectPose.mode=request;
  architectPose.started=clock.elapsedTime;
  $('info').textContent='原始 VRM 骨架 + 独立三维职业配件 · '+
   ({idle:'测量待机',walk:'规划手势',attack:'弹力尺出击'}[request]||request);
  return;
 }
 if(paperFlight){
  paperFlight.mode=request==='walk'?'bank':request==='attack'?'attack':'idle';
  paperFlight.started=clock.elapsedTime;
  $('info').textContent='原始三维实体 · '+({idle:'悬停',bank:'转弯盘旋',attack:'俯冲攻击'}[paperFlight.mode])+' · 变换动画';
  return;
 }
 if(!mixer||!active)return;
 const clips=active.animations||[];
 if(!clips.length)return;
 let clip=clips.find(c=>c.name.toLowerCase().includes(request));
 if(!clip)clip=request==='idle'?clips[0]:clips.find(c=>c.name.toLowerCase().includes('idle'))||clips[0];
 mixer.stopAllAction();mixer.clipAction(clip).reset().fadeIn(.1).play();
 if(accessoryMixer&&accessoryClips.length){
  const costumeClip=accessoryClips.find(c=>c.name.toLowerCase()===clip.name.toLowerCase())
    ||accessoryClips.find(c=>c.name.toLowerCase().includes(request));
  if(costumeClip){
   accessoryMixer.stopAllAction();
   accessoryMixer.clipAction(costumeClip).reset().fadeIn(.1).play();
  }
 }
 const actionKind=records[idx]?.id==='T02'&&t02Study?'GLB 原生翻页与节点动画':'源骨骼动画';
 $('info').textContent=(accessoryMixer?'源模型 + 配件独立骨骼':'实际三维模型')+
   ' · '+clip.name+' · '+actionKind;
}
async function select(index){
 const prevId=records[idx]?.id;
 idx=index;const entry=records[idx];if(!entry)return;
 if(prevId!==entry.id){
  elevation=entry.id==='E02'?.78:.23;
  zoom=entry.id==='E02'?(window.innerWidth<600?8.7:6.6):7.2;
  azimuth=entry.id==='G01'?Math.PI:.47;
 }
 for(const [id,text] of Object.entries(entry.id==='E02'?
  {idle:'悬停 / Idle',walk:'盘旋 / Bank',attack:'俯冲 / Attack'}:
  entry.id==='T02'&&t02Study?
  {idle:'轻摇 / Idle',walk:'小跑 / Walk',attack:'翻页攻击 / Attack'}:
  {idle:'待机 / Idle',walk:'行走 / Walk',attack:'攻击 / Attack'})){
  $(id).textContent=text;
 }
 [...$('roster').children].forEach((n,i)=>n.classList.toggle('active',i===idx));
 $('name').textContent=entry.id+' · '+entry.name;
 refreshOwlVariant();
 refreshE02Variant();
 refreshT02Variant();
 refreshG01Variant();
 $('status').textContent=entry.status==='ACTUAL_SOURCE_VRM'?'当前正式场馆已有源 VRM · 人物原创美术仍需审核':
  entry.kind==='spell'?'事件技能三维预演 · 尚未完成成品 VFX':'候选源模型或旧实验模型 · 暂不作为正式角色';
 $('meta').textContent=entry.kind==='spell'?'这一张事件牌已匹配独立的三维特效概念，战斗规则不由预览器计算。':
 '仅审查模型拓扑、材质、骨骼和动作；任何来自第三方的模型都需要先改变成与原画一致的独立角色，才能合入正式游戏。';
 disposeGroup();active=null;loadToken++;const token=loadToken;
 diagnostics={loaded:false,meshes:0,animations:0,error:null};
 $('info').textContent='载入 '+entry.id+'…';
 if(entry.kind==='spell'){
  previewSpell(entry.id);diagnostics={loaded:true,meshes:holder.children.length,animations:1,error:null};
  $('info').textContent='原创技能预演 · 3D';
  return;
 }
 try{
  const useOverlay=entry.id==='T01'&&owlStudy;
  const useArchitect=entry.id==='G01'&&g01Study;
  const modelPath=entry.id==='E02'&&e02Study?E02_STUDY:
    entry.id==='T02'&&t02Study?T02_STUDY:
    useOverlay?OWL_STUDY:entry.previewModel;
  const gltf=await loader.loadAsync([E02_STUDY,T02_STUDY].includes(modelPath)?modelPath:entry.previewModel);
  const costume=useOverlay?await loader.loadAsync(OWL_STUDY):
    useArchitect?await loader.loadAsync(G01_STUDY):null;
  if(token!==loadToken)return;
  const model=new THREE.Group();
  model.add(gltf.scene);
  if(useArchitect&&costume){
   // Bind real costume meshes to the untouched source VRM bones. Original
   // face/skin/hair meshes never pass through a destructive export step.
   gltf.scene.updateMatrixWorld(true);costume.scene.updateMatrixWorld(true);
   const costumeMeshes=[];costume.scene.traverse(o=>{
    if(o.isMesh&&o.userData?.attachBone)costumeMeshes.push(o);
   });
   let anchored=0;
   for(const o of costumeMeshes){
    const bone=gltf.scene.getObjectByName(o.userData.attachBone);
    if(bone){bone.attach(o);anchored++;}
   }
   model.userData.g01AnchoredProps=anchored;
  }
  if(useOverlay&&costume){
   // Blender exported this heritage rig with a different origin convention.
   // The costume is an independent skinned GLB aligned to the untouched CC0 owl.
   costume.scene.rotation.y=Math.PI;
   costume.scene.position.set(0,1.65,-.35);
   model.add(costume.scene);
  }
  const readBounds=(obj)=>{
   const b=new THREE.Box3().setFromObject(obj);
   return{min:b.min.toArray().map(x=>+x.toFixed(3)),
    max:b.max.toArray().map(x=>+x.toFixed(3)),
    center:b.getCenter(new THREE.Vector3()).toArray().map(x=>+x.toFixed(3))};
  };
  const sourceBounds=readBounds(gltf.scene);
  const accessoryBounds=useOverlay&&costume?readBounds(costume.scene):null;
  const box=new THREE.Box3().setFromObject(model);
  const size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
  const scale=2.65/Math.max(.001,size.y,size.x*.65,size.z*.65);
  model.scale.setScalar(scale);
  model.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);
  model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;if(o.isSkinnedMesh)o.frustumCulled=false}});
  holder.add(model);
  if(entry.id==='E02'){
   paperFlight={root:model,mode:'idle',started:0,baseX:model.position.x,
    baseY:model.position.y,baseZ:model.position.z};
  }
  if(useArchitect){
   const bones={};const base={};
   for(const key of ['J_Bip_R_UpperArm','J_Bip_L_UpperArm','J_Bip_C_Head']){
    bones[key]=gltf.scene.getObjectByName(key);
    if(bones[key])base[key]=bones[key].quaternion.clone();
   }
   architectPose={mode:'idle',started:0,bones,base,anchored:model.userData.g01AnchoredProps};
  }
  const meshCount=(()=>{let n=0;model.traverse(o=>{if(o.isMesh)n++});return n})();
  active={...entry,animations:gltf.animations};
  diagnostics={loaded:true,meshes:meshCount,animations:gltf.animations.length,
   sourceBounds,accessoryBounds,
   costumeAnimations:costume?.animations.length||0,modelPath,error:null};
  if(entry.id==='T01'&&owlStudy){
   $('status').textContent='R56 独立三维改造试验 · 耳机/话筒已绑定，尚未通过正式原画与细节验收';
  }
  if(entry.id==='E02'&&e02Study){
   $('status').textContent='R57 纸飞机实体边缘与材质精修试验 · 非 Pixal3D 生成，尚未通过正式美术验收';
  }
  if(entry.id==='G01'&&g01Study){
   $('status').textContent='R59 橡皮筋建筑师 · 保留源 VRM + 30 配件 · 非正式美术成品';
  }
  if(entry.id==='T02'&&t02Study){
   $('status').textContent='R58 活菜单真实 GLB 翻页试验 · 五套原生动画，不是最终人物美术';
  }
  if(gltf.animations.length){
   mixer=new THREE.AnimationMixer(gltf.scene);
   if(costume){accessoryMixer=new THREE.AnimationMixer(costume.scene);accessoryClips=costume.animations;}
   playClip('idle');
  }
  else $('info').textContent=entry.id==='E02'?
    '实际 GLB · '+meshCount+' 网格 · 可悬停、转弯、俯冲':
    '实际 GLB · '+meshCount+' 网格 · 无内置动画';
 }catch(error){
  diagnostics={loaded:false,meshes:0,animations:0,error:String(error)};
  $('info').textContent='文件加载失败：'+String(error).slice(0,90);
 }
}
let drag=null;
canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(!drag)return;
 azimuth-=(e.clientX-drag.x)*.008;elevation+=(e.clientY-drag.y)*.006;
 drag.x=e.clientX;drag.y=e.clientY;
});
canvas.addEventListener('pointerup',()=>{drag=null});
canvas.addEventListener('pointercancel',()=>{drag=null});
canvas.addEventListener('wheel',e=>{zoom=Math.max(3.5,Math.min(13.5,zoom*Math.exp(e.deltaY*.001)));e.preventDefault()},{passive:false});
for(const k of ['idle','attack','walk'])$(k).addEventListener('click',()=>playClip(k));
$('reset').addEventListener('click',()=>{
 azimuth=.47;
 elevation=records[idx]?.id==='E02'?.78:.23;
 zoom=records[idx]?.id==='E02'?(innerWidth<600?8.7:6.6):7.2;
});
const clock=new THREE.Clock();
function loop(){
 requestAnimationFrame(loop);const dt=Math.min(.06,clock.getDelta()),t=clock.elapsedTime;
 if(architectPose){
  const a=architectPose,elapsed=t-a.started;
  const wave=a.mode==='attack'?.56*Math.sin(Math.min(1,elapsed/1.25)*Math.PI):
   a.mode==='walk'?.20*Math.sin(elapsed*3):.075*Math.sin(t*1.8);
  const q=(name,delta)=>{
   if(a.bones[name]&&a.base[name]){
    a.bones[name].quaternion.copy(a.base[name]).multiply(
     new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),delta));
   }
  };
  q('J_Bip_R_UpperArm',wave);
  q('J_Bip_L_UpperArm',-wave*.7);
  q('J_Bip_C_Head',wave*.12);
  if(a.mode==='attack'&&elapsed>1.25)a.mode='idle';
 }
 if(mixer)mixer.update(dt);
 if(accessoryMixer)accessoryMixer.update(dt);
 if(paperFlight){
  const a=paperFlight,phase=t-a.started;
  a.root.position.set(a.baseX,a.baseY+.075*Math.sin(t*1.8),a.baseZ);
  a.root.rotation.set(0,0,.035*Math.sin(t*1.3));
  if(a.mode==='bank'){
   a.root.rotation.y=.23*Math.sin(phase*1.9);
   a.root.rotation.z=.28*Math.sin(phase*1.4);
   a.root.position.y+=.12*Math.sin(phase*2.0);
  }else if(a.mode==='attack'){
   const u=Math.min(1,phase/1.15);
   a.root.position.z-=.70*Math.sin(Math.PI*u);
   a.root.rotation.x=.21*Math.sin(Math.PI*u);
   a.root.rotation.z=.13*Math.sin(Math.PI*u);
   if(u>=1)a.mode='idle';
  }
 }
 ring.material.opacity=.25+.07*Math.sin(t*1.8);
 if(records[idx]?.kind==='spell')holder.rotation.y+=dt*.29;
 else holder.rotation.y=0;
 placeCamera();renderer.render(scene,camera);
}
loop();
try{
 records=await (await fetch('./roster.json')).json();
 for(const entry of records){
  const b=document.createElement('button');b.className='choice';b.type='button';
  b.innerHTML='<span class="num">'+entry.id+'</span><strong>'+entry.name+'</strong><small>'+
   (entry.kind==='spell'?'事件 · 三维特效预演':entry.status==='ACTUAL_SOURCE_VRM'?'已有 VRM 源模型':'模型候选 · 未通过美术签收')+'</small>';
  b.addEventListener('click',()=>select(records.indexOf(entry)));$('roster').appendChild(b);
 }
 const initial=g01Study?records.findIndex(x=>x.id==='G01'):
   owlStudy?records.findIndex(x=>x.id==='T01'):
   e02Study?records.findIndex(x=>x.id==='E02'):
   t02Study?records.findIndex(x=>x.id==='T02'):0;
 await select(Math.max(0,initial));
}catch(error){$('info').textContent='数据载入失败：'+String(error)}
window.__R55_AUDITION_QA={
 get roster(){return records.length},
 get current(){return records[idx]?.id||null},
 get diagnostics(){return diagnostics},
 selectById:id=>{const i=records.findIndex(x=>x.id===id);if(i>=0)select(i);return i>=0},
 get selectedSource(){return diagnostics.modelPath||records[idx]?.previewModel||null},
 get studyVariant(){return owlStudy},
 get g01StudyVariant(){return g01Study},
 get architectMotion(){return architectPose?{
  mode:architectPose.mode,
  attachedMeshes:architectPose.anchored,
  rightArmQ:architectPose.bones['J_Bip_R_UpperArm']?.quaternion.toArray()||null}:null;},
 get t02StudyVariant(){return t02Study},
 setT02StudyVariant:(on)=>{t02Study=!!on;select(idx);return t02Study;},
 get activePageState(){
  if(records[idx]?.id!=='T02')return null;
  const hinge=holder.getObjectByName('R58_Left_Book_Binding_PIVOT');
  return hinge?{rotation:hinge.quaternion.toArray(),worldPosition:hinge.getWorldPosition(new THREE.Vector3()).toArray()}:null;
 },
 get menuRigState(){
  if(records[idx]?.id!=='T02')return null;
  const get=name=>holder.getObjectByName(name)?.quaternion.toArray()||null;
  return {
   page:get('R58_Left_Book_Binding_PIVOT'),
   chefHat:get('R58_Chef_Hat_Expressive_Hinge'),
   leftArm:get('R58_Left_Spoon_Arm_Joint'),
   rightArm:get('R58_Right_Spoon_Arm_Joint')
  };
 },
 get e02StudyVariant(){return e02Study},
 get paperMotion(){return paperFlight?{mode:paperFlight.mode,
  x:paperFlight.root.position.x,y:paperFlight.root.position.y,
  z:paperFlight.root.position.z,
  roll:paperFlight.root.rotation.z}:null},
 setE02StudyVariant:(on)=>{e02Study=!!on;select(idx);return e02Study;},
 setStudyVariant:(on)=>{owlStudy=!!on;select(idx);return owlStudy;},
 setOrbit:(yaw,up=.23,distance=7.2)=>{
  if(!Number.isFinite(yaw)||!Number.isFinite(up)||!Number.isFinite(distance))return false;
  azimuth=yaw;elevation=up;zoom=Math.max(3.5,Math.min(13.5,distance));return true;
 },
 get orbit(){return {azimuth,elevation,zoom}}
};
