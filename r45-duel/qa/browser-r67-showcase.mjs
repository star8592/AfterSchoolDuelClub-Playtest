import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const ORIGIN=process.env.R67_ORIGIN||'http://127.0.0.1:11085';
const DIR=resolve(import.meta.dirname,'evidence/r67');mkdirSync(DIR,{recursive:true});
let browser,failed=false;const records=[];
try{
 browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
  args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer']});
 for(const [device,width,height] of [['desktop',1440,900],['portrait',430,900]]){
  const page=await browser.newPage({viewport:{width,height}});
  const errors=[];page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
  const response=await page.goto(ORIGIN+'/r45-duel/r67-t02-arena.html',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.__R67_SHOWCASE_QA?.ready &&
   document.querySelector('#stage-frame').contentWindow.__r45SceneQA?.summonPresence?.total===2,null,{timeout:85000});
  await page.waitForTimeout(260);
  const duo=await page.evaluate(()=>{
   const f=document.querySelector('#stage-frame').contentWindow.__r45SceneQA;
   return {variant:window.__R67_SHOWCASE_QA.variant,model:f.summonModels.find(x=>x.id==='T02'),units:f.summonPresence.entries};
  });
  await page.screenshot({path:resolve(DIR,'showcase-'+device+'-duo.png')});
  await page.locator('button[data-count="2"]').click();
  await page.waitForFunction(()=>document.querySelector('#stage-frame').contentWindow.__r45SceneQA?.summonPresence?.total===4,null,{timeout:16000});
  const four=await page.evaluate(()=>document.querySelector('#stage-frame').contentWindow.__r45SceneQA.summonPresence);
  await page.locator('button[data-angle="90"]').click();await page.waitForTimeout(450);
  await page.locator('button[data-v="old"]').click();
  await page.waitForFunction(()=>window.__R67_SHOWCASE_QA?.variant==='old' &&
   document.querySelector('#stage-frame').contentWindow.__r45SceneQA?.summonModels?.find(x=>x.id==='T02')?.clips===5 &&
   document.querySelector('#stage-frame').contentWindow.__r45SceneQA?.summonPresence?.total===4,null,{timeout:85000});
  await page.waitForTimeout(260);
  const old=await page.evaluate(()=>{
   const f=document.querySelector('#stage-frame').contentWindow.__r45SceneQA;
   return {variant:window.__R67_SHOWCASE_QA.variant,model:f.summonModels.find(x=>x.id==='T02'),
     units:f.summonPresence.entries,angle:window.__R67_SHOWCASE_QA.angle};
  });
  await page.screenshot({path:resolve(DIR,'showcase-'+device+'-old.png')});
  const ok=response.status()===200 && duo.variant==='duo' && duo.model.clips===9&&
   duo.model.meshes===59&&duo.units.length===2&&duo.units.every(x=>x.inView&&x.metrics.frontDot>=.98&&
      x.playingClips.includes('Idle_Aunt_Breath')&&x.playingClips.includes('Idle_Menu_Breath')) &&
   four.total===4&&four.entries.every(x=>x.visible&&x.inView&&x.metrics.frontDot>=.98) &&
   old.variant==='old'&&old.model.clips===5&&old.model.meshes===43&&
   old.units.length===4&&old.angle===90 && errors.length===0;
  const record={device,ok,http:response.status(),initialClips:duo.model.clips,
    initialMeshes:duo.model.meshes,duoPlaying:duo.units.map(x=>x.playingClips),
    fourUnits:four.total,oldClips:old.model.clips,oldMeshes:old.model.meshes,angle:old.angle,errors};
  records.push(record);console.log('R67_T02_ARENA_SHOWCASE_QA',JSON.stringify(record));
  if(!ok)failed=true;await page.close();
 }
}catch(e){failed=true;console.error('R67_T02_SHOWCASE_FAILURE',String(e))}
finally{writeFileSync(resolve(DIR,'showcase-results.json'),JSON.stringify(records,null,2)+'\n');await browser?.close().catch(()=>{})}
if(failed)process.exitCode=3;
