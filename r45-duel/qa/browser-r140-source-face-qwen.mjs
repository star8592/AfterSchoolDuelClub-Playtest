import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11446';
const out=resolve(import.meta.dirname,'evidence/r140/source-faces');
mkdirSync(out,{recursive:true});
const result={passed:false,checks:[],views:[],errors:[],origin};
const check=(ok,label,extra)=>{result.checks.push({pass:!!ok,label});
 if(!ok)throw Error(label+' '+JSON.stringify(extra).slice(0,850))};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--autoplay-policy=no-user-gesture-required',
 '--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const[view,width]of[['desktop',1440],['portrait',430]]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)
   errors.push('HTTP '+r.status()+' '+r.url().slice(-70))});
  await page.goto(origin+'/r45-duel/?qa=1&seed=136&r136Cast=on',
   {waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:225000});
  const get=id=>page.evaluate(who=>{
   const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   const a=q.summonPresence.entries.find(x=>x.id===who);
   return a&&{id:who,face:a.r140OriginalFace,
    source:a.r136CastStage,feet:a.r136OriginalFoot,
    front:a.metrics.frontDot,screen:a.metrics.coverageWidth};
  },id);
  const snap={};
  for(const id of ['E04','G02','G04','T03']){
   const units={player:[{uid:'U14001',id,hp:6,attack:3,shield:0}],
    ai:[{uid:'U14002',id:'M02',hp:6,attack:3,shield:0}]};
   await page.evaluate(u=>document.querySelector('#stadium').contentWindow
    .postMessage({type:'ASDC_R45_BOARD',units:u,player:[u.player[0].id],ai:['M02']},
    location.origin),units);
   await page.waitForFunction(who=>document.querySelector('#stadium').contentWindow
    .__r45SceneQA.summonPresence.entries.some(x=>x.id===who),id,{timeout:35000});
   const poses={};
   for(const kind of ['idle','attack','hit','celebrate']){
    check(await page.evaluate(([who,k])=>document.querySelector('#stadium')
     .contentWindow.__r45SceneQA.studyAction(who,k),[id,kind]),
     view+' '+id+' '+kind+' original performance triggered');
    await page.waitForTimeout(kind==='idle'?390:440);
    const pose=await get(id);poses[kind]=pose;
    check(pose?.face?.enabled&&pose.face.managedTargetCount>=2&&
     pose.face.sourceFrames>2&&pose.source?.enabled&&pose.front>.9,
     view+' '+id+' '+kind+' REAL morph target animation and facing',pose);
    check(pose.feet?.maxAfter<=.004,
     view+' '+id+' '+kind+' original outsole remains non-penetrating',pose.feet);
    check(pose.face.state===kind[0].toUpperCase()+kind.slice(1),
     view+' '+id+' '+kind+' source action synchronizes source facial state',pose.face);
    if(kind!=='idle')
     check(pose.face.active.length>=2||pose.face.maxJawAngle>.025,
      view+' '+id+' '+kind+' actual author facial expression is non-neutral',pose.face);
    if(kind==='hit'||kind==='celebrate')
     await page.screenshot({path:resolve(out,view+'-'+id+'-'+kind+'.png')});
    await page.waitForTimeout(190);
   }
   check(poses.idle.face.activeSpeechSerial===null&&
    poses.idle.face.speakingFrames===0,
    view+' '+id+' cannot fake talking before any real audio',poses.idle.face);
   snap[id]=poses;
  }
  // The actual recorded Qwen3 line starts through the existing live
  // audio API, not a fabricated child-iframe VOICE_START postMessage.
  await page.waitForFunction(()=>window.__r45QA.audio.assetsReady===true,
   null,{timeout:30000});
  const units={player:[{uid:'U14061',id:'G02',hp:6,attack:3,shield:0}],
   ai:[{uid:'U14062',id:'M02',hp:6,attack:3,shield:0}]};
  await page.evaluate(u=>document.querySelector('#stadium').contentWindow
   .postMessage({type:'ASDC_R45_BOARD',units:u,player:['G02'],ai:['M02']},
   location.origin),units);
  await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow
   .__r45SceneQA.summonPresence.entries.some(x=>x.id==='G02'),null,{timeout:30000});
  const before=await page.evaluate(()=>document.querySelector('#stadium')
   .contentWindow.__r45SceneQA.realVoiceActing.sourceStarted);
  const accepted=await page.evaluate(()=>window.__r45QA.audioVoiceSample('G02','attack'));
  check(accepted===true,view+' real recorded G02 attack is queued',accepted);
  await page.waitForFunction(prior=>document.querySelector('#stadium')
   .contentWindow.__r45SceneQA.realVoiceActing.sourceStarted>prior,before,
   {timeout:18000});
  const samples=[];
  for(let i=0;i<16;i++){await page.waitForTimeout(66);samples.push(await get('G02'))}
  check(samples.some(x=>x.face.speakingFrames>0&&x.face.mouth>.10),
   view+' source jaw morph follows ACTUAL audio playback',samples.map(x=>x.face.mouth));
  const current=await page.evaluate(()=>document.querySelector('#stadium')
   .contentWindow.__r45SceneQA.realVoiceActing);
  check(current.sourceStarted>before,view+' actual voice playback source serial recorded',current);
  // Silent subtitles or muted audio may not drive any mouth morphs.
  await page.locator('#audio-toggle').click();
  await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow
    .__r45SceneQA.realVoiceActing.sourceStopped>0,null,{timeout:4500});
  await page.waitForTimeout(160);
  const stop=await get('G02');
  check(stop.face.activeSpeechSerial===null&&stop.face.mouth===0,
   view+' original face stops speaking immediately on real mute',stop.face);
  check(errors.length===0,view+' no JS or source audio asset errors',errors);
  result.views.push({view,actors:Object.fromEntries(Object.entries(snap).map(
   ([id,poses])=>[id,{states:Object.fromEntries(Object.entries(poses).map(
    ([k,v])=>[k,{state:v.face.state,targets:v.face.active,
     maxMorph:v.face.maxMorph,jawAngle:v.face.maxJawAngle,screen:v.screen}])),
    realSource:true}])),sourceVoice:{started:current.sourceStarted,
    maxMouth:Math.max(...samples.map(x=>x.face.mouth)),
    stopped:true}});
  await page.close();
 }
 result.passed=true;
}catch(e){result.errors.push(String(e))}
finally{writeFileSync(resolve(out,'r140-real-source-face.json'),
 JSON.stringify(result,null,2));await browser.close()}
console.log('R140_REAL_SOURCE_FACE_QWEN',
 JSON.stringify({passed:result.passed,checks:result.checks.length,
  errors:result.errors,views:result.views.map(v=>({
   view:v.view,ids:Object.keys(v.actors),sourceVoice:v.sourceVoice}))}));
if(!result.passed)process.exitCode=1;
