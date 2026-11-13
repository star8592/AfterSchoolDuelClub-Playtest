import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const {chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const ORIGIN=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11171';
const evidence=resolve(import.meta.dirname,'evidence/r121');
mkdirSync(evidence,{recursive:true});
const results={passed:false,checks:[],errors:[]};
function check(condition,description,detail){
 results.checks.push({passed:!!condition,description,detail});
 if(!condition)throw Error(description+' '+JSON.stringify(detail).slice(0,1000));
}
const browser=await chromium.launch({
 headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--autoplay-policy=no-user-gesture-required',
 '--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']
});
try{
 for(const [view,width] of [['desktop',1440],['portrait',430]]){
  const page=await browser.newPage({viewport:{width,height:900}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(ORIGIN))
   errors.push('HTTP '+r.status()+' '+r.url())});
  await page.goto(ORIGIN+'/r45-duel/?qa=1&deck=kitchen&seed=8',{
   waitUntil:'domcontentloaded',timeout:65000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:180000});
  await page.waitForFunction(()=>window.__r45QA?.audio?.assetsReady===true,null,{timeout:18000});
  check(await page.locator('.card[data-card-id="K01"]:not([disabled])').count()>0,
   view+' genuine K01 event available',null);
  const before=await page.evaluate(()=>{
   const s=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return {sfx:s.spellContactFX,receipts:s.r121ContactReceipts,hostHits:s.hostHits};
  });
  check(before.sfx?.elements===15,view+' 15 elemental FX categories are loaded',before);
  await page.locator('.card[data-card-id="K01"]:not([disabled])').first().click();
  await page.locator('#play').click();
  await page.waitForFunction(()=>{
   const s=document.querySelector('#stadium')?.contentWindow?.__r45SceneQA;
   return s?.r121ContactReceipts>=1&&s?.spellContactFX?.spawned>=1;
  },null,{timeout:18000});
  const after=await page.evaluate(()=>{
   const s=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return {hp:window.__r45QA.hp,events:window.__r45QA.events.filter(e=>e.type==='card_play'&&e.card==='K01'),
    sfx:s.spellContactFX,receipts:s.r121ContactReceipts,hostHits:s.hostHits,
    audio:window.__r45QA.audio};
  });
  check(after.hp.ai===19,view+' canonical engine dealt exactly one damage',after.hp);
  check(after.hostHits.ai?.element==='absurd'&&after.hostHits.ai.damage===1,
   view+' opponent real VRM receives exact element and damage reaction',after.hostHits);
  check(after.sfx.spawned>=1&&after.sfx.ruleMutations===0,
   view+' target anchored 3D contact does not modify rules',after.sfx);
  check(after.events.at(-1)?.spellOutcome?.directDamage===1,
   view+' canonical event confirms actual target hit',after.events.at(-1));
  await page.waitForFunction(()=>{
   const a=window.__r45QA.audio;
   return a?.voiceVariantHistory?.some(x=>x.id==='HOST_AI'&&x.kind==='hurt');
  },null,{timeout:10000});
  check(errors.length===0,view+' no JS or HTTP errors',errors);
  await page.screenshot({path:resolve(evidence,view+'-elemental-hit.png')});
  await page.close();
 }
 results.passed=true;
}catch(e){results.errors.push(String(e))}
finally{
 writeFileSync(resolve(evidence,'r121-elemental-contact-report.json'),JSON.stringify(results,null,2));
 await browser.close();
}
console.log('R121_BROWSER_REAL_TARGET_REPORT',JSON.stringify({passed:results.passed,
 checks:results.checks.length,errors:results.errors}));
if(!results.passed)process.exitCode=1;
