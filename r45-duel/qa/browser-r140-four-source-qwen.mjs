import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11446';
const out=resolve(import.meta.dirname,'evidence/r140/source-faces');
mkdirSync(out,{recursive:true});
const report={passed:false,checks:[],voices:[],errors:[],origin};
const check=(ok,label,x)=>{report.checks.push({pass:!!ok,label});if(!ok)throw Error(label+' '+JSON.stringify(x).slice(0,850))};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--autoplay-policy=no-user-gesture-required',
 '--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const [view,width] of [['desktop',1440],['portrait',430]]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
  await page.goto(origin+'/r45-duel/?qa=1&seed=136&r136Cast=on',
   {waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:225000});
  await page.waitForFunction(()=>window.__r45QA.audio.assetsReady===true,null,{timeout:30000});
  const read=id=>page.evaluate(actor=>{
   const stage=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return{voice:stage.realVoiceActing,
    face:stage.summonPresence.entries.find(x=>x.id===actor)?.r140OriginalFace,
    audio:window.__r45QA.audio};
  },id);
  const voices={};
  for(const id of ['E04','G02','G04','T03']){
   const u={player:[{uid:'U14091',id,hp:6,attack:3,shield:0}],
    ai:[{uid:'U14092',id:'M02',hp:6,attack:3,shield:0}]};
   await page.evaluate(units=>document.querySelector('#stadium').contentWindow
     .postMessage({type:'ASDC_R45_BOARD',units,
      player:[units.player[0].id],ai:['M02']},location.origin),u);
   await page.waitForFunction(actor=>document.querySelector('#stadium')
    .contentWindow.__r45SceneQA.summonPresence.entries.some(x=>x.id===actor),
    id,{timeout:25000});
   const initial=await read(id);
   check(initial.face?.enabled&&initial.face?.activeSpeechSerial===null,
    view+' '+id+' source face is silent before real recording',initial.face);
   const started=initial.voice.sourceStarted,stopped=initial.voice.sourceStopped;
   const accepted=await page.evaluate(who=>window.__r45QA.audioVoiceSample(who,'attack'),id);
   check(accepted,view+' '+id+' real prerecorded Qwen line requested',accepted);
   await page.waitForFunction(prior=>document.querySelector('#stadium')
    .contentWindow.__r45SceneQA.realVoiceActing.sourceStarted>prior,started,
    {timeout:18000});
   const samples=[];
   for(let i=0;i<13;i++){await page.waitForTimeout(68);samples.push(await read(id))}
   const maxMouth=Math.max(...samples.map(x=>x.face?.mouth||0));
   check(maxMouth>.09&&samples.some(x=>x.face?.activeSpeechSerial),
    view+' '+id+' original weighted jaw/morph moves ONLY with live recording',
    {maxMouth,source:samples.at(-1)?.face});
   check(samples.some(x=>x.face?.speakingFrames>0),
    view+' '+id+' real audio opens original mouth repeatedly',samples.at(-1)?.face);
   await page.locator('#audio-toggle').click();
   await page.waitForFunction(prior=>document.querySelector('#stadium')
     .contentWindow.__r45SceneQA.realVoiceActing.sourceStopped>prior,stopped,
     {timeout:5000});
   await page.waitForTimeout(180);
   const end=await read(id);
   check(end.face?.activeSpeechSerial===null&&end.face?.mouth===0,
    view+' '+id+' mute immediately closes original mouth',end.face);
   check(!end.audio.requested,view+' '+id+' actual source mute was applied',end.audio);
   await page.locator('#audio-toggle').click();
   await page.waitForFunction(()=>window.__r45QA.audio.enabled===true,
    null,{timeout:10000});
   voices[id]={maxMouth,serialStopped:end.voice.sourceStopped};
  }
  check(errors.length===0,view+' no asset/JS failures',errors);
  report.voices.push({view,voices});
  await page.close();
 }
 report.passed=true;
}catch(e){report.errors.push(String(e))}
finally{writeFileSync(resolve(out,'r140-all-four-actual-qwen.json'),
 JSON.stringify(report,null,2));await browser.close()}
console.log('R140_FOUR_REAL_SOURCE_QWEN',JSON.stringify({
 passed:report.passed,checks:report.checks.length,errors:report.errors,
 views:report.voices}));
if(!report.passed)process.exitCode=1;
