/**
 * R23 battle-native 3D card model overlay.
 * Rule state is read from src/core.mjs in app.mjs; this module NEVER
 * calculates damage, creates units or changes card/turn state.
 * Only E02/T02 have actual original self-authored high-detail GLB assets.
 */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const SUPPORTED=new Set(['E02','T02']);
const MODELS={E02:'E02-paper-plane.glb',T02:'T02-living-menu.glb'};
const SIDES=['player','ai'];
const now=()=>performance.now();
const supported=id=>SUPPORTED.has(id);
export function createCardModelStage(container,opts={}){
 const qa={
  revision:'R41',renderMode:'real_GLTF_meshes_on_actual_focused_lane',
  gameplayReadOnly:true,sourceCards:['E02','T02'],
  loaded:false,modelCount:0,meshCounts:{},triangles:{},
  activeActualCards:[],preview:false,previewDistinctFromRules:true,
  actualCardFrames:0,frames:0,summonEvents:0,damageEvents:0,
  gpuRenderer:null,errors:[],status:'not-initialized',
  cameraMode:'wide',cameraZoom:1,activeAttackFrames:0,activeHitFrames:0,
  visualAttackTriggers:0,visualHitTriggers:0,attackSerials:[],lastActorPose:null
 };
 if(new URLSearchParams(location.search).get('qaR23')==='1')
  Object.defineProperty(window,'__r23CardStageQA',{value:qa});
 let renderer=null,scene=null,camera=null,canvas=null,loaded=false,loading=null;
 let actual={player:null,ai:null},preview=false,visible=false;
 let viewEntries={player:null,ai:null},lastCue={player:null,ai:null};
 let mcache={},actors={},raf=0;
 let cameraMode='wide';const pendingMotion=[];const motionTTL=1400;
 const clock=new THREE.Clock();
 let frameSize={w:0,h:0};
 const dpr=Math.min(devicePixelRatio||1,1.5);
 const status=document.getElementById('arena-r23-status');
 const demoButton=document.getElementById('arena-r23-preview');
 const rootActors={
  player:document.getElementById('arena-player-actor'),
  ai:document.getElementById('arena-enemy-actor')
 };
 function error(e){qa.errors.push(String(e));qa.status='fallback_2d';if(status)status.textContent='3D图像不可用，仍可正常出牌';console.error('R23 GLB visual fallback',e);}
 function stats(root){
  let mesh=0,tri=0;
  root.traverse(x=>{if(x.isMesh){mesh++;tri+=(x.geometry.index?x.geometry.index.count:x.geometry.attributes.position?.count||0)/3;x.castShadow=true;x.receiveShadow=true;}});
  return {meshes:mesh,triangles:Math.round(tri)};
 }
 function size(){
  if(!renderer)return;
  const rect=container.getBoundingClientRect();
  const w=Math.max(1,Math.round(rect.width)),h=Math.max(1,Math.round(rect.height));
  if(w===frameSize.w&&h===frameSize.h)return;
  frameSize={w,h};
  renderer.setSize(w,h,false);
  const aspect=w/h;
  const halfH=aspect>2.0?1.55:aspect>1.45?1.75:2.08;
  const halfW=halfH*aspect;
  camera.left=-halfW;camera.right=halfW;camera.top=halfH;camera.bottom=-halfH;
  camera.updateProjectionMatrix();
 }
 function init(){
  if(renderer)return;
  canvas=document.createElement('canvas');canvas.id='arena-r23-real3d';
  canvas.setAttribute('aria-hidden','true');container.prepend(canvas);
  const gl=canvas.getContext('webgl2',{antialias:true,alpha:true,preserveDrawingBuffer:true});
  if(!gl)throw Error('WebGL2 not available in battle scene');
  renderer=new THREE.WebGLRenderer({canvas,context:gl,alpha:true,antialias:true,
   preserveDrawingBuffer:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(dpr);renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.setClearColor(0,0);
  const ext=gl.getExtension('WEBGL_debug_renderer_info');
  qa.gpuRenderer=ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);
  scene=new THREE.Scene();
  camera=new THREE.OrthographicCamera(-3.3,3.3,1.55,-1.55,.1,50);
  camera.position.set(0,2.25,8);camera.lookAt(0,.9,0);
  scene.add(new THREE.HemisphereLight('#dbe6ff','#536174',1.18));
  const key=new THREE.DirectionalLight('#ffe8cf',3.2);key.position.set(-3,6,5);
  key.castShadow=true;key.shadow.mapSize.set(1024,1024);
  key.shadow.camera.left=-5;key.shadow.camera.right=5;
  key.shadow.camera.top=5;key.shadow.camera.bottom=-5;
  key.shadow.normalBias=.014;scene.add(key);
  const rim=new THREE.DirectionalLight('#96bfff',1.5);
  rim.position.set(2.5,4,-4);scene.add(rim);
  size();
  window.addEventListener('resize',size,{passive:true});
  qa.status='initializing';
 }
 function offset(){
  const aspect=(frameSize.w||container.clientWidth)/(frameSize.h||container.clientHeight||1);
  const hw=(camera?.right||3.2);
  return Math.max(aspect<1.6?.7:1.0,hw*.60);
 }
 function createModel(source,id,side){
  const clone=source.clone(true);
  const box=new THREE.Box3().setFromObject(clone,true);
  const dims=box.getSize(new THREE.Vector3());
  const center=box.getCenter(new THREE.Vector3());
  const root=new THREE.Group();
  const fullHeight=id==='E02'?1.62:1.88;
  const divisor=id==='E02'?Math.max(dims.x,dims.y,dims.z):dims.y;
  if(!Number.isFinite(divisor)||divisor<=0)throw Error('bad high fidelity model '+id);
  root.scale.setScalar(fullHeight/divisor);
  clone.position.set(-center.x,-box.min.y,-center.z);
  root.add(clone);
  root.userData={id,side,created:now(),attackUntil:0,hitUntil:0,
   attackStart:0,hitStart:0,baseScale:id==='E02'?1.62/2.4:1.88/2.6,
   restX:0,lastSerial:0,lastKind:null,uid:null};
  scene.add(root);
  return root;
 }
 async function loadModels(){
  if(loading)return loading;
  loading=(async()=>{
   init();
   const loader=new GLTFLoader();
   const urls=Object.entries(MODELS).map(([id,file])=>({
    id,url:new URL('../r23-card-lab/models/'+file,location.href).href
   }));
   for(const {id,url} of urls){
    const gltf=await loader.loadAsync(url);
    const s=stats(gltf.scene);
    if(s.meshes<10||s.triangles<2000)throw Error('R23 GLB geometry below baseline '+id);
    mcache[id]=gltf.scene;qa.meshCounts[id]=s.meshes;qa.triangles[id]=s.triangles;
    actors[id]={player:createModel(gltf.scene,id,'player'),ai:createModel(gltf.scene,id,'ai')};
   }
   loaded=true;qa.loaded=true;qa.modelCount=Object.keys(mcache).length;qa.status='ready';
   if(status)status.textContent='真实3D召唤物已载入 · 仅当前E02/T02单位显示';
   applyPendingMotions();
   refresh();
  })().catch(error);
  return loading;
 }
 function modeFor(side){
  return preview?(side==='player'?'E02':'T02'):actual[side]?.id||null;
 }
 function updateVisibility(){
  if(!loaded)return;
  const spread=offset();
  const any=SIDES.some(side=>supported(modeFor(side)));
  visible=any;
  for(const id of Object.keys(actors))for(const side of SIDES){
   const root=actors[id][side];
   root.visible=modeFor(side)===id;
   if(root.visible){
    const x=(side==='player'?-1:1)*spread;
    root.userData.restX=x;
    root.position.set(x,id==='E02'?.33:0,0);
    root.userData.uid=preview?null:actual[side]?.uid||null;
   }
  }
  for(const side of SIDES)rootActors[side].dataset.r23RealModel=
    String(visible&&supported(modeFor(side)));
  canvas.hidden=!visible;
  qa.activeActualCards=SIDES.filter(side=>supported(actual[side]?.id))
   .map(side=>({side,id:actual[side].id,uid:actual[side].uid}));
  qa.preview=preview;
  demoButton?.setAttribute('aria-pressed',String(preview));
  if(status)status.textContent=preview?'E02/T02 三维试演 · 与当前对局分离':
   any?'本战线真实3D召唤物 · 伤害与回合仍由卡牌规则决定':'本战线暂无E02/T02三维单位';
 }
 function refresh(){
  if(!loaded)return;
  size();updateVisibility();
  if(visible&&!raf)raf=requestAnimationFrame(draw);
 }
 function setBoardState({player,ai,theme}={}){
  if(theme!=='campus'){
   actual={player:null,ai:null};preview=false;
  }else{
   actual={player:player&&supported(player.id)?{id:player.id,uid:player.uid}:null,
    ai:ai&&supported(ai.id)?{id:ai.id,uid:ai.uid}:null};
  }
  viewEntries={...actual};
  applyPendingMotions();
  if(loaded){refresh();return;}
  if(preview||Object.values(actual).some(Boolean))loadModels();
 }
 function applyPendingMotions(){
  const stamp=now();
  for(let i=pendingMotion.length-1;i>=0;i--){
   const e=pendingMotion[i];
   if(stamp-e.timestamp>motionTTL){pendingMotion.splice(i,1);continue;}
   if(!loaded||preview||actual[e.side]?.id!==e.id||actual[e.side]?.uid!==e.uid)continue;
   const actor=actors[e.id]?.[e.side];
   if(!actor||!actor.visible)continue;
   if(actor.userData.lastSerial===e.serial&&actor.userData.lastKind===e.kind){pendingMotion.splice(i,1);continue;}
   actor.userData.lastSerial=e.serial;actor.userData.lastKind=e.kind;
   if(e.kind==='attack'){
    actor.userData.attackStart=stamp;actor.userData.attackUntil=stamp+720;
    qa.visualAttackTriggers++;qa.attackSerials.push(e.serial);
   }else{
    actor.userData.hitStart=stamp;actor.userData.hitUntil=stamp+640;
    qa.visualHitTriggers++;
   }
   pendingMotion.splice(i,1);
  }
 }
 function setCameraMode(mode){
  cameraMode=mode==='close'?'close':'wide';
  qa.cameraMode=cameraMode;
  if(visible&&!raf)raf=requestAnimationFrame(draw);
 }
 function draw(){
  raf=0;
  if(!renderer||!visible)return;
  size();
  const t=clock.getElapsedTime();
  const delta=now();
  const aspect=(frameSize.w||1)/(frameSize.h||1);
  const zoomTarget=cameraMode==='close'?(aspect<1.2?1.045:1.14):1;
  const previousZoom=camera.zoom;
  camera.zoom+=(zoomTarget-camera.zoom)*.095;
  if(Math.abs(previousZoom-camera.zoom)>0.00005)camera.updateProjectionMatrix();
  qa.cameraZoom=Number(camera.zoom.toFixed(3));qa.lastActorPose=null;
  for(const id of Object.keys(actors))for(const side of SIDES){
   const obj=actors[id][side];
   if(!obj.visible)continue;
   const e=id==='E02',isPlayer=side==='player',d=obj.userData;
   const atk=d.attackUntil>delta,hit=d.hitUntil>delta;
   const au=atk?Math.max(0,Math.min(1,(delta-d.attackStart)/720)):0;
   const hu=hit?Math.max(0,Math.min(1,(delta-d.hitStart)/640)):0;
   const lunge=atk?Math.sin(Math.PI*au)**2:0;
   const recoil=hit?Math.sin(Math.PI*hu)**2:0;
   if(lunge>.01)qa.activeAttackFrames++;
   if(recoil>.01)qa.activeHitFrames++;
   const direction=isPlayer?1:-1;
   obj.position.x=d.restX+direction*(.65*lunge-.23*recoil);
   obj.position.z=-.37*lunge+.17*recoil;
   obj.rotation.y=(isPlayer?-.10:.10)+Math.sin(t*.65+(isPlayer?0:1))*.13-direction*.20*lunge;
   obj.rotation.x=(e?-.20:0)+Math.sin(t*.81)*.045+.17*lunge;
   obj.rotation.z=(e?Math.sin(t*1.45+(isPlayer?0:1))*.075:
      Math.sin(t*.9+(isPlayer?0:2))*.03)-direction*.17*lunge+direction*.20*recoil;
   obj.scale.setScalar(d.baseScale*(1+Math.sin(t*1.9)*.014+.09*lunge-.075*recoil));
   obj.position.y=(e?.33:0)+Math.sin(t*(e?1.5:1))*(e?.10:.024)+.16*lunge-.08*recoil;
   qa.lastActorPose={id,side,x:Number(obj.position.x.toFixed(3)),z:Number(obj.position.z.toFixed(3)),
     lunge:Number(lunge.toFixed(3)),recoil:Number(recoil.toFixed(3)),serial:d.lastSerial};
  }
  renderer.render(scene,camera);qa.frames++;
  if(qa.activeActualCards.length)qa.actualCardFrames++;
  raf=requestAnimationFrame(draw);
 }
 function onCoreEvents(events){
  if(!Array.isArray(events)||!events.length)return;
  for(const e of events){
   if(e.type==='card_play'&&SUPPORTED.has(e.card)){
    qa.summonEvents++;
    const actor=actors[e.card]?.[e.side];
    if(actor)actor.userData.attackUntil=now()+590;
   }
   if(e.type==='exchange'||e.type==='direct_hit'){
    qa.damageEvents++;
    const stamp=now();
    if(supported(e.from)&&e.attacker_uid){
     pendingMotion.push({id:e.from,side:e.side,uid:e.attacker_uid,
       kind:'attack',serial:e.serial,timestamp:stamp,lane:e.lane});
    }
    const opponent=e.side==='player'?'ai':'player';
    if(e.type==='exchange'&&supported(e.to)&&e.target_uid){
     pendingMotion.push({id:e.to,side:opponent,uid:e.target_uid,
       kind:'hurt',serial:e.serial,timestamp:stamp,lane:e.lane});
    }
    applyPendingMotions();
   }
  }
 }
 function togglePreview(){
  preview=!preview;
  if(preview){void loadModels().then(refresh);}
  else if(loaded)refresh();
 }
 demoButton?.addEventListener('click',togglePreview);
 if(new URLSearchParams(location.search).get('qaR23')==='1')
  Object.defineProperty(window,'__r23StageTest',{value:{
   preview:()=>{if(!preview)togglePreview();},
   stopPreview:()=>{if(preview)togglePreview();},
   setMockVisualOnly:(player,ai)=>{actual={player:player?{id:player,uid:'qa-fake-player'}:null,
    ai:ai?{id:ai,uid:'qa-fake-ai'}:null};if(loaded)refresh();else loadModels();},
   state:()=>structuredClone({qa,preview,actual}),
   assets:()=>Object.keys(mcache)
  }});
 return {setBoardState,onCoreEvents,qa,togglePreview,setCameraMode};
}
