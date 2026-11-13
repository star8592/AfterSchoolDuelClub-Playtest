import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const{chromium}=createRequire(import.meta.url)('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11426';
const report={passed:false,origin,checks:[],errors:[],views:[]};
const dir=resolve(import.meta.dirname,'evidence/r125-cache');mkdirSync(dir,{recursive:true});
function check(ok,name,v){report.checks.push({pass:!!ok,name});if(!ok)throw Error(name+': '+JSON.stringify(v).slice(0,900));}
const browserOptions={headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']};
let browser=await chromium.launch(browserOptions);
try{
 for(const [view,width] of [['desktop',1440],['portrait',430]]){
  const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'allow'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url());});
  const url=origin+'/r45-duel/?qa=1&seed=125';
  const firstAt=Date.now();
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:65000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:180000});
  const firstReadyMs=Date.now()-firstAt;
  await page.waitForFunction(async()=>{
   const c=await caches.open('asdc-r125-immutable-models-v1');
   return (await c.keys()).length===16;
  },null,{timeout:100000,polling:1500});
  const first=await page.evaluate(async()=>{
   const c=await caches.open('asdc-r125-immutable-models-v1');
   return {keys:(await c.keys()).map(req=>req.url),
    models:document.querySelector('#stadium').contentWindow.__r45SceneQA.summonModels.length,
    ready:window.__r45QA.sceneReady};
  });
  check(first.ready&&first.models===12,view+' all original GLB summons truly validated',first);
  check(first.keys.length===16&&first.keys.every(url=>/\?v=[0-9a-f]{16}$/.test(url)),
   view+' 16 exact source asset fingerprints cached',first.keys);
  const fromSW=[];
  page.on('response',r=>{
   if(r.url().includes('/r45-duel/assets/')&&r.fromServiceWorker())fromSW.push(r.url());
  });
  const secondAt=Date.now();
  await page.reload({waitUntil:'domcontentloaded',timeout:65000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:180000});
  const secondReadyMs=Date.now()-secondAt;
  const after=await page.evaluate(async()=>{
   const sw=navigator.serviceWorker.controller;
   if(!sw)return null;
   const channel=new MessageChannel();
   return await new Promise((resolve,reject)=>{
    const t=setTimeout(()=>reject(Error('service worker metrics timeout')),10000);
    channel.port1.onmessage=e=>{clearTimeout(t);resolve(e.data)};
    sw.postMessage({type:'R125_STATS'},[channel.port2]);
   });
  });
  check(after?.records===16&&after.metric.hits>=16,
   view+' second entry served 16 true assets from local persistent CacheStorage',after);
  check(new Set(fromSW).size>=16,view+' real HTTP responses intercepted by service worker',fromSW);
  check(errors.length===0,view+' no scripts or resources failed',errors);
  report.views.push({view,firstReadyMs,secondReadyMs,worker:after,
   fromServiceWorker:new Set(fromSW).size,byteCacheEntries:first.keys.length});
  await context.close();
  // Each view represents an independent device: close the complete Chrome
  // profile, not just its incognito context, before the second cold start.
  if(view==='desktop'){
   await browser.close();browser=await chromium.launch(browserOptions);
  }
 }
 report.passed=true;
}catch(e){report.errors.push(String(e));}
finally{writeFileSync(resolve(dir,'r125-cache-report.json'),JSON.stringify(report,null,2));await browser.close();}
console.log('R125_WARM_CACHE_BROWSER',JSON.stringify({passed:report.passed,checks:report.checks.length,errors:report.errors,views:report.views}));
if(!report.passed)process.exitCode=1;
