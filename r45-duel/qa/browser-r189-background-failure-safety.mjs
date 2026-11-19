/** Real Chrome negative test: break one genuine deferred GLB on the wire.
 * Scene may start on verified hand, then MUST disable all gameplay safely.
 */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
const receipt={case:'R189 deferred T03 original GLB missing',failedAsset:'T03-Rain-Landing-R97.glb',realChrome:true,pass:false};
try{
 const ctx=await browser.newContext({viewport:{width:1280,height:720},serviceWorkers:'block'});
 const page=await ctx.newPage();
 let intercepted=0;
 await page.route(/T03-Rain-Landing-R97\.glb(?:\.gz)?(?:\?.*)?$/,route=>{
  intercepted++;
  route.abort('failed');
 });
 const url=new URL('http://127.0.0.1:18686/r45-duel/');
 for(const [k,v] of Object.entries({
  qa:'1',seed:'173',deck:'classic',r189Stream:'on',r189BgConcurrency:'4',
  r189BgDelay:'1500',r188Owl:'barn',r169SchoolMagic:'on'
 }))url.searchParams.set(k,v);
 await page.goto(url.href,{waitUntil:'domcontentloaded',timeout:65000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:90000});
 receipt.initial=await page.evaluate(()=>{
  const f=document.querySelector('#stadium').contentWindow;
  return{verifiedAtFirstReady:f.__ASDC_LOAD_METRICS.modelsVerified,
   initiallyLoaded:f.__r45SceneQA.r189StreamReceipt.initialRealGLBs,
   earlyReady:window.__r45QA.sceneReady,
   backgroundNotYetComplete:!window.__r45QA.r189Stream.allReady};
 });
 assert(receipt.initial.earlyReady&&receipt.initial.backgroundNotYetComplete);
 assert(!receipt.initial.initiallyLoaded.includes('T03'),'wrong failure target was in starter hand');
 await page.waitForFunction(()=>window.__r45QA?.r189Stream?.backgroundError!==null,
  null,{timeout:110000});
 receipt.failure=await page.evaluate(()=>({
  error:window.__r45QA.r189Stream.backgroundError,
  sceneError:window.__r45QA.sceneError,
  stillSceneReady:window.__r45QA.sceneReady,
  stillAllReady:window.__r45QA.r189Stream.allReady,
  endDisabled:document.getElementById('end').disabled,
  playDisabled:document.getElementById('play').disabled,
  noBadPrototype:!document.querySelector('#stadium').contentWindow
   .__r45SceneQA.r189StreamReceipt.loadedNow.includes('T03')
 }));
 receipt.intercepted=intercepted;
 assert(intercepted>=1);
 assert(receipt.failure.error);
 assert(receipt.failure.sceneError&&!receipt.failure.stillAllReady);
 assert(receipt.failure.endDisabled&&receipt.failure.playDisabled);
 assert(receipt.failure.noBadPrototype);
 receipt.pass=true;
 await page.close();await ctx.close();
}finally{
 writeFileSync('/home/master/projects/after-school-duel-r189-priority/r45-duel/qa/evidence/r189-startup-stream/r189-background-failure-real-browser.json',
  JSON.stringify(receipt,null,2));
 await browser.close();
}
console.log('R189_FAIL_CLOSED_REAL_BROWSER',JSON.stringify(receipt));
