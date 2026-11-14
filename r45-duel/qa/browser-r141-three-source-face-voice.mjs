import{createRequire}from'node:module';
import{writeFileSync,mkdirSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11447';
const dir=resolve(import.meta.dirname,'evidence/r141/seven-source-faces');
mkdirSync(dir,{recursive:true});
const report={passed:false,origin,checks:[],errors:[],views:[]};
const check=(ok,label,detail)=>{report.checks.push({pass:!!ok,label});
 if(!ok)throw Error(label+' '+JSON.stringify(detail).slice(0,1000))};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--autoplay-policy=no-user-gesture-required',
 '--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
const ids=['E03','G03','T04'];
try{
 for(const[view,width]of[['desktop',1440],['portrait',430]]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)
   errors.push('HTTP '+r.status()+' '+r.url())});
  await page.goto(origin+'/r45-duel/?qa=1&seed=141&r134Jay=on&r135Pair=on',
   {waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,
   {timeout:225000});
  await page.waitForFunction(()=>window.__r45QA.audio.assetsReady===true,null,
   {timeout:30000});
  const read=id=>page.evaluate(who=>{
   const stage=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   const actor=stage.summonPresence.entries.find(x=>x.id===who);
   return actor?{
    sourceFace:actor.r140OriginalFace,
    originalStage:actor.r135PairStage||actor.r134JayStage,
    body:actor.r129FullBody,arms:actor.r131Arms,
    front:actor.metrics.frontDot,screenWidth:actor.metrics.coverageWidth,
    voice:stage.realVoiceActing,audio:window.__r45QA.audio,
    board:window.__r45QA.board
   }:null;
  },id);
  const actors={};
  for(const id of ids){
   const units={player:[{uid:'U14101',id,hp:6,attack:3,shield:0}],
    ai:[{uid:'U14102',id:'M02',hp:6,attack:3,shield:0}]};
   await page.evaluate(u=>document.querySelector('#stadium').contentWindow
    .postMessage({type:'ASDC_R45_BOARD',units:u,player:[u.player[0].id],
      ai:['M02']},location.origin),units);
   await page.waitForFunction(who=>document.querySelector('#stadium')
     .contentWindow.__r45SceneQA.summonPresence.entries.some(x=>x.id===who),
     id,{timeout:35000});
   const poses={};
   for(const kind of ['idle','attack','hit','celebrate']){
    const played=await page.evaluate(([who,k])=>document.querySelector('#stadium')
     .contentWindow.__r45SceneQA.studyAction(who,k),[id,kind]);
    check(played===true,view+' '+id+' '+kind+' source clip started',played);
    await page.waitForTimeout(kind==='idle'?400:kind==='hit'?360:470);
    const v=await read(id);
    check(v?.sourceFace?.enabled===true&&v.sourceFace.managedTargetCount>=4&&
     v.sourceFace.sourceFrames>3&&v.sourceFace.jawBone!==null,
     view+' '+id+' '+kind+' genuine source skin and facial controller',v);
    check(v?.originalStage?.enabled===true&&v?.front>.9,
     view+' '+id+' '+kind+' original action and enemy-facing',v);
    check(v.sourceFace.state===kind[0].toUpperCase()+kind.slice(1),
     view+' '+id+' '+kind+' source morph synchronizes to active clip',v.sourceFace);
    if(kind!=='idle')check(v.sourceFace.active.length>=2&&
     v.sourceFace.maxJawAngle>.025,
     view+' '+id+' '+kind+' real iris morphs AND weighted jaw move',v.sourceFace);
    poses[kind]={face:v.sourceFace,front:v.front,screenWidth:v.screenWidth,
     source:v.originalStage.currentClip};
    if(kind==='hit'||kind==='celebrate')
     await page.screenshot({path:resolve(dir,view+'-'+id+'-'+kind+'.png')});
    await page.waitForTimeout(180);
   }
   check(poses.idle.face.speakingFrames===0&&
    poses.idle.face.activeSpeechSerial===null,
    view+' '+id+' before real Qwen sound no imaginary mouth',poses.idle.face);
   actors[id]={states:Object.fromEntries(Object.entries(poses).map(([k,v])=>[
    k,{faceState:v.face.state,source:v.source,
       eyeTargets:v.face.active.map(x=>({target:x.target,weight:x.weight})),
       jawAngle:v.face.maxJawAngle,screenWidth:v.screenWidth}]))};
  }
  const voices={};
  for(const id of ids){
   const units={player:[{uid:'U14171',id,hp:6,attack:3,shield:0}],
    ai:[{uid:'U14172',id:'M02',hp:6,attack:3,shield:0}]};
   await page.evaluate(u=>document.querySelector('#stadium').contentWindow
    .postMessage({type:'ASDC_R45_BOARD',units:u,player:[u.player[0].id],
     ai:['M02']},location.origin),units);
   await page.waitForFunction(who=>document.querySelector('#stadium')
    .contentWindow.__r45SceneQA.summonPresence.entries.some(x=>x.id===who),
    id,{timeout:30000});
   const first=await read(id);
   const prevStart=first.voice.sourceStarted,prevStop=first.voice.sourceStopped;
   const board=JSON.stringify(first.board);
   check(first.sourceFace.activeSpeechSerial===null&&first.sourceFace.mouth===0,
    view+' '+id+' silent original skin before recording',first.sourceFace);
   const played=await page.evaluate(who=>window.__r45QA.audioVoiceSample(who,'attack'),id);
   check(played===true,view+' '+id+' actual prerecorded Qwen attack requested',played);
   await page.waitForFunction(n=>document.querySelector('#stadium')
    .contentWindow.__r45SceneQA.realVoiceActing.sourceStarted>n,
    prevStart,{timeout:17000});
   const samples=[];
   for(let i=0;i<14;i++){await page.waitForTimeout(65);samples.push(await read(id))}
   const peak=Math.max(...samples.map(s=>s.sourceFace?.mouth||0));
   check(peak>.10&&samples.some(s=>s.sourceFace.activeSpeechSerial!==null),
    view+' '+id+' genuine recording drives original weighted jaw',peak);
   await page.locator('#audio-toggle').click();
   await page.waitForFunction(n=>document.querySelector('#stadium').contentWindow
    .__r45SceneQA.realVoiceActing.sourceStopped>n,prevStop,{timeout:5500});
   await page.waitForTimeout(160);
   const after=await read(id);
   check(after.sourceFace.mouth===0&&after.sourceFace.activeSpeechSerial===null,
    view+' '+id+' mute immediately stops original mouth',after.sourceFace);
   check(!after.audio.requested&&JSON.stringify(after.board)===board,
    view+' '+id+' no sound playback and no authoritative game mutations');
   await page.locator('#audio-toggle').click();
   await page.waitForFunction(()=>window.__r45QA.audio.enabled===true,
    null,{timeout:10000});
   voices[id]={maxMouth:peak,actualStopped:after.voice.sourceStopped};
  }
  check(errors.length===0,view+' no source asset / GPU JS errors',errors);
  report.views.push({view,actors,voices});
  await page.close();
 }
 report.passed=true;
}catch(e){report.errors.push(String(e))}
finally{writeFileSync(resolve(dir,'r141-real-three-source-face-voice.json'),
 JSON.stringify(report,null,2));await browser.close()}
console.log('R141_REAL_THREE_SOURCE_FACE_VOICE',JSON.stringify({
 passed:report.passed,checks:report.checks.length,errors:report.errors,
 views:report.views.map(v=>({view:v.view,ids:Object.keys(v.actors),
  voicePeaks:Object.fromEntries(Object.entries(v.voices).map(
  ([id,x])=>[id,x.maxMouth]))}))}));
if(!report.passed)process.exitCode=1;
