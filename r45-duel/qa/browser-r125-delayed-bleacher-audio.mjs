/** R125: deliberately delay the real Qwen manifest beyond first playable cast. */
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const {chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11285';
const dir=resolve(import.meta.dirname,'evidence/r125');
mkdirSync(dir,{recursive:true});
const report={passed:false,checks:[],errors:[]};
const check=(pass,label,data)=>{
 report.checks.push({pass:!!pass,label,data});
 if(!pass)throw Error(label+' '+JSON.stringify(data).slice(0,700));
};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--autoplay-policy=no-user-gesture-required','--enable-webgl',
 '--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const [name,width,mute] of [['delayed-first-cast',1440,false],['muted-before-ready',430,true]]){
  const page=await browser.newPage({viewport:{width,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)
   errors.push('HTTP '+r.status()+' '+r.url());});
  let manifestRequests=0;
  await page.route('**/assets/audio/crowd/r123-prop-pa-manifest.json',
   async route=>{manifestRequests++;await new Promise(r=>setTimeout(r,8500));await route.continue();});
  await page.goto(origin+'/r45-duel/?qa=1&seed=8&deck=kitchen&r122Crowd=force',
   {waitUntil:'domcontentloaded',timeout:65000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:180000});
  const before=await page.evaluate(()=>window.__r45QA.audio);
  check(before.assetsReady===false,name+' Qwen PA manifest genuinely delayed after visible 3D game scene',
   {ready:before.assetsReady,manifestRequests});
  await page.locator('.card[data-card-id="K01"]:not([disabled])').first().click();
  await page.locator('#play').click();
  await page.waitForFunction(()=>{
   const s=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return s.r122AccidentReceipts>=1;
  },null,{timeout:16000});
  const inFlight=await page.evaluate(()=>window.__r45QA.audio);
  check(inFlight.bleacherDeferred===true,name+' exact on-hit voice preserved while manifest is still loading',
   {deferred:inFlight.bleacherDeferred,ready:inFlight.assetsReady});
  if(mute){
   await page.locator('#audio-toggle').click();
   const silent=await page.evaluate(()=>window.__r45QA.audio);
   check(silent.requested===false&&!silent.bleacherDeferred,
    name+' explicit mute clears delayed student and announcer events',silent);
   await page.waitForTimeout(10500);
   const after=await page.evaluate(()=>window.__r45QA.audio);
   check(after.propPAPlays===0&&after.crowdVoicePlays===0,
    name+' no stale audible clips after manifest resolves under user mute',after);
  }else{
   await page.waitForFunction(()=>{
    const s=window.__r45QA.audio;
    return s.crowdVoicePlays>=1&&s.propPAPlays>=1&&
     s.speechHistory.some(x=>x.id==='STADIUM_PA'&&x.kind.startsWith('prop_'));
   },null,{timeout:32000});
   const after=await page.evaluate(()=>window.__r45QA.audio);
   check(after.crowdVoicePlays>=1&&after.propPAPlays>=1,
    name+' both original Qwen spectator and announcer actually played after delayed load',after);
   check(after.speechHistory.some(x=>x.kind==='accident')&&
    after.speechHistory.some(x=>x.kind.startsWith('prop_')),
    name+' truthful separate spoken lines after real audio playback',after.speechHistory.slice(-5));
   const spectatorAt=after.speechHistory.findIndex(x=>x.kind==='accident');
   const announcementAt=after.speechHistory.findIndex(x=>x.kind.startsWith('prop_'));
   check(spectatorAt>=0&&announcementAt>spectatorAt,
    name+' original student yelp begins before noninterrupting PA voice',
    after.speechHistory.slice(-6));
  }
  check(manifestRequests===1,name+' exactly one delayed manifest request',manifestRequests);
  check(errors.length===0,name+' no errors despite delayed public-like startup',errors);
  await page.close();
 }
 report.passed=true;
}catch(e){report.errors.push(String(e));}
finally{
 writeFileSync(resolve(dir,'r125-delayed-crowd-audio-report.json'),JSON.stringify(report,null,2));
 await browser.close();
}
console.log('R125_DELAYED_BLEACHER_AUDIO',JSON.stringify({
 passed:report.passed,checks:report.checks.length,errors:report.errors
}));
if(!report.passed)process.exitCode=1;
