/**
 * R45 verified card-identity fighter and one-stadium renderer.
 * Models are the SAME BASE VRM MESHES as R22's E01/G01 models, not the
 * old low-detail proxy rigs.
 * Visual-only choreography; canonical core.mjs owns all damage and winners.
 */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone as cloneSkeleton} from 'three/addons/utils/SkeletonUtils.js';
import {extractVrm0Expressions,createVrmCharacterActing} from './vrm-character-acting.mjs';
import {createVrmTwoBonePose,VRM_HERO_POSES} from './vrm-hero-pose-ik.mjs';
import {createStadium} from './stadium.mjs';
import {createDuelEffects} from './duel-effects.mjs';
import {createComboDirector} from './combo-director.mjs';
import {createLiveStadiumScoreboard} from './live-scoreboard.mjs';
import {createSpellImpact} from './spell-impact.mjs';
import {createCardHolograms} from './card-holograms.mjs';
import {createSummonPresence} from './summon-presence.mjs';
import {faceOpponentYaw} from './summon-orientation.mjs';
import {preloadSummonModels} from './summon-models.mjs';
const $=id=>document.getElementById(id);
const PARAMS=new URLSearchParams(location.search);
const MODEL_SPECS=[
 {id:'E01',name:'铃声追不上',source:'Shino-original-CC0.vrm',minBones:140,minSkins:60,color:'#fc9e73'},
 {id:'G01',name:'橡皮筋建筑师',source:'Fumiriya-original-CC0.vrm',minBones:100,minSkins:90,color:'#92b6eb'}
];
const PHASES={idle:'人物就位',approach:'双方接近',windup:'蓄力',strike:'我方攻击',
 counter:'对方反击',retreat:'双方回位',settled:'本次交锋完成'};
const DURATION=6.45;
let renderer,scene,camera,clock,actors=[],time=0,playing=false,mode='demo';
// Separate, continuously visible native VRM duelists; the E01/G01 summon
// bodies remain independently owned by SummonPresence in the arena.
let duelistHosts=[];
const hostAction={player:{started:-100,kind:'idle'},ai:{started:-100,kind:'idle'}};

