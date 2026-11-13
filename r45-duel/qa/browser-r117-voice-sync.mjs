import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11123';
const dir=resolve(import.meta.dirname,'evidence/r117-voice');mkdirSync(dir,{recursive:true});
const report={passed:false,checks:[],errors:[]};
const check=(v,name,data)=>{report.checks.push({passed:!!v,name,data});if(!v)throw Error(name+': '+JSON.stringify(data).slice(0,650))};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--autoplay-policy=no-user-gesture-required',
 '--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const[view,width]of[['desktop',1440],['portrait',430]]){
  const page=await browser.newPage({viewport:{width,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(origin))errors.push('HTTP '+r.status())});
  await page.goto(origin+'/r45-duel/?qa=1&seed=8&deck=kitchen',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:175000});
  await page.waitForFunction(()=>window.__r45QA.audio.assetsReady===true,null,{timeout:12000});
  const before=await page.evaluate(()=>window.__r45QA.audio);
  check(before.voiceClipCount===16&&before.paClipCount===9,
   view+' original true 98 character voices + 9 PA recordings intact',before);
  await page.locator('.card[data-card-id="K01"]:not([disabled])').first().click();
  await page.locator('#play').click();
  await page.waitForTimeout(175);
  const immediate=await page.evaluate(()=>window.__r45QA.audio);
  const hasCast=history=>history.some(x=>x.id==='HOST_PLAYER'&&x.kind==='cast');
  check(!hasCast(immediate.voiceVariantHistory.slice(before.voiceVariantHistory.length)),
   view+' host does not speak prematurely before draw/show animation',immediate.voiceVariantHistory);
  await page.waitForFunction(start=>window.__r45QA.audio.voiceVariantHistory.slice(start)
    .some(x=>x.id==='HOST_PLAYER'&&x.kind==='cast'),
    before.voiceVariantHistory.length,{timeout:14000});
  await page.waitForFunction(()=>window.__r45QA.audio.speechHistory.some(x=>
   x.id==='HOST_PLAYER'&&x.kind==='cast'),null,{timeout:11000});
  const after=await page.evaluate(()=>({audio:window.__r45QA.audio,
   realPlay:window.__r45QA.events.filter(e=>e.type==='card_play'&&e.card==='K01').at(-1),
   ready:window.__r45QA.sceneReady}));
  check(after.ready&&after.realPlay?.spellOutcome?.effect==='stew',
   view+' genuine legal card play drives timed Qwen cast',after.realPlay);
  check(hasCast(after.audio.voiceVariantHistory),
   view+' actual host recorded Qwen voice triggered in motion window',after.audio.voiceVariantHistory);
  const playingVoice=after.audio.speechHistory.filter(x=>x.id==='HOST_PLAYER'&&x.kind==='cast');
  check(playingVoice.length>0,view+' a voice playback receipt, not fake text',playingVoice);
  await page.locator('#audio-toggle').click();
  check(!await page.evaluate(()=>window.__r45QA.audio.requested),
   view+' player mute respected after card action',null);
  check(errors.length===0,view+' no media decoder or HTTP errors',errors);
  await page.screenshot({path:resolve(dir,view+'-real-card-cast.png')});
  await page.close();
 }
 report.passed=true;
}catch(e){report.errors.push(String(e))}
finally{writeFileSync(resolve(dir,'r117-voice-sync-report.json'),JSON.stringify(report,null,2));await browser.close()}
console.log('R117_VOICE_SYNC_BROWSER',JSON.stringify({passed:report.passed,checks:report.checks.length,errors:report.errors}));
if(!report.passed)process.exitCode=1;
