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
let records=[],active=null,idx=0,mixer=null,motion=null,spin=0,azimuth=.47,elevation=.23,zoom=7.2;
let loadToken=0,diagnostics={loaded:false,meshes:0,animations:0,error:null};
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
 const elev=Math.max(-.12,Math.min(1.04,elevation));
 camera.position.set(zoom*Math.sin(azimuth)*Math.cos(elev),2.0+zoom*Math.sin(elev),
  zoom*Math.cos(azimuth)*Math.cos(elev));
 camera.lookAt(0,1.25,0);
}
function disposeGroup(){
 while(holder.children.length)holder.remove(holder.children[0]);
 mixer?.stopAllAction();mixer=null;motion=null;
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
 if(!mixer||!active)return;
 const clips=active.animations||[];
 if(!clips.length)return;
 let clip=clips.find(c=>c.name.toLowerCase().includes(request));
 if(!clip)clip=request==='idle'?clips[0]:clips.find(c=>c.name.toLowerCase().includes('idle'))||clips[0];
 mixer.stopAllAction();mixer.clipAction(clip).reset().fadeIn(.1).play();
 $('info').textContent='GLB 原始模型 · '+clip.name+' · 骨骼动画';
}
async function select(index){
 idx=index;const entry=records[idx];if(!entry)return;
 [...$('roster').children].forEach((n,i)=>n.classList.toggle('active',i===idx));
 $('name').textContent=entry.id+' · '+entry.name;
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
  const gltf=await loader.loadAsync(entry.previewModel);
  if(token!==loadToken)return;
  const model=gltf.scene;
  const box=new THREE.Box3().setFromObject(model);
  const size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
  const scale=2.65/Math.max(.001,size.y,size.x*.65,size.z*.65);
  model.scale.setScalar(scale);
  model.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);
  model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;if(o.isSkinnedMesh)o.frustumCulled=false}});
  holder.add(model);
  const meshCount=(()=>{let n=0;model.traverse(o=>{if(o.isMesh)n++});return n})();
  active={...entry,animations:gltf.animations};
  diagnostics={loaded:true,meshes:meshCount,animations:gltf.animations.length,error:null};
  if(gltf.animations.length){mixer=new THREE.AnimationMixer(model);playClip('idle')}
  else $('info').textContent='实际 GLB · '+meshCount+' 网格 · 无内置动画';
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
$('reset').addEventListener('click',()=>{azimuth=.47;elevation=.23;zoom=7.2});
const clock=new THREE.Clock();
function loop(){
 requestAnimationFrame(loop);const dt=Math.min(.06,clock.getDelta()),t=clock.elapsedTime;
 if(mixer)mixer.update(dt);
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
 await select(0);
}catch(error){$('info').textContent='数据载入失败：'+String(error)}
window.__R55_AUDITION_QA={
 get roster(){return records.length},
 get current(){return records[idx]?.id||null},
 get diagnostics(){return diagnostics},
 selectById:id=>{const i=records.findIndex(x=>x.id===id);if(i>=0)select(i);return i>=0},
 get selectedSource(){return records[idx]?.previewModel||null},
 setOrbit:(yaw,up=.23,distance=7.2)=>{
  if(!Number.isFinite(yaw)||!Number.isFinite(up)||!Number.isFinite(distance))return false;
  azimuth=yaw;elevation=up;zoom=Math.max(3.5,Math.min(13.5,distance));return true;
 },
 get orbit(){return {azimuth,elevation,zoom}}
};
