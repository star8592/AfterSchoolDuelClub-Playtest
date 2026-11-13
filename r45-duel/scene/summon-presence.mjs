/**
 * R50 · Exact board-unit presence. This is a VISUAL projection of the real
 * single-arena board: it never creates units, applies damage, or changes turns.
 *
 * R61 gameplay gate: all 14 unit IDs now render actual 3D mesh assets.
 * E01/G01 use established VRMs, other 12 load independently verified GLBs.
 * These temporary 3D meshes are NOT approved final character art.
 */
import {BY_ID} from '../engine.mjs';
import {clone as cloneSkeleton} from 'three/addons/utils/SkeletonUtils.js';
import {createVrmCharacterActing} from './vrm-character-acting.mjs';
import {instantiateSummon,UNIT_MODEL_IDS} from './summon-models.mjs';
import {faceOpponentYaw,faceOpponentDot} from './summon-orientation.mjs';
import {r90Choreography,isR90Human,R90_HIT_PHASE} from './combat-choreography.mjs';
import {ACTOR_COMEDY_SIGNATURES} from './actor-comedy-signatures.mjs';
import {choreographVictory} from './victory-choreography.mjs';
import {createFootContact} from './foot-contact.mjs';
import {createVisibleLifeActing} from './visible-life-acting.mjs';
import {createPropLifeActing} from './prop-life-acting.mjs';

