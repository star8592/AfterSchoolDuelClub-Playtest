/** Compare R124 and the same-branch ?r124Quality=legacy rollback in actual Chrome. */
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const {chromium}=createRequire(import.meta.url)('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11175';
const dir=resolve(import.meta.dirname,'evidence/r124');mkdirSync(dir,{recursive:true});
const report={passed:false,checks:[],snapshots:[],errors:[]};
function check(value,label,details){report.checks.push({pass:!!value,label,details});if(!value)throw Error(label+' '+JSON.stringify(details).slice(0,700))}
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const [view,width,dpr] of [['desktop',1440,1],['portrait',430,2.5]]){
  const shots={};
  for(const quality of ['legacy','balanced']){
   const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:dpr});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(origin))errors.push('HTTP '+r.status())});
   const suffix=quality==='legacy'?'&r124Quality=legacy':'';
   await page.goto(origin+'/r45-duel/?qa=1&seed=121'+suffix,{waitUntil:'domcontentloaded',timeout:65000});
   await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:160000});
   const before=await page.evaluate(()=>({board:window.__r45QA.board,perf:document.querySelector('#stadium').contentWindow.__r45SceneQA.renderPerformance}));
   await page.evaluate(()=>document.querySelector('#stadium').contentWindow.postMessage(
    {type:'ASDC_R46_CARD_PLAY',side:'player',kind:'unit',id:'E03',serial:124001},location.origin));
   await page.waitForFunction(()=>{const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;return q.heroLens?.visible===true&&q.heroLens?.frames>7},{},{timeout:13000});
   const shot=await page.evaluate(()=>{
    const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
    return {lens:q.heroLens,perf:q.renderPerformance,board:window.__r45QA.board,
     character:q.duelistHosts.find(h=>h.side==='player').posture};
   });
   shots[quality]={total:shot.lens.lastDrawCalls,inset:shot.perf.heroInsetDraws,
    pixelRatio:shot.perf.pixelRatio,shadowSize:shot.perf.shadowSize,
    shadowAutoUpdate:shot.perf.shadowAutoUpdate,heroMask:shot.perf.heroCameraLayer,errors};
   check(shot.lens.visible&&shot.lens.side==='player'&&Math.abs(shot.lens.faceNdc?.[0]??99)<.92,
    view+' '+quality+' same premium original VRM closeup correctly framed',shot.lens);
   check(JSON.stringify(before.board)===JSON.stringify(shot.board),view+' '+quality+' rendering changes no engine board',null);
   check(errors.length===0,view+' '+quality+' no JS/HTTP errors',errors);
   await page.screenshot({path:resolve(dir,view+'-'+quality+'-real-hero.png')});
   await page.close();
  }
  const a=shots.legacy,b=shots.balanced;
  check(b.total<a.total*.76,view+' second-camera total drawcalls reduce at least 24%',shots);
  check(b.inset<a.inset*.40,view+' character-only cut uses at most 40% of full second arena',shots);
  check(b.heroMask===2&&a.heroMask===1,view+' actual cameras have correct independent visibility layers',shots);
  if(view==='portrait')check(b.pixelRatio===1.2&&b.shadowSize===1024,
   'portrait retina limits fill rate and shadow atlas',shots);
  if(view==='desktop')check(b.pixelRatio===1&&b.shadowSize===2048,
   'desktop maintains source resolution and premium shadow quality',shots);
  report.snapshots.push({view,legacy:a,balanced:b,reductionPercent:+((1-b.total/a.total)*100).toFixed(1)});
 }
 report.passed=true;
}catch(e){report.errors.push(String(e))}
finally{writeFileSync(resolve(dir,'r124-hero-budget-report.json'),JSON.stringify(report,null,2));await browser.close()}
console.log('R124_REAL_HERO_RENDER_BUDGET',JSON.stringify({passed:report.passed,checks:report.checks.length,snapshots:report.snapshots,errors:report.errors}));
if(!report.passed)process.exitCode=1;