let lastTime=0,frames=0,actionFrames=0,impactFrames=0,drawCount=0,renderInfo=null;
let currentPayload=null,activePhase='idle',ready=false,hadContact=false;
let lastSourceIds=[],source3DAssetsVerified=false;
let horizontalFov=0;
let orbitYaw=0, orbitTargetYaw=0, orbitZoom=1, orbitBaseDistance=12;
const CAMERA_LOOK_AT=new THREE.Vector3(0,.68,-1.65);
const orbitBound=180;
let pointerDrag=null;
let lastOcclusionMode='';
const orbitClamp=(v)=>clamp(v,-orbitBound,orbitBound);
function broadcastCamera(){
 if(window.parent!==window)window.parent.postMessage({
  type:'ASDC_R48_CAMERA_ANGLE',degrees:orbitTargetYaw
 },location.origin);
}
function setOrbit(value){
 if(!Number.isFinite(value))return;
 orbitTargetYaw=orbitClamp(value);broadcastCamera();
}
function installOrbitControls(){
 const el=$('battle-canvas');
 el.style.touchAction='none';
 el.addEventListener('pointerdown',e=>{
  if(e.button!==0)return;
  pointerDrag={id:e.pointerId,x:e.clientX,moved:false};
  el.setPointerCapture(e.pointerId);
 });
 el.addEventListener('pointermove',e=>{
  if(!pointerDrag||e.pointerId!==pointerDrag.id)return;
  const dx=e.clientX-pointerDrag.x;
  pointerDrag.x=e.clientX;pointerDrag.moved=true;
  setOrbit(orbitTargetYaw-dx*.27);
 });
 for(const event of ['pointerup','pointercancel','lostpointercapture']){
  el.addEventListener(event,()=>{pointerDrag=null});
 }
 el.addEventListener('wheel',e=>{
  e.preventDefault();
  orbitZoom=clamp(orbitZoom*Math.exp(e.deltaY*.001),.84,1.65);
 },{passive:false});
}
function cameraFrameStats(){
 if(!camera)return null;
 const ndc=x=>{
  const v=new THREE.Vector3(x,1.76,camera.aspect<.85?.45:1.55).project(camera);
  return {x:Number(v.x.toFixed(3)),y:Number(v.y.toFixed(3)),front:v.z>-1&&v.z<1};
 };
 const edge=camera.aspect<.85?2.55:4.45;
 return{yaw:Number(orbitYaw.toFixed(2)),targetYaw:orbitTargetYaw,
  distance:Number(camera.position.distanceTo(new THREE.Vector3(0,1.3,0)).toFixed(2)),
  aspect:Number(camera.aspect.toFixed(3)),
  podiums:{player:ndc(-edge),ai:ndc(edge)},
  composition:{
   ring:new THREE.Vector3(0,.07,0).project(camera).toArray().map(v=>Number(v.toFixed(3))),
   arenaBack:new THREE.Vector3(0,1.2,-7).project(camera).toArray().map(v=>Number(v.toFixed(3))),
   stageFloor:new THREE.Vector3(0,.07,4).project(camera).toArray().map(v=>Number(v.toFixed(3))),
   lookAt:CAMERA_LOOK_AT.toArray(),
   cameraY:Number(camera.position.y.toFixed(2))
  }};
}
function keepArenaVisible(){
 if(!stadiumEvidence?.group)return;
 const at=Math.abs(orbitYaw);
 // The physical jumbotron faces the front grandstand. Hide its opaque back
 // when orbiting behind the court, without affecting the authoritative HUD.
 if(liveScoreboard?.root)liveScoreboard.root.visible=at<100;
 const side=orbitYaw>=0?1:-1;
 const mode=at>=120?'back':at>=58?(side>0?'right':'left'):'front';
 if(mode===lastOcclusionMode)return;
 lastOcclusionMode=mode;
 stadiumEvidence.group.traverse(obj=>{
  const n=obj.name||'';
  if(n==='R49_Reverse_Grandstand'){
   obj.visible=at>=115;
   return;
  }
  // Rear-wall championship signage is beautiful from the front but turns
  // into a giant opaque near-camera blocker at 180 degrees.
  if(n.startsWith('3D_Championship_')){
   obj.visible=at<100;
   return;
  }
  if(n.startsWith('Gym_Side_Wall_')){
   obj.visible=at<58||!n.endsWith(String(side*11.5));
  }
  if(n==='Gym_Back_Wall'||n.startsWith('Grandstand_Back_Tier_')||
     n.startsWith('Grandstand_Riser_')||n.startsWith('Stadium_Seats_Instanced_')||
     n.startsWith('Stadium_Bleacher_Safety_Rail_')||
     n.startsWith('Stadium_Bleacher_Rail_Post_')||
     n.startsWith('Gym_Scoreboard_')){
   obj.visible=at<120;
  }
 });
}
let stadiumEvidence=null;
let duelEffects=null;
let comboDirector=null;
let liveScoreboard=null;
let spellImpact=null;
const spellSerials=new Set();
const hostHits={player:{time:-100,damage:0},ai:{time:-100,damage:0}};
let actualHostHits=0;
const pendingSpellUnitHits=[];
let podiumCards=null;
let absoluteSeconds=0;
let renderFrameTiming=0;
let choreographyQA={stride:0,guard:0,cameraOrbit:0,maxStride:0,maxOrbit:0};
let shownCards={player:[],ai:[]};
let shownUnits={player:[],ai:[]};
let pendingCombatEvents=null;
let summonPresence=null;
let summonModels=null;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ease=v=>{const t=clamp(v,0,1);return t*t*(3-2*t)};
const phaseValue=(t,a,b)=>ease((t-a)/(b-a));
const smoothPulse=(t,a,b,c,d)=>phaseValue(t,a,b)*(1-phaseValue(t,c,d));
function checkIncoming(payload){
 if(!payload||payload.type!=='ASDC_R45_FIGHT')return false;
 if(payload.actor!=='E01'||payload.target!=='G01'||!['live','demo'].includes(payload.mode))return false;
 if(payload.mode==='demo')return !payload.event&&payload.source==='INDEPENDENT_CORE_GENERATED_DEMO_NOT_CURRENT_MATCH';
 const e=payload.event;
 return e?.type==='exchange'&&e.from==='E01'&&e.to==='G01'&&e.side==='player'&&
  Number.isInteger(e.serial)&&e.serial>0&&[e.damage,e.blocked,e.retaliation,e.retaliation_blocked].every(x=>Number.isInteger(x)&&x>=0&&x<=99)&&
  payload.noRulesMutation===true;
}
function makeScene(){
 scene=new THREE.Scene();scene.background=new THREE.Color('#192b42');scene.fog=new THREE.Fog('#192b42',17,49);
 renderer=new THREE.WebGLRenderer({canvas:$('battle-canvas'),alpha:false,antialias:true,powerPreference:'high-performance'});
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.15;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
 camera=new THREE.PerspectiveCamera(36,1,.1,60);
 camera.position.set(0,2.9,8.7);camera.lookAt(0,1.29,0);
 scene.add(new THREE.HemisphereLight('#cddffe','#425769',1.40));
 const key=new THREE.DirectionalLight('#ffdfc3',2.70);
 key.position.set(-4,8,5);key.castShadow=true;key.shadow.mapSize.set(2048,2048);
 key.shadow.camera.left=-7;key.shadow.camera.right=7;key.shadow.camera.top=7;key.shadow.camera.bottom=-7;
 key.shadow.bias=-.00018;scene.add(key);
 const rim=new THREE.DirectionalLight('#a0c9fc',2.25);rim.position.set(5,6,-4);scene.add(rim);
 const fill=new THREE.DirectionalLight('#f7d6b9',.8);fill.position.set(3,3,6);scene.add(fill);
 // Fully volumetric gymnasium: no 2D painted scene behind the fighters.
 stadiumEvidence=createStadium(THREE,scene,{detail:'medium'});
 duelEffects=createDuelEffects(THREE,scene);
 // The R100 director uses only validated real engine.combo_effect payloads.
 // The 3D stadium, summoners, permanent VRMs and canonical rules stay intact.
 comboDirector=createComboDirector(THREE,scene,{
  caption:$('combo-caption'),skipButton:$('skip-combo')
 });
 liveScoreboard=createLiveStadiumScoreboard(THREE,scene);
 spellImpact=createSpellImpact(THREE,scene);
 podiumCards=createCardHolograms(THREE,scene);
  clock=new THREE.Clock();
 onResize();window.addEventListener('resize',onResize);
 installOrbitControls();
 const gl=renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');
 renderInfo=ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);
}
function onResize(){
 if(!renderer)return;
 const w=Math.max(1,window.innerWidth),h=Math.max(1,window.innerHeight);
 renderer.setSize(w,h,false);
 camera.aspect=w/h;
 const narrow=camera.aspect<.85;
 camera.fov=narrow?48:42;
 const tan=Math.tan(camera.fov*Math.PI/360);
 const extent=narrow?4.72:5.8;
 // Respect the visible safe region for BOTH card projections and side decks.
 // An orbit changes perspective but must never change the rules or actor IDs.
 orbitBaseDistance=Math.max(narrow?11.6:10.0,extent/(tan*camera.aspect*.94)+(narrow?.35:.85));
 camera.updateProjectionMatrix();
 horizontalFov=2*Math.atan(tan*camera.aspect)*180/Math.PI;
}

