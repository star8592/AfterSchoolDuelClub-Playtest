import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const {chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11172';
const out=resolve(import.meta.dirname,'evidence/r122');
mkdirSync(out,{recursive:true});
const results={passed:false,checks:[],errors:[]};
const check=(ok,name,value)=>{
 results.checks.push({passed:!!ok,name,value});
 if(!ok)throw Error(name+': '+JSON.stringify(value).slice(0,850));
};
const browser=await chromium.launch({headless:true,
 executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--autoplay-policy=no-user-gesture-required',
 '--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']
});
try{
 for(const [name,width] of [['desktop',1440],['portrait',430]]){
  const page=await browser.newPage({viewport:{width,height:900}});
  const errors=[];
  page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(origin))
   errors.push('HTTP '+r.status()+' '+r.url())});
  await page.goto(origin+'/r45-duel/?qa=1&deck=kitchen&seed=8&r122Crowd=force',{
   waitUntil:'domcontentloaded',timeout:65000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:180000});
  const before=await page.evaluate(()=>{
   const s=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return {crowd:s.stadiumAmbience?.audience,fx:s.spectatorChaosFX,
    hp:window.__r45QA.hp,events:s.r122AccidentReceipts};
  });
  check(before.crowd?.loaded===4,name+' 4 actual 3D audience model instances',before.crowd);
  check(before.fx?.launched===0&&before.events===0,name+' no fake accident on opening',before.fx);
  await page.locator('.card[data-card-id="K01"]:not([disabled])').first().click();
  await page.locator('#play').click();
  await page.waitForFunction(()=>{
   const s=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return s.r122AccidentReceipts>=1&&s.spectatorChaosFX?.impacts>=1;
  },null,{timeout:16000});
  const after=await page.evaluate(()=>{
   const s=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return {hp:window.__r45QA.hp,spell:window.__r45QA.events.filter(
    e=>e.type==='card_play'&&e.card==='K01').at(-1),
    crowd:s.stadiumAmbience?.audience,fx:s.spectatorChaosFX,
    receipts:s.r122AccidentReceipts,audio:window.__r45QA.audio};
  });
  check(after.hp.ai===19&&after.spell?.spellOutcome?.directDamage===1,
   name+' canonical HP unchanged by bleacher slapstick',after.hp);
  check(after.crowd?.accidentEvents>=1&&after.crowd.active?.type==='accident',
   name+' actual spectator rig reacted to overshoot',after.crowd);
  check(after.fx?.launched>=1&&after.fx.impacts>=1&&after.fx.ruleMutations===0,
   name+' real 3D projectile hit bleacher anchor without rule mutations',after.fx);
  check(after.receipts>=1,name+' receipt emitted on spectator impact frame',after.receipts);
  check(errors.length===0,name+' no JS or HTTP errors',errors);
  await page.screenshot({path:resolve(out,name+'-real-spectator-misfire.png')});
  await page.close();
 }
 results.passed=true;
}catch(e){results.errors.push(String(e))}
finally{
 writeFileSync(resolve(out,'r122-spectator-chaos-report.json'),JSON.stringify(results,null,2));
 await browser.close();
}
console.log('R122_REAL_SPECTATOR_BROWSER',JSON.stringify({
 passed:results.passed,checks:results.checks.length,errors:results.errors}));
if(!results.passed)process.exitCode=1;
