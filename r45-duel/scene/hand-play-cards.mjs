/**
 * R117 — actual painted card follows each duelist's REAL VRM right wrist.
 * Complementary to the existing large podium hologram; not a floating actor,
 * placeholder card image or alteration of authoritative card rules.
 */
import {BY_ID,DECK_PRESETS} from '../engine.mjs';
import {cardArtURL} from '../card-art.mjs';
const sides=['player','ai'];
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export function createHandPlayCards(THREE,scene){
 const instances=new Map(),cache=new Map();
 const offset=new THREE.Vector3(0,.070,.067),wristPos=new THREE.Vector3();
 const fingerDefinitions=Object.freeze({
  Thumb:[.33,.48,.31],Index:[.33,.68,.47],Middle:[.48,.74,.50],
  Ring:[.49,.76,.52],Little:[.52,.68,.46]
 });
 const fingerAxes={Thumb:'y',Index:'x',Middle:'x',Ring:'x',Little:'x'};
 const fingerSign={Thumb:-1,Index:1,Middle:1,Ring:1,Little:1};
 const digitName=['Thumb','Index','Middle','Ring','Little'];
 const fingerRotation=new THREE.Quaternion(),axis=new THREE.Vector3();
 const tipWorld=new THREE.Vector3(),tipNeutral=new THREE.Vector3();

 const cvsWidth=256,cvsHeight=360;let painted=0,frames=0;
 function compose(id,image){
  const canvas=document.createElement('canvas');canvas.width=cvsWidth;canvas.height=cvsHeight;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#182e41';ctx.fillRect(0,0,cvsWidth,cvsHeight);
  if(image){
   const ratio=image.naturalWidth/image.naturalHeight;
   const space=cvsWidth/cvsHeight;
   let sx=0,sy=0,sw=image.naturalWidth,sh=image.naturalHeight;
   if(ratio>space){sw=sh*space;sx=(image.naturalWidth-sw)/2;}
   else{sh=sw/space;sy=(image.naturalHeight-sh)/2;}
   ctx.drawImage(image,sx,sy,sw,sh,0,0,cvsWidth,cvsHeight);
  }else{
   const gradient=ctx.createLinearGradient(0,0,cvsWidth,cvsHeight);
   gradient.addColorStop(0,'#335978');gradient.addColorStop(1,'#111d32');
   ctx.fillStyle=gradient;ctx.fillRect(8,8,240,344);
   ctx.fillStyle='#f3d99c';ctx.font='800 28px sans-serif';
   ctx.textAlign='center';ctx.fillText('放学后决斗社',128,178);
  }
  ctx.strokeStyle='#f5dbac';ctx.lineWidth=10;ctx.strokeRect(7,7,242,346);
  ctx.strokeStyle='#344d69';ctx.lineWidth=3;ctx.strokeRect(17,17,222,326);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  texture.anisotropy=4;return texture;
 }
 function artFor(id){
  if(cache.has(id))return cache.get(id);
  const rel=cardArtURL(id,'../assets/cards/r109/');
  const task=new Promise(resolve=>{
   if(!rel){resolve(null);return}
   const img=new Image();img.decoding='async';
   img.onload=()=>resolve(img.naturalWidth&&img.naturalHeight?img:null);
   img.onerror=()=>resolve(null);
   img.src=new URL(rel,import.meta.url).href;
  });
  cache.set(id,task);if(cache.size>28)cache.delete(cache.keys().next().value);
  return task;
 }
 // R121-Pages: artwork must be available when the real VRM first presents
 // the physical card. Lazy-fetching *at show()* works on loopback but is
 // visibly blank during GitHub Pages cold-cache rendering. Prewarm only
 // this battle's 20 unique card faces while 14 authentic models load.
 // Never pull 60 illustrations or add a second character stand-in.
 const chosenDeck=(()=>{
  try{
   const q=new URLSearchParams(window.parent.location.search);
   return Object.hasOwn(DECK_PRESETS,q.get('deck'))?q.get('deck'):'classic';
  }catch{return 'classic'}
 })();
 const prewarmIds=[...new Set(DECK_PRESETS[chosenDeck].cards)].filter(id=>BY_ID[id]);
 for(const id of prewarmIds)void artFor(id);

 function attach(hosts){
  for(const host of hosts){
   if(!sides.includes(host.side)||instances.has(host.side))continue;
   const wrist=host.pivot.getObjectByName('J_Bip_R_Hand');
   if(!wrist?.isBone)throw Error('R117 cannot anchor verified VRM card hand');
   const group=new THREE.Group();
   group.name='R117_LiveCard_Held_By_'+host.side;
   const backing=new THREE.Mesh(new THREE.BoxGeometry(.34,.478,.012),
    new THREE.MeshStandardMaterial({color:host.side==='player'?'#f4d397':'#9bd5ee',
      metalness:.26,roughness:.43,emissive:host.side==='player'?'#75452b':'#2c5374',emissiveIntensity:.23}));
   group.add(backing);
   const image=new THREE.Mesh(new THREE.PlaneGeometry(.33,.464),
    new THREE.MeshBasicMaterial({map:compose('back',null),side:THREE.DoubleSide,transparent:false}));
   image.position.z=.011;group.add(image);
   // R121 uses the ORIGINAL complete five-finger VRM source skeleton.
   // Every joint belongs to this exact cloned host, not a phantom proxy
   // hand. Per-joint source rest quaternions are kept for exact restoration.
   const fingers=[];
   for(const digit of digitName){
    for(let segment=1;segment<=3;segment++){
     const bone=host.pivot.getObjectByName('J_Bip_R_'+digit+segment);
     if(!bone?.isBone)throw Error('R121 real hand grip missing '+digit+segment+' '+host.side);
     fingers.push({digit,segment,bone,rest:bone.quaternion.clone()});
    }
   }
   const tip=fingers.find(x=>x.digit==='Index'&&x.segment===3).bone;
   scene.add(group);group.visible=false;
   instances.set(host.side,{host,wrist,group,image,start:-100,id:null,serial:-1,
    wristGap:0,events:0,painted:false,lastPainted:null,
    fingers,tip,grip:.0,gripFrames:0,gripMode:'open',maxTipTravel:0,
    gripEntries:fingers.length,previewTip:null});
  }
 }
 function show(side,id,serial,seconds){
  const state=instances.get(side);if(!state||!BY_ID[id]||!Number.isInteger(serial)||serial<=0||
    !Number.isFinite(seconds)||state.serial===serial)return false;
  state.serial=serial;state.id=id;state.start=seconds;state.events++;state.painted=false;
  state.maxTipTravel=0;state.previewTip=null;
  const version=serial;
  void artFor(id).then(img=>{
   if(state.serial!==version)return;
   const previous=state.image.material.map;
   state.image.material.map=compose(id,img);
   state.image.material.needsUpdate=true;previous?.dispose();
   if(img){state.painted=true;state.lastPainted=id;painted++;}
  });
  return true;
 }
 function update(seconds,camera){
  for(const state of instances.values()){
   const age=seconds-state.start,visible=age>=0&&age<2.63;
   state.group.visible=visible;
   if(!visible){
    if(state.gripMode!=='open'){
     for(const f of state.fingers)f.bone.quaternion.copy(f.rest);
     state.grip=0;state.gripMode='open';
    }
    continue;
   }
   // Fingers close on the real painted card during its reveal; a right
   // thumb opposes the index and middle fingers. At the instant of release
   // they OPEN instead of forming a permanent clenched fist.
   const catchGrip=clamp(age/.17),throwRelease=clamp((age-1.84)/.24);
   const grip=catchGrip*(1-throwRelease);
   const poseStrength=state.host.side==='player'?1:.92;
   state.grip=grip;state.gripMode=grip>.2?(throwRelease>.3?'release':'grasp'):'open';
   for(const f of state.fingers){
    const angles=fingerDefinitions[f.digit],amount=
     angles[f.segment-1]*fingerSign[f.digit]*grip*poseStrength;
    axis.set(fingerAxes[f.digit]==='x'?1:0,
     fingerAxes[f.digit]==='y'?1:0,0);
    fingerRotation.setFromAxisAngle(axis,amount);
    f.bone.quaternion.copy(f.rest).multiply(fingerRotation);
   }
   if(grip>.05){
    state.tip.updateWorldMatrix(true,false);
    state.tip.getWorldPosition(tipWorld);
    if(!state.previewTip)state.previewTip=tipWorld.clone();
    state.maxTipTravel=Math.max(state.maxTipTravel,
     tipWorld.distanceTo(state.previewTip));
    state.gripFrames++;
   }
   // RIGHT HAND IS PHYSICAL AUTHORITY: sample the post-IK wrist every frame.
   state.wrist.updateWorldMatrix(true,false);
   state.wrist.getWorldPosition(wristPos);
   // R120: read as a physical, illustrated card: snap up, proudly reveal
   // the artwork to the opponent and the viewer, then whip the *wrist-bound*
   // card into the arena. The hand never lets go early or creates a clone.
   const rise=clamp((age-.22)/.35)*(1-clamp((age-1.35)/.35));
   const throwPulse=clamp((age-1.28)/.18)*(1-clamp((age-1.9)/.24));
   const arrival=clamp(age/.18),depart=1-clamp((age-2.24)/.36);
   state.group.position.copy(wristPos).add(offset);
   state.group.quaternion.copy(camera.quaternion);
   state.group.rotateZ((state.host.side==='player'?-1:1)*
     (.20*(1-arrival)-.25*throwPulse+.045));
   state.group.rotateY((state.host.side==='player'?-1:1)*.20*throwPulse);
   state.group.scale.setScalar(.86+.16*arrival+.22*rise+.09*throwPulse);
   state.group.children[0].material.emissiveIntensity=.23+.65*rise+.8*throwPulse;
   state.phase=rise>.55?'high_reveal':throwPulse>.32?'throw':age<.35?'draw':'recover';
   state.group.children[0].material.opacity=arrival*depart;
   state.group.children[0].material.transparent=true;
   state.image.material.opacity=arrival*depart;
   state.image.material.transparent=true;
   state.wristGap=state.group.position.distanceTo(wristPos);
   frames++;
  }
 }
 return {attach,show,update,get stats(){
  return {actors:[...instances.values()].map(x=>({side:x.host.side,id:x.id,
   shown:x.events,visible:x.group.visible,wristTracked:!!x.wrist,
   wristGap:+x.wristGap.toFixed(4),phase:x.phase||'idle',
   size:+x.group.scale.x.toFixed(3),grip:+x.grip.toFixed(4),
   gripMode:x.gripMode,gripFrames:x.gripFrames,realFingerBones:x.gripEntries,
   thumbOpposition:+(fingerDefinitions.Thumb[1]*x.grip).toFixed(4),
   realBend:+(x.fingers.find(f=>f.digit==='Index'&&f.segment===2)
     .bone.quaternion.angleTo(x.fingers.find(f=>f.digit==='Index'&&f.segment===2).rest)).toFixed(4),
   restError:+Math.max(...x.fingers.map(f=>f.bone.quaternion.angleTo(f.rest))).toFixed(4),
   maxTipTravel:+x.maxTipTravel.toFixed(5),
   actualFingerJointNames:x.fingers.map(f=>f.bone.name),
   painted:x.painted,lastPainted:x.lastPainted})),
   painted,frames};
 }};
}