function indexBones(root){
 const m=new Map();let skins=0,vertices=0,bones=0;
 root.traverse(o=>{
  if(o.isBone){bones++;m.set(o.name,o);}
  if(o.isSkinnedMesh)skins++;
  if(o.isMesh){vertices+=o.geometry?.index?.count||o.geometry?.attributes.position?.count||0;
   o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;}
 });
 return{m,skins,vertices,bones};
}
function setBone(actor,part,x=0,y=0,z=0){
 const key='J_Bip_'+part;
 const o=actor.bones.get(key),base=actor.base.get(key);
 if(!o||!base)return;
 const delta=new THREE.Quaternion().setFromEuler(new THREE.Euler(x,y,z,'XYZ'));
 o.quaternion.copy(base).multiply(delta);
}

/* R45 embeds the exact source mesh and R20/R22 per-material character palette.
   Extra ornaments are artistic review-only accessories, not production rigs. */
function restoreR22Style(source,id,bones){
 const palette=id==='E01'?
  {hair:'#794660',top:'#eeb09e',bottom:'#35485c',shoes:'#f6b68f',iris:'#8cc8c7'}:
  {hair:'#344b5a',top:'#8db6ab',bottom:'#314b61',shoes:'#bdc0c7',iris:'#d4b7ad'};
 let recolored=0;
 const cached=new Map();
 source.traverse(o=>{
  if(!o.isMesh||!o.material)return;
  const mats=Array.isArray(o.material)?o.material:[o.material];
  let changed=false;
  const adjusted=mats.map(m=>{
   const n=(m.name||'').toUpperCase();
   const tone=n.includes('_HAIR')?palette.hair:n.includes('_TOPS_')?palette.top:
      n.includes('_BOTTOMS_')?palette.bottom:n.includes('_SHOES_')?palette.shoes:
      n.includes('_EYEIRIS_')?palette.iris:null;
   if(!tone)return m;
   changed=true;
   if(!cached.has(m.uuid)){
    const clone=m.clone();
    clone.name=(m.name||'')+'_R22_CHARACTER_PALETTE';
    clone.color?.set(tone);
    clone.needsUpdate=true;
    cached.set(m.uuid,clone);
   }
   return cached.get(m.uuid);
  });
  if(changed){o.material=Array.isArray(o.material)?adjusted:adjusted[0];recolored++;}
 });
 const accessory=[];
 const standard=(color,roughness=.55)=>new THREE.MeshStandardMaterial({color,roughness,metalness:.02,side:THREE.DoubleSide});
 function box(boneName,size,pos,color){
  const bone=bones.get('J_Bip_'+boneName);if(!bone)return null;
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),standard(color));
  mesh.position.set(...pos);mesh.castShadow=true;bone.add(mesh);
  accessory.push(mesh);return mesh;
 }
 function tube(boneName,points,radius,color){
  const bone=bones.get('J_Bip_'+boneName);if(!bone)return null;
  const c=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  const mesh=new THREE.Mesh(new THREE.TubeGeometry(c,24,radius,8,false),standard(color));
  mesh.castShadow=true;bone.add(mesh);accessory.push(mesh);return mesh;
 }
 if(id==='E01'){
  tube('C_Head',[[-.045,.16,0],[-.015,.3,.012],[.09,.37,.02],[.145,.29,.02]],.013,'#9e5664');
  const clip=box('C_Head',[.092,.017,.012],[-.09,.113,.119],'#f8d28d');if(clip)clip.rotation.z=-.25;
  tube('C_Chest',[[-.13,.09,.12],[-.08,-.05,.19],[.04,-.25,.19],[.13,-.36,.12]],.017,'#f7e3bc');
  const satchel=box('C_Hips',[.29,.27,.09],[.17,.01,.15],'#b46c54');
  if(satchel)satchel.rotation.z=.12;
  box('C_Hips',[.22,.045,.012],[.17,.03,.207],'#f7e3bc');
  box('L_Hand',[.085,.025,.16],[0,-.025,.045],'#edba85');
 }else{
  const mat=standard('#24374d',.3);
  for(const x of [-.078,.078]){
   const bone=bones.get('J_Bip_C_Head');
   if(!bone)continue;
   const mesh=new THREE.Mesh(new THREE.TorusGeometry(.067,.008,7,44),mat);
   mesh.position.set(x,.088,.128);mesh.scale.y=.77;
   bone.add(mesh);accessory.push(mesh);
  }
  tube('C_Head',[[-.012,.09,.128],[.012,.09,.128]],.008,'#24374d');
  tube('C_Chest',[[-.13,.045,.12],[-.005,-.13,.19],[.14,-.31,.13]],.02,'#b99c68');
  const bag=box('C_Hips',[.24,.32,.12],[-.17,-.035,.15],'#5d766a');
  if(bag)bag.rotation.z=-.12;
  box('C_Hips',[.21,.035,.014],[-.17,.015,.217],'#f7e3bc');
 }
 return{recolored,accessories:accessory.length,palette};
}

