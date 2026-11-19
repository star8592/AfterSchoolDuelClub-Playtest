/** R205 a GENUINE G02 card summoned from the authoritative hand. */
import assert from'node:assert/strict';
import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const dir='r45-duel/qa/evidence/r205-original-summons';
mkdirSync(dir,{recursive:true});
const report={pass:false,errors:[],rule:'actual player hand G02 from classic seed5'};
const b=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer',
 '--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']});
const ctx=await b.newContext({viewport:{width:1440,height:860},
 serviceWorkers:'block'});
const page=await ctx.newPage();
page.on('pageerror',e=>report.errors.push('JS '+e.message));
page.on('response',r=>{if(r.status()>=400)report.errors.push('HTTP '+r.status()+' '+r.url())});
const snap=()=>page.evaluate(()=>{
 const a=window.__r45QA,b=document.getElementById('stadium')?.contentWindow?.__r45SceneQA;
 return{hp:a?.hp,round:a?.round,events:a?.events,game:a?.board,
  summoned:b?.summonPresence,
  model:b?.summonModels?.find(v=>v.id==='G02'),
  camera:b?.r145ActionShot?.enabled,inset:b?.renderPerformance?.heroInsetDraws,
  light:b?.magicArsenal?.played,drawCalls:b?.drawCalls
 };
});
try{
 await page.goto('http://127.0.0.1:18689/r45-duel/?qa=1&seed=5&deck=classic&r205LivingSummons=on&r199PhysicalMagic=on&r200Pbr=on&r200Readable=on&r202BodyHit=on&r203BodyHit=on&r204Caster=on',
  {waitUntil:'domcontentloaded',timeout:65000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:130000});
 report.before=await snap();
 const card=page.locator('#hand .card[data-card-id="G02"]').first();
 assert(await card.count(),'real classic seed 6 must hold original G02');
 await card.click();assert(await page.locator('#play').isEnabled());
 await page.locator('#play').click();
 await page.waitForFunction(()=>{
  const a=window.__r45QA,s=document.getElementById('stadium')?.contentWindow?.__r45SceneQA?.summonPresence;
  return a?.events?.some(e=>e.type==='card_play'&&e.card==='G02'&&e.side==='player')
   &&s?.entries?.some(x=>x.id==='G02'&&x.side==='player'&&x.visible);
 },null,{timeout:20000});
 await page.waitForTimeout(600);
 report.entrance=await snap();
 await page.locator('#stadium').screenshot({
  path:dir+'/r205-real-card-G02-original-source-entrance.png'});
 // The independent authored source-clip entrance must finish first;
 // only then R205 takes over the visible morph-bound idle life loop.
 await page.waitForFunction(()=>{
  const a=document.getElementById('stadium')?.contentWindow?.__r45SceneQA?.summonPresence?.r205VisibleBodyLife;
  const k=a?.actors?.find(x=>x.id==='G02');
  return k?.activeFrames>20&&k?.actualSourceMorphWrites>100;
 },null,{timeout:17000});
 report.visibleAfter=await snap();
 await page.waitForTimeout(2600);
 report.living=await snap();
 await page.locator('#stadium').screenshot({
  path:dir+'/r205-real-card-G02-after-living-motion.png'});
 await page.waitForTimeout(2200);
 report.later=await snap();
 assert.equal(report.later.model.file,'G02-Snow-Landing-R97.glb');
 const unit=report.later.summoned.entries.find(x=>x.id==='G02'&&x.side==='player');
 assert(unit&&unit.kind==='gltf-instance'&&unit.visible&&unit.metrics.frontDot>.94);
 const living=report.later.summoned.r205VisibleBodyLife.actors.find(x=>x.id==='G02');
 assert(living&&living.originalVisibleR97Unskinned&&living.originalMorphMeshes>=1);
 assert(living.observedPhases.length>=3,'real source body animation cannot stick in one pose');
 assert(living.activeFrames>40&&living.actualSourceMorphWrites>250);
 assert.equal(report.later.camera,false);assert.equal(report.later.inset,0);
 assert.equal(report.later.light,0);
 assert.equal(report.later.hp.player,report.entrance.hp.player);
 assert.equal(report.later.hp.ai,report.entrance.hp.ai);
 assert.equal(report.later.round,report.entrance.round);
 assert.deepEqual(report.errors,[]);
 report.summary={originalGLB:report.later.model.file,
  trueCardUsedFromHand:true,originalVisibleMorphMeshes:living.originalMorphMeshes,
  originalSourceAnimatedChannels:living.sourceAvailableChannels,
  variedBodyPhases:living.observedPhases,
  originalMeshNoReplacements:true,cameraWide:true,hpUnchanged:true,
  drawCalls:report.later.drawCalls,errors:[]};
 report.pass=true;
 console.log('R205_REAL_CARD_FROM_HAND_ORIGINAL_CHARACTER_ACTUALLY_ANIMATED_PASS',
  JSON.stringify(report.summary));
}finally{
 writeFileSync(dir+'/r205-real-G02-card-body-performance.json',JSON.stringify(report,null,2)+'\n');
 await ctx.close();await b.close();
}
