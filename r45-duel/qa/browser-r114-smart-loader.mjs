import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const {chromium}=createRequire(import.meta.url)('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11114';
const output=process.env.ASDC_QA_OUTPUT||'/tmp/asdc-r114-loader';
mkdirSync(output,{recursive:true});
const report={ok:false,views:[],errors:[]};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const [view,width] of [['desktop',1440],['phone',430]]){
  const page=await browser.newPage({viewport:{width,height:900}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(origin))errors.push('HTTP '+r.status()+' '+r.url())});
  const started=Date.now();
  await page.goto(origin+'/r45-duel/?qa=1&seed=9',{waitUntil:'domcontentloaded',timeout:65000});
  await page.waitForFunction(()=>{
   const d=document.querySelector('#stadium')?.contentDocument;
   return d?.querySelector('.load-shell .load-title')?.textContent==='放学后决斗社';
  },null,{timeout:20000});
  const initial=await page.evaluate(()=>{
   const d=document.querySelector('#stadium').contentDocument;
   return {loaderVisible:!d.querySelector('#loading').hidden,hasBrand:!!d.querySelector('.load-emblem'),
    hasRealProgress:!!d.querySelector('#load-progress'),hasRecoveryRoot:!!d.querySelector('.load-shell')};
  });
  await page.screenshot({path:resolve(output,view+'-opening.png')});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:180000});
  const done=await page.evaluate(()=>{
   const f=document.querySelector('#stadium');
   const d=f.contentDocument;
   return {modelMetrics:f.contentWindow.__ASDC_LOAD_METRICS,progress:d.querySelector('#load-progress').value,
    loadingHidden:d.querySelector('#loading').hidden,actors:f.contentWindow.__r45SceneQA?.roles?.length,
    summons:f.contentWindow.__r45SceneQA?.summonModels?.length,
    enabled:!document.querySelector('#end').disabled};
  });
  const checks=[initial.loaderVisible,initial.hasBrand,initial.hasRealProgress,initial.hasRecoveryRoot,
   done.modelMetrics?.modelsVerified===16,done.progress===16,done.loadingHidden,
   done.actors===2,done.summons===12,done.enabled,
   done.modelMetrics?.firstFrameReadyMs>=done.modelMetrics?.modelReadyMs,errors.length===0];
  const result={view,wallMs:Date.now()-started,initial,done,errors,checksPassed:checks.every(Boolean)};
  report.views.push(result);
  await page.screenshot({path:resolve(output,view+'-ready.png')});
  await page.close();
  if(!result.checksPassed)throw Error(view+' loader regression '+JSON.stringify(result));
 }
 report.ok=true;
}catch(e){report.errors.push(String(e))}
finally{
 writeFileSync(resolve(output,'report.json'),JSON.stringify(report,null,2)+'\n');
 console.log('R114_SMART_LOADER',JSON.stringify(report));
 await browser.close();
}
if(!report.ok)process.exitCode=5;