async function loadActor(spec,idx){
 const url=new URL('../assets/model/'+spec.source,location.href).href;
 const gltf=await new GLTFLoader().loadAsync(url);
 const original=gltf.scene;
 const faceExpressions=extractVrm0Expressions(gltf);
 const {m,skins,bones,vertices}=indexBones(original);
 const style=restoreR22Style(original,spec.id,m);
 if(skins<spec.minSkins||bones<spec.minBones||vertices<20000)
  throw Error(spec.id+' R22 identity mismatch: skins='+skins+' bones='+bones);
 const box=new THREE.Box3().setFromObject(original,true),dims=box.getSize(new THREE.Vector3());
 const scale=2.12/dims.y;
 const pivot=new THREE.Group(),character=new THREE.Group();
 original.scale.setScalar(scale);original.position.set(-(box.min.x+box.max.x)/2*scale,-box.min.y*scale,-(box.min.z+box.max.z)/2*scale);
 character.add(original);pivot.add(character);
 pivot.position.set(idx===0?-1.75:1.75,0,0);
 pivot.rotation.y=faceOpponentYaw(spec.id,idx===0?'player':'ai');
 pivot.visible=false;
 scene.add(pivot);
 const base=new Map();m.forEach((b,n)=>base.set(n,b.quaternion.clone()));
 // Very restrained color accents: preserve existing VRM source facial textures
 // and mesh identity; do not replace character geometry with generic proxy.
 const actor={id:spec.id,name:spec.name,source:spec.source,model:original,
  pivot,character,bones:m,base,skins,boneCount:bones,triangles:Math.round(vertices/3),style,
  restX:idx===0?-1.75:1.75,side:idx===0?'left':'right',faceExpressions};
 return actor;
}
function stageText(phase,details){
 if(phase!==activePhase){
  activePhase=phase;$('phase').textContent=PHASES[phase]||phase;
 }
 if(details)$('details').textContent=details;
}
function reactActor(a,sec,absoluteSec){
 const left=a.side==='left';
 const sign=left?1:-1;
 const approach=smoothPulse(sec,.8,1.5,3.55,4.7);
 const attack=left?smoothPulse(sec,2.1,2.43,2.85,3.16):
   smoothPulse(sec,3.17,3.43,3.8,4.08);
 const block=left?smoothPulse(sec,3.75,3.86,4.12,4.42):
   smoothPulse(sec,2.69,2.8,3.16,3.5);
 const hit=left?smoothPulse(sec,3.84,3.90,4.15,4.35):
   smoothPulse(sec,2.79,2.9,3.20,3.46);
 const idle=Math.sin(absoluteSec*1.43+(left?0:1.8))*.022;
 // A planted, alternating step cycle, driven only during approach/retreat.
 // Smoothly return the original source rig to rest between exchanges.
 const locomotion=smoothPulse(sec,.62,1.03,4.16,5.18);
 const walkPhase=sec*11.2+(left?0:Math.PI);
 const stride=.34*locomotion*Math.sin(walkPhase);
 const guard=.11*block;
 if(left){
  choreographyQA.stride=Number(stride.toFixed(4));
  choreographyQA.guard=Number(guard.toFixed(4));
  choreographyQA.maxStride=Math.max(choreographyQA.maxStride,Math.abs(stride));
 }
 a.pivot.position.x=a.restX+sign*(approach*.86+attack*.29-hit*.12);
 a.pivot.position.y=.016*Math.sin(absoluteSec*1.7+(left?0:2))+(attack*.065);
 a.pivot.rotation.y=faceOpponentYaw(a.id,left?'player':'ai')+sign*(attack*.20+block*.13);
 a.pivot.rotation.z=sign*(-attack*.11+hit*.16);
 a.character.rotation.x=attack*.10-hit*.14;
 a.character.rotation.z=sign*(-attack*.14+hit*.16);
 // Bone rotations are measured relative to this character's actual VRM rest
 // pose. Both characters retain unique mesh, skeleton, skin and face.
 setBone(a,'C_Spine',idle*.30,0,sign*(-attack*.12+hit*.15));
 setBone(a,'C_Chest',idle*.55-attack*.18+hit*.17,0,sign*(-attack*.12+hit*.16));
 setBone(a,'C_Head',idle*.6,0,sign*(-attack*.09+hit*.13));
 setBone(a,'R_UpperArm',-.95*attack-.28*block,0,-1.12+.35*attack);
 setBone(a,'R_LowerArm',-.60*attack-.2*block,0,-.08);
 setBone(a,'L_UpperArm',-.26*attack-.45*block,0,1.12-.25*attack);
 setBone(a,'L_LowerArm',-.25*block,0,.08);
 setBone(a,'L_UpperLeg',stride,0,0);
 setBone(a,'R_UpperLeg',-stride,0,0);
 setBone(a,'L_LowerLeg',Math.max(0,-stride)*.8,0,0);
 setBone(a,'R_LowerLeg',Math.max(0,stride)*.8,0,0);
 // Guard reads through the actual upper body rather than a proxy object.
 setBone(a,'C_LeftShoulder',0,0,guard*sign);
 if(attack>.03||hit>.03)actionFrames++;
 if(hit>.1)impactFrames++;
}
// A real spectator sees two ACTUAL players at their podiums from the start.
// They must be independent clones: the original VRMs can also be summoned
// as cards in the central arena, and SummonPresence must still own those.
function makeDuelistHosts(){
 duelistHosts=actors.map((actor,i)=>{
  const pivot=cloneSkeleton(actor.pivot);
  pivot.name='R74_PERMANENT_DUELIST_'+actor.id;
  pivot.position.set(i===0?-5.55:5.55,.48,.60);
  pivot.rotation.y=faceOpponentYaw(actor.id,i===0?'player':'ai');
  pivot.visible=true;scene.add(pivot);
  const {m,bones,skins}=indexBones(pivot),base=new Map();
  m.forEach((bone,key)=>base.set(key,bone.quaternion.clone()));
  if(skins<actor.skins||bones<actor.boneCount)
   throw Error('R74 permanent duelist clone lost source VRM skin/bones '+actor.id);
  const pose=createVrmTwoBonePose(THREE,pivot,actor.id);
  if(!pose)throw Error('R85 two-bone IK control missing for duelist '+actor.id);
  const face=createVrmCharacterActing(THREE,pivot,{id:actor.id,
   expressions:actor.faceExpressions,sourceRest:actor.base});
  return{id:actor.id,pivot,bones:m,base,pose,face,
   choreography:{phase:'idle',draw:0,display:0,cast:0,recoil:0},
   side:i===0?'player':'ai',baseX:pivot.position.x,
   sourceRig:actor.source,sourceBones:bones,skinnedMeshes:skins};
 });
}
// R85: A full-body, believable baseline for permanent podium duelists.
// We solve BOTH real shoulder-elbow-wrist chains every frame, including when
// no cards are played; old R74 only rolled shoulders, leaving open A/T arms.
const DUELIST_POSE_SPEC=Object.freeze({
 E01:{hold:{R:[.035,-.12,-.16],L:[-.14,-.27,-.06]},
  draw:{R:[.06,-.23,-.04],L:[-.11,-.16,-.12]},
  show:{R:[.13,.16,-.26],L:[-.17,-.12,-.17]},
  cast:{R:[.27,.13,-.31],L:[-.13,-.11,-.20]},
  guard:{R:[.07,.14,-.19],L:[-.14,.10,-.21]}},
 G01:{hold:{R:[.045,.12,-.18],L:[-.17,-.26,-.07]},
  draw:{R:[.05,-.23,-.05],L:[-.15,-.13,-.11]},
  show:{R:[.15,.19,-.25],L:[-.15,-.11,-.19]},
  cast:{R:[.30,.13,-.27],L:[-.12,-.10,-.22]},
  guard:{R:[.10,.17,-.17],L:[-.16,.12,-.19]}}
});
function updateDuelistHosts(seconds){
 const targetVector=new THREE.Vector3(),targetOut={R:[0,0,0],L:[0,0,0]};
 for(const host of duelistHosts){
  const side=host.side,gesture=hostAction[side],strike=hostHits[side];
  const age=seconds-gesture.started,hitAge=seconds-strike.time;
  const breath=Math.sin(seconds*1.18+(side==='player'?0:1.6));
  const glance=Math.sin(seconds*.52+(side==='player'?.4:2.1));
  const sign=side==='player'?1:-1;
  const draw=smoothPulse(age,.025,.21,.38,.74);
  const display=smoothPulse(age,.22,.51,1.15,1.60);
  const cast=smoothPulse(age,1.23,1.49,2.02,2.43);
  const recoil=smoothPulse(hitAge,.015,.12,.24,.74);
  // Periodic conversational, non-synchronized idle: glance at card hand,
  // shift weight, look up; no continuous waving or military marching.
  const beatSec=seconds+(side==='player'?1.5:4.9),beat=beatSec%9.7;
  const inspectCard=smoothPulse(beat,2.1,2.56,3.08,3.48)*
   (1-Math.max(draw,display,cast,recoil));
  const ambient=.014*breath;
  const actionStrength=Math.max(draw,display,cast,recoil);
  host.pivot.position.x=host.baseX+sign*.08*cast-sign*.13*recoil+
    .018*glance*(1-actionStrength);
  host.pivot.position.y=.48+.012*breath;
  host.pivot.rotation.y=faceOpponentYaw(host.id,side)+sign*(.11*display+.16*cast);
  host.pivot.rotation.z=-sign*.045*cast+sign*.115*recoil+.011*glance;
  // Facial blink and the source VRM blendshapes remain animated independently.
  host.face.update(seconds,{seed:side==='player'?.35:2.7,
   suppressEntrance:true,suppressGesture:true,
   // Trigger authentic VRM joy/fun morphs for card reveal/cast; during hits
   // return the face to neutral instead of smiling through damage.
   previewAmount:recoil>.12?0:Math.max(display*.46,cast*.68,inspectCard*.20)});
  setBone(host,'C_Spine',.014*breath-.07*cast+.09*recoil,0,
   sign*(.015*glance-.055*cast+.12*recoil));
  setBone(host,'C_Chest',.015*breath-.11*display-.17*cast+.16*recoil,
   sign*.055*display,sign*(-.065*cast+.10*recoil));
  setBone(host,'C_Head',-.030*inspectCard-.055*display-.10*cast+.125*recoil,
   sign*(.065*glance+.075*display),sign*.02*glance);
  setBone(host,'L_UpperLeg',.026*glance-.046*cast+.05*recoil,0,0);
  setBone(host,'R_UpperLeg',-.026*glance+.046*cast-.05*recoil,0,0);
  setBone(host,'L_LowerLeg',.014*cast,0,0);
  setBone(host,'R_LowerLeg',-.012*cast,0,0);
  // We restore BOTH source arm segments before IK, avoiding accumulating
  // twist from frame to frame or mixing cinematic and game idle rigs.
  for(const name of ['R_UpperArm','R_LowerArm','L_UpperArm','L_LowerArm']){
   const key='J_Bip_'+name,bone=host.bones.get(key),base=host.base.get(key);
   if(bone&&base)bone.quaternion.copy(base);
  }
  const specs=DUELIST_POSE_SPEC[host.id];
  for(const hand of ['R','L']){
   targetVector.set(...specs.hold[hand]);
   const idleShift=hand==='R'?.011*breath:-.009*breath;
   targetVector.y+=idleShift;
   if(hand==='R')targetVector.y+=.08*inspectCard;
   for(const [phase,amount] of [[specs.draw,draw],[specs.show,display],
      [specs.cast,cast],[specs.guard,recoil]]){
    targetVector.lerp(new THREE.Vector3(...phase[hand]),Math.min(1,amount));
   }
   targetOut[hand]=targetVector.toArray();
  }
  host.pose.applyTargets(targetOut,VRM_HERO_POSES[host.id].pole);
  host.choreography={phase:recoil>.1?'hit':cast>.1?'cast':
    display>.1?'show':draw>.1?'draw':inspectCard>.12?'inspect':'idle',
    draw:+draw.toFixed(3),display:+display.toFixed(3),
    cast:+cast.toFixed(3),recoil:+recoil.toFixed(3),
    inspected:+inspectCard.toFixed(3)};
 }
}
function inspectDuelistPosture(host){
 const measure=side=>{
  const base='J_Bip_'+side+'_';
  const upper=host.bones.get(base+'UpperArm'),elbow=host.bones.get(base+'LowerArm'),
   hand=host.bones.get(base+'Hand');
  if(!upper||!elbow||!hand)return null;
  const a=upper.getWorldPosition(new THREE.Vector3()),b=elbow.getWorldPosition(new THREE.Vector3()),
   w=hand.getWorldPosition(new THREE.Vector3()),upperDir=b.clone().sub(a).normalize();
  return {drop:+upperDir.y.toFixed(3),spread:+Math.abs(upperDir.x).toFixed(3),
   worldHand:w.toArray().map(v=>+v.toFixed(3)),
   wristToShoulder:+w.distanceTo(a).toFixed(3)};
 };
 return {phase:host.choreography.phase,...host.choreography,
  arms:{R:measure('R'),L:measure('L')},
  ik:host.pose.inspect().arms,face:host.face.inspect().mode};
}


