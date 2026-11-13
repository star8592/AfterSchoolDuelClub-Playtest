import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const {chromium}=createRequire(import.meta.url)('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:17357';
const output=process.env.ASDC_QA_OUTPUT||'/tmp/r116-smart-loading';mkdirSync(output,{recursive:true});
const report={ok:false,cases:[],errors:[]};
const verify=(ok,label,data)=>{if(!ok)throw Error(label+' '+JSON.stringify(data).slice(0,450))};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const [name,width] of [['desktop',1440],['phone',430]]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/r45-duel/?qa=1&seed=1234',{waitUntil:'domcontentloaded',timeout:50000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:120000});
  const snap=await page.evaluate(()=>{
   const frame=document.getElementById('stadium'),win=frame.contentWindow,doc=frame.contentDocument;
   return{ready:window.__r45QA.sceneReady,metrics:win.__ASDC_LOAD_METRICS,
    visibleText:doc.getElementById('load-download')?.textContent,
    progress:doc.getElementById('load-progress')?.value,loadingHidden:doc.getElementById('loading').hidden,
    slowHidden:doc.getElementById('load-slow')?.hidden,buttonDisabled:document.getElementById('end').disabled};
  });
  verify(snap.ready&&snap.metrics.modelsVerified===16&&snap.metrics.downloadedBytes>80*1048576&&
    snap.metrics.knownTotalBytes>=snap.metrics.downloadedBytes&&snap.progress===16&&snap.loadingHidden&&
    !snap.buttonDisabled&&snap.slowHidden&&errors.length===0,'actual downloaded bytes and verification '+name,snap);
  report.cases.push({name,passed:true,...snap,errors});
  await page.close();
 }
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 let delays=0;
 await page.route('**/T01-Owl-Innerscene-R84.glb',async route=>{delays++;await new Promise(resolve=>setTimeout(resolve,14600));await route.continue()});
 await page.goto(origin+'/r45-duel/?qa=1&seed=414',{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>document.querySelector('#stadium')?.contentDocument?.querySelector('#load-slow')?.hidden===false,null,{timeout:28000});
 const slow=await page.evaluate(()=>{
  const frame=document.getElementById('stadium'),doc=frame.contentDocument;
  return{ready:window.__r45QA?.sceneReady,downloadedBytes:frame.contentWindow.__ASDC_LOAD_METRICS.downloadedBytes,
   models:frame.contentWindow.__ASDC_LOAD_METRICS.modelsVerified,slowVisible:!doc.querySelector('#load-slow').hidden,
   retryVisible:doc.querySelector('#load-retry-slow').offsetParent!==null,
   progressText:doc.querySelector('#load-download').textContent,
   endDisabled:document.querySelector('#end').disabled};
 });
 verify(delays>=1&&slow.slowVisible&&slow.retryVisible&&slow.models<16&&slow.downloadedBytes>0&&slow.endDisabled&&!slow.ready,
  'slow download must show real bytes, manual recovery and no fake ready',slow);
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:120000});
 const recovered=await page.evaluate(()=>({ready:window.__r45QA.sceneReady,
  models:document.querySelector('#stadium').contentWindow.__ASDC_LOAD_METRICS.modelsVerified,
  slowHidden:document.querySelector('#stadium').contentDocument.querySelector('#loading').hidden,
  endEnabled:!document.querySelector('#end').disabled}));
 verify(recovered.ready&&recovered.models===16&&recovered.slowHidden&&recovered.endEnabled&&errors.length===0,
  'delayed genuine model eventually finishes without bypassing gate',recovered);
 report.cases.push({name:'delayed-network',passed:true,slow,recovered,errors});
 await page.close();
 report.ok=true;
}catch(e){report.errors.push(String(e));console.error('R116_FAILED',String(e))}
finally{writeFileSync(resolve(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log('R116_SMART_LOADING',JSON.stringify({ok:report.ok,cases:report.cases.map(x=>({name:x.name,passed:x.passed,downloadedMiB:x.metrics?Math.round(x.metrics.downloadedBytes/1048576*10)/10:undefined,slow:x.slow})),errors:report.errors}));await browser.close()}
if(!report.ok)process.exitCode=5;
