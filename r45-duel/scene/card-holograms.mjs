/**
 * Card-confirmation projection from the 3D side lecterns.
 * Uses real card-play events; no fake summons, rules, health or combat logic.
 * All text is a new CanvasTexture attached to a genuinely 3D physical plane.
 */
export function createCardHolograms(THREE,scene){
 const root=new THREE.Group();
 root.name='R46_Podium_Playcard_Projection';
 scene.add(root);
 const groups={player:new THREE.Group(),ai:new THREE.Group()};
 const states={player:{started:-100,queue:[],last:null,shown:0},
   ai:{started:-100,queue:[],last:null,shown:0}};
 const palettes={player:['#ffe1ab','#ba8759'],ai:['#a5e0ff','#4b91be']};
 const canvas=document.createElement('canvas');
 canvas.width=384;canvas.height=520;
 for(const side of ['player','ai']){
  const grp=groups[side],sgn=side==='player'?-1:1;
  grp.position.set(sgn*4.45,1.53,1.55);
  grp.rotation.y=sgn<0?-.17:.17;
  root.add(grp);
  const backing=new THREE.Mesh(new THREE.BoxGeometry(.94,1.3,.038),
   new THREE.MeshPhysicalMaterial({color:side==='player'?'#9d654a':'#3d7693',
    metalness:.33,roughness:.32,transparent:true,opacity:.73,
    emissive:side==='player'?'#b47a45':'#376f91',emissiveIntensity:.34}));
  backing.name='Real_3D_Card_Slab_'+side;grp.add(backing);
  const plane=new THREE.Mesh(new THREE.PlaneGeometry(.91,1.28),new THREE.MeshBasicMaterial({
   color:'#ffffff',transparent:true,opacity:.96,depthWrite:false,side:THREE.DoubleSide
  }));
  plane.name='Real_3D_Playcard_Texture_'+side;
  plane.position.z=.023;grp.add(plane);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.55,.009,6,64),
   new THREE.MeshBasicMaterial({color:side==='player'?'#ffe5aa':'#87cbf1',
    transparent:true,opacity:.58,depthWrite:false,blending:THREE.AdditiveBlending}));
  rim.name='3D_Lectern_Card_Energy_Ring_'+side;
  rim.scale.y=1.23;rim.position.z=-.1;grp.add(rim);
  grp.userData={plane,rim};grp.visible=false;
 }
 const drawCard=(item,side)=>{
  const ctx=canvas.getContext('2d');
  const [accent,dim]=palettes[side];
  const grad=ctx.createLinearGradient(0,0,0,520);
  grad.addColorStop(0,side==='player'?'#6b3c34':'#304c70');
  grad.addColorStop(.42,'#1d2f43');grad.addColorStop(1,'#0c1e30');
  ctx.fillStyle=grad;ctx.fillRect(0,0,384,520);
  ctx.lineWidth=13;ctx.strokeStyle='#d3b17d';ctx.strokeRect(17,18,350,484);
  ctx.lineWidth=3;ctx.strokeStyle=accent;ctx.strokeRect(37,38,310,443);
  ctx.fillStyle=accent;ctx.font='700 24px system-ui,"Noto Sans CJK SC"';
  ctx.textAlign='center';ctx.fillText(side==='player'?'决斗者 · 我方':'决斗者 · 对手',192,83);
  ctx.fillStyle='#fff7e8';ctx.font='900 38px system-ui,"Noto Sans CJK SC"';
  const name=(item.name||'未知卡牌').slice(0,10);
  if(name.length>6){
   ctx.font='900 29px system-ui,"Noto Sans CJK SC"';
  }
  ctx.fillText(name,192,161);
  ctx.fillStyle=accent;ctx.font='800 21px system-ui';
  ctx.fillText(item.kind==='unit'?'人物召唤 · SUMMON':'事件发动 · ACTION',192,202);
  ctx.strokeStyle=dim;ctx.beginPath();ctx.moveTo(72,222);ctx.lineTo(312,222);ctx.stroke();
  const symbol=item.kind==='unit'?'✦':'◆';
  ctx.font='180px Georgia,serif';ctx.fillStyle=accent;
  ctx.shadowColor=accent;ctx.shadowBlur=26;
  ctx.fillText(symbol,192,389);ctx.shadowBlur=0;
  ctx.fillStyle='#ffe8bf';ctx.font='700 21px system-ui';
  ctx.fillText('能量 '+item.cost+'   ·   '+item.id,192,454);
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.anisotropy=4;
  return texture;
 };
 const show=(item,now)=>{
  if(!item||!['player','ai'].includes(item.side)||!/^([EGT])\d{2}$/.test(item.id)||
    !Number.isInteger(item.cost)||item.cost<0||item.cost>9||
    !['unit','event'].includes(item.kind)||typeof item.name!=='string')return false;
  const state=states[item.side];
  state.queue.push({...item,queuedAt:now});
  // Avoid huge AI-card bursts if it plays many cards in a single turn.
  if(state.queue.length>3)state.queue.splice(0,state.queue.length-3);
  return true;
 };
 let drawCount=0;
 const update=(now,playing,portrait)=>{
  for(const side of ['player','ai']){
   const grp=groups[side],state=states[side];
   if(playing){grp.visible=false;continue}
   if(!state.current&&state.queue.length){
    state.current=state.queue.shift();
    state.started=now;
    const t=drawCard(state.current,side);
    const material=grp.userData.plane.material;
    material.map?.dispose();material.map=t;material.needsUpdate=true;
    state.shown++;state.last=state.current;
   }
   if(!state.current){grp.visible=false;continue}
   const age=Math.max(0,now-state.started);
   if(age>2.18){state.current=null;grp.visible=false;continue}
   const up=Math.min(1,age/.42);
   const down=Math.max(0,Math.min(1,(2.18-age)/.5));
   const opacity=up*down;
   grp.visible=true;
   const sign=side==='player'?-1:1;
   grp.position.x=sign*(portrait?2.55:4.45);
   grp.position.y=(portrait?1.25:1.53)+(.45*(1-Math.pow(1-up,3)))-.17*(1-down);
   grp.position.z=portrait?0.45:1.55;
   const sc=(portrait?.75:1)*(0.75+.25*up);
   grp.scale.setScalar(sc);
   grp.rotation.z=sign*.14*(1-up);
   grp.userData.plane.material.opacity=opacity*.98;
   grp.children[0].material.opacity=opacity*.70;
   grp.userData.rim.material.opacity=opacity*.44;
   grp.userData.rim.rotation.z=now*.32*(sign);
   drawCount++;
  }
 };
 return {root,show,update,get stats(){return{
  name:'R46_REAL_PODIUM_CARD_PROJECTION',
  projectionMeshes:groups.player.children.length+groups.ai.children.length,
  shown:{player:states.player.shown,ai:states.ai.shown},
  last:{player:states.player.last?.id||null,ai:states.ai.last?.id||null},
  active:{player:groups.player.visible,ai:groups.ai.visible},
  drawCount
 }}};
}
