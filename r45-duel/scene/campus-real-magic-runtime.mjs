/**
 * R199: only actual authored Blender GLB props, never primitive fallbacks.
 * Each school spell keeps its 46-way physical choreography. A single
 * low-priority queue downloads the requested original file; zero eager
 * 46-model fetches, zero new PointLights / glowing rings / shader effects.
 */
import {R199_HERO_GLBS,R199_HERO_COUNT} from './campus-real-hero-manifest.mjs';
const R200_TEXTURED_IDS=new Set(['E06','K01','K07','Q05','P07']);
import {createCampusSchoolMagic} from './campus-school-magic.mjs';
import {createR201SpellLoadQueue} from './campus-spell-priority-queue.mjs';
import {SCHOOL_MAGIC_IDENTITIES} from './campus-magic-bible.mjs';
export function createR199RealCampusMagic(THREE,scene,{loader,camera,
 reducedMotion=false,now=()=>0,onEvent=()=>{},mergeStatic=false,r200Pbr=false,r200Readable=false}={}){
 if(!loader?.loadAsync)throw Error('R199 genuine GLTFLoader required');
 const stage=createCampusSchoolMagic(THREE,scene,{reducedMotion,mergeStatic,r200Readable});
 const originals=new Map(),failed=new Map();
 const contacts=new Map(),contactedSerials=new Set();
 let played=0,previews=0,serial=40000000,disposed=false,evictions=0;
 const maxLoaded=8;
 const logs=[];
 const isValid=id=>typeof id==='string'&&Object.hasOwn(R199_HERO_GLBS,id)&&
  !!SCHOOL_MAGIC_IDENTITIES[id];
 // Only one original source decompress/parse at a time. Real card
 // actions can jump ahead of QUEUED speculative loads, but do not
 // corrupt an already decoding Blender source.
 const loadQueue=createR201SpellLoadQueue(async(id,priority)=>{
  const start=performance.now();
  try{
   const original=R199_HERO_GLBS[id];
   const basename=r200Pbr&&R200_TEXTURED_IDS.has(id)?
    original.replace(/\.glb$/,'_R200.glb'):original;
   const url=new URL('../art/hero-props/'+basename,import.meta.url).href;
   const gltf=await loader.loadAsync(url);
   const source=gltf?.scene;
   let meshes=0,triangles=0;
   source?.traverse(x=>{
    if(x.isMesh){meshes++;triangles+=x.geometry?.index?.count/3||
     x.geometry?.attributes?.position?.count/3||0}
   });
   if(disposed)throw Error('R201 stage disposed before GLB arrived '+id);
   if(!source?.isObject3D||meshes===0)throw Error('R201 original GLB has no mesh '+id);
   if(!stage.registerHeroAsset(id,source))
    throw Error('R201 authentic asset registration rejected '+id);
   const receipt={id,source:'real-blender-glb',file:basename,
    meshes,triangles:Math.round(triangles),
    texturedVariant:basename!==original,priority,
    readyMs:+(performance.now()-start).toFixed(1)};
   originals.set(id,receipt);
   logs.push(receipt);
   if(logs.length>48)logs.shift();
   if(!disposed)onEvent('assetReady',receipt);
   return receipt;
  }catch(error){
   const err=Error('R201 real original '+id+' failed: '+String(error));
   failed.set(id,err);
   if(!disposed)onEvent('loadError',{id,message:err.message});
   throw err;
  }
 },{onEvent:(kind,detail)=>{
   if(kind==='promoted'&&!disposed)
    onEvent('loadPromoted',{id:detail.id,queue:detail.queue});
 }});
 function ensure(id,{urgent=false}={}){
  if(!isValid(id)||disposed)return Promise.reject(Error('R201 invalid ID or stage disposed '+id));
  if(originals.has(id)){
   const cached=originals.get(id);
   originals.delete(id);originals.set(id,cached);
   return Promise.resolve(cached);
  }
  if(failed.has(id))return Promise.reject(failed.get(id));
  return loadQueue.request(id,{priority:urgent?'urgent':'background'});
 }
 // The actual physical contact (not merely the rule settlement or a
 // guessed fixed music delay) is the only source of the second foley.
 function emitContact(d){
  if(contactedSerials.has(d.serial))return;
  contactedSerials.add(d.serial);
  if(contactedSerials.size>256){
   const current=d.serial;contactedSerials.clear();contactedSerials.add(current);
  }
  if(!disposed)onEvent('contact',{id:d.id,side:d.caster,
   victim:d.victim,serial:d.serial,directDamage:d.directDamage,
   unitDamage:d.unitDamage});
 }
 function play(msg,{preview=false}={}){
  const id=msg?.card;
  if(!isValid(id)||!['player','ai'].includes(msg?.side)||
    !Number.isInteger(msg?.serial)||msg.serial<1||msg.serial>1000000000)
   return Promise.resolve(false);
  const stable={...msg,preview,type:'ASDC_R81_SPELL_RESULT'};
  return ensure(id,{urgent:true}).then(receipt=>{
   if(disposed)return false;
   const accepted=stage.play(stable,now());
   if(!accepted){onEvent('rejected',{id,serial:stable.serial});return false}
   played++;
   if(preview)previews++;
   onEvent('cast',{id,side:stable.side,serial:stable.serial,
    preview,model:receipt.file,meshes:receipt.meshes});
   // If the canonical engine resolved the spell before the GLB arrived,
   // preserve the contact descriptor until this authored prop actually
   // reaches its physical impact pose in the 3D timeline.
   return true;
  });
 }
 function preview(id,side='player'){
  if(!isValid(id))return Promise.resolve(false);
  const identity=SCHOOL_MAGIC_IDENTITIES[id];
  const cardEffect=identity&&['player','ai'].includes(side)?side:null;
  if(!cardEffect)return Promise.resolve(false);
  return play({card:id,side,serial:++serial},{preview:true});
 }
 function contact(d){
  if(!Number.isInteger(d?.serial)||d.serial<=0||
     contactedSerials.has(d.serial)||disposed)return;
  // Canonical rule contact may come before the model; the original rule
  // result is NEVER changed. 3D hit and second foley occur together later.
  contacts.set(d.serial,d);
  if(contacts.size>16)contacts.delete(contacts.keys().next().value);
 }
 function playCollateral(incident,anchor,t=now()){
  if(disposed)return false;
  return stage.playCollateral(incident,anchor,t);
 }
 function prefetch(ids){
  const wanted=[...new Set((Array.isArray(ids)?ids:[]).filter(isValid))].slice(0,8);
  for(const id of wanted){void ensure(id,{urgent:false}).catch(()=>{})}
  return wanted;
 }
 function update(t){
  if(disposed)return;
  stage.update(t);
  for(const [serial,d] of contacts){
   const readyAt=stage.physicalContactReadyAt(serial);
   if(readyAt===null||t<readyAt)continue;
   if(stage.contact(d,t)){
    contacts.delete(serial);emitContact(d);
   }
  }
  if(originals.size<=maxLoaded)return;
  for(const [id] of originals){
   if(originals.size<=maxLoaded)break;
   if(!stage.releaseHeroAsset(id))continue;
   originals.delete(id);evictions++;
   onEvent('evicted',{id});
  }
 }
 // R200 QA-only screen-space evidence. Compute bounds only when explicitly
 // requested (never in render loop). Does not move either camera or actor.
 function visibleStageBounds(width=window.innerWidth,height=window.innerHeight){
  if(!camera)return [];
  camera.updateMatrixWorld(true);
  return stage.root.children.filter(node=>/^R169_[A-Z]\d\d_/.test(node.name))
   .map(node=>{
    node.updateWorldMatrix(true,true);
    const box=new THREE.Box3().setFromObject(node,true);
    if(box.isEmpty())return {name:node.name,widthPct:0,heightPct:0};
    const points=[];
    for(const x of [box.min.x,box.max.x])
     for(const y of [box.min.y,box.max.y])
      for(const z of [box.min.z,box.max.z])
       points.push(new THREE.Vector3(x,y,z).project(camera));
    const left=Math.max(-1,Math.min(...points.map(p=>p.x)));
    const right=Math.min(1,Math.max(...points.map(p=>p.x)));
    const top=Math.min(1,Math.max(...points.map(p=>p.y)));
    const bottom=Math.max(-1,Math.min(...points.map(p=>p.y)));
    return {name:node.name,
     widthPct:+(Math.max(0,right-left)*50).toFixed(2),
     heightPct:+(Math.max(0,top-bottom)*50).toFixed(2),
     xCenterPct:+((left+right+2)*25).toFixed(2),
     yCenterPct:+((2-top-bottom)*25).toFixed(2),
     widthPx:+(Math.max(0,right-left)*width/2).toFixed(1),
     heightPx:+(Math.max(0,top-bottom)*height/2).toFixed(1)};
   });
 }
 function dispose(){
  disposed=true;loadQueue.stop();stage.dispose();originals.clear();
  failed.clear();contacts.clear();contactedSerials.clear();
 }
 return {ensure,play,preview,contact,playCollateral,prefetch,update,dispose,visibleStageBounds,
  get stats(){return {enabled:!disposed,originalCatalog:R199_HERO_COUNT,
   r200Pbr,r200Readable,loadedRealAssets:originals.size,cacheMax:maxLoaded,evictions,loadedIds:[...originals.keys()],
   failedIds:[...failed.keys()],
   inflight:[...new Set([loadQueue.stats.running,
     ...loadQueue.stats.urgentWaiting,...loadQueue.stats.backgroundWaiting].filter(Boolean))],
   queue:{running:loadQueue.stats.running?1:0,
    pending:loadQueue.stats.urgentWaiting.length+loadQueue.stats.backgroundWaiting.length,
    urgentWaiting:loadQueue.stats.urgentWaiting,
    backgroundWaiting:loadQueue.stats.backgroundWaiting,
    promotions:loadQueue.stats.promotions,completed:loadQueue.stats.completed,
    failed:loadQueue.stats.failed},
   pendingUnrenderedContacts:contacts.size,
   synchronisedContacts:contactedSerials.size,
   casts:played,previews,
   stage:stage.stats,loadedReceipts:logs.slice(-10),loadedAssetDetails:[...originals.values()]}},
  get identities(){return SCHOOL_MAGIC_IDENTITIES}};
}
