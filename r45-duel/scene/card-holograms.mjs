/**
 * R110: the actual 60 collectible-card illustrations become physical 3D
 * projections on both duelists' lecterns.
 *
 * The ONLY trigger is an authenticated ASDC_R46_CARD_PLAY event produced by
 * engine.mjs. This module neither mutates the rules nor invents played cards.
 * Art loads lazily for actually played cards and cannot delay gameplay.
 */
import {BY_ID} from '../engine.mjs';
import {cardArtURL} from '../card-art.mjs';

const SIDES=['player','ai'];
const W=384,H=520;
const MAX_CACHE=18;

export function createCardHolograms(THREE,scene){
 const root=new THREE.Group();
 root.name='R110_Illustrated_Podium_Card_Projection';
 scene.add(root);
 const groups={player:new THREE.Group(),ai:new THREE.Group()};
 const states={
  player:{started:-100,queue:[],current:null,last:null,shown:0,painted:0},
  ai:{started:-100,queue:[],current:null,last:null,shown:0,painted:0}
 };
 const palettes={player:['#ffdfa2','#d99452'],ai:['#b3e7ff','#62a9ed']};
 const images=new Map();
 const failed=new Set();
 let drawnFrames=0;

 for(const side of SIDES){
  const grp=groups[side],sgn=side==='player'?-1:1;
  grp.position.set(sgn*4.45,1.53,1.55);
  grp.rotation.y=sgn<0?-.17:.17;
  root.add(grp);
  const backing=new THREE.Mesh(new THREE.BoxGeometry(.98,1.35,.04),
   new THREE.MeshPhysicalMaterial({
    color:side==='player'?'#956444':'#387197',
    metalness:.40,roughness:.30,transparent:true,opacity:.74,
    emissive:side==='player'?'#ab7141':'#3974a1',emissiveIntensity:.32
   }));
  backing.name='3D_Illustrated_Card_Slab_'+side;grp.add(backing);
  const plane=new THREE.Mesh(new THREE.PlaneGeometry(.93,1.3),
   new THREE.MeshBasicMaterial({
    color:'#ffffff',transparent:true,opacity:0.97,depthWrite:false,
    side:THREE.DoubleSide
   }));
  plane.name='3D_Real_Artwork_Plane_'+side;
  plane.position.z=.025;grp.add(plane);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.55,.009,6,64),
   new THREE.MeshBasicMaterial({
    color:side==='player'?'#ffe0a1':'#98d4fd',
    transparent:true,opacity:.54,depthWrite:false,
    blending:THREE.AdditiveBlending
   }));
  rim.name='3D_Lectern_Illustration_Energy_Ring_'+side;
  rim.scale.y=1.23;rim.position.z=-.1;grp.add(rim);
  grp.userData={plane,rim};grp.visible=false;
 }

 // No art downloads until a REAL card has been played. A small cache avoids
 // repeated fetches for duplicate cards without creating sixty GPU textures.
 function loadArt(id){
  if(images.has(id))return images.get(id);
  const relative=cardArtURL(id,'../assets/cards/r109/');
  if(!relative)return Promise.resolve(null);
  const src=new URL(relative,import.meta.url).href;
  const task=new Promise(resolve=>{
   const img=new Image();
   img.decoding='async';
   img.onload=()=>resolve(img.naturalWidth>0&&img.naturalHeight>0?img:null);
   img.onerror=()=>{failed.add(id);resolve(null)};
   img.src=src;
  });
  images.set(id,task);
  if(images.size>MAX_CACHE)images.delete(images.keys().next().value);
  return task;
 }

 function makePaintedTexture(item,side,photo){
  const canvas=document.createElement('canvas');
  canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext('2d',{alpha:false});
  const [accent,dim]=palettes[side];
  ctx.fillStyle=side==='player'?'#332b36':'#1b3552';
  ctx.fillRect(0,0,W,H);

  const px=20,py=21,pw=W-40,ph=H-42;
  if(photo){
   // Center-crop by aspect ratio, preserving original full-resolution detail.
   const srcRatio=photo.naturalWidth/photo.naturalHeight;
   const dstRatio=pw/ph;
   let sx=0,sy=0,sw=photo.naturalWidth,sh=photo.naturalHeight;
   if(srcRatio>dstRatio){sw=sh*dstRatio;sx=(photo.naturalWidth-sw)/2}
   else{sh=sw/dstRatio;sy=(photo.naturalHeight-sh)/2}
   ctx.drawImage(photo,sx,sy,sw,sh,px,py,pw,ph);
  }else{
   const g=ctx.createLinearGradient(0,0,W,H);
   g.addColorStop(0,'#71513a');g.addColorStop(.55,'#25445c');g.addColorStop(1,'#102131');
   ctx.fillStyle=g;ctx.fillRect(px,py,pw,ph);
  }

  // The artwork occupies the entire surface; only type-safe bands obscure it.
  const shade=ctx.createLinearGradient(0,0,0,H);
  shade.addColorStop(0,'#08101fea');
  shade.addColorStop(.20,'#0d1c32a8');
  shade.addColorStop(.36,'#0d1b2814');
  shade.addColorStop(.70,'#0d1b2814');
  shade.addColorStop(.84,'#07101d91');
  shade.addColorStop(1,'#07101df2');
  ctx.fillStyle=shade;ctx.fillRect(px,py,pw,ph);
  ctx.strokeStyle='#f8d594';ctx.lineWidth=12;
  ctx.strokeRect(14,15,W-28,H-30);
  ctx.strokeStyle=accent;ctx.lineWidth=2.5;
  ctx.strokeRect(29,30,W-58,H-60);
  ctx.textAlign='center';
  ctx.shadowColor='#02060b';ctx.shadowBlur=6;ctx.shadowOffsetY=2;

  ctx.font='800 21px system-ui,"Noto Sans CJK SC"';
  ctx.fillStyle=accent;
  ctx.fillText(side==='player'?'我方出牌':'对手出牌',W/2,69);
  ctx.font=(item.name.length>8?'900 27px':'900 32px')+
    ' system-ui,"Noto Sans CJK SC"';
  ctx.fillStyle='#fff5d8';
  ctx.fillText(item.name.slice(0,13),W/2,119,W-56);
  ctx.shadowBlur=0;ctx.shadowOffsetY=0;

  ctx.fillStyle='#08182ade';
  ctx.fillRect(42,H-121,W-84,84);
  ctx.fillStyle=accent;ctx.font='800 19px system-ui';
  ctx.fillText(item.kind==='unit'?'人物召唤 · SUMMON':'荒诞事件 · EVENT',W/2,H-87);
  ctx.fillStyle='#fff5df';ctx.font='800 23px system-ui';
  ctx.fillText('能量 '+item.cost+'  ·  '+item.id,W/2,H-52);
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.anisotropy=4;
  return texture;
 }

 function applyCard(side,item,image){
  const s=states[side];
  // A slow image decode must NEVER repaint a subsequent card.
  if(s.current!==item)return;
  const plane=groups[side].userData.plane;
  const material=plane.material;
  const tex=makePaintedTexture(item,side,image);
  const previous=material.map;
  material.map=tex;material.needsUpdate=true;
  previous?.dispose();
  if(image){s.painted++;s.lastPainted=item.id}
 }

 function show(message,now){
  if(!message||!SIDES.includes(message.side))return false;
  const canonical=BY_ID[message.id];
  if(!canonical||message.kind!==canonical.kind||
     message.name!==canonical.name||message.cost!==canonical.cost||
     !Number.isInteger(message.serial)||message.serial<=0)return false;
  const item={
   side:message.side,id:canonical.id,name:canonical.name,
   kind:canonical.kind,cost:canonical.cost,serial:message.serial,
   queuedAt:now
  };
  const s=states[item.side];
  s.queue.push(item);
  if(s.queue.length>3)s.queue.splice(0,s.queue.length-3);
  // The actual card art is fetched lazily and only when a confirmed card event arrives.
  void loadArt(item.id);
  return true;
 }

 function update(now,playing,portrait){
  for(const side of SIDES){
   const grp=groups[side],state=states[side];
   if(playing){grp.visible=false;continue}
   if(!state.current&&state.queue.length){
    const current=state.queue.shift();
    state.current=current;state.started=now;
    applyCard(side,current,null);
    loadArt(current.id).then(img=>{if(img)applyCard(side,current,img)});
    state.shown++;state.last=current;
   }
   if(!state.current){grp.visible=false;continue}
   const age=Math.max(0,now-state.started);
   if(age>2.7){state.current=null;grp.visible=false;continue}
   const up=Math.min(1,age/.38);
   const down=Math.max(0,Math.min(1,(2.7-age)/.54));
   const opacity=up*down;
   grp.visible=true;
   const sign=side==='player'?-1:1;
   grp.position.x=sign*(portrait?2.5:4.45);
   grp.position.y=(portrait?1.23:1.52)+.54*(1-Math.pow(1-up,3))-.15*(1-down);
   grp.position.z=portrait?.46:1.55;
   const sc=(portrait?.77:1)*(0.75+.25*up);
   grp.scale.setScalar(sc);
   grp.rotation.z=sign*.16*(1-up);
   grp.userData.plane.material.opacity=opacity*.99;
   grp.children[0].material.opacity=opacity*.74;
   grp.userData.rim.material.opacity=opacity*.52;
   grp.userData.rim.rotation.z=now*.34*sign;
   drawnFrames++;
  }
 }
 return {root,show,update,get stats(){return {
  name:'R110_ILLUSTRATED_REAL_CARD_PROJECTION',
  projectionMeshes:groups.player.children.length+groups.ai.children.length,
  shown:{player:states.player.shown,ai:states.ai.shown},
  painted:{player:states.player.painted,ai:states.ai.painted},
  last:{player:states.player.last?.id||null,ai:states.ai.last?.id||null},
  lastPainted:{player:states.player.lastPainted||null,ai:states.ai.lastPainted||null},
  active:{player:groups.player.visible,ai:groups.ai.visible},
  artRequestsCached:images.size,
  failedImages:[...failed],
  drawnFrames
 }}};
}
