/**
 * R45 verified card-identity fighter and one-stadium renderer.
 * Models are the SAME BASE VRM MESHES as R22's E01/G01 models, not the
 * old low-detail proxy rigs.
 * Visual-only choreography; canonical core.mjs owns all damage and winners.
 */
import * as THREE from 'three';
import {r125VersionedAssetURL} from '../r125-asset-urls.mjs';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from '../assets/meshopt/meshopt_decoder.mjs';
import {clone as cloneSkeleton} from 'three/addons/utils/SkeletonUtils.js';
import {extractVrm0Expressions,createVrmCharacterActing} from './vrm-character-acting.mjs';
import {r134HostIdleBeat} from './r134-host-idle-stage.mjs';
import {createVrmTwoBonePose,VRM_HERO_POSES} from './vrm-hero-pose-ik.mjs';
import {createStadium} from './stadium.mjs';
import {contactStep} from './foot-contact.mjs';
import {createDuelEffects} from './duel-effects.mjs';
import {createComboDirector} from './combo-director.mjs';
import {createComedySpectacle} from './comedy-spectacle.mjs';
import {BY_ID} from '../engine.mjs';
import {createLiveStadiumScoreboard} from './live-scoreboard.mjs';
import {createSpellImpact} from './spell-impact.mjs';
import {createMagicArsenal} from './magic-arsenal.mjs';
import {describeSpellContact} from './spell-response-contract.mjs';
import {createSpellContactFX} from './spell-contact-fx.mjs';
import {chooseCrowdAccident} from './spectator-chaos-contract.mjs';
import {createSpectatorChaosFX} from './spectator-chaos-fx.mjs';
import {createBleacherPropComedy,resolveSpectatorProp} from './bleacher-prop-comedy.mjs';
import {createElementalVfx} from './elemental-vfx.mjs';
import {createCardHolograms} from './card-holograms.mjs';
import {createHandPlayCards} from './hand-play-cards.mjs';
import {createSummonPresence} from './summon-presence.mjs';
import {faceOpponentYaw} from './summon-orientation.mjs';
import {preloadSummonModels} from './summon-models.mjs';
import {createLivingCastDirector} from './living-cast-director.mjs';
import {createArenaLifeWorld} from './arena-life-world.mjs';
const $=id=>document.getElementById(id);
const PARAMS=new URLSearchParams(location.search);
const R134_HOST_IDLE_ENABLED=(()=>{
 const local=PARAMS.get('r134Hosts');
 if(local==='off'||local==='on')return local==='on';
 try{return window.parent===window||
  new URLSearchParams(window.parent.location.search).get('r134Hosts')!=='off';}
 catch{return true;}
})();
const R131_IS_QA=()=>PARAMS.get('qa')==='1'||(()=>{
 try{return window.parent!==window&&new URLSearchParams(window.parent.location.search).get('qa')==='1';}
 catch{return false;}
})();
const MODEL_SPECS=[
 {id:'E01',name:'铃声追不上',source:'Shino-original-CC0.vrm',minBones:140,minSkins:60,color:'#fc9e73'},
 {id:'G01',name:'橡皮筋建筑师',source:'Fumiriya-original-CC0.vrm',minBones:100,minSkins:90,color:'#92b6eb'}
];
// R105 independent CC0 podium personas. These never appear as summoned cards,
// and retain full VRM 0.x J_Bip arm IK and face blendshapes.
const HOST_MODEL_SPECS=[
 {id:'E01',name:'我方决斗者',source:'Host-HairSample_Female-CC0.vrm',
  minBones:100,minSkins:2,host:true},
 {id:'G01',name:'对方决斗者',source:'Host-HairSample_Male-CC0.vrm',
  minBones:80,minSkins:2,host:true}
];
const TOTAL_REAL_ASSETS=16;
const loadingStartedAt=performance.now();
window.__ASDC_LOAD_METRICS={modelsVerified:0,modelReadyMs:null,firstFrameReadyMs:null,downloadedBytes:0,knownTotalBytes:0};
const PHASES={idle:'人物就位',approach:'双方接近',windup:'蓄力',strike:'我方攻击',
 counter:'对方反击',retreat:'双方回位',settled:'本次交锋完成'};
const DURATION=6.45;
let renderer,scene,camera,clock,actors=[],time=0,playing=false,mode='demo';
// Separate, continuously visible native VRM duelists; the E01/G01 summon
// bodies remain independently owned by SummonPresence in the arena.
let duelistHosts=[],hostSourceActors=[];
const arenaLife=createArenaLifeWorld(Number(PARAMS.get('seed'))||20261113);
const livingCast=createLivingCastDirector(Number(PARAMS.get('seed'))||20261113,arenaLife);
const hostAction={player:{started:-100,kind:'idle'},ai:{started:-100,kind:'idle'}};
// R122: REAL Qwen voice playback only (not subtitles) drives real VRM
// mouth morphs. Each side independently owns its own original face mesh.
const hostSpeech={player:null,ai:null};
const hostSpeechSeen={player:0,ai:0};
const speechQA={started:0,stopped:0,ignored:0};
// R121 secondary physical camera: an actual 3D cinematic inset of the
// original child, with its source facial morphs and wrist-bound painted card.
// Main wide stadium composition and manual user orbit remain untouched.
const heroCamera=new THREE.PerspectiveCamera(43,1,.10,90);
// R124: show only the current podium performer in the cinematic inset.
// The wide camera stays on layer 0; no low-poly proxy replaces the real VRM.
// The game embeds scene/ as a same-origin iframe. Read the rollout
// override from either frame so ?r124Quality=legacy is a real rollback.
const r124Legacy=PARAMS.get('r124Quality')==='legacy'||(()=>{
 try{return window.parent!==window&&
   new URLSearchParams(window.parent.location.search).get('r124Quality')==='legacy'}
 catch{return false}
})();
heroCamera.layers.set(r124Legacy?0:1);
let heroLayerSide=null,heroInsetDraws=0,shadowPassRequests=0,shadowAccumulator=0;
const r124Mobile=()=>window.innerWidth<700&&(window.devicePixelRatio||1)>=1.5;
const r124PixelRatio=()=>Math.min(window.devicePixelRatio||1,
 r124Legacy?1.5:r124Mobile()?1.2:1.5);
let heroLens={side:null,phase:'idle',frames:0,visible:false,
  inset:null,faceNdc:null,lastDrawCalls:0};
let heroResult={winner:null,started:-100};

