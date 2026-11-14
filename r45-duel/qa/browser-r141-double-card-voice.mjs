import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11447';
const dir=resolve(import.meta.dirname,'evidence/r141/seven-source-faces');
mkdirSync(dir,{recursive:true});
const report={passed:false,origin,checks:[],errors:[],views:[]};
const check=(ok,label,data)=>{report.checks.push({pass:!!ok,label});
 if(!ok)throw Error(label+' '+JSON.stringify(data).slice(0,1000))};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--autoplay-policy=no-user-gesture-required',
 '--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const[view,width]of[['desktop',1440],['portrait',430]]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[],actors={};
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)errors.push('HTTP '+r.status())});
  await page.goto(origin+'/r45-duel/?qa=1&seed=141&r134Jay=on&r135Pair=on',
   {waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:225000});
  await page.waitForFunction(()=>window.__r45QA.audio.assetsReady===true,null,{timeout:30000});
  const state=id=>page.evaluate(who=>{
   const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return{started:q.realVoiceActing.sourceStarted,
    stopped:q.realVoiceActing.sourceStopped,
    copies:q.summonPresence.entries.filter(x=>x.id===who).map(x=>({
     uid:x.uid,side:x.side,face:x.r140OriginalFace,
     source:x.r135PairStage||x.r134JayStage
    }))};
  },id);
  for(const id of ['E03','G03','T04']){
   const units={player:[{uid:'U14181',id,hp:7,attack:4,shield:0}],
    ai:[{uid:'U14182',id,hp:7,attack:4,shield:0}]};
   await page.evaluate(u=>document.querySelector('#stadium').contentWindow
    .postMessage({type:'ASDC_R45_BOARD',units:u,player:[u.player[0].id],
     ai:[u.ai[0].id]},location.origin),units);
   await page.waitForFunction(who=>document.querySelector('#stadium').contentWindow
    .__r45SceneQA.summonPresence.entries.filter(x=>x.id===who).length===2,
    id,{timeout:35000});
   let before=await state(id);
   check(before.copies.length===2&&before.copies.every(x=>x.face?.enabled&&
     x.face.activeSpeechSerial===null),view+' '+id+' independent source faces before Qwen',
     before.copies);
   check(before.copies.every(x=>x.source?.enabled===true),
    view+' '+id+' both camps preserve original source skeleton',before.copies);
   const queued=await page.evaluate(who=>window.__r45QA.audioVoiceSample(who,'attack'),id);
   check(queued===true,view+' '+id+' actual recorded Qwen clip requested',queued);
   await page.waitForFunction(([who,prior])=>{
    const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
    return q.realVoiceActing.sourceStarted>prior&&q.summonPresence.entries
     .filter(x=>x.id===who).some(x=>x.r140OriginalFace?.activeSpeechSerial);
   },[id,before.started],{timeout:18000});
   let live=await state(id);
   check(live.copies.filter(x=>x.face.activeSpeechSerial!==null).length===1,
    view+' '+id+' ONE source face speaks when two camps have same card',live.copies);
   await page.locator('#audio-toggle').click();
   await page.waitForFunction(([who,prior])=>{
    const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
    return q.realVoiceActing.sourceStopped>prior&&q.summonPresence.entries
     .filter(x=>x.id===who).every(x=>x.r140OriginalFace.activeSpeechSerial===null);
   },[id,before.stopped],{timeout:5500});
   let after=await state(id);
   check(after.copies.every(x=>x.face.mouth===0&&
     x.face.activeSpeechSerial===null),
    view+' '+id+' both original mouths are silent after real mute',after.copies);
   await page.locator('#audio-toggle').click();
   await page.waitForFunction(()=>window.__r45QA.audio.enabled===true,
    null,{timeout:12000});
   actors[id]={voiceStarted:live.started,stopCount:after.stopped,
    independentSourceSkins:2,concurrentSpeakers:1};
  }
  check(errors.length===0,view+' no actual webgl/voice HTTP failures',errors);
  report.views.push({view,actors});
  await page.close();
 }
 report.passed=true;
}catch(e){report.errors.push(String(e))}
finally{writeFileSync(resolve(dir,'r141-double-card-voice-isolation.json'),
 JSON.stringify(report,null,2));await browser.close()}
console.log('R141_DUPLICATE_ORIGINAL_VOICES',JSON.stringify({
 passed:report.passed,checks:report.checks.length,errors:report.errors,
 views:report.views}));
if(!report.passed)process.exitCode=1;
