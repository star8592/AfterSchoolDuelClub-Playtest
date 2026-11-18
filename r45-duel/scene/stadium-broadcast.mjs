/**
 * R164 experimental IN-WORLD school-gym arena television.
 * Actual 3D VRM closeup + genuine painted R109 card artwork,
 * not an HTML picture-in-picture obscuring the opponent.
 *
 * Fixed off-centre near far wall: NO overlap with central scoreboard
 * x[-2.6,+2.6], hanging sign x[-4.1,+4.1], or the central combat lane.
 * Only renders an off-screen camera on play/hit, never on idle.
 */
import {BY_ID} from '../engine.mjs';
import {cardArtURL} from '../card-art.mjs';

// Scene camera framing differs between landscape and portrait. The TV
// occupies an actual physical suspended location in BOTH views, off-centre
// and away from all HP/score UI and the fight lane.
const BROADCAST_MOUNTS=Object.freeze({
 desktop:Object.freeze({x:7.8,y:2.72,z:-6.35,width:4.10,height:2.306}),
 mobile:Object.freeze({x:4.65,y:4.96,z:-4.00,width:3.92,height:2.205})
});
export function createStadiumBroadcast(THREE,scene,{mobile=false}={}){
 const SCREEN=mobile?BROADCAST_MOUNTS.mobile:BROADCAST_MOUNTS.desktop;
 const group=new THREE.Group();
 group.name='R164_REAL_GYM_LIVE_BROADCAST';
 group.position.set(SCREEN.x,SCREEN.y,SCREEN.z);
 scene.add(group);
 const rect=(w,h,d,z,color,roughness=.49)=>{
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),
   new THREE.MeshStandardMaterial({color,metalness:.36,roughness}));
  mesh.position.z=z;mesh.castShadow=false;mesh.receiveShadow=false;
  group.add(mesh);return mesh;
 };
 rect(SCREEN.width+.26,SCREEN.height+.26,.20,-.11,'#17293b');
 rect(SCREEN.width+.08,SCREEN.height+.08,.10,.005,'#a38b69');
 rect(SCREEN.width+.01,SCREEN.height+.01,.07,.067,'#050f1d');
 // Suspension rods reach the true roof truss, instead of floating in space.
 const suspension=Math.max(.5,8.99-(SCREEN.y+SCREEN.height/2));
 for(const x of [-(SCREEN.width/2-.22),SCREEN.width/2-.22]){
  const support=rect(.075,suspension,.12,-.19,'#566e80');
  support.position.set(x,SCREEN.height/2+suspension/2,-.19);
 }
 const idleCanvas=document.createElement('canvas');idleCanvas.width=1024;idleCanvas.height=576;
 const idleCtx=idleCanvas.getContext('2d');
 const idleGrad=idleCtx.createLinearGradient(0,0,1024,576);
 idleGrad.addColorStop(0,'#16334b');idleGrad.addColorStop(.5,'#0e1f34');
 idleGrad.addColorStop(1,'#13283b');
 idleCtx.fillStyle=idleGrad;idleCtx.fillRect(0,0,1024,576);
 idleCtx.strokeStyle='#b5a079';idleCtx.lineWidth=12;idleCtx.strokeRect(18,18,988,540);
 idleCtx.textAlign='center';
 idleCtx.fillStyle='#efddae';idleCtx.font='bold 76px sans-serif';
 idleCtx.fillText('放学后决斗社',512,259);
 idleCtx.font='bold 31px sans-serif';idleCtx.fillStyle='#a8cedc';
 idleCtx.fillText('ARENA LIVE · 校园赛事直播',512,326);
 idleCtx.font='25px sans-serif';idleCtx.fillStyle='#d7dce6';
 idleCtx.fillText('出牌 · 魔法命中 · 对手反应',512,408);
 const idleTexture=new THREE.CanvasTexture(idleCanvas);idleTexture.colorSpace=THREE.SRGBColorSpace;
 const W=960,H=540;
 const target=new THREE.WebGLRenderTarget(W,H,{depthBuffer:true,stencilBuffer:false});
 target.texture.colorSpace=THREE.SRGBColorSpace;
 const display=new THREE.Mesh(new THREE.PlaneGeometry(SCREEN.width,SCREEN.height),
  new THREE.MeshBasicMaterial({map:idleTexture,toneMapped:false,side:THREE.DoubleSide}));
 display.name='R164_Broadcast_Actual_Camera_Feed';
 display.position.z=.117;display.frustumCulled=false;
 group.add(display);
 const overlayCanvas=document.createElement('canvas');
 overlayCanvas.width=1024;overlayCanvas.height=576;
 const ctx=overlayCanvas.getContext('2d');
 const overlayTexture=new THREE.CanvasTexture(overlayCanvas);
 overlayTexture.colorSpace=THREE.SRGBColorSpace;
 const overlay=new THREE.Mesh(new THREE.PlaneGeometry(SCREEN.width,SCREEN.height),
  new THREE.MeshBasicMaterial({map:overlayTexture,transparent:true,depthWrite:false,
    toneMapped:false,side:THREE.DoubleSide}));
 overlay.name='R164_Broadcast_Real_Card_HUD';overlay.position.z=.122;
 overlay.visible=false;group.add(overlay);
 const camera=new THREE.PerspectiveCamera(39,W/H,.08,70);
 camera.layers.set(1);
 const cards=new Map();
 const state={mode:'idle',side:null,card:null,serial:0,until:-1,changedAt:-1,
  time:0,frames:0,casts:0,hits:0,cardArtFrames:0,renderedFrames:0,
  frameThrottleMs:mobile?83:55,cameraCalls:0,lastCapture:-999,errors:0,
  captureMs:[],captureDraws:[],lastCaptureMs:0};
 let activeCard=null,dirty=true;
 function artFor(id){
  if(!id||!BY_ID[id])return;
  if(cards.has(id)){activeCard=cards.get(id);dirty=true;return}
  const path=cardArtURL(id,'../assets/cards/r109/');
  if(!path)return;
  const img=new Image();img.decoding='async';
  const source=new URL(path,import.meta.url).href;
  img.onload=()=>{cards.set(id,img);
   if(state.card===id){activeCard=img;dirty=true}
  };
  img.onerror=()=>{state.errors++};
  img.src=source;
 }
 function play(side,id,serial,seconds){
  if(!['player','ai'].includes(side)||!BY_ID[id]||
   !Number.isInteger(serial)||serial<=0)return false;
  state.mode='cast';state.side=side;state.card=id;state.serial=serial;
  state.until=seconds+1.85;state.changedAt=seconds;state.casts++;
  activeCard=cards.get(id)||null;
  artFor(id);dirty=true;return true;
 }
 function hit(victim,id,seconds){
  if(!['player','ai'].includes(victim))return false;
  state.mode='hit';state.side=victim;
  if(id&&BY_ID[id])state.card=id;
  state.until=seconds+1.7;state.changedAt=seconds;state.hits++;
  activeCard=cards.get(state.card)||null;
  if(state.card)artFor(state.card);
  dirty=true;return true;
 }
 function refreshOverlay(){
  if(!dirty)return;
  dirty=false;
  ctx.clearRect(0,0,1024,576);
  if(state.mode==='idle')return;
  ctx.fillStyle='#071527da';ctx.fillRect(0,0,1024,74);
  ctx.fillStyle=state.mode==='hit'?'#f9ad7c':'#a6e9e3';
  ctx.fillRect(22,19,14,36);
  ctx.fillStyle='#fff4d7';ctx.font='bold 35px sans-serif';
  ctx.fillText(state.mode==='hit'?'现场命中 · '+(state.side==='player'?'红方':'蓝方')+'受击':'现场转播 · 决斗者出牌',58,51);
  const label=state.side==='player'?'红方':'蓝方';
  ctx.fillStyle='#0b1f32d8';ctx.fillRect(0,502,1024,74);
  ctx.font='bold 28px sans-serif';ctx.fillStyle='#fff4d7';
  const card=BY_ID[state.card];
  ctx.fillText(label+' · '+(card?.name||'现场'),30,548);
  if(activeCard&&activeCard.complete&&activeCard.naturalWidth){
   // The actual painted card appears inside the stadium TV, never over the
   // main 3D arena. Draw only when its image is already decoded.
   const x=790,y=125,w=192,h=307;
   ctx.fillStyle='#eed5aa';ctx.fillRect(x-8,y-8,w+16,h+16);
   const aspect=activeCard.naturalWidth/activeCard.naturalHeight;
   const cell=w/h;
   let sx=0,sy=0,sw=activeCard.naturalWidth,sh=activeCard.naturalHeight;
   if(aspect>cell){sw=sh*cell;sx=(activeCard.naturalWidth-sw)/2}
   else{sh=sw/cell;sy=(activeCard.naturalHeight-sh)/2}
   ctx.drawImage(activeCard,sx,sy,sw,sh,x,y,w,h);
   state.cardArtFrames++;
  }
  overlayTexture.needsUpdate=true;
 }
 function update(seconds){
  state.time=seconds;
  if(state.mode!=='idle'&&seconds>state.until){
   state.mode='idle';state.side=null;state.card=null;
   display.material.map=idleTexture;display.material.needsUpdate=true;
   overlay.visible=false;dirty=true;
   return;
  }
  if(state.mode!=='idle'){
   overlay.visible=true;
   if(display.material.map!==target.texture){
    display.material.map=target.texture;
    display.material.needsUpdate=true;
   }
   refreshOverlay();
  }
 }
 function cameraFor(host){
  if(!host?.pivot)return false;
  const side=host.side,sign=side==='player'?1:-1;
  host.pivot.updateWorldMatrix(true,true);
  const head=host.pivot.getObjectByName('J_Bip_C_Head');
  const point=head?.getWorldPosition(new THREE.Vector3())||
   host.pivot.position.clone().add(new THREE.Vector3(0,1.66,0));
  camera.position.set(point.x+sign*1.97,point.y+.36,point.z+1.02);
  camera.fov=state.mode==='hit'?39:43;
  camera.updateProjectionMatrix();
  // Keep shoulders, face and (when casting) the real physical card visible.
  camera.lookAt(point.x-sign*.02,point.y-.10,point.z);
  return true;
 }
 function shouldCapture(seconds){
  return state.mode!=='idle'&&seconds<=state.until&&
   (state.frames===0||(seconds-state.lastCapture)*1000>=state.frameThrottleMs);
 }
 function capture(renderer,world,hosts,seconds){
  if(!shouldCapture(seconds))return false;
  const host=hosts.find(h=>h.side===state.side);
  if(!cameraFor(host))return false;
  const captureStart=performance.now();
  const oldTarget=renderer.getRenderTarget();
  const view=renderer.getViewport(new THREE.Vector4());
  const scissor=renderer.getScissor(new THREE.Vector4());
  const scissorTest=renderer.getScissorTest();
  const autoClear=renderer.autoClear,shadowAuto=renderer.shadowMap.autoUpdate;
  const previousExposure=renderer.toneMappingExposure;
  const shadowNeed=renderer.shadowMap.needsUpdate;
  try{
   // TV camera exposure only, restored immediately after the offscreen pass.
   // Uses the same ACES shader programs and does not affect arena materials.
   renderer.toneMappingExposure=1.48;
   renderer.shadowMap.autoUpdate=false;
   renderer.shadowMap.needsUpdate=false;
   renderer.setRenderTarget(target);
   renderer.setViewport(0,0,W,H);
   renderer.setScissor(0,0,W,H);
   renderer.setScissorTest(false);
   renderer.autoClear=true;
   renderer.clear(true,true,true);
   renderer.render(world,camera);
   const calls=renderer.info.render.calls;
   state.cameraCalls+=calls;
   state.captureDraws.push(calls);
   if(state.captureDraws.length>80)state.captureDraws.shift();
   state.renderedFrames++;state.frames++;
   state.lastCapture=seconds;
   return true;
  }finally{
   renderer.setRenderTarget(oldTarget);
   renderer.setViewport(view);renderer.setScissor(scissor);
   renderer.setScissorTest(scissorTest);
   renderer.autoClear=autoClear;
   renderer.toneMappingExposure=previousExposure;
   renderer.shadowMap.autoUpdate=shadowAuto;
   renderer.shadowMap.needsUpdate=shadowNeed;
   const ms=performance.now()-captureStart;
   state.lastCaptureMs=ms;
   state.captureMs.push(ms);
   if(state.captureMs.length>80)state.captureMs.shift();
  }
 }
 function destroy(){
  target.dispose();idleTexture.dispose();overlayTexture.dispose();
  group.traverse(o=>{o.geometry?.dispose?.();o.material?.dispose?.()});
  group.removeFromParent();
 }
 return {group,play,hit,update,capture,destroy,
  get focusSide(){return state.mode==='idle'?null:state.side},
  get stats(){const percentile=(vals,p)=>{
   if(!vals.length)return null;
   const sorted=[...vals].sort((a,b)=>a-b);
   return +sorted[Math.min(sorted.length-1,Math.floor(sorted.length*p))].toFixed(3)
  };
   return {...state,captureCpuP50Ms:percentile(state.captureMs,.5),
    captureCpuP95Ms:percentile(state.captureMs,.95),
    captureDrawsP50:percentile(state.captureDraws,.5),
    screen:{...SCREEN},
    cameraViewLayers:camera.layers.mask,overlayVisible:overlay.visible,
    screenVisible:display.visible,cardImageLoaded:!!activeCard,
    targetSize:[W,H],idle:state.mode==='idle',
    footprintOverlapsScoreboard:SCREEN.x-SCREEN.width/2<2.6}}
 };
}
