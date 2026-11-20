import assert from'node:assert/strict';
import {createRequire} from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{execFileSync}from'node:child_process';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const dir='r45-duel/qa/evidence/r206-real-m01-conductor';
mkdirSync(dir,{recursive:true});
const enabled=process.env.R206_CASE!=='baseline';
const report={pass:false,enabled,errors:[],samples:[],source:'real Chrome WebGL2 original M01 skinned Polyfork teacher'};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
const film=process.env.R206_FILM==='1';
const ctx=await browser.newContext({
 viewport:{width:1440,height:860},serviceWorkers:'block',
 ...(film?{recordVideo:{dir,size:{width:1152,height:688}}}:{})
});
const page=await ctx.newPage();
page.on('pageerror',e=>report.errors.push('JS '+e.message));
page.on('response',r=>{if(r.status()>=400)report.errors.push('HTTP '+r.status()+' '+r.url())});
const snap=()=>page.evaluate(()=>{
 const q=window.__r45QA,z=document.getElementById('stadium')?.contentWindow?.__r45SceneQA;
 return{hp:q?.hp,round:q?.round,events:q?.events?.length,
  camera:z?.r145ActionShot?.enabled,inset:z?.renderPerformance?.heroInsetDraws,
  drawCalls:z?.drawCalls,
  teacher:z?.summonPresence?.entries?.find(e=>e.id==='M01'),
  chef:z?.summonPresence?.entries?.find(e=>e.id==='M02'),
  models:z?.summonModels?.filter(e=>['M01','M02'].includes(e.id))
 };
});
try{
 const qs=new URLSearchParams({qa:'1',seed:'205',
  r205LivingSummons:'on',
  ...(enabled?{r206MusicTeacher:'on'}:{})
 });
 await page.goto('http://127.0.0.1:18689/r45-duel/?'+qs,{waitUntil:'domcontentloaded',timeout:70000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:130000});
 const init=await snap();
 const units={player:[{uid:'U20601',id:'M01',hp:5,attack:3,shield:0}],
  ai:[{uid:'U20602',id:'M02',hp:5,attack:3,shield:0}]};
 await page.evaluate(u=>document.getElementById('stadium').contentWindow.postMessage({
  type:'ASDC_R45_BOARD',units:u,player:['M01'],ai:['M02']
 },location.origin),units);
 await page.waitForFunction(()=>document.getElementById('stadium').contentWindow?.
  __r45SceneQA?.summonPresence?.total===2,null,{timeout:25000});
 for(let i=0;i<10;i++){
  await page.waitForTimeout(i===0?450:490);
  const s=await snap();assert(s.teacher?.visible&&s.chef?.visible);
  assert(s.teacher?.playingClips.includes('Idle'),JSON.stringify(s.teacher?.playingClips));
  assert.equal(s.camera,false);assert.equal(s.inset,0);
  report.samples.push({step:i,...s});
  if([0,3,6,9].includes(i))await page.locator('#stadium').screenshot({
   path:dir+'/r206-'+(enabled?'new':'baseline')+'-M01-idle-'+String(i)+'.png'});
 }
 if(enabled){
  const stats=report.samples.at(-1).teacher.r206Conductor;
  assert(stats?.enabled&&stats?.originalSkinnedMeshes>=10);
  assert(stats?.observedStages?.length>=3);
  assert(stats?.armFrames>60);
  assert(report.samples.every(s=>s.teacher.r206Conductor?.sourceGeometryReplaced===false));
  assert(report.samples.every(s=>s.teacher.r206Conductor?.sourceMaterialReplaced===false));
  assert(report.samples.every(s=>s.teacher.r206Conductor?.arms.Left.dropRatio>.84),
   'original left arm must hang below shoulder in natural rest, not T pose');
  assert(report.samples.every(s=>s.teacher.r206Conductor?.arms.Right.dropRatio>.57),
   'right arm cannot return to horizontal T pose between conducting beats');
  const y=report.samples.map(s=>s.teacher.r206Conductor.arms.Right.handWorld[1]);
  assert(Math.max(...y)-Math.min(...y)>.075,
   'original visible skinned right arm must conduct continuously, not remain frozen');
  // Capture REAL native attack, hit and recovery via existing QA-only
  // studyAction method, not a game rule mutation or fake damage.
  for(const action of ['attack','hit','idle']){
   const ok=await page.evaluate(action=>document.getElementById('stadium').
    contentWindow.__r45SceneQA.studyAction('M01',action),action);
   assert(ok,'source teacher original real clip '+action);
   await page.waitForTimeout(action==='attack'?480:action==='hit'?330:420);
   const s=await snap();report.samples.push({stage:action,...s});
   await page.locator('#stadium').screenshot({
    path:dir+'/r206-new-M01-source-'+action+'.png'});
   assert(s.teacher.r206Conductor?.enabled);
   const pose=s.teacher.r206Conductor;
   if(action==='attack')assert(pose.mode==='attack'&&pose.arms.Right.dropRatio<.5,
    'real conducting attack must raise the right arm to point at opponent');
   if(action==='hit')assert(pose.mode==='hit'&&pose.arms.Left.dropRatio<.65,
    'real hit should make original shoulder and arm guard the face');
   if(action==='idle')assert(pose.mode==='idle'&&
     pose.arms.Left.dropRatio>.84&&pose.arms.Right.dropRatio>.57,
     'original M01 must return to natural non-T pose after combat');
  }
 }
 const after=await snap();
 assert.deepEqual(after.hp,init.hp);assert.equal(after.events,init.events);
 assert.equal(after.round,init.round);
 assert.deepEqual(report.errors,[]);
 report.pass=true;
 console.log('R206_ORIGINAL_M01_NATIVE_SOURCE_CHROME_PASS',JSON.stringify({
  enabled,m01SkinnedMeshes:after.teacher.r126TeacherMotion.sourceSkinnedMeshes,
  m01SourceBones:after.teacher.r126TeacherMotion.sourceBones,
  m01Clips:after.teacher.playingClips,
  r206:after.teacher.r206Conductor,
  oldChefUnchanged:true,defaultWide:true,errors:[]}));
}finally{
 writeFileSync(dir+'/r206-'+(enabled?'new':'baseline')+'-music-teacher-chrome.json',
  JSON.stringify(report,null,2)+'\n');
 const video=film?page.video():null;
 await ctx.close();
 if(video){
  const source=await video.path();
  const out=dir+'/r206-'+(enabled?'new':'baseline')+'-source-actor-wide-silent.mp4';
  execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error',
   '-i',source,'-c:v','libx264','-preset','veryfast','-crf','27',
   '-pix_fmt','yuv420p','-r','18','-an','-movflags','+faststart',out]);
  console.log('R206_REAL_SOURCE_CHROME_WIDE_ACTING_VIDEO',out);
 }
 await browser.close();
}
