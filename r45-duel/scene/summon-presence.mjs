/**
 * R50 · Exact board-unit presence. This is a VISUAL projection of the real
 * single-arena board: it never creates units, applies damage, or changes turns.
 *
 * R61 gameplay gate: all 12 unit IDs now render actual 3D mesh assets.
 * E01/G01 use established VRMs, other 10 load independently verified GLBs.
 * These temporary 3D meshes are NOT approved final character art.
 */
import {BY_ID} from '../engine.mjs';
import {clone as cloneSkeleton} from 'three/addons/utils/SkeletonUtils.js';
import {instantiateSummon,UNIT_MODEL_IDS} from './summon-models.mjs';
import {faceOpponentYaw,faceOpponentDot} from './summon-orientation.mjs';

const UNIT_IDS=Object.freeze(Object.keys(BY_ID).filter(id=>BY_ID[id].kind==='unit'));
const VRM_IDS=new Set(['E01','G01']);
export function createSummonPresence(THREE,scene,{actors,prototypes}){
 if(!(prototypes instanceof Map)||prototypes.size!==10||
   UNIT_MODEL_IDS.some(id=>!prototypes.has(id))){
   throw Error('R61 fail-closed: all ten summoned GLB prototypes must load');
 }
 const root=new THREE.Group();
 root.name='R50_Board_Units_Only';
 scene.add(root);
 const entries=new Map(),pool=new Map();
 let current={player:[],ai:[]},revision=0,lastUpdateSeconds=null;
 let sequence=null,playedEvents=0,finishedSequences=0;
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
     state={key,id,uid,side,index,kind,object,created:performance.now(),status:makeStatusTag(side,id)};
     entries.set(key,state);
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
  sequence={events:ordered,started:now,final:post,index:-1};
  impact.visible=true;
  return true;
 }
 function sequenceStats(){
  return{active:!!sequence,queued:sequence?.events.length||0,
   index:sequence?.index??-1,playedEvents,finishedSequences};
 }
 function update(seconds,camera,{cinematic=false}={}){
  const dt=lastUpdateSeconds===null?0:Math.min(.07,Math.max(0,seconds-lastUpdateSeconds));
  lastUpdateSeconds=seconds;
  const labelStyle=activeHpStyle(camera);
  for(const state of entries.values()){
   state.object.userData.r61?.mixer?.update(dt);
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
  hitRing.visible=ribbon.visible=hitLabel.visible=false;
  if(sequence){
   const elapsed=Math.max(0,seconds-sequence.started);
   const index=Math.floor(elapsed/secondsPerHit);
   if(index>=sequence.events.length){
    const final=sequence.final;
    sequence=null;impact.visible=false;
    finishedSequences++;
    sync(final,{force:true});
    for(const e of entries.values())e.object.userData.r61?.play('idle');
   }else{
    if(index!==sequence.index){
     sequence.index=index;playedEvents++;
     const newly=sequence.events[index];
     anchor(newly.side,newly.attacker_uid,newly.from)?.object.userData.r61?.play('attack');
     if(newly.type==='exchange')
      anchor(newly.side==='player'?'ai':'player',newly.target_uid,newly.to)?.object.userData.r61?.play('hit');
    }
    const event=sequence.events[index];
    const phase=(elapsed-index*secondsPerHit)/secondsPerHit;
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
    for(const state of [attacker,target]){
     if(state?.status?.label)state.status.label.position.x=state.object.position.x;
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
   metrics.frontDot=Number(faceOpponentDot(THREE,s.object,s.side).toFixed(4));
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
   return{side:s.side,uid:s.uid,id:s.id,kind:s.kind,visible:s.object.visible,metrics,wingMorph,
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
    artApproved:false};
  });
  return{revision,hpDisplayMode,activeHpStyle:activeHpStyle(camera),
  visibleHpTags:[...entries.values()].filter(x=>x.status?.label.visible).length,
  total:list.length,models:list.length,
   pendingArt:0,prototypeArt:list.filter(x=>x.kind==='gltf-instance').length,
   loadedPrototypeIds:[...prototypes.keys()],cardIds:[...UNIT_IDS],entries:list};
 }
 return{sync,update,inspect,startSequence,sequenceStats,setHpDisplayMode};
}
