/**
 * R50 · Exact board-unit presence. This is a VISUAL projection of the real
 * single-arena board: it never creates units, applies damage, or changes turns.
 *
 * Quality contract: only E01/G01 have licensed full skinned VRM characters.
 * All other unit IDs get unmistakable "character model pending" 3D card
 * standees so a successful summon is never invisible or claimed as finished.
 */
import {BY_ID} from '../engine.mjs';
import {clone as cloneSkeleton} from 'three/addons/utils/SkeletonUtils.js';

const UNIT_IDS=Object.freeze(Object.keys(BY_ID).filter(id=>BY_ID[id].kind==='unit'));
const MODEL_IDS=new Set(['E01','G01']);
const P={ember:['#e7ae87','#753c31'],grove:['#aee0bd','#31574b'],tide:['#a8d8ff','#28516e']};
const GLYPHS={E02:'↗',E03:'★',E04:'✦',G02:'⌘',G03:'⚗',G04:'◇',
 T01:'♫',T02:'▤',T03:'↔',T04:'▣'};

function safeLabel(raw){
 return String(raw||'').replace(/[<>\n\r]/g,'').slice(0,18);
}

export function createSummonPresence(THREE,scene,{actors}){
 const root=new THREE.Group();
 root.name='R50_Board_Units_Only';
 scene.add(root);
 const entries=new Map(),pool=new Map();
 let current={player:[],ai:[]},revision=0,missing=0;
 let sequence=null,playedEvents=0,finishedSequences=0;
 const secondsPerHit=.90;
 const impact=new THREE.Group();
 impact.name='R51_Event_Linked_Impact';
 root.add(impact);
 const hitRing=new THREE.Mesh(new THREE.TorusGeometry(.47,.035,10,64),
  new THREE.MeshBasicMaterial({color:'#ffdeab',transparent:true,opacity:0,
   blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
 hitRing.position.y=1.35;hitRing.visible=false;impact.add(hitRing);
 const ribbon=new THREE.Mesh(new THREE.CylinderGeometry(.025,.07,1,12,1),
  new THREE.MeshBasicMaterial({color:'#ffe2ae',transparent:true,opacity:0,
   blending:THREE.AdditiveBlending,depthWrite:false}));
 ribbon.visible=false;impact.add(ribbon);
 const hitCanvas=document.createElement('canvas');
 hitCanvas.width=384;hitCanvas.height=192;
 const hitCtx=hitCanvas.getContext('2d');
 const hitTex=new THREE.CanvasTexture(hitCanvas);
 hitTex.colorSpace=THREE.SRGBColorSpace;
 const hitLabel=new THREE.Sprite(new THREE.SpriteMaterial({map:hitTex,
  transparent:true,opacity:0,depthWrite:false}));
 hitLabel.scale.set(1.8,.9,1);hitLabel.visible=false;impact.add(hitLabel);
 let lastHitSerial=-1;
 const markHit=(event)=>{
  hitCtx.clearRect(0,0,384,192);
  hitCtx.textAlign='center';hitCtx.textBaseline='middle';
  hitCtx.shadowColor='#170d11';hitCtx.shadowBlur=16;
  hitCtx.font='bold 78px sans-serif';hitCtx.fillStyle='#fff5cd';
  hitCtx.fillText(event.damage>0?'-'+event.damage:(event.blocked>0?'格挡':'闪避'),192,106);
  hitTex.needsUpdate=true;
 };
 const primary=new Map([['player:E01',actors.find(a=>a.id==='E01')],
                        ['ai:G01',actors.find(a=>a.id==='G01')]]);
 const mainActorSet=new Set(actors);

 function place(side,index){
  const sign=side==='player'?-1:1;
  const zPositions=[0,-1.40,1.40,-.82,.82];
  const xPositions=[1.75,2.13,2.13,3.07,3.07];
  return{x:sign*xPositions[index],y:0,z:zPositions[index]};
 }

 function cardStandee(id){
  const card=BY_ID[id],accent=P[card.style]||P.ember;
  const canvas=document.createElement('canvas');
  canvas.width=448;canvas.height=688;
  const ctx=canvas.getContext('2d');
  const g=ctx.createLinearGradient(0,0,448,688);
  g.addColorStop(0,accent[1]);g.addColorStop(.48,'#132c43');g.addColorStop(1,'#091b2c');
  ctx.fillStyle=g;ctx.fillRect(0,0,448,688);
  ctx.strokeStyle=accent[0];ctx.lineWidth=17;ctx.strokeRect(20,20,408,648);
  ctx.strokeStyle='#faf1d0';ctx.lineWidth=2;ctx.strokeRect(40,40,368,608);
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font='700 29px sans-serif';ctx.fillStyle=accent[0];
  ctx.fillText('召唤物 · '+id,224,106);
  ctx.font='bold 172px serif';ctx.fillText(GLYPHS[id]||'✦',224,322);
  ctx.font='bold 37px sans-serif';ctx.fillStyle='#fdf3df';
  const name=safeLabel(card.name);
  if(name.length>7){ctx.font='bold 30px sans-serif'}
  ctx.fillText(name,224,486);
  ctx.fillStyle='#ffd49b';ctx.font='700 29px sans-serif';
  ctx.fillText('角色模型制作中',224,565);
  ctx.fillStyle='#aec4d7';ctx.font='24px sans-serif';
  ctx.fillText('当前为三维卡位 · 非人物模型',224,612);
  const tex=new THREE.CanvasTexture(canvas);
  tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;
  const panelMat=new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide});
  const backMat=new THREE.MeshStandardMaterial({color:accent[1],metalness:.45,roughness:.4});
  const edgeMat=new THREE.MeshStandardMaterial({color:accent[0],metalness:.5,roughness:.3,
   emissive:new THREE.Color(accent[0]),emissiveIntensity:.16});
  const group=new THREE.Group();
  const body=new THREE.Mesh(new THREE.BoxGeometry(1.18,1.75,.085),backMat);
  body.position.y=1.15;body.castShadow=true;group.add(body);
  const face=new THREE.Mesh(new THREE.PlaneGeometry(1.1,1.69),panelMat);
  face.position.set(0,1.15,.05);group.add(face);
  const edge=new THREE.Mesh(new THREE.BoxGeometry(1.23,1.81,.038),edgeMat);
  edge.position.set(0,1.15,-.055);group.add(edge);
  // Do not occlude the actual visible character card with a fake humanoid.
  const halo=new THREE.Mesh(new THREE.RingGeometry(.43,.57,60),
    new THREE.MeshBasicMaterial({color:accent[0],transparent:true,opacity:.43,
     depthWrite:false,side:THREE.DoubleSide}));
  halo.position.y=.075;halo.rotation.x=-Math.PI/2;group.add(halo);
  const pedestal=new THREE.Mesh(new THREE.CylinderGeometry(.37,.48,.12,40),backMat);
  pedestal.position.y=.055;pedestal.receiveShadow=true;group.add(pedestal);
  group.userData.dispose=()=>{tex.dispose();panelMat.dispose();backMat.dispose();edgeMat.dispose();
   body.geometry.dispose();face.geometry.dispose();edge.geometry.dispose();
   halo.geometry.dispose();halo.material.dispose();pedestal.geometry.dispose();};
  group.name='R50_PENDING_3D_MODEL_'+id;
  return group;
 }

 function cloneReal(id){
  const source=actors.find(a=>a.id===id);
  if(!source)throw Error('R50 source VRM asset missing: '+id);
  const recycled=pool.get(id)?.pop();
  if(recycled)return recycled;
  const model=cloneSkeleton(source.model);
  // The clone preserves the same source skin and skeleton, not a substitute
  // mesh. Geometry and textures are shared; bone transforms are independent.
  const wrapper=new THREE.Group();
  model.traverse(obj=>{
   if(obj.isSkinnedMesh)obj.frustumCulled=false;
   if(obj.isBone){
    const rest=source.base.get(obj.name);
    if(rest)obj.quaternion.copy(rest);
   }
  });
  wrapper.add(model);
  wrapper.name='R50_ACTUAL_VRM_INSTANCE_'+id;
  wrapper.userData.skinnedMeshes=model.getObjectsByProperty('isSkinnedMesh',true).length;
  return wrapper;
 }

 function removeEntry(key){
  const state=entries.get(key);if(!state)return;
  if(state.kind==='original-vrm'){
   state.object.visible=false;
  }else{
   root.remove(state.object);
   state.object.visible=false;
   if(state.kind==='vrm-instance'){
    if(!pool.has(state.id))pool.set(state.id,[]);
    pool.get(state.id).push(state.object);
   }else state.object.userData.dispose?.();
  }
  entries.delete(key);
 }

 function sync(snapshot,{cinematic=false,force=false}={}){
  if(sequence&&!force){sequence.final=snapshot;return;}
  revision++;
  current=snapshot;
  const keep=new Set();
  const claimedOriginal=new Set();
  for(const side of ['player','ai']){
   const list=snapshot[side]||[];
   list.forEach((unit,index)=>{
    const id=unit.id,uid=unit.uid,key=side+':'+uid;
    if(!UNIT_IDS.includes(id))return;
    keep.add(key);
    let state=entries.get(key);
    if(state&&(state.id!==id||state.side!==side)){
     removeEntry(key);state=null;
    }
    if(!state){
     const uniqueKey=side+':'+id;
     const original=primary.get(uniqueKey);
     let kind,object;
     if(original&&!claimedOriginal.has(original)){
      object=original.pivot;kind='original-vrm';
      claimedOriginal.add(original);
     }else if(MODEL_IDS.has(id)){
      object=cloneReal(id);kind='vrm-instance';
      root.add(object);
     }else{
      object=cardStandee(id);kind='art-pending';
      root.add(object);
     }
     state={key,id,uid,side,index,kind,object,created:performance.now()};
     entries.set(key,state);
    }
    state.index=index;
    if(state.kind==='original-vrm')claimedOriginal.add(actors.find(a=>a.pivot===state.object));
    const pos=place(side,index);
    if(state.kind!=='original-vrm'){
     state.object.position.set(pos.x,0,pos.z);
     state.object.scale.setScalar(state.kind==='vrm-instance'?.78:1);
     state.object.rotation.y=state.kind==='vrm-instance'?(side==='player'?-2.38:2.38):0;
    }
    state.object.visible=true;
   });
  }
  for(const key of [...entries.keys()])if(!keep.has(key))removeEntry(key);
  // Only currently summoned first-team rigs may stay visible between fights.
  // The cinematic path is allowed to stage both only during its own 6.45s.
  for(const actor of mainActorSet){
   const active=[...entries.values()].some(e=>e.kind==='original-vrm'&&e.object===actor.pivot);
   actor.pivot.visible=active||cinematic;
  }
  missing=[...entries.values()].filter(e=>e.kind==='art-pending').length;
 }

 function anchor(side,uid,id){
  let value=entries.get(side+':'+uid);
  if(!value&&id)value=[...entries.values()].find(v=>v.side===side&&v.id===id);
  return value||null;
 }
 function sequenceHitStart(event){
  if(lastHitSerial!==event.serial){lastHitSerial=event.serial;markHit(event);}
 }
 function startSequence({events,pre,post},now){
  if(!Array.isArray(events)||!events.length)return false;
  const isUnitList=a=>Array.isArray(a)&&a.length<=5&&a.every(u=>
   typeof u?.uid==='string'&&/^U[0-9]+$/.test(u.uid)&&UNIT_IDS.includes(u.id));
  if(!isUnitList(pre?.player)||!isUnitList(pre?.ai)||
     !isUnitList(post?.player)||!isUnitList(post?.ai))return false;
  const ordered=events.filter(e=>e&&['exchange','direct_hit'].includes(e.type)&&
    ['player','ai'].includes(e.side)&&UNIT_IDS.includes(e.from)&&
    typeof e.attacker_uid==='string'&&/^U[0-9]+$/.test(e.attacker_uid)&&
    Number.isInteger(e.damage)&&e.damage>=0&&e.damage<=99&&
    Number.isInteger(e.serial)&&e.serial>0 &&
    (e.type==='direct_hit'||(UNIT_IDS.includes(e.to)&&
      typeof e.target_uid==='string'&&/^U[0-9]+$/.test(e.target_uid)))
  ).slice(0,12);
  if(!ordered.length)return false;
  // A new resolved turn supersedes prior cinematic state; game remains
  // authoritative. Restore exact pre-turn live units before the first hit.
  sequence=null;
  sync(pre,{force:true});
  sequence={events:ordered,started:now,final:post,index:-1};
  impact.visible=true;
  return true;
 }
 function sequenceStats(){
  return{active:!!sequence,queued:sequence?.events.length||0,
   index:sequence?.index??-1,playedEvents,finishedSequences};
 }
 function update(seconds,camera){
  const aim=new THREE.Vector3();
  for(const state of entries.values()){
   const object=state.object;
   if(state.kind==='art-pending'){
    aim.set(camera.position.x-object.position.x,0,camera.position.z-object.position.z);
    object.rotation.y=Math.atan2(aim.x,aim.z);
    const age=Math.min(1,(performance.now()-state.created)/480);
    object.scale.setScalar(.72+.28*(age*age*(3-2*age)));
    object.position.y=.017*Math.sin(seconds*1.9+state.index*1.2);
   }else if(state.kind==='vrm-instance'){
    object.position.y=.012*Math.sin(seconds*1.5+state.index);
   }
   // An exchange affects position only temporarily; resting pose is
   // reconstructed each frame and therefore cannot accumulate drift.
   const at=place(state.side,state.index);
   object.position.x=at.x;
   object.position.z=at.z;
   if(state.kind!=='original-vrm')object.rotation.z=0;
  }
  hitRing.visible=ribbon.visible=hitLabel.visible=false;
  if(sequence){
   const elapsed=Math.max(0,seconds-sequence.started);
   const index=Math.floor(elapsed/secondsPerHit);
   if(index>=sequence.events.length){
    const final=sequence.final;
    sequence=null;impact.visible=false;
    finishedSequences++;
    sync(final,{force:true});
   }else{
    if(index!==sequence.index){sequence.index=index;playedEvents++;}
    const event=sequence.events[index];
    const phase=(elapsed-index*secondsPerHit)/secondsPerHit;
    const attacker=anchor(event.side,event.attacker_uid,event.from);
    const target=event.type==='exchange'?
      anchor(event.side==='player'?'ai':'player',event.target_uid,event.to):null;
    const from=attacker?attacker.object.position.clone().add(new THREE.Vector3(0,1.35,0)):
       new THREE.Vector3(event.side==='player'?-1.8:1.8,1.35,0);
    const to=target?target.object.position.clone().add(new THREE.Vector3(0,1.35,0)):
       new THREE.Vector3(event.side==='player'?5.5:-5.5,1.65,.8);
    const ease=t=>{const v=Math.max(0,Math.min(1,t));return v*v*(3-2*v)};
    const lunge=ease((phase-.09)/.19)*(1-ease((phase-.42)/.35));
    const recoil=ease((phase-.42)/.09)*(1-ease((phase-.65)/.23));
    if(attacker){
     const sideSign=event.side==='player'?1:-1;
     attacker.object.position.x+=sideSign*.62*lunge;
     attacker.object.rotation.z=-sideSign*.11*lunge;
    }
    if(target){
     const sideSign=event.side==='player'?-1:1;
     target.object.position.x+=sideSign*.24*recoil;
     target.object.rotation.z=sideSign*.14*recoil;
    }
    // Three-dimensional shaft connects the actual attacker and the actual
    // victim, not a hard-coded E01/G01 shared hit position.
    const pulse=ease((phase-.31)/.10)*(1-ease((phase-.58)/.24));
    if(pulse>.01){
     sequenceHitStart(event);
     const center=from.clone().lerp(to,.75),line=to.clone().sub(from);
     ribbon.position.copy(from.clone().add(to).multiplyScalar(.5));
     ribbon.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),line.clone().normalize());
     ribbon.scale.set(1,line.length(),1);
     ribbon.material.opacity=.55*pulse;ribbon.visible=true;
     hitRing.position.copy(center);
     hitRing.lookAt(camera.position);
     hitRing.scale.setScalar(.55+1.1*(1-pulse));
     hitRing.material.opacity=.86*pulse;hitRing.visible=true;
     hitLabel.position.copy(to.clone().add(new THREE.Vector3(0,.52+(phase-.35)*.8,0)));
     hitLabel.material.opacity=.94*pulse;hitLabel.visible=true;
    }
   }
  }
 }
 function inspect(camera){
  const list=[...entries.values()].map(s=>{
   const v=s.object.getWorldPosition(new THREE.Vector3());
   const ndc=v.clone().add(new THREE.Vector3(0,s.kind==='art-pending'?1.3:1.4)).project(camera);
   return{side:s.side,uid:s.uid,id:s.id,kind:s.kind,visible:s.object.visible,
    inView:ndc.x>-1&&ndc.x<1&&ndc.y>-1&&ndc.y<1&&ndc.z>-1&&ndc.z<1,
    screen:[Number(ndc.x.toFixed(2)),Number(ndc.y.toFixed(2))],
    skins:s.kind==='vrm-instance'?s.object.userData.skinnedMeshes:undefined};
  });
  return{revision,total:list.length,models:list.filter(x=>x.kind!=='art-pending').length,
   pendingArt:missing,cardIds:[...UNIT_IDS],entries:list};
 }
 return{sync,update,inspect,startSequence,sequenceStats};
}
