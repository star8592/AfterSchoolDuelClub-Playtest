/** R204 QA: all ten UNIQUE source-VRM casting gestures in real Chrome. */
import assert from'node:assert/strict';
import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const dir='r45-duel/qa/evidence/r204-caster-gestures';
mkdirSync(dir,{recursive:true});
const ids=['E06','Q05','K01','K07','P07','K04','S08','P03','X05','Q07'];
const report={pass:false,ids,events:[],errors:[],source:'real Chrome/Vulkan WebGL2 RTX5070Ti'};
const b=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
const ctx=await b.newContext({viewport:{width:1440,height:860},serviceWorkers:'block'});
const page=await ctx.newPage();
page.on('pageerror',e=>report.errors.push('JS '+e.message));
page.on('response',r=>{if(r.status()>=400)report.errors.push('HTTP '+r.status()+' '+r.url())});
const get=()=>page.evaluate(()=>{
 const q=window.__r45QA,z=document.getElementById('stadium')?.contentWindow?.__r45SceneQA;
 return{round:q?.round,hp:q?.hp,events:q?.events?.length,
  caster:z?.r204Caster,actors:z?.duelistHosts,
  stage:z?.r199RealMagic?.stage,realGLBs:z?.r199RealMagic?.loadedIds,
  actualCard:z?.handCards,
  closeup:z?.r145ActionShot?.enabled,inset:z?.renderPerformance?.heroInsetDraws,
  oldLights:z?.magicArsenal?.played
 };
});
try{
 await page.goto('http://127.0.0.1:18689/r45-duel/?qa=1&seed=173&r199PhysicalMagic=on&r199Showcase=on&r200Pbr=on&r200Readable=on&r202BodyHit=on&r203BodyHit=on&r204Caster=on',
  {waitUntil:'domcontentloaded',timeout:65000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true&&
  document.querySelectorAll('.r199-spells button').length===46,null,{timeout:130000});
 const base=await get();assert(base.caster.enabled);
 let n=0;
 for(const id of ids){
  await page.locator('.r199-launch').click();
  await page.locator('.r199-spells button[data-magic-id="'+id+'"]').click();
  n++;
  await page.waitForFunction(({id,n})=>{
   const z=document.getElementById('stadium')?.contentWindow?.__r45SceneQA;
   const c=z?.r204Caster?.actions?.player;
   return c?.id===id&&c?.phases?.includes('throw-snap')&&
    z?.r199RealMagic?.stage?.lastBySide?.player===id;
  },{id,n},{timeout:60000});
  const throwing=await get();
  const actor=throwing.actors.find(a=>a.side==='player');
  assert(actor?.sourceRig||actor?.modelSource);
  assert(actor.bones>=50&&actor.skins>=1);
  assert(throwing.realGLBs.includes(id));
  assert(throwing.caster.actions.player.phases.includes('throw-snap'));
  const grip=throwing.actualCard.actors.find(x=>x.side==='player');
  assert(grip?.id===id&&grip.r204Synced&&grip.realFingerBones===15,
   id+' must render authentic illustrated card in real five-finger VRM hand');
  assert(throwing.actors.find(a=>a.side==='player').posture.r204Caster?.style);
  for(const hand of ['R','L']){
   const ik=actor.posture.ik[hand];
   assert(Number.isFinite(ik.error)&&ik.error<=.018,
    id+' bent original wrist/elbow outside exact source VRM IK reach: '+
    JSON.stringify(ik));
  }
  assert.equal(throwing.closeup,false);assert.equal(throwing.inset,0);
  await page.locator('#stadium').screenshot({
   path:dir+'/r204-'+String(n).padStart(2,'0')+'-'+id+'-original-vrm-card-throw.png'});
  await page.waitForFunction(({id,n})=>{
   const z=document.getElementById('stadium')?.contentWindow?.__r45SceneQA;
   const c=z?.r204Caster?.actions?.player;
   return c?.id===id&&Number.isFinite(c?.hitAt)&&
    z?.r199RealMagic?.stage?.previewBodyContacts>=n;
  },{id,n},{timeout:18000});
  const after=await get(),caster=after.caster.actions.player;
  assert(caster.phases.includes('follow-through'),'no follow-through '+id);
  assert(caster.phases.includes('throw-snap'),'no real throw '+id);
  assert(caster.id===id);
  assert.equal(after.oldLights,0);assert.equal(after.closeup,false);
  assert.deepEqual(after.hp,base.hp);
  assert.equal(after.events,base.events);
  assert.equal(after.round,base.round);
  report.events.push({id,style:throwing.actors.find(a=>a.side==='player').posture.r204Caster.style,
   phases:caster.phases,sourceSkinCount:actor.skins,
   originalMeshLoaded:true,ruleUnchanged:true,
   scenePhoto:'r204-'+String(n).padStart(2,'0')+'-'+id+'-original-vrm-card-throw.png'});
  console.log('R204_ORIGINAL_VRM_UNIQUE_GESTURE_PASS',id,report.events.at(-1).style);
 }
 assert.equal(new Set(report.events.map(x=>x.style)).size,10,
  'Ten genuine cards must not share the same bland arm-push animation');
 assert.deepEqual(report.errors,[]);
 report.pass=true;
 console.log('R204_10_UNIQUE_REAL_SOURCE_CASTER_AND_OPPONENT_PASS',
  JSON.stringify({count:ids.length,uniqueGestureStyles:10,unchangedHp:true,
   sourceVRMNoRetargetWarp:true,autoCloseups:0,errors:[]}));
}finally{
 writeFileSync(dir+'/r204-ten-original-caster-personalities.json',JSON.stringify(report,null,2)+'\n');
 await ctx.close();await b.close();
}
