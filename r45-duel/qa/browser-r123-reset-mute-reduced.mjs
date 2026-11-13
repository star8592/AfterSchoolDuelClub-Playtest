/**
 * R123 real Chrome regression: reused stadium chapter RESET and explicit
 * user mute / prefers-reduced-motion. No synthetic HP changes.
 */
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const {chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11173';
const out=resolve(import.meta.dirname,'evidence/r123');mkdirSync(out,{recursive:true});
const result={passed:false,checks:[],errors:[]};
const check=(ok,label,value)=>{
 result.checks.push({passed:!!ok,label,value});
 if(!ok)throw Error(label+' '+JSON.stringify(value).slice(0,800));
};
const browser=await chromium.launch({headless:true,
 executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--autoplay-policy=no-user-gesture-required',
 '--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 // Real legal spell, then same chapter-change message used in the actual
 // guided tutorial. The iframe stays mounted: no refresh allowed.
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/r45-duel/?qa=1&seed=8&deck=kitchen&r122Crowd=force',
  {waitUntil:'domcontentloaded',timeout:65000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:160000});
 await page.locator('.card[data-card-id="K01"]:not([disabled])').first().click();
 await page.locator('#play').click();
 await page.waitForFunction(()=>{
  const a=document.querySelector('#stadium').contentWindow.__r45SceneQA;
  return a.r122AccidentReceipts>=1&&a.bleacherProps?.active>=1;
 },null,{timeout:15000});
 const before=await page.evaluate(()=>{
  const a=document.querySelector('#stadium').contentWindow.__r45SceneQA;
  return {props:a.bleacherProps,fx:a.spectatorChaosFX,
   serials:a.registeredSpellSerials,camera:a.r123Camera,
   hp:window.__r45QA.hp};
 });
 check(before.props.active===1&&before.serials===1,
  'real rule-cast still in flight before tutorial chapter reset',before);
 await page.evaluate(()=>document.querySelector('#stadium').contentWindow.postMessage(
  {type:'ASDC_R100_COMBO_RESET'},location.origin));
 await page.waitForFunction(()=>{
  const a=document.querySelector('#stadium').contentWindow.__r45SceneQA;
  return a.bleacherProps?.active===0&&a.spectatorChaosFX?.active===0&&
   a.registeredSpellSerials===0&&a.pendingCrowdAccidents===0&&
   a.pendingSpellContacts===0&&!a.stadiumAmbience?.audience?.active;
 },null,{timeout:6000});
 const after=await page.evaluate(()=>{
  const a=document.querySelector('#stadium').contentWindow.__r45SceneQA;
  return{props:a.bleacherProps,fx:a.spectatorChaosFX,serials:a.registeredSpellSerials,
   camera:a.r123Camera,hp:window.__r45QA.hp,crowd:a.stadiumAmbience?.audience};
 });
 check(after.props.active===0&&after.fx.active===0&&after.serials===0,
  'fresh chapter clears all prop and projectile effects and serials',after);
 check(after.camera.weight===0&&after.camera.spectatorIndex===null,
  'no spectator closeup inherited into subsequent lesson',after.camera);
 check(after.crowd.active===null,'audience returns to idle before next lesson',after.crowd);
 check(after.hp.ai===19,'presentation reset never damages or heals a player',after.hp);
 check(errors.length===0,'reset has no JS errors',errors);
 await page.close();
 // User-muted audio + reduced-motion is one independent real startup.
 const muted=await browser.newPage({viewport:{width:430,height:900}});
 const fail=[];muted.on('pageerror',e=>fail.push(e.message));
 muted.on('response',r=>{if(r.status()>=400&&r.url().startsWith(origin))
  fail.push(r.status()+' '+r.url())});
 await muted.addInitScript(()=>localStorage.setItem('asdc_r83_sound_on','off'));
 await muted.emulateMedia({reducedMotion:'reduce'});
 await muted.goto(origin+'/r45-duel/?qa=1&seed=8&deck=kitchen&r122Crowd=force',
  {waitUntil:'domcontentloaded',timeout:65000});
 await muted.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:180000});
 const silent=await muted.evaluate(()=>window.__r45QA.audio);
 check(silent.requested===false&&silent.enabled===false,
  'explicit saved mute wins over default-on sound',silent);
 await muted.locator('.card[data-card-id="K01"]:not([disabled])').first().click();
 await muted.locator('#play').click();
 await muted.waitForFunction(()=>{
  const a=document.querySelector('#stadium').contentWindow.__r45SceneQA;
  return a.r122AccidentReceipts>=1&&a.bleacherProps?.returns>=1;
 },null,{timeout:17000});
 const last=await muted.evaluate(()=>{
  const a=document.querySelector('#stadium').contentWindow.__r45SceneQA;
  return{audio:window.__r45QA.audio,props:a.bleacherProps,
   camera:a.r123Camera,hp:window.__r45QA.hp};
 });
 check(last.props.mounted===4&&last.props.returns>=1,
  'reduced-motion retains real props and clean recovery',last.props);
 check(last.camera.weight===0,
  'reduced-motion omits uncomfortable cinematic audience zoom',last.camera);
 check(last.audio.crowdVoicePlays===0&&last.audio.propPAPlays===0,
  'user mute suppresses spectator voice AND announcer while keeping visual story',last.audio);
 check(last.hp.ai===19,'muted reduced-motion scene does not change canonical HP',last.hp);
 check(fail.length===0,'reduced/muted run has no JS or HTTP errors',fail);
 await muted.close();
 result.passed=true;
}catch(e){result.errors.push(String(e))}
finally{
 writeFileSync(resolve(out,'r123-reset-mute-reduced-report.json'),JSON.stringify(result,null,2));
 await browser.close();
}
console.log('R123_RESET_MUTE_REDUCED_BROWSER',JSON.stringify({
 passed:result.passed,checks:result.checks.length,errors:result.errors}));
if(!result.passed)process.exitCode=1;