function play(payload){
 if(!checkIncoming(payload))throw Error('R45 fight validation: only real E01 vs G01 roles accepted');
 currentPayload=structuredClone(payload);mode=payload.mode;playing=true;
 actors.forEach(a=>a.pivot.visible=true);
 time=0;hadContact=false;
 if(duelEffects){duelEffects.pulse('player',absoluteSeconds);duelEffects.pulse('ai',absoluteSeconds)}
 stageText('approach',mode==='demo'?'独立角色对打试演 · 不改变当前牌局':
  '来自真实对局 · 交锋事件 #'+payload.event.serial);
 const ev=payload.event;
 $('evidence').textContent=ev?
  '规则实算：伤害 '+ev.damage+' / 格挡 '+ev.blocked+' / 反击 '+ev.retaliation+' · 不重新扣血':
  '独立动作试演，非实际牌局 · 真实 E01 与 G01 源人物网格';
 $('replay').hidden=false;
}
function loop(){
 requestAnimationFrame(loop);
 if(!renderer||!ready)return;
 const delta=Math.min(.065,clock.getDelta());
 if(playing)time=Math.min(DURATION,time+delta);
 let t=time;
 if(t<1.4)stageText('approach');
 else if(t<2.4)stageText('windup');
 else if(t<3.13)stageText('strike');
 else if(t<4.22)stageText('counter');
 else if(t<5.25)stageText('retreat');
 else stageText('settled');
 absoluteSeconds+=delta;
 liveScoreboard?.update(performance.now());
 spellImpact?.update(absoluteSeconds);
 // All props update inside the 3D arena; 3 phases, then remove cleanly.
 comboDirector?.update(absoluteSeconds,reduced);
 const impactCombo=comboDirector?.drainImpact();
 if(impactCombo)reply('ASDC_R100_COMBO_IMPACT',impactCombo);
 const finishedCombo=comboDirector?.drainDone();
 if(finishedCombo)reply('ASDC_R100_COMBO_DONE',finishedCombo);
 for(let i=pendingSpellUnitHits.length-1;i>=0;i--){
  const pending=pendingSpellUnitHits[i];
  if(absoluteSeconds<pending.due)continue;
  pendingSpellUnitHits.splice(i,1);
  summonPresence?.reactToSpell?.(pending.side,pending.uids,absoluteSeconds);
 }
 actors.forEach(a=>reactActor(a,t,absoluteSeconds));
 updateDuelistHosts(absoluteSeconds);
 duelEffects?.update({absoluteSec:absoluteSeconds,fightTime:t,playing,
   visible:actors.map(a=>a.pivot.visible),
   reducedMotion:reduced});
 podiumCards?.update(absoluteSeconds,playing,camera.aspect<.95);
 summonPresence?.update(absoluteSeconds,camera,{cinematic:playing});
 // Deliberate single slow push-in during actual contact. No shake or
 // random camera jitter. Stays inside the same view and card layout.
 const narrow=camera.aspect<.85;
 const push=playing?(phaseValue(t,1.90,2.75)*(1-phaseValue(t,4.25,5.55))):0;
 orbitYaw+=(orbitTargetYaw-orbitYaw)*(1-Math.exp(-delta*8));
 const angle=orbitYaw*Math.PI/180;
 // World-space orbital viewpoint with a dynamically fitted camera distance.
 // A restrained, deterministic push maintains the R47 cinematic style.
 // At diagonal angles the projected character footprint grows. Ease the
 // orbit radius rather than cropping an actor or altering its world scale.
 const diagonalFit=1+.14*Math.abs(Math.sin(2*angle));
 const distance=orbitBaseDistance*orbitZoom*diagonalFit-push*(narrow?.10:.25);
 const arc=playing&&!reduced?Math.sin(Math.PI*clamp((t-1.5)/3.6,0,1))*(narrow?.035:.11):0;
 // R49: elevate the camera and aim into the gym, not at empty sky.
 // Orbit about the same center of action; pitch stays consistent as yaw changes.
 const height=(narrow?7.65:Math.max(8.35,distance*.66));
 camera.position.set(Math.sin(angle)*distance+Math.cos(angle)*arc,
  height+push*.055,CAMERA_LOOK_AT.z+Math.cos(angle)*distance-Math.sin(angle)*arc);
 choreographyQA.cameraOrbit=Number(arc.toFixed(4));
 choreographyQA.maxOrbit=Math.max(choreographyQA.maxOrbit,Math.abs(arc));
 camera.lookAt(CAMERA_LOOK_AT.x,CAMERA_LOOK_AT.y+push*.07,CAMERA_LOOK_AT.z);
 keepArenaVisible();
 const contact=t>=2.83&&t<3.11||t>=3.88&&t<4.15;
 $('impact').hidden=!playing||!contact;
 $('impact').textContent=t<3.5?(currentPayload?.event?
  '命中 · '+currentPayload.event.damage+'伤害':'攻击命中'):
  (currentPayload?.event?'反击 · '+currentPayload.event.retaliation:'反击');
 if(contact)hadContact=true;
 if(playing&&time>=DURATION){
  playing=false;time=0;
  summonPresence?.sync(shownUnits);
  if(pendingCombatEvents){
   summonPresence?.startSequence(pendingCombatEvents,absoluteSeconds);
   pendingCombatEvents=null;
  }
  stageText('idle','双方待命 · 真实三维竞技场');
 }
 renderer.render(scene,camera);frames++;drawCount=renderer.info.render.calls;
}
function reply(type,other={}){
 if(window.parent!==window)window.parent.postMessage({
  type,roles:['E01','G01'],roleAssets:actors.map(a=>a.source),
  previewArtApproved:false,...other
 },window.location.origin);
}
function onMessage(ev){
 if(ev.source!==window.parent||ev.origin!==location.origin||!ready)return;
 const msg=ev.data;
 if(msg?.type==='ASDC_R53_HP_MODE'){
  summonPresence?.setHpDisplayMode(msg.mode);
  return;
 }
 if(msg?.type==='ASDC_R48_CAMERA_SET'){
  setOrbit(Number(msg.degrees));return;
 }
 if(msg?.type==='ASDC_R48_CAMERA_DELTA'){
  setOrbit(orbitTargetYaw+Number(msg.degrees));return;
 }
 if(msg?.type==='ASDC_R100_COMBO_RESET'){
  comboDirector?.reset();return;
 }
 if(msg?.type==='ASDC_R100_REAL_COMBO'){
  const accepted=comboDirector?.play(msg.event,absoluteSeconds,msg.chapter)===true;
  reply('ASDC_R100_COMBO_ACCEPTED',{accepted,
    serial:msg.event?.serial??null,effect:msg.event?.effect??null});
  return;
 }
 if(msg?.type==='ASDC_R81_SCORE'){
  liveScoreboard?.setState(msg,performance.now());
  return;
 }
 if(msg?.type==='ASDC_R81_HIT_HOST'){
  if(['player','ai'].includes(msg.side)&&Number.isInteger(msg.damage)&&msg.damage>0&&msg.damage<=20){
   hostHits[msg.side]={time:absoluteSeconds,damage:msg.damage};
   actualHostHits++;
   duelEffects?.pulse(msg.side,absoluteSeconds);
  }
  return;
 }
 if(msg?.type==='ASDC_R81_SPELL_RESULT'){
  // Only rule-emitted card identifiers and serials are permitted; this layer
  // displays the authoritative result but cannot mutate HP or winner.
  if(!Number.isInteger(msg.serial)||msg.serial<=0||spellSerials.has(msg.serial))return;
  const accepted=spellImpact?.play(msg,absoluteSeconds);
  if(!accepted)return;
  spellSerials.add(msg.serial);
  if(spellSerials.size>500)spellSerials.clear();
  const victim=msg.side==='player'?'ai':'player';
  const uids=Array.isArray(msg.targetUids)?
   msg.targetUids.filter(uid=>typeof uid==='string'&&/^U\d+$/.test(uid)).slice(0,5):[];
  if(uids.length)pendingSpellUnitHits.push({side:victim,uids,due:absoluteSeconds+.46});
  if(Number.isInteger(msg.directDamage)&&msg.directDamage>0){
   hostHits[victim]={time:absoluteSeconds+.46,damage:msg.directDamage};
   actualHostHits++;
  }
  return;
 }
 if(msg?.type==='ASDC_R51_COMBAT_EVENTS'){
  let ok=false;
  if(playing){
   pendingCombatEvents=msg;ok=true;
  }else ok=summonPresence?.startSequence(msg,absoluteSeconds)||false;
  reply('ASDC_R51_COMBAT_ACCEPTED',{accepted:ok,deferred:playing,count:msg.events?.length||0});
  return;
 }
 if(msg?.type==='ASDC_R46_CARD_PLAY'){
  if(['player','ai'].includes(msg.side)&&['unit','spell'].includes(msg.kind))
   hostAction[msg.side]={started:absoluteSeconds,kind:msg.kind};
  podiumCards?.show(msg,absoluteSeconds);
  return;
 }
 if(msg?.type==='ASDC_R45_BOARD'){
  if(!Array.isArray(msg.player)||!Array.isArray(msg.ai))return;
  const validId=id=>typeof id==='string'&&/^[EGTM][0-9]{2}$/.test(id);
  const safe=list=>list.filter(validId).slice(0,5);
  const wasShown=structuredClone(shownCards);
  shownCards={player:safe(msg.player),ai:safe(msg.ai)};
  const unitsFor=side=>{
   const raw=Array.isArray(msg.units?.[side])?msg.units[side]:shownCards[side].map((id,i)=>({id,uid:'LEGACY'+i}));
   return raw.filter(u=>u&&validId(u.id)&&typeof u.uid==='string'&&/^(U\d+|LEGACY\d+)$/.test(u.uid)).slice(0,5);
  };
  shownUnits={player:unitsFor('player'),ai:unitsFor('ai')};
  for(const side of ['player','ai']){
   if(shownCards[side].some((id,i)=>id!==wasShown[side][i]))
    duelEffects?.pulse(side,absoluteSeconds);
  }
  summonPresence?.sync(shownUnits,{cinematic:playing});
  return;
 }
 if(!checkIncoming(msg))return;
 play(msg);
 reply('ASDC_R45_FIGHT_ACCEPTED',{mode:msg.mode,serial:msg.event?.serial??null});
}
window.addEventListener('message',onMessage);
$('replay').addEventListener('click',()=>{
 if(currentPayload)play(currentPayload);
});
function exposeQA(){
 Object.defineProperty(window,'__r45SceneQA',{value:{
  get ready(){return ready},
  get shownCards(){return structuredClone(shownCards)},
  get summonPresence(){return summonPresence?.inspect(camera)||null},
  get summonModels(){return summonModels?[...summonModels.values()].map(x=>({id:x.id,file:x.selectedFile||x.spec.file,baselineFile:x.spec.file,meshes:x.meshes,clips:x.clips.length,scale:x.scale,measured:x.measured})):[];},
  get combatEvents(){return summonPresence?.sequenceStats()||null},
  get spellReactions(){return summonPresence?.spellReactions||0},
  get scoreboard(){return liveScoreboard?.stats||null},
  get spellImpact(){return spellImpact?.stats||null},
  get comboDirector(){return comboDirector?.stats||null},
  get hostHits(){return structuredClone(hostHits)},
  get actualHostHits(){return actualHostHits},
  get actorVisibility(){return actors.map(a=>({id:a.id,visible:a.pivot.visible}))},
  get duelistHosts(){return duelistHosts.map(a=>({id:a.id,side:a.side,visible:a.pivot.visible,
    x:Number(a.pivot.position.x.toFixed(3)),y:Number(a.pivot.position.y.toFixed(3)),
    z:Number(a.pivot.position.z.toFixed(3)),bones:a.sourceBones,skins:a.skinnedMeshes,
    posture:inspectDuelistPosture(a),expression:a.face.inspect()}))},
  get duelistAction(){return structuredClone(hostAction)},

  get roles(){return actors.map(a=>({id:a.id,name:a.name,asset:a.source,
   bones:a.boneCount,skinnedMeshes:a.skins,triangles:a.triangles,
   recoloredMeshes:a.style.recolored,accessories:a.style.accessories}))},
  get sourceMatchesR22(){return source3DAssetsVerified},
  get renderer(){return renderInfo},
  get stadium(){return stadiumEvidence?.stats||null},
  get effects(){return duelEffects?.stats||null},
  get podiumCards(){return podiumCards?.stats||null},
  get cameraDistance(){return camera?.position.distanceTo(new THREE.Vector3(0,1.3,0))||null},
  get framing(){return cameraFrameStats()},
  get occlusion(){
    const sign=stadiumEvidence?.group?.getObjectByName('3D_Championship_Sign_Actual_Framed_Box');
    const reverse=stadiumEvidence?.group?.getObjectByName('R49_Reverse_Grandstand');
    return {championshipVisible:sign?.visible??null,reverseVisible:reverse?.visible??null};
  },
  get choreography(){return {...choreographyQA}},
  get frameCount(){return frames},
  get actionFrameCount(){return actionFrames},
  get impactFrames(){return impactFrames},
  get drawCalls(){return drawCount},
  get seconds(){return time},
  get mode(){return mode},
  get active(){return playing},
  get phase(){return activePhase},
  get hadContact(){return hadContact},
  get payload(){return currentPayload?structuredClone(currentPayload):null},
  get actorPositions(){return actors.map(a=>({id:a.id,x:Number(a.pivot.position.x.toFixed(3))}))},
  playDemo(){play({type:'ASDC_R45_FIGHT',mode:'demo',actor:'E01',target:'G01',
   source:'INDEPENDENT_CORE_GENERATED_DEMO_NOT_CURRENT_MATCH'});}
 }});
}
try{
 makeScene();
 actors=await Promise.all(MODEL_SPECS.map(loadActor));
 source3DAssetsVerified=actors[0].source==='Shino-original-CC0.vrm'&&
  actors[1].source==='Fumiriya-original-CC0.vrm'&&actors[0].boneCount>=140&&actors[1].boneCount>=100;
 if(!source3DAssetsVerified)throw Error('R22 original VRM identity gate failed');
 makeDuelistHosts();
 summonModels=await preloadSummonModels(THREE,new GLTFLoader());
 summonPresence=createSummonPresence(THREE,scene,{actors,prototypes:summonModels});
 // Do not signal scene readiness before Chrome actually paints the first
 // GL frame. The old timing leaked an all-white first-frame compositor image.
 stageText('idle','12 种三维召唤实体与体育馆已载入 · 待命');
 exposeQA();
 const warmupStarted=performance.now();
 let warmupFrames=0;
 // Headless Vulkan's first visible compositor image can remain white for
 // ~400-600ms even though GL has rendered. Keep the in-scene loading cover
 // until the presentation surface has had time to acquire painted frames.
 do {
  await new Promise(resolve=>requestAnimationFrame(()=>{
   renderer.render(scene,camera);
   resolve();
  }));
  warmupFrames++;
 } while((performance.now()-warmupStarted<850||warmupFrames<7)&&warmupFrames<95);
 $('loading').hidden=true;
 ready=true;
 reply('ASDC_R45_SCENE_READY',{originalVRMRigs:actors.length,
  loadedSummonGlbs:summonModels.size,unit3dKinds:14,finalArtApproved:false});
 broadcastCamera();
 requestAnimationFrame(loop);
 if(PARAMS.get('preview')==='1')window.__r45SceneQA.playDemo();
}catch(e){
 console.error('R45_SCENE_MODEL_LOAD_FAILED',e);
 // Never pretend a partially loaded arena is ready. Show a playable recovery
 // action instead of leaving the player stuck with an unclickable error.
 const loading=$('loading');
 loading.dataset.error='true';
 const message=document.createElement('div');
 message.className='load-error';
 message.textContent='三维资源加载失败，游戏已暂停出牌以避免错误。'+
  String(e.message||e).slice(0,240);
 const retry=document.createElement('button');
 retry.id='retry-scene';
 retry.type='button';
 retry.textContent='↻ 重新加载三维场景';
 retry.addEventListener('click',()=>location.reload());
 loading.replaceChildren(message,retry);
 reply('ASDC_R45_SCENE_FAILED',{retryAvailable:true,modelReady:false});
}