const UNIT_IDS=Object.freeze(Object.keys(BY_ID).filter(id=>BY_ID[id].kind==='unit'));
const VRM_IDS=new Set(['E01','G01']);
export function createSummonPresence(THREE,scene,{actors,prototypes,onCombatImpact,lifeWorld=null}={}){
 if(!(prototypes instanceof Map)||prototypes.size!==12||
   UNIT_MODEL_IDS.some(id=>!prototypes.has(id))){
   throw Error('R61 fail-closed: all twelve summoned GLB prototypes must load');
 }
 const root=new THREE.Group();
 root.name='R50_Board_Units_Only';
 scene.add(root);
 const entries=new Map(),pool=new Map();
 let current={player:[],ai:[]},revision=0,lastUpdateSeconds=null;
 let comicGestures=0,comicBoneFrames=0,comicSummons=0,comicComboReacts=0;
 let lastComic=null;
 let sequence=null,playedEvents=0,finishedSequences=0;
 let celebration=null,celebrationFrames=0,celebratingActors=0;
 let hpDisplayMode='auto';
 const hpModes=new Set(['auto','full','compact','hidden']);
 function setHpDisplayMode(next){
  if(!hpModes.has(next))return false;
  hpDisplayMode=next;
  for(const entry of entries.values())if(entry.status)entry.status.last='';
  return true;
 }
 function activeHpStyle(camera){
  if(hpDisplayMode==='hidden')return 'hidden';
  if(hpDisplayMode!=='auto')return hpDisplayMode;
  return entries.size>=5||camera.aspect<.9?'compact':'full';
 }

 // Safe opt-out leaves the exact previous R89 event pipeline active.
 const r90MotionEnabled=(()=>{
  const local=new URLSearchParams(location.search).get('r90Motion');
  if(local==='off'||local==='on')return local!=='off';
  try{return window.parent===window||new URLSearchParams(window.parent.location.search).get('r90Motion')!=='off'}catch{return true}
 })();
 let r90ImpactTriggers=0;
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
 // R90: one shared 12-instance 3D burst, tinted per real attacking character.
 // One instanced draw call, no per-hit geometry allocation, and never emitted
 // for a missed/blocked direct attack without damage.
 const sparkMaterial=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,
  opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:true});
 const sparkBurst=new THREE.InstancedMesh(new THREE.TetrahedronGeometry(.065),sparkMaterial,12);
 sparkBurst.name='R90_Event_Impact_Sparks';sparkBurst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
 sparkBurst.frustumCulled=false;sparkBurst.visible=false;
 impact.add(sparkBurst);
 const sparkDummy=new THREE.Object3D(),sparkTint=new THREE.Color(),sparkWhite=new THREE.Color(0xffffff);
 let r90SparkBursts=0;

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


 // World-space HP is a HUD over the *real* unit, not a new character mesh.
 // The bar is redrawn only when the authoritative unit attributes change.
 function makeStatusTag(side,id){
  const cvs=document.createElement('canvas');
  cvs.width=512;cvs.height=160;
  const cx=cvs.getContext('2d');
  const tex=new THREE.CanvasTexture(cvs);
  tex.colorSpace=THREE.SRGBColorSpace;
  const material=new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false});
  const label=new THREE.Sprite(material);
  label.name='R52_Live_Unit_HP_'+side+'_'+id;
  label.scale.set(1.48,.46,1);
  root.add(label);
  const tag={label,canvas:cvs,ctx:cx,texture:tex,last:''};
  return tag;
 }
 function drawStatusTag(state,mode='full'){
  const tag=state.status;
  if(!tag)return;
  const hp=Math.max(0,state.hp||0),base=Math.max(1,BY_ID[state.id].hp);
  const maxHp=Math.max(base,hp);
  const key=[state.side,state.id,hp,state.attack,state.shield,maxHp,mode].join('/');
  if(key===tag.last)return;
  tag.last=key;
  const ctx=tag.ctx,c=tag.canvas;
  ctx.clearRect(0,0,c.width,c.height);
  const accent=state.side==='player'?'#b5eaff':'#ffd0a0';
  ctx.fillStyle='#091a2be5';
  ctx.beginPath();ctx.roundRect(5,6,502,147,23);ctx.fill();
  ctx.lineWidth=5;ctx.strokeStyle=accent;
  ctx.beginPath();ctx.roundRect(6,7,500,145,22);ctx.stroke();
  ctx.textBaseline='middle';ctx.textAlign='left';
  ctx.fillStyle='#fff4df';
  if(mode==='full'){
   ctx.font='bold 40px sans-serif';
   ctx.fillText(BY_ID[state.id].name.slice(0,8),25,53,365);
   ctx.textAlign='right';ctx.font='bold 42px sans-serif';
   ctx.fillStyle=hp===0?'#ff7777':'#fff0d7';
   ctx.fillText('♥'+hp,480,53);
  }else{
   ctx.font='bold 64px sans-serif';
   ctx.fillText(state.id,31,64);
   ctx.textAlign='right';
   ctx.fillStyle=hp===0?'#ff7777':'#fff0d7';
   ctx.fillText('♥'+hp,470,64);
  }
  ctx.fillStyle='#2b4655';
  ctx.beginPath();ctx.roundRect(27,106,456,23,9);ctx.fill();
  const ratio=Math.min(1,hp/maxHp);
  if(ratio>0){
   ctx.fillStyle=ratio<=.3?'#e76a5f':state.side==='player'?'#65dfca':'#ffb17c';
   ctx.beginPath();ctx.roundRect(27,106,Math.max(6,456*ratio),23,9);ctx.fill();
  }
  tag.texture.needsUpdate=true;
 }
 function setUnitVitals(state,unit){
  const data=unit||{};
  state.hp=Number.isFinite(data.hp)?Math.max(0,Math.round(data.hp)):BY_ID[state.id].hp;
  state.attack=Number.isFinite(data.attack)?Math.max(0,Math.round(data.attack)):BY_ID[state.id].attack;
  state.shield=Number.isFinite(data.shield)?Math.max(0,Math.round(data.shield)):0;
  drawStatusTag(state);
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

 function cloneGltf(id){
  const recycle=pool.get(id)?.pop();
  if(recycle){
   recycle.userData.r61?.play('idle');
   return recycle;
  }
  const template=prototypes.get(id);
  if(!template)throw Error('R61 missing actual 3D asset '+id);
  const asset=instantiateSummon(THREE,template);
  const object=asset.root;
  object.userData.r61=asset;
  return object;
 }
 function removeEntry(key){
  const state=entries.get(key);if(!state)return;
  if(state.kind==='original-vrm'){
   state.object.visible=false;
  }else{
   root.remove(state.object);
   state.object.visible=false;
   if(['vrm-instance','gltf-instance'].includes(state.kind)){
    state.object.userData.r61?.mixer?.stopAllAction();
    if(!pool.has(state.id))pool.set(state.id,[]);
    pool.get(state.id).push(state.object);
   }else throw Error('R61 unexpected model kind during despawn');
  }
  if(state.status){
   root.remove(state.status.label);
   state.status.material?.dispose?.();
   state.status.label.material.dispose();
   state.status.texture.dispose();
  }
  entries.delete(key);
  lifeWorld?.remove('unit:'+key);
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
     }else if(VRM_IDS.has(id)){
      object=cloneReal(id);kind='vrm-instance';
      root.add(object);
     }else{
      object=cloneGltf(id);kind='gltf-instance';
      root.add(object);
     }
     // R105: every E01/G01 board instance (including pooled opposite-side
     // copies) needs its OWN authentic VRM shoulder/elbow/wrist IK.
     // R96 only animated the two podium hosts; the cloned summons still
     // displayed the unposed source binding arms in normal gameplay.
     if(VRM_IDS.has(id)){
      const actor=actors.find(a=>a.id===id);
      if(!actor)throw Error('R105 missing source VRM identity '+id);
      if(!object.userData.r105Acting){
       object.userData.r105Acting=createVrmCharacterActing(THREE,object,{
        id,expressions:actor.faceExpressions,sourceRest:actor.base});
      }else object.userData.r105Acting.revive();
     }
     state={key,id,uid,side,index,kind,object,created:performance.now(),
      r117Rig:kind==='gltf-instance'?createVisibleLifeActing(THREE,object,id):null,
      r117Props:kind==='gltf-instance'?createPropLifeActing(THREE,object,id):null,
      acting:object.userData.r105Acting||null,
      comic:null,comicBones:null,status:makeStatusTag(side,id)};
     entries.set(key,state);
     lifeWorld?.register('unit:'+key,{id,side,role:'summon'});
    }
    state.index=index;
    setUnitVitals(state,unit);
    if(state.kind==='original-vrm')claimedOriginal.add(actors.find(a=>a.pivot===state.object));
    const pos=place(side,index);
    if(state.kind!=='original-vrm'){
     state.object.position.set(pos.x,0,pos.z);
     state.object.scale.setScalar(1);
     state.object.rotation.y=faceOpponentYaw(id,side);
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
  if([...entries.values()].some(e=>e.kind==='art-pending'))throw Error('R61 NO-STANDEES invariant failed');
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
  sequence={events:ordered,started:now,final:post,index:-1,impactStarted:false};
  impact.visible=true;
  return true;
 }
 function sequenceStats(){
  return{active:!!sequence,queued:sequence?.events.length||0,
   index:sequence?.index??-1,playedEvents,finishedSequences,
   r90MotionEnabled,r90ImpactTriggers,r90SparkBursts,impactStarted:sequence?.impactStarted||false,
   phase:sequence&&lastUpdateSeconds!==null?
    Number((((lastUpdateSeconds-sequence.started)%secondsPerHit)/secondsPerHit).toFixed(3)):null};
 }
 // Distinct gestures of the CURRENT REAL GLB/VRM body: short sleeve
 // swings, proud presenting poses, shocked recoil or schoolyard bounce.
 // This reads bones already present in the asset; it never fabricates actors.
 function realComicBones(state){
  if(state.comicBones)return state.comicBones;
  const bones=[];
  state.object.traverse(node=>{
   if(!node.isBone)return;
   const name=node.name.toLowerCase();
   if(!/(shoulder|upper.?arm|j_bip_[lr]_upperarm)/.test(name))return;
   const left=/(left|_l_|\.l|shoulderl|j_bip_l_)/.test(name);
   const right=/(right|_r_|\.r|shoulderr|j_bip_r_)/.test(name);
   if(left===right)return;
   bones.push({bone:node,side:left?-1:1,rest:node.quaternion.clone()});
  });
  state.comicBones=bones.slice(0,4);
  return state.comicBones;
 }
 const COMIC_MOTIONS=Object.freeze({
  salute:{duration:1.10,lift:.11,lean:.09,arm:.20,taps:1},
  chalk_hit:{duration:2.25,lift:.15,lean:.17,arm:.43,taps:1},
  chalk_direct:{duration:2.1,lift:.12,lean:.17,arm:.38,taps:1},
  broadcast_draw:{duration:2.0,lift:.12,lean:.09,arm:.37,taps:3},
  poster_shield:{duration:2.1,lift:.17,lean:-.12,arm:.46,taps:2},
  poster_draw:{duration:1.9,lift:.12,lean:-.07,arm:.28,taps:2}
 });
 function setComicGesture(state,type,now,serial){
  const motion=COMIC_MOTIONS[type];
  if(!state||!motion||!Number.isFinite(now)||!Number.isInteger(serial)||serial<=0)return false;
  // React with its existing native morph/rig animation FIRST.
  // True shoulder bones (when present) are layered in the update function.
  state.object.userData.r61?.play?.(type.startsWith('chalk')?'attack':
   type==='poster_shield'?'hit':'idle');
  const signature=ACTOR_COMEDY_SIGNATURES[state.id];
  state.comic={type,started:now,serial,motion,signature,
   baseYaw:state.object.rotation.y};
  realComicBones(state);
  comicGestures++;
  lastComic={type,id:state.id,side:state.side,serial,
   signature:signature?.name||'original',realBones:state.comicBones.length};
  return true;
 }
 function reactToSummon(side,id,serial,now){
  const found=[...entries.values()].filter(x=>x.side===side&&x.id===id).at(-1);
  if(!found)return false;
  if(setComicGesture(found,'salute',now,serial)){comicSummons++;return true}
  return false;
 }
 function reactToCombo(side,effect,target,serial,now){
  if(!['player','ai'].includes(side)||!Object.hasOwn(COMIC_MOTIONS,effect))return false;
  const own=[...entries.values()].filter(e=>e.side===side);
  if(!own.length)return false;
  // On a real shield, the engine's target UID chooses who performs the
  // protective gesture; otherwise the latest CURRENT real ally performs it.
  const subject=effect==='poster_shield'?
   own.find(e=>e.uid===target)||own.at(-1):own.at(-1);
  if(!setComicGesture(subject,effect,now,serial))return false;
  comicComboReacts++;
  return true;
 }
 function clearComicCombo(){
  for(const state of entries.values())if(state.comic){
   const baseYaw=state.comic.baseYaw;
   state.comic=null;
   state.object.userData.r61?.setCombatPose?.(null);
   state.object.rotation.y=baseYaw;
   for(const item of state.comicBones||[])item.bone.quaternion.copy(item.rest);
  }
 }
 let actualSpellReactions=0;
 function spellWorldAnchors(side,uids){
  if(!['player','ai'].includes(side)||!Array.isArray(uids))return [];
  return uids.slice(0,5).flatMap(uid=>{
   const state=entries.get(side+':'+uid);
   if(!state)return [];
   const p=state.object.getWorldPosition(new THREE.Vector3());
   return [{uid,id:state.id,x:p.x,y:p.y,z:p.z}];
  });
 }
 function reactToSpell(side,uids,now,element='earth'){
  if(!['player','ai'].includes(side)||!Array.isArray(uids)||uids.length>5)return 0;
  let affected=0;
  for(const uid of uids){
   if(typeof uid!=='string'||!/^U\d+$/.test(uid))continue;
   const state=entries.get(side+':'+uid);
   if(!state)continue; // Rule engine may already have removed defeated unit.
   state.r95SpellHit=now;
   state.r121SpellElement=element;
   state.object.userData.r61?.play?.('hit');
   affected++;
  }
  actualSpellReactions+=affected;
  return affected;
 }
 function celebrate(winner,seconds,{reduced=false}={}){
  if(!['player','ai','draw'].includes(winner)||!Number.isFinite(seconds))return false;
  if(celebration)return false;
  celebration={winner,requested:seconds,started:null,duration:6.4,reduced};
  return true;
 }
 function update(seconds,camera,{cinematic=false}={}){
  // The real attack sequence must finish BEFORE a victory dance starts.
  if(celebration&&!sequence&&celebration.started===null)
   celebration.started=seconds;
  const danceTime=celebration?.started===null?-1:seconds-(celebration?.started??seconds);
  const dancing=celebration&&danceTime>=0&&danceTime<celebration.duration;
  const dt=lastUpdateSeconds===null?0:Math.min(.07,Math.max(0,seconds-lastUpdateSeconds));
  lastUpdateSeconds=seconds;
  const labelStyle=activeHpStyle(camera);
  for(const state of entries.values()){
   const r61=state.object.userData.r61;
   if(r90MotionEnabled){
    r61?.setCombatPose?.(null);
    r61?.setClipRate?.(1);
   }
   if(r61?.update)r61.update(dt);else r61?.mixer?.update(dt);
   const realLife=lifeWorld?.read('unit:'+state.key,seconds);
   const lifeBusy=!!sequence||!!state.comic||!!celebration||cinematic;
   state.r117Rig?.apply(seconds,realLife,{reduced:!!celebration?.reduced,
     busy:lifeBusy,mixerDriven:!!r61?.r119Skin});
   state.r117Props?.update(seconds,realLife,{reduced:!!celebration?.reduced,
     busy:lifeBusy});
   // Board VRMs must not be left in their bind T/A pose. During the
   // independent R45 fight sequence the original actor is driven by its
   // cinematic controller, so never double-write that same skeleton.
   if(state.acting&&!(cinematic&&state.kind==='original-vrm')){
    state.acting.update(seconds,{seed:state.side==='player'?.4:2.1,
     suppressEntrance:true});
   }
   if(state.comic&&!sequence){
    const c=state.comic,m=c.motion,elapsed=seconds-c.started;
    const p=Math.max(0,Math.min(1,elapsed/m.duration));
    if(elapsed>=m.duration){
     state.object.rotation.y=c.baseYaw;
     state.comic=null;
     state.object.userData.r61?.setCombatPose?.(null);
     for(const b of state.comicBones||[])b.bone.quaternion.copy(b.rest);
    }else{
     const envelope=Math.sin(Math.PI*p);
     const sig=c.signature||{name:'default',turn:0,arm:1,taps:1,lift:1};
     const bounce=Math.sin(p*Math.PI*2*(m.taps+Math.max(0,sig.taps-2)*.36));
     state.object.rotation.y=c.baseYaw+sig.turn*envelope*bounce;
     const asym=state.side==='player'?1:-1;
     // Pose the genuine loaded GLB skeleton through its real shoulder bones.
     // Use a fixed rest reference so there is NEVER cumulative T-/A-pose
     // distortion after the short gesture ends.
     for(const entry of state.comicBones||[]){
      const turn=m.arm*sig.arm*envelope*(.63+.37*bounce)*entry.side*asym;
      entry.bone.quaternion.copy(entry.rest);
      entry.bone.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(
       new THREE.Vector3(0,0,1),turn));
      comicBoneFrames++;
     }
     // This is an additional small whole-character performance layer,
     // NOT a synthetic replacement mesh or a fake skeleton.
     state.object.userData.r61?.setCombatPose?.({
      lean:asym*m.lean*envelope,
      upperTwist:asym*(m.arm*.19)*bounce*envelope,
      lift:m.lift*sig.lift*Math.abs(bounce)*envelope});
    }
   }
   if(state.status&&labelStyle!=='hidden')drawStatusTag(state,labelStyle);
   const object=state.object;
   if(state.kind==='vrm-instance'||state.kind==='gltf-instance'){
    const hover=state.kind==='gltf-instance'?(prototypes.get(state.id)?.spec.hover||0):0;
    object.position.y=hover+(hover?.032:.008)*Math.sin(seconds*1.5+state.index);
   }
   // An exchange affects position only temporarily; resting pose is
   // reconstructed each frame and therefore cannot accumulate drift.
   const at=place(state.side,state.index);
   if(state.kind!=='original-vrm'||!cinematic){
    object.position.x=at.x;
    object.position.z=at.z;
   }
   if(state.kind!=='original-vrm')object.rotation.z=0;
   // Actors on the winning side dance together on the SAME rhythmic beat;
   // rivals perform a restrained dejected pose. Real shoulder rigs are
   // animated when available, never replaced by proxy meshes.
   if(dancing&&state.kind!=='art-pending'){
    const move=choreographVictory({elapsed:danceTime,
     winner:celebration.winner,side:state.side,id:state.id,
     index:state.index,reduced:celebration.reduced});
    const idling=state.kind==='gltf-instance'||state.kind==='vrm-instance';
    if(idling){
     const at=place(state.side,state.index);
     const hover=state.kind==='gltf-instance'?(prototypes.get(state.id)?.spec.hover||0):0;
     object.position.y=at.y+hover+move.bob;
    }
    if(state.kind!=='original-vrm'){
     object.rotation.z=move.lean;
     object.rotation.y=faceOpponentYaw(state.id,state.side)+move.yaw;
    }
    object.position.x+=move.x*(state.side==='player'?1:-1);
    // Never accumulate rotation into the bind pose. Existing glTF clips
    // update the bones earlier in this frame; static models start from rest.
    const arms=realComicBones(state);
    for(const arm of arms){
     if(state.comic)continue;
     if(!r61?.mixer)arm.bone.quaternion.copy(arm.rest);
     const angle=arm.side<0?-move.left:move.right;
     arm.bone.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0,0,1),angle*arm.side));
    }
    if(!state.r114FootContact)
     state.r114FootContact=createFootContact(THREE,object,state.id);
    const grounded=!(state.kind==='gltf-instance'&&
      (prototypes.get(state.id)?.spec.hover||0)>.01);
    if(!state.r114FootContact.enabled&&grounded&&state.kind!=='original-vrm'){
     // Some Blender Studio GLBs expose only baked pose channels to the
     // runtime scene graph; do not invent leg bones or lift their shoes.
     object.position.y=at.y;
     object.position.x=at.x+move.x*.32*(state.side==='player'?1:-1);
    }
    state.r114FootContact.apply(danceTime,move.stage,state.index,
     celebration.reduced,{animated:!!r61?.mixer,grounded});
    state.r113DanceStage=move.stage;
    celebrationFrames++;if(move.weight>.15)celebratingActors++;
   }else if(!state.comic&&!sequence&&!cinematic&&!celebration){
    // Return to the original authored idle after a short contextual gesture.
    if(state.r116LifeClip&&seconds>state.r116ClipUntil){
     r61?.play?.('idle');state.r116LifeClip=null;
    }
    // The individual's attention, confidence, recent impact and personality
    // now determine its small idle gestures. Don't move feet or fight clips.
    const life=lifeWorld?.read('unit:'+state.key,seconds);
    state.lifePose=life||null;
    if(state.kind!=='original-vrm'&&life){
     if((state.id==='M02'||r61?.r119Skin)&&life.intent!=='idle'&&
       life.lastAction&&state.r116LastLifeAt!==life.lastAction.at&&
       life.weight>.32&&!state.r116LifeClip){
      // Characters have different physical ways of interpreting one event.
      // The five live-skin trial actors use their own bound source joints;
      // M02 retains its ten real authored source animations and hand-held prop.
      const clipByIntent=r61?.r119Skin?{
       challenge:'R119_Skeletal_Challenge',hands_hips:'R119_Skeletal_Challenge',
       half_wave:'R119_Skeletal_Challenge',tiny_clap:'R119_Skeletal_Celebrate',
       cheer:'R119_Skeletal_Celebrate',smirk:'R119_Skeletal_Challenge',
       flinch:'R119_Skeletal_Worry',peek:'R119_Skeletal_Worry',
       scratch:'R119_Skeletal_Worry',headshake:'R119_Skeletal_Worry',
       fidget:'R119_Skeletal_Worry',defeat:'R119_Skeletal_Worry'
      }:{
       challenge:'Angry_Stomp',hands_hips:'Shrug',
       peek:'Confused_Scratch',scratch:'Confused_Scratch',
       half_wave:'Big_Wave_Hello',tiny_clap:'Jazz_Hands',
       cheer:'Victory_Cheer',headshake:'Confused_Scratch'};
      const name=clipByIntent[life.intent];
      if(name){
       const duration=r61?.playLifeClip?.(name)||0;
       if(duration>0){
        state.r116LastLifeAt=life.lastAction.at;
        state.r116LifeClip=name;
        state.r116ClipUntil=seconds+Math.min(duration,2.8);
       }
      }
     }
     object.rotation.z=life.tilt*.65;
     object.rotation.y=faceOpponentYaw(state.id,state.side)+life.yaw*.25;
    }else if(state.kind!=='original-vrm'){
     const n=state.id.split('').reduce((v,c)=>v+c.charCodeAt(0),0)+state.index*37;
     object.rotation.z=Math.sin(seconds*(.43+(n%7)*.073)+n*.17)*.011;
    }
   }
   const tag=state.status?.label;
   if(tag){
    // Compress by card ID + HP in dense battles; one button can restore
    // names or suppress labels entirely. Never create a billboard wall.
    const compact=labelStyle==='compact';
    tag.scale.set(labelStyle==='hidden'?.01:compact?.94:1.48,
                  labelStyle==='hidden'?.01:compact?.30:.46,1);
    tag.position.copy(object.position);
    const height=state.kind==='gltf-instance'?
      (prototypes.get(state.id)?.measured.scaledHeight||2.1):2.12;
    const hover=state.kind==='gltf-instance'?(prototypes.get(state.id)?.spec.hover||0):0;
    tag.position.y+=Math.max(.85,height+hover+.24)+(compact&&state.index%2?.15:0);
    tag.visible=labelStyle!=='hidden'&&object.visible;
   }
  }
  if(celebration&&danceTime>=celebration.duration){
   for(const e of entries.values()){
    for(const b of e.comicBones||[])b.bone.quaternion.copy(b.rest);
    if(e.kind!=='original-vrm'){
     e.object.rotation.z=0;
     e.object.rotation.y=faceOpponentYaw(e.id,e.side);
    }
   }
   for(const e of entries.values())e.r114FootContact?.reset();
   celebration=null;
  }
  for(const state of entries.values()){
   const age=seconds-(state.r95SpellHit??-100);
   if(age<0||age>.73)continue;
   const envelope=Math.sin(Math.PI*age/.73);
   const element=state.r121SpellElement||'earth';
   const angle=({electric:.21,ice:.045,fire:.17,water:.15,wind:.27,
    sound:.20,earth:.14,metal:.13,space:.22,time:.015,shadow:.18,
    light:.15,wood:.09,mind:.22,absurd:.29})[element]??.11;
   const sign=state.side==='player'?-1:1;
   state.object.rotation.z+=sign*angle*envelope;
   state.object.rotation.x+=element==='wind'?.13*envelope:
    element==='time'?.014*envelope:element==='electric'?.10*Math.sin(age*48)*envelope:0;
   state.object.position.x+=sign*(element==='wind'?.27:element==='time'?.02:.14)*envelope;
   if(element==='absurd')state.object.position.y+=.13*envelope;
   if(element==='electric')state.object.rotation.y+=.08*Math.sin(age*53)*envelope;
   if(element==='ice')state.object.rotation.z+=.026*Math.sin(age*28)*envelope;
  }
  hitRing.visible=ribbon.visible=hitLabel.visible=false;
  sparkBurst.visible=false;
  if(sequence){
   const elapsed=Math.max(0,seconds-sequence.started);
   const index=Math.floor(elapsed/secondsPerHit);
   if(index>=sequence.events.length){
    const final=sequence.final;
    sequence=null;impact.visible=false;
    finishedSequences++;
    sync(final,{force:true});
    for(const e of entries.values())e.object.userData.r61?.play('idle');
    if(r90MotionEnabled)for(const e of entries.values()){
     e.object.userData.r61?.setCombatPose?.(null);
     e.object.userData.r61?.setClipRate?.(1);
    }
   }else{
    if(index!==sequence.index){
     sequence.index=index;playedEvents++;
     sequence.impactStarted=false;
     const newly=sequence.events[index];
     anchor(newly.side,newly.attacker_uid,newly.from)?.object.userData.r61?.play('attack');
     if(!r90MotionEnabled&&newly.type==='exchange')
      anchor(newly.side==='player'?'ai':'player',newly.target_uid,newly.to)?.object.userData.r61?.play('hit');
    }
    const event=sequence.events[index];
    const phase=(elapsed-index*secondsPerHit)/secondsPerHit;
    if(r90MotionEnabled&&!sequence.impactStarted&&phase>=R90_HIT_PHASE){
     sequence.impactStarted=true;
     if(event.type==='exchange'){
      const hit=anchor(event.side==='player'?'ai':'player',event.target_uid,event.to);
      hit?.object.userData.r61?.play('hit');
     }
     if(typeof onCombatImpact==='function')
      onCombatImpact({...event});
     r90ImpactTriggers++;
     if(event.damage>0)r90SparkBursts++;
    }
    if(phase>.48){
     const targetUnit=anchor(event.side==='player'?'ai':'player',event.target_uid,event.to);
     const atkUnit=anchor(event.side,event.attacker_uid,event.from);
     if(targetUnit&&Number.isFinite(event.target_hp_after)&&targetUnit.hp!==event.target_hp_after){
      targetUnit.hp=Math.max(0,event.target_hp_after);drawStatusTag(targetUnit);
     }
     if(atkUnit&&Number.isFinite(event.attacker_hp_after)&&atkUnit.hp!==event.attacker_hp_after){
      atkUnit.hp=Math.max(0,event.attacker_hp_after);drawStatusTag(atkUnit);
     }
    }
    const attacker=anchor(event.side,event.attacker_uid,event.from);
    const target=event.type==='exchange'?
      anchor(event.side==='player'?'ai':'player',event.target_uid,event.to):null;
    const from=attacker?attacker.object.position.clone().add(new THREE.Vector3(0,1.35,0)):
       new THREE.Vector3(event.side==='player'?-1.8:1.8,1.35,0);
    const to=target?target.object.position.clone().add(new THREE.Vector3(0,1.35,0)):
       new THREE.Vector3(event.side==='player'?5.5:-5.5,1.65,.8);
    const ease=t=>{const v=Math.max(0,Math.min(1,t));return v*v*(3-2*v)};
    const motion=r90MotionEnabled?r90Choreography(phase,event.from,event.to,event.damage):null;
    const lunge=ease((phase-.09)/.19)*(1-ease((phase-.42)/.35));
    const recoil=ease((phase-.42)/.09)*(1-ease((phase-.65)/.23));
    if(attacker){
     const sign=event.side==='player'?1:-1;
     attacker.object.position.x+=sign*(motion?motion.attacker.offset:.62*lunge);
     attacker.object.rotation.z=-sign*(motion?motion.attacker.lean:.11*lunge);
     if(motion&&isR90Human(event.from)){
      attacker.object.userData.r61?.setCombatPose?.({
       lean:-.105*motion.wind+.115*motion.thrust,
       upperTwist:sign*motion.attacker.upperTwist,
       lift:motion.attacker.lift});
      if(motion.freeze)attacker.object.userData.r61?.setClipRate?.(0);
     }
    }
    if(target){
     const sign=event.side==='player'?-1:1;
     target.object.position.x+=sign*(motion?motion.defender.offset:.24*recoil);
     target.object.rotation.z=sign*(motion?motion.defender.lean:.14*recoil);
     if(motion&&isR90Human(event.to)){
      target.object.userData.r61?.setCombatPose?.({
       lean:sign*.115*motion.knocked,
       upperTwist:sign*motion.defender.upperTwist,
       lift:motion.defender.lift});
      if(motion.freeze)target.object.userData.r61?.setClipRate?.(0);
     }
    }
    for(const state of [attacker,target]){
     if(state?.status?.label)state.status.label.position.x=state.object.position.x;
    }
    // Three-dimensional shaft connects the actual attacker and the actual
    // victim, not a hard-coded E01/G01 shared hit position.
    const pulse=motion?motion.impact:ease((phase-.31)/.10)*(1-ease((phase-.58)/.24));
    if(pulse>.01){
     sequenceHitStart(event);
     const center=from.clone().lerp(to,motion?.85:.75),line=to.clone().sub(from);
     ribbon.position.copy(from.clone().add(to).multiplyScalar(.5));
     ribbon.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),line.clone().normalize());
     ribbon.scale.set(1,line.length(),1);
     ribbon.material.opacity=.55*pulse;ribbon.visible=true;
     hitRing.position.copy(center);
     hitRing.lookAt(camera.position);
     hitRing.scale.setScalar(.55+1.1*(1-pulse));
     if(motion)hitRing.material.color.setHex(motion.color);
    hitRing.material.opacity=.86*pulse;hitRing.visible=true;
     hitLabel.position.copy(to.clone().add(new THREE.Vector3(0,.52+(phase-.35)*.8,0)));
     hitLabel.material.opacity=.94*pulse;hitLabel.visible=true;
    if(motion&&event.damage>0&&phase>=.41&&phase<.78){
     const born=Math.max(0,Math.min(1,(phase-.41)/.34));
     const sparkAlpha=ease((phase-.40)/.06)*(1-ease((phase-.68)/.12));
     const spread=(.16+.9*born)*motion.sparks;
     const baseColor=motion.color;
     for(let i=0;i<12;i++){
      const a=(i*2.399963+event.serial*.035);
      const sx=Math.cos(a),sy=Math.sin(a);
      sparkDummy.position.set(to.x+spread*sx,to.y+spread*.67*sy+.055*born,
       to.z+Math.sin(a*1.9)*spread*.30);
      sparkDummy.rotation.set(phase*9+i*.13,phase*6+i*.18,phase*7+i*.24);
      const r=(.7+.7*(1-born))*(i%3===0?1.18:.72);
      sparkDummy.scale.setScalar(Math.max(.001,r));sparkDummy.updateMatrix();
      sparkBurst.setMatrixAt(i,sparkDummy.matrix);
      sparkTint.setHex(baseColor).lerp(sparkWhite,i%3===0?.72:.15);
      sparkBurst.setColorAt(i,sparkTint);
     }
     sparkBurst.instanceMatrix.needsUpdate=true;
     if(sparkBurst.instanceColor)sparkBurst.instanceColor.needsUpdate=true;
     sparkMaterial.opacity=.85*sparkAlpha;
     sparkBurst.visible=true;
    }
    }
   }
  }
 }
 // R119 evidence: a rendered vertex really follows its weighted arm bone.
 // This path runs ONLY when the QA scene inspector is requested, never as a
 // 60-fps per-vertex deformation poller or a synthetic animation substitute.
 function inspectRealSkinnedVertices(state){
  const r=state.object.userData.r61;
  if(!r?.r119Skin)return null;
  const meshes=[];
  r.instance.traverse(o=>{
   if(o.isSkinnedMesh&&o.geometry?.attributes?.skinIndex&&
      o.geometry?.attributes?.skinWeight&&o.geometry?.attributes?.position)
    meshes.push(o);
  });
  const norm=x=>String(x||'').toLowerCase().replace(/[^a-z0-9]/g,'');
  const upperNames=new Set([
   'DEF-UpperArm1.R','DEF-Shoulder.R','DEF-Forearm1.R','DEF-Upperarm.R'
  ].map(norm));
  meshes.sort((x,y)=>
   Number(/body|arms|upper|shirt|jacket|sleeve/i.test(y.name))-
   Number(/body|arms|upper|shirt|jacket|sleeve/i.test(x.name)));
  let chosen=null;
  for(const mesh of meshes){
   const joints=mesh.skeleton.bones;
   const jointIndex=joints.findIndex(b=>b&&upperNames.has(norm(b.name)));
   if(jointIndex<0)continue;
   const ix=mesh.geometry.attributes.skinIndex,
     wt=mesh.geometry.attributes.skinWeight;
   const position=mesh.geometry.attributes.position;
   let sample=-1,sampleWeight=0;
   for(let v=0;v<position.count;v++){
    for(let k=0;k<4;k++){
     const boneIndex=ix.getComponent(v,k),weight=wt.getComponent(v,k);
     if(boneIndex===jointIndex&&weight>.28){
      if(weight>sampleWeight){sample=v;sampleWeight=weight;}
     }
    }
    if(sampleWeight>.92)break;
   }
   if(sample>=0){chosen={mesh,jointIndex,sample,sampleWeight};break;}
  }
  if(!chosen)return {valid:false,skinnedMeshes:meshes.length,reason:'no_arm_weighted_vertex'};
  const {mesh,jointIndex,sample,sampleWeight}=chosen;
  mesh.updateWorldMatrix(true,false);
  const pos=new THREE.Vector3().fromBufferAttribute(
    mesh.geometry.attributes.position,sample);
  if(typeof mesh.applyBoneTransform!=='function')
   return {valid:false,skinnedMeshes:meshes.length,reason:'no_cpu_skin_transform'};
  mesh.applyBoneTransform(sample,pos);
  const last=state.r119MeshProbe;
  if(!last||last.sample!==sample||last.mesh!==mesh.uuid)
   state.r119MeshProbe={mesh:mesh.uuid,sample,first:pos.clone(),
     previous:pos.clone(),maxTravel:0,maxFrameDelta:0,sampledFrames:1};
  else{
   last.maxTravel=Math.max(last.maxTravel,pos.distanceTo(last.first));
   last.maxFrameDelta=Math.max(last.maxFrameDelta,pos.distanceTo(last.previous));
   last.previous.copy(pos);last.sampledFrames++;
  }
  const history=state.r119MeshProbe;
  const normBone=x=>String(x||'').toLowerCase().replace(/[^a-z0-9]/g,'');
  const boneList=mesh.skeleton.bones.filter(Boolean);
  const findBone=(names)=>boneList.find(x=>names.some(n=>normBone(x.name)===normBone(n)));
  const armPosture={};
  for(const side of ['L','R']){
   const upper=findBone(['DEF-UpperArm1.'+side,'DEF-Upperarm1.'+side,'DEF-UpperArm_1.'+side]);
   const elbow=findBone(['DEF-Forearm1.'+side,'DEF-Forearm_1.'+side]);
   if(!upper||!elbow){armPosture[side]={valid:false};continue}
   upper.updateWorldMatrix(true,false);elbow.updateWorldMatrix(true,false);
   const a=upper.getWorldPosition(new THREE.Vector3());
   const b=elbow.getWorldPosition(new THREE.Vector3());
   const len=a.distanceTo(b);
   armPosture[side]=len>.001?{valid:true,
    verticalDrop:+((a.y-b.y)/len).toFixed(4),
    span:+(Math.hypot(a.x-b.x,a.z-b.z)/len).toFixed(4)}:{valid:false};
  }
  return{valid:true,source:'actual_skinned_vertex',skinnedMeshes:meshes.length,
   armPosture,
   meshName:mesh.name,instanceMeshUUID:mesh.uuid,
   weightedBone:mesh.skeleton.bones[jointIndex].name,
   weightedBoneUUID:mesh.skeleton.bones[jointIndex].uuid,
   skinVertex:sample,skinWeight:+sampleWeight.toFixed(4),
   sample:[+pos.x.toFixed(4),+pos.y.toFixed(4),+pos.z.toFixed(4)],
   sampledFrames:history.sampledFrames,
   maxTravel:+history.maxTravel.toFixed(5),
   maxFrameDelta:+history.maxFrameDelta.toFixed(5)};
 }
 function inspect(camera){
  const list=[...entries.values()].map(s=>{
   const v=s.object.getWorldPosition(new THREE.Vector3());
   const ndc=v.clone().add(new THREE.Vector3(0,s.kind==='gltf-instance'?1.0:1.4)).project(camera);
   // Diagnostic footprint from the actual transformed mesh (not requested height).
   // Eight projected AABB corners provide a conservative screen-space estimate.
   const bounds=new THREE.Box3().setFromObject(s.object,true);
   const size=bounds.getSize(new THREE.Vector3());
   const projected=[];
   for(const x of [bounds.min.x,bounds.max.x])
    for(const y of [bounds.min.y,bounds.max.y])
     for(const z of [bounds.min.z,bounds.max.z]){
      const t=new THREE.Vector3(x,y,z).project(camera);
      projected.push(t);
     }
   const screenBBox={
    left:Math.min(...projected.map(t=>t.x)),right:Math.max(...projected.map(t=>t.x)),
    top:Math.max(...projected.map(t=>t.y)),bottom:Math.min(...projected.map(t=>t.y))
   };
   const metrics={
    width:Number(size.x.toFixed(3)),height:Number(size.y.toFixed(3)),
    depth:Number(size.z.toFixed(3)),minY:Number(bounds.min.y.toFixed(3)),
    maxY:Number(bounds.max.y.toFixed(3)),
    coverageWidth:Number(((screenBBox.right-screenBBox.left)*.5).toFixed(3)),
    coverageHeight:Number(((screenBBox.top-screenBBox.bottom)*.5).toFixed(3)),
    withinFrame:screenBBox.left>-1&&screenBBox.right<1&&screenBBox.top<1&&screenBBox.bottom>-1,
    ndcBounds:Object.fromEntries(Object.entries(screenBBox).map(([k,n])=>[k,Number(n.toFixed(3))]))
   };
   metrics.frontDot=Number(faceOpponentDot(THREE,s.object,s.side,s.id).toFixed(4));
   if(s.acting){
    const arms={};
    for(const hand of ['R','L']){
     const upper=s.object.getObjectByName('J_Bip_'+hand+'_UpperArm');
     const lower=s.object.getObjectByName('J_Bip_'+hand+'_LowerArm');
     const wrist=s.object.getObjectByName('J_Bip_'+hand+'_Hand');
     if(!upper||!lower||!wrist){arms[hand]={valid:false};continue}
     const u=upper.getWorldPosition(new THREE.Vector3());
     const e=lower.getWorldPosition(new THREE.Vector3());
     const w=wrist.getWorldPosition(new THREE.Vector3());
     const dir=e.clone().sub(u).normalize();
     arms[hand]={valid:true,drop:+dir.y.toFixed(3),
      spread:+Math.hypot(dir.x,dir.z).toFixed(3),
      wristToShoulder:+w.distanceTo(u).toFixed(3)};
    }
    metrics.pose={arms,animation:s.acting.inspect().mode};
   }
   // R63 read-only visual evidence: distinguish real per-wing GLB morphs
   // from an unchanged R62 plane or an animated whole-scene transform.
   let wingMorph=null;
   if(s.id==='E02'&&s.kind==='gltf-instance'){
    const parts={};
    s.object.traverse(node=>{
     const role=node.userData?.patch_r60_role;
     if(role==='wing_left'||role==='wing_right'){
      parts[role]={weights:node.morphTargetInfluences?.slice()||[],
       textured:!!node.material?.map,normal:!!node.material?.normalMap,
       roughness:!!node.material?.roughnessMap};
     }
    });
    if(parts.wing_left&&parts.wing_right)wingMorph=parts;
   }
   return{side:s.side,uid:s.uid,id:s.id,kind:s.kind,visible:s.object.visible,
    trueWorldYaw:Number(s.object.rotation.y.toFixed(6)),metrics,wingMorph,
    hp:s.hp,attack:s.attack,shield:s.shield,
    hpTag:!!s.status?.label.visible,
    hpTagPosition:s.status?.label.position.toArray().map(v=>Number(v.toFixed(2))),
    position:v.toArray().map(v=>Number(v.toFixed(2))),
    inView:ndc.x>-1&&ndc.x<1&&ndc.y>-1&&ndc.y<1&&ndc.z>-1&&ndc.z<1,
    screen:[Number(ndc.x.toFixed(2)),Number(ndc.y.toFixed(2))],
    skins:s.kind==='vrm-instance'?s.object.userData.skinnedMeshes:
     s.kind==='gltf-instance'?prototypes.get(s.id).source.children.length:undefined,
    meshes:s.kind==='gltf-instance'?s.object.userData.r61?.meshCount:undefined,
    clips:s.kind==='gltf-instance'?s.object.userData.r61?.animationCount:undefined,
    playingClips:s.kind==='gltf-instance'?s.object.userData.r61?.getPlayingClips?.():undefined,
    r90Pose:s.kind==='gltf-instance'?s.object.userData.r61?.getCombatPose?.():undefined,
    r90ClipRate:s.kind==='gltf-instance'?s.object.userData.r61?.getClipRate?.():undefined,
    artApproved:false};
  });
  return{revision,
   r102Comedy:{gestures:comicGestures,summons:comicSummons,
    comboReactions:comicComboReacts,boneFrames:comicBoneFrames,
    active:[...entries.values()].filter(x=>!!x.comic).map(x=>({
     id:x.id,uid:x.uid,type:x.comic.type,serial:x.comic.serial,
     shoulderBoneCount:x.comicBones?.length||0})),
    lastComic},
   r117PropLife:[...entries.values()].map(x=>({
    id:x.id,uid:x.uid,side:x.side,...(x.r117Props?.inspect()||{enabled:false,frames:0})})),
   r119TrueSkinVertices:[...entries.values()].map(x=>({
    id:x.id,uid:x.uid,side:x.side,
    ...(inspectRealSkinnedVertices(x)||{valid:false,reason:'not_r119_study'})})),
   r117CharacterMotion:[...entries.values()].map(x=>({
    id:x.id,uid:x.uid,side:x.side,
    ...(x.r117Rig?.inspect()||{enabled:false,frames:0})})),
   r116LifeStates:[...entries.values()].map(x=>({
    uid:x.uid,id:x.id,side:x.side,
    life:lifeWorld?.read('unit:'+x.key,lastUpdateSeconds||0)||null,
    livingClip:x.r116LifeClip||null})),
   r114FootContacts:[...entries.values()].map(x=>({
    id:x.id,uid:x.uid,side:x.side,
    ...(x.r114FootContact?.inspect()||{enabled:false,frames:0})
   })),
   r113DanceStages:[...entries.values()].map(x=>({id:x.id,side:x.side,
    stage:x.r113DanceStage||null})),
   r112Victory:celebration&&{...celebration,frames:celebrationFrames,
    actorFrames:celebratingActors},
   hpDisplayMode,activeHpStyle:activeHpStyle(camera),
  visibleHpTags:[...entries.values()].filter(x=>x.status?.label.visible).length,
  total:list.length,models:list.length,
   pendingArt:0,prototypeArt:list.filter(x=>x.kind==='gltf-instance').length,
   loadedPrototypeIds:[...prototypes.keys()],cardIds:[...UNIT_IDS],entries:list};
 }
 return{sync,update,inspect,startSequence,sequenceStats,setHpDisplayMode,
  reactToSpell,spellWorldAnchors,reactToSummon,reactToCombo,clearComicCombo,
  celebrate,get celebration(){return celebration&&{...celebration,frames:celebrationFrames,actorFrames:celebratingActors}},
  get spellReactions(){return actualSpellReactions}};
}