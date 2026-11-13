import {createRequire} from 'node:module';
import {mkdtempSync,rmSync,mkdirSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
const {chromium}=createRequire(import.meta.url)('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11426';
const profile=mkdtempSync(join(tmpdir(),'asdc-r125-restart-'));
const result={passed:false,checks:[],errors:[]};
const check=(ok,name,detail)=>{result.checks.push({pass:!!ok,name});if(!ok)throw Error(name+': '+JSON.stringify(detail));};
const opts={headless:true,executablePath:'/usr/bin/google-chrome',viewport:{width:1440,height:900},args:[
 '--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']};
let context=null;
try{
 context=await chromium.launchPersistentContext(profile,opts);
 let page=context.pages()[0]||await context.newPage();
 await page.goto(origin+'/r45-duel/?qa=1&seed=125',{waitUntil:'domcontentloaded',timeout:65000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:180000});
 await page.waitForFunction(async()=>{
  const c=await caches.open('asdc-r125-immutable-models-v1');
  return (await c.keys()).length===16;
 },null,{timeout:120000,polling:1000});
 check((await page.evaluate(async()=>{
  const c=await caches.open('asdc-r125-immutable-models-v1');
  return (await c.keys()).length;
 }))===16,'16 real assets persisted on disk before Chrome exits');
 await context.close();context=null;
 // Restart Chrome from the exact SAME real profile: no in-memory browser
 // context or same-tab HTTP cache is reused.
 context=await chromium.launchPersistentContext(profile,opts);
 page=context.pages()[0]||await context.newPage();
 const swResponses=[];
 page.on('response',r=>{
  if(r.url().includes('/r45-duel/assets/')&&r.fromServiceWorker())
   swResponses.push(r.url());
 });
 await page.goto(origin+'/r45-duel/?qa=1&seed=125',{waitUntil:'domcontentloaded',timeout:65000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:180000});
 const ret=await page.evaluate(async()=>{
  const cache=await caches.open('asdc-r125-immutable-models-v1');
  const w=document.querySelector('#stadium').contentWindow;
  return{records:(await cache.keys()).length,models:w.__ASDC_LOAD_METRICS.modelsVerified,
   summons:w.__r45SceneQA.summonModels.length,controlled:!!navigator.serviceWorker.controller};
 });
 check(ret.records===16&&ret.models===16&&ret.summons===12,
  'same real sixteen models validated after Chrome process restart',ret);
 check(ret.controlled&&new Set(swResponses).size>=16,
  'disk CacheStorage is served by worker after fresh Chrome process',ret);
 result.passed=true;result.restart=ret;result.responses=new Set(swResponses).size;
}catch(e){result.errors.push(String(e));}
finally{
 await context?.close().catch(()=>{});
 rmSync(profile,{recursive:true,force:true});
 const dir=resolve(import.meta.dirname,'evidence/r125-cache');mkdirSync(dir,{recursive:true});
 writeFileSync(resolve(dir,'r125-browser-restart-report.json'),JSON.stringify(result,null,2));
}
console.log('R125_RESTART_PERSISTENCE',JSON.stringify(result));
if(!result.passed)process.exitCode=1;
