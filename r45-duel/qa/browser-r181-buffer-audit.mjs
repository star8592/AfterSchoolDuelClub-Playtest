/**
 * R180 direct, genuine Chrome WebGL 3D gym QA.
 * A/B keeps all real VRM actors, real seats and spectator models.
 */
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const {chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const mode=process.env.R180_BATCH==='on'?'on':'off';
const view=process.env.R180_VIEW||'desktop';
const n=Number(process.env.R180_RUN||1);
const out=resolve(import.meta.dirname,'evidence/r181-buffer-audit',mode+'-'+view+'-'+n);
mkdirSync(out,{recursive:true});
const errors=[];
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
let result={mode,view,run:n,errors};
try{
 const mobile=view==='mobile';
 const ctx=await browser.newContext({viewport:mobile?{width:430,height:900}:
  {width:1280,height:720},deviceScaleFactor:mobile?2:1,isMobile:mobile,
  hasTouch:mobile,serviceWorkers:'block'});
 const page=await ctx.newPage();
 page.on('pageerror',e=>errors.push('JS '+e.message));
 page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url().slice(-90))});
 page.on('requestfailed',r=>errors.push('NET '+r.failure()?.errorText));
 const cpu=mobile?3:2;
 const cdp=await ctx.newCDPSession(page);
 await cdp.send('Emulation.setCPUThrottlingRate',{rate:cpu});
 const search=new URLSearchParams({qa:'1',seed:'173',
  r180StadiumBatch:mode,r169SchoolMagic:'on',r172BatchStatic:'on',
  r175HeroE06:'on',r178HeroK01:'on',r179HeroK07:'on',
  r122Crowd:'off'});
 await page.goto('http://127.0.0.1:18681/r45-duel/?'+search,
  {waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,
  {timeout:110000,polling:300});
 // Batch must reduce RENDERING, not just source node counts.
 await page.waitForTimeout(250);
 const snap=await page.evaluate(()=>{
  const f=document.querySelector('#stadium').contentWindow,q=f.__r45SceneQA;
  return {batch:q.r180StadiumBatch,render:q.r179RenderInventory,
   skin:q.r180SkinAudit,forensics:q.r181SkinForensics,
   indexUnion:q.r181IndexUnionCandidates,
   sourceModels:f.__ASDC_LOAD_METRICS.modelsVerified,
   sourceBytes:f.__ASDC_LOAD_METRICS.downloadedBytes,
   readyMs:f.__ASDC_LOAD_METRICS.firstFrameReadyMs,
   art:q.r169SchoolMagic.authoredHighDetailAssets,
   noFloatingPortrait:q.r173NoFloatingPortrait};
 });
 result={...result,...snap};
 await page.locator('#stadium').screenshot({path:resolve(out,'arena.png')});
 result.pass=errors.length===0&&snap.sourceModels===16&&
  snap.sourceBytes===75569762&&snap.art.join(',')==='E06,K01,K07'&&
  snap.batch.enabled===(mode==='on')&&snap.render.drawCallsLastFrame>0&&
  snap.noFloatingPortrait&&(!snap.batch.enabled||
   snap.batch.trianglesBefore===snap.batch.trianglesAfter&&
   snap.batch.failed===0&&snap.batch.savedCallsNominal>0);
 console.log('R181_BUFFER_AUDIT',JSON.stringify({
  id:mode+'-'+view+'-'+n,pass:result.pass,readyMs:snap.readyMs,
  calls:snap.render.drawCallsLastFrame,
  meshes:snap.render.estimatedMeshes,batch:snap.batch,skin:snap.skin,
  indexUnion:snap.indexUnion?.map(h=>({name:h.name,top:h.groups.slice(0,5)})),
  equivalent:snap.forensics?.map(x=>({name:x.name,count:x.count,material:x.material,
  skeleton:x.skeleton,sameBoneOrder:x.sameBoneOrder,materialAppearance:x.materialAppearance,
  geometryLayout:x.geometryLayout})),errors}));
 await page.close();await ctx.close();
}finally{
 writeFileSync(resolve(out,'report.json'),JSON.stringify(result,null,2));
 await browser.close();
}
if(!result.pass)process.exitCode=2;
