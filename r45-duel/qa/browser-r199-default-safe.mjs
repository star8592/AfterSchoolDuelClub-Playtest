/** Stable-main regression: NEVER auto-zoom, even with legacy flags. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync}from'node:fs';
const {chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const deck=process.env.WIDE_DECK||'classic',seed=Number(process.env.WIDE_SEED||173);
const name='stable-'+deck+'-seed'+seed;
const out='r45-duel/qa/evidence/r198-stable-wide';
mkdirSync(out,{recursive:true});
const b=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
const c=await b.newContext({viewport:{width:1280,height:720},serviceWorkers:'block'});
const p=await c.newPage(),errors=[],report={name,seed,deck,pass:false,errors};
p.on('pageerror',e=>errors.push('JS '+e.message));
p.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
const snap=()=>p.evaluate(()=>{
 const q=window.__r45QA,f=document.querySelector('#stadium').contentWindow,z=f?.__r45SceneQA;
 return {ready:q?.sceneReady,round:q?.round,sceneSources:z?.summonModels,
  events:q?.events?.length,
  angle:document.querySelector('#camera-angle')?.textContent,
  camera:z?.r145ActionShot,portrait:z?.heroLens,crowd:z?.r123Camera,
  gpu:z?.renderPerformance,hasPortrait:!!f?.document?.getElementById('hero-portrait-frame'),
  hasAutoCard:!!document.getElementById('played-card-reveal'),
  manualArt:!!document.getElementById('card-selected-art'),
  originalSourcePresent:!!f?.document?.querySelector('#battle-canvas'),
  soundOn:document.getElementById('audio-toggle')?.getAttribute('aria-pressed')
 }
});
const invariant=q=>{
 assert(q.ready,'scene must be playable');
 assert(q.originalSourcePresent);
 assert.equal(q.camera.enabled,false);
 assert.equal(q.camera.active,null);
 assert.equal(q.portrait.visible,false);
 assert.equal(q.crowd.cuts,0);
 assert.equal(q.crowd.weight,0);
 assert.equal(q.crowd.frontFacingCloseup,false);
 assert.equal(q.gpu.heroInsetDraws,0);
 assert.equal(q.gpu.heroCameraLayer,null);
 assert.equal(q.hasPortrait,false);
 assert.equal(q.hasAutoCard,false);
 assert.equal(q.manualArt,true);
 assert.equal(q.soundOn,'true');
};
try{
 const qs=new URLSearchParams({qa:'1',deck,seed:String(seed),
  r145ActionCamera:'on',r147ArtLab:'on',r123Closeup:'on',
  r131QaCloseup:'E04'});
 await p.goto('http://127.0.0.1:18689/r45-duel/?'+qs,
  {waitUntil:'domcontentloaded',timeout:65000});
 await p.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:110000});
 report.before=await snap();invariant(report.before);
 await p.locator('#stadium').screenshot({path:out+'/'+name+'-wide-before.png'});
 const card=p.locator('#hand .card:not([disabled])').first();
 if(await card.count()){
  await card.click();report.playCardId=await card.getAttribute('data-card-id');
  await p.locator('#play').click();
  await p.waitForTimeout(1800);
 }
 report.afterCard=await snap();invariant(report.afterCard);
 await p.locator('#end').click();
 await p.waitForFunction(()=>window.__r45QA.round>=2,null,{timeout:22000});
 await p.waitForTimeout(1200);
 report.afterAI=await snap();invariant(report.afterAI);
 assert(report.afterAI.events>report.before.events);
 assert(report.afterAI.round>=2);
 await p.locator('#stadium').screenshot({path:out+'/'+name+'-wide-after.png'});
 // Manual inspection is retained; no auto overlay ever appears.
 await p.locator('#card-selected-art').click();
 report.manualCardDialog=await p.locator('.card-zoom').isVisible();
 assert(report.manualCardDialog);
 assert.deepEqual(errors,[]);
 report.pass=true;
 console.log('R198_STABLE_PC_WIDE_NO_ZOOM_PASS',JSON.stringify({
  name,pass:true,sourceCount:report.before.sceneSources.length,
  round:report.afterAI.round,autoZoom:false,autoPortrait:false,
  manualArt:true,errors}));
}finally{
 writeFileSync(out+'/'+name+'.json',JSON.stringify(report,null,2)+'\n');
 await c.close();await b.close();
}