let lastTime=0,frames=0,actionFrames=0,impactFrames=0,drawCount=0,renderInfo=null;
let currentPayload=null,activePhase='idle',ready=false,hadContact=false;
let lastSourceIds=[],source3DAssetsVerified=false;
let horizontalFov=0;
let orbitYaw=0, orbitTargetYaw=0, orbitZoom=1, orbitBaseDistance=12;
// R131 source-art review: a separate QA-only 3/4 close camera, never a
// change to the released duel camera or normal player orbit.
let r131QaCloseup=null,r131QaAngle=Math.PI*.32;
const CAMERA_LOOK_AT=new THREE.Vector3(0,.68,-1.65);
// R104 frontal camera: actors must be legible, not top-down chess pieces.
// The R49 venue overview (8.35 units high) was an art direction regression.
const FRONT_PITCH_DESKTOP=.28; // ~15.6°; near human audience sightline
const FRONT_PITCH_PORTRAIT=.255; // preserve overview on narrow screens
const legacyCamera=(()=>{
 const v=PARAMS.get('r104Camera');
 if(v==='old'||v==='new')return v==='old';
 try{return window.parent!==window&&new URLSearchParams(window.parent.location.search).get('r104Camera')==='old'}
 catch{return false}
})();

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
 const realDuelistBounds=duelistHosts.map(host=>{
  const b=new THREE.Box3().setFromObject(host.pivot,true),corners=[];
  for(const x of [b.min.x,b.max.x])
   for(const y of [b.min.y,b.max.y])
    for(const z of [b.min.z,b.max.z])
     corners.push(new THREE.Vector3(x,y,z).project(camera));
  const rect={
   left:Math.min(...corners.map(v=>v.x)),
   right:Math.max(...corners.map(v=>v.x)),
   bottom:Math.min(...corners.map(v=>v.y)),
   top:Math.max(...corners.map(v=>v.y))};
  return{side:host.side,id:host.id,
   screenRect:Object.fromEntries(Object.entries(rect).map(([k,v])=>[k,Number(v.toFixed(3))])),
   fullyVisible:rect.left>-1&&rect.right<1&&rect.top<1&&rect.bottom>-1};
 });
 return{yaw:Number(orbitYaw.toFixed(2)),targetYaw:orbitTargetYaw,
  realDuelistBounds,
  distance:Number(camera.position.distanceTo(new THREE.Vector3(0,1.3,0)).toFixed(2)),
  aspect:Number(camera.aspect.toFixed(3)),
  podiums:{player:ndc(-edge),ai:ndc(edge)},
  composition:{
   ring:new THREE.Vector3(0,.07,0).project(camera).toArray().map(v=>Number(v.toFixed(3))),
   arenaBack:new THREE.Vector3(0,1.2,-7).project(camera).toArray().map(v=>Number(v.toFixed(3))),
   stageFloor:new THREE.Vector3(0,.07,4).project(camera).toArray().map(v=>Number(v.toFixed(3))),
   lookAt:CAMERA_LOOK_AT.toArray(),
   cameraY:Number(camera.position.y.toFixed(2)),
   cameraPitchDeg:Number((Math.atan2(camera.position.y-(CAMERA_LOOK_AT.y),
     Math.hypot(camera.position.x-CAMERA_LOOK_AT.x,camera.position.z-CAMERA_LOOK_AT.z))*180/Math.PI).toFixed(2)),
   frontalCharacterStaging:!legacyCamera
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
let comedySpectacle=null;
let liveScoreboard=null;
let spellImpact=null,magicArsenal=null,elementalVfx=null,spellContactFX=null,spectatorChaosFX=null,bleacherProps=null;
const spellSerials=new Set();
const hostHits={player:{time:-100,damage:0},ai:{time:-100,damage:0}};
let actualHostHits=0;
let r121ContactReceipts=0,r122AccidentReceipts=0;
let crowdCloseup=null,r123ReactionCuts=0,r123ShotWeight=0;
const pendingSpellContacts=[];
const pendingCrowdAccidents=[];
let podiumCards=null,handCards=null;
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
 // R124: cache the last directional shadow between scheduled updates; the
 // second camera must NEVER render the whole shadow atlas a second time.
 renderer.shadowMap.autoUpdate=r124Legacy;renderer.shadowMap.needsUpdate=!r124Legacy;
 renderer.setPixelRatio(r124PixelRatio());
 camera=new THREE.PerspectiveCamera(36,1,.1,60);
 camera.position.set(0,4.1,9.0);camera.lookAt(CAMERA_LOOK_AT);
 const ambient=new THREE.HemisphereLight('#cddffe','#425769',1.40);
 ambient.layers.enable(1);scene.add(ambient);
 const key=new THREE.DirectionalLight('#ffdfc3',2.70);
 key.position.set(-4,8,5);key.castShadow=true;key.layers.enable(1);
 key.shadow.mapSize.set(!r124Legacy&&r124Mobile()?1024:2048,!r124Legacy&&r124Mobile()?1024:2048);
 key.shadow.camera.left=-7;key.shadow.camera.right=7;key.shadow.camera.top=7;key.shadow.camera.bottom=-7;
 key.shadow.bias=-.00018;scene.add(key);
 const rim=new THREE.DirectionalLight('#a0c9fc',2.25);rim.position.set(5,6,-4);rim.layers.enable(1);scene.add(rim);
 const fill=new THREE.DirectionalLight('#f7d6b9',.8);fill.position.set(3,3,6);fill.layers.enable(1);scene.add(fill);
 // Fully volumetric gymnasium: no 2D painted scene behind the fighters.
 stadiumEvidence=createStadium(THREE,scene,{detail:'medium',lifeWorld:arenaLife});
 duelEffects=createDuelEffects(THREE,scene);
 // The R100 director uses only validated real engine.combo_effect payloads.
 // The 3D stadium, summoners, permanent VRMs and canonical rules stay intact.
 comboDirector=createComboDirector(THREE,scene,{
  caption:$('combo-caption'),skipButton:$('skip-combo')
 });
 comedySpectacle=createComedySpectacle(THREE,scene);
 $('skip-combo').addEventListener('click',()=>{
  summonPresence?.clearComicCombo();
  comedySpectacle?.clear();
 });
 liveScoreboard=createLiveStadiumScoreboard(THREE,scene);
 spellImpact=createSpellImpact(THREE,scene);
 magicArsenal=createMagicArsenal(THREE,scene,{reducedMotion:reduced});
 elementalVfx=createElementalVfx(THREE,scene,{reducedMotion:reduced});
 spellContactFX=createSpellContactFX(THREE,scene,{reducedMotion:reduced});
 spectatorChaosFX=createSpectatorChaosFX(THREE,scene,{reducedMotion:reduced});
 bleacherProps=createBleacherPropComedy(THREE,scene,{reducedMotion:reduced});
 podiumCards=createCardHolograms(THREE,scene);
 handCards=createHandPlayCards(THREE,scene);
  clock=new THREE.Clock();
 onResize();window.addEventListener('resize',onResize);
 installOrbitControls();
 const gl=renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');
 renderInfo=ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);
}
function onResize(){
 if(!renderer)return;
 const w=Math.max(1,window.innerWidth),h=Math.max(1,window.innerHeight);
 // Retina phones can shade 2.25x more pixels without improving the card
 // rules. Keep a crisp 1.2x mobile image and the full desktop presentation.
 if(renderer.getPixelRatio()!==r124PixelRatio())renderer.setPixelRatio(r124PixelRatio());
 renderer.setSize(w,h,false);
 camera.aspect=w/h;
 const narrow=camera.aspect<.85;
 camera.fov=narrow?48:42;
 const tan=Math.tan(camera.fov*Math.PI/360);
 const extent=narrow?4.72:5.8;
 // Respect the visible safe region for BOTH card projections and side decks.
 // An orbit changes perspective but must never change the rules or actor IDs.
 // Both real VRM duelists stand on x=+/-5.55 podiums. R49 only fitted
 // +/-4.45 and the lower R104 eye-line exposed that cropping bug.
 // Fit ALL actual visible performers with a modest safety margin, on phone too.
 orbitBaseDistance=Math.max(narrow?11.6:10.0,
  extent/(tan*camera.aspect*.94)+(narrow?.35:.85))*
  (legacyCamera?1:1.30);
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

// Distinct original-color stories for the two *operators*, applied only to
// licensed source garments/hair, never generic geometry stand-ins or card units.
function styleHostAvatar(source,id){
 const palette=id==='E01'?
  {tops:'#ef826d',bottoms:'#552f55',shoes:'#f0a45e',hair:'#63415d'}:
  {tops:'#285d89',bottoms:'#27354e',shoes:'#a7d6ec',hair:'#614334'};
 let recolored=0;
 const variants=new Map();
 source.traverse(node=>{
  if(!node.isMesh||!node.material)return;
  const adapt=mat=>{
   const n=(mat.name||'').toLowerCase();
   const key=n.includes('_tops_')?'tops':n.includes('_bottoms_')?'bottoms':
    n.includes('_shoes_')?'shoes':n.includes('_hair_')?'hair':null;
   if(!key)return mat;
   if(!variants.has(mat.uuid)){
    const copy=mat.clone();
    copy.color?.set(palette[key]);
    copy.name=(mat.name||'')+'_R105_DISTINCT_HOST';
    variants.set(mat.uuid,copy);recolored++;
   }
   return variants.get(mat.uuid);
  };
  node.material=Array.isArray(node.material)?node.material.map(adapt):adapt(node.material);
 });
 return{recolored,accessories:0,palette};
}
async function loadActor(spec,idx,onTransfer){
 const url=r125VersionedAssetURL(new URL('../assets/model/'+spec.source,location.href)).href;
 const gltf=await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(
  url,event=>onTransfer?.(url,event));
 const original=gltf.scene;
 const faceExpressions=extractVrm0Expressions(gltf);
 const {m,skins,bones,vertices}=indexBones(original);
 const style=spec.host?styleHostAvatar(original,spec.id):restoreR22Style(original,spec.id,m);
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
// Two podium humans now use *different* genuine CC0 source VRMs from the
// 14 summon identities. Never clone E01/G01 cards as their operators.
function makeDuelistHosts(){
 if(hostSourceActors.length!==2||hostSourceActors.some(h=>
    actors.some(unit=>unit.source===h.source)))
  throw Error('R105 host/source identity collision');
 duelistHosts=hostSourceActors.map((actor,i)=>{
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
   sourceRig:actor.source,hostAvatar:i===0?'HOST_FEMALE':'HOST_MALE',sourceBones:bones,skinnedMeshes:skins};
 });
}
// R85: A full-body, believable baseline for permanent podium duelists.
// We solve BOTH real shoulder-elbow-wrist chains every frame, including when
// no cards are played; old R74 only rolled shoulders, leaving open A/T arms.
const DUELIST_POSE_SPEC=Object.freeze({
 // Expressive children: source VRM IK wrist positions relative to the
 // actual chest. Raise the illustrated card above shoulder/head height,
 // snap it forward, then recoil. No proxy limbs / no detached card hologram.
 E01:{hold:{R:[.035,-.12,-.16],L:[-.14,-.27,-.06]},
  draw:{R:[.075,-.26,-.01],L:[-.12,-.08,-.11]},
  show:{R:[.55,.43,-.45],L:[-.15,.12,-.20]},
  cast:{R:[.50,.31,-.39],L:[-.10,.30,-.22]},
  guard:{R:[.11,.32,-.16],L:[-.16,.23,-.23]},
  victory:{R:[.13,.64,-.15],L:[-.23,.52,-.16]},
  defeat:{R:[.08,.36,-.07],L:[-.11,.35,-.07]}},
 G01:{hold:{R:[.045,.12,-.18],L:[-.17,-.26,-.07]},
  draw:{R:[.06,-.26,-.01],L:[-.16,-.13,-.09]},
  show:{R:[.52,.48,-.43],L:[-.25,.28,-.16]},
  cast:{R:[.54,.36,-.37],L:[-.04,.18,-.19]},
  guard:{R:[.12,.35,-.15],L:[-.20,.25,-.18]},
  victory:{R:[.25,.70,-.10],L:[-.20,.43,-.12]},
  defeat:{R:[.10,.37,-.08],L:[-.10,.35,-.08]}}
});
function updateDuelistHosts(seconds){
 const ageOf=side=>seconds-hostAction[side].started;
 const hitAgeOf=side=>seconds-hostHits[side].time;
 const busy=side=>(ageOf(side)>=0&&ageOf(side)<2.6)||
  (hitAgeOf(side)>=0&&hitAgeOf(side)<.9);
 const ambientActs=livingCast.update(seconds,{
  busyPlayer:busy('player'),busyAi:busy('ai'),reduced});
 for(const line of livingCast.drainDialogue())
  reply('ASDC_R112_DIALOGUE',line);
 const targetVector=new THREE.Vector3(),targetOut={R:[0,0,0],L:[0,0,0]};
 for(const host of duelistHosts){
  const side=host.side,gesture=hostAction[side],strike=hostHits[side];
  const age=seconds-gesture.started,hitAge=seconds-strike.time;
  const breath=Math.sin(seconds*1.18+(side==='player'?0:1.6));
  const glance=Math.sin(seconds*.52+(side==='player'?.4:2.1));
  const sign=side==='player'?1:-1;
  // R120 full readable card choreography, using the original VRM elbow IK.
  // Each card has a low draw, an ABOVE-SHOULDER proud reveal, a full arm
  // forward snap and a bodily aftershock. All phrases are interruptible.
  const draw=smoothPulse(age,.015,.18,.45,.83);
  const display=smoothPulse(age,.29,.68,1.20,1.56);
  const cast=smoothPulse(age,1.19,1.39,1.78,2.30);
  const follow=smoothPulse(age,1.57,1.71,1.99,2.49);
  const recoil=smoothPulse(hitAge,.015,.09,.29,.88);
  const act=ambientActs[side],strength=act.weight||0;
  const victory=act.type==='dance'?Math.max(0,strength):0;
  const defeat=act.type==='defeat'?Math.max(0,strength):0;
  const ceremony=Math.max(victory,defeat);
  const cardWeight=ceremony>.005?0:1;
  const doDraw=draw*cardWeight,doDisplay=display*cardWeight,
   doCast=cast*cardWeight,doFollow=follow*cardWeight;
  const actionStrength=Math.max(doDraw,doDisplay,doCast,doFollow,recoil,ceremony);
  const r134Idle=R134_HOST_IDLE_ENABLED?
   r134HostIdleBeat(host.id,seconds,{busy:actionStrength,reduced}):null;
  // R120 campus-comedy exaggeration. Irregular unique individual beats,
  // not a passive, genteel shoulder sway while waiting between turns.
  const idleBlend=(1-actionStrength)*strength*(reduced?.45:1.55);
  const inspectCard=(act.type==='inspect'?idleBlend:0);
  // The podium actors share the same stance schedule as the 3D summoned
  // units. Their standing foot remains on the plinth instead of bobbing
  // along with the entire puppet during victory choreography.
  const footwork=act.type==='dance'?
   contactStep(seconds,act.stage,side==='player'?0:1,reduced):null;
  const legSwing=footwork?.lift||0;
  // Small physical hops are timed to the exact card release or victory,
  // never random full-body idle bobbing. The opponent has a different
  // tempo and larger right arm follow-through, not cloned mirror motion.
  const intensity=reduced?.28:1;
  const cardHop=doCast*Math.abs(Math.sin(Math.PI*Math.max(0,Math.min(1,(age-1.2)/1.08))))*.095*intensity;
  const winnerHop=victory*.19*Math.max(0,Math.sin(seconds*11.7+(side==='player'?.2:1.1)))*intensity;
  host.pivot.position.x=host.baseX+
    sign*(.13*doCast+.09*doFollow-.25*recoil)+
    sign*.14*victory-sign*.13*defeat+
    .018*glance*(1-actionStrength)+sign*(act.step||0)*idleBlend*
      (footwork?.stance?.32:1)+(r134Idle?.shiftX||0);
  host.pivot.position.y=.48+.012*breath+cardHop+winnerHop+
    (footwork?0:(act.jump||0)*idleBlend*.6)+(r134Idle?.liftY||0);
  host.pivot.rotation.y=faceOpponentYaw(host.id,side)+sign*(.21*doDisplay+.29*doCast)+
    sign*(act.headYaw||0)*idleBlend*.30+
    sign*.16*victory-sign*.12*defeat+(r134Idle?.yaw||0);
  host.pivot.rotation.z=sign*(-.12*doCast+.15*doFollow+.23*recoil-
    .095*victory+.24*defeat)+.011*glance+
    sign*(act.tilt||0)*idleBlend;
  // Facial blink and the source VRM blendshapes remain animated independently.
  const lifeMood=arenaLife.read('host:'+side,seconds);
  // Winner/loser and attack states deform the actual original face mesh.
  const faceMood=recoil>.13?'surprised':defeat>.10?'sorrow':
   victory>.10?'joy':doCast>.18?(side==='player'?'joy':'angry'):
   doDisplay>.16?'surprised':null;
  const faceMoodAmount=faceMood==='sorrow'?.98*defeat:
   faceMood==='joy'?.92*Math.max(victory,doCast):
   faceMood==='angry'?.79*doCast:
   faceMood==='surprised'?Math.max(.85*recoil,.68*doDisplay):0;
  const voice=hostSpeech[side];
  if(voice&&seconds>voice.started+voice.duration+.1)hostSpeech[side]=null;
  const speaking=hostSpeech[side];
  host.face.update(seconds,{seed:side==='player'?.35:2.7,
   suppressEntrance:true,suppressGesture:true,
   emotion:faceMood,emotionAmount:faceMoodAmount,
   speech:speaking,
   // Trigger authentic VRM joy/fun morphs for card reveal/cast; during hits
   // return the face to neutral instead of smiling through damage.
   previewAmount:recoil>.14||defeat>.18?0:Math.max(doDisplay*.92,
    doCast*1.0,doFollow*.80,victory*.96,
    inspectCard*.29,(act.type==='laugh'||act.type==='smirk'?idleBlend*.68:0),
    lifeMood?.emotion==='elated'?.60:
    lifeMood?.emotion==='playful'?.32:0)});
  setBone(host,'C_Spine',.014*breath-.17*doCast+.24*recoil+
   .16*victory+.21*defeat+(act.chest||0)*idleBlend*.36+(r134Idle?.spinePitch||0),0,
   sign*(.015*glance-.12*doCast+.18*recoil)+(r134Idle?.spineRoll||0));
  setBone(host,'C_Chest',.015*breath-.15*doDisplay-.30*doCast+
   .24*recoil-.17*victory+.24*defeat+
   (act.chest||0)*idleBlend+(r134Idle?.chestPitch||0),sign*.09*doDisplay,
   sign*(-.12*doCast+.16*recoil)+(r134Idle?.chestRoll||0));
  // A short speaking nod on the source head bone creates visible
  // participation without rotating a proxy body away from the opponent.
  const syllableNod=speaking?
   Math.sin((seconds-speaking.started)*13.1+(side==='ai'?.7:0))*.032:0;
  setBone(host,'C_Head',-.030*inspectCard-.12*doDisplay-.13*doCast+
   .27*recoil-.13*victory+.28*defeat+(act.headPitch||0)*idleBlend+
   syllableNod+(r134Idle?.headPitch||0),
   sign*(.065*glance+.13*doDisplay+(act.headYaw||0)*idleBlend)+(r134Idle?.headYaw||0),
   sign*.02*glance+(r134Idle?.headRoll||0));
  setBone(host,'L_UpperLeg',.026*glance-.10*doCast+.16*recoil+
   .20*victory-.27*defeat+(footwork?.swing==='L'?legSwing*2:0)+(r134Idle?.thighL||0),0,0);
  setBone(host,'R_UpperLeg',-.026*glance+.11*doCast-.12*recoil+
   .18*victory-.27*defeat+(footwork?.swing==='R'?legSwing*2:0)+(r134Idle?.thighR||0),0,0);
  setBone(host,'L_LowerLeg',.02*doCast-.16*defeat+
   (footwork?.swing==='L'?-legSwing:0)+(r134Idle?.kneeL||0),0,0);
  setBone(host,'R_LowerLeg',-.02*doCast-.16*defeat+
   (footwork?.swing==='R'?-legSwing:0)+(r134Idle?.kneeR||0),0,0);
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
   if(hand==='R')targetVector.y+=.12*inspectCard;
   if(r134Idle)targetVector.add(new THREE.Vector3(
    ...(hand==='R'?r134Idle.handR:r134Idle.handL)));
   const actingHand=act[hand==='R'?'right':'left'];
   if(actingHand)for(let j=0;j<3;j++)targetVector.setComponent(j,
    targetVector.getComponent(j)+actingHand[j]*idleBlend);
   for(const [phase,amount] of [[specs.draw,doDraw],
      [specs.show,doDisplay],[specs.cast,doCast],
      [specs.guard,recoil],[specs.victory,victory],[specs.defeat,defeat]]){
    targetVector.lerp(new THREE.Vector3(...phase[hand]),Math.min(1,amount));
   }
   if(hand==='R'&&doFollow>.01){
    targetVector.x+=sign*.055*doFollow;
    targetVector.y-=.12*doFollow;
   }
   targetOut[hand]=targetVector.toArray();
  }
  host.pose.applyTargets(targetOut,VRM_HERO_POSES[host.id].pole);
  // Apply element-specific recoil only after the existing R120 body, face
  // and wrist choreography has solved. No changed camera or card timeline.
  const r121Age=seconds-strike.time;
  if(strike.element&&r121Age>=0&&r121Age<.88){
   const envelope=Math.sin(Math.PI*r121Age/.88);
   const kind=strike.element;
   const lean=({wind:.18,electric:.13,fire:.12,water:.14,ice:.025,
     time:.012,earth:.11,metal:.10,absurd:.19,space:.14})[kind]??.10;
   host.pivot.rotation.z+=sign*lean*envelope;
   host.pivot.position.x+=-sign*(kind==='wind'?.17:kind==='time'?.012:.08)*envelope;
   host.pivot.rotation.x+=(kind==='electric'?.075*Math.sin(r121Age*55):
      kind==='ice'?.025*Math.sin(r121Age*27):kind==='absurd'?.075*Math.sin(r121Age*19):0)*envelope;
   const chest=host.bones.get('J_Bip_C_Chest');
   if(chest)chest.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(
     new THREE.Vector3(0,0,1),sign*lean*.38*envelope));
  }
  host.choreography={phase:victory>.1?'victory_jump':defeat>.1?'loss_despair':
    recoil>.1?'hit':doFollow>.22?'follow_through':doCast>.1?'cast':
    doDisplay>.1?'raise_card':doDraw>.1?'draw':idleBlend>.08?act.type:'idle',
    draw:+doDraw.toFixed(3),display:+doDisplay.toFixed(3),
    cast:+doCast.toFixed(3),follow:+doFollow.toFixed(3),
    victory:+victory.toFixed(3),defeat:+defeat.toFixed(3),
    hop:+(cardHop+winnerHop).toFixed(3),
    recoil:+recoil.toFixed(3),
    speaking:!!speaking,speechSerial:speaking?.serial??null,
    inspected:+inspectCard.toFixed(3),livingBeat:act.type,
    r134Idle:r134Idle?{story:r134Idle.story,
     strength:r134Idle.strength,phase:r134Idle.phase,
     headYaw:+r134Idle.headYaw.toFixed(4),
     thighL:+r134Idle.thighL.toFixed(4),thighR:+r134Idle.thighR.toFixed(4),
     inspect:r134Idle.inspect,challenge:r134Idle.challenge}:null,
    footContact:footwork?{stance:footwork.stance,
      lift:+footwork.lift.toFixed(4),stage:act.stage}:null,
    livingStrength:+idleBlend.toFixed(3)};
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
 stadiumEvidence?.update?.(absoluteSeconds,{reduced});
 spellImpact?.update(absoluteSeconds);
 magicArsenal?.update(absoluteSeconds);
 elementalVfx?.update(absoluteSeconds);
 spellContactFX?.update(absoluteSeconds);
 spectatorChaosFX?.update(absoluteSeconds);
 bleacherProps?.update(absoluteSeconds);
 // All props update inside the 3D arena; 3 phases, then remove cleanly.
 comboDirector?.update(absoluteSeconds,reduced);
 comedySpectacle?.update(absoluteSeconds,reduced);
 const impactCombo=comboDirector?.drainImpact();
 if(impactCombo){
  // The R100 source event has already been strictly normalized, and only
  // the exact animation payoff frame may start the extra 3D celebration.
  comedySpectacle?.trigger('combo_'+impactCombo.effect,
   impactCombo.side,impactCombo.serial,absoluteSeconds,{reduced});
  reply('ASDC_R100_COMBO_IMPACT',impactCombo);
 }
 const finishedCombo=comboDirector?.drainDone();
 if(finishedCombo)reply('ASDC_R100_COMBO_DONE',finishedCombo);
 // One authoritative 3D contact frame; the rules and HP were resolved
 // by engine.mjs, never by this renderer.
 for(let i=pendingSpellContacts.length-1;i>=0;i--){
  const pending=pendingSpellContacts[i];
  if(absoluteSeconds<pending.due)continue;
  pendingSpellContacts.splice(i,1);
  const d=pending.descriptor;
  const targets=d.unitDamage>0?
   summonPresence?.spellWorldAnchors?.(d.victim,d.targetUids)||[]:[];
  if(d.unitDamage>0&&d.targetUids.length){
   summonPresence?.reactToSpell?.(d.victim,d.targetUids,absoluteSeconds,d.element);
   for(const t of targets)spellContactFX?.play(d,t,absoluteSeconds,{kind:'unit'});
  }
  if(d.directDamage>0){
   hostHits[d.victim]={time:absoluteSeconds,damage:d.directDamage,element:d.element};
   arenaLife.observe('hit',{side:d.victim,at:absoluteSeconds});
   livingCast.signal(d.victim,'hurt',absoluteSeconds);
   stadiumEvidence?.reactAudience?.('hit',d.victim,absoluteSeconds);
   actualHostHits++;
   const host=duelistHosts.find(h=>h.side===d.victim);
   if(host?.pivot){
    const p=host.pivot.getWorldPosition(new THREE.Vector3());
    spellContactFX?.play(d,p,absoluteSeconds,{kind:'host'});
   }
  }else if(!d.damaging){
   // Healing and buffs are self-side effects, not pretend enemy damage.
   const host=duelistHosts.find(h=>h.side===d.caster);
   if(host?.pivot){
    const p=host.pivot.getWorldPosition(new THREE.Vector3());
    spellContactFX?.play(d,p,absoluteSeconds,{kind:'host'});
   }
  }
  r121ContactReceipts++;
  reply('ASDC_R121_SPELL_CONTACT',{serial:d.serial,card:d.id,
   caster:d.caster,victim:d.victim,element:d.element,
   directDamage:d.directDamage,unitDamage:d.unitDamage,
   targetIds:targets.map(t=>t.id),contactCount:targets.length+(d.directDamage>0?1:0)});
 }
 // R125: only a real R81 spell can launch a non-damaging spectator gag.
 for(let i=pendingCrowdAccidents.length-1;i>=0;i--){
  const pending=pendingCrowdAccidents[i],accident=pending.incident;
  if(!pending.launched){
   if(absoluteSeconds<pending.launchAt)continue;
   const anchor=stadiumEvidence?.spectatorAnchor?.(accident.spectatorIndex);
   if(!anchor){pendingCrowdAccidents.splice(i,1);continue}
   pending.launched=spectatorChaosFX?.play(accident,anchor,absoluteSeconds)===true;
   if(!pending.launched){pendingCrowdAccidents.splice(i,1);continue}
   pending.hitAt=absoluteSeconds+(reduced?.24:.49);
  }
  if(absoluteSeconds<pending.hitAt)continue;
  pendingCrowdAccidents.splice(i,1);
  const hit=stadiumEvidence?.reactSpectatorAccident?.(accident,absoluteSeconds);
  if(!hit)continue;
  const prop=bleacherProps?.play(accident,absoluteSeconds);
  if(prop&&PARAMS.get('r123Closeup')!=='off'){
   crowdCloseup={anchor:{...hit},started:absoluteSeconds,scenario:accident.scenario,
    spectatorIndex:accident.spectatorIndex};
   r123ReactionCuts++;
  }
  r122AccidentReceipts++;
  reply('ASDC_R122_CROWD_ACCIDENT',{
   serial:accident.serial,card:accident.card,side:accident.side,
   scenario:accident.scenario,spectatorIndex:accident.spectatorIndex,
   spectatorId:hit.spectatorId,element:accident.element,
   caption:accident.caption,line:accident.line,
   prop:prop?.kind||null,propLine:resolveSpectatorProp(accident)?.line||null,
   gameplayHit:false,ruleDamage:0
  });
 }
 arenaLife.tick(absoluteSeconds,{quiet:playing});
 actors.forEach(a=>reactActor(a,t,absoluteSeconds));
 updateDuelistHosts(absoluteSeconds);
 duelEffects?.update({absoluteSec:absoluteSeconds,fightTime:t,playing,
   visible:actors.map(a=>a.pivot.visible),
   reducedMotion:reduced});
 podiumCards?.update(absoluteSeconds,playing,camera.aspect<.95);
 handCards?.update(absoluteSeconds,camera);
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
 // R104: natural *front-row audience* camera; no overhead-isometric shot.
 // Scale the modest elevation with fitted orbit distance so desktop and phone
 // always share a stable 15-degree viewing pitch despite aspect differences.
 // Keep the old high camera behind explicit ?r104Camera=old rollback only.
 const height=legacyCamera?(narrow?7.65:Math.max(8.35,distance*.66)):
  CAMERA_LOOK_AT.y+distance*(narrow?FRONT_PITCH_PORTRAIT:FRONT_PITCH_DESKTOP);
 camera.position.set(Math.sin(angle)*distance+Math.cos(angle)*arc,
  height+push*.055,CAMERA_LOOK_AT.z+Math.cos(angle)*distance-Math.sin(angle)*arc);
 choreographyQA.cameraOrbit=Number(arc.toFixed(4));
 choreographyQA.maxOrbit=Math.max(choreographyQA.maxOrbit,Math.abs(arc));
 // Original R124 hero framing stays intact outside this brief front-view
 // audience shot; restore the original camera mathematically every frame.
 let aimX=CAMERA_LOOK_AT.x,aimY=CAMERA_LOOK_AT.y+push*.07,aimZ=CAMERA_LOOK_AT.z;
 r123ShotWeight=0;
 if(crowdCloseup){
  const elapsed=absoluteSeconds-crowdCloseup.started;
  if(elapsed>4.85)crowdCloseup=null;
  else if(elapsed>=0&&!reduced&&Math.abs(orbitYaw)<45){
   const smooth=v=>{const q=clamp(v,0,1);return q*q*(3-2*q)};
   // Student takes the hit; only afterwards does the *actual mounted*
   // M01 music teacher become the hero of a short disciplinary cutaway.
   // The teacher's source GLB and Qwen line must match the same character.
   const teacher=elapsed>=2.32?stadiumEvidence?.spectatorAnchor?.(7):null;
   const teacherBeat=!!teacher&&elapsed>=2.32;
   const weight=teacherBeat?
    .94*smooth((elapsed-2.32)/.30)*(1-smooth((elapsed-3.87)/.65)):
    .96*smooth(elapsed/.34)*(1-smooth((elapsed-1.68)/.78));
   const a=teacherBeat?teacher:crowdCloseup.anchor;
   const target=new THREE.Vector3(a.x+(teacherBeat?.62:0),
    a.y+(teacherBeat?.92:1.31),a.z+.22);
   const eye=teacherBeat?
    new THREE.Vector3(target.x+1.25,target.y+(narrow?.78:.59),
     target.z+(narrow?4.70:3.34)):
    new THREE.Vector3(target.x+(target.x>0?-.32:.32),
     target.y+(narrow?1.18:.82),target.z+(narrow?5.50:4.28));
   camera.position.lerp(eye,weight);
   aimX+=(target.x-aimX)*weight;
   aimY+=(target.y-aimY)*weight;
   aimZ+=(target.z-aimZ)*weight;
   r123ShotWeight=weight;
  }
 }
 camera.lookAt(aimX,aimY,aimZ);
 // Review actual source actors large enough to see knees, soles, hands and
 // clothing deformation. QA-only: no player can accidentally enter this
 // mode without the explicit ?qa=1 flag.
 if(R131_IS_QA()&&r131QaCloseup&&summonPresence){
  const actor=summonPresence.inspect(camera)?.entries?.find(x=>
   x.id===r131QaCloseup);
  if(actor){
   const [x,y,z]=actor.position;
   const radius=3.45;
   camera.position.set(x+Math.cos(r131QaAngle)*radius,
    y+1.46,z+Math.sin(r131QaAngle)*radius);
   camera.lookAt(x,y+1.01,z);
  }
 }
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
 if(!r124Legacy){
  shadowAccumulator+=delta;
  const period=playing?1/30:1/20;
  if(shadowAccumulator>=period){
   renderer.shadowMap.needsUpdate=true;
   shadowAccumulator%=period;shadowPassRequests++;
  }
 }
 renderer.render(scene,camera);
 // A camera cut never changes geometry orientation, physical animation or
 // the actual player's chosen orbit. Render an inset in the SAME WebGL
 // context for a maximum ~2 seconds, no second canvas, no fake 2D portrait.
 let currentDraws=renderer.info.render.calls;
 const focusCandidates=['player','ai'].map(side=>({
  side,started:hostAction[side].started,
  age:absoluteSeconds-hostAction[side].started
 })).filter(x=>x.age>.28&&x.age<2.19).sort((a,b)=>b.started-a.started);
 const ending=absoluteSeconds-heroResult.started;
 const talkingCandidates=['player','ai'].map(side=>({
  side,speech:hostSpeech[side],age:hostSpeech[side]?
   absoluteSeconds-hostSpeech[side].started:Infinity
 })).filter(x=>x.speech&&x.age>=.12&&
   x.age<Math.min(x.speech.duration,2.7))
  .sort((a,b)=>b.speech.started-a.speech.started);
 const focus=focusCandidates[0]||
  (['player','ai'].includes(heroResult.winner)&&ending>=.38&&ending<2.25?
   {side:heroResult.winner,age:ending,result:true}:null)||
  (talkingCandidates[0]?{side:talkingCandidates[0].side,
   age:talkingCandidates[0].age,voice:true}:null);
 heroLens.visible=false;
 if(focus&&!reduced&&!legacyCamera){
  const host=duelistHosts.find(x=>x.side===focus.side);
  if(host){
   if(!r124Legacy&&heroLayerSide!==focus.side){
    for(const h of duelistHosts)h.pivot.traverse(obj=>{
     if(h.side===focus.side)obj.layers.enable(1);else obj.layers.disable(1);
    });
    heroLayerSide=focus.side;
   }
   const size=new THREE.Vector2();renderer.getSize(size);
   const width=Math.max(1,Math.floor(size.x*(size.x<680?.40:.265)));
   const height=Math.max(1,Math.floor(size.y*(size.x<680?.262:.34)));
   const x=focus.side==='player'?Math.floor(size.x-width-18):18;
   // Stay below the 3D scene top controls and scoreboard; the original
   // R121 first shot occupied this HUD row and hid the child's face.
   const y=Math.floor(size.y*(size.x<680?.40:.42));
   const sign=focus.side==='player'?1:-1;
   const cx=host.pivot.position.x,cy=host.pivot.position.y;
   heroCamera.aspect=width/height;
   heroCamera.fov=focus.voice?(size.x<680?39:35):size.x<680?46:41;
   heroCamera.updateProjectionMatrix();
   // Camera approaches from spectator side and slightly towards opponent,
   // so the actual card and each child's eyes remain simultaneously visible.
   // Actual chest-up shot: original VRM face + the raised card, not a
   // redundant long-shot with an oversized card eclipsing the eyes.
   // Film the eyes from the direction the child is facing (opponent side),
   // rather than filming the BACK of the raised card from the grandstand.
   // A speaking child gets an ACTUAL face-and-shoulders shot, aimed at the
   // source head bone. Card play retains the wider physical-hand framing.
   host.pivot.updateWorldMatrix(true,true);
   const sourceHead=host.pivot.getObjectByName('J_Bip_C_Head');
   const sourceFace=sourceHead?.getWorldPosition(new THREE.Vector3());
   let eye;
   if(focus.voice&&sourceFace){
    heroCamera.position.set(sourceFace.x+sign*1.48,
     sourceFace.y+.22,sourceFace.z+.52);
    eye=sourceFace.clone().add(new THREE.Vector3(0,-.10,0));
   }else{
    // R124 native face readability: the original distance framed almost the
    // whole body and concealed the original VRM Joy/Sorrow behind hair.
    // Keep the real face in the close-up; artwork remains visible in the main
    // arena. A stronger side view made the physical card obscure the eyes.
    heroCamera.position.set(cx+sign*1.75,cy+1.84,host.pivot.position.z+.48);
    eye=new THREE.Vector3(cx+sign*.30,cy+1.74,host.pivot.position.z+.04);
   }
   heroCamera.lookAt(eye);
   renderer.setScissorTest(true);
   renderer.setViewport(x,y,width,height);
   renderer.setScissor(x,y,width,height);
   renderer.autoClear=false;
   renderer.clear(true,true,true);
   renderer.render(scene,heroCamera);
   heroInsetDraws=renderer.info.render.calls;
   currentDraws+=heroInsetDraws;
   renderer.autoClear=true;
   renderer.setScissorTest(false);
   renderer.setViewport(0,0,size.x,size.y);
   renderer.setScissor(0,0,size.x,size.y);
   host.pivot.updateWorldMatrix(true,true);
   const head=host.pivot.getObjectByName('J_Bip_C_Head');
   const face=head?.getWorldPosition(new THREE.Vector3()).project(heroCamera);
   const wrist=host.pivot.getObjectByName('J_Bip_R_Hand');
   const card=wrist?.getWorldPosition(new THREE.Vector3())
    .add(new THREE.Vector3(0,.070,.067)).project(heroCamera);
   const separation=face&&card?Math.hypot(face.x-card.x,face.y-card.y):0;
   heroLens={side:focus.side,phase:focus.result?'victory_closeup':
    focus.voice?'actual_qwen_voice_closeup':
    focus.age<1.25?'card_reveal_closeup':'card_cast_closeup',
    frames:heroLens.frames+1,visible:true,
    inset:{x,y,width,height,
     topMarginPx:size.y-(y+height),bottomMarginPx:y},faceNdc:face?
     [face.x,face.y,face.z].map(v=>+v.toFixed(3)):null,
    cardNdc:card?[card.x,card.y,card.z].map(v=>+v.toFixed(3)):null,
    faceCardSeparation:+separation.toFixed(4),
    lastDrawCalls:currentDraws};
  }
 }
 if(!heroLens.visible){heroLens.side=null;heroLens.phase='idle'}
 const portrait=$('hero-portrait-frame');
 if(portrait){
  portrait.hidden=!heroLens.visible;
  if(heroLens.visible){
   const{inset,side,phase}=heroLens;
   portrait.style.left=inset.x+'px';
   portrait.style.top=inset.topMarginPx+'px';
   portrait.style.width=inset.width+'px';
   portrait.style.height=inset.height+'px';
   portrait.dataset.side=side;
   $('hero-portrait-caption').textContent=phase==='victory_closeup'?
    '决斗者 · 胜利特写':phase==='actual_qwen_voice_closeup'?
    (side==='player'?'我方决斗者 · 原声发言':'对方决斗者 · 原声发言'):
    side==='player'?'我方 · 举牌特写':'对手 · 举牌特写';
  }
 }
 frames++;drawCount=currentDraws;
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
 if(msg?.type==='ASDC_R122_VOICE_START'){
  const side=msg.actor==='HOST_PLAYER'?'player':
   msg.actor==='HOST_AI'?'ai':null;
  const valid=side&&Number.isInteger(msg.serial)&&msg.serial>hostSpeechSeen[side]&&
   msg.serial<=100000000&&typeof msg.text==='string'&&
   msg.text.length>0&&msg.text.length<=180&&
   Number.isFinite(msg.duration_seconds)&&
   msg.duration_seconds>=.5&&msg.duration_seconds<=18;
  if(!valid){speechQA.ignored++;return;}
  hostSpeechSeen[side]=msg.serial;
  hostSpeech[side]={started:absoluteSeconds,duration:msg.duration_seconds,
   text:msg.text,serial:msg.serial,kind:String(msg.kind||'voice').slice(0,40)};
  speechQA.started++;
  return;
 }
 if(msg?.type==='ASDC_R122_VOICE_STOP'){
  const side=msg.actor==='HOST_PLAYER'?'player':
   msg.actor==='HOST_AI'?'ai':null;
  if(side&&hostSpeech[side]&&msg.serial===hostSpeech[side].serial){
   hostSpeech[side]=null;speechQA.stopped++;
  }else speechQA.ignored++;
  return;
 }
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
  comboDirector?.reset();
  comedySpectacle?.clear();
  summonPresence?.clearComicCombo();
  summonPresence?.clearSpellTargets?.();
  pendingSpellContacts.length=0;
  hostSpeech.player=null;hostSpeech.ai=null;
  spellSerials.clear(); // serials restart at each tutorial stage / deck
  spellContactFX?.reset();
  pendingCrowdAccidents.length=0;crowdCloseup=null;r123ShotWeight=0;
  spectatorChaosFX?.reset();bleacherProps?.reset();
  stadiumEvidence?.resetAudience?.();
  hostHits.player={time:-100,damage:0};
  hostHits.ai={time:-100,damage:0};
  return;
 }
 if(msg?.type==='ASDC_R100_REAL_COMBO'){
  const accepted=comboDirector?.play(msg.event,absoluteSeconds,msg.chapter)===true;
  if(accepted)summonPresence?.reactToCombo(
    msg.event.side,msg.event.effect,msg.event.target||null,
    msg.event.serial,absoluteSeconds);
  reply('ASDC_R100_COMBO_ACCEPTED',{accepted,
    serial:msg.event?.serial??null,effect:msg.event?.effect??null});
  return;
 }
 if(msg?.type==='ASDC_R112_VICTORY'){
  if(!['player','ai','draw'].includes(msg.winner))return;
  arenaLife.observe('result',{side:msg.winner,winner:msg.winner,at:absoluteSeconds});
  livingCast.celebrate(msg.winner,absoluteSeconds);
  heroResult={winner:msg.winner,started:absoluteSeconds};
  summonPresence?.celebrate?.(msg.winner,absoluteSeconds,{reduced});
  stadiumEvidence?.beginFinale?.(msg.winner,absoluteSeconds);
  stageText('settled',msg.winner==='draw'?'本场平局 · 体育馆欢呼':
    (msg.winner==='player'?'我方':'对方')+'胜利 · 全队庆祝');
  return;
 }
 if(msg?.type==='ASDC_R81_SCORE'){
  if(liveScoreboard?.setState(msg,performance.now()))
   arenaLife.setMatch(msg,absoluteSeconds);
  return;
 }
 if(msg?.type==='ASDC_R81_HIT_HOST'){
  if(['player','ai'].includes(msg.side)&&Number.isInteger(msg.damage)&&msg.damage>0&&msg.damage<=20){
   hostHits[msg.side]={time:absoluteSeconds,damage:msg.damage};
   arenaLife.observe('hit',{side:msg.side,at:absoluteSeconds});
   livingCast.signal(msg.side,'hurt',absoluteSeconds);
   actualHostHits++;
   duelEffects?.pulse(msg.side,absoluteSeconds);
   stadiumEvidence?.reactAudience?.('hit',msg.side,absoluteSeconds);
  }
  return;
 }
 if(msg?.type==='ASDC_R81_SPELL_RESULT'){
  // Only rule-emitted card identifiers and serials are permitted; this layer
  // displays the authoritative result but cannot mutate HP or winner.
  if(!Number.isInteger(msg.serial)||msg.serial<=0||spellSerials.has(msg.serial))return;
  const accepted=spellImpact?.play(msg,absoluteSeconds);
  if(!accepted)return;
  magicArsenal?.play(msg,absoluteSeconds);
  spellSerials.add(msg.serial);
  const accident=PARAMS.get('r122Crowd')==='off'?null:
   chooseCrowdAccident(msg,{force:PARAMS.get('qa')==='1'&&
    PARAMS.get('r122Crowd')==='force'});
  if(accident){
   pendingCrowdAccidents.push({incident:accident,
    launchAt:absoluteSeconds+.28,launched:false,hitAt:Infinity});
   if(pendingCrowdAccidents.length>5)pendingCrowdAccidents.shift();
  }
  if(['buff','blast','repair','draw','heal','confuse'].includes(msg.effect))
   comedySpectacle?.trigger('spell_'+msg.effect,
    msg.side,msg.serial,absoluteSeconds,{reduced});
  if(spellSerials.size>500)spellSerials.clear();
  const descriptor=describeSpellContact(msg);
  if(descriptor){
   // The authoritative spell arrives before the post-resolution board sync.
   // Retain a KO'd source model until its hit and recoil have finished.
   if(descriptor.unitDamage>0&&descriptor.targetUids.length)
    summonPresence?.reserveSpellTargets?.(
     descriptor.victim,descriptor.targetUids,absoluteSeconds+1.28);
   pendingSpellContacts.push({descriptor,due:absoluteSeconds+.46});
   if(pendingSpellContacts.length>12)pendingSpellContacts.shift();
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
  const card=BY_ID[msg.id];
  const authorized=['player','ai'].includes(msg.side)&&
    card?.kind===msg.kind&&Number.isInteger(msg.serial)&&msg.serial>0;
  if(authorized){
   hostAction[msg.side]={started:absoluteSeconds,kind:msg.kind,id:msg.id};
   handCards?.show(msg.side,msg.id,msg.serial,absoluteSeconds);
   arenaLife.observe('card',{side:msg.side,at:absoluteSeconds,kind:msg.kind});
   livingCast.signal(msg.side,'card',absoluteSeconds);
   stadiumEvidence?.reactAudience?.('card',msg.side,absoluteSeconds);
   if(card.kind==='unit'){
    summonPresence?.reactToSummon(msg.side,msg.id,msg.serial,absoluteSeconds);
    // R79 recovered 3D portal effect on existing summoned characters.
    elementalVfx?.playCard(msg,absoluteSeconds);
    comedySpectacle?.trigger('summon_'+card.style,
      msg.side,msg.serial,absoluteSeconds,{reduced});
   }
  }
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
  setStudyCloseup(id){
   if(!R131_IS_QA())return false;
   r131QaCloseup=typeof id==='string'&&/^(E03|E04|G02|G03|G04|T03|T04)$/.test(id)?id:null;
   return true;
  },
  studyLowestSourceMeshes(id){
   if(!R131_IS_QA()||!(/^(E03|E04|G02|G03|G04|T03|T04)$/.test(id)))return [];
   return summonPresence?.inspectLowestSourceMeshes(id)||[];
  },
  studyAction(id,action){
   if(!R131_IS_QA())return false;
   if(!/^(idle|attack|hit|walk|celebrate)$/.test(action))return false;
   return summonPresence?.playSourceStudyAction(id,action)===true;
  },
  setStudyViewAngle(degrees){
   if(!R131_IS_QA()||!Number.isFinite(degrees))return false;
   r131QaAngle=degrees*Math.PI/180;return true;
  },
  get studyCloseup(){return r131QaCloseup},
  get ready(){return ready},
  get shownCards(){return structuredClone(shownCards)},
  get summonPresence(){return summonPresence?.inspect(camera)||null},
  get summonModels(){return summonModels?[...summonModels.values()].map(x=>({id:x.id,file:x.selectedFile||x.spec.file,baselineFile:x.spec.file,meshes:x.meshes,clips:x.clips.length,scale:x.scale,measured:x.measured})):[];},
  get combatEvents(){return summonPresence?.sequenceStats()||null},
  get spellReactions(){return summonPresence?.spellReactions||0},
  get r121Retentions(){return summonPresence?.r121Retentions||null},
  get scoreboard(){return liveScoreboard?.stats||null},
  get drawCalls(){return renderer?.info?.render?.calls??null},
  get renderPerformance(){return {profile:r124Legacy?'legacy':r124Mobile()?'balanced-mobile':'balanced-desktop',
   pixelRatio:renderer?.getPixelRatio()??null,shadowAutoUpdate:renderer?.shadowMap?.autoUpdate,
   shadowPassRequests,shadowSize:r124Legacy?2048:r124Mobile()?1024:2048,
   heroInsetDraws,heroLayerSide,heroCameraLayer:heroCamera.layers.mask,
   totalDrawCalls:drawCount};},
  get spellImpact(){return spellImpact?.stats||null},
  get magicArsenal(){return magicArsenal?.stats||null},
  get elementalVfx(){return elementalVfx?.stats||null},
  get spellContactFX(){return spellContactFX?.stats||null},
  get r121ContactReceipts(){return r121ContactReceipts},
  get r122AccidentReceipts(){return r122AccidentReceipts},
  get registeredSpellSerials(){return spellSerials.size},
  get pendingSpellContacts(){return pendingSpellContacts.length},
  get pendingCrowdAccidents(){return pendingCrowdAccidents.length},
  get spectatorChaosFX(){return spectatorChaosFX?.stats||null},
  get bleacherProps(){return bleacherProps?.stats||null},
  get r123Camera(){return {cuts:r123ReactionCuts,weight:+r123ShotWeight.toFixed(3),
   spectatorIndex:crowdCloseup?.spectatorIndex??null,
   frontFacingCloseup:true,teacherIntervention:!!crowdCloseup&&absoluteSeconds-crowdCloseup.started>=2.32,extraRenderPasses:0}},
  get comboDirector(){return comboDirector?.stats||null},
  get comedySpectacle(){return comedySpectacle?.stats||null},
  get hostHits(){return structuredClone(hostHits)},
  get actualHostHits(){return actualHostHits},
  get actorVisibility(){return actors.map(a=>({id:a.id,visible:a.pivot.visible}))},
  get duelistHosts(){return duelistHosts.map(a=>({id:a.id,side:a.side,visible:a.pivot.visible,
    x:Number(a.pivot.position.x.toFixed(3)),y:Number(a.pivot.position.y.toFixed(3)),
    z:Number(a.pivot.position.z.toFixed(3)),bones:a.sourceBones,skins:a.skinnedMeshes,
    modelSource:a.sourceRig,hostAvatar:a.hostAvatar,
    trueWorldYaw:Number(a.pivot.rotation.y.toFixed(6)),
    independentFromSummons:!actors.some(unit=>unit.source===a.sourceRig),
    posture:inspectDuelistPosture(a),expression:a.face.inspect()}))},
  get duelistAction(){return structuredClone(hostAction)},
  get realVoiceActing(){return {
   speakers:Object.fromEntries(Object.entries(hostSpeech).map(([side,speech])=>
    [side,speech?{id:speech.kind,serial:speech.serial,duration:speech.duration,
     age:+(absoluteSeconds-speech.started).toFixed(3)}:null])),
   ...speechQA
  }},
  get heroLens(){return structuredClone(heroLens)},
  get livingCast(){return livingCast.inspect()},
  get arenaLife(){return arenaLife.inspect()},

  get roles(){return actors.map(a=>({id:a.id,name:a.name,asset:a.source,
   bones:a.boneCount,skinnedMeshes:a.skins,triangles:a.triangles,
   recoloredMeshes:a.style.recolored,accessories:a.style.accessories}))},
  get sourceMatchesR22(){return source3DAssetsVerified},
  get renderer(){return renderInfo},
  get stadium(){return stadiumEvidence?.stats||null},
  get stadiumSeatBanks(){return stadiumEvidence?.seatBanks||null},
  get stadiumAmbience(){return stadiumEvidence?.ambience||null},
  get effects(){return duelEffects?.stats||null},
  get podiumCards(){return podiumCards?.stats||null},
  get handCards(){return handCards?.stats||null},
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
// R116: count actual GLB/VRM response bytes (independent from verified assets).
// A file can be fully downloaded but still be decoding or fail validation.
const transferProgress=new Map();
let transferPaintPending=false;
function updateTransferProgress(url,event){
 const loaded=Number(event?.loaded);
 if(!Number.isFinite(loaded)||loaded<0)return;
 const previous=transferProgress.get(url)||{loaded:0,total:0};
 const total=event.lengthComputable&&Number.isFinite(Number(event.total))?
  Math.max(loaded,Number(event.total)):previous.total;
 transferProgress.set(url,{loaded:Math.max(previous.loaded,loaded),total});
 const entries=[...transferProgress.values()];
 const bytes=entries.reduce((sum,item)=>sum+item.loaded,0);
 const known=entries.reduce((sum,item)=>sum+item.total,0);
 window.__ASDC_LOAD_METRICS.downloadedBytes=Math.round(bytes);
 window.__ASDC_LOAD_METRICS.knownTotalBytes=Math.round(known);
 // Render the latest sampled byte count on the next frame. A timed throttle
 // without a final flush can leave the visible bytes behind the real count.
 if(transferPaintPending)return;
 transferPaintPending=true;
 requestAnimationFrame(()=>{
  transferPaintPending=false;
  if(ready||loadedRealResources===TOTAL_REAL_ASSETS)return;
  const element=$('load-download');
  const current=window.__ASDC_LOAD_METRICS.downloadedBytes;
  if(element)element.textContent='已接收 '+(current/1048576).toFixed(1)+' MiB 模型数据';
 });
}
let loadedRealResources=0;
const loadedResourceIds=new Set();
// A slow connection is a recoverable state, never fake a completed arena.
const slowLoadTimer=setTimeout(()=>{
 if(ready||$('loading')?.dataset.error==='true')return;
 const hint=$('load-slow');
 if(hint)hint.hidden=false;
},12000);
$('load-retry-slow')?.addEventListener('click',()=>location.reload());
function verifiedModelLoaded(id){
 if(loadedResourceIds.has(id))return;
 loadedResourceIds.add(id);loadedRealResources++;
 const count=$('load-count'),bar=$('load-progress');
 if(count)count.textContent='已验证 '+loadedRealResources+' / '+TOTAL_REAL_ASSETS+' 个三维人物资源';
 if(bar){bar.value=loadedRealResources;bar.textContent=loadedRealResources+'/'+TOTAL_REAL_ASSETS;}
 window.__ASDC_LOAD_METRICS.modelsVerified=loadedRealResources;
 const step=$('load-step');
 if(step){
  const verifiedSummons=[...loadedResourceIds].filter(value=>value.startsWith('GLB:')).length;
  step.textContent=verifiedSummons===12?'所有角色资源已验证':
   verifiedSummons>0?'召唤角色集结中 · '+verifiedSummons+' / 12':
   '正在迎接决斗者与召唤角色';
 }
}
try{
 makeScene();
 // Run the four priority VRMs alongside a bounded GLB pipeline. The old
 // sequence waited for VRM group A, then VRM group B, then all 12 summons.
 // Full readiness is still gated on every actual model, not a synthetic %.
 const connection=navigator.connection;
 const slowNetwork=connection?.saveData||/2g/.test(connection?.effectiveType||'');
 const glbConcurrency=slowNetwork?2:matchMedia('(pointer:coarse)').matches?3:4;
 const [loadedActors,loadedHosts,loadedSummons]=await Promise.all([
  Promise.all(MODEL_SPECS.map(async(spec,idx)=>{
   const actor=await loadActor(spec,idx,updateTransferProgress);
   verifiedModelLoaded('VRM:'+spec.id);
   return actor;
  })),
  Promise.all(HOST_MODEL_SPECS.map(async(spec,idx)=>{
   const actor=await loadActor(spec,idx,updateTransferProgress);
   verifiedModelLoaded('HOST:'+spec.source);
   return actor;
  })),
  preloadSummonModels(THREE,new GLTFLoader().setMeshoptDecoder(MeshoptDecoder),{
   concurrency:glbConcurrency,
   onLoaded:({id})=>verifiedModelLoaded('GLB:'+id),
   onTransfer:updateTransferProgress
  })
 ]);
 actors=loadedActors;
 hostSourceActors=loadedHosts;
 summonModels=loadedSummons;
 source3DAssetsVerified=actors[0].source==='Shino-original-CC0.vrm'&&
  actors[1].source==='Fumiriya-original-CC0.vrm'&&actors[0].boneCount>=140&&actors[1].boneCount>=100;
 if(!source3DAssetsVerified)throw Error('R22 original VRM identity gate failed');
 makeDuelistHosts();
 handCards?.attach(duelistHosts);
 if(loadedRealResources!==TOTAL_REAL_ASSETS||summonModels.size!==12)
  throw Error('R101 genuine asset readiness gate: '+loadedRealResources+'/'+TOTAL_REAL_ASSETS);
 stadiumEvidence?.mountAudience?.(summonModels);
 bleacherProps?.mount?.([0,1,2,3].map(index=>stadiumEvidence?.spectatorAnchor?.(index)));
 summonPresence=createSummonPresence(THREE,scene,{
  actors,prototypes:summonModels,lifeWorld:arenaLife,
  onCombatImpact:(event)=>{
   // Only the accepted actual exchange sequence can emit this receipt.
   const type=event.type==='direct_hit'?'direct_hit':'actual_exchange';
   comedySpectacle?.trigger(type,event.side,event.serial,absoluteSeconds,{reduced});
   reply('ASDC_R102_COMBAT_IMPACT',{serial:event.serial,side:event.side,
    effect:type,damage:event.damage});
  }
 });
 // Do not signal scene readiness before Chrome actually paints the first
 // GL frame. The old timing leaked an all-white first-frame compositor image.
 stageText('idle','12 种三维召唤实体与体育馆已载入 · 待命');
 window.__ASDC_LOAD_METRICS.modelReadyMs=Math.round(performance.now()-loadingStartedAt);
 const download=$('load-download');
 if(download)download.textContent='所有角色已下载，正在完成三维场景渲染';
 const paintStage=$('load-step');
 if(paintStage)paintStage.textContent='正在点亮正式比赛场地';
 $('load-explain').textContent='所有真实模型已验证，正在渲染首次完整比赛画面…';
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
 } while((performance.now()-warmupStarted<(PARAMS.has('qa')||navigator.webdriver?850:320)||warmupFrames<7)&&warmupFrames<95);
 window.__ASDC_LOAD_METRICS.firstFrameReadyMs=Math.round(performance.now()-loadingStartedAt);
 clearTimeout(slowLoadTimer);
 const slowHintOnReady=$('load-slow');
 if(slowHintOnReady)slowHintOnReady.hidden=true;
 $('loading').hidden=true;
 ready=true;
 reply('ASDC_R45_SCENE_READY',{originalVRMRigs:actors.length,independentHostVRMRigs:hostSourceActors.length,
  loadedSummonGlbs:summonModels.size,unit3dKinds:14,finalArtApproved:false});
 broadcastCamera();
 requestAnimationFrame(loop);
 if(PARAMS.get('preview')==='1')window.__r45SceneQA.playDemo();
}catch(e){
 console.error('R45_SCENE_MODEL_LOAD_FAILED',e);
 // Never pretend a partially loaded arena is ready. Show a playable recovery
 // action instead of leaving the player stuck with an unclickable error.
 clearTimeout(slowLoadTimer);
 const loading=$('loading');
 const slowHint=$('load-slow');
 if(slowHint)slowHint.hidden=true;
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
 const shell=loading.querySelector('.load-shell');
 const step=loading.querySelector('#load-step');
 if(step)step.textContent='入场准备遇到问题';
 const explain=loading.querySelector('#load-explain');
 if(explain)explain.textContent='已暂停出牌，避免人物缺失或不完整的战斗。';
 if(shell)shell.append(message,retry);
 else loading.replaceChildren(message,retry);
 reply('ASDC_R45_SCENE_FAILED',{retryAvailable:true,modelReady:false});
}
