/** R190 forced genuine future unit failure must never create phantom 3D. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer',
 '--disable-dev-shm-usage']});
const result={test:'R190 genuine on-demand E02 GLB fail-closed',pass:false};
const context=await browser.newContext({viewport:{width:1280,height:720},
 serviceWorkers:'block'});
const page=await context.newPage();
let blocked=0;
await page.route(/\/assets\/summons\/E02[^/]*\.glb(?:\.gz)?(?:\?.*)?$/,route=>{
 blocked++;return route.abort('failed');
});
try{
 const u=new URL('http://127.0.0.1:18687/r45-duel/');
 for(const [key,val] of Object.entries({qa:'1',seed:'2',deck:'kitchen',
  r189Stream:'on',r190Demand:'on',r188Owl:'barn'}))
  u.searchParams.set(key,val);
 await page.goto(u.href,{waitUntil:'domcontentloaded',timeout:65000});
 await page.waitForFunction(()=>window.__r45QA?.r189Stream?.backgroundError,
  null,{timeout:100000});
 result.receipt=await page.evaluate(()=>{
  const f=document.querySelector('#stadium').contentWindow;
  return{
   originalInitial:f.__r45SceneQA.r189StreamReceipt.initialRealGLBs,
   originalLoaded:f.__r45SceneQA.r189StreamReceipt.loadedNow,
   error:window.__r45QA.r189Stream.backgroundError,
   sceneError:window.__r45QA.sceneError,
   allReady:window.__r45QA.r189Stream.allReady,
   playDisabled:document.getElementById('play').disabled,
   endDisabled:document.getElementById('end').disabled,
   demandFailed:f.__r45SceneQA.r189StreamReceipt.demandFailed,
   noFakeSource:!f.__r45SceneQA.r189StreamReceipt.loadedNow.includes('E02')
  };
 });
 result.blockedRequests=blocked;
 assert(blocked>=1,'missing real on-demand E02 network request');
 assert(result.receipt.sceneError&&result.receipt.playDisabled&&result.receipt.endDisabled);
 assert(!result.receipt.allReady && result.receipt.noFakeSource);
 assert(result.receipt.demandFailed>=1);
 assert(result.receipt.originalInitial.length===2);
 result.pass=true;
}finally{
 writeFileSync('/home/master/projects/after-school-duel-r190-demand/r45-duel/qa/evidence/r190-demand/r190-real-on-demand-network-failure.json',
  JSON.stringify(result,null,2));
 await context.close();await browser.close();
}
console.log('R190_TRUE_NETWORK_FAILURE_FAIL_CLOSED',JSON.stringify(result));
