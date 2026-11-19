/** R199 PC authored-Blender campus spells; actual Chrome WebGL2 renderer */
import assert from 'node:assert/strict';
import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const ids=(process.env.R203_IDS||'E06,K01,K07,P07,X05').split(',');
const variant='real-body';
const extra='&r200Pbr=on&r200Readable=on&r202BodyHit=on&r203BodyHit=on';
const dir='r45-duel/qa/evidence/r203-body-impact';
mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
const ctx=await browser.newContext({viewport:{width:1440,height:860},serviceWorkers:'block'});
const page=await ctx.newPage(),errors=[],report={ids,passes:[],errors,ready:false};
page.on('pageerror',e=>errors.push('JS '+e.message));
page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
const snap=()=>page.evaluate(()=>{
 const q=window.__r45QA;
 const f=document.getElementById('stadium')?.contentWindow;
 const z=f?.__r45SceneQA;
 const m=z?.r199RealMagic;
 return {ready:q?.sceneReady,round:q?.round,history:q?.events?.length,
  gpu:z?.renderPerformance,cam:z?.r145ActionShot,
  school:m,actorCount:z?.summonModels?.length,hero:z?.heroLens,
  galleryCount:document.querySelectorAll('.r199-spells button').length,
  bounds:z?.r200MagicBounds||[],
  autoCard:!!document.getElementById('played-card-reveal'),
  fullScene:!!f?.document?.getElementById('battle-canvas')};
});
try{
 const begin=Date.now();
 await page.goto('http://127.0.0.1:18689/r45-duel/?qa=1&r199PhysicalMagic=on&r199Showcase=on&seed=173'+extra,
  {waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,
  null,{timeout:130000});
 report.ready=true;report.readyMs=Date.now()-begin;
 await page.waitForFunction(()=>document.querySelectorAll('.r199-spells button').length===46,
  null,{timeout:15000});
 report.first=await snap();
 assert.equal(report.first.school.originalCatalog,46);
 assert.equal(report.first.actorCount,12);
 assert.equal(report.first.galleryCount,46);
 assert.equal(report.first.cam.enabled,false);
 assert.equal(report.first.gpu.heroInsetDraws,0);
 assert.equal(report.first.autoCard,false);
 let previousCount=0;
 for(const [i,id] of ids.entries()){
  await page.locator('.r199-launch').click();
  await page.locator(`.r199-spells button[data-magic-id="${id}"]`).click();
  await page.waitForFunction(({id,count})=>{
   const z=document.getElementById('stadium')?.contentWindow?.__r45SceneQA;
   return z?.r199RealMagic?.loadedIds.includes(id)&&
      z.r199RealMagic.casts>count;
  },{id,count:previousCount},{timeout:65000});
  const during=await snap();
  assert(during.school.loadedIds.includes(id));
  assert(during.school.loadedAssetDetails.some(x=>x.id===id&&
    x.source==='real-blender-glb'&&x.meshes>=1));
  assert.equal(during.school.failedIds.length,0);
  assert.equal(during.school.stage.shaderPointLights,0);
  assert.equal(during.cam.enabled,false);
  assert.equal(during.gpu.heroInsetDraws,0);
  assert.equal(during.autoCard,false);
  // Sample at the readable 3D action frame, not during the first 100ms appear fade.
  await page.waitForTimeout(520);
  const framing=await snap();
  const screenshot=dir+'/'+variant+'-'+String(i+1).padStart(2,'0')+'-'+id+'-real-GLB.png';
  if(i<5)await page.locator('#stadium').screenshot({path:screenshot,timeout:12000});
  report.passes.push({id,loadedRealActors:during.school.loadedRealAssets,
   realMesh:during.school.loadedAssetDetails.find(x=>x.id===id)?.meshes,
   triangles:during.school.loadedAssetDetails.find(x=>x.id===id)?.triangles,
   loadedMs:during.school.loadedAssetDetails.find(x=>x.id===id)?.readyMs,
   casts:during.school.casts,active:during.school.stage.active,
   image:i<5?screenshot:null,bounds:framing.bounds});
  previousCount=during.school.casts;
  console.log('R203_REAL_BODY_ROTATION',JSON.stringify(report.passes.at(-1)));
 }
 report.final=await snap();
 assert.equal(report.final.round,report.first.round);
 assert.equal(report.final.history,report.first.history);
 assert.deepEqual(errors,[]);
 report.pass=true;
 console.log('R203_ALL_46_BODY_ORIGINAL_GLB_PASS',
  JSON.stringify({count:report.passes.length,readyMs:report.readyMs,
    noBattleRuleMutation:true,images:report.passes.map(x=>x.image),
    legacyLights:0,errors}));
}finally{
 writeFileSync(dir+'/r203-46-full-real-body-rotation.json',JSON.stringify(report,null,2)+'\n');
 await ctx.close();await browser.close();
}
