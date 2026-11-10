import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {mkdirSync,writeFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.R63_ORIGIN||'http://127.0.0.1:11083';
const outdir=resolve(import.meta.dirname,'evidence/r63');mkdirSync(outdir,{recursive:true});
let browser,failed=false;const records=[];
try{
 browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
  args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
   '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
 for(const [device,width,height] of [['desktop',1440,900],['portrait',430,900]]){
  const p=await browser.newPage({viewport:{width,height}});
  const errors=[];
  p.on('pageerror',e=>errors.push('JS '+e.message));
  p.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
  const resp=await p.goto(origin+'/r45-duel/r63-e02-arena.html',{waitUntil:'domcontentloaded',timeout:40000});
  const scene=()=>document.querySelector('#stage-frame').contentWindow.__r45SceneQA;
  await p.waitForFunction(()=>window.__R63_SHOWCASE_QA?.ready &&
   document.querySelector('#stage-frame').contentWindow.__r45SceneQA?.summonPresence?.total===2,null,{timeout:70000});
  await p.waitForTimeout(450);
  const fresh=await p.evaluate(()=>({
   version:window.__R63_SHOWCASE_QA.variant,
   model:document.querySelector('#stage-frame').contentWindow.__r45SceneQA.summonModels.find(x=>x.id==='E02'),
   units:document.querySelector('#stage-frame').contentWindow.__r45SceneQA.summonPresence.entries
  }));
  await p.screenshot({path:resolve(outdir,'showcase-'+device+'-r60.png')});
  await p.locator('[data-count="3"]').click();
  await p.waitForFunction(()=>document.querySelector('#stage-frame').contentWindow.__r45SceneQA?.summonPresence?.total===6,null,{timeout:13000});
  const six=await p.evaluate(()=>document.querySelector('#stage-frame').contentWindow.__r45SceneQA.summonPresence);
  await p.locator('[data-angle="90"]').click();
  await p.waitForTimeout(800);
  await p.locator('[data-v="old"]').click();
  await p.waitForFunction(()=>window.__R63_SHOWCASE_QA?.variant==='old' &&
   document.querySelector('#stage-frame').contentWindow.__r45SceneQA?.summonModels?.find(x=>x.id==='E02')?.clips===0 &&
   document.querySelector('#stage-frame').contentWindow.__r45SceneQA?.summonPresence?.total===6,
    null,{timeout:70000});
  await p.waitForTimeout(450);
  const old=await p.evaluate(()=>({
   version:window.__R63_SHOWCASE_QA.variant,
   model:document.querySelector('#stage-frame').contentWindow.__r45SceneQA.summonModels.find(x=>x.id==='E02'),
   units:document.querySelector('#stage-frame').contentWindow.__r45SceneQA.summonPresence.entries,
   angle:window.__R63_SHOWCASE_QA.angle
  }));
  await p.screenshot({path:resolve(outdir,'showcase-'+device+'-baseline.png')});
  const ok=resp.status()===200 && fresh.version==='r60' && fresh.model.clips===5 &&
    fresh.units.length===2&&fresh.units.every(x=>x.wingMorph?.wing_left?.textured && x.wingMorph?.wing_right?.textured && x.metrics.frontDot>=.98) &&
    six.total===6&&six.entries.every(x=>x.visible && x.inView && x.metrics.frontDot>=.98) &&
    old.version==='old'&&old.model.clips===0&&old.units.length===6 &&
    old.units.every(x=>x.wingMorph===null) && old.angle===90 && errors.length===0;
  records.push({device,ok,url:p.url(),freshVersion:fresh.version,freshClips:fresh.model.clips,
   sixUnits:six.total,oldVersion:old.version,oldClips:old.model.clips,angle:old.angle,errors});
  console.log('R63_SHOWCASE_QA',JSON.stringify(records.at(-1)));
  if(!ok)failed=true;await p.close();
 }
}catch(e){console.error('R63_SHOWCASE_FAILURE',String(e));failed=true;}
finally{writeFileSync(resolve(outdir,'showcase-results.json'),JSON.stringify(records,null,2)+'\n');await browser?.close().catch(()=>{});}
if(failed)process.exitCode=3;
