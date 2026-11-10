/**
 * R45 verified card-identity fighter and one-stadium renderer.
 * Models are the SAME BASE VRM MESHES as R22's E01/G01 models, not the
 * old low-detail proxy rigs.
 * Visual-only choreography; canonical core.mjs owns all damage and winners.
 */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createStadium} from './stadium.mjs';
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
let lastTime=0,frames=0,actionFrames=0,impactFrames=0,drawCount=0,renderInfo=null;
let currentPayload=null,activePhase='idle',ready=false,hadContact=false;
let lastSourceIds=[],source3DAssetsVerified=false;
let horizontalFov=0;
let stadiumEvidence=null;
let shownCards={player:[],ai:[]};
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
 renderer.toneMappingExposure=1.32;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
 camera=new THREE.PerspectiveCamera(33,1,.1,60);
 camera.position.set(0,2.7,10.2);camera.lookAt(0,1.18,0);
 scene.add(new THREE.HemisphereLight('#cddffe','#455165',2.0));
 const key=new THREE.DirectionalLight('#ffdfbc',3.15);
 key.position.set(-4,8,5);key.castShadow=true;key.shadow.mapSize.set(2048,2048);
 key.shadow.camera.left=-7;key.shadow.camera.right=7;key.shadow.camera.top=7;key.shadow.camera.bottom=-7;
 key.shadow.bias=-.00018;scene.add(key);
 const rim=new THREE.DirectionalLight('#8abaff',2.25);rim.position.set(5,6,-4);scene.add(rim);
 const fill=new THREE.DirectionalLight('#ffd7b9',.75);fill.position.set(3,3,6);scene.add(fill);
 // Fully volumetric gymnasium: no 2D painted scene behind the fighters.
 stadiumEvidence=createStadium(THREE,scene,{detail:'medium'});
  clock=new THREE.Clock();
 onResize();window.addEventListener('resize',onResize);
 const gl=renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');
 renderInfo=ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);
}
function onResize(){
 if(!renderer)return;
 const w=window.innerWidth,h=window.innerHeight;
 renderer.setSize(w,h,false);camera.aspect=w/Math.max(h,1);
 const narrow=camera.aspect<.95;
 camera.fov=narrow?45:33;camera.position.set(0,narrow?2.65:2.7,narrow?12.4:10.2);
 camera.lookAt(0,narrow?1.25:1.18,0);camera.updateProjectionMatrix();
 horizontalFov=2*Math.atan(Math.tan(camera.fov*Math.PI/360)*camera.aspect)*180/Math.PI;
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
 const {m,skins,bones,vertices}=indexBones(original);
 const style=restoreR22Style(original,spec.id,m);
 if(skins<spec.minSkins||bones<spec.minBones||vertices<20000)
  throw Error(spec.id+' R22 identity mismatch: skins='+skins+' bones='+bones);
 const box=new THREE.Box3().setFromObject(original,true),dims=box.getSize(new THREE.Vector3());
 const scale=2.50/dims.y;
 const pivot=new THREE.Group(),character=new THREE.Group();
 original.scale.setScalar(scale);original.position.set(-(box.min.x+box.max.x)/2*scale,-box.min.y*scale,-(box.min.z+box.max.z)/2*scale);
 character.add(original);pivot.add(character);
 pivot.position.set(idx===0?-1.87:1.87,0,0);
 pivot.rotation.y=(idx===0?-2.38:2.38);
 pivot.visible=false;
 scene.add(pivot);
 const base=new Map();m.forEach((b,n)=>base.set(n,b.quaternion.clone()));
 // Very restrained color accents: preserve existing VRM source facial textures
 // and mesh identity; do not replace character geometry with generic proxy.
 const actor={id:spec.id,name:spec.name,source:spec.source,model:original,
  pivot,character,bones:m,base,skins,boneCount:bones,triangles:Math.round(vertices/3),style,
  restX:idx===0?-1.87:1.87,side:idx===0?'left':'right'};
 return actor;
}
function stageText(phase,details){
 if(phase!==activePhase){
  activePhase=phase;$('phase').textContent=PHASES[phase]||phase;
 }
 if(details)$('details').textContent=details;
}
function reactActor(a,sec){
 const left=a.side==='left';
 const sign=left?1:-1;
 const approach=smoothPulse(sec,.8,1.5,3.55,4.7);
 const attack=left?smoothPulse(sec,2.1,2.43,2.85,3.16):
   smoothPulse(sec,3.17,3.43,3.8,4.08);
 const block=left?smoothPulse(sec,3.75,3.86,4.12,4.42):
   smoothPulse(sec,2.69,2.8,3.16,3.5);
 const hit=left?smoothPulse(sec,3.84,3.90,4.15,4.35):
   smoothPulse(sec,2.79,2.9,3.20,3.46);
 const idle=Math.sin(sec*2.6+(left?0:1))*.012;
 a.pivot.position.x=a.restX+sign*(approach*.86+attack*.29-hit*.12);
 a.pivot.position.y=.014*Math.sin(sec*2)+(attack*.045);
 a.pivot.rotation.y=(left?-2.38:2.38)+sign*(attack*.20+block*.13);
 a.pivot.rotation.z=sign*(-attack*.11+hit*.16);
 a.character.rotation.x=attack*.10-hit*.14;
 a.character.rotation.z=sign*(-attack*.14+hit*.16);
 // Bone rotations are measured relative to this character's actual VRM rest
 // pose. Both characters retain unique mesh, skeleton, skin and face.
 setBone(a,'C_Spine',.015*idle,0,sign*(-attack*.08+hit*.15));
 setBone(a,'C_Chest',-attack*.12+hit*.12,0,sign*(-attack*.09+hit*.16));
 setBone(a,'C_Head',idle,0,sign*(-attack*.08+hit*.10));
 setBone(a,'R_UpperArm',-.95*attack-.28*block,0,-1.12+.35*attack);
 setBone(a,'R_LowerArm',-.60*attack-.2*block,0,-.08);
 setBone(a,'L_UpperArm',-.26*attack-.45*block,0,1.12-.25*attack);
 setBone(a,'L_LowerArm',-.25*block,0,.08);
 setBone(a,'L_UpperLeg',-.11*approach,0,0);
 setBone(a,'R_UpperLeg',.11*approach,0,0);
 setBone(a,'L_LowerLeg',.08*approach,0,0);
 setBone(a,'R_LowerLeg',-.08*approach,0,0);
 if(attack>.03||hit>.03)actionFrames++;
 if(hit>.1)impactFrames++;
}
function play(payload){
 if(!checkIncoming(payload))throw Error('R45 fight validation: only real E01 vs G01 roles accepted');
 currentPayload=structuredClone(payload);mode=payload.mode;playing=true;
 actors.forEach(a=>a.pivot.visible=true);
 time=0;hadContact=false;
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
 actors.forEach(a=>reactActor(a,t));
 const contact=t>=2.83&&t<3.11||t>=3.88&&t<4.15;
 $('impact').hidden=!playing||!contact;
 $('impact').textContent=t<3.5?(currentPayload?.event?
  '命中 · '+currentPayload.event.damage+'伤害':'攻击命中'):
  (currentPayload?.event?'反击 · '+currentPayload.event.retaliation:'反击');
 if(contact)hadContact=true;
 if(playing&&time>=DURATION){
  playing=false;time=0;
  actors.forEach(a=>a.pivot.visible=shownCards[a.side==='left'?'player':'ai'].includes(a.id));
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
 if(msg?.type==='ASDC_R45_BOARD'){
  if(!Array.isArray(msg.player)||!Array.isArray(msg.ai))return;
  const safe=list=>list.filter(id=>typeof id==='string'&&/^[EGT][0-9]{2}$/.test(id)).slice(0,5);
  shownCards={player:safe(msg.player),ai:safe(msg.ai)};
  if(!playing)actors.forEach(a=>a.pivot.visible=shownCards[a.side==='left'?'player':'ai'].includes(a.id));
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
  get actorVisibility(){return actors.map(a=>({id:a.id,visible:a.pivot.visible}))},
  get roles(){return actors.map(a=>({id:a.id,name:a.name,asset:a.source,
   bones:a.boneCount,skinnedMeshes:a.skins,triangles:a.triangles,
   recoloredMeshes:a.style.recolored,accessories:a.style.accessories}))},
  get sourceMatchesR22(){return source3DAssetsVerified},
  get renderer(){return renderInfo},
  get stadium(){return stadiumEvidence?.stats||null},
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
 $('loading').hidden=true;ready=true;stageText('idle','实际 VRM 模型已载入 · 待命');
 exposeQA();
 reply('ASDC_R45_SCENE_READY',{originalVRMRigs:actors.length});
 requestAnimationFrame(loop);
 if(PARAMS.get('preview')==='1')window.__r45SceneQA.playDemo();
}catch(e){
 console.error('R45_SCENE_MODEL_LOAD_FAILED',e);
 $('loading').textContent='真实 E01/G01 模型无法加载：'+String(e.message||e);
 $('loading').dataset.error='true';
}
